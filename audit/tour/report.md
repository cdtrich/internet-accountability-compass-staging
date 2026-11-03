# Onboarding tour: report (branch feature/tour, 2 Nov 2026)

Brief: "Task: landing tutorial" (v3_BRIEF.md, "Onboarding"), with the reduced scope
asked for on 2 Nov (no screenshot sets, no screen reader or cross-browser checks,
frame-model checks answered from the code, one forced Lighthouse run).
Parent commit for comparisons: `1e73e1c` (dev). Both builds use the staging base path
(`/internet-accountability-compass-staging/`) and are served locally with gzip
(audit/css-cleanup/scripts/serve.cjs). Scripts: audit/tour/scripts/.

## 0. Update after review (2 Nov 2026)

- **Applied A**: "?" at `top: 16px; right: 16px` on desktop (index.md); unchanged in the
  mobile top bar. **Applied B**: `DOCK = "top"` in tour.js. **C not approved**: no visibility gate.
- **Copy** revised as asked (section 6). Two claims checked against the code first:
  (a) "how they have changed over time" does **not** hold: Historical colours the map and
  counts the figures by the change between the latest year and the previous one
  (`previousYear = latestYear - 1`, mapTotalD3.js and index.md); only the tooltip sparkline
  spans the period. Step 2 therefore keeps "the change since the previous year".
  (b) "Compare countries across the four dimensions" holds: countries.md is a
  country-by-country view (a compass per country or a heatmap of the dimension scores).
- Step 3 (desktop) is an intro plus a list of label/description pairs (each a whole string,
  rendered as `<ul>`; label in bold, no joining punctuation). At 1200x300 the card scrolls
  internally; card and ring do not overlap (checked at 1200x300, 1200x800, 375x667).
- tools/iframe-test.html: case 6 models the real host (117px bar, then a 100vh container).
- Size (built dist/, gzip): tour.js 6,502 B (18,764 raw) + tour.css 1,303 B (3,705 raw) =
  **7,805 B**, 387 B under 8 KB. Before the comment trim the new copy and list brought it to
  8,426 B (234 B over); tour.js comments that restate the code were removed (comments only).
- Storage-stub check on the final build: PASS (storage-stub.log): no auto-start, no console
  errors, opt-out hidden, "?" opens, Finish and Esc close, "?" reopens.

## 0b. Step 1 targets the key figures (3 Nov 2026)

- `data-tour="figures"` on the key-figure grid in src/index.md (attribute only); step 1 targets
  it, fallback the map. `data-tour="legend"` removed from mapTotalD3.js (nothing else used it).
- The cards show in both modes, but **in Historical they are three change cards** (▼ Decrease,
  No change, ▲ Increase), so step 1's "four categories, from Off track to Leading" is true in
  Latest only. Auto-start always opens in Latest; only a visitor who switches to Historical and
  then presses "?" sees the mismatch.
- Step 1 card goes **below** the figures (`place: ["below"]`), and the scroll keeps the Latest /
  Historical switch (`.mode-toggle`, `keep`) in view above the ring, so the switch step 2 names
  is visible. Checked (scripts/tour-steps.cjs, now also reports the switch):
  1200x800, 768x1024, 375x667: card fully visible, below the ring, switch on screen and not
  under the card or ring. **Frames under 420px** (1200x300, 390x480): the card docks at the
  top and covers the switch; at 1200x300 the frame is too short for card + figures, so step 1 is
  card-only (no ring). Card fully visible in all cases; it scrolls internally at 1200x300.
- Size from dist/: 8,063 B gzip as built here (Windows checkout, CRLF); **8,017 B** with LF line
  endings as a Linux CI build ships it. Under 8 KB either way.

## 1. What the code does today (before the tour)

- Total map (mapTotalD3.js): a click on any country, with or without data, opens
  `${basePath}/<ISO3>/`. On touch, `touchstart` shows the tooltip, then the tap's click
  navigates (tap on BRA opened /BRA/: touch.log).
- The landing page has a Latest / Historical toggle (modeToggle) above the key-figure cards.
- Legend, Latest: only "Not enough data" (hatched). The four category entries are
  commented out (mapTotalD3.js, `legendData`); the categories (binLabels: Off track,
  Catching up, On track, Leading) are the key-figure cards above the map, with counts.
  Historical: ▼ Decrease, No change, ▲ Increase, Not enough data.
- Tooltip, Latest: "Internet Accountability Score (IAS)", score, country (category), the four
  dimension scores. Historical: change, country, sparkline. No-data: name + "Not enough data".
- Zoom: + / − / ⌂ and Ctrl/⌘ + wheel. At ≤768px + and − are hidden, ⌂ stays; pinch zooms
  (synthetic two-finger touches: scale 6, touch.log).
- Nav: Map, Countries, Directions, Resources, Perspectives, Methodology; ≤768px a hamburger
  in a fixed 48px top bar.

## 2. Frame model

tools/iframe-test.html uses fixed-size boxes. The host page (HTML/CSS fetched with curl)
is different: `.embedded-iframe-container { height: 100vh; overflow: hidden }`, so the frame
is as tall as the visitor's window, and it starts about 117px down the page (ESTIMATE: the
breadcrumb bar's 85 + 11px padding + one line; the theme header is `position: absolute`).
At host scroll 0 the bottom ~117px of the frame are below the visitor's window, and a wheel
or swipe over the frame scrolls the frame first. Replica: scripts/host-replica.html.

## 3. The four frame-model checks (answered from the code)

| # | Question | Answer |
|---|---|---|
| 1 | Where does "?" sit; is it reachable in the real embed? | index.md: `position: fixed; right: 16px; bottom: 40px` above 768px; `top: 2px; right: 8px` (in the 48px top bar) at ≤768px; z-index 1003, moved into `#observablehq-header` at runtime. **Desktop: no.** Bottom-right of a frame whose bottom ~117px are below the window: the visitor sees it only after scrolling the host page. Phones/tablet: yes (top bar). Measured once in the replica before the scope change: host y 833-877 in a 1280x800 window (frame-model.log). Proposal A below. |
| 2 | Does every focus() use preventScroll; can auto-start scroll the host? | Yes: all 4 calls in tour.js (title on each step, both ends of the Tab trap, the opener on close) pass `{ preventScroll: true }`. The only scroll call is `window.scrollTo(...)` on this document; no `scrollIntoView`, no window.parent/top, no postMessage. (`btn.focus()` in nav-html.js is the existing drawer's Esc handler, not the tour.) Earlier replica run: host scrollY 0 in all cases; a plain `scrollIntoView` in the frame scrolled the host by 133px, which is why tour.js does not use it. |
| 3 | Is there an IntersectionObserver gate before auto-start? | **No.** Auto-start waits for `load` + idle and for the step targets (up to 5 s). Nothing checks whether the frame is in the visitor's window. Proposal C below. |
| 4 | Card and ring visible to the visitor? | Card is placed next to the ring, **above first** (the top of the frame is what a visitor sees first). When ring and card cannot sit side by side or stacked (frames <420px, the whole map on a phone), the card docks at `DOCK` = "bottom" (as specified) and the ring is clamped to the band left over. In the real embed a bottom-docked card can fall into the hidden band on small phones (replica 360x640, step 2). Proposal B below. |

### Proposals (A and B applied 2 Nov, C not approved: see section 0)

- **A.** "?" top-right on desktop too: `@media (min-width: 769px) { .tour-launch { top: 16px; bottom: auto } }` in index.md.
- **B.** `const DOCK = "top"` in tour.js (the constant exists; default "bottom").
- **C.** (new mechanism, not built) Gate auto-start on an IntersectionObserver on the step-1
  target: inside a cross-origin iframe it reports intersection with the visitor's viewport,
  without touching window.parent.

A and B together, run once in the replica before the scope change: "?" and every card fully
visible in all cases, no change in the test-page cases (frame-model-proposal.log).

## 4. Kept checks

**Storage blocked** (Storage.prototype setItem/getItem/removeItem throwing; behaviour.log):
PASS: no auto-start, no console errors, opt-out checkbox hidden, "?" opens the tour,
Finish closes it, "?" reopens it. Also PASS there: Finish → `iac:tour:v1 = done`, no auto-start
on reload or in a new tab; Skip and Esc → `iac:tour:skipped` in sessionStorage only; tick + Skip
→ done; an old `iac:tour:v0` key does not suppress v1.

**Keyboard / ARIA (code, plus behaviour.log):** the card is `role="dialog" aria-modal="true"`,
`aria-labelledby` the title, `aria-describedby` the body; ring `aria-hidden`; the title has
`tabindex="-1"` and gets focus on each step; `inert` on `#observablehq-center` while open;
Tab/Shift+Tab are trapped in the card (checkbox, Skip, Back, Next); Esc closes (capture
listener) and focus returns to "?"; native buttons, so Enter/Space work; focus ring 2px on the
controls (none on the title: it is not a control). "?" has aria-label "Show the tour" and
title "How to use this site". behaviour.log: Tab ×6 and Shift+Tab ×6 stayed in the card, Enter on
Next → step 2, Space on Back → step 1, Esc → focus on "?".

Those runs used the build before the last commit's comment-only trim of tour.js
(`git diff` of that trim: comments only).

## 5. Performance

1. **Size (measured, final build, gzip as served by serve.cjs):** tour.js 6,836 B
   (19,450 raw) + tour.css 1,268 B (3,502 raw) = **8,104 B**, under the 8 KB target.
   Framework copies local modules verbatim, comments included. index.html: +1,129 B gzip
   (the "?" style + mount, the tour cell, `registerFile("./tour.css")`, 3 data-tour attributes).
2. **Inspection, no Lighthouse** (network.log; a first visit with `navigator.webdriver` hidden):
   `loadEventEnd` at 901 ms; tour.be27f1c8.js requested at 3,100 ms and tour.9021e806.css at
   3,112 ms, both after `load`. Initial HTML: the only line naming tour.js is the lazy
   `import("./_import/components/tour.be27f1c8.js")` in the cell; no modulepreload and no
   `<link>` for either file; `registerFile("./tour.css")` (metadata, no request); the "?"
   `<button>` mount; data-tour on nav, Countries link and hamburger.
3. **One Lighthouse run** (13.4.1, mobile, simulated throttling, Chrome 156; home standalone,
   `?tour=1`; parent has no tour, so its `?tour=1` is a plain load):

   | Build | LCP | TBT | CLS | Requests |
   |---|---|---|---|---|
   | parent 1e73e1c | 12.78 s | 1,613 ms | 0.000 | 68 |
   | tour, forced open | 12.43 s | 1,619 ms | 0.000 | 70 (+ tour.js 7,060 B, tour.css 1,484 B transferred) |

   One run each, so single numbers within this machine's noise (CSS-cleanup report: home
   mobile LCP 2.8-12.6 s, TBT 513-1,937 ms across 5 runs). Partial results of the stopped
   matrix, for reference only: lighthouse-partial.md (unforced runs never requested tour files).

## 6. Copy as shipped (EN) and changes against the brief

All strings are in `COPY.en` at the top of tour.js, whole sentences, no country count.
Controls: "Step n of N", Back, Next / Finish, "Skip tour", "Don't show again".

| Step | Title | Body as shipped | Change against the brief, and why |
|---|---|---|---|
| 1 (key figures, fallback map; card below, switch kept in view) | Total score at a glance | Each country is coloured by its overall Internet Accountability Score. These figures show the four categories, from Off track to Leading, and how many countries fall into each. Hatched countries on the map don't have enough data to be scored. | 3 Nov: target moved from the legend (Latest shows only "Not enough data") to the key-figure cards. Card labels = binLabels; card colours come from getOrdinalCategoryScale (binLabels → binColors), the same tokens as the map. |
| 2 desktop (zoom controls) | Explore the map | Hover over a country for its details and click it to open its page. Zoom with the + and − buttons or Ctrl/⌘ + scroll; the ⌂ button resets the view. The Latest / Historical switch above the figures shows current scores or the change since the previous year. | "how they have changed over time" → "the change since the previous year" (claim a). |
| 2 touch, `(hover: none)` (map) | Explore the map | Tap a country to open its page. Pinch to zoom; the ⌂ button resets the view. The Latest / Historical switch above the figures shows current scores or the change since the previous year. | Same change (claim a). |
| 3 desktop (nav) | Find your way around | Use the menu to move between sections: • **Map** All countries' scores on one map. • **Countries** Compare countries across the four dimensions. • **Directions** The four dimensions behind the score, each mapped. • **Resources** Curated sources, analysis and projects. • **Perspectives** Analysis, commentaries and opinions. • **Methodology** How the Compass and its scores are built. | As asked; rendered as a list. |
| 4 desktop (Countries link) | Every country has its own page | Open Countries, or click a country on the map, to see its scores for each dimension, how they changed over time and, where available, related resources. The ? button reopens this tour. | Unchanged. |
| 3 mobile (hamburger; 3+4 merged) | Find your way around | Open the menu to switch between Map, Countries, Directions, Resources, Perspectives and Methodology. Every country has its own page with its scores for each dimension: open it from Countries or by tapping the country on the map. The ? button in the top bar reopens this tour. | As asked. |

## 7. Deviations from the brief

- `window.scrollTo` on this document instead of `target.scrollIntoView({block:"center"})`
  (scrollIntoView can scroll the host page). Same centring.
- tour.css via `FileAttachment("./tour.css").href`, not `${basePath}/tour.css`: Framework only
  copies referenced files, so an unreferenced src/tour.css would not be in dist/. Hashed,
  base-path-correct, no request until first use.
- The "?" is moved into `#observablehq-header` by the tour cell: inside `#observablehq-main`
  (a stacking context, z-index 0) it sat under the mobile top bar.
- Card placement next to the ring, above first; `DOCK` for the docked case.
- No focus ring on the card title (not a control; Chrome draws one on every auto-start).
- The automation gate (webdriver, Lighthouse UA, ?tour=0) is also in index.md, so automated
  runs do not download tour.js at all. Storage rules live only in tour.js.
