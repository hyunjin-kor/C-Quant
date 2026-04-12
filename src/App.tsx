import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type CSSProperties
} from "react";
import {
  ColumnChart,
  DonutMeter,
  Heatmap,
  LineChart,
  MiniTrendChart,
  MultiLineChart,
  PressureBar,
  Sparkline,
  WaterfallChart,
  type ChartPoint,
  type HeatmapRow,
  type MultiLinePoint,
  type MultiLineSeries
} from "./components/charts";
import { datasetTemplates, marketDatasetSchemas } from "./data/dataHub";
import {
  alertTemplates,
  benchmarkPlatforms,
  catalystWindows,
  watchViewPresets,
  watchlistPresets
} from "./data/experience";
import { openSourceBenchmarks } from "./data/openSourceBenchmarks";
import {
  creditLifecycleDossiers,
  natureRiskOverlays,
  registryOperationsTracks
} from "./data/projectIntel";
import {
  localeOptions,
  type AppLocale,
  getImportanceLabel,
  getMarketDisplayName,
  getSeverityLabel,
  getStatusLabel,
  localizeAlertTemplate,
  localizeBenchmark,
  localizeCatalystWindow,
  localizeMarketWatchItem,
  localizeOpenSourceBenchmark,
  localizeSourceRegistryItem,
  localizeSubscriptionFeature,
  localizeTrustPrinciple,
  localizeWatchViewPreset,
  localizeWatchlistPreset
} from "./data/locales";
import {
  marketWatchItems,
  sourceRegistry,
  subscriptionFeatures,
  trustPrinciples
} from "./data/platform";
import { marketProfiles, quantIndicators } from "./data/research";
import { parseCsv, runBacktest } from "./lib/backtest";
import { buildForecast } from "./lib/forecast";
import type {
  AppSettings,
  BacktestRun,
  BacktestStrategy,
  CreditLifecycleDossier,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  ConnectedSourceSeriesPoint,
  DecisionAssistantResponse,
  DecisionReasonItem,
  MarketLiveQuote,
  MarketDriver,
  MarketProfile,
  NatureRiskOverlay,
  ParsedSeriesPoint,
  RegistryOperationsTrack,
  WalkForwardResult
} from "./types";

const appIconUrl = new URL("../assets/app-icon.png", import.meta.url).href;

declare global {
  interface Window {
    desktopBridge?: {
      version: string;
      pickCsvFile: () => Promise<string | null>;
      readTextFile: (path: string) => Promise<string>;
      saveTextFile: (options: {
        defaultPath: string;
        content: string;
      }) => Promise<string | null>;
      openExternal: (url: string) => Promise<void>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      isWindowMaximized: () => Promise<boolean>;
      refreshConnectedSources: () => Promise<ConnectedSourcePayload>;
      getLiveQuoteHistory: (options: {
        quoteId: string;
        range: "1d" | "5d" | "1m" | "3m" | "6m" | "1y";
      }) => Promise<MarketLiveQuote>;
      runWalkForwardModel: (options: {
        inputPath: string;
        marketId: MarketProfile["id"];
        trainWindow: number;
        horizon: number;
      }) => Promise<WalkForwardResult>;
      getAppSettings: () => Promise<AppSettings>;
      saveAppSettings: (options: {
        openAIApiKey?: string;
        llmModel?: string;
      }) => Promise<AppSettings>;
      runDecisionAssistant: (payload: {
        locale: AppLocale;
        payload: Record<string, unknown>;
      }) => Promise<DecisionAssistantResponse>;
    };
  }
}

type Surface = "overview" | "signals" | "lab" | "sources";
type QuoteRangePreset = "1d" | "5d" | "1m" | "3m" | "6m" | "1y";

type AlertItem = {
  id: string;
  marketId: MarketProfile["id"] | "shared";
  severity: "High" | "Medium" | "Low";
  title: string;
  body: string;
};

type FeedItem = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "negative";
  link?: string;
};

type DriverFamily = {
  id: string;
  ko: string;
  en: string;
  matcher: (driver: MarketDriver) => boolean;
};

type SnapshotCard = {
  marketId: MarketProfile["id"];
  name: string;
  status: string;
  priceLabel: string;
  changeLabel: string;
  volumeLabel: string;
  asOf: string;
  sparkline: ChartPoint[];
  score: number;
  confidence: number;
};

type MarketBoardRow = SnapshotCard & {
  stance: DecisionAssistantResponse["stance"];
  updatedLabel: string;
  sourceName: string;
  topDriver: string;
  benchmarkTicker: string;
  benchmarkTitle: string;
  benchmarkRole: string;
  benchmarkValue: string;
  benchmarkMove: string;
  benchmarkNote: string;
  benchmarkDelay: string;
  benchmarkStatus: string;
  benchmarkSparkline: ChartPoint[];
  trackingStats: TapeCompareStats;
  operationsFocus: string;
  operationsCheck: string;
};

type TapeCompareStats = {
  overlapCount: number;
  normalizedGapPct: number | null;
  officialFiveDayReturnPct: number | null;
  quoteFiveDayReturnPct: number | null;
  recentCorrelation: number | null;
  directionMatchPct: number | null;
};

type OperatorDeskConfig = {
  primaryQuoteId: string;
  supportQuoteIds: string[];
  focus: string;
  check: string;
  executionNote: string;
  priorityItems: string[];
  invalidationChecks: string[];
};

type LinkedTapeScoreRow = {
  quote: MarketLiveQuote;
  stats: TapeCompareStats;
  alignmentLabel: string;
  alignmentTone: "positive" | "neutral" | "negative";
};

type DriverDecisionRow = {
  id: string;
  family: string;
  variable: string;
  importance: string;
  contribution: number;
  read: string;
  tone: "positive" | "neutral" | "negative";
  note: string;
  sourceLabel: string;
  sourceUrl?: string;
};

type SourceHealthRow = {
  id: string;
  name: string;
  role: string;
  kind: string;
  status: string;
  updated: string;
  freshness: string;
  note: string;
};

type RegistryFreshnessRow = {
  id: string;
  title: string;
  docType: string;
  status: "fresh" | "watch" | "stale";
  publishedAt: string;
  note: string;
  sourceUrl: string;
};

type SpotlightTone = "positive" | "neutral" | "negative";

type InteractionSpotlight = {
  id: string;
  kind: "market" | "tape" | "driver" | "catalyst" | "source" | "dossier" | "risk" | "registry";
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  tone: SpotlightTone;
  ctaLabel?: string;
  ctaSurface?: Surface;
  sourceLabel?: string;
  sourceUrl?: string;
};

type DeskRole = "compliance" | "trading" | "risk";

type ReferenceCenterItem = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  bullets: string[];
  url: string;
  kind: "market-watch" | "source-registry" | "benchmark" | "open-source" | "registry" | "dossier" | "document" | "risk" | "live-source";
};

type ReferenceContextMetric = {
  label: string;
  value: string;
};

type DeskRoleConfig = {
  id: DeskRole;
  ko: string;
  en: string;
  summaryKo: string;
  summaryEn: string;
  focusKo: string;
  focusEn: string;
  driverFamilies: string[];
};

const SURFACES: Array<{ id: Surface; ko: string; en: string }> = [
  { id: "overview", ko: "한눈에 보기", en: "Overview" },
  { id: "signals", ko: "지금 판단", en: "Decision" },
  { id: "lab", ko: "모델 실험", en: "Lab" },
  { id: "sources", ko: "출처", en: "Sources" }
];
const LIVE_QUOTE_RANGE_OPTIONS: QuoteRangePreset[] = ["1d", "5d", "1m", "3m", "6m", "1y"];

const DESK_ROLES: DeskRoleConfig[] = [
  {
    id: "compliance",
    ko: "\uCEF4\uD50C\uB77C\uC774\uC5B8\uC2A4",
    en: "Compliance",
    summaryKo: "\uACF5\uC2DD \uAE30\uC900\uAC12\uACFC \uC774\uD589 \uC77C\uC815 \uC911\uC2EC",
    summaryEn: "Prioritizes the official anchor, compliance calendar, and rule notices.",
    focusKo: "\uACF5\uC2DD \uC2DC\uC138\uC640 \uC774\uD589 \uC77C\uC815 \uC6B0\uC120",
    focusEn: "Official tape and compliance dates first",
    driverFamilies: ["Policy Supply", "Calendar Effects", "Power Complex", "Weather and Seasonality"]
  },
  {
    id: "trading",
    ko: "\uD2B8\uB808\uC774\uB529",
    en: "Trading",
    summaryKo: "\uD5E4\uC9C0 \uC575\uCEE4\uC640 \uACF4\uB9AC\uC728 \uC911\uC2EC",
    summaryEn: "Prioritizes hedge anchors, gap, correlation, volume, and short-horizon catalysts.",
    focusKo: "\uD5E4\uC9C0 \uC575\uCEE4\uC640 \uAC70\uB798\uB7C9 \uC6B0\uC120",
    focusEn: "Hedge anchor and volume first",
    driverFamilies: ["Fuel Switching", "Power Complex", "Macro and Financial", "Market Microstructure", "Policy Supply"]
  },
  {
    id: "risk",
    ko: "\uB9AC\uC2A4\uD06C",
    en: "Risk",
    summaryKo: "\uC18C\uC2A4 \uC2E0\uC120\uB3C4\uC640 \uBB34\uD6A8\uD654 \uC870\uAC74 \uC911\uC2EC",
    summaryEn: "Prioritizes source freshness, invalidation conditions, alerts, and policy risk.",
    focusKo: "\uC2E0\uC120\uB3C4\uC640 \uBB34\uD6A8\uD654 \uC870\uAC74 \uC6B0\uC120",
    focusEn: "Freshness and invalidation checks first",
    driverFamilies: ["Policy Supply", "Macro and Financial", "Market Microstructure", "Calendar Effects", "Power Complex"]
  }
];

const DRIVER_FAMILIES: DriverFamily[] = [
  {
    id: "policy",
    ko: "정책·공급",
    en: "Policy & Supply",
    matcher: (driver) => /policy|supply|calendar|implementation/i.test(driver.category)
  },
  {
    id: "power",
    ko: "전력·산업",
    en: "Power & Industry",
    matcher: (driver) => /power|industry/i.test(driver.category)
  },
  {
    id: "fuel",
    ko: "연료 전환",
    en: "Fuel Switching",
    matcher: (driver) => /fuel/i.test(driver.category)
  },
  {
    id: "macro",
    ko: "거시·금융",
    en: "Macro & Financial",
    matcher: (driver) => /macro|financial/i.test(driver.category)
  },
  {
    id: "execution",
    ko: "유동성·체결",
    en: "Liquidity & Execution",
    matcher: (driver) => /microstructure|internal market/i.test(driver.category)
  },
  {
    id: "environment",
    ko: "환경·계절성",
    en: "Environment",
    matcher: (driver) => /weather|environmental/i.test(driver.category)
  }
];

const MARKET_ACCENTS: Record<MarketProfile["id"], string> = {
  "eu-ets": "#2f7bf6",
  "k-ets": "#19b394",
  "cn-ets": "#f58b4a"
};

const POSITIVE = "#22c77a";
const NEGATIVE = "#ff6f61";
const emptySources: ConnectedSourcePayload = {
  fetchedAt: "",
  cards: [],
  liveQuotes: [],
  warnings: []
};
const defaultSettings: AppSettings = {
  hasOpenAIApiKey: false,
  llmModel: "gpt-4.1-mini"
};

const CATEGORY_LABELS_KO: Record<string, string> = {
  "Consumer scan UX": "소비자 스캔 UX",
  "Trading workspace": "트레이딩 워크스페이스",
  "Research dashboard": "리서치 대시보드",
  "Carbon news and dossiers": "탄소 뉴스·프로젝트 파일",
  "Decision layer": "의사결정 레이어",
  "Position optimization": "포지션 최적화",
  "Primary price source": "핵심 가격 소스",
  "Premium market data": "프리미엄 시장 데이터",
  "Power fundamentals": "전력 기초 데이터",
  "Gas fundamentals": "가스 기초 데이터",
  "Macro statistics": "거시 통계",
  "Weather and climate": "날씨·기후",
  "Policy and infrastructure": "정책·인프라",
  "Official futures venue": "공식 선물 거래소",
  "Official exchange page": "공식 거래소 페이지",
  "Official issuer page": "공식 운용사 페이지",
  "External market watch": "외부 시세 확인"
};

const METHOD_LABELS_KO: Record<string, string> = {
  "Official Web": "공식 웹",
  "Official File": "공식 문서",
  "Public API": "공개 API",
  "Commercial API": "상업 API"
};

function t(locale: AppLocale, ko: string, en: string) {
  return locale === "ko" ? ko : en;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readStoredChoice<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = window.localStorage.getItem(key);
  if (value && allowed.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

function readStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = window.localStorage.getItem(key);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return fallback;
}

function formatDate(locale: AppLocale, value?: string) {
  if (!value) {
    return t(locale, "미연결", "Unavailable");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatNumber(locale: AppLocale, value: number, digits = 2) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatCompact(locale: AppLocale, value: number) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function getSeriesDigits(points: ChartPoint[]) {
  const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 0);
  if (maxAbs >= 1000) {
    return 0;
  }
  if (maxAbs >= 100) {
    return 1;
  }
  return 2;
}

function formatSeriesValue(locale: AppLocale, points: ChartPoint[], value: number) {
  return formatNumber(locale, value, getSeriesDigits(points));
}

function parseLooseDate(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value).trim().replace(/\./g, "-"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFreshness(locale: AppLocale, value?: string) {
  const parsed = parseLooseDate(value);
  if (!parsed) {
    return t(locale, "갱신 시각 불명", "Update time unknown");
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfValue = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.max(
    0,
    Math.round((startOfToday.getTime() - startOfValue.getTime()) / (24 * 60 * 60 * 1000))
  );

  if (diffDays === 0) {
    return t(locale, "오늘 갱신", "Updated today");
  }
  if (diffDays === 1) {
    return t(locale, "1일 경과", "1 day old");
  }

  return t(locale, `${diffDays}일 경과`, `${diffDays} days old`);
}

function getContributionTone(value: number) {
  if (value > 0.08) {
    return "positive" as const;
  }
  if (value < -0.08) {
    return "negative" as const;
  }
  return "neutral" as const;
}

function getContributionRead(locale: AppLocale, value: number) {
  if (value > 0.08) {
    return t(locale, "가격 지지", "Supports price");
  }
  if (value < -0.08) {
    return t(locale, "가격 부담", "Pressures price");
  }
  return t(locale, "중립", "Mixed");
}

function parseNumber(value?: string) {
  if (!value) {
    return undefined;
  }
  const matches = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return matches ? Number(matches[0]) : undefined;
}

function findMetric(card: ConnectedSourceCard | undefined, keywords: string[]) {
  return card?.metrics.find((metric) =>
    keywords.some((keyword) => metric.label.toLowerCase().includes(keyword.toLowerCase()))
  );
}

function getSeriesPoints(series?: ConnectedSourceSeriesPoint[]): ChartPoint[] {
  return (series ?? [])
    .filter((point) => Number.isFinite(point.value))
    .map((point) => ({
      label: point.label ?? point.date,
      value: point.value
    }));
}

function getSeriesDayKey(label: string) {
  const parsed = new Date(label);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return label.slice(0, 10);
}

function getPriceMomentum(card?: ConnectedSourceCard) {
  const returnMetric = findMetric(card, ["return"]);
  if (returnMetric) {
    const returnValue = parseNumber(returnMetric.value);
    return returnValue !== undefined ? clamp(returnValue / 5, -1, 1) : 0;
  }

  const priceDelta = parseNumber(findMetric(card, ["price change", "day change"])?.value);
  const priceLevel = parseNumber(
    findMetric(card, ["auction price", "close", "year-end close"])?.value
  );

  if (priceDelta === undefined || priceLevel === undefined || priceLevel === 0) {
    return 0;
  }

  return clamp(((priceDelta / priceLevel) * 100) / 4, -1, 1);
}

function getVolumeSignal(card?: ConnectedSourceCard) {
  const volume = parseNumber(findMetric(card, ["volume"])?.value);
  const avgVolume = parseNumber(findMetric(card, ["20d avg volume"])?.value);
  if (volume === undefined) {
    return 0;
  }
  if (avgVolume && avgVolume > 0) {
    return clamp((volume / avgVolume - 1) * 0.9, -1, 1);
  }
  return clamp(volume / 300000, -1, 1);
}

function getCoverSignal(card?: ConnectedSourceCard) {
  const cover = parseNumber(findMetric(card, ["cover ratio"])?.value);
  if (cover === undefined) {
    return 0;
  }
  return clamp((cover - 1.1) / 1.5, -1, 1);
}

function getCalendarSignal(marketId: MarketProfile["id"]) {
  const month = new Date().getMonth() + 1;
  if (marketId === "k-ets") {
    return month >= 2 && month <= 4 ? 0.32 : 0.08;
  }
  if (marketId === "eu-ets") {
    return month >= 3 && month <= 5 ? 0.25 : 0.04;
  }
  return month >= 6 && month <= 9 ? 0.12 : 0.02;
}

function buildDriverState(profile: MarketProfile, card?: ConnectedSourceCard) {
  const momentum = getPriceMomentum(card);
  const volumeSignal = getVolumeSignal(card);
  const coverSignal = getCoverSignal(card);
  const calendarSignal = getCalendarSignal(profile.id);
  const statusSignal =
    !card ? -0.1 : card.status === "connected" ? 0.18 : card.status === "limited" ? -0.04 : -0.22;

  return Object.fromEntries(
    profile.drivers.map((driver) => {
      let value = statusSignal * 0.2;

      if (/policy|supply|implementation/i.test(driver.category)) {
        value += coverSignal * 0.65;
      }
      if (/calendar/i.test(driver.category)) {
        value += calendarSignal;
      }
      if (/microstructure|internal market/i.test(driver.category)) {
        value += volumeSignal * 0.72;
      }
      if (/power|fuel|macro|financial|industry|environmental|weather/i.test(driver.category)) {
        value += momentum * 0.54;
      }
      if (/offset/i.test(driver.variable)) {
        value += volumeSignal * 0.25;
      }

      return [driver.id, clamp(value, -1, 1)];
    })
  ) as Record<string, number>;
}

function getDriverFamily(driver: MarketDriver) {
  return DRIVER_FAMILIES.find((family) => family.matcher(driver)) ?? DRIVER_FAMILIES[0];
}

function familyScore(
  profile: MarketProfile,
  state: Record<string, number>,
  familyId: string
) {
  const drivers = profile.drivers.filter((driver) => getDriverFamily(driver).id === familyId);
  if (drivers.length === 0) {
    return 0;
  }

  const weighted = drivers.map((driver) => {
    const direction = driver.direction === "lower" ? -1 : 1;
    return (state[driver.id] ?? 0) * driver.weight * direction;
  });
  const totalWeight = drivers.reduce((sum, driver) => sum + driver.weight, 0) || 1;
  return clamp(weighted.reduce((sum, value) => sum + value, 0) / totalWeight, -1, 1);
}

function stanceLabel(locale: AppLocale, stance: DecisionAssistantResponse["stance"]) {
  if (locale === "en") {
    return stance;
  }
  if (stance === "Buy Bias") {
    return "매수 우위";
  }
  if (stance === "Reduce Bias") {
    return "매도 우위";
  }
  return "관망";
}

function stanceBadgeClass(stance: DecisionAssistantResponse["stance"]) {
  return stance === "Buy Bias" ? "bullish" : stance === "Reduce Bias" ? "bearish" : "neutral";
}

function toneFromStance(stance: DecisionAssistantResponse["stance"]): SpotlightTone {
  return stance === "Buy Bias" ? "positive" : stance === "Reduce Bias" ? "negative" : "neutral";
}

function toneFromContribution(value: number): SpotlightTone {
  return value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
}

function buildMarketSpotlight(
  locale: AppLocale,
  row: MarketBoardRow,
  decision: DecisionAssistantResponse
): InteractionSpotlight {
  return {
    id: `market-${row.marketId}`,
    kind: "market",
    eyebrow: t(locale, "선택한 시장", "Selected market"),
    title: row.name,
    summary: decision.summary,
    bullets: [
      `${t(locale, "공식 기준값", "Official anchor")}: ${row.priceLabel}`,
      `${t(locale, "연결된 비교 테이프", "Linked tape")}: ${row.benchmarkTitle} · ${row.benchmarkValue}`,
      `${t(locale, "지금 먼저 볼 것", "Look at first")}: ${row.operationsFocus}`,
      `${t(locale, "가장 큰 요인", "Top driver")}: ${row.topDriver}`
    ],
    tone: toneFromStance(row.stance),
    ctaLabel: t(locale, "판단 화면 열기", "Open decision"),
    ctaSurface: "signals"
  };
}

function buildTapeSpotlight(
  locale: AppLocale,
  quote: MarketLiveQuote,
  stats: TapeCompareStats
): InteractionSpotlight {
  return {
    id: `tape-${quote.id}`,
    kind: "tape",
    eyebrow: t(locale, "선택한 비교 테이프", "Selected tape"),
    title: quote.title,
    summary: quote.note,
    bullets: [
      `${t(locale, "현재값", "Current")}: ${formatLiveQuotePrice(locale, quote)}`,
      `${t(locale, "방향 일치", "Direction match")}: ${formatPercentStat(locale, stats.directionMatchPct, 0)}`,
      `${t(locale, "상관", "Correlation")}: ${formatPlainStat(locale, stats.recentCorrelation, 2)}`,
      `${t(locale, "주의", "Caution")}: ${quote.delayNote}`
    ],
    tone:
      (stats.directionMatchPct ?? 0) >= 60 && (stats.recentCorrelation ?? 0) >= 0.4
        ? "positive"
        : (stats.directionMatchPct ?? 0) < 40
          ? "negative"
          : "neutral",
    ctaLabel: t(locale, "출처 화면 열기", "Open sources"),
    ctaSurface: "sources",
    sourceLabel: t(locale, "원문 출처", "Source"),
    sourceUrl: quote.sourceUrl
  };
}

function buildDriverSpotlight(locale: AppLocale, row: DriverDecisionRow): InteractionSpotlight {
  return {
    id: `driver-${row.id}`,
    kind: "driver",
    eyebrow: t(locale, "선택한 드라이버", "Selected driver"),
    title: row.variable,
    summary: row.note,
    bullets: [
      `${t(locale, "현재 읽기", "Current read")}: ${row.read}`,
      `${t(locale, "점수", "Score")}: ${row.contribution > 0 ? "+" : ""}${formatNumber(locale, row.contribution, 2)}`,
      `${t(locale, "중요도", "Weight")}: ${row.importance}`,
      `${t(locale, "출처", "Source")}: ${row.sourceLabel}`
    ],
    tone: toneFromContribution(row.contribution),
    ctaLabel: t(locale, "판단 화면 열기", "Open decision"),
    ctaSurface: "signals",
    sourceLabel: row.sourceLabel,
    sourceUrl: row.sourceUrl
  };
}

function buildCatalystSpotlight(
  locale: AppLocale,
  row: ReturnType<typeof localizeCatalystWindow>
): InteractionSpotlight {
  return {
    id: `catalyst-${row.id}`,
    kind: "catalyst",
    eyebrow: t(locale, "선택한 일정", "Selected event"),
    title: row.title,
    summary: row.whyItMatters,
    bullets: [
      `${t(locale, "시점", "Window")}: ${row.windowLabel}`,
      `${t(locale, "트리거", "Trigger")}: ${row.trigger}`,
      `${t(locale, "출처", "Source")}: ${row.source.label}`
    ],
    tone: "neutral",
    ctaLabel: t(locale, "판단 화면 열기", "Open decision"),
    ctaSurface: "signals",
    sourceLabel: row.source.label,
    sourceUrl: row.source.url
  };
}

function buildSourceSpotlight(locale: AppLocale, row: SourceHealthRow): InteractionSpotlight {
  return {
    id: `source-${row.id}`,
    kind: "source",
    eyebrow: t(locale, "선택한 소스", "Selected source"),
    title: row.name,
    summary: row.note,
    bullets: [
      `${t(locale, "역할", "Role")}: ${row.role}`,
      `${t(locale, "상태", "Status")}: ${row.status}`,
      `${t(locale, "업데이트", "Updated")}: ${row.updated}`,
      `${t(locale, "신선도", "Freshness")}: ${row.freshness}`
    ],
    tone: row.status.toLowerCase().includes("error")
      ? "negative"
      : row.status.toLowerCase().includes("limited")
        ? "neutral"
        : "positive",
    ctaLabel: t(locale, "출처 화면 열기", "Open sources"),
    ctaSurface: "sources"
  };
}

function buildDossierSpotlight(locale: AppLocale, dossier: CreditLifecycleDossier): InteractionSpotlight {
  return {
    id: `dossier-${dossier.id}`,
    kind: "dossier",
    eyebrow: t(locale, "선택한 프로젝트 파일", "Selected dossier"),
    title: dossier.title,
    summary: dossier.currentRead,
    bullets: [
      `${t(locale, "레지스트리", "Registry")}: ${dossier.registry}`,
      `${t(locale, "유형", "Type")}: ${dossier.projectType}`,
      `${t(locale, "지역", "Region")}: ${dossier.region}`,
      `${t(locale, "운용 메모", "Use in desk")}: ${dossier.operatorUse}`
    ],
    tone:
      dossier.documents.some((item) => item.status === "stale")
        ? "negative"
        : dossier.documents.some((item) => item.status === "watch")
          ? "neutral"
          : "positive",
    ctaLabel: t(locale, "출처 화면 유지", "Stay in sources"),
    ctaSurface: "sources",
    sourceLabel: dossier.source.label,
    sourceUrl: dossier.source.url
  };
}

function buildRiskSpotlight(locale: AppLocale, overlay: NatureRiskOverlay): InteractionSpotlight {
  return {
    id: `risk-${overlay.id}`,
    kind: "risk",
    eyebrow: t(locale, "선택한 리스크 오버레이", "Selected risk overlay"),
    title: overlay.title,
    summary: overlay.summary,
    bullets: [
      `${t(locale, "지역", "Region")}: ${overlay.region}`,
      `${t(locale, "현재 읽기", "Current read")}: ${overlay.posture}`,
      ...overlay.watchItems.slice(0, 2)
    ],
    tone:
      overlay.components.some((item) => item.value >= 65)
        ? "negative"
        : overlay.components.some((item) => item.value >= 45)
          ? "neutral"
          : "positive",
    ctaLabel: t(locale, "판단 화면 열기", "Open decision"),
    ctaSurface: "signals",
    sourceLabel: overlay.source.label,
    sourceUrl: overlay.source.url
  };
}

function buildRegistryTrackSpotlight(
  locale: AppLocale,
  track: RegistryOperationsTrack
): InteractionSpotlight {
  return {
    id: `registry-${track.id}`,
    kind: "registry",
    eyebrow: t(locale, "선택한 레지스트리 운영 흐름", "Selected registry workflow"),
    title: track.registry,
    summary: track.operatorRead,
    bullets: [
      `${t(locale, "접근 방식", "Access method")}: ${track.accessMethod}`,
      `${t(locale, "검토 주기", "Refresh cadence")}: ${track.refreshCadence}`,
      `${t(locale, "신선도 기준", "Freshness SLA")}: ${track.freshnessSla}`
    ],
    tone:
      track.status === "healthy"
        ? "positive"
        : track.status === "blocked"
          ? "negative"
          : "neutral",
    ctaLabel: t(locale, "출처 화면 유지", "Stay in sources"),
    ctaSurface: "sources",
    sourceLabel: track.source.label,
    sourceUrl: track.source.url
  };
}

function getSpotlightEntityId(spotlight: InteractionSpotlight | null) {
  if (!spotlight) {
    return "";
  }

  const divider = spotlight.id.indexOf("-");
  return divider >= 0 ? spotlight.id.slice(divider + 1) : spotlight.id;
}

function normalizeReferenceUrl(url: string) {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function getReferenceHostLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function localizeReferenceKind(locale: AppLocale, kind: ReferenceCenterItem["kind"]) {
  const labels: Record<ReferenceCenterItem["kind"], { ko: string; en: string }> = {
    "market-watch": { ko: "시장 참고", en: "Market watch" },
    "source-registry": { ko: "출처 카드", en: "Source card" },
    benchmark: { ko: "벤치마크", en: "Benchmark" },
    "open-source": { ko: "오픈소스", en: "Open source" },
    registry: { ko: "레지스트리 운영", en: "Registry ops" },
    dossier: { ko: "프로젝트 파일", en: "Dossier" },
    document: { ko: "문서", en: "Document" },
    risk: { ko: "리스크", en: "Risk" },
    "live-source": { ko: "실시간 참고", en: "Live source" }
  };

  return locale === "ko" ? labels[kind].ko : labels[kind].en;
}

function getAccessTier(
  locale: AppLocale,
  method: "Official Web" | "Official File" | "Public API" | "Commercial API"
) {
  if (method === "Commercial API") {
    return {
      tone: "paid",
      label: t(locale, "유료 가능", "Paid option")
    };
  }

  if (method === "Public API") {
    return {
      tone: "signup",
      label: t(locale, "무료 가입 필요", "Free with signup")
    };
  }

  return {
    tone: "free",
    label: t(locale, "무료로 바로 보기", "Free to access")
  };
}

function lifecycleStatusLabel(
  locale: AppLocale,
  status: "done" | "active" | "queued" | "warning"
) {
  if (locale === "en") {
    if (status === "done") return "Done";
    if (status === "active") return "Active";
    if (status === "queued") return "Queued";
    return "Warning";
  }

  if (status === "done") return "완료";
  if (status === "active") return "진행 중";
  if (status === "queued") return "대기";
  return "주의";
}

function lifecycleStatusTone(status: "done" | "active" | "queued" | "warning") {
  if (status === "done") return "positive";
  if (status === "warning") return "negative";
  return "neutral";
}

function registryStatusLabel(locale: AppLocale, status: "fresh" | "watch" | "stale") {
  if (locale === "en") {
    if (status === "fresh") return "Fresh";
    if (status === "watch") return "Watch";
    return "Stale";
  }

  if (status === "fresh") return "최신";
  if (status === "watch") return "점검";
  return "오래됨";
}

function registryStatusTone(status: "fresh" | "watch" | "stale") {
  if (status === "fresh") return "positive";
  if (status === "stale") return "negative";
  return "neutral";
}

function registryHealthLabel(
  locale: AppLocale,
  status: "healthy" | "watch" | "blocked"
) {
  if (locale === "en") {
    if (status === "healthy") return "Healthy";
    if (status === "watch") return "Watch";
    return "Blocked";
  }

  if (status === "healthy") return "정상";
  if (status === "watch") return "점검";
  return "막힘";
}

function registryHealthTone(status: "healthy" | "watch" | "blocked") {
  if (status === "healthy") return "positive";
  if (status === "blocked") return "negative";
  return "neutral";
}

function dedupeStrings(items: string[], limit = 8) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, limit);
}

function dedupeReasonItems(items: DecisionReasonItem[], limit = 6) {
  const seen = new Set<string>();
  const result: DecisionReasonItem[] = [];
  for (const item of items) {
    const key = `${item.title}::${item.detail}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

function buildOperatorBrief(args: {
  locale: AppLocale;
  marketLabel: string;
  deskRole: DeskRole;
  decision: DecisionAssistantResponse;
  compareStats: TapeCompareStats;
  dossier: CreditLifecycleDossier | null;
  registryTrack: RegistryOperationsTrack | null;
  riskOverlay: NatureRiskOverlay | null;
  focus: string;
  check: string;
}) {
  const {
    locale,
    marketLabel,
    deskRole,
    decision,
    compareStats,
    dossier,
    registryTrack,
    riskOverlay,
    focus,
    check
  } = args;

  const sections: DecisionAssistantResponse["operatorBrief"] = [
    {
      title: t(locale, "현재 콜", "Current call"),
      summary: `${marketLabel} · ${getDeskRoleLabel(locale, deskRole)} · ${stanceLabel(locale, decision.stance)}`,
      bullets: dedupeStrings([decision.summary, ...decision.thesis.slice(0, 2)], 3)
    },
    {
      title: t(locale, "테이프 정합성", "Tape agreement"),
      summary: t(
        locale,
        `괴리 ${formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)} · 방향 일치 ${formatPercentStat(locale, compareStats.directionMatchPct, 0)} · 상관 ${formatPlainStat(locale, compareStats.recentCorrelation, 2)}`,
        `Gap ${formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)} · direction match ${formatPercentStat(locale, compareStats.directionMatchPct, 0)} · corr ${formatPlainStat(locale, compareStats.recentCorrelation, 2)}`
      ),
      bullets: dedupeStrings(
        [
          t(
            locale,
            `공식값 5일 변화 ${formatPercentStat(locale, compareStats.officialFiveDayReturnPct, 1, true)}`,
            `Official 5-day move ${formatPercentStat(locale, compareStats.officialFiveDayReturnPct, 1, true)}`
          ),
          t(
            locale,
            `비교 테이프 5일 변화 ${formatPercentStat(locale, compareStats.quoteFiveDayReturnPct, 1, true)}`,
            `Linked tape 5-day move ${formatPercentStat(locale, compareStats.quoteFiveDayReturnPct, 1, true)}`
          ),
          compareStats.overlapCount > 0
            ? t(locale, `겹치는 관측치 ${compareStats.overlapCount}건`, `${compareStats.overlapCount} overlapping observations`)
            : t(locale, "겹치는 관측치가 부족합니다.", "Overlap is still thin.")
        ],
        3
      )
    }
  ];

  if (dossier || registryTrack) {
    sections.push({
      title: t(locale, "증빙 게이트", "Evidence gate"),
      summary:
        registryTrack?.operatorRead ??
        dossier?.currentRead ??
        t(locale, "연결된 프로젝트 파일이 없습니다.", "No linked dossier."),
      bullets: dedupeStrings(
        [
          dossier
            ? t(locale, `${dossier.registry} · ${dossier.projectType}`, `${dossier.registry} · ${dossier.projectType}`)
            : "",
          registryTrack
            ? t(locale, `신선도 기준 ${registryTrack.freshnessSla}`, `Freshness SLA ${registryTrack.freshnessSla}`)
            : "",
          registryTrack
            ? t(locale, `검토 주기 ${registryTrack.refreshCadence}`, `Refresh cadence ${registryTrack.refreshCadence}`)
            : ""
        ],
        3
      )
    });
  }

  sections.push({
    title: t(locale, "운용 체크", "Operator checks"),
    summary: focus,
    bullets: dedupeStrings(
      [
        check,
        ...(registryTrack?.watchItems ?? []).slice(0, 1),
        ...(riskOverlay?.watchItems ?? []).slice(0, 1),
        ...decision.actions.slice(0, 1)
      ],
      4
    )
  });

  return sections.slice(0, 4);
}

function useLocalizedCatalysts(locale: AppLocale, marketId: MarketProfile["id"]) {
  return useMemo(
    () =>
      catalystWindows
        .map((item) => localizeCatalystWindow(item, locale))
        .filter((item) => item.marketId === marketId || item.marketId === "shared"),
    [locale, marketId]
  );
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function marketColor(marketId: MarketProfile["id"]) {
  return MARKET_ACCENTS[marketId];
}

function localizeLabel(locale: AppLocale, value: string, dictionary: Record<string, string>) {
  if (locale === "en") {
    return value;
  }
  return dictionary[value] ?? value;
}

function localizeMetricLabel(locale: AppLocale, label: string) {
  if (locale === "en") {
    return label;
  }

  const normalized = label.toLowerCase();
  if (normalized.includes("auction price")) return "경매가";
  if (normalized.includes("auction volume")) return "경매 수량";
  if (normalized.includes("cover ratio")) return "커버율";
  if (normalized.includes("auction revenue")) return "경매 대금";
  if (normalized.includes("price change")) return "직전 경매 대비";
  if (normalized === "close") return "종가";
  if (normalized.includes("day change")) return "전일 대비";
  if (normalized === "return") return "등락률";
  if (normalized === "volume") return "거래량";
  if (normalized.includes("20d avg volume")) return "20일 평균 거래량";
  if (normalized.includes("year-end close")) return "연말 종가";
  if (normalized.includes("average price")) return "평균 가격";
  if (normalized.includes("annual volume")) return "연간 거래량";
  if (normalized.includes("annual turnover")) return "연간 거래대금";
  return label;
}

const DRIVER_VARIABLE_LABELS_KO: Record<string, string> = {
  "Cap path, LRF, Fit for 55 revisions, ETS2 spillover expectations": "총량 경로, LRF, Fit for 55 개편, ETS2 파급",
  "TNAC and Market Stability Reserve auction withdrawals": "TNAC와 MSR 경매 유보",
  "Wholesale electricity price and implied thermal generation margin": "도매 전력가격과 화력 발전 마진",
  "TTF gas / LNG complex": "TTF 가스·LNG",
  "Rotterdam coal futures": "로테르담 석탄 선물",
  "Brent crude / broad commodity complex": "브렌트유·광범위 원자재 흐름",
  "Equity index, credit stress, EUR/CHF uncertainty": "주가 지수, 신용 스트레스, EUR/CHF 불확실성",
  "Industrial production and manufacturing activity": "산업생산과 제조업 활동",
  "Temperature extremes, heating demand, wind and hydro conditions": "기온 극단값, 난방 수요, 풍력·수력 조건",
  "Auction schedule, auction coverage, open interest, liquidity": "경매 일정, 커버율, 미결제약정, 유동성",
  "Compliance cycle and surrender deadlines": "이행 주기와 제출 마감",
  "Allocation balance, free allocation share, auction share": "할당 잔액, 무상할당 비중, 경매 비중",
  "Market Stabilization Mechanism and cancellation rules": "시장안정화 장치와 취소 규정",
  "Carryover, banking, and offset conversion rules": "이월, 뱅킹, 상쇄배출권 전환 규정",
  "KCU and KOC prices and transaction volumes": "KCU·KOC 가격과 거래량",
  "Verification report and surrender timing around February-March": "2~3월 검증보고·제출 일정",
  "Participation breadth, brokerage access, delegated trading": "참여 폭, 증권사 접근, 위탁거래",
  "WTI/Brent oil shock as fuel cost proxy": "WTI·브렌트 유가 충격",
  "Exchange rate and call rate": "환율과 콜금리",
  "Domestic equity conditions / stock index proxy": "국내 주식시장 여건",
  "Auction monthly carryover and bid ratio": "월별 경매 이월과 입찰 비율",
  "Sector expansion into steel, cement, and aluminum": "철강·시멘트·알루미늄으로의 부문 확대",
  "Power-sector reform and electricity spot price": "전력부문 개혁과 전력 현물가격",
  "Coal price and coal-heavy dispatch economics": "석탄 가격과 석탄 중심 발전 경제성",
  "LNG / natural gas price": "LNG·천연가스 가격",
  "Trading volume and depth": "거래량과 시장 깊이",
  "Intensity-based allowance allocation and compliance rules": "원단위 기반 할당과 이행 규정",
  "AQI / pollution pressure proxy": "AQI·오염 압력 지표",
  "Shanghai industrial index / industrial activity proxy": "상하이 산업지수·산업 활동 지표",
  "MRV quality, annual power emission factors, verification completion": "MRV 품질, 연간 전력 배출계수, 검증 완료율"
};

const DRIVER_NOTE_LABELS_KO: Record<string, string> = {
  "Scarcity depends on the cap, sector grouping, and how much supply is auctioned versus freely allocated.": "희소성은 총량, 업종 묶음, 경매 물량과 무상할당 비중에 따라 달라집니다.",
  "The 2026-2035 basic plan introduces automatic stabilization, which directly changes supply-demand adjustment expectations.": "2026~2035 기본계획의 자동 안정화 장치는 수급 조정 기대를 직접 바꿉니다.",
  "Relaxed carryover changes intertemporal scarcity and softens forced selling near compliance windows.": "이월 완화는 기간 간 희소성을 바꾸고 이행 구간의 강제 매도를 줄입니다.",
  "Local research shows complementary credit prices and volumes became statistically significant as the market matured.": "국내 연구에서는 시장이 성숙할수록 보완배출권 가격과 거래량의 설명력이 커졌습니다.",
  "The compliance filing calendar is one of the few variables shown as significant across commitment periods in Korean literature.": "국내 문헌에서 이행 신고 일정은 여러 기간에 걸쳐 유의하게 확인된 핵심 변수입니다.",
  "Liquidity reforms in February 2025 changed who can participate and how orders reach the market.": "2025년 2월 유동성 개편으로 참여 주체와 주문 유입 구조가 달라졌습니다.",
  "Oil acts as an external energy-cost proxy; its explanatory power rises after the market matures and policy frictions ease.": "유가는 외부 에너지 비용 대용치로 작동하며, 시장이 성숙할수록 설명력이 커집니다.",
  "Local evidence indicates that exchange rate and interest-rate conditions become significant once the market internalizes trading experience.": "국내 연구에서는 시장이 거래 경험을 내재화할수록 환율과 금리 조건의 영향이 커집니다.",
  "A useful secondary proxy for industrial cycle and compliance purchasing capacity.": "산업 사이클과 이행 매수 여력을 보는 보조 지표로 유용합니다.",
  "Auction design now reacts to prior-month bid ratios, so auction coverage becomes a live microstructure signal.": "경매 설계가 전월 입찰비율에 반응하므로 커버율 자체가 실시간 미시구조 신호가 됩니다."
};

const DRIVER_SOURCE_LABELS_KO: Record<string, string> = {
  "ICAP - K-ETS overview and phase structure": "ICAP - K-ETS 개요와 단계 구조",
  "KRX ETS platform - market feature overview": "KRX ETS 플랫폼 - 시장 특성 개요",
  "ICAP - fourth Basic Plan measures": "ICAP - 4차 기본계획 조치",
  "Korean MOE English press release on liquidity reform": "환경부 영문 보도자료 - 유동성 개편",
  "ICAP - 2024 liquidity measures": "ICAP - 2024 유동성 조치",
  "KEREA 2018 - learning-by-doing in K-ETS pricing": "자원환경경제연구 2018 - K-ETS 가격의 학습효과",
  "KRX ETS platform - offsets overview": "KRX ETS 플랫폼 - 상쇄배출권 개요",
  "KEREA 2018 - submission timing binary variables": "자원환경경제연구 2018 - 제출 시기 더미변수",
  "KRX ETS platform - verification and statement flow": "KRX ETS 플랫폼 - 검증·명세 흐름",
  "MOE English press release - wider institution access": "환경부 영문 보도자료 - 기관 접근 확대",
  "KRX ETS platform - account and consignment rules": "KRX ETS 플랫폼 - 계좌·위탁 규정",
  "KEREA 2018 - macro conditions become significant in second period": "자원환경경제연구 2018 - 2기 거시 변수 유의성",
  "KEREA 2018 - exchange rate and call rate significance": "자원환경경제연구 2018 - 환율·콜금리 유의성",
  "KEREA 2018 - stock price significance in second period": "자원환경경제연구 2018 - 2기 주가 유의성",
  "ICAP - auction volume linked to prior bid ratio": "ICAP - 전월 입찰비율 연동 경매 물량"
};

const LIVE_QUOTE_LABELS_KO: Record<
  string,
  Partial<Pick<MarketLiveQuote, "title" | "role" | "note" | "delayNote">>
> = {
  "eua-dec-benchmark": {
    title: "ICE EUA 12월물 기준 선물",
    role: "EU 탄소 리스크를 보는 대표 상장 헤지 테이프",
    note: "12월물 기준 계약입니다. 무료 차트 피드는 실시간 가격은 빠르게 보일 수 있어도 전체 히스토리는 얕을 수 있습니다.",
    delayNote: "참고용 차트 API 피드입니다. 거래소 지연이 있을 수 있습니다."
  },
  "ttf-gas-future": {
    title: "네덜란드 TTF 가스 선물",
    role: "EU 탄소의 연료 전환 드라이버",
    note: "가스는 단기 탄소 재평가를 움직이는 핵심 변수 중 하나입니다.",
    delayNote: "참고용 차트 API 피드입니다. 거래소 지연이 있을 수 있습니다."
  },
  "brent-future": {
    title: "브렌트유 선물",
    role: "거시 에너지 프록시",
    note: "탄소가 넓은 원자재 복합체와 함께 움직일 때 참고합니다.",
    delayNote: "참고용 차트 API 피드입니다. 거래소 지연이 있을 수 있습니다."
  },
  "co2-l-proxy": {
    title: "WisdomTree Carbon ETC",
    role: "상장형 EU 탄소 프록시",
    note: "ICE EUA 선물과 함께 상장형 탄소 프록시로 참고합니다.",
    delayNote: "참고용 차트 API 피드입니다. 상장 프록시로만 사용하세요."
  },
  "krbn-proxy": {
    title: "KRBN 글로벌 탄소 ETF",
    role: "현지 선물이 없을 때 보는 상장 탄소 프록시",
    note: "프록시일 뿐이며 현지 ETS 공식 종가로 해석하면 안 됩니다.",
    delayNote: "참고용 차트 API 피드입니다. 공식 탄소 가격이 아니라 상장 프록시입니다."
  },
  "keua-proxy": {
    title: "KEUA 유럽 탄소 ETF",
    role: "EU 탄소 노출을 보는 상장 프록시",
    note: "프록시일 뿐이며 공식 헤지 기준값은 여전히 ICE EUA 선물입니다.",
    delayNote: "참고용 차트 API 피드입니다. 공식 탄소 가격이 아니라 상장 프록시입니다."
  },
  "kcca-proxy": {
    title: "KCCA 캘리포니아 탄소 ETF",
    role: "북미 탄소 위험 선호를 보는 상장 프록시",
    note: "지역 시장 결제값이 아니라 추가적인 상장 탄소 슬리브로만 참고합니다.",
    delayNote: "참고용 차트 API 피드입니다. 공식 탄소 가격이 아니라 상장 프록시입니다."
  }
};

function localizeDriverVariable(locale: AppLocale, value: string) {
  if (locale === "en") {
    return value;
  }
  return DRIVER_VARIABLE_LABELS_KO[value] ?? value;
}

function localizeDriverNote(locale: AppLocale, value: string) {
  if (locale === "en") {
    return value;
  }
  return DRIVER_NOTE_LABELS_KO[value] ?? value;
}

function localizeDriverSourceLabel(locale: AppLocale, value: string) {
  if (locale === "en") {
    return value;
  }
  return DRIVER_SOURCE_LABELS_KO[value] ?? value;
}

function localizeLiveQuote(locale: AppLocale, quote: MarketLiveQuote | undefined) {
  if (!quote || locale === "en") {
    return quote;
  }
  const mapped = LIVE_QUOTE_LABELS_KO[quote.id];
  return mapped ? { ...quote, ...mapped } : quote;
}

function localizeConnectedCard(locale: AppLocale, card: ConnectedSourceCard | undefined) {
  if (!card) {
    return undefined;
  }

  if (locale === "en") {
    return card;
  }

  const sourceNames: Partial<Record<ConnectedSourceCard["id"], string>> = {
    "eu-ets-official": "EEX 공식 경매 리포트",
    "k-ets-official": "KRX ETS 공식 시세",
    "cn-ets-official": "중국 MEE 공식 공시 피드"
  };

  const coverageLabels: Partial<Record<ConnectedSourceCard["id"], string>> = {
    "eu-ets-official": "EU 1차 경매 공식 테이프",
    "k-ets-official": "KRX 공식 가격·거래량",
    "cn-ets-official": "MEE 정책·운영 공시"
  };

  const headline =
    card.headline === "Connection unavailable"
      ? "연결 불가"
      : card.id === "k-ets-official" && /official close/i.test(card.headline)
      ? "KRX 공식 종가"
      : card.headline;

  const summary =
    card.headline === "Connection unavailable"
      ? "현재 환경에서 공식 소스를 불러오지 못했습니다."
      : card.id === "eu-ets-official"
      ? card.summary
          .replace("Latest official primary auction cleared at EUR ", "가장 최근 공식 1차 경매 낙찰가: EUR ")
          .replace("/tCO2.", "/tCO2")
      : card.id === "k-ets-official"
        ? "KRX 공식 화면 기준 종가와 거래량입니다."
        : card.id === "cn-ets-official"
          ? "환경부 공시 피드 기준 최신 탄소시장 공지입니다."
          : card.summary;

  const notes = card.notes.map((note) => {
    if (/primary auctions/i.test(note)) {
      return "이 소스는 EU 1차 경매를 보여주며, ICE 2차 시장 선물 가격을 대체하지 않습니다.";
    }
    if (/zero-volume rows/i.test(note)) {
      return "휴장성 구간에서도 KRX는 거래량 0 행을 반환할 수 있으며, 앱은 해당 값을 그대로 표시합니다.";
    }
    if (/policy and operations releases/i.test(note)) {
      return "이 소스는 안정적인 일별 거래 테이프가 아니라 MEE의 정책·운영 공시 피드입니다.";
    }
    if (/Numeric operating metrics/i.test(note)) {
      return "수치형 운영 통계는 가장 최근의 통계 포함 공시에서 가져옵니다.";
    }
    if (/could not fetch/i.test(note)) {
      return "현재 환경에서 공식 소스를 불러오지 못했습니다.";
    }
    return note;
  });

  return {
    ...card,
    sourceName: sourceNames[card.id] ?? card.sourceName,
    coverage: coverageLabels[card.id] ?? card.coverage,
    seriesLabel:
      card.seriesLabel === "Auction price"
        ? "경매가"
        : card.seriesLabel === "Official close"
          ? "공식 종가"
          : card.seriesLabel,
    headline,
    summary,
    metrics: card.metrics.map((metric) => ({
      ...metric,
      label: localizeMetricLabel(locale, metric.label)
    })),
    notes
  };
}

function formatLiveQuotePrice(locale: AppLocale, quote: MarketLiveQuote | undefined) {
  if (!quote || quote.price === null) {
    return t(locale, "데이터 없음", "No tape");
  }

  const digits = Math.abs(quote.price) >= 100 ? 0 : Math.abs(quote.price) >= 10 ? 2 : 3;
  return `${quote.currency} ${formatNumber(locale, quote.price, digits)}`;
}

function formatLiveQuoteMove(locale: AppLocale, quote: MarketLiveQuote | undefined) {
  if (!quote || quote.change === null || quote.changePct === null) {
    return t(locale, "변동 데이터 없음", "No move data");
  }

  const sign = quote.change > 0 ? "+" : "";
  return `${sign}${formatNumber(locale, quote.change, 2)} (${sign}${formatNumber(
    locale,
    quote.changePct,
    2
  )}%)`;
}

function buildNormalizedTapeCompare(
  officialSeries?: ConnectedSourceSeriesPoint[],
  quoteSeries?: ConnectedSourceSeriesPoint[]
): MultiLinePoint[] {
  const overlap = buildTapeOverlap(officialSeries, quoteSeries);
  if (overlap.length < 2) {
    return [];
  }

  const officialBase = overlap[0]?.official || 1;
  const quoteBase = overlap[0]?.quote || 1;

  return overlap.map((point) => ({
      label: point.label,
      values: {
        official: officialBase === 0 ? 100 : (point.official / officialBase) * 100,
        quote: quoteBase === 0 ? 100 : (point.quote / quoteBase) * 100
      }
    }));
}

function buildTapeOverlap(
  officialSeries?: ConnectedSourceSeriesPoint[],
  quoteSeries?: ConnectedSourceSeriesPoint[]
) {
  const officialPoints = getSeriesPoints(officialSeries);
  const quotePoints = getSeriesPoints(quoteSeries);

  if (officialPoints.length < 2 || quotePoints.length < 2) {
    return [];
  }

  const officialByDay = new Map<string, number>();
  officialPoints.forEach((point) => {
    officialByDay.set(getSeriesDayKey(point.label), point.value);
  });

  const quoteByDay = new Map<string, number>();
  quotePoints.forEach((point) => {
    quoteByDay.set(getSeriesDayKey(point.label), point.value);
  });

  return Array.from(officialByDay.entries())
    .filter(([day]) => quoteByDay.has(day))
    .map(([day, official]) => ({
      label: day,
      official,
      quote: quoteByDay.get(day) ?? 0
    }));
}

function calculateCorrelation(left: number[], right: number[]) {
  if (left.length !== right.length || left.length < 2) {
    return null;
  }

  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;

  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }

  if (leftVariance === 0 || rightVariance === 0) {
    return null;
  }

  return covariance / Math.sqrt(leftVariance * rightVariance);
}

function buildTapeCompareStats(
  officialSeries?: ConnectedSourceSeriesPoint[],
  quoteSeries?: ConnectedSourceSeriesPoint[]
): TapeCompareStats {
  const overlap = buildTapeOverlap(officialSeries, quoteSeries);
  if (overlap.length < 2) {
    return {
      overlapCount: overlap.length,
      normalizedGapPct: null,
      officialFiveDayReturnPct: null,
      quoteFiveDayReturnPct: null,
      recentCorrelation: null,
      directionMatchPct: null
    };
  }

  const recentWindow = overlap.slice(-6);
  const first = recentWindow[0];
  const last = recentWindow[recentWindow.length - 1];
  const officialFiveDayReturnPct =
    first.official === 0 ? null : ((last.official - first.official) / first.official) * 100;
  const quoteFiveDayReturnPct =
    first.quote === 0 ? null : ((last.quote - first.quote) / first.quote) * 100;
  const normalizedGapPct =
    officialFiveDayReturnPct === null || quoteFiveDayReturnPct === null
      ? null
      : quoteFiveDayReturnPct - officialFiveDayReturnPct;

  const officialReturns: number[] = [];
  const quoteReturns: number[] = [];
  let directionMatches = 0;
  let directionCount = 0;

  for (let index = 1; index < recentWindow.length; index += 1) {
    const previous = recentWindow[index - 1];
    const current = recentWindow[index];
    if (previous.official === 0 || previous.quote === 0) {
      continue;
    }

    const officialReturn = (current.official - previous.official) / previous.official;
    const quoteReturn = (current.quote - previous.quote) / previous.quote;
    officialReturns.push(officialReturn);
    quoteReturns.push(quoteReturn);

    const officialDirection = Math.abs(officialReturn) < 0.000001 ? 0 : Math.sign(officialReturn);
    const quoteDirection = Math.abs(quoteReturn) < 0.000001 ? 0 : Math.sign(quoteReturn);
    if (officialDirection === quoteDirection) {
      directionMatches += 1;
    }
    directionCount += 1;
  }

  return {
    overlapCount: overlap.length,
    normalizedGapPct,
    officialFiveDayReturnPct,
    quoteFiveDayReturnPct,
    recentCorrelation: calculateCorrelation(officialReturns, quoteReturns),
    directionMatchPct: directionCount > 0 ? (directionMatches / directionCount) * 100 : null
  };
}

function getLiveQuoteStatusLabel(locale: AppLocale, quote: MarketLiveQuote | undefined) {
  if (!quote) {
    return t(locale, "미연결", "Unavailable");
  }

  if (quote.status === "connected") {
    return t(locale, "연결됨", "Connected");
  }
  if (quote.status === "limited") {
    return t(locale, "제한됨", "Limited");
  }
  return t(locale, "오류", "Error");
}

function getOperatorDesk(locale: AppLocale, marketId: MarketProfile["id"]) {
  if (marketId === "eu-ets") {
    return {
      primaryQuoteId: "eua-dec-benchmark",
      supportQuoteIds: ["co2-l-proxy", "keua-proxy", "ttf-gas-future"],
      focus: t(locale, "ICE EUA 선물과 공식 경매 가격의 괴리 확인", "Check ICE EUA futures versus the official auction tape"),
      check: t(
        locale,
        "TTF 가스 선물과 다음 경매 일정이 같은 방향을 가리키는지 확인",
        "Confirm that TTF gas and the next auction calendar still point in the same direction"
      )
    };
  }

  if (marketId === "k-ets") {
    return {
      primaryQuoteId: "krbn-proxy",
      supportQuoteIds: ["eua-dec-benchmark", "kcca-proxy"],
      focus: t(locale, "KRX 공식 시세와 글로벌 탄소 프록시의 방향 차이 확인", "Check KRX official tape versus the global listed carbon proxy"),
      check: t(
        locale,
        "국내 이행 시즌과 글로벌 탄소 약세·강세가 같이 가는지 확인",
        "Check whether the domestic compliance season is moving in line with the global carbon proxy"
      )
    };
  }

  return {
    primaryQuoteId: "krbn-proxy",
    supportQuoteIds: ["eua-dec-benchmark", "kcca-proxy"],
    focus: t(locale, "중국 공식 공시와 글로벌 탄소 프록시의 괴리 확인", "Check the China official bulletin versus the global listed carbon proxy"),
    check: t(
      locale,
      "섹터 확대 공시와 글로벌 탄소 방향이 충돌하는지 확인",
      "Check whether expansion notices conflict with the direction of the global carbon proxy"
    )
  };
}

function getInstitutionDesk(locale: AppLocale, marketId: MarketProfile["id"]): OperatorDeskConfig {
  if (marketId === "eu-ets") {
    return {
      primaryQuoteId: "eua-dec-benchmark",
      supportQuoteIds: ["co2-l-proxy", "keua-proxy", "ttf-gas-future"],
      focus: t(
        locale,
        "EEX 공식 가격을 기준으로 두고, ICE EUA 선물로 상장 시장이 먼저 움직이는지 같이 봅니다.",
        "Anchor on the EEX official tape and use ICE EUA futures to see whether the listed market is moving first."
      ),
      check: t(
        locale,
        "TTF 가스, 다음 경매 일정, 오늘 거래량이 같은 방향을 가리키는지 다시 확인합니다.",
        "Confirm that TTF gas, the next auction date, and today's volume are still pointing the same way."
      ),
      executionNote: t(
        locale,
        "EU ETS는 상장 선물이 먼저 반응할 수 있지만, 최종 기준은 공식 경매와 공식 시세입니다.",
        "EU ETS can react first through the listed future, but the final anchor is still the official auction and official market tape."
      ),
      priorityItems: [
        t(
          locale,
          "ICE EUA와 공식 시세가 같은 방향으로 움직이는지 먼저 확인합니다.",
          "Check whether ICE EUA and the official tape are moving in the same direction."
        ),
        t(
          locale,
          "TTF 가스가 탄소 가격을 밀어주고 있는지, 아니면 반대로 꺾고 있는지 봅니다.",
          "Check whether TTF gas is reinforcing the carbon move or leaning against it."
        ),
        t(
          locale,
          "다음 EEX 경매 일정과 오늘 거래량이 공격적으로 볼 만한 수준인지 확인합니다.",
          "Check whether the next EEX auction and today's volume support taking a stronger view."
        )
      ],
      invalidationChecks: [
        t(
          locale,
          "선물만 급등하고 공식 시세가 따라오지 않으면 신호를 약하게 봅니다.",
          "If the future jumps but the official tape does not follow, treat the signal as weaker."
        ),
        t(
          locale,
          "경매 결과가 약하거나 거래량이 급감하면 확신을 낮춥니다.",
          "If auction results soften or volume drops sharply, lower conviction."
        ),
        t(
          locale,
          "정책 경고나 공급 변화 공지가 나오면 공식 업데이트 전까지 기다립니다.",
          "If policy or supply alerts rise, wait for the official update before leaning harder."
        )
      ]
    };
  }

  if (marketId === "k-ets") {
    return {
      primaryQuoteId: "krbn-proxy",
      supportQuoteIds: ["eua-dec-benchmark", "kcca-proxy"],
      focus: t(
        locale,
        "KRX 공식 시세를 기준으로 두고, KRBN은 글로벌 분위기를 보는 참고용으로만 씁니다.",
        "Anchor on the KRX official tape and treat KRBN only as global context, not as a local settlement substitute."
      ),
      check: t(
        locale,
        "이행 시즌, 오늘 거래량, 최근 정책 공지가 그대로 유지되는지 확인합니다.",
        "Check whether compliance timing, today's volume, and policy notices still support the read."
      ),
      executionNote: t(
        locale,
        "K-ETS는 글로벌 프록시보다 국내 이행 일정과 유동성의 영향이 더 크게 작동할 수 있습니다.",
        "K-ETS can be driven more by domestic compliance timing and local liquidity than by the global proxy."
      ),
      priorityItems: [
        t(
          locale,
          "KRX 공식 가격과 거래량이 실제로 살아 있는지 먼저 확인합니다.",
          "Check whether the KRX official price and volume are genuinely active first."
        ),
        t(
          locale,
          "KRBN 방향은 참고하되, 국내 이행 시즌과 충돌하면 KRX 쪽을 우선합니다.",
          "Use KRBN as context, but if it conflicts with the domestic compliance season, prioritize the KRX tape."
        ),
        t(
          locale,
          "환경부·KRX 공지로 공급이나 제도 변화가 없는지 같이 확인합니다.",
          "Check MOE and KRX notices for supply or rule changes alongside the tape."
        )
      ],
      invalidationChecks: [
        t(
          locale,
          "거래량이 얇아지면 방향 신호보다 유동성 리스크를 더 크게 봅니다.",
          "If volume dries up, give liquidity risk more weight than the directional signal."
        ),
        t(
          locale,
          "글로벌 프록시만 움직이고 KRX 공식 가격이 정지되면 과하게 따라가지 않습니다.",
          "If only the global proxy moves while the KRX tape stays flat, avoid overreacting."
        ),
        t(
          locale,
          "이행 일정이나 제도 공지가 바뀌면 기존 판단을 바로 다시 검토합니다.",
          "If compliance timing or policy notices change, re-open the call immediately."
        )
      ]
    };
  }

  return {
    primaryQuoteId: "krbn-proxy",
    supportQuoteIds: ["eua-dec-benchmark", "kcca-proxy"],
    focus: t(
      locale,
      "중국은 MEE 공식 공지와 운영 발표를 먼저 보고, KRBN은 글로벌 분위기 확인용으로만 씁니다.",
      "Anchor on the MEE bulletin and operating release first, and use KRBN only as global mood context."
    ),
    check: t(
      locale,
      "부문 확대 공지, 공식 발표 날짜, 공식 거래 지표가 계속 같은 방향을 가리키는지 확인합니다.",
      "Check whether sector-expansion notices, bulletin timing, and official turnover still support the same direction."
    ),
    executionNote: t(
      locale,
      "China ETS는 글로벌 프록시보다 정책 범위 확대나 공식 운영 공지가 가격 판단에 더 크게 작용할 수 있습니다.",
      "China ETS can be moved more by policy scope changes and official operating releases than by the global proxy."
    ),
    priorityItems: [
      t(
        locale,
        "MEE 공식 발표 날짜와 최신 운영 수치를 먼저 확인합니다.",
        "Start with the latest MEE bulletin date and operating figures."
      ),
      t(
        locale,
        "부문 확대나 규정 변경 공지가 나오면 가격보다 정책 해석을 먼저 봅니다.",
        "If there is a sector-expansion or rule-change notice, prioritize policy interpretation over the proxy price."
      ),
      t(
        locale,
        "KRBN은 글로벌 위험 선호를 보는 보조 지표로만 사용합니다.",
        "Use KRBN only as a secondary read on global carbon risk appetite."
      )
    ],
    invalidationChecks: [
      t(
        locale,
        "정책 공지가 바뀌면 기존 방향 판단을 즉시 보류합니다.",
        "If the policy bulletin changes, put the old directional call on hold immediately."
      ),
      t(
        locale,
        "공식 거래 통계가 약해지면 글로벌 프록시 신호를 과대해석하지 않습니다.",
        "If official turnover weakens, do not over-read the global proxy signal."
      ),
      t(
        locale,
        "공식 발표와 프록시 방향이 크게 충돌하면 이벤트 리스크 구간으로 봅니다.",
        "If the official release and proxy direction conflict sharply, treat it as an event-risk window."
      )
    ]
  };
}

function localizeLiveQuoteCategory(locale: AppLocale, category: MarketLiveQuote["category"]) {
  if (category === "Benchmark futures") {
    return t(locale, "대표 선물", "Benchmark futures");
  }
  if (category === "Driver future") {
    return t(locale, "가격 변수 선물", "Driver future");
  }
  return t(locale, "상장 프록시", "Listed proxy");
}

function formatPercentStat(
  locale: AppLocale,
  value: number | null,
  digits = 1,
  signed = false
) {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "계산 불가", "N/A");
  }
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${formatNumber(locale, value, digits)}%`;
}

function formatPlainStat(locale: AppLocale, value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "계산 불가", "N/A");
  }
  return formatNumber(locale, value, digits);
}

function formatOverlapWindow(locale: AppLocale, overlapCount: number) {
  if (overlapCount <= 0) {
    return t(locale, "겹침 없음", "No overlap");
  }
  return locale === "ko" ? `${overlapCount}일` : `${overlapCount} days`;
}

function getTapeAlignment(locale: AppLocale, stats: TapeCompareStats) {
  if (stats.overlapCount < 2) {
    return {
      label: t(locale, "보조 참고", "Context only"),
      tone: "neutral" as const
    };
  }

  const gap = Math.abs(stats.normalizedGapPct ?? 0);
  const match = stats.directionMatchPct ?? 0;
  const correlation = stats.recentCorrelation ?? 0;

  if (match >= 70 && correlation >= 0.6 && gap <= 5) {
    return {
      label: t(locale, "정합 양호", "Well aligned"),
      tone: "positive" as const
    };
  }

  if (match >= 50 && correlation >= 0.2 && gap <= 10) {
    return {
      label: t(locale, "부분 정합", "Mixed"),
      tone: "neutral" as const
    };
  }

  return {
    label: t(locale, "정합 약함", "Weak"),
    tone: "negative" as const
  };
}

function localizeQuantIndicator(locale: AppLocale, indicator: (typeof quantIndicators)[number]) {
  if (locale === "en") {
    return indicator;
  }

  const overrides: Record<string, { name: string; family: string; whyItMatters: string }> = {
    "clean-spreads": {
      name: "클린 다크·스파크 스프레드",
      family: "연료 전환",
      whyItMatters: "석탄과 가스 중 어떤 발전원이 한계 발전원이 되는지 보여줘 배출권 수요를 직접 읽게 해줍니다."
    },
    "auction-signal": {
      name: "경매 커버율·공급 캘린더",
      family: "시장 미시구조",
      whyItMatters: "경매 리듬은 단기 공급 충격과 체결 슬리피지를 해석하는 핵심 단서입니다."
    },
    "compliance-seasonality": {
      name: "이행 시즌성",
      family: "캘린더",
      whyItMatters: "제출 시즌은 반복되는 유동성·수요 패턴을 만들어 약한 장세보다 더 강하게 작동할 수 있습니다."
    },
    "relative-value": {
      name: "리드-래그 상대가치",
      family: "상대가치",
      whyItMatters: "에너지나 산업지표가 먼저 움직이고 탄소가 뒤따를 때 잔차 기반 타이밍을 잡는 데 유용합니다."
    },
    "trend-regime": {
      name: "추세·변동성 레짐 필터",
      family: "리스크 관리",
      whyItMatters: "정책 헤드라인에 급변하는 구간에서 취약한 신호를 걸러 포지션 과민 반응을 줄입니다."
    },
    "open-interest-liquidity": {
      name: "미결제약정·거래량·참여 폭",
      family: "체결",
      whyItMatters: "방향은 맞아도 시장이 얇으면 실행이 무너지므로, 유동성 자체를 별도 신호로 봐야 합니다."
    }
  };

  const mapped = overrides[indicator.id];
  return mapped ? { ...indicator, ...mapped } : indicator;
}

function pickQuantIndicatorsForMarket(
  marketId: MarketProfile["id"],
  indicators: ReturnType<typeof localizeQuantIndicator>[]
) {
  const indicatorIds =
    marketId === "eu-ets"
      ? ["clean-spreads", "auction-signal", "relative-value", "trend-regime", "open-interest-liquidity"]
      : marketId === "k-ets"
        ? ["compliance-seasonality", "relative-value", "trend-regime", "auction-signal", "open-interest-liquidity"]
        : ["relative-value", "trend-regime", "open-interest-liquidity", "auction-signal"];

  return indicatorIds
    .map((id) => indicators.find((indicator) => indicator.id === id))
    .filter((indicator): indicator is ReturnType<typeof localizeQuantIndicator> => Boolean(indicator));
}

function buildDriverFamilyMixPoints(locale: AppLocale, rows: DriverDecisionRow[]) {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    totals.set(row.family, (totals.get(row.family) ?? 0) + Math.abs(row.contribution));
  });

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0) || 1;

  return Array.from(totals.entries())
    .map(([family, value]) => ({
      label: family,
      value: (value / total) * 100
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6)
    .map((point) => ({
      ...point,
      label:
        point.label.length > 18
          ? `${point.label.slice(0, 18)}...`
          : point.label
    }));
}

function localizeDatasetSchema(
  locale: AppLocale,
  schema: (typeof marketDatasetSchemas)[number]
) {
  if (locale === "en") {
    return schema;
  }

  const schemaNames: Record<string, { name: string; description: string }> = {
    "eu-ets-daily": {
      name: "EU ETS 일간 피처 스토어",
      description: "EUA 가격, 연료 전환, 경매 공급, 거시 스트레스를 위한 표준 학습 테이블입니다."
    },
    "k-ets-daily": {
      name: "K-ETS 일간 피처 스토어",
      description: "KAU 가격, 상쇄시장, 이행 시즌성, 유동성 레짐을 위한 표준 학습 테이블입니다."
    },
    "cn-ets-daily": {
      name: "중국 ETS 일간 피처 스토어",
      description: "전국 탄소시장 가격, 석탄·전력 연동, 정책 확장 이벤트를 위한 표준 학습 테이블입니다."
    }
  };

  const columnDescriptions: Record<string, string> = {
    date: "거래일",
    close: "종가",
    volume: "일 거래량",
    auction_cover: "경매 커버율",
    ttf_gas: "TTF 가스 근월물 또는 대체 프록시",
    power_price: "전력 현물 또는 근월물",
    coal_price: "석탄 벤치마크",
    brent: "브렌트유",
    industrial_output: "산업활동 지표",
    weather_index: "기온 또는 잔여수요 프록시",
    open_interest: "선물 미결제약정",
    policy_flag: "중요 정책 이벤트일이면 1",
    kcu_close: "KCU 종가",
    koc_close: "KOC 종가",
    wti: "WTI 유가",
    usdkrw: "원달러 환율",
    call_rate: "한국 콜금리",
    kospi: "국내 주가 프록시",
    compliance_flag: "이행 보고 구간이면 1",
    lng_price: "LNG 또는 가스 프록시",
    aqi: "대기질 지수 프록시",
    industrial_index: "산업활동 프록시",
    allocation_intensity: "할당 강도 또는 제도 프록시",
    sector_expansion_flag: "업종 확장 이벤트면 1"
  };

  const columnSourceHints: Record<string, string> = {
    "Exchange calendar": "거래소 캘린더",
    "ICE / EEX": "ICE / EEX",
    "ICE / broker feed": "ICE / 브로커 피드",
    "EEX auctions": "EEX 경매",
    "Gas data vendor": "가스 데이터 벤더",
    "EPEX / power vendor": "전력 데이터 벤더",
    "Coal vendor": "석탄 데이터 벤더",
    "Commodity vendor": "상품 데이터 벤더",
    "Eurostat / macro vendor": "Eurostat / 거시 데이터 벤더",
    "Weather provider": "날씨 데이터 벤더",
    ICE: "ICE",
    "Manual event calendar": "수동 이벤트 캘린더",
    "KRX calendar": "KRX 캘린더",
    "KRX ETS": "KRX ETS",
    "MOE / KRX auction release": "환경부 / KRX 경매 공시",
    "FX vendor": "환율 데이터 벤더",
    BoK: "한국은행",
    KRX: "KRX",
    "National market calendar": "전국 시장 캘린더",
    "National market data feed": "전국 시장 데이터 피드",
    "Power market feed": "전력시장 데이터 피드",
    "Environmental data provider": "환경 데이터 벤더",
    "Exchange / macro vendor": "거래소 / 거시 데이터 벤더",
    "Policy normalization layer": "정책 정규화 레이어",
    "MEE event calendar": "MEE 이벤트 캘린더"
  };

  return {
    ...schema,
    ...(schemaNames[schema.id] ?? {}),
    cadence: "일간",
    columns: schema.columns.map((column) => ({
      ...column,
      description: columnDescriptions[column.name] ?? column.description,
      sourceHint: columnSourceHints[column.sourceHint] ?? column.sourceHint
    }))
  };
}

function getSnapshotCard(
  locale: AppLocale,
  profile: MarketProfile,
  card: ConnectedSourceCard | undefined,
  score: number,
  confidence: number
): SnapshotCard {
  const priceMetric =
    findMetric(card, ["auction price"]) ??
    findMetric(card, ["close"]) ??
    findMetric(card, ["year-end close"]) ??
    findMetric(card, ["average price"]);

  const changeMetric =
    findMetric(card, ["price change"]) ??
    findMetric(card, ["day change"]) ??
    findMetric(card, ["return"]);

  const volumeMetric = findMetric(card, ["volume"]);

  return {
    marketId: profile.id,
    name: getMarketDisplayName(locale, profile.id),
    status: card ? getStatusLabel(locale, card.status) : t(locale, "미연결", "Unavailable"),
    priceLabel: priceMetric?.value ?? t(locale, "공식 가격 대기", "Waiting for official price"),
    changeLabel: changeMetric?.value ?? t(locale, "변화 미공개", "No change metric"),
    volumeLabel: volumeMetric?.value ?? t(locale, "거래량 미공개", "No volume metric"),
    asOf: formatDate(locale, card?.asOf),
    sparkline: getSeriesPoints(card?.series),
    score,
    confidence
  };
}

function buildRuleDecision(
  locale: AppLocale,
  market: MarketProfile,
  card: ConnectedSourceCard | undefined,
  forecast: ReturnType<typeof buildForecast>,
  alerts: AlertItem[],
  nextCatalysts: ReturnType<typeof useLocalizedCatalysts>,
  state: Record<string, number>
): DecisionAssistantResponse {
  let stance: DecisionAssistantResponse["stance"] =
    forecast.direction === "Bullish"
      ? "Buy Bias"
      : forecast.direction === "Bearish"
        ? "Reduce Bias"
        : "Hold / Wait";

  const highAlerts = alerts.filter((item) => item.severity === "High").length;
  const mediumAlerts = alerts.filter((item) => item.severity === "Medium").length;
  let confidence = forecast.confidence;

  if (card?.status === "limited") {
    confidence -= 0.1;
  }
  if (card?.status === "error") {
    confidence -= 0.22;
    stance = "Hold / Wait";
  }
  if (highAlerts > 0 && stance === "Buy Bias") {
    stance = "Hold / Wait";
  }
  confidence = clamp(confidence - highAlerts * 0.07 - mediumAlerts * 0.03, 0.18, 0.92);

  const detailedDrivers = forecast.contributions.slice(0, 6).map((entry) => {
    const driverMeta = market.drivers.find((driver) => driver.id === entry.driverId);
    const stateValue = state[entry.driverId] ?? 0;
    const driverLabel = localizeDriverVariable(locale, driverMeta?.variable ?? entry.variable);
    const directionWord =
      entry.contribution >= 0
        ? t(locale, "상방", "upside")
        : t(locale, "하방", "downside");
    const importanceLabel = driverMeta
      ? getImportanceLabel(locale, driverMeta.importance)
      : t(locale, "기본", "Base");

    return {
      ...entry,
      title: driverLabel,
      detail:
        locale === "ko"
          ? `${driverLabel}는 현재 ${directionWord} 압력 ${formatNumber(
              locale,
              Math.abs(entry.contribution),
              2
            )}점을 만들고 있습니다. 중요도는 ${importanceLabel}이고, 현재 시나리오 값은 ${formatNumber(
              locale,
              stateValue,
              2
            )}입니다. ${localizeDriverNote(locale, driverMeta?.note ?? "시장에 주는 방향성을 계속 확인해야 합니다.")}`
          : `${driverLabel} is contributing ${formatNumber(
              locale,
              Math.abs(entry.contribution),
              2
            )} points of ${directionWord} pressure. Importance is ${importanceLabel}, the current scenario state is ${formatNumber(
              locale,
              stateValue,
              2
            )}. ${localizeDriverNote(locale, driverMeta?.note ?? "Keep checking whether this driver is still active.")}`
    };
  });

  const positiveDrivers = detailedDrivers.filter((entry) => entry.contribution > 0.03);
  const negativeDrivers = detailedDrivers.filter((entry) => entry.contribution < -0.03);

  const supportingEvidence =
    stance === "Reduce Bias"
      ? negativeDrivers.slice(0, 3)
      : positiveDrivers.slice(0, 3);

  const counterEvidence = [
    ...(stance === "Reduce Bias" ? positiveDrivers.slice(0, 2) : negativeDrivers.slice(0, 2)),
    ...alerts.slice(0, 2).map((alert) => ({
      title: alert.title,
      detail: alert.body
    }))
  ].slice(0, 4);

  const thesis = supportingEvidence.map((item) => item.detail);

  const risks = [
    ...(card?.notes.slice(0, 2) ?? []),
    ...alerts.slice(0, 2).map((alert) => alert.title)
  ].slice(0, 4);

  const metricSummary = (card?.metrics ?? [])
    .slice(0, 3)
    .map((metric) => `${metric.label}: ${metric.value}`);

  const dataHealth = [
    card
      ? locale === "ko"
        ? `공식 데이터 상태는 ${getStatusLabel(locale, card.status)}입니다. 마지막 갱신 시각은 ${formatDate(
            locale,
            card.asOf
          )}입니다.`
        : `Official data status is ${getStatusLabel(locale, card.status)}. Last update time is ${formatDate(
            locale,
            card.asOf
          )}.`
      : t(locale, "공식 데이터가 아직 연결되지 않았습니다.", "Official data is not connected yet."),
    ...(metricSummary.length > 0
      ? [
          locale === "ko"
            ? `지금 바로 확인 가능한 핵심 수치는 ${metricSummary.join(", ")} 입니다.`
            : `Key values currently visible are ${metricSummary.join(", ")}.`
        ]
      : []),
    ...(card?.notes.slice(0, 2) ?? []),
    ...(alerts.length > 0
      ? [
          locale === "ko"
            ? `현재 활성 알림은 ${alerts.length}건이고, 그중 높은 우선순위는 ${highAlerts}건입니다.`
            : `There are ${alerts.length} active alerts, including ${highAlerts} high-priority items.`
        ]
      : [])
  ].slice(0, 6);

  const actions = [
    nextCatalysts[0]?.title ?? t(locale, "다음 촉매 일정 확인", "Check the next catalyst"),
    t(
      locale,
      "공식 카드의 갱신 시각과 거래량을 다시 확인",
      "Re-check the official timestamp and volume before acting"
    ),
    t(
      locale,
      "워치리스트에서 선물·ETF 프록시와 괴리가 있는지 비교",
      "Compare futures and ETF proxies against the official tape"
    )
  ];

  const checkpoints = [
    nextCatalysts[0]
      ? locale === "ko"
        ? `${nextCatalysts[0].title}: ${nextCatalysts[0].whyItMatters}`
        : `${nextCatalysts[0].title}: ${nextCatalysts[0].whyItMatters}`
      : t(locale, "예정된 촉매 일정을 다시 확인하세요.", "Review the next scheduled catalyst."),
    t(
      locale,
      "공식 가격, 거래량, 경매 결과가 같은 방향인지 다시 맞춰보세요.",
      "Re-check whether official price, volume, and auction results still point in the same direction."
    ),
    t(
      locale,
      "ETF나 외부 차트는 참고만 하고, 최종 판단은 공식 데이터 기준으로 하세요.",
      "Use ETFs and external charts as references only, and anchor the final call to official data."
    )
  ];

  return {
    provider: "rule",
    stance,
    confidence,
    summary:
      locale === "ko"
        ? `${getMarketDisplayName(locale, market.id)} 기준 현재 평가는 ${stanceLabel(
            locale,
            stance
          )}입니다. 상위 드라이버와 공식 소스 상태를 함께 보면 ${
            highAlerts > 0 ? "보수적으로 해석" : "조건부로 해석"
          }하는 편이 좋습니다.`
        : `The current posture for ${getMarketDisplayName(
            locale,
            market.id
          )} is ${stance}. Top drivers and source health suggest a ${
            highAlerts > 0 ? "more defensive" : "conditional"
          } read.`,
    thesis,
    risks,
    actions,
    supportingEvidence:
      supportingEvidence.length > 0
        ? supportingEvidence.map((item) => ({ title: item.title, detail: item.detail }))
        : [
            {
              title: t(locale, "결정적 우위 부족", "No dominant edge"),
              detail: t(
                locale,
                "매수나 매도를 강하게 밀어주는 요인이 아직 뚜렷하지 않습니다.",
                "No single factor is strong enough yet to justify an aggressive buy or reduce posture."
              )
            }
          ],
    counterEvidence:
      counterEvidence.length > 0
        ? counterEvidence
        : [
            {
              title: t(locale, "반대 근거 제한적", "Limited counter-evidence"),
              detail: t(
                locale,
                "현재 규칙 엔진 기준으로는 반대 방향 근거가 크지 않습니다.",
                "The rule engine currently sees only limited evidence against the base stance."
              )
            }
          ],
    dataHealth,
    checkpoints,
    operatorBrief: [],
    disclaimer: t(
      locale,
      "참고용 리서치 오버레이입니다. 이 플랫폼은 주문을 중개하지 않으며 개인 맞춤 자문을 제공하지 않습니다.",
      "Research overlay only. The platform does not route trades or provide individualized advice."
    ),
    generatedAt: new Date().toISOString()
  };
}

function buildExplainableRuleDecision(
  locale: AppLocale,
  market: MarketProfile,
  card: ConnectedSourceCard | undefined,
  forecast: ReturnType<typeof buildForecast>,
  alerts: AlertItem[],
  nextCatalysts: ReturnType<typeof useLocalizedCatalysts>,
  state: Record<string, number>
): DecisionAssistantResponse {
  let stance: DecisionAssistantResponse["stance"] =
    forecast.direction === "Bullish"
      ? "Buy Bias"
      : forecast.direction === "Bearish"
        ? "Reduce Bias"
        : "Hold / Wait";

  const highAlerts = alerts.filter((item) => item.severity === "High").length;
  const mediumAlerts = alerts.filter((item) => item.severity === "Medium").length;
  let confidence = forecast.confidence;

  if (card?.status === "limited") {
    confidence -= 0.1;
  }
  if (card?.status === "error") {
    confidence -= 0.22;
    stance = "Hold / Wait";
  }
  if (highAlerts > 0 && stance === "Buy Bias") {
    stance = "Hold / Wait";
  }
  confidence = clamp(confidence - highAlerts * 0.07 - mediumAlerts * 0.03, 0.18, 0.92);

  const detailedDrivers = forecast.contributions.slice(0, 6).map((entry) => {
    const driverMeta = market.drivers.find((driver) => driver.id === entry.driverId);
    const stateValue = state[entry.driverId] ?? 0;
    const driverLabel = localizeDriverVariable(locale, driverMeta?.variable ?? entry.variable);
    const importanceLabel = driverMeta
      ? getImportanceLabel(locale, driverMeta.importance)
      : t(locale, "기본", "Base");
    const driverNote =
      localizeDriverNote(
        locale,
        driverMeta?.note ??
      t(
        locale,
        "이 요인이 지금도 계속 유지되는지 다시 확인할 필요가 있습니다.",
        "Check whether this driver is still active right now."
      ));

    return {
      title: driverLabel,
      contribution: entry.contribution,
      detail:
        locale === "ko"
          ? `${driverLabel}는 현재 가격을 ${
              entry.contribution >= 0 ? "올리는" : "누르는"
            } 핵심 요인입니다. 의사결정 점수 기준 ${formatNumber(
              locale,
              Math.abs(entry.contribution),
              2
            )}점 규모의 압력을 만들고 있고, 중요도는 ${importanceLabel}, 현재 시나리오 값은 ${formatNumber(
              locale,
              stateValue,
              2
            )}입니다. ${driverNote}`
          : `${entry.variable} is a key driver that is currently ${
              entry.contribution >= 0 ? "lifting" : "pressuring"
            } the market. It contributes ${formatNumber(
              locale,
              Math.abs(entry.contribution),
              2
            )} points to the decision score. Importance is ${importanceLabel}, and the current scenario state is ${formatNumber(
              locale,
              stateValue,
              2
            )}. ${driverNote}`
    };
  });

  const positiveDrivers = detailedDrivers.filter((entry) => entry.contribution > 0.03);
  const negativeDrivers = detailedDrivers.filter((entry) => entry.contribution < -0.03);
  const topPositiveNames = positiveDrivers.slice(0, 2).map((entry) => entry.title).join(", ");
  const topNegativeNames = negativeDrivers.slice(0, 2).map((entry) => entry.title).join(", ");

  const holdReason: DecisionReasonItem = {
    title: t(locale, "신호가 한쪽으로 기울지 않음", "Signals are not one-sided"),
    detail:
      locale === "ko"
        ? `상방 요인${topPositiveNames ? `(${topPositiveNames})` : ""}과 하방 요인${
            topNegativeNames ? `(${topNegativeNames})` : ""
          }이 동시에 보입니다. 그래서 지금은 추격 매수나 성급한 매도보다, 공식 데이터가 같은 방향을 유지하는지 확인하는 쪽이 더 중요합니다.`
        : `Bullish drivers${topPositiveNames ? ` (${topPositiveNames})` : ""} and bearish drivers${
            topNegativeNames ? ` (${topNegativeNames})` : ""
          } are both active. Confirmation matters more than chasing the move right now.`
  };

  const supportingEvidence: DecisionReasonItem[] =
    stance === "Reduce Bias"
      ? negativeDrivers.slice(0, 4).map((item) => ({ title: item.title, detail: item.detail }))
      : stance === "Buy Bias"
        ? positiveDrivers.slice(0, 4).map((item) => ({ title: item.title, detail: item.detail }))
        : [
            holdReason,
            ...detailedDrivers.slice(0, 3).map((item) => ({ title: item.title, detail: item.detail }))
          ];

  const counterEvidenceCandidates =
    stance === "Reduce Bias"
      ? positiveDrivers
      : stance === "Buy Bias"
        ? negativeDrivers
        : detailedDrivers.filter((entry) => Math.abs(entry.contribution) > 0.04);

  const counterEvidence: DecisionReasonItem[] = [
    ...counterEvidenceCandidates
      .slice(0, 3)
      .map((item) => ({ title: item.title, detail: item.detail })),
    ...alerts.slice(0, 2).map((alert) => ({
      title: alert.title,
      detail: alert.body
    }))
  ].slice(0, 4);

  const safeSupportingEvidence =
    supportingEvidence.length > 0
      ? supportingEvidence
      : [
          {
            title: t(locale, "결정적 우위 부족", "No dominant edge"),
            detail: t(
              locale,
              "매수나 매도 한쪽으로 강하게 기울 정도의 결정적 신호는 아직 부족합니다.",
              "There is not yet enough evidence to justify an aggressive buy or reduce call."
            )
          }
        ];

  const safeCounterEvidence =
    counterEvidence.length > 0
      ? counterEvidence
      : [
          {
            title: t(locale, "반대 근거 제한적", "Limited counter-evidence"),
            detail: t(
              locale,
              "현재 규칙 엔진 기준으로는 반대 방향을 강하게 뒷받침하는 근거가 많지 않습니다.",
              "The rule engine currently sees only limited evidence against the base stance."
            )
          }
        ];

  const thesis = safeSupportingEvidence.map((item) => item.detail);
  const risks = [
    ...(card?.notes.slice(0, 2) ?? []),
    ...alerts.slice(0, 2).map((alert) => alert.title)
  ].slice(0, 4);

  const metricSummary = (card?.metrics ?? [])
    .slice(0, 3)
    .map((metric) => `${metric.label}: ${metric.value}`);

  const dataHealth = [
    card
      ? locale === "ko"
        ? `공식 데이터 상태는 ${getStatusLabel(locale, card.status)}이며, 마지막 갱신 시각은 ${formatDate(
            locale,
            card.asOf
          )}입니다.`
        : `Official data status is ${getStatusLabel(locale, card.status)}. Last update time is ${formatDate(
            locale,
            card.asOf
          )}.`
      : t(locale, "공식 데이터가 아직 연결되지 않았습니다.", "Official data is not connected yet."),
    ...(metricSummary.length > 0
      ? [
          locale === "ko"
            ? `지금 바로 확인 가능한 핵심 수치는 ${metricSummary.join(", ")} 입니다.`
            : `Key values currently visible are ${metricSummary.join(", ")}.`
        ]
      : []),
    ...(card?.notes.slice(0, 2) ?? []),
    ...(alerts.length > 0
      ? [
          locale === "ko"
            ? `현재 활성 알림은 ${alerts.length}건이며, 그중 높은 우선순위는 ${highAlerts}건입니다.`
            : `There are ${alerts.length} active alerts, including ${highAlerts} high-priority items.`
        ]
      : [])
  ].slice(0, 6);

  const actions = [
    nextCatalysts[0]?.title ?? t(locale, "다음 핵심 일정 확인", "Check the next catalyst"),
    t(
      locale,
      "공식 시세의 갱신 시각과 거래량을 다시 확인",
      "Re-check the official timestamp and volume before acting"
    ),
    t(
      locale,
      "외부 차트나 ETF 프록시와 공식 시세가 같은 방향인지 비교",
      "Compare futures and ETF proxies against the official tape"
    )
  ];

  const checkpoints = [
    nextCatalysts[0]
      ? `${nextCatalysts[0].title}: ${nextCatalysts[0].whyItMatters}`
      : t(locale, "예정된 핵심 일정을 다시 확인하세요.", "Review the next scheduled catalyst."),
    t(
      locale,
      "공식 가격, 거래량, 경매 결과가 같은 방향을 가리키는지 다시 맞춰보세요.",
      "Re-check whether official price, volume, and auction results still point in the same direction."
    ),
    t(
      locale,
      "ETF와 외부 차트는 참고용으로만 보고, 최종 판단은 공식 데이터에 맞추세요.",
      "Use ETFs and external charts as references only, and anchor the final call to official data."
    )
  ];

  const summaryLead =
    stance === "Buy Bias"
      ? topPositiveNames
      : stance === "Reduce Bias"
        ? topNegativeNames
        : [topPositiveNames, topNegativeNames].filter(Boolean).join(" / ");

  return {
    provider: "rule",
    stance,
    confidence,
    summary:
      locale === "ko"
        ? `${getMarketDisplayName(locale, market.id)} 기준 현재 판단은 ${stanceLabel(
            locale,
            stance
          )}입니다. ${
            summaryLead ? `${summaryLead}가 현재 방향을 가장 크게 만들고 있습니다. ` : ""
          }${
            highAlerts > 0
              ? "높은 우선순위 경고가 있어 공격적으로 보기보다 한 번 더 확인하는 편이 좋습니다."
              : "지금 보이는 데이터가 계속 유지되는지 확인하면서 따라가는 접근이 좋습니다."
          }`
        : `The current posture for ${getMarketDisplayName(
            locale,
            market.id
          )} is ${stance}. ${
            summaryLead ? `${summaryLead} is currently shaping the direction. ` : ""
          }${
            highAlerts > 0
              ? "High-priority alerts mean the stance should be treated more defensively."
              : "The read remains conditional on the current data holding up."
          }`,
    thesis,
    risks,
    actions,
    supportingEvidence: safeSupportingEvidence,
    counterEvidence: safeCounterEvidence,
    dataHealth,
    checkpoints,
    operatorBrief: [],
    disclaimer: t(
      locale,
      "참고용 리서치 화면입니다. 주문을 중계하지 않으며, 개인 맞춤형 투자 자문을 제공하지 않습니다.",
      "Research overlay only. The platform does not route trades or provide individualized advice."
    ),
    generatedAt: new Date().toISOString()
  };
}

function makeAlertInbox(
  locale: AppLocale,
  cards: ConnectedSourceCard[],
  forecasts: Record<MarketProfile["id"], ReturnType<typeof buildForecast>>
) {
  const items: AlertItem[] = [];

  for (const card of cards) {
    const marketName = getMarketDisplayName(locale, card.marketId);

    if (card.status === "error") {
      items.push({
        id: `${card.id}-error`,
        marketId: card.marketId,
        severity: "High",
        title: t(locale, `${marketName} 공식 소스 오류`, `${marketName} official source error`),
        body: card.summary
      });
    }

    if (card.status === "limited") {
      items.push({
        id: `${card.id}-limited`,
        marketId: card.marketId,
        severity: "Medium",
        title: t(locale, `${marketName} 공식 데이터 제한`, `${marketName} official coverage limited`),
        body: card.summary
      });
    }

    const volume = parseNumber(findMetric(card, ["volume"])?.value);
    const averageVolume = parseNumber(findMetric(card, ["20d avg volume"])?.value);
    if (
      volume !== undefined &&
      averageVolume !== undefined &&
      averageVolume > 0 &&
      volume < averageVolume * 0.4
    ) {
      items.push({
        id: `${card.id}-liquidity`,
        marketId: card.marketId,
        severity: "Medium",
        title: t(locale, `${marketName} 유동성 약화`, `${marketName} liquidity warning`),
        body: t(
          locale,
          `거래량이 20일 평균의 ${formatNumber(locale, (volume / averageVolume) * 100, 0)}% 수준입니다.`,
          `Volume is at ${formatNumber(locale, (volume / averageVolume) * 100, 0)}% of the 20-day average.`
        )
      });
    }
  }

  for (const profile of marketProfiles) {
    const forecast = forecasts[profile.id];
    if (Math.abs(forecast.score) > 1.6 && forecast.confidence > 0.55) {
      items.push({
        id: `${profile.id}-signal`,
        marketId: profile.id,
        severity: "Low",
        title: t(
          locale,
          `${getMarketDisplayName(locale, profile.id)} 신호 강도 확대`,
          `${getMarketDisplayName(locale, profile.id)} signal intensity rising`
        ),
        body: t(
          locale,
          `연구 엔진 점수 ${formatNumber(locale, forecast.score, 2)}, 신뢰도 ${formatNumber(
            locale,
            forecast.confidence * 100,
            0
          )}%`,
          `Research score ${formatNumber(locale, forecast.score, 2)} with ${formatNumber(
            locale,
            forecast.confidence * 100,
            0
          )}% confidence.`
        )
      });
    }
  }

  return items.slice(0, 9);
}

function makeFeedItems(
  locale: AppLocale,
  card: ConnectedSourceCard | undefined,
  decision: DecisionAssistantResponse,
  alerts: AlertItem[],
  catalysts: ReturnType<typeof useLocalizedCatalysts>
): FeedItem[] {
  const feed: FeedItem[] = [];

  if (card) {
    feed.push({
      id: `${card.id}-headline`,
      kicker: t(locale, "공식 헤드라인", "Official headline"),
      title: card.headline,
      body: card.summary,
      tone: card.status === "error" ? "negative" : "neutral",
      link: card.links[0]?.url
    });
  }

  feed.push({
    id: "decision",
    kicker: t(locale, "의사결정 엔진", "Decision engine"),
    title: stanceLabel(locale, decision.stance),
    body: decision.summary,
    tone:
      decision.stance === "Buy Bias"
        ? "positive"
        : decision.stance === "Reduce Bias"
          ? "negative"
          : "neutral"
  });

  for (const alert of alerts.slice(0, 2)) {
    feed.push({
      id: alert.id,
      kicker: t(locale, "알림", "Alert"),
      title: alert.title,
      body: alert.body,
      tone: alert.severity === "High" ? "negative" : "neutral"
    });
  }

  for (const catalyst of catalysts.slice(0, 2)) {
    feed.push({
      id: catalyst.id,
      kicker: t(locale, "다음 촉매", "Next catalyst"),
      title: catalyst.title,
      body: catalyst.whyItMatters,
      tone: "positive",
      link: catalyst.source.url
    });
  }

  return feed.slice(0, 6);
}

function buildDecisionPayload(args: {
  locale: AppLocale;
  market: MarketProfile;
  card: ConnectedSourceCard | undefined;
  liveQuotes: MarketLiveQuote[];
  forecast: ReturnType<typeof buildForecast>;
  familyScores: Record<string, number>;
  alerts: AlertItem[];
  catalysts: ReturnType<typeof useLocalizedCatalysts>;
  deskRole: DeskRole;
  compareStats: TapeCompareStats;
  dossier: CreditLifecycleDossier | null;
  registryTrack: RegistryOperationsTrack | null;
  natureRisk: NatureRiskOverlay | null;
  question: string;
}) {
  const {
    locale,
    market,
    card,
    liveQuotes,
    forecast,
    familyScores,
    alerts,
    catalysts,
    deskRole,
    compareStats,
    dossier,
    registryTrack,
    natureRisk,
    question
  } = args;

  return {
    question,
    locale,
    deskRole,
    market: {
      id: market.id,
      name: getMarketDisplayName(locale, market.id),
      region: market.region,
      stageNote: market.stageNote,
      sourceStatus: card?.status ?? "unavailable",
      asOf: card?.asOf ?? null,
      headline: card?.headline ?? null,
      summary: card?.summary ?? null,
      metrics: card?.metrics ?? []
    },
    forecast: {
      score: forecast.score,
      direction: forecast.direction,
      confidence: forecast.confidence,
      topDrivers: forecast.contributions.slice(0, 6).map((item) => ({
        ...item,
        variable: localizeDriverVariable(locale, item.variable)
      }))
    },
    familyScores,
    alerts: alerts.map((item) => ({
      severity: item.severity,
      title: item.title,
      body: item.body
    })),
    catalysts: catalysts.map((item) => ({
      title: item.title,
      trigger: item.trigger,
      whyItMatters: item.whyItMatters,
      source: item.source.url
    })),
    quantIndicators: quantIndicators.slice(0, 5).map((item) => ({
      name: item.name,
      family: item.family,
      whyItMatters: item.whyItMatters
    })),
    liveQuotes: liveQuotes.slice(0, 6).map((quote) => {
      const localizedQuote = localizeLiveQuote(locale, quote) ?? quote;
      return {
      title: localizedQuote.title,
      symbol: quote.symbol,
      category: quote.category,
      role: localizedQuote.role,
      note: localizedQuote.note,
      delayNote: localizedQuote.delayNote,
      status: quote.status,
      price: quote.price,
      change: quote.change,
      changePct: quote.changePct,
      currency: quote.currency,
      asOf: quote.asOf
    };
    }),
    tapeComparison: {
      gapPct: compareStats.normalizedGapPct,
      directionMatchPct: compareStats.directionMatchPct,
      correlation: compareStats.recentCorrelation,
      officialFiveDayReturnPct: compareStats.officialFiveDayReturnPct,
      quoteFiveDayReturnPct: compareStats.quoteFiveDayReturnPct
    },
    lifecycleDossier: dossier
      ? {
          title: dossier.title,
          registry: dossier.registry,
          projectType: dossier.projectType,
          region: dossier.region,
          currentRead: dossier.currentRead,
          operatorUse: dossier.operatorUse,
          stages: dossier.stages.map((stage) => ({
            label: stage.label,
            status: stage.status,
            note: stage.note
          })),
          documents: dossier.documents.map((doc) => ({
            title: doc.title,
            docType: doc.docType,
            publishedAt: doc.publishedAt,
            status: doc.status,
            note: doc.note
          }))
        }
      : null,
    registryOperations: registryTrack
      ? {
          registry: registryTrack.registry,
          accessMethod: registryTrack.accessMethod,
          refreshCadence: registryTrack.refreshCadence,
          freshnessSla: registryTrack.freshnessSla,
          lastReviewed: registryTrack.lastReviewed,
          status: registryTrack.status,
          operatorRead: registryTrack.operatorRead,
          steps: registryTrack.steps.map((step) => ({
            label: step.label,
            status: step.status,
            note: step.note
          })),
          watchItems: registryTrack.watchItems,
          blockers: registryTrack.blockers
        }
      : null,
    natureRisk: natureRisk
      ? {
          title: natureRisk.title,
          region: natureRisk.region,
          posture: natureRisk.posture,
          summary: natureRisk.summary,
          components: natureRisk.components,
          watchItems: natureRisk.watchItems
        }
      : null,
    officialSeries: (card?.series ?? []).slice(-18),
    notes: card?.notes ?? []
  };
}

export default function App() {
  const locale = useMemo(
    () =>
      readStoredChoice(
        "cquant:locale",
        localeOptions.map((item) => item.id),
        "ko"
      ),
    []
  );
  const [appLocale, setAppLocale] = useState<AppLocale>(locale);
  const [surface, setSurface] = useState<Surface>("overview");
  const [marketId, setMarketId] = useState<MarketProfile["id"]>(() =>
    readStoredChoice(
      "cquant:market",
      marketProfiles.map((item) => item.id),
      "k-ets"
    )
  );
  const [selectedLiveQuoteId, setSelectedLiveQuoteId] = useState<string>("");
  const [selectedQuoteRange, setSelectedQuoteRange] = useState<QuoteRangePreset>(() =>
    readStoredChoice("cquant:quote-range", LIVE_QUOTE_RANGE_OPTIONS, "5d")
  );
  const [interactiveQuote, setInteractiveQuote] = useState<MarketLiveQuote | null>(null);
  const [interactiveQuoteLoading, setInteractiveQuoteLoading] = useState(false);
  const [interactiveQuoteError, setInteractiveQuoteError] = useState<string | null>(null);
  const [spotlight, setSpotlight] = useState<InteractionSpotlight | null>(null);
  const [deskRole, setDeskRole] = useState<DeskRole>(() =>
    readStoredChoice(
      "cquant:desk-role",
      DESK_ROLES.map((item) => item.id),
      "trading"
    )
  );
  const [watchlistId, setWatchlistId] = useState<string>("core-carbon");
  const [watchViewId, setWatchViewId] = useState<string>("scan-view");
  const [freeOnlySources, setFreeOnlySources] = useState<boolean>(() =>
    readStoredBoolean("cquant:free-only-sources", true)
  );
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [selectedRegistryTrackId, setSelectedRegistryTrackId] = useState<string>("");
  const [selectedRiskOverlayId, setSelectedRiskOverlayId] = useState<string>("");
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>("");
  const [selectedReferenceUrl, setSelectedReferenceUrl] = useState<string>("");
  const [connectedSources, setConnectedSources] = useState<ConnectedSourcePayload>(emptySources);
  const [refreshingSources, setRefreshingSources] = useState(false);
  const [windowMaximized, setWindowMaximized] = useState(false);
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvSeries, setCsvSeries] = useState<ParsedSeriesPoint[]>([]);
  const [walkForwardResult, setWalkForwardResult] = useState<WalkForwardResult | null>(null);
  const [runningWalkForward, setRunningWalkForward] = useState(false);
  const [backtestStrategy, setBacktestStrategy] = useState<BacktestStrategy>("trend");
  const [backtestFeeBps, setBacktestFeeBps] = useState(8);
  const [backtestRun, setBacktestRun] = useState<BacktestRun | null>(null);
  const [scenarioOverrides, setScenarioOverrides] = useState<
    Partial<Record<MarketProfile["id"], Record<string, number>>>
  >({});
  const [assistantQuestion, setAssistantQuestion] = useState(
    "Explain the current carbon market posture, the contrary case, registry freshness risk, and what should be checked next."
  );
  const [assistantResponse, setAssistantResponse] = useState<DecisionAssistantResponse | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [modelDraft, setModelDraft] = useState(defaultSettings.llmModel);

  const selectedMarket = useMemo(
    () => marketProfiles.find((item) => item.id === marketId) ?? marketProfiles[0],
    [marketId]
  );

  const localizedWatchlists = useMemo(
    () => watchlistPresets.map((item) => localizeWatchlistPreset(item, appLocale)),
    [appLocale]
  );
  const localizedWatchViews = useMemo(
    () => watchViewPresets.map((item) => localizeWatchViewPreset(item, appLocale)),
    [appLocale]
  );
  const localizedSources = useMemo(
    () => sourceRegistry.map((item) => localizeSourceRegistryItem(item, appLocale)),
    [appLocale]
  );
  const selectedDeskRole = useMemo(
    () => DESK_ROLES.find((item) => item.id === deskRole) ?? DESK_ROLES[1],
    [deskRole]
  );
  const localizedBenchmarks = useMemo(
    () => benchmarkPlatforms.map((item) => localizeBenchmark(item, appLocale)),
    [appLocale]
  );
  const localizedOpenSourceBenchmarks = useMemo(
    () => openSourceBenchmarks.map((item) => localizeOpenSourceBenchmark(item, appLocale)),
    [appLocale]
  );
  const localizedSubscription = useMemo(
    () => subscriptionFeatures.map((item) => localizeSubscriptionFeature(item, appLocale)),
    [appLocale]
  );
  const localizedTrust = useMemo(
    () => trustPrinciples.map((item) => localizeTrustPrinciple(item, appLocale)),
    [appLocale]
  );
  const localizedWatchItems = useMemo(
    () => marketWatchItems.map((item) => localizeMarketWatchItem(item, appLocale)),
    [appLocale]
  );
  const activeWatchlist = useMemo(
    () => localizedWatchlists.find((item) => item.id === watchlistId) ?? localizedWatchlists[0],
    [localizedWatchlists, watchlistId]
  );
  const activeWatchView = useMemo(
    () => localizedWatchViews.find((item) => item.id === watchViewId) ?? localizedWatchViews[0],
    [localizedWatchViews, watchViewId]
  );
  const watchlistItems = useMemo(() => {
    const ids = new Set(activeWatchlist.itemIds);
    return localizedWatchItems.filter((item) => ids.has(item.id));
  }, [activeWatchlist.itemIds, localizedWatchItems]);
  const selectedSources = useMemo(
    () =>
      localizedSources.filter(
        (item) => item.markets.includes(marketId) || item.markets.includes("shared")
      ),
    [localizedSources, marketId]
  );
  const visibleSources = useMemo(
    () =>
      selectedSources.filter((item) => !freeOnlySources || item.method !== "Commercial API"),
    [freeOnlySources, selectedSources]
  );
  const localizedAlerts = useMemo(
    () => alertTemplates.map((item) => localizeAlertTemplate(item, appLocale)),
    [appLocale]
  );
  const localizedCatalysts = useLocalizedCatalysts(appLocale, marketId);
  const localizedQuantIndicators = useMemo(
    () => quantIndicators.map((item) => localizeQuantIndicator(appLocale, item)),
    [appLocale]
  );
  const selectedQuantPlaybook = useMemo(
    () => pickQuantIndicatorsForMarket(marketId, localizedQuantIndicators),
    [localizedQuantIndicators, marketId]
  );
  const visibleDossiers = useMemo(
    () =>
      creditLifecycleDossiers.filter(
        (item) => item.markets.includes("shared") || item.markets.includes(marketId)
      ),
    [marketId]
  );
  const selectedDossier = useMemo(
    () => visibleDossiers.find((item) => item.id === selectedDossierId) ?? visibleDossiers[0] ?? null,
    [selectedDossierId, visibleDossiers]
  );
  const visibleRegistryTracks = useMemo(() => {
    const relevant = registryOperationsTracks.filter(
      (item) => item.markets.includes("shared") || item.markets.includes(marketId)
    );

    if (!selectedDossier) {
      return relevant;
    }

    return relevant.sort((left, right) => {
      if (left.id === selectedDossier.registryTrackId) return -1;
      if (right.id === selectedDossier.registryTrackId) return 1;
      return left.registry.localeCompare(right.registry);
    });
  }, [marketId, selectedDossier]);
  const selectedRegistryTrack = useMemo(
    () =>
      visibleRegistryTracks.find((item) => item.id === selectedRegistryTrackId) ??
      visibleRegistryTracks[0] ??
      null,
    [selectedRegistryTrackId, visibleRegistryTracks]
  );
  const visibleNatureRiskOverlays = useMemo(() => {
    const relevant = natureRiskOverlays.filter(
      (item) =>
        (item.markets.includes("shared") || item.markets.includes(marketId)) &&
        (!selectedDossier || item.dossierId === selectedDossier.id)
    );

    return relevant.length > 0
      ? relevant
      : natureRiskOverlays.filter((item) => item.markets.includes("shared") || item.markets.includes(marketId));
  }, [marketId, selectedDossier]);
  const selectedNatureRiskOverlay = useMemo(
    () =>
      visibleNatureRiskOverlays.find((item) => item.id === selectedRiskOverlayId) ??
      visibleNatureRiskOverlays[0] ??
      null,
    [selectedRiskOverlayId, visibleNatureRiskOverlays]
  );
  const registryFreshnessRows = useMemo<RegistryFreshnessRow[]>(
    () =>
      (selectedDossier?.documents ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        docType: item.docType,
        status: item.status,
        publishedAt: item.publishedAt,
        note: item.note,
        sourceUrl: item.source.url
      })),
    [selectedDossier]
  );
  const registryFreshnessPoints = useMemo<ChartPoint[]>(
    () => [
      {
        label: t(appLocale, "최신", "Fresh"),
        value: registryFreshnessRows.filter((item) => item.status === "fresh").length
      },
      {
        label: t(appLocale, "점검", "Watch"),
        value: registryFreshnessRows.filter((item) => item.status === "watch").length
      },
      {
        label: t(appLocale, "오래됨", "Stale"),
        value: registryFreshnessRows.filter((item) => item.status === "stale").length
      }
    ],
    [appLocale, registryFreshnessRows]
  );
  const registryOperationsPoints = useMemo<ChartPoint[]>(
    () => [
      {
        label: t(appLocale, "정상", "Healthy"),
        value: visibleRegistryTracks.filter((item) => item.status === "healthy").length
      },
      {
        label: t(appLocale, "점검", "Watch"),
        value: visibleRegistryTracks.filter((item) => item.status === "watch").length
      },
      {
        label: t(appLocale, "막힘", "Blocked"),
        value: visibleRegistryTracks.filter((item) => item.status === "blocked").length
      }
    ],
    [appLocale, visibleRegistryTracks]
  );
  const registryStagePoints = useMemo<ChartPoint[]>(
    () =>
      (selectedRegistryTrack?.steps ?? []).map((item) => ({
        label: item.label,
        value: item.status === "done" ? 100 : item.status === "active" ? 70 : item.status === "queued" ? 45 : 20
      })),
    [selectedRegistryTrack]
  );
  const natureRiskPoints = useMemo<ChartPoint[]>(
    () =>
      (selectedNatureRiskOverlay?.components ?? []).map((item) => ({
        label: item.label,
        value: item.value
      })),
    [selectedNatureRiskOverlay]
  );

  useEffect(() => {
    window.localStorage.setItem("cquant:locale", appLocale);
  }, [appLocale]);

  useEffect(() => {
    window.localStorage.setItem("cquant:free-only-sources", String(freeOnlySources));
  }, [freeOnlySources]);

  useEffect(() => {
    window.localStorage.setItem("cquant:desk-role", deskRole);
  }, [deskRole]);

  useEffect(() => {
    window.localStorage.setItem("cquant:market", marketId);
  }, [marketId]);

  useEffect(() => {
    if (!visibleDossiers.length) {
      return;
    }
    if (!selectedDossier || !visibleDossiers.some((item) => item.id === selectedDossier.id)) {
      setSelectedDossierId(visibleDossiers[0].id);
    }
  }, [selectedDossier, visibleDossiers]);

  useEffect(() => {
    if (!visibleRegistryTracks.length) {
      return;
    }
    if (
      !selectedRegistryTrack ||
      !visibleRegistryTracks.some((item) => item.id === selectedRegistryTrack.id)
    ) {
      setSelectedRegistryTrackId(visibleRegistryTracks[0].id);
    }
  }, [selectedRegistryTrack, visibleRegistryTracks]);

  useEffect(() => {
    if (!visibleNatureRiskOverlays.length) {
      return;
    }
    if (!selectedNatureRiskOverlay || !visibleNatureRiskOverlays.some((item) => item.id === selectedNatureRiskOverlay.id)) {
      setSelectedRiskOverlayId(visibleNatureRiskOverlays[0].id);
    }
  }, [selectedNatureRiskOverlay, visibleNatureRiskOverlays]);

  useEffect(() => {
    window.localStorage.setItem("cquant:quote-range", selectedQuoteRange);
  }, [selectedQuoteRange]);

  useEffect(() => {
    const desk = getInstitutionDesk(appLocale, marketId);
    const relevantQuotes = connectedSources.liveQuotes.filter(
      (quote) => quote.markets.includes(marketId) || quote.markets.includes("shared")
    );

    if (relevantQuotes.some((quote) => quote.id === selectedLiveQuoteId)) {
      return;
    }

    const preferredQuotes = [desk.primaryQuoteId, ...desk.supportQuoteIds]
      .map((quoteId) => relevantQuotes.find((quote) => quote.id === quoteId))
      .filter((quote): quote is MarketLiveQuote => Boolean(quote));

    const preferredChartQuote =
      preferredQuotes.find((quote) => (quote.series?.length ?? 0) > 1) ??
      relevantQuotes.find((quote) => (quote.series?.length ?? 0) > 1) ??
      preferredQuotes[0] ??
      relevantQuotes[0];

    setSelectedLiveQuoteId(preferredChartQuote?.id ?? "");
  }, [appLocale, connectedSources.liveQuotes, marketId, selectedLiveQuoteId]);

  useEffect(() => {
    const nextQuestion =
      appLocale === "ko"
        ? "현재 이 시장은 매수 우위인지 매도 우위인지 판단해줘."
        : "Should the current market posture be increased, reduced, or held?";
    setAssistantQuestion((current) => (current.trim() ? current : nextQuestion));
  }, [appLocale]);

  useEffect(() => {
    const quoteId = selectedLiveQuoteId;
    if (!quoteId) {
      setInteractiveQuote(null);
      setInteractiveQuoteError(null);
      return;
    }

    const fallbackQuote = connectedSources.liveQuotes.find((quote) => quote.id === quoteId) ?? null;

    if (!window.desktopBridge?.getLiveQuoteHistory) {
      setInteractiveQuote(fallbackQuote);
      setInteractiveQuoteError(null);
      return;
    }

    let cancelled = false;
    setInteractiveQuoteLoading(true);
    setInteractiveQuoteError(null);

    void window.desktopBridge
      .getLiveQuoteHistory({
        quoteId,
        range: selectedQuoteRange
      })
      .then((next) => {
        if (cancelled) {
          return;
        }
        startTransition(() => {
          setInteractiveQuote(next);
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setInteractiveQuote(fallbackQuote);
        setInteractiveQuoteError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) {
          setInteractiveQuoteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedSources.fetchedAt, connectedSources.liveQuotes, selectedLiveQuoteId, selectedQuoteRange]);

  useEffect(() => {
    void refreshSources();
    const refreshTimer = window.desktopBridge
      ? window.setInterval(() => {
          void refreshSources();
        }, 60_000)
      : null;
    void window.desktopBridge?.isWindowMaximized().then((value) => setWindowMaximized(value));
    void window.desktopBridge?.getAppSettings().then((next) => {
      setSettings(next);
      setModelDraft(next.llmModel);
    });

    return () => {
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
    };
  }, []);

  const cardsByMarket = useMemo(
    () =>
      Object.fromEntries(
        connectedSources.cards.map((card) => [card.marketId, card])
      ) as Partial<Record<MarketProfile["id"], ConnectedSourceCard>>,
    [connectedSources.cards]
  );
  const liveQuotesById = useMemo(
    () =>
      Object.fromEntries(
        connectedSources.liveQuotes.map((quote) => [quote.id, localizeLiveQuote(appLocale, quote) ?? quote])
      ) as Record<string, MarketLiveQuote>,
    [appLocale, connectedSources.liveQuotes]
  );

  const derivedStates = useMemo(
    () =>
      Object.fromEntries(
        marketProfiles.map((profile) => [profile.id, buildDriverState(profile, cardsByMarket[profile.id])])
      ) as Record<MarketProfile["id"], Record<string, number>>,
    [cardsByMarket]
  );

  const currentState = useMemo(
    () => ({
      ...derivedStates[marketId],
      ...(scenarioOverrides[marketId] ?? {})
    }),
    [derivedStates, marketId, scenarioOverrides]
  );

  const forecasts = useMemo(
    () =>
      Object.fromEntries(
        marketProfiles.map((profile) => {
          const state =
            profile.id === marketId
              ? {
                  ...derivedStates[profile.id],
                  ...(scenarioOverrides[profile.id] ?? {})
                }
              : derivedStates[profile.id];
          return [profile.id, buildForecast(profile.id, state)];
        })
      ) as Record<MarketProfile["id"], ReturnType<typeof buildForecast>>,
    [derivedStates, marketId, scenarioOverrides]
  );

  const alertInbox = useMemo(
    () => makeAlertInbox(appLocale, connectedSources.cards, forecasts),
    [appLocale, connectedSources.cards, forecasts]
  );

  const selectedAlerts = useMemo(
    () => alertInbox.filter((item) => item.marketId === marketId || item.marketId === "shared"),
    [alertInbox, marketId]
  );

  const familyScoresByMarket = useMemo(
    () =>
      Object.fromEntries(
        marketProfiles.map((profile) => {
          const state =
            profile.id === marketId
              ? {
                  ...derivedStates[profile.id],
                  ...(scenarioOverrides[profile.id] ?? {})
                }
              : derivedStates[profile.id];
          return [
            profile.id,
            Object.fromEntries(
              DRIVER_FAMILIES.map((family) => [
                family.id,
                familyScore(profile, state, family.id)
              ])
            )
          ];
        })
      ) as Record<MarketProfile["id"], Record<string, number>>,
    [derivedStates, marketId, scenarioOverrides]
  );

  const selectedCard = cardsByMarket[marketId];
  const localizedSelectedCard = useMemo(
    () => localizeConnectedCard(appLocale, selectedCard),
    [appLocale, selectedCard]
  );
  const selectedDesk = useMemo(() => getInstitutionDesk(appLocale, marketId), [appLocale, marketId]);
  const selectedPrimaryQuote = useMemo(
    () => liveQuotesById[selectedDesk.primaryQuoteId],
    [liveQuotesById, selectedDesk.primaryQuoteId]
  );
  const selectedSupportQuotes = useMemo(
    () =>
      selectedDesk.supportQuoteIds
        .map((quoteId) => liveQuotesById[quoteId])
        .filter((quote): quote is MarketLiveQuote => Boolean(quote)),
    [liveQuotesById, selectedDesk.supportQuoteIds]
  );
  const selectedDeskQuotes = useMemo(() => {
    const seen = new Set<string>();
    return [selectedPrimaryQuote, ...selectedSupportQuotes].filter((quote): quote is MarketLiveQuote => {
      if (!quote || seen.has(quote.id)) {
        return false;
      }
      seen.add(quote.id);
      return true;
    });
  }, [selectedPrimaryQuote, selectedSupportQuotes]);
  const selectedRelevantQuotes = useMemo(
    () =>
      connectedSources.liveQuotes.filter(
        (quote) => quote.markets.includes(marketId) || quote.markets.includes("shared")
      ).map((quote) => liveQuotesById[quote.id] ?? quote),
    [connectedSources.liveQuotes, liveQuotesById, marketId]
  );
  const selectedInteractiveQuote = useMemo(
    () =>
      ((interactiveQuote && interactiveQuote.id === selectedLiveQuoteId
        ? localizeLiveQuote(appLocale, interactiveQuote)
        : null) ??
      selectedRelevantQuotes.find((quote) => quote.id === selectedLiveQuoteId) ??
      selectedDeskQuotes[0] ??
      selectedRelevantQuotes[0]),
    [appLocale, interactiveQuote, selectedDeskQuotes, selectedLiveQuoteId, selectedRelevantQuotes]
  );
  const selectedInteractiveQuotePoints = useMemo(
    () => getSeriesPoints(selectedInteractiveQuote?.series),
    [selectedInteractiveQuote]
  );
  const selectedTapeComparePoints = useMemo(
    () => buildNormalizedTapeCompare(localizedSelectedCard?.series, selectedInteractiveQuote?.series),
    [localizedSelectedCard?.series, selectedInteractiveQuote]
  );
  const selectedTapeCompareStats = useMemo(
    () => buildTapeCompareStats(localizedSelectedCard?.series, selectedInteractiveQuote?.series),
    [localizedSelectedCard?.series, selectedInteractiveQuote?.series]
  );
  const selectedLinkedScoreRows = useMemo<LinkedTapeScoreRow[]>(
    () =>
      selectedRelevantQuotes
        .map((quote) => {
          const stats = buildTapeCompareStats(localizedSelectedCard?.series, quote.series);
          const alignment = getTapeAlignment(appLocale, stats);
          return {
            quote,
            stats,
            alignmentLabel: alignment.label,
            alignmentTone: alignment.tone
          };
        })
        .sort((left, right) => {
          const leftScore =
            (left.stats.directionMatchPct ?? 0) +
            (left.stats.recentCorrelation ?? 0) * 100 -
            Math.abs(left.stats.normalizedGapPct ?? 100);
          const rightScore =
            (right.stats.directionMatchPct ?? 0) +
            (right.stats.recentCorrelation ?? 0) * 100 -
            Math.abs(right.stats.normalizedGapPct ?? 100);
          return rightScore - leftScore;
        }),
    [appLocale, localizedSelectedCard?.series, selectedRelevantQuotes]
  );
  const selectedForecast = forecasts[marketId];
  const selectedDriverRows = useMemo<DriverDecisionRow[]>(
    () =>
      selectedMarket.drivers
        .map((driver) => {
          const contribution =
            selectedForecast.contributions.find((item) => item.driverId === driver.id)?.contribution ?? 0;
          return {
            id: driver.id,
            family: driver.category,
            variable: localizeDriverVariable(appLocale, driver.variable),
            importance: getImportanceLabel(appLocale, driver.importance),
            contribution,
            read: getContributionRead(appLocale, contribution),
            tone: getContributionTone(contribution),
            note: localizeDriverNote(appLocale, driver.note),
            sourceLabel:
              localizeDriverSourceLabel(appLocale, driver.sources[0]?.label ?? "") ||
              t(appLocale, "대표 출처 없음", "No primary source"),
            sourceUrl: driver.sources[0]?.url
          };
        })
        .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution)),
    [appLocale, selectedForecast.contributions, selectedMarket.drivers]
  );
  const selectedRoleDriverRows = useMemo(
    () => {
      const preferred = selectedDriverRows.filter((row) =>
        selectedDeskRole.driverFamilies.includes(row.family)
      );
      const remainder = selectedDriverRows.filter(
        (row) => !preferred.some((preferredRow) => preferredRow.id === row.id)
      );
      return [...preferred, ...remainder];
    },
    [selectedDeskRole.driverFamilies, selectedDriverRows]
  );
  const selectedSourceHealthRows = useMemo<SourceHealthRow[]>(() => {
    const rows: SourceHealthRow[] = [];

    if (localizedSelectedCard) {
      rows.push({
        id: localizedSelectedCard.id,
        name: localizedSelectedCard.sourceName,
        role: t(appLocale, "공식 기준값", "Official anchor"),
        kind: t(appLocale, "공식 시세", "Official tape"),
        status: getStatusLabel(appLocale, localizedSelectedCard.status),
        updated: formatDate(appLocale, localizedSelectedCard.asOf),
        freshness: formatFreshness(appLocale, localizedSelectedCard.asOf),
        note: localizedSelectedCard.summary
      });
    }

    selectedDeskQuotes.forEach((quote, index) => {
      rows.push({
        id: quote.id,
        name: quote.title,
        role:
          index === 0
            ? t(appLocale, "주요 헤지 앵커", "Primary hedge anchor")
            : t(appLocale, "보조 비교 테이프", "Support tape"),
        kind: localizeLiveQuoteCategory(appLocale, quote.category),
        status: getLiveQuoteStatusLabel(appLocale, quote),
        updated: formatDate(appLocale, quote.asOf),
        freshness: formatFreshness(appLocale, quote.asOf),
        note: quote.delayNote || quote.note
      });
    });

    return rows;
  }, [appLocale, localizedSelectedCard, selectedDeskQuotes]);
  const referenceCenterItems = useMemo<ReferenceCenterItem[]>(() => {
    const items: ReferenceCenterItem[] = [];
    const pushUnique = (item: ReferenceCenterItem) => {
      const nextKey = `${item.kind}:${normalizeReferenceUrl(item.url)}`;
      const exists = items.some(
        (existing) => `${existing.kind}:${normalizeReferenceUrl(existing.url)}` === nextKey
      );
      if (!exists) {
        items.push(item);
      }
    };

    if (localizedSelectedCard) {
      pushUnique({
        id: `live-source-${localizedSelectedCard.id}`,
        kind: "live-source",
        title: localizedSelectedCard.sourceName,
        subtitle: `${t(appLocale, "공식 기준값", "Official anchor")} · ${formatDate(appLocale, localizedSelectedCard.asOf)}`,
        summary: localizedSelectedCard.summary,
        bullets: [
          localizedSelectedCard.coverage,
          ...localizedSelectedCard.notes.slice(0, 2)
        ],
        url: localizedSelectedCard.sourceUrl
      });
    }

    selectedDeskQuotes.forEach((quote, index) => {
      pushUnique({
        id: `live-source-${quote.id}`,
        kind: "live-source",
        title: quote.title,
        subtitle: `${index === 0 ? t(appLocale, "주요 헤지 앵커", "Primary hedge anchor") : t(appLocale, "보조 비교 테이프", "Support tape")} · ${formatDate(appLocale, quote.asOf)}`,
        summary: quote.role,
        bullets: [quote.note, quote.delayNote].filter(Boolean),
        url: quote.sourceUrl
      });
    });

    watchlistItems.forEach((item) => {
      pushUnique({
        id: `watch-${item.id}`,
        kind: "market-watch",
        title: item.title,
        subtitle: `${localizeLabel(appLocale, item.category, CATEGORY_LABELS_KO)} · ${item.role}`,
        summary: item.note,
        bullets: [
          t(appLocale, "현재 워치리스트에서 빠르게 확인하는 참고 항목입니다.", "This is a quick reference item inside the current watchlist."),
          item.url
        ],
        url: item.url
      });
    });

    visibleSources.forEach((item) => {
      pushUnique({
        id: `source-${item.id}`,
        kind: "source-registry",
        title: item.title,
        subtitle: `${getAccessTier(appLocale, item.method).label} · ${localizeLabel(appLocale, item.method, METHOD_LABELS_KO)}`,
        summary: item.appUse,
        bullets: [item.whyItMatters, ...item.notes.slice(0, 2)],
        url: item.url
      });
    });

    localizedBenchmarks.forEach((item) => {
      pushUnique({
        id: `benchmark-${item.id}`,
        kind: "benchmark",
        title: item.name,
        subtitle: localizeLabel(appLocale, item.category, CATEGORY_LABELS_KO),
        summary: item.strength,
        bullets: item.featuresToBorrow.slice(0, 3),
        url: item.source.url
      });
    });

    localizedOpenSourceBenchmarks.forEach((item) => {
      pushUnique({
        id: `oss-${item.id}`,
        kind: "open-source",
        title: item.name,
        subtitle: item.category,
        summary: item.verifiedCapability,
        bullets: [item.adaptForCQuant, item.boundaryNote, item.llmUse],
        url: item.source.url
      });
    });

    visibleRegistryTracks.forEach((item) => {
      pushUnique({
        id: `registry-${item.id}`,
        kind: "registry",
        title: item.registry,
        subtitle: `${item.accessMethod} · ${registryHealthLabel(appLocale, item.status)}`,
        summary: item.operatorRead,
        bullets: [
          `${t(appLocale, "검토 주기", "Refresh cadence")}: ${item.refreshCadence}`,
          `${t(appLocale, "신선도 기준", "Freshness SLA")}: ${item.freshnessSla}`,
          ...item.watchItems.slice(0, 1),
          ...item.blockers.slice(0, 1)
        ],
        url: item.source.url
      });
    });

    visibleDossiers.forEach((item) => {
      pushUnique({
        id: `dossier-${item.id}`,
        kind: "dossier",
        title: item.title,
        subtitle: `${item.registry} · ${item.projectType}`,
        summary: item.currentRead,
        bullets: item.documents.slice(0, 3).map((doc) => `${doc.docType}: ${doc.title}`),
        url: item.source.url
      });
    });

    registryFreshnessRows.forEach((item) => {
      pushUnique({
        id: `document-${item.id}`,
        kind: "document",
        title: item.title,
        subtitle: `${item.docType} · ${formatDate(appLocale, item.publishedAt)}`,
        summary: item.note,
        bullets: [
          `${t(appLocale, "상태", "Status")}: ${registryStatusLabel(appLocale, item.status)}`,
          `${t(appLocale, "발행일", "Published")}: ${formatDate(appLocale, item.publishedAt)}`
        ],
        url: item.sourceUrl
      });
    });

    visibleNatureRiskOverlays.forEach((item) => {
      pushUnique({
        id: `risk-${item.id}`,
        kind: "risk",
        title: item.title,
        subtitle: item.creditType,
        summary: item.currentRead,
        bullets: item.components.slice(0, 3).map((component) => component.label),
        url: item.source.url
      });
    });

    return items;
  }, [
    appLocale,
    localizedSelectedCard,
    selectedDeskQuotes,
    watchlistItems,
    visibleSources,
    localizedBenchmarks,
    localizedOpenSourceBenchmarks,
    visibleRegistryTracks,
    visibleDossiers,
    registryFreshnessRows,
    visibleNatureRiskOverlays
  ]);
  const selectedReferenceItem = useMemo<ReferenceCenterItem | null>(() => {
    if (referenceCenterItems.length === 0) {
      return null;
    }

    const matchedById = selectedReferenceId
      ? referenceCenterItems.find((item) => item.id === selectedReferenceId) ?? null
      : null;
    if (matchedById) {
      return matchedById;
    }

    const normalizedUrl = normalizeReferenceUrl(selectedReferenceUrl);
    const matched =
      normalizedUrl.length > 0
        ? referenceCenterItems.find((item) => normalizeReferenceUrl(item.url) === normalizedUrl) ?? null
        : null;

    if (matched) {
      return matched;
    }

    if (selectedReferenceUrl.trim()) {
      return {
        id: `adhoc-${selectedReferenceUrl}`,
        kind: "source-registry",
        title: t(appLocale, "선택한 참고자료", "Selected reference"),
        subtitle: getReferenceHostLabel(selectedReferenceUrl),
        summary: t(
          appLocale,
          "이 링크는 아직 구조화된 출처 카드로 정리되어 있지 않습니다. 우선 앱 안에서 주소와 맥락을 확인하고, 정말 필요할 때만 원문을 여세요.",
          "This link does not have a structured in-app card yet. Review the address and context here first, then open the original page only if needed."
        ),
        bullets: [
          selectedReferenceUrl,
          t(appLocale, "기본 동작은 앱 내부 확인입니다.", "The default action stays inside the app."),
          t(appLocale, "원문 열기는 보조 동작입니다.", "Opening the original page is a secondary action.")
        ],
        url: selectedReferenceUrl
      };
    }

    return referenceCenterItems[0];
  }, [appLocale, referenceCenterItems, selectedReferenceId, selectedReferenceUrl]);
  const referenceQuickList = useMemo(
    () =>
      selectedReferenceItem
        ? [selectedReferenceItem, ...referenceCenterItems.filter((item) => item.id !== selectedReferenceItem.id)].slice(0, 12)
        : referenceCenterItems.slice(0, 12),
    [referenceCenterItems, selectedReferenceItem]
  );
  const selectedReferenceContext = useMemo(() => {
    if (!selectedReferenceItem) {
      return null;
    }

    const normalizedSelectedUrl = normalizeReferenceUrl(selectedReferenceItem.url);
    const hostLabel = getReferenceHostLabel(selectedReferenceItem.url);
    const relatedItemsByHost = referenceCenterItems.filter(
      (item) =>
        item.id !== selectedReferenceItem.id &&
        getReferenceHostLabel(item.url) === hostLabel
    );
    const relatedItems =
      relatedItemsByHost.length > 0
        ? relatedItemsByHost.slice(0, 6)
        : referenceCenterItems
            .filter(
              (item) =>
                item.id !== selectedReferenceItem.id && item.kind === selectedReferenceItem.kind
            )
            .slice(0, 6);
    const relatedDocuments = (
      ["registry", "dossier", "document", "risk"].includes(selectedReferenceItem.kind)
        ? registryFreshnessRows
        : registryFreshnessRows.filter(
            (item) => getReferenceHostLabel(item.sourceUrl) === hostLabel
          )
    ).slice(0, 4);
    const relatedQuotes = selectedDeskQuotes
      .filter((quote) => normalizeReferenceUrl(quote.sourceUrl) !== normalizedSelectedUrl)
      .slice(0, 3);
    const metrics: ReferenceContextMetric[] = [
      {
        label: t(appLocale, "현재 시장", "Current market"),
        value: getMarketDisplayName(appLocale, marketId)
      },
      {
        label: t(appLocale, "호스트", "Host"),
        value: hostLabel
      },
      {
        label: t(appLocale, "관련 참고", "Related refs"),
        value: formatNumber(appLocale, relatedItems.length + 1, 0)
      },
      {
        label: t(appLocale, "연결 테이프", "Linked tapes"),
        value: formatNumber(appLocale, relatedQuotes.length, 0)
      }
    ];
    const workflowHeadline = selectedRegistryTrack
      ? `${selectedRegistryTrack.registry} · ${registryHealthLabel(
          appLocale,
          selectedRegistryTrack.status
        )}`
      : t(appLocale, "연결된 운영 흐름 없음", "No linked workflow");
    const workflowBullets = selectedRegistryTrack
      ? [
          `${t(appLocale, "검토 주기", "Refresh cadence")}: ${selectedRegistryTrack.refreshCadence}`,
          `${t(appLocale, "신선도 기준", "Freshness SLA")}: ${selectedRegistryTrack.freshnessSla}`,
          ...selectedRegistryTrack.watchItems.slice(0, 1),
          ...selectedRegistryTrack.blockers.slice(0, 1)
        ]
      : [];
    const operationalNotes = [
      selectedDesk.focus,
      selectedDesk.check,
      selectedDesk.executionNote
    ].filter(Boolean);

    return {
      metrics,
      relatedItems,
      relatedDocuments,
      relatedQuotes,
      workflowHeadline,
      workflowBullets,
      operationalNotes
    };
  }, [
    appLocale,
    marketId,
    referenceCenterItems,
    registryFreshnessRows,
    selectedDesk,
    selectedDeskQuotes,
    selectedReferenceItem,
    selectedRegistryTrack
  ]);
  const allVisibleDocumentPreviews = useMemo(
    () =>
      visibleDossiers.flatMap((dossier) =>
        dossier.documents.map((document) => ({
          dossier,
          document
        }))
      ),
    [visibleDossiers]
  );
  const selectedReferenceDocumentPreview = useMemo(() => {
    if (!selectedReferenceItem) {
      return null;
    }

    const documentId =
      selectedReferenceItem.kind === "document"
        ? selectedReferenceItem.id.replace(/^document-/, "")
        : null;
    const directMatch = documentId
      ? allVisibleDocumentPreviews.find((item) => item.document.id === documentId) ?? null
      : null;
    if (directMatch) {
      return directMatch;
    }

    if (selectedReferenceItem.kind === "dossier") {
      return (
        allVisibleDocumentPreviews.find((item) => `dossier-${item.dossier.id}` === selectedReferenceItem.id) ??
        allVisibleDocumentPreviews.find((item) => item.dossier.id === selectedDossier?.id) ??
        null
      );
    }

    const normalizedSelectedUrl = normalizeReferenceUrl(selectedReferenceItem.url);
    return (
      allVisibleDocumentPreviews.find(
        (item) => normalizeReferenceUrl(item.document.source.url) === normalizedSelectedUrl
      ) ?? null
    );
  }, [allVisibleDocumentPreviews, selectedDossier?.id, selectedReferenceItem]);
  useEffect(() => {
    if (!referenceCenterItems.length) {
      return;
    }
    if (!selectedReferenceId && !selectedReferenceUrl) {
      setSelectedReferenceId(referenceCenterItems[0].id);
      setSelectedReferenceUrl(referenceCenterItems[0].url);
    }
  }, [referenceCenterItems, selectedReferenceId, selectedReferenceUrl]);
  const selectedCatalystRows = useMemo(
    () =>
      localizedCatalysts.filter(
        (item) => item.marketId === marketId || item.marketId === "shared"
      ),
    [localizedCatalysts, marketId]
  );
  const selectedRoleCatalystRows = useMemo(
    () => (deskRole === "trading" ? selectedCatalystRows.slice(0, 6) : selectedCatalystRows),
    [deskRole, selectedCatalystRows]
  );
  const selectedTapeCompareSeries = useMemo<MultiLineSeries[]>(
    () => [
      {
        id: "official",
        label: t(appLocale, "공식 시세", "Official tape"),
        color: marketColor(marketId)
      },
      {
        id: "quote",
        label: selectedInteractiveQuote?.title ?? t(appLocale, "연결된 테이프", "Linked tape"),
        color: "#2f7bf6"
      }
    ],
    [appLocale, marketId, selectedInteractiveQuote?.title]
  );
  const decisionsByMarket = useMemo(
    () =>
      Object.fromEntries(
        marketProfiles.map((profile) => {
          const profileCard = localizeConnectedCard(appLocale, cardsByMarket[profile.id]);
          const profileAlerts = alertInbox.filter(
            (item) => item.marketId === profile.id || item.marketId === "shared"
          );
          const profileState =
            profile.id === marketId
              ? currentState
              : {
                  ...derivedStates[profile.id],
                  ...(scenarioOverrides[profile.id] ?? {})
                };

          return [
            profile.id,
            buildExplainableRuleDecision(
              appLocale,
              profile,
              profileCard,
              forecasts[profile.id],
              profileAlerts,
              localizedCatalysts,
              profileState
            )
          ];
        })
      ) as Record<MarketProfile["id"], DecisionAssistantResponse>,
    [
      alertInbox,
      appLocale,
      cardsByMarket,
      currentState,
      derivedStates,
      forecasts,
      localizedCatalysts,
      marketId,
      scenarioOverrides
    ]
  );

  const selectedDecision = decisionsByMarket[marketId];
  const decisionOverlay = useMemo(() => {
    const supportingEvidence: DecisionReasonItem[] = [];
    const counterEvidence: DecisionReasonItem[] = [];
    const dataHealth: string[] = [];
    const checkpoints: string[] = [];
    const actions: string[] = [];
    const risks: string[] = [];

    if (selectedDossier) {
      supportingEvidence.push({
        title: t(appLocale, "크레딧 생애주기", "Credit lifecycle"),
        detail:
          `${selectedDossier.title}: ${selectedDossier.currentRead}`
      });

      const staleDocuments = selectedDossier.documents.filter((item) => item.status === "stale");
      const watchDocuments = selectedDossier.documents.filter((item) => item.status === "watch");

      dataHealth.push(
        t(
          appLocale,
          `${selectedDossier.registry} 기준 자료 ${selectedDossier.documents.length}건을 연결했고, 최신 ${selectedDossier.documents.filter((item) => item.status === "fresh").length}건, 점검 ${watchDocuments.length}건, 오래됨 ${staleDocuments.length}건입니다.`,
          `${selectedDossier.documents.length} registry documents are linked for ${selectedDossier.registry}: ${selectedDossier.documents.filter((item) => item.status === "fresh").length} fresh, ${watchDocuments.length} watch, ${staleDocuments.length} stale.`
        )
      );

      if (staleDocuments.length > 0) {
        counterEvidence.push({
          title: t(appLocale, "오래된 증빙", "Stale evidence"),
          detail: t(
            appLocale,
            `${staleDocuments[0].title} 자료가 오래되어 이 프로젝트 파일에 대한 신뢰도를 낮춥니다.`,
            `${staleDocuments[0].title} is stale and lowers confidence in the dossier.`
          )
        });
      }

      checkpoints.push(
        t(
          appLocale,
          `${selectedDossier.title}의 다음 갱신 문서와 retirement trail을 다시 확인하세요.`,
          `Re-check the next document update and retirement trail for ${selectedDossier.title}.`
        )
      );
      actions.push(
        t(
          appLocale,
          `${selectedDossier.registry} 자료가 시장 해석보다 뒤처지지 않는지 먼저 확인`,
          `Confirm that ${selectedDossier.registry} evidence is not lagging the market narrative`
        )
      );
    }

    if (selectedRegistryTrack) {
      supportingEvidence.push({
        title: t(appLocale, "레지스트리 운영 흐름", "Registry workflow"),
        detail: `${selectedRegistryTrack.registry}: ${selectedRegistryTrack.operatorRead}`
      });

      dataHealth.push(
        t(
          appLocale,
          `${selectedRegistryTrack.registry} 운영 흐름은 ${registryHealthLabel(appLocale, selectedRegistryTrack.status)} 상태이며, 마지막 검토는 ${formatDate(appLocale, selectedRegistryTrack.lastReviewed)}입니다.`,
          `${selectedRegistryTrack.registry} workflow is ${registryHealthLabel(appLocale, selectedRegistryTrack.status)} and was last reviewed on ${formatDate(appLocale, selectedRegistryTrack.lastReviewed)}.`
        )
      );
      checkpoints.push(
        t(
          appLocale,
          `문서 갱신 주기와 신선도 기준(${selectedRegistryTrack.freshnessSla})이 계속 지켜지는지 확인하세요.`,
          `Check that the refresh cadence and freshness SLA (${selectedRegistryTrack.freshnessSla}) are still being met.`
        )
      );
      actions.push(
        t(
          appLocale,
          `${selectedRegistryTrack.registry} 운영 흐름에서 현재 막힘 요인이 있는지 먼저 확인`,
          `Confirm whether the ${selectedRegistryTrack.registry} workflow has any active blockers before leaning harder`
        )
      );

      if (selectedRegistryTrack.status !== "healthy" || selectedRegistryTrack.blockers.length > 0) {
        counterEvidence.push({
          title: t(appLocale, "운영 흐름 점검", "Workflow watch"),
          detail: t(
            appLocale,
            `${selectedRegistryTrack.registry} 운영 흐름이 완전히 정상 상태가 아니어서 증빙 신뢰도를 보수적으로 봐야 합니다.`,
            `${selectedRegistryTrack.registry} is not in a fully healthy workflow state, so evidence confidence should stay conservative.`
          )
        });
      }

      risks.push(...selectedRegistryTrack.blockers.slice(0, 2));
    }

    if (selectedNatureRiskOverlay) {
      const maxComponent =
        selectedNatureRiskOverlay.components.reduce((top, item) =>
          item.value > top.value ? item : top
        );

      supportingEvidence.push({
        title: t(appLocale, "무결성 오버레이", "Integrity overlay"),
        detail: `${selectedNatureRiskOverlay.title}: ${selectedNatureRiskOverlay.posture}`
      });

      risks.push(
        t(
          appLocale,
          `${selectedNatureRiskOverlay.title}에서 ${maxComponent.label} 항목이 가장 높아 무결성 할인율을 더 보수적으로 볼 필요가 있습니다.`,
          `${maxComponent.label} is the highest component in ${selectedNatureRiskOverlay.title}, so integrity haircuts should stay conservative.`
        )
      );
      checkpoints.push(...selectedNatureRiskOverlay.watchItems.slice(0, 2));

      if (maxComponent.value >= 60) {
        counterEvidence.push({
          title: t(appLocale, "무결성 리스크 상단", "Integrity risk elevated"),
          detail: t(
            appLocale,
            `${maxComponent.label} 점수가 ${formatNumber(appLocale, maxComponent.value, 0)}로 높아, 가격이 싸도 바로 우호적으로 보기 어렵습니다.`,
            `${maxComponent.label} scores ${formatNumber(appLocale, maxComponent.value, 0)}, which makes it hard to treat a cheap price as automatically attractive.`
          )
        });
      }
    }

    return { supportingEvidence, counterEvidence, dataHealth, checkpoints, actions, risks };
  }, [appLocale, selectedDossier, selectedNatureRiskOverlay, selectedRegistryTrack]);

  const localOperatorBrief = useMemo(
    () =>
      buildOperatorBrief({
        locale: appLocale,
        marketLabel: getMarketDisplayName(appLocale, marketId),
        deskRole,
        decision: selectedDecision,
        compareStats: selectedTapeCompareStats,
        dossier: selectedDossier,
        registryTrack: selectedRegistryTrack,
        riskOverlay: selectedNatureRiskOverlay,
        focus: selectedDesk.focus,
        check: selectedDesk.check
      }),
    [
      appLocale,
      deskRole,
      marketId,
      selectedDecision,
      selectedDossier,
      selectedNatureRiskOverlay,
      selectedRegistryTrack,
      selectedTapeCompareStats,
      selectedDesk
    ]
  );

  const decisionView = useMemo(
    () => {
      const base = assistantResponse
        ? {
            ...selectedDecision,
            ...assistantResponse,
            supportingEvidence:
              assistantResponse.supportingEvidence.length > 0
                ? assistantResponse.supportingEvidence
                : selectedDecision.supportingEvidence,
            counterEvidence:
              assistantResponse.counterEvidence.length > 0
                ? assistantResponse.counterEvidence
                : selectedDecision.counterEvidence,
            dataHealth:
              assistantResponse.dataHealth.length > 0
                ? assistantResponse.dataHealth
                : selectedDecision.dataHealth,
            checkpoints:
              assistantResponse.checkpoints.length > 0
                ? assistantResponse.checkpoints
                : selectedDecision.checkpoints,
            operatorBrief:
              assistantResponse.operatorBrief.length > 0
                ? assistantResponse.operatorBrief
                : localOperatorBrief
          }
        : selectedDecision;

      return {
        ...base,
        supportingEvidence: dedupeReasonItems(
          [...base.supportingEvidence, ...decisionOverlay.supportingEvidence],
          6
        ),
        counterEvidence: dedupeReasonItems(
          [...base.counterEvidence, ...decisionOverlay.counterEvidence],
          6
        ),
        dataHealth: dedupeStrings([...base.dataHealth, ...decisionOverlay.dataHealth], 8),
        checkpoints: dedupeStrings([...base.checkpoints, ...decisionOverlay.checkpoints], 8),
        actions: dedupeStrings([...base.actions, ...decisionOverlay.actions], 8),
        risks: dedupeStrings([...base.risks, ...decisionOverlay.risks], 8),
        operatorBrief: base.operatorBrief.length > 0 ? base.operatorBrief : localOperatorBrief
      };
    },
    [assistantResponse, decisionOverlay, localOperatorBrief, selectedDecision]
  );
  const decisionReasonHeader = useMemo(
    () => ({
      title: t(appLocale, "매수·매도 판단 근거", "Decision reasoning"),
      subtitle: t(
        appLocale,
        "왜 이런 판단이 나왔는지, 반대로 볼 이유는 무엇인지, 지금 무엇을 다시 확인해야 하는지 한 번에 보여줍니다.",
        "See why the current stance exists, what could invalidate it, and what should be re-checked now."
      )
    }),
    [appLocale]
  );
  const snapshotCards = useMemo(
    () =>
      marketProfiles.map((profile) =>
        getSnapshotCard(
          appLocale,
          profile,
          cardsByMarket[profile.id],
          forecasts[profile.id].score,
          forecasts[profile.id].confidence
        )
      ),
    [appLocale, cardsByMarket, forecasts]
  );

  const marketBoardRows = useMemo<MarketBoardRow[]>(
    () =>
      marketProfiles.map((profile) => {
        const snapshot =
          snapshotCards.find((item) => item.marketId === profile.id) ??
          getSnapshotCard(
            appLocale,
            profile,
            cardsByMarket[profile.id],
            forecasts[profile.id].score,
            forecasts[profile.id].confidence
          );
        const localizedCard = localizeConnectedCard(appLocale, cardsByMarket[profile.id]);
        const decision = decisionsByMarket[profile.id];
        const desk = getOperatorDesk(appLocale, profile.id);
        const primaryQuote = liveQuotesById[desk.primaryQuoteId];
        const trackingStats = buildTapeCompareStats(localizedCard?.series, primaryQuote?.series);

        return {
          ...snapshot,
          stance: decision.stance,
          updatedLabel: formatDate(appLocale, localizedCard?.asOf),
          sourceName: localizedCard?.sourceName ?? t(appLocale, "공식 소스 미연결", "No official source"),
          topDriver:
            localizeDriverVariable(
              appLocale,
              forecasts[profile.id].contributions[0]?.variable ?? ""
            ) ||
            t(appLocale, "주요 인자 없음", "No primary driver"),
          benchmarkTicker: primaryQuote?.symbol ?? "N/A",
          benchmarkTitle:
            primaryQuote?.title ??
            t(appLocale, "연결된 선물/프록시 없음", "No linked futures or proxy"),
          benchmarkRole:
            primaryQuote?.role ?? t(appLocale, "연결된 기준값 없음", "No linked anchor"),
          benchmarkValue: formatLiveQuotePrice(appLocale, primaryQuote),
          benchmarkMove: formatLiveQuoteMove(appLocale, primaryQuote),
          benchmarkNote:
            primaryQuote?.note ??
            t(
              appLocale,
              "검증된 무료 선물/프록시 테이프를 아직 연결하지 못했습니다.",
              "No verified free futures or proxy tape is currently linked."
            ),
          benchmarkDelay: primaryQuote?.delayNote ?? getLiveQuoteStatusLabel(appLocale, primaryQuote),
          benchmarkStatus: getLiveQuoteStatusLabel(appLocale, primaryQuote),
          benchmarkSparkline: getSeriesPoints(primaryQuote?.series),
          trackingStats,
          operationsFocus: desk.focus,
          operationsCheck: desk.check
        };
      }),
    [appLocale, cardsByMarket, decisionsByMarket, forecasts, liveQuotesById, snapshotCards]
  );
  const selectedMarketBoardRow = useMemo(
    () => marketBoardRows.find((row) => row.marketId === marketId) ?? null,
    [marketBoardRows, marketId]
  );
  useEffect(() => {
    if (selectedMarketBoardRow) {
      setSpotlight(buildMarketSpotlight(appLocale, selectedMarketBoardRow, selectedDecision));
    }
  }, [appLocale, selectedDecision, selectedMarketBoardRow, surface]);

  const heatmapRows = useMemo<HeatmapRow[]>(
    () =>
      DRIVER_FAMILIES.map((family) => ({
        id: family.id,
        label: appLocale === "ko" ? family.ko : family.en,
        values: marketProfiles.map((profile) => familyScoresByMarket[profile.id][family.id] ?? 0)
      })),
    [appLocale, familyScoresByMarket]
  );

  const selectedSeries = useMemo(() => getSeriesPoints(selectedCard?.series), [selectedCard]);
  const selectedVolumeSeries = useMemo(
    () => getSeriesPoints(selectedCard?.volumeSeries),
    [selectedCard]
  );

  const crossMarketPoints = useMemo<MultiLinePoint[]>(() => {
    const maxLength = Math.max(
      ...marketProfiles.map((profile) => cardsByMarket[profile.id]?.series?.length ?? 0),
      0
    );
    if (maxLength === 0) {
      return [];
    }

    return Array.from({ length: maxLength }, (_, index) => {
      const values: Record<string, number | null> = {};
      let label = `${index + 1}`;
      for (const profile of marketProfiles) {
        const series = cardsByMarket[profile.id]?.series ?? [];
        const point = series[series.length - maxLength + index];
        if (point) {
          label = point.date;
          const first = series[series.length - maxLength]?.value ?? point.value;
          values[profile.id] = first === 0 ? 100 : (point.value / first) * 100;
        } else {
          values[profile.id] = null;
        }
      }
      return { label, values };
    });
  }, [cardsByMarket]);

  const crossMarketSeries = useMemo<MultiLineSeries[]>(
    () =>
      marketProfiles
        .filter((profile) => (cardsByMarket[profile.id]?.series?.length ?? 0) > 1)
        .map((profile) => ({
          id: profile.id,
          label: getMarketDisplayName(appLocale, profile.id),
          color: marketColor(profile.id)
        })),
    [appLocale, cardsByMarket]
  );

  const familyBarPoints = useMemo<ChartPoint[]>(
    () =>
      DRIVER_FAMILIES.map((family) => ({
        label: appLocale === "ko" ? family.ko : family.en,
        value: Math.abs(familyScoresByMarket[marketId][family.id] ?? 0) * 100
      })),
    [appLocale, familyScoresByMarket, marketId]
  );

  const contributionItems = useMemo(
    () =>
      selectedForecast.contributions.slice(0, 6).map((item) => ({
        label: item.variable,
        value: item.contribution
      })),
    [selectedForecast]
  );

  const selectedDriverHighlights = useMemo(
    () => selectedForecast.contributions.slice(0, 4),
    [selectedForecast]
  );

  const selectedScoreCap = useMemo(
    () => Math.max(selectedMarket.drivers.reduce((sum, driver) => sum + driver.weight, 0) * 0.8, 1),
    [selectedMarket]
  );

  const datasetSchema = useMemo(
    () =>
      localizeDatasetSchema(
        appLocale,
        marketDatasetSchemas.find((item) => item.marketId === marketId) ?? marketDatasetSchemas[0]
      ),
    [appLocale, marketId]
  );

  const sourceMethodPoints = useMemo<ChartPoint[]>(
    () => {
      const counts = new Map<string, number>();
      for (const item of visibleSources) {
        counts.set(item.method, (counts.get(item.method) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([label, value]) => ({
        label: localizeLabel(appLocale, label, METHOD_LABELS_KO),
        value
      }));
    },
    [appLocale, visibleSources]
  );

  const alertCountPoints = useMemo<ChartPoint[]>(
    () => {
      const counts = { High: 0, Medium: 0, Low: 0 };
      for (const alert of selectedAlerts) {
        counts[alert.severity] += 1;
      }
      return Object.entries(counts).map(([label, value]) => ({ label, value }));
    },
    [selectedAlerts]
  );

  const feedItems = useMemo(
    () => makeFeedItems(appLocale, localizedSelectedCard, decisionView, selectedAlerts, localizedCatalysts),
    [appLocale, decisionView, localizedCatalysts, localizedSelectedCard, selectedAlerts]
  );

  const backtestChartPoints = useMemo<ChartPoint[]>(
    () =>
      backtestRun
        ? backtestRun.equityCurve.map((value, index) => ({
            label: csvSeries[index]?.date ?? String(index + 1),
            value
          }))
        : [],
    [backtestRun, csvSeries]
  );

  const walkForwardFeaturePoints = useMemo<ChartPoint[]>(
    () =>
      walkForwardResult
        ? walkForwardResult.topFeatures.slice(0, 6).map((item) => ({
            label: item.feature,
            value: item.importance
          }))
        : [],
    [walkForwardResult]
  );

  async function refreshSources() {
    if (!window.desktopBridge) {
      return;
    }

    setRefreshingSources(true);
    try {
      const next = await window.desktopBridge.refreshConnectedSources();
      startTransition(() => {
        setConnectedSources(next);
        setAssistantResponse(null);
        setAssistantError(null);
      });
    } finally {
      setRefreshingSources(false);
    }
  }

  function updateScenario(driverId: string, value: number) {
    setScenarioOverrides((current) => ({
      ...current,
      [marketId]: {
        ...(current[marketId] ?? {}),
        [driverId]: value
      }
    }));
    setAssistantResponse(null);
  }

  function resetScenario() {
    setScenarioOverrides((current) => ({
      ...current,
      [marketId]: {}
    }));
    setAssistantResponse(null);
  }

  async function handlePickCsv() {
    if (!window.desktopBridge) {
      return;
    }

    const picked = await window.desktopBridge.pickCsvFile();
    if (!picked) {
      return;
    }

    const text = await window.desktopBridge.readTextFile(picked);
    const parsed = parseCsv(text);
    startTransition(() => {
      setCsvPath(picked);
      setCsvSeries(parsed);
      setBacktestRun(null);
      setWalkForwardResult(null);
    });
  }

  function handleRunBacktest() {
    if (csvSeries.length === 0) {
      return;
    }
    setBacktestRun(runBacktest(csvSeries, backtestStrategy, backtestFeeBps));
  }

  async function handleRunWalkForward() {
    if (!window.desktopBridge || !csvPath) {
      return;
    }

    setRunningWalkForward(true);
    try {
      const next = await window.desktopBridge.runWalkForwardModel({
        inputPath: csvPath,
        marketId,
        trainWindow: 180,
        horizon: 10
      });
      setWalkForwardResult(next);
    } finally {
      setRunningWalkForward(false);
    }
  }

  async function handleSaveBrief() {
    const content = [
      `${t(appLocale, "C-Quant 일일 브리프", "C-Quant Daily Brief")}`,
      `${t(appLocale, "시장", "Market")}: ${getMarketDisplayName(appLocale, marketId)}`,
      `${t(appLocale, "판단", "Stance")}: ${stanceLabel(appLocale, decisionView.stance)}`,
      `${t(appLocale, "신뢰도", "Confidence")}: ${formatNumber(appLocale, decisionView.confidence * 100, 0)}%`,
      "",
      decisionView.summary,
      "",
      `${t(appLocale, "핵심 포인트", "Key points")}`,
      ...decisionView.thesis.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "매수/매도 근거", "Supporting evidence")}`,
      ...decisionView.supportingEvidence.map((item) => `- ${item.title}: ${item.detail}`),
      "",
      `${t(appLocale, "반대로 볼 근거", "Counter-evidence")}`,
      ...decisionView.counterEvidence.map((item) => `- ${item.title}: ${item.detail}`),
      "",
      `${t(appLocale, "데이터 상태", "Data health")}`,
      ...decisionView.dataHealth.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "리스크", "Risks")}`,
      ...decisionView.risks.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "체크리스트", "Checklist")}`,
      ...decisionView.actions.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "다음 확인 사항", "Next checkpoints")}`,
      ...decisionView.checkpoints.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "면책", "Disclaimer")}: ${decisionView.disclaimer}`
    ].join("\n");

    if (window.desktopBridge) {
      await window.desktopBridge.saveTextFile({
        defaultPath: `c-quant-${marketId}-brief.txt`,
        content
      });
      return;
    }

    downloadText(`c-quant-${marketId}-brief.txt`, content);
  }

  async function handleSaveTemplate() {
    const content = datasetTemplates[datasetSchema.id];
    if (window.desktopBridge) {
      await window.desktopBridge.saveTextFile({
        defaultPath: datasetSchema.filename,
        content
      });
      return;
    }
    downloadText(datasetSchema.filename, content);
  }

  async function handleSaveLlmSettings() {
    if (!window.desktopBridge) {
      return;
    }
    const next = await window.desktopBridge.saveAppSettings({
      openAIApiKey: apiKeyDraft,
      llmModel: modelDraft
    });
    setSettings(next);
    setApiKeyDraft("");
  }

  async function handleRunAssistant() {
    if (!window.desktopBridge) {
      return;
    }

    setAssistantLoading(true);
    setAssistantError(null);
    try {
      const response = await window.desktopBridge.runDecisionAssistant({
        locale: appLocale,
        payload: buildDecisionPayload({
          locale: appLocale,
          market: selectedMarket,
          card: localizedSelectedCard,
          liveQuotes: selectedRelevantQuotes,
          forecast: selectedForecast,
          familyScores: familyScoresByMarket[marketId],
          alerts: selectedAlerts,
          catalysts: localizedCatalysts,
          deskRole,
          compareStats: selectedTapeCompareStats,
          dossier: selectedDossier,
          registryTrack: selectedRegistryTrack,
          natureRisk: selectedNatureRiskOverlay,
          question: assistantQuestion
        })
      });
      setAssistantResponse(response);
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : String(error));
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleLaunchExternal(url: string) {
    if (window.desktopBridge) {
      await window.desktopBridge.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSelectReference(reference: Pick<ReferenceCenterItem, "id" | "url">) {
    setSelectedReferenceId(reference.id);
    setSelectedReferenceUrl(reference.url);
  }

  function handleOpenExternal(url: string) {
    setSelectedReferenceId("");
    setSelectedReferenceUrl(url);
    setSurface("sources");
  }

  function handleSurfaceChange(nextSurface: Surface) {
    setSurface(nextSurface);
  }

  function handleMarketChange(nextMarketId: MarketProfile["id"]) {
    setMarketId(nextMarketId);
    setSurface("overview");
    setAssistantResponse(null);
  }

  function handleOpenCurrentMarketReference() {
    const nextUrl = localizedSelectedCard?.sourceUrl ?? selectedInteractiveQuote?.sourceUrl ?? "";
    if (nextUrl) {
      handleOpenExternal(nextUrl);
      return;
    }
    setSurface("sources");
  }

  function handleSelectQuote(quoteId: string) {
    setSelectedLiveQuoteId(quoteId);
    const selectedRow = selectedLinkedScoreRows.find((row) => row.quote.id === quoteId);
    if (selectedRow) {
      setSpotlight(buildTapeSpotlight(appLocale, selectedRow.quote, selectedRow.stats));
    }
  }

  function handleInspectDriver(rowId: string) {
    const row = selectedRoleDriverRows.find((item) => item.id === rowId);
    if (row) {
      setSpotlight(buildDriverSpotlight(appLocale, row));
    }
  }

  function handleInspectCatalyst(rowId: string) {
    const row = selectedRoleCatalystRows.find((item) => item.id === rowId);
    if (row) {
      setSpotlight(buildCatalystSpotlight(appLocale, row));
    }
  }

  function handleInspectSource(rowId: string) {
    const row = selectedSourceHealthRows.find((item) => item.id === rowId);
    if (row) {
      setSpotlight(buildSourceSpotlight(appLocale, row));
    }
  }

  function handleInspectDossier(dossierId: string) {
    const dossier = visibleDossiers.find((item) => item.id === dossierId);
    if (dossier) {
      setSelectedDossierId(dossier.id);
      setSelectedRegistryTrackId(dossier.registryTrackId);
      const linkedRisk = visibleNatureRiskOverlays.find((item) => item.dossierId === dossier.id);
      if (linkedRisk) {
        setSelectedRiskOverlayId(linkedRisk.id);
      }
      setSpotlight(buildDossierSpotlight(appLocale, dossier));
    }
  }

  function handleInspectRegistryTrack(trackId: string) {
    const track = visibleRegistryTracks.find((item) => item.id === trackId);
    if (track) {
      setSelectedRegistryTrackId(track.id);
      setSpotlight(buildRegistryTrackSpotlight(appLocale, track));
    }
  }

  function handleInspectRiskOverlay(riskId: string) {
    const overlay = visibleNatureRiskOverlays.find((item) => item.id === riskId);
    if (overlay) {
      setSelectedRiskOverlayId(overlay.id);
      setSpotlight(buildRiskSpotlight(appLocale, overlay));
    }
  }

  return (
    <div className="terminal-shell">
      <header className="titlebar">
        <div className="titlebar-brand" style={{ WebkitAppRegion: "drag" } as CSSProperties}>
          <img src={appIconUrl} alt="C-Quant" className="brand-mark" />
          <div>
            <strong>C-Quant</strong>
            <span>{t(appLocale, "탄소배출권 판단 도우미", "Carbon market guide")}</span>
          </div>
        </div>
        <div className="titlebar-tools">
          <div className="locale-switch">
            {localeOptions.map((option) => (
              <button
                key={option.id}
                className={option.id === appLocale ? "active" : ""}
                onClick={() => setAppLocale(option.id)}
              >
                {option.id.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="window-button" onClick={() => void window.desktopBridge?.minimizeWindow()}>
            _
          </button>
          <button
            className="window-button"
            onClick={async () => {
              const maximized = await window.desktopBridge?.toggleMaximizeWindow();
              setWindowMaximized(Boolean(maximized));
            }}
          >
            {windowMaximized ? "❐" : "□"}
          </button>
          <button className="window-button close" onClick={() => void window.desktopBridge?.closeWindow()}>
            ×
          </button>
        </div>
      </header>

      <div className="app-frame">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <img src={appIconUrl} alt="C-Quant" className="brand-mark sidebar-brand-mark" />
              <div>
                <strong>C-Quant</strong>
                <span>{t(appLocale, "탄소배출권 인텔리전스", "Carbon intelligence terminal")}</span>
              </div>
            </div>
            <div className="locale-switch sidebar-locale">
              {localeOptions.map((option) => (
                <button
                  key={option.id}
                  className={option.id === appLocale ? "active" : ""}
                  onClick={() => setAppLocale(option.id)}
                >
                  {option.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">{t(appLocale, "화면", "Screens")}</div>
            <nav className="surface-nav">
              {SURFACES.map((item) => (
                <button
                  key={item.id}
                  className={surface === item.id ? "active" : ""}
                  onClick={() => handleSurfaceChange(item.id)}
                >
                  {appLocale === "ko" ? item.ko : item.en}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">{t(appLocale, "시장", "Markets")}</div>
            <div className="market-switch">
              {marketProfiles.map((profile) => (
                <button
                  key={profile.id}
                  className={marketId === profile.id ? "active" : ""}
                  onClick={() => handleMarketChange(profile.id)}
                  style={
                    marketId === profile.id
                      ? ({ "--market-accent": marketColor(profile.id) } as CSSProperties)
                      : undefined
                  }
                >
                  {getMarketDisplayName(appLocale, profile.id)}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">{t(appLocale, "\uC6B4\uC6A9 \uBAA8\uB4DC", "Role mode")}</div>
            <div className="workspace-list">
              {DESK_ROLES.map((role) => (
                <button
                  key={role.id}
                  className={deskRole === role.id ? "active" : ""}
                  onClick={() => setDeskRole(role.id)}
                >
                  <strong>{appLocale === "ko" ? role.ko : role.en}</strong>
                  <span>{appLocale === "ko" ? role.summaryKo : role.summaryEn}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section sidebar-summary">
            <div className="sidebar-label">{t(appLocale, "\uD604\uC7AC \uC77D\uB294 \uBC29\uC2DD", "Current read")}</div>
            <strong>{`${getMarketDisplayName(appLocale, marketId)} - ${
              appLocale === "ko" ? selectedDeskRole.ko : selectedDeskRole.en
            }`}</strong>
            <p>{appLocale === "ko" ? selectedDeskRole.focusKo : selectedDeskRole.focusEn}</p>
            <div className="workspace-modules">
              {[selectedDesk.focus, selectedDesk.check, ...decisionView.thesis]
                .slice(0, 3)
                .map((label) => (
                  <span key={label}>{label}</span>
                ))}
            </div>
          </div>
        </aside>

        <div className="content-stage">
        <main className="scroll-body">
          <section className="hero-strip">
            <div>
              <div className="eyebrow">{t(appLocale, "오늘 한눈에", "Today")}</div>
              <h1>{getMarketDisplayName(appLocale, marketId)}</h1>
              <p>
                {localizedSelectedCard
                  ? `${t(appLocale, "공식 갱신", "Official update")} ${formatDate(appLocale, localizedSelectedCard.asOf)} · ${getStatusLabel(
                      appLocale,
                      localizedSelectedCard.status
                    )} · ${stanceLabel(appLocale, decisionView.stance)}`
                  : t(appLocale, "공식값 상태를 먼저 확인하세요.", "Check the official feed status first.")}
              </p>
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => void refreshSources()}>
                {refreshingSources
                  ? t(appLocale, "불러오는 중...", "Refreshing...")
                  : t(appLocale, "데이터 새로고침", "Refresh data")}
              </button>
              <button className="secondary-button" onClick={() => void handleSaveBrief()}>
                {t(appLocale, "요약 저장", "Save summary")}
              </button>
            </div>
          </section>

          <section className="panel panel-emphasis market-board-panel">
            <SectionHeader
              title={t(appLocale, "시장 한눈에 보기", "Market overview")}
              subtitle={t(
                appLocale,
                "각 시장의 공식 가격, 변동률, 거래량, 판단 바이어스와 추세를 한 줄로 비교합니다.",
                "Compare price, move, volume, and market tone at a glance."
              )}
            />
            <OperationalMarketBoard
              locale={appLocale}
              rows={marketBoardRows}
              selectedMarketId={marketId}
              onSelectMarket={handleMarketChange}
            />
          </section>

          {surface !== "overview" ? (
            <InteractionStage
              locale={appLocale}
              spotlight={spotlight}
              onOpenSource={handleOpenExternal}
              onGoSurface={handleSurfaceChange}
            />
          ) : null}

          {surface === "overview" ? (
            <div className="surface-stage" key={`overview-${marketId}-${spotlight?.id ?? "default"}`}>
            <InstitutionDeskSurface
              locale={appLocale}
              marketBoardRow={selectedMarketBoardRow}
              marketId={marketId}
              deskRole={deskRole}
              marketProfile={selectedMarket}
              marketLabel={getMarketDisplayName(appLocale, marketId)}
              officialCard={localizedSelectedCard}
              selectedSeries={selectedSeries}
              selectedVolumeSeries={selectedVolumeSeries}
              primaryQuote={selectedPrimaryQuote}
              selectedInteractiveQuote={selectedInteractiveQuote}
              comparePoints={selectedTapeComparePoints}
              compareSeries={selectedTapeCompareSeries}
              compareStats={selectedTapeCompareStats}
              decision={decisionView}
              topDriver={
                selectedForecast.contributions[0]?.variable ??
                t(appLocale, "주요 요인 없음", "No primary driver")
              }
              alertCount={selectedAlerts.length}
              linkedRows={selectedLinkedScoreRows}
              selectedQuoteId={selectedInteractiveQuote?.id ?? ""}
              onSelectQuote={handleSelectQuote}
              selectedQuoteRange={selectedQuoteRange}
              onSelectQuoteRange={setSelectedQuoteRange}
              interactiveQuoteLoading={interactiveQuoteLoading}
              interactiveQuoteError={interactiveQuoteError}
              focus={selectedDesk.focus}
              check={selectedDesk.check}
              priorityItems={selectedDesk.priorityItems}
              invalidationChecks={selectedDesk.invalidationChecks}
              driverRows={selectedRoleDriverRows}
              quantIndicators={selectedQuantPlaybook}
              catalystRows={selectedRoleCatalystRows}
              sourceRows={selectedSourceHealthRows}
              feedItems={feedItems.slice(0, 6)}
              onOpenDecision={() => handleSurfaceChange("signals")}
              onOpenSources={handleOpenCurrentMarketReference}
              onOpenSource={handleOpenExternal}
              onInspectDriver={handleInspectDriver}
              onInspectCatalyst={handleInspectCatalyst}
              onInspectSource={handleInspectSource}
            />
            </div>
          ) : null}

          {false && surface === "overview" ? (
            <>
              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "실제 연결된 테이프", "Linked market tapes")}
                    subtitle={t(
                      appLocale,
                      "공식 시세와 함께 실제로 참고하는 선물·프록시·드라이버 가격을 숫자로 확인합니다.",
                      "Review the actual linked futures, proxy, and driver tapes alongside the official market."
                    )}
                  />
                  <LinkedTapePanel
                    locale={appLocale}
                    quotes={selectedRelevantQuotes}
                    selectedQuoteId={selectedInteractiveQuote?.id ?? ""}
                    onSelectQuote={setSelectedLiveQuoteId}
                  />
                  <LiveTapeWorkbench
                    locale={appLocale}
                    officialCard={localizedSelectedCard}
                    quote={selectedInteractiveQuote}
                    quotePoints={selectedInteractiveQuotePoints}
                    comparePoints={selectedTapeComparePoints}
                    compareStats={selectedTapeCompareStats}
                    compareSeries={selectedTapeCompareSeries}
                    selectedRange={selectedQuoteRange}
                    onSelectRange={setSelectedQuoteRange}
                    loading={interactiveQuoteLoading}
                    error={interactiveQuoteError}
                    onOpenSource={handleOpenExternal}
                  />
                  <LinkedTapeScoreboard
                    locale={appLocale}
                    rows={selectedLinkedScoreRows}
                    selectedQuoteId={selectedInteractiveQuote?.id ?? ""}
                    onSelectQuote={setSelectedLiveQuoteId}
                  />
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "기관·기업 체크포인트", "Institution checklist")}
                    subtitle={t(
                      appLocale,
                      "이 시장에서 실제로 확인해야 할 헤지 기준, 비교 기준, 다음 점검 항목을 정리했습니다.",
                      "This is the practical checklist for the hedge anchor, comparison tape, and next checks."
                    )}
                  />
                  <InstitutionChecklistPanel
                    locale={appLocale}
                    marketId={marketId}
                    officialCard={localizedSelectedCard}
                    primaryQuote={selectedPrimaryQuote}
                    supportQuotes={selectedSupportQuotes}
                    focus={selectedDesk.focus}
                    check={selectedDesk.check}
                    executionNote={selectedDesk.executionNote}
                    priorityItems={selectedDesk.priorityItems}
                    invalidationChecks={selectedDesk.invalidationChecks}
                  />
                </div>
              </section>

              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "공식 가격 차트", "Official price chart")}
                    subtitle={
                      localizedSelectedCard?.seriesLabel ??
                      t(
                        appLocale,
                        "시계열 미공개 시장은 이벤트 중심으로 해석합니다.",
                        "If there is no continuous price series, use notices and events instead."
                      )
                    }
                  />
                  {selectedSeries.length > 1 ? (
                    <LineChart
                      points={selectedSeries}
                      color={marketColor(marketId)}
                      locale={appLocale === "ko" ? "ko-KR" : "en-US"}
                      title={localizedSelectedCard?.sourceName}
                      subtitle={`${t(appLocale, "업데이트", "Updated")} ${formatDate(appLocale, localizedSelectedCard?.asOf)}`}
                    />
                  ) : (
                    <div className="empty-plot">
                      <strong>{t(appLocale, "연속 시계열 없음", "No continuous official time series")}</strong>
                      <p>
                        {localizedSelectedCard?.summary ??
                          t(
                            appLocale,
                            "최신 공식 공지를 중심으로 해석합니다.",
                            "Read the latest official bulletin instead."
                          )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "지금 분위기", "Current tone")}
                    subtitle={t(
                      appLocale,
                      "현재 판단 구간, 신뢰도, 상위 인자를 압축해서 보여줍니다.",
                      "See whether the market feels strong or weak, and why."
                    )}
                  />
                  <MarketPulsePanel
                    locale={appLocale}
                    forecast={selectedForecast}
                    decision={decisionView}
                    updatedAt={localizedSelectedCard?.asOf}
                    sourceStatus={localizedSelectedCard?.status ?? "limited"}
                    scoreCap={selectedScoreCap}
                    drivers={selectedDriverHighlights}
                  />
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "시장 비교", "Market compare")}
                    subtitle={t(
                      appLocale,
                      "공식 시계열이 있는 시장만 100 기준으로 비교합니다.",
                      "Put markets on the same starting line and compare strength."
                    )}
                  />
                  {crossMarketPoints.length > 1 && crossMarketSeries.length > 0 ? (
                    <MultiLineChart
                      points={crossMarketPoints}
                      series={crossMarketSeries}
                      locale={appLocale === "ko" ? "ko-KR" : "en-US"}
                      valueFormatter={(value) => formatNumber(appLocale, value, 0)}
                    />
                  ) : (
                    <div className="empty-plot">
                      <strong>{t(appLocale, "비교용 시계열 준비 중", "Waiting for comparable official history")}</strong>
                      <p>
                        {t(
                          appLocale,
                          "EU 경매와 KRX 일별 시세는 그래프화하고, 중국은 이벤트 레이어로 분리합니다.",
                          "EU auctions and KRX closes are charted; China stays in the event layer until daily official series is reliable."
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "가격에 영향을 주는 것들", "What moves price")}
                    subtitle={t(
                      appLocale,
                      "연구 기반 인자군을 국가별로 한 번에 봅니다.",
                      "See which forces are moving prices across markets."
                    )}
                  />
                  <Heatmap
                    columns={marketProfiles.map((profile) => getMarketDisplayName(appLocale, profile.id))}
                    rows={heatmapRows}
                  />
                </div>
              </section>

              <section className="overview-grid tertiary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "거래량 흐름", "Volume flow")}
                    subtitle={t(
                      appLocale,
                      "공식 거래량/경매 수량이 있는 시장만 표시합니다.",
                      "See how active the market is."
                    )}
                  />
                  {selectedVolumeSeries.length > 0 ? (
                    <ColumnChart
                      points={selectedVolumeSeries.slice(-10)}
                      color={marketColor(marketId)}
                      valueFormatter={(value) => formatCompact(appLocale, value)}
                    />
                  ) : (
                    <div className="empty-plot">{t(appLocale, "거래량 시계열 없음", "No volume series available")}</div>
                  )}
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "무슨 힘이 큰지", "Biggest forces")}
                    subtitle={t(
                      appLocale,
                      "선택 시장의 인자군 강도를 압축해서 봅니다.",
                      "Summarize the forces moving the market right now."
                    )}
                  />
                  <ColumnChart
                    points={familyBarPoints}
                    color={marketColor(marketId)}
                    valueFormatter={(value) => `${formatNumber(appLocale, value, 0)}%`}
                  />
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "주의 알림", "Alerts")}
                    subtitle={t(
                      appLocale,
                      "현재 시장에 걸린 경보의 강도 분포입니다.",
                      "See how many warnings need attention now."
                    )}
                  />
                  <div className="alert-meter-stack">
                    <DonutMeter
                      value={decisionView.confidence}
                      label={t(appLocale, "신뢰도", "Confidence")}
                      subLabel={stanceLabel(appLocale, decisionView.stance)}
                      color={marketColor(marketId)}
                    />
                    <ColumnChart
                      points={alertCountPoints}
                      color={NEGATIVE}
                      valueFormatter={(value) => formatNumber(appLocale, value, 0)}
                    />
                  </div>
                </div>
              </section>

              <section className="overview-grid feed-row">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "시장 소식", "Market feed")}
                    subtitle={t(
                      appLocale,
                      "글은 길지 않게, 판단에 필요한 문장만 남겼습니다.",
                      "Read only the short items that matter for a decision."
                    )}
                  />
                  <div className="feed-list">
                    {feedItems.map((item) => (
                      <button
                        key={item.id}
                        className={`feed-item ${item.tone}`}
                        onClick={() => (item.link ? void handleOpenExternal(item.link) : undefined)}
                      >
                        <span>{item.kicker}</span>
                        <strong>{item.title}</strong>
                        <p>{item.body}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "앞으로 볼 일정", "Upcoming events")}
                    subtitle={t(
                      appLocale,
                      "정책, 경매, 공시를 일정처럼 관리합니다.",
                      "Track policy, auction, and disclosure dates in one place."
                    )}
                  />
                  <div className="timeline-list">
                    {localizedCatalysts.map((item) => (
                      <button
                        key={item.id}
                        className="timeline-item"
                        onClick={() => void handleOpenExternal(item.source.url)}
                      >
                        <small>{item.windowLabel}</small>
                        <strong>{item.title}</strong>
                        <p>{item.trigger}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {surface === "signals" ? (
            <div className="surface-stage" key={`signals-${marketId}-${spotlight?.id ?? "default"}`}>
            <InstitutionDecisionSurface
              locale={appLocale}
              decision={decisionView}
              assistantLoading={assistantLoading}
              assistantError={assistantError}
              hasApiKey={settings.hasOpenAIApiKey}
              question={assistantQuestion}
              onQuestionChange={setAssistantQuestion}
              onRunAssistant={handleRunAssistant}
              driverRows={selectedRoleDriverRows}
              catalystRows={selectedRoleCatalystRows}
              sourceRows={selectedSourceHealthRows}
              dossier={selectedDossier}
              registryRows={registryFreshnessRows}
              registryTrack={selectedRegistryTrack}
              riskOverlay={selectedNatureRiskOverlay}
              focus={selectedDesk.focus}
              check={selectedDesk.check}
              priorityItems={selectedDesk.priorityItems}
              invalidationChecks={selectedDesk.invalidationChecks}
              onOpenSource={handleOpenExternal}
              onInspectDriver={handleInspectDriver}
              onInspectCatalyst={handleInspectCatalyst}
              onInspectSource={handleInspectSource}
              onInspectDossier={handleInspectDossier}
              onInspectRegistryTrack={handleInspectRegistryTrack}
              onInspectRisk={handleInspectRiskOverlay}
            />
            </div>
          ) : null}

          {false && surface === "signals" ? (
            <>
              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "무엇이 가격을 밀고 있나", "What is moving price")}
                    subtitle={t(
                      appLocale,
                      "매수·매도 판단에 가장 크게 기여한 인자입니다.",
                      "Largest contributors to the current buy/sell posture."
                    )}
                  />
                  <WaterfallChart
                    items={contributionItems}
                    positiveColor={POSITIVE}
                    negativeColor={NEGATIVE}
                  />
                </div>
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "지금 판단 위치", "Decision position")}
                    subtitle={t(
                      appLocale,
                      "지금 구간이 어디에 놓여 있는지, 어떤 인자가 밀고 있는지 먼저 확인합니다.",
                      "Read the current posture band and driver pressure before changing assumptions."
                    )}
                  />
                  <MarketPulsePanel
                    locale={appLocale}
                    forecast={selectedForecast}
                    decision={decisionView}
                    updatedAt={localizedSelectedCard?.asOf}
                    sourceStatus={localizedSelectedCard?.status ?? "limited"}
                    scoreCap={selectedScoreCap}
                    drivers={selectedDriverHighlights}
                  />
                </div>
              </section>

              <section className="overview-grid">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "가정 바꾸기", "Change assumptions")}
                    subtitle={t(
                      appLocale,
                      "핵심 드라이버를 직접 조정해 판단을 재계산합니다.",
                      "Adjust core drivers directly and recalculate the posture."
                    )}
                  />
                  <div className="slider-stack">
                    {selectedMarket.drivers.slice(0, 6).map((driver) => (
                      <label key={driver.id} className="driver-slider">
                        <div>
                          <strong>{driver.variable}</strong>
                          <span>
                            {getImportanceLabel(appLocale, driver.importance)} ·{" "}
                            {formatNumber(appLocale, currentState[driver.id] ?? 0, 2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-1}
                          max={1}
                          step={0.05}
                          value={currentState[driver.id] ?? 0}
                          onChange={(event) => updateScenario(driver.id, Number(event.target.value))}
                        />
                      </label>
                    ))}
                    <div className="slider-actions">
                      <button className="secondary-button" onClick={resetScenario}>
                        {t(appLocale, "시나리오 초기화", "Reset scenario")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "짧은 판단 설명", "Quick decision brief")}
                    subtitle={t(
                      appLocale,
                      "규칙 기반 판단과 LLM 브리프를 같은 패널에 둡니다.",
                      "Rule-based posture and LLM brief live on the same panel."
                    )}
                    {...decisionReasonHeader}
                  />
                  <ExplainableDecisionPanel
                    locale={appLocale}
                    decision={decisionView}
                    assistantLoading={assistantLoading}
                    assistantError={assistantError}
                    hasApiKey={settings.hasOpenAIApiKey}
                    question={assistantQuestion}
                    onQuestionChange={setAssistantQuestion}
                    onRunAssistant={handleRunAssistant}
                  />
                </div>
              </section>

              <section className="overview-grid tertiary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "AI 설정", "AI settings")}
                    subtitle={t(
                      appLocale,
                      "키는 데스크톱 앱 로컬 저장소에만 저장됩니다.",
                      "Keys stay in the desktop app's local user-data folder."
                    )}
                  />
                  <div className="settings-stack">
                    <label>
                      <span>OpenAI API key</span>
                      <input
                        type="password"
                        value={apiKeyDraft}
                        onChange={(event) => setApiKeyDraft(event.target.value)}
                        placeholder={settings.hasOpenAIApiKey ? "Saved locally" : "sk-..."}
                      />
                    </label>
                    <label>
                      <span>{t(appLocale, "모델", "Model")}</span>
                      <input
                        type="text"
                        value={modelDraft}
                        onChange={(event) => setModelDraft(event.target.value)}
                        placeholder="gpt-4.1-mini"
                      />
                    </label>
                    <div className="settings-actions">
                      <button className="primary-button" onClick={() => void handleSaveLlmSettings()}>
                        {t(appLocale, "AI 설정 저장", "Save AI settings")}
                      </button>
                      <small>
                        {settings.hasOpenAIApiKey
                          ? t(appLocale, "현재 키가 저장되어 있습니다.", "An API key is currently stored.")
                          : t(appLocale, "아직 저장된 키가 없습니다.", "No API key is stored yet.")}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "판단 체크리스트", "Decision checklist")}
                    subtitle={t(
                      appLocale,
                      "매수·매도 타이밍 확인에 쓰는 핵심 체크리스트입니다.",
                      "Core checks for timing buy/sell posture."
                    )}
                  />
                  <div className="indicator-list">
                    {localizedQuantIndicators.map((indicator) => (
                      <div key={indicator.id} className="indicator-item">
                        <strong>{indicator.name}</strong>
                        <span>{indicator.family}</span>
                        <p>{indicator.whyItMatters}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "주의 알림 모음", "Alert hub")}
                    subtitle={t(
                      appLocale,
                      "활성 경보를 우선순위대로 정리합니다.",
                      "Active warnings sorted by urgency."
                    )}
                  />
                  <div className="alert-list">
                    {selectedAlerts.length > 0 ? (
                      selectedAlerts.map((alert) => (
                        <div key={alert.id} className={`alert-item ${alert.severity.toLowerCase()}`}>
                          <strong>{alert.title}</strong>
                          <span>{getSeverityLabel(appLocale, alert.severity)}</span>
                          <p>{alert.body}</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-plot">{t(appLocale, "현재 활성 알림 없음", "No active alerts right now")}</div>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {surface === "lab" ? (
            <div className="surface-stage" key={`lab-${marketId}`}>
            <>
              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "백테스트", "Backtest")}
                    subtitle={t(
                      appLocale,
                      "CSV를 올리고 전략별 성과를 바로 확인합니다.",
                      "Upload CSV and check strategy performance immediately."
                    )}
                  />
                  <div className="lab-controls">
                    <button className="primary-button" onClick={() => void handlePickCsv()}>
                      {t(appLocale, "CSV 불러오기", "Load CSV")}
                    </button>
                    <span>{csvPath ?? t(appLocale, "선택된 파일 없음", "No file selected")}</span>
                  </div>
                  <div className="lab-grid">
                    <label>
                      <span>{t(appLocale, "전략", "Strategy")}</span>
                      <select
                        value={backtestStrategy}
                        onChange={(event) => setBacktestStrategy(event.target.value as BacktestStrategy)}
                      >
                        <option value="trend">{t(appLocale, "추세 추종", "Trend")}</option>
                        <option value="meanReversion">{t(appLocale, "평균 회귀", "Mean reversion")}</option>
                        <option value="spreadRegime">{t(appLocale, "스프레드 레짐", "Spread regime")}</option>
                        <option value="policyMomentum">{t(appLocale, "정책 모멘텀", "Policy momentum")}</option>
                      </select>
                    </label>
                    <label>
                      <span>{t(appLocale, "비용(bps)", "Fee (bps)")}</span>
                      <input
                        type="number"
                        value={backtestFeeBps}
                        onChange={(event) => setBacktestFeeBps(Number(event.target.value))}
                      />
                    </label>
                    <button className="secondary-button" onClick={handleRunBacktest}>
                      {t(appLocale, "백테스트 실행", "Run backtest")}
                    </button>
                  </div>

                  {backtestChartPoints.length > 1 ? (
                    <LineChart
                      points={backtestChartPoints}
                      color={marketColor(marketId)}
                      locale={appLocale === "ko" ? "ko-KR" : "en-US"}
                      title={t(appLocale, "누적 자본곡선", "Equity curve")}
                      subtitle={t(appLocale, "CSV 입력 기준", "From uploaded CSV")}
                    />
                  ) : (
                    <div className="empty-plot">
                      {t(appLocale, "먼저 CSV를 불러오고 백테스트를 실행하세요.", "Load a CSV and run a backtest first.")}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "워크포워드 모델", "Walk-forward model")}
                    subtitle={t(
                      appLocale,
                      "Python 모델을 같은 앱 안에서 실행합니다.",
                      "Run the Python model inside the same desktop app."
                    )}
                  />
                  <div className="lab-controls">
                    <button className="primary-button" onClick={() => void handleRunWalkForward()}>
                      {runningWalkForward ? t(appLocale, "실행 중...", "Running...") : t(appLocale, "워크포워드 실행", "Run walk-forward")}
                    </button>
                    <button className="secondary-button" onClick={() => void handleSaveTemplate()}>
                      {t(appLocale, "템플릿 저장", "Save template")}
                    </button>
                  </div>

                  {walkForwardFeaturePoints.length > 0 ? (
                    <>
                      <div className="metric-cluster">
                        <MetricPill label="MAE" value={formatNumber(appLocale, walkForwardResult?.summary.mae ?? 0, 2)} />
                        <MetricPill label="RMSE" value={formatNumber(appLocale, walkForwardResult?.summary.rmse ?? 0, 2)} />
                        <MetricPill
                          label={t(appLocale, "방향 적중률", "Directional")}
                          value={`${formatNumber(appLocale, walkForwardResult?.summary.directionalAccuracyPct ?? 0, 0)}%`}
                        />
                      </div>
                      <ForecastConfidenceBand locale={appLocale} result={walkForwardResult} />
                      <ColumnChart
                        points={walkForwardFeaturePoints}
                        color={marketColor(marketId)}
                        valueFormatter={(value) => formatNumber(appLocale, value, 2)}
                      />
                    </>
                  ) : (
                    <div className="empty-plot">{t(appLocale, "워크포워드 결과 없음", "No walk-forward result yet")}</div>
                  )}
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "백테스트 메트릭", "Backtest metrics")}
                    subtitle={t(
                      appLocale,
                      "샤프, MDD, 승률을 한 줄로 봅니다.",
                      "Sharpe, drawdown, and hit rate at a glance."
                    )}
                  />
                  <div className="metric-cluster">
                    <MetricPill label="Return" value={`${formatNumber(appLocale, backtestRun?.metrics.totalReturnPct ?? 0, 1)}%`} />
                    <MetricPill label="Sharpe" value={formatNumber(appLocale, backtestRun?.metrics.sharpe ?? 0, 2)} />
                    <MetricPill label="MDD" value={`${formatNumber(appLocale, backtestRun?.metrics.maxDrawdownPct ?? 0, 1)}%`} />
                    <MetricPill
                      label={t(appLocale, "승률", "Win rate")}
                      value={`${formatNumber(appLocale, backtestRun?.metrics.winRatePct ?? 0, 0)}%`}
                    />
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "데이터 스키마", "Dataset schema")}
                    subtitle={t(
                      appLocale,
                      "선택 시장 모델용 템플릿 구조입니다.",
                      "Template structure for the selected market."
                    )}
                  />
                  <div className="schema-list">
                    {datasetSchema.columns.map((column) => (
                      <div key={column.name} className="schema-row">
                        <strong>{column.name}</strong>
                        <span>{column.required ? t(appLocale, "필수", "Required") : t(appLocale, "선택", "Optional")}</span>
                        <p>{column.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
            </div>
          ) : null}

          {surface === "sources" ? (
            <div className="surface-stage" key={`sources-${marketId}-${spotlight?.id ?? "default"}`}>
            <>
              <section className="panel sources-toolbar">
                <div className="toolbar-copy">
                  <strong>{t(appLocale, "출처 보기 방식", "Source view")}</strong>
                  <span>
                    {t(
                      appLocale,
                      "무료로 볼 수 있는 출처만 먼저 보고 싶다면 이 옵션을 켜두세요.",
                      "Turn this on to hide sources that may require payment."
                    )}
                  </span>
                </div>
                <button
                  className={`toggle-pill ${freeOnlySources ? "active" : ""}`}
                  onClick={() => setFreeOnlySources((value) => !value)}
                >
                  {freeOnlySources
                    ? t(appLocale, "무료 소스만 보기", "Free sources only")
                    : t(appLocale, "전체 보기", "Show all")}
                </button>
              </section>

              <section className="panel reference-center-panel">
                <div className="reference-center-head">
                  <div className="toolbar-copy">
                    <strong>{t(appLocale, "Reference Center", "Reference Center")}</strong>
                    <span>
                      {t(
                        appLocale,
                        "클릭한 모든 출처와 참고 링크를 먼저 앱 안에서 읽고 정리하는 공간입니다.",
                        "This is the in-app layer for reading and organizing every clicked source before leaving the app."
                      )}
                    </span>
                  </div>
                  {selectedReferenceItem ? (
                    <button
                      className="subtle-button"
                      onClick={() => void handleLaunchExternal(selectedReferenceItem.url)}
                    >
                      {t(appLocale, "원문 열기", "Open original")}
                    </button>
                  ) : null}
                </div>

                {selectedReferenceItem ? (
                  <div className="reference-center-grid">
                    <div className="reference-center-detail">
                      <div className="reference-center-meta">
                        <span className="eyebrow">
                          {localizeReferenceKind(appLocale, selectedReferenceItem.kind)}
                        </span>
                        <strong>{selectedReferenceItem.title}</strong>
                        <span>{selectedReferenceItem.subtitle}</span>
                      </div>
                      <p>{selectedReferenceItem.summary}</p>
                      <div className="status-chip-row">
                        <span className="driver-chip neutral">{getReferenceHostLabel(selectedReferenceItem.url)}</span>
                        <span className="driver-chip neutral">{t(appLocale, "앱 내부 보기 우선", "Stay in app first")}</span>
                      </div>
                      <ul className="project-risk-list">
                        {selectedReferenceItem.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      {selectedReferenceContext ? (
                        <>
                          <div className="reference-context-metrics">
                            {selectedReferenceContext.metrics.map((item) => (
                              <MetricPill key={item.label} label={item.label} value={item.value} />
                            ))}
                          </div>

                          <div className="reference-context-grid">
                            <div className="reference-context-card">
                              <strong>{t(appLocale, "앱 안에서 같이 볼 것", "Cross-check inside the app")}</strong>
                              <span className="reference-context-headline">
                                {t(
                                  appLocale,
                                  "지금 시장을 읽을 때 같이 눌러봐야 하는 비교 테이프와 운영 메모입니다.",
                                  "These are the linked tapes and operating notes that should be read together."
                                )}
                              </span>
                              <div className="reference-mini-list">
                                {selectedReferenceContext.relatedQuotes.map((quote) => (
                                  <button
                                    key={quote.id}
                                    className="reference-mini-row"
                                    onClick={() => {
                                      handleSelectQuote(quote.id);
                                      setSurface("overview");
                                    }}
                                  >
                                    <div>
                                      <strong>{quote.title}</strong>
                                      <span>{quote.role}</span>
                                    </div>
                                    <small>{formatLiveQuotePrice(appLocale, quote)}</small>
                                  </button>
                                ))}
                                {selectedReferenceContext.operationalNotes.map((item) => (
                                  <div key={item} className="reference-inline-note">
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="reference-context-card">
                              <strong>{t(appLocale, "운영 흐름 맥락", "Workflow context")}</strong>
                              <span className="reference-context-headline">
                                {selectedReferenceContext.workflowHeadline}
                              </span>
                              {selectedReferenceContext.workflowBullets.length > 0 ? (
                                <ul className="reference-inline-list">
                                  {selectedReferenceContext.workflowBullets.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="reference-inline-note">
                                  {t(
                                    appLocale,
                                    "이 레퍼런스에 연결된 별도 운영 흐름이 아직 없습니다.",
                                    "No dedicated workflow is linked to this reference yet."
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : null}

                      {selectedReferenceDocumentPreview ? (
                        <div className="reference-document-preview">
                          <div className="reference-document-head">
                            <div>
                              <strong>{t(appLocale, "문서 미리보기", "Document preview")}</strong>
                              <span>
                                {`${selectedReferenceDocumentPreview.document.docType} · ${formatDate(
                                  appLocale,
                                  selectedReferenceDocumentPreview.document.publishedAt
                                )}`}
                              </span>
                            </div>
                            <div className="status-chip-row">
                              <span
                                className={`driver-chip ${registryHealthTone(
                                  selectedReferenceDocumentPreview.document.status === "fresh"
                                    ? "healthy"
                                    : selectedReferenceDocumentPreview.document.status === "watch"
                                      ? "watch"
                                      : "blocked"
                                )}`}
                              >
                                {registryStatusLabel(
                                  appLocale,
                                  selectedReferenceDocumentPreview.document.status
                                )}
                              </span>
                              <span className="driver-chip neutral">
                                {selectedReferenceDocumentPreview.dossier.registry}
                              </span>
                            </div>
                          </div>

                          <div className="reference-document-grid">
                            <div className="reference-document-card">
                              <strong>{selectedReferenceDocumentPreview.document.title}</strong>
                              <p>{selectedReferenceDocumentPreview.document.note}</p>
                              <small>{selectedReferenceDocumentPreview.dossier.currentRead}</small>
                            </div>
                            <div className="reference-document-card">
                              <strong>{t(appLocale, "운용 연결", "Operator linkage")}</strong>
                              <ul className="reference-inline-list">
                                <li>{selectedReferenceDocumentPreview.dossier.operatorUse}</li>
                                <li>
                                  {selectedRegistryTrack?.operatorRead ??
                                    t(
                                      appLocale,
                                      "연결된 레지스트리 운영 메모가 아직 없습니다.",
                                      "There is no linked registry workflow note yet."
                                    )}
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="reference-stage-list">
                            {selectedReferenceDocumentPreview.dossier.stages.map((item) => (
                              <div key={item.id} className="reference-stage-row">
                                <strong>{item.label}</strong>
                                <span>{item.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="reference-center-side">
                      <div className="reference-side-block">
                        <strong>{t(appLocale, "관련 문서", "Related documents")}</strong>
                        <div className="reference-center-list compact">
                          {selectedReferenceContext?.relatedDocuments.length ? (
                            selectedReferenceContext.relatedDocuments.map((item) => (
                              <button
                                key={item.id}
                                className="reference-center-row"
                                onClick={() =>
                                  handleSelectReference({
                                    id: `document-${item.id}`,
                                    url: item.sourceUrl
                                  })
                                }
                              >
                                <div>
                                  <strong>{item.title}</strong>
                                  <span>{`${item.docType} · ${formatDate(appLocale, item.publishedAt)}`}</span>
                                </div>
                                <small>{registryStatusLabel(appLocale, item.status)}</small>
                              </button>
                            ))
                          ) : (
                            <div className="reference-inline-note">
                              {t(
                                appLocale,
                                "같이 묶을 문서가 아직 없습니다.",
                                "There are no linked documents to group here yet."
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="reference-side-block">
                        <strong>{t(appLocale, "같은 맥락의 레퍼런스", "Nearby references")}</strong>
                        <div className="reference-center-list">
                          {(selectedReferenceContext?.relatedItems.length
                            ? selectedReferenceContext.relatedItems
                            : referenceQuickList
                          ).map((item) => (
                            <button
                              key={item.id}
                              className={`reference-center-row ${
                                selectedReferenceItem.id === item.id ? "active" : ""
                              }`}
                              onClick={() => handleSelectReference(item)}
                            >
                              <div>
                                <strong>{item.title}</strong>
                                <span>{item.subtitle}</span>
                              </div>
                              <small>{getReferenceHostLabel(item.url)}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-plot compact">
                    {t(
                      appLocale,
                      "선택된 레퍼런스가 아직 없습니다.",
                      "No reference is selected yet."
                    )}
                  </div>
                )}
              </section>

              <section className="overview-grid">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "소스 커버리지", "Source coverage")}
                    subtitle={t(
                      appLocale,
                      "현재 시장에서 어떤 방식의 데이터를 쓰는지 한 번에 봅니다.",
                      "View the source methods used for the current market."
                    )}
                  />
                  <ColumnChart
                    points={sourceMethodPoints}
                    color={marketColor(marketId)}
                    valueFormatter={(value) => formatNumber(appLocale, value, 0)}
                  />
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "워치리스트", "Watchlist")}
                    subtitle={activeWatchlist.summary}
                  />
                  <div className="watch-controls">
                    <select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)}>
                      {localizedWatchlists.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    <select value={watchViewId} onChange={(event) => setWatchViewId(event.target.value)}>
                      {localizedWatchViews.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="watch-table">
                    {watchlistItems.map((item) => (
                      <button key={item.id} className="watch-row" onClick={() => void handleOpenExternal(item.url)}>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{localizeLabel(appLocale, item.category, CATEGORY_LABELS_KO)}</span>
                        </div>
                        <div>
                          <strong>{item.role}</strong>
                          {activeWatchView.id !== "scan-view" ? <span>{item.note}</span> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "소스 레지스트리", "Source registry")}
                    subtitle={t(
                      appLocale,
                      "공식 웹, 파일, API, 상업 API를 분리합니다.",
                      "Free sources come first, and paid options are flagged separately."
                    )}
                  />
                  <div className="source-list">
                    {visibleSources.length > 0 ? (
                      visibleSources.map((item) => (
                      <button key={item.id} className="source-item" onClick={() => void handleOpenExternal(item.url)}>
                        <div className="source-head">
                          <strong>{item.title}</strong>
                          <div className="source-tags">
                            <span className={`access-pill ${getAccessTier(appLocale, item.method).tone}`}>
                              {getAccessTier(appLocale, item.method).label}
                            </span>
                            <span>{localizeLabel(appLocale, item.method, METHOD_LABELS_KO)}</span>
                          </div>
                        </div>
                        <p>{item.appUse}</p>
                        <small>{item.whyItMatters}</small>
                      </button>
                      ))
                    ) : (
                      <div className="empty-plot compact">
                        {t(
                          appLocale,
                          "무료 조건에 맞는 출처가 없습니다.",
                          "No sources match the current free-only filter."
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "벤치마크에서 빌린 기능", "Benchmark features borrowed")}
                    subtitle={t(
                      appLocale,
                      "성공한 툴에서 무엇을 가져왔는지 명확히 남깁니다.",
                      "Keep a clear record of what was borrowed from successful tools."
                    )}
                  />
                  <div className="benchmark-list">
                    {localizedBenchmarks.map((item) => (
                      <button key={item.id} className="benchmark-item" onClick={() => void handleOpenExternal(item.source.url)}>
                        <strong>{item.name}</strong>
                        <span>{localizeLabel(appLocale, item.category, CATEGORY_LABELS_KO)}</span>
                        <p>{item.strength}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "레지스트리 운영 보드", "Registry operations board")}
                    subtitle={t(
                      appLocale,
                      "문서 흐름, 검토 주기, 막힘 요인을 따로 보는 운영 보드입니다.",
                      "Track evidence workflow, refresh cadence, and blockers separately from market direction."
                    )}
                  />
                  <ColumnChart
                    points={registryOperationsPoints}
                    color={marketColor(marketId)}
                    valueFormatter={(value) => formatNumber(appLocale, value, 0)}
                    height={170}
                  />
                  <div className="benchmark-list">
                    {visibleRegistryTracks.map((item) => (
                      <button
                        key={item.id}
                        className={`benchmark-item benchmark-item-detailed ${selectedRegistryTrack?.id === item.id ? "active" : ""}`}
                        onClick={() => handleInspectRegistryTrack(item.id)}
                      >
                        <strong>{item.registry}</strong>
                        <span>{`${item.accessMethod} · ${registryHealthLabel(appLocale, item.status)}`}</span>
                        <p>{item.operatorRead}</p>
                        <div className="status-chip-row">
                          <span className={`driver-chip ${registryHealthTone(item.status)}`}>
                            {registryHealthLabel(appLocale, item.status)}
                          </span>
                          <span className="driver-chip neutral">{item.refreshCadence}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "선택한 운영 흐름", "Selected workflow")}
                    subtitle={selectedRegistryTrack?.registry ?? t(appLocale, "선택된 운영 흐름 없음", "No workflow selected")}
                  />
                  {selectedRegistryTrack ? (
                    <div className="registry-track-panel">
                      <div className="registry-track-head">
                        <div>
                          <strong>{selectedRegistryTrack.registry}</strong>
                          <span>{`${selectedRegistryTrack.accessMethod} · ${formatDate(appLocale, selectedRegistryTrack.lastReviewed)}`}</span>
                        </div>
                        <button className="subtle-button" onClick={() => void handleLaunchExternal(selectedRegistryTrack.source.url)}>
                          {t(appLocale, "원문 열기", "Open original")}
                        </button>
                      </div>
                      <p>{selectedRegistryTrack.operatorRead}</p>
                      <div className="status-chip-row">
                        <span className={`driver-chip ${registryHealthTone(selectedRegistryTrack.status)}`}>
                          {registryHealthLabel(appLocale, selectedRegistryTrack.status)}
                        </span>
                        <span className="driver-chip neutral">
                          {t(appLocale, "기준", "SLA")} · {selectedRegistryTrack.freshnessSla}
                        </span>
                      </div>
                      <ColumnChart
                        points={registryStagePoints}
                        color={marketColor(marketId)}
                        valueFormatter={(value) => `${formatNumber(appLocale, value, 0)}`}
                        height={180}
                      />
                      <div className="registry-track-columns">
                        <ul className="project-risk-list">
                          {selectedRegistryTrack.watchItems.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <ul className="project-risk-list">
                          {selectedRegistryTrack.blockers.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-plot compact">
                      {t(appLocale, "연결된 레지스트리 운영 흐름이 없습니다.", "No registry workflow is linked.")}
                    </div>
                  )}
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "오픈소스 벤치마크 맵", "Open-source benchmark map")}
                    subtitle={t(
                      appLocale,
                      "무엇을 참고하고, 무엇은 제품 경계 때문에 제외하는지 분리합니다.",
                      "Separate what C-Quant borrows from what it refuses to copy because of product boundary."
                    )}
                  />
                  <div className="benchmark-list">
                    {localizedOpenSourceBenchmarks.map((item) => (
                      <button
                        key={item.id}
                        className="benchmark-item benchmark-item-detailed"
                        onClick={() => void handleOpenExternal(item.source.url)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.category}</span>
                        <p>{item.verifiedCapability}</p>
                        <div className="benchmark-detail">
                          <span>{t(appLocale, "C-Quant 반영", "Adapt in C-Quant")}</span>
                          <small>{item.adaptForCQuant}</small>
                        </div>
                        <div className="benchmark-detail">
                          <span>{t(appLocale, "제외할 것", "Do not copy")}</span>
                          <small>{item.boundaryNote}</small>
                        </div>
                        <div className="benchmark-detail">
                          <span>{t(appLocale, "LLM 활용", "LLM use")}</span>
                          <small>{item.llmUse}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "크레딧 생애주기 프로젝트 파일", "Credit lifecycle dossiers")}
                    subtitle={t(
                      appLocale,
                      "발행, 검증, 문서, retirement trail을 읽기 전용으로 정리합니다.",
                      "Read-only dossiers for issuance, verification, registry documents, and retirement trail."
                    )}
                  />
                  <div className="benchmark-list">
                    {visibleDossiers.map((item) => {
                      const tone =
                        item.documents.some((doc) => doc.status === "stale")
                          ? "negative"
                          : item.documents.some((doc) => doc.status === "watch")
                            ? "neutral"
                            : "positive";

                      return (
                        <button
                          key={item.id}
                          className={`benchmark-item benchmark-item-detailed ${selectedDossier?.id === item.id ? "active" : ""}`}
                          onClick={() => handleInspectDossier(item.id)}
                        >
                          <strong>{item.title}</strong>
                          <span>{`${item.registry} · ${item.projectType}`}</span>
                          <p>{item.currentRead}</p>
                          <div className="status-chip-row">
                            {item.stages.map((stage) => (
                              <span
                                key={stage.id}
                                className={`driver-chip ${lifecycleStatusTone(stage.status)} ${tone}`}
                              >
                                {stage.label} · {lifecycleStatusLabel(appLocale, stage.status)}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "레지스트리 문서 신선도", "Registry evidence freshness")}
                    subtitle={selectedDossier?.title ?? t(appLocale, "선택된 프로젝트 파일 없음", "No dossier selected")}
                  />
                  <ColumnChart
                    points={registryFreshnessPoints}
                    color={marketColor(marketId)}
                    valueFormatter={(value) => formatNumber(appLocale, value, 0)}
                    height={170}
                  />
                  <div className="benchmark-list">
                    {registryFreshnessRows.map((item) => (
                      <button
                        key={item.id}
                        className="benchmark-item benchmark-item-detailed"
                        onClick={() => void handleOpenExternal(item.sourceUrl)}
                      >
                        <strong>{item.title}</strong>
                        <span>{`${item.docType} · ${formatDate(appLocale, item.publishedAt)}`}</span>
                        <div className="status-chip-row">
                          <span className={`driver-chip ${registryStatusTone(item.status)}`}>
                            {registryStatusLabel(appLocale, item.status)}
                          </span>
                        </div>
                        <p>{item.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "자연기반 리스크 오버레이", "Nature-based risk overlay")}
                    subtitle={selectedNatureRiskOverlay?.title ?? t(appLocale, "선택된 리스크 없음", "No risk overlay selected")}
                  />
                  {selectedNatureRiskOverlay ? (
                    <>
                      <ColumnChart
                        points={natureRiskPoints}
                        color={NEGATIVE}
                        valueFormatter={(value) => `${formatNumber(appLocale, value, 0)}`}
                        height={190}
                      />
                      <div className="benchmark-list">
                        {visibleNatureRiskOverlays.map((item) => (
                          <button
                            key={item.id}
                            className={`benchmark-item benchmark-item-detailed ${selectedNatureRiskOverlay.id === item.id ? "active" : ""}`}
                            onClick={() => handleInspectRiskOverlay(item.id)}
                          >
                            <strong>{item.title}</strong>
                            <span>{item.region}</span>
                            <p>{item.posture}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-plot compact">
                      {t(appLocale, "연결된 자연기반 리스크 데이터가 없습니다.", "No nature-based risk overlay is linked.")}
                    </div>
                  )}
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "리스크 해석 메모", "Risk interpretation")}
                    subtitle={t(
                      appLocale,
                      "자연기반 크레딧은 ETS 공식 가격의 대체재가 아니라 무결성 측면의 보조 판단 레이어입니다.",
                      "Nature-based credits are not substitutes for official ETS settlement; they are an integrity sidecar."
                    )}
                  />
                  <div className="bullet-grid">
                    {(selectedNatureRiskOverlay?.watchItems ?? []).map((item) => (
                      <div key={item} className="bullet-card">
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="overview-grid tertiary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "신뢰 원칙", "Trust principles")}
                    subtitle={t(
                      appLocale,
                      "왜 이 플랫폼을 믿을 수 있는지 보여주는 최소 원칙입니다.",
                      "Minimum principles that explain why the platform can be trusted."
                    )}
                  />
                  <div className="bullet-grid">
                    {localizedTrust.map((item) => (
                      <div key={item.id} className="bullet-card">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "구독형 가치", "Subscription value")}
                    subtitle={t(
                      appLocale,
                      "거래 중개 없이도 유지되는 서비스 가치입니다.",
                      "Product value that exists without trade intermediation."
                    )}
                  />
                  <div className="bullet-grid">
                    {localizedSubscription.map((item) => (
                      <div key={item.id} className="bullet-card">
                        <strong>{item.title}</strong>
                        <span>{item.audience}</span>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "기본 알림 템플릿", "Default alert templates")}
                    subtitle={t(
                      appLocale,
                      "초기 구독형 운영에 맞춘 기본 감시 세트입니다.",
                      "Starter monitoring set for a subscription-style workflow."
                    )}
                  />
                  <div className="alert-template-list">
                    {localizedAlerts.map((item) => (
                      <div key={item.id} className="alert-template">
                        <strong>{item.title}</strong>
                        <span>{getSeverityLabel(appLocale, item.severity)}</span>
                        <p>{item.trigger}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
            </div>
          ) : null}
        </main>
        <aside className="inspector-rail">
          <InspectorWorkbenchPanel
            locale={appLocale}
            spotlight={spotlight}
            deskRole={deskRole}
            marketLabel={getMarketDisplayName(appLocale, marketId)}
            officialCard={localizedSelectedCard}
            quote={selectedInteractiveQuote}
            officialPoints={selectedSeries}
            comparePoints={selectedTapeComparePoints}
            compareSeries={selectedTapeCompareSeries}
            compareStats={selectedTapeCompareStats}
            driverRows={selectedRoleDriverRows}
            catalystRows={selectedRoleCatalystRows}
            sourceRows={selectedSourceHealthRows}
            dossier={selectedDossier}
            registryRows={registryFreshnessRows}
            registryTrack={selectedRegistryTrack}
            riskOverlay={selectedNatureRiskOverlay}
            linkedRows={selectedLinkedScoreRows}
            selectedQuoteId={selectedInteractiveQuote?.id ?? ""}
            selectedRange={selectedQuoteRange}
            onSelectQuote={handleSelectQuote}
            onSelectRange={setSelectedQuoteRange}
            focus={selectedDesk.focus}
            check={selectedDesk.check}
            executionNote={selectedDesk.executionNote}
            priorityItems={selectedDesk.priorityItems}
            invalidationChecks={selectedDesk.invalidationChecks}
            decision={decisionView}
            onOpenSource={handleOpenExternal}
          />
        </aside>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="section-header">
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </div>
  );
}

function InteractionStage({
  locale,
  spotlight,
  onOpenSource,
  onGoSurface
}: {
  locale: AppLocale;
  spotlight: InteractionSpotlight | null;
  onOpenSource: (url: string) => void | Promise<void>;
  onGoSurface: (surface: Surface) => void;
}) {
  if (!spotlight) {
    return null;
  }

  return (
    <section
      key={spotlight.id}
      className={`panel panel-emphasis interaction-stage ${spotlight.tone}`}
    >
      <div className="interaction-stage-main">
        <div className="interaction-copy">
          <span className="eyebrow">{spotlight.eyebrow}</span>
          <h2>{spotlight.title}</h2>
          <p>{spotlight.summary}</p>
        </div>
        <div className="interaction-actions">
          {spotlight.ctaSurface ? (
            <button className="primary-button" onClick={() => onGoSurface(spotlight.ctaSurface!)}>
              {spotlight.ctaLabel}
            </button>
          ) : null}
          {spotlight.sourceUrl ? (
            <button className="secondary-button" onClick={() => void onOpenSource(spotlight.sourceUrl!)}>
              {spotlight.sourceLabel ?? t(locale, "출처 보기", "Open source")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="interaction-bullet-grid">
        {spotlight.bullets.map((item) => (
          <div key={item} className="interaction-bullet">
            <span />
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function InspectorPanel({
  locale,
  spotlight,
  officialCard,
  quote,
  officialPoints,
  comparePoints,
  compareSeries,
  driverRows,
  catalystRows,
  sourceRows,
  decision,
  onOpenSource
}: {
  locale: AppLocale;
  spotlight: InteractionSpotlight | null;
  officialCard: ConnectedSourceCard | undefined;
  quote: MarketLiveQuote | undefined;
  officialPoints: ChartPoint[];
  comparePoints: MultiLinePoint[];
  compareSeries: MultiLineSeries[];
  driverRows: DriverDecisionRow[];
  catalystRows: ReturnType<typeof localizeCatalystWindow>[];
  sourceRows: SourceHealthRow[];
  decision: DecisionAssistantResponse;
  onOpenSource: (url: string) => void | Promise<void>;
}) {
  if (!spotlight) {
    return null;
  }

  const entityId = getSpotlightEntityId(spotlight);
  const selectedDriver = driverRows.find((row) => row.id === entityId) ?? null;
  const selectedCatalyst = catalystRows.find((row) => row.id === entityId) ?? null;
  const selectedSource = sourceRows.find((row) => row.id === entityId) ?? null;
  const driverFocusPoints =
    selectedDriver
      ? [selectedDriver, ...driverRows.filter((row) => row.id !== selectedDriver.id)]
          .slice(0, 6)
          .map((row) => ({
            label: row.variable,
            value: Math.abs(row.contribution)
          }))
      : driverRows.slice(0, 6).map((row) => ({
          label: row.variable,
          value: Math.abs(row.contribution)
        }));
  const catalystPreview = selectedCatalyst
    ? [selectedCatalyst, ...catalystRows.filter((row) => row.id !== selectedCatalyst.id)].slice(0, 4)
    : catalystRows.slice(0, 4);
  const sourcePreview = selectedSource
    ? [selectedSource, ...sourceRows.filter((row) => row.id !== selectedSource.id)].slice(0, 4)
    : sourceRows.slice(0, 4);

  return (
    <div className="inspector-panel">
      <div className="inspector-head">
        <div>
          <span className="eyebrow">{spotlight.eyebrow}</span>
          <strong>{spotlight.title}</strong>
        </div>
        {spotlight.sourceUrl ? (
          <button className="subtle-button" onClick={() => void onOpenSource(spotlight.sourceUrl!)}>
            {spotlight.sourceLabel ?? t(locale, "출처 보기", "Open source")}
          </button>
        ) : null}
      </div>

      <div className="inspector-summary">
        <p>{spotlight.summary}</p>
      </div>

      {spotlight.kind === "market" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "공식 기준 차트", "Official anchor chart")}</strong>
            {officialPoints.length > 1 ? (
              <LineChart
                points={officialPoints}
                color={marketColor(officialCard?.marketId ?? "eu-ets")}
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                title={officialCard?.sourceName}
                subtitle={officialCard?.summary}
              />
            ) : (
              <div className="empty-plot compact">
                {t(locale, "공식 시계열이 아직 짧습니다.", "Official history is still short.")}
              </div>
            )}
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "현재 판단", "Current call")}</strong>
            <div className="inspector-stat-grid">
              <MetricPill label={t(locale, "스탠스", "Stance")} value={stanceLabel(locale, decision.stance)} />
              <MetricPill
                label={t(locale, "신뢰도", "Confidence")}
                value={`${formatNumber(locale, decision.confidence * 100, 0)}%`}
              />
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "tape" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "연결 테이프 비교", "Linked tape comparison")}</strong>
            {comparePoints.length > 1 ? (
              <MultiLineChart
                points={comparePoints}
                series={compareSeries}
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                valueFormatter={(value) => formatNumber(locale, value, 0)}
              />
            ) : quote?.series?.length ? (
              <LineChart
                points={getSeriesPoints(quote.series)}
                color="#2f7bf6"
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                title={quote.title}
                subtitle={quote.delayNote}
              />
            ) : (
              <div className="empty-plot compact">
                {t(locale, "비교용 차트가 아직 부족합니다.", "There is not enough chart history yet.")}
              </div>
            )}
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "왜 이 테이프를 보나", "Why this tape matters")}</strong>
            <ul className="inspector-list">
              {spotlight.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "driver" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "드라이버 영향도", "Driver contribution")}</strong>
            <ColumnChart
              points={driverFocusPoints}
              color={selectedDriver?.tone === "negative" ? NEGATIVE : marketColor(officialCard?.marketId ?? "eu-ets")}
              valueFormatter={(value) => formatNumber(locale, value, 2)}
              height={220}
            />
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "드릴다운 메모", "Drill-down notes")}</strong>
            <ul className="inspector-list">
              {spotlight.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "catalyst" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "다음 일정 흐름", "Next catalyst flow")}</strong>
            <div className="inspector-rail-list">
              {catalystPreview.map((row) => (
                <div key={row.id} className={`inspector-rail-item ${row.id === selectedCatalyst?.id ? "active" : ""}`}>
                  <small>{row.windowLabel}</small>
                  <strong>{row.title}</strong>
                  <span>{row.trigger}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "일정 해석", "Event interpretation")}</strong>
            <ul className="inspector-list">
              {spotlight.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "source" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "관련 소스 상태", "Related source health")}</strong>
            <div className="inspector-rail-list">
              {sourcePreview.map((row) => (
                <div key={row.id} className={`inspector-rail-item ${row.id === selectedSource?.id ? "active" : ""}`}>
                  <small>{row.role}</small>
                  <strong>{row.name}</strong>
                  <span>{`${row.status} · ${row.updated}`}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "소스 메모", "Source note")}</strong>
            <ul className="inspector-list">
              {spotlight.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "dossier" && dossier ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "생애주기 상태", "Lifecycle state")}</strong>
            <div className="inspector-rail-list">
              {dossier.stages.map((stage) => (
                <div key={stage.id} className="inspector-rail-item active">
                  <small>{lifecycleStatusLabel(locale, stage.status)}</small>
                  <strong>{stage.label}</strong>
                  <span>{stage.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "연결 문서", "Linked documents")}</strong>
            <div className="inspector-rail-list">
              {registryRows.map((row) => (
                <button
                  key={row.id}
                  className="inspector-rail-item button-like"
                  onClick={() => void onOpenSource(row.sourceUrl)}
                >
                  <small>{registryStatusLabel(locale, row.status)}</small>
                  <strong>{row.title}</strong>
                  <span>{`${formatDate(locale, row.publishedAt)} · ${row.note}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "risk" && riskOverlay ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "핵심 위험 축", "Primary risk axes")}</strong>
            <ColumnChart
              points={riskOverlay.components.map((item) => ({ label: item.label, value: item.value }))}
              color={NEGATIVE}
              valueFormatter={(value) => `${formatNumber(locale, value, 0)}`}
              height={220}
            />
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "운용 메모", "Operator notes")}</strong>
            <ul className="inspector-list">
              {[riskOverlay.posture, ...riskOverlay.watchItems].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getDeskRoleLabel(locale: AppLocale, deskRole: DeskRole) {
  if (deskRole === "compliance") {
    return t(locale, "컴플라이언스 관점", "Compliance lens");
  }
  if (deskRole === "risk") {
    return t(locale, "리스크 관점", "Risk lens");
  }
  return t(locale, "트레이딩 관점", "Trading lens");
}

function buildInspectorRoleLens({
  locale,
  deskRole,
  marketLabel,
  spotlight,
  focus,
  check,
  executionNote,
  priorityItems,
  invalidationChecks,
  selectedDriver,
  selectedCatalyst,
  selectedSource,
  selectedQuote,
  compareStats
}: {
  locale: AppLocale;
  deskRole: DeskRole;
  marketLabel: string;
  spotlight: InteractionSpotlight;
  focus: string;
  check: string;
  executionNote: string;
  priorityItems: string[];
  invalidationChecks: string[];
  selectedDriver: DriverDecisionRow | null;
  selectedCatalyst: ReturnType<typeof localizeCatalystWindow> | null;
  selectedSource: SourceHealthRow | null;
  selectedQuote: MarketLiveQuote | undefined;
  compareStats: TapeCompareStats;
}) {
  const generalFocus = [focus, check, ...priorityItems].slice(0, 4);
  const generalCaution = [executionNote, ...invalidationChecks].slice(0, 4);

  if (deskRole === "compliance") {
    return {
      summary: t(
        locale,
        "이 역할에서는 공식 가격, 이행 일정, 제도 공지가 프록시보다 우선입니다.",
        "In this role, the official tape, compliance calendar, and rule notices outrank proxies."
      ),
      focusItems: [
        spotlight.kind === "tape"
          ? t(
              locale,
              "이 테이프는 분위기 참고용입니다. 최종 기준은 공식 가격과 공식 공지입니다.",
              "Use this tape as context only. The final anchor is the official tape and formal notices."
            )
          : spotlight.kind === "driver" && selectedDriver
            ? t(
                locale,
                `${selectedDriver.variable}가 움직여도 이행 일정과 공식 가격이 같이 확인될 때만 강하게 해석합니다.`,
                `Even if ${selectedDriver.variable} moves, lean harder only when the compliance calendar and official tape confirm it.`
              )
            : spotlight.kind === "catalyst" && selectedCatalyst
              ? t(
                  locale,
                  `${selectedCatalyst.title}가 제출·이행 부담을 바꾸는 일정인지 먼저 확인합니다.`,
                  `Check first whether ${selectedCatalyst.title} changes reporting or surrender pressure.`
                )
              : spotlight.kind === "source" && selectedSource
                ? t(
                    locale,
                    `${selectedSource.name}는 공식성, 갱신 시각, 결측 여부를 먼저 확인해야 합니다.`,
                    `For ${selectedSource.name}, verify official status, update time, and any gaps before using it.`
                  )
                : t(
                    locale,
                    `${marketLabel}에서는 공식 가격, 이행 일정, 제도 공지가 우선입니다.`,
                    `For ${marketLabel}, the official tape, compliance calendar, and rule notices come first.`
                  ),
        ...generalFocus.slice(0, 3)
      ].slice(0, 4),
      cautionItems: [
        t(
          locale,
          "프록시만 강하게 움직이고 공식 가격이 조용하면 결론을 늦춥니다.",
          "If only the proxy moves while the official tape stays quiet, slow down the call."
        ),
        ...generalCaution.slice(0, 3)
      ].slice(0, 4)
    };
  }

  if (deskRole === "risk") {
    return {
      summary: t(
        locale,
        "이 역할에서는 맞는 방향보다 틀릴 때 얼마나 빨리 감지하는지가 더 중요합니다.",
        "In this role, spotting when the read is wrong matters more than chasing the perfect call."
      ),
      focusItems: [
        spotlight.kind === "tape"
          ? t(
              locale,
              `현재 괴리 ${formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)}와 방향 일치 ${formatPercentStat(locale, compareStats.directionMatchPct, 0)}를 같이 봅니다.`,
              `Read the current gap ${formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)} together with the direction match ${formatPercentStat(locale, compareStats.directionMatchPct, 0)}.`
            )
          : spotlight.kind === "driver" && selectedDriver
            ? t(
                locale,
                `${selectedDriver.variable} 하나만으로 결론내리지 말고 상위 드라이버와 데이터 신선도를 함께 봅니다.`,
                `Do not rely on ${selectedDriver.variable} alone. Read it with the other top drivers and data freshness.`
              )
            : spotlight.kind === "catalyst" && selectedCatalyst
              ? t(
                  locale,
                  `${selectedCatalyst.title} 전후는 이벤트 리스크 구간으로 보고 확신도를 낮춰 읽습니다.`,
                  `Treat the window around ${selectedCatalyst.title} as an event-risk period and lower conviction.`
                )
              : spotlight.kind === "source" && selectedSource
                ? t(
                    locale,
                    `${selectedSource.name}의 신선도와 상태가 약하면 판단 강도를 자동으로 낮춥니다.`,
                    `If ${selectedSource.name} is stale or limited, automatically lower conviction.`
                  )
                : t(
                    locale,
                    `${marketLabel}에서는 데이터 신선도, 경보, 괴리 확대를 먼저 봅니다.`,
                    `For ${marketLabel}, start with freshness, alerts, and widening gaps.`
                  ),
        ...generalFocus.slice(0, 3)
      ].slice(0, 4),
      cautionItems: [
        t(
          locale,
          "상관이 무너지거나 갭이 벌어지면 기존 포지션 해석을 바로 낮춥니다.",
          "If correlation breaks or the gap widens, reduce trust in the existing position read immediately."
        ),
        ...generalCaution.slice(0, 3)
      ].slice(0, 4)
    };
  }

  return {
    summary: t(
      locale,
      "이 역할에서는 반응 속도, 방향 일치, 거래량 확인이 핵심입니다.",
      "In this role, reaction speed, direction agreement, and volume confirmation matter most."
    ),
    focusItems: [
      spotlight.kind === "tape"
        ? selectedQuote
          ? t(
              locale,
              `${selectedQuote.symbol}가 공식 가격보다 먼저 움직이는지, 아니면 뒤늦게 따라오는지부터 확인합니다.`,
              `Start by checking whether ${selectedQuote.symbol} is leading the official tape or only following it.`
            )
          : t(
              locale,
              "선택한 테이프가 공식 가격보다 선행하는지 후행하는지 먼저 확인합니다.",
              "Start by checking whether the selected tape leads or lags the official tape."
            )
        : spotlight.kind === "driver" && selectedDriver
          ? t(
              locale,
              `${selectedDriver.variable}가 실제로 가격을 밀고 있는지, 아니면 설명만 되는지 거래량과 함께 봅니다.`,
              `Check whether ${selectedDriver.variable} is actually moving price or only explaining it after the fact, using volume as well.`
            )
          : spotlight.kind === "catalyst" && selectedCatalyst
            ? t(
                locale,
                `${selectedCatalyst.title} 전후에 공식 가격과 연결 테이프가 같은 방향으로 반응하는지 확인합니다.`,
                `Check whether the official tape and linked tape react in the same direction around ${selectedCatalyst.title}.`
              )
            : spotlight.kind === "source" && selectedSource
              ? t(
                  locale,
                  `${selectedSource.name}가 느리면 빠른 테이프로 선행 반응을 보고, 공식 업데이트로 확정합니다.`,
                  `If ${selectedSource.name} is slow, use the faster tape for early reaction and confirm with the official update.`
                )
              : t(
                  locale,
                  `${marketLabel}에서는 공식 가격과 연결 테이프의 반응 속도 차이를 먼저 봅니다.`,
                  `For ${marketLabel}, start with the speed difference between the official tape and the linked tape.`
                ),
      ...generalFocus.slice(0, 3)
    ].slice(0, 4),
    cautionItems: [
      t(
        locale,
        "선행처럼 보이는 테이프도 공식 가격이 따라오지 않으면 신호 강도를 낮춥니다.",
        "Even if a tape looks like a leader, lower signal strength if the official tape does not confirm it."
      ),
      ...generalCaution.slice(0, 3)
    ].slice(0, 4)
  };
}

function InspectorWorkbenchPanel({
  locale,
  spotlight,
  deskRole,
  marketLabel,
  officialCard,
  quote,
  officialPoints,
  comparePoints,
  compareSeries,
  compareStats,
  driverRows,
  catalystRows,
  sourceRows,
  dossier,
  registryRows,
  registryTrack,
  riskOverlay,
  linkedRows,
  selectedQuoteId,
  selectedRange,
  onSelectQuote,
  onSelectRange,
  focus,
  check,
  executionNote,
  priorityItems,
  invalidationChecks,
  decision,
  onOpenSource
}: {
  locale: AppLocale;
  spotlight: InteractionSpotlight | null;
  deskRole: DeskRole;
  marketLabel: string;
  officialCard: ConnectedSourceCard | undefined;
  quote: MarketLiveQuote | undefined;
  officialPoints: ChartPoint[];
  comparePoints: MultiLinePoint[];
  compareSeries: MultiLineSeries[];
  compareStats: TapeCompareStats;
  driverRows: DriverDecisionRow[];
  catalystRows: ReturnType<typeof localizeCatalystWindow>[];
  sourceRows: SourceHealthRow[];
  dossier: CreditLifecycleDossier | null;
  registryRows: RegistryFreshnessRow[];
  registryTrack: RegistryOperationsTrack | null;
  riskOverlay: NatureRiskOverlay | null;
  linkedRows: LinkedTapeScoreRow[];
  selectedQuoteId: string;
  selectedRange: QuoteRangePreset;
  onSelectQuote: (quoteId: string) => void;
  onSelectRange: (range: QuoteRangePreset) => void;
  focus: string;
  check: string;
  executionNote: string;
  priorityItems: string[];
  invalidationChecks: string[];
  decision: DecisionAssistantResponse;
  onOpenSource: (url: string) => void | Promise<void>;
}) {
  if (!spotlight) {
    return null;
  }

  const entityId = getSpotlightEntityId(spotlight);
  const selectedDriver = driverRows.find((row) => row.id === entityId) ?? null;
  const selectedCatalyst = catalystRows.find((row) => row.id === entityId) ?? null;
  const selectedSource = sourceRows.find((row) => row.id === entityId) ?? null;
  const driverFocusPoints =
    selectedDriver
      ? [selectedDriver, ...driverRows.filter((row) => row.id !== selectedDriver.id)]
          .slice(0, 6)
          .map((row) => ({
            label: row.variable,
            value: Math.abs(row.contribution)
          }))
      : driverRows.slice(0, 6).map((row) => ({
          label: row.variable,
          value: Math.abs(row.contribution)
        }));
  const catalystPreview = selectedCatalyst
    ? [selectedCatalyst, ...catalystRows.filter((row) => row.id !== selectedCatalyst.id)].slice(0, 4)
    : catalystRows.slice(0, 4);
  const sourcePreview = selectedSource
    ? [selectedSource, ...sourceRows.filter((row) => row.id !== selectedSource.id)].slice(0, 4)
    : sourceRows.slice(0, 4);
  const roleLens = buildInspectorRoleLens({
    locale,
    deskRole,
    marketLabel,
    spotlight,
    focus,
    check,
    executionNote,
    priorityItems,
    invalidationChecks,
    selectedDriver,
    selectedCatalyst,
    selectedSource,
    selectedQuote: quote,
    compareStats
  });
  const officialStatusLabel = officialCard
    ? getStatusLabel(locale, officialCard.status)
    : t(locale, "공식값 없음", "No official feed");
  const highlightStats = [
    {
      label: t(locale, "포지션", "Position"),
      value: stanceLabel(locale, decision.stance),
      detail: `${t(locale, "신뢰도", "Confidence")} ${formatNumber(locale, decision.confidence * 100, 0)}%`
    },
    {
      label: t(locale, "공식값", "Official"),
      value: officialCard ? formatDate(locale, officialCard.asOf) : t(locale, "미연결", "Offline"),
      detail: officialCard ? `${officialStatusLabel} · ${officialCard.sourceName}` : officialStatusLabel
    },
    {
      label: t(locale, "비교 기준", "Anchor"),
      value: quote ? quote.symbol : t(locale, "없음", "None"),
      detail: quote
        ? `${formatLiveQuotePrice(locale, quote)} · ${quote.delayNote}`
        : t(locale, "연결된 테이프가 없습니다.", "No linked tape is connected.")
    },
    {
      label: t(locale, "추적 상태", "Tracking"),
      value: formatPercentStat(locale, compareStats.directionMatchPct, 0),
      detail: `${t(locale, "괴리", "Gap")} ${formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)} · ${t(
        locale,
        "상관",
        "Corr"
      )} ${formatPlainStat(locale, compareStats.recentCorrelation, 2)}`
    }
  ];
  const whyNowItems = decision.supportingEvidence.slice(0, 3);
  const cautionReasonItems = decision.counterEvidence.slice(0, 3);
  const healthItems = decision.dataHealth.slice(0, 3);
  const checkpointItems = decision.checkpoints.slice(0, 3);
  const spotlightItems = spotlight.bullets.slice(0, 3);

  return (
    <div className="inspector-panel">
      <div className="inspector-head">
        <div>
          <span className="eyebrow">{spotlight.eyebrow}</span>
          <strong>{spotlight.title}</strong>
        </div>
        {spotlight.sourceUrl ? (
          <button className="subtle-button" onClick={() => void onOpenSource(spotlight.sourceUrl)}>
            {spotlight.sourceLabel ?? t(locale, "출처 보기", "Open source")}
          </button>
        ) : null}
      </div>

      <div className="inspector-key-grid">
        {highlightStats.map((item) => (
          <div key={item.label} className="inspector-key-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </div>

      <div className="inspector-summary compact">
        <strong>{t(locale, "지금 해석", "Now")}</strong>
        <p>{spotlight.summary}</p>
      </div>

      {(spotlight.kind === "market" || spotlight.kind === "tape") && (
        <div className="inspector-card">
          <strong>{t(locale, "빠른 조작", "Quick controls")}</strong>
          <div className="inspector-control-block">
            <span className="inspector-card-label">{t(locale, "비교 테이프", "Comparison tape")}</span>
            <div className="range-chip-group">
              {linkedRows.slice(0, 5).map((row) => (
                <button
                  key={row.quote.id}
                  type="button"
                  className={`range-chip ${row.quote.id === selectedQuoteId ? "active" : ""}`}
                  onClick={() => onSelectQuote(row.quote.id)}
                >
                  {row.quote.symbol}
                </button>
              ))}
            </div>
          </div>
          <div className="inspector-control-block">
            <span className="inspector-card-label">{t(locale, "기간", "Range")}</span>
            <div className="range-chip-group">
              {LIVE_QUOTE_RANGE_OPTIONS.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`range-chip ${range === selectedRange ? "active" : ""}`}
                  onClick={() => onSelectRange(range)}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {spotlight.kind === "market" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "공식 기준 차트", "Official anchor chart")}</strong>
            {officialPoints.length > 1 ? (
              <LineChart
                points={officialPoints}
                color={marketColor(officialCard?.marketId ?? "eu-ets")}
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                title={officialCard?.sourceName}
                subtitle={officialCard?.summary}
              />
            ) : (
              <div className="empty-plot compact">
                {t(locale, "공식 시계열이 아직 짧습니다.", "Official history is still short.")}
              </div>
            )}
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "왜 이 포지션인가", "Why this posture")}</strong>
            <div className="inspector-note-grid">
              {whyNowItems.map((item) => (
                <div key={item.title} className="inspector-note-row">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "tape" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "연결 테이프 비교", "Linked tape comparison")}</strong>
            {comparePoints.length > 1 ? (
              <MultiLineChart
                points={comparePoints}
                series={compareSeries}
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                valueFormatter={(value) => formatNumber(locale, value, 0)}
              />
            ) : quote?.series?.length ? (
              <LineChart
                points={getSeriesPoints(quote.series)}
                color="#2f7bf6"
                height={220}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                title={quote.title}
                subtitle={quote.delayNote}
              />
            ) : (
              <div className="empty-plot compact">
                {t(locale, "비교용 차트 히스토리가 아직 부족합니다.", "There is not enough chart history yet.")}
              </div>
            )}
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "테이프 상태", "Tape status")}</strong>
            <div className="inspector-stat-grid">
              <MetricPill
                label={t(locale, "현재가", "Current")}
                value={quote ? formatLiveQuotePrice(locale, quote) : t(locale, "데이터 없음", "No tape")}
              />
              <MetricPill
                label={t(locale, "변동", "Move")}
                value={quote ? formatLiveQuoteMove(locale, quote) : t(locale, "변동 데이터 없음", "No move data")}
              />
              <MetricPill
                label={t(locale, "방향 일치", "Direction match")}
                value={formatPercentStat(locale, compareStats.directionMatchPct, 0)}
              />
              <MetricPill
                label={t(locale, "겹친 구간", "Overlap")}
                value={formatOverlapWindow(locale, compareStats.overlapCount)}
              />
            </div>
            <div className="inspector-note-grid">
              {spotlightItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "driver" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "드라이버 영향도", "Driver contribution")}</strong>
            <ColumnChart
              points={driverFocusPoints}
              color={selectedDriver?.tone === "negative" ? NEGATIVE : marketColor(officialCard?.marketId ?? "eu-ets")}
              valueFormatter={(value) => formatNumber(locale, value, 2)}
              height={220}
            />
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "드라이버 메모", "Driver note")}</strong>
            <div className="inspector-note-grid">
              {spotlightItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "catalyst" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "다음 일정 흐름", "Next catalyst flow")}</strong>
            <div className="inspector-rail-list">
              {catalystPreview.map((row) => (
                <div key={row.id} className={`inspector-rail-item ${row.id === selectedCatalyst?.id ? "active" : ""}`}>
                  <small>{row.windowLabel}</small>
                  <strong>{row.title}</strong>
                  <span>{row.trigger}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "이벤트 메모", "Event note")}</strong>
            <div className="inspector-note-grid">
              {spotlightItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "source" ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "관련 소스 상태", "Related source health")}</strong>
            <div className="inspector-rail-list">
              {sourcePreview.map((row) => (
                <div key={row.id} className={`inspector-rail-item ${row.id === selectedSource?.id ? "active" : ""}`}>
                  <small>{row.role}</small>
                  <strong>{row.name}</strong>
                  <span>{`${row.status} · ${row.updated}`}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "소스 메모", "Source note")}</strong>
            <div className="inspector-note-grid">
              {spotlightItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {spotlight.kind === "registry" && registryTrack ? (
        <div className="inspector-stack">
          <div className="inspector-card">
            <strong>{t(locale, "운영 단계", "Workflow stages")}</strong>
            <div className="inspector-rail-list">
              {registryTrack.steps.map((step) => (
                <div key={step.id} className="inspector-rail-item active">
                  <small>{lifecycleStatusLabel(locale, step.status)}</small>
                  <strong>{step.label}</strong>
                  <span>{step.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="inspector-card">
            <strong>{t(locale, "운영 막힘", "Workflow blockers")}</strong>
            <ul className="inspector-list">
              {[...registryTrack.watchItems, ...registryTrack.blockers].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="inspector-card">
        <strong>{getDeskRoleLabel(locale, deskRole)}</strong>
        <div className="inspector-role-grid">
          <div>
            <span className="inspector-card-label">{t(locale, "먼저 볼 것", "Check first")}</span>
            <div className="inspector-note-grid">
              {roleLens.focusItems.slice(0, 3).map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="inspector-card-label">{t(locale, "판단 낮출 때", "Lower confidence when")}</span>
            <div className="inspector-note-grid">
              {roleLens.cautionItems.slice(0, 3).map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="operator-row">
          <strong>{t(locale, "운용 메모", "Desk note")}</strong>
          <span>{executionNote}</span>
        </div>
      </div>

      <div className="inspector-card">
        <strong>{t(locale, "판단 근거와 반대 근거", "Decision reasons and pushback")}</strong>
        <div className="inspector-status-strip">
          <div>
            <span className="inspector-card-label">{t(locale, "지지 근거", "Support")}</span>
            <div className="inspector-note-grid">
              {whyNowItems.map((item) => (
                <div key={item.title} className="inspector-note-row">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="inspector-card-label">{t(locale, "반대 근거", "Pushback")}</span>
            <div className="inspector-note-grid">
              {cautionReasonItems.map((item) => (
                <div key={item.title} className="inspector-note-row">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="inspector-card">
        <strong>{t(locale, "데이터 상태와 다음 확인", "Data state and next checks")}</strong>
        <div className="inspector-status-strip">
          <div>
            <span className="inspector-card-label">{t(locale, "데이터 상태", "Data health")}</span>
            <div className="inspector-note-grid">
              {healthItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="inspector-card-label">{t(locale, "다음 확인", "Next checks")}</span>
            <div className="inspector-note-grid">
              {checkpointItems.map((item) => (
                <div key={item} className="inspector-note-row compact">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketBoard({
  locale,
  rows,
  selectedMarketId,
  onSelectMarket
}: {
  locale: AppLocale;
  rows: MarketBoardRow[];
  selectedMarketId: MarketProfile["id"];
  onSelectMarket: (marketId: MarketProfile["id"]) => void;
}) {
  return (
    <div className="market-board">
      <div className="market-board-head">
        <span>{t(locale, "시장", "Market")}</span>
        <span>{t(locale, "공식 가격", "Official price")}</span>
        <span>{t(locale, "변동", "Move")}</span>
        <span>{t(locale, "거래량", "Volume")}</span>
        <span>{t(locale, "판단", "Bias")}</span>
        <span>{t(locale, "신뢰도", "Confidence")}</span>
        <span>{t(locale, "흐름", "Trend")}</span>
        <span>{t(locale, "업데이트", "Updated")}</span>
      </div>
      {rows.map((row) => (
        <button
          key={row.marketId}
          className={`market-board-row ${row.marketId === selectedMarketId ? "active" : ""}`}
          onClick={() => onSelectMarket(row.marketId)}
          style={{ "--market-accent": marketColor(row.marketId) } as CSSProperties}
        >
          <div className="market-main-cell">
            <strong>{row.name}</strong>
            <span>{row.sourceName}</span>
            <small>{row.status}</small>
          </div>
          <div className="market-cell">
            <strong>{row.priceLabel}</strong>
            <span>{t(locale, "가장 큰 이유", "Top driver")} {row.topDriver}</span>
          </div>
          <div className="market-cell">
            <strong>{row.changeLabel}</strong>
            <span>
              {t(locale, "점수", "Decision score")} {formatNumber(locale, row.score, 2)}
            </span>
          </div>
          <div className="market-cell">
            <strong>{row.volumeLabel}</strong>
            <span>{row.status}</span>
          </div>
          <div className="market-cell">
            <span className={`stance-badge ${stanceBadgeClass(row.stance)}`}>
              {stanceLabel(locale, row.stance)}
            </span>
          </div>
          <div className="market-cell">
            <strong>{formatNumber(locale, row.confidence * 100, 0)}%</strong>
            <span>{t(locale, "신뢰도", "Model confidence")}</span>
          </div>
          <div className="market-spark">
            <MiniTrendChart
              points={row.sparkline}
              color={marketColor(row.marketId)}
              locale={locale === "ko" ? "ko-KR" : "en-US"}
              valueFormatter={(value) => formatSeriesValue(locale, row.sparkline, value)}
              lowLabel={t(locale, "저점", "Low")}
              highLabel={t(locale, "고점", "High")}
              emptyTitle={t(locale, "공식 시계열 없음", "No official trend yet")}
              emptySubtitle={t(locale, "가격 흐름 대신 최신 공지 시각만 표시합니다.", "Showing the latest official update instead.")}
            />
          </div>
          <div className="market-cell market-time">
            <strong>{row.updatedLabel}</strong>
            <span>{t(locale, "갱신 시각", "Official timestamp")}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function LegacyOperationalMarketBoard({
  locale,
  rows,
  selectedMarketId,
  onSelectMarket
}: {
  locale: AppLocale;
  rows: MarketBoardRow[];
  selectedMarketId: MarketProfile["id"];
  onSelectMarket: (marketId: MarketProfile["id"]) => void;
}) {
  return (
    <div className="market-board">
      <div className="market-board-head operational">
        <span>{t(locale, "시장", "Market")}</span>
        <span>{t(locale, "공식 테이프", "Official tape")}</span>
        <span>{t(locale, "연결된 선물·프록시", "Linked futures / proxy")}</span>
        <span>{t(locale, "지금 확인할 것", "What to check now")}</span>
        <span>{t(locale, "판단", "Bias")}</span>
        <span>{t(locale, "신뢰도", "Confidence")}</span>
        <span>{t(locale, "업데이트", "Updated")}</span>
      </div>
      {rows.map((row) => (
        <button
          key={row.marketId}
          className={`market-board-row operational ${row.marketId === selectedMarketId ? "active" : ""}`}
          onClick={() => onSelectMarket(row.marketId)}
          style={{ "--market-accent": marketColor(row.marketId) } as CSSProperties}
        >
          <div className="market-main-cell">
            <strong>{row.name}</strong>
            <span>{row.sourceName}</span>
            <small>{row.status}</small>
          </div>

          <div className="market-cell">
            <strong>{row.priceLabel}</strong>
            <span>
              {t(locale, "변동", "Move")} {row.changeLabel}
            </span>
            <small>
              {t(locale, "거래량", "Volume")} {row.volumeLabel}
            </small>
          </div>

          <div className="market-quote-cell">
            <div className="market-cell">
              <strong>{row.benchmarkValue}</strong>
              <span>{row.benchmarkTitle}</span>
              <small>{row.benchmarkMove}</small>
              <small>{row.benchmarkDelay}</small>
            </div>
            <div className="market-spark compact">
              <MiniTrendChart
                points={row.benchmarkSparkline}
                color={marketColor(row.marketId)}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
                valueFormatter={(value) =>
                  formatSeriesValue(locale, row.benchmarkSparkline, value)
                }
                lowLabel={t(locale, "저점", "Low")}
                highLabel={t(locale, "고점", "High")}
                emptyTitle={t(locale, "연결 시계열 없음", "No linked trend yet")}
                emptySubtitle={row.benchmarkStatus}
              />
            </div>
          </div>

          <div className="market-cell">
            <strong>{row.operationsFocus}</strong>
            <span>{row.operationsCheck}</span>
            <small>
              {t(locale, "가장 큰 이유", "Top driver")} {row.topDriver}
            </small>
          </div>

          <div className="market-cell market-bias-cell">
            <span className={`stance-badge ${stanceBadgeClass(row.stance)}`}>
              {stanceLabel(locale, row.stance)}
            </span>
            <small>
              {t(locale, "점수", "Decision score")} {formatNumber(locale, row.score, 2)}
            </small>
          </div>

          <div className="market-cell">
            <strong>{formatNumber(locale, row.confidence * 100, 0)}%</strong>
            <span>{t(locale, "모델 신뢰도", "Model confidence")}</span>
          </div>

          <div className="market-cell market-time">
            <strong>{row.updatedLabel}</strong>
            <span>{t(locale, "공식 시각", "Official timestamp")}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function OperationalMarketBoard({
  locale,
  rows,
  selectedMarketId,
  onSelectMarket
}: {
  locale: AppLocale;
  rows: MarketBoardRow[];
  selectedMarketId: MarketProfile["id"];
  onSelectMarket: (marketId: MarketProfile["id"]) => void;
}) {
  return (
    <div className="market-board">
      <div className="market-board-head operational">
        <span>{t(locale, "시장", "Market")}</span>
        <span>{t(locale, "공식값", "Official")}</span>
        <span>{t(locale, "비교 기준", "Anchor")}</span>
        <span>{t(locale, "추적 상태", "Tracking")}</span>
        <span>{t(locale, "지금 볼 것", "Check now")}</span>
        <span>{t(locale, "포지션", "Position")}</span>
      </div>
      {rows.map((row) => (
        <button
          key={row.marketId}
          className={`market-board-row operational ${row.marketId === selectedMarketId ? "active" : ""}`}
          onClick={() => onSelectMarket(row.marketId)}
          style={{ "--market-accent": marketColor(row.marketId) } as CSSProperties}
        >
          <div className="market-main-cell">
            <strong>{row.name}</strong>
            <span>{row.sourceName}</span>
            <small>{`${row.status} · ${row.updatedLabel}`}</small>
          </div>

          <div className="market-cell market-cell-compact">
            <strong>{row.priceLabel}</strong>
            <div className="market-metric-line">
              <span>{`${t(locale, "변동", "Move")} ${row.changeLabel}`}</span>
              <span>{`${t(locale, "거래량", "Vol")} ${row.volumeLabel}`}</span>
            </div>
          </div>

          <div className="market-cell market-anchor-cell">
            <strong>{row.benchmarkTicker}</strong>
            <span>{row.benchmarkValue}</span>
            <small>{row.benchmarkRole}</small>
            <small>{`${row.benchmarkMove} · ${row.benchmarkDelay}`}</small>
          </div>

          <div className="market-cell market-tracking-cell">
            <div className="tracking-grid">
              <div className="tracking-chip">
                <small>{t(locale, "괴리", "Gap")}</small>
                <strong>{formatPercentStat(locale, row.trackingStats.normalizedGapPct, 1, true)}</strong>
              </div>
              <div className="tracking-chip">
                <small>{t(locale, "방향 일치", "Match")}</small>
                <strong>{formatPercentStat(locale, row.trackingStats.directionMatchPct, 0)}</strong>
              </div>
              <div className="tracking-chip">
                <small>{t(locale, "상관", "Corr")}</small>
                <strong>{formatPlainStat(locale, row.trackingStats.recentCorrelation, 2)}</strong>
              </div>
            </div>
          </div>

          <div className="market-cell market-check-cell">
            <strong>{row.operationsFocus}</strong>
            <div className="market-check-list">
              <span>{row.operationsCheck}</span>
              <span>{`${t(locale, "주요 요인", "Top driver")} · ${row.topDriver}`}</span>
            </div>
          </div>

          <div className="market-cell market-position-cell">
            <span className={`stance-badge ${stanceBadgeClass(row.stance)}`}>
              {stanceLabel(locale, row.stance)}
            </span>
            <strong>{formatNumber(locale, row.confidence * 100, 0)}%</strong>
            <small>{`${t(locale, "점수", "Score")} ${formatNumber(locale, row.score, 2)}`}</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function SelectedMarketDrilldownPanel({
  locale,
  marketId,
  deskRole,
  marketProfile,
  row,
  decision,
  selectedSeries,
  selectedQuote,
  compareStats,
  alertCount,
  catalystRows,
  sourceRows,
  onOpenDecision,
  onOpenSources
}: {
  locale: AppLocale;
  marketId: MarketProfile["id"];
  deskRole: DeskRole;
  marketProfile: MarketProfile;
  row: MarketBoardRow | null;
  decision: DecisionAssistantResponse;
  selectedSeries: ChartPoint[];
  selectedQuote: MarketLiveQuote | undefined;
  compareStats: TapeCompareStats;
  alertCount: number;
  catalystRows: ReturnType<typeof localizeCatalystWindow>[];
  sourceRows: SourceHealthRow[];
  onOpenDecision: () => void;
  onOpenSources: () => void;
}) {
  if (!row) {
    return null;
  }

  const marketSpecificRead =
    marketId === "eu-ets"
      ? t(
          locale,
          "공식 경매와 ICE EUA, 가스·전력 스프레드를 같이 보면서 정책 공급 변화가 선물 쪽에 먼저 반영되는지 확인합니다.",
          "Read official auctions with ICE EUA and gas-power spreads, and check whether supply policy changes are hitting futures first."
        )
      : marketId === "k-ets"
        ? t(
            locale,
            "KRX 공식 시세를 기준으로 두고, 이행 시즌과 거래량 회복 여부가 프록시보다 먼저 바뀌는지 확인합니다.",
            "Anchor to the KRX tape and check whether compliance-season flow and local volume recovery move before the proxy does."
          )
        : t(
            locale,
            "정책 공시와 시장 확대 신호를 먼저 읽고, 연결 프록시는 보조 설명용으로만 씁니다.",
            "Read policy bulletins and market-expansion signals first, and keep the linked proxy as secondary context."
          );
  const roleSpecificRead =
    deskRole === "compliance"
      ? t(
          locale,
          "이행 일정과 공식 공시가 가격보다 우선입니다.",
          "Compliance dates and official notices outrank short-term price moves."
        )
      : deskRole === "risk"
        ? t(
            locale,
            "데이터 신선도와 무효화 조건이 먼저 충족돼야 합니다.",
            "Data freshness and invalidation checks must clear before conviction rises."
          )
        : t(
            locale,
            "괴리와 거래량이 같이 움직일 때만 포지션 해석 강도를 높입니다.",
            "Only lean harder when gap and volume confirm in the same direction."
          );
  const freshSource = sourceRows[0];
  const nextCatalysts = catalystRows.slice(0, 3);

  return (
    <section className="market-drilldown">
      <div className="market-drilldown-head">
        <div className="market-drilldown-copy">
          <span className="eyebrow">{t(locale, "선택한 시장 작업면", "Selected market workspace")}</span>
          <strong>{row.name}</strong>
          <p>
            {t(
              locale,
              "시장 보드에서 고른 시장을 중앙 작업면에 고정했습니다. 아래 숫자와 체크리스트만 따라가면 됩니다.",
              "The selected market is now pinned to the central workspace. Work from the numbers and checks below."
            )}
          </p>
        </div>
        <div className="market-drilldown-actions">
          <button className="primary-button" onClick={onOpenDecision}>
            {t(locale, "판단 화면 열기", "Open decision")}
          </button>
          <button className="secondary-button" onClick={onOpenSources}>
            {t(locale, "관련 출처 보기", "Review sources")}
          </button>
        </div>
      </div>

      <div className="market-drilldown-metrics">
        <MetricPill label={t(locale, "공식값", "Official")} value={row.priceLabel} />
        <MetricPill
          label={t(locale, "주요 비교 기준", "Primary anchor")}
          value={`${row.benchmarkTicker} · ${row.benchmarkValue}`}
        />
        <MetricPill
          label={t(locale, "괴리", "Gap")}
          value={formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)}
        />
        <MetricPill
          label={t(locale, "방향 일치", "Direction match")}
          value={formatPercentStat(locale, compareStats.directionMatchPct, 0)}
        />
        <MetricPill
          label={t(locale, "상관", "Correlation")}
          value={formatPlainStat(locale, compareStats.recentCorrelation, 2)}
        />
        <MetricPill
          label={t(locale, "열린 알림", "Open alerts")}
          value={formatNumber(locale, alertCount, 0)}
        />
      </div>

      <div className="market-drilldown-grid">
        <div className="market-drilldown-chart">
          {selectedSeries.length > 1 ? (
            <LineChart
              points={selectedSeries}
              color={marketColor(row.marketId)}
              locale={locale === "ko" ? "ko-KR" : "en-US"}
              valueFormatter={(value) => formatNumber(locale, value, value >= 10 ? 2 : 3)}
              title={t(locale, "공식 추세", "Official trend")}
              subtitle={`${row.sourceName} · ${row.updatedLabel}`}
            />
          ) : (
            <div className="empty-plot compact">
              {t(
                locale,
                "이 시장은 아직 공식 연속 시계열이 약합니다. 아래 비교 차트와 일정 표를 같이 보세요.",
                "Official continuous history is limited here. Use the live comparison and event table below together."
              )}
            </div>
          )}
        </div>

        <div className="market-drilldown-stack">
          <div className="market-drilldown-card">
            <strong>{t(locale, "지금 먼저 볼 것", "What matters now")}</strong>
            <p>{row.operationsFocus}</p>
            <small>{row.operationsCheck}</small>
          </div>
          <div className="market-drilldown-card">
            <strong>{t(locale, "현재 판단 근거", "Why the read leans here")}</strong>
            <ul>
              {decision.supportingEvidence.slice(0, 3).map((item) => (
                <li key={item.title}>{item.title}</li>
              ))}
            </ul>
          </div>
          <div className="market-drilldown-card caution">
            <strong>{t(locale, "판단이 약해지는 조건", "What weakens the call")}</strong>
            <ul>
              {decision.counterEvidence.slice(0, 3).map((item) => (
                <li key={item.title}>{item.title}</li>
              ))}
            </ul>
          </div>
          <div className="market-drilldown-card">
            <strong>{t(locale, "현재 연결된 비교 테이프", "Current linked tape")}</strong>
            <p>
              {selectedQuote
                ? `${selectedQuote.title} · ${formatLiveQuotePrice(locale, selectedQuote)}`
                : t(locale, "연결된 비교 테이프 없음", "No linked tape")}
            </p>
            <small>{selectedQuote?.delayNote ?? row.benchmarkDelay}</small>
          </div>
        </div>
      </div>

      <div className="market-playbook-grid">
        <div className="market-playbook-card">
          <strong>{t(locale, "시장 구조", "Market structure")}</strong>
          <p>{marketProfile.stageNote}</p>
          <small>{marketProfile.scopeNote}</small>
        </div>
        <div className="market-playbook-card">
          <strong>{t(locale, "운용 해석", "Desk read")}</strong>
          <p>{marketSpecificRead}</p>
          <small>{roleSpecificRead}</small>
        </div>
        <div className="market-playbook-card">
          <strong>{t(locale, "이번에 다시 볼 일정", "Dates to re-check")}</strong>
          <ul>
            {nextCatalysts.map((item) => (
              <li key={item.id}>{`${item.title} · ${item.date}`}</li>
            ))}
          </ul>
        </div>
        <div className="market-playbook-card">
          <strong>{t(locale, "데이터 경계", "Truth boundary")}</strong>
          <p>{marketProfile.sourceNote}</p>
          <small>
            {freshSource
              ? `${freshSource.name} · ${freshSource.freshness}`
              : t(locale, "표시할 데이터 상태 없음", "No source health status available")}
          </small>
        </div>
      </div>
    </section>
  );
}

function LinkedTapePanel({
  locale,
  quotes,
  selectedQuoteId,
  onSelectQuote
}: {
  locale: AppLocale;
  quotes: MarketLiveQuote[];
  selectedQuoteId: string;
  onSelectQuote: (quoteId: string) => void;
}) {
  if (quotes.length === 0) {
    return (
      <div className="empty-plot">
        <strong>{t(locale, "연결된 테이프 없음", "No linked tape")}</strong>
        <p>
          {t(
            locale,
            "무료로 확인 가능한 선물·프록시 테이프가 아직 연결되지 않았습니다.",
            "No free futures or proxy tape is currently connected."
          )}
        </p>
      </div>
    );
  }

  return (
      <div className="linked-tape-list">
      {quotes.map((quote) => (
        <button
          key={quote.id}
          className={`linked-tape-row ${quote.id === selectedQuoteId ? "active" : ""}`}
          onClick={() => onSelectQuote(quote.id)}
        >
          <div className="linked-tape-main">
            <strong>{quote.title}</strong>
            <span>{quote.role}</span>
            <small>{quote.note}</small>
          </div>
          <div className="linked-tape-metric">
            <strong>{formatLiveQuotePrice(locale, quote)}</strong>
            <span>{formatLiveQuoteMove(locale, quote)}</span>
          </div>
          <div className="linked-tape-spark">
            {getSeriesPoints(quote.series).length > 1 ? (
              <Sparkline points={getSeriesPoints(quote.series)} color="#2f7bf6" fill />
            ) : (
              <div className="snapshot-fallback">{getLiveQuoteStatusLabel(locale, quote)}</div>
            )}
          </div>
          <div className="linked-tape-meta">
            <strong>{quote.symbol}</strong>
            <span>{quote.exchange || quote.provider}</span>
            <small>{quote.delayNote}</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function DeskCommandPanel({
  locale,
  marketLabel,
  officialCard,
  primaryQuote,
  compareStats,
  decision,
  topDriver,
  alertCount
}: {
  locale: AppLocale;
  marketLabel: string;
  officialCard: ConnectedSourceCard | undefined;
  primaryQuote: MarketLiveQuote | undefined;
  compareStats: TapeCompareStats;
  decision: DecisionAssistantResponse;
  topDriver: string;
  alertCount: number;
}) {
  const priceLabel =
    findMetric(officialCard, ["auction price"])?.value ??
    findMetric(officialCard, ["close"])?.value ??
    t(locale, "공식 가격 없음", "No official price");
  const moveLabel =
    findMetric(officialCard, ["price change"])?.value ??
    findMetric(officialCard, ["day change"])?.value ??
    t(locale, "변동 없음", "No move data");
  const volumeLabel =
    findMetric(officialCard, ["volume"])?.value ?? t(locale, "거래량 없음", "No volume data");

  return (
    <section className="desk-command">
      <div className="desk-command-main">
        <span className="desk-kicker">{t(locale, "현재 포지션 데스크", "Current position desk")}</span>
        <h2>{marketLabel}</h2>
        <p>{decision.summary}</p>
        <div className="desk-price-row">
          <strong>{priceLabel}</strong>
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
        </div>
        <div className="desk-meta-row">
          <span>{t(locale, "공식 변동", "Official move")} {moveLabel}</span>
          <span>{t(locale, "거래량", "Volume")} {volumeLabel}</span>
          <span>{t(locale, "갱신", "Updated")} {formatDate(locale, officialCard?.asOf)}</span>
        </div>
      </div>

      <div className="desk-command-grid">
        <div className="desk-stat">
          <span>{t(locale, "주요 헤지 앵커", "Primary hedge anchor")}</span>
          <strong>{formatLiveQuotePrice(locale, primaryQuote)}</strong>
          <small>{primaryQuote?.title ?? t(locale, "연결 없음", "Not linked")}</small>
        </div>
        <div className="desk-stat">
          <span>{t(locale, "공식 대비 괴리", "Gap vs official")}</span>
          <strong>{formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)}</strong>
          <small>{t(locale, "최근 5영업일 기준", "Recent 5-session basis")}</small>
        </div>
        <div className="desk-stat">
          <span>{t(locale, "방향 일치", "Direction match")}</span>
          <strong>{formatPercentStat(locale, compareStats.directionMatchPct, 0)}</strong>
          <small>{t(locale, "공식 시세와 같은 방향", "Moving with the official tape")}</small>
        </div>
        <div className="desk-stat">
          <span>{t(locale, "상관", "Correlation")}</span>
          <strong>{formatPlainStat(locale, compareStats.recentCorrelation, 2)}</strong>
          <small>{t(locale, "최근 중첩 구간 기준", "On overlapping history")}</small>
        </div>
        <div className="desk-stat">
          <span>{t(locale, "가장 큰 요인", "Top driver")}</span>
          <strong>{topDriver}</strong>
          <small>{t(locale, "지금 판단을 가장 크게 밀고 있음", "Largest current influence")}</small>
        </div>
        <div className="desk-stat">
          <span>{t(locale, "주의 알림", "Open alerts")}</span>
          <strong>{formatNumber(locale, alertCount, 0)}</strong>
          <small>{t(locale, "확인 전 포지션 확대 금지", "Do not size up before checking")}</small>
        </div>
      </div>
    </section>
  );
}

function RiskGatePanel({
  locale,
  decision,
  focus,
  check,
  priorityItems,
  invalidationChecks
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  focus: string;
  check: string;
  priorityItems: string[];
  invalidationChecks: string[];
}) {
  return (
    <section className="risk-gate-panel">
      <div className="gate-block">
        <strong>{t(locale, "지금 먼저 볼 것", "What to look at first")}</strong>
        <p>{focus}</p>
        <small>{check}</small>
      </div>
      <div className="gate-columns">
        <div className="gate-list">
          <strong>{t(locale, "포지션 전에 확인", "Before changing risk")}</strong>
          <ul>
            {[...priorityItems, ...decision.actions.slice(0, 2)].slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="gate-list caution">
          <strong>{t(locale, "이 판단이 깨지는 조건", "What breaks the read")}</strong>
          <ul>
            {[...invalidationChecks, ...decision.counterEvidence.map((item) => item.title)].slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function DriverMonitorTable({
  locale,
  rows,
  onOpenSource,
  onInspect
}: {
  locale: AppLocale;
  rows: DriverDecisionRow[];
  onOpenSource: (url: string) => void;
  onInspect: (rowId: string) => void;
}) {
  return (
    <div className="decision-table">
      <div className="decision-table-head driver-table">
        <span>{t(locale, "요인", "Driver")}</span>
        <span>{t(locale, "구분", "Family")}</span>
        <span>{t(locale, "현재 해석", "Read")}</span>
        <span>{t(locale, "점수", "Score")}</span>
        <span>{t(locale, "중요도", "Weight")}</span>
        <span>{t(locale, "왜 중요한가", "Why it matters")}</span>
        <span>{t(locale, "대표 출처", "Source")}</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="decision-table-row driver-table">
          <div className="table-main">
            <button className="table-inspect-button" onClick={() => onInspect(row.id)}>
              <strong>{row.variable}</strong>
              <small>{t(locale, "상세 보기", "Open detail")}</small>
            </button>
          </div>
          <span>{row.family}</span>
          <span className={`signal-pill ${row.tone}`}>{row.read}</span>
          <strong className={`signal-value ${row.tone}`}>
            {row.contribution > 0 ? "+" : ""}
            {formatNumber(locale, row.contribution, 2)}
          </strong>
          <span>{row.importance}</span>
          <p>{row.note}</p>
          <button
            className="source-link-button"
            onClick={() => (row.sourceUrl ? onOpenSource(row.sourceUrl) : undefined)}
            disabled={!row.sourceUrl}
          >
            {row.sourceLabel}
          </button>
        </div>
      ))}
    </div>
  );
}

function CatalystWatchTable({
  locale,
  rows,
  onOpenSource,
  onInspect
}: {
  locale: AppLocale;
  rows: ReturnType<typeof localizeCatalystWindow>[];
  onOpenSource: (url: string) => void;
  onInspect: (rowId: string) => void;
}) {
  return (
    <div className="decision-table">
      <div className="decision-table-head catalyst-table">
        <span>{t(locale, "시점", "Window")}</span>
        <span>{t(locale, "이벤트", "Event")}</span>
        <span>{t(locale, "왜 중요한가", "Decision use")}</span>
        <span>{t(locale, "출처", "Source")}</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="decision-table-row catalyst-table">
          <button className="table-inspect-button compact" onClick={() => onInspect(row.id)}>
            <strong>{row.windowLabel}</strong>
            <small>{t(locale, "상세 보기", "Open detail")}</small>
          </button>
          <div className="table-main">
            <strong>{row.title}</strong>
            <span>{row.trigger}</span>
          </div>
          <p>{row.whyItMatters}</p>
          <button className="source-link-button" onClick={() => onOpenSource(row.source.url)}>
            {row.source.label}
          </button>
        </div>
      ))}
    </div>
  );
}

function SourceHealthTable({
  locale,
  rows,
  onInspect
}: {
  locale: AppLocale;
  rows: SourceHealthRow[];
  onInspect: (rowId: string) => void;
}) {
  return (
    <div className="decision-table">
      <div className="decision-table-head source-health-table">
        <span>{t(locale, "소스", "Source")}</span>
        <span>{t(locale, "역할", "Role")}</span>
        <span>{t(locale, "상태", "Status")}</span>
        <span>{t(locale, "갱신", "Updated")}</span>
        <span>{t(locale, "신선도", "Freshness")}</span>
        <span>{t(locale, "메모", "Note")}</span>
      </div>
      {rows.map((row) => (
        <div key={row.id} className="decision-table-row source-health-table">
          <div className="table-main">
            <button className="table-inspect-button" onClick={() => onInspect(row.id)}>
              <strong>{row.name}</strong>
              <small>{t(locale, "상세 보기", "Open detail")}</small>
            </button>
            <span>{row.kind}</span>
          </div>
          <span>{row.role}</span>
          <span>{row.status}</span>
          <span>{row.updated}</span>
          <span>{row.freshness}</span>
          <p>{row.note}</p>
        </div>
      ))}
    </div>
  );
}

function FactorDecompositionPanel({
  locale,
  rows
}: {
  locale: AppLocale;
  rows: DriverDecisionRow[];
}) {
  const points = buildDriverFamilyMixPoints(locale, rows);

  return (
    <div className="factor-decomposition-panel">
      <div className="metric-cluster">
        {points.slice(0, 3).map((point) => (
          <MetricPill
            key={point.label}
            label={point.label}
            value={`${formatNumber(locale, point.value, 0)}%`}
          />
        ))}
      </div>
      {points.length > 0 ? (
        <ColumnChart
          points={points}
          color="#2f7bf6"
          valueFormatter={(value) => `${formatNumber(locale, value, 0)}%`}
          height={188}
        />
      ) : (
        <div className="empty-plot compact">
          {t(locale, "변수 분해 데이터가 아직 부족합니다.", "Factor decomposition data is not ready yet.")}
        </div>
      )}
      <p className="panel-note">
        {t(
          locale,
          "현재 시장에서 큰 영향을 주는 변수군을 100 기준 비중으로 압축한 보드입니다. 실시간 가격 자체가 아니라, 현재 모델이 어떤 변수 묶음을 더 크게 읽는지 보여줍니다.",
          "This compresses the current driver mix into a 100-based split. It is not a live price forecast; it shows which driver families the model is leaning on most."
        )}
      </p>
    </div>
  );
}

function QuantPlaybookPanel({
  locale,
  indicators
}: {
  locale: AppLocale;
  indicators: ReturnType<typeof localizeQuantIndicator>[];
}) {
  return (
    <div className="quant-playbook-grid">
      {indicators.map((indicator) => (
        <div key={indicator.id} className="quant-playbook-card">
          <div className="quant-playbook-head">
            <strong>{indicator.name}</strong>
            <span>{indicator.family}</span>
          </div>
          <p>{indicator.whyItMatters}</p>
          <small>
            {t(locale, "필요 데이터", "Data needed")}: {indicator.requiredColumns.join(", ")}
          </small>
        </div>
      ))}
    </div>
  );
}

function ForecastConfidenceBand({
  locale,
  result
}: {
  locale: AppLocale;
  result: WalkForwardResult | null;
}) {
  if (!result) {
    return (
      <div className="empty-plot compact">
        {t(locale, "워크포워드 결과가 아직 없습니다.", "No walk-forward result yet.")}
      </div>
    );
  }

  const { latestClose, nextPrediction, lowerBand, upperBand } = result.summary;
  const minValue = Math.min(latestClose, lowerBand);
  const maxValue = Math.max(latestClose, upperBand);
  const span = maxValue - minValue || 1;
  const latestPosition = ((latestClose - minValue) / span) * 100;
  const lowerPosition = ((lowerBand - minValue) / span) * 100;
  const upperPosition = ((upperBand - minValue) / span) * 100;
  const predictionPosition = ((nextPrediction - minValue) / span) * 100;

  return (
    <div className="forecast-band-card">
      <div className="forecast-band-head">
        <strong>{t(locale, "다음 예측 범위", "Next forecast band")}</strong>
        <span>{t(locale, "RMSE 기반 연구용 밴드", "RMSE-based research band")}</span>
      </div>
      <div className="metric-cluster">
        <MetricPill
          label={t(locale, "현재 종가", "Latest close")}
          value={formatNumber(locale, latestClose, 2)}
        />
        <MetricPill
          label={t(locale, "다음 예측", "Next prediction")}
          value={formatNumber(locale, nextPrediction, 2)}
        />
        <MetricPill
          label={t(locale, "하단 밴드", "Lower band")}
          value={formatNumber(locale, lowerBand, 2)}
        />
        <MetricPill
          label={t(locale, "상단 밴드", "Upper band")}
          value={formatNumber(locale, upperBand, 2)}
        />
      </div>
      <div className="forecast-band-track">
        <div
          className="forecast-band-range"
          style={{
            left: `${lowerPosition}%`,
            width: `${Math.max(upperPosition - lowerPosition, 2)}%`
          }}
        />
        <div className="forecast-band-marker latest" style={{ left: `${latestPosition}%` }} />
        <div className="forecast-band-marker prediction" style={{ left: `${predictionPosition}%` }} />
      </div>
      <div className="forecast-band-labels">
        <span>{t(locale, "현재", "Latest")}</span>
        <span>{t(locale, "예측 밴드", "Forecast band")}</span>
        <span>{t(locale, "예측", "Prediction")}</span>
      </div>
      <p className="panel-note">
        {t(
          locale,
          "PDF 기획서의 신뢰구간 UX 원칙에 맞춰 점 추정 대신 범위로 보여주는 연구용 예측 보드입니다. 실거래 가격 목표가 아니라 오차 범위를 함께 읽게 만드는 용도입니다.",
          "This follows the PDF's confidence-band UX principle. It shows a research range around the point estimate, not a tradable price target."
        )}
      </p>
    </div>
  );
}

function InstitutionDeskSurface({
  locale,
  marketBoardRow,
  marketId,
  deskRole,
  marketProfile,
  marketLabel,
  officialCard,
  selectedSeries,
  selectedVolumeSeries,
  primaryQuote,
  selectedInteractiveQuote,
  comparePoints,
  compareSeries,
  compareStats,
  decision,
  topDriver,
  alertCount,
  linkedRows,
  selectedQuoteId,
  onSelectQuote,
  selectedQuoteRange,
  onSelectQuoteRange,
  interactiveQuoteLoading,
  interactiveQuoteError,
  focus,
  check,
  priorityItems,
  invalidationChecks,
  driverRows,
  quantIndicators,
  catalystRows,
  sourceRows,
  feedItems,
  onOpenDecision,
  onOpenSources,
  onOpenSource,
  onInspectDriver,
  onInspectCatalyst,
  onInspectSource
}: {
  locale: AppLocale;
  marketBoardRow: MarketBoardRow | null;
  marketId: MarketProfile["id"];
  deskRole: DeskRole;
  marketProfile: MarketProfile;
  marketLabel: string;
  officialCard: ConnectedSourceCard | undefined;
  selectedSeries: ChartPoint[];
  selectedVolumeSeries: ChartPoint[];
  primaryQuote: MarketLiveQuote | undefined;
  selectedInteractiveQuote: MarketLiveQuote | undefined;
  comparePoints: MultiLinePoint[];
  compareSeries: MultiLineSeries[];
  compareStats: TapeCompareStats;
  decision: DecisionAssistantResponse;
  topDriver: string;
  alertCount: number;
  linkedRows: LinkedTapeScoreRow[];
  selectedQuoteId: string;
  onSelectQuote: (quoteId: string) => void;
  selectedQuoteRange: QuoteRangePreset;
  onSelectQuoteRange: (range: QuoteRangePreset) => void;
  interactiveQuoteLoading: boolean;
  interactiveQuoteError: string | null;
  focus: string;
  check: string;
  priorityItems: string[];
  invalidationChecks: string[];
  driverRows: DriverDecisionRow[];
  quantIndicators: ReturnType<typeof localizeQuantIndicator>[];
  catalystRows: ReturnType<typeof localizeCatalystWindow>[];
  sourceRows: SourceHealthRow[];
  feedItems: FeedItem[];
  onOpenDecision: () => void;
  onOpenSources: () => void;
  onOpenSource: (url: string) => void;
  onInspectDriver: (rowId: string) => void;
  onInspectCatalyst: (rowId: string) => void;
  onInspectSource: (rowId: string) => void;
}) {
  return (
    <>
      <section className="panel panel-emphasis">
        <SelectedMarketDrilldownPanel
          locale={locale}
          marketId={marketId}
          deskRole={deskRole}
          marketProfile={marketProfile}
          row={marketBoardRow}
          decision={decision}
          selectedSeries={selectedSeries}
          selectedQuote={selectedInteractiveQuote}
          compareStats={compareStats}
          alertCount={alertCount}
          catalystRows={catalystRows}
          sourceRows={sourceRows}
          onOpenDecision={onOpenDecision}
          onOpenSources={onOpenSources}
        />
      </section>

      <section className="overview-grid desk-core-grid">
        <div className="panel panel-emphasis">
          <DeskCommandPanel
            locale={locale}
            marketLabel={marketLabel}
            officialCard={officialCard}
            primaryQuote={primaryQuote}
            compareStats={compareStats}
            decision={decision}
            topDriver={topDriver}
            alertCount={alertCount}
          />
        </div>
        <div className="panel panel-emphasis">
          <SectionHeader
            title={t(locale, "실시간 비교 차트", "Live comparison chart")}
            subtitle={t(
              locale,
              "선택한 비교 기준을 앱 안에서 바로 보고, 공식값과 같은 방향인지 바로 확인합니다.",
              "Review the selected comparison tape inside the app and check whether it is moving with the official tape."
            )}
          />
          {selectedInteractiveQuote ? (
            <LiveTapeWorkbench
              locale={locale}
              officialCard={officialCard}
              quote={selectedInteractiveQuote}
              quotePoints={getSeriesPoints(selectedInteractiveQuote.series)}
              comparePoints={comparePoints}
              compareStats={compareStats}
              compareSeries={compareSeries}
              selectedRange={selectedQuoteRange}
              onSelectRange={onSelectQuoteRange}
              loading={interactiveQuoteLoading}
              error={interactiveQuoteError}
              onOpenSource={onOpenSource}
            />
          ) : (
            <div className="empty-plot">
              {t(locale, "비교할 테이프가 아직 연결되지 않았습니다.", "No comparison tape is connected yet.")}
            </div>
          )}
        </div>
      </section>

      <section className="overview-grid desk-core-grid">
        <div className="panel">
          <SectionHeader
            title={t(locale, "연결 테이프 점수판", "Linked tape scoreboard")}
            subtitle={t(
              locale,
              "지금 공식값을 가장 잘 따라가는 비교 기준을 먼저 고릅니다.",
              "Pick the comparison tape that is tracking the official market best right now."
            )}
          />
          <LinkedTapeScoreboard
            locale={locale}
            rows={linkedRows}
            selectedQuoteId={selectedQuoteId}
            onSelectQuote={onSelectQuote}
          />
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "리스크 게이트", "Risk gates")}
            subtitle={t(
              locale,
              "포지션을 더하기 전에 무엇을 확인해야 하는지와, 이 판단이 깨지는 조건을 분리해서 봅니다.",
              "Separate what must be confirmed before sizing and what would invalidate the read."
            )}
          />
          <RiskGatePanel
            locale={locale}
            decision={decision}
            focus={focus}
            check={check}
            priorityItems={priorityItems}
            invalidationChecks={invalidationChecks}
          />
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          title={t(locale, "드라이버 모니터", "Driver monitor")}
          subtitle={t(
            locale,
            "가격을 실제로 밀고 있는 요인, 방향, 점수, 근거 출처를 한 표에서 봅니다.",
            "Read the active drivers, direction, score, and source evidence in one table."
          )}
        />
        <DriverMonitorTable
          locale={locale}
          rows={driverRows}
          onOpenSource={onOpenSource}
          onInspect={onInspectDriver}
        />
      </section>

      <section className="overview-grid secondary">
        <div className="panel">
          <SectionHeader
            title={t(locale, "변수 분해 보드", "Factor decomposition")}
            subtitle={t(
              locale,
              "기획 PDF의 가격 결정 변수 구조를 현재 시장 기준으로 한 번 더 압축해서 봅니다.",
              "Review the pricing driver mix from the planning PDF as one compressed market read."
            )}
          />
          <FactorDecompositionPanel locale={locale} rows={driverRows} />
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "퀀트 지표 플레이북", "Quant playbook")}
            subtitle={t(
              locale,
              "실무자가 지금 어떤 지표를 먼저 봐야 하는지, 필요한 데이터와 함께 바로 정리합니다.",
              "See which quant indicators matter first for this market and what data each one needs."
            )}
          />
          <QuantPlaybookPanel locale={locale} indicators={quantIndicators} />
        </div>
      </section>

      <section className="overview-grid secondary">
        <div className="panel">
          <SectionHeader
            title={t(locale, "이벤트 캘린더", "Catalyst calendar")}
            subtitle={t(
              locale,
              "정책, 경매, 공시 일정 중 실제 판단에 쓰이는 것만 남깁니다.",
              "Keep only the policy, auction, and disclosure dates that affect the decision."
            )}
          />
          <CatalystWatchTable
            locale={locale}
            rows={catalystRows}
            onOpenSource={onOpenSource}
            onInspect={onInspectCatalyst}
          />
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "데이터 신선도", "Source freshness")}
            subtitle={t(
              locale,
              "공식 기준값과 연결 테이프가 얼마나 최신인지 따로 확인합니다.",
              "Check how fresh the official anchor and linked tapes are."
            )}
          />
          <SourceHealthTable locale={locale} rows={sourceRows} onInspect={onInspectSource} />
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          title={t(locale, "짧은 시장 메모", "Short market notes")}
          subtitle={t(
            locale,
            "길게 읽지 않고도 오늘 무엇이 중요한지 바로 훑는 용도입니다.",
            "A short read on what matters today without digging through long commentary."
          )}
        />
        <div className="feed-list compact">
          {feedItems.map((item) => (
            <button
              key={item.id}
              className={`feed-item ${item.tone}`}
              onClick={() => (item.link ? void onOpenSource(item.link) : undefined)}
            >
              <span>{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function InstitutionDecisionSurface({
  locale,
  decision,
  assistantLoading,
  assistantError,
  hasApiKey,
  question,
  onQuestionChange,
  onRunAssistant,
  driverRows,
  catalystRows,
  sourceRows,
  dossier,
  registryRows,
  registryTrack,
  riskOverlay,
  focus,
  check,
  priorityItems,
  invalidationChecks,
  onOpenSource,
  onInspectDriver,
  onInspectCatalyst,
  onInspectSource,
  onInspectDossier,
  onInspectRegistryTrack,
  onInspectRisk
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  assistantLoading: boolean;
  assistantError: string | null;
  hasApiKey: boolean;
  question: string;
  onQuestionChange: (value: string) => void;
  onRunAssistant: () => void;
  driverRows: DriverDecisionRow[];
  catalystRows: ReturnType<typeof localizeCatalystWindow>[];
  sourceRows: SourceHealthRow[];
  dossier: CreditLifecycleDossier | null;
  registryRows: RegistryFreshnessRow[];
  registryTrack: RegistryOperationsTrack | null;
  riskOverlay: NatureRiskOverlay | null;
  focus: string;
  check: string;
  priorityItems: string[];
  invalidationChecks: string[];
  onOpenSource: (url: string) => void;
  onInspectDriver: (rowId: string) => void;
  onInspectCatalyst: (rowId: string) => void;
  onInspectSource: (rowId: string) => void;
  onInspectDossier: (dossierId: string) => void;
  onInspectRegistryTrack: (trackId: string) => void;
  onInspectRisk: (riskId: string) => void;
}) {
  return (
    <>
      <section className="overview-grid desk-core-grid">
        <div className="panel panel-emphasis">
          <SectionHeader
            title={t(locale, "판단 메모", "Decision memo")}
            subtitle={t(
              locale,
              "매수, 관망, 축소 중 왜 이쪽으로 기울었는지 근거를 바로 읽습니다.",
              "Read why the stance currently leans buy, hold, or reduce."
            )}
          />
          <DecisionMemoPanel
            locale={locale}
            decision={decision}
            assistantLoading={assistantLoading}
            assistantError={assistantError}
            hasApiKey={hasApiKey}
            question={question}
            onQuestionChange={onQuestionChange}
            onRunAssistant={onRunAssistant}
          />
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "실행 전 체크", "Pre-trade checks")}
            subtitle={t(
              locale,
              "실행 전 반드시 다시 확인해야 하는 것과, 이 판단을 깨는 조건을 나눠 봅니다.",
              "Separate what must be checked before acting from what breaks the call."
            )}
          />
          <RiskGatePanel
            locale={locale}
            decision={decision}
            focus={focus}
            check={check}
            priorityItems={priorityItems}
            invalidationChecks={invalidationChecks}
          />
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          title={t(locale, "판단에 들어간 드라이버", "Drivers behind the call")}
          subtitle={t(
            locale,
            "각 요인이 지금 가격을 어느 방향으로 밀고 있는지 숫자와 설명으로 읽습니다.",
            "Read each active driver with a score and plain-language explanation."
          )}
        />
          <DriverMonitorTable
            locale={locale}
            rows={driverRows}
            onOpenSource={onOpenSource}
            onInspect={onInspectDriver}
          />
      </section>

      <section className="overview-grid secondary">
        <div className="panel">
          <SectionHeader
            title={t(locale, "다음 일정", "Next catalysts")}
            subtitle={t(
              locale,
              "이 판단을 다시 뒤집을 수 있는 일정만 남깁니다.",
              "Keep only the dates that could flip the read."
            )}
          />
          <CatalystWatchTable
            locale={locale}
            rows={catalystRows}
            onOpenSource={onOpenSource}
            onInspect={onInspectCatalyst}
          />
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "데이터 상태", "Data status")}
            subtitle={t(
              locale,
              "지금 판단에 사용된 데이터가 최신인지 먼저 확인합니다.",
              "Check the freshness of the data used in the current call."
            )}
          />
          <SourceHealthTable locale={locale} rows={sourceRows} onInspect={onInspectSource} />
        </div>
      </section>

      <section className="overview-grid secondary">
        <div className="panel">
          <SectionHeader
            title={t(locale, "프로젝트 인텔리전스", "Project intelligence sidecar")}
            subtitle={t(
              locale,
              "거래 실행이 아니라 문서, 생애주기, retirement trail을 읽기 전용으로 봅니다.",
              "Read registry documents, lifecycle status, and retirement trail without turning the product into a venue."
            )}
          />
          {dossier ? (
            <div className="project-dossier-panel">
              <button className="subtle-button" onClick={() => onInspectDossier(dossier.id)}>
                {t(locale, "프로젝트 파일 자세히 보기", "Inspect dossier")}
              </button>
              <div className="project-dossier-copy">
                <strong>{dossier.title}</strong>
                <span>{`${dossier.registry} · ${dossier.projectType} · ${dossier.region}`}</span>
                <p>{dossier.currentRead}</p>
              </div>
              <div className="status-chip-row">
                {dossier.stages.map((stage) => (
                  <span key={stage.id} className={`driver-chip ${lifecycleStatusTone(stage.status)}`}>
                    {stage.label} · {lifecycleStatusLabel(locale, stage.status)}
                  </span>
                ))}
              </div>
              <div className="project-document-list">
                {registryRows.slice(0, 4).map((row) => (
                  <button
                    key={row.id}
                    className="project-document-row"
                    onClick={() => void onOpenSource(row.sourceUrl)}
                  >
                    <strong>{row.title}</strong>
                    <span>{`${formatDate(locale, row.publishedAt)} · ${registryStatusLabel(locale, row.status)}`}</span>
                    <small>{row.note}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-plot compact">
              {t(locale, "연결된 프로젝트 파일이 없습니다.", "No project dossier is linked.")}
            </div>
          )}
        </div>

        <div className="panel">
          <SectionHeader
            title={t(locale, "무결성 리스크 오버레이", "Integrity risk overlay")}
            subtitle={t(
              locale,
              "ETS 공식 시세의 대체재가 아니라, 크레딧 품질을 따로 감시하는 보조 레이어입니다.",
              "This is not a substitute for official ETS settlement. It is a sidecar for credit-quality monitoring."
            )}
          />
          {riskOverlay ? (
            <div className="project-risk-panel">
              <div className="project-risk-head">
                <div>
                  <strong>{riskOverlay.title}</strong>
                  <span>{riskOverlay.region}</span>
                </div>
                <button className="subtle-button" onClick={() => onInspectRisk(riskOverlay.id)}>
                  {t(locale, "리스크 자세히 보기", "Inspect risk")}
                </button>
              </div>
              <p>{riskOverlay.posture}</p>
              <ColumnChart
                points={riskOverlay.components.map((item) => ({ label: item.label, value: item.value }))}
                color={NEGATIVE}
                valueFormatter={(value) => `${formatNumber(locale, value, 0)}`}
                height={180}
              />
              <ul className="project-risk-list">
                {riskOverlay.watchItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="empty-plot compact">
              {t(locale, "연결된 무결성 리스크 오버레이가 없습니다.", "No integrity risk overlay is linked.")}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          title={t(locale, "레지스트리 운영 보드", "Registry operations board")}
          subtitle={t(
            locale,
            "실제 문서 흐름이 얼마나 믿을 만한지, 어떤 운영 막힘이 남아 있는지 따로 봅니다.",
            "Separate workflow quality from market direction so evidence friction is visible."
          )}
        />
        {registryTrack ? (
          <div className="registry-track-panel">
            <div className="registry-track-head">
              <div>
                <strong>{registryTrack.registry}</strong>
                <span>{`${registryTrack.accessMethod} · ${registryHealthLabel(locale, registryTrack.status)}`}</span>
              </div>
              <button className="subtle-button" onClick={() => onInspectRegistryTrack(registryTrack.id)}>
                {t(locale, "운영 흐름 자세히 보기", "Inspect workflow")}
              </button>
            </div>
            <p>{registryTrack.operatorRead}</p>
            <div className="status-chip-row">
              <span className={`driver-chip ${registryHealthTone(registryTrack.status)}`}>
                {registryHealthLabel(locale, registryTrack.status)}
              </span>
              <span className="driver-chip neutral">
                {t(locale, "주기", "Cadence")} · {registryTrack.refreshCadence}
              </span>
              <span className="driver-chip neutral">
                {t(locale, "기준", "SLA")} · {registryTrack.freshnessSla}
              </span>
            </div>
            <div className="registry-track-columns">
              <div className="project-document-list">
                {registryTrack.steps.map((step) => (
                  <div key={step.id} className="project-document-row static">
                    <strong>{step.label}</strong>
                    <span>{lifecycleStatusLabel(locale, step.status)}</span>
                    <small>{step.note}</small>
                  </div>
                ))}
              </div>
              <div className="registry-track-side">
                <strong>{t(locale, "운영 막힘과 주의사항", "Watch items and blockers")}</strong>
                <ul className="project-risk-list">
                  {[...registryTrack.watchItems, ...registryTrack.blockers].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-plot compact">
            {t(locale, "연결된 레지스트리 운영 흐름이 없습니다.", "No registry workflow is linked.")}
          </div>
        )}
      </section>
    </>
  );
}

function DecisionMemoPanel({
  locale,
  decision,
  assistantLoading,
  assistantError,
  hasApiKey,
  question,
  onQuestionChange,
  onRunAssistant
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  assistantLoading: boolean;
  assistantError: string | null;
  hasApiKey: boolean;
  question: string;
  onQuestionChange: (value: string) => void;
  onRunAssistant: () => void;
}) {
  return (
    <div className="decision-memo">
      <div className="memo-head">
        <div>
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
          <h3>{t(locale, "현재 판단 메모", "Decision memo")}</h3>
          <p>{decision.summary}</p>
        </div>
        <div className="memo-confidence">
          <span>{t(locale, "신뢰도", "Confidence")}</span>
          <strong>{formatNumber(locale, decision.confidence * 100, 0)}%</strong>
        </div>
      </div>

      {decision.operatorBrief.length > 0 ? (
        <div className="operator-brief-grid">
          {decision.operatorBrief.map((section) => (
            <section key={section.title} className="operator-brief-card">
              <strong>{section.title}</strong>
              <p>{section.summary}</p>
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      <div className="memo-grid">
        <section>
          <strong>{t(locale, "매수 쪽 근거", "Support for the current read")}</strong>
          <div className="decision-reason-list">
            {decision.supportingEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="decision-reason-card support">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <strong>{t(locale, "반대로 봐야 하는 이유", "What argues against it")}</strong>
          <div className="decision-reason-list">
            {decision.counterEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="decision-reason-card caution">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="memo-grid compact">
        <section>
          <strong>{t(locale, "지금 다시 확인할 것", "Check again before acting")}</strong>
          <ul>
            {decision.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <strong>{t(locale, "다음 체크포인트", "Next checkpoints")}</strong>
          <ul>
            {decision.checkpoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="decision-ask decision-helper">
        <label>
          <span>{t(locale, "AI에게 추가 질문", "Ask AI a follow-up")}</span>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            rows={3}
          />
        </label>
        <div className="decision-actions">
          <button
            className="primary-button"
            onClick={onRunAssistant}
            disabled={assistantLoading || !hasApiKey}
          >
            {assistantLoading
              ? t(locale, "생성 중..", "Generating...")
              : t(locale, "근거를 더 자세히 묻기", "Ask for a deeper explanation")}
          </button>
          {!hasApiKey ? (
            <small>{t(locale, "AI 설명을 쓰려면 API key를 먼저 저장해야 합니다.", "Save an API key first to use AI explanations.")}</small>
          ) : null}
          {assistantError ? <small className="error-text">{assistantError}</small> : null}
        </div>
      </div>
    </div>
  );
}

function LiveTapeWorkbench({
  locale,
  officialCard,
  quote,
  quotePoints,
  comparePoints,
  compareStats,
  compareSeries,
  selectedRange,
  onSelectRange,
  loading,
  error,
  onOpenSource
}: {
  locale: AppLocale;
  officialCard: ConnectedSourceCard | undefined;
  quote: MarketLiveQuote | undefined;
  quotePoints: ChartPoint[];
  comparePoints: MultiLinePoint[];
  compareStats: TapeCompareStats;
  compareSeries: MultiLineSeries[];
  selectedRange: QuoteRangePreset;
  onSelectRange: (range: QuoteRangePreset) => void;
  loading: boolean;
  error: string | null;
  onOpenSource: (url: string) => void | Promise<void>;
}) {
  if (!quote) {
    return null;
  }

  return (
    <div className="tape-workbench">
      <div className="tape-workbench-head">
        <div>
          <strong>{quote.title}</strong>
          <span>{quote.role}</span>
        </div>
        <button className="subtle-button" onClick={() => void onOpenSource(quote.sourceUrl)}>
          {t(locale, "출처 보기", "Open source")}
        </button>
      </div>

      <div className="tape-workbench-toolbar">
        <div className="range-chip-group" role="tablist" aria-label="Live chart range">
          {LIVE_QUOTE_RANGE_OPTIONS.map((range) => (
            <button
              key={range}
              type="button"
              className={`range-chip ${range === selectedRange ? "active" : ""}`}
              onClick={() => onSelectRange(range)}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="api-status-row">
          <span>{t(locale, "앱 내부 라이브·지연 API 차트", "In-app live / delayed API chart")}</span>
          <span>{quote.provider}</span>
          <span>{t(locale, "기준 시각", "As of")} {formatDate(locale, quote.asOf)}</span>
        </div>
      </div>
      {loading ? (
        <div className="inline-status-note">
          {t(locale, "선택한 기간의 차트를 다시 불러오는 중입니다.", "Reloading the selected chart window.")}
        </div>
      ) : null}
      {error ? <div className="inline-status-note error">{error}</div> : null}

      <div className="tape-metric-strip">
        <MetricPill
          label={t(locale, "현재 값", "Current price")}
          value={formatLiveQuotePrice(locale, quote)}
        />
        <MetricPill
          label={t(locale, "변동", "Move")}
          value={formatLiveQuoteMove(locale, quote)}
        />
        <MetricPill
          label={t(locale, "지연/상태", "Delay / status")}
          value={getLiveQuoteStatusLabel(locale, quote)}
        />
        <MetricPill
          label={t(locale, "이 테이프 용도", "How to use")}
          value={localizeLiveQuoteCategory(locale, quote.category)}
        />
      </div>

      <div className="tape-metric-strip tape-metric-strip-secondary">
        <MetricPill
          label={t(locale, "겹치는 구간", "Overlap window")}
          value={formatOverlapWindow(locale, compareStats.overlapCount)}
        />
        <MetricPill
          label={t(locale, "공식 대비 괴리", "Normalized gap")}
          value={formatPercentStat(locale, compareStats.normalizedGapPct, 1, true)}
        />
        <MetricPill
          label={t(locale, "공식 5일 변화", "Official 5D")}
          value={formatPercentStat(locale, compareStats.officialFiveDayReturnPct, 1, true)}
        />
        <MetricPill
          label={t(locale, "연결 테이프 5일 변화", "Linked 5D")}
          value={formatPercentStat(locale, compareStats.quoteFiveDayReturnPct, 1, true)}
        />
        <MetricPill
          label={t(locale, "방향 일치", "Direction match")}
          value={formatPercentStat(locale, compareStats.directionMatchPct, 0)}
        />
        <MetricPill
          label={t(locale, "5일 상관", "5D correlation")}
          value={formatPlainStat(locale, compareStats.recentCorrelation, 2)}
        />
      </div>

      <div className="tape-workbench-grid">
        <div className="tape-chart-stack">
          {quotePoints.length > 1 ? (
            <LineChart
              points={quotePoints}
              color="#2f7bf6"
              locale={locale === "ko" ? "ko-KR" : "en-US"}
              valueFormatter={(value) => formatNumber(locale, value, value >= 10 ? 2 : 3)}
              title={t(locale, "선택한 테이프 차트", "Selected tape chart")}
              subtitle={quote.delayNote}
            />
          ) : (
            <div className="empty-plot">
              <strong>{t(locale, "차트 데이터 부족", "Not enough chart data")}</strong>
              <p>{quote.note}</p>
            </div>
          )}

          {comparePoints.length > 1 ? (
            <MultiLineChart
              points={comparePoints}
              series={compareSeries}
              locale={locale === "ko" ? "ko-KR" : "en-US"}
              valueFormatter={(value) => formatNumber(locale, value, 0)}
            />
          ) : (
            <div className="empty-plot">
              <strong>{t(locale, "공식 시세와 비교 준비 중", "Official comparison not available yet")}</strong>
              <p>
                {officialCard?.series?.length
                  ? t(
                      locale,
                      "연결된 테이프와 공식 시세의 날짜가 충분히 겹치지 않아 정규화 비교를 만들지 못했습니다.",
                      "The linked tape and official series do not overlap enough yet for a normalized comparison."
                    )
                  : t(
                      locale,
                      "공식 시계열이 없는 시장은 이벤트와 공시를 우선 해석해야 합니다.",
                      "When there is no official time series, decisions should lean more on bulletins and events."
                    )}
              </p>
            </div>
          )}
        </div>

        <div className="tape-context">
          <div className="operator-row">
            <strong>{t(locale, "이 테이프를 보는 이유", "Why this tape matters")}</strong>
            <span>{quote.note}</span>
          </div>
          <div className="operator-row">
            <strong>{t(locale, "실무 해석", "Desk interpretation")}</strong>
            <span>{quote.role}</span>
          </div>
          <div className="operator-row">
            <strong>{t(locale, "주의", "Caution")}</strong>
            <span>{quote.delayNote}</span>
          </div>
          <div className="operator-row">
            <strong>{t(locale, "확인 강도", "Confirmation strength")}</strong>
            <span>
              {compareStats.overlapCount < 2
                ? t(
                    locale,
                    "공식 시세와 겹치는 날짜가 아직 적어서, 이 테이프는 보조 참고용으로만 보는 편이 안전합니다.",
                    "There is not enough overlapping history yet, so this tape should be treated as context only."
                  )
                : t(
                    locale,
                    `최근 겹치는 구간에서 방향 일치는 ${formatPercentStat(
                      locale,
                      compareStats.directionMatchPct,
                      0
                    )}, 상관은 ${formatPlainStat(locale, compareStats.recentCorrelation, 2)}입니다. 괴리가 크게 벌어지면 공식 시세 쪽을 더 우선합니다.`,
                    `Across the recent overlap window, direction match is ${formatPercentStat(
                      locale,
                      compareStats.directionMatchPct,
                      0
                    )} and correlation is ${formatPlainStat(locale, compareStats.recentCorrelation, 2)}. If the gap widens, give more weight to the official tape.`
                  )}
            </span>
          </div>
          <div className="operator-row">
            <strong>{t(locale, "공식 기준과의 관계", "Relation to the official tape")}</strong>
            <span>
              {officialCard
                ? t(
                    locale,
                    "이 값은 공식 시세를 대체하지 않습니다. 공식 카드와 함께 보면서 괴리와 방향 일치 여부를 확인해야 합니다.",
                    "This tape does not replace the official market tape. It should be used alongside the official card to check divergence and direction."
                  )
                : t(
                    locale,
                    "공식 시세가 약한 시장에서는 이 테이프를 참고하되, 정책 공시와 운영 데이터도 함께 봐야 합니다.",
                    "When the official market tape is weak, use this tape as context and confirm with policy and operations releases."
                  )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedTapeScoreboard({
  locale,
  rows,
  selectedQuoteId,
  onSelectQuote
}: {
  locale: AppLocale;
  rows: LinkedTapeScoreRow[];
  selectedQuoteId: string;
  onSelectQuote: (quoteId: string) => void;
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="tape-scoreboard">
      <div className="tape-scoreboard-head">
        <strong>{t(locale, "연결 테이프 비교 보드", "Linked tape scoreboard")}</strong>
        <span>
          {t(
            locale,
            "공식 시세와 얼마나 같이 움직였는지 기준으로 연결 테이프를 고릅니다.",
            "Use this board to pick the linked tape that is tracking the official market best."
          )}
        </span>
      </div>
      <div className="tape-score-table">
        <div className="tape-score-header">
          <span>{t(locale, "테이프", "Tape")}</span>
          <span>{t(locale, "용도", "Use")}</span>
          <span>{t(locale, "현재 값", "Current")}</span>
          <span>{t(locale, "괴리", "Gap")}</span>
          <span>{t(locale, "방향 일치", "Match")}</span>
          <span>{t(locale, "상관", "Corr")}</span>
          <span>{t(locale, "판정", "Read")}</span>
        </div>
        {rows.map((row) => (
          <button
            key={row.quote.id}
            className={`tape-score-row ${row.quote.id === selectedQuoteId ? "active" : ""}`}
            onClick={() => onSelectQuote(row.quote.id)}
          >
            <div>
              <strong>{row.quote.title}</strong>
              <small>{row.quote.symbol}</small>
            </div>
            <span>{localizeLiveQuoteCategory(locale, row.quote.category)}</span>
            <span>{formatLiveQuotePrice(locale, row.quote)}</span>
            <span>{formatPercentStat(locale, row.stats.normalizedGapPct, 1, true)}</span>
            <span>{formatPercentStat(locale, row.stats.directionMatchPct, 0)}</span>
            <span>{formatPlainStat(locale, row.stats.recentCorrelation, 2)}</span>
            <span className={`alignment-pill ${row.alignmentTone}`}>{row.alignmentLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OperatorDeskPanel({
  locale,
  marketId,
  officialCard,
  primaryQuote,
  supportQuotes,
  focus,
  check,
  executionNote,
  priorityItems,
  invalidationChecks
}: {
  locale: AppLocale;
  marketId: MarketProfile["id"];
  officialCard: ConnectedSourceCard | undefined;
  primaryQuote: MarketLiveQuote | undefined;
  supportQuotes: MarketLiveQuote[];
  focus: string;
  check: string;
  executionNote: string;
  priorityItems: string[];
  invalidationChecks: string[];
}) {
  const hasPublicFutures = marketId === "eu-ets";

  return (
    <div className="operator-desk">
      <div className="operator-row">
        <strong>{t(locale, "공식 기준", "Official anchor")}</strong>
        <span>{officialCard?.sourceName ?? t(locale, "공식 소스 미연결", "No official source")}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "헤지·비교 기준", "Hedge / comparison tape")}</strong>
        <span>
          {primaryQuote
            ? `${primaryQuote.title} · ${formatLiveQuotePrice(locale, primaryQuote)}`
            : t(locale, "연결된 테이프 없음", "No linked tape")}
        </span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "이 시장의 해석", "How to read this market")}</strong>
        <span>{focus}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "다음 확인", "Next check")}</strong>
        <span>{check}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "실무 메모", "Desk note")}</strong>
        <span>
          {hasPublicFutures
            ? t(
                locale,
                "EU ETS는 ICE EUA 선물을 직접 비교할 수 있습니다. 최종 판단은 여전히 공식 경매·공식 가격 공시와 같이 봐야 합니다.",
                "EU ETS can be compared directly with ICE EUA futures, but the final read should still be anchored to official auction and official market data."
              )
            : t(
                locale,
                "이 시장은 무료로 검증된 현지 선물 테이프를 아직 붙이지 않았습니다. 그래서 공식 현물 시세에 글로벌 탄소 프록시를 겹쳐서 봅니다.",
                "This market does not yet have a verified free local futures tape here, so the official spot tape is read together with a listed global carbon proxy."
              )}
        </span>
      </div>
      {supportQuotes.length > 0 ? (
        <div className="operator-support">
          {supportQuotes.map((quote) => (
            <div key={quote.id} className="operator-support-chip">
              <strong>{quote.title}</strong>
              <span>{formatLiveQuotePrice(locale, quote)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InstitutionChecklistPanel({
  locale,
  marketId,
  officialCard,
  primaryQuote,
  supportQuotes,
  focus,
  check,
  executionNote,
  priorityItems,
  invalidationChecks
}: {
  locale: AppLocale;
  marketId: MarketProfile["id"];
  officialCard: ConnectedSourceCard | undefined;
  primaryQuote: MarketLiveQuote | undefined;
  supportQuotes: MarketLiveQuote[];
  focus: string;
  check: string;
  executionNote: string;
  priorityItems: string[];
  invalidationChecks: string[];
}) {
  return (
    <div className="operator-desk">
      <div className="operator-row">
        <strong>{t(locale, "공식 기준", "Official anchor")}</strong>
        <span>{officialCard?.sourceName ?? t(locale, "공식 소스 없음", "No official source")}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "비교 테이프", "Comparison tape")}</strong>
        <span>
          {primaryQuote
            ? `${primaryQuote.title} · ${formatLiveQuotePrice(locale, primaryQuote)}`
            : t(locale, "연결된 테이프 없음", "No linked tape")}
        </span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "이 시장 읽는 법", "How to read this market")}</strong>
        <span>{focus}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "다음 확인", "Next check")}</strong>
        <span>{check}</span>
      </div>
      <div className="operator-row">
        <strong>{t(locale, "실무 메모", "Desk note")}</strong>
        <span>{executionNote}</span>
      </div>
      <div className="operator-group">
        <strong>{t(locale, "우선 확인할 것", "Priority checks")}</strong>
        <ul className="operator-list">
          {priorityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="operator-group">
        <strong>{t(locale, "판단을 낮춰야 하는 경우", "When to lower conviction")}</strong>
        <ul className="operator-list">
          {invalidationChecks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {supportQuotes.length > 0 ? (
        <div className="operator-support">
          {supportQuotes.map((quote) => (
            <div key={quote.id} className="operator-support-chip">
              <strong>{quote.title}</strong>
              <span>{`${formatLiveQuotePrice(locale, quote)} · ${localizeLiveQuoteCategory(
                locale,
                quote.category
              )}`}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="operator-footnote">
          {marketId === "eu-ets"
            ? t(
                locale,
                "보조 테이프가 추가로 없더라도 공식 시세와 대표 선물의 방향 일치 여부를 먼저 확인합니다.",
                "Even without extra support tapes, first check whether the official tape and the benchmark future still agree."
              )
            : t(
                locale,
                "현지 무료 선물 테이프가 없으면 공식 시세와 글로벌 탄소 프록시의 간격을 더 보수적으로 해석합니다.",
                "When a verified free local futures tape is not available, interpret the gap between the official tape and the global proxy more conservatively."
              )}
        </div>
      )}
    </div>
  );
}

function MarketPulsePanel({
  locale,
  forecast,
  decision,
  updatedAt,
  sourceStatus,
  scoreCap,
  drivers
}: {
  locale: AppLocale;
  forecast: ReturnType<typeof buildForecast>;
  decision: DecisionAssistantResponse;
  updatedAt?: string;
  sourceStatus: ConnectedSourceCard["status"];
  scoreCap: number;
  drivers: Array<{ variable: string; contribution: number }>;
}) {
  const normalizedScore = clamp(forecast.score / scoreCap, -1, 1);

  return (
    <div className="market-pulse">
      <div className="market-pulse-head">
        <div className="market-pulse-copy">
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
          <p>{decision.summary}</p>
        </div>
        <div className="market-pulse-score">
          <span>{t(locale, "현재 점수", "Current score")}</span>
          <strong>{formatNumber(locale, forecast.score, 2)}</strong>
        </div>
      </div>

      <PressureBar
        value={normalizedScore}
        negativeLabel={t(locale, "매도 쪽", "Reduce")}
        neutralLabel={t(locale, "중립", "Neutral")}
        positiveLabel={t(locale, "매수 쪽", "Buy")}
      />

      <div className="pulse-metric-strip">
        <MetricPill
          label={t(locale, "신뢰도", "Confidence")}
          value={`${formatNumber(locale, decision.confidence * 100, 0)}%`}
        />
        <MetricPill
          label={t(locale, "움직이는 요인", "Active drivers")}
          value={String(forecast.contributions.filter((item) => Math.abs(item.contribution) > 0.05).length)}
        />
        <MetricPill
          label={t(locale, "데이터 상태", "Source health")}
          value={getStatusLabel(locale, sourceStatus)}
        />
        <MetricPill
          label={t(locale, "갱신 시각", "Updated")}
          value={formatDate(locale, updatedAt)}
        />
      </div>

      <div className="driver-chip-row">
        {drivers.map((item) => (
          <span
            key={item.variable}
            className={`driver-chip ${item.contribution >= 0 ? "positive" : "negative"}`}
          >
            {item.variable} {item.contribution >= 0 ? "+" : ""}
            {formatNumber(locale, item.contribution, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailedDecisionPanel({
  locale,
  decision,
  assistantLoading,
  assistantError,
  hasApiKey,
  question,
  onQuestionChange,
  onRunAssistant
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  assistantLoading: boolean;
  assistantError: string | null;
  hasApiKey: boolean;
  question: string;
  onQuestionChange: (value: string) => void;
  onRunAssistant: () => void;
}) {
  return (
    <div className="decision-stack">
      <div className="decision-topline">
        <DonutMeter
          value={decision.confidence}
          label={t(locale, "신뢰도", "Confidence")}
          subLabel={stanceLabel(locale, decision.stance)}
          color={
            decision.stance === "Reduce Bias"
              ? NEGATIVE
              : decision.stance === "Buy Bias"
                ? POSITIVE
                : "#2f7bf6"
          }
        />
        <div className="decision-copy">
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
          <p>{decision.summary}</p>
          <small>{decision.disclaimer}</small>
        </div>
      </div>

      <div className="decision-block">
        <strong>{t(locale, "핵심 요약", "Key points")}</strong>
        <ul>
          {decision.thesis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="decision-block two-column">
        <div className="decision-subsection">
          <strong>{t(locale, "왜 이런 판단이 나왔나", "Why this stance")}</strong>
          <div className="reason-list">
            {decision.supportingEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="reason-item support">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="decision-subsection">
          <strong>{t(locale, "반대로 볼 이유", "What argues against it")}</strong>
          <div className="reason-list">
            {decision.counterEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="reason-item caution">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="decision-block two-column">
        <div>
          <strong>{t(locale, "리스크", "Risks")}</strong>
          <ul>
            {decision.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>{t(locale, "체크리스트", "Checklist")}</strong>
          <ul>
            {decision.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="decision-block two-column">
        <div>
          <strong>{t(locale, "데이터 상태", "Data health")}</strong>
          <ul>
            {decision.dataHealth.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>{t(locale, "다음에 확인할 것", "Next checkpoints")}</strong>
          <ul>
            {decision.checkpoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="decision-ask">
        <label>
          <span>{t(locale, "AI에게 추가 질문", "Ask AI a follow-up")}</span>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            rows={3}
          />
        </label>
        <div className="decision-actions">
          <button
            className="primary-button"
            onClick={onRunAssistant}
            disabled={assistantLoading || !hasApiKey}
          >
            {assistantLoading
              ? t(locale, "생성 중...", "Generating...")
              : t(locale, "AI 상세 설명 만들기", "Generate detailed AI brief")}
          </button>
          {!hasApiKey ? (
            <small>
              {t(
                locale,
                "AI 상세 설명을 쓰려면 먼저 API key를 저장하세요.",
                "Save an API key first to use the detailed AI brief."
              )}
            </small>
          ) : null}
          {assistantError ? <small className="error-text">{assistantError}</small> : null}
        </div>
      </div>
    </div>
  );
}

function ExplainableDecisionPanel({
  locale,
  decision,
  assistantLoading,
  assistantError,
  hasApiKey,
  question,
  onQuestionChange,
  onRunAssistant
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  assistantLoading: boolean;
  assistantError: string | null;
  hasApiKey: boolean;
  question: string;
  onQuestionChange: (value: string) => void;
  onRunAssistant: () => void;
}) {
  return (
    <div className="explainable-decision">
      <div className="decision-topline explainable-topline">
        <DonutMeter
          value={decision.confidence}
          label={t(locale, "신뢰도", "Confidence")}
          subLabel={stanceLabel(locale, decision.stance)}
          color={
            decision.stance === "Reduce Bias"
              ? NEGATIVE
              : decision.stance === "Buy Bias"
                ? POSITIVE
                : "#2f7bf6"
          }
        />
        <div className="decision-copy">
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
          <h3>{t(locale, "한눈에 결론", "Bottom line")}</h3>
          <p>{decision.summary}</p>
          <small>{decision.disclaimer}</small>
        </div>
      </div>

      <div className="decision-summary-block">
        <strong>{t(locale, "핵심 요약", "Key takeaway")}</strong>
        <ul>
          {decision.thesis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="decision-section-grid">
        <section className="decision-section">
          <strong>{t(locale, "왜 이렇게 보나", "Why it leans this way")}</strong>
          <p className="decision-section-note">
            {t(
              locale,
              "현재 판단을 밀어주는 근거입니다. 각 항목이 가격을 어느 쪽으로 움직이는지 풀어서 보여줍니다.",
              "These are the points supporting the current stance and explain which way they push the market."
            )}
          </p>
          <div className="decision-reason-list">
            {decision.supportingEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="decision-reason-card support">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="decision-section">
          <strong>{t(locale, "반대로 볼 이유", "What argues against it")}</strong>
          <p className="decision-section-note">
            {t(
              locale,
              "이 부분은 지금 판단이 틀릴 수 있는 이유입니다. 한쪽으로 단정하지 않도록 같이 봐야 합니다.",
              "These are the reasons the current stance could be wrong and should be checked before acting."
            )}
          </p>
          <div className="decision-reason-list">
            {decision.counterEvidence.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="decision-reason-card caution">
                <span>{item.title}</span>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="decision-section-grid compact">
        <section className="decision-section">
          <strong>{t(locale, "주의할 점", "Risks")}</strong>
          <ul>
            {decision.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="decision-section">
          <strong>{t(locale, "지금 다시 확인할 것", "What to re-check now")}</strong>
          <ul>
            {decision.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="decision-section-grid compact">
        <section className="decision-section">
          <strong>{t(locale, "데이터 신뢰 상태", "Data health")}</strong>
          <ul>
            {decision.dataHealth.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="decision-section">
          <strong>{t(locale, "다음 확인 포인트", "Next checkpoints")}</strong>
          <ul>
            {decision.checkpoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="decision-ask decision-helper">
        <label>
          <span>{t(locale, "AI에게 추가 질문", "Ask AI a follow-up")}</span>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            rows={3}
          />
        </label>
        <div className="decision-actions">
          <button
            className="primary-button"
            onClick={onRunAssistant}
            disabled={assistantLoading || !hasApiKey}
          >
            {assistantLoading
              ? t(locale, "생성 중...", "Generating...")
              : t(locale, "AI가 근거 더 자세히 설명", "Ask AI for a deeper explanation")}
          </button>
          {!hasApiKey ? (
            <small>
              {t(
                locale,
                "상세 AI 설명을 쓰려면 먼저 API key를 저장해야 합니다.",
                "Save an API key first to use the detailed AI explanation."
              )}
            </small>
          ) : (
            <small>
              {t(
                locale,
                "위 근거들을 바탕으로 AI가 더 긴 해석, 반론, 체크포인트를 정리합니다.",
                "The AI will expand the current evidence into a longer explanation, counter-arguments, and checkpoints."
              )}
            </small>
          )}
          {assistantError ? <small className="error-text">{assistantError}</small> : null}
        </div>
      </div>
    </div>
  );
}

function DecisionPanel({
  locale,
  decision,
  assistantLoading,
  assistantError,
  hasApiKey,
  question,
  onQuestionChange,
  onRunAssistant
}: {
  locale: AppLocale;
  decision: DecisionAssistantResponse;
  assistantLoading: boolean;
  assistantError: string | null;
  hasApiKey: boolean;
  question: string;
  onQuestionChange: (value: string) => void;
  onRunAssistant: () => void;
}) {
  return (
    <div className="decision-stack">
      <div className="decision-topline">
        <DonutMeter
          value={decision.confidence}
          label={t(locale, "신뢰도", "Confidence")}
          subLabel={stanceLabel(locale, decision.stance)}
          color={decision.stance === "Reduce Bias" ? NEGATIVE : decision.stance === "Buy Bias" ? POSITIVE : "#2f7bf6"}
        />
        <div className="decision-copy">
          <span className={`stance-badge ${stanceBadgeClass(decision.stance)}`}>
            {stanceLabel(locale, decision.stance)}
          </span>
          <p>{decision.summary}</p>
          <small>{decision.disclaimer}</small>
        </div>
      </div>

      <div className="decision-block">
        <strong>{t(locale, "핵심 포인트", "Thesis")}</strong>
        <ul>
          {decision.thesis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="decision-block two-column">
        <div>
          <strong>{t(locale, "리스크", "Risks")}</strong>
          <ul>
            {decision.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>{t(locale, "체크리스트", "Checklist")}</strong>
          <ul>
            {decision.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="decision-ask">
        <label>
          <span>{t(locale, "LLM 질문", "LLM prompt")}</span>
          <textarea value={question} onChange={(event) => onQuestionChange(event.target.value)} rows={3} />
        </label>
        <div className="decision-actions">
          <button className="primary-button" onClick={onRunAssistant} disabled={assistantLoading || !hasApiKey}>
            {assistantLoading ? t(locale, "생성 중...", "Generating...") : t(locale, "LLM 브리프 생성", "Generate LLM brief")}
          </button>
          {!hasApiKey ? (
            <small>{t(locale, "LLM 분석을 쓰려면 API key를 먼저 저장하세요.", "Save an API key first to use the LLM brief.")}</small>
          ) : null}
          {assistantError ? <small className="error-text">{assistantError}</small> : null}
        </div>
      </div>
    </div>
  );
}
