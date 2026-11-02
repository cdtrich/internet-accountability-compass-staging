#!/usr/bin/env bash
# Diff two capture runs, keep only the evidence, delete the PNGs.
# Usage: compare-runs.sh <runA dir> <runB dir> <out dir in audit/> <labelA> <labelB>
# Writes to <out>: pixel-diff.json, style-diff-summary.json, <label>.sha256,
# <label>_log.json. The full style diff (can be tens of MB) goes next to the
# run folders as style-diff_<labelA>_vs_<labelB>.json, outside the repo.
# NO_DELETE=1 keeps PNGs and diff images for inspection.
set -euo pipefail
A="$1"; B="$2"; OUT="$3"; LA="$4"; LB="$5"
HERE="$(cd "$(dirname "$0")" && pwd)"
FULL="$(dirname "$A")/style-diff_${LA}_vs_${LB}.json"
mkdir -p "$OUT"
node "$HERE/diff.cjs" "$A" "$B" "$OUT/pixel-diff-images" 2>/dev/null
mv "$OUT/pixel-diff-images/diff-summary.json" "$OUT/pixel-diff.json"
node "$HERE/style-diff.cjs" "$A" "$B" "$FULL"
node "$HERE/style-diff-summary.cjs" "$FULL" "$OUT/style-diff-summary.json"
node "$HERE/manifest.cjs" "$A" "$OUT/$LA.sha256"
node "$HERE/manifest.cjs" "$B" "$OUT/$LB.sha256"
cp "$A/_log.json" "$OUT/${LA}_log.json"; cp "$B/_log.json" "$OUT/${LB}_log.json"
# PNGs are not kept (the manifests record them); style dumps stay in the run folders.
if [ "${NO_DELETE:-}" != 1 ]; then rm -f "$A"/*.png "$B"/*.png; rm -rf "$OUT/pixel-diff-images"; fi
