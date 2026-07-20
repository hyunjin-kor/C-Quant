# Open Items — what's deferred and why

**Last reviewed:** 2026-05-07.

A single inventory of work that is *intentionally* deferred. Each row
explains the reason so a future maintainer can pick up cleanly. This
file replaces ad-hoc "TODO" notes scattered across the source.

## External-cost items

| Item | Cost / blocker | What landing it requires |
|---|---|---|
| Windows code-signing certificate | USD 200–500/year (DigiCert, Sectigo, GlobalSign) | Buy → export `.pfx` → `CSC_LINK` + `CSC_KEY_PASSWORD` GitHub secrets. [.github/workflows/release.yml](../.github/workflows/release.yml) signs automatically once present. Step-by-step in [SECURITY.md §"Setting up code signing"](../.github/SECURITY.md). |
| macOS Developer ID + notarization | USD 99/year (Apple Developer Program) | `CSC_NAME` + `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID` GitHub secrets. release.yml notarizes automatically. |
| FRED API key | USD 0 (free) | Register at https://fredaccount.stlouisfed.org → set `CQUANT_FRED_API_KEY` in `.env`. The USD/KRW (`DEXKOUS`) and USD/CNY (`DEXCHUS`) fetches in [src/App.tsx](../src/App.tsx) activate immediately; the trigger detector picks the right FX series per scenario via `pickFxSeries`. |

## Domain-knowledge / verification items

| Item | What's needed | Why deferred |
|---|---|---|
| ~~Add 2nd events for the three 1-observation China scenarios~~ | Done 2026-07-20 | MEE primary-source events added in the data-reliability round; all three scenarios now `backtest`. |
| ~~Extend price anchors to 2025-Q3+~~ | Done 2026-07-20 | Monthly anchors verified through 2026-06 (ICAP API / KRX close reports / CNEEEX bulletins). Next extension when 2026-H2 months close. |
| Daily official China close (CNEEEX) | A robust discovery path for "today's bulletin" on overview.cneeex.com | Investigated 2026-07-20: the daily bulletin articles parse cleanly, but their listing is client-side rendered only, and both the main-site category (`www.cneeex.com/sj/mrgk/`, HTTP 420) and the ZCMS front API sit behind a bot wall. No RSS/sitemap. Building on ID-guessing would be fragile; ICAP's public API was evaluated as an alternative and rejected (tail ~3 months stale). Revisit if CNEEEX exposes a static list or feed. |

## Architecture / design items

| Item | Decision needed | Open in |
|---|---|---|
| Continuous OOS forecast panel for `walkForward.ts` | Source of verified driver-history series (institutional feed or public proxy) | `walkForward.ts` ships generic; the `runWalkForward` harness has no committed sample panel because synthesising one would be dishonest about the underlying driver values. |
| Adaptive-baseline calibration with a daily anchor track | Whether to ship daily price anchors alongside the monthly anchors | The current cross-scenario-median baseline ([eventStudy.ts](../src/lib/eventStudy.ts) `aggregateByScenario`) gives a real spread (0.50 → 1.86 today), but it is still anchored on monthly returns. A daily-anchor track would tighten event-study windows but doubles the historical-anchor maintenance surface. |
| Promote `backtest` scenarios to `calibrated` | Model-owner sign-off on multiplier + hit rate per scenario | All 12 backtest scenarios are eligible; the promotion policy in [docs/COMPLIANCE.md](COMPLIANCE.md) §6 requires a documented review. |

## User-action items (operator tasks)

| Item | What you do |
|---|---|
| Visual inspection of v1.3.1+ portable | Run `release/C-Quant-1.3.1-portable.exe`. Confirm the four UI changes from this session: (1) Drivers → Active patterns trigger grid, (2) Command top "Since your last session" delta strip, (3) Score build hover counterfactual, (4) Sources → ECB EUR/USD + HICP inline values. |
| First signed release after cert lands | Bump version in `package.json`, commit, `git tag v1.4.0`, `git push --tags`. release.yml runs the rest. |

## What this file is NOT

- A personal todo list — only items deferred *for a reason* land here.
- A roadmap — that lives in [docs/roadmap-2026H2.md](roadmap-2026H2.md).
- A bug tracker — bugs go to GitHub Issues.
