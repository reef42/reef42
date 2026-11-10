// reef42 species database: overview → category list (#/fish, #/corals, #/inverts) → species card (#/fish/<id>).
(() => {
  'use strict';

  const DATA_URL = '../databases/reef42_marine_life_db_v1.json';
  // Freely licensed Wikimedia Commons photos, keyed by species id (species/tools/images.mjs). Optional: cards work without it.
  const PHOTOS_URL = '../databases/reef42_species_images.json';
  const LANG_KEY = 'reef42-lang';
  const CATS = ['fish', 'coral', 'invert'];
  const SLUG = { fish: 'fish', coral: 'corals', invert: 'inverts' };
  const BY_SLUG = { fish: 'fish', corals: 'coral', inverts: 'invert' };
  // A text or source URL used by at least this many species is template filler, not species information: never shown.
  const GENERIC_MIN = 5;

  const TEXT = {
    en: {
      app: 'Species', home: 'Overview', fish: 'Fish', coral: 'Corals', invert: 'Inverts',
      lead_home: 'Care cards for fish, corals and invertebrates that are realistically available in Europe: only what matters for keeping them.',
      open: 'Browse {n} species →',
      lead_fish: 'Care cards for saltwater fish that are realistically available in Europe: only what matters for keeping them.',
      lead_coral: 'Care cards for corals that are realistically available in Europe: light, flow, placement and what to watch for.',
      lead_invert: 'Care cards for shrimps, crabs, snails, sea stars and urchins that are realistically available in Europe.',
      search: 'Search by name…', all: 'All', count: '{n} species', none: 'No species match the filters.', groupCount: '{n} types', other: 'Other',
      photos: 'More photos', photo: 'Photo', formerly: 'formerly {n}', backs: 'Backs:',
      back: '← {x}', notFound: 'Species not found.', loadError: 'Could not load the species data.',
      huOnly: 'Notes are currently available in Hungarian only.',
      size: 'Size', maxSize: 'up to {n} cm', minTank: 'Minimum tank', liters: '{n} L', origin: 'Origin', care: 'Care level',
      reef: 'Reef compatibility', temper: 'Temperament', diet: 'Diet', lifespan: 'Lifespan', wild: 'wild: {n} years', tank: 'aquarium: {n} years',
      type: 'Type', light: 'Light', flow: 'Flow', placement: 'Placement', growth: 'Growth', aggression: 'Aggression', spacing: 'Spacing', feeding: 'Feeding',
      behavior: 'Behaviour', extra: 'Good to know', tips: 'Pro tip', sources: 'Sources',
      notRec: 'Reef42: not recommended', notRecText: 'In our view this species does not do well long-term in most home aquariums.',
      ethicScore: 'ethical index {n}/10', provisional: 'Provisional Reef42 assessment, under review.',
      draft: 'Draft data, under review – always check before buying.', feedback: 'corrections and ideas:'
    },
    hu: {
      app: 'Fajok', home: 'Áttekintés', fish: 'Halak', coral: 'Korallok', invert: 'Gerinctelenek',
      lead_home: 'Adatlapok az Európában reálisan beszerezhető halakról, korallokról és gerinctelenekről: csak az, ami a tartáshoz tényleg számít.',
      open: '{n} faj megtekintése →',
      lead_fish: 'Adatlapok az Európában reálisan beszerezhető tengeri halakról: csak az, ami a tartáshoz tényleg számít.',
      lead_coral: 'Adatlapok az Európában reálisan beszerezhető korallokról: fény, áramlás, elhelyezés és amire figyelni kell.',
      lead_invert: 'Adatlapok az Európában reálisan beszerezhető garnélákról, rákokról, csigákról, tengeri csillagokról és sünökről.',
      search: 'Keresés név alapján…', all: 'Mind', count: '{n} faj', none: 'Nincs a szűrésnek megfelelő faj.', groupCount: '{n} típus', other: 'Egyéb',
      photos: 'További fotók', photo: 'Fotó', formerly: 'korábban: {n}', backs: 'Ezekhez:',
      back: '← {x}', notFound: 'Nincs ilyen faj.', loadError: 'Nem sikerült betölteni a fajadatokat.',
      huOnly: '',
      size: 'Méret', maxSize: 'legfeljebb {n} cm', minTank: 'Legkisebb akvárium', liters: '{n} L', origin: 'Származás', care: 'Tartási nehézség',
      reef: 'Korallos akváriumba', temper: 'Természet', diet: 'Táplálkozás', lifespan: 'Élettartam', wild: 'vadon: {n} év', tank: 'akváriumban: {n} év',
      type: 'Típus', light: 'Fényigény', flow: 'Áramlás', placement: 'Elhelyezés', growth: 'Növekedés', aggression: 'Csalánzás, agresszió', spacing: 'Hely a szomszédoktól', feeding: 'Etetés',
      behavior: 'Viselkedés', extra: 'Fontos tudnivalók', tips: 'Pro tipp', sources: 'Források',
      notRec: 'Reef42: nem ajánlott', notRecText: 'Szerintünk ez a faj a legtöbb otthoni akváriumban hosszú távon nem tartható jól.',
      ethicScore: 'etikai index: {n}/10', provisional: 'Előzetes Reef42-értékelés, átnézés alatt.',
      draft: 'Tervezet: az adatok átnézés alatt állnak, vásárlás előtt mindig ellenőrizd.', feedback: 'javítás, ötlet:'
    }
  };

  // Enum labels: [en, hu]. Unknown values are not shown (the validator reports them).
  const ENUM = {
    care_level: { easy: ['Easy', 'Könnyű'], easy_moderate: ['Easy to moderate', 'Könnyű–közepes'], moderate: ['Moderate', 'Közepes'], difficult: ['Difficult', 'Nehéz'], expert: ['Experts only', 'Csak tapasztaltaknak'] },
    reef: { reef_safe: ['Reef safe', 'Korallbarát'], reef_safe_with_caution: ['Reef safe with caution', 'Korallok mellé óvatosan'], conditional: ['Reef safe with conditions', 'Korallok mellé feltételekkel'] },
    temperament: {
      peaceful: ['Peaceful', 'Békés'], peaceful_pair: ['Peaceful, can be kept in pairs', 'Békés, párban is tartható'], shoaling: ['Shoaling', 'Csapatban élő'],
      peaceful_territorial: ['Peaceful but territorial', 'Békés, de területvédő'], semi_territorial: ['Somewhat territorial', 'Kissé területvédő'],
      territorial: ['Territorial', 'Területvédő'], semi_aggressive: ['Semi-aggressive', 'Félagresszív']
    },
    diet: {
      omnivore: ['Omnivore', 'Mindenevő'], carnivore: ['Carnivore', 'Húsevő'], herbivore: ['Herbivore', 'Növényevő'],
      herbivore_omnivore: ['Mostly herbivore', 'Főleg növényevő'], omnivore_planktivore: ['Omnivore, plankton eater', 'Mindenevő, planktonevő'],
      detritivore_herbivore: ['Grazes algae and detritus', 'Algát és detrituszt legel'], specialized_microfauna: ['Specialist: tiny crustaceans (pods)', 'Specialista: apró rákocskák (podok)'],
      omnivore_scavenger: ['Omnivore, scavenger', 'Mindenevő, dögevő'], carnivore_scavenger: ['Carnivore, scavenger', 'Húsevő, dögevő'],
      scavenger_carnivore: ['Scavenger, carnivore', 'Dögevő, húsevő'], herbivore_grazer: ['Algae grazer', 'Algalegelő'],
      specialized_biofilm_feeder: ['Specialist: biofilm and detritus', 'Specialista: biofilm és detritusz']
    },
    coral_type: { SPS: ['SPS', 'SPS'], LPS: ['LPS', 'LPS'], soft: ['Soft coral', 'Lágykorall'], zoanthid: ['Zoanthid', 'Zoanthus'] },
    level: { low: ['Low', 'Alacsony'], low_moderate: ['Low to moderate', 'Alacsony–közepes'], moderate: ['Moderate', 'Közepes'], moderate_high: ['Moderate to high', 'Közepes–erős'], high: ['High', 'Erős'] },
    flow: { low_moderate: ['Low to moderate', 'Gyenge–közepes'], moderate: ['Moderate', 'Közepes'], moderate_strong: ['Moderate to strong', 'Közepes–erős'], strong: ['Strong', 'Erős'] },
    placement: {
      upper: ['Upper', 'Felső szint'], middle_upper: ['Middle to upper', 'Középső–felső szint'], middle: ['Middle', 'Középső szint'],
      middle_lower: ['Lower to middle', 'Alsó–középső szint'], bottom_middle: ['Bottom to middle', 'Aljzat–középső szint'], bottom: ['Bottom (sand)', 'Aljzat (homok)']
    },
    growth: { slow: ['Slow', 'Lassú'], slow_moderate: ['Slow to moderate', 'Lassú–közepes'], moderate: ['Moderate', 'Közepes'], moderate_fast: ['Moderate to fast', 'Közepes–gyors'], fast: ['Fast', 'Gyors'] },
    aggression: {
      low_moderate: ['Low to moderate', 'Gyenge–közepes'], moderate: ['Moderate', 'Közepes'], high: ['High (sweeper tentacles)', 'Erős, csalánzó tapogatókkal'],
      very_high: ['Very high (long sweepers)', 'Nagyon erős, hosszú csalánzó tapogatókkal'], chemical: ['Chemical (terpenes)', 'Vegyi anyagokkal (terpének)']
    },
    feeding: { photosynthetic_with_optional_target_feeding: ['Photosynthetic, optional target feeding', 'Fényből él, célzottan etethető'] }
  };
  // What a source backs up (sources[].supports), shown under each link so the cross-checks are visible.
  const SUPPORTS = {
    taxonomy: ['taxonomy', 'rendszertan'], accepted_name: ['accepted name', 'érvényes név'], identification: ['identification', 'azonosítás'],
    distribution: ['distribution', 'elterjedés'], habitat: ['habitat', 'élőhely'], ecology: ['ecology', 'ökológia'], biology: ['biology', 'biológia'],
    conservation: ['conservation', 'természetvédelem'], maximum_size: ['maximum size', 'maximális méret'], minimum_tank_size: ['minimum tank', 'akváriumméret'],
    care_level: ['care level', 'tartási nehézség'], care: ['care', 'tartás'], temperament: ['temperament', 'természet'], behavior: ['behaviour', 'viselkedés'],
    compatibility: ['compatibility', 'társíthatóság'], reef_compatibility: ['reef compatibility', 'korallos akvárium'], diet: ['diet', 'táplálkozás'],
    feeding: ['feeding', 'etetés'], lighting: ['light', 'fény'], flow: ['flow', 'áramlás'], placement: ['placement', 'elhelyezés'],
    aggression: ['aggression', 'csalánzás, agresszió'], photos_and_credits: ['photos', 'fotók']
  };
  const SITE = {
    'reefapp.net': 'ReefApp', 'tidalgardens.com': 'Tidal Gardens', 'coralsoftheworld.org': 'Corals of the World',
    'commons.wikimedia.org': 'Wikimedia Commons', 'surg.org.au': 'SURG', 'fishbase.se': 'FishBase', 'sealifebase.se': 'SeaLifeBase'
  };
  const REGION = {
    'Indo-Pacific': 'Indo-csendes-óceáni térség', 'Tropical Indo-Pacific and Atlantic': 'Trópusi Indo-csendes-óceáni térség és Atlanti-óceán',
    'Indo-West Pacific': 'Indiai-óceán és Nyugat-Csendes-óceán', 'Western Pacific': 'Nyugat-Csendes-óceán', 'Central Pacific': 'Közép-Csendes-óceán',
    'Central Pacific, especially Hawaii': 'Közép-Csendes-óceán, főleg Hawaii', 'Indonesia and nearby Indo-Pacific': 'Indonézia és környéke',
    'Caribbean': 'Karib-tenger', 'Western Atlantic': 'Nyugat-Atlanti-óceán', 'Western Atlantic / Caribbean': 'Nyugat-Atlanti-óceán, Karib-tenger',
    'Banggai-szigetek, Indonézia': 'Banggai-szigetek, Indonézia'
  };
  const REGION_EN = { 'Banggai-szigetek, Indonézia': 'Banggai Islands, Indonesia' };
  const CARE_CLASS = { easy: 'easy', easy_moderate: 'easy', moderate: 'moderate', difficult: 'hard', expert: 'bad' };
  const CARE_ORDER = ['easy', 'easy_moderate', 'moderate', 'difficult', 'expert'];

  const app = document.getElementById('app');
  const ls = (get, k, v) => { try { if (get) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  let lang = new URLSearchParams(location.search).get('lang') || ls(true, LANG_KEY) ||
    ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';

  // Set from the route: the open category, its species and its own filter state.
  let CAT = null;
  let all = [];
  let species = [];
  let generic = new Set();
  let GROUPS = {}; // category -> [{ id, en, hu }] in database order
  let PHOTOS = {}; // species id -> Commons photo with author and licence
  let SUBG = null; // open subgroup (type), from the route
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
  const lab = (group, v) => (ENUM[group] && ENUM[group][v] ? ENUM[group][v][lang === 'hu' ? 1 : 0] : null);
  const num = (n) => (lang === 'hu' ? String(n).replace('.', ',') : String(n));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const region = (r) => (lang === 'hu' ? REGION[r] || r : REGION_EN[r] || r);
  const title = (s) => (lang === 'hu' && s.hu_name ? s.hu_name : s.common_name || s.scientific_name);
  const real = (arr) => (arr || []).filter((x) => x && !generic.has(x));
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  // Same page written differently (www, letter case, "-" or "_", trailing slash) counts as one source. Site homepages give null.
  const urlKey = (u) => {
    try {
      const x = new URL(u);
      const path = x.pathname.replace(/\/+$/, '');
      if (!path && !x.search) return null;
      return (host(u) + path + x.search).toLowerCase().replace(/_/g, '-');
    } catch (e) { return null; }
  };
  const groupName = (g) => (g ? (lang === 'hu' ? g.hu : g.en) || g.en || g.hu : '');
  const groupOf = (s) => (GROUPS[s.category] || []).find((g) => g.id === (s.subgroup && s.subgroup.id));

  // Texts and source URLs that repeat across many species carry no species information.
  function findGeneric(list) {
    const n = new Map();
    const add = (x) => { if (x) n.set(x, (n.get(x) || 0) + 1); };
    list.forEach((s) => {
      [...(s.extra_notes || []), ...(s.pro_tips || []), ...((s.behavior && s.behavior.notes) || []), ...((s.ethical_index && s.ethical_index.reasons) || [])].forEach(add);
      if (s.feeding) add(s.feeding.notes);
      new Set((s.sources || []).map((x) => urlKey(x.url)).filter(Boolean)).forEach(add);
    });
    return new Set([...n].filter(([, c]) => c >= GENERIC_MIN).map(([k]) => k));
  }
  // One entry per page; when a page is listed twice, the things it backs up are merged.
  function sourcesOf(s) {
    const byKey = new Map();
    (s.sources || []).forEach((x) => {
      const k = urlKey(x.url);
      if (!k || generic.has(k)) return;
      const prev = byKey.get(k);
      if (prev) (x.supports || []).forEach((v) => { if (!prev.supports.includes(v)) prev.supports.push(v); });
      else byKey.set(k, { name: SITE[host(x.url)] || x.name, url: x.url, supports: [...(x.supports || [])] });
    });
    return [...byKey.values()];
  }
  function groupsFrom(db) {
    const out = {};
    CATS.forEach((c) => {
      const named = (db.subgroups && db.subgroups[c]) || {};
      const list = Object.keys(named).map((id) => ({ id, en: named[id].name_en, hu: named[id].name_hu }));
      // Subgroups used by a species but missing from the top-level list still get a heading.
      (db.species || []).forEach((s) => {
        const g = s.category === c && s.subgroup;
        if (g && g.id && !list.some((x) => x.id === g.id)) list.push({ id: g.id, en: g.name_en, hu: g.name_hu });
      });
      out[c] = list;
    });
    return out;
  }
  // Ethical index: only "not recommended" is shown while scores are provisional; reviewed scores are shown in full.
  function ethicShown(s) {
    const e = s.ethical_index;
    return !!e && (e.status === 'reviewed' || e.recommendation === 'not_recommended');
  }

  /* ---------- chrome ---------- */
  let langPicker = null;
  function renderChrome() {
    document.documentElement.lang = lang;
    document.getElementById('brandText').textContent = t('app');
    if (langPicker) langPicker.update();
    document.getElementById('tabs').innerHTML = '<a href="#/"' + (!CAT ? ' aria-current="page"' : '') + '>' + esc(t('home')) + '</a>' +
      CATS.map((c) => '<a href="#/' + SLUG[c] + '"' + (c === CAT ? ' aria-current="page"' : '') + '>' + esc(t(c)) + '</a>').join('');
    document.getElementById('footer').innerHTML = '<div class="inner"><span>' + esc(t('draft')) + '</span><span>' + esc(t('feedback')) +
      ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
  }

  /* ---------- lists: category → subgroups (types) → species ---------- */
  const subOf = (s) => (groupOf(s) ? groupOf(s).id : '');
  const speciesHref = (s) => '#/' + SLUG[s.category] + '/' + (subOf(s) ? encodeURIComponent(subOf(s)) + '/' : '') + encodeURIComponent(s.id);
  const bySpecies = (a, b) => CARE_ORDER.indexOf(a.care_level) - CARE_ORDER.indexOf(b.care_level) || title(a).localeCompare(title(b), lang);
  const matchesQuery = (s) => { const q = norm(filt.q.trim()); return !q || norm([s.hu_name, s.common_name, s.scientific_name].join(' ')).includes(q); };
  const matchesCare = (s) => !filt.care || s.care_level === filt.care;
  function miniFacts(s) {
    const f = [];
    if (CAT === 'coral') {
      if (lab('level', s.lighting && s.lighting.level)) f.push([t('light'), lab('level', s.lighting.level)]);
      if (lab('flow', s.flow && s.flow.level)) f.push([t('flow'), lab('flow', s.flow.level)]);
    } else {
      if (s.size_cm && s.size_cm.maximum) f.push([t('size'), t('maxSize', { n: num(s.size_cm.maximum) })]);
      if (s.minimum_tank_size_l) f.push([t('minTank'), t('liters', { n: s.minimum_tank_size_l })]);
    }
    return f.map(([k, v]) => '<span>' + esc(k) + ': <b>' + esc(v) + '</b></span>').join('');
  }
  function tags(s, withGroup) {
    const out = [];
    if (withGroup && groupOf(s)) out.push('<span class="tag group">' + esc(groupName(groupOf(s))) + '</span>');
    else if (CAT === 'coral' && lab('coral_type', s.coral_type)) out.push('<span class="tag">' + esc(lab('coral_type', s.coral_type)) + '</span>');
    if (lab('care_level', s.care_level)) out.push('<span class="tag ' + (CARE_CLASS[s.care_level] || '') + '">' + esc(lab('care_level', s.care_level)) + '</span>');
    const reef = s.aquarium_requirements && lab('reef', s.aquarium_requirements.reef_compatibility);
    if (reef) out.push('<span class="tag">' + esc(reef) + '</span>');
    if (ethicShown(s) && s.ethical_index.recommendation === 'not_recommended') out.push('<span class="tag bad">' + esc(t('notRec').replace(/^Reef42: /, '')) + '</span>');
    return '<div class="tags">' + out.join('') + '</div>';
  }
  function chipRow(key, values, labelOf) {
    return '<div class="chips" role="group">' + [''].concat(values).map((v) =>
      '<button type="button" class="chip" data-f="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (filt[key] === v) + '">' +
      esc(v ? labelOf(v) : t('all')) + '</button>').join('') + '</div>';
  }
  const notice = () => (t('huOnly') ? '<p class="notice">' + esc(t('huOnly')) + '</p>' : '');
  const backLink = (href, label) => '<a class="back" href="' + href + '">' + esc(t('back', { x: label })) + '</a>';

  // Category page: one tile per subgroup with a photo of its first species (database order); searching lists species directly.
  function renderCategory() {
    document.title = t(CAT) + ' – reef42';
    app.innerHTML = '<h1>' + esc(t(CAT)) + '</h1><p class="lead">' + esc(t('lead_' + CAT)) + '</p>' + notice() +
      '<div class="filters"><input class="search" id="q" type="search" autocomplete="off" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '" value="' + esc(filt.q) + '"></div>' +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    renderCategoryItems();
  }
  function renderCategoryItems() {
    const count = document.getElementById('count');
    const list = document.getElementById('list');
    if (filt.q.trim()) {
      const items = species.filter(matchesQuery).sort(bySpecies);
      count.textContent = t('count', { n: items.length });
      list.innerHTML = items.length ? '<ul class="grid">' + items.map((s) => tile(s, true)).join('') + '</ul>' : '<p class="empty">' + esc(t('none')) + '</p>';
      return;
    }
    const groups = (GROUPS[CAT] || []).map((g) => ({ g, xs: species.filter((s) => groupOf(s) === g) })).filter((x) => x.xs.length);
    const loose = species.filter((s) => !groupOf(s)).sort(bySpecies);
    count.textContent = t('groupCount', { n: groups.length }) + ' · ' + t('count', { n: species.length });
    list.innerHTML = '<ul class="grid">' + groups.map(groupTile).join('') + '</ul>' +
      (loose.length ? '<section class="group"><h2>' + esc(t('other')) + '</h2><ul class="grid">' + loose.map((s) => tile(s)).join('') + '</ul></section>' : '');
  }
  function groupTile({ g, xs }) {
    const rep = xs.find((s) => PHOTOS[s.id]);
    const img = rep ? photoImg(rep, '(max-width: 600px) 100vw, 360px', true, '') : '';
    return '<li><a class="tile group-tile' + (img ? ' has-photo' : '') + '" href="#/' + SLUG[CAT] + '/' + encodeURIComponent(g.id) + '">' +
      (img ? '<div class="thumb">' + img + '</div>' : '') + '<h2>' + esc(groupName(g)) + '</h2>' +
      '<p class="sub">' + esc(xs.slice().sort(bySpecies).map(title).join(' · ')) + '</p>' +
      '<span class="go">' + esc(t('open', { n: xs.length })) + '</span></a></li>';
  }
  // Subgroup page: the species of one type, easiest first.
  function renderSub(keepFocus) {
    const xs = species.filter((s) => groupOf(s) === SUBG);
    document.title = groupName(SUBG) + ' – ' + t(CAT) + ' – reef42';
    const cares = CARE_ORDER.filter((c) => xs.some((s) => s.care_level === c));
    if (filt.care && !cares.includes(filt.care)) filt.care = '';
    app.innerHTML = backLink('#/' + SLUG[CAT], t(CAT)) + '<h1>' + esc(groupName(SUBG)) + '</h1>' + notice() +
      (cares.length > 1 ? '<div class="filters">' + chipRow('care', cares, (v) => lab('care_level', v)) + '</div>' : '') +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div>';
    const items = xs.filter(matchesCare).sort(bySpecies);
    document.getElementById('count').textContent = t('count', { n: items.length });
    document.getElementById('list').innerHTML = items.length ? '<ul class="grid">' + items.map((s) => tile(s)).join('') + '</ul>' : '<p class="empty">' + esc(t('none')) + '</p>';
    if (keepFocus) { const el = app.querySelector(keepFocus); if (el) el.focus(); }
  }
  // Commons thumbnails; width/height keep the space reserved while the image loads.
  function photoImg(s, sizes, lazy, alt) {
    const p = PHOTOS[s.id];
    if (!p || !p.thumb_500) return '';
    const srcset = p.thumb_960 ? ' srcset="' + esc(p.thumb_500) + ' 500w, ' + esc(p.thumb_960) + ' 960w" sizes="' + sizes + '"' : '';
    return '<img src="' + esc(p.thumb_500) + '"' + srcset + ' alt="' + esc(alt !== undefined ? alt : title(s) + ' (' + s.scientific_name + ')') + '"' +
      (p.width && p.height ? ' width="' + p.width + '" height="' + p.height + '"' : '') + (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
  }
  // Attribution required by CC BY / BY-SA: author, licence (linked) and a link to the file page.
  function photoFigure(s) {
    const p = PHOTOS[s.id];
    const img = photoImg(s, '(max-width: 900px) 100vw, 860px', false);
    if (!img) return '';
    const note = p.note ? (lang === 'hu' ? p.note.hu : p.note.en) || '' : '';
    const lic = p.license ? (p.license_url ? '<a href="' + esc(p.license_url) + '" target="_blank" rel="noopener license">' + esc(p.license) + '</a>' : esc(p.license)) : '';
    return '<figure class="photo">' + img + '<figcaption>' + (note ? esc(note) + ' · ' : '') + esc(t('photo')) + ': ' +
      [p.author ? esc(p.author) : '', lic, '<a href="' + esc(p.page_url) + '" target="_blank" rel="noopener">Wikimedia Commons</a>'].filter(Boolean).join(' · ') +
      '</figcaption></figure>';
  }
  function tile(s, withGroup) {
    const img = photoImg(s, '(max-width: 600px) 100vw, 360px', true);
    return '<li><a class="tile' + (img ? ' has-photo' : '') + '" href="' + speciesHref(s) + '">' +
      (img ? '<div class="thumb">' + img + '</div>' : '') + '<h2>' + esc(title(s)) + '</h2>' +
      '<p class="sub">' + (lang === 'hu' && s.hu_name && s.common_name ? esc(s.common_name) + ' · ' : '') + '<span class="sci">' + esc(s.scientific_name) + '</span></p>' +
      tags(s, withGroup) + '<p class="facts-mini">' + miniFacts(s) + '</p></a></li>';
  }

  /* ---------- species card ---------- */
  function fact(label, value, small) {
    if (!value) return '';
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + (small ? '<small>' + esc(small) + '</small>' : '') + '</dd></div>';
  }
  function listSection(head, items, cls) {
    const xs = real(items);
    if (!xs.length) return '';
    return '<section class="sect' + (cls ? ' ' + cls : '') + '"><h2>' + esc(head) + '</h2><ul>' + xs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
  }
  function sizeText(s) {
    const z = s.size_cm || {};
    if (z.typical && z.maximum) return num(z.typical) + '–' + num(z.maximum) + ' cm';
    if (z.maximum) return t('maxSize', { n: num(z.maximum) });
    if (z.typical) return num(z.typical) + ' cm';
    return '';
  }
  function lifespanText(s) {
    const l = s.lifespan_years || {};
    return [l.wild ? t('wild', { n: num(l.wild) }) : '', l.aquarium ? t('tank', { n: num(l.aquarium) }) : ''].filter(Boolean).join(' · ');
  }
  function facts(s) {
    const o = (s.origin && s.origin.regions || []).map(region).join('; ');
    if (CAT === 'coral') {
      const par = s.lighting && s.lighting.par_range_umol_m2_s ? 'PAR ' + s.lighting.par_range_umol_m2_s : '';
      return fact(t('type'), lab('coral_type', s.coral_type)) + fact(t('care'), lab('care_level', s.care_level)) +
        fact(t('light'), s.lighting && lab('level', s.lighting.level), par) + fact(t('flow'), s.flow && lab('flow', s.flow.level)) +
        fact(t('placement'), lab('placement', s.placement)) + fact(t('growth'), lab('growth', s.growth_rate)) +
        fact(t('aggression'), lab('aggression', s.aggression)) + fact(t('spacing'), s.spacing_cm ? s.spacing_cm + ' cm' : '') +
        fact(t('feeding'), s.feeding && lab('feeding', s.feeding.type)) + fact(t('size'), sizeText(s)) + fact(t('origin'), o);
    }
    const d = s.diet || {};
    return fact(t('size'), sizeText(s)) + fact(t('minTank'), s.minimum_tank_size_l ? t('liters', { n: s.minimum_tank_size_l }) : '') +
      fact(t('care'), lab('care_level', s.care_level)) + fact(t('reef'), s.aquarium_requirements && lab('reef', s.aquarium_requirements.reef_compatibility)) +
      fact(t('temper'), s.behavior && lab('temperament', s.behavior.temperament)) + fact(t('diet'), lab('diet', d.type), d.description || '') +
      fact(t('lifespan'), lifespanText(s)) + fact(t('origin'), o);
  }
  function ethicBox(s) {
    if (!ethicShown(s)) return '';
    const e = s.ethical_index;
    const reasons = real(e.reasons);
    const head = e.recommendation === 'not_recommended' ? t('notRec') : 'Reef42';
    return '<div class="ethic" role="note"><strong>' + esc(head) + '</strong>' + (typeof e.score === 'number' ? ' · ' + esc(t('ethicScore', { n: e.score })) : '') +
      (reasons.length ? reasons.map((r) => '<p>' + esc(r) + '</p>').join('') : (e.recommendation === 'not_recommended' ? '<p>' + esc(t('notRecText')) + '</p>' : '')) +
      (e.status !== 'reviewed' ? '<p class="pre">' + esc(t('provisional')) + '</p>' : '') + '</div>';
  }
  // Links to external photo pages only: no image is copied or hotlinked until its licence is checked.
  function photoLinks(s) {
    const r = s.image_reference || {};
    const urls = [r.source_page_url, r.commons_search_url].filter((u) => u && urlKey(u));
    if (!urls.length) return '';
    const seen = new Set();
    return '<p class="photos"><span>' + esc(t('photos')) + ':</span> ' + urls.filter((u) => !seen.has(urlKey(u)) && seen.add(urlKey(u))).map((u) =>
      '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(SITE[host(u)] || host(u)) + ' ↗</a>').join(' · ') + '</p>';
  }
  function supportText(x) {
    const xs = x.supports.map((k) => SUPPORTS[k] && SUPPORTS[k][lang === 'hu' ? 1 : 0]).filter(Boolean);
    return xs.length ? '<span class="what">' + esc(t('backs') + ' ' + xs.join(', ')) + '</span>' : '';
  }
  function renderSpecies(id) {
    const s = species.find((x) => x.id === id);
    const back = SUBG ? backLink('#/' + SLUG[CAT] + '/' + encodeURIComponent(SUBG.id), groupName(SUBG)) : backLink('#/' + SLUG[CAT], t(CAT));
    if (!s) { app.innerHTML = back + '<p>' + esc(t('notFound')) + '</p>'; return; }
    document.title = title(s) + ' – ' + t(CAT) + ' – reef42';
    const former = s.former_scientific_name ? '<span class="former">' + esc(t('formerly', { n: s.former_scientific_name.split(/\s*;\s*/).join(', ') })) + '</span>' : '';
    const names = [lang === 'hu' && s.hu_name && s.common_name ? esc(s.common_name) : '', '<span class="sci">' + esc(s.scientific_name) + '</span>', former].filter(Boolean);
    const feedNote = s.feeding && s.feeding.notes && !generic.has(s.feeding.notes) ? [s.feeding.notes] : [];
    const src = sourcesOf(s);
    app.innerHTML = back + notice() +
      '<article class="card">' + photoFigure(s) + '<div class="card-head"><h1>' + esc(title(s)) + '</h1><p class="names">' + names.join(' · ') + '</p>' +
      tags(s, true) + photoLinks(s) + '</div>' +
      ethicBox(s) + '<dl class="facts">' + facts(s) + '</dl>' +
      listSection(t('behavior'), s.behavior && s.behavior.notes) + listSection(t('feeding'), feedNote) +
      listSection(t('extra'), s.extra_notes) + listSection(t('tips'), s.pro_tips, 'tip') +
      (src.length ? '<section class="sect sources"><h2>' + esc(t('sources')) + '</h2><ul>' + src.map((x) =>
        '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a> ' + supportText(x) + '</li>').join('') + '</ul></section>' : '') +
      '</article>';
  }

  /* ---------- overview ---------- */
  function renderHome() {
    document.title = t('app') + ' – reef42';
    app.innerHTML = '<h1>' + esc(t('app')) + '</h1><p class="lead">' + esc(t('lead_home')) + '</p><ul class="grid cats">' +
      CATS.map((c) => {
        const mine = all.filter((s) => s.category === c);
        const groups = (GROUPS[c] || []).filter((g) => mine.some((s) => s.subgroup && s.subgroup.id === g.id)).map(groupName);
        return '<li><a class="tile cat" href="#/' + SLUG[c] + '"><img src="assets/' + c + '.svg" alt="" width="44" height="44">' +
          '<h2>' + esc(t(c)) + '</h2><p class="sub">' + esc(groups.length ? groups.join(' · ') : t('lead_' + c)) + '</p>' +
          '<span class="go">' + esc(t('open', { n: mine.length })) + '</span></a></li>';
      }).join('') + '</ul>';
  }

  /* ---------- routing ---------- */
  // #/ = overview, #/<category> = its types, #/<category>/<type> = species of that type, #/<category>/<type>/<id> = card.
  // Older addresses (#/<id>, #/<category>/<id>) and ids renamed in the data (previous_id) are rewritten to the current one.
  const byId = (id) => all.find((x) => x.id === id) || all.find((x) => x.previous_id === id);
  function route() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/').filter(Boolean);
    if (!parts.length) return { cat: null };
    const cat = BY_SLUG[parts[0]];
    const g = cat && parts[1] ? (GROUPS[cat] || []).find((x) => x.id === parts[1]) : null;
    if (cat && !parts[1]) return { cat };
    if (g && !parts[2]) return { cat, sub: g.id };
    const s = byId(cat ? (g ? parts[2] : parts[1]) : parts[0]);
    if (!s) return cat ? { cat, sub: g ? g.id : '', id: parts[parts.length - 1] } : { cat: null };
    const href = speciesHref(s);
    return { cat: s.category, sub: subOf(s), id: s.id, href, moved: href !== '#/' + parts.map(encodeURIComponent).join('/') };
  }
  function render(keepFocus) {
    const r = route();
    if (r.moved) history.replaceState(null, '', r.href);
    CAT = r.cat || null;
    if (CAT) { species = all.filter((s) => s.category === CAT); filt = FILTERS[CAT]; }
    SUBG = CAT && r.sub ? (GROUPS[CAT] || []).find((g) => g.id === r.sub) || null : null;
    renderChrome();
    if (!CAT) renderHome();
    else if (r.id) renderSpecies(r.id);
    else if (SUBG) renderSub(keepFocus);
    else renderCategory();
  }

  app.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filt[b.dataset.f] = b.dataset.v;
    renderSub('.chip[data-f="' + b.dataset.f + '"][data-v="' + b.dataset.v + '"]');
  });
  app.addEventListener('input', (e) => { if (e.target.id === 'q') { filt.q = e.target.value; renderCategoryItems(); } });
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
  const photos = fetch(PHOTOS_URL).then((r) => (r.ok ? r.json() : {})).then((x) => x.images || {}).catch(() => ({}));
  fetch(DATA_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((db) => photos.then((p) => {
    PHOTOS = p;
    all = (db.species || []).filter((s) => CATS.includes(s.category));
    generic = findGeneric(db.species || []);
    GROUPS = groupsFrom(db);
    render();
  })).catch(() => { app.innerHTML = '<p>' + esc(t('loadError')) + '</p>'; });
})();
