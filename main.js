const {
  app,
  BrowserWindow,
  crashReporter,
  dialog,
  ipcMain,
  shell,
  screen,
  session
} = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

const { getConnectedSources, getLiveQuoteHistory } = require("./electron/liveSources");
const security = require("./electron/security");
const logger = require("./electron/logger");
const { createTtlCache: _createTtlCache } = require("./electron/cache");
const { createWindowStateStore } = require("./electron/windowState");
const { createSettingsStore } = require("./electron/appSettings");

const isDev = !app.isPackaged;
const RENDERER_STARTUP_TIMEOUT_MS = isDev ? 15000 : 8000;

let mainWindow = null;
let startupWatchdog = null;
let windowStateStore = null;
let settingsStore = null;
const rendererStartupState = new Map();

const escapeHtml = security.escapeHtml;
const normalizeExternalUrl = security.normalizeExternalUrl;
const sanitizeQuoteHistoryPayload = security.sanitizeQuoteHistoryPayload;

function getStartupLogPath() {
  try {
    return path.join(app.getPath("userData"), "logs", "startup-diagnostics.log");
  } catch {
    return "";
  }
}

function appendStartupDiagnostic(label, detail) {
  const logPath = getStartupLogPath();
  if (!logPath) {
    return;
  }

  const timestamp = new Date().toISOString();
  const message = String(detail ?? "").trim();
  const record = `[${timestamp}] ${label}\n${message}\n\n`;
  void fs
    .mkdir(path.dirname(logPath), { recursive: true })
    .then(() => fs.appendFile(logPath, record, "utf8"))
    .catch(() => {});
}

function getRendererEntryPath() {
  return path.resolve(path.join(__dirname, "dist", "index.html"));
}

function isTrustedAppUrl(value) {
  return security.isTrustedAppUrl(value, {
    isDev,
    rendererEntryPath: getRendererEntryPath()
  });
}

function assertTrustedSender(event) {
  const senderUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || "";
  if (!isTrustedAppUrl(senderUrl)) {
    throw new Error(`Blocked IPC from untrusted renderer: ${senderUrl || "unknown"}`);
  }
}

function showFallbackPage(window, title, detail) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const safeTitle = escapeHtml(title);
  const safeDetail = escapeHtml(detail);
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <style>
          body {
            margin: 0;
            font-family: "Segoe UI", "Noto Sans KR", system-ui, sans-serif;
            background: #faf9f5;
            color: #1f1815;
          }
          .wrap {
            max-width: 760px;
            margin: 64px auto;
            padding: 0 24px;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e7dfcf;
            border-radius: 22px;
            padding: 28px;
            box-shadow: 0 14px 36px rgba(46, 30, 19, 0.08);
          }
          h1 { margin: 0 0 12px; font-size: 28px; letter-spacing: -0.02em; }
          p { margin: 0 0 12px; line-height: 1.6; color: #3a2e26; }
          pre {
            margin: 16px 0 0;
            padding: 16px;
            overflow: auto;
            background: #f5f1e8;
            border-radius: 14px;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="card">
            <h1>${safeTitle}</h1>
            <p>C-Quant desktop could not render its main screen.</p>
            <p>Restart the app. If the problem repeats, share the message below.</p>
            <pre>${safeDetail}</pre>
          </div>
        </div>
      </body>
    </html>
  `;

  void window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function revealWindow(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  if (!window.isVisible()) {
    window.show();
  }

  if (typeof window.moveTop === "function") {
    window.moveTop();
  }

  window.focus();
}

function fitWindowToVisibleArea(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const display = screen.getDisplayMatching(window.getBounds());
  const area = display.workArea;
  const bounds = window.getBounds();
  const width = Math.min(bounds.width, area.width);
  const height = Math.min(bounds.height, area.height);
  const x = Math.max(area.x, Math.min(bounds.x, area.x + area.width - width));
  const y = Math.max(area.y, Math.min(bounds.y, area.y + area.height - height));

  if (
    bounds.x !== x ||
    bounds.y !== y ||
    bounds.width !== width ||
    bounds.height !== height
  ) {
    window.setBounds({ x, y, width, height }, true);
  }
}

function clearStartupWatchdog() {
  if (startupWatchdog) {
    clearTimeout(startupWatchdog);
    startupWatchdog = null;
  }
}

function normalizeRendererStartupFailure(payload) {
  const phase =
    String(payload?.phase ?? "renderer-startup").trim().slice(0, 120) || "renderer-startup";
  const message = String(payload?.message ?? "Unknown renderer startup error.").trim().slice(0, 2000);
  const stack = String(payload?.stack ?? "").trim().slice(0, 8000);
  return { phase, message, stack };
}

function getRendererStartupDetail(payload) {
  return payload.stack
    ? `[${payload.phase}] ${payload.message}\n\n${payload.stack}`
    : `[${payload.phase}] ${payload.message}`;
}

function showStartupFailure(window, title, detail, options = {}) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const showDialog = options.showDialog !== false;

  clearStartupWatchdog();
  fitWindowToVisibleArea(window);
  window.setTitle(title);
  appendStartupDiagnostic(title, detail);
  logger.error(title, detail);

  if (showDialog) {
    dialog.showErrorBox(title, detail);
  }

  showFallbackPage(window, title, detail);
  revealWindow(window);
}

function setRendererStartupState(window, partial) {
  if (!window || window.isDestroyed()) {
    return null;
  }

  const key = window.webContents.id;
  const current = rendererStartupState.get(key) ?? { ready: false };
  const next = { ...current, ...partial };
  rendererStartupState.set(key, next);
  return next;
}

function getRendererStartupState(window) {
  if (!window || window.isDestroyed()) {
    return null;
  }

  return rendererStartupState.get(window.webContents.id) ?? null;
}

function clearRendererStartupState(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  rendererStartupState.delete(window.webContents.id);
}

function armStartupWatchdog(window) {
  clearStartupWatchdog();
  startupWatchdog = setTimeout(() => {
    if (!window || window.isDestroyed()) {
      createWindow();
      return;
    }

    const startup = getRendererStartupState(window);
    if (startup?.ready) {
      fitWindowToVisibleArea(window);
      revealWindow(window);
      return;
    }

    showStartupFailure(
      window,
      "C-Quant renderer startup timed out",
      "The window loaded but the renderer never confirmed startup. This usually means a boot error happened before the React app mounted.",
      { showDialog: false }
    );
  }, RENDERER_STARTUP_TIMEOUT_MS);
}

function getWindowIconPath() {
  return path.join(__dirname, "assets", "app-icon.png");
}

function hardenWindow(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      void shell.openExternal(normalizeExternalUrl(url));
    } catch (error) {
      logger.warn("Blocked window-open for invalid URL:", error);
    }

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    if (isTrustedAppUrl(navigationUrl)) {
      return;
    }

    event.preventDefault();

    try {
      void shell.openExternal(normalizeExternalUrl(navigationUrl));
    } catch (error) {
      logger.warn("Blocked navigation to invalid URL:", error);
    }
  });

  window.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  const { session: windowSession } = window.webContents;
  windowSession.setPermissionCheckHandler(() => false);
  windowSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

function applyContentSecurityPolicy(targetSession) {
  const headerValue = security.buildContentSecurityPolicy({ isDev });
  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...(details.responseHeaders || {}) };
    delete responseHeaders["content-security-policy"];
    delete responseHeaders["Content-Security-Policy"];
    responseHeaders["Content-Security-Policy"] = [headerValue];
    callback({ responseHeaders });
  });
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    revealWindow(mainWindow);
    return mainWindow;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const displays = screen.getAllDisplays();

  const initial = windowStateStore?.getInitialBounds({ workArea, displays }) ?? {
    width: Math.min(1560, Math.max(1200, workArea.width - 80)),
    height: Math.min(980, Math.max(760, workArea.height - 80)),
    x: Math.round(workArea.x + (workArea.width - 1320) / 2),
    y: Math.round(workArea.y + (workArea.height - 880) / 2),
    maximized: false
  };

  const window = new BrowserWindow({
    x: initial.x,
    y: initial.y,
    width: initial.width,
    height: initial.height,
    minWidth: 980,
    minHeight: 680,
    title: "C-Quant",
    icon: getWindowIconPath(),
    center: false,
    frame: true,
    thickFrame: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    resizable: true,
    show: false,
    backgroundColor: "#faf9f5",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
      spellcheck: false
    }
  });

  mainWindow = window;
  hardenWindow(window);
  setRendererStartupState(window, { ready: false });

  if (initial.maximized) {
    window.maximize();
  }

  windowStateStore?.track(window);

  armStartupWatchdog(window);

  window.once("ready-to-show", () => {
    fitWindowToVisibleArea(window);
  });
  window.webContents.once("did-finish-load", () => {
    fitWindowToVisibleArea(window);
  });
  window.once("show", () => {
    window.setAlwaysOnTop(true);
    setTimeout(() => {
      if (!window.isDestroyed()) {
        window.setAlwaysOnTop(false);
        revealWindow(window);
      }
    }, 600);
  });
  window.on("show", () => {
    fitWindowToVisibleArea(window);
  });
  window.on("closed", () => {
    clearStartupWatchdog();
    clearRendererStartupState(window);
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    showStartupFailure(
      window,
      "C-Quant failed to load",
      `The desktop window could not load its UI.\n\nCode: ${errorCode}\nMessage: ${errorDescription}`
    );
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    showStartupFailure(
      window,
      "C-Quant renderer stopped",
      `The app window stopped unexpectedly.\n\nReason: ${details.reason}`
    );
  });

  window.on("unresponsive", () => {
    showStartupFailure(
      window,
      "C-Quant stopped responding",
      "The app window became unresponsive during startup.",
      { showDialog: false }
    );
  });

  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      logger.error(`[renderer:${level}] ${sourceId || "unknown"}:${line || 0} ${message}`);
      appendStartupDiagnostic(
        `renderer-console:${level}`,
        `${sourceId || "unknown"}:${line || 0} ${message}`
      );
    }
  });

  if (isDev) {
    window.loadURL("http://localhost:5173");
    if (process.env.CQUANT_OPEN_DEVTOOLS === "1") {
      window.webContents.openDevTools({ mode: "detach" });
    }
    return window;
  }

  window.loadFile(path.join(__dirname, "dist", "index.html"));
  return window;
}

ipcMain.handle("window-minimize", (event) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

ipcMain.handle("window-toggle-maximize", (event) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return false;
  }
  if (window.isMaximized()) {
    window.unmaximize();
    return false;
  }
  window.maximize();
  return true;
});

ipcMain.handle("window-close", (event) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

ipcMain.handle("window-is-maximized", (event) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.isMaximized() ?? false;
});

ipcMain.handle("open-external", async (event, url) => {
  assertTrustedSender(event);
  return shell.openExternal(normalizeExternalUrl(url));
});

ipcMain.handle("refresh-connected-sources", async (event) => {
  assertTrustedSender(event);
  return getConnectedSources();
});

ipcMain.handle("get-live-quote-history", async (event, payload) => {
  assertTrustedSender(event);
  const request = sanitizeQuoteHistoryPayload(payload);
  return getLiveQuoteHistory(request.quoteId, request.range);
});

ipcMain.handle("get-app-settings", async (event) => {
  assertTrustedSender(event);
  return settingsStore?.load() ?? null;
});

ipcMain.handle("save-app-settings", async (event, partial) => {
  assertTrustedSender(event);
  return settingsStore?.save(partial ?? {}) ?? null;
});

ipcMain.on("renderer-ready", (event) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return;
  }

  setRendererStartupState(window, { ready: true });
  clearStartupWatchdog();
  fitWindowToVisibleArea(window);
  window.setTitle("C-Quant");
  revealWindow(window);
});

ipcMain.on("renderer-startup-failed", (event, payload) => {
  assertTrustedSender(event);
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) {
    return;
  }

  const startup = getRendererStartupState(window);
  const failure = normalizeRendererStartupFailure(payload);
  logger.error(`[renderer-startup] ${failure.phase}: ${failure.message}`);
  if (failure.stack) {
    logger.error(failure.stack);
  }
  appendStartupDiagnostic(
    `renderer-startup:${failure.phase}`,
    getRendererStartupDetail(failure)
  );

  if (startup?.ready) {
    return;
  }

  showStartupFailure(window, "C-Quant renderer startup failed", getRendererStartupDetail(failure), {
    showDialog: false
  });
});

function setupCrashReporter() {
  try {
    crashReporter.start({
      productName: "C-Quant",
      companyName: "C-Quant",
      submitURL: "",
      uploadToServer: false,
      ignoreSystemCrashHandler: false,
      compress: true
    });
  } catch (error) {
    logger.warn("Failed to start crash reporter:", error);
  }
}

function setupProcessHandlers() {
  process.on("uncaughtException", (error) => {
    logger.error("[uncaughtException]", error);
    appendStartupDiagnostic("uncaughtException", error?.stack || error?.message || String(error));
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("[unhandledRejection]", reason);
    appendStartupDiagnostic(
      "unhandledRejection",
      reason instanceof Error ? reason.stack || reason.message : String(reason)
    );
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("C-Quant");

  // 1) Initialize file logger first so subsequent failures get captured.
  const userData = app.getPath("userData");
  logger.setActiveLogger(logger.createLogger({ logDir: path.join(userData, "logs") }));
  logger.info("C-Quant starting", {
    isDev,
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    node: process.versions.node
  });

  // 2) Process-level safety nets.
  setupProcessHandlers();
  setupCrashReporter();

  // 3) Persistence stores (window state + user settings).
  windowStateStore = createWindowStateStore({
    statePath: path.join(userData, "window-state.json"),
    defaults: { minWidth: 980, minHeight: 680, maxWidth: 1560, maxHeight: 980 }
  });
  settingsStore = createSettingsStore({
    filePath: path.join(userData, "settings.json")
  });

  // 4) Inject strict CSP via the session, no <meta> needed.
  applyContentSecurityPolicy(session.defaultSession);

  // 5) Open the main window.
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }
    fitWindowToVisibleArea(mainWindow);
    revealWindow(mainWindow);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
