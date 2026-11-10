library(dplyr)
library(tidyr)
library(readxl)
library(readr)
library(stringr)
library(googlesheets4)

# last updated: 2026-06-01

# Skip authentication for public/link-shareable sheets
gs4_deauth() # 2026-06-01

# Your Google Sheet ID (extracted from URL)
sheet_id <- "1ijg_v1HWoYDeS-SKxJMWHlr7AdGiCs7z7f8FhNG7Naw" # 2026-06-01

# read data
sources <- read_sheet(
    sheet_id,
    # skip = 2,
    # col_types = "c" # Read everything as character first, then convert
) %>%
    # select and clean names
    select(1:9) %>%
    rename(
        type = Type,
        title = document
    ) %>%
    # only entries with titles (for cards)
    drop_na(type)

# write data
cat(format_csv(sources))
write_csv(sources, "sources.csv")
