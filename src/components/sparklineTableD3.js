import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { wrapText } from "./wrapText.js";
import { basePath } from "./basePath.js";
import { binLabels, binColors } from "./tokens.js";

/**
 * Sparkline - single inline trend line for one country + one metric
 *
 * @param {Array} data - rows for one country, multiple years
 * @param {string} pillarTxt - pillar to draw
 * @param {Array} yearDomain - [minYear, maxYear] for fixed x-axis
 * @param {Object} options
 */
const categoryColors = Object.fromEntries(
  binLabels.map((label, i) => [label, binColors[i]]),
);

export function sparkline(
  data,
  pillarTxt,
  yearDomain,
  { width = 120, height = 32, color = null, totalMode = false } = {},
) {
  const fillScale = colorScales();

  const pillarData = data
    .filter(
      (d) => d.pillar_txt === pillarTxt && d.value !== null && !isNaN(d.value),
    )
    .sort((a, b) => a.year - b.year);

  if (pillarData.length === 0) return document.createElement("span");

  const strokeColor = color ?? fillScale.getColor(pillarTxt);

  // Right inset wide enough that the latest-point dot (radius 3, drawn at
  // the scale's upper end) stays within the SVG's own box rather than relying
  // on overflow room from a neighboring cell (which isn't always there)
  const xScale = d3
    .scaleLinear()
    .domain(yearDomain)
    .range([2, width - 5]);
  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - 2, 2]);

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveCatmullRom);

  const area = d3
    .area()
    .x((d) => xScale(d.year))
    .y0(height - 2)
    .y1((d) => yScale(d.value))
    .curve(d3.curveCatmullRom);

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "overflow: visible;");

  // Area
  svg
    .append("path")
    .datum(pillarData)
    .attr("d", area)
    .attr("fill", totalMode ? "#ccc" : strokeColor)
    .attr("fill-opacity", totalMode ? 0.5 : 0.2)
    .attr("stroke", "none");

  // Line
  svg
    .append("path")
    .datum(pillarData)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", totalMode ? "#555" : strokeColor)
    .attr("stroke-width", 1.5);

  const dotColor = (d) =>
    totalMode ? (categoryColors[d.group_value] ?? "#ccc") : strokeColor;

  // Latest dot (always visible)
  const latest = pillarData[pillarData.length - 1];
  svg
    .append("circle")
    .attr("cx", xScale(latest.year))
    .attr("cy", yScale(latest.value))
    .attr("r", 3)
    .attr("fill", dotColor(latest));

  // Intermediate dots (visible on hover only)
  const intermediate = pillarData.slice(0, -1);
  const dots = svg
    .selectAll(".interim-dot")
    .data(intermediate)
    .join("circle")
    .attr("class", "interim-dot")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.value))
    .attr("r", 3)
    .attr("fill", totalMode ? (d) => dotColor(d) : "none")
    .attr("stroke", totalMode ? "none" : strokeColor)
    .attr("stroke-width", 1)
    .style("opacity", 0);

  // Tooltip (reuse shared .chart-tooltip)
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Hover targets (invisible wide rects per year for easier hover)
  const bandWidth = width / pillarData.length;
  svg
    .selectAll(".hover-band")
    .data(pillarData)
    .join("rect")
    .attr("class", "hover-band")
    .attr("x", (d) => xScale(d.year) - bandWidth / 2)
    .attr("y", 0)
    .attr("width", bandWidth)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("mouseenter", function (event, d) {
      // Show intermediate dots
      dots.style("opacity", 1);

      tooltip
        .style("visibility", "visible")
        .html(`<strong>${Math.round(d.value)}</strong> (${d.year})`);
    })
    .on("mousemove", function (event, d) {
      // Snap to the data point position
      const svg = this.ownerSVGElement;
      const svgRect = svg.getBoundingClientRect();
      const pointX = svgRect.left + xScale(d.year);
      const pointY = svgRect.top + yScale(d.value);

      tooltip
        .style("top", pointY + window.scrollY - 28 + "px")
        .style("left", pointX + window.scrollX + 10 + "px");
    })
    .on("mouseleave", function () {
      dots.style("opacity", 0);
      tooltip.style("visibility", "hidden");
    });

  return svg.node();
}

/**
 * Sparkline table - full historical view replacing polar/heatmap
 * Shows all countries as rows, pillars as columns, with sparklines
 *
 * @param {Array} data - full dfiCardinal dataset with year column
 * @param {boolean} isMobile
 * @param {Object} options
 */
export function sparklineTableD3(data, isMobile, { width = 640 } = {}) {
  const fillScale = colorScales();

  const pillars = [
    "Connectivity and infrastructure",
    "Rights and freedoms",
    "Responsibility and sustainability",
    "Trust and resilience",
  ];

  const pillarShort = isMobile
    ? ["Connectivity", "Rights", "Responsibility", "Trust"]
    : pillars;

  // Calculate global year domain for fixed x-axis across all sparklines
  const allYears = data.map((d) => d.year).filter((y) => y != null);
  const yearDomain = d3.extent(allYears);

  // Get countries sorted by latest total score
  const latestYear = d3.max(data, (d) => d.year);
  const latestData = data.filter((d) => d.year === latestYear);
  const countries = [...new Set(latestData.map((d) => d.NAME_ENGL))]
    .map((name) => {
      const row = latestData.find((d) => d.NAME_ENGL === name);
      return {
        name,
        iso: row?.ISO3_CODE,
        total: row?.total ?? -1,
        url: row?.country_url,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Sparkline dimensions
  const sparkW = isMobile ? 60 : 100;
  const sparkH = 28;

  // Container
  const container = document.createElement("div");
  container.className = "sparkline-table-container";

  // Table
  const table = document.createElement("table");
  table.className = "sparkline-table";

  // Header
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  const headers = isMobile
    ? ["", "Total", ...pillarShort]
    : ["Country", "Total", ...pillarShort];

  headers.forEach((text, i) => {
    const th = document.createElement("th");

    if (i > 1) {
      // Pillar headers - colored; rotated to vertical on mobile (where
      // narrow columns don't have room for horizontal text), wrapped on
      // desktop where columns are wide enough
      th.style.color = fillScale.getColor(pillars[i - 2]);
      th.style.fontWeight = "700";
      if (isMobile) {
        th.className = "sparkline-th-rotated";
        th.innerHTML = wrapText(pillars[i - 2], 20).join("<br>");
      } else {
        th.innerHTML = wrapText(text, 15).join("<br>");
      }
    } else {
      th.textContent = text;
    }

    headerRow.appendChild(th);
  });

  // Body
  const tbody = table.createTBody();

  countries.forEach((country) => {
    const countryData = data.filter((d) => d.NAME_ENGL === country.name);
    const row = tbody.insertRow();
    row.className = "sparkline-row";

    // Country name cell
    const nameCell = row.insertCell();
    nameCell.className = "sparkline-country-name";
    const link = document.createElement("a");
    link.href = `${basePath}/${country.iso}/` || "#";
    link.textContent = isMobile ? country.iso : country.name;
    nameCell.appendChild(link);

    // Total score cell
    const totalCell = row.insertCell();
    totalCell.className = "sparkline-total";
    totalCell.appendChild(
      sparkline(countryData, "Total score", yearDomain, {
        width: sparkW,
        height: sparkH,
        totalMode: true,
      }),
    );

    // Pillar sparkline cells
    pillars.forEach((pillar) => {
      const cell = row.insertCell();
      cell.className = "sparkline-cell";
      cell.appendChild(
        sparkline(countryData, pillar, yearDomain, {
          width: sparkW,
          height: sparkH,
        }),
      );
    });
  });

  container.appendChild(table);

  // LINKED BRUSHING - Add hover interactions with smooth transitions
  const allRows = Array.from(tbody.querySelectorAll("tr"));
  const allCells = Array.from(tbody.querySelectorAll("td"));

  allCells.forEach((cell) => {
    cell.addEventListener("mouseenter", function () {
      const row = this.parentElement;
      const rowIndex = allRows.indexOf(row);
      const colIndex = Array.from(row.children).indexOf(this);

      // Dim all cells that don't share the same row or column
      allCells.forEach((c) => {
        const cRow = c.parentElement;
        const cRowIndex = allRows.indexOf(cRow);
        const cColIndex = Array.from(cRow.children).indexOf(c);

        // Add transition
        c.style.transition = "opacity 150ms";

        // Keep full opacity if same row OR same column
        if (cRowIndex === rowIndex || cColIndex === colIndex) {
          c.style.opacity = "1";
        } else {
          c.style.opacity = "0.2";
        }
      });
    });

    cell.addEventListener("mouseleave", function () {
      // Reset all cells to full opacity
      allCells.forEach((c) => {
        c.style.transition = "opacity 150ms";
        c.style.opacity = "1";
      });
    });
  });

  return container;
}
