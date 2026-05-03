import { describe, it, expect } from "vitest";
import {
  catalystScenarios,
  HEURISTIC_INTERACTION_MULTIPLIERS,
  scoreScenarioFromDriverWeights
} from "../src/data/catalystScenarios";
import { getInteractionMultiplier } from "../src/data/catalystCalibration";
import { materialsResearch, rankMaterialsForMarket } from "../src/data/materialsResearch";

describe("catalystScenarios dataset", () => {
  it("exposes only multi-driver combinations (>= 2 components)", () => {
    expect(catalystScenarios.length).toBeGreaterThan(0);
    for (const scenario of catalystScenarios) {
      expect(scenario.components.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("each scenario carries at least one named reference", () => {
    for (const scenario of catalystScenarios) {
      expect(scenario.references.length).toBeGreaterThan(0);
      for (const ref of scenario.references) {
        expect(ref.label.length).toBeGreaterThan(0);
        expect(ref.url.startsWith("https://") || ref.url.startsWith("http://")).toBe(true);
      }
    }
  });

  it("targets only known carbon markets", () => {
    const validMarkets = new Set(["eu-ets", "k-ets", "cn-ets", "shared"]);
    for (const scenario of catalystScenarios) {
      for (const market of scenario.marketIds) {
        expect(validMarkets.has(market)).toBe(true);
      }
    }
  });

  it("every scenario carries an explicit calibrationStatus", () => {
    const validStatuses = new Set(["heuristic", "backtest", "calibrated"]);
    for (const scenario of catalystScenarios) {
      expect(validStatuses.has(scenario.calibrationStatus)).toBe(true);
    }
  });
});

describe("getInteractionMultiplier", () => {
  it("returns one of the three valid statuses for every shipped scenario", () => {
    const valid = new Set(["heuristic", "backtest", "calibrated"]);
    for (const scenario of catalystScenarios) {
      const result = getInteractionMultiplier(scenario);
      expect(valid.has(result.status)).toBe(true);
      expect(Number.isFinite(result.multiplier)).toBe(true);
    }
  });

  it("respects an explicit interactionMultiplier and preserves the calibrationStatus", () => {
    const sample = catalystScenarios[0];
    const overridden = {
      ...sample,
      interactionMultiplier: 1.5,
      calibrationStatus: "backtest" as const
    };
    const result = getInteractionMultiplier(overridden);
    expect(result.multiplier).toBe(1.5);
    expect(result.status).toBe("backtest");
  });

  it("falls back to the heuristic constant for scenarios without enough events", () => {
    const sparse = {
      ...catalystScenarios[0],
      id: "synthetic-no-events",
      interactionMultiplier: undefined,
      calibrationStatus: "heuristic" as const
    };
    const result = getInteractionMultiplier(sparse);
    expect(result.status).toBe("heuristic");
    expect(result.multiplier).toBe(
      HEURISTIC_INTERACTION_MULTIPLIERS[sparse.interactionEffect]
    );
  });
});

describe("scoreScenarioFromDriverWeights", () => {
  const eu = catalystScenarios.find((s) => s.id === "eu-cold-snap-stack");

  it("returns 0 when no driver weights are supplied", () => {
    if (!eu) throw new Error("test fixture missing");
    expect(scoreScenarioFromDriverWeights(eu, {})).toBe(0);
  });

  it("amplifies when interaction effect is amplify", () => {
    if (!eu) throw new Error("test fixture missing");
    const weights = { eu_weather: 1, eu_gas: 1, eu_power: 1 };
    const score = scoreScenarioFromDriverWeights(eu, weights);
    // each tighten contributes +1 weight, sum 3, amplify multiplier 1.25 -> 3.75
    expect(score).toBeCloseTo(3.75, 5);
  });

  it("offsets dampens when interaction effect is offset", () => {
    const offsetScenario = catalystScenarios.find(
      (s) => s.interactionEffect === "offset"
    );
    if (!offsetScenario) throw new Error("expected at least one offset scenario");
    const weights: Record<string, number> = {};
    for (const c of offsetScenario.components) {
      if (c.driverId) weights[c.driverId] = 1;
    }
    const raw = offsetScenario.components.reduce((sum, c) => {
      if (!c.driverId) return sum;
      const sign = c.sign === "tighten" ? 1 : c.sign === "loosen" ? -1 : 0.5;
      return sum + (weights[c.driverId] ?? 0) * sign;
    }, 0);
    const score = scoreScenarioFromDriverWeights(offsetScenario, weights);
    expect(Math.abs(score)).toBeLessThanOrEqual(Math.abs(raw));
  });
});

describe("materialsResearch dataset", () => {
  it("every entry is initially marked unverified", () => {
    for (const entry of materialsResearch) {
      expect(entry.verified).toBe(false);
    }
  });

  it("every entry has a non-empty cite list with valid URLs", () => {
    for (const entry of materialsResearch) {
      expect(entry.references.length).toBeGreaterThan(0);
      for (const ref of entry.references) {
        expect(ref.url.startsWith("https://") || ref.url.startsWith("http://")).toBe(true);
      }
    }
  });

  it("rankMaterialsForMarket promotes higher-readiness entries to the top", () => {
    const ranked = rankMaterialsForMarket("eu-ets", materialsResearch);
    // The top three entries should never be lab-only
    for (const entry of ranked.slice(0, 3)) {
      expect(entry.readiness).not.toBe("lab");
    }
    // The very last entry should not have higher readiness than the top entry
    const order = { scale: 3, "early-deploy": 2, pilot: 1, lab: 0 } as const;
    expect(order[ranked[0].readiness]).toBeGreaterThanOrEqual(
      order[ranked[ranked.length - 1].readiness]
    );
  });
});
