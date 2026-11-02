// Frame-model checks for the onboarding tour: the site in a cross-site iframe,
// measured from the VISITOR's window (the host page viewport), not the frame.
// Usage: node frame-model.cjs <siteUrl> <harnessOrigin> <outDir>
//   siteUrl:       e.g. http://127.0.0.1:8080/internet-accountability-compass-staging/
//   harnessOrigin: e.g. http://localhost:8081   (serves audit/; a different site)
// Writes <outDir>/frame-model.json and one host-viewport PNG per case and step.
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const [SITE, HARNESS, OUT] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

// Test-page cases (tools/iframe-test.html, one box at a time, window = box + margin)
// and the WordPress replica at common window sizes (frame = 100vh of the window).
const T = (w, h) => `${HARNESS}/css-cleanup/scripts/harness.html?w=${w}&h=${h}&src=`;
const WP = (extra = "") => `${HARNESS}/tour/scripts/host-replica.html?${extra}src=`;
const cases = [
  { id: "test_1200x800", url: T(1200, 800), win: [1240, 860] },
  { id: "test_768x1024", url: T(768, 1024), win: [808, 1084], mobile: true },
  { id: "test_375x667", url: T(375, 667), win: [415, 727], mobile: true },
  { id: "test_1200x300", url: T(1200, 300), win: [1240, 360] },
  { id: "test_noheight_900", url: T(900, "auto"), win: [940, 400] },
  { id: "wp_1280x800", url: WP(), win: [1280, 800] },
  { id: "wp_1440x900", url: WP(), win: [1440, 900] },
  { id: "wp_1366x768", url: WP(), win: [1366, 768] },
  { id: "wp_768x1024", url: WP(), win: [768, 1024], mobile: true },
  { id: "wp_390x844", url: WP(), win: [390, 844], mobile: true },
  { id: "wp_360x640", url: WP(), win: [360, 640], mobile: true },
  { id: "wp_1280x800_hostScrolledDown", url: WP("scroll=bottom&"), win: [1280, 800] },
];

const r4 = (r) => [r.left, r.top, r.right, r.bottom].map(Math.round);
const visible = (r, W, H) => ({ full: r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] <= H, any: r[2] > 0 && r[0] < W && r[3] > 0 && r[1] < H });

(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--force-device-scale-factor=1"] });
  const results = [];
  for (const c of cases) {
    const p = await b.newPage();
    const errors = [];
    p.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text()); });
    await p.setViewport({ width: c.win[0], height: c.win[1], isMobile: !!c.mobile, hasTouch: !!c.mobile });
    // ?tour=1: the forced path is the same startTour() call as a first visit
    await p.goto(c.url + encodeURIComponent(SITE + "?tour=1"), { waitUntil: "load", timeout: 120000 });
    const hostScroll0 = await p.evaluate(() => scrollY);
    const fh = await p.$("iframe"); const f = await fh.contentFrame();
    // Proposal A/B: "?" at the top right on desktop as well (env HELP_TOP=1)
    if (process.env.HELP_TOP) await f.addStyleTag({ content: "@media (min-width: 769px) { .tour-launch { top: 16px; bottom: auto; } }" });
    // Timer polling, not waitForSelector: its default rAF polling never runs
    // in an off-screen cross-origin frame (Chrome pauses rendering there)
    let opened = false;
    for (let t = 0; t < 30 && !opened; t++) { opened = await f.evaluate(() => !!document.querySelector(".iac-tour-card")); if (!opened) await sleep(1000); }
    await sleep(500);
    if (c.id.includes("hostScrolledDown")) {
      // What the tour did while the frame was off-screen, then the visitor scrolls back up
      const st = () => f.evaluate(() => ({ open: !!document.querySelector(".iac-tour-card"), step: document.querySelector(".iac-tour-count")?.textContent, map: !!document.querySelector('[data-tour="map"] svg'), legend: !!document.querySelector('[data-tour="legend"]') }));
      const offscreen = await st();
      await p.evaluate(() => scrollTo(0, 0)); await sleep(3000);
      const back = await st();
      console.log("hostScrolledDown:", JSON.stringify({ offscreen, afterScrollingBack: back }));
    }
    const res = { id: c.id, window: c.win, opened, hostScrollBefore: hostScroll0, steps: [], errors };
    const hostState = () => p.evaluate(() => { const r = document.querySelector("iframe").getBoundingClientRect(); return { scrollY: Math.round(scrollY), frame: [r.left, r.top, r.right, r.bottom].map(Math.round), hostActive: document.activeElement.tagName }; });
    res.hostAfterOpen = await hostState();
    // "?" button, in visitor (host viewport) coordinates
    const q = await f.evaluate(() => { const r = document.querySelector(".tour-launch").getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
    const fr = res.hostAfterOpen.frame;
    const qHost = [q[0] + fr[0], q[1] + fr[1], q[2] + fr[0], q[3] + fr[1]].map(Math.round);
    res.helpButton = { host: qHost, ...visible(qHost, c.win[0], c.win[1]) };
    for (let i = 0; opened && i < 6; i++) {
      const g = await f.evaluate(() => {
        const R = (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
        const ring = document.querySelector(".iac-tour-ring"), de = document.documentElement;
        return { step: document.querySelector(".iac-tour-count").textContent, frameSize: [de.clientWidth, de.clientHeight], noRing: ring.classList.contains("iac-tour-ring-none"), ring: R(ring), card: R(document.querySelector(".iac-tour-card")), last: document.querySelector(".iac-tour-next").textContent === "Finish", hScroll: de.scrollWidth > de.clientWidth };
      });
      const hs = await hostState(); const o = hs.frame;
      const toHost = (r) => [r[0] + o[0], r[1] + o[1], r[2] + o[0], r[3] + o[1]].map(Math.round);
      const inFrame = (r) => r[0] >= 0 && r[1] >= 0 && r[2] <= g.frameSize[0] + 0.5 && r[3] <= g.frameSize[1] + 0.5;
      const cardHost = toHost(g.card), ringHost = g.noRing ? null : toHost(g.ring);
      res.steps.push({ step: g.step, frameSize: g.frameSize, hScroll: g.hScroll, hostScrollY: hs.scrollY,
        cardInFrame: inFrame(g.card), ringInFrame: g.noRing || inFrame(g.ring),
        cardVisitor: { host: cardHost, ...visible(cardHost, c.win[0], c.win[1]) },
        ringVisitor: g.noRing ? "no ring" : { host: ringHost, ...visible(ringHost, c.win[0], c.win[1]) } });
      await p.screenshot({ path: path.join(OUT, `${c.id}_step${i + 1}.png`) });
      if (g.last) break;
      // DOM click, not f.click(): puppeteer scrolls the element into view first,
      // which scrolls the HOST page and would hide a tour bug (or fake one)
      await f.evaluate(() => document.querySelector(".iac-tour-next").click()); await sleep(400);
    }
    res.hostScrollAfterSteps = (await hostState()).scrollY;
    results.push(res);
    console.log(JSON.stringify({ id: res.id, opened, hostScroll: [res.hostScrollBefore, res.hostAfterOpen.scrollY, res.hostScrollAfterSteps], frame: res.hostAfterOpen.frame, help: res.helpButton,
      steps: res.steps.map((s) => `${s.step}: frame card ${s.cardInFrame} ring ${s.ringInFrame} | visitor card ${s.cardVisitor.full ? "full" : s.cardVisitor.any ? "PART" : "NONE"} ring ${typeof s.ringVisitor === "string" ? s.ringVisitor : s.ringVisitor.full ? "full" : s.ringVisitor.any ? "PART" : "NONE"}${s.hScroll ? " HSCROLL" : ""}`), errors }));
    await p.close();
  }

  // Check 2, control experiment: does element.scrollIntoView() inside the
  // cross-site frame scroll the HOST page? (tour.js uses window.scrollTo instead)
  {
    const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
    await p.goto(WP() + encodeURIComponent(SITE + "?tour=0"), { waitUntil: "load", timeout: 120000 });
    const f = await (await p.$("iframe")).contentFrame(); await f.waitForSelector('[data-tour="legend"]', { timeout: 30000 }); await sleep(500);
    const exp = {};
    exp.before = await p.evaluate(() => scrollY);
    await f.evaluate(() => scrollTo({ top: document.querySelector('[data-tour="legend"]').getBoundingClientRect().top + scrollY - 300, behavior: "instant" }));
    await sleep(300); exp.afterWindowScrollTo = await p.evaluate(() => scrollY);
    await f.evaluate(() => scrollTo(0, 0)); await sleep(200);
    await f.evaluate(() => document.querySelector('[data-tour="legend"]').scrollIntoView({ block: "center" }));
    await sleep(500); exp.afterElementScrollIntoView = await p.evaluate(() => scrollY);
    await p.evaluate(() => scrollTo(0, 0)); await sleep(200);
    await f.evaluate(() => [...document.querySelectorAll("#observablehq-main a[href]")].pop().focus()); await sleep(300); exp.afterFocusNoOption = await p.evaluate(() => scrollY);
    await p.evaluate(() => scrollTo(0, 0)); await sleep(200);
    await f.evaluate(() => (scrollTo(0, 0), [...document.querySelectorAll("#observablehq-main a[href]")].pop().focus({ preventScroll: true }))); await sleep(300); exp.afterFocusPreventScroll = await p.evaluate(() => scrollY);
    results.push({ id: "scroll-propagation-experiment", ...exp });
    console.log("scroll-propagation-experiment (host scrollY):", JSON.stringify(exp));
    await p.close();
  }
  fs.writeFileSync(path.join(OUT, "frame-model.json"), JSON.stringify(results, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
