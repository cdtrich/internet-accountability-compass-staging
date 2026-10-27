# Changelog: v3

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
