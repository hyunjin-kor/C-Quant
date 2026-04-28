import { describe, it, expect, vi } from "vitest";
import { createTtlCache } from "../electron/cache.js";

describe("createTtlCache", () => {
  it("returns the cached value within ttl", async () => {
    const cache = createTtlCache();
    const loader = vi.fn(async () => "fresh");
    const first = await cache.withCache("k", 1000, loader);
    const second = await cache.withCache("k", 1000, loader);
    expect(first).toBe("fresh");
    expect(second).toBe("fresh");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after ttl expires", async () => {
    vi.useFakeTimers();
    try {
      const cache = createTtlCache();
      let i = 0;
      const loader = async () => `v-${++i}`;
      const a = await cache.withCache("k", 100, loader);
      vi.advanceTimersByTime(150);
      const b = await cache.withCache("k", 100, loader);
      expect(a).toBe("v-1");
      expect(b).toBe("v-2");
    } finally {
      vi.useRealTimers();
    }
  });

  it("evicts the oldest entry when full", async () => {
    const cache = createTtlCache({ maxEntries: 3 });
    await cache.withCache("a", 60_000, async () => 1);
    await cache.withCache("b", 60_000, async () => 2);
    await cache.withCache("c", 60_000, async () => 3);
    await cache.withCache("d", 60_000, async () => 4);
    expect(cache.size()).toBe(3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("d")).toBeDefined();
  });

  it("prunes expired before evicting", async () => {
    vi.useFakeTimers();
    try {
      const cache = createTtlCache({ maxEntries: 2 });
      await cache.withCache("short", 50, async () => "old");
      await cache.withCache("long", 60_000, async () => "fresh");
      vi.advanceTimersByTime(100);
      await cache.withCache("new", 60_000, async () => "new");
      expect(cache.get("short")).toBeUndefined();
      expect(cache.get("long")).toBeDefined();
      expect(cache.get("new")).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not cache loader errors", async () => {
    const cache = createTtlCache();
    const loader = vi.fn(async () => {
      throw new Error("boom");
    });
    await expect(cache.withCache("k", 1000, loader)).rejects.toThrow("boom");
    expect(cache.size()).toBe(0);
  });
});
