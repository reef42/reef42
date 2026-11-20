// reef42 fit estimate – "is this species right for your tank?" – shared by Tank Log and the species pages.
// Works from the species data (tank size, reef safety, difficulty, Reef42 verdict and the compat field, see
// databases/data/SCHEMA.md) and a tank: { type, volume, start: 'YYYY-MM-DD' | null, planned, livestock: [{ id, sp, n }] }.
// Rules of thumb only; every reason is listed so the user can judge.
(function () {
  var TYPES = [
    { id: 'reef-mixed', tpl: 'b-mixed', reef: true, en: 'Mixed reef', hu: 'Vegyes korallos', den: 'Fish, soft corals, LPS and some SPS together.', dhu: 'Halak, lágykorallok, LPS és némi SPS együtt.' },
    { id: 'reef-sps', tpl: 'b-sps', reef: true, en: 'SPS dominant reef', hu: 'SPS-domináns', den: 'Mostly small polyp stony corals: strong light and flow, very stable water.', dhu: 'Főleg kis polipú kemény korallok: erős fény és áramlás, nagyon stabil víz.' },
    { id: 'reef-lps', tpl: 'b-lps', reef: true, en: 'LPS / soft coral reef', hu: 'LPS / lágykorallos', den: 'Large polyp stony and soft corals with fish.', dhu: 'Nagy polipú kemény és lágykorallok halakkal.' },
    { id: 'fowlr', tpl: 'b-fowlr', reef: false, en: 'Fish only (FOWLR)', hu: 'Csak halas (FOWLR)', den: 'Fish and live rock, no corals.', dhu: 'Halak és élő kő, korallok nélkül.' },
    { id: 'quarantine', tpl: 'b-qt', reef: false, en: 'Quarantine tank', hu: 'Karantén', den: 'A temporary tank for observing and treating new fish.', dhu: 'Ideiglenes tank új halak megfigyeléséhez és kezeléséhez.' }
  ];
  var LEVELS = ['bad', 'caution', 'good', 'info'];
  var TEXT = {
    hu: {
      good: 'Jó választás', caution: 'Feltételekkel', bad: 'Nem ajánlott', unknown: 'Nincs becslés',
      planned: 'Tervezett', cycling: 'Beérés alatt', young: 'Fiatal', settled: 'Beállt', mature: 'Érett',
      tooSmall: 'Legalább {min} l-es akvárium kell neki, a tiéd {vol} l.',
      belowIdeal: 'Elfér {vol} l-ben, de ideálisan {ideal} l kell neki.',
      noVolume: 'Add meg a tank térfogatát a pontosabb becsléshez.',
      noType: 'Add meg a tank fajtáját (korallos, csak halas…) a pontosabb becsléshez.',
      notReef: 'Korallos akváriumba nem való: korallokat vagy gerincteleneket bánt.',
      cautionReef: 'Korallos akváriumban óvatosan: egyes példányok csipegetik a korallokat vagy a gerincteleneket.',
      fowlrCoral: 'A tankod csak halas (FOWLR); korallhoz megfelelő fény és vízkémia kell.',
      quarantine: 'Karanténtankra nem adunk becslést.',
      plannedInfo: 'Tervezett tank: a becslés a beállt állapotra szól.',
      cyclingNow: 'A tank még beérés alatt van ({weeks} hetes). Várd meg, amíg az ammónia és a nitrit tartósan 0.',
      tooYoung: 'Beállt, legalább {need} hónapos akvárium kell neki; a tiéd {have} hónapos.',
      eats: 'Megeszi vagy megtámadja ezt a lakódat: {names}.',
      mayEat: 'Megeheti vagy csipegetheti ezt a lakódat: {names}.',
      eatenBy: 'A tankodban lévő lakó megeszi vagy megtámadja: {names}.',
      mayBeEatenBy: 'A tankodban lévő lakó megeheti vagy csipegetheti: {names}.',
      harmedBy: 'Ez a lakód veszélyes rá: {names}.',
      harms: 'Veszélyes erre a lakódra: {names}.',
      maxOne: 'Fajtársaival nem fér meg: egy tankba csak egy kerüljön (már van {n}).',
      maxTwo: 'Legfeljebb egy pár tartható egy tankban (már van {n}).',
      maxN: 'Legfeljebb {max} tartható egy tankban (már van {n}).',
      rivalNever: 'Nem fér meg a rokon fajjal: {names}.',
      rivalSmall: 'A rokon faj mellett {l} l alatt verekednek: {names}.',
      tempBully: 'Agresszív, ez a félénk lakód nem bírná: {names}.',
      tempBullied: 'Félénk, ez az agresszív lakód mellett nem boldogulna: {names}.',
      tempRough: 'Rámenős lehet ezzel a békés lakóddal: {names}.',
      tempRoughBy: 'Ez a rámenős lakód zavarhatja: {names}.',
      stingCand: 'Csalánozza a szomszédait: hagyj körülötte helyet a többi korall elől.',
      chemicalCand: 'Vegyi anyagokkal támadja a többi korallt; aktív szén ajánlott.',
      spreadsCand: 'Terjed, és benőheti a többi korallt.',
      stingRes: 'Ez a lakód csalánozza a szomszédait, tedd tőle távolabb: {names}.',
      chemicalRes: 'Ez a lakód vegyi anyagokkal támadja a korallokat: {names}.',
      spreadsRes: 'Ez a lakód terjed és benőheti: {names}.',
      wandersCand: 'Az anemóna vándorol, és csalánozza a korallokat, amelyekhez hozzáér.',
      wandersRes: 'Ez az anemónád vándorolhat és csalánozhatja: {names}.',
      partner: 'Szimbiózisban élhet vele: {names}.',
      groupMin: 'Csoportban érzi jól magát: legalább {n} példány ajánlott.',
      jumper: 'Kiugrik: fedő vagy háló kell az akváriumra.',
      load: 'A halak becsült terhelése vele együtt {pct}% lenne.',
      verdict: 'Reef42: nem ajánlott.',
      expert: 'Haladóknak való faj.',
      noCompat: 'Ehhez a fajhoz még nincs elég adat a társakról.',
      already: 'Már van belőle a tankodban: {n} db.'
    },
    en: {
      good: 'Good choice', caution: 'With conditions', bad: 'Not recommended', unknown: 'No estimate',
      planned: 'Planned', cycling: 'Cycling', young: 'Young', settled: 'Settled', mature: 'Mature',
      tooSmall: 'Needs at least {min} L; your tank is {vol} L.',
      belowIdeal: 'Fits in {vol} L, but {ideal} L is ideal.',
      noVolume: 'Add your tank volume for a better estimate.',
      noType: 'Add your tank type (reef, fish only…) for a better estimate.',
      notReef: 'Not for a reef tank: it harms corals or invertebrates.',
      cautionReef: 'Reef tank with caution: some individuals nip corals or invertebrates.',
      fowlrCoral: 'Your tank is fish only (FOWLR); corals need suitable light and water chemistry.',
      quarantine: 'No estimate for a quarantine tank.',
      plannedInfo: 'Planned tank: the estimate assumes it has settled.',
      cyclingNow: 'The tank is still cycling ({weeks} weeks old). Wait until ammonia and nitrite stay at 0.',
      tooYoung: 'Needs a settled tank at least {need} months old; yours is {have} months old.',
      eats: 'Eats or attacks a resident of yours: {names}.',
      mayEat: 'May eat or nip a resident of yours: {names}.',
      eatenBy: 'A resident of yours eats or attacks it: {names}.',
      mayBeEatenBy: 'A resident of yours may eat or nip it: {names}.',
      harmedBy: 'This resident is a danger to it: {names}.',
      harms: 'It is a danger to this resident: {names}.',
      maxOne: 'Does not tolerate its own kind: keep only one per tank (you have {n}).',
      maxTwo: 'Keep at most one pair per tank (you have {n}).',
      maxN: 'Keep at most {max} per tank (you have {n}).',
      rivalNever: 'Does not get along with a related species: {names}.',
      rivalSmall: 'Fights with a related species in tanks under {l} L: {names}.',
      tempBully: 'Aggressive; this shy resident would not cope: {names}.',
      tempBullied: 'Shy; it would struggle next to this aggressive resident: {names}.',
      tempRough: 'May be rough on this peaceful resident: {names}.',
      tempRoughBy: 'This pushy resident may bother it: {names}.',
      stingCand: 'Stings its neighbours: leave room around it for other corals.',
      chemicalCand: 'Fights other corals with chemicals; run activated carbon.',
      spreadsCand: 'Spreads and can overgrow other corals.',
      stingRes: 'This resident stings its neighbours, keep it at a distance: {names}.',
      chemicalRes: 'This resident fights corals with chemicals: {names}.',
      spreadsRes: 'This resident spreads and can overgrow it: {names}.',
      wandersCand: 'Anemones wander and sting the corals they touch.',
      wandersRes: 'This anemone of yours may wander and sting it: {names}.',
      partner: 'Can live in symbiosis with: {names}.',
      groupMin: 'Does best in a group: at least {n} recommended.',
      jumper: 'Jumps: the tank needs a lid or a net.',
      load: 'With it, the estimated fish load would be {pct}%.',
      verdict: 'Reef42: not recommended.',
      expert: 'A species for experienced keepers.',
      noCompat: 'Not enough data about its tankmates yet.',
      already: 'Already in your tank: {n}.'
    }
  };

  function tx(lang, k, vars) {
    var s = (TEXT[lang] || TEXT.en)[k] || TEXT.en[k] || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.split('{' + v + '}').join(vars[v]); });
    return s;
  }
  function typeOf(id) { return TYPES.filter(function (x) { return x.id === id; })[0] || null; }
  function spName(sp, lang) {
    var n = lang === 'hu' && sp.name_hu ? sp.name_hu : sp.name_en || sp.scientific_name;
    return lang === 'hu' ? n.charAt(0).toLowerCase() + n.slice(1) : n;
  }
  function sizeOf(sp) { return (sp.size_cm && (sp.size_cm.max || sp.size_cm.min)) || 8; }
  function num(n, lang) { return lang === 'hu' ? String(n).replace('.', ',') : String(n); }

  /* ---------- tank age ---------- */
  function ageDays(tank, now) {
    if (!tank || !tank.start) return null;
    var t = Date.parse(tank.start + 'T00:00:00');
    return isFinite(t) ? Math.floor(((now || Date.now()) - t) / 864e5) : null;
  }
  function stage(tank, now) {
    if (tank && tank.planned) return 'planned';
    var d = ageDays(tank, now);
    if (d == null) return null;
    if (d < 0) return 'planned';
    if (d < 42) return 'cycling';
    if (d < 183) return 'young';
    if (d < 365) return 'settled';
    return 'mature';
  }

  /* ---------- fish load ---------- */
  // Same weight as the Reef game: (adult length / 10 cm)^2.2; a tank holds about volume / 16 of it.
  function units(sp) { return sp && sp.group === 'fish' ? Math.pow(sizeOf(sp) / 10, 2.2) : 0; }
  function load(byId, tank, extra) {
    if (!tank || !tank.volume) return null;
    var u = (tank.livestock || []).reduce(function (a, x) { return a + units(byId[x.sp]) * (x.n || 1); }, 0);
    if (extra) u += units(extra.sp) * (extra.n || 1);
    return Math.round(u / (tank.volume / 16) * 100);
  }

  /* ---------- rules ---------- */
  function preyKey(sp, prey) {
    if (sp.group === 'fish') return 'small-fish';
    for (var k in prey) if ((prey[k].categories || []).indexOf(sp.category) >= 0) return k;
    return null;
  }
  // How dangerous is pred to prey: 'bad', 'caution' or null.
  function predation(pred, prey, preyMap) {
    var c = pred.compat || {};
    var key = preyKey(prey, preyMap);
    if (!key || pred.id === prey.id) return null;
    var eats = (c.eats || []).indexOf(key) >= 0, may = (c.may_eat || []).indexOf(key) >= 0;
    if (!eats && !may) return null;
    if (key !== 'small-fish') return eats ? 'bad' : 'caution';
    var r = sizeOf(prey) / sizeOf(pred);
    if (eats) return r <= 0.5 ? 'bad' : r <= 0.7 ? 'caution' : null;
    return r <= 0.7 ? 'caution' : null;
  }
  function harms(a, b, preyMap) {
    var key = preyKey(b, preyMap);
    return !!key && ((a.compat || {}).avoid || []).indexOf(key) >= 0;
  }
  function temper(a, b) {
    var ca = a.compat || {}, cb = b.compat || {};
    if (a.group !== 'fish' || b.group !== 'fish') return null;
    if (ca.temperament === 'aggressive' && cb.shy) return ['bad', 'tempBully'];
    if (ca.shy && cb.temperament === 'aggressive') return ['bad', 'tempBullied'];
    if (ca.temperament === 'aggressive' && cb.temperament === 'peaceful') return ['caution', 'tempRough'];
    if (ca.temperament === 'semi-aggressive' && cb.shy) return ['caution', 'tempRough'];
    if ((ca.temperament === 'peaceful' || ca.shy) && (cb.temperament === 'aggressive' || cb.temperament === 'semi-aggressive' && ca.shy)) return ['caution', 'tempRoughBy'];
    return null;
  }
  function rivalLimit(a, b) {
    if (a.id === b.id) return undefined;
    var out;
    ((a.compat || {}).rivals || []).forEach(function (r) {
      ((b.compat || {}).rivals || []).forEach(function (q) {
        if (r.key !== q.key) return;
        var l = r.ok_from_l == null || q.ok_from_l == null ? null : Math.max(r.ok_from_l, q.ok_from_l);
        if (out === undefined || l === null || (out !== null && l > out)) out = l;
      });
    });
    return out;
  }
  function isCoral(sp) { return sp.group === 'coral' && sp.category !== 'algae'; }

  // sp: species to judge; tank: see top; opts: { n: how many would be added (default 1), exclude: livestock entry id
  // to leave out (judging a resident against the rest) }.
  function evaluate(db, sp, tank, lang, opts) {
    opts = opts || {};
    lang = lang === 'hu' ? 'hu' : 'en';
    var byId = db.byId, preyMap = (db.enums && db.enums.prey) || {};
    var out = [];
    var groups = {};
    function add(level, key, vars) { out.push({ level: level, key: key, text: tx(lang, key, vars) }); }
    function addName(level, key, name, vars) {
      var g = groups[level + key];
      if (!g) { g = groups[level + key] = { level: level, key: key, names: [], vars: vars || {} }; out.push(g); }
      if (g.names.indexOf(name) < 0) g.names.push(name);
    }
    var type = typeOf(tank && tank.type);
    if (type && type.id === 'quarantine') return finish([{ level: 'info', text: tx(lang, 'quarantine') }], 'unknown');

    var addN = opts.n || 1;
    var vol = tank && tank.volume;
    var c = sp.compat || {};
    var residents = ((tank && tank.livestock) || []).filter(function (x) { return x.id !== opts.exclude && byId[x.sp]; });

    if (sp.verdict && sp.verdict.recommendation === 'not_recommended') add('bad', 'verdict');
    // size
    if (!vol) add('info', 'noVolume');
    else if (sp.tank_min_l && vol < sp.tank_min_l) add('bad', 'tooSmall', { min: sp.tank_min_l, vol: num(vol, lang) });
    else if (sp.tank_ideal_l && vol < sp.tank_ideal_l) add('caution', 'belowIdeal', { ideal: sp.tank_ideal_l, vol: num(vol, lang) });
    // tank type
    if (!type) add('info', 'noType');
    else if (type.reef && sp.reef_safety === 'not-reef-safe') add('bad', 'notReef');
    else if (type.reef && sp.reef_safety === 'with-caution') add('caution', 'cautionReef');
    else if (!type.reef && isCoral(sp)) add('caution', 'fowlrCoral');
    // tank age
    var st = stage(tank);
    if (st === 'planned') add('info', 'plannedInfo');
    else if (st) {
      var days = ageDays(tank), months = Math.floor(days / 30.44);
      if (st === 'cycling') add('caution', 'cyclingNow', { weeks: Math.floor(days / 7) });
      else if (c.min_age_months && months < c.min_age_months) add(months < c.min_age_months / 2 ? 'bad' : 'caution', 'tooYoung', { need: c.min_age_months, have: months });
    }
    // own kind
    var same = residents.filter(function (x) { return x.sp === sp.id; }).reduce(function (a, x) { return a + (x.n || 1); }, 0);
    if (c.max_same && same + addN > c.max_same) add('bad', c.max_same === 1 ? 'maxOne' : c.max_same === 2 ? 'maxTwo' : 'maxN', { max: c.max_same, n: same });
    else if (same && !opts.exclude) add('info', 'already', { n: same });
    // the other residents
    residents.forEach(function (x) {
      var r = byId[x.sp];
      if (r.id === sp.id) return;
      var name = spName(r, lang);
      var rc = r.compat || {};
      // Natural partners (clownfish and host anemone) are not prey to each other.
      if ((c.partners || []).indexOf(r.id) >= 0 || (rc.partners || []).indexOf(sp.id) >= 0) { addName('good', 'partner', name); return; }
      var p = predation(sp, r, preyMap);
      if (p) addName(p, p === 'bad' ? 'eats' : 'mayEat', name);
      var q = predation(r, sp, preyMap);
      if (q) addName(q, q === 'bad' ? 'eatenBy' : 'mayBeEatenBy', name);
      if (harms(sp, r, preyMap)) addName('caution', 'harmedBy', name);
      if (harms(r, sp, preyMap)) addName('caution', 'harms', name);
      var lim = rivalLimit(sp, r);
      if (lim === null) addName('bad', 'rivalNever', name);
      else if (lim !== undefined && (!vol || vol < lim)) addName('bad', 'rivalSmall', name, { l: lim });
      var tm = temper(sp, r);
      if (tm) addName(tm[0], tm[1], name);
      if (isCoral(sp) && rc.neighbours) addName('caution', rc.neighbours + 'Res', name);
      if (isCoral(sp) && rc.wanders) addName('caution', 'wandersRes', name);
    });
    var corals = residents.some(function (x) { return x.sp !== sp.id && isCoral(byId[x.sp]); });
    if (c.neighbours && corals) add('caution', c.neighbours + 'Cand');
    if (c.wanders && corals) add('caution', 'wandersCand');
    // fish load
    if (sp.group === 'fish' && vol) {
      var pct = load(byId, { volume: vol, livestock: residents }, { sp: sp, n: addN });
      if (pct > 100) add('bad', 'load', { pct: pct });
      else if (pct > 80) add('caution', 'load', { pct: pct });
    }
    if (sp.difficulty === 'expert') add('caution', 'expert');
    if (c.group_min && same + addN < c.group_min) add('info', 'groupMin', { n: c.group_min });
    if (c.jumper) add('info', 'jumper');
    if (!sp.compat && sp.group !== 'coral') add('info', 'noCompat');

    var reasons = out.map(function (r) {
      if (!r.names) return r;
      var vars = Object.assign({ names: r.names.join(', ') }, r.vars);
      return { level: r.level, key: r.key, text: tx(lang, r.key, vars) };
    });
    var level = reasons.some(function (r) { return r.level === 'bad'; }) ? 'bad' : reasons.some(function (r) { return r.level === 'caution'; }) ? 'caution' : 'good';
    if (level === 'good' && (!vol || !type)) level = 'unknown';
    return finish(reasons, level);

    function finish(rs, lv) {
      rs.sort(function (a, b) { return LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level); });
      return { level: lv, label: tx(lang, lv), reasons: rs };
    }
  }

  // A tank is ready for estimates once it has a type and a volume.
  function ready(tank) { return !!(tank && tank.type && tank.volume); }
  function index(db) {
    if (!db.byId) { db.byId = {}; (db.species || []).forEach(function (s) { db.byId[s.id] = s; }); }
    return db;
  }

  window.reef42Compat = {
    TYPES: TYPES, typeOf: typeOf, stage: stage, ageDays: ageDays, load: load, units: units,
    evaluate: evaluate, ready: ready, index: index, text: tx
  };
})();
