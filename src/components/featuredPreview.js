import { FileAttachment } from "observablehq:stdlib";
import { basePath } from "./basePath.js";

const wsisImage = await FileAttachment(
  "../img/perspectives_entry4_wsis.jpg",
).url();

export function featuredPreview() {
  const posts = [
    {
      title:
        "Using the Internet Accountability Compass to explore WSIS and GDC implementation",
      slug: "using-the-internet-accountability-compass-to-explore-wsis-and-gdc-implementation",
      image: wsisImage,
      date: "6 November 2026",
      author: "Nils Berglund",
    },
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
