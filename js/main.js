/* ══════════════════════════════════════════════════════════════════════
   MARJON C. VERA — PORTFOLIO · BEHAVIOUR
   Plain ES5, no dependencies. Each feature is a self-contained IIFE so a
   failure in one never takes the others down. Content lives in data.js.

   Contents
     1. Helpers + theme toggle
     2. Scroll reveal + active nav link
     3. Mobile menu sheet
     4. Section switch (fade out, jump, rise in)
     5. Scroll lock (shared by the dialogs)
     6. Work cards
     7. Slideshows (Work + Trainings)
     8. Trait cards
     9. Contact list
    10. Project detail dialog
    11. Certificate lightbox
    12. Message panel (mailto)
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.body.classList.remove('no-js');
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return mq.matches; };
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  $('#yr').textContent = new Date().getFullYear();

  /* Every certificate and award image in the page carries a data-certkey.
     The lightbox looks up its full-size source here, so a viewer button only
     needs to name a key (data-cert) instead of repeating the image path. */
  var CERTS = {};
  $$('img[data-certkey]').forEach(function (im) { CERTS[im.getAttribute('data-certkey')] = im.getAttribute('src'); });

  // "My role" note, shared by the project cards and the case-study panel.
  function roleFor(p) {
    return '<div class="role"><p class="role__k">My role</p><p class="role__v">' + p.role + '</p></div>';
  }

  // object-fit is CONTAIN, not cover: three of these are portrait phone
  // screenshots, and cover would crop them to a thin horizontal band.
  function shotFor(p) {
    return '<img class="shot" src="' + p.shot + '" alt="' + p.shotAlt + '" loading="lazy" decoding="async">';
  }

  /* ── Theme: stored choice wins, else the OS preference ─────────────── */
  (function () {
    var root = document.documentElement, btn = $('#themeBtn');
    function apply(t) {
      root.setAttribute('data-theme', t);
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      var m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'dark' ? '#0A0A0A' : '#ECECEC');
    }
    var saved = null;
    try { saved = localStorage.getItem('mv_theme'); } catch (e) {}
    apply(saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('mv_theme', next); } catch (e) {}
    });
  })();

  /* ── Reveal, once per element ──────────────────────────────────────── */
  (function () {
    var els = $$('[data-rv]');
    if (!('IntersectionObserver' in window) || reduced()) { els.forEach(function (e) { e.setAttribute('data-in',''); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-in',''); io.unobserve(e.target); } });
    }, { rootMargin:'0px 0px -6% 0px', threshold:.05 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ── Nav active state ──────────────────────────────────────────────── */
  (function () {
    var links = $$('#navLinks a');
    var ids = links.map(function (a) { return a.getAttribute('href').slice(1); });
    if (!('IntersectionObserver' in window)) return;
    var vis = {};
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { vis[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var bi = -1, best = 0;
      ids.forEach(function (id, i) { var v = vis[id] || 0; if (v > best) { best = v; bi = i; } });
      links.forEach(function (a, i) { if (i === bi) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
    }, { rootMargin:'-120px 0px -50% 0px', threshold:[0,.15,.4,.75,1] });
    ids.forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();

  /* ── Mobile sheet, origin-aware ────────────────────────────────────── */
  (function () {
    var b = $('#burger'), s = $('#sheet'), sc = $('#scrim'), open = false;
    function set(v) {
      open = v; b.setAttribute('aria-expanded', String(v));
      if (v) {
        var br = b.getBoundingClientRect(), sr = s.getBoundingClientRect();
        s.style.transformOrigin = Math.max(0, Math.min(sr.width, br.left + br.width/2 - sr.left)) + 'px 0px';
      }
      s.setAttribute('data-open', v ? '1':'0'); sc.setAttribute('data-open', v ? '1':'0');
    }
    b.addEventListener('click', function () { set(!open); });
    sc.addEventListener('click', function () { set(false); });
    $$('a', s).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { set(false); b.focus(); } });
    addEventListener('resize', function () { if (open) set(false); }, { passive:true });
  })();

  /* ── Typed headings: a heading marked [data-type] types itself out, one
     letter at a time with a caret, each time its section is opened from a
     link and the first time it scrolls into view. Screen readers get the
     whole heading at once from a hidden copy; the letters are decoration.
     Sizing lives in CSS (see TYPED HEADING in styles.css). ── */
  var typeIn = function () {};
  (function () {
    var heads = $$('[data-type]');
    // Built with DOM nodes, not innerHTML, so "&" and "'" stay plain text.
    // Each heading types on ONE line, so a <br> ("Let's work<br>together")
    // becomes a space, and the CSS shrinks a heading that is too wide.
    heads.forEach(function (h) {
      var type = document.createElement('span'), sr = document.createElement('span'), i = 0;
      type.className = 'type'; type.setAttribute('aria-hidden', 'true');
      sr.className = 'sr-only';
      var text = [].slice.call(h.childNodes).map(function (node) {
        return node.nodeName === 'BR' ? ' ' : node.textContent;
      }).join('').replace(/\s+/g, ' ').trim();
      text.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.textContent = c; i++;
        type.appendChild(s);
      });
      sr.textContent = text;
      h.textContent = '';
      h.appendChild(sr); h.appendChild(type);
      // Long headings type faster, so none takes much over a second.
      h.typeStep = Math.min(60, Math.round(1300 / i));
      h.letters = [].slice.call(type.children);
    });
    // ONE caret per heading: a zero-width element moved along behind the
    // newest letter, so there is never more than one line on screen. Letters
    // not yet typed are hidden but keep their space, so nothing shifts.
    var caret = document.createElement('span');
    caret.className = 'type__caret'; caret.setAttribute('aria-hidden', 'true');
    function stop(h) {
      clearInterval(h.typeI); clearTimeout(h.typeT);
      if (h.caret && h.caret.parentNode) h.caret.parentNode.removeChild(h.caret);
      h.removeAttribute('data-typing');
      h.letters.forEach(function (s) { s.classList.remove('on'); });
    }
    function play(h) {
      if (reduced()) return;
      stop(h);   // restart cleanly even if it is mid-way
      var type = $('.type', h), i = 0;
      h.caret = h.caret || caret.cloneNode();
      type.insertBefore(h.caret, type.firstChild);
      h.setAttribute('data-typing', '');
      h.typeI = setInterval(function () {
        var s = h.letters[i++];
        s.classList.add('on');
        type.insertBefore(h.caret, s.nextSibling);
        if (i >= h.letters.length) {
          clearInterval(h.typeI);
          // The caret lingers a beat after the last letter, then goes.
          h.typeT = setTimeout(function () { stop(h); }, 700);
        }
      }, h.typeStep);
    }
    typeIn = function (sec) { $$('[data-type]', sec).forEach(play); };

    // One line at every width. CSS does the sizing (see TYPED HEADING): the
    // font is the smaller of the normal size and the column width divided
    // by --em, the heading's width in ems, measured here. That ratio does
    // not depend on the font size, so setting it never changes what it
    // measured, and resizing needs no script at all. Only a font swap
    // changes it (Archivo is wider than the fallback), so measure again
    // whenever fonts finish loading.
    function measure() {
      heads.forEach(function (h) {
        var fs = parseFloat(getComputedStyle(h).fontSize), w = $('.type', h).getBoundingClientRect().width;
        if (fs && w) h.style.setProperty('--em', (w / fs * 1.03).toFixed(3));
      });
    }
    measure();
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(measure);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', measure);
    }
    addEventListener('load', measure);
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } });
    }, { threshold:.6 });
    heads.forEach(function (h) { io.observe(h); });
  })();

  /* ── Section switch: an in-page link (menu, logo, hero buttons, Back to
     top) changes section like changing pages. The page fades out, jumps,
     and the section rises back in, instead of scrolling past everything
     in between. Under reduced motion it simply jumps. The skip link is
     left alone: a keyboard shortcut should never wait on an animation. ── */
  (function () {
    var root = document.documentElement, busy = false;
    var OUT = 180, IN = 620;   // fade-out, then the rise-in (see SECTION SWITCH in styles.css)

    // The hero has no id of its own; #top is an empty marker just above it.
    function sectionOf(t) { return t.id === 'top' ? $('.hero') : (t.closest('section') || t); }

    function land(t) {
      t.scrollIntoView({ behavior:'instant', block:'start' });
      // Keep the address shareable without stacking a history entry per click.
      history.replaceState(history.state, '', '#' + t.id);
      // Move focus with the view, as a normal anchor jump would, so Tab
      // continues from the new section rather than from the menu.
      var sec = sectionOf(t);
      if (!sec.hasAttribute('tabindex')) sec.setAttribute('tabindex', '-1');
      sec.focus({ preventScroll:true });
      return sec;
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a || a.classList.contains('skip')) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      if (busy) return;
      if (reduced()) { land(t); return; }
      busy = true;
      root.setAttribute('data-switch', 'out');
      setTimeout(function () {
        var sec = land(t);
        typeIn(sec);
        sec.setAttribute('data-arrive', '');
        root.removeAttribute('data-switch');
        setTimeout(function () { sec.removeAttribute('data-arrive'); busy = false; }, IN);
      }, OUT);
    });
  })();

  /* ── Shared scroll lock ────────────────────────────────────────────── */
  var lockY = 0, locks = 0;
  function lock(on) {
    if (on) {
      if (locks++ > 0) return;
      lockY = scrollY;
      var sbw = innerWidth - document.documentElement.clientWidth;
      document.body.style.cssText += ';position:fixed;top:' + (-lockY) + 'px;width:100%;' + (sbw > 0 ? 'padding-right:' + sbw + 'px;' : '');
    } else {
      if (--locks > 0) return;
      locks = 0;
      document.body.style.position=''; document.body.style.top='';
      document.body.style.width=''; document.body.style.paddingRight='';
      scrollTo({ top:lockY, left:0, behavior:'instant' });
    }
  }

  /* ── Work cards — one per project, all visible at once so a visitor can
     compare them at a glance. The title is the button; its ::after
     stretches over the card so the whole card is one click target. ── */
  (function () {
    var host = $('#workList');
    var ARROW = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
    PROJECTS.forEach(function (p) {
      var status = '';
      p.meta.forEach(function (m) { if (m[0] === 'Status') status = m[1]; });
      var li = document.createElement('li');
      li.className = 'work__item';
      li.innerHTML =
        '<article class="work__card">' +
          '<div class="work__shot">' + shotFor(p) + '</div>' +
          '<div class="work__body">' +
            '<p class="work__tag">' + p.context + ' · ' + status + '</p>' +
            '<h3 class="work__t"><button class="work__open" type="button" data-id="' + p.id + '">' + p.title + '</button></h3>' +
            '<p class="work__d">' + p.short + '</p>' +
            roleFor(p) +
            '<ul class="chips">' + p.chips.slice(0, 4).map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' +
            '<p class="work__foot"><span class="work__more" aria-hidden="true">Read case study ' + ARROW + '</span>' +
              (p.live ? '<a class="work__live" href="' + p.live + '" target="_blank" rel="noopener noreferrer">' +
                p.live.replace(/^https?:\/\//, '') + ' ' + ARROW + '</a>' : '') +
            '</p>' +
          '</div>' +
        '</article>';
      host.appendChild(li);
    });
    $$('.work__open', host).forEach(function (b) {
      b.addEventListener('click', function () { openDetail(b.getAttribute('data-id'), b); });
    });
  })();

  /* ── Beyond the code — the photo reel. A frame turned in 3D (see BEYOND
     THE CODE in styles.css) whose photos drift sideways at a steady speed,
     without stopping, and loop forever.
     Each photo is rendered once as a real, focusable button. Behind them,
     aria-hidden copies of the visible set repeat until a full frame of
     photos follows the set, so the loop never shows a gap: when the row has
     moved one set's width, it jumps back by exactly that much, which looks
     like nothing happened. The filters hide originals and rebuild the
     copies. The arrows nudge one photo with an ease; Pause stops the drift
     (WCAG 2.2.2). The drift also stops while keyboard focus is on a photo,
     a dialog is open, the reel is off screen, or the tab is hidden, and it
     starts paused under reduced motion. ── */
  (function () {
    var reel = $('#bcReel'), plane = $('#bcPlane'), inner = $('#bcInner'), track = $('#bcGrid');
    var bar = $('#bcFilters'), countEl = $('#bcCount');
    var playBtn = $('[data-play]', reel), prevB = $('[data-dir="-1"]', reel), nextB = $('[data-dir="1"]', reel);
    var SPEED = 42;       // px per second; slow enough to look at each photo
    var NUDGE = 650;      // ms for an arrow press to glide one photo
    var group = 'all', copies = [], setW = 0, x = 0;
    var playing = false, inView = false, raf = 0, last = 0, nudge = null;

    var items = BEYOND.map(function (p) {
      var key = 'beyond-' + p.f;
      CERTS[key] = 'Images/web/beyond/' + p.f + '.jpg';
      var li = document.createElement('li');
      li.innerHTML =
        '<button class="bc__btn" type="button" data-cert="' + key + '" data-title="' + p.t + '" data-sub="' + p.s + '"' +
          ' aria-label="View full size: ' + p.t + '">' +
          '<img src="Images/web/beyond/thumb/' + p.f + '.jpg" width="360" height="480" alt="' + p.alt + '" loading="lazy" decoding="async">' +
        '</button>';
      track.appendChild(li);
      return { li:li, g:p.g };
    });
    function visible() { return items.filter(function (it) { return !it.li.hidden; }); }

    BEYOND_GROUPS.forEach(function (gr) {
      var n = items.filter(function (it) { return gr[0] === 'all' || it.g === gr[0]; }).length;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bc__chip';
      b.setAttribute('data-g', gr[0]);
      b.setAttribute('aria-pressed', String(gr[0] === group));
      b.innerHTML = gr[1] + ' <span>' + n + '</span>';
      b.addEventListener('click', function () { if (group !== gr[0]) pick(gr[0]); });
      bar.appendChild(b);
    });
    var chips = $$('.bc__chip', bar);

    // Rebuild the decorative copies for the current set and measure it.
    function build() {
      copies.forEach(function (c) { c.parentNode.removeChild(c); });
      copies = [];
      var vis = visible();
      if (!vis.length) { setW = 0; return; }
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var guess = vis.length * (vis[0].li.offsetWidth + gap);
      var sets = Math.max(1, Math.ceil(plane.clientWidth / guess)) + 1;
      for (var k = 0; k < sets; k++) {
        vis.forEach(function (it) {
          var c = it.li.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          c.className = 'is-copy';
          $('button', c).tabIndex = -1;
          track.appendChild(c);
          copies.push(c);
        });
      }
      // Exact width of one set, gaps included: where its first copy begins.
      setW = copies[0].offsetLeft - vis[0].li.offsetLeft;
      x = ((x % setW) + setW) % setW;
      paint();
    }
    function paint() { track.style.transform = 'translate3d(' + (-x).toFixed(2) + 'px,0,0)'; }

    function keyFocus() {
      var a = document.activeElement;
      if (!a || !track.contains(a)) return false;
      try { return a.matches(':focus-visible'); } catch (e) { return true; }
    }
    function drifting() { return playing && !nudge && locks === 0 && !document.hidden && !keyFocus(); }

    function frame(t) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(64, t - last) / 1000 : 0;   // a long gap (tab switch) never jumps
      last = t;
      if (!setW) return;
      if (nudge) {
        var k = Math.min(1, (t - nudge.t0) / NUDGE), e = 1 - Math.pow(1 - k, 3);   // ease-out
        x = nudge.from + (nudge.to - nudge.from) * e;
        if (k >= 1) nudge = null;
      } else if (drifting()) {
        x += SPEED * dt;
      } else return;
      x = ((x % setW) + setW) % setW;
      paint();
    }
    function run() {
      var on = inView;
      if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function step(dir) {
      var vis = visible(); if (!vis.length || !setW) return;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var w = vis[0].li.offsetWidth + gap;
      // Land on a photo edge, so a nudge always ends with a photo squared up.
      var to = (Math.round(x / w) + dir) * w;
      if (reduced()) { x = ((to % setW) + setW) % setW; nudge = null; paint(); return; }
      nudge = { from:x, to:to, t0:performance.now() };
    }
    prevB.addEventListener('click', function () { step(-1); });
    nextB.addEventListener('click', function () { step(1); });
    reel.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      step(e.key === 'ArrowLeft' ? -1 : 1);
    });

    // Tabbing to a photo brings it to the front of the frame. The browser
    // may also scroll the clipped frame to reveal it; undo that.
    track.addEventListener('focusin', function (e) {
      var li = e.target.closest('li'), vis = visible();
      if (!li || !vis.length || !keyFocus()) return;
      nudge = null;
      x = li.offsetLeft - vis[0].li.offsetLeft;
      inner.scrollLeft = 0; plane.scrollLeft = 0;
      x = ((x % setW) + setW) % setW;
      paint();
    });

    function setPlaying(v) {
      playing = v;
      playBtn.setAttribute('aria-label', v ? 'Pause slideshow' : 'Play slideshow');
      playBtn.setAttribute('data-playing', v ? '1' : '0');
    }
    playBtn.addEventListener('click', function () { setPlaying(!playing); });

    function pick(g) {
      group = g;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-g') === g)); });
      items.forEach(function (it) { it.li.hidden = g !== 'all' && it.g !== g; });
      x = 0; nudge = null;
      build(); say();
      // The new set slides in from the right.
      if (reduced()) return;
      inner.removeAttribute('data-swap');
      void inner.offsetWidth;
      inner.setAttribute('data-swap', '');
    }
    inner.addEventListener('animationend', function () { inner.removeAttribute('data-swap'); });
    function say() { var n = visible().length; countEl.textContent = n + (n === 1 ? ' photo' : ' photos'); }

    var rz = 0;
    addEventListener('resize', function () {
      if (!rz) rz = requestAnimationFrame(function () { rz = 0; build(); });
    }, { passive:true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; run(); }, { threshold:.15 }).observe(reel);
    } else { inView = true; }

    build(); say();
    setPlaying(!reduced());
    run();
  })();

  /* ── Slideshows: Work and Trainings scroll sideways,
     not down. The track is a native scroll-snap row (see SLIDER in
     styles.css), so swipe, trackpad and Tab already work; this adds the
     buttons, the counter, the progress bar and arrow keys. Runs after the
     work cards and photos exist, as it measures them. Hidden slides (a
     photo filter) are skipped, and a 'slider:refresh' event on the root
     starts the slider over.
     A slider marked data-autoplay (Work) moves on
     its own and loops: it always slides forward, never rewinds. Slides
     that have scrolled out on the left are moved to the end of the row
     (and the scroll position corrected in the same frame), so there is
     always another screenful ahead. Trainings stops at either end. ── */
  (function () {
    $$('[data-slider]').forEach(function (root) {
      var track = $('.slider__track', root), every = [].slice.call(track.children), order, n;
      var prev = $('[data-dir="-1"]', root), next = $('[data-dir="1"]', root),
          count = $('[data-count]', root), live = $('[data-live]', root), bar = $('.slider__bar span', root);
      var noun = root.getAttribute('data-noun') || 'slides';
      var delay = +root.getAttribute('data-autoplay'), loop = !!delay;
      var first = 0, per = 1, lead = null, raf = 0;
      function shown(s) { return !s.hidden; }
      // order: visible slides in their original order, which the counter
      // uses. dom(): the same slides in their current (maybe rotated) order.
      function collect() { order = every.filter(shown); n = order.length; }
      function dom() { return [].slice.call(track.children).filter(shown); }
      function offset(el, d) { return el.offsetLeft - d[0].offsetLeft; }
      collect();
      if (!n) return;

      // Which slides are fully in view. Read from the layout rather than
      // tracked by hand, so a swipe, a Tab or a resize all stay in sync.
      function measure() {
        var cs = getComputedStyle(track), r = track.getBoundingClientRect();
        var L = r.left + parseFloat(cs.paddingLeft) - 2, R = r.right - parseFloat(cs.paddingRight) + 2;
        var seen = dom().filter(function (s) {
          var b = s.getBoundingClientRect();
          return b.left >= L && b.right <= R;
        });
        if (seen.length) { lead = seen[0]; first = order.indexOf(lead); per = seen.length; }
      }
      function update() {
        raf = 0; measure();
        // On a looping slider the view can wrap past the end: "43–3 / 44".
        var a = first + 1, z = (first + per - 1) % n + 1;
        count.textContent = (per > 1 ? a + '–' + z : a) + ' / ' + n;
        var say = 'Showing ' + noun + ' ' + (per > 1 ? a + ' to ' + z : a) + ' of ' + n;
        if (live.textContent !== say) live.textContent = say;
        prev.setAttribute('aria-disabled', String(loop ? n <= per : first <= 0));
        next.setAttribute('aria-disabled', String(loop ? n <= per : first + per >= n));
        bar.style.width = (per / n * 100) + '%';
        bar.style.transform = 'translateX(' + (first / per * 100) + '%)';
        if (depth) front();
      }
      function queue() { if (!raf) raf = requestAnimationFrame(update); }

      // data-depth (Trainings): the slide nearest the start of the track is
      // marked data-front, and CSS brings it forward while the others sit
      // back. Read from offsetLeft, which ignores the CSS scale, so the
      // choice never depends on the effect it causes. It updates while the
      // track moves, so the next certificate comes forward as it slides in.
      // The others are marked data-side="before" / "after", so CSS can angle
      // them away on their own side; the new front card flies in from the
      // side it was waiting on (--enter).
      var depth = root.hasAttribute('data-depth'), onFront = null;
      function front() {
        var d = dom(), best = null, bd = Infinity;
        d.forEach(function (s) {
          var p = Math.abs(offset(s, d) - track.scrollLeft);
          if (p < bd) { bd = p; best = s; }
        });
        if (best === onFront) return;
        best.style.setProperty('--enter', best.getAttribute('data-side') === 'before' ? '18deg' : '-18deg');
        var at = d.indexOf(best);
        d.forEach(function (s, i) {
          if (i === at) s.removeAttribute('data-side');
          else s.setAttribute('data-side', i < at ? 'before' : 'after');
        });
        if (onFront) onFront.removeAttribute('data-front');
        best.setAttribute('data-front', '');
        onFront = best;
      }
      // Play the move once more the first time the slider scrolls into
      // view, so the visitor sees the current card come forward too.
      if (depth && 'IntersectionObserver' in window) {
        var seenOnce = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting || !onFront) return;
          seenOnce.disconnect();
          onFront.removeAttribute('data-front');
          void onFront.offsetWidth;
          onFront.setAttribute('data-front', '');
        }, { threshold:.35 });
        seenOnce.observe(track);
      }

      // A button moves one screenful: three projects on desktop, one on a phone.
      function go(dir) {
        measure();
        var how = reduced() ? 'auto' : 'smooth', d = dom();
        if (!loop) {
          var to = Math.max(0, Math.min(n - per, first + dir * per));
          track.scrollTo({ left: offset(order[to], d), behavior: how });
          return;
        }
        if (n <= per || !lead) return;
        // A short filter (6 photos, 5 in view) moves one at a time.
        var step = Math.min(per, n - per), i = d.indexOf(lead);
        if (dir > 0 && i + step + per > n) {
          // Not a full screenful ahead: send the slides behind the view to
          // the end, then put the view back where it was, instantly.
          d.slice(0, i).forEach(function (s) { track.appendChild(s); });
        } else if (dir < 0 && i < step) {
          // Going back past the start: bring slides from the end to the front.
          d.slice(n - (step - i)).reverse().forEach(function (s) { track.insertBefore(s, track.firstChild); });
        }
        d = dom(); i = d.indexOf(lead);
        track.scrollTo({ left: offset(lead, d), behavior: 'auto' });
        track.scrollTo({ left: offset(d[i + dir * step], d), behavior: how });
      }
      [prev, next].forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.getAttribute('aria-disabled') !== 'true') go(+b.getAttribute('data-dir'));
        });
      });
      root.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        go(e.key === 'ArrowLeft' ? -1 : 1);
      });
      track.addEventListener('scroll', queue, { passive:true });
      addEventListener('resize', queue, { passive:true });
      root.addEventListener('slider:refresh', function () {
        every.forEach(function (s) { track.appendChild(s); });   // undo any rotation
        collect(); first = 0; lead = null;
        track.scrollLeft = 0;
        update(); restart();
      });

      /* Autoplay: one screenful per beat, forever forward. A pause button is
         always offered (WCAG 2.2.2). A beat is skipped while keyboard focus
         is on a slide, while a case study or the lightbox is open (the page
         is scroll-locked), while the slider is off screen, and while the
         tab is hidden. Off by default under reduced motion; Play still
         turns it on. */
      var playBtn = $('[data-play]', root);
      var playing = false, timer = 0, inView = false;
      // Keyboard focus only: after a click, focus returns to the card that
      // opened a case study, and that alone shouldn't stop the slideshow.
      function keyFocus() {
        var a = document.activeElement;
        if (!a || !track.contains(a)) return false;
        try { return a.matches(':focus-visible'); } catch (e) { return true; }
      }
      function restart() {
        clearInterval(timer); timer = 0;
        if (delay && playing) timer = setInterval(tick, delay);
      }
      function tick() {
        if (locks > 0 || !inView || document.hidden || keyFocus()) return;
        go(1);
      }
      function setPlaying(v) {
        playing = v;
        playBtn.setAttribute('aria-label', v ? 'Pause slideshow' : 'Play slideshow');
        playBtn.setAttribute('data-playing', v ? '1' : '0');
        restart();
      }
      if (delay && playBtn) {
        playBtn.addEventListener('click', function () { setPlaying(!playing); });
        // A manual move gets a full beat before the next automatic one.
        [prev, next].forEach(function (b) { b.addEventListener('click', restart); });
        track.addEventListener('pointerdown', restart, { passive:true });
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold:.4 }).observe(track);
        } else inView = true;
        setPlaying(!reduced());
      }
      update();
    });
  })();

  /* ── Trait stack — advances on click, never on a timer ─────────────── */
  (function () {
    var host = $('#trait');
    var traits = [['Trait','Problem Solver'],['Trait','Detail-Oriented'],['Trait','Self-Taught'],['Trait','Organised']];
    var at = 0;
    traits.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<small>' + t[0] + '</small><b>' + t[1] + '</b>';
      b.setAttribute('aria-label', t[1] + ' — show next trait');
      host.appendChild(b);
    });
    var cards = $$('button', host);
    function layout() {
      cards.forEach(function (c, i) {
        var o = (i - at + cards.length) % cards.length;
        c.style.transform = 'translate(' + (o * 7) + 'px,' + (o * -7) + 'px) rotate(' + (o * -2.4) + 'deg)';
        c.style.zIndex = String(cards.length - o);
        c.style.opacity = o > 2 ? '0' : String(1 - o * .16);
        c.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
        c.tabIndex = o === 0 ? 0 : -1;
      });
    }
    cards.forEach(function (c) { c.addEventListener('click', function () { at = (at + 1) % cards.length; layout(); }); });
    layout();
  })();

  /* ── Contact rows ──────────────────────────────────────────────────── */
  (function () {
    // To add a profile, paste its full URL into the matching row below.
    // Rows with an empty URL are skipped, so the page never shows a dead link.
    var ROWS = [
      // [label, full URL, icon, optional text to show instead of the URL]
      ['Email',     'mailto:marjonvera2005@gmail.com', 'mail'],
      ['Facebook',  'https://www.facebook.com/share/1bpfdxTb45/', 'fb', 'Marjon C. Vera'],
      ['Instagram', 'https://www.instagram.com/marjon.vera', 'ig'],
      ['GitHub',    'https://github.com/marjonvera2005-creator', 'gh'],
      ['LinkedIn',  'https://www.linkedin.com/in/marjon-vera-372a663b5/', 'li', 'Marjon C. Vera']
    ];
    var ICON = {
      mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
      fb:'<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/>',
      ig:'<rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.1"/>',
      gh:'<path d="M12 2A10 10 0 0 0 8.8 21.5c.5.1.7-.2.7-.5v-1.7C6.7 19.9 6.1 18 6.1 18c-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/>',
      li:'<path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05 4 0 4.75 2.6 4.75 6V21H18.4v-5.6c0-1.35-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.7H10V9Z"/>'
    };
    var STROKED = { mail:1, ig:1 };   // outline icons; the brand marks are solid

    // The text shown comes from the URL: "https://www.instagram.com/name"
    // becomes "instagram.com/name", and a mailto: link shows the address.
    function shown(url) {
      return url.replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }

    var host = $('#ctList');
    ROWS.filter(function (r) { return r[1]; }).forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'ct__row'; a.href = r[1];
      // Profiles open in a new tab so the portfolio stays open behind them.
      if (!/^mailto:/.test(r[1])) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      var paint = STROKED[r[2]] ? 'fill="none" stroke="currentColor" stroke-width="1.8"' : 'fill="currentColor"';
      a.innerHTML =
        '<span class="ct__ic" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" ' + paint + '>' + ICON[r[2]] + '</svg></span>' +
        '<span><span class="ct__k">' + r[0] + '</span><span class="ct__v">' + (r[3] || shown(r[1])) + '</span></span>';
      li.appendChild(a);
      host.appendChild(li);
    });
  })();

  /* ── Project detail ────────────────────────────────────────────────── */
  var openDetail;
  (function () {
    var view = $('#detail'), body = $('#dBody'), crumb = $('#dCrumb'), back = $('#dBack');
    var opener = null, isOpen = false, pushed = false;
    var bg = [$('.nav'), $('#main'), $('.ftr')];
    function inert(on) { bg.forEach(function (n) { if (n) { try { n.inert = on; } catch (e) {} } }); }

    function render(id) {
      var p = null;
      PROJECTS.forEach(function (x) { if (x.id === id) p = x; });
      if (!p) return;
      crumb.textContent = p.title;
      var left = '<div><h2 class="detail__t" id="dTitle">' + p.title + '</h2>' +
        (p.study ? '<p class="detail__study">' + (p.studyLabel || 'Research title') + ': <cite>' + p.study + '</cite></p>' : '') + '<p class="detail__lede">' + p.lede + '</p>' + roleFor(p);
      if (p.live) {
        left += '<p class="detail__live"><a class="btn btn--solid" href="' + p.live + '" target="_blank" rel="noopener noreferrer">Visit live site' +
          '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17 17 7M9 7h8v8"/></svg></a></p>' +
          '<p class="msg__note">Hosted on a free server, so the first visit can take up to a minute to load.</p>';
      }
      left += '<dl class="dmeta">' + p.meta.map(function (m) { return '<div><dt>' + m[0] + '</dt><dd>' + m[1] + '</dd></div>'; }).join('') + '</dl>';

      p.blocks.forEach(function (b) {
        left += '<div class="dblock"><h3>' + b.h + '</h3>';
        if (b.p) b.p.forEach(function (x) { left += '<p>' + x + '</p>'; });
        // A diagram for the block; opens full size in the lightbox like the screens.
        if (b.figure) {
          var fk = p.id + '-figure-' + b.h.toLowerCase().replace(/[^a-z]+/g, '-');
          CERTS[fk] = b.figure.src;
          left += '<figure class="dfig"><button class="dfig__btn" type="button" data-cert="' + fk + '" data-title="' + b.h + '"' +
            ' data-sub="' + p.title + '" aria-label="View full size: ' + b.h + ' diagram">' +
            '<img src="' + b.figure.src + '" width="' + b.figure.w + '" height="' + b.figure.h + '" alt="' + b.figure.alt + '" loading="lazy" decoding="async"></button>' +
            '<figcaption class="dfig__cap">' + b.figure.caption + '</figcaption></figure>';
        }
        if (b.list) left += '<ul class="dlist">' + b.list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
        if (b.pipes) left += '<ul class="dpipe">' + b.pipes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
        if (b.flow) {
          var f = b.flow;
          left += '<div class="dflow">';
          f.steps.forEach(function (s, i) {
            if (i) left += '<span class="dflow__a" aria-hidden="true">&darr;</span>';
            left += '<p class="dflow__s">' + s + '</p>';
          });
          if (f.decision) left += '<span class="dflow__a" aria-hidden="true">&darr;</span><p class="dflow__q">' + f.decision + '</p>';
          left += '</div>';
          if (f.yes) left += '<div class="dbranch"><div class="dbr"><h4>Yes</h4><ul>' + f.yes.map(function (x) { return '<li>' + x + '</li>'; }).join('') +
            '</ul></div><div class="dbr"><h4>No</h4><ul>' + f.no.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>';
        }
        if (b.tech) left += '<dl class="dtech">' + b.tech.map(function (t) { return '<div><dt>' + t[0] + '</dt><dd>' + t[1] + '</dd></div>'; }).join('') + '</dl>';
        if (b.ripe) left += '<ul class="ripe">' + RIPE.map(function (r) {
          return '<li data-s="' + r[0] + '"><p class="ripe__k">' + r[1] + '</p><p class="ripe__d">' + r[2] + '</p><p class="ripe__a">' + r[3] + '</p></li>'; }).join('') + '</ul>';
        if (b.after) b.after.forEach(function (x) { left += '<p class="dafter">' + x + '</p>'; });
        left += '</div>';
      });
      left += '<div class="dchips">' + p.chips.map(function (c) { return '<span class="dchip">' + c + '</span>'; }).join('') + '</div></div>';

      body.innerHTML = left + '<div class="dside"><div class="dshot">' + shotFor(p) + '</div>' +
        '<div class="dfeat"><h3>Key features</h3><ul class="dlist">' +
        p.features.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></div>' +
        galleryFor(p) + '</div>' +
        detectionsFor(p);
    }

    // "Inside the system": real screens with a caption each, placed in the
    // right column under Key features so it fills the space beside the
    // long write-up on desktop. Every image is
    // registered with the lightbox (CERTS) so a click opens it full size.
    function galleryFor(p) {
      if (!p.gallery) return '';
      var n = p.gallery.length;
      // Phone apps get tall, narrow frames; web pages get 4:3 frames.
      var phone = p.gallery.every(function (g) { return g.h / g.w > 1.4; });
      return '<section class="dgal" aria-labelledby="dGalT">' +
        '<h3 class="dgal__h" id="dGalT">' + p.galleryTitle + '</h3>' +
        '<p class="dgal__lede">' + n + ' screens from the ' + (phone ? 'app on a phone' : 'live system') + '. Select any screen to see it full size.</p>' +
        '<ol class="dgal__list' + (phone ? ' dgal__list--phone' : '') + (phone && n > 6 ? ' dgal__list--dense' : '') + '">' + p.gallery.map(function (g, i) {
          var key = p.id + '-screen-' + (i + 1);
          CERTS[key] = g.src;
          return '<li><figure class="dgal__item">' +
            '<button class="dgal__btn" type="button" data-cert="' + key + '" data-title="' + g.title + '"' +
              ' data-sub="' + p.title + ' · screen ' + (i + 1) + ' of ' + n + '" aria-label="View full size: ' + g.title + '">' +
              '<img' + (g.w / g.h > 4 / 3 ? ' class="is-wide"' : '') + ' src="' + g.src + '" width="' + g.w + '" height="' + g.h + '" alt="' + g.alt + '" loading="lazy" decoding="async"></button>' +
            '<figcaption><h4 class="dgal__t">' + g.title + '</h4><p class="dgal__p">' + g.text + '</p></figcaption>' +
          '</figure></li>';
        }).join('') + '</ol></section>';
    }

    // Detection outputs: small thumbnails only, full width under both columns.
    // The label, distance and side live in the alt text and the lightbox title.
    function detectionsFor(p) {
      if (!p.detections) return '';
      var SIDE = { L:'on the left', C:'straight ahead', R:'on the right' };
      var n = p.detections.length;
      return '<section class="dout" aria-labelledby="dOutT">' +
        '<h3 class="dgal__h" id="dOutT">Detection results</h3>' +
        '<p class="dgal__lede">' + n + ' real detections from the app. Select any to see it full size.</p>' +
        '<ul class="dout__list">' + p.detections.map(function (d, i) {
          var key = p.id + '-detection-' + (i + 1);
          var says = d.label + ', ' + d.dist + ' m ' + SIDE[d.side];
          CERTS[key] = d.src;
          return '<li><button class="dout__btn" type="button" data-cert="' + key + '" data-title="' + says + '"' +
            ' data-sub="' + p.title + ' · detection ' + (i + 1) + ' of ' + n + '" aria-label="View full size: ' + says + '">' +
            '<img src="' + d.src + '" width="' + d.w + '" height="' + d.h + '" alt="IntelliGuide detecting: ' + says + '." loading="lazy" decoding="async">' +
          '</button></li>';
        }).join('') + '</ul></section>';
    }

    openDetail = function (id, trigger) {
      opener = trigger; isOpen = true;
      render(id);
      view.setAttribute('data-open','1');
      lock(true); inert(true);
      view.scrollTop = 0;
      back.focus({ preventScroll:true });
      var hash = '#project-' + id;
      pushed = location.hash !== hash;
      if (pushed) history.pushState({ mvP:id }, '', hash);
    };
    function close(fromPop) {
      if (!isOpen) return;
      isOpen = false;
      view.setAttribute('data-open','0');
      inert(false); lock(false);
      if (opener) opener.focus({ preventScroll:true });
      opener = null;
      if (fromPop) return;
      if (pushed) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    back.addEventListener('click', function () { close(false); });
    addEventListener('keydown', function (e) {
      // While a screen is enlarged, Escape belongs to the lightbox.
      if (e.key === 'Escape' && isOpen && $('#lb').hidden) { e.preventDefault(); close(false); }
    });
    addEventListener('popstate', function () { if (isOpen) close(true); });

    // The page is position:fixed while a case study is open, so the history
    // entry records a scroll of 0. Left on 'auto', the browser restores that 0
    // on Back and jumps to the top; lock(false) already returns the visitor to
    // the card they opened, so take scroll restoration over ourselves.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    var m = /^#project-([\w-]+)$/.exec(location.hash);
    if (m && PROJECTS.some(function (p) { return p.id === m[1]; })) openDetail(m[1], null);
  })();

  /* ── Certificate lightbox — FLIP out of whatever was clicked ───────── */
  (function () {
    var lb = $('#lb'), stage = $('#lbStage'), load = $('#lbLoad'),
        tEl = $('#lbT'), sEl = $('#lbS'), closeBtn = $('#lbClose'), scrim = $('#lbScrim');
    var opener = null, isOpen = false;
    // Created here rather than in the markup: an <img> without a src is invalid HTML.
    var img = new Image();
    img.id = 'lbImg'; img.alt = '';
    $('#lbFig').appendChild(img);

    function flip(rect) {
      var to = stage.getBoundingClientRect();
      if (!rect || !to.width || !to.height) return null;
      return 'translate(' + ((rect.left + rect.width/2) - (to.left + to.width/2)) + 'px,' +
             ((rect.top + rect.height/2) - (to.top + to.height/2)) + 'px) scale(' +
             (rect.width/to.width) + ',' + (rect.height/to.height) + ')';
    }
    function open(el) {
      var src = CERTS[el.getAttribute('data-cert')]; if (!src) return;
      opener = el; isOpen = true;
      var from = el.getBoundingClientRect();
      tEl.textContent = el.getAttribute('data-title') || '';
      sEl.textContent = el.getAttribute('data-sub') || '';
      img.alt = (el.getAttribute('data-title') || 'Certificate') + ' — full-size image';
      img.removeAttribute('data-ready'); load.hidden = false;
      lb.hidden = false; lock(true);
      void lb.offsetWidth;
      lb.setAttribute('data-open','1');
      img.src = src;
      var ok = function () { img.setAttribute('data-ready','1'); load.hidden = true; };
      if (img.decode) img.decode().then(ok).catch(ok); else if (img.complete) ok(); else { img.onload = ok; img.onerror = ok; }
      if (!reduced()) {
        var t = flip(from);
        if (t) {
          stage.style.transition='none'; stage.style.transform=t; stage.style.opacity='.4';
          void stage.offsetWidth;
          stage.style.transition='transform 260ms cubic-bezier(.16,1,.30,1), opacity 180ms cubic-bezier(.25,1,.50,1)';
          stage.style.transform='none'; stage.style.opacity='1';
        }
      }
      closeBtn.focus({ preventScroll:true });
    }
    function shut() {
      if (!isOpen) return;
      isOpen = false;
      var op = opener;
      var fin = function () {
        lb.setAttribute('data-open','0'); lb.hidden = true;
        stage.style.transition=''; stage.style.transform=''; stage.style.opacity='';
        scrim.style.opacity=''; img.removeAttribute('src');
        lock(false);
        if (op) op.focus({ preventScroll:true });
        opener = null;
      };
      var t = (!reduced() && op) ? flip(op.getBoundingClientRect()) : null;
      if (!t) { fin(); return; }
      stage.style.transition='transform 220ms cubic-bezier(.16,1,.30,1), opacity 160ms cubic-bezier(.25,1,.50,1)';
      stage.style.transform=t; stage.style.opacity='0'; scrim.style.opacity='0';
      var done=false, end=function(){ if(done)return; done=true; fin(); };
      stage.addEventListener('transitionend', end, { once:true });
      setTimeout(end, 320);
    }
    $$('[data-cert]').forEach(function (el) {
      if (!el.closest('#bcGrid')) el.addEventListener('click', function () { open(el); });
    });
    // The photo reel rebuilds its copies when a filter changes, so listen on the row.
    $('#bcGrid').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-cert]') : null;
      if (b) open(b);
    });
    // Case-study screens are rendered later, so listen on their container.
    $('#dBody').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-cert]') : null;
      if (b) open(b);
    });
    closeBtn.addEventListener('click', shut);
    scrim.addEventListener('click', shut);
    addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); shut(); return; }
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
    });
    addEventListener('resize', function () { if (isOpen) shut(); }, { passive:true });
  })();

  /* ── Message panel — origin-aware, composes a mailto ───────────────── */
  (function () {
    var panel = $('#msg'), openBtn = $('#msgOpen'), closeBtn = $('#msgClose'),
        form = $('#msgForm'), note = $('#msgNote'), live = $('#msgLive');
    var open = false, t = null;
    var base = note.textContent;

    function set(v) {
      open = v;
      if (v) {
        var r = openBtn.getBoundingClientRect(), p = panel.getBoundingClientRect();
        panel.style.transformOrigin =
          Math.max(0, Math.min(p.width, r.left + r.width/2 - p.left)) + 'px ' +
          Math.max(0, Math.min(p.height, r.top + r.height/2 - p.top)) + 'px';
      }
      panel.setAttribute('data-open', v ? '1':'0');
      openBtn.setAttribute('aria-expanded', String(v));
      if (v) setTimeout(function () { $('#mn').focus(); }, 60);
      else openBtn.focus();
    }
    openBtn.setAttribute('aria-expanded','false');
    openBtn.addEventListener('click', function () { set(!open); });
    closeBtn.addEventListener('click', function () { set(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#mn').value.trim(), emEl = $('#me'), em = emEl.value.trim(), m = $('#mm').value.trim();
      clearTimeout(t);
      // The form is novalidate so we control the message, but the browser's
      // own type="email" check still decides whether the address is valid.
      var badEmail = em && !emEl.checkValidity();
      if (!n || !em || !m || badEmail) {
        note.textContent = badEmail ? 'That email address does not look right. Please check it.'
                                    : 'Please fill in your name, email, and message first.';
        live.textContent = badEmail ? 'Email address is invalid.' : 'Form incomplete.';
        (!n ? $('#mn') : (!em || badEmail) ? emEl : $('#mm')).focus();
        t = setTimeout(function () { note.textContent = base; live.textContent=''; }, 4000);
        return;
      }
      location.href = 'mailto:marjonvera2005@gmail.com?subject=' +
        encodeURIComponent('Portfolio enquiry from ' + n) +
        '&body=' + encodeURIComponent(m + '\n\n—\n' + n + '\n' + em);
      note.textContent = 'Opening your email app…';
      live.textContent = 'Your email app is opening with the message ready.';
      t = setTimeout(function () { note.textContent = base; live.textContent=''; }, 2600);
    });
  })();
})();
