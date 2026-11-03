import * as d3 from "npm:d3";
import { inkMuted, statusMarkers, styleStatusMarker } from "./tokens.js";

// Layout lives in a stylesheet (not inline styles) so the narrow-screen
// media query can override it: one centred row when wide, a left-aligned
// column (markers on one edge) at <=600px.
const css = `
.status-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.25rem 1.25rem;
  margin: 0 auto 20px;
  max-width: 100%;
  font-size: 14px;
  line-height: 1.4;
  color: ${inkMuted};
}
.status-legend-title {
  font-weight: 600;
}
.status-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}
.status-legend-item svg {
  flex: none;
}
@media (max-width: 600px) {
  .status-legend {
    flex-direction: column;
    align-items: flex-start;
    width: fit-content;
    margin-inline: auto;
  }
}
`;

/**
 * Legend for the provenance markers on the indicator charts.
 * HTML (wraps on narrow screens); only the markers are SVG, so the forced
 * `svg text` style in style.css does not apply to the labels.
 *
 * @returns {HTMLElement}
 */
export function statusLegend() {
  const container = d3.create("div").attr("class", "status-legend");
  container.append("style").text(css);

  container
    .append("span")
    .attr("class", "status-legend-title")
    .text("Indicator charts:");

  const items = [
    { status: "actual", label: "Published in that year's edition" },
    { status: "carried", label: "Computed value" },
  ];

  const size = 2 * (statusMarkers.radius + statusMarkers.strokeWidth);
  items.forEach(({ status, label }) => {
    const item = container.append("span").attr("class", "status-legend-item");

    item
      .append("svg")
      .attr("width", size)
      .attr("height", size)
      .attr("viewBox", [0, 0, size, size])
      .attr("aria-hidden", "true")
      .append("circle")
      .attr("cx", size / 2)
      .attr("cy", size / 2)
      .attr("r", statusMarkers.radius)
      .call(styleStatusMarker, inkMuted, status);

    item.append("span").text(label);
  });

  return container.node();
}
