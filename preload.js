const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  version: process.env.npm_package_version || "0.1.0",
  refreshConnectedSources: () => ipcRenderer.invoke("refresh-connected-sources"),
  getLiveQuoteHistory: (options) => ipcRenderer.invoke("get-live-quote-history", options),
  getLocalLlmState: () => ipcRenderer.invoke("get-local-llm-state"),
  saveLocalLlmSettings: (options) =>
    ipcRenderer.invoke("save-local-llm-settings", options),
  launchLocalLlm: () => ipcRenderer.invoke("launch-local-llm"),
  runLocalChat: (payload) => ipcRenderer.invoke("run-local-chat", payload),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized")
});
