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
  implementedAs?: string[];
};

export type OpenSourceBenchmark = {
  id: string;
  name: string;
  category: string;
  verifiedCapability: string;
  adaptForCQuant: string;
  boundaryNote: string;
  llmUse: string;
  source: SourceLink;
};

export type LifecycleStageStatus = "done" | "active" | "queued" | "warning";

export type CreditLifecycleStage = {
  id: string;
  label: string;
  status: LifecycleStageStatus;
  note: string;
};

export type RegistryDocumentStatus = "fresh" | "watch" | "stale";

export type RegistryDocument = {
  id: string;
  title: string;
  docType: string;
  publishedAt: string;
  status: RegistryDocumentStatus;
  note: string;
  source: SourceLink;
};

export type CreditLifecycleDossier = {
  id: string;
  title: string;
  markets: Array<MarketProfile["id"] | "shared">;
  registryTrackId: string;
  registry: string;
  projectType: string;
  region: string;
  currentRead: string;
  operatorUse: string;
  source: SourceLink;
  stages: CreditLifecycleStage[];
  documents: RegistryDocument[];
};

export type NatureRiskComponent = {
  label: string;
  value: number;
  note: string;
};

export type NatureRiskOverlay = {
  id: string;
  dossierId: string;
  markets: Array<MarketProfile["id"] | "shared">;
  title: string;
  region: string;
  posture: string;
  summary: string;
  source: SourceLink;
  components: NatureRiskComponent[];
  watchItems: string[];
};

export type RegistryOperationsHealth = "healthy" | "watch" | "blocked";

export type RegistryOperationsTrack = {
  id: string;
  registry: string;
  markets: Array<MarketProfile["id"] | "shared">;
  accessMethod: string;
  refreshCadence: string;
  freshnessSla: string;
  lastReviewed: string;
  status: RegistryOperationsHealth;
  operatorRead: string;
  steps: CreditLifecycleStage[];
  watchItems: string[];
  blockers: string[];
  source: SourceLink;
};

export type MarketInputFieldPriority = "Core" | "Support";

export type MarketInputField = {
  name: string;
  priority: MarketInputFieldPriority;
  description: string;
  sourceHint: string;
};

export type MarketInputBlock = {
  id: string;
  marketId: MarketProfile["id"];
  title: string;
  accessMethod: string;
  refreshCadence: string;
  purpose: string;
  fields: MarketInputField[];
};

export type ConnectedSourceStatus = "connected" | "limited" | "error";

export type ConnectedSourceMetric = {
  label: string;
  value: string;
};

export type ConnectedSourceSeriesPoint = {
  date: string;
  value: number;
  volume?: number;
  label?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
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
  series?: ConnectedSourceSeriesPoint[];
  seriesLabel?: string;
  volumeSeries?: ConnectedSourceSeriesPoint[];
};

export type MacroSeriesPoint = { date: string; value: number };

/**
 * Optional macro / cross-market series consumed by the catalyst trigger
 * detector when a scenario component references FX or inflation. Today
 * we wire EUR/USD daily and HICP YoY from ECB SDW; more series can be
 * added as they become inputs to specific scenarios. Display on the
 * Sources surface uses the same data — see App.tsx ECB fetch effect.
 */
export type MacroPayload = {
  eurUsd?: MacroSeriesPoint[];
  hicpYoY?: MacroSeriesPoint[];
  usdKrw?: MacroSeriesPoint[];
  usdCny?: MacroSeriesPoint[];
};

export type ConnectedSourcePayload = {
  fetchedAt: string;
  cards: ConnectedSourceCard[];
  liveQuotes: MarketLiveQuote[];
  warnings: string[];
  macroSeries?: MacroPayload;
};

export type MarketLiveQuoteKind = "Benchmark futures" | "Driver future" | "Listed proxy";

export type MarketLiveQuote = {
  id: string;
  title: string;
  symbol: string;
  category: MarketLiveQuoteKind;
  markets: Array<MarketProfile["id"] | "shared">;
  status: ConnectedSourceStatus;
  provider: string;
  sourceUrl: string;
  role: string;
  note: string;
  delayNote: string;
  asOf: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
  exchange: string;
  series: ConnectedSourceSeriesPoint[];
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

export type WorkspacePreset = {
  id: string;
  title: string;
  summary: string;
  objective: string;
  moduleLabels: string[];
  benchmarkIds: string[];
  recommendedMarket: SourceRegistryMarket;
};

export type WatchlistPreset = {
  id: string;
  title: string;
  summary: string;
  itemIds: string[];
  benchmarkIds: string[];
};

export type WatchViewPreset = {
  id: string;
  title: string;
  summary: string;
  columns: string[];
};

export type AlertTemplate = {
  id: string;
  title: string;
  scope: string;
  trigger: string;
  delivery: string;
  severity: "High" | "Medium" | "Low";
  benchmarkId: string;
  enabledByDefault: boolean;
};

export type CatalystWindow = {
  id: string;
  marketId: SourceRegistryMarket;
  windowLabel: string;
  title: string;
  trigger: string;
  whyItMatters: string;
  source: SourceLink;
};

export type AutonomousPlanStep = {
  id: string;
  timeBlock: string;
  title: string;
  goal: string;
  outputs: string[];
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

export type CatalystTriggerSign = "tighten" | "loosen" | "context";

export type CatalystComponent = {
  driverId?: string;
  family: string;
  variable: string;
  sign: CatalystTriggerSign;
  threshold: string;
};

export type CatalystInteractionEffect = "amplify" | "offset" | "regime-shift";

export type CatalystCalibrationStatus = "heuristic" | "backtest" | "calibrated";

export type CatalystScenario = {
  id: string;
  marketIds: Array<MarketProfile["id"] | "shared">;
  name: string;
  windowLabel: string;
  rarity: "common" | "watch" | "rare";
  expectedDirection: "higher" | "lower" | "ambiguous";
  components: CatalystComponent[];
  interactionEffect: CatalystInteractionEffect;
  /**
   * Per-scenario interaction multiplier. When omitted, the scoring layer
   * falls back to a documented heuristic. A non-null value should be
   * traceable to a backtest or calibration run.
   */
  interactionMultiplier?: number;
  /**
   * Provenance of the multiplier. "heuristic" means the value is a
   * placeholder; "backtest" means it was tuned against historical events;
   * "calibrated" means it was both backtested and reviewed.
   */
  calibrationStatus: CatalystCalibrationStatus;
  /** ISO date when the multiplier was last reviewed. */
  calibratedAt?: string;
  playbook: string;
  whyItMatters: string;
  historicalAnchor: string;
  references: SourceLink[];
};

export type MaterialResearchType =
  | "carbon-capture"
  | "low-carbon-fuel"
  | "industrial-decarb"
  | "nature-based"
  | "removal";

export type MaterialResearchReadiness = "lab" | "pilot" | "early-deploy" | "scale";

export type CatalystEventConfidence = "verified" | "reported" | "context";

export type CatalystEvent = {
  id: string;
  scenarioId: string;
  marketId: MarketProfile["id"] | "shared";
  /** ISO date when the catalyst was effectively observable (publication / observed flip). */
  observedAt: string;
  /** Short label, used in tooltips and time-line bars. */
  label: string;
  brief: string;
  /** Confidence of the event-window evidence. */
  confidence: CatalystEventConfidence;
  references: SourceLink[];
};

export type CatalystCalibrationRecord = {
  scenarioId: string;
  multiplier: number;
  status: CatalystCalibrationStatus;
  observations: number;
  meanAbsReturn: number | null;
  hitRate: number | null;
  reviewedAt: string;
  notes: string;
};

export type ResearchCitationKind =
  | "peer-reviewed"
  | "working-paper"
  | "official-report"
  | "central-bank"
  | "policy-document"
  | "industry-report";

export type ResearchEvidenceStrength =
  | "strong"        // multiple peer-reviewed studies converge
  | "moderate"      // one peer-reviewed paper + corroboration
  | "exploratory";  // single working paper or single methodology

export type ResearchVariableMapping = {
  /** Variable as the paper names it. */
  variableLabel: string;
  /** Mapping to a C-Quant driver id when applicable. */
  driverId?: string;
  /** Sign of the effect on the carbon price. */
  expectedSign: "+" | "-" | "context";
  /** Quantitative anchor where the paper reports one. */
  quantitativeAnchor?: string;
  /** Sample period used in the source. */
  samplePeriod?: string;
};

export type ResearchPaper = {
  id: string;
  /** Markets the paper informs. */
  markets: Array<MarketProfile["id"] | "shared">;
  citation: string;
  authors: string[];
  year: number;
  venue: string;
  url: string;
  kind: ResearchCitationKind;
  /** Concise summary of the paper's headline finding. */
  finding: string;
  /** Variables the paper studies, mapped to C-Quant drivers. */
  variables: ResearchVariableMapping[];
  /** Open-data sources the paper references. */
  dataSources: SourceLink[];
  evidenceStrength: ResearchEvidenceStrength;
  /** Whether the paper is fully open-access (PDF reachable without login). */
  openAccess: boolean;
  reviewedAt: string;
};

export type DriverGap = {
  /** Variable family the literature emphasises. */
  family: string;
  /** Variable label as the literature uses it. */
  variable: string;
  marketIds: Array<MarketProfile["id"] | "shared">;
  /** Why the variable is important per the literature. */
  rationale: string;
  /** Suggested public data source. */
  suggestedSource?: SourceLink;
  /** Supporting paper IDs from the research catalogue. */
  supportingPaperIds: string[];
  status: "missing" | "underweighted" | "needs-recheck";
};

export type MaterialResearchEntry = {
  id: string;
  name: string;
  type: MaterialResearchType;
  readiness: MaterialResearchReadiness;
  abatementPotential: string;
  costPerTon: string;
  marketRelevance: string;
  scopeNote: string;
  references: SourceLink[];
  verified: boolean;
  reviewedAt: string;
};
