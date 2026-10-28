<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="./custom-legend.css" />
</head>

<!-- import components -->

```js
import { sources } from "./components/sources.js";
import { mapSourcesD3 } from "./components/mapSourcesD3.js";
import {
  viewofSourcesLegend,
  SOURCE_TYPE_COLORS,
} from "./components/sourcesLegend.js";
```

<!-- data -->

```js
const sourcesData = FileAttachment("./data/sources.csv").csv({
  typed: true,
});
```

<!-- hero -->
<div class="hero">
  <h1>Resources</h1>
  <h2 class="subheader">Sharing knowledge to accelerate progress.</h2>
</div>

<div class="body-text">
<p>Accountability in the digital realm is not a new concept—extensive research, advocacy, and policy innovation have shaped the global understanding of what it means to build a safe, inclusive, and rights-respecting Internet. Around the world, governments, civil society, international organisations, and research institutions have developed tools, frameworks, and initiatives to uphold commitments to connectivity, human rights, sustainability, and resilience.</p>

<p>Yet this valuable knowledge often remains fragmented, siloed by region, sector, or theme. This section brings together <b>a curated collection of complementary sources, analysis, and projects</b> that highlight good practices, policy innovations, and real-world applications of the principles captured in the Internet Accountability Compass.</p>

<p>Whether it's a successful regulatory reform, an inclusive AI policy, a transparent approach to digital trade, or a strong national cybersecurity framework—these examples demonstrate that progress is possible. They also offer insights into how shared digital principles, such as those in the Global Digital Compact, can be translated into meaningful action.</p>

<p>Together, these resources help build a clearer picture of what digital accountability looks like in practice—and how it can be strengthened globally.</p>
</div>

<!-- data processing -->

```js
const sourceISOUnique = [...new Set(sourcesData.map((d) => d.ISO3_CODE))];

const sourcesDataNormalized = sourcesData.map((d) => ({
  ...d,
  type: d.type.replace(/^[⌕¶⚑]\s*/, ""),
}));

const sourcesDataUnique = sourcesDataNormalized.filter(
  (d, index, self) =>
    index ===
    self.findIndex(
      (item) =>
        item.NAME_ENGL === d.NAME_ENGL &&
        (item.url || `${item.title}|${item.publisher}`) ===
          (d.url || `${d.title}|${d.publisher}`),
    ),
);
```

<!-- load world map -->

```js
var worldLoad = FileAttachment("./data/CNTR_RG_60M_2024_4326.json").json();
var coastLoad = FileAttachment("./data/COAS_RG_60M_2016_4326.json").json();
```

```js
const world = topojson
  .feature(worldLoad, worldLoad.objects.CNTR_RG_60M_2024_4326)
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

const coast = topojson.feature(
  coastLoad,
  coastLoad.objects.COAS_RG_60M_2016_4326,
);
```

<!-- Resources heading + type legend -->

<div class="body-text">
  <h2>Resources</h2>
  <i>Select resources by type and/or country.</i>

</div>

```js
const selectedSourceType = view(viewofSourcesLegend("Analysis"));
```

```js
const selectedCountry = Mutable(null);
window.addEventListener("map-country-selected", (e) => {
  selectedCountry.value = e.detail;
});
```

<!-- map -->
<div class="figure-w-full">
  ${resize((width) => mapSourcesD3(world, coast, sourcesData, {
    width,
    height: 400,
    selectedType: selectedSourceType,
    typeColor: SOURCE_TYPE_COLORS[selectedSourceType],
    initialCountry: selectedCountry,
  }))}
</div>

<!-- filtered cards -->

```js
const sourcesDataFiltered = sourcesDataUnique.filter((d) => {
  const typeMatch = d.type === selectedSourceType;
  const countryMatch = !selectedCountry || d.NAME_ENGL === selectedCountry;
  return typeMatch && countryMatch;
});
sources(sourcesDataFiltered);
```

<div class="body-text">
  <div id="sources-section"></div>
</div>

