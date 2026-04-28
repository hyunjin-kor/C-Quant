// Centralized typed access to the Electron preload bridge.
//
// The bridge is exposed by preload.js as window.desktopBridge. We declare
// the full surface here so every callsite gets the same types, and provide
// safe wrappers for renderer-side code paths that may run in a stripped
// preview build (no bridge).

export type AppLocale = "ko" | "en";
export type ThemePreference = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemePreference;
  locale: AppLocale;
  reducedMotion: boolean;
  surface: string;
  market: string;
};

export type RendererStartupFailurePayload = {
  phase: string;
  message: string;
  stack?: string;
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

export async function saveAppSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings | null> {
  const bridge = getBridge();
  if (!bridge?.saveAppSettings) return null;
  try {
    return await bridge.saveAppSettings(partial);
  } catch {
    return null;
  }
}
