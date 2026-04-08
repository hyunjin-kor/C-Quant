# C-Quant Research Baseline

작성일: 2026-04-08  
기준: 공식 제도 문서, 거래소/시장 운영자 문서, 1차 연구 문헌

## 전제

사용자 요구의 "국가별 100% 변수 정리"는 수학적으로 완전한 인과 분해를 뜻하는 것으로는 충족시킬 수 없습니다. 공식 기관이나 논문도 시장 가격 형성의 문자 그대로 100%를 증명하지는 못합니다. 이 문서는 실제 제품에 넣을 수 있는 수준의 포괄적 feature universe를 정리한 것입니다.

## 1. EU ETS

핵심 변수군

- 정책 공급: cap path, LRF, Fit for 55, ETS2, maritime inclusion
- 시장 안정화: TNAC, MSR withdrawal, auction volume
- 전력 복합체: power price, dispatch margin, thermal generation profitability
- 연료 전환: TTF gas, coal, oil
- 거시/금융: equity stress, FX uncertainty, industrial production
- 날씨/계절성: temperature extremes, wind/hydro, compliance cycle
- 마이크로스트럭처: EEX auction rhythm, ICE futures depth and open interest

실무 해석

- 구조적 공급 변수와 연료-전력 변수는 모델의 첫 계층이어야 합니다.
- EU는 policy credibility shock과 power-fuel complex를 동시에 봐야 합니다.
- 단기 execution에는 auction calendar와 futures liquidity를 별도 계층으로 둬야 합니다.

## 2. K-ETS

핵심 변수군

- 할당 및 경매: free allocation share, auction share, sector grouping
- 시장 안정화: automatic stabilization, cancellation rule changes
- carryover/banking: unused allowance carryover and conversion rules
- 내부 시장 변수: KCU/KOC price and volume
- 일정 변수: verification and surrender timing around February-March
- 유동성: institution access, brokerage, delegated trading, futures roadmap
- 매크로 보조 변수: oil, exchange rate, call rate, domestic equities

실무 해석

- K-ETS는 유동성과 제도 설계가 곧 price variable입니다.
- EU처럼 외부 에너지 변수만으로 설명하려 하면 오판 가능성이 큽니다.
- compliance calendar와 offset market 상태는 별도 regime feature로 유지해야 합니다.

## 3. China National ETS

핵심 변수군

- sector expansion: steel, cement, aluminum inclusion
- power reform: electricity spot market and power-sector rules
- coal economics: coal price and coal-heavy dispatch
- gas economics: LNG / natural gas substitution pressure
- market depth: volume, price discovery, reporting quality
- allocation design: intensity-based allocation and allowance rules
- environmental stress: AQI and pollution-policy urgency proxy
- industrial proxy: industrial index

실무 해석

- China ETS는 아직 power-sector regime와 policy implementation quality를 강하게 탑니다.
- coal and electricity variables는 분리해서 넣되, event encoder와 함께 봐야 합니다.
- sector expansion events는 단순 뉴스가 아니라 scarcity state change로 처리해야 합니다.

## 4. 탄소배출권 퀀트 트레이딩 지표

우선 구현 지표

- Clean Dark Spread / Clean Spark Spread
- Auction cover, auction volume, settlement calendar
- Compliance countdown features
- Lead-lag residual z-score between carbon and energy proxies
- Trend plus volatility regime filter
- Volume / open interest / participation breadth

왜 이 조합이 필요한가

- carbon market는 정책시장이라 headline만 보면 늦고, pure technical만 보면 구조를 놓칩니다.
- power-fuel economics, supply policy, and execution liquidity를 함께 봐야 실전 운용이 됩니다.

## 5. 참고 사이트와 제품 반영 항목

공식/시장 구조

- EU Commission carbon market pages
- KRX ETS information platform
- China National Carbon Trading Market Information Network

실행/시장 데이터

- EEX EU ETS auctions
- ICE EUA futures
- Xpansiv CBL

리스크/분석

- Sylvera
- AlliedOffsets
- Carbon Insights

우리 제품에 반드시 들어가야 하는 것

- 국가별 공급 정책 변화 타임라인
- power-fuel-carbon linkage 화면
- strategy lab with upload, cost, and slippage assumptions
- policy-event aware forecast studio
- portfolio and risk layer

## 6. 제품 한계

- 아직 live market data vendor 연결이 없습니다.
- 현재 예측 엔진은 방향성 시나리오 엔진이며, 실거래용 calibrated price target model은 아닙니다.
- production deployment 전에는 시장별 historical data, walk-forward validation, and data licensing이 필요합니다.

## Sources

- EU Commission: https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en
- EU Commission: https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/market-stability-reserve_en
- EU Commission: https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/ets2-buildings-road-transport-and-additional-sectors_en
- EU Commission: https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/monitoring-reporting-and-verification/ets-reporting-tool-ert_en
- Nature Energy 2024: https://www.nature.com/articles/s41560-024-01505-x
- arXiv 2024: https://arxiv.org/abs/2406.05094
- Economia Politica 2024: https://link.springer.com/article/10.1007/s40888-024-00341-2
- Aatola et al.: https://www.sciencedirect.com/science/article/pii/S014098831200223X
- MDPI 2018 EUA determinants: https://www.mdpi.com/2071-1050/10/11/4009
- ICAP K-ETS: https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets
- Korean MOE press release: https://eng.me.go.kr/eng/web/board/read.do?boardId=1718360&boardMasterId=522&menuId=461
- KRX ETS platform: https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp
- KEREA 2018 paper: https://journal.resourceeconomics.or.kr/articles/article/oj4R/
- MEE 2025 progress report: https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf
- China National Carbon Trading Market Information Network: https://www.cets.org.cn
- IGES 2024: https://www.iges.or.jp/system/files/publication_documents/pub/conferencepaper/13943/Full%20paper%20for%20SEEPS2024_Xianbing%20Liu_20240730.pdf
- MDPI 2023 China drivers: https://www.mdpi.com/2071-1050/15/3/2203
- EEX auctions: https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions
- ICE EUA futures: https://www.ice.com/products/197
- Xpansiv CBL: https://www.xpansiv.com/trading-platforms/cbl
- Sylvera: https://www.sylvera.com/solutions
- AlliedOffsets: https://alliedoffsets.com/monitor-tool/
- Carbon Insights: https://carboninsights.net/carbon-pulse-index
