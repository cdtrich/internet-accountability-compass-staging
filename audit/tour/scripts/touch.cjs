// Touch behaviour of the landing map, to check the tour copy ("Tap a country to
// open its page. Pinch to zoom"). Usage: node touch.cjs <siteUrl>
// Tap: CDP touch events on a country (Chrome synthesises the click as on a phone).
// Pinch: synthetic two-finger TouchEvents on the map SVG (d3-zoom's touch path);
// this exercises the page's handlers, not the browser's own pinch gesture.
const path = require("path");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const SITE = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(SITE + "?tour=0", { waitUntil: "load" });
  await p.waitForSelector('[data-tour="map"] .country-data');
  // Pinch first (same page), then tap
  const pinch = await p.evaluate(async () => {
    const svg = document.querySelector('[data-tour="map"] svg'), r = svg.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 3;
    const T = (id, x, y) => new Touch({ identifier: id, target: svg, clientX: x, clientY: y, pageX: x + scrollX, pageY: y + scrollY });
    const fire = (type, touches, changed) => svg.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches: changed }));
    const before = svg.querySelector(".map-group").getAttribute("transform");
    let a = T(1, cx - 20, cy), c = T(2, cx + 20, cy);
    fire("touchstart", [a], [a]); fire("touchstart", [a, c], [c]);
    for (let d = 30; d <= 120; d += 10) { a = T(1, cx - d, cy); c = T(2, cx + d, cy); fire("touchmove", [a, c], [a, c]); await new Promise((r) => requestAnimationFrame(r)); }
    fire("touchend", [a], [c]); fire("touchend", [], [a]);
    await new Promise((r) => setTimeout(r, 300));
    return { before, after: svg.querySelector(".map-group").getAttribute("transform") };
  });
  console.log("pinch:", JSON.stringify(pinch));
  // reset, then tap a large country with data
  await p.reload({ waitUntil: "load" }); await p.waitForSelector('[data-tour="map"] .country-data'); await sleep(500);
  const pt = await p.evaluate(() => {
    const el = [...document.querySelectorAll('[data-tour="map"] .country-data')].find((e) => e.__data__?.properties?.ISO3_CODE === "BRA");
    el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, iso: "BRA" };
  });
  await sleep(300);
  const nav = p.waitForNavigation({ timeout: 8000 }).then(() => p.url()).catch(() => null);
  await p.touchscreen.tap(pt.x, pt.y);
  console.log("tap BRA ->", (await nav) || "no navigation (url " + p.url() + ")");
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
