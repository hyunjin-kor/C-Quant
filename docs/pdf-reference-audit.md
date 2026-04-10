# PDF Reference Audit

Reference file: the planning PDF stored on the Desktop as the original Korean source document.

## Purpose

This document maps the April 2026 planning PDF to the current C-Quant desktop product so each development round can be checked against the original scope.

## Section-by-Section Review

### 1. Carbon market intelligence terminal

- PDF intent: one product for EU ETS, K-ETS, and China ETS with price monitoring, factor tracking, forecasting, and investor-facing dashboards.
- Current status: implemented.
- Evidence in code:
  - [App.tsx](C:/Users/user/Desktop/C-Quant/src/App.tsx)
  - [research.ts](C:/Users/user/Desktop/C-Quant/src/data/research.ts)
  - [liveSources.js](C:/Users/user/Desktop/C-Quant/electron/liveSources.js)

### 2. Country-by-country price driver decomposition

- PDF intent: cover the major driver families for EU ETS, K-ETS, and CN ETS and organize them as a near-complete production feature universe.
- Current status: implemented as a research-backed feature universe, not as a literal econometric proof of "100% causality."
- Current product treatment:
  - market-level driver library in [research.ts](C:/Users/user/Desktop/C-Quant/src/data/research.ts)
  - factor decomposition board in [App.tsx](C:/Users/user/Desktop/C-Quant/src/App.tsx)
- Remaining gap:
  - add market-specific downloadable factor templates with source freshness checks.

### 3. Quant indicators and trading logic

- PDF intent: surface real trading indicators such as clean dark spread, clean spark spread, lead-lag residuals, compliance seasonality, liquidity, and portfolio logic.
- Current status: partially implemented and strengthened in this round.
- Current product treatment:
  - quant indicator catalog in [research.ts](C:/Users/user/Desktop/C-Quant/src/data/research.ts)
  - spread-aware backtest mode in [backtest.ts](C:/Users/user/Desktop/C-Quant/src/lib/backtest.ts)
  - quant playbook panel in [App.tsx](C:/Users/user/Desktop/C-Quant/src/App.tsx)
- Remaining gap:
  - add a live CDS/CSS calculator once verified power and fuel inputs are stable enough for the in-app feed.

### 4. AI forecasting studio and uncertainty UX

- PDF intent: show short and medium-term forecasts with confidence bands instead of single-number point targets.
- Current status: partially implemented and strengthened in this round.
- Current product treatment:
  - local walk-forward model in [walk_forward_model.py](C:/Users/user/Desktop/C-Quant/python/walk_forward_model.py)
  - forecast band UI in [App.tsx](C:/Users/user/Desktop/C-Quant/src/App.tsx)
- Remaining gap:
  - add historical prediction-vs-actual traces and regime-by-regime validation views.

### 5. Quant backtesting and portfolio lab

- PDF intent: allow users to test signal rules and measure return, drawdown, Sharpe, and allocation effects.
- Current status: implemented for research workflows.
- Current product treatment:
  - CSV backtest runner in [backtest.ts](C:/Users/user/Desktop/C-Quant/src/lib/backtest.ts)
  - desktop lab UI in [App.tsx](C:/Users/user/Desktop/C-Quant/src/App.tsx)
- Remaining gap:
  - add portfolio upload and carbon-allocation impact view.

### 6. Smart API and external desk integration

- PDF intent: provide REST and WebSocket style outputs that institutions can pull into their own desks.
- Current status: not implemented as a full external API product.
- Current product treatment:
  - desktop-only internal bridge via Electron preload and IPC.
- Remaining gap:
  - define a read-only institutional export layer with clear source labels and refresh cadence.

### 7. Harness engineering

- PDF intent: formalize multi-agent planning, generation, evaluation, and closed-loop quality controls.
- Current status: partially implemented and strengthened in this round.
- Current product treatment:
  - project boundary and truth rules in [AGENTS.md](C:/Users/user/Desktop/C-Quant/AGENTS.md)
  - product and research guidance in [product-strategy.md](C:/Users/user/Desktop/C-Quant/docs/product-strategy.md)
  - operating harness in [harness-engineering.md](C:/Users/user/Desktop/C-Quant/docs/harness-engineering.md)
- Remaining gap:
  - formalize the validation loop further if the project later adds CI or external desk exports.

## What Changed In This Round

- Added a factor decomposition board for the selected market.
- Added a quant playbook panel so the user can see which indicators matter first.
- Added a forecast confidence-band panel for the walk-forward model.
- Added a dedicated harness operating document in [harness-engineering.md](C:/Users/user/Desktop/C-Quant/docs/harness-engineering.md).

## Next Recommended Build Order

1. Live CDS/CSS monitor with verified power and fuel inputs.
2. Historical forecast error chart and rolling confidence quality checks.
3. Portfolio optimization module with carbon sleeve allocation impact.
4. Read-only institutional export layer for external desks.
