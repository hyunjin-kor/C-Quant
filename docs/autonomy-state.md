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

- [ ] Finish KO / EN parity for remaining provider, source-note, benchmark, driver, official-source, and data-driven strings; older long-form detail strings still need a visual pass. *(Code-level audit clean as of 2026-05-06: zero raw Korean literals bypassing localization helpers in `src/components/surfaces/`; all `ko: "..."` entries in [src/data/locales.ts](../src/data/locales.ts) have a paired `en: "..."` (Node-script asymmetry check). 53/53 regression tests passing across 15 helper slices. Remaining work is purely a runtime visual pass on long-form detail strings — wording quality, not missing translations.)*
- [x] Apply the approved V1 product contract by extracting `Command`, `Desk`, and `Sources` into stable surface modules. (Historical V1 design spec was kept locally; not committed to repo.)
- [x] Break `src/App.tsx` into smaller surface components so future rounds carry less regression risk.
- [x] Add a CircleCI Windows release gate for build and desktop packaging after the surface contract extraction is stable.
- [ ] Create canonical Figma screens for the four primary surfaces after the React contracts stabilize. *(External deliverable — not advanceable from a code-only autonomous cycle. React contracts under [src/components/surfaces/](../src/components/surfaces) are stable; the blocker is producing the Figma artefacts and committing their links to [docs/project-links.md](project-links.md).)*
- [ ] Create a downstream Canva story deck only after the product and Figma contracts are stable. *(External deliverable; gated on the Figma item above.)*
- [x] Add a repeatable Electron or UI smoke check instead of relying on manual visual inspection.
- [x] Expand commercial benchmark coverage and add buyer/community signals to the product frame.
- [x] Tighten evidence summaries so every response carries clearer evidence and fact-vs-inference boundaries.
- [x] Remove the retired chat surface and keep briefing support evidence-only.
- [x] Refresh historical product docs that still describe removed CSV, backtest, or walk-forward flows. (Done 2026-05-05: [docs/product-strategy.md](product-strategy.md) Current Interface Architecture, Autonomous Build Plan, Harness Engineering, and Confirmed Core Source Strategy sections refreshed; retired Lab surface explicitly noted; aspirational vs wired sources separated.)

## Current Risks

- **Cycle 30 ledger inconsistency (uncovered 2026-05-06)**: The auto-managed Latest Cycle Snapshot below claims cycle 30 added a `localizeAssistantProvider` helper to [src/lib/localization.ts](../src/lib/localization.ts) and committed `tests/localization-assistant-provider.test.mjs`. Neither artefact is present on this branch (`grep -rn 'assistantProvider' src/` returns 0 hits; `ls tests/localization*.test.mjs | wc -l` returns 15, not 16). The Verified Baseline above has been corrected to drop the phantom test file. Either cycle 30's reporter wrote the ledger entry before committing, or the work was reverted. Treat the auto-block below as historical and not authoritative for the assistant-provider claim.
- Some Korean UI paths can still show English or mojibake in older long-form details; current fixed labels, decision summaries, official-source helpers, checklist helpers, market notes, source-registry metadata, and live-comparison helpers are covered.
- The V1 `Command`, `Desk`, and `Sources` paths are extracted, but `Drivers`, `Inspector`, and a large amount of shared preparation logic still leave `src/App.tsx` larger and riskier than it should be.
- Packaged launch verification has a repeatable smoke gate, but full DOM-level browser automation is still limited on this machine because Playwright MCP cannot create its system directory.
- `package:dir` can still hit a transient Windows file lock if packaging commands race on `dist` or `win-unpacked`; serial reruns succeeded in this cycle and prior ones.
- Vite still warns about the deprecated `esbuild` option from `vite:react-swc` and large output chunks, and Electron packaging still emits the known `shell option true` deprecation warning.

## Latest Planning Artifacts

The earlier autonomy rounds tracked V1 design / implementation specs and ~16 KO/EN parity context plans under `docs/superpowers/specs/` and `docs/superpowers/plans/`. Those planning artifacts were never committed to the repository and the directory does not exist on `main` as of 2026-05-05.

The work they described — V1 surface extraction (`Command` / `Desk` / `Sources`) and the KO/EN parity sweeps — is reflected in the current source under [src/App.tsx](../src/App.tsx), the extracted surface modules in [src/components/surfaces/](../src/components/surfaces) (`CommandSurface.tsx`, `DeskSurface.tsx`, `SourcesSurface.tsx`), and [src/lib/localization.ts](../src/lib/localization.ts). Use those as the live reference instead of the missing planning files. Future planning artifacts should be committed under `docs/` so the autonomy ledger stays self-contained.

## Latest Verified Baseline

The 15 KO/EN parity test files actually present in [tests/](../tests):

- `node --test tests/localization.test.mjs tests/localization-official-connection-error-normalization.test.mjs tests/localization-research-driver-category.test.mjs tests/localization-market-input-field-description.test.mjs tests/localization-research-driver-metadata.test.mjs tests/localization-connected-source-status.test.mjs tests/localization-market-input-field-priority.test.mjs tests/localization-connected-source-metric-label.test.mjs tests/localization-chat-grounding-metadata.test.mjs tests/localization-quote-provider.test.mjs tests/localization-quote-labels.test.mjs tests/localization-quote-note-role.test.mjs tests/localization-quote-delay-note.test.mjs tests/localization-live-quote-unavailable-note.test.mjs tests/localization-quote-history-error.test.mjs`
- `npm run build`
- `node --check main.js`
- `node --check preload.js`
- `npm run package:dir`
- `npm run package:portable`
- Most recent `npm run smoke:portable`: passed on 2026-04-20 during cycle 30.
- A targeted `npx tsc --noEmit --ignoreDeprecations 6.0` check still shows broader pre-existing type debt in `src/App.tsx`, `src/components/InteractiveMarketChart.tsx`, and `src/main.tsx`.

**Ledger correction (2026-05-06)**: The earlier baseline note credited cycle 30 with adding a `localizeAssistantProvider` helper to [src/lib/localization.ts](../src/lib/localization.ts) plus `tests/localization-assistant-provider.test.mjs`. As of 2026-05-06 grep, neither artefact exists in the repository — see [Current Risks](#current-risks). The phantom test reference and accompanying narrative were removed from this section above; the auto-managed Latest Cycle Snapshot block below still carries the original cycle 30 report (it gets overwritten on the next autonomy cycle).

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
