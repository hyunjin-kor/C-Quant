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

To enable the K-ETS live card, register a KRX Open API key via the
[KRX Open API portal](https://openapi.krx.co.kr/) and put it in `.env`:

```
CQUANT_KRX_AUTH_KEY=your-key-here
```

Without it, the K-ETS adapter reports a configuration error; the EU and
China surfaces still work.

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

CI runs the same gates on every push and PR across `windows-latest` (primary), `macos-latest`, and `ubuntu-latest` (advisory until cross-platform packaging stabilises). See [.github/workflows/ci.yml](.github/workflows/ci.yml).

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

### End-to-end release flow

The recommended path is the GitHub Actions release workflow at
[.github/workflows/release.yml](.github/workflows/release.yml). It
builds Windows / macOS / Linux in parallel, signs (when secrets are
configured), and uploads to a draft GitHub Release on the same tag.

1. **Bump version** in `package.json` and add a CHANGELOG entry under
   the new version heading.

2. **Configure code signing secrets** (one-time setup) in repository
   Settings → Secrets and variables → Actions. Step-by-step in
   [SECURITY.md](SECURITY.md#setting-up-code-signing-step-by-step).
   Without these, the workflow still produces unsigned artefacts —
   useful for pre-release validation.

3. **Tag and push**:

   ```bash
   git tag v$(node -p "require('./package.json').version")
   git push --tags
   ```

4. **Watch the workflow** at the repo's Actions tab. It produces a
   draft release with all platform artefacts attached.

5. **Review the draft**, polish the release notes, then publish.

6. End users on the NSIS installer see the in-app update banner on
   next launch (driven by `electron-updater` reading `latest.yml`).
   They click **Download → Restart & install**; the update is verified
   against the publisher's signature before replacing the running
   binary (assuming the build was signed).

#### Local manual release (fallback)

When you need to produce signed binaries from a local Mac/Windows
machine without GitHub Actions, set the same env vars locally:

```bash
# Windows code signing
CSC_LINK=/path/to/cert.pfx
CSC_KEY_PASSWORD=...

# macOS code signing + notarization
CSC_NAME="Developer ID Application: Your Name (TEAMID)"
APPLE_ID=...
APPLE_APP_SPECIFIC_PASSWORD=...
APPLE_TEAM_ID=...

# GitHub publish
GH_TOKEN=...
```

Then build the relevant target:

```bash
npm run package:nsis        # Windows installer
npm run package:portable    # Windows portable
npm run package:mac         # macOS dmg + zip (x64 + arm64)
npm run package:linux       # Linux AppImage + deb
```

With `GH_TOKEN` set, electron-builder uploads the artefacts (and the
`latest.yml` update manifest) directly to the matching GitHub release.

### Smoke-test a release locally

```bash
# Portable build (no install, just run)
CQUANT_DISABLE_UPDATER=1 ./release/C-Quant-X.Y.Z-portable.exe

# NSIS installer (registers the app, wires the auto-updater)
./release/C-Quant-Setup-X.Y.Z.exe
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
