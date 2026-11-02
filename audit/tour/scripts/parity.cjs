// Layout parity, parent build vs tour build: every element box in #observablehq-main
// (minus the tour's own mount/cell) and the header nav, plus layout-shift entries,
// with the tour not triggered (?tour=0) and forced open (?tour=1).
// Usage: node parity.cjs <parentUrl> <tourUrl>
const path = require("path");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const [PARENT, TOUR] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CLS = `window.__shifts = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ value: e.value, recent: e.hadRecentInput, nodes: e.sources?.map((s) => s.node?.className || s.node?.nodeName) }); }).observe({ type: "layout-shift", buffered: true });`;
async function snap(b, url, w, h) {
  const p = await b.newPage(); p.setDefaultNavigationTimeout(120000);
  await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(CLS);
  await p.goto(url, { waitUntil: "load" }); await sleep(6000);
  const r = await p.evaluate(() => {
    const skip = (el) => el.closest(".tour-mount, .iac-tour") || el.classList.contains("tour-launch") || el.matches(".observablehq--block:empty") && el.previousSibling?.nodeType === 8;
    const boxes = [...document.querySelectorAll("#observablehq-main *, #observablehq-header nav *")]
      .filter((el) => !skip(el) && !(el.tagName === "DIV" && el.className === "observablehq observablehq--block" && !el.childElementCount && !el.textContent.trim()))
      .map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName}.${typeof el.className === "string" ? el.className : ""} ${Math.round(r.left)},${Math.round(r.top + scrollY)},${Math.round(r.width)}x${Math.round(r.height)}`; });
    return { scrollHeight: document.documentElement.scrollHeight, boxes, shifts: window.__shifts, cls: window.__shifts.filter((s) => !s.recent).reduce((a, s) => a + s.value, 0) };
  });
  await p.close(); return r;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  for (const [w, h] of [[1200, 800], [375, 667]]) {
    const a = await snap(b, PARENT + "?tour=0", w, h), t = await snap(b, TOUR + "?tour=0", w, h), f = await snap(b, TOUR + "?tour=1", w, h);
    // featured-post previews and map tooltips are content-driven; compare everything structurally
    const diff = a.boxes.length === t.boxes.length ? a.boxes.map((x, i) => x === t.boxes[i] ? null : [x, t.boxes[i]]).filter(Boolean) : ["count", a.boxes.length, t.boxes.length];
    console.log(`${w}x${h}: elements ${a.boxes.length}/${t.boxes.length}, differing boxes ${diff.length}, scrollHeight ${a.scrollHeight}/${t.scrollHeight}, CLS parent ${a.cls.toFixed(4)}, tour off ${t.cls.toFixed(4)}, tour forced open ${f.cls.toFixed(4)}`);
    if (diff.length) { const A = new Set(a.boxes), T = new Set(t.boxes); console.log("  only in parent:", JSON.stringify(a.boxes.filter((x) => !T.has(x))), "only in tour:", JSON.stringify(t.boxes.filter((x) => !A.has(x)))); }
    for (const [name, r] of [["parent", a], ["tour off", t], ["tour forced", f]]) if (r.shifts.length) console.log(`  shifts ${name}:`, JSON.stringify(r.shifts.map((s) => [+s.value.toFixed(4), s.nodes?.join("|")])));
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
