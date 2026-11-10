import { html } from "npm:htl";
import { SOURCE_CONFIG } from "./sourcesLegend_v2.js";
import colorScales from "./scales.js";

const CONFIG = new Map(SOURCE_CONFIG.map((c) => [c.fullType, c]));

// Cardinal direction colours come from scales.js, the same source the
// sparklines and pillar maps use. Guarded by an explicit list: an ordinal
// d3 scale would otherwise hand an unknown label a colour from the range.
const { getColor } = colorScales();
const DIRECTIONS = new Set([
  "Connectivity and infrastructure",
  "Rights and freedoms",
  "Responsibility and sustainability",
  "Trust and resilience",
]);

// Type: neutral, icon + label only
function typeLabel(type) {
  const cfg = CONFIG.get(type);
  if (!cfg) return html`<span>${type}</span>`;
  const icon = document.createElement("span");
  icon.className = "src-type-icon";
  icon.innerHTML = cfg.icon; // static, trusted SVG from SOURCE_CONFIG
  return html`<span class="src-type">${icon}${cfg.label}</span>`;
}

// Cardinal direction: tinted tile in the direction's colour
function directionTile(direction) {
  if (!direction) return "";
  if (!DIRECTIONS.has(direction)) return html`<span>${direction}</span>`;
  return html`<span class="src-tile" style="--tile: ${getColor(direction)}"
    >${direction}</span
  >`;
}

function documentCell(d) {
  const ok = d.url && String(d.url).trim() !== "NA";
  return ok
    ? html`<a href="${d.url}" target="_blank" rel="noopener">${d.title}</a>`
    : html`<span>${d.title}</span>`;
}

export function sourcesTable(rows) {
  if (!rows.length)
    return html`<p class="src-empty">No resources match these filters.</p>`;
  return html`<div class="src-table-wrap">
    <table class="src-table">
      <thead>
        <tr>
          <th>Country/region</th>
          <th>Cardinal direction</th>
          <th>Type</th>
          <th>Document</th>
          <th>Publisher</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (d) =>
            html`<tr>
              <td>${d.NAME_ENGL}</td>
              <td>${directionTile(d.pillar_txt)}</td>
              <td>${typeLabel(d.type)}</td>
              <td>${documentCell(d)}</td>
              <td>${d.publisher ?? ""}</td>
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}
