import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createSettingsStore,
  DEFAULTS,
  normalize
} from "../electron/appSettings.js";

let tempDir;
let filePath;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "cquant-settings-"));
  filePath = join(tempDir, "settings.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("normalize", () => {
  it("rejects unknown theme values", () => {
    expect(normalize({ theme: "neon" }).theme).toBe(DEFAULTS.theme);
  });

  it("rejects unknown locales", () => {
    expect(normalize({ locale: "fr" }).locale).toBe(DEFAULTS.locale);
  });

  it("forces booleans for reducedMotion", () => {
    expect(normalize({ reducedMotion: "yes" }).reducedMotion).toBe(false);
    expect(normalize({ reducedMotion: true }).reducedMotion).toBe(true);
  });

  it("clamps surface and market strings", () => {
    const long = "a".repeat(100);
    const out = normalize({ surface: long, market: long });
    expect(out.surface.length).toBe(32);
    expect(out.market.length).toBe(32);
  });
});

describe("createSettingsStore", () => {
  it("returns defaults when no file exists", async () => {
    const store = createSettingsStore({ filePath });
    const settings = await store.load();
    expect(settings.theme).toBe(DEFAULTS.theme);
    expect(settings.locale).toBe(DEFAULTS.locale);
    expect(existsSync(filePath)).toBe(false);
  });

  it("merges partial saves with current state", async () => {
    const store = createSettingsStore({ filePath });
    await store.save({ theme: "dark" });
    const second = await store.save({ locale: "en" });
    expect(second.theme).toBe("dark");
    expect(second.locale).toBe("en");

    const persisted = JSON.parse(readFileSync(filePath, "utf8"));
    expect(persisted.theme).toBe("dark");
    expect(persisted.locale).toBe("en");
  });

  it("recovers from invalid JSON on disk", async () => {
    writeFileSync(filePath, "{ this is not json", "utf8");
    const store = createSettingsStore({ filePath });
    const settings = await store.load();
    expect(settings.theme).toBe(DEFAULTS.theme);
  });

  it("ignores malicious values via normalize on save", async () => {
    const store = createSettingsStore({ filePath });
    const next = await store.save({ theme: "::evil::", locale: "de" });
    expect(next.theme).toBe(DEFAULTS.theme);
    expect(next.locale).toBe(DEFAULTS.locale);
  });
});
