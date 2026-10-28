---
title: "Coutry overview"
---

<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="./modeToggle.css">
<!-- sidebar -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
<link rel="stylesheet" href="./sidebar.css" />
</head>

<!-- back to root button -->

<!-- <a href="../" class="back-to-root">
  <span class="arrow"></span>
</a> -->

<!-- import components -->

```js
import { colorScales } from "./components/scales.js";
// v3 polar bars; to switch back: import { polarD3 } from "./components/polarD3.js";
import { polarBarsD3 } from "./components/polarBarsD3.js";
import { heatmap } from "./components/heatmapD3.js";
import { sidebar } from "./components/sidebar.js";
import { sparklineTableD3 } from "./components/sparklineTableD3.js";
// import { toggleSwitch } from "./components/toggleSwitch.js";
import { modeToggle } from "./components/modeToggle.js";
```

<!-- data -->

```js
const dfiFull = FileAttachment("./data/dfiFull.csv").csv({ typed: true });
const dfiCardinal = FileAttachment("./data/dfiCardinal.csv").csv({
  typed: true,
});
```

```js
// check if viewed on mobile
const isMobile = window.innerWidth <= 768;
// const colors = ["#32baa7", "#0e4876", "#643291", "#962c8c"];
const sampleCommitments = dfiFull.filter((d) => d.NAME_ENGL === "Afghanistan");
```

<div class="hero">
  <h1>Country Insights</h1>
  <h2 class="subheader">Reviewing progress. Learning from others.</h2>
  <!-- <div id="hero-image"></div> -->
  <p style="margin-top: 4em;">Understanding how countries are implementing digital principles and commitments requires visibility into their policies, actions, and progress. The aim is not to rank or rate countries, but to offer a clear and accessible overview of national records across the four cardinal points of the Internet Accountability Compass: <b>connectivity and infrastructure</b>, <b>rights and freedoms</b>, <b>responsibility and sustainability</b>, and <b>trust and resilience</b>.
  </p>
  <p>This section provides a <b>country-by-country view</b> of how governments are translating digital commitments into action. The data presented here enables countries to reflect on their own progress—highlighting areas of strength, as well as opportunities for improvement. At the same time, it supports mutual learning by showing how other governments are approaching similar challenges. Whether looking within a region or across different governance models, this resource helps identify examples and good practices that may be relevant or inspiring in relation to fostering digital inclusion, safeguarding rights, strengthening trust, or advancing sustainable and responsible innovation.
</p>
  <p>By making information more accessible, the Compass aims to <b>promote transparency and encourage constructive dialogue</b> among policymakers, civil society, and international partners. The country overview provides information about how each country performs across all dimensions of the Compass.
</p>
  <p>The table view provides the overall score per individual dimension. A blank field for an individual country indicates that the data for one or more categories is missing. 
</p>
  <p>The Compass comprises 12 secondary indicators, grouped into the four directional categories.
</p>
<ol>
<li>The <b>Total Score</b> is calculated as the equally weighted average of all available indicators. Countries with data for fewer than 8 of the 12 indicators are excluded from total scoring.
</li>
<li>A <b>Directional Score</b> reflects the average of the three indicators within a given category. All 3 indicators are required for a directional score to be assigned.
</li>
<li><b>Partial Data</b> indicates that a country is missing one or more indicators in a given category. Countries with only partial data may be skewed and should be evaluated solely based on existing indicators.
</li>
</ol>

```js
// Create the toggle elements
const viewModeToggle = modeToggle({
  label1: "Latest",
  label2: "Historical",
  value1: "latest",
  value2: "historical",
  initial: "latest",
});

const chartTypeToggle = modeToggle({
  label1: "⎈ Compass",
  label2: "⊞ Heatmap",
  value1: "compass",
  value2: "heatmap",
  initial: "compass",
});

// Make them reactive
const viewMode = view(viewModeToggle);
const chartType = view(chartTypeToggle);
```

</div>

<!-- add total row to dfiCardinal -->

```js
// latest year
const latestYear = d3.max(dfiFull, (d) => d.year);

// Assuming `dfiCardinal` is your original array
const grouped = {};

// Group all entries by ISO3_CODE
dfiCardinal.forEach((d) => {
  if (!grouped[d.ISO3_CODE]) {
    grouped[d.ISO3_CODE] = [];
  }
  grouped[d.ISO3_CODE].push(d);
});

// Create new array with original data + total row per country
const dfiCardinalLong = [];

Object.values(grouped).forEach((entries) => {
  dfiCardinalLong.push(...entries);

  const first = entries[0];

  dfiCardinalLong.push({
    ...first,
    pillar_txt: "Total score",
    group_value: first.group,
    value: first.total,
  });
});
```

<!-- Render both switches -->
<div class="controls">
  ${viewModeToggle}
  ${viewMode === "latest" ? chartTypeToggle : ""}
</div>

```js
const chartView =
  viewMode === "latest" && chartType === "compass"
    ? html`<div class="figure-w-full">
        <div class="card">
          ${resize((width) =>
            polarBarsD3(
              dfiFull.filter((d) => d.year === latestYear),
              isMobile,
              { width },
            ),
          )}
        </div>
      </div>`
    : viewMode === "latest" && chartType === "heatmap"
      ? html`<div class="figure-w-full">
          <div class="card">
            ${resize((width) =>
              heatmap(
                dfiCardinalLong.filter((d) => d.year === latestYear),
                isMobile,
                { width },
              ),
            )}
          </div>
        </div>`
      : html`<div class="body-text">
          <div class="card">
            ${resize((width) =>
              sparklineTableD3(dfiCardinal, isMobile, {
                width,
              }),
            )}
          </div>
        </div>`;
```

<div>
  ${chartView}
</div>

<!-- sidebar -->

<div>
    ${sidebar()}
</div>
