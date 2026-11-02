# Lighthouse matrix: partial (stopped on request, 2 Nov 2026)

Collected before the stop; superseded by the single forced run in report.md §7. Lighthouse 13.4.1, simulated throttling, performance only. Raw JSON not committed.

| Configuration | Runs | Perf | LCP s | TBT ms | CLS | Requests | tour files requested |
|---|---|---|---|---|---|---|---|
| parent_iframe_mobile | 3 | 69 (69-70) | 1.78 (1.43-1.93) | 3532 (3142-3656) | 0.002 (0.002-0.002) | 63 (63-63) | 0/3 |
| parent_standalone_mobile | 4 | 39 (37-55) | 12.31 (7.99-12.94) | 1427 (0-2107) | 0.000 (0.000-0.002) | 68 (68-68) | 0/4 |
| tour-forced_iframe_mobile | 3 | 68 (65-68) | 1.22 (1.22-1.97) | 4005 (3131-4067) | 0.002 (0.002-0.002) | 65 (65-65) | 3/3: tour.cd57b385.js, tour.9021e806.css |
| tour-forced_standalone_mobile | 3 | 33 (33-34) | 12.35 (12.24-12.69) | 2346 (2026-2462) | 0.000 (0.000-0.000) | 70 (70-70) | 3/3: tour.cd57b385.js, tour.9021e806.css |
| tour_iframe_mobile | 3 | 70 (69-70) | 1.40 (1.22-1.93) | 3109 (3030-3344) | 0.002 (0.002-0.002) | 63 (63-63) | 0/3 |
| tour_standalone_mobile | 3 | 39 (38-60) | 12.32 (5.60-12.58) | 1363 (0-1694) | 0.000 (0.000-0.002) | 68 (68-68) | 0/3 |
