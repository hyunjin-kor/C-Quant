# Roadmap — 2026 H2

Written 2026-07-20, after the v1.4.0 hygiene round. This is the working plan for
the second half of 2026, ordered by deadline pressure first and leverage second.
Scope stays inside the product boundary: research, monitoring, and briefing —
no execution, no custody, no individualized trade instructions.

## Now — deadlines already on the clock

| Item | Deadline | Why |
| --- | --- | --- |
| Calibration review round | ~~2026-07-28~~ done 2026-07-20 | Both freshness stamps advanced after the anchors/event-log review; the 90-day gate next trips ~2026-10-18. |
| External-link audit | ~~2026-08-05~~ done 2026-07-20 | Completed early: all 157 data-layer URLs fetch-verified in the 2026-07-20 data-reliability round (next quarterly pass due 2026-10). |
| Source freshness round | ~~with the above~~ done 2026-07-20 | All data-layer `accessed`/`reviewedAt` stamps restamped after actual re-verification in the 2026-07-20 audit (four unreachable community URLs keep their last-good dates). |

## Q3 — data depth (the real quantum jump)

The model's ceiling is set by its evidence base, not its code. Three moves raise it:

1. **Extend the price anchor series past 2025-06.** Done 2026-07-20 — monthly
   anchors now run through 2026-06 for all three markets, collected from
   verified public records (ICAP API, KRX close reports, CNEEEX bulletins).
   Next extension due when the 2026-H2 months close.
2. **Promote the one-observation scenarios to `backtest`.** Done 2026-07-20 —
   verified MEE events added for the last two China scenarios; every scenario
   with logged events (15 of 21) is now `backtest`.
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
