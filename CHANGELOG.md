# Changelog

All notable changes to C-Quant. We follow [Keep a Changelog](https://keepachangelog.com/) and SemVer.

## [Unreleased]

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
