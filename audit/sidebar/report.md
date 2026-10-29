# Static sidebar: before/after measurements

Date: 2026-10-29. Change: build-time sidebar in the config `header`
(nav-html.js), Font Awesome and `sidebar.js` removed (commits f6cf697 to
dbebba2 on `dev`).

## Method

- **before** = commit 66cb2e6 (JS sidebar + Font Awesome), **after** = HEAD
  incl. dbebba2 (header/colour fix). Both built locally with the production
  base path and served from 127.0.0.1 with gzip (GitHub Pages also gzips).
  Same machine, same Chrome, so the delta isolates the sidebar change.
- **staging** = the deployed staging site at 228d87e, i.e. *before* the
  dbebba2 fix. Compared with the Phase 0 baseline (audit/baseline/baseline.md,
  also staging), but staging now also contains the colour-token and
  polar-bar work, so staging vs baseline is not a sidebar-only delta.
- Lighthouse 13.4.1 (as the baseline), simulated throttling, performance +
  accessibility, 3 runs per cell, medians below. Home desktop got 5 extra
  interleaved runs per build because the first 3 disagreed.
- In-iframe: harness page with the production embed markup
  (`width="100%" height="100%"`) at 1400×880 and 393×852. Requests and bytes
  via the DevTools protocol (cache disabled); CLS via a layout-shift
  observer injected at document start in the frame (local builds only,
  unthrottled, 2 runs).
- Per-run data: `lighthouse-runs.csv`, `iframe-requests.json`.

## Standalone (Lighthouse medians)

| Page / form | Build | Perf | A11y | LCP s | TBT ms | CLS | Requests | KB |
|---|---|---|---|---|---|---|---|---|
| home mobile | before | 71 | 82 | 3.0 | 697 | 0.002 | 71 | 2237 |
| | after | 68 | 81 | 2.8 | 1075 | 0.002 | 68 | 2070 |
| home desktop | before | 94 | 63 | 1.0 | 158 | 0.043 | 71 | 2237 |
| | after | 82 | 81 | 0.7 | 381 | 0.043 | 68 | 2070 |
| home desktop, 5 extra runs | before | 93 | – | – | 152 | – | – | – |
| | after | 94 | – | – | 146 | – | – | – |
| AFG mobile | before | 38 | 87 | 11.2 | 566 | 0.323 | 69 | 1770 |
| | after | 39 | 87 | 10.3 | 1431 | 0.012 | 66 | 1604 |
| AFG desktop | before | 66 | 68 | 2.1 | 47 | 0.780 | 69 | 1770 |
| | after | 67 | 87 | 1.9 | 76 | 0.780 | 66 | 1604 |

Baseline (Phase 0, staging, 26 Oct) vs staging today (228d87e):

| Page / form | Baseline Perf / LCP / TBT / CLS / A11y | Staging today |
|---|---|---|
| home mobile | 79 / 3.4 s / 460 ms / 0 / 82 | 62 / 3.3 s / 1968 ms / 0.002 / 81 |
| home desktop | 98 / 0.8 s / 70 ms / 0.083 / 63 | 89 / 0.7 s / 255 ms / 0.043 / 81 |
| AFG mobile | 55 / 10.3 s / 750 ms / 0.012 / 87 | 36 / 10.5 s / 1908 ms / 0.000 / 87 |
| AFG desktop | 70 / 2.0 s / 80 ms / 0.459 / 68 | 70 / 1.3 s / 135 ms / 0.701 / 87 |

## In the iframe (production embed markup)

| Case | before: requests / KB | after: requests / KB | staging: requests / KB |
|---|---|---|---|
| home 1400×880 | 65 / 2132 | 64 / 2067 | 61 / 2003 |
| home 393×852 | 64 / 2131 | 64 / 2066 | 61 / 2001 |
| AFG 1400×880 | 68 / 1769 | 65 / 1602 | 65 / 1628 |
| AFG 393×852 | 68 / 1769 | 65 / 1603 | 65 / 1628 |

Baseline iframe cases (1400×880, 393×852): 64 requests, 2.1 MB transferred.

CLS in the frame (2 runs each): home 0.042 / 0.000 (desktop / phone) in both
builds; AFG desktop 0.630 before vs 0.632 after; AFG phone 0.47–0.49 in both.

## What the numbers support

- **Requests −3, transfer −166 KB per page (measured).** Removed:
  Font Awesome CSS (19 KB), `fa-solid-900.woff2` (147 KB), `sidebar.js`
  (1 KB). One render-blocking stylesheet fewer (cdnjs). In the iframe the
  byte delta reads smaller on home (−65 KB); the cross-origin cdnjs
  responses are likely under-counted by `encodedDataLength` there.
  Lighthouse's transfer sizes are the reliable figure.
- **Accessibility, desktop: home 63 → 81, AFG 68 → 87 (measured).** The only
  audit that changed is `color-contrast` on the sidebar labels
  (#999 → #666). No new failures. Mobile is unchanged, because the closed
  drawer isn't audited.
- **CLS: no change attributable to the sidebar.** The static nav adds no
  shift (it is `position: fixed` and present from first paint). AFG desktop
  is 0.780 in both builds. AFG mobile varies by run in the after build
  (0.323 / 0.012 / 0.000), so no claim is made. The remaining CLS on AFG
  comes from `main` and its first child (charts rendering), not the nav.
- **TBT / Perf score: no change attributable to the sidebar.** Run-to-run
  spread on this laptop is 0–1,680 ms. With 5 interleaved runs, home
  desktop medians are 152 ms (before) vs 146 ms (after). The perf-score
  differences in the first table follow TBT noise.
- **Staging vs baseline:** TBT is much higher on staging mobile (≈1.9 s vs
  0.5–0.75 s). That is not the sidebar (the local A/B shows no TBT change). It
  is either the colour/polar-bar work or GitHub Pages/network variance.
  Worth a dedicated check in the animation/performance pass.

## Regression found during this measurement (fixed in dbebba2)

The first after-screenshots showed country pages starting ~75 px lower
under a grey rule, and sidebar labels in theme teal instead of #666.
Country pages set `theme:` in front matter, so they load Framework's
layout.css, which styles a non-empty `#observablehq-header` as a fixed
2.2 rem bar with padding and border and pushes `main` down. The
`a[href]` theme colour outranked `.sidebar-menu a`. Fixed in
src/sidebar.css. After the fix, `main` starts at 48 px on AFG and 16 px on
home, identical to the before build. Staging still has the pre-fix CSS
until the next push.

## Screenshots (`screens/`)

Viewport captures, before_* vs after_* (after = post-fix):

- `home_desktop` (1400×880), `home_phone` (393×852)
- `country-AFG_desktop`, `country-AFG_phone`
- `drawer-open_phone` (AFG, drawer opened via the hamburger)
- `iframe_home_desktop`, `iframe_country-AFG_phone`,
  `iframe_drawer-open_phone`, `iframe_short-300_desktop` (1200×300 frame)

Visible differences: new line icons; labels #666 (was #999); drawer items
stacked at the top (were spread over the full height); in the 300 px frame
the menu scrolls with icons only. The horizontal scrollbar in the 300 px
frame is in both builds (pre-existing; cause not investigated here. At 375 px
the equivalent overflow comes from `.chart-breakout { width: 100vw }`).
