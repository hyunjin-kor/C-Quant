# C-Quant Agent Harness

## Product Boundary

- C-Quant is a desktop carbon intelligence terminal.
- It provides research, monitoring, factor tracking, forecasting, and briefing workflows.
- It does **not** execute orders, intermediate trades, hold assets, or behave like a broker.
- It does **not** provide one-to-one individualized trade instructions.

## Truth Rules

- Prefer official exchange, ministry, and statistics sources.
- If a public API is not confirmed from official documentation, label the source as official web flow, not API.
- Show source freshness and access method whenever possible.
- Keep model claims bounded. Scenario output is not a calibrated live price target.

## UX Benchmark

- Benchmark the clarity and scan speed of Toss Securities.
- Do not copy screens literally.
- Reuse the product principles that matter:
  - large readable numbers
  - low-friction feed reading
  - simple navigation
  - visible trust and disclaimer boundaries

## Core Commands

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run package:dir
npm.cmd run package:portable
```

## Primary Files

- `src/App.tsx`
- `src/styles.css`
- `src/data/research.ts`
- `src/data/platform.ts`
- `src/data/dataHub.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`

## Definition Of Done

- UI presents EU ETS, K-ETS, and CN ETS on one clear market board.
- Users can see official source dates and source methods.
- Factor board and signal layer are understandable without reading code.
- Subscription value is clear without implying brokerage or trade execution.
- Desktop build and portable packaging both succeed.
