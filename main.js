/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable promise/catch-or-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
const path = require("path");
const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

//  "repository": "https://github.com/ChungNguyenNgoc/electron-autoupdater",

class Updater {
  constructor() {
    log.transports.file.level = "info";
    log.log(`Logpath: ${log.transports.file.getFile().path}`);

    // const apiUrl =
    //   "https://github.com/ChungNguyenNgoc/electron-autoupdater/releases";
    // const GHToken = "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"; // Specify a (github, gitlab,...) token if using private repository.

    autoUpdater.setFeedURL({
      provider: "generic",
      url: "http://127.0.0.1:5501/dist/latest.yml", // Ex: https://my-update-server.com/releases
      // channel: "latest", // which means that the latest available version will be downloaded.
      // useMultipleRangeRequest: true,
      publishAutoUpdate: true,
      // requestHeaders: {
      //   Authorization: `Bearer ${GHToken}`, // Specify a github token if using private repository.
      //   accept: "application/octet-stream",
      // },
    });

    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

ipcMain.handle("development", () => {
  if (mainWindow != null) mainWindow.webContents.openDevTools();
});

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDevelopment) {
  require("electron-debug")();
}

const installExtensions = async () => {
  const installer = require("electron-devtools-installer");
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ["REACT_DEVELOPER_TOOLS"];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

app.disableHardwareAcceleration();
const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.join(__dirname, "../assets");

  const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1080,
    height: 1920,
    fullscreen: !isDevelopment,
    fullscreenable: true,
    icon: getAssetPath("icon.png"),
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  });

  mainWindow.webContents.setFrameRate(60);

  mainWindow.loadFile("./screens/main/main.html");
  mainWindow.webContents.openDevTools({ mode: "undocked" });

  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new Updater();
};

/**
 * Add event listeners...
 */
app.on("window-all-closed", () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });

    autoUpdater.checkForUpdates();
    console.log(`Checking for updates. Current version ${app.getVersion()}`);
    dialog.showMessageBox({
      title: "Checking Updates",
      message: `Checking for updates. Current version ${app.getVersion()}`,
    });
  })
  .catch(console.log);

autoUpdater.on("update-available", (info) => {
  console.log(`Update available. Current version ${app.getVersion()}`);
  dialog
    .showMessageBox({
      type: "info",
      title: "Found Updates",
      message: "Found updates, do you want update now",
      buttons: ["Sure", "No"],
    })
    .then((buttonIndex) => {
      console.log(`Update available. Current version ${app.getVersion()}`);
      console.log(`Update available. buttonIndex: ${buttonIndex}`);
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on("update-not-available", (info) => {
  console.log(`No update available. Current version ${app.getVersion()}`);
  dialog.showMessageBox({
    title: "No Updates",
    message: `No update available. Current version ${app.getVersion()}`,
  });
});

autoUpdater.on("update-downloaded", (info) => {
  console.log(`Update downloaded. Current version ${app.getVersion()}`);
  dialog
    .showMessageBox({
      title: "Install Updates",
      message: `Update downloaded. Current version ${app.getVersion()}`,
    })
    .then(() => {
      setImmediate(() => autoUpdater.quitAndInstall());
    });
});

autoUpdater.on("error", (info) => {
  console.log(info);
  dialog.showErrorBox("Error: ", info);
});
