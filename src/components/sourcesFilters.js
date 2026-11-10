const X_ICON =
  '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2 2l8 8M10 2l-8 8"/></svg>';

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/**
 * Filter bar: country/region, cardinal direction, type, keyword.
 * Behaves as an Observable view: .value is an object, "input" fires on change.
 *
 * countries: [{ value: ISO3, label: name }]  (value is what the map uses)
 * directions, types: string[]
 *
 * Extra method for the map link: root.setCountry(iso3 | null)
 */
export function sourcesFilters({ countries, directions, types }) {
  const state = { country: null, direction: null, type: null, keyword: "" };
  const fields = {};

  const root = el("div", "src-filters");
  root.setAttribute("role", "search");

  function commit(key, value) {
    state[key] = value;
    const { control, clear } = fields[key];
    const isSet = key === "keyword" ? value !== "" : value !== null;
    control.classList.toggle("is-set", isSet);
    clear.classList.toggle("is-active", isSet);
    root.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function field(key, label, control) {
    control.id = `src-filter-${key}`;
    control.classList.add("src-filter-control");

    const wrap = el("div", "src-filter");
    const lab = el("label", "src-filter-label");
    lab.htmlFor = control.id;
    lab.textContent = label;

    const row = el("div", "src-filter-row");
    const clear = el("button", "src-filter-clear");
    clear.type = "button";
    clear.setAttribute("aria-label", `Clear ${label.toLowerCase()}`);
    clear.innerHTML = X_ICON;

    fields[key] = { control, clear };

    const read = () =>
      key === "keyword" ? control.value : control.value || null;
    control.addEventListener(key === "keyword" ? "input" : "change", () =>
      commit(key, read()),
    );
    clear.addEventListener("click", () => {
      control.value = "";
      commit(key, key === "keyword" ? "" : null);
      control.focus();
    });

    row.append(control, clear);
    wrap.append(lab, row);
    root.append(wrap);
  }

  function select(key, label, allLabel, options) {
    const s = el("select");
    s.append(new Option(allLabel, ""));
    options.forEach((o) => {
      const { value, label: text } =
        typeof o === "string" ? { value: o, label: o } : o;
      s.append(new Option(text, value));
    });
    field(key, label, s);
  }

  select("country", "Country/region", "All countries/regions", countries);
  select("direction", "Cardinal direction", "All directions", directions);
  select("type", "Type", "All types", types);

  const kw = el("input");
  kw.type = "text";
  kw.placeholder = "Search title or publisher";
  kw.autocomplete = "off";
  field("keyword", "Keyword", kw);

  // Called by the map on click; no-op if the value is unchanged
  root.setCountry = (iso) => {
    const next = iso || null;
    if (state.country === next) return;
    fields.country.control.value = next ?? "";
    commit("country", next);
  };

  Object.defineProperty(root, "value", { get: () => ({ ...state }) });
  return root;
}
