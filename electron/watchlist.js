"use strict";

/**
 * Persistent watchlist store for pinned market views.
 *
 * Schema (versioned):
 *   {
 *     version: 1,
 *     items: [
 *       { id, label, marketId, surface, quoteId?, createdAt }
 *     ]
 *   }
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const SCHEMA_VERSION = 1;
const MAX_ITEMS = 64;
const MAX_LABEL_LEN = 120;
const MAX_ID_LEN = 64;

function isAllowedString(value, maxLen) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLen;
}

function normalizeItem(input) {
  if (!input || typeof input !== "object") return null;
  const id = String(input.id ?? "").trim();
  const label = String(input.label ?? "").trim();
  const marketId = String(input.marketId ?? "").trim();
  const surface = String(input.surface ?? "").trim();
  const quoteId = input.quoteId ? String(input.quoteId).trim() : "";
  const createdAt = String(input.createdAt ?? new Date().toISOString());

  if (!isAllowedString(id, MAX_ID_LEN)) return null;
  if (!isAllowedString(label, MAX_LABEL_LEN)) return null;
  if (!isAllowedString(marketId, 32)) return null;
  if (!isAllowedString(surface, 32)) return null;
  if (quoteId && quoteId.length > MAX_ID_LEN) return null;

  return { id, label, marketId, surface, quoteId: quoteId || undefined, createdAt };
}

function createWatchlistStore({ filePath }) {
  let cache = null;

  async function load() {
    if (cache) return cache;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.version === SCHEMA_VERSION && Array.isArray(parsed.items)) {
        cache = {
          version: SCHEMA_VERSION,
          items: parsed.items.map(normalizeItem).filter(Boolean).slice(0, MAX_ITEMS)
        };
      } else {
        cache = { version: SCHEMA_VERSION, items: [] };
      }
    } catch {
      cache = { version: SCHEMA_VERSION, items: [] };
    }
    return cache;
  }

  async function persist() {
    if (!cache) return;
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(cache, null, 2), "utf8");
    } catch {
      // best-effort
    }
  }

  async function add(item) {
    const normalized = normalizeItem(item);
    if (!normalized) {
      throw new Error("Watchlist item is invalid.");
    }
    const current = await load();
    const filtered = current.items.filter((entry) => entry.id !== normalized.id);
    filtered.push(normalized);
    if (filtered.length > MAX_ITEMS) {
      filtered.shift();
    }
    cache = { version: SCHEMA_VERSION, items: filtered };
    await persist();
    return cache;
  }

  async function remove(id) {
    const current = await load();
    cache = { version: SCHEMA_VERSION, items: current.items.filter((item) => item.id !== id) };
    await persist();
    return cache;
  }

  async function clear() {
    cache = { version: SCHEMA_VERSION, items: [] };
    await persist();
    return cache;
  }

  return { load, add, remove, clear };
}

module.exports = {
  createWatchlistStore,
  SCHEMA_VERSION,
  MAX_ITEMS,
  normalizeItem
};
