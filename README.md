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
- Reloads linked tapes inside the desktop app through API calls and lets you switch chart windows from `5D` to `1Y`
- Adds a click-driven spotlight stage so markets, tapes, drivers, events, and source rows can open a focused detail panel and jump to the next screen
- Adds a right-side inspector rail with drill-down charts and focused notes for the currently selected market, tape, driver, event, or source
- Lets the inspector rail switch comparison tapes and chart windows directly, and rewrites the drill-down notes for Compliance, Trading, and Risk roles
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
- Public chart API tapes are pulled into the app directly instead of opening quote pages

## Live Data Layer

- `EU ETS official`
  - official EEX primary auction workbook and auction page
  - used as the official anchor for EU carbon
- `K-ETS official`
  - official KRX Open API sample endpoint for `ets_bydd_trd`
  - used for daily close and volume history
- `China ETS official`
  - official MEE carbon-market release feed
  - used for bulletin and operating-statistics coverage when available
- `Linked live tapes in app`
  - public chart API pulls for ICE EUA benchmark futures, TTF gas, Brent, KRBN, KEUA, CO2.L, and KCCA
  - these are shown inside the desktop app as linked futures or proxy tapes, not as official local settlements

## Truth Boundary

- If an official public API is not confirmed, the app labels the source as an official web flow or official file instead of pretending it is an API.
- If a listed tape is only available as a public chart feed, the app labels it as a linked tape or proxy and keeps the official carbon source separate.
- China ETS daily exchange pages can be rate-limited or blocked in some environments, so the official China layer remains bulletin-first unless a stable official feed is reachable.

## Main Screens

- `Overview`
  - institution desk header for the selected market
  - official tape versus hedge-anchor comparison
  - linked tape scoreboard to pick the best tracking future or proxy
  - driver monitor table with source-backed rationale
  - catalyst calendar and source freshness tables
  - short market notes for fast scanning
- `Decision`
  - decision memo with support and counter-evidence
  - pre-trade risk gates
  - driver table behind the current call
  - next catalysts and data-status checks
  - optional AI follow-up explanation
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
