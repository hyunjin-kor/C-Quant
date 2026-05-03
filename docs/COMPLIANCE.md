# C-Quant Compliance & Boundary Statement

**Version:** v1.1.x
**Reviewed:** 2026-04-29

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
| `backtest` | Tuned against a labeled historical event log via `runWalkForward`. |
| `calibrated` | Backtested **and** reviewed by the model owner. |

A change from `heuristic` to `backtest` or `calibrated` requires:
1. A reproducible labeled event log (CSV or JSON checked into `tests/fixtures/`).
2. A walk-forward run with `trainingWindow >= 60` and `refitEvery = 1`.
3. An entry in `CHANGELOG.md` with the new multiplier, its hit-rate, and the date.

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
- [ ] Compliance review of the model card (`docs/MODEL_CARD.md`).
- [ ] Procure at least one institutional feed license; set env vars; verify status surface.
- [ ] Connect a labeled event log; run `runWalkForward` per market; commit results to `tests/fixtures/`.
- [ ] Update `CHANGELOG.md` with the calibration outcome.
- [ ] Confirm the auto-updater is pointed at a controlled release feed.
- [ ] Sign Windows / macOS binaries with the deployment certificate.
- [ ] Run `npm run ci:verify`, `npm test`, and `npm run build` clean.

## 9. Change log

| Date | Change |
| --- | --- |
| 2026-04-29 | Added catalyst combination layer, materials atlas, walk-forward harness, institutional feed adapter pattern, and this compliance document. All catalyst multipliers initialized as `heuristic`. |
