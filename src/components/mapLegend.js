// Shared layout for the swatch-style legends used by the world map charts
// (mapTotalD3, mapPillarD3, mapCommitmentD3) — lays items out in a centered
// grid that wraps to two columns once there are enough items to benefit from
// it, so the legend stays compact and centered under the map on narrow charts.

import { swatchOutline, ink } from "./tokens.js";

const SWATCH_SIZE = 18;
const ROW_HEIGHT = 25;
const COLUMN_WIDTH = 150;

function columnCount(itemCount) {
  return itemCount > 2 ? 2 : 1;
}

// Pure size calculation — used to reserve vertical space below the map
// before the SVG (and therefore the legend itself) is created.
export function legendGridSize(itemCount) {
  const columns = columnCount(itemCount);
  const rows = Math.ceil(itemCount / columns);
  return {
    width: columns * COLUMN_WIDTH,
    height: (rows - 1) * ROW_HEIGHT + SWATCH_SIZE,
  };
}

// Renders a grid of swatch + label entries into `legendGroup`, starting at
// its origin (0, 0) — the caller positions/centers the group itself. Items
// may carry a `pattern` (a fill URL) layered over the base color swatch, used
// for the hatched "not enough data" / "partial data" entries. Swatches get a
// hairline dark outline unless the item sets its own stroke.
export function renderSwatchLegend(legendGroup, items) {
  const columns = columnCount(items.length);

  const entries = legendGroup
    .selectAll(".legend-item")
    .data(items)
    .join("g")
    .attr("class", "legend-item")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .attr("transform", (_d, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      return `translate(${col * COLUMN_WIDTH}, ${row * ROW_HEIGHT})`;
    });

  entries
    .append("rect")
    .attr("width", SWATCH_SIZE)
    .attr("height", SWATCH_SIZE)
    .attr("fill", (d) => d.color)
    .attr("stroke", (d) => d.stroke || swatchOutline.stroke)
    .attr("stroke-width", (d) => d.strokeWidth || swatchOutline.strokeWidth);

  entries
    .filter((d) => d.pattern)
    .append("rect")
    .attr("width", SWATCH_SIZE)
    .attr("height", SWATCH_SIZE)
    .attr("fill", (d) => d.pattern);

  entries
    .append("text")
    .attr("x", SWATCH_SIZE + 6)
    .attr("y", SWATCH_SIZE / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .text((d) => d.label);

  return legendGridSize(items.length);
}

// Stepped key for historical (year-over-year) mode: one row per direction,
// each with swatches at fixed |change| steps drawn at the map's real
// fill-opacity, followed by the regular swatch grid for the other entries.
const CHANGE_STEPS = [1, 5, 10]; // last step means "10 or more"
// Sized for the site's legend text: style.css forces svg text to 16px
// Nunito Sans, overriding the font-size set here
const STEP_LABEL_WIDTH = 104;
const STEP_CELL_WIDTH = 70;

// Builds the two key rows from the map's change colours and opacity function
export function changeKeyRows(decreaseColor, increaseColor, opacity) {
  const last = CHANGE_STEPS.length - 1;
  const steps = (sign, atLeast) =>
    CHANGE_STEPS.map((v, i) => ({
      label: i === last ? `${atLeast} ${sign}${v}` : `${sign}${v}`,
      opacity: opacity(v),
    }));
  return [
    { label: "▼ Decrease", color: decreaseColor, steps: steps("−", "≤") },
    { label: "▲ Increase", color: increaseColor, steps: steps("+", "≥") },
  ];
}

// Pure size calculation, same role as legendGridSize()
export function changeKeySize(rows, extraCount) {
  const extra = legendGridSize(extraCount);
  return {
    width: Math.max(
      STEP_LABEL_WIDTH + CHANGE_STEPS.length * STEP_CELL_WIDTH,
      extra.width,
    ),
    height: rows.length * ROW_HEIGHT + extra.height,
  };
}

export function renderChangeKey(legendGroup, rows, extraItems) {
  const keyRows = legendGroup
    .selectAll(".change-key-row")
    .data(rows)
    .join("g")
    .attr("class", "change-key-row")
    .style("pointer-events", "none")
    .style("user-select", "none")
    .attr("transform", (_d, i) => `translate(0, ${i * ROW_HEIGHT})`);

  keyRows
    .append("text")
    .attr("y", SWATCH_SIZE / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .attr("fill", ink)
    .text((d) => d.label);

  const cells = keyRows
    .selectAll(".change-key-step")
    .data((d) => d.steps.map((s) => ({ ...s, color: d.color })))
    .join("g")
    .attr("class", "change-key-step")
    .attr(
      "transform",
      (_d, i) => `translate(${STEP_LABEL_WIDTH + i * STEP_CELL_WIDTH}, 0)`,
    );

  cells
    .append("rect")
    .attr("width", SWATCH_SIZE)
    .attr("height", SWATCH_SIZE)
    .attr("fill", (d) => d.color)
    .attr("fill-opacity", (d) => d.opacity)
    .attr("stroke", swatchOutline.stroke)
    .attr("stroke-width", swatchOutline.strokeWidth);

  cells
    .append("text")
    .attr("x", SWATCH_SIZE + 4)
    .attr("y", SWATCH_SIZE / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", 12)
    .attr("fill", ink)
    .text((d) => d.label);

  renderSwatchLegend(
    legendGroup
      .append("g")
      .attr("transform", `translate(0, ${rows.length * ROW_HEIGHT})`),
    extraItems,
  );

  return changeKeySize(rows, extraItems.length);
}
