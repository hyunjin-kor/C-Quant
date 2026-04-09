# Product Strategy

## Positioning

C-Quant is a subscription-ready carbon intelligence platform for participants who need trustworthy market information, not a brokerage product.

The terminal should help a user answer four questions quickly:

1. What is happening in EU ETS, K-ETS, and China ETS right now?
2. Which official sources changed today?
3. Which factor groups are pushing each market?
4. What should I monitor before I make my own trading decision elsewhere?

## Regulatory Boundary

- The product is designed as research, monitoring, alerting, and briefing software.
- The product should avoid execution UI, order tickets, custody language, and personalized one-to-one buy or sell guidance.
- Premium value should come from better monitoring and better explanation, not direct trade intermediation.

## UX Direction

- Benchmark Toss Securities for scan speed and clarity.
- Use large price cards, short feed items, simple segmented navigation, and a calm white surface.
- Make trust features visible: source date, source method, official label, and model boundary notes.

## Market Data Strategy

### Confirmed official or documented sources

- EU ETS
  - EEX official auction pages and workbook
  - EEX DataSource REST API guide for premium expansion
  - ENTSO-E Transparency Platform
  - ENTSOG Transparency API
  - Eurostat statistics API
- K-ETS
  - KRX ETS Information Platform
  - KOSIS Open API
  - KMA Open MET Data Portal
- China ETS
  - MEE carbon market development reports and release feed
  - Shanghai Environment and Energy Exchange daily market overview

### Product rule

- Show confirmed sources separately from future source opportunities.
- Do not label a web workflow as an API unless official API documentation was confirmed.
- External finance portals such as Yahoo Finance should be positioned as watch links or discovery surfaces, not as the trusted core source layer.

## Subscription Value

- Daily carbon brief
- Driver alerts
- Saved watchlists and layouts
- Weekly strategy memo

## Build Loop

1. Update official-source ingestion or product data.
2. Verify UI shows freshness and source method.
3. Run `npm.cmd run build`.
4. Run `npm.cmd run package:portable`.
5. Smoke-test `release/win-unpacked/C-Quant.exe`.
