import type {
  AlertTemplate,
  AutonomousPlanStep,
  BenchmarkPlatform,
  CatalystWindow,
  DriverImportance,
  MarketWatchItem,
  OpenSourceBenchmark,
  SourceRegistryItem,
  SubscriptionFeature,
  TrustPrinciple,
  WatchViewPreset,
  WatchlistPreset,
  WorkspacePreset
} from "../types";

export type AppLocale = "ko" | "en";

export const localeOptions: Array<{ id: AppLocale; label: string }> = [
  { id: "ko", label: "KO" },
  { id: "en", label: "EN" }
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
    appTagline: "거래는 밖에서, 판단은 여기서",
    screensLabel: "화면",
    marketsLabel: "시장",
    savedWorkspaceLabel: "저장된 워크스페이스",
    watchlistLabel: "워치리스트",
    selectedMarketLabel: "선택 시장",
    todayStatusLabel: "오늘",
    activeAlertCountLabel: "지금 확인이 필요한 항목 수입니다.",
    workspaceBlueprintLabel: "워크스페이스 설계",
    trustPrinciplesLabel: "신뢰 원칙",
    noCardConnected: "공식 카드가 아직 연결되지 않았습니다.",
    pendingOfficialSource: "공식 소스 대기",
    officialStatus: "공식 상태",
    notAvailable: "미연결",
    activeTemplates: "활성 템플릿",
    inboxNow: "인박스",
    briefFormat: "브리프 형식",
    saveDailyBrief: "오늘 브리프 저장",
    saveTemplate: "템플릿 저장",
    csvChoose: "CSV 선택",
    noFileChosen: "선택한 파일 없음",
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
    trainWindow: "학습 구간",
    horizon: "예측 구간",
    strategy: "전략",
    feeBps: "비용(bps)",
    lastOfficialRefresh: "마지막 공식 갱신",
    refreshOfficialSources: "공식 소스 새로고침",
    refreshingOfficialSources: "새로고침 중...",
    marketVolume: "거래량",
    marketUpdated: "갱신",
    currentStateEmpty: "현재 조건에서 활성 알림이 없습니다.",
    dailyBriefTitle: "저장 가능한 구독형 브리프",
    dailyBriefSummary: "패키지된 앱에서는 현재 브리프를 텍스트 파일로 저장할 수 있습니다.",
    emptyAlerts: "현재 활성 알림 없음",
    scenarioModelBoundary: "모델은 연구 보조용이며 실제 거래 가능한 가격 목표를 보장하지 않습니다.",
    required: "필수",
    optional: "선택",
    requiredColumns: "필요 컬럼",
    enabled: "켬",
    disabled: "끔",
    briefingLabel: "일일 브리프",
    focusSourceLabel: "중점 소스",
    officialMarketBoardLabel: "공식 시장 보드",
    focusDriversLabel: "중점 드라이버",
    activeAlertsLabel: "활성 알림",
    generatedAt: "생성 시각",
    focusMarket: "중점 시장",
    errorRefreshSources: "공식 소스 새로고침은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorDesktopOnlyWalkForward: "워크포워드 실행은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorPickCsvDesktopOnly: "CSV 불러오기는 패키지된 데스크톱 앱에서만 사용할 수 있습니다.",
    errorChooseCsvFirst: "먼저 CSV 파일을 선택하세요."
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
  ko: {
    overview: { label: "한눈에 보기", title: "탄소 시장 보드", summary: "공식 시세와 다음 체크포인트를 먼저 봅니다." },
    workspace: { label: "워크스페이스", title: "운영 워크스페이스", summary: "저장한 화면과 관찰 목록을 빠르게 불러옵니다." },
    alerts: { label: "알림", title: "알림 허브", summary: "공식 소스 이상, 정책 이벤트, 프록시 괴리를 모아 봅니다." },
    lab: { label: "실험실", title: "시나리오와 모델 검증", summary: "시나리오, 워크포워드, 백테스트를 한 흐름에서 봅니다." },
    sources: { label: "출처", title: "신뢰 센터", summary: "데이터 출처, 갱신 시각, 사용 방식의 경계를 보여줍니다." }
  },
  en: {
    overview: { label: "Overview", title: "Carbon Intelligence Board", summary: "See official market state and the next catalysts first." },
    workspace: { label: "Workspace", title: "Operational Workspace", summary: "Run saved watchlists, presets, and benchmark-inspired workflows." },
    alerts: { label: "Alerts", title: "Alert Hub", summary: "Track official-source issues, policy events, proxy gaps, and the daily brief." },
    lab: { label: "Lab", title: "Scenario And Model Validation", summary: "Review scenario overlays, walk-forward output, and backtests together." },
    sources: { label: "Sources", title: "Trust Center", summary: "Show data origin, price drivers, and benchmark logic transparently." }
  }
} as const;

const driverFamilyCopy = {
  ko: {
    policy: { label: "정책·공급", summary: "총량, 할당, 경매, 제도 개편" },
    power: { label: "전력·산업", summary: "전력 가격, 발전 믹스, 산업 활동" },
    fuel: { label: "연료 전환", summary: "가스, 석탄, 유가, 청정 스프레드" },
    macro: { label: "매크로·금융", summary: "주식, 신용, 금리, 환율, 거시 스트레스" },
    weather: { label: "날씨·계절성", summary: "기온, 수요, 재생에너지, 이행 시즌" },
    execution: { label: "유동성·체결", summary: "거래량, OI, 참여 폭, 미시구조" }
  },
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
  ko: {
    "morning-scan": {
      title: "아침 스캔 데스크",
      summary: "공식 가격, 밤사이 피드, 오늘 일정까지 3분 안에 확인합니다.",
      objective: "시장 스캔",
      moduleLabels: ["시장 보드", "일일 브리프", "이벤트 캘린더", "신뢰 패널"]
    },
    "cross-market": {
      title: "시장 간 비교",
      summary: "EU ETS, K-ETS, China ETS를 같은 틀에서 비교합니다.",
      objective: "상대 비교",
      moduleLabels: ["드라이버 매트릭스", "공식 소스 카드", "ETF·선물 감시", "국가별 비교"]
    },
    "policy-supply": {
      title: "정책·공급 감시",
      summary: "경매, 할당, 개편, 공식 공지가 가격 구조를 바꿀 수 있는지 봅니다.",
      objective: "정책 리스크 관리",
      moduleLabels: ["공급 일정", "정책 알림", "소스 레지스트리", "피드"]
    },
    "futures-etf": {
      title: "선물·ETF 감시",
      summary: "ICE EUA, 발행사 페이지, 외부 차트를 한 묶음으로 확인합니다.",
      objective: "프록시 모니터링",
      moduleLabels: ["마켓 워치", "워치리스트", "외부 링크", "프록시 괴리 알림"]
    },
    "model-review": {
      title: "모델 리뷰",
      summary: "시나리오, 워크포워드, 백테스트 결과를 한 흐름에서 검토합니다.",
      objective: "연구 검증",
      moduleLabels: ["시나리오 랩", "워크포워드", "백테스트", "데이터 준비 상태"]
    }
  },
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
  ko: {
    "core-carbon": { title: "핵심 탄소 모니터", summary: "공식 거래소와 일일 개황만 모아 둔 목록입니다." },
    "listed-proxies": { title: "상장 프록시", summary: "ETF와 상장 탄소 노출 상품을 빠르게 보는 목록입니다." },
    "official-only": { title: "공식 소스만", summary: "검증이 더 중요할 때 외부 포털을 빼고 공식 채널만 봅니다." }
  },
  en: {
    "core-carbon": { title: "Core Carbon Monitor", summary: "Official venues and daily overviews only." },
    "listed-proxies": { title: "Listed Proxies", summary: "Fast watchlist for ETFs and listed carbon exposure proxies." },
    "official-only": { title: "Official Sources Only", summary: "Remove external portals when validation matters most." }
  }
} as const;

const watchViewCopy = {
  ko: {
    "scan-view": { title: "스캔 뷰", summary: "이름, 역할, 카테고리만 보여 빠르게 훑어봅니다.", columns: ["자산", "역할", "카테고리"] },
    "execution-view": { title: "실행 보조 뷰", summary: "실행 전에 카테고리와 메모를 함께 봅니다.", columns: ["자산", "역할", "카테고리", "메모"] },
    "source-view": { title: "검증 뷰", summary: "어디서 다시 확인해야 하는지 강조합니다.", columns: ["자산", "카테고리", "링크", "메모"] }
  },
  en: {
    "scan-view": { title: "Scan View", summary: "See only name, role, and source category for quick review.", columns: ["Asset", "Role", "Category"] },
    "execution-view": { title: "Execution View", summary: "Keep category and notes visible before acting elsewhere.", columns: ["Asset", "Role", "Category", "Notes"] },
    "source-view": { title: "Source View", summary: "Emphasize where to verify the data.", columns: ["Asset", "Category", "Link", "Notes"] }
  }
} as const;

const trustCopy = {
  ko: {
    "official-first": { title: "공식 소스 우선", description: "가격, 정책, 시장 구조 패널은 거래소·정부·통계기관 발표를 우선합니다." },
    freshness: { title: "갱신 시각 항상 표시", description: "모든 시장 카드에 최신 시각을 보여 일일 수치와 이벤트성 공지를 구분합니다." },
    boundary: { title: "거래 중개 없음", description: "이 서비스는 리서치·모니터링·알림을 지원하지만 주문을 중개하지 않습니다." },
    explainability: { title: "신호보다 설명 우선", description: "신호와 함께 입력값과 모델 경고를 보여 왜 숫자가 나왔는지 이해하게 합니다." }
  },
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
  ko: {
    "daily-brief": { title: "일일 탄소 브리프", audience: "구독자", description: "아침마다 공식 소스 변화, 드라이버 이동, 지역별 핵심 포인트를 요약합니다." },
    "driver-alerts": { title: "드라이버 알림", audience: "구독자", description: "경매, 정책 발표, 시장 구조 지표가 평소 범위를 벗어나면 알립니다." },
    watchlists: { title: "저장 워치리스트", audience: "구독자", description: "시장, 요인군, 브리핑 레이아웃을 저장해 개인 운영 화면으로 씁니다." },
    "weekly-memo": { title: "주간 전략 메모", audience: "구독자", description: "한 주 동안 정책, 에너지, 유동성이 어떻게 바뀌었는지 깊게 정리합니다." }
  },
  en: {
    "daily-brief": { title: "Daily carbon brief", audience: "Subscriber", description: "A morning summary of official-source changes, driver shifts, and region-level highlights." },
    "driver-alerts": { title: "Driver alerts", audience: "Subscriber", description: "Alert when auctions, policy releases, or market-structure indicators move outside normal ranges." },
    watchlists: { title: "Saved watchlists", audience: "Subscriber", description: "Save markets, factor groups, and briefing layouts into a personalized monitoring surface." },
    "weekly-memo": { title: "Weekly strategy memo", audience: "Subscriber", description: "A deeper research note on how policy, energy, and liquidity conditions changed during the week." }
  }
} as const;

const marketWatchCopy = {
  ko: {
    "ice-eua-official": { role: "핵심 선물 기준값", note: "유럽 탄소배출권 선물의 공식 상품 페이지입니다." },
    "eex-eu-auctions": { role: "핵심 경매·공급 감시", note: "낙찰가, 커버율, 경매 일정을 확인하는 데 씁니다." },
    "krx-ets-watch": { role: "K-ETS 시세·규정", note: "한국 시장의 공식 가격 화면이자 정보 플랫폼입니다." },
    "cneeex-overview": { role: "중국 일일 시장 개황", note: "중국 전국 탄소시장의 공식 일일 개황 페이지입니다." },
    "krbn-official": { role: "글로벌 탄소 ETF 기준 상품", note: "KraneShares Global Carbon ETF의 공식 페이지입니다." },
    "kcca-official": { role: "캘리포니아 탄소 ETF", note: "KraneShares California Carbon ETF의 공식 페이지입니다." },
    "keua-official": { role: "유럽 탄소 ETF", note: "KraneShares European Carbon ETF의 공식 페이지입니다." },
    "yahoo-krbn": { role: "빠른 ETF 차트 확인", note: "외부 참고용 페이지이며 핵심 신뢰 소스로 쓰지 않습니다." },
    "yahoo-keua": { role: "EUA 연동 ETF 보기", note: "EUA 연동 노출을 빠르게 참고할 때만 씁니다." },
    "yahoo-co2": { role: "SparkChange EUA ETC 보기", note: "EU 배출권 노출 ETC를 빠르게 확인하는 참고 페이지입니다." },
    "yahoo-iceeua": { role: "ICE EUA 지수 보기", note: "ICE EUA 연계 지수를 빠르게 확인하는 참고 페이지입니다." }
  },
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
  ko: {
    "toss-securities": {
      name: "토스증권",
      category: "소비자 스캔 UX",
      strength: "홈, 피드, 고르기, 계좌 흐름이 단순해 초보도 빨리 훑을 수 있습니다.",
      differentiator: "큰 숫자, 짧은 문장, 낮은 진입 장벽, 정보 참고용 경계가 명확합니다.",
      featuresToBorrow: ["단순한 홈·피드 중심 이동", "큰 숫자로 빠르게 훑는 시세 화면", "참고용 정보라는 경계 표시"],
      implementedAs: ["시장 보드", "일일 브리핑 피드", "주문 미지원 경계 문구"]
    },
    tradingview: {
      name: "TradingView",
      category: "트레이딩 워크스페이스",
      strength: "차트, 워치리스트, 알림, 비교가 하나의 작업면 안에 잘 묶여 있습니다.",
      differentiator: "동일한 자산군을 여러 관점에서 바로 전환하며 볼 수 있습니다.",
      featuresToBorrow: ["동기화된 차트·워치리스트", "알림 레이어", "비교 차트 작업면"]
    },
    koyfin: {
      name: "Koyfin",
      category: "리서치 대시보드",
      strength: "맞춤형 워치리스트와 대시보드로 리서치 흐름을 빠르게 구성할 수 있습니다.",
      differentiator: "같은 자산군을 여러 분석 뷰로 전환하는 감각이 좋습니다.",
      featuresToBorrow: ["사용자 정의 워치리스트", "대시보드형 모니터링", "리서치 전용 뷰 전환"]
    },
    "carbon-pulse": {
      name: "Carbon Pulse",
      category: "탄소 뉴스·도시어",
      strength: "탄소시장, 가격, 기후정책 뉴스를 지역별로 구조화해 보여줍니다.",
      differentiator: "Daily News Ticker와 ETS 도시에처럼 현업형 편집층이 강합니다.",
      featuresToBorrow: ["짧은 시장 피드", "지역별 정책 추적", "ETS 도시에형 정보 구조"]
    },
    sylvera: {
      name: "Sylvera",
      category: "의사결정 레이어",
      strength: "신뢰 중심 데이터와 판단 레이어를 같이 보여줍니다.",
      differentiator: "무엇을 믿을 수 있는지 먼저 드러내는 구조가 강합니다.",
      featuresToBorrow: ["신뢰 배지", "설명 우선 의사결정", "데이터 무결성 강조"]
    },
    clearblue: {
      name: "ClearBlue Vantage",
      category: "포지션 최적화",
      strength: "시나리오, 지역 비교, 포지션 운영을 한 화면으로 연결합니다.",
      differentiator: "운영형 시나리오 화면과 지역 통합 시야가 강합니다.",
      featuresToBorrow: ["시나리오 랩", "지역별 포지션 비교", "운영형 대시보드"]
    }
  },
  en: {
    "toss-securities": {
      name: "Toss Securities",
      category: "Consumer scan UX",
      strength: "A simple home, feed, screener, and account structure that lets retail users scan quickly.",
      differentiator: "Large numbers, short labels, simple copy, and a visible information-only boundary.",
      featuresToBorrow: ["Simple home and feed-led navigation", "Fast-scanning market surface with big numbers", "Clear boundary that investment information is for reference"],
      implementedAs: ["Overview market board", "Daily briefing feed", "No-execution boundary copy"]
    },
    tradingview: {
      name: "TradingView",
      category: "Trading workspace",
      strength: "Charting, watchlists, alerts, and comparisons are all tied into a single working surface.",
      differentiator: "It supports fast context switching between several views over the same market set.",
      featuresToBorrow: ["Synced chart and watchlist workflow", "Alert layer", "Comparison workspace"]
    },
    koyfin: {
      name: "Koyfin",
      category: "Research dashboard",
      strength: "Customizable watchlists and dashboards that make research workflows fast.",
      differentiator: "Strong context switching between different views over the same asset universe.",
      featuresToBorrow: ["Custom watchlists", "Dashboard-style monitoring", "Research-specific view presets"]
    },
    "carbon-pulse": {
      name: "Carbon Pulse",
      category: "Carbon news and dossiers",
      strength: "Carbon-market, pricing, and climate-policy coverage organized into regional feeds and dossiers.",
      differentiator: "Editorial layers such as Daily News Ticker, Insights, and ETS dossiers.",
      featuresToBorrow: ["Short market feed", "Regional policy tracking", "ETS dossier structure"]
    },
    sylvera: {
      name: "Sylvera",
      category: "Decision layer",
      strength: "A trusted ratings, market intelligence, and market gateway stack.",
      differentiator: "Decision-layer positioning and integrity-first data framing.",
      featuresToBorrow: ["Trust badges", "Decision framing", "Integrity-first data presentation"]
    },
    clearblue: {
      name: "ClearBlue Vantage",
      category: "Position optimization",
      strength: "Scenario forecasting, jurisdiction aggregation, and market intelligence for compliance positions.",
      differentiator: "A unified operating surface for scenario forecasting and cross-jurisdiction views.",
      featuresToBorrow: ["Scenario lab", "Cross-jurisdiction view", "Operator-grade monitoring"]
    }
  }
} as const;

const openSourceBenchmarkCopy = {
  ko: {
    "hyperledger-carbon-accounting": {
      name: "hyperledger-labs/blockchain-carbon-accounting",
      category: "레지스트리·감사 원장",
      verifiedCapability:
        "README 기준으로 permissioned ledger, 토큰화된 기후 자산, 검증 워크플로, 공급망 배출량 계산 구조를 확인했습니다.",
      adaptForCQuant:
        "C-Quant에서는 원장 자체가 아니라 출처 계보, 검증 상태, 크레딧 생애주기 추적 화면으로 변형해 씁니다.",
      boundaryNote:
        "토큰 발행, DAO 투표, 결제·정산 레일은 넣지 않습니다. C-Quant는 관찰과 증빙 소프트웨어에 머뭅니다.",
      llmUse:
        "LLM은 검증 누락, 증빙 충돌, 프로젝트 계보 공백을 설명하는 역할에만 씁니다."
    },
    "carbon-scribe": {
      name: "CarbonScribe/carbon-scribe",
      category: "크레딧 생애주기 플랫폼",
      verifiedCapability:
        "README 기준으로 Stellar 자산 발행과 retirement proof 중심의 end-to-end credit lifecycle 구조를 확인했습니다.",
      adaptForCQuant:
        "발행, 이력, 소각 증빙을 하나의 타임라인으로 보여주는 인텔리전스 화면에 참고합니다.",
      boundaryNote:
        "구매·소각 실행은 넣지 않습니다. 제가 확인한 자료 기준으로 pricing AI는 검증하지 못했으므로 제품 기능으로 가정하지 않습니다.",
      llmUse:
        "LLM은 생애주기 증빙이 충분한지, 문서가 비어 있는지 요약하는 데 씁니다."
    },
    "carbon-project": {
      name: "CarbonCreditProject/Carbon-Project",
      category: "토큰 시장 구조",
      verifiedCapability:
        "README 기준으로 ERC-20 mint/burn, validator 역할, NFT certificate, AMM 풀 구조를 확인했습니다.",
      adaptForCQuant:
        "발행, 검증, 유동성, 소각, 인증서 상태를 보여주는 시장 구조 모니터 개념만 가져옵니다.",
      boundaryNote:
        "AMM, DEX, ERC-20 발행, NFT 발행, 실제 거래 기능은 제품 경계를 넘기므로 제외합니다.",
      llmUse:
        "LLM은 유동성 상태와 소각 병목이 시장 신뢰에 어떤 영향을 주는지 설명하는 데 씁니다."
    },
    "inf-imb-eua23": {
      name: "SaveChris/Inf-Imb-for-EUA23",
      category: "가격 결정 요인 연구",
      verifiedCapability:
        "README 기준으로 Information Imbalance 기반 EUA 가격 결정 요인 분석, 주간 시계열 선택, Gaussian Process 예측 구조를 확인했습니다.",
      adaptForCQuant:
        "시장 국면별 상위 변수 랭킹, 정보량이 큰 변수 선별, 연구 검증 화면의 기준으로 씁니다.",
      boundaryNote:
        "논문 결과를 실시간 목표가처럼 보여주지 않습니다. 팩터 선택과 연구 검증 기준으로만 씁니다.",
      llmUse:
        "LLM은 팩터 랭킹을 쉬운 언어의 매수·보류·감시 이유로 번역하는 데 씁니다."
    },
    "verra-scaper": {
      name: "yc-wang00/verra-scaper",
      category: "레지스트리 수집 파이프라인",
      verifiedCapability:
        "README 기준으로 Verra VCS summary data, metadata, PDF link 수집 기능을 확인했습니다.",
      adaptForCQuant:
        "프로젝트 도시에, 문서 패킷, 자료 최신성 점검, 출처 정규화 파이프라인에 참고합니다.",
      boundaryNote:
        "문서 수집과 메타데이터 정리에 한정합니다. 프로젝트 보증이나 토큰 발행 의미를 부여하지 않습니다.",
      llmUse:
        "LLM은 프로젝트 문서를 요약하고 빠진 공시를 찾아내는 데 씁니다."
    },
    "forest-risks": {
      name: "carbonplan/forest-risks",
      category: "자연기반 크레딧 리스크 모델",
      verifiedCapability:
        "README 기준으로 biomass, fire, drought, insects 리스크 레이어와 모델링 도구를 확인했습니다.",
      adaptForCQuant:
        "산림·토지 기반 크레딧에 대해 위험 오버레이와 무결성 경고를 추가하는 기준으로 씁니다.",
      boundaryNote:
        "미국 중심 레이어를 모든 지역에 일반화하지 않습니다. 지역 범위와 적용 한계를 항상 드러냅니다.",
      llmUse:
        "LLM은 위험 레이어를 읽기 쉬운 프로젝트 리스크 브리프로 바꾸는 데 씁니다."
    },
    "qaoa-carbon-cerrado": {
      name: "hgribeirogeo/qaoa-carbon-cerrado",
      category: "포트폴리오 최적화 연구",
      verifiedCapability:
        "README 기준으로 탄소·생물다양성·사회영향을 함께 다루는 multi-objective portfolio optimization 문제를 확인했습니다.",
      adaptForCQuant:
        "C-Quant에서는 유동성, basis risk, integrity, concentration, policy fit을 함께 보는 포트폴리오 슬리브 최적화로 바꿉니다.",
      boundaryNote:
        "양자 하드웨어를 제품 요구조건으로 삼지 않습니다. 실무형 고전 최적화가 먼저입니다.",
      llmUse:
        "LLM은 가중치 변경이 왜 포트폴리오 frontier를 바꾸는지 설명하는 데 씁니다."
    },
    "gcam-core": {
      name: "JGCRI/gcam-core",
      category: "거시 시나리오 엔진",
      verifiedCapability:
        "README 기준으로 economy, energy, land, water, trade, climate를 연결하는 multisector scenario model을 확인했습니다.",
      adaptForCQuant:
        "장기 정책·에너지 시나리오가 탄소 노출에 어떤 방향성을 주는지 설명하는 시나리오 레이어에 참고합니다.",
      boundaryNote:
        "GCAM류 결과를 단기 매매 신호처럼 포장하지 않습니다. 장기 정책 스트레스 테스트에만 둡니다.",
      llmUse:
        "LLM은 장기 시나리오를 가까운 체크포인트와 운영 메모로 바꿔 주는 데 씁니다."
    }
  },
  en: {}
} as const;

const alertTemplateCopy = {
  ko: {
    "official-refresh": { title: "공식 소스 상태", scope: "EU ETS / K-ETS / China ETS", trigger: "공식 카드가 limited 또는 error로 바뀌면 인박스에 올립니다.", delivery: "인앱 인박스 + 일일 브리프" },
    "auction-anomaly": { title: "경매 이상 감시", scope: "EU ETS / K-ETS", trigger: "경매 커버율, 낙찰가, 수량이 평소 해석 범위를 벗어나면 표시합니다.", delivery: "인앱 배너 + 브리프" },
    "policy-bulletin": { title: "정책 공지 추적", scope: "EU / Korea / China", trigger: "새 정책·인프라 공지를 피드와 알림함에 연결합니다.", delivery: "피드 + 인박스" },
    "proxy-divergence": { title: "ETF·선물 프록시 괴리", scope: "상장 프록시", trigger: "상장 프록시가 공식 시장 해석과 벌어질 때 강조합니다.", delivery: "워크스페이스 배지" },
    "liquidity-thin": { title: "유동성 경고", scope: "K-ETS / China ETS", trigger: "거래가 얇거나 공식 커버리지가 제한되면 실행 리스크를 강조합니다.", delivery: "인앱 인박스" },
    "model-watch": { title: "모델 오버레이 감시", scope: "Lab", trigger: "시나리오나 워크포워드 방향이 강할 때 연구 메모로 기록합니다.", delivery: "Lab 보드" }
  },
  en: {
    "official-refresh": { title: "Official source health", scope: "EU ETS / K-ETS / China ETS", trigger: "Raise an inbox item when an official card moves into limited or error state.", delivery: "In-app inbox + daily brief" },
    "auction-anomaly": { title: "Auction anomaly watch", scope: "EU ETS / K-ETS", trigger: "Flag auction cover, clearing price, or volume when they move outside a normal interpretation range.", delivery: "In-app banner + brief" },
    "policy-bulletin": { title: "Policy bulletin tracking", scope: "EU / Korea / China", trigger: "Connect new policy or infrastructure releases into the feed and the alert inbox.", delivery: "Feed + inbox" },
    "proxy-divergence": { title: "ETF and futures proxy divergence", scope: "Listed proxies", trigger: "Highlight when listed proxies diverge from official market interpretation.", delivery: "Workspace badge" },
    "liquidity-thin": { title: "Thin-liquidity warning", scope: "K-ETS / China ETS", trigger: "Emphasize execution risk when volume is thin or official coverage is limited.", delivery: "In-app inbox" },
    "model-watch": { title: "Model overlay watch", scope: "Lab", trigger: "Record strong scenario or walk-forward direction as a research note only.", delivery: "Lab board" }
  }
} as const;

const catalystCopy = {
  ko: {
    "eu-auction-window": { windowLabel: "경매일", title: "EEX 경매 테이프 확인", trigger: "낙찰가, 커버율, 경매 수량, 직전 대비 변화를 확인합니다.", whyItMatters: "EU ETS 공급 리듬과 단기 압력을 읽는 가장 직접적인 신호입니다." },
    "eu-policy-window": { windowLabel: "정책 발표", title: "MSR, 총량 경로, ETS2 정책 확인", trigger: "EU 집행위 발표로 공급 경로와 제도 변경을 확인합니다.", whyItMatters: "EU ETS의 구조적 가격 형성은 여전히 정책·공급 경로에 묶여 있습니다." },
    "kr-close-window": { windowLabel: "장 종료 후", title: "KRX 공식 종가와 거래량 확인", trigger: "KAU 종가, 전일 대비, 거래량, 한산한 장세 여부를 확인합니다.", whyItMatters: "K-ETS는 얇은 시장일 수 있어 장 마감 해석이 중요합니다." },
    "kr-compliance-window": { windowLabel: "이행 시즌", title: "보고·제출 구간의 유동성 확인", trigger: "신고·제출 시기의 거래량, 스프레드, 참여 변화를 확인합니다.", whyItMatters: "K-ETS는 제도 일정 효과가 유난히 크게 작동합니다." },
    "cn-daily-window": { windowLabel: "일일 개황 발표", title: "상하이 일일 개황 확인", trigger: "종가, 거래대금, 누적 통계를 개황 발표 시점에 확인합니다.", whyItMatters: "중국 전국 시장은 일일 개황과 정책 발표를 함께 읽어야 합니다." },
    "cn-policy-window": { windowLabel: "정책 발표", title: "MEE 공지와 부문 확대 추적", trigger: "운영 공지, 보고 체계, 부문 확대 일정을 MEE 발표로 확인합니다.", whyItMatters: "시행 속도와 부문 확대는 China ETS의 핵심 촉매입니다." },
    "proxy-watch-window": { windowLabel: "매일", title: "선물·ETF 프록시 괴리 확인", trigger: "ICE EUA, KRBN, KEUA, CO2.L이 공식 시장 해석과 벌어지는지 봅니다.", whyItMatters: "상장 프록시는 접근성이 좋지만 핵심 신뢰 소스는 아닙니다." }
  },
  en: {
    "eu-auction-window": { windowLabel: "Auction days", title: "Check the EEX auction tape", trigger: "Verify clearing price, cover ratio, auction volume, and change versus the prior auction.", whyItMatters: "It is the most direct operational signal for EU ETS supply rhythm and near-term pressure." },
    "eu-policy-window": { windowLabel: "Policy release", title: "Check MSR, cap path, and ETS2 policy", trigger: "Review official EU Commission releases for supply-path and design changes.", whyItMatters: "Structural price formation in EU ETS is still anchored by the policy-supply path." },
    "kr-close-window": { windowLabel: "After each session", title: "Review official KRX close and volume", trigger: "Check KAU close, change, volume, and any sign of a quiet market session.", whyItMatters: "K-ETS can be structurally thin, so end-of-day official interpretation matters." },
    "kr-compliance-window": { windowLabel: "Compliance season", title: "Check liquidity around reporting windows", trigger: "Review volume, spread behavior, and participation around filing and submission windows.", whyItMatters: "Institutional calendar effects are unusually important in K-ETS." },
    "cn-daily-window": { windowLabel: "Daily overview release", title: "Check the Shanghai daily overview", trigger: "Verify close, turnover, and cumulative statistics when the exchange overview is published.", whyItMatters: "The Chinese national market is still best read through daily overview and policy releases." },
    "cn-policy-window": { windowLabel: "Policy release", title: "Track MEE bulletins and sector expansion", trigger: "Use MEE releases to monitor reports, operating notices, and sector-expansion milestones.", whyItMatters: "Implementation speed and sector expansion remain key catalysts in China ETS." },
    "proxy-watch-window": { windowLabel: "Daily", title: "Check futures and ETF proxy gaps", trigger: "Review whether ICE EUA, KRBN, KEUA, or CO2.L diverge from the official market interpretation.", whyItMatters: "Listed proxies are accessible, but they are not the trusted core source layer." }
  }
} as const;

const planCopy = {
  ko: {
    "plan-01": { title: "벤치마크 재검토와 제품 재정의", goal: "브로커 앱이 아니라 탄소 인텔리전스 터미널로 제품 경계를 고정합니다.", outputs: ["벤치마크 맵", "규제 경계", "핵심 사용자 질문"] },
    "plan-02": { title: "정보 구조 재설계", goal: "앱을 개요, 워크스페이스, 알림, 실험실, 출처 중심으로 재구성합니다.", outputs: ["새 네비게이션", "레이아웃 프레임", "유틸리티 카피"] },
    "plan-03": { title: "글로벌 탄소 보드", goal: "EU ETS, K-ETS, China ETS를 한 화면에서 비교하는 보드를 만듭니다.", outputs: ["시장 보드", "공식 카드", "스캔 요약"] },
    "plan-04": { title: "드라이버 매트릭스와 이벤트 캘린더", goal: "국가별 가격 요인을 정리하고 운영 캘린더를 붙입니다.", outputs: ["드라이버 매트릭스", "이벤트 창", "변수 아틀라스"] },
    "plan-05": { title: "소스 레지스트리와 신뢰 센터", goal: "공식 웹, 공식 파일, 공개 API, 상업 API 층을 분리합니다.", outputs: ["소스 레지스트리", "신뢰 원칙", "신선도 표시"] },
    "plan-06": { title: "피드와 알림 허브", goal: "Carbon Pulse형 피드와 TradingView형 알림 레이어를 만듭니다.", outputs: ["일일 브리프", "알림 템플릿", "인박스"] },
    "plan-07": { title: "랩 재구성", goal: "시나리오, 워크포워드, 백테스트, 템플릿 저장을 한 흐름으로 묶습니다.", outputs: ["시나리오 랩", "워크포워드 패널", "백테스트 패널", "CSV 템플릿 저장"] },
    "plan-08": { title: "패키징, 문서, 배포", goal: "EXE를 다시 빌드하고 전략 문서를 갱신한 뒤 GitHub에 반영합니다.", outputs: ["포터블 EXE", "전략 문서", "GitHub 푸시"] }
  },
  en: {
    "plan-01": { title: "Benchmark review and product reframing", goal: "Lock the product boundary as a carbon intelligence terminal rather than a broker app.", outputs: ["Benchmark map", "Regulatory boundary", "Core user questions"] },
    "plan-02": { title: "Information architecture redesign", goal: "Rebuild the app around Overview, Workspace, Alerts, Lab, and Sources.", outputs: ["New navigation", "Layout frame", "English utility copy"] },
    "plan-03": { title: "Global carbon board", goal: "Build a unified board for EU ETS, K-ETS, and China ETS.", outputs: ["Market board", "Official cards", "Scan summary"] },
    "plan-04": { title: "Driver matrix and catalyst calendar", goal: "Organize price drivers by jurisdiction and add an operating calendar.", outputs: ["Driver matrix", "Catalyst windows", "Full variable atlas"] },
    "plan-05": { title: "Source registry and trust center", goal: "Separate official web, official file, public API, and commercial API layers.", outputs: ["Source registry", "Trust principles", "Freshness visibility"] },
    "plan-06": { title: "Feed and alerts hub", goal: "Build a Carbon Pulse-style feed and a TradingView-style alert layer for carbon markets.", outputs: ["Daily brief", "Alert templates", "Inbox"] },
    "plan-07": { title: "Lab reorganization", goal: "Unify scenario, walk-forward, backtest, and dataset-template export in one flow.", outputs: ["Scenario lab", "Walk-forward panel", "Backtest panel", "CSV template export"] },
    "plan-08": { title: "Packaging, docs, and deployment", goal: "Rebuild the EXE, update strategy docs, and push the validated result to GitHub.", outputs: ["Portable EXE", "Strategy docs", "GitHub push"] }
  }
} as const;

const sourceRegistryCopy = {
  ko: {
    "eex-auctions": { appUse: "EU 1차 경매 가격, 거래량, 커버율, 경매 일정", whyItMatters: "EU 탄소 가격과 공급 리듬을 읽는 가장 신뢰도 높은 공개 소스입니다.", notes: ["2026-04-09 확인. EEX가 공식 워크북과 경매 페이지를 제공합니다."] },
    "eex-datasource": { appUse: "향후 더 넓은 탄소시장 데이터 연동을 위한 프리미엄 경로", whyItMatters: "웹 수집만으로 부족해질 때 체계적인 거래소 데이터 공급 경로가 됩니다.", notes: ["2026-04-09 확인. 공식 EEX REST API 사용자 가이드 PDF를 공개합니다."] },
    "entso-e": { appUse: "EU 전력 수급, 발전, 밸런싱, 전력시장 드라이버", whyItMatters: "EU 탄소 가격은 전력 디스패치와 화력 발전 조건에 밀접하게 연결됩니다.", notes: ["2026-04-09 확인. ENTSO-E 문서에서 추출 방식과 사용 흐름을 확인했습니다."] },
    entsog: { appUse: "유럽 가스 흐름·인프라 데이터로 연료 전환 점검", whyItMatters: "가스 공급 조건은 청정 스파크 스프레드와 탄소 수요 기대를 크게 바꿉니다.", notes: ["2026-04-09 확인. JSON, XML, CSV, XLSX 다운로드 방식을 공식 문서에서 확인했습니다."] },
    "eurostat-api": { appUse: "EU 산업생산과 거시지표 오버레이", whyItMatters: "산업 활동은 이행 수요를 설명하는 핵심 변수군입니다.", notes: ["2026-04-09 확인. 공식 API 가이드에서 질의 구조와 파라미터 방식을 확인했습니다."] },
    "krx-ets": { appUse: "K-ETS 종가, 등락률, 거래량, 종목 정보, 규정 확인", whyItMatters: "한국 시장 가격과 구조를 확인하는 공식 출발점입니다.", notes: ["2026-04-09 확인. 현재 앱은 공식 웹 흐름과 샘플 데이터를 사용합니다.", "공식 문서에서 안정적인 공개 API는 별도로 확인되지 않았습니다."] },
    "kosis-openapi": { appUse: "한국 거시·산업 통계 오버레이", whyItMatters: "국내 산업·제조·에너지 통계는 K-ETS 수요 해석에 중요합니다.", notes: ["2026-04-09 확인. KOSIS Open API 가이드 PDF를 확인했습니다."] },
    "kma-openmet": { appUse: "한국 수요·계절성 분석을 위한 기상·기후 데이터", whyItMatters: "날씨는 전력 수요를 바꾸고 간접적으로 배출권 수요 조건을 움직일 수 있습니다.", notes: ["2026-04-09 확인. 기상청이 Open API와 다운로드 데이터를 제공함을 확인했습니다."] },
    "mee-report": { appUse: "중국 시장 구조, 데이터 품질, 인프라, 공시 체계 파악", whyItMatters: "전국 시장 운영 구조와 정보 아키텍처를 이해하는 핵심 공식 문서입니다.", notes: ["2026-04-09 확인. MEE가 정보망, 거래 시스템, 공시 흐름을 설명합니다."] },
    "cneeex-daily": { appUse: "중국 전국 시장의 일일 종가, 거래대금, 누적 통계", whyItMatters: "안정적인 공개 API가 분명하지 않을 때 가장 중요한 일일 수치 소스 중 하나입니다.", notes: ["2026-04-09 확인. 거래소가 전국 탄소시장 거래 정보를 공시·관리한다고 밝힙니다.", "앱에서는 원문 출처를 직접 표시해 확인 경로를 남깁니다."] }
  },
  en: {
    "eex-auctions": { appUse: "EU primary auction price, volume, cover ratio, and auction calendar", whyItMatters: "The highest-trust public source for reading EU carbon price and supply rhythm.", notes: ["Checked 2026-04-09. EEX provides both the official workbook and the auction page."] },
    "eex-datasource": { appUse: "Future premium route for broader carbon-market data coverage", whyItMatters: "Useful when workbook scraping is no longer enough and a systematic exchange data supply becomes necessary.", notes: ["Checked 2026-04-09. EEX publishes an official REST API user guide PDF."] },
    "entso-e": { appUse: "EU power balance, generation, balancing, and electricity-market drivers", whyItMatters: "EU carbon pricing remains tightly connected to dispatch and thermal generation conditions.", notes: ["Checked 2026-04-09. ENTSO-E documentation confirms the extraction and usage flow."] },
    entsog: { appUse: "European gas-flow and infrastructure data for fuel-switch monitoring", whyItMatters: "Gas supply conditions materially shift clean spark spread economics and carbon-demand expectations.", notes: ["Checked 2026-04-09. Official docs confirm JSON, XML, CSV, and XLSX download paths."] },
    "eurostat-api": { appUse: "EU industrial production and macro overlay", whyItMatters: "Industrial activity is a core variable group for compliance demand.", notes: ["Checked 2026-04-09. The official API guide confirms query structure and parameters."] },
    "krx-ets": { appUse: "K-ETS close, change, volume, instrument data, and rule reference", whyItMatters: "The official starting point for checking Korean market price and structure.", notes: ["Checked 2026-04-09. The app currently uses the official web flow and sample data.", "A stable public official API was not clearly confirmed in the official documentation."] },
    "kosis-openapi": { appUse: "Korean macro and industrial-statistics overlay", whyItMatters: "Domestic industry, manufacturing, and energy statistics help explain K-ETS demand.", notes: ["Checked 2026-04-09. Reviewed the official KOSIS Open API guide PDF."] },
    "kma-openmet": { appUse: "Weather and climate overlay for Korean demand and seasonality analysis", whyItMatters: "Weather can shift power demand and indirectly change allowance-demand conditions.", notes: ["Checked 2026-04-09. Verified that KMA provides Open API access and downloadable datasets."] },
    "mee-report": { appUse: "Understand Chinese market structure, data quality, infrastructure, and disclosure", whyItMatters: "A core official document for understanding the operating structure and information architecture of the national market.", notes: ["Checked 2026-04-09. MEE describes the information network, trading system, and disclosure flow."] },
    "cneeex-daily": { appUse: "Daily close, turnover, and cumulative statistics for the Chinese national market", whyItMatters: "One of the most important daily numerical sources when a stable public API is not clearly available.", notes: ["Checked 2026-04-09. The exchange states that it publishes and manages national ETS trading information.", "The app keeps the original source visible so operators can verify it directly."] }
  }
} as const;

function mergeLocalized<T extends { id: string }>(
  item: T,
  locale: AppLocale,
  maps: {
    ko: Partial<Record<string, Partial<T>>>;
    en: Partial<Record<string, Partial<T>>>;
  }
): T {
  const mapped = locale === "ko" ? maps.ko[item.id] : maps.en[item.id];
  return mapped ? { ...item, ...mapped } : item;
}

export function getUiCopy(locale: AppLocale): UiCopy {
  return uiCopy[locale];
}

export function getStatusLabel(locale: AppLocale, status: "connected" | "limited" | "error") {
  if (locale === "ko") {
    return status === "connected" ? "정상" : status === "limited" ? "제한" : "오류";
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
    return marketId === "cn-ets" ? "China ETS" : marketId === "k-ets" ? "K-ETS" : "EU ETS";
  }
  return marketId === "cn-ets" ? "China ETS" : marketId === "k-ets" ? "K-ETS" : "EU ETS";
}

export function localizeSurfaceTab<T extends { id: string; label: string; title: string; summary: string }>(
  item: T,
  locale: AppLocale
): T {
  return mergeLocalized(item, locale, surfaceCopy);
}

export function localizeDriverFamily<T extends { id: string; label: string; summary: string }>(
  item: T,
  locale: AppLocale
): T {
  return mergeLocalized(item, locale, driverFamilyCopy);
}

export function localizeWorkspacePreset(item: WorkspacePreset, locale: AppLocale): WorkspacePreset {
  return mergeLocalized(item, locale, workspaceCopy);
}

export function localizeWatchlistPreset(item: WatchlistPreset, locale: AppLocale): WatchlistPreset {
  return mergeLocalized(item, locale, watchlistCopy);
}

export function localizeWatchViewPreset(item: WatchViewPreset, locale: AppLocale): WatchViewPreset {
  return mergeLocalized(item, locale, watchViewCopy);
}

export function localizeTrustPrinciple(item: TrustPrinciple, locale: AppLocale): TrustPrinciple {
  return mergeLocalized(item, locale, trustCopy);
}

export function localizeSubscriptionFeature(
  item: SubscriptionFeature,
  locale: AppLocale
): SubscriptionFeature {
  return mergeLocalized(item, locale, subscriptionCopy);
}

export function localizeMarketWatchItem(item: MarketWatchItem, locale: AppLocale): MarketWatchItem {
  return mergeLocalized(item, locale, marketWatchCopy);
}

export function localizeBenchmark(item: BenchmarkPlatform, locale: AppLocale): BenchmarkPlatform {
  return mergeLocalized(item, locale, benchmarkCopy);
}

export function localizeOpenSourceBenchmark(
  item: OpenSourceBenchmark,
  locale: AppLocale
): OpenSourceBenchmark {
  return mergeLocalized(item, locale, openSourceBenchmarkCopy);
}

export function localizeAlertTemplate(item: AlertTemplate, locale: AppLocale): AlertTemplate {
  return mergeLocalized(item, locale, alertTemplateCopy);
}

export function localizeCatalystWindow(item: CatalystWindow, locale: AppLocale): CatalystWindow {
  return mergeLocalized(item, locale, catalystCopy);
}

export function localizeAutonomousPlanStep(
  item: AutonomousPlanStep,
  locale: AppLocale
): AutonomousPlanStep {
  return mergeLocalized(item, locale, planCopy);
}

export function localizeSourceRegistryItem(
  item: SourceRegistryItem,
  locale: AppLocale
): SourceRegistryItem {
  return mergeLocalized(item, locale, sourceRegistryCopy);
}
