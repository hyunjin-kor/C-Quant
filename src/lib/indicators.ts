/**
 * Pure technical-indicator helpers used by the chart layer.
 *
 * All functions take a flat numeric series and return a parallel series of
 * the same length, padded with `null` where the indicator is undefined
 * (e.g. early values of an SMA before the window fills).
 *
 * No external dependencies — these are simple enough to verify by hand and
 * fast enough that the renderer can run them on every redraw without a
 * worker. They live in src/lib so unit tests can run them in a node
 * environment via vitest.
 */

export type Series = ReadonlyArray<number>;

function isFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Simple moving average. Returns nulls for the first `period - 1` slots. */
export function sma(values: Series, period: number): Array<number | null> {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error("sma: period must be a positive integer.");
  }
  const out: Array<number | null> = new Array(values.length).fill(null);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (isFinite(v)) {
      sum += v;
      count += 1;
    }
    if (i >= period) {
      const drop = values[i - period];
      if (isFinite(drop)) {
        sum -= drop;
        count -= 1;
      }
    }
    if (i >= period - 1 && count === period) {
      out[i] = sum / period;
    }
  }
  return out;
}

/**
 * Exponential moving average. Seeded with the SMA over the first window so
 * the curve starts at a sensible level instead of ramping from the first
 * sample.
 */
export function ema(values: Series, period: number): Array<number | null> {
  if (period <= 0 || !Number.isInteger(period)) {
    throw new Error("ema: period must be a positive integer.");
  }
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length < period) return out;

  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i += 1) {
    const v = values[i];
    if (!isFinite(v)) return out;
    seed += v;
  }
  let prev = seed / period;
  out[period - 1] = prev;

  for (let i = period; i < values.length; i += 1) {
    const v = values[i];
    if (!isFinite(v)) {
      out[i] = prev;
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/**
 * Wilder's RSI (the standard 14-period default). Returns the RSI line
 * normalized to 0–100, padded with nulls before the first valid window.
 */
export function rsi(values: Series, period = 14): Array<number | null> {
  if (period <= 1 || !Number.isInteger(period)) {
    throw new Error("rsi: period must be an integer > 1.");
  }
  const out: Array<number | null> = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = values[i] - values[i - 1];
    if (!isFinite(diff)) return out;
    if (diff >= 0) gainSum += diff;
    else lossSum += -diff;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = computeRsiPoint(avgGain, avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = computeRsiPoint(avgGain, avgLoss);
  }

  return out;
}

function computeRsiPoint(gain: number, loss: number): number {
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export type BollingerBand = {
  middle: number | null;
  upper: number | null;
  lower: number | null;
};

/**
 * Bollinger bands: middle = SMA, upper/lower = middle ± k * std-dev.
 * Defaults match the popular 20 / 2 setup.
 */
export function bollinger(values: Series, period = 20, k = 2): Array<BollingerBand> {
  if (period <= 1 || !Number.isInteger(period)) {
    throw new Error("bollinger: period must be an integer > 1.");
  }
  const middleSeries = sma(values, period);
  const out: Array<BollingerBand> = new Array(values.length).fill({
    middle: null,
    upper: null,
    lower: null
  });
  for (let i = 0; i < values.length; i += 1) {
    const middle = middleSeries[i];
    if (middle === null) continue;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      const v = values[j];
      if (!isFinite(v)) {
        variance = NaN;
        break;
      }
      const diff = v - middle;
      variance += diff * diff;
    }
    if (Number.isNaN(variance)) continue;
    const stddev = Math.sqrt(variance / period);
    out[i] = {
      middle,
      upper: middle + k * stddev,
      lower: middle - k * stddev
    };
  }
  return out;
}

/**
 * Compute log-return series. Useful for volatility / correlation modules.
 * Returns an array of length values.length, with the first slot null.
 */
export function logReturns(values: Series): Array<number | null> {
  const out: Array<number | null> = new Array(values.length).fill(null);
  for (let i = 1; i < values.length; i += 1) {
    const a = values[i];
    const b = values[i - 1];
    if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) continue;
    out[i] = Math.log(a / b);
  }
  return out;
}

/** Population correlation between two series. Skips slots where either is non-finite. */
export function correlation(a: Series, b: Series): number | null {
  if (a.length !== b.length) {
    throw new Error("correlation: series must be the same length.");
  }
  let sumA = 0;
  let sumB = 0;
  let count = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (!isFinite(x) || !isFinite(y)) continue;
    sumA += x;
    sumB += y;
    count += 1;
  }
  if (count < 2) return null;
  const meanA = sumA / count;
  const meanB = sumB / count;

  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (!isFinite(x) || !isFinite(y)) continue;
    const dx = x - meanA;
    const dy = y - meanB;
    cov += dx * dy;
    varA += dx * dx;
    varB += dy * dy;
  }

  if (varA === 0 || varB === 0) return null;
  return cov / Math.sqrt(varA * varB);
}
