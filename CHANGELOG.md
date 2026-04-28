# Changelog

All notable changes to C-Quant. We follow [Keep a Changelog](https://keepachangelog.com/) and SemVer.

## [Unreleased]

### Added

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
