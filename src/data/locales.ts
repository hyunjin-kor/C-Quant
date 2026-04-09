import type {
  AlertTemplate,
  AutonomousPlanStep,
  BenchmarkPlatform,
  CatalystWindow,
  DriverImportance,
  MarketWatchItem,
  SourceRegistryItem,
  SubscriptionFeature,
  TrustPrinciple,
  WatchViewPreset,
  WatchlistPreset,
  WorkspacePreset
} from "../types";

export type AppLocale = "ko" | "en";

export const localeOptions: Array<{ id: AppLocale; label: string }> = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" }
];

type UiCopy = {
  windowSubtitle: string;
  appTagline: string;
  screensLabel: string;
  marketsLabel: string;
  savedWorkspaceLabel: string;
  watchlistLabel: string;
  selectedMarketLabel: string;
  todayStatusLabel: string;
  activeAlertCountLabel: string;
  workspaceBlueprintLabel: string;
  trustPrinciplesLabel: string;
  noCardConnected: string;
  pendingOfficialSource: string;
  officialStatus: string;
  notAvailable: string;
  activeTemplates: string;
  inboxNow: string;
  briefFormat: string;
  saveDailyBrief: string;
  saveTemplate: string;
  csvChoose: string;
  noFileChosen: string;
  runWalkForward: string;
  runningModel: string;
  pickCsv: string;
  runBacktest: string;
  loadCsv: string;
  resetScenario: string;
  direction: string;
  score: string;
  confidence: string;
  market: string;
  trainWindow: string;
  horizon: string;
  strategy: string;
  feeBps: string;
  lastOfficialRefresh: string;
  refreshOfficialSources: string;
  refreshingOfficialSources: string;
  marketVolume: string;
  marketUpdated: string;
  currentStateEmpty: string;
  dailyBriefTitle: string;
  dailyBriefSummary: string;
  emptyAlerts: string;
  scenarioModelBoundary: string;
  required: string;
  optional: string;
  requiredColumns: string;
  enabled: string;
  disabled: string;
  briefingLabel: string;
  focusSourceLabel: string;
  officialMarketBoardLabel: string;
  focusDriversLabel: string;
  activeAlertsLabel: string;
  generatedAt: string;
  focusMarket: string;
  errorRefreshSources: string;
  errorDesktopOnlyWalkForward: string;
  errorPickCsvDesktopOnly: string;
  errorChooseCsvFirst: string;
};

const uiCopy: Record<AppLocale, UiCopy> = {
  ko: {
    windowSubtitle: "탄소 인텔리전스 터미널",
    appTagline: "거래는 밖에서, 판단은 여기서.",
    screensLabel: "화면",
    marketsLabel: "시장",
    savedWorkspaceLabel: "저장된 워크스페이스",
    watchlistLabel: "워치리스트",
    selectedMarketLabel: "선택 시장",
    todayStatusLabel: "오늘의 상태",
    activeAlertCountLabel: "활성 알림 기준으로 지금 확인할 항목 수입니다.",
    workspaceBlueprintLabel: "워크스페이스 원형",
    trustPrinciplesLabel: "신뢰 원칙",
    noCardConnected: "공식 카드가 아직 연결되지 않았습니다.",
    pendingOfficialSource: "공식 소스 대기",
    officialStatus: "공식 상태",
    notAvailable: "미연결",
    activeTemplates: "활성 템플릿",
    inboxNow: "현재 인박스",
    briefFormat: "브리프 포맷",
    saveDailyBrief: "오늘의 브리프 저장",
    saveTemplate: "템플릿 저장",
    csvChoose: "CSV 선택",
    noFileChosen: "선택된 파일 없음",
    runWalkForward: "워크포워드 실행",
    runningModel: "실행 중...",
    pickCsv: "CSV 불러오기",
    runBacktest: "백테스트 실행",
    loadCsv: "CSV 불러오기",
    resetScenario: "초기화",
    direction: "방향",
    score: "점수",
    confidence: "신뢰도",
    market: "시장",
    trainWindow: "학습 윈도우",
    horizon: "예측 구간",
    strategy: "전략",
    feeBps: "비용(bps)",
    lastOfficialRefresh: "마지막 공식 갱신",
    refreshOfficialSources: "공식 소스 새로고침",
    refreshingOfficialSources: "새로고침 중...",
    marketVolume: "거래량",
    marketUpdated: "갱신",
    currentStateEmpty: "현재 조건에서 띄울 알림이 없습니다.",
    dailyBriefTitle: "바로 저장 가능한 구독형 브리프",
    dailyBriefSummary: "패키지된 앱에서는 텍스트 브리프를 바로 저장할 수 있습니다.",
    emptyAlerts: "현재 활성 알림 없음",
    scenarioModelBoundary: "모델은 참고용이며, 실거래용 가격 목표를 보장하지 않습니다.",
    required: "필수",
    optional: "선택",
    requiredColumns: "필요 컬럼",
    enabled: "켜짐",
    disabled: "꺼짐",
    briefingLabel: "오늘의 브리프",
    focusSourceLabel: "중심 출처",
    officialMarketBoardLabel: "공식 시장 보드",
    focusDriversLabel: "핵심 드라이버",
    activeAlertsLabel: "활성 알림",
    generatedAt: "생성 시각",
    focusMarket: "중심 시장",
    errorRefreshSources: "공식 소스 새로고침은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorDesktopOnlyWalkForward: "워크포워드 실행은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorPickCsvDesktopOnly: "CSV 불러오기는 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorChooseCsvFirst: "먼저 CSV 파일을 선택해 주세요."
  },
  en: {
    windowSubtitle: "Carbon intelligence terminal",
    appTagline: "Trade elsewhere. Decide here.",
    screensLabel: "Screens",
    marketsLabel: "Markets",
    savedWorkspaceLabel: "Saved Workspaces",
    watchlistLabel: "Watchlists",
    selectedMarketLabel: "Selected Market",
    todayStatusLabel: "Today",
    activeAlertCountLabel: "Number of items that need attention right now.",
    workspaceBlueprintLabel: "Workspace Blueprint",
    trustPrinciplesLabel: "Trust Principles",
    noCardConnected: "No official card is connected yet.",
    pendingOfficialSource: "Waiting for official source",
    officialStatus: "Official status",
    notAvailable: "Unavailable",
    activeTemplates: "Active Templates",
    inboxNow: "Inbox",
    briefFormat: "Brief Format",
    saveDailyBrief: "Save Daily Brief",
    saveTemplate: "Save Template",
    csvChoose: "Choose CSV",
    noFileChosen: "No file selected",
    runWalkForward: "Run Walk-forward",
    runningModel: "Running...",
    pickCsv: "Load CSV",
    runBacktest: "Run Backtest",
    loadCsv: "Load CSV",
    resetScenario: "Reset",
    direction: "Direction",
    score: "Score",
    confidence: "Confidence",
    market: "Market",
    trainWindow: "Train Window",
    horizon: "Horizon",
    strategy: "Strategy",
    feeBps: "Fee (bps)",
    lastOfficialRefresh: "Last official refresh",
    refreshOfficialSources: "Refresh official sources",
    refreshingOfficialSources: "Refreshing...",
    marketVolume: "Volume",
    marketUpdated: "Updated",
    currentStateEmpty: "No alerts are active under the current conditions.",
    dailyBriefTitle: "Saveable subscription-style brief",
    dailyBriefSummary: "In the packaged desktop app you can save the current brief as a text file.",
    emptyAlerts: "No active alerts right now",
    scenarioModelBoundary: "The model is a research overlay and does not guarantee executable price targets.",
    required: "Required",
    optional: "Optional",
    requiredColumns: "Required columns",
    enabled: "On",
    disabled: "Off",
    briefingLabel: "Daily Brief",
    focusSourceLabel: "Focus source",
    officialMarketBoardLabel: "Official market board",
    focusDriversLabel: "Focus drivers",
    activeAlertsLabel: "Active alerts",
    generatedAt: "Generated",
    focusMarket: "Focus market",
    errorRefreshSources: "Official-source refresh is available only in the packaged desktop app.",
    errorDesktopOnlyWalkForward: "Walk-forward execution is available only in the packaged desktop app.",
    errorPickCsvDesktopOnly: "CSV import is available only in the packaged desktop app.",
    errorChooseCsvFirst: "Choose a CSV file first."
  }
};

const surfaceCopy = {
  en: {
    overview: {
      label: "Overview",
      title: "Carbon Intelligence Board",
      summary: "See official market state and the next catalysts first."
    },
    workspace: {
      label: "Workspace",
      title: "Operational Workspace",
      summary: "Run saved watchlists, presets, and benchmark-inspired workflows."
    },
    alerts: {
      label: "Alerts",
      title: "Alert Hub",
      summary: "Track official-source issues, policy events, proxy gaps, and the daily brief."
    },
    lab: {
      label: "Lab",
      title: "Scenario And Model Validation",
      summary: "Review scenario overlays, walk-forward output, and backtests together."
    },
    sources: {
      label: "Sources",
      title: "Trust Center",
      summary: "Show data origin, price drivers, and benchmark logic transparently."
    }
  }
} as const;

const driverFamilyCopy = {
  en: {
    policy: { label: "Policy & Supply", summary: "Cap path, allocation, auctions, expansion, reform" },
    power: { label: "Power & Industry", summary: "Power prices, generation mix, industrial activity" },
    fuel: { label: "Fuel Switching", summary: "Gas, coal, oil, and clean spreads" },
    macro: { label: "Macro & Financial", summary: "Equities, credit, rates, FX, macro stress" },
    weather: { label: "Weather & Seasonality", summary: "Temperature, demand, renewables, compliance season" },
    execution: { label: "Liquidity & Execution", summary: "Volume, OI, breadth, microstructure" }
  }
} as const;

const workspaceCopy = {
  en: {
    "morning-scan": {
      title: "Morning Scan Desk",
      summary: "Scan official prices, overnight feed items, and today's catalysts in under three minutes.",
      objective: "Market scan",
      moduleLabels: ["Market board", "Daily brief", "Catalyst calendar", "Trust panel"]
    },
    "cross-market": {
      title: "Cross-market Compare",
      summary: "Compare EU ETS, K-ETS, and China ETS in the same structure and see what differs.",
      objective: "Relative value compare",
      moduleLabels: ["Driver matrix", "Official source cards", "ETF/futures watch", "Jurisdiction compare"]
    },
    "policy-supply": {
      title: "Policy And Supply Monitor",
      summary: "Focus on auctions, allocation, reforms, and official releases that can reset price structure.",
      objective: "Policy risk control",
      moduleLabels: ["Supply windows", "Policy alerts", "Source registry", "Feed"]
    },
    "futures-etf": {
      title: "Futures And ETF Watch",
      summary: "Keep ICE EUA, issuer pages, and external chart links together for fast proxy checks.",
      objective: "Proxy monitoring",
      moduleLabels: ["Market watch", "Watchlists", "External links", "Proxy divergence alerts"]
    },
    "model-review": {
      title: "Model Review",
      summary: "Review scenario, walk-forward, and backtest outputs in one flow.",
      objective: "Research validation",
      moduleLabels: ["Scenario lab", "Walk-forward", "Backtest", "Data readiness"]
    }
  }
} as const;

const watchlistCopy = {
  en: {
    "core-carbon": {
      title: "Core Carbon Monitor",
      summary: "Official venues and daily overviews only."
    },
    "listed-proxies": {
      title: "Listed Proxies",
      summary: "Fast watchlist for ETFs and listed carbon exposure proxies."
    },
    "official-only": {
      title: "Official Sources Only",
      summary: "Remove external portals when validation matters most."
    }
  }
} as const;

const watchViewCopy = {
  en: {
    "scan-view": { title: "Scan View", summary: "See only name, role, and source category for quick review.", columns: ["Asset", "Role", "Category"] },
    "execution-view": { title: "Execution View", summary: "Keep category and notes visible before acting elsewhere.", columns: ["Asset", "Role", "Category", "Notes"] },
    "source-view": { title: "Source View", summary: "Emphasize where to verify the data.", columns: ["Asset", "Category", "Link", "Notes"] }
  }
} as const;

const trustCopy = {
  en: {
    "official-first": {
      title: "Official sources first",
      description: "Price, policy, and market-structure panels prioritize exchange, government, and statistical releases."
    },
    freshness: {
      title: "Freshness always visible",
      description: "Each market card shows the latest source timestamp so operators can separate daily figures from event-driven updates."
    },
    boundary: {
      title: "No trade intermediation",
      description: "The service supports research, monitoring, and alerts. It does not route or intermediate trades."
    },
    explainability: {
      title: "Explanation before signal",
      description: "Signals are shown together with inputs and model warnings so the user understands why the number is there."
    }
  }
} as const;

const subscriptionCopy = {
  en: {
    "daily-brief": {
      title: "Daily carbon brief",
      audience: "Subscriber",
      description: "A morning summary of official-source changes, driver shifts, and region-level highlights."
    },
    "driver-alerts": {
      title: "Driver alerts",
      audience: "Subscriber",
      description: "Alert when auctions, policy releases, or market-structure indicators move outside normal ranges."
    },
    watchlists: {
      title: "Saved watchlists",
      audience: "Subscriber",
      description: "Save markets, factor groups, and briefing layouts into a personalized monitoring surface."
    },
    "weekly-memo": {
      title: "Weekly strategy memo",
      audience: "Subscriber",
      description: "A deeper research note on how policy, energy, and liquidity conditions changed during the week."
    }
  }
} as const;

const marketWatchCopy = {
  en: {
    "ice-eua-official": { role: "Core futures benchmark", note: "Official product page for European carbon allowance futures." },
    "eex-eu-auctions": { role: "Core auction and supply monitor", note: "Used to verify clearing results, cover ratios, and auction calendars." },
    "krx-ets-watch": { role: "K-ETS prices and market rules", note: "Official price screen and information platform for the Korean market." },
    "cneeex-overview": { role: "China daily market overview", note: "Official daily overview page for the national Chinese carbon market." },
    "krbn-official": { role: "Global carbon ETF anchor product", note: "Official page for the KraneShares Global Carbon ETF." },
    "kcca-official": { role: "California carbon ETF", note: "Official page for the KraneShares California Carbon ETF." },
    "keua-official": { role: "European carbon ETF", note: "Official page for the KraneShares European Carbon ETF." },
    "yahoo-krbn": { role: "Fast ETF chart and news check", note: "External watch page only, not a trusted core source." },
    "yahoo-keua": { role: "EUA-focused ETF view", note: "Useful for quick public chart checks on EUA-linked exposure." },
    "yahoo-co2": { role: "SparkChange EUA ETC view", note: "Public ETC reference page linked to EU allowance exposure." },
    "yahoo-iceeua": { role: "ICE EUA excess return index", note: "Quick public view for an ICE EUA-linked index." }
  }
} as const;

const benchmarkCopy = {
  en: {
    "toss-securities": {
      name: "Toss Securities",
      strength: "A simple home, feed, screener, and account structure that lets retail users scan quickly.",
      differentiator: "Large numbers, short labels, simple copy, and a visible information-only boundary.",
      featuresToBorrow: [
        "Simple home and feed-led navigation",
        "Fast-scanning market surface with big numbers",
        "Clear boundary that investment information is for reference"
      ],
      implementedAs: ["Overview market board", "Daily briefing feed", "No-execution boundary copy"]
    },
    koyfin: {
      strength: "Customizable watchlists and dashboards that make research workflows fast.",
      differentiator: "Strong context switching between different views over the same asset universe."
    },
    "carbon-pulse": {
      strength: "Carbon-market, pricing, and climate-policy coverage organized into regional feeds and dossiers.",
      differentiator: "Editorial layers such as Daily News Ticker, Insights, and ETS dossiers."
    },
    sylvera: {
      strength: "A trusted ratings, market intelligence, and market gateway stack.",
      differentiator: "Decision-layer positioning and integrity-first data framing."
    },
    clearblue: {
      strength: "Scenario forecasting, jurisdiction aggregation, and market intelligence for compliance positions.",
      differentiator: "A unified operating surface for scenario forecasting and cross-jurisdiction views."
    }
  }
} as const;

const alertTemplateCopy = {
  en: {
    "official-refresh": {
      title: "Official source health",
      scope: "EU ETS / K-ETS / China ETS",
      trigger: "Raise an inbox item when an official card moves into limited or error state.",
      delivery: "In-app inbox + daily brief"
    },
    "auction-anomaly": {
      title: "Auction anomaly watch",
      scope: "EU ETS / K-ETS",
      trigger: "Flag auction cover, clearing price, or volume when they move outside a normal interpretation range.",
      delivery: "In-app banner + brief"
    },
    "policy-bulletin": {
      title: "Policy bulletin tracking",
      scope: "EU / Korea / China",
      trigger: "Connect new policy or infrastructure releases into the feed and the alert inbox.",
      delivery: "Feed + inbox"
    },
    "proxy-divergence": {
      title: "ETF and futures proxy divergence",
      scope: "Listed proxies",
      trigger: "Highlight when listed proxies diverge from official market interpretation.",
      delivery: "Workspace badge"
    },
    "liquidity-thin": {
      title: "Thin-liquidity warning",
      scope: "K-ETS / China ETS",
      trigger: "Emphasize execution risk when volume is thin or official coverage is limited.",
      delivery: "In-app inbox"
    },
    "model-watch": {
      title: "Model overlay watch",
      scope: "Lab",
      trigger: "Record strong scenario or walk-forward direction as a research note only.",
      delivery: "Lab board"
    }
  }
} as const;

const catalystCopy = {
  en: {
    "eu-auction-window": {
      windowLabel: "Auction days",
      title: "Check the EEX auction tape",
      trigger: "Verify clearing price, cover ratio, auction volume, and change versus the prior auction.",
      whyItMatters: "It is the most direct operational signal for EU ETS supply rhythm and near-term pressure."
    },
    "eu-policy-window": {
      windowLabel: "Policy release",
      title: "Check MSR, cap path, and ETS2 policy",
      trigger: "Review official EU Commission releases for supply-path and design changes.",
      whyItMatters: "Structural price formation in EU ETS is still anchored by the policy-supply path."
    },
    "kr-close-window": {
      windowLabel: "After each session",
      title: "Review official KRX close and volume",
      trigger: "Check KAU close, change, volume, and any sign of a quiet market session.",
      whyItMatters: "K-ETS can be structurally thin, so end-of-day official interpretation matters."
    },
    "kr-compliance-window": {
      windowLabel: "Compliance season",
      title: "Check liquidity around reporting windows",
      trigger: "Review volume, spread behavior, and participation around filing and submission windows.",
      whyItMatters: "Institutional calendar effects are unusually important in K-ETS."
    },
    "cn-daily-window": {
      windowLabel: "Daily overview release",
      title: "Check the Shanghai daily overview",
      trigger: "Verify close, turnover, and cumulative statistics when the exchange overview is published.",
      whyItMatters: "The Chinese national market is still best read through daily overview and policy releases."
    },
    "cn-policy-window": {
      windowLabel: "Policy release",
      title: "Track MEE bulletins and sector expansion",
      trigger: "Use MEE releases to monitor reports, operating notices, and sector-expansion milestones.",
      whyItMatters: "Implementation speed and sector expansion remain key catalysts in China ETS."
    },
    "proxy-watch-window": {
      windowLabel: "Daily",
      title: "Check futures and ETF proxy gaps",
      trigger: "Review whether ICE EUA, KRBN, KEUA, or CO2.L diverge from the official market interpretation.",
      whyItMatters: "Listed proxies are accessible, but they are not the trusted core source layer."
    }
  }
} as const;

const planCopy = {
  en: {
    "plan-01": {
      title: "Benchmark review and product reframing",
      goal: "Lock the product boundary as a carbon intelligence terminal rather than a broker app.",
      outputs: ["Benchmark map", "Regulatory boundary", "Core user questions"]
    },
    "plan-02": {
      title: "Information architecture redesign",
      goal: "Rebuild the app around Overview, Workspace, Alerts, Lab, and Sources.",
      outputs: ["New navigation", "Layout frame", "English utility copy"]
    },
    "plan-03": {
      title: "Global carbon board",
      goal: "Build a unified board for EU ETS, K-ETS, and China ETS.",
      outputs: ["Market board", "Official cards", "Scan summary"]
    },
    "plan-04": {
      title: "Driver matrix and catalyst calendar",
      goal: "Organize price drivers by jurisdiction and add an operating calendar.",
      outputs: ["Driver matrix", "Catalyst windows", "Full variable atlas"]
    },
    "plan-05": {
      title: "Source registry and trust center",
      goal: "Separate official web, official file, public API, and commercial API layers.",
      outputs: ["Source registry", "Trust principles", "Freshness visibility"]
    },
    "plan-06": {
      title: "Feed and alerts hub",
      goal: "Build a Carbon Pulse-style feed and a TradingView-style alert layer for carbon markets.",
      outputs: ["Daily brief", "Alert templates", "Inbox"]
    },
    "plan-07": {
      title: "Lab reorganization",
      goal: "Unify scenario, walk-forward, backtest, and dataset-template export in one flow.",
      outputs: ["Scenario lab", "Walk-forward panel", "Backtest panel", "CSV template export"]
    },
    "plan-08": {
      title: "Packaging, docs, and deployment",
      goal: "Rebuild the EXE, update strategy docs, and push the validated result to GitHub.",
      outputs: ["Portable EXE", "Strategy docs", "GitHub push"]
    }
  }
} as const;

export function getUiCopy(locale: AppLocale): UiCopy {
  return uiCopy[locale];
}

export function getStatusLabel(locale: AppLocale, status: "connected" | "limited" | "error") {
  if (locale === "ko") {
    return status === "connected" ? "정상" : status === "limited" ? "부분" : "오류";
  }
  return status === "connected" ? "Connected" : status === "limited" ? "Limited" : "Error";
}

export function getSeverityLabel(locale: AppLocale, severity: "High" | "Medium" | "Low") {
  if (locale === "ko") {
    return severity === "High" ? "높음" : severity === "Medium" ? "중간" : "낮음";
  }
  return severity;
}

export function getImportanceLabel(locale: AppLocale, importance: DriverImportance) {
  if (locale === "ko") {
    return importance === "Core" ? "핵심" : importance === "High" ? "중요" : "보조";
  }
  return importance;
}

export function getMarketDisplayName(locale: AppLocale, marketId: "eu-ets" | "k-ets" | "cn-ets") {
  if (locale === "ko") {
    return marketId === "cn-ets" ? "중국 ETS" : marketId === "k-ets" ? "K-ETS" : "EU ETS";
  }
  return marketId === "cn-ets" ? "China ETS" : marketId === "k-ets" ? "K-ETS" : "EU ETS";
}

export function localizeSurfaceTab<T extends { id: string; label: string; title: string; summary: string }>(
  item: T,
  locale: AppLocale
): T {
  if (locale === "ko") {
    return item;
  }
  const mapped = surfaceCopy.en[item.id as keyof typeof surfaceCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeDriverFamily<T extends { id: string; label: string; summary: string }>(
  item: T,
  locale: AppLocale
): T {
  if (locale === "ko") {
    return item;
  }
  const mapped = driverFamilyCopy.en[item.id as keyof typeof driverFamilyCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeWorkspacePreset(item: WorkspacePreset, locale: AppLocale): WorkspacePreset {
  if (locale === "ko") {
    return item;
  }
  const mapped = workspaceCopy.en[item.id as keyof typeof workspaceCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeWatchlistPreset(item: WatchlistPreset, locale: AppLocale): WatchlistPreset {
  if (locale === "ko") {
    return item;
  }
  const mapped = watchlistCopy.en[item.id as keyof typeof watchlistCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeWatchViewPreset(item: WatchViewPreset, locale: AppLocale): WatchViewPreset {
  if (locale === "ko") {
    return item;
  }
  const mapped = watchViewCopy.en[item.id as keyof typeof watchViewCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeTrustPrinciple(item: TrustPrinciple, locale: AppLocale): TrustPrinciple {
  if (locale === "ko") {
    return item;
  }
  const mapped = trustCopy.en[item.id as keyof typeof trustCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeSubscriptionFeature(
  item: SubscriptionFeature,
  locale: AppLocale
): SubscriptionFeature {
  if (locale === "ko") {
    return item;
  }
  const mapped = subscriptionCopy.en[item.id as keyof typeof subscriptionCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeMarketWatchItem(item: MarketWatchItem, locale: AppLocale): MarketWatchItem {
  if (locale === "ko") {
    return item;
  }
  const mapped = marketWatchCopy.en[item.id as keyof typeof marketWatchCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeBenchmark(item: BenchmarkPlatform, locale: AppLocale): BenchmarkPlatform {
  if (locale === "ko") {
    return item;
  }
  const mapped = benchmarkCopy.en[item.id as keyof typeof benchmarkCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeAlertTemplate(item: AlertTemplate, locale: AppLocale): AlertTemplate {
  if (locale === "ko") {
    return item;
  }
  const mapped = alertTemplateCopy.en[item.id as keyof typeof alertTemplateCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeCatalystWindow(item: CatalystWindow, locale: AppLocale): CatalystWindow {
  if (locale === "ko") {
    return item;
  }
  const mapped = catalystCopy.en[item.id as keyof typeof catalystCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeAutonomousPlanStep(
  item: AutonomousPlanStep,
  locale: AppLocale
): AutonomousPlanStep {
  if (locale === "ko") {
    return item;
  }
  const mapped = planCopy.en[item.id as keyof typeof planCopy.en];
  return mapped ? { ...item, ...mapped } : item;
}

export function localizeSourceRegistryItem(
  item: SourceRegistryItem,
  locale: AppLocale
): SourceRegistryItem {
  if (locale === "ko") {
    return item;
  }

  const overrides: Partial<Record<string, Partial<SourceRegistryItem>>> = {
    "eex-auctions": {
      appUse: "EU primary auction price, volume, cover ratio, and auction calendar",
      whyItMatters: "The highest-trust public source for reading EU carbon price and supply rhythm."
    },
    "eex-datasource": {
      appUse: "Future premium route for broader carbon-market data coverage",
      whyItMatters:
        "Useful when workbook scraping is no longer enough and a systematic exchange data supply becomes necessary."
    },
    "entso-e": {
      appUse: "EU power balance, generation, balancing, and electricity-market drivers",
      whyItMatters: "EU carbon pricing remains tightly connected to dispatch and thermal generation conditions."
    },
    entsog: {
      appUse: "European gas-flow and infrastructure data for fuel-switch monitoring",
      whyItMatters: "Gas supply conditions materially shift clean spark spread economics and carbon-demand expectations."
    },
    "eurostat-api": {
      appUse: "EU industrial production and macro overlay",
      whyItMatters: "Industrial activity is a core variable group for compliance demand."
    },
    "krx-ets": {
      appUse: "K-ETS close, change, volume, instrument data, and rule reference",
      whyItMatters: "The official starting point for checking Korean market price and structure."
    },
    "kosis-openapi": {
      appUse: "Korean macro and industrial-statistics overlay",
      whyItMatters: "Domestic industry, manufacturing, and energy statistics help explain K-ETS demand."
    },
    "kma-openmet": {
      appUse: "Weather and climate overlay for Korean demand and seasonality analysis",
      whyItMatters: "Weather can shift power demand and indirectly change allowance-demand conditions."
    },
    "mee-report": {
      appUse: "Understand Chinese market structure, data quality, infrastructure, and disclosure",
      whyItMatters: "A core official document for understanding the operating structure and information architecture of the national market."
    },
    "cneeex-daily": {
      appUse: "Daily close, turnover, and cumulative statistics for the Chinese national market",
      whyItMatters: "One of the most important daily numerical sources when a stable public API is not clearly available."
    }
  };

  const mapped = overrides[item.id];
  return mapped ? { ...item, ...mapped } : item;
}
