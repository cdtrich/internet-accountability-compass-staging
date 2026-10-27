import * as d3 from "npm:d3";
import {
  binLabels,
  binColors,
  bandMidpoints,
  noData,
  historicalOpacityFloor,
  changeDomainMax,
} from "./tokens.js";

const colorScales = () => {
  // Discrete (Categorical) Color Scale
  const colorScale = d3
    .scaleOrdinal()
    .domain([
      "Connectivity and infrastructure",
      "Rights and freedoms",
      "Responsibility and sustainability",
      "Trust and resilience",
      "Total",
    ])
    .range(["#962c8c", "#643291", "#034ea2", "#3c4099", "#007162ff"]);

  // Function to get the sequential scale
  const getSequentialScale = (category) => {
    const colorMap = {
      "Connectivity and infrastructure": "#962c8c",
      "Rights and freedoms": "#643291",
      "Responsibility and sustainability": "#034ea2",
      "Trust and resilience": "#3c4099",
      "Total score": "#000",
    };
    const lowestMap = {
      "Connectivity and infrastructure": "#f3e6f1", // 20% tint https://chatgpt.com/share/e/680d362f-646c-800a-962a-29844656f32b
      "Rights and freedoms": "#f1eaf7",
      "Responsibility and sustainability": "#e6eef7",
      "Trust and resilience": "#e7e8f5",
      "Total score": "#FDE74C",
    };
    return d3.scaleSequential(
      d3.interpolateRgb(lowestMap[category], colorMap[category])
    );
  };

  // Ordinal score-bin scale: the four fixed bin colours from tokens.js in
  // both Total and pillar mode. `category` is still accepted so existing
  // callers keep working, but it no longer changes the colours.
  const getOrdinalCategoryScale = (_category) =>
    d3.scaleOrdinal().domain(binLabels).range(binColors).unknown(noData);

  // Continuous version of the bin ramp for 0-100 scores: the bin colours sit
  // at the band midpoints and blend in Lab space between them
  const getContinuousBinScale = () =>
    d3
      .scaleLinear()
      .domain(bandMidpoints)
      .range(binColors)
      .interpolate(d3.interpolateLab)
      .clamp(true);

  // Shared fill-opacity for historical (year-over-year) maps: symlog on
  // |change| from the floor up to changeDomainMax. No change (0) stays fully
  // opaque, since it is drawn in its own neutral colour rather than faded.
  const changeOpacityScale = d3
    .scaleSymlog()
    .domain([0, changeDomainMax])
    .range([historicalOpacityFloor, 1])
    .clamp(true);
  const changeOpacity = (change) =>
    change === 0 ? 1 : changeOpacityScale(Math.abs(change));

  // Function to get the correct color
  const getColor = (category, value) => {
    if (value !== undefined) {
      return getSequentialScale(category)(value / 100); // Normalize 0-100
    }
    return colorScale(category);
  };

  return {
    getColor,
    getSequentialScale,
    getOrdinalCategoryScale,
    getContinuousBinScale,
    changeOpacity,
  };
};

// Export the component
export default colorScales;
