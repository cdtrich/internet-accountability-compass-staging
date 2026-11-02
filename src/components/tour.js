// Onboarding tour for the landing page (v3_BRIEF.md, "Onboarding").
// Spotlight ring + one card over the live UI. Vanilla, no dependencies.
// Loaded lazily by src/index.md after `load` + idle; nothing here runs before.
// Frame rules (cross-origin iframe): own viewport only; never window.parent/top
// or postMessage; scrolls only this document (window.scrollTo: scrollIntoView
// can scroll the host page); every focus() uses { preventScroll: true }.
// Targets are re-queried by selector on every measure: resize() replaces the map.

// Rollback switch: false disables auto-start and the "?" button does nothing.
export const TOUR_ENABLED = true;

// Auto-start when localStorage is unusable? false: "?" only. true: it would
// auto-start on every visit to the map (multi-page, nothing remembers it).
const AUTOSTART_WITHOUT_STORAGE = false;

// Card edge when it cannot sit next to the ring. "top" keeps it in the part of
// the frame visible first in the WordPress embed (audit/tour/report.md).
const DOCK = "top";

const DONE_KEY = "iac:tour:v1"; // bump to show the tour again to everyone
const SKIP_KEY = "iac:tour:skipped"; // sessionStorage: skipped in this session
const LANG = "en";

const MOBILE = "(max-width: 768px)"; // same breakpoint as sidebar.css
const TOUCH = "(hover: none)";
const SHORT_FRAME = 420; // below: card docked (DOCK)
const TINY_FRAME = 300; // below: card only, no ring
const TARGET_WAIT = 5000; // ms to wait for a missing target before skipping its step
const EDGE = 8; // min distance between card/ring and the frame edge
const GAP = 12; // ring to card
const RING_PAD = 6; // ring around the target
const CARD_MAX = 360;

// All visible text, one object per language. Keep strings whole (no sentences
// built from fragments) so a translation is a pure copy job.
const COPY = {
  en: {
    stepOf: (n, total) => `Step ${n} of ${total}`,
    back: "Back",
    next: "Next",
    finish: "Finish",
    skip: "Skip tour",
    dontShow: "Don't show again",
    steps: {
      legend: {
        title: "Total score at a glance",
        body: "Each country is coloured by its overall Internet Accountability Score, from Off track to Leading. The figures above the map count the countries in each category. Hatched countries, as in this legend, don't have enough data to be scored.",
      },
      explore: {
        title: "Explore the map",
        // Historical compares the latest year with the previous one
        body: "Hover over a country for its details and click it to open its page. Zoom with the + and − buttons or Ctrl/⌘ + scroll; the ⌂ button resets the view. The Latest / Historical switch above the figures shows current scores or the change since the previous year.",
        bodyTouch: "Tap a country to open its page. Pinch to zoom; the ⌂ button resets the view. The Latest / Historical switch above the figures shows current scores or the change since the previous year.",
      },
      nav: {
        title: "Find your way around",
        body: "Use the menu to move between sections:",
        // [label, description]: shown as a list under the body
        list: [
          ["Map", "All countries' scores on one map."],
          ["Countries", "Compare countries across the four dimensions."],
          ["Directions", "The four dimensions behind the score, each mapped."],
          ["Resources", "Curated sources, analysis and projects."],
          ["Perspectives", "Analysis, commentaries and opinions."],
          ["Methodology", "How the Compass and its scores are built."],
        ],
      },
      countries: {
        title: "Every country has its own page",
        body: "Open Countries, or click a country on the map, to see its scores for each dimension, how they changed over time and, where available, related resources. The ? button reopens this tour.",
      },
      navMobile: {
        title: "Find your way around",
        body: "Open the menu to switch between Map, Countries, Directions, Resources, Perspectives and Methodology. Every country has its own page with its scores for each dimension: open it from Countries or by tapping the country on the map. The ? button in the top bar reopens this tour.",
      },
    },
  },
};

// Steps per layout. targets: selectors tried in order (fallbacks).
// place: preferred card sides, tried in order before docking.
function stepsFor(mobile) {
  const steps = [
    { id: "legend", targets: ['[data-tour="legend"]', '[data-tour="map"]'] },
    {
      id: "explore",
      targets: mobile
        ? ['[data-tour="map"]']
        : ['[data-tour="zoom"]', '[data-tour="map"]'],
    },
  ];
  if (mobile)
    steps.push({ id: "navMobile", targets: ['[data-tour="menu-button"]'] });
  else
    steps.push(
      { id: "nav", targets: ['[data-tour="nav"]'], place: ["right"] },
      {
        id: "countries",
        targets: ['[data-tour="nav-countries"]'],
        place: ["right"],
      },
    );
  return steps;
}

function read(area, key) {
  try {
    return window[area].getItem(key);
  } catch {
    return null;
  }
}
function write(area, key, value) {
  try {
    window[area].setItem(key, value);
  } catch {
    /* storage unusable: nothing to remember */
  }
}
function storageWorks() {
  const probe = "iac:tour:probe";
  try {
    localStorage.setItem(probe, "1");
    const ok = localStorage.getItem(probe) === "1";
    localStorage.removeItem(probe);
    return ok;
  } catch {
    return false;
  }
}

function autoStartAllowed() {
  const q = new URLSearchParams(location.search).get("tour");
  if (q === "0") return false;
  if (q === "1") return true;
  if (navigator.webdriver || /Chrome-Lighthouse/.test(navigator.userAgent))
    return false;
  if (!storageWorks()) return AUTOSTART_WITHOUT_STORAGE;
  return read("localStorage", DONE_KEY) !== "done" &&
    read("sessionStorage", SKIP_KEY) !== "1";
}

let S = null;
let opening = false;

export function startTour(options = {}) {
  if (!TOUR_ENABLED || !autoStartAllowed()) return;
  return open({ ...options, auto: true });
}

export function openTour(options = {}) {
  if (!TOUR_ENABLED) return;
  return open({ ...options, auto: false });
}

async function open({ css, opener, auto }) {
  if (S || opening) return;
  opening = true;
  try {
    const mobile = matchMedia(MOBILE).matches;
    const found = await Promise.all(
      stepsFor(mobile).map((s) => waitFor(s.targets, TARGET_WAIT)),
    );
    const available = new Set(
      stepsFor(mobile).filter((_s, i) => found[i]).map((s) => s.id),
    );
    if (!available.size && auto) return;
    await loadCss(css);
    S = build({ opener, mobile, available });
    S.i = 0;
    render(true);
  } finally {
    opening = false;
  }
}

function resolve(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.getClientRects().length) return el;
  }
  return null;
}

function waitFor(selectors, ms) {
  if (resolve(selectors)) return Promise.resolve(true);
  return new Promise((done) => {
    const mo = new MutationObserver(() => {
      if (resolve(selectors)) finish(true);
    });
    const timer = setTimeout(() => finish(false), ms);
    function finish(ok) {
      mo.disconnect();
      clearTimeout(timer);
      done(ok);
    }
    mo.observe(document.body, { childList: true, subtree: true });
  });
}

function isFixed(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement)
    if (getComputedStyle(n).position === "fixed") return true;
  return false;
}

function loadCss(href) {
  if (!href || document.getElementById("iac-tour-css")) return;
  return new Promise((done) => {
    const link = document.createElement("link");
    link.id = "iac-tour-css";
    link.rel = "stylesheet";
    link.href = href;
    link.onload = link.onerror = () => done();
    setTimeout(done, 3000);
    document.head.appendChild(link);
  });
}

function build({ opener, mobile, available }) {
  const t = COPY[LANG];
  const root = document.createElement("div");
  root.className = "iac-tour";
  root.innerHTML = `<div class="iac-tour-ring" aria-hidden="true"></div>
<div class="iac-tour-card" role="dialog" aria-modal="true" aria-labelledby="iac-tour-title" aria-describedby="iac-tour-body">
<p class="iac-tour-count"></p>
<h2 class="iac-tour-title" id="iac-tour-title" tabindex="-1"></h2>
<div class="iac-tour-body" id="iac-tour-body"></div>
<label class="iac-tour-optout"><input type="checkbox"><span></span></label>
<div class="iac-tour-actions"><button type="button" class="iac-tour-skip"></button><button type="button" class="iac-tour-back"></button><button type="button" class="iac-tour-next"></button></div>
</div>`;
  const $ = (s) => root.querySelector(s);
  const s = {
    root,
    ring: $(".iac-tour-ring"),
    card: $(".iac-tour-card"),
    count: $(".iac-tour-count"),
    title: $(".iac-tour-title"),
    body: $(".iac-tour-body"),
    optout: $(".iac-tour-optout"),
    check: $(".iac-tour-optout input"),
    skip: $(".iac-tour-skip"),
    back: $(".iac-tour-back"),
    next: $(".iac-tour-next"),
    opener,
    mobile,
    steps: null,
    i: 0,
    target: null,
    raf: 0,
    cleanup: [],
  };
  s.steps = pick(mobile, available);
  s.optout.querySelector("span").textContent = t.dontShow;
  s.skip.textContent = t.skip;
  s.back.textContent = t.back;
  s.optout.hidden = !storageWorks();

  s.skip.addEventListener("click", () => close("skip"));
  s.back.addEventListener("click", () => go(-1));
  s.next.addEventListener("click", () =>
    S.i === S.steps.length - 1 ? close("finish") : go(1),
  );
  root.addEventListener("keydown", trapTab);

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close("skip");
    }
  };
  const onMove = () => schedule();
  const mq = matchMedia(MOBILE);
  const onBreakpoint = () => relayout(mq.matches);
  const ro = new ResizeObserver(onMove);
  // resize() replaces the map: re-measure when main's content changes
  const mo = new MutationObserver(onMove);
  const main = document.getElementById("observablehq-main") || document.body;
  mo.observe(main, { childList: true, subtree: true });
  document.addEventListener("keydown", onKey, true);
  addEventListener("scroll", onMove, { passive: true });
  addEventListener("resize", onMove, { passive: true });
  visualViewport?.addEventListener("resize", onMove, { passive: true });
  mq.addEventListener("change", onBreakpoint);
  s.ro = ro;
  s.cleanup.push(
    () => document.removeEventListener("keydown", onKey, true),
    () => removeEventListener("scroll", onMove),
    () => removeEventListener("resize", onMove),
    () => visualViewport?.removeEventListener("resize", onMove),
    () => mq.removeEventListener("change", onBreakpoint),
    () => ro.disconnect(),
    () => mo.disconnect(),
  );

  document.getElementById("observablehq-center")?.setAttribute("inert", "");
  document.body.appendChild(root);
  return s;
}

function pick(mobile, available) {
  const all = stepsFor(mobile);
  const some = all.filter((s) => available.has(s.id));
  return some.length ? some : all;
}

function relayout(mobile) {
  if (!S || S.mobile === mobile) return;
  const id = S.steps[S.i].id;
  S.mobile = mobile;
  S.steps = stepsFor(mobile);
  const map = { nav: "navMobile", countries: "navMobile", navMobile: "nav" };
  const j = S.steps.findIndex((s) => s.id === (map[id] || id));
  S.i = j >= 0 ? j : Math.min(S.i, S.steps.length - 1);
  render(true);
}

function go(delta) {
  S.i = Math.max(0, Math.min(S.steps.length - 1, S.i + delta));
  render(true);
}

function render(stepChanged) {
  const t = COPY[LANG];
  const step = S.steps[S.i];
  const copy = t.steps[step.id];
  const last = S.i === S.steps.length - 1;
  S.count.textContent = t.stepOf(S.i + 1, S.steps.length);
  S.title.textContent = copy.title;
  const p = document.createElement("p");
  p.textContent =
    copy.bodyTouch && matchMedia(TOUCH).matches ? copy.bodyTouch : copy.body;
  S.body.replaceChildren(p);
  if (copy.list) {
    const ul = document.createElement("ul");
    for (const [label, text] of copy.list) {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = label;
      li.append(b, " ", text);
      ul.append(li);
    }
    S.body.append(ul);
  }
  S.back.hidden = S.i === 0;
  S.next.textContent = last ? t.finish : t.next;

  if (stepChanged) {
    S.root.classList.add("iac-tour-changing");
    place(true);
    void S.card.offsetWidth;
    S.root.classList.remove("iac-tour-changing");
    S.title.focus({ preventScroll: true });
  } else place(false);
}

function schedule() {
  if (!S || S.raf) return;
  S.raf = requestAnimationFrame(() => {
    if (!S) return;
    S.raf = 0;
    place(false);
  });
}

function frame() {
  const de = document.documentElement;
  return { w: de.clientWidth || innerWidth, h: de.clientHeight || innerHeight };
}

function topInset() {
  const bar = document.querySelector(".mobile-top-bar");
  if (!bar || getComputedStyle(bar).display === "none") return 0;
  return Math.max(0, bar.getBoundingClientRect().bottom);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function place(scroll) {
  const { w, h } = frame();
  const top = topInset();
  const step = S.steps[S.i];
  const target = resolve(step.targets);
  if (target !== S.target) {
    S.ro.disconnect();
    if (target) S.ro.observe(target);
    S.target = target;
  }

  const cardW = Math.min(CARD_MAX, w - 2 * EDGE);
  S.card.style.width = cardW + "px";
  S.card.style.maxHeight = h - 2 * EDGE + "px";
  const cardH = S.card.offsetHeight;
  const useRing = target && h >= TINY_FRAME;

  let r = useRing ? target.getBoundingClientRect() : null;
  const ringH = r ? r.height + 2 * RING_PAD : 0;
  const ringW = r ? Math.min(r.width + 2 * RING_PAD, w) : 0;
  // docked: card at the DOCK edge of the frame, ring in the band left over
  let docked = !useRing || h < SHORT_FRAME || ringH > h - top;
  // stacked: ring and card fit one above the other
  const stacked = !docked && ringH + GAP + cardH <= h - top - 2 * EDGE;
  const besideFits = ringW + GAP + cardW + 2 * EDGE <= w;
  // neither stacked nor side by side (e.g. the whole map on a phone): dock
  if (!docked && !stacked && !besideFits) docked = true;
  const dockY = DOCK === "top" ? top + EDGE : h - EDGE - cardH;
  const band = besideFits
    ? [top, h]
    : DOCK === "top"
      ? [dockY + cardH + GAP, h]
      : [top, dockY - GAP];

  if (scroll && r && !isFixed(target)) {
    let want = null;
    if (docked) {
      const avail = Math.max(0, band[1] - band[0]);
      if (r.top < band[0] + RING_PAD || r.bottom > band[1] - RING_PAD)
        want =
          ringH <= avail
            ? band[0] + (avail - ringH) / 2 + RING_PAD
            : band[0] + RING_PAD;
    } else if (stacked) {
      const visible = r.top - RING_PAD >= top && r.bottom + RING_PAD <= h;
      const room =
        r.top - RING_PAD - GAP - cardH >= top + EDGE ||
        r.bottom + RING_PAD + GAP + cardH <= h - EDGE;
      if (!visible || !room)
        want =
          top + EDGE + (h - top - 2 * EDGE - (cardH + GAP + ringH)) / 2 +
          cardH + GAP + RING_PAD;
    } else if (r.top < top + RING_PAD || r.bottom > h - RING_PAD) {
      want = top + (h - top - ringH) / 2 + RING_PAD;
    }
    if (want !== null) {
      window.scrollTo({ top: scrollY + r.top - want, behavior: "instant" });
      r = target.getBoundingClientRect();
    }
  }

  let ring = null;
  if (r) {
    const x0 = clamp(r.left - RING_PAD, 2, w - 2);
    const x1 = clamp(r.right + RING_PAD, 2, w - 2);
    const y0 = clamp(r.top - RING_PAD, 2, h - 2);
    const y1 = clamp(r.bottom + RING_PAD, 2, h - 2);
    if (x1 - x0 > 8 && y1 - y0 > 8) ring = { x0, x1, y0, y1 };
  }

  let x = (w - cardW) / 2;
  let y = dockY;
  if (ring && docked && ring.x1 > x && ring.x0 < x + cardW &&
      ring.y1 > y && ring.y0 < y + cardH) {
    // beside the ring if there is room, else the ring stops short of the card
    const roomRight = w - EDGE - (ring.x1 + GAP);
    const roomLeft = ring.x0 - GAP - EDGE;
    if (Math.max(roomRight, roomLeft) >= cardW)
      x = roomRight >= roomLeft ? ring.x1 + GAP : ring.x0 - GAP - cardW;
    else if (DOCK === "top" && ring.y1 - band[0] > 8) ring.y0 = band[0];
    else if (DOCK !== "top" && band[1] - ring.y0 > 8) ring.y1 = band[1];
  }
  if (ring) {
    S.ring.classList.remove("iac-tour-ring-none");
    S.ring.style.width = ring.x1 - ring.x0 + "px";
    S.ring.style.height = ring.y1 - ring.y0 + "px";
    S.ring.style.transform = `translate(${ring.x0}px, ${ring.y0}px)`;
  } else {
    S.ring.classList.add("iac-tour-ring-none");
    S.ring.style.width = S.ring.style.height = "0px";
    S.ring.style.transform = `translate(${w / 2}px, ${h / 2}px)`;
  }

  // Card next to the ring: above first, because in the real embed the bottom
  // of the frame is the part most likely below the visitor's window
  if (ring && !docked) {
    const cx = clamp((ring.x0 + ring.x1) / 2 - cardW / 2, EDGE, w - EDGE - cardW);
    const cy = clamp((ring.y0 + ring.y1) / 2 - cardH / 2, top + EDGE, h - EDGE - cardH);
    const fits = {
      above: ring.y0 - GAP - cardH >= top + EDGE && [cx, ring.y0 - GAP - cardH],
      below: ring.y1 + GAP + cardH <= h - EDGE && [cx, ring.y1 + GAP],
      right: ring.x1 + GAP + cardW <= w - EDGE && [ring.x1 + GAP, cy],
      left: ring.x0 - GAP - cardW >= EDGE && [ring.x0 - GAP - cardW, cy],
    };
    const order = [...(step.place || []), "above", "below", "right", "left"];
    const side = order.find((k) => fits[k]);
    if (side) [x, y] = fits[side];
  }
  S.card.style.transform = `translate(${Math.round(x)}px, ${Math.round(Math.max(EDGE, y))}px)`;
}

function focusables() {
  return [...S.card.querySelectorAll("button, input")].filter(
    (el) => !el.hidden && !el.closest("[hidden]") && el.getClientRects().length,
  );
}

function trapTab(e) {
  if (e.key !== "Tab") return;
  const f = focusables();
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && (i <= 0)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && (i === -1 || i === f.length - 1)) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function close(reason) {
  if (!S) return;
  if (reason === "finish" || S.check.checked) write("localStorage", DONE_KEY, "done");
  else write("sessionStorage", SKIP_KEY, "1");
  cancelAnimationFrame(S.raf);
  S.cleanup.forEach((f) => f());
  S.root.remove();
  document.getElementById("observablehq-center")?.removeAttribute("inert");
  const opener = S.opener;
  S = null;
  opener?.focus({ preventScroll: true });
}
