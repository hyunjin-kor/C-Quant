import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  getBridge,
  loadAppSettings,
  saveAppSettings,
  type AppLocale,
  type ThemePreference
} from "./desktopBridge";

type EffectiveTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  reducedMotion: boolean;
  setReducedMotion: (next: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "cquant:theme";
const LOCALE_STORAGE_KEY = "cquant:locale";
const RM_STORAGE_KEY = "cquant:reducedMotion";

function readLocalString(key: string, fallback: string) {
  try {
    return (typeof window !== "undefined" && window.localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeLocalString(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // best-effort
  }
}

function readSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readSystemLocale(): AppLocale {
  if (typeof navigator === "undefined") return "en";
  return String(navigator.language || "")
    .toLowerCase()
    .startsWith("ko")
    ? "ko"
    : "en";
}

function applyThemeToDocument(theme: ThemePreference, reducedMotion: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  if (reducedMotion) {
    root.setAttribute("data-reduced-motion", "true");
  } else {
    root.removeAttribute("data-reduced-motion");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initial values come from localStorage so the first paint is correct;
  // they're then reconciled with the persisted Electron settings.
  // Light is the default desk experience; "system"/"dark" remain one
  // toggle away and any previously saved preference wins.
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const raw = readLocalString(THEME_STORAGE_KEY, "light");
    return raw === "dark" || raw === "system" ? raw : "light";
  });
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    const raw = readLocalString(LOCALE_STORAGE_KEY, readSystemLocale());
    return raw === "en" ? "en" : "ko";
  });
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    const raw = readLocalString(RM_STORAGE_KEY, "false");
    return raw === "true";
  });
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(readSystemTheme);

  // Sync from Electron-persisted settings on mount.
  useEffect(() => {
    let cancelled = false;
    void loadAppSettings().then((settings) => {
      if (cancelled || !settings) return;
      setThemeState(settings.theme);
      setLocaleState(settings.locale);
      setReducedMotionState(settings.reducedMotion);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen to OS theme changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(media.matches ? "dark" : "light");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Apply to <html> on every relevant change.
  useEffect(() => {
    applyThemeToDocument(theme, reducedMotion);
  }, [theme, reducedMotion]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    writeLocalString(THEME_STORAGE_KEY, next);
    if (getBridge()?.saveAppSettings) {
      void saveAppSettings({ theme: next });
    }
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    writeLocalString(LOCALE_STORAGE_KEY, next);
    if (getBridge()?.saveAppSettings) {
      void saveAppSettings({ locale: next });
    }
    // Broadcast for App.tsx (and any other islands) that own their own
    // locale state and need to re-render when the user toggles via Cmd+K.
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("cquant:locale-change", { detail: { locale: next } }));
      } catch {
        // ignore — not all renderers support CustomEvent identically
      }
    }
  }, []);

  const setReducedMotion = useCallback((next: boolean) => {
    setReducedMotionState(next);
    writeLocalString(RM_STORAGE_KEY, String(next));
    if (getBridge()?.saveAppSettings) {
      void saveAppSettings({ reducedMotion: next });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  }, [theme, setTheme]);

  const effectiveTheme: EffectiveTheme = theme === "system" ? systemTheme : theme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
      locale,
      setLocale,
      reducedMotion,
      setReducedMotion
    }),
    [
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
      locale,
      setLocale,
      reducedMotion,
      setReducedMotion
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return ctx;
}
