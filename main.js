const { app, BrowserWindow, dialog, ipcMain, shell, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { fileURLToPath } = require("node:url");
const { getConnectedSources, getLiveQuoteHistory } = require("./electron/liveSources");
const {
  DEFAULT_OLLAMA_BASE_URL,
  listOllamaModels,
  runOllamaChat
} = require("./electron/decisionAssistant");

const isDev = !app.isPackaged;
const SETTINGS_FILENAME = "settings.json";
const DEFAULT_LOCAL_OLLAMA_MODEL = "granite3-dense:2b";
const TRUSTED_DEV_SERVER_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_LOCAL_SERVICE_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_LOCAL_SERVICE_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const ALLOWED_QUOTE_RANGE_IDS = new Set(["1d", "5d", "1m", "3m", "6m", "1y"]);
let mainWindow = null;
let startupWatchdog = null;

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

function normalizeLocalServiceUrl(value, label = "Local service URL") {
  const parsed = parseUrl(value || DEFAULT_OLLAMA_BASE_URL, label);
  const host = parsed.hostname.toLowerCase();

  if (!ALLOWED_LOCAL_SERVICE_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${label} must use http or https.`);
  }

  if (!ALLOWED_LOCAL_SERVICE_HOSTS.has(host)) {
    throw new Error(`${label} must stay on the local machine.`);
  }

  if ((parsed.pathname && parsed.pathname !== "/") || parsed.search || parsed.hash) {
    throw new Error(`${label} must point to a bare local origin without a path.`);
  }

  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function normalizeOllamaModel(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return "";
  }

  if (candidate.length > 120 || /[\r\n\t]/.test(candidate)) {
    throw new Error("Local model name is invalid.");
  }

  return candidate;
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

function armStartupWatchdog(window) {
  clearStartupWatchdog();
  startupWatchdog = setTimeout(() => {
    if (!window || window.isDestroyed()) {
      createWindow();
      return;
    }

    fitWindowToVisibleArea(window);
    revealWindow(window);
  }, isDev ? 7000 : 4000);
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
    show: true,
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

  const reveal = () => revealWindow(window);
  const fallbackTimer = setTimeout(reveal, isDev ? 5000 : 2500);
  armStartupWatchdog(window);

  window.once("ready-to-show", reveal);
  window.webContents.once("did-finish-load", reveal);
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
    clearTimeout(fallbackTimer);
    fitWindowToVisibleArea(window);
  });
  window.on("closed", () => {
    clearTimeout(fallbackTimer);
    clearStartupWatchdog();
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    clearTimeout(fallbackTimer);
    clearStartupWatchdog();
    dialog.showErrorBox(
      "C-Quant failed to load",
      `The desktop window could not load its UI.\n\nCode: ${errorCode}\nMessage: ${errorDescription}`
    );
    showFallbackPage(
      window,
      "C-Quant failed to load",
      `Code: ${errorCode}\nMessage: ${errorDescription}`
    );
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    clearTimeout(fallbackTimer);
    clearStartupWatchdog();
    dialog.showErrorBox(
      "C-Quant renderer stopped",
      `The app window stopped unexpectedly.\n\nReason: ${details.reason}`
    );
    showFallbackPage(window, "C-Quant renderer stopped", `Reason: ${details.reason}`);
  });

  window.on("unresponsive", () => {
    clearStartupWatchdog();
    showFallbackPage(
      window,
      "C-Quant stopped responding",
      "The app window became unresponsive during startup."
    );
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

function execFileAsync(command, args) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd: app.getAppPath(),
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

async function getSettingsPath() {
  return path.join(app.getPath("userData"), SETTINGS_FILENAME);
}

async function loadSettings() {
  const settingsPath = await getSettingsPath();

  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ollamaBaseUrl: normalizeLocalServiceUrl(parsed.ollamaBaseUrl, "Ollama base URL"),
      ollamaModel: normalizeOllamaModel(parsed.ollamaModel)
    };
  } catch {
    return {
      ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
      ollamaModel: ""
    };
  }
}

async function saveSettings(partial) {
  const current = await loadSettings();
  const next = {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(partial, "ollamaBaseUrl")
      ? {
          ollamaBaseUrl: normalizeLocalServiceUrl(
            partial.ollamaBaseUrl,
            "Ollama base URL"
          )
        }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(partial, "ollamaModel")
      ? { ollamaModel: normalizeOllamaModel(partial.ollamaModel) }
      : {})
  };

  const settingsPath = await getSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

async function findFirstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (!candidate || candidate === "ollama") {
      continue;
    }

    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }

  return "";
}

function getOllamaCliCandidates() {
  return [
    "ollama",
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama.exe"),
    path.join(process.env.ProgramFiles || "", "Ollama", "ollama.exe")
  ].filter((candidate, index, items) => candidate && items.indexOf(candidate) === index);
}

function getOllamaAppCandidates() {
  return [
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama app.exe"),
    path.join(process.env.ProgramFiles || "", "Ollama", "ollama app.exe")
  ].filter((candidate, index, items) => candidate && items.indexOf(candidate) === index);
}

async function getOllamaCliVersion() {
  for (const candidate of getOllamaCliCandidates()) {
    try {
      const stdout = await execFileAsync(candidate, ["--version"]);
      return String(stdout).trim();
    } catch {}
  }

  return "";
}

async function launchLocalOllama() {
  const appPath = await findFirstExistingPath(getOllamaAppCandidates());

  if (appPath) {
    const error = await shell.openPath(appPath);
    if (error) {
      throw new Error(error);
    }

    return {
      started: true,
      mode: "desktop-app",
      path: appPath
    };
  }

  const cliPath = await findFirstExistingPath(getOllamaCliCandidates());
  if (cliPath) {
    const child = execFile(cliPath, ["serve"], {
      cwd: app.getAppPath(),
      detached: true,
      windowsHide: true
    });
    child.unref();

    return {
      started: true,
      mode: "cli-serve",
      path: cliPath
    };
  }

  throw new Error("Ollama is not installed on this PC yet.");
}

async function getLocalLlmState(settings) {
  const baseUrl = normalizeLocalServiceUrl(
    settings?.ollamaBaseUrl,
    "Ollama base URL"
  );
  const savedModel = normalizeOllamaModel(settings?.ollamaModel);
  const cliVersion = await getOllamaCliVersion();
  const installed = Boolean(cliVersion);

  try {
    const models = await listOllamaModels(baseUrl);
    const recommendedModel = models.find(
      (entry) =>
        entry.model === DEFAULT_LOCAL_OLLAMA_MODEL ||
        entry.name === DEFAULT_LOCAL_OLLAMA_MODEL
    )?.model;
    const selectedModel =
      (savedModel && models.some((entry) => entry.model === savedModel || entry.name === savedModel)
        ? savedModel
        : recommendedModel || models[0]?.model) || "";

    return {
      available: models.length > 0,
      installed,
      reachable: true,
      cliVersion,
      baseUrl,
      selectedModel,
      models,
      ...(models.length === 0
        ? {
            error:
              "Ollama API is reachable but no local model is installed yet. Pull a model, then recheck."
          }
        : {})
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      available: false,
      installed,
      reachable: false,
      cliVersion,
      baseUrl,
      selectedModel: savedModel,
      models: [],
      error: installed
        ? `Ollama is installed but the local API at ${baseUrl} is not responding. Start Ollama and retry. Details: ${reason}`
        : "Ollama is not installed on this PC yet. Install Ollama for Windows, pull a local model, then retry."
    };
  }
}

async function resolveLocalOllamaTarget(payload) {
  const settings = await loadSettings();
  const baseUrl = normalizeLocalServiceUrl(
    typeof payload?.baseUrl === "string" && payload.baseUrl.trim()
      ? payload.baseUrl
      : settings.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
    "Ollama base URL"
  );
  const models = await listOllamaModels(baseUrl);
  const requestedModel = normalizeOllamaModel(
    typeof payload?.model === "string" && payload.model.trim()
      ? payload.model
      : settings.ollamaModel
  );
  const recommendedModel = models.find(
    (entry) =>
      entry.model === DEFAULT_LOCAL_OLLAMA_MODEL ||
      entry.name === DEFAULT_LOCAL_OLLAMA_MODEL
  )?.model;
  const resolvedModel =
    requestedModel &&
    models.some((entry) => entry.model === requestedModel || entry.name === requestedModel)
      ? requestedModel
      : recommendedModel || models[0]?.model;

  if (!resolvedModel) {
    throw new Error("No local Ollama model is available. Pull a model first, then retry.");
  }

  if (resolvedModel !== settings.ollamaModel || baseUrl !== settings.ollamaBaseUrl) {
    await saveSettings({
      ollamaBaseUrl: baseUrl,
      ollamaModel: resolvedModel
    });
  }

  return {
    baseUrl,
    model: resolvedModel
  };
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
ipcMain.handle("get-local-llm-state", async (event) => {
  assertTrustedSender(event);
  return getLocalLlmState(await loadSettings());
});
ipcMain.handle("save-local-llm-settings", async (event, payload) => {
  assertTrustedSender(event);
  const next = await saveSettings(payload ?? {});
  return getLocalLlmState(next);
});
ipcMain.handle("launch-local-llm", async (event) => {
  assertTrustedSender(event);
  return launchLocalOllama();
});
ipcMain.handle("run-local-chat", async (event, payload) => {
  assertTrustedSender(event);
  const target = await resolveLocalOllamaTarget(payload);

  return runOllamaChat({
    baseUrl: target.baseUrl,
    model: target.model,
    locale: payload?.locale === "en" ? "en" : "ko",
    context: payload?.context ?? {},
    messages: Array.isArray(payload?.messages) ? payload.messages : []
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
