#!/usr/bin/env bash
# Lighthouse 13.4.1 matrix for the tour: parent build vs tour build, standalone
# and inside the WordPress replica (host-replica.html), tour not triggered vs
# forced (?tour=1). Runs alternate parent/tour so drift hits both equally.
# Usage: lh-matrix.sh <outDir> <parentOrigin> <tourOrigin> <harnessOrigin> [mobileRuns=5] [desktopRuns=3]
#   e.g. lh-matrix.sh /tmp/lh http://127.0.0.1:8080 http://127.0.0.1:8090 http://localhost:8081
set -u
OUT=$1; PARENT=$2; TOUR=$3; HARNESS=$4; NM=${5:-5}; ND=${6:-3}
BASE=/internet-accountability-compass-staging/
LH="$LOCALAPPDATA/npm-cache/_npx/5390d7d89c0de19d/node_modules/lighthouse/cli/index.js"
export CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$OUT"
enc() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }

run() { # name url formFactor iframe(0/1)
  local name=$1 url=$2 ff=$3 ifr=$4 flags="--headless=new"
  [ "$ifr" = 1 ] && flags="$flags --disable-site-isolation-trials --disable-features=IsolateOrigins,site-per-process"
  local preset=""; [ "$ff" = desktop ] && preset="--preset=desktop"
  MSYS_NO_PATHCONV=1 node "$LH" "$url" --quiet --only-categories=performance $preset \
    --chrome-flags="$flags" --output=json --output-path="$OUT/$name.json" >/dev/null 2>"$OUT/$name.err" \
    && echo "ok   $name" || echo "FAIL $name"
}

for ff in mobile desktop; do
  n=$NM; [ "$ff" = desktop ] && n=$ND
  for i in $(seq 1 "$n"); do
    for build in parent tour; do
      origin=$PARENT; [ "$build" = tour ] && origin=$TOUR
      run "${build}_standalone_${ff}_$i" "$origin$BASE" "$ff" 0
      run "${build}_iframe_${ff}_$i" "$HARNESS/tour/scripts/host-replica.html?src=$(enc "$origin$BASE")" "$ff" 1
      if [ "$build" = tour ]; then
        run "tour-forced_standalone_${ff}_$i" "$origin$BASE?tour=1" "$ff" 0
        run "tour-forced_iframe_${ff}_$i" "$HARNESS/tour/scripts/host-replica.html?src=$(enc "$origin$BASE?tour=1")" "$ff" 1
      fi
    done
  done
done
