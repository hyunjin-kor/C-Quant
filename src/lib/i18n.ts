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
  "analytics.disabled": { ko: "분석 사용 안 함", en: "Analytics disabled" }
};

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function tt(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const entry = catalog[key];
  if (!entry) return key;
  const template = locale === "ko" ? entry.ko : entry.en;
  return interpolate(template, params);
}

export function hasKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(catalog, key);
}
