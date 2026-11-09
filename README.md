# reef42

A collection of small tools for saltwater aquarium keepers. The root `index.html` is the hub page;
each tool lives in its own folder.

| Tool | Folder | Description |
| --- | --- | --- |
| fishy doctor | [`fishy-doctor/`](fishy-doctor/) | Bilingual (English / Hungarian) fish disease identification and treatment guide based on humble.fish |

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

1. Put the tool in its own folder with an `index.html`, using relative paths only.
2. Add a card for it to the grid in the root `index.html` (copy the existing `<li>`).
3. Add a row to the table above.
