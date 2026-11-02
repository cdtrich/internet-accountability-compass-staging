// Network-panel check without Lighthouse: a first visit (webdriver hidden), every
// request's start time vs the load event, and what the initial HTML holds.
// Usage: node network.cjs <siteUrl>
const path = require("path");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage(); p.setDefaultNavigationTimeout(120000);
  await p.setViewport({ width: 1200, height: 800 });
  await p.evaluateOnNewDocument(`Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });`);
  const res = await p.goto(process.argv[2], { waitUntil: "load" });
  const html = await res.text();
  await p.waitForSelector(".iac-tour-card", { timeout: 30000 });
  const r = await p.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const tour = performance.getEntriesByType("resource").filter((e) => /\/tour\.[0-9a-f]+\.(js|css)/.test(e.name))
      .map((e) => ({ file: e.name.split("/").pop(), startMs: Math.round(e.startTime) }));
    return { loadEventEndMs: Math.round(nav.loadEventEnd), tour };
  });
  r.allAfterLoad = r.tour.length === 2 && r.tour.every((t) => t.startMs > r.loadEventEndMs);
  r.initialHtml = {
    // every line that names tour.js (expected: only the lazy import() in the cell)
    tourJsReferences: (html.match(/[^\n]*tour\.[0-9a-f]+\.js[^\n]*/g) || []).map((l) => l.trim()),
    // "/tour." not "tour": d3-contour also contains "tour"
    modulepreloadForTour: /modulepreload[^>]*\/tour\./.test(html),
    linkToTourCss: /<link[^>]*tour\.[0-9a-f]+\.css/.test(html),
    registerFileTourCss: /registerFile\("\.\/tour\.css"/.test(html),
    helpButton: /<button type="button" class="tour-launch"/.test(html),
    dataTour: (html.match(/data-tour="[^"]+"/g) || []),
  };
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
