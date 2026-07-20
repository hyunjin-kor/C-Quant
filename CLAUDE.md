# C-Quant Claude Handoff

First-context file when working in C-Quant. Combines the project's product boundary and truth rules with a Karpathy-style coding harness (adapted from [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)).

These rules bias toward caution over speed. For trivial tasks, use judgment.

## Product Boundary

- C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.
- It supports research, monitoring, factor tracking, forecasting, and briefing workflows.
- It does **not** execute orders, route trades, custody assets, intermediate settlement, or behave like a broker.
- It does **not** provide one-to-one individualized trade instructions.

## Truth Rules

- Prefer official exchange, ministry, and statistics sources.
- If a public API is not confirmed from official documentation, label the source as `official web flow` or `official file`, not API.
- Show source freshness and access method whenever possible.
- Keep model and scenario claims bounded. Scenario output is not a calibrated live price target.
- Do not invent missing blog, social, API, or vendor links. Add them only after a URL is provided or verified.
- Institutional adapters (Refinitiv / Bloomberg / ICE / EEX) only expose `not-configured` status when credentials are missing — they never fabricate, infer, or interpolate prices.
- Calibration multipliers must carry provenance: `heuristic` (placeholder constant by `interactionEffect`), `backtest` (≥2 events, walk-forward), or `calibrated` (backtested + model-owner reviewed). Do not promote a status without the underlying evidence.

## Coding Harness

Apply these four rules to every code change.

### 1. Think Before Coding — surface tradeoffs, don't hide confusion

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what is confusing. Ask.

### 2. Simplicity First — minimum code that solves the problem

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" the user did not request.
- No error handling for impossible scenarios.
- If you wrote 200 lines and it could be 50, rewrite it.
- Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes — touch only what you must

- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that aren't broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it — do not delete it.
- Remove imports/variables/functions that _your_ changes made unused. Leave pre-existing dead code alone unless asked.
- Test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution — define success, then loop

- Convert tasks into verifiable goals before coding:
  - "Add validation" → write tests for invalid inputs, make them pass.
  - "Fix the bug" → write a test that reproduces it, make it pass.
  - "Refactor X" → tests pass before and after.
- For multi-step tasks, state a brief plan:
  ```
  1. [step] → verify: [check]
  2. [step] → verify: [check]
  ```
- Strong criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Environment Assumptions

- Node `>=24` (see [.nvmrc](.nvmrc) and the `engines` field in [package.json](package.json)). If `nvm use` reports a mismatch, fix it before debugging build failures.
- Primary target: Windows 10/11. macOS / Linux packaging stays advisory.
- For human-facing daily commands, plain `npm run …` works on Windows, macOS, and Linux. [README.md](README.md) and [CONTRIBUTING.md](.github/CONTRIBUTING.md) follow this convention.
- Inside a PowerShell-chained script that calls npm (`package:dir`, `package:portable`), the explicit `npm.cmd` is **required** so PowerShell resolves the Node executable. If you write a new PowerShell script that needs to invoke npm, follow that pattern. Do not change the existing `npm.cmd` references inside those scripts to plain `npm` — they will break under PowerShell.

## Verified Project Links

**Repository**

- GitHub remote: `https://github.com/hyunjin-kor/C-Quant.git`
- Default branch: `main`
- Releases: https://github.com/hyunjin-kor/C-Quant/releases
- Issues: https://github.com/hyunjin-kor/C-Quant/issues
- CI: GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) is the enforced gate and the live badge in [README.md](README.md).

**Project docs**

- Roadmap (2026 H2): [docs/roadmap-2026H2.md](docs/roadmap-2026H2.md)
- Calibration review (2026-07): [docs/calibration-review-2026-07.md](docs/calibration-review-2026-07.md)
- Open items (deferred work inventory): [docs/open-items.md](docs/open-items.md)
- Research baseline: [docs/research.md](docs/research.md)
- Data schema: [docs/data-schema.md](docs/data-schema.md)
- Architecture map: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Usage walkthrough: [docs/USAGE.md](docs/USAGE.md)
- Model card: [docs/MODEL_CARD.md](docs/MODEL_CARD.md)
- Compliance (general): [docs/COMPLIANCE.md](docs/COMPLIANCE.md)
- Compliance (EU / KR / CN): [docs/COMPLIANCE-EU.md](docs/COMPLIANCE-EU.md), [docs/COMPLIANCE-KR.md](docs/COMPLIANCE-KR.md), [docs/COMPLIANCE-CN.md](docs/COMPLIANCE-CN.md)

**Root docs**

- Agent harness: [AGENTS.md](AGENTS.md)
- Public-facing surface: [README.md](README.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Security: [.github/SECURITY.md](.github/SECURITY.md)
- Contributing: [CONTRIBUTING.md](.github/CONTRIBUTING.md)

**External (public)**

- Blog / marketing site: not configured in this repository as of 2026-04-26.

## Core Commands

```bash
# Daily loop
npm install
npm run dev                  # Vite + Electron concurrently

# Static checks (fast)
npm run type-check           # tsc --noEmit
npm run lint                 # ESLint flat config
npm run format:check         # prettier --check

# Tests
npm run test                 # vitest run
npm run test:node            # node:test localization
npm run test:all             # both

# Electron / data-discipline gates
npm run ci:verify            # node --check on every electron entrypoint + scripts
npm run calibration:check    # 90-day freshness gate on scenario calibration
npm run bundle:check         # bundle-size budget

# Build & package (Windows-primary)
npm run build                # type-check + vite build
npm run package:dir          # unpacked Electron build
npm run package:portable     # portable .exe
npm run package:nsis         # installer .exe (auto-update wired)

# Packaged smoke
npm run smoke:dir
npm run smoke:portable
npm run smoke:release        # both above

# Renderer E2E
npm run e2e
```

## Verification Ladder

Pick the lowest tier that exercises what you changed. Going lower than required is not surgical; going higher than required wastes time.

| Tier               | When to run                                              | Commands                                          |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| 1. Type & lint     | Any TS edit                                              | `type-check`, `lint`                              |
| 2. Tests           | Logic / data / lib edits                                 | `test`, `test:node` (or `test:all`)               |
| 3. Electron syntax | Edit under `electron/` or `scripts/`                     | `ci:verify`                                       |
| 4. Calibration     | Edit `src/data/catalyst*` or freshness logic             | `calibration:check`                               |
| 5. Build           | Anything that ships in the renderer bundle               | `build`                                           |
| 6. Bundle budget   | Renderer bundle size–sensitive                           | `bundle:check`                                    |
| 7. Package         | Release-sensitive (icons, electron-builder, native deps) | `package:dir`, `package:portable`, `package:nsis` |
| 8. Smoke           | After packaging                                          | `smoke:dir`, `smoke:portable`, or `smoke:release` |
| 9. E2E             | Renderer flows / IPC perimeter                           | `e2e`                                             |

For routine code edits the minimum is Tier 1 + 2 + 5. Release rounds run Tiers 1–8, plus Tier 9 if renderer flows changed.

## Primary Files

**Renderer entry & shell**

- [src/App.tsx](src/App.tsx)
- [src/styles.css](src/styles.css)

**Data layer (most-edited research surface)**

- [src/data/research.ts](src/data/research.ts)
- [src/data/platform.ts](src/data/platform.ts)
- [src/data/dataHub.ts](src/data/dataHub.ts)
- [src/data/catalystScenarios.ts](src/data/catalystScenarios.ts) — 21 multi-driver scenarios (Layer 3)
- [src/data/catalystCalibration.ts](src/data/catalystCalibration.ts) — `heuristic / backtest / calibrated` provenance (Layer 5)
- [src/data/catalystEventLog.ts](src/data/catalystEventLog.ts) — 25 historical events (Layer 5)
- [src/data/materialsResearch.ts](src/data/materialsResearch.ts) — long-horizon abatement atlas (Layer 7)

**Live evaluation**

- [src/lib/catalystTriggerDetector.ts](src/lib/catalystTriggerDetector.ts) — Layer 4 active-pattern detector

**Electron / main process**

- [electron/main.js](electron/main.js)
- [electron/preload.js](electron/preload.js)
- [electron/liveSources.js](electron/liveSources.js)

**Project metadata & tooling configs**

- [package.json](package.json)
- [tsconfig.json](tsconfig.json) — TypeScript strict-mode config
- [.editorconfig](.editorconfig)
- [.prettierrc.json](.prettierrc.json)
- [.nvmrc](.nvmrc) — Node version pin
- [.env.example](.env.example) — local env keys (e.g. `CQUANT_KRX_AUTH_KEY`)

## Desktop Source Strategy

- EU ETS official anchor: EEX EU ETS auction page and public auction workbook.
- K-ETS official anchor: KRX ETS information platform and KRX Open API sample flow for `ets_bydd_trd`.
- China ETS official anchor: MEE carbon-market release feed and bulletin-first official web flow.
- Listed comparison tapes: public chart feeds and vendor/product pages are labeled as `linked tape` or `proxy`, not official settlement sources.

## Operating Rules

1. Read [AGENTS.md](AGENTS.md), [README.md](README.md), and this file before changing behavior.
2. Inspect the dirty worktree with `git status --short` before editing. Do not revert unrelated user changes.
3. Apply the Coding Harness above to every edit.
4. Keep edits scoped to the requested files and within the product boundary.
5. When updating external-source claims, record the access method and date.
6. Use the Verification Ladder to pick the right tier of checks. Run them; do not assume the result.
7. State the verification step you actually ran before declaring the turn done. If a check failed, report it honestly — do not claim success.

## Automated Verification Hooks

[.claude/settings.json](.claude/settings.json) configures a `PostToolUse` hook that runs the relevant verification tier automatically when you edit specific paths:

| When you edit           | The hook runs                        |
| ----------------------- | ------------------------------------ |
| `src/data/catalyst*.ts` | `npm run calibration:check` (Tier 4) |
| `electron/*.js`         | `npm run ci:verify` (Tier 3)         |

The hook is path-filtered (no-op for unrelated files) and silent on success. If a verification fails, the failure surfaces in the turn output. The hook does not replace the Verification Ladder — for full coverage of a change, still run the appropriate higher tiers (build / package / smoke / e2e).

To inspect, edit, or disable the hook: open `/hooks` in Claude Code, or edit `.claude/settings.json` directly.

## End-of-Turn Self-Check

The harness is working if all of these are true:

- Every changed line traces to the user's request.
- No speculative features, abstractions, or unrequested "flexibility" was added.
- Adjacent code, comments, and formatting were not touched.
- A verification command actually ran, and its outcome (pass / fail) is reported.
- Source labels (`official web flow`, `linked tape`, `not-configured`, calibration provenance) match reality, not aspiration.
- Clarifying questions were asked _before_ implementation, not after a wrong turn.

## Current Migration Notes

- The repository is connected to GitHub through `origin`. GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) is the only CI; the CircleCI mirror was removed in the 2026-07-20 slimming round.
- No blog URL, marketing site URL, or social profile URL is configured in project docs or package metadata as of the 2026-04-26 audit.
- 2026-07-20 slimming round: autonomy loop scripts/monitor, design hand-off artifacts (figma-spec, story deck), and the meta/planning docs (product-strategy, project-links, pdf-reference-audit, open-source-benchmark-map, harness-engineering, autonomy-state, macro-card-design) were removed from the tree to keep the repo to what runs, builds, and documents the methodology. They remain in git history if ever needed.
- The removed offline chat flow should not be reintroduced without a new product decision. Keep future briefing support evidence-based and non-executing.
