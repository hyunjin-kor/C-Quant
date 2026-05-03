import type { CatalystScenario } from "../types";

const calibratedAt = "2026-04-29";

const reviewedAt = "2026-04-29";

/**
 * Carbon-market catalyst scenarios.
 *
 * Each scenario is a COMBINATION of two or more drivers that have moved
 * EU ETS, K-ETS, or China ETS prices in observable, peer-reviewed or
 * official-record ways. The shape is intentionally driver-aware so the
 * forecast layer can compose components into a market read instead of
 * rendering single isolated events.
 *
 * Citations are restricted to public, named primary sources. We do not
 * fabricate paper titles, DOIs, or vendor links.
 */
export const catalystScenarios: CatalystScenario[] = [
  {
    id: "eu-cold-snap-stack",
    marketIds: ["eu-ets"],
    name: "Cold snap + low gas storage + weak wind",
    windowLabel: "Winter peak demand window",
    rarity: "watch",
    expectedDirection: "higher",
    components: [
      {
        driverId: "eu_weather",
        family: "Weather and Seasonality",
        variable: "Temperature anomaly",
        sign: "tighten",
        threshold: "Temperature 2σ below seasonal norm for 5+ consecutive days"
      },
      {
        driverId: "eu_gas",
        family: "Fuel Switching",
        variable: "TTF day-ahead and storage fill rate",
        sign: "tighten",
        threshold: "Storage <70% in Nov, or month-on-month draw exceeds 5y average"
      },
      {
        driverId: "eu_power",
        family: "Power Complex",
        variable: "Wind capacity factor / clean spark spread",
        sign: "tighten",
        threshold: "Wind capacity factor <50% of trailing 5y norm for 3+ days"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Watch coal-to-gas dispatch flip. EUA demand from thermal generation rises non-linearly when gas spikes coincide with low renewables; check ICE EUA roll for back-month tightness.",
    whyItMatters:
      "Winter 2021-2022 demonstrated that this stack can shift the EUA forward curve faster than any single-driver reading would predict.",
    historicalAnchor:
      "Q4 2021 - Q1 2022 European energy crisis: TTF spiked, EUA Dec22 ran from ~€60 to ~€95 over 12 weeks while gas-coal switching economics flipped.",
    references: [
      {
        label: "EU Commission - About the EU ETS",
        url: "https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en",
        accessed: reviewedAt
      },
      {
        label: "IEA - World Energy Outlook (annual)",
        url: "https://www.iea.org/reports/world-energy-outlook-2024",
        accessed: reviewedAt
      },
      {
        label: "Energy Economics - weather, energy, and carbon prices",
        url: "https://www.sciencedirect.com/science/article/pii/S0301421506002121",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "eu-msr-tnac-stack",
    marketIds: ["eu-ets"],
    name: "MSR withdrawal + tight TNAC + Fit-for-55 reaffirmation",
    windowLabel: "Policy supply review (May-Sep)",
    rarity: "common",
    expectedDirection: "higher",
    components: [
      {
        driverId: "eu_tnac_msr",
        family: "Policy Supply",
        variable: "MSR auction reduction notice",
        sign: "tighten",
        threshold: "Commission notice cutting auction volume in upcoming year"
      },
      {
        driverId: "eu_supply_cap",
        family: "Policy Supply",
        variable: "LRF / Fit-for-55 trajectory",
        sign: "tighten",
        threshold: "Commission reaffirms or accelerates linear reduction factor"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Forward scarcity gets pulled into the front. Read this as a structural anchor, not a trade signal: positions should treat policy supply as a regime variable.",
    whyItMatters:
      "Phase 4 econometric work consistently identifies MSR + cap as the dominant medium-horizon variables.",
    historicalAnchor:
      "2025-05-28 Commission notice on 276M tonne MSR reduction; followed by reaffirmation of Fit-for-55 trajectory.",
    references: [
      {
        label: "EU Commission - Market Stability Reserve",
        url: "https://climate.ec.europa.eu/eu-action/eu-emissions-trading-system-eu-ets/market-stability-reserve_en",
        accessed: reviewedAt
      },
      {
        label: "EU Commission - 2025 MSR auction reduction notice",
        url: "https://climate.ec.europa.eu/news-other-reads/news/market-stability-reserve-under-eu-emissions-trading-system-reduce-auction-volume-276-million-2025-05-28_lv",
        accessed: reviewedAt
      },
      {
        label: "Nature Energy 2024 - policy credibility and EU carbon prices",
        url: "https://www.nature.com/articles/s41560-024-01505-x",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "eu-recession-financial-stack",
    marketIds: ["eu-ets"],
    name: "Industrial slowdown + credit stress + macro risk-off",
    windowLabel: "Macro regime shift",
    rarity: "watch",
    expectedDirection: "lower",
    components: [
      {
        driverId: "eu_industry",
        family: "Macro and Financial",
        variable: "Eurozone industrial production",
        sign: "loosen",
        threshold: "YoY decline two consecutive prints"
      },
      {
        driverId: "eu_financial",
        family: "Macro and Financial",
        variable: "Equity drawdown / credit spread widening",
        sign: "loosen",
        threshold: "STOXX 600 -10% peak-to-trough or iTraxx Crossover > 1y trailing 90th percentile"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Compliance demand softens with industrial output; financial fluctuations weight Phase 4 pricing more than Phase 3. Treat as a directional bias, not a level call.",
    whyItMatters:
      "Phase 4 work shows financial fluctuations replacing some fundamental drivers, especially under crisis regimes.",
    historicalAnchor:
      "Mar 2020 COVID drawdown and 2H 2022 stagflation regime: EUA correlated more with risk assets than with gas alone.",
    references: [
      {
        label: "arXiv 2024 - Phase 4 determinant shift to financial fluctuations",
        url: "https://arxiv.org/abs/2406.05094",
        accessed: reviewedAt
      },
      {
        label: "TandF 2024 - speculation and carbon price predictability",
        url: "https://www.tandfonline.com/doi/abs/10.1080/1540496X.2024.2324194",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "eu-compliance-cbam-stack",
    marketIds: ["eu-ets"],
    name: "Compliance surrender season + CBAM importer demand",
    windowLabel: "Q1 surrender (Mar-Apr)",
    rarity: "common",
    expectedDirection: "higher",
    components: [
      {
        driverId: "eu_compliance",
        family: "Calendar Effects",
        variable: "Surrender deadline",
        sign: "tighten",
        threshold: "Within 6 weeks of 30-Apr surrender"
      },
      {
        driverId: "eu_auction_micro",
        family: "Market Microstructure",
        variable: "Auction coverage / bid-cover ratio",
        sign: "tighten",
        threshold: "Coverage > 2.5x at consecutive EEX auctions"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Watch EEX auction coverage and the futures-spot basis; compliance buyers compress shorter-dated tenors first.",
    whyItMatters:
      "Compliance seasonality remains a recurring liquidity and short-term demand pattern even as the market matures.",
    historicalAnchor:
      "Recurrent Mar-Apr basis tightening in 2018-2024.",
    references: [
      {
        label: "EU Commission - ETS Reporting Tool",
        url: "https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/monitoring-reporting-and-verification/ets-reporting-tool-ert_en",
        accessed: reviewedAt
      },
      {
        label: "EEX - EU ETS auctions",
        url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "kr-compliance-thin-liquidity",
    marketIds: ["k-ets"],
    name: "Compliance window + thin liquidity + offset substitution",
    windowLabel: "Feb-Mar K-ETS surrender",
    rarity: "common",
    expectedDirection: "ambiguous",
    components: [
      {
        driverId: "kr_compliance_deadline",
        family: "Calendar Effects",
        variable: "Verification & surrender timing",
        sign: "tighten",
        threshold: "Within 8 weeks of surrender deadline"
      },
      {
        driverId: "kr_offsets",
        family: "Internal Market",
        variable: "KCU / KOC volume share",
        sign: "loosen",
        threshold: "Offset share of compliance >10% of allowance volume"
      }
    ],
    interactionEffect: "offset",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Direction is genuinely ambiguous. Compliance demand pulls KAU; offset substitution dampens it. Watch KCU/KOC volume share more than nominal KAU print.",
    whyItMatters:
      "Korean resource-economics literature shows complementary credit prices and volumes became significant as the market matured.",
    historicalAnchor:
      "K-ETS Phase 2 and Phase 3 compliance windows: spread between KAU and KCU widened during high-substitution years.",
    references: [
      {
        label: "KRX ETS Information Platform",
        url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
        accessed: reviewedAt
      },
      {
        label: "KEREA 2018 - learning-by-doing in K-ETS pricing",
        url: "https://journal.resourceeconomics.or.kr/articles/article/oj4R/",
        accessed: reviewedAt
      },
      {
        label: "ICAP - Korea ETS overview",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "kr-policy-rate-fx-stack",
    marketIds: ["k-ets"],
    name: "MOE allocation announcement + KRW weakening + crude spike",
    windowLabel: "Allocation review or basic-plan publication",
    rarity: "watch",
    expectedDirection: "higher",
    components: [
      {
        driverId: "kr_allowance_balance",
        family: "Policy Supply",
        variable: "Allocation share / cap path",
        sign: "tighten",
        threshold: "MOE announces tighter allocation or auction share for next compliance year"
      },
      {
        family: "Macro and Financial",
        variable: "USD/KRW",
        sign: "tighten",
        threshold: "USD/KRW > 1y trailing 90th percentile"
      },
      {
        family: "Fuel Switching",
        variable: "Brent crude / Asian LNG",
        sign: "tighten",
        threshold: "Brent +15% over 30 trading days"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Korea is import-dependent; FX and crude pass-through can amplify a policy-tightening signal. Decompose drivers in walkforward to avoid double-counting.",
    whyItMatters:
      "Local evidence indicates exchange-rate and rate conditions become significant as the market internalizes trading experience.",
    historicalAnchor:
      "2022 KRW weakness coincident with Brent run-up and policy review pulled KAU spot higher into Q2 surrender.",
    references: [
      {
        label: "Korean MOE English press release - liquidity reform",
        url: "https://eng.me.go.kr/eng/web/board/read.do?boardId=1718360&boardMasterId=522&menuId=461",
        accessed: reviewedAt
      },
      {
        label: "ICAP - Korea ETS fourth Basic Plan measures",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "kr-banking-relaxation-stack",
    marketIds: ["k-ets"],
    name: "Banking rule relaxation + automatic stabilization signal",
    windowLabel: "Basic-plan or stabilization-rule revision",
    rarity: "rare",
    expectedDirection: "lower",
    components: [
      {
        driverId: "kr_banking",
        family: "Policy Supply",
        variable: "Carryover / banking ratio",
        sign: "loosen",
        threshold: "MOE relaxes carryover ratio or extends multi-year banking"
      },
      {
        driverId: "kr_market_stabilization",
        family: "Policy Supply",
        variable: "Stabilization mechanism trigger",
        sign: "loosen",
        threshold: "Mechanism activated to release reserve allowances"
      }
    ],
    interactionEffect: "amplify",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Both legs reduce intertemporal scarcity. Read as a structural softening, not a one-off; allocate weight slowly and watch market depth.",
    whyItMatters:
      "Phase 4 stabilization plus banking relaxation directly changes adjustment expectations.",
    historicalAnchor:
      "2024 K-ETS liquidity measures eased forced selling near the compliance window.",
    references: [
      {
        label: "ICAP - Korea ETS 2024 liquidity measures",
        url: "https://icapcarbonaction.com/en/ets/korea-emissions-trading-system-k-ets",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "cn-mee-sector-expansion",
    marketIds: ["cn-ets"],
    name: "MEE bulletin + sector expansion (cement/steel/aluminium)",
    windowLabel: "MEE policy bulletin",
    rarity: "watch",
    expectedDirection: "higher",
    components: [
      {
        family: "Policy Supply",
        variable: "MEE bulletin scope",
        sign: "tighten",
        threshold: "Bulletin formalises new compliance sector or tightens benchmark"
      },
      {
        family: "Market Microstructure",
        variable: "Shanghai daily trading volume",
        sign: "context",
        threshold: "Volume > 4-week trailing 75th percentile after bulletin"
      }
    ],
    interactionEffect: "regime-shift",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Sector expansion changes the demand pool, not just the price. Re-baseline volume analytics and treat pre-expansion histories as a different regime.",
    whyItMatters:
      "China's national market is bulletin-led; implementation speed and sector expansion are the structural catalysts.",
    historicalAnchor:
      "2024-2025 MEE bulletins broadening the compliance perimeter shifted the pricing regime versus 2021-2023 power-only baseline.",
    references: [
      {
        label: "MEE Carbon Market Feed",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
        accessed: reviewedAt
      },
      {
        label: "Shanghai Environment and Energy Exchange - daily overview",
        url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "cn-quota-distribution-delay",
    marketIds: ["cn-ets"],
    name: "Quota distribution delay + compliance window proximity",
    windowLabel: "Pre-compliance window",
    rarity: "watch",
    expectedDirection: "ambiguous",
    components: [
      {
        family: "Policy Supply",
        variable: "Quota distribution timing",
        sign: "context",
        threshold: "Public delay or postponement of provincial quota distribution"
      },
      {
        family: "Calendar Effects",
        variable: "Compliance window proximity",
        sign: "tighten",
        threshold: "Within 8 weeks of compliance window"
      }
    ],
    interactionEffect: "regime-shift",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "Volume drops and price compresses while the market waits for the bulletin. Avoid treating thin-tape moves as price discovery; watch the next MEE communication.",
    whyItMatters:
      "Operational delays change short-horizon liquidity even when fundamentals do not change.",
    historicalAnchor:
      "Multiple Chinese compliance windows have shown thin-tape compression preceding distribution clarification.",
    references: [
      {
        label: "MEE Carbon Market Feed",
        url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "shared-listed-proxy-divergence",
    marketIds: ["shared"],
    name: "Listed-proxy divergence vs official anchor",
    windowLabel: "Daily / intraday",
    rarity: "common",
    expectedDirection: "ambiguous",
    components: [
      {
        family: "Market Microstructure",
        variable: "ICE EUA front-month vs official close",
        sign: "context",
        threshold: "|gap| > 1y trailing 90th percentile for 2 consecutive sessions"
      },
      {
        family: "Market Microstructure",
        variable: "KRBN / CO2.L vs official close",
        sign: "context",
        threshold: "|gap| > 1y trailing 90th percentile for 2 consecutive sessions"
      }
    ],
    interactionEffect: "regime-shift",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "The proxy is an information channel, not the truth. Divergence persisting through a weekly cycle is the meaningful signal; daily noise is not.",
    whyItMatters:
      "Listed proxies offer accessibility and speed but can drift from the official market; tracking the gap is part of the operational read.",
    historicalAnchor:
      "Recurring 2023-2025 episodes where ICE EUA decoupled briefly from EEX auction outcomes around policy announcements.",
    references: [
      {
        label: "ICE - EUA futures contract",
        url: "https://www.ice.com/products/197",
        accessed: reviewedAt
      },
      {
        label: "EEX - EU ETS auctions",
        url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
        accessed: reviewedAt
      }
    ]
  },
  {
    id: "shared-multi-commodity-stress",
    marketIds: ["shared"],
    name: "Multi-commodity macro stress (gas + oil + power + FX)",
    windowLabel: "Macro regime shift",
    rarity: "rare",
    expectedDirection: "ambiguous",
    components: [
      {
        family: "Fuel Switching",
        variable: "TTF + Brent + Asian LNG",
        sign: "context",
        threshold: "All three +1σ over 30 trading days"
      },
      {
        family: "Macro and Financial",
        variable: "DXY / equity drawdown",
        sign: "context",
        threshold: "DXY > 1y high or STOXX 600 / KOSPI -8% peak-to-trough"
      },
      {
        family: "Power Complex",
        variable: "Cross-region clean spark spread",
        sign: "context",
        threshold: "Spreads diverge by >1.5σ across EU and Asia"
      }
    ],
    interactionEffect: "regime-shift",
    calibrationStatus: "heuristic",
    calibratedAt,
    playbook:
      "When this stack fires, single-driver readings stop being reliable for any of the three markets. Switch to regime-aware models with walk-forward calibration.",
    whyItMatters:
      "Cross-commodity stress is when the simple linear forecast breaks down; we record it explicitly so the UI can flag low-confidence regimes.",
    historicalAnchor:
      "2H 2022 European energy stress propagated into Asian LNG and KRW; carbon prices traded with a regime-different correlation structure.",
    references: [
      {
        label: "IEA - World Energy Outlook (annual)",
        url: "https://www.iea.org/reports/world-energy-outlook-2024",
        accessed: reviewedAt
      },
      {
        label: "World Bank - State and Trends of Carbon Pricing",
        url: "https://www.worldbank.org/en/programs/pricing-carbon",
        accessed: reviewedAt
      }
    ]
  }
];

/**
 * Default heuristic multipliers when a scenario does not yet carry a
 * calibrated value. These are explicitly documented placeholders, not
 * estimated parameters.
 */
export const HEURISTIC_INTERACTION_MULTIPLIERS = {
  amplify: 1.25,
  "regime-shift": 1.1,
  offset: 0.7
} as const;

export function getHeuristicInteractionMultiplier(scenario: CatalystScenario): {
  multiplier: number;
  status: CatalystScenario["calibrationStatus"];
} {
  if (
    typeof scenario.interactionMultiplier === "number" &&
    Number.isFinite(scenario.interactionMultiplier)
  ) {
    return {
      multiplier: scenario.interactionMultiplier,
      status: scenario.calibrationStatus
    };
  }
  return {
    multiplier: HEURISTIC_INTERACTION_MULTIPLIERS[scenario.interactionEffect],
    status: "heuristic"
  };
}

/**
 * Score the impact of a scenario given the user's current driver weights.
 * Pure linear weighting — auditable, NOT a calibrated price forecast.
 *
 * The multiplier is supplied by the caller so calibration overrides
 * compose cleanly without creating a circular import. See
 * `getInteractionMultiplier` in `catalystCalibration.ts` for the layered
 * resolver that prefers backtest-derived values when they exist.
 */
export function scoreScenarioFromDriverWeights(
  scenario: CatalystScenario,
  driverWeights: Record<string, number>,
  multiplierOverride?: number
): number {
  const driverContribs = scenario.components
    .map((component) => {
      if (!component.driverId) return 0;
      const weight = driverWeights[component.driverId];
      if (typeof weight !== "number" || Number.isNaN(weight)) return 0;
      const sign =
        component.sign === "tighten" ? 1 : component.sign === "loosen" ? -1 : 0.5;
      return weight * sign;
    })
    .reduce((sum, value) => sum + value, 0);

  const multiplier =
    typeof multiplierOverride === "number" && Number.isFinite(multiplierOverride)
      ? multiplierOverride
      : getHeuristicInteractionMultiplier(scenario).multiplier;
  return driverContribs * multiplier;
}
