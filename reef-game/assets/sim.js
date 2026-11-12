// Reef game simulation: pure state + time steps + player actions. No DOM; also runs in Node (module.exports) for tests.
// Units: volume L, concentrations ppm (mg/L), KH dKH, temperature °C, salinity ppt (g/L), time in days.
(function (root) {
  'use strict';

  const SAL0 = 35;
  const FRESH = { kh: 8, ca: 420, mg: 1300 };
  const TOL = { easy: 1.4, moderate: 1, difficult: 0.75, expert: 0.55 };
  const MAX_DT = 0.125;

  // Parameter ranges per animal class: [okLow, okHigh, badLow, badHigh, weight]; at the bad edge the animal loses `weight` health a day.
  const P = {
    fish: { nh3: [null, 0.1, null, 0.6, 30], no2: [null, 1, null, 8, 8], no3: [null, 40, null, 120, 6], temp: [23.5, 28, 21, 31, 25], sal: [29, 38, 26, 41, 15], ph: [7.8, 8.6, 7.4, 8.9, 10], o2: [75, null, 45, null, 40], cu: [null, 0.3, null, 0.5, 30] },
    invert: { nh3: [null, 0.1, null, 0.5, 30], no2: [null, 0.5, null, 5, 8], no3: [null, 50, null, 120, 6], temp: [23.5, 28, 21, 30.5, 25], sal: [31.5, 37.5, 29, 39.5, 20], ph: [7.8, 8.6, 7.5, 8.8, 10], o2: [70, null, 45, null, 35], cu: [null, 0.01, null, 0.04, 80] },
    sps: { nh3: [null, 0.05, null, 0.3, 30], no3: [0.5, 10, -2, 30, 8], po4: [0.01, 0.08, -0.03, 0.3, 8], temp: [24, 27.5, 22.5, 29.5, 25], sal: [32.5, 36.5, 30.5, 38.5, 15], kh: [7, 11, 5.5, 13, 12], ca: [380, 470, 330, 520, 6], mg: [1250, 1450, 1100, 1600, 5], ph: [7.9, 8.5, 7.6, 8.8, 8], o2: [70, null, 45, null, 25], cu: [null, 0.01, null, 0.03, 90], org: [null, 4, null, 12, 5] },
    lps: { nh3: [null, 0.1, null, 0.5, 25], no3: [1, 25, -4, 60, 5], po4: [null, 0.15, null, 0.5, 6], temp: [23.5, 28, 22, 30, 22], sal: [32, 37, 30, 39, 15], kh: [6.5, 11.5, 5, 13, 8], ca: [360, 480, 320, 530, 4], mg: [1200, 1450, 1050, 1600, 4], ph: [7.8, 8.6, 7.5, 8.8, 8], o2: [70, null, 45, null, 25], cu: [null, 0.01, null, 0.03, 90] },
    soft: { nh3: [null, 0.15, null, 0.8, 20], no3: [null, 40, null, 100, 4], po4: [null, 0.3, null, 1, 4], temp: [23, 28.5, 21, 30.5, 20], sal: [31, 37.5, 29, 40, 12], ph: [7.8, 8.6, 7.5, 8.9, 6], o2: [65, null, 40, null, 20], cu: [null, 0.02, null, 0.05, 80] },
    macro: { temp: [22, 29, 19, 32, 10], sal: [30, 38, 27, 41, 8], cu: [null, 0.05, null, 0.1, 40] }
  };
  P.anemone = P.invert;
  P.clam = Object.assign({}, P.invert, { po4: [null, 0.15, null, 0.5, 6], kh: [6.5, 12, 5, 14, 5] });
  P.nps = P.lps;
  const LIGHT = { low: [40, 180], medium: [120, 300], high: [220, 500] };
  const FLOW = { low: [3, 20], medium: [8, 45], high: [20, 100] };
  const PLACE = { top: 1.35, middle: 1, bottom: 0.6 };
  const GROWTH = { slow: 0.004, medium: 0.008, fast: 0.014 };
  const CALC = { sps: 0.8, lps: 0.5, clam: 1 };
  const PHOTO = { sps: 1, lps: 1, soft: 1, macro: 1, anemone: 1, clam: 1 };
  const TESTS = ['nh3', 'no2', 'no3', 'po4', 'ph', 'kh', 'ca', 'mg', 'cu'];
  const UNIQUE = ['skimmer', 'sock', 'refugium', 'uv', 'fan', 'chiller', 'ato', 'doser', 'feeder', 'controller', 'qt', 'refractometer', 'lid'];
  const SMALL_INVERT = ['shrimps', 'snails', 'hermit-crabs', 'crabs', 'worms'];

  let CAT = { tanks: {}, eq: {}, cons: {}, packs: {}, species: {}, list: [] };

  /* ---------- catalogues ---------- */
  function init(data) {
    CAT = { tanks: {}, eq: {}, cons: {}, packs: {}, species: {}, list: [], currency: data.equipment.currency || '🐚' };
    data.equipment.tanks.forEach((x) => { CAT.tanks[x.id] = x; });
    data.equipment.equipment.forEach((x) => { CAT.eq[x.id] = x; });
    data.equipment.consumables.forEach((x) => { CAT.cons[x.id] = x; });
    (data.equipment.packs || []).forEach((x) => { CAT.packs[x.id] = x; });
    const ov = data.overrides || {};
    (data.species || []).forEach((s) => {
      const st = speciesStats(s, ov[s.id] || {});
      CAT.species[s.id] = st;
      CAT.list.push(st);
    });
    return CAT;
  }
  const r5 = (n) => Math.max(5, Math.round(n / 5) * 5);
  function speciesStats(s, o) {
    const max = (s.size_cm && (s.size_cm.max || s.size_cm.min)) || 8;
    const diffMul = { easy: 1, moderate: 1.15, difficult: 1.4, expert: 1.8 }[s.difficulty] || 1;
    const util = s.utility || [];
    const st = { id: s.id, sp: s, group: s.group, category: s.category, tol: TOL[s.difficulty] || 1, minTank: s.tank_min_l || 0, util, graze: 0, wu: 0 };
    if (s.group === 'fish') {
      Object.assign(st, { cls: 'fish', wu: Math.pow(max / 10, 2.2), price: r5((15 + max * 2.5) * diffMul), hunger: 35, eat: 1 });
      st.ichChance = { surgeonfish: 0.3, butterflyfish: 0.25, angelfish: 0.22 }[s.category] || 0.12;
      st.jumper = ['wrasses', 'gobies', 'blennies'].includes(s.category);
      st.graze = util.includes('algae-eater') ? (s.category === 'surgeonfish' ? 5 : 2.5) : 0;
    } else if (s.group === 'coral') {
      const cls = s.category === 'sps' ? 'sps' : s.category.startsWith('lps') ? 'lps' : s.category === 'nps' ? 'nps' : s.category === 'algae' ? 'macro' : 'soft';
      const base = { sps: 45, lps: 40, nps: 50, soft: 25, macro: 10 }[cls] + (s.category === 'zoanthids' ? 5 : s.category === 'mushrooms' ? -5 : 0);
      Object.assign(st, { cls, wu: 0, price: r5(base * diffMul), hunger: cls === 'nps' ? 40 : 0, eat: 1, light: cls === 'nps' ? null : s.light || 'medium', flow: s.flow || 'medium', growth: GROWTH[s.growth] || GROWTH.medium });
      if (cls === 'macro') st.growth = 0.03;
      st.stinger = ['lps-euphyllia', 'lps-other'].includes(s.category) && /galaxea|euphyllia|catalaphyllia/.test(s.id);
    } else {
      const cls = s.category === 'anemones' ? 'anemone' : s.category === 'bivalves' ? 'clam' : 'invert';
      const wu = (cls === 'anemone' ? 0.3 : 0.35) * Math.pow(max / 10, 2.2);
      const price = cls === 'clam' ? r5(90 + max * 2) : cls === 'anemone' ? r5(50 + max) : r5((6 + max * 1.5) * diffMul);
      Object.assign(st, { cls, wu: Math.max(0.03, wu), price, hunger: cls === 'anemone' ? 8 : cls === 'clam' ? 0 : 15, eat: 1 });
      if (cls === 'clam') { st.light = 'high'; st.growth = GROWTH.slow; }
      if (cls === 'anemone') st.light = 'medium';
      const g = { snails: 2.5, urchins: 4, crabs: 2, 'hermit-crabs': 1.2 }[s.category] || 1.5;
      st.graze = util.includes('algae-eater') ? g : 0;
    }
    st.detritus = util.includes('detritus-eater') || util.includes('sand-sifter') ? 1 : 0;
    st.aipt = util.includes('aiptasia-eater') ? (s.group === 'fish' ? 3 : 1) : 0;
    st.pestSnail = util.includes('pest-snail-control') || ['halichoeres', 'pseudocheilinus'].some((g) => s.id.startsWith(g)) ? 1 : 0;
    st.predator = s.reef_safety === 'not-reef-safe' ? 1 : s.reef_safety === 'with-caution' ? 0.25 : 0;
    ['eat', 'ich', 'price', 'hunger', 'light', 'flow', 'needsPods', 'note'].forEach((k) => {
      if (o[k] === undefined) return;
      if (k === 'ich') st.ichChance = o.ich; else st[k] = o[k];
    });
    return st;
  }

  /* ---------- random ---------- */
  function rnd(s) {
    s.seed = (s.seed + 0x6D2B79F5) | 0;
    let t = s.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];

  /* ---------- new game ---------- */
  function newGame(opts) {
    const s = {
      v: 1, created: Date.now(), startDate: new Date().toISOString().slice(0, 10), day: 0, lastReal: Date.now(), speed: 1,
      opts: Object.assign({ mode: 'free', time: 'turn', difficulty: 'easy', randomEvents: true }, opts || {}),
      money: 2500, income: 100, tank: null, rockKg: 0, liveKg: 0, eq: [], uid: 1,
      stock: { salt: 0, food: 0, coralfood: 0, 'add:kh': 0, 'add:ca': 0, 'add:mg': 0, bacteria: 0, ammonia: 0, carbon: 0, gfo: 0, copper: 0, aiptasiax: 0, dip: 0 },
      media: { carbon: 0, gfo: 0, sock: 0 },
      set: { heater: 25.5, light: 8, dose: { kh: 0, ca: 0, mg: 0 } },
      w: { level: 0, salt: 0, temp: 22, nh3: 0, no2: 0, no3: 0, po4: 0, kh: FRESH.kh, ca: FRESH.ca, mg: FRESH.mg, cu: 0, org: 0, o2: 100, ph: 8.2, khDay: FRESH.kh },
      bac: { a: 0.1, n: 0.1 }, det: 0, food: 0, alg: { diatom: 0, hair: 0, cyano: 0 }, pest: { aiptasia: 0, pyramid: 0 },
      dis: { ich: 0, velvet: 0 }, qt: { cu: 0, treat: 0, ich: 0, velvet: 0 },
      ani: [], meas: [], log: [], heaven: [], ev: {}, mission: null, seed: (Math.random() * 2 ** 31) | 0
    };
    TESTS.forEach((p) => { s.stock['test:' + p] = 0; });
    return s;
  }
  // Mission setup: a ready-made state (tank, equipment, animals, water) for the mission's first step.
  function applySetup(s, m) {
    const u = m.setup || {};
    if (u.money != null) s.money = u.money;
    if (u.income != null) s.income = u.income;
    if (u.randomEvents === false) s.opts.randomEvents = false;
    (u.equipment || []).forEach((id) => { if (CAT.eq[id]) addEq(s, id); });
    if (u.tank) {
      s.tank = { id: u.tank, net: CAT.tanks[u.tank].net, filled: false, filledDay: 0 };
      if (u.filled) { fillTank(s, true); s.w.temp = s.set.heater; }
    }
    if (u.rock) { s.rockKg += u.rock.kg; if (u.rock.live) s.liveKg += u.rock.kg; }
    if (u.cycled && s.tank) {
      const V = s.tank.net;
      s.bac.a = s.bac.n = 0.8 * V / 10;
      s.bac.la = s.bac.ln = 0.4 * V / 10;
      s.tank.filledDay = -60;
      s.w.no3 = 5; s.w.po4 = 0.03;
    }
    Object.assign(s.stock, u.stock || {});
    Object.assign(s.w, u.water || {});
    Object.assign(s.alg, u.algae || {});
    Object.assign(s.pest, u.pests || {});
    if (u.media) Object.assign(s.media, u.media);
    (u.animals || []).forEach((a) => {
      for (let i = 0; i < (a.n || 1); i++) {
        const an = addAnimal(s, a.sp, a.where || 'display', a.place);
        if (an && a.infected) { an.inf = an.inf || {}; an.inf[a.infected] = 0.15; s.dis[a.infected] = Math.max(s.dis[a.infected], 0.25); }
        if (an && a.health) an.health = a.health;
      }
    });
    s.scripted = (u.events || []).map((e) => Object.assign({}, e));
    s.mission = { id: m.id, step: 0, stepStart: s.day, deaths: 0, maxTemp: 0 };
    if (u.cycled) s.cycleDone = true;
    return s;
  }

  /* ---------- derived values ---------- */
  const has = (s, kind) => s.eq.some((e) => CAT.eq[e.id] && CAT.eq[e.id].kind === kind);
  const working = (s, kind) => s.eq.filter((e) => CAT.eq[e.id] && CAT.eq[e.id].kind === kind && e.state === 'ok');
  const powerOn = (s) => !(s.ev.power && s.ev.power > s.day);
  function env(s) {
    const V = Math.max(1, s.w.level || (s.tank ? s.tank.net : 100));
    const on = powerOn(s);
    const lights = on ? working(s, 'light') : [];
    const par = Math.min(600, lights.reduce((a, e) => a + CAT.eq[e.id].par * Math.min(1, CAT.eq[e.id].rated / V), 0));
    const pumps = on ? working(s, 'pump') : [];
    const flowX = pumps.reduce((a, e) => a + CAT.eq[e.id].flow * (CAT.eq[e.id].wave ? 1.3 : 1), 0) / V;
    const sk = on ? working(s, 'skimmer')[0] : null;
    const skimmer = sk ? 0.35 * Math.min(1, CAT.eq[sk.id].rated / V) : 0;
    const fuge = on && working(s, 'refugium').length ? Math.min(1, CAT.eq.refugium.rated / V) : 0;
    const uv = on && working(s, 'uv').length ? 1 : 0;
    const sockClean = has(s, 'sock') && s.day - s.media.sock <= 7;
    return { V, on, par, flowX, skimmer, fuge, uv, sockClean, hours: s.set.light, lid: has(s, 'lid') };
  }
  function roomTemp(s) {
    const d = new Date(s.startDate + 'T12:00:00');
    d.setDate(d.getDate() + Math.floor(s.day));
    const doy = (d - new Date(d.getFullYear(), 0, 0)) / 864e5;
    let t = 22.75 - 2.75 * Math.cos(2 * Math.PI * (doy - 15) / 365);
    if (s.ev.heat && s.ev.heat.until > s.day) t += s.ev.heat.add;
    return t;
  }
  function isSummer(s) {
    const d = new Date(s.startDate + 'T12:00:00');
    d.setDate(d.getDate() + Math.floor(s.day));
    return [5, 6, 7].includes(d.getMonth());
  }
  const alive = (s, where) => s.ani.filter((a) => !where || a.where === where);
  const stats = (a) => CAT.species[a.sp];
  const coralLight = (s, e, a) => e.par * PLACE[a.place || 'middle'] * clamp(e.hours / 8, 0.4, 1.3);

  /* ---------- time ---------- */
  function step(s, days) {
    const out = [];
    let left = days;
    while (left > 1e-9) {
      const h = Math.min(left, MAX_DT);
      tick(s, h, out);
      left -= h;
      if (s.ev.holiday && s.ev.holiday.pending) break;
    }
    return out;
  }
  function log(s, out, k, x, lvl) {
    const e = { d: Math.round(s.day * 100) / 100, k, x: x || {}, lvl: lvl || 'info' };
    s.log.push(e);
    if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
    out.push(e);
  }
  function tick(s, h, out) {
    const before = s.day;
    s.day += h;
    const newDay = Math.floor(s.day) > Math.floor(before);
    if (!s.tank || !s.tank.filled) { if (newDay) daily(s, null, out); return; }
    const e = env(s);
    const tod0 = before - Math.floor(before);
    const tod1 = s.day - Math.floor(s.day) || 1;
    const crossed = (t) => (newDay ? tod0 < t || tod1 >= t : tod0 < t && tod1 >= t);
    const away = s.ev.holiday && s.ev.holiday.until > s.day;
    if (e.on && working(s, 'feeder').length && (crossed(0.33) || crossed(0.75)) && s.stock.food > 0) feed(s, 'normal', true);
    if (away && s.ev.holiday.choice === 'neighbor' && crossed(0.5)) feed(s, rnd(s) < 0.3 ? 'large' : 'normal', true, true);
    if (e.on && working(s, 'doser').length) {
      ['kh', 'ca', 'mg'].forEach((k) => {
        const ml = Math.min(s.set.dose[k] * h, s.stock['add:' + k]);
        if (ml > 0) { s.stock['add:' + k] -= ml; addSupplement(s, k, ml); }
      });
    }
    water(s, e, h, out);
    life(s, e, h, out);
    if (newDay) daily(s, e, out);
  }

  function water(s, e, h, out) {
    const w = s.w;
    const V = e.V;
    // temperature
    const room = roomTemp(s);
    const lightHeat = working(s, 'light').reduce((a, x) => a + CAT.eq[x.id].heat, 0) * (e.hours / 12);
    const teq = room + (e.on ? 0.5 + lightHeat : 0);
    let target = teq;
    const heaters = e.on ? s.eq.filter((x) => CAT.eq[x.id].kind === 'heater' && (x.state === 'ok' || x.state === 'stuck')) : [];
    const up = heaters.reduce((a, x) => a + 6 * Math.min(1, CAT.eq[x.id].rated / V), 0);
    if (heaters.some((x) => x.state === 'stuck')) target = teq + up;
    else if (teq < s.set.heater) target = Math.min(s.set.heater, teq + up);
    const cool = e.on ? working(s, 'fan').length * CAT.eq.fan.cool + working(s, 'chiller').length * CAT.eq.chiller.cool : 0;
    if (target > s.set.heater + 0.3 && cool) target = Math.max(s.set.heater, target - cool);
    const k = 2.5 / Math.pow(V / 100, 0.35);
    w.temp += (target - w.temp) * (1 - Math.exp(-k * h));
    // evaporation and top-off
    const evap = V * 0.008 * (1 + 0.6 * (e.on ? working(s, 'fan').length : 0)) * (1 + (w.temp - 25) * 0.05) * (e.lid ? 0.85 : 1);
    w.level = Math.max(s.tank.net * 0.6, w.level - evap * h);
    const ato = e.on ? s.eq.find((x) => CAT.eq[x.id].kind === 'ato' && x.state !== 'broken') : null;
    if (ato && ato.state === 'stuck') w.level = Math.min(s.tank.net * 1.06, w.level + s.tank.net * 0.03 * h);
    else if (ato) w.level = Math.max(w.level, s.tank.net);
    w.sal = w.salt / w.level;
    // nitrogen: uneaten food and detritus decay, bacteria convert NH3 → NO2 → NO3
    const rot = (s.food || 0) * Math.min(1, 0.35 * h);
    s.food = (s.food || 0) - rot;
    const decay = s.det * Math.min(1, 0.25 * h) + rot;
    s.det -= decay - rot;
    const trap = e.sockClean ? 0.4 : has(s, 'sock') ? -0.2 : 0;
    const dec = decay * (1 - trap);
    let nh3 = w.nh3 * V + dec * 1.2 * (1 - e.skimmer * 0.5);
    w.po4 += dec * 0.15 * (1 - e.skimmer * 0.6) / V;
    w.org += dec * 0.09 * (100 / V);
    const o2f = clamp(w.o2 / 80, 0.2, 1);
    // Bacteria grow while there is something to eat (up to what the rock and glass can hold) and slowly die back to
    // about twice the load they actually process.
    const cap = s.rockKg * 10 + 0.4 * V;
    const conv = Math.min(nh3, s.bac.a * h * o2f);
    nh3 -= conv;
    let no2 = w.no2 * V + conv * 2.7;
    const conv2 = Math.min(no2, s.bac.n * 2.7 * h * o2f);
    no2 -= conv2;
    w.no3 += conv2 / 2.7 * 3.6 / V;
    const b = s.bac;
    b.la = (b.la || 0) + (conv / h - (b.la || 0)) * Math.min(1, 0.5 * h);
    b.ln = (b.ln || 0) + (conv2 / 2.7 / h - (b.ln || 0)) * Math.min(1, 0.5 * h);
    const grow = (x, rate, food, used) => (food ? x + x * rate * h * Math.max(0, 1 - x / cap) : x > Math.max(0.1, 2 * used) ? x - x * 0.03 * h : x);
    b.a = grow(b.a, 0.32, nh3 / V > 0.005, b.la);
    b.n = grow(b.n, 0.28, no2 / V > 0.01, b.ln);
    w.nh3 = nh3 / V;
    w.no2 = no2 / V;
    // export: rock denitrification, refugium, algae, phosphate remover, carbon, skimmer
    w.no3 -= w.no3 * Math.min(0.5, (s.rockKg / V * 0.2 + 0.03 * e.fuge) * h);
    w.po4 -= w.po4 * Math.min(0.5, (0.03 * e.fuge + s.rockKg / V * 0.1) * h);
    const hair = s.alg.hair / 100;
    w.no3 = Math.max(0, w.no3 - hair * 0.6 * h);
    w.po4 = Math.max(0, w.po4 - hair * 0.04 * h);
    const macro = alive(s, 'display').filter((a) => stats(a).cls === 'macro').reduce((a, x) => a + x.mass, 0);
    w.no3 -= w.no3 * Math.min(0.5, macro * 0.01 * h);
    w.po4 -= w.po4 * Math.min(0.5, macro * 0.01 * h);
    if (s.media.gfo > 0) { w.po4 = Math.max(0.005, w.po4 - 0.03 * Math.min(1, 250 / V) * h); s.media.gfo -= h; }
    w.org -= w.org * Math.min(0.9, (0.15 + e.skimmer + (s.media.carbon > 0 ? 0.25 : 0)) * h);
    if (s.media.carbon > 0) { w.cu -= w.cu * Math.min(0.5, 0.1 * h); s.media.carbon -= h; }
    w.cu = Math.max(0, w.cu - w.cu * 0.02 * h);
    // calcification
    let use = s.rockKg * 0.05;
    alive(s, 'display').forEach((a) => { const c = CALC[stats(a).cls]; if (c) use += c * a.mass * (a.health / 100); });
    const dk = use * h / V;
    w.kh = Math.max(0, w.kh - dk); w.ca = Math.max(0, w.ca - dk * 7.1); w.mg = Math.max(0, w.mg - dk * 0.6);
    // oxygen and pH
    const load = alive(s, 'display').reduce((a, x) => a + stats(x).wu, 0);
    const demand = (load * 4 + (s.det + (s.food || 0)) * 0.08 + w.org * 1.5 + s.alg.hair * 0.05) * (1 + (w.temp - 25) * 0.05) * (100 / V);
    const supply = Math.min(1, e.flowX / 12) * 0.55 + (e.skimmer > 0 ? 0.3 : 0) + 0.12;
    w.o2 = clamp(100 - demand / (0.35 + 1.6 * supply), 5, 100);
    w.ph = clamp(8.3 - (100 - w.o2) * 0.006 - Math.max(0, 7 - w.kh) * 0.1 + (w.kh > 12 ? 0.05 : 0), 7.2, 8.7);
    // algae
    const age = s.day - s.tank.filledDay;
    const nut = clamp((w.no3 - 0.5) / 5, 0, 2);
    const pf = clamp((w.po4 - 0.01) / 0.04, 0, 3);
    const lf = (e.par > 0 ? clamp(e.par / 200, 0.3, 1.5) : 0.2) * clamp(e.hours / 8, 0, 1.6);
    const a = s.alg;
    a.diatom += ((age < 50 ? 10 : 1) * Math.min(1, 0.3 + nut + pf) * lf * (1 - a.diatom / 100) - (age > 35 ? 4 : 0)) * h;
    a.hair += (3.5 * Math.min(nut, 1.5) * pf * lf * (1 - a.hair / 100) - (pf < 0.2 ? 3 : 0)) * h;
    a.cyano += (4 * clamp(w.org / 4, 0, 2) * (e.flowX < 10 ? 1.5 : 0.6) * (w.po4 > 0.03 ? 1 : 0.4) * lf * (1 - a.cyano / 100) - (w.org < 2 && e.flowX > 15 ? 4 : 0)) * h;
    let graze = 0;
    let sift = 0;
    alive(s, 'display').forEach((x) => { const st = stats(x); graze += st.graze * (x.health / 100); if (st.detritus) sift += 0.5; });
    graze *= (100 / V) * h;
    const g1 = Math.min(a.diatom, graze); a.diatom -= g1;
    a.hair -= Math.min(a.hair, (graze - g1) * 0.8);
    a.cyano -= Math.min(a.cyano, sift * (100 / V) * h);
    a.diatom = clamp(a.diatom, 0, 100); a.hair = clamp(a.hair, 0, 100); a.cyano = clamp(a.cyano, 0, 100);
    s.det = Math.max(0, s.det - sift * 0.3 * h);
    s.food = Math.max(0, (s.food || 0) - sift * 0.5 * h);
    // pests
    const p = s.pest;
    if (p.aiptasia > 0) {
      const eaters = alive(s, 'display').reduce((t, x) => t + stats(x).aipt, 0);
      p.aiptasia = clamp(p.aiptasia + p.aiptasia * 0.05 * (w.po4 > 0.05 ? 1.5 : 1) * h - eaters * 0.8 * h, 0, 400);
    }
    const clams = alive(s, 'display').some((x) => stats(x).cls === 'clam');
    if (p.pyramid > 0) {
      const eaters = alive(s, 'display').reduce((t, x) => t + stats(x).pestSnail, 0);
      p.pyramid = clamp(p.pyramid + (clams ? p.pyramid * 0.04 : -p.pyramid * 0.05) * h - eaters * 2 * h, 0, 200);
    }
    if (s.mission) s.mission.maxTemp = Math.max(s.mission.maxTemp, w.temp);
  }

  function addSupplement(s, k, ml) {
    const f = 100 / Math.max(1, s.w.level);
    if (k === 'kh') s.w.kh += ml / 10 * f;
    if (k === 'ca') s.w.ca += ml * 0.7 * f;
    if (k === 'mg') s.w.mg += ml * f;
  }

  /* ---------- animals ---------- */
  function stressOf(s, a, e) {
    const st = stats(a);
    const w = s.w;
    const out = {};
    const add = (k, v) => { if (v > 0.01) out[k] = (out[k] || 0) + v; };
    if (a.where === 'qt') {
      add('cu', range(s.qt.cu, P.fish.cu));
    } else {
      const tbl = P[st.cls] || P.invert;
      Object.keys(tbl).forEach((k) => add(k, range(k === 'temp' ? w.temp : k === 'sal' ? w.sal : w[k], tbl[k])));
      if (CALC[st.cls] && Math.abs(w.kh - w.khDay) > 1) add('khSwing', (Math.abs(w.kh - w.khDay) - 1) * 6);
      if (w.salDay != null && Math.abs(w.sal - w.salDay) > 1.5 && st.cls !== 'macro') add('salSwing', (Math.abs(w.sal - w.salDay) - 1.5) * (st.cls === 'fish' ? 5 : 9));
      if (st.light) {
        const lv = coralLight(s, e, a);
        const [lo, hi] = LIGHT[st.light];
        if (lv < lo) add('lightLow', (lo - lv) / (lo * 0.6) * 10);
        if (lv > hi) add('lightHigh', (lv - hi) / (hi * 0.5) * 10);
      }
      if (st.group === 'coral' && st.cls !== 'macro') {
        const [lo, hi] = FLOW[st.flow] || FLOW.medium;
        if (e.flowX < lo) add('flowLow', (lo - e.flowX) / lo * 5);
        if (e.flowX > hi) add('flowHigh', (e.flowX - hi) / hi * 4);
        if (s.alg.hair + s.alg.cyano > 60) add('smother', (s.alg.hair + s.alg.cyano - 60) / 40 * 6);
        if (s.pest.aiptasia > 20) add('aiptasia', s.pest.aiptasia / 40);
        if (a.zoaPest) add('zoaPest', 6);
      }
      if (st.cls === 'clam' && s.pest.pyramid > 0) add('pyramid', s.pest.pyramid / 10);
      if (s.tank && st.minTank && s.tank.net < st.minTank) add('small', 6 * (1 - s.tank.net / st.minTank));
      if (a.fight) add('fight', a.fight);
    }
    if (st.hunger && a.hunger > 60) add('hunger', (a.hunger - 60) / 40 * 8);
    if (a.inf) { if (a.inf.ich) add('ich', a.inf.ich * 20); if (a.inf.velvet) add('velvet', a.inf.velvet * 70); }
    if (a.hit) add(a.hit.k, a.hit.v);
    const tf = st.tol;
    Object.keys(out).forEach((k) => { out[k] /= tf; });
    return out;
  }
  function range(v, r) {
    if (!r || v == null) return 0;
    const [lo, hi, blo, bhi, wgt] = r;
    let x = 0;
    if (lo != null && v < lo) x = (lo - v) / Math.max(1e-6, lo - blo);
    if (hi != null && v > hi) x = (v - hi) / Math.max(1e-6, bhi - hi);
    return x > 0 ? wgt * Math.pow(x, 1.4) : 0;
  }

  function life(s, e, h, out) {
    const pods = e.fuge > 0;
    s.ani.forEach((a) => {
      const st = stats(a);
      if (!st) return;
      // hunger
      if (st.hunger) {
        let rate = st.hunger;
        if (st.cls === 'invert') {
          const food = (st.graze ? s.alg.diatom + s.alg.hair : 0) + (st.detritus ? s.det * 5 : 0);
          rate -= Math.min(rate * 1.2, food * 0.6);
        }
        if (st.graze && st.group === 'fish' && s.alg.hair > 10) rate -= 15;
        if (st.needsPods && pods) rate *= 0.3;
        a.hunger = clamp(a.hunger + rate * h, 0, 100);
      }
      // disease progress
      if (a.inf) {
        const load = a.where === 'qt' ? s.qt : s.dis;
        const cu = a.where === 'qt' ? s.qt.cu : s.w.cu;
        ['ich', 'velvet'].forEach((d) => {
          let v = a.inf[d] || 0;
          if (!v) return;
          v += v * ((d === 'ich' ? 0.1 : 0.22) - (d === 'ich' ? 0.07 : 0.03) * (a.health / 100) - (Object.keys(a.st || {}).length ? 0 : 0.02)) * h;
          if (v < 0.01) v = 0;
          if (cu >= 0.12) v -= 0.15 * h;
          load[d] = clamp(load[d] + v * 0.12 * h, 0, 1);
          a.inf[d] = clamp(v, 0, 1);
        });
      }
      const sts = stressOf(s, a, e);
      a.st = sts;
      const total = Object.values(sts).reduce((x, y) => x + y, 0);
      a.acc = a.acc || {};
      Object.keys(a.acc).forEach((k) => { a.acc[k] *= Math.exp(-0.7 * h); });
      Object.keys(sts).forEach((k) => { a.acc[k] = (a.acc[k] || 0) + sts[k] * h; });
      const rec = total < 1 && (!st.hunger || a.hunger < 60) ? 4 : 0;
      a.health = clamp(a.health - total * h + rec * h, 0, 100);
      if (a.hit) { a.hit.v -= 20 * h; if (a.hit.v <= 0) delete a.hit; }
      // growth
      if (st.growth && a.where === 'display') {
        const lightOk = !st.light || (!sts.lightLow && !sts.lightHigh) ? 1 : 0.3;
        const khOk = CALC[st.cls] && s.w.kh < 6.5 ? 0.3 : 1;
        a.mass = Math.min(6, a.mass + a.mass * st.growth * (a.health / 100) * lightOk * khOk * h);
      }
    });
    // infection spreads from the parasite load in the water
    ['ich', 'velvet'].forEach((d) => {
      [['display', s.dis, s.w.cu], ['qt', s.qt, s.qt.cu]].forEach(([where, load, cu]) => {
        load[d] -= load[d] * 0.065 * (where === 'display' && e.uv ? 1.6 : 1) * h;
        if (cu >= 0.12) load[d] -= Math.min(load[d], 0.3 * h);
        if (load[d] < 0.02) return;
        s.ani.filter((a) => a.where === where && stats(a).cls === 'fish').forEach((a) => {
          const st = stats(a);
          const susc = 0.5 + (st.ichChance || 0.12) * 2;
          const stressed = Object.keys(a.st || {}).length ? 1.5 : 1;
          a.inf = a.inf || {};
          a.inf[d] = clamp((a.inf[d] || 0) + load[d] * susc * stressed * (d === 'ich' ? 0.1 : 0.25) * h, 0, 1);
        });
      });
    });
    if (s.qt.cu >= 0.12 && s.ani.some((a) => a.where === 'qt')) s.qt.treat += h;
    s.qt.cu = Math.max(0, s.qt.cu - s.qt.cu * 0.03 * h);
    // deaths
    s.ani.filter((a) => a.health <= 0).forEach((a) => die(s, a, topCause(a), out));
  }
  function topCause(a) {
    const acc = a.acc || {};
    let best = 'unknown';
    let v = 0;
    Object.keys(acc).forEach((k) => { if (acc[k] > v) { v = acc[k]; best = k; } });
    return best;
  }
  function die(s, a, cause, out, extra) {
    const st = stats(a);
    s.ani = s.ani.filter((x) => x !== a);
    s.heaven.push({ sp: a.sp, uid: a.uid, name: a.name, from: a.added, to: Math.round(s.day * 10) / 10, cause, x: extra || {} });
    if (s.mission) { s.mission.deaths++; s.mission.lastDeath = s.day; }
    if (a.where === 'display' && s.w.level) {
      const mg = (st.wu || 0) * 4 + (st.group === 'coral' ? a.mass : 0) + (st.cls === 'clam' ? 8 : 0);
      s.w.nh3 += mg * 1.2 / s.w.level;
      s.det += mg * 0.5;
    }
    log(s, out, 'death', Object.assign({ sp: a.sp, cause, name: a.name }, extra || {}), 'bad');
  }

  /* ---------- daily: events, income, fights, predation ---------- */
  function daily(s, e, out) {
    const day = Math.floor(s.day);
    if (day > 0 && day % 7 === 0 && s.income) { s.money += s.income; log(s, out, 'income', { n: s.income }, 'good'); }
    (s.scripted || []).filter((x) => !x.done && day >= x.at).forEach((x) => { x.done = true; trigger(s, x.type, out, x); });
    if (!e) return;
    s.w.khDay = s.w.kh;
    s.w.salDay = s.w.sal;
    fights(s);
    const disp = alive(s, 'display');
    // predators
    disp.forEach((a) => {
      const st = stats(a);
      if (!st.predator) return;
      if (rnd(s) < 0.06 * st.predator) {
        const prey = disp.filter((x) => x !== a && stats(x).group === 'invertebrate' && SMALL_INVERT.includes(stats(x).category) && s.ani.includes(x));
        if (prey.length) die(s, pick(s, prey), 'eaten', out, { by: a.sp });
      }
      if (rnd(s) < 0.04 * st.predator) {
        const corals = disp.filter((x) => stats(x).group === 'coral' && s.ani.includes(x));
        if (corals.length) { const c = pick(s, corals); c.hit = { k: 'nipped', v: 20 }; log(s, out, 'nipped', { sp: c.sp, by: a.sp }, 'warn'); }
      }
    });
    // stinging corals
    const stingers = disp.filter((a) => stats(a).stinger);
    if (stingers.length && rnd(s) < 0.03) {
      const others = disp.filter((x) => stats(x).group === 'coral' && !stats(x).stinger);
      if (others.length) { const c = pick(s, others); c.hit = { k: 'stung', v: 25 }; log(s, out, 'stung', { sp: c.sp, by: stingers[0].sp }, 'warn'); }
    }
    // zoa pests spread
    const zoas = disp.filter((a) => stats(a).category === 'zoanthids');
    if (zoas.some((a) => a.zoaPest) && rnd(s) < 0.03) { const z = pick(s, zoas); z.zoaPest = true; }
    // jumping
    if (!e.lid) disp.filter((a) => stats(a).jumper).forEach((a) => { if (s.ani.includes(a) && rnd(s) < 0.008) die(s, a, 'jumped', out); });
    if (!s.opts.randomEvents) return;
    const r = () => rnd(s);
    if (powerOn(s) && r() < 0.003) trigger(s, 'power', out);
    s.eq.forEach((x) => {
      const k = CAT.eq[x.id].kind;
      if (x.state !== 'ok') return;
      if (k === 'heater' && r() < 0.004) trigger(s, 'heaterStuck', out, { uid: x.uid });
      if (k === 'pump' && r() < 0.003) trigger(s, 'pumpFail', out, { uid: x.uid });
      if (k === 'ato' && r() < 0.002) trigger(s, 'atoStuck', out, { uid: x.uid });
    });
    if (isSummer(s) && !(s.ev.heat && s.ev.heat.until > s.day) && r() < 0.04) trigger(s, 'heatwave', out);
    if (s.opts.time !== 'real' && !s.mission && day > 30 && !s.ev.holiday && r() < 0.01) trigger(s, 'holiday', out);
  }
  function trigger(s, type, out, x) {
    x = x || {};
    const ctrl = working(s, 'controller').length > 0;
    const eqOf = (kind) => (x.uid ? s.eq.find((q) => q.uid === x.uid) : s.eq.find((q) => CAT.eq[q.id].kind === kind && q.state === 'ok'));
    if (type === 'power') {
      const hours = 4 + Math.floor(rnd(s) * 9);
      s.ev.power = s.day + hours / 24;
      log(s, out, 'power', { h: hours, alarm: ctrl }, 'bad');
    } else if (type === 'heaterStuck') {
      const q = eqOf('heater');
      if (!q) return;
      q.state = ctrl ? 'broken' : 'stuck';
      log(s, out, ctrl ? 'heaterCut' : 'heaterStuck', { id: q.id, alarm: ctrl }, 'bad');
    } else if (type === 'pumpFail') {
      const q = eqOf('pump');
      if (!q) return;
      q.state = 'broken';
      log(s, out, 'pumpFail', { id: q.id, alarm: ctrl }, ctrl ? 'bad' : 'hidden');
    } else if (type === 'atoStuck') {
      const q = eqOf('ato');
      if (!q) return;
      q.state = ctrl ? 'broken' : 'stuck';
      log(s, out, ctrl ? 'atoCut' : 'atoStuck', { alarm: ctrl }, ctrl ? 'bad' : 'hidden');
    } else if (type === 'heatwave') {
      const days = x.days || 3 + Math.floor(rnd(s) * 6);
      s.ev.heat = { until: s.day + days, add: x.add || 5 + rnd(s) * 2 };
      log(s, out, 'heatwave', { days }, 'warn');
    } else if (type === 'holiday') {
      s.ev.holiday = { pending: true };
      log(s, out, 'holiday', {}, 'warn');
    } else if (type === 'pests') {
      Object.assign(s.pest, x.pests || {});
    }
  }
  function fights(s) {
    const disp = alive(s, 'display');
    const V = s.tank.net;
    disp.forEach((a) => { a.fight = 0; });
    const by = (f) => disp.filter((a) => f(stats(a), a));
    const tangs = by((st) => st.category === 'surgeonfish');
    if (tangs.length >= 2 && V < 400) tangs.forEach((a) => { a.fight += 5; });
    const clowns = by((st) => st.category === 'clownfish');
    const kinds = new Set(clowns.map((a) => a.sp));
    if (kinds.size >= 2) clowns.forEach((a) => { a.fight += 5; });
    else if (clowns.length > 2 && V < 200) clowns.forEach((a) => { a.fight += 3; });
    const dwarf = by((st, a) => a.sp.startsWith('centropyge'));
    if (dwarf.length >= 2 && V < 300) dwarf.forEach((a) => { a.fight += 4; });
    const big = by((st, a) => a.sp.startsWith('pomacanthus') || a.sp.startsWith('holacanthus'));
    if (big.length >= 2) big.forEach((a) => { a.fight += 6; });
    const dotty = by((st, a) => a.sp.startsWith('pseudochromis'));
    if (dotty.length >= 2) dotty.forEach((a) => { a.fight += 6; });
  }

  /* ---------- actions ---------- */
  const ok = (msg, x) => ({ ok: true, msg, x });
  const no = (err, x) => ({ ok: false, err, x });
  function addEq(s, id) {
    const it = CAT.eq[id];
    if (it.kind === 'rock') { s.rockKg += it.kg; if (it.live) { s.liveKg += it.kg; s.bac.a += it.kg * 0.6; s.bac.n += it.kg * 0.6; } return null; }
    const e = { uid: s.uid++, id, state: 'ok' };
    s.eq.push(e);
    return e;
  }
  function buy(s, id, out) {
    out = out || [];
    const t = CAT.tanks[id];
    const q = CAT.eq[id];
    const c = CAT.cons[id];
    const it = t || q || c;
    if (!it) return no('unknown');
    if (s.money < it.price) return no('money');
    if (t && s.tank) return no('haveTank');
    if (q && UNIQUE.includes(q.kind) && has(s, q.kind)) return no('have');
    grant(s, id);
    s.money -= it.price;
    log(s, out, 'bought', { id }, 'info');
    return ok('bought');
  }
  function grant(s, id) {
    const t = CAT.tanks[id];
    const q = CAT.eq[id];
    const c = CAT.cons[id];
    if (t) s.tank = { id, net: t.net, filled: false, filledDay: 0 };
    else if (q) {
      addEq(s, id);
      if (q.kind === 'rock' && q.live && s.tank && s.tank.filled && rnd(s) < 0.15) { s.pest.aiptasia += 3; }
    } else if (c) s.stock[c.item] = (s.stock[c.item] || 0) + c.amount;
  }
  // Starter packs: the listed items at a discount; unique equipment the player already owns is left out (and not charged).
  function packItems(s, id) {
    const p = CAT.packs[id];
    if (!p) return [];
    const kinds = new Set();
    return p.items.filter((x) => {
      const q = CAT.eq[x];
      if (!q || !UNIQUE.includes(q.kind)) return true;
      if (has(s, q.kind) || kinds.has(q.kind)) return false;
      kinds.add(q.kind);
      return true;
    });
  }
  const itemOf = (id) => CAT.tanks[id] || CAT.eq[id] || CAT.cons[id];
  function packPrice(s, id) {
    const p = CAT.packs[id];
    return Math.round(packItems(s, id).reduce((a, x) => a + itemOf(x).price, 0) * (1 - (p.discount || 0)));
  }
  function buyPack(s, id, out) {
    out = out || [];
    const p = CAT.packs[id];
    if (!p) return no('unknown');
    if (s.tank && p.items.some((x) => CAT.tanks[x])) return no('haveTank');
    const items = packItems(s, id);
    const price = packPrice(s, id);
    if (s.money < price) return no('money');
    items.forEach((x) => grant(s, x));
    s.money -= price;
    log(s, out, 'bought', { pack: id }, 'info');
    return ok('packBought', { items });
  }
  function fillTank(s, free) {
    if (!s.tank) return no('noTank');
    if (s.tank.filled) return no('filled');
    const need = s.tank.net * SAL0;
    if (!free && s.stock.salt < need) return no('salt', { g: need });
    if (!free) s.stock.salt -= need;
    const sal = free || has(s, 'refractometer') ? SAL0 : SAL0 - 4 + rnd(s) * 7;
    Object.assign(s.w, { level: s.tank.net, salt: s.tank.net * sal, sal, temp: roomTemp(s), nh3: 0, no2: 0, no3: 0, po4: 0, kh: FRESH.kh, ca: FRESH.ca, mg: FRESH.mg, khDay: FRESH.kh, salDay: sal, cu: 0, org: 0 });
    s.tank.filled = true;
    s.tank.filledDay = s.day;
    s.media.sock = s.day;
    return ok(has(s, 'refractometer') || free ? 'filled' : 'filledGuess');
  }
  function addAnimal(s, sp, where, place) {
    const st = CAT.species[sp];
    if (!st) return null;
    const a = { uid: s.uid++, sp, where: where || 'display', health: 100, hunger: 20, mass: 1, added: Math.round(s.day * 10) / 10, px: rnd(s), py: rnd(s) };
    if (st.group === 'coral') a.place = place || (st.light === 'high' ? 'top' : st.light === 'low' ? 'bottom' : 'middle');
    s.ani.push(a);
    return a;
  }
  function buyAnimal(s, sp, where, place, out) {
    out = out || [];
    const st = CAT.species[sp];
    if (!st) return no('unknown');
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (s.money < st.price) return no('money');
    if (where === 'qt' && (!has(s, 'qt') || st.cls !== 'fish')) return no('noQt');
    s.money -= st.price;
    const a = addAnimal(s, sp, where, place);
    const notes = [];
    if (st.cls === 'fish') {
      if (rnd(s) < st.ichChance) { a.inf = { ich: 0.06 }; }
      else if (rnd(s) < st.ichChance * 0.25) { a.inf = { velvet: 0.05 }; }
    }
    if (st.group === 'coral' || st.cls === 'clam' || st.cls === 'anemone') {
      const dip = s.stock.dip > 0 && st.group === 'coral';
      if (dip) { s.stock.dip -= 1; notes.push('dipped'); }
      if (!dip && rnd(s) < 0.06) s.pest.aiptasia += 2;
      if (st.category === 'zoanthids' && !dip && rnd(s) < 0.25) a.zoaPest = true;
      if (st.cls === 'clam' && rnd(s) < 0.15) s.pest.pyramid += 4;
    }
    log(s, out, 'added', { sp, where }, 'info');
    return ok('added', { uid: a.uid, notes });
  }
  function portion(s) {
    const disp = alive(s, 'display');
    const fishWu = disp.filter((a) => stats(a).cls === 'fish').reduce((t, a) => t + stats(a).wu, 0);
    const other = disp.filter((a) => ['invert', 'anemone'].includes(stats(a).cls)).reduce((t, a) => t + stats(a).wu, 0);
    const need = fishWu * 0.4 + other * 0.15;
    // With nobody to feed, a pinch is a pinch: it scales with the tank (and ghost feeding cycles the tank).
    return need > 0 ? Math.max(0.6, need) : Math.max(0.6, 0.03 * (s.w.level || 100));
  }
  // A feeding: hungry fish eat their share, scavengers the leftovers, the rest sinks as detritus.
  function feed(s, size, auto, neighbor) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (s.stock.food < 1) return no('noFood');
    s.stock.food -= 1;
    const V = s.w.level;
    const Q = portion(s) * ({ small: 0.5, normal: 1, large: 3 }[size] || 1);
    const sk = env(s).skimmer;
    const pods = env(s).fuge > 0;
    const fish = alive(s, 'display').filter((a) => stats(a).cls === 'fish');
    const dem = fish.map((a) => { const st = stats(a); const eat = st.needsPods && pods ? 1 : st.eat; return st.wu * eat * a.hunger / 100; });
    const D = dem.reduce((x, y) => x + y, 0);
    const E = Math.min(Q, D);
    fish.forEach((a, i) => { if (D > 0) a.hunger = clamp(a.hunger - (dem[i] / D) * E / stats(a).wu * 100, 0, 100); });
    let L = Q - E;
    alive(s, 'display').filter((a) => ['invert', 'anemone'].includes(stats(a).cls) && stats(a).hunger).forEach((a) => {
      const st = stats(a);
      const want = st.wu * a.hunger / 100;
      const got = Math.min(L, want * 0.5);
      L -= got;
      a.hunger = clamp(a.hunger - got / st.wu * 100, 0, 100);
    });
    s.ani.filter((a) => a.where === 'qt' && stats(a).cls === 'fish').forEach((a) => { a.hunger = clamp(a.hunger - 50 * stats(a).eat, 0, 100); });
    s.w.nh3 += (E + (Q - E - L)) * 1.2 * (1 - sk * 0.5) / V;
    s.w.po4 += E * 0.08 * (1 - sk * 0.6) / V;
    s.w.org += E * 0.05 * (100 / V);
    s.food = (s.food || 0) + L;
    s.lastFeed = s.day;
    if (!auto && !fish.length) { s.lastDose = s.day; s.doseKind = 'food'; }
    return ok(auto ? 'autoFed' : 'fed', { leftover: Q > 0 ? L / Q : 0, eaten: Q > 0 ? E / Q : 0 });
  }
  function coralFeed(s) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (s.stock.coralfood < 1) return no('noCoralFood');
    s.stock.coralfood -= 1;
    alive(s, 'display').filter((a) => ['nps', 'anemone', 'lps'].includes(stats(a).cls)).forEach((a) => { a.hunger = clamp(a.hunger - 60, 0, 100); });
    s.det += 0.4 * s.w.level / 100;
    return ok('coralFed');
  }
  const STEPS = {
    nh3: [0, 0.05, 0.1, 0.25, 0.5, 1, 2, 4], no2: [0, 0.05, 0.1, 0.25, 0.5, 1, 2, 5], no3: [0, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
    cu: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5]
  };
  const nearest = (v, arr) => arr.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  function measure(s, p, target) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (p === 'sal') {
      if (!has(s, 'refractometer')) return no('noRefracto');
      const v = Math.round((s.w.sal + (rnd(s) - 0.5) * 0.6) * 2) / 2;
      s.meas.push({ d: s.day, p, v });
      return ok('measured', { p, v });
    }
    const key = 'test:' + p;
    if (!(s.stock[key] > 0)) return no('noTest', { p });
    s.stock[key] -= 1;
    const tv = target === 'qt' ? (p === 'cu' ? s.qt.cu : null) : s.w[p];
    if (tv == null) return no('unknown');
    const n = (rnd(s) - 0.5) * 2;
    let v;
    if (STEPS[p]) v = nearest(Math.max(0, tv * (1 + n * (p === 'no3' ? 0.07 : 0.15))), STEPS[p]);
    else if (p === 'po4') v = Math.max(0, Math.round((tv + n * 0.01) * 100) / 100);
    else if (p === 'kh') v = Math.round((tv + n * 0.2) * 10) / 10;
    else if (p === 'ca') v = Math.round((tv + n * 10) / 5) * 5;
    else if (p === 'mg') v = Math.round((tv + n * 30) / 10) * 10;
    else if (p === 'ph') v = Math.round((tv + n * 0.05) * 10) / 10;
    const m = { d: s.day, p, v };
    if (target === 'qt') m.qt = true;
    s.meas.push(m);
    if (s.meas.length > 2000) s.meas.splice(0, s.meas.length - 2000);
    return ok('measured', { p, v });
  }
  function waterChange(s, pct) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    pct = clamp(pct, 0.05, 0.5);
    const L = s.w.level * pct;
    if (s.stock.salt < L * SAL0) return no('salt', { g: L * SAL0 });
    s.stock.salt -= L * SAL0;
    const sal = has(s, 'refractometer') ? SAL0 : SAL0 - 3 + rnd(s) * 6;
    const w = s.w;
    ['nh3', 'no2', 'no3', 'po4', 'cu', 'org'].forEach((k) => { w[k] *= 1 - pct; });
    ['kh', 'ca', 'mg'].forEach((k) => { w[k] = w[k] * (1 - pct) + FRESH[k] * pct; });
    w.salt = w.salt * (1 - pct) + L * sal;
    w.sal = w.salt / w.level;
    s.det *= Math.max(0, 1 - pct * 1.5);
    s.food = (s.food || 0) * Math.max(0, 1 - pct * 2);
    s.alg.cyano = Math.max(0, s.alg.cyano - pct * 60);
    s.alg.diatom = Math.max(0, s.alg.diatom - pct * 30);
    s.dis.ich *= 1 - pct * 0.3; s.dis.velvet *= 1 - pct * 0.3;
    s.lastWc = { d: s.day, pct };
    return ok('changed', { l: Math.round(L) });
  }
  function topOff(s) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (s.w.level >= s.tank.net) return no('full');
    const l = s.tank.net - s.w.level;
    s.w.level = s.tank.net;
    s.w.sal = s.w.salt / s.w.level;
    return ok('toppedOff', { l: Math.round(l * 10) / 10 });
  }
  function dose(s, k, ml) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    const key = 'add:' + k;
    if (!(s.stock[key] >= ml)) return no('noStock');
    s.stock[key] -= ml;
    addSupplement(s, k, ml);
    return ok('dosed');
  }
  function use(s, item, target) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (!(s.stock[item] > 0)) return no('noStock');
    const V = s.w.level;
    if (item === 'bacteria') { s.bac.a += 1.5 * V / 100; s.bac.n += 1.5 * V / 100; }
    else if (item === 'ammonia') { s.w.nh3 += 1; s.lastDose = s.day; s.doseKind = 'ammonia'; }
    else if (item === 'carbon') s.media.carbon = 30;
    else if (item === 'gfo') s.media.gfo = 60;
    else if (item === 'aiptasiax') s.pest.aiptasia = Math.max(0, s.pest.aiptasia - 10);
    else if (item === 'copper') {
      if (target === 'qt') { if (!has(s, 'qt')) return no('noQt'); s.qt.cu += 0.08; }
      else s.w.cu += 0.08;
    } else if (item === 'dip') {
      const c = s.ani.find((a) => a.uid === target);
      if (!c) return no('unknown');
      c.zoaPest = false;
    } else return no('unknown');
    s.stock[item] -= 1;
    return ok('used', { item });
  }
  function adjustSal(s, dir) {
    if (!s.tank || !s.tank.filled) return no('noWater');
    if (!has(s, 'refractometer')) return no('noRefracto');
    const g = s.w.level;
    if (dir > 0) {
      if (s.stock.salt < g) return no('salt', { g });
      s.stock.salt -= g;
      s.w.salt += g;
    } else s.w.salt = Math.max(0, s.w.salt - g);
    s.w.sal = s.w.salt / s.w.level;
    return ok(dir > 0 ? 'salUp' : 'salDown');
  }
  function changeSock(s) {
    if (!has(s, 'sock')) return no('noSock');
    s.media.sock = s.day;
    return ok('sockChanged');
  }
  function move(s, uid, to) {
    const a = s.ani.find((x) => x.uid === uid);
    if (!a) return no('unknown');
    if (to === 'qt' && (!has(s, 'qt') || stats(a).cls !== 'fish')) return no('noQt');
    if (a.where === to) return no('same');
    a.where = to;
    if (to === 'display' && a.inf) { ['ich', 'velvet'].forEach((d) => { if (a.inf[d] > 0.01) s.dis[d] = Math.max(s.dis[d], a.inf[d] * 0.5); }); }
    return ok('moved');
  }
  function rehome(s, uid) {
    const a = s.ani.find((x) => x.uid === uid);
    if (!a) return no('unknown');
    s.ani = s.ani.filter((x) => x !== a);
    return ok('rehomed');
  }
  function repair(s, uid) {
    const e = s.eq.find((x) => x.uid === uid);
    if (!e || e.state === 'ok') return no('unknown');
    const cost = Math.round(CAT.eq[e.id].price * 0.4);
    if (s.money < cost) return no('money');
    s.money -= cost;
    e.state = 'ok';
    return ok('repaired', { cost });
  }
  function holiday(s, choice) {
    if (!s.ev.holiday || !s.ev.holiday.pending) return no('unknown');
    if (choice === 'feeder' && !working(s, 'feeder').length) return no('noFeeder');
    if (choice === 'neighbor') { if (s.money < 40) return no('money'); s.money -= 40; }
    s.ev.holiday = { until: s.day + 7, choice };
    return ok('away');
  }

  /* ---------- reading the state ---------- */
  function lastMeas(s, p, opt) {
    for (let i = s.meas.length - 1; i >= 0; i--) {
      const m = s.meas[i];
      if (m.p === p && !!m.qt === !!(opt && opt.qt)) return m;
    }
    return null;
  }
  // Symptoms an aquarist could see; on "hard" these are all the player gets.
  function symptoms(s, a) {
    const st = a.st || {};
    const out = [];
    const keys = Object.keys(st).sort((x, y) => st[y] - st[x]).filter((k) => st[k] > 0.5);
    keys.slice(0, 3).forEach((k) => out.push(k));
    if (a.inf && a.inf.ich > 0.05 && !out.includes('ich')) out.push('ich');
    if (a.inf && a.inf.velvet > 0.05 && !out.includes('velvet')) out.push('velvet');
    return out;
  }
  // Advisor (easy): hints from the true state, without giving the numbers away.
  function advice(s) {
    const out = [];
    if (!s.tank) return ['buyTank'];
    if (!s.tank.filled) { if (s.stock.salt < s.tank.net * SAL0) out.push('buySalt'); if (!has(s, 'refractometer')) out.push('buyRefracto'); out.push('fill'); return out; }
    const e = env(s);
    if (!has(s, 'heater')) out.push('noHeater');
    if (!s.eq.some((x) => CAT.eq[x.id].kind === 'pump')) out.push('noFlow');
    if (s.rockKg < s.tank.net * 0.05) out.push('noRock');
    const ani = s.ani;
    const sum = {};
    ani.forEach((a) => Object.keys(a.st || {}).forEach((k) => { sum[k] = (sum[k] || 0) + a.st[k]; }));
    ['nh3', 'no2', 'o2', 'temp', 'sal', 'cu', 'hunger', 'no3', 'po4', 'kh', 'ca', 'mg', 'ph', 'lightLow', 'lightHigh', 'flowLow', 'flowHigh', 'ich', 'velvet', 'fight', 'small', 'smother', 'aiptasia', 'zoaPest', 'pyramid', 'khSwing']
      .forEach((k) => { if (sum[k] > 0.5) out.push('s.' + k); });
    if (!ani.length && s.day - s.tank.filledDay < 25 && s.bac.a < 0.5 * s.w.level / 10) out.push('cycle');
    if (ani.length && s.bac.a < 0.3 * s.w.level / 10) out.push('notCycled');
    if (s.w.level < s.tank.net * 0.97 && !working(s, 'ato').length) out.push('topOff');
    if (has(s, 'sock') && s.day - s.media.sock > 7) out.push('sock');
    if (s.alg.hair > 30 || s.alg.cyano > 30) out.push('algae');
    if (s.pest.aiptasia > 10) out.push('aiptasia');
    if (s.eq.some((x) => x.state !== 'ok')) out.push('broken');
    if (!powerOn(s)) out.push('power');
    if (s.stock.food < 5 && ani.some((a) => stats(a).cls === 'fish')) out.push('food');
    if (ani.some((a) => stats(a).group === 'coral' && stats(a).light) && !e.par) out.push('noLight');
    return [...new Set(out)];
  }
  function cycled(s) {
    return !!(s.tank && s.tank.filled && s.w.nh3 <= 0.05 && s.w.no2 <= 0.2 && s.bac.a >= 0.5 * s.w.level / 10);
  }
  function match(s, a, f) {
    const st = stats(a);
    if (!st) return false;
    if (f.where && a.where !== f.where) return false;
    if (!f.where && a.where !== 'display') return false;
    if (f.group && st.group !== f.group) return false;
    if (f.category && st.category !== f.category) return false;
    if (f.cls && [].concat(f.cls).indexOf(st.cls) < 0) return false;
    if (f.utility && !st.util.includes(f.utility)) return false;
    if (f.sp && a.sp !== f.sp) return false;
    return true;
  }
  function goalDone(s, g) {
    const m = s.mission || { stepStart: 0, deaths: 0 };
    const meas = (p) => s.meas.filter((x) => x.p === p && !x.qt && x.d >= m.stepStart);
    const recent = (p, within) => { const l = lastMeas(s, p, { qt: g.qt }); return l && s.day - l.d <= (within || 3) ? l : null; };
    switch (g.type) {
      case 'tank': return !!s.tank;
      case 'filled': return !!(s.tank && s.tank.filled);
      case 'has': return g.kinds.every((k) => working(s, k).length > 0);
      case 'rock': return s.rockKg >= g.kg;
      case 'measured': return meas(g.p).length >= (g.n || 1);
      case 'cycled': {
        if (!cycled(s) || !s.tank || s.day - s.tank.filledDay < 10) return false;
        const a = recent('nh3', 3); const b = recent('no2', 3); const c = recent('no3', 7);
        return !!(a && b && c && a.v <= 0.05 && b.v <= 0.1 && c.v > 0);
      }
      case 'stock': return s.ani.filter((a) => match(s, a, g.filter || {})).length >= (g.n || 1);
      // A death restarts the count instead of blocking the step for good.
      case 'keep': return s.day - Math.max(m.stepStart, m.lastDeath == null ? -1e9 : m.lastDeath) >= g.days && (!g.max || m.maxTemp <= g.max);
      case 'range': { const l = recent(g.p, g.within || 3); return !!(l && (g.lo == null || l.v >= g.lo) && (g.hi == null || l.v <= g.hi)); }
      case 'qtFish': return s.ani.filter((a) => stats(a).cls === 'fish').every((a) => a.where === 'qt') && s.ani.some((a) => a.where === 'qt');
      case 'copperDays': return s.qt.treat >= g.days;
      case 'noDisease': return s.ani.filter((a) => stats(a).cls === 'fish').every((a) => a.where === 'display' && (!a.inf || ((a.inf.ich || 0) < 0.02 && (a.inf.velvet || 0) < 0.02))) && s.dis.ich < 0.02 && s.dis.velvet < 0.02;
      case 'algaeBelow': return s.alg.hair + s.alg.cyano <= g.v;
      case 'aiptasiaBelow': return s.pest.aiptasia <= g.n;
      default: return false;
    }
  }
  // Advances the mission when the current step's goals are all met; returns true when the mission is complete.
  function missionCheck(s, mission, out) {
    if (!s.mission || s.mission.done || !mission) return false;
    let moved = false;
    while (s.mission.step < mission.steps.length && mission.steps[s.mission.step].goals.every((g) => goalDone(s, g))) {
      s.mission.step++;
      s.mission.stepStart = s.day;
      s.mission.deaths = 0;
      s.mission.maxTemp = s.w.temp;
      moved = true;
      log(s, out || [], 'stepDone', { n: s.mission.step }, 'good');
    }
    if (s.mission.step >= mission.steps.length) { s.mission.done = true; log(s, out || [], 'missionDone', {}, 'good'); return true; }
    return moved;
  }

  const api = {
    init, speciesStats, newGame, applySetup, step, env, roomTemp, buy, buyAnimal, fillTank, feed, coralFeed, measure, waterChange, topOff, dose, use,
    changeSock, adjustSal, move, rehome, repair, holiday, buyPack, packItems, packPrice, lastMeas, symptoms, advice, cycled, goalDone, missionCheck, coralLight, portion,
    get CAT() { return CAT; }, TESTS, LIGHT, FLOW, SAL0, UNIQUE
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReefSim = api;
})(typeof window !== 'undefined' ? window : globalThis);
