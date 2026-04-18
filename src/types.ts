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

export type ConnectedSourcePayload = {
  fetchedAt: string;
  cards: ConnectedSourceCard[];
  liveQuotes: MarketLiveQuote[];
  warnings: string[];
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

export type DecisionAssistantStance =
  | "Buy Bias"
  | "Hold / Wait"
  | "Reduce Bias";

export type DecisionReasonItem = {
  title: string;
  detail: string;
};

export type DecisionAssistantResponse = {
  provider: "rule" | "openai" | "ollama";
  model?: string;
  stance: DecisionAssistantStance;
  confidence: number;
  summary: string;
  thesis: string[];
  risks: string[];
  actions: string[];
  supportingEvidence: DecisionReasonItem[];
  counterEvidence: DecisionReasonItem[];
  dataHealth: string[];
  checkpoints: string[];
  operatorBrief: Array<{
    title: string;
    summary: string;
    bullets: string[];
  }>;
  disclaimer: string;
  generatedAt: string;
};

export type AppSettings = {
  hasOpenAIApiKey: boolean;
  llmModel: string;
};

export type LocalLlmModel = {
  name: string;
  model: string;
  modifiedAt: string;
  size: number;
  digest: string;
  family: string;
  parameterSize: string;
  quantizationLevel: string;
};

export type LocalLlmState = {
  available: boolean;
  installed?: boolean;
  reachable?: boolean;
  cliVersion?: string;
  baseUrl: string;
  selectedModel: string;
  models: LocalLlmModel[];
  error?: string;
};

export type LocalChatRole = "user" | "assistant";

export type ChatGroundingKind =
  | "Official anchor"
  | "Official context"
  | "Listed comparison"
  | "Source freshness"
  | "Key driver";

export type ChatGroundingItem = {
  id: string;
  kind: ChatGroundingKind;
  label: string;
  detail: string;
  asOf?: string;
  url?: string;
};

export type LocalChatMessage = {
  id: string;
  role: LocalChatRole;
  content: string;
  createdAt: string;
  model?: string;
  status?: "pending" | "done" | "error";
  grounding?: ChatGroundingItem[];
  boundaryNote?: string;
};

export type LocalChatResponse = {
  provider: "ollama";
  model: string;
  content: string;
  generatedAt: string;
  grounding: ChatGroundingItem[];
  boundaryNote: string;
  doneReason?: string;
  totalDurationMs?: number;
  loadDurationMs?: number;
  promptEvalCount?: number;
  evalCount?: number;
};
