// Usage: node tour-steps.cjs <url> <w> <h> [outDir] [touch]
// Opens <url> (expects ?tour=1), walks every step, prints ring/card geometry vs the
// frame, and takes one viewport screenshot per step if outDir is given.
const path = require("path"), fs = require("fs");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const [url, w, h, out, touch] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--force-device-scale-factor=1"] });
  const p = await b.newPage();
  const errors = [];
  p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text()); });
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await p.setViewport({ width: +w, height: +h, hasTouch: !!touch, isMobile: !!touch });
  await p.goto(url, { waitUntil: "load", timeout: 120000 });
  await p.waitForSelector(".iac-tour-card", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  if (out) fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < 6; i++) {
    const g = await p.evaluate(() => {
      const de = document.documentElement, R = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const ring = document.querySelector(".iac-tour-ring"), card = document.querySelector(".iac-tour-card");
      const fw = de.clientWidth, fh = de.clientHeight, inside = (r) => r[0] >= 0 && r[1] >= 0 && r[2] <= fw && r[3] <= fh;
      const rr = R(ring), cr = R(card), noRing = ring.classList.contains("iac-tour-ring-none");
      return { count: document.querySelector(".iac-tour-count").textContent, title: document.querySelector(".iac-tour-title").textContent,
        frame: [fw, fh], ring: noRing ? "none" : rr, card: cr, ringInside: noRing || inside(rr), cardInside: inside(cr),
        overlap: !noRing && rr[0] < cr[2] && cr[0] < rr[2] && rr[1] < cr[3] && cr[1] < rr[3], cardScroll: card.scrollHeight > card.clientHeight, hScroll: de.scrollWidth > de.clientWidth, scrollY: Math.round(scrollY),
        focus: document.activeElement?.className || document.activeElement?.tagName, optoutHidden: document.querySelector(".iac-tour-optout").hidden,
        inert: document.getElementById("observablehq-center").inert };
    });
    console.log(JSON.stringify(g));
    if (out) await p.screenshot({ path: path.join(out, `${w}x${h}${touch ? "_touch" : ""}_step${i + 1}.png` ) });
    const last = await p.$eval(".iac-tour-next", (b) => b.textContent === "Finish");
    if (last) break;
    await p.click(".iac-tour-next");
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log("errors:", JSON.stringify(errors));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
