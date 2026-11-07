# Tooltip content inventory

Read-only inventory, 2026-11-04. Branch `dev` at 6101cd5 (UI tokens phase 1 merged; phase 2 on
`feature/ui-tokens-js` is NOT in dev, so the Total map tooltip here is still the old
`.map-tooltip` container with inline styles). Dev server, headless Chrome, 1280x800.
Styles: `getComputedStyle` per element. Sources: CDP `CSS.getMatchedStylesForNode` (winning
declaration), cross-checked against the code.

Source abbreviations: **inl** = inline style written by the JS template; **div>\*** = the
`div > * { font-size: 1rem }` rule in style.css; **UA** = browser `strong, b { font-weight: bold }`;
**.ct** = `.chart-tooltip` (style.css: 12px = `--ui-text-sm`); **.ts** = `.tooltip-small`;
**.st!** = `.sparkline-text { font-size: 10px !important }`; **attr** = SVG presentation attribute;
**inh** = inherited from the tooltip container. "text" rows are bare text nodes (styled by their parent).
Line-height in `.chart-tooltip` tooltips is inherited and computes to 1.5x (18px at 12px). The
Total map container sets `line-height: 1.6` and `font-size: 14px` inline. Colour default is #000.
Margins: only those set are listed. On inline elements, vertical margins have **no layout effect**.

## Which builders are live

| Builder | Imported by | Tooltip class |
|---|---|---|
| mapTotalD3 | index.md | `.map-tooltip` (dev) |
| mapPillarD3, mapCommitmentD3 | directions.md | `.chart-tooltip` (shared singleton) |
| mapSourcesD3 | resources.md | `.chart-tooltip` |
| polarBarsD3 `polarBarsD3` | countries.md (Latest, Compass) | `.chart-tooltip` |
| polarBarsD3 `polarCountryBarsD3` | country pages (template) | `.chart-tooltip.polar-country-tooltip` |
| heatmapD3 `heatmap` | countries.md (Latest, Heatmap) | `.chart-tooltip` |
| sparklineTableD3 | countries.md (Historical) | `.chart-tooltip` |
| straightPlotD3 | country pages (Latest) | `.chart-tooltip.straight-plot-tooltip` |
| indicatorHistorical | country pages (Historical) | `.chart-tooltip.indicator-historical-tooltip` |

**Not imported (skipped):** pillarTrendsD3 (`.pillar-trends-tooltip`), polarD3 / polarCountryD3
(rollback only). pillarSparklineD3 (country pages, Historical) has no tooltip.
The four `.chart-tooltip` singletons on /countries are one shared div.

---

## 1. Total map (mapTotalD3), Latest

```js
`<strong style="font-size: 12px; font-weight: regular; color: ${ink}; margin-bottom: 0px;">
   Internet Accountability Score (IAS)</strong><br>
 <strong style="font-size: 42px; font-weight: bold; color: ${ink}; margin-top: 0px; margin-bottom: 8px;">
   ${Math.round(totalScore)}</strong>
 <strong>${NAME_ENGL}</strong> (${categoryDisplay})<br>
 <span style="font-size: 11px; color: #000;">${pillarScores}</span>`
// totalScore = properties["Total score"] || properties.total || 0
// categoryDisplay = group_value === "NA" ? "Not enough data" : group_value
// pillarScores: per pillar `${pillar}: ${Math.round(value)}` (+ note if note !== "NA"),
//   `${pillar}: Not enough data` if `${pillar}_ned === "not enough data"`, omitted if value "NA"; joined "<br>"
```

Captured: Brazil, 217.7 x 203.1 px.

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong | Internet Accountability Score (IAS) | 12px | 700 | 19.2 | #222 | 0/0 | size, colour inl; weight UA (`regular` is invalid, ignored) |
| br | | | | | | | |
| strong | 73 (total score) | 42px | 700 | 67.2 | #222 | 0/8px (no effect) | inl |
| strong | Brazil | 16px | 700 | 25.6 | #000 | | size div>\*; weight UA |
| text | (On track) | 14px | 400 | 22.4 | #000 | | inh (container inline 14px) |
| span | Connectivity and infrastructure: 80`<br>`Rights and freedoms: 70`<br>`… (4 lines) | 11px | 400 | 17.6 | #000 | | inl |

## 2. Total map, no data (countries without data, both modes)

```js
`<strong>${NAME_ENGL}</strong><br><span class="tooltip-small">Not enough data</span>`
```

Captured: Samoa, 109 x 72.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | Samoa | 16px | 700 | 25.6 | #000 | div>\*; UA |
| span.tooltip-small | Not enough data | 11px | 400 | **5.5px** | #555 | .ts (size, colour, `line-height: 0.5`) |

## 3. Total map, Historical

```js
`<strong style="font-size: 28px; font-weight: bold; color: ${ink}; margin-bottom: 8px;">
   ${formatChange(change)}</strong><strong>${NAME_ENGL}</strong><br>
 <span style="font-size: 11px; color: #000;">Change in total Internet <br>Accountability Score (2024→2025)</span><br>
 ${sparklineHTML}`
// change = Total score (latestYear) - Total score (latestYear - 1)
```

Captured: Brazil, 201.3 x 181.6. Change and name share one line (no `<br>` between them).

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong | ▲ +2 | 28px | 700 | 44.8 | #222 | 0/8px (no effect) | inl |
| strong | Brazil | 16px | 700 | 25.6 | #000 | | div>\*; UA |
| span | Change in total Internet`<br>`Accountability Score (2024→2025) | 11px | 400 | 17.6 | #000 | | inl |
| svg (sparkline) | see section 13 | | | | | 4px/4px | inl (`display:block; margin:4px 0`) |

## 4. Pillar map and 5. Commitment map (directions), Latest

The same template in both files:

```js
`<strong style="font-size: 42px; font-weight: bold; color: ${ink}; margin-top: 0px; margin-bottom: 8px;">
   ${Math.round(value)}</strong> <strong>${NAME_ENGL}</strong> (${group_value})<br>
 ${partialNote}`
// Pillar: partialNote = properties.ned === "not enough data" ? " (partial data)" : ""
// Commitment: partialNote = properties.note === " (partial data)" ? " (partial data)" : ""
```

A sparkline is built in Latest mode as well, but not inserted into this template.
Captured: Brazil, both 175.8 x 85.

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong | 80 (pillar) / 85 (commitment) | 42px | 700 | 63 | #222 | 0/8px (no effect) | inl |
| strong | Brazil | 16px | 700 | 24 | #000 | | div>\*; UA |
| text | (Leading) | 12px | 400 | 18 | #000 | | inh (.ct) |
| text | (partial data) | | | | | | **not reached** (see "Could not determine") |

## 6. Pillar / Commitment map, no data (Latest and Historical, both maps)

```js
`<strong>${NAME_ENGL}</strong><br><span style="font-size: 11px; color: #666;">Not enough data</span>`
```

Captured: commitment map, Guyana. Latest and Historical give the same output (111 x 64.5).

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | Guyana | 16px | 700 | 24 | #000 | div>\*; UA |
| span | Not enough data | 11px | 400 | 16.5 | #666 | inl |

## 7. Pillar / Commitment map, Historical

```js
`<strong style="font-size: 20px; color: ${ink};">${formatChange(change)}</strong><br>
 <strong>${NAME_ENGL}</strong><br>
 <span style="font-size: 11px; color: #000;">Change in <br>${pillar_txt | commitment_txt_cardinal} score <br>(2024→2025)</span><br>
 ${sparklineHTML}`
```

Captured: Brazil. Pillar 211.3 x 199.5; commitment 176 x 199.5.

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong | ▲ +1 | 20px | 700 | 30 | #222 | | size, colour inl; weight UA |
| strong | Brazil | 16px | 700 | 24 | #000 | | div>\*; UA |
| span | Change in`<br>`Connectivity and infrastructure score`<br>`(2024→2025) | 11px | 400 | 16.5 | #000 | | inl |
| svg (sparkline) | see section 13 | | | | | 4px/4px | inl |

## 8. Sources map (resources)

```js
`<strong>${NAME_ENGL}</strong><br>${selectedType}: ${counts[baseType] || 0}`
// selectedType = the selected legend type, default "Analysis"; shown only for countries with resources
```

Captured: South Africa, 118.6 x 64.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | South Africa | 16px | 700 | 24 | #000 | div>\*; UA |
| text | Analysis: 12 | 12px | 400 | 18 | #000 | inh (.ct) |

## 9. Polar multiples (countries, Latest, Compass)

```js
`Score: <strong>${Math.floor(d.value)}</strong><br>${d.commitment_txt_cardinal}<br>`
```

No country name: it is in the multiple's own label. Captured: 171 x 64.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| text | Score: | 12px | 400 | 18 | #000 | inh (.ct) |
| strong | 56 | 16px | 700 | 24 | #000 | div>\* (from code; CDP lookup missed this node); UA |
| text | Global Cybersecurity Index | 12px | 400 | 18 | #000 | inh (.ct) |

## 10. Heatmap (countries, Latest, Heatmap)

```js
const valueText = (value NA/null/undefined/NaN) ? "No data" : Math.floor(d.value);
const partialNote = d.note === " (partial data)" ? " (partial data)" : "";
`<strong style="font-size: 28px; font-weight: bold; color: ${ink}; margin-bottom: 8px;"><strong>${valueText}</strong> ${partialNote}</strong><strong>${d.NAME_ENGL}</strong><br>
 ${d.pillar_txt}<br>
 <em>${d.group_value || "N/A"}</em>`
```

Captured: Zimbabwe, Total score column, 144.9 x 106. The score and name share one line.

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong > strong | 49 | 28px | **900** | 42 | #222 | outer 0/8px (no effect) | size, colour inh from the outer inline strong; 900 = UA `bolder` inside bold |
| strong | Zimbabwe | 16px | 700 | 24 | #000 | | div>\*; UA |
| text | Total score (pillar_txt) | 12px | 400 | 18 | #000 | | inh (.ct) |
| em | Off track | 16px | 400 italic | 24 | #000 | | div>\*; UA em |

## 11. Sparkline table (countries, Historical)

```js
`<strong>${Math.round(d.value)}</strong> (${d.year})`
```

No country name and no pillar name. Captured: 84.7 x 46.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | 41 | 16px | 700 | 24 | #000 | div>\*; UA |
| text | (2026) | 12px | 400 | 18 | #000 | inh (.ct) |

## 12a. Polar single (country page, Latest)

```js
`<strong style="font-size: 28px; font-weight: bold; color: ${scoreColor}; margin-bottom: 8px;">
   ${Math.floor(d.value)}</strong><br>
 <span style="color: ${scoreColor};">${d.commitment_txt_cardinal}</span><br>
 ${d.pillar_txt}`
// scoreColor = pillar colour
```

Captured: AUS, 172 x 106.

| element | text | size | weight | lh | colour | margin | source |
|---|---|---|---|---|---|---|---|
| strong | 92 | 28px | 700 | 42 | #3c4099 (pillar) | 0/8px (no effect) | inl |
| span | Accountability Index (commitment) | 16px | 400 | 24 | #3c4099 | | size div>\*; colour inl |
| text | Trust and resilience (pillar) | 12px | 400 | 18 | #000 | | inh (.ct) |

## 12b. Straight plot (country page, Latest)

```js
`<strong>${d.label}</strong><br>${Math.round(d.value)}`
// label = country name, or `${count} countries` when 5 or more share a value
```

No commitment name. Captured: single 102.4 x 64; grouped 108.1 x 64.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | Venezuela / 5 countries | 16px | 700 | 24 | #000 | div>\*; UA |
| text | value (e.g. 57) | 12px | 400 | 18 | #000 | inh (.ct) |

## 12c. Indicator historical (country page, Historical)

```js
`<strong>${Math.round(d.value)}</strong>${statusSuffix[d.value_status] ?? ""}`
// statusSuffix: carried -> " (carried forward)", backdated -> " (backdated)", actual -> ""
// the same text (plain) is used for the circle's <title>
```

No year, country or indicator. Captured: AUS. "actual" 45.2 x 46; carried 138.2 x 46; backdated 111.5 x 46.

| element | text | size | weight | lh | colour | source |
|---|---|---|---|---|---|---|
| strong | 92 / 96 / 97 | 16px | 700 | 24 | #000 | div>\*; UA |
| text | (carried forward) / (backdated) | 12px | 400 | 18 | #000 | inh (.ct) |

## 13. Sparkline inside the map tooltips (Historical only)

`createTooltipSparkline`, a separate copy in each map file. SVG 150 x 60, `display:block; margin:4px 0`,
y domain 0-100, x domain = global year extent. The SVG element itself is 16px (div>\*); no text inherits it.

| part | Total | Pillar | Commitment |
|---|---|---|---|
| margins (top) | 15 | 15 | 20 |
| area | #ccc, opacity 0.5 | same | same |
| line | none (commented out) | none (commented out) | 2px, single colour |
| dots r=3 | category colour per year, white stroke | category colour per year, white stroke | single colour, no stroke |
| single colour | n/a | n/a (param passed, unused) | Latest: pillar colour; Historical: change>0 pillar colour, <0 `decline`, 0 `noChange` |
| value label, all points | `Math.round`, 10px, **400**, fill #000 | 10px, **700** (inline), fill #222 | 10px, **700**, fill #222 |
| year label, first and last | `'20`, `'26`, 10px, 400, fill #333 | same | same |
| size source | .st! (beats `svg text` 16px !important) | same | same |

---

## Divergence summary

Counts are over the 15 distinct tooltip templates above (sections 1-12c), one per text run;
sparkline SVG text is excluded.

| property | distinct values (count) |
|---|---|
| font-size | 42px (3) · 28px (3) · 20px (2) · 16px (16) · 14px (1) · 12px (12) · 11px (6) |
| font-weight | 700 (24) · 400 (18) · 900 (1, heatmap nested strong) |
| line-height ratio | 1.6 (Total map, 6 runs) · 1.5 (inherited, all others) · 0.5 (1, .tooltip-small) |
| colour | #000 (default, names and body text) · #222 `ink` (8: big numbers, IAS label) · #555 (1) · #666 (1 template, 4 code paths) · pillar colour (2, polar single) |
| font-style | normal · italic (1, heatmap status `<em>`) |
| margin | 8px bottom on 6 inline strongs (no effect) · 4px 0 on the sparkline SVG (effective) |
| display | inline everywhere except the sparkline SVG (block) |
| size source | inline JS (17 runs) · div>\* (16) · inherited container (13) · .tooltip-small (1) |
| weight source | UA strong (most) · inline `bold` (6) · inline `regular` (invalid, falls back to UA 700) |

Sparkline text: 10px everywhere. Value labels are 400 #000 (Total) vs 700 #222 (Pillar, Commitment).

### Same information, side by side

**Country name**
- `<strong>` 16px 700 #000: all maps, heatmap, straight plot (single dot).
- Straight plot grouped dots show "N countries" instead.
- Absent: polar multiples, sparkline table, polar single, indicator historical.
- Position: second, after the big number (Total Latest, Pillar/Commitment Latest, heatmap, Total Historical); third, after the change (Pillar/Commitment Historical); first (no-data, sources, straight plot).

**Total score**
- Total map Latest: label "Internet Accountability Score (IAS)" above, then 42px #222, `Math.round`.
- Heatmap "Total score" column: 28px, 900, `Math.floor`; the pillar line reads "Total score".
- Sparkline table "Total score" row: 16px, `Math.round` + "(year)".

**Pillar or commitment score**
- Pillar/Commitment map: 42px #222 `Math.round`, no label.
- Heatmap: 28px `Math.floor`, then pillar name 12px.
- Polar multiples: "Score: " 12px + 16px `Math.floor`, then commitment name 12px.
- Polar single: 28px, pillar colour, `Math.floor`, then commitment 16px (pillar colour) and pillar 12px.
- Straight plot: 12px `Math.round` after the name.
- Indicator historical: 16px `Math.round`.
- Total map pillar lines: "Pillar name: 80", 11px `Math.round`.

**Category / status band**
- "(On track)" 14px (Total map); "(Leading)" 12px (Pillar/Commitment).
- Heatmap: `<em>` 16px italic with no brackets; fallback "N/A".
- Total map shows "(Not enough data)" in brackets when group_value is "NA".
- Absent: polar, straight plot, sparkline table, indicator.

**Change**
- `formatChange`: "▲ +n", "▼ −n" (U+2212 minus), "0"; `Math.round`.
- Size: 28px (Total), 20px (Pillar, Commitment). Colour always #222; the arrow is the only direction cue in the text.
- Caption: "Change in total Internet Accountability Score (2024→2025)" (Total) vs "Change in {name} score (2024→2025)" (Pillar, Commitment), 11px #000.

**No data**
- "Not enough data": 11px #555, line-height 0.5 (Total, `.tooltip-small`).
- "Not enough data": 11px #666, inline (Pillar, Commitment).
- "Not enough data" as the category (Total Latest).
- "{Pillar}: Not enough data" (Total pillar lines).
- "No data" as the value (heatmap).
- "No data available" / "No historical data available" (chart placeholders, not tooltips).
- "N/A" for a missing heatmap category.
- Sources map: no tooltip at all for countries without resources.

**Partial / computed status**
- " (partial data)" suffix: Pillar map (when `ned === "not enough data"`), Commitment map and heatmap (when `note === " (partial data)"`), at 12px.
- Total pillar lines: the raw `note` appended to the number, with no space added.
- Indicator historical: " (carried forward)", " (backdated)" at 12px; nothing for "actual".

**Year / period**
- "(2024→2025)" is a literal in all three map change captions. The value is computed as latestYear minus (latestYear − 1); the latest year in the data is 2026 (sparkline `'26`, sparkline table "(2026)").
- Sparklines: `'YY` first and last only.
- Sparkline table: full year in brackets.
- No year anywhere else.

**Source / count line**
- Sources map only: "{Type}: {count}", 12px; the type is a legend label (default "Analysis").

**Rounding**
- `Math.round`: maps, sparklines, sparkline table, straight plot, indicator, formatChange.
- `Math.floor`: polar multiples, polar single, heatmap. The polar multiples' own SVG total label also uses `Math.floor`.

## Could not determine / not reached

- **Partial-data notes are never shown with current data:**
  - The pillar map checks `ned === "not enough data"`; the data has "Partial data" (146) and "NA" (120).
  - The commitment map checks `note === " (partial data)"`; the data has "NA" (194) and "Not enough data" (36).
  - Heatmap cells: all 945 have note "NA".
  - Total map pillar lines: the `_ned` / `_note` branches read the same cardinal data. Not observed rendering, so inferred unreachable, not verified.
- **Heatmap "No data" and "N/A":** all 945 cells have a numeric value, so these weren't captured.
- **Pillar map Historical, no data:** all 266 countries have a numeric change. The identical markup was captured on the commitment map (Guyana).
- **Sources tooltip type label:** only the default "Analysis" was captured; the other legend types use the same template.
- **Polar multiples `<strong>`:** its CSS source came from code reading; the CDP lookup missed the node because the tooltip re-rendered.
- **Inherited 1.5 line-height:** I didn't trace which ancestor rule sets it on `.chart-tooltip` tooltips (computed 18px at 12px).
- **Mobile and touch:** not captured (desktop 1280 only, as asked).
- **Console:** no errors on any page. The only exception is `404 /favicon.ico` on home, from the dev server, pre-existing.
