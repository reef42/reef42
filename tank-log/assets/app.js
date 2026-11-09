/* Tank Log – saltwater aquarium parameter log. Static, browser-storage only. */
(() => {
  'use strict';

  const STORE_KEY = 'reef42-tanklog-v1';
  const TIMER_KEY = 'reef42-tanklog-timers';
  const LANG_KEY = 'reef42-lang';
  const DAY = 86400000;

  // 30 s steps up to 5 min, then 1 min steps up to 15 min
  const PRESETS = [];
  for (let s = 30; s <= 300; s += 30) PRESETS.push(s);
  for (let m = 6; m <= 15; m++) PRESETS.push(m * 60);

  const CATALOG = {
    temp: { en: 'Temperature', hu: 'Hőmérséklet', unit: '°C' },
    sal: { en: 'Salinity', hu: 'Sótartalom', unit: 'ppt' },
    ph: { en: 'pH', hu: 'pH', unit: '' },
    kh: { en: 'Alkalinity (KH)', hu: 'Karbonátkeménység (KH)', unit: 'dKH' },
    ca: { en: 'Calcium (Ca)', hu: 'Kalcium (Ca)', unit: 'ppm' },
    mg: { en: 'Magnesium (Mg)', hu: 'Magnézium (Mg)', unit: 'ppm' },
    no3: { en: 'Nitrate (NO₃)', hu: 'Nitrát (NO₃)', unit: 'ppm' },
    po4: { en: 'Phosphate (PO₄)', hu: 'Foszfát (PO₄)', unit: 'ppm' },
    nh3: { en: 'Ammonia (NH₃/NH₄)', hu: 'Ammónia (NH₃/NH₄)', unit: 'ppm' },
    no2: { en: 'Nitrite (NO₂)', hu: 'Nitrit (NO₂)', unit: 'ppm' },
    k: { en: 'Potassium (K)', hu: 'Kálium (K)', unit: 'ppm' },
    i: { en: 'Iodine (I)', hu: 'Jód (I)', unit: 'ppm' },
    sr: { en: 'Strontium (Sr)', hu: 'Stroncium (Sr)', unit: 'ppm' },
    si: { en: 'Silicate (Si)', hu: 'Szilikát (Si)', unit: 'ppm' },
    fe: { en: 'Iron (Fe)', hu: 'Vas (Fe)', unit: 'ppm' },
    cu: { en: 'Copper (Cu)', hu: 'Réz (Cu)', unit: 'ppm' },
    orp: { en: 'ORP', hu: 'Redoxpotenciál (ORP)', unit: 'mV' }
  };
  const BASIC = ['temp', 'sal', 'ph', 'kh', 'ca', 'mg', 'no3', 'po4'];

  const BUILTIN_TEMPLATES = [
    { id: 'b-mixed', name: { en: 'Mixed reef', hu: 'Vegyes korallos' }, p: { temp: [24.5, 26.5], sal: [34, 35.5], ph: [7.9, 8.4], kh: [7, 9], ca: [400, 450], mg: [1250, 1400], no3: [5, 50], po4: [0.06, 0.3] } },
    { id: 'b-sps', name: { en: 'SPS dominant', hu: 'SPS-domináns' }, p: { temp: [25, 26.5], sal: [34.5, 35.5], ph: [7.9, 8.4], kh: [7, 8.5], ca: [420, 450], mg: [1300, 1400], no3: [2, 10], po4: [0.02, 0.08], k: [380, 420] } },
    { id: 'b-lps', name: { en: 'LPS / soft corals', hu: 'LPS / lágykorallok' }, p: { temp: [24.5, 26.5], sal: [34, 35.5], ph: [7.9, 8.4], kh: [8, 10], ca: [400, 450], mg: [1250, 1400], no3: [5, 50], po4: [0.06, 0.3] } },
    { id: 'b-fowlr', name: { en: 'Fish only (FOWLR)', hu: 'Csak halas (FOWLR)' }, p: { temp: [24, 26.5], sal: [33, 35.5], ph: [7.9, 8.4], kh: [7, 11], no3: [0, 40], po4: [0, 0.5], nh3: [0, 0.05], no2: [0, 0.2] } },
    { id: 'b-qt', name: { en: 'Quarantine tank', hu: 'Karantén' }, p: { temp: [24, 26.5], sal: [33, 35.5], ph: [7.9, 8.4], nh3: [0, 0.05], no2: [0, 0.2], no3: [0, 40], cu: [null, null] } },
    { id: 'b-empty', name: { en: 'Basic parameters, no ranges', hu: 'Alap paraméterek, tartomány nélkül' }, p: { temp: [null, null], sal: [null, null], ph: [null, null], kh: [null, null], ca: [null, null], mg: [null, null], no3: [null, null], po4: [null, null] } }
  ];

  const TEXT = {
    en: {
      toggle: 'magyar', tank: 'Tank', defaultTank: 'My reef',
      measure: 'Measure', charts: 'Charts', history: 'History', guide: 'Guide', settings: 'Settings',
      gIdeal: 'Ideal', gTol: 'Tolerable', gWhat: 'What it is', gWhy: 'Why it matters', gStep: 'Safe rate of change',
      gRaise: 'How to raise', gLower: 'How to lower', gSources: 'Where it comes from, what uses it', gTip: 'Testing tip',
      gYours: 'Your target', gLast: 'Last reading', gInTank: 'Parameters of this tank', gOther: 'Other parameters',
      gAdd: '+ Add to this tank', gAdded: 'Added to the tank', gOpen: 'About {name}', gLoadErr: 'The guide could not be loaded. Check the connection and reload the page.',
      last: 'last', noPrev: 'no previous value', ok: 'in range', low: 'low', high: 'high',
      time: 'Measured at', note: 'Note', notePh: 'e.g. 20% water change, new coral, dosing changed…',
      save: 'Save', saved: 'Saved', nothing: 'Enter at least one value or a note.', invalid: 'Not a valid number',
      share: 'Share', timer: 'Timer', timerFor: 'Timer – {name}', custom: 'Custom', min: 'min', sec: 'sec',
      start: 'Start', stop: 'Stop timer', done: 'Done', timerHint: 'The last used time is remembered for this parameter. Keep the page open – on phones the screen is kept awake while a timer runs.',
      timerEnded: '{name}: time is up', cancel: 'Cancel', close: 'Close', del: 'Delete', edit: 'Edit',
      p30: '30 days', p90: '90 days', p365: '1 year', pall: 'All',
      noData: 'No measurements yet.', noDataPeriod: 'No data in this period.', enlarge: 'Enlarge', shrink: 'Shrink',
      date: 'Date', confirmDelSession: 'Delete this measurement?', editSession: 'Edit measurement',
      noParams: 'This tank has no visible parameters. Add some in Settings.',
      tankSec: 'Tank', name: 'Name', volume: 'Volume (L)', newTank: 'New tank', delTank: 'Delete tank',
      confirmDelTank: 'Delete “{name}” and all of its measurements?', lastTank: 'At least one tank is needed.',
      template: 'Template', create: 'Create',
      paramsSec: 'Parameters & target ranges', unit: 'Unit', minL: 'Min', maxL: 'Max', shown: 'Shown',
      up: 'Move up', down: 'Move down', remove: 'Remove',
      confirmRemove: 'Remove “{name}” and its recorded values? (Untick “Shown” to hide it but keep the data.)',
      addParam: '+ Add parameter', addParamTitle: 'Add parameter', customParam: 'Custom parameter', add: 'Add',
      nameRequired: 'Name is required', paramsHelp: 'Values outside Min–Max are flagged. Leave a bound empty if you do not need it.',
      templatesSec: 'Range templates',
      templatesHelp: 'Applying a template sets the target ranges of the current tank. Missing parameters are added, others are left alone.',
      apply: 'Apply', confirmApply: 'Apply “{name}” to “{tank}”? Matching ranges are overwritten.',
      saveTemplate: 'Save current ranges as template', templateName: 'Template name', myTemplates: 'My templates', builtin: 'Built-in',
      dataSec: 'Data & backup',
      storageInfo: 'Your data is stored only in this browser on this device – nothing is uploaded. Clearing site data, private browsing, or (on iPhone/iPad Safari) not opening the page for 7 days can delete it. Export a backup regularly; you can import it on any device.',
      lastBackup: 'Last backup: {when}', never: 'never',
      exportJson: 'Export backup (JSON)', exportCsv: 'Export tank as CSV', importJson: 'Import backup…',
      importTitle: 'Import backup', importBody: 'The file contains {tanks} tank(s) and {sessions} measurement(s). Importing replaces all current data in this browser.',
      replace: 'Replace everything', imported: 'Imported', badFile: 'This is not a valid Tank Log backup.',
      alImport: 'Import from Aquarium Log (CSV)…', alTitle: 'Import from Aquarium Log',
      alSummary: '{m} readings of {p} parameters and {n} notes, {from} – {to}.',
      alBadRows: '{n} row(s) could not be read and will be skipped.', alTarget: 'Import into', alNewTank: 'New tank…',
      alDefaultName: 'Imported tank', alGo: 'Import',
      alHint: 'Select the measurements CSV and the notes CSV of one tank together. Readings taken within 3 hours become one entry; notes are added to that day’s entry. Values already in the tank are skipped.',
      alDone: '{s} entries imported, {d} duplicates skipped', alBad: 'No Aquarium Log data found in the selected files.',
      clearAll: 'Delete all data', confirmClear: 'Delete all tanks and measurements from this browser? This cannot be undone.',
      backupNever: 'You have not exported a backup yet – your data lives only in this browser.',
      backupOld: 'Last backup was {n} days ago – your data lives only in this browser.', backupNow: 'Back up now',
      storageFail: 'This browser blocks storage (e.g. private mode). Your entries will be lost when the page is closed.',
      shareTitle: 'Share values', shareNative: 'Share…', copyText: 'Copy text', copyLink: 'Copy read-only link',
      linkPeriod: 'Link includes', copied: 'Copied', copyFail: 'Copying failed – select the text and copy it manually.',
      linkInfo: 'The link carries the data itself (nothing is uploaded). Anyone who has it can view the values.',
      sharedBanner: 'Read-only snapshot shared with you', saveShared: 'Save as my tank', backToMine: 'My tanks',
      sharedBad: 'This shared link is broken or incomplete.', latest: 'Latest values', sharedSaved: 'Saved as a new tank',
      feedback: 'feedback and ideas:', localOnly: 'data is stored only in your browser',
      langLabel: 'Language', confirm: 'Confirm', running: 'Running timers', valuesOf: 'Values', measured: 'measured'
    },
    hu: {
      toggle: 'english', tank: 'Akvárium', defaultTank: 'Saját akvárium',
      measure: 'Mérés', charts: 'Grafikonok', history: 'Előzmények', guide: 'Útmutató', settings: 'Beállítások',
      gIdeal: 'Ideális', gTol: 'Tolerálható', gWhat: 'Mi ez?', gWhy: 'Miért számít?', gStep: 'Biztonságos változtatás',
      gRaise: 'Növelése', gLower: 'Csökkentése', gSources: 'Honnan kerül a vízbe, mi fogyasztja?', gTip: 'Mérési tipp',
      gYours: 'Saját cél', gLast: 'Utolsó mérés', gInTank: 'Ennek az akváriumnak a paraméterei', gOther: 'További paraméterek',
      gAdd: '+ Hozzáadás az akváriumhoz', gAdded: 'Hozzáadva az akváriumhoz', gOpen: '{name} – útmutató', gLoadErr: 'Az útmutatót nem sikerült betölteni. Ellenőrizd a kapcsolatot, és töltsd újra az oldalt.',
      last: 'előző', noPrev: 'nincs előző érték', ok: 'tartományban', low: 'alacsony', high: 'magas',
      time: 'Mérés ideje', note: 'Jegyzet', notePh: 'pl. 20% vízcsere, új korall, adagolás módosítva…',
      save: 'Mentés', saved: 'Mentve', nothing: 'Adj meg legalább egy értéket vagy jegyzetet.', invalid: 'Érvénytelen szám',
      share: 'Megosztás', timer: 'Időzítő', timerFor: 'Időzítő – {name}', custom: 'Egyedi', min: 'perc', sec: 'mp',
      start: 'Indítás', stop: 'Időzítő leállítása', done: 'Kész', timerHint: 'Az utoljára használt időt megjegyzi ennél a paraméternél. Hagyd nyitva az oldalt – telefonon futó időzítő alatt nem alszik el a képernyő.',
      timerEnded: '{name}: lejárt az idő', cancel: 'Mégse', close: 'Bezárás', del: 'Törlés', edit: 'Szerkesztés',
      p30: '30 nap', p90: '90 nap', p365: '1 év', pall: 'Mind',
      noData: 'Még nincs mérés.', noDataPeriod: 'Ebben az időszakban nincs adat.', enlarge: 'Nagyítás', shrink: 'Kicsinyítés',
      date: 'Dátum', confirmDelSession: 'Törlöd ezt a mérést?', editSession: 'Mérés szerkesztése',
      noParams: 'Ennek az akváriumnak nincs látható paramétere. A Beállításokban adhatsz hozzá.',
      tankSec: 'Akvárium', name: 'Név', volume: 'Térfogat (l)', newTank: 'Új akvárium', delTank: 'Akvárium törlése',
      confirmDelTank: 'Törlöd a(z) „{name}” akváriumot és minden mérését?', lastTank: 'Legalább egy akváriumnak lennie kell.',
      template: 'Sablon', create: 'Létrehozás',
      paramsSec: 'Paraméterek és céltartományok', unit: 'Mértékegység', minL: 'Min.', maxL: 'Max.', shown: 'Látható',
      up: 'Feljebb', down: 'Lejjebb', remove: 'Eltávolítás',
      confirmRemove: 'Eltávolítod: „{name}”, a rögzített értékeivel együtt? (Ha csak elrejtenéd, vedd ki a „Látható” pipát – az adatok megmaradnak.)',
      addParam: '+ Paraméter hozzáadása', addParamTitle: 'Paraméter hozzáadása', customParam: 'Egyedi paraméter', add: 'Hozzáadás',
      nameRequired: 'A név kötelező', paramsHelp: 'A Min.–Max. tartományon kívüli értékeket jelöli. Ha valamelyik határ nem kell, hagyd üresen.',
      templatesSec: 'Tartománysablonok',
      templatesHelp: 'A sablon beállítja az aktuális akvárium céltartományait. A hiányzó paramétereket hozzáadja, a többihez nem nyúl.',
      apply: 'Alkalmaz', confirmApply: 'Alkalmazod a(z) „{name}” sablont erre: „{tank}”? Az egyező tartományok felülíródnak.',
      saveTemplate: 'Jelenlegi tartományok mentése sablonként', templateName: 'Sablon neve', myTemplates: 'Saját sablonok', builtin: 'Beépített',
      dataSec: 'Adatok és biztonsági mentés',
      storageInfo: 'Az adatok csak ebben a böngészőben, ezen az eszközön tárolódnak – semmi sem kerül feltöltésre. A webhelyadatok törlése, a privát böngészés, vagy (iPhone/iPad Safarin) ha 7 napig nem nyitod meg az oldalt, törölheti őket. Exportálj rendszeresen mentést; bármelyik eszközön visszatöltheted.',
      lastBackup: 'Utolsó mentés: {when}', never: 'még nem volt',
      exportJson: 'Mentés exportálása (JSON)', exportCsv: 'Akvárium exportálása CSV-be', importJson: 'Mentés importálása…',
      importTitle: 'Mentés importálása', importBody: 'A fájlban {tanks} akvárium és {sessions} mérés van. Az importálás felülírja a böngészőben lévő összes mostani adatot.',
      replace: 'Minden felülírása', imported: 'Importálva', badFile: 'Ez nem érvényes Tank Log mentés.',
      alImport: 'Importálás Aquarium Logból (CSV)…', alTitle: 'Importálás Aquarium Logból',
      alSummary: '{m} mérés {p} paraméterből és {n} jegyzet, időszak: {from} – {to}',
      alBadRows: '{n} sort nem sikerült beolvasni, ezek kimaradnak.', alTarget: 'Hová', alNewTank: 'Új akvárium…',
      alDefaultName: 'Importált akvárium', alGo: 'Importálás',
      alHint: 'Egy akvárium mérés- és jegyzet-CSV-jét együtt válaszd ki. A 3 órán belüli mérések egy bejegyzésbe kerülnek, a jegyzetek az adott napi bejegyzéshez. Az akváriumban már meglévő értékeket kihagyja.',
      alDone: '{s} bejegyzés importálva, {d} ismétlődés kihagyva', alBad: 'A kiválasztott fájlokban nincs Aquarium Log adat.',
      clearAll: 'Minden adat törlése', confirmClear: 'Törlöd az összes akváriumot és mérést ebből a böngészőből? Ez nem vonható vissza.',
      backupNever: 'Még nem exportáltál mentést – az adataid csak ebben a böngészőben vannak.',
      backupOld: 'Az utolsó mentés {n} napja volt – az adataid csak ebben a böngészőben vannak.', backupNow: 'Mentés most',
      storageFail: 'Ez a böngésző tiltja a tárolást (pl. privát mód). A bevitt adatok az oldal bezárásakor elvesznek.',
      shareTitle: 'Értékek megosztása', shareNative: 'Megosztás…', copyText: 'Szöveg másolása', copyLink: 'Csak olvasható link másolása',
      linkPeriod: 'A link tartalma', copied: 'Másolva', copyFail: 'A másolás nem sikerült – jelöld ki és másold kézzel.',
      linkInfo: 'A link magában hordozza az adatokat (semmi sem kerül feltöltésre). Akinek megvan, megnézheti az értékeket.',
      sharedBanner: 'Veled megosztott, csak olvasható pillanatkép', saveShared: 'Mentés saját akváriumként', backToMine: 'Saját akváriumaim',
      sharedBad: 'Ez a megosztott link hibás vagy hiányos.', latest: 'Legutóbbi értékek', sharedSaved: 'Új akváriumként elmentve',
      feedback: 'visszajelzés, ötletek:', localOnly: 'az adatok csak a böngésződben tárolódnak',
      langLabel: 'Nyelv', confirm: 'Megerősítés', running: 'Futó időzítők', valuesOf: 'Értékek', measured: 'mérve'
    }
  };

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const round = (x) => Math.round(x * 10000) / 10000;

  function ls(get, key, val) {
    try {
      if (get) return localStorage.getItem(key);
      localStorage.setItem(key, val);
      return true;
    } catch (e) { return get ? null : false; }
  }

  let lang = new URLSearchParams(location.search).get('lang') || ls(true, LANG_KEY) ||
    ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
  if (lang !== 'hu') lang = 'en';
  const t = (k, vars) => {
    let s = (TEXT[lang] && TEXT[lang][k]) || TEXT.en[k] || k;
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  };
  const locale = () => (lang === 'hu' ? 'hu-HU' : 'en-GB');

  function parseNum(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return null;
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }
  function fmtNum(v, max = 4) {
    if (v == null || !isFinite(v)) return '–';
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: max, useGrouping: false }).format(v);
  }
  function fmtDelta(d) {
    if (d === 0) return '±0';
    return (d > 0 ? '+' : '−') + fmtNum(Math.abs(d));
  }
  function fmtDateTime(ms) {
    return new Intl.DateTimeFormat(locale(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ms);
  }
  function fmtDate(ms, withYear) {
    const o = { month: 'short', day: 'numeric' };
    if (withYear) o.year = 'numeric';
    return new Intl.DateTimeFormat(locale(), o).format(ms);
  }
  function ago(ms) {
    const diff = ms - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto', style: 'short' });
    if (abs < 3600000) return rtf.format(Math.round(diff / 60000), 'minute');
    if (abs < DAY) return rtf.format(Math.round(diff / 3600000), 'hour');
    if (abs < 60 * DAY) return rtf.format(Math.round(diff / DAY), 'day');
    return rtf.format(Math.round(diff / (30 * DAY)), 'month');
  }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function toLocalInput(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function fromLocalInput(s) {
    const ms = new Date(s).getTime();
    return isFinite(ms) ? ms : null;
  }

  /* ---------- state ---------- */
  function newParam(key, extra) {
    const c = CATALOG[key];
    return Object.assign({ id: uid(), key: c ? key : null, name: '', unit: c ? c.unit : '', min: null, max: null, timer: null, hidden: false }, extra || {});
  }
  function pname(p) {
    if (p.name) return p.name;
    const c = CATALOG[p.key];
    return c ? (c[lang] || c.en) : '?';
  }
  function templateList() {
    const user = (S.templates || []).map((tp) => ({ id: tp.id, user: true, label: tp.name, p: tp.p }));
    const builtin = BUILTIN_TEMPLATES.map((tp) => ({
      id: tp.id, user: false, label: tp.name[lang] || tp.name.en,
      p: Object.keys(tp.p).map((key) => ({ key, unit: CATALOG[key].unit, min: tp.p[key][0], max: tp.p[key][1] }))
    }));
    return builtin.concat(user);
  }
  function applyTemplate(tank, tpl) {
    tpl.p.forEach((e) => {
      let p = e.key ? tank.params.find((x) => x.key === e.key) : null;
      if (!p && e.name) p = tank.params.find((x) => pname(x).toLowerCase() === e.name.toLowerCase());
      if (p) {
        p.min = e.min; p.max = e.max;
        if (e.unit != null && !e.key) p.unit = e.unit;
        p.hidden = false;
      } else {
        tank.params.push(newParam(e.key, { name: e.key ? '' : e.name, unit: e.unit != null ? e.unit : '', min: e.min, max: e.max }));
      }
    });
  }
  function makeTank(name, tplId) {
    const tank = { id: uid(), name, volume: null, params: [], created: Date.now() };
    const tpl = templateList().find((x) => x.id === tplId) || templateList()[0];
    applyTemplate(tank, tpl);
    return tank;
  }
  function normalize(d) {
    const out = { v: 1, tanks: [], sessions: [], templates: [], active: null, lastBackup: d.lastBackup || null, lastChange: d.lastChange || null };
    (d.tanks || []).forEach((tk) => {
      if (!tk || !tk.id) return;
      out.tanks.push({
        id: String(tk.id), name: String(tk.name || 'Tank'), volume: tk.volume == null ? null : Number(tk.volume) || null, created: tk.created || Date.now(),
        params: (tk.params || []).filter((p) => p && p.id).map((p) => ({
          id: String(p.id), key: CATALOG[p.key] ? p.key : null, name: p.name ? String(p.name) : '', unit: p.unit == null ? '' : String(p.unit),
          min: numOrNull(p.min), max: numOrNull(p.max), timer: numOrNull(p.timer), hidden: !!p.hidden
        }))
      });
    });
    const ids = new Set(out.tanks.map((x) => x.id));
    (d.sessions || []).forEach((s) => {
      if (!s || !ids.has(String(s.tankId)) || !isFinite(Number(s.t))) return;
      const v = {};
      for (const k in (s.v || {})) { const n = Number(s.v[k]); if (isFinite(n)) v[k] = n; }
      out.sessions.push({ id: String(s.id || uid()), tankId: String(s.tankId), t: Number(s.t), v, note: s.note ? String(s.note) : '' });
    });
    (d.templates || []).forEach((tp) => {
      if (tp && tp.id && Array.isArray(tp.p)) out.templates.push({ id: String(tp.id), name: String(tp.name || '?'), p: tp.p.map((e) => ({ key: CATALOG[e.key] ? e.key : null, name: e.name ? String(e.name) : '', unit: e.unit == null ? null : String(e.unit), min: numOrNull(e.min), max: numOrNull(e.max) })) });
    });
    out.active = ids.has(d.active) ? d.active : (out.tanks[0] && out.tanks[0].id);
    return out;
  }
  function numOrNull(v) { if (v === null || v === undefined || v === '') return null; const n = Number(v); return isFinite(n) ? n : null; }

  let S;
  let storageOk = true;
  function load() {
    const raw = ls(true, STORE_KEY);
    if (raw) {
      try {
        const d = normalize(JSON.parse(raw));
        if (d.tanks.length) return d;
      } catch (e) { /* fall through */ }
    }
    return null;
  }
  function freshState() {
    S = { v: 1, tanks: [], sessions: [], templates: [], active: null, lastBackup: null, lastChange: null };
    const tank = makeTank(t('defaultTank'), 'b-mixed');
    S.tanks.push(tank);
    S.active = tank.id;
  }
  let persistAsked = false;
  function save() {
    S.lastChange = Date.now();
    storageOk = ls(false, STORE_KEY, JSON.stringify(S));
    if (!persistAsked && navigator.storage && navigator.storage.persist) {
      persistAsked = true;
      navigator.storage.persist().catch(() => {});
    }
    renderBanner();
  }
  const activeTank = () => S.tanks.find((x) => x.id === S.active) || S.tanks[0];
  const tankSessions = (tank, list) => (list || S.sessions).filter((s) => s.tankId === tank.id).sort((a, b) => a.t - b.t);

  function lastValues(params, sessions) {
    const out = {};
    for (let i = sessions.length - 1; i >= 0; i--) {
      const s = sessions[i];
      params.forEach((p) => {
        if (!out[p.id] && s.v[p.id] != null) out[p.id] = { v: s.v[p.id], t: s.t };
      });
    }
    return out;
  }

  function status(p, v) {
    if (v == null || !isFinite(v)) return null;
    if (p.min != null && v < p.min) return 'low';
    if (p.max != null && v > p.max) return 'high';
    if (p.min == null && p.max == null) return 'none';
    return 'ok';
  }
  function dist(p, v) {
    if (p.min != null && v < p.min) return p.min - v;
    if (p.max != null && v > p.max) return v - p.max;
    return 0;
  }
  function rangeText(p) {
    if (p.min != null && p.max != null) return fmtNum(p.min) + '–' + fmtNum(p.max);
    if (p.min != null) return '≥ ' + fmtNum(p.min);
    if (p.max != null) return '≤ ' + fmtNum(p.max);
    return '';
  }
  function stIcon(st) {
    if (!st || st === 'none') return '';
    return '<span class="st st-' + st + ' icon" title="' + esc(t(st)) + '" aria-label="' + esc(t(st)) + '">' + (st === 'ok' ? '✓' : st === 'low' ? '↓' : '↑') + '</span>';
  }
  function stBadge(st) {
    if (!st || st === 'none') return '';
    const icon = st === 'ok' ? '✓' : st === 'low' ? '↓' : '↑';
    return '<span class="st st-' + st + '">' + icon + ' ' + esc(t(st)) + '</span>';
  }

  /* ---------- UI shell ---------- */
  const app = $('#app');
  let draft = { tankId: null, vals: {}, note: '', time: null };
  let chartPeriod = 90;
  const wide = new Set();

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (h.startsWith('shared/')) return { view: 'shared', data: h.slice(7) };
    const parts = h.split('/');
    const v = parts[0];
    return { view: ['measure', 'charts', 'history', 'guide', 'settings'].includes(v) ? v : 'measure', key: parts[1] || null };
  }

  function renderChrome() {
    document.documentElement.lang = lang;
    $('#langToggle').textContent = t('toggle');
    $('#langToggle').setAttribute('lang', lang === 'hu' ? 'en' : 'hu');
    $('#langToggle').setAttribute('aria-label', t('langLabel'));
    $('#tankLabel').textContent = t('tank');
    const sel = $('#tankSelect');
    sel.innerHTML = S.tanks.map((tk) => '<option value="' + esc(tk.id) + '"' + (tk.id === S.active ? ' selected' : '') + '>' + esc(tk.name) + '</option>').join('');
    const r = route();
    sel.parentElement.hidden = r.view === 'shared';
    $('#tabs').innerHTML = ['measure', 'charts', 'history', 'guide', 'settings'].map((v) =>
      '<a href="#/' + v + '"' + (r.view === v ? ' aria-current="page"' : '') + '>' + esc(t(v)) + '</a>').join('');
    $('#footer').innerHTML = '<div class="inner"><span>reef42 · Tank Log – ' + esc(t('localOnly')) + '</span><span>' + esc(t('feedback')) +
      ' <a href="mailto:info.reef42@gmail.com">info.reef42@gmail.com</a></span></div>';
  }

  function renderBanner() {
    const b = $('#banner');
    if (!storageOk) {
      b.className = 'banner warn';
      b.innerHTML = '<div class="inner">' + esc(t('storageFail')) + '</div>';
      b.hidden = false;
      return;
    }
    b.hidden = true;
  }

  function render() {
    renderChrome();
    renderBanner();
    const r = route();
    if (r.view === 'shared') renderShared(r.data);
    else if (r.view === 'charts') renderCharts();
    else if (r.view === 'history') renderHistory();
    else if (r.view === 'guide') renderGuide(r.key);
    else if (r.view === 'settings') renderSettings();
    else renderMeasure();
    renderDock();
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ---------- modal ---------- */
  function modal(title, bodyHtml, actions, onOpen) {
    return new Promise((resolve) => {
      const d = document.createElement('dialog');
      d.className = 'modal';
      d.innerHTML = '<form method="dialog"><header><h2>' + esc(title) + '</h2><button type="button" class="x" aria-label="' + esc(t('close')) + '">×</button></header>' +
        '<div class="mbody">' + bodyHtml + '</div>' +
        (actions && actions.length ? '<footer>' + actions.map((a) => '<button value="' + esc(a.value) + '" class="btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '') + '">' + esc(a.label) + '</button>').join('') + '</footer>' : '') +
        '</form>';
      document.body.appendChild(d);
      let result = '';
      d.addEventListener('click', (e) => {
        if (e.target === d || e.target.closest('.x')) { d.close(''); return; }
        const b = e.target.closest('button[value]');
        if (b) result = b.value;
      });
      // Enter in a text field triggers the primary action instead of the first button
      d.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.type === 'button') return;
        e.preventDefault();
        const primary = d.querySelector('footer .primary') || d.querySelector('.mbody .btn.primary');
        if (primary) primary.click();
      });
      d.addEventListener('close', () => {
        const val = d.returnValue || result || '';
        resolve({ value: val, el: d });
        setTimeout(() => d.remove(), 0);
      });
      d.showModal();
      if (onOpen) onOpen(d, (v) => { result = v; d.close(v); });
    });
  }
  async function confirmBox(text, okLabel, danger) {
    const r = await modal(t('confirm'), '<p>' + esc(text) + '</p>', [
      { label: t('cancel'), value: '' }, { label: okLabel, value: 'ok', primary: !danger, danger: !!danger }]);
    return r.value === 'ok';
  }

  /* ---------- measure view ---------- */
  function renderMeasure() {
    const tank = activeTank();
    if (draft.tankId !== tank.id) draft = { tankId: tank.id, vals: {}, note: '', time: null };
    const params = tank.params.filter((p) => !p.hidden);
    const sessions = tankSessions(tank);
    const last = lastValues(params, sessions);
    let html = backupNudge(sessions.length);
    html += '<div class="vhead"><h1>' + esc(tank.name) + '</h1>' +
      (sessions.length ? '<button class="btn" type="button" data-act="share">' + esc(t('share')) + '</button>' : '') + '</div>';
    if (!params.length) html += '<p class="empty">' + esc(t('noParams')) + '</p>';
    html += '<div class="rows">' + params.map((p) => rowHtml(p, last[p.id])).join('') + '</div>';
    html += '<div class="extra">' +
      '<label class="field"><span>' + esc(t('time')) + '</span><input type="datetime-local" id="mTime" value="' + toLocalInput(draft.time || Date.now()) + '"></label>' +
      '<label class="field grow"><span>' + esc(t('note')) + '</span><textarea id="mNote" rows="2" placeholder="' + esc(t('notePh')) + '">' + esc(draft.note) + '</textarea></label>' +
      '</div>';
    html += '<div class="savebar"><button class="btn primary big" type="button" data-act="save">' + esc(t('save')) + '</button></div>';
    app.innerHTML = html;
    params.forEach((p) => updateRow(p, last[p.id]));
  }

  function backupNudge(count) {
    if (count < 5) return '';
    const days = S.lastBackup ? Math.floor((Date.now() - S.lastBackup) / DAY) : null;
    if (days != null && days < 30) return '';
    const msg = days == null ? t('backupNever') : t('backupOld', { n: days });
    return '<div class="nudge"><span>' + esc(msg) + '</span><button class="btn small" type="button" data-act="exportJson">' + esc(t('backupNow')) + '</button></div>';
  }

  function rowHtml(p, prev) {
    const unit = p.unit ? ' <span class="unit">' + esc(p.unit) + '</span>' : '';
    const rt = rangeText(p);
    return '<div class="prow" data-pid="' + esc(p.id) + '">' +
      '<div class="phead"><label class="pname" for="in-' + esc(p.id) + '">' + esc(pname(p)) + unit + '</label>' +
      (p.key ? '<a class="ginfo" href="#/guide/' + esc(p.key) + '" aria-label="' + esc(t('gOpen', { name: pname(p) })) + '" title="' + esc(t('gOpen', { name: pname(p) })) + '">i</a>' : '') +
      (rt ? '<span class="range" title="' + esc(t('minL') + '–' + t('maxL')) + '">' + esc(rt) + '</span>' : '') +
      '<div class="tslot" data-tslot="' + esc(p.id) + '">' + timerSlotHtml(activeTank().id, p) + '</div></div>' +
      '<div class="pbody">' +
      '<input class="pin" id="in-' + esc(p.id) + '" data-pid="' + esc(p.id) + '" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" value="' + esc(draft.vals[p.id] || '') + '" placeholder="' + esc(prev ? fmtNum(prev.v) : '') + '">' +
      '<div class="pinfo"><div class="prev">' + (prev
        ? esc(t('last')) + ': <b>' + esc(fmtNum(prev.v)) + '</b> ' + stIcon(status(p, prev.v)) + ' <span class="ago">' + esc(ago(prev.t)) + '</span>'
        : '<span class="muted">' + esc(t('noPrev')) + '</span>') + '</div>' +
      '<div class="delta" data-delta></div></div></div>' +
      (p.min != null && p.max != null && p.max > p.min ? '<div class="gauge" data-gauge aria-hidden="true"><span class="band"></span><span class="mk prev"></span><span class="mk now"></span></div>' : '') +
      '</div>';
  }

  function updateRow(p, prev) {
    const row = app.querySelector('.prow[data-pid="' + CSS.escape(p.id) + '"]');
    if (!row) return;
    const raw = draft.vals[p.id] || '';
    const n = parseNum(raw);
    const input = $('.pin', row);
    const dEl = $('[data-delta]', row);
    input.classList.toggle('bad', Number.isNaN(n));
    let html = '';
    if (Number.isNaN(n)) html = '<span class="err">' + esc(t('invalid')) + '</span>';
    else if (n != null) {
      const st = status(p, n);
      let cls = 'neutral';
      if (st === 'ok') cls = 'good';
      else if (st === 'low' || st === 'high') cls = prev && dist(p, n) < dist(p, prev.v) ? 'warn' : 'bad';
      if (prev) {
        const d = round(n - prev.v);
        const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '=';
        html += '<span class="dchip ' + cls + '">' + arrow + ' ' + esc(fmtDelta(d)) + '</span> ';
      }
      html += stBadge(st);
    }
    dEl.innerHTML = html;
    row.dataset.state = n != null && !Number.isNaN(n) ? (status(p, n) || '') : '';
    const g = $('[data-gauge]', row);
    if (g) {
      const w = p.max - p.min;
      let lo = p.min - w * 0.6;
      const hi = p.max + w * 0.6;
      if (p.min >= 0 && lo < 0) lo = 0;
      const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
      const band = $('.band', g);
      band.style.left = pos(p.min) + '%';
      band.style.width = (pos(p.max) - pos(p.min)) + '%';
      const mp = $('.mk.prev', g);
      const mn = $('.mk.now', g);
      mp.hidden = !prev;
      if (prev) mp.style.left = pos(prev.v) + '%';
      mn.hidden = n == null || Number.isNaN(n);
      if (!mn.hidden) {
        mn.style.left = pos(n) + '%';
        mn.dataset.st = status(p, n);
      }
    }
  }

  function saveMeasurement() {
    const tank = activeTank();
    const params = tank.params.filter((p) => !p.hidden);
    const v = {};
    let any = false;
    for (const p of params) {
      const n = parseNum(draft.vals[p.id]);
      if (Number.isNaN(n)) {
        const el = $('#in-' + CSS.escape(p.id));
        if (el) el.focus();
        toast(t('invalid'));
        return;
      }
      if (n != null) { v[p.id] = n; any = true; }
    }
    const note = (draft.note || '').trim();
    if (!any && !note) { toast(t('nothing')); return; }
    const time = draft.time || Date.now();
    S.sessions.push({ id: uid(), tankId: tank.id, t: time, v, note });
    save();
    draft = { tankId: tank.id, vals: {}, note: '', time: null };
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast(t('saved'));
  }

  /* ---------- timers ---------- */
  const timers = {}; // key -> {tankId, pid, dur, end, ringing, gain}
  let actx = null;
  let tickHandle = null;
  let wakeLock = null;
  const baseTitle = document.title;

  function timerKey(tankId, pid) { return tankId + ':' + pid; }
  function findParam(tankId, pid) {
    const tk = S.tanks.find((x) => x.id === tankId);
    return tk ? tk.params.find((p) => p.id === pid) : null;
  }
  function timerSlotHtml(tankId, p) {
    const tm = timers[timerKey(tankId, p.id)];
    const name = esc(pname(p));
    if (tm && tm.ringing) return '<button type="button" class="tbtn ring" data-act="tack" data-pid="' + esc(p.id) + '">⏰ ' + esc(t('done')) + '</button>';
    if (tm) return '<button type="button" class="tbtn run" data-act="tstop" data-pid="' + esc(p.id) + '" aria-label="' + esc(t('stop')) + ' – ' + name + '"><span data-tdisp="' + esc(timerKey(tankId, p.id)) + '">' + fmtDur((tm.end - Date.now()) / 1000) + '</span> ■</button>';
    if (p.timer) {
      return '<span class="tgroup"><button type="button" class="tbtn" data-act="tstart" data-pid="' + esc(p.id) + '" aria-label="' + esc(t('start')) + ' ' + fmtDur(p.timer) + ' – ' + name + '">⏱ ' + fmtDur(p.timer) + '</button>' +
        '<button type="button" class="tmore" data-act="tpick" data-pid="' + esc(p.id) + '" aria-label="' + esc(t('timerFor', { name: pname(p) })) + '">▾</button></span>';
    }
    return '<button type="button" class="tbtn idle" data-act="tpick" data-pid="' + esc(p.id) + '" aria-label="' + esc(t('timerFor', { name: pname(p) })) + '">⏱ ' + esc(t('timer')) + '</button>';
  }
  function refreshTimerSlot(tankId, pid) {
    if (tankId !== S.active) return;
    const slot = app.querySelector('[data-tslot="' + CSS.escape(pid) + '"]');
    const p = findParam(tankId, pid);
    if (slot && p) slot.innerHTML = timerSlotHtml(tankId, p);
  }

  function ensureAudio() {
    try {
      if (!actx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        actx = new C();
      }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { return null; }
    return actx;
  }
  function scheduleBeeps(tm) {
    if (!actx) return;
    unscheduleBeeps(tm);
    const gain = actx.createGain();
    gain.gain.value = 0.12;
    gain.connect(actx.destination);
    const start = actx.currentTime + Math.max(0.05, (tm.end - Date.now()) / 1000);
    for (let s = 0; s < 25; s++) {
      for (let b = 0; b < 3; b++) {
        const o = actx.createOscillator();
        o.type = 'square';
        o.frequency.value = 1900;
        o.connect(gain);
        const at = start + s * 1.4 + b * 0.2;
        o.start(at);
        o.stop(at + 0.11);
      }
    }
    tm.gain = gain;
  }
  function unscheduleBeeps(tm) {
    if (tm.gain) {
      try { tm.gain.disconnect(); } catch (e) { /* ignore */ }
      tm.gain = null;
    }
  }
  function persistTimers() {
    const list = Object.values(timers).map((x) => ({ tankId: x.tankId, pid: x.pid, dur: x.dur, end: x.end }));
    try { localStorage.setItem(TIMER_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }
  function restoreTimers() {
    try {
      const list = JSON.parse(localStorage.getItem(TIMER_KEY) || '[]');
      list.forEach((x) => {
        if (!findParam(x.tankId, x.pid)) return;
        if (Date.now() - x.end > 5 * 60000) return; // long expired
        timers[timerKey(x.tankId, x.pid)] = { tankId: x.tankId, pid: x.pid, dur: x.dur, end: x.end, ringing: false, gain: null };
      });
    } catch (e) { /* ignore */ }
    if (Object.keys(timers).length) ensureTick();
  }
  function startTimer(tankId, pid, dur) {
    ensureAudio();
    const k = timerKey(tankId, pid);
    if (timers[k]) stopTimer(k, true);
    const tm = { tankId, pid, dur, end: Date.now() + dur * 1000, ringing: false, gain: null };
    timers[k] = tm;
    scheduleBeeps(tm);
    const p = findParam(tankId, pid);
    if (p && p.timer !== dur) { p.timer = dur; save(); }
    persistTimers();
    ensureTick();
    refreshTimerSlot(tankId, pid);
    renderDock();
    updateWakeLock();
  }
  function stopTimer(k, silent) {
    const tm = timers[k];
    if (!tm) return;
    unscheduleBeeps(tm);
    delete timers[k];
    persistTimers();
    if (!silent) {
      refreshTimerSlot(tm.tankId, tm.pid);
      renderDock();
      updateWakeLock();
      updateTitle();
    }
  }
  function ensureTick() {
    if (!tickHandle) tickHandle = setInterval(tick, 250);
    tick();
  }
  function tick() {
    const keys = Object.keys(timers);
    if (!keys.length) { clearInterval(tickHandle); tickHandle = null; return; }
    const now = Date.now();
    keys.forEach((k) => {
      const tm = timers[k];
      if (!tm.ringing && now >= tm.end) {
        tm.ringing = true;
        tm.rangAt = now;
        if (!tm.gain && ensureAudio() && actx.state === 'running') scheduleBeeps(tm);
        if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
        refreshTimerSlot(tm.tankId, tm.pid);
        renderDock();
        updateTitle();
        const p = findParam(tm.tankId, tm.pid);
        if (p) toast(t('timerEnded', { name: pname(p) }));
      } else if (tm.ringing && now - tm.rangAt > 120000) {
        stopTimer(k);
      } else if (tm.ringing && navigator.vibrate && now - tm.rangAt < 30000 && now - (tm.vibAt || tm.rangAt) >= 3000) {
        tm.vibAt = now;
        navigator.vibrate([300, 150, 300]);
      }
    });
    $$('[data-tdisp]').forEach((el) => {
      const tm = timers[el.dataset.tdisp];
      if (tm && !tm.ringing) el.textContent = fmtDur((tm.end - now) / 1000);
    });
    if (Object.values(timers).some((x) => x.ringing)) {
      document.title = (Math.floor(now / 700) % 2 ? '⏰ ' : '🔔 ') + baseTitle;
    }
  }
  function updateTitle() {
    if (!Object.values(timers).some((x) => x.ringing)) document.title = baseTitle;
  }
  async function updateWakeLock() {
    if (!('wakeLock' in navigator)) return;
    const need = Object.keys(timers).length > 0;
    try {
      if (need && !wakeLock && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!need && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (e) { /* not allowed */ }
  }
  function renderDock() {
    const dock = $('#dock');
    const list = Object.entries(timers);
    if (!list.length) { dock.hidden = true; dock.innerHTML = ''; return; }
    dock.hidden = false;
    dock.setAttribute('aria-label', t('running'));
    dock.innerHTML = list.map(([k, tm]) => {
      const p = findParam(tm.tankId, tm.pid);
      const tk = S.tanks.find((x) => x.id === tm.tankId);
      const label = (S.tanks.length > 1 && tk ? tk.name + ' · ' : '') + (p ? pname(p) : '?');
      return '<button type="button" class="dchip-t' + (tm.ringing ? ' ring' : '') + '" data-act="' + (tm.ringing ? 'tack' : 'tstop') + '" data-key="' + esc(k) + '">' +
        '<span class="dl">' + esc(label) + '</span> ' +
        (tm.ringing ? '⏰ ' + esc(t('done')) : '<span data-tdisp="' + esc(k) + '">' + fmtDur((tm.end - Date.now()) / 1000) + '</span> ■') + '</button>';
    }).join('');
  }

  async function pickTimer(tankId, pid) {
    const p = findParam(tankId, pid);
    if (!p) return;
    const chips = PRESETS.map((s) => '<button type="button" class="chip' + (p.timer === s ? ' on' : '') + '" data-sec="' + s + '">' + fmtDur(s) + '</button>').join('');
    const cm = p.timer && !PRESETS.includes(p.timer) ? Math.floor(p.timer / 60) : '';
    const cs = p.timer && !PRESETS.includes(p.timer) ? p.timer % 60 : '';
    const body = '<div class="chips">' + chips + '</div>' +
      '<fieldset class="custom"><legend>' + esc(t('custom')) + '</legend>' +
      '<label><input type="number" min="0" max="180" inputmode="numeric" id="cMin" value="' + cm + '"> ' + esc(t('min')) + '</label>' +
      '<label><input type="number" min="0" max="59" inputmode="numeric" id="cSec" value="' + cs + '"> ' + esc(t('sec')) + '</label>' +
      '<button type="button" class="btn primary" id="cGo">' + esc(t('start')) + '</button></fieldset>' +
      '<p class="hint">' + esc(t('timerHint')) + '</p>';
    let chosen = null;
    await modal(t('timerFor', { name: pname(p) }), body, [], (d, close) => {
      ensureAudio();
      d.addEventListener('click', (e) => {
        const c = e.target.closest('[data-sec]');
        if (c) { chosen = Number(c.dataset.sec); close('go'); }
        if (e.target.id === 'cGo') {
          const sec = (Number($('#cMin', d).value) || 0) * 60 + (Number($('#cSec', d).value) || 0);
          if (sec > 0) { chosen = sec; close('go'); }
        }
      });
    });
    if (chosen) startTimer(tankId, pid, chosen);
  }

  /* ---------- charts ---------- */
  function niceTicks(lo, hi, count) {
    const span = hi - lo || 1;
    const step0 = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(round(v));
    return out;
  }

  function drawChart(el, pts, p) {
    const big = el.classList.contains('big');
    const W = Math.max(240, el.clientWidth || 300);
    const H = big ? 300 : 170;
    const m = { l: 44, r: 12, t: 12, b: 24 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    let x0 = pts[0].t;
    let x1 = pts[pts.length - 1].t;
    if (x1 - x0 < DAY) { x0 -= DAY / 2; x1 += DAY / 2; }
    const vals = pts.map((d) => d.v);
    if (p.min != null) vals.push(p.min);
    if (p.max != null) vals.push(p.max);
    let y0 = Math.min.apply(null, vals);
    let y1 = Math.max.apply(null, vals);
    const pad = (y1 - y0) * 0.12 || Math.abs(y1) * 0.1 || 1;
    y0 -= pad; y1 += pad;
    if (y0 < 0 && Math.min.apply(null, vals) >= 0) y0 = 0;
    const X = (v) => m.l + ((v - x0) / (x1 - x0)) * iw;
    const Y = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
    const ticks = niceTicks(y0, y1, big ? 6 : 4).filter((v) => v >= y0 && v <= y1);
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(pname(p)) + '">';
    ticks.forEach((v) => {
      svg += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/>' +
        '<text class="ax" x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + esc(fmtNum(v)) + '</text>';
    });
    if (p.min != null || p.max != null) {
      const ra = p.max != null ? Math.min(Y(p.max), m.t + ih) : m.t;
      const rb = p.min != null ? Math.max(Y(p.min), m.t) : m.t + ih;
      const top = Math.max(m.t, Math.min(ra, rb));
      const bot = Math.min(m.t + ih, Math.max(ra, rb));
      if (bot > top) svg += '<rect class="band" x="' + m.l + '" width="' + iw + '" y="' + top + '" height="' + (bot - top) + '"/>';
      if (p.min != null) svg += '<line class="bandedge" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(p.min) + '" y2="' + Y(p.min) + '"/>';
      if (p.max != null) svg += '<line class="bandedge" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(p.max) + '" y2="' + Y(p.max) + '"/>';
    }
    const withYear = new Date(x0).getFullYear() !== new Date(x1).getFullYear();
    const xt = big ? 5 : 3;
    for (let i = 0; i < xt; i++) {
      const tv = x0 + ((x1 - x0) * i) / (xt - 1);
      const anchor = i === 0 ? 'start' : i === xt - 1 ? 'end' : 'middle';
      svg += '<text class="ax" x="' + X(tv) + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">' + esc(fmtDate(tv, withYear)) + '</text>';
    }
    svg += '<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + (m.t + ih) + '" y2="' + (m.t + ih) + '"/>';
    if (pts.length > 1) svg += '<path class="line" d="' + pts.map((d, i) => (i ? 'L' : 'M') + X(d.t).toFixed(1) + ' ' + Y(d.v).toFixed(1)).join('') + '"/>';
    pts.forEach((d) => {
      const st = status(p, d.v);
      svg += '<circle class="pt' + (st === 'low' || st === 'high' ? ' out' : '') + (d.note ? ' noted' : '') + '" cx="' + X(d.t).toFixed(1) + '" cy="' + Y(d.v).toFixed(1) + '" r="4"/>';
    });
    svg += '<line class="cross" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ih) + '" visibility="hidden"/>' +
      '<circle class="hl" r="6" cx="0" cy="0" visibility="hidden"/>' +
      '<rect class="hit" x="' + m.l + '" y="0" width="' + iw + '" height="' + H + '"/></svg>' +
      '<div class="tip" hidden></div>';
    el.innerHTML = svg;

    const hit = $('.hit', el);
    const cross = $('.cross', el);
    const hl = $('.hl', el);
    const tip = $('.tip', el);
    const svgEl = $('svg', el);
    function show(evt) {
      const rect = svgEl.getBoundingClientRect();
      const mx = ((evt.clientX - rect.left) / rect.width) * W;
      let best = 0;
      let bd = Infinity;
      pts.forEach((d, i) => { const dd = Math.abs(X(d.t) - mx); if (dd < bd) { bd = dd; best = i; } });
      const d = pts[best];
      const cx = X(d.t);
      const cy = Y(d.v);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      hl.setAttribute('cx', cx); hl.setAttribute('cy', cy); hl.setAttribute('visibility', 'visible');
      const prevPt = pts[best - 1];
      tip.innerHTML = '<div class="tt">' + esc(fmtDateTime(d.t)) + '</div><div class="tv"><b>' + esc(fmtNum(d.v)) + '</b> ' + esc(p.unit || '') + ' ' + stBadge(status(p, d.v)) + '</div>' +
        (prevPt ? '<div class="td">' + esc(fmtDelta(round(d.v - prevPt.v))) + '</div>' : '') +
        (d.note ? '<div class="tn">' + esc(d.note) + '</div>' : '');
      tip.hidden = false;
      const px = (cx / W) * rect.width;
      const tw = tip.offsetWidth;
      let left = px + 12;
      if (left + tw > rect.width) left = px - tw - 12;
      tip.style.left = Math.max(0, left) + 'px';
      tip.style.top = Math.max(0, (cy / H) * rect.height - 20) + 'px';
    }
    function hide() {
      cross.setAttribute('visibility', 'hidden');
      hl.setAttribute('visibility', 'hidden');
      tip.hidden = true;
    }
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
  }

  function chartCardsHtml(tank) {
    const params = tank.params.filter((p) => !p.hidden);
    return '<div class="cgrid">' + params.map((p) => {
      const isWide = wide.has(p.id);
      return '<article class="ccard' + (isWide ? ' wide' : '') + '" data-pid="' + esc(p.id) + '">' +
        '<header><h3>' + esc(pname(p)) + (p.unit ? ' <span class="unit">' + esc(p.unit) + '</span>' : '') + '</h3>' +
        '<button type="button" class="iconbtn" data-act="wide" data-pid="' + esc(p.id) + '" aria-label="' + esc(isWide ? t('shrink') : t('enlarge')) + '" title="' + esc(isWide ? t('shrink') : t('enlarge')) + '">' + (isWide ? '⤡' : '⤢') + '</button></header>' +
        '<div class="csub"><span class="cl" data-latest></span>' +
        (rangeText(p) ? '<span class="crange">' + esc(t('minL') + '–' + t('maxL')) + ': ' + esc(rangeText(p)) + '</span>' : '') + '</div>' +
        '<div class="chart' + (isWide ? ' big' : '') + '" data-chart="' + esc(p.id) + '"></div></article>';
    }).join('') + '</div>';
  }

  function drawAllCharts(tank, sessions) {
    const to = Date.now();
    const from = chartPeriod ? to - chartPeriod * DAY : null;
    let shown = 0;
    tank.params.filter((p) => !p.hidden).forEach((p) => {
      const el = app.querySelector('[data-chart="' + CSS.escape(p.id) + '"]');
      if (!el) return;
      const pts = sessions.filter((s) => s.v[p.id] != null && (from == null || s.t >= from)).map((s) => ({ t: s.t, v: s.v[p.id], note: s.note }));
      const card = el.closest('.ccard');
      const latest = $('[data-latest]', card);
      const lastPt = pts[pts.length - 1];
      latest.innerHTML = lastPt ? '<b>' + esc(fmtNum(lastPt.v)) + '</b> ' + stBadge(status(p, lastPt.v)) : '';
      // Parameters without values in the period would only add empty cards
      card.hidden = !pts.length;
      if (!pts.length) { el.innerHTML = ''; return; }
      shown++;
      drawChart(el, pts, p);
    });
    const grid = app.querySelector('.cgrid');
    let empty = app.querySelector('.cgrid-empty');
    if (!shown && grid && !empty) {
      empty = document.createElement('p');
      empty.className = 'empty cgrid-empty';
      empty.textContent = t('noDataPeriod');
      grid.after(empty);
    } else if (shown && empty) empty.remove();
  }

  function periodChips() {
    return '<div class="chips period" role="group">' + [[30, 'p30'], [90, 'p90'], [365, 'p365'], [0, 'pall']].map(([d, k]) =>
      '<button type="button" class="chip' + (chartPeriod === d ? ' on' : '') + '" data-act="period" data-days="' + d + '" aria-pressed="' + (chartPeriod === d) + '">' + esc(t(k)) + '</button>').join('') + '</div>';
  }

  let lastChartCtx = null;
  function renderCharts() {
    const tank = activeTank();
    const sessions = tankSessions(tank);
    let html = '<div class="vhead"><h1>' + esc(tank.name) + '</h1>' + periodChips() + '</div>';
    if (!sessions.length) { app.innerHTML = html + '<p class="empty">' + esc(t('noData')) + '</p>'; lastChartCtx = null; return; }
    app.innerHTML = html + chartCardsHtml(tank);
    lastChartCtx = { tank, sessions };
    drawAllCharts(tank, sessions);
  }

  /* ---------- guide ---------- */
  let guideData = null;
  let guideLoading = null;
  function loadGuide() {
    if (!guideLoading) {
      guideLoading = fetch('data/guide.json', { cache: 'no-cache' })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((d) => { guideData = d; return d; })
        .catch((e) => { guideLoading = null; throw e; });
    }
    return guideLoading;
  }
  const loc = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] != null ? o[lang] : o.en));
  function guideRange(r, unit) {
    if (!r) return '';
    const a = r[0];
    const b = r[1];
    let s;
    if (a != null && b != null) s = a === b ? fmtNum(a) : fmtNum(a) + '–' + fmtNum(b);
    else if (b != null) s = '≤ ' + fmtNum(b);
    else if (a != null) s = '≥ ' + fmtNum(a);
    else return '';
    return s + (unit ? ' ' + unit : '');
  }
  function guideCardHtml(key, g, tank, last) {
    const c = CATALOG[key];
    const p = tank.params.find((x) => x.key === key && !x.hidden);
    const unit = p ? p.unit : c.unit;
    const name = c[lang] || c.en;
    const list = (o) => { const a = loc(o); return Array.isArray(a) && a.length ? '<ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : ''; };
    const sec = (label, html) => (html ? '<div class="gsec"><h3>' + esc(label) + '</h3>' + html + '</div>' : '');
    const para = (o) => (loc(o) ? '<p>' + esc(loc(o)) + '</p>' : '');
    let mine = '';
    if (p) {
      const rt = rangeText(p);
      const lv = last[p.id];
      if (rt || lv) {
        mine = '<div class="gmine">' +
          (rt ? '<span>' + esc(t('gYours')) + ': <b>' + esc(rt) + '</b></span>' : '') +
          (lv ? '<span>' + esc(t('gLast')) + ': <b>' + esc(fmtNum(lv.v)) + (unit ? ' ' + esc(unit) : '') + '</b> ' + stBadge(status(p, lv.v)) + ' <span class="ago">' + esc(ago(lv.t)) + '</span></span>' : '') +
          '</div>';
      }
    }
    return '<article class="card gcard" id="g-' + esc(key) + '" tabindex="-1">' +
      '<header><h2>' + esc(name) + (unit ? ' <span class="unit">' + esc(unit) + '</span>' : '') + '</h2>' +
      (p ? '' : '<button type="button" class="btn small" data-act="gAdd" data-key="' + esc(key) + '">' + esc(t('gAdd')) + '</button>') + '</header>' +
      '<div class="granges"><span class="gr ideal"><small>' + esc(t('gIdeal')) + '</small><b>' + esc(guideRange(g.ideal, unit)) + '</b></span>' +
      '<span class="gr tol"><small>' + esc(t('gTol')) + '</small><b>' + esc(guideRange(g.tol, unit)) + '</b></span></div>' + mine +
      sec(t('gWhat'), para(g.what)) + sec(t('gWhy'), para(g.why)) + sec(t('gStep'), para(g.step)) +
      '<div class="gcols">' + sec(t('gRaise'), list(g.raise)) + sec(t('gLower'), list(g.lower)) + '</div>' +
      sec(t('gSources'), list(g.sources)) + sec(t('gTip'), para(g.tip)) +
      '</article>';
  }
  async function renderGuide(focusKey) {
    if (!guideData) {
      app.innerHTML = '<p class="empty">…</p>';
      try { await loadGuide(); } catch (e) {
        if (route().view === 'guide') app.innerHTML = '<p class="empty">' + esc(t('gLoadErr')) + '</p>';
        return;
      }
      if (route().view !== 'guide') return;
    }
    const tank = activeTank();
    const G = guideData.params || {};
    const inTank = tank.params.filter((p) => p.key && !p.hidden && G[p.key]).map((p) => p.key);
    const others = Object.keys(CATALOG).filter((k) => G[k] && !inTank.includes(k));
    const last = lastValues(tank.params, tankSessions(tank));
    const jump = (keys) => '<nav class="chips gjump">' + keys.map((k) => '<a class="chip" href="#/guide/' + esc(k) + '">' + esc(CATALOG[k][lang] || CATALOG[k].en) + '</a>').join('') + '</nav>';
    let h = '<div class="vhead"><h1>' + esc(t('guide')) + '</h1></div>' +
      '<p class="hint">' + esc(loc(guideData.intro)) + '</p>' +
      (Array.isArray(guideData.sources) && guideData.sources.length ? '<ul class="gsrc hint">' + guideData.sources.map((x) =>
        '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a></li>').join('') + '</ul>' : '') +
      jump(inTank.concat(others));
    if (inTank.length) h += '<h2 class="gsub">' + esc(t('gInTank')) + '</h2><div class="ggrid">' + inTank.map((k) => guideCardHtml(k, G[k], tank, last)).join('') + '</div>';
    if (others.length) h += '<h2 class="gsub">' + esc(t('gOther')) + '</h2><div class="ggrid">' + others.map((k) => guideCardHtml(k, G[k], tank, last)).join('') + '</div>';
    app.innerHTML = h;
    if (focusKey) {
      const el = document.getElementById('g-' + focusKey);
      if (el) { el.scrollIntoView({ block: 'start' }); el.focus({ preventScroll: true }); }
    } else window.scrollTo(0, 0);
  }

  /* ---------- history ---------- */
  function historyTableHtml(tank, sessions, readOnly) {
    const usedIds = new Set();
    sessions.forEach((s) => Object.keys(s.v).forEach((k) => usedIds.add(k)));
    // Only columns that have at least one value, so the measured ones fit on a phone screen
    const params = tank.params.filter((p) => usedIds.has(p.id));
    const rows = sessions.slice().reverse();
    let h = '<div class="tablewrap"><table class="htable"><thead><tr><th scope="col">' + esc(t('date')) + '</th>' +
      params.map((p) => '<th scope="col">' + esc(pname(p)) + (p.unit ? '<br><span class="unit">' + esc(p.unit) + '</span>' : '') + '</th>').join('') +
      '<th scope="col">' + esc(t('note')) + '</th>' + (readOnly ? '' : '<th scope="col"><span class="sr">' + esc(t('edit')) + '</span></th>') + '</tr></thead><tbody>';
    rows.forEach((s) => {
      h += '<tr><th scope="row">' + esc(fmtDateTime(s.t)) + '</th>' + params.map((p) => {
        const v = s.v[p.id];
        if (v == null) return '<td class="nil">·</td>';
        const st = status(p, v);
        const mark = st === 'low' ? ' ↓' : st === 'high' ? ' ↑' : '';
        return '<td class="v st-' + (st || 'none') + '"' + (mark ? ' title="' + esc(t(st)) + '"' : '') + '>' + esc(fmtNum(v)) + mark + '</td>';
      }).join('') + '<td class="note">' + esc(s.note) + '</td>' +
        (readOnly ? '' : '<td class="acts"><button type="button" class="iconbtn" data-act="editS" data-sid="' + esc(s.id) + '" aria-label="' + esc(t('edit')) + '" title="' + esc(t('edit')) + '">✎</button>' +
          '<button type="button" class="iconbtn" data-act="delS" data-sid="' + esc(s.id) + '" aria-label="' + esc(t('del')) + '" title="' + esc(t('del')) + '">🗑</button></td>') + '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  function renderHistory() {
    const tank = activeTank();
    const sessions = tankSessions(tank);
    let html = '<div class="vhead"><h1>' + esc(tank.name) + '</h1>' +
      (sessions.length ? '<button class="btn" type="button" data-act="exportCsv">CSV</button>' : '') + '</div>';
    html += sessions.length ? historyTableHtml(tank, sessions, false) : '<p class="empty">' + esc(t('noData')) + '</p>';
    app.innerHTML = html;
  }

  async function editSession(sid) {
    const s = S.sessions.find((x) => x.id === sid);
    if (!s) return;
    const tank = S.tanks.find((x) => x.id === s.tankId);
    const params = tank.params.filter((p) => !p.hidden || s.v[p.id] != null);
    const body = '<div class="eform">' +
      '<label class="field"><span>' + esc(t('time')) + '</span><input type="datetime-local" name="time" value="' + toLocalInput(s.t) + '"></label>' +
      params.map((p) => '<label class="field"><span>' + esc(pname(p)) + (p.unit ? ' (' + esc(p.unit) + ')' : '') + '</span><input type="text" inputmode="decimal" name="p-' + esc(p.id) + '" value="' + esc(s.v[p.id] != null ? fmtNum(s.v[p.id]) : '') + '"></label>').join('') +
      '<label class="field full"><span>' + esc(t('note')) + '</span><textarea name="note" rows="2">' + esc(s.note) + '</textarea></label></div>';
    const r = await modal(t('editSession'), body, [{ label: t('cancel'), value: '' }, { label: t('save'), value: 'ok', primary: true }]);
    if (r.value !== 'ok') return;
    const f = r.el.querySelector('form');
    const v = {};
    for (const p of params) {
      const n = parseNum(f.elements['p-' + p.id].value);
      if (Number.isNaN(n)) { toast(t('invalid') + ': ' + pname(p)); return; }
      if (n != null) v[p.id] = n;
    }
    // keep values of params not shown in the form
    for (const k in s.v) if (!params.some((p) => p.id === k)) v[k] = s.v[k];
    s.v = v;
    s.note = f.elements.note.value.trim();
    const tm = fromLocalInput(f.elements.time.value);
    if (tm) s.t = tm;
    save();
    render();
    toast(t('saved'));
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    const tank = activeTank();
    const tpls = templateList();
    let h = '<h1 class="sr">' + esc(t('settings')) + '</h1>';

    h += '<section class="card"><h2>' + esc(t('tankSec')) + '</h2><div class="frow">' +
      '<label class="field grow"><span>' + esc(t('name')) + '</span><input type="text" data-tank-field="name" value="' + esc(tank.name) + '" maxlength="60"></label>' +
      '<label class="field narrow"><span>' + esc(t('volume')) + '</span><input type="text" inputmode="decimal" data-tank-field="volume" value="' + esc(tank.volume != null ? fmtNum(tank.volume) : '') + '"></label></div>' +
      '<div class="btns"><button class="btn" type="button" data-act="newTank">' + esc(t('newTank')) + '</button>' +
      '<button class="btn danger" type="button" data-act="delTank">' + esc(t('delTank')) + '</button></div></section>';

    h += '<section class="card"><h2>' + esc(t('paramsSec')) + ' – ' + esc(tank.name) + '</h2><p class="hint">' + esc(t('paramsHelp')) + '</p><div class="plist">';
    tank.params.forEach((p, i) => {
      h += '<div class="pedit' + (p.hidden ? ' off' : '') + '" data-pid="' + esc(p.id) + '">' +
        '<div class="pe-name">' + (p.key
          ? '<strong>' + esc(pname(p)) + '</strong>'
          : '<input type="text" data-pf="name" value="' + esc(p.name) + '" aria-label="' + esc(t('name')) + '" maxlength="40">') + '</div>' +
        '<label class="mini"><span>' + esc(t('unit')) + '</span><input type="text" data-pf="unit" value="' + esc(p.unit) + '" maxlength="12"></label>' +
        '<label class="mini"><span>' + esc(t('minL')) + '</span><input type="text" inputmode="decimal" data-pf="min" value="' + esc(p.min != null ? fmtNum(p.min) : '') + '"></label>' +
        '<label class="mini"><span>' + esc(t('maxL')) + '</span><input type="text" inputmode="decimal" data-pf="max" value="' + esc(p.max != null ? fmtNum(p.max) : '') + '"></label>' +
        '<span class="mini tm"><span>' + esc(t('timer')) + '</span><span class="tval">' + (p.timer ? fmtDur(p.timer) + ' <button type="button" class="iconbtn" data-act="clrTimer" aria-label="✕">✕</button>' : '–') + '</span></span>' +
        '<label class="chk"><input type="checkbox" data-pf="shown"' + (p.hidden ? '' : ' checked') + '> ' + esc(t('shown')) + '</label>' +
        '<span class="pe-acts">' +
        '<button type="button" class="iconbtn" data-act="pUp"' + (i === 0 ? ' disabled' : '') + ' aria-label="' + esc(t('up')) + '" title="' + esc(t('up')) + '">↑</button>' +
        '<button type="button" class="iconbtn" data-act="pDown"' + (i === tank.params.length - 1 ? ' disabled' : '') + ' aria-label="' + esc(t('down')) + '" title="' + esc(t('down')) + '">↓</button>' +
        '<button type="button" class="iconbtn" data-act="pDel" aria-label="' + esc(t('remove')) + '" title="' + esc(t('remove')) + '">✕</button></span></div>';
    });
    h += '</div><button class="btn" type="button" data-act="addParam">' + esc(t('addParam')) + '</button></section>';

    h += '<section class="card"><h2>' + esc(t('templatesSec')) + '</h2><p class="hint">' + esc(t('templatesHelp')) + '</p>' +
      '<div class="frow"><label class="field grow"><span>' + esc(t('template')) + '</span><select id="tplSel">' +
      '<optgroup label="' + esc(t('builtin')) + '">' + tpls.filter((x) => !x.user).map((x) => '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>').join('') + '</optgroup>' +
      (tpls.some((x) => x.user) ? '<optgroup label="' + esc(t('myTemplates')) + '">' + tpls.filter((x) => x.user).map((x) => '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>').join('') + '</optgroup>' : '') +
      '</select></label><button class="btn primary" type="button" data-act="applyTpl">' + esc(t('apply')) + '</button></div>' +
      '<div class="tplprev" id="tplPrev"></div>' +
      '<div class="btns"><button class="btn" type="button" data-act="saveTpl">' + esc(t('saveTemplate')) + '</button></div>';
    if (S.templates.length) {
      h += '<h3>' + esc(t('myTemplates')) + '</h3><ul class="tlist">' + S.templates.map((tp) => '<li><span>' + esc(tp.name) + '</span><button type="button" class="iconbtn" data-act="delTpl" data-tid="' + esc(tp.id) + '" aria-label="' + esc(t('del')) + '" title="' + esc(t('del')) + '">✕</button></li>').join('') + '</ul>';
    }
    h += '</section>';

    h += '<section class="card"><h2>' + esc(t('dataSec')) + '</h2><p class="hint">' + esc(t('storageInfo')) + '</p>' +
      '<p>' + esc(t('lastBackup', { when: S.lastBackup ? fmtDateTime(S.lastBackup) : t('never') })) + '</p>' +
      '<div class="btns"><button class="btn primary" type="button" data-act="exportJson">' + esc(t('exportJson')) + '</button>' +
      '<button class="btn" type="button" data-act="exportCsv">' + esc(t('exportCsv')) + '</button>' +
      '<label class="btn filebtn">' + esc(t('importJson')) + '<input type="file" accept="application/json,.json" id="importFile"></label>' +
      '<label class="btn filebtn">' + esc(t('alImport')) + '<input type="file" accept="text/csv,.csv" multiple id="alFile"></label></div>' +
      '<div class="btns"><button class="btn danger" type="button" data-act="clearAll">' + esc(t('clearAll')) + '</button></div></section>';
    app.innerHTML = h;
    updateTplPreview();
  }

  function updateTplPreview() {
    const sel = $('#tplSel');
    const prev = $('#tplPrev');
    if (!sel || !prev) return;
    const tpl = templateList().find((x) => x.id === sel.value);
    if (!tpl) { prev.innerHTML = ''; return; }
    prev.innerHTML = tpl.p.map((e) => {
      const nm = e.key ? (CATALOG[e.key][lang] || CATALOG[e.key].en) : e.name;
      const r = rangeText({ min: e.min, max: e.max });
      return '<span class="tp">' + esc(nm) + (r ? ': <b>' + esc(r) + '</b>' : '') + '</span>';
    }).join('');
  }

  async function addParamDialog() {
    const tank = activeTank();
    const have = new Set(tank.params.map((p) => p.key).filter(Boolean));
    const avail = Object.keys(CATALOG).filter((k) => !have.has(k));
    const body = (avail.length ? '<div class="chips">' + avail.map((k) => '<button type="button" class="chip" data-key="' + k + '">' + esc(CATALOG[k][lang] || CATALOG[k].en) + '</button>').join('') + '</div>' : '') +
      '<fieldset class="custom col"><legend>' + esc(t('customParam')) + '</legend>' +
      '<label class="field"><span>' + esc(t('name')) + '</span><input type="text" id="npName" maxlength="40"></label>' +
      '<div class="frow"><label class="field"><span>' + esc(t('unit')) + '</span><input type="text" id="npUnit" maxlength="12"></label>' +
      '<label class="field"><span>' + esc(t('minL')) + '</span><input type="text" inputmode="decimal" id="npMin"></label>' +
      '<label class="field"><span>' + esc(t('maxL')) + '</span><input type="text" inputmode="decimal" id="npMax"></label></div>' +
      '<button type="button" class="btn primary" id="npAdd">' + esc(t('add')) + '</button></fieldset>';
    let added = null;
    await modal(t('addParamTitle'), body, [], (d, close) => {
      d.addEventListener('click', (e) => {
        const c = e.target.closest('[data-key]');
        if (c) { added = newParam(c.dataset.key); close('ok'); }
        if (e.target.id === 'npAdd') {
          const name = $('#npName', d).value.trim();
          if (!name) { $('#npName', d).focus(); toast(t('nameRequired')); return; }
          const mn = parseNum($('#npMin', d).value);
          const mx = parseNum($('#npMax', d).value);
          added = newParam(null, { name, unit: $('#npUnit', d).value.trim(), min: Number.isNaN(mn) ? null : mn, max: Number.isNaN(mx) ? null : mx });
          close('ok');
        }
      });
    });
    if (added) {
      tank.params.push(added);
      save();
      render();
    }
  }

  async function newTankDialog() {
    const tpls = templateList();
    const body = '<label class="field"><span>' + esc(t('name')) + '</span><input type="text" name="name" maxlength="60" required></label>' +
      '<label class="field"><span>' + esc(t('template')) + '</span><select name="tpl">' + tpls.map((x) => '<option value="' + esc(x.id) + '">' + esc(x.label) + '</option>').join('') + '</select></label>';
    const r = await modal(t('newTank'), body, [{ label: t('cancel'), value: '' }, { label: t('create'), value: 'ok', primary: true }]);
    if (r.value !== 'ok') return;
    const f = r.el.querySelector('form');
    const name = f.elements.name.value.trim() || t('defaultTank') + ' ' + (S.tanks.length + 1);
    const tank = makeTank(name, f.elements.tpl.value);
    S.tanks.push(tank);
    S.active = tank.id;
    save();
    render();
  }

  async function saveTemplateDialog() {
    const tank = activeTank();
    const r = await modal(t('saveTemplate'), '<label class="field"><span>' + esc(t('templateName')) + '</span><input type="text" name="name" maxlength="40" value="' + esc(tank.name) + '"></label>',
      [{ label: t('cancel'), value: '' }, { label: t('save'), value: 'ok', primary: true }]);
    if (r.value !== 'ok') return;
    const name = r.el.querySelector('form').elements.name.value.trim();
    if (!name) return;
    S.templates.push({ id: uid(), name, p: tank.params.filter((p) => !p.hidden).map((p) => ({ key: p.key, name: p.key ? '' : p.name, unit: p.unit, min: p.min, max: p.max })) });
    save();
    render();
    toast(t('saved'));
  }

  /* ---------- export / import ---------- */
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const today = () => toLocalInput(Date.now()).slice(0, 10);
  function exportJson() {
    S.lastBackup = Date.now();
    save();
    download('tank-log-' + today() + '.json', JSON.stringify(Object.assign({ app: 'reef42-tank-log' }, S), null, 1), 'application/json');
    render();
  }
  function exportCsv() {
    const tank = activeTank();
    const sessions = tankSessions(tank);
    const sep = lang === 'hu' ? ';' : ',';
    const num = (v) => (v == null ? '' : lang === 'hu' ? String(v).replace('.', ',') : String(v));
    const q = (s) => {
      s = String(s == null ? '' : s);
      return /["\n\r;,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const params = tank.params;
    const lines = [[t('date')].concat(params.map((p) => pname(p) + (p.unit ? ' (' + p.unit + ')' : '')), [t('note')]).map(q).join(sep)];
    sessions.forEach((s) => {
      lines.push([toLocalInput(s.t).replace('T', ' ')].concat(params.map((p) => num(s.v[p.id])), [s.note]).map(q).join(sep));
    });
    const safe = tank.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-|-$/g, '') || 'tank';
    download('tank-log-' + safe + '-' + today() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  }
  async function importFile(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.tanks) || !Array.isArray(data.sessions)) throw new Error('shape');
      data = normalize(data);
      if (!data.tanks.length) throw new Error('empty');
    } catch (e) {
      toast(t('badFile'));
      return;
    }
    const r = await modal(t('importTitle'), '<p>' + esc(t('importBody', { tanks: data.tanks.length, sessions: data.sessions.length })) + '</p>',
      [{ label: t('cancel'), value: '' }, { label: t('replace'), value: 'replace', danger: true }]);
    if (r.value !== 'replace') return;
    S = normalize(data);
    save();
    render();
    toast(t('imported'));
  }

  /* ---------- Aquarium Log CSV import ---------- */
  // Aquarium Log exports two files per tank: measurements (parameter,value,createdAt,note)
  // and notes (date,description). Both can be imported together into one tank.
  const AL_KEYS = {
    temperature: 'temp', temp: 'temp', salinity: 'sal', ph: 'ph', kh: 'kh', alkalinity: 'kh', dkh: 'kh',
    calcium: 'ca', magnesium: 'mg', nitrate: 'no3', nitrite: 'no2', phosphate: 'po4', ammonia: 'nh3', ammonium: 'nh3',
    potassium: 'k', iodine: 'i', iodide: 'i', strontium: 'sr', silicate: 'si', silica: 'si', iron: 'fe', copper: 'cu', orp: 'orp'
  };
  const AL_GROUP_MS = 3 * 3600000;

  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some((x) => x !== '')) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.some((x) => x !== '')) rows.push(row);
    return rows;
  }
  function parseLocalDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(s).trim());
    if (!m) return null;
    const d = m[4] == null
      ? new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0)
      : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    return isFinite(d.getTime()) ? d.getTime() : null;
  }
  const dayKey = (ms) => toLocalInput(ms).slice(0, 10);
  const cleanNote = (s) => String(s || '').split(/\r?\n/).map((l) => l.trimEnd()).join('\n').replace(/^\s+|\s+$/g, '');

  async function readAquariumLog(files) {
    const readings = [];
    const notes = [];
    let bad = 0;
    for (const file of files) {
      const rows = parseCsv(await file.text());
      if (!rows.length) continue;
      const head = rows[0].map((h) => h.trim().toLowerCase());
      const col = (n) => head.indexOf(n);
      if (col('parameter') >= 0 && col('value') >= 0 && col('createdat') >= 0) {
        rows.slice(1).forEach((r) => {
          const name = (r[col('parameter')] || '').trim();
          const v = parseFloat(String(r[col('value')] || '').replace(',', '.'));
          const ms = parseLocalDate(r[col('createdat')]);
          if (!name || !isFinite(v) || ms == null) { bad++; return; }
          readings.push({ name, v, t: ms, note: col('note') >= 0 ? cleanNote(r[col('note')]) : '' });
        });
      } else if (col('date') >= 0 && col('description') >= 0) {
        rows.slice(1).forEach((r) => {
          const ms = parseLocalDate(r[col('date')]);
          const text = cleanNote(r[col('description')]);
          if (ms == null || !text) { if (text) bad++; return; }
          notes.push({ t: ms, text });
        });
      }
    }
    return { readings, notes, bad };
  }

  function importAquariumLogInto(tank, data) {
    const paramFor = {};
    data.readings.forEach((r) => {
      if (paramFor[r.name]) return;
      const key = AL_KEYS[r.name.toLowerCase().replace(/[^a-z]/g, '')] || null;
      let p = key ? tank.params.find((x) => x.key === key)
        : tank.params.find((x) => !x.key && x.name.toLowerCase() === r.name.toLowerCase());
      if (!p) { p = newParam(key, key ? {} : { name: r.name }); tank.params.push(p); }
      p.hidden = false;
      paramFor[r.name] = p;
    });

    const existing = tankSessions(tank);
    const seen = new Set();
    existing.forEach((s) => Object.keys(s.v).forEach((pid) => seen.add(pid + '|' + s.v[pid] + '|' + dayKey(s.t))));
    let dup = 0;
    const created = [];
    let cur = null;
    data.readings.slice().sort((a, b) => a.t - b.t).forEach((r) => {
      const p = paramFor[r.name];
      const key = p.id + '|' + r.v + '|' + dayKey(r.t);
      if (seen.has(key)) { dup++; return; }
      seen.add(key);
      if (!cur || r.t - cur.t > AL_GROUP_MS || cur.v[p.id] != null) {
        cur = { id: uid(), tankId: tank.id, t: r.t, v: {}, note: '' };
        created.push(cur);
      }
      cur.v[p.id] = r.v;
      if (r.note) cur.note = cur.note ? cur.note + '\n' + r.note : r.note;
    });

    const all = existing.concat(created).sort((a, b) => a.t - b.t);
    let notesAdded = 0;
    data.notes.forEach((n) => {
      const day = dayKey(n.t);
      if (all.some((s) => dayKey(s.t) === day && s.note && s.note.includes(n.text))) { dup++; return; }
      const target = created.find((s) => dayKey(s.t) === day);
      if (target) target.note = target.note ? target.note + '\n' + n.text : n.text;
      else { const s = { id: uid(), tankId: tank.id, t: n.t, v: {}, note: n.text }; created.push(s); all.push(s); }
      notesAdded++;
    });
    S.sessions.push(...created);
    return { entries: created.length, dup, notes: notesAdded };
  }

  async function importAquariumLog(files) {
    let data;
    try { data = await readAquariumLog(files); } catch (e) { data = null; }
    if (!data || (!data.readings.length && !data.notes.length)) { toast(t('alBad')); return; }
    const times = data.readings.map((r) => r.t).concat(data.notes.map((n) => n.t));
    const params = new Set(data.readings.map((r) => r.name));
    const body = '<p>' + esc(t('alSummary', {
      m: data.readings.length, p: params.size, n: data.notes.length,
      from: fmtDate(Math.min(...times), true), to: fmtDate(Math.max(...times), true)
    })) + '</p>' +
      (data.bad ? '<p class="hint">' + esc(t('alBadRows', { n: data.bad })) + '</p>' : '') +
      '<label class="field"><span>' + esc(t('alTarget')) + '</span><select name="target">' +
      S.tanks.map((tk) => '<option value="' + esc(tk.id) + '"' + (tk.id === S.active ? ' selected' : '') + '>' + esc(tk.name) + '</option>').join('') +
      '<option value="__new">' + esc(t('alNewTank')) + '</option></select></label>' +
      '<label class="field" data-newname hidden><span>' + esc(t('name')) + '</span><input type="text" name="newName" maxlength="60" value="' + esc(t('alDefaultName')) + '"></label>' +
      '<p class="hint">' + esc(t('alHint')) + '</p>';
    const r = await modal(t('alTitle'), body, [{ label: t('cancel'), value: '' }, { label: t('alGo'), value: 'ok', primary: true }], (d) => {
      const sel = d.querySelector('[name="target"]');
      const sync = () => { d.querySelector('[data-newname]').hidden = sel.value !== '__new'; };
      sel.addEventListener('change', sync);
      sync();
    });
    if (r.value !== 'ok') return;
    const f = r.el.querySelector('form');
    let tank;
    if (f.elements.target.value === '__new') {
      tank = makeTank(f.elements.newName.value.trim() || t('alDefaultName'), 'b-mixed');
      S.tanks.push(tank);
    } else tank = S.tanks.find((x) => x.id === f.elements.target.value) || activeTank();
    const res = importAquariumLogInto(tank, data);
    S.active = tank.id;
    save();
    location.hash = '#/history';
    render();
    toast(t('alDone', { s: res.entries, d: res.dup }));
  }

  /* ---------- sharing ---------- */
  function summaryText(tank, sessions) {
    const params = tank.params.filter((p) => !p.hidden);
    const last = lastValues(params, sessions);
    const newest = sessions[sessions.length - 1];
    const lines = [tank.name + ' – ' + fmtDateTime(newest.t)];
    params.forEach((p) => {
      const l = last[p.id];
      if (!l) return;
      const st = status(p, l.v);
      let line = pname(p) + ': ' + fmtNum(l.v) + (p.unit ? ' ' + p.unit : '');
      if (st === 'ok') line += ' ✓';
      else if (st === 'low' || st === 'high') line += ' ' + (st === 'low' ? '↓ ' : '↑ ') + t(st);
      const rt = rangeText(p);
      if (rt) line += ' (' + rt + ')';
      if (new Date(l.t).toDateString() !== new Date(newest.t).toDateString()) line += ' [' + fmtDate(l.t) + ']';
      lines.push(line);
    });
    if (newest.note) lines.push(t('note') + ': ' + newest.note);
    return lines.join('\n');
  }

  function b64u(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64u(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }
  async function pack(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'z' + b64u(new Uint8Array(await new Response(stream).arrayBuffer()));
    }
    return 'j' + b64u(bytes);
  }
  async function unpack(s) {
    let bytes = unb64u(s.slice(1));
    if (s[0] === 'z') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (s[0] !== 'j') throw new Error('kind');
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function snapshot(tank, sessions, days) {
    const params = tank.params.filter((p) => !p.hidden);
    const from = days ? Date.now() - days * DAY : 0;
    return {
      v: 1, n: tank.name, vol: tank.volume,
      p: params.map((p) => [p.key || '', p.key ? '' : p.name, p.unit, p.min, p.max]),
      s: sessions.filter((s) => s.t >= from).map((s) => {
        const row = [Math.round(s.t / 60000), params.map((p) => (s.v[p.id] != null ? s.v[p.id] : null))];
        if (s.note) row.push(s.note);
        return row;
      })
    };
  }
  function fromSnapshot(o) {
    if (!o || !Array.isArray(o.p) || !Array.isArray(o.s)) throw new Error('shape');
    const tank = {
      id: 'shared', name: String(o.n || 'Tank'), volume: o.vol || null,
      params: o.p.map((a, i) => ({ id: 'p' + i, key: CATALOG[a[0]] ? a[0] : null, name: a[1] || '', unit: a[2] || '', min: numOrNull(a[3]), max: numOrNull(a[4]), timer: null, hidden: false }))
    };
    const sessions = o.s.map((r, i) => {
      const v = {};
      (r[1] || []).forEach((x, j) => { if (x != null && isFinite(x) && tank.params[j]) v['p' + j] = Number(x); });
      return { id: 's' + i, tankId: 'shared', t: Number(r[0]) * 60000, v, note: r[2] ? String(r[2]) : '' };
    }).filter((s) => isFinite(s.t)).sort((a, b) => a.t - b.t);
    return { tank, sessions };
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t('copied'));
      return true;
    } catch (e) {
      toast(t('copyFail'));
      return false;
    }
  }

  async function shareDialog() {
    const tank = activeTank();
    const sessions = tankSessions(tank);
    if (!sessions.length) return;
    const text = summaryText(tank, sessions);
    const body = '<textarea class="sharetext" readonly rows="' + Math.min(14, text.split('\n').length + 1) + '">' + esc(text) + '</textarea>' +
      '<div class="btns">' + (navigator.share ? '<button type="button" class="btn primary" id="shNative">' + esc(t('shareNative')) + '</button>' : '') +
      '<button type="button" class="btn' + (navigator.share ? '' : ' primary') + '" id="shCopy">' + esc(t('copyText')) + '</button></div>' +
      '<hr><div class="frow"><label class="field"><span>' + esc(t('linkPeriod')) + '</span><select id="shDays">' +
      [[30, 'p30'], [90, 'p90'], [365, 'p365'], [0, 'pall']].map(([d, k]) => '<option value="' + d + '"' + (d === 90 ? ' selected' : '') + '>' + esc(t(k)) + '</option>').join('') +
      '</select></label><button type="button" class="btn" id="shLink">' + esc(t('copyLink')) + '</button></div>' +
      '<p class="hint">' + esc(t('linkInfo')) + '</p>';
    await modal(t('shareTitle'), body, [], (d) => {
      const ta = $('.sharetext', d);
      ta.addEventListener('focus', () => ta.select());
      const nat = $('#shNative', d);
      if (nat) nat.addEventListener('click', () => { navigator.share({ title: tank.name, text }).catch(() => {}); });
      $('#shCopy', d).addEventListener('click', async () => { if (!(await copy(text))) ta.select(); });
      $('#shLink', d).addEventListener('click', async () => {
        const days = Number($('#shDays', d).value);
        const url = location.origin + location.pathname + '#/shared/' + (await pack(snapshot(tank, sessions, days)));
        if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
          navigator.share({ title: tank.name, url }).catch(() => copy(url));
        } else copy(url);
      });
    });
  }

  let sharedCache = null;
  async function renderShared(data) {
    app.innerHTML = '<p class="loading">…</p>';
    let snap;
    try {
      if (!sharedCache || sharedCache.data !== data) sharedCache = { data, snap: fromSnapshot(await unpack(data)) };
      snap = sharedCache.snap;
    } catch (e) {
      app.innerHTML = '<p class="empty">' + esc(t('sharedBad')) + '</p><p><a class="btn" href="#/measure">' + esc(t('backToMine')) + '</a></p>';
      return;
    }
    const { tank, sessions } = snap;
    const last = lastValues(tank.params, sessions);
    let h = '<div class="sharedhead"><p class="kicker">' + esc(t('sharedBanner')) + '</p><h1>' + esc(tank.name) + '</h1>' +
      '<div class="btns"><button type="button" class="btn primary" data-act="saveShared">' + esc(t('saveShared')) + '</button>' +
      '<a class="btn" href="#/measure">' + esc(t('backToMine')) + '</a></div></div>';
    if (!sessions.length) { app.innerHTML = h + '<p class="empty">' + esc(t('noData')) + '</p>'; return; }
    h += '<section class="card"><h2>' + esc(t('latest')) + '</h2><ul class="latest">' + tank.params.map((p) => {
      const l = last[p.id];
      if (!l) return '';
      return '<li><span class="ln">' + esc(pname(p)) + '</span><span class="lv"><b>' + esc(fmtNum(l.v)) + '</b> ' + esc(p.unit) + ' ' + stBadge(status(p, l.v)) + '</span><span class="lr">' + esc(rangeText(p)) + '</span><span class="ago">' + esc(fmtDate(l.t, true)) + '</span></li>';
    }).join('') + '</ul></section>';
    h += '<div class="vhead"><h2>' + esc(t('charts')) + '</h2>' + periodChips() + '</div>' + chartCardsHtml(tank);
    h += '<h2>' + esc(t('history')) + '</h2>' + historyTableHtml(tank, sessions, true);
    app.innerHTML = h;
    lastChartCtx = { tank, sessions };
    drawAllCharts(tank, sessions);
  }

  function saveShared() {
    if (!sharedCache) return;
    const { tank, sessions } = sharedCache.snap;
    const idMap = {};
    const nt = { id: uid(), name: tank.name, volume: tank.volume, created: Date.now(), params: tank.params.map((p) => { const np = Object.assign({}, p, { id: uid() }); idMap[p.id] = np.id; return np; }) };
    S.tanks.push(nt);
    sessions.forEach((s) => {
      const v = {};
      for (const k in s.v) v[idMap[k]] = s.v[k];
      S.sessions.push({ id: uid(), tankId: nt.id, t: s.t, v, note: s.note });
    });
    S.active = nt.id;
    save();
    location.hash = '#/measure';
    toast(t('sharedSaved'));
  }

  /* ---------- events ---------- */
  app.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList.contains('pin')) {
      draft.vals[el.dataset.pid] = el.value;
      const tank = activeTank();
      const p = tank.params.find((x) => x.id === el.dataset.pid);
      const last = lastValues([p], tankSessions(tank));
      updateRow(p, last[p.id]);
    } else if (el.id === 'mNote') draft.note = el.value;
    else if (el.id === 'mTime') draft.time = fromLocalInput(el.value);
  });

  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('pin')) {
      e.preventDefault();
      const all = $$('.pin', app);
      const i = all.indexOf(e.target);
      if (i < all.length - 1) all[i + 1].focus();
      else $('#mNote').focus();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && route().view === 'measure') saveMeasurement();
  });

  app.addEventListener('change', (e) => {
    const el = e.target;
    const tank = activeTank();
    if (el.dataset.tankField) {
      if (el.dataset.tankField === 'name') tank.name = el.value.trim() || tank.name;
      else { const n = parseNum(el.value); tank.volume = n && !Number.isNaN(n) ? n : null; }
      save();
      renderChrome();
      return;
    }
    if (el.dataset.pf) {
      const p = tank.params.find((x) => x.id === el.closest('[data-pid]').dataset.pid);
      if (!p) return;
      const f = el.dataset.pf;
      if (f === 'name') p.name = el.value.trim() || p.name;
      else if (f === 'unit') p.unit = el.value.trim();
      else if (f === 'shown') { p.hidden = !el.checked; el.closest('.pedit').classList.toggle('off', p.hidden); }
      else {
        const n = parseNum(el.value);
        if (Number.isNaN(n)) { toast(t('invalid')); el.value = p[f] != null ? fmtNum(p[f]) : ''; return; }
        p[f] = n;
        el.value = n != null ? fmtNum(n) : '';
      }
      save();
      return;
    }
    if (el.id === 'tplSel') updateTplPreview();
    if (el.id === 'importFile' && el.files[0]) { importFile(el.files[0]); el.value = ''; }
    if (el.id === 'alFile' && el.files.length) { importAquariumLog(Array.from(el.files)); el.value = ''; }
  });

  async function onAction(btn) {
    const act = btn.dataset.act;
    const tank = activeTank();
    const pid = btn.dataset.pid || (btn.closest('[data-pid]') && btn.closest('[data-pid]').dataset.pid);
    switch (act) {
      case 'save': saveMeasurement(); break;
      case 'share': shareDialog(); break;
      case 'tstart': {
        const p = findParam(tank.id, pid);
        if (p && p.timer) startTimer(tank.id, pid, p.timer);
        break;
      }
      case 'tpick': pickTimer(tank.id, pid); break;
      case 'tstop':
      case 'tack': stopTimer(btn.dataset.key || timerKey(tank.id, pid)); break;
      case 'period':
        chartPeriod = Number(btn.dataset.days);
        $$('.chip[data-act="period"]', app).forEach((c) => { const on = Number(c.dataset.days) === chartPeriod; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
        if (lastChartCtx) drawAllCharts(lastChartCtx.tank, lastChartCtx.sessions);
        break;
      case 'gAdd': {
        const tank = activeTank();
        const key = btn.dataset.key;
        const hidden = tank.params.find((x) => x.key === key);
        if (hidden) hidden.hidden = false; else tank.params.push(newParam(key));
        save();
        toast(t('gAdded'));
        renderGuide(key);
        break;
      }
      case 'wide': {
        if (wide.has(pid)) wide.delete(pid); else wide.add(pid);
        const card = btn.closest('.ccard');
        const on = wide.has(pid);
        card.classList.toggle('wide', on);
        $('.chart', card).classList.toggle('big', on);
        btn.textContent = on ? '⤡' : '⤢';
        btn.setAttribute('aria-label', on ? t('shrink') : t('enlarge'));
        if (lastChartCtx) drawAllCharts(lastChartCtx.tank, lastChartCtx.sessions);
        break;
      }
      case 'editS': editSession(btn.dataset.sid); break;
      case 'delS':
        if (await confirmBox(t('confirmDelSession'), t('del'), true)) {
          S.sessions = S.sessions.filter((s) => s.id !== btn.dataset.sid);
          save();
          render();
        }
        break;
      case 'newTank': newTankDialog(); break;
      case 'delTank':
        if (S.tanks.length < 2) { toast(t('lastTank')); break; }
        if (await confirmBox(t('confirmDelTank', { name: tank.name }), t('del'), true)) {
          Object.keys(timers).forEach((k) => { if (timers[k].tankId === tank.id) stopTimer(k, true); });
          S.tanks = S.tanks.filter((x) => x.id !== tank.id);
          S.sessions = S.sessions.filter((s) => s.tankId !== tank.id);
          S.active = S.tanks[0].id;
          save();
          render();
        }
        break;
      case 'pUp':
      case 'pDown': {
        const i = tank.params.findIndex((p) => p.id === pid);
        const j = act === 'pUp' ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= tank.params.length) break;
        [tank.params[i], tank.params[j]] = [tank.params[j], tank.params[i]];
        save();
        render();
        break;
      }
      case 'pDel': {
        const p = tank.params.find((x) => x.id === pid);
        if (p && await confirmBox(t('confirmRemove', { name: pname(p) }), t('remove'), true)) {
          stopTimer(timerKey(tank.id, pid), true);
          tank.params = tank.params.filter((x) => x.id !== pid);
          S.sessions.forEach((s) => { if (s.tankId === tank.id) delete s.v[pid]; });
          save();
          render();
        }
        break;
      }
      case 'clrTimer': {
        const p = tank.params.find((x) => x.id === pid);
        if (p) { p.timer = null; save(); render(); }
        break;
      }
      case 'addParam': addParamDialog(); break;
      case 'applyTpl': {
        const tpl = templateList().find((x) => x.id === $('#tplSel').value);
        if (tpl && await confirmBox(t('confirmApply', { name: tpl.label, tank: tank.name }), t('apply'))) {
          applyTemplate(tank, tpl);
          save();
          render();
          toast(t('saved'));
        }
        break;
      }
      case 'saveTpl': saveTemplateDialog(); break;
      case 'delTpl':
        S.templates = S.templates.filter((x) => x.id !== btn.dataset.tid);
        save();
        render();
        break;
      case 'exportJson': exportJson(); break;
      case 'exportCsv': exportCsv(); break;
      case 'clearAll':
        if (await confirmBox(t('confirmClear'), t('clearAll'), true)) {
          Object.keys(timers).forEach((k) => stopTimer(k, true));
          freshState();
          draft = { tankId: null, vals: {}, note: '', time: null };
          save();
          location.hash = '#/measure';
          render();
        }
        break;
      case 'saveShared': saveShared(); break;
      default: break;
    }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.closest('dialog')) return;
    if (!app.contains(btn) && !$('#dock').contains(btn) && !$('#banner').contains(btn)) return;
    onAction(btn);
  });

  // Unlock audio on any gesture so timers restored after a reload can beep.
  document.addEventListener('pointerdown', () => {
    if (!Object.keys(timers).length) return;
    if (!actx || actx.state !== 'running') {
      if (ensureAudio()) Object.values(timers).forEach((tm) => { if (!tm.gain && !tm.ringing) scheduleBeeps(tm); });
    }
  }, true);

  $('#tankSelect').addEventListener('change', (e) => {
    S.active = e.target.value;
    save();
    render();
  });
  $('#langToggle').addEventListener('click', () => {
    lang = lang === 'hu' ? 'en' : 'hu';
    ls(false, LANG_KEY, lang);
    render();
  });
  window.addEventListener('hashchange', () => { render(); app.focus({ preventScroll: true }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { tick(); updateWakeLock(); }
  });
  let resizeT;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (lastChartCtx && $('.cgrid', app)) drawAllCharts(lastChartCtx.tank, lastChartCtx.sessions); }, 150);
  });
  // Other open tabs of the tool: pick up their changes.
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY && e.newValue) {
      try { S = normalize(JSON.parse(e.newValue)); render(); } catch (err) { /* ignore */ }
    }
  });

  /* ---------- boot ---------- */
  S = load();
  if (!S) {
    freshState();
    storageOk = ls(false, STORE_KEY, JSON.stringify(S));
  }
  restoreTimers();
  render();
})();
