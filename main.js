const { app, BrowserWindow, dialog, ipcMain, shell, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { fileURLToPath } = require("node:url");
const { getConnectedSources, getLiveQuoteHistory } = require("./electron/liveSources");

const isDev = !app.isPackaged;
const TRUSTED_DEV_SERVER_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_QUOTE_RANGE_IDS = new Set(["1d", "5d", "1m", "3m", "6m", "1y"]);
const RENDERER_STARTUP_TIMEOUT_MS = isDev ? 15000 : 8000;
let mainWindow = null;
let startupWatchdog = null;
const rendererStartupState = new Map();

function getStartupLogPath() {
  try {
    return path.join(app.getPath("userData"), "startup-diagnostics.log");
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
  void fs.appendFile(logPath, record, "utf8").catch(() => {});
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character] || character
  );
}

function getRendererEntryPath() {
  return path.resolve(path.join(__dirname, "dist", "index.html"));
}

function isTrustedAppUrl(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return false;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "file:") {
      if (isDev) {
        return false;
      }
      return path.resolve(fileURLToPath(parsed)) === getRendererEntryPath();
    }

    return TRUSTED_DEV_SERVER_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}

function assertTrustedSender(event) {
  const senderUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || "";
  if (!isTrustedAppUrl(senderUrl)) {
    throw new Error(`Blocked IPC from untrusted renderer: ${senderUrl || "unknown"}`);
  }
}

function parseUrl(value, label) {
  const candidate = String(value ?? "").trim();

  try {
    return new URL(candidate);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
}

function normalizeExternalUrl(value) {
  const parsed = parseUrl(value, "External URL");
  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("Only http and https links can be opened from C-Quant.");
  }
  return parsed.toString();
}

function sanitizeQuoteHistoryPayload(payload) {
  const quoteId = String(payload?.quoteId ?? "").trim();
  const range = String(payload?.range ?? "3m").trim();

  if (!/^[a-z0-9-]{1,64}$/i.test(quoteId)) {
    throw new Error("Quote history request contains an invalid quote id.");
  }

  if (!ALLOWED_QUOTE_RANGE_IDS.has(range)) {
    throw new Error("Quote history request contains an invalid range id.");
  }

  return { quoteId, range };
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
            font-family: "Segoe UI", "Noto Sans KR", sans-serif;
            background: #f7f9fd;
            color: #111827;
          }
          .wrap {
            max-width: 760px;
            margin: 64px auto;
            padding: 0 24px;
          }
          .card {
            background: #ffffff;
            border: 1px solid #d9e1ef;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          }
          h1 { margin: 0 0 12px; font-size: 28px; }
          p { margin: 0 0 12px; line-height: 1.6; color: #445066; }
          pre {
            margin: 16px 0 0;
            padding: 16px;
            overflow: auto;
            background: #f3f6fb;
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
  const phase = String(payload?.phase ?? "renderer-startup").trim().slice(0, 120) || "renderer-startup";
  const message = String(payload?.message ?? "Unknown renderer startup error.").trim().slice(0, 2000);
  const stack = String(payload?.stack ?? "").trim().slice(0, 8000);
  return { phase, message, stack };
}

function getRendererStartupDetail(payload) {
  return payload.stack ? `[${payload.phase}] ${payload.message}\n\n${payload.stack}` : `[${payload.phase}] ${payload.message}`;
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
    } catch {}

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, navigationUrl) => {
    if (isTrustedAppUrl(navigationUrl)) {
      return;
    }

    event.preventDefault();

    try {
      void shell.openExternal(normalizeExternalUrl(navigationUrl));
    } catch {}
  });

  window.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  const { session } = window.webContents;
  session.setPermissionCheckHandler(() => false);
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    revealWindow(mainWindow);
    return mainWindow;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const width = Math.min(1560, Math.max(1200, workArea.width - 80));
  const height = Math.min(980, Math.max(760, workArea.height - 80));
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + (workArea.height - height) / 2);

  const window = new BrowserWindow({
    x,
    y,
    width,
    height,
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
    backgroundColor: "#f7f9fd",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false
    }
  });

  mainWindow = window;
  hardenWindow(window);
  setRendererStartupState(window, { ready: false });

  const reveal = () => revealWindow(window);
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
      console.error(`[renderer:${level}] ${sourceId || "unknown"}:${line || 0} ${message}`);
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
  console.error(`[renderer-startup] ${failure.phase}: ${failure.message}`);
  if (failure.stack) {
    console.error(failure.stack);
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

app.whenReady().then(() => {
  app.setAppUserModelId("C-Quant");
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
