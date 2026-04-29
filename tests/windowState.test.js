import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createWindowStateStore } from "../electron/windowState.js";

let tempDir;
let statePath;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "cquant-winstate-"));
  statePath = join(tempDir, "window-state.json");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const display = (workArea = { x: 0, y: 0, width: 1920, height: 1080 }) => ({ workArea });

describe("getInitialBounds", () => {
  it("falls back to defaults when no state exists", () => {
    const store = createWindowStateStore({ statePath, defaults: {} });
    const bounds = store.getInitialBounds({
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      displays: [display()]
    });
    expect(bounds.width).toBeGreaterThanOrEqual(980);
    expect(bounds.height).toBeGreaterThanOrEqual(680);
    expect(bounds.maximized).toBe(false);
  });

  it("restores saved bounds when display still covers them", () => {
    writeFileSync(
      statePath,
      JSON.stringify({ x: 200, y: 100, width: 1280, height: 800, maximized: true })
    );
    const store = createWindowStateStore({ statePath, defaults: {} });
    const bounds = store.getInitialBounds({
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      displays: [display()]
    });
    expect(bounds.x).toBe(200);
    expect(bounds.y).toBe(100);
    expect(bounds.width).toBe(1280);
    expect(bounds.height).toBe(800);
    expect(bounds.maximized).toBe(true);
  });

  it("rejects bounds that no longer overlap any display", () => {
    writeFileSync(
      statePath,
      JSON.stringify({ x: 9000, y: 9000, width: 1280, height: 800, maximized: false })
    );
    const store = createWindowStateStore({ statePath, defaults: {} });
    const bounds = store.getInitialBounds({
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      displays: [display()]
    });
    // fell back to centered defaults
    expect(bounds.x).not.toBe(9000);
    expect(bounds.maximized).toBe(false);
  });

  it("clamps absurd width/height", () => {
    writeFileSync(
      statePath,
      JSON.stringify({ x: 0, y: 0, width: 99999, height: 99999, maximized: false })
    );
    const store = createWindowStateStore({ statePath, defaults: {} });
    const bounds = store.getInitialBounds({
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      displays: [display()]
    });
    expect(bounds.width).toBeLessThanOrEqual(4000);
    expect(bounds.height).toBeLessThanOrEqual(4000);
  });
});

describe("persist via mock window", () => {
  it("writes the file on track + emit", () => {
    const store = createWindowStateStore({ statePath, defaults: {} });
    const handlers = {};
    const fakeWindow = {
      isDestroyed: () => false,
      isMaximized: () => false,
      getBounds: () => ({ x: 50, y: 60, width: 1100, height: 700 }),
      getNormalBounds: () => ({ x: 50, y: 60, width: 1100, height: 700 }),
      on: (event, handler) => {
        handlers[event] = handler;
      }
    };
    store.track(fakeWindow);
    store.persist(fakeWindow);
    expect(existsSync(statePath)).toBe(true);
    const persisted = JSON.parse(readFileSync(statePath, "utf8"));
    expect(persisted.width).toBe(1100);
  });
});
