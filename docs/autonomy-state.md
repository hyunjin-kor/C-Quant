# Autonomy State

This file is the handoff ledger for repeated autonomous development rounds.

## Mission

- Ship C-Quant as a trustworthy all-in-one carbon intelligence terminal for EU ETS, K-ETS, and China ETS.
- Keep official anchors, source freshness, linked/proxy boundaries, and local copilot grounding visible.
- Do not drift into brokerage, execution, custody, or individualized trade guidance.

## Loop Rules

- Close one meaningful product gap per cycle instead of scattering across many partial edits.
- Verify before claiming a round is complete.
- Record what changed, what failed, and what the next round should do.
- If a claim depends on live public facts, re-check the official source path and freshness label.

## Active Loop Queue

- [ ] Finish KO / EN parity for remaining provider, source-note, and data-driven strings. Current cycle closed the App-surface exact-key gap; visual cleanup still remains.
- [ ] Break `src/App.tsx` into smaller surface components so future rounds carry less regression risk.
- [x] Add a repeatable Electron or UI smoke check instead of relying on manual visual inspection.
- [ ] Tighten local copilot answers so every response carries clearer evidence and fact-vs-inference boundaries.
- [ ] Refresh historical product docs that still describe removed CSV, backtest, or walk-forward flows.

## Current Risks

- Some Korean UI paths can still show English in runtime payloads or deeper data-driven note text.
- Packaged launch verification now has a repeatable smoke gate, but full DOM-level browser automation is still limited on this machine because Playwright MCP cannot create its system directory.
- `src/App.tsx` remains large enough that small visual changes can have broad side effects.

## Latest Verified Baseline

- `npm.cmd run build`
- `npm.cmd run package:dir`
- `npm.cmd run package:portable`
- `npm.cmd run smoke:release`
- Latest packaging baseline verified on 2026-04-18 after adding the packaged-app smoke gate.

## Latest Cycle Snapshot
<!-- AUTONOMY:LAST-RUN:START -->
- Timestamp: 2026-04-18 20:48:31 +09:00
- Goal: Add a repeatable packaged-app smoke gate
- Focus: Verify both `win-unpacked` and portable artifacts create a `C-Quant` window and survive a short stability window
- Overall verification status: green
- Verification:
- `npm.cmd run build`: passed in 0.76s
- `npm.cmd run package:dir`: passed
- `npm.cmd run package:portable`: passed
- `npm.cmd run smoke:release`: passed
- Dirty files at cycle end: 25
- First open queue item: Finish KO / EN parity for remaining provider, source-note, and data-driven strings. Current cycle closed the App-surface exact-key gap; visual cleanup still remains.
- Full report: .autonomy/latest-cycle.md
<!-- AUTONOMY:LAST-RUN:END -->

## Next-Turn Contract

- Read this file first.
- Read `git status --short` before making assumptions.
- Pick the highest-value unchecked queue item unless a newer blocker is more urgent.
- Update the `Latest Cycle Snapshot` before ending the turn.
- If a queue item is completed, change it from `[ ]` to `[x]` in the same turn.

## Re-entry Prompt

Use this when you want the next round to continue without re-explaining the project:

> Read `docs/autonomy-state.md`, inspect `git status --short`, advance the highest-priority unchecked item, verify the result, and update `docs/autonomy-state.md` before stopping.
