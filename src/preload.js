const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "preload",
  {

  }
)