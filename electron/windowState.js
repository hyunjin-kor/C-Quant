"use strict";

/**
 * Persist the main window's bounds + maximized state across launches.
 *
 *   const state = createWindowStateStore({ statePath, defaultBounds });
 *   const bounds = state.getInitialBounds(workArea);
 *   state.track(window);
 */

const fs = require("node:fs");
const path = require("node:path");

const MIN_WIDTH = 980;
const MIN_HEIGHT = 680;
const MAX_RESONABLE_WIDTH = 4000;
const MAX_RESONABLE_HEIGHT = 4000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function load(statePath) {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function save(statePath, state) {
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // best-effort
  }
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function rectIntersects(a, b) {
  return !(
    a.x + a.width <= b.x ||
    a.y + a.height <= b.y ||
    a.x >= b.x + b.width ||
    a.y >= b.y + b.height
  );
}

function isOnAnyDisplay(bounds, displays) {
  return displays.some((d) => rectIntersects(bounds, d.workArea));
}

function defaultBoundsForWorkArea(workArea, defaults) {
  const width = clamp(
    Math.round(workArea.width - 80),
    defaults.minWidth ?? MIN_WIDTH,
    defaults.maxWidth ?? 1560
  );
  const height = clamp(
    Math.round(workArea.height - 80),
    defaults.minHeight ?? MIN_HEIGHT,
    defaults.maxHeight ?? 980
  );
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + (workArea.height - height) / 2);
  return { x, y, width, height };
}

function createWindowStateStore({ statePath, defaults = {} }) {
  let saved = load(statePath);

  function getInitialBounds({ workArea, displays }) {
    const fallback = defaultBoundsForWorkArea(workArea, defaults);

    if (
      !saved ||
      !isFiniteNumber(saved.x) ||
      !isFiniteNumber(saved.y) ||
      !isFiniteNumber(saved.width) ||
      !isFiniteNumber(saved.height)
    ) {
      return { ...fallback, maximized: false };
    }

    const candidate = {
      x: Math.round(saved.x),
      y: Math.round(saved.y),
      width: clamp(Math.round(saved.width), defaults.minWidth ?? MIN_WIDTH, MAX_RESONABLE_WIDTH),
      height: clamp(
        Math.round(saved.height),
        defaults.minHeight ?? MIN_HEIGHT,
        MAX_RESONABLE_HEIGHT
      )
    };

    // Reject bounds that don't overlap any current display (e.g. the user
    // unplugged a monitor or moved the laptop to a different setup).
    if (!isOnAnyDisplay(candidate, displays)) {
      return { ...fallback, maximized: false };
    }

    return { ...candidate, maximized: !!saved.maximized };
  }

  function persist(window) {
    if (!window || window.isDestroyed()) return;
    const isMaximized = window.isMaximized();
    // When maximized, save the *normal* bounds so the next launch isn't full-screen.
    const bounds = isMaximized ? window.getNormalBounds() : window.getBounds();
    saved = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: isMaximized
    };
    save(statePath, saved);
  }

  function track(window) {
    if (!window || window.isDestroyed()) return;

    let timer = null;
    const schedulePersist = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => persist(window), 250);
    };

    window.on("resize", schedulePersist);
    window.on("move", schedulePersist);
    window.on("maximize", () => persist(window));
    window.on("unmaximize", () => persist(window));
    window.on("close", () => {
      if (timer) clearTimeout(timer);
      persist(window);
    });
  }

  return { getInitialBounds, track, persist };
}

module.exports = { createWindowStateStore, MIN_WIDTH, MIN_HEIGHT };
