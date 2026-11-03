## Phase 3b: Provenance markers (published vs computed values)

Insert after Phase 3 and renumber as needed. Staging/dev only. Do not push to `main`.

### Goal

In the historical indicator charts on country pages, show which annual values
were **published** in that year's edition and which are **computed** (carried
forward from an earlier edition, or backdated from a later one). Published =
filled dot, computed = hollow dot. Pillar and total scores are always computed
from several indicators and are explained on the methodology page, so they get
no status marking.

### Inputs (already prepared)

- `Internet-Accountability-Index-Provenance.xlsx`: new file, copy to
  `src/data/`. It is deliberately **not** a sheet in the index workbook, so the
  index workbook's structure and the V6 schema check are unaffected.
- **Default is "published".** Every indicator x year is `actual` unless listed
  as an exception, so a new data year needs no edits unless an indicator was
  not newly published.
- Sheet `Exceptions` (16 rows): `indicator_id, commitment_num, indicator, year,
  status, edition_year, note`. `status` is `carried` (earlier edition held
  forward), `backdated` (later edition applied to an earlier year) or `actual`
  (confirmed as published; suppresses the near-duplicate check below).
  `edition_year` is the edition the value really comes from (2018 for ICT
  2020-22).
- Sheet `Indicators` (12 rows): `indicator_id, commitment_num, indicator,
  source, reference_lag, note`. `reference_lag` is 1 for Access Now, Freedom
  House and both V-Dem indicators (edition 2026 describes 2025), else 0.
- Indicator-years with no data at all (Network Readiness 2020, GIRAI before
  2024) are deliberately not listed: the workbook has NA and nothing is drawn.
- Join key to `dfiFull`: `commitment_num` (1-12) + `year`.
- Treat INDIGO 2024 as published, as stated in the availability table.

### Scope

| File | Change |
|---|---|
| `src/data/dfiFull.csv.R` | join provenance, validate, append 3 columns |
| `src/data/dfiCardinal.csv.R` | **no change** |
| `src/components/indicatorHistorical.js` | dots, dashed segments, tooltip |
| `src/components/` (pillar sparkline, `pillarSparklineD3`) | remove the dots from the pillar area chart; keep line, area and any hover readout |
| `src/components/` new `statusLegend.js`, `tokens.js` | legend component, status marker tokens |
| `src/countries/template.md` | place the legend, regenerate country pages |
| `src/components/sparklineTableD3.js` (home table) | **no change** (aggregates) |

Read `indicatorHistorical.js`, the pillar sparkline component and
`src/countries/template.md` in full before editing; they were not reviewed when
this brief was written.

### Step 1: Loader (`dfiFull.csv.R`)

1. Build the full status grid from the two sheets, next to the existing
   config (draft, untested; adapt freely):

   ```r
   DFI_PROV <- here("src", "data", "Internet-Accountability-Index-Provenance.xlsx")
   prov_ind <- read_excel(
       DFI_PROV, sheet = "Indicators",
       col_types = c("text", "numeric", "text", "text", "numeric", "text")
   )
   prov_exc <- read_excel(
       DFI_PROV, sheet = "Exceptions",
       col_types = c("text", "numeric", "text", "numeric", "text", "numeric", "text")
   ) %>%
       select(commitment_num, year, status, edition_year)

   # defaults: every indicator x year is "actual" published in its own edition
   build_prov <- function(years) {
       tidyr::expand_grid(commitment_num = prov_ind$commitment_num, year = as.numeric(years)) %>%
           left_join(select(prov_ind, commitment_num, reference_lag), by = "commitment_num") %>%
           left_join(prov_exc, by = c("commitment_num", "year")) %>%
           mutate(
               listed = !is.na(status),
               value_status = coalesce(status, "actual"),
               edition_year = coalesce(edition_year, year),
               reference_year = edition_year - reference_lag
           ) %>%
           select(commitment_num, year, listed, value_status, edition_year, reference_year)
   }
   prov <- build_prov(years)
   ```

2. Validate right after `df_all_years <- map_dfr(years, read_year)`. Errors use
   `stop()`, soft checks use `message()` because stdout carries the CSV:

   ```r
   check_provenance <- function(df, prov) {
       stopifnot(
           all(prov_exc$status %in% c("carried", "backdated", "actual")),
           !anyDuplicated(prov_exc[c("commitment_num", "year")]),
           nrow(anti_join(prov_exc, prov, by = c("commitment_num", "year"))) == 0,  # typo in year/commitment
           !anyNA(prov_exc$edition_year[prov_exc$status %in% c("carried", "backdated")])
       )
       v <- df %>%
           select(ISO3_CODE, commitment_num, year, value) %>%
           left_join(prov, by = c("commitment_num", "year"))
       show <- function(x) paste(capture.output(print(x)), collapse = "\n")

       # 1. every listed exception has values in the workbook
       no_val <- v %>% filter(listed) %>%
           group_by(commitment_num, year) %>%
           summarise(n_val = sum(!is.na(value)), .groups = "drop") %>% filter(n_val == 0)
       if (nrow(no_val)) stop("Provenance: exception without values\n", show(no_val))

       # 2. same indicator + same edition_year => identical values per country
       bad_ed <- v %>%
           group_by(commitment_num, edition_year, ISO3_CODE) %>%
           summarise(n_vals = n_distinct(value), .groups = "drop") %>%
           filter(n_vals > 1) %>% distinct(commitment_num, edition_year)
       if (nrow(bad_ed)) stop("Provenance: values differ within one edition\n", show(bad_ed))

       # 3. unlisted row that is (nearly) identical to the previous year looks carried forward
       prior <- v %>%
           select(ISO3_CODE, commitment_num, year, prior_value = value, prior_edition = edition_year) %>%
           mutate(year = year + 1)
       dup <- v %>%
           filter(!listed) %>%
           inner_join(prior, by = c("ISO3_CODE", "commitment_num", "year")) %>%
           filter(prior_edition != edition_year, !is.na(value), !is.na(prior_value)) %>%
           group_by(commitment_num, year) %>%
           summarise(share_same = mean(value == prior_value), .groups = "drop")
       if (any(dup$share_same >= 0.99))
           stop("Provenance: looks carried forward, add to Exceptions (or list as 'actual' if confirmed)\n", show(filter(dup, share_same >= 0.99)))
       if (any(dup$share_same >= 0.95))
           message("Provenance warning: >=95% equal to previous year:\n", show(filter(dup, share_same >= 0.95)))
       invisible(TRUE)
   }
   check_provenance(df_all_years, prov)
   ```

   Expected on V3.0: 0 errors and exactly one message, INDIGO
   (`commitment_num` 9) 2024 at about 0.957. This is a known, accepted case.
   The next highest unlisted share is 0.845 (Global Internet Shutdowns 2024),
   well below the 99% stop. I verified the same rules against the V3.0
   workbook in Python with the same result, and that the grid rebuilt from the
   two sheets matches the full status table.

   Why check 3 matters: if a future release forgets to list a carried
   indicator, it would silently be labelled "published". A carried value is
   100% identical to the previous year, so the build stops instead.

3. Append the three columns at the very end of the pipeline so existing column
   order and row order are unchanged and the jitter seed is not affected:

   ```r
   dfi_clean <- dfi_clean %>%
       left_join(select(prov, commitment_num, year, value_status, edition_year, reference_year),
                 by = c("commitment_num", "year"))
   cat(format_csv(dfi_clean))
   ```

4. Verify: `value_status`, `edition_year`, `reference_year` present;
   `nrow()` identical to before; all pre-existing columns byte-identical to the
   previous output (diff the two CSVs with the three new columns dropped).
   Status counts on V3.0, over the 84 indicator-years: 68 `actual` (of which 5
   have no data at all and are never drawn), 15 `carried`, 1 `backdated`.

Gotcha: Framework's loader cache follows the loader script, not the files it
reads. After editing the provenance file run `npm run clean` (or touch the
loader) before checking output.

### Step 2: Marker tokens and legend

- `tokens.js`: add `statusMarkers`, e.g. published = filled with the pillar
  colour; computed = fill with the card background, stroke in the pillar
  colour, 1.5 px, same radius. The hollow marker must be opaque so the line
  does not show through. Use the existing card background token or CSS
  variable; do not hardcode white.
- `statusLegend.js`: returns an **HTML** element (flex, wraps) with two inline
  SVG markers and this text (English only):

  `Indicator charts:  ● Published in that year's edition   ○ Computed (carried forward or backdated)`

  Do not draw the legend text in SVG: `style.css` forces svg text to 16px
  Nunito Sans. It must wrap cleanly at 361 px and 393 px widths, inside the
  iframe.

### Step 3: Indicator charts (`indicatorHistorical.js`)

Applies to the highlighted country only; the grey all-country lines stay as
they are.

1. Draw a marker on every data point of the highlighted country, always
   visible (no hover required; phones have none). Style by `value_status`:
   `actual` filled, `carried` and `backdated` hollow. Indicator-years with no
   value draw nothing (the existing NA filter already handles this).
2. Segments with a computed point at either end: `stroke-dasharray: 3 3`.
   Segments between two published points stay solid. Use `line.defined()` so
   gaps from missing values stay gaps.
3. Replace `curveCatmullRom` with `curveMonotoneX` in these charts; Catmull-Rom
   can overshoot and imply a trend the data does not have.
4. Tooltip, English only, built from the row (keep the existing tooltip
   element and positioning):
   - actual: `<strong>72</strong> · 2026 edition`, and when
     `reference_year` differs from `year`: `<strong>72</strong> · 2026 edition
     (data for 2025)`
   - carried: `<strong>72</strong> · computed: 2024 edition carried forward`
   - backdated: `<strong>72</strong> · computed: 2021 edition applied to 2020`
5. Each marker gets an SVG `<title>` with the same text, so the status is not
   conveyed by fill alone.
6. The x-axis stays on the edition year (`year`). Do not shift lines to the
   reference year.

### Step 4: Pillar area chart

Remove the persistent dots from the pillar area chart on country pages. Keep
the line, the area and any hover readout; if the hover readout is implemented
as the dot, keep a transient hover marker only and ask before changing
behaviour further. No status marking on this chart.

### Step 5: Legend placement and page regeneration

- Place the legend directly under the Latest/Historical toggle on country
  pages, once per page, in `src/countries/template.md`. Render it only when
  `viewMode === "historical"`; in Latest mode it must not take up space.
- This requires regenerating the ~190 country pages. **Risk:** touches every
  generated page. **Before:** commit on the staging branch, with generated
  pages committed. **After:** `git diff --stat` should show only the generated
  pages plus the intended files, and the diff in each page must be the same
  small legend insertion and nothing else. **Rollback:** `git revert` of that
  one commit; the loader and component changes are additive and independent.
- Do not touch the home page table (`sparklineTableD3.js`) or the maps.

### Acceptance checks (staging, inside the iframe test page)

1. Loader: no errors; one INDIGO 2024 message; temporarily removing one
   Exceptions row (e.g. Global E-Waste Monitor 2021) makes the loader stop
   with the "looks carried forward" error, then restore it; CSV differs from the old one
   only by the three appended columns.
2. A country with computed values in several indicators, for example
   Afghanistan: Global E-Waste Monitor shows filled dots at 2020 and 2024 and
   hollow dots at 2021-23 and 2025-26, with dashed segments around the hollow
   ones; Global Cybersecurity Index shows hollow at 2020 (backdated).
3. Rule of Law, Freedom in the World, V-Dem indicators and Internet Resilience:
   all filled, all solid.
4. Tooltip text matches Step 3 for one published, one carried and one
   backdated point; Freedom in the World 2026 reads "(data for 2025)".
5. Legend appears once under the toggle in Historical, not in Latest; wraps at
   361 px and 393 px; no horizontal page scroll in any iframe size.
6. Pillar area chart has no dots; the rest of the page renders unchanged.
7. `npm run build` passes; live site untouched.

Report back with the `git diff --stat` and screenshots at 393 px and desktop
width before moving on.
