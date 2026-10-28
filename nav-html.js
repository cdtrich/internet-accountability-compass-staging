// nav-html.js (repo root, next to observablehq.config.js)
// Build-time sidebar markup. Runs in Node, so no DOM and no window.
// Used by observablehq.config.js:  header: ({ path }) => navHtml({ path, base: BASE })

const ITEMS = [
  { id: "map", path: "/", label: "Map" },
  { id: "countries", path: "/countries", label: "Countries" },
  { id: "directions", path: "/directions", label: "Directions" },
  { id: "resources", path: "/resources", label: "Resources" },
  { id: "perspectives", path: "/perspectives", label: "Perspectives" },
  { id: "methodology", path: "/methodology", label: "Methodology" },
];

// Original 24x24 line icons (no third-party icon licence involved).
const svg = (inner, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;

const ICONS = {
  map: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
  countries: `<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>`,
  directions: `<path d="M3 18a9 9 0 0 1 18 0M7 18a5 5 0 0 1 10 0"/>`,
  resources: `<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>`,
  perspectives: `<path d="M4 5h16v11H10l-4 4v-4H4z"/>`,
  methodology: `<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>`,
  bars: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18"/>`,
};

// Framework passes `path` as e.g. "/index", "/countries", "/BEL/index".
// Normalise defensively to "/", "/countries", "/BEL".
export function normalizePath(path) {
  const p = String(path)
    .replace(/\.html$/, "")
    .replace(/(^|\/)index$/, "")
    .replace(/^\/+|\/+$/g, "");
  return "/" + p;
}

function isActive(item, cur) {
  if (item.id === "map") return cur === "/";
  if (item.id === "countries")
    return (
      cur === "/countries" ||
      cur.startsWith("/countries/") ||
      /^\/[A-Z]{3}(\/|$)/.test(cur) // country pages live at /<ISO3>/
    );
  return cur === item.path || cur.startsWith(item.path + "/");
}

// Drawer toggle: the only JS left. Layout switching is pure CSS (max-width: 768px).
const TOGGLE_SCRIPT = `(function(){
  var nav=document.getElementById("sidebar"),
      btn=document.querySelector(".mobile-hamburger"),
      bd=document.getElementById("sidebar-backdrop");
  if(!nav||!btn||!bd)return;
  function set(o){
    nav.classList.toggle("mobile-open",o);
    bd.classList.toggle("visible",o);
    btn.setAttribute("aria-expanded",String(o));
    btn.setAttribute("aria-label",o?"Close navigation":"Open navigation");
  }
  btn.addEventListener("click",function(){set(!nav.classList.contains("mobile-open"))});
  bd.addEventListener("click",function(){set(false)});
  nav.addEventListener("click",function(e){if(e.target.closest("a"))set(false)});
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&nav.classList.contains("mobile-open")){set(false);btn.focus()}
  });
  window.matchMedia("(min-width: 769px)").addEventListener("change",function(m){if(m.matches)set(false)});
})();`;

export function navHtml({ path, base = "" }) {
  const b = String(base).replace(/\/+$/, ""); // "" or "/internet-accountability-compass"
  const cur = normalizePath(path);

  const links = ITEMS.map((item) => {
    const active = isActive(item, cur);
    return `<li><a href="${b}${item.path}" title="${item.label}"${
      active ? ' class="active" aria-current="page"' : ""
    }>${svg(ICONS[item.id])}<span>${item.label}</span></a></li>`;
  }).join("");

  return `<nav class="sidebar" id="sidebar" aria-label="Main navigation"><div class="sidebar-content"><ul class="sidebar-menu">${links}</ul></div></nav>
<div class="mobile-top-bar"><button class="mobile-hamburger" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation">${svg(ICONS.bars, "icon-bars")}${svg(ICONS.close, "icon-close")}</button></div>
<div class="sidebar-backdrop" id="sidebar-backdrop"></div>
<script>${TOGGLE_SCRIPT}</script>`;
}
