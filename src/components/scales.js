import * as d3 from "npm:d3";
import { binLabels, binColors, noData } from "./tokens.js";

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
  };
};

// Export the component
export default colorScales;
