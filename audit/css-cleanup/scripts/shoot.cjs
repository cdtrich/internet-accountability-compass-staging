// Reduced screenshot matrix + computed-style dumps, for before/after diffs.
// Usage: node shoot.cjs <outDir> [siteOrigin=http://127.0.0.1:8080] [harnessOrigin=http://127.0.0.1:8081]
// Writes <outDir>/<case>_sNN.png (first viewport + up to 2 scroll positions),
// <outDir>/<case>.styles.json (computed styles of every rendered element) and _log.json.
// Env: CASES=home_1200x800,AUS_375x667 to run a subset.
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const out = path.resolve(process.argv[2]);
const SITE = process.argv[3] || "http://127.0.0.1:8080";
const HARNESS = process.argv[4] || "http://127.0.0.1:8081";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// Matrix: perspectives is the top-level page with a TOC (blog TOC, own 769-1100px
// layout), so it alone gets 768x1024. Iframe only for home and AUS at 375.
const pages = { home: "/", methodology: "/methodology", perspectives: "/perspectives", AUS: "/AUS/", MHL: "/MHL/" };
const cases = [];
for (const name of Object.keys(pages)) {
  const sizes = [[1200, 800], [375, 667]];
  if (name === "perspectives") sizes.push([768, 1024]);
  for (const [w, h] of sizes) cases.push({ name, w, h, mode: "standalone" });
}
cases.push({ name: "home", w: 375, h: 667, mode: "iframe" }, { name: "AUS", w: 375, h: 667, mode: "iframe" });
// Computed styles only (no PNGs): more page types, more country pages, and
// home under print media (covers the @media print split).
Object.assign(pages, { countries: "/countries", directions: "/directions", resources: "/resources", prototype: "/prototypes/radial", AFG: "/AFG/", DNK: "/DNK/", BRA: "/BRA/" });
for (const name of ["countries", "directions", "resources", "prototype", "AFG", "DNK", "BRA"])
  for (const [w, h] of [[1200, 800], [375, 667]]) cases.push({ name, w, h, mode: "styles" });
cases.push({ name: "home", w: 1200, h: 800, mode: "print" });
const caseId = (c) => `${c.mode === "iframe" ? "iframe_" : c.mode === "print" ? "print_" : ""}${c.name}_${c.w}x${c.h}`;

const SETTLE = 5000; // with the 1000x page clock, d3 transitions end within the first frames
// Deterministic raster: synchronous image decode, fixed colour profile, software
// raster; scrollbars visible (Puppeteer hides them by default).
const LAUNCH = { executablePath: CHROME, headless: true, ignoreDefaultArgs: ["--hide-scrollbars"], args: ["--force-device-scale-factor=1", "--font-render-hinting=none", "--disable-checker-imaging", "--force-color-profile=srgb", "--disable-gpu", "--disable-partial-raster"] };
fs.mkdirSync(out, { recursive: true });

// Determinism, identical for every run (before and after): no CSS animations or
// transitions, seeded Math.random, reduced motion. The page clock runs 1000×
// fast, so d3 transitions (d3-timer reads performance.now) end on their first
// frames; delays still wait on setTimeout, hence SETTLE + stableShot.
const FREEZE = `(() => {
  let s = 42; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pn = performance.now.bind(performance), t0 = pn(), d0 = Date.now();
  performance.now = () => t0 + (pn() - t0) * 1000;
  Date.now = () => d0 + (pn() - t0) * 1000;
  const css = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
  const add = () => { const st = document.createElement("style"); st.id = "__freeze"; st.textContent = css; (document.head || document.documentElement).appendChild(st); };
  if (document.documentElement) add(); else document.addEventListener("readystatechange", add, { once: true });
})();`;
async function prepare(page) {
  await page.evaluateOnNewDocument(FREEZE);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
}
// Scroll through the document so lazy images load, then back to top.
async function scrollThrough(frame) {
  await frame.evaluate(async () => {
    const step = Math.max(200, innerHeight - 50);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
    scrollTo(0, 0);
  });
}
const scrollAndPaint = (frame, y) => frame.evaluate((y) => new Promise((r) => { scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150))); }), y);
// Screenshot until two consecutive captures 1.5 s apart are byte-identical
// (entry animations are JS-timed and can outlast any fixed settle time).
async function stableShot(take) {
  let prev = await take(), tries = 1;
  for (; tries < 12; tries++) {
    await new Promise((r) => setTimeout(r, 1500));
    const cur = await take();
    if (Buffer.compare(prev, cur) === 0) return { buf: cur, tries, stable: true };
    prev = cur;
  }
  return { buf: prev, tries, stable: false };
}

// Runs in the page: computed style of every rendered element (all properties),
// plus ::before/::after where they generate content. Identical style strings are
// interned, so thousands of chart marks cost one entry.
function dumpStyles() {
  const table = [], index = new Map(), elements = {};
  const intern = (cs) => {
    // sorted: Chrome enumerates custom properties in no fixed order
    const names = []; for (let i = 0; i < cs.length; i++) names.push(cs[i]);
    const s = JSON.stringify(names.sort().map((p) => [p, cs.getPropertyValue(p)]));
    if (!index.has(s)) { index.set(s, table.length); table.push(s); }
    return index.get(s);
  };
  const skip = new Set(["HEAD", "SCRIPT", "STYLE", "LINK", "META", "TITLE", "NOSCRIPT", "TEMPLATE"]);
  const walk = (el, key) => {
    if (skip.has(el.tagName.toUpperCase())) return;
    const entry = [intern(getComputedStyle(el))];
    for (const pseudo of ["::before", "::after"]) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content && ps.content !== "none" && ps.content !== "normal") entry.push(pseudo + "=" + intern(ps));
    }
    elements[key] = entry;
    const seen = {};
    for (const c of el.children) {
      const t = c.tagName.toLowerCase();
      seen[t] = (seen[t] || 0) + 1;
      walk(c, `${key}>${t}${c.id ? "#" + c.id : ""}[${seen[t]}]`);
    }
  };
  walk(document.documentElement, "html");
  return { table, elements };
}

// Dump computed styles until two consecutive dumps 1.5 s apart are identical.
async function stableDump(frame) {
  let prev = JSON.stringify(await frame.evaluate(dumpStyles)), tries = 1;
  for (; tries < 8; tries++) {
    await new Promise((r) => setTimeout(r, 1500));
    const cur = JSON.stringify(await frame.evaluate(dumpStyles));
    if (cur === prev) return { json: cur, dumpTries: tries, dumpStable: true };
    prev = cur;
  }
  return { json: prev, dumpTries: tries, dumpStable: false };
}

async function runCase(browser, c, log) {
  const id = caseId(c);
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await prepare(page);
  let frame, shoot;
  if (c.mode === "styles" || c.mode === "print") {
    await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1, isMobile: c.w < 500, hasTouch: c.w < 500 });
    await page.goto(SITE + pages[c.name], { waitUntil: "networkidle0", timeout: 120000 });
    frame = page.mainFrame();
    await frame.evaluate(() => document.fonts.ready);
    await scrollThrough(frame);
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 60000 });
    await new Promise((r) => setTimeout(r, SETTLE));
    if (c.mode === "print") { await page.emulateMediaType("print"); await new Promise((r) => setTimeout(r, SETTLE)); }
    const d = await stableDump(frame);
    fs.writeFileSync(path.join(out, `${id}.styles.json`), d.json);
    const dims = await frame.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.documentElement.scrollHeight]);
    const n = JSON.parse(d.json);
    log.push({ id, ...c, dumpTries: d.dumpTries, dumpStable: d.dumpStable, scrollW: dims[0], clientW: dims[1], scrollH: dims[2], elements: Object.keys(n.elements).length, uniqueStyles: n.table.length, errors: [...new Set(errors)] });
    await page.close();
    return;
  }
  if (c.mode === "standalone") {
    await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1, isMobile: c.w < 500, hasTouch: c.w < 500 });
    await page.goto(SITE + pages[c.name], { waitUntil: "networkidle0", timeout: 120000 });
    frame = page.mainFrame();
    shoot = () => page.screenshot();
  } else {
    // cross-origin harness with the production embed markup
    await page.setViewport({ width: c.w + 40, height: c.h + 40, deviceScaleFactor: 1 });
    await page.goto(`${HARNESS}/harness.html?w=${c.w}&h=${c.h}&src=${encodeURIComponent(SITE + pages[c.name])}`, { waitUntil: "networkidle0", timeout: 120000 });
    frame = page.frames().find((f) => f !== page.mainFrame());
    const box = await page.$("#box");
    shoot = () => box.screenshot();
  }
  await frame.evaluate(() => document.fonts.ready);
  await scrollThrough(frame);
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 60000 });
  await new Promise((r) => setTimeout(r, SETTLE));
  const first = await stableShot(shoot);
  fs.writeFileSync(path.join(out, `${id}_s00.png`), first.buf);
  // Up to two more positions: one viewport down, and the middle of the document.
  const [scrollH, viewH] = await frame.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
  const maxY = Math.max(0, scrollH - viewH);
  const ys = [...new Set([viewH, Math.round(scrollH / 2)].map((y) => Math.min(y, maxY)))].filter((y) => y > 0);
  for (const [i, y] of ys.entries()) {
    await scrollAndPaint(frame, y);
    fs.writeFileSync(path.join(out, `${id}_s${String(i + 1).padStart(2, "0")}.png`), await shoot());
  }
  await scrollAndPaint(frame, 0);
  const topUnchanged = Buffer.compare(first.buf, await shoot()) === 0; // nothing re-rendered while scrolling
  const d = await stableDump(frame);
  fs.writeFileSync(path.join(out, `${id}.styles.json`), d.json);
  const styles = JSON.parse(d.json);
  const dims = await frame.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth, document.documentElement.scrollHeight]);
  log.push({ id, ...c, positions: [0, ...ys], tries: first.tries, stable: first.stable, topUnchanged, dumpTries: d.dumpTries, dumpStable: d.dumpStable, scrollW: dims[0], clientW: dims[1], scrollH: dims[2], elements: Object.keys(styles.elements).length, uniqueStyles: styles.table.length, errors: [...new Set(errors)] });
  await page.close();
}

(async () => {
  const only = process.env.CASES ? process.env.CASES.split(",") : null;
  const log = [];
  let browser = await puppeteer.launch(LAUNCH);
  for (const c of cases) {
    const id = caseId(c);
    if (only && !only.includes(id)) continue;
    for (let attempt = 1; ; attempt++) {
      const mark = log.length;
      try { await runCase(browser, c, log); break; }
      catch (e) {
        log.length = mark;
        process.stderr.write(`${id} attempt ${attempt} failed: ${e.message}\n`);
        await browser.close().catch(() => {});
        browser = await puppeteer.launch(LAUNCH);
        if (attempt === 2) { log.push({ id, ...c, failed: e.message }); break; }
      }
    }
    fs.writeFileSync(path.join(out, "_log.json"), JSON.stringify(log, null, 1));
    process.stderr.write(`${id} done\n`);
  }
  await browser.close();
})();
