"use strict";

/**
 * Persistent backtest archive at <userData>/backtests/.
 *
 * Each backtest is a separate JSON file named by id (`<id>.json`). The
 * directory is enumerated on `list()` so the renderer can lazily load
 * detail rather than holding everything in memory.
 *
 * IDs must match /^[a-z0-9-]{1,64}$/i — same shape as quote IDs.
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const ID_PATTERN = /^[a-z0-9-]{1,64}$/i;
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB per backtest

function assertValidId(id) {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    throw new Error("Backtest id is invalid.");
  }
}

function createBacktestStore({ rootDir }) {
  async function ensureRoot() {
    await fs.mkdir(rootDir, { recursive: true });
  }

  async function save(id, payload) {
    assertValidId(id);
    if (!payload || typeof payload !== "object") {
      throw new Error("Backtest payload is invalid.");
    }
    const serialized = JSON.stringify({
      id,
      savedAt: new Date().toISOString(),
      payload
    });
    if (Buffer.byteLength(serialized, "utf8") > MAX_PAYLOAD_BYTES) {
      throw new Error(`Backtest exceeds ${MAX_PAYLOAD_BYTES} bytes.`);
    }
    await ensureRoot();
    const file = path.join(rootDir, `${id}.json`);
    await fs.writeFile(file, serialized, "utf8");
    return { id, savedAt: new Date().toISOString(), bytes: Buffer.byteLength(serialized, "utf8") };
  }

  async function load(id) {
    assertValidId(id);
    const file = path.join(rootDir, `${id}.json`);
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  }

  async function list() {
    try {
      await ensureRoot();
      const files = await fs.readdir(rootDir);
      const summaries = [];
      for (const filename of files) {
        if (!filename.endsWith(".json")) continue;
        const id = filename.slice(0, -5);
        if (!ID_PATTERN.test(id)) continue;
        try {
          const stat = await fs.stat(path.join(rootDir, filename));
          summaries.push({
            id,
            savedAt: stat.mtime.toISOString(),
            bytes: stat.size
          });
        } catch {
          // skip unreadable
        }
      }
      summaries.sort((a, b) => (a.savedAt > b.savedAt ? -1 : 1));
      return summaries;
    } catch {
      return [];
    }
  }

  async function remove(id) {
    assertValidId(id);
    const file = path.join(rootDir, `${id}.json`);
    try {
      await fs.unlink(file);
      return true;
    } catch {
      return false;
    }
  }

  return { save, load, list, remove };
}

module.exports = { createBacktestStore, ID_PATTERN, MAX_PAYLOAD_BYTES };
