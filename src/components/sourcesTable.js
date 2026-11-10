import { html } from "npm:htl";
import { SOURCE_CONFIG } from "./sourcesLegend_v2.js";

const CONFIG = new Map(SOURCE_CONFIG.map((c) => [c.fullType, c]));

function typeTile(type) {
  const cfg = CONFIG.get(type);
  if (!cfg) return html`<span>${type}</span>`;
  const icon = document.createElement("span");
  icon.className = "src-tile-icon";
  icon.innerHTML = cfg.icon; // static, trusted SVG from SOURCE_CONFIG
  return html`<span
    class="src-tile"
    style="--tile: ${cfg.color}; --tile-text: ${cfg.textColor}"
    >${icon}${cfg.label}</span
  >`;
}

function documentCell(d) {
  const ok = d.url && String(d.url).trim() !== "NA";
  const title = ok
    ? html`<a href="${d.url}" target="_blank" rel="noopener">${d.title}</a>`
    : html`<span>${d.title}</span>`;
  return html`${title}${d.publisher
    ? html`<div class="src-publisher">${d.publisher}</div>`
    : ""}`;
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
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (d) =>
            html`<tr>
              <td>${d.NAME_ENGL}</td>
              <td>${d.pillar_txt}</td>
              <td>${typeTile(d.type)}</td>
              <td>${documentCell(d)}</td>
            </tr>`,
        )}
      </tbody>
    </table>
  </div>`;
}
