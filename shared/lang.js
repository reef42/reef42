// reef42 language picker: a flag button that opens a language menu. Shared by every page.
// Usage: var picker = reef42Lang.mount(buttonElement, { get: function () { return lang; }, set: function (code) { ... } });
//        call picker.update() whenever the page re-renders after a language change.
(function () {
  function svg(s) { return 'data:image/svg+xml,' + encodeURIComponent(s); }
  var FLAGS = {
    hu: svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 4"><path fill="#cd2a3e" d="M0 0h6v4H0z"/><path fill="#fff" d="M0 1.33h6v1.34H0z"/><path fill="#436f4d" d="M0 2.67h6V4H0z"/></svg>'),
    en: svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">' +
      '<clipPath id="t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath>' +
      '<path fill="#012169" d="M0 0h60v30H0z"/><path stroke="#fff" stroke-width="6" d="m0 0 60 30m0-30L0 30"/>' +
      '<path stroke="#c8102e" stroke-width="4" d="m0 0 60 30m0-30L0 30" clip-path="url(#t)"/>' +
      '<path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#c8102e" stroke-width="6" d="M30 0v30M0 15h60"/></svg>')
  };
  var LANGS = [{ code: 'hu', name: 'Magyar' }, { code: 'en', name: 'English' }];
  var LABEL = { hu: 'Nyelv', en: 'Language' };
  var CHEVRON = '<svg class="langchev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CSS =
    '.langsel{position:relative;flex:none}' +
    '.langsel>.lang{display:inline-flex;align-items:center;gap:6px;padding:5px 10px}' +
    '.langflag{display:block;width:21px;height:14px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.18)}' +
    '.langchev{opacity:.7;transition:transform .15s}' +
    '.lang[aria-expanded="true"] .langchev{transform:rotate(180deg)}' +
    '.langmenu{position:absolute;right:0;top:calc(100% + 6px);z-index:50;min-width:150px;margin:0;padding:4px;list-style:none;' +
      'background:var(--surface,var(--card,#fff));border:1px solid var(--border,var(--line,#ccc));border-radius:10px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);text-transform:none}' +
    '.langmenu[hidden]{display:none}' +
    '.langmenu button{display:flex;align-items:center;gap:10px;width:100%;font:inherit;font-size:.92rem;color:var(--text);' +
      'background:none;border:0;border-radius:6px;padding:7px 10px;cursor:pointer;text-align:left}' +
    '.langmenu button:hover,.langmenu button:focus-visible{background:var(--surface-2,var(--card-hover,#eee));outline:none}' +
    '.langmenu button[aria-checked="true"]{font-weight:700}' +
    '.langmenu .langcheck{margin-left:auto;color:var(--accent,var(--text))}';

  function injectCss() {
    if (document.getElementById('reef42-lang-css')) return;
    var st = document.createElement('style');
    st.id = 'reef42-lang-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function flag(code) { return '<img class="langflag" src="' + FLAGS[code] + '" alt="" width="21" height="14">'; }

  function mount(btn, opts) {
    injectCss();
    var wrap = document.createElement('div');
    wrap.className = 'langsel';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    var menuId = (btn.id || 'lang') + '-menu';
    var menu = document.createElement('ul');
    menu.className = 'langmenu';
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML = LANGS.map(function (l) {
      return '<li role="none"><button type="button" role="menuitemradio" lang="' + l.code + '" data-lang="' + l.code + '">' +
        flag(l.code) + '<span>' + l.name + '</span><span class="langcheck" aria-hidden="true"></span></button></li>';
    }).join('');
    wrap.appendChild(menu);
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-controls', menuId);
    btn.setAttribute('aria-expanded', 'false');
    var items = Array.prototype.slice.call(menu.querySelectorAll('button'));

    function update() {
      var cur = opts.get() === 'hu' ? 'hu' : 'en';
      var name = LANGS.filter(function (l) { return l.code === cur; })[0].name;
      btn.innerHTML = flag(cur) + CHEVRON;
      btn.removeAttribute('lang');
      btn.setAttribute('aria-label', LABEL[cur] + ': ' + name);
      btn.title = LABEL[cur];
      items.forEach(function (it) {
        var on = it.dataset.lang === cur;
        it.setAttribute('aria-checked', on);
        it.querySelector('.langcheck').textContent = on ? '✓' : '';
      });
    }
    function open(focusItem) {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      if (focusItem) (menu.querySelector('[aria-checked="true"]') || items[0]).focus();
    }
    function close(focusBtn) {
      if (menu.hidden) return;
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hidden) open(e.detail === 0); else close(false);
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(true); }
    });
    menu.addEventListener('click', function (e) {
      var it = e.target.closest('button[data-lang]');
      if (!it) return;
      e.stopPropagation();
      close(true);
      if (it.dataset.lang !== opts.get()) opts.set(it.dataset.lang);
      update();
    });
    menu.addEventListener('keydown', function (e) {
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(false); });

    update();
    return { update: update, close: close };
  }

  window.reef42Lang = { mount: mount };
})();
