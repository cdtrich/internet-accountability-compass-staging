<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<!-- <link rel="stylesheet" href="./toggleSwitch.css"> -->
<link rel="stylesheet" href="./modeToggle.css">
</head>

<!-- import components -->

```js
import colorScales from "./components/scales.js";
import { bins, decline, noChange as noChangeColor, ink } from "./components/tokens.js";
import { mapTotalD3 } from "./components/mapTotalD3.js";
import { featuredPreview } from "./components/featuredPreview.js";
// import { toggleSwitch } from "./components/toggleSwitch.js";
import { modeToggle } from "./components/modeToggle.js";
```

<!-- hero -->

<div class="hero">
  <h1>Internet <br>Accountability <br>Compass</h1>
  <h2 class="subheader">Monitoring progress.<br>Guiding policy.<br>Strengthening accountability.</h2>
</div>

<div class="body-text">

<p style="font-size: 1.1em !important">
The Internet Accountability Compass is an <b>interactive tool</b> to promote greater transparency, strengthen public accountability, and empower policymakers, businesses, and civil society to align their actions with aspirations in the digital domain. The inaugural version of the Compass features global and country-specific insights, thematic overviews, and additional resources.
</p>

<p style="font-size: 1.1em !important">
The Compass is not a definitive answer to the challenge of accountability. Rather, it is one of many possible constellations of indicators and data points. Its purpose is to spark dialogue—about what matters, how progress should be measured, and how countries can hold themselves and each other accountable across <a href="./directions">four core dimensions</a>: connectivity and infrastructure, rights and freedoms,responsibility and sustainability, and trust and resilience.
</p>

<p style="font-size: 1.1em !important">
The toggle between latest and historical data switches between the current state of play and how each country's overall performance has changed since the previous year's data.</p>

<div class="desktop-notice" id="notice">
  Desktop recommended for full interactivity
  <button onclick="document.getElementById('notice').style.display='none'" style="margin-left: 10px; cursor: pointer;">×</button>
</div>
</div>

<!-- key stats -->

<!--
<div class="body-text">
<div class="grid grid-cols-3">
  <div class="card key keystats">
    <h2>Datapoints</h2>
    <span class="big">${dfiFull.length.toLocaleString("en-US")}</span>
  </div>
  <div class="card key">
    <h2>Countries</h2>
    <span class="big">${new Set(dfiFull.filter(d => d.commitment_num === 1).map(d => d.NAME_ENGL)).size.toLocaleString("en-US")}</span>
  </div>
  <div class="card key">
    <h2>Indicators</h2>
    <span class="big">12</span>
  </div>
</div>
<p style="font-weight: 700;"><a href="./countries.html">Go to country overview →</a></p>
</div>
 -->
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

<!-- key stats -->

```js
// console.log("dfiCardinal", dfiCardinal);
// Key stats for Total Score
const latestYear = d3.max(dfiCardinal, (d) => d.year);
const previousYear = latestYear - 1;
// console.log("latestYear", latestYear);

// Create fillScale instance for color calculations
const fillScale = colorScales();

// Filter for Total score and latest year
const currentData = dfiCardinal.filter(
  (d) => d.year === latestYear && d.pillar_txt === "Total score",
);
// console.log("currentData", currentData);

// Calculate stats based on mode
let statsData;
if (mapMode === "latest") {
  // Count by category for Total score
  const counts = d3.rollup(
    currentData,
    (v) => v.length,
    (d) => d.group_value,
  );

  statsData = [
    {
      label: "Off track",
      count: counts.get("Off track") || 0,
      color: fillScale.getOrdinalCategoryScale("Total score")("Off track"),
    },
    {
      label: "Catching up",
      count: counts.get("Catching up") || 0,
      color: fillScale.getOrdinalCategoryScale("Total score")("Catching up"),
    },
    {
      label: "On track",
      count: counts.get("On track") || 0,
      color: fillScale.getOrdinalCategoryScale("Total score")("On track"),
    },
    {
      label: "Leading",
      count: counts.get("Leading") || 0,
      color: fillScale.getOrdinalCategoryScale("Total score")("Leading"),
    },
  ];
} else {
  // Historical mode - calculate changes for total score
  const prevData = dfiCardinal.filter(
    (d) => d.year === previousYear && d.pillar_txt === "Total score",
  );

  // console.log("prevData", prevData);

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

  const totalColor = fillScale.getColor("Total score", 100);

  statsData = [
    { label: "▼ Decrease", count: decreases, color: decline },
    { label: "No change", count: noChange, color: noChangeColor },
    { label: "▲ Increase", count: increases, color: bins.leading },
  ];
}
```

<!-- key stats -->

```html
<div class="body-text">
  <div
    class="grid keystats-grid ${mapMode === 'latest' ? 'grid-cols-4' : 'grid-cols-3'}"
  >
    ${statsData.map((stat) => html`
    <div class="card key">
      <span class="very-big" style="color: ${ink};">${stat.count}</span
      ><span style="color: ${ink};">countries</span>
      <h2><span style="display: inline-block; width: 0.8em; height: 0.8em; margin-right: 0.35em; vertical-align: -0.05em; background: ${stat.color}; border: 0.5px solid ${ink};"></span>${stat.label}</h2>
    </div>
    `)}
  </div>
</div>
```

<!-- Total score map -->
<div class="figure-w-full">
  ${resize((width) =>
    mapTotalD3(
      world,
      coast,
      dfiCardinal,
      { width, mode: mapMode }
    )
  )}
</div>

<!-- body text -->
<div class="body-text">

<p> </p>
<p> </p>

<h2>Featured posts and perspectives</h2>
  ${featuredPreview()}

<h2>What does the compass show?</h2>

<p>The Compass translates broad commitments into <a href="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://raw.githubusercontent.com/cdtrich/dfi/b76f824bb5009098599dd71e1cd206d73f9d61fa/src/data/sources/Methodological%20Note%201.pdf" target="_blank"> measurable national and regional performance</a>, showing not only where practices align with promises, but also how the commitments themselves give shape to the digital landscape.</p>

<p>
The Internet Accountability Compass is not an audit mechanism or compliance checklist. It serves as a reference tool for governments, researchers, and civil society to assess national progress, identify trends, and learn from comparative practice. It is intended to bridge the gap between high-level digital commitments and their implementation—contributing to a more inclusive, rights-based, and accountable digital future.
</p>
<p>
By charting national performance across <a href="./directions">four cardinal dimensions</a> — Connectivity and infrastructure, Rights and
freedoms, Responsibility and sustainability, and Trust and resilience — the Compass produces an Internet Accountability Score (IAS) for each country, aggregating performance across all four dimensions into a single comparable figure. For a full explanation of how the IAS is calculated, see our <a href="./methodology">methodology</a>.
</p>
<p>
The Compass now incorporates available historical data spanning 2020 to 2025,
extending its utility beyond a single-year snapshot of national performance. This
longitudinal coverage allows governments, researchers, and civil society to track
how countries have progressed or regressed across the four cardinal dimensions
over time. Historical context also provides a more grounded basis for interpreting current scores, situating each country's present standing within its own trajectory of change.
</p>

<h2>Why the Compass?</h2>
<p>
The Internet is a cornerstone of modern life—shaping how states govern, businesses operate, organisations function, and individuals connect. Recognising its transformative power, the international community has rallied around shared principles to foster a global, open, free, secure, and trustworthy Internet. These principles are enshrined in key political declarations, including the <a href="https://www.un.org/digital-emerging-technologies/global-digital-compact" target="_blank">
Global Digital Compact</a>, the <a href="https://publicadministration.desa.un.org/intergovernmental-support/wsis" target="_blank">World Summit on the Information Society</a> and the <a href="https://digital-strategy.ec.europa.eu/en/library/declaration-future-internet" target="_blank">Declaration on the Future of the Internet</a>.
</p>

<p>
Yet, despite widespread consensus on these goals, progress toward their realisation remains uneven and often untracked.
</p>

<p>
The <b>Internet Accountability Compass</b> is designed to fill this gap. It serves as a reference point to assess how countries are advancing from high-level commitments to tangible implementation. By charting national performance across four cardinal dimensions—connectivity and infrastructure, rights and freedoms, responsibility and sustainability, and trust and resilience—the Compass contributed to bringing clarity to the state of Internet governance worldwide.
</p>

<p>
Through rigorous, country-specific data and comparative indicators, the Internet Accountability Compass promotes greater transparency, strengthens public accountability, and empowers policymakers, businesses, and civil society to align action with aspiration.
</p>
  
<!-- funding reference -->
<h2>Team behind the Compass</h2>
<p>
The Compass was developed by the <a href="https://globalgovernanceprogramme.eui.eu/gifi/" target="_blank">Global Initiative on the Future of the Internet</a> at the European University Institute. Dr Patryk Pawlak and Nils Berglund are responsible for the concept, data collection and development of the Compass. The <a href="./methodology">methodology section</a> explains the approach and procedures adopted by the team. During the process, the authors benefited from numerous inputs through interviews and workshops. Christian Dietrich prepared and implemented the visual design for the Compass.
</p>

<p>
The Global Initiative on the Future of the Internet is funded by the European Union. However, the Compass is the result of independent research conducted at the EUI. As such, the views and material presented in the Compass cannot be attributed to the EU or any of its bodies and agencies.
</p>

<div class="grid grid-cols-4 gap-4">
<div>
  <img class="keystats" src="https://ec.europa.eu/regional_policy/images/information-sources/logo-download-center/eu_funded_en.jpg" width="100%">
</div>
<div class="col-span-3">
</div>
</div>

</div>

<!-- data -->

```js
const dfiFullParse = FileAttachment("./data/dfiFull.csv").csv({ typed: true });
const dfiCardinalParse = FileAttachment("./data/dfiCardinal.csv").csv({
  typed: true,
});
// global color palette
const colors = ["#32baa7", "#0e4876", "#643291", "#962c8c"];
// lookup
const lookup = {
  3: {
    pillar_txt: "Rights and freedoms",
    commitments: {
      7: { commitment_txt: "Freedom on the Net" },
      8: { commitment_txt: "Global index on Responsible Al" },
      9: { commitment_txt: "Global Cyberlaw Tracker" },
    },
  },
  2: {
    pillar_txt: "Stability and resilience",
    commitments: {
      4: { commitment_txt: "Global Internet Shutdowns" },
      5: { commitment_txt: "Global E-Waste Monitor" },
      6: { commitment_txt: "Overall Resilience" },
    },
  },
  4: {
    pillar_txt: "Connectivity and infrastructure",
    commitments: {
      10: { commitment_txt: "Rule of Law Index" },
      11: { commitment_txt: "Freedom of Expression Index" },
      12: { commitment_txt: "Accountability Index" },
    },
  },
  1: {
    pillar_txt: "Responsibility and sustainability",
    commitments: {
      1: { commitment_txt: "ICT Development Index" },
      2: { commitment_txt: "Global Cybersecurity Index" },
      3: { commitment_txt: "Network Readiness Index" },
    },
  },
};
```

```js
const dfiFull = dfiFullParse.map((item) => {
  const pillar = lookup[item.pillar_num];
  const commitment = pillar?.commitments[item.commitment_num];

  return {
    ...item,
    pillar_txt: pillar?.pillar_txt || item.pillar_txt,
    commitment_txt: commitment?.commitment_txt || item.commitment_txt,
  };
});
const dfiCardinal = dfiCardinalParse.map((item) => {
  const pillar = lookup[item.pillar_num];

  return {
    ...item,
    pillar_txt: pillar?.pillar_txt || item.pillar_txt,
  };
});
```

<!-- world map and data -->

```js
var worldLoad = FileAttachment("./data/CNTR_RG_20M_2024_4326.json").json();
var coastLoad = FileAttachment("./data/COAS_RG_20M_2016_4326.json").json();
```

```js
var world = topojson
  .feature(worldLoad, worldLoad.objects.CNTR_RG_20M_2024_4326)
  .features.filter((d) => d.properties.NAME_ENGL !== "Antarctica")
  .filter((d) => d.properties.SVRG_UN === "UN Member State")
  .map((d) => {
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

```js
const uniqueCommitments = [
  ...new Set(dfiFull.map((item) => item.commitment_txt)),
];
const uniquePillars = [...new Set(dfiCardinal.map((item) => item.pillar_txt))];
```
