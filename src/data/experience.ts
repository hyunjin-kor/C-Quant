import type {
  AlertTemplate,
  AutonomousPlanStep,
  BenchmarkPlatform,
  CatalystWindow,
  WatchViewPreset,
  WatchlistPreset,
  WorkspacePreset
} from "../types";

const accessed = "2026-04-09";

export const benchmarkPlatforms: BenchmarkPlatform[] = [
  {
    id: "toss-securities",
    name: "토스증권",
    category: "Consumer scan UX",
    strength:
      "홈, 피드, 주식 골라보기, 내 계좌 구조로 초보도 빠르게 시장을 훑을 수 있게 만듭니다.",
    differentiator:
      "큰 숫자, 짧은 라벨, 쉬운 카피, 참고용 정보 고지가 동시에 보이는 점이 강합니다.",
    source: {
      label: "토스증권",
      url: "https://www.tossinvest.com/",
      accessed
    },
    featuresToBorrow: [
      "홈과 피드 중심의 단순 탐색 구조",
      "실시간 차트, 거래량, 급상승처럼 스캔이 빠른 표면",
      "투자 정보는 참고용이라는 명확한 경계"
    ],
    implementedAs: [
      "개요 화면의 시장 보드",
      "오늘의 브리프 피드",
      "거래 중개 없음 경계 문구"
    ]
  },
  {
    id: "tradingview",
    name: "TradingView",
    category: "Trading workspace",
    strength:
      "다중 차트, 동기화된 레이아웃, 워치리스트, 뉴스, 알림을 하나의 작업면에 묶습니다.",
    differentiator:
      "데스크톱에서도 레이아웃과 워치리스트가 이어지는 작업 지속성이 강합니다.",
    source: {
      label: "TradingView Features",
      url: "https://www.tradingview.com/features/",
      accessed
    },
    featuresToBorrow: [
      "Up to 16 charts per screen과 synchronized symbols/timeframes",
      "synced layouts, watchlists, settings",
      "global real-time news와 다층 분석 도구"
    ],
    implementedAs: [
      "워크스페이스 프리셋",
      "마켓 워치와 뷰 프리셋",
      "알림 허브와 피드"
    ]
  },
  {
    id: "koyfin",
    name: "Koyfin",
    category: "Research dashboard",
    strength:
      "커스터마이즈 가능한 워치리스트와 대시보드로 리서치 워크플로우를 빠르게 구성합니다.",
    differentiator:
      "사용자 정의 뷰를 바꿔가며 같은 자산군을 다른 문맥에서 읽는 점이 뛰어납니다.",
    source: {
      label: "Koyfin Watchlists",
      url: "https://www.koyfin.com/features/watchlists/",
      accessed
    },
    featuresToBorrow: [
      "customizable watchlists",
      "dashboard-style monitoring",
      "research-first layout presets"
    ],
    implementedAs: [
      "저장형 워치리스트 프리셋",
      "워크뷰 전환",
      "국가별 비교 워크스페이스"
    ]
  },
  {
    id: "carbon-pulse",
    name: "Carbon Pulse",
    category: "Carbon news and dossiers",
    strength:
      "탄소시장, 온실가스 가격, 기후정책을 주제로 지역별 뉴스와 포털, 도시에를 묶습니다.",
    differentiator:
      "Daily News Ticker, Insights, ETS Dossiers 같은 편집형 정보 계층이 강합니다.",
    source: {
      label: "Carbon Pulse",
      url: "https://carbon-pulse.com/",
      accessed
    },
    featuresToBorrow: [
      "Daily News Ticker",
      "ETS Dossiers and portals",
      "지역·정책 축으로 정리된 피드"
    ],
    implementedAs: [
      "오늘의 시장 피드",
      "출처 레지스트리",
      "촉매 캘린더"
    ]
  },
  {
    id: "sylvera",
    name: "Sylvera",
    category: "Decision layer",
    strength:
      "ratings, market intelligence, market gateway를 묶어 신뢰와 설명 가능성을 앞세웁니다.",
    differentiator:
      "decision layer라는 포지셔닝과 trusted data framing이 강합니다.",
    source: {
      label: "Sylvera",
      url: "https://www.sylvera.com/",
      accessed
    },
    featuresToBorrow: [
      "trusted ratings and data framing",
      "market intelligence layer",
      "buyers, investors 관점의 설명 구조"
    ],
    implementedAs: [
      "신뢰 센터",
      "출처 방식 표시",
      "모델 경계와 설명 우선 설계"
    ]
  },
  {
    id: "clearblue",
    name: "ClearBlue Vantage",
    category: "Position optimization",
    strength:
      "시나리오 예측, 관할권 집계, 시장 인텔리전스를 통합해 컴플라이언스 포지션을 관리합니다.",
    differentiator:
      "jurisdiction-level consolidated view와 scenario forecasting을 하나의 운영 도구로 묶습니다.",
    source: {
      label: "ClearBlue Vantage Position Optimization",
      url: "https://www.clearbluemarkets.com/news/introducing-vantage-position-optimization-enhancing-carbon-market-management",
      accessed
    },
    featuresToBorrow: [
      "scenario forecasting",
      "jurisdictional aggregation",
      "unified dashboard for risk and reporting"
    ],
    implementedAs: [
      "크로스마켓 비교 보드",
      "시나리오 연구실",
      "관할권별 모니터링"
    ]
  }
];

export const workspacePresets: WorkspacePreset[] = [
  {
    id: "morning-scan",
    title: "아침 스캔 데스크",
    summary: "세 시장의 공식 가격, 밤사이 피드, 오늘 확인할 촉매를 3분 안에 훑습니다.",
    objective: "시장 상황 파악",
    moduleLabels: ["시장 보드", "오늘의 브리프", "촉매 캘린더", "신뢰 패널"],
    benchmarkIds: ["toss-securities", "carbon-pulse"],
    recommendedMarket: "shared"
  },
  {
    id: "cross-market",
    title: "크로스마켓 비교",
    summary: "EU ETS, K-ETS, China ETS를 같은 구조로 비교하면서 어떤 요인이 다른지 봅니다.",
    objective: "상대가치 비교",
    moduleLabels: ["드라이버 행렬", "공식 소스 카드", "ETF/선물 감시", "관할권 비교"],
    benchmarkIds: ["clearblue", "koyfin"],
    recommendedMarket: "shared"
  },
  {
    id: "policy-supply",
    title: "정책·공급 감시",
    summary: "경매, 할당, 제도 개편, 공지 피드처럼 가격 구조를 바꾸는 이벤트를 집중 감시합니다.",
    objective: "정책 위험 관리",
    moduleLabels: ["공급 일정", "정책 알림", "출처 레지스트리", "피드"],
    benchmarkIds: ["carbon-pulse", "sylvera"],
    recommendedMarket: "eu-ets"
  },
  {
    id: "futures-etf",
    title: "선물·ETF 감시",
    summary: "ICE EUA, ETF 발행사 페이지, Yahoo 외부 차트를 한 화면에서 연결해 빠르게 참조합니다.",
    objective: "프록시 모니터링",
    moduleLabels: ["마켓 워치", "워치리스트", "외부 링크", "가격 분기점 알림"],
    benchmarkIds: ["tradingview", "koyfin"],
    recommendedMarket: "eu-ets"
  },
  {
    id: "model-review",
    title: "모델 리뷰",
    summary: "시나리오, 워크포워드, 백테스트를 같은 흐름에서 점검합니다.",
    objective: "연구 검증",
    moduleLabels: ["시나리오 랩", "워크포워드", "백테스트", "데이터 준비도"],
    benchmarkIds: ["clearblue", "tradingview"],
    recommendedMarket: "k-ets"
  }
];

export const watchlistPresets: WatchlistPreset[] = [
  {
    id: "core-carbon",
    title: "핵심 배출권 모니터",
    summary: "공식 거래소와 일일 개황 중심으로 핵심 시장만 추립니다.",
    itemIds: ["ice-eua-official", "eex-eu-auctions", "krx-ets-watch", "cneeex-overview"],
    benchmarkIds: ["toss-securities", "koyfin"]
  },
  {
    id: "listed-proxies",
    title: "상장 프록시",
    summary: "ETF와 상장형 탄소 프록시를 빠르게 확인하는 목록입니다.",
    itemIds: [
      "krbn-official",
      "kcca-official",
      "keua-official",
      "yahoo-krbn",
      "yahoo-keua",
      "yahoo-co2",
      "yahoo-iceeua"
    ],
    benchmarkIds: ["tradingview", "koyfin"]
  },
  {
    id: "official-only",
    title: "공식 출처 전용",
    summary: "검증 우선 화면이 필요할 때 외부 포털을 빼고 공식 채널만 남깁니다.",
    itemIds: [
      "ice-eua-official",
      "eex-eu-auctions",
      "krx-ets-watch",
      "cneeex-overview",
      "krbn-official",
      "kcca-official",
      "keua-official"
    ],
    benchmarkIds: ["sylvera", "carbon-pulse"]
  }
];

export const watchViewPresets: WatchViewPreset[] = [
  {
    id: "scan-view",
    title: "스캔 뷰",
    summary: "이름, 역할, 출처만 크게 보여 빠르게 훑는 뷰입니다.",
    columns: ["상품", "역할", "카테고리"]
  },
  {
    id: "execution-view",
    title: "실행 보조 뷰",
    summary: "거래 전 확인용으로 카테고리와 메모를 함께 보여줍니다.",
    columns: ["상품", "역할", "카테고리", "메모"]
  },
  {
    id: "source-view",
    title: "검증 뷰",
    summary: "어디서 봐야 하는지 출처를 가장 강조합니다.",
    columns: ["상품", "카테고리", "링크", "메모"]
  }
];

export const alertTemplates: AlertTemplate[] = [
  {
    id: "official-refresh",
    title: "공식 소스 갱신 감시",
    scope: "EU ETS / K-ETS / China ETS",
    trigger: "공식 카드의 상태가 error 또는 limited로 바뀌면 즉시 인박스에 올립니다.",
    delivery: "인앱 인박스 + 일일 브리프",
    severity: "High",
    benchmarkId: "sylvera",
    enabledByDefault: true
  },
  {
    id: "auction-anomaly",
    title: "경매 이상치 감시",
    scope: "EU ETS / K-ETS",
    trigger: "경매 커버율, 낙찰가, 거래량이 평소 해석 범위를 벗어나면 표시합니다.",
    delivery: "인앱 배너 + 브리프",
    severity: "High",
    benchmarkId: "clearblue",
    enabledByDefault: true
  },
  {
    id: "policy-bulletin",
    title: "정책 공지 추적",
    scope: "EU / Korea / China",
    trigger: "정책·인프라 출처에 새 공지나 새 문서가 올라오면 피드와 알림에 연결합니다.",
    delivery: "피드 + 인박스",
    severity: "High",
    benchmarkId: "carbon-pulse",
    enabledByDefault: true
  },
  {
    id: "proxy-divergence",
    title: "ETF·선물 프록시 분기점",
    scope: "상장 프록시",
    trigger: "ETF/ETC 외부 워치와 공식 시장 해석이 어긋날 때 확인 대상으로 올립니다.",
    delivery: "워크스페이스 배지",
    severity: "Medium",
    benchmarkId: "tradingview",
    enabledByDefault: true
  },
  {
    id: "liquidity-thin",
    title: "유동성 저하 경보",
    scope: "K-ETS / China ETS",
    trigger: "거래량이 얇거나 공식 카드가 limited 상태일 때 실행 리스크를 강조합니다.",
    delivery: "인앱 인박스",
    severity: "Medium",
    benchmarkId: "koyfin",
    enabledByDefault: true
  },
  {
    id: "model-watch",
    title: "모델 오버레이 감시",
    scope: "연구실",
    trigger: "시나리오 점수나 워크포워드 결과가 강한 방향성을 보이면 참고용으로 기록합니다.",
    delivery: "연구실 보드",
    severity: "Low",
    benchmarkId: "clearblue",
    enabledByDefault: false
  }
];

export const catalystWindows: CatalystWindow[] = [
  {
    id: "eu-auction-window",
    marketId: "eu-ets",
    windowLabel: "매 경매일",
    title: "EEX 경매 테이프 확인",
    trigger: "낙찰가, 커버율, 경매 수량, 직전 경매 대비 가격 변화 확인",
    whyItMatters: "EU ETS의 공급 리듬과 단기 가격 압력을 읽는 가장 직접적인 운영 신호입니다.",
    source: {
      label: "EEX EU ETS Auctions",
      url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
      accessed
    }
  },
  {
    id: "eu-policy-window",
    marketId: "eu-ets",
    windowLabel: "정책 공지 시",
    title: "MSR·캡·ETS2 공급 정책 확인",
    trigger: "EU Commission 공지에서 공급 경로와 제도 변경 확인",
    whyItMatters: "중기 가격 형성을 바꾸는 구조적 변수는 여전히 정책 공급 경로입니다.",
    source: {
      label: "EU ETS",
      url: "https://climate.ec.europa.eu/eu-action/carbon-markets/about-eu-ets_en",
      accessed
    }
  },
  {
    id: "kr-close-window",
    marketId: "k-ets",
    windowLabel: "매 거래일 장마감 후",
    title: "KRX 종가·거래량 갱신",
    trigger: "KAU 종가, 등락률, 거래량, 거래 공백 여부 확인",
    whyItMatters: "K-ETS는 구조적으로 유동성이 얇을 수 있어 장마감 후 공식 수치 해석이 중요합니다.",
    source: {
      label: "KRX ETS Information Platform",
      url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
      accessed
    }
  },
  {
    id: "kr-compliance-window",
    marketId: "k-ets",
    windowLabel: "이행 시즌",
    title: "검증·제출 시즌 유동성 점검",
    trigger: "정책 발표와 이행 마감 주변에서 거래량, 스프레드, 참여자 흐름 확인",
    whyItMatters: "K-ETS는 제도 일정이 가격과 유동성에 미치는 영향이 상대적으로 큽니다.",
    source: {
      label: "KRX ETS Information Platform",
      url: "https://ets.krx.co.kr/",
      accessed
    }
  },
  {
    id: "cn-daily-window",
    marketId: "cn-ets",
    windowLabel: "일일 개황 발표 시",
    title: "상하이 거래소 일일 개황 확인",
    trigger: "종가, 거래대금, 누적 통계 공시 여부 확인",
    whyItMatters: "중국 전국 시장은 일일 개황과 정책 공지가 핵심 읽기 포인트입니다.",
    source: {
      label: "Shanghai Environment and Energy Exchange",
      url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
      accessed
    }
  },
  {
    id: "cn-policy-window",
    marketId: "cn-ets",
    windowLabel: "정책 공지 시",
    title: "MEE 공지와 확장 일정 추적",
    trigger: "MEE 피드에서 시장 운영 보고서, 제도 공지, 업종 확대 흐름 확인",
    whyItMatters: "중국 시장은 정책 구현 속도와 업종 확대가 핵심 촉매입니다.",
    source: {
      label: "MEE Carbon Market Feed",
      url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/",
      accessed
    }
  },
  {
    id: "proxy-watch-window",
    marketId: "shared",
    windowLabel: "매일",
    title: "선물·ETF 프록시 괴리 체크",
    trigger: "ICE EUA, KRBN, KEUA, CO2.L 같은 프록시가 공식 시장 해석과 어긋나는지 확인",
    whyItMatters: "상장 프록시는 접근성이 높지만 핵심 소스가 아니므로 괴리 감시가 필요합니다.",
    source: {
      label: "ICE EUA Futures",
      url: "https://www.ice.com/products/197",
      accessed
    }
  }
];

export const autonomousPlan: AutonomousPlanStep[] = [
  {
    id: "plan-01",
    timeBlock: "0:00-0:40",
    title: "벤치마크 정리와 제품 재정의",
    goal: "브로커 앱이 아니라 신뢰 가능한 탄소 인텔리전스 터미널로 제품 경계를 고정합니다.",
    outputs: ["벤치마크 맵", "규제 경계", "핵심 사용자 질문"]
  },
  {
    id: "plan-02",
    timeBlock: "0:40-2:00",
    title: "정보 구조 재설계",
    goal: "개요, 워크스페이스, 알림, 연구실, 출처라는 운영형 구조로 재편합니다.",
    outputs: ["새 내비게이션", "레이아웃 프레임", "한국어 utility copy"]
  },
  {
    id: "plan-03",
    timeBlock: "2:00-3:20",
    title: "글로벌 카본 보드 구현",
    goal: "EU ETS, K-ETS, China ETS를 한 화면에서 비교하는 공식 시장 보드를 만듭니다.",
    outputs: ["시장 보드", "공식 카드 연결", "스캔형 요약"]
  },
  {
    id: "plan-04",
    timeBlock: "3:20-4:20",
    title: "드라이버 행렬과 촉매 캘린더",
    goal: "가격 영향 인자를 국가별로 정리하고 가격 해석용 운영 캘린더를 붙입니다.",
    outputs: ["드라이버 매트릭스", "촉매 윈도우", "완전 변수 아틀라스"]
  },
  {
    id: "plan-05",
    timeBlock: "4:20-5:10",
    title: "출처 레지스트리와 신뢰 센터",
    goal: "공식 웹, 문서, 공개 API, 상업 API를 구분해 신뢰 경로를 노출합니다.",
    outputs: ["소스 레지스트리", "신뢰 원칙", "갱신 시각 노출"]
  },
  {
    id: "plan-06",
    timeBlock: "5:10-6:10",
    title: "피드와 알림 허브",
    goal: "Carbon Pulse식 피드와 TradingView식 알림 허브를 탄소시장용으로 재구성합니다.",
    outputs: ["오늘의 브리프", "알림 템플릿", "인앱 인박스"]
  },
  {
    id: "plan-07",
    timeBlock: "6:10-7:10",
    title: "연구실 정비",
    goal: "시나리오, 워크포워드, 백테스트, 데이터 템플릿 다운로드를 한 흐름으로 정리합니다.",
    outputs: ["Scenario lab", "Walk-forward panel", "Backtest panel", "CSV template export"]
  },
  {
    id: "plan-08",
    timeBlock: "7:10-8:00",
    title: "패키징, 문서화, 배포",
    goal: "EXE를 다시 만들고 전략 문서와 README를 갱신한 뒤 GitHub에 반영합니다.",
    outputs: ["Portable EXE", "전략 문서", "GitHub push"]
  }
];
