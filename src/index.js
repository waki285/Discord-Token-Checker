const { app, BrowserWindow } = require("electron");
const path = require("path");
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    title: "Discord Token Checker - Checker By @L2 & GUI By @suzuneu_discord",
    webPreferences: {
      devTools: true, 
      contextIsolation: true, 
      preload: path.join(__dirname, "preload.js"), 
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});