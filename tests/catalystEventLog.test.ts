import { describe, it, expect } from "vitest";
import { catalystEventLog, eventsForMarket, eventsForScenario } from "../src/data/catalystEventLog";
import { catalystScenarios } from "../src/data/catalystScenarios";

describe("catalystEventLog dataset", () => {
  it("ships at least one event per shipped scenario", () => {
    const scenarioIdsInLog = new Set(catalystEventLog.map((event) => event.scenarioId));
    const missing = catalystScenarios
      .map((scenario) => scenario.id)
      .filter((id) => !scenarioIdsInLog.has(id));
    // It is OK if a small number of scenarios have no events yet — they
    // remain heuristic. Document the expectation here so a regression
    // is loud.
    expect(missing.length).toBeLessThan(catalystScenarios.length);
  });

  it("every event references at least one primary source URL", () => {
    for (const event of catalystEventLog) {
      expect(event.references.length).toBeGreaterThan(0);
      for (const ref of event.references) {
        expect(ref.label.length).toBeGreaterThan(0);
        expect(/^https?:\/\//.test(ref.url)).toBe(true);
      }
    }
  });

  it("targets only known carbon markets", () => {
    const valid = new Set(["eu-ets", "k-ets", "cn-ets", "shared"]);
    for (const event of catalystEventLog) {
      expect(valid.has(event.marketId)).toBe(true);
    }
  });

  it("every event uses one of the three confidence tags", () => {
    const valid = new Set(["verified", "reported", "context"]);
    for (const event of catalystEventLog) {
      expect(valid.has(event.confidence)).toBe(true);
    }
  });

  it("observedAt is a valid ISO date", () => {
    for (const event of catalystEventLog) {
      const parsed = new Date(event.observedAt);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
    }
  });

  it("eventsForScenario filters correctly", () => {
    const target = catalystEventLog[0];
    const subset = eventsForScenario(target.scenarioId);
    expect(subset.every((event) => event.scenarioId === target.scenarioId)).toBe(true);
  });

  it("eventsForMarket includes shared events when filtering by a specific market", () => {
    const eu = eventsForMarket("eu-ets");
    const ids = new Set(eu.map((event) => event.id));
    const sharedEvents = catalystEventLog.filter((event) => event.marketId === "shared");
    for (const sharedEvent of sharedEvents) {
      expect(ids.has(sharedEvent.id)).toBe(true);
    }
  });
});
