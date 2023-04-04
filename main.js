const { app, BrowserWindow } = require("electron");
const MainScreen = require("./screens/main/mainScreen");
const { autoUpdater } = require("electron-updater");
const { dialog } = require("electron");

let curWindow;
let updater;
//Basic flags
class Updater {
  constructor() {
    // const apiUrl = "https://localhost:5004/api";
    const apiUrl = "https://github.com/ChungNguyenNgoc/electron-autoupdater";
    const GHToken = "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"; // Specify a (github, gitlab,...) token if using private repository.

    autoUpdater.setFeedURL({
      provider: "generic",
      // url: `${apiUrl}/update/${process.platform}/${app.getVersion()}`, // Ex: https://my-update-server.com/releases
      url: `${apiUrl}`, // Ex: https://my-update-server.com/releases
      channel: "latest ", // which means that the latest available version will be downloaded.
      // useMultipleRangeRequest: true,
      publishAutoUpdate: true,
      requestHeaders: {
        Authorization: `Bearer ${GHToken}`, // Specify a github token if using private repository.
        // accept: 'application/octet-stream',
      },
    });
    autoUpdater.checkForUpdatesAndNotify();
    console.log("Chung test Updater");
  }
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  curWindow = new MainScreen();
  new Updater();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length == 0) createWindow();
  });

  autoUpdater.checkForUpdates();
  curWindow.showMessage(
    `Checking for updates. Current version ${app.getVersion()}`,
  );
});

/*New Update Available*/
autoUpdater.on("update-available", (info) => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Found Updates",
      message: "Found updates, do you want update now",
      buttons: ["Sure", "No"],
    })
    .then((buttonIndex) => {
      curWindow.showMessage(
        `Update available. Current version ${app.getVersion()}`,
      );
      curWindow.showMessage(`Update available. buttonIndex: ${buttonIndex}`);
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      } else {
        updater.enabled = true;
        updater = null;
      }
    });
});

autoUpdater.on("update-not-available", (info) => {
  curWindow.showMessage(
    `No update available. Current version ${app.getVersion()}`,
  );
  dialog.showMessageBox({
    title: "No Updates",
    message: `No update available. Current version ${app.getVersion()}`,
  });
  updater.enabled = true;
  updater = null;
});

/*Download Completion Message*/
autoUpdater.on("update-downloaded", (info) => {
  curWindow.showMessage(
    `Update downloaded. Current version ${app.getVersion()}`,
  );
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
  curWindow.showMessage("Update error: ", info);
  dialog.showErrorBox(
    "Error: ",
    error == null ? "unknown" : (error.stack || error).toString(),
  );
});

//Global exception handler
process.on("uncaughtException", function (err) {
  console.log(err);
});

app.on("window-all-closed", function () {
  if (process.platform != "darwin") app.quit();
});
