// Keeps databases/reef42_species_images.json in step with the species database.
// Usage: node species/tools/images.mjs
//
// - Species already in the photo file keep their chosen file; author, licence and thumbnails are refreshed from Wikimedia Commons.
//   To swap a photo, change its "file" (the Commons file name, without "File:") and run this again.
// - New species get their Wikidata taxon image (falling back to a Commons search) and are listed as NEW: check those by eye,
//   the automatic pick is sometimes another species, a drawing or a museum specimen.
// - Only freely licensed files are kept (CC0, public domain, CC BY, CC BY-SA, "No restrictions").
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DB = join(root, 'databases/reef42_marine_life_db_v1.json');
const OUT = join(root, 'databases/reef42_species_images.json');
const db = JSON.parse(readFileSync(DB, 'utf8'));
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).images || {} : {};

const UA = { 'user-agent': 'reef42-species-images/1.0 (static site build script)' };
const FREE = /^(cc0|cc by(-sa)? \d\.\d( [a-z-]+)?|public domain|no restrictions)$/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 6; i++) {
    await sleep(1500); // Wikimedia rate-limits fast clients
    const r = await fetch(url, { headers: UA });
    if (r.status === 429) { await sleep(5000 * (i + 1)); continue; }
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return r.json();
  }
  throw new Error('rate limited: ' + url);
}
const strip = (h) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const cleanAuthor = (a) => {
  a = strip(a).replace(/^No machine-readable author provided\.\s*/i, '').replace(/\s*assumed \(based on copyright claims\)\.?/i, '').trim();
  return a && a !== '?' ? a : null;
};

// 1) Chosen file per species: keep earlier choices, look up new species.
const pick = {};
const fresh = [];
for (const s of db.species) if (prev[s.id] && prev[s.id].file) pick[s.id] = prev[s.id].file;
const missing = db.species.filter((s) => !pick[s.id]);
if (missing.length) {
  const values = missing.map((s) => JSON.stringify(s.scientific_name)).join(' ');
  const wd = await get('https://query.wikidata.org/sparql?format=json&query=' +
    encodeURIComponent(`SELECT ?name ?img WHERE { VALUES ?name { ${values} } ?item wdt:P225 ?name; wdt:P18 ?img. }`));
  for (const b of wd.results.bindings) {
    const s = missing.find((x) => x.scientific_name === b.name.value);
    if (s && !pick[s.id]) pick[s.id] = decodeURIComponent(b.img.value.split('/Special:FilePath/')[1]).replace(/_/g, ' ');
  }
  for (const s of missing) {
    if (!pick[s.id]) {
      const r = await get('https://commons.wikimedia.org/w/api.php?format=json&action=query&list=search&srnamespace=6&srlimit=1&srsearch=' +
        encodeURIComponent('intitle:"' + s.scientific_name + '" filemime:image/jpeg'));
      const hit = r.query.search[0];
      if (hit) pick[s.id] = hit.title.replace(/^File:/, '');
    }
    if (pick[s.id]) fresh.push(s.id);
  }
}

// 2) Licence, author and two thumbnail sizes from Commons.
const files = [...new Set(Object.values(pick))];
const info = {};
for (const width of [500, 960]) {
  for (let i = 0; i < files.length; i += 25) {
    const r = await get('https://commons.wikimedia.org/w/api.php?format=json&action=query&prop=imageinfo&iiprop=url|size|mime|user|extmetadata&iiurlwidth=' +
      width + '&titles=' + encodeURIComponent(files.slice(i, i + 25).map((f) => 'File:' + f).join('|')));
    const norm = Object.fromEntries((r.query.normalized || []).map((n) => [n.to, n.from]));
    for (const p of Object.values(r.query.pages)) {
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii) continue;
      const key = (norm[p.title] || p.title).replace(/^File:/, '');
      const m = ii.extmetadata || {};
      info[key] = info[key] || {
        file: key, page_url: ii.descriptionurl, width: ii.width, height: ii.height,
        author: cleanAuthor(m.Artist && m.Artist.value) || cleanAuthor(m.Credit && m.Credit.value) || cleanAuthor(ii.user),
        license: strip(m.LicenseShortName && m.LicenseShortName.value) || null,
        license_url: (m.LicenseUrl && m.LicenseUrl.value) || null
      };
      info[key]['thumb_' + width] = String(ii.thumburl).replace(/\?utm_[^#]*$/, ''); // drop Commons' tracking parameters
    }
  }
}

// 3) Write, keeping hand-written notes (e.g. "shell", "genus-level photo").
const images = {};
const problems = [];
for (const s of db.species) {
  const file = pick[s.id];
  const i = file && info[file];
  if (!i) { problems.push(s.id + ': no photo found' + (file ? ' (' + file + ' is missing on Commons)' : '')); continue; }
  if (!FREE.test(i.license || '')) { problems.push(s.id + ': ' + file + ' is not freely licensed (' + i.license + ')'); continue; }
  images[s.id] = { ...i, ...(prev[s.id] && prev[s.id].note ? { note: prev[s.id].note } : {}) };
}
writeFileSync(OUT, JSON.stringify({
  title: 'Reef42 species photos',
  description: 'One freely licensed Wikimedia Commons photo per species, keyed by species id. Images are linked from Wikimedia, not stored. ' +
    'Show the author, licence and a link to the file page next to every image. Refresh with: node species/tools/images.mjs',
  generated_at: new Date().toISOString().slice(0, 10),
  images
}, null, 2) + '\n');

console.log(Object.keys(images).length + ' / ' + db.species.length + ' species have a photo.');
if (fresh.length) console.log('\nNEW, check by eye:\n  ' + fresh.map((id) => id + ': ' + (images[id] ? images[id].page_url : pick[id])).join('\n  '));
if (problems.length) console.log('\nPROBLEMS:\n  ' + problems.join('\n  '));
