import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { wrapText } from "./wrapText.js";
import { basePath } from "./basePath.js";

/**
 * Polar "bars" charts (v3): successors of polarD3 (small multiples) and
 * polarCountryD3 (single country). The old modules stay in place so the
 * site can switch back by changing the imports.
 *
 * Each indicator is a low-opacity sector centred on its cardinal angle plus
 * a full-opacity arc cap at the value (variant C of the radial prototype).
 * The radius scale starts at -25, so score 0 sits at 20% of the radius and
 * the white centre disc ends exactly at 0: this keeps short bars from
 * shrinking to slivers and reduces the length-vs-area distortion of a rose.
 *
 * Angles: indicator i = commitment_num_cardinal - 1 is centred at i * 30°,
 * 0 at 12 o'clock, clockwise; its sector spans (i - 0.5) .. (i + 0.5) * 30°.
 *
 * Static render (no entry animation). Hover: one delegated listener per
 * SVG; the hovered indicator is set as data-active on the SVG root and CSS
 * dims every other indicator (linked across all countries in the multiples).
 */

const DOMAIN_MIN = -25;
const STEP = (2 * Math.PI) / 12;
const RING_VALUES = [100, 80, 60, 40, 20];
const WEDGE_OPACITY = 0.25;

const angleOf = (d) => (d.commitment_num_cardinal - 1) * STEP;
const hasValue = (d) => typeof d.value === "number" && !isNaN(d.value);

function radialScaleFor(radius) {
  return d3.scaleLinear().domain([DOMAIN_MIN, 100]).range([0, radius]);
}

// Rings, centre disc, indicator sectors + caps and the total-score ring for
// one country, drawn into `g` (already translated to the chart centre)
function drawCountryMarks(g, rows, radialScale, { capThickness }) {
  const fillScale = colorScales();
  const r0 = radialScale(0);

  RING_VALUES.forEach((val) => {
    g.append("circle")
      .attr("r", radialScale(val))
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);
  });

  const sector = d3
    .arc()
    .innerRadius(r0)
    .outerRadius((d) => radialScale(d.value))
    .startAngle((d) => angleOf(d) - STEP / 2)
    .endAngle((d) => angleOf(d) + STEP / 2);

  // Cap sits just inside the value, so a score of 0 still shows a cap on
  // the edge of the centre disc
  const cap = d3
    .arc()
    .innerRadius((d) => radialScale(d.value) - capThickness)
    .outerRadius((d) => radialScale(d.value))
    .startAngle((d) => angleOf(d) - STEP / 2)
    .endAngle((d) => angleOf(d) + STEP / 2);

  const marks = g
    .append("g")
    .attr("class", "polar-marks")
    .selectAll(".polar-mark")
    .data(rows.filter(hasValue))
    .join("g")
    .attr("class", (d) => `polar-mark c-${d.commitment_num_cardinal}`);

  marks
    .append("path")
    .attr("d", sector)
    .attr("fill", (d) => fillScale.getColor(d.pillar_txt))
    .attr("fill-opacity", WEDGE_OPACITY)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  marks
    .append("path")
    .attr("d", cap)
    .attr("fill", (d) => fillScale.getColor(d.pillar_txt));

  // Total score as an outline ring on top of the sectors
  const totalScore = rows[0]?.total;
  if (typeof totalScore === "number" && !isNaN(totalScore)) {
    g.append("circle")
      .attr("r", radialScale(totalScore))
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
  }

  // Centre disc up to score 0, with a faint zero ring
  g.append("circle")
    .attr("r", r0)
    .attr("fill", "#fff")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .attr("stroke-opacity", 0.3)
    .style("pointer-events", "none");

  return totalScore;
}

// Delegated hover for every .polar-mark inside `svg`: sets data-active on
// the SVG root (CSS dims the rest) and shows the tooltip. On touch, the
// tooltip stays until the next tap outside a mark.
function attachHover(svg, tooltip, tooltipHtml) {
  const root = svg.node();
  const hide = () => {
    delete root.dataset.active;
    tooltip.style("visibility", "hidden");
  };

  svg
    .on("pointerover", (event) => {
      const mark = event.target.closest(".polar-mark");
      if (!mark) return;
      const d = d3.select(mark).datum();
      root.dataset.active = d.commitment_num_cardinal;
      tooltip
        .style("visibility", "visible")
        .html(tooltipHtml(d))
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("pointermove", (event) => {
      if (!event.target.closest(".polar-mark")) return;
      tooltip
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("pointerout", (event) => {
      if (event.pointerType === "touch") return;
      const to = event.relatedTarget?.closest?.(".polar-mark");
      if (to && root.contains(to)) return;
      hide();
    })
    .on("pointerdown", (event) => {
      if (!event.target.closest(".polar-mark")) hide();
    });
}

// Brushing rules, injected once: dim every indicator except the active one
function ensureStyles() {
  if (document.getElementById("polar-bars-styles")) return;
  const rules = d3
    .range(1, 13)
    .map(
      (n) =>
        `.polar-bars[data-active="${n}"] .polar-mark:not(.c-${n}) { opacity: 0.2; }`,
    )
    .join("\n");
  const style = document.createElement("style");
  style.id = "polar-bars-styles";
  // The opacity transition is limited to the single-country chart: in the
  // multiples (~1,850 marks dimmed at once) it delayed the dimming by
  // ~450 ms in headless Chrome, vs ~50 ms without it
  style.textContent = `.polar-bars .polar-mark { cursor: pointer; }
.polar-bars-single .polar-mark { transition: opacity 150ms; }
${rules}`;
  document.head.appendChild(style);
}

/**
 * Small multiples with linked brushing (successor of polarD3)
 *
 * @param {Array} data - rows with commitment_num_cardinal, value, pillar_txt, NAME_ENGL, total
 * @param {boolean} isMobile - Mobile flag
 * @param {Object} options - Chart options (width)
 */
export function polarBarsD3(data, isMobile, options = {}) {
  const { width = 640 } = options;
  ensureStyles();
  const fillScale = colorScales();

  const countries = [...new Set(data.map((d) => d.NAME_ENGL))].sort();
  const pillars = [...new Set(data.map((d) => d.pillar_txt))];

  // Grid layout — two countries per row on mobile, five on desktop, plus a
  // legend row at the top
  const cols = isMobile ? 2 : 5;
  const rows = Math.ceil(countries.length / cols) + 1;
  const cellWidth = (width * 0.9) / cols;
  const cellHeight = cellWidth;
  const radius = cellWidth * 0.35;
  const totalWidth = width * 0.9;
  const totalHeight = rows * cellHeight;

  const radialScale = radialScaleFor(radius);

  const svg = d3
    .create("svg")
    .attr("class", "polar-bars")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .attr("viewBox", [0, 0, totalWidth, totalHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Legend centred horizontally regardless of column count
  drawLegend(
    svg
      .append("g")
      .attr("class", "legend-cell")
      .attr(
        "transform",
        `translate(${totalWidth / 2}, ${cellHeight / 2})`,
      ),
    radius / 2,
  );

  const byCountry = d3.group(data, (d) => d.NAME_ENGL);
  countries.forEach((country, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols) + 1;
    const g = svg
      .append("g")
      .attr("class", "country-cell")
      .attr(
        "transform",
        `translate(${col * cellWidth + cellWidth / 2}, ${row * cellHeight + cellHeight / 2})`,
      );
    drawCountryChart(g, country, byCountry.get(country));
  });

  function drawLegend(g, r) {
    const legendRadialScale = radialScaleFor(r);
    const r0 = legendRadialScale(0);

    // Pillar sectors, centred on their indicators like the country sectors
    const pillarRanges = [
      { name: "Connectivity and infrastructure", commitments: [1, 2, 3], color: pillars[0] },
      { name: "Rights and freedoms", commitments: [4, 5, 6], color: pillars[1] },
      { name: "Responsibility and sustainability", commitments: [7, 8, 9], color: pillars[2] },
      { name: "Trust and resilience", commitments: [10, 11, 12], color: pillars[3] },
    ];

    pillarRanges.forEach((pillar, i) => {
      const startAngle = (pillar.commitments[0] - 1) * STEP - STEP / 2;
      const endAngle = (pillar.commitments[2] - 1) * STEP + STEP / 2;
      const color = fillScale.getColor(pillar.color);

      g.append("path")
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(r0)
            .outerRadius(legendRadialScale(100))
            .startAngle(startAngle)
            .endAngle(endAngle),
        )
        .attr("fill", color)
        .attr("fill-opacity", 0.1);

      // Boundary lines (line angles are rotated by -90° vs d3.arc)
      [startAngle, endAngle].forEach((angle) => {
        const a = angle - Math.PI / 2;
        g.append("line")
          .attr("x1", r0 * Math.cos(a))
          .attr("y1", r0 * Math.sin(a))
          .attr("x2", legendRadialScale(100) * Math.cos(a))
          .attr("y2", legendRadialScale(100) * Math.sin(a))
          .attr("stroke", color)
          .attr("stroke-width", isMobile ? 3 : 2);
      });

      const midAngle = (startAngle + endAngle) / 2 - Math.PI / 2;
      const labelRadius = r * 1.25;
      const labelPos = {
        x: labelRadius * Math.cos(midAngle),
        y: labelRadius * Math.sin(midAngle),
      };
      const text = g
        .append("text")
        .attr("x", labelPos.x)
        .attr("y", labelPos.y)
        .attr("text-anchor", i < 2 ? "start" : "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .attr("fill", color);
      wrapText(pillar.name, 18).forEach((line, j) => {
        text
          .append("tspan")
          .attr("x", labelPos.x)
          .attr("dy", j === 0 ? 0 : "1.1em")
          .text(line);
      });
    });

    // Reference circles
    RING_VALUES.forEach((val) => {
      g.append("circle")
        .attr("r", legendRadialScale(val))
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.3);
    });

    // Example total-score ring, as drawn in the country charts
    g.append("circle")
      .attr("r", legendRadialScale(65))
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 1);

    // Centre disc up to score 0
    g.append("circle")
      .attr("r", r0)
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);

    g.append("text")
      .attr("class", "chart-axistext")
      .attr("x", 0)
      .attr("y", legendRadialScale(65))
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "currentColor")
      .text("Total");

    // Tick labels at 0 and 100 only: the legend is drawn at half size and
    // style.css forces svg text to 16px, so intermediate ticks would overlap
    [0, 100].forEach((val) => {
      g.append("text")
        .attr("class", "chart-axistext")
        .attr("x", 0)
        .attr("y", -legendRadialScale(val) + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "currentColor")
        .text(val);
    });
  }

  function drawCountryChart(g, country, countryData) {
    const totalScore = drawCountryMarks(g, countryData, radialScale, {
      capThickness: 3,
    });

    // Country name (links to the country page) and total score above
    g.append("text")
      .attr("y", -radius - 25)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", "#000")
      .style("cursor", "pointer")
      .text(country)
      .on("click", () => {
        const iso3 = countryData[0]?.ISO3_CODE;
        if (iso3) window.location.href = `${basePath}/${iso3}/`;
      });

    const group = countryData[0]?.group || "";
    g.append("text")
      .attr("y", -radius - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .text(
        `${isNaN(totalScore) ? "Not enough data" : Math.floor(totalScore)} ${isNaN(totalScore) ? "" : `(${group})`}`,
      );
  }

  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  attachHover(
    svg,
    tooltip,
    (d) => `
      Score: <strong>${Math.floor(d.value)}</strong><br>
      ${d.commitment_txt_cardinal}<br>
    `,
  );

  return svg.node();
}

/**
 * Single country (successor of polarCountryD3)
 *
 * @param {Array} data - Full data (the latest year is used)
 * @param {string} country - Country to display (NAME_ENGL)
 * @param {Object} options - width, isMobile
 */
export function polarCountryBarsD3(data, country, options = {}) {
  const { width = 400 } = options;
  const height = width;
  ensureStyles();
  const fillScale = colorScales();

  const latestYear = d3.max(data, (d) => d.year);
  const countryData = data.filter(
    (d) => d.NAME_ENGL === country && d.year === latestYear,
  );

  if (countryData.length === 0) {
    const div = document.createElement("div");
    div.textContent = "No data available";
    div.style.padding = "20px";
    div.style.textAlign = "center";
    return div;
  }

  const radius = width * 0.425;
  const radialScale = radialScaleFor(radius);

  const svg = d3
    .create("svg")
    .attr("class", "polar-bars polar-bars-single")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  drawCountryMarks(g, countryData, radialScale, { capThickness: 4 });

  const tooltip = d3
    .select("body")
    .selectAll(".polar-country-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip polar-country-tooltip");

  attachHover(svg, tooltip, (d) => {
    const scoreColor = fillScale.getColor(d.pillar_txt);
    return `
      <strong style="font-size: 28px; font-weight: bold; color: ${scoreColor}; margin-bottom: 8px;">
      ${Math.floor(d.value)}</strong>
      <br>
      <span style="color: ${scoreColor};">${d.commitment_txt_cardinal}</span><br>
      ${d.pillar_txt}
    `;
  });

  return svg.node();
}
