# Security policy

## Supported versions

The `main` branch and the most recent tagged release receive security fixes.

| Series | Status          | Notes                                                                     |
| ------ | --------------- | ------------------------------------------------------------------------- |
| 1.0.x  | ✅ Maintained   | Current line. Critical security patches and high-severity bugs land here. |
| < 1.0  | ❌ Unmaintained | Pre-release tags exist for historical reference only. Upgrade to 1.0.     |

A 1.x release will be supported until the next minor (1.1) is published,
plus a 60-day overlap. The overlap window will be documented on each
minor release in `CHANGELOG.md`.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems. Instead:

1. Email the maintainer at the address listed in the GitHub profile of
   [@hyunjin-kor](https://github.com/hyunjin-kor), with subject prefix
   `[C-Quant security]`.
2. Include a reproduction, the affected version (Help → About C-Quant or
   the file name in `release/`), and the impact you observed.
3. We will acknowledge within 5 business days and aim for a fix or
   coordinated disclosure plan within 30 days for high-severity issues.

If you need PGP, request a key in your first email.

## Threat model (informational)

C-Quant is a desktop research workstation. Its security posture is built
around the Electron baseline and a strict IPC perimeter:

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  `webSecurity: true`, `webviewTag: false`
- Renderer scripts run under a strict Content-Security-Policy injected
  by the main process (`session.webRequest.onHeadersReceived`). Production
  CSP forbids `unsafe-inline` and `unsafe-eval` for scripts.
- Every IPC handler validates the sender origin via `assertTrustedSender`.
  Origins outside the bundled `dist/index.html` (production) or the
  `localhost:5173` Vite dev server (development) are rejected.
- External URLs go through `normalizeExternalUrl` which only allows
  `http:` / `https:` and routes the navigation to `shell.openExternal`.
- Local-service URLs (e.g. an Ollama base URL) only accept loopback hosts
  and reject paths.
- Quote and backtest IDs are validated against `/^[a-z0-9-]+$/i` with
  length caps before they touch the filesystem.
- Logs (`<userData>/logs/cquant.log`), settings, watchlist, and backtest
  archives are stored under `app.getPath("userData")`. They are not
  uploaded.
- Telemetry (`@sentry/electron`) is disabled by default. It activates
  only when `CQUANT_SENTRY_DSN` is set in the environment.
- Analytics (`electron/analytics.js`) is disabled by default. Activation
  requires both the user opt-in (`analyticsEnabled` setting) **and** an
  operator-provided `CQUANT_ANALYTICS_ENDPOINT`. Properties are
  filtered to primitive types; no PII or IP addresses are added by the
  module itself.

What is **out of scope** for this threat model:

- Compromise of the operator's machine. If an attacker has local code
  execution, they can read settings, logs, and workbench state.
- Compromise of upstream public sources (EEX, KRX, MEE, Yahoo Finance).
  C-Quant cross-references multiple sources but cannot detect a
  coordinated upstream lie.
- Unsigned binaries shipped without `CSC_LINK` (Windows) or
  `CSC_NAME`/Apple notarization (macOS). When the operator opts out of
  code signing, end users see SmartScreen / Gatekeeper warnings; that is
  by design.

## Known limitations

- The KRX sample auth key bundled in `electron/liveSources.js` is the
  publicly documented sample key from the KRX Open API portal. Do not
  treat it as a secret — replace it with your registered key by setting
  `CQUANT_KRX_AUTH_KEY` in the environment.
- The renderer's electron-updater feed reads from public GitHub releases.
  Anyone who can publish to the release feed can ship code that the
  updater installs. We require code signing to be configured on the
  publishing side (`CSC_LINK` / `CSC_NAME`).
- Crash dumps from `crashReporter` are local-only (`uploadToServer:
false`) unless explicitly reconfigured.

## Hardening checklist for distributors

If you ship a packaged build to end users, please confirm:

- [ ] `CSC_LINK` / `CSC_KEY_PASSWORD` (Windows) and `CSC_NAME` /
      `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` (macOS)
      are set so binaries are signed and notarized.
- [ ] `GH_TOKEN` is set so electron-builder can publish artifacts that
      the updater can verify.
- [ ] `CQUANT_SENTRY_DSN` (optional) is set on a build pipeline you
      control, not on the end-user machine.
- [ ] You have a public security contact (email, security.txt, or a
      bug-bounty platform) reachable from the published app.
- [ ] You communicate to end users that C-Quant is research-only and
      does not provide trade execution.

## Coordinated disclosure timeline

| Severity                                                | Initial response        | Public disclosure      |
| ------------------------------------------------------- | ----------------------- | ---------------------- |
| Critical (RCE, auth bypass, supply-chain)               | within 24h              | after fix is published |
| High (CSP bypass, IPC escape, log injection)            | within 5 business days  | after fix is published |
| Medium / Low (logic flaw, denial-of-service, hardening) | within 10 business days | with the next release  |
