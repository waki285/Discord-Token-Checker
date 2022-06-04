const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const retry = require("async-retry");
const ws = require("ws");
const fs = require("fs");
const pLimit = require("p-limit").default;
const chalk = require("chalk");
if (require("electron-squirrel-startup")) {
  app.quit();
}

const config = {
  retries: 20,
  threads: 1000,
}

const limit = pLimit(config.threads);


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

const counter = {
  flag: false,
  checked: 0,
  success: 0,
  invalid: 0,
  require: 0,
  error: 0,
  cpm: 0,
};

const outputs = {};

const check = async (token) => {
  let flag = false;
  await retry(async (bail) => {
    return new Promise(
      async (resolve, reject) => {
        const WebSocket = new ws("wss://gateway.discord.gg/?v=9&encoding=json");
        WebSocket.on("open", async () => {
          WebSocket.send(
            JSON.stringify({
              op: 2,
              d: {
                token,
                properties: {
                  os: "Windows",
                  browser: "Discord Client",
                  release_channel: "ptb",
                  client_version: "1.0.1014",
                  os_version: "10.0.22000",
                  os_arch: "x64",
                  system_locale: "ja",
                  client_build_number: "130383",
                  client_event_source: null,
                },
              },
            })
          );
        });
        WebSocket.on("close", async () => {
          if (!flag) {
            counter.invalid++;
            console.log(` [${chalk.red("INVALID")}] ${chalk.red(token)}`);
            if (!("INVALID" in outputs)) {
              outputs["INVALID"] = fs.createWriteStream(
                `${output_folder}/INVALID.txt`
              );
            }
            outputs.INVALID.write(`${token}\n`);
            resolve();
          }
        });
        WebSocket.on("message", async (data) => {
          const response = JSON.parse(data);
          if (response.t === "READY") {
            flag = true;
            if ("required_action" in response.d) {
              counter.require++;
              console.log(
                ` [${chalk.yellow(
                  response.d.required_action.split("_").at(-1)
                )}] ${chalk.yellow(token)}`
              );
              WebSocket.close();
              if (!(response.d.required_action.split("_").at(-1) in outputs)) {
                outputs[response.d.required_action.split("_").at(-1)] =
                  fs.createWriteStream(
                    `${output_folder}/${response.d.required_action
                      .split("_")
                      .at(-1)}.txt`
                  );
              }
              outputs[response.d.required_action.split("_").at(-1)].write(
                `${token}\n`
              );
              resolve();
            } else {
              counter.success++;
              console.log(` [${chalk.green("!")}] ${chalk.green(token)}`);
              WebSocket.close();
              if (!("SUCCESS" in outputs)) {
                outputs["SUCCESS"] = fs.createWriteStream(
                  `${output_folder}/SUCCESS.txt`
                );
              }
              outputs.SUCCESS.write(`${token}\n`);
              resolve();
            }
          }
        });
        WebSocket.on("error", async (err) => {
          counter.error++;
          reject();
        });
      },
      {
        retries: config.retries,
      }
    );
  });
};

ipcMain.handle("check-tokens", async (event, tokens) => {
  await Promise.all(
    
  )
});
