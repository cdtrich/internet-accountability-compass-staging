import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { ink } from "./tokens.js";
import { wrapText } from "./wrapText.js";
import { basePath } from "./basePath.js";

/**
 * D3 Heatmap with Linked Brushing
 * Clean minimal design with hover interactions
 *
 * @param {Array} data - Data with pillar_txt, NAME_ENGL, ISO3_CODE, value, group_value, note
 * @param {boolean} isMobile - Mobile flag
 * @param {Object} options - Chart options (width)
 */
export function heatmap(data, isMobile, options = {}) {
  const { width = 640 } = options;

  // Dimensions
  const height = data.length * 5;
  const finalHeight = height < 3000 ? 3000 : height;
  const marginLeft = isMobile ? width / 5 : width / 4;
  const marginRight = isMobile ? 0 : width / 4;
  const marginTop = isMobile ? width / 2 : width / 10;
  const marginBottom = 40;

  // Get color scale
  const fillScale = colorScales();

  // Filter out NA values (check for string "NA" and actual NA/null/undefined)
  const dataDropNA = data.filter(
    (d) =>
      d.group_value !== "NA" &&
      d.group_value !== null &&
      d.group_value !== undefined,
  );

  // Get y domain (countries sorted by total score)
  // First, get countries with total scores for sorting
  const totalScoreData = dataDropNA.filter(
    (d) => d.pillar_txt === "Total score",
  );

  // Create a map of country -> total score for sorting
  const totalScoreMap = new Map(
    totalScoreData.map((d) => [
      isMobile ? d.ISO3_CODE : d.NAME_ENGL,
      d.total || 0,
    ]),
  );

  // Get ALL unique countries from the data
  const allCountries = [
    ...new Set(dataDropNA.map((d) => (isMobile ? d.ISO3_CODE : d.NAME_ENGL))),
  ];

  // Sort by total score (countries without total score go to the end)
  const yDomain = allCountries.sort((a, b) => {
    const scoreA = totalScoreMap.get(a) || -1;
    const scoreB = totalScoreMap.get(b) || -1;
    return scoreB - scoreA; // Descending order
  });

  // X domain (pillars)
  const xDomain = [
    "Connectivity and infrastructure",
    "Rights and freedoms",
    "Responsibility and sustainability",
    "Trust and resilience",
    "Total score",
  ];

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(xDomain)
    .range([marginLeft, width - marginRight])
    .padding(0);

  const yScale = d3
    .scaleBand()
    .domain(yDomain)
    .range([marginTop, finalHeight - marginBottom])
    .padding(0);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", finalHeight)
    .attr("viewBox", [0, 0, width, finalHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Add pattern definition for partial data
  const defs = svg.append("defs");
  defs
    .append("pattern")
    .attr("id", "white-diagonal-lines")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 4.2425)
    .attr("height", 4.2425)
    .attr("patternTransform", "rotate(45)")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1.5)
    .attr("height", 4.2425)
    .attr("fill", "white");

  // Create cell groups
  const cells = svg
    .append("g")
    .attr("class", "cells")
    .selectAll("g")
    .data(dataDropNA)
    .join("g")
    .attr("class", "cell")
    .attr("transform", (d) => {
      const yValue = isMobile ? d.ISO3_CODE : d.NAME_ENGL;
      const x = xScale(d.pillar_txt);
      const y = yScale(yValue);

      // Safety check - skip if coordinates are undefined
      if (x === undefined || y === undefined) {
        console.warn("Undefined coordinate for:", d.NAME_ENGL, d.pillar_txt);
        return "translate(0,0)";
      }

      return `translate(${x},${y})`;
    })
    .filter(function (d) {
      // Remove cells with invalid coordinates
      const yValue = isMobile ? d.ISO3_CODE : d.NAME_ENGL;
      return xScale(d.pillar_txt) !== undefined && yScale(yValue) !== undefined;
    });

  // Add colored rectangles
  cells
    .append("rect")
    .attr("class", "cell-rect")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) =>
      fillScale.getOrdinalCategoryScale(d.pillar_txt)(d.group_value),
    )
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      if (d.ISO3_CODE) {
        window.location.href = `${basePath}/${d.ISO3_CODE}/`;
      }
    });

  // Add diagonal pattern overlay for partial data
  cells
    .filter((d) => d.note === " (partial data)")
    .append("rect")
    .attr("class", "cell-pattern")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", "url(#white-diagonal-lines)")
    .style("pointer-events", "none");

  // Add value labels
  cells
    .append("text")
    .attr("class", "cell-label")
    .attr("x", xScale.bandwidth() / 2)
    .attr("y", yScale.bandwidth() / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 10)
    .attr("fill", (d) => (d.value > 79 ? "#fff" : "#000"))
    .style("pointer-events", "none")
    .text((d) => {
      // Handle various NA cases
      if (
        d.value === "NA" ||
        d.value === null ||
        d.value === undefined ||
        isNaN(d.value)
      ) {
        return "";
      }
      return Math.floor(d.value) + (d.note === " (partial data)" ? "*" : "");
    });

  // LINKED BRUSHING - Hover interactions
  cells
    .on("mouseenter", function (event, d) {
      const hoveredPillar = d.pillar_txt;
      const hoveredCountry = isMobile ? d.ISO3_CODE : d.NAME_ENGL;

      // Dim all cells that don't share x (pillar) or y (country)
      cells
        .transition()
        .duration(150)
        .style("opacity", (dd) => {
          const cellPillar = dd.pillar_txt;
          const cellCountry = isMobile ? dd.ISO3_CODE : dd.NAME_ENGL;

          // Keep full opacity if same pillar OR same country
          if (cellPillar === hoveredPillar || cellCountry === hoveredCountry) {
            return 1;
          }
          // Dim everything else
          return 0.2;
        });
    })
    .on("mouseleave", function () {
      // Reset all cells to full opacity
      cells.transition().duration(150).style("opacity", 1);
    });

  // Tooltip
  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  cells
    .on("mouseover", function (event, d) {
      const valueText =
        d.value === "NA" ||
        d.value === null ||
        d.value === undefined ||
        isNaN(d.value)
          ? "No data"
          : Math.floor(d.value);
      const partialNote = d.note === " (partial data)" ? " (partial data)" : "";

      tooltip.style("visibility", "visible").html(`
        <strong style="font-size: 28px; font-weight: bold; color: ${ink}; margin-bottom: 8px;"><strong>${valueText}</strong> ${partialNote}</strong><strong>${d.NAME_ENGL}</strong><br>
        ${d.pillar_txt}<br>
        <em>${d.group_value || "N/A"}</em>
      `);
    })
    .on("mousemove", function (event) {
      // Get center of the rect
      const rect = this.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      tooltip
        .style("top", centerY + window.scrollY - 10 + "px")
        .style("left", centerX + window.scrollX + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });

  // X axis (top)
  const xAxis = d3.axisTop(xScale).tickSize(0);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${marginTop})`)
    .call(xAxis)
    .call((g) => g.select(".domain").remove()) // Remove axis line
    .selectAll("text")
    .each(function (d) {
      const text = d3.select(this);
      const lines = wrapText(d, 15);

      // Clear existing text
      text.text(null);

      // Get color for this pillar
      const color = fillScale.getColor(d);

      // Add tspan for each line
      lines.forEach((line, i) => {
        text
          .append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? (isMobile ? "-1em" : "-2.5em") : "1.1em")
          .attr("fill", line === "Total score" ? "#000" : color) // ADD COLOR
          .attr("font-weight", 700) // ADD BOLD
          .text(line);
      });

      // Apply rotation for mobile
      if (isMobile) {
        text
          .attr("transform", "rotate(-90) translate(10,5)")
          .attr("text-anchor", "start");
        // .attr("justify-content", "center")
        // .attr("align-items", "center")
        // .attr("dy", -12);
      } else {
        text.attr("text-anchor", "middle");
      }
    });

  // Y axis (left)
  const yAxis = d3.axisLeft(yScale).tickSize(0);

  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call((g) => g.select(".domain").remove()); // Remove axis line

  return svg.node();
}
