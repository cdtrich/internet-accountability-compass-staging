// Behaviour checks for the tour. Usage: node tour-behaviour.cjs <siteRoot> (e.g. http://127.0.0.1:3300/)
const path = require("path");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const ROOT = process.argv[2];
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The site itself skips auto-start under automation; pretend to be a person
const NOT_AUTOMATED = `Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });`;
const results = [];
const log = (name, pass, detail) => { results.push({ name, pass, detail }); console.log((pass ? "PASS " : "FAIL ") + name + "  " + JSON.stringify(detail)); };

async function newPage(ctx, { w = 1200, h = 800, script = NOT_AUTOMATED, errors } = {}) {
  const p = await ctx.newPage();
  p.setDefaultNavigationTimeout(120000); // Google Fonts sometimes stall the load event here
  await p.setViewport({ width: w, height: h });
  if (script) await p.evaluateOnNewDocument(script);
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|status of 404/.test(m.text())) errors?.push(m.text()); });
  p.on("pageerror", (e) => errors?.push("pageerror: " + e.message));
  return p;
}
const isOpen = (p) => p.evaluate(() => !!document.querySelector(".iac-tour"));
async function waitOpen(p, ms = 10000) { try { await p.waitForSelector(".iac-tour-card", { timeout: ms }); return true; } catch { return false; } }
const store = (p) => p.evaluate(() => { try { return { done: localStorage.getItem("iac:tour:v1"), skipped: sessionStorage.getItem("iac:tour:skipped") }; } catch (e) { return { error: String(e) }; } });

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true });

  if (process.env.ONLY !== "9") {
  // 0. automation gate: plain puppeteer (navigator.webdriver = true) never auto-starts
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx, { script: null });
    await p.goto(ROOT, { waitUntil: "load" }); await sleep(7000);
    const fetched = await p.evaluate(() => performance.getEntriesByType("resource").filter((e) => /\/tour\.|components\/tour\b/.test(e.name)).map((e) => e.name));
    log("webdriver=true: no auto-start, tour.js/css not fetched", !(await isOpen(p)) && !fetched.length, { open: await isOpen(p), fetched }); await ctx.close(); }
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    await p.goto(ROOT + "?tour=0", { waitUntil: "load" }); await sleep(7000);
    log("?tour=0: no auto-start", !(await isOpen(p)), {}); await ctx.close(); }

  // 1. Finish -> never again
  { const ctx = await b.createBrowserContext(); const errors = []; const p = await newPage(ctx, { errors });
    await p.goto(ROOT, { waitUntil: "load" }); const opened = await waitOpen(p);
    for (let i = 0; i < 3; i++) { await p.click(".iac-tour-next"); await sleep(150); }
    const label = await p.$eval(".iac-tour-next", (b) => b.textContent); await p.click(".iac-tour-next"); await sleep(200);
    const s = await store(p); await p.reload({ waitUntil: "load" }); await sleep(7000); const again = await isOpen(p);
    const p2 = await newPage(ctx); await p2.goto(ROOT, { waitUntil: "load" }); await sleep(7000); const newTab = await isOpen(p2);
    log("Finish -> done; no auto-start on reload or in a new tab", opened && label === "Finish" && s.done === "done" && !again && !newTab, { opened, label, ...s, again, newTab, errors }); await ctx.close(); }

  // 2. Skip -> not again this session, back next session (a new tab has its own sessionStorage)
  { const ctx = await b.createBrowserContext(); const errors = []; const p = await newPage(ctx, { errors });
    await p.goto(ROOT, { waitUntil: "load" }); const opened = await waitOpen(p);
    await p.click(".iac-tour-skip"); await sleep(200); const s = await store(p);
    const focus = await p.evaluate(() => document.activeElement?.className);
    await p.reload({ waitUntil: "load" }); await sleep(7000); const again = await isOpen(p);
    const p2 = await newPage(ctx); await p2.goto(ROOT, { waitUntil: "load" }); const nextSession = await waitOpen(p2);
    log("Skip -> skipped for this session only", opened && s.skipped === "1" && s.done === null && !again && nextSession, { ...s, focus, again, nextSession, errors }); await ctx.close(); }

  // 3. Esc -> same as Skip; focus back on "?"
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    await p.goto(ROOT, { waitUntil: "load" }); const opened = await waitOpen(p);
    await p.keyboard.press("Escape"); await sleep(200); const s = await store(p);
    const focus = await p.evaluate(() => document.activeElement?.className);
    const inert = await p.evaluate(() => document.getElementById("observablehq-center").inert);
    log("Esc closes, = Skip, focus on ?, inert removed", opened && !(await isOpen(p)) && s.skipped === "1" && focus === "tour-launch" && !inert, { ...s, focus, inert }); await ctx.close(); }

  // 4. tick + Skip -> done
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    await p.goto(ROOT, { waitUntil: "load" }); await waitOpen(p);
    await p.click(".iac-tour-optout input"); await p.click(".iac-tour-skip"); await sleep(200); const s = await store(p);
    await p.reload({ waitUntil: "load" }); await sleep(7000);
    log("Don't show again + Skip -> done", s.done === "done" && !(await isOpen(p)), s); await ctx.close(); }

  // 5. version bump: an old key does not suppress the current version
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    await p.goto(ROOT + "?tour=0", { waitUntil: "load" });
    await p.evaluate(() => localStorage.setItem("iac:tour:v0", "done"));
    await p.goto(ROOT, { waitUntil: "load" }); const opened = await waitOpen(p);
    log("version bump: iac:tour:v0=done does not suppress v1", opened, {}); await ctx.close(); }

  // 6. storage throwing
  { const ctx = await b.createBrowserContext(); const errors = [];
    const THROW = NOT_AUTOMATED + `
      for (const k of ["setItem", "getItem", "removeItem"]) Storage.prototype[k] = function () { throw new DOMException("blocked", "SecurityError"); };`;
    const p = await newPage(ctx, { script: THROW, errors });
    await p.goto(ROOT, { waitUntil: "load" }); await sleep(8000); const auto = await isOpen(p);
    await p.click(".tour-launch"); const opened = await waitOpen(p, 5000);
    const optoutHidden = await p.$eval(".iac-tour-optout", (e) => e.hidden && getComputedStyle(e).display === "none");
    for (let i = 0; i < 3; i++) { await p.click(".iac-tour-next"); await sleep(150); }
    await p.click(".iac-tour-next"); await sleep(200); const closed = !(await isOpen(p));
    await p.click(".tour-launch"); const reopened = await waitOpen(p, 5000); await p.keyboard.press("Escape"); await sleep(200);
    log("storage throwing: no auto-start, ? works, opt-out hidden, no errors", !auto && opened && optoutHidden && closed && reopened && !errors.length, { auto, opened, optoutHidden, closed, reopened, errors }); await ctx.close(); }

  // 7. keyboard
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    await p.goto(ROOT + "?tour=1", { waitUntil: "load" }); await waitOpen(p); await sleep(300);
    const where = () => p.evaluate(() => { const a = document.activeElement; return (a.closest(".iac-tour-card") ? "card:" : "OUT:") + (a.className || a.type || a.tagName); });
    const focusRing = () => p.evaluate(() => { const c = getComputedStyle(document.activeElement); return c.outlineStyle !== "none" && parseFloat(c.outlineWidth) >= 2; });
    const start = await where(); const fwd = [], back = [], rings = [];
    for (let i = 0; i < 6; i++) { await p.keyboard.press("Tab"); fwd.push(await where()); rings.push(await focusRing()); }
    for (let i = 0; i < 6; i++) { await p.keyboard.down("Shift"); await p.keyboard.press("Tab"); await p.keyboard.up("Shift"); back.push(await where()); rings.push(await focusRing()); }
    await p.focus(".iac-tour-next"); await p.keyboard.press("Enter"); await sleep(150); const afterEnter = await p.$eval(".iac-tour-count", (e) => e.textContent);
    const focusAfterStep = await where();
    await p.focus(".iac-tour-back"); await p.keyboard.press("Space"); await sleep(150); const afterSpace = await p.$eval(".iac-tour-count", (e) => e.textContent);
    await p.keyboard.press("Escape"); await sleep(150); const end = await p.evaluate(() => document.activeElement?.className);
    const endRing = await focusRing();
    const trapped = [...fwd, ...back].every((s) => s.startsWith("card:"));
    log("keyboard: Tab trap, focus visible, Enter/Space, title focused per step, Esc -> ?", start === "card:iac-tour-title" && trapped && rings.every(Boolean) && afterEnter === "Step 2 of 4" && focusAfterStep === "card:iac-tour-title" && afterSpace === "Step 1 of 4" && end === "tour-launch" && endRing, { start, fwd, back, focusVisible: rings.every(Boolean), afterEnter, focusAfterStep, afterSpace, end, endRing }); await ctx.close(); }

  // 8. reduced motion
  for (const reduce of [false, true]) { const ctx = await b.createBrowserContext(); const p = await newPage(ctx);
    // headless Chrome reports "reduce" by default: set both states explicitly
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }]);
    await p.goto(ROOT + "?tour=1", { waitUntil: "load" }); await waitOpen(p);
    const t = await p.evaluate(() => [...document.querySelectorAll(".iac-tour, .iac-tour *")].map((e) => e.className + ":" + getComputedStyle(e).transitionProperty + " " + getComputedStyle(e).transitionDuration).filter((d) => d.split(" ").pop().split(",").some((x) => parseFloat(x) > 0)));
    const anims = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.(".iac-tour")).length);
    log(`reduced motion ${reduce ? "on: no transitions" : "off: opacity fade on the card only, <=200ms"}`, reduce ? t.length === 0 && anims === 0 : t.length === 1 && /opacity 0\.15s/.test(t[0]), { nonZeroTransitions: t, runningAnimations: anims }); await ctx.close(); }

  }
  // 9. tracking: scroll, map re-render (width change), 768 crossing, orientation
  //    (orientation = width/height swap; changing isMobile/hasTouch makes puppeteer reload the page)
  { const ctx = await b.createBrowserContext(); const p = await newPage(ctx, { w: 1200, h: 800 });
    await p.goto(ROOT + "?tour=1", { waitUntil: "load" }); await waitOpen(p); await sleep(300);
    const check = () => p.evaluate(() => {
      const ring = document.querySelector(".iac-tour-ring"), card = document.querySelector(".iac-tour-card"), de = document.documentElement;
      const mobile = matchMedia("(max-width: 768px)").matches;
      const sel = { "Total score at a glance": '[data-tour="legend"]', "Explore the map": mobile ? '[data-tour="map"]' : '[data-tour="zoom"]' }[document.querySelector(".iac-tour-title").textContent];
      const t = sel && document.querySelector(sel)?.getBoundingClientRect(), r = ring.getBoundingClientRect(), c = card.getBoundingClientRect();
      const W = de.clientWidth, H = de.clientHeight, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      // expected ring = target + 6px, clamped to the frame (the bottom may be cut above a docked card)
      const exp = t && [clamp(t.left - 6, 2, W - 2), clamp(t.top - 6, 2, H - 2), clamp(t.right + 6, 2, W - 2)];
      const none = ring.classList.contains("iac-tour-ring-none");
      const ok = !t || none || (Math.abs(r.left - exp[0]) < 1.5 && Math.abs(r.top - exp[1]) < 1.5 && Math.abs(r.right - exp[2]) < 1.5);
      const inside = (q) => q.left >= 0 && q.top >= 0 && q.right <= W + 0.5 && q.bottom <= H + 0.5;
      return { step: document.querySelector(".iac-tour-count").textContent, ringOnTarget: ok, ringNone: none, ringInside: none || inside(r), cardInside: inside(c), frame: [W, H] };
    });
    const out = {}; const y0 = await p.evaluate(() => scrollY);
    await p.evaluate(() => scrollBy(0, 120)); await sleep(250); out.scroll = await check();
    await p.evaluate(() => scrollBy(0, -2000)); await sleep(250); out.scrollFar = await check();
    await p.evaluate((y) => scrollTo(0, y), y0); await sleep(250); out.scrollBack = await check();
    await p.setViewport({ width: 1100, height: 800 }); await sleep(1200); out.reRender = await check();
    await p.click(".iac-tour-next"); await sleep(300); out.step2 = await check();
    await p.setViewport({ width: 700, height: 800 }); await sleep(1500); out.to700 = await check();
    await p.setViewport({ width: 1000, height: 800 }); await sleep(1500); out.back1000 = await check();
    await p.setViewport({ width: 375, height: 667 }); await sleep(1500); out.phonePortrait = await check();
    await p.setViewport({ width: 667, height: 375 }); await sleep(1500); out.phoneLandscape = await check();
    const all = Object.values(out).every((o) => o.ringOnTarget && o.ringInside && o.cardInside) && !out.scrollBack.ringNone && !out.reRender.ringNone;
    log("ring tracks scroll / re-render / 768 crossing / orientation; ring+card inside frame", all && out.to700.step.endsWith("of 3") && out.back1000.step.endsWith("of 4"), out); await ctx.close(); }

  await b.close();
  console.log(`\n${results.filter((r) => r.pass).length}/${results.length} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
