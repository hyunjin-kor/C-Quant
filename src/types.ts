export type SourceLink = {
  label: string;
  url: string;
  accessed: string;
};

export type DriverImportance = "Core" | "High" | "Support";

export type DriverDirection = "higher" | "lower" | "context";

export type MarketDriver = {
  id: string;
  category: string;
  variable: string;
  importance: DriverImportance;
  direction: DriverDirection;
  weight: number;
  note: string;
  sources: SourceLink[];
};

export type MarketProfile = {
  id: "eu-ets" | "k-ets" | "cn-ets";
  name: string;
  region: string;
  stageNote: string;
  scopeNote: string;
  sourceNote: string;
  modelBlueprint: string[];
  drivers: MarketDriver[];
};

export type QuantIndicator = {
  id: string;
  name: string;
  family: string;
  bestFor: string;
  formula: string;
  whyItMatters: string;
  requiredColumns: string[];
};

export type BenchmarkPlatform = {
  id: string;
  name: string;
  category: string;
  strength: string;
  differentiator: string;
  source: SourceLink;
  featuresToBorrow: string[];
};

export type DataColumnSpec = {
  name: string;
  required: boolean;
  description: string;
  sourceHint: string;
};

export type MarketDatasetSchema = {
  id: string;
  marketId: MarketProfile["id"];
  name: string;
  filename: string;
  cadence: string;
  description: string;
  columns: DataColumnSpec[];
};

export type ConnectedSourceStatus = "connected" | "limited" | "error";

export type ConnectedSourceMetric = {
  label: string;
  value: string;
};

export type ConnectedSourceCard = {
  id: string;
  marketId: MarketProfile["id"];
  sourceName: string;
  coverage: string;
  sourceUrl: string;
  status: ConnectedSourceStatus;
  asOf: string;
  headline: string;
  summary: string;
  metrics: ConnectedSourceMetric[];
  notes: string[];
  links: SourceLink[];
};

export type ConnectedSourcePayload = {
  fetchedAt: string;
  cards: ConnectedSourceCard[];
  warnings: string[];
};

export type SourceRegistryMarket = MarketProfile["id"] | "shared";

export type SourceRegistryMethod =
  | "Official Web"
  | "Official File"
  | "Public API"
  | "Commercial API";

export type SourceRegistryItem = {
  id: string;
  title: string;
  markets: SourceRegistryMarket[];
  category: string;
  method: SourceRegistryMethod;
  url: string;
  appUse: string;
  whyItMatters: string;
  notes: string[];
};

export type TrustPrinciple = {
  id: string;
  title: string;
  description: string;
};

export type SubscriptionFeature = {
  id: string;
  title: string;
  audience: string;
  description: string;
};

export type MarketWatchItem = {
  id: string;
  title: string;
  category: string;
  role: string;
  url: string;
  note: string;
};

export type WalkForwardSummary = {
  rows: number;
  trainWindow: number;
  horizon: number;
  mae: number;
  rmse: number;
  mapePct: number;
  directionalAccuracyPct: number;
  latestClose: number;
  nextPrediction: number;
  lowerBand: number;
  upperBand: number;
};

export type FeatureImportance = {
  feature: string;
  importance: number;
};

export type WalkForwardResult = {
  summary: WalkForwardSummary;
  selectedFeatures: string[];
  topFeatures: FeatureImportance[];
  warnings: string[];
};

export type ForecastResult = {
  score: number;
  direction: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  contributions: Array<{
    driverId: string;
    variable: string;
    contribution: number;
  }>;
};

export type BacktestStrategy =
  | "trend"
  | "meanReversion"
  | "spreadRegime"
  | "policyMomentum";

export type ParsedSeriesPoint = {
  date: string;
  close: number;
  [key: string]: number | string;
};

export type BacktestMetrics = {
  totalReturnPct: number;
  annualizedReturnPct: number;
  annualizedVolPct: number;
  sharpe: number;
  maxDrawdownPct: number;
  winRatePct: number;
  exposurePct: number;
  tradeCount: number;
};

export type BacktestRun = {
  metrics: BacktestMetrics;
  equityCurve: number[];
  signals: number[];
  warnings: string[];
};
