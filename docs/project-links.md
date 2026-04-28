# Project Links

Last audited: 2026-04-26

This file is the single link registry for C-Quant. Keep it factual: add links only after they are present in the repo, provided by the owner, or verified from the service itself.

## Repository

| Item | URL or Path | Status | Access Method |
| --- | --- | --- | --- |
| GitHub origin | https://github.com/hyunjin-kor/C-Quant.git | Connected | `git remote show origin` |
| Default branch | `main` | Connected | `git remote show origin` |
| Remote reachability | `refs/heads/main` | Verified reachable | `git ls-remote --heads origin` |
| CI config | `.circleci/config.yml` | Present | Local file |
| Package metadata | `package.json` | Present | Local file |

## Public Channels

| Channel | URL or Path | Status | Note |
| --- | --- | --- | --- |
| GitHub README | https://github.com/hyunjin-kor/C-Quant#readme | Linked | Derived from the confirmed GitHub remote |
| GitHub issues | https://github.com/hyunjin-kor/C-Quant/issues | Linked | Standard issue path for the confirmed GitHub remote |
| Blog | Not configured | Missing | No blog URL was found in `README.md`, `package.json`, or `docs/` during this audit |
| Public website | Not configured | Missing | No product homepage URL was found during this audit |

## Claude Handoff

| Item | Path | Purpose |
| --- | --- | --- |
| Claude context | `CLAUDE.md` | First file to give Claude or Claude Code |
| Agent harness | `AGENTS.md` | Product boundary, truth rules, core commands, definition of done |
| Product strategy | `docs/product-strategy.md` | Product positioning, benchmark map, source strategy |
| Harness engineering | `docs/harness-engineering.md` | Development loop, autonomy framework, verification gates |
| Research baseline | `docs/research.md` | Carbon-market feature universe and source baseline |
| Open-source benchmark map | `docs/open-source-benchmark-map.md` | Repo-by-repo adaptation boundary |

## Official Data And Market Sources

| Area | Source | URL | Source Type |
| --- | --- | --- | --- |
| EU ETS auction anchor | EEX EU ETS Auctions | https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions | Official web flow and official files |
| EU ETS listed hedge | ICE EUA futures | https://www.ice.com/products/197 | Listed benchmark product page |
| EU gas driver | ICE Dutch TTF Gas Futures | https://www.ice.com/products/27996665/Dutch-TTF-Gas-Futures | Listed driver product page |
| Brent driver | ICE Brent Crude Futures | https://www.ice.com/products/219/Brent-Crude-Futures | Listed driver product page |
| K-ETS official anchor | KRX ETS information platform | https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp | Official web flow |
| KRX Open API sample | `ets_bydd_trd` detail page | https://openapi.krx.co.kr/contents/OPP/USES/service/OPPUSES006_S2.cmd?BO_ID=IZiYdcgRQFMeENJPEMKG | Official API documentation/sample flow |
| China ETS official anchor | MEE carbon-market release feed | https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/ | Official web flow |
| EU carbon proxy | WisdomTree Carbon ETC | https://www.wisdomtree.eu/en-gb/etps/alternative/wisdomtree-carbon | Listed proxy product page |
| Global carbon proxy | KraneShares KRBN | https://kraneshares.com/etf/krbn/ | Listed proxy product page |
| EU carbon proxy | KraneShares KEUA | https://kraneshares.com/etf/keua/ | Listed proxy product page |
| North America carbon proxy | KraneShares KCCA | https://kraneshares.com/etf/kcca/ | Listed proxy product page |
| Public chart feed | Yahoo Finance chart endpoint | https://query1.finance.yahoo.com/v8/finance/chart | Public web chart feed, not official settlement |

## Open-Source Benchmark Repositories

| Repository | URL | C-Quant Use Boundary |
| --- | --- | --- |
| `hyperledger-labs/blockchain-carbon-accounting` | https://github.com/hyperledger-labs/blockchain-carbon-accounting | Provenance and audit patterns only |
| `CarbonScribe/carbon-scribe` | https://github.com/CarbonScribe/carbon-scribe | Credit lifecycle visibility only |
| `CarbonCreditProject/Carbon-Project` | https://github.com/CarbonCreditProject/Carbon-Project | Market-structure concepts only |
| `SaveChris/Inf-Imb-for-EUA23` | https://github.com/SaveChris/Inf-Imb-for-EUA23 | Phase-aware factor research only |
| `yc-wang00/verra-scaper` | https://github.com/yc-wang00/verra-scaper | Registry ingestion patterns only |
| `carbonplan/forest-risks` | https://github.com/carbonplan/forest-risks | Nature-credit risk overlay patterns only |
| `hgribeirogeo/qaoa-carbon-cerrado` | https://github.com/hgribeirogeo/qaoa-carbon-cerrado | Multi-objective portfolio framing only |
| `JGCRI/gcam-core` | https://github.com/JGCRI/gcam-core | Macro scenario logic only |

## Update Protocol

1. Add or change a link here first.
2. Add the same link to `README.md` or app UI only if it belongs in the public-facing surface.
3. Record whether the link is official, public web flow, official file, public API, paid API, listed proxy, or internal document.
4. Keep blog, social, and vendor links marked as missing until an actual URL is provided or verified.
