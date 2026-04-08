import type { MarketDatasetSchema } from "../types";

function buildTemplate(schema: MarketDatasetSchema): string {
  return `${schema.columns.map((column) => column.name).join(",")}\n`;
}

export const marketDatasetSchemas: MarketDatasetSchema[] = [
  {
    id: "eu-ets-daily",
    marketId: "eu-ets",
    name: "EU ETS Daily Feature Store",
    filename: "eu_ets_daily_template.csv",
    cadence: "Daily",
    description:
      "Canonical daily training table for EU allowances, fuel switching, auction supply, and macro stress.",
    columns: [
      { name: "date", required: true, description: "Trading date", sourceHint: "Exchange calendar" },
      { name: "close", required: true, description: "EUA close price", sourceHint: "ICE / EEX" },
      { name: "volume", required: true, description: "Daily traded volume", sourceHint: "ICE / broker feed" },
      { name: "auction_cover", required: false, description: "Auction cover ratio", sourceHint: "EEX auctions" },
      { name: "ttf_gas", required: true, description: "TTF gas front-month or prompt proxy", sourceHint: "Gas data vendor" },
      { name: "power_price", required: true, description: "Power day-ahead or front contract", sourceHint: "EPEX / power vendor" },
      { name: "coal_price", required: true, description: "Rotterdam coal proxy", sourceHint: "Coal vendor" },
      { name: "brent", required: false, description: "Brent crude", sourceHint: "Commodity vendor" },
      { name: "industrial_output", required: false, description: "Industrial activity index", sourceHint: "Eurostat / macro vendor" },
      { name: "weather_index", required: false, description: "Temperature or residual load proxy", sourceHint: "Weather provider" },
      { name: "open_interest", required: false, description: "Futures open interest", sourceHint: "ICE" },
      { name: "policy_flag", required: false, description: "1 on major policy supply event dates", sourceHint: "Manual event calendar" }
    ]
  },
  {
    id: "k-ets-daily",
    marketId: "k-ets",
    name: "K-ETS Daily Feature Store",
    filename: "k_ets_daily_template.csv",
    cadence: "Daily",
    description:
      "Canonical daily training table for KAU pricing, offset markets, compliance seasonality, and liquidity regime.",
    columns: [
      { name: "date", required: true, description: "Trading date", sourceHint: "KRX calendar" },
      { name: "close", required: true, description: "KAU close price", sourceHint: "KRX ETS" },
      { name: "volume", required: true, description: "Daily traded volume", sourceHint: "KRX ETS" },
      { name: "kcu_close", required: false, description: "KCU close", sourceHint: "KRX ETS" },
      { name: "koc_close", required: false, description: "KOC close", sourceHint: "KRX ETS / registry bridge" },
      { name: "auction_cover", required: false, description: "Auction bid ratio", sourceHint: "MOE / KRX auction release" },
      { name: "wti", required: false, description: "WTI crude proxy", sourceHint: "Commodity vendor" },
      { name: "usdkrw", required: false, description: "USD/KRW exchange rate", sourceHint: "FX vendor" },
      { name: "call_rate", required: false, description: "Korean call rate", sourceHint: "BoK" },
      { name: "kospi", required: false, description: "Domestic equity proxy", sourceHint: "KRX" },
      { name: "compliance_flag", required: false, description: "1 in compliance-reporting window", sourceHint: "Manual calendar" },
      { name: "policy_flag", required: false, description: "1 on market reform event dates", sourceHint: "MOE event calendar" }
    ]
  },
  {
    id: "cn-ets-daily",
    marketId: "cn-ets",
    name: "China National ETS Daily Feature Store",
    filename: "cn_ets_daily_template.csv",
    cadence: "Daily",
    description:
      "Canonical daily training table for national ETS pricing, coal-power linkage, and policy expansion events.",
    columns: [
      { name: "date", required: true, description: "Trading date", sourceHint: "National market calendar" },
      { name: "close", required: true, description: "National carbon close", sourceHint: "National market data feed" },
      { name: "volume", required: true, description: "Daily traded volume", sourceHint: "National market data feed" },
      { name: "coal_price", required: true, description: "Coal benchmark", sourceHint: "Commodity vendor" },
      { name: "lng_price", required: false, description: "LNG / gas proxy", sourceHint: "Commodity vendor" },
      { name: "power_price", required: false, description: "Electricity spot proxy", sourceHint: "Power market feed" },
      { name: "aqi", required: false, description: "Air quality index proxy", sourceHint: "Environmental data provider" },
      { name: "industrial_index", required: false, description: "Industrial activity proxy", sourceHint: "Exchange / macro vendor" },
      { name: "allocation_intensity", required: false, description: "Allowance intensity or rule proxy", sourceHint: "Policy normalization layer" },
      { name: "sector_expansion_flag", required: false, description: "1 around expansion milestones", sourceHint: "MEE event calendar" },
      { name: "policy_flag", required: false, description: "1 on major implementation event dates", sourceHint: "MEE event calendar" }
    ]
  }
];

export const datasetTemplates = Object.fromEntries(
  marketDatasetSchemas.map((schema) => [schema.id, buildTemplate(schema)])
) as Record<string, string>;
