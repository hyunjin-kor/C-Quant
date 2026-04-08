# C-Quant

C-Quant is a desktop carbon intelligence terminal for EU ETS, K-ETS, and China ETS.

The product is designed as a subscription-ready research and monitoring platform:

- official-source-first market board
- cross-market driver map
- feed-style daily briefing
- source registry and trust center
- scenario, walk-forward, and backtest lab

It is **not** a brokerage product and does not execute carbon allowance trades.

## Run

Development:

```powershell
npm.cmd install
npm.cmd run dev
```

Build:

```powershell
npm.cmd run build
npm.cmd run package:dir
npm.cmd run package:portable
```

## Desktop Outputs

- `release/C-Quant-0.1.0.exe`
- `release/win-unpacked/C-Quant.exe`

## Product Docs

- `AGENTS.md`
- `docs/product-strategy.md`
- `docs/research.md`
- `docs/data-schema.md`

## Core Files

- `src/App.tsx`
- `src/styles.css`
- `src/data/research.ts`
- `src/data/platform.ts`
- `src/data/dataHub.ts`
- `src/lib/forecast.ts`
- `src/lib/backtest.ts`
- `electron/liveSources.js`
- `main.js`
- `preload.js`

## Source Notes

- EU ETS price panel currently uses official EEX primary auction data.
- K-ETS price panel currently uses the official KRX ETS information flow.
- China ETS currently combines official MEE releases and official exchange overview pages.
- Some deeper market data paths are commercial APIs and are labeled separately from public routes.

## Model Notes

- The scenario engine is a research overlay, not a calibrated production target price on its own.
- The walk-forward model depends on local Python with `pandas`, `numpy`, and `scikit-learn`.
- The backtest module uses local CSV files and simple research strategies for validation.
