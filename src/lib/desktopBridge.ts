// Centralized typed access to the Electron preload bridge.

export type AppLocale = "ko" | "en";
export type ThemePreference = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemePreference;
  locale: AppLocale;
  reducedMotion: boolean;
  surface: string;
  market: string;
  analyticsEnabled: boolean;
  firstRunCompletedAt: string;
};

export type RendererStartupFailurePayload = {
  phase: string;
  message: string;
  stack?: string;
};

export type AppInfo = {
  version: string;
  name: string;
  isPackaged: boolean;
  platform: string;
  arch: string;
  electron: string;
  node: string;
  chrome: string;
  userData: string;
};

export type UpdaterStatus = {
  state:
    | "idle"
    | "disabled"
    | "unavailable"
    | "checking"
    | "up-to-date"
    | "available"
    | "downloading"
    | "downloaded"
    | "installing"
    | "error";
  at?: string;
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  error?: string;
};

export type WatchlistItem = {
  id: string;
  label: string;
  marketId: string;
  surface: string;
  quoteId?: string;
  createdAt: string;
};

export type WatchlistPayload = {
  version: number;
  items: WatchlistItem[];
};

export type BacktestSummary = {
  id: string;
  savedAt: string;
  bytes: number;
};

export type BacktestRecord = {
  id: string;
  savedAt: string;
  payload: unknown;
};

export type ExportResult = {
  canceled: boolean;
  filePath?: string;
};

export type CsvExportPayload = {
  rows: Array<Record<string, unknown>>;
  columns?: string[];
  defaultName?: string;
};

export type PdfExportPayload = {
  defaultName?: string;
  landscape?: boolean;
  pageSize?: string;
};

export type DesktopBridge = {
  version?: string;

  notifyRendererReady?: () => void;
  reportRendererStartupFailure?: (payload: RendererStartupFailurePayload) => void;

  refreshConnectedSources?: () => Promise<unknown>;
  getLiveQuoteHistory?: (options: { quoteId: string; range: string }) => Promise<unknown>;

  openExternal?: (url: string) => Promise<void>;
  minimizeWindow?: () => Promise<void>;
  toggleMaximizeWindow?: () => Promise<boolean>;
  closeWindow?: () => Promise<void>;
  isWindowMaximized?: () => Promise<boolean>;

  getAppSettings?: () => Promise<AppSettings | null>;
  saveAppSettings?: (partial: Partial<AppSettings>) => Promise<AppSettings | null>;

  getAppInfo?: () => Promise<AppInfo>;
  openUserDataFolder?: (sub?: "" | "logs" | "backtests") => Promise<string>;

  updaterStatus?: () => Promise<UpdaterStatus>;
  updaterCheck?: () => Promise<UpdaterStatus>;
  updaterDownload?: () => Promise<UpdaterStatus>;
  updaterInstall?: () => Promise<UpdaterStatus>;

  exportCsv?: (payload: CsvExportPayload) => Promise<ExportResult>;
  exportPdf?: (payload: PdfExportPayload) => Promise<ExportResult>;
  exportMarkdown?: (payload: {
    rows?: Array<Record<string, unknown>>;
    columns?: string[];
    title?: string;
    intro?: string;
    defaultName?: string;
  }) => Promise<ExportResult>;

  analyticsTrack?: (payload: {
    name: string;
    properties?: Record<string, string | number | boolean>;
  }) => Promise<void>;
  analyticsSetEnabled?: (value: boolean) => Promise<boolean>;

  watchlistLoad?: () => Promise<WatchlistPayload>;
  watchlistAdd?: (item: WatchlistItem) => Promise<WatchlistPayload>;
  watchlistRemove?: (id: string) => Promise<WatchlistPayload>;
  watchlistClear?: () => Promise<WatchlistPayload>;

  backtestList?: () => Promise<BacktestSummary[]>;
  backtestSave?: (payload: { id: string; body: unknown }) => Promise<BacktestSummary | null>;
  backtestLoad?: (id: string) => Promise<BacktestRecord | null>;
  backtestRemove?: (id: string) => Promise<boolean>;
};

export function getBridge(): DesktopBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as typeof window & { desktopBridge?: DesktopBridge }).desktopBridge;
}

export async function loadAppSettings(): Promise<AppSettings | null> {
  const bridge = getBridge();
  if (!bridge?.getAppSettings) return null;
  try {
    return await bridge.getAppSettings();
  } catch {
    return null;
  }
}

export async function saveAppSettings(partial: Partial<AppSettings>): Promise<AppSettings | null> {
  const bridge = getBridge();
  if (!bridge?.saveAppSettings) return null;
  try {
    return await bridge.saveAppSettings(partial);
  } catch {
    return null;
  }
}
