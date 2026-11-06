# Fishy Doctor

Interactive, bilingual (English / Hungarian) identification guide for common saltwater fish diseases.
Answer picture-guided questions to narrow down the likely cause, then read the matching treatment
options and methods (copper, chloroquine phosphate, Tank Transfer Method, Hybrid TTM, etc.).

All disease and treatment content is summarised from the
[humble.fish Fish Diseases index](https://humble.fish/community/threads/fish-diseases.3/) and the threads
it links to. Every page links back to its source article. This is an unofficial project, not affiliated
with humble.fish, and not veterinary advice.

## Running locally

The site is plain HTML/CSS/JS with no build step. It loads JSON with `fetch`, so it must be served over HTTP:

```sh
npx serve .
# or
npx http-server .
```

Then open the printed URL.

## Deploying to GitHub Pages

Push the repository and enable **Settings → Pages → Deploy from a branch** (`main`, root folder).
The `.nojekyll` file makes Pages serve the files as-is.

## Editing content

| File | Contents |
| --- | --- |
| `data/diseases/<id>.json` | One file per disease: symptoms, distinguishing features, treatments, images, source |
| `data/manifest.json` | List of disease ids to load |
| `data/treatments.json` | Medications, methods (TTM, Hybrid TTM, …) and quarantine protocols |
| `data/tree.json` | The decision graph (questions, options, results) |
| `data/ui.json` | Interface texts |
| `data/sources.json` | General source list shown on the Sources page |

Every text field is an object with `en` and `hu` keys, e.g. `{ "en": "Symptoms", "hu": "Tünetek" }`.
If the `hu` value is missing or empty, the English text is shown.

The Hungarian texts are currently machine translated and awaiting review. Scientific names, product
names and some hobby terms (TTM, QT, …) are intentionally kept in English.

### Decision graph format

```json
{
  "start": "root",
  "nodes": {
    "root": {
      "q": { "en": "Question?", "hu": "Kérdés?" },
      "short": { "en": "Short label for the graph", "hu": "…" },
      "help": { "en": "Optional help text", "hu": "…" },
      "options": [
        { "label": { "en": "…", "hu": "…" }, "hint": { "en": "…", "hu": "…" }, "img": "marine-ich#0", "next": "r-ich" }
      ]
    },
    "r-ich": { "result": ["marine-ich", "marine-velvet"], "note": { "en": "…", "hu": "…" } }
  }
}
```

`img` references a picture of a disease (`<disease-id>#<image index>`). Each node should have only one parent
so the answer path can be reconstructed from the URL.

Run `node tools/validate.mjs` after editing to check JSON validity and that every reference resolves.

## Image credits

Pictures are embedded from the original humble.fish threads; copyright belongs to their respective owners.
