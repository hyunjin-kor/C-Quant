"use strict";

/**
 * Thin wrapper around electron-updater.
 *
 * Behavior:
 *   - In dev mode: every check resolves to "updates not available" without
 *     hitting the network.
 *   - In production: when CQUANT_DISABLE_UPDATER=1, updates are disabled
 *     entirely (useful for portable users who don't want background traffic).
 *   - Otherwise: configures the updater to read its release feed from
 *     GitHub releases of the repository declared in package.json.
 *
 * The updater never auto-downloads to keep behavior predictable. Users
 * trigger downloads explicitly via IPC.
 */

const logger = require("./logger");

let updaterInstance = null;
let lastStatus = { state: "idle", at: new Date().toISOString() };
let isPackaged = false;

function setStatus(next) {
  lastStatus = { ...next, at: new Date().toISOString() };
  logger.info("[auto-update]", lastStatus);
}

function isDisabled() {
  if (process.env.CQUANT_DISABLE_UPDATER === "1") return true;
  if (!isPackaged) return true;
  return false;
}

function getUpdater() {
  if (updaterInstance) return updaterInstance;
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.logger = {
      info: (...args) => logger.info("[updater]", ...args),
      warn: (...args) => logger.warn("[updater]", ...args),
      error: (...args) => logger.error("[updater]", ...args),
      debug: (...args) => logger.debug("[updater]", ...args)
    };

    autoUpdater.on("checking-for-update", () =>
      setStatus({ state: "checking" })
    );
    autoUpdater.on("update-available", (info) =>
      setStatus({ state: "available", version: info?.version || "" })
    );
    autoUpdater.on("update-not-available", (info) =>
      setStatus({ state: "up-to-date", version: info?.version || "" })
    );
    autoUpdater.on("download-progress", (progress) =>
      setStatus({
        state: "downloading",
        percent: Math.round(progress?.percent ?? 0),
        bytesPerSecond: progress?.bytesPerSecond ?? 0
      })
    );
    autoUpdater.on("update-downloaded", (info) =>
      setStatus({ state: "downloaded", version: info?.version || "" })
    );
    autoUpdater.on("error", (error) =>
      setStatus({ state: "error", error: error?.message || String(error) })
    );

    updaterInstance = autoUpdater;
    return autoUpdater;
  } catch (error) {
    logger.warn("electron-updater unavailable:", error);
    return null;
  }
}

function init({ packaged }) {
  isPackaged = !!packaged;
  if (isDisabled()) {
    setStatus({ state: "disabled" });
    return;
  }
  // Touch the updater so it registers handlers; actual checks are explicit.
  getUpdater();
}

async function checkForUpdates() {
  if (isDisabled()) {
    return { state: "disabled" };
  }
  const updater = getUpdater();
  if (!updater) {
    return { state: "unavailable" };
  }
  try {
    await updater.checkForUpdates();
    return lastStatus;
  } catch (error) {
    setStatus({ state: "error", error: error?.message || String(error) });
    return lastStatus;
  }
}

async function downloadUpdate() {
  if (isDisabled()) return { state: "disabled" };
  const updater = getUpdater();
  if (!updater) return { state: "unavailable" };
  try {
    await updater.downloadUpdate();
    return lastStatus;
  } catch (error) {
    setStatus({ state: "error", error: error?.message || String(error) });
    return lastStatus;
  }
}

function quitAndInstall() {
  if (isDisabled()) return { state: "disabled" };
  const updater = getUpdater();
  if (!updater) return { state: "unavailable" };
  if (lastStatus.state !== "downloaded") {
    return { state: lastStatus.state, error: "No update has been downloaded yet." };
  }
  try {
    updater.quitAndInstall();
    return { state: "installing" };
  } catch (error) {
    setStatus({ state: "error", error: error?.message || String(error) });
    return lastStatus;
  }
}

function getStatus() {
  return lastStatus;
}

module.exports = {
  init,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  getStatus
};
