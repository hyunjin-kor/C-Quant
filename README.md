# C-Quant

C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.

It is built for research, monitoring, and alerting. It does not execute carbon allowance trades.

## What Changed

The desktop app now follows a graph-first intelligence workflow:

- `시장 보드 / Board`
  - official market snapshots
  - official tape charts
  - cross-market normalized chart
  - driver heatmap
  - catalyst timeline
  - feed-style briefing
- `의사결정 / Decision`
  - driver waterfall
  - scenario sliders
  - rule-based posture engine
  - optional LLM brief with OpenAI API key
  - alert hub
- `연구실 / Lab`
  - local CSV backtest
  - walk-forward model runner
  - feature-importance chart
  - dataset template export
- `출처 / Sources`
  - source-method coverage chart
  - source registry
  - watchlists and proxy links
  - benchmark feature map
  - trust principles and subscription value

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
- The scenario engine and the LLM brief are research overlays, not execution signals.
- LLM analysis runs only when an OpenAI API key is saved in the desktop app settings panel.
- The walk-forward model requires local Python with `pandas`, `numpy`, and `scikit-learn`.
- The backtest module uses local CSV files and simple research strategies.
