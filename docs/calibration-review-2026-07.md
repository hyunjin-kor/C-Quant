# Calibration review round — 2026-07-20

Evidence note backing the `REVIEWED_AT = "2026-07-20"` stamp in
[src/data/catalystCalibration.ts](../src/data/catalystCalibration.ts).
Review performed by a Claude agent session under operator instruction
(operator: hyunjin.kang). Previous review: 2026-04-29.

## Scope

1. Integrity of the 35-entry event log against the 21-scenario set.
2. Extension of the historical price anchors from 2025-06 through
   2026-06 for all three markets (36 new month-end values), so the three
   events dated after 2025-06-30 stop being silently dropped by the
   event study.
3. Re-run of the event study and re-statement of the provenance mix in
   the model card, README, and CHANGELOG.

Out of scope (unchanged since 2026-04-29): per-scenario threshold
values, scenario source citations, detector logic, the event-study
formula itself.

## 1. Event-log integrity

New regression tests in
[tests/catalystEventLog.integrity.test.ts](../tests/catalystEventLog.integrity.test.ts):

- every event maps to an existing scenario — pass (0 orphans);
- every event's market is covered by its scenario's `marketIds` — pass
  (0 mismatches);
- all `observedAt` dates are valid ISO dates, none in the future — pass.

## 2. Anchor extension (2025-07 .. 2026-06)

Values were collected on 2026-07-20 by web-research agents with a
no-fabrication instruction (every value must come from a fetched source;
unverifiable months return null — none did). Access method and the
month-end convention are documented inline in
[src/data/historicalPriceAnchors.ts](../src/data/historicalPriceAnchors.ts).

| Market | Series | Bulk source | Cross-checks |
| --- | --- | --- | --- |
| EU (EUR) | ICE EUA benchmark future | ICAP Allowance Price Explorer public JSON API (9 of 12 months) | Advantag broker weekly closes, gmk.center, Carbon Pulse; three points match to the cent |
| KR (KRW) | KAU close at KRX | Daily eNews same-day KRX close reports (12 of 12, per-article closing sentence quoted) | ekn.kr and electimes monthly recaps match Dec-25 / Feb-26 / Apr-26 exactly |
| CN (CNY) | CEA comprehensive price (综合价格) | CNEEEX daily bulletins + Xinhua Finance reposts | carbonmarket.cn weekly tables, ccn.ac.cn per-vintage tables, ClearBlue Markets |

Known caveats, accepted and documented in the data file:

- **EU**: benchmark rolls Dec-2025 → Dec-2026 contract mid-December
  2025; the 2026-04 and 2026-06 entries are final-week closes (ICAP
  series gap), corroborated by press.
- **KR**: covered vintage rolls KAU24 → KAU25 between 2025-08 and
  2025-09; the ~1,000 KRW step at that boundary is the roll, not a price
  move (same convention as the EUA front-month roll). New entries are
  exact last-day closes, unlike the hundreds-rounded older entries.
- **CN**: comprehensive-price series (the level quoted by CNEEEX, MEE,
  and press); 2026-02 (80.50) and 2026-04 (79.50) sit on the half-yuan
  and are rounded half-up.

## 3. Event-study outcome

Previously unscored events now evaluated: `kr-2024-surrender-2025`
(2025-08-31), `cn-mee-progress-report-2025` (2025-09-27),
`eu-cbam-definitive-start-2026` (2026-01-01).

Provenance mix moved from 12 `backtest` / 9 `heuristic` (3 with one
observation) to **13 `backtest` / 8 `heuristic` (2 with one
observation); still 0 `calibrated`**. `cn-mee-sector-expansion` is the
first China scenario to reach `backtest` (2 observations). Multiplier
spread widened from 0.50–1.86 to **0.50–2.00** (`eu-compliance-cbam-stack`
now sits at the clamp ceiling). All 222 unit tests pass against the new
anchors, including the invariant that `calibrated` status requires
backtest evidence.

## Addendum — same-day data-reliability round (2026-07-20)

A full source audit (all 157 data-layer URLs fetched and judged) ran the
same day and corrected the log:

- **Factual corrections**: the EU surrender events were rebuilt around
  the real post-2023/959 deadline (30 September, not 30 April) —
  `eu-compliance-2024` moved to 2024-09-16 and `eu-2024-surrender-2025`
  to 2025-09-30. The TNAC-publication event was removed (it
  double-counted the 2025-05-28 MSR communication and cited the retired
  15-May deadline). `kr-liquidity-measures-2024` was downgraded to
  `reported` (its cited MOE release actually documents the 2025 access
  expansion and now backs `kr-financial-cap-relaxation-2025`), and
  `cn-ccer-restart-2024` to `reported` (its stats outrun the cited 2022
  paper). ETS2 wording now reflects the 2027→2028 launch delay.
- **Additions**: two MEE-primary-source China events
  (`cn-2023-2024-allocation-delay-2024`, `cn-ccer-methodologies-2023`),
  promoting the last two one-observation scenarios.
- **Post-addendum mix**: 36 events; **15 of 21 scenarios `backtest`**
  (every scenario with logged events), 6 `heuristic` with no events, 0
  `calibrated`. New guard: event-id uniqueness test (a duplicate CBAM id
  was found and renamed).
- Dead/miscited links replaced across the data layer (World Bank, BOK,
  ICAP slug, EEX API PDF, a fabricated ScienceDirect PII, a retired
  RePEc handle); nine citation mismatches in the research catalogue
  fixed (wrong author attributions incl. Yoon & Karali 2025 and Günther
  et al. 2025). All verified stamps restamped to 2026-07-20; the four
  unreachable community URLs keep their last-good dates.

## Follow-ups for the next round

- `cn-quota-distribution-delay` and `cn-q4-ccer-substitution` each need
  one more codified event to reach `backtest`.
- First `backtest` → `calibrated` promotion still requires a model-owner
  review (roadmap Q3 item).
- The KAU24→KAU25 roll sits inside the post-window of
  `kr-2024-surrender-2025`; if a future round pins per-vintage series,
  re-score that event.
