// reef42 glossary hints, shared by every page: marks the first use of each glossary term inside <main> and shows its
// meaning on hover, focus or tap, with a link to the glossary. Terms and match patterns: glossary/terms.json.
// Load with defer. Areas with data-no-gloss (and links, buttons, headings, form controls, dialogs) are left alone.
(function () {
  var BASE = new URL('../glossary/', document.currentScript.src);
  var SKIP = 'a,button,input,textarea,select,option,label,summary,h1,h2,h3,code,pre,script,style,svg,dialog,.tag,.chip,.r42-term,.r42-pop,[contenteditable],[data-no-gloss]';
  var TEXT = { hu: { open: 'Megnyitás a szótárban →' }, en: { open: 'Open in the glossary →' } };
  // Hungarian suffixes are part of the patterns; a match may not start or end inside a word (or right after a hyphen).
  var B = '(?<![\\p{L}\\p{N}-])', E = '(?![\\p{L}\\p{N}])';
  var CSS =
    '.r42-term{text-decoration:underline dotted;text-decoration-thickness:1px;text-underline-offset:3px;cursor:help;border-radius:2px}' +
    '.r42-term:hover,.r42-term[aria-expanded="true"]{text-decoration-style:solid;text-decoration-color:var(--accent,currentColor)}' +
    '.r42-term:focus-visible{outline:2px solid var(--accent,currentColor);outline-offset:1px}' +
    '.r42-pop{position:fixed;z-index:1000;box-sizing:border-box;padding:12px 14px;background:var(--surface,var(--card,#fff));' +
      'color:var(--text,#111);border:1px solid var(--border,var(--line,#ccc));border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);' +
      'font-size:.9rem;line-height:1.45;font-weight:400;font-style:normal;text-align:left;text-transform:none;letter-spacing:normal}' +
    '.r42-pop[hidden]{display:none}' +
    '.r42-pop strong{display:block;margin:0 0 4px;font-size:.95rem}' +
    '.r42-pop p{margin:0 0 8px}' +
    '.r42-pop a{color:var(--accent,inherit);font-weight:600}';

  var terms = null, byId = {}, rx = {};
  var root = null, obs = null, timer = 0;
  var pop = null, cur = null, showT = 0, hideT = 0, pressAt = 0;

  function lang() { return document.documentElement.lang === 'hu' ? 'hu' : 'en'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function compile(l) {
    if (rx[l]) return rx[l];
    var out = [];
    terms.forEach(function (t) {
      var m = t.match || {};
      try {
        if (m[l] && m[l].length) out.push({ t: t, re: new RegExp(B + '(?:' + m[l].join('|') + ')' + E, 'iu') });
        if (m.abbr && m.abbr.length) out.push({ t: t, re: new RegExp(B + '(?:' + m.abbr.join('|') + ')' + E, 'u') });
      } catch (e) { /* a broken pattern only disables that term */ }
    });
    return (rx[l] = out);
  }

  /* ---------- marking ---------- */
  function scan() {
    timer = 0;
    if (cur && !cur.isConnected) hide();
    if (!terms || !root) return;
    var list = compile(lang());
    var used = {};
    root.querySelectorAll('.r42-term').forEach(function (el) { used[el.dataset.term] = true; });
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        return p && n.nodeValue.trim() && !p.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    if (obs) obs.disconnect();
    nodes.forEach(function (n) { mark(n, list, used); });
    observe();
  }
  // Wraps the earliest (then longest) match of every term not used yet, one after the other along the text node.
  function mark(node, list, used) {
    while (node) {
      var s = node.nodeValue, best = null;
      for (var i = 0; i < list.length; i++) {
        if (used[list[i].t.id]) continue;
        var m = list[i].re.exec(s);
        if (m && (!best || m.index < best.i || (m.index === best.i && m[0].length > best.len))) best = { i: m.index, len: m[0].length, t: list[i].t };
      }
      if (!best) return;
      used[best.t.id] = true;
      var word = node.splitText(best.i);
      var rest = word.splitText(best.len);
      var el = document.createElement('span');
      el.className = 'r42-term';
      el.dataset.term = best.t.id;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-expanded', 'false');
      word.parentNode.replaceChild(el, word);
      el.appendChild(word);
      node = rest;
    }
  }
  function observe() {
    if (!obs) obs = new MutationObserver(function () { if (!timer) timer = setTimeout(scan, 80); });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- popover ---------- */
  function popEl() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'r42-pop';
    pop.id = 'r42-pop';
    pop.setAttribute('role', 'dialog');
    pop.hidden = true;
    pop.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    pop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideSoon(); });
    document.body.appendChild(pop);
    return pop;
  }
  function show(el) {
    clearTimeout(hideT);
    clearTimeout(showT);
    var t = byId[el.dataset.term];
    if (!t) return;
    var l = lang(), d = t[l] || t.en, p = popEl();
    if (cur && cur !== el) cur.setAttribute('aria-expanded', 'false');
    cur = el;
    el.setAttribute('aria-expanded', 'true');
    el.setAttribute('aria-controls', 'r42-pop');
    p.lang = l;
    p.setAttribute('aria-label', d.name);
    p.innerHTML = '<strong>' + esc(d.name) + '</strong><p>' + esc(d.def) + '</p><a href="' + esc(BASE.href + '#/' + t.id) + '">' + esc(TEXT[l].open) + '</a>';
    p.hidden = false;
    place();
  }
  function hide() {
    clearTimeout(hideT);
    clearTimeout(showT);
    if (pop) pop.hidden = true;
    if (cur) cur.setAttribute('aria-expanded', 'false');
    cur = null;
  }
  function hideSoon() { clearTimeout(hideT); hideT = setTimeout(hide, 250); }
  // Below the term's first line box, or above it when there is no room; kept inside the viewport.
  function place() {
    if (!cur || !pop || pop.hidden) return;
    if (!cur.isConnected) { hide(); return; }
    var r = cur.getClientRects()[0] || cur.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var w = Math.min(320, vw - 16);
    pop.style.width = w + 'px';
    var h = pop.offsetHeight;
    var top = r.bottom + 6;
    if (top + h > vh - 8 && r.top - h - 6 >= 8) top = r.top - h - 6;
    pop.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
    pop.style.top = Math.max(8, top) + 'px';
  }
  var termOf = function (e) { return e.target && e.target.closest ? e.target.closest('.r42-term') : null; };

  function bind() {
    document.addEventListener('pointerover', function (e) {
      var el = termOf(e);
      if (!el || e.pointerType !== 'mouse') return;
      clearTimeout(hideT);
      if (el !== cur) { clearTimeout(showT); showT = setTimeout(function () { show(el); }, 120); }
    });
    document.addEventListener('pointerout', function (e) {
      var el = termOf(e);
      if (!el || e.pointerType !== 'mouse' || el.contains(e.relatedTarget)) return;
      clearTimeout(showT);
      hideSoon();
    });
    // Capture phase: a tap on a term must not reach the page's own click handlers.
    document.addEventListener('click', function (e) {
      var el = termOf(e);
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        // With a mouse the hover already opened it, so a click keeps it open; a second tap closes it.
        if (cur === el && pop && !pop.hidden && e.pointerType !== 'mouse') hide(); else show(el);
        return;
      }
      if (pop && !pop.hidden && !pop.contains(e.target)) hide();
    }, true);
    document.addEventListener('keydown', function (e) {
      var el = termOf(e);
      if (el && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.stopPropagation();
        if (cur === el && pop && !pop.hidden) hide(); else show(el);
      } else if (e.key === 'Escape' && cur) {
        var back = cur;
        hide();
        back.focus();
      }
    }, true);
    // A press focuses the term too; the click that follows decides, so focus from a press does not open it.
    document.addEventListener('pointerdown', function (e) { if (termOf(e)) pressAt = Date.now(); }, true);
    document.addEventListener('focusin', function (e) {
      var el = termOf(e);
      if (el) { if (Date.now() - pressAt > 600) show(el); }
      else if (cur && pop && !pop.contains(e.target)) hide();
    });
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
  }

  function start() {
    root = document.querySelector('main');
    if (!root || root.hasAttribute('data-no-gloss')) return;
    fetch(new URL('terms.json', BASE)).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (db) {
      terms = db.terms || [];
      terms.forEach(function (t) { byId[t.id] = t; });
      var st = document.createElement('style');
      st.id = 'reef42-gloss-css';
      st.textContent = CSS;
      document.head.appendChild(st);
      bind();
      scan();
    }).catch(function () { /* without the glossary the page works as before */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
