# dfiFull: long table, one row per country x indicator x year -----------------
# Source: Internet Accountability Index workbook V3.0 (sheets 2020-2026,
# header in rows 1-3, data from row 4). Output: CSV on stdout.
# Output columns and order are unchanged from the previous version.

library(dplyr)
library(tidyr)
library(readr)
library(readxl)
library(stringr)
library(purrr)
library(here)

# CONFIG ----------------------------------------------------------------------

# single source of truth: committed workbook, no network
DFI_XLSX <- here("src", "data", "Internet-Accountability-Index-V3.0.xlsx")
# provenance of annual values (published vs carried/backdated); separate file
# so the index workbook keeps its structure. See its Readme sheet.
DFI_PROV <- here("src", "data", "Internet-Accountability-Index-Provenance.xlsx")
stopifnot(
    "Index workbook not found" = file.exists(DFI_XLSX),
    "Provenance workbook not found" = file.exists(DFI_PROV)
)

# READ HELPERS ----------------------------------------------------------------

# everything as text, "NA" and empty cells -> NA; converted to numeric later
read_dfi <- function(sheet, skip = 0) {
    read_excel(
        DFI_XLSX,
        sheet = sheet, skip = skip,
        col_types = "text", na = c("", "NA")
    )
}

# all four-digit sheet names = data years (no hardcoded year vector)
dfi_years <- function() {
    sheets <- excel_sheets(DFI_XLSX)
    sort(sheets[str_detect(sheets, "^\\d{4}$")])
}

# stop early if the sheet layout is not the one this script was written for
check_schema <- function(df, sheet) {
    needed <- c("Countries", "ISO3_CODE", "Total Index Score")
    n_ind <- sum(str_detect(names(df), "^Indicator \\d+-\\d+"))
    n_tot <- sum(str_detect(names(df), "^Total\\.\\.\\."))
    if (!all(needed %in% names(df)) || n_ind != 12 || n_tot != 4) {
        stop(sprintf(
            "Sheet %s: unexpected layout (%d indicator cols, %d Total cols, missing: %s)",
            sheet, n_ind, n_tot, paste(setdiff(needed, names(df)), collapse = ", ")
        ))
    }
    invisible(df)
}

years <- dfi_years()
stopifnot(length(years) >= 1)
latest_sheet <- max(years)

# PROVENANCE ------------------------------------------------------------------

prov_ind <- read_excel(
    DFI_PROV,
    sheet = "Indicators",
    col_types = c("text", "numeric", "text", "text", "numeric", "text")
)
prov_exc <- read_excel(
    DFI_PROV,
    sheet = "Exceptions",
    col_types = c("text", "numeric", "text", "numeric", "text", "numeric", "text")
) %>%
    select(commitment_num, year, status, edition_year)

stopifnot(
    nrow(prov_ind) == 12,
    setequal(prov_ind$commitment_num, 1:12),
    !anyNA(prov_ind$reference_lag)
)

# defaults: every indicator x year is "actual", published in its own edition
build_prov <- function(years) {
    expand_grid(commitment_num = prov_ind$commitment_num, year = as.numeric(years)) %>%
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

# errors stop the build; soft checks go to stderr (stdout carries the CSV)
check_provenance <- function(df, prov) {
    stopifnot(
        all(prov_exc$status %in% c("carried", "backdated", "actual")),
        !anyDuplicated(prov_exc[c("commitment_num", "year")]),
        # typo in year or commitment_num
        nrow(anti_join(prov_exc, prov, by = c("commitment_num", "year"))) == 0,
        !anyNA(prov_exc$edition_year[prov_exc$status %in% c("carried", "backdated")])
    )
    v <- df %>%
        select(ISO3_CODE, commitment_num, year, value) %>%
        left_join(prov, by = c("commitment_num", "year"))
    show <- function(x) paste(capture.output(print(as.data.frame(x))), collapse = "\n")

    # 1. every listed exception has values in the workbook
    no_val <- v %>%
        filter(listed) %>%
        group_by(commitment_num, year) %>%
        summarise(n_val = sum(!is.na(value)), .groups = "drop") %>%
        filter(n_val == 0)
    if (nrow(no_val)) stop("Provenance: exception without values\n", show(no_val))

    # 2. same indicator + same edition_year => identical values per country
    bad_ed <- v %>%
        group_by(commitment_num, edition_year, ISO3_CODE) %>%
        summarise(n_vals = n_distinct(value), .groups = "drop") %>%
        filter(n_vals > 1) %>%
        distinct(commitment_num, edition_year)
    if (nrow(bad_ed)) stop("Provenance: values differ within one edition\n", show(bad_ed))

    # 3. unlisted year (nearly) identical to the previous year looks carried forward
    prior <- v %>%
        select(ISO3_CODE, commitment_num, year, prior_value = value, prior_edition = edition_year) %>%
        mutate(year = year + 1)
    dup <- v %>%
        filter(!listed) %>%
        inner_join(prior, by = c("ISO3_CODE", "commitment_num", "year")) %>%
        filter(prior_edition != edition_year, !is.na(value), !is.na(prior_value)) %>%
        group_by(commitment_num, year) %>%
        summarise(share_same = mean(value == prior_value), .groups = "drop")
    if (any(dup$share_same >= 0.99)) {
        stop(
            "Provenance: looks carried forward, add to Exceptions (or list as 'actual' if confirmed)\n",
            show(filter(dup, share_same >= 0.99))
        )
    }
    if (any(dup$share_same >= 0.95)) {
        message(
            "Provenance warning: >=95% equal to previous year:\n",
            show(filter(dup, share_same >= 0.95))
        )
    }
    invisible(TRUE)
}

# READ ALL DATA FILES ---------------------------------------------------------

# Function to read and process a single year
read_year <- function(year_sheet) {
    # Read the data
    df_raw <- read_dfi(year_sheet, skip = 2)
    check_schema(df_raw, year_sheet)

    df <- df_raw %>%
        # the workbook has formatted-but-empty rows below the data
        filter(!is.na(Countries), !is.na(ISO3_CODE))

    df_long <- df %>%
        select(Countries:`Total Index Score`, -contains("Total...")) %>%
        # make all numeric
        mutate(
            across(
                3:14,
                as.numeric
            )
        ) %>%
        # long form
        pivot_longer(
            3:14,
            names_to = "commitment_num",
            values_to = "value"
        ) %>%
        # keep commitment text
        mutate(
            commitment_txt = str_remove(commitment_num, " \\(new\\)"),
            commitment_txt = str_remove(commitment_txt, "Indicator ")
        ) %>%
        # slice indicator into pillar and commitment
        separate(
            commitment_txt,
            into = c("pillar_num", "commitment_num"),
            sep = "-",
            convert = TRUE
        ) %>%
        mutate(
            pillar_num = as.numeric(pillar_num),
            # substring b/c of FH header
            commitment_num = as.numeric(str_sub(commitment_num, 1, 2))
        ) %>%
        # detect not enough data comments
        # (sheet says "not enough data"; match case-insensitively, keep the
        # label as the front end has always received it)
        mutate(
            note = if_else(
                str_to_lower(str_trim(`Total Index Score`)) == "not enough data",
                "Not enough data",
                NA_character_
            ),
            `Total Index Score` = suppressWarnings(as.numeric(`Total Index Score`)),
            # slice groups
            group = cut(`Total Index Score`,
                breaks = c(-Inf, 50, 65, 80, Inf), right = FALSE, # bands per methodology.md: 0-49 / 50-64 / 65-79 / 80-100
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            group_value = cut(value,
                breaks = c(-Inf, 50, 65, 80, Inf), right = FALSE, # bands per methodology.md: 0-49 / 50-64 / 65-79 / 80-100
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            # Add year column
            year = as.numeric(year_sheet)
        )

    return(df_long)
}

# Read indicators and cardinals from the LATEST sheet
# (V3.0: identical headers on all sheets, indicator set applies to every year)
indicators <- read_dfi(latest_sheet) %>%
    slice(1) %>%
    select(3:5, 7:9, 11:13, 15:17) %>%
    pivot_longer(1:12) %>%
    pull(value)

cardinals <- read_dfi(latest_sheet) %>%
    names() %>%
    tibble() %>%
    rename(name = 1) %>%
    filter(!str_detect(name, "\\.")) %>%
    pull()

stopifnot(length(indicators) == 12, !anyNA(indicators), length(cardinals) == 4)

# the labels come from the latest sheet; flag it if older sheets disagree
indicators_by_year <- map(years, function(y) {
    read_dfi(y) %>%
        slice(1) %>%
        select(3:5, 7:9, 11:13, 15:17) %>%
        unlist(use.names = FALSE)
})
if (!all(map_lgl(indicators_by_year, ~ identical(.x, indicators)))) {
    warning("Indicator names differ between year sheets; labels use sheet ", latest_sheet)
}

# Process all years and combine
df_all_years <- map_dfr(years, read_year)
check_provenance(df_all_years, prov)

# CLEAN COUNTRY NAMES ---------------------------------------

# replacement characters
replacements <- c("é" = "e", "ê" = "e", "à" = "a", "/" = "-")

df_rename <- df_all_years %>%
    # rename var names
    rename(
        NAME_ENGL = Countries,
        total = `Total Index Score`,
    )

# jitter is random: fix the seed so the same input gives the same CSV
set.seed(2026)

dfi_clean <- df_rename %>%
    # drop values without total
    # tidyr::drop_na(total) %>%
    # generate urls
    # mutate(country_url = paste0("countries/", str_to_lower(ISO3_CODE))) %>%
    # Adding a sequential count for commitments within each pillar
    group_by(year, pillar_num, commitment_num) %>%
    mutate(row_id = row_number()) %>% # Count rows within pillar-commitment pairs
    ungroup() %>%
    # sequential count for commitments within each pillar
    group_by(year, pillar_num) %>%
    mutate(x = cumsum(!duplicated(commitment_num))) %>%
    ungroup() %>%
    # adding some jitter to y for integer values
    mutate(y = jitter(value, amount = 2)) %>%
    arrange(year, NAME_ENGL) %>%
    # cardinal lookup
    mutate(
        pillar_num_cardinal = pillar_num,
        pillar_txt = case_match(
            pillar_num_cardinal,
            1 ~ cardinals[1],
            2 ~ cardinals[2],
            3 ~ cardinals[3],
            4 ~ cardinals[4]
        ),
        commitment_num_cardinal = commitment_num,
        commitment_txt_cardinal = case_match(
            commitment_num,
            1 ~ indicators[1],
            2 ~ indicators[2],
            3 ~ indicators[3],
            4 ~ indicators[4],
            5 ~ indicators[5],
            6 ~ indicators[6],
            7 ~ indicators[7],
            8 ~ indicators[8],
            9 ~ indicators[9],
            10 ~ indicators[10],
            11 ~ indicators[11],
            12 ~ indicators[12],
        )
    ) %>%
    group_by(year, NAME_ENGL) %>%
    # facets
    mutate(
        fx = (cur_group_id()) %% 5,
        fy = (cur_group_id()) %/% 5
    ) %>%
    ungroup() %>%
    arrange(year, NAME_ENGL, pillar_num_cardinal, commitment_num_cardinal)

# provenance columns appended last: existing columns and row order unchanged
n_rows <- nrow(dfi_clean)
dfi_clean <- dfi_clean %>%
    left_join(
        select(prov, commitment_num, year, value_status, edition_year, reference_year),
        by = c("commitment_num", "year")
    )
stopifnot(nrow(dfi_clean) == n_rows, !anyNA(dfi_clean$value_status))

cat(format_csv(dfi_clean))
