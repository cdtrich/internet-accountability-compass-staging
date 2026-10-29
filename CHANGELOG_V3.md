# Changelog: v3

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
