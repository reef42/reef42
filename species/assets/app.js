// reef42 species database: overview → category (#/fish) → type (#/fish/clownfish) → species card (#/fish/clownfish/<id>).
(() => {
  'use strict';

  // Built from databases/data/ by species/tools/build.mjs.
  const DATA_URL = '../databases/reef42_species.json';
  const FD_URL = '../fishy-doctor/#/d/';
  const LANG_KEY = 'reef42-lang';
  const CATS = ['fish', 'coral', 'invertebrate'];
  const SLUG = { fish: 'fish', coral: 'corals', invertebrate: 'inverts' };
  const BY_SLUG = { fish: 'fish', corals: 'coral', inverts: 'invertebrate' };
  const ICON = { fish: 'fish', coral: 'coral', invertebrate: 'invert' };
  const CARE_ORDER = ['easy', 'moderate', 'difficult', 'expert'];
  const CARE_CLASS = { easy: 'easy', moderate: 'moderate', difficult: 'hard', expert: 'bad' };
  const REEF_CLASS = { 'reef-safe': 'easy', 'with-caution': 'hard', 'not-reef-safe': 'bad' };

  const TEXT = {
    en: {
      app: 'Species', home: 'Overview', fish: 'Fish', coral: 'Corals', invertebrate: 'Inverts',
      lead_home: 'Care cards for saltwater fish, corals and invertebrates: only what matters for keeping them.',
      open: 'Browse {n} species →',
      lead_fish: 'Care cards for saltwater fish: size, tank, behaviour and feeding.',
      lead_coral: 'Care cards for corals and macroalgae: light, flow, placement and what to watch for.',
      lead_invertebrate: 'Care cards for shrimps, crabs, snails, sea stars, urchins, clams, anemones and other invertebrates.',
      search: 'Search by name…', all: 'All', count: '{n} species', none: 'No species match the filters.', groupCount: '{n} types',
      photo: 'Photo', back: '← {x}', notFound: 'Species not found.', loadError: 'Could not load the species data.',
      size: 'Size', upTo: 'up to {n}', from: 'from {n}', tankSize: 'Tank size', tankMin: 'min. {n} L', tankIdeal: 'ideal {n} L', minTank: 'Minimum tank', liters: '{n} L',
      lifespan: 'Lifespan', wild: 'wild: {n} years', aquarium: 'aquarium: {n} years', care: 'Care level', reef: 'Reef compatibility', utility: 'Role in the tank',
      type: 'Growth form', light: 'Light', flow: 'Flow', growth: 'Growth', placement: 'Placement', aggression: 'Aggression', feeding: 'Feeding',
      behavior: 'Behaviour', origin: 'Origin', notes: 'Good to know', diseases: 'Diseases and pests to watch for',
      fdHint: 'Linked items open in Fishy Doctor.', sources: 'Sources',
      notRec: 'Reef42: not recommended', notRecText: 'In our view this species does not do well long-term in most home aquariums.',
      draft: 'Draft data, under review – always check before buying.', feedback: 'corrections and ideas:',
      noticeTitle: 'Under review',
      noticeText: 'The species database is currently being reviewed. Care cards may contain inaccuracies or missing and outdated data, and the content keeps changing as we check it.',
      noticeCheck: 'Always double-check the details from several sources before you buy or decide anything.',
      noticeMail: 'Spotted a mistake? Write to us:', noticeOk: 'Got it',
      fitTitle: 'Does it suit your tank?', fitFor: 'Estimate for', fitAdd: 'Add to the livestock', fitOnly: 'Hide not recommended',
      mine: 'My species', mineLead: 'Living in your tank: {tank}.', mineEdit: 'Edit the livestock in Tank Log →', mineEmpty: 'No livestock in this tank yet.',
      fitHint: 'Add your tank in Tank Log, and every species will show whether it suits it.', fitHintGo: 'Set up my tank →', fitHide: 'Hide',
      fitCta: 'Add your tank (type, size, start date and livestock) in Tank Log to see whether this species suits it.',
      fitNote: 'Estimate. If you want to know more, let’s talk about it on {discord}.', discordWord: 'Discord',
      fitPlanAdd: 'Add to the plan', fitNow: 'With your current livestock', fitWithPlan: 'With the planned livestock too', planTag: 'with plan',
      adult: 'Adult', juvenile: 'Juvenile', searchAll: 'Search all species…'
    },
    hu: {
      app: 'Fajok', home: 'Áttekintés', fish: 'Halak', coral: 'Korallok', invertebrate: 'Gerinctelenek',
      lead_home: 'Adatlapok tengeri halakról, korallokról és gerinctelenekről: csak az, ami a tartáshoz tényleg számít.',
      open: '{n} faj megtekintése →',
      lead_fish: 'Adatlapok tengeri halakról: méret, akvárium, viselkedés és táplálkozás.',
      lead_coral: 'Adatlapok korallokról és makroalgákról: fény, áramlás, elhelyezés és amire figyelni kell.',
      lead_invertebrate: 'Adatlapok garnélákról, rákokról, csigákról, tengeri csillagokról, sünökről, kagylókról, anemónákról és más gerinctelenekről.',
      search: 'Keresés név alapján…', all: 'Mind', count: '{n} faj', none: 'Nincs a szűrésnek megfelelő faj.', groupCount: '{n} típus',
      photo: 'Fotó', back: '← {x}', notFound: 'Nincs ilyen faj.', loadError: 'Nem sikerült betölteni a fajadatokat.',
      size: 'Méret', upTo: 'legfeljebb {n}', from: 'legalább {n}', tankSize: 'Akváriumméret', tankMin: 'min. {n} l', tankIdeal: 'ideális: {n} l', minTank: 'Legkisebb akvárium', liters: '{n} l',
      lifespan: 'Élettartam', wild: 'vadon: {n} év', aquarium: 'akváriumban: {n} év', care: 'Tartási nehézség', reef: 'Korallos akváriumba', utility: 'Szerepe az akváriumban',
      type: 'Növekedési forma', light: 'Fényigény', flow: 'Áramlás', growth: 'Növekedés', placement: 'Elhelyezés', aggression: 'Csalánzás, agresszió', feeding: 'Táplálkozás',
      behavior: 'Viselkedés', origin: 'Származás', notes: 'Fontos tudnivalók', diseases: 'Betegségek, kártevők, amikre figyelni kell',
      fdHint: 'A linkelt tételek a Fishy Doctorban nyílnak meg.', sources: 'Források',
      notRec: 'Reef42: nem ajánlott', notRecText: 'Szerintünk ez a faj a legtöbb otthoni akváriumban hosszú távon nem tartható jól.',
      draft: 'Tervezet: az adatok átnézés alatt állnak, vásárlás előtt mindig ellenőrizd.', feedback: 'javítás, ötlet:',
      noticeTitle: 'Átnézés alatt',
      noticeText: 'A fajadatbázis jelenleg átnézés alatt áll. Az adatlapokon előfordulhatnak pontatlanságok, hiányzó vagy elavult adatok, és a tartalom az ellenőrzés során folyamatosan változik.',
      noticeCheck: 'Vásárlás vagy döntés előtt mindig ellenőrizd az adatokat több forrásból is.',
      noticeMail: 'Hibát találtál? Írj nekünk:', noticeOk: 'Értem',
      fitTitle: 'Illik az akváriumodba?', fitFor: 'Becslés ehhez:', fitAdd: 'Hozzáadás a lakókhoz', fitOnly: 'Nem ajánlottak elrejtése',
      mine: 'Fajaim', mineLead: 'Ezek élnek ebben az akváriumodban: {tank}.', mineEdit: 'Lakók szerkesztése a Tank Logban →', mineEmpty: 'Ebben az akváriumban még nincsenek lakók.',
      fitHint: 'Vedd fel az akváriumodat a Tank Logban, és minden fajnál megmutatjuk, illik-e hozzá.', fitHintGo: 'Akváriumom felvétele →', fitHide: 'Elrejtés',
      fitCta: 'Vedd fel az akváriumodat (fajta, méret, indulás és lakók) a Tank Logban, és megmutatjuk, illik-e hozzá ez a faj.',
      fitNote: 'Becslés. Ha többet szeretnél tudni, beszéljünk róla {discord}.', discordWord: 'Discordon',
      fitPlanAdd: 'Hozzáadás tervezéshez', fitNow: 'A mostani lakókkal', fitWithPlan: 'A tervezett lakókkal együtt', planTag: 'tervvel',
      adult: 'Felnőtt', juvenile: 'Fiatal', searchAll: 'Keresés az összes faj között…'
    }
  };

  const app = document.getElementById('app');
  const ls = (get, k, v) => { try { if (get) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  let lang = new URLSearchParams(location.search).get('lang') || ls(true, LANG_KEY) ||
    ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';

  let DB = { categories: {}, enums: {}, species: [], diseases: {} };
  let all = [];
  // Set from the route: the open category, its species, the open type path ([main] or [main, type]) and the category's own filter state.
  let CAT = null;
  let species = [];
  let PATH = [];
  const FILTERS = {};
  CATS.forEach((c) => { FILTERS[c] = { q: '', care: '' }; });
  let filt = FILTERS.fish;
  const listScroll = {};

  const t = (k, vars) => {
    let s = TEXT[lang][k];
    if (s === undefined) s = TEXT.en[k] || k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tr = (o) => (o && typeof o === 'object' ? o[lang] || o.en || o.hu || '' : o || '');
  const lab = (k, v) => (DB.enums[k] && DB.enums[k][v] ? tr(DB.enums[k][v]) : '');
  const num = (n) => (lang === 'hu' ? String(n).replace('.', ',') : String(n));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const title = (s) => (lang === 'hu' && s.name_hu ? s.name_hu : s.name_en || s.scientific_name);
  // Types form a tree: a main category (SPS, LPS…) either holds species directly or has child types (LPS → brain corals…).
  function nodeAt(c, path) {
    let n = { children: DB.categories[c] || {} };
    for (const p of path) { n = n.children && n.children[p]; if (!n) return null; }
    return n;
  }
  function pathOf(c, id) {
    const top = DB.categories[c] || {};
    if (top[id] && !top[id].children) return [id];
    const k = Object.keys(top).find((x) => top[x].children && top[x].children[id]);
    return k ? [k, id] : [];
  }
  const inPath = (path) => (s) => pathOf(s.group, s.category).slice(0, path.length).join('/') === path.join('/');
  const catName = (c, path) => tr(nodeAt(c, path)) || path[path.length - 1];
  const pathHref = (c, path) => '#/' + SLUG[c] + path.map((p) => '/' + encodeURIComponent(p)).join('');
  // {min, max} → "7–11", "7", "up to 11"
  function range(r) {
    if (!r) return '';
    const a = typeof r.min === 'number' ? r.min : null;
    const b = typeof r.max === 'number' ? r.max : null;
    if (a != null && b != null) return a === b ? num(a) : num(a) + '–' + num(b);
    if (b != null) return t('upTo', { n: num(b) });
    if (a != null) return t('from', { n: num(a) });
    return '';
  }

  /* ---------- chrome ---------- */
  let langPicker = null;
  function renderChrome() {
    document.documentElement.lang = lang;
    document.getElementById('brandText').textContent = t('app');
    if (langPicker) langPicker.update();
    renderReview();
    document.getElementById('tabs').innerHTML = '<a href="#/"' + (!CAT ? ' aria-current="page"' : '') + '>' + esc(t('home')) + '</a>' +
      CATS.map((c) => '<a href="#/' + SLUG[c] + '"' + (c === CAT ? ' aria-current="page"' : '') + '>' + esc(t(c)) + '</a>').join('');
    document.getElementById('footer').innerHTML = '<div class="inner"><span>' + esc(t('draft')) + '</span><span>' + esc(t('feedback')) +
      ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
  }

  /* ---------- "under review" notice: opens every time the page is opened ---------- */
  let reviewDlg = null;
  function renderReview() {
    if (!reviewDlg) return;
    reviewDlg.innerHTML = '<form method="dialog"><h2 id="noticeTitle">' + esc(t('noticeTitle')) + '</h2>' +
      '<p>' + esc(t('noticeText')) + '</p><p>' + esc(t('noticeCheck')) + '</p>' +
      '<p class="muted">' + esc(t('noticeMail')) + ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></p>' +
      '<div class="actions"><button class="btn" type="submit" autofocus>' + esc(t('noticeOk')) + '</button></div></form>';
  }
  function openReview() {
    reviewDlg = document.createElement('dialog');
    reviewDlg.className = 'review-dialog';
    reviewDlg.setAttribute('aria-labelledby', 'noticeTitle');
    renderReview();
    document.body.appendChild(reviewDlg);
    // Without <dialog> support the page simply works without the notice.
    if (typeof reviewDlg.showModal !== 'function') { reviewDlg.remove(); reviewDlg = null; return; }
    reviewDlg.addEventListener('close', () => { reviewDlg.remove(); reviewDlg = null; });
    reviewDlg.showModal();
  }

  /* ---------- fit estimate against the user's Tank Log tanks (rules in shared/compat.js) ---------- */
  const TL_KEY = 'reef42-tanklog-v1';
  const TANK_KEY = 'reef42-species-tank';
  const HINT_KEY = 'reef42-species-tankhint';
  const Fit = window.reef42Compat;
  // Tanks with a type and a volume, read from Tank Log's storage (same origin).
  function myTanks() {
    try {
      const d = JSON.parse(ls(true, TL_KEY) || 'null');
      return d && Array.isArray(d.tanks) ? d.tanks.filter((x) => Fit.ready(x)).map((x) => Object.assign({ livestock: [], plan: [] }, x)) : [];
    } catch (e) { return []; }
  }
  function myTank() {
    const xs = myTanks();
    if (!xs.length) return null;
    let id = ls(true, TANK_KEY);
    if (!xs.some((x) => x.id === id)) { try { id = JSON.parse(ls(true, TL_KEY)).active; } catch (e) { id = null; } }
    return xs.find((x) => x.id === id) || xs[0];
  }
  const FIT_TAG = { good: 'easy', caution: 'hard', bad: 'bad' };
  const FIT_ICON = { good: '✓', caution: '!', bad: '✕' };
  // Estimates are cached per render: lists, counts and filters ask for the same species several times.
  let fitCache = new Map();
  function fitOf(s, tank) {
    if (!tank || s.group === 'disease') return null;
    const k = (tank === PLAN ? 'p|' : 'n|') + s.id;
    if (!fitCache.has(k)) fitCache.set(k, Fit.evaluate(Fit.index(DB), s, tank, lang));
    return fitCache.get(k);
  }
  const fitTag = (r, prefix) => (r && FIT_TAG[r.level] ? '<span class="tag fit ' + FIT_TAG[r.level] + '">' + FIT_ICON[r.level] + ' ' + (prefix ? esc(prefix) + ': ' : '') + esc(r.label) + '</span>' : '');
  // Current livestock, plus a second tag when the planned livestock changes the verdict.
  function fitTags(s) {
    const r = fitOf(s, TANK);
    if (!r) return '';
    const p = PLAN ? fitOf(s, PLAN) : null;
    return fitTag(r) + (p && p.level !== r.level ? fitTag(p, t('planTag')) : '');
  }
  const discordNote = () => esc(t('fitNote')).replace('{discord}', '<a href="https://discord.gg/k3KC28gCH4" target="_blank" rel="noopener">' + esc(t('discordWord')) + '</a>');
  // Above lists and cards: which tank the estimate is for, or a hint to set one up.
  function tankBar() {
    const xs = myTanks();
    if (xs.length) {
      const cur = myTank();
      return '<div class="tankbar" data-no-gloss><span>' + esc(t('fitFor')) + '</span>' + (xs.length > 1
        ? '<select id="fitTank" aria-label="' + esc(t('fitFor')) + '">' + xs.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === cur.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>'
        : '<b>' + esc(cur.name) + '</b>') + '</div>';
    }
    const hidden = Number(ls(true, HINT_KEY)) || 0;
    if (Date.now() - hidden < 30 * 864e5) return '';
    return '<div class="tankhint"><span>' + esc(t('fitHint')) + '</span><a class="btn-s" href="../tank-log/#/setup">' + esc(t('fitHintGo')) + '</a>' +
      '<button type="button" class="hintx" data-hide-hint aria-label="' + esc(t('fitHide')) + '" title="' + esc(t('fitHide')) + '">×</button></div>';
  }
  function fitBox(s) {
    const tank = myTank();
    if (!tank) {
      return '<section class="fitbox"><h2>' + esc(t('fitTitle')) + '</h2><p>' + esc(t('fitCta')) + '</p>' +
        '<a class="btn-s" href="../tank-log/#/setup">' + esc(t('fitHintGo')) + '</a></section>';
    }
    const r = fitOf(s, TANK);
    const p = PLAN ? fitOf(s, PLAN) : null;
    const part = (x) => '<p class="fitlevel">' + (fitTag(x) || '<span class="tag">' + esc(x.label) + '</span>') + '</p>' +
      (x.reasons.length ? '<ul class="reasons">' + x.reasons.map((y) => '<li class="r-' + y.level + '">' + esc(y.text) + '</li>').join('') + '</ul>' : '');
    const worst = p && p.level === 'bad' ? 'bad' : r.level;
    return '<section class="fitbox lvl-' + worst + '"><h2>' + esc(t('fitTitle')) + ' <span class="fitname" data-no-gloss>' + esc(tank.name) + '</span></h2>' +
      (p ? '<h3>' + esc(t('fitNow')) + '</h3>' + part(r) + '<h3>' + esc(t('fitWithPlan')) + '</h3>' + part(p) : part(r)) +
      '<p class="hint">' + discordNote() + '</p>' +
      '<p class="fitbtns"><a class="btn-s" href="../tank-log/#/livestock/add/' + encodeURIComponent(s.id) + '">' + esc(t('fitAdd')) + '</a>' +
      '<a class="btn-s sec" href="../tank-log/#/livestock/plan/' + encodeURIComponent(s.id) + '">' + esc(t('fitPlanAdd')) + '</a></p></section>';
  }

  /* ---------- photos (Wikimedia Commons, shown with author and licence) ---------- */
  function photoImg(s, big, lazy, alt, p = s.image) {
    if (!p) return '';
    const src = (big ? p.thumb_960 : p.thumb_500) || p.url;
    const srcset = p.thumb_500 && p.thumb_960 ? ' srcset="' + esc(p.thumb_500) + ' 500w, ' + esc(p.thumb_960) + ' 960w" sizes="' +
      (big ? '(max-width: 900px) 100vw, 860px' : '(max-width: 600px) 100vw, 360px') + '"' : '';
    return '<img src="' + esc(src) + '"' + srcset + ' data-full="' + esc(p.url) + '" alt="' + esc(alt !== undefined ? alt : title(s) + ' (' + s.scientific_name + ')') + '"' +
      (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
  }
  // Attribution required by CC BY / BY-SA: author, licence (linked) and a link to the file page.
  function figure(s, p, hidden, kind) {
    const lic = p.license ? (p.license_url ? '<a href="' + esc(p.license_url) + '" target="_blank" rel="noopener license">' + esc(p.license) + '</a>' : esc(p.license)) : '';
    return '<figure class="photo"' + (kind ? ' data-photo="' + kind + '"' : '') + (hidden ? ' hidden' : '') + '>' + photoImg(s, true, false, undefined, p) + '<figcaption>' + esc(t('photo')) + ': ' +
      [p.author ? esc(p.author) : '', lic, '<a href="' + esc(p.page) + '" target="_blank" rel="noopener">Wikimedia Commons</a>'].filter(Boolean).join(' · ') +
      '</figcaption></figure>';
  }
  // With a juvenile photo (when the young look very different), an Adult / Juvenile switch on the photo.
  function photoFigure(s) {
    if (!s.image) return s.image_juvenile ? figure(s, s.image_juvenile) : '';
    if (!s.image_juvenile) return figure(s, s.image);
    return '<div class="photos">' + figure(s, s.image, false, 'adult') + figure(s, s.image_juvenile, true, 'juvenile') +
      '<div class="phototoggle" role="group">' + ['adult', 'juvenile'].map((k, i) =>
        '<button type="button" data-show-photo="' + k + '" aria-pressed="' + !i + '">' + esc(t(k)) + '</button>').join('') + '</div></div>';
  }
  // A width Wikimedia does not serve falls back to the original file.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.dataset.full) return;
    const full = img.dataset.full;
    delete img.dataset.full;
    img.removeAttribute('srcset');
    img.src = full;
  }, true);

  /* ---------- lists: category → types → species ---------- */
  const speciesHref = (s) => pathHref(s.group, pathOf(s.group, s.category)) + '/' + encodeURIComponent(s.id);
  const bySpecies = (a, b) => CARE_ORDER.indexOf(a.difficulty) - CARE_ORDER.indexOf(b.difficulty) || title(a).localeCompare(title(b), lang);
  const matchQ = (q) => (s) => { const x = norm(q.trim()); return !x || norm([s.name_hu, s.name_en, s.scientific_name].join(' ')).includes(x); };
  const matchesQuery = (s) => matchQ(filt.q)(s);
  // Care level as 1–3 dots (green, orange, red); difficult and expert both get three, the label is in the tooltip.
  const DOTS = { easy: 1, moderate: 2, difficult: 3, expert: 3 };
  function dots(d) {
    if (!DOTS[d]) return '';
    const label = lab('difficulty', d);
    return '<span class="dots d' + DOTS[d] + '" title="' + esc(label) + '" role="img" aria-label="' + esc(t('care') + ': ' + label) + '">' + '<i></i>'.repeat(DOTS[d]) + '</span>';
  }
  const matchesCare = (s) => !filt.care || s.difficulty === filt.care;
  function miniFacts(s) {
    const f = [];
    if (s.group === 'coral') {
      if (lab('light', s.light)) f.push([t('light'), lab('light', s.light)]);
      if (lab('flow', s.flow)) f.push([t('flow'), lab('flow', s.flow)]);
    } else {
      if (range(s.size_cm)) f.push([t('size'), range(s.size_cm) + ' cm']);
      if (s.tank_min_l) f.push([t('minTank'), t('liters', { n: s.tank_min_l })]);
    }
    return f.map(([k, v]) => '<span>' + esc(k) + ': <b>' + esc(v) + '</b></span>').join('');
  }
  function tags(s, withGroup) {
    const out = [];
    if (notRec(s)) out.push('<span class="tag bad">' + esc(t('notRec')) + '</span>');
    if (withGroup) {
      const path = pathOf(s.group, s.category);
      path.forEach((p, i) => out.push('<span class="tag group">' + esc(catName(s.group, path.slice(0, i + 1))) + '</span>'));
    }
    if (DOTS[s.difficulty]) out.push(dots(s.difficulty));
    if (lab('reef_safety', s.reef_safety)) out.push('<span class="tag ' + (REEF_CLASS[s.reef_safety] || '') + '">' + esc(lab('reef_safety', s.reef_safety)) + '</span>');
    return '<div class="tags">' + out.join('') + '</div>';
  }
  // The tank the estimates are for (and the same with its planned livestock), refreshed on every render: Tank Log may
  // change it in another tab.
  let TANK = null;
  let PLAN = null;
  // "Hide not recommended" is one switch for every list, kept between visits; with a plan it judges against the plan too.
  const HIDE_KEY = 'reef42-species-hidebad';
  let hideBad = ls(true, HIDE_KEY) === '1';
  const matchesFit = (s) => !hideBad || !TANK || fitOf(s, PLAN || TANK).level !== 'bad';
  const fitChip = () => (TANK ? '<button type="button" class="chip" data-f="fit" aria-pressed="' + hideBad + '">' + esc(t('fitOnly')) + '</button>' : '');
  // labelHtml: chip content as HTML (care level dots); otherwise the label is text.
  function chipRow(key, values, labelOf, labelHtml) {
    return '<div class="chips" role="group">' + [''].concat(values).map((v) =>
      '<button type="button" class="chip" data-f="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (filt[key] === v) + '"' + (v && labelHtml ? ' aria-label="' + esc(labelOf(v)) + '"' : '') + '>' +
      (v && labelHtml ? labelHtml(v) : esc(v ? labelOf(v) : t('all'))) + '</button>').join('') + '</div>';
  }
  // Tiles say how many species they lead to; with "hide not recommended" on, only the visible ones, greyed out at 0.
  const goLine = (total, visible) => '<span class="go">' + esc(t('open', { n: visible })) + '</span>';
  const offClass = (visible) => (visible ? '' : ' off');
  const backLink = (href, label) => '<a class="back" href="' + href + '">' + esc(t('back', { x: label })) + '</a>';
  // fitResult / count: on "My species" the estimate is for a resident (the rest of the tank) and shows how many there are.
  function tile(s, withGroup, fitResult, count) {
    const img = photoImg(s, false, true);
    const sub = (lang === 'hu' && s.name_hu && s.name_en ? esc(s.name_en) + ' · ' : '') + '<span class="sci">' + esc(s.scientific_name) + '</span>';
    const fit = fitResult ? fitTag(fitResult) : fitTags(s);
    return '<li><a class="tile' + (img ? ' has-photo' : '') + '" href="' + speciesHref(s) + '">' +
      (img ? '<div class="thumb">' + img + '</div>' : '') + '<h2>' + esc(title(s)) + (count > 1 ? ' × ' + count : '') + '</h2>' +
      '<p class="sub">' + sub + '</p>' + (fit ? '<div class="tags">' + fit + '</div>' : '') + tags(s, withGroup) + '<p class="facts-mini">' + miniFacts(s) + '</p></a></li>';
  }

  // Category page: one tile per type (taxonomy order) with a photo of its first species; searching lists species directly.
  function renderCategory() {
    document.title = t(CAT) + ' – reef42';
    app.innerHTML = tankBar() + '<h1>' + esc(t(CAT)) + '</h1><p class="lead">' + esc(t('lead_' + CAT)) + '</p>' +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    renderCategoryItems();
  }
  function renderCategoryItems() {
    const count = document.getElementById('count');
    const list = document.getElementById('list');
    if (filt.q.trim()) {
      const items = species.filter(matchesQuery).filter(matchesFit).sort(bySpecies);
      count.textContent = t('count', { n: items.length });
      list.innerHTML = items.length ? '<ul class="grid">' + items.map((s) => tile(s, true)).join('') + '</ul>' : '<p class="empty">' + esc(t('none')) + '</p>';
      return;
    }
    groupGrid([], count, list);
  }
  // Random photos, picked once per page load so they stay put while browsing but change on every visit.
  const PICKS = {};
  function pickPhotos(key, xs, n) {
    if (!PICKS[key]) {
      const pool = xs.filter((s) => s.image);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      PICKS[key] = pool.slice(0, n);
    }
    return PICKS[key];
  }
  // Tiles for the child types of a path ([] = the category's main types), each with a photo of a random species.
  function groupGrid(path, count, list) {
    const node = nodeAt(CAT, path);
    const xs = species.filter(inPath(path));
    const groups = Object.keys((node && node.children) || {}).map((id) => path.concat(id)).map((p) => ({ path: p, xs: xs.filter(inPath(p)) })).filter((g) => g.xs.length);
    groups.forEach((g) => { g.visible = g.xs.filter(matchesFit).length; });
    count.textContent = t('groupCount', { n: groups.filter((g) => g.visible).length }) + ' · ' + t('count', { n: xs.filter(matchesFit).length });
    list.innerHTML = '<ul class="grid">' + groups.map(groupTile).join('') + '</ul>';
  }
  function groupTile({ path, xs, visible }) {
    const rep = pickPhotos(CAT + '/' + path.join('/'), xs, 1)[0];
    const img = rep ? photoImg(rep, false, true, '') : '';
    return '<li><a class="tile group-tile' + (img ? ' has-photo' : '') + offClass(visible) + '" href="' + pathHref(CAT, path) + '">' +
      (img ? '<div class="thumb">' + img + '</div>' : '') + '<h2>' + esc(catName(CAT, path)) + '</h2>' + goLine(xs.length, visible) + '</a></li>';
  }
  // Main type with child types (LPS): its types as tiles.
  function renderGroups() {
    document.title = catName(CAT, PATH) + ' – ' + t(CAT) + ' – reef42';
    app.innerHTML = tankBar() + '<h1>' + esc(catName(CAT, PATH)) + '</h1><p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    groupGrid(PATH, document.getElementById('count'), document.getElementById('list'));
  }
  // Type page: the species of one type, easiest first.
  function renderSub(keepFocus) {
    const xs = species.filter(inPath(PATH));
    document.title = catName(CAT, PATH) + ' – ' + t(CAT) + ' – reef42';
    const cares = CARE_ORDER.filter((c) => xs.some((s) => s.difficulty === c));
    if (filt.care && !cares.includes(filt.care)) filt.care = '';
    app.innerHTML = tankBar() + '<h1>' + esc(catName(CAT, PATH)) + '</h1>' +
      (cares.length > 1 ? '<div class="filters">' + chipRow('care', cares, (v) => lab('difficulty', v), dots) + '</div>' : '') +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    const items = xs.filter(matchesCare).filter(matchesFit).sort(bySpecies);
    document.getElementById('count').textContent = t('count', { n: items.length });
    document.getElementById('list').innerHTML = items.length ? '<ul class="grid">' + items.map((s) => tile(s)).join('') + '</ul>' : '<p class="empty">' + esc(t('none')) + '</p>';
    if (keepFocus) { const el = app.querySelector(keepFocus); if (el) el.focus(); }
  }

  /* ---------- species card ---------- */
  const notRec = (s) => !!s.verdict && s.verdict.recommendation === 'not_recommended';
  function verdictBox(s) {
    if (!notRec(s)) return '';
    return '<div class="verdict" role="note"><strong>' + esc(t('notRec')) + '</strong><p>' + esc(tr(s.verdict.reason) || t('notRecText')) + '</p></div>';
  }
  function fact(label, value, html) {
    return value ? '<div><dt>' + esc(label) + '</dt><dd>' + (html ? value : esc(value)) + '</dd></div>' : '';
  }
  const careFact = (s) => fact(t('care'), DOTS[s.difficulty] ? dots(s.difficulty) + ' <span class="dlabel">' + esc(lab('difficulty', s.difficulty)) + '</span>' : '', true);
  function textSect(head, text) {
    const x = tr(text).trim();
    return x ? '<section class="sect"><h2>' + esc(head) + '</h2><p>' + esc(x) + '</p></section>' : '';
  }
  function facts(s) {
    if (s.group === 'coral') {
      return fact(t('type'), tr(s.type)) + careFact(s) + fact(t('light'), lab('light', s.light)) +
        fact(t('flow'), lab('flow', s.flow)) + fact(t('growth'), lab('growth', s.growth));
    }
    const size = range(s.size_cm);
    const life = [range(s.lifespan_wild_years) ? t('wild', { n: range(s.lifespan_wild_years) }) : '',
      range(s.lifespan_captivity_years) ? t('aquarium', { n: range(s.lifespan_captivity_years) }) : ''].filter(Boolean).join(' · ');
    const tank = [s.tank_min_l ? t('tankMin', { n: s.tank_min_l }) : '', s.tank_ideal_l ? t('tankIdeal', { n: s.tank_ideal_l }) : ''].filter(Boolean).join(' · ');
    const util = (s.utility || []).map((v) => lab('utility', v)).filter(Boolean).join(', ');
    return fact(t('size'), size ? size + ' cm' : '') + fact(t('tankSize'), tank) + careFact(s) +
      fact(t('reef'), lab('reef_safety', s.reef_safety)) + fact(t('utility'), util) + fact(t('lifespan'), life);
  }
  // Diseases the species can get; the ones it is more prone to than similar fish come first, with the level and why.
  const RISK_ORDER = { high: 0, elevated: 1 };
  function diseaseSect(s) {
    const risk = {};
    (s.disease_risk || []).forEach((r) => { risk[r.id] = r; });
    const xs = (s.diseases || []).map((id) => [id, DB.diseases[id]]).filter(([, d]) => d)
      .sort(([a], [b]) => (risk[a] ? RISK_ORDER[risk[a].level] : 9) - (risk[b] ? RISK_ORDER[risk[b].level] : 9));
    if (!xs.length) return '';
    const items = xs.map(([id, d]) => {
      const name = esc(lang === 'hu' && d.name_hu ? d.name_hu : d.name_en);
      const r = risk[id];
      return '<li>' + (d.fishy_doctor ? '<a href="' + FD_URL + encodeURIComponent(d.fishy_doctor) + '">' + name + '</a>' : name) +
        (r && lab('disease_risk', r.level) ? ' <span class="tag risk-' + esc(r.level) + '">' + esc(lab('disease_risk', r.level)) + '</span>' +
          (tr(r.reason) ? '<p class="riskwhy">' + esc(tr(r.reason)) + '</p>' : '') : '') + '</li>';
    });
    return '<section class="sect"><h2>' + esc(t('diseases')) + '</h2><ul>' + items.join('') + '</ul>' +
      (xs.some(([, d]) => d.fishy_doctor) ? '<p class="hint">' + esc(t('fdHint')) + '</p>' : '') + '</section>';
  }
  function renderSpecies(id) {
    const s = species.find((x) => x.id === id);
    if (!s) { app.innerHTML = '<p>' + esc(t('notFound')) + '</p>'; return; }
    document.title = title(s) + ' – ' + t(CAT) + ' – reef42';
    const names = [lang === 'hu' && s.name_hu && s.name_en ? esc(s.name_en) : '', '<span class="sci">' + esc(s.scientific_name) + '</span>'].filter(Boolean);
    const sections = s.group === 'coral'
      ? textSect(t('placement'), s.placement) + textSect(t('aggression'), s.aggression) + textSect(t('feeding'), s.feeding)
      : textSect(t('behavior'), s.behavior) + textSect(t('feeding'), s.feeding);
    const src = (s.sources || []).filter((x) => x && x.url);
    app.innerHTML = tankBar() +
      '<article class="card">' + photoFigure(s) + '<div class="card-head"><h1>' + esc(title(s)) + '</h1><p class="names">' + names.join(' · ') + '</p>' +
      tags(s, true) + '</div>' + verdictBox(s) + fitBox(s) + '<dl class="facts">' + facts(s) + '</dl>' +
      sections + textSect(t('origin'), s.origin) + textSect(t('notes'), s.notes) + diseaseSect(s) +
      (src.length ? '<section class="sect sources"><h2>' + esc(t('sources')) + '</h2><ul>' + src.map((x) =>
        '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name || x.url) + '</a></li>').join('') + '</ul></section>' : '') +
      '</article>';
  }

  /* ---------- overview ---------- */
  // Each category tile shows a mosaic of random species photos from that category (the icon when there are none).
  function catTile(c) {
    const xs = all.filter((s) => s.group === c);
    const pics = pickPhotos(c, xs, 4);
    const icon = '<img class="cat-icon" src="assets/' + ICON[c] + '.svg" alt="" width="' + (pics.length ? 32 : 44) + '" height="' + (pics.length ? 32 : 44) + '">';
    const mosaic = pics.length ? '<div class="thumb mosaic n' + pics.length + '">' + pics.map((s) => photoImg(s, false, false, '')).join('') + '</div>' : '';
    const visible = xs.filter(matchesFit).length;
    return '<li><a class="tile cat' + (mosaic ? ' has-photo' : '') + offClass(visible) + '" href="#/' + SLUG[c] + '">' + mosaic +
      (mosaic ? '<div class="cat-head">' + icon + '<h2>' + esc(t(c)) + '</h2></div>' : icon + '<h2>' + esc(t(c)) + '</h2>') +
      goLine(xs.length, visible) + '</a></li>';
  }
  // The residents of the chosen Tank Log tank that are in the database.
  const myLive = () => (TANK ? (TANK.livestock || []).filter((x) => all.some((s) => s.id === x.sp)) : []);
  function mineTile() {
    const live = myLive();
    if (!live.length) return '';
    const xs = live.map((x) => all.find((s) => s.id === x.sp));
    const pics = pickPhotos('mine', xs, 4);
    const icon = '<img class="cat-icon" src="assets/icon.svg" alt="" width="32" height="32">';
    return '<li><a class="tile cat mine' + (pics.length ? ' has-photo' : '') + '" href="#/mine">' +
      (pics.length ? '<div class="thumb mosaic n' + pics.length + '">' + pics.map((s) => photoImg(s, false, false, '')).join('') + '</div>' : '') +
      '<div class="cat-head">' + icon + '<h2>' + esc(t('mine')) + '</h2></div>' +
      '<span class="go">' + esc(t('open', { n: xs.length })) + '</span></a></li>';
  }
  // The overview and "My species" search across all species (homeQ); the category pages search their own category.
  let homeQ = '';
  function renderHome() {
    document.title = t('app') + ' – reef42';
    app.innerHTML = tankBar() + '<h1>' + esc(t('app')) + '</h1><p class="lead">' + esc(t('lead_home')) + '</p><div id="list"></div>';
    renderHomeItems();
  }
  function renderHomeItems() {
    const list = document.getElementById('list');
    if (!list) return;
    if (!homeQ.trim()) { list.innerHTML = '<ul class="grid cats">' + CATS.map(catTile).join('') + mineTile() + '</ul>'; return; }
    const items = all.filter(matchQ(homeQ)).filter(matchesFit).sort(bySpecies);
    list.innerHTML = '<p class="count" aria-live="polite">' + esc(t('count', { n: items.length })) + '</p>' +
      (items.length ? '<ul class="grid">' + items.map((s) => tile(s, true)).join('') + '</ul>' : '<p class="empty">' + esc(t('none')) + '</p>');
  }
  // "My species": the residents of the chosen tank, each judged against the rest of the tank.
  function renderMine() {
    document.title = t('mine') + ' – reef42';
    let h = tankBar() + '<h1>' + esc(t('mine')) + '</h1>';
    if (TANK) h += '<p class="lead" data-no-gloss>' + esc(t('mineLead', { tank: TANK.name })) + '</p>';
    app.innerHTML = h + '<div id="list"></div><p class="minelink"><a class="btn-s" href="../tank-log/#/livestock">' + esc(t('mineEdit')) + '</a></p>';
    renderMineItems();
  }
  function renderMineItems() {
    const list = document.getElementById('list');
    if (!list) return;
    const live = myLive().filter((x) => matchQ(homeQ)(all.find((y) => y.id === x.sp)));
    list.innerHTML = live.length
      ? '<ul class="grid">' + live.map((x) => {
        const s = all.find((y) => y.id === x.sp);
        return tile(s, true, Fit.evaluate(Fit.index(DB), s, TANK, lang, { exclude: x.id, n: x.n }), x.n);
      }).join('') + '</ul>'
      : '<p class="empty">' + esc(homeQ.trim() ? t('none') : t('mineEmpty')) + '</p>';
  }

  /* ---------- toolbar: back, search and "hide not recommended", always in the sticky header ---------- */
  function backTarget(r) {
    if (r.mine) return ['#/', t('home')];
    if (!CAT) return null;
    if (r.id) return PATH.length ? [pathHref(CAT, PATH), catName(CAT, PATH)] : ['#/' + SLUG[CAT], t(CAT)];
    if (PATH.length > 1) return [pathHref(CAT, PATH.slice(0, -1)), catName(CAT, PATH.slice(0, -1))];
    if (PATH.length) return ['#/' + SLUG[CAT], t(CAT)];
    return ['#/', t('home')];
  }
  function renderToolbar(r) {
    const bar = document.getElementById('toolbar');
    const had = document.activeElement && document.activeElement.id === 'q';
    const back = backTarget(r);
    const q = CAT ? filt.q : homeQ;
    const ph = CAT ? t('search') : t('searchAll');
    bar.innerHTML = '<div class="inner">' + (back ? backLink(back[0], back[1]) : '') +
      '<input class="search" id="q" type="search" autocomplete="off" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '" value="' + esc(q) + '">' +
      fitChip() + '</div>';
    if (had) { const el = document.getElementById('q'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  /* ---------- routing ---------- */
  // #/ = overview, #/<category> = its main types, #/<category>/<main>[/<type>] = a type (LPS lists its types, the others their species),
  // #/<category>/<main>[/<type>]/<id> = card. Older addresses (#/<id>, #/<category>/<id>, a type without its main type, old type names)
  // go to the current address, or to the category if the species is gone.
  const byId = (id) => all.find((x) => x.id === id);
  function route() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/').filter(Boolean);
    const here = '#/' + parts.map(encodeURIComponent).join('/');
    const go = (r, href) => Object.assign(r, { href, moved: href !== here });
    if (!parts.length) return { cat: null, path: [] };
    if (parts[0] === 'mine') return { cat: null, path: [], mine: true };
    const cat = BY_SLUG[parts[0]];
    if (!cat) { const s = byId(parts[0]); return s ? go({ cat: s.group, path: pathOf(s.group, s.category), id: s.id }, speciesHref(s)) : go({ cat: null, path: [] }, '#/'); }
    const path = [];
    for (const p of parts.slice(1)) { if (nodeAt(cat, path.concat(p))) path.push(p); else break; }
    const rest = parts.slice(1 + path.length);
    if (!rest.length) return { cat, path };
    const s = byId(rest[rest.length - 1]);
    if (s && s.group === cat) return go({ cat, path: pathOf(cat, s.category), id: s.id }, speciesHref(s));
    const leaf = rest.length === 1 && !path.length ? pathOf(cat, rest[0]) : [];
    const to = leaf.length ? leaf : path;
    return go({ cat, path: to }, pathHref(cat, to));
  }
  function render(keepFocus) {
    const r = route();
    if (r.moved) history.replaceState(null, '', r.href);
    CAT = r.cat || null;
    if (CAT) { species = all.filter((s) => s.group === CAT); filt = FILTERS[CAT]; }
    PATH = CAT ? r.path : [];
    TANK = myTank();
    PLAN = TANK ? Fit.withPlan(TANK) : null;
    fitCache = new Map();
    renderChrome();
    renderToolbar(r);
    const node = CAT && PATH.length ? nodeAt(CAT, PATH) : null;
    if (r.mine) renderMine();
    else if (!CAT) renderHome();
    else if (r.id) renderSpecies(r.id);
    else if (node && node.children) renderGroups();
    else if (node) renderSub(keepFocus);
    else renderCategory();
  }

  app.addEventListener('click', (e) => {
    const ph = e.target.closest('[data-show-photo]');
    if (ph) {
      const box = ph.closest('.photos');
      box.querySelectorAll('[data-photo]').forEach((f) => { f.hidden = f.dataset.photo !== ph.dataset.showPhoto; });
      box.querySelectorAll('[data-show-photo]').forEach((b) => b.setAttribute('aria-pressed', b === ph));
      return;
    }
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filt[b.dataset.f] = b.dataset.v;
    renderSub('.chip[data-f="' + b.dataset.f + '"][data-v="' + b.dataset.v + '"]');
  });
  const toolbar = document.getElementById('toolbar');
  toolbar.addEventListener('click', (e) => {
    if (!e.target.closest('.chip[data-f="fit"]')) return;
    hideBad = !hideBad;
    ls(false, HIDE_KEY, hideBad ? '1' : '');
    render();
    const c = toolbar.querySelector('.chip[data-f="fit"]');
    if (c) c.focus();
  });
  // Search: a category page filters in place; on its type and species pages typing jumps back to the category's results;
  // the overview and "My species" search their own lists.
  toolbar.addEventListener('input', (e) => {
    if (e.target.id !== 'q') return;
    const v = e.target.value;
    const r = route();
    if (r.mine) { homeQ = v; renderMineItems(); return; }
    if (!CAT) { homeQ = v; renderHomeItems(); return; }
    filt.q = v;
    if (!r.id && !PATH.length) renderCategoryItems();
    else location.hash = '#/' + SLUG[CAT];
  });
  app.addEventListener('change', (e) => { if (e.target.id === 'fitTank') { ls(false, TANK_KEY, e.target.value); render(); } });
  app.addEventListener('click', (e) => {
    if (!e.target.closest('[data-hide-hint]')) return;
    ls(false, HINT_KEY, String(Date.now()));
    const h = e.target.closest('.tankhint');
    if (h) h.remove();
  });
  // Tank Log open in another tab: pick up tank changes.
  window.addEventListener('storage', (e) => { if (e.key === TL_KEY && all.length) render(); });
  // Each list page remembers its own scroll position; cards always open at the top.
  window.addEventListener('hashchange', () => {
    render();
    const r = route();
    if (r.cat && !r.id) window.scrollTo(0, listScroll[location.hash] || 0);
    else { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
  });
  window.addEventListener('scroll', () => { const r = route(); if (r.cat && !r.id) listScroll[location.hash] = window.scrollY; }, { passive: true });

  langPicker = reef42Lang.mount(document.getElementById('langToggle'), {
    get: () => lang,
    set: (code) => { lang = code; ls(false, LANG_KEY, lang); render(); }
  });

  renderChrome();
  openReview();
  fetch(DATA_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((db) => {
    DB = db;
    all = (db.species || []).filter((s) => CATS.includes(s.group));
    render();
  }).catch(() => { app.innerHTML = '<p>' + esc(t('loadError')) + '</p>'; });
})();
