# C-Quant Architecture

A short tour of how the desktop app is wired so a new contributor can be
productive without reading every file.

## Process model

C-Quant is an Electron app. Three execution contexts:

| Context | Code | Responsibilities |
|---|---|---|
| Main process | `main.js`, `electron/**/*.js` | Window lifecycle, IPC handlers, file I/O, fetching from official sources, persistence (settings, window state), logging, CSP injection |
| Preload | `preload.js` | Bridge that exposes a typed, allow-listed API to the renderer via `contextBridge.exposeInMainWorld("desktopBridge", …)` |
| Renderer | `src/**` | React 19 UI: market boards, drivers, sources, copilot. Reads/writes settings via the bridge |

Security baseline:
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`
- Strict Content-Security-Policy injected from the main session via
  `session.webRequest.onHeadersReceived` (no inline scripts in production)
- Every IPC handler calls `assertTrustedSender()` to reject calls from
  origins other than the dev server or the bundled `dist/index.html`
- All external URLs go through `normalizeExternalUrl()` which only allows
  `http:` / `https:` and routes them to `shell.openExternal`

## Main-process modules

| File | Role |
|---|---|
| `main.js` | App lifecycle, window creation, IPC handlers, CSP injection, crash reporter, process error handlers |
| `electron/security.js` | Pure helpers: `isTrustedAppUrl`, `normalizeExternalUrl`, `sanitizeQuoteHistoryPayload`, `escapeHtml`, `buildContentSecurityPolicy` |
| `electron/cache.js` | TTL + LRU cache used by `liveSources` |
| `electron/logger.js` | File-rotating logger that writes to `<userData>/logs/cquant.log` (1MB rotation, 4 keep) |
| `electron/windowState.js` | Persists window position, size, and maximized state across launches |
| `electron/appSettings.js` | User-facing settings (theme, locale, reduced motion, last surface/market) |
| `electron/liveSources.js` | Public-source fetchers for EU/Korea/China carbon markets |
| `electron/autoUpdate.js` | `electron-updater` wrapper. Disabled in dev + by `CQUANT_DISABLE_UPDATER=1`. Status broadcast via IPC |
| `electron/sentry.js` | Optional crash upload via `@sentry/electron`. No-op unless `CQUANT_SENTRY_DSN` is set |
| `electron/exporters.js` | `printToPDF` + RFC 4180 CSV serializer. Save dialog mediated by main |
| `electron/watchlist.js` | Pinned-view archive with validation, capped at 64 entries |
| `electron/backtests.js` | Generic JSON archive at `<userData>/backtests/`, 4 MB cap, ID-validated. IPC + `BacktestDrawer` are wired (`backtest-save/load/list/remove`), but no renderer code currently calls `backtestSave` — the drawer is empty by default until a strategy backtest producer is implemented |
| `electron/analytics.js` | Opt-in event dispatcher. No-op unless `analyticsEnabled` setting + `CQUANT_ANALYTICS_ENDPOINT` env var both set |

## Renderer architecture

```
src/main.tsx
  └─ <StartupErrorBoundary>          — catches errors before renderer-ready
        └─ <ThemeProvider>           — theme + locale + reduced-motion, persisted via bridge
             └─ <ToastProvider>      — passive notifications (4 max, auto-dismiss)
                  └─ <CommandPaletteProvider>  — Cmd/Ctrl+K palette
                       ├─ <AppShellExtensions/>  — registers commands, skip-link, drawers, banner
                       └─ <RuntimeErrorBoundary> — catches errors after mount
                              └─ <App/>     — surfaces (Command, Desk, Drivers, Sources)
```

Surfaces (`src/components/surfaces/*.tsx`) are the four major workspaces.
`App.tsx` owns market/surface state and routes to the correct surface.

### Design system

Tokens live in `src/styles.css :root`:
- `--bg`, `--panel`, `--panel-muted`, `--panel-tint`
- `--text-strong`, `--text-base`, `--text-soft`, `--text-mute`
- `--accent`, `--accent-strong`, `--accent-soft`, `--accent-ink` (Claude orange)
- `--green`, `--red`, `--yellow` (warm semantic palette)
- `--rail`, `--rail-soft`
- `--shadow`, `--shadow-soft`, `--shadow-lift`
- `--radius-{sm,md,lg,xl}`, `--motion-{fast,base,slow}`, `--ease-{out,in-out}`
- `--focus-ring`

Dark theme overrides live in `:root[data-theme="dark"]`. The OS preference is followed when the user has not explicitly set a theme.

`src/styles.claude.css` adds shell-level refinements (skip link, focus rings,
scrollbars, toasts, command palette, theme toggle, skeletons).

### Typography

- **UI**: `Inter Variable` via `@fontsource-variable/inter`
- **Display**: `Fraunces Variable` via `@fontsource-variable/fraunces`
- Both are bundled to `dist/assets/` so the production app is fully
  self-hosted — no external font requests, no CSP concerns.

## Persistence

| Where | What | Format |
|---|---|---|
| `<userData>/settings.json` | Theme, locale, reduced motion, last surface/market | JSON |
| `<userData>/window-state.json` | Window x/y/width/height + maximized | JSON |
| `<userData>/watchlist.json` | Pinned views (max 64) | JSON |
| `<userData>/backtests/<id>.json` | Saved backtest runs (one file per run) | JSON |
| `<userData>/logs/cquant.log` | Rotating log (1 MB × 4 files) | Plaintext |
| `<userData>/logs/startup-diagnostics.log` | Append-only renderer-startup events | Plaintext |
| `localStorage` | Mirrored locale/surface/market for instant first paint | Key-value |

## Live sources

`electron/liveSources.js` fetches public official feeds:

- **EU ETS**: EEX EU ETS auctions (workbook/page)
- **K-ETS**: KRX ETS information platform + KRX Open API sample
- **China ETS**: MEE carbon-market feed, Shanghai Environment & Energy bulletin
- **Reference tapes**: Yahoo Finance v8 chart endpoint (ICE EUA, KRBN, TTF, etc.)

Cache: `createTtlCache({ maxEntries: 256 })` with per-entry TTL. Expired
entries are pruned lazily on overflow before LRU eviction.

The KRX Open API requires a registered AUTH_KEY per user. Set
`CQUANT_KRX_AUTH_KEY` in the environment; without it, the K-ETS adapter
fails with a configuration error.

## Testing

| Suite | Runner | Scope |
|---|---|---|
| `tests/*.test.js` | Vitest | Security helpers, cache, settings, window state |
| `tests/localization-*.test.mjs` | Node `node:test` | Localization helpers (carried over from upstream) |

`npm run test:all` runs both. CI runs them as separate steps so a failure
in one suite doesn't mask the other.

## Build pipeline

```
npm run dev                 # Vite + Electron, concurrent
npm run type-check          # tsc --noEmit
npm run lint                # eslint flat config
npm run format[:check]      # prettier
npm test                    # vitest
npm run test:node           # node:test
npm run test:all            # both
npm run build               # type-check + vite build
npm run bundle:check        # enforce bundle budgets
npm run ci:verify           # node --check on every electron entry point + scripts
npm run calibration:check   # 90-day freshness gate on scenario calibration
npm run package:dir         # unpacked Electron build
npm run package:portable    # portable .exe
npm run package:nsis        # installer .exe (auto-update wired)
npm run package:mac         # macOS dmg + zip (advisory)
npm run package:linux       # Linux AppImage + deb (advisory)
npm run smoke:dir | smoke:portable | smoke:release
npm run e2e                 # Playwright Electron smoke
```

The canonical 9-tier verification ladder for picking which subset of these
to run for a given change is in
[../CLAUDE.md#verification-ladder](../CLAUDE.md#verification-ladder).

Bundle budgets (`tools/check-bundle-size.mjs`):

| Asset | Limit |
|---|---|
| `index-*.js` (main) | 420 KB |
| `vendor-react-*.js` | 250 KB |
| `vendor-charts-*.js` | 250 KB |
| `index-*.css` | 80 KB |

Adjust deliberately when a feature requires more headroom.

## CI

[.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on a 3-OS
matrix on every push and PR:

- `windows-latest` — primary; matches the Windows package target.
- `macos-latest` — advisory; allowed to fail until cross-platform packaging stabilises.
- `ubuntu-latest` — advisory; same.

Steps (per OS):

1. Install (`npm ci`)
2. Type check
3. Lint (continue-on-error until backlog is cleared)
4. Format check (continue-on-error)
5. Vitest
6. node:test localization suite
7. `node --check` on Electron entry points + scripts (`ci:verify`)
8. Calibration freshness gate (`calibration:check`)
9. `vite build`
10. Bundle size budget
11. Playwright Electron smoke (`e2e`)

[.circleci/config.yml](../.circleci/config.yml) also exists and mirrors
the local Windows release path (`verify_build` → `package_desktop`).
Confirm which gate is enforced for a given PR before assuming.

## Renderer libraries

### Shell / chrome

| File | Role |
|---|---|
| `src/lib/theme.tsx` | Theme/locale/reduced-motion provider; persists via bridge |
| `src/lib/toast.tsx` | Passive notifications (max 4, auto-dismiss, ARIA live) |
| `src/lib/commandPalette.tsx` | ⌘K palette with fuzzy search + keyboard nav |
| `src/lib/AppShellExtensions.tsx` | Wires all shell-level chrome and Cmd+K commands |
| `src/lib/RuntimeErrorBoundary.tsx` | Catches render errors after the app has mounted; offers Reset + Reload |
| `src/lib/UpdateNotice.tsx` | Top-of-viewport banner for updater state |
| `src/lib/WatchlistDrawer.tsx` | Right-aligned modal listing pinned views |
| `src/lib/BacktestDrawer.tsx` | Right-aligned modal listing saved backtests |
| `src/lib/DropZone.tsx` | Window-wide CSV drag-drop with `cquant:csv-dropped` event |
| `src/lib/firstRun.tsx` | Three-step welcome sequence on first launch |
| `src/lib/i18n.ts` | Additive message catalog (tt(locale, key, params)) |
| `src/lib/indicators.ts` | Pure SMA/EMA/RSI/Bollinger/log-returns/correlation |
| `src/lib/desktopBridge.ts` | Typed handle on `window.desktopBridge` |

### Decision-support model layer (v1.2 / v1.3)

| File | Role |
|---|---|
| `src/lib/forecast.ts` | Linear weighted sum forecast estimator (intentionally simple, intentionally not OOS-validated) |
| `src/lib/walkForward.ts` | Generic walk-forward harness: `runWalkForward`, `samplesFromPriceSeries`, `makeBaselineDirectionalModel`. Reviewer-facing track for the forecast estimator |
| `src/lib/eventStudy.ts` | `evaluateEvent`, `aggregateByScenario`, `runEventStudy`. Calibrates catalyst-multiplier multipliers from a labeled event log |
| `src/lib/catalystTriggerDetector.ts` | Real-time evaluator: freshness > 24h / price-jump 5d ≥ 5% / volume-jump ≥ 2× / proxy-divergence ≥ 4%. Surfaces "Active patterns now" cards |
| `src/lib/localization.ts` | KO/EN parity helper; inline KO/EN dictionary used by `localizeText` / `localizeTextWithFallback` |

## Power UX

- **Cmd/Ctrl + K** — command palette: theme, locale toggle, motion,
  reload, exports (PDF/CSV), watchlist pin, updates (check/download/install),
  open data folders, about
- **Floating theme toggle** (bottom-right) cycles light → system → dark
- **Esc** — close palette / dismiss
- **↑ / ↓** — navigate palette items
- **Skip link** — first focusable element jumps to `#workspace-main`
- **Focus rings** — visible on every interactive surface via
  `:focus-visible`
- **Reduced motion** — `prefers-reduced-motion` is honored automatically;
  users can also toggle it manually
- **Cross-app locale change** — Cmd+K locale flip dispatches a
  `cquant:locale-change` `CustomEvent` that App.tsx listens to so the
  workspace updates without a reload

## Distribution

| Concern | Surface | Operator action |
|---|---|---|
| Auto-update | `electron-updater` reading from GitHub releases | Push a release tag with `gh release create` and let the published artifacts feed clients |
| Code signing (Windows) | electron-builder reads `CSC_LINK` + `CSC_KEY_PASSWORD` | Provide a `.pfx` cert path or HTTPS URL and password |
| Code signing (macOS) | `CSC_NAME` + `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID` | Developer ID + notarization secret |
| Crash upload | `@sentry/electron` | Set `CQUANT_SENTRY_DSN` |
| Disable updater | Per-machine env | Set `CQUANT_DISABLE_UPDATER=1` |
| Cross-platform builds | electron-builder targets in `package.json#build` | `npm run package:mac`, `package:linux`, `package:nsis` |
