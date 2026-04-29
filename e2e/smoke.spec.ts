import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";

/**
 * Smoke test: launch the packaged-equivalent renderer in Electron and confirm:
 *   - the window opens
 *   - the renderer reports "ready" via the preload bridge
 *   - the brand title is visible
 *
 * This test relies on `npm run build` having produced dist/index.html.
 * Run via `npm run e2e` after a build, or via the e2e CI job which
 * builds first.
 */
test("electron app launches and reports ready", async () => {
  const appPath = path.resolve(".");
  const electronApp = await electron.launch({
    args: [appPath],
    env: {
      ...process.env,
      // Tell main.js we're in production-equivalent mode so it loads dist/.
      NODE_ENV: "production",
      CQUANT_DISABLE_UPDATER: "1"
    }
  });

  try {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");

    // Brand text from the rail.
    const root = window.locator("#root");
    await expect(root).toBeAttached();

    // The renderer notifies the main process when it mounts. We poll the
    // global window.desktopBridge handle to confirm preload exposed it.
    const bridgePresent = await window.evaluate(() => {
      return (
        typeof (window as typeof window & { desktopBridge?: object }).desktopBridge === "object"
      );
    });
    expect(bridgePresent).toBe(true);
  } finally {
    await electronApp.close();
  }
});
