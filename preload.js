const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  version: process.env.npm_package_version || "0.1.0",

  // Lifecycle / startup signaling
  notifyRendererReady: () => ipcRenderer.send("renderer-ready"),
  reportRendererStartupFailure: (payload) =>
    ipcRenderer.send("renderer-startup-failed", payload),

  // Live sources
  refreshConnectedSources: () => ipcRenderer.invoke("refresh-connected-sources"),
  getLiveQuoteHistory: (options) => ipcRenderer.invoke("get-live-quote-history", options),

  // External + window
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // App settings
  getAppSettings: () => ipcRenderer.invoke("get-app-settings"),
  saveAppSettings: (partial) => ipcRenderer.invoke("save-app-settings", partial),

  // App info
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),
  openUserDataFolder: (subfolder) => ipcRenderer.invoke("open-userdata-folder", subfolder),

  // Auto-update
  updaterStatus: () => ipcRenderer.invoke("updater-status"),
  updaterCheck: () => ipcRenderer.invoke("updater-check"),
  updaterDownload: () => ipcRenderer.invoke("updater-download"),
  updaterInstall: () => ipcRenderer.invoke("updater-install"),

  // Exporters
  exportCsv: (payload) => ipcRenderer.invoke("export-csv", payload),
  exportPdf: (payload) => ipcRenderer.invoke("export-pdf", payload),
  exportMarkdown: (payload) => ipcRenderer.invoke("export-markdown", payload),

  // Analytics (opt-in)
  analyticsTrack: (payload) => ipcRenderer.invoke("analytics-track", payload),
  analyticsSetEnabled: (value) => ipcRenderer.invoke("analytics-set-enabled", value),

  // Watchlist
  watchlistLoad: () => ipcRenderer.invoke("watchlist-load"),
  watchlistAdd: (item) => ipcRenderer.invoke("watchlist-add", item),
  watchlistRemove: (id) => ipcRenderer.invoke("watchlist-remove", id),
  watchlistClear: () => ipcRenderer.invoke("watchlist-clear"),

  // Backtests
  backtestList: () => ipcRenderer.invoke("backtest-list"),
  backtestSave: (payload) => ipcRenderer.invoke("backtest-save", payload),
  backtestLoad: (id) => ipcRenderer.invoke("backtest-load", id),
  backtestRemove: (id) => ipcRenderer.invoke("backtest-remove", id)
});
