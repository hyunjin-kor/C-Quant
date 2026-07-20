import type { ResearchPaper } from "../types";

const reviewedAt = "2026-05-04";

/**
 * Research catalogue.
 *
 * Strict citation hygiene:
 * - Every entry has a verified URL (the catalogue assistant fetched each
 *   page or aggregator listing before adding the paper).
 * - Quantitative anchors are reproduced as the paper reports them, not
 *   guessed. Operators must verify the original PDF before quoting any
 *   single number in regulated reporting.
 * - One retracted paper (Song 2024, PLoS ONE, retracted Sept 2025) is
 *   intentionally excluded; if you find it referenced elsewhere, do not
 *   re-add it.
 *
 * Coverage as of 2026-05-04:
 * - K-ETS: 12 papers
 * - China national / pilots: 10 papers
 * - EU ETS: appended as the EU literature survey lands
 *
 * Each entry maps the paper's variables to existing C-Quant driver IDs
 * where possible; unmapped variables surface in the gap analysis at
 * `src/data/driverGaps.ts`.
 */
export const researchCatalogue: ResearchPaper[] = [
  // ── K-ETS ────────────────────────────────────────────────────────────────
  {
    id: "park-lee-2021-firm-trading-decision",
    markets: ["k-ets"],
    citation:
      "Park & Lee (2021). Factors determining firms' trading decision in the Korea ETS market. Environmental Economics and Policy Studies, 23(3), 557–580.",
    authors: ["Hyemin Park", "Minkyung Lee"],
    year: 2021,
    venue: "Environmental Economics and Policy Studies",
    url: "https://link.springer.com/article/10.1007/s10018-020-00281-8",
    kind: "peer-reviewed",
    finding:
      "Firms perceiving K-ETS as a burden, trusting policy continuity, and forecasting price increases tend to bank rather than trade. Larger free-allowance recipients trade more (transaction-cost economies of scale). Banking volumes outweighed trading volumes in Phase 1.",
    variables: [
      {
        variableLabel: "Free allowance share",
        driverId: "kr_allowance_balance",
        expectedSign: "context",
        samplePeriod: "2015–2017"
      },
      {
        variableLabel: "Banking decision (firm-level)",
        driverId: "kr_banking",
        expectedSign: "context",
        samplePeriod: "2015–2017"
      }
    ],
    dataSources: [
      {
        label: "K-ETS firm-level survey + KAU price tape",
        url: "https://link.springer.com/article/10.1007/s10018-020-00281-8",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "etienne-yu-2017-otc-illiquid",
    markets: ["k-ets"],
    citation:
      "Etienne & Yu (2017). Inverse price spread and illiquid trading in Korea-ETS. Carbon Management, 8(2).",
    authors: ["Xiaoli L. Etienne", "Jongmin Yu"],
    year: 2017,
    venue: "Carbon Management",
    url: "https://www.tandfonline.com/doi/full/10.1080/17583004.2017.1309205",
    kind: "peer-reviewed",
    finding:
      "Korean offset credits (KOCs) traded at a sustained premium on OTC vs exchange-listed KAUs — an inverse spread to conventional wisdom. Limited counterparties + higher OTC price jointly suppressed exchange liquidity.",
    variables: [
      {
        variableLabel: "OTC – exchange spread (KOC vs KAU)",
        expectedSign: "context",
        samplePeriod: "2015–2016"
      }
    ],
    dataSources: [
      {
        label: "KRX KAU exchange + KOC OTC tape",
        url: "https://www.tandfonline.com/doi/full/10.1080/17583004.2017.1309205",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "kim-yu-2018-penalty-system",
    markets: ["k-ets"],
    citation:
      "Kim & Yu (2018). The effect of the penalty system on market prices in the Korea ETS. Carbon Management, 9(2).",
    authors: ["Kim", "Yu"],
    year: 2018,
    venue: "Carbon Management",
    url: "https://www.tandfonline.com/doi/full/10.1080/17583004.2018.1440852",
    kind: "peer-reviewed",
    finding:
      "Korea's penalty rate is 3× average market price, capped at KRW 100,000/tCO₂e. Analytical model shows the multiplier — not the cap — drives equilibrium prices, acting as a soft ceiling.",
    variables: [
      {
        variableLabel: "Penalty multiplier (3× rolling average)",
        expectedSign: "+",
        quantitativeAnchor: "Penalty = 3 × average market price; cap KRW 100,000/tCO₂e",
        samplePeriod: "Analytical model"
      }
    ],
    dataSources: [
      {
        label: "K-ETS penalty rule (legal text)",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "jun-kim-oh-2021-phase1-impact",
    markets: ["k-ets"],
    citation:
      "Jun, Kim & Oh (2021). Evaluating the impact of the K-ETS on GHG reduction in the first phase. Environmental Economics and Policy Studies, 23, 613–638.",
    authors: ["Sang-Hoon Jun", "J.Y. Kim", "Hyungna Oh"],
    year: 2021,
    venue: "Environmental Economics and Policy Studies",
    url: "https://link.springer.com/article/10.1007/s10018-021-00302-0",
    kind: "peer-reviewed",
    finding:
      "K-ETS Phase 1 improved carbon intensity in manufacturing & buildings but not in power. The 'reduction burden' (expected emissions ÷ free allocation) is the strongest determinant of intensity response.",
    variables: [
      {
        variableLabel: "Allocation tightness ratio (expected emissions / free allowance)",
        expectedSign: "+",
        samplePeriod: "2015–2017"
      }
    ],
    dataSources: [
      {
        label: "Korean Greenhouse Gas Inventory + K-ETS allocation tables",
        url: "https://link.springer.com/article/10.1007/s10018-021-00302-0",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "park-2024-firm-value",
    markets: ["k-ets"],
    citation:
      "Park (2024). Effects of carbon emissions trading on profitability and value: Evidence from Korean listed firms. JIFMA, 35.",
    authors: ["Park"],
    year: 2024,
    venue: "Journal of International Financial Management & Accounting",
    url: "https://onlinelibrary.wiley.com/doi/full/10.1111/jifm.12211",
    kind: "peer-reviewed",
    finding:
      "Systematic risk from KAU price uncertainty depresses long-term firm value of liable firms. Allowance-price volatility itself is a transmission channel into KOSPI liable-firm cohort.",
    variables: [
      {
        variableLabel: "KAU price volatility → KOSPI liable-firm value",
        driverId: "kr_equities",
        expectedSign: "-"
      }
    ],
    dataSources: [
      {
        label: "KOSPI liable-firm panel + KAU price",
        url: "https://onlinelibrary.wiley.com/doi/full/10.1111/jifm.12211",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "o-miteva-lee-2023-impact-listed",
    markets: ["k-ets"],
    citation:
      "O, Miteva & Lee (2023). Impact of Korea's emissions trading scheme on publicly traded firms. PLoS ONE, 18(5), e0285863.",
    authors: ["Nyonho O", "Daniela A. Miteva", "Yehchan Lee"],
    year: 2023,
    venue: "PLoS ONE",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0285863",
    kind: "peer-reviewed",
    finding:
      "Total emissions actually rose ~6% under K-ETS vs. prior Target Management baseline (2011–2017 panel of 205 firms, DiD + PSM + synthetic DiD). Energy intensity improved; largest emitters drove the result; low non-compliance because firms used permits/banking rather than abating.",
    variables: [
      {
        variableLabel: "Total emissions vs. baseline",
        expectedSign: "context",
        quantitativeAnchor: "+6% emissions vs. Target Management baseline",
        samplePeriod: "2011–2017"
      }
    ],
    dataSources: [
      {
        label: "PMC mirror",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10208515/",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "yim-2024-efficiency-early-stage",
    markets: ["k-ets"],
    citation:
      "Yim et al. (2024). Efficiency in the Early Stages of Carbon Markets: The Case of K-ETS. Emerging Markets Finance and Trade.",
    authors: ["Yim", "et al."],
    year: 2024,
    venue: "Emerging Markets Finance and Trade",
    url: "https://www.tandfonline.com/doi/full/10.1080/1540496X.2024.2379460",
    kind: "peer-reviewed",
    finding:
      "Time-varying Hurst exponent oscillates around 0.5 (random walk) before constrained-banking interventions; afterward it diverges, indicating constrained-banking periods alter informational efficiency. Temporary liquidity measures do not guarantee informational efficiency.",
    variables: [
      {
        variableLabel: "Banking-rule regime breaks",
        driverId: "kr_banking",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "KRX KAU daily series",
        url: "https://www.tandfonline.com/doi/full/10.1080/1540496X.2024.2379460",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "moon-lee-kim-kim-2019-fair-value",
    markets: ["k-ets"],
    citation:
      "Moon, Lee, Kim & Kim (2019). An Estimation of Market-Based Carbon-Emission Prices Using Comparative Analogy: A Korean Case. Energy Journal, 40(SI1).",
    authors: ["Saedaseul Moon", "Deok-Joo Lee", "Taegu Kim", "Kyung-Taek Kim"],
    year: 2019,
    venue: "Energy Journal",
    url: "https://journals.sagepub.com/doi/10.5547/01956574.40.SI1.smoo",
    kind: "peer-reviewed",
    finding:
      "Provides a theoretical KAU 'fair value' range via comparative analogy with EU ETS fundamentals.",
    variables: [
      {
        variableLabel: "Fair-value anchor for KAU",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "EU ETS + Korean energy data",
        url: "https://journals.sagepub.com/doi/10.5547/01956574.40.SI1.smoo",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "exploratory",
    openAccess: false,
    reviewedAt
  },
  {
    id: "kets-predictive-comparison-2022",
    markets: ["k-ets"],
    citation:
      "Performance Comparison of Predictive Methodologies for Carbon Emission Credit Price in K-ETS (2022). Sustainability, 14(13), 8177.",
    authors: ["MDPI authors"],
    year: 2022,
    venue: "Sustainability (MDPI)",
    url: "https://www.mdpi.com/2071-1050/14/13/8177",
    kind: "peer-reviewed",
    finding:
      "MRA + ARIMA on KAU shows search-query interest carries leading signal beyond coal/oil. Supports adding attention/sentiment as a leading driver.",
    variables: [
      {
        variableLabel: "Search-query interest (Naver/Google trends)",
        expectedSign: "+",
        samplePeriod: "K-ETS Phase 1–2"
      }
    ],
    dataSources: [
      {
        label: "Naver / Google trends + KAU close",
        url: "https://www.mdpi.com/2071-1050/14/13/8177",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "exploratory",
    openAccess: true,
    reviewedAt
  },
  {
    id: "park-park-lee-choi-2025-operational-review",
    markets: ["k-ets"],
    citation:
      "Park, Park, Lee & Choi (2025). A review of the operational results of the K-ETS (2015–2024). Energy and Climate Management, 1(4).",
    authors: ["Park", "Park", "Lee", "Choi"],
    year: 2025,
    venue: "Energy and Climate Management (Sciopen)",
    url: "https://www.sciopen.com/article/10.26599/ECM.2025.9400025",
    kind: "official-report",
    finding:
      "Most comprehensive single-source operational review of K-ETS Phases 1–3. Reports 73.5% national GHG coverage in Phase 3.",
    variables: [
      {
        variableLabel: "National GHG coverage by K-ETS",
        expectedSign: "context",
        quantitativeAnchor: "73.5% of national GHG in Phase 3"
      }
    ],
    dataSources: [
      {
        label: "K-ETS operational data 2015–2024",
        url: "https://www.sciopen.com/article/10.26599/ECM.2025.9400025",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "tan-wang-choi-lee-2024-tariff-insulation",
    markets: ["k-ets"],
    citation:
      "Tan, Wang, Choi & Lee (2024). Does Korea's carbon emissions trading scheme enhance efficiency for sustainable energy and utilities? Utilities Policy, 88.",
    authors: ["Xiujie Tan", "Rui Wang", "Yongrok Choi", "Hyoungsuk Lee"],
    year: 2024,
    venue: "Utilities Policy",
    url: "https://www.sciencedirect.com/science/article/abs/pii/S0957178724000456",
    kind: "peer-reviewed",
    finding:
      "Korea's regulated electricity price prevents carbon-cost pass-through; government subsidies offset compliance costs for power producers, dampening price-signal transmission. Critical channel for the K-ETS power-tariff insulation flag.",
    variables: [
      {
        variableLabel: "KEPCO tariff freeze (regime variable)",
        expectedSign: "-"
      }
    ],
    dataSources: [
      {
        label: "KEPCO tariff schedule + K-ETS price",
        url: "https://www.sciencedirect.com/science/article/abs/pii/S0957178724000456",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "carbon-pricing-electricity-constraints-2024",
    markets: ["k-ets"],
    citation: "Carbon pricing under electricity market constraints (2024). Climate Policy.",
    authors: ["multiple"],
    year: 2024,
    venue: "Climate Policy (Taylor & Francis)",
    url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2024.2394508",
    kind: "peer-reviewed",
    finding:
      "Carbon pricing disrupts state–consumer rent transfers in Korea's electricity sector; political resistance arises in fossil-heavy, regulated tariff regimes. Policy-risk driver for K-ETS Phase 4 transition.",
    variables: [
      {
        variableLabel: "Political-resistance index (regulated-tariff regimes)",
        expectedSign: "-"
      }
    ],
    dataSources: [
      {
        label: "Korean electricity tariff + carbon-cost analysis",
        url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2024.2394508",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },

  // ── China ETS ────────────────────────────────────────────────────────────
  {
    id: "wen-zhao-zhao-yin-2022-pilot-dynamics",
    markets: ["cn-ets"],
    citation:
      "Wen, Zhao, Zhao & Yin (2022). What drive carbon price dynamics in China? International Review of Financial Analysis, 79.",
    authors: ["Fenghua Wen", "Haocen Zhao", "Lili Zhao", "Hua Yin"],
    year: 2022,
    venue: "International Review of Financial Analysis",
    url: "https://www.sciencedirect.com/science/article/abs/pii/S1057521921003148",
    kind: "peer-reviewed",
    finding:
      "Diebold–Yilmaz dynamic connectedness across China pilots: Guangdong → market sentiment dominates; Hubei → electric power index dominates; Shenzhen → air quality dominates. Confirms region-specific driver families.",
    variables: [
      {
        variableLabel: "Pilot-specific dominant driver (sentiment / power / AQI)",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "China pilot exchanges + market sentiment + power index + AQI",
        url: "https://ideas.repec.org/a/eee/finana/v79y2022ics1057521921003148.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "chen-zhang-2022-shenzhen-mechanism",
    markets: ["cn-ets"],
    citation:
      "Chen & Zhang (2022). Effect Mechanism Research of Carbon Price Drivers in China — A Case Study of Shenzhen. IJERPH.",
    authors: ["Jiongwen Chen", "Jinsuo Zhang"],
    year: 2022,
    venue: "International Journal of Environmental Research and Public Health",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9517840/",
    kind: "peer-reviewed",
    finding:
      "Ridge regression on Shenzhen pilot: CER price +1% → +17.9% Shenzhen carbon (largest single factor). ARA coal, Brent, Qinhuangdao coal, Pacific oil all negative. CSI industrial index positive. Temperature and AQI not significant in this sample.",
    variables: [
      {
        variableLabel: "CER price",
        expectedSign: "+",
        quantitativeAnchor: "+1% CER → +17.9% Shenzhen carbon",
        samplePeriod: "Sept 2013 – Mar 2021"
      },
      {
        variableLabel: "Coal / oil prices",
        driverId: "cn_coal",
        expectedSign: "-",
        quantitativeAnchor: "−0.2% to −0.26% per 1%"
      },
      {
        variableLabel: "CSI industrial index",
        driverId: "cn_industry_index",
        expectedSign: "+"
      }
    ],
    dataSources: [
      {
        label: "Shenzhen pilot price + ARA/Qinhuangdao/Brent + CSI industrial",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9517840/",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "shi-zeng-zhi-na-cheng-2022-svar-shenzhen",
    markets: ["cn-ets"],
    citation:
      "Shi, Zeng, Zhi, Na & Cheng (2022). Response of carbon emission rights price to energy price, macroeconomy and weather. ESPR.",
    authors: ["Changfeng Shi", "Qingshun Zeng", "Jiaqi Zhi", "Xiaohong Na", "Shufang Cheng"],
    year: 2022,
    venue: "Environmental Science and Pollution Research",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9741706/",
    kind: "peer-reviewed",
    finding:
      "SVAR + impulse response on Shenzhen pilot 2018–2022: crude oil +0.41%, natural gas +0.63%, coal −0.68%, HS300 −0.95%, temperature negligible. Carbon price mainly driven by own history; energy > macro > weather.",
    variables: [
      {
        variableLabel: "Crude oil",
        expectedSign: "+",
        quantitativeAnchor: "Impulse-response peak +0.41%"
      },
      {
        variableLabel: "Natural gas",
        driverId: "cn_lng",
        expectedSign: "+",
        quantitativeAnchor: "+0.63%"
      },
      {
        variableLabel: "Coal",
        driverId: "cn_coal",
        expectedSign: "-",
        quantitativeAnchor: "−0.68%"
      },
      {
        variableLabel: "HS300",
        expectedSign: "-",
        quantitativeAnchor: "−0.95%"
      }
    ],
    dataSources: [
      {
        label: "Shenzhen pilot + WTI/Brent + LNG + HS300 + temperature",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9741706/",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "liao-2025-national-cea-vec",
    markets: ["cn-ets"],
    citation:
      "Liao, Long, Tian, Bi, Tian, Li & Ge (2025). A study on factors influencing the national carbon emission trading price in China. PLoS ONE.",
    authors: ["Liao", "Long", "Tian", "Bi", "Tian", "Li", "Ge"],
    year: 2025,
    venue: "PLoS ONE",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
    kind: "peer-reviewed",
    finding:
      "Vector Error Correction on national CEA 2021–2024 (760 daily obs). Long-run elasticities (1% shock → CEA): coal −1.448%, power-industry index +1.195%, power-sector emissions −0.757%, EU EUA −0.368%, natural gas +0.336%, oil +0.465%, CEA volume +0.063%. Variance decomposition at horizon 18: own price 86.0%, volume 10.7%, power-industry index 1.25%, all others <2%.",
    variables: [
      {
        variableLabel: "Coal price",
        driverId: "cn_coal",
        expectedSign: "-",
        quantitativeAnchor: "Long-run elasticity −1.448%"
      },
      {
        variableLabel: "Power-industry equity index",
        expectedSign: "+",
        quantitativeAnchor: "+1.195%"
      },
      {
        variableLabel: "Power-sector emissions (Carbon Monitor)",
        expectedSign: "-",
        quantitativeAnchor: "−0.757%"
      },
      {
        variableLabel: "EU EUA spillover",
        expectedSign: "-",
        quantitativeAnchor: "−0.368%"
      },
      {
        variableLabel: "Natural gas",
        driverId: "cn_lng",
        expectedSign: "+",
        quantitativeAnchor: "+0.336%"
      },
      {
        variableLabel: "Oil",
        expectedSign: "+",
        quantitativeAnchor: "+0.465%"
      },
      {
        variableLabel: "CEA trading volume",
        driverId: "cn_volume",
        expectedSign: "+",
        quantitativeAnchor: "+0.063%"
      }
    ],
    dataSources: [
      {
        label: "CSMAR / Wind / Tonghuashun iFinD / Carbon Monitor",
        url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0333788",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "xiao-2022-pilot-spillover",
    markets: ["cn-ets"],
    citation:
      "Xiao, Ma, Sun, Ren, Feng & Cui (2022). Time-varying spillovers among pilot carbon emission trading markets in China. ESPR.",
    authors: ["Xiao", "Ma", "Sun", "Ren", "Feng", "Cui"],
    year: 2022,
    venue: "Environmental Science and Pollution Research",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8961101/",
    kind: "peer-reviewed",
    finding:
      "TVP-VAR Diebold–Yilmaz across pilots 2014–2020. Beijing & Chongqing dominant net spillover transmitters; Guangdong & Tianjin net receivers; total system spillover ~54%.",
    variables: [
      {
        variableLabel: "Pilot-to-pilot transmission (Beijing/Chongqing → others)",
        expectedSign: "context",
        quantitativeAnchor: "Total system connectedness ~54%"
      }
    ],
    dataSources: [
      {
        label:
          "Beijing / Chongqing / Guangdong / Tianjin / Hubei / Shenzhen / Shanghai pilot exchanges",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8961101/",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "dong-yuan-wei-asymmetric",
    markets: ["cn-ets"],
    citation:
      "Dong, Yuan & Wei. Asymmetric connectedness between China's carbon and energy markets (TVP-VAR). JUSTC.",
    authors: ["Dong", "Yuan", "Wei"],
    year: 2023,
    venue: "JUSTC (USTC)",
    url: "https://just.ustc.edu.cn/en/article/doi/10.52396/JUSTC-2022-0144",
    kind: "peer-reviewed",
    finding:
      "Hubei & Shenzhen pilots transmit net spillovers to energy futures. Spillover is asymmetric — stronger when carbon prices rise than when they fall. Justifies regime-dependent (asymmetric) carbon→energy linkages.",
    variables: [
      {
        variableLabel: "Carbon→energy asymmetric spillover",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "Hubei + Shenzhen pilot prices + Chinese energy futures",
        url: "https://just.ustc.edu.cn/en/article/doi/10.52396/JUSTC-2022-0144",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "he-2023-china-stress-index",
    markets: ["cn-ets"],
    citation:
      "He, He, Xia, Chen & Zhong (2023). Has China's carbon market stress released? National vs pilot carbon-market stress. ESPR.",
    authors: ["He", "He", "Xia", "Chen", "Zhong"],
    year: 2023,
    venue: "Environmental Science and Pollution Research",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10182358/",
    kind: "peer-reviewed",
    finding:
      "Functional Data Analysis + CRITIC weighting → China Carbon Market Stress Index (CCMSI) ranges 0.32–0.49 with W shape. Trading-stress and abatement-stress dominate. Hubei & Guangdong show lower stress; Beijing/Shenzhen/Shanghai higher.",
    variables: [
      {
        variableLabel: "China Carbon Market Stress Index (CCMSI)",
        expectedSign: "context",
        quantitativeAnchor: "CCMSI range 0.32–0.49 (2014–2021)"
      }
    ],
    dataSources: [
      {
        label: "Pilot exchange data + functional analysis methodology",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10182358/",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "wang-2022-china-first-cycle",
    markets: ["cn-ets"],
    citation:
      "Wang et al. (2022). First compliance cycle of China's National ETS: insights and implications. Carbon Neutrality (Springer).",
    authors: ["Wang", "et al."],
    year: 2022,
    venue: "Carbon Neutrality (Springer)",
    url: "https://link.springer.com/article/10.1007/s43979-022-00035-3",
    kind: "peer-reviewed",
    finding:
      "First two-year compliance cycle 2019–2021. Trading concentrated near surrender deadline (compliance-driven seasonality). 5% CCER offset cap enforced.",
    variables: [
      {
        variableLabel: "Compliance-window concentration (Q4)",
        expectedSign: "+"
      },
      {
        variableLabel: "CCER offset utilisation cap",
        expectedSign: "context",
        quantitativeAnchor: "5% of compliance volume"
      }
    ],
    dataSources: [
      {
        label: "SHEEX national CEA + CCER data 2019–2021",
        url: "https://link.springer.com/article/10.1007/s43979-022-00035-3",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "law-fong-2025-comparative",
    markets: ["cn-ets", "k-ets"],
    citation:
      "Law & Fong (2025). Emerging Markets' Carbon Pricing Development: Comparative Analysis of China and South Korea. World (MDPI), 6(2), 58.",
    authors: ["Law", "Fong"],
    year: 2025,
    venue: "World (MDPI)",
    url: "https://www.mdpi.com/2673-4060/6/2/58",
    kind: "peer-reviewed",
    finding:
      "Comparative legal/policy analysis of K-ETS and China ETS via FASTER framework with 2015–2023 market data. Direct cross-Asian benchmark.",
    variables: [
      {
        variableLabel: "Comparative policy maturity (FASTER framework)",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "World Bank FASTER framework + KAU/CEA price data",
        url: "https://www.mdpi.com/2673-4060/6/2/58",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "land-2025-china-current-situation",
    markets: ["cn-ets"],
    citation:
      "China's Carbon Emissions Trading Market: Current Situation, Impact, Challenges and Suggestions (2025). Land (MDPI), 14(8), 1582.",
    authors: ["MDPI Land authors"],
    year: 2025,
    venue: "Land (MDPI)",
    url: "https://www.mdpi.com/2073-445X/14/8/1582",
    kind: "peer-reviewed",
    finding:
      "Quantitative anchors for compliance-window seasonality: 2024 CEA average ~98 yuan; Q4 2024 = 79% of annual volume; record high RMB 104.5 in Nov 2024; 1,471 entities active in 2024.",
    variables: [
      {
        variableLabel: "Q4 compliance-window volume share",
        expectedSign: "+",
        quantitativeAnchor: "Q4 2024 = 79% of annual volume"
      },
      {
        variableLabel: "Active liable entities",
        expectedSign: "context",
        quantitativeAnchor: "1,471 entities in 2024"
      }
    ],
    dataSources: [
      {
        label: "SHEEX 2024 statistics + ICAP factsheet",
        url: "https://www.mdpi.com/2073-445X/14/8/1582",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },

  // ── EU ETS ───────────────────────────────────────────────────────────────
  {
    id: "mansanet-bataller-2007-co2-energy-weather",
    markets: ["eu-ets"],
    citation:
      "Mansanet-Bataller, Pardo & Valor (2007). CO₂ Prices, Energy and Weather. The Energy Journal, 28(3), 73–92.",
    authors: ["Mansanet-Bataller", "Pardo", "Valor"],
    year: 2007,
    venue: "The Energy Journal",
    url: "https://journals.sagepub.com/doi/10.5547/issn0195-6574-ej-vol28-no3-5",
    kind: "peer-reviewed",
    finding:
      "Phase I (2005–2007) daily EUA futures: lagged Brent and natural gas + extreme temperature significantly explain prices; coal-gas spread (clean dark/spark) drives CO₂ futures.",
    variables: [
      { variableLabel: "Brent (lagged)", driverId: "eu_oil", expectedSign: "+" },
      { variableLabel: "Natural gas (lagged)", driverId: "eu_gas", expectedSign: "+" },
      { variableLabel: "Extreme temperature", driverId: "eu_weather", expectedSign: "context" },
      { variableLabel: "Coal-gas (clean dark/spark) spread", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "EUA futures + Brent + NBP gas + temperature anomaly",
        url: "https://journals.sagepub.com/doi/10.5547/issn0195-6574-ej-vol28-no3-5",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "hintermann-2010-phase1-drivers",
    markets: ["eu-ets"],
    citation:
      "Hintermann (2010). Allowance price drivers in the first phase of the EU ETS. Journal of Environmental Economics and Management, 59(1), 43–56.",
    authors: ["Hintermann"],
    year: 2010,
    venue: "Journal of Environmental Economics and Management",
    url: "https://ideas.repec.org/a/eee/jeeman/v59y2010i1p43-56.html",
    kind: "peer-reviewed",
    finding:
      "Phase I prices not driven by marginal abatement costs initially; after the April 2006 verified-emissions release, fundamentals (fuel prices, temperature, reservoir levels, economic indicators) became more relevant.",
    variables: [
      { variableLabel: "Verified-emissions surprise", expectedSign: "context" },
      { variableLabel: "Reservoir level (hydro)", driverId: "eu_weather", expectedSign: "-" }
    ],
    dataSources: [
      {
        label: "EU ETS verified emissions + EEX Phelix + EU weather",
        url: "https://ideas.repec.org/a/eee/jeeman/v59y2010i1p43-56.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "creti-jouvet-mignon-2012-phase-equilibrium",
    markets: ["eu-ets"],
    citation:
      "Creti, Jouvet & Mignon (2012). Carbon price drivers: Phase I versus Phase II equilibrium? Energy Economics, 34(1), 327–334.",
    authors: ["Creti", "Jouvet", "Mignon"],
    year: 2012,
    venue: "Energy Economics",
    url: "https://ideas.repec.org/a/eee/eneeco/v34y2012i1p327-334.html",
    kind: "peer-reviewed",
    finding:
      "Cointegration in both phases but with different relationships; fundamentals play larger role in Phase II; carbon price undervalued from end-2009.",
    variables: [
      { variableLabel: "Energy markets cointegration", expectedSign: "context" },
      { variableLabel: "Industrial production", driverId: "eu_industry", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "EUA + energy markets + industrial production",
        url: "https://ideas.repec.org/a/eee/eneeco/v34y2012i1p327-334.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "aatola-2013-fundamentals",
    markets: ["eu-ets"],
    citation:
      "Aatola, Ollikainen & Toppinen (2013). Price determination in the EU ETS market: Theory and econometric analysis with market fundamentals. Energy Economics, 36, 380–395.",
    authors: ["Aatola", "Ollikainen", "Toppinen"],
    year: 2013,
    venue: "Energy Economics",
    url: "https://ideas.repec.org/a/eee/eneeco/v36y2013icp380-395.html",
    kind: "peer-reviewed",
    finding:
      "German power prices and the gas–coal spread show statistically significant positive effects on EUA forward prices (2005–2010 daily).",
    variables: [
      { variableLabel: "German power", driverId: "eu_power", expectedSign: "+" },
      { variableLabel: "Gas-coal spread", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "EUA forwards + EEX Phelix + German fuel costs",
        url: "https://ideas.repec.org/a/eee/eneeco/v36y2013icp380-395.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "lutz-pigorsch-rotfuss-2013-regime",
    markets: ["eu-ets"],
    citation:
      "Lutz, Pigorsch & Rotfuß (2013). Nonlinearity in cap-and-trade systems: The EUA price and its fundamentals. Energy Economics, 40, 222–232.",
    authors: ["Lutz", "Pigorsch", "Rotfuß"],
    year: 2013,
    venue: "Energy Economics",
    url: "https://ideas.repec.org/a/eee/eneeco/v40y2013icp222-232.html",
    kind: "peer-reviewed",
    finding:
      "Markov regime-switching: two volatility regimes, gas + EU equity have positive effects in both; coal/oil only in some regimes; crises trigger regime shifts (2008–09 recession, 2011–12 euro crisis).",
    variables: [
      { variableLabel: "Gas (cross-regime)", driverId: "eu_gas", expectedSign: "+" },
      { variableLabel: "EU equity index", driverId: "eu_financial", expectedSign: "+" },
      { variableLabel: "Crisis-driven regime shift", expectedSign: "context" }
    ],
    dataSources: [
      {
        label: "EUA + STOXX600 + gas/coal/oil through 2012",
        url: "https://ideas.repec.org/a/eee/eneeco/v40y2013icp222-232.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "koch-2014-price-collapse",
    markets: ["eu-ets"],
    citation:
      "Koch, Fuss, Grosjean & Edenhofer (2014). Causes of the EU ETS price drop: Recession, CDM, renewable policies or a bit of everything? Energy Policy, 73, 676–685.",
    authors: ["Koch", "Fuss", "Grosjean", "Edenhofer"],
    year: 2014,
    venue: "Energy Policy",
    url: "https://ideas.repec.org/a/eee/enepol/v73y2014icp676-685.html",
    kind: "peer-reviewed",
    finding:
      "2008 → mid-2013 collapse from ~€30 to <€5: only economic activity and growth of wind+solar generation robustly explain dynamics; ~90% of EUA price variation remains unexplained by abatement fundamentals.",
    variables: [
      { variableLabel: "Wind+solar generation share", expectedSign: "-" },
      { variableLabel: "Economic activity", driverId: "eu_industry", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "EUA + ENTSO-E generation + EU industrial production",
        url: "https://ideas.repec.org/a/eee/enepol/v73y2014icp676-685.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "koch-2016-politics-matter",
    markets: ["eu-ets"],
    citation:
      "Koch, Grosjean, Fuss & Edenhofer (2016). Politics matters: Regulatory events as catalysts for price formation under cap-and-trade. SSRN id 2603115.",
    authors: ["Koch", "Grosjean", "Fuss", "Edenhofer"],
    year: 2016,
    venue: "SSRN working paper",
    url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2603115",
    kind: "working-paper",
    finding:
      "Backloading legislation drove substantial price declines as market confidence in stringency was shaken during the legislative process. Regulatory events themselves move prices.",
    variables: [{ variableLabel: "Regulatory event indicator", expectedSign: "context" }],
    dataSources: [
      {
        label: "EU Commission legislative timeline + EUA Dec futures",
        url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2603115",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  },
  {
    id: "tan-wang-2017-quantile",
    markets: ["eu-ets"],
    citation:
      "Tan & Wang (2017). Dependence changes between the carbon price and its fundamentals: A quantile regression approach. Applied Energy, 190, 306–325.",
    authors: ["Xiao-Ping Tan", "Xin-Yu Wang"],
    year: 2017,
    venue: "Applied Energy",
    url: "https://ideas.repec.org/a/eee/appene/v190y2017icp306-325.html",
    kind: "peer-reviewed",
    finding:
      "Three-phase quantile dependence: coal/gas show evolving 'production restraint → aggregated demand → substitution' pattern; oil shows 'substitution → production restraint' reversal; industrial production unstable in Phases II–III; carbon VaR driven primarily by energy prices.",
    variables: [
      { variableLabel: "Coal/gas (quantile-dependent)", expectedSign: "context" },
      {
        variableLabel: "Industrial production (regime-unstable)",
        driverId: "eu_industry",
        expectedSign: "context"
      }
    ],
    dataSources: [
      {
        label: "EUA + Brent + TTF + Eurostat industrial production",
        url: "https://ideas.repec.org/a/eee/appene/v190y2017icp306-325.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "hintermann-2017-market-power",
    markets: ["eu-ets"],
    citation:
      "Hintermann (2017). Market Power in Emission Permit Markets: Theory and Evidence from the EU ETS. Environmental and Resource Economics, 66(1), 89–112.",
    authors: ["Hintermann"],
    year: 2017,
    venue: "Environmental and Resource Economics",
    url: "https://ideas.repec.org/a/kap/enreec/v66y2017i1d10.1007_s10640-015-9939-4.html",
    kind: "peer-reviewed",
    finding:
      "Excess allowance holdings of largest electricity firms in Phase I consistent with strategic price manipulation. Concentration is itself a microstructure driver.",
    variables: [
      { variableLabel: "Top-holder concentration of allowances", expectedSign: "context" }
    ],
    dataSources: [
      {
        label: "EU Transaction Log + Phase I holdings",
        url: "https://ideas.repec.org/a/kap/enreec/v66y2017i1d10.1007_s10640-015-9939-4.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: false,
    reviewedAt
  },
  {
    id: "friedrich-2019-speculation",
    markets: ["eu-ets"],
    citation:
      "Friedrich, Mauer, Pahle & Tietjen (2019). Understanding the explosive trend in EU ETS prices — fundamentals or speculation? arXiv:1906.10572.",
    authors: ["Friedrich", "Mauer", "Pahle", "Tietjen"],
    year: 2019,
    venue: "arXiv",
    url: "https://arxiv.org/abs/1906.10572",
    kind: "working-paper",
    finding:
      "2018 reform triggered explosive price growth indicative of speculative behaviour; bubble-detection and time-varying regression suggest reform pushed market into a speculative regime.",
    variables: [{ variableLabel: "Speculative regime indicator", expectedSign: "context" }],
    dataSources: [
      {
        label: "EUA Dec futures + bubble-detection methodology",
        url: "https://arxiv.org/abs/1906.10572",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "exploratory",
    openAccess: true,
    reviewedAt
  },
  {
    id: "bocklet-2019-msr-reform",
    markets: ["eu-ets"],
    citation:
      "Bocklet, Hintermayer, Schmidt & Wildgrube (2019). The reformed EU ETS — Intertemporal emission trading with restricted banking. Energy Economics.",
    authors: ["Bocklet", "Hintermayer", "Schmidt", "Wildgrube"],
    year: 2019,
    venue: "Energy Economics",
    url: "https://ideas.repec.org/p/ris/ewikln/2019_004.html",
    kind: "peer-reviewed",
    finding:
      "MSR shifts emissions to future but is allowance-preserving; cancellation mechanism reduces overall cap and raises long-run prices; LRF increase is the main price driver of the reform.",
    variables: [
      { variableLabel: "MSR cancellation rate", driverId: "eu_tnac_msr", expectedSign: "+" },
      {
        variableLabel: "LRF (linear reduction factor)",
        driverId: "eu_supply_cap",
        expectedSign: "+"
      }
    ],
    dataSources: [
      {
        label: "EU Commission MSR + LRF schedule",
        url: "https://ideas.repec.org/p/ris/ewikln/2019_004.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "li-2021-tvp-var",
    markets: ["eu-ets"],
    citation:
      "Li, Zhang, Yuan & Hao (2021). Time-Varying Impacts of Carbon Price Drivers in the EU ETS: A TVP-VAR Analysis. Frontiers in Environmental Science, 9, 651791.",
    authors: ["Li", "Zhang", "Yuan", "Hao"],
    year: 2021,
    venue: "Frontiers in Environmental Science",
    url: "https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2021.651791/full",
    kind: "peer-reviewed",
    finding:
      "Structural inversion ~mid-2016 around the Paris Agreement. Oil exhibits the strongest impact (response ±1.20). Pre-2016 oil negative, post-2016 positive; STOXX600 effect flips from positive (short horizon, pre-2016) to negative (medium horizon, post-2016); electricity goes from negative to positive.",
    variables: [
      {
        variableLabel: "Oil (post-2016)",
        driverId: "eu_oil",
        expectedSign: "+",
        quantitativeAnchor: "Response magnitude ±1.20 (TVP-VAR)"
      },
      {
        variableLabel: "STOXX600 (medium horizon, post-2016)",
        driverId: "eu_financial",
        expectedSign: "-"
      },
      { variableLabel: "Electricity (post-2016)", driverId: "eu_power", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "WIND + Bloomberg + EEX Phelix",
        url: "https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2021.651791/full",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "ampudia-2022-ecb-speculation",
    markets: ["eu-ets"],
    citation:
      "Ampudia, Bua, Kapp & Salakhova (2022). The role of speculation during the recent increase in EU emissions allowance prices. ECB Economic Bulletin, Issue 3/2022.",
    authors: ["Ampudia", "Bua", "Kapp", "Salakhova"],
    year: 2022,
    venue: "ECB Economic Bulletin",
    url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2022/html/ecb.ebbox202203_06~ca1e9ea13e.en.html",
    kind: "central-bank",
    finding:
      "Investment funds hold ~0.7% of outstanding open positions (late 2021), up marginally from 0.6% (2020). Speculative activity below historical highs. Up to ~90% of carbon price fluctuation explained by fundamentals. Little change in market structure over 5 years despite market doubling.",
    variables: [
      {
        variableLabel: "Investment fund position share",
        expectedSign: "context",
        quantitativeAnchor: "~0.7% of OI (late 2021)"
      }
    ],
    dataSources: [
      {
        label: "EMIR + ESMA + Refinitiv + Bloomberg",
        url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2022/html/ecb.ebbox202203_06~ca1e9ea13e.en.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "quemin-pahle-2023-financials",
    markets: ["eu-ets"],
    citation:
      "Quemin & Pahle (2023). Financials threaten to undermine the functioning of emissions markets. Nature Climate Change, 13(1).",
    authors: ["Quemin", "Pahle"],
    year: 2023,
    venue: "Nature Climate Change",
    url: "https://www.nature.com/articles/s41558-022-01560-w",
    kind: "peer-reviewed",
    finding:
      "Financials are necessary for liquidity and price discovery, but EU ETS lacks adequate monitoring system to detect excessive speculation; cross-market risk connectivity is rising.",
    variables: [
      { variableLabel: "Financialisation index (need monitoring)", expectedSign: "context" }
    ],
    dataSources: [
      {
        label: "Nature Climate Change abstract",
        url: "https://www.nature.com/articles/s41558-022-01560-w",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "kanzig-2023-nber-shocks",
    markets: ["eu-ets"],
    citation:
      "Känzig (2023). The Unequal Economic Consequences of Carbon Pricing. NBER Working Paper 31221.",
    authors: ["Diego R. Känzig"],
    year: 2023,
    venue: "NBER Working Paper",
    url: "https://www.nber.org/papers/w31221",
    kind: "working-paper",
    finding:
      "Identifies carbon policy shocks via high-frequency window around EU ETS regulatory announcements. Restrictive carbon shock raises energy prices, cuts emissions, spurs green innovation, but contracts activity. 1 SD shock → real GDP −0.2%, equity prices >−2%.",
    variables: [
      {
        variableLabel: "EU ETS regulatory shock",
        expectedSign: "+",
        quantitativeAnchor: "1 SD shock → GDP −0.2%, equity >−2%"
      }
    ],
    dataSources: [
      {
        label: "EU Commission announcement timestamps + EUA Dec futures intraday",
        url: "https://www.nber.org/papers/w31221",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "anaya-longaric-2024-ecb-investment",
    markets: ["eu-ets"],
    citation:
      "Anaya Longaric, Di Nino & Kostakis (2024). The effects of the Emissions Trading System on European investment in the short run. ECB Economic Bulletin, Issue 8/2024.",
    authors: ["Anaya Longaric", "Di Nino", "Kostakis"],
    year: 2024,
    venue: "ECB Economic Bulletin",
    url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2025/html/ecb.ebbox202408_02~55e30afb57.en.html",
    kind: "central-bank",
    finding:
      "1% PPI energy shock from carbon price drops EU gross fixed capital formation by ~0.5% in year 1, accumulating to >1% after two years; greenfield FDI to non-EU rises (leakage indicator).",
    variables: [
      {
        variableLabel: "Carbon → EU GFCF (investment)",
        expectedSign: "-",
        quantitativeAnchor: "1% PPI energy → −0.5% GFCF y1, >−1% cumulative"
      },
      { variableLabel: "Greenfield FDI to non-EU (leakage)", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "Eurostat GFCF + UNCTAD FDI + PPI energy",
        url: "https://www.ecb.europa.eu/press/economic-bulletin/focus/2025/html/ecb.ebbox202408_02~55e30afb57.en.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "dittmann-2024-phase4-decoupling",
    markets: ["eu-ets"],
    citation:
      "Dittmann, Lauter, Prokopczuk & Sibbertsen (2024/25). What determines the price of carbon? New evidence from phase III and IV of the EU ETS. Hannover Economic Papers 732.",
    authors: ["Dittmann", "Lauter", "Prokopczuk", "Sibbertsen"],
    year: 2024,
    venue: "Hannover Economic Papers (also Journal of Climate Finance)",
    url: "https://www.econstor.eu/handle/10419/307746",
    kind: "working-paper",
    finding:
      "Explanatory power of energy fundamentals (oil, gas, coal, electricity, clean dark/spark spreads) collapses from ~30% (Phase I) to <5% in Phases III/IV. Crude oil retains the strongest individual signal. Established price-driver models do not fit Phase IV well.",
    variables: [
      {
        variableLabel: "Energy fundamentals R²",
        expectedSign: "context",
        quantitativeAnchor: "~30% (Phase I) → <5% (Phase III/IV)"
      },
      { variableLabel: "Crude oil (Phase IV strongest)", driverId: "eu_oil", expectedSign: "+" }
    ],
    dataSources: [
      {
        label: "EUA + crude/gas/coal/power + clean spreads",
        url: "https://www.econstor.eu/handle/10419/307746",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "pahle-2025-ets-endgame",
    markets: ["eu-ets"],
    citation:
      "Pahle, Quemin, Osorio, Günther & Pietzcker (2025). The emerging endgame: The EU ETS on the road towards climate neutrality. Resource and Energy Economics, 81, 101476.",
    authors: ["Pahle", "Quemin", "Osorio", "Günther", "Pietzcker"],
    year: 2025,
    venue: "Resource and Energy Economics",
    url: "https://ideas.repec.org/a/eee/resene/v81y2025ics0928765524000526.html",
    kind: "peer-reviewed",
    finding:
      "Cap going to ~zero by ~2040 marks 'ETS endgame'. Market dynamics fundamentally change as supply approaches zero; signals re-pricing risk and convexity in cap path.",
    variables: [
      {
        variableLabel: "Cap → zero convexity (long horizon)",
        driverId: "eu_supply_cap",
        expectedSign: "+"
      }
    ],
    dataSources: [
      {
        label: "EU Commission cap schedule",
        url: "https://ideas.repec.org/a/eee/resene/v81y2025ics0928765524000526.html",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "esma-2024-carbon-markets",
    markets: ["eu-ets"],
    citation: "ESMA (2024). EU Carbon Markets Report 2024. ESMA50-43599798-10379.",
    authors: ["ESMA"],
    year: 2024,
    venue: "ESMA report",
    url: "https://www.esma.europa.eu/sites/default/files/2024-10/ESMA50-43599798-10379_Carbon_markets_report_2024.pdf",
    kind: "official-report",
    finding:
      "~406 funds hold ~6% of all EUA positions (2023), turning increasingly short as prices fell. 206 companies long, 118 banks/IFs short in derivatives. Primary auction concentrated: top ~10 buyers = 90% of volume. Most secondary trading via on-exchange futures.",
    variables: [
      {
        variableLabel: "Investment fund position share",
        expectedSign: "context",
        quantitativeAnchor: "~6% of EUA positions (2023)"
      },
      {
        variableLabel: "Auction concentration",
        driverId: "eu_auction_micro",
        expectedSign: "context",
        quantitativeAnchor: "Top 10 buyers = 90% of auctioned volume"
      }
    ],
    dataSources: [
      {
        label: "EMIR aggregated open interest + position-holder breakdown",
        url: "https://www.esma.europa.eu/sites/default/files/2024-10/ESMA50-43599798-10379_Carbon_markets_report_2024.pdf",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "bayer-aklin-2020-pnas",
    markets: ["eu-ets"],
    citation:
      "Bayer & Aklin (2020). The European Union Emissions Trading System reduced CO₂ emissions despite low prices. PNAS, 117(16), 8804–8812.",
    authors: ["Bayer", "Aklin"],
    year: 2020,
    venue: "PNAS",
    url: "https://www.pnas.org/doi/10.1073/pnas.1918128117",
    kind: "peer-reviewed",
    finding:
      "EU ETS reduced ~1.2 GtCO₂ (3.8%) over 2008–2016 vs counterfactual; covered-sector emissions 8.1–11.5% lower. Policy effectiveness despite low prices is itself a credibility-driver anchor.",
    variables: [
      {
        variableLabel: "EU ETS effectiveness (cumulative reduction)",
        expectedSign: "context",
        quantitativeAnchor: "~1.2 GtCO₂ saved 2008–2016 (3.8%)"
      }
    ],
    dataSources: [
      {
        label: "EU ETS verified emissions + counterfactual model",
        url: "https://www.pnas.org/doi/10.1073/pnas.1918128117",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: true,
    reviewedAt
  },
  {
    id: "colmer-2024-firm-level",
    markets: ["eu-ets"],
    citation:
      "Colmer, Martin, Muûls & Wagner (2024). Does Pricing Carbon Mitigate Climate Change? Firm-Level Evidence from the EU ETS. Review of Economic Studies, 92(3), 1625–.",
    authors: ["Colmer", "Martin", "Muûls", "Wagner"],
    year: 2024,
    venue: "Review of Economic Studies",
    url: "https://academic.oup.com/restud/article/92/3/1625/7681739",
    kind: "peer-reviewed",
    finding:
      "EU ETS induced regulated manufacturing firms to cut CO₂ 14–16% with no detectable activity contraction; no leakage evidence; firms made targeted abatement investments.",
    variables: [
      {
        variableLabel: "Firm-level abatement response",
        expectedSign: "context",
        quantitativeAnchor: "14–16% cut, no activity contraction"
      }
    ],
    dataSources: [
      {
        label: "EU Transaction Log + firm panel",
        url: "https://academic.oup.com/restud/article/92/3/1625/7681739",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "gorlach-2025-ets2",
    markets: ["eu-ets"],
    citation:
      "Görlach, Bocklet et al. (2025). Carbon prices on the rise? Shedding light on the emerging second EU Emissions Trading System (EU ETS 2). Climate Policy.",
    authors: ["Görlach", "Bocklet", "et al."],
    year: 2025,
    venue: "Climate Policy",
    url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2025.2485196",
    kind: "peer-reviewed",
    finding:
      "ETS2 launches 2027, full surrender 2028. Price stability mechanism releases additional allowances if price exceeds €45 (2020 prices) in first two years. Estimated price range €71–€261/tCO₂ in 2030.",
    variables: [
      {
        variableLabel: "ETS2 price stability trigger",
        expectedSign: "context",
        quantitativeAnchor: "€45 (2020 prices) trigger; 2030 €71–€261 range"
      }
    ],
    dataSources: [
      {
        label: "EU Council/Commission ETS2 documentation",
        url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2025.2485196",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "strong",
    openAccess: false,
    reviewedAt
  },
  {
    id: "bastianin-2024-bvar-forecast",
    markets: ["eu-ets"],
    citation:
      "Bastianin, Mirto, Qin & Rossini (2024). What drives the European carbon market? Macroeconomic factors and forecasts. arXiv:2402.04828.",
    authors: ["Bastianin", "Mirto", "Qin", "Rossini"],
    year: 2024,
    venue: "arXiv",
    url: "https://arxiv.org/abs/2402.04828",
    kind: "working-paper",
    finding:
      "Bayesian VAR with stochastic volatility; baseline + supply/demand factors; multi-horizon forecasts vs survey expectations and provider forecasts. Forecast scaffolding usable as a methodology pattern in C-Quant.",
    variables: [{ variableLabel: "Macro factor structure (BVAR)", expectedSign: "context" }],
    dataSources: [
      {
        label: "Macro factor panel + EUA Dec futures",
        url: "https://arxiv.org/abs/2402.04828",
        accessed: reviewedAt
      }
    ],
    evidenceStrength: "moderate",
    openAccess: true,
    reviewedAt
  }
];

export function papersForMarket(marketId: ResearchPaper["markets"][number]): ResearchPaper[] {
  return researchCatalogue.filter((paper) => paper.markets.includes(marketId));
}

export function papersByDriverId(driverId: string): ResearchPaper[] {
  return researchCatalogue.filter((paper) =>
    paper.variables.some((variable) => variable.driverId === driverId)
  );
}

export function papersWithQuantitativeAnchors(): ResearchPaper[] {
  return researchCatalogue.filter((paper) =>
    paper.variables.some((variable) => Boolean(variable.quantitativeAnchor))
  );
}
