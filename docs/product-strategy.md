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

## Benchmark Stack

These are the current official product pages or product-owned pages used as benchmark anchors on 2026-04-09.

- Toss Securities: [https://www.tossinvest.com/](https://www.tossinvest.com/)
- TradingView Features: [https://www.tradingview.com/features/](https://www.tradingview.com/features/)
- Koyfin Watchlists: [https://www.koyfin.com/features/watchlists/](https://www.koyfin.com/features/watchlists/)
- Carbon Pulse: [https://carbon-pulse.com/](https://carbon-pulse.com/)
- Sylvera: [https://www.sylvera.com/](https://www.sylvera.com/)
- ClearBlue Vantage Position Optimization: [https://www.clearbluemarkets.com/news/introducing-vantage-position-optimization-enhancing-carbon-market-management](https://www.clearbluemarkets.com/news/introducing-vantage-position-optimization-enhancing-carbon-market-management)

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
   - Alert hub and quant-indicator list
3. `Lab`
   - CSV upload
   - Backtest chart and metrics
   - Walk-forward runner and feature-importance chart
   - Dataset schema and template export
4. `Sources`
   - Source-method coverage chart
   - Source registry
   - Watchlists and proxy links
   - Trust principles and subscription value

## LLM Layer

- The LLM is optional and lives above the deterministic research engine.
- The app always computes a local rule-based posture first.
- The LLM receives only the selected market's official card, factor-family scores, alerts, catalysts, and quant-indicator context.
- The prompt explicitly forbids inventing prices or regulations and frames the output as decision support, not trade intermediation.
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
