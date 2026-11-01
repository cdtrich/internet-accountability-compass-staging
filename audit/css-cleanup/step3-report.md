# CSS cleanup, step 3: verification

Date: 2026-11-01. Branch `feature/css-cleanup`, commits fbb0f73..20506d0 on top
of eadd799 (11 commits, nothing pushed). Step 0 evidence: step0-report.md.
All numbers below are measured unless marked otherwise.

## Result

**Visual no-op, confirmed.** 39 of 39 screenshot captures are pixel-identical
before vs after. The computed styles of every rendered element in 28 cases
differ in one way only: the removed, unused custom property `--font-big`.
The build output differs only in the two style.css files. CSS on top-level
pages shrank by 5,940 B gzip (−27 % of the page's own CSS), on country pages
by 2,802 B gzip (−14 %).

## What changed in src/style.css

| | eadd799 | HEAD |
|---|---|---|
| Lines | 2,264 | 1,329 |
| Style rules / @keyframes | 363 / 3 | 204 / 1 |

Commits (each one revertible on its own; selectors listed in each message):

| Commit | Content |
|---|---|
| fbb0f73 | (i) bucket 1b: code-block/copy button, hljs, notes, `.plot-d6a7b5` |
| ebcd498 | (ii) bucket 1a: Framework sidebar, TOC, footer, search, links, draft + 5 @media; `@media print` and the main/header/footer list split |
| 36b7aad | (iii) our 2 overrides for the disabled TOC |
| a6e486d | header comment + notes on kept `#observablehq-*` rules (comments only) |
| 8ebb81b | 2a: `#hero-image`, `heading-center`, `.blog-divider`, `#countryButton`, `.card .key` (+640px copy), `.back-to-root*`, `.img-col` |
| 52650b8 | 2b: `.down-arrow`, `@keyframes jumpInfinite` |
| 6b0a54b | 2c: toggle switch (11 rules); src/toggleSwitch.css kept as recovery copy |
| 005e01a | 2d: `.big/.small/.red/.yellow/.green/.blue/.muted`, `--font-big` |
| ce37820 | 2e: `.grid-cols-2`, `.grid-colspan-*`, `.grid-rowspan-*` |
| 20506d0 | header comment updated for step 2 (comments only) |

Every commit was checked with `scripts/rule-diff.cjs`, a semantic diff of
(context, selector) → declarations against the previous commit. Each one
removed exactly the planned selectors, added nothing, and changed nothing else.
The comment-only commits are identical to their parent with comments stripped.
Removals were made by exact source ranges (`scripts/prune.cjs`), so all kept
text is byte-for-byte unchanged.

Every remaining `#observablehq-*` rule in style.css (6) has a one-line comment
saying whether it is ours or a Framework copy. sidebar.css has 3
`#observablehq-*` rules of our own (the sidebar work); they are out of scope.

## Build

`npm run build` (production base path) passes: 1,221 links validated, no
errors or warnings. `scripts/dist-diff.cjs`: of 283 files in dist/, 281 are
identical before vs after once the style.css content hash in file names and
references is normalised. The 2 that differ are `_import/style.*.css` and
`_file/style.*.css`. So no HTML, JS, data, country page or template output changed.

## Pixel and computed-style diff (`step3/`)

Matrix as agreed: home, methodology, perspectives, AUS, MHL at 1200×800 and
375×667 standalone, perspectives also at 768×1024, iframe for home and AUS at
375×667. Each case: first viewport + 2 scroll positions (39 PNGs). Computed
styles only (no PNGs): countries, directions, resources, the prototype, AFG,
DNK, BRA at both sizes, and home at 1200×800 under emulated print media
(covers the `@media print` split). 28 cases, 121 to 8,317 elements each.
Capture order: before, after, before, against two builds served side by side.

- **Reproducibility:** the new BEFORE run reproduces all 52 file hashes of the
  first noise floor (noise-floor/before-1.sha256), byte for byte.
- **Noise floor** (before vs before, `step3/noise/`): 39/39 PNGs identical;
  computed styles identical in 26 of 28 cases. The exception is the prototype. It renders
  a table of render timings it measures itself (ms), so table width and page height
  change every run (only `width/height/*-size/*-origin/top/bottom` on 16-44
  elements; no cascade property).
- **Before vs after** (`step3/before-vs-after/`):
  - pixels: **39/39 identical**.
  - computed styles: in every case the only changed property is `--font-big`,
    on every element (custom properties inherit) and pseudo-element. Country
    pages: `900 32px/1 …` → `700 32px/1 …` (theme-air's own value takes over).
    Top-level pages: `900 32px/1 …` → not set. No rendered property uses it:
    its only user was `.big`, removed in the same commit, and no page has a `.big`.
    Print (home): the same, nothing else. The `#observablehq-center` print padding is intact.
  - **Prototype** (internal, src/prototypes/radial): `--font-big` plus exactly
    its own noise set (table width, page height), nothing else. Correction
    to step 0: its `<pre id="radial-metrics">` is built at runtime by a cell, so
    Framework's copy-button code (which wraps `<pre>` present at load) never
    wrapped it. No pre-container, copy button or hljs styling ever applied, so
    commit (i) does not change it. The step 0 grep had matched the cell's source text.
- Console errors and 404s: identical before and after (only the local
  `favicon.ico` 404). Page dimensions (scrollWidth/Height) identical except the
  prototype's timing-dependent height.

PNGs were deleted after each diff. Kept: `pixel-diff.json`,
`style-diff-summary.json` (per case: changed properties and distinct value
pairs; the full per-element diff, ~30 MB, stays outside the repo), a SHA-256
manifest and log per run.

## CSS bytes (measured from dist/, `step3/css-bytes.json`)

| Page type | style.css copies | style.css raw | style.css gzip -9 | all own CSS on the page, gzip -9 |
|---|---|---|---|---|
| Top-level (index) | 2 | 86,387 → 49,958 (−36,429) | 19,654 → 13,714 (−5,940) | 22,355 → 16,415 (−26.6 %) |
| Top-level (methodology) | 2 | same | same | 21,942 → 16,002 (−27.1 %) |
| Country (AFG) | 1 | 51,494 → 31,776 (−19,718) | 11,350 → 8,548 (−2,802) | 20,293 → 17,491 (−13.8 %) |
| Prototype | 1 (bundle) | 34,893 → 18,182 (−16,711) | 8,304 → 5,166 (−3,138) | −37.8 % |

gzip -6 (a common server default) gives nearly the same deltas: −6,024 B
top-level, −2,861 B country. Transfer size in Lighthouse (local server, gzip
-6 + headers): home 20.2 → 14.2 KB, AFG 11.7 → 8.8 KB.

## Lighthouse (ranges only; 5 runs each, before/after interleaved)

Lighthouse 13.4.1, mobile, performance only, local builds served with gzip
(`step3/lighthouse-ranges.json`):

| Page | Build | Perf | FCP s | LCP s | CLS | TBT ms |
|---|---|---|---|---|---|---|
| home | before | 37-81 | 2.32-3.45 | 2.80-12.50 | 0.000-0.002 | 440-10,162 |
| home | after | 34-81 | 2.39-3.96 | 2.75-13.31 | 0.000-0.002 | 484-2,032 |
| AFG | before | 36-39 | 2.53-3.29 | 10.20-10.38 | 0.012-0.323 | 549-1,885 |
| AFG | after | 35-39 | 2.98-3.62 | 10.21-10.41 | 0.000-0.323 | 626-2,411 |

The ranges overlap completely, so no effect can be read from them, and none is
expected from a CSS no-op of ~6 KB. Acceptance rests on the pixel and computed-style
diffs and the byte counts above.

## Candidates noticed (not done; need a decision)

- `--theme-caret`, `--theme-toggle`, `--theme-magnifier` (`:root` in the copy):
  used only by the removed sidebar/search icons; probably unused now.
- `#observablehq-center { background: none !important }`: no loaded stylesheet
  sets a background there, so it is a no-op today.
- `--font-small`: its users (`.small`, the copy-button "Copied!") are gone; kept
  because it was not in the approved list.

## Proposal (not implemented): drop the duplicate page-level style.css link

**Change:** remove `<link rel="stylesheet" href="style.css">` from the 6
top-level pages (src/index.md, countries.md, directions.md, resources.md,
perspectives.md, methodology.md). The template and the 194 country pages stay as they are, so no
regeneration. Those pages keep the config bundle, which is byte-identical to a
minified build of the same file (step 0). Country pages are unaffected: they do
not load the bundle and keep their own link.

**Saving (measured on the built files, per top-level page):** one request less and
31,776 B raw / 8,548 B gzip -9 less CSS (the unminified copy). That is −52 % of
their own CSS after the cleanup (16.4 → 7.9 KB gzip).

**Risk checked: sidebar.css would load after style.css** and win
equal-specificity conflicts. Measured with a simulated build. The 6 built
top-level HTML files had exactly that one `<link>` removed (copy of the AFTER
build; the .md files were not touched, so the working tree incl. your
perspectives.md edit is unchanged). Same matrix and capture as step 3
(`proposal-drop-duplicate-link/`), against a fresh AFTER run that reproduced the
earlier AFTER manifest byte for byte:
- pixels: **39/39 identical**.
- computed styles: no rendered property changes on any element, in any case
  (top-level pages at both widths, iframe, print). The only differences are
  the text of 12 custom properties (`--sans-serif`, `--serif`,
  `--theme-foreground-*`, `--theme-background-alt/-b`, `--syntax-comment`,
  `--font-small`, `--font-very-big`). They are identical except for whitespace:
  minified in the bundle, multi-line in the raw file. Country pages and the
  prototype: no differences.
- static check: the only selector + property that both sidebar.css and
  style.css define is `:root { --sans-serif }`, with the same font list wrapped differently.

Not covered: states the capture does not trigger (hover, focus, open mobile
drawer). sidebar.css and style.css share no hover/focus selector, but rules
with different selectors and equal specificity can only be checked in a browser.
Suggest a manual check of the drawer and nav hover on staging.

**If approved:** one commit touching only the 6 .md files (perspectives.md has
your uncommitted edit: I would stage only the link line, or you commit your
edit first). Rollback: `git revert`. Also update the style.css header
comment ("they get it twice").
