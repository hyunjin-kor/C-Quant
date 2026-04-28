import { useEffect, useMemo } from "react";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { useRegisterCommands, type Command } from "./commandPalette";
import { getBridge } from "./desktopBridge";

/**
 * Mounts cross-cutting UX wiring that lives at the App shell level:
 *  - Skip link (a11y)
 *  - Standard command palette commands
 *  - Welcome toast on first run
 *  - Bridge availability warning when running outside Electron
 */
export function AppShellExtensions() {
  const { theme, setTheme, effectiveTheme, reducedMotion, setReducedMotion } = useTheme();
  const toast = useToast();

  const bridgeAvailable = useMemo(() => Boolean(getBridge()), []);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "theme.light",
        title: "Theme: Light",
        group: "Appearance",
        keywords: "light theme bright cream warm",
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
      {
        id: "view.reload",
        title: "Reload window",
        group: "View",
        keywords: "reload refresh restart",
        run: () => window.location.reload()
      },
      {
        id: "about",
        title: "About C-Quant",
        group: "Help",
        keywords: "about version info",
        run: () =>
          toast.push({
            tone: "info",
            title: "C-Quant",
            description: `Desktop research workstation for EU, Korea, and China carbon markets. Build ${
              getBridge()?.version ?? "0.1.0"
            } · ${effectiveTheme} theme.`
          })
      }
    ],
    [theme, effectiveTheme, reducedMotion, setTheme, setReducedMotion, toast]
  );

  useRegisterCommands(commands);

  // Notify renderer in once on first mount that the desktop bridge is missing.
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
    <a className="skip-link" href="#workspace-main">
      Skip to content
    </a>
  );
}
