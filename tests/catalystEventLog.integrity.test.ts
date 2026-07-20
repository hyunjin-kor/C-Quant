import { expect, test } from "vitest";
import { catalystEventLog } from "../src/data/catalystEventLog";
import { catalystScenarios } from "../src/data/catalystScenarios";

// Integrity guards added during the 2026-07 calibration review round.

test("every event maps to an existing scenario", () => {
  const ids = new Set(catalystScenarios.map((s) => s.id));
  const orphans = catalystEventLog.filter((e) => !ids.has(e.scenarioId));
  expect(orphans.map((e) => e.id)).toEqual([]);
});

test("every event market is covered by its scenario's marketIds", () => {
  const mismatches = catalystEventLog.filter((e) => {
    const s = catalystScenarios.find((sc) => sc.id === e.scenarioId);
    return s && !s.marketIds.includes(e.marketId) && !s.marketIds.includes("shared");
  });
  expect(mismatches.map((e) => e.id)).toEqual([]);
});

test("event observedAt dates are valid and not in the future", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const e of catalystEventLog) {
    expect(e.observedAt, e.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(e.observedAt)), e.id).toBe(false);
    expect(e.observedAt <= today, `${e.id} observedAt ${e.observedAt} is in the future`).toBe(true);
  }
});
