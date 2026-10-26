const SOURCE_CONFIG = [
  {
    fullType: "Analysis",
    icon: '<i class="fa-solid fa-magnifying-glass"></i>',
    label: "Analysis",
    color: "#007162",
    textColor: "#007162",
  },
  {
    fullType: "Source",
    icon: '<i class="fa-solid fa-book-open"></i>',
    label: "Source",
    color: "#4ed0bf",
    textColor: "#007162",
  },
  {
    fullType: "Project",
    icon: '<i class="fa-solid fa-flag"></i>',
    label: "Project",
    color: "#FDE74C",
    textColor: "#7a6800",
  },
  {
    fullType: "Academic",
    icon: '<i class="fa-solid fa-graduation-cap"></i>',
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
