// reef42 species database: overview → category list (#/fish, #/corals, #/inverts) → species card (#/fish/<id>).
(() => {
  'use strict';

  const DATA_URL = '../databases/reef42_marine_life_db_v1.json';
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
      search: 'Search by name…', all: 'All', count: '{n} species', none: 'No species match the filters.',
      back: '← All {cat}', notFound: 'Species not found.', loadError: 'Could not load the species data.',
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
      search: 'Keresés név alapján…', all: 'Mind', count: '{n} faj', none: 'Nincs a szűrésnek megfelelő faj.',
      back: '← Összes ({cat})', notFound: 'Nincs ilyen faj.', loadError: 'Nem sikerült betölteni a fajadatokat.',
      huOnly: '',
      size: 'Méret', maxSize: 'legfeljebb {n} cm', minTank: 'Minimális akváriumméret', liters: '{n} L', origin: 'Származás', care: 'Nehézség',
      reef: 'Zátonyakváriumba', temper: 'Természet', diet: 'Táplálkozás', lifespan: 'Élettartam', wild: 'vadon: {n} év', tank: 'akváriumban: {n} év',
      type: 'Típus', light: 'Fény', flow: 'Áramlás', placement: 'Elhelyezés', growth: 'Növekedés', aggression: 'Agresszivitás', spacing: 'Távolság', feeding: 'Táplálás',
      behavior: 'Viselkedés', extra: 'Fontos tudnivalók', tips: 'Pro tipp', sources: 'Források',
      notRec: 'Reef42: nem ajánlott', notRecText: 'Szerintünk ez a faj a legtöbb otthoni akváriumban hosszú távon nem tartható jól.',
      ethicScore: 'etikai index: {n}/10', provisional: 'Előzetes Reef42-értékelés, átnézés alatt.',
      draft: 'Tervezet: az adatok átnézés alatt állnak, vásárlás előtt mindig ellenőrizd.', feedback: 'javítás, ötlet:'
    }
  };

  // Enum labels: [en, hu]. Unknown values are not shown (the validator reports them).
  const ENUM = {
    care_level: { easy: ['Easy', 'Könnyű'], easy_moderate: ['Easy to moderate', 'Könnyű–közepes'], moderate: ['Moderate', 'Közepes'], difficult: ['Difficult', 'Nehéz'], expert: ['Experts only', 'Csak tapasztaltaknak'] },
    reef: { reef_safe: ['Reef safe', 'Zátonybiztos'], reef_safe_with_caution: ['With caution', 'Óvatosan'], conditional: ['Conditional', 'Feltételesen'] },
    temperament: {
      peaceful: ['Peaceful', 'Békés'], peaceful_pair: ['Peaceful, can be kept in pairs', 'Békés, párban is tartható'], shoaling: ['Shoaling', 'Csapatban élő'],
      peaceful_territorial: ['Peaceful but territorial', 'Békés, de területvédő'], semi_territorial: ['Somewhat territorial', 'Kissé területvédő'],
      territorial: ['Territorial', 'Területvédő'], semi_aggressive: ['Semi-aggressive', 'Félagresszív']
    },
    diet: {
      omnivore: ['Omnivore', 'Mindenevő'], carnivore: ['Carnivore', 'Ragadozó (húsevő)'], herbivore: ['Herbivore', 'Növényevő'],
      herbivore_omnivore: ['Mostly herbivore', 'Főleg növényevő'], omnivore_planktivore: ['Omnivore, plankton eater', 'Mindenevő, planktonevő'],
      detritivore_herbivore: ['Grazes algae and detritus', 'Algát és detrituszt legel'], specialized_microfauna: ['Specialist: tiny crustaceans (pods)', 'Specialista: apró rákocskák (podok)'],
      omnivore_scavenger: ['Omnivore, scavenger', 'Mindenevő, dögevő'], carnivore_scavenger: ['Carnivore, scavenger', 'Húsevő, dögevő'],
      scavenger_carnivore: ['Scavenger, carnivore', 'Dögevő, húsevő'], herbivore_grazer: ['Algae grazer', 'Algalegelő'],
      specialized_biofilm_feeder: ['Specialist: biofilm and detritus', 'Specialista: biofilm és detritusz']
    },
    coral_type: { SPS: ['SPS', 'SPS'], LPS: ['LPS', 'LPS'], soft: ['Soft coral', 'Lágykorall'], zoanthid: ['Zoanthid', 'Zoanthida'] },
    level: { low: ['Low', 'Alacsony'], low_moderate: ['Low to moderate', 'Alacsony–közepes'], moderate: ['Moderate', 'Közepes'], moderate_high: ['Moderate to high', 'Közepes–erős'], high: ['High', 'Erős'] },
    flow: { low_moderate: ['Low to moderate', 'Gyenge–közepes'], moderate: ['Moderate', 'Közepes'], moderate_strong: ['Moderate to strong', 'Közepes–erős'], strong: ['Strong', 'Erős'] },
    placement: {
      upper: ['Upper', 'Felső szint'], middle_upper: ['Middle to upper', 'Középső–felső szint'], middle: ['Middle', 'Középső szint'],
      middle_lower: ['Lower to middle', 'Alsó–középső szint'], bottom_middle: ['Bottom to middle', 'Aljzat–középső szint'], bottom: ['Bottom (sand)', 'Aljzat (homok)']
    },
    growth: { slow: ['Slow', 'Lassú'], slow_moderate: ['Slow to moderate', 'Lassú–közepes'], moderate: ['Moderate', 'Közepes'], moderate_fast: ['Moderate to fast', 'Közepes–gyors'], fast: ['Fast', 'Gyors'] },
    aggression: {
      low_moderate: ['Low to moderate', 'Alacsony–közepes'], moderate: ['Moderate', 'Közepes'], high: ['High (sweeper tentacles)', 'Erős (csalánzó tapogatók)'],
      very_high: ['Very high (long sweepers)', 'Nagyon erős (hosszú csalánzó tapogatók)'], chemical: ['Chemical (terpenes)', 'Kémiai (terpének)']
    },
    feeding: { photosynthetic_with_optional_target_feeding: ['Photosynthetic, optional target feeding', 'Fotoszintetizál, célzott etetés opcionális'] }
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
  const FILTERS = {};
  CATS.forEach((c) => { FILTERS[c] = { q: '', care: '', type: '' }; });
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

  // Texts and source URLs that repeat across many species carry no species information.
  function findGeneric(list) {
    const n = new Map();
    const add = (x) => { if (x) n.set(x, (n.get(x) || 0) + 1); };
    list.forEach((s) => {
      [...(s.extra_notes || []), ...(s.pro_tips || []), ...((s.behavior && s.behavior.notes) || []), ...((s.ethical_index && s.ethical_index.reasons) || [])].forEach(add);
      if (s.feeding) add(s.feeding.notes);
      new Set((s.sources || []).map((x) => x.url)).forEach(add);
    });
    return new Set([...n].filter(([, c]) => c >= GENERIC_MIN).map(([k]) => k));
  }
  function sourcesOf(s) {
    const seen = new Set();
    return (s.sources || []).filter((x) => {
      if (!x.url || seen.has(x.url) || generic.has(x.url)) return false;
      try { if (new URL(x.url).pathname.replace(/\/+$/, '') === '') return false; } catch (e) { return false; }
      seen.add(x.url);
      return true;
    });
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

  /* ---------- list ---------- */
  function matches(s) {
    if (filt.care && s.care_level !== filt.care) return false;
    if (filt.type && s.coral_type !== filt.type) return false;
    const q = norm(filt.q.trim());
    return !q || norm([s.hu_name, s.common_name, s.scientific_name].join(' ')).includes(q);
  }
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
  function tags(s) {
    const out = [];
    if (CAT === 'coral' && lab('coral_type', s.coral_type)) out.push('<span class="tag">' + esc(lab('coral_type', s.coral_type)) + '</span>');
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
  function renderList(keepFocus) {
    document.title = t(CAT) + ' – reef42';
    const cares = CARE_ORDER.filter((c) => species.some((s) => s.care_level === c));
    const types = CAT === 'coral' ? [...new Set(species.map((s) => s.coral_type).filter((v) => lab('coral_type', v)))] : [];
    app.innerHTML = '<h1>' + esc(t(CAT)) + '</h1><p class="lead">' + esc(t('lead_' + CAT)) + '</p>' +
      (t('huOnly') ? '<p class="notice">' + esc(t('huOnly')) + '</p>' : '') +
      '<div class="filters"><input class="search" id="q" type="search" autocomplete="off" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '" value="' + esc(filt.q) + '">' +
      (types.length ? chipRow('type', types, (v) => lab('coral_type', v)) : '') + chipRow('care', cares, (v) => lab('care_level', v)) + '</div>' +
      '<p class="count" id="count" aria-live="polite"></p><ul class="grid" id="list"></ul>';
    renderItems();
    if (keepFocus) { const el = app.querySelector(keepFocus); if (el) el.focus(); }
  }
  function renderItems() {
    const items = species.filter(matches)
      .sort((a, b) => CARE_ORDER.indexOf(a.care_level) - CARE_ORDER.indexOf(b.care_level) || title(a).localeCompare(title(b), lang));
    document.getElementById('count').textContent = t('count', { n: items.length });
    document.getElementById('list').innerHTML = items.length ? items.map((s) =>
      '<li><a class="tile" href="#/' + SLUG[CAT] + '/' + esc(s.id) + '"><h2>' + esc(title(s)) + '</h2>' +
      '<p class="sub">' + (lang === 'hu' && s.hu_name && s.common_name ? esc(s.common_name) + ' · ' : '') + '<span class="sci">' + esc(s.scientific_name) + '</span></p>' +
      tags(s) + '<p class="facts-mini">' + miniFacts(s) + '</p></a></li>').join('') : '<li class="empty">' + esc(t('none')) + '</li>';
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
  function renderSpecies(id) {
    const s = species.find((x) => x.id === id);
    const back = '<a class="back" href="#/' + SLUG[CAT] + '">' + esc(t('back', { cat: t(CAT).toLowerCase() })) + '</a>';
    if (!s) { app.innerHTML = back + '<p>' + esc(t('notFound')) + '</p>'; return; }
    document.title = title(s) + ' – ' + t(CAT) + ' – reef42';
    const names = [lang === 'hu' && s.hu_name ? s.common_name : '', '<span class="sci">' + esc(s.scientific_name) + '</span>'].filter(Boolean);
    const feedNote = s.feeding && s.feeding.notes && !generic.has(s.feeding.notes) ? [s.feeding.notes] : [];
    const src = sourcesOf(s);
    app.innerHTML = back + (t('huOnly') ? '<p class="notice">' + esc(t('huOnly')) + '</p>' : '') +
      '<article class="card"><div class="card-head"><h1>' + esc(title(s)) + '</h1><p class="names">' +
      names.map((n, i) => (i === names.length - 1 ? n : esc(n))).join(' · ') + '</p>' + tags(s) + '</div>' +
      ethicBox(s) + '<dl class="facts">' + facts(s) + '</dl>' +
      listSection(t('behavior'), s.behavior && s.behavior.notes) + listSection(t('feeding'), feedNote) +
      listSection(t('extra'), s.extra_notes) + listSection(t('tips'), s.pro_tips, 'tip') +
      (src.length ? '<section class="sect sources"><h2>' + esc(t('sources')) + '</h2><ul>' + src.map((x) =>
        '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a></li>').join('') + '</ul></section>' : '') +
      '</article>';
  }

  /* ---------- overview ---------- */
  function renderHome() {
    document.title = t('app') + ' – reef42';
    app.innerHTML = '<h1>' + esc(t('app')) + '</h1><p class="lead">' + esc(t('lead_home')) + '</p><ul class="grid cats">' +
      CATS.map((c) => {
        const n = all.filter((s) => s.category === c).length;
        return '<li><a class="tile cat" href="#/' + SLUG[c] + '"><img src="assets/' + c + '.svg" alt="" width="44" height="44">' +
          '<h2>' + esc(t(c)) + '</h2><p class="sub">' + esc(t('lead_' + c)) + '</p><span class="go">' + esc(t('open', { n: n })) + '</span></a></li>';
      }).join('') + '</ul>';
  }

  /* ---------- routing ---------- */
  // #/ = overview, #/<category slug> = list, #/<category slug>/<species id> = card. Old #/<id> links still resolve.
  function route() {
    const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/').filter(Boolean);
    if (!parts.length) return { cat: null, id: '' };
    if (BY_SLUG[parts[0]]) return { cat: BY_SLUG[parts[0]], id: parts[1] || '' };
    const s = all.find((x) => x.id === parts[0]);
    return s ? { cat: s.category, id: s.id } : { cat: null, id: '' };
  }
  function render(keepFocus) {
    const r = route();
    CAT = r.cat;
    if (CAT) { species = all.filter((s) => s.category === CAT); filt = FILTERS[CAT]; }
    renderChrome();
    if (!CAT) renderHome();
    else if (r.id) renderSpecies(r.id);
    else renderList(keepFocus);
  }

  app.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filt[b.dataset.f] = b.dataset.v;
    renderList('.chip[data-f="' + b.dataset.f + '"][data-v="' + b.dataset.v + '"]');
  });
  app.addEventListener('input', (e) => { if (e.target.id === 'q') { filt.q = e.target.value; renderItems(); } });
  window.addEventListener('hashchange', () => {
    render();
    const r = route();
    if (r.cat && !r.id) window.scrollTo(0, listScroll[r.cat] || 0);
    else { window.scrollTo(0, 0); app.focus({ preventScroll: true }); }
  });
  window.addEventListener('scroll', () => { const r = route(); if (r.cat && !r.id) listScroll[r.cat] = window.scrollY; }, { passive: true });

  langPicker = reef42Lang.mount(document.getElementById('langToggle'), {
    get: () => lang,
    set: (code) => { lang = code; ls(false, LANG_KEY, lang); render(); }
  });

  renderChrome();
  fetch(DATA_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((db) => {
    all = (db.species || []).filter((s) => CATS.includes(s.category));
    generic = findGeneric(db.species || []);
    render();
  }).catch(() => { app.innerHTML = '<p>' + esc(t('loadError')) + '</p>'; });
})();
