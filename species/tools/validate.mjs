// Checks the species database and lists what is missing or not usable on the cards.
// Usage: node species/tools/validate.mjs [path/to/db.json]
// Exit code 1 = errors that break or hide card content; warnings are gaps worth filling in the next data round.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || join(here, '../../databases/reef42_marine_life_db_v1.json');
const db = JSON.parse(readFileSync(file, 'utf8'));
const S = db.species || [];
const GENERIC_MIN = 5; // keep in sync with species/assets/app.js

// Values the cards have labels for (species/assets/app.js ENUM).
const ENUMS = {
  care_level: ['easy', 'easy_moderate', 'moderate', 'difficult', 'expert'],
  reef_compatibility: ['reef_safe', 'reef_safe_with_caution', 'conditional'],
  temperament: ['peaceful', 'peaceful_pair', 'shoaling', 'peaceful_territorial', 'semi_territorial', 'territorial', 'semi_aggressive'],
  diet: ['omnivore', 'carnivore', 'herbivore', 'herbivore_omnivore', 'omnivore_planktivore', 'detritivore_herbivore', 'specialized_microfauna',
    'omnivore_scavenger', 'carnivore_scavenger', 'scavenger_carnivore', 'herbivore_grazer', 'specialized_biofilm_feeder'],
  coral_type: ['SPS', 'LPS', 'soft', 'zoanthid'],
  lighting: ['low', 'low_moderate', 'moderate', 'moderate_high', 'high'],
  flow: ['low_moderate', 'moderate', 'moderate_strong', 'strong'],
  placement: ['upper', 'middle_upper', 'middle', 'middle_lower', 'bottom_middle', 'bottom'],
  growth_rate: ['slow', 'slow_moderate', 'moderate', 'moderate_fast', 'fast'],
  aggression: ['low_moderate', 'moderate', 'high', 'very_high', 'chemical'],
  feeding: ['photosynthetic_with_optional_target_feeding']
};

const errors = [];
const warn = new Map(); // message -> [ids]
const w = (msg, id) => { if (!warn.has(msg)) warn.set(msg, []); warn.get(msg).push(id); };
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Same normalisation as species/assets/app.js: www, case, "-"/"_" and a trailing slash do not make a different page; homepages give null.
const urlKey = (u) => {
  try {
    const x = new URL(u);
    const path = x.pathname.replace(/\/+$/, '');
    if (!path && !x.search) return null;
    return (x.hostname.replace(/^www\./, '') + path + x.search).toLowerCase().replace(/_/g, '-');
  } catch { return null; }
};

// Texts / URLs repeated across many species = template filler (hidden on the cards).
const count = new Map();
const add = (x) => { if (x) count.set(x, (count.get(x) || 0) + 1); };
S.forEach((s) => {
  [...(s.extra_notes || []), ...(s.pro_tips || []), ...(s.behavior?.notes || []), ...(s.ethical_index?.reasons || [])].forEach(add);
  add(s.feeding?.notes);
  new Set((s.sources || []).map((x) => urlKey(x.url)).filter(Boolean)).forEach(add);
});
const generic = new Set([...count].filter(([, c]) => c >= GENERIC_MIN).map(([k]) => k));

const ids = new Set(S.map((s) => s.id));
const seenIds = new Set();
const prevIds = new Set();
for (const s of S) {
  const id = s.id || '(no id)';
  if (seenIds.has(id)) errors.push(id + ': duplicate id');
  seenIds.add(id);
  for (const k of ['id', 'category', 'scientific_name', 'common_name', 'care_level']) if (!s[k]) errors.push(id + ': missing ' + k);
  if (s.previous_id) {
    if (ids.has(s.previous_id) || prevIds.has(s.previous_id)) errors.push(id + ': previous_id "' + s.previous_id + '" is also used by another species');
    prevIds.add(s.previous_id);
  }
  // No Hungarian name is fine (no forced translation): the card then shows the English common name.
  if (!s.hu_name && !s.hu_name_review_status) w('no Hungarian name and no note on why', id);
  const sg = s.subgroup && s.subgroup.id;
  if (!sg) errors.push(id + ': missing subgroup');
  else if (!db.subgroups?.[s.category]?.[sg]) w('subgroup missing from the top-level subgroups list (listed last)', id + ' → ' + sg);
  const img = s.image_reference || {};
  if (!urlKey(img.source_page_url) && !urlKey(img.commons_search_url)) w('no photo link', id);
  if (!['fish', 'coral', 'invert'].includes(s.category)) errors.push(id + ': unknown category ' + s.category);
  if (s.id && s.scientific_name && s.id !== slug(s.scientific_name)) w('id differs from the scientific name (typo, or a renamed genus?)', id + ' → ' + slug(s.scientific_name));
  const en = (k, v) => { if (v != null && !ENUMS[k].includes(v)) errors.push(id + ': unknown ' + k + ' "' + v + '" (not shown)'); };
  en('care_level', s.care_level);

  if (s.category === 'coral') {
    en('coral_type', s.coral_type); en('lighting', s.lighting?.level); en('flow', s.flow?.level); en('placement', s.placement);
    en('growth_rate', s.growth_rate); en('aggression', s.aggression); en('feeding', s.feeding?.type);
    if (!s.lighting?.par_range_umol_m2_s) w('no PAR range', id);
    if (!s.size_cm?.maximum && !s.size_cm?.typical) w('no size', id);
  } else {
    en('reef_compatibility', s.aquarium_requirements?.reef_compatibility); en('temperament', s.behavior?.temperament); en('diet', s.diet?.type);
    if (!s.minimum_tank_size_l) w('no minimum tank size', id);
    if (!s.size_cm?.maximum) w('no maximum size', id);
    if (!s.lifespan_years?.wild || !s.lifespan_years?.aquarium) w('lifespan missing (wild and/or aquarium) – needed for the ethical comparison', id);
    if (!s.diet?.description) w('no diet description (only the diet type is shown)', id);
  }
  if (!(s.origin?.regions || []).length) w('no origin region', id);

  const e = s.ethical_index;
  if (!e) w('no ethical index', id);
  else {
    if (e.status !== 'reviewed') w('ethical index not reviewed (only "not_recommended" is shown)', id);
    if (!(e.reasons || []).some((r) => !generic.has(r))) w('ethical index has only template reasons', id);
  }
  const notes = [...(s.behavior?.notes || []), ...(s.extra_notes || [])].filter((x) => !generic.has(x));
  if (!notes.length) w('no species-specific notes', id);

  const keys = (s.sources || []).map((x) => urlKey(x.url));
  const real = keys.filter(Boolean);
  if (new Set(real).size !== real.length) w('same source page listed more than once (merged on the card)', id);
  if (keys.some((k) => !k)) w('site homepage given as source (hidden)', id);
  if (real.some((k) => generic.has(k))) w('same source URL as many other species, not species-specific (hidden)', id);
  const usable = new Set(real.filter((k) => !generic.has(k)));
  if (!usable.size) w('no species-specific source at all', id);
  else if (usable.size < 2) w('only one species-specific source (no cross-check)', id);
}

const genericTexts = [...generic].filter((x) => !/^https?:/.test(x));
console.log(file + '\n' + S.length + ' species: ' + ['fish', 'coral', 'invert'].map((c) => S.filter((s) => s.category === c).length + ' ' + c).join(', ') + '\n');
console.log(errors.length ? 'ERRORS (' + errors.length + ')\n  ' + errors.join('\n  ') + '\n' : 'No errors.\n');
console.log('WARNINGS');
for (const [msg, list] of [...warn].sort((a, b) => b[1].length - a[1].length)) {
  console.log('  ' + msg + ': ' + list.length + (list.length < S.length ? ' – ' + list.join(', ') : ' (all)'));
}
if (genericTexts.length) console.log('\nTEMPLATE TEXTS (repeated on ' + GENERIC_MIN + '+ species, hidden on the cards)\n  ' + genericTexts.map((x) => '"' + x.slice(0, 110) + (x.length > 110 ? '…' : '') + '" ×' + count.get(x)).join('\n  '));
process.exit(errors.length ? 1 : 0);
