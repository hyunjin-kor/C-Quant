import { describe, it, expect } from "vitest";
import {
  CATALYST_CALIBRATION,
  buildCatalystCalibration,
  getCalibrationForScenario,
  getInteractionMultiplier
} from "../src/data/catalystCalibration";
import { catalystScenarios } from "../src/data/catalystScenarios";

describe("CATALYST_CALIBRATION", () => {
  it("is deterministic — buildCatalystCalibration returns the same shape twice", () => {
    const first = buildCatalystCalibration();
    const second = buildCatalystCalibration();
    expect(first).toEqual(second);
  });

  it("every record points at a real scenario", () => {
    const scenarioIds = new Set(catalystScenarios.map((scenario) => scenario.id));
    for (const record of CATALYST_CALIBRATION) {
      expect(scenarioIds.has(record.scenarioId)).toBe(true);
    }
  });

  it("multiplier is bounded to a defensible range", () => {
    // Bounds match the adaptive-baseline clamp [0.5, 2.0]. The median
    // backtest scenario maps to 1.0 by construction; strong scenarios
    // trend toward 2.0, weak ones toward 0.5. See aggregateByScenario
    // in src/lib/eventStudy.ts for the formula.
    for (const record of CATALYST_CALIBRATION) {
      expect(record.multiplier).toBeGreaterThanOrEqual(0.5);
      expect(record.multiplier).toBeLessThanOrEqual(2.0);
    }
  });

  it("status is heuristic or backtest only — no calibrated records ship by default", () => {
    for (const record of CATALYST_CALIBRATION) {
      expect(["heuristic", "backtest"]).toContain(record.status);
    }
  });

  it("at least one scenario reaches backtest status from the bundled event log", () => {
    const backtestRecords = CATALYST_CALIBRATION.filter((record) => record.status === "backtest");
    expect(backtestRecords.length).toBeGreaterThan(0);
  });

  it("calibrated scenarios must carry backtest evidence in the calibration table", () => {
    for (const scenario of catalystScenarios) {
      if (scenario.calibrationStatus !== "calibrated") continue;
      const record = CATALYST_CALIBRATION.find((r) => r.scenarioId === scenario.id);
      expect(record).toBeTruthy();
      expect(record?.status).toBe("backtest");
      expect(record?.observations ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("getCalibrationForScenario / getInteractionMultiplier", () => {
  it("returns null when the scenario has no calibration record", () => {
    const synthetic = {
      ...catalystScenarios[0],
      id: "scenario-not-in-table"
    };
    expect(getCalibrationForScenario(synthetic)).toBeNull();
  });

  it("layered resolver prefers explicit interactionMultiplier", () => {
    const sample = catalystScenarios[0];
    const result = getInteractionMultiplier({
      ...sample,
      interactionMultiplier: 1.42,
      calibrationStatus: "calibrated"
    });
    expect(result.multiplier).toBe(1.42);
    expect(result.status).toBe("calibrated");
  });

  it("layered resolver returns the backtest multiplier when calibration says so", () => {
    const target = CATALYST_CALIBRATION.find((record) => record.status === "backtest");
    if (!target) {
      // No backtest records — skip without failing.
      return;
    }
    const scenario = catalystScenarios.find((item) => item.id === target.scenarioId);
    expect(scenario).toBeDefined();
    if (!scenario) return;
    const result = getInteractionMultiplier(scenario);
    expect(result.status).toBe("backtest");
    expect(result.multiplier).toBe(target.multiplier);
  });
});
