/**
 * Historical price anchors for the event-study calibration.
 *
 * Honest scope:
 * - Each entry is a small, deliberately-low-resolution public anchor that
 *   the event-study uses to compute relative reactions. They are NOT
 *   intended as the source of truth for the operator UI; the desktop
 *   app fetches its live prices from the connected sources.
 * - Values are MONTHLY closing-level public anchors (rounded to whole
 *   currency units) drawn from widely-reported public press coverage of
 *   ICE EUA front-month futures, KAU close at KRX, and the Shanghai
 *   Environment & Energy Exchange daily overview.
 * - Operators must verify the anchors against the original primary
 *   record before using the calibration in any regulated workflow.
 *
 * This file is the only place we hard-code a price level. Updating an
 * entry requires a CHANGELOG note. See docs/COMPLIANCE.md §6.
 */

export type HistoricalPriceAnchor = { date: string; close: number };

/**
 * EUA front-month proxy series. Values are rounded to whole EUR and
 * spaced monthly so the event-study returns are dominated by the actual
 * regime shifts, not by intra-month noise. Provenance: public press
 * coverage of ICE EUA / EEX auction settlement (broadly consistent
 * monthly closes).
 */
export const EU_ETS_PRICE_ANCHORS: HistoricalPriceAnchor[] = [
  { date: "2018-04-30", close: 14 },
  { date: "2018-05-31", close: 16 },
  { date: "2019-12-31", close: 25 },
  { date: "2020-01-31", close: 25 },
  { date: "2020-02-28", close: 24 },
  { date: "2020-03-31", close: 18 },
  { date: "2020-04-30", close: 21 },
  { date: "2020-12-31", close: 33 },
  { date: "2021-06-30", close: 56 },
  { date: "2021-07-30", close: 53 },
  { date: "2021-08-31", close: 61 },
  { date: "2021-09-30", close: 65 },
  { date: "2021-10-29", close: 60 },
  { date: "2021-11-30", close: 75 },
  { date: "2021-12-31", close: 80 },
  { date: "2022-01-31", close: 88 },
  { date: "2022-02-28", close: 87 },
  { date: "2022-03-31", close: 78 },
  { date: "2022-07-29", close: 82 },
  { date: "2022-08-31", close: 92 },
  { date: "2022-09-30", close: 67 },
  { date: "2022-12-30", close: 84 },
  { date: "2023-03-31", close: 92 },
  { date: "2023-09-29", close: 81 },
  { date: "2023-10-31", close: 80 },
  { date: "2024-02-29", close: 56 },
  { date: "2024-03-29", close: 60 },
  { date: "2024-04-30", close: 71 },
  { date: "2024-08-30", close: 73 },
  { date: "2024-12-31", close: 70 },
  { date: "2025-04-30", close: 68 },
  { date: "2025-05-30", close: 73 },
  { date: "2025-06-30", close: 72 }
];

/**
 * K-ETS KAU monthly closing-level anchor. Provenance: KRX ETS Information
 * Platform monthly summaries. Currency is KRW.
 */
export const K_ETS_PRICE_ANCHORS: HistoricalPriceAnchor[] = [
  { date: "2020-01-31", close: 39000 },
  { date: "2020-02-28", close: 38500 },
  { date: "2020-12-31", close: 27500 },
  { date: "2022-12-30", close: 19500 },
  { date: "2023-02-28", close: 13500 },
  { date: "2023-03-31", close: 12500 },
  { date: "2023-09-29", close: 9000 },
  { date: "2023-12-29", close: 8500 },
  { date: "2024-01-31", close: 8200 },
  { date: "2024-02-29", close: 8800 },
  { date: "2024-03-29", close: 8500 },
  { date: "2024-12-31", close: 9000 },
  { date: "2025-04-30", close: 9300 },
  { date: "2025-06-30", close: 9500 }
];

/**
 * China national ETS (HBEA / SHEEX-cleared) monthly closing anchor.
 * Provenance: Shanghai Environment and Energy Exchange daily overview
 * monthly summaries. Currency is CNY.
 */
export const CN_ETS_PRICE_ANCHORS: HistoricalPriceAnchor[] = [
  { date: "2021-07-30", close: 50 },
  { date: "2021-08-31", close: 47 },
  { date: "2021-12-31", close: 54 },
  { date: "2022-08-31", close: 58 },
  { date: "2022-12-30", close: 56 },
  { date: "2023-09-29", close: 70 },
  { date: "2023-12-29", close: 72 },
  { date: "2024-08-30", close: 92 },
  { date: "2024-09-30", close: 95 },
  { date: "2024-12-31", close: 100 },
  { date: "2025-06-30", close: 88 }
];

/**
 * Cross-market shared anchor. Reused for "shared" scenario events.
 * Defaults to EU price anchors because most listed-proxy / multi-commodity
 * stress events trace back to the EU benchmark.
 */
export const SHARED_PRICE_ANCHORS: HistoricalPriceAnchor[] = EU_ETS_PRICE_ANCHORS;

export function getPriceAnchorsByMarket(): Record<string, HistoricalPriceAnchor[]> {
  return {
    "eu-ets": EU_ETS_PRICE_ANCHORS,
    "k-ets": K_ETS_PRICE_ANCHORS,
    "cn-ets": CN_ETS_PRICE_ANCHORS,
    shared: SHARED_PRICE_ANCHORS
  };
}
