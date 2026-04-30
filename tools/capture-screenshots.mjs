#!/usr/bin/env node
/**
 * Real screenshot capture for the README and USAGE guide.
 *
 * Launches the packaged-equivalent renderer in Electron via Playwright,
 * walks through the four surfaces in both themes, opens the command
 * palette and the watchlist drawer, and saves PNGs to docs/images/.
 *
 * Run with:
 *   npm run build       # so dist/ is ready
 *   npm run capture     # this script
 *
 * The script intentionally pre-seeds localStorage so the renderer mounts
 * deterministically (English locale, light theme, command surface).
 */

import { _electron as electron } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(".");
const OUT_DIR = join(REPO_ROOT, "docs", "images");
const VIEWPORT = { width: 1440, height: 900 };
const RENDER_SETTLE_MS = 4500; // Time for live source IPC + chart renders to settle.

mkdirSync(OUT_DIR, { recursive: true });

function log(...args) {
  console.log("[capture]", ...args);
}

async function seedAndReload(window, { theme, locale, surface, market }) {
  // Seed both localStorage (for first paint) AND the bridge-backed settings
  // store (so the loadAppSettings hydration effect doesn't override us).
  await window.evaluate(
    async ({ theme, locale, surface, market }) => {
      try {
        if (theme) window.localStorage.setItem("cquant:theme", theme);
        if (locale) window.localStorage.setItem("cquant:locale", locale);
        if (surface) window.localStorage.setItem("cquant:surface", surface);
        if (market) window.localStorage.setItem("cquant:market", market);
      } catch {
        // ignore
      }
      const bridge = window.desktopBridge;
      if (bridge && bridge.saveAppSettings) {
        try {
          await bridge.saveAppSettings({ theme, locale, surface, market });
        } catch {
          // ignore
        }
      }
    },
    { theme, locale, surface, market }
  );
  await window.reload();
  await window.waitForLoadState("domcontentloaded");
  await window.waitForSelector("#root .app-shell", { timeout: 15_000 });
  await window.waitForTimeout(RENDER_SETTLE_MS);
}

async function snap(window, name) {
  const file = join(OUT_DIR, `${name}.png`);
  await window.screenshot({ path: file, fullPage: false });
  log(`saved ${name}.png`);
}

async function main() {
  log(`launching Electron from ${REPO_ROOT}`);
  const electronApp = await electron.launch({
    args: [REPO_ROOT],
    env: {
      ...process.env,
      NODE_ENV: "production",
      CQUANT_DISABLE_UPDATER: "1",
      CQUANT_OPEN_DEVTOOLS: "0",
      // Bypass the Vite dev server lookup; load the production dist/.
      CQUANT_LOAD_DIST: "1"
    }
  });

  try {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    await window.setViewportSize(VIEWPORT);
    await window.waitForSelector("#root .app-shell", { timeout: 30_000 });

    log("renderer mounted");

    // 1. Light · Command surface (cover image)
    await seedAndReload(window, {
      theme: "light",
      locale: "en",
      surface: "command",
      market: "k-ets"
    });
    await snap(window, "shot-command-light");

    // 2. Light · Desk
    await seedAndReload(window, {
      theme: "light",
      locale: "en",
      surface: "desk",
      market: "k-ets"
    });
    await snap(window, "shot-desk-light");

    // 3. Light · Drivers
    await seedAndReload(window, {
      theme: "light",
      locale: "en",
      surface: "drivers",
      market: "k-ets"
    });
    await snap(window, "shot-drivers-light");

    // 4. Light · Sources
    await seedAndReload(window, {
      theme: "light",
      locale: "en",
      surface: "sources",
      market: "k-ets"
    });
    await snap(window, "shot-sources-light");

    // 5. Dark · Command (for the side-by-side)
    await seedAndReload(window, {
      theme: "dark",
      locale: "en",
      surface: "command",
      market: "k-ets"
    });
    await snap(window, "shot-command-dark");

    // 5b. Light · Command in Korean (bilingual preview)
    await seedAndReload(window, {
      theme: "light",
      locale: "ko",
      surface: "command",
      market: "k-ets"
    });
    await snap(window, "shot-command-light-ko");

    // 6. Cmd+K palette opened (light)
    await seedAndReload(window, {
      theme: "light",
      locale: "en",
      surface: "command",
      market: "k-ets"
    });
    await window.keyboard.press("Control+K");
    await window.waitForSelector(".cmdk-overlay", { timeout: 5_000 });
    await window.waitForTimeout(400);
    await window.keyboard.type("theme", { delay: 30 });
    await window.waitForTimeout(400);
    await snap(window, "shot-cmd-k");
    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);

    // 7. Watchlist drawer with one pinned view (light)
    log("seeding a watchlist entry via the bridge");
    await window.evaluate(async () => {
      const bridge = window.desktopBridge;
      if (bridge && bridge.watchlistAdd) {
        await bridge.watchlistAdd({
          id: "command-k-ets-demo",
          label: "K-ETS · command",
          marketId: "k-ets",
          surface: "command",
          createdAt: new Date().toISOString()
        });
      }
    });
    // open palette → "Open watchlist"
    await window.keyboard.press("Control+K");
    await window.waitForSelector(".cmdk-overlay", { timeout: 5_000 });
    await window.keyboard.type("Open watchlist", { delay: 30 });
    await window.waitForTimeout(400);
    await window.keyboard.press("Enter");
    await window.waitForSelector(".drawer-overlay", { timeout: 5_000 });
    await window.waitForTimeout(500);
    await snap(window, "shot-watchlist-drawer");
    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);

    log("all captures complete");
  } catch (error) {
    console.error("[capture] failed:", error);
    process.exitCode = 1;
  } finally {
    await electronApp.close();
  }
}

void main();
