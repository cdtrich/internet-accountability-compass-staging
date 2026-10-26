import { basePath } from "./basePath.js";

export function featuredPreview() {
  const posts = [
    {
      title: "Charting a Way for Stronger Internet Accountability",
      slug: "charting-a-way-for-stronger-internet-accountability",
      image: "https://picsum.photos/seed/charting/640/340",
      date: "27 May 2026",
      author: "Patryk Pawlak",
    },
    {
      title:
        "From Promises to Practice: The Real Test of Global Digital Cooperation",
      slug: "from-promises-to-practice-the-real-test-of-global-digital-cooperation",
      image: "https://picsum.photos/seed/cooperation/640/340",
      date: "27 April 2026",
      author: "Patryk Pawlak and Nils Berglund",
    },
    {
      title:
        "Internet accountability in Latin America and the Caribbean: state of play and outlook",
      url: "https://cadmus.eui.eu/entities/publication/c487323d-0240-4ab5-a785-8af8aa94e1e0",
      image: "https://picsum.photos/seed/aigovernance42/640/340",
      date: "June 2026",
      author: "Olga Cavalli",
    },
  ];

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="grid grid-cols-3">
      ${posts
        .map((post) => {
          const href = post.url ?? `${basePath}/perspectives#${post.slug}`;
          const external = !!post.url;
          return `
        <a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""} class="blog-preview-tile">
          <div class="blog-img-wrap blog-img-wrap--tile">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </div>
          <p class="blog-preview-title">${post.title}</p>
          <span class="blog-date">${post.date} · ${post.author}</span>
        </a>
      `;
        })
        .join("")}
    </div>
  `;

  return container.firstElementChild;
}
