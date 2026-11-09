// Validates the data files: JSON syntax, references between tree, diseases and treatments.
// Usage: node tools/validate.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const read = (p) => {
  try { return JSON.parse(readFileSync(join(root, p), 'utf8')); } catch (e) { errors.push(`${p}: ${e.message}`); return null; }
};

const manifest = read('data/manifest.json') || { diseases: [] };
const tx = read('data/treatments.json') || { treatments: [] };
const tree = read('data/tree.json') || { nodes: {} };
read('data/ui.json');
read('data/sources.json');

const diseases = {};
for (const id of manifest.diseases) {
  const p = `data/diseases/${id}.json`;
  if (!existsSync(join(root, p))) { errors.push(`missing ${p}`); continue; }
  const d = read(p);
  if (!d) continue;
  if (d.id !== id) errors.push(`${p}: id "${d.id}" does not match file name`);
  if (!d.source) warnings.push(`${p}: no source`);
  diseases[id] = d;
}
const treatments = Object.fromEntries(tx.treatments.map((t) => [t.id, t]));

for (const [id, d] of Object.entries(diseases)) {
  for (const t of d.treatments || []) {
    if (!treatments[t.treatment_id]) warnings.push(`disease ${id}: treatment "${t.treatment_id}" has no entry in treatments.json (shown without link)`);
  }
}
for (const t of tx.treatments) {
  for (const did of t.treats || []) if (!diseases[did]) errors.push(`treatment ${t.id}: unknown disease "${did}"`);
}

const nodes = tree.nodes || {};
if (!nodes[tree.start]) errors.push(`tree: start node "${tree.start}" missing`);
const parents = {};
const reached = new Set();
for (const [id, n] of Object.entries(nodes)) {
  if (n.result) {
    for (const did of n.result) if (!diseases[did]) errors.push(`tree ${id}: unknown disease "${did}"`);
    continue;
  }
  if (!n.q) errors.push(`tree ${id}: question without "q"`);
  for (const o of n.options || []) {
    if (!nodes[o.next]) errors.push(`tree ${id}: option points to missing node "${o.next}"`);
    if (parents[o.next]) warnings.push(`tree: node "${o.next}" has several parents (${parents[o.next]}, ${id})`);
    parents[o.next] = id;
    reached.add(o.next);
    if (o.img) {
      const [ref, idx] = o.img.split('#');
      const d = diseases[ref];
      if (!d) errors.push(`tree ${id}: img references unknown disease "${ref}"`);
      else if (!d.images || !d.images[Number(idx || 0)]) warnings.push(`tree ${id}: img "${o.img}" not found`);
    }
  }
}
for (const id of Object.keys(nodes)) if (id !== tree.start && !reached.has(id)) warnings.push(`tree: node "${id}" is unreachable`);
const inTree = new Set(Object.values(nodes).flatMap((n) => n.result || []));
for (const id of Object.keys(diseases)) if (!inTree.has(id)) warnings.push(`disease ${id} is never reached by the tree`);

warnings.forEach((w) => console.log('warn  ' + w));
errors.forEach((e) => console.log('ERROR ' + e));
console.log(`${Object.keys(diseases).length} diseases, ${tx.treatments.length} treatments, ${Object.keys(nodes).length} tree nodes – ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
