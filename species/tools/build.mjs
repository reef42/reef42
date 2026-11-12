// Builds databases/reef42_species.json (loaded by species/) from databases/data/ and checks the data.
// Usage: node species/tools/build.mjs   – writes nothing if there are errors.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(root, 'databases/data');
const OUT = join(root, 'databases/reef42_species.json');
const FD = join(root, 'fishy-doctor/data/diseases');
const DIRS = { fish: 'fish', coral: 'corals', invertebrate: 'invertebrates', disease: 'diseases' };
// Disease ids that differ from the Fishy Doctor file name.
const FD_ALIAS = { velvet: 'marine-velvet' };
// Categories with this id prefix are grouped under one main category; their names lose the "LPS – " part.
const PARENTS = { coral: { lps: { prefix: 'lps-', en: 'LPS (Large Polyp Stony)', hu: 'LPS (nagy polipú kemény korallok)' } } };

const COMMON = ['id', 'group', 'category', 'scientific_name', 'name_en', 'name_hu', 'difficulty', 'notes', 'diseases', 'sources', 'image', 'feeding', 'origin'];
const KEYS = {
  fish: [...COMMON, 'size_cm', 'lifespan_wild_years', 'lifespan_captivity_years', 'tank_min_l', 'tank_ideal_l', 'utility', 'reef_safety', 'behavior'],
  coral: [...COMMON, 'type', 'light', 'flow', 'growth', 'placement', 'aggression'],
  disease: ['id', 'group', 'category', 'name_en', 'name_hu', 'pathogen', 'affected', 'symptoms', 'causes', 'prevention', 'treatment', 'warnings', 'sources']
};
KEYS.invertebrate = KEYS.fish;
const TEXTS = {
  fish: ['behavior', 'feeding', 'origin', 'notes'],
  coral: ['type', 'placement', 'aggression', 'feeding', 'origin', 'notes'],
  invertebrate: ['behavior', 'feeding', 'origin', 'notes']
};
const ENUMS = { fish: ['difficulty', 'reef_safety'], coral: ['difficulty', 'light', 'flow', 'growth'], invertebrate: ['difficulty', 'reef_safety'] };
const RANGES = ['size_cm', 'lifespan_wild_years', 'lifespan_captivity_years'];

const errors = [];
const warnings = [];
const err = (id, m) => errors.push(id + ': ' + m);
const warn = (id, m) => warnings.push(id + ': ' + m);
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

const tax = read(join(SRC, 'taxonomy.json'));
const entries = [];
for (const [group, dir] of Object.entries(DIRS)) {
  for (const f of readdirSync(join(SRC, dir)).filter((x) => x.endsWith('.json')).sort()) {
    read(join(SRC, dir, f)).forEach((e) => {
      if (e.group !== group) err(e.id, `group "${e.group}" in ${dir}/${f}`);
      entries.push(e);
    });
  }
}

const ids = new Set();
entries.forEach((e) => {
  if (!e.id) { err('?', 'entry without id: ' + (e.name_en || e.scientific_name)); return; }
  if (ids.has(e.id)) err(e.id, 'duplicate id');
  ids.add(e.id);
});
const diseaseIds = new Set(entries.filter((e) => e.group === 'disease').map((e) => e.id));
const fdIds = new Set(existsSync(FD) ? readdirSync(FD).filter((x) => x.endsWith('.json')).map((x) => x.slice(0, -5)) : []);

const isText = (v) => v && typeof v === 'object' && typeof v.en === 'string' && typeof v.hu === 'string' && v.en.trim() && v.hu.trim();
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function licenseUrl(l) {
  const m = /^CC (BY(?:-SA)?) (\d\.\d)$/i.exec(String(l || '').trim());
  if (m) return 'https://creativecommons.org/licenses/' + m[1].toLowerCase() + '/' + m[2] + '/';
  if (/^CC0/i.test(l || '')) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  return '';
}
// Wikimedia serves the same file in standard widths; tiles load 500 px, the card 960/1280 px.
// The page falls back to the original url if a width is not served.
function photo(e) {
  const img = e.image;
  if (!img || !img.url || !img.source_page || !img.license) { warn(e.id, 'no usable photo (url, source_page and license are needed)'); return null; }
  let u;
  try { u = new URL(img.url); } catch (x) { err(e.id, 'bad image url'); return null; }
  u.search = '';
  if (u.hostname === 'thumb.wikimedia.org') u.hostname = 'upload.wikimedia.org';
  const url = u.toString();
  const m = /^(.*\/thumb\/.+\/)(\d+)px-([^/]+)$/.exec(url);
  const o = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/)([0-9a-f]\/[0-9a-f]{2}\/)([^/]+)$/.exec(url);
  const at = (w) => {
    if (m) return Number(m[2]) >= w ? m[1] + w + 'px-' + m[3] : null;
    if (o && /\.(jpe?g|png)$/i.test(o[3])) return o[1] + 'thumb/' + o[2] + o[3] + '/' + w + 'px-' + o[3];
    return null;
  };
  const author = img.author && !/^unknown$/i.test(img.author.trim()) ? img.author.trim() : '';
  if (!author) warn(e.id, 'photo author unknown');
  if (!licenseUrl(img.license) && !/public domain/i.test(img.license)) warn(e.id, 'no licence link for "' + img.license + '"');
  return { url, thumb_500: at(500), thumb_960: at(960), page: img.source_page, author, license: img.license, license_url: licenseUrl(img.license) };
}

const species = [];
const diseases = {};
entries.forEach((e) => {
  if (!e.id) return;
  const g = e.group;
  if (!KEYS[g]) { err(e.id, 'unknown group ' + g); return; }
  if (!(tax.categories[g] || {})[e.category]) err(e.id, 'category "' + e.category + '" is not in taxonomy.json');
  Object.keys(e).forEach((k) => { if (!KEYS[g].includes(k)) warn(e.id, 'unknown field "' + k + '" (ignored)'); });
  if (!e.name_en) err(e.id, 'name_en missing');
  if (!e.name_hu) warn(e.id, 'name_hu missing – the English name is shown');

  if (g === 'disease') {
    ['affected', 'symptoms', 'treatment'].forEach((k) => { if (!isText(e[k])) warn(e.id, k + ' missing or not bilingual'); });
    const fd = FD_ALIAS[e.id] || e.id;
    diseases[e.id] = { category: e.category, name_en: e.name_en, name_hu: e.name_hu || '', fishy_doctor: fdIds.has(fd) ? fd : null };
    return;
  }

  if (!e.scientific_name) err(e.id, 'scientific_name missing');
  TEXTS[g].forEach((k) => { if (e[k] != null && !isText(e[k])) warn(e.id, k + ' is not a {hu, en} text'); });
  ENUMS[g].forEach((k) => { if (!(tax.enums[k] || {})[e[k]]) err(e.id, k + ' "' + e[k] + '" is not in taxonomy.json'); });
  (e.utility || []).forEach((v) => { if (!tax.enums.utility[v]) err(e.id, 'utility "' + v + '" is not in taxonomy.json'); });
  RANGES.forEach((k) => {
    const r = e[k];
    if (r == null) return;
    if (!r || (r.min != null && !isNum(r.min)) || (r.max != null && !isNum(r.max))) warn(e.id, k + ' is not a {min, max} range');
  });
  ['tank_min_l', 'tank_ideal_l'].forEach((k) => { if (e[k] != null && !isNum(e[k])) warn(e.id, k + ' is not a number'); });
  (e.diseases || []).forEach((d) => { if (!diseaseIds.has(d)) err(e.id, 'disease "' + d + '" does not exist'); });
  (e.sources || []).forEach((s) => { if (!s || !s.url || !s.name) warn(e.id, 'source without name or url'); });

  const out = {};
  KEYS[g].forEach((k) => { if (e[k] != null && k !== 'image') out[k] = e[k]; });
  const p = photo(e);
  if (p) out.image = p;
  species.push(out);
});

const count = (g) => species.filter((s) => s.group === g).length;
console.log(`fish ${count('fish')} · corals ${count('coral')} · invertebrates ${count('invertebrate')} · diseases ${Object.keys(diseases).length}` +
  ` (${Object.values(diseases).filter((d) => d.fishy_doctor).length} linked to Fishy Doctor)`);
warnings.forEach((m) => console.log('warning  ' + m));
errors.forEach((m) => console.log('ERROR    ' + m));
if (errors.length) {
  console.log(`\n${errors.length} error(s): ${OUT} was not written.`);
  process.exit(1);
}

const shortName = (s) => { const x = s.replace(/^[^–]+–\s*/, ''); return x.charAt(0).toUpperCase() + x.slice(1); };
// Main categories in taxonomy order; a grouped one takes the place of its first member and lists the members as children.
function tree(g) {
  const out = {};
  const parents = PARENTS[g] || {};
  Object.entries(tax.categories[g]).forEach(([id, name]) => {
    const pid = Object.keys(parents).find((p) => id.startsWith(parents[p].prefix));
    if (!pid) { out[id] = name; return; }
    if (!out[pid]) out[pid] = { en: parents[pid].en, hu: parents[pid].hu, children: {} };
    out[pid].children[id] = { en: shortName(name.en), hu: shortName(name.hu) };
  });
  return out;
}
const categories = {};
['fish', 'coral', 'invertebrate'].forEach((g) => { categories[g] = tree(g); });
writeFileSync(OUT, JSON.stringify({ version: tax.version, updated: tax.updated, categories, enums: tax.enums, species, diseases }) + '\n');
console.log(`\nWritten: ${OUT} (${warnings.length} warning(s))`);
