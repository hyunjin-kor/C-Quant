import type { CatalystCalibrationStatus, CatalystEvent } from "../types";

/**
 * Lightweight event-study primitives.
 *
 * Honest scope:
 * - Computes per-event abnormal returns over a configurable window using
 *   a simple mean-of-pre-window benchmark. Not a full Fama-French style
 *   abnormal-return calculation; intentionally simpler so the audit
 *   trail is short.
 * - Aggregates events into per-scenario empirical statistics that the
 *   calibration layer can use to upgrade a scenario's status from
 *   "heuristic" to "backtest".
 * - Operates on caller-supplied price series. It never fetches, so the
 *   provenance of the prices is the caller's responsibility.
 */

export type EventStudyPricePoint = { date: string; close: number };

export type EventStudyConfig = {
  /** Trading days before the event used to estimate the benchmark return. */
  preWindow: number;
  /** Trading days from the event to score the reaction (inclusive). */
  postWindow: number;
  /** Minimum observations required before a scenario is considered evaluable. */
  minObservations: number;
  /** Optional cap on the absolute |return| recorded per event (clamps outliers). */
  clampAbsReturn?: number;
};

export type EventStudyEventResult = {
  eventId: string;
  scenarioId: string;
  marketId: CatalystEvent["marketId"];
  observedAt: string;
  preMeanReturn: number;
  postCumulativeReturn: number;
  abnormalReturn: number;
  hit: boolean;
  expectedSign: 1 | -1 | 0;
};

export type EventStudyScenarioStat = {
  scenarioId: string;
  observations: number;
  meanAbsAbnormalReturn: number;
  hitRate: number | null;
  /**
   * Multiplier suggested for the catalyst scoring layer based on how
   * strong the average abnormal reaction is, calibrated to a 1% baseline.
   */
  suggestedMultiplier: number;
  status: CatalystCalibrationStatus;
};

function dailyReturns(series: EventStudyPricePoint[]): Array<{ date: string; ret: number }> {
  const sorted = [...series]
    .filter((p) => Number.isFinite(p.close) && p.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const out: Array<{ date: string; ret: number }> = [];
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    out.push({ date: current.date, ret: (current.close - previous.close) / previous.close });
  }
  return out;
}

function findIndexOnOrAfter(
  returns: Array<{ date: string; ret: number }>,
  isoDate: string
): number {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return -1;
  for (let i = 0; i < returns.length; i++) {
    const candidate = new Date(returns[i].date).getTime();
    if (!Number.isNaN(candidate) && candidate >= target) {
      return i;
    }
  }
  return -1;
}

function expectedSignFor(
  scenarioId: string,
  expectedDirectionByScenarioId: Record<string, "higher" | "lower" | "ambiguous">
): 1 | -1 | 0 {
  const expected = expectedDirectionByScenarioId[scenarioId];
  if (expected === "higher") return 1;
  if (expected === "lower") return -1;
  return 0;
}

export function evaluateEvent(
  event: CatalystEvent,
  series: EventStudyPricePoint[],
  config: EventStudyConfig,
  expectedDirectionByScenarioId: Record<string, "higher" | "lower" | "ambiguous">
): EventStudyEventResult | null {
  const returns = dailyReturns(series);
  if (returns.length === 0) return null;

  const idx = findIndexOnOrAfter(returns, event.observedAt);
  if (idx < 0) return null;

  const preStart = Math.max(0, idx - config.preWindow);
  const preSlice = returns.slice(preStart, idx);
  if (preSlice.length === 0) return null;

  const preMeanReturn = preSlice.reduce((sum, item) => sum + item.ret, 0) / preSlice.length;

  const postEnd = Math.min(returns.length, idx + config.postWindow);
  const postSlice = returns.slice(idx, postEnd);
  if (postSlice.length === 0) return null;

  const postCumulativeReturn = postSlice.reduce(
    (acc, item) => (1 + acc) * (1 + item.ret) - 1,
    0
  );

  let abnormalReturn = postCumulativeReturn - preMeanReturn * postSlice.length;
  if (typeof config.clampAbsReturn === "number" && Number.isFinite(config.clampAbsReturn)) {
    const cap = Math.abs(config.clampAbsReturn);
    if (abnormalReturn > cap) abnormalReturn = cap;
    if (abnormalReturn < -cap) abnormalReturn = -cap;
  }

  const expectedSign = expectedSignFor(event.scenarioId, expectedDirectionByScenarioId);
  const hit =
    expectedSign === 0
      ? Math.abs(abnormalReturn) > 0
      : (expectedSign > 0 && abnormalReturn > 0) || (expectedSign < 0 && abnormalReturn < 0);

  return {
    eventId: event.id,
    scenarioId: event.scenarioId,
    marketId: event.marketId,
    observedAt: event.observedAt,
    preMeanReturn,
    postCumulativeReturn,
    abnormalReturn,
    hit,
    expectedSign
  };
}

export function aggregateByScenario(
  results: EventStudyEventResult[],
  config: EventStudyConfig
): EventStudyScenarioStat[] {
  const buckets = new Map<string, EventStudyEventResult[]>();
  for (const result of results) {
    const list = buckets.get(result.scenarioId) ?? [];
    list.push(result);
    buckets.set(result.scenarioId, list);
  }

  const stats: EventStudyScenarioStat[] = [];
  for (const [scenarioId, items] of buckets) {
    const observations = items.length;
    const meanAbsAbnormalReturn =
      items.reduce((sum, item) => sum + Math.abs(item.abnormalReturn), 0) / Math.max(1, observations);
    const decisive = items.filter((item) => item.expectedSign !== 0);
    const hits = decisive.filter((item) => item.hit).length;
    const hitRate = decisive.length > 0 ? hits / decisive.length : null;
    // Multiplier scales linearly with observed reaction relative to a 1% baseline,
    // clamped to a defensible band.
    const baseline = 0.01;
    const raw = meanAbsAbnormalReturn / baseline;
    const suggestedMultiplier = Math.min(1.6, Math.max(0.6, raw));
    const status: CatalystCalibrationStatus =
      observations >= config.minObservations ? "backtest" : "heuristic";
    stats.push({
      scenarioId,
      observations,
      meanAbsAbnormalReturn,
      hitRate,
      suggestedMultiplier,
      status
    });
  }
  return stats;
}

export function runEventStudy(
  events: CatalystEvent[],
  priceSeriesByMarket: Record<string, EventStudyPricePoint[]>,
  config: EventStudyConfig,
  expectedDirectionByScenarioId: Record<string, "higher" | "lower" | "ambiguous">
): { results: EventStudyEventResult[]; stats: EventStudyScenarioStat[] } {
  const results: EventStudyEventResult[] = [];
  for (const event of events) {
    const series =
      priceSeriesByMarket[event.marketId] ?? priceSeriesByMarket["shared"] ?? [];
    if (!series.length) continue;
    const result = evaluateEvent(event, series, config, expectedDirectionByScenarioId);
    if (result) results.push(result);
  }
  const stats = aggregateByScenario(results, config);
  return { results, stats };
}
