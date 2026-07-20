import { catalystEventLog } from "./catalystEventLog";
import { catalystScenarios, getHeuristicInteractionMultiplier } from "./catalystScenarios";
import { getPriceAnchorsByMarket } from "./historicalPriceAnchors";
import { runEventStudy } from "../lib/eventStudy";
import type { CatalystCalibrationRecord, CatalystScenario } from "../types";

const REVIEWED_AT = "2026-07-20";

const EVENT_STUDY_CONFIG = {
  preWindow: 3, // monthly anchors -> "trading days" = months in this fixture
  postWindow: 2,
  minObservations: 2,
  clampAbsReturn: 0.6
} as const;

function buildExpectedDirectionMap(): Record<string, "higher" | "lower" | "ambiguous"> {
  const out: Record<string, "higher" | "lower" | "ambiguous"> = {};
  for (const scenario of catalystScenarios) {
    out[scenario.id] = scenario.expectedDirection;
  }
  return out;
}

/**
 * Run the event study against the bundled historical anchors and produce
 * a per-scenario calibration record. Pure, deterministic: same input
 * always produces the same multipliers, which is what the audit trail
 * requires.
 */
export function buildCatalystCalibration(): CatalystCalibrationRecord[] {
  const expectedDirection = buildExpectedDirectionMap();
  const { stats } = runEventStudy(
    catalystEventLog,
    getPriceAnchorsByMarket(),
    EVENT_STUDY_CONFIG,
    expectedDirection
  );

  return stats.map((stat) => ({
    scenarioId: stat.scenarioId,
    multiplier: Number(stat.suggestedMultiplier.toFixed(2)),
    status: stat.status,
    observations: stat.observations,
    meanAbsReturn: Number.isFinite(stat.meanAbsAbnormalReturn)
      ? Number(stat.meanAbsAbnormalReturn.toFixed(4))
      : null,
    hitRate: stat.hitRate !== null ? Number(stat.hitRate.toFixed(2)) : null,
    reviewedAt: REVIEWED_AT,
    notes: `${stat.observations} events, expected sign ${
      expectedDirection[stat.scenarioId] ?? "n/a"
    }`
  }));
}

/**
 * Single source of truth for the calibration table. Re-computed at
 * module load. Cheap (handful of arithmetic operations).
 */
export const CATALYST_CALIBRATION: CatalystCalibrationRecord[] = buildCatalystCalibration();

export function getCalibrationForScenario(
  scenario: CatalystScenario
): CatalystCalibrationRecord | null {
  return CATALYST_CALIBRATION.find((record) => record.scenarioId === scenario.id) ?? null;
}

/**
 * Layered resolver. Resolution order:
 *   1. Per-scenario `interactionMultiplier` if explicitly set in the data file.
 *   2. Backtest-derived multiplier from the calibration table (if observations >= min).
 *   3. Heuristic constant by `interactionEffect`.
 *
 * The status returned reflects which layer was used so the UI can show
 * provenance honestly.
 */
export function getInteractionMultiplier(scenario: CatalystScenario): {
  multiplier: number;
  status: CatalystScenario["calibrationStatus"];
  observations?: number;
  hitRate?: number | null;
} {
  if (
    typeof scenario.interactionMultiplier === "number" &&
    Number.isFinite(scenario.interactionMultiplier)
  ) {
    return {
      multiplier: scenario.interactionMultiplier,
      status: scenario.calibrationStatus
    };
  }

  const calibration = getCalibrationForScenario(scenario);
  if (calibration && calibration.status === "backtest") {
    return {
      multiplier: calibration.multiplier,
      status: "backtest",
      observations: calibration.observations,
      hitRate: calibration.hitRate
    };
  }

  const heuristic = getHeuristicInteractionMultiplier(scenario);
  return {
    multiplier: heuristic.multiplier,
    status: "heuristic",
    observations: calibration?.observations,
    hitRate: calibration?.hitRate ?? null
  };
}
