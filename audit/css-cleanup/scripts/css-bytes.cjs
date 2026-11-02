// CSS bytes per page type, measured from two builds: every local stylesheet a
// page links (comments excluded), raw and gzip (-9 and Node's default -6).
// Usage: node css-bytes.cjs <distBefore> <distAfter> <out.json>
const fs = require("fs"), zlib = require("zlib"), path = require("path");
const [A, B, OUT] = process.argv.slice(2).map((p) => path.resolve(p));
const size = (f) => { const b = fs.readFileSync(f); return { raw: b.length, gz9: zlib.gzipSync(b, { level: 9 }).length, gz6: zlib.gzipSync(b).length }; };
const sheets = (dist, page) => {
  const html = fs.readFileSync(path.join(dist, page), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const base = path.dirname(path.join(dist, page));
  const hrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => (m[0].match(/href="([^"]+)"/) || [])[1]);
  return [...new Set(hrefs.filter((h) => h && !/^https?:/.test(h)).map((h) => path.resolve(base, h)))];
};
const sum = (list) => list.reduce((a, s) => ({ raw: a.raw + s.raw, gz9: a.gz9 + s.gz9, gz6: a.gz6 + s.gz6 }), { raw: 0, gz9: 0, gz6: 0 });
const pages = { "top-level (index)": "index.html", "top-level (methodology)": "methodology.html", "country (AFG)": "AFG/index.html", "prototype": "prototypes/radial.html" };
const out = {};
for (const [label, page] of Object.entries(pages)) {
  const r = {};
  for (const [k, dist] of [["before", A], ["after", B]]) {
    const files = sheets(dist, page).map((f) => ({ file: path.relative(dist, f).split(path.sep).join("/"), ...size(f) }));
    r[k] = { styleCss: sum(files.filter((f) => /style\.[0-9a-f]{8}\.css$/.test(f.file))), styleCopies: files.filter((f) => /style\.[0-9a-f]{8}\.css$/.test(f.file)).length, allLocalCss: sum(files), files };
  }
  out[label] = r;
  const d = (x) => `${r.before[x].raw} -> ${r.after[x].raw} raw (${r.after[x].raw - r.before[x].raw}), ${r.before[x].gz9} -> ${r.after[x].gz9} gz9 (${r.after[x].gz9 - r.before[x].gz9}), gz6 ${r.before[x].gz6 - 0} -> ${r.after[x].gz6} (${r.after[x].gz6 - r.before[x].gz6})`;
  console.log(`${label}: style.css x${r.before.styleCopies}: ${d("styleCss")}\n   all local CSS on the page: ${d("allLocalCss")} = ${(100 * (r.after.allLocalCss.gz9 - r.before.allLocalCss.gz9) / r.before.allLocalCss.gz9).toFixed(1)} % gz9`);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
