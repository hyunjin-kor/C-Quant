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
  MultiLineChart,
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
  watchlistPresets,
  workspacePresets
} from "./data/experience";
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
  localizeSourceRegistryItem,
  localizeSubscriptionFeature,
  localizeTrustPrinciple,
  localizeWatchViewPreset,
  localizeWatchlistPreset,
  localizeWorkspacePreset
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
  ConnectedSourceCard,
  ConnectedSourcePayload,
  ConnectedSourceSeriesPoint,
  DecisionAssistantResponse,
  MarketDriver,
  MarketProfile,
  ParsedSeriesPoint,
  WalkForwardResult
} from "./types";

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

const SURFACES: Array<{ id: Surface; ko: string; en: string }> = [
  { id: "overview", ko: "시장 보드", en: "Board" },
  { id: "signals", ko: "의사결정", en: "Decision" },
  { id: "lab", ko: "연구실", en: "Lab" },
  { id: "sources", ko: "출처", en: "Sources" }
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
  warnings: []
};
const defaultSettings: AppSettings = {
  hasOpenAIApiKey: false,
  llmModel: "gpt-4.1-mini"
};

const workspaceRouting: Record<
  string,
  { surface: Surface; watchlistId?: string; marketId?: MarketProfile["id"] }
> = {
  "morning-scan": { surface: "overview", watchlistId: "core-carbon" },
  "cross-market": { surface: "signals", watchlistId: "official-only" },
  "policy-supply": { surface: "sources", marketId: "eu-ets", watchlistId: "official-only" },
  "futures-etf": { surface: "overview", marketId: "eu-ets", watchlistId: "listed-proxies" },
  "model-review": { surface: "lab" }
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
      label: point.date,
      value: point.value
    }));
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

  const thesis = forecast.contributions.slice(0, 3).map((driver) => {
    const value = state[driver.driverId] ?? 0;
    if (locale === "ko") {
      return `${driver.variable}: 현재 압력 ${value >= 0 ? "상방" : "하방"} ${formatNumber(
        locale,
        Math.abs(driver.contribution),
        2
      )}`;
    }
    return `${driver.variable}: current pressure ${value >= 0 ? "upside" : "downside"} ${formatNumber(
      locale,
      Math.abs(driver.contribution),
      2
    )}`;
  });

  const risks = [
    ...(card?.notes.slice(0, 2) ?? []),
    ...alerts.slice(0, 2).map((alert) => alert.title)
  ].slice(0, 4);

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
    disclaimer: t(
      locale,
      "참고용 리서치 오버레이입니다. 이 플랫폼은 주문을 중개하지 않으며 개인 맞춤 자문을 제공하지 않습니다.",
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
  forecast: ReturnType<typeof buildForecast>;
  familyScores: Record<string, number>;
  alerts: AlertItem[];
  catalysts: ReturnType<typeof useLocalizedCatalysts>;
  question: string;
}) {
  const { locale, market, card, forecast, familyScores, alerts, catalysts, question } = args;

  return {
    question,
    locale,
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
      topDrivers: forecast.contributions.slice(0, 6)
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
  const [marketId, setMarketId] = useState<MarketProfile["id"]>("eu-ets");
  const [workspaceId, setWorkspaceId] = useState<string>("morning-scan");
  const [watchlistId, setWatchlistId] = useState<string>("core-carbon");
  const [watchViewId, setWatchViewId] = useState<string>("scan-view");
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
    "현재 이 시장은 매수 우위인지 매도 우위인지 판단해줘."
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

  const localizedWorkspaces = useMemo(
    () => workspacePresets.map((item) => localizeWorkspacePreset(item, appLocale)),
    [appLocale]
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
  const localizedBenchmarks = useMemo(
    () => benchmarkPlatforms.map((item) => localizeBenchmark(item, appLocale)),
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
  const localizedAlerts = useMemo(
    () => alertTemplates.map((item) => localizeAlertTemplate(item, appLocale)),
    [appLocale]
  );
  const localizedCatalysts = useLocalizedCatalysts(appLocale, marketId);

  useEffect(() => {
    window.localStorage.setItem("cquant:locale", appLocale);
  }, [appLocale]);

  useEffect(() => {
    const nextQuestion =
      appLocale === "ko"
        ? "현재 이 시장은 매수 우위인지 매도 우위인지 판단해줘."
        : "Should the current market posture be increased, reduced, or held?";
    setAssistantQuestion((current) => (current.trim() ? current : nextQuestion));
  }, [appLocale]);

  useEffect(() => {
    void refreshSources();
    void window.desktopBridge?.isWindowMaximized().then((value) => setWindowMaximized(value));
    void window.desktopBridge?.getAppSettings().then((next) => {
      setSettings(next);
      setModelDraft(next.llmModel);
    });
  }, []);

  const cardsByMarket = useMemo(
    () =>
      Object.fromEntries(
        connectedSources.cards.map((card) => [card.marketId, card])
      ) as Partial<Record<MarketProfile["id"], ConnectedSourceCard>>,
    [connectedSources.cards]
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
  const selectedForecast = forecasts[marketId];
  const selectedDecision = useMemo(
    () =>
      buildRuleDecision(
        appLocale,
        selectedMarket,
        selectedCard,
        selectedForecast,
        selectedAlerts,
        localizedCatalysts,
        currentState
      ),
    [
      appLocale,
      currentState,
      localizedCatalysts,
      selectedAlerts,
      selectedCard,
      selectedForecast,
      selectedMarket
    ]
  );

  const decisionView = assistantResponse ?? selectedDecision;
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

  const datasetSchema = useMemo(
    () => marketDatasetSchemas.find((item) => item.marketId === marketId) ?? marketDatasetSchemas[0],
    [marketId]
  );

  const activeWorkspace = useMemo(
    () => localizedWorkspaces.find((item) => item.id === workspaceId) ?? localizedWorkspaces[0],
    [localizedWorkspaces, workspaceId]
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

  const sourceMethodPoints = useMemo<ChartPoint[]>(
    () => {
      const counts = new Map<string, number>();
      for (const item of selectedSources) {
        counts.set(item.method, (counts.get(item.method) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
    },
    [selectedSources]
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
    () => makeFeedItems(appLocale, selectedCard, decisionView, selectedAlerts, localizedCatalysts),
    [appLocale, decisionView, localizedCatalysts, selectedAlerts, selectedCard]
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
      `${t(appLocale, "리스크", "Risks")}`,
      ...decisionView.risks.map((item) => `- ${item}`),
      "",
      `${t(appLocale, "체크리스트", "Checklist")}`,
      ...decisionView.actions.map((item) => `- ${item}`),
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
          card: selectedCard,
          forecast: selectedForecast,
          familyScores: familyScoresByMarket[marketId],
          alerts: selectedAlerts,
          catalysts: localizedCatalysts,
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

  async function handleOpenExternal(url: string) {
    if (window.desktopBridge) {
      await window.desktopBridge.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function applyWorkspace(id: string) {
    setWorkspaceId(id);
    const route = workspaceRouting[id];
    if (!route) {
      return;
    }
    setSurface(route.surface);
    if (route.watchlistId) {
      setWatchlistId(route.watchlistId);
    }
    if (route.marketId) {
      setMarketId(route.marketId);
    }
  }

  return (
    <div className="terminal-shell">
      <header className="titlebar">
        <div className="titlebar-brand" style={{ WebkitAppRegion: "drag" } as CSSProperties}>
          <img src="./assets/app-icon.png" alt="C-Quant" className="brand-mark" />
          <div>
            <strong>C-Quant</strong>
            <span>{t(appLocale, "탄소배출권 의사결정 터미널", "Carbon allowance decision terminal")}</span>
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
          <div className="sidebar-section">
            <div className="sidebar-label">{t(appLocale, "화면", "Screens")}</div>
            <nav className="surface-nav">
              {SURFACES.map((item) => (
                <button
                  key={item.id}
                  className={surface === item.id ? "active" : ""}
                  onClick={() => setSurface(item.id)}
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
                  onClick={() => {
                    setMarketId(profile.id);
                    setAssistantResponse(null);
                  }}
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
            <div className="sidebar-label">{t(appLocale, "워크스페이스", "Workspaces")}</div>
            <div className="workspace-list">
              {localizedWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className={workspaceId === workspace.id ? "active" : ""}
                  onClick={() => applyWorkspace(workspace.id)}
                >
                  <strong>{workspace.title}</strong>
                  <span>{workspace.summary}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section sidebar-summary">
            <div className="sidebar-label">{t(appLocale, "현재 포커스", "Current focus")}</div>
            <strong>{activeWorkspace.title}</strong>
            <p>{activeWorkspace.summary}</p>
            <div className="workspace-modules">
              {activeWorkspace.moduleLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </aside>

        <main className="scroll-body">
          <section className="hero-strip">
            <div>
              <div className="eyebrow">{t(appLocale, "오늘의 운영면", "Operating surface")}</div>
              <h1>{activeWorkspace.objective}</h1>
              <p>
                {t(
                  appLocale,
                  "공식 가격, 영향 인자, 알림, 모델 판단을 같은 화면에서 보고 거래 밖의 의사결정을 빠르게 내리도록 설계했습니다.",
                  "Built to read official prices, drivers, alerts, and model posture on one surface before acting elsewhere."
                )}
              </p>
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => void refreshSources()}>
                {refreshingSources
                  ? t(appLocale, "새로고침 중...", "Refreshing...")
                  : t(appLocale, "공식 소스 새로고침", "Refresh official sources")}
              </button>
              <button className="secondary-button" onClick={() => void handleSaveBrief()}>
                {t(appLocale, "브리프 저장", "Save brief")}
              </button>
            </div>
          </section>

          <section className="snapshot-grid">
            {snapshotCards.map((card) => (
              <button
                key={card.marketId}
                className={`snapshot-card ${card.marketId === marketId ? "active" : ""}`}
                onClick={() => setMarketId(card.marketId)}
                style={{ "--market-accent": marketColor(card.marketId) } as CSSProperties}
              >
                <div className="snapshot-head">
                  <span>{card.name}</span>
                  <small>{card.status}</small>
                </div>
                <strong>{card.priceLabel}</strong>
                <div className="snapshot-meta">
                  <span>{card.changeLabel}</span>
                  <span>{card.volumeLabel}</span>
                </div>
                <div className="snapshot-chart">
                  {card.sparkline.length > 1 ? (
                    <Sparkline points={card.sparkline} color={marketColor(card.marketId)} fill />
                  ) : (
                    <div className="snapshot-fallback">{card.asOf}</div>
                  )}
                </div>
                <div className="snapshot-footer">
                  <span>
                    {t(appLocale, "판단 점수", "Decision score")} {formatNumber(appLocale, card.score, 2)}
                  </span>
                  <span>{formatNumber(appLocale, card.confidence * 100, 0)}%</span>
                </div>
              </button>
            ))}
          </section>

          {surface === "overview" ? (
            <>
              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "공식 가격 테이프", "Official market tape")}
                    subtitle={
                      selectedCard?.seriesLabel ??
                      t(
                        appLocale,
                        "시계열 미공개 시장은 이벤트 중심으로 해석합니다.",
                        "When no official time series is available, read the event layer instead."
                      )
                    }
                  />
                  {selectedSeries.length > 1 ? (
                    <LineChart
                      points={selectedSeries}
                      color={marketColor(marketId)}
                      title={selectedCard?.sourceName}
                      subtitle={`${t(appLocale, "업데이트", "Updated")} ${formatDate(appLocale, selectedCard?.asOf)}`}
                    />
                  ) : (
                    <div className="empty-plot">
                      <strong>{t(appLocale, "연속 시계열 없음", "No continuous official time series")}</strong>
                      <p>
                        {selectedCard?.summary ??
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
                    title={t(appLocale, "의사결정 패널", "Decision panel")}
                    subtitle={t(
                      appLocale,
                      "로컬 연구 엔진 + 선택형 LLM 브리프",
                      "Local research engine + optional LLM brief"
                    )}
                  />
                  <DecisionPanel
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

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "크로스마켓 비교", "Cross-market compare")}
                    subtitle={t(
                      appLocale,
                      "공식 시계열이 있는 시장만 100 기준으로 비교합니다.",
                      "Only markets with official history are normalized to 100."
                    )}
                  />
                  {crossMarketPoints.length > 1 && crossMarketSeries.length > 0 ? (
                    <MultiLineChart
                      points={crossMarketPoints}
                      series={crossMarketSeries}
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
                    title={t(appLocale, "가격 영향 히트맵", "Driver heatmap")}
                    subtitle={t(
                      appLocale,
                      "연구 기반 인자군을 국가별로 한 번에 봅니다.",
                      "See the research-based factor families across jurisdictions."
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
                      "Shown only when official volume data is available."
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
                    title={t(appLocale, "패밀리 강도", "Family intensity")}
                    subtitle={t(
                      appLocale,
                      "선택 시장의 인자군 강도를 압축해서 봅니다.",
                      "Condensed view of factor-family intensity for the selected market."
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
                    title={t(appLocale, "알림 분포", "Alert mix")}
                    subtitle={t(
                      appLocale,
                      "현재 시장에 걸린 경보의 강도 분포입니다.",
                      "Severity mix of active alerts on the current market."
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
                    title={t(appLocale, "시장 피드", "Market feed")}
                    subtitle={t(
                      appLocale,
                      "글은 길지 않게, 판단에 필요한 문장만 남겼습니다.",
                      "Short feed items only; no report-style blocks."
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
                    title={t(appLocale, "다음 촉매", "Next catalysts")}
                    subtitle={t(
                      appLocale,
                      "정책, 경매, 공시를 일정처럼 관리합니다.",
                      "Run policy, auction, and disclosure checkpoints like an operating calendar."
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
            <>
              <section className="overview-grid">
                <div className="panel panel-emphasis">
                  <SectionHeader
                    title={t(appLocale, "드라이버 워터폴", "Driver waterfall")}
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
                    title={t(appLocale, "시나리오 슬라이더", "Scenario sliders")}
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
              </section>

              <section className="overview-grid secondary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "의사결정 설명", "Decision brief")}
                    subtitle={t(
                      appLocale,
                      "규칙 기반 판단과 LLM 브리프를 같은 패널에 둡니다.",
                      "Rule-based posture and LLM brief live on the same panel."
                    )}
                  />
                  <DecisionPanel
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

                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "LLM 설정", "LLM settings")}
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
                        {t(appLocale, "LLM 설정 저장", "Save LLM settings")}
                      </button>
                      <small>
                        {settings.hasOpenAIApiKey
                          ? t(appLocale, "현재 키가 저장되어 있습니다.", "An API key is currently stored.")
                          : t(appLocale, "아직 저장된 키가 없습니다.", "No API key is stored yet.")}
                      </small>
                    </div>
                  </div>
                </div>
              </section>

              <section className="overview-grid tertiary">
                <div className="panel">
                  <SectionHeader
                    title={t(appLocale, "퀀트 지표", "Quant indicators")}
                    subtitle={t(
                      appLocale,
                      "매수·매도 타이밍 확인에 쓰는 핵심 체크리스트입니다.",
                      "Core checks for timing buy/sell posture."
                    )}
                  />
                  <div className="indicator-list">
                    {quantIndicators.map((indicator) => (
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
                    title={t(appLocale, "알림 허브", "Alert hub")}
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
          ) : null}

          {surface === "sources" ? (
            <>
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
                          <span>{item.category}</span>
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
                      "Separate official web, files, public APIs, and commercial APIs."
                    )}
                  />
                  <div className="source-list">
                    {selectedSources.map((item) => (
                      <button key={item.id} className="source-item" onClick={() => void handleOpenExternal(item.url)}>
                        <div className="source-head">
                          <strong>{item.title}</strong>
                          <span>{item.method}</span>
                        </div>
                        <p>{item.appUse}</p>
                        <small>{item.whyItMatters}</small>
                      </button>
                    ))}
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
                        <span>{item.category}</span>
                        <p>{item.strength}</p>
                      </button>
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
          ) : null}
        </main>
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

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
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
  const badgeClass =
    decision.stance === "Buy Bias"
      ? "bullish"
      : decision.stance === "Reduce Bias"
        ? "bearish"
        : "neutral";

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
          <span className={`stance-badge ${badgeClass}`}>{stanceLabel(locale, decision.stance)}</span>
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
