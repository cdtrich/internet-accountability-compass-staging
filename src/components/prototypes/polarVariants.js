import * as d3 from "npm:d3";
import colorScales from "../scales.js";

/**
 * PROTOTYPE (proto/radial): radial chart mark variants for one country.
 * Static render only (no transitions), so variants differ by their marks.
 * Rings, total score, angle convention and tooltip follow polarCountryD3.js /
 * polarD3.js.
 *
 * Variants:
 *   current  stem + halo + dot (replica of today's lollipop)
 *   A        stem + thin arc cap at the value spanning the indicator's 30°
 *   B        one sector per indicator from the centre to the value (rose)
 *   C        low-opacity sector (as B) + full-opacity arc cap (as A)
 *
 * Sectors are centred on the stem angle: (i - 0.5) * 30° .. (i + 0.5) * 30°
 * for i = commitment_num_cardinal - 1 (d3.arc: 0 at 12 o'clock, clockwise).
 *
 * Linked brushing: hovering an indicator sets data-active="<n>" on the
 * closest [data-polar-brush] ancestor (or the chart's own svg) and CSS dims
 * every other indicator — no d3 transitions.
 *
 * @param {Array} data - dfiFull rows (any years; the latest year is used)
 * @param {string} country - NAME_ENGL
 * @param {Object} options
 *   variant: "current" | "A" | "B" | "C"
 *   radiusScale: "linear" | "sqrt"
 *   width: chart width = height in px
 *   isMobile: mobile mark sizes, as in polarD3
 */
export function polarVariant(
  data,
  country,
  { variant = "current", radiusScale = "linear", width = 400, isMobile = false } = {},
) {
  ensureStyles();
  const height = width;
  const fillScale = colorScales();

  const latestYear = d3.max(data, (d) => d.year);
  const countryData = data.filter(
    (d) => d.NAME_ENGL === country && d.year === latestYear,
  );

  // Geometry: the single-country chart (polarCountryD3) uses 0.425 of the
  // width; the small multiples (polarD3) use 0.35 of the cell
  const isThumb = width < 300;
  const radius = width * (isThumb ? 0.35 : 0.425);
  const radialScale = (radiusScale === "sqrt" ? d3.scaleSqrt() : d3.scaleLinear())
    .domain([0, 100])
    .range([0, radius]);

  const step = (2 * Math.PI) / 12;
  const angleOf = (d) => (d.commitment_num_cardinal - 1) * step;
  const polarToCartesian = (angle, r) => ({
    x: r * Math.cos(angle - Math.PI / 2),
    y: r * Math.sin(angle - Math.PI / 2),
  });

  // Mark sizes, as today (country page vs multiples, mobile)
  const stemWidth = isMobile ? 3 : 2;
  const dotRadius = isThumb ? (isMobile ? 6 : 4) : isMobile ? 6 : 8;
  const haloWidth = isThumb ? 1 : 12; // polarD3's halo width is commented out
  const capThickness = isThumb ? 3 : 4;
  const wedgeOpacity = 0.25;

  const svg = d3
    .create("svg")
    .attr("class", `polar-variant polar-variant-${variant}`)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Reference circles
  [100, 80, 60, 40, 20].forEach((val) => {
    g.append("circle")
      .attr("r", radialScale(val))
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);
  });

  const totalScore = countryData[0]?.total;
  const hasTotal = typeof totalScore === "number" && !isNaN(totalScore);
  const wedgeVariant = variant === "B" || variant === "C";

  // Total score: grey disc under the marks (current, A)
  if (hasTotal && !wedgeVariant) {
    g.append("circle")
      .attr("r", radialScale(totalScore))
      .attr("fill", "#000")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1);
  }

  const marks = g.append("g").attr("class", "polar-marks");

  const sectorArc = d3
    .arc()
    .innerRadius(0)
    .startAngle((d) => angleOf(d) - step / 2)
    .endAngle((d) => angleOf(d) + step / 2)
    .outerRadius((d) => radialScale(d.value));

  const capArc = d3
    .arc()
    .startAngle((d) => angleOf(d) - step / 2)
    .endAngle((d) => angleOf(d) + step / 2)
    .innerRadius((d) => Math.max(0, radialScale(d.value) - capThickness))
    .outerRadius((d) => radialScale(d.value));

  countryData
    .filter((d) => typeof d.value === "number" && !isNaN(d.value))
    .forEach((d) => {
      const color = fillScale.getColor(d.pillar_txt);
      const pos = polarToCartesian(angleOf(d), radialScale(d.value));
      // One group per indicator = the hover target
      const mark = marks
        .append("g")
        .attr("class", `polar-mark c-${d.commitment_num_cardinal}`)
        .datum(d);

      if (variant === "current" || variant === "A") {
        if (variant === "current") {
          mark
            .append("line")
            .attr("x2", pos.x)
            .attr("y2", pos.y)
            .attr("stroke", color)
            .attr("stroke-width", haloWidth)
            .attr("opacity", 0.1);
        }
        mark
          .append("line")
          .attr("x2", pos.x)
          .attr("y2", pos.y)
          .attr("stroke", color)
          .attr("stroke-width", stemWidth);
        if (variant === "current") {
          mark
            .append("circle")
            .attr("cx", pos.x)
            .attr("cy", pos.y)
            .attr("r", dotRadius)
            .attr("fill", color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        } else {
          mark.append("path").attr("d", capArc(d)).attr("fill", color);
        }
      } else {
        mark
          .append("path")
          .attr("d", sectorArc(d))
          .attr("fill", color)
          .attr("fill-opacity", variant === "C" ? wedgeOpacity : 1)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
        if (variant === "C") {
          mark.append("path").attr("d", capArc(d)).attr("fill", color);
        }
      }
    });

  // Total score: outline ring only on top of the wedges (B, C)
  if (hasTotal && wedgeVariant) {
    g.append("circle")
      .attr("r", radialScale(totalScore))
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 1)
      .style("pointer-events", "none");
  }

  // White centre dot — fixed at the linear position of 3 (3% of the radius),
  // so the sqrt scale does not blow it up into a large hole
  g.append("circle")
    .attr("r", radius * 0.03)
    .attr("fill", "#fff")
    .style("pointer-events", "none");

  // Hover: one delegated listener pair per chart
  const tooltip = d3
    .select("body")
    .selectAll(".polar-variant-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip polar-variant-tooltip");

  const brushRoot = () =>
    svg.node().closest("[data-polar-brush]") ?? svg.node();

  marks
    .on("pointerover", (event) => {
      const mark = event.target.closest(".polar-mark");
      if (!mark) return;
      const d = d3.select(mark).datum();
      brushRoot().dataset.active = d.commitment_num_cardinal;
      const scoreColor = fillScale.getColor(d.pillar_txt);
      tooltip.style("visibility", "visible").html(`
        <strong style="font-size: 28px; font-weight: bold; color: ${scoreColor}; margin-bottom: 8px;">
        ${Math.floor(d.value)}</strong>
        <br>
        <span style="color: ${scoreColor};">${d.commitment_txt_cardinal}</span><br>
        ${d.pillar_txt}
      `);
    })
    .on("pointermove", (event) => {
      tooltip
        .style("top", event.pageY - 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("pointerout", (event) => {
      const to = event.relatedTarget?.closest?.(".polar-mark");
      if (to && marks.node().contains(to)) return;
      delete brushRoot().dataset.active;
      tooltip.style("visibility", "hidden");
    });

  return svg.node();
}

// Brushing rules: dim every indicator except the active one, via CSS only
function ensureStyles() {
  if (document.getElementById("polar-variant-styles")) return;
  const rules = d3
    .range(1, 13)
    .map(
      (n) =>
        `[data-active="${n}"] .polar-mark:not(.c-${n}) { opacity: 0.2; }`,
    )
    .join("\n");
  const style = document.createElement("style");
  style.id = "polar-variant-styles";
  style.textContent = `.polar-mark { cursor: pointer; transition: opacity 150ms; }
${rules}`;
  document.head.appendChild(style);
}
