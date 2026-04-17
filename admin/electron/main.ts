import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { loadEnv } from "vite";

// 1. Manually load the env variables
// process.cwd() points to your project root where the .env file lives
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// 2. Use your variables via the 'env' object
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
    } else {
        // Ensure this path matches your Vite build output
        mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    }

    mainWindow.maximize();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
