// reef42 glossary: every term from terms.json (also used by shared/glossary.js) in alphabetical order, with search.
// #/<id> scrolls to a term and highlights it.
(() => {
  'use strict';

  const DATA_URL = 'terms.json';
  const LANG_KEY = 'reef42-lang';
  const TEXT = {
    en: {
      app: 'Glossary', lead: 'Reef keeping words you meet across reef42, explained in plain language. Underlined words on the other pages open their meaning here.',
      search: 'Search terms…', count: '{n} terms', none: 'No term matches your search.', see: 'See also:', other: 'Hungarian: {x}',
      letters: 'Jump to letter', loadError: 'Could not load the glossary.', feedback: 'missing a word? write to us:'
    },
    hu: {
      app: 'Szótár', lead: 'A reef42 oldalain előforduló akvarista szakszavak közérthetően. A többi oldalon aláhúzott szavak jelentése innen jön.',
      search: 'Keresés a szavak között…', count: '{n} szó', none: 'Nincs a keresésnek megfelelő szó.', see: 'Lásd még:', other: 'Angolul: {x}',
      letters: 'Ugrás betűre', loadError: 'Nem sikerült betölteni a szótárat.', feedback: 'hiányzik egy szó? írj nekünk:'
    }
  };

  const app = document.getElementById('app');
  const ls = (get, k, v) => { try { if (get) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  let lang = new URLSearchParams(location.search).get('lang') || ls(true, LANG_KEY) ||
    ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';
  let terms = [];
  let query = '';

  const t = (k, vars) => {
    let s = TEXT[lang][k] || TEXT.en[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const loc = (x) => x[lang] || x.en;
  const other = (x) => x[lang === 'hu' ? 'en' : 'hu'];
  // Accented capitals share a letter with their base (Á → A), as in a printed index.
  const letterOf = (x) => norm(loc(x).name).charAt(0).toUpperCase();
  const byId = (id) => terms.find((x) => x.id === id);

  function renderChrome() {
    document.documentElement.lang = lang;
    document.title = t('app') + ' – reef42';
    document.getElementById('brandText').textContent = t('app');
    document.getElementById('footer').innerHTML = '<div class="inner"><span>reef42</span><span>' + esc(t('feedback')) +
      ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
  }

  function termHtml(x) {
    const d = loc(x), o = other(x);
    const see = (x.see || []).map(byId).filter(Boolean)
      .map((s) => '<a href="#/' + encodeURIComponent(s.id) + '">' + esc(loc(s).name) + '</a>').join(', ');
    return '<article class="term" id="t-' + esc(x.id) + '" tabindex="-1"><h3>' + esc(d.name) + '</h3>' +
      (o && o.name !== d.name ? '<p class="alt">' + esc(t('other', { x: o.name })) + '</p>' : '') +
      '<p>' + esc(d.def) + '</p>' + (see ? '<p class="see">' + esc(t('see')) + ' ' + see + '</p>' : '') + '</article>';
  }
  function matches(x) {
    const q = norm(query.trim());
    if (!q) return true;
    return norm([x.hu.name, x.en.name, loc(x).def].join(' ')).includes(q);
  }
  function renderList() {
    const items = terms.filter(matches).sort((a, b) => loc(a).name.localeCompare(loc(b).name, lang));
    const groups = [];
    items.forEach((x) => {
      const l = letterOf(x);
      if (!groups.length || groups[groups.length - 1].l !== l) groups.push({ l, xs: [] });
      groups[groups.length - 1].xs.push(x);
    });
    document.getElementById('count').textContent = t('count', { n: items.length });
    document.getElementById('letters').innerHTML = groups.map((g) => '<a href="#/" data-letter="' + esc(g.l) + '">' + esc(g.l) + '</a>').join('');
    document.getElementById('list').innerHTML = items.length
      ? groups.map((g) => '<section class="group" id="l-' + esc(g.l) + '"><h2 class="letter">' + esc(g.l) + '</h2><div class="terms">' + g.xs.map(termHtml).join('') + '</div></section>').join('')
      : '<p class="empty">' + esc(t('none')) + '</p>';
  }
  function render() {
    renderChrome();
    app.innerHTML = '<h1>' + esc(t('app')) + '</h1><p class="lead">' + esc(t('lead')) + '</p>' +
      '<div class="filters"><input class="search" id="q" type="search" autocomplete="off" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '" value="' + esc(query) + '"></div>' +
      '<nav class="letters" id="letters" aria-label="' + esc(t('letters')) + '"></nav>' +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    renderList();
  }

  // #/<id>: scroll to the term (clearing a search that hides it) and highlight it.
  function focusHash() {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    app.querySelectorAll('.term.hl').forEach((el) => el.classList.remove('hl'));
    if (!id) return;
    if (!byId(id)) return;
    let el = document.getElementById('t-' + id);
    if (!el && query) { query = ''; render(); el = document.getElementById('t-' + id); }
    if (!el) return;
    el.classList.add('hl');
    el.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  }

  app.addEventListener('input', (e) => { if (e.target.id === 'q') { query = e.target.value; renderList(); } });
  app.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-letter]');
    if (!a) return;
    e.preventDefault();
    const sec = document.getElementById('l-' + a.dataset.letter);
    if (sec) sec.scrollIntoView({ block: 'start' });
  });
  window.addEventListener('hashchange', focusHash);

  reef42Lang.mount(document.getElementById('langToggle'), {
    get: () => lang,
    set: (code) => { lang = code; ls(false, LANG_KEY, lang); render(); focusHash(); }
  });

  renderChrome();
  fetch(DATA_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((db) => {
    terms = db.terms || [];
    render();
    focusHash();
  }).catch(() => { app.innerHTML = '<p>' + esc(t('loadError')) + '</p>'; });
})();
