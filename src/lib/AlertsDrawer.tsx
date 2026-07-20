import { useCallback, useEffect, useState } from "react";
import { getBridge, type AlertRule, type AlertsPayload } from "./desktopBridge";
import { useTheme } from "./theme";
import { useToast } from "./toast";
import { tt } from "./i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

const MARKETS: Array<AlertRule["marketId"]> = ["eu-ets", "k-ets", "cn-ets"];
const PRESET_AGES: number[] = [60, 240, 720, 1440]; // minutes
const PRESET_MOVES: number[] = [2, 5, 10]; // percent over 5 sessions

function formatMarketLabel(market: AlertRule["marketId"]): string {
  return market === "eu-ets" ? "EU ETS" : market === "k-ets" ? "K-ETS" : "China ETS";
}

function formatAgeLabel(minutes: number): string {
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`;
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
  return `${minutes}m`;
}

export function AlertsDrawer({ open, onClose }: Props) {
  const { locale } = useTheme();
  const toast = useToast();
  const [payload, setPayload] = useState<AlertsPayload>({ version: 1, rules: [] });
  const [marketDraft, setMarketDraft] = useState<AlertRule["marketId"]>("k-ets");
  const [kindDraft, setKindDraft] = useState<AlertRule["kind"]>("freshness");
  const [ageDraft, setAgeDraft] = useState<number>(720);
  const [moveDraft, setMoveDraft] = useState<number>(5);

  const reload = useCallback(async () => {
    const bridge = getBridge();
    if (!bridge?.alertsLoad) return;
    try {
      const data = await bridge.alertsLoad();
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

  const rules = payload.rules ?? [];

  async function addRule() {
    const bridge = getBridge();
    if (!bridge?.alertsAdd) return;
    const base = {
      marketId: marketDraft,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastFiredAt: ""
    };
    const rule: AlertRule =
      kindDraft === "freshness"
        ? {
            ...base,
            id: `freshness-${marketDraft}-${ageDraft}-${Date.now().toString(36)}`,
            kind: "freshness",
            name: `${formatMarketLabel(marketDraft)} stale > ${formatAgeLabel(ageDraft)}`,
            maxAgeMinutes: ageDraft,
            cooldownMinutes: Math.max(60, Math.round(ageDraft / 4))
          }
        : {
            ...base,
            id: `price-jump-${marketDraft}-${moveDraft}-${Date.now().toString(36)}`,
            kind: "price-jump",
            name: `${formatMarketLabel(marketDraft)} proxy ±${moveDraft}%`,
            thresholdPercent: moveDraft,
            lookbackSessions: 5,
            cooldownMinutes: 720
          };
    try {
      const next = await bridge.alertsAdd(rule);
      setPayload(next);
      toast.push({
        tone: "success",
        title: tt(locale, "alerts.added.title"),
        description: rule.name
      });
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Alert error",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function remove(id: string) {
    const bridge = getBridge();
    if (!bridge?.alertsRemove) return;
    try {
      const next = await bridge.alertsRemove(id);
      setPayload(next);
    } catch {
      // ignore
    }
  }

  async function toggle(id: string, enabled: boolean) {
    const bridge = getBridge();
    if (!bridge?.alertsSetEnabled) return;
    try {
      const next = await bridge.alertsSetEnabled(id, enabled);
      setPayload(next);
    } catch {
      // ignore
    }
  }

  async function evaluateNow() {
    const bridge = getBridge();
    if (!bridge?.alertsEvaluateNow) return;
    try {
      await bridge.alertsEvaluateNow();
      toast.push({
        tone: "info",
        title: tt(locale, "alerts.evaluated.title"),
        description: tt(locale, "alerts.evaluated.body")
      });
      void reload();
    } catch (error) {
      toast.push({
        tone: "error",
        title: "Evaluate failed",
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Alerts"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="drawer-panel">
        <header className="drawer-head">
          <h2>{tt(locale, "alerts.title")}</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="alerts-builder">
          <div className="alerts-builder__row">
            <label>
              <span className="alerts-builder__label">{tt(locale, "alerts.market")}</span>
              <select
                value={marketDraft}
                onChange={(event) => setMarketDraft(event.target.value as AlertRule["marketId"])}
              >
                {MARKETS.map((market) => (
                  <option key={market} value={market}>
                    {formatMarketLabel(market)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="alerts-builder__label">{tt(locale, "alerts.kind")}</span>
              <select
                value={kindDraft}
                onChange={(event) => setKindDraft(event.target.value as AlertRule["kind"])}
              >
                <option value="freshness">{tt(locale, "alerts.kind.freshness")}</option>
                <option value="price-jump">{tt(locale, "alerts.kind.priceJump")}</option>
              </select>
            </label>
            {kindDraft === "freshness" ? (
              <label>
                <span className="alerts-builder__label">{tt(locale, "alerts.threshold")}</span>
                <select
                  value={ageDraft}
                  onChange={(event) => setAgeDraft(Number(event.target.value))}
                >
                  {PRESET_AGES.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatAgeLabel(minutes)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                <span className="alerts-builder__label">{tt(locale, "alerts.moveThreshold")}</span>
                <select
                  value={moveDraft}
                  onChange={(event) => setMoveDraft(Number(event.target.value))}
                >
                  {PRESET_MOVES.map((pct) => (
                    <option key={pct} value={pct}>
                      ±{pct}%
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="alerts-builder__actions">
            <button type="button" className="button primary small" onClick={addRule}>
              {tt(locale, "alerts.add")}
            </button>
            <button type="button" className="button ghost small" onClick={evaluateNow}>
              {tt(locale, "alerts.evaluate")}
            </button>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="drawer-empty">{tt(locale, "alerts.empty")}</div>
        ) : (
          <ul className="drawer-list">
            {rules.map((rule) => (
              <li key={rule.id} className="drawer-row">
                <div className="drawer-row-main" style={{ cursor: "default" }}>
                  <strong>{rule.name}</strong>
                  <span>
                    {formatMarketLabel(rule.marketId)} ·{" "}
                    {rule.kind === "price-jump"
                      ? tt(locale, "alerts.move", { pct: String(rule.thresholdPercent ?? 5) })
                      : tt(locale, "alerts.maxAge", {
                          age: formatAgeLabel(rule.maxAgeMinutes ?? 0)
                        })}
                    {rule.lastFiredAt
                      ? ` · ${tt(locale, "alerts.lastFired", {
                          at: new Date(rule.lastFiredAt).toLocaleString()
                        })}`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="drawer-row-action"
                  onClick={() => toggle(rule.id, !rule.enabled)}
                  aria-label={rule.enabled ? "Disable" : "Enable"}
                  title={rule.enabled ? "Disable" : "Enable"}
                  style={{ opacity: rule.enabled ? 1 : 0.45 }}
                >
                  {rule.enabled ? "●" : "○"}
                </button>
                <button
                  type="button"
                  className="drawer-row-action"
                  onClick={() => remove(rule.id)}
                  aria-label="Remove"
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
