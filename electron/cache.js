"use strict";

/**
 * Lightweight TTL + LRU cache used by the live-source loaders.
 *
 * Behavior:
 *   - Each entry has its own TTL. On read, expired entries return undefined.
 *   - When the cache reaches `maxEntries`, expired entries are pruned first;
 *     if the cache is still full, the oldest entry (insertion order) is evicted.
 *   - Failed loaders do not cache (errors propagate).
 */

const DEFAULT_MAX_ENTRIES = 256;

function createTtlCache({ maxEntries = DEFAULT_MAX_ENTRIES } = {}) {
  const store = new Map();

  function pruneExpired(now) {
    for (const [key, entry] of store) {
      if (now - entry.fetchedAt >= entry.ttlMs) {
        store.delete(key);
      }
    }
  }

  function evictOldestIfFull() {
    while (store.size >= maxEntries) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      store.delete(oldestKey);
    }
  }

  async function withCache(key, ttlMs, loader) {
    const now = Date.now();
    const cached = store.get(key);

    if (cached && now - cached.fetchedAt < cached.ttlMs) {
      return cached.value;
    }

    if (cached) {
      store.delete(key);
    }

    const value = await loader();

    if (store.size >= maxEntries) {
      pruneExpired(Date.now());
      evictOldestIfFull();
    }

    store.set(key, {
      fetchedAt: Date.now(),
      ttlMs,
      value
    });
    return value;
  }

  return {
    withCache,
    get: (key) => store.get(key),
    has: (key) => store.has(key),
    delete: (key) => store.delete(key),
    clear: () => store.clear(),
    size: () => store.size,
    pruneExpired
  };
}

module.exports = { createTtlCache, DEFAULT_MAX_ENTRIES };
