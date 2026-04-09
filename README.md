# C-Quant

C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.

It is built for research, monitoring, and alerting. It does not execute carbon allowance trades.

## What Changed

The product now follows a benchmark-driven structure:

- `개요`
  - official market board
  - driver matrix
  - catalyst windows
  - feed-style briefing
- `워크스페이스`
  - saved workspace presets
  - watchlist presets
  - watch-view modes
  - benchmark feature map
- `알림`
  - alert templates
  - inbox
  - saveable daily brief
- `연구실`
  - scenario overlay
  - walk-forward model runner
  - local CSV backtest
  - dataset template export
- `출처`
  - trust center
  - source registry
  - full driver atlas
  - autonomous development plan

## Benchmarks Used

- Toss Securities
- TradingView
- Koyfin
- Carbon Pulse
- Sylvera
- ClearBlue Vantage

Official links and feature mapping are documented in `docs/product-strategy.md`.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

## Build

```powershell
npm.cmd run build
npm.cmd run package:dir
npm.cmd run package:portable
```

## Desktop Outputs

- `release/C-Quant-0.1.0.exe`
- `release/win-unpacked/C-Quant.exe`

## Core Files

- `src/App.tsx`
- `src/styles.css`
- `src/data/experience.ts`
- `src/data/platform.ts`
- `src/data/research.ts`
- `src/data/dataHub.ts`
- `src/lib/forecast.ts`
- `src/lib/backtest.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`

## Product Notes

- Official-source-first cards remain the core decision surface.
- ETF, ETC, and Yahoo-style pages are watch links only.
- The scenario engine is a research overlay, not an execution signal.
- The walk-forward model requires local Python with `pandas`, `numpy`, and `scikit-learn`.
- The backtest module uses local CSV files and simple research strategies.
