const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "preload",
  {
    /**
     * 
     * @param {string[]} tokens 
     */
    async checkTokens(tokens) {
      return ipcRenderer.invoke("check-tokens", tokens);
    }

  }
)