import { navHtml } from "./nav-html.js";

// Staging builds are detected by the repo name inside BASE_PATH
// (".../internet-accountability-compass-staging/"). Live never matches.
const staging = (process.env.BASE_PATH ?? "").includes("staging");

// See https://observablehq.com/framework/config for documentation.
export default {
  // The project’s title; used in the sidebar and webpage titles.
  title: "Internet Accountability Compass",
  base: process.env.BASE_PATH ?? "/internet-accountability-compass/",
  root: "src",

  assets: [
    { from: "src/data", to: "_file/data" }, // copies data
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  // head: '<link rel="icon" href="observable.png" type="image/png" sizes="32x32">',

  // theme
  theme: "air", // try "light", "dark", "slate", etc.
  // custom stylesheet
  style: "style.css",

  // Some additional configuration options and their defaults:
  // header: "Internet Accountability Compass", // what to show in the header (HTML)
  // Static sidebar, rendered at build time with the active entry from `path`
  // ("/index", "/countries", "/BEL/index"). base is "" on purpose: Framework
  // treats root-relative paths in header/head as relative to src/ and rewrites
  // them per page ("../countries"), so they work under any base path. A
  // base-prefixed href would become "../internet-accountability-compass/…".
  header: ({ path }) => navHtml({ path, base: "" }),
  footer: false, // what to show in the footer (HTML)
  sidebar: false, // whether to show the sidebar
  toc: false, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // cleanUrls: true, // drop .html from URLs

  // Sidebar stylesheet on every page (root-relative, see header); staging
  // only: hide from search engines and show a "STAGING" label
  head:
    '<link rel="stylesheet" href="/sidebar.css">' +
    (staging
    ? `<meta name="robots" content="noindex"><style>body::after{content:"STAGING";position:fixed;right:8px;bottom:8px;z-index:2147483647;background:#f61067;color:#fff;font:700 11px/1 sans-serif;letter-spacing:.08em;padding:4px 8px;border-radius:3px;pointer-events:none}</style>`
    : ""),
};
