/**
 * Lightweight, additive message catalog.
 *
 * The repo already has a sophisticated `localizeText` system in
 * `src/lib/localization.ts` that converts English source strings into
 * Korean. This module sits alongside it and gives the new shell
 * components (drawers, banners, first-run) a simple key-based catalog
 * so they don't have to embed English strings in code.
 *
 * Keys are namespaced by component, e.g. "watchlist.title". Missing
 * translations fall back to English; missing entries entirely return
 * the key so the issue is visible in the UI rather than silent.
 */

export type Locale = "ko" | "en";

type Catalog = Record<string, { ko: string; en: string }>;

const catalog: Catalog = {
  // Update notice
  "update.available.title": {
    ko: "새 업데이트 사용 가능",
    en: "Update available"
  },
  "update.available.body": {
    ko: "버전 {{version}}이(가) 준비됐습니다. 다운로드하시겠어요?",
    en: "Version {{version}} is ready to install."
  },
  "update.downloaded.title": {
    ko: "업데이트 다운로드 완료",
    en: "Update downloaded"
  },
  "update.downloaded.body": {
    ko: "재시작하면 적용됩니다.",
    en: "Restart C-Quant to apply."
  },
  "update.actions.download": { ko: "다운로드", en: "Download" },
  "update.actions.install": { ko: "재시작 & 적용", en: "Restart & install" },
  "update.actions.dismiss": { ko: "나중에", en: "Later" },

  // Watchlist drawer
  "watchlist.title": { ko: "워치리스트", en: "Watchlist" },
  "watchlist.empty": {
    ko: "아직 핀한 항목이 없습니다. ⌘K → ‘Pin current view’.",
    en: "No pinned views yet. ⌘K → ‘Pin current view’."
  },
  "watchlist.remove": { ko: "삭제", en: "Remove" },
  "watchlist.clear": { ko: "전체 비우기", en: "Clear all" },
  "watchlist.close": { ko: "닫기", en: "Close" },

  // Backtest drawer
  "backtest.title": { ko: "백테스트 보관함", en: "Backtest archive" },
  "backtest.empty": {
    ko: "저장된 백테스트가 없습니다.",
    en: "No backtests saved."
  },
  "backtest.load": { ko: "불러오기", en: "Load" },
  "backtest.remove": { ko: "삭제", en: "Remove" },
  "backtest.bytes": { ko: "{{n}} 바이트", en: "{{n}} bytes" },
  "backtest.savedAt": { ko: "저장: {{at}}", en: "Saved {{at}}" },

  // Drop zone
  "dropzone.hint": {
    ko: "CSV 파일을 여기로 드래그해 분석에 추가하세요",
    en: "Drop a CSV file here to attach it"
  },

  // First run
  "firstRun.welcome.title": {
    ko: "C-Quant에 오신 것을 환영합니다",
    en: "Welcome to C-Quant"
  },
  "firstRun.welcome.body": {
    ko: "EU·한국·중국 탄소시장 의사결정 데스크입니다. ⌘K로 모든 명령에 접근할 수 있어요.",
    en: "Carbon market decision desk for EU, Korea, and China. Press ⌘K to reach every command."
  },
  "firstRun.theme.title": { ko: "테마와 언어", en: "Theme and language" },
  "firstRun.theme.body": {
    ko: "우하단 토글로 라이트/다크/시스템을 전환하거나 ⌘K에서 언어를 바꿀 수 있습니다.",
    en: "Use the bottom-right toggle for theme; flip language any time via ⌘K."
  },
  "firstRun.privacy.title": { ko: "프라이버시", en: "Privacy" },
  "firstRun.privacy.body": {
    ko: "분석 수집은 기본 꺼져 있습니다. ⌘K → 'Enable analytics'로 명시적으로 켤 수 있어요.",
    en: "Analytics is off by default. Turn it on explicitly via ⌘K → ‘Enable analytics’."
  },

  // Analytics consent
  "analytics.enabled": { ko: "분석 사용", en: "Analytics enabled" },
  "analytics.disabled": { ko: "분석 사용 안 함", en: "Analytics disabled" },

  // Alerts drawer
  "alerts.title": { ko: "알림 규칙", en: "Alerts" },
  "alerts.empty": {
    ko: "활성화된 규칙이 없습니다. 시장과 임계값을 골라 추가하세요.",
    en: "No active rules yet. Pick a market and a threshold above to add one."
  },
  "alerts.market": { ko: "시장", en: "Market" },
  "alerts.kind": { ko: "종류", en: "Kind" },
  "alerts.kind.freshness": { ko: "신선도", en: "Freshness" },
  "alerts.kind.priceJump": { ko: "가격 급변(프록시)", en: "Price jump (proxy)" },
  "alerts.threshold": { ko: "신선도 임계값", en: "Freshness threshold" },
  "alerts.moveThreshold": { ko: "변동 임계값", en: "Move threshold" },
  "alerts.move": {
    ko: "5세션 프록시 변동 ±{{pct}}% 이상",
    en: "proxy move ≥ ±{{pct}}% over 5 sessions"
  },
  "alerts.add": { ko: "규칙 추가", en: "Add rule" },
  "alerts.evaluate": { ko: "지금 검사", en: "Evaluate now" },
  "alerts.maxAge": {
    ko: "공식 앵커가 {{age}}을(를) 초과하면 발동",
    en: "Fires when the anchor is older than {{age}}"
  },
  "alerts.lastFired": { ko: "마지막 발동 {{at}}", en: "Last fired {{at}}" },
  "alerts.added.title": { ko: "알림 규칙 추가됨", en: "Alert rule added" },
  "alerts.evaluated.title": { ko: "알림 검사 완료", en: "Alerts evaluated" },
  "alerts.evaluated.body": {
    ko: "현재 데이터로 모든 활성 규칙을 다시 평가했습니다.",
    en: "Re-evaluated every active rule against the current snapshot."
  },

  // Surface search
  "search.placeholder": { ko: "이 화면에서 검색…", en: "Search this surface…" }
};

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function tt(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const entry = catalog[key];
  if (!entry) return key;
  const template = locale === "ko" ? entry.ko : entry.en;
  return interpolate(template, params);
}

export function hasKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(catalog, key);
}
