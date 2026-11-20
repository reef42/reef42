# reef42

A collection of small tools for saltwater aquarium keepers. The root `index.html` is the hub page;
each tool lives in its own folder.

| Tool | Folder | Description |
| --- | --- | --- |
| fishy doctor | [`fishy-doctor/`](fishy-doctor/) | Bilingual (English / Hungarian) fish disease identification and treatment guide based on humble.fish |
| tank log | [`tank-log/`](tank-log/) | Bilingual water parameter log with test-kit timers, target ranges, charts, multiple tanks set up with a wizard, livestock with a fit estimate, and sharing; data stays in the browser |
| calculators | [`calculators/`](calculators/) | Bilingual reef calculators: tank volume, salt mix, salinity correction, sand bed, phosphate media, water change and unit converters |
| species | [`species/`](species/) | Bilingual species care cards (draft data): overview with fish, coral and invertebrate lists, one card per species |
| glossary | [`glossary/`](glossary/) | Bilingual reef keeping glossary with search and a letter index; the same terms are underlined with a hover/tap hint on every page (see below) |
| reef game | [`reef-game/`](reef-game/) | Bilingual virtual reef tank for beginners: set up, cycle, stock and care for a tank, with missions, events and a memorial; saved in the browser with JSON import/export (design in [`reef-game/README.md`](reef-game/README.md)) |
| links | [`links/`](links/) | Filterable list of Hungarian, European and international shops, communities, manufacturers and tools; edit `links/links.js` to add entries (logos in `links/logos/`) |

### Species database

[`species/`](species/) is one tool with three categories: an overview (`species/#/`) leads to the fish, coral and
invertebrate pages (`#/fish`, `#/corals`, `#/inverts`). Each category shows its types (the `category` of each entry, e.g.
surgeonfish, SPS) as a photo grid in the order of `taxonomy.json`, each type lists its species (`#/fish/surgeonfish`), and
each species has its own card (`#/fish/surgeonfish/<id>`). The `lps-*` coral types are grouped under one LPS main type
(`#/corals/lps/lps-brain/<id>`; `PARENTS` in the build script). Searching on a category page lists matching species from all its
types. Older links (`#/<id>`, `#/fish/<id>`, old type names) redirect to the current address, or to the category if the
species is no longer in the data.

The source of the data is [`databases/data/`](databases/data/) (field reference in
[`databases/data/SCHEMA.md`](databases/data/SCHEMA.md)). After every change run `node species/tools/build.mjs`: it checks the
data (required fields, enum values, disease references, photos, the `compat` field) and writes `databases/reef42_species.json`,
the only file the page loads. With errors it writes nothing.

Fit estimate: each fish, coral and invertebrate has a `compat` field (temperament, what it eats, how many fit in one tank,
rival species, how settled the tank must be, partners…). [`shared/compat.js`](shared/compat.js) judges a species against a
tank (type, volume, start date, livestock) and lists every reason; Tank Log uses it for the livestock, and the species pages for
the user's Tank Log tanks (a badge on the tiles, the reasons on the card, a "hide not recommended" switch kept in
`localStorage['reef42-species-hidebad']` that also updates the "n species" counts on the tiles and greys out empty ones, and a
"My species" tile and page, `#/mine`, with the tank's livestock). A tank's planned livestock (`plan` in Tank Log) is judged
too: the card shows the estimate with the current livestock and, when there is a plan, with the planned livestock as well,
and the tiles get a second badge when the plan changes the verdict. Without a tank set up, the species pages show a hint that
links to the Tank Log wizard.

The species pages have a toolbar in the sticky header on every page: back, search (the overview and "My species" search all
species; on a type or species page typing jumps to the category's results) and the "hide not recommended" switch. Care
level is shown as 1–3 dots (green, orange, red; difficult and expert both three). Diseases a species is more prone to
(`disease_risk`) come first on the card with their level and reason; species with a juvenile photo (`image_juvenile`) get an
Adult / Juvenile switch on the photo.
Reef42's own verdicts live apart from the delivered data in `databases/reef42_verdicts.json` (`"<id>": { "recommendation":
"not_recommended", "reason": { "hu", "en" } }`); such species get a "Reef42: not recommended" badge and the reason on the card.

The diseases listed on a card link to the Fishy Doctor page of the same id (`fishy-doctor/data/diseases/<id>.json`, aliases in
`FD_ALIAS` in the build script); the others are shown by name only. Photos are freely licensed Wikimedia Commons files loaded
from Wikimedia and shown with author, licence and a link to the file page, as the licences require. Species without a
Hungarian name show the English name.

### Glossary

The terms live in [`glossary/terms.json`](glossary/terms.json): per term an `id`, `hu` / `en` `name` and `def`, related ids in
`see`, and `match` patterns: `match.hu` and `match.en` are case-insensitive regular expressions for that language (Hungarian
patterns spell out the suffixes, e.g. `detritu(?:sz|ss)\\p{L}*`), `match.abbr` are case-sensitive ones for both languages (`KH`,
`SPS`). A match may not start or end inside a word. Every page loads [`shared/glossary.js`](shared/glossary.js), which
underlines the first use of each term inside `<main>` (not in links, buttons, headings, form controls, dialogs, `.tag` / `.chip`
or anything under `data-no-gloss`) and shows the definition on hover, focus or tap with a link to `glossary/#/<id>`. It rescans
whenever the page re-renders. Check new patterns against the real texts before adding them: a word with several meanings (e.g.
the Hungarian "ciklus") is better left out than linked to the wrong definition.

On the species overview each category tile shows a mosaic of four random species photos, and each type tile a random photo of
its species; the picks are made once per page load.

## Access gate

While the site is under development, every page loads [`shared/gate.js`](shared/gate.js) in its `<head>`: a full-screen
overlay that asks for a password and links to the Discord server for access. After the right password the browser remembers
it (`localStorage['reef42-gate']`) for every tool. It only hides the pages; the password and all files stay public. To open
the site, remove the `gate.js` script tag from each `index.html`.

## What's new window

Every page loads [`shared/whatsnew.js`](shared/whatsnew.js), which shows the release notes once per new version, after the
gate and after any dialog the page opens itself. The newest seen version is kept in `localStorage['reef42-seen-version']`;
first-time visitors get a three-step welcome tour instead (what reef42 is, set up your tank in Tank Log with a link to its
wizard, underlined glossary terms), which also marks the current notes as seen. For a new release, add an entry to the top of `VERSIONS` in that file (`id` is
the date, `YYYY-MM-DD`, with `hu` and `en` bullet lists).

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
