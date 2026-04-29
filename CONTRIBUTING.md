# Contributing to C-Quant

Welcome. C-Quant is a desktop research workstation for EU, Korea, and China
carbon markets. The product boundary is **research, monitoring, and briefing**
— not trade execution. Every change should respect that boundary.

## Quick start

```bash
# Node 24+ required
nvm use            # picks up .nvmrc
npm install
cp .env.example .env   # optional — only if you have your own keys
npm run dev            # Vite + Electron, concurrent
```

If you have a registered KRX API key, put it in `.env`:

```
CQUANT_KRX_AUTH_KEY=your-key-here
```

Otherwise the bundled public sample key is used.

## Quality gates

Run locally before opening a PR:

```bash
npm run type-check     # tsc --noEmit
npm run lint           # eslint flat config
npm run format         # prettier --write
npm run test:all       # vitest + node:test localization suite
npm run build          # type-check + vite build
npm run bundle:check   # enforce bundle budgets
```

CI runs the same gates on `windows-latest` for every push and PR.

## Truth rules (from `AGENTS.md` / `CLAUDE.md`)

1. **Prefer official exchange, ministry, and statistics sources.** Vendor
   feeds are reference proxies, never primary anchors.
2. **Show source freshness and access method** alongside every datum.
3. **Bound model and scenario claims.** Scenario output is not a calibrated
   live price target.
4. **Never invent links.** Add a URL only after it's provided or verified.
5. **No order routing or execution.** The product boundary is research.

## Code style

- TypeScript strict mode is enabled. Add types instead of `any` where
  reasonable.
- Run Prettier before committing — `npm run format`.
- Keep components small and surfaces focused. `App.tsx` is large historically;
  new code should land in `src/components/surfaces/*` or a dedicated module
  under `src/lib/`.
- Korean source strings live in `src/data/locales.ts`. Renderer code calls
  `localizeText`/`localizeTextWithFallback` rather than hardcoding strings.

## Tests

Two runners coexist:

- **Vitest** for new modules. Lives in `tests/*.test.{js,ts}`. Run with
  `npm test`.
- **`node:test`** for the legacy localization suite. Lives in
  `tests/localization*.test.mjs`. Run with `npm run test:node`.

When adding a security helper or any logic in `electron/*.js`, add a Vitest
spec — the IPC perimeter is sensitive.

## Commit messages

Short imperative title (under 70 chars), then a body that explains _why_:

```
Harden CSP and persist window state

Move CSP from <meta> into the Electron session so production no longer
ships with 'unsafe-inline'. Persist window bounds across launches via
electron/windowState.js so users with multi-monitor setups don't lose
position.
```

## Pull requests

- Reference any related issue.
- Include a "Test plan" section with the commands you ran.
- Don't include unrelated formatting churn.
- For UX changes, attach before/after screenshots.

## Release

`npm run package:portable` produces a Windows portable `.exe` in `release/`.
The build workflow expects `package:portable` to pass cleanly; if you
introduce a regression in packaging, mention it in the PR description.

### End-to-end release flow (signed + auto-update wired)

1. Bump `version` in `package.json` (and `CHANGELOG.md` heading).

2. Set the operator-side environment in your shell or CI secrets:

   ```bash
   # Windows code signing
   CSC_LINK=/path/to/cert.pfx
   CSC_KEY_PASSWORD=...

   # macOS code signing + notarization (only when shipping mac)
   CSC_NAME="Developer ID Application: Your Name (TEAMID)"
   APPLE_ID=...
   APPLE_APP_SPECIFIC_PASSWORD=...
   APPLE_TEAM_ID=...

   # GitHub releases (electron-builder publish + auto-update feed)
   GH_TOKEN=...
   ```

3. Build + publish artifacts:

   ```bash
   npm run package:nsis        # Windows installer
   npm run package:portable    # Windows portable
   npm run package:mac         # macOS dmg + zip (x64 + arm64)
   npm run package:linux       # Linux AppImage + deb

   # Or all in one shot (requires a multi-arch host or CI matrix):
   npm run package:all
   ```

   With `GH_TOKEN` set, electron-builder publishes the artifacts (and the
   `latest.yml` update manifest) to a GitHub release matching the
   current version.

4. Tag and push:

   ```bash
   git tag v$(node -p "require('./package.json').version")
   git push --tags
   ```

   When the release is public, the in-app `electron-updater` feed picks
   it up on the next launch and surfaces the in-app update banner.

5. End users see the banner, click **Download**, then **Restart &
   install**. The update is verified against the publisher's signature
   before it replaces the running binary.

### Smoke-test a release locally

```bash
CQUANT_DISABLE_UPDATER=1 ./release/C-Quant-X.Y.Z.exe
```

The `CQUANT_DISABLE_UPDATER=1` env var prevents the freshly-built
binary from contacting GitHub during local QA.

## Regenerate screenshots

The README and `docs/USAGE.md` embed real screenshots taken from a
running build. To refresh them after a UI change:

```bash
npm run build       # produce dist/
npm run capture     # walks the renderer + saves PNGs to docs/images/
```

`tools/capture-screenshots.mjs` uses Playwright's `_electron.launch()`
to drive Electron headfully on Windows. It pre-seeds `localStorage`
so each shot mounts in a deterministic state (locale, theme, surface,
market). The script reads `dist/index.html` directly via
`CQUANT_LOAD_DIST=1` instead of spinning up the Vite dev server.

If you add a new surface or a major chrome change, also:

1. Add a corresponding `seedAndReload({...})` + `snap()` call to the
   capture script.
2. Reference the new PNG from `README.md` and / or `docs/USAGE.md`.
3. Commit the regenerated PNGs alongside the code change so the
   docs and the UI stay in sync.

The hero, decision-flow, and architecture diagrams remain hand-coded
SVG (they are illustrations, not screenshots) and live in
`docs/images/` next to the captures.

## Reporting issues

Please include:

- Build version (`Help → About C-Quant` or the file name in `release/`)
- Windows version
- A short reproduction
- The contents of `<userData>/logs/cquant.log` for the relevant time window

`<userData>` resolves to `%APPDATA%/C-Quant` on Windows.
