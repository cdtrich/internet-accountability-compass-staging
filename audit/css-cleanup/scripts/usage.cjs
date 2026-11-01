// Class/id usage of style.css selectors in reachable sources, per page type.
// Usage: node usage.cjs <repoRoot>
const fs = require("fs"), path = require("path");
const root = process.argv[2];
const csstree = require(path.join(root, "node_modules/css-tree"));
const src = path.join(root, "src");

// strip // line comments, /* */ and <!-- --> so commented-out imports/markup don't count
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function closure(entries) {
  const seen = new Set(), stack = [...entries];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f) || !fs.existsSync(f)) continue;
    seen.add(f);
    const txt = stripComments(fs.readFileSync(f, "utf8"));
    for (const m of txt.matchAll(/(?:import\s[^"'`]*?from\s*|import\s*\(\s*|import\s+)["']([^"']+\.js)["']/g)) {
      if (!m[1].startsWith(".") && !m[1].startsWith("/")) continue;
      const base = m[1].startsWith("/") ? path.join(src, m[1]) : path.resolve(path.dirname(f), m[1]);
      stack.push(base);
    }
  }
  return seen;
}

const top = ["index", "countries", "directions", "resources", "perspectives", "methodology"].map((p) => path.join(src, p + ".md"));
const country = [path.join(src, "1countryPageTemplate.md"), path.join(src, "AFG/index.md")];
const proto = [path.join(src, "prototypes/radial.md")];
const extra = [path.join(root, "nav-html.js"), path.join(root, "observablehq.config.js")]; // every page
const sets = { top: closure([...top, ...extra]), country: closure([...country, ...extra]), proto: closure(proto) };
const allJs = fs.readdirSync(path.join(src, "components")).filter((f) => f.endsWith(".js")).map((f) => path.join(src, "components", f));
const reachable = new Set([...sets.top, ...sets.country]);

const rel = (f) => path.relative(root, f).replace(/\\/g, "/");
console.log("## modules reachable from top-level pages\n" + [...sets.top].filter((f) => f.endsWith(".js")).map(rel).sort().join("\n"));
console.log("\n## modules reachable from country pages\n" + [...sets.country].filter((f) => f.endsWith(".js")).map(rel).sort().join("\n"));
console.log("\n## component modules NOT reachable from live pages\n" + allJs.filter((f) => !reachable.has(f)).map(rel).join("\n"));

// tokens: any identifier-ish word appearing in the (comment-stripped) text
const tok = (files) => {
  const t = new Map();
  for (const f of files) {
    const txt = stripComments(fs.readFileSync(f, "utf8"));
    for (const m of txt.matchAll(/[A-Za-z_][\w-]*/g)) { if (!t.has(m[0])) t.set(m[0], new Set()); t.get(m[0]).add(rel(f)); }
  }
  return t;
};
const T = { top: tok(sets.top), country: tok(sets.country), unreach: tok(allJs.filter((f) => !reachable.has(f))) };
// also the raw text of each token's prefixes, to catch runtime-built names like `pillar-${key}` or "zoom-button-" + x
const allText = [...reachable].map((f) => stripComments(fs.readFileSync(f, "utf8"))).join("\n");

const css = fs.readFileSync(path.join(src, "style.css"), "utf8");
const ast = csstree.parse(css, { positions: true, parseValue: false });
const rows = [];
csstree.walk(ast, {
  visit: "Rule",
  enter(node) {
    node.prelude.children && node.prelude.children.forEach((sel) => {
      const names = [];
      csstree.walk(sel, (n) => {
        if (n.type === "ClassSelector") names.push("." + n.name);
        if (n.type === "IdSelector") names.push("#" + n.name);
      });
      if (!names.length) return;
      const s = csstree.generate(sel);
      const info = names.map((n) => {
        const w = n.slice(1);
        const inTop = T.top.has(w), inCountry = T.country.has(w), inUnreach = T.unreach.has(w);
        // dynamic prefix: e.g. "pillar-" literal followed by ${ or quote+
        const parts = w.split("-");
        let prefix = null;
        for (let i = parts.length - 1; i > 0 && !prefix; i--) {
          const p = parts.slice(0, i).join("-") + "-";
          if (new RegExp(p.replace(/[-]/g, "\\-") + "(\\$\\{|[\"'`]\\s*\\+)").test(allText)) prefix = p;
        }
        return { n, inTop, inCountry, inUnreach, prefix };
      });
      rows.push({ line: node.loc.start.line, sel: s, info });
    });
  },
});
const fwRe = /^[.#](observablehq|hljs|plot-|inputs-|katex)/;
console.log("\n## selectors with a class/id token found in NO reachable source (fw/runtime classes excluded)");
for (const r of rows) {
  const ours = r.info.filter((i) => !fwRe.test(i.n));
  const missing = ours.filter((i) => !i.inTop && !i.inCountry);
  if (missing.length) console.log(`${r.line}\t${r.sel}\t-- missing: ${missing.map((i) => i.n + (i.inUnreach ? "(only in unreachable module)" : "") + (i.prefix ? `(dynamic prefix "${i.prefix}" exists)` : "")).join(", ")}`);
}
console.log("\n## selectors whose tokens appear ONLY in country-page sources");
for (const r of rows) {
  const ours = r.info.filter((i) => !fwRe.test(i.n));
  if (ours.length && ours.every((i) => i.inCountry && !i.inTop)) console.log(`${r.line}\t${r.sel}`);
}
console.log("\n## selectors whose tokens appear ONLY in top-level sources");
for (const r of rows) {
  const ours = r.info.filter((i) => !fwRe.test(i.n));
  if (ours.length && ours.every((i) => i.inTop && !i.inCountry)) console.log(`${r.line}\t${r.sel}`);
}
