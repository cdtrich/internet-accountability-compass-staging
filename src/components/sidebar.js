import { basePath } from "./basePath.js";

export function sidebar() {
  const isMobile = window.innerWidth <= 768;

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="sidebar${isMobile ? " mobile-hidden" : ""}" id="sidebar">
      <div class="sidebar-content">
        <ul class="sidebar-menu">
          <li>
            <a href="${basePath}/index">
              <i class="fas fa-globe"></i>
              <span>Map</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/countries">
              <i class="fas fa-flag"></i>
              <span>Countries</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/directions">
              <i class="fas fa-rainbow"></i>
              <span>Directions</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/resources">
              <i class="fas fa-newspaper"></i>
              <span>Resources</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/perspectives">
              <i class="fas fa-comments"></i>
              <span>Perspectives</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/methodology">
              <i class="fas fa-tools"></i>
              <span>Methodology</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  `;

  const sidebarEl = container.querySelector("#sidebar");

  function highlightCurrentPage() {
    const currentPath = window.location.pathname.replace(basePath, "") || "/";
    const links = container.querySelectorAll(".sidebar-menu a");
    links.forEach((link) => {
      const href = link.getAttribute("href").replace(basePath, "");
      if (
        (href === "/index" &&
          (currentPath === "/" || currentPath === "/index")) ||
        (href === "/countries" && currentPath.startsWith("/countries")) ||
        (href === "/directions" && currentPath.startsWith("/directions")) ||
        (href === "/resources" && currentPath.startsWith("/resources")) ||
        (href === "/perspectives" && currentPath.startsWith("/perspectives")) ||
        (href === "/methodology" && currentPath.startsWith("/methodology"))
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  highlightCurrentPage();

  if (isMobile) {
    // Remove stale instances from previous renders before creating new ones
    document
      .querySelectorAll(".mobile-top-bar, .sidebar-backdrop, #sidebar")
      .forEach((el) => el.remove());

    const topBar = document.createElement("div");
    topBar.className = "mobile-top-bar";
    topBar.innerHTML = `<button class="mobile-hamburger" aria-label="Open navigation"><i class="fas fa-bars"></i></button>`;

    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";

    const hamburger = topBar.querySelector(".mobile-hamburger");

    function openNav() {
      sidebarEl.classList.add("mobile-open");
      backdrop.classList.add("visible");
      hamburger.innerHTML = `<i class="fas fa-xmark"></i>`;
      hamburger.setAttribute("aria-label", "Close navigation");
    }

    function closeNav() {
      sidebarEl.classList.remove("mobile-open");
      backdrop.classList.remove("visible");
      hamburger.innerHTML = `<i class="fas fa-bars"></i>`;
      hamburger.setAttribute("aria-label", "Open navigation");
    }

    hamburger.addEventListener("click", () => {
      sidebarEl.classList.contains("mobile-open") ? closeNav() : openNav();
    });

    backdrop.addEventListener("click", closeNav);

    sidebarEl.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    // Append directly to body so the sidebar shares the root stacking context
    // with the backdrop — rendering it inside #observablehq-center would put it
    // in a nested stacking context where z-index can't beat the backdrop.
    document.body.appendChild(sidebarEl);
    document.body.appendChild(topBar);
    document.body.appendChild(backdrop);

    return document.createElement("span"); // placeholder; sidebar is in body
  }

  return container.firstElementChild;
}
