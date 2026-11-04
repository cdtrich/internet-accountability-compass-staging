import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import {
  isComputedStatus,
  statusMarkers,
  styleStatusMarker,
} from "./tokens.js";
import { tooltipHTML } from "./tooltipHTML.js";

// unique clipPath ids across charts on one page (charts rebuild on resize)
let clipCounter = 0;

// <title> text for one value; status only when it is computed
const statusSuffix = {
  carried: " (carried forward)",
  backdated: " (backdated)",
};

// Tooltip note per status; none for "actual"
const statusNote = {
  carried: "Carried forward",
  backdated: "Backdated",
};

function statusText(d) {
  const value = Math.round(d.value);
  const suffix = statusSuffix[d.value_status] ?? "";
  return { plain: `${value}${suffix}` };
}

/**
 * Historical Line Chart for Indicator
 * Shows all countries over time, highlighting the selected country
 *
 * @param {Array} data - Full data with all years
 * @param {string} country - Country to highlight
 * @param {string} pillar - Pillar to filter
 * @param {string} indicator - Specific indicator/commitment
 * @param {Object} options - width, height
 */
export function indicatorHistorical(
  data,
  country,
  pillar,
  indicator,
  options = {},
) {
  const { width = 320, height = 250 } = options;

  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(pillar);

  // Filter to pillar and indicator
  const indicatorData = data
    .filter(
      (d) => d.pillar_txt === pillar && d.commitment_txt_cardinal === indicator,
    )
    .filter((d) => !isNaN(d.value) && d.value !== null && d.value !== "NA");

  if (indicatorData.length === 0) {
    const div = document.createElement("div");
    div.textContent = "No historical data available";
    div.style.padding = "20px";
    div.style.textAlign = "center";
    div.style.fontSize = "12px";
    return div;
  }

  // Group by country
  const byCountry = d3.group(indicatorData, (d) => d.NAME_ENGL);

  // Dimensions
  const margin = { top: 40, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const yearExtent = d3.extent(indicatorData, (d) => d.year);
  const xScale = d3.scaleLinear().domain(yearExtent).range([0, innerWidth]);

  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .defined((d) => d.value !== null) // gaps for missing years (selected country)
    .curve(d3.curveMonotoneX);

  // Area generator (fills from the line down to the axis) — shares the
  // line's x/curve so the fill traces the same path as the stroke
  // const area = d3
  //   .area()
  //   .x((d) => xScale(d.year))
  //   .y0(innerHeight)
  //   .y1((d) => yScale(d.value))
  //   .curve(d3.curveMonotoneX);

  // X-axis (every year, no line)
  g.append("g")
    .attr("transform", `translate(0, ${innerHeight + 10})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(yearExtent[1] - yearExtent[0])
        .tickFormat(d3.format("d"))
        .tickSize(0),
    )
    .call((g) => g.select(".domain").remove())
    .selectAll("text")
    .attr("class", "chart-axistext");

  // Y-axis (intervals of 25, no line)
  g.append("g")
    .call(d3.axisLeft(yScale).tickValues([0, 25, 50, 75, 100]).tickSize(0))
    .call((g) => g.select(".domain").remove())
    .selectAll("text")
    .attr("dx", -5)
    .attr("class", "chart-axistext");

  // Grid lines
  g.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data([0, 25, 50, 75, 100])
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "#eee")
    .attr("stroke-width", 1);

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".indicator-historical-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip indicator-historical-tooltip");

  // Draw all countries (background)
  byCountry.forEach((countryData, countryName) => {
    if (countryName === country) return; // Skip selected country for now

    const sortedData = countryData.sort((a, b) => a.year - b.year);

    g.append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", pillarColor)
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.2)
      .attr("d", line);
  });

  // Draw selected country (foreground)
  const selectedCountryData = byCountry.get(country);
  if (selectedCountryData) {
    const sortedData = selectedCountryData.sort((a, b) => a.year - b.year);
    const byYear = new Map(sortedData.map((d) => [d.year, d]));

    // one slot per year, so a missing year stays a gap in the line
    const years = d3.range(yearExtent[0], yearExtent[1] + 1);
    const slots = years.map(
      (year) => byYear.get(year) ?? { year, value: null },
    );

    // segments between consecutive years; dashed if either end is computed
    const segments = { solid: [], dashed: [] };
    d3.pairs(years).forEach(([y0, y1]) => {
      const a = byYear.get(y0);
      const b = byYear.get(y1);
      if (!a || !b) return;
      const computed =
        isComputedStatus(a.value_status) || isComputedStatus(b.value_status);
      segments[computed ? "dashed" : "solid"].push([y0, y1]);
    });

    // one curved path, split per segment by clipping to its x-range
    // (curveMonotoneX is monotone in x, so the pieces do not overlap)
    const clipId = `indicator-historical-clip-${++clipCounter}`;
    const defs = svg.append("defs");
    Object.entries(segments).forEach(([kind, ranges]) => {
      if (ranges.length === 0) return;
      defs
        .append("clipPath")
        .attr("id", `${clipId}-${kind}`)
        .selectAll("rect")
        .data(ranges)
        .join("rect")
        .attr("x", ([y0]) => xScale(y0))
        .attr("width", ([y0, y1]) => xScale(y1) - xScale(y0))
        .attr("y", -margin.top)
        .attr("height", height);

      g.append("path")
        .datum(slots)
        .attr("fill", "none")
        .attr("stroke", pillarColor)
        .attr("stroke-width", 3)
        .attr(
          "stroke-dasharray",
          kind === "dashed" ? statusMarkers.computedDash : null,
        )
        .attr("clip-path", `url(#${clipId}-${kind})`)
        .attr("d", line);
    });

    // Markers for every value: filled = published, hollow = computed
    g.selectAll(".selected-dot")
      .data(sortedData)
      .join("circle")
      .attr("class", "selected-dot")
      .attr("cx", (d) => xScale(d.year))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", statusMarkers.radius)
      .call(styleStatusMarker, pillarColor)
      .style("cursor", "pointer")
      .call((circles) =>
        circles.append("title").text((d) => statusText(d).plain),
      )
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", statusMarkers.radiusHover);

        tooltip
          .style("visibility", "visible")
          .html(
            tooltipHTML({
              value: Math.round(d.value),
              notes: [statusNote[d.value_status]],
            }),
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", statusMarkers.radius);

        tooltip.style("visibility", "hidden");
      });
  }

  // Title (indicator name)
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", 13)
    .attr("font-weight", "bold")
    .attr("fill", pillarColor)
    .text(indicator);

  return svg.node();
}
