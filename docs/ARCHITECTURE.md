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

## Renderer architecture

```
src/main.tsx
  └─ <StartupErrorBoundary>
        └─ <ThemeProvider>           — theme + locale + reduced-motion, persisted via bridge
             └─ <ToastProvider>      — passive notifications (4 max, auto-dismiss)
                  └─ <CommandPaletteProvider>  — Cmd/Ctrl+K palette
                       ├─ <AppShellExtensions/>  — registers commands, skip-link
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

KRX uses a public sample auth key by default. Override via
`CQUANT_KRX_AUTH_KEY` environment variable when you have your own key.

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
npm run ci:verify           # node --check on every electron entry point
npm run package:portable    # build + electron-builder portable .exe
```

Bundle budgets (`tools/check-bundle-size.mjs`):

| Asset | Limit |
|---|---|
| `index-*.js` (main) | 350 KB |
| `vendor-react-*.js` | 250 KB |
| `vendor-charts-*.js` | 250 KB |
| `index-*.css` | 80 KB |

Adjust deliberately when a feature requires more headroom.

## CI

`.github/workflows/ci.yml` runs on `windows-latest` (matches the package
target):

1. Install (`npm ci`)
2. Type check
3. Lint (continue-on-error until backlog is cleared)
4. Format check (continue-on-error)
5. Vitest
6. node:test localization suite
7. `node --check` on Electron entry points
8. `vite build`
9. Bundle size budget

## Power UX

- **Cmd/Ctrl + K** — command palette (theme, motion, reload, about)
- **Esc** — close palette / dismiss
- **↑ / ↓** — navigate palette items
- **Skip link** — first focusable element jumps to `#workspace-main`
- **Focus rings** — visible on every interactive surface via
  `:focus-visible`
- **Reduced motion** — `prefers-reduced-motion` is honored automatically;
  users can also toggle it manually
