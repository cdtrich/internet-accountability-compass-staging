import * as d3 from "npm:d3";
import { tooltipHTML } from "./tooltipHTML.js";

const ACCENT = "#007162";
const IDLE_FILL = "#eee";

/**
 * D3 map used as a filter for the Resources table.
 * Built once; the page drives it through container.update(...).
 *
 * @param {Array}  world   GeoJSON features (need properties.ISO3_CODE, NAME_ENGL)
 * @param {Object} coast   Coast FeatureCollection (optional)
 * @param {Object} options width/height (viewBox units), onSelect(iso3 | null)
 *
 * container.update({ counts, color, selected })
 *   counts:   Map ISO3 -> number of resources matching the current filters
 *   color:    fill for countries in `counts`
 *   selected: ISO3 currently chosen in the country dropdown, or null
 */
export function mapSourcesD3(world, coast, options = {}) {
  const { width = 975, height = 500, onSelect = () => {} } = options;

  let counts = new Map();
  let fill = ACCENT;
  let selected = null;

  const iso = (d) => d.properties.ISO3_CODE;
  const isActive = (d) => counts.has(iso(d));
  const strokeColor = (d) => (iso(d) === selected ? "#333" : "#eee");
  const strokeWidth = (d) => (iso(d) === selected ? 2 : 0.5);
  const opacity = (d) => (!selected || iso(d) === selected ? 1 : 0.2);

  const container = document.createElement("div");
  container.style.position = "relative";

  // Scales with the container via viewBox, so no resize() / re-render needed
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr(
      "aria-label",
      "World map of countries with resources. Click a country to filter the table.",
    )
    .style("width", "100%")
    .style("height", "auto")
    .style("display", "block");

  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height], { type: "FeatureCollection", features: world });
  const path = d3.geoPath(projection);

  const mapGroup = svg.append("g").attr("class", "map-group");

  // Zoom only with Ctrl/Cmd + scroll; drag and touch always allowed
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) =>
      event.type === "wheel" ? event.ctrlKey || event.metaKey : true,
    )
    .on("zoom", (event) => mapGroup.attr("transform", event.transform));
  svg.call(zoom);

  if (coast) {
    mapGroup
      .append("g")
      .selectAll("path")
      .data(coast.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5)
      .style("pointer-events", "none");
  }

  // Click on empty space clears the country filter
  mapGroup
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("click", () => onSelect(null));

  const countries = mapGroup
    .selectAll(".country")
    .data(world)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", IDLE_FILL)
    .attr("stroke", "#eee")
    .attr("stroke-width", 0.5)
    .on("click", (event, d) => {
      if (!isActive(d)) return;
      event.stopPropagation();
      onSelect(iso(d) === selected ? null : iso(d)); // click again to clear
    });

  function paint() {
    countries
      .attr("fill", (d) => (isActive(d) ? fill : IDLE_FILL))
      .style("cursor", (d) => (isActive(d) ? "pointer" : "default"));
    countries
      .transition()
      .duration(200)
      .attr("opacity", opacity)
      .attr("stroke", strokeColor)
      .attr("stroke-width", strokeWidth);
    countries.filter((d) => iso(d) === selected).raise();
  }

  // Tooltip (shared HTML tooltip, same as the other maps)
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  countries
    .on("mouseenter touchstart", function (event, d) {
      if (!isActive(d)) return;

      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 2)
        .attr("stroke", "#333");

      const [cx, cy] = path.centroid(d);
      const t = d3.zoomTransform(svg.node());
      const rect = svg.node().getBoundingClientRect();
      const k = rect.width / width; // viewBox units -> screen pixels
      const n = counts.get(iso(d));

      tooltip
        .style("visibility", "visible")
        .html(
          tooltipHTML({
            title: d.properties.NAME_ENGL,
            context: [`${n} resource${n === 1 ? "" : "s"}`],
          }),
        )
        .style("top", rect.top + (cy * t.k + t.y) * k + window.scrollY - 10 + "px")
        .style("left", rect.left + (cx * t.k + t.x) * k + window.scrollX + 10 + "px");
    })
    .on("mouseleave touchend", function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", strokeWidth(d))
        .attr("stroke", strokeColor(d));
      tooltip.style("visibility", "hidden");
    });

  // Zoom buttons: real HTML buttons at a fixed pixel size, so they stay
  // tappable when the map scales down inside a narrow iframe
  const controls = document.createElement("div");
  controls.style.cssText =
    "position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:6px;";

  const button = (label, text, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.textContent = text;
    b.style.cssText =
      "width:36px;height:36px;padding:0;border-radius:50%;border:2px solid " +
      ACCENT +
      ";background:#fff;color:" +
      ACCENT +
      ";font-family:inherit;font-size:18px;font-weight:700;line-height:1;cursor:pointer;";
    b.addEventListener("click", onClick);
    return b;
  };

  controls.append(
    button("Zoom in", "+", () =>
      svg.transition().duration(300).call(zoom.scaleBy, 1.5),
    ),
    button("Zoom out", "\u2212", () =>
      svg.transition().duration(300).call(zoom.scaleBy, 0.67),
    ),
    button("Reset zoom", "\u2302", () =>
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity),
    ),
  );

  // Scroll hint, shown briefly when scrolling over the map without Ctrl/Cmd
  const hint = document.createElement("div");
  hint.className = "map-scroll-overlay";
  hint.innerHTML = `<div class="map-scroll-message"><span>Use ${
    navigator.platform.includes("Mac") ? "\u2318" : "Ctrl"
  } + scroll to zoom</span></div>`;
  hint.style.cssText =
    "position:absolute;left:50%;bottom:20px;transform:translateX(-50%);display:none;pointer-events:none;z-index:10;";

  let hintTimeout;
  svg.on(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        hint.style.display = "flex";
        clearTimeout(hintTimeout);
        hintTimeout = setTimeout(() => (hint.style.display = "none"), 1200);
      }
    },
    { passive: true },
  );

  container.append(svg.node(), controls, hint);

  container.update = ({ counts: c, color, selected: s } = {}) => {
    counts = c ?? new Map();
    fill = color ?? ACCENT;
    selected = s ?? null;
    paint();
  };
  container.update();

  return container;
}
