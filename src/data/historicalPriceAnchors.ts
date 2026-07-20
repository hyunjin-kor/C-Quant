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
  { date: "2025-06-30", close: 72 },
  // 2025-07 .. 2026-06 extension (added 2026-07-20). Primary bulk source:
  // ICAP Allowance Price Explorer secondary-market EUR series (public JSON
  // API), cross-checked to the cent against Advantag broker weekly reports
  // and gmk.center / Carbon Pulse press coverage. The benchmark rolls from
  // the Dec-2025 to the Dec-2026 ICE contract in mid-December 2025. The
  // 2026-04 and 2026-06 entries are final-week closes rather than exact
  // last-day settles (ICAP series gap); both corroborated by press.
  { date: "2025-07-31", close: 73 },
  { date: "2025-08-29", close: 73 },
  { date: "2025-09-30", close: 76 },
  { date: "2025-10-31", close: 79 },
  { date: "2025-11-28", close: 83 },
  { date: "2025-12-31", close: 87 },
  { date: "2026-01-30", close: 81 },
  { date: "2026-02-27", close: 70 },
  { date: "2026-03-31", close: 73 },
  { date: "2026-04-30", close: 74 },
  { date: "2026-05-29", close: 81 },
  { date: "2026-06-30", close: 80 }
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
  { date: "2025-06-30", close: 9500 },
  // 2025-07 .. 2026-06 extension (added 2026-07-20). Source: Daily eNews
  // same-day KRX close reports (per-article closing-price sentences),
  // cross-checked against ekn.kr / electimes monthly recaps. Exact
  // last-trading-day closes, not rounded to hundreds like the earlier
  // press-level entries. The covered benchmark vintage rolls KAU24 ->
  // KAU25 between 2025-08 and 2025-09; the ~1,000 KRW step at that
  // boundary is the vintage roll, not a pure price move (same convention
  // as the EUA front-month roll above).
  { date: "2025-07-31", close: 8420 },
  { date: "2025-08-29", close: 9490 },
  { date: "2025-09-30", close: 10500 },
  { date: "2025-10-31", close: 10400 },
  { date: "2025-11-28", close: 11000 },
  { date: "2025-12-30", close: 10400 },
  { date: "2026-01-30", close: 12400 },
  { date: "2026-02-27", close: 13750 },
  { date: "2026-03-31", close: 15600 },
  { date: "2026-04-30", close: 17050 },
  { date: "2026-05-29", close: 24550 },
  { date: "2026-06-30", close: 22800 }
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
  { date: "2025-06-30", close: 88 },
  // 2025-07 .. 2026-06 extension (added 2026-07-20). Series: CEA
  // comprehensive price (综合价格) close, the level quoted by CNEEEX, MEE,
  // and press. Sources: CNEEEX daily bulletins (overview.cneeex.com) and
  // Xinhua-Finance reposts of the same bulletins, cross-checked against
  // carbonmarket.cn weekly tables and ccn.ac.cn per-vintage tables.
  // 2026-02 (80.50) and 2026-04 (79.50) sit on the half-yuan; integers
  // are rounded half-up.
  { date: "2025-07-31", close: 72 },
  { date: "2025-08-29", close: 69 },
  { date: "2025-09-30", close: 58 },
  { date: "2025-10-31", close: 52 },
  { date: "2025-11-28", close: 60 },
  { date: "2025-12-31", close: 75 },
  { date: "2026-01-30", close: 79 },
  { date: "2026-02-27", close: 81 },
  { date: "2026-03-31", close: 80 },
  { date: "2026-04-30", close: 80 },
  { date: "2026-05-29", close: 81 },
  { date: "2026-06-30", close: 83 }
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
