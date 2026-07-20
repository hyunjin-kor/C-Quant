import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildSnapshot,
  computeSessionDelta,
  formatRelativeTime,
  loadSnapshot,
  saveSnapshot,
  type MarketSnapshot,
  type SessionSnapshot
} from "../src/lib/sessionSnapshot";

const STORAGE_KEY = "cquant:session-snapshot";

class MemoryStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(idx: number) {
    return Array.from(this.store.keys())[idx] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  const mem = new MemoryStorage() as unknown as Storage;
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: mem },
    configurable: true
  });
});

afterEach(() => {
  // @ts-expect-error — clean up
  delete globalThis.window;
});

describe("sessionSnapshot helpers", () => {
  it("loadSnapshot returns null when storage is empty", () => {
    expect(loadSnapshot()).toBeNull();
  });

  it("loadSnapshot returns null when stored JSON is malformed", () => {
    (window as unknown as { localStorage: Storage }).localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadSnapshot()).toBeNull();
  });

  it("loadSnapshot returns null when version is wrong", () => {
    (window as unknown as { localStorage: Storage }).localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, savedAt: "2026-05-07T00:00:00Z", markets: [] })
    );
    expect(loadSnapshot()).toBeNull();
  });

  it("saveSnapshot then loadSnapshot round-trips", () => {
    const markets: MarketSnapshot[] = [
      { id: "eu-ets", close: 75.34, asOf: "2026-05-07T00:00:00Z", freshnessLevel: "fresh" }
    ];
    const snap = buildSnapshot({ markets, activeScenarioIds: ["scenario-a"] });
    saveSnapshot(snap);
    const loaded = loadSnapshot();
    expect(loaded?.markets).toEqual(markets);
    expect(loaded?.activeScenarioIds).toEqual(["scenario-a"]);
    expect(loaded?.version).toBe(1);
  });

  it("buildSnapshot sorts active scenario IDs deterministically", () => {
    const snap = buildSnapshot({
      markets: [],
      activeScenarioIds: ["c", "a", "b"]
    });
    expect(snap.activeScenarioIds).toEqual(["a", "b", "c"]);
  });
});

describe("computeSessionDelta", () => {
  const baseMarkets: MarketSnapshot[] = [
    { id: "eu-ets", close: 100, asOf: "2026-05-06T00:00:00Z", freshnessLevel: "fresh" },
    { id: "k-ets", close: 14000, asOf: "2026-05-06T00:00:00Z", freshnessLevel: "fresh" }
  ];

  const previous: SessionSnapshot = {
    version: 1,
    savedAt: "2026-05-06T00:00:00Z",
    markets: baseMarkets,
    activeScenarioIds: ["pattern-a"]
  };

  it("returns null when there is no previous snapshot", () => {
    const current = buildSnapshot({ markets: baseMarkets, activeScenarioIds: [] });
    expect(computeSessionDelta(null, current)).toBeNull();
  });

  it("computes percent change correctly when price moves", () => {
    const current = buildSnapshot({
      markets: [
        { id: "eu-ets", close: 110, asOf: "2026-05-07T00:00:00Z", freshnessLevel: "fresh" },
        { id: "k-ets", close: 13720, asOf: "2026-05-07T00:00:00Z", freshnessLevel: "fresh" }
      ],
      activeScenarioIds: []
    });
    const delta = computeSessionDelta(previous, current);
    expect(delta).not.toBeNull();
    const eu = delta!.perMarket.find((m) => m.id === "eu-ets")!;
    expect(eu.pctChange).toBeCloseTo(10);
    expect(eu.absChange).toBeCloseTo(10);
    const kr = delta!.perMarket.find((m) => m.id === "k-ets")!;
    expect(kr.pctChange).toBeCloseTo(-2);
  });

  it("flags freshness changes", () => {
    const current = buildSnapshot({
      markets: [
        { id: "eu-ets", close: 100, asOf: "2026-05-07T00:00:00Z", freshnessLevel: "stale" },
        baseMarkets[1]
      ],
      activeScenarioIds: []
    });
    const delta = computeSessionDelta(previous, current);
    const eu = delta!.perMarket.find((m) => m.id === "eu-ets")!;
    expect(eu.freshnessChanged).toBe(true);
    expect(eu.fromFreshness).toBe("fresh");
    expect(eu.toFreshness).toBe("stale");
  });

  it("detects newly fired and cleared scenario IDs", () => {
    const current = buildSnapshot({
      markets: baseMarkets,
      activeScenarioIds: ["pattern-b", "pattern-c"]
    });
    const delta = computeSessionDelta(previous, current);
    expect(delta!.newlyFiredScenarioIds.sort()).toEqual(["pattern-b", "pattern-c"]);
    expect(delta!.clearedScenarioIds).toEqual(["pattern-a"]);
  });

  it("marks isQuiet when nothing meaningful moved", () => {
    const current = buildSnapshot({
      markets: baseMarkets,
      activeScenarioIds: ["pattern-a"]
    });
    const delta = computeSessionDelta(previous, current);
    expect(delta!.isQuiet).toBe(true);
  });

  it("isQuiet is false when any market moves >= 0.05%", () => {
    const current = buildSnapshot({
      markets: [
        { id: "eu-ets", close: 100.06, asOf: "2026-05-07T00:00:00Z", freshnessLevel: "fresh" },
        baseMarkets[1]
      ],
      activeScenarioIds: ["pattern-a"]
    });
    const delta = computeSessionDelta(previous, current);
    expect(delta!.isQuiet).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for sub-minute deltas", () => {
    const now = new Date("2026-05-07T12:00:00Z");
    expect(formatRelativeTime("2026-05-07T11:59:30Z", now)).toBe("just now");
  });

  it("uses 'min ago' for under an hour", () => {
    const now = new Date("2026-05-07T12:00:00Z");
    expect(formatRelativeTime("2026-05-07T11:30:00Z", now)).toBe("30 min ago");
  });

  it("uses 'h ago' for under a day", () => {
    const now = new Date("2026-05-07T12:00:00Z");
    expect(formatRelativeTime("2026-05-07T07:00:00Z", now)).toBe("5h ago");
  });

  it("falls back to a calendar label for >= 24 hours", () => {
    const now = new Date("2026-05-07T12:00:00Z");
    const label = formatRelativeTime("2026-05-05T08:00:00Z", now);
    // Locale-dependent format; just confirm it includes day digits
    expect(label).toMatch(/[0-9]/);
  });
});
