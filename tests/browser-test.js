// Cross-browser smoke test: Chrome + Edge, phone / tablet / desktop.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// Usage (from this folder):  npm install  then  npm test   (add --shots for screenshots)
// Browser paths are the Windows defaults; edit BROWSERS below if yours differ.
const SITE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const BROWSERS = {
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
};
const SIZES = [
  { name: 'phone-360', width: 360, height: 740, mobile: true },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'laptop-1024', width: 1024, height: 768, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];
const only = process.argv[2];
const shots = process.argv.includes('--shots');

(async () => {
  const results = [];
  for (const [bname, exe] of Object.entries(BROWSERS)) {
    if (only && only !== bname && only !== 'all') continue;
    const browser = await puppeteer.launch({ executablePath: exe, headless: true });
    for (const sz of SIZES) {
      const page = await browser.newPage();
      const errors = [], failed = [];
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
      page.on('requestfailed', r => { if (!r.url().startsWith('mailto')) failed.push(r.url() + ' ' + (r.failure() || {}).errorText); });
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.setViewport({ width: sz.width, height: sz.height, isMobile: sz.mobile, hasTouch: sz.mobile, deviceScaleFactor: 1 });
      await page.goto(SITE, { waitUntil: 'networkidle0' });
      // Force lazy images to load so we can check them
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
        await Promise.all([...document.images].filter(i => i.src).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      });
      const r = { browser: bname, size: sz.name, checks: {} };
      const c = r.checks;
      const st = await page.evaluate(() => {
        const de = document.documentElement;
        const wide = [...document.querySelectorAll('body *')].filter(el => {
          const b = el.getBoundingClientRect();
          if (!b.width) return false;
          // skip elements inside clipped containers / fixed hidden overlays
          if (el.closest('.hero__type,.detail,.lb,.msg,.sheet,.contours,.bot__panel,.bot__hint')) return false;
          // slides waiting off to the side of a slideshow are clipped by its track (the track itself is still checked)
          if (el.parentElement && el.parentElement.closest('.slider__track')) return false;
          // the photo reel's row drifts past its frame, which clips it (the frame itself is still checked)
          if (el.closest('.reel__track')) return false;
          return b.right > de.clientWidth + 1 || b.left < -1;
        }).map(el => el.tagName.toLowerCase() + '.' + el.className).slice(0, 5);
        const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => !h.closest('[hidden]')).map(h => +h.tagName[1]);
        let skip = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skip.push(hs[i - 1] + '->' + hs[i]);
        const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
        const badAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h === '#' || !ids.has(h.slice(1)));
        const brokenImgs = [...document.images].filter(i => i.getAttribute('src') && !i.naturalWidth).map(i => i.getAttribute('src'));
        const noAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
        const navVisible = (sel) => { const e = document.querySelector(sel); if (!e) return false; const b = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && b.width > 0 && b.right <= de.clientWidth + 1; };
        return {
          hScroll: de.scrollWidth > de.clientWidth,
          scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
          wide, h1: hs.filter(h => h === 1).length, skip, badAnchors, brokenImgs, noAlt,
          desktopNav: navVisible('#navLinks'), burger: navVisible('#burger'), hire: navVisible('.hire'),
          heroIntro: navVisible('.hero__intro'),
        };
      });
      Object.assign(c, st);

      // Interaction: menu (burger) or desktop links
      if (st.burger) {
        await page.click('#burger');
        c.sheetOpens = await page.$eval('#sheet', s => s.getAttribute('data-open') === '1');
        await page.click('#sheet a[href="#contact"]');
        c.sheetClosesOnLink = await page.$eval('#sheet', s => s.getAttribute('data-open') === '0');
        // the scrim stays clickable while it fades out; let it finish before the next real click
        await new Promise(r => setTimeout(r, 400));
      }
      // Section switch: a menu link lands its section's heading just under the nav bar
      await page.evaluate(() => { scrollTo(0, 0); document.querySelector('#navLinks a[href="#trainings"]').click(); });
      await new Promise(r => setTimeout(r, 300));
      c.sectionSwitch = await page.evaluate(() => {
        const top = document.querySelector('#trainings .h2').getBoundingClientRect().top;
        return top > 40 && top < 260 && location.hash === '#trainings' && document.activeElement.id === 'trainings';
      });
      // Slideshows: Next moves the track and the counter, Previous brings it back.
      // Previous starts disabled, except on a looping (data-autoplay) slider, which has no start.
      c.sliders = [];
      for (const sel of ['.slider--work', '.slider--tr']) {
        await page.evaluate(s => document.querySelector(s + ' .slider__nav').scrollIntoView({ block: 'center' }), sel);
        const s0 = await page.$eval(sel, r => ({ count: r.querySelector('[data-count]').textContent, prevOff: r.hasAttribute('data-autoplay') || r.querySelector('[data-dir="-1"]').getAttribute('aria-disabled') === 'true' }));
        await page.click(sel + ' [data-dir="1"]');
        await new Promise(r => setTimeout(r, 300));
        const s1 = await page.$eval(sel, r => ({ x: r.querySelector('.slider__track').scrollLeft, count: r.querySelector('[data-count]').textContent }));
        await page.click(sel + ' [data-dir="-1"]');
        await new Promise(r => setTimeout(r, 300));
        const x2 = await page.$eval(sel + ' .slider__track', t => t.scrollLeft);
        if (!(s0.prevOff && s1.x > 0 && s1.count !== s0.count && x2 < 2)) c.sliders.push(`${sel} ${s0.count}->${s1.count} x=${s1.x}->${x2}`);
      }
      // Work cards: all six rendered, the third opens its case study
      c.workCards = await page.$$eval('.work__open', b => b.length);
      await page.evaluate(() => document.querySelectorAll('.work__card')[2].scrollIntoView({ block: 'center' }));
      c.yBeforeDetail = await page.evaluate(() => scrollY);
      await page.evaluate(() => document.querySelectorAll('.work__open')[2].click());
      c.detailOpens = await page.$eval('#detail', d => d.getAttribute('data-open') === '1' && !!d.querySelector('h2#dTitle'));
      c.detailHeadingSkip = await page.evaluate(() => {
        const hs = [...document.querySelectorAll('#detail h2,#detail h3,#detail h4')].map(h => +h.tagName[1]);
        let s = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) s.push(hs[i - 1] + '->' + hs[i]); return s;
      });
      c.detailImgOk = await page.evaluate(() => new Promise(r => { const i = document.querySelector('#detail img'); if (!i) return r(false); i.loading = 'eager'; if (i.complete && i.naturalWidth) r(true); else { i.onload = () => r(true); i.onerror = () => r(false); } }));
      c.detailNoHScroll = await page.$eval('#detail', d => d.scrollWidth <= d.clientWidth);
      if (shots) await page.screenshot({ path: path.join(OUT, `${bname}-${sz.name}-detail.png`) });
      // Remember where the visitor was before the case study opened
      const yBefore = c.yBeforeDetail;
      await page.keyboard.press('Escape');
      c.detailClosesEsc = await page.$eval('#detail', d => d.getAttribute('data-open') === '0');
      await new Promise(r => setTimeout(r, 400));
      // Closing must return to the project card, not jump to the top of the page
      c.returnsToCard = Math.abs(await page.evaluate(() => scrollY) - yBefore) < 5;
      // Lightbox
      await page.evaluate(() => document.querySelector('[data-cert="award-2"]').click());
      await new Promise(r => setTimeout(r, 400));
      c.lightboxOpens = await page.evaluate(() => !document.getElementById('lb').hidden && document.getElementById('lbImg').naturalWidth > 0);
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 400));
      c.lightboxCloses = await page.$eval('#lb', l => l.hidden);
      // Message form validation
      await page.evaluate(() => document.getElementById('msgOpen').click());
      await new Promise(r => setTimeout(r, 150));
      await page.type('#mn', 'Test User'); await page.type('#me', 'not-an-email'); await page.type('#mm', 'Hello');
      await page.evaluate(() => document.querySelector('#msgForm button[type=submit]').click());
      c.formRejectsBadEmail = await page.$eval('#msgNote', n => /does not look right/.test(n.textContent));
      await page.keyboard.press('Escape');
      // Theme toggle
      const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await page.evaluate(() => document.getElementById('themeBtn').click());
      c.themeToggles = before !== await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (shots) {
        await page.evaluate(() => document.getElementById('themeBtn').click());
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(OUT, `${bname}-${sz.name}-full.png`), fullPage: true });
      }
      // Mochi chat assistant
      const ask = q => page.evaluate(q => {
        document.getElementById('botIn').value = q;
        document.getElementById('botForm').requestSubmit();
        return [...document.querySelectorAll('.bot__msg--bot')].pop().textContent;
      }, q);
      await page.evaluate(() => scrollTo(0, 0));
      c.botVisible = await page.$eval('#botFab', b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.right <= document.documentElement.clientWidth; });
      await page.evaluate(() => document.getElementById('botFab').click());
      c.botOpens = await page.$eval('#bot', b => b.getAttribute('data-open') === '1' && !!b.querySelector('.bot__chip'));
      c.botPanelFits = await page.$eval('#botPanel', p => { const r = p.getBoundingClientRect(), de = document.documentElement; return r.left >= 0 && r.right <= de.clientWidth && r.top >= 0 && p.scrollWidth <= p.clientWidth; });
      await page.evaluate(() => [...document.querySelectorAll('.bot__chip')].find(b => /built/.test(b.textContent)).click());
      c.botChipAnswers = await page.evaluate(() => /built 6 projects/.test([...document.querySelectorAll('.bot__msg--bot')].pop().textContent));
      c.botTypedAnswers = /open to internships/.test(await ask('is marjon available for an internship?'));
      c.botProjectAnswers = /QuiteScan/.test(await ask('what is quitescan'));
      c.botWhyHire = /bring to your team/.test(await ask('why should we hire marjon?'));
      c.botHonestUnknown = /don.t have that detail/.test(await ask('when will marjon graduate?'));
      c.botFallback = /not sure/.test(await ask('what is the weather today'));
      if (shots) await page.screenshot({ path: path.join(OUT, `${bname}-${sz.name}-mochi.png`) });
      await page.keyboard.press('Escape');
      c.botClosesEsc = await page.$eval('#bot', b => b.getAttribute('data-open') === '0');
      // Opening the message form closes Mochi, so the two corner panels never overlap
      await page.evaluate(() => document.getElementById('botFab').click());
      await page.evaluate(() => document.getElementById('msgOpen').click());
      c.botYieldsToMsg = await page.evaluate(() => document.getElementById('bot').getAttribute('data-open') === '0' && document.getElementById('msg').getAttribute('data-open') === '1');
      await page.keyboard.press('Escape');
      // Shared case-study URL opens the dialog on load
      await page.goto('about:blank');
      await page.goto(SITE + '#project-cassavacare', { waitUntil: 'networkidle0' });
      c.deepLink = await page.$eval('#detail', d => d.getAttribute('data-open') === '1');
      c.errors = errors; c.failed = failed;
      results.push(r);
      await page.close();
    }
    await browser.close();
  }
  // Summarise
  for (const r of results) {
    const c = r.checks, bad = [];
    if (c.hScroll) bad.push(`H-SCROLL ${c.scrollWidth}>${c.clientWidth}`);
    if (c.wide.length) bad.push('overflowing: ' + c.wide.join(', '));
    if (c.h1 !== 1) bad.push('h1 count ' + c.h1);
    if (c.skip.length) bad.push('heading skips ' + c.skip);
    if (c.detailHeadingSkip.length) bad.push('detail heading skips ' + c.detailHeadingSkip);
    if (c.badAnchors.length) bad.push('bad anchors ' + c.badAnchors);
    if (c.brokenImgs.length) bad.push('broken imgs ' + c.brokenImgs);
    if (c.noAlt) bad.push('imgs without alt ' + c.noAlt);
    if (!c.desktopNav && !c.burger) bad.push('NO NAV');
    if (c.burger && !(c.sheetOpens && c.sheetClosesOnLink)) bad.push('sheet broken');
    if (!c.heroIntro) bad.push('hero intro hidden/clipped');
    for (const k of ['sectionSwitch', 'detailOpens', 'detailImgOk', 'detailNoHScroll', 'detailClosesEsc', 'lightboxOpens', 'lightboxCloses', 'formRejectsBadEmail', 'deepLink', 'returnsToCard',
      'botVisible', 'botOpens', 'botPanelFits', 'botChipAnswers', 'botTypedAnswers', 'botProjectAnswers', 'botWhyHire', 'botHonestUnknown', 'botFallback', 'botClosesEsc', 'botYieldsToMsg']) if (!c[k]) bad.push(k + ' FAILED');
    if (c.workCards !== 6) bad.push('work cards ' + c.workCards);
    if (c.sliders.length) bad.push('slideshow broken: ' + c.sliders.join(', '));
    if (!c.themeToggles) bad.push('theme toggle FAILED');
    if (c.errors.length) bad.push('errors: ' + c.errors.join(' | '));
    if (c.failed.length) bad.push('failed requests: ' + c.failed.join(' | '));
    console.log(`${r.browser.padEnd(6)} ${r.size.padEnd(13)} nav=${c.desktopNav ? 'links' : 'burger'} hire=${c.hire ? 'y' : 'n'} cards=${c.workCards}  ${bad.length ? 'ISSUES: ' + bad.join('; ') : 'PASS'}`);
  }
  
})().catch(e => { console.error(e); process.exit(1); });
