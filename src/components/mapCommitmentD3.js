import * as d3 from "npm:d3";
import colorScales from "./scales.js";
import { basePath } from "./basePath.js";
import { legendGridSize, renderSwatchLegend } from "./mapLegend.js";
import {
  noData,
  decline,
  noChange,
  historicalOpacityFloor,
  ink,
  swatchOutline,
  formatChange,
} from "./tokens.js";

/**
 * D3 Map for Commitment-level data
 * Shows score gradient (0-100) for selected commitment or year-over-year change
 *
 * @param {Array} world - GeoJSON features
 * @param {Array} data - Data filtered to one pillar with commitment_txt_cardinal, value (ALL YEARS)
 * @param {string} selectedPillar - Selected pillar (for coloring)
 * @param {string} selectedCommitment - Selected commitment to display
 * @param {Object} options - width, height, mode ("latest" or "historical")
 */
export function mapCommitmentD3(
  world,
  coast,
  data,
  selectedPillar,
  selectedCommitment,
  options = {},
) {
  const { width = 975, mode = "latest" } = options;

  // Drop Antarctica — its extreme southern extent distorts the aspect ratio
  world = world.filter((f) => f.properties.ISO3_CODE !== "ATA");

  // Derive height from the world geo's natural aspect ratio at this width so
  // fitSize() fills the box exactly — a fixed height causes letterboxing
  // (empty bands above/below the map) whenever the box's aspect ratio
  // doesn't match the geo's
  const worldGeo = { type: "FeatureCollection", features: world };
  const probeProjection = d3.geoEqualEarth().fitWidth(width, worldGeo);
  const [[, probeY0], [, probeY1]] = d3
    .geoPath(probeProjection)
    .bounds(worldGeo);
  const height = probeY1 - probeY0;

  const fillScale = colorScales();
  const pillarColor = fillScale.getColor(selectedPillar);

  // Helper: Create inline sparkline for tooltip
  function createTooltipSparkline(
    data,
    isoCode,
    commitment,
    color,
    globalYearDomain,
  ) {
    const sparkW = 150;
    const sparkH = 60; // Increased for labels
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20; // Space for labels above points
    const marginBottom = 20; // Space for year labels below

    const countryData = data
      .filter(
        (d) =>
          d.ISO3_CODE === isoCode && d.commitment_txt_cardinal === commitment,
      )
      .filter((d) => d.value !== null && d.value !== "NA" && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);

    if (countryData.length === 0) return "";

    // Use global year domain for consistent x-axis
    const xScale = d3
      .scaleLinear()
      .domain(globalYearDomain)
      .range([marginLeft, sparkW - marginRight]);
    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([sparkH - marginBottom, marginTop]);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveCatmullRom);

    const area = d3
      .area()
      .x((d) => xScale(d.year))
      .y0(sparkH - marginBottom)
      .y1((d) => yScale(d.value))
      .curve(d3.curveCatmullRom);

    const svg = d3
      .create("svg")
      .attr("width", sparkW)
      .attr("height", sparkH)
      .attr("viewBox", [0, 0, sparkW, sparkH])
      .style("display", "block")
      .style("margin", "4px 0");

    // Area
    svg
      .append("path")
      .datum(countryData)
      .attr("d", area)
      .attr("fill", "#ccc")
      .attr("fill-opacity", 0.5)
      .attr("stroke", "none");

    // Line
    svg
      .append("path")
      .datum(countryData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2);

    // Dots with labels
    countryData.forEach((d, i) => {
      const isFirst = i === 0;
      const isLast = i === countryData.length - 1;

      svg
        .append("circle")
        .attr("cx", xScale(d.year))
        .attr("cy", yScale(d.value))
        .attr("r", 3)
        .attr("fill", color);

      // Value label above (all points)
      svg
        .append("text")
        .attr("class", "sparkline-text")
        .attr("x", xScale(d.year))
        .attr("y", yScale(d.value) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .attr("fill", ink)
        .text(`${Math.round(d.value)}`);

      // Year label below (only first and last)
      if (isFirst || isLast) {
        const shortYear = `'${String(d.year).slice(-2)}`;
        svg
          .append("text")
          .attr("class", "sparkline-text")
          .attr("x", xScale(d.year))
          .attr("y", sparkH - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .attr("fill", "#333")
          .text(shortYear);
      }
    });

    return svg.node().outerHTML;
  }

  // Calculate global year domain for consistent sparkline x-axis
  const allYears = data.map((d) => d.year).filter((y) => y != null);
  const globalYearDomain = d3.extent(allYears);

  // Get latest and previous year
  const latestYear = d3.max(data, (d) => d.year);
  const previousYear = latestYear - 1;

  // Opacity scale for historical mode
  const opacityScale = d3
    .scaleLinear()
    .domain([0, 20])
    .range([historicalOpacityFloor, 1])
    .clamp(true);

  // Change colors for historical mode
  const changeColors = {
    positive: pillarColor, // Pillar color for improvements
    negative: decline,
    zero: noChange,
  };

  let worldWithData;
  // Historical mode uses a discrete swatch legend (set below); latest mode
  // uses a gradient bar legend instead, so legendData stays undefined for it
  let legendData;

  if (mode === "historical") {
    // Historical mode: show year-over-year change
    const latestData = data.filter(
      (d) =>
        d.commitment_txt_cardinal === selectedCommitment &&
        d.year === latestYear,
    );
    const previousData = data.filter(
      (d) =>
        d.commitment_txt_cardinal === selectedCommitment &&
        d.year === previousYear,
    );

    const previousMap = new Map(
      previousData.map((item) => [item.ISO3_CODE, item.value]),
    );

    // Calculate changes
    const changesData = latestData.map((current) => {
      const prevValue = previousMap.get(current.ISO3_CODE);
      const change =
        prevValue && current.value !== "NA" && prevValue !== "NA"
          ? current.value - prevValue
          : null;

      return {
        ...current,
        change,
        previousValue: prevValue,
      };
    });

    const dataMap = new Map(changesData.map((item) => [item.ISO3_CODE, item]));
    worldWithData = world.map((feature) => {
      const matchingData = dataMap.get(feature.properties.ISO3_CODE);
      return matchingData
        ? { ...feature, properties: { ...feature.properties, ...matchingData } }
        : feature;
    });

    legendData = [
      { label: "▼ Decrease", color: changeColors.negative },
      { label: "No change", color: `${noChange}20` },
      { label: "▲ Increase", color: changeColors.positive },
      {
        label: "Not enough data",
        color: noData,
        pattern: "url(#white-diagonal-lines-commitment)",
      },
    ];
  } else {
    // Latest mode: show current scores
    const filteredData = data.filter(
      (d) =>
        d.commitment_txt_cardinal === selectedCommitment &&
        d.pillar_txt !== "Total score" &&
        d.year === latestYear,
    );

    // console.log(
    //   "India",
    //   data.filter((d) => d.ISO3_CODE === "IND"),
    // );
    // console.log(
    //   "Cuba",
    //   data.filter((d) => d.ISO3_CODE === "CUB"),
    // );

    const dataMap = new Map(filteredData.map((item) => [item.ISO3_CODE, item]));
    worldWithData = world.map((feature) => {
      const matchingData = dataMap.get(feature.properties.ISO3_CODE);
      return matchingData
        ? { ...feature, properties: { ...feature.properties, ...matchingData } }
        : feature;
    });
  }

  // Reserve space below the map for the legend — sized to whichever legend
  // layout this mode uses (historical: swatch grid; latest: gradient bar) so
  // it always has room regardless of mode or the map's aspect ratio
  const legendGrid =
    mode === "historical" ? legendGridSize(legendData.length) : null;
  const legendContentHeight =
    mode === "historical" ? legendGrid.height + 40 : 115;
  const legendAreaHeight = legendContentHeight + 40;
  const totalHeight = height + legendAreaHeight;

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", totalHeight)
    .attr("viewBox", [0, 0, width, totalHeight])
    .attr("style", "max-width: 100%; height: auto;");

  // Pattern for "not enough data" countries
  const defs = svg.append("defs");
  const nedPattern = defs
    .append("pattern")
    .attr("id", "white-diagonal-lines-commitment")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 4.2425)
    .attr("height", 4.2425)
    .attr("patternTransform", "rotate(-45)");
  nedPattern
    .append("rect")
    .attr("width", 4.2425)
    .attr("height", 4.2425)
    .attr("fill", "#fff");
  nedPattern
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1.5)
    .attr("height", 4.2425)
    .attr("fill", "#ddd");

  // Projection
  const projection = d3
    .geoEqualEarth()
    .fitSize([width, height], { type: "FeatureCollection", features: world });

  const ySouth = projection([0, -60])[1];
  projection.clipExtent([
    [0, 0],
    [width, ySouth],
  ]);

  const path = d3.geoPath(projection);

  // Color scale - gradient from light to pillar color
  const colorScale = d3
    .scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolate("#f0f0f0", pillarColor));

  // Zoom behavior - only zoom with Ctrl/Cmd + scroll
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) => {
      // Allow zoom with Ctrl/Cmd + wheel, or with buttons/touch
      if (event.type === "wheel") {
        return event.ctrlKey || event.metaKey;
      }
      return true; // Allow all other zoom triggers (drag, touch)
    })
    .on("zoom", (event) => {
      mapGroup.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Map group
  const mapGroup = svg.append("g").attr("class", "map-group");

  // Draw countries
  const countries = mapGroup
    .selectAll(".country")
    .data(worldWithData)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      if (mode === "historical") {
        if (d.properties.change === null || d.properties.change === undefined)
          return d.properties.value !== undefined ? noData : "#fff";
        const change = d.properties.change;
        if (change > 0) return changeColors.positive;
        if (change < 0) return changeColors.negative;
        return changeColors.zero;
      } else {
        if (d.properties.value !== undefined && isNaN(d.properties.value))
          return noData;
        if (d.properties.value === undefined) return "#fff";
        return colorScale(d.properties.value);
      }
    })
    .attr("fill-opacity", (d) => {
      if (
        mode === "historical" &&
        d.properties.change !== null &&
        d.properties.change !== undefined
      ) {
        return opacityScale(Math.abs(d.properties.change));
      }
      return 1;
    })
    .attr("stroke", (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"))
    .attr("stroke-width", 0.5)
    .style("cursor", (d) => (d.properties.ISO3_CODE ? "pointer" : "default"))
    .on("click", (event, d) => {
      if (d.properties.ISO3_CODE) {
        window.location.href = `${basePath}/${d.properties.ISO3_CODE}/`;
      }
    });

  // Draw coast
  if (coast) {
    mapGroup
      .append("path")
      .datum(coast)
      .attr("class", "coast")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.3);
  }

  // Not enough data overlay
  mapGroup
    .selectAll(".country-ned-overlay")
    .data(
      worldWithData.filter((d) =>
        mode === "latest"
          ? d.properties.value !== undefined && isNaN(d.properties.value)
          : d.properties.value !== undefined &&
            (d.properties.change === null || d.properties.change === undefined),
      ),
    )
    .join("path")
    .attr("class", "country-ned-overlay")
    .attr("d", path)
    .attr("fill", "url(#white-diagonal-lines-commitment)")
    .attr("stroke", "none")
    .style("pointer-events", "none");

  // Tooltip
  const tooltip = d3
    .select("body")
    .selectAll(".chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  // Hover behavior - snap to centroid
  // Hover behavior - snap to centroid
  countries
    .on("mouseenter touchstart", function (event, d) {
      // Only raise countries with data — no-data countries have an overlay path
      // that would be hidden if the country path is raised above it
      const isNoData =
        mode === "latest"
          ? d.properties.value !== undefined && isNaN(d.properties.value)
          : d.properties.value !== undefined &&
            (d.properties.change === null || d.properties.change === undefined);
      const sel = d3.select(this);
      if (!isNoData) sel.raise();
      sel
        .transition()
        .duration(150)
        .attr("stroke-width", 1)
        .attr("stroke", "#333");

      const centroid = path.centroid(d);
      const transform = d3.zoomTransform(svg.node());

      // Apply zoom transform to centroid
      const zoomedCentroid = [
        centroid[0] * transform.k + transform.x,
        centroid[1] * transform.k + transform.y,
      ];

      // Check if data is available
      const hasData =
        mode === "historical"
          ? d.properties.change !== null && d.properties.change !== undefined
          : !isNaN(d.properties.value);

      const partialNote =
        d.properties.note === " (partial data)" ? " (partial data)" : "";

      // Get color for sparkline based on mode
      let sparklineColor;
      if (mode === "historical" && hasData) {
        const change = d.properties.change;
        if (change > 0) sparklineColor = changeColors.positive;
        else if (change < 0) sparklineColor = changeColors.negative;
        else sparklineColor = changeColors.zero;
      } else {
        sparklineColor = pillarColor;
      }

      // Generate sparkline (both modes)
      const sparklineHTML = hasData
        ? createTooltipSparkline(
            data,
            d.properties.ISO3_CODE,
            selectedCommitment,
            sparklineColor,
            globalYearDomain,
          )
        : "";

      let tooltipContent;
      if (mode === "historical") {
        if (hasData) {
          const change = d.properties.change;
          tooltipContent = `<strong style="font-size: 20px; color: ${ink};">
            ${formatChange(change)}
          </strong><br>
          <strong>${d.properties.NAME_ENGL}</strong><br>
          <span style="font-size: 11px; color: #000;">Change in <br>${d.properties.commitment_txt_cardinal} score <br>(2024→2025)</span><br>
          ${sparklineHTML}`;
        } else {
          tooltipContent = `<strong>${d.properties.NAME_ENGL}</strong><br><span style="font-size: 11px; color: #666;">Not enough data</span>`;
        }
      } else {
        tooltipContent = hasData
          ? `<strong style="font-size: 42px; font-weight: bold; color: ${ink}; margin-top: 0px; margin-bottom: 8px;">
          ${Math.round(d.properties.value)}</strong> <strong>${d.properties.NAME_ENGL}</strong> (${d.properties.group_value})<br>
          ${partialNote}
          `
          : `<strong>${d.properties.NAME_ENGL}</strong><br><span style="font-size: 11px; color: #666;">Not enough data</span>`;
      }

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
    .on("mouseleave touchend", function () {
      // Reset stroke
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 0.5)
        .attr("stroke", (d) => (isNaN(d.properties.value) ? "#aaa" : "#fff"));

      tooltip.style("visibility", "hidden");
    });

  // Zoom controls (matching mapPillar position)
  const controlsGroup = svg
    .append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width / 8}, ${height - 130})`);

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
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  zoomInButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", pillarColor)
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
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  zoomOutButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 20)
    .attr("fill", pillarColor)
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
    .attr("stroke", pillarColor)
    .attr("stroke-width", 2);

  resetButton
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 14)
    .attr("fill", pillarColor)
    .text("⌂");

  // Legend
  const legendWidth = 200;
  const legendHeight = 15;

  // Legend — centered in the reserved area below the map (20px gap above);
  // each mode's legend block has a different width, so the group's x-position
  // is computed per-mode to keep the block centered under the map
  const legendBlockWidth =
    mode === "historical" ? legendGrid.width + 40 : legendWidth + 40;
  const legend = svg
    .append("g")
    .attr("class", "map-legend")
    .attr(
      "transform",
      `translate(${(width - legendBlockWidth) / 2 + 20}, ${height + 40})`,
    );

  if (mode === "historical") {
    // Historical mode: swatch grid legend (centered, wraps to two columns)
    const legendBg = legend
      .append("rect")
      .attr("class", "legend-background")
      .attr("x", -20)
      .attr("y", -20)
      .attr("width", legendGrid.width + 40)
      .attr("height", legendGrid.height + 40)
      .attr("fill", "#ffffff80")
      .attr("rx", 4);

    renderSwatchLegend(legend, legendData);
  } else {
    // Latest mode: gradient legend
    const legendBg = legend
      .append("rect")
      .attr("class", "legend-background")
      .attr("x", -20)
      .attr("y", -25)
      .attr("width", legendWidth + 40)
      .attr("height", 115)
      .attr("fill", "#ffffff80")
      .attr("rx", 4);

    // Create gradient
    const gradientId = `gradient-${selectedPillar.replace(/\s+/g, "-")}`;
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#f0f0f0");
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", pillarColor);

    // Gradient rect
    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", `url(#${gradientId})`)
      .attr("stroke", swatchOutline.stroke)
      .attr("stroke-width", swatchOutline.strokeWidth);

    // Legend labels
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 15)
      .attr("font-size", 12)
      .text("0");

    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .text("100");

    legend
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text("Score");

    const nedLegendLatest = legend
      .append("g")
      .attr("transform", "translate(0, 45)");
    nedLegendLatest
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", "#ddd");
    nedLegendLatest
      .append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", "url(#white-diagonal-lines-commitment)");
    nedLegendLatest
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .text("Not enough data");
  }

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
  bottom: 200px;
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

  // Wrap SVG in container
  const container = document.createElement("div");
  container.style.position = "relative";
  container.appendChild(svg.node());
  container.appendChild(overlayDiv);

  let overlayTimeout;

  // Show overlay on scroll without Ctrl/Cmd
  svg.on(
    "wheel",
    function (event) {
      if (!event.ctrlKey && !event.metaKey) {
        // Show overlay briefly (page will scroll normally)
        overlayDiv.style.display = "flex";
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(() => {
          overlayDiv.style.display = "none";
        }, 1200);
      }
    },
    { passive: true },
  ); // passive listener - doesn't block scrolling

  return container;
}
