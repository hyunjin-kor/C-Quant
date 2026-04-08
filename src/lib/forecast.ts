import { marketProfiles } from "../data/research";
import type { ForecastResult, MarketProfile } from "../types";

export function getMarketProfile(marketId: MarketProfile["id"]): MarketProfile {
  const profile = marketProfiles.find((market) => market.id === marketId);

  if (!profile) {
    throw new Error(`Unknown market: ${marketId}`);
  }

  return profile;
}

export function buildForecast(
  marketId: MarketProfile["id"],
  state: Record<string, number>
): ForecastResult {
  const profile = getMarketProfile(marketId);
  const contributions = profile.drivers.map((driver) => {
    const raw = state[driver.id] ?? 0;
    const normalizedDirection =
      driver.direction === "lower" ? -1 : driver.direction === "higher" ? 1 : 1;

    return {
      driverId: driver.id,
      variable: driver.variable,
      contribution: raw * driver.weight * normalizedDirection
    };
  });

  const score = contributions.reduce(
    (sum, entry) => sum + entry.contribution,
    0
  );

  const direction =
    score > 0.85 ? "Bullish" : score < -0.85 ? "Bearish" : "Neutral";

  const activeDrivers = contributions.filter(
    (entry) => Math.abs(entry.contribution) > 0.05
  ).length;
  const totalWeight = profile.drivers.reduce((sum, driver) => sum + driver.weight, 0);
  const confidence = Math.min(
    0.95,
    Math.max(
      0.2,
      Math.abs(score) / Math.max(totalWeight * 0.45, 1) +
        activeDrivers / Math.max(profile.drivers.length * 4, 1)
    )
  );

  return {
    score,
    direction,
    confidence,
    contributions: contributions.sort(
      (left, right) => Math.abs(right.contribution) - Math.abs(left.contribution)
    )
  };
}
