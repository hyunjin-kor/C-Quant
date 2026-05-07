/**
 * Session snapshot — "since you last opened the app, here's what changed".
 *
 * Honest scope:
 * - Persists a tiny JSON blob to renderer-side localStorage when the
 *   Command surface mounts with usable market data.
 * - Compares the previous snapshot (if any) against the current one to
 *   produce a SessionDelta the surface renders as a thin strip.
 * - Does NOT persist anything except market close prices, freshness
 *   levels, and active scenario IDs at one point in time. No PII.
 * - The snapshot is overwritten once per app open — that's the
 *   "baseline shifts forward" semantics for the next session.
 */

const STORAGE_KEY = "cquant:session-snapshot";
const SCHEMA_VERSION = 1;

export type MarketSnapshot = {
  id: string;
  /** Numeric close at snapshot time, or null if no parseable price. */
  close: number | null;
  /** Anchor card asOf timestamp (ISO) or null. */
  asOf: string | null;
  /** "fresh" | "watch" | "stale" | "" */
  freshnessLevel: string;
};

export type SessionSnapshot = {
  version: number;
  savedAt: string; // ISO timestamp
  markets: MarketSnapshot[];
  activeScenarioIds: string[];
};

export type MarketDelta = {
  id: string;
  /** Percent change from previous close to current close, or null. */
  pctChange: number | null;
  /** Absolute price change, or null. */
  absChange: number | null;
  freshnessChanged: boolean;
  fromFreshness: string | null;
  toFreshness: string | null;
};

export type SessionDelta = {
  /** When the previous snapshot was saved (ISO). */
  previousSavedAt: string;
  /** Compact human label like "2 hours ago" / "yesterday at 17:34". */
  relativeTimeLabel: string;
  perMarket: MarketDelta[];
  /** Scenario IDs newly active vs the previous snapshot. */
  newlyFiredScenarioIds: string[];
  /** Scenario IDs that were active before but no longer are. */
  clearedScenarioIds: string[];
  /** True when no observable change worth surfacing. */
  isQuiet: boolean;
};

function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadSnapshot(): SessionSnapshot | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== SCHEMA_VERSION ||
      !Array.isArray(parsed.markets) ||
      typeof parsed.savedAt !== "string"
    ) {
      return null;
    }
    return parsed as SessionSnapshot;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: SessionSnapshot): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota exceeded or disabled — the feature degrades gracefully.
  }
}

export function buildSnapshot(input: {
  markets: MarketSnapshot[];
  activeScenarioIds: string[];
  now?: Date;
}): SessionSnapshot {
  const now = input.now ?? new Date();
  return {
    version: SCHEMA_VERSION,
    savedAt: now.toISOString(),
    markets: input.markets,
    activeScenarioIds: [...input.activeScenarioIds].sort()
  };
}

/** Format a saved-at timestamp into a compact "since when" label. */
export function formatRelativeTime(savedAtIso: string, now: Date): string {
  const past = new Date(savedAtIso);
  if (Number.isNaN(past.getTime())) return savedAtIso;
  const ms = now.getTime() - past.getTime();
  if (ms < 0) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  // Otherwise show calendar day + time, locale-neutral
  const sameYear = past.getFullYear() === now.getFullYear();
  const dateLabel = sameYear
    ? past.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : past.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const timeLabel = past.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${dateLabel} ${timeLabel}`;
}

/**
 * Compute the delta between the previous and current snapshot.
 * Returns null when there's no previous snapshot to compare.
 */
export function computeSessionDelta(
  previous: SessionSnapshot | null,
  current: SessionSnapshot,
  now: Date = new Date()
): SessionDelta | null {
  if (!previous) return null;

  const previousMarketsById = new Map(previous.markets.map((m) => [m.id, m]));

  const perMarket: MarketDelta[] = current.markets.map((curr) => {
    const prev = previousMarketsById.get(curr.id) ?? null;
    let pctChange: number | null = null;
    let absChange: number | null = null;
    if (prev?.close != null && curr.close != null && prev.close > 0) {
      absChange = curr.close - prev.close;
      pctChange = (absChange / prev.close) * 100;
    }
    const freshnessChanged =
      prev != null && prev.freshnessLevel !== "" && curr.freshnessLevel !== ""
        ? prev.freshnessLevel !== curr.freshnessLevel
        : false;
    return {
      id: curr.id,
      pctChange,
      absChange,
      freshnessChanged,
      fromFreshness: prev?.freshnessLevel ?? null,
      toFreshness: curr.freshnessLevel || null
    };
  });

  const prevActive = new Set(previous.activeScenarioIds);
  const currActive = new Set(current.activeScenarioIds);
  const newlyFiredScenarioIds = current.activeScenarioIds.filter((id) => !prevActive.has(id));
  const clearedScenarioIds = previous.activeScenarioIds.filter((id) => !currActive.has(id));

  const anyPriceMove = perMarket.some(
    (m) => m.pctChange != null && Math.abs(m.pctChange) >= 0.05
  );
  const anyFreshnessChange = perMarket.some((m) => m.freshnessChanged);
  const anyPatternChange =
    newlyFiredScenarioIds.length > 0 || clearedScenarioIds.length > 0;

  return {
    previousSavedAt: previous.savedAt,
    relativeTimeLabel: formatRelativeTime(previous.savedAt, now),
    perMarket,
    newlyFiredScenarioIds,
    clearedScenarioIds,
    isQuiet: !anyPriceMove && !anyFreshnessChange && !anyPatternChange
  };
}
