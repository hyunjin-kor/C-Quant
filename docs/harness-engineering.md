# Harness Engineering

This document turns the planning PDF into an operating harness for C-Quant so each development round stays within the product boundary and truth rules.

## Product Boundary

- C-Quant is a desktop carbon intelligence terminal.
- It can monitor, summarize, compare, explain, and brief.
- It cannot execute trades, route orders, custody assets, or behave like a broker.
- It cannot provide one-to-one individualized trade instructions.

## Core Operating Loop

1. Pull official market anchors first.
2. Add linked futures or listed proxies only after the official layer is visible.
3. Mark each data source with freshness and access method.
4. Build decision support from factors, spreads, liquidity, and events.
5. Keep AI output bounded to explanation, scenario framing, and signal synthesis.
6. Rebuild desktop packages and verify the portable executable before release.

## Continuous Autonomy Framework

Single-turn prompting tends to stop after the first implementation burst because the next round has to rediscover the same context. The fix is to keep one persistent loop ledger and one repeatable verification runner.

The current loop also borrows a few proven harness ideas from OpenHands V1 and its SDK architecture:

- event-style persistence instead of one giant monolithic transcript
- separate base state and append-only event history
- stuck detection as an explicit operator-visible signal
- pause or resume semantics that preserve session continuity

### Required Artifacts

- [autonomy-state.md](C:/Users/user/Desktop/C-Quant/docs/autonomy-state.md)
  - the persistent handoff ledger
  - stores mission, open queue, current risks, and the latest verified cycle
- `.autonomy/control.json`
  - runtime control plane for start, pause, resume, stop, lease, and pause-on-user-return behavior
- `.autonomy/base-state.json`
  - OpenHands-style base state snapshot for the current autonomous session
  - stores session id, mode, budget, telemetry, stuck state, and latest summary
- `.autonomy/events/`
  - append-only structured event log for control changes, verification steps, and cycle completion
- `scripts/run-autonomous-cycle.ps1`
  - runs the standard verification loop
  - writes a cycle report to `.autonomy/latest-cycle.md`
  - updates the latest-run snapshot in `docs/autonomy-state.md`
  - appends `cycle.started`, `verification.step`, and `cycle.completed` or `cycle.failed` events
- `scripts/autonomy-control.ps1`
  - changes the loop mode without hand-editing JSON
  - powers `autonomy:start`, `autonomy:pause`, `autonomy:resume`, `autonomy:stop`, and `autonomy:status`
  - appends structured control events and refreshes `base-state.json`
- `scripts/autonomy-common.ps1`
  - shared schema, event persistence, budget, and stuck-detection helpers for the autonomy scripts
- `tools/autonomy-monitor/server.mjs`
  - serves a separate operator dashboard for autonomy state and recent cycle logs
  - exposes `/api/status` and `/api/control` so the monitor can visualize and control the loop safely
  - reads `base-state.json` and recent events to show OpenHands-style session telemetry
- `scripts/open-autonomy-monitor.ps1`
  - opens the separate monitor dashboard and starts the server if it is not already running

### Round Contract

1. Read `docs/autonomy-state.md`.
2. Read `.autonomy/control.json` and stop if the mode is `paused` or `stopped`.
3. If `stop_on_user_return` is `true` and the user has returned without an explicit resume command, pause immediately.
4. Read `git status --short`.
5. Pick one unchecked queue item or a newer blocker with higher user impact.
6. Research only what is required for that item.
7. Implement the smallest complete slice that moves the product forward.
8. Run the autonomy cycle script or equivalent verification commands.
9. Update both the state ledger and the control plane before ending the turn.

### Verification Gates

- Minimum gate for normal rounds:
  - `npm.cmd run build`
- Release gate for packaging-sensitive rounds:
  - `npm.cmd run package:dir`
  - `npm.cmd run package:portable`
- Desktop smoke gate for packaged runs:
  - `npm.cmd run smoke:dir`
  - `npm.cmd run smoke:portable`
  - or `npm.cmd run smoke:release` for both artifacts
- If a round changes copy, source labeling, or visible decision logic:
  - verify the screen path manually or with automation before closing the round

### Recommended Re-entry Prompt

Use this when you want the next autonomous round to continue without restating the full project:

> Read `docs/autonomy-state.md`, inspect `git status --short`, advance the highest-priority unchecked item, verify the result, and update `docs/autonomy-state.md` before stopping.

### Operator Commands

- Start:
  - `npm.cmd run autonomy:start`
- Pause:
  - `npm.cmd run autonomy:pause`
- Resume:
  - `npm.cmd run autonomy:resume`
- Return to idle:
  - `npm.cmd run autonomy:idle`
- Status:
  - `npm.cmd run autonomy:status`
- Start the separate monitor:
  - `npm.cmd run autonomy:monitor`
- Open the separate monitor in a browser:
  - `npm.cmd run autonomy:monitor:open`

By default the loop starts or resumes with `stop_on_user_return=true`, so any non-resume user message should pause the next autonomous cycle instead of continuing unattended.

### Monitor Semantics

- `mode=running` means the loop is armed for future work.
- `execution=active cycle` means a cycle currently holds the lease and is running now.
- `execution=armed / waiting` means the loop is enabled but no scheduler or manual trigger has started the next cycle yet.
- `scheduler=manual trigger only` means the framework state is ready, but a heartbeat automation or external scheduler is not currently visible from control state.
- `stuck_detection=at_risk` means recent cycles are repeating the same task or failing consecutively, so a human or strategy change is likely needed.

### OpenHands-Inspired State Model

- `control.json`
  - operator control plane and lease
- `base-state.json`
  - stable session snapshot, similar to OpenHands base state
- `events/*.json`
  - append-only event feed, similar in spirit to OpenHands event persistence
- `latest-cycle.md`
  - human-readable handoff artifact for the current repo workflow

## Three-Agent Harness

### 1. Market Facts Agent

- Responsibility:
  - verify official exchange, ministry, and statistics sources
  - separate confirmed APIs from official web flows or files
  - update freshness metadata
- Success criteria:
  - every major market card shows the last official timestamp
  - every factor row shows a source method

### 2. Product Builder Agent

- Responsibility:
  - turn verified data into clear operator-facing UI
  - keep the main workflow chart-first and scan-friendly
  - preserve the desktop-only, non-broker product boundary
- Success criteria:
  - EU ETS, K-ETS, and China ETS are visible on one board
  - factor and signal layers are understandable without reading code

### 3. Evaluation Agent

- Responsibility:
  - test build, packaging, and smoke-run flows
  - reject changes that blur the truth boundary
  - review whether new UI claims are backed by a source
- Success criteria:
  - `npm.cmd run build` succeeds
  - `npm.cmd run package:dir` succeeds
  - `npm.cmd run package:portable` succeeds
  - packaged desktop app opens without a renderer failure

## Truth Controls

- If a public API is not confirmed from official documentation, label it as `official web flow` or `official file`.
- If a listed tape is not the official settlement source, label it as `linked tape` or `proxy`.
- If China ETS official exchange time series is not stably reachable, keep China in bulletin-first mode instead of fabricating a live tape.
- Do not turn scenario output into a claimed live target price.

## UI Controls

- Benchmark scan speed and simplicity against Toss Securities, not literal screen copies.
- Put charts, market boards, and decision tables first.
- Keep long explanatory text in secondary panels, not the main canvas.
- Use large readable numbers, explicit source tags, and obvious freshness badges.

## Release Checklist

1. Verify the selected market shows official price, freshness, and source method.
2. Verify linked futures or proxies are labeled correctly.
3. Verify factor decomposition and quant playbook panels render for each market.
4. Verify the copilot keeps grounded evidence and does not blur the product boundary.
5. Rebuild the desktop app and rerun a smoke test.
6. Update [pdf-reference-audit.md](C:/Users/user/Desktop/C-Quant/docs/pdf-reference-audit.md) if the scope changed.

## Packaged Smoke Gate

`scripts/smoke-cquant.ps1` is the current machine-safe smoke gate for packaged Electron builds.

- It launches the packaged executable.
- It waits for the `C-Quant` main window to appear.
- It fails if the app exits before the window is created.
- It fails if the process dies during a short post-launch stability window.
- It always stops any leftover `C-Quant` processes before and after the check.

This does not replace full browser or renderer automation, but it closes the most common packaging regressions on this machine:

- missing packaged assets
- renderer boot failure that causes an immediate exit
- main-process startup regressions
- portable or unpacked app launch breakage

## Next Build Targets

- Live clean dark spread and clean spark spread monitor with verified fuel and power inputs
- Historical forecast error panel and rolling confidence check
- Portfolio carbon sleeve optimizer
- Read-only institutional export layer for desk integration
