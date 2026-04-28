# Autonomy State

This file is the handoff ledger for repeated autonomous development rounds.

## Mission

- Ship C-Quant as a trustworthy all-in-one carbon intelligence terminal for EU ETS, K-ETS, and China ETS.
- Keep official anchors, source freshness, linked/proxy boundaries, and evidence grounding visible.
- Do not drift into brokerage, execution, custody, or individualized trade guidance.

## Loop Rules

- Close one meaningful product gap per cycle instead of scattering across many partial edits.
- Verify before claiming a round is complete.
- Record what changed, what failed, and what the next round should do.
- If a claim depends on live public facts, re-check the official source path and freshness label.

## Active Loop Queue

- [ ] Finish KO / EN parity for remaining provider, source-note, benchmark, driver, official-source, and data-driven strings; older long-form detail strings still need a visual pass.
- [x] Apply the approved V1 product contract from [docs/superpowers/specs/2026-04-20-desktop-decision-terminal-design.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/specs/2026-04-20-desktop-decision-terminal-design.md>) by extracting `Command`, `Desk`, and `Sources` into stable surface modules.
- [x] Break `src/App.tsx` into smaller surface components so future rounds carry less regression risk.
- [x] Add a CircleCI Windows release gate for build and desktop packaging after the surface contract extraction is stable.
- [ ] Create canonical Figma screens for the four primary surfaces after the React contracts stabilize.
- [ ] Create a downstream Canva story deck only after the product and Figma contracts are stable.
- [x] Add a repeatable Electron or UI smoke check instead of relying on manual visual inspection.
- [x] Expand commercial benchmark coverage and add buyer/community signals to the product frame.
- [x] Tighten evidence summaries so every response carries clearer evidence and fact-vs-inference boundaries.
- [x] Remove the retired chat surface and keep briefing support evidence-only.
- [ ] Refresh historical product docs that still describe removed CSV, backtest, or walk-forward flows.

## Current Risks

- Some Korean UI paths can still show English or mojibake in older long-form details; current fixed labels, decision summaries, official-source helpers, checklist helpers, market notes, source-registry metadata, and live-comparison helpers are covered.
- The V1 `Command`, `Desk`, and `Sources` paths are extracted, but `Drivers`, `Inspector`, and a large amount of shared preparation logic still leave `src/App.tsx` larger and riskier than it should be.
- Packaged launch verification has a repeatable smoke gate, but full DOM-level browser automation is still limited on this machine because Playwright MCP cannot create its system directory.
- `package:dir` can still hit a transient Windows file lock if packaging commands race on `dist` or `win-unpacked`; serial reruns succeeded in this cycle and prior ones.
- Vite still warns about the deprecated `esbuild` option from `vite:react-swc` and large output chunks, and Electron packaging still emits the known `shell option true` deprecation warning.

## Latest Planning Artifacts

- V1 design spec: [docs/superpowers/specs/2026-04-20-desktop-decision-terminal-design.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/specs/2026-04-20-desktop-decision-terminal-design.md>)
- V1 implementation plan: [docs/superpowers/plans/2026-04-20-desktop-decision-terminal-v1.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-20-desktop-decision-terminal-v1.md>)
- KO / EN parity slice plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-copy.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-copy.md>)
- KO / EN parity helper sweep plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-helper-sweep.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-helper-sweep.md>)
- KO / EN parity helper normalization plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-normalization.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-official-source-error-normalization.md>)
- KO / EN parity input-coverage field-description context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-input-coverage-field-description-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-input-coverage-field-description-context.md>)
- KO / EN parity research-driver metadata context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-research-driver-metadata-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-research-driver-metadata-context.md>)
- KO / EN parity connected-source status context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-connected-source-status-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-connected-source-status-context.md>)
- KO / EN parity input-coverage field-priority context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-input-coverage-field-priority-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-input-coverage-field-priority-context.md>)
- KO / EN parity connected-source metric-label context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-connected-source-metric-label-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-connected-source-metric-label-context.md>)
- KO / EN parity chat-grounding metadata context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-chat-grounding-metadata-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-chat-grounding-metadata-context.md>)
- KO / EN parity quote-provider helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-quote-provider-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-quote-provider-helper-context.md>)
- KO / EN parity quote-label helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-quote-label-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-quote-label-helper-context.md>)
- KO / EN parity quote-note-role helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-quote-note-role-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-quote-note-role-helper-context.md>)
- KO / EN parity quote-delay-note helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-quote-delay-note-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-quote-delay-note-helper-context.md>)
- KO / EN parity live-quote-unavailable helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-live-quote-unavailable-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-live-quote-unavailable-helper-context.md>)
- KO / EN parity quote-history-error helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-quote-history-error-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-quote-history-error-helper-context.md>)
- KO / EN parity assistant-provider helper context plan: [docs/superpowers/plans/2026-04-24-ko-en-parity-assistant-provider-helper-context.md](</C:/Users/user/Desktop/C-Quant/docs/superpowers/plans/2026-04-24-ko-en-parity-assistant-provider-helper-context.md>)

## Latest Verified Baseline

- `node --test tests/localization.test.mjs tests/localization-official-connection-error-normalization.test.mjs tests/localization-research-driver-category.test.mjs tests/localization-market-input-field-description.test.mjs tests/localization-research-driver-metadata.test.mjs tests/localization-connected-source-status.test.mjs tests/localization-market-input-field-priority.test.mjs tests/localization-connected-source-metric-label.test.mjs tests/localization-chat-grounding-metadata.test.mjs tests/localization-quote-provider.test.mjs tests/localization-quote-labels.test.mjs tests/localization-quote-note-role.test.mjs tests/localization-quote-delay-note.test.mjs tests/localization-live-quote-unavailable-note.test.mjs tests/localization-quote-history-error.test.mjs tests/localization-assistant-provider.test.mjs`
- `npm.cmd run build`
- `node --check main.js`
- `node --check preload.js`
- `npm.cmd run package:dir`
- `npm.cmd run package:portable`
- Latest release-contract baseline verified on 2026-04-24 after localizing assistant-provider helper copy through [src/lib/localization.ts](/C:/Users/user/Desktop/C-Quant/src/lib/localization.ts:1353) and [src/App.tsx](/C:/Users/user/Desktop/C-Quant/src/App.tsx:827), plus adding [tests/localization-assistant-provider.test.mjs](/C:/Users/user/Desktop/C-Quant/tests/localization-assistant-provider.test.mjs:1).
- Most recent `npm.cmd run smoke:portable`: passed on 2026-04-20 during cycle 30.
- A targeted `npx.cmd tsc --noEmit --ignoreDeprecations 6.0` check still shows broader pre-existing type debt in `src/App.tsx`, `src/components/InteractiveMarketChart.tsx`, `src/data/locales.ts`, and `src/main.tsx`.

## Latest Cycle Snapshot
<!-- AUTONOMY:LAST-RUN:START -->
- Timestamp: 2026-04-24 22:48:31 +09:00
- Goal: Continue `ko-en-parity` by hardening assistant-provider wording through a shared localization helper
- Focus: Add a failing regression test for assistant-provider labels, move that enum mapping into `src/lib/localization.ts`, route the App helper through it, and rerun the release-contract verification
- Overall verification status: passed
- Verification:
- `node --test tests/localization.test.mjs tests/localization-official-connection-error-normalization.test.mjs tests/localization-research-driver-category.test.mjs tests/localization-market-input-field-description.test.mjs tests/localization-research-driver-metadata.test.mjs tests/localization-connected-source-status.test.mjs tests/localization-market-input-field-priority.test.mjs tests/localization-connected-source-metric-label.test.mjs tests/localization-chat-grounding-metadata.test.mjs tests/localization-quote-provider.test.mjs tests/localization-quote-labels.test.mjs tests/localization-quote-note-role.test.mjs tests/localization-quote-delay-note.test.mjs tests/localization-live-quote-unavailable-note.test.mjs tests/localization-quote-history-error.test.mjs tests/localization-assistant-provider.test.mjs`: passed
- `npm.cmd run build`: passed
- `node --check main.js`: passed
- `node --check preload.js`: passed
- `npm.cmd run package:dir`: passed
- `npm.cmd run package:portable`: passed
- Workspace dirty state: The workspace still carries earlier product edits plus this round's parity changes, prior CI and docs work, and autonomy updates.
- First open queue item: Finish KO / EN parity for remaining provider, source-note, and data-driven strings.
- Full report: `.autonomy/latest-cycle.md`
<!-- AUTONOMY:LAST-RUN:END -->

## Next-Turn Contract

- Read this file first.
- Read `git status --short` before making assumptions.
- Pick the highest-value unchecked queue item unless a newer blocker is more urgent.
- Update the `Latest Cycle Snapshot` before ending the turn.
- If a queue item is completed, change it from `[ ]` to `[x]` in the same turn.

## Re-entry Prompt

Use this when you want the next round to continue without re-explaining the project:

> Read `docs/autonomy-state.md`, inspect `git status --short`, advance `ko-en-parity` unless a higher blocker appears, verify the result, and update `docs/autonomy-state.md` before stopping.
