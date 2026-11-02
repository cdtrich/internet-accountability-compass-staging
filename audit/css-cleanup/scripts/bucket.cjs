// Project bucket-1 removals on a scratch copy of style.css; report rules and sizes.
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = process.argv[2];
const csstree = require(path.join(root, "node_modules/css-tree"));
const css = fs.readFileSync(path.join(root, "src/style.css"), "utf8");
const B = {
  "1a-layout": /#observablehq-(footer|sidebar|toc|search)|\.observablehq-(link|secondary-link)|\.observablehq-search-results|\.observablehq--draft/,
  "1b-code": /\.observablehq-pre-|\.hljs-|^@keyframes observablehq-pre-copied/,
  "1b-notes": /^\.(note|tip|warning|caution)\b/,
};
const gz = (s) => zlib.gzipSync(s, { level: 9 }).length;
function project(which) {
  const ast = csstree.parse(css, { positions: true, parseValue: false });
  const log = [];
  csstree.walk(ast, {
    visit: "Atrule",
    enter(node, item, list) {
      if (node.name === "keyframes" && list && which.some((k) => B[k].test("@keyframes " + csstree.generate(node.prelude)))) { log.push(`L${node.loc.start.line} remove @keyframes ${csstree.generate(node.prelude)}`); list.remove(item); }
    },
  });
  csstree.walk(ast, {
    visit: "Rule",
    enter(node, item, list) {
      const sels = node.prelude.children;
      const dead = [];
      sels.forEach((s, it) => { const t = csstree.generate(s); if (which.some((k) => B[k].test(t))) dead.push([it, t]); });
      if (!dead.length) return;
      if (dead.length === sels.size) { log.push(`L${node.loc.start.line} remove rule: ${dead.map((d) => d[1]).join(", ").slice(0, 110)}`); list.remove(item); }
      else { log.push(`L${node.loc.start.line} strip from list: ${dead.map((d) => d[1]).join(", ").slice(0, 110)} (keeps ${sels.size - dead.length})`); dead.forEach(([it]) => sels.remove(it)); }
    },
  });
  // drop now-empty @media/@container
  csstree.walk(ast, { visit: "Atrule", enter(node, item, list) { if (node.block && node.name !== "keyframes" && node.block.children.isEmpty && list) { log.push(`L${node.loc.start.line} remove empty @${node.name}`); list.remove(item); } } });
  return { out: csstree.generate(ast), log };
}
const base = csstree.generate(csstree.parse(css, { parseValue: false }));
console.log(`style.css raw ${css.length} B, gzip ${gz(css)} | minified ${base.length} B, gzip ${gz(base)}`);
for (const which of [["1a-layout"], ["1b-code"], ["1b-notes"], ["1a-layout", "1b-code", "1b-notes"]]) {
  const { out, log } = project(which);
  console.log(`\n### ${which.join(" + ")}: minified ${base.length} -> ${out.length} (-${base.length - out.length} B), gzip ${gz(base)} -> ${gz(out)} (-${gz(base) - gz(out)} B)`);
  if (which.length === 1) log.forEach((l) => console.log("  " + l));
}
