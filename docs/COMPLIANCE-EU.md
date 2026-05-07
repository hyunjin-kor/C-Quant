# C-Quant Compliance Notes — European Union

**Version:** v1.3.x
**Reviewed:** 2026-05-06
**Last full review:** 2026-04-29
**Audience:** EU-resident operators evaluating C-Quant inside an
existing compliance perimeter.

## Scope

C-Quant is a research / monitoring desktop tool for EU ETS, K-ETS, and
China ETS. The EU-specific notes here cover how the product sits
relative to MiFID II, MAR, REMIT, the EU ETS / ETS2 framework, the EU
Sustainability Reporting Standards, and the GDPR.

## Boundary statement

C-Quant in the EU jurisdiction:

- Is **not** an investment service or activity under MiFID II Annex I.
  It does not execute orders, deal on own account, or transmit
  client orders to a venue.
- Is **not** a regulated reporting tool under EU ETS Article 15
  (verification) or ETS Articles 30a-h (ETS2 implementation).
- Is **not** a benchmark within the meaning of the EU Benchmarks
  Regulation. The "decision-support score" is an internal aggregator,
  not a published index, and is intentionally not made available to
  third parties as an investment indicator.
- **Does** display official prices, public auction results, listed
  proxy quotes, and curated catalyst events with citations to primary
  EU records (EU Commission, EEX, ICAP).

If an operator publishes the decision-support score externally as a
trading or hedging signal, the operator becomes responsible for the
publication-side regulatory analysis (BMR, MAR Article 15, ESMA
guidelines on investment recommendations).

## EU ETS-specific data sources

| Source | Used in C-Quant | Method |
| --- | --- | --- |
| EU Commission ETS pages | Driver atlas, MSR notices, CBAM | Public web flow |
| EEX EU ETS auctions | Official anchor card | Public web + workbook |
| ICAP Carbon Action | Catalyst event log, jurisdictional comparators | Public dashboard |
| ICE EUA futures | Listed proxy | Public chart feed |

## ETS2 transition

The catalyst event log includes the Fit-for-55 proposal and the
trilogue agreement on ETS revision (2022-12-18). v1.3.0 also wired an
**ETS2 launch + price-stability mechanism** scenario in
[src/data/catalystScenarios.ts](../src/data/catalystScenarios.ts) keyed
to the 2027 ETS2 launch + €45 (2020 prices) trigger first-2-year
regime, plus a corresponding `eu_ets2` driver in
[src/data/research.ts](../src/data/research.ts) cited to Görlach et al.
2025.

Remaining work for the ETS2 transition:

- Add MSR2-specific scenarios as the MSR2 mechanism becomes operational.
- Re-run the event study with ETS2 prices once enough observations
  exist; promote the ETS2 scenario from `heuristic` to `backtest` when
  ≥2 ETS2-specific events are in the log.
- Update [docs/MODEL_CARD.md](MODEL_CARD.md) and [CHANGELOG.md](../CHANGELOG.md) per release.

## Telemetry, GDPR

- Telemetry is **opt-in**; no PII is collected. The renderer-process
  analytics pipeline writes only event names + numeric/string
  properties to an opt-in store via the `analytics-set-enabled` IPC.
- Sentry is gated by `SENTRY_DSN`; when unset, no error reports leave
  the device.
- `electron/security.js` enforces sender-trust on every IPC handler.

## MAR / disclosure considerations

If the operator's organisation is an EU ETS account holder or has
inside information under MAR Article 7 (e.g., advance knowledge of a
material installation outage), the operator must avoid acting on the
score until that inside information is public. C-Quant does not detect
inside information automatically; this remains a human-in-the-loop
control.

## Sustainability disclosure

Operators using C-Quant inside the CSRD / ESRS reporting workflow
should treat the materials atlas (`src/data/materialsResearch.ts`) as
a research pointer, not as a measured emissions factor. The atlas
references IPCC AR6, IEA, IRENA, GCCA, and ICVCM — published numbers
must be re-pulled from the primary report before being included in a
CSRD disclosure.
