---
title: Radial prototypes
head: '<meta name="robots" content="noindex">'
index: false
---

<style>
#observablehq-main, #observablehq-center { max-width: none; }
.proto-scroll { overflow-x: auto; }
.proto-grid { display: grid; gap: 8px 16px; align-items: center; }
.proto-grid .row-label { font-weight: 700; font-size: 14px; }
.proto-grid .col-label { font-size: 13px; color: #555; }
.thumbs { display: grid; grid-template-columns: repeat(auto-fill, 150px); gap: 4px; margin-bottom: 24px; }
.thumb { position: relative; width: 150px; height: 150px; }
.thumb .name { position: absolute; inset: auto 0 2px 0; text-align: center; font-size: 11px; background: #ffffffd0; opacity: 0; pointer-events: none; }
.thumb:hover .name { opacity: 1; }
.small-viewport { width: 360px; border: 1px dashed #c00; padding: 8px; box-sizing: border-box; }
.small-viewport h4 { margin: 12px 0 4px; }
.metrics td, .metrics th { padding: 2px 10px; text-align: right; }
.metrics td:first-child, .metrics th:first-child { text-align: left; }
</style>

# Radial prototypes

Prototype only (branch `proto/radial`). Not linked from the site. Static render, no animation.

```js
import { polarVariant } from "../components/prototypes/polarVariants.js";
```

```js
const dfiFull = FileAttachment("../data/dfiFull.csv").csv({ typed: true });
```

```js
const latestYear = d3.max(dfiFull, (d) => d.year);
const latest = dfiFull.filter((d) => d.year === latestYear);

const VARIANTS = [
  { label: "current", variant: "current", radiusScale: "linear" },
  { label: "A", variant: "A", radiusScale: "linear" },
  { label: "B", variant: "B", radiusScale: "linear" },
  { label: "B-sqrt", variant: "B", radiusScale: "sqrt" },
  { label: "C", variant: "C", radiusScale: "linear" },
  { label: "C-sqrt", variant: "C", radiusScale: "sqrt" },
];

const isNum = (v) => typeof v === "number" && !isNaN(v);
const byCountry = d3.rollups(
  latest,
  (v) => ({ total: v[0].total, missing: v.filter((d) => !isNum(d.value)).length }),
  (d) => d.NAME_ENGL,
);
const withTotal = byCountry.filter(([, s]) => isNum(s.total)).sort((a, b) => a[1].total - b[1].total);

// Test countries: highest total, lowest total, and one with missing indicators
const highest = withTotal.at(-1)[0];
const lowest = withTotal[0][0];
const withMissing = "Fiji";
const testCountries = [highest, lowest, withMissing];

// 24 thumbnails spread evenly across the score range, shuffled with a fixed seed
const spread = d3.range(24).map((k) => withTotal[Math.round((k * (withTotal.length - 1)) / 23)][0]);
const thumbCountries = d3.shuffler(d3.randomLcg(42))(spread.slice());
const stats = new Map(byCountry);
```

## 1. Comparison at 400px

Test countries: <b>${highest}</b> (highest total, ${stats.get(highest).total}), <b>${lowest}</b> (lowest total, ${stats.get(lowest).total}), <b>${withMissing}</b> (${stats.get(withMissing).missing} indicators missing, total ${stats.get(withMissing).total}).

```js
// Flat list of grid cells (html`` would wrap multi-node rows in a <span>)
const cells = [html`<div></div>`, ...testCountries.map((c) => html`<div class="col-label">${c}</div>`)];
for (const v of VARIANTS) {
  cells.push(html`<div class="row-label">${v.label}</div>`);
  for (const c of testCountries) cells.push(html`<div data-polar-brush>${polarVariant(latest, c, { ...v, width: 400 })}</div>`);
}
display(html`<div class="proto-scroll"><div class="proto-grid" style="grid-template-columns: 70px repeat(3, 400px)">${cells}</div></div>`);
```

## 2. Thumbnails at 150px

24 countries across the score range, fixed-seed shuffle (same order in every block). Hover a thumbnail for its name. Hovering an indicator dims the other indicators across the block.

```js
display(html`${VARIANTS.map((v) => html`<h3>${v.label}</h3>
  <div class="thumbs" data-polar-brush>${thumbCountries.map((c) => html`<div class="thumb">${polarVariant(latest, c, { ...v, width: 150 })}<div class="name">${c} (${stats.get(c).total})</div></div>`)}</div>`)}`);
```

## 3. Small viewport (360px container)

${withMissing} at 150px and at 400px (shrinks to the container).

```js
display(html`<div class="small-viewport">${VARIANTS.map((v) => html`<h4>${v.label}</h4>
  <div data-polar-brush>${polarVariant(latest, withMissing, { ...v, width: 150, isMobile: true })}</div>
  <div data-polar-brush>${polarVariant(latest, withMissing, { ...v, width: 400, isMobile: true })}</div>`)}</div>`);
```

## 4. Measurements

SVG nodes per chart (a country with all 12 indicators), total DOM nodes of the 24-thumbnail grid, and grid render time (build 24 SVGs + append + forced layout; one warm-up, then median of 5).

```js
function measure(v) {
  const run = () => {
    const host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-10000px;top:0;width:1000px";
    document.body.appendChild(host);
    const t0 = performance.now();
    for (const c of thumbCountries) host.appendChild(polarVariant(latest, c, { ...v, width: 150 }));
    host.getBoundingClientRect();
    const ms = performance.now() - t0;
    const gridNodes = host.querySelectorAll("*").length;
    const perChart = d3.max([...host.children], (s) => s.querySelectorAll("*").length + 1);
    host.remove();
    return { ms, gridNodes, perChart };
  };
  run(); // warm-up
  const runs = d3.range(5).map(run);
  return { label: v.label, perChart: runs[0].perChart, gridNodes: runs[0].gridNodes, medianMs: +d3.median(runs, (r) => r.ms).toFixed(1), runsMs: runs.map((r) => +r.ms.toFixed(1)) };
}
const metrics = VARIANTS.map(measure);
display(html`<table class="metrics"><tr><th>variant</th><th>nodes/chart</th><th>grid nodes (24)</th><th>grid render, median ms</th><th>runs (ms)</th></tr>
${metrics.map((m) => html`<tr><td>${m.label}</td><td>${m.perChart}</td><td>${m.gridNodes}</td><td>${m.medianMs}</td><td>${m.runsMs.join(", ")}</td></tr>`)}</table>
<pre id="radial-metrics" style="font-size:11px">${JSON.stringify({ ua: navigator.userAgent, metrics })}</pre>`);
```
