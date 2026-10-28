# Radial prototype: report

Branch `proto/radial`. Prototype only: polarD3.js, polarCountryD3.js and the
country pages are unchanged.

## What was built

- `src/components/prototypes/polarVariants.js`:
  `polarVariant(data, country, { variant, radiusScale, width, isMobile })`.
  Static render, no transitions. Rings, total score, angle convention and
  tooltip as today. Variants `current`, `A` (stem + arc cap), `B` (rose
  sectors), `C` (0.25 sectors + arc cap); `radiusScale` `linear` or `sqrt`.
- `src/prototypes/radial.md`: not linked anywhere, `noindex`. Sections:
  comparison at 400px, 24 thumbnails at 150px per variant, small viewport
  (360px container), live measurements.
- Screenshots (headless Chrome, 1500px wide): `radial-1-comparison-400.png`,
  `radial-2-thumbnails-150.png`, `radial-3-small-viewport.png`.

**View:** `npm run dev`, then open `/prototypes/radial`. Hover a thumbnail for
the country name; hover an indicator to dim the others across that block.

**Test countries:** Finland (highest total, 85; 1 indicator missing), South
Sudan (lowest total, 28; 4 missing), Fiji (3 missing, total 69).

## Measurements

Grid = 24 thumbnails at 150px. Render = build 24 SVGs + append + forced
layout, one warm-up then median of 5, in headless Chrome 156 on this laptop,
real time via the DevTools protocol. Three page loads.

| Variant | SVG nodes / chart (12 indicators) | Grid DOM nodes (24) | Grid render, median ms (3 loads) |
|---|---|---|---|
| current | 58 | 1304 | 16.6 / 24.3 / 18.8 |
| A | 46 | 1038 | 17.9 / 23.0 / 13.4 |
| B | 34 | 772 | 12.4 / 18.1 / 14.1 |
| B-sqrt | 34 | 772 | 11.4 / 17.5 / 10.5 |
| C | 46 | 1038 | 15.0 / 15.4 / 13.4 |
| C-sqrt | 46 | 1038 | 14.9 / 14.9 / 13.5 |

- Node counts are exact. B has 41% fewer nodes than current (34 vs 58 per
  chart; at 194 countries on countries.html that is about 4,650 fewer nodes,
  an estimate from 24 × 194/24).
- Render times are noisy (spread across loads ≈ 5–10 ms per variant), so
  only "B is at or below the others" is supported; differences between the
  other variants are within noise. Each measurement includes a per-chart
  data filter that is the same for all variants. Today's animated version
  (transitions, staggered delays) was not measured here.

## Observations

- **Shape at 150px:** B reads most clearly as a per-country shape. B-sqrt
  inflates low values, so high scorers converge towards full discs and
  differ less. C at 0.25 opacity is pale at thumbnail size; its caps add
  detail but also noise. A looks much like current, with more clutter.
- **One shared feature dominates every shape:** indicator 2 (Global Internet
  Shutdowns) has median 100 and 87% of countries ≥ 90, so nearly every
  country has the same long spike at about 1 o'clock. That comes from the
  data, not the chart, but it limits how distinct the shapes can be.
- **Adjacent same-pillar wedges:** separated only by the 1px white stroke.
  The stroke is visible at 400px and still visible at 150px for B. Where two
  neighbours have similar values they merge into one block, and their
  values are then read from the step in the outline only.
- **Pillar colour pairs (not fixed, as requested).** ΔE76 in Lab, < ~10 is
  hard to tell apart at small size:

  | Pair | Full | 0.25 on white | Deuteranopia | Protanopia |
  |---|---|---|---|---|
  | Conn–Rights | 22.2 | 5.7 | 19.2 | 8.3 |
  | Conn–Resp | 50.8 | 16.8 | 29.3 | 9.4 |
  | Conn–Trust | 38.6 | 10.4 | 27.0 | 9.4 |
  | Rights–Resp | 30.9 | 11.2 | 11.3 | 5.8 |
  | Rights–Trust | 17.5 | 4.8 | 8.4 | 2.6 |
  | Resp–Trust | 13.8 | 6.4 | 3.5 | 3.7 |

  Filled at full opacity (B), Resp–Trust (13.8) and Rights–Trust (17.5) are
  the closest pairs; under colour-vision deficiency Resp–Trust and
  Rights–Trust effectively collapse. At 0.25 (C), three pairs fall below 10
  for everyone. Every 0.25 wedge has only 1.5:1 contrast against white.
- **Sqrt scale and the centre dot:** with `radialScale(3)` the white centre
  dot became a large hole under sqrt (17% of the radius). The prototype
  fixes it at 3% of the radius in all variants.

## Found while reading the current code (not changed)

- The country template calls `polarCountryD3(dfiFull, country, {width})`, but
  the signature is `(data, country, isMobile, options)`. The `{width}`
  object lands in `isMobile`: the chart is always 400px wide and always uses
  mobile dot sizes.
- polarD3's halo line has its `stroke-width` commented out, so in the
  multiples it is a 1px line at opacity 0.1, not a halo.
- polarD3's legend shades pillar sectors from the first stem to the third.
  Centred wedges would leave the legend offset by half a step (15°); adjust
  when porting.
- The two components use different tooltips; the prototype uses the
  country-page one everywhere.

## Verified / not verified

- Verified (DevTools protocol, real mouse events): hovering an indicator
  sets the brush, dims 242 of 266 marks in a 24-thumbnail block (the other
  24 are the same indicator in each country), shows the tooltip, and resets
  on leave, in current, A, B and C.
- Not verified: touch behaviour; the page inside the iframe test page;
  a staging build (nothing pushed).
