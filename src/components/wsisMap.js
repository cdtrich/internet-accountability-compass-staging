// src/components/wsisMap.js
// Dot chart: x = three categories, y = indicators, one dot per related
// Action Line / SDG target / GDC reference. Hover = tooltip, click = source.
// Plain DOM + SVG, no imports. All styling lives in style.css (.wsis-*).

const CATEGORIES = [
  { key: "actionline", label: "Closest Action Lines" },
  { key: "sdg", label: "Related SDG targets" },
  { key: "gdc", label: "Related GDC commitments" },
];

const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_W = 640; // same column width as the text and tables
const FS = 12; // .chart-axistext is 12px
const LH = 15; // line height for wrapped labels
const STEP = 20; // spacing between dots
const R = 6; // dot radius (hover radius is set in CSS)

function svgEl(tag, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

// rough word wrap: average glyph width ~0.56em
function wrap(text, maxPx, k = 0.56) {
  const maxChars = Math.max(8, Math.floor(maxPx / (FS * k)));
  const lines = [];
  let cur = "";
  for (const word of String(text).split(" ")) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// lines: [{ text, cls }]
function drawLines(parent, lines, x, yFirst, anchor) {
  const t = svgEl(
    "text",
    { x, y: yFirst, "text-anchor": anchor, class: "chart-axistext" },
    parent,
  );
  lines.forEach((l, i) => {
    const sp = svgEl(
      "tspan",
      { x, dy: i === 0 ? 0 : LH, ...(l.cls ? { class: l.cls } : {}) },
      t,
    );
    sp.textContent = l.text;
  });
  return t;
}

// one shared body-level tooltip, same markup/classes as the other charts
function getTooltip() {
  let tip = document.body.querySelector(".wsis-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tooltip wsis-tooltip";
    document.body.appendChild(tip);
  }
  return tip;
}

function showTooltip(tip, d, pageX, pageY) {
  tip.textContent = "";
  const add = (cls, text) => {
    const el = document.createElement("div");
    el.className = cls;
    el.textContent = text;
    tip.appendChild(el);
  };
  add("tt-title", d.label);
  add("tt-context", d.text);
  if (d.note === "also") add("tt-note", "Secondary link");
  if (d.note === "especially") add("tt-note", "Of particular relevance");
  tip.style.visibility = "visible";
  const maxLeft =
    window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 8;
  tip.style.left = `${Math.max(0, Math.min(pageX + 10, maxLeft))}px`;
  tip.style.top = `${pageY - 10}px`;
}

export function wsisMap(data, pillar, { width = MAX_W } = {}) {
  const rows = data.filter((d) => d.pillar === pillar);
  const container = document.createElement("div");
  container.className = "wsis-map";
  if (!rows.length) return container;

  // width is 0 while the <details> is closed
  const W = Math.max(300, Math.min(Math.round(width), MAX_W));
  const indicators = [...new Set(rows.map((d) => d.indicator))];
  const left = Math.round(Math.min(190, Math.max(90, W * 0.28)));
  const bandW = (W - left - 8) / CATEGORIES.length;
  const perLine = Math.max(1, Math.floor((bandW - 8) / STEP));

  const headerLines = CATEGORIES.map((c) =>
    wrap(c.label, bandW - 10, 0.6).map((text) => ({ text, cls: "wsis-head" })),
  );
  const headerH = Math.max(...headerLines.map((l) => l.length)) * LH + 12;

  let y = headerH;
  const layout = indicators.map((name) => {
    const cells = CATEGORIES.map((c) =>
      rows.filter((d) => d.indicator === name && d.category === c.key),
    );
    const first = rows.find((d) => d.indicator === name);
    const labelLines = [
      ...wrap(name, left - 12, 0.6).map((text) => ({ text, cls: "wsis-name" })),
      ...wrap(first.source, left - 12).map((text) => ({ text })),
    ];
    const dotLines = Math.max(
      ...cells.map((c) => Math.ceil(c.length / perLine)),
    );
    const h = Math.max(labelLines.length * LH, dotLines * STEP) + 22;
    const row = { name, first, cells, labelLines, top: y, h };
    y += h;
    return row;
  });
  const noteText =
    "Hover over an indicator or a dot for details, click a dot to open the source text." +
    (rows.some((d) => d.note === "also")
      ? " Hollow dots mark secondary links."
      : "");
  const noteLines = wrap(noteText, W).map((text) => ({ text }));
  const H = y + 14 + noteLines.length * LH + 4;

  const svg = svgEl(
    "svg",
    {
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
      role: "group",
      "aria-label": `${pillar}: links between the indicators and WSIS Action Lines, SDG targets and Global Digital Compact commitments`,
    },
    container,
  );

  const tip = getTooltip();
  const hide = () => (tip.style.visibility = "hidden");

  CATEGORIES.forEach((c, i) => {
    drawLines(svg, headerLines[i], left + bandW * (i + 0.5), LH - 3, "middle");
  });
  svgEl(
    "line",
    {
      x1: 0,
      x2: W,
      y1: headerH - 4,
      y2: headerH - 4,
      class: "wsis-rule wsis-rule--head",
    },
    svg,
  );

  for (const r of layout) {
    svgEl(
      "line",
      { x1: 0, x2: W, y1: r.top + r.h, y2: r.top + r.h, class: "wsis-rule" },
      svg,
    );
    const textTop = r.top + r.h / 2 - ((r.labelLines.length - 1) * LH) / 2 + 4;
    const nameLink = svgEl(
      "a",
      {
        href: r.first.indicator_href,
        target: "_blank",
        rel: "noopener",
        "aria-label": `${r.name}: ${r.first.shows}`,
      },
      svg,
    );
    drawLines(nameLink, r.labelLines, 0, textTop, "start");
    const nameTip = { label: r.name, text: r.first.shows };
    nameLink.addEventListener("pointerenter", (e) =>
      showTooltip(tip, nameTip, e.pageX, e.pageY),
    );
    nameLink.addEventListener("pointermove", (e) =>
      showTooltip(tip, nameTip, e.pageX, e.pageY),
    );
    nameLink.addEventListener("pointerleave", hide);
    nameLink.addEventListener("focus", () => {
      const b = nameLink.getBoundingClientRect();
      showTooltip(
        tip,
        nameTip,
        b.left + window.scrollX,
        b.bottom + window.scrollY,
      );
    });
    nameLink.addEventListener("blur", hide);

    r.cells.forEach((items, ci) => {
      const bandX = left + bandW * ci;
      const lines = Math.ceil(items.length / perLine);
      const blockTop = r.top + r.h / 2 - ((lines - 1) * STEP) / 2;
      items.forEach((d, k) => {
        const line = Math.floor(k / perLine);
        const inLine = Math.min(perLine, items.length - line * perLine);
        const cx =
          bandX + bandW / 2 - ((inLine - 1) * STEP) / 2 + (k % perLine) * STEP;
        const cy = blockTop + line * STEP;

        const a = svgEl(
          "a",
          {
            href: d.href,
            target: "_blank",
            rel: "noopener",
            "aria-label": `${d.label}: ${d.text}`,
          },
          svg,
        );
        const dot = svgEl(
          "circle",
          {
            cx,
            cy,
            r: R,
            class:
              d.note === "also" ? "wsis-dot wsis-dot--secondary" : "wsis-dot",
          },
          a,
        );
        a.addEventListener("pointerenter", (e) =>
          showTooltip(tip, d, e.pageX, e.pageY),
        );
        a.addEventListener("pointermove", (e) =>
          showTooltip(tip, d, e.pageX, e.pageY),
        );
        a.addEventListener("pointerleave", hide);
        a.addEventListener("focus", () => {
          const b = dot.getBoundingClientRect();
          showTooltip(
            tip,
            d,
            b.left + b.width / 2 + window.scrollX,
            b.top + window.scrollY,
          );
        });
        a.addEventListener("blur", hide);
      });
    });
  }

  drawLines(svg, noteLines, 0, y + 22, "start");

  return container;
}
