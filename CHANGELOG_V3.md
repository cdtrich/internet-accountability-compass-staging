# Changelog: v3

## 2026-11-08 — Countries: polar multiples follow the viewport after a resize

Direct on `dev` (tag `pre-polar-resize` = 03f6934). File: `src/countries.md` only.

**Problem.** `isMobile` is set once per page load (`window.innerWidth <= 768`); only `width` was
live (Framework `resize()`, which redraws on every width change). Loaded at 1280 and resized to
744, the multiples kept 5 columns of 134 px, no mobile inset, svg at x -16.

**Fix.** The polar cell uses a small local `polarResize()` instead of `resize()`: same container
div and ResizeObserver, but the mobile flag is read at draw time, and after the first draw it
redraws once, 250 ms after the width stops changing (debounce rather than "redraw on layout-key
change": simpler, and the key would change on almost every frame anyway since the cell width
follows the container). The old svg is replaced (`replaceChildren`), hover is delegated on the
svg, so listeners go with it; the tooltip div is shared via join. Observer and timer are released
on `invalidation`. Heatmap and sparkline table are unchanged.

**Verify** (puppeteer, classic scrollbars, port 3123): load at 1280, resize to 744, 390, back to
1280: 5 / 2 / 2 / 5 columns, cell 203.8 / 348 / 171 / 203.8 px, svg 108.5-1127.3 / 16-712 /
16-358 / 108.5-1127.3 in a viewport of 1265 / 729 / 375 / 1265; no label wider than its cell or
past the svg; scrollWidth = clientWidth; one polar svg; one redraw per step; wedge tooltip works
after each redraw. Drag 1280 -> 744 in 35 steps over 2.8 s: 1 redraw, ~310 ms after the last step
(250 ms debounce included), no long task (> 50 ms). Resized-744 vs fresh-744: same svg markup,
0 differing pixels. Fresh loads at 390 / 744 / 1024 / 1280 vs 03f6934: identical svg markup and
0 differing pixels at three scroll positions each.

**Known, not fixed:** heatmap and sparkline table also get the load-time `isMobile` (margins,
ISO3 vs name labels, sparkline width, headers), so they keep the wrong mode after a resize across
768. Rollback: `git revert`, or the tag.

## 2026-11-07 — Short country names (site only), sources matched by ISO3

Direct on `dev` (tag `pre-country-names` = c5ed887). Two commits: loaders and caches; the
sources ISO3 switch.

**1. Names** (`src/data/country_names.R`, new): a named vector keyed by ISO3 plus
`short_name(iso, name)` (falls back to the original). Sourced by `dfiCardinal.csv.R` and
`dfiFull.csv.R` and applied right after `NAME_ENGL` is set, before the sorts. The workbook keeps
the long names.

| ISO3 | Workbook | Site |
|---|---|---|
| COD | Democratic Republic of The Congo | DR Congo |
| TZA | United Republic of Tanzania | Tanzania |
| RUS | Russian Federation | Russia |
| CIV | Côte D’Ivoire | Côte d'Ivoire |
| VCT | Saint Vincent and The Grenadines | Saint Vincent and the Grenadines |

Caches regenerated per DEV_NOTES "Data refresh" (both deleted, loaders run 2026-11-07 09:27-09:28).
Diff against the committed caches by key (ISO3 + pillar/commitment + year): same rows (6,790 /
16,296) and columns; `NAME_ENGL` changed for exactly these 5 ISO3; row order changed (490 /
1,176 rows moved); in dfiFull also `fx`/`fy` for 14 countries (facet ids numbered in name order;
read only by the rollback-only polarD3.js). 194 distinct names. Country pages: no regeneration
(the template carries only ISO3; names load at runtime).

Rendered: map tooltips on home and both directions maps show the new names; countries Compass,
Heatmap and Historical: DR Congo 46 of 194 (after Côte d'Ivoire, before Denmark), Tanzania 172
(after Tajikistan, before Thailand; was among the U's), Russia 143, Côte d'Ivoire 45, Saint
Vincent and the Grenadines 147; no long form left. Headings on /COD/, /TZA/, /RUS/: DR Congo,
Tanzania, Russia.

**2. Sources by ISO3** (`mapSourcesD3.js` :151, :165, :170, :173, :242; `resources.md` :129):
the selected country is the geometry's `ISO3_CODE`, compared with the sources' `ISO3_CODE`
(was the geometry name against the sheet name). sources.csv has an ISO3 code on all 932 rows;
no name maps to two codes; one row disagrees: line 13 "Andorra" with DZA (an Algeria resource,
Internet Society "Trends & governance"). 25 regional rows (GLO, ASI, AFR, EUR) and XKX have no
map shape and stay unselectable.
Card counts, by clicking every selectable country for each of the 4 types (124 countries, 880
cards before): the only change is DZA Analysis 11 → 12 (the line-13 card now shows under
Algeria; before it showed nowhere). The sheet itself is unchanged: cards and the directions
search list show its long names ("Congo": 8 cards, Congo + Democratic Republic of The Congo;
"Tanzania": 5). Console: only the dev server's favicon 404.

**Rollback**: `git reset --hard pre-country-names` (only before any push), or `git revert`
either commit (reverting the first needs the caches regenerated).

## 2026-11-07 — Polar multiples: wrap long names at every width

`src/components/polarBarsD3.js`: the two-line name wrapping (previous phone-only change) now
applies whenever a name is wider than its cell − 8px, at any width. Rows get the extra 18px only
when some name wraps (always on phones, as before). Font size unchanged (forced 16px); the svg is
not scaled, so the canvas measurement holds.

**Verified** (countries, classic scrollbars): 1024 (cell 160px): 9 names wrap; none wider than
its cell, none past the svg, no neighbour overlap (before: 6 too wide, 3 past the svg, 3
overlaps). 1280 (204px): 3 wrap, all clear (before: 3 too wide, 2 past the svg). 390 and 744
identical to before (6 and 0 wrapped). svg height +720px at 1024 and 1280 (40 rows × 18).

**Not changed, reported**: `isMobile` is set once at page load (countries.md), so the grid does
not switch between 2 and 5 columns on resize. Fresh load at 744: 2 columns; resized from 1280 to
744: 5 columns of 134px, svg from x −16, "Democratic Republic of The Congo" still too wide.

**Rollback**: `git revert` this commit.

## 2026-11-07 — Dot charts: left inset = bubble allowance

`src/components/straightPlotD3.js`: desktop `margin.left` from `Math.max(40, maxBubbleRadius)` to
`maxBubbleRadius` (25px). Right margin and mobile unchanged.

**Verified** (AUS, classic scrollbars): chart title and axis start 25px right of the pillar
intro text at 800-1920 (was 40 after the previous commit, 104-141 before it). No bubble outside
its svg (all four charts; leftmost bubble 8.5px inside). scrollWidth unchanged; at 1280 the
chart's right edge is 1272.5 in a 1265px client, the existing `.chart-breakout`/`.body-text`
overflow (7.5px). 390 and 744 identical.

**Rollback**: `git revert` this commit.

## 2026-11-07 — Country pages: pillar intros in the text column

Direct on `dev` (tag `pre-dotchart-align` = 36f2f84). `src/style.css` only.

**Why**: the pillar intro (`.pillar-section-header`: pillar name and paragraph, beside the
historical sparkline card) started at main's left edge, under the sidebar at 800-1366px (text
left minus sidebar right: −34.7 at 800, −53.3 at 1024, −43.5 at 1280, −0.5 at 1366), while the
dot charts below it start in the text column (104-141px further right).

**Change**: `.pillar-section-header` joins the `.body-text` lists (5vw shift; 769-1200 padding
`var(--sidebar-space) + 1rem`). That list also sets `flex-direction: column`, so one rule right
after it keeps the header a row on desktop (its inline style sets `display: flex; gap; margin-bottom`
but no direction). The ≤768 rule for it now also sets `transform: none; width: auto`, so phones
compute as before. Inline `margin-bottom: 20px` still wins over the list's margin.

**Verified** (AUS, classic scrollbars): header text left minus sidebar right 48 (800), 48 (1024),
20.5 (1280), 67.8 (1366), 108.5 (1440), 372.5 (1920). Chart title minus header text: 40px at
every width ≥769 (before 104-141). Intro and sparkline card stay side by side. 390 and 744:
identical computed styles and positions. scrollWidth unchanged (1280: 1273 vs 1265, the existing
`.body-text` overflow, which the header now shares).

**Rollback**: `git revert` this commit.

## 2026-11-06 — Polar multiples on phones: padding and wrapped names

Direct on `dev` (tag `pre-polar-pad` = 1b6ddc6). `src/components/polarBarsD3.js` only; ≤768px
(`isMobile`) only.

**Why**: at ≤768 `.figure-w-full` is 100vw wide with `margin: 0 -1rem`, so the multiples svg
started at x −16: the first column's labels began off-screen (Central African Republic, Saint
Kitts and Nevis, Saint Vincent and The Grenadines, UAE, Tanzania at 390), and five names were
wider than their 175px cell (Democratic Republic of The Congo 257px overlapped Côte d'Ivoire).

**Change** (mobile only)
- Grid inset: svg `margin-left: 32px` (16 back on screen + 16 padding), width `container − 48`,
  so it spans x 16 to clientWidth − 17 (classic scrollbar). Not scaled: text stays at the forced
  16px. The ≤768 `.figure-w-full` rule is unchanged (maps and heatmap still start at −16).
- Names wider than cell − 8px wrap onto two lines (split at the most balanced space, measured
  with canvas at 700 16px); each row is 18px taller to make room. Chosen over fewer columns:
  one column at 390 would make 194 rows of ~340px (≈66,000px page); wrapping adds 18px per row
  (≈1,750px over 97 rows).
- Wrapped at 390: Bosnia and / Herzegovina, Central African / Republic, Democratic Republic /
  of The Congo, Saint Vincent and / The Grenadines, São Tomé / and Príncipe, United Republic /
  of Tanzania. None at 600 or 744.

**Verified** (classic scrollbars): at 390, 600 and 744 the svg spans 16 to 358 / 568 / 712
(clientWidth 375 / 585 / 729); no label outside the svg, none wider than its cell, no overlap
between neighbours; countries scrollWidth = clientWidth. 1024 and 1280 identical to before.
Console: no new errors (the resize call with width 0 is clamped).

**Seen above 768, not changed**: at 1024 (cell 160px) six names are wider than their cell and
three overlap a neighbour (DRC | Denmark, Saint Lucia | Saint Vincent…, United Kingdom | United
Republic of Tanzania); at 1280 (204px) three are wider, two leave the svg. Wrapping could be
enabled there too (with the 18px row allowance).

**Rollback**: `git revert` this commit.

## 2026-11-06 — Layout: hero capped at 1200px

Direct on `dev`, after the layout entry below. `src/style.css` only: `.hero { width: 80vw }` →
`width: min(80vw, 1200px)`.

**Why**: the hero is 80vw wide and shifted 5vw right, so above about 1650px it ran past the window
(right edge 2008.5 in a 1905px client at 1920: 104px horizontal scroll on every page; on country
pages since they are centred).

**Effect**: 80vw < 1200px below 1500px, so nothing changes there; the 769-1200 and ≤768 rules
(`width: auto`) still win. At 1920 the hero is 1200px wide and ends at 1672.5 (centred main ends at
1528.5). Bound: with main centred, the right edge stays inside 100vw − 32px for any width ≥ 1500.

**Verified** (classic scrollbars, standalone and iframe; home, directions, resources, countries
×3, AUS, BRA at 390, 1024, 1280, 1440, 1920): computed styles of `.hero`, `.body-text`,
`.figure-w-full`, `.chart-breakout` identical to the previous commit except `.hero` width at 1920
(1536 → 1200px). scrollWidth = clientWidth at 1920 on all pages. Remaining mismatches are the
pre-existing ones listed below (1280 `.body-text`, ≤768 `.chart-breakout`).

**Rollback**: `git revert` this commit.

## 2026-11-06 — Layout: content right of the sidebar

Direct on `dev` (tag `pre-layout-fix` = 9ef39ad). `src/style.css` only; values edited inside
existing rules, no rules reordered, no stylesheet links added.

**Why** (measured 2026-11-05): `.figure-w-full` (Total, directions and resources maps, polar
multiples, heatmap) sat 66-164px under the fixed sidebar at 800-1366px and ran past the window at
1920. The 769-1200 override set a width for the space right of the sidebar but no left offset.
On country pages `.chart-breakout` (dot charts) started at main's left edge, not at the text
column (34-68px under the sidebar at 800-1280). Country pages sat left of centre above 1440px
(theme-air `body { max-width: 1440px }` plus our `margin: 0`).

**Changes**
1. `:root { --sidebar-space: 100px }`, `calc(100vw / 12)` at ≤1200px, `0px` at ≤768px (must match
   sidebar.css:6 and :143). The 769-1200 `.body-text`/`.hero` paddings use it
   (`calc(var(--sidebar-space) + 1rem)`, computed values identical).
2. `.figure-w-full` (desktop rule and the 769-1200 rule): `width: min(calc(100vw - var(--sidebar-space) - 48px), 1780px)`,
   `margin-left: calc(50% - 50vw + var(--sidebar-space) + 16px)`, `transform: none`. 16px gap
   after the sidebar, 32px right gutter (absorbs a classic scrollbar: 100vw includes it). The ≤768
   and ≤640 rules are unchanged and still win there.
3. `.chart-breakout` joins the `.body-text` selector lists (desktop and 769-1200). The ≤768 rule
   now also resets what that list gives it (`display: block; flex-direction: row; transform: none;
   margin: 0 -1rem`), so phones compute exactly as before.
4. `body { max-width: none }`: country pages are centred like the top-level pages.

**Intended visual changes**: figures start 16px right of the sidebar (8.5px with a 15px classic
scrollbar, which shifts centring by half its width) and are narrower: 1216 → 1132px at 1280
(−6.9%), 1000 → 960 at 1100, 1368 → 1292 at 1440, 1780 → 1772 at 1920. Charts inside resize with
them (polar multiples 1094 → 1019 at 1280). Country-page dot charts start with the text
(120.5 at 1280, 48px right of the sidebar at 800-1200). Country pages at 1920: main 144 → 376.5,
text column 240 → 472.5 (centred). Nothing changes at ≤768px or on country pages at ≤1440px
apart from the dot charts.

**Verified** (dev server, Chrome with classic scrollbars, standalone and in a 100%-wide iframe of
height 800; home, directions, resources, countries Compass/Heatmap/Historical, AUS, BRA; widths
390, 768, 800, 1024, 1100, 1200, 1280, 1366, 1440, 1920; iframe numbers equal standalone)
- Every `.figure-w-full` and chart svg starts at or right of the sidebar at ≥769px (8.5px right).
  `.chart-breakout` boxes at 769-1200 start at main (32px) but their padding puts the dot charts
  48px right of the sidebar.
- Under the sidebar (elementsFromPoint, 10px grid, whole page height): chart content at 80
  page-widths before, 0 after. Heatmap label "Antigua and Barbuda" at 1280: left 76.3 → 235.3.
- ≤768px: computed styles of `.figure-w-full`, `.chart-breakout`, `.body-text`, `.hero` identical.
- ≥769px: `.body-text`/`.hero` margin, width, transform, padding identical (country pages above
  1440 move only through body centring).
- Zoom buttons (original position, width / 8) on the three maps: 74-210px right of the sidebar at
  800-1920 (before: −39.5 at 1280). At 1280 and 1440 they touch no country shape, only
  outline-only French Polynesia islets (4-24px). Real clicks: 48 of 48 runs zoom in (k 1.5), out
  and reset; elementFromPoint at each button centre is the button.
- Console: only the dev server's favicon 404.

**Not fixed (pre-existing, unchanged; scrollWidth ≠ clientWidth)**
- 1280 with a classic scrollbar: `.body-text` (100% wide + translateX(5vw)) ends at 1272.5 in a
  1265px client: 8px horizontal scroll on pages with body text; on country pages
  `.chart-breakout` now shares that rule and edge.
- ≤768px country pages: `.chart-breakout { width: 100vw }` overflows by the scrollbar width
  (406/375 at 390, 784/753 at 768).
- 1920: `.hero` (80vw) ends at 2008.5 in a 1905px client; on country pages this overflow is new
  because they are now centred. Fixed in the next commit (hero entry above).

**Rollback**: `git reset --hard pre-layout-fix` (only before any push), or `git revert`.

## 2026-11-05 — Heatmap: a row for every country, empty cells hoverable

Direct on `dev` (tag `pre-heatmap-rows` = 55d6b37). Component only: `heatmapD3.js`.

**Why**: the heatmap (countries, Heatmap view) dropped every row whose group_value is "NA"
before drawing. On the current data that hid 253 cells: 148 blank slots in 173 rows that could
not be hovered, and 21 countries with no row at all.

**Change**
- Every country in the latest-year data gets a row (194). A cell without a category is drawn
  as an empty rect: no fill, no hatch, no border, `pointer-events: all`, same click (country page).
- Empty-cell tooltip (tooltipHTML): title country, context pillar, note "Partial data" for a
  pillar whose ned is "Partial data", otherwise "Not enough data"; the Total score column is
  always "Not enough data". Drawn cells' tooltips unchanged.
- Height: fixed 27px rows (the rows were 27.1px at 1280 and 26.7px at 390 with 173 rows),
  `max(3000, marginTop + marginBottom + rows × 27)`. Replaces `max(3000, data.length × 5)`.
- Row order rule unchanged. Note: the sort reads `d.total`, which dfiCardinal rows do not have,
  so every country scores −1 and the order is the data order (alphabetical). The 21 rows
  therefore appear at their alphabetical positions; the 173 existing rows keep their order.

**Verified** (dev server, current data)
- 194 rows × 5 = 970 cells (before 173 rows, 717 cells); 253 empty (231 pillar cells, all ned
  "Partial data", and 22 Total score cells); no duplicate country/pillar cells.
- Newly shown (21): Andorra, Brunei, Cuba, Dominica, Equatorial Guinea, Eritrea, Grenada,
  Kiribati, Liechtenstein, Marshall Islands, Micronesia, Monaco, Nauru, North Korea, Palau,
  Saint Kitts and Nevis, Samoa, San Marino, Solomon Islands, Tonga, Tuvalu.
- Tooltips (hit test on the cell itself; sizes in {28, 20, 16, 12, 11}px, width ≤ 260px):
  - Afghanistan, Connectivity (empty): "Afghanistan / Connectivity and infrastructure / Partial data", 190.9 × 80.6px.
  - Andorra, Total score (empty): "Andorra / Total score / Not enough data", 111 × 80.6px.
  - Afghanistan, Rights (drawn): "24 / Afghanistan / Rights and freedoms / Off track", 137.7 × 116.2px, as before.
  - Brazil, Total (drawn): "73 / Brazil / Total score / On track", 84.6 × 116.2px, as before.
- Size: svg 1216 × 5399.6 at 1280 (was 4850), 390 × 5473 at 390; cells 121.6 × 27 and
  62.4 × 27. 194 y-axis labels; the last ends 42px above the svg bottom; the card grows with
  it (5405.6px). In a 100%-wide iframe (height 800) the page scrolls to the chart end (svg
  bottom at 756 of 800 when scrolled to the bottom); no horizontal scroll (scrollWidth 1280).
- Console: countries only `404 /favicon.ico` (dev server, as before); AUS none.

**Seen, not changed**: at 1280 the y-axis label "Antigua and Barbuda" starts under the sidebar
(before and after).

**Rollback**: `git revert` this commit, or `git reset --hard pre-heatmap-rows` (only before any push).

## 2026-11-05 — Map zoom controls moved to the right edge

Direct on `dev` (tag `pre-zoom-move` = fefb8b0). Components only: `mapTotalD3.js`,
`mapPillarD3.js`, `mapCommitmentD3.js`.

**Why**: at 1280px the zoom group (+, −, ⌂; 40 × 140) sat at x 68-108, under the 100px sidebar
(home and both directions maps, standalone and in the iframe). `elementFromPoint` at the button
centres hit the sidebar links (Resources, Perspectives, Methodology), and a real click on a
button opened that page instead of zooming. The svg at 1280 starts at x −64, so `width / 8`
(152 user units) lands at screen x 88.

**Change**: `translate(${width / 8}, …)` → `translate(${width - width / 8}, …)`, same y.
The circles are centred on the group's x (r 20), so this mirrors the old offset exactly
(left edge `width / 8 − 20` from the left ↔ right edge `width / 8 − 20` from the right).
Sizes, spacing, hover, click handlers and `data-tour="zoom"` (Total map) unchanged.
`mapSourcesD3.js` already sat at the right edge (`width − 50`) and is unchanged.

**Verified** (dev server; widths 800, 1024, 1280, 1366, 1440, 1920; standalone and in a
same-origin iframe, width 100%, height 800; home, directions (both maps), resources)
- No overlap with the sidebar rect at any width, and none with the map legend or the
  scroll-message overlay.
- `elementFromPoint` at all three button centres is that button in every case (before: sidebar
  links at 1280 on home and directions).
- Real mouse clicks: + k 1 → 1.5, − 1.5 → 1.005, ⌂ → identity, at every width in both
  contexts. Before: at 1280 the clicks navigated to /resources or /perspectives.
- Example position at 1280: group at x 980-1020 (svg −64 to 1152); at 1440 x 1177-1217;
  at 1920 x 1677.5-1717.5.
- ≤ 768px: + and − are still `display: none`. The ⌂ button, still shown by design, moves with
  the group to the right: directions/home x 60 → 636 at 768, 13 → 305 at 390.
  Resources unchanged (682 at 768, 304 at 390).
- Console on home, directions, resources: no errors.
- The buttons now sit over the map at eastern Australia / Tasman Sea (screenshot at 1280);
  they block hover there.

**Open finding (not fixed)**: at 1920 `document.documentElement.scrollWidth` is 2016 on
directions: `div.hero` is 1536px wide with its right edge at 1964. Home and resources also measure
2016 at 1920 (cause there not checked).

**Not changed**: tour.js (its text mentions the + / − / ⌂ buttons but not their position).

**Rollback**: `git revert` this commit, or `git reset --hard pre-zoom-move` (only before any push).

## 2026-11-04 — Partial data on the pillar and Total maps

Direct on `dev` (tag `pre-partial-data` = 5c9ccb0). Components only: `mapPillarD3.js`,
`mapTotalD3.js`. Basis: methodology rule 2 (a pillar score needs all three indicators). On the
current data every pillar row without a value has ned "Partial data" (231 rows in 2026, 0
exceptions), so every grey Latest country on the pillar map is a Partial-data country.

**Pillar map**
- One hatch for countries without a value (`white-diagonal-lines-map-ned`, grey base), both modes.
  The second overlay (`ned === "Partial data"`, `white-diagonal-lines-map`) and its pattern are
  removed (grep: no other user), so hatches no longer stack.
- Legend: one grey-with-hatch entry, "Partial data" in Latest, "Not enough data" in Historical.
  The dark "Partial data" swatch is gone.
- Tooltip, no value: Latest "Partial data" when ned is "Partial data", else "Not enough data";
  Historical stays "Not enough data". The dead `partialNote` (tested "not enough data") is removed.

**Total map**: a pillar with value "NA" and ned "Partial data" now gets a note line
"{Pillar}: Partial data", in pillar order (replaces the dead `_ned === "not enough data"` test).
Numeric lines unchanged.

**Verified** (dev server, 1280px, current data)
- Grey countries: Latest 73, Historical 75 (unchanged); each has exactly one hatch; no other
  country has an overlay. Pattern defs: only `white-diagonal-lines-map-ned`.
- Historical-only grey: Bolivia and Nepal (2026 Connectivity 71 and 68, 2025 "Partial data", so
  no change value). Grey with the same hatch; tooltip "Bolivia / Not enough data",
  "Nepal / Not enough data".
- Tooltips (all pass the phase 3 assertions: sizes in the set, width ≤ 260px, `.tt-*` tokens):
  - Total Brazil: unchanged text, 211.1 × 185.7px.
  - Total Afghanistan: "Connectivity and infrastructure: Partial data" added, 245.8 × 185.7px.
  - Total Djibouti: three pillars "Partial data", Trust 41, 253.6 × 185.7px.
  - Total Bahamas: four pillars "Partial data", 253.6 × 185.7px.
  - Pillar Kiribati: Latest "Kiribati / Partial data" (84.8 × 61.8px); Historical
    "Kiribati / Not enough data" (111 × 61.8px). Pillar Latest Brazil "80 / Brazil / Leading".
- Console: home only `404 /favicon.ico` (dev server, as before); directions (both modes) clean.

**Not changed**: commitment map, heatmap, sparkline table, polar charts, country page template.

**Rollback**: `git reset --hard pre-partial-data` (only before any push), or `git revert` the
component commit.

## 2026-11-04 — Data refresh: dfiCardinal cache

Committed on `dev` as 86672ee (`src/.observablehq/cache/data/dfiCardinal.csv` only).

**Why**: the committed cache (436f4e5, 26 Oct) predated the 3 Nov workbook update (f44d2bc).
Framework rebuilds a cache only when the loader script is newer than it, and does not check the
workbook. The cache was regenerated after the loader edit (0cd792b) touched the loader file.

**Data rule**: the workbook follows methodology.md rule 2 (a pillar score needs all three
indicators); the old cache did not (e.g. Andorra Connectivity 96 was the mean of two indicators).

**Numbers** (old cache vs new)
- 6,790 rows, 3,301 changed: value to NA 2,214, revised 1,087, NA to number 0; group_value
  changed in 2,287 rows.
- 2026 total scores unchanged (281 earlier-year totals changed).
- 101 countries lose at least one 2026 pillar score (39 lose 1, 17 lose 2, 25 lose 3, 20 lose 4).
- 2026 pillar rows with no value: 231, all with ned "Partial data" (0 exceptions). Countries with
  no 2026 value per pillar: Connectivity 74, Rights 60, Responsibility 68, Trust 29.

**Effects seen on the current data** (render check, no fixes)
- Total map tooltip omits missing pillars for 79 countries.
- Pillar map: stacked hatches on 73 grey countries; the "Partial data" legend entry describes no
  country alone.
- Heatmap drops 253 cells (148 blank slots, 21 countries absent).
- Sparkline table has 17 empty rows.
- Andorra page says "Partial data in ..." for pillars with no value.

**Not yet served anywhere**: `staging/main` is still 0cd792b with the old cache.

**Rollback**: `git reset --hard 0cd792b` (only before any push).

**Open**
- Partial-data wording and the hatch fix.
- Heatmap and sparkline table presentation of missing values.
- Andorra page text (template: needs regeneration, ask first).
- A freshness check for the cache (workbook newer than cache).
- `src/data/sources.csv.R` still reads a Google Sheet.

## 2026-11-04 — UI tokens, phase 3 (one tooltip anatomy)

Branch `feature/ui-tooltips` (tag `pre-ui-tooltips` = dev with phase 2 merged). Three commits:
(1) rounding; (2) helper + CSS + the four maps + caption + sparkline labels; (3) the other five
charts + dead-class removal + this entry. Template per chart: TOOLTIP_INVENTORY.md (untracked).

**Anatomy** (`components/tooltipHTML.js`, rules next to `.chart-tooltip` in style.css). Rows in
this order, empty rows skipped, text inserted as before (no escaping added):

| row | class | size | weight | line-height | colour |
|---|---|---|---|---|---|
| value | `.tt-value` | 28px (`--tt-value-size` 1.75rem) | 700 | 1.15 | ink #222, or `valueColor` |
| change value | `.tt-value.tt-value--change` | 20px (`--tt-change-size`) | 700 | 1.15 | ink |
| title | `.tt-title` | 16px (`--tt-title-size`) | 700 | 1.4 | ink, or `titleColor` |
| context, one per item | `.tt-context` | 12px (`--ui-text-sm`) | 400 | 1.4 | ink |
| note, one per item | `.tt-note` | 11px (`--ui-text-xs`) | 400 | 1.4 | #555 (`--ui-ink-muted`) |
| extra | (sparkline SVG) | | | | |

Rows after the first get `margin-top: 2px` (`--tt-gap`). `.chart-tooltip` gains
`line-height: 1.4`, `color: var(--ui-ink)` and `max-width: var(--tt-max-width)` (260px) with
`box-sizing: border-box`. One token replaces the earlier 300px on `.chart-tooltip` and `.map-tooltip`
(the `.map-tooltip` rule is gone; the class stays in mapTotalD3.js as the singleton selector).
The border-box is an addition to the spec: without it, padding and border made the historical
map tooltips 326px wide at the first 300px limit.
At 260px (Brazil): Total Latest 211.1px (unchanged); Total, Pillar and Commitment Historical 260px.
Only the change caption notes wrap (2 lines, as at 300px); no title or context row wraps.

**Per chart**
- **Total map**
  - Latest: value, name, context "Internet Accountability Score (IAS)" + category, then one note per pillar. The `_ned`/`_note` logic is unchanged.
  - group_value "NA": name + "Not enough data".
  - That branch was removed again (unreachable: the data layer only holds a set, non-NA group_value; the 22 such countries get the base-layer no-data tooltip). Brazil's Latest tooltip is identical before and after (text, computed styles, 211.1 × 185.7px).
  - Inline `line-height: 1.6` removed.
- **Pillar and Commitment maps**
  - Latest: value, name, category; "Partial data" note under the existing condition.
  - Historical: change, name, caption note, sparkline.
  - No data: name + "Not enough data".
- **Sources map:** name, then context "Analysis: n".
- **Polar multiples:** value, then commitment as the title ("Score:" prefix dropped).
- **Polar single:** value and title in the pillar colour; pillar as context.
- **Heatmap**
  - Value, name, context pillar + category (category omitted when empty or "N/A"), "Partial data" note under the existing condition.
  - No value: name + "Not enough data" (was "No data").
- **Sparkline table:** value, then context year.
- **Straight plot:** value, then label (country, or "N countries").
- **Indicator historical**
  - Value, plus note "Carried forward" / "Backdated"; nothing for "actual".
  - The circle `<title>` text is unchanged.
- **Sparklines:** Total map value labels bold and ink (were 400, #000), as on Pillar and Commitment. Nothing else in any sparkline changed (diffed: positions, sizes, fills, attributes).
- **Dead classes:** `.tooltip-title` and `.tooltip-small` removed from style.css (grep: no users left). Unused leftovers also removed: heatmapD3's `ink` import, and indicatorHistorical's `statusText().html`.

**Rounding** (commit 1, revertible on its own)
- Displayed scores use `Math.round` everywhere: polar multiples total label and tooltip, polar single tooltip, heatmap cell labels and tooltip.
- Remaining `Math.floor` calls are layout only (grid rows, label truncation, legend rows), plus the rollback-only polarD3/polarCountryD3, which aren't imported.
- No binning uses a floored value: categories come from R `cut()` on the raw value.
- Changed values today: **0**. Every score in the data is an integer: 0 of 2,027 polar marks, 172 polar totals and 945 heatmap cells; 0 of 13,504 dfiFull and 6,587 dfiCardinal values over all years.

**Change caption is now derived**: `(${previousYear}→${latestYear})`, the variables the change is
computed from (`latestYear = d3.max(data, year)`, `previousYear = latestYear - 1`). It reads
**2025→2026** on all three maps (was the literal "2024→2025"). No forced line breaks.

**Visible changes** (dev server, 1280px, each chart's own hover event; element screenshots and
computed styles outside the repo; mobile and touch not checked)

| component | before | after | intended |
|---|---|---|---|
| Latest map score (Total, Pillar, Commitment) | 42px, inline with the name | 28px row; name on its own row below | Y |
| Total "IAS" label | 12px/400 above the score | 12px context row below the name | Y |
| Category | "(On track)" bare text, 12px, after the name; heatmap `<em>` 16px italic | 12px context row, no brackets, not italic | Y |
| Total pillar lines | 11px #000, one span | 11px #555, one note row each | Y |
| Change value (Total) | 28px | 20px | Y |
| Change caption | "(2024→2025)", forced `<br>`s | "(2025→2026)", wraps at 260px | Y |
| Historical map tooltip width (Total / Pillar / Commitment) | 203.3 / 211.3 / 176px | 260px (max-width binds) | Y |
| Names and body text | #000 | #222 (ink) | Y |
| Heatmap score | 28px/900 (nested strong) | 28px/700 | Y |
| Polar multiples | "Score: **56**" 12+16px, commitment 12px | 28px value, commitment 16px/700 title | Y |
| Polar single commitment | 16px/400, pillar colour | 16px/700, pillar colour | Y |
| Sparkline table, indicator, straight plot value | 16px (12px straight plot) | 28px | Y |
| Straight plot order | name, value | value, name | Y |
| Indicator status | " (carried forward)" 12px #000 inline | "Carried forward" 11px #555 note row | Y |
| Sparkline table year | "(2026)" 12px inline | "2026" 12px row | Y |
| No-data tooltips (Total, Commitment) | 66.8 / 64.5px tall | 61.8px (line-height 1.4) | Y |
| Total sparkline value labels | 400, #000 | 700, #222 | Y |
| Polar and heatmap displayed numbers | `Math.floor` | `Math.round` (0 values differ) | Y |

**Checks**
- Every text node in every tooltip is 28, 20, 16, 12 or 11px (sparkline SVG text excluded).
- No tooltip is wider than 260px (checked at 300px for all charts; the four widest recaptured at 260px).
- Captions read 2025→2026 on all three maps.
- On-chart labels equal the tooltip values:
  - Polar: 5 total labels match `total`; 5 marks' tooltip values match the data.
  - Heatmap: 5 cells, plus the Total column for the same 5 countries.
- Console on home, directions, countries (3 views), resources and AUS (2 views): only the
  `404 /favicon.ico` on home, as before.

**Deferred**
- **Partial-data audit.** The checks never match the data, so "Partial data" never shows:
  - Pillar map: tests `ned === "not enough data"`; the data has "Partial data" for 146 countries (NA for 120).
  - Commitment map and heatmap: test `note === " (partial data)"`; the data has "NA" or "Not enough data".
  - Total map pillar lines: test `_ned === "not enough data"`, against the same data.
- Rounding in the rollback-only polarD3/polarCountryD3.

**Rollback**: `git switch dev; git branch -D feature/ui-tooltips` (tag `pre-ui-tooltips`), or
`git revert` any of the three commits (rounding is its own commit).

## 2026-11-04 — UI tokens, phase 2 (component JS + CSS)

Branch `feature/ui-tokens-js` (tag `pre-ui-tokens-js` = dev before, phase 1 merged).
Two commits: (1) tooltips, edits 1-4; (2) scroll message, legend tint, mobile heights, this entry.

**Edits**
1. **mapTotalD3.js**: tooltip is `chart-tooltip map-tooltip`, a singleton joined on `.map-tooltip`
   (was `append`, which added a new div per render). Inline styles removed except position,
   visibility, pointer-events and `line-height: 1.6` (not provided by `.chart-tooltip`; kept so
   the only line-height change is the one that follows the 14 → 12px base text).
   style.css: `.map-tooltip { max-width: 300px }`.
2. style.css: `.tooltip-title { font-size: 1rem }` on the unstyled country-name `<strong>` in
   mapTotalD3 (3 variants), mapSourcesD3, straightPlotD3, the polarBarsD3 multiples `<strong>`
   (it holds the score) and the polar single indicator-name `<span>`. Not applied (outside the
   list, same 16px via `div > *`): the name `<strong>` in mapPillarD3, mapCommitmentD3, heatmapD3.
3. Captions and "Not enough data" spans in mapTotalD3, mapPillarD3, mapCommitmentD3: inline
   `font-size: 11px; color: #000/#666` → `class="tooltip-small"`. Defect found and fixed:
   `.tooltip-small` had `line-height: 0.5`, which shortened the pillar/commitment tooltips by
   1.5px (historical) and 0.5px ("Not enough data"). Removed; measured no-op on the Total map
   tooltips, which used the class before (66.8 → 66.8px, 185.1 → 185.1px).
4. mapTotalD3.js: label above the score `font-weight: regular` (invalid, rendered 700) → 400.
5. `.map-scroll-message` rule in style.css (tokens); the identical inline cssText removed from
   mapTotalD3, mapPillarD3, mapCommitmentD3, mapSourcesD3 (8 static properties, nothing dynamic;
   `messageDiv` had no other use). Wrapper `.map-scroll-overlay` cssText unchanged.
6. sourcesLegend.js: unselected tint alpha 0.12 → 0.1 (as customLegend.js).
7. ≤768px `box-sizing: border-box`: style.css on `.legend-item, .sources-legend-item`; for
   `.mode-toggle-item` in modeToggle.css's existing ≤768px rule (where its min-height lives;
   adding it to style.css would have needed a new selector there).

**Computed-style changes** (dev server, puppeteer-core; 1280 and 390px; home, directions,
resources, AUS, countries; tooltips via each chart's own hover event; script outside the repo).
All differences found, all intended:

| component | property | before | after | intended |
|---|---|---|---|---|
| Total map tooltip | class | map-tooltip | chart-tooltip map-tooltip | Y |
| Total map tooltip | border | none | 1px solid #ddd | Y |
| Total map tooltip | radius | 8px | 4px | Y |
| Total map tooltip | box-shadow | 0 4px 12px rgba(0,0,0,.15) | 0 2px 8px rgb(0 0 0/.15) | Y |
| Total map tooltip | padding | 12px | 10px 12px | Y |
| Total map tooltip | font-size (base text, e.g. "(On track)") | 14px | 12px | Y |
| Total map tooltip | line-height (follows font-size, factor 1.6) | 22.4px | 19.2px | Y |
| Total map tooltip | z-index | 1000 | 1100 | Y |
| Total map tooltip | size, BRA latest / historical / Samoa | 217.7×203.1 / 201.3×181.6 / 109×72 | 211.1×185.1 / 203.3×173.2 / 111×66.8 | Y (follows above) |
| Total map tooltip | max-width | 300px | 300px (CSS) | Y (no change) |
| Total, Pillar, Commitment captions + "Not enough data" | colour | #000 / #666 | #555 | Y |
| same | font-size | 11px | 11px | Y (no change) |
| **Total label "Internet Accountability Score (IAS)"** | **font-weight** | **700** | **400** | **Y (visible)** |
| scroll message ×4 | box-shadow | 0 2px 8px rgba(0,0,0,.2) | 0 2px 8px rgb(0 0 0/.15) | Y |
| scroll message ×4 | colour (box and span) | #666 | #555 | Y |
| scroll message ×4 | size, padding, border, radius, bg, weight | 212.4×42 … | equal | Y (no change) |
| sources legend, unselected | background alpha | 0.12 | 0.1 | Y |
| .mode-toggle-item ≤768px | rendered height | 60px | 44px | Y |
| .sources-legend-item ≤768px (normal + selected) | rendered height | 60px | 44px | Y |
| .legend-item ≤768px (directions) | rendered height | 60px | 58px | Y (see note) |

`.tooltip-title` elements, computed font-size/weight before → after (must be equal): Total
"Brazil" (latest, historical) 16px/700 → 16px/700; Total "Samoa"/"Tonga" 16/700 → 16/700;
Sources "United States" 16/700 → 16/700; straightPlot "Afghanistan" 16/700 → 16/700; polar
multiples "36" 16/700 → 16/700; polar single "ICT Development Index" 16/400 → 16/400. All equal
at 1280 and 390.

**Notes**
- `.legend-item` at 390 renders 58px, not 44: every label wraps to two lines in the half-width
  tile (2 × 21px + 16px padding). The 44px minimum now applies; content is taller.
- The pillar map's default view (Connectivity, latest year) had a value for every country at the
  time (stale cache), so its "Not enough data" tooltip was not reachable and the commitment one
  (same markup) was captured. On the current data Connectivity has no 2026 value for 74 countries
  (see "Data refresh: dfiCardinal cache", 2026-11-04).
- Console (home, directions, AUS; also resources, countries): no page errors; one
  `404 /favicon.ico` on home from the dev server, before and after.

**Deferred**: Phase 3 keyboard access (toggle, legend items, zoom buttons); blog font sizes;
zoom buttons under the sidebar at 1280 (x 68-108px vs sidebar 0-100px, measured 2026-11-04).

**Rollback**: `git switch dev; git branch -D feature/ui-tokens-js` (tag `pre-ui-tokens-js`), or
`git revert` either commit.

## 2026-11-03 — UI tokens, phase 1 (CSS only)

Branch `feature/ui-tokens` (tag `pre-ui-tokens` = dev before). Files: src/style.css,
src/modeToggle.css, src/custom-legend.css. Values only: no selector or stylesheet-order
changes, except three new rules (sourcecard focus, zoom-button hover, mobile toggle height).
Inventory behind it: INVENTORY_UI.md (untracked).

**Tokens** (new `:root` block in style.css, next to the theme block; comment: keep in sync with
components/tokens.js `ink`, `inkMuted`, `bins.leading`):
`--ui-radius: 4px`, `--ui-border-color: #ddd`, `--ui-shadow: 0 2px 8px rgb(0 0 0 / 0.15)`,
`--ui-text-xs: 0.6875rem` (11px), `--ui-text-sm: 0.75rem` (12px), `--ui-text-md: 0.875rem` (14px),
`--ui-ink: #222`, `--ui-ink-muted: #555`, `--ui-accent: #007162`, `--ui-surface: #fff`,
`--ui-transition: 0.2s ease`, `--ui-hover-filter: brightness(0.95)`,
`--ui-focus: 2px solid var(--hover-color)`, `--z-tooltip: 1100`.
`--theme-foreground-focus` is now `var(--ui-accent)` (same value).

**Computed-style changes** (dev server, puppeteer-core; home, perspectives, directions, AUS at
1280 and 390px; normal / hover / focus; script outside the repo). Every difference found is
listed; all are intended. Colour changes also move `border-*-color` and `outline-color`
(both `currentColor`, no visible border or outline).

| component | property | before | after | intended |
|---|---|---|---|---|
| .chart-tooltip | padding | 8px | 10px 12px | Y |
| .chart-tooltip | box-shadow | none | 0 2px 8px rgb(0 0 0 / .15) | Y |
| .chart-tooltip | z-index | 1000 | 1100 | Y |
| .chart-tooltip | width (AUS 390, follows padding) | 144.4px | 136.4px | Y |
| .chart-tooltip / .tooltip-small | font-size | 12px / 11px | 12px / 11px (rem tokens) | Y (no change) |
| .mode-toggle-item (unselected) | color | #111 | #222 | Y |
| .mode-toggle-item (unselected) :hover | background | #d0d0d0 | #e0e0e0 + brightness(0.95) | Y |
| .mode-toggle-item.selected :hover | background | #000 | #222 + brightness(0.95) | Y |
| .mode-toggle-item ≤768px | display / min-height / height | block / auto / 21px | flex, centred / 44px / 44px content (60px box incl. padding) | Y |
| .sources-legend-item | padding | 10px 28px | 8px 24px | Y |
| .legend-item | font-size, radius, transition, hover filter | 14px, 4px, all .2s, .95 | same values via tokens | Y (no change) |
| .sourcecard | border-radius | 10px | 4px | Y |
| .sourcecard | transition | bg, color .3s | bg, color, transform, box-shadow .2s | Y |
| .sourcecard:hover | transform | scale(1.05) | scale(1.02) | Y |
| .sourcecard:hover | box-shadow | 0 4px 8px rgba(0,0,0,.3) | 0 2px 8px rgb(0 0 0 / .15) | Y |
| .sourcecard:hover | font-weight | 700 | 500 | Y |
| a:focus-visible .sourcecard | outline | none | 2px solid #000, offset 2px | Y |
| .desktop-notice (≤640px) | color | #333 | #222 | Y |
| .desktop-notice | border-bottom-color / font-size | #d0e8ff / 14px | #ddd / 14px | Y |
| .zoom-button:hover circle | fill | white | #f2f2f2 | Y |
| .blog-date | color | #999 | #555 | Y |
| .blog-toc-date | color | #595959 | #555 | Y |
| .blog-toc li | border-left-color | #e0e0e0 | #ddd | Y |
| .toc-toggle-button (390) | color | #999 | #555 | Y |
| .card (AUS) | border-radius | 12px (Framework card.css) | 4px | Y |

**Notes from the check**
- Tooltip child font sizes, unchanged (reported, not fixed): `.chart-tooltip` 12px container;
  inline `<strong>` 28px (polar) / 42px (map); unstyled `<strong>` country name and inline
  polar `<span>` render 16px (`div > *` rule); `.map-tooltip` 14px container, inline label 12px,
  score 42px, name 16px, pillar list 11px.
- `.card` on top-level pages (index, countries, directions): background transparent, border 0,
  no overflow clipping, so the radius paints nothing (no visible change).
- At 1280px the map zoom buttons sit at x 68-108px, under the fixed 100px sidebar: the mouse
  hits the nav, so the hover (and the buttons) are unreachable there. Pre-existing, not fixed.
  Hover verified at 390px.
- Not captured (hidden by design): desktop notice at 1280, zoom +/− at 390, mobile blog ToC
  while closed, ToC button at 1280.
- Size: style.css +1,127 B raw, +360 B gzip -9 (source, LF); top-level pages load it twice
  (minified bundle + link). modeToggle.css +84 B gzip, custom-legend.css +7 B gzip.

**Deferred**: Phase 2 (JS inline styles: map tooltip, scroll message, zoom buttons, legend
colours, sources.js); Phase 3 (keyboard access for toggle, legend items, zoom buttons);
tooltip title size, pending a decision on the child font-size table above.

**Rollback**: `git switch dev; git branch -D feature/ui-tokens` (tag `pre-ui-tokens` marks the
starting point).

- 2026-11-04 recheck: mode toggle hover is `filter: var(--ui-hover-filter)` only on both states (no background swap; already so in phase 1). Rendered heights: toggle 37px at 1280, 60px at 390.
- FLAG (not fixed, predates phase 1): at ≤768px `.legend-item` and `.sources-legend-item` also render 60px, not 44px (`min-height: 44px` + 8px padding, `content-box`; sources item was 64px before phase 1). The toggle is left at the same 60px, so no `box-sizing` change.

## 2026-11-03 — Provenance markers: tooltip names the status; long legend label back

- **indicatorHistorical.js**: tooltip and `<title>`: published "**8**", carried
  "**100** (carried forward)", backdated "**5** (backdated)" (replaces "(computed)").
- **statusLegend.js**: second label back to "Computed (carried forward or backdated)";
  the ≤600px column also gets `max-width: 100%`.

**Verify** (AFG, Historical): at 361 and 393px both markers at left edge 32px, column
fits (right edge 293 / 322px); 1440px one centred row; tooltips as above.
**Rollback**: revert this commit.

## 2026-11-03 — Provenance markers: shorter tooltip, stacked legend on phones

- **indicatorHistorical.js**: tooltip and `<title>` name the status only when computed:
  "**24**" (published), "**24** (computed)" (carried or backdated). Edition and
  "data for" wording removed (replaces the texts in the entry below).
- **statusLegend.js**: layout moved from inline styles to a scoped `<style>` so a media
  query can apply. ≤600px: a left-aligned column (`flex-direction: column`,
  `align-items: flex-start`, `width: fit-content`, `margin-inline: auto`); wider: one
  centred row as before. Markers `flex: none`. Second label "Computed value".

**Verify** (AFG, Historical): at 361 and 393px both markers have the same left edge
(43.6px and 58px) in a column; at 1440px one centred row. E-Waste 2021 "100 (computed)",
2024 "99"; GCI 2020 "5 (computed)"; Freedom in the World 2026 "8".
**Rollback**: revert this commit.

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
