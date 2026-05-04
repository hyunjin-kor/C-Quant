import type { BenchmarkPlatform, MarketProfile, QuantIndicator } from "../types";

const today = "2026-04-08";
const latestReview = "2026-04-18";

export const marketProfiles: MarketProfile[] = [
  {
    id: "eu-ets",
    name: "EU ETS",
    region: "European Union",
    stageNote:
      "Phase 4 market with MSR-driven supply management, maritime inclusion from 2024, and ETS2 standing up for buildings and road transport from 2027.",
    scopeNote:
      "EU Commission pages and 2024-2025 research consistently show that policy supply, gas-power-coal complex, macro-financial stress, and compliance timing remain the dominant feature families.",
    sourceNote:
      "No source can prove a literal causal 100% decomposition of price formation. This product uses a research-backed comprehensive feature universe for production modelling.",
    modelBlueprint: [
      "Daily futures and spot inputs: EUA, TTF gas, Rotterdam coal, Brent, power, auction calendar, TNAC/MSR announcements.",
      "Feature groups: supply-policy, fuel-switch economics, power demand, macro-financial stress, weather/compliance, auction microstructure.",
      "Primary model stack: gradient boosting for structured predictors plus sequence model for lagged dependencies; calibration must be walk-forward and market-regime aware."
    ],
    drivers: [
      {
        id: "eu_supply_cap",
        category: "Policy Supply",
        variable: "Cap path, LRF, Fit for 55 revisions, ETS2 spillover expectations",
        importance: "Core",
        direction: "context",
        weight: 1.25,
        note: "Structural tightening in the EU ETS changes forward scarcity and anchors medium-term price expectations.",
        sources: [
          {
            label: "EU Commission - About the EU ETS",
            url: "https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en",
            accessed: today
          },
          {
            label: "EU Commission - ETS2",
            url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/ets2-buildings-road-transport-and-additional-sectors_en",
            accessed: today
          },
          {
            label: "Nature Energy 2024 - policy credibility and EU carbon prices",
            url: "https://www.nature.com/articles/s41560-024-01505-x",
            accessed: today
          }
        ]
      },
      {
        id: "eu_tnac_msr",
        category: "Policy Supply",
        variable: "TNAC and Market Stability Reserve auction withdrawals",
        importance: "Core",
        direction: "lower",
        weight: 1.2,
        note: "Higher surplus weakens scarcity; tighter MSR withdrawals reduce auction supply and support price.",
        sources: [
          {
            label: "EU Commission - Market Stability Reserve",
            url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/market-stability-reserve_en",
            accessed: today
          },
          {
            label: "EU Commission - 2025 MSR auction reduction notice",
            url: "https://climate.ec.europa.eu/news-other-reads/news/market-stability-reserve-under-eu-emissions-trading-system-reduce-auction-volume-276-million-2025-05-28_lv",
            accessed: today
          }
        ]
      },
      {
        id: "eu_power",
        category: "Power Complex",
        variable: "Wholesale electricity price and implied thermal generation margin",
        importance: "Core",
        direction: "higher",
        weight: 1.05,
        note: "Electricity price strength changes thermal dispatch profitability and allowance demand.",
        sources: [
          {
            label: "Aatola et al. - market fundamentals and EUA pricing",
            url: "https://www.sciencedirect.com/science/article/pii/S014098831200223X",
            accessed: today
          },
          {
            label: "MDPI 2018 - determinants of the EUA in phase 3",
            url: "https://www.mdpi.com/2071-1050/10/11/4009",
            accessed: today
          }
        ]
      },
      {
        id: "eu_gas",
        category: "Fuel Switching",
        variable: "TTF gas / LNG complex",
        importance: "Core",
        direction: "context",
        weight: 1.1,
        note: "Gas moves the clean spark spread and fuel-switch economics; sign can vary with concurrent power and coal moves, so it must be modelled jointly.",
        sources: [
          {
            label: "TandF 2024 - EU ETS non-parametric determinants",
            url: "https://www.tandfonline.com/doi/full/10.1080/14697688.2024.2407895",
            accessed: today
          },
          {
            label: "arXiv 2024 - EU ETS determinant analysis",
            url: "https://arxiv.org/abs/2406.05094",
            accessed: today
          }
        ]
      },
      {
        id: "eu_coal",
        category: "Fuel Switching",
        variable: "Rotterdam coal futures",
        importance: "High",
        direction: "context",
        weight: 0.9,
        note: "Coal matters through coal-to-gas dispatch switching and dark spread economics.",
        sources: [
          {
            label: "Economia Politica 2024 - high-dimensional EU ETS integration",
            url: "https://link.springer.com/article/10.1007/s40888-024-00341-2",
            accessed: today
          },
          {
            label: "Aatola et al. - market fundamentals and EUA pricing",
            url: "https://www.sciencedirect.com/science/article/pii/S014098831200223X",
            accessed: today
          }
        ]
      },
      {
        id: "eu_oil",
        category: "Fuel Switching",
        variable: "Brent crude / broad commodity complex",
        importance: "High",
        direction: "higher",
        weight: 0.65,
        note: "Oil is usually a secondary macro-energy proxy rather than the first dispatch signal, but it remains informative across commodity regimes.",
        sources: [
          {
            label: "Economia Politica 2024 - economic and energy variables",
            url: "https://link.springer.com/article/10.1007/s40888-024-00341-2",
            accessed: today
          },
          {
            label: "TandF 2024 - EU ETS determinant analysis",
            url: "https://www.tandfonline.com/doi/full/10.1080/14697688.2024.2407895",
            accessed: today
          }
        ]
      },
      {
        id: "eu_financial",
        category: "Macro and Financial",
        variable: "Equity index, credit stress, EUR/CHF uncertainty",
        importance: "High",
        direction: "context",
        weight: 0.95,
        note: "Recent work shows that financial fluctuations became more important in Phase 4, especially under crisis regimes.",
        sources: [
          {
            label: "arXiv 2024 - Phase 4 determinant shift to financial fluctuations",
            url: "https://arxiv.org/abs/2406.05094",
            accessed: today
          },
          {
            label: "TandF 2024 - speculation and carbon price predictability",
            url: "https://www.tandfonline.com/doi/abs/10.1080/1540496X.2024.2324194",
            accessed: today
          }
        ]
      },
      {
        id: "eu_industry",
        category: "Macro and Financial",
        variable: "Industrial production and manufacturing activity",
        importance: "High",
        direction: "higher",
        weight: 0.8,
        note: "Industrial output changes compliance demand from covered sectors beyond power generation.",
        sources: [
          {
            label: "Economia Politica 2024 - industrial production in broader system",
            url: "https://link.springer.com/article/10.1007/s40888-024-00341-2",
            accessed: today
          },
          {
            label: "Updated literature review reference via KEREA paper bibliography",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          }
        ]
      },
      {
        id: "eu_weather",
        category: "Weather and Seasonality",
        variable: "Temperature extremes, heating demand, wind and hydro conditions",
        importance: "High",
        direction: "context",
        weight: 0.7,
        note: "Weather changes power demand and renewable output, which feeds thermal generation and EUA demand.",
        sources: [
          {
            label: "Energy Economics - weather, energy, and carbon prices",
            url: "https://www.sciencedirect.com/science/article/pii/S0301421506002121",
            accessed: today
          },
          {
            label: "MDPI 2018 - cold weather and allowance demand",
            url: "https://www.mdpi.com/2071-1050/10/11/4009",
            accessed: today
          }
        ]
      },
      {
        id: "eu_auction_micro",
        category: "Market Microstructure",
        variable: "Auction schedule, auction coverage, open interest, liquidity",
        importance: "Support",
        direction: "context",
        weight: 0.55,
        note: "Auction rhythm and derivatives positioning matter for short-horizon execution and slippage control.",
        sources: [
          {
            label: "EEX - EU ETS auctions",
            url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
            accessed: today
          },
          {
            label: "ICE - EUA futures contract",
            url: "https://www.ice.com/products/197",
            accessed: today
          }
        ]
      },
      {
        id: "eu_compliance",
        category: "Calendar Effects",
        variable: "Compliance cycle and surrender deadlines",
        importance: "Support",
        direction: "higher",
        weight: 0.45,
        note: "Compliance seasonality can create recurring liquidity and short-term demand patterns.",
        sources: [
          {
            label: "EU Commission - ETS Reporting Tool and compliance cycle",
            url: "https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/monitoring-reporting-and-verification/ets-reporting-tool-ert_en",
            accessed: today
          }
        ]
      },
      {
        id: "eu_speculation",
        category: "Market Microstructure",
        variable: "Investment fund net position share + open interest growth (financialisation index)",
        importance: "High",
        direction: "context",
        weight: 0.85,
        note: "ESMA 2024 reports ~6% of EUA positions held by ~406 funds (2023), turning increasingly short. Quemin & Pahle (2023) flag financialisation as needing direct monitoring; Friedrich et al. (2019) show speculative regimes shift price formation.",
        sources: [
          {
            label: "ESMA 2024 EU Carbon Markets Report",
            url: "https://www.esma.europa.eu/sites/default/files/2024-10/ESMA50-43599798-10379_Carbon_markets_report_2024.pdf",
            accessed: today
          },
          {
            label: "ECB Bulletin 3/2022 - Ampudia et al. on speculation",
            url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2022/html/ecb.ebbox202203_06~ca1e9ea13e.en.html",
            accessed: today
          },
          {
            label: "Quemin & Pahle 2023 - Nature Climate Change",
            url: "https://www.nature.com/articles/s41558-022-01560-w",
            accessed: today
          }
        ]
      },
      {
        id: "eu_term_structure",
        category: "Market Microstructure",
        variable: "Spot vs Dec contract basis / convenience yield",
        importance: "High",
        direction: "context",
        weight: 0.7,
        note: "Bredin & Parsons (2016) document negative convenience yields persisting from 2008; persistent term-structure premium reveals expectations about banking-rule evolution.",
        sources: [
          {
            label: "Bredin & Parsons 2016 - Energy Journal",
            url: "https://ideas.repec.org/a/aen/journl/ej37-3-bredin.html",
            accessed: today
          }
        ]
      },
      {
        id: "eu_renewables_share",
        category: "Power Complex",
        variable: "Wind + solar generation share (ENTSO-E daily)",
        importance: "Core",
        direction: "lower",
        weight: 1,
        note: "Koch et al. (2014) identify wind+solar generation as one of only two robust explanators of the 2008-2013 collapse. Daily renewables share is more predictive than installed capacity alone.",
        sources: [
          {
            label: "Koch et al. 2014 - Energy Policy 73",
            url: "https://ideas.repec.org/a/eee/enepol/v73y2014icp676-685.html",
            accessed: today
          },
          {
            label: "ENTSO-E transparency platform",
            url: "https://transparency.entsoe.eu/",
            accessed: today
          }
        ]
      },
      {
        id: "eu_eurusd",
        category: "Macro and Financial",
        variable: "EUR/USD exchange rate",
        importance: "Support",
        direction: "context",
        weight: 0.55,
        note: "Tan & Wang (2017) and Phase IV evidence flag FX as transmitting via the coal-gas substitution channel; effect is quantile-dependent.",
        sources: [
          {
            label: "Tan & Wang 2017 - Applied Energy",
            url: "https://ideas.repec.org/a/eee/appene/v190y2017icp306-325.html",
            accessed: today
          }
        ]
      },
      {
        id: "eu_ets2",
        category: "Policy Supply",
        variable: "ETS2 price stability mechanism (buildings + road transport, 2027 launch)",
        importance: "High",
        direction: "context",
        weight: 0.9,
        note: "ETS2 launches 2027, full surrender 2028. Price stability mechanism releases additional allowances if price exceeds €45 (2020 prices) in first two years. 2030 estimated range €71-€261/tCO2.",
        sources: [
          {
            label: "Görlach et al. 2025 - Climate Policy",
            url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2025.2485196",
            accessed: today
          },
          {
            label: "EU Commission - ETS2",
            url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/ets2-buildings-road-transport-and-additional-sectors_en",
            accessed: today
          }
        ]
      },
      {
        id: "eu_cbam",
        category: "Policy Supply",
        variable: "CBAM certificate price linkage (= EUA quarterly auction average 2026, weekly 2027+)",
        importance: "High",
        direction: "higher",
        weight: 0.85,
        note: "CBAM mechanically links importer cost to EUA auction price; transition phase reporting started 2023-10-01. Definitive period 2026-01.",
        sources: [
          {
            label: "EU Commission - CBAM",
            url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
            accessed: today
          }
        ]
      },
      {
        id: "eu_macro_shock",
        category: "Macro and Financial",
        variable: "Carbon-policy shock (high-frequency window around EC announcements)",
        importance: "High",
        direction: "higher",
        weight: 0.8,
        note: "Känzig (2023): 1 SD restrictive carbon shock raises energy prices, cuts emissions; real GDP -0.2%, equity prices >-2%. Provides a clean shock-identification scheme usable in C-Quant.",
        sources: [
          {
            label: "Känzig 2023 - NBER WP 31221",
            url: "https://www.nber.org/papers/w31221",
            accessed: today
          },
          {
            label: "ECB Bulletin 8/2024 - Anaya Longaric et al.",
            url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2025/html/ecb.ebbox202408_02~55e30afb57.en.html",
            accessed: today
          }
        ]
      }
    ]
  },
  {
    id: "k-ets",
    name: "K-ETS",
    region: "Republic of Korea",
    stageNote:
      "Phase 3 runs through 2025; the fourth Basic Plan covers 2026-2035 and raises auctioning, benchmarking, liquidity access, and automatic market stabilization.",
    scopeNote:
      "K-ETS remains structurally policy-driven. Internal allowance balance, offset markets, compliance calendar, and market design changes still dominate before external macro variables fully take over.",
    sourceNote:
      "The Korean market is thinner than EU ETS, so internal market structure and policy changes must be treated as first-order variables, not side features.",
    modelBlueprint: [
      "Daily inputs: KAU/KCU/KOC prices and volumes, KRX market stats, compliance calendar, auction data, policy announcements, oil and FX proxies.",
      "Feature groups: allocation and auction design, banking/carryover, offset conversion, market participation breadth, macro-financial filters.",
      "Primary model stack: tree ensemble plus regime classifier that separates compliance months, liquidity regime, and policy-shift regime."
    ],
    drivers: [
      {
        id: "kr_allowance_balance",
        category: "Policy Supply",
        variable: "Allocation balance, free allocation share, auction share",
        importance: "Core",
        direction: "lower",
        weight: 1.25,
        note: "Scarcity depends on the cap, sector grouping, and how much supply is auctioned versus freely allocated.",
        sources: [
          {
            label: "ICAP - K-ETS overview and phase structure",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          },
          {
            label: "KRX ETS platform - market feature overview",
            url: "https://ets.krx.co.kr/contents/OPN/01/01050402/OPN01050402.jsp",
            accessed: today
          }
        ]
      },
      {
        id: "kr_market_stabilization",
        category: "Policy Supply",
        variable: "Market Stabilization Mechanism and cancellation rules",
        importance: "Core",
        direction: "context",
        weight: 1.1,
        note: "The 2026-2035 basic plan introduces automatic stabilization, which directly changes supply-demand adjustment expectations.",
        sources: [
          {
            label: "ICAP - fourth Basic Plan measures",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          },
          {
            label: "Korean MOE English press release on liquidity reform",
            url: "https://eng.me.go.kr/eng/web/board/read.do?boardId=1718360&boardMasterId=522&menuId=461",
            accessed: today
          }
        ]
      },
      {
        id: "kr_banking",
        category: "Policy Supply",
        variable: "Carryover, banking, and offset conversion rules",
        importance: "Core",
        direction: "higher",
        weight: 1,
        note: "Relaxed carryover changes intertemporal scarcity and softens forced selling near compliance windows.",
        sources: [
          {
            label: "ICAP - 2024 liquidity measures",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          }
        ]
      },
      {
        id: "kr_offsets",
        category: "Internal Market",
        variable: "KCU and KOC prices and transaction volumes",
        importance: "Core",
        direction: "context",
        weight: 1.05,
        note: "Local research shows complementary credit prices and volumes became statistically significant as the market matured.",
        sources: [
          {
            label: "KEREA 2018 - learning-by-doing in K-ETS pricing",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          },
          {
            label: "KRX ETS platform - offsets overview",
            url: "https://ets.krx.co.kr/contents/ETS/05/05010100/ETS05010100.jsp",
            accessed: today
          }
        ]
      },
      {
        id: "kr_compliance_deadline",
        category: "Calendar Effects",
        variable: "Verification report and surrender timing around February-March",
        importance: "Core",
        direction: "higher",
        weight: 0.95,
        note: "The compliance filing calendar is one of the few variables shown as significant across commitment periods in Korean literature.",
        sources: [
          {
            label: "KEREA 2018 - submission timing binary variables",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          },
          {
            label: "KRX ETS platform - verification and statement flow",
            url: "https://ets.krx.co.kr/contents/OPN/01/01050402/OPN01050402.jsp",
            accessed: today
          }
        ]
      },
      {
        id: "kr_liquidity",
        category: "Market Microstructure",
        variable: "Participation breadth, brokerage access, delegated trading",
        importance: "High",
        direction: "higher",
        weight: 0.8,
        note: "Liquidity reforms in February 2025 changed who can participate and how orders reach the market.",
        sources: [
          {
            label: "MOE English press release - wider institution access",
            url: "https://eng.me.go.kr/eng/web/board/read.do?boardId=1718360&boardMasterId=522&menuId=461",
            accessed: today
          },
          {
            label: "KRX ETS platform - account and consignment rules",
            url: "https://ets.krx.co.kr/contents/RGL/04/04030500/RGL04030500.jsp",
            accessed: today
          }
        ]
      },
      {
        id: "kr_oil",
        category: "Macro and Energy",
        variable: "WTI/Brent oil shock as fuel cost proxy",
        importance: "High",
        direction: "higher",
        weight: 0.72,
        note: "Oil acts as an external energy-cost proxy; its explanatory power rises after the market matures and policy frictions ease.",
        sources: [
          {
            label: "KEREA 2018 - macro conditions become significant in second period",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          }
        ]
      },
      {
        id: "kr_fx_rates",
        category: "Macro and Financial",
        variable: "Exchange rate and call rate",
        importance: "High",
        direction: "context",
        weight: 0.68,
        note: "Local evidence indicates that exchange rate and interest-rate conditions become significant once the market internalizes trading experience.",
        sources: [
          {
            label: "KEREA 2018 - exchange rate and call rate significance",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          }
        ]
      },
      {
        id: "kr_equities",
        category: "Macro and Financial",
        variable: "Domestic equity conditions / stock index proxy",
        importance: "Support",
        direction: "higher",
        weight: 0.45,
        note: "A useful secondary proxy for industrial cycle and compliance purchasing capacity.",
        sources: [
          {
            label: "KEREA 2018 - stock price significance in second period",
            url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
            accessed: today
          }
        ]
      },
      {
        id: "kr_auction_design",
        category: "Market Microstructure",
        variable: "Auction monthly carryover and bid ratio",
        importance: "Support",
        direction: "context",
        weight: 0.55,
        note: "Auction design now reacts to prior-month bid ratios, so auction coverage becomes a live microstructure signal.",
        sources: [
          {
            label: "ICAP - auction volume linked to prior bid ratio",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          }
        ]
      },
      {
        id: "kr_penalty_multiplier",
        category: "Policy Supply",
        variable: "Penalty multiplier (3x average price, capped KRW 100,000/tCO2e)",
        importance: "Core",
        direction: "higher",
        weight: 1.05,
        note: "Kim & Yu (2018): Korea's penalty rate of 3 x average market price (capped KRW 100,000) creates a soft ceiling. The multiplier - not the cap - drives equilibrium prices.",
        sources: [
          {
            label: "Kim & Yu 2018 - Carbon Management",
            url: "https://www.tandfonline.com/doi/full/10.1080/17583004.2018.1440852",
            accessed: today
          },
          {
            label: "ICAP - K-ETS penalty rule",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          }
        ]
      },
      {
        id: "kr_otc_spread",
        category: "Market Microstructure",
        variable: "OTC-exchange spread (KOC vs KAU)",
        importance: "High",
        direction: "context",
        weight: 0.75,
        note: "Etienne & Yu (2017): KOC OTC trades persistently above exchange-listed KAU - inverse to conventional wisdom. Limited counterparties + higher OTC price jointly suppress exchange liquidity. Inverse spread is itself a liquidity signal.",
        sources: [
          {
            label: "Etienne & Yu 2017 - Carbon Management",
            url: "https://www.tandfonline.com/doi/full/10.1080/17583004.2017.1309205",
            accessed: today
          }
        ]
      },
      {
        id: "kr_allocation_tightness",
        category: "Policy Supply",
        variable: "Allocation tightness ratio (expected emissions / free allowance)",
        importance: "Core",
        direction: "higher",
        weight: 1.15,
        note: "Jun, Kim & Oh (2021): the strongest determinant of intensity response in K-ETS Phase 1. Higher tightness = stronger compliance demand pressure on KAU.",
        sources: [
          {
            label: "Jun, Kim & Oh 2021 - Env Econ Policy Studies",
            url: "https://link.springer.com/article/10.1007/s10018-021-00302-0",
            accessed: today
          }
        ]
      },
      {
        id: "kr_attention",
        category: "Market Microstructure",
        variable: "Search-query interest (Naver / Google trends) on carbon-trading terms",
        importance: "Support",
        direction: "higher",
        weight: 0.5,
        note: "MDPI Sustainability (2022) shows search-query interest carries leading signal for KAU price beyond coal/oil. Useful as an attention/sentiment proxy.",
        sources: [
          {
            label: "MDPI Sustainability 2022 - K-ETS prediction",
            url: "https://www.mdpi.com/2071-1050/14/13/8177",
            accessed: today
          }
        ]
      },
      {
        id: "kr_tariff_insulation",
        category: "Policy Implementation",
        variable: "KEPCO power tariff freeze (regime variable)",
        importance: "High",
        direction: "lower",
        weight: 0.7,
        note: "Tan, Wang, Choi & Lee (2024): when KEPCO tariffs are frozen, carbon-cost pass-through is dampened and KAU price signal weakens. Climate Policy (2024) corroborates political-resistance channel.",
        sources: [
          {
            label: "Tan, Wang, Choi & Lee 2024 - Utilities Policy",
            url: "https://www.sciencedirect.com/science/article/abs/pii/S0957178724000456",
            accessed: today
          },
          {
            label: "Climate Policy 2024 - electricity-market constraints",
            url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2024.2394508",
            accessed: today
          }
        ]
      },
      {
        id: "kr_financial_cap",
        category: "Market Microstructure",
        variable: "Financial-institution KAU position cap regime",
        importance: "High",
        direction: "higher",
        weight: 0.8,
        note: "ICAP timeline: 200k (2021) -> 500k (Dec 2022) -> 1m (2023) -> broader trading from Feb 7, 2025. Yim et al. (2024) show Hurst exponent regime breaks coincide with cap changes.",
        sources: [
          {
            label: "ICAP - K-ETS financial institution access",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
            accessed: today
          },
          {
            label: "Yim et al. 2024 - Emerging Markets Finance and Trade",
            url: "https://www.tandfonline.com/doi/full/10.1080/1540496X.2024.2379460",
            accessed: today
          }
        ]
      }
    ]
  },
  {
    id: "cn-ets",
    name: "China National ETS",
    region: "China",
    stageNote:
      "The national market remains power-led but is expanding to steel, cement, and aluminum smelting under the March 20, 2025 work plan.",
    scopeNote:
      "China's market is still shaped by power-sector reform, coal economics, intensity-based allocation, data quality, and staged sector expansion.",
    sourceNote:
      "National ETS variables must be modelled with stronger regime dependence because policy implementation, market maturity, and electricity reform can all change factor loadings.",
    modelBlueprint: [
      "Daily inputs: national carbon price, trading volume, coal, LNG, power market prices, industrial index, air-quality proxy, policy events, sector expansion milestones.",
      "Feature groups: electricity and coal economics, power-sector regulation, allocation intensity, market depth, environmental-policy urgency.",
      "Primary model stack: hybrid sequence model with explicit policy-event encoder and slower structural-state features."
    ],
    drivers: [
      {
        id: "cn_sector_expansion",
        category: "Policy Supply",
        variable: "Sector expansion into steel, cement, and aluminum",
        importance: "Core",
        direction: "higher",
        weight: 1.2,
        note: "Coverage expansion mechanically changes compliance demand and strengthens national price discovery.",
        sources: [
          {
            label: "MEE 2025 progress report",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_power_market",
        category: "Power Complex",
        variable: "Power-sector reform and electricity spot price",
        importance: "Core",
        direction: "higher",
        weight: 1.05,
        note: "China's national ETS is still anchored in the power sector, so electricity-market reform directly affects carbon demand transmission.",
        sources: [
          {
            label: "IGES 2024 - interactions between electricity, carbon and fossil fuel prices",
            url: "https://www.iges.or.jp/system/files/publication_documents/pub/conferencepaper/13943/Full%20paper%20for%20SEEPS2024_Xianbing%20Liu_20240730.pdf",
            accessed: today
          },
          {
            label: "MEE progress report - annual power emission factor and reporting architecture",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_coal",
        category: "Fuel Economics",
        variable: "Coal price and coal-heavy dispatch economics",
        importance: "Core",
        direction: "context",
        weight: 1.1,
        note: "Coal remains the key fuel anchor. Long-term cointegration with carbon price is documented, though short-run effects can be weak or regime-specific.",
        sources: [
          {
            label: "IGES 2024 - long-term cointegration with coal",
            url: "https://www.iges.or.jp/system/files/publication_documents/pub/conferencepaper/13943/Full%20paper%20for%20SEEPS2024_Xianbing%20Liu_20240730.pdf",
            accessed: today
          },
          {
            label: "MDPI 2023 - Bohai-Rim steam-coal price as explanatory variable",
            url: "https://www.mdpi.com/2071-1050/15/3/2203",
            accessed: today
          }
        ]
      },
      {
        id: "cn_lng",
        category: "Fuel Economics",
        variable: "LNG / natural gas price",
        importance: "High",
        direction: "higher",
        weight: 0.72,
        note: "Gas is a cleaner substitute fuel and enters both macro and dispatch channels in China's carbon pricing studies.",
        sources: [
          {
            label: "MDPI 2023 - LNGI in carbon price model",
            url: "https://www.mdpi.com/2071-1050/15/3/2203",
            accessed: today
          },
          {
            label: "IGES 2024 - electricity spot price positively associated with LNG",
            url: "https://www.iges.or.jp/system/files/publication_documents/pub/conferencepaper/13943/Full%20paper%20for%20SEEPS2024_Xianbing%20Liu_20240730.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_volume",
        category: "Market Microstructure",
        variable: "Trading volume and depth",
        importance: "High",
        direction: "higher",
        weight: 0.8,
        note: "In a still-maturing market, price discovery is more fragile and volume carries extra information about regime strength.",
        sources: [
          {
            label: "MEE progress report - price signal and market influence",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_allocation_design",
        category: "Policy Supply",
        variable: "Intensity-based allowance allocation and compliance rules",
        importance: "High",
        direction: "context",
        weight: 0.92,
        note: "Allocation intensity settings and reporting quality are part of the core policy architecture and can dominate observed scarcity.",
        sources: [
          {
            label: "MEE progress report - intensity-based approach and supporting systems",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_aqi",
        category: "Environmental Signal",
        variable: "AQI / pollution pressure proxy",
        importance: "Support",
        direction: "higher",
        weight: 0.5,
        note: "Environmental stress can proxy policy urgency and energy-structure pressure in Chinese empirical work.",
        sources: [
          {
            label: "MDPI 2023 - AQI as explanatory variable",
            url: "https://www.mdpi.com/2071-1050/15/3/2203",
            accessed: today
          }
        ]
      },
      {
        id: "cn_industry_index",
        category: "Macro and Financial",
        variable: "Shanghai industrial index / industrial activity proxy",
        importance: "Support",
        direction: "higher",
        weight: 0.55,
        note: "Industrial cycle filters can help separate economic activity shocks from pure policy shocks.",
        sources: [
          {
            label: "MDPI 2023 - SSE industrial index in model design",
            url: "https://www.mdpi.com/2071-1050/15/3/2203",
            accessed: today
          }
        ]
      },
      {
        id: "cn_data_quality",
        category: "Policy Implementation",
        variable: "MRV quality, annual power emission factors, verification completion",
        importance: "Support",
        direction: "context",
        weight: 0.48,
        note: "Reporting and verification quality affects the credibility of scarcity itself, not just noise around it.",
        sources: [
          {
            label: "MEE progress report - data quality as fundamental task",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
            accessed: today
          }
        ]
      },
      {
        id: "cn_eua_spillover",
        category: "Macro and Financial",
        variable: "EU EUA spillover into national CEA (long-run elasticity)",
        importance: "High",
        direction: "lower",
        weight: 0.85,
        note: "Liao et al. (2025): long-run elasticity -0.368 (1% EUA shock -> -0.368% CEA over 760 daily obs). When EU EUA falls, China CEA tends to firm (substitution / capital reallocation channel).",
        sources: [
          {
            label: "Liao et al. 2025 - PLoS ONE",
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
            accessed: today
          }
        ]
      },
      {
        id: "cn_power_equity_index",
        category: "Macro and Financial",
        variable: "Chinese power-industry equity index (Shenwan / EL 300)",
        importance: "Core",
        direction: "higher",
        weight: 1.05,
        note: "Liao et al. (2025): long-run elasticity +1.195 - the strongest non-self driver in their VEC variance decomposition for the national CEA.",
        sources: [
          {
            label: "Liao et al. 2025 - PLoS ONE",
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
            accessed: today
          }
        ]
      },
      {
        id: "cn_power_emissions",
        category: "Power Complex",
        variable: "Power-sector verified emissions (Carbon Monitor)",
        importance: "Core",
        direction: "lower",
        weight: 0.95,
        note: "Liao et al. (2025): long-run elasticity -0.757%. Higher emissions -> looser supply -> lower CEA. Carbon Monitor provides daily near-real-time emissions estimates.",
        sources: [
          {
            label: "Liao et al. 2025 - PLoS ONE",
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
            accessed: today
          },
          {
            label: "Carbon Monitor - China power emissions",
            url: "https://carbonmonitor.org.cn/",
            accessed: today
          }
        ]
      },
      {
        id: "cn_pilot_transmission",
        category: "Market Microstructure",
        variable: "Pilot-to-national transmission (Beijing & Chongqing as net transmitters)",
        importance: "High",
        direction: "context",
        weight: 0.78,
        note: "Xiao et al. (2022) TVP-VAR: total system spillover ~54%; Beijing & Chongqing dominant net spillover transmitters; Guangdong & Tianjin net receivers. Pilot price shocks > 10% should be watched as cross-pilot cascade triggers into national CEA.",
        sources: [
          {
            label: "Xiao et al. 2022 - ESPR",
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8961101/",
            accessed: today
          }
        ]
      },
      {
        id: "cn_ccer_utilization",
        category: "Internal Market",
        variable: "CCER offset utilization (relaunched Jan 2024, 5% compliance cap)",
        importance: "High",
        direction: "lower",
        weight: 0.82,
        note: "Wang et al. (2022): 5% CCER cap. CCER restart Jan 22, 2024: first 5 days = 911k tons (~3x mandatory market volume); CCER traded at 21% premium then 17% discount. Wider CCER discount vs CEA = more offset substitution = downward CEA pressure.",
        sources: [
          {
            label: "Wang et al. 2022 - Carbon Neutrality (Springer)",
            url: "https://link.springer.com/article/10.1007/s43979-022-00035-3",
            accessed: today
          },
          {
            label: "MEE Carbon Market Feed (CCER bulletins)",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
            accessed: today
          }
        ]
      },
      {
        id: "cn_usdcny",
        category: "Macro and Financial",
        variable: "USD/CNY exchange rate",
        importance: "Support",
        direction: "context",
        weight: 0.55,
        note: "Pilot literature flags USD/CNY as quantile-dependent driver (mixed sign). Liao et al. (2025) does not find strong direct effect on national CEA but combined with EUA spillover it amplifies cross-market arbitrage.",
        sources: [
          {
            label: "Liao et al. 2025 - PLoS ONE",
            url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
            accessed: today
          }
        ]
      },
      {
        id: "cn_q4_concentration",
        category: "Calendar Effects",
        variable: "Q4 compliance-window volume concentration",
        importance: "Core",
        direction: "higher",
        weight: 1.1,
        note: "MDPI Land (2025): Q4 2024 = 79% of annual volume (1,471 active entities). Compliance-window concentration is the dominant seasonality factor for national CEA.",
        sources: [
          {
            label: "MDPI Land 2025 - China ETS current situation",
            url: "https://www.mdpi.com/2073-445X/14/8/1582",
            accessed: today
          }
        ]
      }
    ]
  }
];

export const quantIndicators: QuantIndicator[] = [
  {
    id: "clean-spreads",
    name: "Clean Dark / Spark Spread",
    family: "Fuel Switching",
    bestFor: "EU ETS and any market tied to thermal dispatch economics",
    formula:
      "CDS = Power - CoalCost / Efficiency - Carbon * EmissionFactor, CSS = Power - GasCost / Efficiency - Carbon * EmissionFactor",
    whyItMatters:
      "It measures whether coal or gas is the marginal profitable generation source. That directly changes allowance demand in power-led systems.",
    requiredColumns: ["close", "power", "coal", "gas", "carbon"]
  },
  {
    id: "auction-signal",
    name: "Auction Cover and Supply Calendar",
    family: "Market Microstructure",
    bestFor: "EU ETS and K-ETS short-horizon execution",
    formula:
      "Cover ratio, clearing premium, announced auction volume, and next-auction schedule are treated as a supply shock bundle.",
    whyItMatters:
      "Auction cadence governs near-term float and liquidity. It is not enough for long-horizon valuation, but it matters for timing and slippage.",
    requiredColumns: ["close", "auction_cover", "auction_volume"]
  },
  {
    id: "compliance-seasonality",
    name: "Compliance Seasonality",
    family: "Calendar",
    bestFor: "K-ETS and EU ETS deadline windows",
    formula:
      "Binary or countdown features for verification filing, surrender deadline, and policy-review windows.",
    whyItMatters:
      "Recurring compliance windows create repeatable liquidity and demand patterns that often dominate otherwise weak signal days.",
    requiredColumns: ["close", "compliance_flag"]
  },
  {
    id: "relative-value",
    name: "Lead-Lag Relative Value",
    family: "StatArb",
    bestFor: "Cross-commodity or cross-market pairs",
    formula:
      "Z-score of residual from rolling regression between carbon and lead asset such as gas, power, coal, or industrial proxy.",
    whyItMatters:
      "Carbon often reacts with a lag to energy and macro shocks. Residual-based signals are useful for mean reversion and timing.",
    requiredColumns: ["close", "lead_asset"]
  },
  {
    id: "trend-regime",
    name: "Trend + Volatility Regime Filter",
    family: "Risk Control",
    bestFor: "All markets",
    formula:
      "Use long-window moving average slope, realized volatility, and drawdown state to disable fragile signals during disorderly regimes.",
    whyItMatters:
      "Carbon markets can gap on policy headlines. Regime filters reduce false positives and make position sizing defendable.",
    requiredColumns: ["close"]
  },
  {
    id: "open-interest-liquidity",
    name: "Open Interest / Volume / Participation Breadth",
    family: "Execution",
    bestFor: "EU ETS futures and maturing national markets",
    formula:
      "Track rolling changes in open interest, depth, turnover, and participation access rules.",
    whyItMatters:
      "A model can be directionally right and still fail if the market is too thin to execute efficiently.",
    requiredColumns: ["close", "volume"]
  }
];

export const benchmarkPlatforms: BenchmarkPlatform[] = [
  {
    id: "tradingview-lightweight-charts",
    name: "TradingView Lightweight Charts",
    category: "Open-source Chart Engine",
    strength:
      "Interactive financial charts with zoom, pan, crosshair, and multi-series overlays in a lightweight client bundle",
    differentiator:
      "Best reference for turning static trend panes into operator-grade interactive market charts",
    source: {
      label: "Lightweight Charts docs",
      url: "https://tradingview.github.io/lightweight-charts/",
      accessed: today
    },
    featuresToBorrow: [
      "Crosshair and price readout",
      "Zoom and pan interaction",
      "Multi-series comparison on one chart"
    ]
  },
  {
    id: "yahoo-finance-advanced-chart",
    name: "Yahoo Finance Advanced Chart",
    category: "Free Retail Chart UX",
    strength:
      "Fast date-range switching, chart scaling, and compare-symbol workflow on free market pages",
    differentiator:
      "Best reference for what a free comparison tape should feel like before adding paid data",
    source: {
      label: "Yahoo Finance chart help",
      url: "https://help.yahoo.com/kb/period-scale-screen-charts-yahoo-finance-web-sln28287.html",
      accessed: today
    },
    featuresToBorrow: [
      "1D to multi-month range toggles",
      "Wheel and pinch scale control",
      "Advanced chart behavior for free comparison feeds"
    ]
  },
  {
    id: "claude-desktop-cowork",
    name: "Claude Desktop / Cowork",
    category: "Desktop AI Workspace",
    strength:
      "Conversation-first assistant workspace with model selection near the composer, grouped styles and tools, and persistent threads",
    differentiator:
      "Best reference for making evidence briefings feel like a primary work surface instead of a settings sidebar",
    source: {
      label: "Anthropic release notes",
      url: "https://support.claude.com/en/articles/12138966-release-notes",
      accessed: today
    },
    featuresToBorrow: [
      "Conversation-first workspace",
      "Model selector close to the composer",
      "Grouped styles, tools, and persistent context"
    ]
  },
  {
    id: "openbb-workspace",
    name: "OpenBB Workspace",
    category: "Open-source Research Workspace",
    strength:
      "Dashboard canvas with multiple widgets, automatic refresh, sharing, and multi-window analytical layouts",
    differentiator:
      "Best reference for combining live widgets, AI workflows, and operator dashboards in one workspace",
    source: {
      label: "OpenBB Workspace dashboards",
      url: "https://docs.openbb.co/workspace/analysts/dashboards",
      accessed: today
    },
    featuresToBorrow: [
      "Widget canvas with refresh actions",
      "Shareable multi-panel dashboards",
      "AI and chart workflow on one surface"
    ]
  },
  {
    id: "clearblue-vantage",
    name: "ClearBlue Vantage",
    category: "Carbon Intelligence Platform",
    strength:
      "Aggregates, interprets, and visualizes carbon market and user data across pricing, supply-demand, policy, news, and scenario modules",
    differentiator:
      "Best reference for carbon-specific decision modules instead of generic equity-style dashboards",
    source: {
      label: "ClearBlue Vantage",
      url: "https://www.clearbluemarkets.com/vantage",
      accessed: today
    },
    featuresToBorrow: [
      "Current and historic pricing with policy context",
      "Scenario planning modules",
      "Carbon portfolio and position readout"
    ]
  },
  {
    id: "persefoni-accounting",
    name: "Persefoni",
    category: "Carbon accounting platform",
    strength:
      "Scope 1-3 emissions coverage, audit-grade accounting workflow, and disclosure-ready reporting tied to the GHG Protocol.",
    differentiator:
      "Best reference for turning fragmented activity data into one auditable emissions inventory and reporting spine.",
    source: {
      label: "Persefoni carbon accounting platform",
      url: "https://www.persefoni.com/business/carbon-footprint-measurement-analytics",
      accessed: today
    },
    featuresToBorrow: [
      "Scope 1-3 inventory framing",
      "Audit-trail mindset for calculations",
      "Disclosure-ready reporting flow"
    ]
  },
  {
    id: "watershed-platform",
    name: "Watershed",
    category: "Enterprise sustainability platform",
    strength:
      "Supply-chain engagement, emissions measurement, reporting automation, and reduction planning in one sustainability workspace.",
    differentiator:
      "Best benchmark for connecting enterprise carbon accounting with supply-chain action and reporting speed.",
    source: {
      label: "Watershed platform",
      url: "https://watershed.com/",
      accessed: today
    },
    featuresToBorrow: [
      "Supply-chain engagement workflow",
      "Reporting automation across frameworks",
      "Reduction-planning lens beside the inventory"
    ]
  },
  {
    id: "normative-platform",
    name: "Normative",
    category: "Transparent accounting engine",
    strength:
      "High-granularity accounting engine with 349,000 emission factors, 100% calculation transparency, supplier engagement, and built-in Inbox and Tasks.",
    differentiator:
      "Best benchmark for turning factor transparency and team task management into a product surface rather than leaving them buried in spreadsheets.",
    source: {
      label: "Normative platform",
      url: "https://normative.io/platform/",
      accessed: latestReview
    },
    featuresToBorrow: [
      "Methodology and factor transparency",
      "Inbox and tasks for data collection",
      "Supplier engagement inside the reporting workflow"
    ]
  },
  {
    id: "greenly-platform",
    name: "Greenly",
    category: "All-in-one climate suite",
    strength:
      "Carbon accounting, product carbon footprint, ESG compliance, and AI-guided reporting in a user-friendly all-in-one sustainability suite.",
    differentiator:
      "Best benchmark for a faster, friendlier operator experience that still reaches disclosure and product-footprint workflows.",
    source: {
      label: "Greenly platform",
      url: "https://greenly.earth/en-us",
      accessed: latestReview
    },
    featuresToBorrow: [
      "User-friendly setup for non-specialists",
      "PCF and ESG workflows adjacent to carbon accounting",
      "Briefing-style guidance layered on operational tasks"
    ]
  },
  {
    id: "sweep-platform",
    name: "Sweep",
    category: "Enterprise carbon data platform",
    strength:
      "One data layer reused across frameworks, validation and governance controls, supplier-risk workflows, and ROI-oriented sustainability analytics.",
    differentiator:
      "Best benchmark for eliminating duplicate reporting work while keeping supplier workflows and business-performance framing visible.",
    source: {
      label: "Sweep platform",
      url: "https://www.sweep.net/",
      accessed: latestReview
    },
    featuresToBorrow: [
      "Upload once and reuse across frameworks",
      "Supplier-risk workflow",
      "Validation and governance controls"
    ]
  },
  {
    id: "plan-a-platform",
    name: "Plan A",
    category: "Certified carbon management platform",
    strength:
      "Certified measure-report-reduce workflow with reporting support, decarbonization actions, and forecasted emissions and cost views.",
    differentiator:
      "Best benchmark for connecting reporting readiness with decarbonization economics and future cost framing.",
    source: {
      label: "Plan A platform",
      url: "https://plana.earth/product",
      accessed: latestReview
    },
    featuresToBorrow: [
      "Certified reporting spine",
      "Decarbonization action and target framing",
      "Future cost and emissions scenario framing"
    ]
  },
  {
    id: "sinai-platform",
    name: "SINAI",
    category: "Industrial decarbonization platform",
    strength:
      "Equipment-level to enterprise-wide emissions tracking, collaborative data workflows, AI-enabled bulk inputs, and heavy-industry-ready granularity.",
    differentiator:
      "Best benchmark for the moment a carbon product has to move from high-level reporting into plant, asset, or procurement-level operational detail.",
    source: {
      label: "SINAI platform",
      url: "https://www.sinai.com/",
      accessed: latestReview
    },
    featuresToBorrow: [
      "Equipment-level granularity",
      "Collaborative data intake",
      "Industrial decision support"
    ]
  },
  {
    id: "patch-procurement",
    name: "Patch",
    category: "Carbon credit procurement platform",
    strength:
      "Project screening, portfolio sourcing, purchase records, retirement certificates, and disclosure support around carbon credits.",
    differentiator:
      "Best benchmark for procurement and retirement intelligence without needing to copy a broker or exchange workflow.",
    source: {
      label: "Patch purchase workflow",
      url: "https://www.patch.io/purchase",
      accessed: today
    },
    featuresToBorrow: [
      "Project screening and portfolio sourcing",
      "Disclosure-ready purchase records",
      "Retirement and fulfillment tracking"
    ]
  },
  {
    id: "eu-commission",
    name: "EU Commission Carbon Market Pages",
    category: "Official Market Structure",
    strength: "Authoritative ETS policy, scope, MSR, compliance, ETS2, and registry context",
    differentiator: "Best source for structural supply features and compliance-cycle facts",
    source: {
      label: "EU Commission - About the EU ETS",
      url: "https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en",
      accessed: today
    },
    featuresToBorrow: [
      "Official policy and phase timeline",
      "Supply-policy dashboard",
      "Registry and compliance references"
    ]
  },
  {
    id: "krx-ets",
    name: "KRX ETS Information Platform",
    category: "Official Trading Venue",
    strength:
      "Korean market price lookups, clearing rules, market participation, and offset system detail",
    differentiator: "Best reference for K-ETS workflow, participant model, and settlement design",
    source: {
      label: "KRX ETS platform",
      url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
      accessed: today
    },
    featuresToBorrow: [
      "Real-time market tape",
      "Auction and settlement details",
      "Offset market drill-down"
    ]
  },
  {
    id: "cets",
    name: "China National Carbon Trading Market Information Network",
    category: "Official Market Structure",
    strength: "National market disclosure hub for policy, knowledge, and research",
    differentiator: "Best anchor for Chinese policy-event tracking and disclosure feeds",
    source: {
      label: "cets.org.cn",
      url: "https://www.cets.org.cn",
      accessed: today
    },
    featuresToBorrow: [
      "Policy-event stream",
      "National market education and documentation",
      "Sector expansion timeline"
    ]
  },
  {
    id: "xpansiv-cbl",
    name: "Xpansiv CBL",
    category: "Execution and Market Data",
    strength: "Transparent order book, automated settlement, RFQ and OTC post-trade infrastructure",
    differentiator:
      "Strongest reference for institutional-grade environmental commodity execution design",
    source: {
      label: "Xpansiv CBL",
      url: "https://www.xpansiv.com/trading-platforms/cbl",
      accessed: today
    },
    featuresToBorrow: ["Order-book depth view", "Settlement workflow", "Product-level market data"]
  },
  {
    id: "sylvera",
    name: "Sylvera",
    category: "Analytics and Risk",
    strength: "Project-level ratings, policy and pricing insight, large searchable market dataset",
    differentiator: "Excellent model for risk-layer UX and project due-diligence presentation",
    source: {
      label: "Sylvera ratings and data",
      url: "https://www.sylvera.com/solutions",
      accessed: today
    },
    featuresToBorrow: [
      "Risk scoring layer",
      "Searchable project and asset filters",
      "High-integrity diligence framing"
    ]
  },
  {
    id: "bezero-carbon",
    name: "BeZero Carbon",
    category: "Ratings and portfolio risk",
    strength:
      "Independent project ratings, public methodologies, portfolio-risk framing, and information-availability controls for carbon credits.",
    differentiator:
      "Best benchmark for a transparent integrity layer that shows rating logic, watch state, and portfolio consequences together.",
    source: {
      label: "BeZero Carbon ratings",
      url: "https://bezerocarbon.com/products/ratings",
      accessed: today
    },
    featuresToBorrow: [
      "Rating summary with evidence boundaries",
      "Portfolio-level risk framing",
      "Information-availability watch logic"
    ]
  },
  {
    id: "allied-offsets",
    name: "AlliedOffsets",
    category: "Portfolio Analytics",
    strength:
      "Portfolio monitoring, pricing and retirement analysis, sector and region forecast scenarios",
    differentiator: "Useful reference for portfolio-level valuation and what-if analysis UX",
    source: {
      label: "AlliedOffsets portfolio monitoring",
      url: "https://alliedoffsets.com/monitor-tool/",
      accessed: today
    },
    featuresToBorrow: [
      "Portfolio monitor",
      "Scenario benchmarking",
      "Market-by-market forecast comparison"
    ]
  },
  {
    id: "carbon-insights",
    name: "Carbon Insights",
    category: "Signal Layer",
    strength: "AI-driven sentiment index focused on EU ETS news flow",
    differentiator:
      "Useful reference for headline-to-signal workflow and explainable sentiment monitoring",
    source: {
      label: "Carbon Pulse Index",
      url: "https://carboninsights.net/carbon-pulse-index",
      accessed: today
    },
    featuresToBorrow: [
      "Sentiment index",
      "Headline-linked signal explanation",
      "Backtested narrative signal layer"
    ]
  }
];

export const communitySignals = [
  {
    id: "guided-onboarding-support",
    lens: "Community buying signal",
    title: "Teams reward simple onboarding and fast support",
    summary:
      "Public reviews consistently praise user-friendly setup, clear support, and ERP or finance-system integrations more than exotic analytics.",
    cQuantMove:
      "Keep the first-run path lightweight, surface the next required input clearly, and treat briefing guidance like operational support instead of a hidden chatbot.",
    source: {
      label: "G2 - Greenly reviews",
      url: "https://www.g2.com/products/greenly/reviews",
      accessed: latestReview
    }
  },
  {
    id: "price-must-replace-manual-work",
    lens: "Community willingness to pay",
    title: "Buyers tolerate spend only when the tool replaces spreadsheet labor",
    summary:
      "Public buyer commentary shows price sensitivity rises quickly when teams still have to manually interpret modules, fix mappings, or chase the same data outside the product.",
    cQuantMove:
      "Make subscription value legible through workflow compression: one evidence pack, one source refresh chain, one briefing path, and one audit trail instead of duplicated work.",
    source: {
      label: "Capterra - Greenly reviews",
      url: "https://www.capterra.com/p/219931/Greenly-Climate-Dashboard/reviews/",
      accessed: latestReview
    }
  },
  {
    id: "scope3-proxy-distrust",
    lens: "Community trust risk",
    title: "Opaque spend-based Scope 3 estimates are distrusted",
    summary:
      "Practitioner discussions repeatedly warn that revenue-based Scope 3 estimates are weak when suppliers or physical-quantity data should exist, and that comparison across tools becomes unreliable.",
    cQuantMove:
      "Show whether a number is official, supplier-reported, activity-based, or proxy-estimated. Never blur primary evidence and proxy factors into one confidence read.",
    source: {
      label: "Reddit - Scope 3 Reporting Issues & Concerns",
      url: "https://www.reddit.com/r/lifecycleassessment/comments/18dnkt3/scope_3_reporting_issues_concerns/",
      accessed: latestReview
    }
  },
  {
    id: "data-collection-bottleneck",
    lens: "Operator pain point",
    title: "Data collection is still the real bottleneck",
    summary:
      "Community feedback keeps pointing to Scope 3 collection, supplier follow-up, and fragmented source systems as the hardest part of carbon software adoption.",
    cQuantMove:
      "Keep input readiness, missing fields, supplier follow-up, and factor provenance visible next to the market desk so the operator sees what is decision-grade and what is not.",
    source: {
      label: "Reddit - Carbon Accounting Pain Points",
      url: "https://www.reddit.com/r/carbonaccounting/comments/1h8x0ng/carbon_accounting_pain_points/",
      accessed: latestReview
    }
  }
];

export const productRequirements = [
  "Market intelligence workspace covering EU ETS, K-ETS, and China ETS on one operating surface.",
  "Carbon accounting sidecar that keeps Scope 1-3 logic, factor provenance, and disclosure framing visible next to market views.",
  "Verification layer that connects registry status, document freshness, ratings context, and retirement trace before a user leans on a credit.",
  "Procurement intelligence that supports screening and retirement planning without executing trades or intermediating orders.",
  "Evidence briefing layer that turns official anchors, comparison tapes, and driver checks into bounded research notes.",
  "Signal layer combining structural drivers, scenario controls, and uncertainty-aware outputs.",
  "Risk layer for policy events, liquidity deterioration, missing data, and market-structure breaks.",
  "Desktop-first workflow with local research access, source freshness, and future connector support without implying execution."
];
