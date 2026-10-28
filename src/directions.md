<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<!-- <link rel="stylesheet" href="./toggleSwitch.css"> -->
<link rel="stylesheet" href="./modeToggle.css">
<link rel="stylesheet" href="./custom-legend.css" />
</head>

<!-- back to root button -->

<!-- <a href="../" class="back-to-root">
  <span class="arrow"></span>
</a> -->

<!-- import components -->

```js
import colorScales from "./components/scales.js";
import { decline, noChange as noChangeColor, ink } from "./components/tokens.js";
import { onlyUnique } from "./components/onlyUnique.js";
import { customLegend, viewofCustomLegend } from "./components/customLegend.js";
import { renderPillarContent } from "./components/pillarRenderer.js";
import { sources } from "./components/sources.js";
import { viewofSourcesLegend } from "./components/sourcesLegend.js";
import { mapPillarD3 } from "./components/mapPillarD3.js";
import { mapCommitmentD3 } from "./components/mapCommitmentD3.js";
// import { toggleSwitch } from "./components/toggleSwitch.js";
import { modeToggle } from "./components/modeToggle.js";
```

<!-- hero -->

<div class="hero">
  <h1>Directions</h1>
  <h2 class="subheader">Helping countries stay on course.</h2>
  <!-- <div id="hero-image"></div> -->
</div>
<div class="body-text">
  <p>The Internet Accountability Compass offers more than a snapshot—it provides a sense of direction. Designed for governments and the wider multistakeholder community, the Compass supports accountability by <b>increasing transparency</b> around national policies and actions that shape the digital space. It is both a tool for assessment and a catalyst for progress.
  </p>
  <p>By illuminating where countries stand and how far they have come, the Compass seeks to <b>inspire ambition</b>, <b>encourage peer learning</b>, and <b>foster collective progress</b> toward a digital future that is open, inclusive, secure, and rights-respecting. The Compass is not prescriptive—it does not claim to be the only path forward. Instead, it offers one possible constellation of indicators and data points that reflect shared aspirations.
  </p>
    <p>To interpret this progress, the Compass uses four categories to describe each country's current trajectory:
    </p>
      <ol>
        <li><b>Off track:</b> The country's current efforts diverge from international principles and commitments. A strategic shift is needed to align with shared goals.</li>
        <li><b>Catching Up:</b> The country has taken steps to align with global objectives; foundations are forming, but progress is still limited or uneven.
        </li>
        <li><b>On Track:</b> The country's policies and actions are aligned with global objectives, showing steady and measurable advancement.
        </li>
        <li><b>Leading:</b> The country is not only on track but is setting a positive example—showing innovation, good practices, or leadership that others can learn from.
        </li>
      </ol>
</div>

<!-- data -->

```js
const dfiFullParse = FileAttachment("./data/dfiFull.csv").csv({ typed: true });
const dfiCardinalParse = FileAttachment("./data/dfiCardinal.csv").csv({
  typed: true,
});
const sourcesData = FileAttachment("./data/sources.csv").csv({
  typed: true,
});
1;
```

<!-- world map and data -->

```js
var worldLoad = FileAttachment("./data/CNTR_RG_20M_2024_4326.json").json();
var coastLoad = FileAttachment("./data/COAS_RG_20M_2016_4326.json").json();
```

```js
var world = topojson
  .feature(worldLoad, worldLoad.objects.CNTR_RG_20M_2024_4326)
  .features.filter((d) => d.properties.NAME_ENGL !== "Antarctica") // drop Antarctica directly
  .filter((d) => d.properties.SVRG_UN === "UN Member State") // only UN member states
  .map((d) => {
    // only keep these properties
    d.properties = {
      CNTR_ID: d.properties.CNTR_ID,
      ISO3_CODE: d.properties.ISO3_CODE,
      NAME_ENGL: d.properties.NAME_ENGL,
    };
    return d;
  });
var coast = topojson.feature(
  coastLoad,
  coastLoad.objects.COAS_RG_20M_2016_4326,
);
```

<!-- 1. input data -->

```js
const uniquePillars = [
  ...new Set(
    dfiCardinalParse
      .filter((d) => d.pillar_txt !== "Total score")
      .map((item) => item.pillar_txt),
  ),
];
// console.log(
//   "dfiCardinalParse",
//   dfiCardinalParse.filter((d) => d.NAME_ENGL === "Libya" && d.year === 2025),
// );
```

  <!-- 2. input  -->

```js
const filterLegend = (domain, range) => {
  const value = new Map(domain.map((d) => [d, true]));
  const _set = () =>
    Set(
      node,
      [...value].filter((d) => d[1]).map((d) => d[0]),
    );
  const oninput = (e) => (value.set(e.target.id, e.target.checked), _set());
  const node = htl.html`<div style="font-family: var(--sans-serif); font-size: 13px; display: flex; gap: 1em;">
    ${domain.map(
      (d, i) => htl.html`<div style="display: flex;">
      <input type="checkbox" id="${d}" name="${d}" checked style="accent-color: ${range[i]}" oninput=${oninput}>
      <label for="${d}">${d}</label>
    </div>`,
    )}
  </div>`;
  _set();
  return node;
};
```

<!-- Map toggle -->

```js
const mapMode = view(
  modeToggle({
    label1: "Latest",
    label2: "Historical",
    value1: "latest",
    value2: "historical",
    initial: "latest",
  }),
);
```

```js
// console.log("uniquePillars", uniquePillars);
const selectedPillar = view(
  viewofCustomLegend(
    uniquePillars,
    "Connectivity and infrastructure",
    "pillar",
  ),
);
```

<!-- key stats -->

```js
const latestYear = d3.max(dfiCardinalParse, (d) => d.year);
const previousYear = latestYear - 1;

// Create fillScale instance for color calculations
const fillScale = colorScales();

// Filter for current pillar and latest year
const currentData = dfiCardinalParse.filter(
  (d) => d.pillar_txt === selectedPillar && d.year === latestYear,
);

// Calculate stats based on mode
let statsData;
if (mapMode === "latest") {
  // Count by category
  const counts = d3.rollup(
    currentData,
    (v) => v.length,
    (d) => d.group_value,
  );

  statsData = [
    {
      label: "Off track",
      count: counts.get("Off track") || 0,
      color: fillScale.getOrdinalCategoryScale(selectedPillar)("Off track"),
    },
    {
      label: "Catching up",
      count: counts.get("Catching up") || 0,
      color: fillScale.getOrdinalCategoryScale(selectedPillar)("Catching up"),
    },
    {
      label: "On track",
      count: counts.get("On track") || 0,
      color: fillScale.getOrdinalCategoryScale(selectedPillar)("On track"),
    },
    {
      label: "Leading",
      count: counts.get("Leading") || 0,
      color: fillScale.getOrdinalCategoryScale(selectedPillar)("Leading"),
    },
  ];
} else {
  // Historical mode - calculate changes
  const prevData = dfiCardinalParse.filter(
    (d) => d.pillar_txt === selectedPillar && d.year === previousYear,
  );

  let increases = 0,
    decreases = 0,
    noChange = 0;

  currentData.forEach((curr) => {
    const prev = prevData.find((p) => p.ISO3_CODE === curr.ISO3_CODE);
    if (prev && Number.isFinite(curr.value) && Number.isFinite(prev.value)) {
      const change = curr.value - prev.value;
      if (change > 0) increases++;
      else if (change < 0) decreases++;
      else noChange++;
    }
  });

  const pillarColor = fillScale.getColor(selectedPillar, 100);

  statsData = [
    { label: "▼ Decrease", count: decreases, color: decline },
    { label: "No change", count: noChange, color: noChangeColor },
    { label: "▲ Increase", count: increases, color: pillarColor },
  ];
}
```

```js
const dfiFullFiltered = dfiFullParse.filter(
  (d) => d.pillar_txt === selectedPillar && d.pillar_txt !== "Total score",
);
```

```js
const commitments = [
  ...new Set(dfiFullFiltered.map((d) => d.commitment_txt_cardinal)),
];
```

<!-- key stats -->

```html
<div class="grid keystats-grid ${mapMode === 'latest' ? 'grid-cols-4' : 'grid-cols-3'}">
  ${statsData.map((stat) => html`
  <div class="card key">
    <span class="very-big" style="color: ${ink};">${stat.count}</span
    ><span style="color: ${ink};">countries</span>
    <h2><span style="display: inline-block; width: 0.8em; height: 0.8em; margin-right: 0.35em; vertical-align: -0.05em; background: ${stat.color}; border: 0.5px solid ${ink};"></span>${stat.label}</h2>
  </div>
  `)}
</div>
```

<!-- Pillar map (replace existing mapPillar) -->
<div class="figure-w-full">
  ${resize((width) =>
    mapPillarD3(
      world,
      coast,
      dfiCardinalParse,
      selectedPillar,
      { width, enableScrollZoom: true, mode: mapMode }
    )
  )}
</div>

<!-- CONDITIONAL BODY TEXT PER PILLAR -->

```js
renderPillarContent(selectedPillar);
```

<div id="pillar-content"></div>

<!-- CONDITIONAL COMMITMENT MAPS PER PILLAR -->

```js
// pass selected pillar for coloring
const commitmentLegend = view(
  viewofCustomLegend(commitments, commitments[0], "commitment", selectedPillar),
);
// console.log("commitments", commitments);
// console.log("dfiFullFiltered", dfiFullFiltered);
```

<div class="figure-w-full">
  ${resize((width) =>
    mapCommitmentD3(
      world,
      coast,
      dfiFullParse.filter(d => d.pillar_txt === selectedPillar),
      selectedPillar,
      commitmentLegend,
      { width, enableScrollZoom: true, mode: mapMode }
    )
  )}
</div>

<!-- sources section -->

<div class="body-text">
  <h2>Resources</h2>
</div>

<div class="body-text body-input">

```js
const selectSourceType = view(viewofSourcesLegend("Analysis"));
```

```js
const sourceCountryUnique = [...new Set(sourcesData.map((d) => d.NAME_ENGL))];
const selectSourceCountry = view(
  Inputs.search(sourceCountryUnique, {
    value: "",
    datalist: sourceCountryUnique,
    placeholder: "Search countries",
    output: null,
  }),
);
```

</div>

```js
// remove duplicate sources
const sourcesDataUnique = sourcesData.filter(
  (d, index, self) =>
    index ===
    self.findIndex(
      (item) => item.NAME_ENGL === d.NAME_ENGL && (item.url || `${item.title}|${item.publisher}`) === (d.url || `${d.title}|${d.publisher}`),
    ),
);
// filter by pillar
const sourcesDataPillar = sourcesDataUnique.filter(
  (d) => d.pillar_txt === selectedPillar,
);
// filter by input
const sourcesDataFiltered = sourcesDataPillar.filter((d) => {
  const normalizedType = d.type.replace(/^[⌕¶⚑]\s*/, "");
  const typeMatch = normalizedType === selectSourceType;
  const countryMatch =
    !selectSourceCountry ||
    selectSourceCountry.length === 0 ||
    selectSourceCountry.includes(d.NAME_ENGL);
  return typeMatch && countryMatch;
});

sources(sourcesDataFiltered);
```

<div class="body-text">
  <div id="sources-section"></div>
</div>

