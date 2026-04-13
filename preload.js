const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  version: process.env.npm_package_version || "0.1.0",
  pickCsvFile: () => ipcRenderer.invoke("pick-csv-file"),
  readTextFile: (path) => ipcRenderer.invoke("read-text-file", path),
  refreshConnectedSources: () => ipcRenderer.invoke("refresh-connected-sources"),
  getLiveQuoteHistory: (options) => ipcRenderer.invoke("get-live-quote-history", options),
  runWalkForwardModel: (options) =>
    ipcRenderer.invoke("run-walk-forward-model", options),
  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  saveAppSettings: (options) => ipcRenderer.invoke("save-app-settings", options),
  getLocalLlmState: () => ipcRenderer.invoke("get-local-llm-state"),
  saveLocalLlmSettings: (options) =>
    ipcRenderer.invoke("save-local-llm-settings", options),
  runDecisionAssistant: (payload) =>
    ipcRenderer.invoke("run-decision-assistant", payload),
  runLocalDecisionAssistant: (payload) =>
    ipcRenderer.invoke("run-local-decision-assistant", payload),
  saveTextFile: (options) => ipcRenderer.invoke("save-text-file", options),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized")
});
