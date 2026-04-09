import type {
  MarketWatchItem,
  SourceRegistryItem,
  SubscriptionFeature,
  TrustPrinciple
} from "../types";

const accessed = "2026-04-09";

export const trustPrinciples: TrustPrinciple[] = [
  {
    id: "official-first",
    title: "Official-first sourcing",
    description:
      "Price, policy, and market structure panels prioritize official exchange, ministry, and statistical releases."
  },
  {
    id: "freshness",
    title: "Freshness always visible",
    description:
      "Every market card shows the latest source date so users can distinguish live-like tape from event-driven updates."
  },
  {
    id: "boundary",
    title: "No execution, no brokerage",
    description:
      "The product supports research, monitoring, and alerts. It does not take orders or intermediate carbon allowance trades."
  },
  {
    id: "explainability",
    title: "Research before signal",
    description:
      "Signals are shown with required inputs and model warnings so users can understand why a number appears on screen."
  }
];

export const sourceRegistry: SourceRegistryItem[] = [
  {
    id: "eex-auctions",
    title: "EEX EU ETS Auctions",
    markets: ["eu-ets"],
    category: "Primary price source",
    method: "Official File",
    url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
    appUse: "EU primary auction price, volume, cover ratio, auction calendar",
    whyItMatters:
      "Official primary auction clears are the cleanest public source for EU allowance pricing and supply rhythm.",
    notes: [`Accessed ${accessed}. Public workbook and auction pages are available from EEX.`]
  },
  {
    id: "eex-datasource",
    title: "EEX Group DataSource REST API",
    markets: ["eu-ets"],
    category: "Premium market data",
    method: "Commercial API",
    url: "https://www.eex.com/fileadmin/EEX/Downloads/Market_Data/EEX_Group_DataSource/API/EEX_Group_DataSource_REST_API__v2__User_Guide_v004.pdf",
    appUse: "Future premium data route for fuller carbon market datasets",
    whyItMatters:
      "Useful commercial path when the product outgrows workbook-style ingestion and needs systematic exchange data delivery.",
    notes: [`Accessed ${accessed}. Official EEX REST API user guide PDF is publicly reachable.`]
  },
  {
    id: "entso-e",
    title: "ENTSO-E Transparency Platform",
    markets: ["eu-ets", "shared"],
    category: "Power fundamentals",
    method: "Public API",
    url: "https://www.entsoe.eu/data/transparency-platform/mop/",
    appUse: "EU power system context, generation, balancing, and power-market driver overlays",
    whyItMatters:
      "EU carbon pricing is tightly linked to the power complex, especially dispatch and thermal generation conditions.",
    notes: [`Accessed ${accessed}. Official ENTSO-E Manual of Procedures confirms extraction and consumer use workflows.`]
  },
  {
    id: "entsog",
    title: "ENTSOG Transparency API",
    markets: ["eu-ets", "shared"],
    category: "Gas fundamentals",
    method: "Public API",
    url: "https://transparency.entsog.eu/pdf/TP_REG715_Documentation_TP_API_v1.4.pdf",
    appUse: "European gas flow and infrastructure context for EUA fuel-switch monitoring",
    whyItMatters:
      "Gas availability and flow conditions shape clean spark spreads and carbon demand expectations.",
    notes: [`Accessed ${accessed}. Official ENTSOG documentation shows public JSON, XML, CSV, and XLSX endpoints.`]
  },
  {
    id: "eurostat-api",
    title: "Eurostat Statistics API",
    markets: ["eu-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/api",
    appUse: "Industrial production and macro overlays for EU allowance demand context",
    whyItMatters:
      "Industrial activity remains a major explanatory family for covered-sector compliance demand.",
    notes: [`Accessed ${accessed}. Official API guide confirms dataset query structure and filtering.`]
  },
  {
    id: "krx-ets",
    title: "KRX ETS Information Platform",
    markets: ["k-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    appUse: "K-ETS close, return, volume, instrument view, and rule references",
    whyItMatters:
      "This is the official Korean market interface for allowance pricing and venue-level market structure.",
    notes: [
      `Accessed ${accessed}. The app currently uses official web flow and form endpoints.`,
      "A stable public API was not independently confirmed from official documentation."
    ]
  },
  {
    id: "kosis-openapi",
    title: "KOSIS Open API",
    markets: ["k-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://kosis.kr/openapi/file/UseGuideV2_0.pdf",
    appUse: "Korean macro and industrial statistics for demand-side overlays",
    whyItMatters:
      "National industrial, manufacturing, and energy-related series are useful for Korean emissions-demand context.",
    notes: [`Accessed ${accessed}. Official KOSIS Open API guide PDF is publicly listed.`]
  },
  {
    id: "kma-openmet",
    title: "KMA Open MET Data Portal",
    markets: ["k-ets", "shared"],
    category: "Weather and climate",
    method: "Public API",
    url: "https://data.kma.go.kr/resources/html/en/aowdp.html",
    appUse: "Weather history and climate overlays for Korean demand and seasonality context",
    whyItMatters:
      "Weather affects heating, cooling, and power-demand conditions that can spill into allowance demand.",
    notes: [`Accessed ${accessed}. KMA states that Open MET provides downloadable data and open API services.`]
  },
  {
    id: "mee-report",
    title: "MEE Carbon Market Development Report 2025",
    markets: ["cn-ets"],
    category: "Policy and infrastructure",
    method: "Official File",
    url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
    appUse: "China market structure, data quality, infrastructure, and disclosure context",
    whyItMatters:
      "The report explains how the national market is governed, digitized, and disclosed, which is essential for trust.",
    notes: [`Accessed ${accessed}. MEE describes the national information network, trading system, and disclosure infrastructure.`]
  },
  {
    id: "cneeex-daily",
    title: "Shanghai Environment and Energy Exchange Daily Overview",
    markets: ["cn-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    appUse: "China national carbon market daily close, turnover, and cumulative trading statistics",
    whyItMatters:
      "The daily overview provides concrete market numbers from the official trading institution before a broader public API is confirmed.",
    notes: [
      `Accessed ${accessed}. The page states the trading institution publishes and supervises national carbon market transaction information.`,
      "Use with attribution because the page explicitly restricts unauthorized republication without source indication."
    ]
  }
];

export const subscriptionFeatures: SubscriptionFeature[] = [
  {
    id: "daily-brief",
    title: "Daily carbon brief",
    audience: "Subscriber",
    description:
      "Morning market summary with official feed changes, factor shifts, and a clean list of what changed by region."
  },
  {
    id: "driver-alerts",
    title: "Driver alerts",
    audience: "Subscriber",
    description:
      "Alert when auction clears, policy releases, or market-structure signals move outside normal ranges."
  },
  {
    id: "watchlists",
    title: "Saved watchlists",
    audience: "Subscriber",
    description:
      "Save markets, factor groups, and briefing layouts without crossing into brokerage or execution workflows."
  },
  {
    id: "weekly-memo",
    title: "Weekly strategy memo",
    audience: "Subscriber",
    description:
      "A slower research product that explains how policy, energy, and liquidity conditions changed during the week."
  }
];

export const marketWatchItems: MarketWatchItem[] = [
  {
    id: "ice-eua-official",
    title: "ICE EUA Futures",
    category: "Official futures venue",
    role: "Primary futures contract reference",
    url: "https://www.ice.com/products/197",
    note: "Official contract page for European Union Allowance futures."
  },
  {
    id: "eex-eu-auctions",
    title: "EEX EU ETS Auctions",
    category: "Official exchange page",
    role: "Primary auction and supply watch",
    url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
    note: "Use for auction clears, cover ratios, and calendar events."
  },
  {
    id: "krx-ets-watch",
    title: "KRX ETS Platform",
    category: "Official exchange page",
    role: "K-ETS tape and venue rules",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    note: "Official Korean allowance market screen and information platform."
  },
  {
    id: "cneeex-overview",
    title: "Shanghai Environment and Energy Exchange",
    category: "Official exchange page",
    role: "China daily market overview",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    note: "Official daily market overview page for the national carbon market."
  },
  {
    id: "krbn-official",
    title: "KRBN",
    category: "Official issuer page",
    role: "Global carbon ETF benchmark product",
    url: "https://kraneshares.com/krbn/",
    note: "KraneShares global carbon strategy ETF product page."
  },
  {
    id: "kcca-official",
    title: "KCCA",
    category: "Official issuer page",
    role: "California carbon allowance ETF",
    url: "https://kraneshares.com/etf/kcca/",
    note: "KraneShares California carbon allowance strategy ETF page."
  },
  {
    id: "keua-official",
    title: "KEUA",
    category: "Official issuer page",
    role: "European carbon allowance ETF",
    url: "https://kraneshares.com/etf/keua/",
    note: "KraneShares European carbon allowance strategy ETF page."
  },
  {
    id: "yahoo-krbn",
    title: "Yahoo KRBN",
    category: "External market watch",
    role: "Quick ETF chart and news check",
    url: "https://de.finance.yahoo.com/quote/KRBN/",
    note: "Use as an external watch page only, not as an internal licensed core data feed."
  },
  {
    id: "yahoo-keua",
    title: "Yahoo KEUA",
    category: "External market watch",
    role: "Quick EUA-focused ETF watch",
    url: "https://de.finance.yahoo.com/quote/KEUA/",
    note: "Useful for fast public chart checks of an EUA-focused product."
  },
  {
    id: "yahoo-co2",
    title: "Yahoo CO2.L",
    category: "External market watch",
    role: "SparkChange EUA ETC watch",
    url: "https://uk.finance.yahoo.com/quote/CO2.L/",
    note: "Useful for a listed carbon ETC watch page tied to EU allowance exposure."
  },
  {
    id: "yahoo-iceeua",
    title: "Yahoo ^ICEEUA",
    category: "External market watch",
    role: "ICE EUA carbon futures excess return watch",
    url: "https://uk.finance.yahoo.com/quote/%5EICEEUA/",
    note: "Useful as a public reference page for an ICE EUA carbon-linked index view."
  }
];
