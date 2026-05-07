/**
 * Catalyst trigger detector.
 *
 * Honest scope:
 * - Looks at the live `ConnectedSourcePayload` (official anchor cards +
 *   listed-proxy live quotes) and decides which catalyst-scenario
 *   components are currently observable.
 * - Does NOT make a price call. It returns a structured "this many
 *   components fired" summary so the UI can surface candidates and the
 *   alerts layer can prompt an operator.
 * - Pure: same input always produces the same output. The caller
 *   supplies `now` so unit tests are deterministic.
 *
 * Triggered components are recognised by signal type:
 *   - "freshness" — when an official card is older than thresholdHours
 *   - "price-jump" — when |percent change| over the supplied window
 *      exceeds the threshold
 *   - "volume-jump" — when the most recent volume bar is N× the
 *      trailing mean
 *   - "proxy-divergence" — when |gap| between official close and the
 *      market's primary listed proxy exceeds thresholdPct
 *
 * The mapping from a CatalystComponent.variable string to a signal
 * type is intentionally conservative; unmatched components are
 * reported as "untestable" rather than guessed.
 */

import type {
  CatalystComponent,
  CatalystScenario,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  MacroPayload,
  MacroSeriesPoint,
  MarketLiveQuote
} from "../types";

export type DetectionSignal =
  | "freshness"
  | "price-jump"
  | "volume-jump"
  | "proxy-divergence"
  | "fx-jump"
  | "untestable";

export type DetectorConfig = {
  freshnessHours: number;
  priceJumpPct: number;
  priceJumpWindow: number;
  volumeJumpRatio: number;
  proxyDivergencePct: number;
  /** Threshold for FX moves expressed as percent over fxJumpWindow days. */
  fxJumpPct: number;
  fxJumpWindow: number;
};

export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  freshnessHours: 24,
  priceJumpPct: 5,
  priceJumpWindow: 5,
  volumeJumpRatio: 2,
  proxyDivergencePct: 4,
  // FX is structurally less volatile than carbon spot — a 1.5% move
  // over 5 days is the "uncomfortable" band where regimes flip.
  fxJumpPct: 1.5,
  fxJumpWindow: 5
};

export type ComponentDetection = {
  component: CatalystComponent;
  signal: DetectionSignal;
  triggered: boolean;
  observed: number | null;
  threshold: number | null;
  note: string;
};

export type ScenarioDetection = {
  scenarioId: string;
  componentCount: number;
  triggeredCount: number;
  testableCount: number;
  triggerRatio: number;
  components: ComponentDetection[];
  /** True when at least half of the testable components are triggered. */
  active: boolean;
};

function classifyComponentSignal(component: CatalystComponent): DetectionSignal {
  const haystack = `${component.family} ${component.variable}`.toLowerCase();
  if (
    /freshness|stale|update|publish|publication|notice|bulletin|reporting/.test(haystack)
  ) {
    return "freshness";
  }
  if (/proxy|listed|ice eua front-month|krbn|ko2|co2\.l/.test(haystack)) {
    return "proxy-divergence";
  }
  if (/volume|coverage|bid-cover|liquidity|turnover|open interest/.test(haystack)) {
    return "volume-jump";
  }
  // FX components are evaluated against the macro EUR/USD series, NOT
  // against the per-market carbon price. This is a separate signal so
  // the threshold and the data source are both correct.
  if (/usd\/krw|usd\/eur|eur\/usd|usd strength|krw|fx|dxy/.test(haystack)) {
    return "fx-jump";
  }
  if (
    /ttf|gas|coal|lng|brent|crude|spread|spark|equity|stoxx|kospi|temperature|wind|hydro/.test(
      haystack
    )
  ) {
    return "price-jump";
  }
  if (/policy|cap|reserve|allocation|surrender|deadline|compliance/.test(haystack)) {
    return "freshness";
  }
  return "untestable";
}

function getCardForMarket(
  payload: ConnectedSourcePayload,
  marketId: string
): ConnectedSourceCard | null {
  if (marketId === "shared") {
    return payload.cards.find((card) => card.marketId === "eu-ets") ?? null;
  }
  return payload.cards.find((card) => card.marketId === marketId) ?? null;
}

function getProxyForMarket(
  payload: ConnectedSourcePayload,
  marketId: string
): MarketLiveQuote | null {
  if (!payload.liveQuotes?.length) return null;
  const filtered = payload.liveQuotes.filter(
    (quote) =>
      quote.markets.includes(marketId as MarketLiveQuote["markets"][number]) ||
      quote.markets.includes("shared")
  );
  return filtered[0] ?? null;
}

function ageHours(asOf: string | undefined, now: Date): number | null {
  if (!asOf) return null;
  const parsed = new Date(asOf);
  if (Number.isNaN(parsed.getTime())) return null;
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60);
}

function computePctChangeOverWindow(
  card: ConnectedSourceCard | null,
  windowDays: number
): number | null {
  if (!card?.series || card.series.length < windowDays + 1) return null;
  const sorted = [...card.series]
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < windowDays + 1) return null;
  const last = sorted[sorted.length - 1].value;
  const prior = sorted[sorted.length - 1 - windowDays].value;
  if (prior <= 0) return null;
  return ((last - prior) / prior) * 100;
}

function computeVolumeRatio(card: ConnectedSourceCard | null): number | null {
  const volumeSeries = card?.volumeSeries;
  if (!volumeSeries || volumeSeries.length < 6) return null;
  const sorted = [...volumeSeries]
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 6) return null;
  const recent = sorted[sorted.length - 1].value;
  const trailing = sorted.slice(-6, -1).map((p) => p.value);
  if (recent <= 0 || trailing.length === 0) return null;
  const mean = trailing.reduce((sum, v) => sum + v, 0) / trailing.length;
  if (mean <= 0) return null;
  return recent / mean;
}

function pickFxSeries(
  component: CatalystComponent,
  macroSeries: MacroPayload | undefined
): { series: MacroSeriesPoint[]; label: string } | null {
  if (!macroSeries) return null;
  const haystack = `${component.family} ${component.variable}`.toLowerCase();
  if (/usd\/krw|krw|won/.test(haystack)) {
    if (macroSeries.usdKrw && macroSeries.usdKrw.length > 0) {
      return { series: macroSeries.usdKrw, label: "USD/KRW" };
    }
  }
  if (/usd\/cny|cny|yuan|rmb|chinese/.test(haystack)) {
    if (macroSeries.usdCny && macroSeries.usdCny.length > 0) {
      return { series: macroSeries.usdCny, label: "USD/CNY" };
    }
  }
  if (macroSeries.eurUsd && macroSeries.eurUsd.length > 0) {
    return { series: macroSeries.eurUsd, label: "EUR/USD" };
  }
  return null;
}

function computeFxPctChange(
  series: MacroSeriesPoint[],
  windowDays: number
): number | null {
  if (!series || series.length < windowDays + 1) return null;
  const sorted = [...series]
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < windowDays + 1) return null;
  const last = sorted[sorted.length - 1].value;
  const prior = sorted[sorted.length - 1 - windowDays].value;
  if (prior <= 0) return null;
  return ((last - prior) / prior) * 100;
}

function computeProxyDivergence(
  card: ConnectedSourceCard | null,
  proxy: MarketLiveQuote | null
): number | null {
  if (!card || !proxy) return null;
  const officialPrice = parseFloat(
    (card.metrics?.find((metric) => /official|close|price|settlement/i.test(metric.label))
      ?.value ?? "")
      .toString()
      .replace(/[^0-9.-]/g, "")
  );
  if (!Number.isFinite(officialPrice) || officialPrice <= 0) return null;
  const proxyPrice = proxy.price;
  if (typeof proxyPrice !== "number" || !Number.isFinite(proxyPrice) || proxyPrice <= 0) {
    return null;
  }
  return ((proxyPrice - officialPrice) / officialPrice) * 100;
}

function evaluateComponent(
  component: CatalystComponent,
  marketId: CatalystScenario["marketIds"][number],
  payload: ConnectedSourcePayload,
  config: DetectorConfig,
  now: Date
): ComponentDetection {
  const signal = classifyComponentSignal(component);
  const card = getCardForMarket(payload, marketId);

  switch (signal) {
    case "freshness": {
      const hours = ageHours(card?.asOf, now);
      if (hours === null) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.freshnessHours,
          note: "No anchor timestamp available"
        };
      }
      return {
        component,
        signal,
        triggered: hours > config.freshnessHours,
        observed: Math.round(hours * 10) / 10,
        threshold: config.freshnessHours,
        note: `Card age ${hours.toFixed(1)}h vs threshold ${config.freshnessHours}h`
      };
    }
    case "price-jump": {
      const pct = computePctChangeOverWindow(card, config.priceJumpWindow);
      if (pct === null) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.priceJumpPct,
          note: `Need ${config.priceJumpWindow + 1} datapoints in series`
        };
      }
      return {
        component,
        signal,
        triggered: Math.abs(pct) >= config.priceJumpPct,
        observed: Math.round(pct * 10) / 10,
        threshold: config.priceJumpPct,
        note: `${pct.toFixed(1)}% over ${config.priceJumpWindow}d (component sign: ${component.sign})`
      };
    }
    case "volume-jump": {
      const ratio = computeVolumeRatio(card);
      if (ratio === null) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.volumeJumpRatio,
          note: "Need 6 volume bars in series"
        };
      }
      return {
        component,
        signal,
        triggered: ratio >= config.volumeJumpRatio,
        observed: Math.round(ratio * 100) / 100,
        threshold: config.volumeJumpRatio,
        note: `${ratio.toFixed(2)}x trailing 5-bar mean`
      };
    }
    case "fx-jump": {
      const picked = pickFxSeries(component, payload.macroSeries);
      if (!picked) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.fxJumpPct,
          note: "No macro FX series wired for this component yet"
        };
      }
      const pct = computeFxPctChange(picked.series, config.fxJumpWindow);
      if (pct === null) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.fxJumpPct,
          note: `Need ${config.fxJumpWindow + 1} ${picked.label} points in macro series`
        };
      }
      return {
        component,
        signal,
        triggered: Math.abs(pct) >= config.fxJumpPct,
        observed: Math.round(pct * 100) / 100,
        threshold: config.fxJumpPct,
        note: `${pct.toFixed(2)}% ${picked.label} over ${config.fxJumpWindow}d`
      };
    }
    case "proxy-divergence": {
      const proxy = getProxyForMarket(payload, marketId);
      const div = computeProxyDivergence(card, proxy);
      if (div === null) {
        return {
          component,
          signal,
          triggered: false,
          observed: null,
          threshold: config.proxyDivergencePct,
          note: "Need both an official price and a primary listed proxy"
        };
      }
      return {
        component,
        signal,
        triggered: Math.abs(div) >= config.proxyDivergencePct,
        observed: Math.round(div * 10) / 10,
        threshold: config.proxyDivergencePct,
        note: `${div.toFixed(1)}% proxy gap`
      };
    }
    default:
      return {
        component,
        signal: "untestable",
        triggered: false,
        observed: null,
        threshold: null,
        note: "Component is not auto-testable from live cards"
      };
  }
}

export function detectScenarioTriggers(
  scenario: CatalystScenario,
  payload: ConnectedSourcePayload,
  config: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
  now: Date = new Date()
): ScenarioDetection {
  // For shared scenarios, look at all member markets and pick the most
  // active one so the detector still surfaces a result.
  const candidateMarkets = scenario.marketIds.includes("shared")
    ? (["eu-ets", "k-ets", "cn-ets"] as const)
    : (scenario.marketIds as readonly CatalystScenario["marketIds"][number][]);

  let best: ScenarioDetection | null = null;
  for (const marketId of candidateMarkets) {
    const components = scenario.components.map((component) =>
      evaluateComponent(component, marketId, payload, config, now)
    );
    const testableCount = components.filter((c) => c.signal !== "untestable").length;
    const triggeredCount = components.filter((c) => c.triggered).length;
    const triggerRatio = testableCount > 0 ? triggeredCount / testableCount : 0;
    const detection: ScenarioDetection = {
      scenarioId: scenario.id,
      componentCount: components.length,
      triggeredCount,
      testableCount,
      triggerRatio,
      components,
      active: testableCount > 0 && triggerRatio >= 0.5
    };
    if (!best || detection.triggeredCount > best.triggeredCount) {
      best = detection;
    }
  }
  return (
    best ?? {
      scenarioId: scenario.id,
      componentCount: scenario.components.length,
      triggeredCount: 0,
      testableCount: 0,
      triggerRatio: 0,
      components: scenario.components.map((component) => ({
        component,
        signal: "untestable",
        triggered: false,
        observed: null,
        threshold: null,
        note: "No payload available"
      })),
      active: false
    }
  );
}

export function detectActivePatterns(
  scenarios: CatalystScenario[],
  payload: ConnectedSourcePayload,
  config: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
  now: Date = new Date()
): ScenarioDetection[] {
  return scenarios
    .map((scenario) => detectScenarioTriggers(scenario, payload, config, now))
    .filter((detection) => detection.testableCount > 0)
    .sort((a, b) => b.triggerRatio - a.triggerRatio);
}
