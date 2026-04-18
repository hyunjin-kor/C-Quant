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
    title: "Official first",
    description:
      "Price anchors, market-structure notices, and exchange or ministry disclosures start from official publications."
  },
  {
    id: "freshness",
    title: "Show freshness",
    description:
      "Every market card surfaces source freshness and access method so scheduled releases stay separate from intraday listed feeds."
  },
  {
    id: "boundary",
    title: "No brokerage",
    description:
      "This desktop supports research, monitoring, and briefing. It does not route orders or intermediate carbon trades."
  },
  {
    id: "explainability",
    title: "Explain, then signal",
    description:
      "Drivers, source trust, and model warnings stay visible so operators can understand why the desk leans a certain way."
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
    appUse: "Primary EU carbon auction anchor, cover ratio, and auction calendar.",
    whyItMatters:
      "This is the cleanest official read on EU primary market pricing and near-term supply cadence.",
    notes: [`${accessed} confirmed. EEX publishes auction files and a dedicated auction page.`]
  },
  {
    id: "eex-datasource",
    title: "EEX Group DataSource REST API",
    markets: ["eu-ets"],
    category: "Premium market data",
    method: "Commercial API",
    url: "https://www.eex.com/fileadmin/EEX/Downloads/Market_Data/EEX_Group_DataSource/API/EEX_Group_DataSource_REST_API__v2__User_Guide_v004.pdf",
    appUse: "Future premium route for deeper exchange-grade market data integration.",
    whyItMatters:
      "If the product later needs a commercial exchange feed, this is the official EEX API path rather than a scraped workflow.",
    notes: [`${accessed} confirmed from the official EEX REST API user guide PDF.`]
  },
  {
    id: "entso-e",
    title: "ENTSO-E Transparency Platform",
    markets: ["eu-ets", "shared"],
    category: "Power fundamentals",
    method: "Public API",
    url: "https://www.entsoe.eu/data/transparency-platform/mop/",
    appUse: "EU power demand, generation mix, and system context for carbon demand interpretation.",
    whyItMatters:
      "EU carbon repricing is tightly linked to power-system conditions and thermal dispatch economics.",
    notes: [`${accessed} confirmed from ENTSO-E transparency documentation.`]
  },
  {
    id: "entsog",
    title: "ENTSOG Transparency API",
    markets: ["eu-ets", "shared"],
    category: "Gas fundamentals",
    method: "Public API",
    url: "https://transparency.entsog.eu/pdf/TP_REG715_Documentation_TP_API_v1.4.pdf",
    appUse: "Gas-system context for fuel-switching and clean spark spread monitoring.",
    whyItMatters:
      "Gas fundamentals change marginal power economics and therefore short-term carbon demand signals.",
    notes: [`${accessed} confirmed from the official API documentation.`]
  },
  {
    id: "eurostat-api",
    title: "Eurostat Statistics API",
    markets: ["eu-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/api",
    appUse: "Macro and industrial statistics for broader demand and growth context.",
    whyItMatters:
      "Industrial activity remains a relevant explanatory layer for compliance demand outside the power sector.",
    notes: [`${accessed} confirmed from the official Eurostat API getting started guide.`]
  },
  {
    id: "ghg-protocol-corporate",
    title: "GHG Protocol Corporate Standard",
    markets: ["shared"],
    category: "Accounting standard",
    method: "Official File",
    url: "https://ghgprotocol.org/corporate-standard",
    appUse:
      "Scope 1, 2, and 3 accounting boundary, inventory logic, and disclosure framing for the accounting sidecar.",
    whyItMatters:
      "Any all-in-one carbon decision platform that touches accounting needs a trusted emissions-accounting standard before dashboards or memos start to imply precision.",
    notes: [`${accessed} confirmed from the official GHG Protocol corporate standard page.`]
  },
  {
    id: "krx-ets",
    title: "KRX ETS Information Platform",
    markets: ["k-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    appUse: "Official K-ETS close, volume, active line, and market notices.",
    whyItMatters:
      "This is the primary official entry point for domestic carbon pricing and market-structure checks.",
    notes: [
      `${accessed} confirmed. The current product uses the official web flow and sample endpoints only.`,
      "Official documentation does not confirm an unrestricted public production API for broad commercial use."
    ]
  },
  {
    id: "kosis-openapi",
    title: "KOSIS Open API",
    markets: ["k-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://kosis.kr/openapi/file/UseGuideV2_0.pdf",
    appUse: "Domestic macro and industrial statistics for the Korean factor layer.",
    whyItMatters:
      "K-ETS demand interpretation benefits from official industrial and macro series rather than offshore proxy signals alone.",
    notes: [`${accessed} confirmed from the official KOSIS Open API guide PDF.`]
  },
  {
    id: "kma-openmet",
    title: "KMA Open MET Data Portal",
    markets: ["k-ets", "shared"],
    category: "Weather and climate",
    method: "Public API",
    url: "https://data.kma.go.kr/resources/html/en/aowdp.html",
    appUse: "Weather context for demand swings, power burn, and seasonal risk.",
    whyItMatters:
      "Weather shifts electricity demand and can materially change allowance demand through thermal generation.",
    notes: [`${accessed} confirmed from the KMA Open MET data portal documentation.`]
  },
  {
    id: "mee-report",
    title: "MEE Carbon Market Development Report 2025",
    markets: ["cn-ets"],
    category: "Policy and infrastructure",
    method: "Official File",
    url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
    appUse: "National market structure, policy context, and reporting workflow for China ETS.",
    whyItMatters:
      "China ETS needs a policy and infrastructure layer because the official daily tape is more limited than EU or Korea.",
    notes: [`${accessed} confirmed from the official MEE report PDF.`]
  },
  {
    id: "cneeex-daily",
    title: "Shanghai Environment and Energy Exchange Daily Overview",
    markets: ["cn-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    appUse: "Daily official close, turnover, and bulletin-style market overview for the national ETS.",
    whyItMatters:
      "When there is no confirmed public production API, the official exchange bulletin remains the most defensible primary price read.",
    notes: [
      `${accessed} confirmed. The exchange publishes daily market-overview pages for the national carbon market.`,
      "Because reuse language is restrictive, the app should show source attribution clearly and avoid implying a public API."
    ]
  },
  {
    id: "verra-registry",
    title: "Verra Registry Overview",
    markets: ["shared"],
    category: "Registry verification",
    method: "Official Web",
    url: "https://verra.org/registry/overview/",
    appUse:
      "Project status, issuance, retirement, and document checks for voluntary-credit diligence and retirement-proof review.",
    whyItMatters:
      "Registry state and retirement trace are core verification rails when the desk moves from market monitoring into integrity-aware procurement support.",
    notes: [`${accessed} confirmed from the official Verra registry overview page.`]
  },
  {
    id: "gold-standard-impact-registry",
    title: "Gold Standard Impact Registry",
    markets: ["shared"],
    category: "Registry verification",
    method: "Official Web",
    url: "https://www.goldstandard.org/impact-registry",
    appUse:
      "Track project status, issuance, transfer, retirement, and Article 6 labeling on Gold Standard credits.",
    whyItMatters:
      "The registry gives a public lifecycle record for issued credits and supports diligence, retirement trace, and disclosure checks.",
    notes: [`${accessed} confirmed from the official Gold Standard registry page.`]
  }
];

export const subscriptionFeatures: SubscriptionFeature[] = [
  {
    id: "daily-brief",
    title: "Daily carbon brief",
    audience: "Subscriber",
    description:
      "A concise daily read on official anchor moves, comparison tape shifts, and confidence changes."
  },
  {
    id: "driver-alerts",
    title: "Driver alerts",
    audience: "Subscriber",
    description:
      "Alerts when auctions, policy notices, market-structure events, or core drivers move outside the expected range."
  },
  {
    id: "watchlists",
    title: "Custom watchlists",
    audience: "Subscriber",
    description:
      "Persistent watch surfaces for markets, drivers, and briefs tailored to the operator's decision flow."
  },
  {
    id: "weekly-memo",
    title: "Weekly desk memo",
    audience: "Subscriber",
    description:
      "A research memo that explains how policy, energy, liquidity, and source trust changed over the week."
  }
];

export const marketWatchItems: MarketWatchItem[] = [
  {
    id: "ice-eua-official",
    title: "ICE EUA Futures",
    category: "Official futures venue",
    role: "Primary listed hedge for EU carbon",
    url: "https://www.ice.com/products/197",
    note: "Official futures product page for the benchmark European carbon contract."
  },
  {
    id: "eex-eu-auctions",
    title: "EEX EU ETS Auctions",
    category: "Official exchange page",
    role: "Primary auction and supply monitoring",
    url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
    note: "Use for official auction results, cover, and calendar checks."
  },
  {
    id: "krx-ets-watch",
    title: "KRX ETS Platform",
    category: "Official exchange page",
    role: "K-ETS tape and market rules",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    note: "Official K-ETS market-information page for price, volume, and notice review."
  },
  {
    id: "cneeex-overview",
    title: "Shanghai Environment and Energy Exchange",
    category: "Official exchange page",
    role: "China ETS daily bulletin",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    note: "Official daily market-overview page for the national China carbon market."
  },
  {
    id: "krbn-official",
    title: "KRBN",
    category: "Official issuer page",
    role: "Global carbon ETF reference",
    url: "https://kraneshares.com/krbn/",
    note: "Issuer page for the global carbon ETF used as a listed comparison proxy."
  },
  {
    id: "kcca-official",
    title: "KCCA",
    category: "Official issuer page",
    role: "California carbon ETF reference",
    url: "https://kraneshares.com/etf/kcca/",
    note: "Issuer page for the California carbon ETF."
  },
  {
    id: "keua-official",
    title: "KEUA",
    category: "Official issuer page",
    role: "Europe carbon ETF reference",
    url: "https://kraneshares.com/etf/keua/",
    note: "Issuer page for the Europe carbon ETF."
  },
  {
    id: "yahoo-krbn",
    title: "Yahoo KRBN",
    category: "External market watch",
    role: "Fast comparison chart",
    url: "https://finance.yahoo.com/quote/KRBN/",
    note: "Use only as a free comparison chart, not as an official carbon source."
  },
  {
    id: "yahoo-keua",
    title: "Yahoo KEUA",
    category: "External market watch",
    role: "Fast comparison chart",
    url: "https://finance.yahoo.com/quote/KEUA/",
    note: "Use only as a free comparison chart, not as an official carbon source."
  },
  {
    id: "yahoo-co2",
    title: "Yahoo CO2.L",
    category: "External market watch",
    role: "Fast comparison chart",
    url: "https://finance.yahoo.com/quote/CO2.L/",
    note: "Use only as a free comparison chart, not as an official carbon source."
  },
  {
    id: "yahoo-iceeua",
    title: "Yahoo ^ICEEUA",
    category: "External market watch",
    role: "Fast comparison chart",
    url: "https://finance.yahoo.com/quote/%5EICEEUA/",
    note: "Use only as a free comparison chart, not as an official carbon source."
  }
];
