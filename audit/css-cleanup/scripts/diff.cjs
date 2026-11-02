// Pixel diff of two screenshot folders, decoded in Chrome's canvas (no new deps).
// Usage: node diff.cjs <dirA> <dirB> <outDir>
// Writes <outDir>/diff-summary.json and, for each pair that differs, diff_<name>.png
// (differing pixels red over a faded copy of A).
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const [A, B, OUT] = process.argv.slice(2).map((p) => path.resolve(p));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const page = await browser.newPage();
  await page.goto("about:blank");
  const names = fs.readdirSync(A).filter((f) => f.endsWith(".png")).sort();
  const results = [];
  for (const n of names) {
    if (!fs.existsSync(path.join(B, n))) { results.push({ name: n, error: "missing in B" }); continue; }
    const a = "data:image/png;base64," + fs.readFileSync(path.join(A, n)).toString("base64");
    const b = "data:image/png;base64," + fs.readFileSync(path.join(B, n)).toString("base64");
    const r = await page.evaluate(async (a, b) => {
      const load = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const res = { wA: ia.width, hA: ia.height, wB: ib.width, hB: ib.height };
      const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
      const ctx = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
      const da = ctx(ia), db = ctx(ib);
      let diff = 0, big = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      const out = new OffscreenCanvas(w, h), ox = out.getContext("2d"), od = ox.createImageData(w, h);
      for (let p = 0; p < da.length; p += 4) {
        const m = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2]), Math.abs(da[p + 3] - db[p + 3]));
        if (m > 0) {
          diff++; if (m > 32) big++;
          const i = p / 4, x = i % w, y = (i / w) | 0;
          if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
          od.data[p] = 255; od.data[p + 1] = 0; od.data[p + 2] = 0; od.data[p + 3] = 255;
        } else { const g = 255 - (255 - (da[p] + da[p + 1] + da[p + 2]) / 3) * 0.25; od.data[p] = od.data[p + 1] = od.data[p + 2] = g; od.data[p + 3] = 255; }
      }
      Object.assign(res, { diff, big, total: w * h, bbox: diff ? [x0, y0, x1, y1] : null });
      if (diff) { ox.putImageData(od, 0, 0); const blob = await out.convertToBlob({ type: "image/png" }); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); res.png = btoa(s); }
      return res;
    }, a, b);
    if (r.png) { fs.writeFileSync(path.join(OUT, "diff_" + n), Buffer.from(r.png, "base64")); delete r.png; }
    results.push({ name: n, ...r });
    process.stderr.write(`${n}: ${r.diff} px${r.wA !== r.wB || r.hA !== r.hB ? ` SIZE ${r.wA}x${r.hA} vs ${r.wB}x${r.hB}` : ""}\n`);
  }
  fs.writeFileSync(path.join(OUT, "diff-summary.json"), JSON.stringify(results, null, 1));
  const bad = results.filter((r) => r.error || r.diff);
  console.log(`${results.length} pairs, ${results.length - bad.length} identical, ${bad.length} differ`);
  await browser.close();
})();
