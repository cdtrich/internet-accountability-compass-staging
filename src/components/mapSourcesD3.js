import * as d3 from "npm:d3";

/**
 * D3 Map for Sources/Resources
 * Shows countries with resources, click to filter cards below
 *
 * @param {Array} world - GeoJSON features
 * @param {Array} coast - Coast features (optional)
 * @param {Array} sourcesData - Full sources data with type, NAME_ENGL, ISO3_CODE
 * @param {Object} options - width, height
 */
export function mapSourcesD3(world, coast, sourcesData, options = {}) {
  const {
    width = 975,
    height = 610,
    selectedType = "Analysis",
    typeColor = "#007162",
    initialCountry = null,
  } = options;

  const baseType = selectedType;

  // Count resources by type per country
  const resourceCounts = {};
  sourcesData.forEach((d) => {
    const iso = d.ISO3_CODE;
    if (!resourceCounts[iso]) {
      resourceCounts[iso] = {
        NAME_ENGL: d.NAME_ENGL,
        Analysis: 0,
        Source: 0,
        Project: 0,
        Academic: 0,
        total: 0,
      };
    }
    if (resourceCounts[iso].hasOwnProperty(d.type)) {
      resourceCounts[iso][d.type]++;
      resourceCounts[iso].total++;
    }
  });

  // Countries that have data for the selected type
  const countriesWithResources = Object.keys(resourceCounts).filter(
    (iso) => resourceCounts[iso][baseType] > 0,
  );

  // Merge world data with resource counts
  const worldWithData = world.map((feature) => {
    const counts = resourceCounts[feature.properties.ISO3_CODE];
    return counts
      ? { ...feature, properties: { ...feature.properties, ...counts } }
      : feature;
  });

  // Create container div for SVG + overlay
  const container = document.createElement("div");
  container.style.position = "relative";

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Projection
  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height], { type: "FeatureCollection", features: world });

  const path = d3.geoPath(projection);

  // Map group (for zoom transforms)
  const mapGroup = svg.append("g").attr("class", "map-group");

  // Zoom behavior - only zoom with Ctrl/Cmd + scroll
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) => {
      if (event.type === "wheel") {
        return event.ctrlKey || event.metaKey;
      }
      return true; // Allow drag/touch
    })
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Coastlines (if provided)
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

  // State for selected country
  let selectedCountry = initialCountry;

  // Background rectangle to capture clicks on empty space
  mapGroup
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "default")
    .on("click", function () {
      selectedCountry = null;
      updateStyles();
      window.dispatchEvent(
        new CustomEvent("map-country-selected", { detail: null }),
      );
    });

  // Draw countries
  const countries = mapGroup
    .selectAll(".country")
    .data(worldWithData)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", (d) =>
      countriesWithResources.includes(d.properties.ISO3_CODE)
        ? typeColor
        : "#eee",
    )
    .attr("stroke", "#eee")
    .attr("stroke-width", 0.5)
    .attr("opacity", 1)
    .style("cursor", (d) =>
      countriesWithResources.includes(d.properties.ISO3_CODE)
        ? "pointer"
        : "default",
    )
    .on("click", function (event, d) {
      if (countriesWithResources.includes(d.properties.ISO3_CODE)) {
        event.stopPropagation();
        selectedCountry = d.properties.NAME_ENGL;
        updateStyles();
        window.dispatchEvent(
          new CustomEvent("map-country-selected", { detail: selectedCountry }),
        );
      }
    });

  // Highlighting logic
  function updateStyles() {
    countries
      .transition()
      .duration(200)
      .attr("opacity", (d) =>
        !selectedCountry || d.properties.NAME_ENGL === selectedCountry
          ? 1
          : 0.2,
      )
      .attr("stroke", (d) =>
        d.properties.NAME_ENGL === selectedCountry ? "#333" : "#eee",
      )
      .attr("stroke-width", (d) =>
        d.properties.NAME_ENGL === selectedCountry ? 2 : 0.5,
      );
  }

  // Apply initial country selection immediately (e.g. when type switches mid-selection)
  if (selectedCountry) updateStyles();

  // External selection (from map click in other re-renders or future clicks)
  window.addEventListener("map-country-selected", (e) => {
    selectedCountry = e.detail;
    updateStyles();
  });

  // Tooltip (HTML-based, matching other maps)
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Hover behavior - snap to centroid
  countries
    .on("mouseenter touchstart", function (event, d) {
      // Only show tooltip for countries with resources
      if (!countriesWithResources.includes(d.properties.ISO3_CODE)) {
        return;
      }

      // Raise to top and highlight stroke
      d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("stroke-width", 2)
        .attr("stroke", "#333");

      const centroid = path.centroid(d);
      const transform = d3.zoomTransform(svg.node());

      // Apply zoom transform to centroid
      const zoomedCentroid = [
        centroid[0] * transform.k + transform.x,
        centroid[1] * transform.k + transform.y,
      ];

      // Build tooltip content
      const counts = d.properties;
      const tooltipContent = `
        <strong class="tooltip-title">${counts.NAME_ENGL}</strong><br>
        ${selectedType}: ${counts[baseType] || 0}
      `;

      tooltip.style("visibility", "visible").html(tooltipContent);

      // Position at centroid
      const svgRect = svg.node().getBoundingClientRect();
      tooltip
        .style(
          "top",
          svgRect.top + zoomedCentroid[1] + window.scrollY - 10 + "px",
        )
        .style(
          "left",
          svgRect.left + zoomedCentroid[0] + window.scrollX + 10 + "px",
        );
    })
    .on("mouseleave touchend", function (event, d) {
      // Reset stroke if not selected
      if (d.properties.NAME_ENGL !== selectedCountry) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("stroke-width", 0.5)
          .attr("stroke", "#eee");
      }

      tooltip.style("visibility", "hidden");
    });

  // Zoom controls
  const controlsGroup = svg
    .append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 50}, ${height - 200})`);

  const controlColor = typeColor;

  // Zoom in button
  const zoomInButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button zoom-button-in")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    });

  zoomInButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", controlColor)
    .attr("stroke-width", 2);

  zoomInButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", controlColor)
    .attr("font-weight", "bold")
    .text("+");

  // Zoom out button
  const zoomOutButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button zoom-button-out")
    .attr("transform", "translate(0, 50)")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    });

  zoomOutButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", controlColor)
    .attr("stroke-width", 2);

  zoomOutButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", controlColor)
    .attr("font-weight", "bold")
    .text("−");

  // Reset zoom button
  const resetButton = controlsGroup
    .append("g")
    .attr("class", "zoom-button zoom-button-reset")
    .attr("transform", "translate(0, 100)")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });

  resetButton
    .append("circle")
    .attr("r", 20)
    .attr("fill", "white")
    .attr("stroke", controlColor)
    .attr("stroke-width", 2);

  resetButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 14)
    .attr("fill", controlColor)
    .text("⌂");

  // Scroll hint overlay - small box at bottom
  const overlayDiv = document.createElement("div");
  overlayDiv.className = "map-scroll-overlay";
  overlayDiv.innerHTML = `
  <div class="map-scroll-message">
    <span>Use ${navigator.platform.includes("Mac") ? "⌘" : "Ctrl"} + scroll to zoom</span>
  </div>
`;
  overlayDiv.style.cssText = `
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: none;
  pointer-events: none;
  z-index: 10;
`;

  const messageDiv = overlayDiv.querySelector(".map-scroll-message");
  messageDiv.style.cssText = `
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-size: 12px;
  font-weight: 500;
  color: #666;
  border: 1px solid #ddd;
`;

  // Append to container
  container.appendChild(svg.node());
  container.appendChild(overlayDiv);

  let overlayTimeout;

  // Show overlay on scroll without Ctrl/Cmd
  svg.on(
    "wheel",
    function (event) {
      if (!event.ctrlKey && !event.metaKey) {
        overlayDiv.style.display = "flex";
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
          overlayDiv.style.display = "none";
        }, 1200);
      }
    },
    { passive: true },
  );

  return container;
}
