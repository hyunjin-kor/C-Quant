# C-Quant Compliance Notes — China

**Version:** v1.1.x
**Reviewed:** 2026-04-29
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
expanding the national ETS to cement, steel, and aluminium. When the
expansion lands in regulation, the catalyst layer should be re-run:

1. Add sector-specific scenarios to `catalystScenarios.ts`.
2. Add the regulatory publication date to `catalystEventLog.ts`.
3. Re-run the event study; let `catalystCalibration.ts` regenerate.
4. Update `CHANGELOG.md` and the model card.

## Reporting language

In-app Chinese localization is currently mediated by the Korean and
English copy via `localeCopy` in `src/data/locales.ts`. Chinese-language
operators should prefer the English locale until a dedicated `zh`
locale is added.
