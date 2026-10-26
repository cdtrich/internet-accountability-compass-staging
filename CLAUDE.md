# Internet Accountability Compass v3 (STAGING work copy)

Observable Framework + D3 site on GitHub Pages. R loaders in src/data/,
components in src/components/.

## Repos and deploys

- Git remote `origin` = LIVE repo (cdtrich/internet-accountability-compass).
  NEVER push to `origin`. Never run a bare `git push`; always name the remote.
- Git remote `staging` = STAGING repo (cdtrich/internet-accountability-compass-staging).
  It deploys on every push to its `main`. Local work branch is `dev`.
  Publish only when I ask: `git push staging dev:main`.
- Live changes happen only through a pull request into `origin/main`, which I do myself.
- Staging is detected by "staging" in BASE_PATH (observablehq.config.js).
  Never hardcode the base path; import `basePath` from components/basePath.js.
- dist/ is not tracked.

## Rules

- No admin rights on this machine: portable or user-level tooling only.
- Ask before regenerating all country pages, changing the framework,
  or touching .github/workflows/.
- Log changes in CHANGELOG_V3.md.

## Plan

@v3_BRIEF.md
