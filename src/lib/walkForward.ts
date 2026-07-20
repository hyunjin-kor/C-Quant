/**
 * Walk-forward evaluation harness.
 *
 * Honest scope:
 * - This is a generic framework that takes (date, features, observed-price)
 *   tuples and scores any directional model out-of-sample.
 * - It does NOT fabricate historical driver values. Callers must supply
 *   features from a verified source.
 * - It is deliberately deterministic and side-effect free so it is
 *   auditable and unit-testable.
 *
 * Typical usage:
 *   const sample: WalkForwardSample[] = ...; // from connected sources + features
 *   const report = runWalkForward({
 *     samples: sample,
 *     trainingWindow: 60,
 *     refitEvery: 1,
 *     model: makeBaselineDirectionalModel()
 *   });
 *
 * The default baseline model is a sign-of-weighted-sum: it flags the next
 * step as "up" if Σ(weight_i * feature_i) > 0. This is intentionally
 * trivial because the goal of a walk-forward harness is to score whatever
 * model is plugged in, not to bake in a sophisticated estimator that
 * would need its own calibration discussion.
 */

export type WalkForwardFeatureMap = Record<string, number>;

export type WalkForwardSample = {
  date: string;
  features: WalkForwardFeatureMap;
  observedReturn: number;
};

export type WalkForwardModel = {
  fit: (window: WalkForwardSample[]) => void;
  /** Predicted directional score; sign is the only thing scored by default. */
  predict: (features: WalkForwardFeatureMap) => number;
};

export type WalkForwardConfig = {
  samples: WalkForwardSample[];
  trainingWindow: number;
  refitEvery?: number;
  /** Threshold below which a sample is considered "no-trade" and excluded from sign scoring. */
  noiseFloor?: number;
  model: WalkForwardModel;
};

export type WalkForwardPrediction = {
  date: string;
  predictedScore: number;
  observedReturn: number;
  predictedDirection: "up" | "down" | "flat";
  observedDirection: "up" | "down" | "flat";
  hit: boolean | null;
};

export type WalkForwardReport = {
  predictions: WalkForwardPrediction[];
  /** Sample size after training warmup and noise filtering. */
  evaluated: number;
  hits: number;
  misses: number;
  flats: number;
  hitRate: number | null;
  meanAbsReturn: number;
  /** Naive Sharpe of the strategy that takes sign-of-prediction sized 1. */
  sharpeApprox: number | null;
};

export function makeBaselineDirectionalModel(
  weights: WalkForwardFeatureMap = {}
): WalkForwardModel {
  let frozen: WalkForwardFeatureMap = { ...weights };

  return {
    fit(window) {
      // Default behavior: refresh weights from the mean of incoming features
      // when the caller supplied no weights up front. This is a placeholder
      // that exists so the harness has something to optimise against.
      if (Object.keys(weights).length === 0 && window.length > 0) {
        const accum: WalkForwardFeatureMap = {};
        for (const sample of window) {
          for (const [k, v] of Object.entries(sample.features)) {
            accum[k] = (accum[k] ?? 0) + v;
          }
        }
        const next: WalkForwardFeatureMap = {};
        for (const [k, total] of Object.entries(accum)) {
          next[k] = total / window.length;
        }
        frozen = next;
      }
    },
    predict(features) {
      let score = 0;
      for (const [k, weight] of Object.entries(frozen)) {
        const value = features[k];
        if (typeof value === "number" && Number.isFinite(value)) {
          score += weight * value;
        }
      }
      return score;
    }
  };
}

function classify(value: number, threshold: number): "up" | "down" | "flat" {
  if (value > threshold) return "up";
  if (value < -threshold) return "down";
  return "flat";
}

export function runWalkForward(config: WalkForwardConfig): WalkForwardReport {
  const samples = config.samples ?? [];
  const trainingWindow = Math.max(1, Math.floor(config.trainingWindow));
  const refitEvery = Math.max(1, Math.floor(config.refitEvery ?? 1));
  const noiseFloor = Math.max(0, config.noiseFloor ?? 0);

  if (samples.length <= trainingWindow) {
    return {
      predictions: [],
      evaluated: 0,
      hits: 0,
      misses: 0,
      flats: 0,
      hitRate: null,
      meanAbsReturn: 0,
      sharpeApprox: null
    };
  }

  const sorted = [...samples].sort((a, b) => a.date.localeCompare(b.date));
  const predictions: WalkForwardPrediction[] = [];
  let stepsSinceRefit = refitEvery;

  for (let i = trainingWindow; i < sorted.length; i++) {
    const window = sorted.slice(i - trainingWindow, i);
    if (stepsSinceRefit >= refitEvery) {
      config.model.fit(window);
      stepsSinceRefit = 0;
    }
    stepsSinceRefit += 1;

    const target = sorted[i];
    const score = config.model.predict(target.features);
    const predictedDirection = classify(score, 0);
    const observedDirection = classify(target.observedReturn, noiseFloor);

    let hit: boolean | null = null;
    if (observedDirection !== "flat" && predictedDirection !== "flat") {
      hit = predictedDirection === observedDirection;
    }

    predictions.push({
      date: target.date,
      predictedScore: score,
      observedReturn: target.observedReturn,
      predictedDirection,
      observedDirection,
      hit
    });
  }

  const decisive = predictions.filter((p) => p.hit !== null);
  const hits = decisive.filter((p) => p.hit === true).length;
  const misses = decisive.filter((p) => p.hit === false).length;
  const flats = predictions.length - decisive.length;
  const hitRate = decisive.length > 0 ? hits / decisive.length : null;

  const absReturns = predictions.map((p) => Math.abs(p.observedReturn));
  const meanAbsReturn =
    absReturns.length > 0 ? absReturns.reduce((sum, v) => sum + v, 0) / absReturns.length : 0;

  // Naive sized-1 sign-strategy returns: predicted-up gets +observedReturn, predicted-down gets -observedReturn.
  const stratReturns = predictions
    .filter((p) => p.predictedDirection !== "flat")
    .map((p) => (p.predictedDirection === "up" ? p.observedReturn : -p.observedReturn));

  let sharpeApprox: number | null = null;
  if (stratReturns.length > 1) {
    const mean = stratReturns.reduce((sum, v) => sum + v, 0) / stratReturns.length;
    const variance =
      stratReturns.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / (stratReturns.length - 1);
    const std = Math.sqrt(variance);
    sharpeApprox = std > 0 ? mean / std : null;
  }

  return {
    predictions,
    evaluated: predictions.length,
    hits,
    misses,
    flats,
    hitRate,
    meanAbsReturn,
    sharpeApprox
  };
}

/**
 * Convert a price series into walk-forward samples by computing 1-step
 * forward returns. Features are passed through unchanged from the caller.
 *
 * If a feature row for a given date is missing, that date is skipped.
 */
export function samplesFromPriceSeries(
  series: Array<{ date: string; close: number }>,
  featuresByDate: Record<string, WalkForwardFeatureMap>
): WalkForwardSample[] {
  const sorted = [...series]
    .filter((p) => Number.isFinite(p.close))
    .sort((a, b) => a.date.localeCompare(b.date));
  const out: WalkForwardSample[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const today = sorted[i];
    const tomorrow = sorted[i + 1];
    if (today.close <= 0) continue;
    const features = featuresByDate[today.date];
    if (!features) continue;
    out.push({
      date: today.date,
      features,
      observedReturn: (tomorrow.close - today.close) / today.close
    });
  }
  return out;
}
