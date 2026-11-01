// Remove dead rules/selectors from a stylesheet by exact source ranges, so all
// kept text (formatting, comments) stays byte-for-byte unchanged.
// Usage: node prune.cjs <css file> <group> [--write]
// Without --write: prints the plan only.
const fs = require("fs"), path = require("path");
const [file, group, write] = [path.resolve(process.argv[2]), process.argv[3], process.argv[4] === "--write"];
const root = path.resolve(__dirname, "../../..");
const csstree = require(path.join(root, "node_modules/css-tree"));

// Each group: sel(selectorText, line) -> true if that selector is dead;
// kf(name) -> true if that @keyframes is dead.
const FW_COPY_START = 635; // first line of the copied Framework block in the original file
const groups = {
  "1b": {
    sel: (s) => /\.observablehq-pre-|\.hljs-/.test(s) || /^\.(note|tip|warning|caution)\b/.test(s) || /\.plot-d6a7b5\b/.test(s),
    kf: (n) => n === "observablehq-pre-copied",
  },
  "1a": {
    sel: (s, line) => line >= FW_COPY_START && /#observablehq-(footer|sidebar|toc|search)|\.observablehq-(link|secondary-link)|\.observablehq-search-results|\.observablehq--draft/.test(s),
  },
  "toc-ours": {
    sel: (s, line) => line < FW_COPY_START && /\.observablehq-secondary-link/.test(s),
  },
  "unused-ours": {
    sel: (s) => /^#hero-image$|^heading-center$|^\.blog-divider$|#countryButton\b|^\.card \.key$|\.back-to-root\b|^\.img-col$/.test(s),
  },
  "down-arrow": { sel: (s) => /\.down-arrow\b/.test(s), kf: (n) => n === "jumpInfinite" },
  "toggle-switch": { sel: (s) => /^\.toggle-switch-container$|^\.toggle-label(-active)?$|\.switch\b|\.slider\b/.test(s) },
  "fw-utilities": { sel: (s) => /^\.(big|small|red|yellow|green|blue|muted)$/.test(s) },
  "fw-grid-unused": { sel: (s) => /\.grid-cols-2\b|\.grid-colspan-\d|\.grid-rowspan-\d/.test(s) },
};
const g = groups[group];
if (!g) throw new Error("unknown group " + group);
// FW_COPY_START refers to the original file: rules before the copy keep their
// line numbers as long as only lines after them are removed, which holds for
// the commit order 1b -> 1a -> toc-ours (all removals in 1b/1a are below 635).

const src = fs.readFileSync(file, "utf8");
const lineOf = (off) => src.slice(0, off).split("\n").length;
const ast = csstree.parse(src, { positions: true, parseValue: false, parseRulePrelude: true });
const cuts = []; // [start, end] offsets
const plan = [];
// extend a whole-rule cut to the full lines it occupies (leading indent + trailing newline)
const wholeLines = (s, e) => {
  while (s > 0 && (src[s - 1] === " " || src[s - 1] === "\t")) s--;
  if (src[e] === "\r") e++;
  if (src[e] === "\n") e++;
  return [s, e];
};
csstree.walk(ast, {
  enter(node) {
    if (node.type === "Atrule" && node.name === "keyframes" && g.kf) {
      const name = csstree.generate(node.prelude);
      if (g.kf(name)) { cuts.push(wholeLines(node.loc.start.offset, node.loc.end.offset)); plan.push(`L${node.loc.start.line} remove @keyframes ${name}`); }
      return csstree.walk.skip;
    }
    if (node.type !== "Rule" || node.prelude.type !== "SelectorList") return;
    const sels = node.prelude.children.toArray();
    const dead = sels.map((s) => g.sel(csstree.generate(s), node.loc.start.line));
    if (!dead.some(Boolean)) return;
    if (dead.every(Boolean)) {
      cuts.push(wholeLines(node.loc.start.offset, node.loc.end.offset));
      plan.push(`L${node.loc.start.line} remove rule: ${sels.map((s) => csstree.generate(s)).join(", ").slice(0, 120)}`);
      return;
    }
    // Mixed list: cut each run of consecutive dead selectors with its separators.
    for (let i = 0; i < sels.length; i++) {
      if (!dead[i]) continue;
      let j = i; while (j + 1 < sels.length && dead[j + 1]) j++;
      if (j < sels.length - 1) cuts.push([sels[i].loc.start.offset, sels[j + 1].loc.start.offset]); // "a,\n  b,\n  " up to the next kept selector
      else cuts.push([sels[i - 1].loc.end.offset, sels[j].loc.end.offset]); // ",\n  a,\n  b" after the last kept selector
      for (let k = i; k <= j; k++) plan.push(`L${node.loc.start.line} strip selector: ${csstree.generate(sels[k])} (rule keeps ${dead.filter((d) => !d).length})`);
      i = j;
    }
  },
});
// apply cuts, last first
let outText = src;
cuts.sort((a, b) => b[0] - a[0]);
for (let i = 1; i < cuts.length; i++) if (cuts[i][1] > cuts[i - 1][0]) throw new Error("overlapping cuts");
for (const [s, e] of cuts) outText = outText.slice(0, s) + outText.slice(e);
// second pass: drop @media/@container/@supports blocks left empty
for (;;) {
  const a2 = csstree.parse(outText, { positions: true, parseValue: false });
  let empty = null;
  csstree.walk(a2, { visit: "Atrule", enter(n) { if (!empty && n.block && n.name !== "keyframes" && n.block.children.isEmpty) empty = n; } });
  if (!empty) break;
  let [s, e] = [empty.loc.start.offset, empty.loc.end.offset];
  while (s > 0 && (outText[s - 1] === " " || outText[s - 1] === "\t")) s--;
  if (outText[e] === "\r") e++; if (outText[e] === "\n") e++;
  plan.push(`(after cuts) remove empty @${empty.name} ${csstree.generate(empty.prelude)}`);
  outText = outText.slice(0, s) + outText.slice(e);
}
console.log(plan.join("\n"));
console.log(`\n${plan.length} actions; ${src.length} -> ${outText.length} chars; lines ${src.split("\n").length} -> ${outText.split("\n").length}`);
if (write) fs.writeFileSync(file, outText);
