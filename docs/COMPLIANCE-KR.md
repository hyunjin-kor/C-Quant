# C-Quant Compliance Notes — Korea

**Version:** v1.3.x
**Reviewed:** 2026-05-06
**Last full review:** 2026-04-29
**Audience:** Korean-resident operators evaluating C-Quant inside an
existing compliance perimeter.

## Scope

C-Quant is a research / monitoring desktop tool for K-ETS, EU ETS, and
China ETS. The Korea-specific notes cover how the product sits relative
to the Capital Markets Act (자본시장과 금융투자업에 관한 법률), the
Greenhouse Gas Emission Trading Act (온실가스 배출권의 할당 및 거래에
관한 법률), KRX market rules, and the Personal Information Protection
Act (PIPA / 개인정보 보호법).

## Boundary statement

C-Quant in the Korean jurisdiction:

- Is **not** an investment advisory service (투자자문업) or discretionary
  investment management service (투자일임업) under the Capital Markets
  Act. It does not provide individualized recommendations or accept
  discretionary mandates.
- Is **not** a financial investment instrument issuer or broker-dealer
  (금융투자업자). It does not execute orders, custody, or settle
  allowances.
- Is **not** an emissions trading exchange (배출권 거래소) operator. The
  KRX K-ETS platform remains the operator-of-record.
- Is **not** an emissions verification body (검증기관) under the Emission
  Trading Act.
- **Does** display official prices, KRX session data, and curated
  catalyst events with citations to primary Korean records (KRX, MOE,
  ICAP).

If the score is published externally as a Korean retail-facing
indicator, the publisher takes on the responsibility for compliance
with Capital Markets Act Article 4-2 (investment recommendations) and
related FSC guidance.

## K-ETS-specific data sources

| Source | Used in C-Quant | Method |
| --- | --- | --- |
| KRX ETS Information Platform | Official anchor, surrender window detection | Public web flow |
| KRX Open API | KAU price/volume series | Public API (sample key) |
| Korean MOE press releases | Liquidity reform, basic plan publications | Public web |
| ICAP Korea ETS overview | Cross-jurisdiction comparator | Public web |

## Compliance window handling

The catalyst event log records K-ETS Q1 surrender windows (March
verification + April surrender) explicitly. The Drivers view surfaces
the current freshness of the official KAU anchor and flags compliance
proximity through the catalyst combinations layer.

v1.3.0 expanded the K-ETS-specific driver set substantially. Drivers
now include `kr_penalty_multiplier` (3× soft ceiling, Kim & Yu 2018),
`kr_otc_spread` (KOC/KAU inverse spread, Etienne & Yu 2017),
`kr_allocation_tightness` (expected emissions / free allowance, Jun et
al. 2021), `kr_attention` (search-query interest), `kr_tariff_insulation`
(KEPCO regime), and `kr_financial_cap` (institutional access timeline,
2025-02-07). Operators relying on these drivers for compliance-window
risk assessment should re-read the cited papers in
[src/data/researchCatalogue.ts](../src/data/researchCatalogue.ts)
before publication.

## Personal information

- C-Quant collects no personal information by default. Telemetry is
  opt-in and limited to event names and numeric/string properties.
- Settings, watchlists, alerts, and backtest snapshots are stored in
  the user's Electron `userData` folder; the operator's organisation
  must apply its standard endpoint security controls if the device
  contains regulated data.

## Auto-update integrity

The auto-updater pulls signed installers from the configured GitHub
release feed (see `docs/COMPLIANCE.md` §7). Korean enterprise rollouts
should mirror the release feed inside the corporate perimeter and
configure `ELECTRON_UPDATER_FEED_URL` accordingly.
