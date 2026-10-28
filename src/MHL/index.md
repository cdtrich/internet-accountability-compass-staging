---
toc: false
sidebar: false
pager: null
footer: false
theme: air
---

<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="stylesheet" href="../modeToggle.css">
<!-- <link rel="stylesheet" href="../toggleSwitch.css"> -->
<!-- sidebar -->
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
<link rel="stylesheet" href="../sidebar.css" />
<link rel="stylesheet" href="../custom-legend.css" />
</head>

<!-- import components -->

```js
import { straightPlotD3 } from "../components/straightPlotD3.js";
// v3 polar bars; to switch back: import { polarCountryD3 } from "../components/polarCountryD3.js";
import { polarCountryBarsD3 } from "../components/polarBarsD3.js";
import { sources } from "../components/sources.js";
import { onlyUnique } from "../components/onlyUnique.js";
import { sidebar } from "../components/sidebar.js";
import { pillarTextShort } from "../components/pillarTextShort.js";
import { viewofSourcesLegend } from "../components/sourcesLegend.js";
import { pillarSparklineD3 } from "../components/pillarSparklineD3.js";
import { indicatorHistorical } from "../components/indicatorHistorical.js";
import { modeToggle } from "../components/modeToggle.js";
```

<!-- Get country from ISO3 code -->

```js
const countryISO = "MHL";
// reactively track whether the viewport is mobile-sized, so charts can
// adapt on resize/orientation change rather than only at first render
const isMobile = Generators.observe((notify) => {
  const mql = window.matchMedia("(max-width: 768px)");
  notify(mql.matches);
  const onChange = (event) => notify(event.matches);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
});
```

<!-- load data -->

```js
const dfiCardinal = FileAttachment("../data/dfiCardinal.csv").csv({
  typed: true,
});

const sourcesParse = FileAttachment("../data/sources.csv").csv({
  typed: true,
});

const dfiFull = FileAttachment("../data/dfiFull.csv").csv({
  typed: true,
});
```

<!-- Find country name from ISO3 code -->

```js
// latest year
const latestYear = d3.max(dfiFull, (d) => d.year);
// Find country by ISO3 code
const countryData = dfiFull.find((d) => d.ISO3_CODE === countryISO);
const country = countryData ? countryData.NAME_ENGL : "";

// If no country found, show error
if (!country) {
  display(
    html`<div class="hero">
      <h1>Country not found</h1>
      <p>The country code "${countryISO}" does not exist.</p>
    </div>`,
  );
}
```

<!-- calculate country specific data for intro -->

```js
const dfiCountry = dfiFull.find(
  (d) => d.NAME_ENGL === country && d.year === latestYear,
);
const dfiLatest = dfiFull.filter((d) => d.year === latestYear);
const dfiCardinalCountry = dfiCardinal.filter(
  (d) => d.NAME_ENGL == country && d.year == latestYear,
);
```

```js
const total = dfiCountry ? Math.round(dfiCountry.total) : 0;
const group = dfiCountry ? dfiCountry.group : "";
```

<!-- only unique sources, and filtered by country -->

```js
const sourcesData = sourcesParse
  .filter((d) => d.NAME_ENGL === country)
  .filter(
    (d, index, self) =>
      index ===
      self.findIndex(
        (item) =>
          (item.url || `${item.title}|${item.publisher}`) ===
          (d.url || `${d.title}|${d.publisher}`),
      ),
  );
```

<div class="hero">
  <h1>${country}</h1>
</div>

```js
var commitments = dfiFull.map((d) => d.commitment_txt);
var commitmentUnique = commitments.filter(onlyUnique);
```

<!-- text and polar -->
<div class="body-text">
<div class="grid grid-cols-3">

  <div class="card grid-col-1">
  ${isNaN(total) ? html`<p><i>There is not enough data available to generate a total score for ${latestYear}.</i></p>` : html`<p>${country} scores a <span style="font-weight: 700;">total of ${total} </span>points (<i>${group}</i>) in ${latestYear}.</p>`}
  <p>Cardinal point breakdown:</p>
<ul style="list-style: none; padding-left: 0;">
  <li style="margin-bottom: 10px;">
    ${dfiCardinalCountry[0].value === "NA" ? dfiCardinalCountry[0].ned : `${Math.round(dfiCardinalCountry[0].value)} (${dfiCardinalCountry[0].group_value})`} in <span class="pillar-connectivity" style="font-weight: 700;">${dfiCardinalCountry[0].pillar_txt}</span>
  </li>
  <li>
    <!-- ${pillarSparklineD3(dfiCardinal.filter(d => d.NAME_ENGL === country), dfiCardinalCountry[0].pillar_txt)} -->
  </li>
  <li style="margin-bottom: 10px;">
    ${dfiCardinalCountry[1].value === "NA" ? dfiCardinalCountry[1].ned : `${Math.round(dfiCardinalCountry[1].value)} (${dfiCardinalCountry[1].group_value})`} in <span class="pillar-rights" style="font-weight: 700;">${dfiCardinalCountry[1].pillar_txt}</span>
  </li>
  <li>
    <!-- ${pillarSparklineD3(dfiCardinal.filter(d => d.NAME_ENGL === country), dfiCardinalCountry[1].pillar_txt)} -->
  </li>
  <li style="margin-bottom: 10px;">
    ${dfiCardinalCountry[2].value === "NA" ? dfiCardinalCountry[2].ned : `${Math.round(dfiCardinalCountry[2].value)} (${dfiCardinalCountry[2].group_value})`} in <span class="pillar-responsibility" style="font-weight: 700;">${dfiCardinalCountry[2].pillar_txt}</span>
  </li>
  <li>
    <!-- ${pillarSparklineD3(dfiCardinal.filter(d => d.NAME_ENGL === country), dfiCardinalCountry[2].pillar_txt)} -->
  </li>
  <li style="margin-bottom: 10px;">
    ${dfiCardinalCountry[3].value === "NA" ? dfiCardinalCountry[3].ned : `${Math.round(dfiCardinalCountry[3].value)} (${dfiCardinalCountry[3].group_value})`} in <span class="pillar-trust" style="font-weight: 700;">${dfiCardinalCountry[3].pillar_txt}</span>
  </li>
  <li>
    <!-- ${pillarSparklineD3(dfiCardinal.filter(d => d.NAME_ENGL === country), dfiCardinalCountry[3].pillar_txt)} -->
  </li>
</ul>
    </div>

  <div class="card grid-col-2">
        ${resize((width) => polarCountryBarsD3(dfiFull, country, {width}))}
    </div>

</div>
</div>

<!-- View toggle -->

```js
const viewMode = view(
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
const pillar0Header = html`<div
  class="pillar-section-header"
  style="display: flex; gap: 20px; margin-bottom: 20px; align-items: start;"
>
  <div style="flex: 2;">
    <p>
      <span class="pillar-connectivity" style="font-weight: 700;"
        >${dfiCardinalCountry[0].pillar_txt}</span
      >
    </p>
    <p>
      ${pillarTextShort.filter(
        (d) => d.title == dfiCardinalCountry[0].pillar_txt,
      )[0].paragraphs}
    </p>
  </div>
  ${viewMode === "historical"
    ? html`<div class="card" style="flex: 1;">
        ${resize((width) =>
          pillarSparklineD3(
            dfiCardinal.filter((d) => d.NAME_ENGL === country),
            dfiCardinalCountry[0].pillar_txt,
            { width },
          ),
        )}
      </div>`
    : html`<div style="flex: 1;"></div>`}
</div>`;
```

<div>${pillar0Header}</div>

```js
const pillar0Indicators = dfiFull
  .filter((d) => d.pillar_txt === dfiCardinalCountry[0].pillar_txt)
  .map((d) => d.commitment_txt_cardinal)
  .filter((v, i, a) => a.indexOf(v) === i);

let pillar0Content;
if (viewMode === "latest") {
  pillar0Content = resize((width) =>
    straightPlotD3(dfiLatest, country, dfiCardinalCountry[0].pillar_txt, {
      width,
      isMobile,
    }),
  );
} else {
  pillar0Content = html`<div
    class="grid grid-cols-3"
    style="gap: 20px; margin-bottom: 40px;"
  >
    ${pillar0Indicators.map(
      (indicator) => html`
        <div class="card">
          ${resize((width) =>
            indicatorHistorical(
              dfiFull,
              country,
              dfiCardinalCountry[0].pillar_txt,
              indicator,
              { width },
            ),
          )}
        </div>
      `,
    )}
  </div>`;
}
```

<div class="chart-breakout">${pillar0Content}</div>

```js
const pillar1Header = html`<div
  class="pillar-section-header"
  style="display: flex; gap: 20px; margin-bottom: 20px; align-items: start;"
>
  <div style="flex: 2;">
    <p>
      <span class="pillar-rights" style="font-weight: 700;"
        >${dfiCardinalCountry[1].pillar_txt}</span
      >
    </p>
    <p>
      ${pillarTextShort.filter(
        (d) => d.title == dfiCardinalCountry[1].pillar_txt,
      )[0].paragraphs}
    </p>
  </div>
  ${viewMode === "historical"
    ? html`<div class="card" style="flex: 1;">
        ${resize((width) =>
          pillarSparklineD3(
            dfiCardinal.filter((d) => d.NAME_ENGL === country),
            dfiCardinalCountry[1].pillar_txt,
            { width },
          ),
        )}
      </div>`
    : html`<div style="flex: 1;"></div>`}
</div>`;
```

<div>${pillar1Header}</div>

```js
const pillar1Indicators = dfiFull
  .filter((d) => d.pillar_txt === dfiCardinalCountry[1].pillar_txt)
  .map((d) => d.commitment_txt_cardinal)
  .filter((v, i, a) => a.indexOf(v) === i);

let pillar1Content;
if (viewMode === "latest") {
  pillar1Content = resize((width) =>
    straightPlotD3(dfiLatest, country, dfiCardinalCountry[1].pillar_txt, {
      width,
      isMobile,
    }),
  );
} else {
  pillar1Content = html`<div
    class="grid grid-cols-3"
    style="gap: 20px; margin-bottom: 40px;"
  >
    ${pillar1Indicators.map(
      (indicator) => html`
        <div class="card">
          ${resize((width) =>
            indicatorHistorical(
              dfiFull,
              country,
              dfiCardinalCountry[1].pillar_txt,
              indicator,
              { width },
            ),
          )}
        </div>
      `,
    )}
  </div>`;
}
```

<div class="chart-breakout">${pillar1Content}</div>

```js
const pillar2Header = html`<div
  class="pillar-section-header"
  style="display: flex; gap: 20px; margin-bottom: 20px; align-items: start;"
>
  <div style="flex: 2;">
    <p>
      <span class="pillar-responsibility" style="font-weight: 700;"
        >${dfiCardinalCountry[2].pillar_txt}</span
      >
    </p>
    <p>
      ${pillarTextShort.filter(
        (d) => d.title == dfiCardinalCountry[2].pillar_txt,
      )[0].paragraphs}
    </p>
  </div>
  ${viewMode === "historical"
    ? html`<div class="card" style="flex: 1;">
        ${resize((width) =>
          pillarSparklineD3(
            dfiCardinal.filter((d) => d.NAME_ENGL === country),
            dfiCardinalCountry[2].pillar_txt,
            { width },
          ),
        )}
      </div>`
    : html`<div style="flex: 1;"></div>`}
</div>`;
```

<div>${pillar2Header}</div>

```js
const pillar2Indicators = dfiFull
  .filter((d) => d.pillar_txt === dfiCardinalCountry[2].pillar_txt)
  .map((d) => d.commitment_txt_cardinal)
  .filter((v, i, a) => a.indexOf(v) === i);

let pillar2Content;
if (viewMode === "latest") {
  pillar2Content = resize((width) =>
    straightPlotD3(dfiLatest, country, dfiCardinalCountry[2].pillar_txt, {
      width,
      isMobile,
    }),
  );
} else {
  pillar2Content = html`<div
    class="grid grid-cols-3"
    style="gap: 20px; margin-bottom: 40px;"
  >
    ${pillar2Indicators.map(
      (indicator) => html`
        <div class="card">
          ${resize((width) =>
            indicatorHistorical(
              dfiFull,
              country,
              dfiCardinalCountry[2].pillar_txt,
              indicator,
              { width },
            ),
          )}
        </div>
      `,
    )}
  </div>`;
}
```

<div class="chart-breakout">${pillar2Content}</div>

```js
const pillar3Header = html`<div
  class="pillar-section-header"
  style="display: flex; gap: 20px; margin-bottom: 20px; align-items: start;"
>
  <div style="flex: 2;">
    <p>
      <span class="pillar-trust" style="font-weight: 700;"
        >${dfiCardinalCountry[3].pillar_txt}</span
      >
    </p>
    <p>
      ${pillarTextShort.filter(
        (d) => d.title == dfiCardinalCountry[3].pillar_txt,
      )[0].paragraphs}
    </p>
  </div>
  ${viewMode === "historical"
    ? html`<div class="card" style="flex: 1;">
        ${resize((width) =>
          pillarSparklineD3(
            dfiCardinal.filter((d) => d.NAME_ENGL === country),
            dfiCardinalCountry[3].pillar_txt,
            { width },
          ),
        )}
      </div>`
    : html`<div style="flex: 1;"></div>`}
</div>`;
```

<div>${pillar3Header}</div>

```js
const pillar3Indicators = dfiFull
  .filter((d) => d.pillar_txt === dfiCardinalCountry[3].pillar_txt)
  .map((d) => d.commitment_txt_cardinal)
  .filter((v, i, a) => a.indexOf(v) === i);

let pillar3Content;
if (viewMode === "latest") {
  pillar3Content = resize((width) =>
    straightPlotD3(dfiLatest, country, dfiCardinalCountry[3].pillar_txt, {
      width,
      isMobile,
    }),
  );
} else {
  pillar3Content = html`<div
    class="grid grid-cols-3"
    style="gap: 20px; margin-bottom: 40px;"
  >
    ${pillar3Indicators.map(
      (indicator) => html`
        <div class="card">
          ${resize((width) =>
            indicatorHistorical(
              dfiFull,
              country,
              dfiCardinalCountry[3].pillar_txt,
              indicator,
              { width },
            ),
          )}
        </div>
      `,
    )}
  </div>`;
}
```

<div class="chart-breakout">${pillar3Content}</div>

<!-- sources -->

```js
var resourcesHeading = sourcesData.length === 0 ? "" : "Resources";
```

<h1>${resourcesHeading}</h1>

```js
const selectSourceType = view(viewofSourcesLegend(null));
```

```js
const sourcesFiltered =
  selectSourceType === null
    ? sourcesData
    : sourcesData.filter(
        (d) => d.type.replace(/^[⌕¶⚑]\s*/, "") === selectSourceType,
      );
sources(sourcesFiltered);
```

<div id="sources-section"></div>

<!-- sidebar -->

<div>
    ${sidebar()}
</div>
