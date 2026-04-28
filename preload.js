const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  version: process.env.npm_package_version || "0.1.0",
  notifyRendererReady: () => ipcRenderer.send("renderer-ready"),
  reportRendererStartupFailure: (payload) =>
    ipcRenderer.send("renderer-startup-failed", payload),
  refreshConnectedSources: () => ipcRenderer.invoke("refresh-connected-sources"),
  getLiveQuoteHistory: (options) => ipcRenderer.invoke("get-live-quote-history", options),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  saveAppSettings: (partial) => ipcRenderer.invoke("save-app-settings", partial)
});
