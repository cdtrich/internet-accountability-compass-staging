// Where is a class/id token used in a class or id CONTEXT (not just as a word)?
// Usage: node classes.cjs <repoRoot> <distDir> token1 token2 ...
// Contexts: class="…"/'…'/`…`, id="…", .attr("class"|"id", …), .classed("…"),
// classList.add/remove/toggle/contains/replace(…), className = …,
// selector strings in querySelector(All)/select(All)/closest("…").
// Hits inside <!-- --> or /* */ // comments are reported separately.
const fs = require("fs"), path = require("path");
const [root, dist, ...tokens] = process.argv.slice(2);
const files = [];
const walk = (d, filter) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!/node_modules|\.observablehq/.test(p)) walk(p, filter); } else if (filter(p)) files.push(p); } };
walk(path.join(root, "src"), (p) => /\.(md|js)$/.test(p));
files.push(path.join(root, "nav-html.js"));
walk(dist, (p) => /\.html$/.test(p) || (/[\\/]_import[\\/].*\.js$/.test(p)));
const ctxRe = [
  /class(?:Name)?\s*=\s*("[^"]*"|'[^']*'|`[^`]*`|\{[^}]*\})/g,
  /\bid\s*=\s*("[^"]*"|'[^']*'|`[^`]*`)/g,
  /\.attr\(\s*["'](?:class|id)["']\s*,([^)]*\))/g,
  /\.classed\(\s*("[^"]*"|'[^']*'|`[^`]*`)/g,
  /classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g,
  /className\s*(?:\+?=|:)\s*([^;\n]*)/g,
  /(?:querySelector(?:All)?|selectAll|select|closest|getElementById)\(\s*("[^"]*"|'[^']*'|`[^`]*`)/g,
];
const strip = (s) => s.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " ")).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`\\])\/\/.*$/gm, (m, a) => a + " ".repeat(m.length - a.length));
const kind = (f) => {
  const r = path.relative(root, f).replace(/\\/g, "/");
  if (r.startsWith("..") || path.isAbsolute(r)) return "dist:" + path.relative(dist, f).replace(/\\/g, "/").replace(/^[A-Z]{3}\//, "<ISO3>/");
  if (/^src\/[A-Z]{3}\//.test(r)) return "src:<ISO3>/index.md";
  return "src:" + r;
};
const res = Object.fromEntries(tokens.map((t) => [t, { live: new Set(), commented: new Set(), dynamic: new Set() }]));
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8"), live = strip(raw);
  for (const [txt, bucket] of [[live, "live"], [raw, "commented"]]) {
    for (const re of ctxRe) for (const m of txt.matchAll(re)) {
      const s = m[1] || m[0];
      for (const t of tokens) {
        const name = t.replace(/^[.#]/, "");
        const word = new RegExp(`(^|[^\\w-])${name.replace(/[-]/g, "\\-")}($|[^\\w-])`);
        if (word.test(s)) { if (bucket === "live") res[t].live.add(kind(f)); else if (!res[t].live.has(kind(f))) res[t].commented.add(kind(f)); }
        else if (bucket === "live") {
          // runtime-built: a prefix of the token followed by ${ or a quote + concatenation
          const parts = name.split("-");
          for (let i = parts.length - 1; i > 0; i--) { const p = parts.slice(0, i).join("-") + "-"; if (s.includes(p + "${") || new RegExp(p.replace(/-/g, "\\-") + "[\"'`]\\s*\\+").test(s)) { res[t].dynamic.add(`${kind(f)} (${p}…)`); break; } }
        }
      }
    }
  }
}
for (const t of tokens) {
  const r = res[t];
  for (const k of r.live) r.commented.delete(k);
  console.log(`${t}\n   live: ${[...r.live].join(", ") || "—"}\n   only in comments: ${[...r.commented].join(", ") || "—"}\n   dynamic prefix: ${[...r.dynamic].join(", ") || "—"}`);
}
