# Harness Engineering

This document turns the planning PDF into an operating harness for C-Quant so each development round stays within the product boundary and truth rules.

## Product Boundary

- C-Quant is a desktop carbon intelligence terminal.
- It can monitor, summarize, compare, forecast, and backtest.
- It cannot execute trades, route orders, custody assets, or behave like a broker.
- It cannot provide one-to-one individualized trade instructions.

## Core Operating Loop

1. Pull official market anchors first.
2. Add linked futures or listed proxies only after the official layer is visible.
3. Mark each data source with freshness and access method.
4. Build decision support from factors, spreads, liquidity, and events.
5. Keep AI output bounded to explanation, scenario framing, and signal synthesis.
6. Rebuild desktop packages and verify the portable executable before release.

## Three-Agent Harness

### 1. Market Facts Agent

- Responsibility:
  - verify official exchange, ministry, and statistics sources
  - separate confirmed APIs from official web flows or files
  - update freshness metadata
- Success criteria:
  - every major market card shows the last official timestamp
  - every factor row shows a source method

### 2. Product Builder Agent

- Responsibility:
  - turn verified data into clear operator-facing UI
  - keep the main workflow chart-first and scan-friendly
  - preserve the desktop-only, non-broker product boundary
- Success criteria:
  - EU ETS, K-ETS, and China ETS are visible on one board
  - factor and signal layers are understandable without reading code

### 3. Evaluation Agent

- Responsibility:
  - test build, packaging, and smoke-run flows
  - reject changes that blur the truth boundary
  - review whether new UI claims are backed by a source
- Success criteria:
  - `npm.cmd run build` succeeds
  - `npm.cmd run package:dir` succeeds
  - `npm.cmd run package:portable` succeeds
  - packaged desktop app opens without a renderer failure

## Truth Controls

- If a public API is not confirmed from official documentation, label it as `official web flow` or `official file`.
- If a listed tape is not the official settlement source, label it as `linked tape` or `proxy`.
- If China ETS official exchange time series is not stably reachable, keep China in bulletin-first mode instead of fabricating a live tape.
- Do not turn scenario output into a claimed live target price.

## UI Controls

- Benchmark scan speed and simplicity against Toss Securities, not literal screen copies.
- Put charts, market boards, and decision tables first.
- Keep long explanatory text in secondary panels, not the main canvas.
- Use large readable numbers, explicit source tags, and obvious freshness badges.

## Release Checklist

1. Verify the selected market shows official price, freshness, and source method.
2. Verify linked futures or proxies are labeled correctly.
3. Verify factor decomposition and quant playbook panels render for each market.
4. Verify the walk-forward model shows uncertainty rather than a single raw number.
5. Rebuild the desktop app and rerun a smoke test.
6. Update [pdf-reference-audit.md](C:/Users/user/Desktop/C-Quant/docs/pdf-reference-audit.md) if the scope changed.

## Next Build Targets

- Live clean dark spread and clean spark spread monitor with verified fuel and power inputs
- Historical forecast error panel and rolling confidence check
- Portfolio carbon sleeve optimizer
- Read-only institutional export layer for desk integration
