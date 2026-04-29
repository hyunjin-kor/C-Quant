# Changelog

All notable changes to C-Quant. We follow [Keep a Changelog](https://keepachangelog.com/) and SemVer.

## [Unreleased]

### Security

- `package.json#overrides` pins transitive dependencies that were
  flagged by `npm audit`:
  - `uuid >= 14.0.0` — closes the missing-buffer-bounds-check advisory
    that propagates from `exceljs` (verified `exceljs` smoke-tests
    cleanly under uuid 14)
  - `esbuild >= 0.25.0` — closes the dev-server request-bridging
    advisory carried by `vitest` 2's bundled toolchain
  - `vitest > vite ^6.4.2` and `vite-node > vite ^6.4.2` — closes the
    Vite path-traversal advisory inside vitest's transitive tree
    without forcing a vitest 4 upgrade
- `npm audit` now reports **0 vulnerabilities** at every severity
  level. CI gates and runtime tests stay green after the bumps.

## [1.0.0] — 2026-04-29

First public release. Cuts the SemVer 1.0 line: every entry below was
landed on `main` between the initial fork point and this tag. The
release artifact is `C-Quant-1.0.0.exe` (Windows portable, ~94 MB,
unsigned).

### Added — Documentation & screenshots

- **README + docs/USAGE.md** rewritten with screen-by-screen walkthroughs.
  USAGE.md is bilingual (English + Korean) with a "한 줄 요약" trailing
  every section.
- **docs/images/** with seven hand-crafted SVG illustrations (hero,
  decision flow, architecture, etc.) — kept for the diagram-style
  content (decision-flow, architecture, hero).
- **`npm run capture`** — Playwright + `_electron.launch()` walks the
  renderer through every surface, opens ⌘K, opens the Watchlist
  drawer, and produces eight real PNG captures. Pre-seeds
  `localStorage` so each shot mounts in a deterministic state.
  - `tools/capture-screenshots.mjs` is the script.
  - `main.js` gained `CQUANT_LOAD_DIST=1`: when set, the main process
    loads `dist/index.html` instead of the Vite dev server, so the
    capture tool can run without spinning up Vite first.
- **Real screenshots** replace the earlier surface mockups in README
  and USAGE.md:
  - `shot-command-light.png` — Command surface, K-ETS focused, KRX live
  - `shot-desk-light.png` — Desk surface deep dive
  - `shot-drivers-light.png` — Drivers heatmap (6 families × 3 markets)
  - `shot-sources-light.png` — Sources card for KRX ETS sample API
  - `shot-command-dark.png` — Same Command surface, dark theme
  - `shot-command-light-ko.png` — Korean locale preview
  - `shot-cmd-k.png` — Palette opened with "theme" typed
  - `shot-watchlist-drawer.png` — Drawer open with one pinned view
- **CONTRIBUTING.md** documents the capture flow under "Regenerate
  screenshots".

### Removed

- The four interim mockup SVGs (`command-surface.svg`, `dark-mode.svg`,
  `cmd-k-palette.svg`, `watchlist-drawer.svg`) that were placeholder
  illustrations before the real captures landed.

### Added — Polish & meta pass

- **LICENSE** (MIT) added at the repository root, with third-party
  attribution and the research-only product-boundary statement
- **SECURITY.md** with the threat model, supported versions,
  responsible-disclosure flow, hardening checklist for distributors,
  and coordinated-disclosure timeline by severity
- **README** rewritten to match the current capabilities (palette,
  drawers, exports, dark mode, auto-update, privacy stance, release flow)
- **CI badge** + license badge + Node version badge in README
- **`src/lib/RuntimeErrorBoundary.tsx`** — distinct from the existing
  `StartupErrorBoundary`. Renders inside the providers around `<App/>`,
  so a runtime render error after mount no longer reports as a startup
  failure. Provides "Reset workspace" and "Reload window" actions and
  a styled fallback that respects the warm theme tokens
- **Logger graceful shutdown**: `installShutdownHandlers()` registers
  `exit`, `SIGINT`, `SIGTERM` listeners that write a final `flush on …`
  marker so a tail of `cquant.log` always shows when the process ended
- **Cache periodic prune**: `createTtlCache` now runs a
  `setInterval(pruneExpired, 5 min)` (unref'd so it never blocks
  shutdown). Disable by passing `pruneIntervalMs: 0`. Exposed
  `stopPeriodicPrune` for tests and teardown
- **CONTRIBUTING** gained an end-to-end release section: env vars for
  signing, electron-builder publish, GitHub release tagging, and a
  local smoke-test recipe with `CQUANT_DISABLE_UPDATER`
- **Lint cleanup**: 12 → 9 pre-existing warnings (the autonomy-monitor
  unused-helper warnings and the dead `resolveTheme` import are gone)
- **Vitest spec** for the periodic prune behavior

### Added — User-facing features pass

- **In-app update notice**: top-of-viewport banner that surfaces when an
  update is available or already downloaded; "Download" / "Restart &
  install" / "Later" buttons hooked to `electron-updater` IPC. Polls
  `updaterStatus` every 5s while open and schedules a fresh check every
  30 minutes
- **Watchlist drawer**: full-height right-aligned modal listing pinned
  views, click-to-restore (rewrites `cquant:surface` and `cquant:market`
  in localStorage), per-row remove, "Clear all" footer action. Esc
  dismisses
- **Backtest drawer**: lists saved backtest summaries newest first,
  with load and delete actions. Esc dismisses
- **Drag-and-drop CSV importer**: a window-wide listener detects file
  drags, validates extension (csv/tsv/txt) and size (≤8MB), then
  broadcasts a `cquant:csv-dropped` `CustomEvent` with `{ name, bytes,
content }` so any surface can subscribe without App.tsx surgery
- **First-run welcome sequence**: timed toasts (welcome → theme/language
  hint → privacy stance) on the first launch only, persisted via
  `firstRunCompletedAt` in `settings.json` (with localStorage fallback)
- **Markdown exporter**: `electron/exporters.js` extended with
  `rowsToMarkdown` (header + divider + escaped cells); IPC
  `export-markdown`; Cmd+K command "Export app diagnostics as Markdown"
- **Privacy-first analytics**: `electron/analytics.js` opted-in via
  `analyticsEnabled` setting _and_ `CQUANT_ANALYTICS_ENDPOINT` env var.
  Without both, every `track()` call is a no-op. Cmd+K command
  "Enable / Disable analytics"
- **Chart indicators library**: `src/lib/indicators.ts` with pure
  `sma`, `ema`, `rsi`, `bollinger`, `logReturns`, `correlation`. Ready
  to drop into the chart layer without external deps
- **i18n message catalog**: `src/lib/i18n.ts` with `tt(locale, key,
params)` lookup, used by all new shell components. Sits alongside
  the existing `localizeText` system rather than replacing it
- **App settings extended**: `analyticsEnabled`, `firstRunCompletedAt`
  fields with validation
- **CSS shell sheet** (`src/styles.shell.css`): drawer overlay,
  drawer-row interactions, update-notice banner, drop-zone overlay,
  small-button modifier
- **Vitest specs** for `analytics`, `i18n`, `markdown export`,
  `chart indicators`

### Added — Distribution & feature pass

- **Auto-update** via `electron-updater`, wired to GitHub releases. Disabled
  in dev and when `CQUANT_DISABLE_UPDATER=1`. Renderer surfaces it through
  Cmd+K commands: "Check for updates", "Download update", "Install update
  and restart"
- **Sentry crash upload** (`@sentry/electron`) gated by `CQUANT_SENTRY_DSN`.
  Without a DSN the SDK is never initialized — zero telemetry leaves the
  machine. `uncaughtException` and `unhandledRejection` route into Sentry
  when enabled
- **PDF + CSV exporters** (`electron/exporters.js`):
  - `printToPDF` of the current renderer with save dialog
  - RFC 4180 CSV serializer with explicit-or-inferred columns
  - Cmd+K commands "Export current view as PDF" and
    "Export app diagnostics as CSV"
- **Watchlist persistence** (`electron/watchlist.js`): pinned views stored
  at `<userData>/watchlist.json`, capped at 64 entries, with input
  validation. Cmd+K command "Pin current view to watchlist"
- **Backtest archive** (`electron/backtests.js`): one JSON per backtest at
  `<userData>/backtests/<id>.json`, 4 MB cap, ID validation
- **App info & shell utilities IPC**: `getAppInfo`, `openUserDataFolder`
  with allow-listed sub-folders (`""`, `"logs"`, `"backtests"`)
- **Cmd+K palette additions**: locale toggle (Korean ↔ English),
  open app data / log / backtest folders, About C-Quant
- **Visible theme toggle** floating button (cycles light → system → dark)
- **App.tsx locale event listener** so Cmd+K locale changes update the
  workspace immediately
- **Playwright e2e smoke test**: launches the Electron app and verifies
  the desktop bridge mounted
- **CI matrix**: macOS, Linux, Windows all run the verify pipeline
  (Windows is the primary; the others are advisory)
- **e2e CI job** runs the Playwright smoke after the verify matrix
- **Cross-platform packaging targets** in `package.json` build config:
  Windows portable + nsis, macOS dmg + zip (x64 + arm64), Linux AppImage + deb
- **Code-signing scaffolding**: env reads documented in `.env.example`
  for `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `GH_TOKEN`
- **Vitest specs** for `exporters`, `watchlist`, `backtests`

### Added — Production resilience (earlier in Unreleased)

- **Production resilience**
  - Strict Content-Security-Policy injected from the Electron session
    (no `<meta>` CSP, no `'unsafe-inline'` scripts in production builds)
  - Window state persistence (`<userData>/window-state.json`)
  - User settings store (`<userData>/settings.json`) with theme, locale,
    reduced motion, last surface, last market
  - File-rotating logger at `<userData>/logs/cquant.log` (1 MB × 4 files)
  - Process-level `uncaughtException` and `unhandledRejection` handlers
  - Electron `crashReporter` enabled (local-only, no upload)
  - TTL + LRU cache for live-source loaders, replacing the unbounded `Map`
- **Design system**
  - Claude-style warm palette (cream canvas, warm ink, signature orange)
  - Dark theme variant activated via `data-theme="dark"`
  - System theme follow when user has not picked one
  - Self-hosted Inter Variable (UI) and Fraunces Variable (display) fonts
  - Focus ring token applied to all interactive elements
  - Warm webkit scrollbars
  - `prefers-reduced-motion` and explicit reduced-motion toggle
  - Skip-link for keyboard users
- **UX systems**
  - Toast notification stack (max 4, auto-dismiss, ARIA live)
  - Cmd/Ctrl + K command palette with fuzzy search and keyboard nav
  - Theme toggle (light / dark / system)
  - Renderer startup error boundary (already existed; refreshed visually)
- **Dev infrastructure**
  - TypeScript build gate (`tsc --noEmit` runs before `vite build`)
  - ESLint v9 flat config with TypeScript, React, hooks, prettier integration
  - Prettier with project config + `.prettierignore`
  - Vitest with v8 coverage (security/cache/settings/window state suites)
  - GitHub Actions CI on `windows-latest` (Node 24)
  - Bundle size budget tool (`tools/check-bundle-size.mjs`)
  - `.editorconfig`, `.nvmrc`, `.env.example`
  - `ARCHITECTURE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- **Performance**
  - Vendor manual chunks: `vendor-react`, `vendor-charts`, `vendor-fonts`
  - Main JS chunk reduced from ~613 KB to ~262 KB

### Changed

- KRX sample API key is now read from `CQUANT_KRX_AUTH_KEY` env (with the
  public sample key as fallback)
- `electron/security.js` extracted from `main.js` so the helpers are
  testable
- `electron/cache.js` extracted with TTL + LRU eviction
- `mergeLocalized` (in `src/data/locales.ts`) now accepts readonly inputs
- Inline CSS in the renderer error boundary refreshed to the warm palette
- Workspace H1 typography now uses Fraunces Variable

### Removed

- Inline `<meta http-equiv="Content-Security-Policy">` from `index.html`
  — superseded by the session-based header
