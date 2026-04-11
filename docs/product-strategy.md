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

The app now centers charts before text.

1. `Board`
   - Top snapshot cards for EU ETS, K-ETS, and China ETS
   - Official tape chart for the selected market
   - Cross-market normalized chart where official series exist
   - Driver heatmap, volume chart, feed, and catalyst timeline
2. `Decision`
   - Driver waterfall
   - Scenario sliders for the most important drivers
   - Rule-based posture engine
   - Optional LLM brief
   - Project intelligence sidecar with lifecycle dossier and registry freshness
   - Integrity overlay for nature-based credit risk
   - Alert hub and quant-indicator list
3. `Lab`
   - CSV upload
   - Backtest chart and metrics
   - Walk-forward runner and feature-importance chart
   - Dataset schema and template export
4. `Sources`
   - Source-method coverage chart
   - Source registry
   - Credit lifecycle dossier shelf
   - Registry evidence freshness monitor
   - Nature-based risk overlays
   - Watchlists and proxy links
   - Trust principles and subscription value

## Carbon Market Copilot

- The LLM should be a carbon-market copilot, not a generic chatbot.
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
  - next checks by role
  - scenario summary
- The prompt must forbid invented prices, policies, registry facts, and individualized execution language.
- The API key is stored in the Electron user-data directory, not in the renderer bundle.

## Autonomous Build Plan

1. 0:00-0:40
   - Benchmark successful products and redefine the app as a carbon intelligence terminal.
2. 0:40-2:00
   - Replace the old information architecture with a chart-first graph surface.
3. 2:00-3:20
   - Build the official market board for EU ETS, K-ETS, and China ETS.
4. 3:20-4:20
   - Build the driver heatmap, waterfall, and catalyst timeline.
5. 4:20-5:10
   - Build the source registry and trust center.
6. 5:10-6:10
   - Build the alert hub, watchlists, and saveable daily brief.
7. 6:10-7:10
   - Reorganize the lab around scenario, walk-forward, backtest, and dataset templates.
8. 7:10-8:00
   - Rebuild the desktop outputs, update docs, and push to GitHub.

## Harness Engineering

The development harness is intentionally simple and local-first.

- Renderer: React + Vite
- Desktop shell: Electron
- Research runner: local Python script for walk-forward validation
- Packaging: `electron-builder` portable Windows output
- Source ingestion: Electron main-process fetchers for official sources

Current loop:

1. Update product data or UI in `src/`.
2. Verify renderer build with `npm.cmd run build`.
3. Package desktop output with `npm.cmd run package:portable`.
4. Smoke test the EXE from `release/`.
5. Push validated changes to GitHub.

## Confirmed Core Source Strategy

- EU ETS
  - EEX EU ETS Auctions
  - EEX DataSource REST API guide
  - ENTSO-E Transparency Platform
  - ENTSOG Transparency API
  - Eurostat API
- K-ETS
  - KRX ETS Information Platform
  - KOSIS Open API
  - KMA Open MET Data Portal
- China ETS
  - MEE carbon-market release feed and development reports
  - Shanghai Environment and Energy Exchange daily overview

External finance portals such as Yahoo Finance are treated as watch links only, not as trusted core sources.
