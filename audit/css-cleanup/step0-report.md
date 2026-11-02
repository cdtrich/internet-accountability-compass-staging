# CSS cleanup, step 0: inventory (no edits)

Date: 2026-10-31. Branch `feature/css-cleanup` from `dev` (eadd799). Nothing in
src/ changed. Framework 1.13.3. Build: `npm run build`, production base path,
passes (2 m 28 s; R loaders not re-run: every cache is newer than its loader).

Evidence files in this folder:
- `compare-output.json`: every rule in style.css compared with Framework's CSS
  (`scripts/compare.cjs`, css-tree from node_modules; no install)
- `noise-floor/`: before-vs-before pixel diff, computed-style diff, SHA-256
  manifests and run logs (console errors, 404s, overflow) for the reduced matrix (§6)
- `lighthouse-before/`: Lighthouse 13.4.1 JSON, mobile
- The runtime selector-match data quoted in §4 (142 of 479 selectors) comes from the
  first capture run. Its JSON was later overwritten by a capture-script bug, so the numbers
  are kept here only; `scripts/shoot.cjs` no longer collects it.
- `scripts/`: the analysis, server, screenshot scripts (for step 3)

DEV_NOTES.md, referenced in CLAUDE.md and v3_BRIEF.md, does not exist.

## 1. Stylesheets in src/

| File | Raw B | Gzip B | Linked from |
|---|---|---|---|
| style.css | 51,494 | 11,350 | config `style` (bundled by Framework into `_import/style.*.css`: 34,893 B / 8,304 gz) AND page-level `<link>` in all 6 top-level pages + the country template |
| sidebar.css | 6,439 | 2,288 | config `head`, every page except src/prototypes/ (own `head:`) |
| custom-legend.css | 1,401 | 617 | page-level: directions, resources, template |
| modeToggle.css | 902 | 413 | page-level: index, countries, directions, template |
| toggleSwitch.css | 1,297 | 525 | **nowhere**: only inside HTML comments. Duplicate of style.css 804-871 |
| tour.css | n/a | | does not exist yet |

Framework also loads: `theme-air.*.css` (24,191 B / 5,625 gz) on country pages,
`stdlib/inputs.*.css` (3,999 / 1,116) on directions, and Google Fonts
"Source Serif 4" on every page.

## 2. Stylesheet stack per page type (from built dist/ HTML)

The page-level `<head>` block in the .md files is **not** in `<head>`:
Framework renders it inside `<main id="observablehq-main">` in `<body>`.

**Top-level (index; methodology, countries, resources, perspectives the same, minus the optional files):**

| # | Where | Sheet |
|---|---|---|
| 1 | head | Google Fonts Source Serif 4 (Framework) |
| 2 | head | `_import/style.59eb95fc.css` = style.css, minified (config `style`) |
| (2b) | head | `stdlib/inputs.css` (directions only) |
| 3 | head | `sidebar.css` (config `head`) |
| 4 | body | Google Fonts Noto Sans + Nunito Sans + PT Sans |
| 5 | body | `style.css` **again**, unminified |
| 6 | body | modeToggle.css / custom-legend.css where linked |

**Country page (AFG):** 1 Source Serif 4; 2 `theme-air.css` (= Framework
global + layout + grid + note + card + inspector + plot + syntax-light + air
colours); 3 sidebar.css; then in body: 4 Google Fonts; 5 style.css;
6 modeToggle.css; 7 custom-legend.css. The config `style` bundle is NOT loaded.

**Prototype (src/prototypes/radial.md, front-matter `head:`):** Source Serif 4;
`_import/style.css`; the page's inline `<style>`. No sidebar.css.

**Premise check:** confirmed, with two corrections.
- Top-level pages load no Framework CSS. "Only the config style.css" is right,
  but they load it **twice** (8.3 KB gz minified + 11.4 KB gz raw, about 19.7 KB gz
  for one file). The second copy comes after sidebar.css, so style.css wins
  over sidebar.css on equal specificity on both page types.
- Country pages get theme-air (all of Framework's default CSS) plus style.css once.

## 3. Framework copies in style.css

style.css has 358 style rules (incl. nested in @media/@container, keyframes).
Ours: 150. Framework copies: 208 (below). Lines 635-2153 are mostly a copy of an **older**
Framework's default CSS (sidebar/toc breakpoints `calc(912px + 6rem)`,
`calc(832px + 6rem)`, while 1.13.3 uses `calc(640px + 6rem + 272px)`,
`calc(640px + 5rem + 192px)`). Our own rules are mixed into that range
(700-703, 804-935, 1009, 1101, 1574-1741, 2155+).

Comparison method: each rule × selector × property compared with the same
selector in Framework 1.13.3 (`node_modules/@observablehq/framework/dist/style/`
global, layout, grid, note, card, inspector, plot, syntax-light,
abstract-light, theme-air), within the same @media/@container context.
`:after` and `::after` count as the same. Per-rule detail: `compare-output.json`.

Class (a), Framework-named selectors (`#observablehq-*`, `.observablehq*`,
`observablehq-loading`, `.hljs-*`): **121 rules**. Class (a'), Framework copies
with generic selectors (`html`, `body`, `h1`-`h6`, `table`, `pre`, `.grid*`,
`.note`, `.card`, `.big`, `:root` variables …): **87 rules**. You did not list
(a') in the task, but these matter most for top-level pages.

### Bucket 1a: dead on both stacks (config disables the feature)

The config sets `sidebar: false`, `toc: false`, `footer: false`, and search is off. None of
`#observablehq-sidebar*`, `#observablehq-toc`, `#observablehq-footer`,
`#observablehq-search*`, `.observablehq-link*` or `.observablehq-secondary-link*`
exists in any built page, and none matched in any runtime snapshot.
`.observablehq--draft` is preview-only.

- 75 rules + 5 @media wrappers, style.css lines 1033, 1042 (strip
  `#observablehq-footer` from the list only), 1053-1100, 1104-1384 (sidebar,
  toc, their breakpoints), 1471-1573 (search), 1746 (print sidebar/footer).
- Also 2 of **our** overrides that target the same dead TOC: 376
  `.observablehq-secondary-link-highlight`, 380 `.observablehq-secondary-link-active a`.
- Projected saving (scratch copy, not the repo): **-9,342 B minified,
  -1,544 B gzip per copy of style.css** (top-level pages load two copies).

### Bucket 1b: the feature exists in Framework, but no live page uses it

- Code blocks: `.observablehq-pre-*` (1385-1470, + `@keyframes
  observablehq-pre-copied`) and the pure `.hljs-*` rules (2058-2083), plus
  `.hljs-*` selectors stripped from the 7 shared inspector rules (1997-2057,
  which must stay for the `.observablehq--*` part). No `<pre>` exists on any
  live page. (Correction, step 3: the `<pre>` found in prototypes/radial.html is the source
  text of a cell that builds it at runtime, so Framework never wraps it.) Risk: a future fenced
  code block on a top-level page would render unstyled (country pages still
  get it from theme-air).
- Notes: `.note/.tip/.warning/.caution` (1817-1897). No source uses them.
- `.plot-d6a7b5` (2090-2095): Plot is imported only by unreachable modules
  (mapSources.js, sparkline.js).
- Projected: code blocks -528 B gz, notes -240 B gz. All of bucket 1:
  **-13,448 B minified, -2,332 B gz per copy** (35,867 → 22,419 B minified).

### Bucket 2: identical to Framework, duplicated on country pages, ONLY provider on top-level pages

NOT removable by deleting. 56 (a') + 19 (a) rules, + 7 shared inspector rules. Live ones:
`#observablehq-main` (1048), `@media print #observablehq-center` (1743),
`a[href].observablehq-header-anchor` (998, perspectives),
`observablehq-loading` + keyframes (1930-1953: created by the runtime while cells
load; 0 % / `from` is the only difference), `.observablehq--block*`, the
inspector `.observablehq--*` rules (1954-2089: shown when a cell displays a
value or an error), and the generic element rules (html, h2+p, pre/code,
table/th/td, figure, blockquote, input/button, `.grid`, `.card h2/h3`,
syntax colour variables 2096).

### Bucket 3: modified, keep the delta only

These are real differences from Framework 1.13.3 (Framework value → ours):
- `:root` 635: `--sans-serif` starts with "Nunito Sans"; `--serif` is "Source
  Serif **Pro**" (Framework loads "Source Serif **4**", so the font we name is never loaded; nothing uses `--serif` visibly).
- `body` 658: font 17px serif → 20px sans; margin auto → 0; background image (5× !important).
- `a[href]` 667: + font-weight 700. `h1-h6` 671: weight 700 → 900, + scroll-margin-top 1rem.
- `img` 731: max-width 100% → calc(100vw - 28px). 734: + font-family sans on p/table/figure/h*.
- `:root` 1001: `--font-big` weight 900, + `--font-very-big`. `:root` 2149: foreground #000
  (fw #1b1e23), focus #007162 (fw #3b5fc0).
- `.card` 1898-1912: transparent, no border, padding 0, 1rem font; `.card h2` inherit size.
- 1042: `#observablehq-main/#observablehq-header` max-width 1152px, header margin 1rem auto.
- 1751: `container-type: inline-size` on `#observablehq-center` (1.13.3 sets it on `#observablehq-main`).

Cosmetic-only differences that are really identical: `0.15s`/`150ms`, `bold`/`700`,
`normal`/`400`, `rgba()`/hex, `rotate(0)`/`rotate(0deg)`, whitespace in `color-mix( … )`,
quoted vs unquoted attribute values (hr 759, inputs 781, figure>h3 990, :root 2114, …).

### Cascade caution for buckets 2/3

Our own early rules (47-160: html, body, h1, svg text …) come **before** the
copy. The copy at 651+ overrides them on top-level pages. Removing or moving
a copied block can therefore let an older rule of ours take effect. Step 1 only
touches bucket 1, where no element matches, so this risk does not apply there.

### Stack options for bucket 2 (decision needed, nothing done)

- **(a) Keep the copies** (recommended for this task). Remove only bucket 1, and 1b if
  you agree. A visual no-op. Bucket 2 stays as a documented copy with a header comment.
- **(b) Put both page types on one stack.** This is NOT a no-op in either direction.
  Country pages today also get Framework rules that top-level pages lack,
  for example `body { max-width: 1440px }`, `#observablehq-center { margin: 2rem }`,
  `#observablehq-header ~ #observablehq-main { margin-top: … }`,
  `.card { background; border-radius }`, `#observablehq-main { container-type }`.
  Dropping `theme: air` from the template means 1 regeneration of 194 pages, and those
  pages would change visually (they would need their own screenshots and fixes). Rollback:
  `git revert` of the template commit + regeneration commit, then rebuild.
- Separate quick win, for Step 4: top-level pages load style.css twice. Removing the page-level
  `<link rel="stylesheet" href="style.css">` from the 6 top-level .md files
  (not the template, so no regeneration) saves about 11.4 KB gz and 1 request per top-level
  page. It changes the order, though: sidebar.css would then come after style.css. Needs
  its own screenshot check.

## 4. Our overrides: usage evidence

Method: (1) static. Import graph resolved from the 6 top-level pages, the
template + AFG, nav-html.js and the config, with commented-out imports and
markup ignored. Every class/id token in a selector is searched in those
sources. (2) Runtime. In 16 page×width snapshots (8 pages × 1200/375), each style.css
selector, with :hover etc. removed, was run through `querySelector`. 142 of 479
selectors matched. Snapshots have no interaction, so hover/toggle-only elements
are absent. A "not found" means no evidence of use. It does not prove a rule is dead.

**Modules not reachable from any live page:** blogPreview.js, mapSources.js,
pillarTrendsD3.js, polarCountryD3.js, polarD3.js, sparkline.js, toggleSwitch.js.
(polarCountryD3 appears 195× in grep only in the rollback comment.)

**Candidates (keep unless you approve).** Evidence from `scripts/classes.cjs`,
a class-context scan: `class=`/`id=` in HTML and template literals,
`.attr("class"|"id")`, `.classed()`, `classList.*`, `className`, and
`querySelector`/`select`/`closest` strings, with runtime-built prefixes such as
`x-${…}`. Scanned: all src .md/.js (live, unreachable and rollback modules),
nav-html.js, all 203 built pages and the compiled `dist/_import/components/*.js`.
Positive controls (`.tooltip-small`, `.chart-tooltip`, `.sourcecard`, blog
classes, `.desktop-notice`) are all found. nav-html.js uses none of the candidates.

| Lines | Selectors | Class-context hits (src + dist + nav-html.js) | Runtime match |
|---|---|---|---|
| 191 | `#hero-image` | only inside comments (countries.md:51, directions.md:39) | no |
| 204 | `heading-center` | type selector (missing dot); no element or class anywhere | no |
| 244 | `.blog-divider` | none | no |
| 385-427 | `#countryButton` (5 rules) | none | no |
| 482 (+68 part) | `.card .key` | `key` only as `class="card key"` (same element, index.md, directions.md); no `.key` descendant of `.card` in any md or JS-built markup | no |
| 487-532 | `.back-to-root`, `.back-to-root .arrow` … (6 rules) | `.back-to-root` only in comments (countries, directions, methodology). `.arrow` is live in straightPlotD3, but never inside `.back-to-root` | no |
| 2230-2264 | `.down-arrow`, `@keyframes jumpInfinite` | none | no |
| 607 | `.img-col` | none | no |
| 804-871 | toggle switch (`.switch`, `.slider`, `.round`, `.toggle-label*`) | only src/components/toggleSwitch.js. Every import of it is commented out (index, countries, directions); it is not built into dist/_import. The live latest/historical toggle is modeToggle.js (different classes) | no |
| 68 (part), 1006-1032 | `.big`, `.small`, `.red/.yellow/.green/.blue/.muted` (a') | `.big` only in a commented block of index.md; the rest none | no |
| 1773-1816 | `.grid-cols-2`, `.grid-colspan-*`, `.grid-rowspan-*` (a') | none (grid-cols-3/4 are used) | no |
| 590, 596-626, 123 (part), 144, 430 | Plot selectors | **HOLD** (your call: Plot builds classes at runtime) | — |

**Duplicates within our overrides, per property:**
- Blog 211-254 vs 2161-2203: every earlier declaration is overridden by the later set
  except `.blog-img-wrap { width: 100% }` (L211) and
  `.blog-img-wrap:hover img { transform: scale(1.03) }` (L227, a selector the later set
  does not have). Not identical, so a no-op removal must keep those two (e.g.
  move `width: 100%` into L2161 and keep L227). `.blog-divider` in that range is
  unused anyway.
- `a:hover` 413 and 461: identical (`text-decoration: none !important`).
- `svg text` 123 + 139, `.sparkline-table th/td` 895/903 + 909: overlapping, not identical.

**Only on country pages:** `.pillar-connectivity/-rights/-responsibility/-trust`
(34-45), `.label-whitestroke` (627), `.pillar-section-header` (1653-1660),
`.chart-breakout` (1713). Everything in the long "only top-level" list (blog,
sparkline table, keystats, hero, zoom buttons, desktop-notice …) is in
`scripts/usage.cjs` output.

## 5. Inventory: !important, comments, invalid declarations

- `!important`: **37** in style.css (lines 92, 108, 128, 129, 134, 140, 240,
  377, 381, 409, 414, 457, 462, 554, 580, 661-665, 704, 705, 933, 1102, 1337,
  1657-1659, 1697, 1705, 1744, 1748, 2185, 2190, 2206, 2210, 2211). 0 in the
  other stylesheets.
- Commented-out declarations: 30 one-liners in style.css, no large commented blocks.
- Invalid declarations, which browsers ignore today. **Ask before fixing any of them**:
  - 483 `.card .key { border: solid 1px var (--theme-foreground-faintest) }`:
    space after `var`. Fixing it alone would still add **no** border,
    because the selector matches nothing (§4). To get a border on the key cards
    you would need `.card.key`. Your decision: fix + retarget, or delete.
  - 186 `.hero { align-items: left }`: invalid keyword, ignored (behaves as `stretch`/normal).
  - 245 `.blog-divider { margin: 3redm 0 }`: typo, in an unused rule.
- Report only, not changed:
  - 123-130: `svg text, svg g text, svg tspan, [plot swatches]` get
    `font-size: clamp(1rem, 0.5vw + 0.05rem, 1rem) !important` (= always 16px) and
    `font-family: var(--sans-serif) !important`; 133-142 repeat the font-family.
  - 1713: `@media (max-width:768px) .chart-breakout { width: 100vw; margin: 0 -1rem }`.
    Measured: country pages are 16 px too wide at 768 and 375 (scrollWidth
    784 > 768, 391 > 375), both standalone and in the iframe.

## 6. BEFORE reference

**Matrix (reduced, 13 cases):** home, methodology, perspectives, AUS (highest
total score with complete data, 80), MHL (most missing data) at 1200×800 and
375×667, standalone. 768×1024 only for perspectives: it is the only page with a
TOC (blog TOC, own 769-1100 px layout); the nav sidebar is the same component on
every page, so one page covers its breakpoint. In the iframe (local harness
`scripts/harness.html`, same markup as tools/iframe-single.html, cross-origin
port) only home and AUS at 375×667. Per case: the first viewport plus at most
two scroll positions (one viewport down, middle of the document) = 39 PNGs.

**Computed-style diff:** per case, `getComputedStyle` of every rendered element
(121-1,778 per page, all properties, sorted; plus `::before`/`::after` where
they generate content), keyed by DOM path. `scripts/style-diff.cjs` reports
elements only on one side and every changed property with both values
(`style-diff.json`). Positive control: changing one `font-weight` in a dump is
reported as exactly that element/property/value pair.

**Retention:** PNGs are deleted after each diff (`scripts/compare-runs.sh`). Kept:
`pixel-diff.json`, `style-diff.json`, a SHA-256 manifest and log per run.
Style dumps (≈23 MB per country-page case) stay outside the repo.

Capture method (`scripts/shoot.cjs`), identical for before and after:
- No `fullPage` captures. A full-page capture resizes the viewport to the
  document height. On country pages that makes Framework's `resize()` cells
  rebuild 10 chart SVGs, and the capture catches them mid-animation (measured: 937
  of 1,315 beeswarm dots invisible right after a full-page capture). Viewport
  captures at fixed scroll positions avoid that and keep true `100vh`.
- Determinism: CSS animations/transitions disabled, `prefers-reduced-motion:
  reduce`, `Math.random` seeded, page clock 1000× (d3 transitions end on their
  first frames), scroll pass for lazy images, network idle, then capture
  repeated until two consecutive captures are byte-identical. After the scroll
  positions, the first viewport is re-captured to prove nothing re-rendered.
  Chrome flags `--disable-checker-imaging --force-color-profile=srgb
  --disable-gpu --disable-partial-raster` (the scaled hairline background PNG
  otherwise rasterises differently per run). Scrollbars visible.
- **Noise floor (before vs before, `noise-floor/`): 39/39 PNGs pixel-identical,
  0 computed-style differences in 13/13 cases, and the two runs' SHA-256
  manifests are byte-identical (52 files).** No case unstable, re-rendered or
  failed. Earlier attempts and what fixed them: full-page captures with a 6 s settle
  gave 15 of 64 differing pairs (beeswarm mid-animation, background raster);
  style dumps first differed in bytes only because Chrome enumerates custom
  properties in no fixed order (now sorted). So a zero diff after a change can be trusted.

Console/network (pre-existing, unchanged by this task): every country page logs
`<svg> attribute width: A negative value is not valid ("-24")` + the same for viewBox.
Only other 404: favicon.ico (local server).

CSS bytes in dist/ (measured): see §1. Per page: top-level ≈ 8,304 + 2,288 +
11,350 (+413 / +617) B gz of our CSS; country ≈ 5,625 + 2,288 + 11,350 + 413 + 617 B gz.

Lighthouse 13.4.1, mobile (simulated throttling), performance only, local build
served with gzip from 127.0.0.1, 5 runs each. Median (range):

| Page | Runs | Perf | LCP s | CLS (all runs) | TBT ms |
|---|---|---|---|---|---|
| home | 5 | 65 | 3.14 (2.8-12.6) | 0.002 (0.000, 0.002, 0.002, 0.002, 0.002) | 1030 (513-1937) |
| AFG | 5 | 39 | 10.39 (10.2-10.6) | 0.323 (0.323, 0.000, 0.323, 0.323, 0.012) | 564 (555-1667) |

The noise is large: one home run reached 12.6 s LCP, and AFG CLS jumps between 0 and 0.323.
**Acceptance for this task is the pixel diff and CSS bytes. Lighthouse is reported
as a range only**: a CSS no-op cannot be told apart from this noise. The AFG
mobile CLS of 0.323 is a separate issue from the 0.78 desktop CLS in the brief.

## Review follow-up (preconditions for step 1)

- **"Identical" checked against the installed 1.13.3 text.** The comparison
  was re-run against the built `dist/_observablehq/theme-air.aad62322.css`
  (`compare-vs-built-theme-air.json`). 29 rules change status. Every change is
  minifier serialisation (`0.5rem` vs `.5rem`, `bold` vs `700`, spaces inside
  `repeat()`/`color-mix()`), e.g. `pre`, `.grid-cols-*`, `observablehq-loading`.
  No rule differs in meaning.
- **Config bundle = minified build of the same file.** esbuild 0.20.2 (Framework's)
  `buildSync({bundle, minify})` on src/style.css gives 34,893 B, SHA-256
  59eb95fc…, byte-identical to `dist/_import/style.59eb95fc.css` (the filename
  hash is the content hash). The 8.3 vs 11.4 KB gz gap is only minification.
- **Bucket 1a feature flags.** Across all 203 .md pages, the only flags set are
  `toc: false`, `sidebar: false`, `footer: false`, `pager: null` (template + 194
  country pages). No page sets `draft` or `search`. The config sets
  sidebar/toc/footer/pager false. None of the 203 built pages contains
  `#observablehq-sidebar|toc|footer|search`, `.observablehq-(secondary-)link` or
  `.observablehq--draft`. client.js only queries these (`if (el)`) and never creates them.
- **The 5 @media wrappers** (1329 dark, 1335, 1355, 1363, 1369) hold only
  sidebar/toggle/TOC rules. In 1355, `#observablehq-toc ~ #observablehq-center`
  names the live center, but only as the sibling of a nonexistent TOC. **Mixed and to be split:**
  `@media print` (1742): keep `#observablehq-center`, remove only
  `#observablehq-sidebar, #observablehq-footer`. Also the 1042 list: remove only `#observablehq-footer`.
- **Bucket 1b greps** (dist/ html, dist/ js, src/**/*.md excl./incl. country pages):
  `hljs`: none. `<pre`: only prototypes/radial (correction, step 3: that is cell source text; the element is built at runtime and never wrapped). `class="…note|tip|warning|caution…"`:
  none. `observablehq-pre-*`: only client.js, which wraps any
  `pre:not([data-copy=none])`; no live page and no component creates a `<pre>`.
  ` ```html ` fences (index.md:167, directions.md:254) are evaluated cells, not
  displayed code. `plot-d6a7b5`: not in any shipped JS (Plot is not bundled
  into dist at all; the hash matches cached plot@0.6.17 and would go stale
  on a Plot bump). Inspector `.observablehq--*`: live (runtime.js, client.js,
  and statically in dist/1countryPageTemplate.html), so they stay in bucket 2;
  only the `.hljs-*` selectors are stripped from the shared lists.
- **Rollback-only classes:** no style.css class or id is used only by polarD3.js
  or polarCountryD3.js (`.label-whitestroke` and `.chart-axistext` are also used by
  live modules).

## Decisions (review of 31 Oct)

- Bucket 1a: approved, own commit; our 2 dead TOC overrides (376, 380) in a separate commit.
  Split `@media print` (1742) and the 1042 list instead of deleting them whole.
- Bucket 1b: approved if the greps are empty. They are (see Review follow-up); only the
  prototype has a `<pre>` (built at runtime, never wrapped: see step3-report.md).
- Stack: keep the bucket-2 copies. Dropping the duplicate page-level style.css link
  goes to Step 4 as a proposal, with a sidebar.css order check.
- `.card .key` (482-484, + the copy in the 640px block): Step 2 candidate (whole rule is a
  no-op; no `.key` descendant of `.card` in md or JS-built markup). CHANGELOG to note
  that a border was intended but never rendered.
- `align-items: left` (186) and `margin: 3redm` (245): untouched; known defects for a
  deliberate visual task.
- Plot selectors: on hold. Rollback-only classes: none exist (see Review follow-up).
- Screenshots: not committed (`audit/css-cleanup/.gitignore`); report, diff summary
  and SHA-256 manifest are committed.

Still open for your approval: the Step 2 candidates in §4 (now with class-context evidence).
