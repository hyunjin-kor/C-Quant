# C-Quant Claude Handoff

Use this file as the first project context when moving C-Quant into Claude or Claude Code.

## Product Boundary

- C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.
- It supports research, monitoring, factor tracking, forecasting, and briefing workflows.
- It does not execute orders, route trades, custody assets, intermediate settlement, or behave like a broker.
- It does not provide one-to-one individualized trade instructions.

## Truth Rules

- Prefer official exchange, ministry, and statistics sources.
- If a public API is not confirmed from official documentation, label the source as official web flow or official file, not API.
- Show source freshness and access method whenever possible.
- Keep model and scenario claims bounded. Scenario output is not a calibrated live price target.
- Do not invent missing blog, social, API, or vendor links. Add them only after a URL is provided or verified.

## Verified Project Links

- GitHub remote: `https://github.com/hyunjin-kor/C-Quant.git`
- Default branch: `main`
- Link registry: `docs/project-links.md`
- Primary agent instructions: `AGENTS.md`
- Product strategy: `docs/product-strategy.md`
- Harness notes: `docs/harness-engineering.md`
- Research baseline: `docs/research.md`
- Blog/public site: not configured in this repository as of 2026-04-26.

## Core Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run package:dir
npm.cmd run package:portable
```

Use `npm.cmd` on Windows to match the current project scripts.

## Primary Files

- `src/App.tsx`
- `src/styles.css`
- `src/data/research.ts`
- `src/data/platform.ts`
- `src/data/dataHub.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`
- `package.json`

## Desktop Source Strategy

- EU ETS official anchor: EEX EU ETS auction page and public auction workbook.
- K-ETS official anchor: KRX ETS information platform and KRX Open API sample flow for `ets_bydd_trd`.
- China ETS official anchor: MEE carbon-market release feed and bulletin-first official web flow.
- Listed comparison tapes: public chart feeds and vendor/product pages are labeled as linked tapes or proxies, not official settlement sources.

## Claude Operating Rules

1. Read `AGENTS.md`, `README.md`, and this file before changing behavior.
2. Check the dirty worktree before editing. Do not revert unrelated user changes.
3. Keep edits scoped to the requested files and product boundary.
4. When updating external-source claims, record the access method and date.
5. Verify with `npm.cmd run build` at minimum after code changes.
6. Run `npm.cmd run package:dir` and `npm.cmd run package:portable` for release-sensitive changes.

## Current Migration Notes

- The repository is already connected to GitHub through `origin`.
- CircleCI configuration exists at `.circleci/config.yml`.
- No blog URL, marketing site URL, or social profile URL is configured in project docs or package metadata as of the 2026-04-26 audit.
- The removed offline chat flow should not be reintroduced without a new product decision. Keep future briefing support evidence-based and non-executing.
