// Compare top-level blocks of src/style.css against Framework's shipped CSS.
// Usage: node compare.cjs <repoRoot> > out.json
const fs = require("fs"), path = require("path");
const root = process.argv[2];
const csstree = require(path.join(root, "node_modules/css-tree"));
const FW = path.join(root, "node_modules/@observablehq/framework/dist/style");
const fwFiles = process.env.FW_FILE ? [process.env.FW_FILE] : ["global.css", "layout.css", "grid.css", "note.css", "card.css", "inspector.css", "plot.css", "syntax-light.css", "abstract-light.css", "theme-air.css"];

const norm = (s) => s.replace(/\s+/g, " ").trim().replace(/(^|[^:]):(before|after|marker|placeholder)\b/g, "$1::$2");

// Flatten a stylesheet into entries {ctx, sel, prop, value, important, line, file}
function flatten(file, label) {
  const src = fs.readFileSync(file, "utf8");
  const ast = csstree.parse(src, { positions: true, parseValue: false, parseCustomProperty: false });
  const entries = [];
  const blocks = []; // top-level blocks
  function walkRules(list, ctx, top) {
    list.forEach((node) => {
      if (node.type === "Rule") {
        const sels = node.prelude.type === "SelectorList"
          ? node.prelude.children.toArray().map((s) => norm(csstree.generate(s)))
          : [norm(csstree.generate(node.prelude))];
        const decls = [];
        node.block.children.forEach((d) => {
          if (d.type !== "Declaration") return;
          decls.push({ prop: d.property.toLowerCase(), value: norm(csstree.generate(d.value)), important: !!d.important });
        });
        for (const sel of sels) for (const d of decls)
          entries.push({ ctx, sel, ...d, line: node.loc.start.line, file: label });
        if (top) top.rules.push({ ctx, sels, decls, line: node.loc.start.line });
      } else if (node.type === "Atrule") {
        const name = "@" + node.name + (node.prelude ? " " + norm(csstree.generate(node.prelude)) : "");
        if (node.name === "keyframes") {
          const body = node.block ? norm(csstree.generate(node.block)) : "";
          entries.push({ ctx, sel: name, prop: "<keyframes>", value: body, important: false, line: node.loc.start.line, file: label });
          if (top) top.rules.push({ ctx, sels: [name], decls: [{ prop: "<keyframes>", value: body }], line: node.loc.start.line });
        } else if (node.block) {
          walkRules(node.block.children, ctx ? ctx + " " + name : name, top);
        } else if (node.name !== "import") {
          entries.push({ ctx, sel: name, prop: "<atrule>", value: "", line: node.loc.start.line, file: label });
        }
      }
    });
  }
  ast.children.forEach((node) => {
    const top = { start: node.loc.start.line, end: node.loc.end.line, type: node.type, rules: [] };
    walkRules(new csstree.List().fromArray([node]), "", top);
    blocks.push(top);
  });
  return { entries, blocks };
}

const fw = [];
for (const f of fwFiles) fw.push(...flatten(path.isAbsolute(f) ? f : path.join(FW, f), path.basename(f)).entries);
// index: ctx|sel|prop -> list (last one wins in cascade, keep all)
const fwIdx = new Map(), fwSel = new Map();
for (const e of fw) {
  const k = e.ctx + "|" + e.sel + "|" + e.prop;
  if (!fwIdx.has(k)) fwIdx.set(k, []);
  fwIdx.get(k).push(e);
  const ks = e.ctx + "|" + e.sel;
  if (!fwSel.has(ks)) fwSel.set(ks, []);
  fwSel.get(ks).push(e);
}

const ours = flatten(path.join(root, "src/style.css"), "style.css");
const out = [];
for (const b of ours.blocks) {
  if (!b.rules.length) continue;
  for (const r of b.rules) {
    const res = { block: [b.start, b.end], line: r.line, ctx: r.ctx, sels: r.sels, decls: [] };
    let same = 0, diff = 0, absent = 0;
    for (const sel of r.sels) {
      for (const d of r.decls) {
        const hits = fwIdx.get(r.ctx + "|" + sel + "|" + d.prop);
        if (!hits) { absent++; res.decls.push({ sel, prop: d.prop, ours: d.value + (d.important ? " !important" : ""), fw: null }); continue; }
        const last = hits[hits.length - 1];
        const fwv = last.value + (last.important ? " !important" : "");
        const ov = d.value + (d.important ? " !important" : "");
        if (fwv === ov) same++; else diff++;
        res.decls.push({ sel, prop: d.prop, ours: ov, fw: fwv, fwAt: last.file + ":" + last.line });
      }
      // Framework declarations for same selector that ours lacks
      const fwAll = fwSel.get(r.ctx + "|" + sel) || [];
      const missing = fwAll.filter((e) => !r.decls.some((d) => d.prop === e.prop));
      if (missing.length) res.fwOnly = (res.fwOnly || []).concat(missing.map((e) => `${sel} { ${e.prop}: ${e.value} } @${e.file}:${e.line}`));
    }
    res.status = absent === 0 && diff === 0 ? "identical" : same === 0 && diff === 0 ? "absent" : "modified";
    res.counts = { same, diff, absent };
    out.push(res);
  }
}
process.stdout.write(JSON.stringify(out, null, 1));
