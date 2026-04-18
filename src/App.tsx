import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  ColumnChart,
  DonutMeter,
  Heatmap,
  MiniTrendChart,
  PressureBar,
  WaterfallChart,
  type ChartPoint,
  type HeatmapRow,
  type MultiLinePoint,
  type MultiLineSeries
} from "./components/charts";
import { InteractiveMarketChart } from "./components/InteractiveMarketChart";
import { InputCoverageGrid } from "./components/InputCoverageGrid";
import { marketInputBlocks } from "./data/dataHub";
import { openSourceBenchmarks } from "./data/openSourceBenchmarks";
import {
  creditLifecycleDossiers,
  natureRiskOverlays,
  registryOperationsTracks
} from "./data/projectIntel";
import {
  benchmarkPlatforms,
  marketProfiles,
  productRequirements,
  quantIndicators
} from "./data/research";
import {
  sourceRegistry,
  subscriptionFeatures,
  trustPrinciples
} from "./data/platform";
import { buildForecast } from "./lib/forecast";
import { localizeText, localizeTextWithFallback } from "./lib/localization";
import type {
  ChatGroundingItem,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  ConnectedSourceSeriesPoint,
  DecisionAssistantResponse,
  LocalChatMessage,
  LocalChatResponse,
  LocalLlmState,
  MarketDriver,
  MarketLiveQuote,
  MarketProfile
} from "./types";

const appIconUrl = new URL("../assets/app-icon.png", import.meta.url).href;

type MarketId = MarketProfile["id"];
type AppLocale = "ko" | "en";
type Surface = "command" | "desk" | "drivers" | "sources" | "copilot";
type QuoteRangePreset = "1d" | "5d" | "1m" | "3m" | "6m" | "1y";
type CopilotTask = "why-posture" | "what-changed" | "breakers" | "verify-now";
type CopilotResponseStyle = "brief" | "evidence" | "risk";

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

type FreshnessLevel = "fresh" | "watch" | "stale" | "unknown";

type MarketBoardRow = {
  market: MarketProfile;
  officialCard: ConnectedSourceCard | null;
  hedgeQuote: MarketLiveQuote | null;
  compareStats: CompareStats;
  decision: DecisionSummary;
  freshnessDays: number | null;
  freshnessLevel: FreshnessLevel;
};

declare global {
  interface Window {
    desktopBridge?: {
      version: string;
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
      launchLocalLlm: () => Promise<{
        started: boolean;
        mode: string;
        path: string;
      }>;
      runLocalChat: (options: {
        locale: AppLocale;
        baseUrl?: string;
        model?: string;
        context: Record<string, unknown>;
        messages: Array<{
          role: "user" | "assistant";
          content: string;
        }>;
      }) => Promise<LocalChatResponse>;
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
  installed: false,
  reachable: false,
  baseUrl: "http://127.0.0.1:11434",
  selectedModel: "",
  models: []
};

const LOCAL_MODEL_RECOMMENDED = "granite3-dense:2b";
const EMPTY_CHAT_SESSIONS: Record<MarketId, LocalChatMessage[]> = {
  "eu-ets": [],
  "k-ets": [],
  "cn-ets": []
};

const SURFACES: Surface[] = ["command", "desk", "drivers", "sources", "copilot"];
const MARKET_ORDER: MarketId[] = ["eu-ets", "k-ets", "cn-ets"];
const RANGE_OPTIONS: QuoteRangePreset[] = ["1d", "5d", "1m", "3m", "6m", "1y"];
const COPILOT_TASKS: CopilotTask[] = [
  "why-posture",
  "what-changed",
  "breakers",
  "verify-now"
];
const COPILOT_RESPONSE_STYLES: CopilotResponseStyle[] = ["brief", "evidence", "risk"];
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
    ko: "?뺤콉쨌怨듦툒",
    en: "Policy & Supply",
    match: (driver) =>
      /policy|supply|cap|reserve|calendar|compliance|allocation/i.test(
        `${driver.category} ${driver.variable}`
      )
  },
  {
    id: "power",
    ko: "?꾨젰쨌?곗뾽",
    en: "Power & Industry",
    match: (driver) => /power|industrial|manufacturing|industry/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "fuel",
    ko: "?곕즺 ?꾪솚",
    en: "Fuel Switching",
    match: (driver) => /fuel|gas|coal|oil|lng|spread/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "macro",
    ko: "嫄곗떆쨌湲덉쑖",
    en: "Macro & Financial",
    match: (driver) => /macro|financial|equity|credit|fx|exchange|call rate/i.test(`${driver.category} ${driver.variable}`)
  },
  {
    id: "weather",
    ko: "?섍꼍쨌湲곗긽",
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
  const uiLocale = getUiLocale(locale);
  if (uiLocale !== "ko") {
    return en;
  }

  return localizeText("ko", en);
}

function tf(locale: AppLocale, ko: string, en: string) {
  return localizeTextWithFallback(getUiLocale(locale), ko, en);
}

function getUiLocale(locale: AppLocale): AppLocale {
  return locale;
}

function getIntlLocale(locale: AppLocale) {
  return getUiLocale(locale) === "ko" ? "ko-KR" : "en-US";
}

function getSystemLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return String(navigator.language || "").toLowerCase().startsWith("ko") ? "ko" : "en";
}

function getCopilotTaskLabel(locale: AppLocale, task: CopilotTask) {
  switch (task) {
    case "why-posture":
      return t(locale, "??吏湲??대윴 ?먮떒?멸?", "Why this posture");
    case "what-changed":
      return t(locale, "?ㅻ뒛 諛붾?寃껊쭔 ?붿빟", "What changed today");
    case "breakers":
      return t(locale, "???먮떒??源⑥???議곌굔", "What breaks this view");
    case "verify-now":
      return t(locale, "吏湲????뺤씤??怨듭떇 洹쇨굅", "What to verify now");
    default:
      return task;
  }
}

function getCopilotTaskPrompt(locale: AppLocale, task: CopilotTask) {
  switch (task) {
    case "why-posture":
      return t(
        locale,
        "?꾩옱 ?ъ??섏씠 ??留ㅼ닔 ?곗쐞, 愿留? 鍮꾩쨷 異뺤냼 以??섎굹濡??쏀엳?붿? 洹쇨굅 以묒떖?쇰줈 ?ㅻ챸?섏꽭??",
        "Explain why the current posture leans buy, hold, or reduce using only the provided evidence."
      );
    case "what-changed":
      return t(
        locale,
        "?ㅻ뒛 ?곗씠??湲곗??쇰줈 臾댁뾿??諛붾뚯뿀?붿?, 湲곗〈 ?먮떒?먯꽌 臾댁뾿???щ씪議뚮뒗吏 ?붿빟?섏꽭??",
        "Summarize what changed in the latest data and what moved the desk read today."
      );
    case "breakers":
      return t(
        locale,
        "?꾩옱 ?먮떒???쏀븯寃?留뚮뱾嫄곕굹 ?ㅼ쭛??議곌굔??紐낇솗???뺣━?섏꽭??",
        "List the specific conditions that would weaken or reverse the current posture."
      );
    case "verify-now":
      return t(
        locale,
        "吏湲?異붽?濡??뺤씤?댁빞 ??怨듭떇 臾몄꽌, ?쇱젙, ?곗씠???곹깭瑜??곗꽑?쒖쐞?濡??뺣━?섏꽭??",
        "Prioritize the official documents, calendar items, and data checks that should be verified now."
      );
    default:
      return "";
  }
}

function getCopilotTaskSummary(locale: AppLocale, task: CopilotTask) {
  switch (task) {
    case "why-posture":
      return t(
        locale,
        "?꾩옱 ?ㅽ깲?ㅺ? ??buy, hold, reduce 履쎌쑝濡?湲곗슦?붿? 洹쇨굅 以묒떖?쇰줈 ?ㅻ챸?⑸땲??",
        "Explain why the current stance leans buy, hold, or reduce."
      );
    case "what-changed":
      return t(
        locale,
        "媛??理쒓렐 ?낅뜲?댄듃?먯꽌 諛붾??먭낵 ?ㅻ뒛???쎄린瑜??吏곸씤 ??ぉ???붿빟?⑸땲??",
        "Summarize what changed in the latest update and what moved the read."
      );
    case "breakers":
      return t(
        locale,
        "?꾩옱 ?먮떒???쏀솕?쒗궎嫄곕굹 ?ㅼ쭛??議곌굔留?遺꾨━?댁꽌 蹂댁뿬以띾땲??",
        "Separate the conditions that would weaken or reverse the current read."
      );
    case "verify-now":
      return t(
        locale,
        "吏湲??ㅼ떆 ?뺤씤?댁빞 ?섎뒗 怨듭떇 臾몄꽌, ?쇱젙, ?곗씠?곕쭔 ?곗꽑?쒖쐞濡??뺣━?⑸땲??",
        "Prioritize the official documents, calendar items, and checks to verify now."
      );
    default:
      return task;
  }
}

function getCopilotResponseStyleLabel(locale: AppLocale, style: CopilotResponseStyle) {
  switch (style) {
    case "brief":
      return t(locale, "媛꾧껐", "Brief");
    case "evidence":
      return t(locale, "洹쇨굅 ?곗꽑", "Evidence-first");
    case "risk":
      return t(locale, "由ъ뒪???곗꽑", "Risk-first");
    default:
      return style;
  }
}

function getCopilotResponseStyleSummary(locale: AppLocale, style: CopilotResponseStyle) {
  switch (style) {
    case "brief":
      return t(
        locale,
        "?듭떖 ?ъ떎怨??ㅼ쓬 ?뺤씤 ??ぉ留?吏㏐쾶 ?뺣━?⑸땲??",
        "Keep replies short and focus on the core facts and next checks."
      );
    case "evidence":
      return t(
        locale,
        "怨듭떇 ?듭빱, 鍮꾧탳 ?뚯씠?? ?쒕씪?대쾭瑜?洹쇨굅 ?쒖꽌?濡??ㅻ챸?⑸땲??",
        "Order the reply around the official anchor, comparison tape, and supporting drivers."
      );
    case "risk":
      return t(
        locale,
        "諛섎? 洹쇨굅, ?좎꽑????? 釉뚮젅?댁빱 議곌굔??癒쇱? ?쎌뒿?덈떎.",
        "Lead with counter-evidence, freshness limits, and breaker conditions."
      );
    default:
      return style;
  }
}

function getAssistantProviderLabel(locale: AppLocale, provider?: "ollama" | "openai" | "rule") {
  switch (provider) {
    case "ollama":
      return t(locale, "濡쒖뺄 Ollama", "Local Ollama");
    case "openai":
      return "OpenAI";
    case "rule":
      return t(locale, "洹쒖튃 ?붿쭊", "Rule engine");
    default:
      return t(locale, "Not connected", "Not connected");
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
  const fallback = getSystemLocale();
  const value = readStoredString("cquant:locale", fallback);
  return value === "en" ? "en" : "ko";
}

function readStoredSurface() {
  const value = readStoredString("cquant:surface", "command");
  if (value === "lab" || value === "signals") {
    return "copilot";
  }
  return SURFACES.includes(value as Surface) ? (value as Surface) : "command";
}

function readStoredMarket() {
  const value = readStoredString("cquant:market", "k-ets");
  return MARKET_ORDER.includes(value as MarketId) ? (value as MarketId) : "k-ets";
}

function readStoredChatSessions() {
  try {
    const raw = window.localStorage.getItem("cquant:local-chat");
    if (!raw) {
      return EMPTY_CHAT_SESSIONS;
    }

    const parsed = JSON.parse(raw) as Partial<Record<MarketId, LocalChatMessage[]>>;
    return MARKET_ORDER.reduce<Record<MarketId, LocalChatMessage[]>>((sessions, id) => {
      const messages = Array.isArray(parsed?.[id]) ? parsed[id] : [];
      sessions[id] = messages
        .filter(
          (message) =>
            message &&
            typeof message === "object" &&
            typeof message.id === "string" &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string" &&
            typeof message.createdAt === "string"
        )
        .slice(-24)
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          model: message.model,
          status: message.status,
          grounding: Array.isArray(message.grounding) ? message.grounding : [],
          boundaryNote: message.boundaryNote
        }));
      return sessions;
    }, { ...EMPTY_CHAT_SESSIONS });
  } catch {
    return EMPTY_CHAT_SESSIONS;
  }
}

function readStoredCopilotResponseStyle() {
  const value = readStoredString("cquant:copilot-response-style", "evidence");
  return COPILOT_RESPONSE_STYLES.includes(value as CopilotResponseStyle)
    ? (value as CopilotResponseStyle)
    : "evidence";
}

function formatDate(locale: AppLocale, value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || t(locale, "Date unavailable", "Date unavailable");
  }

  const includeTime = String(value).includes("T");

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
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
    return t(locale, "Date unavailable", "Date unavailable");
  }

  const days = Math.floor(
    (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days <= 0) return t(locale, "?ㅻ뒛 媛깆떊", "Updated today");
  if (days === 1) return t(locale, "1??寃쎄낵", "1 day old");
  return t(locale, `${days}??寃쎄낵`, `${days} days old`);
}

function getFreshnessDays(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}

function getFreshnessLevel(days: number | null): FreshnessLevel {
  if (days === null) return "unknown";
  if (days <= 3) return "fresh";
  if (days <= 10) return "watch";
  return "stale";
}

function getFreshnessLevelLabel(locale: AppLocale, level: FreshnessLevel) {
  switch (level) {
    case "fresh":
      return t(locale, "理쒖떊", "Fresh");
    case "watch":
      return t(locale, "Watch", "Watch");
    case "stale":
      return t(locale, "Stale", "Stale");
    default:
      return t(locale, "Unknown", "Unknown");
  }
}

function getFreshnessSummary(locale: AppLocale, value?: string | null) {
  const days = getFreshnessDays(value);
  const level = getFreshnessLevel(days);

  if (level === "unknown") {
    return t(locale, "Refresh date unavailable", "Refresh date unavailable");
  }

  const relative = formatRelativeDays(locale, value ?? "");
  if (level === "fresh") {
    return relative;
  }
  if (level === "watch") {
    return t(locale, `${relative} / ?ы솗???꾩슂`, `${relative} / recheck soon`);
  }
  return t(
    locale,
    `${relative} / 怨듭떇媛??ш????꾩슂`,
    `${relative} / official anchor needs recheck`
  );
}

function getLifecycleTone(status: "done" | "active" | "queued" | "warning") {
  switch (status) {
    case "done":
      return "positive";
    case "warning":
      return "negative";
    default:
      return "neutral";
  }
}

function getRegistryHealthTone(status: "healthy" | "watch" | "blocked") {
  switch (status) {
    case "healthy":
      return "positive";
    case "blocked":
      return "negative";
    default:
      return "neutral";
  }
}

function getLifecycleStatusLabel(locale: AppLocale, status: "done" | "active" | "queued" | "warning") {
  switch (status) {
    case "done":
      return tf(locale, "완료", "Done");
    case "active":
      return tf(locale, "진행 중", "Active");
    case "queued":
      return tf(locale, "대기", "Queued");
    case "warning":
      return tf(locale, "주의", "Warning");
    default:
      return status;
  }
}

function getRegistryHealthLabel(locale: AppLocale, status: "healthy" | "watch" | "blocked") {
  switch (status) {
    case "healthy":
      return tf(locale, "정상", "Healthy");
    case "watch":
      return tf(locale, "점검", "Watch");
    case "blocked":
      return tf(locale, "차단", "Blocked");
    default:
      return status;
  }
}

function getChartGuideLabel(locale: AppLocale) {
  return t(locale, "?뺣?/異뺤냼 / ?쒕옒洹??대룞", "Scroll to zoom / drag to pan");
}

function formatNumber(locale: AppLocale, value: number, digits = 2) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatPercent(locale: AppLocale, value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "怨꾩궛 遺덇?", "n/a");
  }
  const signed = value > 0 ? "+" : "";
  return `${signed}${formatNumber(locale, value, digits)}%`;
}

function formatSigned(locale: AppLocale, value: number | null, suffix = "") {
  if (value === null || !Number.isFinite(value)) {
    return t(locale, "怨꾩궛 遺덇?", "n/a");
  }
  const signed = value > 0 ? "+" : "";
  return `${signed}${formatNumber(locale, value, 2)}${suffix}`;
}

function joinReadoutParts(...parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" / ");
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
      value: point.value,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close
    }));
}

function buildVolumePoints(series: ConnectedSourceSeriesPoint[] | undefined): ChartPoint[] {
  return (series ?? [])
    .filter((point) => Number.isFinite(point.volume))
    .map((point) => ({
      label: point.date,
      value: Number(point.volume),
      volume: point.volume,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close
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
    return t(locale, "Unavailable", "Unavailable");
  }

  if (card.id === "eu-ets-official") {
    return t(locale, "怨듭떇 ?뚯씪", "Official file");
  }
  if (card.id === "k-ets-official") {
    return t(locale, "怨듭떇 ??API ?섑뵆", "Official web/API sample");
  }
  return t(locale, "怨듭떇 ???먮쫫", "Official web flow");
}

function getOfficialSourceName(locale: AppLocale, card: ConnectedSourceCard | null) {
  if (!card) {
    return t(locale, "怨듭떇 ?뚯뒪 ?놁쓬", "No official source");
  }

  switch (card.id) {
    case "eu-ets-official":
      return t(locale, "EEX EUA 寃쎈ℓ 由ы룷??", "EEX EUA auction report");
    case "k-ets-official":
      return t(locale, "KRX ETS ?섑뵆 API", "KRX ETS sample API");
    case "cn-ets-official":
      return t(locale, "MEE ?꾩냼?쒖옣 諛쒗몴 ?뚯뒪", "MEE carbon-market release feed");
    default:
      return card.sourceName;
  }
}

function getOfficialCoverageLabel(locale: AppLocale, card: ConnectedSourceCard | null) {
  if (!card) {
    return "n/a";
  }

  switch (card.id) {
    case "eu-ets-official":
      return t(locale, "EU 怨듭떇 1李?寃쎈ℓ ?뚯씠??", "Official EU primary auction tape");
    case "k-ets-official":
      return t(
        locale,
        "怨듭떇 KRX Open API ?섑뵆 (?쇱씪 ?쒖옣 ?뚯씠??)",
        "Official KRX Open API sample (daily market tape)"
      );
    case "cn-ets-official":
      return t(locale, "怨듭떇 ?뺤콉 / ?댁쁺 ?뚯뒪", "Official policy and operations feed");
    default:
      return card.coverage;
  }
}

function getOfficialHeadlineLabel(locale: AppLocale, card: ConnectedSourceCard | null) {
  if (!card) {
    return "n/a";
  }

  if (card.headline === "Connection unavailable") {
    return t(locale, "연결 불가", "Connection unavailable");
  }

  if (card.id === "k-ets-official") {
    const match = card.headline.match(/^(.+) official close$/);
    if (match) {
      return t(locale, `${match[1]} 怨듭떇 醫낅가`, `${match[1]} official close`);
    }
  }

  return localizeText(getUiLocale(locale), card.headline);
}

function getOfficialSummaryLabel(locale: AppLocale, card: ConnectedSourceCard | null) {
  if (!card) {
    return "n/a";
  }

  if (card.id === "eu-ets-official") {
    return t(
      locale,
      `理쒖떊 怨듭떇 1李?寃쎈ℓ???㎎??${getOfficialPriceLabel(card)}?먯꽌 泥댁껜?섏뿀?듬땲??`,
      `Latest official primary auction cleared at ${getOfficialPriceLabel(card)}.`
    );
  }

  if (card.id === "k-ets-official") {
    return t(
      locale,
      `${getOfficialHeadlineLabel(locale, card)} 湲곗? KRX 怨듭떇 ?섑뵆 API ?곗씠??낅땲??`,
      `Official KRX sample API data for ${getOfficialHeadlineLabel(locale, card)}.`
    );
  }

  if (card.id === "cn-ets-official") {
    const asOf = formatDate(locale, card.asOf);
    return card.metrics.length > 0
      ? t(
          locale,
          `理쒖떊 怨듭떇 MEE ?꾩냼?쒖옣 諛쒗몴?쇱? ${asOf}?낅땲??`,
          `Latest official MEE carbon-market release dated ${asOf}.`
        )
      : t(
          locale,
          `理쒖떊 怨듭떇 MEE ?꾩냼?쒖옣 諛쒗몴?쇱? ${asOf}?쇰줈, 理쒖떊 ?띾え?붿뿉???レ옄 ?쒖옣 ?듦퀎媛 ?놁뒿?덈떎.`,
          `Latest official MEE carbon-market release dated ${asOf}. Numeric market statistics were not published in the latest item.`
        );
  }

  return localizeText(getUiLocale(locale), card.summary);
}

function getOfficialNoteLabel(locale: AppLocale, note: string) {
  if (note === "The app could not fetch this official source in the current environment.") {
    return t(
      locale,
      "?? ?쒗솚?쒖꽌 ?깆씠 怨듭떇 ?뚯뒪瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??",
      "The app could not fetch this official source in the current environment."
    );
  }

  if (
    note ===
    "This official feed covers primary auctions. It does not replace ICE secondary-market futures data."
  ) {
    return t(
      locale,
      "???怨듭떇 ?뚯뒪??1李?寃쎈ℓ瑜??ㅻ４硫? ICE 2李? ?쒖옣 ?좊Ъ ?곗씠?곕? ?泥댄븯吏 ?딆뒿?덈떎.",
      "This official feed covers primary auctions. It does not replace ICE secondary-market futures data."
    );
  }

  if (note === "This uses the official KRX Open API sample endpoint published on the service detail page.") {
    return t(
      locale,
      "???곗씠?곕뒗 ?쒕퉬???곸꽭 ?섏씠吏?먯꽌 怨듭떆??怨듭떇 KRX Open API ?섑뵆 ?덈뱶?ъ씤?몃? ?ъ슜?⑸땲??",
      "This uses the official KRX Open API sample endpoint published on the service detail page."
    );
  }

  if (note === "Daily market tape only. Zero-volume rows are preserved as official records.") {
    return t(
      locale,
      "?쇱씪 ?쒖옣 ?뚯씠?꾨쭔 ?쒓났?섎㈃, 嫄곕옒?됱씠 0???뻾???듭떇 湲곕줉?쇰줈 洹몃? 蹂댁〈?⑸땲??",
      "Daily market tape only. Zero-volume rows are preserved as official records."
    );
  }

  if (note === "This official feed reflects MEE policy and operations releases, not a stable daily exchange tape.") {
    return t(
      locale,
      "???怨듭떇 ?뚯뒪??MEE ?뺤콉 / ?댁쁺 諛쒗몴瑜?諛섏쁺?섎㈃, ?덉젙?쒖씤 ?쇱씪 嫄곕옒???뚯씠?꾧? ?꾨땲?덈떎.",
      "This official feed reflects MEE policy and operations releases, not a stable daily exchange tape."
    );
  }

  if (note.startsWith("Numeric operating metrics are taken from the latest MEE bulletin with published market statistics")) {
    const dateMatch = note.match(/\(([^)]+)\)/);
    const asOf = dateMatch?.[1] ? formatDate(locale, dateMatch[1]) : "n/a";
    return t(
      locale,
      `?レ옄 ?댁쁺 吏???몃컙?먯꽌 怨듭떆??理쒖떊 MEE ?띾낫(${asOf})瑜?湲곗??쇰줈 ?⑸땲??`,
      `Numeric operating metrics are taken from the latest MEE bulletin with published market statistics (${asOf}).`
    );
  }

  return localizeText(getUiLocale(locale), note);
}

function getOfficialNotes(locale: AppLocale, card: ConnectedSourceCard | null) {
  return (card?.notes ?? []).map((note) => getOfficialNoteLabel(locale, note));
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
      t(locale, "?ㅼ쓬 EEX 寃쎈ℓ ?쇱젙怨?吏곸쟾 而ㅻ쾭???뺤씤", "Check the next EEX auction date and latest cover ratio"),
      t(locale, "Re-check TTF gas and power spread direction", "Re-check TTF gas and power spread direction"),
      t(locale, "MSR쨌TNAC 愿??怨듭떇 諛쒗몴 ?щ? ?뺤씤", "Review any MSR or TNAC-related official notice")
    ];
  }
  if (marketId === "k-ets") {
    return [
      t(locale, "KAU 嫄곕옒?됱씠 20???됯퇏 ?꾩씤吏 ?뺤씤", "Check whether KAU volume is above the 20-day average"),
      t(locale, "?댄뻾 ?쒖쫵쨌寃利앸낫怨??쇱젙 吏꾩엯 ?щ? ?뺤씤", "Check whether the market is entering the compliance/reporting window"),
      t(locale, "KCU/KOC? ?꾨Ъ 泥닿껐 ?먮쫫 遺꾨━ ?щ? ?뺤씤", "Confirm whether offset flow is diverging from the main tape")
    ];
  }
  return [
    t(locale, "怨듭떇 怨듭? ?댄썑 ??媛寃??뚯씠?꾧? ?덈뒗吏 ?뺤씤", "Check whether a new official price tape has appeared after the latest notice"),
    t(locale, "?뱁꽣 ?뺣?쨌諛곗젙 洹쒖튃 怨듭떆 ?щ? ?뺤씤", "Review any sector expansion or allocation update"),
    t(locale, "?꾨줉?쒖? 怨듭떇 怨듭? ?먮쫫??遺꾨━?댁꽌 ?쎄린", "Keep proxy price action separate from official policy flow")
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
  const freshnessDays = getFreshnessDays(card?.asOf) ?? 99;

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
        ? t(locale, "怨듭떇媛믨낵 鍮꾧탳 湲곗???鍮꾧탳??媛숈? 諛⑺뼢?낅땲?? 吏湲덉? 留ㅼ닔 ?곗쐞 ?댁꽍??媛?ν빀?덈떎.", "Official tape and listed benchmark are mostly aligned. The current read leans buy.")
        : stance === "reduce"
          ? t(locale, "怨듭떇媛믨낵 鍮꾧탳 湲곗????쏀빐吏嫄곕굹 ?닿툔?⑸땲?? 吏湲덉? 鍮꾩쨷 異뺤냼 履쎌씠 ?덉쟾?⑸땲??", "The official anchor and listed benchmark are weakening or diverging. Reducing risk is cleaner here.")
          : t(locale, "?쒖そ 諛⑺뼢?쇰줈 諛湲곕낫??怨듭떇媛??좎?? 鍮꾧탳 湲곗? ?⑹쓽瑜????뺤씤??援ш컙?낅땲??", "This is a wait zone. Confirm the official anchor and benchmark agreement before leaning harder."),
    support: [
      {
        title: t(locale, "Official anchor", "Official anchor"),
        detail: t(
          locale,
          `${getOfficialSourceName(locale, card)} 蹂?붾뒗 ${getOfficialChangeLabel(card)}?낅땲??`,
          `${getOfficialSourceName(locale, card)} is showing ${getOfficialChangeLabel(card)}.`
        )
      },
      {
        title: t(locale, "?곸옣 湲곗?", "Listed benchmark"),
        detail: t(locale, `${benchmark?.title ?? "鍮꾧탳 湲곗? ?놁쓬"} 蹂?붿쑉? ${formatPercent(locale, benchmarkMove, 2)}?낅땲??`, `${benchmark?.title ?? "No benchmark selected"} is moving ${formatPercent(locale, benchmarkMove, 2)}.`)
      },
      {
        title: t(locale, "?듭떖 ?붿씤", "Top drivers"),
        detail: supportDrivers.map((driver) => driver.variable).join(" / ")
      }
    ],
    risks: [
      benchmark?.category === "Listed proxy"
        ? t(locale, "?꾩옱 鍮꾧탳 湲곗?? ?꾨줉?쒖엯?덈떎. 怨듭떇 ?뺤궛媛믨낵 1:1濡??쎌쑝硫????⑸땲??", "The active benchmark is a proxy. Do not read it as a one-for-one replacement for the official settlement.")
        : t(locale, "臾대즺 ?쇰뱶 湲곗? ?곸옣 ?뚯씠?꾨뒗 嫄곕옒??吏?곗씠 ?덉쓣 ???덉뒿?덈떎.", "On free feeds the listed tape can still carry exchange delay."),
      card?.status === "limited"
        ? t(locale, "怨듭떇 ?뚯뒪媛 ?쒗븳 ?곹깭???좊ː?꾨? ??떠???⑸땲??", "The official source is limited, so conviction should be discounted.")
        : t(locale, "怨듭떇 ?뚯뒪媛 ?곌껐???덉뼱???ㅼ쓬 媛깆떊 ?꾩뿉???먮떒??諛붾????덉뒿?덈떎.", "Even with the official source connected, the read can change before the next update."),
      stats.correlation !== null && stats.correlation < 0.2
        ? t(locale, "怨듭떇媛믨낵 鍮꾧탳 湲곗???理쒓렐 ?숉뻾?깆씠 ?쏀빀?덈떎.", "Recent co-movement between the official anchor and the benchmark is weak.")
        : t(locale, "?꾩옱 ?먮떒? 理쒓렐 ?숉뻾?깆씠 ?좎??쒕떎??媛?뺤뿉 ???덉뒿?덈떎.", "The current read assumes recent tape agreement continues.")
    ],
    checks: getMarketChecklist(locale, market.id),
    waterfall: [
      { label: t(locale, "Official", "Official"), value: officialScore },
      { label: t(locale, "鍮꾧탳 湲곗?", "Benchmark"), value: benchmarkScore },
      { label: t(locale, "Agreement", "Agreement"), value: agreementScore },
      { label: t(locale, "Freshness", "Freshness"), value: freshnessScore },
      { label: t(locale, "?뚯뒪", "Source"), value: sourcePenalty + proxyPenalty }
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

function getSourceStatusLabel(
  locale: AppLocale,
  status: ConnectedSourceCard["status"] | MarketLiveQuote["status"]
) {
  if (status === "connected") return t(locale, "Connected", "Connected");
  if (status === "limited") return t(locale, "?쒗븳", "Limited");
  return t(locale, "?ㅻ쪟", "Error");
}

function createChatMessage(role: LocalChatMessage["role"], content: string, model?: string): LocalChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    model,
    status: "done"
  };
}

function getLocalLlmStatusLabel(locale: AppLocale, state: LocalLlmState) {
  if (state.available) {
    return joinReadoutParts(
      getAssistantProviderLabel(locale, "ollama"),
      state.selectedModel || t(locale, "紐⑤뜽 ?좏깮 ?꾩슂", "Select a model")
    );
  }
  if (!state.installed) {
    return t(locale, "Ollama not installed", "Ollama not installed");
  }
  if (!state.reachable) {
    return t(locale, "Ollama ?쒖옉 ?꾩슂", "Start Ollama");
  }
  return t(locale, "紐⑤뜽 ?ㅼ튂 ?꾩슂", "Install a model");
}

function getLocalLlmSetupSteps(locale: AppLocale, state: LocalLlmState) {
  if (!state.installed) {
    return [
      "winget install --id Ollama.Ollama -e",
      `ollama pull ${LOCAL_MODEL_RECOMMENDED}`,
      t(locale, "?깆뿉???ㅼ떆 ?곌껐 ?뺤씤", "Recheck connection in the app")
    ];
  }

  if (!state.reachable) {
    return [
      t(locale, "Ollama ???ㅽ뻾 ?먮뒗 諛깃렇?쇱슫???쒕퉬???쒖옉", "Launch the Ollama app or start its background service"),
      `ollama pull ${LOCAL_MODEL_RECOMMENDED}`,
      t(locale, "?깆뿉???ㅼ떆 ?곌껐 ?뺤씤", "Recheck connection in the app")
    ];
  }

  if (state.models.length === 0) {
    return [
      `ollama pull ${LOCAL_MODEL_RECOMMENDED}`,
      t(locale, "紐⑤뜽???대젮諛쏆븘吏硫??깆뿉???ㅼ떆 ?곌껐 ?뺤씤", "Recheck connection after the model finishes downloading")
    ];
  }

  return [];
}

function getStanceLabel(locale: AppLocale, stance: DecisionSummary["stance"]) {
  if (stance === "buy") return t(locale, "留ㅼ닔 ?곗쐞", "Buy bias");
  if (stance === "reduce") return t(locale, "鍮꾩쨷 異뺤냼", "Reduce");
  return t(locale, "Hold / wait", "Hold / wait");
}

function getAssistantStanceLabel(
  locale: AppLocale,
  stance: DecisionAssistantResponse["stance"]
) {
  if (stance === "Buy Bias") return t(locale, "留ㅼ닔 ?곗쐞", "Buy bias");
  if (stance === "Reduce Bias") return t(locale, "鍮꾩쨷 異뺤냼", "Reduce");
  return t(locale, "Hold / wait", "Hold / wait");
}

function buildCopilotBriefCards(
  locale: AppLocale,
  response: DecisionAssistantResponse
) {
  if (response.operatorBrief.length > 0) {
    return response.operatorBrief.slice(0, 4);
  }

  return [
    {
      title: t(locale, "湲곕낯 ?먮떒", "Base case"),
      summary: response.summary,
      bullets: response.thesis.slice(0, 3)
    },
    {
      title: t(locale, "李ъ꽦 洹쇨굅", "Support"),
      summary:
        response.supportingEvidence[0]?.detail ??
        response.thesis[0] ??
        t(locale, "異붽? 李ъ꽦 洹쇨굅媛 ?꾩쭅 ?뺣━?섏? ?딆븯?듬땲??", "No supporting detail yet."),
      bullets:
        response.supportingEvidence.length > 0
          ? response.supportingEvidence
              .slice(0, 3)
              .map((item) => `${item.title}: ${item.detail}`)
          : response.thesis.slice(0, 3)
    },
    {
      title: t(locale, "諛섎? 洹쇨굅", "Counter-evidence"),
      summary:
        response.counterEvidence[0]?.detail ??
        response.risks[0] ??
        t(locale, "利됱떆 蹂댁씠??諛섎? 洹쇨굅???쒗븳?곸엯?덈떎.", "Immediate counter-evidence is limited."),
      bullets:
        response.counterEvidence.length > 0
          ? response.counterEvidence
              .slice(0, 3)
              .map((item) => `${item.title}: ${item.detail}`)
          : response.risks.slice(0, 3)
    },
    {
      title: t(locale, "吏湲??뺤씤", "Verify now"),
      summary:
        response.checkpoints[0] ??
        response.actions[0] ??
        t(locale, "?ㅼ쓬 ?뺤씤 ??ぉ???꾩쭅 ?놁뒿?덈떎.", "No next check is available yet."),
      bullets:
        response.checkpoints.length > 0
          ? response.checkpoints.slice(0, 4)
          : response.actions.slice(0, 4)
    }
  ];
}

function getSurfaceLabel(locale: AppLocale, surface: Surface) {
  if (surface === "command") return t(locale, "Command", "Command");
  if (surface === "desk") return t(locale, "Desk", "Desk");
  if (surface === "drivers") return t(locale, "?쒕씪?대쾭", "Drivers");
  if (surface === "sources") return t(locale, "?뚯뒪", "Sources");
  return t(locale, "肄뷀뙆?쇰읉", "Copilot");
}

function getMarketHeadline(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return t(locale, "EU carbon desk built around EEX auctions and listed hedge anchors", "EU carbon desk built around EEX auctions and listed hedge anchors");
  }
  if (marketId === "k-ets") {
    return t(locale, "Korean carbon desk centered on official KRX tape and trading depth", "Korean carbon desk centered on official KRX tape and trading depth");
  }
  return t(locale, "China carbon desk that separates policy flow from limited official time series", "China carbon desk that separates policy flow from limited official time series");
}

function getMarketStageNote(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return t(
      locale,
      "EU ETS 4湲??쒖옣?쇰줈, MSR 湲곕컲 怨듦툒 議곗젙???묐룞?섍퀬 2024?꾨????댁슫???ы븿?먯쑝硫?2027?꾨???嫄대Ъ쨌?꾨줈 ?댁넚 ETS2媛 媛?숇맗?덈떎.",
      "Phase 4 market with MSR-driven supply management, maritime inclusion from 2024, and ETS2 standing up for buildings and road transport from 2027."
    );
  }
  if (marketId === "k-ets") {
    return t(
      locale,
      "3李?怨꾪쉷湲곌컙? 2025?꾧퉴吏?닿퀬, ??李?湲곕낯怨꾪쉷? 2026?꾨???2035?꾧퉴吏 寃쎈ℓ ?뺣?, 踰ㅼ튂留덊겕 媛쒗렪, ?좊룞???묎렐, ?먮룞 ?쒖옣?덉젙 ?μ튂瑜??ㅻ９?덈떎.",
      "Phase 3 runs through 2025; the fourth Basic Plan covers 2026-2035 and raises auctioning, benchmarking, liquidity access, and automatic market stabilization."
    );
  }
  return t(
    locale,
    "?꾧뎅 ?쒖옣? ?ъ쟾???꾨젰 遺臾?以묒떖?댁?留? 2025??3??20???낅Т怨꾪쉷???곕씪 泥좉컯쨌?쒕찘?맞룹쟾?댁븣猷⑤??꾩쑝濡??뺣? 以묒엯?덈떎.",
    "The national market remains power-led but is expanding to steel, cement, and aluminum smelting under the March 20, 2025 work plan."
  );
}

function getMarketScopeNote(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return t(
      locale,
      "EU 吏묓뻾???먮즺? 2024-2025 ?곌뎄瑜?湲곗??쇰줈 蹂대㈃ ?뺤콉 怨듦툒, 媛?ㅒ룹쟾?Β룹꽍???곕즺?꾪솚, 嫄곗떆쨌湲덉쑖 ?ㅽ듃?덉뒪, ?댄뻾 ?쒖젏???듭떖 ?붿씤援곗엯?덈떎.",
      "EU Commission pages and 2024-2025 research consistently show that policy supply, gas-power-coal complex, macro-financial stress, and compliance timing remain the dominant feature families."
    );
  }
  if (marketId === "k-ets") {
    return t(
      locale,
      "K-ETS???ъ쟾???뺤콉 二쇰룄 ?쒖옣?낅땲?? ?대? 諛곗텧沅??섍툒, ?곸뇙?쒖옣, ?댄뻾 罹섎┛?? ?쒕룄 蹂寃쎌씠 ?몃? 嫄곗떆 蹂?섎낫??癒쇱? ?쏀????⑸땲??",
      "K-ETS remains structurally policy-driven. Internal allowance balance, offset markets, compliance calendar, and market design changes still dominate before external macro variables fully take over."
    );
  }
  return t(
    locale,
    "以묎뎅 ?꾧뎅 ?쒖옣? ?꾨젰?쒖옣 媛쒗쁺, ?앺깂 寃쎌젣?? ?먮떒??湲곕컲 ?좊떦, ?곗씠???덉쭏, ?④퀎???낆쥌 ?뺤옣???듭떖 援ъ“瑜?留뚮벊?덈떎.",
    "China's market is still shaped by power-sector reform, coal economics, intensity-based allocation, data quality, and staged sector expansion."
  );
}

function getMarketSourceNote(locale: AppLocale, marketId: MarketId) {
  if (marketId === "eu-ets") {
    return t(
      locale,
      "?대뼡 ?⑥씪 ?뚯뒪??媛寃??뺤꽦??100% ?멸낵 遺꾪빐??二쇱? ?딆뒿?덈떎. ???쒗뭹? ?곌뎄濡?寃利앸맂 ?ш큵??蹂?섍뎔???댁쁺 紐⑤뜽 ?낅젰?쇰줈 ?ъ슜?⑸땲??",
      "No source can prove a literal causal 100% decomposition of price formation. This product uses a research-backed comprehensive feature universe for production modelling."
    );
  }
  if (marketId === "k-ets") {
    return t(
      locale,
      "?쒓뎅 ?쒖옣? EU ETS蹂대떎 ?뉕린 ?뚮Ц???대? ?쒖옣 援ъ“? ?뺤콉 蹂寃쎌쓣 遺李?蹂?섍? ?꾨땲??1李?蹂?섎줈 ?ㅻ쨪???⑸땲??",
      "The Korean market is thinner than EU ETS, so internal market structure and policy changes must be treated as first-order variables, not side features."
    );
  }
  return t(
    locale,
    "?꾧뎅 ETS 蹂?섎뒗 ?뺤콉 吏묓뻾, ?쒖옣 ?깆닕?? ?꾨젰媛쒗쁺???곕씪 ?붿씤 誘쇨컧?꾧? ?ш쾶 ?щ씪吏????덉뼱 媛뺥븳 ?덉쭚 ?섏〈?깆쓣 ?꾩젣濡??ㅻ쨪???⑸땲??",
    "National ETS variables must be modelled with stronger regime dependence because policy implementation, market maturity, and electricity reform can all change factor loadings."
  );
}

function getForecastDirectionLabel(
  locale: AppLocale,
  direction: "Bullish" | "Neutral" | "Bearish"
) {
  if (direction === "Bullish") {
    return t(locale, "?곷갑", "Bullish");
  }
  if (direction === "Bearish") {
    return t(locale, "?섎갑", "Bearish");
  }
  return t(locale, "以묐┰", "Neutral");
}

function getQuoteNoteLabel(locale: AppLocale, quote?: MarketLiveQuote | null) {
  if (!quote) {
    return t(locale, "?ㅻ챸 ?놁쓬", "No note");
  }

  if (quote.note.startsWith("Live quote unavailable:")) {
    const reason = quote.note.slice("Live quote unavailable:".length).trim();
    return t(
      locale,
      `?ㅼ떆媛??쒖꽭瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲?? ${reason}`,
      `Live quote unavailable: ${reason}`
    );
  }

  switch (quote.id) {
    case "eua-dec-benchmark":
      return t(
        locale,
        "EUA ?곸옣 湲곗??쇰줈 ?곕뒗 12?붾Ъ?낅땲?? ?쇰? 臾대즺 李⑦듃 ?쇰뱶???꾩껜 ?덉뒪?좊━蹂대떎 理쒓렐 媛寃⑹쓣 ??鍮⑤━ ?몄텧?⑸땲??",
        "December benchmark contract used as the main listed EUA reference. Some free chart feeds expose the live price faster than the full historical curve."
      );
    case "co2-l-proxy":
      return t(
        locale,
        "?곸옣???꾩냼 ?꾨줉?쒕줈, EUA 湲곗?臾쇨낵 ?섎????쎌쓣 ???좎슜?⑸땲??",
        "Useful as a listed carbon proxy alongside the benchmark EUA future."
      );
    case "krbn-proxy":
      return t(
        locale,
        "?꾨줉???꾩슜?낅땲?? 怨듭떇 吏??ETS ?뺤궛媛믪쑝濡??쎌쑝硫????⑸땲??",
        "Proxy only. Do not treat this as an official local ETS settlement."
      );
    case "keua-proxy":
      return t(
        locale,
        "?꾨줉???꾩슜?낅땲?? 怨듭떇 ?곸옣 ?ㅼ? ?듭빱???ъ쟾??ICE EUA ?좊Ъ?낅땲??",
        "Proxy only. The official listed hedge anchor remains the ICE EUA future."
      );
    case "kcca-proxy":
      return t(
        locale,
        "?꾨줉???꾩슜?낅땲?? ?꾩? ETS ?뺤궛媛믪씠 ?꾨땲??異붽? ?곸옣 ?꾩냼 ?щ━釉뚮줈 ?쎌뼱???⑸땲??",
        "Proxy only. Useful as an additional listed carbon sleeve, not as a local ETS settlement."
      );
    case "ttf-gas-future":
      return t(
        locale,
        "가스는 단기 탄소 재가격 형성에 계속 들어가는 핵심 입력 변수입니다.",
        "Gas remains one of the key inputs behind short-term carbon repricing."
      );
    case "brent-future":
      return t(
        locale,
        "탄소가 더 넓은 원자재 복합체와 함께 움직일 때 에너지 리스크의 거친 방향을 읽는 데 유용합니다.",
        "Useful for broad energy risk context when carbon trades with the wider commodity complex."
      );
    default:
      return localizeText(getUiLocale(locale), quote.note);
  }
}

function getQuoteDelayNoteLabel(locale: AppLocale, quote?: MarketLiveQuote | null) {
  if (!quote?.delayNote) {
    return t(locale, "吏???뺣낫 ?놁쓬", "No delay note");
  }

  if (quote.delayNote === "Reference web chart feed. Exchange delay may apply.") {
    return t(
      locale,
      "李멸퀬????李⑦듃 ?쇰뱶?낅땲?? 嫄곕옒??吏?곗씠 ?덉쓣 ???덉뒿?덈떎.",
      "Reference web chart feed. Exchange delay may apply."
    );
  }

  if (
    quote.delayNote ===
    "Reference web chart feed. Use as a listed proxy, not as the official carbon price."
  ) {
    return t(
      locale,
      "李멸퀬????李⑦듃 ?쇰뱶?낅땲?? 怨듭떇 ?꾩냼 媛寃⑹씠 ?꾨땲???곸옣 ?꾨줉?쒕줈留??ъ슜?섏꽭??",
      "Reference web chart feed. Use as a listed proxy, not as the official carbon price."
    );
  }

  return localizeText(getUiLocale(locale), quote.delayNote);
}

function getQuoteRoleLabel(locale: AppLocale, quote?: MarketLiveQuote | null) {
  if (!quote?.role) {
    return t(locale, "??븷 ?뺣낫 ?놁쓬", "No role note");
  }

  switch (quote.id) {
    case "eua-dec-benchmark":
      return t(
        locale,
        "EU ?꾩냼 由ъ뒪?ы? ?꾩슜 1李?곸옣 ???뚯씠??",
        "Primary listed hedge tape for EU carbon risk"
      );
    case "ttf-gas-future":
      return t(
        locale,
        "EU ?꾩냼???곕즺?꾪솚 ?붿씤",
        "Fuel-switching driver for EU carbon"
      );
    case "brent-future":
      return t(locale, "嫄곗떆 ?먮꼫吏 ?꾨줉??", "Macro energy proxy");
    case "co2-l-proxy":
      return t(locale, "?곸옣 ??EU ?꾩냼 ?꾨줉??", "Exchange-traded EU carbon proxy");
    case "krbn-proxy":
      return t(
        locale,
        "濡쒖뺄 ETS ?좊Ъ媛 ?놁쓣 ???곸옣 ?꾩냼 ?꾨줉??",
        "Listed carbon proxy when local ETS futures are not available"
      );
    case "keua-proxy":
      return t(locale, "EU ?꾩냼 ?몄텧 ?꾩슜 ?곸옣 ?꾨줉??", "Listed proxy for EU carbon exposure");
    case "kcca-proxy":
      return t(
        locale,
        "?쒖옣 媛?由ъ뒪?ы겕 ?좏샇瑜??꾪븳 遺곸쭏誘?꾩냼 ?곸옣 ?꾨줉??",
        "Listed North American carbon proxy for cross-market risk appetite"
      );
    default:
      return localizeText(getUiLocale(locale), quote.role);
  }
}

function getQuoteProviderLabel(locale: AppLocale, provider?: string | null) {
  if (!provider) {
    return "n/a";
  }

  if (provider === "Yahoo Finance web chart feed") {
    return t(locale, "Yahoo Finance ??李⑦듃 ?쇰뱶", "Yahoo Finance web chart feed");
  }

  return localizeText(getUiLocale(locale), provider);
}

function getPriceDecimals(currency?: string | null) {
  if (currency === "KRW" || currency === "JPY") {
    return 0;
  }

  return 2;
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
    t(locale, "怨듭떇 ?뚯뒪", "Official source"),
    joinReadoutParts(getOfficialSourceName(locale, card), card?.asOf ?? "n/a"),
    "",
    t(locale, "Official anchor", "Official anchor"),
    `${getOfficialPriceLabel(card)} / ${getOfficialChangeLabel(card)}`,
    "",
    t(locale, "鍮꾧탳 湲곗?", "Benchmark"),
    `${benchmark?.title ?? "n/a"} / ${benchmark?.symbol ?? "n/a"} / ${benchmark ? formatPercent(locale, benchmark.changePct, 2) : "n/a"}`,
    "",
    t(locale, "Current stance", "Current stance"),
    joinReadoutParts(getStanceLabel(locale, decision.stance), `${Math.round(decision.confidence * 100)}%`),
    "",
    t(locale, "?듭떖 ?댁꽍", "Desk read"),
    decision.summary,
    "",
    t(locale, "洹쇨굅", "Support"),
    ...decision.support.map((item) => `- ${item.title}: ${item.detail}`),
    "",
    t(locale, "Checks", "Checks"),
    ...decision.checks.map((item) => `- ${item}`)
  ].join("\n");
}

function buildChatGrounding(
  locale: AppLocale,
  market: MarketProfile,
  card: ConnectedSourceCard | null,
  benchmark: MarketLiveQuote | null,
  registryItems: typeof sourceRegistry
): ChatGroundingItem[] {
  const grounding: ChatGroundingItem[] = [];

  if (card) {
    grounding.push({
      id: `${market.id}-official-anchor`,
      kind: "Official anchor",
      label: getOfficialSourceName(locale, card),
      detail: `${getOfficialHeadlineLabel(locale, card)}. ${getOfficialSummaryLabel(locale, card)}`,
      asOf: card.asOf,
      url: card.sourceUrl
    });
  }

  if (benchmark) {
    grounding.push({
      id: `${market.id}-listed-comparison`,
      kind: "Listed comparison",
      label: benchmark.title,
      detail: `${getQuoteRoleLabel(locale, benchmark)}. ${getQuoteNoteLabel(locale, benchmark)}`,
      asOf: benchmark.asOf,
      url: benchmark.sourceUrl
    });
  }

  const contextSource = registryItems[0];
  if (contextSource) {
    grounding.push({
      id: `${market.id}-official-context`,
      kind: "Official context",
      label: localizeText(getUiLocale(locale), contextSource.title),
      detail: `${localizeText(getUiLocale(locale), contextSource.method)}. ${localizeText(
        getUiLocale(locale),
        contextSource.whyItMatters
      )}`,
      url: contextSource.url
    });
  }

  grounding.push({
    id: `${market.id}-freshness`,
    kind: "Source freshness",
    label: t(locale, "Source freshness", "Source freshness"),
    detail: t(
      locale,
      `${market.name} 怨듭떇 湲곗?媛믪? ${getFreshnessSummary(locale, card?.asOf)} ?곹깭?낅땲??`,
      `${market.name} official anchor is ${getFreshnessSummary(locale, card?.asOf)}.`
    ),
    asOf: card?.asOf ?? benchmark?.asOf
  });

  const topDriver = market.drivers
    .slice()
    .sort((left, right) => right.weight - left.weight)[0];
  if (topDriver) {
    grounding.push({
      id: `${market.id}-key-driver`,
      kind: "Key driver",
      label: topDriver.variable,
      detail: localizeText(getUiLocale(locale), topDriver.note)
    });
  }

  return grounding;
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
  const [chatSessionsByMarket, setChatSessionsByMarket] =
    useState<Record<MarketId, LocalChatMessage[]>>(readStoredChatSessions);
  const [chatInput, setChatInput] = useState("");
  const [copilotResponseStyle, setCopilotResponseStyle] =
    useState<CopilotResponseStyle>(readStoredCopilotResponseStyle);
  const [localChatLoading, setLocalChatLoading] = useState(false);
  const [localChatError, setLocalChatError] = useState<string | null>(null);
  const [localLlmLaunching, setLocalLlmLaunching] = useState(false);
  const [localLlmSaving, setLocalLlmSaving] = useState(false);
  const [localLlmError, setLocalLlmError] = useState<string | null>(null);
  const [compareQuoteByMarket, setCompareQuoteByMarket] = useState<Record<MarketId, string>>({
    "eu-ets": readStoredString("cquant:quote:eu-ets", DEFAULT_COMPARE_QUOTE["eu-ets"]),
    "k-ets": readStoredString("cquant:quote:k-ets", DEFAULT_COMPARE_QUOTE["k-ets"]),
    "cn-ets": readStoredString("cquant:quote:cn-ets", DEFAULT_COMPARE_QUOTE["cn-ets"])
  });
  const [compareQuoteHistory, setCompareQuoteHistory] = useState<MarketLiveQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [scenarioState, setScenarioState] = useState<Record<string, number>>({});

  const selectedMarket = useMemo(
    () => marketProfiles.find((item) => item.id === marketId) ?? marketProfiles[1],
    [marketId]
  );
  const selectedInputBlocks = useMemo(
    () => marketInputBlocks.filter((item) => item.marketId === marketId),
    [marketId]
  );
  const l = (text?: string) => localizeText(getUiLocale(locale), text);
  const workspaceScrollRef = useRef<HTMLElement | null>(null);
  const inspectorScrollRef = useRef<HTMLElement | null>(null);
  const chatThreadRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const currentChatMessages = chatSessionsByMarket[marketId] ?? [];
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
  const compareVolumeSeries = useMemo(
    () => buildVolumePoints(selectedCompareQuote?.series),
    [selectedCompareQuote]
  );
  const liveTapeSupportsCandles = useMemo(
    () =>
      comparePoints.some(
        (point) =>
          typeof point.open === "number" &&
          typeof point.high === "number" &&
          typeof point.low === "number" &&
          typeof point.close === "number"
      ),
    [comparePoints]
  );
  const latestLiveBarSnapshot = useMemo(() => {
    const series = selectedCompareQuote?.series ?? [];
    const latest = series[series.length - 1];
    if (!latest) {
      return null;
    }

    return {
      open: typeof latest.open === "number" ? latest.open : null,
      high: typeof latest.high === "number" ? latest.high : null,
      low: typeof latest.low === "number" ? latest.low : null,
      close: typeof latest.close === "number" ? latest.close : null,
      volume: typeof latest.volume === "number" ? latest.volume : null
    };
  }, [selectedCompareQuote]);
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
  const selectedOfficialFreshnessDays = getFreshnessDays(selectedOfficialCard?.asOf);
  const selectedOfficialFreshnessLevel = getFreshnessLevel(selectedOfficialFreshnessDays);
  const selectedLiveFreshnessDays = getFreshnessDays(selectedCompareQuote?.asOf);
  const selectedLiveFreshnessLevel = getFreshnessLevel(selectedLiveFreshnessDays);
  const copilotPayload = useMemo(
    () => ({
      market: {
        id: selectedMarket.id,
        name: selectedMarket.name,
        region: selectedMarket.region,
        stageNote: getMarketStageNote(locale, selectedMarket.id),
        scopeNote: getMarketScopeNote(locale, selectedMarket.id),
        sourceNote: getMarketSourceNote(locale, selectedMarket.id)
      },
      copilotPreferences: {
        responseStyle: getCopilotResponseStyleLabel(locale, copilotResponseStyle),
        responseSummary: getCopilotResponseStyleSummary(locale, copilotResponseStyle)
      },
      officialAnchor: selectedOfficialCard
        ? {
            sourceName: getOfficialSourceName(locale, selectedOfficialCard),
            coverage: getOfficialCoverageLabel(locale, selectedOfficialCard),
            status: selectedOfficialCard.status,
            asOf: selectedOfficialCard.asOf,
            headline: getOfficialHeadlineLabel(locale, selectedOfficialCard),
            summary: getOfficialSummaryLabel(locale, selectedOfficialCard),
            metrics: selectedOfficialCard.metrics,
            notes: getOfficialNotes(locale, selectedOfficialCard)
          }
        : null,
      liveTape: selectedCompareQuote
        ? {
            id: selectedCompareQuote.id,
            title: selectedCompareQuote.title,
            symbol: selectedCompareQuote.symbol,
            category: selectedCompareQuote.category,
            provider: getQuoteProviderLabel(locale, selectedCompareQuote.provider),
            exchange: selectedCompareQuote.exchange,
            status: selectedCompareQuote.status,
            asOf: selectedCompareQuote.asOf,
            price: selectedCompareQuote.price,
            change: selectedCompareQuote.change,
            changePct: selectedCompareQuote.changePct,
            currency: selectedCompareQuote.currency,
            role: getQuoteRoleLabel(locale, selectedCompareQuote),
            note: getQuoteNoteLabel(locale, selectedCompareQuote),
            delayNote: getQuoteDelayNoteLabel(locale, selectedCompareQuote)
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
      },
      inputCoverage: selectedInputBlocks.map((block) => ({
        title: block.title,
        accessMethod: block.accessMethod,
        refreshCadence: block.refreshCadence,
        purpose: block.purpose,
        fields: block.fields.slice(0, 4)
      })),
      grounding: buildChatGrounding(
        locale,
        selectedMarket,
        selectedOfficialCard,
        selectedCompareQuote,
        sourceRegistry.filter(
          (item) => item.markets.includes(selectedMarket.id) || item.markets.includes("shared")
        )
      )
    }),
    [
      compareOutput.stats,
      connectedSources.fetchedAt,
      copilotResponseStyle,
      locale,
      selectedInputBlocks,
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
        const freshnessDays = getFreshnessDays(officialCard?.asOf);
        return {
          market,
          officialCard,
          hedgeQuote,
          compareStats: stats,
          decision: buildDecisionSummary(locale, market, officialCard, hedgeQuote, stats),
          freshnessDays,
          freshnessLevel: getFreshnessLevel(freshnessDays)
        };
      }),
    [connectedSources.liveQuotes, locale, officialCardsByMarket]
  );
  const sourceRegistryForMarket = useMemo(
    () =>
      sourceRegistry.filter(
        (item) => item.markets.includes(marketId) || item.markets.includes("shared")
      ),
    [marketId]
  );
  const selectedLocalModelMeta = useMemo(
    () =>
      localLlmState.models.find((model) => model.model === localLlmState.selectedModel) ??
      localLlmState.models[0] ??
      null,
    [localLlmState.models, localLlmState.selectedModel]
  );
  const latestChatMessage = currentChatMessages[currentChatMessages.length - 1] ?? null;
  const deskHealthSummary = useMemo(
    () => ({
      officialConnected: connectedSources.cards.filter((card) => card.status !== "error").length,
      officialFresh: marketBoardRows.filter((row) => row.freshnessLevel === "fresh").length,
      liveConnected: connectedSources.liveQuotes.filter((quote) => quote.status === "connected").length,
      warningCount: connectedSources.warnings.length
    }),
    [connectedSources.cards, connectedSources.liveQuotes, connectedSources.warnings.length, marketBoardRows]
  );
  const benchmarkReferenceCards = useMemo(
    () =>
      benchmarkPlatforms.filter((platform) =>
        [
          "tradingview-lightweight-charts",
          "yahoo-finance-advanced-chart",
          "claude-desktop-cowork",
          "openbb-workspace"
        ].includes(platform.id)
      ),
    []
  );
  const allInOneBenchmarkCards = useMemo(
    () =>
      benchmarkPlatforms.filter((platform) =>
        [
          "persefoni-accounting",
          "watershed-platform",
          "patch-procurement",
          "sylvera",
          "bezero-carbon"
        ].includes(platform.id)
      ),
    []
  );
  const architectureBenchmarkCards = useMemo(
    () =>
      openSourceBenchmarks.filter((benchmark) =>
        ["hyperledger-carbon-accounting", "os-climate", "openghg", "forest-risks"].includes(
          benchmark.id
        )
      ),
    []
  );
  const registryTracksForMarket = useMemo(
    () =>
      registryOperationsTracks.filter(
        (track) => track.markets.includes(marketId) || track.markets.includes("shared")
      ),
    [marketId]
  );
  const lifecycleDossiersForMarket = useMemo(
    () =>
      creditLifecycleDossiers.filter(
        (dossier) => dossier.markets.includes(marketId) || dossier.markets.includes("shared")
      ),
    [marketId]
  );
  const riskOverlaysForMarket = useMemo(
    () =>
      natureRiskOverlays.filter(
        (overlay) => overlay.markets.includes(marketId) || overlay.markets.includes("shared")
      ),
    [marketId]
  );
  const sharedFrameworkRails = useMemo(
    () => sourceRegistryForMarket.filter((item) => item.markets.includes("shared")),
    [sourceRegistryForMarket]
  );
  const accountingSidecar = useMemo(() => {
    const coreFields = selectedInputBlocks.reduce(
      (sum, block) => sum + block.fields.filter((field) => field.priority === "Core").length,
      0
    );
    const supportFields = selectedInputBlocks.reduce(
      (sum, block) => sum + block.fields.filter((field) => field.priority !== "Core").length,
      0
    );
    const registryDocumentCount = lifecycleDossiersForMarket.reduce(
      (sum, dossier) => sum + dossier.documents.length,
      0
    );

    return {
      metrics: [
        {
          id: "standards",
          label: tf(locale, "표준 레일", "Standards online"),
          value: `${sharedFrameworkRails.length}`,
          detail: tf(locale, "GHG·registry 기준", "GHG and registry rails")
        },
        {
          id: "core-inputs",
          label: tf(locale, "핵심 입력", "Core tracked inputs"),
          value: `${coreFields}`,
          detail: tf(locale, "시장·정책·비교 테이프", "Market, policy, and comparison inputs")
        },
        {
          id: "support-inputs",
          label: tf(locale, "보조 입력", "Support inputs"),
          value: `${supportFields}`,
          detail: tf(locale, "컨텍스트·macro·seasonality", "Context, macro, and seasonality")
        },
        {
          id: "registry-docs",
          label: tf(locale, "문서 근거", "Registry documents"),
          value: `${registryDocumentCount}`,
          detail: tf(locale, "라이프사이클 dossier", "Lifecycle dossier coverage")
        }
      ],
      readiness: [
        {
          id: "boundary-standard",
          label: tf(locale, "회계 경계 기준", "Accounting boundary standard"),
          status: tf(locale, "연결됨", "Connected"),
          tone: "positive",
          note: tf(
            locale,
            "GHG Protocol rail을 제품 안에 고정해 Scope 1·2·3 경계 설명을 시장 읽기 옆에 둘 수 있습니다.",
            "The GHG Protocol rail is already anchored in-product, so Scope 1, 2, and 3 boundary logic can sit beside the market read."
          )
        },
        {
          id: "factor-provenance",
          label: tf(locale, "배출·팩터 provenance", "Factor provenance"),
          status: tf(locale, "구현됨", "Implemented"),
          tone: "positive",
          note: tf(
            locale,
            `${selectedMarket.name} 기준 핵심 입력 ${coreFields}개와 보조 입력 ${supportFields}개가 인앱 커버리지로 연결돼 있습니다.`,
            `${coreFields} core and ${supportFields} support inputs are already wired as in-app coverage for ${selectedMarket.name}.`
          )
        },
        {
          id: "entity-ledger",
          label: tf(locale, "기업 활동 데이터 원장", "Entity activity ledger"),
          status: tf(locale, "다음 빌드", "Next build"),
          tone: "neutral",
          note: tf(
            locale,
            "시설, 구매, 공급망 activity 원장은 아직 제품에 연결되지 않았습니다. 현재 제품은 의사결정 데스크이며 ERP 대체물이 아닙니다.",
            "Facility, purchase, and supply-chain activity ledgers are not connected yet. The current product is still a decision desk, not an ERP replacement."
          )
        },
        {
          id: "disclosure-pack",
          label: tf(locale, "공시 패키지 지원", "Disclosure-pack support"),
          status: tf(locale, "부분 구현", "Partial"),
          tone: "neutral",
          note: tf(
            locale,
            "레지스트리·retirement·무결성 근거는 읽을 수 있지만, AB 1305·CSRD 중심의 exportable disclosure pack은 다음 라운드 과제입니다.",
            "Registry, retirement, and integrity evidence are visible now, but an exportable AB 1305 or CSRD-oriented disclosure pack is still the next step."
          )
        }
      ]
    };
  }, [
    lifecycleDossiersForMarket,
    locale,
    selectedInputBlocks,
    selectedMarket.name,
    sharedFrameworkRails.length
  ]);
  const operatingModules = useMemo(
    () => [
      {
        id: "market-intel",
        kicker: tf(locale, "시장", "Market intelligence"),
        title: tf(locale, "규제시장 읽기와 비교 테이프", "Compliance-market read and comparison tape"),
        summary: tf(
          locale,
          "EU ETS, K-ETS, China ETS를 같은 프레임에서 읽고 공식 앵커와 상장 비교 테이프를 분리해 보여줍니다.",
          "Read EU ETS, K-ETS, and China ETS on one frame while keeping official anchors separate from listed comparison tapes."
        ),
        tone: "positive",
        status: tf(locale, "구현됨", "Implemented"),
        currentBuild: tf(
          locale,
          `현재 빌드는 ${selectedMarket.name} 공식 앵커, ${selectedCompareQuote?.symbol ?? "listed proxy"} 비교 테이프, 시나리오 랩, 데스크 메모까지 한 화면에서 연결합니다.`,
          `The current build already ties ${selectedMarket.name} official anchors, the ${selectedCompareQuote?.symbol ?? "listed proxy"} comparison tape, the scenario lab, and the desk memo together.`
        ),
        nextBuild: tf(
          locale,
          "다음 단계는 더 깊은 유동성 상태, 구간별 비교, 그리고 조달/리포팅 워크플로우와의 연결입니다.",
          "Next comes deeper liquidity state, better cross-market comparison, and tighter links into procurement and reporting workflows."
        ),
        boundary: tf(
          locale,
          "거래 실행이나 주문 중개가 아니라 시장 읽기와 리스크 프레이밍에 집중합니다.",
          "Keep this layer focused on market reading and risk framing, not execution."
        ),
        references: ["TradingView", "Yahoo Finance", "ClearBlue Vantage"]
      },
      {
        id: "accounting-sidecar",
        kicker: tf(locale, "회계", "Accounting sidecar"),
        title: tf(locale, "Scope 1-3와 배출계수 근거를 함께 보기", "Keep Scope 1-3 logic and factor provenance visible"),
        summary: tf(
          locale,
          "거래 판단 화면 옆에서 회계 경계, 배출계수 출처, 공시 프레임을 같이 읽게 만들어 조달과 보고가 분리되지 않게 합니다.",
          "Keep accounting boundary, factor provenance, and disclosure framing next to the trading read so procurement and reporting do not split apart."
        ),
        tone: "neutral",
        status: tf(locale, "부분 구현", "Partially implemented"),
        currentBuild: tf(
          locale,
          "현재는 인앱 입력 커버리지와 공식 소스 맵까지 들어와 있고, 다음은 실제 Scope inventory 레이어를 붙여야 합니다.",
          "The current build covers in-app input coverage and the official source map; the next step is a real Scope inventory layer."
        ),
        nextBuild: tf(
          locale,
          "배출계수 추적, Scope 1-3 readiness, 감사 이력, 리포트 패키지 요약을 제품 안에서 묶습니다.",
          "Add emission-factor tracking, Scope 1-3 readiness, audit history, and disclosure-package summaries inside the product."
        ),
        boundary: tf(
          locale,
          "ERP를 대체하려는 게 아니라 시장 의사결정에 필요한 회계 맥락을 붙이는 레이어로 유지합니다.",
          "Use this as an accounting context layer for decisions, not as a full ERP replacement."
        ),
        references: ["Persefoni", "Watershed", "GHG Protocol"]
      },
      {
        id: "verification-layer",
        kicker: tf(locale, "검증", "Verification and integrity"),
        title: tf(locale, "레지스트리, 문서 신선도, 평정 근거를 한쪽에", "Hold registry state, freshness, and rating context in one sidecar"),
        summary: tf(
          locale,
          "프로젝트 문서, 레지스트리 상태, retirement trace, 품질 평정 맥락이 빠지면 조달 판단이 과신으로 바뀌기 쉽습니다.",
          "Without project documents, registry state, retirement trace, and rating context, procurement judgment drifts into overconfidence."
        ),
        tone: "positive",
        status: tf(locale, "구현 중", "Active build"),
        currentBuild: tf(
          locale,
          "현재 빌드는 레지스트리 워크플로우, 문서 신선도, nature-risk overlay를 읽기용으로 붙일 준비가 되어 있습니다.",
          "The current build is ready to surface registry workflow, document freshness, and nature-risk overlays as a read-only integrity layer."
        ),
        nextBuild: tf(
          locale,
          "다음은 평정 요약, method-change watch, retirement concentration, disclosure memo 자동화를 추가하는 것입니다.",
          "Next add rating summaries, method-change watch, retirement concentration, and disclosure memo automation."
        ),
        boundary: tf(
          locale,
          "인증기관 역할이나 신용평가를 흉내 내지 말고, 공개 근거를 정리하는 검증 레이어로 제한합니다.",
          "Keep this as an evidence and verification layer, not a rating agency or certifier."
        ),
        references: ["Sylvera", "BeZero Carbon", "Verra", "Gold Standard"]
      },
      {
        id: "procurement-intel",
        kicker: tf(locale, "조달", "Procurement and retirement intelligence"),
        title: tf(locale, "검색, 비교, retirement planning까지는 돕되 실행은 하지 않기", "Support screening and retirement planning without executing"),
        summary: tf(
          locale,
          "사용자는 프로젝트를 찾고, 포트폴리오를 비교하고, retirement proof와 공시 문서를 정리할 수 있어야 하지만 실제 구매는 외부에서 끝나야 합니다.",
          "Users should be able to screen projects, compare portfolios, and prepare retirement-proof and disclosure packs, but actual purchase should finish elsewhere."
        ),
        tone: "neutral",
        status: tf(locale, "큐 대기", "Queued"),
        currentBuild: tf(
          locale,
          "현재는 상장 비교 테이프와 검증 데이터까지 묶을 준비만 되어 있고, 실제 procurement memo 계층은 다음 라운드 대상입니다.",
          "Today the product is ready to combine listed comparison tapes with verification data, but the procurement-memo layer is the next build target."
        ),
        nextBuild: tf(
          locale,
          "프로젝트 스크리닝, 포트폴리오 소싱 메모, retirement pack, AB 1305·CSRD disclosure support를 넣습니다.",
          "Add project screening, portfolio sourcing memos, retirement packs, and AB 1305 or CSRD disclosure support."
        ),
        boundary: tf(
          locale,
          "구매나 체결이 아니라 screening, memo, disclosure support까지만 제품 경계로 둡니다.",
          "Stop at screening, memos, and disclosure support rather than purchase execution."
        ),
        references: ["Patch", "Gold Standard", "Hyperledger"]
      }
    ],
    [locale, selectedCompareQuote?.symbol, selectedMarket.name]
  );
  const copilotClaudeBenchmarks = useMemo(
    () => [
      {
        id: "projects",
        kicker: t(locale, "프로젝트", "Projects"),
        title: t(locale, "우측 컨텍스트를 프로젝트처럼 고정", "Keep context scoped like a project"),
        detail: t(
          locale,
          "선택한 시장 읽기와 비교 테이프를 오른쪽에 고정해 같은 작업 배경을 유지합니다.",
          "Pin the market read and comparison tape on the right so the thread keeps the same operating backdrop."
        ),
        url: "https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects"
      },
      {
        id: "styles",
        kicker: t(locale, "스타일", "Styles"),
        title: t(locale, "컴포저 옆에서 응답 방식을 바로 전환", "Switch response style beside the composer"),
        detail: t(
          locale,
          "대화창을 벗어나지 않고 응답 밀도와 우선순위를 바꿀 수 있게 둡니다.",
          "Keep response density and priorities adjustable without leaving the active thread."
        ),
        url: "https://support.claude.com/en/articles/10181068-configure-and-use-styles"
      },
      {
        id: "artifacts",
        kicker: t(locale, "아티팩트", "Artifacts"),
        title: t(locale, "근거는 대화와 분리된 사이드카로 노출", "Expose evidence as a sidecar, not another bubble"),
        detail: t(
          locale,
          "근거 카드는 별도 영역에서 미리 읽고 필요할 때만 열도록 정리합니다.",
          "Keep grounding cards in a dedicated sidecar so operators can scan and open them only when needed."
        ),
        url: "https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them"
      }
    ],
    [locale]
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
  const selectedTheme = MARKET_THEMES[marketId];
  const benchmarkOptions = useMemo(
    () => marketQuotes.filter((quote) => quote.status !== "error"),
    [marketQuotes]
  );
  const comparisonSeries = useMemo<MultiLineSeries[]>(
    () => [
      { id: "official", label: t(locale, "Official", "Official"), color: MARKET_THEMES[marketId].accent },
      {
        id: "benchmark",
        label: selectedCompareQuote?.symbol ?? t(locale, "鍮꾧탳 湲곗?", "Benchmark"),
        color: "#111827"
      }
    ],
    [locale, marketId, selectedCompareQuote]
  );
  const officialInteractiveSeries = useMemo(
    () => [
      {
        id: `${marketId}-official-series`,
        label: selectedOfficialCard?.seriesLabel ?? t(locale, "Official time series", "Official time series"),
        color: selectedTheme.accent,
        variant: "area" as const,
        points: officialSeries,
        valueFormatter: (value: number) =>
          formatNumber(locale, value, marketId === "k-ets" ? 0 : 2)
      }
    ],
    [locale, marketId, officialSeries, selectedOfficialCard?.seriesLabel, selectedTheme.accent]
  );
  const liveTapeInteractiveSeries = useMemo(
    () => [
      {
        id: selectedCompareQuote?.id ?? `${marketId}-live-tape`,
        label: selectedCompareQuote?.symbol ?? t(locale, "Live tape", "Live tape"),
        color: "#22c55e",
        variant: liveTapeSupportsCandles ? ("candles" as const) : ("area" as const),
        points: comparePoints,
        valueFormatter: (value: number) =>
          selectedCompareQuote?.currency
            ? `${selectedCompareQuote.currency} ${formatNumber(
                locale,
                value,
                getPriceDecimals(selectedCompareQuote.currency)
              )}`
            : formatNumber(locale, value, 2)
      },
      ...(compareVolumeSeries.length > 0
        ? [
            {
              id: `${selectedCompareQuote?.id ?? `${marketId}-live-tape`}-volume`,
              label: t(locale, "Volume", "Volume"),
              color: "#3b82f6",
              variant: "histogram" as const,
              points: compareVolumeSeries,
              valueFormatter: (value: number) => formatNumber(locale, value, 0)
            }
          ]
        : [])
    ],
    [comparePoints, compareVolumeSeries, liveTapeSupportsCandles, locale, marketId, selectedCompareQuote]
  );
  const relativeInteractiveSeries = useMemo(
    () =>
      comparisonSeries.map((item) => ({
        id: item.id,
        label: item.label,
        color: item.color,
        variant: "line" as const,
        lineStyle: item.id === "benchmark" ? ("dashed" as const) : ("solid" as const),
        points: compareOutput.points
          .map((point) => ({
            label: point.label,
            value: point.values[item.id]
          }))
          .filter(
            (point): point is ChartPoint =>
              typeof point.value === "number" && Number.isFinite(point.value)
          ),
        valueFormatter: (value: number) => formatNumber(locale, value, 1)
      })),
    [compareOutput.points, comparisonSeries, locale]
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
        label: item.variable.length > 22 ? `${item.variable.slice(0, 22)}...` : item.variable,
        value: item.contribution
      })),
    [scenarioForecast.contributions]
  );
  const sourceRefreshLabel = connectedSources.fetchedAt
    ? `${t(locale, "?뚯뒪 媛깆떊", "Sources")} ${formatDate(locale, connectedSources.fetchedAt)}`
    : t(locale, "Sources not loaded", "Sources not loaded");
  const localCopilotBadge = localLlmState.available
    ? `${t(locale, "濡쒖뺄 紐⑤뜽", "Local model")} ${localLlmState.selectedModel || "n/a"}`
    : t(locale, "Local model unavailable", "Local model unavailable");

  useEffect(() => {
    try {
      window.localStorage.setItem("cquant:locale", getUiLocale(locale));
      window.localStorage.setItem("cquant:surface", surface);
      window.localStorage.setItem("cquant:market", marketId);
      window.localStorage.setItem(`cquant:quote:${marketId}`, selectedCompareQuoteId || "");
      window.localStorage.setItem("cquant:copilot-response-style", copilotResponseStyle);
    } catch {}
  }, [copilotResponseStyle, locale, surface, marketId, selectedCompareQuoteId]);

  useEffect(() => {
    try {
      window.localStorage.setItem("cquant:local-chat", JSON.stringify(chatSessionsByMarket));
    } catch {}
  }, [chatSessionsByMarket]);

  useEffect(() => {
    if (workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTop = 0;
    }
    if (inspectorScrollRef.current) {
      inspectorScrollRef.current.scrollTop = 0;
    }
  }, [surface, marketId]);

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

  async function handleLaunchLocalLlm() {
    const bridge = window.desktopBridge;
    if (!bridge?.launchLocalLlm || !bridge.getLocalLlmState) {
      return;
    }

    setLocalLlmLaunching(true);
    setLocalLlmError(null);

    try {
      await bridge.launchLocalLlm();

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const nextState = await bridge.getLocalLlmState();
        setLocalLlmState(nextState);
        if (nextState.reachable) {
          break;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    } catch (error) {
      setLocalLlmError(error instanceof Error ? error.message : String(error));
    } finally {
      setLocalLlmLaunching(false);
    }
  }

  useEffect(() => {
    const element = chatThreadRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [currentChatMessages, localChatLoading, marketId]);

  useEffect(() => {
    setLocalChatError(null);
  }, [marketId]);

  async function handleSendLocalChat(seedText?: string) {
    const bridge = window.desktopBridge;
    const content = (seedText ?? chatInput).trim();

    if (!bridge?.runLocalChat || !content) {
      return;
    }

    const userMessage = createChatMessage("user", content);
    const historyForSend = [...currentChatMessages, userMessage].map((message) => ({
      role: message.role,
      content: message.content
    }));

    setChatSessionsByMarket((current) => ({
      ...current,
      [marketId]: [...(current[marketId] ?? []), userMessage].slice(-24)
    }));
    setChatInput("");
    setLocalChatLoading(true);
    setLocalChatError(null);

    try {
      const response = await bridge.runLocalChat({
        locale,
        baseUrl: localLlmState.baseUrl,
        model: localLlmState.selectedModel,
        context: copilotPayload,
        messages: historyForSend
      });
      const assistantMessage = createChatMessage(
        "assistant",
        response.content,
        response.model
      );
      assistantMessage.createdAt = response.generatedAt;
      assistantMessage.grounding = response.grounding;
      assistantMessage.boundaryNote = response.boundaryNote;

      setChatSessionsByMarket((current) => ({
        ...current,
        [marketId]: [...(current[marketId] ?? []), assistantMessage].slice(-24)
      }));

      if (response.model && response.model !== localLlmState.selectedModel) {
        setLocalLlmState((current) => ({
          ...current,
          selectedModel: response.model || current.selectedModel,
          available: true
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLocalChatError(message);
      setChatSessionsByMarket((current) => ({
        ...current,
        [marketId]: [
          ...(current[marketId] ?? []),
          {
            ...createChatMessage(
              "assistant",
              t(
                locale,
                `濡쒖뺄 紐⑤뜽 ?묐떟 ?ㅽ뙣: ${message}`,
                `Local model request failed: ${message}`
              )
            ),
            status: "error",
            boundaryNote: t(
              locale,
              "?ㅽ뙣???붿껌?낅땲?? 怨듭떇 ?듭빱? 鍮꾧탳 ?뚯씠?꾨? 癒쇱? ?ㅼ떆 ?뺤씤?섏꽭??",
              "This request failed. Recheck the official anchor and comparison tape first."
            )
          }
        ].slice(-24)
      }));
    } finally {
      setLocalChatLoading(false);
    }
  }

  function handleSendQuickPrompt(task: CopilotTask) {
    void handleSendLocalChat(getCopilotTaskPrompt(locale, task));
  }

  function handleClearLocalChat() {
    setChatSessionsByMarket((current) => ({
      ...current,
      [marketId]: []
    }));
    setLocalChatError(null);
  }

  function focusCopilotComposer() {
    window.setTimeout(() => {
      const element = chatInputRef.current;
      if (!element) {
        return;
      }

      element.focus();
      const nextPosition = element.value.length;
      element.setSelectionRange(nextPosition, nextPosition);
    }, 120);
  }

  function openCopilotWorkspace(seedText?: string) {
    if (typeof seedText === "string") {
      setChatInput(seedText);
    }

    startTransition(() => setSurface("copilot"));
    focusCopilotComposer();
  }

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (!bridge) {
      return;
    }

    let disposed = false;

    async function refreshQuietly() {
      try {
        const payload = await bridge.refreshConnectedSources();
        if (!disposed) {
          startTransition(() => {
            setConnectedSources(payload);
          });
          setSourcesError(null);
        }
      } catch {}
    }

    const timer = window.setInterval(() => {
      void refreshQuietly();
    }, 5 * 60 * 1000);

    const onFocus = () => {
      void refreshQuietly();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  function handleScenarioChange(driverId: string, nextValue: number) {
    setScenarioState((current) => ({
      ...current,
      [driverId]: nextValue
    }));
  }

  function renderCommand() {
    return (
      <>
        <section
          className="command-hero"
          style={
            {
              "--command-accent": selectedTheme.accent,
              "--command-surface": selectedTheme.surface
            } as React.CSSProperties
          }
        >
          <div className="command-hero-main">
            <div className="command-hero-top">
              <div>
                <span className="section-kicker">{t(locale, "Mission control", "Mission control")}</span>
                <h2>{selectedMarket.name}</h2>
              </div>
              <span className={`freshness-badge ${selectedOfficialFreshnessLevel}`}>
                {getFreshnessLevelLabel(locale, selectedOfficialFreshnessLevel)}
              </span>
            </div>

            <p className="command-hero-copy">{l(selectedDecision.summary)}</p>

            <div className="command-hero-metrics">
              <div className="command-stat">
                <span>{t(locale, "怨듭떇 ?듭빱", "Official anchor")}</span>
                <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
                <small>{getOfficialMethod(selectedOfficialCard, locale)}</small>
              </div>
              <div className="command-stat">
                <span>{t(locale, "?ㅼ? 湲곗?", "Hedge tape")}</span>
                <strong>{selectedCompareQuote?.symbol ?? "n/a"}</strong>
                <small>
                  {selectedCompareQuote?.price !== null && selectedCompareQuote?.price !== undefined
                    ? `${selectedCompareQuote.currency} ${formatNumber(locale, selectedCompareQuote.price, 2)}`
                    : "n/a"}
                </small>
              </div>
              <div className="command-stat">
                <span>{t(locale, "?먮떒 媛뺣룄", "Posture")}</span>
                <strong>{getStanceLabel(locale, selectedDecision.stance)}</strong>
                <small>{Math.round(selectedDecision.confidence * 100)}%</small>
              </div>
              <div className="command-stat">
                <span>{t(locale, "Freshness", "Freshness")}</span>
                <strong>{getFreshnessSummary(locale, selectedOfficialCard?.asOf)}</strong>
                <small>{sourceRefreshLabel}</small>
              </div>
            </div>
          </div>

          <div className="command-hero-side">
            <div className="command-brief-card emphasis">
              <span className="section-kicker">{t(locale, "?쒗뭹 寃쎄퀎", "Boundary")}</span>
              <strong>{t(locale, "由ъ꽌移샕룸え?덊꽣留??꾩슜", "Research and monitoring only")}</strong>
              <p>
                {t(
                  locale,
                  "二쇰Ц ?묒닔, 嫄곕옒 以묎컻, ?먯궛 蹂닿?? ?섏? ?딆뒿?덈떎. 怨듭떇 ?뚯뒪? 鍮꾧탳 湲곗???媛숈? ?붾㈃?먯꽌 ?쎈뒗 ?꾩냼 ?명뀛由ъ쟾???곕??먯엯?덈떎.",
                  "This terminal does not execute orders, intermediate trades, or custody assets. It keeps official anchors and comparison tapes on one operating surface."
                )}
              </p>
            </div>

            <div className="command-health-grid">
              <div className="command-health-tile">
                <span>{t(locale, "怨듭떇 ?뚯뒪 ?곌껐", "Official sources online")}</span>
                <strong>{`${deskHealthSummary.officialConnected}/3`}</strong>
              </div>
              <div className="command-health-tile">
                <span>{t(locale, "Fresh official anchors", "Fresh official anchors")}</span>
                <strong>{`${deskHealthSummary.officialFresh}/3`}</strong>
              </div>
              <div className="command-health-tile">
                <span>{t(locale, "Live proxies online", "Live proxies online")}</span>
                <strong>{`${deskHealthSummary.liveConnected}/${connectedSources.liveQuotes.length}`}</strong>
              </div>
              <div className="command-health-tile">
                <span>{t(locale, "寃쎄퀬", "Warnings")}</span>
                <strong>{deskHealthSummary.warningCount}</strong>
              </div>
            </div>

            <div className="command-brief-card">
              <span className="section-kicker">{t(locale, "吏湲??뺤씤", "Verify now")}</span>
              <ul className="plain-list">
                {selectedDecision.checks.slice(0, 3).map((item) => (
                  <li key={item}>{l(item)}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="command-market-grid">
          {marketBoardRows.map((row) => (
            <button
              key={row.market.id}
              type="button"
              className={`command-market-card ${marketId === row.market.id ? "active" : ""}`}
              onClick={() =>
                startTransition(() => {
                  setMarketId(row.market.id);
                  setSurface("desk");
                })
              }
              style={
                {
                  "--market-accent": MARKET_THEMES[row.market.id].accent,
                  "--market-surface": MARKET_THEMES[row.market.id].surface
                } as React.CSSProperties
              }
            >
              <div className="command-market-top">
                <div>
                  <span className="section-kicker">{row.market.region}</span>
                  <h3>{row.market.name}</h3>
                </div>
                <span className={`freshness-badge ${row.freshnessLevel}`}>
                  {getFreshnessLevelLabel(locale, row.freshnessLevel)}
                </span>
              </div>

              <div className="command-market-metrics">
                <div>
                  <span>{t(locale, "Official", "Official")}</span>
                  <strong>{getOfficialPriceLabel(row.officialCard)}</strong>
                </div>
                <div>
                  <span>{t(locale, "鍮꾧탳 湲곗?", "Benchmark")}</span>
                  <strong>{row.hedgeQuote?.symbol ?? "n/a"}</strong>
                  <small>
                    {row.hedgeQuote?.price !== null && row.hedgeQuote?.price !== undefined
                      ? `${row.hedgeQuote.currency} ${formatNumber(locale, row.hedgeQuote.price, 2)}`
                      : "n/a"}
                  </small>
                </div>
              </div>

              <div className="command-market-footer">
                <strong className={`stance-pill ${row.decision.stance}`}>
                  {getStanceLabel(locale, row.decision.stance)}
                </strong>
                <span>{`${Math.round(row.decision.confidence * 100)}% ${t(locale, "confidence", "confidence")}`}</span>
                <span>{getFreshnessSummary(locale, row.officialCard?.asOf)}</span>
              </div>
            </button>
          ))}
        </section>

        <section className="command-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "?좊ː ?꾪궎?띿쿂", "Trust architecture")}</span>
                <h2>{t(locale, "?レ옄蹂대떎 癒쇱? ?쏀엳???댁쁺 ?먯튃", "Operating principles visible before any signal")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "???レ옄瑜?癒쇱? 蹂댁뿬二쇰릺, 異쒖쿂쨌媛깆떊 ?쒖젏쨌?쒗뭹 寃쎄퀎瑜???긽 媛숈씠 ?〓땲??",
                  "Large numbers come first, but source method, freshness, and boundary remain visible."
                )}
              </p>
            </div>

            <div className="principle-grid">
              {trustPrinciples.map((principle) => (
                <div key={principle.id} className="principle-card">
                  <span className="section-kicker">{l(principle.title)}</span>
                  <p>{l(principle.description)}</p>
                </div>
              ))}
            </div>

            <div className="command-split-grid">
              <div className="status-card">
                <strong>{t(locale, "?꾩옱 李ъ꽦 洹쇨굅", "Supporting evidence")}</strong>
                <ul className="plain-list">
                  {selectedDecision.support.slice(0, 3).map((item) => (
                    <li key={item.title}>{`${item.title}: ${item.detail}`}</li>
                  ))}
                </ul>
              </div>
              <div className="status-card warning">
                <strong>{t(locale, "?먮떒??源⑤뒗 議곌굔", "Breaker conditions")}</strong>
                <ul className="plain-list">
                  {(selectedDecision.risks.length > 0
                    ? selectedDecision.risks.slice(0, 3)
                    : [
                        t(
                          locale,
                          "利됱떆 蹂댁씠??援ъ“??由ъ뒪?щ뒗 ?쒗븳?곸씠吏留??ㅼ쓬 怨듭떇 ?낅뜲?댄듃??怨꾩냽 ?뺤씤?댁빞 ?⑸땲??",
                          "No immediate structural break is visible, but the next official update still matters."
                        )
                      ]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "怨듭떇 ?곗씠???ㅺ퀎", "Official data map")}</span>
                <h2>{t(locale, "?쒖옣蹂??뚯뒪 泥닿퀎瑜??쒗뭹 ?덉뿉 紐낆떆", "Source system made explicit inside the product")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "API媛 ?뺤씤??寃쎌슦留?API濡??쒓린?섍퀬, ?섎㉧吏??怨듭떇 ???먮쫫 ?먮뒗 怨듭떇 ?뚯씪濡?援щ텇?⑸땲??",
                  "Only confirmed APIs are labeled as APIs; the rest remain official web flows or official files."
                )}
              </p>
            </div>

            <div className="registry-grid">
              {sourceRegistryForMarket.slice(0, 4).map((item) => (
                <div key={item.id} className="registry-card">
                  <span className="registry-method">{l(item.method)}</span>
                  <strong>{l(item.title)}</strong>
                  <p>{l(item.whyItMatters)}</p>
                  <div className="registry-meta">
                    <span>{l(item.category)}</span>
                    <span>{l(item.appUse)}</span>
                  </div>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(item.url)}
                  >
                    {t(locale, "怨듭떇 臾몄꽌", "Open source doc")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="command-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "올인원 운영 스택", "All-in-one operating stack")}</span>
                <h2>{tf(locale, "시장, 회계, 검증, 조달 인텔리전스를 한 운영 모델로 묶기", "One operating model for market, accounting, verification, and procurement intelligence")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "거래 데스크만 잘 만드는 걸로는 부족합니다. 회계 경계, 검증 근거, retirement 계획까지 붙어야 탄소 의사결정 플랫폼이 됩니다.",
                  "A strong trading desk alone is not enough. Accounting boundary, verification evidence, and retirement planning have to sit beside it."
                )}
              </p>
            </div>

            <div className="module-grid">
              {operatingModules.map((module) => (
                <div key={module.id} className="registry-card module-card">
                  <div className="module-card-top">
                    <span className="section-kicker">{module.kicker}</span>
                    <span className={`feed-pill tone-${module.tone}`}>{module.status}</span>
                  </div>
                  <strong>{module.title}</strong>
                  <p>{module.summary}</p>
                  <div className="registry-meta">
                    {module.references.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <ul className="bullet-list compact">
                    <li>
                      <strong>{tf(locale, "현재 빌드", "Current build")}</strong>
                      <span>{module.currentBuild}</span>
                    </li>
                    <li>
                      <strong>{tf(locale, "다음 빌드", "Next build")}</strong>
                      <span>{module.nextBuild}</span>
                    </li>
                    <li>
                      <strong>{tf(locale, "경계", "Boundary")}</strong>
                      <span>{module.boundary}</span>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "상용 벤치마크", "Commercial benchmark transfer")}</span>
                <h2>{tf(locale, "무엇을 빌려오고 무엇은 제품 경계 밖에 둘지 명확히", "Borrow product logic, not the business model")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "Persefoni, Watershed, Patch, Sylvera, BeZero는 각각 다른 강점이 있습니다. C-Quant는 그 기능 논리만 가져오고 실행이나 인증 역할은 가져오지 않습니다.",
                  "Persefoni, Watershed, Patch, Sylvera, and BeZero each solve a different layer. C-Quant should borrow their logic without copying execution or certification roles."
                )}
              </p>
            </div>

            <div className="registry-grid">
              {allInOneBenchmarkCards.map((platform) => (
                <div key={platform.id} className="registry-card">
                  <span className="registry-method">{l(platform.category)}</span>
                  <strong>{platform.name}</strong>
                  <p>{l(platform.strength)}</p>
                  <ul className="bullet-list compact">
                    <li>
                      <strong>{tf(locale, "왜 참고하는가", "Why it matters")}</strong>
                      <span>{l(platform.differentiator)}</span>
                    </li>
                  </ul>
                  <div className="registry-meta">
                    {platform.featuresToBorrow.map((feature) => (
                      <span key={feature}>{l(feature)}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(platform.source.url)}
                  >
                    {tf(locale, "레퍼런스", "Reference")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="command-three-up">
          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "Subscription value", "Subscription value")}</span>
                <h2>{t(locale, "Paid value must be visible in-product", "Paid value must be visible in-product")}</h2>
              </div>
            </div>

            <ul className="bullet-list compact">
              {subscriptionFeatures.map((feature) => (
                <li key={feature.id}>
                  <strong>{l(feature.title)}</strong>
                  <span>{l(feature.description)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "?쒗뭹 湲곗?", "Delivery standard")}</span>
                <h2>{t(locale, "What this desktop must deliver", "What this desktop must deliver")}</h2>
              </div>
            </div>

            <ul className="bullet-list compact">
              {productRequirements.map((item) => (
                <li key={item}>
                  <span>{l(item)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "踰ㅼ튂留덊겕 ?덊띁?곗뒪", "Reference platforms")}</span>
                <h2>{t(locale, "移댄뵾媛 ?꾨땲???먯튃留?李⑥슜", "Borrow principles, not literal screens")}</h2>
              </div>
            </div>

            <div className="registry-grid compact">
              {benchmarkReferenceCards.map((platform) => (
                <div key={platform.id} className="registry-card compact">
                  <span className="registry-method">{l(platform.category)}</span>
                  <strong>{platform.name}</strong>
                  <p>{l(platform.differentiator)}</p>
                  <div className="registry-meta">
                    {platform.featuresToBorrow.slice(0, 2).map((feature) => (
                      <span key={feature}>{l(feature)}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(platform.source.url)}
                  >
                    {t(locale, "?덊띁?곗뒪", "Reference")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
                <span className="section-kicker">{tf(locale, "오픈소스 아키텍처", "Open-source architecture transfer")}</span>
                <h2>{tf(locale, "코드와 데이터 구조는 여기서 빌려오고 제품 경계는 더 엄격하게 유지", "Borrow data and workflow architecture while keeping a stricter product boundary")}</h2>
            </div>
            <p>
              {t(
                locale,
                "Hyperledger, OS-Climate, OpenGHG 같은 프로젝트는 거래소 UI보다 더 중요한 힌트를 줍니다. 출처 체인, 데이터 정규화, registry evidence, 재현 가능한 retrieval 경계입니다.",
                "Projects like Hyperledger, OS-Climate, and OpenGHG are more useful for provenance, normalization, registry evidence, and reproducible retrieval than for screen design."
              )}
            </p>
          </div>

          <div className="registry-grid">
            {architectureBenchmarkCards.map((benchmark) => (
              <div key={benchmark.id} className="registry-card">
                <span className="registry-method">{l(benchmark.category)}</span>
                <strong>{benchmark.name}</strong>
                <p>{l(benchmark.verifiedCapability)}</p>
                <ul className="bullet-list compact">
                  <li>
                    <strong>{tf(locale, "C-Quant 적용", "Apply in C-Quant")}</strong>
                    <span>{l(benchmark.adaptForCQuant)}</span>
                  </li>
                  <li>
                    <strong>{tf(locale, "경계 주의", "Boundary note")}</strong>
                    <span>{l(benchmark.boundaryNote)}</span>
                  </li>
                  <li>
                    <strong>{tf(locale, "LLM 역할", "LLM use")}</strong>
                    <span>{l(benchmark.llmUse)}</span>
                  </li>
                </ul>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => window.desktopBridge?.openExternal(benchmark.source.url)}
                >
                  {tf(locale, "원문", "Source")}
                </button>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderDesk() {
    return (
      <>
        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "?쒖옣 蹂대뱶", "Market board")}</span>
              <h2>{t(locale, "???쒖옣??媛숈? 湲곗??쇰줈 蹂닿린", "Read all three markets on one frame")}</h2>
            </div>
            <p>
              {t(
                locale,
                "怨듭떇媛? ?ㅼ떆媛?鍮꾧탳 ?뚯씠?? 愿대━, ?ъ??섏쓣 ??以꾩뵫 鍮꾧탳?⑸땲??",
                "Compare official anchor, live tape, gap, and posture row by row."
              )}
            </p>
          </div>

          <div className="board-table">
            <div className="board-head">
              <span>{t(locale, "?쒖옣", "Market")}</span>
              <span>{t(locale, "Official", "Official")}</span>
              <span>{t(locale, "Live tape", "Live tape")}</span>
              <span>{t(locale, "愿대━", "Gap")}</span>
              <span>{t(locale, "?곴?", "Correlation")}</span>
              <span>{t(locale, "Stance", "Stance")}</span>
            </div>

            {marketBoardRows.map((row) => (
              <button
                key={row.market.id}
                type="button"
                className={`board-row ${marketId === row.market.id ? "active" : ""} ${
                  row.freshnessLevel === "stale"
                    ? "stale-source"
                    : row.freshnessLevel === "watch"
                      ? "watch-source"
                      : ""
                }`}
                onClick={() => setMarketId(row.market.id)}
                title={joinReadoutParts(
                  row.market.name,
                  getOfficialPriceLabel(row.officialCard),
                  getStanceLabel(locale, row.decision.stance)
                )}
              >
                <div className="board-cell market">
                  <strong>{row.market.name}</strong>
                  <span>{getOfficialSourceName(locale, row.officialCard)}</span>
                </div>
                <div className="board-cell">
                  <strong>{getOfficialPriceLabel(row.officialCard)}</strong>
                  <span>{getOfficialChangeLabel(row.officialCard)}</span>
                  <div className="board-meta-row">
                    <span className={`freshness-badge ${row.freshnessLevel}`}>
                      {getFreshnessLevelLabel(locale, row.freshnessLevel)}
                    </span>
                    <span className="board-inline-meta">
                      {getFreshnessSummary(locale, row.officialCard?.asOf)}
                    </span>
                  </div>
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
                  <span>{t(locale, "vs official", "vs official")}</span>
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
                <span className="section-kicker">{t(locale, "怨듭떇 ?듭빱", "Official anchor")}</span>
                <h2>{getOfficialSourceName(locale, selectedOfficialCard)}</h2>
              </div>
              <p>{joinReadoutParts(getOfficialMethod(selectedOfficialCard, locale), formatDate(locale, selectedOfficialCard?.asOf ?? ""))}</p>
            </div>

            <div className="metric-strip">
              <div className="metric-tile">
                <span>{t(locale, "Official price", "Official price")}</span>
                <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Move", "Move")}</span>
                <strong>{getOfficialChangeLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Volume", "Volume")}</span>
                <strong>{getOfficialVolumeLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Freshness", "Freshness")}</span>
                <strong>{formatRelativeDays(locale, selectedOfficialCard?.asOf ?? "")}</strong>
              </div>
            </div>

            <InteractiveMarketChart
              series={officialInteractiveSeries}
              title={t(locale, "Official time series", "Official time series")}
              subtitle={getOfficialHeadlineLabel(locale, selectedOfficialCard)}
              locale={getIntlLocale(locale)}
              height={320}
              guideLabel={getChartGuideLabel(locale)}
              emptyTitle={t(locale, "怨듭떇 ?쒓퀎???놁쓬", "No official time series")}
              emptySubtitle={t(
                locale,
                "?꾩옱 ?곌껐??怨듭떇 ?쒓퀎?댁씠 ?놁뼱 ?명꽣?숉떚釉?李⑦듃瑜??쒖떆?????놁뒿?덈떎.",
                "The current official source has no continuous series for the interactive chart."
              )}
            />

            <div className="subsection">
              <div className="subsection-head">
                <strong>{t(locale, "Official volume", "Official volume")}</strong>
              </div>
              {officialVolumeSeries.length > 0 ? (
                <ColumnChart points={officialVolumeSeries} color={selectedTheme.accent} />
              ) : (
                <div className="status-card">
                  <strong>{t(locale, "怨듭떇 嫄곕옒???쒓퀎 ?놁쓬", "No official volume series")}</strong>
                  <p>
                    {t(
                      locale,
                      "?꾩옱 ?곌껐??怨듭떇 ?뚯뒪?먮뒗 ?곗냽 嫄곕옒???쒓퀎媛 ?놁뒿?덈떎. 媛寃?湲곗?媛믨낵 ?뚯뒪 硫붾え瑜??곗꽑 ?뺤씤?섏꽭??",
                      "The current official source does not expose a continuous volume series. Use the price anchor and source notes first."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "Live comparison tape", "Live comparison tape")}</span>
                <h2>{selectedCompareQuote?.title ?? t(locale, "鍮꾧탳 ?뚯씠???놁쓬", "No live tape selected")}</h2>
              </div>
              <p>
                {quoteLoading
                  ? t(locale, "Refreshing in-app series", "Refreshing in-app series")
                  : getQuoteDelayNoteLabel(locale, selectedCompareQuote)}
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
                <span>{t(locale, "Live tape price", "Live tape price")}</span>
                <strong>
                  {selectedCompareQuote?.price !== null && selectedCompareQuote?.price !== undefined
                    ? `${selectedCompareQuote.currency} ${formatNumber(locale, selectedCompareQuote.price, 2)}`
                    : "n/a"}
                </strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "蹂?붿쑉", "Change")}</span>
                <strong>{formatPercent(locale, selectedCompareQuote?.changePct ?? null, 2)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "愿대━", "Gap")}</span>
                <strong>{formatPercent(locale, compareOutput.stats.gapPct, 2)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "諛⑺뼢 ?쇱튂", "Direction match")}</span>
                <strong>{formatPercent(locale, compareOutput.stats.directionMatchPct, 0)}</strong>
              </div>
            </div>

            <div className="feed-inline">
              <span className={`feed-pill tone-${getSourceTone(selectedCompareQuote?.status ?? "error")}`}>
                {getSourceStatusLabel(locale, selectedCompareQuote?.status ?? "error")}
              </span>
              <span>{getQuoteProviderLabel(locale, selectedCompareQuote?.provider)}</span>
              <span>{selectedCompareQuote?.exchange || t(locale, "嫄곕옒???뺣낫 ?놁쓬", "No exchange")}</span>
              <span>{formatDate(locale, selectedCompareQuote?.asOf ?? "")}</span>
            </div>

            {latestLiveBarSnapshot ? (
              <div className="chart-market-stats">
                <div className="chart-market-stat">
                  <span>{t(locale, "Open", "Open")}</span>
                  <strong>
                    {latestLiveBarSnapshot.open !== null && selectedCompareQuote?.currency
                      ? `${selectedCompareQuote.currency} ${formatNumber(
                          locale,
                          latestLiveBarSnapshot.open,
                          getPriceDecimals(selectedCompareQuote.currency)
                        )}`
                      : "n/a"}
                  </strong>
                </div>
                <div className="chart-market-stat">
                  <span>{t(locale, "High", "High")}</span>
                  <strong>
                    {latestLiveBarSnapshot.high !== null && selectedCompareQuote?.currency
                      ? `${selectedCompareQuote.currency} ${formatNumber(
                          locale,
                          latestLiveBarSnapshot.high,
                          getPriceDecimals(selectedCompareQuote.currency)
                        )}`
                      : "n/a"}
                  </strong>
                </div>
                <div className="chart-market-stat">
                  <span>{t(locale, "Low", "Low")}</span>
                  <strong>
                    {latestLiveBarSnapshot.low !== null && selectedCompareQuote?.currency
                      ? `${selectedCompareQuote.currency} ${formatNumber(
                          locale,
                          latestLiveBarSnapshot.low,
                          getPriceDecimals(selectedCompareQuote.currency)
                        )}`
                      : "n/a"}
                  </strong>
                </div>
                <div className="chart-market-stat">
                  <span>{t(locale, "Volume", "Volume")}</span>
                  <strong>
                    {latestLiveBarSnapshot.volume !== null
                      ? formatNumber(locale, latestLiveBarSnapshot.volume, 0)
                      : "n/a"}
                  </strong>
                </div>
              </div>
            ) : null}

            <InteractiveMarketChart
              series={liveTapeInteractiveSeries}
              title={selectedCompareQuote?.symbol ?? t(locale, "Live tape", "Live tape")}
              subtitle={getQuoteRoleLabel(locale, selectedCompareQuote)}
              locale={getIntlLocale(locale)}
              height={340}
              tone="dark"
              guideLabel={getChartGuideLabel(locale)}
              emptyTitle={t(locale, "?ㅼ떆媛?鍮꾧탳 李⑦듃 ?놁쓬", "No live comparison chart")}
              emptySubtitle={t(
                locale,
                "臾대즺 鍮꾧탳 ?뚯씠???쒓퀎?댁쓣 ?꾩쭅 遺덈윭?ㅼ? 紐삵뻽?듬땲??",
                "The free comparison tape series is not available yet."
              )}
            />

            <div className="note-list">
              <div className="note-item">
                <strong>{t(locale, "What to check now", "What to check now")}</strong>
                <p>{l(selectedDecision.checks[0])}</p>
              </div>
              <div className="note-item">
                <strong>{t(locale, "鍮꾧탳 湲곗? ??븷", "Why this benchmark")}</strong>
                <p>{getQuoteRoleLabel(locale, selectedCompareQuote)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "鍮꾧탳 李⑦듃", "Relative chart")}</span>
              <h2>{t(locale, "怨듭떇媛믨낵 ?곸옣 湲곗???媛숈? 異쒕컻?먯쑝濡?鍮꾧탳", "Compare official anchor and listed benchmark on one scale")}</h2>
            </div>
            <p>
              {t(locale, "媛숈? 援ш컙?먯꽌 100 湲곗??쇰줈 留욎떠 ?吏곸엫???쎌뒿?덈떎.", "Both lines are normalized to 100 over the overlapping window.")}
            </p>
          </div>

          <InteractiveMarketChart
            series={relativeInteractiveSeries}
            locale={getIntlLocale(locale)}
            height={360}
            guideLabel={t(locale, "媛숈? 湲곗??좎뿉???뺣?/異뺤냼 鍮꾧탳", "Zoom and compare on the same base")}
            emptyTitle={t(locale, "寃뱀튂??鍮꾧탳 援ш컙 ?놁쓬", "No overlapping comparison range")}
            emptySubtitle={t(
              locale,
              "怨듭떇 ?듭빱? ?곸옣 鍮꾧탳 ?뚯씠?꾩쓽 寃뱀튂??援ш컙??遺議깊빐 ?곷? 李⑦듃瑜?留뚮뱾 ???놁뒿?덈떎.",
              "The official anchor and listed comparison tape do not share enough overlap for a relative chart."
            )}
          />
        </section>

        <section className="desk-three-up">
          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "?먮떒 媛뺣룄", "Posture")}</span>
                <h2>{getStanceLabel(locale, selectedDecision.stance)}</h2>
              </div>
            </div>
            <PressureBar
              value={selectedDecision.score}
              negativeLabel={t(locale, "異뺤냼", "Reduce")}
              neutralLabel={t(locale, "Hold", "Hold")}
              positiveLabel={t(locale, "留ㅼ닔 ?곗쐞", "Buy")}
            />
            <DonutMeter
              value={selectedDecision.confidence}
              label={t(locale, "Confidence", "Confidence")}
              subLabel={l(selectedDecision.summary)}
              color={selectedTheme.accent}
            />
          </div>

          <div className="panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "?먯닔 遺꾪빐", "Score build")}</span>
                <h2>{t(locale, "?대뵒???먯닔媛 ?앷꼈?붿?", "Where the score comes from")}</h2>
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
                <span className="section-kicker">{t(locale, "?먮떒 硫붾え", "Decision memo")}</span>
                <h2>{t(locale, "What is moving the read", "What is moving the read")}</h2>
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
              <span className="section-kicker">{t(locale, "媛寃??붿씤", "Driver map")}</span>
              <h2>{t(locale, "?쒖옣蹂?媛寃?寃곗젙 援ъ“", "Cross-market driver structure")}</h2>
            </div>
            <p>
              {t(
                locale,
                "?곌뎄?먯꽌 ?뺤씤???붿씤??媛議깅퀎濡?臾띠뼱 ???쒖옣??媛숈씠 ?쎌뒿?덈떎.",
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
                <span className="section-kicker">{t(locale, "?좏깮 ?쒖옣", "Selected market")}</span>
                <h2>{selectedMarket.name}</h2>
              </div>
              <p>{getMarketScopeNote(locale, selectedMarket.id)}</p>
            </div>

            <div className="driver-table">
              <div className="driver-head">
                <span>{t(locale, "Family", "Family")}</span>
                <span>{t(locale, "Variable", "Variable")}</span>
                <span>{t(locale, "Weight", "Weight")}</span>
                <span>{t(locale, "?쎈뒗 諛⑹떇", "How to read")}</span>
              </div>
              {driverRows.map((driver) => (
                <div key={driver.id} className="driver-row">
                  <span>{driver.familyLabel}</span>
                  <strong>{driver.variable}</strong>
                  <span>{driver.importance}</span>
                  <p>{localizeText(getUiLocale(locale), driver.note)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "Quant tools", "Quant tools")}</span>
                <h2>{t(locale, "Indicators worth running", "Indicators worth running")}</h2>
              </div>
            </div>

            <ul className="indicator-list">
              {quantIndicators.slice(0, 4).map((indicator) => (
                <li key={indicator.id}>
                  <strong>{indicator.name}</strong>
                  <span>{l(indicator.bestFor)}</span>
                  <p>{l(indicator.whyItMatters)}</p>
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
              <span className="section-kicker">{tf(locale, "공식 소스", "Official source")}</span>
              <h2>{getOfficialSourceName(locale, selectedOfficialCard)}</h2>
            </div>
            <p>{tf(locale, "앱 안에서 먼저 읽고, 외부 페이지는 명시적으로 열 때만 나갑니다.", "The app uses sources in-app first. External pages only open when you explicitly ask for them.")}</p>
          </div>

          <div className="source-grid">
            <div className="source-block">
              <span>{tf(locale, "접근 방식", "Access method")}</span>
              <strong>{getOfficialMethod(selectedOfficialCard, locale)}</strong>
            </div>
            <div className="source-block">
              <span>{tf(locale, "기준 시각", "As of")}</span>
              <strong>{formatDate(locale, selectedOfficialCard?.asOf ?? "")}</strong>
            </div>
            <div className="source-block">
              <span>{tf(locale, "헤드라인", "Headline")}</span>
              <strong>{getOfficialHeadlineLabel(locale, selectedOfficialCard)}</strong>
            </div>
            <div className="source-block">
              <span>{tf(locale, "상태", "Status")}</span>
              <strong className={`tone-${getSourceTone(selectedOfficialCard?.status ?? "error")}`}>
                {getSourceStatusLabel(locale, selectedOfficialCard?.status ?? "error")}
              </strong>
            </div>
          </div>

          <ul className="bullet-list">
            {getOfficialNotes(locale, selectedOfficialCard).map((note) => (
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
              {tf(locale, "원문 열기", "Open original")}
            </button>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{tf(locale, "상장 비교 테이프", "Listed benchmarks")}</span>
              <h2>{tf(locale, "데스크 안에서 쓰는 비교 벤치마크", "Benchmarks used inside the desk")}</h2>
            </div>
          </div>

          <div className="source-list">
            {benchmarkOptions.map((quote) => (
              <div key={quote.id} className="source-row">
                <div>
                  <strong>{quote.title}</strong>
                  <span>{getQuoteRoleLabel(locale, quote)}</span>
                </div>
                <div>
                  <strong>{quote.symbol}</strong>
                  <span>{getQuoteProviderLabel(locale, quote.provider)}</span>
                </div>
                <div>
                  <strong>{getQuoteNoteLabel(locale, quote)}</strong>
                  <span>{getQuoteDelayNoteLabel(locale, quote)}</span>
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => window.desktopBridge?.openExternal(quote.sourceUrl)}
                >
                  {tf(locale, "소스", "Source")}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="command-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "회계 sidecar", "Accounting sidecar")}</span>
                <h2>{tf(locale, "현재 제품이 회계·공시 쪽에서 어디까지 준비됐는지", "What the product can support today on accounting and disclosure")}</h2>
              </div>
              <p>
                {tf(
                  locale,
                  "Persefoni와 Watershed를 벤치마크하되, 현재 제품 경계 안에서 실제로 가능한 것과 아직 다음 빌드인 것을 분리해 보여줍니다.",
                  "This borrows the Persefoni and Watershed mindset while separating what is already real in-product from what still belongs to the next build."
                )}
              </p>
            </div>

            <div className="source-grid">
              {accountingSidecar.metrics.map((item) => (
                <div key={item.id} className="source-block">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small className="meta-line">{item.detail}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "준비 상태", "Readiness state")}</span>
                <h2>{tf(locale, "경계, provenance, activity ledger, disclosure pack", "Boundary, provenance, activity ledger, and disclosure pack")}</h2>
              </div>
            </div>

            <ul className="bullet-list compact">
              {accountingSidecar.readiness.map((item) => (
                <li key={item.id}>
                  <strong>{joinReadoutParts(item.label, item.status)}</strong>
                  <span>{item.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="command-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "회계·검증 기준", "Accounting and verification rails")}</span>
                <h2>{tf(locale, "GHG 경계와 레지스트리 기준을 같은 소스 면에 고정", "Keep accounting standards and registry rails on the same source surface")}</h2>
              </div>
              <p>
                {tf(
                  locale,
                  "거래 판단만 있으면 올인원 플랫폼이 되지 않습니다. 회계 기준과 레지스트리 검증 레일이 같이 보여야 조달·공시 판단이 과신으로 흐르지 않습니다.",
                  "An all-in-one platform needs accounting standards and registry rails beside the market read so procurement and disclosure decisions do not drift into overconfidence."
                )}
              </p>
            </div>

            <div className="registry-grid">
              {sharedFrameworkRails.slice(0, 3).map((item) => (
                <div key={item.id} className="registry-card">
                  <span className="registry-method">{l(item.method)}</span>
                  <strong>{l(item.title)}</strong>
                  <p>{l(item.whyItMatters)}</p>
                  <div className="registry-meta">
                    <span>{l(item.category)}</span>
                    <span>{l(item.appUse)}</span>
                  </div>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(item.url)}
                  >
                    {tf(locale, "원문 열기", "Open source doc")}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "레지스트리 운영 트랙", "Registry operations watch")}</span>
                <h2>{tf(locale, "문서 신선도와 retirement trail을 운영 관점에서 보기", "Read freshness and retirement trail as an operator workflow")}</h2>
              </div>
              <p>
                {tf(
                  locale,
                  "Hyperledger와 BeZero에서 가져온 교훈은 같았습니다. 상태가 보이기보다, 증거 체인의 어느 단계가 밀렸는지가 보여야 합니다.",
                  "The transferable lesson from Hyperledger and BeZero is not execution. It is showing which evidence step is late or unresolved inside the workflow."
                )}
              </p>
            </div>

            <div className="registry-grid compact">
              {registryTracksForMarket.map((track) => (
                <div key={track.id} className="registry-card">
                  <div className="module-card-top">
                    <span className="section-kicker">{track.registry}</span>
                    <span className={`feed-pill tone-${getRegistryHealthTone(track.status)}`}>
                      {getRegistryHealthLabel(locale, track.status)}
                    </span>
                  </div>
                  <p>{l(track.operatorRead)}</p>
                  <div className="registry-meta">
                    <span>{l(track.accessMethod)}</span>
                    <span>{l(track.refreshCadence)}</span>
                    <span>{joinReadoutParts(tf(locale, "검토일", "Reviewed"), formatDate(locale, track.lastReviewed))}</span>
                  </div>
                  <ul className="bullet-list compact">
                    {track.steps.slice(0, 3).map((step) => (
                      <li key={step.id}>
                        <strong>{joinReadoutParts(l(step.label), getLifecycleStatusLabel(locale, step.status))}</strong>
                        <span>{l(step.note)}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="plain-list">
                    {track.blockers.slice(0, 2).map((item) => (
                      <li key={item}>{l(item)}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(track.source.url)}
                  >
                    {tf(locale, "기준 레지스트리", "Open registry")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="command-two-up">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "크레딧 라이프사이클", "Credit lifecycle dossiers")}</span>
                <h2>{tf(locale, "발행, 모니터링, retirement 증거를 한 카드에서 요약", "Summarize issuance, monitoring, and retirement proof on one card")}</h2>
              </div>
              <p>
                {tf(
                  locale,
                  "Patch와 Sylvera의 좋은 점은 사용자가 프로젝트를 검색하기 전에 문서 커버리지와 운영 상태를 먼저 읽게 만든다는 점입니다.",
                  "The strongest Patch and Sylvera pattern is forcing document coverage and operating state into view before a user starts screening projects."
                )}
              </p>
            </div>

            <div className="registry-grid compact">
              {lifecycleDossiersForMarket.slice(0, 3).map((dossier) => {
                const latestDocument = dossier.documents
                  .slice()
                  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))[0];

                return (
                  <div key={dossier.id} className="registry-card">
                    <div className="module-card-top">
                      <span className="registry-method">{joinReadoutParts(dossier.registry, dossier.projectType)}</span>
                      <span className="feed-pill tone-neutral">{l(dossier.region)}</span>
                    </div>
                    <strong>{l(dossier.title)}</strong>
                    <p>{l(dossier.currentRead)}</p>
                    <div className="registry-meta">
                      <span>{l(dossier.operatorUse)}</span>
                      {latestDocument ? (
                        <span>{joinReadoutParts(tf(locale, "최신 문서", "Latest doc"), formatDate(locale, latestDocument.publishedAt))}</span>
                      ) : null}
                    </div>
                    <ul className="bullet-list compact">
                      {dossier.stages.slice(0, 3).map((stage) => (
                        <li key={stage.id}>
                          <strong>{joinReadoutParts(l(stage.label), getLifecycleStatusLabel(locale, stage.status))}</strong>
                          <span>{l(stage.note)}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={() => window.desktopBridge?.openExternal(dossier.source.url)}
                    >
                      {tf(locale, "도큐먼트 기준", "Open dossier source")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{tf(locale, "무결성 리스크", "Nature and integrity overlays")}</span>
                <h2>{tf(locale, "가격보다 먼저 hazard와 disclosure 품질을 읽기", "Read hazard and disclosure quality before price")}</h2>
              </div>
              <p>
                {tf(
                  locale,
                  "BeZero와 carbonplan 계열에서 가져올 수 있는 가장 실용적인 UX는 가격보다 리스크 설명을 먼저 놓는 것입니다.",
                  "The most useful transfer from BeZero and carbonplan-style tools is putting risk explanation ahead of the headline price."
                )}
              </p>
            </div>

            <div className="registry-grid compact">
              {riskOverlaysForMarket.slice(0, 3).map((overlay) => (
                <div key={overlay.id} className="registry-card">
                  <div className="module-card-top">
                    <span className="registry-method">{l(overlay.region)}</span>
                    <span className="feed-pill tone-neutral">{l(overlay.title)}</span>
                  </div>
                  <strong>{l(overlay.posture)}</strong>
                  <p>{l(overlay.summary)}</p>
                  <ul className="bullet-list compact">
                    {overlay.components.map((component) => (
                      <li key={component.label}>
                        <strong>{joinReadoutParts(component.label, `${component.value}/100`)}</strong>
                        <span>{l(component.note)}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="plain-list">
                    {overlay.watchItems.slice(0, 2).map((item) => (
                      <li key={item}>{l(item)}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => window.desktopBridge?.openExternal(overlay.source.url)}
                  >
                    {tf(locale, "리스크 기준", "Open risk source")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{tf(locale, "통합 입력 레이어", "Integrated feature store")}</span>
              <h2>{tf(locale, `${selectedMarket.name} 인앱 입력 범위`, `${selectedMarket.name} in-app coverage`)}</h2>
            </div>
            <p>
              {tf(
                locale,
                "핵심 입력은 앱 안에서 먼저 읽습니다. 아래 목록은 내부적으로 추적하는 입력 레이어입니다.",
                "Core inputs are read in-app first. The list below shows the input layers tracked internally."
              )}
            </p>
          </div>

          <p className="meta-line">
            {tf(
              locale,
              "이 레이어들은 제품 내부에서 추적됩니다. 사용자는 업로드 없이도 현재 연결된 입력을 바로 읽을 수 있습니다.",
              "These are the input layers tracked internally by the app. Users read these inputs directly inside the product."
            )}
          </p>

          <InputCoverageGrid blocks={selectedInputBlocks} locale={locale} />
        </section>
      </>
    );
  }

  /*
  function renderLab() {
    return (
      <section className="lab-grid">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "?쒕굹由ъ삤", "Scenario")}</span>
              <h2>{t(locale, "Move the top drivers and read the scenario", "Move the top drivers and read the scenario")}</h2>
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
              <span>{t(locale, "諛⑺뼢", "Direction")}</span>
              <strong>{getForecastDirectionLabel(locale, scenarioForecast.direction)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "?먯닔", "Score")}</span>
              <strong>{formatSigned(locale, scenarioForecast.score, "")}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "Confidence", "Confidence")}</span>
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
              <span className="section-kicker">{t(locale, "Integrated decision pack", "Integrated decision pack")}</span>
              <h2>{t(locale, "Operating read with no upload required", "Operating read with no upload required")}</h2>
            </div>
            <p>
              {t(
                locale,
                "怨듭떇 湲곗?媛? 鍮꾧탳 ?뚯씠?? ?쒕씪?대쾭, ?뚯뒪 ?좎꽑?꾨? ???덉뿉??諛붾줈 ?⑹퀜 ?쎌뒿?덈떎.",
                "Read the official anchor, comparison tape, drivers, and source freshness together inside the app."
              )}
            </p>
          </div>

          <div className="metric-strip">
            <div className="metric-tile">
              <span>{t(locale, "Current stance", "Current stance")}</span>
              <strong>{getStanceLabel(locale, selectedDecision.stance)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "Confidence", "Confidence")}</span>
              <strong>{Math.round(selectedDecision.confidence * 100)}%</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "Official anchor", "Official anchor")}</span>
              <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "Freshness", "Freshness")}</span>
              <strong>{getFreshnessSummary(locale, selectedOfficialCard?.asOf)}</strong>
            </div>
          </div>

          <div className="note-list">
            <div className="note-item">
              <strong>{t(locale, "?곗뒪??由щ뱶", "Desk read")}</strong>
              <p>{l(selectedDecision.summary)}</p>
            </div>
            <div className="note-item">
              <strong>{t(locale, "Comparison tape", "Comparison tape")}</strong>
              <p>
                {selectedCompareQuote
                  ? joinReadoutParts(
                      selectedCompareQuote.symbol,
                      formatPercent(locale, selectedCompareQuote.changePct, 2),
                      getSourceStatusLabel(locale, selectedCompareQuote.status)
                    )
                  : t(locale, "?꾩옱 ?좏깮??鍮꾧탳 ?뚯씠?꾧? ?놁뒿?덈떎.", "No comparison tape is selected.")}
              </p>
            </div>
          </div>

          <ul className="bullet-list">
            {selectedDecision.support.slice(0, 3).map((item) => (
              <li key={item.title}>
                <strong>{l(item.title)}</strong>
                <span>{l(item.detail)}</span>
              </li>
            ))}
            {selectedDecision.checks.slice(0, 3).map((item) => (
              <li key={item}>
                <strong>{t(locale, "吏湲??뺤씤", "Verify now")}</strong>
                <span>{l(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "Validation", "Validation")}</span>
              <h2>{t(locale, "Backtest and walk-forward on your CSV", "Backtest and walk-forward on your CSV")}</h2>
            </div>
            <div className="head-actions">
              <button type="button" className="button ghost" onClick={handleLoadCsv}>
                {t(locale, "CSV 遺덈윭?ㅺ린", "Load CSV")}
              </button>
              <button type="button" className="button primary" onClick={handleRunBacktest}>
                {t(locale, "諛깊뀒?ㅽ듃", "Run backtest")}
              </button>
            </div>
          </div>

          <p className="meta-line">
            {t(
              locale,
              "?듭떖 ?곗뒪?щ뒗 ?낅줈???놁씠 ?숈옉?⑸땲?? ?꾨옒 CSV 寃利앹? ?щ궡 ?덉뒪?좊━???먯껜 ?쇱쿂 ?ㅽ넗?대? 遺숈씪 ?뚮쭔 ?곕뒗 ?좏깮 湲곕뒫?낅땲??",
              "The core desk works without uploads. The CSV workflow below is optional and only for proprietary history or your own feature store."
            )}
          </p>

          <div className="field-grid">
            <label>
              <span>{t(locale, "?꾨왂", "Strategy")}</span>
              <select value={strategy} onChange={(event) => setStrategy(event.target.value as BacktestStrategy)}>
                <option value="trend">Trend</option>
                <option value="meanReversion">Mean reversion</option>
                <option value="spreadRegime">Spread regime</option>
                <option value="policyMomentum">Policy momentum</option>
              </select>
            </label>
            <label>
              <span>{t(locale, "鍮꾩슜 (bps)", "Fee (bps)")}</span>
              <input type="number" min={0} value={feeBps} onChange={(event) => setFeeBps(Number(event.target.value))} />
            </label>
            <label>
              <span>{t(locale, "?숈뒿 援ш컙", "Train window")}</span>
              <input type="number" min={30} value={trainWindow} onChange={(event) => setTrainWindow(Number(event.target.value))} />
            </label>
            <label>
              <span>{t(locale, "?덉륫 ?섑룊", "Horizon")}</span>
              <input type="number" min={1} value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} />
            </label>
          </div>

          <div className="lab-actions">
            <span className="path-readout">{csvPath ?? t(locale, "?꾩쭅 遺덈윭??CSV ?놁쓬", "No CSV loaded yet")}</span>
            <button type="button" className="button ghost" onClick={handleRunWalkForward} disabled={walkForwardLoading}>
              {walkForwardLoading ? t(locale, "?ㅽ뻾 以?, "Running") : t(locale, "?뚰겕?ъ썙??, "Walk-forward")}
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
                title={t(locale, "諛깊뀒?ㅽ듃 怨≪꽑", "Backtest equity")}
                subtitle={csvPath ?? ""}
                locale={getIntlLocale(locale)}
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

  */

  function renderLab() {
    return renderCopilot();
  }

  function renderSignals() {
    return (
      <>
        <section className="lab-grid">
          <div className="panel">
            <div className="section-header">
              <div>
                <span className="section-kicker">{t(locale, "?쒕굹由ъ삤", "Scenario")}</span>
                <h2>{t(locale, "Move the top drivers and read the scenario", "Move the top drivers and read the scenario")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "?낅줈???놁씠???꾩옱 ?쒖옣 而⑦뀓?ㅽ듃 ?꾩뿉??誘쇨컧?꾨? 諛붾줈 ?쎌뒿?덈떎.",
                  "Read scenario sensitivity directly on top of the live in-app market context."
                )}
              </p>
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
                <span>{t(locale, "諛⑺뼢", "Direction")}</span>
                <strong>{getForecastDirectionLabel(locale, scenarioForecast.direction)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "?먯닔", "Score")}</span>
                <strong>{formatSigned(locale, scenarioForecast.score, "")}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Confidence", "Confidence")}</span>
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
                <span className="section-kicker">{t(locale, "Integrated decision pack", "Integrated decision pack")}</span>
                <h2>{t(locale, "Operating read with no upload required", "Operating read with no upload required")}</h2>
              </div>
              <p>
                {t(
                  locale,
                  "怨듭떇 湲곗?媛? 鍮꾧탳 ?뚯씠?? ?쒕씪?대쾭, ?뚯뒪 ?좎꽑?꾨? ???덉뿉??諛붾줈 ?⑹퀜 ?쎌뒿?덈떎.",
                  "Read the official anchor, comparison tape, drivers, and source freshness together inside the app."
                )}
              </p>
            </div>

            <div className="metric-strip">
              <div className="metric-tile">
                <span>{t(locale, "Current stance", "Current stance")}</span>
                <strong>{getStanceLabel(locale, selectedDecision.stance)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Confidence", "Confidence")}</span>
                <strong>{Math.round(selectedDecision.confidence * 100)}%</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Official anchor", "Official anchor")}</span>
                <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "Freshness", "Freshness")}</span>
                <strong>{getFreshnessSummary(locale, selectedOfficialCard?.asOf)}</strong>
              </div>
            </div>

            <div className="note-list">
              <div className="note-item">
                <strong>{t(locale, "?곗뒪???댁꽍", "Desk read")}</strong>
                <p>{l(selectedDecision.summary)}</p>
              </div>
              <div className="note-item">
                <strong>{t(locale, "Comparison tape", "Comparison tape")}</strong>
                <p>
                  {selectedCompareQuote
                    ? joinReadoutParts(
                        selectedCompareQuote.symbol,
                        formatPercent(locale, selectedCompareQuote.changePct, 2),
                        getSourceStatusLabel(locale, selectedCompareQuote.status)
                      )
                    : t(locale, "?꾩옱 ?좏깮??鍮꾧탳 ?뚯씠?꾧? ?놁뒿?덈떎.", "No comparison tape is selected.")}
                </p>
              </div>
            </div>

            <ul className="bullet-list">
              {selectedDecision.support.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <strong>{l(item.title)}</strong>
                  <span>{l(item.detail)}</span>
                </li>
              ))}
              {selectedDecision.checks.slice(0, 3).map((item) => (
                <li key={item}>
                  <strong>{t(locale, "吏湲??뺤씤", "Verify now")}</strong>
                  <span>{l(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{t(locale, "Operator checklist", "Operator checklist")}</span>
              <h2>{t(locale, "?ㅽ깲??蹂寃????곗뒪???꾩껜 ?뺤씤", "Check the whole desk before changing posture")}</h2>
            </div>
            <p>
              {t(
                locale,
                "怨듭떇 湲곗?媛? 鍮꾧탳 媛? ?곴?, 諛⑺뼢 ?쇱튂, 由ъ뒪?ъ? ?뺤씤 ??ぉ??媛숈? 硫댁뿉???쎌뒿?덈떎.",
                "Read the official change, gap, correlation, direction match, risks, and verification items on one surface."
              )}
            </p>
          </div>

          <div className="metric-strip">
            <div className="metric-tile">
              <span>{t(locale, "Official change", "Official change")}</span>
              <strong>{getOfficialChangeLabel(selectedOfficialCard)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "愿대━", "Gap")}</span>
              <strong>{formatPercent(locale, compareOutput.stats.gapPct, 2)}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "?곴?", "Correlation")}</span>
              <strong>{formatSigned(locale, compareOutput.stats.correlation, "")}</strong>
            </div>
            <div className="metric-tile">
              <span>{t(locale, "諛⑺뼢 ?쇱튂", "Direction match")}</span>
              <strong>{formatPercent(locale, compareOutput.stats.directionMatchPct, 0)}</strong>
            </div>
          </div>

          <div className="command-two-up">
            <div className="status-card">
              <strong>{t(locale, "吏湲??뺤씤", "Verify now")}</strong>
              <ul className="plain-list">
                {selectedDecision.checks.slice(0, 5).map((item) => (
                  <li key={item}>{l(item)}</li>
                ))}
              </ul>
            </div>
            <div className="status-card warning">
              <strong>{t(locale, "由ъ뒪?ъ? 釉뚮젅?댁빱", "Risks and breakers")}</strong>
              <ul className="plain-list">
                {(selectedDecision.risks.length > 0
                  ? selectedDecision.risks.slice(0, 5)
                  : [
                      t(
                        locale,
                        "利됱떆 蹂댁씠??援ъ“??釉뚮젅?댁빱???쒗븳?곸씠吏留??ㅼ쓬 怨듭떇 ?낅뜲?댄듃??怨꾩냽 ?뺤씤?댁빞 ?⑸땲??",
                        "No immediate structural breaker is visible, but the next official update still matters."
                      )
                    ]).map((item) => (
                  <li key={item}>{l(item)}</li>
                ))}
              </ul>
            </div>
          </div>

          <InputCoverageGrid blocks={selectedInputBlocks} locale={locale} compact />
        </section>
      </>
    );
  }

  function renderCopilot() {
    return (
      <section className="copilot-shell">
        <div className="panel copilot-chat-panel">
          <div className="copilot-thread-header">
            <div>
              <span className="section-kicker">{t(locale, "코파일럿 스레드", "Copilot thread")}</span>
              <h2>
                {t(
                  locale,
                  "시장 컨텍스트를 유지하는 로컬 연구 스레드",
                  "Local research thread with persistent market context"
                )}
              </h2>
              <p>
                {t(
                  locale,
                  "Claude 공식 Projects, Styles, Artifacts 흐름을 참고해 채팅 우선 구조와 우측 사이드카를 다시 잡았습니다.",
                  "Benchmarked on Claude's official Projects, Styles, and Artifacts patterns: chat first, controls near the composer, and a sidecar for evidence instead of another settings page."
                )}
              </p>
            </div>
            <div className="inline-actions">
              <span className={`feed-pill tone-${localLlmState.available ? "positive" : localLlmState.installed ? "neutral" : "negative"}`}>
                {getLocalLlmStatusLabel(locale, localLlmState)}
              </span>
              <button
                type="button"
                className="button ghost small"
                onClick={handleClearLocalChat}
                disabled={currentChatMessages.length === 0 && !localChatLoading}
              >
                {t(locale, "새 채팅", "New chat")}
              </button>
            </div>
          </div>

          <div className="copilot-presence-strip">
            <span className="copilot-surface-pill">{selectedMarket.name}</span>
            <span className="copilot-surface-pill subtle">{getStanceLabel(locale, selectedDecision.stance)}</span>
            <span className="copilot-surface-pill subtle">{`${Math.round(selectedDecision.confidence * 100)}% ${t(locale, "신뢰도", "confidence")}`}</span>
            <span className="copilot-surface-pill subtle">{selectedCompareQuote?.symbol ?? t(locale, "없음", "n/a")}</span>
            <span className="copilot-surface-pill subtle">
              {latestChatMessage ? formatDate(locale, latestChatMessage.createdAt) : t(locale, "아직 응답 없음", "No reply yet")}
            </span>
          </div>

          <div className="copilot-benchmark-band">
            {copilotClaudeBenchmarks.map((item) => (
              <button
                key={item.id}
                type="button"
                className="copilot-benchmark-link"
                onClick={() => window.desktopBridge?.openExternal(item.url)}
              >
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </button>
            ))}
          </div>

          {localChatError ? (
            <div className="status-card error">
              <strong>{t(locale, "채팅 요청 오류", "Chat request error")}</strong>
              <p>{localChatError}</p>
            </div>
          ) : null}

          <div className="chat-shell copilot-chat-shell">
            <div className="chat-thread copilot-chat-thread" ref={chatThreadRef}>
              {currentChatMessages.length === 0 ? (
                <div className="chat-empty copilot-chat-empty">
                  <div className="copilot-empty-copy">
                    <strong>{t(locale, "로컬 채팅 준비 완료", "Local chat ready")}</strong>
                    <p>
                      {localLlmState.available
                        ? t(
                            locale,
                            "예시: 현재 K-ETS 읽기를 3문장으로 요약 / 공식 앵커와 비교 테이프 간 갭을 설명",
                            "Try: summarize the current K-ETS read in 3 sentences / explain the gap between the official anchor and the comparison tape"
                          )
                        : t(
                            locale,
                            "이 스레드를 시작하려면 Ollama와 최소 하나의 모델을 먼저 준비하세요.",
                            "Get Ollama and at least one model ready before starting this thread."
                          )}
                    </p>
                  </div>
                  <div className="copilot-starter-list">
                    {COPILOT_TASKS.map((task) => (
                      <button
                        key={task}
                        type="button"
                        className="copilot-suggestion-button"
                        onClick={() => handleSendQuickPrompt(task)}
                        disabled={localChatLoading || !localLlmState.available}
                      >
                        <strong>{getCopilotTaskLabel(locale, task)}</strong>
                        <span>{getCopilotTaskSummary(locale, task)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentChatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.role} ${message.status === "error" ? "error" : ""}`}
                >
                  <div className="chat-bubble">
                    <span className="chat-role">
                      {message.role === "user"
                        ? t(locale, "사용자", "You")
                        : message.model || t(locale, "로컬 모델", "Local model")}
                    </span>
                    <p className="chat-content">{message.content}</p>
                    {message.grounding && message.grounding.length > 0 ? (
                      <div className="chat-grounding">
                        {message.grounding.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="chat-grounding-chip"
                            onClick={() => {
                              if (item.url) {
                                void window.desktopBridge?.openExternal(item.url);
                              }
                            }}
                            disabled={!item.url}
                            title={`${item.kind} / ${item.detail}`}
                          >
                            <strong>{l(item.label)}</strong>
                            <span>{l(item.kind)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {message.boundaryNote ? <p className="chat-boundary-note">{l(message.boundaryNote)}</p> : null}
                    <span className="chat-meta">{formatDate(locale, message.createdAt)}</span>
                  </div>
                </div>
              ))}

              {localChatLoading ? (
                <div className="chat-message assistant">
                  <div className="chat-bubble pending">
                    <span className="chat-role">{t(locale, "로컬 모델", "Local model")}</span>
                    <p>{t(locale, "응답 생성 중...", "Generating response...")}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="chat-composer copilot-composer prominent">
            <div className="copilot-composer-head">
              <div>
                <strong>{t(locale, "이 스레드에서 바로 작성", "Compose directly in this thread")}</strong>
                <p>
                  {t(
                    locale,
                    "모델과 응답 스타일은 입력창 가까이에 두고, 시장 컨텍스트와 근거는 우측에 고정합니다.",
                    "Keep model and response style next to the prompt, while context and evidence stay pinned on the right."
                  )}
                </p>
              </div>
              <span className="meta-line">{getCopilotResponseStyleSummary(locale, copilotResponseStyle)}</span>
            </div>

            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder={
                localLlmState.available
                  ? t(locale, `${selectedMarket.name}에 대해 질문하세요`, `Ask about ${selectedMarket.name}`)
                  : t(locale, "먼저 Ollama를 확인하세요", "Check Ollama first")
              }
              rows={4}
              disabled={!localLlmState.available || localChatLoading}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendLocalChat();
                }
              }}
            />

            <div className="copilot-compose-footer">
              <div className="copilot-config-row">
                <label className="copilot-inline-field">
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

                <div className="copilot-style-toggle" role="group" aria-label={t(locale, "응답 스타일", "Response style")}>
                  {COPILOT_RESPONSE_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={copilotResponseStyle === style ? "active" : ""}
                      onClick={() => setCopilotResponseStyle(style)}
                    >
                      {getCopilotResponseStyleLabel(locale, style)}
                    </button>
                  ))}
                </div>

                <span className={`feed-pill tone-${localLlmState.available ? "positive" : localLlmState.installed ? "neutral" : "negative"}`}>
                  {getLocalLlmStatusLabel(locale, localLlmState)}
                </span>
              </div>

              <div className="inline-actions">
                <span className="meta-line">
                  {t(
                    locale,
                    "선택한 시장 컨텍스트와 근거 카드가 매 프롬프트에 함께 실립니다.",
                    "The selected market context and grounding cards are sent with each prompt."
                  )}
                </span>
                <div className="inline-actions">
                  {localLlmState.installed && !localLlmState.reachable ? (
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={handleLaunchLocalLlm}
                      disabled={localLlmLaunching}
                    >
                      {localLlmLaunching
                        ? t(locale, "Ollama 시작 중", "Starting Ollama")
                        : t(locale, "Ollama 시작", "Start Ollama")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => void handleSendLocalChat()}
                    disabled={!localLlmState.available || localChatLoading || !chatInput.trim()}
                  >
                    {localChatLoading ? t(locale, "전송 중", "Sending") : t(locale, "보내기", "Send")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="copilot-side-column">
          <div className="panel copilot-context-panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "프로젝트 컨텍스트", "Project context")}</span>
                <h2>{t(locale, "현재 읽기와 비교 테이프를 스레드 옆에 고정", "Pin the current read and tape beside the thread")}</h2>
              </div>
            </div>

            <div className="metric-strip copilot-context-strip">
              <div className="metric-tile">
                <span>{t(locale, "현재 스탠스", "Current stance")}</span>
                <strong>{getStanceLabel(locale, selectedDecision.stance)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "신뢰도", "Confidence")}</span>
                <strong>{Math.round(selectedDecision.confidence * 100)}%</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "공식 앵커", "Official anchor")}</span>
                <strong>{getOfficialPriceLabel(selectedOfficialCard)}</strong>
              </div>
              <div className="metric-tile">
                <span>{t(locale, "비교 테이프", "Comparison tape")}</span>
                <strong>{selectedCompareQuote?.symbol ?? t(locale, "없음", "n/a")}</strong>
              </div>
            </div>

            <div className="note-list">
              <div className="note-item">
                <strong>{t(locale, "데스크 읽기", "Desk read")}</strong>
                <p>{l(selectedDecision.summary)}</p>
              </div>
              <div className="note-item">
                <strong>{t(locale, "비교 피드 상태", "Comparison feed status")}</strong>
                <p>
                  {selectedCompareQuote
                    ? `${getQuoteProviderLabel(locale, selectedCompareQuote.provider)} / ${getQuoteDelayNoteLabel(locale, selectedCompareQuote)}`
                    : t(locale, "아직 비교 테이프가 선택되지 않았습니다.", "No comparison tape is selected yet.")}
                </p>
              </div>
            </div>

            <div className="field-list">
              <div>
                <span>{t(locale, "갭", "Gap")}</span>
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
                <span>{t(locale, "신선도", "Freshness")}</span>
                <strong>{getFreshnessSummary(locale, selectedOfficialCard?.asOf)}</strong>
              </div>
            </div>

            <div className="copilot-check-grid">
              <div className="status-card">
                <strong>{t(locale, "현재 스타일", "Current style")}</strong>
                <p>{getCopilotResponseStyleSummary(locale, copilotResponseStyle)}</p>
              </div>
              <div className="status-card">
                <strong>{t(locale, "스레드 메모리", "Thread memory")}</strong>
                <p>
                  {t(
                    locale,
                    `${currentChatMessages.length}개 메시지와 현재 ${selectedMarket.name} 컨텍스트를 유지합니다.`,
                    `Keeping ${currentChatMessages.length} messages plus the current ${selectedMarket.name} context.`
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="panel copilot-evidence-panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "근거 사이드카", "Evidence sidecar")}</span>
                <h2>{t(locale, "각 답변에 실리는 근거를 별도 영역에서 확인", "Inspect grounding in a dedicated sidecar")}</h2>
              </div>
            </div>

            <div className="copilot-grounding-list">
              {copilotPayload.grounding.map((item) => (
                <div key={item.id} className="copilot-grounding-card">
                  <div>
                    <span className="section-kicker">{l(item.kind)}</span>
                    <strong>{l(item.label)}</strong>
                  </div>
                  <p>{l(item.detail)}</p>
                  <div className="registry-meta">
                    {item.asOf ? <span>{formatDate(locale, item.asOf)}</span> : null}
                    {item.url ? (
                      <button
                        type="button"
                        className="button ghost small"
                        onClick={() => window.desktopBridge?.openExternal(item.url ?? "")}
                      >
                        {t(locale, "열기", "Open")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="copilot-check-grid">
              <div className="status-card">
                <strong>{t(locale, "지금 확인", "Verify now")}</strong>
                <ul className="plain-list">
                  {selectedDecision.checks.slice(0, 4).map((item) => (
                    <li key={item}>{l(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="status-card warning">
                <strong>{t(locale, "리스크와 브레이커", "Risks and breakers")}</strong>
                <ul className="plain-list">
                  {(selectedDecision.risks.length > 0
                    ? selectedDecision.risks.slice(0, 4)
                    : [
                        t(
                          locale,
                          "즉시 보이는 구조적 브레이커는 없지만 다음 공식 업데이트는 여전히 중요합니다.",
                          "No immediate structural breaker is visible, but the next official update still matters."
                        )
                      ]).map((item) => (
                    <li key={item}>{l(item)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="panel copilot-runtime-panel">
            <div className="section-header slim">
              <div>
                <span className="section-kicker">{t(locale, "런타임", "Runtime")}</span>
                <h2>{t(locale, "연결과 스레드 제어는 보조 패널에서 관리", "Keep connection controls in a secondary runtime panel")}</h2>
              </div>
            </div>

            <div className="note-list">
              <div className="note-item">
                <strong>{t(locale, "현재 모델", "Current model")}</strong>
                <p>
                  {selectedLocalModelMeta
                    ? `${selectedLocalModelMeta.name} / ${selectedLocalModelMeta.parameterSize || t(locale, "파라미터 정보 없음", "no parameter metadata")}`
                    : t(locale, "선택된 로컬 모델이 없습니다.", "No local model is selected yet.")}
                </p>
              </div>
              <div className="note-item">
                <strong>{t(locale, "Claude 참고 포인트", "Claude reference points")}</strong>
                <div className="copilot-reference-list">
                  {copilotClaudeBenchmarks.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="copilot-reference-chip"
                      onClick={() => window.desktopBridge?.openExternal(item.url)}
                    >
                      {item.kicker}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
            </div>

            {selectedLocalModelMeta ? (
              <div className="field-list copilot-model-stats">
                <div>
                  <span>{t(locale, "패밀리", "Family")}</span>
                  <strong>{selectedLocalModelMeta.family || t(locale, "없음", "n/a")}</strong>
                </div>
                <div>
                  <span>{t(locale, "파라미터", "Parameters")}</span>
                  <strong>{selectedLocalModelMeta.parameterSize || t(locale, "없음", "n/a")}</strong>
                </div>
                <div>
                  <span>{t(locale, "양자화", "Quantization")}</span>
                  <strong>{selectedLocalModelMeta.quantizationLevel || t(locale, "없음", "n/a")}</strong>
                </div>
                <div>
                  <span>{t(locale, "수정 시각", "Modified")}</span>
                  <strong>{formatDate(locale, selectedLocalModelMeta.modifiedAt)}</strong>
                </div>
              </div>
            ) : null}

            <div className="inline-actions">
              {localLlmState.installed && !localLlmState.reachable ? (
                <button
                  type="button"
                  className="button ghost small"
                  onClick={handleLaunchLocalLlm}
                  disabled={localLlmLaunching}
                >
                  {localLlmLaunching
                    ? t(locale, "Ollama 시작 중", "Starting Ollama")
                    : t(locale, "Ollama 시작", "Start Ollama")}
                </button>
              ) : null}
              <button
                type="button"
                className="button ghost small"
                onClick={handleSaveLocalLlmSettings}
                disabled={localLlmSaving || localLlmLaunching}
              >
                {localLlmSaving ? t(locale, "확인 중", "Checking") : t(locale, "연결 확인", "Check connection")}
              </button>
              <span className={`feed-pill tone-${localLlmState.available ? "positive" : localLlmState.installed ? "neutral" : "negative"}`}>
                {getLocalLlmStatusLabel(locale, localLlmState)}
              </span>
              {localLlmState.cliVersion ? <span className="feed-pill">{`CLI ${localLlmState.cliVersion}`}</span> : null}
            </div>

            {localLlmError ? (
              <div className="status-card error">
                <strong>{t(locale, "로컬 모델 오류", "Local model error")}</strong>
                <p>{localLlmError}</p>
              </div>
            ) : null}

            {!localLlmError && localLlmState.error ? (
              <div className="status-card warning">
                <strong>{t(locale, "연결 상태", "Connection status")}</strong>
                <p>{localLlmState.error}</p>
                {getLocalLlmSetupSteps(locale, localLlmState).length > 0 ? (
                  <ul className="plain-list command-list">
                    {getLocalLlmSetupSteps(locale, localLlmState).map((item) => (
                      <li key={item}>{l(item)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderInspector() {
    return (
      <aside className="app-inspector" ref={inspectorScrollRef}>
        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "선택 시장", "Selected market")}</span>
          <h2>{selectedMarket.name}</h2>
          <p>{getMarketStageNote(locale, selectedMarket.id)}</p>
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
            emptySubtitle={t(
              locale,
              "연속 공식 가격 데이터가 아직 충분하지 않습니다.",
              "Continuous official price data is not available yet."
            )}
            locale={getIntlLocale(locale)}
          />
        </div>

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "데스크 읽기", "Desk read")}</span>
          <p>{l(selectedDecision.summary)}</p>
          <ul className="bullet-list compact">
            {selectedDecision.checks.slice(0, 4).map((item) => (
              <li key={item}>
                <span>{l(item)}</span>
              </li>
            ))}
          </ul>
        </div>

        {selectedOfficialFreshnessLevel !== "fresh" ? (
          <div className="inspector-section">
            <div className="status-card warning">
              <strong>
                {selectedOfficialFreshnessLevel === "stale"
                  ? t(locale, "공식 앵커 재확인 필요", "Official anchor needs refresh")
                  : t(locale, "공식 앵커 재점검 필요", "Official anchor needs a recheck")}
              </strong>
              <p>
                {t(
                  locale,
                  `${selectedMarket.name} 공식 기준값은 ${getFreshnessSummary(locale, selectedOfficialCard?.asOf)} 상태입니다. 다음 공식 업데이트가 들어오면 확신이 달라질 수 있습니다.`,
                  `${selectedMarket.name} official anchor is ${getFreshnessSummary(locale, selectedOfficialCard?.asOf)}. Conviction can change when the next official update lands.`
                )}
              </p>
            </div>
          </div>
        ) : null}

        <div className="inspector-section">
          <span className="section-kicker">{t(locale, "비교 통계", "Tape agreement")}</span>
          <div className="field-list">
            <div>
              <span>{t(locale, "갭", "Gap")}</span>
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
          <span className="section-kicker">{t(locale, "소스 신뢰", "Source trust")}</span>
          <div className="field-list">
            <div>
              <span>{t(locale, "공식 소스", "Official")}</span>
              <strong className={`tone-${getSourceTone(selectedOfficialCard?.status ?? "error")}`}>
                {selectedOfficialCard?.status ?? "error"}
              </strong>
              <p className="field-note">{getOfficialMethod(selectedOfficialCard, locale)}</p>
            </div>
            <div>
              <span>{t(locale, "상장 비교", "Listed")}</span>
              <strong className={`tone-${getSourceTone(selectedCompareQuote?.status ?? "error")}`}>
                {selectedCompareQuote?.status ?? "error"}
              </strong>
              <p className="field-note">{getQuoteProviderLabel(locale, selectedCompareQuote?.provider)}</p>
            </div>
            <div>
              <span>{t(locale, "공식 신선도", "Official freshness")}</span>
              <strong>{getFreshnessLevelLabel(locale, selectedOfficialFreshnessLevel)}</strong>
              <p className="field-note">{getFreshnessSummary(locale, selectedOfficialCard?.asOf ?? "")}</p>
            </div>
            <div>
              <span>{t(locale, "상장 신선도", "Listed freshness")}</span>
              <strong>{getFreshnessLevelLabel(locale, selectedLiveFreshnessLevel)}</strong>
              <p className="field-note">{getFreshnessSummary(locale, selectedCompareQuote?.asOf ?? "")}</p>
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
          <button
            type="button"
            className={getUiLocale(locale) === "ko" ? "active" : ""}
            onClick={() => setLocale("ko")}
          >
            KO
          </button>
          <button
            type="button"
            className={getUiLocale(locale) === "en" ? "active" : ""}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>

        <div className="rail-section">
          <span className="rail-label">{t(locale, "Workspace", "Workspace")}</span>
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

        <div className="rail-note">
          <strong>{t(locale, "?쒗뭹 寃쎄퀎", "Product boundary")}</strong>
          <p>
            {t(
              locale,
              "二쇰Ц ?ㅽ뻾?대굹 嫄곕옒 以묎컻???섏? ?딆뒿?덈떎. 怨듭떇媛? 鍮꾧탳 湲곗?, 媛寃??붿씤, ?뚯뒪 ?좊ː瑜????붾㈃?먯꽌 ?쎈뒗 ?곗뒪?ъ엯?덈떎.",
              "This desktop does not route orders or intermediate trades. It is a decision desk for official anchors, listed benchmarks, price drivers, and source trust."
            )}
          </p>
        </div>
      </aside>

      <main className="app-main">
        <header className="workspace-head">
          <div>
            <span className="eyebrow">
              {surface === "command"
                ? t(locale, "Carbon mission control", "Carbon mission control")
                : surface === "copilot"
                  ? t(locale, "濡쒖뺄 留덉폆 肄뷀뙆?쇰읉", "Local market copilot")
                : t(locale, "Global carbon decision desk", "Global carbon decision desk")}
            </span>
            <h1>
              {surface === "command"
                ? "C-Quant Command"
                : surface === "copilot"
                  ? "C-Quant Copilot"
                  : selectedMarket.name}
            </h1>
            <p>
              {surface === "command"
                ? t(
                    locale,
                    "怨듭떇 ?듭빱, ?ㅼ떆媛?鍮꾧탳 ?뚯씠?? ?뚯뒪 ?좊ː, 援щ룆 媛移섎? ???붾㈃?먯꽌 ?쎈뒗 ?곸쐞 ?댁쁺硫댁엯?덈떎.",
                    "A top-level operating surface for official anchors, live comparison tapes, source trust, and subscription value."
                  )
                : surface === "copilot"
                  ? t(
                      locale,
                      "濡쒖뺄 紐⑤뜽, ?쒖옣 而⑦뀓?ㅽ듃, 洹쇨굅 移대뱶, ?쒕굹由ъ삤 ?뚰겕踰ㅼ튂瑜????붾㈃??紐⑥? ?꾩슜 肄뷀뙆?쇰읉 ?뚰겕?ㅽ럹?댁뒪?낅땲??",
                      "A dedicated copilot workspace that groups the local model, market context, grounding cards, and scenario workbench."
                    )
                : getMarketHeadline(locale, marketId)}
            </p>
          </div>

          <div className="head-actions">
            <div className="live-chip">{t(locale, "?쇱씠釉?李⑦듃 30珥?媛깆떊", "Live chart refreshes every 30s")}</div>
            <div className="feed-pill">{sourceRefreshLabel}</div>
            {surface === "copilot" ? (
              <div className={`feed-pill tone-${localLlmState.available ? "positive" : "negative"}`}>
                {localCopilotBadge}
              </div>
            ) : null}
            <button
              type="button"
              className="button ghost"
              onClick={() => openCopilotWorkspace(chatInput)}
            >
              {surface === "copilot" ? t(locale, "Focus chat", "Focus chat") : t(locale, "Open chat", "Open chat")}
            </button>
            <button type="button" className="button primary" onClick={handleRefresh}>
              {sourcesLoading ? t(locale, "Refreshing", "Refreshing") : t(locale, "Refresh data", "Refresh data")}
            </button>
          </div>
        </header>

        {surface !== "command" ? (
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
        ) : null}

        {sourcesError ? <div className="status-banner error">{sourcesError}</div> : null}
        {quoteError ? <div className="status-banner warning">{quoteError}</div> : null}
        {connectedSources.warnings.length > 0 ? (
          <div className="status-banner warning">{connectedSources.warnings.join(" / ")}</div>
        ) : null}

        <div className={`workspace-grid ${surface === "copilot" ? "copilot-focus" : ""}`}>
          <section className="workspace-scroll" ref={workspaceScrollRef}>
            {surface === "command" ? renderCommand() : null}
            {surface === "desk" ? renderDesk() : null}
            {surface === "drivers" ? renderDrivers() : null}
            {surface === "sources" ? renderSources() : null}
            {surface === "copilot" ? renderCopilot() : null}
          </section>
          {surface === "copilot" ? null : renderInspector()}
        </div>
      </main>
    </div>
  );
}
