import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWatchlistStore, normalizeItem } from "../electron/watchlist.js";

let tempDir;
let filePath;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "cquant-watchlist-"));
  filePath = join(tempDir, "watchlist.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("normalizeItem", () => {
  it("rejects items with missing fields", () => {
    expect(normalizeItem(null)).toBeNull();
    expect(normalizeItem({})).toBeNull();
    expect(normalizeItem({ id: "a" })).toBeNull();
    expect(normalizeItem({ id: "a", label: "L" })).toBeNull();
  });

  it("accepts a complete item", () => {
    const out = normalizeItem({
      id: "abc",
      label: "Label",
      marketId: "k-ets",
      surface: "desk"
    });
    expect(out).toMatchObject({ id: "abc", label: "Label", marketId: "k-ets" });
    expect(typeof out.createdAt).toBe("string");
  });

  it("trims whitespace", () => {
    const out = normalizeItem({
      id: "  trimmed  ",
      label: "  L  ",
      marketId: "  k-ets  ",
      surface: "  desk  "
    });
    expect(out.id).toBe("trimmed");
    expect(out.label).toBe("L");
  });
});

describe("createWatchlistStore", () => {
  it("returns an empty list when no file exists", async () => {
    const store = createWatchlistStore({ filePath });
    const data = await store.load();
    expect(data.items).toEqual([]);
  });

  it("adds, deduplicates by id, and persists", async () => {
    const store = createWatchlistStore({ filePath });
    await store.add({ id: "x", label: "first", marketId: "k-ets", surface: "desk" });
    await store.add({ id: "x", label: "second", marketId: "k-ets", surface: "desk" });
    const final = await store.add({ id: "y", label: "Y", marketId: "eu-ets", surface: "desk" });
    expect(final.items).toHaveLength(2);
    expect(final.items[0].label).toBe("second");

    const persisted = JSON.parse(readFileSync(filePath, "utf8"));
    expect(persisted.items).toHaveLength(2);
  });

  it("removes by id", async () => {
    const store = createWatchlistStore({ filePath });
    await store.add({ id: "a", label: "A", marketId: "k-ets", surface: "desk" });
    await store.add({ id: "b", label: "B", marketId: "eu-ets", surface: "desk" });
    const after = await store.remove("a");
    expect(after.items).toHaveLength(1);
    expect(after.items[0].id).toBe("b");
  });

  it("clears all", async () => {
    const store = createWatchlistStore({ filePath });
    await store.add({ id: "a", label: "A", marketId: "k-ets", surface: "desk" });
    const after = await store.clear();
    expect(after.items).toEqual([]);
  });

  it("recovers from invalid JSON on disk", async () => {
    writeFileSync(filePath, "{ this is not json", "utf8");
    const store = createWatchlistStore({ filePath });
    const data = await store.load();
    expect(data.items).toEqual([]);
  });
});
