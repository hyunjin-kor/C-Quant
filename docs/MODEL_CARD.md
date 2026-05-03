# C-Quant Model Card

**Version:** v1.1.x
**Reviewed:** 2026-04-29
**Owner:** C-Quant project (research-grade desktop tool)

This is a model card for the decision-support model that powers
C-Quant's "posture / score build / catalyst combinations" surfaces. It
is written so an institutional reviewer can decide whether and where to
trust the output, and where the boundaries are.

## 1. What the model does

C-Quant produces three things from the user's research-backed driver
weights:

1. A **directional posture score** for EU ETS, K-ETS, and China ETS.
2. A **score build** (waterfall) that decomposes the posture into
   individual driver contributions.
3. A **ranked list of catalyst combinations** — multi-driver scenarios
   from the carbon-market literature, scored against the user's current
   weights.

The forecast model in `src/lib/forecast.ts` is intentionally a
**linear weighted sum** with a clamped confidence proxy. The catalyst
scoring layer in `src/data/catalystScenarios.ts` adds a per-scenario
interaction multiplier on top of the same linear sum.

## 2. What the model is NOT

- It is **not a calibrated price predictor**. It does not output a
  price target, and it must not be used as one.
- It is **not** a trade-execution signal. C-Quant does not route
  orders, custody assets, or behave like a broker.
- It is **not** trained on labeled historical events. The interaction
  multipliers are heuristic placeholders (see §6).
- It is **not** validated against an out-of-sample backtest. The
  walk-forward harness in `src/lib/walkForward.ts` exists so that a
  reviewer can plug their own labeled series in and run the evaluation;
  shipping a calibrated estimator is out of scope.

## 3. Inputs

| Input | Source | Notes |
| --- | --- | --- |
| Driver weights | User-controlled scenario sliders | Bounded; default 0 |
| Official price anchors | EEX (EU), KRX (K), Shanghai Environment & Energy Exchange / MEE feeds (CN) | Public web flow / file; freshness shown in UI |
| Listed proxies | ICE EUA, KRBN, KEUA, CO2.L (Yahoo chart feed) | Reference proxy, not the official price |
| Catalyst scenarios | `src/data/catalystScenarios.ts` | Components reference driver IDs from `src/data/research.ts` |
| Materials atlas | `src/data/materialsResearch.ts` | All entries `verified: false` until human review |

## 4. Outputs

| Output | Range | UI surface |
| --- | --- | --- |
| Posture score | unbounded, sign indicates direction | Desk → Posture, Score build |
| Stance label | `buy` / `hold` / `reduce` | Desk, Command |
| Confidence proxy | clamped to [0.2, 0.95] | Desk → Posture |
| Forecast contribution per driver | unbounded | Desk → Score build |
| Catalyst scenario score | unbounded | Drivers → Catalyst combinations |
| Materials atlas relevance ranking | ordinal | Drivers → Materials & abatement atlas |

## 5. Data freshness and provenance

- Official anchors are tagged with an `asOf` timestamp in
  `ConnectedSourceCard.asOf` and rendered as a freshness badge
  (`fresh / watch / stale`).
- Catalyst references are restricted to public, named primary sources
  (EU Commission, ICAP, KRX, MEE, peer-reviewed journals listed in
  `src/data/research.ts`). No DOI, blog, or vendor link is fabricated.
- Materials atlas references are restricted to IPCC AR6, IEA, IRENA,
  GCCA, ICVCM, Verra, and named journals.

## 6. Known limitations and open work

| Area | Current state | What would close the gap |
| --- | --- | --- |
| Calibration | Interaction multipliers are heuristic constants by `interactionEffect`. | Backtest each scenario against a labeled event log; replace each `calibrationStatus: "heuristic"` with `"backtest"` or `"calibrated"` and store the multiplier. |
| Backtesting | `walkForward.ts` ships, but no historical feature panel is committed. | Connect a verified driver-history source (institutional feed) and run `runWalkForward` per market. |
| Live institutional feeds | Adapter pattern only. `electron/institutionalFeeds.js` exposes Refinitiv, Bloomberg, ICE, EEX adapters that return `not-configured` until env vars are set. | Procure license, configure env vars, replace `fetchQuote` placeholder with the real provider call. |
| Compliance review | Boundary statement in CLAUDE.md, README, and the in-app "Decision-support boundary" panel. | Formal compliance review and disclosure language sign-off per jurisdiction. |
| Model documentation | This file. | Versioned model card per release; track multiplier changes in CHANGELOG. |

## 7. Intended use

C-Quant is intended as a **research and monitoring desk** for
institutional carbon-market analysts. The model output should be
combined with the analyst's own market reading and with a compliance
check before any procurement or hedging decision.

## 8. Out-of-scope use

- Retail trade signals.
- Automated execution.
- Standalone basis for investment advice.
- Replacing primary-source documents in regulated reporting.

## 9. Maintenance

Update this card on every release that changes:
- The forecast formula (`src/lib/forecast.ts`).
- The catalyst scenario set or any interaction multiplier.
- The materials atlas (new entries or verification status).
- The institutional feed adapter list.

Each update should include the date, a one-line summary of the change,
and a note on whether the change is `heuristic`, `backtest`, or
`calibrated` per the `CatalystCalibrationStatus` taxonomy.
