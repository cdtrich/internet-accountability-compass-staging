# dfiCardinal: pillar (cardinal point) scores + "Partial data" flag, per year --
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

# READ ALL DATA FILES ---------------------------------------------------------

# Function to read and process a single year
read_year <- function(year_sheet) {
    # Read full data including indicator columns
    df_full_raw <- read_dfi(year_sheet, skip = 2)
    check_schema(df_full_raw, year_sheet)

    df_full <- df_full_raw %>%
        # the workbook has formatted-but-empty rows below the data
        filter(!is.na(Countries), !is.na(ISO3_CODE))

    # Get pillar names from top header row (no "..." duplicates)
    names_header <- read_dfi(year_sheet) %>%
        select(-contains("...")) %>%
        names()
    stopifnot(length(names_header) == 4)

    # --- Compute ned from individual indicators ---
    # Indicator columns are named "Indicator X-Y" where X is the pillar number
    indicator_cols <- names(df_full)[str_detect(names(df_full), "^Indicator")]

    ned_pillar <- df_full %>%
        select(ISO3_CODE, all_of(indicator_cols)) %>%
        mutate(across(all_of(indicator_cols), ~ suppressWarnings(as.numeric(.)))) %>%
        pivot_longer(all_of(indicator_cols), names_to = "indicator", values_to = "ind_value") %>%
        # Extract pillar number from "Indicator X-Y"
        mutate(pillar_num = as.integer(str_extract(indicator, "\\d+(?=-)"))) %>%
        group_by(ISO3_CODE, pillar_num) %>%
        summarise(ned = if_else(any(is.na(ind_value)), "Partial data", NA_character_), .groups = "drop") %>%
        mutate(pillar_txt = names_header[pillar_num]) %>%
        select(ISO3_CODE, pillar_txt, ned)

    # Total score: Partial data if any pillar has Partial data
    ned_total <- ned_pillar %>%
        group_by(ISO3_CODE) %>%
        summarise(ned = if_else(any(!is.na(ned)), "Partial data", NA_character_), .groups = "drop") %>%
        mutate(pillar_txt = "Total score")

    ned_all <- bind_rows(ned_pillar, ned_total)

    # --- Process pillar totals ---
    df <- df_full %>%
        select(Countries, ISO3_CODE, contains("Total..."), `Total Index Score`)

    # Assign pillar names to Total columns
    names(df)[3:6] <- names_header

    df_long <- df %>%
        pivot_longer(
            3:7,
            names_to = "pillar_txt",
            values_to = "value"
        ) %>%
        # fill = "right": no asterisk note present -> note = NA, without warnings
        separate(value, into = c("value", "note"), sep = "\\*", extra = "merge", fill = "right") %>%
        mutate(
            # "not enough data" (Total only) is non-numeric -> NA, as before
            value = suppressWarnings(as.numeric(value)),
            group_value = cut(value,
                breaks = c(-Inf, 50, 65, 80, Inf), right = FALSE, # bands per methodology.md: 0-49 / 50-64 / 65-79 / 80-100
                labels = c("Off track", "Catching up", "On track", "Leading")
            ),
            year = as.numeric(year_sheet),
            pillar_txt = if_else(pillar_txt == "Total Index Score", "Total score", pillar_txt)
        ) %>%
        left_join(ned_all, by = c("ISO3_CODE", "pillar_txt"))

    return(df_long)
}

# Process all years and combine
df_all_years <- map_dfr(years, read_year)

# CLEAN COUNTRY NAMES ---------------------------------------

# replacement characters
replacements <- c("é" = "e", "ê" = "e", "à" = "a", "/" = "-")

df_rename <- df_all_years %>%
    # rename var names
    rename(
        NAME_ENGL = Countries
    )

dfi_clean <- df_rename %>%
    # generate urls
    mutate(country_url = paste0("countries/", str_to_lower(ISO3_CODE))) %>%
    arrange(year, NAME_ENGL)

cat(format_csv(dfi_clean))
