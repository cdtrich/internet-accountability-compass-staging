// Computed-style dumps of interaction states the scroll capture does not reach.
// Usage: node states.cjs <outDir> [siteOrigin=http://127.0.0.1:8080]
// Writes <outDir>/<case>.styles.json (same format as shoot.cjs, so style-diff.cjs
// compares two runs) and _log.json. No PNGs.
// - 1200x800, home and perspectives: every nav link (sidebar items, blog TOC,
//   hamburger) with :hover forced, then :focus + :focus-visible forced
//   (CDP CSS.forcePseudoState), one full-document dump per element and state.
// - 375x667: the mobile drawer opened by clicking the hamburger (home,
//   perspectives), each drawer link focused inside it, and on perspectives the
//   "Contents" button opened.
// - directions, 1200x800 and 375x667: :hover, then :focus + :focus-visible forced
//   on every control (Inputs search box, buttons, any select/textarea, table rows).
// - 1200x800, AFG (country page; sidebar.css loads there too): every sidebar
//   link with :focus + :focus-visible forced.
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const out = path.resolve(process.argv[2]);
const SITE = process.argv[3] || "http://127.0.0.1:8080";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LAUNCH = { executablePath: CHROME, headless: true, ignoreDefaultArgs: ["--hide-scrollbars"], args: ["--force-device-scale-factor=1", "--font-render-hinting=none", "--disable-gpu"] };
const pages = { home: "/", perspectives: "/perspectives", directions: "/directions", AFG: "/AFG/" };
const TARGETS = "#sidebar a, .mobile-hamburger, .blog-toc a, .toc-toggle-button";
fs.mkdirSync(out, { recursive: true });

// Same determinism and dump as shoot.cjs.
const FREEZE = `(() => {
  let s = 42; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pn = performance.now.bind(performance), t0 = pn(), d0 = Date.now();
  performance.now = () => t0 + (pn() - t0) * 1000;
  Date.now = () => d0 + (pn() - t0) * 1000;
  const css = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
  const add = () => { const st = document.createElement("style"); st.id = "__freeze"; st.textContent = css; (document.head || document.documentElement).appendChild(st); };
  if (document.documentElement) add(); else document.addEventListener("readystatechange", add, { once: true });
})();`;
function dumpStyles() {
  const table = [], index = new Map(), elements = {};
  const intern = (cs) => {
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const idle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => (window.requestIdleCallback || setTimeout)(r)))));

async function open(browser, name, w, h) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(FREEZE);
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
  await page.goto(SITE + pages[name], { waitUntil: "networkidle0", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await wait(5000);
  const cdp = await page.createCDPSession();
  await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
  return { page, cdp };
}
async function nodeIds(cdp, sel) {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  return (await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: sel })).nodeIds;
}
const describe = (page, sel, i) => page.evaluate((sel, i) => { const e = document.querySelectorAll(sel)[i]; return `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().replace(/\s+/g, ".") : ""} "${e.textContent.trim().slice(0, 30)}"`; }, sel, i);
const log = [];
async function save(page, id, extra = {}) {
  const d = await page.evaluate(dumpStyles);
  fs.writeFileSync(path.join(out, `${id}.styles.json`), JSON.stringify(d));
  log.push({ id, elements: Object.keys(d.elements).length, uniqueStyles: d.table.length, ...extra });
}
// Force each state on each target in turn; one dump per (target, state).
async function forced(page, cdp, prefix, sel, only) {
  const ALL = { hover: ["hover"], focus: ["focus", "focus-visible"] };
  const STATES = only ? { [only]: ALL[only] } : ALL;
  const ids = await nodeIds(cdp, sel);
  for (const [i, nodeId] of ids.entries()) {
    const label = await describe(page, sel, i);
    for (const [st, classes] of Object.entries(STATES)) {
      await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: classes });
      await idle(page);
      await save(page, `${prefix}_${String(i).padStart(2, "0")}_${st}`, { target: label, state: classes.join("+") });
      await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    }
  }
}

(async () => {
  const browser = await puppeteer.launch(LAUNCH);
  for (const name of Object.keys(pages)) {
    if (name === "directions") {
      for (const [w, h] of [[1200, 800], [375, 667]]) {
        const { page, cdp } = await open(browser, name, w, h);
        await save(page, `${name}_${w}x${h}_rest`);
        await forced(page, cdp, `${name}_${w}x${h}`, "input, button, select, textarea, tr");
        await page.close();
      }
      process.stderr.write(`${name} done
`);
      continue;
    }
    if (name === "AFG") {
      const { page, cdp } = await open(browser, name, 1200, 800);
      await save(page, `${name}_1200x800_rest`);
      await forced(page, cdp, `${name}_1200x800`, "#sidebar a", "focus");
      await page.close();
      process.stderr.write(`${name} done
`);
      continue;
    }
    // Desktop: hover and focus on every nav link.
    let { page, cdp } = await open(browser, name, 1200, 800);
    await save(page, `${name}_1200x800_rest`);
    await forced(page, cdp, `${name}_1200x800`, TARGETS);
    await page.close();
    // Mobile: drawer opened by a real click, then focus on each drawer link.
    ({ page, cdp } = await open(browser, name, 375, 667));
    await save(page, `${name}_375x667_rest`);
    await page.click(".mobile-hamburger"); await wait(500); await idle(page);
    const isOpen = await page.evaluate(() => document.getElementById("sidebar").classList.contains("mobile-open"));
    await save(page, `${name}_375x667_drawer-open`, { drawerOpen: isOpen });
    await forced(page, cdp, `${name}_375x667_drawer`, "#sidebar a, .mobile-hamburger");
    await page.click(".mobile-hamburger"); await wait(500); await idle(page);
    if (name === "perspectives") {
      const has = await page.$(".toc-toggle-button");
      if (has) { await page.click(".toc-toggle-button"); await wait(500); await idle(page); }
      const tocOpen = await page.evaluate(() => !!document.querySelector(".blog-toc.toc-open"));
      await save(page, `${name}_375x667_contents-open`, { tocButton: !!has, tocOpen });
    }
    await page.close();
    process.stderr.write(`${name} done\n`);
  }
  fs.writeFileSync(path.join(out, "_log.json"), JSON.stringify(log, null, 1));
  await browser.close();
})();
