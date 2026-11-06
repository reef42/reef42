/* Fishy Doctor – static, dependency-free single page app (GitHub Pages friendly). */
(function () {
  'use strict';

  const state = {
    lang: 'en',
    ui: {},
    tree: null,
    parents: {},
    diseases: {},
    diseaseOrder: [],
    treatments: {},
    treatmentOrder: [],
    quarantine: [],
    sources: null,
    trail: [] // [{node, option}]
  };

  const app = document.getElementById('app');

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function t(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v;
    return v[state.lang] != null && v[state.lang] !== '' ? v[state.lang] : (v.en != null ? v.en : '');
  }
  function tl(v) { // localized list
    if (!v) return [];
    if (Array.isArray(v)) return v;
    const l = v[state.lang] && v[state.lang].length ? v[state.lang] : v.en;
    return Array.isArray(l) ? l : [];
  }
  function u(key, vars) {
    let s = t(state.ui[key]) || key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }
  function storage(get, key, value) {
    try {
      if (get) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }
  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(path + ': ' + res.status);
    return res.json();
  }

  function imgTag(img, cls) {
    if (!img || !img.url) return '';
    const cap = t(img.caption);
    return '<img src="' + esc(img.url) + '" alt="' + esc(cap) + '" loading="lazy" referrerpolicy="no-referrer"' +
      (cls ? ' class="' + cls + '"' : '') + ' data-cap="' + esc(cap) + '">';
  }
  function diseaseImage(ref) {
    if (!ref) return null;
    const [id, idx] = String(ref).split('#');
    const d = state.diseases[id];
    if (d && d.images && d.images.length) return d.images[Math.min(parseInt(idx || '0', 10) || 0, d.images.length - 1)];
    const tr = state.treatments[id];
    if (tr && tr.images && tr.images.length) return tr.images[0];
    return null;
  }
  function thumb(ref) {
    const img = typeof ref === 'object' ? ref : diseaseImage(ref);
    return img ? '<div class="thumb">' + imgTag(img) + '</div>' : '';
  }

  const LEVEL_CLASS = { low: 'ok', medium: 'warn', high: 'danger', 'very-high': 'danger' };
  const PRIORITY_CLASS = { 'first-line': 'accent', alternative: '', supportive: 'ok', 'not-recommended': 'danger' };

  function diseaseTags(d) {
    const tags = [];
    if (d.category) tags.push('<span class="tag">' + esc(u('cat.' + d.category)) + '</span>');
    if (d.lethality) tags.push('<span class="tag ' + (LEVEL_CLASS[d.lethality] || '') + '">' + esc(u('lethality')) + ': ' + esc(u('level.' + d.lethality)) + '</span>');
    if (d.speed) tags.push('<span class="tag">' + esc(u('speed')) + ': ' + esc(u('speed.' + d.speed)) + '</span>');
    if (d.contagious != null) tags.push('<span class="tag ' + (d.contagious ? 'warn' : 'ok') + '">' + esc(u(d.contagious ? 'contagious' : 'notContagious')) + '</span>');
    return '<div class="tags">' + tags.join('') + '</div>';
  }

  function list(items, cls) {
    if (!items || !items.length) return '';
    return '<ul class="' + (cls || 'clean') + '">' + items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>';
  }
  function steps(items) {
    if (!items || !items.length) return '';
    return '<ol class="steps">' + items.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ol>';
  }
  function sourceLine(url, author) {
    if (!url) return '';
    return '<p class="source-line">' + esc(u('source')) + ': <a href="' + esc(url) + '" target="_blank" rel="noopener">' +
      esc(url.replace(/^https?:\/\//, '')) + '</a>' + (author ? ' · ' + esc(u('author')) + ': ' + esc(author) : '') +
      '<br>' + esc(u('summaryNote')) + '</p>';
  }
  function gallery(images) {
    if (!images || !images.length) return '';
    return '<div class="gallery">' + images.map((img) =>
      '<figure>' + imgTag(img) + (t(img.caption) ? '<figcaption>' + esc(t(img.caption)) + '</figcaption>' : '') + '</figure>'
    ).join('') + '</div><p class="small muted">' + esc(u('imageCredit')) + '</p>';
  }
  function treatmentLink(id, fallbackName) {
    const tr = state.treatments[id];
    const name = tr ? t(tr.name) : t(fallbackName) || id;
    return tr ? '<a href="#/t/' + esc(id) + '">' + esc(name) + '</a>' : '<strong>' + esc(name) + '</strong>';
  }
  function diseaseLink(id) {
    const d = state.diseases[id];
    return d ? '<a href="#/d/' + esc(id) + '">' + esc(t(d.name)) + '</a>' : esc(id);
  }

  /* ---------- tree ---------- */
  function buildParents() {
    state.parents = {};
    const nodes = state.tree.nodes;
    Object.keys(nodes).forEach((id) => {
      (nodes[id].options || []).forEach((opt, i) => {
        if (!state.parents[opt.next]) state.parents[opt.next] = { node: id, option: i };
      });
    });
  }
  function pathTo(nodeId) {
    // prefer in-memory trail when consistent, otherwise derive from the tree
    const trail = state.trail;
    if (trail.length) {
      const last = trail[trail.length - 1];
      const opt = state.tree.nodes[last.node] && state.tree.nodes[last.node].options[last.option];
      if (opt && opt.next === nodeId) return trail.slice();
    }
    const out = [];
    let cur = nodeId;
    let guard = 0;
    while (state.parents[cur] && guard++ < 50) {
      out.unshift(state.parents[cur]);
      cur = state.parents[cur].node;
    }
    return out;
  }
  function pathPanel(nodeId) {
    const p = pathTo(nodeId);
    const items = p.map((step) => {
      const n = state.tree.nodes[step.node];
      const opt = n.options[step.option];
      return '<li><span class="q">' + esc(t(n.short || n.q)) + '</span><a href="#/q/' + esc(step.node) + '">' + esc(t(opt.label)) + '</a></li>';
    }).join('');
    return '<aside class="side card"><h3>' + esc(u('yourAnswers')) + '</h3>' +
      (items ? '<ol class="path">' + items + '</ol>' : '<p class="muted small">' + esc(u('noAnswers')) + '</p>') +
      '<div class="btn-row">' +
      (p.length ? '<a class="btn ghost" href="#/q/' + esc(p[p.length - 1].node) + '">← ' + esc(u('back')) + '</a>' : '') +
      '<a class="btn ghost" href="#/q/' + esc(state.tree.start) + '" data-reset>' + esc(u('restart')) + '</a></div>' +
      '<p class="small"><a href="#/graph?at=' + esc(nodeId) + '">' + esc(u('showInGraph')) + '</a></p></aside>';
  }

  function renderQuestion(nodeId) {
    const n = state.tree.nodes[nodeId];
    if (!n) return renderNotFound();
    if (n.result) return renderResult(nodeId, n);
    const depth = pathTo(nodeId).length;
    const opts = n.options.map((opt, i) => {
      const img = opt.img ? thumb(opt.img) : '';
      return '<a class="option" href="#/q/' + esc(opt.next) + '" data-from="' + esc(nodeId) + '" data-opt="' + i + '">' + img +
        '<strong>' + esc(t(opt.label)) + '</strong>' +
        (opt.hint ? '<span>' + esc(t(opt.hint)) + '</span>' : '') +
        '<em class="go">' + esc(u('choose')) + ' →</em></a>';
    }).join('');
    app.innerHTML = '<div class="wizard"><section class="question">' +
      '<div class="stepper">' + esc(u('step', { n: depth + 1 })) + '</div>' +
      '<h1>' + esc(t(n.q)) + '</h1>' +
      (n.help ? '<p class="muted">' + esc(t(n.help)) + '</p>' : '') +
      '<div class="options">' + opts + '</div>' +
      (nodeId === state.tree.start ? '<div class="notice">' + esc(u('disclaimerShort')) + '</div>' : '') +
      '</section>' + pathPanel(nodeId) + '</div>';
  }

  function renderResult(nodeId, n) {
    const cands = n.result.map((id, i) => {
      const d = state.diseases[id];
      if (!d) return '';
      return '<article class="card candidate">' + (thumb(id) || '<div class="thumb"></div>') + '<div>' +
        '<div class="small muted">' + esc(i === 0 ? u('mostLikely') : u('alsoConsider')) + '</div>' +
        '<h3><a href="#/d/' + esc(id) + '">' + esc(t(d.name)) + '</a></h3>' +
        (d.scientific ? '<div class="sci">' + esc(d.scientific) + '</div>' : '') +
        diseaseTags(d) + '<p>' + esc(t(d.summary)) + '</p>' +
        '<a class="btn" href="#/d/' + esc(id) + '">' + esc(u('openDisease')) + ' →</a></div></article>';
    }).join('');
    app.innerHTML = '<div class="wizard"><section>' +
      '<div class="stepper">' + esc(u('result')) + '</div>' +
      '<h1>' + esc(t(n.title) || u('possibleCauses')) + '</h1>' +
      (n.note ? '<div class="notice info">' + esc(t(n.note)) + '</div>' : '') +
      '<div class="candidates">' + cands + '</div>' +
      '<div class="notice">' + esc(u('disclaimerShort')) + '</div>' +
      '</section>' + pathPanel(nodeId) + '</div>';
  }

  /* ---------- pages ---------- */
  function renderHome() {
    const featured = ['hybrid-ttm', 'ttm', 'copper', 'chloroquine-phosphate'].filter((id) => state.treatments[id]);
    app.innerHTML =
      '<section class="hero"><div><h1>' + esc(u('homeTitle')) + '</h1><p class="lead">' + esc(u('homeLead')) + '</p>' +
      '<div class="btn-row"><a class="btn" href="#/q/' + esc(state.tree.start) + '" data-reset>' + esc(u('startDiagnosis')) + ' →</a>' +
      '<a class="btn ghost" href="#/graph">' + esc(u('nav.graph')) + '</a>' +
      '<a class="btn ghost" href="#/diseases">' + esc(u('nav.diseases')) + '</a></div>' +
      '<div class="notice">' + esc(u('disclaimerShort')) + '</div></div>' +
      '<div class="hero-art"><img src="assets/favicon.svg" alt="" width="220" height="220"></div></section>' +
      '<h2>' + esc(u('nav.diseases')) + '</h2><div class="grid">' + state.diseaseOrder.map(diseaseTile).join('') + '</div>' +
      (featured.length ? '<h2>' + esc(u('keyMethods')) + '</h2><div class="grid">' + featured.map(treatmentTile).join('') + '</div>' : '');
  }

  function diseaseTile(id) {
    const d = state.diseases[id];
    return '<a class="tile" href="#/d/' + esc(id) + '">' + thumb(id) + '<h3>' + esc(t(d.name)) + '</h3>' +
      (d.scientific ? '<p><em>' + esc(d.scientific) + '</em></p>' : '') + diseaseTags(d) + '</a>';
  }
  function treatmentTile(id) {
    const tr = state.treatments[id];
    return '<a class="tile" href="#/t/' + esc(id) + '"><h3>' + esc(t(tr.name)) + '</h3>' +
      '<div class="tags"><span class="tag accent">' + esc(u('ttype.' + tr.type)) + '</span>' +
      (tr.reef_safe === true ? '<span class="tag ok">' + esc(u('reefSafe')) + '</span>' : '') +
      (tr.reef_safe === false ? '<span class="tag danger">' + esc(u('notReefSafe')) + '</span>' : '') + '</div>' +
      '<p>' + esc(t(tr.summary)) + '</p></a>';
  }

  function renderDiseases(query) {
    const areas = {};
    state.diseaseOrder.forEach((id) => (state.diseases[id].body_areas || []).forEach((a) => { areas[a] = true; }));
    const active = query.area || '';
    const q = (query.q || '').toLowerCase();
    const ids = state.diseaseOrder.filter((id) => {
      const d = state.diseases[id];
      if (active && !(d.body_areas || []).includes(active)) return false;
      if (!q) return true;
      const hay = [t(d.name), d.name && d.name.en, d.scientific, t(d.summary)].concat(tl(d.symptoms)).join(' ').toLowerCase();
      return hay.includes(q);
    });
    app.innerHTML = '<h1>' + esc(u('nav.diseases')) + '</h1><p class="muted">' + esc(u('diseasesLead')) + '</p>' +
      '<div class="filterbar"><input type="search" id="dsearch" placeholder="' + esc(u('search')) + '" value="' + esc(query.q || '') + '">' +
      '<button class="chip' + (active ? '' : ' on') + '" data-area="">' + esc(u('all')) + '</button>' +
      Object.keys(areas).sort().map((a) => '<button class="chip' + (active === a ? ' on' : '') + '" data-area="' + esc(a) + '">' + esc(u('area.' + a)) + '</button>').join('') +
      '</div><div class="grid">' + (ids.map(diseaseTile).join('') || '<p class="muted">' + esc(u('noMatch')) + '</p>') + '</div>';
    const input = document.getElementById('dsearch');
    input.addEventListener('change', () => setQuery({ q: input.value, area: active }));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') setQuery({ q: input.value, area: active }); });
    app.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => setQuery({ q: input.value, area: b.dataset.area })));
  }
  function setQuery(obj) {
    const qs = Object.keys(obj).filter((k) => obj[k]).map((k) => k + '=' + encodeURIComponent(obj[k])).join('&');
    location.hash = '#/diseases' + (qs ? '?' + qs : '');
  }

  function renderDisease(id) {
    const d = state.diseases[id];
    if (!d) return renderNotFound();
    const tx = (d.treatments || []).slice().sort((a, b) => prioRank(a.priority) - prioRank(b.priority)).map((x) =>
      '<div class="tx"><header>' + treatmentLink(x.treatment_id, x.name) +
      (x.priority ? '<span class="tag ' + (PRIORITY_CLASS[x.priority] || '') + '">' + esc(u('prio.' + x.priority)) + '</span>' : '') +
      '</header>' + (t(x.details) ? '<p>' + esc(t(x.details)) + '</p>' : '') + '</div>').join('');
    const subs = (d.subconditions || []).map((s) =>
      '<div class="tx"><header><strong>' + esc(t(s.name)) + '</strong></header>' + list(tl(s.symptoms)) +
      (t(s.treatment) ? '<p><strong>' + esc(u('treatment')) + ':</strong> ' + esc(t(s.treatment)) + '</p>' : '') + '</div>').join('');
    const related = (d.related_links || []).map((l) => '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(t(l.title) || l.url) + '</a></li>').join('');
    app.innerHTML =
      '<p class="small"><a href="#/diseases">← ' + esc(u('nav.diseases')) + '</a></p>' +
      '<div class="detail-head"><div><h1>' + esc(t(d.name)) + '</h1>' + (d.scientific ? '<div class="sci">' + esc(d.scientific) + '</div>' : '') + diseaseTags(d) + '</div>' +
      '<a class="btn ghost" href="#/q/' + esc(state.tree.start) + '" data-reset>' + esc(u('startDiagnosis')) + '</a></div>' +
      '<p class="lead">' + esc(t(d.summary)) + '</p>' +
      '<div class="cols"><div>' +
      (tl(d.symptoms).length ? '<h2>' + esc(u('symptoms')) + '</h2>' + list(tl(d.symptoms)) : '') +
      (tl(d.distinguish).length ? '<h2>' + esc(u('distinguish')) + '</h2>' + list(tl(d.distinguish)) : '') +
      (subs ? '<h2>' + esc(u('subconditions')) + '</h2>' + subs : '') +
      (tx ? '<h2>' + esc(u('treatments')) + '</h2>' + tx : '') +
      (tl(d.prevention).length ? '<h2>' + esc(u('prevention')) + '</h2>' + list(tl(d.prevention)) : '') +
      '</div><div>' +
      (d.images && d.images.length ? '<h2>' + esc(u('images')) + '</h2>' + gallery(d.images) : '') +
      (t(d.commonly_affected) ? '<h2>' + esc(u('commonlyAffected')) + '</h2><p>' + esc(t(d.commonly_affected)) + '</p>' : '') +
      (t(d.life_cycle) ? '<h2>' + esc(u('lifeCycle')) + '</h2><p>' + esc(t(d.life_cycle)) + '</p>' : '') +
      (t(d.notes) ? '<h2>' + esc(u('notes')) + '</h2><p>' + esc(t(d.notes)) + '</p>' : '') +
      (related ? '<h2>' + esc(u('furtherReading')) + '</h2><ul class="clean">' + related + '</ul>' : '') +
      '</div></div>' + sourceLine(d.source, d.author);
  }
  function prioRank(p) { return { 'first-line': 0, alternative: 1, supportive: 2, 'not-recommended': 3 }[p] != null ? { 'first-line': 0, alternative: 1, supportive: 2, 'not-recommended': 3 }[p] : 2; }

  function renderTreatments() {
    const groups = { method: [], procedure: [], medication: [] };
    state.treatmentOrder.forEach((id) => { (groups[state.treatments[id].type] || groups.medication).push(id); });
    app.innerHTML = '<h1>' + esc(u('nav.treatments')) + '</h1><p class="muted">' + esc(u('treatmentsLead')) + '</p>' +
      ['method', 'procedure', 'medication'].filter((g) => groups[g].length).map((g) =>
        '<h2>' + esc(u('ttypes.' + g)) + '</h2><div class="grid">' + groups[g].map(treatmentTile).join('') + '</div>').join('') +
      '<div class="notice">' + esc(u('dosageWarning')) + '</div>';
  }

  function renderTreatment(id) {
    const tr = state.treatments[id];
    if (!tr) return renderNotFound();
    const treats = (tr.treats || []).filter((x) => state.diseases[x]);
    const related = (tr.related_links || []).map((l) => '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(t(l.title) || l.url) + '</a></li>').join('');
    // diseases that reference this treatment
    const usedBy = state.diseaseOrder.filter((did) => (state.diseases[did].treatments || []).some((x) => x.treatment_id === id));
    const allTreats = Array.from(new Set(treats.concat(usedBy)));
    app.innerHTML =
      '<p class="small"><a href="#/treatments">← ' + esc(u('nav.treatments')) + '</a></p>' +
      '<h1>' + esc(t(tr.name)) + '</h1>' +
      '<div class="tags"><span class="tag accent">' + esc(u('ttype.' + tr.type)) + '</span>' +
      (tr.reef_safe === true ? '<span class="tag ok">' + esc(u('reefSafe')) + '</span>' : '') +
      (tr.reef_safe === false ? '<span class="tag danger">' + esc(u('notReefSafe')) + '</span>' : '') +
      (tr.aka || []).map((a) => '<span class="tag">' + esc(a) + '</span>').join('') + '</div>' +
      '<p class="lead">' + esc(t(tr.summary)) + '</p>' +
      '<div class="cols"><div>' +
      (tl(tr.steps).length ? '<h2>' + esc(u('steps')) + '</h2>' + steps(tl(tr.steps)) : '') +
      (t(tr.dosage) ? '<h2>' + esc(u('dosage')) + '</h2><p>' + esc(t(tr.dosage)) + '</p>' : '') +
      (t(tr.duration) ? '<h2>' + esc(u('duration')) + '</h2><p>' + esc(t(tr.duration)) + '</p>' : '') +
      (tl(tr.warnings).length ? '<h2>' + esc(u('warnings')) + '</h2><div class="notice">' + list(tl(tr.warnings)) + '</div>' : '') +
      '</div><div>' +
      (allTreats.length ? '<h2>' + esc(u('usedFor')) + '</h2><ul class="clean">' + allTreats.map((x) => '<li>' + diseaseLink(x) + '</li>').join('') + '</ul>' : '') +
      (tr.images && tr.images.length ? '<h2>' + esc(u('images')) + '</h2>' + gallery(tr.images) : '') +
      (related ? '<h2>' + esc(u('furtherReading')) + '</h2><ul class="clean">' + related + '</ul>' : '') +
      '</div></div>' +
      '<div class="notice">' + esc(u('dosageWarning')) + '</div>' + sourceLine(tr.source);
  }

  function renderQuarantine() {
    app.innerHTML = '<h1>' + esc(u('nav.quarantine')) + '</h1><p class="muted">' + esc(u('quarantineLead')) + '</p>' +
      state.quarantine.map((q) =>
        '<section class="card" style="margin-bottom:16px"><h2 style="margin-top:0">' + esc(t(q.name)) + '</h2>' +
        '<p>' + esc(t(q.summary)) + '</p>' +
        (tl(q.equipment).length ? '<h3>' + esc(u('equipment')) + '</h3>' + list(tl(q.equipment)) : '') +
        (tl(q.steps).length ? '<h3>' + esc(u('steps')) + '</h3>' + steps(tl(q.steps)) : '') +
        (tl(q.warnings).length ? '<h3>' + esc(u('warnings')) + '</h3><div class="notice">' + list(tl(q.warnings)) + '</div>' : '') +
        sourceLine(q.source) + '</section>').join('');
  }

  function renderSources() {
    const rows = [];
    state.diseaseOrder.forEach((id) => { const d = state.diseases[id]; rows.push([t(d.name), d.source, d.author]); });
    state.treatmentOrder.forEach((id) => { const tr = state.treatments[id]; if (tr.source) rows.push([t(tr.name), tr.source, '']); });
    state.quarantine.forEach((q) => { if (q.source) rows.push([t(q.name), q.source, '']); });
    const seen = {};
    const uniq = rows.filter((r) => { if (!r[1] || seen[r[1] + r[0]]) return false; seen[r[1] + r[0]] = true; return true; });
    const extra = (state.sources && state.sources.general) || [];
    app.innerHTML = '<h1>' + esc(u('nav.sources')) + '</h1>' +
      '<div class="notice info">' + esc(u('sourcesLead')) + '</div>' +
      '<h2>' + esc(u('primarySources')) + '</h2><ul class="clean">' + extra.map((s) =>
        '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(t(s.title)) + '</a>' + (s.note ? ' – <span class="muted">' + esc(t(s.note)) + '</span>' : '') + '</li>').join('') + '</ul>' +
      '<h2>' + esc(u('articleSources')) + '</h2><div class="table-scroll"><table class="simple"><thead><tr><th>' + esc(u('topic')) + '</th><th>' + esc(u('source')) + '</th><th>' + esc(u('author')) + '</th></tr></thead><tbody>' +
      uniq.map((r) => '<tr><td>' + esc(r[0]) + '</td><td><a href="' + esc(r[1]) + '" target="_blank" rel="noopener">' + esc(r[1].replace(/^https?:\/\//, '')) + '</a></td><td>' + esc(r[2] || '') + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<h2>' + esc(u('disclaimerTitle')) + '</h2><p>' + esc(u('disclaimerLong')) + '</p>' +
      '<h2>' + esc(u('translationTitle')) + '</h2><p>' + esc(u('translationNote')) + '</p>';
  }

  function renderNotFound() {
    app.innerHTML = '<h1>404</h1><p>' + esc(u('notFound')) + '</p><a class="btn" href="#/">' + esc(u('nav.home')) + '</a>';
  }

  /* ---------- graph ---------- */
  function renderGraph(query) {
    const nodes = state.tree.nodes;
    const NODE_W = 210, COL = 300, ROW_GAP = 14, PAD = 24, LINE = 15;
    const lay = {};
    const order = [];
    function wrap(text, max) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let cur = '';
      words.forEach((w) => {
        if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
      });
      if (cur) lines.push(cur);
      return lines;
    }
    function label(id) {
      const n = nodes[id];
      if (n.result) {
        return [u('possibleCauses') + ':'].concat(n.result.filter((x) => state.diseases[x]).map((x) => '• ' + t(state.diseases[x].name)));
      }
      return wrap(t(n.short || n.q), 30);
    }
    let y = PAD;
    const visited = {};
    function place(id, depth, answer) {
      if (visited[id]) return lay[id];
      visited[id] = true;
      const n = nodes[id];
      if (!n) return null;
      const lines = label(id).reduce((acc, l) => acc.concat(l.length > 32 ? wrap(l, 32) : [l]), []);
      const ans = answer ? wrap('↳ ' + answer, 36) : [];
      const h = (lines.length + ans.length) * LINE + 16;
      const opts = (n.options || []).filter((o) => nodes[o.next] && !visited[o.next]);
      const kids = opts.map((o) => o.next);
      const entry = { id, depth, lines, ans, h, x: PAD + depth * COL };
      lay[id] = entry;
      order.push(id);
      if (!kids.length) {
        entry.y = y; y += h + ROW_GAP;
      } else {
        const placed = opts.map((o) => place(o.next, depth + 1, t(o.label))).filter(Boolean);
        const top = placed[0].y, bottom = placed[placed.length - 1].y + placed[placed.length - 1].h;
        entry.y = (top + bottom) / 2 - h / 2;
        if (entry.y + h + ROW_GAP > y) y = entry.y + h + ROW_GAP;
      }
      return entry;
    }
    place(state.tree.start, 0);
    const maxDepth = Math.max.apply(null, order.map((id) => lay[id].depth));
    const W = PAD * 2 + maxDepth * COL + NODE_W;
    const H = Math.max(y + PAD, 200);

    const hl = {};
    const hlEdge = {};
    if (query.at && nodes[query.at]) {
      hl[query.at] = true;
      pathTo(query.at).forEach((s) => { hl[s.node] = true; hlEdge[s.node + '>' + nodes[s.node].options[s.option].next] = true; });
    }

    let edges = '', elabels = '', boxes = '';
    order.forEach((id) => {
      const a = lay[id];
      (nodes[id].options || []).forEach((o) => {
        const b = lay[o.next];
        if (!b) return;
        const x1 = a.x + NODE_W, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
        const mx = (x1 + x2) / 2;
        const key = id + '>' + o.next;
        edges += '<path class="edge' + (hlEdge[key] ? ' hl' : '') + '" d="M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2 + '"/>';
      });
      const n = nodes[id];
      const cls = 'node ' + (n.result ? 'd' : 'q') + (hl[id] ? ' hl' : '');
      boxes += '<g class="' + cls + '" data-node="' + esc(id) + '" tabindex="0" role="link"><title>' + esc(t(n.q || n.title || '')) + '</title>' +
        '<rect x="' + a.x + '" y="' + a.y + '" width="' + NODE_W + '" height="' + a.h + '"/>' +
        a.ans.map((l, i) => '<text class="elabel" x="' + (a.x + 10) + '" y="' + (a.y + 19 + i * LINE) + '">' + esc(l) + '</text>').join('') +
        a.lines.map((l, i) => '<text x="' + (a.x + 10) + '" y="' + (a.y + 20 + (i + a.ans.length) * LINE) + '">' + esc(l) + '</text>').join('') + '</g>';
    });

    document.querySelector('main').classList.add('wide');
    app.innerHTML = '<div style="max-width:1100px;margin:0 auto"><h1>' + esc(u('nav.graph')) + '</h1><p class="muted">' + esc(u('graphLead')) + '</p>' +
      '<div class="legend"><span><i style="border-color:var(--accent);background:var(--accent-soft)"></i>' + esc(u('legendQuestion')) + '</span>' +
      '<span><i style="border-color:var(--warn);background:var(--surface)"></i>' + esc(u('legendResult')) + '</span></div></div>' +
      '<div class="graph-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      edges + elabels + boxes + '</svg></div>';
    app.querySelectorAll('[data-node]').forEach((g) => {
      const go = () => { state.trail = []; location.hash = '#/q/' + g.dataset.node; };
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    });
    if (query.at && lay[query.at]) {
      const wrapEl = app.querySelector('.graph-wrap');
      wrapEl.scrollLeft = Math.max(0, lay[query.at].x - 80);
      wrapEl.scrollTop = Math.max(0, lay[query.at].y - 120);
    }
  }

  /* ---------- chrome ---------- */
  const NAV = [['home', '#/'], ['diagnose', '#/q/'], ['graph', '#/graph'], ['diseases', '#/diseases'], ['treatments', '#/treatments'], ['quarantine', '#/quarantine'], ['sources', '#/sources']];
  function renderChrome(route) {
    document.documentElement.lang = state.lang;
    document.getElementById('langToggle').textContent = state.lang === 'hu' ? 'EN' : 'HU';
    document.getElementById('langToggle').title = state.lang === 'hu' ? 'Switch to English' : 'Váltás magyarra';
    document.getElementById('mainnav').innerHTML = NAV.map(([k, h]) => {
      const href = k === 'diagnose' ? h + state.tree.start : h;
      const active = (k === 'home' && route === '') || (k === 'diagnose' && route === 'q') || (k === 'graph' && route === 'graph') ||
        (k === 'diseases' && (route === 'diseases' || route === 'd')) || (k === 'treatments' && (route === 'treatments' || route === 't')) ||
        (k === 'quarantine' && route === 'quarantine') || (k === 'sources' && route === 'sources');
      return '<a href="' + href + '"' + (active ? ' class="active"' : '') + (k === 'diagnose' ? ' data-reset' : '') + '>' + esc(u('nav.' + k)) + '</a>';
    }).join('');
    document.getElementById('footer').innerHTML = '<div class="inner"><span>' + esc(u('footerCredit')) + ' <a href="https://humble.fish/community/threads/fish-diseases.3/" target="_blank" rel="noopener">humble.fish</a>. ' +
      '<a href="#/sources">' + esc(u('nav.sources')) + '</a></span><span>' + esc(u('disclaimerShort')) + '</span></div>';
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [pathPart, qs] = raw.split('?');
    const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
    const query = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); query[k] = decodeURIComponent(v || ''); });
    return { parts, query };
  }

  function route() {
    const { parts, query } = parseHash();
    const r = parts[0] || '';
    document.querySelector('main').classList.remove('wide');
    renderChrome(r);
    switch (r) {
      case '': renderHome(); break;
      case 'q': renderQuestion(parts[1] || state.tree.start); break;
      case 'graph': renderGraph(query); break;
      case 'diseases': renderDiseases(query); break;
      case 'd': renderDisease(parts[1]); break;
      case 'treatments': renderTreatments(); break;
      case 't': renderTreatment(parts[1]); break;
      case 'quarantine': renderQuarantine(); break;
      case 'sources': renderSources(); break;
      default: renderNotFound();
    }
    const titleBits = { '': '', q: u('nav.diagnose'), graph: u('nav.graph'), diseases: u('nav.diseases'), treatments: u('nav.treatments'), quarantine: u('nav.quarantine'), sources: u('nav.sources') };
    let title = titleBits[r] || '';
    if (r === 'd' && state.diseases[parts[1]]) title = t(state.diseases[parts[1]].name);
    if (r === 't' && state.treatments[parts[1]]) title = t(state.treatments[parts[1]].name);
    document.title = (title ? title + ' · ' : '') + 'Fishy Doctor';
    window.scrollTo(0, 0);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('a.option[data-from]');
    if (opt) {
      const from = opt.dataset.from;
      const idx = parseInt(opt.dataset.opt, 10);
      const existing = pathTo(from);
      state.trail = existing.concat([{ node: from, option: idx }]);
    }
    if (e.target.closest('[data-reset]')) state.trail = [];
    const img = e.target.closest('.gallery img');
    if (img) openLightbox(img.src, img.dataset.cap);
  });
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (el.tagName !== 'IMG' || !el.closest('main')) return;
    const box = document.createElement('div');
    box.className = 'img-missing';
    box.textContent = u('imageUnavailable');
    el.replaceWith(box);
  }, true);

  const lb = document.getElementById('lightbox');
  function openLightbox(src, cap) {
    lb.querySelector('img').src = src;
    lb.querySelector('img').referrerPolicy = 'no-referrer';
    lb.querySelector('figcaption').textContent = cap || '';
    lb.hidden = false;
  }
  lb.addEventListener('click', () => { lb.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.hidden = true; });

  document.getElementById('langToggle').addEventListener('click', () => {
    state.lang = state.lang === 'hu' ? 'en' : 'hu';
    storage(false, 'fd-lang', state.lang);
    route();
  });

  /* ---------- boot ---------- */
  async function boot() {
    const urlLang = new URLSearchParams(location.search).get('lang');
    state.lang = urlLang || storage(true, 'fd-lang') || ((navigator.language || '').toLowerCase().startsWith('hu') ? 'hu' : 'en');
    if (state.lang !== 'hu') state.lang = 'en';
    try {
      const [ui, tree, manifest, tx, sources] = await Promise.all([
        getJSON('data/ui.json'), getJSON('data/tree.json'), getJSON('data/manifest.json'),
        getJSON('data/treatments.json'), getJSON('data/sources.json')
      ]);
      state.ui = ui;
      state.tree = tree;
      state.sources = sources;
      const ds = await Promise.all(manifest.diseases.map((id) => getJSON('data/diseases/' + id + '.json')));
      ds.forEach((d) => { state.diseases[d.id] = d; state.diseaseOrder.push(d.id); });
      state.diseaseOrder.sort((a, b) => t(state.diseases[a].name).localeCompare(t(state.diseases[b].name)));
      (tx.treatments || []).forEach((x) => { state.treatments[x.id] = x; state.treatmentOrder.push(x.id); });
      state.quarantine = tx.quarantine || [];
      buildParents();
    } catch (err) {
      app.innerHTML = '<div class="notice"><strong>Could not load data.</strong> ' + esc(err.message) +
        '<br>If you opened the file directly, serve the folder over HTTP (e.g. <code>npx serve .</code>).</div>';
      return;
    }
    window.addEventListener('hashchange', route);
    route();
  }
  boot();
})();
