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
- Reloads linked tapes inside the desktop app through API calls, supports `1D` intraday through `1Y`, and shows interactive in-app charts instead of static images
- Adds a click-driven spotlight stage so markets, tapes, drivers, events, and source rows can open a focused detail panel and jump to the next screen
- Adds a right-side inspector rail with drill-down charts and focused notes for the currently selected market, tape, driver, event, or source
- Lets the inspector rail switch comparison tapes and chart windows directly, and rewrites the drill-down notes for Compliance, Trading, and Risk roles
- Compares EU ETS, K-ETS, and China ETS on one screen
- Shows overlap stats between the official tape and linked tapes, including gap, recent move, correlation, and direction match
- Ranks linked tapes on a scoreboard so you can see which futures or proxies are tracking the official market best
- Adds an institution-style checklist for what to confirm before leaning buy, reduce, or hold
- Adds read-only credit lifecycle dossiers, registry document freshness tracking, and nature-based integrity overlays
- Adds a registry operations board so evidence workflow, refresh cadence, and blockers are visible
- Explains what is moving carbon prices
- Summarizes the current market tone with a rule-based decision layer
- Turns the decision memo into a structured operator brief for real desk use
- Lets you run local backtests and walk-forward model checks
- Keeps the main workflow inside the desktop app and leaves external pages as secondary source references only
- Sends clicked source links into an in-app `Reference Center` first, with opening the original page kept as an explicit secondary action

## Open-Source Benchmark Map

C-Quant now keeps an explicit benchmark map for the open-source systems it borrows from.

- Registry and audit patterns from `hyperledger-labs/blockchain-carbon-accounting`
- Credit lifecycle visibility from `CarbonScribe/carbon-scribe`
- Token-market structure concepts from `CarbonCreditProject/Carbon-Project`
- Phase-aware factor research from `SaveChris/Inf-Imb-for-EUA23`
- Registry ingestion patterns from `yc-wang00/verra-scaper`
- Nature-credit risk overlays from `carbonplan/forest-risks`
- Multi-objective portfolio framing from `hgribeirogeo/qaoa-carbon-cerrado`
- Macro scenario logic from `JGCRI/gcam-core`

The product adapts those patterns into a read-only decision workflow and excludes order execution, token issuance, AMM logic, and retirement transactions.

See [docs/open-source-benchmark-map.md](docs/open-source-benchmark-map.md).

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
  - the app refreshes linked tape charts on a short cycle and marks them as linked live or delayed feeds where exchange delay may apply

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
  - structured operator brief with support and counter-evidence
  - pre-trade risk gates
  - driver table behind the current call
  - project intelligence sidecar and integrity-risk overlay
  - registry operations board
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
  - credit lifecycle dossiers
  - registry evidence freshness
  - registry operations board
  - nature-based risk overlays
  - watchlists

## Important Notes

- This is a research and monitoring tool, not a broker.
- Yahoo Finance data can be delayed depending on the exchange, so it is shown as a reference source only.
- Local ETS futures are not added unless a verified free feed is available; where needed, the app labels listed proxies explicitly as proxies.
- The AI layer is a carbon-market copilot and runs only when an OpenAI API key is saved in the desktop app.
- The copilot is designed to explain posture, contrary evidence, missing data, and next checks. It is not allowed to fabricate official facts or behave like an execution assistant.
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

## Scope Control Docs

- `docs/pdf-reference-audit.md`
- `docs/harness-engineering.md`
