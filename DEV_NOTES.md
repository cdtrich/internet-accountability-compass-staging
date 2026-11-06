# Dev notes: traps and tooling

Durable notes for working on this repo. Imported by CLAUDE.md. Status and plan
live in v3_BRIEF.md; per-change detail in CHANGELOG_V3.md.

## Git and build

- `npm run build` rewrites the tracked `src/.observablehq/cache/_build.json`.
  Before committing: `git restore src/.observablehq/cache/_build.json`.
- Data-loader cache (`src/.observablehq/cache/data/`) is reused unless the
  loader script is newer than the cached output. Input files (the xlsx) are
  not checked. Building an old commit in a fresh worktree re-runs the R loaders
  (cache not tracked): slow; copy the cache dir instead.
- `npm run build` validates ~1,221 links; ~45 s to 2.5 min on this machine.
- `dist/` is not tracked. When serving it yourself, don't let the browser cache
  HTML (hashed asset names change per build).

## Framework behaviour

- Paths in config `head`/`header` must be root-relative to src/ without the
  base (`/countries`, `/sidebar.css`). Framework rewrites them page-relative; a
  base-prefixed href doubles the base in production.
- A `<head>` block in a .md page is rendered inside `<main>` in `<body>`, not in
  the document head. Its stylesheets load after the sidebar.
- Stylesheet stacks differ by page type:
  - top-level pages: config `style` (style.css minified into `_import/style.*.css`),
    sidebar.css (config `head`), then style.css AGAIN via the page's own link.
  - country pages (`theme: air` in front matter): Framework's theme-air
    (global, layout, grid, note, card, inspector, plot, syntax) + sidebar.css +
    style.css once. The config `style` bundle is not loaded.
    Any Framework default can therefore apply on country pages only. Test both.
- Pages with their own front-matter `head:` lose the global head (staging
  noindex label, sidebar.css), e.g. src/prototypes/radial.md.
- Framework's `a[href]` colour beats single-class selectors; use `.x a[href]`.
- `style.css` forces `svg text` to 16px Nunito Sans `!important`, overriding
  font sizes set in chart code.
- After any change to stylesheet order, diff computed styles on ALL top-level
  pages, including forced states (audit/css-cleanup/scripts/states.cjs, ties.cjs):
  equal-specificity ties flip silently and PNGs alone will not show them.

## Country pages

- `src/1generateCountryPages.r` does a plain placeholder replace of
  `src/1countryPageTemplate.md` into src/<ISO3>/index.md. Regenerating needs
  the user's OK; check `git diff --stat` afterwards.

## Tooling (no admin rights)

- No Python, no Playwright, no `gh`. Node 20.19, R 4.3.3
  (`/c/Program Files/R/R-4.3.3/bin/x64/Rscript`), Chrome at
  `/c/Program Files/Google/Chrome/Application/chrome.exe`.
- Git Bash rewrites args like `/AFG/` into Windows paths: prefix the command
  with `MSYS_NO_PATHCONV=1` (full `http://…/AFG/` URLs are safe).
- Lighthouse: `npx -y lighthouse@13.4.1` with `CHROME_PATH` set. The npx cache
  also contains puppeteer-core (`%LOCALAPPDATA%/npm-cache/_npx/<hash>/node_modules`),
  usable for screenshots without installing anything.
- css-tree is in node_modules (Framework dependency): usable for CSS analysis.
- Raw DevTools protocol: Chrome `--headless=new --remote-debugging-port=…`,
  Node `--experimental-websocket`. For cross-origin iframe network data add
  `--disable-site-isolation-trials --disable-features=IsolateOrigins,site-per-process`.
- Reusable scripts: audit/css-cleanup/scripts/ (zero-dep gzip static server,
  local iframe harness with `?src=`, screenshot matrix, CSS comparison).
- Screenshots: don't use puppeteer `fullPage: true` on chart pages. It resizes the
  viewport to the document height, `resize()` cells rebuild their charts and the
  capture catches them mid-animation. Capture the viewport at fixed scroll
  positions (audit/css-cleanup/scripts/shoot.cjs does this, plus the determinism
  settings and computed-style dumps; compare-runs.sh diffs two runs and deletes
  the PNGs).
- `getComputedStyle` lists custom properties in no fixed order: sort before
  hashing or diffing.
- Lighthouse on this machine is noisy (mobile LCP 2.8-12.6 s across 5 runs of
  the same build). For no-op changes use pixel diffs and byte counts as
  acceptance; report Lighthouse as ranges.

## Large files

- Don't commit screenshot sets (tens of MB). Commit reports and a SHA-256
  manifest; delete PNGs after the diff (audit/css-cleanup/.gitignore also ignores \*.png).

## Data refresh

Framework rebuilds src/.observablehq/cache/data/\*.csv only when the loader
script is newer than the cache. It does not look at the xlsx. CI has no R and
builds from the committed cache. After changing a workbook in src/data/:

1. Delete src/.observablehq/cache/data/dfiCardinal.csv and dfiFull.csv.
2. Run npm run dev (or npm run build) once so R regenerates them.
3. Check git status shows both CSVs modified, then commit them, then push.
