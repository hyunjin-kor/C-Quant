const { app, BrowserWindow, dialog, ipcMain, shell, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { getConnectedSources, getLiveQuoteHistory } = require("./electron/liveSources");
const {
  DEFAULT_MODEL,
  runOpenAIDecisionAssistant
} = require("./electron/decisionAssistant");

const isDev = !app.isPackaged;
const SETTINGS_FILENAME = "settings.json";
let mainWindow = null;
let startupWatchdog = null;

function showFallbackPage(window, title, detail) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
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
            <h1>${title}</h1>
            <p>C-Quant desktop could not render its main screen.</p>
            <p>Restart the app. If the problem repeats, share the message below.</p>
            <pre>${detail}</pre>
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
      nodeIntegration: false
    }
  });

  mainWindow = window;

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
    window.webContents.openDevTools({ mode: "detach" });
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

function getPythonScriptPath() {
  if (isDev) {
    return path.join(__dirname, "python", "walk_forward_model.py");
  }

  return path.join(process.resourcesPath, "python", "walk_forward_model.py");
}

async function runWalkForwardModel({ inputPath, marketId, trainWindow, horizon }) {
  const scriptPath = getPythonScriptPath();
  const candidates = [
    { command: "python", args: [] },
    { command: "py", args: ["-3"] }
  ];

  let lastError = "Python runner is not available.";

  for (const candidate of candidates) {
    try {
      const stdout = await execFileAsync(candidate.command, [
        ...candidate.args,
        scriptPath,
        "--input",
        inputPath,
        "--market",
        marketId,
        "--train-window",
        String(trainWindow),
        "--horizon",
        String(horizon)
      ]);

      return JSON.parse(stdout);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
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
      openAIApiKey:
        typeof parsed.openAIApiKey === "string" ? parsed.openAIApiKey : "",
      llmModel:
        typeof parsed.llmModel === "string" && parsed.llmModel.trim()
          ? parsed.llmModel.trim()
          : DEFAULT_MODEL
    };
  } catch {
    return {
      openAIApiKey: "",
      llmModel: DEFAULT_MODEL
    };
  }
}

async function saveSettings(partial) {
  const current = await loadSettings();
  const next = {
    ...current,
    ...(Object.prototype.hasOwnProperty.call(partial, "openAIApiKey")
      ? { openAIApiKey: String(partial.openAIApiKey ?? "").trim() }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(partial, "llmModel")
      ? { llmModel: String(partial.llmModel ?? "").trim() || DEFAULT_MODEL }
      : {})
  };

  const settingsPath = await getSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function getPublicSettings(settings) {
  return {
    hasOpenAIApiKey: Boolean(settings.openAIApiKey || process.env.OPENAI_API_KEY),
    llmModel: settings.llmModel || DEFAULT_MODEL
  };
}

ipcMain.handle("pick-csv-file", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose a market CSV file",
    filters: [{ name: "CSV files", extensions: ["csv"] }],
    properties: ["openFile"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("read-text-file", async (_event, filePath) =>
  fs.readFile(filePath, "utf8")
);

ipcMain.handle("window-minimize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

ipcMain.handle("window-toggle-maximize", (event) => {
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
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

ipcMain.handle("window-is-maximized", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return window?.isMaximized() ?? false;
});

ipcMain.handle("open-external", async (_event, url) => shell.openExternal(url));

ipcMain.handle("save-text-file", async (_event, { defaultPath, content }) => {
  const result = await dialog.showSaveDialog({
    title: "Save template",
    defaultPath
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  await fs.writeFile(result.filePath, content, "utf8");
  return result.filePath;
});

ipcMain.handle("run-walk-forward-model", async (_event, payload) =>
  runWalkForwardModel(payload)
);
ipcMain.handle("refresh-connected-sources", async () => getConnectedSources());
ipcMain.handle("get-live-quote-history", async (_event, payload) =>
  getLiveQuoteHistory(payload?.quoteId, payload?.range)
);
ipcMain.handle("get-app-settings", async () => getPublicSettings(await loadSettings()));
ipcMain.handle("save-app-settings", async (_event, payload) =>
  getPublicSettings(await saveSettings(payload ?? {}))
);
ipcMain.handle("run-decision-assistant", async (_event, payload) => {
  const settings = await loadSettings();
  const apiKey = settings.openAIApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("No OpenAI API key is configured for the desktop app.");
  }

  return runOpenAIDecisionAssistant({
    apiKey,
    model: settings.llmModel || DEFAULT_MODEL,
    locale: payload?.locale === "en" ? "en" : "ko",
    payload: payload?.payload ?? payload
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
