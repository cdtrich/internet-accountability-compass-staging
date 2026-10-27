// Shared colour tokens for data marks (v3). Bin colours are the single source
// for the four score categories in both Total and pillar mode; pillar colours
// stay in scales.js (getColor) for non-bin uses.

// Score bins, ordinal light → dark
export const bins = {
  offTrack: "#FDE74C",
  catchingUp: "#A9D96C",
  onTrack: "#35A88F",
  leading: "#007162",
};

// Category labels as they come from the R loaders, in bin order
export const binLabels = ["Off track", "Catching up", "On track", "Leading"];
export const binColors = [
  bins.offTrack,
  bins.catchingUp,
  bins.onTrack,
  bins.leading,
];

// Score band thresholds (lower bound of each band above Off track):
// 0-49 / 50-64 / 65-79 / 80-100 on the 0-100 score scale.
// Mirrors cut() breaks in dfiFull.csv.R:131-138 and
// dfiCardinal.csv.R:133. If one changes, change both.
export const bandBreaks = [50, 65, 80];

// Band midpoints, used as colour stops for the continuous bin ramp
export const bandMidpoints = [24.5, 57, 72, 90];

// Not enough data: neutral grey under a white hatch, never a bin colour
export const noData = "#dddddd";
export const noDataHatch = "#ffffff";

// Appends a self-contained hatch pattern (grey ground + white stripes) to an
// SVG <defs> selection; fill shapes with `url(#${id})`
export function appendNoDataPattern(defs, id = "iac-nodata") {
  const size = 4.2425;
  const pattern = defs
    .append("pattern")
    .attr("id", id)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", size)
    .attr("height", size)
    .attr("patternTransform", "rotate(-45)");
  pattern
    .append("rect")
    .attr("width", size)
    .attr("height", size)
    .attr("fill", noData);
  pattern
    .append("rect")
    .attr("width", 1.5)
    .attr("height", size)
    .attr("fill", noDataHatch);
  return pattern;
}

// Historical (year-over-year) mode; "increase" is the pillar colour
export const decline = "#C2410C";
export const noChange = "#BDBDBD"; // opaque neutral, drawn at full opacity
export const historicalOpacityFloor = 0.35;

// Text on or next to data colours (never use bin colours as text)
export const ink = "#222";
export const inkMuted = "#555";

// Hairline outline for legend swatches and bars
export const swatchOutline = { stroke: ink, strokeWidth: 0.5 };

// Signed change with a direction glyph, e.g. "▲ +3", "▼ −2", "0"
export function formatChange(change) {
  const rounded = Math.round(change);
  if (rounded > 0) return `▲ +${rounded}`;
  if (rounded < 0) return `▼ −${Math.abs(rounded)}`;
  return "0";
}

export const tokens = {
  bins,
  binLabels,
  binColors,
  bandBreaks,
  bandMidpoints,
  noData,
  noDataHatch,
  decline,
  noChange,
  historicalOpacityFloor,
  ink,
  inkMuted,
  swatchOutline,
};

export default tokens;
