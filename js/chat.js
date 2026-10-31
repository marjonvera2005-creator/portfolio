/* ══════════════════════════════════════════════════════════════════════
   MOCHI — CHAT BEHAVIOUR
   A scripted portfolio assistant: no server, no AI service, no keys.
   Answers come from CHAT (chat-data.js) and PROJECTS (data.js), so it
   can only say what the portfolio already says.

   Loaded after main.js: it reuses the work-card buttons and the message
   panel that main.js sets up, by clicking them, rather than duplicating
   their logic. Kept in its own file and IIFE so a bug here can never
   break the rest of the site.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var mq = matchMedia('(prefers-reduced-motion: reduce)');

  var root = $('#bot'), fab = $('#botFab'), panel = $('#botPanel'), closeBtn = $('#botClose'),
      log = $('#botLog'), form = $('#botForm'), input = $('#botIn'),
      hint = $('#botHint'), badge = $('#botBadge');
  if (!root || typeof CHAT === 'undefined') return;

  var open = false, started = false, pending = null;

  // Storage can throw (private mode, blocked site data); Mochi works without it.
  function store(kind, k, v) {
    try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch (e) {}
    return null;
  }

  /* ── Understanding a question ──────────────────────────────────────── */
  function norm(t) {
    return ' ' + t.toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9é]+/g, ' ').trim() + ' ';
  }
  function hits(t, keys) {
    var n = 0;
    keys.forEach(function (k) {
      if (t.indexOf(' ' + k + ' ') >= 0 || t.indexOf(' ' + k + 's ') >= 0) n += k.split(' ').length;
    });
    return n;
  }
  // Returns { topic } or { project } or null (nothing matched).
  function understand(text) {
    var t = norm(text), best = null, top = 0;
    PROJECTS.forEach(function (p) {
      var keys = (CHAT.PROJECT_KEYS[p.id] || []).concat([p.title.toLowerCase()]);
      var s = hits(t, keys) * 2;   // naming a project beats asking about projects in general
      if (s > top) { top = s; best = { project: p }; }
    });
    CHAT.topics.forEach(function (tp) {
      // "strong" keys are decisive words ("alone", "different") that should
      // beat generic ones like "project" or "marjon", so they count triple.
      var s = (hits(t, tp.keys) + 3 * hits(t, tp.strong || [])) * (tp.weight || 1);
      if (s > top) { top = s; best = { topic: tp }; }
    });
    return best;
  }
  function topicById(id) {
    var f = null;
    CHAT.topics.forEach(function (tp) { if (tp.id === id) f = tp; });
    return f;
  }

  /* ── Building replies ──────────────────────────────────────────────── */
  function projectReply(p) {
    var status = '';
    p.meta.forEach(function (m) { if (m[0] === 'Status') status = m[1]; });
    return {
      answer: '<b>' + p.title + '</b> · ' + p.tag + (status ? ' · ' + status : '') + '<br>' + p.short +
        (p.live ? '<br>Try it live: <a href="' + p.live + '" target="_blank" rel="noopener noreferrer">' + p.live.replace(/^https?:\/\//, '') + '</a>' : '') +
        '<br><span class="bot__muted">Built with ' + p.chips.slice(0, 4).join(', ') + '.</span>',
      actions: [{ type: 'project', value: p.id, label: 'Open the ' + p.title + ' case study' }],
      next: ['projects', 'skills', 'contact']
    };
  }
  function listReply(tp) {
    return {
      answer: 'Marjon has built ' + PROJECTS.length + ' projects:<ul>' + PROJECTS.map(function (p) {
        return '<li><b>' + p.title + '</b>: ' + p.tag + '</li>';
      }).join('') + '</ul>Pick one to read its case study.',
      actions: PROJECTS.map(function (p) { return { type: 'project', value: p.id, label: p.title }; }),
      next: tp.next
    };
  }
  function replyFor(match) {
    if (!match) return CHAT.fallback;
    if (match.project) return projectReply(match.project);
    return match.topic.list ? listReply(match.topic) : match.topic;
  }

  /* ── Drawing messages ──────────────────────────────────────────────── */
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addUser(text) {
    var p = document.createElement('p');
    p.className = 'bot__msg bot__msg--me';
    p.textContent = text;   // visitor text is never parsed as HTML
    log.appendChild(p);
    scrollDown();
  }

  function addBot(r) {
    // Only the latest reply keeps its follow-up questions.
    var old = log.querySelector('.bot__next');
    if (old) old.parentNode.removeChild(old);

    var wrap = document.createElement('div');
    wrap.className = 'bot__msg bot__msg--bot';
    wrap.innerHTML = r.answer;
    if (r.actions && r.actions.length) {
      var acts = document.createElement('p');
      acts.className = 'bot__acts';
      r.actions.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bot__act'; b.textContent = a.label;
        b.addEventListener('click', function () { act(a); });
        acts.appendChild(b);
      });
      wrap.appendChild(acts);
    }
    log.appendChild(wrap);
    if (r.next && r.next.length) {
      var next = document.createElement('p');
      next.className = 'bot__next';
      r.next.forEach(function (id) { next.appendChild(chip(id)); });
      log.appendChild(next);
    }
    scrollDown();
  }

  function chip(id) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'bot__chip'; b.textContent = CHAT.labels[id];
    b.addEventListener('click', function () {
      var tp = topicById(id);
      ask(CHAT.labels[id], { topic: tp });
    });
    return b;
  }

  // A short "typing" pause so a reply doesn't snap in before the question
  // has visibly landed. No pause at all under reduced motion.
  function respond(r) {
    finishPending();
    if (mq.matches) { addBot(r); return; }
    var dots = document.createElement('p');
    dots.className = 'bot__msg bot__msg--bot bot__typing';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(dots);
    scrollDown();
    pending = { r: r, dots: dots, t: setTimeout(finishPending, 520) };
  }
  function finishPending() {
    if (!pending) return;
    var p = pending; pending = null;
    clearTimeout(p.t);
    if (p.dots.parentNode) p.dots.parentNode.removeChild(p.dots);
    addBot(p.r);
  }

  function ask(text, match) {
    addUser(text);
    respond(replyFor(match === undefined ? understand(text) : match));
  }

  /* ── Actions inside replies ────────────────────────────────────────── */
  function act(a) {
    if (a.type === 'project') {
      var card = $('.work__open[data-id="' + a.value + '"]');
      set(false, true);
      if (card) card.click();   // main.js opens the case study and returns focus to this card
    } else if (a.type === 'message') {
      $('#msgOpen').click();    // the listener below closes Mochi
    } else if (a.type === 'goto') {
      // Click the matching menu link, so the jump gets the same section
      // switch as the menu (main.js) instead of a second implementation.
      var link = $('#navLinks a[href="#' + a.value + '"]'), el = document.getElementById(a.value);
      set(false, true);
      if (link) link.click();
      else if (el) el.scrollIntoView({ behavior: mq.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  /* ── Open / close ──────────────────────────────────────────────────── */
  function set(v, quiet) {
    if (v === open) return;
    open = v;
    root.setAttribute('data-open', v ? '1' : '0');
    fab.setAttribute('aria-expanded', String(v));
    hideHint();
    if (v) {
      // Only one corner panel at a time: Mochi replaces the message form.
      var msg = $('#msg');
      if (msg && msg.getAttribute('data-open') === '1') $('#msgClose').click();
      if (badge) { badge.hidden = true; store('localStorage', 'mv_bot_seen', '1'); }
      if (!started) { started = true; addBot({ answer: CHAT.welcome, next: CHAT.starters }); }
      // On touch screens, focusing the box would throw up the keyboard over
      // the welcome message, so focus the close button there instead.
      setTimeout(function () {
        (matchMedia('(pointer: fine)').matches ? input : closeBtn).focus({ preventScroll: true });
      }, 60);
    } else {
      finishPending();
      if (!quiet) fab.focus({ preventScroll: true });
    }
  }

  fab.addEventListener('click', function () { set(!open); });
  closeBtn.addEventListener('click', function () { set(false); });
  hint.addEventListener('click', function () { set(true); });
  $('#msgOpen').addEventListener('click', function () { set(false, true); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open && $('#lb').hidden) set(false);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = '';
    ask(text.slice(0, 200));
  });

  /* ── First impression: badge until the first open, greeting once per visit ── */
  if (store('localStorage', 'mv_bot_seen') && badge) badge.hidden = true;

  var hintT = null;
  function hideHint() {
    clearTimeout(hintT);
    root.removeAttribute('data-hint');
  }
  if (!store('sessionStorage', 'mv_bot_hint')) {
    hintT = setTimeout(function () {
      if (open) return;
      store('sessionStorage', 'mv_bot_hint', '1');
      root.setAttribute('data-hint', '1');
      hintT = setTimeout(hideHint, 6000);
    }, 2500);
  }
})();
