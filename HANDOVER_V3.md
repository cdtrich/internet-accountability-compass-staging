# Handover: v3 build (state on 2026-10-29)

For the next Claude session. Read CLAUDE.md and v3_BRIEF.md first; this file
says where things stand against the brief. CHANGELOG_V3.md has the detail
(what / why / how to verify) for every item below.

## Repo state

- Branch `dev`, HEAD `eadd799`, equal to `staging/main` (staging is deployed
  and current). `origin` (LIVE) is untouched. Never push there.
- Uncommitted: `src/perspectives.md`. That's the user's own edit (inline SVG
  for the mobile "Contents" ToC button). Don't commit or revert it unasked.
  It probably needs CSS (`.toc-toggle-button svg { fill: none; stroke:
  currentColor; width/height ~1.2em }`), because the icon is stroke-only.
- Branch `proto/radial` is fully merged into `dev`.
- The user usually commits and pushes. Only push when asked, and only
  `git push staging dev:main`. Before committing, run
  `git restore src/.observablehq/cache/_build.json`.

## Brief status

| Brief item | Status |
|---|---|
| Phase 0 baseline | Done: audit/baseline/ (Lighthouse 13.4.1 HTML × 12, baseline.md). Measured on staging, 26 Oct |
| Phase 1 base path / staging / iframe test page | Done: `BASE_PATH` in config, `components/basePath.js` derives from `import.meta.url`, staging repo deploys from its `main`, tools/iframe-test.html + iframe-single.html |
| Phase 1.4 protect `main`, README promote path | **Not done / unverified.** README (55 lines) has no dev → staging → live section. Branch protection is a GitHub setting; ask the user |
| Phase 2 framework audit | Decision is "stay on Framework" (Additions). **audit/framework-decision.md not written yet.** Phase 2/6 not yet marked in the brief |
| Phase 3 data update | Done: V3.0 workbook (`Internet-Accountability-Index-V3.0.xlsx`, commits 6a1e1f5, 436f4e5). `sources.csv.R` now uses `read_sheet` (Google Sheet), while the brief says Google Sheet is dropped. Unverified; check before touching |
| Phase 4 performance | Not started as a pass (Additions: "DEFERRED") |
| Phase 5 visual language | Partly: colour tokens (`components/tokens.js`, `scales.js`), contrast fixes, map legends. Full token stylesheet not done |
| Additions: sidebar active state | Done (f6cf697) |
| Additions: static sidebar | Done (260bca9…dbebba2): `nav-html.js` via config `header`, Font Awesome removed, `sidebar.js` deleted, 194 pages regenerated. Measured: audit/sidebar/report.md |
| Additions: radial redesign | Done: variant C, radius domain [-25, 100], `components/polarBarsD3.js` (`polarBarsD3`, `polarCountryBarsD3`). Old polarD3/polarCountryD3 kept for one-line rollback. Prototype: audit/radial/ |
| Additions: CSS cleanup | Not started. Next in the suggested order |
| Additions: font loading | Not started (3 Google Font families, render-blocking, in each page's `<head>`) |
| Additions: animation / perf | Deferred |
| Additions: tutorial overlay | Not started (build last) |

The checkboxes in v3_BRIEF.md "Additions" are not ticked yet, although
items are done. Tick them only if the user asks.

## Things learned the hard way (don't rediscover)

- **Paths in config `head`/`header` must be root-relative to src/ without
  the base** (`/countries`, `/sidebar.css`). Framework's `rewriteHtmlPaths`
  makes them page-relative. A base-prefixed href doubles the base in
  production.
- **Country pages have `theme: air` in front matter**, so they load
  Framework's layout.css, while top-level pages use config `style.css` only.
  Any Framework default can therefore apply on country pages and not
  elsewhere (this caused the header-bar regression fixed in dbebba2). Test
  both page types.
- `style.css` forces `svg text` to 16px Nunito Sans `!important`, which
  overrides font sizes set in chart code.
- Framework's `a[href]` colour beats single-class selectors; use
  `.x a[href]`.
- Pages with their own front-matter `head:` lose the global head
  (staging noindex label, sidebar.css), e.g. src/prototypes/radial.md.
- Country pages: `src/1generateCountryPages.r` (not src/data/) does a
  plain placeholder replace of `src/1countryPageTemplate.md`. Regenerating
  needs the user's OK. Check `git diff --stat` afterwards.
- Pre-existing, unfixed: `.chart-breakout { width: 100vw }` (style.css
  ~1714) causes horizontal scroll at phone width with classic scrollbars. A
  horizontal scrollbar also shows in a 1200×300 frame (cause not
  investigated). AFG desktop CLS ≈ 0.78 comes from `main` content, not the
  nav.
- Staging mobile TBT ≈ 1.9 s vs 0.5–0.75 s at baseline. The local A/B shows
  the sidebar isn't the cause. Suspects: polar bars / colour work, or
  network variance. Check in the perf pass.

## Tooling on this machine (no admin)

- No Python, no Playwright, no `gh`. Node 20.19, R 4.3.3
  (`/c/Program Files/R/R-4.3.3/bin/x64/Rscript`), Chrome at
  `/c/Program Files/Google/Chrome/Application/chrome.exe`.
- Browser checks: Chrome `--headless=new --remote-debugging-port=…` driven
  from Node with `--experimental-websocket` (DevTools protocol). For
  cross-origin iframe network data, add
  `--disable-site-isolation-trials --disable-features=IsolateOrigins,site-per-process`.
- Lighthouse: `npx -y lighthouse@13.4.1` (baseline version), with
  `CHROME_PATH` set.
- Git Bash rewrites args like `/AFG/` into Windows paths; prefix the
  command with `MSYS_NO_PATHCONV=1`.
- `npm run build` takes ~45–50 s and validates ~1,221 links. Building an
  old commit in a fresh worktree re-runs the R loaders, because the loader
  cache isn't tracked. That takes long; avoid it, or copy the cache dir.
- When serving `dist/` yourself, don't let the browser cache HTML: hashed
  asset names change on each build.

## Suggested next steps (brief order)

1. Ask about Phase 1.4 (README workflow section, `main` protection) and
   write audit/framework-decision.md. Both are small and unblock the
   Definition of done.
2. CSS cleanup (Additions), with before/after screenshots per page type,
   standalone and in the iframe. The harness + screenshot approach in
   audit/sidebar/report.md "Method" can be reused.
3. Font loading audit.
4. Animation / performance pass (deferred until the user says go).
5. Tutorial overlay last.
