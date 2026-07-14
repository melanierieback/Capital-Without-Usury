# Capital Without Usury: Book Reader

Online reader for **Capital Without Usury: Jewish, Christian, and Islamic Finance from Scripture to Non-Extractive Capital** (working manuscript, 55 units: Preface, Chapters 1–45, Comparative Interludes I–II, Conclusion, Appendices A–F).

**Live site:** https://melanierieback.github.io/Capital-Without-Usury/

The reader is the same Vite + React + Tailwind app as the [Moral Economy reader](https://github.com/melanierieback/Moral-Economy-Book) (live at https://melanierieback.github.io/Moral-Economy-Book/), loaded with the Capital Without Usury text. It is fully static: all content is bundled at build time from `artifacts/book-reader/src/data/book.json`; nothing is fetched at runtime.

## How it deploys

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the reader with `BASE_PATH=/Capital-Without-Usury/` and publishes `artifacts/book-reader/dist/public` to GitHub Pages. No manual steps. **This repo is the reader's source of truth.**

Build locally:

```bash
corepack enable && corepack install --global pnpm@10
pnpm install --filter @workspace/book-reader...
BASE_PATH=/Capital-Without-Usury/ pnpm --filter @workspace/book-reader build   # output: artifacts/book-reader/dist/public
PORT=5000 pnpm --filter @workspace/book-reader serve                           # preview the build
```

(Note: `pnpm-workspace.yaml` pins platform binaries to linux-x64, so installs are meant for CI and Linux cloud sessions, not macOS.)

## Deep links (stable contract)

Routing is hash-based. `#<chapter-slug>` opens a unit; `#<section-slug>` opens a unit at a section. Examples:

- `…/Capital-Without-Usury/#chapter-11-societas-iska-mudarabah-commenda`
- `…/Capital-Without-Usury/#chapter-19-damnum-emergens-actual-loss-to-avoid-a-loss`

Slugs are derived from the unit label plus title (chapter slugs) and the section heading (section slugs, prefixed by their chapter slug; the unheaded opening of each unit is `<chapter-slug>-intro`). **Treat slugs as permanent once published.** External sites and the planned Contract Analyzer deep links depend on them; do not rename chapters or section headings in `book.json` without updating every inbound link.

## Updating the book text

The manuscript lives outside this repo (the `Book Rewrites/Capital Without Usury/drafts/` folder: `ch00.md`, `ch01`–`ch45`, `int1`, `int2`, `conc`, `appA`–`appF`). To refresh the reader after the drafts change:

```bash
python3 tools/build_book_json.py /path/to/Capital\ Without\ Usury/drafts
git commit -am "Refresh book text" && git push   # Pages redeploys automatically
```

The converter mirrors the book's own `assemble.py` (unit order, Part divisions), strips each draft's provenance header, splits `##` headings into sections, and converts markdown emphasis, hyperlinks, and numbered lists into the HTML the reader renders. Hyperlinks in the text (for example the source links in Appendix F) are preserved and open in a new tab.

## Cover art

`attached_assets/capital-without-usury-cover.png` is currently a **typographic placeholder**. To install the real cover: overwrite that file with the final image (same filename; portrait, about 1086 x 1448 px), run `python3 tools/make_placeholder_art.py --og-only` to refresh the social-share card (`opengraph.jpg`), commit, and push. No code change is needed.

## Repo layout

```
artifacts/book-reader/   the Vite + React reader (src/data/book.json = the text)
attached_assets/         cover art, NEC logo, hero background
tools/build_book_json.py drafts -> book.json converter
tools/make_placeholder_art.py  placeholder cover + opengraph card generator
.github/workflows/       Pages deploy on push to main
```

Design notes for the reader's NEC visual identity are in `artifacts/book-reader/DESIGN.md`. The reader stores reading position and theme under the localStorage keys `cwu-last-chapter` and `cwu-dark-mode` (namespaced so it does not collide with the Moral Economy reader on the same domain).
