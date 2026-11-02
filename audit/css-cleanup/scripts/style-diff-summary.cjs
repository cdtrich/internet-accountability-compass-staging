// Compact a style-diff.json: per case, element counts, and per property the
// number of changed elements plus the distinct (before -> after) value pairs.
// Usage: node style-diff-summary.cjs <style-diff.json> <out.json>
const fs = require("fs");
const [inp, out] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(inp, "utf8"));
const res = {};
for (const [id, r] of Object.entries(d)) {
  if (r.error) { res[id] = r; continue; }
  const props = {};
  for (const c of r.changes) {
    const p = (props[c.prop + (c.pseudo ? " " + c.pseudo : "")] ??= { elements: 0, values: {} });
    p.elements++;
    const v = `${c.a} -> ${c.b}`.replace(/\s+/g, " ");
    p.values[v] = (p.values[v] || 0) + 1;
  }
  res[id] = { elementsA: r.elementsA, elementsB: r.elementsB, onlyInA: r.onlyInA, onlyInB: r.onlyInB, changedElements: r.changedElements, changedProperties: r.changedProperties, byProperty: props };
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(`${inp} -> ${out} (${fs.statSync(out).size} bytes)`);
