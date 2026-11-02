// Equal-specificity tie check between style.css and the stylesheets it shares a
// page with (inputs.css, sidebar.css). A tie is resolved only by load order, so
// it flips silently when the stylesheet order changes.
// Usage: node ties.cjs <out.json> [siteOrigin=http://127.0.0.1:8080] (env PAGES=directions,... for a subset)
// For each top-level page, at 1200x800 and 375x667, in load state and with
// :hover, :focus(+:focus-visible) or :active forced on ALL elements at once
// (so `a:hover span`-type rules match too: a superset of real states), plus the
// open mobile drawer and the open perspectives "Contents" panel at 375x667:
// CSS.getMatchedStylesForNode on every element (incl. pseudo-elements). Reports
// each property declared by a style.css rule and an inputs.css / sidebar.css
// rule that both match, with the same importance, EQUAL specificity and
// different values (whitespace-normalised), and what wins today: a rule of
// higher specificity ("resolved") or only load order ("UNRESOLVED").
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const OUT = path.resolve(process.argv[2]);
const SITE = process.argv[3] || "http://127.0.0.1:8080";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const pages = { home: "/", countries: "/countries", directions: "/directions", resources: "/resources", perspectives: "/perspectives", methodology: "/methodology" };
if (process.env.PAGES) for (const k of Object.keys(pages)) if (!process.env.PAGES.split(",").includes(k)) delete pages[k]; // env PAGES=directions,home: subset
const sheetName = (url) => /\/style\.[0-9a-f]{8}\.css/.test(url) ? "style.css" : /\/inputs\.[0-9a-f]{8}\.css/.test(url) ? "inputs.css" : /\/sidebar\.[0-9a-f]{8}\.css/.test(url) ? "sidebar.css" : null;
const PAIRS = [["style.css", "inputs.css"], ["style.css", "sidebar.css"]];
const STATES = { load: [], hover: ["hover"], focus: ["focus", "focus-visible"], active: ["active"] };
const norm = (v) => String(v).replace(/\s+/g, " ").replace(/\s*([,()/])\s*/g, "$1").trim();
const cmp = (x, y) => x.a - y.a || x.b - y.b || x.c - y.c;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const FREEZE = `(() => { const css = "*,*::before,*::after{animation:none!important;transition:none!important}";
  const add = () => { const st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st); };
  if (document.documentElement) add(); else document.addEventListener("readystatechange", add, { once: true }); })();`;

const ties = new Map(); // aggregated by (pair, selectors, property, values, resolution)
const meta = { cases: [], specificityFromCDP: true };

// Declarations of one RuleMatch list: {sheet, spec, imp, prop, value, sel}
function decls(matches, sheets) {
  const out = [];
  for (const m of matches) {
    const r = m.rule;
    if (r.origin !== "regular" || !r.styleSheetId) continue;
    const sheet = sheets.get(r.styleSheetId) || "other";
    const sels = m.matchingSelectors.map((i) => r.selectorList.selectors[i]);
    if (sels.some((s) => !s.specificity)) meta.specificityFromCDP = false;
    const best = sels.reduce((acc, s) => (!acc || cmp(s.specificity, acc.specificity) > 0 ? s : acc), null);
    const spec = best.specificity || { a: 0, b: 0, c: 0 };
    const seen = new Set();
    const add = (prop, value, imp) => { if (seen.has(prop)) return; seen.add(prop); out.push({ sheet, spec, imp: !!imp, prop, value, sel: best.text }); };
    for (const p of r.style.cssProperties) {
      if (p.disabled || p.parsedOk === false || p.value === undefined) continue;
      if (p.longhandProperties) for (const l of p.longhandProperties) add(l.name, l.value.replace(/\s*!important$/, ""), p.important);
      add(p.name, p.value, p.important);
    }
  }
  return out;
}
function check(list, where) {
  const byProp = new Map();
  for (const d of list) { if (!byProp.has(d.prop)) byProp.set(d.prop, []); byProp.get(d.prop).push(d); }
  for (const [prop, ds] of byProp) for (const [sa, sb] of PAIRS)
    for (const x of ds.filter((d) => d.sheet === sa)) for (const y of ds.filter((d) => d.sheet === sb)) {
      if (x.imp !== y.imp || cmp(x.spec, y.spec) !== 0 || norm(x.value) === norm(y.value)) continue;
      // Does a declaration of higher priority decide the property today?
      const higher = ds.filter((d) => (d.imp && !x.imp) || (d.imp === x.imp && cmp(d.spec, x.spec) > 0))
        .sort((p, q) => (p.imp - q.imp) || cmp(p.spec, q.spec)).pop();
      const resolution = higher ? `resolved by ${higher.sheet} ${higher.sel} { ${prop}: ${higher.value}${higher.imp ? " !important" : ""} } (${higher.spec.a},${higher.spec.b},${higher.spec.c})` : "UNRESOLVED (load order decides)";
      const key = [sa, x.sel, x.value, sb, y.sel, y.value, prop, resolution].join(" | ");
      const t = ties.get(key) || { pair: `${sa} vs ${sb}`, property: prop, specificity: `${x.spec.a},${x.spec.b},${x.spec.c}`, important: x.imp, [sa]: `${x.sel} { ${prop}: ${x.value} }`, [sb]: `${y.sel} { ${prop}: ${y.value} }`, resolution, elements: 0, where: [] };
      t.elements++; if (!t.where.includes(where)) t.where.push(where);
      ties.set(key, t);
    }
}

async function scan(page, cdp, sheets, where, elementIds) {
  for (const nodeId of elementIds) {
    let m;
    try { m = await cdp.send("CSS.getMatchedStylesForNode", { nodeId }); } catch { continue; }
    check(decls(m.matchedCSSRules || [], sheets), where);
    for (const pe of m.pseudoElements || []) check(decls(pe.matches, sheets), `${where} ::${pe.pseudoType}`);
  }
}
async function elements(cdp) {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1, pierce: false });
  const ids = [], skip = new Set(["HEAD", "SCRIPT", "STYLE", "LINK", "META", "TITLE", "NOSCRIPT", "TEMPLATE"]);
  const walk = (n) => { if (n.nodeType === 1 && !skip.has(n.nodeName.toUpperCase())) { ids.push(n.nodeId); (n.children || []).forEach(walk); } else if (n.nodeType !== 1) (n.children || []).forEach(walk); };
  walk(root);
  return ids;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--disable-gpu"] });
  for (const [name, url] of Object.entries(pages)) for (const [w, h] of [[1200, 800], [375, 667]]) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(FREEZE);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500 });
    const cdp = await page.createCDPSession();
    const sheets = new Map();
    cdp.on("CSS.styleSheetAdded", ({ header }) => sheets.set(header.styleSheetId, sheetName(header.sourceURL) || "other"));
    await page.goto(SITE + url, { waitUntil: "networkidle0", timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await wait(4000);
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const vp = `${name} ${w}x${h}`;
    let ids = await elements(cdp);
    const loaded = [...new Set(sheets.values())];
    for (const [st, classes] of Object.entries(STATES)) {
      if (classes.length) for (const id of ids) await cdp.send("CSS.forcePseudoState", { nodeId: id, forcedPseudoClasses: classes }).catch(() => {});
      await scan(page, cdp, sheets, `${vp} ${st}`, ids);
      if (classes.length) for (const id of ids) await cdp.send("CSS.forcePseudoState", { nodeId: id, forcedPseudoClasses: [] }).catch(() => {});
      meta.cases.push({ case: `${vp} ${st}`, elements: ids.length, sheets: loaded });
    }
    if (w < 500) {
      await page.click(".mobile-hamburger"); await wait(500);
      ids = await elements(cdp);
      await scan(page, cdp, sheets, `${vp} drawer-open`, ids);
      meta.cases.push({ case: `${vp} drawer-open`, elements: ids.length, open: await page.evaluate(() => document.getElementById("sidebar").classList.contains("mobile-open")) });
      await page.click(".mobile-hamburger"); await wait(500);
      if (name === "perspectives" && (await page.$(".toc-toggle-button"))) {
        await page.click(".toc-toggle-button"); await wait(500);
        ids = await elements(cdp);
        await scan(page, cdp, sheets, `${vp} contents-open`, ids);
        meta.cases.push({ case: `${vp} contents-open`, elements: ids.length, open: await page.evaluate(() => !!document.querySelector(".blog-toc.toc-open")) });
      }
    }
    await page.close();
    process.stderr.write(`${vp} done\n`);
  }
  await browser.close();
  const list = [...ties.values()].sort((a, b) => (a.resolution.startsWith("UNRESOLVED") ? 0 : 1) - (b.resolution.startsWith("UNRESOLVED") ? 0 : 1) || a.property.localeCompare(b.property));
  fs.writeFileSync(OUT, JSON.stringify({ site: SITE, ...meta, ties: list }, null, 1));
  console.log(`${list.length} tie(s), ${list.filter((t) => t.resolution.startsWith("UNRESOLVED")).length} unresolved -> ${OUT}`);
})();
