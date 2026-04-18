import type {
  BenchmarkPlatform,
  MarketProfile,
  QuantIndicator
} from "../types";

const today = "2026-04-08";

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
        note:
          "Structural tightening in the EU ETS changes forward scarcity and anchors medium-term price expectations.",
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
        note:
          "Higher surplus weakens scarcity; tighter MSR withdrawals reduce auction supply and support price.",
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
        note:
          "Electricity price strength changes thermal dispatch profitability and allowance demand.",
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
        note:
          "Gas moves the clean spark spread and fuel-switch economics; sign can vary with concurrent power and coal moves, so it must be modelled jointly.",
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
        note:
          "Coal matters through coal-to-gas dispatch switching and dark spread economics.",
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
        note:
          "Oil is usually a secondary macro-energy proxy rather than the first dispatch signal, but it remains informative across commodity regimes.",
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
        note:
          "Recent work shows that financial fluctuations became more important in Phase 4, especially under crisis regimes.",
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
        note:
          "Industrial output changes compliance demand from covered sectors beyond power generation.",
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
        note:
          "Weather changes power demand and renewable output, which feeds thermal generation and EUA demand.",
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
        note:
          "Auction rhythm and derivatives positioning matter for short-horizon execution and slippage control.",
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
        note:
          "Compliance seasonality can create recurring liquidity and short-term demand patterns.",
        sources: [
          {
            label: "EU Commission - ETS Reporting Tool and compliance cycle",
            url: "https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/monitoring-reporting-and-verification/ets-reporting-tool-ert_en",
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
        note:
          "Scarcity depends on the cap, sector grouping, and how much supply is auctioned versus freely allocated.",
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
        note:
          "The 2026-2035 basic plan introduces automatic stabilization, which directly changes supply-demand adjustment expectations.",
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
        note:
          "Relaxed carryover changes intertemporal scarcity and softens forced selling near compliance windows.",
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
        note:
          "Local research shows complementary credit prices and volumes became statistically significant as the market matured.",
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
        note:
          "The compliance filing calendar is one of the few variables shown as significant across commitment periods in Korean literature.",
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
        note:
          "Liquidity reforms in February 2025 changed who can participate and how orders reach the market.",
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
        note:
          "Oil acts as an external energy-cost proxy; its explanatory power rises after the market matures and policy frictions ease.",
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
        note:
          "Local evidence indicates that exchange rate and interest-rate conditions become significant once the market internalizes trading experience.",
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
        note:
          "A useful secondary proxy for industrial cycle and compliance purchasing capacity.",
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
        note:
          "Auction design now reacts to prior-month bid ratios, so auction coverage becomes a live microstructure signal.",
        sources: [
          {
            label: "ICAP - auction volume linked to prior bid ratio",
            url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
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
        note:
          "Coverage expansion mechanically changes compliance demand and strengthens national price discovery.",
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
        note:
          "China's national ETS is still anchored in the power sector, so electricity-market reform directly affects carbon demand transmission.",
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
        note:
          "Coal remains the key fuel anchor. Long-term cointegration with carbon price is documented, though short-run effects can be weak or regime-specific.",
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
        note:
          "Gas is a cleaner substitute fuel and enters both macro and dispatch channels in China's carbon pricing studies.",
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
        note:
          "In a still-maturing market, price discovery is more fragile and volume carries extra information about regime strength.",
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
        note:
          "Allocation intensity settings and reporting quality are part of the core policy architecture and can dominate observed scarcity.",
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
        note:
          "Environmental stress can proxy policy urgency and energy-structure pressure in Chinese empirical work.",
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
        note:
          "Industrial cycle filters can help separate economic activity shocks from pure policy shocks.",
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
        note:
          "Reporting and verification quality affects the credibility of scarcity itself, not just noise around it.",
        sources: [
          {
            label: "MEE progress report - data quality as fundamental task",
            url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
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
    strength: "Interactive financial charts with zoom, pan, crosshair, and multi-series overlays in a lightweight client bundle",
    differentiator: "Best reference for turning static trend panes into operator-grade interactive market charts",
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
    strength: "Fast date-range switching, chart scaling, and compare-symbol workflow on free market pages",
    differentiator: "Best reference for what a free comparison tape should feel like before adding paid data",
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
    strength: "Conversation-first assistant workspace with model selection near the composer, grouped styles and tools, and persistent threads",
    differentiator: "Best reference for making the local copilot feel like a primary work surface instead of a settings sidebar",
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
    strength: "Dashboard canvas with multiple widgets, automatic refresh, sharing, and multi-window analytical layouts",
    differentiator: "Best reference for combining live widgets, AI workflows, and operator dashboards in one workspace",
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
    strength: "Aggregates, interprets, and visualizes carbon market and user data across pricing, supply-demand, policy, news, and scenario modules",
    differentiator: "Best reference for carbon-specific decision modules instead of generic equity-style dashboards",
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
    strength: "Korean market price lookups, clearing rules, market participation, and offset system detail",
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
    differentiator: "Strongest reference for institutional-grade environmental commodity execution design",
    source: {
      label: "Xpansiv CBL",
      url: "https://www.xpansiv.com/trading-platforms/cbl",
      accessed: today
    },
    featuresToBorrow: [
      "Order-book depth view",
      "Settlement workflow",
      "Product-level market data"
    ]
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
    strength: "Portfolio monitoring, pricing and retirement analysis, sector and region forecast scenarios",
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
    differentiator: "Useful reference for headline-to-signal workflow and explainable sentiment monitoring",
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

export const productRequirements = [
  "Market intelligence workspace covering EU ETS, K-ETS, and China ETS on one operating surface.",
  "Carbon accounting sidecar that keeps Scope 1-3 logic, factor provenance, and disclosure framing visible next to market views.",
  "Verification layer that connects registry status, document freshness, ratings context, and retirement trace before a user leans on a credit.",
  "Procurement intelligence that supports screening and retirement planning without executing trades or intermediating orders.",
  "Conversation-first copilot with local model, grounded evidence, and configurable response style.",
  "Signal layer combining structural drivers, scenario controls, and uncertainty-aware outputs.",
  "Risk layer for policy events, liquidity deterioration, missing data, and market-structure breaks.",
  "Desktop-first workflow with local research access, source freshness, and future connector support without implying execution."
];
