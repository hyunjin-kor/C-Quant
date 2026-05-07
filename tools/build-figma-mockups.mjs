/**
 * Generate 4 SVG mockups for the C-Quant primary surfaces, sized so that
 * Figma can drag-drop import them and decompose each visual into vector
 * nodes. All values are pulled from src/styles.css and docs/figma-spec.md
 * so the mockups stay in lock-step with the design contract.
 *
 * Run: node tools/build-figma-mockups.mjs
 *
 * Output:
 *   docs/figma-spec/mockups/command.svg
 *   docs/figma-spec/mockups/drivers.svg
 *   docs/figma-spec/mockups/desk.svg
 *   docs/figma-spec/mockups/sources.svg
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "docs", "figma-spec", "mockups");
mkdirSync(OUT_DIR, { recursive: true });

// ── Tokens (light theme, from src/styles.css) ──
const T = {
  bg:        "#ffffff",
  panel:     "#ffffff",
  panelMute: "#f9fafb",
  panelTint: "#f2f4f6",
  ink:       "#191f28",
  body:      "#4e5968",
  soft:      "#8b95a1",
  mute:      "#b0b8c1",
  line:      "#e5e8eb",
  lineStrong:"#d1d6db",
  accent:    "#0064ff",
  accentSoft:"#e8f2ff",
  accentInk: "#003e99",
  green:     "#22c55e",
  greenSoft: "#dcfce7",
  red:       "#f04452",
  redSoft:   "#fde7e9",
  yellow:    "#ff9f2d",
  yellowSoft:"#fff3e0",
  rail:      "#1b1f23",
};

const FONT_UI = "Inter, 'Pretendard Variable', system-ui, sans-serif";
const FONT_DISPLAY = "Fraunces, Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Consolas', monospace";

// ── Building blocks ──
function svgOpen(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="${FONT_UI}">
  <rect width="${w}" height="${h}" fill="${T.bg}"/>`;
}
const svgClose = "</svg>";

function topBar(w, activeSurface, activeMarket) {
  const surfaces = ["Command", "Drivers", "Desk", "Sources"];
  const markets = ["EU", "KR", "CN"];
  const tabs = surfaces
    .map((s, i) => {
      const x = 360 + i * 92;
      const isActive = s === activeSurface;
      const color = isActive ? T.ink : T.soft;
      const underline = isActive
        ? `<rect x="${x - 4}" y="48" width="${s.length * 9 + 12}" height="2" fill="${T.accent}"/>`
        : "";
      return `<text x="${x + 2}" y="38" font-size="14" font-weight="${isActive ? 600 : 500}" fill="${color}">${s}</text>${underline}`;
    })
    .join("");

  const chips = markets
    .map((m, i) => {
      const x = w - 220 + i * 64;
      const isActive = m === activeMarket;
      const fill = isActive ? T.accentSoft : T.bg;
      const stroke = isActive ? T.accent : T.line;
      const text = isActive ? T.accent : T.body;
      return `<rect x="${x}" y="20" width="52" height="28" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
        <text x="${x + 26}" y="38" text-anchor="middle" font-size="12" font-weight="600" fill="${text}">${m}</text>`;
    })
    .join("");

  return `
  <!-- top bar -->
  <rect x="0" y="0" width="${w}" height="64" fill="${T.bg}"/>
  <line x1="0" y1="64" x2="${w}" y2="64" stroke="${T.line}" stroke-width="1"/>
  <!-- app mark -->
  <rect x="24" y="20" width="28" height="28" rx="6" fill="${T.accent}"/>
  <text x="38" y="40" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff" font-family="${FONT_DISPLAY}">C</text>
  <text x="62" y="38" font-size="14" font-weight="700" fill="${T.ink}">C-Quant</text>
  ${tabs}
  ${chips}
  `;
}

function freshnessChip(x, y, label, state) {
  const styles = {
    fresh: { bg: T.greenSoft, fg: T.green },
    watch: { bg: T.yellowSoft, fg: T.yellow },
    stale: { bg: T.redSoft, fg: T.red },
  }[state];
  const w = label.length * 6.5 + 14;
  return `<rect x="${x}" y="${y}" width="${w}" height="20" rx="4" fill="${styles.bg}"/>
    <text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" font-size="11" font-weight="600" fill="${styles.fg}">${label}</text>`;
}

function postureBadge(x, y, posture) {
  const styles = {
    Buy:    { bg: T.greenSoft, fg: T.green },
    Hold:   { bg: T.accentSoft, fg: T.accent },
    Reduce: { bg: T.redSoft, fg: T.red },
  }[posture];
  return `<rect x="${x}" y="${y}" width="78" height="32" rx="16" fill="${styles.bg}"/>
    <text x="${x + 39}" y="${y + 21}" text-anchor="middle" font-size="14" font-weight="700" fill="${styles.fg}">${posture}</text>`;
}

function footer(w, h) {
  return `<line x1="0" y1="${h - 36}" x2="${w}" y2="${h - 36}" stroke="${T.line}"/>
    <text x="24" y="${h - 14}" font-size="11" fill="${T.mute}">C-Quant · v1.3 · light theme · 1440×${h} baseline · figma-spec mockup</text>
    <text x="${w - 24}" y="${h - 14}" text-anchor="end" font-size="11" fill="${T.mute}" font-family="${FONT_MONO}">SVG mockup — Figma import OK</text>`;
}

// ── 1. Command ──
function command() {
  const W = 1440, H = 900;
  let s = svgOpen(W, H);
  s += topBar(W, "Command", "KR");

  // Market strip — 3 cards
  const markets = [
    { id: "EU", name: "EU ETS — EEX auction", price: "75.34", unit: "€ / t", chg: "+1.21", chgPct: "+1.63%", chgUp: true, fresh: "fresh" },
    { id: "KR", name: "K-ETS — KRX KAU",      price: "14,250", unit: "₩ / t", chg: "−180", chgPct: "−1.25%", chgUp: false, fresh: "watch", active: true },
    { id: "CN", name: "China ETS — SHEEX",    price: "89.50", unit: "¥ / t", chg: "+0.30", chgPct: "+0.34%", chgUp: true, fresh: "fresh" },
  ];
  const cardW = (W - 24 * 2 - 16 * 2) / 3;
  markets.forEach((m, i) => {
    const x = 24 + i * (cardW + 16);
    const y = 88;
    const stroke = m.active ? T.accent : T.line;
    s += `<rect x="${x}" y="${y}" width="${cardW}" height="120" rx="14" fill="${m.active ? T.accentSoft : T.panel}" stroke="${stroke}" stroke-width="${m.active ? 1.5 : 1}"/>`;
    if (m.active) s += `<rect x="${x + cardW - 4}" y="${y}" width="4" height="120" fill="${T.accent}"/>`;
    s += `<text x="${x + 24}" y="${y + 28}" font-size="12" font-weight="600" fill="${T.soft}">${m.name}</text>`;
    s += `<text x="${x + 24}" y="${y + 78}" font-size="48" font-weight="600" fill="${T.ink}" font-family="${FONT_DISPLAY}">${m.price}</text>`;
    s += `<text x="${x + 24 + (m.price.length * 24 + 8)}" y="${y + 78}" font-size="14" fill="${T.soft}">${m.unit}</text>`;
    const chgColor = m.chgUp ? T.green : T.red;
    s += `<text x="${x + 24}" y="${y + 102}" font-size="14" font-weight="600" fill="${chgColor}">${m.chg} (${m.chgPct})</text>`;
    s += freshnessChip(x + cardW - 70, y + 12, m.fresh, m.fresh);
  });

  // Anchor vs hedge tape chart (big centre block)
  const chartX = 24, chartY = 232, chartW = 880, chartH = 480;
  s += `<rect x="${chartX}" y="${chartY}" width="${chartW}" height="${chartH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${chartX + 24}" y="${chartY + 28}" font-size="13" font-weight="600" fill="${T.soft}">ANCHOR vs HEDGE TAPE — K-ETS</text>`;
  s += `<text x="${chartX + 24}" y="${chartY + 50}" font-size="20" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">KRX KAU vs KRBN ETF</text>`;

  // Chart axes (light)
  const cx0 = chartX + 60, cy0 = chartY + 100, cx1 = chartX + chartW - 24, cy1 = chartY + chartH - 60;
  for (let i = 0; i <= 4; i++) {
    const y = cy0 + (i * (cy1 - cy0)) / 4;
    s += `<line x1="${cx0}" y1="${y}" x2="${cx1}" y2="${y}" stroke="${T.line}" stroke-width="0.5"/>`;
    s += `<text x="${cx0 - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="${T.mute}" font-family="${FONT_MONO}">${100 + (4 - i) * 5}</text>`;
  }

  // Solid orange line (anchor) — fake but plausible series
  const anchorPts = Array.from({ length: 30 }, (_, i) => {
    const x = cx0 + (i * (cx1 - cx0)) / 29;
    const t = i / 29;
    const y = cy1 - 80 - Math.sin(t * 4) * 35 - t * 30;
    return [x, y];
  });
  const anchorPath = anchorPts.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ");
  s += `<path d="${anchorPath}" fill="none" stroke="${T.accent}" stroke-width="2.5" stroke-linecap="round"/>`;

  // Dashed green line (proxy)
  const proxyPts = anchorPts.map((p, i) => [p[0], p[1] + 20 + Math.sin(i * 0.6) * 10]);
  const proxyPath = proxyPts.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ");
  s += `<path d="${proxyPath}" fill="none" stroke="${T.green}" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round"/>`;

  // Legend
  s += `<line x1="${chartX + 24}" y1="${chartY + 80}" x2="${chartX + 60}" y2="${chartY + 80}" stroke="${T.accent}" stroke-width="2.5"/>
    <text x="${chartX + 68}" y="${chartY + 84}" font-size="12" fill="${T.body}">Anchor (KRX)</text>
    <line x1="${chartX + 200}" y1="${chartY + 80}" x2="${chartX + 236}" y2="${chartY + 80}" stroke="${T.green}" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="${chartX + 244}" y="${chartY + 84}" font-size="12" fill="${T.body}">Proxy (KRBN)</text>`;

  // Decision memo — right rail
  const memoX = 920, memoY = 232, memoW = 496, memoH = 480;
  s += `<rect x="${memoX}" y="${memoY}" width="${memoW}" height="${memoH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${memoX + 24}" y="${memoY + 32}" font-size="13" font-weight="600" fill="${T.soft}">DECISION MEMO</text>`;
  s += postureBadge(memoX + memoW - 24 - 78, memoY + 16, "Hold");
  s += `<text x="${memoX + 24}" y="${memoY + 80}" font-size="22" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">Hold K-ETS into Q1 surrender</text>`;
  s += `<text x="${memoX + 24}" y="${memoY + 108}" font-size="13" fill="${T.body}">컴플라이언스 윈도우 진입 + 재정 관리 강화 + KRBN 괴리 정상화</text>`;

  // Support / Risk columns
  const supportItems = ["Q1 surrender 윈도우 4주 이내", "재정 관리 4-st step-up", "KOC/KAU spread 정상 범위"];
  const riskItems = ["KRBN 1주 +3.2% 추월", "USD/KRW 1,390 돌파 압력", "전력 수급 비상 경고"];
  s += `<text x="${memoX + 24}" y="${memoY + 158}" font-size="11" font-weight="700" fill="${T.green}" letter-spacing="0.04em">SUPPORT</text>`;
  supportItems.forEach((it, i) => {
    s += `<circle cx="${memoX + 32}" cy="${memoY + 188 + i * 30}" r="4" fill="${T.green}"/>
      <text x="${memoX + 44}" y="${memoY + 192 + i * 30}" font-size="13" fill="${T.ink}">${it}</text>`;
  });
  s += `<text x="${memoX + 24}" y="${memoY + 308}" font-size="11" font-weight="700" fill="${T.yellow}" letter-spacing="0.04em">RISK</text>`;
  riskItems.forEach((it, i) => {
    s += `<rect x="${memoX + 28}" y="${memoY + 332 + i * 30}" width="8" height="8" fill="${T.yellow}"/>
      <text x="${memoX + 44}" y="${memoY + 340 + i * 30}" font-size="13" fill="${T.ink}">${it}</text>`;
  });

  // Confidence + freshness footer in memo
  s += `<line x1="${memoX + 24}" y1="${memoY + 432}" x2="${memoX + memoW - 24}" y2="${memoY + 432}" stroke="${T.line}"/>`;
  s += `<text x="${memoX + 24}" y="${memoY + 458}" font-size="11" fill="${T.soft}">Confidence 72% · Updated 13:42 KST</text>`;
  s += freshnessChip(memoX + memoW - 24 - 56, memoY + 444, "watch", "watch");

  // Top drivers (bottom-left)
  const tdX = 24, tdY = 728, tdW = 580, tdH = 132;
  s += `<rect x="${tdX}" y="${tdY}" width="${tdW}" height="${tdH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${tdX + 24}" y="${tdY + 28}" font-size="13" font-weight="600" fill="${T.soft}">TOP DRIVERS</text>`;
  const drivers = [
    { name: "kr_compliance_window", display: "+0.42", num: 0.42 },
    { name: "kr_penalty_multiplier", display: "+0.31", num: 0.31 },
    { name: "usdkrw", display: "−0.18", num: -0.18 },
    { name: "kr_otc_spread", display: "−0.14", num: -0.14 },
    { name: "kospi", display: "+0.09", num: 0.09 },
  ];
  drivers.forEach((d, i) => {
    const x = tdX + 24 + i * 110;
    const barW = Math.abs(d.num) * 100;
    const barColor = d.num >= 0 ? T.green : T.red;
    s += `<text x="${x}" y="${tdY + 56}" font-size="11" fill="${T.body}">${d.name}</text>`;
    s += `<rect x="${x}" y="${tdY + 68}" width="${barW}" height="8" rx="4" fill="${barColor}"/>`;
    s += `<text x="${x}" y="${tdY + 100}" font-size="14" font-weight="600" fill="${barColor}" font-family="${FONT_MONO}">${d.display}</text>`;
  });

  // Source freshness (bottom-mid)
  const sfX = 620, sfY = 728, sfW = 380, sfH = 132;
  s += `<rect x="${sfX}" y="${sfY}" width="${sfW}" height="${sfH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${sfX + 24}" y="${sfY + 28}" font-size="13" font-weight="600" fill="${T.soft}">SOURCE FRESHNESS</text>`;
  const freshes = [
    { lbl: "EU · 14m", st: "fresh" },
    { lbl: "KR · 2h", st: "watch" },
    { lbl: "CN · 8h", st: "stale" },
  ];
  freshes.forEach((f, i) => {
    s += freshnessChip(sfX + 24 + i * 120, sfY + 64, f.lbl, f.st);
  });
  s += `<text x="${sfX + 24}" y="${sfY + 112}" font-size="11" fill="${T.mute}">Last poll: 13:42 KST · cache 60s</text>`;

  // Score donut (bottom-right)
  const sdX = 1016, sdY = 728, sdW = 400, sdH = 132;
  s += `<rect x="${sdX}" y="${sdY}" width="${sdW}" height="${sdH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${sdX + 24}" y="${sdY + 28}" font-size="13" font-weight="600" fill="${T.soft}">SCORE BUILD</text>`;
  // Donut at right side
  const dcx = sdX + sdW - 80, dcy = sdY + 76, dr = 38;
  const conf = 72;
  const arcLen = (conf / 100) * 2 * Math.PI * dr;
  s += `<circle cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="${T.line}" stroke-width="10"/>
    <circle cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="${T.accent}" stroke-width="10"
      stroke-dasharray="${arcLen} ${2 * Math.PI * dr}" transform="rotate(-90 ${dcx} ${dcy})" stroke-linecap="round"/>
    <text x="${dcx}" y="${dcy + 7}" text-anchor="middle" font-size="22" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">${conf}</text>`;
  s += `<text x="${sdX + 24}" y="${sdY + 64}" font-size="13" fill="${T.body}">Confidence percentile</text>
    <text x="${sdX + 24}" y="${sdY + 86}" font-size="11" fill="${T.mute}">not a return target</text>`;

  s += footer(W, H);
  return s + svgClose;
}

// ── 2. Drivers ──
function drivers() {
  const W = 1440, H = 2400;
  let s = svgOpen(W, H);
  s += topBar(W, "Drivers", "KR");

  // Decision-support boundary banner
  s += `<rect x="24" y="88" width="${W - 48}" height="64" rx="14" fill="${T.yellowSoft}" stroke="${T.yellow}" stroke-width="1"/>
    <circle cx="68" cy="120" r="14" fill="${T.yellow}"/>
    <text x="68" y="125" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">!</text>
    <text x="100" y="118" font-size="14" font-weight="600" fill="${T.ink}">Decision-support boundary</text>
    <text x="100" y="138" font-size="12" fill="${T.body}">아래는 의사결정 보조 신호입니다. calibrated price target이 아니며 직접 거래 지시도 아닙니다.</text>`;

  // Active patterns now
  s += `<text x="24" y="200" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">ACTIVE PATTERNS NOW</text>`;
  const ap = [
    { title: "K-ETS surrender + KRW weakness", effect: "amplify", body: "Q1 surrender 윈도우 + USD/KRW > 1,400 + 동절기 LNG burn → 수입연료비가 컴플라이언스 압력을 amplify" },
    { title: "KRBN tracking error spike", effect: "regime-shift", body: "KRBN 5d |%| ≥ 5% + 공식 anchor freshness > 24h → 정보 누출 가능 신호" },
  ];
  const apX0 = 24, apY = 220, apW = (W - 48 - 16) / 2, apH = 160;
  ap.forEach((p, i) => {
    const x = apX0 + i * (apW + 16);
    s += `<rect x="${x}" y="${apY}" width="${apW}" height="${apH}" rx="14" fill="${T.accentSoft}" stroke="${T.accent}" stroke-width="1.5"/>
      <text x="${x + 24}" y="${apY + 32}" font-size="11" font-weight="700" fill="${T.accent}" letter-spacing="0.06em">ACTIVE · ${p.effect.toUpperCase()}</text>
      <text x="${x + 24}" y="${apY + 64}" font-size="20" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">${p.title}</text>
      <text x="${x + 24}" y="${apY + 96}" font-size="13" fill="${T.body}">${p.body}</text>`;
    // Mini sparkline
    const spX0 = x + 24, spY0 = apY + 116;
    const sp = Array.from({ length: 14 }, (_, k) => {
      const sx = spX0 + k * 16;
      const sy = spY0 + 16 - Math.sin(k * 0.6 + i) * 10 - k * 0.4;
      return [sx, sy];
    });
    s += `<path d="${sp.map((p, k) => (k === 0 ? "M" : "L") + p.join(" ")).join(" ")}" fill="none" stroke="${T.accent}" stroke-width="1.5"/>`;
  });

  // Catalyst combinations grid
  s += `<text x="24" y="436" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">CATALYST COMBINATIONS · 21</text>`;
  const ccGridX = 24, ccGridY = 456;
  const ccColW = (W - 48 - 32) / 3;
  const ccRowH = 200;
  const cc = [
    { title: "EU cold-snap stack", effect: "amplify", drivers: ["temp anomaly", "TTF gas", "low wind"], status: "heuristic" },
    { title: "EU MSR + Fit-for-55", effect: "regime-shift", drivers: ["MSR notice", "FF55 reaffirm"], status: "heuristic" },
    { title: "K-ETS compliance + KRW", effect: "amplify", drivers: ["Q1 surrender", "USD/KRW > 1,400", "winter LNG"], status: "heuristic" },
    { title: "K-ETS Phase 4 auction", effect: "regime-shift", drivers: ["2026 auction 15%", "fin-cap relax"], status: "heuristic" },
    { title: "China Q4 + CCER discount", effect: "amplify", drivers: ["Q4 79% conc.", "CCER spread > 15%"], status: "heuristic" },
    { title: "China pilot → national", effect: "amplify", drivers: ["BJ/CQ pilot 5d", "Q4 window"], status: "heuristic" },
  ];
  cc.forEach((c, i) => {
    const r = Math.floor(i / 3), col = i % 3;
    const x = ccGridX + col * (ccColW + 16);
    const y = ccGridY + r * (ccRowH + 16);
    s += `<rect x="${x}" y="${y}" width="${ccColW}" height="${ccRowH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
    const effColor = c.effect === "regime-shift" ? T.accent : T.green;
    const effSoft = c.effect === "regime-shift" ? T.accentSoft : T.greenSoft;
    s += `<rect x="${x + 16}" y="${y + 16}" width="${c.effect.length * 7 + 16}" height="22" rx="11" fill="${effSoft}"/>
      <text x="${x + 24}" y="${y + 32}" font-size="11" font-weight="700" fill="${effColor}">${c.effect}</text>`;
    s += `<text x="${x + 16}" y="${y + 70}" font-size="17" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">${c.title}</text>`;
    c.drivers.forEach((d, di) => {
      const dx = x + 16 + di * 86;
      const dy = y + 96;
      s += `<rect x="${dx}" y="${dy}" width="80" height="22" rx="11" fill="${T.panelTint}"/>
        <text x="${dx + 40}" y="${dy + 15}" text-anchor="middle" font-size="10" fill="${T.body}">${d}</text>`;
    });
    s += `<line x1="${x + 16}" y1="${y + 140}" x2="${x + ccColW - 16}" y2="${y + 140}" stroke="${T.line}"/>
      <text x="${x + 16}" y="${y + 162}" font-size="11" fill="${T.soft}">multiplier 1.25 · obs 0 · hit n/a</text>`;
    s += `<rect x="${x + ccColW - 16 - 64}" y="${y + 156}" width="60" height="20" rx="4" fill="${T.yellowSoft}"/>
      <text x="${x + ccColW - 16 - 34}" y="${y + 170}" text-anchor="middle" font-size="10" font-weight="700" fill="${T.yellow}">${c.status}</text>`;
  });

  // Calibration provenance summary block
  s += `<text x="24" y="${ccGridY + 2 * (ccRowH + 16) + 60}" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">CALIBRATION PROVENANCE</text>`;
  const cpY = ccGridY + 2 * (ccRowH + 16) + 80;
  s += `<rect x="24" y="${cpY}" width="${W - 48}" height="220" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  // Three columns: heuristic / backtest / calibrated
  const cpStates = [
    { tag: "heuristic", count: 21, color: T.yellow, soft: T.yellowSoft, body: "interactionEffect별 placeholder constants. Default state for v1.3." },
    { tag: "backtest", count: 0, color: T.accent, soft: T.accentSoft, body: "Walk-forward against 25-event log (≥2 events / scenario)." },
    { tag: "calibrated", count: 0, color: T.green, soft: T.greenSoft, body: "Backtested + model-owner reviewed (CHANGELOG signed)." },
  ];
  const cpColW = (W - 48 - 32) / 3;
  cpStates.forEach((st, i) => {
    const x = 24 + 16 + i * (cpColW + 16) - 4;
    s += `<rect x="${x}" y="${cpY + 24}" width="${cpColW}" height="172" rx="10" fill="${st.soft}"/>
      <text x="${x + 24}" y="${cpY + 56}" font-size="12" font-weight="700" fill="${st.color}" font-family="${FONT_MONO}" letter-spacing="0.05em">${st.tag.toUpperCase()}</text>
      <text x="${x + 24}" y="${cpY + 116}" font-size="48" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">${st.count}</text>
      <text x="${x + 24}" y="${cpY + 140}" font-size="11" fill="${T.body}">scenarios</text>
      <text x="${x + 24}" y="${cpY + 172}" font-size="11" fill="${T.body}">${st.body}</text>`;
  });

  // ... abbreviated bottom: institutional + public-data feed status row
  const ifY = cpY + 260;
  s += `<text x="24" y="${ifY}" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">INSTITUTIONAL FEEDS · 4 — credentials gated</text>`;
  ["Refinitiv", "Bloomberg", "ICE Consolidated", "EEX Data Services"].forEach((name, i) => {
    const x = 24 + i * 360;
    s += `<rect x="${x}" y="${ifY + 16}" width="340" height="64" rx="10" fill="${T.panel}" stroke="${T.line}"/>
      <text x="${x + 20}" y="${ifY + 40}" font-size="14" font-weight="700" fill="${T.ink}">${name}</text>
      <rect x="${x + 20}" y="${ifY + 50}" width="110" height="20" rx="10" fill="${T.panelTint}"/>
      <text x="${x + 75}" y="${ifY + 64}" text-anchor="middle" font-size="10" font-weight="700" fill="${T.soft}" font-family="${FONT_MONO}">not-configured</text>`;
  });

  // Public-data feeds row
  const pfY = ifY + 116;
  s += `<text x="24" y="${pfY}" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">PUBLIC-DATA FEEDS · 4 — license-free</text>`;
  ["FRED", "ECB SDW", "ICAP Allowance", "World Bank Carbon"].forEach((name, i) => {
    const x = 24 + i * 360;
    s += `<rect x="${x}" y="${pfY + 16}" width="340" height="64" rx="10" fill="${T.panel}" stroke="${T.line}"/>
      <text x="${x + 20}" y="${pfY + 40}" font-size="14" font-weight="700" fill="${T.ink}">${name}</text>
      <rect x="${x + 20}" y="${pfY + 50}" width="78" height="20" rx="10" fill="${T.greenSoft}"/>
      <text x="${x + 59}" y="${pfY + 64}" text-anchor="middle" font-size="10" font-weight="700" fill="${T.green}">connected</text>`;
  });

  // Driver heatmap stub
  const hmY = pfY + 116;
  s += `<text x="24" y="${hmY}" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.06em">DRIVER FAMILIES · 6 × 3</text>`;
  const hmX = 24, hmStart = hmY + 28;
  const families = ["Policy & Supply", "Power & Industry", "Fuel switching", "Macro & Financial", "Weather", "Microstructure"];
  const mkts = ["EU", "KR", "CN"];
  // header row
  s += `<text x="${hmX + 220}" y="${hmStart + 20}" font-size="11" font-weight="700" fill="${T.soft}">${mkts[0]}</text>
    <text x="${hmX + 220 + 80}" y="${hmStart + 20}" font-size="11" font-weight="700" fill="${T.soft}">${mkts[1]}</text>
    <text x="${hmX + 220 + 160}" y="${hmStart + 20}" font-size="11" font-weight="700" fill="${T.soft}">${mkts[2]}</text>`;
  families.forEach((fam, i) => {
    const ry = hmStart + 36 + i * 44;
    s += `<text x="${hmX}" y="${ry + 22}" font-size="13" fill="${T.ink}">${fam}</text>`;
    mkts.forEach((_, j) => {
      const cx = hmX + 200 + j * 80;
      // Random plausible heatmap value
      const val = Math.sin(i * 1.7 + j * 1.3);
      const intensity = Math.abs(val);
      const fill = val > 0 ? T.green : T.red;
      const opacity = 0.15 + intensity * 0.4;
      s += `<rect x="${cx}" y="${ry}" width="64" height="36" rx="6" fill="${fill}" fill-opacity="${opacity.toFixed(2)}"/>
        <text x="${cx + 32}" y="${ry + 22}" text-anchor="middle" font-size="11" font-weight="700" fill="${T.ink}" font-family="${FONT_MONO}">${val > 0 ? "+" : ""}${val.toFixed(2)}</text>`;
    });
  });

  s += footer(W, H);
  return s + svgClose;
}

// ── 3. Desk ──
function desk() {
  const W = 1440, H = 900;
  let s = svgOpen(W, H);
  s += topBar(W, "Desk", "EU");

  // Market selector pills
  ["K-ETS", "EU ETS", "China ETS"].forEach((m, i) => {
    const x = 24 + i * 110;
    const isActive = m === "EU ETS";
    s += `<rect x="${x}" y="88" width="98" height="32" rx="16" fill="${isActive ? T.accent : T.bg}" stroke="${isActive ? T.accent : T.line}" stroke-width="1"/>
      <text x="${x + 49}" y="108" text-anchor="middle" font-size="13" font-weight="600" fill="${isActive ? "#ffffff" : T.body}">${m}</text>`;
  });

  // Big focused chart (left, ~62% width)
  const fcX = 24, fcY = 144, fcW = 880, fcH = 600;
  s += `<rect x="${fcX}" y="${fcY}" width="${fcW}" height="${fcH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="${fcX + 24}" y="${fcY + 32}" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.04em">EU ETS — EEX AUCTION ANCHOR</text>`;
  s += `<text x="${fcX + 24}" y="${fcY + 64}" font-size="44" font-weight="600" fill="${T.ink}" font-family="${FONT_DISPLAY}">€ 75.34</text>
    <text x="${fcX + 24 + 130}" y="${fcY + 64}" font-size="14" fill="${T.soft}">/ tCO₂</text>`;
  s += `<text x="${fcX + 24}" y="${fcY + 88}" font-size="14" font-weight="600" fill="${T.green}">+€ 1.21 (+1.63%) vs prior session</text>`;

  // Range chips
  ["5d", "1m", "3m", "1y"].forEach((r, i) => {
    const x = fcX + fcW - 24 - (4 - i) * 50;
    const isActive = r === "3m";
    s += `<rect x="${x}" y="${fcY + 24}" width="40" height="24" rx="12" fill="${isActive ? T.accent : T.bg}" stroke="${isActive ? T.accent : T.line}"/>
      <text x="${x + 20}" y="${fcY + 40}" text-anchor="middle" font-size="11" font-weight="600" fill="${isActive ? "#ffffff" : T.body}">${r}</text>`;
  });

  // The actual chart
  const ax0 = fcX + 60, ay0 = fcY + 140, ax1 = fcX + fcW - 24, ay1 = fcY + fcH - 80;
  for (let i = 0; i <= 5; i++) {
    const y = ay0 + (i * (ay1 - ay0)) / 5;
    s += `<line x1="${ax0}" y1="${y}" x2="${ax1}" y2="${y}" stroke="${T.line}" stroke-width="0.5"/>`;
    s += `<text x="${ax0 - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="${T.mute}" font-family="${FONT_MONO}">${(78 - i * 1.5).toFixed(1)}</text>`;
  }
  const px = Array.from({ length: 60 }, (_, i) => {
    const x = ax0 + (i * (ax1 - ax0)) / 59;
    const t = i / 59;
    const y = ay1 - 80 - Math.sin(t * 5) * 50 - t * 80 + Math.cos(i * 0.4) * 8;
    return [x, y];
  });
  s += `<path d="${px.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ")}" fill="none" stroke="${T.accent}" stroke-width="2"/>`;
  // Volume bars at bottom
  for (let i = 0; i < 60; i++) {
    const x = ax0 + (i * (ax1 - ax0)) / 59;
    const h = 5 + Math.abs(Math.sin(i * 0.3)) * 15;
    s += `<rect x="${x - 2}" y="${ay1 + 10 - h}" width="4" height="${h}" fill="${T.mute}" fill-opacity="0.5"/>`;
  }

  // Right rail: 3 stacked panels
  const rrX = 920, rrW = 496;
  // Panel 1: Cross-market table
  s += `<rect x="${rrX}" y="144" width="${rrW}" height="200" rx="14" fill="${T.panel}" stroke="${T.line}"/>
    <text x="${rrX + 24}" y="172" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.04em">CROSS-MARKET COMPARE</text>`;
  // simple table
  ["Range 30d", "1d vol", "Corr. EU"].forEach((label, ri) => {
    const ry = 196 + ri * 40;
    s += `<text x="${rrX + 24}" y="${ry}" font-size="12" fill="${T.body}">${label}</text>`;
    ["75–82", "1.4%", "1.00"].forEach((v, ci) => {
      const cx = rrX + 180 + ci * 100;
      s += `<text x="${cx}" y="${ry}" font-size="13" font-weight="600" fill="${T.ink}" font-family="${FONT_MONO}">${v}</text>`;
    });
  });
  // Header row at top
  ["EU", "KR", "CN"].forEach((m, i) => {
    s += `<text x="${rrX + 180 + i * 100}" y="184" font-size="11" font-weight="700" fill="${T.soft}">${m}</text>`;
  });

  // Panel 2: Hedge tape comparison
  s += `<rect x="${rrX}" y="360" width="${rrW}" height="200" rx="14" fill="${T.panel}" stroke="${T.line}"/>
    <text x="${rrX + 24}" y="388" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.04em">HEDGE TAPE — KRBN ETF</text>`;
  s += `<text x="${rrX + 24}" y="424" font-size="28" font-weight="600" fill="${T.ink}" font-family="${FONT_DISPLAY}">$ 32.18</text>
    <text x="${rrX + 24}" y="448" font-size="12" fill="${T.green}">+0.42 (+1.32%) intraday</text>
    <text x="${rrX + 24}" y="472" font-size="11" fill="${T.soft}">Spread vs anchor: −0.31 pp · within 1y P50</text>`;
  // mini chart
  const hpx = Array.from({ length: 24 }, (_, i) => [rrX + 240 + i * 10, 470 - Math.sin(i * 0.4) * 20 - i * 1.5]);
  s += `<path d="${hpx.map((p, i) => (i === 0 ? "M" : "L") + p.join(" ")).join(" ")}" fill="none" stroke="${T.green}" stroke-width="1.8"/>`;

  // Panel 3: Scenario sliders
  s += `<rect x="${rrX}" y="576" width="${rrW}" height="168" rx="14" fill="${T.panel}" stroke="${T.line}"/>
    <text x="${rrX + 24}" y="604" font-size="13" font-weight="700" fill="${T.soft}" letter-spacing="0.04em">SCENARIO WEIGHTS</text>`;
  const sl = [
    { name: "EU policy supply", value: 0.4 },
    { name: "Power & industry", value: 0.2 },
    { name: "Fuel switching", value: -0.3 },
    { name: "Macro shock", value: 0.1 },
  ];
  sl.forEach((slider, i) => {
    const sy = 624 + i * 28;
    s += `<text x="${rrX + 24}" y="${sy}" font-size="11" fill="${T.body}">${slider.name}</text>`;
    s += `<line x1="${rrX + 200}" y1="${sy - 4}" x2="${rrX + rrW - 64}" y2="${sy - 4}" stroke="${T.line}" stroke-width="3" stroke-linecap="round"/>`;
    const trackW = rrW - 64 - 200;
    const knobX = rrX + 200 + trackW / 2 + (slider.value * trackW) / 2;
    s += `<circle cx="${knobX}" cy="${sy - 4}" r="6" fill="${slider.value >= 0 ? T.accent : T.red}"/>`;
    s += `<text x="${rrX + rrW - 56}" y="${sy}" font-size="11" font-weight="600" fill="${slider.value >= 0 ? T.green : T.red}" font-family="${FONT_MONO}">${slider.value >= 0 ? "+" : ""}${(slider.value * 100).toFixed(0)}</text>`;
  });

  s += footer(W, H);
  return s + svgClose;
}

// ── 4. Sources ──
function sources() {
  const W = 1440, H = 900;
  let s = svgOpen(W, H);
  s += topBar(W, "Sources", "KR");

  // Filter / search bar
  s += `<rect x="24" y="88" width="${W - 48}" height="56" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;
  s += `<text x="44" y="122" font-size="13" fill="${T.soft}">🔍  Filter sources by jurisdiction · access method · status</text>`;
  // chips
  ["All", "EU", "KR", "CN", "official", "proxy", "public-data"].forEach((c, i) => {
    const x = 540 + i * 90;
    const isActive = c === "All";
    s += `<rect x="${x}" y="100" width="78" height="32" rx="16" fill="${isActive ? T.accent : T.bg}" stroke="${isActive ? T.accent : T.line}"/>
      <text x="${x + 39}" y="120" text-anchor="middle" font-size="12" font-weight="600" fill="${isActive ? "#ffffff" : T.body}">${c}</text>`;
  });

  // 3-column source-card grid
  const cards = [
    { name: "EEX EU ETS auctions", flag: "EU", method: "official web flow", status: "fresh", body: "EU 1차 auction anchor + workbook · 14m ago" },
    { name: "KRX ETS Information Platform", flag: "KR", method: "official web flow", status: "watch", body: "KAU close + KOC + 정책 게시 · 2h ago" },
    { name: "MEE 탄소시장 release feed", flag: "CN", method: "official web flow", status: "stale", body: "정책 bulletin · 8h ago — bulletin-first 모드" },
    { name: "KRX Open API (sample key)", flag: "KR", method: "public API", status: "fresh", body: "ets_bydd_trd 일별 거래 · 14m ago" },
    { name: "ICE EUA December", flag: "EU", method: "public chart feed", status: "fresh", body: "Yahoo chart endpoint · 2m ago" },
    { name: "KraneShares KRBN", flag: "GLOBAL", method: "public chart feed", status: "fresh", body: "ETF 추이 · 2m ago" },
    { name: "FRED economic data", flag: "US", method: "public API", status: "fresh", body: "St. Louis Fed series · API key gate · 1d ago" },
    { name: "Refinitiv Data Platform", flag: "EU/GLOBAL", method: "license-gated", status: "not-configured", body: "credentials missing — never fabricates prices" },
    { name: "ICAP Carbon Action", flag: "GLOBAL", method: "public web", status: "fresh", body: "관할 비교 dashboard · 1d ago" },
  ];

  const cgX = 24, cgY = 168, ccW = (W - 48 - 32) / 3, ccH = 200;
  cards.forEach((c, i) => {
    const r = Math.floor(i / 3), col = i % 3;
    const x = cgX + col * (ccW + 16);
    const y = cgY + r * (ccH + 16);
    s += `<rect x="${x}" y="${y}" width="${ccW}" height="${ccH}" rx="14" fill="${T.panel}" stroke="${T.line}"/>`;

    // Flag pill
    s += `<rect x="${x + 16}" y="${y + 16}" width="${c.flag.length * 8 + 16}" height="22" rx="11" fill="${T.ink}"/>
      <text x="${x + 24 + (c.flag.length * 4)}" y="${y + 32}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff" letter-spacing="0.04em">${c.flag}</text>`;

    // Status chip
    const statusStyles = {
      fresh: { bg: T.greenSoft, fg: T.green },
      watch: { bg: T.yellowSoft, fg: T.yellow },
      stale: { bg: T.redSoft, fg: T.red },
      "not-configured": { bg: T.panelTint, fg: T.soft },
    };
    const st = statusStyles[c.status];
    const stW = c.status.length * 6.5 + 16;
    s += `<rect x="${x + ccW - 16 - stW}" y="${y + 16}" width="${stW}" height="22" rx="11" fill="${st.bg}"/>
      <text x="${x + ccW - 16 - stW / 2}" y="${y + 32}" text-anchor="middle" font-size="10" font-weight="700" fill="${st.fg}">${c.status}</text>`;

    // Name
    s += `<text x="${x + 16}" y="${y + 70}" font-size="17" font-weight="700" fill="${T.ink}" font-family="${FONT_DISPLAY}">${c.name}</text>`;
    // Method
    s += `<text x="${x + 16}" y="${y + 92}" font-size="11" font-weight="600" fill="${T.accent}" letter-spacing="0.04em" font-family="${FONT_MONO}">${c.method.toUpperCase()}</text>`;
    // Body
    s += `<text x="${x + 16}" y="${y + 124}" font-size="12" fill="${T.body}">${c.body}</text>`;

    // Footer links
    s += `<line x1="${x + 16}" y1="${y + ccH - 50}" x2="${x + ccW - 16}" y2="${y + ccH - 50}" stroke="${T.line}"/>`;
    s += `<text x="${x + 16}" y="${y + ccH - 24}" font-size="11" font-weight="600" fill="${T.accent}">Open original →</text>`;
    s += `<text x="${x + ccW - 16}" y="${y + ccH - 24}" text-anchor="end" font-size="11" font-weight="600" fill="${T.soft}">Audit</text>`;
  });

  s += footer(W, H);
  return s + svgClose;
}

// ── Driver ──
const surfaces = [
  ["command", command],
  ["drivers", drivers],
  ["desk", desk],
  ["sources", sources],
];

for (const [name, fn] of surfaces) {
  const path = resolve(OUT_DIR, `${name}.svg`);
  writeFileSync(path, fn(), "utf-8");
  console.log(`wrote ${path}`);
}
