// Storage-blocked check alone: localStorage/sessionStorage throw on every call.
// Expect: no console errors, no auto-start, opt-out hidden, "?" opens and closes.
// Usage: node storage-stub.cjs <siteUrl>
const path = require("path");
const puppeteer = require(path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/5390d7d89c0de19d/node_modules/puppeteer-core"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STUB = `Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });
  for (const k of ["setItem", "getItem", "removeItem"]) Storage.prototype[k] = function () { throw new DOMException("blocked", "SecurityError"); };`;
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const p = await b.newPage(); p.setDefaultNavigationTimeout(120000);
  await p.setViewport({ width: 1200, height: 800 });
  const errors = [];
  p.on("console", (m) => { if (m.type() === "error" && !/status of 404|ERR_CONNECTION/.test(m.text())) errors.push(m.text()); });
  p.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await p.evaluateOnNewDocument(STUB);
  await p.goto(process.argv[2], { waitUntil: "load" });
  await sleep(8000);
  const auto = await p.evaluate(() => !!document.querySelector(".iac-tour"));
  await p.evaluate(() => document.querySelector(".tour-launch").click());
  await p.waitForSelector(".iac-tour-card", { timeout: 10000 }).catch(() => {});
  const opened = await p.evaluate(() => !!document.querySelector(".iac-tour-card"));
  const optoutHidden = opened && await p.evaluate(() => document.querySelector(".iac-tour-optout").hidden);
  for (let i = 0; i < 4; i++) { await p.evaluate(() => document.querySelector(".iac-tour-next")?.click()); await sleep(200); }
  const closed = !(await p.evaluate(() => !!document.querySelector(".iac-tour")));
  await p.evaluate(() => document.querySelector(".tour-launch").click()); await sleep(1000);
  const reopened = await p.evaluate(() => !!document.querySelector(".iac-tour-card"));
  await p.keyboard.press("Escape"); await sleep(200);
  const escClosed = !(await p.evaluate(() => !!document.querySelector(".iac-tour")));
  const pass = !auto && opened && optoutHidden && closed && reopened && escClosed && !errors.length;
  console.log((pass ? "PASS" : "FAIL") + " storage throwing", JSON.stringify({ auto, opened, optoutHidden, closedByFinish: closed, reopened, escClosed, errors }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
