import { useEffect, useRef } from "react";
import { getBridge, loadAppSettings, saveAppSettings } from "./desktopBridge";
import { useToast } from "./toast";
import { useTheme } from "./theme";
import { tt } from "./i18n";

const STORAGE_KEY = "cquant:firstRunAt";

/**
 * Lightweight first-run sequence: we don't open a modal because the
 * desktop already ships dense; instead we drop three timed toasts and
 * mark the run complete in settings.json (and localStorage as fallback).
 */
export function FirstRun() {
  const { locale } = useTheme();
  const toast = useToast();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    let cancelled = false;

    async function maybeFire() {
      if (typeof window === "undefined") return;

      const bridge = getBridge();
      let alreadyDone = false;
      if (bridge?.getAppSettings) {
        const settings = await loadAppSettings();
        alreadyDone = Boolean(settings?.firstRunCompletedAt);
      } else {
        alreadyDone = Boolean(window.localStorage.getItem(STORAGE_KEY));
      }
      if (alreadyDone || cancelled) return;
      fired.current = true;

      const sequence: Array<{ delayMs: number; title: string; body: string }> = [
        {
          delayMs: 1500,
          title: tt(locale, "firstRun.welcome.title"),
          body: tt(locale, "firstRun.welcome.body")
        },
        {
          delayMs: 6000,
          title: tt(locale, "firstRun.theme.title"),
          body: tt(locale, "firstRun.theme.body")
        },
        {
          delayMs: 11000,
          title: tt(locale, "firstRun.privacy.title"),
          body: tt(locale, "firstRun.privacy.body")
        }
      ];

      const timers = sequence.map((step) =>
        window.setTimeout(() => {
          if (cancelled) return;
          toast.push({
            tone: "info",
            title: step.title,
            description: step.body,
            durationMs: 8000
          });
        }, step.delayMs)
      );

      const stamp = new Date().toISOString();
      try {
        window.localStorage.setItem(STORAGE_KEY, stamp);
      } catch {
        // ignore
      }
      if (bridge?.saveAppSettings) {
        await saveAppSettings({ firstRunCompletedAt: stamp });
      }

      // No teardown required for one-shot timeouts beyond cancellation.
      void timers;
    }

    void maybeFire();

    return () => {
      cancelled = true;
    };
  }, [locale, toast]);

  return null;
}
