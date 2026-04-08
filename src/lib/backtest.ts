import type {
  BacktestRun,
  BacktestStrategy,
  ParsedSeriesPoint
} from "../types";

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function std(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function movingAverage(values: number[], index: number, window: number): number {
  if (index + 1 < window) {
    return Number.NaN;
  }
  return mean(values.slice(index + 1 - window, index + 1));
}

function zScore(values: number[], index: number, window: number): number {
  if (index + 1 < window) {
    return Number.NaN;
  }
  const slice = values.slice(index + 1 - window, index + 1);
  const avg = mean(slice);
  const deviation = std(slice);
  if (deviation === 0) {
    return 0;
  }
  return (values[index] - avg) / deviation;
}

function getNumeric(point: ParsedSeriesPoint, key: string): number | undefined {
  const value = point[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function signalForStrategy(
  strategy: BacktestStrategy,
  series: ParsedSeriesPoint[],
  prices: number[],
  index: number
): number {
  const point = series[index];
  const currentPrice = prices[index];

  switch (strategy) {
    case "trend": {
      const sma50 = movingAverage(prices, index, 50);
      const sma200 = movingAverage(prices, index, 200);
      if (!Number.isFinite(sma50) || !Number.isFinite(sma200)) {
        return 0;
      }
      return currentPrice > sma50 && sma50 > sma200
        ? 1
        : currentPrice < sma50 && sma50 < sma200
          ? -1
          : 0;
    }
    case "meanReversion": {
      const score = zScore(prices, index, 20);
      if (!Number.isFinite(score)) {
        return 0;
      }
      if (score < -1.25) {
        return 1;
      }
      if (score > 1.25) {
        return -1;
      }
      return 0;
    }
    case "spreadRegime": {
      const cds = getNumeric(point, "cds");
      const css = getNumeric(point, "css");
      if (cds === undefined || css === undefined) {
        return 0;
      }
      if (cds > css + 2) {
        return 1;
      }
      if (cds < 0 && css > 0) {
        return -1;
      }
      return 0;
    }
    case "policyMomentum": {
      const policyFlag = getNumeric(point, "policy_flag") ?? 0;
      const auctionCover = getNumeric(point, "auction_cover") ?? 0;
      const sma20 = movingAverage(prices, index, 20);
      if (!Number.isFinite(sma20)) {
        return 0;
      }
      if ((policyFlag >= 1 || auctionCover >= 1.15) && currentPrice > sma20) {
        return 1;
      }
      if (policyFlag >= 1 && currentPrice < sma20) {
        return -1;
      }
      return 0;
    }
    default:
      return 0;
  }
}

export function parseCsv(text: string): ParsedSeriesPoint[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header and at least one data row.");
  }

  const headers = lines[0].split(",").map((entry) => entry.trim());
  const rows = lines.slice(1).map((line) => line.split(","));

  return rows.map((row) => {
    const point: ParsedSeriesPoint = {
      date: "",
      close: 0
    };

    headers.forEach((header, index) => {
      const raw = (row[index] ?? "").trim();
      if (header === "date") {
        point.date = raw;
        return;
      }
      const numeric = Number(raw);
      point[header] = Number.isFinite(numeric) && raw !== "" ? numeric : raw;
    });

    if (!point.date) {
      throw new Error("Each row must include a date column.");
    }
    if (typeof point.close !== "number" || !Number.isFinite(point.close)) {
      throw new Error("CSV must include a numeric close column.");
    }
    return point;
  });
}

export function runBacktest(
  series: ParsedSeriesPoint[],
  strategy: BacktestStrategy,
  feeBps: number
): BacktestRun {
  if (series.length < 40) {
    throw new Error("At least 40 rows are required to run a backtest.");
  }

  const prices = series.map((point) => point.close);
  const signals = prices.map((_, index) =>
    signalForStrategy(strategy, series, prices, index)
  );
  const returns: number[] = [];
  const equityCurve: number[] = [1];
  const warnings: string[] = [];

  if (
    strategy === "spreadRegime" &&
    !series.some((point) => typeof point.cds === "number" && typeof point.css === "number")
  ) {
    warnings.push("`spreadRegime` requires `cds` and `css` columns.");
  }

  if (
    strategy === "policyMomentum" &&
    !series.some(
      (point) =>
        typeof point.policy_flag === "number" ||
        typeof point.auction_cover === "number"
    )
  ) {
    warnings.push("`policyMomentum` works best when `policy_flag` or `auction_cover` is present.");
  }

  let tradeCount = 0;
  let lastSignal = 0;
  let winningBars = 0;
  let exposedBars = 0;

  for (let index = 1; index < prices.length; index += 1) {
    const previousSignal = signals[index - 1];
    const currentReturn = prices[index] / prices[index - 1] - 1;
    const turnover = Math.abs(previousSignal - lastSignal);
    const cost = turnover * (feeBps / 10000);
    const strategyReturn = previousSignal * currentReturn - cost;

    returns.push(strategyReturn);
    equityCurve.push(equityCurve[equityCurve.length - 1] * (1 + strategyReturn));

    if (turnover > 0) {
      tradeCount += 1;
    }
    if (previousSignal !== 0) {
      exposedBars += 1;
      if (strategyReturn > 0) {
        winningBars += 1;
      }
    }

    lastSignal = previousSignal;
  }

  let peak = equityCurve[0];
  let maxDrawdown = 0;
  for (const value of equityCurve) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = value / peak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const totalReturn = equityCurve[equityCurve.length - 1] - 1;
  const annualizedReturn =
    Math.pow(1 + totalReturn, Math.max(252 / returns.length, 1)) - 1;
  const annualizedVol = std(returns) * Math.sqrt(252);
  const sharpe = annualizedVol === 0 ? 0 : annualizedReturn / annualizedVol;

  return {
    metrics: {
      totalReturnPct: totalReturn * 100,
      annualizedReturnPct: annualizedReturn * 100,
      annualizedVolPct: annualizedVol * 100,
      sharpe,
      maxDrawdownPct: Math.abs(maxDrawdown) * 100,
      winRatePct: exposedBars === 0 ? 0 : (winningBars / exposedBars) * 100,
      exposurePct: ((series.length - 1) === 0 ? 0 : exposedBars / (series.length - 1)) * 100,
      tradeCount
    },
    equityCurve,
    signals,
    warnings
  };
}
