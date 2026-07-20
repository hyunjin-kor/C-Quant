import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAlertsStore,
  evaluateFreshness,
  evaluatePriceJump,
  normalizeRule
} from "../electron/alerts.js";

let tempDir;
let filePath;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "cquant-alerts-"));
  filePath = join(tempDir, "alerts.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("normalizeRule", () => {
  function base() {
    return {
      id: "rule-1",
      kind: "freshness",
      name: "EU stale > 6h",
      marketId: "eu-ets",
      maxAgeMinutes: 360,
      cooldownMinutes: 90
    };
  }

  it("accepts a valid rule", () => {
    const out = normalizeRule(base());
    expect(out.id).toBe("rule-1");
    expect(out.enabled).toBe(true);
    expect(out.cooldownMinutes).toBe(90);
  });

  it("rejects unknown kinds", () => {
    expect(normalizeRule({ ...base(), kind: "price" })).toBeNull();
  });

  it("rejects unknown markets", () => {
    expect(normalizeRule({ ...base(), marketId: "us-rggi" })).toBeNull();
  });

  it("rejects non-positive maxAgeMinutes", () => {
    expect(normalizeRule({ ...base(), maxAgeMinutes: 0 })).toBeNull();
    expect(normalizeRule({ ...base(), maxAgeMinutes: -10 })).toBeNull();
    expect(normalizeRule({ ...base(), maxAgeMinutes: 1.5 })).toBeNull();
  });

  it("rejects bad ids", () => {
    expect(normalizeRule({ ...base(), id: "../etc" })).toBeNull();
    expect(normalizeRule({ ...base(), id: "" })).toBeNull();
  });
});

describe("createAlertsStore", () => {
  it("returns empty list when file does not exist", async () => {
    const store = createAlertsStore({ filePath });
    const data = await store.load();
    expect(data.rules).toEqual([]);
  });

  it("adds, dedupes by id, persists", async () => {
    const store = createAlertsStore({ filePath });
    await store.add({
      id: "x",
      kind: "freshness",
      name: "v1",
      marketId: "k-ets",
      maxAgeMinutes: 60
    });
    const after = await store.add({
      id: "x",
      kind: "freshness",
      name: "v2",
      marketId: "k-ets",
      maxAgeMinutes: 90
    });
    expect(after.rules).toHaveLength(1);
    expect(after.rules[0].name).toBe("v2");
  });

  it("toggles enabled flag", async () => {
    const store = createAlertsStore({ filePath });
    await store.add({
      id: "y",
      kind: "freshness",
      name: "n",
      marketId: "eu-ets",
      maxAgeMinutes: 60
    });
    const after = await store.setEnabled("y", false);
    expect(after.rules[0].enabled).toBe(false);
  });

  it("marks fired updates lastFiredAt", async () => {
    const store = createAlertsStore({ filePath });
    await store.add({
      id: "z",
      kind: "freshness",
      name: "n",
      marketId: "cn-ets",
      maxAgeMinutes: 30
    });
    const stamp = "2026-04-30T01:23:00.000Z";
    const after = await store.markFired("z", stamp);
    expect(after.rules[0].lastFiredAt).toBe(stamp);
  });

  it("removes by id", async () => {
    const store = createAlertsStore({ filePath });
    await store.add({
      id: "a",
      kind: "freshness",
      name: "A",
      marketId: "k-ets",
      maxAgeMinutes: 60
    });
    const after = await store.remove("a");
    expect(after.rules).toEqual([]);
  });
});

describe("evaluateFreshness", () => {
  const now = new Date("2026-04-30T12:00:00Z");
  const stale = "2026-04-30T05:00:00Z"; // 7h ago
  const fresh = "2026-04-30T11:50:00Z"; // 10m ago

  it("triggers when card age exceeds maxAgeMinutes", () => {
    const triggered = evaluateFreshness({
      rules: [
        {
          id: "r",
          kind: "freshness",
          name: "EU > 6h",
          marketId: "eu-ets",
          maxAgeMinutes: 360,
          enabled: true,
          cooldownMinutes: 60,
          lastFiredAt: ""
        }
      ],
      payload: { cards: [{ marketId: "eu-ets", asOf: stale, sourceName: "EEX" }] },
      now
    });
    expect(triggered).toHaveLength(1);
    expect(triggered[0].ageMinutes).toBe(420);
  });

  it("does not trigger when fresh enough", () => {
    const triggered = evaluateFreshness({
      rules: [
        {
          id: "r",
          kind: "freshness",
          name: "EU > 6h",
          marketId: "eu-ets",
          maxAgeMinutes: 360,
          enabled: true,
          cooldownMinutes: 60,
          lastFiredAt: ""
        }
      ],
      payload: { cards: [{ marketId: "eu-ets", asOf: fresh, sourceName: "EEX" }] },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("respects cooldown after firing", () => {
    const triggered = evaluateFreshness({
      rules: [
        {
          id: "r",
          kind: "freshness",
          name: "EU > 6h",
          marketId: "eu-ets",
          maxAgeMinutes: 360,
          enabled: true,
          cooldownMinutes: 60,
          lastFiredAt: "2026-04-30T11:30:00Z" // 30m ago, within cooldown
        }
      ],
      payload: { cards: [{ marketId: "eu-ets", asOf: stale }] },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("ignores disabled rules", () => {
    const triggered = evaluateFreshness({
      rules: [
        {
          id: "r",
          kind: "freshness",
          name: "EU > 6h",
          marketId: "eu-ets",
          maxAgeMinutes: 360,
          enabled: false,
          cooldownMinutes: 60,
          lastFiredAt: ""
        }
      ],
      payload: { cards: [{ marketId: "eu-ets", asOf: stale }] },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("returns empty when payload has no cards for the market", () => {
    const triggered = evaluateFreshness({
      rules: [
        {
          id: "r",
          kind: "freshness",
          name: "K-ETS > 6h",
          marketId: "k-ets",
          maxAgeMinutes: 360,
          enabled: true,
          cooldownMinutes: 60,
          lastFiredAt: ""
        }
      ],
      payload: { cards: [{ marketId: "eu-ets", asOf: stale }] },
      now
    });
    expect(triggered).toEqual([]);
  });
});

describe("normalizeRule (price-jump)", () => {
  function base() {
    return {
      id: "pj-1",
      kind: "price-jump",
      name: "K-ETS proxy ±5%",
      marketId: "k-ets",
      thresholdPercent: 5,
      lookbackSessions: 5,
      cooldownMinutes: 720
    };
  }

  it("accepts a valid price-jump rule", () => {
    const rule = normalizeRule(base());
    expect(rule).not.toBeNull();
    expect(rule.kind).toBe("price-jump");
    expect(rule.thresholdPercent).toBe(5);
    expect(rule.lookbackSessions).toBe(5);
    expect(rule.maxAgeMinutes).toBeUndefined();
  });

  it("defaults lookbackSessions to 5", () => {
    const rule = normalizeRule({ ...base(), lookbackSessions: undefined });
    expect(rule?.lookbackSessions).toBe(5);
  });

  it("rejects out-of-range thresholds", () => {
    expect(normalizeRule({ ...base(), thresholdPercent: 0.1 })).toBeNull();
    expect(normalizeRule({ ...base(), thresholdPercent: 80 })).toBeNull();
    expect(normalizeRule({ ...base(), thresholdPercent: Number.NaN })).toBeNull();
  });

  it("rejects out-of-range lookback", () => {
    expect(normalizeRule({ ...base(), lookbackSessions: 0 })).toBeNull();
    expect(normalizeRule({ ...base(), lookbackSessions: 40 })).toBeNull();
  });
});

describe("evaluatePriceJump", () => {
  const now = new Date("2026-07-20T12:00:00Z");

  function rule(overrides = {}) {
    return {
      id: "pj",
      kind: "price-jump",
      name: "K-ETS proxy ±5%",
      marketId: "k-ets",
      thresholdPercent: 5,
      lookbackSessions: 5,
      enabled: true,
      cooldownMinutes: 720,
      lastFiredAt: "",
      ...overrides
    };
  }

  function quote(closes, overrides = {}) {
    return {
      id: "krbn-proxy",
      title: "KRBN carbon ETF",
      status: "connected",
      markets: ["k-ets", "shared"],
      series: closes.map((close, index) => ({ date: `2026-07-${10 + index}`, close })),
      ...overrides
    };
  }

  it("fires when the move exceeds the threshold", () => {
    const closes = [30, 30, 30, 30, 30, 30, 32]; // +6.7% over 5 sessions
    const triggered = evaluatePriceJump({
      rules: [rule()],
      payload: { liveQuotes: [quote(closes)] },
      now
    });
    expect(triggered).toHaveLength(1);
    expect(triggered[0].movePercent).toBeCloseTo(6.7, 1);
    expect(triggered[0].message).toContain("KRBN");
  });

  it("stays quiet under the threshold", () => {
    const closes = [30, 30, 30, 30, 30, 30, 30.9]; // +3%
    const triggered = evaluatePriceJump({
      rules: [rule()],
      payload: { liveQuotes: [quote(closes)] },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("fires on downside moves too", () => {
    const closes = [30, 30, 30, 30, 30, 30, 28]; // -6.7%
    const triggered = evaluatePriceJump({
      rules: [rule()],
      payload: { liveQuotes: [quote(closes)] },
      now
    });
    expect(triggered).toHaveLength(1);
    expect(triggered[0].movePercent).toBeLessThan(0);
  });

  it("skips error quotes and other markets", () => {
    const closes = [30, 30, 30, 30, 30, 30, 32];
    const triggered = evaluatePriceJump({
      rules: [rule()],
      payload: {
        liveQuotes: [quote(closes, { status: "error" }), quote(closes, { markets: ["eu-ets"] })]
      },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("respects the cooldown window", () => {
    const closes = [30, 30, 30, 30, 30, 30, 32];
    const triggered = evaluatePriceJump({
      rules: [rule({ lastFiredAt: "2026-07-20T06:00:00Z" })], // 6h ago < 720m
      payload: { liveQuotes: [quote(closes)] },
      now
    });
    expect(triggered).toEqual([]);
  });

  it("skips series shorter than the lookback", () => {
    const triggered = evaluatePriceJump({
      rules: [rule()],
      payload: { liveQuotes: [quote([30, 32])] },
      now
    });
    expect(triggered).toEqual([]);
  });
});
