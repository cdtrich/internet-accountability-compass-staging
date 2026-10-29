// Inline line icons (same style as the nav in nav-html.js), coloured via currentColor
const svgIcon = (inner) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;

const SOURCE_CONFIG = [
  {
    fullType: "Analysis",
    icon: svgIcon('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
    label: "Analysis",
    color: "#007162",
    textColor: "#007162",
  },
  {
    fullType: "Source",
    icon: svgIcon('<path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5M12 6.5C14 5 17 4.5 21 5v13c-4-.5-7 0-9 1.5M12 6.5v13"/>'),
    label: "Source",
    color: "#4ed0bf",
    textColor: "#007162",
  },
  {
    fullType: "Project",
    icon: svgIcon('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    label: "Project",
    color: "#FDE74C",
    textColor: "#7a6800",
  },
  {
    fullType: "Academic",
    icon: svgIcon('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'),
    label: "Academic",
    color: "#555555",
    textColor: "#555555",
  },
];

export const SOURCE_TYPE_COLORS = Object.fromEntries(
  SOURCE_CONFIG.map(({ fullType, color }) => [fullType, color]),
);

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function applyStyles(item, config, isSelected) {
  const { color, textColor } = config;
  const { r, g, b } = hexToRgb(color);
  if (isSelected) {
    item.style.backgroundColor = color;
    item.style.color = luminance(color) > 0.5 ? "#333" : "white";
  } else {
    item.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
    item.style.color = textColor;
  }
}

export function viewofSourcesLegend(initialType = "Analysis") {
  const selectedValue = { value: initialType };

  const container = document.createElement("div");
  container.className = "custom-legend";

  SOURCE_CONFIG.forEach((config) => {
    const { fullType, icon, label } = config;
    const item = document.createElement("div");
    item.className = "legend-item sources-legend-item";
    item.dataset.value = fullType;
    item.innerHTML = `<span class="sources-legend-icon">${icon}</span><span class="sources-legend-label">${label}</span>`;

    applyStyles(item, config, fullType === initialType);

    item.addEventListener("click", () => {
      const next = selectedValue.value === fullType ? null : fullType;
      selectedValue.value = next;
      container.querySelectorAll(".legend-item").forEach((el) => {
        const cfg = SOURCE_CONFIG.find((c) => c.fullType === el.dataset.value);
        applyStyles(el, cfg, el.dataset.value === next);
      });
      container.value = next;
      container.dispatchEvent(new Event("input"));
    });

    container.appendChild(item);
  });

  Object.defineProperty(container, "value", {
    get: () => selectedValue.value,
    set: (v) => {
      selectedValue.value = v;
      container.querySelectorAll(".legend-item").forEach((el) => {
        const cfg = SOURCE_CONFIG.find((c) => c.fullType === el.dataset.value);
        applyStyles(el, cfg, el.dataset.value === v);
      });
    },
  });

  return container;
}
