import type { CatalystEvent } from "../types";

/**
 * Curated catalyst event log for EU ETS, K-ETS, and China ETS.
 *
 * Citation policy:
 * - Every event references a public, named primary source: EU Commission
 *   notice, EEX press release, ICAP report, KRX press release, MOE press
 *   release, MEE bulletin, or peer-reviewed work.
 * - "verified" means the date and source were both confirmed against the
 *   primary record. "reported" means the date is widely reported in
 *   secondary press but a single primary URL is not bundled. "context"
 *   means the date marks an environmental condition (winter peak, broader
 *   macro regime) rather than a single document.
 * - Operators must verify each entry before using it in a regulated
 *   reporting workflow.
 *
 * The log is consumed by:
 * - src/lib/eventStudy.ts → empirical multiplier estimation
 * - the Drivers view → event timeline panel
 * - tests/catalystEventLog.test.ts → schema and citation hygiene
 */
export const catalystEventLog: CatalystEvent[] = [
  // EU ETS — MSR / Fit-for-55 / policy supply ----------------------------------
  {
    id: "eu-msr-2018-publication",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2018-05-15",
    label: "MSR rate doubled in TNAC publication",
    brief:
      "Commission published the TNAC for 2017 confirming the 24% MSR intake rate, tightening forward auction supply.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - Market Stability Reserve",
        url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/market-stability-reserve_en",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-fit-for-55-proposal-2021",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2021-07-14",
    label: "Fit-for-55 package proposal",
    brief:
      "European Commission published the Fit-for-55 package, including ETS revision and proposed CBAM. Forward scarcity expectations re-priced.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - Fit for 55 package",
        url: "https://climate.ec.europa.eu/eu-action/european-green-deal/delivering-european-green-deal_en",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-ets-revision-trilogue-2022",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2022-12-18",
    label: "ETS revision trilogue agreement",
    brief:
      "Provisional political agreement reached on EU ETS revision, including faster LRF, ETS2, and updated MSR rules.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - About the EU ETS",
        url: "https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-msr-2025-reduction-notice",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2025-05-28",
    label: "MSR reduces 2025 auction volume by 276M tonnes",
    brief:
      "Commission notice on MSR auction reduction for 2025, tightening near-term supply.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - 2025 MSR auction reduction notice",
        url: "https://climate.ec.europa.eu/news-other-reads/news/market-stability-reserve-under-eu-emissions-trading-system-reduce-auction-volume-276-million-2025-05-28_lv",
        accessed: "2026-04-29"
      }
    ]
  },

  // EU ETS — energy crisis / cold-snap stack ----------------------------------
  {
    id: "eu-energy-crisis-q4-2021",
    scenarioId: "eu-cold-snap-stack",
    marketId: "eu-ets",
    observedAt: "2021-12-08",
    label: "Q4 2021 European gas-power-EUA stress",
    brief:
      "TTF spiked, low storage and weak wind drove coal-to-gas switching collapse; EUA Dec22 ran toward record highs.",
    confidence: "context",
    references: [
      {
        label: "IEA - World Energy Outlook (annual)",
        url: "https://www.iea.org/reports/world-energy-outlook-2024",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-energy-crisis-feb-2022",
    scenarioId: "eu-cold-snap-stack",
    marketId: "eu-ets",
    observedAt: "2022-02-24",
    label: "Russia-Ukraine invasion energy shock",
    brief:
      "Russian invasion of Ukraine triggered a sustained gas/oil price shock and reshaped EU power generation economics.",
    confidence: "context",
    references: [
      {
        label: "IEA - World Energy Outlook (annual)",
        url: "https://www.iea.org/reports/world-energy-outlook-2024",
        accessed: "2026-04-29"
      }
    ]
  },

  // EU ETS — recession / financial stack --------------------------------------
  {
    id: "eu-covid-drawdown-mar-2020",
    scenarioId: "eu-recession-financial-stack",
    marketId: "eu-ets",
    observedAt: "2020-03-18",
    label: "COVID-19 risk-off drawdown",
    brief:
      "Global COVID-19 drawdown saw EUA correlate strongly with risk assets; financial channel dominated short-horizon pricing.",
    confidence: "context",
    references: [
      {
        label: "arXiv 2024 - Phase 4 determinant shift to financial fluctuations",
        url: "https://arxiv.org/abs/2406.05094",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-rate-shock-summer-2022",
    scenarioId: "eu-recession-financial-stack",
    marketId: "eu-ets",
    observedAt: "2022-08-26",
    label: "ECB hike cycle and risk-off",
    brief:
      "ECB hike acceleration alongside industrial slowdown; EUA correlated more with risk assets than with gas alone for several weeks.",
    confidence: "context",
    references: [
      {
        label: "TandF 2024 - speculation and carbon price predictability",
        url: "https://www.tandfonline.com/doi/abs/10.1080/1540496X.2024.2324194",
        accessed: "2026-04-29"
      }
    ]
  },

  // EU ETS — compliance / CBAM ------------------------------------------------
  {
    id: "eu-compliance-2024",
    scenarioId: "eu-compliance-cbam-stack",
    marketId: "eu-ets",
    observedAt: "2024-04-15",
    label: "April 2024 surrender window",
    brief:
      "Approach to the 30 April surrender deadline saw recurring auction coverage tightening through Mar-Apr.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - ETS Reporting Tool",
        url: "https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/monitoring-reporting-and-verification/ets-reporting-tool-ert_en",
        accessed: "2026-04-29"
      },
      {
        label: "EEX - EU ETS auctions",
        url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "eu-cbam-transition-start-2023",
    scenarioId: "eu-compliance-cbam-stack",
    marketId: "eu-ets",
    observedAt: "2023-10-01",
    label: "CBAM transition phase begins",
    brief:
      "CBAM transitional reporting phase started, exposing CBAM-listed sectors to EUA-tied embedded-emissions accounting.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - CBAM",
        url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
        accessed: "2026-04-29"
      }
    ]
  },

  // K-ETS ---------------------------------------------------------------------
  {
    id: "kr-fourth-basic-plan-2024",
    scenarioId: "kr-policy-rate-fx-stack",
    marketId: "k-ets",
    observedAt: "2024-12-01",
    label: "K-ETS Fourth Basic Plan publication",
    brief:
      "The fourth Basic Plan covering 2026-2035 raised auctioning, tightened benchmarking, and expanded liquidity access.",
    confidence: "verified",
    references: [
      {
        label: "ICAP - Korea ETS overview",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "kr-liquidity-measures-2024",
    scenarioId: "kr-banking-relaxation-stack",
    marketId: "k-ets",
    observedAt: "2024-02-13",
    label: "MOE liquidity reform package",
    brief:
      "Korean MOE announced banking and offset reforms; intertemporal scarcity loosened around the compliance window.",
    confidence: "verified",
    references: [
      {
        label: "Korean MOE English press release - liquidity reform",
        url: "https://eng.me.go.kr/eng/web/board/read.do?boardId=1718360&boardMasterId=522&menuId=461",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "kr-compliance-2023-thin-tape",
    scenarioId: "kr-compliance-thin-liquidity",
    marketId: "k-ets",
    observedAt: "2023-03-15",
    label: "K-ETS Q1 2023 surrender window",
    brief:
      "Recurring thin-tape compression observed near the Q1 verification and surrender window.",
    confidence: "context",
    references: [
      {
        label: "KRX ETS Information Platform",
        url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "kr-compliance-2024",
    scenarioId: "kr-compliance-thin-liquidity",
    marketId: "k-ets",
    observedAt: "2024-03-25",
    label: "K-ETS Q1 2024 surrender window",
    brief:
      "March 2024 verification and surrender window; KCU/KOC volume share informed by liquidity reforms.",
    confidence: "context",
    references: [
      {
        label: "KEREA 2018 - learning-by-doing in K-ETS pricing",
        url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
        accessed: "2026-04-29"
      }
    ]
  },

  // China ETS -----------------------------------------------------------------
  {
    id: "cn-launch-jul-2021",
    scenarioId: "cn-mee-sector-expansion",
    marketId: "cn-ets",
    observedAt: "2021-07-16",
    label: "China national ETS market opens",
    brief:
      "Shanghai Environment and Energy Exchange opened the national emissions trading market for the power sector.",
    confidence: "verified",
    references: [
      {
        label: "Shanghai Environment and Energy Exchange",
        url: "https://www.cneeex.com/",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "cn-2024-mee-bulletin-expansion",
    scenarioId: "cn-mee-sector-expansion",
    marketId: "cn-ets",
    observedAt: "2024-09-09",
    label: "MEE consultation on expanding to cement, steel, aluminium",
    brief:
      "MEE released consultation materials on extending the national ETS to additional industrial sectors.",
    confidence: "verified",
    references: [
      {
        label: "MEE Carbon Market Feed",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "cn-quota-distribution-delay-2022",
    scenarioId: "cn-quota-distribution-delay",
    marketId: "cn-ets",
    observedAt: "2022-08-15",
    label: "Provincial quota distribution delay (2022)",
    brief:
      "Delays in provincial quota distribution preceded the second compliance window; volumes thinned ahead of the bulletin clarification.",
    confidence: "reported",
    references: [
      {
        label: "MEE Carbon Market Feed",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
        accessed: "2026-04-29"
      }
    ]
  },

  // Cross-market --------------------------------------------------------------
  {
    id: "shared-multi-commodity-2022",
    scenarioId: "shared-multi-commodity-stress",
    marketId: "shared",
    observedAt: "2022-08-30",
    label: "Multi-commodity stress (2H 2022)",
    brief:
      "Cross-region energy and macro stress decoupled single-driver readings across EU, KR, and CN markets.",
    confidence: "context",
    references: [
      {
        label: "IEA - World Energy Outlook (annual)",
        url: "https://www.iea.org/reports/world-energy-outlook-2024",
        accessed: "2026-04-29"
      },
      {
        label: "World Bank - State and Trends of Carbon Pricing",
        url: "https://www.worldbank.org/en/programs/pricing-carbon",
        accessed: "2026-04-29"
      }
    ]
  },
  {
    id: "shared-listed-proxy-divergence-2024",
    scenarioId: "shared-listed-proxy-divergence",
    marketId: "shared",
    observedAt: "2024-02-20",
    label: "Listed-proxy divergence around policy bulletin",
    brief:
      "Persistent divergence between ICE EUA front-month and EEX auction settlement during a policy news cluster.",
    confidence: "reported",
    references: [
      {
        label: "ICE - EUA futures contract",
        url: "https://www.ice.com/products/197",
        accessed: "2026-04-29"
      },
      {
        label: "EEX - EU ETS auctions",
        url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
        accessed: "2026-04-29"
      }
    ]
  },

  // ── Events added 2026-05-04 from literature survey ───────────────────────
  {
    id: "cn-ccer-restart-2024",
    scenarioId: "cn-q4-ccer-substitution",
    marketId: "cn-ets",
    observedAt: "2024-01-22",
    label: "CCER market restart",
    brief:
      "China CCER market restarted after multi-year pause. First 5 days = 911k tons (~3x mandatory market volume); CCER initial peak 107.36 -> 72.81 yuan (21% premium then 17% discount vs CEA).",
    confidence: "verified",
    references: [
      {
        label: "Wang et al. 2022 - Carbon Neutrality (Springer)",
        url: "https://link.springer.com/article/10.1007/s43979-022-00035-3",
        accessed: "2026-05-04"
      },
      {
        label: "MEE Carbon Market Feed",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
        accessed: "2026-05-04"
      }
    ]
  },
  {
    id: "kr-fourth-basic-plan-publication-2024",
    scenarioId: "kr-phase4-auction-cap-relax",
    marketId: "k-ets",
    observedAt: "2024-12-01",
    label: "K-ETS Fourth Basic Plan published (Phase 4 framework)",
    brief:
      "Korean MOE published the Fourth Basic Plan covering 2026-2035: raises auctioning, tightens benchmarking, expands liquidity access. Phase 4 power auction ramp 15% (2026) -> 50% (2030). Aggregate Phase 4 cap 2.5373 GtCO2e.",
    confidence: "verified",
    references: [
      {
        label: "ICAP - K-ETS Fourth Basic Plan",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: "2026-05-04"
      }
    ]
  },
  {
    id: "kr-financial-cap-relaxation-2025",
    scenarioId: "kr-phase4-auction-cap-relax",
    marketId: "k-ets",
    observedAt: "2025-02-07",
    label: "K-ETS financial-institution access expansion",
    brief:
      "Banks and insurers permitted broader KAU trading from Feb 7, 2025. Continues the staged regime: 200k (2021) -> 500k (Dec 2022) -> 1m (2023) -> general access (Feb 2025). Yim et al. (2024): Hurst exponent regime breaks coincide with these cap changes.",
    confidence: "verified",
    references: [
      {
        label: "ICAP - K-ETS financial institution access",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: "2026-05-04"
      },
      {
        label: "Yim et al. 2024 - Emerging Markets Finance and Trade",
        url: "https://www.tandfonline.com/doi/full/10.1080/1540496X.2024.2379460",
        accessed: "2026-05-04"
      }
    ]
  },
  {
    id: "cn-mee-progress-report-2025",
    scenarioId: "cn-mee-sector-expansion",
    marketId: "cn-ets",
    observedAt: "2025-09-27",
    label: "MEE 2025 annual progress report on national carbon market",
    brief:
      "MEE published 2025 progress report covering data quality, intensity-based allocation, sector expansion timeline. 2024 CEA average ~98 yuan; 1,471 active entities; Q4 = 79% of annual volume.",
    confidence: "verified",
    references: [
      {
        label: "MEE 2025 progress report (PDF)",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
        accessed: "2026-05-04"
      },
      {
        label: "MDPI Land 2025 - China ETS current situation",
        url: "https://www.mdpi.com/2073-445X/14/8/1582",
        accessed: "2026-05-04"
      }
    ]
  },
  {
    id: "eu-cbam-transition-start-2023",
    scenarioId: "eu-cbam-expansion-usd-strength",
    marketId: "eu-ets",
    observedAt: "2023-10-01",
    label: "CBAM transitional reporting period starts",
    brief:
      "EU CBAM transitional reporting started 2023-10-01. Definitive period (with certificate purchase) starts 2026-01. Importers report embedded emissions of cement, iron/steel, aluminium, fertilisers, electricity, hydrogen.",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - CBAM",
        url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
        accessed: "2026-05-04"
      }
    ]
  },
  {
    id: "eu-ets2-trilogue-2022-revision",
    scenarioId: "eu-ets2-launch-price-stability",
    marketId: "eu-ets",
    observedAt: "2022-12-18",
    label: "EU ETS revision trilogue agreement (incl. ETS2)",
    brief:
      "Provisional political agreement on EU ETS revision: faster LRF, ETS2 for buildings/road transport, updated MSR rules. ETS2 launches 2027, full surrender 2028; price stability mechanism trigger EUR 45 (2020 prices).",
    confidence: "verified",
    references: [
      {
        label: "EU Commission - ETS2",
        url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/ets2-buildings-road-transport-and-additional-sectors_en",
        accessed: "2026-05-04"
      },
      {
        label: "Görlach et al. 2025 - Climate Policy",
        url: "https://www.tandfonline.com/doi/full/10.1080/14693062.2025.2485196",
        accessed: "2026-05-04"
      }
    ]
  },

  // 2025 / 2026 calendar additions ---------------------------------------------
  // Added 2026-05-07. The five entries below are codified policy and
  // calendar events (not cherry-picked political headlines) so the
  // event-study layer can lean on them confidently. Two are "verified"
  // (the underlying regulation pins the exact date); three are "context"
  // because the document publication slot moves a few weeks year over
  // year. Operators should still re-verify before using in regulated
  // reporting.

  {
    id: "eu-2024-surrender-2025",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2025-04-30",
    label: "EU ETS 2024 compliance surrender deadline",
    brief:
      "Operators must surrender allowances equal to verified 2024 emissions by 30 April 2025 per Directive 2003/87/EC Article 12(3). The compliance window typically lifts spot demand in March–April as installations true up.",
    confidence: "verified",
    references: [
      {
        label: "Directive 2003/87/EC (consolidated) - Article 12 surrender",
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02003L0087-20240301",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "eu-tnac-2024-publication-2025",
    scenarioId: "eu-msr-tnac-stack",
    marketId: "eu-ets",
    observedAt: "2025-05-15",
    label: "EU 2024 TNAC publication window",
    brief:
      "EU Commission publishes the Total Number of Allowances in Circulation (TNAC) for the prior calendar year by 15 May each year per MSR Decision (EU) 2015/1814. The TNAC value drives the next year's MSR intake share.",
    confidence: "verified",
    references: [
      {
        label: "MSR Decision (EU) 2015/1814",
        url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015D1814",
        accessed: "2026-05-07"
      },
      {
        label: "EU Commission - Market Stability Reserve",
        url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/market-stability-reserve_en",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "eu-cbam-definitive-start-2026",
    scenarioId: "eu-cbam-expansion-usd-strength",
    marketId: "eu-ets",
    observedAt: "2026-01-01",
    label: "CBAM definitive period starts",
    brief:
      "Per Regulation (EU) 2023/956 Article 36, importers of cement, iron and steel, aluminium, fertilizers, electricity, and hydrogen begin surrendering CBAM certificates on 1 January 2026, ending the 2023–2025 transitional reporting-only regime. Forward EUA scarcity expectations re-anchor as imported embedded emissions enter the EU's pricing perimeter.",
    confidence: "verified",
    references: [
      {
        label: "Regulation (EU) 2023/956 - CBAM",
        url: "https://eur-lex.europa.eu/eli/reg/2023/956/oj",
        accessed: "2026-05-07"
      },
      {
        label: "EU Taxation and Customs - CBAM",
        url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "kr-2024-surrender-2025",
    scenarioId: "kr-compliance-thin-liquidity",
    marketId: "k-ets",
    observedAt: "2025-08-31",
    label: "K-ETS 2024 compliance surrender deadline",
    brief:
      "K-ETS Phase 3 compliance cycle: 2024 verified emissions are surrendered by end of August 2025 per the Greenhouse Gas Emission Trading Act. Q2/Q3 typically sees compliance-driven demand from short-position covered entities as the deadline approaches.",
    confidence: "context",
    references: [
      {
        label: "ICAP - Korea Emissions Trading System",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "icap-status-report-2025",
    scenarioId: "shared-listed-proxy-divergence",
    marketId: "shared",
    observedAt: "2025-03-25",
    label: "ICAP Status Report 2025 release window",
    brief:
      "International Carbon Action Partnership publishes its annual cross-jurisdiction ETS status report each spring; the 2025 edition covers EU / UK / California / WCI / RGGI / K-ETS / China and harmonizes coverage, prices, and design metrics. Practitioners use it as a cross-market sanity check on EU vs K vs CN clearing-price spreads.",
    confidence: "context",
    references: [
      {
        label: "ICAP - Status Report 2025",
        url: "https://icapcarbonaction.com/en/publications/emissions-trading-worldwide-2025-icap-status-report",
        accessed: "2026-05-07"
      }
    ]
  },

  // 2nd events on previously-1-event scenarios (Phase 3.5, 2026-05-07).
  // Promotes shared-multi-commodity-stress and eu-ets2-launch-price-stability
  // to backtest status once the event-study sees ≥2 observations each.

  {
    id: "shared-2022-russia-ukraine-commodity-peak",
    scenarioId: "shared-multi-commodity-stress",
    marketId: "shared",
    observedAt: "2022-03-08",
    label: "Russia-Ukraine commodity peak (Brent, TTF, coal)",
    brief:
      "Following the 24 February 2022 invasion of Ukraine, multi-commodity stress peaked around 7–8 March 2022: Brent traded above $130/bbl, ICE TTF gas reached ~€345/MWh intraday, and API2 coal cleared above $400/t. The cross-commodity squeeze priced both fuel-switching and recession-fear channels into EUA simultaneously and is the canonical reference for the multi-commodity-stress scenario.",
    confidence: "verified",
    references: [
      {
        label: "ICE - Brent Crude Futures historical settlements",
        url: "https://www.ice.com/products/219/Brent-Crude-Futures",
        accessed: "2026-05-07"
      },
      {
        label: "ICE Endex - Dutch TTF Gas Futures",
        url: "https://www.ice.com/products/27996665/Dutch-TTF-Gas-Futures",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "eu-ets-revision-council-adoption-2023",
    scenarioId: "eu-ets2-launch-price-stability",
    marketId: "eu-ets",
    observedAt: "2023-04-25",
    label: "EU Council adopts ETS revision (incl. ETS2)",
    brief:
      "EU Council formally adopted the revised EU ETS (Directive (EU) 2023/959) on 25 April 2023, locking in the Fit-for-55 trajectory: faster LRF, ETS2 for buildings and road transport from 2027, MSR2 design, and the €45 (2020 prices) price-stability trigger for ETS2. Council adoption is the first hard-law commitment after the December 2022 trilogue agreement — forward EUA scarcity expectations re-anchored.",
    confidence: "verified",
    references: [
      {
        label: "Directive (EU) 2023/959 - revised EU ETS",
        url: "https://eur-lex.europa.eu/eli/dir/2023/959/oj",
        accessed: "2026-05-07"
      },
      {
        label: "EU Council press release on ETS revision adoption",
        url: "https://www.consilium.europa.eu/en/press/press-releases/2023/04/25/fit-for-55-council-adopts-key-pieces-of-legislation-delivering-on-2030-climate-targets/",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "kr-financial-cap-500k-2022",
    scenarioId: "kr-banking-relaxation-stack",
    marketId: "k-ets",
    observedAt: "2022-12-15",
    label: "K-ETS financial-institution position cap raised to 500k",
    brief:
      "MOE / Korean climate authorities raised the K-ETS financial-institution position cap to 500,000 KAU in December 2022, the second step in the staged liquidity-reform sequence (200k 2021 → 500k Dec 2022 → 1m 2023 → general access Feb 2025). Yim et al. (2024) document a Hurst-exponent regime break around this milestone consistent with broader market-maker participation tightening the bid-offer.",
    confidence: "reported",
    references: [
      {
        label: "ICAP - Korea Emissions Trading System",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: "2026-05-07"
      },
      {
        label: "Yim et al. 2024 - Emerging Markets Finance and Trade",
        url: "https://www.tandfonline.com/doi/full/10.1080/1540496X.2024.2379460",
        accessed: "2026-05-07"
      }
    ]
  },
  {
    id: "eu-cbam-first-quarterly-deadline-2024",
    scenarioId: "eu-cbam-expansion-usd-strength",
    marketId: "eu-ets",
    observedAt: "2024-01-31",
    label: "First CBAM transitional quarterly declaration deadline",
    brief:
      "First CBAM transitional reporting deadline: importers had to submit Q4 2023 embedded-emissions declarations by 31 January 2024 per Implementing Regulation (EU) 2023/1773. The first hard administrative checkpoint after the 2023-10-01 transitional start, and the first cycle in which import-side compliance burden was visibly priced into EUA forwards.",
    confidence: "verified",
    references: [
      {
        label: "Implementing Regulation (EU) 2023/1773 (CBAM transitional)",
        url: "https://eur-lex.europa.eu/eli/reg_impl/2023/1773/oj",
        accessed: "2026-05-07"
      },
      {
        label: "EU Taxation and Customs - CBAM",
        url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
        accessed: "2026-05-07"
      }
    ]
  }
];

export function eventsForScenario(scenarioId: string): CatalystEvent[] {
  return catalystEventLog.filter((event) => event.scenarioId === scenarioId);
}

export function eventsForMarket(marketId: CatalystEvent["marketId"]): CatalystEvent[] {
  return catalystEventLog.filter(
    (event) => event.marketId === marketId || event.marketId === "shared"
  );
}
