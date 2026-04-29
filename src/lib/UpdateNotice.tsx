import { useCallback, useEffect, useState } from "react";
import { getBridge, type UpdaterStatus } from "./desktopBridge";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { tt } from "./i18n";

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 min
const FIRST_CHECK_DELAY_MS = 8 * 1000;

/**
 * Top-of-viewport banner that surfaces auto-updater state when an update
 * is available or already downloaded. Stays out of the way otherwise.
 */
export function UpdateNotice() {
  const { locale } = useTheme();
  const toast = useToast();
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge?.updaterStatus) return;
    try {
      const next = await bridge.updaterStatus();
      setStatus(next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const bridge = getBridge();
    if (!bridge?.updaterCheck) return;

    const firstCheck = setTimeout(async () => {
      try {
        const next = await bridge.updaterCheck!();
        setStatus(next);
      } catch {
        // ignore
      }
    }, FIRST_CHECK_DELAY_MS);

    const poll = setInterval(() => {
      void bridge
        .updaterCheck?.()
        .then(setStatus)
        .catch(() => {});
    }, POLL_INTERVAL_MS);

    const refreshTick = setInterval(refresh, 5000);

    return () => {
      clearTimeout(firstCheck);
      clearInterval(poll);
      clearInterval(refreshTick);
    };
  }, [refresh]);

  if (!status || dismissed) return null;
  if (status.state !== "available" && status.state !== "downloaded") return null;

  const isReady = status.state === "downloaded";

  async function onPrimary() {
    const bridge = getBridge();
    if (!bridge) return;
    setBusy(true);
    try {
      if (isReady && bridge.updaterInstall) {
        await bridge.updaterInstall();
      } else if (bridge.updaterDownload) {
        const next = await bridge.updaterDownload();
        setStatus(next);
        if (next.state === "error") {
          toast.push({
            tone: "error",
            title: "Updater error",
            description: next.error || "Could not download the update."
          });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="update-notice" role="status" aria-live="polite">
      <div className="update-notice__icon" aria-hidden="true">
        ↑
      </div>
      <div className="update-notice__copy">
        <strong>
          {tt(locale, isReady ? "update.downloaded.title" : "update.available.title")}
        </strong>
        <p>
          {tt(locale, isReady ? "update.downloaded.body" : "update.available.body", {
            version: status.version || ""
          })}
        </p>
      </div>
      <div className="update-notice__actions">
        <button type="button" className="button primary small" onClick={onPrimary} disabled={busy}>
          {tt(locale, isReady ? "update.actions.install" : "update.actions.download")}
        </button>
        <button type="button" className="button ghost small" onClick={() => setDismissed(true)}>
          {tt(locale, "update.actions.dismiss")}
        </button>
      </div>
    </div>
  );
}
