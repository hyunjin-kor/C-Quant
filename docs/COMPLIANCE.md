# C-Quant Compliance & Boundary Statement

**Version:** v1.3.x
**Reviewed:** 2026-05-06 (resynced §6, §8, §9 with v1.2 → v1.3 catalyst calibration and event-study additions)
**Last full review:** 2026-04-29

C-Quant is a research and monitoring desktop tool for the EU ETS,
K-ETS, and China ETS markets. This document records the compliance
boundary, the data-handling promises, and the third-party feed
configuration model so an institutional operator can deploy the tool
inside an existing compliance perimeter.

## 1. Product boundary

| Capability | C-Quant | Out of scope |
| --- | --- | --- |
| Read official anchors | Yes (public web flow / file) | — |
| Show listed proxies | Yes (Yahoo chart feed, labelled as proxy) | — |
| Decision-support score and catalyst ranking | Yes (decision-support, not prediction) | — |
| Trade routing / order execution | **No** | Use a licensed broker |
| Custody, settlement, KYC | **No** | Use a licensed registry / custodian |
| Individualized buy/sell instructions | **No** | Operator judgement + compliance |
| Replace primary-source disclosures | **No** | Use the source documents directly |

The boundary is enforced both in product copy and in the
`renderDrivers()` "Decision-support boundary" panel.

## 2. Data sources and freshness

- EU ETS: EEX EU ETS auctions (public web), EU Commission ETS pages.
- K-ETS: KRX ETS Information Platform, KRX Open API (sample key); MOE
  press releases.
- China ETS: Shanghai Environment and Energy Exchange daily overview;
  MEE carbon market feed.
- Listed proxies: ICE EUA, KRBN, KEUA, CO2.L via Yahoo chart feed,
  labelled as a proxy.

Each card is tagged with `asOf` and rendered with a freshness badge
(`fresh / watch / stale`). The freshness rule is configurable per
deployment.

## 3. Citation policy

- Catalyst scenarios cite only public, named primary sources (EU
  Commission, ICAP, KRX, MEE, EEX, Nature, peer-reviewed journals
  already used in `src/data/research.ts`).
- The materials atlas cites only IPCC AR6, IEA, IRENA, GCCA, ICVCM,
  Verra, and named journals. Costs and abatement potentials are quoted
  as ranges from the underlying report.
- No blog URL, social URL, vendor URL, or paper DOI is fabricated. If a
  reference is missing, the scenario or material entry is shipped
  without it rather than with a guessed URL.

## 4. Telemetry and analytics

- Telemetry is **opt-in**. The `analytics-set-enabled` IPC handler
  controls the flag. No DSN is bundled by default. See `electron/analytics.js`.
- Sentry is gated by env var (`SENTRY_DSN`). When unset, Sentry is a
  no-op. See `electron/sentry.js`.
- All IPC handlers verify sender via `assertTrustedSender(event)` in
  `electron/security.js`.

## 5. Third-party institutional feeds (license-gated)

C-Quant ships an adapter pattern in `electron/institutionalFeeds.js`
covering the four most-asked feeds. None of them ship credentials.

| Feed | Env vars | License path |
| --- | --- | --- |
| Refinitiv (LSEG) Data Platform | `CQUANT_REFINITIV_APP_KEY`, `CQUANT_REFINITIV_USERNAME` (+ secret store password) | https://developers.lseg.com/en/api-catalog/refinitiv-data-platform/refinitiv-data-platform-apis |
| Bloomberg Professional Service | `CQUANT_BLOOMBERG_HOST`, `CQUANT_BLOOMBERG_PORT` | https://www.bloomberg.com/professional/support/api-library/ |
| ICE Consolidated Feed | `CQUANT_ICE_API_KEY` | https://www.ice.com/market-data/connectivity-and-feeds/consolidated-feed |
| EEX Exchange Data Services | `CQUANT_EEX_API_KEY` | https://www.eex.com/en/market-data/market-data-services/market-data-from-exchange-feed |

Each adapter returns a structured `not-configured` status when the
required env vars are missing. The renderer surfaces that as a setup
banner so the absence of a feed is never silently filled with
fabricated data.

## 6. Calibration governance

The catalyst scenario interaction multipliers are tracked through the
`CatalystCalibrationStatus` taxonomy:

| Status | Meaning |
| --- | --- |
| `heuristic` | Placeholder constant by `interactionEffect`; not validated against an event log. |
| `backtest` | Event-study output against [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts) (25 curated historical events) and [src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts), via [src/lib/eventStudy.ts](../src/lib/eventStudy.ts). Requires ≥2 events per scenario and a walk-forward evaluation. |
| `calibrated` | Backtested **and** reviewed by the model owner. The model owner sets `reviewedAt` and signs off in CHANGELOG. |

A change from `heuristic` to `backtest` or `calibrated` requires:

1. A primary-source-cited event in [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts) and a corresponding monthly anchor in [src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts) (no fabricated history).
2. The event-study output regenerated through [src/data/catalystCalibration.ts](../src/data/catalystCalibration.ts) — `multiplier`, `observations`, `meanAbsReturn`, `hitRate`, `reviewedAt` all updated.
3. The 90-day freshness gate in [scripts/check-calibration-freshness.mjs](../scripts/check-calibration-freshness.mjs) (run as `npm run calibration:check`) green at the time of the promotion.
4. An entry in [CHANGELOG.md](../CHANGELOG.md) with the new multiplier, its hit-rate, and the date.

Note: the walk-forward harness in [src/lib/walkForward.ts](../src/lib/walkForward.ts) is for evaluating the **forecast estimator** (the linear weighted sum in `src/lib/forecast.ts`) against a labeled driver-history panel. It is a separate evaluation track from the event-study calibration described above. A continuous OOS forecast backtest is not currently committed to the repo.

## 7. Auto-update and code integrity

- electron-updater is configured via the `build.publish` block in
  `package.json` and gated by `ELECTRON_UPDATER_ENABLED` per
  `electron/autoUpdate.js`.
- Updates pull signed installers from the GitHub release feed for the
  configured `owner / repo`.
- The Windows builds use `electron-builder` with
  `signAndEditExecutable: false`. To enable code signing, supply a
  certificate via `CSC_LINK` and `CSC_KEY_PASSWORD` and set
  `CSC_IDENTITY_AUTO_DISCOVERY=true` for the relevant build target.

## 8. Operator checklist before institutional deployment

- [ ] Compliance review of the in-app boundary copy (Korean and English).
- [ ] Compliance review of the model card ([docs/MODEL_CARD.md](MODEL_CARD.md)).
- [ ] Compliance review of the per-jurisdiction notes ([COMPLIANCE-EU](COMPLIANCE-EU.md), [-KR](COMPLIANCE-KR.md), [-CN](COMPLIANCE-CN.md)).
- [ ] Procure at least one institutional feed license; set env vars per §5; verify the renderer status surface shows `configured` rather than `not-configured`.
- [ ] Review the curated catalyst event log ([src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts), 25 events) and the bundled monthly price anchors ([src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts)); accept or replace before relying on `backtest`-status multipliers.
- [ ] Run `npm run calibration:check` and confirm 0 stale entries (90-day threshold).
- [ ] Update [CHANGELOG.md](../CHANGELOG.md) with any calibration promotions and reviewer sign-off.
- [ ] Confirm the auto-updater is pointed at a controlled release feed (mirror inside the perimeter for KR / CN deployments).
- [ ] Sign Windows / macOS binaries with the deployment certificate (see [SECURITY.md](../.github/SECURITY.md) hardening checklist).
- [ ] Run `npm run type-check`, `npm run lint`, `npm run test:all`, `npm run ci:verify`, and `npm run build` clean (Tier 1–5 of the [CLAUDE.md Verification Ladder](../CLAUDE.md#verification-ladder)).

## 9. Change log

| Date | Change |
| --- | --- |
| 2026-04-29 | v1.1.0 line. Added catalyst combination layer (11 scenarios), materials atlas, walk-forward harness, institutional feed adapter pattern, and this compliance document. All catalyst multipliers initialized as `heuristic`. |
| 2026-05-04 | v1.2.0 line. Decision-support release. Wired the event-study calibration path: 19-event log, monthly historical price anchors, [eventStudy.ts](../src/lib/eventStudy.ts), [catalystCalibration.ts](../src/data/catalystCalibration.ts) with `heuristic / backtest / calibrated` 3-state taxonomy. Added free public-data adapters ([electron/freeFeeds.js](../electron/freeFeeds.js)) for FRED + ECB SDW. Added `npm run calibration:check` 90-day freshness gate. Added jurisdictional COMPLIANCE-EU/-KR/-CN documents. Real-time catalyst trigger detector ([src/lib/catalystTriggerDetector.ts](../src/lib/catalystTriggerDetector.ts)) auto-evaluates official cards against freshness / price-jump / volume-jump / proxy-divergence thresholds. |
| 2026-05-04 | v1.3.0 line. Literature-grounded release. Added [src/data/researchCatalogue.ts](../src/data/researchCatalogue.ts) (44 verified papers; one retracted paper explicitly excluded). Driver matrix expanded by 22 (EU 8 / KR 7 / CN 7). Catalyst scenario set expanded from 11 → 21. Event log expanded from 19 → 25. Boundary statement unchanged. |
| 2026-05-04 | v1.3.1 cosmetic patch (icon redraw). No compliance-relevant change. |
| 2026-05-06 | Compliance docs resynced with v1.2 → v1.3 reality (this round). Header version bumps; §6 calibration mechanism corrected (event study, not walk-forward, calibrates the catalyst multipliers); §8 operator checklist updated with the actual calibration path and verification ladder. |
