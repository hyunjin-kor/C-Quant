import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ColumnChart,
  DonutMeter,
  Heatmap,
  LineChart,
  MiniTrendChart,
  MultiLineChart,
  PressureBar,
  WaterfallChart,
  type ChartPoint,
  type HeatmapRow,
  type MultiLinePoint,
  type MultiLineSeries
} from "./components/charts";
import { datasetTemplates, marketDatasetSchemas } from "./data/dataHub";
import { marketProfiles, quantIndicators } from "./data/research";
import { parseCsv, runBacktest } from "./lib/backtest";
import { buildForecast } from "./lib/forecast";
import type {
  BacktestRun,
  BacktestStrategy,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  ConnectedSourceSeriesPoint,
  DecisionAssistantResponse,
  LocalLlmState,
  MarketDriver,
  MarketLiveQuote,
  MarketProfile,
  WalkForwardResult
} from "./types";

const appIconUrl = new URL("../assets/app-icon.png", import.meta.url).href;

type MarketId = MarketProfile["id"];
type AppLocale = "ko" | "en";
type Surface = "desk" | "drivers" | "sources" | "lab";
type QuoteRangePreset = "1d" | "5d" | "1m" | "3m" | "6m" | "1y";
type CopilotTask = "why-posture" | "what-changed" | "breakers" | "verify-now";

type CompareStats = {
  overlapCount: number;
  gapPct: number | null;
  correlation: number | null;
  directionMatchPct: number | null;
  officialReturnPct: number | null;
  benchmarkReturnPct: number | null;
};

type DecisionSummary = {
  stance: "buy" | "hold" | "reduce";
  score: number;
  confidence: number;
  summary: string;
  support: Array<{ title: string; detail: string }>;
  risks: string[];
  checks: string[];
  waterfall: Array<{ label: string; value: number }>;
};

type MarketBoardRow = {
  market: MarketProfile;
  officialCard: ConnectedSourceCard | null;
  hedgeQuote: MarketLiveQuote | null;
  compareStats: CompareStats;
  decision: DecisionSummary;
};

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
      refreshConnectedSources: () => Promise<ConnectedSourcePayload>;
      getLiveQuoteHistory: (options: {
        quoteId: string;
        range: QuoteRangePreset;
      }) => Promise<MarketLiveQuote>;
      getLocalLlmState: () => Promise<LocalLlmState>;
      saveLocalLlmSettings: (options: {
        ollamaBaseUrl?: string;
        ollamaModel?: string;
      }) => Promise<LocalLlmState>;
      runLocalDecisionAssistant: (options: {
        locale: AppLocale;
        baseUrl?: string;
        model?: string;
        payload: Record<string, unknown>;
      }) => Promise<DecisionAssistantResponse>;
      runWalkForwardModel: (options: {
        inputPath: string;
        marketId: MarketId;
        trainWindow: number;
        horizon: number;
      }) => Promise<WalkForwardResult>;
    };
  }
}

const EMPTY_SOURCES: ConnectedSourcePayload = {
  fetchedAt: "",
  cards: [],
  liveQuotes: [],
  warnings: []
};

const EMPTY_LOCAL_LLM: LocalLlmState = {
  available: false,
  baseUrl: "http://127.0.0.1:11434",
  selectedModel: "",
  models: []
};

const SURFACES: Surface[] = ["desk", "drivers", "sources", "lab"];
const MARKET_ORDER: MarketId[] = ["eu-ets", "k-ets", "cn-ets"];
const RANGE_OPTIONS: QuoteRangePreset[] = ["1d", "5d", "1m", "3m", "6m", "1y"];
const COPILOT_TASKS: CopilotTask[] = [
  "why-posture",
  "what-changed",
  "breakers",
  "verify-now"
];
const DEFAULT_COMPARE_QUOTE: Record<MarketId, string> = {
  "eu-ets": "co2-l-proxy",
  "k-ets": "krbn-proxy",
  "cn-ets": "krbn-proxy"
};
const PRIMARY_HEDGE_QUOTE: Record<MarketId, string> = {
  "eu-ets": "eua-dec-benchmark",
  "k-ets": "krbn-proxy",
  "cn-ets": "krbn-proxy"
};
const MARKET_THEMES: Record<
  MarketId,
  { accent: string; positive: string; negative: string; surface: string }
> = {
  "eu-ets": { accent: "#1d4ed8", positive: "#0ea86b", negative: "#e35d52", surface: "#eff6ff" },
  "k-ets": { accent: "#0f766e", positive: "#0ea86b", negative: "#e35d52", surface: "#ecfdf5" },
  "cn-ets": { accent: "#7c3aed", positive: "#0ea86b", negative: "#e35d52", surface: "#f5f3ff" }
};

const DRIVER_FAMILIES: Array<{
  id: string;
  ko: string;
  en: string;
  match: (driver: MarketDriver) => boolean;
}> = [
  {
    id: "policy",
    ko: "정책·공급",
    en: "Policy & Supply",
    match: (driver) =>
      /policy|supply|cap|reserve|calendar|compliance|allocation/i.test(
        `${driver.category} ${driver.variable}`
      )
  },
  {
    id: "power",
    ko: "전력·산업",
    en: "Power & Industry",
    match: (driver) => /power|industrial|manufacturing|industry/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "fuel",
    ko: "연료 전환",
    en: "Fuel Switching",
    match: (driver) => /fuel|gas|coal|oil|lng|spread/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "macro",
    ko: "거시·금융",
    en: "Macro & Financial",
    match: (driver) => /macro|financial|equity|credit|fx|exchange|call rate/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "weather",
    ko: "환경·기상",
    en: "Weather & Environment",
    match: (driver) => /weather|temperature|wind|hydro|aqi|environment/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "execution",
    ko: "유동성·집행",
    en: "Liquidity & Execution",
    match: (driver) => /microstructure|liquidity|auction|open interest|volume/i.test(`${driver.category} ${driver.variable}`)
  }
];

function t(locale: AppLocale, ko: string, en: string) {
  return locale === "ko" ? ko : en;
}

function getCopilotTaskLabel(locale: AppLocale, task: CopilotTask) {
  switch (task) {
    case "why-posture":
      return t(locale, "왜 지금 이런 판단인가", "Why this posture");
    case "what-changed":
      return t(locale, "오늘 바뀐 것만 요약", "What changed today");
    case "breakers":
      return t(locale, "이 판단이 깨지는 조건", "What breaks this view");
    case "verify-now":
      return t(locale, "지금 더 확인할 공식 근거", "What to verify now");
    default:
      return task;
  }
}

function getCopilotTaskPrompt(locale: AppLocale, task: CopilotTask) {
  switch (task) {
    case "why-posture":
      return t(
        locale,
        "현재 포지션이 왜 매수 우위, 관망, 비중 축소 중 하나로 읽히는지 근거 중심으로 설명하세요.",
        "Explain why the current posture leans buy, hold, or reduce using only the provided evidence."
      );
    case "what-changed":
      return t(
        locale,
        "오늘 데이터 기준으로 무엇이 바뀌었는지, 기존 판단에서 무엇이 달라졌는지 요약하세요.",
        "Summarize what changed in the latest data and what moved the desk read today."
      );
    case "breakers":
      return t(
        locale,
        "현재 판단을 약하게 만들거나 뒤집을 조건을 명확히 정리하세요.",
        "List the specific conditions that would weaken or reverse the current posture."
      );
    case "verify-now":
      return t(
        locale,
        "지금 추가로 확인해야 할 공식 문서, 일정, 데이터 상태를 우선순위대로 정리하세요.",
        "Prioritize the official documents, calendar items, and data checks that should be verified now."
      );
    default:
      return "";
  }
}

function getAssistantProviderLabel(locale: AppLocale, provider?: DecisionAssistantResponse["provider"]) {
  switch (provider) {
    case "ollama":
      return t(locale, "로컬 Ollama", "Local Ollama");
    case "openai":
      return "OpenAI";
    case "rule":
      return t(locale, "규칙 엔진", "Rule engine");
    default:
      return t(locale, "미연결", "Not connected");
  }
}

function readStoredString(key: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function readStoredLocale() {
  const value = readStoredString("cquant:locale", "ko");
  return value === "en" ? "en" : "ko";
}

function readStoredSurface() {
  const value = readStoredString("cquant:surface", "desk");
  return SURFACES.includes(value as Surface) ? (value as Surface) : "desk";
}

function readStoredMarket() {
  const value = readStoredString("cquant:market", "k-ets");
  return MARKET_ORDER.includes(value as MarketId) ? (value as MarketId) : "k-ets";
}

function formatDate(locale: AppLocale, value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || t(locale, "일자 미확인", "Date unavailable");
  }

  const includeTime = String(value).includes("T");

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit"
        }
      : {})
  }).format(parsed);
}

function formatRelativeDays(locale: AppLocale, value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return t(locale, "일자 미확인", "Date unavailable");
  }

  const days = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) return t(locale, "오늘 갱신", "Updated today");
  if (days === 1) return t(locale, "1일 경과", "1 day old");
  return t(locale, `${days}일 경과`, `${days} days old`);
}

function formatNumber(locale: AppLocale, value: number, digits = 2) {
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatPercent(locale: AppLocale, value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "계산 불가", "n/a");
  }
  const signed = value > 0 ? "+" : "";
  return `${signed}${formatNumber(locale, value, digits)}%`;
}

function formatSigned(locale: AppLocale, value: number | null, suffix = "") {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "계산 불가", "n/a");
  }
  const signed = value > 0 ? "+" : "";
  return `${signed}${formatNumber(locale, value, 2)}${suffix}`;
}

function parseMetricNumber(value: string) {
  const match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function findMetric(card: ConnectedSourceCard | null, labels: string[]) {
  if (!card) {
    return null;
  }
  const lowered = labels.map((item) => item.toLowerCase());
  return (
    card.metrics.find((metric) =>
      lowered.some((label) => metric.label.toLowerCase().includes(label))
    ) ?? null
  );
}

function toChartPoints(series: ConnectedSourceSeriesPoint[] | undefined): ChartPoint[] {
  return (series ?? [])
    .filter((point) => Number.isFinite(point.value))
    .map((point) => ({
      label: point.date,
      value: point.value
    }));
}

function buildVolumePoints(series: ConnectedSourceSeriesPoint[] | undefined): ChartPoint[] {
  return (series ?? [])
    .filter((point) => Number.isFinite(point.volume))
    .map((point) => ({
      label: point.date,
      value: Number(point.volume)
    }));
}

function getOfficialPriceLabel(card: ConnectedSourceCard | null) {
  return (
    findMetric(card, ["auction price", "close", "year-end close", "average price"])?.value ??
    "n/a"
  );
}

function getOfficialPriceValue(card: ConnectedSourceCard | null) {
  return parseMetricNumber(getOfficialPriceLabel(card));
}

function getOfficialChangeLabel(card: ConnectedSourceCard | null) {
  return findMetric(card, ["return", "day change", "price change"])?.value ?? "n/a";
}

function calculateReturnPct(points: ChartPoint[]) {
  if (points.length < 2 || points[0].value === 0) {
    return null;
  }
  return ((points[points.length - 1].value - points[0].value) / Math.abs(points[0].value)) * 100;
}

function getOfficialChangePct(card: ConnectedSourceCard | null) {
  const returnMetric = findMetric(card, ["return"]);
  if (returnMetric) {
    return parseMetricNumber(returnMetric.value);
  }

  const series = toChartPoints(card?.series);
  if (series.length >= 2) {
    return calculateReturnPct(series);
  }

  const changeMetric = findMetric(card, ["day change", "price change"]);
  const changeValue = changeMetric ? parseMetricNumber(changeMetric.value) : null;
  const priceValue = getOfficialPriceValue(card);

  if (changeValue !== null && priceValue && priceValue !== 0) {
    return ((changeValue / Math.abs(priceValue - changeValue)) * 100) || null;
  }

  return null;
}

function getOfficialVolumeLabel(card: ConnectedSourceCard | null) {
  return findMetric(card, ["auction volume", "volume", "annual volume"])?.value ?? "n/a";
}

function getOfficialMethod(card: ConnectedSourceCard | null, locale: AppLocale) {
  if (!card) {
    return t(locale, "연결 전", "Unavailable");
  }

  if (card.id === "eu-ets-official") {
    return t(locale, "공식 파일", "Official file");
  }
  if (card.id === "k-ets-official") {
    return t(locale, "공식 웹/API 샘플", "Official web/API sample");
  }
  return t(locale, "공식 웹 흐름", "Official web flow");
}

function correlation(left: number[], right: number[]) {
  if (left.length !== right.length || left.length < 3) {
    return null;
  }

  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }

  if (!leftVariance || !rightVariance) {
    return null;
  }

  return numerator / Math.sqrt(leftVariance * rightVariance);
}

function normalizeSeriesBucket(label: string) {
  const parsed = new Date(label);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return label.includes("T") ? label.slice(0, 10) : label;
}

function collapseSeriesByBucket(points: ChartPoint[]) {
  const buckets = new Map<string, ChartPoint>();

  for (const point of points) {
    const bucket = normalizeSeriesBucket(point.label);
    buckets.set(bucket, {
      label: bucket,
      value: point.value
    });
  }

  return Array.from(buckets.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function compareSeries(
  officialPoints: ChartPoint[],
  benchmarkPoints: ChartPoint[]
): { points: MultiLinePoint[]; stats: CompareStats } {
  const officialCollapsed = collapseSeriesByBucket(officialPoints);
  const benchmarkByBucket = new Map(
    collapseSeriesByBucket(benchmarkPoints).map((point) => [normalizeSeriesBucket(point.label), point])
  );
  const alignedPairs = officialCollapsed
    .map((point) => {
      const benchmark = benchmarkByBucket.get(normalizeSeriesBucket(point.label));
      return benchmark
        ? {
            label: normalizeSeriesBucket(point.label),
            official: point,
            benchmark
          }
        : null;
    })
    .filter(Boolean) as Array<{
    label: string;
    official: ChartPoint;
    benchmark: ChartPoint;
  }>;
  const overlap = alignedPairs.length;

  if (overlap < 2) {
    return {
      points: [],
      stats: {
        overlapCount: overlap,
        gapPct: null,
        correlation: null,
        directionMatchPct: null,
        officialReturnPct: null,
        benchmarkReturnPct: null
      }
    };
  }

  const officialSlice = alignedPairs.map((pair) => pair.official);
  const benchmarkSlice = alignedPairs.map((pair) => pair.benchmark);
  const officialBase = officialSlice[0].value || 1;
  const benchmarkBase = benchmarkSlice[0].value || 1;

  const points: MultiLinePoint[] = alignedPairs.map((pair, index) => ({
    label: pair.label,
    values: {
      official: (officialSlice[index].value / officialBase) * 100,
      benchmark: (benchmarkSlice[index].value / benchmarkBase) * 100
    }
  }));

  const officialReturns = officialSlice.slice(1).map((point, index) => {
    const previous = officialSlice[index].value;
    return previous === 0 ? 0 : (point.value - previous) / previous;
  });
  const benchmarkReturns = benchmarkSlice.slice(1).map((point, index) => {
    const previous = benchmarkSlice[index].value;
    return previous === 0 ? 0 : (point.value - previous) / previous;
  });

  let directionMatches = 0;
  for (let index = 0; index < Math.min(officialReturns.length, benchmarkReturns.length); index += 1) {
    if (Math.sign(officialReturns[index]) === Math.sign(benchmarkReturns[index])) {
      directionMatches += 1;
    }
  }

  const officialReturnPct = calculateReturnPct(officialSlice);
  const benchmarkReturnPct = calculateReturnPct(benchmarkSlice);

  return {
    points,
    stats: {
      overlapCount: overlap,
      gapPct:
        officialReturnPct !== null && benchmarkReturnPct !== null
          ? officialReturnPct - benchmarkReturnPct
          : null,
      correlation: correlation(officialReturns, benchmarkReturns),
      directionMatchPct:
        officialReturns.length > 0 ? (directionMatches / officialReturns.length) * 100 : null,
      officialReturnPct,
      benchmarkReturnPct
    }
  };
}

function getFamilyId(driver: MarketDriver) {
  return (
    DRIVER_FAMILIES.find((family) => family.match(driver))?.id ??
    DRIVER_FAMILIES[DRIVER_FAMILIES.length - 1].id
  );
}

function getDriverFamilyLabel(locale: AppLocale, familyId: string) {
  const family = DRIVER_FAMILIES.find((item) => item.id === familyId);
  return family ? t(locale, family.ko, family.en) : familyId;
}

function getMarketChecklist(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return [
      t(locale, "다음 EEX 경매 일정과 직전 커버율 확인", "Check the next EEX auction date and latest cover ratio"),
      t(locale, "TTF 가스와 전력 스프레드 방향 재확인", "Re-check TTF gas and power spread direction"),
      t(locale, "MSR·TNAC 관련 공식 발표 여부 확인", "Review any MSR or TNAC-related official notice")
    ];
  }
  if (marketId === "k-ets") {
    return [
      t(locale, "KAU 거래량이 20일 평균 위인지 확인", "Check whether KAU volume is above the 20-day average"),
      t(locale, "이행 시즌·검증보고 일정 진입 여부 확인", "Check whether the market is entering the compliance/reporting window"),
      t(locale, "KCU/KOC와 현물 체결 흐름 분리 여부 확인", "Confirm whether offset flow is diverging from the main tape")
    ];
  }
  return [
    t(locale, "공식 공지 이후 새 가격 테이프가 있는지 확인", "Check whether a new official price tape has appeared after the latest notice"),
    t(locale, "섹터 확대·배정 규칙 공시 여부 확인", "Review any sector expansion or allocation update"),
    t(locale, "프록시와 공식 공지 흐름을 분리해서 읽기", "Keep proxy price action separate from official policy flow")
  ];
}

function buildDecisionSummary(
  locale: AppLocale,
  market: MarketProfile,
  card: ConnectedSourceCard | null,
  benchmark: MarketLiveQuote | null,
  stats: CompareStats
): DecisionSummary {
  const officialMove = getOfficialChangePct(card);
  const benchmarkMove = benchmark?.changePct ?? stats.benchmarkReturnPct;
  const freshnessDays = card?.asOf
    ? Math.max(0, Math.floor((Date.now() - new Date(card.asOf).getTime()) / (1000 * 60 * 60 * 24)))
    : 99;

  const officialScore =
    officialMove === null ? 0 : officialMove > 0.3 ? 0.24 : officialMove < -0.3 ? -0.24 : 0;
  const benchmarkScore =
    benchmarkMove === null ? 0 : benchmarkMove > 0.3 ? 0.2 : benchmarkMove < -0.3 ? -0.2 : 0;
  const agreementScore =
    stats.correlation === null
      ? 0
      : stats.correlation > 0.5 && (stats.gapPct === null || Math.abs(stats.gapPct) < 3)
        ? 0.16
        : stats.correlation < 0
          ? -0.16
          : 0.04;
  const freshnessScore =
    freshnessDays <= 3 ? 0.14 : freshnessDays <= 10 ? 0.08 : freshnessDays <= 30 ? -0.04 : -0.18;
  const sourcePenalty =
    card?.status === "connected" ? 0.08 : card?.status === "limited" ? -0.08 : -0.18;
  const proxyPenalty =
    benchmark?.category === "Listed proxy" ? -0.04 : benchmark?.category === "Benchmark futures" ? 0.06 : 0;
  const score = Math.max(
    -1,
    Math.min(1, officialScore + benchmarkScore + agreementScore + freshnessScore + sourcePenalty + proxyPenalty)
  );
  const confidence = Math.max(
    0.2,
    Math.min(
      0.94,
      0.36 +
        (card ? 0.12 : 0) +
        (benchmark ? 0.12 : 0) +
        (stats.correlation !== null ? 0.08 : 0) +
        (freshnessDays <= 10 ? 0.1 : 0) -
        (card?.status === "limited" ? 0.08 : 0)
    )
  );
  const stance = score > 0.18 ? "buy" : score < -0.18 ? "reduce" : "hold";
  const supportDrivers = market.drivers
    .slice()
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3);

  return {
    stance,
    score,
    confidence,
    summary:
      stance === "buy"
        ? t(locale, "공식값과 비교 기준이 비교적 같은 방향입니다. 지금은 매수 우위 해석이 가능합니다.", "Official tape and listed benchmark are mostly aligned. The current read leans buy.")
        : stance === "reduce"
          ? t(locale, "공식값과 비교 기준이 약해지거나 어긋납니다. 지금은 비중 축소 쪽이 안전합니다.", "The official anchor and listed benchmark are weakening or diverging. Reducing risk is cleaner here.")
          : t(locale, "한쪽 방향으로 밀기보다 공식값 유지와 비교 기준 합의를 더 확인할 구간입니다.", "This is a wait zone. Confirm the official anchor and benchmark agreement before leaning harder."),
    support: [
      {
        title: t(locale, "공식 기준값", "Official anchor"),
        detail: t(locale, `${card?.sourceName ?? "공식 소스"} 변화는 ${getOfficialChangeLabel(card)}입니다.`, `${card?.sourceName ?? "Official source"} is showing ${getOfficialChangeLabel(card)}.`)
      },
      {
        title: t(locale, "상장 기준", "Listed benchmark"),
        detail: t(locale, `${benchmark?.title ?? "비교 기준 없음"} 변화율은 ${formatPercent(locale, benchmarkMove, 2)}입니다.`, `${benchmark?.title ?? "No benchmark selected"} is moving ${formatPercent(locale, benchmarkMove, 2)}.`)
      },
      {
        title: t(locale, "핵심 요인", "Top drivers"),
        detail: supportDrivers.map((driver) => driver.variable).join(" · ")
      }
    ],
    risks: [
      benchmark?.category === "Listed proxy"
        ? t(locale, "현재 비교 기준은 프록시입니다. 공식 정산값과 1:1로 읽으면 안 됩니다.", "The active benchmark is a proxy. Do not read it as a one-for-one replacement for the official settlement.")
        : t(locale, "무료 피드 기준 상장 테이프는 거래소 지연이 있을 수 있습니다.", "On free feeds the listed tape can still carry exchange delay."),
      card?.status === "limited"
        ? t(locale, "공식 소스가 제한 상태라 신뢰도를 낮춰야 합니다.", "The official source is limited, so conviction should be discounted.")
        : t(locale, "공식 소스가 연결돼 있어도 다음 갱신 전에는 판단이 바뀔 수 있습니다.", "Even with the official source connected, the read can change before the next update."),
      stats.correlation !== null && stats.correlation < 0.2
        ? t(locale, "공식값과 비교 기준의 최근 동행성이 약합니다.", "Recent co-movement between the official anchor and the benchmark is weak.")
        : t(locale, "현재 판단은 최근 동행성이 유지된다는 가정에 서 있습니다.", "The current read assumes recent tape agreement continues.")
    ],
    checks: getMarketChecklist(locale, market.id),
    waterfall: [
      { label: t(locale, "공식값", "Official"), value: officialScore },
      { label: t(locale, "비교 기준", "Benchmark"), value: benchmarkScore },
      { label: t(locale, "합의도", "Agreement"), value: agreementScore },
      { label: t(locale, "신선도", "Freshness"), value: freshnessScore },
      { label: t(locale, "소스", "Source"), value: sourcePenalty + proxyPenalty }
    ]
  };
}

function chooseDefaultQuote(marketId: MarketId, quotes: MarketLiveQuote[]) {
  const target = DEFAULT_COMPARE_QUOTE[marketId];
  const available = quotes.filter((quote) => quote.markets.includes(marketId) || quote.markets.includes("shared"));
  return (
    available.find((quote) => quote.id === target)?.id ??
    available.find((quote) => quote.series.length > 1)?.id ??
    available[0]?.id ??
    ""
  );
}

function getSourceTone(status: ConnectedSourceCard["status"] | MarketLiveQuote["status"]) {
  if (status === "connected") return "positive";
  if (status === "limited") return "neutral";
  return "negative";
}

function getStanceLabel(locale: AppLocale, stance: DecisionSummary["stance"]) {
  if (stance === "buy") return t(locale, "매수 우위", "Buy bias");
  if (stance === "reduce") return t(locale, "비중 축소", "Reduce");
  return t(locale, "관망", "Hold / wait");
}

function getSurfaceLabel(locale: AppLocale, surface: Surface) {
  if (surface === "desk") return t(locale, "데스크", "Desk");
  if (surface === "drivers") return t(locale, "드라이버", "Drivers");
  if (surface === "sources") return t(locale, "소스", "Sources");
  return t(locale, "실험실", "Lab");
}

function getMarketHeadline(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return t(locale, "EEX 경매값과 상장 헤지 기준을 같이 읽는 유럽 배출권 데스크", "EU carbon desk built around EEX auctions and listed hedge anchors");
  }
  if (marketId === "k-ets") {
    return t(locale, "공식 KRX 시세와 거래량을 기준으로 읽는 국내 배출권 데스크", "Korean carbon desk centered on official KRX tape and trading depth");
  }
  return t(locale, "정책 공지와 제한된 공식 시계열을 분리해서 읽는 중국 배출권 데스크", "China carbon desk that separates policy flow from limited official time series");
}

function buildSummaryText(
  locale: AppLocale,
  market: MarketProfile,
  card: ConnectedSourceCard | null,
  benchmark: MarketLiveQuote | null,
  decision: DecisionSummary
) {
  return [
    `C-Quant ${market.name}`,
    "",
    t(locale, "공식 소스", "Official source"),
    `${card?.sourceName ?? "n/a"} · ${card?.asOf ?? "n/a"}`,
    "",
    t(locale, "공식 가격", "Official anchor"),
    `${getOfficialPriceLabel(card)} / ${getOfficialChangeLabel(card)}`,
    "",
    t(locale, "비교 기준", "Benchmark"),
    `${benchmark?.title ?? "n/a"} / ${benchmark?.symbol ?? "n/a"} / ${benchmark ? formatPercent(locale, benchmark.changePct, 2) : "n/a"}`,
    "",
    t(locale, "현재 포지션", "Current stance"),
    `${getStanceLabel(locale, decision.stance)} · ${Math.round(decision.confidence * 100)}%`,
    "",
    t(locale, "핵심 해석", "Desk read"),
    decision.summary,
    "",
    t(locale, "근거", "Support"),
    ...decision.support.map((item) => `- ${item.title}: ${item.detail}`),
    "",
    t(locale, "점검할 것", "Checks"),
    ...decision.checks.map((item) => `- ${item}`)
  ].join("\n");
}

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(readStoredLocale);
  const [surface, setSurface] = useState<Surface>(readStoredSurface);
  const [marketId, setMarketId] = useState<MarketId>(readStoredMarket);
  const [quoteRange, setQuoteRange] = useState<QuoteRangePreset>("3m");
  const [quoteRefreshTick, setQuoteRefreshTick] = useState(0);
  const [connectedSources, setConnectedSources] = useState<ConnectedSourcePayload>(EMPTY_SOURCES);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [localLlmState, setLocalLlmState] = useState<LocalLlmState>(EMPTY_LOCAL_LLM);
  const [localLlmLoading, setLocalLlmLoading] = useState(false);
  const [localLlmSaving, setLocalLlmSaving] = useState(false);
  const [localLlmError, setLocalLlmError] = useState<string | null>(null);
  const [copilotTask, setCopilotTask] = useState<CopilotTask>("why-posture");
  const [copilotResponse, setCopilotResponse] = useState<DecisionAssistantResponse | null>(null);
  const [compareQuoteByMarket, setCompareQuoteByMarket] = useState<Record<MarketId, string>>({
    "eu-ets": readStoredString("cquant:quote:eu-ets", DEFAULT_COMPARE_QUOTE["eu-ets"]),
    "k-ets": readStoredString("cquant:quote:k-ets", DEFAULT_COMPARE_QUOTE["k-ets"]),
    "cn-ets": readStoredString("cquant:quote:cn-ets", DEFAULT_COMPARE_QUOTE["cn-ets"])
  });
  const [compareQuoteHistory, setCompareQuoteHistory] = useState<MarketLiveQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [strategy, setStrategy] = useState<BacktestStrategy>("trend");
  const [feeBps, setFeeBps] = useState(5);
  const [backtestRun, setBacktestRun] = useState<BacktestRun | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [walkForwardRun, setWalkForwardRun] = useState<WalkForwardResult | null>(null);
  const [walkForwardLoading, setWalkForwardLoading] = useState(false);
  const [walkForwardError, setWalkForwardError] = useState<string | null>(null);
  const [trainWindow, setTrainWindow] = useState(180);
  const [horizon, setHorizon] = useState(5);
  const [scenarioState, setScenarioState] = useState<Record<string, number>>({});

  const selectedMarket = useMemo(
    () => marketProfiles.find((item) => item.id === marketId) ?? marketProfiles[1],
    [marketId]
  );
  const selectedSchema = useMemo(
    () =>
      marketDatasetSchemas.find((item) => item.marketId === marketId) ??
      marketDatasetSchemas[0],
    [marketId]
  );
  const officialCardsByMarket = useMemo(
    () =>
      Object.fromEntries(
        connectedSources.cards.map((card) => [card.marketId, card])
      ) as Record<MarketId, ConnectedSourceCard | undefined>,
    [connectedSources.cards]
  );
  const marketQuotes = useMemo(
    () =>
      connectedSources.liveQuotes
        .filter((quote) => quote.markets.includes(marketId) || quote.markets.includes("shared"))
        .sort((left, right) => {
          const leftPrimary = left.id === PRIMARY_HEDGE_QUOTE[marketId] ? -1 : 0;
          const rightPrimary = right.id === PRIMARY_HEDGE_QUOTE[marketId] ? -1 : 0;
          return leftPrimary - rightPrimary || left.title.localeCompare(right.title);
        }),
    [connectedSources.liveQuotes, marketId]
  );
  const selectedCompareQuoteId = compareQuoteByMarket[marketId];
  const selectedCompareQuote = useMemo(
    () =>
      compareQuoteHistory?.id === selectedCompareQuoteId
        ? compareQuoteHistory
        : marketQuotes.find((quote) => quote.id === selectedCompareQuoteId) ?? null,
    [compareQuoteHistory, marketQuotes, selectedCompareQuoteId]
  );
  const hedgeAnchorQuote = useMemo(
    () =>
      marketQuotes.find((quote) => quote.id === PRIMARY_HEDGE_QUOTE[marketId]) ??
      selectedCompareQuote,
    [marketId, marketQuotes, selectedCompareQuote]
  );
  const selectedOfficialCard = officialCardsByMarket[marketId] ?? null;
  const officialSeries = useMemo(
    () => toChartPoints(selectedOfficialCard?.series),
    [selectedOfficialCard]
  );
  const officialVolumeSeries = useMemo(
    () => buildVolumePoints(selectedOfficialCard?.volumeSeries),
    [selectedOfficialCard]
  );
  const comparePoints = useMemo(
    () => toChartPoints(selectedCompareQuote?.series),
    [selectedCompareQuote]
  );
  const compareOutput = useMemo(
    () => compareSeries(officialSeries, comparePoints),
    [officialSeries, comparePoints]
  );
  const selectedDecision = useMemo(
    () =>
      buildDecisionSummary(
        locale,
        selectedMarket,
        selectedOfficialCard,
        hedgeAnchorQuote,
        compareOutput.stats
      ),
    [compareOutput.stats, hedgeAnchorQuote, locale, selectedMarket, selectedOfficialCard]
  );
  const copilotPayload = useMemo(
    () => ({
      market: {
        id: selectedMarket.id,
        name: selectedMarket.name,
        region: selectedMarket.region,
        stageNote: selectedMarket.stageNote,
        scopeNote: selectedMarket.scopeNote,
        sourceNote: selectedMarket.sourceNote
      },
      officialAnchor: selectedOfficialCard
        ? {
            sourceName: selectedOfficialCard.sourceName,
            coverage: selectedOfficialCard.coverage,
            status: selectedOfficialCard.status,
            asOf: selectedOfficialCard.asOf,
            headline: selectedOfficialCard.headline,
            summary: selectedOfficialCard.summary,
            metrics: selectedOfficialCard.metrics,
            notes: selectedOfficialCard.notes
          }
        : null,
      liveTape: selectedCompareQuote
        ? {
            id: selectedCompareQuote.id,
            title: selectedCompareQuote.title,
            symbol: selectedCompareQuote.symbol,
            category: selectedCompareQuote.category,
            provider: selectedCompareQuote.provider,
            exchange: selectedCompareQuote.exchange,
            status: selectedCompareQuote.status,
            asOf: selectedCompareQuote.asOf,
            price: selectedCompareQuote.price,
            change: selectedCompareQuote.change,
            changePct: selectedCompareQuote.changePct,
            currency: selectedCompareQuote.currency,
            role: selectedCompareQuote.role,
            note: selectedCompareQuote.note,
            delayNote: selectedCompareQuote.delayNote
          }
        : null,
      compareStats: compareOutput.stats,
      deskRead: {
        stance: getStanceLabel(locale, selectedDecision.stance),
        score: selectedDecision.score,
        confidence: selectedDecision.confidence,
        summary: selectedDecision.summary,
        support: selectedDecision.support,
        risks: selectedDecision.risks,
        checks: selectedDecision.checks,
        waterfall: selectedDecision.waterfall
      },
      topDrivers: selectedMarket.drivers
        .slice()
        .sort((left, right) => right.weight - left.weight)
        .slice(0, 6)
        .map((driver) => ({
          category: driver.category,
          variable: driver.variable,
          weight: driver.weight,
          direction: driver.direction,
          importance: driver.importance,
          note: driver.note
        })),
      sourceFreshness: {
        officialStatus: selectedOfficialCard?.status ?? "error",
        officialAsOf: selectedOfficialCard?.asOf ?? "",
        liveTapeStatus: selectedCompareQuote?.status ?? "error",
        liveTapeAsOf: selectedCompareQuote?.asOf ?? "",
        appFetchedAt: connectedSources.fetchedAt
      }
    }),
    [
      compareOutput.stats,
      connectedSources.fetchedAt,
      locale,
      selectedCompareQuote,
      selectedDecision,
      selectedMarket,
      selectedOfficialCard
    ]
  );
  const marketBoardRows = useMemo<MarketBoardRow[]>(
    () =>
      MARKET_ORDER.map((id) => {
        const market = marketProfiles.find((item) => item.id === id) ?? marketProfiles[0];
        const officialCard = officialCardsByMarket[id] ?? null;
        const marketLiveQuotes = connectedSources.liveQuotes.filter(
          (quote) => quote.markets.includes(id) || quote.markets.includes("shared")
        );
        const hedgeQuote =
          marketLiveQuotes.find((quote) => quote.id === PRIMARY_HEDGE_QUOTE[id]) ??
          marketLiveQuotes.find((quote) => quote.id === DEFAULT_COMPARE_QUOTE[id]) ??
          marketLiveQuotes[0] ??
          null;
        const stats = compareSeries(
          toChartPoints(officialCard?.series),
          toChartPoints(hedgeQuote?.series)
        ).stats;
        return {
          market,
          officialCard,
          hedgeQuote,
          compareStats: stats,
          decision: buildDecisionSummary(locale, market, officialCard, hedgeQuote, stats)
        };
      }),
    [connectedSources.liveQuotes, locale, officialCardsByMarket]
  );
  const familyHeatmapRows = useMemo<HeatmapRow[]>(
    () =>
      DRIVER_FAMILIES.map((family) => ({
        id: family.id,
        label: t(locale, family.ko, family.en),
        values: MARKET_ORDER.map((id) => {
          const profile = marketProfiles.find((item) => item.id === id) ?? marketProfiles[0];
          const decision = marketBoardRows.find((row) => row.market.id === id)?.decision;
          const totalWeight = profile.drivers
            .filter((driver) => family.match(driver))
            .reduce((sum, driver) => sum + driver.weight, 0);
          const normalized = Math.min(totalWeight / 3, 1);
          const direction =
            decision?.stance === "buy" ? 1 : decision?.stance === "reduce" ? -1 : 0;
          return normalized * direction;
        })
      })),
    [locale, marketBoardRows]
  );
  const driverRows = useMemo(
    () =>
      selectedMarket.drivers
        .slice()
        .sort((left, right) => right.weight - left.weight)
        .map((driver) => ({
          ...driver,
          familyId: getFamilyId(driver),
          familyLabel: getDriverFamilyLabel(locale, getFamilyId(driver))
        })),
    [locale, selectedMarket]
  );
  const benchmarkOptions = useMemo(
    () => marketQuotes.filter((quote) => quote.status !== "error"),
    [marketQuotes]
  );
  const comparisonSeries = useMemo<MultiLineSeries[]>(
    () => [
      { id: "official", label: t(locale, "공식값", "Official"), color: MARKET_THEMES[marketId].accent },
      {
        id: "benchmark",
        label: selectedCompareQuote?.symbol ?? t(locale, "비교 기준", "Benchmark"),
        color: "#111827"
      }
    ],
    [locale, marketId, selectedCompareQuote]
  );
  const scenarioDrivers = useMemo(
    () =>
      selectedMarket.drivers
        .slice()
        .sort((left, right) => right.weight - left.weight)
        .slice(0, 6),
    [selectedMarket]
  );
  const scenarioForecast = useMemo(
    () => buildForecast(marketId, scenarioState),
    [marketId, scenarioState]
  );
  const scenarioWaterfall = useMemo(
    () =>
      scenarioForecast.contributions.slice(0, 6).map((item) => ({
        label: item.variable.length > 22 ? `${item.variable.slice(0, 22)}…` : item.variable,
        value: item.contribution
      })),
    [scenarioForecast.contributions]
  );
  const backtestCurve = useMemo<ChartPoint[]>(
    () =>
      backtestRun
        ? backtestRun.equityCurve.map((value, index) => ({
            label: `${index + 1}`,
            value
          }))
        : [],
    [backtestRun]
  );
  const selectedTheme = MARKET_THEMES[marketId];

  useEffect(() => {
    try {
      window.localStorage.setItem("cquant:locale", locale);
      window.localStorage.setItem("cquant:surface", surface);
      window.localStorage.setItem("cquant:market", marketId);
      window.localStorage.setItem(`cquant:quote:${marketId}`, selectedCompareQuoteId || "");
    } catch {}
  }, [locale, surface, marketId, selectedCompareQuoteId]);

  useEffect(() => {
    const nextState: Record<string, number> = {};
    for (const driver of scenarioDrivers) {
      nextState[driver.id] = 0;
    }
    setScenarioState(nextState);
  }, [scenarioDrivers]);

  useEffect(() => {
    const nextId = chooseDefaultQuote(marketId, connectedSources.liveQuotes);
    if (!selectedCompareQuoteId && nextId) {
      setCompareQuoteByMarket((current) => ({ ...current, [marketId]: nextId }));
      return;
    }
    if (selectedCompareQuoteId && !benchmarkOptions.some((quote) => quote.id === selectedCompareQuoteId)) {
      setCompareQuoteByMarket((current) => ({ ...current, [marketId]: nextId }));
    }
  }, [benchmarkOptions, connectedSources.liveQuotes, marketId, selectedCompareQuoteId]);

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (!bridge) {
      setSourcesLoading(false);
      setSourcesError("Desktop bridge unavailable.");
      return;
    }
    let cancelled = false;
    async function loadSources() {
      setSourcesLoading(true);
      setSourcesError(null);
      try {
        const payload = await bridge.refreshConnectedSources();
        if (!cancelled) {
          setConnectedSources(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setSourcesError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setSourcesLoading(false);
        }
      }
    }
    void loadSources();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (!bridge || !selectedCompareQuoteId) {
      setCompareQuoteHistory(null);
      return;
    }
    let cancelled = false;
    async function loadQuoteHistory() {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const payload = await bridge.getLiveQuoteHistory({
          quoteId: selectedCompareQuoteId,
          range: quoteRange
        });
        if (!cancelled) {
          setCompareQuoteHistory(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setQuoteError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }
    void loadQuoteHistory();
    return () => {
      cancelled = true;
    };
  }, [quoteRange, quoteRefreshTick, selectedCompareQuoteId]);

  useEffect(() => {
    if (!selectedCompareQuoteId) {
      return;
    }

    const timer = window.setInterval(() => {
      setQuoteRefreshTick((current) => current + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [selectedCompareQuoteId]);

  useEffect(() => {
    setCopilotResponse(null);
    setLocalLlmError(null);
  }, [marketId, selectedCompareQuoteId]);

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (!bridge?.getLocalLlmState) {
      return;
    }

    let cancelled = false;

    async function loadLocalLlmState() {
      try {
        const payload = await bridge.getLocalLlmState();
        if (!cancelled) {
          setLocalLlmState(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setLocalLlmError(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadLocalLlmState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    const bridge = window.desktopBridge;
    if (!bridge) return;
    setSourcesLoading(true);
    setSourcesError(null);
    try {
      const payload = await bridge.refreshConnectedSources();
      startTransition(() => {
        setConnectedSources(payload);
      });
    } catch (error) {
      setSourcesError(error instanceof Error ? error.message : String(error));
    } finally {
      setSourcesLoading(false);
    }
  }

  async function handleSaveLocalLlmSettings() {
    const bridge = window.desktopBridge;
    if (!bridge?.saveLocalLlmSettings) {
      return;
    }

    setLocalLlmSaving(true);
    setLocalLlmError(null);

    try {
      const payload = await bridge.saveLocalLlmSettings({
        ollamaBaseUrl: localLlmState.baseUrl,
        ollamaModel: localLlmState.selectedModel
      });
      setLocalLlmState(payload);
    } catch (error) {
      setLocalLlmError(error instanceof Error ? error.message : String(error));
    } finally {
      setLocalLlmSaving(false);
    }
  }

  async function handleRunLocalCopilot(task: CopilotTask) {
    const bridge = window.desktopBridge;
    if (!bridge?.runLocalDecisionAssistant) {
      return;
    }

    setCopilotTask(task);
    setLocalLlmLoading(true);
    setLocalLlmError(null);

    try {
      const response = await bridge.runLocalDecisionAssistant({
        locale,
        baseUrl: localLlmState.baseUrl,
        model: localLlmState.selectedModel,
        payload: {
          requestedBrief: getCopilotTaskPrompt(locale, task),
          task,
          ...copilotPayload
        }
      });

      setCopilotResponse(response);

      if (response.model && response.model !== localLlmState.selectedModel) {
        setLocalLlmState((current) => ({
          ...current,
          selectedModel: response.model || current.selectedModel
        }));
      }
    } catch (error) {
      setLocalLlmError(error instanceof Error ? error.message : String(error));
    } finally {
      setLocalLlmLoading(false);
    }
  }

  async function handleDownloadTemplate() {
    const bridge = window.desktopBridge;
    if (!bridge) return;
    await bridge.saveTextFile({
      defaultPath: selectedSchema.filename,
      content: datasetTemplates[selectedSchema.id]
    });
  }

  async function handleLoadCsv() {
    const bridge = window.desktopBridge;
    if (!bridge) return;
    const path = await bridge.pickCsvFile();
    if (!path) return;
    const text = await bridge.readTextFile(path);
    setCsvPath(path);
    setCsvText(text);
    setBacktestRun(null);
    setWalkForwardRun(null);
    setBacktestError(null);
    setWalkForwardError(null);
  }

  function handleRunBacktest() {
    if (!csvText) {
      setBacktestError(t(locale, "먼저 CSV를 불러오세요.", "Load a CSV first."));
      return;
    }
    try {
      const series = parseCsv(csvText);
      setBacktestRun(runBacktest(series, strategy, feeBps));
      setBacktestError(null);
    } catch (error) {
      setBacktestError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRunWalkForward() {
    const bridge = window.desktopBridge;
    if (!bridge || !csvPath) {
      setWalkForwardError(t(locale, "워크포워드 전에 CSV를 불러오세요.", "Load a CSV before running walk-forward."));
      return;
    }
    setWalkForwardLoading(true);
    setWalkForwardError(null);
    try {
      const result = await bridge.runWalkForwardModel({
        inputPath: csvPath,
        marketId,
        trainWindow,
        horizon
      });
      setWalkForwardRun(result);
    } catch (error) {
      setWalkForwardError(error instanceof Error ? error.message : String(error));
    } finally {
      setWalkForwardLoading(false);
    }
  }

  function handleScenarioChange(driverId: string, nextValue: number) {
    setScenarioState((current) => ({
      ...current,
      [driverId]: nextValue
    }));
  }

  function renderDesk() {
    return (
      <>
        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "시장 보드", "Market board")}</span>
              <h2>{t(locale, "세 시장을 같은 기준으로 보기", "Read all three markets on one frame")}</h2>
            </div>
            <p>
              {t(
                locale,
                "공식값, 실시간 비교 테이프, 괴리, 포지션을 한 줄씩 비교합니다.",
                "Compare official anchor, live tape, gap, and posture row by row."
              )}
            </p>
          </div>

          <div className="board-table">
            <div className="board-head">
              <span>{t(locale, "시장", "Market")}</span>
              <span>{t(locale, "공식값", "Official")}</span>
              <span>{t(locale, "실시간 테이프", "Live tape")}</span>
              <span>{t(locale, "괴리", "Gap")}</span>
              <span>{t(locale, "상관", "Correlation")}</span>
              <span>{t(locale, "포지션", "Stance")}</span>
            </div>

            {marketBoardRows.map((row) => (
              <button
                key={row.market.id}
                type="button"
                className={`board-row ${marketId === row.market.id ? "active" : ""}`}
                onClick={() => setMarketId(row.market.id)}
                title={`${row.market.name} · ${getOfficialPriceLabel(row.officialCard)} · ${getStanceLabel(locale, row.decision.stance)}`}
              >
                <div className="board-cell market">
                  <strong>{row.market.name}</strong>
                  <span>{row.officialCard?.sourceName ?? t(locale, "공식 소스 없음", "No official source")}</span>
                </div>
                <div className="board-cell">
                  <strong>{getOfficialPriceLabel(row.officialCard)}</strong>
                  <span>{getOfficialChangeLabel(row.officialCard)}</span>
                </div>
                <div className="board-cell">
                  <strong title={row.hedgeQuote?.title ?? row.hedgeQuote?.symbol ?? "n/a"}>
                    {row.hedgeQuote?.symbol ?? "n/a"}
                  </strong>
                  <span>
                    {row.hedgeQuote?.price !== null && row.hedgeQuote?.price !== undefined
                      ? `${row.hedgeQuote.currency} ${formatNumber(locale, row.hedgeQuote.price, 2)}`
                      : "n/a"}
                  </span>
                </div>
                <div className="board-cell">
                  <strong>{formatPercent(locale, row.compareStats.gapPct, 2)}</strong>
                  <span>{t(locale, "공식 대비", "vs official")}</span>
                </div>
                <div className="board-cell">
                  <strong>{formatSigned(locale, row.compareStats.correlation, "")}</strong>
                  <span>{formatPercent(locale, row.compareStats.directionMatchPct, 0)}</span>
                </div>
                <div className="board-cell stance">
                  <strong className={`stance-pill ${row.decision.stance}`}>
                    {getStanceLabel(locale, row.decision.stance)}
                  </strong>
                  <span>{Math.round(row.decision.confidence * 100)}%</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="desk-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "공식 앵커", "Official anchor")}</span>
                <h2>{selectedOfficialCard?.sourceName ?? t(locale, "공식 소스 없음", "No official source")}</h2>
              </div>
              <p>{`${getOfficialMethod(selectedOfficialCard, locale)} · ${formatDate(locale, selectedOfficialCard?.asOf ?? "")}`}</p>
            </div>

            <div className="metric-strip">
              <div className="metric-tile">
                <span>{t(locale, "공식 가격", "Official price")}</span>
                <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "변화", "Move")}</span>
                <strong>{getOfficialChangeLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "거래량", "Volume")}</span>
                <strong>{getOfficialVolumeLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "신선도", "Freshness")}</span>
                <strong>{formatRelativeDays(locale, selectedOfficialCard?.asOf ?? "")}</strong>
              </div>
            </div>

            <LineChart
              points={officialSeries}
              color={selectedTheme.accent}
              title={t(locale, "공식 시계열", "Official time series")}
              subtitle={selectedOfficialCard?.headline}
              locale={locale === "ko" ? "ko-KR" : "en-US"}
            />

            <div className="subsection">
              <div className="subsection-head">
                <strong>{t(locale, "공식 거래량", "Official volume")}</strong>
              </div>
              <ColumnChart points={officialVolumeSeries} color={selectedTheme.accent} />
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "실시간 비교 테이프", "Live comparison tape")}</span>
                <h2>{selectedCompareQuote?.title ?? t(locale, "비교 테이프 없음", "No live tape selected")}</h2>
              </div>
              <p>
                {quoteLoading
                  ? t(locale, "앱 안에서 시계열 갱신 중", "Refreshing in-app series")
                  : selectedCompareQuote?.delayNote ?? t(locale, "지연 정보 없음", "No delay note")}
              </p>
            </div>

            <div className="control-row">
              <div className="chip-group">
                {benchmarkOptions.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    className={`chip ${selectedCompareQuoteId === quote.id ? "active" : ""}`}
                    onClick={() =>
                      setCompareQuoteByMarket((current) => ({
                        ...current,
                        [marketId]: quote.id
                      }))
                    }
                  >
                    {quote.symbol}
                  </button>
                ))}
              </div>
              <div className="chip-group compact">
                {RANGE_OPTIONS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`chip ${quoteRange === range ? "active" : ""}`}
                    onClick={() => setQuoteRange(range)}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="metric-strip">
              <div className="metric-tile">
                <span>{t(locale, "실시간 테이프 가격", "Live tape price")}</span>
                <strong>
                  {selectedCompareQuote?.price !== null && selectedCompareQuote?.price !== undefined
                    ? `${selectedCompareQuote.currency} ${formatNumber(locale, selectedCompareQuote.price, 2)}`
                    : "n/a"}
                </strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "변화율", "Change")}</span>
                <strong>{formatPercent(locale, selectedCompareQuote?.changePct ?? null, 2)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "괴리", "Gap")}</span>
                <strong>{formatPercent(locale, compareOutput.stats.gapPct, 2)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "방향 일치", "Direction match")}</span>
                <strong>{formatPercent(locale, compareOutput.stats.directionMatchPct, 0)}</strong>
              </div>
            </div>

            <div className="feed-inline">
              <span className={`feed-pill tone-${getSourceTone(selectedCompareQuote?.status ?? "error")}`}>
                {selectedCompareQuote?.status === "connected"
                  ? t(locale, "연결됨", "Connected")
                  : selectedCompareQuote?.status === "limited"
                    ? t(locale, "제한", "Limited")
                    : t(locale, "오류", "Error")}
              </span>
              <span>{selectedCompareQuote?.provider ?? "n/a"}</span>
              <span>{selectedCompareQuote?.exchange || t(locale, "거래소 정보 없음", "No exchange")}</span>
              <span>{formatDate(locale, selectedCompareQuote?.asOf ?? "")}</span>
            </div>

            <LineChart
              points={comparePoints}
              color="#111827"
              title={selectedCompareQuote?.symbol ?? t(locale, "실시간 테이프", "Live tape")}
              subtitle={selectedCompareQuote?.role}
              locale={locale === "ko" ? "ko-KR" : "en-US"}
            />

            <div className="note-list">
              <div className="note-item">
                <strong>{t(locale, "지금 볼 것", "What to check now")}</strong>
                <p>{selectedDecision.checks[0]}</p>
              </div>
              <div className="note-item">
                <strong>{t(locale, "비교 기준 역할", "Why this benchmark")}</strong>
                <p>{selectedCompareQuote?.role ?? "n/a"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "비교 차트", "Relative chart")}</span>
              <h2>{t(locale, "공식값과 상장 기준을 같은 출발점으로 비교", "Compare official anchor and listed benchmark on one scale")}</h2>
            </div>
            <p>
              {t(locale, "같은 구간에서 100 기준으로 맞춰 움직임을 읽습니다.", "Both lines are normalized to 100 over the overlapping window.")}
            </p>
          </div>

          <MultiLineChart
            points={compareOutput.points}
            series={comparisonSeries}
            locale={locale === "ko" ? "ko-KR" : "en-US"}
          />
        </section>

        <section className="desk-three-up">
          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "판단 강도", "Posture")}</span>
                <h2>{getStanceLabel(locale, selectedDecision.stance)}</h2>
              </div>
            </div>
            <PressureBar
              value={selectedDecision.score}
              negativeLabel={t(locale, "축소", "Reduce")}
              neutralLabel={t(locale, "관망", "Hold")}
              positiveLabel={t(locale, "매수 우위", "Buy")}
            />
            <DonutMeter
              value={selectedDecision.confidence}
              label={t(locale, "신뢰도", "Confidence")}
              subLabel={selectedDecision.summary}
              color={selectedTheme.accent}
            />
          </div>

          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "점수 분해", "Score build")}</span>
                <h2>{t(locale, "어디서 점수가 생겼는지", "Where the score comes from")}</h2>
              </div>
            </div>
            <WaterfallChart
              items={selectedDecision.waterfall}
              positiveColor={selectedTheme.positive}
              negativeColor={selectedTheme.negative}
            />
          </div>

          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "판단 메모", "Decision memo")}</span>
                <h2>{t(locale, "지금 판단을 움직이는 것", "What is moving the read")}</h2>
              </div>
            </div>
            <ul className="bullet-list">
              {selectedDecision.support.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </>
    );
  }

  function renderDrivers() {
    return (
      <>
        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "가격 요인", "Driver map")}</span>
              <h2>{t(locale, "시장별 가격 결정 구조", "Cross-market driver structure")}</h2>
            </div>
            <p>
              {t(
                locale,
                "연구에서 확인된 요인을 가족별로 묶어 세 시장을 같이 읽습니다.",
                "Read the research-backed factor families across all three markets."
              )}
            </p>
          </div>

          <Heatmap
            columns={MARKET_ORDER.map((id) => (marketProfiles.find((item) => item.id === id) ?? marketProfiles[0]).name)}
            rows={familyHeatmapRows}
          />
        </section>

        <section className="drivers-grid">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "선택 시장", "Selected market")}</span>
                <h2>{selectedMarket.name}</h2>
              </div>
              <p>{selectedMarket.scopeNote}</p>
            </div>

            <div className="driver-table">
              <div className="driver-head">
                <span>{t(locale, "가족", "Family")}</span>
                <span>{t(locale, "변수", "Variable")}</span>
                <span>{t(locale, "중요도", "Weight")}</span>
                <span>{t(locale, "읽는 방식", "How to read")}</span>
              </div>
              {driverRows.map((driver) => (
                <div key={driver.id} className="driver-row">
                  <span>{driver.familyLabel}</span>
                  <strong>{driver.variable}</strong>
                  <span>{driver.importance}</span>
                  <p>{driver.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "퀀트 툴", "Quant tools")}</span>
                <h2>{t(locale, "실무에서 볼 지표", "Indicators worth running")}</h2>
              </div>
            </div>

            <ul className="indicator-list">
              {quantIndicators.slice(0, 4).map((indicator) => (
                <li key={indicator.id}>
                  <strong>{indicator.name}</strong>
                  <span>{indicator.bestFor}</span>
                  <p>{indicator.whyItMatters}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </>
    );
  }

  function renderSources() {
    return (
      <>
        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "공식 소스", "Official source")}</span>
              <h2>{selectedOfficialCard?.sourceName ?? t(locale, "공식 소스 없음", "No official source")}</h2>
            </div>
            <p>
              {t(
                locale,
                "자동 연결은 앱 안에서만 쓰고, 외부 페이지는 명시적으로 열 때만 나갑니다.",
                "The app uses sources in-app first. External pages only open when you explicitly ask for them."
              )}
            </p>
          </div>

          <div className="source-grid">
            <div className="source-block">
              <span>{t(locale, "소스 방법", "Access method")}</span>
              <strong>{getOfficialMethod(selectedOfficialCard, locale)}</strong>
            </div>
            <div className="source-block">
              <span>{t(locale, "갱신 일자", "As of")}</span>
              <strong>{formatDate(locale, selectedOfficialCard?.asOf ?? "")}</strong>
            </div>
            <div className="source-block">
              <span>{t(locale, "헤드라인", "Headline")}</span>
              <strong>{selectedOfficialCard?.headline ?? "n/a"}</strong>
            </div>
            <div className="source-block">
              <span>{t(locale, "상태", "Status")}</span>
              <strong className={`tone-${getSourceTone(selectedOfficialCard?.status ?? "error")}`}>
                {selectedOfficialCard?.status ?? "error"}
              </strong>
            </div>
          </div>

          <ul className="bullet-list">
            {(selectedOfficialCard?.notes ?? []).map((note) => (
              <li key={note}>
                <span>{note}</span>
              </li>
            ))}
          </ul>

          {selectedOfficialCard ? (
            <button
              type="button"
              className="button ghost"
              onClick={() => window.desktopBridge?.openExternal(selectedOfficialCard.sourceUrl)}
            >
              {t(locale, "원문 열기", "Open original")}
            </button>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "상장 기준 목록", "Listed benchmarks")}</span>
              <h2>{t(locale, "앱 안에서 보는 비교 기준", "Benchmarks used inside the desk")}</h2>
            </div>
          </div>

          <div className="source-list">
            {benchmarkOptions.map((quote) => (
              <div key={quote.id} className="source-row">
                <div>
                  <strong>{quote.title}</strong>
                  <span>{quote.role}</span>
                </div>
                <div>
                  <strong>{quote.symbol}</strong>
                  <span>{quote.provider}</span>
                </div>
                <div>
                  <strong>{quote.note}</strong>
                  <span>{quote.delayNote}</span>
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => window.desktopBridge?.openExternal(quote.sourceUrl)}
                >
                  {t(locale, "원문", "Source")}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "데이터 스키마", "Dataset schema")}</span>
              <h2>{selectedSchema.name}</h2>
            </div>
            <button type="button" className="button ghost" onClick={handleDownloadTemplate}>
              {t(locale, "CSV 템플릿 저장", "Save CSV template")}
            </button>
          </div>

          <ul className="schema-list">
            {selectedSchema.columns.map((column) => (
              <li key={column.name}>
                <strong>{column.name}</strong>
                <span>{column.required ? t(locale, "필수", "Required") : t(locale, "선택", "Optional")}</span>
                <p>{column.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </>
    );
  }

  function renderLab() {
    return (
      <section className="lab-grid">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "시나리오", "Scenario")}</span>
              <h2>{t(locale, "상위 요인으로 빠르게 가정 바꾸기", "Move the top drivers and read the scenario")}</h2>
            </div>
          </div>

          <div className="scenario-list">
            {scenarioDrivers.map((driver) => (
              <label key={driver.id} className="slider-row">
                <div>
                  <strong>{driver.variable}</strong>
                  <span>{driver.importance}</span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={scenarioState[driver.id] ?? 0}
                  onChange={(event) => handleScenarioChange(driver.id, Number(event.target.value))}
                />
                <strong>{formatSigned(locale, scenarioState[driver.id] ?? 0, "")}</strong>
              </label>
            ))}
          </div>

          <div className="metric-strip">
            <div className="metric-tile">
              <span>{t(locale, "방향", "Direction")}</span>
              <strong>{scenarioForecast.direction}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "점수", "Score")}</span>
              <strong>{formatSigned(locale, scenarioForecast.score, "")}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "신뢰도", "Confidence")}</span>
              <strong>{Math.round(scenarioForecast.confidence * 100)}%</strong>
            </div>
          </div>

          <WaterfallChart
            items={scenarioWaterfall}
            positiveColor={selectedTheme.positive}
            negativeColor={selectedTheme.negative}
          />
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "검증", "Validation")}</span>
              <h2>{t(locale, "CSV 백테스트와 워크포워드", "Backtest and walk-forward on your CSV")}</h2>
            </div>
            <div className="head-actions">
              <button type="button" className="button ghost" onClick={handleLoadCsv}>
                {t(locale, "CSV 불러오기", "Load CSV")}
              </button>
              <button type="button" className="button primary" onClick={handleRunBacktest}>
                {t(locale, "백테스트", "Run backtest")}
              </button>
            </div>
          </div>

          <div className="field-grid">
            <label>
              <span>{t(locale, "전략", "Strategy")}</span>
              <select value={strategy} onChange={(event) => setStrategy(event.target.value as BacktestStrategy)}>
                <option value="trend">Trend</option>
                <option value="meanReversion">Mean reversion</option>
                <option value="spreadRegime">Spread regime</option>
                <option value="policyMomentum">Policy momentum</option>
              </select>
            </label>
            <label>
              <span>{t(locale, "비용 (bps)", "Fee (bps)")}</span>
              <input type="number" min={0} value={feeBps} onChange={(event) => setFeeBps(Number(event.target.value))} />
            </label>
            <label>
              <span>{t(locale, "학습 구간", "Train window")}</span>
              <input type="number" min={30} value={trainWindow} onChange={(event) => setTrainWindow(Number(event.target.value))} />
            </label>
            <label>
              <span>{t(locale, "예측 수평", "Horizon")}</span>
              <input type="number" min={1} value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} />
            </label>
          </div>

          <div className="lab-actions">
            <span className="path-readout">{csvPath ?? t(locale, "아직 불러온 CSV 없음", "No CSV loaded yet")}</span>
            <button type="button" className="button ghost" onClick={handleRunWalkForward} disabled={walkForwardLoading}>
              {walkForwardLoading ? t(locale, "실행 중", "Running") : t(locale, "워크포워드", "Walk-forward")}
            </button>
          </div>

          {backtestError ? <div className="status-banner error">{backtestError}</div> : null}
          {walkForwardError ? <div className="status-banner error">{walkForwardError}</div> : null}

          {backtestRun ? (
            <>
              <div className="metric-strip">
                <div className="metric-tile">
                  <span>Total return</span>
                  <strong>{formatPercent(locale, backtestRun.metrics.totalReturnPct, 1)}</strong>
                </div>
                <div className="metric-tile">
                  <span>Sharpe</span>
                  <strong>{formatNumber(locale, backtestRun.metrics.sharpe, 2)}</strong>
                </div>
                <div className="metric-tile">
                  <span>Max drawdown</span>
                  <strong>{formatPercent(locale, backtestRun.metrics.maxDrawdownPct, 1)}</strong>
                </div>
                <div className="metric-tile">
                  <span>Trades</span>
                  <strong>{backtestRun.metrics.tradeCount}</strong>
                </div>
              </div>

              <LineChart
                points={backtestCurve}
                color={selectedTheme.accent}
                title={t(locale, "백테스트 곡선", "Backtest equity")}
                subtitle={csvPath ?? ""}
                locale={locale === "ko" ? "ko-KR" : "en-US"}
              />
            </>
          ) : null}

          {walkForwardRun ? (
            <div className="walkforward-summary">
              <div className="metric-strip">
                <div className="metric-tile">
                  <span>MAE</span>
                  <strong>{formatNumber(locale, walkForwardRun.summary.mae, 3)}</strong>
                </div>
                <div className="metric-tile">
                  <span>RMSE</span>
                  <strong>{formatNumber(locale, walkForwardRun.summary.rmse, 3)}</strong>
                </div>
                <div className="metric-tile">
                  <span>MAPE</span>
                  <strong>{formatPercent(locale, walkForwardRun.summary.mapePct, 2)}</strong>
                </div>
              </div>

              <ul className="bullet-list">
                {walkForwardRun.topFeatures.slice(0, 5).map((feature) => (
                  <li key={feature.name}>
                    <strong>{feature.name}</strong>
                    <span>{formatNumber(locale, feature.importance, 3)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function renderInspector() {
    return (
      <aside className="app-inspector">
        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "선택 시장", "Selected market")}</span>
          <h2>{selectedMarket.name}</h2>
          <p>{selectedMarket.stageNote}</p>
        </div>

        <div className="inspector-section">
          <div className="metric-strip inspector-strip">
            <div className="metric-tile">
              <span>{t(locale, "포지션", "Posture")}</span>
              <strong>{getStanceLabel(locale, selectedDecision.stance)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "신뢰도", "Confidence")}</span>
              <strong>{Math.round(selectedDecision.confidence * 100)}%</strong>
            </div>
          </div>

          <MiniTrendChart
            points={officialSeries}
            color={selectedTheme.accent}
            lowLabel={t(locale, "저점", "Low")}
            highLabel={t(locale, "고점", "High")}
            emptyTitle={t(locale, "공식 시계열 없음", "No official series")}
            emptySubtitle={t(locale, "연속 가격 데이터가 아직 없습니다.", "Continuous price data is not available yet.")}
            locale={locale === "ko" ? "ko-KR" : "en-US"}
          />
        </div>

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "지금 해석", "Desk read")}</span>
          <p>{selectedDecision.summary}</p>
          <ul className="bullet-list compact">
            {selectedDecision.checks.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "로컬 코파일럿", "Local copilot")}</span>
          <p>
            {t(
              locale,
              "로컬 무료 모델로 근거를 정리합니다. 가격 진실은 공식값과 실시간 테이프가 기준입니다.",
              "A local free model summarizes the evidence. The source of truth remains the official anchor and live tape."
            )}
          </p>

          <div className="field-grid">
            <label>
              <span>{t(locale, "Ollama 주소", "Ollama base URL")}</span>
              <input
                value={localLlmState.baseUrl}
                onChange={(event) =>
                  setLocalLlmState((current) => ({
                    ...current,
                    baseUrl: event.target.value
                  }))
                }
                placeholder="http://127.0.0.1:11434"
              />
            </label>
            <label>
              <span>{t(locale, "모델", "Model")}</span>
              <select
                value={localLlmState.selectedModel}
                onChange={(event) =>
                  setLocalLlmState((current) => ({
                    ...current,
                    selectedModel: event.target.value
                  }))
                }
              >
                <option value="">
                  {localLlmState.models.length > 0
                    ? t(locale, "모델 선택", "Choose a model")
                    : t(locale, "설치된 모델 없음", "No model installed")}
                </option>
                {localLlmState.models.map((model) => (
                  <option key={model.model} value={model.model}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="inline-actions">
            <button
              type="button"
              className="button ghost small"
              onClick={handleSaveLocalLlmSettings}
              disabled={localLlmSaving}
            >
              {localLlmSaving ? t(locale, "연결 확인 중", "Checking") : t(locale, "연결 확인", "Check connection")}
            </button>
            <span className={`feed-pill tone-${localLlmState.available ? "connected" : "error"}`}>
              {localLlmState.available
                ? `${getAssistantProviderLabel(locale, "ollama")} · ${
                    localLlmState.selectedModel || t(locale, "모델 선택 필요", "Select a model")
                  }`
                : t(locale, "로컬 모델 미연결", "Local model unavailable")}
            </span>
          </div>

          <div className="chip-group">
            {COPILOT_TASKS.map((task) => (
              <button
                key={task}
                type="button"
                className={`chip ${copilotTask === task ? "active" : ""}`}
                onClick={() => void handleRunLocalCopilot(task)}
                disabled={localLlmLoading}
              >
                {getCopilotTaskLabel(locale, task)}
              </button>
            ))}
          </div>

          {localLlmError ? (
            <div className="status-card error">
              <strong>{t(locale, "로컬 코파일럿 오류", "Local copilot error")}</strong>
              <p>{localLlmError}</p>
            </div>
          ) : null}

          {!localLlmError && localLlmState.error ? (
            <div className="status-card warning">
              <strong>{t(locale, "연결 상태", "Connection status")}</strong>
              <p>{localLlmState.error}</p>
            </div>
          ) : null}

          {localLlmLoading ? (
            <div className="status-card">
              <strong>{getCopilotTaskLabel(locale, copilotTask)}</strong>
              <p>{t(locale, "로컬 모델이 근거를 정리하는 중입니다.", "The local model is summarizing the evidence.")}</p>
            </div>
          ) : null}

          {copilotResponse ? (
            <div className="copilot-response">
              <div className="metric-strip inspector-strip">
                <div className="metric-tile">
                  <span>{t(locale, "모델 판단", "Model stance")}</span>
                  <strong>{copilotResponse.stance}</strong>
                </div>
                <div className="metric-tile">
                  <span>{t(locale, "모델 신뢰도", "Model confidence")}</span>
                  <strong>{Math.round(copilotResponse.confidence * 100)}%</strong>
                </div>
              </div>

              <div className="status-card">
                <strong>{getCopilotTaskLabel(locale, copilotTask)}</strong>
                <p>{copilotResponse.summary}</p>
                <span className="meta-line">
                  {`${getAssistantProviderLabel(locale, copilotResponse.provider)} · ${
                    copilotResponse.model ?? "n/a"
                  } · ${formatDate(locale, copilotResponse.generatedAt)}`}
                </span>
              </div>

              <div className="note-list">
                <div className="note-item">
                  <strong>{t(locale, "근거", "Support")}</strong>
                  <p>{copilotResponse.supportingEvidence[0]?.detail ?? copilotResponse.thesis[0] ?? "n/a"}</p>
                </div>
                <div className="note-item">
                  <strong>{t(locale, "반대 근거", "Counterpoint")}</strong>
                  <p>{copilotResponse.counterEvidence[0]?.detail ?? copilotResponse.risks[0] ?? "n/a"}</p>
                </div>
              </div>

              <ul className="bullet-list compact">
                {copilotResponse.checkpoints.slice(0, 3).map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "비교 통계", "Tape agreement")}</span>
          <div className="field-list">
            <div>
              <span>{t(locale, "괴리", "Gap")}</span>
              <strong>{formatPercent(locale, compareOutput.stats.gapPct, 2)}</strong>
            </div>
            <div>
              <span>{t(locale, "상관", "Correlation")}</span>
              <strong>{formatSigned(locale, compareOutput.stats.correlation, "")}</strong>
            </div>
            <div>
              <span>{t(locale, "방향 일치", "Direction match")}</span>
              <strong>{formatPercent(locale, compareOutput.stats.directionMatchPct, 0)}</strong>
            </div>
            <div>
              <span>{t(locale, "겹친 구간", "Overlap")}</span>
              <strong>{compareOutput.stats.overlapCount}</strong>
            </div>
          </div>
        </div>

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "소스 상태", "Source trust")}</span>
          <div className="field-list">
            <div>
              <span>{t(locale, "공식 소스", "Official")}</span>
              <strong className={`tone-${getSourceTone(selectedOfficialCard?.status ?? "error")}`}>
                {selectedOfficialCard?.status ?? "error"}
              </strong>
            </div>
            <div>
              <span>{t(locale, "상장 기준", "Listed")}</span>
              <strong className={`tone-${getSourceTone(selectedCompareQuote?.status ?? "error")}`}>
                {selectedCompareQuote?.status ?? "error"}
              </strong>
            </div>
            <div>
              <span>{t(locale, "공식 갱신", "Official as of")}</span>
              <strong>{formatDate(locale, selectedOfficialCard?.asOf ?? "")}</strong>
            </div>
            <div>
              <span>{t(locale, "상장 갱신", "Listed as of")}</span>
              <strong>{formatDate(locale, selectedCompareQuote?.asOf ?? "")}</strong>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div className="rail-brand">
          <img src={appIconUrl} alt="C-Quant" className="rail-logo" />
          <div>
            <strong>C-Quant</strong>
            <span>Global carbon allowance decision software</span>
          </div>
        </div>

        <div className="rail-locale">
          <button type="button" className={locale === "ko" ? "active" : ""} onClick={() => setLocale("ko")}>
            KO
          </button>
          <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
            EN
          </button>
        </div>

        <div className="rail-section">
          <span className="rail-label">{t(locale, "작업면", "Workspace")}</span>
          {SURFACES.map((item) => (
            <button
              key={item}
              type="button"
              className={`rail-button ${surface === item ? "active" : ""}`}
              onClick={() => startTransition(() => setSurface(item))}
            >
              {getSurfaceLabel(locale, item)}
            </button>
          ))}
        </div>

        <div className="rail-section">
          <span className="rail-label">{t(locale, "시장", "Markets")}</span>
          {marketProfiles.map((market) => (
            <button
              key={market.id}
              type="button"
              className={`rail-market ${marketId === market.id ? "active" : ""}`}
              onClick={() => startTransition(() => setMarketId(market.id))}
            >
              <strong>{market.name}</strong>
              <span>{market.region}</span>
            </button>
          ))}
        </div>

        <div className="rail-note">
          <strong>{t(locale, "제품 경계", "Product boundary")}</strong>
          <p>
            {t(
              locale,
              "주문 실행이나 거래 중개는 하지 않습니다. 공식값, 비교 기준, 가격 요인, 소스 신뢰를 한 화면에서 읽는 데스크입니다.",
              "This desktop does not route orders or intermediate trades. It is a decision desk for official anchors, listed benchmarks, price drivers, and source trust."
            )}
          </p>
        </div>
      </aside>

      <main className="app-main">
        <header className="workspace-head">
          <div>
            <span className="eyebrow">{t(locale, "글로벌 탄소 의사결정 데스크", "Global carbon decision desk")}</span>
            <h1>{selectedMarket.name}</h1>
            <p>{getMarketHeadline(locale, marketId)}</p>
          </div>

          <div className="head-actions">
            <div className="live-chip">{t(locale, "라이브 차트 30초 갱신", "Live chart refreshes every 30s")}</div>
            <button type="button" className="button primary" onClick={handleRefresh}>
              {sourcesLoading ? t(locale, "새로고침 중", "Refreshing") : t(locale, "데이터 새로고침", "Refresh data")}
            </button>
          </div>
        </header>

        <div className="market-strip">
          {marketBoardRows.map((row) => (
            <button
              key={row.market.id}
              type="button"
              className={`market-pill ${marketId === row.market.id ? "active" : ""}`}
              onClick={() => setMarketId(row.market.id)}
              style={
                {
                  "--market-accent": MARKET_THEMES[row.market.id].accent,
                  "--market-surface": MARKET_THEMES[row.market.id].surface
                } as React.CSSProperties
              }
            >
              <strong>{row.market.name}</strong>
              <span>{getOfficialPriceLabel(row.officialCard)}</span>
              <small>{getStanceLabel(locale, row.decision.stance)}</small>
            </button>
          ))}
        </div>

        {sourcesError ? <div className="status-banner error">{sourcesError}</div> : null}
        {quoteError ? <div className="status-banner warning">{quoteError}</div> : null}
        {connectedSources.warnings.length > 0 ? (
          <div className="status-banner warning">{connectedSources.warnings.join(" · ")}</div>
        ) : null}

        <div className="workspace-grid">
          <section className="workspace-scroll">
            {surface === "desk" ? renderDesk() : null}
            {surface === "drivers" ? renderDrivers() : null}
            {surface === "sources" ? renderSources() : null}
            {surface === "lab" ? renderLab() : null}
          </section>
          {renderInspector()}
        </div>
      </main>
    </div>
  );
}
