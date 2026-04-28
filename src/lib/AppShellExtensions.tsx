import { useEffect, useMemo } from "react";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { useRegisterCommands, type Command } from "./commandPalette";
import { getBridge } from "./desktopBridge";

const ITEM_ID = "current-view";

/**
 * Mounts cross-cutting UX wiring that lives at the App shell level:
 *  - Skip link (a11y)
 *  - Floating theme toggle (visible quick-switch)
 *  - Standard command palette commands
 *  - Welcome toast on first run / bridge missing
 */
export function AppShellExtensions() {
  const {
    theme,
    setTheme,
    effectiveTheme,
    locale,
    setLocale,
    reducedMotion,
    setReducedMotion
  } = useTheme();
  const toast = useToast();

  const bridgeAvailable = useMemo(() => Boolean(getBridge()), []);

  const commands = useMemo<Command[]>(() => {
    const bridge = getBridge();

    const list: Command[] = [
      // ── Appearance ────────────────────────────────────────────────
      {
        id: "theme.light",
        title: "Theme: Light",
        group: "Appearance",
        keywords: "light theme cream warm",
        run: () => setTheme("light")
      },
      {
        id: "theme.dark",
        title: "Theme: Dark",
        group: "Appearance",
        keywords: "dark night theme",
        run: () => setTheme("dark")
      },
      {
        id: "theme.system",
        title: "Theme: Match system",
        group: "Appearance",
        keywords: "system auto follow os",
        run: () => setTheme("system")
      },
      {
        id: "theme.toggle",
        title: "Toggle theme",
        group: "Appearance",
        keywords: "toggle switch theme",
        run: () =>
          setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")
      },
      {
        id: "motion.toggle",
        title: reducedMotion ? "Motion: enable animations" : "Motion: reduce animations",
        group: "Appearance",
        keywords: "motion animation accessibility",
        run: () => setReducedMotion(!reducedMotion)
      },

      // ── Language ──────────────────────────────────────────────────
      {
        id: "locale.toggle",
        title: locale === "ko" ? "Switch to English" : "한국어로 전환",
        group: "Language",
        keywords: "locale language korean english 한국어 영어",
        run: () => setLocale(locale === "ko" ? "en" : "ko")
      },
      {
        id: "locale.ko",
        title: "Language: 한국어",
        group: "Language",
        keywords: "korean ko 한국어",
        run: () => setLocale("ko")
      },
      {
        id: "locale.en",
        title: "Language: English",
        group: "Language",
        keywords: "english en",
        run: () => setLocale("en")
      },

      // ── View ──────────────────────────────────────────────────────
      {
        id: "view.reload",
        title: "Reload window",
        group: "View",
        keywords: "reload refresh restart",
        run: () => window.location.reload()
      }
    ];

    // ── Export ──────────────────────────────────────────────────────
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

    // ── Watchlist ───────────────────────────────────────────────────
    if (bridge?.watchlistAdd) {
      list.push({
        id: "watchlist.pin",
        title: "Pin current view to watchlist",
        group: "Watchlist",
        keywords: "pin watchlist save bookmark",
        run: async () => {
          const surfaceLabel =
            (typeof window !== "undefined" &&
              window.localStorage.getItem("cquant:surface")) ||
            "command";
          const marketLabel =
            (typeof window !== "undefined" &&
              window.localStorage.getItem("cquant:market")) ||
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

    // ── Updates ─────────────────────────────────────────────────────
    if (bridge?.updaterCheck) {
      list.push({
        id: "updater.check",
        title: "Check for updates",
        group: "Updates",
        keywords: "update upgrade check version",
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
                ? `Version ${status.version} is available. Run "Download update" to fetch it.`
                : status.error || ""
          });
        }
      });

      list.push({
        id: "updater.download",
        title: "Download update",
        group: "Updates",
        keywords: "download update upgrade",
        run: async () => {
          const status = await bridge.updaterDownload!();
          toast.push({
            tone: status.state === "error" ? "error" : "info",
            title: `Updater: ${status.state}`,
            description: status.error || ""
          });
        }
      });

      list.push({
        id: "updater.install",
        title: "Install update and restart",
        group: "Updates",
        keywords: "install update upgrade restart",
        run: async () => {
          const status = await bridge.updaterInstall!();
          if (status.state === "downloaded" || status.state === "installing") return;
          toast.push({
            tone: "warning",
            title: "Cannot install yet",
            description: status.error || `Updater state: ${status.state}`
          });
        }
      });
    }

    // ── Folders / diagnostics ───────────────────────────────────────
    if (bridge?.openUserDataFolder) {
      list.push(
        {
          id: "folder.userdata",
          title: "Open app data folder",
          group: "Diagnostics",
          keywords: "user data folder open files",
          run: async () => {
            await bridge.openUserDataFolder!("");
          }
        },
        {
          id: "folder.logs",
          title: "Open log folder",
          group: "Diagnostics",
          keywords: "logs folder open debug",
          run: async () => {
            await bridge.openUserDataFolder!("logs");
          }
        },
        {
          id: "folder.backtests",
          title: "Open backtests folder",
          group: "Diagnostics",
          keywords: "backtests folder open results",
          run: async () => {
            await bridge.openUserDataFolder!("backtests");
          }
        }
      );
    }

    // ── About ───────────────────────────────────────────────────────
    list.push({
      id: "about",
      title: "About C-Quant",
      group: "Help",
      keywords: "about version info",
      run: async () => {
        const info = (await bridge?.getAppInfo?.().catch(() => null)) ?? null;
        const version = info?.version ?? bridge?.version ?? "0.1.0";
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
  }, [theme, effectiveTheme, locale, reducedMotion, setTheme, setLocale, setReducedMotion, toast]);

  useRegisterCommands(commands);

  // First-run / bridge-missing notice.
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

  // Mark the unused ITEM_ID at module level so the bundler keeps the symbol
  // available for later watchlist UX work.
  void ITEM_ID;

  return (
    <>
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <ThemeQuickToggle />
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
      <span aria-hidden="true">
        {effectiveTheme === "dark" ? "☾" : "☀"}
      </span>
      <span>{label}</span>
    </button>
  );
}
