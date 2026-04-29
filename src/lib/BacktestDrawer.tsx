import { useCallback, useEffect, useState } from "react";
import { getBridge, type BacktestSummary } from "./desktopBridge";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { tt } from "./i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BacktestDrawer({ open, onClose }: Props) {
  const { locale } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState<BacktestSummary[]>([]);

  const reload = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge?.backtestList) return;
    try {
      const data = await bridge.backtestList();
      setItems(data ?? []);
    } catch {
      setItems([]);
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

  async function load(id: string) {
    const bridge = getBridge();
    if (!bridge?.backtestLoad) return;
    try {
      const record = await bridge.backtestLoad(id);
      if (record) {
        toast.push({
          tone: "success",
          title: `Loaded ${id}`,
          description: `Saved ${record.savedAt}`
        });
      }
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Load failed",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function remove(id: string) {
    const bridge = getBridge();
    if (!bridge?.backtestRemove) return;
    try {
      await bridge.backtestRemove(id);
      await reload();
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Backtest archive"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2>{tt(locale, "backtest.title")}</h2>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        {items.length === 0 ? (
          <div className="drawer-empty">{tt(locale, "backtest.empty")}</div>
        ) : (
          <ul className="drawer-list">
            {items.map((item) => (
              <li key={item.id} className="drawer-row">
                <button
                  type="button"
                  className="drawer-row-main"
                  onClick={() => load(item.id)}
                >
                  <strong>{item.id}</strong>
                  <span>
                    {tt(locale, "backtest.savedAt", {
                      at: new Date(item.savedAt).toLocaleString()
                    })}
                    {" · "}
                    {tt(locale, "backtest.bytes", { n: item.bytes })}
                  </span>
                </button>
                <button
                  type="button"
                  className="drawer-row-action"
                  onClick={() => remove(item.id)}
                  aria-label={tt(locale, "backtest.remove")}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
