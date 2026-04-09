import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { datasetTemplates, marketDatasetSchemas } from "./data/dataHub";
import {
  alertTemplates,
  autonomousPlan,
  benchmarkPlatforms,
  catalystWindows,
  watchViewPresets,
  watchlistPresets,
  workspacePresets
} from "./data/experience";
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
  BacktestRun,
  BacktestStrategy,
  BenchmarkPlatform,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  MarketDriver,
  MarketProfile,
  MarketWatchItem,
  ParsedSeriesPoint,
  WalkForwardResult,
  WatchViewPreset,
  WatchlistPreset,
  WorkspacePreset
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
    };
  }
}

type Surface = "overview" | "workspace" | "alerts" | "lab" | "sources";
type LabMode = "scenario" | "model" | "backtest";

type SurfaceDefinition = {
  id: Surface;
  label: string;
  title: string;
  summary: string;
};

type FeedItem = {
  id: string;
  tone: "live" | "warning" | "model" | "context";
  kicker: string;
  title: string;
  body: string;
  link?: string;
};

type AlertInboxItem = {
  id: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  body: string;
  hint: string;
};

type DriverFamily = {
  id: string;
  label: string;
  summary: string;
  matcher: (category: string) => boolean;
};

type DriverMatrixRow = {
  family: DriverFamily;
  byMarket: Record<MarketProfile["id"], MarketDriver | undefined>;
};

const surfaceTabs: SurfaceDefinition[] = [
  {
    id: "overview",
    label: "개요",
    title: "탄소 인텔리전스 보드",
    summary: "세 시장의 공식 상태와 오늘 확인해야 할 촉매를 먼저 봅니다."
  },
  {
    id: "workspace",
    label: "워크스페이스",
    title: "운영형 작업면",
    summary: "워치리스트, 프리셋, 벤치마크 기능을 저장형 작업 흐름으로 정리합니다."
  },
  {
    id: "alerts",
    label: "알림",
    title: "알림 허브",
    summary: "공식 출처 이상, 정책 이벤트, 프록시 괴리, 일일 브리프를 관리합니다."
  },
  {
    id: "lab",
    label: "연구실",
    title: "시나리오와 모델 검증",
    summary: "시나리오, 워크포워드, 백테스트를 같은 흐름에서 검토합니다."
  },
  {
    id: "sources",
    label: "출처",
    title: "신뢰 센터",
    summary: "모든 숫자의 출처, 가격 영향 변수, 벤치마크 기준을 투명하게 공개합니다."
  }
];

const driverFamilies: DriverFamily[] = [
  {
    id: "policy",
    label: "정책·공급",
    summary: "캡 경로, 할당, 경매, 업종 확대, 제도 개편",
    matcher: (category) => /policy|supply|calendar/i.test(category)
  },
  {
    id: "power",
    label: "전력·산업",
    summary: "전력 가격, 발전 믹스, 산업 생산, 커버드 수요",
    matcher: (category) => /power|industry/i.test(category)
  },
  {
    id: "fuel",
    label: "연료 전환",
    summary: "가스, 석탄, 석유, 청정 스프레드",
    matcher: (category) => /fuel/i.test(category)
  },
  {
    id: "macro",
    label: "거시·금융",
    summary: "증시, 신용, 금리, 환율, 경기 민감도",
    matcher: (category) => /macro|financial/i.test(category)
  },
  {
    id: "weather",
    label: "날씨·계절",
    summary: "기온, 냉난방, 풍력·수력 여건, 이행 시즌",
    matcher: (category) => /weather|seasonality/i.test(category)
  },
  {
    id: "execution",
    label: "유동성·실행",
    summary: "거래량, 오픈이자, 참여자 폭, 미시구조",
    matcher: (category) =>
      /microstructure|execution|liquidity|market/i.test(category)
  }
];

const surfaceChoices = surfaceTabs.map((item) => item.id);
const workspaceChoices = workspacePresets.map((item) => item.id);
const watchlistChoices = watchlistPresets.map((item) => item.id);
const watchViewChoices = watchViewPresets.map((item) => item.id);

const emptySources: ConnectedSourcePayload = {
  fetchedAt: "",
  cards: [],
  warnings: []
};

const marketNameMap: Record<MarketProfile["id"], string> = {
  "eu-ets": "EU ETS",
  "k-ets": "K-ETS",
  "cn-ets": "China ETS"
};

const strategyLabels: Record<BacktestStrategy, string> = {
  trend: "추세 추종",
  meanReversion: "평균 회귀",
  spreadRegime: "스프레드 레짐",
  policyMomentum: "정책 모멘텀"
};

const labModeLabels: Record<LabMode, string> = {
  scenario: "시나리오",
  model: "워크포워드",
  backtest: "백테스트"
};

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

function readStoredList(key: string, fallback: string[]): string[] {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : fallback;
  } catch {
    return fallback;
  }
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return "미연결";
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  return value;
}

function formatDayLabel(value?: string): string {
  if (!value) {
    return "미연결";
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric"
    });
  }
  return value;
}

function parseMetricNumber(value?: string): number | null {
  if (!value) {
    return null;
  }
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function getMetricValue(card: ConnectedSourceCard | undefined, label: string): string {
  const entry = card?.metrics.find((metric) =>
    metric.label.toLowerCase().includes(label.toLowerCase())
  );
  return entry?.value ?? "";
}

function getStatusLabel(status: ConnectedSourceCard["status"]): string {
  if (status === "connected") {
    return "정상";
  }
  if (status === "limited") {
    return "부분";
  }
  return "오류";
}

function buildInitialFactorState(marketId: MarketProfile["id"]): Record<string, number> {
  const profile = marketProfiles.find((market) => market.id === marketId);
  if (!profile) {
    return {};
  }
  return Object.fromEntries(profile.drivers.map((driver) => [driver.id, 0]));
}

function buildDriverMatrix(): DriverMatrixRow[] {
  return driverFamilies.map((family) => ({
    family,
    byMarket: {
      "eu-ets": marketProfiles
        .find((market) => market.id === "eu-ets")
        ?.drivers.filter((driver) => family.matcher(driver.category))
        .sort((left, right) => right.weight - left.weight)[0],
      "k-ets": marketProfiles
        .find((market) => market.id === "k-ets")
        ?.drivers.filter((driver) => family.matcher(driver.category))
        .sort((left, right) => right.weight - left.weight)[0],
      "cn-ets": marketProfiles
        .find((market) => market.id === "cn-ets")
        ?.drivers.filter((driver) => family.matcher(driver.category))
        .sort((left, right) => right.weight - left.weight)[0]
    }
  }));
}

function severityRank(severity: AlertInboxItem["severity"]): number {
  if (severity === "High") {
    return 0;
  }
  if (severity === "Medium") {
    return 1;
  }
  return 2;
}

function buildFeedItems(
  payload: ConnectedSourcePayload,
  focusMarket: MarketProfile["id"],
  forecast: ReturnType<typeof buildForecast>
): FeedItem[] {
  const cards = [...payload.cards].sort((left, right) => {
    if (left.marketId === focusMarket && right.marketId !== focusMarket) {
      return -1;
    }
    if (left.marketId !== focusMarket && right.marketId === focusMarket) {
      return 1;
    }
    return left.status.localeCompare(right.status);
  });

  const items: FeedItem[] = cards.map((card) => ({
    id: `source-${card.id}`,
    tone: card.status === "error" ? "warning" : "live",
    kicker: `${marketNameMap[card.marketId]} · ${card.sourceName}`,
    title: card.headline,
    body: `${card.summary} 마지막 갱신 ${formatDayLabel(card.asOf)}.`,
    link: card.links[0]?.url
  }));

  items.push(
    ...payload.warnings.map((warning, index) => ({
      id: `warning-${index}`,
      tone: "warning" as const,
      kicker: "운영 경고",
      title: "공식 소스 확인 필요",
      body: warning
    }))
  );

  if (forecast.direction !== "Neutral" && forecast.confidence >= 0.55) {
    items.push({
      id: "model-overlay",
      tone: "model",
      kicker: "모델 오버레이",
      title: `${marketNameMap[focusMarket]} ${forecast.direction}`,
      body: `시나리오 점수 ${forecast.score.toFixed(2)}, 신뢰도 ${Math.round(
        forecast.confidence * 100
      )}% 입니다. 이는 참고용 모델 오버레이입니다.`
    });
  }

  items.push(
    ...catalystWindows
      .filter((windowItem) => windowItem.marketId === "shared" || windowItem.marketId === focusMarket)
      .slice(0, 2)
      .map((windowItem) => ({
        id: `catalyst-${windowItem.id}`,
        tone: "context" as const,
        kicker: `${windowItem.windowLabel} · 촉매`,
        title: windowItem.title,
        body: windowItem.trigger,
        link: windowItem.source.url
      }))
  );

  return items.slice(0, 8);
}

function buildAlertInbox(
  payload: ConnectedSourcePayload,
  activeTemplateIds: string[],
  forecast: ReturnType<typeof buildForecast>,
  watchlistPreset: WatchlistPreset
): AlertInboxItem[] {
  const items: AlertInboxItem[] = [];

  if (activeTemplateIds.includes("official-refresh")) {
    payload.cards
      .filter((card) => card.status !== "connected")
      .forEach((card) => {
        items.push({
          id: `refresh-${card.id}`,
          severity: card.status === "error" ? "High" : "Medium",
          title: `${marketNameMap[card.marketId]} 공식 소스 상태 점검`,
          body: `${card.sourceName}가 ${getStatusLabel(card.status)} 상태입니다.`,
          hint: card.summary
        });
      });
  }

  if (activeTemplateIds.includes("auction-anomaly")) {
    payload.cards.forEach((card) => {
      const coverRatio = parseMetricNumber(getMetricValue(card, "Cover ratio"));
      const priceChange =
        parseMetricNumber(getMetricValue(card, "Price change")) ??
        parseMetricNumber(getMetricValue(card, "Return"));
      if (coverRatio !== null && (coverRatio < 1.2 || coverRatio > 2.5)) {
        items.push({
          id: `auction-${card.id}`,
          severity: "High",
          title: `${marketNameMap[card.marketId]} 경매 커버율 확인`,
          body: `${card.sourceName}의 커버율이 ${coverRatio.toFixed(2)}x 입니다.`,
          hint: "경매 리듬과 단기 공급 압력 해석이 필요합니다."
        });
      } else if (priceChange !== null && Math.abs(priceChange) >= 2) {
        items.push({
          id: `price-${card.id}`,
          severity: "Medium",
          title: `${marketNameMap[card.marketId]} 가격 변동 확대`,
          body: `${card.sourceName} 카드에서 단기 가격 변화가 크게 나타났습니다.`,
          hint: "경매, 유동성, 정책 이벤트를 함께 확인하세요."
        });
      }
    });
  }

  if (activeTemplateIds.includes("policy-bulletin")) {
    const policyCard = payload.cards.find((card) => card.marketId === "cn-ets");
    if (policyCard) {
      items.push({
        id: "policy-cn",
        severity: "Medium",
        title: "중국 정책 피드 추적",
        body: `${policyCard.sourceName} 최신 항목은 ${formatDayLabel(policyCard.asOf)} 기준입니다.`,
        hint: policyCard.headline
      });
    }
  }

  if (activeTemplateIds.includes("proxy-divergence") && watchlistPreset.id !== "official-only") {
    items.push({
      id: "proxy-watch",
      severity: "Low",
      title: "상장 프록시와 공식 시장 구분",
      body: "ETF와 ETC는 접근성은 좋지만 공식 가격 소스와 동일하지 않습니다.",
      hint: "프록시 화면은 확인용, 공식 시장 카드와 함께 보세요."
    });
  }

  if (activeTemplateIds.includes("liquidity-thin")) {
    const ketsCard = payload.cards.find((card) => card.marketId === "k-ets");
    const volume = parseMetricNumber(getMetricValue(ketsCard, "Volume"));
    if ((volume !== null && volume === 0) || ketsCard?.status === "limited") {
      items.push({
        id: "liquidity-kets",
        severity: "Medium",
        title: "K-ETS 유동성 확인",
        body: "현재 카드 기준으로 거래량 또는 커버리지 확인이 필요합니다.",
        hint: "얇은 시장에서는 방향보다 실행 가능성이 더 중요합니다."
      });
    }
  }

  if (
    activeTemplateIds.includes("model-watch") &&
    forecast.direction !== "Neutral" &&
    forecast.confidence >= 0.7
  ) {
    items.push({
      id: "model-forecast",
      severity: "Low",
      title: "모델 방향성 참고",
      body: `시나리오 모델이 ${forecast.direction} 쪽으로 기울어 있습니다.`,
      hint: "실거래 신호가 아니라 해석 보조용입니다."
    });
  }

  return items.sort(
    (left, right) => severityRank(left.severity) - severityRank(right.severity)
  );
}

function buildDailyBrief(args: {
  focusMarket: MarketProfile["id"];
  payload: ConnectedSourcePayload;
  forecast: ReturnType<typeof buildForecast>;
  alertItems: AlertInboxItem[];
}): string {
  const lines: string[] = [];
  const focusCard = args.payload.cards.find((card) => card.marketId === args.focusMarket);
  const generatedAt = new Date().toLocaleString("ko-KR");

  lines.push("C-Quant Daily Brief");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Focus market: ${marketNameMap[args.focusMarket]}`);
  lines.push("");
  lines.push("[Official market board]");

  marketProfiles.forEach((profile) => {
    const card = args.payload.cards.find((entry) => entry.marketId === profile.id);
    lines.push(
      `- ${profile.name}: ${card?.summary ?? "공식 카드 미연결"} (as of ${card?.asOf ?? "n/a"})`
    );
    card?.metrics.slice(0, 3).forEach((metric) => {
      lines.push(`  · ${metric.label}: ${metric.value}`);
    });
  });

  lines.push("");
  lines.push("[Focus drivers]");
  args.forecast.contributions.slice(0, 4).forEach((entry) => {
    lines.push(`- ${entry.variable}: ${entry.contribution.toFixed(2)}`);
  });

  lines.push("");
  lines.push("[Active alerts]");
  if (args.alertItems.length === 0) {
    lines.push("- 현재 활성 알림 없음");
  } else {
    args.alertItems.slice(0, 6).forEach((item) => {
      lines.push(`- [${item.severity}] ${item.title}: ${item.body}`);
    });
  }

  if (focusCard) {
    lines.push("");
    lines.push("[Focus source]");
    lines.push(`- ${focusCard.sourceName}`);
    focusCard.links.forEach((link) => {
      lines.push(`  · ${link.label}: ${link.url}`);
    });
  }

  return lines.join("\n");
}

function openExternal(url: string) {
  if (window.desktopBridge?.openExternal) {
    void window.desktopBridge.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function WindowChrome() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function syncState() {
      if (!window.desktopBridge?.isWindowMaximized) {
        return;
      }
      const value = await window.desktopBridge.isWindowMaximized();
      if (mounted) {
        setIsMaximized(value);
      }
    }

    void syncState();
    const handle = () => void syncState();
    window.addEventListener("resize", handle);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handle);
    };
  }, []);

  async function toggleWindowState() {
    const nextValue = await window.desktopBridge?.toggleMaximizeWindow?.();
    if (typeof nextValue === "boolean") {
      setIsMaximized(nextValue);
    }
  }

  return (
    <div className="window-chrome">
      <div className="window-drag-area">
        <div className="window-mark">C</div>
        <div>
          <div className="window-title">C-Quant</div>
          <div className="window-subtitle">Carbon intelligence terminal</div>
        </div>
      </div>
      <div className="window-controls">
        <button
          type="button"
          className="window-control"
          onClick={() => void window.desktopBridge?.minimizeWindow?.()}
          aria-label="창 최소화"
        >
          –
        </button>
        <button
          type="button"
          className="window-control"
          onClick={() => void toggleWindowState()}
          aria-label={isMaximized ? "창 복원" : "창 최대화"}
        >
          {isMaximized ? "❐" : "□"}
        </button>
        <button
          type="button"
          className="window-control close"
          onClick={() => void window.desktopBridge?.closeWindow?.()}
          aria-label="창 닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function SectionHeader(props: {
  eyebrow: string;
  title: string;
  summary: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <div className="section-eyebrow">{props.eyebrow}</div>
        <h2>{props.title}</h2>
        <p>{props.summary}</p>
      </div>
      {props.action ? <div className="section-action">{props.action}</div> : null}
    </div>
  );
}

function LinkButton(props: { label: string; url: string; subtle?: boolean }) {
  return (
    <button
      type="button"
      className={props.subtle ? "link-button subtle" : "link-button"}
      onClick={() => openExternal(props.url)}
    >
      {props.label}
    </button>
  );
}

function SourceStatusBadge(props: { status: ConnectedSourceCard["status"] }) {
  return <span className={`status-pill ${props.status}`}>{getStatusLabel(props.status)}</span>;
}

function LeftRail(props: {
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  focusMarket: MarketProfile["id"];
  onMarketChange: (marketId: MarketProfile["id"]) => void;
  activeWorkspace: WorkspacePreset;
  workspaceId: string;
  onWorkspaceChange: (id: string) => void;
  watchlistId: string;
  onWatchlistChange: (id: string) => void;
}) {
  return (
    <aside className="side-rail">
      <div className="rail-brand">
        <div className="brand-seal">C</div>
        <div>
          <div className="brand-name">C-Quant</div>
          <div className="brand-note">거래는 밖에서, 판단은 여기서.</div>
        </div>
      </div>

      <div className="rail-block">
        <div className="rail-label">화면</div>
        <div className="nav-stack">
          {surfaceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === props.surface ? "nav-button active" : "nav-button"}
              onClick={() => props.onSurfaceChange(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.summary}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="rail-block">
        <div className="rail-label">시장</div>
        <div className="choice-stack">
          {marketProfiles.map((market) => (
            <button
              key={market.id}
              type="button"
              className={
                market.id === props.focusMarket ? "choice-pill active" : "choice-pill"
              }
              onClick={() => props.onMarketChange(market.id)}
            >
              {market.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rail-block">
        <div className="rail-label">저장된 워크스페이스</div>
        <div className="workspace-list">
          {workspacePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                preset.id === props.workspaceId ? "workspace-button active" : "workspace-button"
              }
              onClick={() => props.onWorkspaceChange(preset.id)}
            >
              <strong>{preset.title}</strong>
              <span>{preset.objective}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rail-block">
        <div className="rail-label">워치리스트</div>
        <div className="workspace-list compact">
          {watchlistPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                preset.id === props.watchlistId ? "workspace-button active" : "workspace-button"
              }
              onClick={() => props.onWatchlistChange(preset.id)}
            >
              <strong>{preset.title}</strong>
              <span>{preset.summary}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rail-card">
        <div className="rail-card-title">{props.activeWorkspace.title}</div>
        <p>{props.activeWorkspace.summary}</p>
        <div className="inline-tags">
          {props.activeWorkspace.moduleLabels.map((label) => (
            <span key={label} className="soft-tag">
              {label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function InspectorRail(props: {
  focusProfile: MarketProfile;
  focusCard?: ConnectedSourceCard;
  alertCount: number;
  activeWorkspace: WorkspacePreset;
  activeBenchmarks: BenchmarkPlatform[];
  sourcesError: string | null;
}) {
  return (
    <aside className="inspector-rail">
      <section className="inspector-panel">
        <div className="inspector-label">선택 시장</div>
        <h3>{props.focusProfile.name}</h3>
        <p>{props.focusProfile.stageNote}</p>
        {props.focusCard ? (
          <>
            <div className="inspector-row">
              <SourceStatusBadge status={props.focusCard.status} />
              <span>{formatDayLabel(props.focusCard.asOf)}</span>
            </div>
            <div className="inspector-metrics">
              {props.focusCard.metrics.slice(0, 3).map((metric) => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
            <div className="inline-links">
              {props.focusCard.links.slice(0, 2).map((link) => (
                <LinkButton key={link.url} label={link.label} url={link.url} subtle />
              ))}
            </div>
          </>
        ) : (
          <p className="muted">공식 카드가 아직 연결되지 않았습니다.</p>
        )}
      </section>

      <section className="inspector-panel">
        <div className="inspector-label">오늘의 상태</div>
        <div className="inspector-stat">{props.alertCount}</div>
        <p>활성 알림 기준으로 지금 확인할 항목 수입니다.</p>
        {props.sourcesError ? <p className="warning-copy">{props.sourcesError}</p> : null}
      </section>

      <section className="inspector-panel">
        <div className="inspector-label">워크스페이스 원형</div>
        <h3>{props.activeWorkspace.title}</h3>
        <p>{props.activeWorkspace.summary}</p>
        <div className="inspector-list">
          {props.activeBenchmarks.map((platform) => (
            <div key={platform.id}>
              <strong>{platform.name}</strong>
              <span>{platform.category}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="inspector-panel">
        <div className="inspector-label">신뢰 원칙</div>
        <div className="inspector-list">
          {trustPrinciples.map((principle) => (
            <div key={principle.id}>
              <strong>{principle.title}</strong>
              <span>{principle.description}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function MarketBoardCard(props: {
  profile: MarketProfile;
  card?: ConnectedSourceCard;
  active: boolean;
  onSelect: () => void;
}) {
  const headlineMetric = props.card?.metrics[0];

  return (
    <button
      type="button"
      className={props.active ? "market-board-card active" : "market-board-card"}
      onClick={props.onSelect}
    >
      <div className="market-card-top">
        <div>
          <span className="market-region">{props.profile.region}</span>
          <h3>{props.profile.name}</h3>
        </div>
        {props.card ? <SourceStatusBadge status={props.card.status} /> : null}
      </div>
      <div className="market-card-main">
        <div className="metric-name">{headlineMetric?.label ?? "Official status"}</div>
        <div className="metric-value">{headlineMetric?.value ?? "미연결"}</div>
        <p>{props.card?.summary ?? props.profile.scopeNote}</p>
      </div>
      <div className="market-card-footer">
        <span>{formatDayLabel(props.card?.asOf)}</span>
        <span>{props.card?.sourceName ?? "공식 소스 대기"}</span>
      </div>
    </button>
  );
}

function OverviewSurface(props: {
  focusMarket: MarketProfile["id"];
  focusProfile: MarketProfile;
  sourcePayload: ConnectedSourcePayload;
  driverMatrix: DriverMatrixRow[];
  feedItems: FeedItem[];
  watchlistPreset: WatchlistPreset;
  watchItems: MarketWatchItem[];
  onMarketChange: (marketId: MarketProfile["id"]) => void;
}) {
  const focusCard = props.sourcePayload.cards.find((card) => card.marketId === props.focusMarket);

  return (
    <div className="surface-stack">
      <section className="hero-panel">
        <SectionHeader
          eyebrow="Today"
          title={`${props.focusProfile.name}를 기준으로 오늘의 탄소시장 흐름을 봅니다.`}
          summary={props.focusProfile.scopeNote}
          action={
            focusCard?.links[0] ? (
              <LinkButton label="공식 출처 열기" url={focusCard.links[0].url} />
            ) : null
          }
        />
        <div className="hero-summary">
          <div className="hero-number">
            <span>{focusCard?.metrics[0]?.label ?? "연결 상태"}</span>
            <strong>{focusCard?.metrics[0]?.value ?? "미연결"}</strong>
          </div>
          <div className="hero-copy">
            <h3>{focusCard?.headline ?? props.focusProfile.name}</h3>
            <p>{focusCard?.summary ?? props.focusProfile.stageNote}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Global Carbon Board"
          title="세 시장을 같은 해상도로 비교"
          summary="공식 카드만 먼저 배치해서 가격, 상태, 갱신 시점을 한 번에 읽게 했습니다."
        />
        <div className="market-board-grid">
          {marketProfiles.map((profile) => (
            <MarketBoardCard
              key={profile.id}
              profile={profile}
              card={props.sourcePayload.cards.find((card) => card.marketId === profile.id)}
              active={profile.id === props.focusMarket}
              onSelect={() => props.onMarketChange(profile.id)}
            />
          ))}
        </div>
      </section>

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Driver Matrix"
            title="가격 영향 인자를 국가별로 압축"
            summary="전체 변수군은 출처 화면에 모두 남기고, 개요에서는 가장 중요한 축만 요약합니다."
          />
          <div className="matrix-table">
            <div className="matrix-head">
              <span>영향 축</span>
              <span>EU ETS</span>
              <span>K-ETS</span>
              <span>China ETS</span>
            </div>
            {props.driverMatrix.map((row) => (
              <div key={row.family.id} className="matrix-row">
                <div className="matrix-family">
                  <strong>{row.family.label}</strong>
                  <span>{row.family.summary}</span>
                </div>
                {(["eu-ets", "k-ets", "cn-ets"] as const).map((marketId) => {
                  const driver = row.byMarket[marketId];
                  return (
                    <div key={marketId} className="matrix-cell">
                      <strong>{driver?.variable ?? "해당 없음"}</strong>
                      <span>{driver?.importance ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Catalyst Windows"
            title="가격을 움직이는 운영 캘린더"
            summary="정확한 날짜보다 실제로 언제 무엇을 체크해야 하는지에 집중했습니다."
          />
          <div className="timeline-list">
            {catalystWindows
              .filter(
                (item) => item.marketId === "shared" || item.marketId === props.focusMarket
              )
              .map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-label">{item.windowLabel}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.trigger}</p>
                    <span>{item.whyItMatters}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Briefing Feed"
            title="오늘의 브리프"
            summary="Carbon Pulse식 피드와 토스식 짧은 문장을 섞어 빠르게 읽히게 만들었습니다."
          />
          <div className="feed-list">
            {props.feedItems.map((item) => (
              <article key={item.id} className={`feed-item ${item.tone}`}>
                <div className="feed-kicker">{item.kicker}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {item.link ? <LinkButton label="출처 열기" url={item.link} subtle /> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Market Watch"
            title={props.watchlistPreset.title}
            summary={props.watchlistPreset.summary}
          />
          <div className="watch-list">
            {props.watchItems.map((item) => (
              <div key={item.id} className="watch-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.role}</p>
                </div>
                <div className="watch-row-meta">
                  <span>{item.category}</span>
                  <LinkButton label="열기" url={item.url} subtle />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkspaceSurface(props: {
  activeWorkspace: WorkspacePreset;
  watchlistPreset: WatchlistPreset;
  watchView: WatchViewPreset;
  watchItems: MarketWatchItem[];
  benchmarks: BenchmarkPlatform[];
  onWatchViewChange: (id: string) => void;
}) {
  return (
    <div className="surface-stack">
      <section className="hero-panel compact">
        <SectionHeader
          eyebrow="Workspace"
          title={props.activeWorkspace.title}
          summary={props.activeWorkspace.summary}
        />
        <div className="module-ribbon">
          {props.activeWorkspace.moduleLabels.map((label) => (
            <span key={label} className="module-chip">
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Watch View"
          title={`${props.watchlistPreset.title} · ${props.watchView.title}`}
          summary={props.watchView.summary}
          action={
            <div className="inline-tabs">
              {watchViewPresets.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={view.id === props.watchView.id ? "mini-tab active" : "mini-tab"}
                  onClick={() => props.onWatchViewChange(view.id)}
                >
                  {view.title}
                </button>
              ))}
            </div>
          }
        />
        <div className="watch-table">
          <div className="watch-table-head">
            {props.watchView.columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {props.watchItems.map((item) => (
            <div key={item.id} className="watch-table-row">
              {props.watchView.columns.map((column) => {
                if (column === "상품") {
                  return <strong key={column}>{item.title}</strong>;
                }
                if (column === "역할") {
                  return <span key={column}>{item.role}</span>;
                }
                if (column === "카테고리") {
                  return <span key={column}>{item.category}</span>;
                }
                if (column === "메모") {
                  return <span key={column}>{item.note}</span>;
                }
                if (column === "링크") {
                  return (
                    <span key={column}>
                      <LinkButton label="열기" url={item.url} subtle />
                    </span>
                  );
                }
                return <span key={column}>—</span>;
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Borrowed From"
            title="성공한 플랫폼에서 차용한 기능"
            summary="단순한 레퍼런스 나열이 아니라 현재 화면에서 무엇으로 구현됐는지까지 연결했습니다."
          />
          <div className="benchmark-list">
            {props.benchmarks.map((platform) => (
              <article key={platform.id} className="benchmark-item">
                <div className="benchmark-top">
                  <div>
                    <strong>{platform.name}</strong>
                    <span>{platform.category}</span>
                  </div>
                  <LinkButton label="공식 페이지" url={platform.source.url} subtle />
                </div>
                <p>{platform.differentiator}</p>
                <div className="inline-tags">
                  {(platform.implementedAs ?? platform.featuresToBorrow).map((feature) => (
                    <span key={feature} className="soft-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Subscription Layer"
            title="거래를 빼고 남기는 구독 가치"
            summary="이 제품의 수익화는 주문이 아니라 정보 신뢰, 저장형 작업면, 리포트, 알림에 둡니다."
          />
          <div className="subscription-list">
            {subscriptionFeatures.map((feature) => (
              <div key={feature.id} className="subscription-item">
                <strong>{feature.title}</strong>
                <p>{feature.description}</p>
                <span>{feature.audience}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AlertsSurface(props: {
  activeTemplateIds: string[];
  inboxItems: AlertInboxItem[];
  dailyBrief: string;
  onToggleTemplate: (id: string) => void;
  onSaveBrief: () => void;
  canSaveBrief: boolean;
}) {
  return (
    <div className="surface-stack">
      <section className="hero-panel compact">
        <SectionHeader
          eyebrow="Alerts Hub"
          title="알림은 많게가 아니라 설명 가능하게"
          summary="경고를 뿌리는 대신, 공식 소스 이상과 가격 해석에 진짜 필요한 항목만 인박스로 모읍니다."
          action={
            <button
              type="button"
              className="primary-button"
              onClick={props.onSaveBrief}
              disabled={!props.canSaveBrief}
            >
              오늘의 브리프 저장
            </button>
          }
        />
        <div className="stats-strip">
          <div>
            <span>활성 템플릿</span>
            <strong>{props.activeTemplateIds.length}</strong>
          </div>
          <div>
            <span>현재 인박스</span>
            <strong>{props.inboxItems.length}</strong>
          </div>
          <div>
            <span>브리프 포맷</span>
            <strong>TXT</strong>
          </div>
        </div>
      </section>

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Templates"
            title="알림 템플릿"
            summary="TradingView식 알림 개념을 탄소시장용으로 다시 정의했습니다."
          />
          <div className="template-list">
            {alertTemplates.map((template) => (
              <div key={template.id} className="template-item">
                <div className="template-copy">
                  <div className="template-top">
                    <strong>{template.title}</strong>
                    <span className={`severity-pill ${template.severity.toLowerCase()}`}>
                      {template.severity}
                    </span>
                  </div>
                  <p>{template.trigger}</p>
                  <span>
                    {template.scope} · {template.delivery}
                  </span>
                </div>
                <button
                  type="button"
                  className={
                    props.activeTemplateIds.includes(template.id)
                      ? "toggle-button active"
                      : "toggle-button"
                  }
                  onClick={() => props.onToggleTemplate(template.id)}
                >
                  {props.activeTemplateIds.includes(template.id) ? "켜짐" : "꺼짐"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Inbox"
            title="지금 확인할 것"
            summary="정확성보다 과장을 우선하는 푸시 알림을 피하고, 운영적으로 유의미한 항목만 남겼습니다."
          />
          <div className="alert-list">
            {props.inboxItems.length === 0 ? (
              <div className="empty-state">현재 조건에서 띄울 알림이 없습니다.</div>
            ) : (
              props.inboxItems.map((item) => (
                <article key={item.id} className={`alert-item ${item.severity.toLowerCase()}`}>
                  <div className="alert-top">
                    <strong>{item.title}</strong>
                    <span>{item.severity}</span>
                  </div>
                  <p>{item.body}</p>
                  <small>{item.hint}</small>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <SectionHeader
          eyebrow="Daily Brief"
          title="바로 저장 가능한 구독형 브리프"
          summary="패키지된 앱에서는 텍스트 브리프를 바로 저장할 수 있습니다."
        />
        <pre className="brief-preview">{props.dailyBrief}</pre>
      </section>
    </div>
  );
}

function ScenarioPanel(props: {
  focusProfile: MarketProfile;
  factorState: Record<string, number>;
  forecast: ReturnType<typeof buildForecast>;
  onFactorChange: (driverId: string, value: number) => void;
  onReset: () => void;
}) {
  return (
    <section className="panel">
      <SectionHeader
        eyebrow="Scenario Lab"
        title={`${props.focusProfile.name} 시나리오 오버레이`}
        summary="각 가격 결정 변수를 -2에서 +2까지 조정해 참고용 방향성을 확인합니다."
        action={
          <button type="button" className="secondary-button" onClick={props.onReset}>
            초기화
          </button>
        }
      />
      <div className="scenario-hero">
        <div>
          <span>방향</span>
          <strong>{props.forecast.direction}</strong>
        </div>
        <div>
          <span>점수</span>
          <strong>{props.forecast.score.toFixed(2)}</strong>
        </div>
        <div>
          <span>신뢰도</span>
          <strong>{Math.round(props.forecast.confidence * 100)}%</strong>
        </div>
      </div>

      <div className="driver-groups">
        {driverFamilies.map((family) => {
          const drivers = props.focusProfile.drivers.filter((driver) =>
            family.matcher(driver.category)
          );

          if (drivers.length === 0) {
            return null;
          }

          return (
            <div key={family.id} className="driver-group">
              <h3>{family.label}</h3>
              <p>{family.summary}</p>
              <div className="driver-list">
                {drivers.map((driver) => (
                  <label key={driver.id} className="driver-item">
                    <div className="driver-copy">
                      <strong>{driver.variable}</strong>
                      <span>{driver.note}</span>
                    </div>
                    <div className="driver-control">
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.25}
                        value={props.factorState[driver.id] ?? 0}
                        onChange={(event) =>
                          props.onFactorChange(driver.id, Number(event.target.value))
                        }
                      />
                      <span>{(props.factorState[driver.id] ?? 0).toFixed(2)}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="contribution-list">
        {props.forecast.contributions.slice(0, 5).map((item) => (
          <div key={item.driverId} className="contribution-item">
            <strong>{item.variable}</strong>
            <span>{item.contribution.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModelPanel(props: {
  focusMarket: MarketProfile["id"];
  inputPath: string;
  trainWindow: number;
  horizon: number;
  result: WalkForwardResult | null;
  error: string | null;
  running: boolean;
  onPickFile: () => void;
  onTrainWindowChange: (value: number) => void;
  onHorizonChange: (value: number) => void;
  onRun: () => void;
}) {
  return (
    <section className="panel">
      <SectionHeader
        eyebrow="Walk-forward"
        title="워크포워드 예측 모델"
        summary="패키지된 앱에서 CSV를 선택하면 Python 워크포워드 모델을 실행합니다."
      />
      <div className="tool-row">
        <button type="button" className="secondary-button" onClick={props.onPickFile}>
          CSV 선택
        </button>
        <div className="path-chip">{props.inputPath || "선택된 파일 없음"}</div>
      </div>
      <div className="form-grid">
        <label>
          <span>시장</span>
          <input type="text" value={marketNameMap[props.focusMarket]} readOnly />
        </label>
        <label>
          <span>학습 윈도우</span>
          <input
            type="number"
            min={30}
            step={10}
            value={props.trainWindow}
            onChange={(event) => props.onTrainWindowChange(Number(event.target.value))}
          />
        </label>
        <label>
          <span>예측 구간</span>
          <input
            type="number"
            min={1}
            max={30}
            value={props.horizon}
            onChange={(event) => props.onHorizonChange(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="tool-row">
        <button type="button" className="primary-button" onClick={props.onRun} disabled={props.running}>
          {props.running ? "실행 중..." : "워크포워드 실행"}
        </button>
      </div>
      {props.error ? <p className="warning-copy">{props.error}</p> : null}
      {props.result ? (
        <div className="result-stack">
          <div className="stats-strip">
            <div>
              <span>MAE</span>
              <strong>{props.result.summary.mae.toFixed(3)}</strong>
            </div>
            <div>
              <span>RMSE</span>
              <strong>{props.result.summary.rmse.toFixed(3)}</strong>
            </div>
            <div>
              <span>방향 정확도</span>
              <strong>{props.result.summary.directionalAccuracyPct.toFixed(1)}%</strong>
            </div>
            <div>
              <span>다음 예측</span>
              <strong>{props.result.summary.nextPrediction.toFixed(2)}</strong>
            </div>
          </div>
          <div className="feature-list">
            {props.result.topFeatures.slice(0, 8).map((feature) => (
              <div key={feature.feature} className="feature-item">
                <strong>{feature.feature}</strong>
                <span>{feature.importance.toFixed(3)}</span>
              </div>
            ))}
          </div>
          {props.result.warnings.length > 0 ? (
            <div className="warning-list">
              {props.result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function BacktestPanel(props: {
  csvPath: string;
  strategy: BacktestStrategy;
  feeBps: number;
  result: BacktestRun | null;
  error: string | null;
  onPickFile: () => void;
  onStrategyChange: (value: BacktestStrategy) => void;
  onFeeChange: (value: number) => void;
  onRun: () => void;
}) {
  return (
    <section className="panel">
      <SectionHeader
        eyebrow="Backtest"
        title="로컬 CSV 백테스트"
        summary="트렌드, 평균회귀, 스프레드, 정책 모멘텀 전략을 간단히 검증합니다."
      />
      <div className="tool-row">
        <button type="button" className="secondary-button" onClick={props.onPickFile}>
          CSV 불러오기
        </button>
        <div className="path-chip">{props.csvPath || "선택된 파일 없음"}</div>
      </div>
      <div className="form-grid">
        <label>
          <span>전략</span>
          <select
            value={props.strategy}
            onChange={(event) =>
              props.onStrategyChange(event.target.value as BacktestStrategy)
            }
          >
            {Object.entries(strategyLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>비용(bps)</span>
          <input
            type="number"
            min={0}
            value={props.feeBps}
            onChange={(event) => props.onFeeChange(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="tool-row">
        <button type="button" className="primary-button" onClick={props.onRun}>
          백테스트 실행
        </button>
      </div>
      {props.error ? <p className="warning-copy">{props.error}</p> : null}
      {props.result ? (
        <div className="stats-grid">
          <div>
            <span>총수익률</span>
            <strong>{props.result.metrics.totalReturnPct.toFixed(2)}%</strong>
          </div>
          <div>
            <span>연환산 수익률</span>
            <strong>{props.result.metrics.annualizedReturnPct.toFixed(2)}%</strong>
          </div>
          <div>
            <span>연환산 변동성</span>
            <strong>{props.result.metrics.annualizedVolPct.toFixed(2)}%</strong>
          </div>
          <div>
            <span>Sharpe</span>
            <strong>{props.result.metrics.sharpe.toFixed(2)}</strong>
          </div>
          <div>
            <span>MDD</span>
            <strong>{props.result.metrics.maxDrawdownPct.toFixed(2)}%</strong>
          </div>
          <div>
            <span>승률</span>
            <strong>{props.result.metrics.winRatePct.toFixed(2)}%</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LabSurface(props: {
  focusProfile: MarketProfile;
  labMode: LabMode;
  onLabModeChange: (mode: LabMode) => void;
  factorState: Record<string, number>;
  forecast: ReturnType<typeof buildForecast>;
  onFactorChange: (driverId: string, value: number) => void;
  onResetScenario: () => void;
  modelInputPath: string;
  trainWindow: number;
  horizon: number;
  modelResult: WalkForwardResult | null;
  modelError: string | null;
  isRunningModel: boolean;
  onPickModelFile: () => void;
  onTrainWindowChange: (value: number) => void;
  onHorizonChange: (value: number) => void;
  onRunModel: () => void;
  csvPath: string;
  strategy: BacktestStrategy;
  feeBps: number;
  backtestResult: BacktestRun | null;
  backtestError: string | null;
  onPickBacktestFile: () => void;
  onStrategyChange: (value: BacktestStrategy) => void;
  onFeeChange: (value: number) => void;
  onRunBacktest: () => void;
  onSaveTemplate: () => void;
  canSaveTemplate: boolean;
}) {
  const datasetSchema = marketDatasetSchemas.find(
    (schema) => schema.marketId === props.focusProfile.id
  )!;

  return (
    <div className="surface-stack">
      <section className="hero-panel compact">
        <SectionHeader
          eyebrow="Research Lab"
          title={`${props.focusProfile.name} 연구실`}
          summary="모델은 참고용이며, 실거래용 가격 목표를 보장하지 않습니다."
          action={
            <div className="inline-tabs">
              {(["scenario", "model", "backtest"] as LabMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={mode === props.labMode ? "mini-tab active" : "mini-tab"}
                  onClick={() => props.onLabModeChange(mode)}
                >
                  {labModeLabels[mode]}
                </button>
              ))}
            </div>
          }
        />
      </section>

      {props.labMode === "scenario" ? (
        <ScenarioPanel
          focusProfile={props.focusProfile}
          factorState={props.factorState}
          forecast={props.forecast}
          onFactorChange={props.onFactorChange}
          onReset={props.onResetScenario}
        />
      ) : null}

      {props.labMode === "model" ? (
        <ModelPanel
          focusMarket={props.focusProfile.id}
          inputPath={props.modelInputPath}
          trainWindow={props.trainWindow}
          horizon={props.horizon}
          result={props.modelResult}
          error={props.modelError}
          running={props.isRunningModel}
          onPickFile={props.onPickModelFile}
          onTrainWindowChange={props.onTrainWindowChange}
          onHorizonChange={props.onHorizonChange}
          onRun={props.onRunModel}
        />
      ) : null}

      {props.labMode === "backtest" ? (
        <BacktestPanel
          csvPath={props.csvPath}
          strategy={props.strategy}
          feeBps={props.feeBps}
          result={props.backtestResult}
          error={props.backtestError}
          onPickFile={props.onPickBacktestFile}
          onStrategyChange={props.onStrategyChange}
          onFeeChange={props.onFeeChange}
          onRun={props.onRunBacktest}
        />
      ) : null}

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Data Readiness"
            title={datasetSchema.name}
            summary={datasetSchema.description}
            action={
              <button
                type="button"
                className="secondary-button"
                onClick={props.onSaveTemplate}
                disabled={!props.canSaveTemplate}
              >
                템플릿 저장
              </button>
            }
          />
          <div className="schema-list">
            {datasetSchema.columns.map((column) => (
              <div key={column.name} className="schema-item">
                <strong>{column.name}</strong>
                <span>{column.required ? "Required" : "Optional"}</span>
                <p>{column.description}</p>
                <small>{column.sourceHint}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Quant Playbook"
            title="참고할 퀀트 지표"
            summary="가격 예측보다 실행 타이밍과 리스크 관리에 더 가까운 지표를 우선 배치했습니다."
          />
          <div className="indicator-list">
            {quantIndicators.map((indicator) => (
              <article key={indicator.id} className="indicator-item">
                <strong>{indicator.name}</strong>
                <span>{indicator.family}</span>
                <p>{indicator.whyItMatters}</p>
                <small>필요 컬럼: {indicator.requiredColumns.join(", ")}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SourcesSurface(props: { focusMarket: MarketProfile["id"] }) {
  const focusSources = sourceRegistry.filter(
    (item) => item.markets.includes("shared") || item.markets.includes(props.focusMarket)
  );

  return (
    <div className="surface-stack">
      <section className="panel">
        <SectionHeader
          eyebrow="Trust Center"
          title="공식 출처와 제품 경계를 먼저 공개"
          summary="정확한 사실만 기반으로 보여주기 위해, 공식 웹·문서·API·상업 API를 구분합니다."
        />
        <div className="trust-grid">
          {trustPrinciples.map((principle) => (
            <article key={principle.id} className="trust-item">
              <strong>{principle.title}</strong>
              <p>{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Source Registry"
          title={`${marketNameMap[props.focusMarket]} 중심 출처 레지스트리`}
          summary="앱 안에서 보는 숫자가 어디에서 왔는지, 어떤 방식으로 연결되는지 보여줍니다."
        />
        <div className="registry-list">
          {focusSources.map((item) => (
            <article key={item.id} className="registry-item">
              <div className="registry-top">
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.category} · {item.method}
                  </span>
                </div>
                <LinkButton label="열기" url={item.url} subtle />
              </div>
              <p>{item.appUse}</p>
              <small>{item.whyItMatters}</small>
            </article>
          ))}
        </div>
      </section>

      <div className="surface-grid two-up">
        <section className="panel">
          <SectionHeader
            eyebrow="Driver Atlas"
            title="가격 결정 변수 전체"
            summary="국가별로 확인된 변수군을 중요도와 설명과 함께 정리했습니다."
          />
          <div className="atlas-grid">
            {marketProfiles.map((profile) => (
              <div key={profile.id} className="atlas-column">
                <h3>{profile.name}</h3>
                <p>{profile.sourceNote}</p>
                {profile.drivers.map((driver) => (
                  <article key={driver.id} className="atlas-item">
                    <div className="atlas-top">
                      <strong>{driver.variable}</strong>
                      <span>{driver.importance}</span>
                    </div>
                    <p>{driver.note}</p>
                    <small>{driver.category}</small>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionHeader
            eyebrow="Benchmark Stack"
            title="이번 개편의 벤치마크 기준"
            summary="성공한 제품에서 무엇을 가져왔는지와 현재 구현 위치를 같이 보여줍니다."
          />
          <div className="benchmark-list">
            {benchmarkPlatforms.map((platform) => (
              <article key={platform.id} className="benchmark-item">
                <div className="benchmark-top">
                  <div>
                    <strong>{platform.name}</strong>
                    <span>{platform.category}</span>
                  </div>
                  <LinkButton label="공식 페이지" url={platform.source.url} subtle />
                </div>
                <p>{platform.strength}</p>
                <div className="inline-tags">
                  {(platform.implementedAs ?? platform.featuresToBorrow).map((feature) => (
                    <span key={feature} className="soft-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <SectionHeader
          eyebrow="Autonomous Plan"
          title="8시간 자율 개발 플랜"
          summary="하네스 엔지니어링, 기능 개편, 패키징, GitHub 반영까지 포함한 실행 계획입니다."
        />
        <div className="plan-list">
          {autonomousPlan.map((step) => (
            <article key={step.id} className="plan-item">
              <div className="plan-time">{step.timeBlock}</div>
              <div>
                <strong>{step.title}</strong>
                <p>{step.goal}</p>
                <div className="inline-tags">
                  {step.outputs.map((output) => (
                    <span key={output} className="soft-tag">
                      {output}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [surface, setSurface] = useState<Surface>(() =>
    readStoredChoice("cquant:surface", surfaceChoices, "overview")
  );
  const [focusMarket, setFocusMarket] = useState<MarketProfile["id"]>(() =>
    readStoredChoice("cquant:market", ["eu-ets", "k-ets", "cn-ets"], "eu-ets")
  );
  const [workspaceId, setWorkspaceId] = useState(() =>
    readStoredChoice("cquant:workspace", workspaceChoices, workspacePresets[0].id)
  );
  const [watchlistId, setWatchlistId] = useState(() =>
    readStoredChoice("cquant:watchlist", watchlistChoices, watchlistPresets[0].id)
  );
  const [watchViewId, setWatchViewId] = useState(() =>
    readStoredChoice("cquant:watchview", watchViewChoices, watchViewPresets[0].id)
  );
  const [enabledAlertIds, setEnabledAlertIds] = useState<string[]>(() =>
    readStoredList(
      "cquant:alerts",
      alertTemplates.filter((template) => template.enabledByDefault).map((template) => template.id)
    )
  );
  const [sourcePayload, setSourcePayload] = useState<ConnectedSourcePayload>(emptySources);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [factorState, setFactorState] = useState<Record<string, number>>(() =>
    buildInitialFactorState(focusMarket)
  );
  const [labMode, setLabMode] = useState<LabMode>("scenario");
  const [modelInputPath, setModelInputPath] = useState("");
  const [trainWindow, setTrainWindow] = useState(180);
  const [horizon, setHorizon] = useState(5);
  const [modelResult, setModelResult] = useState<WalkForwardResult | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isRunningModel, setIsRunningModel] = useState(false);
  const [csvPath, setCsvPath] = useState("");
  const [series, setSeries] = useState<ParsedSeriesPoint[]>([]);
  const [strategy, setStrategy] = useState<BacktestStrategy>("trend");
  const [feeBps, setFeeBps] = useState(3);
  const [backtestResult, setBacktestResult] = useState<BacktestRun | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const activeWorkspace =
    workspacePresets.find((workspace) => workspace.id === workspaceId) ?? workspacePresets[0];
  const watchlistPreset =
    watchlistPresets.find((watchlist) => watchlist.id === watchlistId) ?? watchlistPresets[0];
  const watchView =
    watchViewPresets.find((view) => view.id === watchViewId) ?? watchViewPresets[0];
  const focusProfile =
    marketProfiles.find((market) => market.id === focusMarket) ?? marketProfiles[0];

  const benchmarkMap = useMemo(
    () => Object.fromEntries(benchmarkPlatforms.map((item) => [item.id, item])),
    []
  );
  const driverMatrix = useMemo(() => buildDriverMatrix(), []);
  const activeWorkspaceBenchmarks = activeWorkspace.benchmarkIds
    .map((id) => benchmarkMap[id])
    .filter(Boolean);
  const forecast = buildForecast(focusMarket, factorState);
  const feedItems = buildFeedItems(sourcePayload, focusMarket, forecast);
  const watchItems = watchlistPreset.itemIds
    .map((id) => marketWatchItems.find((item) => item.id === id))
    .filter((item): item is MarketWatchItem => Boolean(item));
  const inboxItems = buildAlertInbox(sourcePayload, enabledAlertIds, forecast, watchlistPreset);
  const dailyBrief = buildDailyBrief({
    focusMarket,
    payload: sourcePayload,
    forecast,
    alertItems: inboxItems
  });

  useEffect(() => {
    window.localStorage.setItem("cquant:surface", surface);
  }, [surface]);

  useEffect(() => {
    window.localStorage.setItem("cquant:market", focusMarket);
  }, [focusMarket]);

  useEffect(() => {
    window.localStorage.setItem("cquant:workspace", workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    window.localStorage.setItem("cquant:watchlist", watchlistId);
  }, [watchlistId]);

  useEffect(() => {
    window.localStorage.setItem("cquant:watchview", watchViewId);
  }, [watchViewId]);

  useEffect(() => {
    window.localStorage.setItem("cquant:alerts", JSON.stringify(enabledAlertIds));
  }, [enabledAlertIds]);

  useEffect(() => {
    setFactorState(buildInitialFactorState(focusMarket));
    setModelResult(null);
    setBacktestResult(null);
  }, [focusMarket]);

  async function refreshConnectedSources() {
    if (!window.desktopBridge?.refreshConnectedSources) {
      setSourcesError("공식 소스 새로고침은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.");
      return;
    }

    setRefreshing(true);
    setSourcesError(null);

    try {
      const payload = await window.desktopBridge.refreshConnectedSources();
      setSourcePayload(payload);
    } catch (error) {
      setSourcesError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshConnectedSources();
  }, []);

  function handleSurfaceChange(nextSurface: Surface) {
    startTransition(() => setSurface(nextSurface));
  }

  function handleMarketChange(nextMarket: MarketProfile["id"]) {
    startTransition(() => setFocusMarket(nextMarket));
  }

  function handleWorkspaceChange(nextId: string) {
    const nextWorkspace =
      workspacePresets.find((workspace) => workspace.id === nextId) ?? workspacePresets[0];
    startTransition(() => {
      setWorkspaceId(nextWorkspace.id);
      if (nextWorkspace.recommendedMarket !== "shared") {
        setFocusMarket(nextWorkspace.recommendedMarket);
      }
    });
  }

  function toggleAlertTemplate(id: string) {
    setEnabledAlertIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function updateFactor(driverId: string, value: number) {
    setFactorState((current) => ({ ...current, [driverId]: value }));
  }

  function resetScenario() {
    setFactorState(buildInitialFactorState(focusMarket));
  }

  async function pickModelFile() {
    const path = await window.desktopBridge?.pickCsvFile?.();
    if (path) {
      setModelInputPath(path);
      setModelError(null);
    }
  }

  async function runModel() {
    if (!window.desktopBridge?.runWalkForwardModel) {
      setModelError("워크포워드 실행은 패키지된 데스크톱 앱에서만 사용할 수 있습니다.");
      return;
    }
    if (!modelInputPath) {
      setModelError("먼저 CSV 파일을 선택해 주세요.");
      return;
    }

    setIsRunningModel(true);
    setModelError(null);

    try {
      const result = await window.desktopBridge.runWalkForwardModel({
        inputPath: modelInputPath,
        marketId: focusMarket,
        trainWindow,
        horizon
      });
      setModelResult(result);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunningModel(false);
    }
  }

  async function pickBacktestFile() {
    if (!window.desktopBridge?.pickCsvFile || !window.desktopBridge.readTextFile) {
      setBacktestError("CSV 불러오기는 패키지된 데스크톱 앱에서만 사용할 수 있습니다.");
      return;
    }

    const path = await window.desktopBridge.pickCsvFile();
    if (!path) {
      return;
    }

    try {
      const text = await window.desktopBridge.readTextFile(path);
      const parsed = parseCsv(text);
      setCsvPath(path);
      setSeries(parsed);
      setBacktestError(null);
      setBacktestResult(null);
    } catch (error) {
      setBacktestError(error instanceof Error ? error.message : String(error));
    }
  }

  function runBacktestLocally() {
    try {
      const result = runBacktest(series, strategy, feeBps);
      setBacktestResult(result);
      setBacktestError(null);
    } catch (error) {
      setBacktestError(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveDailyBrief() {
    if (!window.desktopBridge?.saveTextFile) {
      return;
    }
    await window.desktopBridge.saveTextFile({
      defaultPath: `c-quant-brief-${focusMarket}-${new Date().toISOString().slice(0, 10)}.txt`,
      content: dailyBrief
    });
  }

  async function saveTemplate() {
    if (!window.desktopBridge?.saveTextFile) {
      return;
    }
    const schema = marketDatasetSchemas.find((item) => item.marketId === focusMarket);
    if (!schema) {
      return;
    }
    await window.desktopBridge.saveTextFile({
      defaultPath: schema.filename,
      content: datasetTemplates[schema.id]
    });
  }

  return (
    <div className="terminal-shell">
      <WindowChrome />
      <div className="terminal-frame">
        <LeftRail
          surface={surface}
          onSurfaceChange={handleSurfaceChange}
          focusMarket={focusMarket}
          onMarketChange={handleMarketChange}
          activeWorkspace={activeWorkspace}
          workspaceId={workspaceId}
          onWorkspaceChange={handleWorkspaceChange}
          watchlistId={watchlistId}
          onWatchlistChange={setWatchlistId}
        />

        <main className="workspace-frame">
          <header className="surface-header">
            <div>
              <div className="section-eyebrow">C-Quant</div>
              <h1>{surfaceTabs.find((item) => item.id === surface)?.title}</h1>
              <p>{surfaceTabs.find((item) => item.id === surface)?.summary}</p>
            </div>
            <div className="header-actions">
              <div className="header-chip">
                마지막 공식 갱신 {formatDateLabel(sourcePayload.fetchedAt)}
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => void refreshConnectedSources()}
                disabled={refreshing}
              >
                {refreshing ? "새로고침 중..." : "공식 소스 새로고침"}
              </button>
            </div>
          </header>

          <div className="scroll-body">
            {surface === "overview" ? (
              <OverviewSurface
                focusMarket={focusMarket}
                focusProfile={focusProfile}
                sourcePayload={sourcePayload}
                driverMatrix={driverMatrix}
                feedItems={feedItems}
                watchlistPreset={watchlistPreset}
                watchItems={watchItems}
                onMarketChange={handleMarketChange}
              />
            ) : null}

            {surface === "workspace" ? (
              <WorkspaceSurface
                activeWorkspace={activeWorkspace}
                watchlistPreset={watchlistPreset}
                watchView={watchView}
                watchItems={watchItems}
                benchmarks={activeWorkspaceBenchmarks}
                onWatchViewChange={setWatchViewId}
              />
            ) : null}

            {surface === "alerts" ? (
              <AlertsSurface
                activeTemplateIds={enabledAlertIds}
                inboxItems={inboxItems}
                dailyBrief={dailyBrief}
                onToggleTemplate={toggleAlertTemplate}
                onSaveBrief={() => void saveDailyBrief()}
                canSaveBrief={Boolean(window.desktopBridge?.saveTextFile)}
              />
            ) : null}

            {surface === "lab" ? (
              <LabSurface
                focusProfile={focusProfile}
                labMode={labMode}
                onLabModeChange={setLabMode}
                factorState={factorState}
                forecast={forecast}
                onFactorChange={updateFactor}
                onResetScenario={resetScenario}
                modelInputPath={modelInputPath}
                trainWindow={trainWindow}
                horizon={horizon}
                modelResult={modelResult}
                modelError={modelError}
                isRunningModel={isRunningModel}
                onPickModelFile={() => void pickModelFile()}
                onTrainWindowChange={setTrainWindow}
                onHorizonChange={setHorizon}
                onRunModel={() => void runModel()}
                csvPath={csvPath}
                strategy={strategy}
                feeBps={feeBps}
                backtestResult={backtestResult}
                backtestError={backtestError}
                onPickBacktestFile={() => void pickBacktestFile()}
                onStrategyChange={setStrategy}
                onFeeChange={setFeeBps}
                onRunBacktest={runBacktestLocally}
                onSaveTemplate={() => void saveTemplate()}
                canSaveTemplate={Boolean(window.desktopBridge?.saveTextFile)}
              />
            ) : null}

            {surface === "sources" ? <SourcesSurface focusMarket={focusMarket} /> : null}
          </div>
        </main>

        <InspectorRail
          focusProfile={focusProfile}
          focusCard={sourcePayload.cards.find((card) => card.marketId === focusMarket)}
          alertCount={inboxItems.length}
          activeWorkspace={activeWorkspace}
          activeBenchmarks={activeWorkspaceBenchmarks}
          sourcesError={sourcesError}
        />
      </div>
    </div>
  );
}
