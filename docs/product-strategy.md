# Product Strategy

## Product Definition

C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.

The product is designed to help a participant answer five questions quickly:

1. What is the latest official market state in each jurisdiction?
2. Which price drivers matter right now?
3. Which policy or supply windows could move price next?
4. Which listed proxies and futures should I cross-check?
5. What does my internal research model say after I have read the official facts?

The product is not a brokerage product and does not execute orders.

## Regulatory Boundary

- The product is positioned as research, monitoring, alerting, and briefing software.
- The UI avoids order tickets, custody language, execution routing, or direct trade intermediation.
- Premium value comes from trustworthy information, saved workspaces, alerts, and briefings.
- Any model output must remain a research overlay, not individualized trading advice.

## Product Benchmark Stack

These are the current official product pages or product-owned pages used as benchmark anchors on 2026-04-09.

- Toss Securities: [https://www.tossinvest.com/](https://www.tossinvest.com/)
- TradingView Features: [https://www.tradingview.com/features/](https://www.tradingview.com/features/)
- Koyfin Watchlists: [https://www.koyfin.com/features/watchlists/](https://www.koyfin.com/features/watchlists/)
- Carbon Pulse: [https://carbon-pulse.com/](https://carbon-pulse.com/)
- Sylvera: [https://www.sylvera.com/](https://www.sylvera.com/)
- ClearBlue Vantage Position Optimization: [https://www.clearbluemarkets.com/news/introducing-vantage-position-optimization-enhancing-carbon-market-management](https://www.clearbluemarkets.com/news/introducing-vantage-position-optimization-enhancing-carbon-market-management)

## Open-Source Benchmark Stack

These repositories are now benchmarked as implementation references, but only inside the C-Quant product boundary.

- `hyperledger-labs/blockchain-carbon-accounting`
  - Keep: provenance, verification workflow, supply-chain accounting patterns.
  - Exclude: token issuance, DAO governance, settlement rails.
- `CarbonScribe/carbon-scribe`
  - Keep: issuance-to-retirement lifecycle visibility.
  - Exclude: purchase and retirement execution.
- `CarbonCreditProject/Carbon-Project`
  - Keep: lifecycle-state and liquidity-monitor concepts.
  - Exclude: AMM, DEX, ERC-20, NFT issuance.
- `SaveChris/Inf-Imb-for-EUA23`
  - Keep: phase-aware factor ranking, weekly time-scale discipline, research-grade variable selection.
  - Exclude: treating academic outputs as live executable price targets.
- `yc-wang00/verra-scaper`
  - Keep: registry metadata and document ingestion pipeline.
  - Exclude: any implied endorsement of scraped projects.
- `carbonplan/forest-risks`
  - Keep: project integrity and hazard-risk overlays.
  - Exclude: naive geographic over-generalization.
- `hgribeirogeo/qaoa-carbon-cerrado`
  - Keep: multi-objective portfolio optimization framing.
  - Exclude: quantum hardware as a product dependency.
- `JGCRI/gcam-core`
  - Keep: long-horizon macro and policy scenario logic.
  - Exclude: using long-cycle scenarios as short-term trade signals.

Detailed adaptation notes live in [open-source-benchmark-map.md](./open-source-benchmark-map.md).

## Benchmark To Product Map

- Toss Securities
  - Borrowed: scan-fast surface, short utility copy, large numbers, low-friction navigation.
  - Implemented as: `Board` top snapshots, short feed, clean Korean/English UI copy.
- TradingView
  - Borrowed: chart-first workspace, watchlists, alerts, layout continuity.
  - Implemented as: cross-market chart surface, driver heatmap, watchlists, alert hub.
- Koyfin
  - Borrowed: research-first dashboard organization and custom watchlists.
  - Implemented as: workspace presets, watchlist modes, source-method coverage view.
- Carbon Pulse
  - Borrowed: ticker/feed thinking, dossiers, policy/news orientation.
  - Implemented as: short market feed and catalyst timeline.
- Sylvera
  - Borrowed: trust framing, decision support, integrity-first data story.
  - Implemented as: trust center, source registry, explainable signal panel.
- ClearBlue
  - Borrowed: jurisdiction-level aggregation and scenario framing.
  - Implemented as: cross-market board, scenario sliders, and research lab structure.

## Current Interface Architecture

The app centers charts before text. The four current surfaces (matching [README.md](../README.md) "Decision surfaces"):

1. `Command` — "What should I do today, and why?"
   - Top market strip (EU / KR / CN)
   - Centre chart of official anchor vs listed proxy
   - Right-hand decision memo (posture + confidence + support / risk bullets)
   - Bottom row of the five strongest drivers with freshness chips
2. `Drivers` — "Which signal is firing right now?"
   - Decision-support boundary notice
   - Active patterns now (live scenario cards crossing thresholds)
   - 21 catalyst combinations ranked by current driver weights
   - Materials & abatement atlas, calibration provenance, event timeline, public-data feeds, driver heatmap
3. `Desk` — "I want to focus deeply on one market"
   - Anchor vs hedge tape chart, range and correlation table, scenario weight sliders
4. `Sources` — "Where did this datum come from, and how fresh is it?"
   - Access method, freshness, in-app benchmark catalogue, input coverage, trust registry

The previous `Lab` surface (CSV upload, backtest chart, walk-forward runner, dataset templates) was retired. Do not reintroduce it without a new product decision; briefing support stays evidence-based and non-executing.

## Evidence Briefing Layer

- Briefing support should stay tied to carbon-market evidence, not generic chatbot behavior.
- The app always computes a local rule-based posture first.
- The LLM should receive only grounded inputs:
  - official market cards
  - linked futures and proxy tapes
  - factor-family scores
  - alerts and catalysts
  - registry freshness and project evidence
  - project integrity overlays
  - portfolio sleeve constraints
- The output should remain inside decision-support boundaries:
  - support case
  - contrary case
  - missing-data warning
  - structured operator brief by workflow
  - next checks by role
  - scenario summary
- The prompt must forbid invented prices, policies, registry facts, and individualized execution language.
- The API key is stored in the Electron user-data directory, not in the renderer bundle.

## Autonomous Build Plan

The original 8-hour autonomous bootstrap plan (benchmark → IA → market board → driver / catalyst layers → source registry → alert hub → lab → packaging) was completed and is preserved in `git log`. It is not the active development plan.

The current development loop is governed by [docs/autonomy-state.md](autonomy-state.md) (queue, risks, latest cycle) and [docs/harness-engineering.md](harness-engineering.md) (loop rules, verification gates, monitor).

## Harness Engineering

The development harness is intentionally simple and local-first. The canonical reference for commands, verification ladder, and primary files is [CLAUDE.md](../CLAUDE.md). The autonomy loop, control plane, and monitor are documented in [docs/harness-engineering.md](harness-engineering.md).

High-level shape:

- Renderer: React + Vite
- Desktop shell: Electron
- Packaging: `electron-builder` (portable + NSIS Windows; macOS / Linux advisory)
- Source ingestion: Electron main-process fetchers for official sources (see [electron/liveSources.js](../electron/liveSources.js))
- Calibration / event-study evaluation: in-tree TypeScript (no external Python research runner)

## Confirmed Core Source Strategy

The wired-today set is the only set the product currently fetches and labels as official anchors. Other sources are aspirational research targets that have **not** been integrated and must not be presented in the UI as live anchors.

### Wired today (anchors and proxies actually fetched)

- EU ETS
  - EEX EU ETS Auctions (official web flow + auction workbook)
- K-ETS
  - KRX ETS Information Platform (official web flow)
  - KRX Open API sample flow for `ets_bydd_trd` (official sample API)
- China ETS
  - MEE carbon-market release feed (bulletin-first official web flow)
  - Shanghai Environment & Energy Exchange daily overview (official web flow)
- Listed proxies (public chart feed only, never settlement)
  - ICE EUA December, KRBN, KEUA, CO2.L, KCCA via Yahoo chart endpoint
- Public-data feeds (Layer 8, license-free)
  - FRED (St. Louis Fed) — gated by free API key
  - ECB SDW — open CSV / JSON
  - ICAP Allowance Price Explorer — public dashboard link
  - World Bank Carbon Pricing Dashboard — long-horizon comparator

### Aspirational targets (not currently wired; do not surface as live data)

- EEX DataSource REST API
- ENTSO-E Transparency Platform
- ENTSOG Transparency API
- Eurostat API
- KOSIS Open API
- KMA Open MET Data Portal

Adding any of these requires a real Electron main-process fetcher in [electron/liveSources.js](../electron/liveSources.js), a freshness label, and a `Source Type` registry entry in [docs/project-links.md](project-links.md). Until that lands, treat them as research notes only.

External finance portals such as Yahoo Finance are listed-proxy chart feeds, not trusted core sources.

License-gated institutional adapters (Refinitiv / Bloomberg / ICE / EEX) only expose `not-configured` status when credentials are missing — they never fabricate, infer, or interpolate prices.
