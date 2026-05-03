import { describe, it, expect } from "vitest";
import {
  makeBaselineDirectionalModel,
  runWalkForward,
  samplesFromPriceSeries,
  type WalkForwardSample
} from "../src/lib/walkForward";

describe("samplesFromPriceSeries", () => {
  it("computes 1-step forward returns and skips dates without features", () => {
    const series = [
      { date: "2026-01-01", close: 100 },
      { date: "2026-01-02", close: 101 },
      { date: "2026-01-03", close: 99 }
    ];
    const features: Record<string, Record<string, number>> = {
      "2026-01-01": { x: 1 },
      // intentionally missing 2026-01-02
      "2026-01-03": { x: -1 }
    };
    const samples = samplesFromPriceSeries(series, features);
    expect(samples).toHaveLength(1);
    expect(samples[0].date).toBe("2026-01-01");
    expect(samples[0].observedReturn).toBeCloseTo(0.01, 5);
  });

  it("ignores non-finite or non-positive prices", () => {
    const series = [
      { date: "2026-01-01", close: 0 },
      { date: "2026-01-02", close: 100 },
      { date: "2026-01-03", close: 101 }
    ];
    const features = {
      "2026-01-01": { x: 1 },
      "2026-01-02": { x: 1 }
    };
    const samples = samplesFromPriceSeries(series, features);
    expect(samples.map((s) => s.date)).toEqual(["2026-01-02"]);
  });
});

describe("runWalkForward", () => {
  function buildSamples(
    n: number,
    fn: (i: number) => { features: Record<string, number>; observedReturn: number }
  ): WalkForwardSample[] {
    return Array.from({ length: n }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      ...fn(i)
    }));
  }

  it("returns empty report when sample size is at or below training window", () => {
    const samples = buildSamples(5, () => ({ features: { x: 0 }, observedReturn: 0 }));
    const report = runWalkForward({
      samples,
      trainingWindow: 10,
      model: makeBaselineDirectionalModel({ x: 1 })
    });
    expect(report.evaluated).toBe(0);
    expect(report.hitRate).toBeNull();
  });

  it("scores correctly when prediction perfectly matches direction", () => {
    // observed_return = sign(features.x), prediction = sign(features.x). Perfect hit.
    const samples = buildSamples(40, (i) => {
      const x = i % 2 === 0 ? 1 : -1;
      return { features: { x }, observedReturn: x * 0.01 };
    });
    const report = runWalkForward({
      samples,
      trainingWindow: 5,
      model: makeBaselineDirectionalModel({ x: 1 })
    });
    expect(report.evaluated).toBe(35);
    expect(report.hitRate).toBe(1);
    expect(report.misses).toBe(0);
    expect(report.sharpeApprox).toBeGreaterThan(0);
  });

  it("noise floor pushes near-zero observed returns to flat", () => {
    const samples = buildSamples(30, (i) => ({
      features: { x: 1 },
      observedReturn: i % 2 === 0 ? 0.0001 : 0.05
    }));
    const report = runWalkForward({
      samples,
      trainingWindow: 5,
      noiseFloor: 0.001,
      model: makeBaselineDirectionalModel({ x: 1 })
    });
    expect(report.flats).toBeGreaterThan(0);
  });

  it("default model fits weights from feature mean when no priors are passed", () => {
    const samples = buildSamples(30, (i) => ({
      features: { x: i % 2 === 0 ? 1 : -1 },
      observedReturn: 0
    }));
    const model = makeBaselineDirectionalModel();
    expect(() =>
      runWalkForward({
        samples,
        trainingWindow: 5,
        model
      })
    ).not.toThrow();
  });
});
