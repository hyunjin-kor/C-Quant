# C-Quant Compliance Notes — China

**Version:** v1.3.x
**Reviewed:** 2026-05-06
**Last full review:** 2026-04-29
**Audience:** Mainland-China-resident operators or operators serving
Chinese counterparties evaluating C-Quant.

## Scope

C-Quant is a research / monitoring desktop tool for China ETS, EU ETS,
and K-ETS. The China-specific notes cover the national emissions
trading market (SHEEX / MEE), the Securities Law of the People's
Republic of China, the Personal Information Protection Law (PIPL) and
Cybersecurity Law obligations, and the Provisional Regulations on the
Administration of Carbon Emission Trading.

## Boundary statement

C-Quant in the Chinese jurisdiction:

- Is **not** a securities firm (证券公司) or asset management firm
  under the Securities Law. It does not execute trades, transmit
  orders, or maintain accounts on behalf of clients.
- Is **not** a registered carbon trading platform. The Shanghai
  Environment and Energy Exchange (SHEEX / 上海环境能源交易所) is the
  operator-of-record for the national market.
- Is **not** a verification body (核查机构) under the Provisional
  Regulations on the Administration of Carbon Emission Trading.
- Is **not** an investment advisory service licensed by the CSRC.
- **Does** display official daily-overview snapshots and curated
  catalyst events with citations to primary Chinese records (MEE,
  SHEEX) and to ICAP.

## China ETS-specific data sources

| Source | Used in C-Quant | Method |
| --- | --- | --- |
| Shanghai Environment and Energy Exchange | Daily overview, official anchor | Public web flow |
| MEE carbon market feed | Policy bulletins, sector expansion | Public web flow |
| ICAP China ETS overview | Cross-jurisdiction comparator | Public web |

## Cross-border data handling

If the operator deploys C-Quant on devices located in mainland China
and stores or transmits user-data outside China, the operator is
responsible for assessing PIPL Article 38-43 cross-border transfer
obligations. C-Quant defaults are local-first:

- Settings, watchlists, alerts, and backtest snapshots stay in the
  user's `userData` folder.
- Telemetry and Sentry are both opt-in and DSN-gated; when unset, no
  data leaves the device.
- The auto-updater pulls signed installers from the configured release
  feed; mirror it inside the perimeter if cross-border egress is
  restricted.

## Sector expansion handling

The catalyst event log records the 2024-09-09 MEE consultation on
expanding the national ETS to cement, steel, and aluminium. v1.3.0
also added a **pilot → national cascade** scenario keyed to
Beijing/Chongqing pilot 5-day |%| > 10% + Q4 window spillover (Xiao et
al. 2022 TVP-VAR ~54% spillover) and a **Q4 compliance + CCER discount**
scenario tracking the 79% Q4 concentration window (per `cn_q4_concentration`).

China-specific drivers added in v1.3.0: `cn_eua_spillover` (−0.368
elasticity, Liao et al. 2025), `cn_power_equity_index` (+1.195),
`cn_power_emissions` (−0.757 + Carbon Monitor), `cn_pilot_transmission`
(Xiao et al. TVP-VAR ~54%), `cn_ccer_utilization` (5% cap + restart
2024-01-22), `cn_usdcny`, and `cn_q4_concentration`.

When the regulatory sector expansion lands, the catalyst layer should
be re-run:

1. Add sector-specific scenarios to [src/data/catalystScenarios.ts](../src/data/catalystScenarios.ts).
2. Add the regulatory publication date to [src/data/catalystEventLog.ts](../src/data/catalystEventLog.ts).
3. Re-run the event study; let [src/data/catalystCalibration.ts](../src/data/catalystCalibration.ts) regenerate.
4. Update [CHANGELOG.md](../CHANGELOG.md) and [docs/MODEL_CARD.md](MODEL_CARD.md).

## Reporting language

In-app Chinese localization is currently mediated by the Korean and
English copy via `localizeText` in `src/lib/localization.ts`. Chinese-language
operators should prefer the English locale until a dedicated `zh`
locale is added.
