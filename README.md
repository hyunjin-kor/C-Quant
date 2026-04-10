# C-Quant

C-Quant is a desktop carbon market monitoring tool for:

- EU ETS
- K-ETS
- China ETS

It is made for checking prices, market drivers, alerts, and research signals in one place.

It does not place trades.

## What The App Does

- Shows official market prices first when available
- Pulls linked futures and listed proxy tapes such as ICE EUA benchmark futures, TTF gas, and KRBN
- Compares EU ETS, K-ETS, and China ETS on one screen
- Shows overlap stats between the official tape and linked tapes, including gap, recent move, correlation, and direction match
- Ranks linked tapes on a scoreboard so you can see which futures or proxies are tracking the official market best
- Adds an institution-style checklist for what to confirm before leaning buy, reduce, or hold
- Explains what is moving carbon prices
- Summarizes the current market tone with a rule-based decision layer
- Lets you run local backtests and walk-forward model checks
- Keeps the main workflow inside the desktop app and leaves external pages as secondary source references only

## Free-Source-First

The app is built to work even if you do not want to pay for data.

- `Sources` now includes a `Free sources only` toggle
- Official web pages, official files, and public APIs are treated as the main path
- Commercial APIs are labeled clearly as paid options
- Yahoo pages are reference-only watch links, not core decision data

## Main Screens

- `Overview`
  - market overview board
  - linked futures / proxy tape panel
  - institution checklist
  - official price chart
  - market compare chart
  - what moves price heatmap
  - volume and alert panels
- `Decision`
  - price driver waterfall
  - current decision position
  - scenario sliders
  - quick decision brief
  - optional AI brief
- `Lab`
  - CSV backtest
  - walk-forward model runner
  - dataset templates
- `Sources`
  - source coverage
  - free-only filtering
  - source registry
  - watchlists

## Important Notes

- This is a research and monitoring tool, not a broker.
- Yahoo Finance data can be delayed depending on the exchange, so it is shown as a reference source only.
- Local ETS futures are not added unless a verified free feed is available; where needed, the app labels listed proxies explicitly as proxies.
- The AI brief is optional and runs only when an OpenAI API key is saved in the desktop app.
- The walk-forward model uses local Python and requires `pandas`, `numpy`, and `scikit-learn`.

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
- `src/components/charts.tsx`
- `src/styles.css`
- `src/data/platform.ts`
- `src/data/research.ts`
- `src/lib/forecast.ts`
- `src/lib/backtest.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`
