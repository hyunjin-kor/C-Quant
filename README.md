# C-Quant

**A decision-support desk for buying, holding, or reducing EU ETS, K-ETS, and China ETS carbon allowances.**

C-Quant is a desktop tool that helps an institutional analyst answer one question — **"Should I buy, hold, or reduce carbon allowances right now?"** It reads official auctions, exchange snapshots, and policy bulletins as primary anchors, then layers a research-backed driver matrix, multi-driver catalyst combinations, real-time trigger detection, and backtest-derived multipliers on top, and surfaces a single **buy / hold / reduce** posture with the evidence trail intact.

It does not execute trades, custody assets, or intermediate settlement. It is research, monitoring, and decision-support software.

[![CI](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml/badge.svg)](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 24+](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](.nvmrc)

---

## What decision it supports

| User question | How C-Quant answers |
| --- | --- |
| Buy EUA now? | Official auction result + driver-weighted score + active catalyst patterns → **posture (buy / hold / reduce)** + confidence |
| Reduce K-ETS exposure? | KRX close + compliance-window proximity + freshness of policy notices |
| Is the Chinese market at an inflection point? | MEE bulletin + sector-expansion scenario activity + daily turnover |
| Which signal should I weight today? | Auto-detection of currently active multi-driver scenarios + backtest hit rate |
| How much can I trust the output? | Every multiplier carries a calibration provenance: heuristic / backtest / calibrated |

---

## The signal stack

C-Quant derives buy / hold / reduce by stacking 8 layers. Each layer carries its primary source and a freshness label.

### Layer 1 — Official anchor
- **EU**: EEX EU ETS primary auction workbook + auction page (official web flow)
- **K-ETS**: KRX ETS Information Platform + KRX Open API sample (`ets_bydd_trd`)
- **China**: Shanghai Environment & Energy Exchange daily overview + MEE carbon-market bulletin feed
- Each card carries a `fresh / watch / stale` freshness badge

### Layer 2 — Driver matrix
~47 drivers across 6 families per market, with weights derived from peer-reviewed and policy literature. Each driver is `weight × direction × importance × note + sources[]`.

| Family | What lives here |
| --- | --- |
| Policy supply | MSR / TNAC, cap path, allocation share, K-ETS Fourth Basic Plan, ETS2, CBAM, Korean penalty multiplier |
| Power complex | Wholesale electricity, clean spark spread, wind / solar generation share, China power-sector emissions |
| Fuel switching | TTF gas, Rotterdam coal, Brent, Qinhuangdao coal, Asian LNG |
| Macro & financial | Industrial production, credit spreads, EUR/USD, USD/KRW, USD/CNY, equity drawdowns, ECB / Fed policy shocks |
| Weather & seasonality | Temperature anomaly, heating demand, precipitation, K-ETS compliance window, China Q4 concentration |
| Microstructure | Auction coverage, open interest, volume, fund positioning, KOC/KAU spread, pilot spillover |

### Layer 3 — Catalyst combinations
**21 scenarios — each scenario combines ≥2 drivers** (`src/data/catalystScenarios.ts`).

Representative combinations:
- **EU cold-snap stack**: temperature anomaly + TTF gas spike + low wind → coal-to-gas dispatch flip → non-linear EUA demand spike
- **EU MSR + Fit-for-55 stack**: MSR auction-reduction notice + Fit-for-55 reaffirmation → structural forward scarcity
- **EU hawkish ECB + speculation downshift**: ECB policy surprise + ESMA fund net-long decline + equity drawdown → financialisation-driven selling
- **EU CBAM expansion + USD strength**: CBAM scope expansion + EUR/USD < 1.05 → coal-gas substitution pressure
- **EU ETS2 launch + price-stability mechanism**: 2027 ETS2 launch + €45 (2020 prices) trigger → first-2-year regime
- **K-ETS compliance + KRW weakness + cold winter**: Q1 surrender + USD/KRW > 1,400 + winter LNG burn → import-fuel cost amplifies compliance pressure
- **K-ETS Phase 4 auction + financial-cap relaxation**: 2026 power auction 15% + Feb 2025 financial-institution access → regime shift
- **K-ETS penalty multiplier reset**: KAU spot approaches 2.5x trailing 60d average within 4 weeks of surrender → soft ceiling
- **China Q4 compliance + CCER discount**: Q4 concentration window (79% of 2024 volume) + CCER-CEA spread > 15% discount
- **China coal shock + power-emissions release**: Qinhuangdao coal +20% / 60d + Carbon Monitor power emissions YoY > +5%
- **China pilot → national cascade**: Beijing/Chongqing pilot 5d |%| > 10% + Q4 window → spillover

Every scenario carries `expectedDirection`, `interactionEffect (amplify / offset / regime-shift)`, `playbook`, `historicalAnchor`, and ≥1 primary-source citation.

### Layer 4 — Active patterns auto-detection (real-time)
Live card data is auto-evaluated against four threshold signals (`src/lib/catalystTriggerDetector.ts`):
- **Freshness**: official card age > 24h
- **Price-jump**: 5-day |%change| ≥ 5%
- **Volume-jump**: latest bar ≥ 2× the trailing 5-bar mean
- **Proxy-divergence**: official close vs primary listed proxy |gap| ≥ 4%

When at least half of the testable components fire together, the scenario is flagged **`active`** and surfaces as a card at the top of the Drivers view under "Active patterns now".

### Layer 5 — Empirical calibration (event-study backtest)
25 citable historical events (2018–2025) — MSR notices, Fit-for-55, ETS revision trilogue, the 2021–2022 energy crisis, COVID risk-off, K-ETS Fourth Basic Plan, MEE sector-expansion consultation, **CCER restart 2024-01-22**, **K-ETS financial-cap relaxation 2025-02-07**, **CBAM transition start 2023-10-01**, etc. — are evaluated against monthly EU/K/CN ETS price anchors via event study, producing per-scenario `multiplier`, `meanAbsReturn`, and `hitRate`.

| Calibration status | Meaning |
| --- | --- |
| `heuristic` | Placeholder constant by `interactionEffect` (1.25 / 1.10 / 0.7) |
| `backtest` | Walk-forward evaluated with ≥2 events — multiplier is data-driven |
| `calibrated` | Backtested **and** model-owner reviewed (currently 0; governance defined) |

`npm run calibration:check` enforces a 90-day freshness threshold on every push / PR.

### Layer 6 — Listed proxy gap
ICE EUA December, KRBN, KEUA, CO2.L, KCCA — pulled via the public Yahoo chart feed and compared against the official anchor. When the gap crosses the trailing 1-year 90th percentile for two consecutive sessions, it surfaces as an information-leakage signal.

### Layer 7 — Materials & abatement atlas (long-horizon supply-demand)
10 entries — amine PCC, MOF, DAC, green hydrogen, hydrogen DRI steel, low-clinker cement, biochar, BECCS, renewable LCOE — cited from primary IPCC AR6 / IEA / IRENA / GCCA / ICVCM / Verra reports. Tracks how shifts in cost ranges and readiness reshape the long-horizon allowance demand curve.

### Layer 8 — Public-data feeds (extensible external data)
- **FRED** (St. Louis Fed) — gated by a free API key, with a real `fetchSeries()` implementation
- **ECB SDW** — open CSV / JSON, no key required
- **ICAP Allowance Price Explorer** — public dashboard link
- **World Bank Carbon Pricing Dashboard** — long-horizon cross-jurisdiction comparator

The institutional adapters (Refinitiv / Bloomberg / ICE / EEX) are license-gated. When credentials are missing, they only expose a `not-configured` status; they never fabricate prices.

---

## Decision surfaces

Every session walks the same four steps: read the official anchor → compare with the listed proxy → check the drivers and active scenarios → decide the posture.

### Command — "What should I do today, and why?"
<p align="center">
  <img src="docs/images/shot-command-light.png" alt="Command surface" width="100%"/>
</p>

Top market strip (EU / KR / CN) → centre chart of anchor vs proxy → right-hand decision memo (posture + confidence + support / risk bullets) → bottom row of the five strongest drivers and freshness chips.

### Drivers — "Which signal is firing right now?"
<p align="center">
  <img src="docs/images/shot-drivers-light.png" alt="Drivers surface" width="100%"/>
</p>

This is the **core** screen of C-Quant. From top to bottom:
1. **Decision-support boundary** notice (this is not a calibrated price predictor)
2. **Active patterns now** — live scenario cards that crossed their thresholds
3. **Catalyst combinations** — 21 scenarios, ranked by the score implied by your current driver weights
4. **Materials & abatement atlas** — long-horizon supply-demand pointers
5. **Institutional feeds status** — Refinitiv / Bloomberg / ICE / EEX (license-gated)
6. **Calibration provenance** — per-scenario multiplier + observations + hit rate + status
7. **Event timeline** — 25 historical events
8. **Public-data feeds status** — FRED / ECB SDW / ICAP / World Bank
9. **Driver families heatmap** — cross-market comparison

### Desk — "I want to focus deeply on one market"
<p align="center">
  <img src="docs/images/shot-desk-light.png" alt="Desk surface" width="100%"/>
</p>

Focus on one market (EU / K / CN) with the cross-market context kept beside it: anchor vs hedge tape chart, range and correlation table, scenario weight sliders. Use it when writing a market-specific brief.

### Sources — "Where did this datum come from, and how fresh is it?"
<p align="center">
  <img src="docs/images/shot-sources-light.png" alt="Sources surface" width="100%"/>
</p>

Access method, freshness, in-app benchmark catalogue, input coverage, and trust registry for every primary source. The first screen to open during a compliance review.

➡️ Screen-by-screen walkthrough: [docs/USAGE.md](docs/USAGE.md)

---

## What it does NOT do (boundary)

| Area | State |
| --- | --- |
| Order routing / execution | **NO** — use a licensed broker |
| Custody / settlement | **NO** — use a licensed registry / custodian |
| Individualised buy / sell recommendations | **NO** — operator judgement + compliance review |
| Replacement for primary disclosure | **NO** — use the source documents directly |
| Fabricated institutional pricing | **NO** — unconfigured adapters only show `not-configured` |
| Fabricated citations | **NO** — DOI / blog / vendor URLs are never guessed |

Jurisdictional compliance notes:
- [docs/COMPLIANCE.md](docs/COMPLIANCE.md) — general boundary + calibration governance
- [docs/COMPLIANCE-EU.md](docs/COMPLIANCE-EU.md) — MiFID II / MAR / BMR / CSRD
- [docs/COMPLIANCE-KR.md](docs/COMPLIANCE-KR.md) — Capital Markets Act / GHG Emission Trading Act / PIPA
- [docs/COMPLIANCE-CN.md](docs/COMPLIANCE-CN.md) — Securities Law / PIPL / Provisional Carbon Trading Regulations
- [docs/MODEL_CARD.md](docs/MODEL_CARD.md) — model card (inputs / outputs / limits / maintenance)

---

## Quick start

> Requires Node 24 (see `.nvmrc`) and Windows 10/11 as the primary target. macOS / Linux builds are advisory.

```powershell
nvm use
npm install
npm run dev          # Vite + Electron
```

Distribution build:

```powershell
npm run package:portable     # C-Quant-X.Y.Z-portable.exe
npm run package:nsis         # C-Quant-Setup-X.Y.Z.exe (auto-update wired)
```

Release artifacts are published on the [Releases](https://github.com/hyunjin-kor/C-Quant/releases) page. SmartScreen will warn on first launch — click **More info → Run anyway**.

---

## Quality gates

```bash
npm run type-check           # tsc --noEmit
npm run lint                 # ESLint flat config
npm test                     # vitest — 23 files, 197 tests
npm run test:node            # node:test — 53 localization tests
npm run build                # type-check + vite build
npm run ci:verify            # syntax check all electron entrypoints + scripts
npm run calibration:check    # 90-day freshness threshold for scenario calibration
npm run bundle:check         # bundle size budget
npm run e2e                  # Playwright Electron smoke
```

CI runs the full set on every push / PR across Windows, macOS, and Linux. macOS and Linux remain advisory until cross-platform packaging stabilises.

---

## Tech

- **Electron 41** + **React 19** + **TypeScript 6** + **Vite 8**
- **Vitest 2** (197 unit tests across 23 files) + **Playwright** (E2E smoke) + **node:test** (legacy localization)
- **electron-builder** (portable + NSIS Windows, dmg / zip macOS, AppImage / deb Linux)
- **electron-updater** + Sentry (DSN-gated, opt-in)
- Korean-text support: Pretendard variable font, Korean number units (만 / 억 / 조)
- Three execution contexts (main / preload / renderer), one IPC perimeter, all persistence under `<userData>`

Full module map: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Project meta

| Doc | Contents |
| --- | --- |
| [docs/USAGE.md](docs/USAGE.md) | Screen-by-screen usage guide |
| [docs/MODEL_CARD.md](docs/MODEL_CARD.md) | Model card (I/O, limits, maintenance) |
| [docs/COMPLIANCE.md](docs/COMPLIANCE.md) | General compliance + calibration governance |
| [docs/COMPLIANCE-EU.md](docs/COMPLIANCE-EU.md) | EU jurisdiction (MiFID II / MAR / BMR / CSRD) |
| [docs/COMPLIANCE-KR.md](docs/COMPLIANCE-KR.md) | Korea jurisdiction (Capital Markets Act / GHG ETS Act / PIPA) |
| [docs/COMPLIANCE-CN.md](docs/COMPLIANCE-CN.md) | China jurisdiction (Securities Law / PIPL / Carbon Trading) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Process and module map |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [SECURITY.md](SECURITY.md) | Threat model |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide |
| [LICENSE](LICENSE) | MIT |

---

## Truth boundary

- Sources without a confirmed public API are labelled `Official Web` or `Official File`, not `Public API`.
- Listed tapes available only via public chart feeds are labelled **listed proxy** or **linked tape** and kept separate from official carbon sources.
- Scenario and signal outputs are constrained to evidence-backed research support; they do not fabricate official facts and do not behave like execution assistance.
- China ETS daily exchange pages can be rate-limited or blocked in some environments, so the China layer remains bulletin-first until a stable official feed is reachable.
- Institutional feed adapters (Refinitiv / Bloomberg / ICE / EEX) only expose a `not-configured` status when credentials are missing; they never infer prices.
- Materials atlas costs and potentials are quoted as **ranges** from the underlying primary report. Every entry starts as `verified: false`; the "Verified" badge appears only after the operator has personally verified it.

---

## License

[MIT](LICENSE) — third-party deps keep their own licenses.
