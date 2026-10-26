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

# "xlsx"   = committed workbook in src/data (reproducible, no network)
# "gsheet" = live Google Sheet (previous behaviour; needs googlesheets4)
DFI_SOURCE <- "xlsx"
DFI_XLSX <- here("src", "data", "Internet-Accountability-Index-V3.0.xlsx")
DFI_SHEET_ID <- "15_2sax_UIxuyDnvFvwQD3ZKi-h5IyzDxZCxXwwR-9xA"

if (DFI_SOURCE == "gsheet") {
    library(googlesheets4)
    gs4_deauth() # public/link-shareable sheet
}

# READ HELPERS ----------------------------------------------------------------

# everything as text, "NA" and empty cells -> NA; converted to numeric later
read_dfi <- function(sheet, skip = 0) {
    if (DFI_SOURCE == "xlsx") {
        read_excel(
            DFI_XLSX,
            sheet = sheet, skip = skip,
            col_types = "text", na = c("", "NA")
        )
    } else {
        googlesheets4::read_sheet(
            DFI_SHEET_ID,
            sheet = sheet, skip = skip,
            col_types = "c", na = c("", "NA")
        )
    }
}

# all four-digit sheet names = data years (no hardcoded year vector)
dfi_years <- function() {
    sheets <- if (DFI_SOURCE == "xlsx") {
        excel_sheets(DFI_XLSX)
    } else {
        googlesheets4::sheet_names(DFI_SHEET_ID)
    }
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

cat(format_csv(dfi_clean))
