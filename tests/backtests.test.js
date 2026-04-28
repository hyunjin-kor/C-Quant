import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBacktestStore } from "../electron/backtests.js";

let tempDir;
let rootDir;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "cquant-backtests-"));
  rootDir = join(tempDir, "backtests");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("createBacktestStore", () => {
  it("rejects bad ids", async () => {
    const store = createBacktestStore({ rootDir });
    await expect(store.save("../etc/passwd", { ok: true })).rejects.toThrow(/invalid/);
    await expect(store.save("a b c", { ok: true })).rejects.toThrow(/invalid/);
    await expect(store.save("", { ok: true })).rejects.toThrow(/invalid/);
  });

  it("rejects non-object payloads", async () => {
    const store = createBacktestStore({ rootDir });
    await expect(store.save("ok", null)).rejects.toThrow(/payload is invalid/);
    await expect(store.save("ok", "string")).rejects.toThrow(/payload is invalid/);
  });

  it("saves and loads round-trip", async () => {
    const store = createBacktestStore({ rootDir });
    await store.save("run-a", { stance: "buy", score: 0.78 });
    const loaded = await store.load("run-a");
    expect(loaded.id).toBe("run-a");
    expect(loaded.payload).toEqual({ stance: "buy", score: 0.78 });
    expect(typeof loaded.savedAt).toBe("string");
  });

  it("lists summaries newest first", async () => {
    const store = createBacktestStore({ rootDir });
    await store.save("alpha", { v: 1 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.save("bravo", { v: 2 });
    const list = await store.list();
    expect(list.map((r) => r.id)).toEqual(["bravo", "alpha"]);
  });

  it("removes by id", async () => {
    const store = createBacktestStore({ rootDir });
    await store.save("alpha", { v: 1 });
    expect(await store.remove("alpha")).toBe(true);
    expect(await store.remove("alpha")).toBe(false);
    expect(readdirSync(rootDir).filter((f) => f.endsWith(".json"))).toHaveLength(0);
  });
});
