const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("screenAssist", {
  toggleAssistant: () => ipcRenderer.invoke("toggle-assistant"),
  setLauncherPosition: (position) => ipcRenderer.invoke("set-launcher-position", position),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  showLauncherMenu: () => ipcRenderer.invoke("show-launcher-menu"),
  captureScreen: () => ipcRenderer.invoke("capture-screen"),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  analyzeScreen: (payload) => ipcRenderer.invoke("analyze-screen", payload)
});
