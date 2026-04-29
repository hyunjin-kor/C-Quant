import { describe, it, expect, vi } from "vitest";
import { createTtlCache } from "../electron/cache.js";

describe("createTtlCache periodic prune", () => {
  it("expires entries on the prune interval without a fresh read", async () => {
    vi.useFakeTimers();
    try {
      const cache = createTtlCache({ pruneIntervalMs: 1000 });
      await cache.withCache("k", 50, async () => "v");
      expect(cache.size()).toBe(1);

      vi.advanceTimersByTime(100);
      // Periodic prune hasn't fired yet.
      expect(cache.size()).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(cache.size()).toBe(0);

      cache.stopPeriodicPrune();
    } finally {
      vi.useRealTimers();
    }
  });

  it("can be disabled by setting pruneIntervalMs to zero", async () => {
    vi.useFakeTimers();
    try {
      const cache = createTtlCache({ pruneIntervalMs: 0 });
      await cache.withCache("k", 50, async () => "v");
      vi.advanceTimersByTime(60_000);
      // Without a periodic timer, the entry hangs around even though it expired.
      expect(cache.size()).toBe(1);
      expect(cache.get("k")).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stopPeriodicPrune is idempotent", () => {
    const cache = createTtlCache({ pruneIntervalMs: 1000 });
    cache.stopPeriodicPrune();
    cache.stopPeriodicPrune();
  });
});
