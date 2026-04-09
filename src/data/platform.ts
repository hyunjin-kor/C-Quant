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
    title: "공식 출처 우선",
    description:
      "가격, 정책, 시장 구조 패널은 거래소·정부·통계기관의 공식 발표를 우선 사용합니다."
  },
  {
    id: "freshness",
    title: "갱신 시점 상시 표시",
    description:
      "모든 시장 카드에 최신 출처 시각을 표시해, 실시간성에 가까운 데이터와 이벤트성 업데이트를 구분할 수 있게 합니다."
  },
  {
    id: "boundary",
    title: "거래 중개 없음",
    description:
      "이 서비스는 리서치, 모니터링, 알림을 지원하며 주문 접수나 배출권 거래 중개를 하지 않습니다."
  },
  {
    id: "explainability",
    title: "신호보다 설명 우선",
    description:
      "신호는 필요한 입력값과 모델 경고를 함께 보여줘서, 화면의 숫자가 왜 나타났는지 이해할 수 있게 합니다."
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
    appUse: "EU 1차 경매 가격, 거래량, 커버율, 경매 캘린더",
    whyItMatters:
      "EU 배출권 가격과 공급 리듬을 읽는 데 가장 신뢰도가 높은 공개 소스입니다.",
    notes: [`${accessed} 확인. EEX가 공개 워크북과 경매 페이지를 제공합니다.`]
  },
  {
    id: "eex-datasource",
    title: "EEX Group DataSource REST API",
    markets: ["eu-ets"],
    category: "Premium market data",
    method: "Commercial API",
    url: "https://www.eex.com/fileadmin/EEX/Downloads/Market_Data/EEX_Group_DataSource/API/EEX_Group_DataSource_REST_API__v2__User_Guide_v004.pdf",
    appUse: "더 넓은 탄소시장 데이터를 위한 향후 프리미엄 연동 경로",
    whyItMatters:
      "워크북 수집을 넘어 체계적인 거래소 데이터 공급이 필요해질 때 유용한 상업용 경로입니다.",
    notes: [`${accessed} 확인. 공식 EEX REST API 사용자 가이드 PDF에 접근 가능합니다.`]
  },
  {
    id: "entso-e",
    title: "ENTSO-E Transparency Platform",
    markets: ["eu-ets", "shared"],
    category: "Power fundamentals",
    method: "Public API",
    url: "https://www.entsoe.eu/data/transparency-platform/mop/",
    appUse: "EU 전력 수급, 발전량, 밸런싱, 전력시장 영향 변수",
    whyItMatters:
      "EU 탄소가격은 전력 디스패치와 화력 발전 여건과 강하게 연결돼 있습니다.",
    notes: [`${accessed} 확인. ENTSO-E 절차 문서에서 추출 및 사용 흐름을 확인했습니다.`]
  },
  {
    id: "entsog",
    title: "ENTSOG Transparency API",
    markets: ["eu-ets", "shared"],
    category: "Gas fundamentals",
    method: "Public API",
    url: "https://transparency.entsog.eu/pdf/TP_REG715_Documentation_TP_API_v1.4.pdf",
    appUse: "EUA 연료 전환 모니터링용 유럽 가스 흐름·인프라 데이터",
    whyItMatters:
      "가스 공급 여건은 클린 스파크 스프레드와 탄소 수요 기대를 크게 바꿉니다.",
    notes: [`${accessed} 확인. 공식 문서에서 JSON, XML, CSV, XLSX 엔드포인트를 확인했습니다.`]
  },
  {
    id: "eurostat-api",
    title: "Eurostat Statistics API",
    markets: ["eu-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/api",
    appUse: "EU 산업생산과 거시지표 오버레이",
    whyItMatters:
      "산업활동은 배출권 이행 수요를 설명하는 핵심 변수군입니다.",
    notes: [`${accessed} 확인. 공식 API 가이드에서 질의 구조와 필터링 방식을 확인했습니다.`]
  },
  {
    id: "krx-ets",
    title: "KRX ETS Information Platform",
    markets: ["k-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    appUse: "K-ETS 종가, 등락률, 거래량, 종목 정보, 규정 참고",
    whyItMatters:
      "한국 배출권 가격과 시장 구조를 확인하는 공식 진입점입니다.",
    notes: [
      `${accessed} 확인. 현재 앱은 공식 웹 흐름과 폼 엔드포인트를 사용합니다.`,
      "공식 문서에서 안정적인 공개 API는 별도로 확인되지 않았습니다."
    ]
  },
  {
    id: "kosis-openapi",
    title: "KOSIS Open API",
    markets: ["k-ets", "shared"],
    category: "Macro statistics",
    method: "Public API",
    url: "https://kosis.kr/openapi/file/UseGuideV2_0.pdf",
    appUse: "한국 거시·산업 통계 오버레이",
    whyItMatters:
      "국내 산업·제조업·에너지 통계는 K-ETS 수요 해석에 유용합니다.",
    notes: [`${accessed} 확인. 공식 KOSIS Open API 가이드 PDF를 확인했습니다.`]
  },
  {
    id: "kma-openmet",
    title: "KMA Open MET Data Portal",
    markets: ["k-ets", "shared"],
    category: "Weather and climate",
    method: "Public API",
    url: "https://data.kma.go.kr/resources/html/en/aowdp.html",
    appUse: "한국 수요·계절성 분석용 날씨·기후 오버레이",
    whyItMatters:
      "날씨는 냉난방과 전력 수요를 바꿔 배출권 수요에도 영향을 줄 수 있습니다.",
    notes: [`${accessed} 확인. 기상청이 다운로드 데이터와 Open API 제공을 명시합니다.`]
  },
  {
    id: "mee-report",
    title: "MEE Carbon Market Development Report 2025",
    markets: ["cn-ets"],
    category: "Policy and infrastructure",
    method: "Official File",
    url: "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/202509/W020250927515319387445.pdf",
    appUse: "중국 시장 구조, 데이터 품질, 인프라, 공시 체계 파악",
    whyItMatters:
      "전국 시장의 운영 구조와 정보 공개 체계를 이해하는 데 핵심적인 공식 문서입니다.",
    notes: [`${accessed} 확인. MEE가 정보망, 거래 시스템, 공시 인프라를 설명합니다.`]
  },
  {
    id: "cneeex-daily",
    title: "Shanghai Environment and Energy Exchange Daily Overview",
    markets: ["cn-ets"],
    category: "Primary price source",
    method: "Official Web",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    appUse: "중국 전국 탄소시장 일일 종가, 거래대금, 누적 거래 통계",
    whyItMatters:
      "공식 공개 API가 뚜렷하지 않은 상황에서 거래기관이 제공하는 핵심 일일 수치입니다.",
    notes: [
      `${accessed} 확인. 해당 페이지는 거래기관이 전국 탄소시장 거래 정보를 공시·관리한다고 밝힙니다.`,
      "출처 표시 없는 무단 재배포 제한 문구가 있어 앱에서는 반드시 출처와 함께 사용해야 합니다."
    ]
  }
];

export const subscriptionFeatures: SubscriptionFeature[] = [
  {
    id: "daily-brief",
    title: "일일 탄소 브리프",
    audience: "구독자",
    description:
      "아침마다 공식 피드 변화, 영향 요인 이동, 지역별 핵심 변화를 간단히 요약해 제공합니다."
  },
  {
    id: "driver-alerts",
    title: "영향 요인 알림",
    audience: "구독자",
    description:
      "경매 결과, 정책 발표, 시장 구조 지표가 평소 범위를 벗어나면 바로 알립니다."
  },
  {
    id: "watchlists",
    title: "저장된 관심 목록",
    audience: "구독자",
    description:
      "시장, 요인군, 브리핑 레이아웃을 저장해 개인화된 모니터링 화면을 유지할 수 있습니다."
  },
  {
    id: "weekly-memo",
    title: "주간 전략 메모",
    audience: "구독자",
    description:
      "한 주 동안 정책, 에너지, 유동성 환경이 어떻게 바뀌었는지 더 깊게 설명하는 리서치 메모입니다."
  }
];

export const marketWatchItems: MarketWatchItem[] = [
  {
    id: "ice-eua-official",
    title: "ICE EUA Futures",
    category: "Official futures venue",
    role: "핵심 선물 계약 기준",
    url: "https://www.ice.com/products/197",
    note: "유럽 배출권 선물 계약의 공식 상품 페이지입니다."
  },
  {
    id: "eex-eu-auctions",
    title: "EEX EU ETS Auctions",
    category: "Official exchange page",
    role: "핵심 경매·공급 모니터",
    url: "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions",
    note: "경매 낙찰 결과, 커버율, 일정 확인에 사용합니다."
  },
  {
    id: "krx-ets-watch",
    title: "KRX ETS Platform",
    category: "Official exchange page",
    role: "K-ETS 시세·시장 규칙",
    url: "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp",
    note: "한국 배출권 시장의 공식 시세 화면이자 정보 플랫폼입니다."
  },
  {
    id: "cneeex-overview",
    title: "Shanghai Environment and Energy Exchange",
    category: "Official exchange page",
    role: "중국 일일 시장 개황",
    url: "https://overview.cneeex.com/c/2025-12-24/496960.shtml",
    note: "중국 전국 탄소시장 일일 개황을 제공하는 공식 페이지입니다."
  },
  {
    id: "krbn-official",
    title: "KRBN",
    category: "Official issuer page",
    role: "글로벌 탄소 ETF 기준 상품",
    url: "https://kraneshares.com/krbn/",
    note: "KraneShares 글로벌 탄소 전략 ETF 공식 페이지입니다."
  },
  {
    id: "kcca-official",
    title: "KCCA",
    category: "Official issuer page",
    role: "캘리포니아 탄소 ETF",
    url: "https://kraneshares.com/etf/kcca/",
    note: "KraneShares 캘리포니아 탄소 전략 ETF 공식 페이지입니다."
  },
  {
    id: "keua-official",
    title: "KEUA",
    category: "Official issuer page",
    role: "유럽 탄소 ETF",
    url: "https://kraneshares.com/etf/keua/",
    note: "KraneShares 유럽 탄소 전략 ETF 공식 페이지입니다."
  },
  {
    id: "yahoo-krbn",
    title: "Yahoo KRBN",
    category: "External market watch",
    role: "빠른 ETF 차트·뉴스 확인",
    url: "https://de.finance.yahoo.com/quote/KRBN/",
    note: "외부 참고용 시세 페이지로만 사용하며, 내부 핵심 데이터 소스로 쓰지 않습니다."
  },
  {
    id: "yahoo-keua",
    title: "Yahoo KEUA",
    category: "External market watch",
    role: "EUA 중심 ETF 확인",
    url: "https://de.finance.yahoo.com/quote/KEUA/",
    note: "EUA 노출 상품의 공개 차트를 빠르게 볼 때 유용합니다."
  },
  {
    id: "yahoo-co2",
    title: "Yahoo CO2.L",
    category: "External market watch",
    role: "SparkChange EUA ETC 확인",
    url: "https://uk.finance.yahoo.com/quote/CO2.L/",
    note: "EU 배출권 노출과 연결된 상장 ETC 참고 페이지입니다."
  },
  {
    id: "yahoo-iceeua",
    title: "Yahoo ^ICEEUA",
    category: "External market watch",
    role: "ICE EUA 선물 초과수익 지수 확인",
    url: "https://uk.finance.yahoo.com/quote/%5EICEEUA/",
    note: "ICE EUA 탄소 연동 지수를 공개 기준으로 빠르게 확인할 때 유용합니다."
  }
];
