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
  - Borrowed: scan-fast home surface, short utility copy, large numbers, simple navigation.
  - Implemented as: `개요` market board, `오늘의 브리프`, simplified Korean UI copy.
- TradingView
  - Borrowed: watchlists, layouts, alerts, workspace continuity.
  - Implemented as: workspace presets, watch-view presets, alert hub.
- Koyfin
  - Borrowed: research-first watchlists and dashboard structure.
  - Implemented as: saved workspaces, watchlist presets, comparison-oriented tables.
- Carbon Pulse
  - Borrowed: ticker/feed thinking, dossiers, policy/news orientation.
  - Implemented as: feed-style briefing and catalyst windows.
- Sylvera
  - Borrowed: trust framing, decision support, integrity-first data story.
  - Implemented as: trust center, source registry, explainability copy.
- ClearBlue
  - Borrowed: jurisdiction-level aggregation and scenario framing.
  - Implemented as: cross-market board and research lab structure.

## Autonomous Build Plan

1. 0:00-0:40
   - Benchmark successful products and redefine the app as a carbon intelligence terminal.
2. 0:40-2:00
   - Replace the old information architecture with `개요 / 워크스페이스 / 알림 / 연구실 / 출처`.
3. 2:00-3:20
   - Build the global carbon board for EU ETS, K-ETS, and China ETS.
4. 3:20-4:20
   - Build the driver matrix and catalyst calendar.
5. 4:20-5:10
   - Build the source registry and trust center.
6. 5:10-6:10
   - Build the alert hub and saveable daily brief.
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
