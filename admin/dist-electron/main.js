import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { loadEnv } from "vite";
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const isDev = process.env.NODE_ENV === "development";
const ElectronURL = env.VITE_ELECTRON_URL || "http://localhost:5173";
app.on("ready", () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const mainWindow = new BrowserWindow({
        width,
        height,
        resizable: true,
        minWidth: 375,
        minHeight: 812,
        fullscreen: true,
        // webPreferences: {
        //     // Best practice: point to your preload script if you have one
        //     preload: path.join(__dirname, 'preload.js'),
        // }
    });
    if (isDev) {
        console.log(ElectronURL);
        mainWindow.loadURL(ElectronURL);
    }
    else {
        mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    }
    mainWindow.maximize();
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
