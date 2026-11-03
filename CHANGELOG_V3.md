# Changelog: v3

## 2026-11-03 — Provenance markers, steps 2-5: markers, legend, pages

Brief: v3_BRIEF_section_provenance.md (Phase 3b), steps 2-5. Two commits: components,
then template + 194 regenerated country pages.

- **tokens.js**: `statusMarkers` (r 4, hover 6, stroke 1.5, dash "3 3"), `isComputedStatus`,
  `styleStatusMarker`. Hollow fill is `var(--theme-background)`: cards are transparent in
  style.css, so the page background is what sits behind the chart (set as style, not
  attribute, so the variable resolves).
- **statusLegend.js** (new): HTML legend, flex-wrap, centred under the toggle; markers are
  small inline SVGs (aria-hidden), labels are HTML.
- **indicatorHistorical.js** (highlighted country only; grey lines unchanged): a marker on
  every value, filled = published, hollow = carried/backdated (replaces "hollow except the
  last"); segments touching a computed point dashed. The curve stays one path (it already
  used curveMonotoneX) clipped per segment, so dashing does not straighten it. Missing
  years are gaps now (`line.defined`), not bridged. Tooltip and per-marker `<title>`:
  "72 · 2026 edition (data for 2025)" / "computed: 2024 edition carried forward" /
  "computed: 2021 edition applied to 2020".
- **pillarSparklineD3.js**: dots removed; line, area and value/year labels kept (it had
  no hover readout).
- **1countryPageTemplate.md** (the brief's `src/countries/template.md`): legend cell right
  after the Latest/Historical toggle. It always calls `display()` (an empty fragment in
  Latest), because Framework only clears a block on the next display call.

**Verify** (AFG, `npm run dev`, 393 and 1440 px): E-Waste filled 2020, 2024, hollow
2021-23, 2025-26, all segments dashed; GCI hollow 2020; Rule of Law and the other published
series filled and solid; tooltips as above; legend once in Historical, block 0 px with 0
margins in Latest (on load and after switching back); legend fits at 361 px. Page width
409/393 and 377/361 in both modes: the pre-existing `.chart-breakout` overflow.
**Rollback**: revert the pages commit (template + pages), the components commit, or both.

## 2026-11-03 — Provenance markers, step 1: loader (dfiFull.csv.R)

Brief: v3_BRIEF_section_provenance.md (Phase 3b), step 1.

- **What**: `src/data/dfiFull.csv.R` reads `Internet-Accountability-Index-Provenance.xlsx`
  (sheets Exceptions, Indicators; committed in f44d2bc) and appends three columns at the end:
  `value_status` (actual / carried / backdated; default actual), `edition_year`,
  `reference_year` (= edition_year − reference_lag). Existing columns, column order,
  row order and the jitter seed are unchanged.
- **Checks** (after reading the year sheets): valid statuses, no duplicate or unknown
  exception keys, edition_year present for carried/backdated; every exception has values;
  identical values within one indicator edition; STOP if an unlisted year is ≥99% equal to
  the previous edition ("looks carried forward"); message at ≥95%. On V3.0 the only
  message is INDIGO (commitment 9) 2024, 0.957: known, published.
- Changes to the brief's draft: `expand_grid` without `tidyr::`; extra stop if the
  Indicators sheet is not exactly commitments 1-12 with a lag; stop if the final join
  changes the row count or leaves a status NA; messages print a plain data frame.
- `src/.observablehq/cache/data/dfiFull.csv` regenerated (CI has no R and builds from
  the committed cache).
- **Note**: `npm run build` reuses an existing cached loader output even when the loader
  is newer ("[using stale]"); only `npm run dev` re-runs it. To refresh for a build,
  delete the cached file.

**Verify**: 16,296 rows before and after; with the three new columns dropped the CSV is
byte-identical to the previous output. Status over the 84 indicator-years: 68 actual (5 of
them without data: NRI 2020, GIRAI 2020-23), 15 carried, 1 backdated (GCI 2020). Negative
test: removing the Exceptions row Global E-Waste Monitor 2021 stops the loader with
"looks carried forward … 7 2021 share_same 1"; restored file → identical output.
**Rollback**: revert this commit (front end ignores the extra columns).

## 2026-11-03 — Onboarding tour: step 1 points at the key figures

Branch `feature/tour`. Detail: audit/tour/report.md, section 0b.

- **What**: step 1 ("Total score at a glance") now rings the key-figure cards
  (`data-tour="figures"` on the grid in src/index.md, attribute only; fallback the map)
  instead of the map legend, which in Latest mode shows only "Not enough data".
  `data-tour="legend"` removed from mapTotalD3.js. New step 1 copy names the four
  categories and their counts; card labels match binLabels, card colours use the same
  bin tokens as the map.
- The step 1 card sits below the figures and the scroll keeps the Latest / Historical
  switch in view above them, so the switch step 2 mentions is visible (frames ≥420px tall).
- **Known**: in Historical the cards are three change cards, so "four categories" is true
  in Latest only (auto-start always opens in Latest). In frames under 420px the docked card
  covers the switch; at 1200x300 step 1 has no ring (card only).
- **Size**: tour.js + tour.css 8,017 B gzip (LF, as CI builds it).

**Verify**: `/?tour=1` at 1200x800 → ring on the four cards, card below them, switch visible above.
**Rollback**: revert this commit.

## 2026-11-02 — Onboarding tour: review changes (A, B, copy)

Branch `feature/tour`. Detail: audit/tour/report.md, section 0.

- **"?" top right on desktop** (src/index.md, `top: 16px` instead of `bottom: 40px`): in the
  WordPress embed the frame's bottom ~117px start below the visitor's window. Mobile unchanged.
- **Card docks at the top** (`DOCK = "top"` in tour.js) when it cannot sit next to the ring.
- **Copy** (COPY.en): step 1 points at the hatched legend entry; step 2 "details" + click;
  step 3 desktop is an intro plus a list of the six sections with one-line descriptions
  (a `<ul>`; the card scrolls internally in short frames); step 3 mobile mentions the top bar.
  The requested "how they have changed over time" was not used: Historical compares the
  latest year with the previous one, so the text keeps "the change since the previous year".
- tour.js: comments that restated the code removed (no code change).
- **tools/iframe-test.html**: case 6 models the real host (117px bar, then a 100vh container).
- **Size**: tour.js + tour.css 7,805 B gzip (was 8,104 B).

**Verify**: `/` at 1200 px → "?" top right; step 3 shows the list. tools/iframe-test.html case 6 in
a phone-sized window, scrolled to the black bar → the card stays in the visible top part.
**Rollback**: revert this commit (restores the previous copy, "?" and DOCK).

## 2026-11-02 — Onboarding tour on the landing page

Branch `feature/tour`. Report and evidence: audit/tour/report.md.

**What changed**
- New `src/components/tour.js` (vanilla, no dependency) and `src/tour.css`: a
  first-visit spotlight tour on the landing page only. Ring around the live UI +
  one card; 4 steps on desktop (legend, zoom controls, nav, Countries link), 3 at
  ≤768px (legend, map, hamburger). All copy in `COPY.en` at the top of tour.js.
- `src/index.md`: a "?" button (fixed; bottom-right on desktop, in the mobile top bar
  at ≤768px) and a cell that imports tour.js after `load` + idle. Not for automated
  runs (`navigator.webdriver`, Lighthouse UA) or with `?tour=0`; `?tour=1` forces it.
- `src/components/mapTotalD3.js`, `nav-html.js`: `data-tour` attributes only
  (map container, legend, zoom controls; nav, Countries link, hamburger). The nav
  attributes are on every page via the config header: no country-page regeneration.

**Behaviour**: Finish or "Don't show again" → localStorage `iac:tour:v1 = done`
(bump the version to show it again); Skip/Esc → sessionStorage `iac:tour:skipped`.
Auto-start only if neither is set and localStorage works
(`AUTOSTART_WITHOUT_STORAGE = false`). While open: `inert` page, Tab trap, Esc,
focus back to "?", every `focus()` with `preventScroll`; scrolls only its own
document (`window.scrollTo`, never `scrollIntoView`, which scrolled the host page in a test).

**Why**: v3_BRIEF.md, "Onboarding".

**Size**: tour.js + tour.css 8,104 B gzip, requested only after `load`; index.html
+1,129 B gzip. One Lighthouse mobile run, home `?tour=1`: LCP 12.43 s / TBT 1,619 ms /
CLS 0 vs parent 12.78 s / 1,613 ms / 0 (within noise).

**Open (proposals in the report, not applied)**: in the WordPress embed the frame's
bottom ~117px start below the visitor's window (estimate from the host CSS), so the
desktop "?" is not visible until the host page scrolls (A: put it top-right), and a
bottom-docked card can be cut on small phones (B: `DOCK = "top"`). There is no
visibility gate before auto-start (C: IntersectionObserver, a new mechanism).

**Verify**: open `/` in a fresh profile → tour after load; Finish, reload → no tour;
"?" reopens it. `/?tour=0` → no tour. Phone width → 3 steps, "?" in the top bar.

**Rollback**: `TOUR_ENABLED = false` in tour.js, or revert the branch commits.

## 2026-11-01 — CSS cleanup: dead Framework copies and unused rules in style.css

Branch `feature/css-cleanup`. Evidence and method: audit/css-cleanup/step0-report.md.
style.css lines 635-2153 were a copy of an older Framework release's default
CSS. Top-level pages load no Framework CSS, so that copy is their only source of
those defaults. Country pages (`theme: air`) also get Framework 1.13.3's own.
Only rules that no live page can use are removed. One commit per group, so each
can be reverted alone. Original text: Framework's
`node_modules/@observablehq/framework/dist/style/` (global, layout, grid, note,
card, inspector, plot), and this file before the cleanup: `git show eadd799:src/style.css`.

Usage evidence is static: the import graph from the live pages, a class-context
scan of src/ (all .md/.js incl. unreachable and rollback modules), nav-html.js,
all 203 built pages and the compiled components in dist/, and greps of dist/.

- **(i) Bucket 1b, Framework features no live page uses.** Code-block wrapper and copy
  button (`.observablehq-pre-*`, `@keyframes observablehq-pre-copied`),
  syntax highlighting (pure `.hljs-*` rules; `.hljs-*` selectors stripped from
  the 7 inspector rules they shared with `.observablehq--*`, which stay), notes
  (`.note/.tip/.warning/.caution`), `.plot-d6a7b5`. No live page has a `<pre>`
  (no fenced code is displayed; ` ```html ` fences are evaluated cells) and no
  component creates one. No `hljs`, note/tip markup or `plot-d6a7b5` in src/ or
  dist/ (Plot is not bundled at all). Country pages still get all of it from
  theme-air. Internal page src/prototypes/radial: its `<pre id="radial-metrics">`
  is built at runtime by a cell, so Framework's copy-button code (which wraps
  `<pre>` present at load) never wrapped it. No pre-container, copy button or hljs
  styling applied before either, and the Step 3 computed-style diff shows no change
  beyond the page's own run-to-run noise. (Step 0 counted it as a static `<pre>`:
  the grep had matched the cell's source text.)
- **(ii) Bucket 1a, layout features switched off in the config.** Sidebar, TOC, footer,
  search, `.observablehq-link*`, `.observablehq-secondary-link*`,
  `.observablehq--draft`, and their breakpoints (5 `@media` blocks that held
  only these rules). The config and all 203 pages set sidebar/toc/footer/pager to
  false/null, none sets `draft` or `search`, and none of the 203 built pages contains
  these elements. Framework's client only queries them, never creates them. Split,
  not deleted whole: `@media print` keeps `#observablehq-center { padding-left }`, and
  `#observablehq-main, #observablehq-header { margin; max-width }` keeps its two live selectors.
- **(iii) Our own overrides for the removed TOC:** `.observablehq-secondary-link-highlight`
  and `.observablehq-secondary-link-active a` (white background/text, `!important`).
  They target Framework's TOC, which is off. The perspectives page uses its own `.blog-toc`.
- **Header comment** in style.css (what the file is, what was removed, where
  the original lives) and a one-line note on each kept `#observablehq-*` rule.
  Comments only.
- **Unused rules of ours** (no class/id hit in src/, nav-html.js or dist/; markup only
  inside HTML comments where noted): `#hero-image` (commented out in countries and
  directions), `heading-center` (a type selector, missing its dot), `.blog-divider`,
  `#countryButton` (5 rules), `.card .key` and its copy in `@media (max-width: 640px)`,
  `.back-to-root*` (6 rules, incl. `.back-to-root .arrow`; commented out in countries,
  directions, methodology; no standalone `.arrow` rule existed), `.img-col`.
  Known defects removed with them: `.blog-divider { margin: 3redm 0 }` (typo,
  ignored by browsers) and `.card .key { border: solid 1px var (--theme-foreground-faintest) }`.
  **A border on the key-stat cards was intended but never rendered:** the value
  was invalid (`var (`), and the selector never matched (the markup is
  `class="card key"`, one element, not a `.key` inside a `.card`). If the
  border is wanted, add `.card.key { border: … }` as a deliberate visual change.
- **Scroll-down arrow:** `.down-arrow`, `.down-arrow:after`, `@keyframes jumpInfinite`.
  No markup uses `.down-arrow`, and `grep -rn jumpInfinite src dist` finds only these rules.
- **Toggle switch:** `.toggle-switch-container`, `.toggle-label`,
  `.toggle-label-active`, `.switch`, `.switch input`, `.slider`, `.slider:before`,
  `input:checked + .slider` (+ `:before`), `.slider.round` (+ `:before`). Only
  src/components/toggleSwitch.js uses these classes. Every import of it is commented out,
  and it is not built into dist/. The live latest/historical toggle is modeToggle.js
  (other classes). No dist stylesheet (incl. Framework's Inputs CSS) or dist JS
  (`_npm`, `_observablehq`) uses `.slider`, `.round` or `.switch`, so the global
  selectors styled nothing else. **src/toggleSwitch.css stays as the recovery copy** of
  these rules (linked nowhere today).
- **Framework utility classes:** `.big` (two copies, plus its entry in the
  `@media (max-width: 640px)` font-size list), `.small`, `.red`, `.yellow`,
  `.green`, `.blue`, `.muted`. No markup uses them; `.big` only appears inside an
  HTML comment in index.md. `--font-big` went with `.big`, its only user (grep of src/,
  nav-html.js, dist/). `--font-very-big` stays (`.very-big` is live on index and
  directions), and so does `--font-small`. On country pages, theme-air still defines
  its own `--font-big` and `.big`.
- **Unused Framework grid helpers:** `.grid-cols-2`, `.grid-colspan-2/3/4`,
  `.grid-rowspan-2/3/4`. Only `.grid`, `.grid-cols-3` and `.grid-cols-4` are used.
  `grep -rn "grid-col\|grid-row" src dist` finds no template that builds these names
  (the keystats grid picks `'grid-cols-4'`/`'grid-cols-3'` as literals; `grid-col-1/2`
  in the country template is a different, unstyled class). `.grid`, `.grid-cols-3/4`
  and their three `@container` wrappers are unchanged.

**Verification** (audit/css-cleanup/step3-report.md; measured):
- style.css: 2,264 → 1,329 lines, 363 → 204 rules. Each commit was checked with a
  semantic rule diff: exactly the planned selectors removed, nothing else changed.
- Build passes (1,221 links). Of 283 dist/ files, only the two style.css files
  differ. HTML, JS, data and country pages are unchanged (after normalising the hash).
- Pixel diff: 39/39 captures identical (home, methodology, perspectives, AUS,
  MHL; 1200×800, 375×667, perspectives 768×1024; iframe home/AUS 375×667).
  Noise floor before vs before: 0 differences.
- Computed styles of every element, 28 cases (also countries, directions,
  resources, prototype, AFG, DNK, BRA, home in print): the only change is the
  unused custom property `--font-big`. The prototype also shows its own
  run-to-run noise (a timing table).
- CSS gzip -9: top-level pages −5,940 B (two copies of style.css; −27 % of
  their own CSS), country pages −2,802 B (−14 %). Raw: −36,429 / −19,718 B.
- Lighthouse (mobile, 5 runs each): before and after ranges overlap completely
  (home LCP 2.8-12.5 vs 2.8-13.3 s). No measurable effect, none expected.
- **Verify**: `git diff eadd799 HEAD -- src/style.css`; rebuild and open home,
  /AUS/, /perspectives at desktop and phone width: nothing should look different.

**Evaluated, not applied: dropping the duplicate page-level style.css link** on the
6 top-level pages (src/index.md, countries, directions, resources, perspectives,
methodology). It would save 1 request and 8,548 B gzip -9 (31,776 B raw) per
top-level page. But style.css would then load only through the config bundle,
before inputs.css and sidebar.css, and two equal-specificity ties flip
(today load order decides them in favour of style.css):
- (a) focus underline on the sidebar links: Framework copy `a[href]:focus
  { text-decoration: underline }` vs `.sidebar-menu a[href] { text-decoration:
  none }` (both 0,2,1). The underline also shows briefly after a click (a click
  focuses the link). Keeping it would need `.sidebar-menu a[href]:focus {
  text-decoration: underline; }` in sidebar.css.
- (b) Directions search box 240px -> 360px at 1200 px (240 -> 265px at 375 px):
  style.css `input[type="search"] { width: 240px }` vs Inputs
  `.inputs-*-input > input { width: inherit }` (both 0,1,1). Keeping 240px would
  need `[class*="inputs-"][class$="-input"] > input[type="search"] { width: 240px; }`
  in style.css.
**Correction:** the proposal (audit/css-cleanup/step3-report.md) said "no
rendered property changes". That was wrong: (b) was in the proposal's own
style diff and was missed (directions was not in the PNG matrix and the
style-diff output was not read closely); (a) needs forced states, which that
run did not cover. Both were then confirmed with a real build (commits
fd154f5, da221d0, 876e8ce), and all three were reverted (f7cae21, ff6a197,
5cc4782): src/ is identical to 20506d0. Option for the visual pass: decide (a)
deliberately (e.g. remove the underline everywhere) and (b) (240 vs 360px),
pin both with the rules above, then drop the link. Evidence:
audit/css-cleanup/proposal-drop-duplicate-link/, sidebar-focus-rule/,
drop-duplicate-link/; scripts states.cjs (forced states), ties.cjs (tie check),
nonws.cjs.

## 2026-10-29 — Sources legend: inline SVG icons

**What changed**: the four Font Awesome icons in
`src/components/sourcesLegend.js` (Analysis, Source, Project, Academic) are
now inline line icons in the nav's style (24×24, stroke `currentColor`), so
they follow the legend's selected/unselected text colour. Icon sizing moved
to `.sources-legend-icon svg` in `src/custom-legend.css` (1.5em, as before).
**Why**: Font Awesome is no longer loaded (static sidebar, below).
**Verify**: /resources → legend shows magnifier, open book, flag,
mortarboard; white on the selected item, item colour otherwise.

## 2026-10-29 — Sidebar CSS fix + before/after measurements

**What changed** (src/sidebar.css, commit dbebba2): country pages set
`theme:` in front matter, so they load Framework's layout.css, which turned
the now non-empty `#observablehq-header` into a fixed 60 px bar with a grey
bottom border and pushed `main` down by ~75 px. The wrapper is now static,
0 px tall, no padding or border, and `main` gets back its 1rem top margin.
Sidebar labels were theme teal because Framework's `a[href]` outranked
`.sidebar-menu a`; the selector is now `.sidebar-menu a[href]` (desktop and
mobile), so `--sidebar-text-color` (#666) applies.
**Verify**: /AFG/ `main` starts at 48 px (as before the sidebar change),
/ at 16 px; inactive sidebar links compute to rgb(102, 102, 102).

**Measurements** (full report: audit/sidebar/report.md; local before/after
builds, Lighthouse 13.4.1, 3 runs, medians):

- Requests −3 and transfer −166 KB per page (Font Awesome CSS 19 KB +
  woff2 147 KB + sidebar.js 1 KB); one render-blocking stylesheet fewer.
- Accessibility (desktop): home 63 → 81, AFG 68 → 87. Only
  `color-contrast` on the sidebar labels changed.
- CLS, LCP, TBT: no change attributable to the sidebar. AFG desktop CLS is
  0.780 in both builds; home desktop TBT medians over 5 interleaved runs are
  152 vs 146 ms; run-to-run TBT spread on this machine is 0–1,680 ms.
- Staging (pre-fix) vs Phase 0 baseline: TBT on mobile is ≈1.9 s vs
  0.5–0.75 s. Not from the sidebar (local A/B shows no TBT change); flagged
  for the performance pass.
- Screenshots before/after (home, AFG, drawer open; standalone and in the
  iframe, plus a 300 px frame): audit/sidebar/screens/.

## 2026-10-28 — Static sidebar

**What changed**

- New `nav-html.js` (repo root): sidebar markup built at build time, active
  entry from Framework's `path`, inline SVG icons, one small drawer-toggle
  script; mobile layout via CSS media queries instead of the JS `isMobile`
  branch. `src/sidebar.css` replaced to match.
- `observablehq.config.js`: `header: ({ path }) => navHtml({ path, base: "" })`
  and `<link rel="stylesheet" href="/sidebar.css">` added to the global head
  (staging noindex/label unchanged). Framework 1.13.3 supports a function
  `header` (`pageFragment()` in dist/config.js; called with
  `{ title, data, path }` in dist/markdown.js). Logged `path` values:
  `"/index"`, `"/countries"`, `"/BEL/index"`.
- **Deviation from the task spec:** `base` is `""`, not the BASE_PATH value.
  Framework runs header/head HTML through `rewriteHtmlPaths()`, which treats
  any scheme-less href as a path under src/ and makes it relative to the page.
  With the base passed, /BEL/ got `href="../internet-accountability-compass/countries"`
  (→ `/internet-accountability-compass/internet-accountability-compass/countries`
  in production) and `sidebar.css` resolved to a missing file (sha of empty
  content). Root-relative `/countries` becomes `../countries`, which works
  under any base, and `sidebar.css` is fingerprinted (`_file/sidebar.css?sha=…`).
- Removed from `1countryPageTemplate.md`, index, countries, directions,
  resources, perspectives, methodology: the `sidebar` import, the
  `${sidebar()}` block and its comment, the Font Awesome link, the per-page
  sidebar.css link. No other `<link>` touched.
- `src/components/sidebar.js` deleted after the 194 country pages were
  regenerated (no importers left).

**Known differences (visual decision to approve)**

- Icons are new original line icons (Methodology is a sliders icon, was a
  wrench), not Font Awesome solids.
- Sidebar text colour #999 → #666 for contrast (sidebar only, via
  `--sidebar-text-color`).
- "Map" links to `<base>/` instead of `<base>/index`.

**Still depends on Font Awesome (will lose its icons once FA is gone)**

- ~~`src/components/sourcesLegend.js`: four legend icons on /resources.~~
  Replaced with inline SVG (2026-10-29 entry).
- `src/perspectives.md`: the mobile "Contents" ToC toggle icon (being
  replaced with an inline SVG separately).

**Verify**

- `npm run build` (45 s, 1,221 links validated; before: 5, the nav links were
  JS-generated): `dist/index.html`, `dist/countries.html`,
  `dist/BEL/index.html` each have one `<nav class="sidebar"` and exactly one
  `aria-current="page"` (Map / Countries / Countries). Every built page has
  the nav; no `font-awesome` or `cdnjs` anywhere in dist.
- Built site served under `/internet-accountability-compass/`, inside the
  production iframe markup (DevTools protocol, headless Chrome):
  - 1200×300, 900×auto (frame collapses to 150 px) and 375×300: menu
    scrolls (`overflow-y: auto`), last link reachable, no clipping.
  - 375×667 on / and /BEL/: drawer opens via the button and closes via
    backdrop, link click and Escape (focus returns to the button); closed
    drawer has 0 tabbable links (6 when open); widening the frame to 900 px
    with the drawer open hides the backdrop and top bar.
  - No horizontal scroll at 800×600, 1200×300, 1200×800, or on / at 375.
- Pre-existing, not from this change: /BEL/ at 375 px scrolls horizontally
  (391 > 360 px) because `.chart-breakout { width: 100vw }`
  (style.css:1714) includes the 15 px classic scrollbar. Overlay-scrollbar
  phones are likely unaffected. Left for the CSS cleanup.

## 2026-10-28 — Sidebar: Countries active on /<ISO3>/ pages

**What changed**: `highlightCurrentPage()` in `src/components/sidebar.js`
also marks "Countries" active when the path matches `/^\/[A-Z]{3}(\/|$)/`.
**Why**: country pages live at `/<ISO3>/`, not under `/countries`, so no
entry was highlighted on them. Pages were not moved (URLs unchanged); no
regeneration needed.
**Verify**: `npm run dev` → /BEL/, /AFG/, /USA/ each have exactly one
`.sidebar-menu a.active` (Countries); /, /countries, /directions,
/resources, /perspectives, /methodology highlight their own entry; /blog
highlights nothing.

## 2026-10-28 — Polar bars (radial variant C)

**What changed**

- New `src/components/polarBarsD3.js` with `polarBarsD3` (small multiples,
  successor of polarD3) and `polarCountryBarsD3` (single country, successor
  of polarCountryD3). polarD3.js and polarCountryD3.js are unchanged, so
  switching back is a one-line import change (the old import is kept as a
  comment next to the new one).
- Marks = variant C from the radial prototype (audit/radial/report.md): a
  0.25-opacity sector per indicator centred on its cardinal angle, plus a
  full-opacity arc cap at the value; total score as an outline ring.
- Radius scale domain [-25, 100]: score 0 sits at 20% of the radius and the
  white centre disc ends at 0. Rings 20–100 keep their values.
- Static render (no entry animation). Hover: one delegated listener per SVG;
  the hovered indicator is set as `data-active` on the SVG and CSS dims the
  others (linked across all countries in the multiples). On touch, the
  tooltip stays until the next tap outside a mark.
- Multiples legend: pillar sectors centred like the country sectors; tick
  labels 0 and 100 only (intermediate ticks overlapped at 16px). No opacity
  transition in the multiples: with ~1,850 marks it delayed dimming by
  ~450 ms (headless Chrome), ~50–80 ms without.
- polarCountryBarsD3 takes `(data, country, { width })`, matching the
  template's call. The old `polarCountryD3(data, country, isMobile,
  options)` received `{width}` as `isMobile` and always rendered at 400px.
- countries.md and 1countryPageTemplate.md import the new functions.

**Verify**: `npm run dev` → /countries (multiples, hover dims one indicator
across all countries) and a country page (single chart). To switch back,
swap the commented import line and the function name at the call site.

## 2026-10-27 — Fix previous value of 0 treated as missing

**What changed**: mapPillarD3.js, mapCommitmentD3.js and mapTotalD3.js
computed the year-over-year change only if `prevValue && …`, so a previous
score of 0 was treated as missing ("Not enough data"). Replaced with
`prevValue != null && prevValue !== "NA" && current.value !== "NA" &&
!isNaN(prevValue)`.

**Effect (2025→2026, cached loader output)**: 24 country/measure pairs
change classification, none in the Total score:
- Responsibility and sustainability (pillar): AND, GNQ, MCO, SMR → No change
- Global Internet Shutdowns: MMR → No change
- Global E-Waste Monitor: NOR → No change
- Global Index on Responsible AI: SSD → Increase (0 → 4)
- INDIGO: DZA, AND, AZE, BTN, BIH, GNQ, IRQ, KIR, LBN, MCO, SMR, SRB, SOM,
  SYR, STP, TKM, UZB → No change

**Verify**: `npm run build`; directions → Historical → Responsibility and
sustainability: Andorra / Monaco / San Marino show No change, not hatched.

## 2026-10-27 — Shared historical opacity scale

**What changed**

- tokens.js: `changeDomainMax = 20`.
- scales.js: `changeOpacity(change)`: `d3.scaleSymlog().domain([0, 20])
  .range([0.35, 1]).clamp(true)` on |change|; change 0 → 1 (no-change is the
  opaque grey). Values: |1| 0.50, |2| 0.58, |5| 0.73, |7| 0.79, |10| 0.86,
  |15| 0.94, |20|+ 1.00.
- mapPillarD3.js (was symlog 0–10) and mapCommitmentD3.js (was linear 0–20)
  drop their local `opacityScale` and use `changeOpacity()`, so the same
  change looks the same on both maps.
- mapLegend.js: new stepped change key (`changeKeyRows` / `changeKeySize` /
  `renderChangeKey`): ▼ Decrease and ▲ Increase rows with swatches at
  |change| 1 / 5 / 10+ drawn at the real opacity, signed labels in `ink`;
  No change / Not enough data / Partial data stay as regular swatches below.
  Used by both maps' historical legends. mapTotalD3 unchanged.

**Why**: the two maps used different opacity functions (a change of 5 was
0.84 on the pillar map, 0.51 on the commitment map); the domain of 20 keeps
~90% of non-zero commitment changes below saturation (measured 2025→2026).

**Verify**: `npm run build`; directions → Historical: legend shows the
stepped key and fits at 393px.

- Follow-up: the key overlapped ("Decrease" ran into the first swatch)
  because style.css forces all svg text to 16px Nunito Sans, overriding the
  12px set in the legend code. Columns resized for 16px (label 104px, cells
  70px; key 314px, legend block 354px, fits at 393px and 361px). Last step
  relabelled "≤ −10" / "≥ +10" instead of "−10+" / "+10+".

## 2026-10-27 — Commitment map uses continuous bin ramp

**What changed**

- tokens.js: `bandBreaks = [50, 65, 80]` (mirrors the R `cut()` breaks in
  dfiFull.csv.R / dfiCardinal.csv.R; R still computes `group_value`) and
  `bandMidpoints = [24.5, 57, 72, 90]`.
- scales.js: new `getContinuousBinScale()`: linear scale, bin colours at the
  band midpoints, `d3.interpolateLab`, clamped. `getSequentialScale` kept
  (still used via `getColor(x, 100)`).
- mapCommitmentD3.js, latest mode only: fill uses the continuous bin ramp
  instead of `#f0f0f0 → pillar colour`. Legend gradient sampled from the same
  scale at 11 stops; tick marks + labels at 0 / 50 / 65 / 80 / 100 in `ink`; legend bar 200 → 240px so the 80 / 100 labels do not collide.
  NaN (`#ddd` + hatch), undefined (`#fff`) and historical mode unchanged.
  Pillar colour remains for sparkline strokes, zoom buttons and historical
  "increase".

**Why**: the commitment map now speaks the same colour language as the
binned pillar map, so a country's colour is comparable across both.

**Verify**: `npm run build`; on directions, pick a pillar and a commitment in
latest mode and compare a country's colour on the pillar map vs the
commitment map; legend shows 0/50/65/80/100.

## 2026-10-26 — Colour tokens + contrast fixes

**What changed**

- New `src/components/tokens.js`: score bins (light → dark) Off track
  `#FDE74C`, Catching up `#A9D96C`, On track `#35A88F`, Leading `#007162`;
  `noData` `#dddddd` + `appendNoDataPattern()` hatch; `decline` `#C2410C`,
  `noChange` `#555555`; `ink` `#222`, `inkMuted` `#555`;
  `historicalOpacityFloor` 0.35 (was 0.2); `swatchOutline` (0.5px ink);
  `formatChange()` (▲/▼ + signed value).
- `scales.js`: `getOrdinalCategoryScale()` returns the four fixed bin colours
  in both Total and pillar mode (pillar tint removed); domain label
  "Off course" → "Off track"; unknown values map to `noData`.
  `getSequentialScale` / `getColor` unchanged.
- Fixes a latent bug: the data says "Off track" but the scale domain said
  "Off course", so that bin only got yellow via d3's implicit-domain fallback.
- Historical mode (mapTotalD3, mapPillarD3, mapCommitmentD3, index.md,
  directions.md): declines `#FDE74C` → `decline`; "No change" → `noChange`;
  opacity floor 0.35; ▲/▼ glyphs on legend labels and tooltip values.
- No yellow (or other bin colour) as text: tooltip big numbers in all three
  maps and the heatmap, sparkline value labels (mapPillarD3, mapCommitmentD3),
  and the key-stat card numbers (index.md, directions.md) now use `ink`.
  Key-stat cards get a small outlined colour swatch next to the label instead.
- Legend swatches (mapLegend.js) and the commitment gradient bar get a 0.5px
  ink outline.
- mapTotalD3 / sparklineTableD3: duplicate bin colour maps replaced by tokens;
  mapTotalD3's no-data hatch now comes from `appendNoDataPattern()` (grey
  ground + white stripes, matching the pillar/commitment maps).
- sourcesLegend.js: Project text colour `#8a7600` → `#7a6800`.
- Prose: "Off Course" (methodology.md) and "Off Track" (directions.md) →
  "Off track".

- Follow-up: `noChange` is now `#BDBDBD` (opaque neutral, was `#555555`).
  In mapPillarD3, mapCommitmentD3 and mapTotalD3, countries with change 0
  draw at fill-opacity 1 (others keep the opacity scale), and the "No change"
  legend swatch uses the same colour at full opacity (no more `…20` alpha hex).

**Why**: yellow text failed contrast; Catching up (grey) was close to the
no-data grey; decline yellow clashed with the Off track bin.

**Verify**: `npm run build`; `grep -rn "Off course" src/` → 0 hits. On the
dev server, check home (latest + historical), directions (each pillar, both
modes, commitment map) and a country page heatmap tooltip.
