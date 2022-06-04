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
    },
    checkTokensChunk(callback) {
      return ipcRenderer.on("check-chunk", callback);
    }
  }
)