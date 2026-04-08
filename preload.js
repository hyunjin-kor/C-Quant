const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopBridge", {
  version: process.env.npm_package_version || "0.1.0",
  pickCsvFile: () => ipcRenderer.invoke("pick-csv-file"),
  readTextFile: (path) => ipcRenderer.invoke("read-text-file", path),
  refreshConnectedSources: () => ipcRenderer.invoke("refresh-connected-sources"),
  runWalkForwardModel: (options) =>
    ipcRenderer.invoke("run-walk-forward-model", options),
  saveTextFile: (options) => ipcRenderer.invoke("save-text-file", options),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized")
});
