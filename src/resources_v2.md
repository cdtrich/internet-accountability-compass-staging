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
import { sourcesTable } from "./components/sourcesTable.js";
import { sourcesFilters } from "./components/sourcesFilters.js";
import { mapSourcesD3 } from "./components/mapSourcesD3_v2.js";
import { SOURCE_CONFIG } from "./components/sourcesLegend_v2.js";
```

<!-- data -->

```js
const sourcesData = FileAttachment("./data/sources.csv").csv({ typed: true });
var worldLoad = FileAttachment("./data/CNTR_RG_60M_2024_4326.json").json();
var coastLoad = FileAttachment("./data/COAS_RG_60M_2016_4326.json").json();
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
console.log(sourcesData);
console.log(Object.keys(sourcesData[0]));
console.log(sourcesData.length);

const normalised = sourcesData.map((d) => ({
  ...d,
  type: d.type.replace(/^[⌕¶⚑]\s*/, ""),
}));

// pillar_txt is part of the key: without it, a source listed under two
// directions collapses to one row and the direction filter drops it
const key = (d) =>
  `${d.NAME_ENGL}|${d.pillar_txt}|${d.url || `${d.title}|${d.publisher}`}`;
const seen = new Set();
const sourcesDataUnique = normalised
  .filter((d) => !seen.has(key(d)) && seen.add(key(d)))
  .sort(
    (a, b) =>
      a.NAME_ENGL.localeCompare(b.NAME_ENGL) ||
      String(a.title).localeCompare(String(b.title)),
  );

// Dropdown value is ISO3 (what the map uses); label is the English name
const countryOptions = [
  ...new Map(sourcesDataUnique.map((d) => [d.ISO3_CODE, d.NAME_ENGL])),
]
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const directions = [
  ...new Set(sourcesDataUnique.map((d) => d.pillar_txt)),
].filter(Boolean);
const types = SOURCE_CONFIG.map((c) => c.fullType);
```

<!-- world map geometry -->

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

<!-- filters -->
<div class="body-text">
  <h2>Resources</h2>
  <i>Filter by country/region, cardinal direction, type or document.</i>
</div>

<div class="body-text">

```js
// Keep a handle on the element: the map calls filtersEl.setCountry(...)
const filtersEl = sourcesFilters({
  countries: countryOptions,
  directions,
  types,
});
const filters = view(filtersEl);
```

</div>

<!-- map (built once; updated below) -->
<div class="figure-w-full src-map">${sourcesMap}</div>

```js
const sourcesMap = mapSourcesD3(world, coast, {
  onSelect: (iso) => filtersEl.setCountry(iso),
});
```

<!-- filtering -->

```js
const q = filters.keyword.trim().toLowerCase();

// Everything except country: this is what the map shows
const baseRows = sourcesDataUnique.filter(
  (d) =>
    (!filters.type || d.type === filters.type) &&
    (!filters.direction || d.pillar_txt === filters.direction) &&
    (!q || `${d.title} ${d.publisher ?? ""}`.toLowerCase().includes(q)),
);
const counts = d3.rollup(
  baseRows,
  (v) => v.length,
  (d) => d.ISO3_CODE,
);

// Table = base filters + selected country
const rows = filters.country
  ? baseRows.filter((d) => d.ISO3_CODE === filters.country)
  : baseRows;
```

```js
// Push filter state into the map (no re-render, zoom is preserved)
sourcesMap.update({ counts, selected: filters.country });
```

<!-- table -->
<div class="body-text">
  <p class="src-count">${rows.length} of ${sourcesDataUnique.length} resources</p>
  ${sourcesTable(rows)}
</div>

<style>
/* filters */
.src-filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px 20px; margin: 12px 0 24px; }
.src-filter-label { display: block; margin-bottom: 4px; font-size: 0.75em; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #007162; }
.src-filter-row { display: flex; align-items: center; gap: 6px; }
.src-filter-control {
  flex: 1; min-width: 0; height: 40px; padding: 0 12px;
  font: inherit; color: #222; background-color: #fff;
  border: 1.5px solid #cfd8d6; border-radius: 8px;
  transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
}
select.src-filter-control {
  appearance: none; padding-right: 34px; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23007162' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; background-size: 12px;
}
.src-filter-control:hover { border-color: #007162; }
.src-filter-control:focus-visible { outline: none; border-color: #007162; box-shadow: 0 0 0 3px rgba(0, 113, 98, 0.2); }
.src-filter-control.is-set { border-color: #007162; background-color: rgba(0, 113, 98, 0.05); }
.src-filter-clear {
  flex: none; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  background: rgba(0, 113, 98, 0.1); color: #007162;
  visibility: hidden; /* hidden, not removed: no layout shift when it appears */
}
.src-filter-clear.is-active { visibility: visible; }
.src-filter-clear:hover, .src-filter-clear:focus-visible { background: #007162; color: #fff; outline: none; }
.src-filter-clear svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; }

/* map */
.src-map { margin: 0 0 24px; }

/* table */
.src-table-wrap { overflow-x: auto; }
.src-table { width: 100%; border-collapse: collapse; }
.src-table th { text-align: left; font-weight: 700; border-bottom: 2px solid #ccc; padding: 6px 10px; }
.src-table td { vertical-align: top; padding: 8px 10px; border-bottom: 1px solid #eee; }
.src-count { font-size: 0.85em; color: #666; margin: 0 0 6px; }
.src-tile {
  display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.85em;
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 15%, transparent); /* tint strength: 10–20% */
}
.src-type { display: inline-flex; align-items: center; gap: 0.4em; white-space: nowrap; color: #333; }
.src-type-icon svg {
  width: 1.1em; height: 1.1em; display: block;
  fill: none; stroke: currentColor; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
}
</style>
