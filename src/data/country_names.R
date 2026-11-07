# Site country names: short forms keyed by ISO3 ------------------------------
# The workbook keeps the long (official) names; the loaders replace these right
# after NAME_ENGL is set, before any sort. Keyed by ISO3 so a workbook spelling
# change cannot silently break the match. Used by dfiCardinal.csv.R and
# dfiFull.csv.R. Non-ASCII as \u escapes, so the file reads the same in any
# locale.

short_names <- c(
    COD = "DR Congo",
    TZA = "Tanzania",
    RUS = "Russia",
    CIV = "Côte d'Ivoire",
    VCT = "Saint Vincent and the Grenadines"
)

# Short name for each ISO3, or the original name when there is none
short_name <- function(iso, name) {
    out <- unname(short_names[iso])
    ifelse(is.na(out), name, out)
}
