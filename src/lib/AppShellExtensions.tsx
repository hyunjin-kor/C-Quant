import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { useRegisterCommands, type Command } from "./commandPalette";
import { getBridge, loadAppSettings, saveAppSettings } from "./desktopBridge";
import { UpdateNotice } from "./UpdateNotice";
import { WatchlistDrawer } from "./WatchlistDrawer";
import { BacktestDrawer } from "./BacktestDrawer";
import { AlertsDrawer } from "./AlertsDrawer";
import { DropZone } from "./DropZone";
import { FirstRun } from "./firstRun";
import { SurfaceSearch } from "./SurfaceSearch";

/**
 * The shell layer renders the floating chrome (theme toggle, update banner,
 * drawers, drop zone), wires every Cmd+K command, and triggers the
 * first-run sequence. App.tsx remains responsible for the surface
 * routing — we sit alongside it as additive UX.
 */
export function AppShellExtensions() {
  const { theme, setTheme, effectiveTheme, locale, setLocale, reducedMotion, setReducedMotion } =
    useTheme();
  const toast = useToast();
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const bridgeAvailable = useMemo(() => Boolean(getBridge()), []);

  // Hydrate analytics state from settings.
  useEffect(() => {
    let cancelled = false;
    void loadAppSettings().then((settings) => {
      if (!cancelled && settings) setAnalyticsEnabled(settings.analyticsEnabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAnalytics = useCallback(
    async (next: boolean) => {
      const bridge = getBridge();
      if (bridge?.analyticsSetEnabled) {
        try {
          await bridge.analyticsSetEnabled(next);
        } catch {
          // ignore
        }
      } else {
        await saveAppSettings({ analyticsEnabled: next });
      }
      setAnalyticsEnabled(next);
      toast.push({
        tone: "info",
        title: next ? "Analytics enabled" : "Analytics disabled",
        description: next
          ? "Anonymized usage events will be sent only when an endpoint is configured."
          : "No usage events will leave this machine."
      });
    },
    [toast]
  );

  const commands = useMemo<Command[]>(() => {
    const bridge = getBridge();

    const list: Command[] = [
      // ── Appearance ───────────────────────────────────────────────
      {
        id: "theme.light",
        title: "Theme: Light",
        group: "Appearance",
        run: () => setTheme("light")
      },
      { id: "theme.dark", title: "Theme: Dark", group: "Appearance", run: () => setTheme("dark") },
      {
        id: "theme.system",
        title: "Theme: Match system",
        group: "Appearance",
        run: () => setTheme("system")
      },
      {
        id: "theme.toggle",
        title: "Toggle theme",
        group: "Appearance",
        keywords: "switch toggle",
        run: () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
      },
      {
        id: "motion.toggle",
        title: reducedMotion ? "Motion: enable animations" : "Motion: reduce animations",
        group: "Appearance",
        run: () => setReducedMotion(!reducedMotion)
      },

      // ── Language ────────────────────────────────────────────────
      {
        id: "locale.toggle",
        title: locale === "ko" ? "Switch to English" : "한국어로 전환",
        group: "Language",
        keywords: "language locale 한국어 english",
        run: () => setLocale(locale === "ko" ? "en" : "ko")
      },
      {
        id: "locale.ko",
        title: "Language: 한국어",
        group: "Language",
        run: () => setLocale("ko")
      },
      {
        id: "locale.en",
        title: "Language: English",
        group: "Language",
        run: () => setLocale("en")
      },

      // ── Watchlist & backtests ───────────────────────────────────
      {
        id: "watchlist.open",
        title: "Open watchlist",
        group: "Workspace",
        keywords: "watchlist pin",
        run: () => setWatchlistOpen(true)
      },
      {
        id: "backtest.open",
        title: "Open backtest archive",
        group: "Workspace",
        keywords: "backtest results saved",
        run: () => setBacktestOpen(true)
      },
      {
        id: "alerts.open",
        title: "Open alerts",
        group: "Workspace",
        keywords: "alerts notifications rules freshness",
        run: () => setAlertsOpen(true)
      },
      {
        id: "alerts.evaluate",
        title: "Evaluate alerts now",
        group: "Workspace",
        keywords: "alerts evaluate trigger fire",
        run: async () => {
          const bridge = getBridge();
          if (!bridge?.alertsEvaluateNow) {
            toast.push({
              tone: "warning",
              title: "Alerts unavailable",
              description: "Desktop bridge is not connected."
            });
            return;
          }
          await bridge.alertsEvaluateNow();
          toast.push({
            tone: "info",
            title: "Alerts evaluated",
            description: "Re-checked every active rule."
          });
        }
      },
      {
        id: "search.open",
        title: "Search this surface…",
        group: "Workspace",
        keywords: "search find filter ctrl-f cmd-f",
        run: () => {
          // Synthesize a Ctrl+F event so SurfaceSearch picks it up via the
          // same path keyboard users use.
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "f", ctrlKey: true, bubbles: true })
          );
        }
      },

      // ── View ─────────────────────────────────────────────────────
      {
        id: "view.reload",
        title: "Reload window",
        group: "View",
        run: () => window.location.reload()
      }
    ];

    // ── Pin current view ──────────────────────────────────────────
    if (bridge?.watchlistAdd) {
      list.push({
        id: "watchlist.pin",
        title: "Pin current view to watchlist",
        group: "Workspace",
        keywords: "pin save bookmark watchlist",
        run: async () => {
          const surfaceLabel =
            (typeof window !== "undefined" && window.localStorage.getItem("cquant:surface")) ||
            "command";
          const marketLabel =
            (typeof window !== "undefined" && window.localStorage.getItem("cquant:market")) ||
            "k-ets";
          const item = {
            id: `${surfaceLabel}-${marketLabel}-${Date.now().toString(36)}`,
            label: `${marketLabel.toUpperCase()} · ${surfaceLabel}`,
            marketId: marketLabel,
            surface: surfaceLabel,
            createdAt: new Date().toISOString()
          };
          try {
            await bridge.watchlistAdd!(item);
            toast.push({
              tone: "success",
              title: "Pinned to watchlist",
              description: item.label
            });
          } catch (error) {
            toast.push({
              tone: "error",
              title: "Pin failed",
              description: error instanceof Error ? error.message : String(error)
            });
          }
        }
      });
    }

    // ── Export ───────────────────────────────────────────────────
    if (bridge?.exportPdf) {
      list.push({
        id: "export.pdf",
        title: "Export current view as PDF…",
        group: "Export",
        keywords: "pdf export print save",
        run: async () => {
          try {
            const result = await bridge.exportPdf!({
              defaultName: `c-quant-${new Date().toISOString().slice(0, 10)}.pdf`,
              landscape: true
            });
            if (!result?.canceled && result?.filePath) {
              toast.push({
                tone: "success",
                title: "Exported PDF",
                description: result.filePath
              });
            }
          } catch (error) {
            toast.push({
              tone: "error",
              title: "PDF export failed",
              description: error instanceof Error ? error.message : String(error)
            });
          }
        }
      });
    }

    if (bridge?.exportCsv) {
      list.push({
        id: "export.appinfo.csv",
        title: "Export app diagnostics as CSV…",
        group: "Export",
        keywords: "csv app info diagnostics export",
        run: async () => {
          try {
            const info = (await bridge.getAppInfo?.()) ?? {};
            const result = await bridge.exportCsv!({
              defaultName: "c-quant-diagnostics.csv",
              rows: [info as Record<string, unknown>]
            });
            if (!result?.canceled && result?.filePath) {
              toast.push({
                tone: "success",
                title: "Exported diagnostics",
                description: result.filePath
              });
            }
          } catch (error) {
            toast.push({
              tone: "error",
              title: "CSV export failed",
              description: error instanceof Error ? error.message : String(error)
            });
          }
        }
      });
    }

    if (bridge?.exportMarkdown) {
      list.push({
        id: "export.appinfo.md",
        title: "Export app diagnostics as Markdown…",
        group: "Export",
        keywords: "markdown md report export",
        run: async () => {
          try {
            const info = (await bridge.getAppInfo?.()) ?? {};
            const rows = Object.entries(info).map(([key, value]) => ({
              key,
              value: String(value ?? "")
            }));
            const result = await bridge.exportMarkdown!({
              defaultName: "c-quant-diagnostics.md",
              title: "C-Quant diagnostics",
              intro: `Generated for build ${(info as { version?: string }).version ?? "1.1.0"}.`,
              rows,
              columns: ["key", "value"]
            });
            if (!result?.canceled && result?.filePath) {
              toast.push({
                tone: "success",
                title: "Exported diagnostics",
                description: result.filePath
              });
            }
          } catch (error) {
            toast.push({
              tone: "error",
              title: "Markdown export failed",
              description: error instanceof Error ? error.message : String(error)
            });
          }
        }
      });
    }

    // ── Updates ─────────────────────────────────────────────────
    if (bridge?.updaterCheck) {
      list.push(
        {
          id: "updater.check",
          title: "Check for updates",
          group: "Updates",
          run: async () => {
            const status = await bridge.updaterCheck!();
            const tone =
              status.state === "error"
                ? "error"
                : status.state === "available"
                  ? "info"
                  : "success";
            toast.push({
              tone,
              title: `Updater: ${status.state}`,
              description:
                status.state === "available" && status.version
                  ? `Version ${status.version} is available.`
                  : status.error || ""
            });
          }
        },
        {
          id: "updater.download",
          title: "Download update",
          group: "Updates",
          run: async () => {
            const status = await bridge.updaterDownload!();
            toast.push({
              tone: status.state === "error" ? "error" : "info",
              title: `Updater: ${status.state}`,
              description: status.error || ""
            });
          }
        },
        {
          id: "updater.install",
          title: "Install update and restart",
          group: "Updates",
          run: async () => {
            const status = await bridge.updaterInstall!();
            if (status.state === "downloaded" || status.state === "installing") return;
            toast.push({
              tone: "warning",
              title: "Cannot install yet",
              description: status.error || `Updater state: ${status.state}`
            });
          }
        }
      );
    }

    // ── Privacy ─────────────────────────────────────────────────
    list.push({
      id: "privacy.analytics.toggle",
      title: analyticsEnabled ? "Disable analytics" : "Enable analytics",
      group: "Privacy",
      keywords: "analytics privacy telemetry tracking",
      run: () => setAnalytics(!analyticsEnabled)
    });

    // ── Diagnostics ────────────────────────────────────────────
    if (bridge?.openUserDataFolder) {
      list.push(
        {
          id: "folder.userdata",
          title: "Open app data folder",
          group: "Diagnostics",
          run: async () => {
            await bridge.openUserDataFolder!("");
          }
        },
        {
          id: "folder.logs",
          title: "Open log folder",
          group: "Diagnostics",
          run: async () => {
            await bridge.openUserDataFolder!("logs");
          }
        },
        {
          id: "folder.backtests",
          title: "Open backtests folder",
          group: "Diagnostics",
          run: async () => {
            await bridge.openUserDataFolder!("backtests");
          }
        }
      );
    }

    // ── About ───────────────────────────────────────────────────
    list.push({
      id: "about",
      title: "About C-Quant",
      group: "Help",
      run: async () => {
        const info = (await bridge?.getAppInfo?.().catch(() => null)) ?? null;
        const version = info?.version ?? bridge?.version ?? "1.1.0";
        toast.push({
          tone: "info",
          title: `C-Quant ${version}`,
          description: info
            ? `Electron ${info.electron} · Node ${info.node} · ${info.platform}-${info.arch} · ${effectiveTheme} theme`
            : `${effectiveTheme} theme`
        });
      }
    });

    return list;
  }, [
    theme,
    effectiveTheme,
    locale,
    reducedMotion,
    analyticsEnabled,
    setTheme,
    setLocale,
    setReducedMotion,
    setAnalytics,
    toast
  ]);

  useRegisterCommands(commands);

  // Bridge-missing notice once at startup.
  useEffect(() => {
    if (bridgeAvailable) return;
    toast.push({
      tone: "warning",
      title: "Running without the desktop bridge",
      description:
        "Live source refresh is unavailable in this preview. Launch the Electron shell to connect the bridge.",
      durationMs: 8000
    });
  }, [bridgeAvailable, toast]);

  return (
    <>
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <UpdateNotice />
      <ThemeQuickToggle />
      <DropZone />
      <FirstRun />
      <WatchlistDrawer open={watchlistOpen} onClose={() => setWatchlistOpen(false)} />
      <BacktestDrawer open={backtestOpen} onClose={() => setBacktestOpen(false)} />
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <SurfaceSearch />
    </>
  );
}

function ThemeQuickToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const label =
    theme === "system"
      ? `Theme · System (${effectiveTheme})`
      : `Theme · ${theme[0].toUpperCase()}${theme.slice(1)}`;

  function next() {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={next}
      title="Cycle theme: light → system → dark"
      aria-label={`Toggle theme. Current: ${label}`}
      style={{
        position: "fixed",
        right: "1.05rem",
        bottom: "1.05rem",
        zIndex: 90
      }}
    >
      <span aria-hidden="true">{effectiveTheme === "dark" ? "☾" : "☀"}</span>
      <span>{label}</span>
    </button>
  );
}
