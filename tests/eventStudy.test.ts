import { describe, it, expect } from "vitest";
import {
  aggregateByScenario,
  evaluateEvent,
  runEventStudy,
  type EventStudyConfig,
  type EventStudyPricePoint
} from "../src/lib/eventStudy";
import type { CatalystEvent } from "../src/types";

const config: EventStudyConfig = {
  preWindow: 3,
  postWindow: 2,
  minObservations: 2,
  clampAbsReturn: 0.5
};

const expectedDirection = {
  "scenario-up": "higher" as const,
  "scenario-down": "lower" as const,
  "scenario-amb": "ambiguous" as const
};

function buildEvent(scenarioId: string, observedAt: string): CatalystEvent {
  return {
    id: `${scenarioId}-${observedAt}`,
    scenarioId,
    marketId: "eu-ets",
    observedAt,
    label: "test",
    brief: "test",
    confidence: "verified",
    references: [{ label: "test", url: "https://example.com", accessed: observedAt }]
  };
}

function buildSeries(): EventStudyPricePoint[] {
  return [
    { date: "2026-01-01", close: 100 },
    { date: "2026-02-01", close: 100 },
    { date: "2026-03-01", close: 100 },
    { date: "2026-04-01", close: 100 },
    { date: "2026-05-01", close: 110 }, // event date — bullish jump
    { date: "2026-06-01", close: 121 }
  ];
}

describe("evaluateEvent", () => {
  it("returns null when the event date precedes the available window", () => {
    const event = buildEvent("scenario-up", "2025-01-01");
    const series = buildSeries();
    const result = evaluateEvent(event, series, config, expectedDirection);
    // The event is found at idx 0 (oldest), pre-window slice is empty -> null.
    expect(result).toBeNull();
  });

  it("scores a bullish event as a hit when expected direction is higher", () => {
    const event = buildEvent("scenario-up", "2026-05-01");
    const series = buildSeries();
    const result = evaluateEvent(event, series, config, expectedDirection);
    expect(result).not.toBeNull();
    expect(result!.hit).toBe(true);
    expect(result!.abnormalReturn).toBeGreaterThan(0);
  });

  it("scores the same event as a miss when expected direction is lower", () => {
    const event = buildEvent("scenario-down", "2026-05-01");
    const series = buildSeries();
    const result = evaluateEvent(event, series, config, expectedDirection);
    expect(result).not.toBeNull();
    expect(result!.hit).toBe(false);
  });

  it("clamps abnormal return when configured", () => {
    const series: EventStudyPricePoint[] = [
      { date: "2026-01-01", close: 10 },
      { date: "2026-02-01", close: 10 },
      { date: "2026-03-01", close: 10 },
      { date: "2026-04-01", close: 10 },
      { date: "2026-05-01", close: 1000 } // absurd jump
    ];
    const event = buildEvent("scenario-up", "2026-05-01");
    const result = evaluateEvent(event, series, config, expectedDirection);
    expect(result).not.toBeNull();
    expect(Math.abs(result!.abnormalReturn)).toBeLessThanOrEqual(config.clampAbsReturn!);
  });
});

describe("aggregateByScenario", () => {
  it("computes hit rate and tags status as backtest when observations >= min", () => {
    const series = buildSeries();
    const events = [
      buildEvent("scenario-up", "2026-05-01"),
      buildEvent("scenario-up", "2026-05-01")
    ];
    const results = events
      .map((event) => evaluateEvent(event, series, config, expectedDirection))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    const stats = aggregateByScenario(results, config);
    expect(stats).toHaveLength(1);
    expect(stats[0].observations).toBe(2);
    expect(stats[0].hitRate).toBe(1);
    expect(stats[0].status).toBe("backtest");
  });

  it("stays heuristic when observations < min", () => {
    const series = buildSeries();
    const events = [buildEvent("scenario-up", "2026-05-01")];
    const results = events
      .map((event) => evaluateEvent(event, series, config, expectedDirection))
      .filter((r): r is NonNullable<typeof r> => r !== null);
    const stats = aggregateByScenario(results, config);
    expect(stats[0].status).toBe("heuristic");
  });
});

describe("runEventStudy", () => {
  it("composes events + market series + config into a stat table", () => {
    const events = [
      buildEvent("scenario-up", "2026-05-01"),
      buildEvent("scenario-up", "2026-05-01")
    ];
    const { stats, results } = runEventStudy(
      events,
      { "eu-ets": buildSeries() },
      config,
      expectedDirection
    );
    expect(results.length).toBeGreaterThan(0);
    expect(stats.length).toBeGreaterThan(0);
  });
});
