// Shared layout for the swatch-style legends used by the world map charts
// (mapTotalD3, mapPillarD3, mapCommitmentD3) — lays items out in a centered
// grid that wraps to two columns once there are enough items to benefit from
// it, so the legend stays compact and centered under the map on narrow charts.

import { swatchOutline } from "./tokens.js";

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
