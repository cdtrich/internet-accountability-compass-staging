# Validate loader output against numbers computed independently from the
# V3.0 workbook (counted in Python/openpyxl, not with the R logic).
#
# Usage: open the repo (any folder inside it) and run
#   source("check_dfi_outputs.R")
# The script runs both loaders itself (src/data/dfiFull.csv.R and
# src/data/dfiCardinal.csv.R), writes their output to temp files and checks
# those. To check existing CSVs instead, pass two paths:
#   Rscript check_dfi_outputs.R path/dfiFull.csv path/dfiCardinal.csv
# Rename LOADER_FULL / LOADER_CARDINAL below if your loader files are named
# differently.
#
# Expected values are for Internet-Accountability-Index-V3.0.xlsx only.
# For another workbook, recompute them instead of editing blindly.

suppressPackageStartupMessages({
    library(dplyr)
    library(readr)
})

suppressPackageStartupMessages(library(here))
LOADER_FULL <- here("src", "data", "dfiFull.csv.R")
LOADER_CARDINAL <- here("src", "data", "dfiCardinal.csv.R")

run_loader <- function(loader) {
    if (!file.exists(loader)) stop("Loader not found: ", loader, " (see LOADER_* at the top)")
    out <- tempfile(fileext = ".csv")
    status <- system2(file.path(R.home("bin"), "Rscript"), shQuote(loader),
        stdout = out, stderr = ""
    )
    if (status != 0) stop("Loader failed: ", loader)
    out
}

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 2) {
    cat("Running loaders...\n")
    args <- c(run_loader(LOADER_FULL), run_loader(LOADER_CARDINAL))
}
full <- read_csv(args[1], show_col_types = FALSE)
card <- read_csv(args[2], show_col_types = FALSE)

results <- logical(0)
expect <- function(ok, msg) {
    cat(if (isTRUE(ok)) "PASS  " else "FAIL  ", msg, "\n", sep = "")
    results <<- c(results, isTRUE(ok))
}

# --- shape --------------------------------------------------------------------
expect(setequal(full$year, 2020:2026), "dfiFull: years 2020-2026")
expect(n_distinct(full$ISO3_CODE) == 194, "dfiFull: 194 countries")
expect(nrow(full) == 194 * 12 * 7, "dfiFull: 16296 rows (194 x 12 indicators x 7 years)")
expect(nrow(card) == 194 * 5 * 7, "dfiCardinal: 6790 rows (194 x 5 pillars x 7 years)")
expect(!anyNA(full$NAME_ENGL) && !anyNA(card$NAME_ENGL), "no missing country names (blank xlsx rows dropped)")

# --- indicator labels (V3.0 set) --------------------------------------------------
labels <- unique(full$commitment_txt_cardinal)
expect(length(labels) == 12, "12 distinct indicator labels")
expect(any(grepl("Online Freedom", labels)), "label present: Online Freedom (Digital Society Project)")
expect(any(grepl("INDIGO", labels)), "label present: INDIGO")
expect(!any(grepl("Freedom on the Net", labels)), "label absent: Freedom on the Net")
expect(
    identical(full$commitment_txt_cardinal[full$commitment_num == 4][1], "Rule of Law Index"),
    "indicator 2-4 is Rule of Law Index"
)

# --- total score / 'not enough data' per year ------------------------------------
ned <- full %>%
    distinct(year, ISO3_CODE, total, note) %>%
    group_by(year) %>%
    summarise(n_na = sum(is.na(total)), n_note = sum(!is.na(note)), .groups = "drop") %>%
    arrange(year)
expect(
    identical(as.integer(ned$n_na), c(29L, 25L, 25L, 24L, 19L, 21L, 22L)),
    "countries without total per year: 29,25,25,24,19,21,22"
)
expect(
    identical(ned$n_na, ned$n_note),
    "every missing total carries note = 'Not enough data'"
)

# --- 2026 category counts (bands per methodology.md: 0-49/50-64/65-79/80-100) -------
g26 <- full %>%
    filter(year == 2026) %>%
    distinct(ISO3_CODE, group) %>%
    count(group)
get_n <- function(x) g26$n[match(x, g26$group)]
expect(
    isTRUE(get_n("Leading") == 14) && isTRUE(get_n("On track") == 61) &&
        isTRUE(get_n("Catching up") == 66) && isTRUE(get_n("Off track") == 31),
    "2026 groups: Leading 14, On track 61, Catching up 66, Off track 31"
)
# boundary values must land in the upper band
b <- full %>%
    filter(!is.na(total)) %>%
    distinct(year, ISO3_CODE, total, group)
expect(all(b$group[b$total == 50] == "Catching up") && all(b$group[b$total == 65] == "On track") &&
    all(b$group[b$total == 80] == "Leading"), "boundary totals 50/65/80 sit in the upper band")

# --- 'Partial data' flags in dfiCardinal, 2026 ------------------------------------
p26 <- card %>% filter(year == 2026, ned == "Partial data")
expect(sum(p26$pillar_txt != "Total score") == 231, "2026 pillar rows flagged Partial data: 231 (74+60+68+29)")
expect(sum(p26$pillar_txt == "Total score") == 101, "2026 'Total score' rows flagged Partial data: 101")

# --- reproducibility --------------------------------------------------------------
cat("\nReproducibility: run the full loader twice and compare, e.g.\n",
    "  run the loader twice and compare file hashes (tools::md5sum)\n",
    sep = ""
)

if (!all(results)) stop(sum(!results), " check(s) failed") # non-zero exit under Rscript, no session kill
cat("\nAll checks passed.\n")
