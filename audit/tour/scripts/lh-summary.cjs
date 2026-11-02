// Summarise lh-matrix.sh output: median (min-max) per configuration, plus
// whether tour.js / tour.css were requested in each run.
// Usage: node lh-summary.cjs <lhDir>  -> markdown table on stdout
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
const groups = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const key = f.replace(/_\d+\.json$/, "");
  let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { continue; }
  if (j.runtimeError) { (groups[key] ??= []).push({ error: j.runtimeError.code }); continue; }
  const a = j.audits, reqs = a["network-requests"]?.details?.items ?? [];
  (groups[key] ??= []).push({
    perf: Math.round(j.categories.performance.score * 100),
    lcp: a["largest-contentful-paint"].numericValue / 1000,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    requests: reqs.length,
    tour: reqs.filter((r) => /\/tour\.[0-9a-f]+\.(js|css)|\/components\/tour\./.test(r.url)).map((r) => path.basename(r.url.split("?")[0])),
  });
}
const med = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmt = (xs, d) => `${med(xs).toFixed(d)} (${Math.min(...xs).toFixed(d)}-${Math.max(...xs).toFixed(d)})`;
console.log("| Configuration | Runs | Perf | LCP s | TBT ms | CLS | Requests | tour files requested |");
console.log("|---|---|---|---|---|---|---|---|");
for (const key of Object.keys(groups).sort()) {
  const ok = groups[key].filter((r) => !r.error), errs = groups[key].length - ok.length;
  if (!ok.length) { console.log(`| ${key} | 0 (${errs} errors) | | | | | | |`); continue; }
  const tourRuns = ok.filter((r) => r.tour.length).length;
  console.log(`| ${key} | ${ok.length}${errs ? ` (+${errs} errors)` : ""} | ${fmt(ok.map((r) => r.perf), 0)} | ${fmt(ok.map((r) => r.lcp), 2)} | ${fmt(ok.map((r) => r.tbt), 0)} | ${fmt(ok.map((r) => r.cls), 3)} | ${fmt(ok.map((r) => r.requests), 0)} | ${tourRuns}/${ok.length}${tourRuns ? ": " + [...new Set(ok.flatMap((r) => r.tour))].join(", ") : ""} |`);
}
