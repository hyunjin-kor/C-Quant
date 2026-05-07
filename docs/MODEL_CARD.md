# C-Quant Model Card

**Version:** v1.3.x
**Reviewed:** 2026-05-06 (resynced §2, §3, §6 with v1.2 → v1.3 catalyst calibration, event-study, and research-catalogue additions)
**Last full review:** 2026-04-29
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
  price target, and it must not be used as one. The forecast formula
  in `src/lib/forecast.ts` is a linear weighted sum and is **not**
  validated against a continuous out-of-sample backtest.
- It is **not** a trade-execution signal. C-Quant does not route
  orders, custody assets, or behave like a broker.

What ships in v1.3 (was missing in v1.1):

- The catalyst-multiplier layer **is** empirically calibrated against a
  curated 25-event historical log
  (`src/data/catalystEventLog.ts`) and monthly price anchors
  (`src/data/historicalPriceAnchors.ts`) via event study
  (`src/lib/eventStudy.ts`). Each scenario carries one of three
  provenance states: `heuristic` (placeholder constant), `backtest`
  (≥2 events, walk-forward), or `calibrated` (backtested + model-owner
  reviewed). Read the live state from
  `src/data/catalystCalibration.ts` rather than assuming everything is
  heuristic.
- A walk-forward harness (`src/lib/walkForward.ts`) ships for reviewers
  who want to validate the forecast estimator against their own labeled
  driver-history panels. The product itself does not currently run a
  continuous OOS forecast backtest.

## 3. Inputs

| Input | Source | Notes |
| --- | --- | --- |
| Driver weights | User-controlled scenario sliders | Bounded; default 0 |
| Official price anchors (live) | EEX (EU), KRX (K), Shanghai Environment & Energy Exchange / MEE feeds (CN) | Public web flow / file; freshness shown in UI |
| Listed proxies (live) | ICE EUA, KRBN, KEUA, CO2.L, KCCA (Yahoo chart feed) | Reference proxy, not the official price |
| Catalyst scenarios | [src/data/catalystScenarios.ts](../src/data/catalystScenarios.ts) — 21 scenarios | Components reference driver IDs from [src/data/research.ts](../src/data/research.ts) |
| Catalyst event log | [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts) — 25 events | Each entry has `verified` / `reported` / `context` confidence + primary-source URL |
| Historical price anchors | [src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts) | Monthly EU / K / CN ETS closing-level series for event study |
| Calibration table | [src/data/catalystCalibration.ts](../src/data/catalystCalibration.ts) | Pure event-study output per scenario: `multiplier`, `status`, `observations`, `meanAbsReturn`, `hitRate`, `reviewedAt` |
| Research catalogue | [src/data/researchCatalogue.ts](../src/data/researchCatalogue.ts) — 44 verified papers | Foundation evidence; informs drivers and scenarios. One retracted paper explicitly excluded |
| Materials atlas | [src/data/materialsResearch.ts](../src/data/materialsResearch.ts) — 10 entries | All entries `verified: false` until human review |

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
| Calibration | Three-state taxonomy live in `catalystCalibration.ts`: `heuristic` (placeholder), `backtest` (event-study output, ≥2 events, walk-forward), `calibrated` (backtested + model-owner reviewed). **Active mix as of 2026-05-07: 12 scenarios `backtest`, 9 `heuristic` (3 with 1 observation, 6 with no events yet); 0 `calibrated`.** Backtest scenarios: `eu-msr-tnac-stack`, `eu-cold-snap-stack`, `eu-recession-financial-stack`, `eu-compliance-cbam-stack`, `eu-cbam-expansion-usd-strength`, `eu-ets2-launch-price-stability`, `kr-compliance-thin-liquidity`, `kr-phase4-auction-cap-relax`, `kr-banking-relaxation-stack`, `kr-policy-rate-fx-stack`, `shared-listed-proxy-divergence`, `shared-multi-commodity-stress`. **Known limitation (2026-05-07 audit):** every backtest scenario saturates at the 1.6 multiplier upper clamp because monthly anchors produce 5–15% abnormal moves around a 1% baseline. Hit rates and `observations` remain informative; the multiplier itself currently does not discriminate between scenarios. A future round will add an adaptive baseline (proportional to the cross-scenario median or a daily-anchored series) to give the multiplier real signal. Promotions are gated by [scripts/check-calibration-freshness.mjs](../scripts/check-calibration-freshness.mjs) (90-day threshold, run via `npm run calibration:check`). | Add an adaptive baseline so the multiplier discriminates. Move more scenarios from `heuristic` → `backtest` by adding ≥2 citable events per remaining scenario (event-study auto-promotes once the threshold is met). Promote `backtest` → `calibrated` only after a model-owner review of the multiplier, hit rate, and observed reactions. Each promotion must update `reviewedAt` and ship in the same PR as the underlying evidence. |
| Continuous backtesting | `walkForward.ts` and `eventStudy.ts` both ship. Event study runs against the 25-event `catalystEventLog.ts` + `historicalPriceAnchors.ts`. A continuous OOS driver-history panel for the linear forecast is **not** committed. | Connect a verified driver-history source (institutional feed) and run `runWalkForward` per market for the forecast estimator (separate from the catalyst layer). |
| Live institutional feeds | Adapter pattern only. `electron/institutionalFeeds.js` exposes Refinitiv, Bloomberg, ICE, EEX adapters that return `not-configured` until env vars are set; they never fabricate prices. | Procure license, configure env vars, replace `fetchQuote` placeholder with the real provider call. |
| Free public-data feeds | `electron/freeFeeds.js` ships real adapters for FRED (key-gated) and ECB SDW (open). ICAP and World Bank are exposed as documented entry URLs. | Wire FRED-derived series into specific drivers (e.g. industrial production, credit spreads) so the calibration layer can reference them empirically. |
| Compliance review | Boundary statement in CLAUDE.md, README, and the in-app "Decision-support boundary" panel. Per-jurisdiction notes in [docs/COMPLIANCE-EU.md](COMPLIANCE-EU.md), [-KR.md](COMPLIANCE-KR.md), [-CN.md](COMPLIANCE-CN.md). | Formal compliance review and disclosure language sign-off per jurisdiction. |
| Model documentation | This file. | Versioned model card per release; track multiplier changes in `CHANGELOG.md`. |

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
