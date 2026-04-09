const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { getConnectedSources } = require("./electron/liveSources");
const {
  DEFAULT_MODEL,
  runOpenAIDecisionAssistant
} = require("./electron/decisionAssistant");

const isDev = !app.isPackaged;
const SETTINGS_FILENAME = "settings.json";

function getWindowIconPath() {
  return path.join(__dirname, "assets", "app-icon.png");
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 980,
    minHeight: 680,
    title: "C-Quant",
    icon: getWindowIconPath(),
    frame: false,
    thickFrame: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    resizable: true,
    show: false,
    backgroundColor: "#eef2f8",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    window.loadURL("http://127.0.0.1:5173");
    window.webContents.openDevTools({ mode: "detach" });
    window.once("ready-to-show", () => window.show());
    return;
  }

  window.loadFile(path.join(__dirname, "dist", "index.html"));
  window.once("ready-to-show", () => window.show());
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
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
