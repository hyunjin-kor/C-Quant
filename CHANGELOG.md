# Changelog

All notable changes to C-Quant. We follow [Keep a Changelog](https://keepachangelog.com/) and SemVer.

## [Unreleased]

_Nothing in flight._

## [1.3.0] — 2026-05-04

A literature-grounded release. Two parallel research agents surveyed
publicly verifiable carbon-pricing literature and only papers with a
fetched URL were retained; their findings then shaped 22 new drivers,
10 new catalyst scenarios, and 6 new historical events. The README and
Drivers view were also tightened to drop the credibility-pitch
surfaces.

### Added — research catalogue (44 verified papers)

End-to-end literature integration. Two parallel research agents
surveyed publicly verifiable carbon-pricing literature; only papers
with a fetched URL were retained.

- **`src/data/researchCatalogue.ts`** — 44 verified papers with
  citations, findings, variable mappings to driver IDs, data sources,
  evidence-strength ratings, and quantitative anchors where the paper
  reports them.
  - **EU**: 22 papers (Mansanet-Bataller 2007, Hintermann 2010, Creti
    et al. 2012, Aatola et al. 2013, Lutz et al. 2013 regime-switching,
    Koch et al. 2014/2016, Tan & Wang 2017, Hintermann 2017, Friedrich
    et al. 2019, Bocklet et al. 2019, Li et al. 2021 TVP-VAR, Ampudia
    et al. 2022 ECB, Quemin & Pahle 2023 Nature CC, Känzig 2023 NBER,
    Anaya Longaric et al. 2024 ECB, Dittmann et al. 2024 Phase III/IV,
    Pahle et al. 2025 endgame, ESMA 2024 carbon markets report, Bayer
    & Aklin 2020 PNAS, Colmer et al. 2024 RES, Görlach et al. 2025
    ETS2, Bastianin et al. 2024 BVAR).
  - **K-ETS**: 12 papers (Park & Lee 2021, Etienne & Yu 2017, Kim & Yu
    2018, Jun/Kim/Oh 2021, Park 2024, O et al. 2023, Yim et al. 2024,
    Moon et al. 2019, MDPI Sustainability 2022, Park et al. 2025
    operational review, Tan et al. 2024, Climate Policy 2024).
  - **China**: 10 papers (Wen et al. 2022, Chen & Zhang 2022, Shi et
    al. 2022, Liao et al. 2025 with full elasticity matrix, Xiao et
    al. 2022, Dong et al., He et al. 2023, Wang et al. 2022, Law &
    Fong 2025, MDPI Land 2025).
  - One retracted paper (Song 2024 PLoS ONE, retracted Sept 2025) is
    explicitly excluded; test prevents re-introduction.

### Added — 22 new drivers from literature gaps

- **EU (8)**: `eu_speculation` (ESMA fund-share), `eu_term_structure`
  (Bredin & Parsons), `eu_renewables_share` (Koch et al. ENTSO-E),
  `eu_eurusd`, `eu_ets2` (Görlach et al. EUR45 trigger), `eu_cbam`
  (CBAM linkage), `eu_macro_shock` (Känzig high-frequency
  identification), and a tightened `eu_oil` weighting per Phase IV
  evidence.
- **K-ETS (7)**: `kr_penalty_multiplier` (3× soft ceiling, Kim & Yu),
  `kr_otc_spread` (KOC/KAU inverse spread, Etienne & Yu),
  `kr_allocation_tightness` (expected emissions / free allowance, Jun
  et al.), `kr_attention` (search-query interest, MDPI),
  `kr_tariff_insulation` (KEPCO regime, Tan et al.),
  `kr_financial_cap` (institutional access timeline).
- **China (7)**: `cn_eua_spillover` (−0.368 elasticity, Liao et al.),
  `cn_power_equity_index` (+1.195, Liao et al.), `cn_power_emissions`
  (−0.757 + Carbon Monitor), `cn_pilot_transmission` (Xiao et al. TVP-VAR
  ~54% spillover), `cn_ccer_utilization` (5% cap + restart Jan 2024),
  `cn_usdcny`, `cn_q4_concentration` (79% of annual volume).

### Added — 10 new catalyst scenarios from literature

- **EU**: hawkish ECB + speculation downshift; MSR cancellation
  surprise; CBAM expansion + USD strength; ETS2 launch + price
  stability mechanism.
- **K-ETS**: compliance squeeze + KRW weakness + cold winter; Phase 4
  auction step + financial cap relaxation; penalty-multiplier soft
  ceiling reset.
- **China**: Q4 compliance crunch + CCER discount; coal price shock +
  power emissions release (Liao 2025 anchored); pilot-to-national
  transmission cascade.

### Added — 6 new event log entries from literature

CCER restart 2024-01-22, K-ETS Fourth Basic Plan 2024-12-01, K-ETS
financial cap relaxation 2025-02-07, MEE 2025 progress report,
CBAM transition start 2023-10-01, EU ETS revision trilogue 2022-12-18.
Event log now totals 25 events (was 19).

### Added — research catalogue UI panel

Drivers view gains a "Research catalogue" panel showing per-market
papers with citation, finding, variable mappings, evidence-strength
badge, and primary-source / data-source link buttons. Quantitative-
anchor papers are flagged for quick scanning.

### Tests

- `tests/researchCatalogue.test.ts` — 12 tests: minimum size, citation
  hygiene, market validity, data-source URLs, evidence-strength
  taxonomy, retracted-paper exclusion, market filter, anchor filter,
  driver-ID mapping.
- All pre-existing tests still pass: 23 files / 197 tests total.

### Removed

- The "Research catalogue" panel that briefly surfaced 12 papers with
  "Open paper" buttons in the Drivers view. Literature is foundation
  data, not credibility material to display to users — the catalogue
  remains in `src/data/researchCatalogue.ts` and informs the drivers
  and scenarios, but is no longer rendered as a list of citations.
- The three SVG diagrams from README and USAGE (`hero.svg`,
  `decision-flow.svg`, `architecture.svg`). Their visual style did not
  match the actual app screenshots, so the diagrams looked out of
  place; replaced with text equivalents.

### Changed

- README rewritten as English-only. The previous bilingual version
  duplicated every sentence in Korean and English, which read clunky
  on the GitHub front page. `docs/USAGE.md` remains bilingual for
  Korean-language operators who want a deeper walkthrough.
- Renderer bundle shrinks 436 kB → 390 kB (gzip 130 kB → 117 kB) after
  removing the research-catalogue panel.

### Verification

- type-check: clean
- vitest: 23 files / 197 tests
- node:test: 53 / 53
- eslint: 0 errors / 0 warnings
- build: clean (390 kB / 117 kB gzip)
- ci:verify: clean
- calibration:check: clean

## [1.2.0] — 2026-05-04

A decision-support release. v1.1 was a monitoring desk; v1.2 turns it
into an active decision-support tool with citable historical
calibration, real-time trigger detection, free public-data feeds, and
honest jurisdictional compliance documentation.

### Added — research depth & calibration governance

- **Catalyst combinations layer** (`src/data/catalystScenarios.ts`,
  `src/types.ts`). 11 multi-driver scenarios across EU ETS / K-ETS /
  China ETS / shared markets, each with explicit components, threshold
  triggers, interaction effect, playbook, historical anchor, and
  primary-source citations.
- **Materials & abatement atlas** (`src/data/materialsResearch.ts`).
  10 entries (CCUS amine, MOF, DAC, green H₂, H₂-DRI steel, low-clinker
  cement, biochar, AFOLU, BECCS, renewable LCOE) with IPCC AR6 / IEA /
  IRENA / GCCA / ICVCM / Verra references. All entries
  `verified: false` until human review.
- **Walk-forward backtest framework** (`src/lib/walkForward.ts`).
  Generic harness: `runWalkForward`, `samplesFromPriceSeries`,
  `makeBaselineDirectionalModel`. No fabricated historical features.
- **Event study library** (`src/lib/eventStudy.ts`). `evaluateEvent`,
  `aggregateByScenario`, `runEventStudy` for empirical multiplier
  estimation from a labeled event log.
- **Curated catalyst event log** (`src/data/catalystEventLog.ts`). 19
  citable historical events 2018-2025 (MSR notices, Fit-for-55, ETS
  revision, energy crises, COVID risk-off, K-ETS basic plans, MEE
  bulletins, listed-proxy divergences). Each event tagged with
  `verified` / `reported` / `context` confidence and a primary-source
  URL.
- **Bundled historical price anchors** (`src/data/historicalPriceAnchors.ts`).
  Monthly closing-level anchors for EU / K / CN ETS drawn from public
  press coverage, used only by the event study. Updating an entry
  requires a CHANGELOG note.
- **Catalyst calibration table** (`src/data/catalystCalibration.ts`).
  Pure, deterministic event-study output per scenario:
  `multiplier`, `status`, `observations`, `meanAbsReturn`, `hitRate`,
  `reviewedAt`, `notes`.
- **Layered interaction multiplier resolver**
  (`getInteractionMultiplier` in `catalystCalibration.ts`). Resolution
  order: explicit per-scenario value → backtest-derived → heuristic
  constant. Status returned reflects which layer was used.
- **Institutional feed adapter pattern**
  (`electron/institutionalFeeds.js`). License-gated adapters for
  Refinitiv, Bloomberg, ICE Consolidated, EEX. Returns
  `not-configured` when env vars missing; never fabricates data.
- **Free public-data feeds** (`electron/freeFeeds.js`). Real fetch
  implementations for FRED (key-gated) and ECB Statistical Data
  Warehouse (open). ICAP and World Bank dashboards exposed as
  documented entry URLs.
- **Renderer surfaces** in the Drivers view: catalyst combinations,
  materials atlas, institutional feeds status, free-feed status,
  calibration provenance table, event timeline. Plus an honest
  "Decision-support boundary" notice.

### Added — documentation & governance

- `docs/MODEL_CARD.md` — model card with intended-use / out-of-scope,
  inputs/outputs, known limitations, maintenance rules.
- `docs/COMPLIANCE.md` — boundary statement, data sources, citation
  policy, telemetry, license-gated feed table, calibration governance,
  operator deployment checklist.
- `docs/COMPLIANCE-EU.md`, `docs/COMPLIANCE-KR.md`,
  `docs/COMPLIANCE-CN.md` — jurisdictional compliance notes against
  MiFID II / MAR / BMR / CSRD (EU), Capital Markets Act / GHG Emission
  Trading Act / PIPA (KR), Securities Law / PIPL / Provisional
  Regulations on Carbon Trading (CN).

### Added — tooling

- `scripts/check-calibration-freshness.mjs` + `npm run calibration:check`.
  Regex-based freshness audit that exits non-zero when a calibration
  timestamp exceeds the configured threshold (default 90 days).
- `npm run ci:verify` extended to syntax-check
  `electron/institutionalFeeds.js`, `electron/freeFeeds.js`, and the
  freshness script.

### Tests

- `tests/catalystScenarios.test.ts` — schema, citation hygiene,
  calibrationStatus completeness, layered multiplier resolver,
  materials-atlas ranking.
- `tests/walkForward.test.ts` — sample construction, training-window
  guards, perfect-hit case, noise-floor flat classification, default
  fit.
- `tests/institutionalFeeds.test.js` — env-gated status per adapter,
  registry listing, fetchQuote refusal when not ready, unknown-id
  guard.
- `tests/eventStudy.test.ts` — pre/post window arithmetic, hit
  classification by expected sign, scenario aggregation, multiplier
  clamping.
- `tests/freeFeeds.test.js` — adapter shape, status with/without
  FRED key, registry listing, error handling.

### Added — real-time decision support (Drivers view)

- **Catalyst trigger detector** (`src/lib/catalystTriggerDetector.ts`).
  Live `ConnectedSourcePayload` is auto-evaluated against four signal
  types: freshness (card age > 24h), price-jump (5d |%| ≥ 5%),
  volume-jump (latest bar ≥ 2× trailing 5-bar mean), proxy-divergence
  (|gap| ≥ 4%). Components mapped to signal types via family/variable
  classification; unmatched stay "untestable" rather than guessed.
- **"지금 활성 패턴" panel** at the top of the Drivers view. Surfaces
  the scenarios where ≥ half the testable components fired, with the
  observed value vs threshold per component.
- **Real Korean localizations** for ~60 newly introduced UI strings
  (Decision-support boundary, Catalyst combinations, Materials atlas,
  Institutional feeds, Calibration provenance, Event timeline,
  Public-data feeds, Active patterns).

### Added — UI/UX overflow fixes

- `.section-header`, `.registry-card`, `.registry-method`,
  `.registry-meta` button, `.bullet-list li`, `.board-meta-row`,
  `.freshness-badge`, `.stance-pill`, `.button.small`, `.driver-row`
  all gained `min-width: 0` + `overflow-wrap: anywhere` /
  `word-break: keep-all` to handle long Korean strings without
  bursting cards or layouts.
- Responsive grid switched to `repeat(auto-fit, minmax(280px, 1fr))`
  for `.registry-grid` / `.module-grid`. Added a 720px breakpoint
  that stacks `.section-header` and `.workspace-head` vertically.
- `.driver-head` is hidden below 1180px so the table reflows cleanly
  to a card stack.

### Added — CI + release governance

- `.github/workflows/ci.yml` extended with a Calibration freshness
  check step.
- README rewritten end-to-end with a decision-support framing.
  Headline question is now "buy / hold / reduce carbon allowances?"
  and the eight signal layers are enumerated. Trivial sections
  (light/dark skin, watchlist drawer, command palette feature tour)
  removed in favour of the signal-stack story.

### Tests

- `tests/catalystEventLog.test.ts` — schema, citation hygiene,
  market-scenario mapping.
- `tests/eventStudy.test.ts` — pre/post window arithmetic, hit
  classification, multiplier clamping.
- `tests/catalystCalibration.test.ts` — deterministic build, multi-layer
  resolver, backtest promotion.
- `tests/catalystTriggerDetector.test.ts` — freshness / price-jump
  classification, active-ratio threshold, untestable handling.

### Verification

- type-check: clean
- vitest: 22 files / 185 tests
- node:test: 53 / 53
- eslint: 0 errors / 0 warnings
- build: clean (361 kB / 109 kB gzip)
- ci:verify: clean
- calibration:check: clean (1d age)

## [1.1.0] — 2026-04-30

First minor after the 1.0 cut. Adds the four "always-on desk" features
that the original 1.0 design left for follow-up.

### Added

- **System tray + background data refresh**. Closing the main window
  no longer quits the app — it hides to the tray and the background
  loop continues to refresh sources every 5 minutes. Tray menu has
  Show / Hide / Refresh now / Quit. Click the tray icon to toggle the
  window. New `runInTray` setting (default on); set to false to fall
  back to the 1.0 close-quits behavior.
- **Custom alerts + native OS notifications**. New rule kind
  `freshness` fires when an official anchor age exceeds a chosen
  threshold (1h / 4h / 12h / 24h presets). Persisted at
  `<userData>/alerts.json` (max 32 rules). Background tick + manual
  `alertsEvaluateNow()` IPC. Notifications respect the
  `notificationsEnabled` setting. Cooldown prevents repeat fires.
  Drawer UI (⌘K → "Open alerts") with builder, list, enable toggle,
  delete.
- **Korean number formatting (만 / 억 / 조)**. `formatKoreanNumber()`
  - `formatLocalizedNumber(value, locale, options)` in
    `src/lib/koreanNumber.ts`. Unit boundaries at 10k / 100M / 1T,
    trailing-zero trim, currency prefix, negative sign. Used when the
    active locale is Korean.
- **Surface search (⌘F / Ctrl+F)**. Browser-style find-in-page
  scoped to the workspace. Walks the live DOM under `.app-main`,
  wraps matches in `<mark.surface-search-hit>`, supports next /
  previous navigation and active-match highlight. Esc closes.

### Files

- `electron/alerts.js`, `tests/alerts.test.js`
- `src/lib/koreanNumber.ts`, `tests/koreanNumber.test.ts`
- `src/lib/SurfaceSearch.tsx`
- `src/lib/AlertsDrawer.tsx`
- New i18n keys (alerts.\*, search.placeholder)
- New shell CSS (.surface-search, .alerts-builder, .surface-search-hit)
- `appSettings.js` extended with `runInTray`, `notificationsEnabled`
- `main.js` Tray + background-refresh + native notifications
- `preload.js` + `desktopBridge.ts` exposing alerts IPC

### Verification

- type-check: clean
- vitest: 118 / 118 across 14 suites (added `alerts`, `koreanNumber`)
- node:test: 53 / 53
- eslint: 0 errors, 0 warnings
- npm audit: 0 vulnerabilities

## [1.0.1] — 2026-04-29

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
landed on `main` between the initial fork point and this tag. Release
assets:

- `C-Quant-1.0.0-portable.exe` (~94 MB) — zero-install single-file
- `C-Quant-Setup-1.0.0.exe` (~95 MB) — NSIS installer; chosen path
  for the auto-updater
- `C-Quant-Setup-1.0.0.exe.blockmap` — delta-update map
- `latest.yml` — `electron-updater` feed metadata

All Windows artifacts are unsigned at this release. Distributors should
sign before redistribution.

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
