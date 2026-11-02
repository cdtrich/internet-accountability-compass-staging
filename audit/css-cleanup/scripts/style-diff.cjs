// Computed-style diff of two capture folders (from shoot.cjs).
// Usage: node style-diff.cjs <dirA> <dirB> <out.json>
// Per case: element counts, elements only in A or B, and every changed property
// (element key, pseudo-element, property, value A, value B).
const fs = require("fs"), path = require("path");
const [A, B, OUT] = process.argv.slice(2).map((p) => path.resolve(p));
const parse = (s) => Object.fromEntries(JSON.parse(s));
const result = {};
for (const f of fs.readdirSync(A).filter((f) => f.endsWith(".styles.json")).sort()) {
  const id = f.replace(".styles.json", "");
  if (!fs.existsSync(path.join(B, f))) { result[id] = { error: "missing in B" }; continue; }
  const a = JSON.parse(fs.readFileSync(path.join(A, f))), b = JSON.parse(fs.readFileSync(path.join(B, f)));
  const ka = Object.keys(a.elements), kb = new Set(Object.keys(b.elements));
  const r = { elementsA: ka.length, elementsB: kb.size, onlyInA: ka.filter((k) => !kb.has(k)), onlyInB: [...kb].filter((k) => !(k in a.elements)), changedElements: 0, changes: [] };
  const cache = new Map();
  const props = (t, i) => { const k = (t === a ? "a" : "b") + i; if (!cache.has(k)) cache.set(k, parse(t.table[i])); return cache.get(k); };
  for (const k of ka) {
    if (!kb.has(k)) continue;
    const ea = a.elements[k], eb = b.elements[k];
    const slots = (e, t) => Object.fromEntries(e.map((v, i) => i === 0 ? ["", props(t, v)] : [v.split("=")[0], props(t, +v.split("=")[1])]));
    const sa = slots(ea, a), sb = slots(eb, b);
    let changed = false;
    for (const pseudo of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
      const pa = sa[pseudo] || {}, pb = sb[pseudo] || {};
      for (const p of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
        if (pa[p] !== pb[p]) { changed = true; r.changes.push({ el: k, pseudo: pseudo || undefined, prop: p, a: pa[p] ?? null, b: pb[p] ?? null }); }
      }
    }
    if (changed) r.changedElements++;
  }
  r.changedProperties = r.changes.length;
  result[id] = r;
}
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
for (const [id, r] of Object.entries(result)) console.log(`${id}: ${r.error || `${r.elementsA}/${r.elementsB} elements, only A ${r.onlyInA.length}, only B ${r.onlyInB.length}, changed elements ${r.changedElements}, changed props ${r.changedProperties}`}`);
