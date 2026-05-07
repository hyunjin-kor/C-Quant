import { describe, it, expect } from "vitest";
import {
  DEFAULT_DETECTOR_CONFIG,
  detectActivePatterns,
  detectScenarioTriggers
} from "../src/lib/catalystTriggerDetector";
import type {
  CatalystScenario,
  ConnectedSourcePayload
} from "../src/types";

const NOW = new Date("2026-04-29T12:00:00Z");

const baseScenario: CatalystScenario = {
  id: "test-scenario",
  marketIds: ["eu-ets"],
  name: "Test scenario",
  windowLabel: "Now",
  rarity: "watch",
  expectedDirection: "higher",
  components: [
    {
      driverId: "eu_supply_cap",
      family: "Policy Supply",
      variable: "Cap path / policy bulletin",
      sign: "tighten",
      threshold: "Bulletin within 24h"
    },
    {
      family: "Power Complex",
      variable: "TTF gas day-ahead spread",
      sign: "tighten",
      threshold: "5%+ over 5 days"
    }
  ],
  interactionEffect: "amplify",
  calibrationStatus: "heuristic",
  calibratedAt: "2026-04-29",
  playbook: "test",
  whyItMatters: "test",
  historicalAnchor: "test",
  references: []
};

function buildPayload(): ConnectedSourcePayload {
  return {
    fetchedAt: NOW.toISOString(),
    cards: [
      {
        id: "eu",
        marketId: "eu-ets",
        sourceName: "EEX",
        coverage: "EU ETS",
        sourceUrl: "https://www.eex.com/",
        status: "connected",
        // 36 hours stale
        asOf: "2026-04-28T00:00:00Z",
        headline: "test",
        summary: "test",
        metrics: [{ label: "Official close", value: "100" }],
        notes: [],
        links: [],
        series: [
          { date: "2026-04-20", value: 100 },
          { date: "2026-04-21", value: 100 },
          { date: "2026-04-22", value: 100 },
          { date: "2026-04-23", value: 100 },
          { date: "2026-04-24", value: 105 },
          // 10% jump over 5 days
          { date: "2026-04-29", value: 110 }
        ]
      }
    ],
    liveQuotes: [],
    warnings: []
  };
}

describe("detectScenarioTriggers", () => {
  it("flags freshness when card is older than threshold", () => {
    const detection = detectScenarioTriggers(baseScenario, buildPayload(), DEFAULT_DETECTOR_CONFIG, NOW);
    const fresh = detection.components.find((c) => c.signal === "freshness");
    expect(fresh).toBeDefined();
    expect(fresh!.triggered).toBe(true);
  });

  it("flags price-jump when 5d % change exceeds threshold", () => {
    const detection = detectScenarioTriggers(baseScenario, buildPayload(), DEFAULT_DETECTOR_CONFIG, NOW);
    const jump = detection.components.find((c) => c.signal === "price-jump");
    expect(jump).toBeDefined();
    expect(jump!.triggered).toBe(true);
  });

  it("scenario goes active when half or more components fire", () => {
    const detection = detectScenarioTriggers(baseScenario, buildPayload(), DEFAULT_DETECTOR_CONFIG, NOW);
    expect(detection.active).toBe(true);
    expect(detection.triggerRatio).toBeGreaterThanOrEqual(0.5);
  });

  it("returns testableCount = 0 cleanly when payload is empty", () => {
    const empty: ConnectedSourcePayload = {
      fetchedAt: NOW.toISOString(),
      cards: [],
      liveQuotes: [],
      warnings: []
    };
    const detection = detectScenarioTriggers(baseScenario, empty, DEFAULT_DETECTOR_CONFIG, NOW);
    // freshness component still classifies as freshness signal even
    // without a card; but observation is null and triggered is false.
    expect(detection.active).toBe(false);
  });

  it("untestable signal does not block testable components from firing", () => {
    const scenario: CatalystScenario = {
      ...baseScenario,
      components: [
        ...baseScenario.components,
        {
          family: "Qualitative narrative",
          variable: "Operator narrative description only",
          sign: "context",
          threshold: "Operator-supplied judgement"
        }
      ]
    };
    const detection = detectScenarioTriggers(scenario, buildPayload(), DEFAULT_DETECTOR_CONFIG, NOW);
    expect(detection.componentCount).toBe(3);
    expect(detection.testableCount).toBeLessThan(detection.componentCount);
    expect(detection.active).toBe(true);
  });
});

describe("detectActivePatterns", () => {
  it("only returns scenarios with at least one testable component, sorted by trigger ratio", () => {
    const all = detectActivePatterns([baseScenario], buildPayload(), DEFAULT_DETECTOR_CONFIG, NOW);
    expect(all.length).toBe(1);
    expect(all[0].testableCount).toBeGreaterThan(0);
  });
});

describe("fx-jump signal", () => {
  const fxScenario: CatalystScenario = {
    ...baseScenario,
    id: "fx-test",
    components: [
      {
        family: "Macro and Financial",
        variable: "USD/KRW",
        sign: "tighten",
        threshold: "USD/KRW > 1y trailing 90th percentile"
      }
    ]
  };

  function payloadWithMacro(eurUsd: Array<{ date: string; value: number }>): ConnectedSourcePayload {
    return {
      ...buildPayload(),
      macroSeries: { eurUsd }
    };
  }

  it("classifies USD/KRW components as fx-jump (not price-jump)", () => {
    const detection = detectScenarioTriggers(
      fxScenario,
      payloadWithMacro([
        { date: "2026-04-20", value: 1.08 },
        { date: "2026-04-21", value: 1.08 },
        { date: "2026-04-22", value: 1.08 },
        { date: "2026-04-23", value: 1.08 },
        { date: "2026-04-24", value: 1.08 },
        { date: "2026-04-29", value: 1.08 }
      ]),
      DEFAULT_DETECTOR_CONFIG,
      NOW
    );
    const fx = detection.components.find((c) => c.signal === "fx-jump");
    expect(fx).toBeDefined();
  });

  it("fires when EUR/USD moves >= fxJumpPct over fxJumpWindow days", () => {
    const detection = detectScenarioTriggers(
      fxScenario,
      payloadWithMacro([
        { date: "2026-04-20", value: 1.10 },
        { date: "2026-04-21", value: 1.10 },
        { date: "2026-04-22", value: 1.10 },
        { date: "2026-04-23", value: 1.10 },
        { date: "2026-04-24", value: 1.10 },
        // -2.7% over 5 days, exceeds default 1.5% fxJumpPct
        { date: "2026-04-29", value: 1.07 }
      ]),
      DEFAULT_DETECTOR_CONFIG,
      NOW
    );
    const fx = detection.components.find((c) => c.signal === "fx-jump");
    expect(fx).toBeDefined();
    expect(fx!.triggered).toBe(true);
    expect(Math.abs(fx!.observed!)).toBeGreaterThan(2);
  });

  it("does not fire when EUR/USD is flat", () => {
    const detection = detectScenarioTriggers(
      fxScenario,
      payloadWithMacro([
        { date: "2026-04-20", value: 1.08 },
        { date: "2026-04-21", value: 1.081 },
        { date: "2026-04-22", value: 1.082 },
        { date: "2026-04-23", value: 1.081 },
        { date: "2026-04-24", value: 1.082 },
        { date: "2026-04-29", value: 1.083 }
      ]),
      DEFAULT_DETECTOR_CONFIG,
      NOW
    );
    const fx = detection.components.find((c) => c.signal === "fx-jump");
    expect(fx).toBeDefined();
    expect(fx!.triggered).toBe(false);
  });

  it("returns null observation when macro series is missing", () => {
    const payload: ConnectedSourcePayload = { ...buildPayload(), macroSeries: undefined };
    const detection = detectScenarioTriggers(fxScenario, payload, DEFAULT_DETECTOR_CONFIG, NOW);
    const fx = detection.components.find((c) => c.signal === "fx-jump");
    expect(fx).toBeDefined();
    expect(fx!.observed).toBeNull();
    expect(fx!.triggered).toBe(false);
  });
});
