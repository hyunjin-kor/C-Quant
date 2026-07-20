/**
 * Build C-Quant story deck (.pptx) for external presentation / Canva import.
 *
 * v2: adds real icons (react-icons rasterized via sharp), a real bar chart
 * on the calibration slide, and arrows on the architecture diagram.
 *
 * Output: docs/decks/c-quant-story.pptx
 *
 * Style intent:
 * - Light theme, generous whitespace, charcoal text on white.
 * - Single accent color (Toss-style blue #0064FF) used sparingly.
 * - Repeated motif: thin vertical accent bar at slide left edge.
 * - Bilingual (KO primary, EN headers + key terms).
 *
 * Run: node tools/build-story-deck.mjs
 */

import pptxgen from "pptxgenjs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "docs", "decks", "c-quant-story.pptx");

// ── Palette ───────────────────────────────────────────────────────────
const C = {
  ink: "191F28",
  body: "4E5968",
  soft: "8B95A1",
  mute: "B0B8C1",
  line: "E5E8EB",
  bg: "FFFFFF",
  panel: "F9FAFB",
  accent: "0064FF",
  accentInk: "003E99",
  accentSoft: "E8F2FF",
  green: "22C55E",
  greenSoft: "DCFCE7",
  red: "F04452",
  redSoft: "FDE7E9",
  yellow: "FF9F2D",
  yellowSoft: "FFF3E0",
  rail: "1B1F23"
};

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";
const FONT_MONO = "Consolas";

// ── Icon helper ───────────────────────────────────────────────────────
async function iconPng(IconComponent, color = "#191F28", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Pre-render every icon up front so slide builders can reuse them.
const icons = {
  // Pain points
  scattered: await iconPng(Fa.FaServer, "#" + C.accent, 256),
  freshness: await iconPng(Fa.FaSyncAlt, "#" + C.accent, 256),
  policy: await iconPng(Fa.FaSitemap, "#" + C.accent, 256),
  // Signal stack layers
  anchor: await iconPng(Fa.FaAnchor, "#" + C.accent, 256),
  matrix: await iconPng(Fa.FaThLarge, "#" + C.accent, 256),
  catalyst: await iconPng(Fa.FaBolt, "#" + C.accent, 256),
  active: await iconPng(Fa.FaWaveSquare, "#" + C.accent, 256),
  calib: await iconPng(Fa.FaBalanceScale, "#" + C.accent, 256),
  proxy: await iconPng(Fa.FaExchangeAlt, "#" + C.accent, 256),
  atlas: await iconPng(Fa.FaLeaf, "#" + C.accent, 256),
  feeds: await iconPng(Fa.FaWifi, "#" + C.accent, 256),
  // Calibration states
  heuristic: await iconPng(Fa.FaSeedling, "#" + C.yellow, 256),
  backtest: await iconPng(Fa.FaChartLine, "#" + C.accent, 256),
  calibrated: await iconPng(Fa.FaCertificate, "#" + C.green, 256),
  // Decision boundary
  doYes: await iconPng(Fa.FaCheckCircle, "#" + C.accent, 256),
  doNo: await iconPng(Fa.FaTimesCircle, "#" + C.red, 256),
  // Roadmap
  spread: await iconPng(Fa.FaChartBar, "#" + C.accent, 256),
  errBand: await iconPng(Fa.FaProjectDiagram, "#" + C.accent, 256),
  portfolio: await iconPng(Fa.FaLayerGroup, "#" + C.accent, 256),
  exportIcn: await iconPng(Fa.FaShareSquare, "#" + C.accent, 256),
  // Architecture
  serverIcn: await iconPng(Fa.FaServer, "#" + C.accent, 256),
  bridgeIcn: await iconPng(Fa.FaPlug, "#" + C.accent, 256),
  rendererIcn: await iconPng(Fa.FaDesktop, "#" + C.accent, 256),
  // Decision question
  questionIcn: await iconPng(Fa.FaQuestionCircle, "#" + C.accent, 256)
};

// ── Presentation setup ────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
pres.author = "C-Quant project";
pres.title = "C-Quant — 탄소배출권 의사결정 터미널";

const W = 13.3;
const H = 7.5;
const TOTAL = 12;

// ── Slide chrome ──────────────────────────────────────────────────────
function addAccentBar(slide, color = C.accent) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.14,
    h: H,
    fill: { color },
    line: { color, width: 0 }
  });
}

function addFooter(slide, pageNum) {
  slide.addText(
    [
      { text: "C-Quant · ", options: { color: C.soft, fontSize: 10, fontFace: FONT_BODY } },
      {
        text: "Carbon Decision Terminal",
        options: { color: C.soft, fontSize: 10, italic: true, fontFace: FONT_BODY }
      }
    ],
    { x: 0.5, y: H - 0.45, w: 6, h: 0.3, margin: 0, valign: "middle" }
  );
  slide.addText(`${pageNum} / ${TOTAL}`, {
    x: W - 1.2,
    y: H - 0.45,
    w: 0.7,
    h: 0.3,
    color: C.mute,
    fontSize: 10,
    align: "right",
    valign: "middle",
    fontFace: FONT_MONO,
    margin: 0
  });
}

function addTitleHead(slide, ko, en) {
  slide.addText(ko, {
    x: 0.55,
    y: 0.5,
    w: W - 1.1,
    h: 0.7,
    fontSize: 30,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    align: "left",
    valign: "middle",
    margin: 0
  });
  if (en) {
    slide.addText(en, {
      x: 0.55,
      y: 1.18,
      w: W - 1.1,
      h: 0.36,
      fontSize: 14,
      fontFace: FONT_BODY,
      color: C.soft,
      italic: true,
      align: "left",
      valign: "middle",
      margin: 0
    });
  }
}

// ── Slide 1: Title (dark hero) ────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.rail };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.3,
    h: H,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 }
  });
  s.addText("CARBON DECISION TERMINAL · v1.3", {
    x: 0.9,
    y: 1.2,
    w: 9,
    h: 0.5,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: "5A99FF",
    bold: true,
    charSpacing: 6,
    margin: 0
  });
  s.addText("C-Quant", {
    x: 0.9,
    y: 1.8,
    w: 9,
    h: 1.6,
    fontSize: 96,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0
  });
  s.addText("탄소배출권 의사결정 터미널", {
    x: 0.9,
    y: 3.5,
    w: 11,
    h: 0.7,
    fontSize: 30,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    margin: 0
  });
  s.addText("EU ETS · K-ETS · China ETS  —  하나의 데스크에서", {
    x: 0.9,
    y: 4.3,
    w: 11,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: "CADCFC",
    italic: true,
    margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: 0.9,
    y: H - 1.3,
    w: 4,
    h: 0,
    line: { color: C.accent, width: 2 }
  });
  s.addText("Research · Monitoring · Forecasting · Briefing", {
    x: 0.9,
    y: H - 1.15,
    w: 11,
    h: 0.4,
    fontSize: 12,
    fontFace: FONT_BODY,
    color: "8B95A1",
    bold: true,
    charSpacing: 4,
    margin: 0
  });
}

// ── Slide 2: The decision ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "오늘의 결정", "The decision");

  // Big question icon centered-left
  s.addImage({ data: icons.questionIcn, x: 1.5, y: 2.5, w: 0.9, h: 0.9 });

  // Quote bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.7,
    y: 2.2,
    w: 0.06,
    h: 3.0,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 }
  });
  s.addText(
    [
      { text: "오늘", options: { color: C.accent, bold: true } },
      { text: " 사야 할까,\n", options: { color: C.ink } },
      { text: "보유", options: { color: C.accent, bold: true } },
      { text: " 해야 할까,\n", options: { color: C.ink } },
      { text: "줄여야", options: { color: C.accent, bold: true } },
      { text: " 할까?", options: { color: C.ink } }
    ],
    {
      x: 3.0,
      y: 2.2,
      w: 9.8,
      h: 3.0,
      fontSize: 50,
      fontFace: FONT_HEAD,
      bold: true,
      valign: "middle",
      paraSpaceAfter: 6,
      margin: 0
    }
  );

  s.addText(
    "C-Quant은 EU·KR·CN 세 시장의 공식 앵커 → 상장 프록시 → 드라이버 → 결정 4단계를 매일 같은 순서로 반복할 수 있게 합니다.",
    {
      x: 1.5,
      y: 5.6,
      w: 10.8,
      h: 0.9,
      fontSize: 16,
      fontFace: FONT_BODY,
      color: C.body,
      align: "left",
      valign: "top",
      margin: 0
    }
  );

  addFooter(s, 2);
}

// ── Slide 3: The problem ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "현장의 문제", "Three pain points");

  const cards = [
    {
      n: "01",
      icon: icons.scattered,
      title: "분산된 공식 소스",
      body: "EEX, KRX, MEE/SEEX — 세 시장은 각자 다른 페이지·다른 포맷·다른 freshness로 돌아갑니다. 매일 세 번 사이트를 돌아 손으로 정렬하는 식의 워크플로는 매번 비교 시점을 잃습니다."
    },
    {
      n: "02",
      icon: icons.freshness,
      title: "freshness 불일치",
      body: "공식 anchor 가격, 상장 proxy tape, 정책 bulletin이 각자 다른 시점에 갱신됩니다. 어떤 데이터가 fresh / watch / stale 인지를 한 화면에서 보지 못하면 의사결정 신뢰가 깨집니다."
    },
    {
      n: "03",
      icon: icons.policy,
      title: "정책-드라이버 단절",
      body: "MSR, Fit-for-55, K-ETS 4차 기본계획, 중국 섹터 확장 — 정책 이벤트가 가격에 어떻게 작용했는지 과거 사례 기반으로 연결되어야 하지만, 보통은 분리된 PDF·뉴스·연구노트에 흩어져 있습니다."
    }
  ];
  const colW = 3.85,
    colH = 4.0,
    gap = 0.3;
  const startX = (W - (colW * 3 + gap * 2)) / 2;
  const startY = 2.2;

  cards.forEach((card, i) => {
    const cx = startX + i * (colW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: startY,
      w: colW,
      h: colH,
      fill: { color: C.panel },
      line: { color: C.line, width: 0.75 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: startY,
      w: 0.08,
      h: colH,
      fill: { color: C.accent },
      line: { color: C.accent, width: 0 }
    });
    // Icon at top-right of card
    s.addImage({ data: card.icon, x: cx + colW - 0.85, y: startY + 0.3, w: 0.55, h: 0.55 });
    s.addText(card.n, {
      x: cx + 0.3,
      y: startY + 0.25,
      w: 1.5,
      h: 0.45,
      fontSize: 14,
      fontFace: FONT_MONO,
      color: C.accent,
      bold: true,
      charSpacing: 4,
      margin: 0
    });
    s.addText(card.title, {
      x: cx + 0.3,
      y: startY + 0.95,
      w: colW - 0.6,
      h: 0.7,
      fontSize: 22,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0
    });
    s.addText(card.body, {
      x: cx + 0.3,
      y: startY + 1.75,
      w: colW - 0.6,
      h: colH - 1.9,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.body,
      paraSpaceAfter: 4,
      margin: 0
    });
  });

  addFooter(s, 3);
}

// ── Slide 4: Product boundary ─────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "신뢰 경계 — 무엇을 하고, 무엇을 안 하는가", "The product boundary");

  const colW = 5.6,
    colH = 4.5;
  const gap = 0.5;
  const startX = (W - (colW * 2 + gap)) / 2;
  const startY = 2.0;

  // LEFT — Does
  s.addShape(pres.shapes.RECTANGLE, {
    x: startX,
    y: startY,
    w: colW,
    h: colH,
    fill: { color: C.accentSoft },
    line: { color: C.accent, width: 0 }
  });
  s.addImage({ data: icons.doYes, x: startX + colW - 0.95, y: startY + 0.35, w: 0.55, h: 0.55 });
  s.addText("DOES", {
    x: startX + 0.4,
    y: startY + 0.35,
    w: colW - 1.4,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: C.accentInk,
    bold: true,
    charSpacing: 6,
    margin: 0
  });
  s.addText("연구 · 모니터링 · 예측 · 브리핑", {
    x: startX + 0.4,
    y: startY + 0.85,
    w: colW - 0.8,
    h: 0.7,
    fontSize: 22,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0
  });
  s.addText(
    [
      {
        text: "공식 anchor 가격, freshness, 접근 방식을 한 화면에",
        options: { bullet: true, breakLine: true }
      },
      {
        text: "정책-가격 catalyst 21개를 시나리오로 정리",
        options: { bullet: true, breakLine: true }
      },
      { text: "리얼타임 active pattern 자동 감지", options: { bullet: true, breakLine: true } },
      {
        text: "buy / hold / reduce posture + 신뢰도 + 근거 제시",
        options: { bullet: true, breakLine: true }
      },
      { text: "외부 감사를 위한 calibration provenance 표기", options: { bullet: true } }
    ],
    {
      x: startX + 0.4,
      y: startY + 1.7,
      w: colW - 0.8,
      h: colH - 1.9,
      fontSize: 14,
      fontFace: FONT_BODY,
      color: C.ink,
      paraSpaceAfter: 8,
      margin: 0
    }
  );

  // RIGHT — Does NOT
  const rightX = startX + colW + gap;
  s.addShape(pres.shapes.RECTANGLE, {
    x: rightX,
    y: startY,
    w: colW,
    h: colH,
    fill: { color: "FDF1F2" },
    line: { color: C.red, width: 0 }
  });
  s.addImage({ data: icons.doNo, x: rightX + colW - 0.95, y: startY + 0.35, w: 0.55, h: 0.55 });
  s.addText("DOES NOT", {
    x: rightX + 0.4,
    y: startY + 0.35,
    w: colW - 1.4,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: C.red,
    bold: true,
    charSpacing: 6,
    margin: 0
  });
  s.addText("주문 · 보관 · 정산 · 브로커리지", {
    x: rightX + 0.4,
    y: startY + 0.85,
    w: colW - 0.8,
    h: 0.7,
    fontSize: 22,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0
  });
  s.addText(
    [
      {
        text: "주문 라우팅 / 거래 체결 — 라이선스 브로커 사용",
        options: { bullet: true, breakLine: true }
      },
      {
        text: "자산 보관 / 정산 — 등록기관 / 수탁자 사용",
        options: { bullet: true, breakLine: true }
      },
      { text: "1:1 개인 맞춤 매수/매도 지시", options: { bullet: true, breakLine: true } },
      { text: "공식 공시 문서를 대체하지 않음", options: { bullet: true, breakLine: true } },
      {
        text: "기관 가격을 fabricate 하지 않음 — not-configured 상태로 노출",
        options: { bullet: true }
      }
    ],
    {
      x: rightX + 0.4,
      y: startY + 1.7,
      w: colW - 0.8,
      h: colH - 1.9,
      fontSize: 14,
      fontFace: FONT_BODY,
      color: C.ink,
      paraSpaceAfter: 8,
      margin: 0
    }
  );

  addFooter(s, 4);
}

// ── Slide 5: Signal stack (8 layers) — with icons ─────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "시그널 스택 — 8 layers", "The signal stack");

  const layers = [
    [icons.anchor, "Layer 1", "Official anchor", "EEX EU ETS auction · KRX KAU · MEE / SEEX"],
    [
      icons.matrix,
      "Layer 2",
      "Driver matrix",
      "약 47개 드라이버 × 6 패밀리 (정책, 전력, 연료, 매크로, 날씨, 미시구조)"
    ],
    [
      icons.catalyst,
      "Layer 3",
      "Catalyst combinations",
      "≥ 2 driver를 묶은 21개 시나리오 (cold-snap stack, MSR + Fit-for-55, ETS2 등)"
    ],
    [
      icons.active,
      "Layer 4",
      "Active patterns",
      "freshness / 가격급변 / 거래량급변 / 프록시 괴리 — 임계 자동감지"
    ],
    [
      icons.calib,
      "Layer 5",
      "Calibration",
      "25개 historical event 기반 event study — heuristic / backtest / calibrated"
    ],
    [
      icons.proxy,
      "Layer 6",
      "Listed proxy",
      "ICE EUA · KRBN · KEUA · CO2.L · KCCA — 프록시 괴리 시그널"
    ],
    [
      icons.atlas,
      "Layer 7",
      "Materials atlas",
      "IPCC AR6 · IEA · IRENA · ICVCM 인용 장기 abatement curve"
    ],
    [
      icons.feeds,
      "Layer 8",
      "Public-data feeds",
      "FRED · ECB SDW · ICAP · World Bank — license-free 보강"
    ]
  ];

  const startY = 1.85;
  const rowH = 0.55;
  const colIconW = 0.5,
    colNumW = 0.95,
    colTitleW = 2.6;
  const colDescW = W - 1.5 - colIconW - colNumW - colTitleW - 0.2;

  layers.forEach((row, i) => {
    const y = startY + i * rowH;
    if (i % 2 === 1) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5,
        y: y,
        w: W - 1.0,
        h: rowH,
        fill: { color: C.panel },
        line: { color: C.panel, width: 0 }
      });
    }
    s.addImage({ data: row[0], x: 0.65, y: y + 0.1, w: 0.35, h: 0.35 });
    s.addText(row[1], {
      x: 0.65 + colIconW + 0.1,
      y: y,
      w: colNumW,
      h: rowH,
      fontSize: 12,
      fontFace: FONT_MONO,
      color: C.accent,
      bold: true,
      valign: "middle",
      margin: 0
    });
    s.addText(row[2], {
      x: 0.65 + colIconW + 0.1 + colNumW,
      y: y,
      w: colTitleW,
      h: rowH,
      fontSize: 16,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      valign: "middle",
      margin: 0
    });
    s.addText(row[3], {
      x: 0.65 + colIconW + 0.1 + colNumW + colTitleW,
      y: y,
      w: colDescW,
      h: rowH,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.body,
      valign: "middle",
      margin: 0
    });
  });

  addFooter(s, 5);
}

// ── Slide 6: Decision surfaces ────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "의사결정 화면 — 4 surfaces", "Decision surfaces");

  const surfaces = [
    {
      name: "Command",
      q: "오늘 무엇을 해야 하고, 왜 그런가?",
      desc: "공식 anchor + proxy 차트 + 결정 메모 + 상위 드라이버 + freshness chips를 한 화면에."
    },
    {
      name: "Drivers",
      q: "지금 어떤 시그널이 켜졌는가?",
      desc: "Active patterns / 21 catalyst / materials atlas / calibration provenance / event timeline / driver heatmap."
    },
    {
      name: "Desk",
      q: "한 시장을 깊게 보고 싶다",
      desc: "anchor vs hedge tape 차트, range/correlation 표, scenario weight 슬라이더 — 시장별 brief 작성용."
    },
    {
      name: "Sources",
      q: "이 데이터는 어디서 왔고 얼마나 신선한가?",
      desc: "접근 방식, freshness, 입력 커버리지, 신뢰 레지스트리 — 컴플라이언스 리뷰의 첫 화면."
    }
  ];

  const colW = 2.95,
    colH = 4.0,
    gap = 0.2;
  const startX = (W - (colW * 4 + gap * 3)) / 2;
  const startY = 2.0;

  surfaces.forEach((sf, i) => {
    const cx = startX + i * (colW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: startY,
      w: colW,
      h: colH,
      fill: { color: C.bg },
      line: { color: C.line, width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: startY,
      w: colW,
      h: 0.6,
      fill: { color: C.accent },
      line: { color: C.accent, width: 0 }
    });
    s.addText(sf.name, {
      x: cx + 0.2,
      y: startY + 0.05,
      w: colW - 0.4,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: "FFFFFF",
      bold: true,
      valign: "middle",
      margin: 0
    });
    s.addText("“" + sf.q + "”", {
      x: cx + 0.2,
      y: startY + 0.85,
      w: colW - 0.4,
      h: 1.4,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      italic: true,
      valign: "top",
      margin: 0,
      paraSpaceAfter: 4
    });
    s.addText(sf.desc, {
      x: cx + 0.2,
      y: startY + 2.3,
      w: colW - 0.4,
      h: colH - 2.4,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.body,
      valign: "top",
      margin: 0,
      paraSpaceAfter: 4
    });
  });

  addFooter(s, 6);
}

// ── Slide 7: Calibration provenance — with chart ─────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "캘리브레이션 출처 — 3-state taxonomy", "Calibration provenance");

  const states = [
    {
      tag: "heuristic",
      icon: icons.heuristic,
      color: C.yellow,
      count: 21,
      label: "휴리스틱 상수",
      desc: "interactionEffect별 placeholder 상수. event log로 검증되지 않음. v1.3 기본 상태."
    },
    {
      tag: "backtest",
      icon: icons.backtest,
      color: C.accent,
      count: 0,
      label: "이벤트 스터디 결과",
      desc: "≥ 2 events · walk-forward 기반 multiplier. 25개 historical event log + monthly anchors 사용."
    },
    {
      tag: "calibrated",
      icon: icons.calibrated,
      color: C.green,
      count: 0,
      label: "백테스트 + 모델 owner 검토",
      desc: "backtest 후 model owner 사인오프. CHANGELOG에 multiplier · hit rate · 날짜 기록."
    }
  ];

  // Left side: 3 small badge rows summarizing each state
  const badgeX = 0.6;
  const badgeY = 2.0;
  const badgeRowH = 1.5;
  states.forEach((st, i) => {
    const y = badgeY + i * (badgeRowH + 0.1);
    s.addShape(pres.shapes.RECTANGLE, {
      x: badgeX,
      y,
      w: 6.4,
      h: badgeRowH,
      fill: { color: C.bg },
      line: { color: st.color, width: 1.5 }
    });
    s.addImage({ data: st.icon, x: badgeX + 0.25, y: y + 0.35, w: 0.8, h: 0.8 });
    s.addText(st.tag, {
      x: badgeX + 1.2,
      y: y + 0.18,
      w: 4.5,
      h: 0.35,
      fontSize: 13,
      fontFace: FONT_MONO,
      color: st.color,
      bold: true,
      charSpacing: 4,
      margin: 0
    });
    s.addText(st.label, {
      x: badgeX + 1.2,
      y: y + 0.48,
      w: 4.5,
      h: 0.4,
      fontSize: 16,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0
    });
    s.addText(st.desc, {
      x: badgeX + 1.2,
      y: y + 0.88,
      w: 5.0,
      h: badgeRowH - 0.95,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.body,
      margin: 0
    });
  });

  // Right side: a real bar chart showing distribution
  s.addText("21개 시나리오 현재 상태", {
    x: 7.4,
    y: 2.0,
    w: 5.4,
    h: 0.4,
    fontSize: 14,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0
  });
  s.addText("(2026-05-06 기준)", {
    x: 7.4,
    y: 2.4,
    w: 5.4,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.soft,
    italic: true,
    margin: 0
  });

  s.addChart(
    pres.charts.BAR,
    [
      {
        name: "scenarios",
        labels: ["heuristic", "backtest", "calibrated"],
        values: [21, 0, 0]
      }
    ],
    {
      x: 7.4,
      y: 2.8,
      w: 5.4,
      h: 3.4,
      barDir: "bar", // horizontal bars
      chartColors: [C.yellow], // single series — second + third bars also use this; differentiation via labels
      chartArea: { fill: { color: "FFFFFF" }, roundedCorners: false },
      catAxisLabelColor: C.body,
      catAxisLabelFontSize: 12,
      catAxisLabelFontFace: FONT_MONO,
      valAxisLabelColor: C.soft,
      valAxisLabelFontSize: 10,
      valGridLine: { color: C.line, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelColor: C.ink,
      dataLabelFontSize: 11,
      dataLabelFontFace: FONT_MONO,
      dataLabelPosition: "outEnd",
      showLegend: false,
      showTitle: false,
      barGapWidthPct: 50
    }
  );

  s.addText(
    "v1.3 기준 21개 시나리오 모두 heuristic. 외부 검토자가 이벤트 로그 + price anchors로 backtest 단계 진입 가능. npm run calibration:check가 90일 freshness 게이트 강제.",
    {
      x: 0.6,
      y: 6.7,
      w: W - 1.2,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.soft,
      italic: true,
      valign: "top",
      margin: 0
    }
  );

  addFooter(s, 7);
}

// ── Slide 8: Compliance per jurisdiction ──────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "컴플라이언스 — 관할별 비집행 boundary", "Compliance — non-execution boundary");

  const rows = [
    {
      flag: "EU",
      title: "European Union",
      body: "MiFID II 투자서비스 / 자기매매 / 주문전달 X. EU Benchmarks Regulation 의 published index X. EEX, EU Commission, ICAP 1차 자료 인용."
    },
    {
      flag: "KR",
      title: "Korea (KRX K-ETS)",
      body: "자본시장법 투자자문업·일임업 X. 금융투자업자 X. 배출권 거래소·검증기관 X. KRX, MOE, ICAP 1차 자료 인용."
    },
    {
      flag: "CN",
      title: "China (national ETS)",
      body: "증권법 증권사 / 자산관리 X. 등록 탄소거래플랫폼 X — SHEEX가 운영주체. CSRC 라이선스 자문 X. MEE, SHEEX, ICAP 1차 자료 인용."
    }
  ];

  const startY = 2.0;
  const rowH = 1.45;
  rows.forEach((r, i) => {
    const y = startY + i * (rowH + 0.18);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6,
      y: y,
      w: W - 1.2,
      h: rowH,
      fill: { color: C.panel },
      line: { color: C.line, width: 0.75 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6,
      y: y,
      w: 1.2,
      h: rowH,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 }
    });
    s.addText(r.flag, {
      x: 0.6,
      y: y,
      w: 1.2,
      h: rowH,
      fontSize: 36,
      fontFace: FONT_HEAD,
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0
    });
    s.addText(r.title, {
      x: 2.0,
      y: y + 0.15,
      w: W - 2.7,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0
    });
    s.addText(r.body, {
      x: 2.0,
      y: y + 0.65,
      w: W - 2.7,
      h: rowH - 0.7,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.body,
      margin: 0
    });
  });

  s.addText(
    "전체 boundary는 docs/COMPLIANCE.md, COMPLIANCE-EU.md, COMPLIANCE-KR.md, COMPLIANCE-CN.md 참조.",
    {
      x: 0.6,
      y: 6.85,
      w: W - 1.2,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.soft,
      italic: true,
      margin: 0
    }
  );

  addFooter(s, 8);
}

// ── Slide 9: Tech ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "기술 스택", "Tech");

  const tiles = [
    { k: "Renderer", v: "React 19 + TypeScript 6", ext: "Vite 8 빌드 / 197 vitest + 53 node:test" },
    { k: "Desktop", v: "Electron 41", ext: "contextIsolation · sandbox · strict CSP" },
    {
      k: "Packaging",
      v: "electron-builder",
      ext: "Windows portable + NSIS · macOS / Linux advisory"
    },
    { k: "Auto-update", v: "electron-updater", ext: "GitHub releases 피드 · code-signed 권장" },
    {
      k: "Charts",
      v: "Lightweight Charts",
      ext: "Toss-style 디자인 토큰 · Pretendard / Inter / Fraunces"
    },
    { k: "Telemetry", v: "Sentry + analytics", ext: "둘 다 opt-in · 환경변수 게이트 · 기본 OFF" }
  ];

  const colW = 4.0,
    colH = 1.8,
    gap = 0.3;
  const startX = (W - (colW * 3 + gap * 2)) / 2;
  const startY = 2.0;

  tiles.forEach((t, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const cx = startX + col * (colW + gap);
    const cy = startY + row * (colH + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: cy,
      w: colW,
      h: colH,
      fill: { color: C.bg },
      line: { color: C.line, width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: cy,
      w: 0.08,
      h: colH,
      fill: { color: C.accent },
      line: { color: C.accent, width: 0 }
    });
    s.addText(t.k, {
      x: cx + 0.3,
      y: cy + 0.2,
      w: colW - 0.5,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.soft,
      charSpacing: 4,
      bold: true,
      margin: 0
    });
    s.addText(t.v, {
      x: cx + 0.3,
      y: cy + 0.55,
      w: colW - 0.5,
      h: 0.55,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0
    });
    s.addText(t.ext, {
      x: cx + 0.3,
      y: cy + 1.15,
      w: colW - 0.5,
      h: colH - 1.2,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.body,
      margin: 0
    });
  });

  addFooter(s, 9);
}

// ── Slide 10: Architecture — diagram with arrows ──────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "아키텍처 — 3 컨텍스트 + 1 IPC 경계", "Architecture");

  // Three boxes: Renderer (left) → Preload (mid) → Main (right)
  // Arrange horizontally to show data flow
  const boxes = [
    {
      icon: icons.rendererIcn,
      k: "Renderer",
      v: "src/**",
      body: "React UI · 4 surfaces · 시장 보드 · 드라이버 · 소스"
    },
    {
      icon: icons.bridgeIcn,
      k: "Preload",
      v: "preload.js",
      body: "contextBridge로 typed allow-listed API 만 노출"
    },
    {
      icon: icons.serverIcn,
      k: "Main",
      v: "main.js · electron/*.js",
      body: "라이프사이클 · IPC · 공식 fetch · 영속화 · CSP"
    }
  ];

  const boxW = 3.4,
    boxH = 2.6;
  const gap = 0.6;
  const totalBoxW = boxW * 3 + gap * 2;
  const startX = (W - totalBoxW) / 2;
  const startY = 2.2;

  boxes.forEach((b, i) => {
    const cx = startX + i * (boxW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx,
      y: startY,
      w: boxW,
      h: boxH,
      fill: { color: C.panel },
      line: { color: C.line, width: 0.75 }
    });
    s.addImage({ data: b.icon, x: cx + (boxW - 0.7) / 2, y: startY + 0.3, w: 0.7, h: 0.7 });
    s.addText(b.k, {
      x: cx,
      y: startY + 1.1,
      w: boxW,
      h: 0.4,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: C.accent,
      bold: true,
      align: "center",
      margin: 0
    });
    s.addText(b.v, {
      x: cx,
      y: startY + 1.55,
      w: boxW,
      h: 0.3,
      fontSize: 11,
      fontFace: FONT_MONO,
      color: C.body,
      align: "center",
      margin: 0
    });
    s.addText(b.body, {
      x: cx + 0.2,
      y: startY + 1.95,
      w: boxW - 0.4,
      h: boxH - 2.05,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.ink,
      align: "center",
      margin: 0
    });

    // Arrow to next box
    if (i < boxes.length - 1) {
      const arrowY = startY + boxH / 2;
      const arrowX0 = cx + boxW + 0.05;
      const arrowX1 = cx + boxW + gap - 0.05;
      s.addShape(pres.shapes.LINE, {
        x: arrowX0,
        y: arrowY,
        w: arrowX1 - arrowX0,
        h: 0,
        line: { color: C.accent, width: 2.5, endArrowType: "triangle" }
      });
      // label between arrows
      s.addText(i === 0 ? "IPC" : "events", {
        x: arrowX0,
        y: arrowY - 0.35,
        w: arrowX1 - arrowX0,
        h: 0.25,
        fontSize: 9,
        fontFace: FONT_MONO,
        color: C.soft,
        align: "center",
        charSpacing: 2,
        margin: 0
      });
    }
  });

  // Bottom security baseline strip
  const baseY = startY + boxH + 0.5;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6,
    y: baseY,
    w: W - 1.2,
    h: 1.0,
    fill: { color: C.accentSoft },
    line: { color: C.accent, width: 0 }
  });
  s.addText("SECURITY BASELINE", {
    x: 0.8,
    y: baseY + 0.15,
    w: W - 1.6,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.accentInk,
    bold: true,
    charSpacing: 4,
    margin: 0
  });
  s.addText(
    "contextIsolation true · nodeIntegration false · sandbox true · webSecurity true · strict CSP · assertTrustedSender on every IPC",
    {
      x: 0.8,
      y: baseY + 0.45,
      w: W - 1.6,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.ink,
      margin: 0
    }
  );

  s.addText("영속화는 모두 <userData> 아래 — settings · watchlist · backtests · logs.", {
    x: 0.6,
    y: H - 0.95,
    w: W - 1.2,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.soft,
    italic: true,
    align: "center",
    margin: 0
  });

  addFooter(s, 10);
}

// ── Slide 11: Roadmap — with icons ────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bg };
  addAccentBar(s);
  addTitleHead(s, "다음 마일스톤 후보", "Roadmap candidates");

  const items = [
    {
      icon: icons.spread,
      tag: "Spread",
      title: "Clean dark · clean spark spread monitor",
      body: "검증된 fuel · power 입력으로 fuel-switching 마진을 실시간으로."
    },
    {
      icon: icons.errBand,
      tag: "Backtest",
      title: "Historical forecast error panel + rolling confidence",
      body: "OOS forecast 검증을 walk-forward harness로 자체 노출."
    },
    {
      icon: icons.portfolio,
      tag: "Portfolio",
      title: "Carbon sleeve optimizer",
      body: "다중 시장 보유 비중 최적화 + 비용 가정 명시."
    },
    {
      icon: icons.exportIcn,
      tag: "Export",
      title: "Read-only institutional export layer",
      body: "데스크 통합용 read-only API · CSV / JSON snapshot 게이트."
    }
  ];

  const startY = 2.0,
    rowH = 1.0;
  items.forEach((item, i) => {
    const y = startY + i * (rowH + 0.15);
    // Icon in colored circle
    s.addShape(pres.shapes.OVAL, {
      x: 0.7,
      y: y + 0.15,
      w: 0.7,
      h: 0.7,
      fill: { color: C.accentSoft },
      line: { color: C.accent, width: 1.5 }
    });
    s.addImage({ data: item.icon, x: 0.85, y: y + 0.3, w: 0.4, h: 0.4 });
    s.addText(item.tag, {
      x: 1.6,
      y: y,
      w: 2.0,
      h: 0.4,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.accent,
      bold: true,
      charSpacing: 6,
      margin: 0
    });
    s.addText(item.title, {
      x: 1.6,
      y: y + 0.32,
      w: W - 2.2,
      h: 0.5,
      fontSize: 17,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0
    });
    s.addText(item.body, {
      x: 1.6,
      y: y + 0.78,
      w: W - 2.2,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.body,
      margin: 0
    });
  });

  addFooter(s, 11);
}

// ── Slide 12: Closing ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.rail };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 0.3,
    h: H,
    fill: { color: C.accent },
    line: { color: C.accent, width: 0 }
  });

  s.addText("매일 같은 4단계", {
    x: 0.9,
    y: 1.5,
    w: 11,
    h: 0.5,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: "5A99FF",
    bold: true,
    charSpacing: 8,
    margin: 0
  });

  const steps = ["공식", "프록시", "드라이버", "결정"];
  const stepW = 2.4,
    stepGap = 0.3;
  const totalW = steps.length * stepW + (steps.length - 1) * stepGap;
  const startX = (W - totalW) / 2;
  steps.forEach((step, i) => {
    const x = startX + i * (stepW + stepGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 2.4,
      w: stepW,
      h: 1.5,
      fill: { color: "232830" },
      line: { color: "323840", width: 1 }
    });
    s.addText(`0${i + 1}`, {
      x,
      y: 2.5,
      w: stepW,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT_MONO,
      color: C.accent,
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0
    });
    s.addText(step, {
      x,
      y: 2.95,
      w: stepW,
      h: 0.9,
      fontSize: 32,
      fontFace: FONT_HEAD,
      color: "FFFFFF",
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0
    });
    if (i < steps.length - 1) {
      s.addText("→", {
        x: x + stepW,
        y: 2.4,
        w: stepGap,
        h: 1.5,
        fontSize: 22,
        fontFace: FONT_BODY,
        color: C.accent,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0
      });
    }
  });

  s.addText("C-Quant이 도와드립니다.", {
    x: 0.9,
    y: 4.6,
    w: 11,
    h: 0.7,
    fontSize: 28,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0
  });
  s.addText("Carbon decisions, every day, in the same shape.", {
    x: 0.9,
    y: 5.3,
    w: 11,
    h: 0.5,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: "8B95A1",
    italic: true,
    margin: 0
  });

  s.addShape(pres.shapes.LINE, {
    x: 0.9,
    y: H - 1.2,
    w: 4,
    h: 0,
    line: { color: C.accent, width: 2 }
  });
  s.addText("github.com/hyunjin-kor/C-Quant  ·  research-only  ·  v1.3", {
    x: 0.9,
    y: H - 1.05,
    w: 11,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_MONO,
    color: "8B95A1",
    charSpacing: 2,
    margin: 0
  });
}

await pres.writeFile({ fileName: OUT_PATH });
console.log(`wrote ${OUT_PATH}`);
