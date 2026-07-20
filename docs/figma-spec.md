# C-Quant Figma Spec — 4 surfaces

**Version:** v1.3.x
**Reviewed:** 2026-05-06
**Audience:** Designer producing canonical Figma screens for the four primary surfaces.

This is a designer brief, not a Figma file. Once the actual Figma is produced, link it from [docs/project-links.md](project-links.md) and tick the corresponding queue item in [docs/autonomy-state.md](autonomy-state.md).

> **Source-of-truth contract**: every value here is grounded in a live file. If you find a divergence between this brief and the running app, the running app wins — please file a doc bug rather than designing against a stale spec. Token values come from [src/styles.css](../src/styles.css). Component anatomy comes from [src/components/surfaces/](../src/components/surfaces) and the Drivers branch in [src/App.tsx](../src/App.tsx). Surface descriptions cross-reference [docs/USAGE.md](USAGE.md) §2-§2.5.

---

## 0. Foundation

### 0.1 Canvas

- **Viewport target**: desktop, primary 1440 × 900 (typical operator monitor) and 1920 × 1080 (large screen).
- **Min content width**: 1280 px before horizontal scroll. Below that the layout collapses chart-first columns to stacked.
- **Window chrome**: native Electron frame on Windows; native macOS traffic-light buttons. Not in-app.

### 0.2 Color tokens (light theme)

| Role | Token | Hex |
|---|---|---|
| Background | `--bg` | `#ffffff` |
| Panel | `--panel` | `#ffffff` |
| Panel (muted) | `--panel-muted` | `#f9fafb` |
| Panel (tint) | `--panel-tint` | `#f2f4f6` |
| Text — strong | `--text-strong` | `#191f28` |
| Text — base | `--text-base` | `#4e5968` |
| Text — soft | `--text-soft` | `#8b95a1` |
| Text — mute | `--text-mute` | `#b0b8c1` |
| Text on accent | `--text-on-accent` | `#ffffff` |
| Line | `--line` | `#e5e8eb` |
| Line — strong | `--line-strong` | `#d1d6db` |
| Accent | `--accent` | `#0064ff` (Toss-style blue) |
| Accent — strong | `--accent-strong` | `#0050c7` |
| Accent — soft | `--accent-soft` | `#e8f2ff` |
| Accent — ink | `--accent-ink` | `#003e99` |
| Up / fresh | `--green` | `#22c55e` |
| Up — soft | `--green-soft` | `#dcfce7` |
| Down / stale | `--red` | `#f04452` |
| Down — soft | `--red-soft` | `#fde7e9` |
| Watch / warn | `--yellow` | `#ff9f2d` |
| Watch — soft | `--yellow-soft` | `#fff3e0` |
| Rail | `--rail` | `#1b1f23` |
| Rail — soft | `--rail-soft` | `#8b95a1` |

### 0.3 Color tokens (dark theme)

| Role | Token | Hex |
|---|---|---|
| Background | `--bg` | `#0e1014` |
| Panel | `--panel` | `#17191c` |
| Panel (muted) | `--panel-muted` | `#1c1f23` |
| Panel (tint) | `--panel-tint` | `#21252b` |
| Text — strong | `--text-strong` | `#f2f4f6` |
| Text — base | `--text-base` | `#d1d6db` |
| Text — soft | `--text-soft` | `#8b95a1` |
| Text — mute | `--text-mute` | `#6b7684` |
| Line | `--line` | `#2c3037` |
| Line — strong | `--line-strong` | `#3a3f48` |
| Accent | `--accent` | `#3d86ff` |
| Accent — strong | `--accent-strong` | `#5a99ff` |
| Accent — soft | `--accent-soft` | `#15233d` |
| Accent — ink | `--accent-ink` | `#d6e6ff` |
| Up / fresh | `--green` | `#2ed670` |
| Down / stale | `--red` | `#ff5f6d` |
| Watch / warn | `--yellow` | `#ffb43d` |

Light/dark are switched by `:root[data-theme="dark"]`. The OS preference is followed when the user has not explicitly set a theme. Mock both states for every surface.

### 0.4 Typography

| Role | Stack | Source |
|---|---|---|
| UI — Inter Variable | `Inter Variable` | `@fontsource-variable/inter` (bundled, self-hosted) |
| Display — Fraunces Variable | `Fraunces Variable` | `@fontsource-variable/fraunces` (bundled) |
| Mono | JetBrains Mono / SF Mono / Cascadia / Consolas | system fallback |
| Korean | Pretendard variable | `@fontsource/pretendard` |

Use Inter for everything except large hero numbers. Use Fraunces only for the headline price number on the Command anchor card and the major decision-memo callout. Mono is for tabular numerics (volume, basis, hit rate).

Type ramp (use as a starting scale; refine in Figma):

| Style | Size / line-height | Weight |
|---|---|---|
| Display XL (anchor price) | 64 / 72 px | 600, Fraunces |
| Display L (decision posture) | 40 / 48 px | 600, Fraunces |
| Heading L | 28 / 36 px | 600 |
| Heading M | 22 / 30 px | 600 |
| Heading S | 18 / 26 px | 600 |
| Body L | 16 / 24 px | 400 |
| Body M | 14 / 22 px | 400 |
| Body S | 13 / 20 px | 400 |
| Caption | 12 / 18 px | 500 |
| Tabular numeric | 14 / 22 px | 500, Mono |

### 0.5 Radius / spacing / motion

| Token | Value |
|---|---|
| `--radius-sm` | 10 px |
| `--radius-md` | 14 px |
| `--radius-lg` | 18 px |
| `--radius-xl` | 22 px |
| `--motion-fast` | 140 ms |
| `--motion-base` | 220 ms |
| `--motion-slow` | 320 ms |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--focus-ring` | `0 0 0 3px rgba(0, 100, 255, 0.24)` (light) |
| Shadow (default) | `0 8px 24px rgba(25, 31, 40, 0.06), 0 1px 2px rgba(25, 31, 40, 0.04)` |
| Shadow (lifted) | `0 12px 32px rgba(25, 31, 40, 0.08), 0 2px 4px rgba(25, 31, 40, 0.06)` |

Spacing scale is on a 4 px grid: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

### 0.6 Cross-surface chrome

These pieces appear on every surface and should be a single Figma component:

- **Top bar**: app icon (left), surface tabs (Command / Drivers / Desk / Sources, center), market chips (EU / KR / CN, right). Active tab uses `--accent` underline. Active market chip uses `--accent-soft` background + `--accent` text.
- **Skip link** (focus-only): "Skip to workspace" — appears on Tab focus, visually hidden by default.
- **Floating theme toggle** (bottom-right, 56 × 56 px, FAB-style): cycles light → system → dark. Sun / system / moon glyph.
- **Command palette** (⌘K / Ctrl+K) overlay: 640 × 480 px modal, centered, frosted backdrop.
- **Update banner** (top, full-width): appears when `electron-updater` reports `available` or `downloaded`. Buttons: Download / Restart & install / Later. Background `--accent-soft`, text `--accent-ink`.
- **Toast region** (bottom-right): max 4 toasts stacked, auto-dismiss 5 s.

### 0.7 Freshness chip — used on every surface

Three states. The chip is `Body S` text in a 4-px-radius rounded pill with 6 px horizontal padding.

| State | Background | Text | Used when |
|---|---|---|---|
| `fresh` | `--green-soft` | `--green` | source `asOf` is within freshness window |
| `watch` | `--yellow-soft` | `--yellow` | source is approaching staleness threshold |
| `stale` | `--red-soft` | `--red` | source is past threshold |

Examples of freshness windows live in [electron/liveSources.js](../electron/liveSources.js); designer can use placeholder timestamps.

---

## 1. Surface 1 — Command

> "What should I do today, and why?"

Source: [src/App.tsx](../src/App.tsx) `renderCommand` + [docs/USAGE.md](USAGE.md) §2.

### 1.1 Layout (1440 × 900 baseline)

```
┌───────────────────────────────────────────────────────────────┐
│ Top bar (64 px)                                               │
├───────────────────────────────────────────────────────────────┤
│ Market strip (3 cards, equal width, 120 px tall, 16 px gap)   │  ← row 1, 24 px top padding
├──────────────────────────────────────────┬────────────────────┤
│                                          │                    │
│  Anchor vs hedge tape chart              │  Decision memo     │  ← row 2, 540 px tall
│  (centre, ~62% width)                    │  (right rail,      │
│                                          │   ~36% width)      │
│                                          │                    │
├──────────────────────────────────────────┴────────────────────┤
│ Top drivers (5 bars)        │ Source freshness │ Score donut  │  ← row 3, 200 px
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Component anatomy

- **Market strip card** (3 instances)
  - Anchor price headline — `Display XL` (Fraunces 64 px)
  - Δ vs prior session — `Heading S` colored by `--green` / `--red`
  - Sub-label: "EU ETS — EEX auction" / "K-ETS — KRX KAU" / "China ETS — SHEEX overview"
  - Active chip: 1 px solid `--accent` border, `--accent-soft` background tint
  - Inactive chip: 1 px solid `--line` border, `--panel` background
  - Right edge of active card carries a 4 px `--accent` accent stripe
- **Anchor vs hedge tape chart**
  - Solid orange line: official anchor (use `#FF6F3C` or rebrand to `--accent` if you want monochrome)
  - Dashed green line: listed proxy (use `--green`)
  - X-axis: last 60 trading days. Y-axis: normalized to 100 at oldest visible point.
  - Hover crosshair shows date + both values + spread
  - Annotation pins for catalyst events (max 5 visible at any time)
- **Decision memo**
  - Top: posture badge ("Buy" / "Hold" / "Reduce") in pill, 32 px radius, posture-specific color
  - Body: 1 sentence summary, `Body L`
  - Two columns: "Support" (green check icons) and "Risk" (yellow warn icons), each 3 bullets
  - Footer: "Updated 13:42 KST" + freshness chip
- **Top drivers**
  - 5 horizontal bars, signed
  - Long bar = strong signal. `--green` for positive, `--red` for negative
  - Driver name (`Body S`) on the left, signed value on the right
- **Source freshness band**
  - Three chips for EU / KR / CN, each labelled with last-update timestamp + status
- **Score donut**
  - Outer ring: confidence percentile (filled in `--accent`)
  - Number inside: 2-digit confidence percentile (`Display L`, Fraunces)
  - Caption below: "confidence percentile, not return target"

### 1.3 States to mock

- Default (KR active, all sources fresh)
- All sources stale (red chips, banner suggesting refresh)
- Loading skeleton (chart shimmers, decision memo greyed)
- Cross-market alert (hover ML callout from a fired catalyst)
- Korean locale (every label in 한국어 — hand off to a Korean speaker for copy review)

---

## 2. Surface 2 — Drivers

> "Which signal is firing right now?"

Source: Drivers branch in [src/App.tsx](../src/App.tsx) + [docs/USAGE.md](USAGE.md) §2.5.

### 2.1 Layout

This is the longest surface — vertical scroll. Aim for 1440 × 2400 px artboard.

Sections (top to bottom):

1. **Decision-support boundary notice** (full-width banner, 80 px, `--yellow-soft` background)
2. **Active patterns now** (cards row, 1-3 cards depending on triggers)
3. **Catalyst combinations** (21 scenario cards, 3-column grid, 280 × 320 each)
4. **Materials & abatement atlas** (long-horizon cards, 2-column grid)
5. **Institutional feeds status** (Refinitiv / Bloomberg / ICE / EEX status row — `not-configured` chips)
6. **Calibration provenance table** (per-scenario multiplier + observations + hit rate + status)
7. **Event timeline** (25 historical events, horizontal scroll)
8. **Public-data feeds status** (FRED / ECB SDW / ICAP / World Bank chips)
9. **Driver families heatmap** (6 families × 3 markets matrix)

### 2.2 Critical components

- **Active pattern card** (~280 × 200 px): scenario title (`Heading S`), `interactionEffect` chip (`amplify` / `offset` / `regime-shift`), 1-line playbook, "View detail" link
- **Catalyst combination card**: title, 2-3 driver chips, expected direction arrow, `interactionEffect` chip, primary citation link
- **Calibration row**: scenario name | multiplier numeric | observations | hit rate | status chip
  - Status chips: `heuristic` (yellow), `backtest` (blue), `calibrated` (green) — see [docs/COMPLIANCE.md](COMPLIANCE.md) §6 for the 3-state taxonomy
- **Driver families heatmap cell**: cell color encodes signed contribution; cell label encodes magnitude

### 2.3 States to mock

- Default (no active patterns; calibration table shows mostly `heuristic`)
- One active pattern firing (cold-snap stack)
- Three active patterns firing (most attention-grabbing case)
- Korean locale

---

## 3. Surface 3 — Desk

> "I want to focus deeply on one market."

Source: [src/App.tsx](../src/App.tsx) `renderDesk` + [docs/USAGE.md](USAGE.md) §2.5.

### 3.1 Layout

```
┌───────────────────────────────────────────────────────────────┐
│ Top bar (64 px)                                               │
├──────────────────────────────────┬────────────────────────────┤
│                                  │ Cross-market table (3×N)   │
│  Focused market chart            │ (range, vol, correlation)  │
│  (~62% width)                    │                            │
│                                  ├────────────────────────────┤
│                                  │ Hedge tape comparison      │
│                                  │ (KRBN / EUA / CO2.L tile)  │
│                                  ├────────────────────────────┤
│                                  │ Scenario weight sliders    │
│                                  │ (~5 sliders, signed)       │
└──────────────────────────────────┴────────────────────────────┘
```

### 3.2 Component anatomy

- **Market selector pills** (above the chart): K-ETS / EU ETS / China ETS
- **Focused chart**: same renderer as Command but full-width with controls (range 5d/1m/3m/1y, log toggle, density)
- **Range / correlation table**: 3 rows × N cols, mono numerics, sortable headers
- **Hedge tape tile**: small chart + last close + spread vs anchor
- **Scenario sliders**: name (`Body M`), signed slider (-100 to +100), live posture preview chip on the right edge

### 3.3 States to mock

- Default with K-ETS active
- Slider moved to extreme — posture preview flips
- Korean locale

---

## 4. Surface 4 — Sources

> "Where did this datum come from, and how fresh is it?"

Source: [src/App.tsx](../src/App.tsx) `renderSources` + [docs/USAGE.md](USAGE.md) §2.5.

### 4.1 Layout

3-column grid of source cards, with a top filter bar.

### 4.2 Source card anatomy

- Top: source name + jurisdiction flag + access-method chip (`official web flow` / `official file` / `public API` / `public chart feed`)
- Middle: last-updated timestamp + freshness chip
- Body: 1-line description of what this source feeds (drivers / anchor / proxy / event log)
- Footer: "Open original" link (opens the upstream URL via `shell.openExternal`) + "Audit" link (opens the project-links registry entry)

Compliance/governance chips that may appear:
- `not-configured` — institutional adapters with missing credentials (from [docs/COMPLIANCE.md](COMPLIANCE.md) §5)
- `bulletin-first` — China ETS pre-tape mode

### 4.3 States to mock

- All sources fresh
- China ETS bulletin-first mode (anchor card carries `bulletin-first` chip)
- One institutional adapter `not-configured` (Refinitiv as example) — should look obviously different from "data is stale", since the meaning is "not wired", not "stale"
- Korean locale

---

## 5. What this brief deliberately does NOT pin

- **Exact pixel positions** — leave room for the designer to refine. The proportions and component order are the contract.
- **Iconography** — pick a coherent set (Phosphor, Lucide, or custom). Keep it line-style, 24 px default.
- **Animation** — the existing motion tokens (`140 ms / 220 ms / 320 ms`, `cubic-bezier(0.22, 1, 0.36, 1)`) are the speed contract. Specific motion patterns (staggered reveal, page transitions) are a designer call.
- **Data visualisation library style** — Lightweight Charts is the production renderer; Figma can use any chart-mockup approach as long as the visual outcome matches the line/dash/color contract above.

## 6. Hand-off checklist

When you are done:

- [ ] Light + dark variants for all four surfaces.
- [ ] Korean copy variants for at least Command and Drivers.
- [ ] All shared components (top bar, freshness chip, posture badge, decision memo, scenario card, calibration row, source card) extracted as Figma components with auto-layout + variants.
- [ ] Color tokens published as Figma variables matching the `--name` strings used here.
- [ ] Typography styles matching the §0.4 ramp.
- [ ] Designer commits the Figma share link to [docs/project-links.md](project-links.md) under "Public Channels" with `Source Type = Figma file`.
- [ ] [docs/autonomy-state.md](autonomy-state.md) "Active Loop Queue" — tick the Figma item.
