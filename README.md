# C-Quant

C-Quant is a desktop decision desk for global carbon allowance markets:

- EU ETS
- K-ETS
- China ETS

The app is built around one operating workflow:

1. read the official anchor
2. compare it against a listed hedge benchmark or proxy
3. check the main drivers and source freshness
4. decide whether the desk should lean buy, hold, or reduce

It does not execute trades or intermediate transactions.

## What The App Does

- Shows the official market anchor first for each ETS
- Brings listed hedge benchmarks and proxies into the app through API-backed charts
- Supports interactive `1D` to `1Y` chart windows inside the desktop app
- Compares the official anchor and listed benchmark on one normalized chart
- Calculates gap, recent co-movement, and direction match between the two tapes
- Builds a simple desk posture from official move, listed move, tape agreement, and source freshness
- Keeps the driver map, source method, and trust boundary visible
- Includes a grounded local copilot, signal workspace, and source-trust workflow
- Keeps external pages as explicit source buttons instead of default navigation

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

- `Desk`
  - cross-market board for EU ETS, K-ETS, and China ETS
  - official anchor panel
  - live comparison tape panel
  - normalized comparison chart
  - posture, score build, and decision memo
- `Drivers`
  - cross-market factor heatmap
  - market-specific driver table
  - quant indicators worth running
- `Sources`
  - official source method, freshness, and notes
  - in-app benchmark catalogue
  - input coverage and source-trust registry
- `Signals`
  - integrated decision pack
  - operator checklist
  - scenario-oriented decision support
- `Copilot`
  - conversation-first local model workspace
  - grounded context, evidence chips, and runtime controls

## Important Notes

- This is a research and monitoring tool, not a broker.
- Yahoo Finance data can be delayed depending on the exchange, so it is shown as a reference source only.
- Local ETS futures are not added unless a verified free feed is available; where needed, the app labels listed proxies explicitly as proxies.
- The AI layer is a carbon-market copilot and can run on a local free Ollama model inside the desktop app.
- OpenAI can still be wired separately, but the default desktop copilot flow is local-model-first.
- The copilot is designed to explain posture, contrary evidence, missing data, and next checks. It is not allowed to fabricate official facts or behave like an execution assistant.

## Autonomous Loop

The repo now includes a persistent autonomy framework so repeated development rounds do not have to rediscover context.

It now also borrows several OpenHands-inspired harness patterns:

- split `base-state.json` and append-only `.autonomy/events/*.json`
- explicit `stuck_detection` and loop budget fields
- session continuity through `session_id`
- monitor-visible event feed for control and cycle progress

- `docs/autonomy-state.md`
  - mission, current risks, active queue, and latest verified cycle
- `.autonomy/latest-cycle.md`
  - most recent generated verification report
- `.autonomy/control.json`
  - start, pause, resume, and stop state for the autonomous loop
- `.autonomy/base-state.json`
  - stable session snapshot for monitor and recovery
- `.autonomy/events/*.json`
  - structured control and cycle events
- `npm.cmd run autonomy:cycle`
  - runs the standard build loop and updates the state ledger
- `npm.cmd run autonomy:release`
  - runs build plus packaging checks and updates the state ledger
- `npm.cmd run autonomy:start`
  - marks the autonomous loop as running with `stop_on_user_return=true`
- `npm.cmd run autonomy:pause`
  - pauses the loop immediately
- `npm.cmd run autonomy:resume`
  - resumes the loop and keeps pause-on-user-return enabled
- `npm.cmd run autonomy:idle`
  - returns the loop to an inactive waiting state
- `npm.cmd run autonomy:status`
  - prints the current control state
- `npm.cmd run autonomy:monitor`
  - starts a separate local monitor server at `http://127.0.0.1:4781`
- `npm.cmd run autonomy:monitor:open`
  - opens the separate monitor dashboard in the browser and starts the server if needed

The separate monitor is intentionally outside the product app. It shows:

- loop mode: `running / paused / idle / stopped`
- execution state: active cycle vs armed-and-waiting
- scheduler state: background loop connected or manual-trigger only
- stuck detector state and loop budget
- current task, open backlog, latest cycle snapshot, and recent run logs
- recent structured autonomy events

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
- `src/components/InteractiveMarketChart.tsx`
- `src/styles.css`
- `src/data/platform.ts`
- `src/data/research.ts`
- `src/data/dataHub.ts`
- `src/lib/localization.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`

## Scope Control Docs

- `docs/pdf-reference-audit.md`
- `docs/harness-engineering.md`
- `docs/autonomy-state.md`
