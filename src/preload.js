const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld(
  "preload",
  {
    
  }
)