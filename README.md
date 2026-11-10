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
invertebrate pages (`#/fish`, `#/corals`, `#/inverts`). Each category shows its types (the `subgroup` of each species, e.g.
surgeonfish, SPS) as a photo grid in the order of the top-level `subgroups` object, each type lists its species
(`#/fish/surgeonfish`), and each species has its own card (`#/fish/surgeonfish/<id>`). Searching on a category page lists
matching species from all its types. Older links (`#/<id>`, `#/fish/<id>`) redirect to the current address.
It reads `databases/reef42_marine_life_db_v1.json`. Empty fields are not shown; texts and source links repeated on 5+ species count as template
filler and are hidden, and the same page listed twice is shown once with what it backs up.

Photos come from `databases/reef42_species_images.json`: one freely licensed Wikimedia Commons file per species (CC0, public
domain, CC BY, CC BY-SA), loaded from Wikimedia and shown with author, licence and a link to the file page, as the licences
require. Run `node species/tools/images.mjs` after adding species: it keeps the chosen files, refreshes their licence data and
picks a photo for new species, which should be checked by eye. To swap a photo, change its `file` and run it again. The shop
pages linked in `image_reference` (ReefApp, Tidal Gardens) are copyrighted and are only linked, never embedded. Species without a Hungarian name show the English common name. An id renamed
in the data keeps working if the species lists the old one as `previous_id`. While ethical scores are provisional, only
"not recommended" species show the ethical index.
Run `node species/tools/validate.mjs` after every data update: it lists errors and missing data per species.

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
