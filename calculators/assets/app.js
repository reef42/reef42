(() => {
  'use strict';

  const STORE = 'reef42-calcs-v1';
  const LANGKEY = 'reef42-lang';
  const TANKLOG = 'reef42-tanklog-v1';
  const L_PER_USGAL = 3.785411784;
  const L_PER_UKGAL = 4.54609;
  const SW_DENSITY = 1.0234; // kg/L, 35 ppt at 25 °C (EOS-80)
  const MAX_PPT_PER_DAY = 1;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }

  let lang = new URLSearchParams(location.search).get('lang') || lsGet(LANGKEY) ||
    ((navigator.language || '').toLowerCase().indexOf('hu') === 0 ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';

  const S = (() => {
    const fresh = { units: /^en-us/i.test(navigator.language || '') ? 'us' : 'metric', sal: 'ppt', inputs: {}, lastVolume: null };
    try {
      const o = JSON.parse(lsGet(STORE));
      if (o && typeof o === 'object') {
        return {
          units: ['metric', 'us', 'uk'].indexOf(o.units) >= 0 ? o.units : 'metric',
          sal: o.sal === 'sg' ? 'sg' : 'ppt',
          inputs: o.inputs && typeof o.inputs === 'object' ? o.inputs : {},
          lastVolume: Number(o.lastVolume) > 0 ? Number(o.lastVolume) : null,
        };
      }
    } catch (e) { /* ignore broken storage */ }
    return fresh;
  })();
  function save() { lsSet(STORE, JSON.stringify(S)); }

  /* ---------- Text ---------- */

  const TEXT = {
    en: {
      brand: 'Calculators', all: 'All', units: 'Units', salScale: 'Salinity',
      metric: 'metric (L, cm, kg, °C)', us: 'US (gal, in, lb, °F)', uk: 'UK (imp. gal, in, lb, °F)',
      intro: 'Quick reef aquarium calculations. Each calculator shows how it works, with sources wherever the formula or the numbers are not common knowledge.',
      open: 'open →', result: 'Result', fill: 'Fill in the fields to see the result.', clear: 'Clear fields',
      how: 'How it is calculated', formula: 'Formula', notes: 'Good to know', sources: 'Sources',
      fromTank: 'Tank Log', fromCalc: 'Volume calculator', notFound: 'This calculator does not exist.',
      storage: 'Your inputs are remembered in this browser only.', feedback: 'feedback and ideas:',
      salHint: 'Type ppt (35) or SG (1.026), both are understood.', est: 'estimate', pcs: 'pcs',
      title: 'Reef Calculators',
    },
    hu: {
      brand: 'Kalkulátorok', all: 'Összes', units: 'Mértékegység', salScale: 'Sótartalom',
      metric: 'metrikus (l, cm, kg, °C)', us: 'USA (gal, in, lb, °F)', uk: 'UK (imp. gal, in, lb, °F)',
      intro: 'Gyors számítások tengeri akváriumhoz. Minden kalkulátor megmutatja, hogyan számol, és forrást ad ott, ahol a képlet vagy a számok nem közismertek.',
      open: 'megnyitás →', result: 'Eredmény', fill: 'Töltsd ki a mezőket az eredményhez.', clear: 'Mezők törlése',
      how: 'Hogyan számol?', formula: 'Képlet', notes: 'Jó tudni', sources: 'Források',
      fromTank: 'Tank Log', fromCalc: 'Térfogat-kalkulátor', notFound: 'Nincs ilyen kalkulátor.',
      storage: 'A beírt értékeket csak ez a böngésző jegyzi meg.', feedback: 'visszajelzés, ötletek:',
      salHint: 'Írhatsz ppt-t (35) vagy SG-t (1,026), mindkettőt felismeri.', est: 'becslés', pcs: 'db',
      title: 'Kalkulátorok – reef42',
    },
  };
  const t = (k) => (TEXT[lang][k] != null ? TEXT[lang][k] : TEXT.en[k] || k);
  const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] != null ? o[lang] : o.en);
  const locale = () => (lang === 'hu' ? 'hu-HU' : 'en-US');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- Numbers ---------- */

  function parseNum(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }
  function fmt(v, max = 2, min = 0) {
    if (v == null || !isFinite(v)) return '–';
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: max, minimumFractionDigits: min }).format(v);
  }
  function fmtIn(v, max = 2, min = 0) {
    if (v == null || !isFinite(v)) return '';
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: max, minimumFractionDigits: min, useGrouping: false }).format(v);
  }
  const pos = (...a) => a.every((x) => typeof x === 'number' && isFinite(x) && x > 0);
  const num = (x) => typeof x === 'number' && isFinite(x);

  /* ---------- Seawater (UNESCO EOS-80 density, PSS-78 conductivity) ---------- */

  function solveInc(f, y, lo, hi) {
    if (!num(y) || y < f(lo) || y > f(hi)) return NaN;
    for (let i = 0; i < 100; i++) {
      const m = (lo + hi) / 2;
      if (f(m) < y) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }
  const SW = {
    rhow: (t) => 999.842594 + t * (6.793952e-2 + t * (-9.095290e-3 + t * (1.001685e-4 + t * (-1.120083e-6 + t * 6.536332e-9)))),
    rho(s, t) {
      const A = 8.24493e-1 + t * (-4.0899e-3 + t * (7.6438e-5 + t * (-8.2467e-7 + t * 5.3875e-9)));
      const B = -5.72466e-3 + t * (1.0227e-4 - t * 1.6546e-6);
      return SW.rhow(t) + A * s + B * Math.pow(s, 1.5) + 4.8314e-4 * s * s;
    },
    sg: (s, t = 25) => SW.rho(s, t) / SW.rhow(t),
    pptFromSg: (g, t = 25) => solveInc((s) => SW.sg(s, t), g, 0, 70),
    rt: (t) => 0.6766097 + t * (2.00564e-2 + t * (1.104259e-4 + t * (-6.9698e-7 + t * 1.0031e-9))),
    pss(Rt, t) {
      const a = [0.0080, -0.1692, 25.3851, 14.0941, -7.0261, 2.7081];
      const b = [0.0005, -0.0056, -0.0066, -0.0375, 0.0636, -0.0144];
      const r = Math.sqrt(Rt);
      let sa = 0; let sb = 0; let p = 1;
      for (let i = 0; i < 6; i++) { sa += a[i] * p; sb += b[i] * p; p *= r; }
      return sa + ((t - 15) / (1 + 0.0162 * (t - 15))) * sb;
    },
    pptFromCond: (c) => (c > 0 ? SW.pss(c / (42.914 * SW.rt(25)), 25) : NaN),
    condFromPpt: (s) => solveInc((c) => SW.pptFromCond(c), s, 0.5, 120),
  };
  const salParse = (x) => (x > 0.95 && x < 1.1 ? SW.pptFromSg(x) : x);

  /* ---------- Units ---------- */

  const U = {
    len: { metric: ['cm', 1, 1], us: ['in', 2.54, 2], uk: ['in', 2.54, 2] },
    vol: { metric: [{ en: 'L', hu: 'l' }, 1, 1], us: ['US gal', L_PER_USGAL, 2], uk: ['UK gal', L_PER_UKGAL, 2] },
    mass: { metric: ['kg', 1, 2], us: ['lb', 0.45359237, 2], uk: ['lb', 0.45359237, 2] },
    dens: { metric: [{ en: 'kg/L', hu: 'kg/l' }, 1, 3], us: ['lb/ft³', 0.0160184634, 1], uk: ['lb/ft³', 0.0160184634, 1] },
  };
  function conv(f) {
    const kind = f.kind;
    if (U[kind]) {
      const u = U[kind][S.units];
      return { to: (x) => x / u[1], from: (x) => x * u[1], unit: L(u[0]), dec: u[2], min: 0 };
    }
    if (kind === 'temp') {
      return S.units === 'metric'
        ? { to: (x) => x, from: (x) => x, unit: '°C', dec: 1, min: 0 }
        : { to: (x) => x * 9 / 5 + 32, from: (x) => (x - 32) * 5 / 9, unit: '°F', dec: 1, min: 0 };
    }
    if (kind === 'sal') {
      return S.sal === 'sg'
        ? { to: (x) => SW.sg(x), from: salParse, unit: 'SG', dec: 4, min: 4 }
        : { to: (x) => x, from: salParse, unit: 'ppt', dec: 2, min: 0 };
    }
    return { to: (x) => x, from: (x) => (kind === 'int' ? Math.round(x) : x), unit: L(f.unit || ''), dec: f.dec != null ? f.dec : 3, min: 0 };
  }
  const volUnit = () => L(U.vol[S.units][0]);
  function qVol(l) {
    const all = [[l, volUnit(), 1, 'metric'], [l / L_PER_USGAL, 'US gal', 1, 'us'], [l / L_PER_UKGAL, 'UK gal', 1, 'uk']];
    const main = all.find((a) => a[3] === S.units);
    const rest = all.filter((a) => a !== main).map((a) => fmt(a[0], a[2]) + ' ' + (a[3] === 'metric' ? L({ en: 'L', hu: 'l' }) : a[1]));
    return { v: fmt(main[0], main[3] === 'metric' ? 1 : 1) + ' ' + main[1], alt: rest.join(' · ') };
  }
  function qLen(cm) { return S.units === 'metric' ? fmt(cm, 1) + ' cm' : fmt(cm / 2.54, 2) + ' in'; }
  function qMass(kg) {
    if (S.units === 'metric') return kg < 1 ? fmt(kg * 1000, 0) + ' g' : fmt(kg, kg < 10 ? 2 : 1) + ' kg';
    const lb = kg / 0.45359237;
    return lb < 1 ? fmt(lb * 16, 1) + ' oz' : fmt(lb, lb < 10 ? 2 : 1) + ' lb';
  }
  function qMassAlt(kg) {
    if (S.units !== 'metric') return kg < 1 ? fmt(kg * 1000, 0) + ' g' : fmt(kg, 2) + ' kg';
    const lb = kg / 0.45359237;
    return lb < 1 ? fmt(lb * 16, 1) + ' oz' : fmt(lb, 2) + ' lb';
  }
  function qSal(ppt) {
    const sg = SW.sg(ppt);
    return S.sal === 'sg'
      ? { v: 'SG ' + fmt(sg, 4, 4), alt: fmt(ppt, 1) + ' ppt' }
      : { v: fmt(ppt, 1) + ' ppt', alt: 'SG ' + fmt(sg, 4, 4) };
  }
  const salShort = (ppt) => (S.sal === 'sg' ? fmt(SW.sg(ppt), 4, 4) : fmt(ppt, 1));

  /* ---------- Result helpers ---------- */

  const out = (label, value, sub, cls) =>
    '<div class="out' + (cls ? ' ' + cls : '') + '"><span class="ol">' + esc(L(label)) + '</span><strong class="ov">' + esc(value) +
    '</strong>' + (sub ? '<span class="os">' + esc(L(sub)) + '</span>' : '') + '</div>';
  const outQ = (label, q, cls) => out(label, q.v, q.alt, cls);
  const note = (txt, cls) => '<p class="note' + (cls ? ' ' + cls : '') + '">' + esc(L(txt)) + '</p>';
  const steps = (arr) => '<ol class="steps">' + arr.map((s) => '<li>' + esc(L(s)) + '</li>').join('') + '</ol>';
  const fill = () => '<p class="empty">' + esc(t('fill')) + '</p>';

  /* ---------- Shared data ---------- */

  // Salts sold in Hungarian reef shops; g/L of dry salt for 35 ppt.
  const BRANDS = [
    { v: 'redsea', n: 'Red Sea Salt', r: 37.7 },
    { v: 'coralpro', n: 'Red Sea Coral Pro', r: 38.2 },
    { v: 'tm', n: 'Tropic Marin (Pro-Reef, Syn-Biotic, Bio-Actif)', r: 40 },
    { v: 'af', n: 'Aquaforest Reef Salt', r: 41.4 },
    { v: 'fm', n: 'Fauna Marin Professional Sea Salt', r: 39 },
    { v: 'io', n: 'Instant Ocean / Reef Crystals', r: 37.7, est: true },
    { v: 'custom', n: { en: 'Other (enter g/L)', hu: 'Egyéb (add meg: g/l)' } },
  ];
  const brandOpts = BRANDS.map((b) => ({ v: b.v, l: b.r
    ? { en: b.n + ' – ' + b.r + ' g/L' + (b.est ? ' (estimate)' : ''), hu: b.n + ' – ' + String(b.r).replace('.', ',') + ' g/l' + (b.est ? ' (becslés)' : '') }
    : b.n }));
  function brandRate(v) {
    const b = BRANDS.find((x) => x.v === v.brand) || BRANDS[0];
    return { b, rate: b.v === 'custom' ? v.rate : b.r };
  }
  function perVol(gPerL) {
    if (S.units === 'metric') return fmt(gPerL, 1) + ' g/' + volUnit();
    const f = S.units === 'us' ? L_PER_USGAL : L_PER_UKGAL;
    return fmt(gPerL * f, 0) + ' g/gal';
  }

  const SRC = {
    rcVolume: { t: 'ReefCalcs – Aquarium volume calculator', u: 'https://reefcalcs.com/calculators/aquarium-volume/' },
    rcSalt: { t: 'ReefCalcs – Salt mix calculator (manufacturer mixing ratios, collected)', u: 'https://reefcalcs.com/calculators/salt-mix/' },
    rcDirect: { t: 'ReefCalcs – Direct salt addition (1 ppt/day limit, brine strength)', u: 'https://reefcalcs.com/calculators/direct-salt/' },
    rcSand: { t: 'ReefCalcs – Aquarium sand calculator (CaribSea density)', u: 'https://reefcalcs.com/calculators/aquarium-sand-calculator/' },
    rcSal: { t: 'ReefCalcs – Salinity converter', u: 'https://reefcalcs.com/calculators/salinity/' },
    rcWc: { t: 'ReefCalcs – Water change calculator', u: 'https://reefcalcs.com/calculators/water-change/' },
    unesco: { t: 'Fofonoff & Millard (1983): Algorithms for computation of fundamental properties of seawater, UNESCO Technical Papers in Marine Science 44 (PSS-78, EOS-80)', u: 'https://repository.oceanbestpractices.org/handle/11329/109' },
    tmSalt: { t: 'Tropic Marin – PRO-REEF Sea Salt (35 ml ≈ 37–40 g per litre for 32–35 ‰)', u: 'https://www.marinedepot.com/tropic-marin-pro-reef-salt' },
    afSalt: { t: 'Aquaforest – Reef Salt (390 g per 10 L for 33 ppt)', u: 'https://aquaforest.eu/en/products/lab/salts/reef-salt/' },
    fmSalt: { t: 'Fauna Marin Professional Sea Salt (38.5–39.5 g per litre for 35 psu, retailer copy)', u: 'https://www.rockncritters.co.uk/marine-salt/fauna-marin-professional-sea-salt/fm048' },
    seachem: { t: 'Seachem – PhosGuard', u: 'https://www.seachem.com/phosguard.php' },
    phosnet: { t: 'Seachem – PhosNet dosing instructions', u: 'https://seachem.zendesk.com/hc/en-us/articles/115001609193-Info-Seachem-PhosNet-Dosing-Instructions' },
    elimiphos: { t: 'Tropic Marin Elimi-Phos dosage (retailer copy of the instructions)', u: 'https://charterhouse-aquatics.com/products/tropic-marin-elimi-phos-200g' },
    rowa: { t: 'ROWAphos dosage (retailer copy of the D-D instructions)', u: 'https://www.aquaristikshop.com/aquaristic/ROWAphos/285000/' },
  };

  // Area of a circular segment with chord c and height h (sagitta).
  function segmentArea(c, h) {
    if (!(h > 0) || !(c > 0)) return 0;
    const r = (c * c / 4 + h * h) / (2 * h);
    return r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - h * h);
  }

  /* ---------- Calculators ---------- */

  const volChips = true;

  const CALCS = [
    {
      id: 'volume',
      name: { en: 'Aquarium volume', hu: 'Akvárium térfogata' },
      desc: {
        en: 'Rectangular, cylinder, half-cylinder, hexagonal and bow-front tanks, with glass thickness, water level, sump and rock displacement.',
        hu: 'Téglatest, henger, félhenger, hatszög és íves előlapú akvárium, üvegvastagsággal, vízszinttel, sumppal és kőzetkiszorítással.',
      },
      fields: [
        { id: 'shape', kind: 'sel', def: 'rect', wide: true, label: { en: 'Shape', hu: 'Forma' }, opts: [
          { v: 'rect', l: { en: 'Rectangular / cube', hu: 'Téglatest / kocka' } },
          { v: 'cyl', l: { en: 'Cylinder', hu: 'Henger' } },
          { v: 'half', l: { en: 'Half cylinder', hu: 'Félhenger' } },
          { v: 'hex', l: { en: 'Hexagon (regular)', hu: 'Hatszög (szabályos)' } },
          { v: 'bow', l: { en: 'Bow front', hu: 'Íves előlap' } },
        ] },
        { id: 'L', kind: 'len', label: { en: 'Length', hu: 'Hossz' }, show: (v) => v.shape === 'rect' || v.shape === 'bow' },
        { id: 'W', kind: 'len', label: { en: 'Width (front to back)', hu: 'Szélesség (elölről hátra)' }, show: (v) => v.shape === 'rect' },
        { id: 'We', kind: 'len', label: { en: 'Depth at the ends', hu: 'Szélesség a két végén' }, show: (v) => v.shape === 'bow' },
        { id: 'Wc', kind: 'len', label: { en: 'Depth at the centre', hu: 'Szélesség középen' }, show: (v) => v.shape === 'bow' },
        { id: 'D', kind: 'len', label: { en: 'Diameter', hu: 'Átmérő' }, show: (v) => v.shape === 'cyl' || v.shape === 'half',
          hint: { en: 'Half cylinder: the length of the flat back wall.', hu: 'Félhengernél a hátsó, egyenes fal hossza.' } },
        { id: 's', kind: 'len', label: { en: 'Side length', hu: 'Oldalhossz' }, show: (v) => v.shape === 'hex',
          hint: { en: 'If you measured across the flats (d): side = d ÷ 1.732.', hu: 'Ha két szemközti oldal távolságát mérted (d): oldal = d ÷ 1,732.' } },
        { id: 'H', kind: 'len', label: { en: 'Height', hu: 'Magasság' } },
        { id: 'glass', kind: 'len', label: { en: 'Glass thickness', hu: 'Üvegvastagság' },
          hint: { en: 'Only if you measured outside. Leave empty for inside dimensions.', hu: 'Csak ha kívülről mértél. Belső méreteknél hagyd üresen.' } },
        { id: 'gap', kind: 'len', label: { en: 'Water level below the rim', hu: 'Vízszint a perem alatt' } },
        { id: 'disp', kind: 'num', unit: '%', dec: 1, label: { en: 'Rock and sand displacement', hu: 'Kőzet és homok kiszorítása' },
          hint: { en: 'Your own estimate; leave empty if unsure.', hu: 'Saját becslés; hagyd üresen, ha nem tudod.' } },
        { id: 'sump', kind: 'vol', label: { en: 'Sump and other vessels (water)', hu: 'Sump és egyéb tartályok (víz)' } },
      ],
      compute(v) {
        const g = v.glass || 0;
        const hFull = (v.H || 0) - g;
        const h = hFull - (v.gap || 0);
        let area = null;
        if (v.shape === 'rect' && pos(v.L, v.W)) area = (v.L - 2 * g) * (v.W - 2 * g);
        else if ((v.shape === 'cyl' || v.shape === 'half') && pos(v.D)) { const r = (v.D - 2 * g) / 2; area = Math.PI * r * r * (v.shape === 'half' ? 0.5 : 1); }
        else if (v.shape === 'hex' && pos(v.s)) { const s = v.s - 2 * g / Math.sqrt(3); area = (3 * Math.sqrt(3) / 2) * s * s; }
        else if (v.shape === 'bow' && pos(v.L, v.We, v.Wc)) {
          if (v.Wc < v.We) return note({ en: 'The centre depth must be at least the end depth.', hu: 'A középső szélesség nem lehet kisebb a két végénél.' }, 'warn');
          const c = v.L - 2 * g;
          area = c * (v.We - 2 * g) + segmentArea(c, v.Wc - v.We);
        }
        if (area == null || !pos(v.H)) return fill();
        if (!(area > 0) || !(h > 0)) return note({ en: 'Check the dimensions: glass and water level leave no room for water.', hu: 'Ellenőrizd a méreteket: az üveg és a vízszint után nem marad hely a víznek.' }, 'warn');
        const gross = area * hFull / 1000;
        const water = area * h / 1000;
        const disp = Math.min(Math.max(v.disp || 0, 0), 90);
        const net = water * (1 - disp / 100);
        const sys = net + (v.sump || 0);
        S.lastVolume = Math.round(sys * 10) / 10;
        save();
        let html = outQ({ en: 'Total water in the system', hu: 'Teljes víztérfogat a rendszerben' }, qVol(sys), 'main');
        html += outQ({ en: 'Inside volume up to the rim', hu: 'Belső űrtartalom a peremig' }, qVol(gross));
        if (v.gap) html += outQ({ en: 'Water in the display at this water level', hu: 'Víz a díszakváriumban ennél a vízszintnél' }, qVol(water));
        if (disp) html += outQ({ en: 'Display water after displacement', hu: 'Víz a díszakváriumban kiszorítás után' }, qVol(net));
        html += out({ en: 'Weight of the display water', hu: 'A díszakvárium vizének tömege' }, qMass(net * SW_DENSITY),
          { en: '≈ ' + qMassAlt(net * SW_DENSITY) + ' · seawater 1.023 kg/L, without glass, rock and sand', hu: '≈ ' + qMassAlt(net * SW_DENSITY) + ' · tengervíz 1,023 kg/l, üveg, kőzet és homok nélkül' });
        html += note({ en: 'The other calculators offer this total as a one-click volume.', hu: 'A többi kalkulátor egy kattintással felajánlja ezt a teljes térfogatot.' });
        return html;
      },
      formula: {
        en: ['Rectangular: L × W × H', 'Cylinder: π × (D/2)² × H; half cylinder: half of that', 'Regular hexagon: (3√3 / 2) × side² × H',
          'Bow front: L × end depth × H + circular segment (chord = L, height = centre depth − end depth) × H',
          'Glass: 2 × thickness off every horizontal dimension, 1 × off the height (bottom pane)', 'cm³ ÷ 1000 = litres; 1 US gal = 3.785 L, 1 UK gal = 4.546 L',
          'Seawater density 1.0234 kg/L at 35 ppt and 25 °C (EOS-80)'],
        hu: ['Téglatest: H × Sz × M', 'Henger: π × (Á/2)² × M; félhenger: ennek a fele', 'Szabályos hatszög: (3√3 / 2) × oldal² × M',
          'Íves előlap: H × szélesség a végeken × M + körszelet (húr = H, magasság = középső − végső szélesség) × M',
          'Üveg: minden vízszintes méretből 2 × vastagság, a magasságból 1 × (fenéklap)', 'cm³ ÷ 1000 = liter; 1 US gal = 3,785 l, 1 UK gal = 4,546 l',
          'Tengervíz sűrűsége 1,0234 kg/l, 35 ppt és 25 °C mellett (EOS-80)'],
      },
      notes: {
        en: ['Live rock and sand typically take a noticeable part of the volume; dosing calculators need the real water volume.'],
        hu: ['Az élőkő és a homok a térfogat érezhető részét elfoglalja; az adagolási kalkulátoroknak a valódi víztérfogat kell.'],
      },
      sources: [SRC.unesco],
    },
    {
      id: 'saltmix',
      name: { en: 'Salt mix', hu: 'Sókeverés' },
      desc: { en: 'How much salt a batch of new saltwater needs.', hu: 'Mennyi só kell egy adag új tengervízhez.' },
      fields: [
        { id: 'V', kind: 'vol', chips: volChips, label: { en: 'RO/DI water', hu: 'RO/DI víz mennyisége' } },
        { id: 'target', kind: 'sal', def: 35, label: { en: 'Target salinity', hu: 'Cél sótartalom' }, hint: 'salHint' },
        { id: 'brand', kind: 'sel', def: 'redsea', wide: true, label: { en: 'Salt (g/L for 35 ppt)', hu: 'Só (g/l 35 ppt-hez)' }, opts: brandOpts },
        { id: 'rate', kind: 'num', unit: { en: 'g/L', hu: 'g/l' }, dec: 2, label: { en: 'Grams per litre for 35 ppt', hu: 'Gramm literenként 35 ppt-hez' }, show: (v) => v.brand === 'custom',
          hint: { en: 'From the salt bucket; scale it to 35 ppt if needed.', hu: 'A só dobozáról; ha kell, számold át 35 ppt-re.' } },
      ],
      compute(v) {
        const { b, rate } = brandRate(v);
        if (!pos(v.V, v.target, rate)) return fill();
        const r = rate * v.target / 35;
        const grams = r * v.V;
        let html = out({ en: 'Salt needed', hu: 'Szükséges só' }, qMass(grams / 1000), (b.est ? t('est') + ' · ' : '') + '≈ ' + qMassAlt(grams / 1000), 'main');
        html += out({ en: 'Add first', hu: 'Először ennyit tegyél bele' }, qMass(grams * 0.9 / 1000), { en: '90%, then measure and top up', hu: '90%, utána mérés és pótlás' });
        html += out({ en: 'Dose at this salinity', hu: 'Adagolás ennél a sótartalomnál' }, perVol(r), qSal(v.target).v + ' · ' + qSal(v.target).alt);
        html += steps([
          { en: 'Fill the RO/DI water, start a pump and a heater.', hu: 'Töltsd be az RO/DI vizet, indíts pumpát és fűtőt.' },
          { en: 'Add 90% of the salt slowly into the flow.', hu: 'A só 90%-át lassan szórd az áramlásba.' },
          { en: 'When it is clear and at tank temperature, measure.', hu: 'Ha kitisztult és akváriumhőmérsékletű, mérj.' },
          { en: 'Add the rest in small portions until you reach the target.', hu: 'A maradékot kis adagokban add hozzá, amíg el nem éred a célt.' },
        ]);
        return html;
      },
      formula: {
        en: ['salt (g) = brand dose at 35 ppt (g/L) × target ppt ÷ 35 × litres of water', 'SG ↔ ppt: UNESCO EOS-80 at 25 °C (35 ppt = SG 1.0264)'],
        hu: ['só (g) = gyártói adag 35 ppt-hez (g/l) × cél ppt ÷ 35 × víz litere', 'SG ↔ ppt: UNESCO EOS-80, 25 °C (35 ppt = SG 1,0264)'],
      },
      notes: {
        en: ['Mixing ratios vary between batches; always measure the finished water.',
          'Instant Ocean and Reef Crystals are estimates: the maker publishes only cup measures.',
          'Tropic Marin: 35 mL ≈ 37–40 g per litre gives 32–35 ‰, so 40 g/L is used for 35 ppt. Aquaforest: 39 g/L for 33 ppt, scaled to 35 ppt.',
          'Not listed (for example H2Ocean, Blau, Sera, ReeFlowers): choose “Other” and enter the dose from the bucket.'],
        hu: ['A keverési arány gyártási tételenként változhat, a kész vizet mindig mérd meg.',
          'Az Instant Ocean és a Reef Crystals értéke becslés: a gyártó csak bögrényi mennyiséget ad meg.',
          'Tropic Marin: 35 ml ≈ 37–40 g literenként 32–35 ‰-et ad, ezért 35 ppt-hez 40 g/l-rel számol. Aquaforest: 39 g/l 33 ppt-hez, 35 ppt-re arányosítva.',
          'Ha a sód nincs a listán (pl. H2Ocean, Blau, Sera, ReeFlowers), válaszd az „Egyéb” lehetőséget, és add meg a dobozon szereplő adagot.'],
      },
      sources: [SRC.rcSalt, SRC.tmSalt, SRC.afSalt, SRC.fmSalt, SRC.unesco],
    },
    {
      id: 'directsalt',
      name: { en: 'Salinity correction', hu: 'Sótartalom korrekciója' },
      desc: {
        en: 'Raise salinity by adding dissolved salt to the tank, or lower it with RO/DI water, spread safely over several days.',
        hu: 'Sótartalom emelése közvetlenül adagolt, feloldott sóval, vagy csökkentése RO/DI vízzel, biztonságosan több napra elosztva.',
      },
      fields: [
        { id: 'V', kind: 'vol', chips: volChips, wide: true, label: { en: 'Water in the system', hu: 'Víz a rendszerben' },
          hint: { en: 'The real water volume with the sump, without rock and sand.', hu: 'A valódi víztérfogat sumppal együtt, kőzet és homok nélkül.' } },
        { id: 'cur', kind: 'sal', label: { en: 'Current salinity', hu: 'Jelenlegi sótartalom' }, hint: 'salHint' },
        { id: 'target', kind: 'sal', def: 35, label: { en: 'Target salinity', hu: 'Cél sótartalom' } },
        { id: 'brand', kind: 'sel', def: 'redsea', wide: true, label: { en: 'Salt (g/L for 35 ppt)', hu: 'Só (g/l 35 ppt-hez)' }, opts: brandOpts },
        { id: 'rate', kind: 'num', unit: { en: 'g/L', hu: 'g/l' }, dec: 2, label: { en: 'Grams per litre for 35 ppt', hu: 'Gramm literenként 35 ppt-hez' }, show: (v) => v.brand === 'custom' },
      ],
      compute(v) {
        if (!pos(v.V, v.cur, v.target)) return fill();
        const d = v.target - v.cur;
        if (Math.abs(d) < 0.05) return note({ en: 'You are already at the target.', hu: 'Már a célértéken vagy.' }, 'ok');
        const days = Math.max(1, Math.ceil(Math.abs(d) / MAX_PPT_PER_DAY - 1e-9));
        const dayTxt = (n) => (lang === 'hu' ? n + ' nap' : n + (n === 1 ? ' day' : ' days'));
        const change = { en: (d > 0 ? '+' : '−') + fmt(Math.abs(d), 1) + ' ppt in total', hu: 'összesen ' + (d > 0 ? '+' : '−') + fmt(Math.abs(d), 1) + ' ppt' };
        if (d > 0) {
          const { rate } = brandRate(v);
          if (!pos(rate)) return fill();
          const total = d * v.V * rate / 35;
          const perDay = total / days;
          const brine = perDay / rate;
          let html = out({ en: days > 1 ? 'Salt per day' : 'Salt to add', hu: days > 1 ? 'Só naponta' : 'Hozzáadandó só' }, qMass(perDay / 1000),
            days > 1 ? { en: 'for ' + dayTxt(days) + ', at most 1 ppt a day', hu: dayTxt(days) + ' át, legfeljebb napi 1 ppt' } : null, 'main');
          html += out({ en: 'Salt in total', hu: 'Só összesen' }, qMass(total / 1000), change);
          html += outQ({ en: 'Dissolve each portion in at least', hu: 'Minden adagot oldj fel legalább ennyi akváriumvízben' }, qVol(brine));
          html += steps([
            { en: 'Take the water out of the tank and dissolve the salt in it completely.', hu: 'Vegyél ki akváriumvizet, és oldd fel benne teljesen a sót.' },
            { en: 'Pour it back slowly into a high-flow area (sump), over at least half an hour.', hu: 'Lassan, legalább fél óra alatt öntsd vissza erős áramlású helyre (sumpba).' },
            { en: 'Measure the next day before the next portion.', hu: 'Másnap mérj, mielőtt a következő adagot beadod.' },
          ]);
          html += note({ en: 'Never add dry salt to a tank with animals.', hu: 'Száraz sót soha ne szórj élőlényeket tartó akváriumba.' }, 'warn');
          return html;
        }
        const ratio = v.target / v.cur;
        const fracDay = 1 - Math.pow(ratio, 1 / days);
        const perDay = v.V * fracDay;
        let html = outQ({ en: days > 1 ? 'Replace per day with RO/DI' : 'Replace with RO/DI', hu: days > 1 ? 'Naponta cserélj RO/DI vízre' : 'Cserélj RO/DI vízre' },
          { v: qVol(perDay).v, alt: (days > 1 ? L({ en: 'for ', hu: '' }) + dayTxt(days) + L({ en: ' · ', hu: ' át · ' }) : '') + fmt(fracDay * 100, 1) + '%' }, 'main');
        html += out({ en: 'Swapped in total', hu: 'Összesen cserélt víz' }, qVol(perDay * days).v, change);
        html += steps([
          { en: 'Drain this much tank water.', hu: 'Engedj le ennyi akváriumvizet.' },
          { en: 'Refill with RO/DI water at the same temperature.', hu: 'Pótold azonos hőmérsékletű RO/DI vízzel.' },
          { en: 'Lower the salinity of the top-off or the next salt mix too.', hu: 'Az utántöltő vagy a következő sókeverés sótartalmát is igazítsd.' },
        ]);
        return html;
      },
      formula: {
        en: ['Raise: salt (g) = Δppt × litres × (brand dose at 35 ppt ÷ 35); about 1.08 g per litre per ppt',
          'Days = Δppt ÷ 1 ppt/day, rounded up; brine water ≥ daily salt ÷ brand dose (about double normal strength)',
          'Lower: daily replaced share = 1 − (target ÷ current)^(1 / days)'],
        hu: ['Emelés: só (g) = Δppt × liter × (gyártói adag 35 ppt-hez ÷ 35); kb. 1,08 g literenként és ppt-nként',
          'Napok = Δppt ÷ napi 1 ppt, felfelé kerekítve; oldóvíz ≥ napi só ÷ gyártói adag (kb. kétszeres töménység)',
          'Csökkentés: naponta cserélt arány = 1 − (cél ÷ jelenlegi)^(1 / napok)'],
      },
      notes: {
        en: ['Change salinity by at most 1 ppt (about 0.001 SG) a day.', 'Brine stronger than about twice seawater may not dissolve well.'],
        hu: ['A sótartalmat naponta legfeljebb 1 ppt-vel (kb. 0,001 SG) változtasd.', 'A tengervíznél kb. kétszer töményebb sóoldat már rosszul oldódhat.'],
      },
      sources: [SRC.rcDirect, SRC.rcSalt, SRC.tmSalt, SRC.afSalt, SRC.fmSalt],
    },
    {
      id: 'sand',
      name: { en: 'Sand bed', hu: 'Homokágy' },
      desc: { en: 'How much sand a bed of a given depth needs, in kilograms and bags.', hu: 'Mennyi homok kell adott vastagságú homokágyhoz, kilogrammban és zsákban.' },
      fields: [
        { id: 'L', kind: 'len', label: { en: 'Length (inside)', hu: 'Hossz (belső)' } },
        { id: 'W', kind: 'len', label: { en: 'Width (inside)', hu: 'Szélesség (belső)' } },
        { id: 'depth', kind: 'len', label: { en: 'Bed depth', hu: 'Homokágy vastagsága' } },
        { id: 'type', kind: 'sel', def: 'arag', wide: true, label: { en: 'Substrate', hu: 'Aljzat' }, opts: [
          { v: 'arag', l: { en: 'Aragonite or coral sand – about 1.36 kg/L', hu: 'Aragonit- vagy korallhomok – kb. 1,36 kg/l' } },
          { v: 'custom', l: { en: 'Other (enter density)', hu: 'Egyéb (add meg a sűrűséget)' } },
        ] },
        { id: 'dens', kind: 'dens', label: { en: 'Bulk density', hu: 'Halmazsűrűség' }, show: (v) => v.type === 'custom',
          hint: { en: 'Aragonite sands are usually 1.28–1.54 kg/L (80–96 lb/ft³).', hu: 'Az aragonithomok általában 1,28–1,54 kg/l (80–96 lb/ft³).' } },
        { id: 'bag', kind: 'mass', def: 10, label: { en: 'Bag size', hu: 'Zsák mérete' }, hint: { en: 'Common sizes: 5, 10 and 20 kg.', hu: 'Gyakori kiszerelés: 5, 10 és 20 kg.' } },
      ],
      compute(v) {
        const dens = v.type === 'custom' ? v.dens : 85 * 0.0160184634;
        if (!pos(v.L, v.W, v.depth, dens)) return fill();
        const volL = v.L * v.W * v.depth / 1000;
        const kg = volL * dens;
        let html = out({ en: 'Sand needed', hu: 'Szükséges homok' }, qMass(kg), '≈ ' + qMassAlt(kg), 'main');
        if (pos(v.bag)) {
          html += out({ en: 'Bags', hu: 'Zsák' }, Math.ceil(kg / v.bag - 1e-9) + ' ' + t('pcs'), { en: qMass(v.bag) + ' each', hu: qMass(v.bag) + '-os zsákkal' });
          html += out({ en: 'One bag adds to the depth', hu: 'Egy zsák ennyit vastagít' }, qLen(v.bag / dens * 1000 / (v.L * v.W)));
        }
        html += outQ({ en: 'Sand volume', hu: 'Homok térfogata' }, qVol(volL));
        return html;
      },
      formula: {
        en: ['volume = length × width × depth', 'mass = volume × bulk density (aragonite sand 85 lb/ft³ = 1.36 kg/L, CaribSea data)', 'bags = mass ÷ bag size, rounded up'],
        hu: ['térfogat = hossz × szélesség × vastagság', 'tömeg = térfogat × halmazsűrűség (aragonithomok 85 lb/ft³ = 1,36 kg/l, CaribSea-adat)', 'zsákok = tömeg ÷ zsákméret, felfelé kerekítve'],
      },
      notes: {
        en: ['The density is a CaribSea figure for aragonite sand; other calcium carbonate sands (for example Aqua Medic coral sand) are similar, coarse coral gravel is lighter. If the brand gives its own figure, use “Other”.',
          'Live sand is packed wet, so part of the bag weight is water: expect slightly less sand per bag.', 'Rock standing on the bottom reduces the sand needed.'],
        hu: ['A sűrűség a CaribSea aragonithomokjának adata; más kalcium-karbonát homok (pl. Aqua Medic korallhomok) hasonló, a durva korallzúzalék könnyebb. Ha a gyártó megadja a sajátját, válaszd az „Egyéb” lehetőséget.',
          'Az élő homokot vizesen csomagolják, a zsák súlyának egy része víz: zsákonként kicsit kevesebb homokkal számolj.', 'Az aljzaton álló kőzet csökkenti a szükséges homokot.'],
      },
      sources: [SRC.rcSand],
    },
    {
      id: 'gfo',
      name: { en: 'Phosphate media dose', hu: 'Foszfátmegkötő adagolása' },
      desc: { en: 'Starting dose of GFO and other phosphate removers for your water volume.', hu: 'GFO és más foszfátmegkötők kezdő adagja a víztérfogathoz.' },
      fields: [
        { id: 'V', kind: 'vol', chips: volChips, wide: true, label: { en: 'Water in the system', hu: 'Víz a rendszerben' } },
        { id: 'media', kind: 'sel', def: 'rowa', wide: true, label: { en: 'Media', hu: 'Szűrőanyag' }, opts: [
          { v: 'rowa', l: { en: 'ROWAphos (ferric hydroxide)', hu: 'ROWAphos (vas-hidroxid)' } },
          { v: 'elimiphos', l: { en: 'Tropic Marin Elimi-Phos (ferric hydroxide)', hu: 'Tropic Marin Elimi-Phos (vas-hidroxid)' } },
          { v: 'phosnet', l: { en: 'Seachem PhosNet (GFO)', hu: 'Seachem PhosNet (GFO)' } },
          { v: 'phosguard', l: { en: 'Seachem PhosGuard (aluminium oxide)', hu: 'Seachem PhosGuard (alumínium-oxid)' } },
          { v: 'custom', l: { en: 'Other (enter dose per 100 L)', hu: 'Egyéb (adag 100 l-re)' } },
        ] },
        { id: 'rate', kind: 'num', unit: { en: 'g or mL / 100 L', hu: 'g vagy ml / 100 l' }, dec: 2, label: { en: 'Dose per 100 L', hu: 'Adag 100 l-re' }, show: (v) => v.media === 'custom',
          hint: { en: 'From the product label.', hu: 'A termék címkéjéről.' } },
      ],
      compute(v) {
        if (!pos(v.V)) return fill();
        const V = v.V;
        let html = '';
        if (v.media === 'elimiphos') {
          html += out({ en: 'Dose', hu: 'Adag' }, fmt(V * 0.5, 0) + ' g',
            { en: '100 g per 200 L; heavily loaded tanks start with 100 g per 500 L (' + fmt(V * 0.2, 0) + ' g) and increase slowly',
              hu: '100 g 200 l-re; erősen terhelt akváriumban 100 g / 500 l-rel (' + fmt(V * 0.2, 0) + ' g) kezdj, és lassan emeld' }, 'main');
          html += steps([
            { en: 'Rinse it, then use it in a filter bag or reactor in good flow.', hu: 'Öblítsd ki, majd szűrőzsákban vagy reaktorban, jó áramlásban használd.' },
            { en: 'Replace it when phosphate starts to rise again.', hu: 'Cseréld, ha a foszfát újra emelkedni kezd.' },
          ]);
        } else if (v.media === 'phosnet') {
          html += out({ en: 'Dose', hu: 'Adag' }, fmt(V / L_PER_USGAL, 0) + ' g', { en: '1 g per US gallon (3.8 L) of seawater', hu: '1 g US gallononként (3,8 l) tengervízre' }, 'main');
          html += steps([
            { en: 'Test after about 4 days and replace it while the phosphate problem lasts.', hu: 'Kb. 4 nap után mérj, és cseréld, amíg a foszfátprobléma fennáll.' },
          ]);
          html += note({ en: 'Do not overdose: too fast a phosphate drop stresses sensitive invertebrates.', hu: 'Ne adagold túl: a túl gyors foszfátcsökkenés megviseli az érzékeny gerincteleneket.' }, 'warn');
        } else if (v.media === 'rowa') {
          html += out({ en: 'Dose', hu: 'Adag' }, fmt(V * 0.5, 0) + '–' + fmt(V * 1, 0) + ' g',
            { en: '100 g per 100–200 L of seawater; start with the lower amount', hu: '100 g 100–200 l tengervízre; az alsó értékkel kezdj' }, 'main');
          html += steps([
            { en: 'Rinse before use; best in a reactor or a filter bag in good flow.', hu: 'Használat előtt öblítsd; legjobb reaktorban vagy erős áramlásban lévő szűrőzsákban.' },
            { en: 'Test phosphate regularly; ROWAphos suggests keeping it no higher than 0.1–0.3 mg/L.', hu: 'Rendszeresen mérd a foszfátot; a ROWAphos szerint ne legyen 0,1–0,3 mg/l felett.' },
          ]);
        } else if (v.media === 'phosguard') {
          html += out({ en: 'Dose', hu: 'Adag' }, fmt(V * 85 / 200, 0) + ' ml', { en: '85 mL (1/3 cup) per 200 L of seawater', hu: '85 ml (1/3 bögre) 200 l tengervízre' }, 'main');
          html += steps([
            { en: 'Pre-wet it in double its volume of freshwater; never add it dry to saltwater.', hu: 'Előtte nedvesítsd be kétszeres mennyiségű édesvízben; szárazon ne tedd tengervízbe.' },
            { en: 'Test after about 4 days and replace it while the problem lasts.', hu: 'Kb. 4 nap után mérj, és cseréld, amíg a probléma fennáll.' },
          ]);
          html += note({ en: 'Do not overdose: too fast a phosphate drop stresses sensitive invertebrates.', hu: 'Ne adagold túl: a túl gyors foszfátcsökkenés megviseli az érzékeny gerincteleneket.' }, 'warn');
        } else {
          if (!pos(v.rate)) return fill();
          html += out({ en: 'Dose', hu: 'Adag' }, fmt(V * v.rate / 100, 1), { en: 'g or mL, same unit as on the label', hu: 'g vagy ml, ugyanabban az egységben, mint a címkén' }, 'main');
        }
        html += outQ({ en: 'For water volume', hu: 'Ehhez a víztérfogathoz' }, qVol(V));
        return html;
      },
      formula: {
        en: ['ROWAphos: 100 g per 100–200 L of seawater = 0.5–1 g/L', 'Tropic Marin Elimi-Phos: 100 g per 200 L = 0.5 g/L (heavy load: 100 g per 500 L = 0.2 g/L to start)',
          'Seachem PhosNet: 1 g per US gallon ≈ 0.26 g/L', 'Seachem PhosGuard: 85 mL per 200 L of seawater ≈ 0.43 mL/L'],
        hu: ['ROWAphos: 100 g 100–200 l tengervízre = 0,5–1 g/l', 'Tropic Marin Elimi-Phos: 100 g 200 l-re = 0,5 g/l (erős terhelésnél kezdésnek 100 g 500 l-re = 0,2 g/l)',
          'Seachem PhosNet: 1 g US gallononként ≈ 0,26 g/l', 'Seachem PhosGuard: 85 ml 200 l tengervízre ≈ 0,43 ml/l'],
      },
      notes: {
        en: ['Doses are the manufacturers’ starting recommendations. Follow your own measurements; with high phosphate start lower and test often.',
          'For other media sold here (for example Triton AL99, DSR PhosRem, Aquavitro Phosfiltrum, JBL PhosEx Ultra), choose “Other” and enter the dose from the label.'],
        hu: ['Az adagok a gyártók kezdő ajánlásai. A saját méréseid alapján igazíts; magas foszfátnál kisebb adaggal kezdj, és mérj gyakran.',
          'Más itthon kapható szűrőanyagnál (pl. Triton AL99, DSR PhosRem, Aquavitro Phosfiltrum, JBL PhosEx Ultra) válaszd az „Egyéb” lehetőséget, és add meg a címkén szereplő adagot.'],
      },
      sources: [SRC.rowa, SRC.elimiphos, SRC.phosnet, SRC.seachem],
    },
    {
      id: 'convert',
      name: { en: 'Unit converters', hu: 'Átváltók' },
      desc: {
        en: 'Salinity (ppt, SG, conductivity), hydrometer temperature correction, temperature, volume, alkalinity, phosphate, nitrate, nitrite, ammonia.',
        hu: 'Sótartalom (ppt, SG, vezetőképesség), hidrométer hőmérséklet-korrekciója, hőmérséklet, térfogat, KH, foszfát, nitrát, nitrit, ammónia.',
      },
      custom: true,
      formula: {
        en: ['Salinity ↔ SG and density: UNESCO EOS-80 equation of state (1 atm); SG = density of the sample ÷ density of pure water, both at the reference temperature',
          'Conductivity ↔ salinity: Practical Salinity Scale PSS-78 at 25 °C (35 ppt ≈ 53.0 mS/cm)',
          'Hydrometer: reading = density of the sample at its temperature ÷ density of pure water at the calibration temperature; solved for salinity (glass expansion ignored)',
          'Alkalinity: 1 meq/L = 2.804 dKH = 50.04 ppm CaCO₃',
          'Molar mass ratios: PO₄/P = 3.066, NO₃/N = 4.427, NO₂/N = 3.284, NH₃/N = 1.216, NH₄/N = 1.288'],
        hu: ['Sótartalom ↔ SG és sűrűség: UNESCO EOS-80 állapotegyenlet (1 atm); SG = minta sűrűsége ÷ tiszta víz sűrűsége, mindkettő a referenciahőmérsékleten',
          'Vezetőképesség ↔ sótartalom: PSS-78 gyakorlati sótartalom-skála 25 °C-on (35 ppt ≈ 53,0 mS/cm)',
          'Hidrométer: leolvasott érték = a minta sűrűsége a saját hőmérsékletén ÷ tiszta víz sűrűsége a kalibrálási hőmérsékleten; ebből számolja a sótartalmat (az üveg hőtágulását elhanyagolja)',
          'KH: 1 meq/l = 2,804 dKH = 50,04 ppm CaCO₃',
          'Moláris tömegarányok: PO₄/P = 3,066, NO₃/N = 4,427, NO₂/N = 3,284, NH₃/N = 1,216, NH₄/N = 1,288'],
      },
      notes: {
        en: ['Refractometers with ATC and digital meters correct the temperature themselves: do not apply the hydrometer correction to these.',
          'Many refractometers are calibrated so that they read SG at 25 °C; older glass hydrometers often use 60 °F (15.6 °C).'],
        hu: ['Az ATC-s refraktométer és a digitális mérő maga korrigálja a hőmérsékletet: ezekre ne alkalmazd a hidrométer-korrekciót.',
          'A legtöbb refraktométer 25 °C-ra vonatkoztatott SG-t mutat; a régi üveg hidrométerek gyakran 60 °F-ra (15,6 °C) kalibráltak.'],
      },
      sources: [SRC.unesco, SRC.rcSal],
    },
    {
      id: 'waterchange',
      name: { en: 'Water change', hu: 'Vízcsere' },
      desc: {
        en: 'Predicted parameters after one or more water changes, and how much to change to reach a target nitrate.',
        hu: 'Várható paraméterek egy vagy több vízcsere után, és mennyit kell cserélni egy cél nitrátértékhez.',
      },
      fields: [
        { id: 'V', kind: 'vol', chips: volChips, label: { en: 'Water in the system', hu: 'Víz a rendszerben' } },
        { id: 'C', kind: 'vol', label: { en: 'Water changed', hu: 'Cserélt víz' } },
        { id: 'n', kind: 'int', def: 1, dec: 0, label: { en: 'Number of changes', hu: 'Cserék száma' }, hint: { en: 'Same size, one after another.', hu: 'Azonos méretű, egymás utáni cserék.' } },
        { id: 'tno3', kind: 'num', unit: 'ppm', dec: 1, label: { en: 'Target nitrate (optional)', hu: 'Cél nitrát (nem kötelező)' } },
        { kind: 'title', label: { en: 'Parameters (leave empty to skip)', hu: 'Paraméterek (az üreseket kihagyja)' } },
        { id: 'sal', kind: 'pair', sub: 'sal', label: { en: 'Salinity', hu: 'Sótartalom' } },
        { id: 'alk', kind: 'pair', sub: 'num', unit: 'dKH', dec: 2, label: 'KH' },
        { id: 'ca', kind: 'pair', sub: 'num', unit: 'ppm', dec: 0, label: { en: 'Calcium', hu: 'Kalcium' } },
        { id: 'mg', kind: 'pair', sub: 'num', unit: 'ppm', dec: 0, label: { en: 'Magnesium', hu: 'Magnézium' } },
        { id: 'no3', kind: 'pair', sub: 'num', unit: 'ppm', dec: 1, label: { en: 'Nitrate', hu: 'Nitrát' } },
        { id: 'po4', kind: 'pair', sub: 'num', unit: 'ppm', dec: 3, label: { en: 'Phosphate', hu: 'Foszfát' } },
      ],
      compute(v, fields) {
        if (!pos(v.V, v.C)) return fill();
        if (v.C > v.V) return note({ en: 'The change cannot be larger than the water volume.', hu: 'A cserélt víz nem lehet több a teljes víztérfogatnál.' }, 'warn');
        const x = v.C / v.V;
        const n = Math.max(1, Math.round(v.n || 1));
        const rest = Math.pow(1 - x, n);
        let html = out({ en: 'Change per occasion', hu: 'Egy csere aránya' }, fmt(x * 100, 1) + '%',
          n > 1 ? { en: 'after ' + n + ' changes ' + fmt(rest * 100, 1) + '% of the original water remains', hu: n + ' csere után az eredeti víz ' + fmt(rest * 100, 1) + '%-a marad' } : null, 'main');
        const rows = []; const warns = [];
        fields.filter((f) => f.kind === 'pair').forEach((f) => {
          const c = v['cur_' + f.id]; const w = v['new_' + f.id];
          if (!num(c) || !num(w)) return;
          const a1 = c * (1 - x) + w * x;
          const an = w + (c - w) * rest;
          const show = (val) => (f.sub === 'sal' ? salShort(val) : fmt(val, f.dec));
          const unit = f.sub === 'sal' ? (S.sal === 'sg' ? 'SG' : 'ppt') : f.unit;
          rows.push('<tr><td>' + esc(L(f.label)) + ' <span class="unit">' + esc(unit) + '</span></td><td>' + show(c) + '</td><td>' + show(w) + '</td><td class="hl">' + show(a1) + '</td>' +
            (n > 1 ? '<td class="hl">' + show(an) + '</td>' : '') + '</tr>');
          if (f.id === 'sal' && Math.abs(a1 - c) > 1) warns.push({ en: 'Salinity moves more than 1 ppt in one change. Match the new water to the tank.', hu: 'A sótartalom egy cserével több mint 1 ppt-t változik. Igazítsd az új vizet az akváriumhoz.' });
          if (f.id === 'alk' && Math.abs(a1 - c) > 1) warns.push({ en: 'KH moves more than 1 dKH in one change. Corals may react; match the new water.', hu: 'A KH egy cserével több mint 1 dKH-t változik. A korallok megérezhetik; igazítsd az új vizet.' });
        });
        if (rows.length) {
          html += '<div class="tscroll"><table class="rtable"><thead><tr><th></th><th>' + esc(L({ en: 'Now', hu: 'Most' })) + '</th><th>' + esc(L({ en: 'New water', hu: 'Új víz' })) +
            '</th><th>' + esc(L({ en: 'After 1', hu: '1 után' })) + '</th>' + (n > 1 ? '<th>' + esc(L({ en: 'After ' + n, hu: n + ' után' })) + '</th>' : '') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
        }
        warns.forEach((w) => { html += note(w, 'warn'); });
        if (pos(v.tno3) && num(v.cur_no3)) {
          const c = v.cur_no3; const w = num(v.new_no3) ? v.new_no3 : 0; const tg = v.tno3;
          if (tg >= c) html += note({ en: 'Nitrate is already at or below the target.', hu: 'A nitrát már a cél alatt vagy azon van.' }, 'ok');
          else if (tg <= w) html += note({ en: 'The new water has at least as much nitrate as the target, so changes cannot reach it.', hu: 'Az új víz nitrátja nem kisebb a célnál, így vízcserével nem érhető el.' }, 'warn');
          else {
            const need = (c - tg) / (c - w);
            const k = Math.ceil(Math.log((tg - w) / (c - w)) / Math.log(1 - x) - 1e-9);
            html += outQ({ en: 'To reach ' + fmt(tg, 1) + ' ppm nitrate in one change', hu: fmt(tg, 1) + ' ppm nitráthoz egy cserével' },
              { v: qVol(v.V * need).v, alt: fmt(need * 100, 1) + '% · ' + L({ en: 'or ' + k + ' changes of the size above', hu: 'vagy ' + k + ' csere a fenti mérettel' }) });
          }
        }
        if (rows.length) html += note({ en: 'Real nitrate and phosphate end up a bit higher: the tank keeps producing them.', hu: 'A valódi nitrát és foszfát kicsit magasabb lesz: az akvárium közben is termeli őket.' });
        return html;
      },
      formula: {
        en: ['share x = changed water ÷ system water', 'after one change = now × (1 − x) + new water × x',
          'after n changes = new water + (now − new water) × (1 − x)ⁿ', 'one change for a target nitrate: x = (now − target) ÷ (now − new water)'],
        hu: ['arány x = cserélt víz ÷ teljes víz', 'egy csere után = most × (1 − x) + új víz × x',
          'n csere után = új víz + (most − új víz) × (1 − x)ⁿ', 'egy csere a cél nitráthoz: x = (most − cél) ÷ (most − új víz)'],
      },
      notes: {
        en: ['The model assumes complete mixing and no uptake or production in between.'],
        hu: ['A számítás teljes elkeveredést feltételez, közben sem fogyasztást, sem termelést nem számol.'],
      },
      sources: [],
    },
  ];

  // Hidden form used inside the converter page.
  const HYDRO = {
    id: 'hydro',
    fields: [
      { id: 'read', kind: 'num', unit: 'SG', dec: 4, label: { en: 'Hydrometer reading', hu: 'Hidrométer leolvasott értéke' } },
      { id: 'ts', kind: 'temp', def: 25, label: { en: 'Water temperature', hu: 'Víz hőmérséklete' } },
      { id: 'tcal', kind: 'sel', def: '15.5556', wide: true, label: { en: 'Calibrated at', hu: 'Kalibrálási hőmérséklet' }, opts: [
        { v: '15.5556', l: '60 °F / 15,6 °C' }, { v: '20', l: '20 °C / 68 °F' }, { v: '25', l: '25 °C / 77 °F' },
      ] },
    ],
    compute(v) {
      if (!pos(v.read) || !num(v.ts)) return fill();
      const tcal = parseFloat(v.tcal);
      const s = solveInc((x) => SW.rho(x, v.ts) / SW.rhow(tcal), v.read, 0, 70);
      if (!num(s)) return note({ en: 'Out of range.', hu: 'Tartományon kívül.' }, 'warn');
      return out({ en: 'Salinity', hu: 'Sótartalom' }, fmt(s, 1) + ' ppt', null, 'main') +
        out({ en: 'Corrected SG at 25 °C', hu: 'Korrigált SG 25 °C-on' }, fmt(SW.sg(s, 25), 4, 4)) +
        out({ en: 'Corrected SG at the calibration temperature', hu: 'Korrigált SG a kalibrálási hőmérsékleten' }, fmt(SW.sg(s, tcal), 4, 4));
    },
  };
  const FORMS = {};
  CALCS.forEach((c) => { if (c.fields) FORMS[c.id] = c; });
  FORMS.hydro = HYDRO;

  const CONV = [
    { id: 'sal', def: 35, name: { en: 'Salinity', hu: 'Sótartalom' }, wide: true,
      hint: { en: 'Type into any field; the rest follow.', hu: 'Bármelyik mezőbe írhatsz, a többi követi.' },
      f: [
        { id: 'ppt', l: { en: 'Salinity (ppt, ‰)', hu: 'Sótartalom (ppt, ‰)' }, to: (x) => x, from: (s) => s, dec: 2 },
        { id: 'sg25', l: { en: 'SG 25/25 °C (refractometer)', hu: 'SG 25/25 °C (refraktométer)' }, to: (x) => SW.pptFromSg(x, 25), from: (s) => SW.sg(s, 25), dec: 4, min: 4 },
        { id: 'sg20', l: 'SG 20/20 °C', to: (x) => SW.pptFromSg(x, 20), from: (s) => SW.sg(s, 20), dec: 4, min: 4 },
        { id: 'sg15', l: { en: 'SG 60/60 °F (old hydrometers)', hu: 'SG 60/60 °F (régi hidrométer)' }, to: (x) => SW.pptFromSg(x, 15.5556), from: (s) => SW.sg(s, 15.5556), dec: 4, min: 4 },
        { id: 'cond', l: { en: 'Conductivity (mS/cm, 25 °C)', hu: 'Vezetőképesség (mS/cm, 25 °C)' }, to: SW.pptFromCond, from: SW.condFromPpt, dec: 2 },
        { id: 'dens', l: { en: 'Density (g/cm³, 25 °C)', hu: 'Sűrűség (g/cm³, 25 °C)' }, to: (x) => solveInc((s) => SW.rho(s, 25) / 1000, x, 0, 70), from: (s) => SW.rho(s, 25) / 1000, dec: 4, min: 4 },
      ] },
    { id: 'temp', def: 25, name: { en: 'Temperature', hu: 'Hőmérséklet' }, f: [
      { id: 'c', l: '°C', to: (x) => x, from: (c) => c, dec: 2, neg: true },
      { id: 'f', l: '°F', to: (x) => (x - 32) * 5 / 9, from: (c) => c * 9 / 5 + 32, dec: 2, neg: true },
    ] },
    { id: 'vol', def: 100, name: { en: 'Volume', hu: 'Térfogat' }, f: [
      { id: 'l', l: { en: 'litres', hu: 'liter' }, to: (x) => x, from: (l) => l, dec: 2 },
      { id: 'usg', l: 'US gallon', to: (x) => x * L_PER_USGAL, from: (l) => l / L_PER_USGAL, dec: 3 },
      { id: 'ukg', l: 'UK gallon', to: (x) => x * L_PER_UKGAL, from: (l) => l / L_PER_UKGAL, dec: 3 },
    ] },
    { id: 'alk', def: 8 / 2.804, name: { en: 'Alkalinity (KH)', hu: 'Lúgosság (KH)' }, f: [
      { id: 'dkh', l: 'dKH', to: (x) => x / 2.804, from: (m) => m * 2.804, dec: 2 },
      { id: 'meq', l: { en: 'meq/L', hu: 'meq/l' }, to: (x) => x, from: (m) => m, dec: 3 },
      { id: 'ppm', l: 'ppm CaCO₃', to: (x) => x / 50.04, from: (m) => m * 50.04, dec: 1 },
    ] },
    { id: 'po4', def: null, name: { en: 'Phosphate', hu: 'Foszfát' },
      hint: { en: 'Hanna ULR phosphorus checker (HI736) reads ppb P.', hu: 'A Hanna ULR foszfor mérő (HI736) ppb P-t mutat.' }, f: [
        { id: 'ppm', l: 'ppm PO₄', to: (x) => x, from: (p) => p, dec: 4 },
        { id: 'ppb', l: 'ppb PO₄', to: (x) => x / 1000, from: (p) => p * 1000, dec: 1 },
        { id: 'ppmP', l: 'ppm P', to: (x) => x * 3.0662, from: (p) => p / 3.0662, dec: 4 },
        { id: 'ppbP', l: 'ppb P', to: (x) => x * 3.0662 / 1000, from: (p) => p / 3.0662 * 1000, dec: 1 },
      ] },
    { id: 'no3', def: null, name: { en: 'Nitrate', hu: 'Nitrát' }, f: [
      { id: 'no3', l: 'ppm NO₃', to: (x) => x, from: (p) => p, dec: 2 },
      { id: 'n', l: 'ppm NO₃-N', to: (x) => x * 4.4266, from: (p) => p / 4.4266, dec: 3 },
    ] },
    { id: 'no2', def: null, name: { en: 'Nitrite', hu: 'Nitrit' }, f: [
      { id: 'no2', l: 'ppm NO₂', to: (x) => x, from: (p) => p, dec: 3 },
      { id: 'n', l: 'ppm NO₂-N', to: (x) => x * 3.2845, from: (p) => p / 3.2845, dec: 3 },
    ] },
    { id: 'nh3', def: null, name: { en: 'Ammonia', hu: 'Ammónia' },
      note: {
        en: ['NH₃ – free ammonia: the toxic form. Its share of the total depends on pH and temperature; in seawater (pH 8.2, 25 °C) it is about 5–8%.',
          'NH₄⁺ – ammonium: much less toxic. Most hobby test kits measure the two together (total ammonia) and give the result as NH₃ or NH₄⁺.',
          'NH₃-N – only the mass of the nitrogen in it. Labs and some test kits use it, so the same water gives a different number.'],
        hu: ['NH₃ – szabad ammónia: ez a mérgező forma. Az összes ammóniából való aránya a pH-tól és a hőmérséklettől függ; tengervízben (pH 8,2, 25 °C) kb. 5–8%.',
          'NH₄⁺ – ammónium: sokkal kevésbé mérgező. A legtöbb hobbiteszt a kettőt együtt (összes ammónia) méri, és NH₃-ként vagy NH₄⁺-ként adja meg.',
          'NH₃-N – csak a benne lévő nitrogén tömege. Laborok és egyes tesztek használják, ezért ugyanaz a víz más számot mutat.'],
      },
      f: [
      { id: 'nh3', l: 'ppm NH₃', to: (x) => x, from: (p) => p, dec: 3 },
      { id: 'nh4', l: 'ppm NH₄⁺', to: (x) => x * 17.031 / 18.039, from: (p) => p * 18.039 / 17.031, dec: 3 },
      { id: 'n', l: 'ppm NH₃-N', to: (x) => x * 17.031 / 14.007, from: (p) => p * 14.007 / 17.031, dec: 3 },
    ] },
  ];

  /* ---------- Values ---------- */

  function allFields(form) {
    const list = [];
    form.fields.forEach((f) => {
      if (f.kind === 'pair') {
        list.push({ id: 'cur_' + f.id, kind: f.sub, unit: f.unit, dec: f.dec });
        list.push({ id: 'new_' + f.id, kind: f.sub, unit: f.unit, dec: f.dec });
      } else if (f.id) list.push(f);
    });
    return list;
  }
  function values(form) {
    const st = S.inputs[form.id] || {};
    const v = {};
    allFields(form).forEach((f) => {
      let raw = st[f.id];
      if (f.kind === 'sel' && raw !== undefined && !f.opts.some((o) => o.v === raw)) raw = undefined; // option was removed
      v[f.id] = raw !== undefined ? raw : f.def !== undefined ? f.def : null;
    });
    return v;
  }
  function setValue(fid, key, val) {
    if (!S.inputs[fid]) S.inputs[fid] = {};
    S.inputs[fid][key] = val;
    save();
  }

  /* ---------- Rendering ---------- */

  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');

  function tankVolumes() {
    try {
      const o = JSON.parse(lsGet(TANKLOG));
      return (o && Array.isArray(o.tanks) ? o.tanks : []).filter((tk) => Number(tk.volume) > 0)
        .map((tk) => ({ name: String(tk.name || 'Tank'), vol: Number(tk.volume) }));
    } catch (e) { return []; }
  }

  function chipsHtml(formId, f) {
    const list = tankVolumes().map((tk) => ({ label: tk.name + ': ' + qVol(tk.vol).v, vol: tk.vol, title: t('fromTank') }));
    if (S.lastVolume && formId !== 'volume') list.push({ label: t('fromCalc') + ': ' + qVol(S.lastVolume).v, vol: S.lastVolume, title: t('fromCalc') });
    if (!list.length) return '';
    return '<div class="chips">' + list.map((c) => '<button type="button" class="chip" data-act="setvol" data-form="' + formId + '" data-key="' + f.id +
      '" data-vol="' + c.vol + '" title="' + esc(c.title) + '">' + esc(c.label) + '</button>').join('') + '</div>';
  }

  function inputHtml(formId, f, val, labelId) {
    const c = conv(f);
    const disp = val == null || !num(val) ? '' : fmtIn(c.to(val), c.dec, c.min);
    return '<input id="' + labelId + '" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-form="' + formId +
      '" data-key="' + f.id + '" value="' + esc(disp) + '">';
  }

  function fieldHtml(formId, f, v) {
    if (f.show && !f.show(v)) return '';
    if (f.kind === 'title') return '<h3 class="gtitle">' + esc(L(f.label)) + '</h3>';
    const id = 'f-' + formId + '-' + f.id;
    let input;
    let unit = '';
    if (f.kind === 'sel') {
      input = '<select id="' + id + '" data-form="' + formId + '" data-key="' + f.id + '">' +
        f.opts.map((o) => '<option value="' + esc(o.v) + '"' + (String(v[f.id]) === o.v ? ' selected' : '') + '>' + esc(L(o.l)) + '</option>').join('') + '</select>';
    } else {
      input = inputHtml(formId, f, v[f.id], id);
      unit = conv(f).unit;
    }
    const hint = f.hint === 'salHint' ? t('salHint') : L(f.hint);
    return '<div class="field' + (f.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(L(f.label)) + (unit ? ' <em class="unit">' + esc(unit) + '</em>' : '') + '</label>' +
      input + (hint ? '<small class="hint">' + esc(hint) + '</small>' : '') + (f.chips ? chipsHtml(formId, f) : '') + '</div>';
  }

  function pairTable(formId, pairs, v) {
    return '<div class="wide tscroll" style="grid-column:1/-1"><table class="wct"><thead><tr><th></th><th>' + esc(L({ en: 'Tank now', hu: 'Akvárium most' })) + '</th><th>' +
      esc(L({ en: 'New water', hu: 'Új víz' })) + '</th></tr></thead><tbody>' + pairs.map((f) => {
      const unit = f.sub === 'sal' ? conv({ kind: 'sal' }).unit : L(f.unit);
      const sub = { kind: f.sub, unit: f.unit, dec: f.dec };
      return '<tr><td><label for="f-' + formId + '-cur_' + f.id + '">' + esc(L(f.label)) + '</label> <span class="unit">' + esc(unit) + '</span></td><td>' +
        inputHtml(formId, Object.assign({ id: 'cur_' + f.id }, sub), v['cur_' + f.id], 'f-' + formId + '-cur_' + f.id) + '</td><td>' +
        inputHtml(formId, Object.assign({ id: 'new_' + f.id }, sub), v['new_' + f.id], 'f-' + formId + '-new_' + f.id) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function formHtml(form) {
    const v = values(form);
    let html = '<div class="fgrid">';
    const pairs = form.fields.filter((f) => f.kind === 'pair');
    form.fields.forEach((f) => {
      if (f.kind === 'pair') return;
      html += fieldHtml(form.id, f, v);
    });
    if (pairs.length) html += pairTable(form.id, pairs, v);
    return html + '</div>';
  }

  function resultHtml(form) {
    try { return form.compute(values(form), form.fields); } catch (e) { return note('Error: ' + e.message, 'warn'); }
  }
  function updateResult(formId) {
    const el = document.getElementById('res-' + formId);
    if (el) el.innerHTML = resultHtml(FORMS[formId]);
  }

  function howHtml(c) {
    const f = L(c.formula) || [];
    const n = L(c.notes) || [];
    let html = '<details class="card how"' + (c.custom ? ' open' : '') + '><summary>' + esc(t('how')) + '</summary>';
    if (f.length) html += '<h3>' + esc(t('formula')) + '</h3><ul>' + f.map((x) => '<li><code>' + esc(x) + '</code></li>').join('') + '</ul>';
    if (n.length) html += '<h3>' + esc(t('notes')) + '</h3><ul>' + n.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    if (c.sources && c.sources.length) {
      html += '<h3>' + esc(t('sources')) + '</h3><ul>' + c.sources.map((s) => '<li><a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a></li>').join('') + '</ul>';
    }
    return html + '</details>';
  }

  function hasKind(c, kind) { return (c.fields || []).some((f) => f.kind === kind || f.sub === kind); }

  function setRowHtml(c) {
    const showUnits = c.custom ? true : hasKind(c, 'len') || hasKind(c, 'vol') || hasKind(c, 'mass') || hasKind(c, 'dens') || hasKind(c, 'temp');
    const showSal = !c.custom && hasKind(c, 'sal');
    let html = '<div class="setrow">';
    if (showUnits) {
      html += '<label>' + esc(t('units')) + ' <select id="setUnits">' + ['metric', 'us', 'uk'].map((u) => '<option value="' + u + '"' + (S.units === u ? ' selected' : '') + '>' + esc(t(u)) + '</option>').join('') + '</select></label>';
    }
    if (showSal) {
      html += '<label>' + esc(t('salScale')) + ' <select id="setSal">' + ['ppt', 'sg'].map((u) => '<option value="' + u + '"' + (S.sal === u ? ' selected' : '') + '>' + (u === 'sg' ? 'SG' : 'ppt') + '</option>').join('') + '</select></label>';
    }
    return html + '</div>';
  }

  function renderIndex() {
    document.title = t('title');
    app.innerHTML = '<div class="vhead"><h1>' + esc(t('brand')) + '</h1></div><p class="lead">' + esc(t('intro')) + '</p><ul class="cgrid">' +
      CALCS.map((c) => '<li><a class="ccard" href="#/' + c.id + '"><h2>' + esc(L(c.name)) + '</h2><p>' + esc(L(c.desc)) + '</p><span class="go">' + esc(t('open')) + '</span></a></li>').join('') + '</ul>';
  }

  function renderCalc(c) {
    document.title = L(c.name) + ' – ' + t('brand');
    let html = '<div class="vhead"><h1>' + esc(L(c.name)) + '</h1>' + setRowHtml(c) + '</div><p class="lead">' + esc(L(c.desc)) + '</p>';
    if (c.custom) html += convHtml();
    else {
      html += '<div class="calc"><section class="card">' + formHtml(c) + '<div class="formfoot"><button type="button" class="btn small" data-act="clear" data-form="' + c.id + '">' +
        esc(t('clear')) + '</button></div></section><section class="card result" aria-live="polite"><h2>' + esc(t('result')) + '</h2><div class="res" id="res-' + c.id + '">' + resultHtml(c) + '</div></section></div>';
    }
    html += howHtml(c);
    app.innerHTML = html;
  }

  function convState(gid) {
    const st = S.inputs.convert || {};
    if (st[gid] !== undefined) return st[gid];
    const g = CONV.find((x) => x.id === gid);
    return g ? g.def : null;
  }
  function convHtml() {
    let html = '<div class="cvgrid">';
    CONV.forEach((g, i) => {
      const base = convState(g.id);
      html += '<section class="card' + (g.wide ? ' cvwide' : '') + '"><h2>' + esc(L(g.name)) + '</h2>' + (g.hint ? '<p class="hint">' + esc(L(g.hint)) + '</p>' : '') + '<div class="fgrid">' +
        g.f.map((f) => {
          const id = 'cv-' + g.id + '-' + f.id;
          const val = num(base) ? f.from(base) : null;
          return '<div class="field"><label for="' + id + '">' + esc(L(f.l)) + '</label><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" data-cg="' + g.id +
            '" data-cf="' + f.id + '" value="' + esc(num(val) ? fmtIn(val, f.dec, f.min || 0) : '') + '"></div>';
        }).join('') + '</div>' + (g.note ? '<ul class="hint cvnote">' + L(g.note).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '</section>';
      if (i === 0) {
        html += '<section class="card cvwide"><h2>' + esc(L({ en: 'Hydrometer temperature correction', hu: 'Hidrométer hőmérséklet-korrekciója' })) + '</h2><p class="hint">' +
          esc(L({ en: 'For floating or swing-arm glass hydrometers only. Refractometers with ATC and digital meters correct the temperature themselves: do not use it for these.', hu: 'Csak úszó vagy billenőkaros hidrométerhez. Az ATC-s refraktométer és a digitális mérő maga korrigálja a hőmérsékletet: ezekre ne alkalmazd.' })) + '</p><div class="calc" style="margin-top:0"><div>' + formHtml(HYDRO) +
          '</div><div class="res" id="res-hydro" aria-live="polite">' + resultHtml(HYDRO) + '</div></div></section>';
      }
    });
    return html + '</div>';
  }

  function renderTabs(cur) {
    tabs.innerHTML = '<a href="#/"' + (!cur ? ' aria-current="page"' : '') + '>' + esc(t('all')) + '</a>' +
      CALCS.map((c) => '<a href="#/' + c.id + '"' + (cur === c.id ? ' aria-current="page"' : '') + '>' + esc(L(c.name)) + '</a>').join('');
    const a = tabs.querySelector('[aria-current]');
    if (a && a.scrollIntoView && cur) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  let langPicker = null;
  function renderChrome() {
    document.documentElement.lang = lang;
    document.getElementById('brandText').textContent = t('brand');
    if (langPicker) langPicker.update();
    document.getElementById('footer').innerHTML = '<div class="inner"><span>' + esc(t('storage')) + '</span><span>' + esc(t('feedback')) +
      ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
  }

  function currentId() { return (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || ''); }

  function render() {
    const id = currentId();
    const c = CALCS.find((x) => x.id === id);
    renderChrome();
    renderTabs(c ? c.id : '');
    if (!id) renderIndex();
    else if (!c) app.innerHTML = '<p class="empty">' + esc(t('notFound')) + ' <a href="#/">' + esc(t('all')) + '</a></p>';
    else renderCalc(c);
  }

  function rerenderKeepFocus() {
    const active = document.activeElement && document.activeElement.id;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    if (active) { const el = document.getElementById(active); if (el) el.focus(); }
  }

  /* ---------- Events ---------- */

  function fieldDef(formId, key) {
    const form = FORMS[formId];
    return form ? allFields(form).find((f) => f.id === key) : null;
  }

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('input[data-form]')) {
      const f = fieldDef(el.dataset.form, el.dataset.key);
      if (!f) return;
      const n = parseNum(el.value);
      if (n === null) { setValue(el.dataset.form, f.id, null); el.removeAttribute('aria-invalid'); }
      else if (Number.isNaN(n) || (n < 0 && f.kind !== 'temp')) { el.setAttribute('aria-invalid', 'true'); return; }
      else {
        const si = conv(f).from(n);
        if (!num(si)) { el.setAttribute('aria-invalid', 'true'); return; }
        el.removeAttribute('aria-invalid');
        setValue(el.dataset.form, f.id, si);
      }
      updateResult(el.dataset.form);
      return;
    }
    if (el.matches('input[data-cg]')) {
      const g = CONV.find((x) => x.id === el.dataset.cg);
      const f = g && g.f.find((x) => x.id === el.dataset.cf);
      if (!f) return;
      const n = parseNum(el.value);
      if (!S.inputs.convert) S.inputs.convert = {};
      let base = null;
      if (n !== null) {
        base = Number.isNaN(n) || (n < 0 && !f.neg) ? NaN : f.to(n);
        if (!num(base)) { el.setAttribute('aria-invalid', 'true'); return; }
      }
      el.removeAttribute('aria-invalid');
      S.inputs.convert[g.id] = base;
      save();
      g.f.forEach((o) => {
        if (o === f) return;
        const inp = document.getElementById('cv-' + g.id + '-' + o.id);
        if (!inp) return;
        const val = base == null ? null : o.from(base);
        inp.value = num(val) ? fmtIn(val, o.dec, o.min || 0) : '';
        inp.removeAttribute('aria-invalid');
      });
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.matches('select[data-form]')) {
      setValue(el.dataset.form, el.dataset.key, el.value);
      rerenderKeepFocus();
    } else if (el.id === 'setUnits') {
      S.units = el.value; save(); rerenderKeepFocus();
    } else if (el.id === 'setSal') {
      S.sal = el.value; save(); rerenderKeepFocus();
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    if (btn.dataset.act === 'setvol') {
      setValue(btn.dataset.form, btn.dataset.key, Number(btn.dataset.vol));
      rerenderKeepFocus();
    } else if (btn.dataset.act === 'clear') {
      delete S.inputs[btn.dataset.form];
      save();
      rerenderKeepFocus();
    }
  });

  langPicker = reef42Lang.mount(document.getElementById('langToggle'), {
    get: () => lang,
    set: (code) => {
      lang = code;
      lsSet(LANGKEY, lang);
      rerenderKeepFocus();
    }
  });

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); app.focus({ preventScroll: true }); });
  window.addEventListener('storage', (e) => { if (e.key === TANKLOG || e.key === LANGKEY) { if (e.key === LANGKEY && e.newValue) lang = e.newValue === 'hu' ? 'hu' : 'en'; rerenderKeepFocus(); } });

  // Exposed for tests.
  window.__calc = { SW };

  render();
})();
