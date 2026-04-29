import { useCallback, useEffect, useState } from "react";
import { getBridge, type WatchlistPayload } from "./desktopBridge";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { tt } from "./i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WatchlistDrawer({ open, onClose }: Props) {
  const { locale } = useTheme();
  const toast = useToast();
  const [payload, setPayload] = useState<WatchlistPayload>({ version: 1, items: [] });

  const reload = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge?.watchlistLoad) return;
    try {
      const data = await bridge.watchlistLoad();
      setPayload(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const items = payload.items ?? [];

  async function remove(id: string) {
    const bridge = getBridge();
    if (!bridge?.watchlistRemove) return;
    try {
      const next = await bridge.watchlistRemove(id);
      setPayload(next);
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Watchlist error",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function clearAll() {
    const bridge = getBridge();
    if (!bridge?.watchlistClear) return;
    try {
      const next = await bridge.watchlistClear();
      setPayload(next);
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Watchlist error",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function restore(item: { surface: string; marketId: string }) {
    try {
      window.localStorage.setItem("cquant:surface", item.surface);
      window.localStorage.setItem("cquant:market", item.marketId);
    } catch {
      // ignore
    }
    onClose();
    toast.push({
      tone: "info",
      title: "Pinned view restored",
      description: `${item.marketId.toUpperCase()} · ${item.surface}. Reload to apply.`
    });
  }

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Watchlist"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2>{tt(locale, "watchlist.title")}</h2>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label={tt(locale, "watchlist.close")}
          >
            ×
          </button>
        </header>
        {items.length === 0 ? (
          <div className="drawer-empty">{tt(locale, "watchlist.empty")}</div>
        ) : (
          <ul className="drawer-list">
            {items
              .slice()
              .reverse()
              .map((item) => (
                <li key={item.id} className="drawer-row">
                  <button
                    type="button"
                    className="drawer-row-main"
                    onClick={() => restore(item)}
                  >
                    <strong>{item.label}</strong>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </button>
                  <button
                    type="button"
                    className="drawer-row-action"
                    onClick={() => remove(item.id)}
                    aria-label={tt(locale, "watchlist.remove")}
                  >
                    ×
                  </button>
                </li>
              ))}
          </ul>
        )}
        {items.length > 0 ? (
          <footer className="drawer-foot">
            <button type="button" className="button ghost small" onClick={clearAll}>
              {tt(locale, "watchlist.clear")}
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
