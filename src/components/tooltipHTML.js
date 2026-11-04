// One tooltip anatomy for every chart (styles: .tt-* in style.css).
// Rows, in order: value, title, context lines, notes, then `extra` (e.g. a sparkline).
// Empty rows are skipped. Text is inserted as given (no escaping), as before.
const filled = (v) => v !== undefined && v !== null && v !== "";

export function tooltipHTML({
  value,
  kind = "score",
  valueColor,
  title,
  titleColor,
  context = [],
  notes = [],
  extra = "",
} = {}) {
  const color = (c) => (c ? ` style="color: ${c};"` : "");
  const rows = [];
  if (filled(value)) {
    const cls = kind === "change" ? "tt-value tt-value--change" : "tt-value";
    rows.push(`<div class="${cls}"${color(valueColor)}>${value}</div>`);
  }
  if (filled(title)) {
    rows.push(`<div class="tt-title"${color(titleColor)}>${title}</div>`);
  }
  for (const c of context.filter(filled)) {
    rows.push(`<div class="tt-context">${c}</div>`);
  }
  for (const n of notes.filter(filled)) {
    rows.push(`<div class="tt-note">${n}</div>`);
  }
  if (filled(extra)) rows.push(extra);
  return rows.join("");
}
