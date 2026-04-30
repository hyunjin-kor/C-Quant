"use strict";

/**
 * Persistent alert rules + freshness evaluator.
 *
 * v1.1 supports a single rule kind: `freshness` — fires when the
 * official anchor for a given market exceeds `maxAgeMinutes`. Future
 * versions can add `priceThreshold`, `coverRatio`, etc.
 *
 * Rule shape:
 *   {
 *     id: string                 // [a-z0-9-]+, max 64
 *     kind: "freshness"
 *     name: string               // human-readable label
 *     marketId: "eu-ets" | "k-ets" | "cn-ets"
 *     maxAgeMinutes: number      // positive integer
 *     enabled: boolean
 *     createdAt: ISO string
 *     lastFiredAt: ISO string | ""
 *     cooldownMinutes: number    // wait this long between repeated fires
 *   }
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const SCHEMA_VERSION = 1;
const MAX_RULES = 32;
const ID_PATTERN = /^[a-z0-9-]+$/i;
const ALLOWED_MARKETS = new Set(["eu-ets", "k-ets", "cn-ets"]);
const ALLOWED_KINDS = new Set(["freshness"]);

function isPositiveInt(value) {
  return (
    typeof value === "number" && Number.isFinite(value) && value > 0 && value === Math.floor(value)
  );
}

function clampString(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeRule(input) {
  if (!input || typeof input !== "object") return null;
  const id = clampString(input.id, 64);
  const kind = clampString(input.kind, 32);
  const name = clampString(input.name, 120);
  const marketId = clampString(input.marketId, 32);
  const maxAgeMinutes = Number(input.maxAgeMinutes);
  const cooldownMinutes = Number(input.cooldownMinutes ?? 60);

  if (!id || !ID_PATTERN.test(id)) return null;
  if (!ALLOWED_KINDS.has(kind)) return null;
  if (!name) return null;
  if (!ALLOWED_MARKETS.has(marketId)) return null;
  if (!isPositiveInt(maxAgeMinutes)) return null;
  if (!isPositiveInt(cooldownMinutes)) return null;

  return {
    id,
    kind,
    name,
    marketId,
    maxAgeMinutes,
    enabled: input.enabled !== false,
    createdAt: clampString(input.createdAt, 64) || new Date().toISOString(),
    lastFiredAt: clampString(input.lastFiredAt, 64),
    cooldownMinutes
  };
}

function createAlertsStore({ filePath }) {
  let cache = null;

  async function load() {
    if (cache) return cache;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.version === SCHEMA_VERSION && Array.isArray(parsed.rules)) {
        cache = {
          version: SCHEMA_VERSION,
          rules: parsed.rules.map(normalizeRule).filter(Boolean).slice(0, MAX_RULES)
        };
      } else {
        cache = { version: SCHEMA_VERSION, rules: [] };
      }
    } catch {
      cache = { version: SCHEMA_VERSION, rules: [] };
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

  async function add(rule) {
    const normalized = normalizeRule(rule);
    if (!normalized) {
      throw new Error("Alert rule is invalid.");
    }
    const current = await load();
    const filtered = current.rules.filter((entry) => entry.id !== normalized.id);
    filtered.push(normalized);
    if (filtered.length > MAX_RULES) {
      filtered.shift();
    }
    cache = { version: SCHEMA_VERSION, rules: filtered };
    await persist();
    return cache;
  }

  async function remove(id) {
    const current = await load();
    cache = { version: SCHEMA_VERSION, rules: current.rules.filter((rule) => rule.id !== id) };
    await persist();
    return cache;
  }

  async function setEnabled(id, enabled) {
    const current = await load();
    cache = {
      version: SCHEMA_VERSION,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, enabled: !!enabled } : rule))
    };
    await persist();
    return cache;
  }

  async function markFired(id, when) {
    const current = await load();
    const stamp = clampString(when, 64) || new Date().toISOString();
    cache = {
      version: SCHEMA_VERSION,
      rules: current.rules.map((rule) => (rule.id === id ? { ...rule, lastFiredAt: stamp } : rule))
    };
    await persist();
    return cache;
  }

  async function clear() {
    cache = { version: SCHEMA_VERSION, rules: [] };
    await persist();
    return cache;
  }

  return { load, add, remove, setEnabled, markFired, clear };
}

/**
 * Evaluate every freshness rule against the connected-source payload.
 * Returns an array of triggered rules so the caller can fire one
 * notification per rule.
 *
 *   const triggered = evaluateFreshness({ rules, payload, now });
 */
function evaluateFreshness({ rules, payload, now = new Date() }) {
  if (!Array.isArray(rules)) return [];
  const cards = Array.isArray(payload?.cards) ? payload.cards : [];
  const triggered = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.kind !== "freshness") continue;

    const card = cards.find((entry) => entry?.marketId === rule.marketId);
    if (!card) continue;

    const asOf = card.asOf ? new Date(card.asOf) : null;
    if (!(asOf instanceof Date) || Number.isNaN(asOf.getTime())) continue;

    const ageMinutes = (now.getTime() - asOf.getTime()) / 60_000;
    if (ageMinutes < rule.maxAgeMinutes) continue;

    if (rule.lastFiredAt) {
      const last = new Date(rule.lastFiredAt);
      if (
        last instanceof Date &&
        !Number.isNaN(last.getTime()) &&
        (now.getTime() - last.getTime()) / 60_000 < rule.cooldownMinutes
      ) {
        continue;
      }
    }

    triggered.push({
      rule,
      card,
      ageMinutes: Math.round(ageMinutes),
      message: `${card.sourceName || rule.marketId.toUpperCase()} anchor is ${Math.round(
        ageMinutes
      )} minutes old (limit ${rule.maxAgeMinutes}m).`
    });
  }

  return triggered;
}

module.exports = {
  createAlertsStore,
  normalizeRule,
  evaluateFreshness,
  SCHEMA_VERSION,
  MAX_RULES,
  ALLOWED_KINDS,
  ALLOWED_MARKETS
};
