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
