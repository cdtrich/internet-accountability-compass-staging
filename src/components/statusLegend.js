import * as d3 from "npm:d3";
import { inkMuted, statusMarkers, styleStatusMarker } from "./tokens.js";

/**
 * Legend for the provenance markers on the indicator charts.
 * HTML (wraps on narrow screens); only the markers are SVG, so the forced
 * `svg text` style in style.css does not apply to the labels.
 *
 * @returns {HTMLElement}
 */
export function statusLegend() {
  const container = d3
    .create("div")
    .attr("class", "status-legend")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("gap", "0.25rem 1.25rem")
    .style("margin", "0 auto 20px")
    .style("max-width", "100%")
    .style("font-size", "14px")
    .style("line-height", "1.4")
    .style("color", inkMuted);

  container.append("span").style("font-weight", "600").text("Indicator charts:");

  const items = [
    { status: "actual", label: "Published in that year's edition" },
    { status: "carried", label: "Computed (carried forward or backdated)" },
  ];

  const size = 2 * (statusMarkers.radius + statusMarkers.strokeWidth);
  items.forEach(({ status, label }) => {
    const item = container
      .append("span")
      .style("display", "inline-flex")
      .style("align-items", "center")
      .style("gap", "0.4em");

    item
      .append("svg")
      .attr("width", size)
      .attr("height", size)
      .attr("viewBox", [0, 0, size, size])
      .attr("aria-hidden", "true")
      .style("flex", "none")
      .append("circle")
      .attr("cx", size / 2)
      .attr("cy", size / 2)
      .attr("r", statusMarkers.radius)
      .call(styleStatusMarker, inkMuted, status);

    item.append("span").text(label);
  });

  return container.node();
}
