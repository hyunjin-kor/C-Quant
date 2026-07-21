"use strict";

/**
 * User-facing app settings persisted to <userData>/settings.json.
 *
 * Values exposed here are user preferences that should survive across
 * launches but are not security-sensitive. Anything in this file should
 * be safe for the renderer to read and write.
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const ALLOWED_THEMES = new Set(["light", "dark", "system"]);
const ALLOWED_LOCALES = new Set(["ko", "en"]);

const DEFAULTS = {
  theme: "light",
  locale: "ko",
  reducedMotion: false,
  surface: "command",
  market: "k-ets",
  analyticsEnabled: false,
  firstRunCompletedAt: "",
  runInTray: true,
  notificationsEnabled: true
};

function pickString(value, allowed, fallback) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return allowed.has(candidate) ? candidate : fallback;
}

function pickBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function normalize(input = {}) {
  return {
    theme: pickString(input.theme, ALLOWED_THEMES, DEFAULTS.theme),
    locale: pickString(input.locale, ALLOWED_LOCALES, DEFAULTS.locale),
    reducedMotion: pickBoolean(input.reducedMotion, DEFAULTS.reducedMotion),
    surface: typeof input.surface === "string" ? input.surface.slice(0, 32) : DEFAULTS.surface,
    market: typeof input.market === "string" ? input.market.slice(0, 32) : DEFAULTS.market,
    analyticsEnabled: pickBoolean(input.analyticsEnabled, DEFAULTS.analyticsEnabled),
    firstRunCompletedAt:
      typeof input.firstRunCompletedAt === "string"
        ? input.firstRunCompletedAt.slice(0, 64)
        : DEFAULTS.firstRunCompletedAt,
    runInTray: pickBoolean(input.runInTray, DEFAULTS.runInTray),
    notificationsEnabled: pickBoolean(input.notificationsEnabled, DEFAULTS.notificationsEnabled)
  };
}

function createSettingsStore({ filePath }) {
  let cached = null;

  async function load() {
    if (cached) return cached;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      cached = normalize(parsed);
    } catch {
      cached = { ...DEFAULTS };
    }
    return cached;
  }

  async function save(partial) {
    const current = await load();
    const next = normalize({ ...current, ...partial });
    cached = next;
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(next, null, 2), "utf8");
    } catch {
      // best-effort persistence
    }
    return next;
  }

  return { load, save, defaults: { ...DEFAULTS } };
}

module.exports = {
  createSettingsStore,
  DEFAULTS,
  ALLOWED_THEMES,
  ALLOWED_LOCALES,
  normalize
};
