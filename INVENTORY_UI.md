# UI style inventory (tooltips, toggles, buttons, legends, zoom, source cards, notices, blog cards)

Branch `dev`, read-only pass, 3 Nov 2026. Line numbers are for the working tree at c1ce8aa.
"(JS)" = value set from JavaScript (inline `style`, `.style()`, `.attr()` on SVG, or a CSS string injected by JS).
"-" = not set by that rule (inherited or UA default).

Scope notes:
- `src/components/*.css` and `src/inputs.css` do not exist. The stylesheets are `src/style.css`, `src/sidebar.css`,
  `src/modeToggle.css`, `src/custom-legend.css` (and dead `src/toggleSwitch.css`).
- Rollback-only modules `polarD3.js`, `polarCountryD3.js` and `toggleSwitch.js` are imported only in comments
  (`countries.md:24,28`, `1countryPageTemplate.md:23`, `directions.md:30`, `index.md:59`). Their values are listed
  separately where relevant, not in the main tables.
- Files that mention the tour (not inspected for tour content): `src/components/mapTotalD3.js`, `src/components/tour.js`,
  `src/tour.css`, `src/index.md` (its inline `<style>` block, lines 13-49, was not read), `nav-html.js`.

Stylesheet load matrix (from `<link>`s in the pages and `observablehq.config.js:24,47`):

| page | style.css | sidebar.css | modeToggle.css | custom-legend.css | Framework theme-air stack |
|---|---|---|---|---|---|
| index.md | bundle + link | yes | yes | no | no |
| countries.md | bundle + link | yes | yes | no | no |
| directions.md | bundle + link | yes | yes | yes | no |
| resources.md | bundle + link | yes | no | yes | no |
| methodology.md, perspectives.md | bundle + link | yes | no | no | no |
| country pages (template) | link once | yes | yes | yes | yes (`theme: air`) |

## 1. Component tables

### 1a. Tooltips

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| shared chart tooltip | `.chart-tooltip` | src/style.css:451 | 12px | var(--sans-serif) | - | - (inherits) | white | 1px solid #ddd | 4px | - | 8px | - (visibility toggled in JS) | 1000 | - | - | - |
| map tooltip (Total map) | `.map-tooltip` | src/components/mapTotalD3.js:481-493 (JS) | 14px (JS) | var(--sans-serif) (JS) | - | - | white (JS) | - | 8px (JS) | 0 4px 12px rgba(0,0,0,0.15) (JS) | 12px (JS) | - | 1000 (JS) | - | - | - |
| small tooltip text | `.tooltip-small` | src/style.css:465 | 11px | - | - | #666 | - | - | - | - | - | - | - | - | - | - |
| tooltip headline number | inline `<strong>` | heatmapD3.js:236, mapTotalD3.js:567, polarBarsD3.js:449 (JS) | 28px | - | bold | ink #222 / pillar colour (polarBars) | - | - | - | - | margin-bottom 8px | - | - | - | - | - |
| tooltip big score | inline `<strong>` | mapTotalD3.js:586, mapPillarD3.js:533, mapCommitmentD3.js:502 (JS) | 42px | - | bold | ink #222 | - | - | - | - | margin 0 0 8px | - | - | - | - | - |
| tooltip change score | inline `<strong>` | mapPillarD3.js:522, mapCommitmentD3.js:491 (JS) | 20px | - | - | ink #222 | - | - | - | - | - | - | - | - | - | - |
| tooltip label above score | inline `<strong>` | mapTotalD3.js:583 (JS) | 12px | - | `regular` (invalid keyword) | ink #222 | - | - | - | - | margin-bottom 0 | - | - | - | - | - |
| tooltip caption | inline `<span>` | mapTotalD3.js:570,590; mapPillarD3.js:526; mapCommitmentD3.js:495 (JS) | 11px | - | - | #000 | - | - | - | - | - | - | - | - | - | - |
| "Not enough data" | inline `<span>` | mapPillarD3.js:529,536; mapCommitmentD3.js:498,506 (JS); mapTotalD3.js:652 uses `.tooltip-small` | 11px | - | - | #666 | - | - | - | - | - | - | - | - | - | - |
| sparkline in map tooltip | `.sparkline-text` | src/style.css:753; mapTotalD3.js:138,154, mapPillarD3.js:144,158, mapCommitmentD3.js:145,159 (JS) | 10px !important (CSS) + 10px (JS) | - | bold (JS, pillar/commitment only) | - | - | - | - | - | - | - | - | - | - | - |
| Plot tip (no current Plot tips found) | `g[aria-label="tip"] path` / `text` | src/style.css:490,496,511 | - | var(--sans-serif) | - | var(--theme-foreground) | fill #fff | - | - | - | - | - | - | pointer-events none | - | - |

Tooltip users of `.chart-tooltip`: heatmapD3 (219), indicatorHistorical (150, + `.indicator-historical-tooltip`),
mapCommitmentD3 (423), mapPillarD3 (456), mapSourcesD3 (187), polarBarsD3 (378, 444 + `.polar-country-tooltip`),
sparklineTableD3 (117), straightPlotD3 (147 + `.straight-plot-tooltip`). All are appended to `body`; position set
in JS (offsets: +10px x / -10px y, sparklineTable -28px y). Hover-in dims/thickens marks with d3 transitions of 150ms.

### 1b. Toggles

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mode toggle container | `.mode-toggle` | src/modeToggle.css:2 | - | - | - | - | - | - | - | - | margin 20px auto, gap 0 | - | - | - | - | - |
| mode toggle item | `.mode-toggle-item` | src/modeToggle.css:10 | 14px | - | 500 | - | - | none | ends: 4px 0 0 4px / 0 4px 4px 0 (:21,:26) | - | 8px 24px | all 0.2s ease | - | see below | none (div, no tabindex) | - |
| unselected | `.mode-toggle-item:not(.selected)` | src/modeToggle.css:31,36 | - | - | - | #111 | #e0e0e0 | - | - | - | - | - | - | bg #d0d0d0 | - | - |
| selected | `.mode-toggle-item.selected` | src/modeToggle.css:41,46 | - | - | - | white | #222 | - | - | - | - | - | - | bg #000 | - | `.selected` class (JS: modeToggle.js:32,39) |
| (dead) toggle switch | `.toggle-label`, `.switch`, `.slider` | src/toggleSwitch.css:9-89 | 14px | - | 600 / active 700 | #999 / active #000 | slider #ccc, checked #000, knob white | - | 24px / 50% | focus: 0 0 1px #000 | - | color 0.2s ease, 0.2s | - | - | `input:focus + .slider` | `.toggle-disabled` opacity 0.5, not-allowed |

### 1c. Buttons (non-chart)

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile hamburger | `.mobile-hamburger` | src/sidebar.css:175 | - (icon 1.4rem) | - | - | var(--sidebar-text-color) #666 | none | none | - | - | 10px 12px | - | - | - | outline 2px solid var(--hover-color), offset -2px (:108) | `[aria-expanded="true"]` swaps icon (:193) |
| blog ToC toggle | `.toc-toggle-button` | src/style.css:317 (markup: perspectives.md:293) | 0.85rem | var(--sans-serif) | - | var(--text-color) #999 | none | none | - | - | 10px 12px | - | - | - | - | - |
| sidebar nav link | `.sidebar-menu a[href]` | src/sidebar.css:89 | label 0.8rem (:130), 1rem mobile (:258) | - | - / 700 on hover+active | var(--sidebar-text-color) #666 | - | - | - | - | 10px; mobile 14px 20px | color var(--transition-speed) 0.3s | (in .sidebar 1000) | color var(--hover-color) #000, 700 (:101) | outline 2px solid var(--hover-color) (:108) | `.active`, `[aria-current="page"]` |
| "read more" | `.blog-read-more > summary` | src/style.css:1321 | - | - | 700 | var(--theme-foreground-focus, #007162) | - | - | - | - | margin 1rem 0 | - | - | - | - | - |
| native controls | `button, input, textarea` | src/style.css:688 | - | - | - | accent-color var(--theme-blue) #4269d0 | - | - | - | - | - | - | - | - | - | - |

### 1d. Legends

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tile legend container | `.custom-legend` | src/custom-legend.css:2; mobile src/style.css:948 | - | - | - | - | - | - | - | - | margin 20px auto; gap 0 (mobile 8px, wrap) | - | - | - | - | - |
| tile legend item | `.legend-item` | src/custom-legend.css:10 | 14px | - | 500 | (JS) pillar colour / white when selected (customLegend.js:47-51,68-73) | (JS) rgba(r,g,b,0.1) / full colour when selected | none | ends 4px (:21,:26), only-child 4px (:31); mobile all 4px (style.css:960) | - | 8px 24px | all 0.2s ease | - | filter brightness(0.95) (:36) | none (div, no tabindex) | `.selected` weight 500 (:41) |
| sources legend item | `.legend-item.sources-legend-item` | src/custom-legend.css:46; JS src/components/sourcesLegend.js:53-63 | 14px (inherits .legend-item); label 1em (:69) | - | 500 | (JS) textColor per type, selected #333 or white by luminance | (JS) rgba(r,g,b,0.12) / full type colour | none | as .legend-item | - | 10px 28px; gap 6px | all 0.2s ease | - | brightness(0.95) | none | click toggles to null (deselect) |
| sources legend icon | `.sources-legend-icon svg` | src/custom-legend.css:59 | 1.5em box | - | - | stroke currentColor, width 1.75 | - | - | - | - | - | - | - | - | - | - |
| mobile tap target | `.legend-item, .sources-legend-item` | src/style.css:939 (≤768px) | - | - | - | - | - | - | 4px | - | min-height 44px; flex 0 1 calc(50% - 4px) | - | - | - | - | - |
| status (provenance) legend | `.status-legend` | src/components/statusLegend.js:8-39 (JS, injected `<style>`) | 14px (JS) | - | title 600 (JS) | inkMuted #555 (JS) | - | - | - | - | margin 0 auto 20px; gap 0.25rem 1.25rem | - | - | - | - | - |
| map swatch legend | `g.legend-item` (SVG) | src/components/mapLegend.js:39-69 (JS) | 12 attr (forced to 16px, see §5) | - | - | text: default fill; change-key text ink #222 (:124,:152) | swatch 18x18, fill = data colour | stroke ink #222, 0.5 (swatchOutline) | - | - | row 25, column 150, label offset 6/4 | - | - | pointer-events none (JS) | - | - |
| map legend backdrop | `rect.legend-background` | mapTotalD3.js:770; mapPillarD3.js:660; mapCommitmentD3.js:637,650 (JS) | - | - | - | - | #ffffff80 (JS) | - | rx 4 (JS) | - | 20px inset | - | - | - | - | - |
| Plot swatches | `div[class*="-swatches-"]` | src/style.css:373 | 1rem !important (via :142) | var(--sans-serif) !important | - | - | - | - | - | - | - | - | - | - | - | - |
| polar legend cell | `.legend-cell` | src/components/polarBarsD3.js:211 (JS) | 14 / 11 / 12 attr (:356,:287,:329; forced to 16px except `.chart-axistext`) | - | - | - | - | - | - | - | - | - | - | - | - | - |

### 1e. Zoom buttons (SVG, map modules)

All four maps build the same three buttons: `g.zoom-button.zoom-button-in/-out/-reset` with a `circle r=20` and a `text`.

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| zoom in / out | `.zoom-button-in`, `.zoom-button-out` | mapTotalD3.js:687-731; mapPillarD3.js:574-618; mapCommitmentD3.js:543-587; mapSourcesD3.js:262-306 (JS) | 20 attr (forced 16px) | (forced var(--sans-serif)) | bold (JS) | text fill #007162 (Total, Pillar); pillarColor (Commitment); typeColor, default #007162 (Sources) | circle fill white (JS) | stroke same colour, 2 (JS) | circle r 20 | - | - | zoom 300ms (d3) | - (SVG order) | cursor pointer only | none (SVG g, no tabindex) | - |
| reset | `.zoom-button-reset` | same files, +25 lines (JS) | 14 attr (forced 16px) | (forced) | - | as above | white | as above | r 20 | - | - | 300ms | - | cursor pointer | none | - |
| mobile | `.zoom-button-in/-out` `display:none`; `.zoom-button-reset` `transform: translate(0,0) !important` | src/style.css:968,972 | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| group position | `g.zoom-controls` | translate(width/8, height-130) in Total/Pillar/Commitment; (width-50, height-200) in Sources (JS) | - | - | - | - | - | - | - | - | spacing 50 | - | - | - | - | - |

### 1f. Source cards

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| card | `.sourcecard` | src/style.css:379; JS src/components/sources.js:36-40 | 1em | - | 500 | (JS) #333 on light tiles, #fff on dark (luminance > 0.5) | (JS) SOURCE_TYPE_COLORS (#007162, #4ed0bf, #FDE74C, #555555), fallback #ccc | (JS) 0px solid tileColor | 10px | - | 12px | background-color 0.3s ease, color 0.3s ease | - | see next row | none (wrapper `a` is focusable; no focus style) | - |
| card hover | `.sourcecard:hover` | src/style.css:409 | - | - | 700 | - | - | - | - | 0 4px 8px rgba(0,0,0,0.3) | - | (transform, shadow, weight not in transition list) | - | transform scale(1.05) | - | - |
| card spans | `.sourcecard span` | src/style.css:394; JS sources.js:46,56,68 | publisher/country 0.85em (JS) | - | - | #fff (CSS), overridden inline per span (JS) | - | - | - | - | - | - | - | - | - | - |
| country line | `.sourcecard-country` | sources.js:63-68 (JS only) | 0.85em | - | - | textColor | - | - | - | - | margin-top 0 | - | - | - | - | italic, right-aligned |
| wrapper link | `a` (no class) | sources.js:73-83 (JS) | - | - | 700 via `a[href]` (style.css:558) | var(--theme-foreground-focus) via `a[href]` | - | - | - | - | - | - | - | - | - | target _blank |

### 1g. Notices

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile "use desktop" notice | `.desktop-notice` (index.md:114) | src/style.css:427, hidden ≥640px (:437) | 14px | - | - | #333 | #4ed0bf33 | border-bottom 1px solid #d0e8ff | - | - | 12px 20px | - | - | - | - | - |
| "Ctrl + scroll to zoom" box | `.map-scroll-message` | mapTotalD3.js:799; mapPillarD3.js:690; mapCommitmentD3.js:761; mapSourcesD3.js:354 (JS cssText, 4 identical copies) | 12px | span: "Nunito Sans", sans-serif (style.css:699) | 500 | #666 | rgba(255,255,255,0.95) | 1px solid #ddd | 4px | 0 2px 8px rgba(0,0,0,0.2) | 8px 16px | - | - | - | - | - |
| scroll overlay wrapper | `.map-scroll-overlay` | src/style.css:695; JS cssText in the same 4 files | - | - | - | - | - | - | - | - | bottom 200px (Sources: 20px) | opacity 0.2s (CSS; JS toggles display, so it never runs) | 10 (JS) | - | - | shown 1200ms after wheel |
| chart "no data" message | inline div | indicatorHistorical.js:59-61; pillarTrendsD3.js:26 (not imported); polarBarsD3.js:416 (JS) | 12px (indicatorHistorical only) | - | - | - | - | - | - | - | 20px | - | - | - | - | - |
| sparkline "No data" | inline div | src/components/sparkline.js:30 (module not imported by any page) | 11px | - | - | #999 | - | - | - | - | - | - | - | - | - | - |

### 1h. Blog cards and blog ToC

`.blog-img-wrap`, `.blog-img-wrap img`, `::after`, `a.blog-img-link` and `.blog-date` are each defined twice in style.css (≈208-246 and 1262-1306). The later block wins where they differ; both values are shown as "early → late".

| component | selector | defined in | font-size | font-family | weight | color | background | border | radius | shadow | padding | transition | z-index | hover | focus | active/disabled |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| image frame | `.blog-img-wrap` | src/style.css:208 / 1263 | - | - | - | - | - | - | 4px (both) | - | margin 10rem 0 2.25rem → 2rem 0 0.5rem | - | - | - | - | - |
| image | `.blog-img-wrap img` | src/style.css:217 / 1271 | - | - | - | - | - | - | - | - | - | transform 0.4s ease | - | scale(1.03) (:224, :1297) | - | filter grayscale(2) contrast(1.15) brightness(1.2) → grayscale(1) contrast(1.15) |
| colour wash | `.blog-img-wrap::after` | src/style.css:227 / 1278 | - | - | - | - | #4ed0bfff → #007162, mix-blend color | - | - | - | - | - | - | - | - | - |
| tile link | `a.blog-preview-tile` | src/style.css:1291 (markup featuredPreview.js:38; blogPreview.js:39, not imported) | - | - | 700 via a[href] | via a[href] | - | - | - | - | gap 0.4rem | - | - | image scale | - | - |
| tile image | `.blog-img-wrap--tile` | src/style.css:1315 | - | - | - | - | - | - | - | - | margin 0 0 0.25rem | - | - | - | - | - |
| tile title | `.blog-preview-title` | src/style.css:1307 | 0.85rem !important | - | 700 | var(--theme-foreground) | - | - | - | - | margin 0 !important | - | - | - | - | - |
| date / author | `.blog-date` | src/style.css:241 / 1301 | 0.8rem | - | - | #999 | - | - | - | - | margin 0.25rem 0 0 → 0 | - | - | - | - | - |
| blog ToC | `.blog-toc` | src/style.css:248; mobile :340 | 0.78rem | var(--sans-serif) | - | - | mobile: var(--sidebar-color) | - | - | mobile: 0 4px 12px rgba(0,0,0,0.15) | mobile 1rem | - | 90; mobile 1000 | - | - | `.toc-open` |
| ToC heading | `.blog-toc-heading` | src/style.css:260 | 0.7rem | - | 700 | var(--theme-foreground-muted) | - | - | - | - | - | - | - | - | - | - |
| ToC item | `.blog-toc li` | src/style.css:275 | - | - | - | - | - | border-left 2px solid #e0e0e0 | - | - | padding-left 0.6rem | border-color 0.15s | - | border var(--hover-color) | - | - |
| ToC title / date | `.blog-toc-title` / `.blog-toc-date` | src/style.css:292 / 303 | - / 0.72rem | - | 600 / 400 | - / #595959 | - | - | - | - | - | - | - | title: var(--hover-color) | - | - |

## 2. Divergences per property (live code only)

- **border-radius**: 4px x8 sites (`.chart-tooltip`; `.mode-toggle-item` ends; `.legend-item` ends/only/mobile; `.blog-img-wrap` x2; `.map-scroll-message` x4 JS; legend backdrop rx 4 x4 JS) · 8px x1 (`.map-tooltip` JS) · 10px x2 (`.sourcecard`; `.sidebar` 0 10px 10px 0) · 0.75rem x1 (Framework `.card`, country pages only) · circle r 20 (zoom buttons).
- **font-size**: 10px (`.sparkline-text`) · 11px (`.tooltip-small`; tooltip spans x7 JS) · 12px (`.chart-tooltip`; `.map-scroll-message` x4 JS; `.chart-axistext`; indicatorHistorical no-data; mapTotalD3:583) · 14px (`.mode-toggle-item`, `.legend-item`, `.desktop-notice`, `.map-tooltip` JS, `.status-legend` JS) · 0.78/0.7/0.72rem (blog ToC) · 0.8rem (`.blog-date`, sidebar label) · 0.85rem (`.toc-toggle-button`, `.blog-preview-title`) · 0.85em (sourcecard sub-lines JS) · 1em (`.sourcecard`, `.sources-legend-label`) · 20px / 28px / 42px (tooltip headline numbers JS) · SVG attr 12/14/20 all rendered at 16px (§5).
- **font-weight**: 500 (`.mode-toggle-item`, `.legend-item` incl. `.selected`, `.sourcecard`, `.map-scroll-message` JS) · 600 (`.blog-toc-title`, `.status-legend-title` JS) · 700 / bold (`.sourcecard:hover`, `.blog-preview-title`, `.blog-toc-heading`, sidebar hover/active, `.blog-read-more > summary`, all `a[href]`, zoom +/− JS, tooltip numbers JS) · `regular` (invalid, mapTotalD3.js:583).
- **text colour**: #000 (tooltip captions JS, `--hover-color`, `--theme-foreground`) · #111 (toggle unselected) · #222 (`ink`) · #333 (`.desktop-notice`, light-tile text in sources.js and sourcesLegend.js) · #555 (`inkMuted`, Academic) · #595959 (`.blog-toc-date`) · #666 (`.tooltip-small`, tooltip "Not enough data" x4 JS, `.map-scroll-message` x4 JS, `--sidebar-text-color`) · #999 (`.blog-date`, `--text-color` → `.toc-toggle-button`) · white/#fff (selected toggle/legend, dark tiles) · #007162 (zoom, links, Analysis/Source legend text) · #7a6800 (Project legend text) · data colours (legend items, polar tooltips).
- **background**: white (`.chart-tooltip`, `.map-tooltip` JS, zoom circles JS, `--sidebar-color` as rgba(255,255,255,1)) · rgba(255,255,255,0.95) (`.map-scroll-message` x4 JS) · #ffffff80 (legend backdrop x4 JS) · #e0e0e0 / #d0d0d0 / #222 / #000 (mode toggle states) · rgba(colour, 0.1) (customLegend JS) vs rgba(colour, 0.12) (sourcesLegend JS) · #4ed0bf33 (`.desktop-notice`) · #00000008 (sparkline row hover) · source type colours (sourcecard JS) · transparent (`.card`).
- **border**: 1px solid #ddd (`.chart-tooltip`, `.map-scroll-message` x4 JS) · 1px solid #d0e8ff bottom (`.desktop-notice`) · 2px solid #e0e0e0 left (ToC li) · 0px solid tileColor (sourcecard JS) · none (toggle, legend items, toc toggle, hamburger) · SVG stroke 2 (zoom) / 0.5 #222 (swatches).
- **box-shadow**: 0 4px 8px rgba(0,0,0,0.3) (`.sourcecard:hover`) · 0 4px 12px rgba(0,0,0,0.15) (`.map-tooltip` JS, mobile `.blog-toc`) · 0 2px 8px rgba(0,0,0,0.2) (`.map-scroll-message` x4 JS) · 2px 0 10px rgba(0,0,0,0.2) (`.sidebar`) · 0 1px 6px rgba(0,0,0,0.12) (`.mobile-top-bar`) · none (`.chart-tooltip`).
- **padding**: 8px (`.chart-tooltip`) · 12px (`.map-tooltip` JS, `.sourcecard`) · 8px 24px (toggle, legend item) · 10px 28px (sources legend item) · 8px 16px (`.map-scroll-message` JS) · 12px 20px (`.desktop-notice`) · 10px 12px (`.toc-toggle-button`, `.mobile-hamburger`) · 10px / 14px 20px (sidebar links) · 20px (no-data divs JS).
- **transition**: all 0.2s ease (toggle, legend item) · background-color/color 0.3s ease (`.sourcecard`) · var(--transition-speed) 0.3s (sidebar) · left 0.25s ease (drawer) · transform 0.4s ease (blog img) · border-color 0.15s (ToC li) · opacity 0.2s (`.map-scroll-overlay`) · d3: 150ms hover, 300ms zoom; CSS opacity 150ms set inline in sparklineTableD3.js:303,317.
- **z-index**: 10 (scroll overlay JS) · 90 (`.blog-toc`) · 999 (backdrop) · 1000 (`.chart-tooltip`, `.map-tooltip` JS, `.sidebar`, mobile `.blog-toc`) · 1001 (`.mobile-top-bar`) · 1002 (mobile `.sidebar`).
- **hover treatment**: darken bg (mode toggle) · filter brightness(0.95) (legend items) · scale(1.05) + shadow + 700 (sourcecard) · img scale(1.03) (blog) · colour to #000 + 700 (sidebar) · border colour (ToC) · row tint (sparkline table) · none (zoom buttons, desktop notice).
- **focus**: only `.sidebar-menu a:focus-visible` and `.mobile-hamburger:focus-visible` (2px outline) and `a[href]:focus` (underline). Mode toggle items, legend items (div) and zoom buttons (SVG g) have no tabindex and no focus style. No `:active` or `:disabled` rules in live CSS.

## 3. tokens.js vs CSS custom properties / hard-coded CSS

| tokens.js | value | CSS / other definition | value | relation |
|---|---|---|---|---|
| `bins.leading` (:10) | #007162 | `--theme-foreground-focus` (style.css:1253) | #007162 | same value, separate definitions; also hard-coded #007162 in zoom buttons (mapTotal, mapPillar), mapSourcesD3.js:17, sourcesLegend.js:10-11,18, style.css:1282,1324 |
| `bins.offTrack` (:7) | #FDE74C | sourcesLegend.js:24 "Project"; scales.js:38 "Total score" tint | #FDE74C | same value, not imported from tokens |
| `ink` (:67) | #222 | `.mode-toggle-item.selected` bg (modeToggle.css:42) | #222 | same value, literal |
| `inkMuted` (:68) | #555 | sourcesLegend.js:31-32 "Academic" | #555555 | same value, literal |
| `noData` (:32) | #dddddd | `.chart-tooltip` border (style.css:456), `.map-scroll-message` border (JS) | #ddd | same value, unrelated use |
| `noDataHatch` (:33) | #ffffff | `--theme-background-a` (style.css:1254) | #fff | same value |
| `statusMarkers.computedFill` (:81) | var(--theme-background) | `--theme-background` (style.css:1222) | var(--theme-background-a) #fff | token references CSS var |
| (scales.js:27-30, not tokens.js) pillar colours | #962c8c #643291 #034ea2 #3c4099 | `--pillar-connectivity/-rights/-responsibility/-trust` (style.css:41-44) | same four | defined in both |
| `bins.onTrack` | #35A88F | `--color-one` (style.css:35) #32baa7; mapSources.js:60 #32baa8; `.blog-img-wrap::after` early #4ed0bfff; sourcesLegend "Source" #4ed0bf | teal family | similar role, different values |
| `bins.offTrack` | #FDE74C | `--color-four` (style.css:38) | #fff200 | similar (yellow), different value |
| `ink` / `inkMuted` | #222 / #555 | `--theme-foreground` #000, `--sidebar-text-color` #666, `--text-color` #999, `--hover-color` #000 | - | five text-colour definitions, different values |

Also duplicated inside CSS: `--sans-serif` defined 3x (style.css:26, :533; sidebar.css:14; identical lists); `--monospace`, `--serif`, `--theme-blue/green/red/yellow` 2x each in style.css (:19 and :526); `--font-small` (style.css:824) equals Framework global.css:238. On country pages Framework theme-air defines `--theme-foreground` #1b1e23 and `--theme-foreground-focus` #3b5fc0; style.css's #000 / #007162 come later in the cascade.

## 4. Dead / unused variables

Counts: definitions in src/*.css (tour.css excluded), `var(--x)` uses in src/*.css, mentions in src/components/*.js + nav-html.js + observablehq.config.js, mentions in src/*.md. Comments are counted where noted.

| variable | defined | CSS uses | JS | md | verdict |
|---|---|---|---|---|---|
| `--theme-caret` | style.css:830 | 0 | 0 | 0 | unused by our code: CONFIRMED. Framework layout.css defines and uses its own (lines 2, 172, 175; `#observablehq-sidebar`), and `sidebar: false` in config |
| `--theme-toggle` | style.css:831 | 0 | 0 | 0 | CONFIRMED (Framework layout.css:3, 224-225, sidebar toggle) |
| `--theme-magnifier` | style.css:832 | 0 | 0 | 0 | CONFIRMED (Framework layout.css:4, 504-505, search) |
| `--font-small` | style.css:824 | 0 | 0 | 0 | CONFIRMED for our code. Framework global.css:238 redefines it (country pages) and uses it in `.small` (no `class="small"` found) and layout.css:441 |
| `--primary-color` | sidebar.css:10 | 0 | 0 | 0 | CONFIRMED |
| `--secondary-color` | sidebar.css:12 | 0 | 0 | 0 | CONFIRMED |
| `--text-color` | sidebar.css:13 | 1 (style.css:324 `.toc-toggle-button`) | 0 | 0 | REFUTED: in use |
| `--sidebar-width-collapsed` | sidebar.css:7 | 0 | 0 | 0 | CONFIRMED |
| also found: `--color-one`…`--color-four`, `--color-accent` | style.css:35-39 | 0 | 0 | 0 | unused |
| also found: `--hovered-card-color`, `--hovered-card-border` | style.css:47-48 (+ commented 46) | 0 live (1 each inside comments, style.css:412-413) | 0 | 0 | unused |
| for contrast: `--sidebar-color`, `--hover-color`, `--sidebar-text-color` | sidebar.css | 3 / 4 / 2 | 0 | 1 / 2 / 1 (index.md:28-38, inline style block) | in use |

## 5. Specificity / override notes relevant to a token rollout

- `!important`: 34 occurrences in style.css, 0 in sidebar.css, modeToggle.css, custom-legend.css. On UI components: `a.blog-img-link`, `a.blog-preview-tile`, `.sourcecard a` text-decoration (:237, :400, :1287, :1292); `a:hover { text-decoration: none !important }` twice (:367, :404); `.blog-preview-title` font-size/margin/max-width (:1308-1313); `.zoom-button-reset` transform at ≤768px (:973); `.chart-axistext` 12px (:474); `.sparkline-text` 10px (:754); `svg text` font-size + family (:144-156). JS: `pillarSparklineD3.js:66,132,149` set `font-size: 12px` with `setProperty(..., "important")` inline.
- `a:hover … !important` (×2) beats `a[href]:hover, a[href]:focus { text-decoration: underline }` (:601) and `.sparkline-country-name a:hover` underline (:745) on hover; focus still underlines.
- `svg text, svg g text, svg tspan` force `clamp(1rem, 0.5vw + 0.05rem, 1rem)` (always 1rem/16px) and `var(--sans-serif)`, both `!important` (:139-146). Effects: zoom +/− (attr 20) and ⌂ (attr 14), mapLegend labels (attr 12, acknowledged in mapLegend.js:78), polar legend labels (11/14) and heatmap cell labels (10) all render at 16px by selector match. Exceptions that win: `.chart-axistext` (class, 0,1,0 + !important > 0,0,2), `.sparkline-text` (same), and inline `!important` in pillarSparklineD3. `statusLegend.js` avoids it by using HTML labels (comment at :44-45).
- `div > * { font-size: 1rem }` (:172, specificity 0,0,1): applies to every child element of a `div`, including tooltip children (`<strong>`, `<span>`) without inline font-size inside `.chart-tooltip` (12px) and `.map-tooltip` (14px), so e.g. the `<strong>` country name in mapSourcesD3, straightPlotD3, pillarTrends and polarBars multiples tooltips matches 1rem while the surrounding text is 12px. Class rules (`.tooltip-small`, `.legend-item`, `.mode-toggle-item`) outrank it. (By selector analysis; not measured.)
- `a[href] { color: var(--theme-foreground-focus); font-weight: 700 }` (:558): Framework's `a[href]` beats single-class selectors (DEV_NOTES), so the sidebar uses `.sidebar-menu a[href]` (sidebar.css:88-89). Source cards are wrapped in a plain `<a>` (sources.js:73) that gets colour #007162 / 700; the card div re-sets weight 500 and inline colours. `.sourcecard a` (:399) matches nothing generated by sources.js (the link is outside the card). Blog tiles (`a.blog-preview-tile`) also inherit the a[href] colour/weight; the title and date set their own colour.
- Class collisions: mapLegend.js gives SVG `<g>` the class `legend-item`, so on pages loading custom-legend.css (directions, country pages) those groups also match `.legend-item` (cursor, padding, font-size 14px, `transition: all 0.2s`, `:hover` filter) and, at ≤768px, style.css:939-965 (min-height, flex, border-radius). Hover is blocked by inline `pointer-events: none`. Similarly SVG `<g class="grid">` (indicatorHistorical.js:133, straightPlotD3.js:162) matches `.grid` (style.css:1029).
- Inline JS styles (customLegend, sourcesLegend, sources.js, map tooltip, scroll message, zoom buttons via SVG attributes) outrank any stylesheet rule without `!important`. SVG presentation attributes (`fill`, `stroke`, `font-size` attr) are the opposite: any CSS rule overrides them.
- Top-level vs country pages: country pages (`theme: air`) load Framework global/layout/grid/note/card/inspector/plot/syntax, then sidebar.css, then style.css once. Framework `.card` (card.css) sets background, border, `border-radius: 0.75rem`, padding 1rem, font 14px; style.css `.card` (:1062) resets background, padding, border, font, but not border-radius. Framework global.css adds `.small`, `.big`, `.red` etc. and its own `--font-small`. Top-level pages get style.css twice (config bundle, then page link after sidebar.css), and modeToggle.css / custom-legend.css as page `<link>`s rendered inside `<main>` (after sidebar.css). index.md and countries.md do not load custom-legend.css; resources.md does not load modeToggle.css.
- `.map-scroll-overlay { transition: opacity 0.2s }` (:695) has no effect: JS toggles `display`, not opacity.
- z-index: `.chart-tooltip`/`.map-tooltip` (1000) equal `.sidebar` (1000) and are below `.mobile-top-bar` (1001) and the open drawer (1002).

## 6. Hard-coded colours and sizes (not tokens)

Comments stripped. CSS = style.css, sidebar.css, modeToggle.css, custom-legend.css. JS = live components (tour.js, polarD3.js, polarCountryD3.js, toggleSwitch.js excluded); JS counts include data-mark colours, not only UI.

Colours:

| value | CSS | JS | where (UI-relevant examples) |
|---|---|---|---|
| #fff / white / #ffffff | 6 + 2 | 25 + 22 + 1 | tooltip bg, zoom circle fill, selected text, label halos (`.chart-axistext`, `.label-whitestroke` stroke) |
| #000 | 4 | 14 | tooltip captions, `--hover-color`, toggle selected hover |
| #007162 (+ #007162ff) | 3 | 18 + 1 | zoom buttons, link colour, legend Analysis, blog wash, scales.js |
| #ccc | 0 | 21 | sourcecard fallback, map strokes |
| #333 | 1 | 17 | `.desktop-notice`, light-tile text, mapSources hover stroke |
| #666 | 2 | 11 | `.tooltip-small`, scroll message, "Not enough data", `--sidebar-text-color` |
| #ddd / #dddddd | 1 | 9 + 1 | tooltip borders, noData |
| #eee | 1 | 8 | sparkline table header border, chart grids |
| #999 | 3 | 1 | `.blog-date`, `--text-color`, sparkline "No data" |
| #555 / #555555 | 0 | 4 + 2 | inkMuted, Academic |
| #ffffff80 | 0 | 5 | map legend backdrop |
| rgba(255,255,255,0.95) | 0 | 4 | scroll message |
| rgba(0,0,0,0.2) | 1 | 4 | sidebar shadow, scroll message shadow |
| rgba(0,0,0,0.15) | 1 | 1 | mobile ToC shadow, map tooltip shadow |
| rgba(0,0,0,0.3) / 0.35 / 0.12 | 1 / 1 / 1 | 0 | sourcecard hover shadow, backdrop, top bar shadow |
| #e0e0e0 / #d0d0d0 / #222 / #111 | 2 / 1 / 1 / 1 | 0 / 0 / 1 / 1 | mode toggle, ToC border |
| #aaa | 0 | 4 | chart strokes |
| #FDE74C | 0 | 3 | tokens, sourcesLegend, scales.js |
| pillar hexes (#962c8c #643291 #034ea2 #3c4099) | 1 each | 2 each | `--pillar-*`, scales.js |
| #4ed0bf / #4ed0bf33 / #4ed0bfff / #d0e8ff | 0 / 1 / 1 / 1 | 1 / 0 / 0 / 0 | legend Source, desktop notice, blog wash (overridden), notice border |
| #595959, #f5f5f5, #00000008, #7a6800 | 1 each (CSS), #7a6800 JS 1 | | ToC date, table rows, legend Project text |
| Framework copies: #4269d0 #3ca951 #ff725c #efb118 (x2 each), syntax colours (#d73a49, #6f42c1, #005cc5 x2, #032f62, #e36209, #22863a x2, #24292e x3, #735c0f, #f0fff4, #b31d28, #ffeef0) | | | style.css `:root` blocks |
| unused var values: #32baa7 #63d8a2 #b9f27b #fff200 #f61067 #2c3e5022 #3498db | 1 each | | §4 |

Font sizes (literal values):

| value | CSS | JS | notes |
|---|---|---|---|
| 10px | 0 (+`.sparkline-text` 10px counted below) | 6 | sparkline text in map tooltips |
| 11px | 1 | 10 (+ attr 11 x1) | tooltip captions, `.tooltip-small` |
| 12px | 1 (+ `.chart-axistext` 12px !important) | 8 (+ attr 12 x10) | `.chart-tooltip`, scroll message, legends (attr) |
| 13 / 13px | 1 (table) | attr 13 x1 | |
| 14px | 4 | 2 (+ attr 14 x6) | toggle, legend item, notice, map tooltip, status legend, zoom reset (attr) |
| 16 | 1 (`figure > h3`) | attr 16 x1 | |
| 20px / attr 20 | 2 | 2 + attr 20 x8 | zoom +/− (attr), tooltip change numbers |
| 28px / 42px | 0 | 3 / 3 | tooltip headline numbers |
| rem/em values | 0.7rem, 0.72rem, 0.78rem, 0.8rem x3, 0.85rem x2, 0.95em, 1em x2, 1rem x2, 1.1em, 1.5em, 6em | 0.85em x2 | |

Radii: 4px x9 (CSS 6, JS 4 rx/cssText counted per file), 8px x1 (JS), 10px x2, 24px/50% (dead). Spacing literals: 8px, 12px, 20px, 24px, 28px, 16px dominate (see §2 padding).

## Files read

- src/style.css, src/sidebar.css, src/modeToggle.css, src/custom-legend.css, src/toggleSwitch.css (reference)
- src/components/tokens.js, modeToggle.js, customLegend.js, sourcesLegend.js, statusLegend.js, mapLegend.js, blogPreview.js, featuredPreview.js, sources.js, toggleSwitch.js (full)
- Excerpts (grep / line ranges): src/components/mapTotalD3.js (non-tour lines 678-833 and grep hits), mapPillarD3.js, mapCommitmentD3.js, mapSourcesD3.js, heatmapD3.js, indicatorHistorical.js, pillarTrendsD3.js, polarBarsD3.js, polarCountryD3.js, polarD3.js, sparklineTableD3.js, straightPlotD3.js, pillarSparklineD3.js, sparkline.js, mapSources.js, scales.js
- Grep only: src/*.md, src/1countryPageTemplate.md, observablehq.config.js, nav-html.js
- Framework 1.13.3: node_modules/@observablehq/framework/dist/style/theme-air.css, global.css, layout.css, card.css (excerpts)

## Could not determine (read-only, no build or browser)

- Rendered/computed values: everything above is from source and selector analysis. Cascade outcomes (e.g. `div > *` on tooltip children, svg text forcing, `.card` radius on country pages) are not measured.
- Whether Framework's Inputs stylesheet (`inputs-3a86ea`, loaded at runtime when `Inputs` is used) styles any of these components: not inspected.
- Contents of `src/index.md` `<style>` (lines 13-49): not read (mentions the tour). It uses `--sidebar-color`, `--sidebar-text-color`, `--hover-color`.
- Whether any page currently renders Observable Plot tips or swatches (the `g[aria-label="tip"]` and `-swatches-` rules); no Plot `tip` usage was looked for beyond the components listed.
- Paint order of tooltips vs `.sidebar` at equal z-index 1000 (depends on DOM order at runtime).
- Hover/focus styles set by d3 event handlers beyond those listed (stroke/opacity changes on data marks were not inventoried as UI components).
