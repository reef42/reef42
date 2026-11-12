# reef42

A collection of small tools for saltwater aquarium keepers. The root `index.html` is the hub page;
each tool lives in its own folder.

| Tool | Folder | Description |
| --- | --- | --- |
| fishy doctor | [`fishy-doctor/`](fishy-doctor/) | Bilingual (English / Hungarian) fish disease identification and treatment guide based on humble.fish |
| tank log | [`tank-log/`](tank-log/) | Bilingual water parameter log with test-kit timers, target ranges, charts, multiple tanks and sharing; data stays in the browser |
| calculators | [`calculators/`](calculators/) | Bilingual reef calculators: tank volume, salt mix, salinity correction, sand bed, phosphate media, water change and unit converters |
| species | [`species/`](species/) | Bilingual species care cards (draft data): overview with fish, coral and invertebrate lists, one card per species |
| links | [`links/`](links/) | Filterable list of Hungarian, European and international shops, communities, manufacturers and tools; edit `links/links.js` to add entries (logos in `links/logos/`) |

### Species database

[`species/`](species/) is one tool with three categories: an overview (`species/#/`) leads to the fish, coral and
invertebrate pages (`#/fish`, `#/corals`, `#/inverts`). Each category shows its types (the `category` of each entry, e.g.
surgeonfish, SPS) as a photo grid in the order of `taxonomy.json`, each type lists its species (`#/fish/surgeonfish`), and
each species has its own card (`#/fish/surgeonfish/<id>`). The `lps-*` coral types are grouped under one LPS main type
(`#/corals/lps/lps-brain/<id>`; `PARENTS` in the build script). Searching on a category page lists matching species from all its
types. Older links (`#/<id>`, `#/fish/<id>`, old type names) redirect to the current address, or to the category if the
species is no longer in the data.

The source of the data is [`databases/data/`](databases/data/) (schema in [`databases/README.md`](databases/README.md)).
After every change run `node species/tools/build.mjs`: it checks the data (required fields, enum values, disease references,
photos) and writes `databases/reef42_species.json`, the only file the page loads. With errors it writes nothing.
Reef42's own verdicts live apart from the delivered data in `databases/reef42_verdicts.json` (`"<id>": { "recommendation":
"not_recommended", "reason": { "hu", "en" } }`); such species get a "Reef42: not recommended" badge and the reason on the card.

The diseases listed on a card link to the Fishy Doctor page of the same id (`fishy-doctor/data/diseases/<id>.json`, aliases in
`FD_ALIAS` in the build script); the others are shown by name only. Photos are freely licensed Wikimedia Commons files loaded
from Wikimedia and shown with author, licence and a link to the file page, as the licences require. Species without a
Hungarian name show the English name.

## Running locally

Everything is static HTML/CSS/JS with no build step. Serve the repository root over HTTP:

```sh
npx serve .
```

Then open the printed URL. The hub is at `/`, the tools at `/<folder>/`.

## Deploying to GitHub Pages

Push the repository and enable **Settings → Pages → Deploy from a branch** (`main`, root folder).
The `.nojekyll` file makes Pages serve the files as-is. All paths are relative, so the site works
under `https://<user>.github.io/<repo>/` as well as on a custom domain.

## Adding a tool

1. Put the tool in its own folder with an `index.html`, using relative paths only. For the language picker, load
   `../shared/lang.js` and call `reef42Lang.mount(button, { get, set })` on the topbar's language button.
2. Add a card for it to the grid in the root `index.html` (copy the existing `<li>`).
3. Add a row to the table above.
