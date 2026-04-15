import { app, BrowserWindow, screen } from "electron";
import path from "path";

// const isDev = process.env.NODE_ENV === "development";
const isDev = true;

app.on("ready", () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const mainWindow = new BrowserWindow({
        width,
        height,
        resizable: true,
        minWidth: 375,
        minHeight: 812,
        fullscreen: true,
    });

    if (isDev) {
        mainWindow.loadURL("http://192.168.1.150:5173");
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    }

    // Menu.setApplicationMenu(null);
    mainWindow.maximize();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
