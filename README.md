# C-Quant

<p align="center">
  <img src="docs/images/hero.svg" alt="C-Quant — carbon decision desk" width="100%"/>
</p>

**A desktop research workstation for global carbon allowance markets — EU ETS, K-ETS, China ETS.**

C-Quant is a calm, evidence-first decision desk. It pulls the official
auction tape, ministry bulletin, or exchange snapshot first; layers in
listed hedge benchmarks and listed proxies; then surfaces a single
opinion (buy / hold / reduce) with the drivers and source freshness
that built it.

It does **not** execute trades, custody assets, or intermediate
settlement. It is research and monitoring software.

[![CI](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml/badge.svg)](https://github.com/hyunjin-kor/C-Quant/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 24+](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](.nvmrc)

> 📘 **First time here?** Jump to **[docs/USAGE.md](docs/USAGE.md)** for a screen-by-screen walkthrough.
> 처음이라면 [사용 가이드(USAGE.md)](docs/USAGE.md)를 먼저 읽어보세요.

---

## At a glance / 한눈에 보기

<p align="center">
  <img src="docs/images/decision-flow.svg" alt="The four-step decision workflow" width="100%"/>
</p>

Every C-Quant session walks the same path: **read the official anchor → compare with the listed proxy → check the drivers → decide**. Surfaces are organized to support that loop.

C-Quant 세션은 항상 같은 흐름을 따릅니다 — **공식 앵커 읽기 → 상장 프록시와 비교 → 드라이버 점검 → 결정**. 화면들은 이 루프를 지원하도록 구성됐습니다.

### Command surface — what you see when you launch

<p align="center">
  <img src="docs/images/shot-command-light.png" alt="Command surface — actual screenshot" width="100%"/>
  <br/><sub><i>Live capture — K-ETS · live tape refresh every 30s · KRX ETS sample API connected</i></sub>
</p>

The default landing screen answers: **"What should I do today, and why?"** Market strip up top, anchor-vs-tape chart in the centre, decision memo on the right, drivers and source freshness across the bottom.

기본 첫 화면은 한 가지 질문에 답합니다 — **"오늘 무엇을 해야 하고, 왜 그런가?"**. 상단에 시장 스트립, 중앙에 앵커 vs 테이프 차트, 우측에 의사결정 메모, 하단에 드라이버와 소스 신선도.

### Drivers, Desk, Sources — the rest of the loop

<table>
  <tr>
    <td width="50%">
      <img src="docs/images/shot-desk-light.png" alt="Desk surface" width="100%"/>
      <br/><sub align="center"><b>Desk</b> — single-market deep dive with cross-market context</sub>
    </td>
    <td width="50%">
      <img src="docs/images/shot-drivers-light.png" alt="Drivers surface" width="100%"/>
      <br/><sub align="center"><b>Drivers</b> — cross-market driver structure heatmap</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/images/shot-sources-light.png" alt="Sources surface" width="100%"/>
      <br/><sub align="center"><b>Sources</b> — provenance, access method, freshness</sub>
    </td>
    <td width="50%" valign="top" style="padding-left:1rem">
      <p>Each surface answers a different question:</p>
      <ul>
        <li><b>Desk</b> — "What does <i>this one market</i> look like right now?"</li>
        <li><b>Drivers</b> — "Which factors are pushing each ETS this week?"</li>
        <li><b>Sources</b> — "Where exactly did each datum come from, and how fresh is it?"</li>
      </ul>
    </td>
  </tr>
</table>

### Power UX — ⌘K is the entry point for everything

<p align="center">
  <img src="docs/images/shot-cmd-k.png" alt="Command palette filtered to 'theme'" width="100%"/>
  <br/><sub><i>⌘K opened with "theme" typed — fuzzy-matched to all Appearance commands</i></sub>
</p>

Press **⌘K** (macOS) or **Ctrl+K** (Windows / Linux) anywhere to open the palette. ~25 commands across 8 groups: theme, language, watchlist, exports, updates, privacy, diagnostics, help.

어디서든 **⌘K** / **Ctrl+K** 로 팔레트를 엽니다. 8개 그룹 약 25개 명령 (테마, 언어, 워치리스트, 내보내기, 업데이트, 프라이버시, 진단, 도움말).

### Light & dark — same data, two skins

<table>
  <tr>
    <td width="50%"><img src="docs/images/shot-command-light.png" alt="Light mode" width="100%"/><br/><sub align="center"><b>Claude warm cream (light)</b></sub></td>
    <td width="50%"><img src="docs/images/shot-command-dark.png" alt="Dark mode" width="100%"/><br/><sub align="center"><b>Warm-dark variant</b></sub></td>
  </tr>
</table>

Toggle via the floating button (bottom-right) or ⌘K → "Theme: Dark". Set "Match system" to follow the OS-level `prefers-color-scheme`.

우하단 플로팅 버튼 또는 ⌘K → "Theme: Dark"로 토글. "Match system"으로 OS 설정을 따라가게 할 수 있습니다.

### Watchlist — pin the views you keep coming back to

<p align="center">
  <img src="docs/images/shot-watchlist-drawer.png" alt="Watchlist drawer with one pinned K-ETS view" width="100%"/>
  <br/><sub><i>One K-ETS · command view pinned · click the row to restore</i></sub>
</p>

⌘K → **"Pin current view to watchlist"** to bookmark a market + surface combination. ⌘K → **"Open watchlist"** to bring back the drawer and click any row to restore.

⌘K → **"Pin current view to watchlist"** 로 시장 + 화면 조합을 북마크. ⌘K → **"Open watchlist"** 로 드로어를 열고 행 클릭으로 즉시 복원.

➡️ **More walkthroughs (workflows, exports, drag-and-drop CSV, troubleshooting):** [docs/USAGE.md](docs/USAGE.md)
➡️ **워크플로우, 내보내기, CSV 드래그앤드롭, 트러블슈팅 등 자세한 가이드:** [docs/USAGE.md](docs/USAGE.md)

---

## What it does

- Reads the **official anchor** for each ETS first
  - EU: EEX EU ETS auctions (workbook + auction page)
  - Korea: KRX ETS information platform + KRX Open API sample
  - China: MEE carbon-market release feed + Shanghai Environment & Energy daily bulletin
- Brings **listed proxies and hedge benchmarks** into the app via public
  chart APIs (ICE EUA front-month, KRBN, KEUA, CO2.L, KCCA, TTF, Brent)
- Builds a **decision pack**: gap, recent co-movement, direction match,
  source freshness, driver map, scenario weights
- Keeps the **driver categorization** and **trust boundary** visible —
  every metric carries its access method and last-verified timestamp
- Offers a **command palette** (`⌘K` / `Ctrl K`) that can flip theme,
  switch language, export PDF/CSV/Markdown, pin views, check for
  updates, and open the local data folder
- Persists **theme**, **locale**, **window state**, **watchlist**, and
  **backtest archives** across launches in `<userData>/`

## Design principles

| Principle            | How it shows up                                                                 |
| -------------------- | ------------------------------------------------------------------------------- |
| Official first       | Every market view starts from the official anchor; vendor proxies sit below it  |
| Show freshness       | Every datum carries its access method and timestamp                             |
| No brokerage         | The product can describe and compare; it does not route or settle               |
| Explain, then signal | A posture is only shown after the drivers and counter-evidence that produced it |

## Screens

| Surface     | What you see                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------- |
| **Command** | Cross-market board, official anchor, live comparison tape, posture, score build, decision memo |
| **Desk**    | Single-market deep dive: anchor, hedge tape, drivers, scenario weights                         |
| **Drivers** | Cross-market factor heatmap, market-specific driver table, indicators worth running            |
| **Sources** | Source method, freshness, in-app benchmark catalogue, input coverage, source-trust registry    |

## Quick start

> Requires **Node 24** (see `.nvmrc`) and **Windows 10/11** for the
> primary build target. macOS and Linux builds are advisory.

```powershell
nvm use            # Picks up .nvmrc
npm install
cp .env.example .env   # Optional — only when you have your own keys/DSN
npm run dev
```

`npm run dev` starts Vite on `http://localhost:5173` and Electron
against it. The first build can be slow because of the variable-font
woff2 emit; subsequent dev cycles are fast.

## Quality gates

Run locally before opening a PR:

```bash
npm run type-check       # tsc --noEmit
npm run lint             # eslint flat config
npm run format           # prettier --write
npm test                 # vitest
npm run test:node        # node:test (legacy localization suite)
npm run test:all         # both runners
npm run build            # type-check + vite build
npm run bundle:check     # enforce bundle budgets
npm run e2e              # Playwright Electron smoke
```

CI runs the same gates on Windows, macOS, and Linux for every push and
PR. macOS and Linux are advisory until cross-platform packaging
stabilizes.

## Build & distribute

### Download v1.0.0 directly

Latest release: [**v1.0.0**](https://github.com/hyunjin-kor/C-Quant/releases/tag/v1.0.0)

| Asset                        | When to pick it                                                                |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `C-Quant-1.0.0-portable.exe` | Zero-install, double-click to run. Settings persist under `%APPDATA%\C-Quant\` |
| `C-Quant-Setup-1.0.0.exe`    | Standard NSIS installer. Wires the in-app auto-updater for future releases     |

> SmartScreen will warn on first launch (the 1.0 binary is not yet code-signed) — click **More info → Run anyway**.
> 첫 실행 시 SmartScreen 경고가 뜹니다 (1.0은 아직 코드사이닝되지 않음). **추가 정보 → 실행** 누르면 됩니다.

### Local artifacts

```powershell
npm run package:portable   # C-Quant-X.Y.Z-portable.exe
npm run package:nsis       # C-Quant-Setup-X.Y.Z.exe + latest.yml + .blockmap
npm run package:mac        # macOS dmg + zip (x64 + arm64)
npm run package:linux      # Linux AppImage + deb
```

### Production release flow

1. **Sign**: provide certs via env (Windows: `CSC_LINK` +
   `CSC_KEY_PASSWORD`. macOS: `CSC_NAME` + Apple notarization vars).
   See [`.env.example`](.env.example).
2. **Build & publish**: `npm run package:portable` (or any platform)
   with `GH_TOKEN` set so electron-builder uploads the artifacts to a
   GitHub release.
3. **Auto-update** picks up the release feed on the next launch and
   prompts the user via the in-app update banner.

`docs/ARCHITECTURE.md` has the full process model and the operator
checklist for what needs to be configured externally (DSNs, certs,
update feed).

## Power UX

| Action                               | Shortcut                                       |
| ------------------------------------ | ---------------------------------------------- |
| Command palette                      | `⌘K` / `Ctrl+K`                                |
| Toggle theme                         | Bottom-right floating button or palette        |
| Toggle language                      | Palette: "한국어로 전환" / "Switch to English" |
| Pin current view                     | Palette: "Pin current view to watchlist"       |
| Open watchlist                       | Palette: "Open watchlist"                      |
| Open backtest archive                | Palette: "Open backtest archive"               |
| Export view as PDF                   | Palette: "Export current view as PDF"          |
| Export diagnostics as CSV / Markdown | Palette: same group                            |
| Drop a CSV onto the window           | Anywhere — the app intercepts and validates    |
| Reduced motion                       | Palette: "Motion: reduce animations"           |

Skip-to-content link, focus rings on every interactive surface, and
`prefers-reduced-motion` are all wired.

## Data layer

### Official sources

| Market    | Anchor                                                                        |
| --------- | ----------------------------------------------------------------------------- |
| EU ETS    | EEX EU ETS primary auction workbook + auction page                            |
| K-ETS     | KRX ETS information platform + KRX Open API sample (`ets_bydd_trd`)           |
| China ETS | MEE carbon-market release feed + Shanghai Environment & Energy daily overview |

### Linked tapes (proxies, not official settlement)

ICE EUA December benchmark, KRBN, KEUA, CO2.L, KCCA, Dutch TTF gas,
Brent — pulled via public chart endpoints and labeled as proxies.

### Cache + rate limits

`electron/cache.js` caps the live-source cache at 256 entries with
per-key TTL (10 min for EU cards, 12 h for KRX day data, 30 s for
quotes). Expired entries are pruned lazily on overflow before LRU
eviction.

KRX uses a public sample key by default. Override with your registered
key:

```bash
CQUANT_KRX_AUTH_KEY=your-real-key
```

## Privacy stance

- **No telemetry by default.** The app runs locally and does not contact
  any analytics server unless the operator explicitly configures one.
- `@sentry/electron` is loaded but inactive without `CQUANT_SENTRY_DSN`.
- `electron/analytics.js` requires _both_ a user opt-in
  (`analyticsEnabled` setting) and `CQUANT_ANALYTICS_ENDPOINT` env var
  before it sends anything.
- Crash reports from `crashReporter` are local-only.
- KRX, EEX, MEE, and Yahoo Finance receive only the request you would
  make if you visited their pages directly. Cookies are not persisted
  across sessions for those domains.

See [SECURITY.md](SECURITY.md) for the full threat model.

## Project meta

- **Usage guide**: [docs/USAGE.md](docs/USAGE.md) — screen-by-screen walkthrough with diagrams
- **License**: [MIT](LICENSE) (third-party deps keep their own)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)
- **Agent / Claude operating notes**: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md)
- **Open-source benchmarks we borrow patterns from**: [docs/open-source-benchmark-map.md](docs/open-source-benchmark-map.md)

### Process architecture

<p align="center">
  <img src="docs/images/architecture.svg" alt="Process architecture: main, preload, renderer" width="100%"/>
</p>

Three execution contexts, one IPC perimeter, all persistence under
`<userData>`. The full module map and provider tree live in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

세 실행 컨텍스트, 단일 IPC 경계, 모든 영속화는 `<userData>` 아래.
전체 모듈 맵과 프로바이더 트리는
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Truth boundary

- If an official public API is not confirmed, the app labels the source
  as an **official web flow** or **official file** instead of pretending
  it is an API.
- If a listed tape is only available as a public chart feed, the app
  labels it as a **linked tape** or **proxy** and keeps the official
  carbon source separate.
- Scenario and signal outputs are constrained to evidence-backed
  research support and must not fabricate official facts or behave like
  execution assistance.
- China ETS daily exchange pages can be rate-limited or blocked in some
  environments, so the official China layer remains bulletin-first
  unless a stable official feed is reachable.

## Autonomous loop (developer-side, optional)

The repo includes a persistent autonomy framework so repeated
development rounds do not have to rediscover context. See
[`docs/autonomy-state.md`](docs/autonomy-state.md). The autonomy monitor
is a separate local web app at `http://127.0.0.1:4781`; it is **not**
part of the shipped product.

```powershell
npm run autonomy:monitor:open   # opens the dashboard in a browser
npm run autonomy:cycle          # one verification cycle
npm run autonomy:status         # current loop state
```

## Limits

- Yahoo Finance data can be exchange-delayed. C-Quant labels each linked
  tape with its delay note; do not read it as live settlement.
- Local ETS futures are not added unless a verified free feed is
  available; where needed the app labels listed proxies as proxies.
- `npm audit` flags issues in transitive dev dependencies of
  electron-builder. Re-evaluate before each release; do not run
  `npm audit fix --force` casually because some of those flags are
  Linux-only or have no fix path yet.
