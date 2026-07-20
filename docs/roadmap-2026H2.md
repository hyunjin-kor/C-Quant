# Roadmap — 2026 H2

Written 2026-07-20, after the v1.4.0 hygiene round. This is the working plan for
the second half of 2026, ordered by deadline pressure first and leverage second.
Scope stays inside the product boundary: research, monitoring, and briefing —
no execution, no custody, no individualized trade instructions.

## Now — deadlines already on the clock

| Item | Deadline | Why |
| --- | --- | --- |
| Calibration review round | 2026-07-28 | `REVIEWED_AT` is 2026-04-29; the 90-day gate in `calibration:check` fails CI after this date. Requires a real pass over the 21 scenarios and the event log, not just a date bump. |
| Link registry audit | 2026-08-05 | `docs/project-links.md` self-imposed quarterly audit. |
| Source freshness round | with the above | The `accessed` stamps in `src/data/platform.ts` (2026-04-09), `docs/research.md` (2026-04-08), and the benchmark map (2026-04-11) are ~100 days old. Re-verify each source and restamp; Truth Rules forbid restamping without re-verification. |

## Q3 — data depth (the real quantum jump)

The model's ceiling is set by its evidence base, not its code. Three moves raise it:

1. **Extend the price anchor series past 2025-06.** `historicalPriceAnchors.ts`
   stops there, which caps event-study precision for every 2025 H2 / 2026 event
   already in the log. Needs operator-supplied monthly closes from primary
   sources (EEX, KRX, SEEE) — deliberately not automatable under the
   no-fabrication rule. This single dataset unblocks re-scoring of ~9 logged
   events currently evaluated against a truncated series.
2. **Promote the 4 one-observation scenarios to `backtest`.** Each needs one more
   codified event. Candidate events should come out of the calibration review
   round above.
3. **First `calibrated` promotion.** Governance exists (`docs/COMPLIANCE.md`) but
   has never been exercised. Pick the strongest backtest scenario
   (multiplier spread already 0.50–1.86), do the model-owner review, and
   document it. Getting one scenario through the full pipeline proves the
   provenance ladder end to end.

## Q3/Q4 — live data reach

- **KRX Open API**: move from the sample endpoint to a keyed daily flow
  (`CQUANT_KRX_AUTH_KEY` plumbing already exists; needs a verified key and a
  documented official quota).
- **China layer**: stays bulletin-first until an official daily feed proves
  stable from a Korean network vantage point. Re-test SEEE reachability
  quarterly; keep the `linked tape` label meanwhile.
- **Alerting**: the detector already computes active patterns; surface them as
  optional desktop notifications with the same evidence trail. No new model
  work required.

## Q4 — distribution

- **Code signing** (`docs/` has the setup guide from Phase 4): removes the
  SmartScreen warning, which is the single biggest first-run friction.
- **Auto-update channel hardening**: electron-updater is wired; needs a signed
  release to be safely turned on by default.
- **macOS from advisory to supported** only if a second maintainer materializes;
  otherwise it stays advisory — an unsupported platform promise is worse than
  none.

## Standing constraints

- Every stamp refresh requires actually re-touching the source (Truth Rules).
- Institutional adapters stay `not-configured` without credentials.
- Scenario output stays bounded: research support, not a calibrated live price
  target.
