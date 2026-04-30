import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import { LicenseManager } from './core/license-manager';
import { OBSSyncManager } from './core/obs-sync';
import { VideoProcessor } from './core/video-processor';

let mainWindow: BrowserWindow | null = null;
const licenseManager = new LicenseManager();
const obsSyncManager = new OBSSyncManager();
const videoProcessor = new VideoProcessor();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  // Check license on startup
  const licenseStatus = await licenseManager.validateLicense();
  
  if (licenseStatus.isExpired && licenseStatus.hoursRemaining < 24) {
    // Show expiry warning
    console.log('License expiring soon!');
  }

  if (licenseStatus.isValid || licenseStatus.isTrialActive) {
    createWindow();
  } else {
    // Show license activation window
    console.log('License activation required');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('validate-license', async (event, code: string) => {
  return licenseManager.validateActivationCode(code);
});

ipcMain.handle('get-license-status', async () => {
  return licenseManager.getLicenseStatus();
});

ipcMain.handle('get-countdown-timer', async () => {
  return licenseManager.getCountdownTimer();
});

ipcMain.handle('sync-obs-recordings', async () => {
  return obsSyncManager.syncRecordings();
});

ipcMain.handle('process-video', async (event, config) => {
  return videoProcessor.processVideo(config);
});

ipcMain.handle('auto-montage-shorts', async (event, config) => {
  return videoProcessor.autoMontageShorts(config);
});

ipcMain.handle('get-ai-recommendations', async (event, videoPath: string) => {
  return videoProcessor.analyzeAndRecommend(videoPath);
});
