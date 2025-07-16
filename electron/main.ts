import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { isDev } from './utils';
import { createMenu } from './menu';
import { setupIpc } from './ipc';

let mainWindow: BrowserWindow | null = null;

// Error logging function
const logError = (error: Error, context: string): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR in ${context}: ${error.message}\n${error.stack}\n\n`;
  
  console.error(logMessage);
  
  // Write to log file
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = path.join(logDir, 'electron-main.log');
  fs.appendFileSync(logFile, logMessage);
  
  // Show error dialog in development
  if (isDev) {
    dialog.showErrorBox(`Error in ${context}`, error.message);
  }
};

// Global error handlers
process.on('uncaughtException', (error) => {
  logError(error, 'uncaughtException');
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError(error, 'unhandledRejection');
});

const createWindow = (): void => {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      show: false,
      titleBarStyle: 'default',
    });

    const url = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../renderer/out/index.html')}`;

    mainWindow.loadURL(url).catch((error) => {
      logError(error, 'loadURL');
      
      // Fallback: try to load a simple error page
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">Failed to load application</h1>
          <p>Please check if the backend server is running and try again.</p>
          <p>Error: ${error.message}</p>
        </body>
        </html>
      `;
      
      mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    });

    // Enhanced error handling for webContents
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      logError(new Error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`), 'did-fail-load');
    });

    mainWindow.webContents.on('crashed', (event, killed) => {
      logError(new Error(`Renderer process crashed (killed: ${killed})`), 'renderer-crashed');
      
      // Attempt to reload the window
      if (mainWindow) {
        mainWindow.reload();
      }
    });

    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
      if (isDev) {
        mainWindow?.webContents.openDevTools();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    mainWindow.on('unresponsive', () => {
      logError(new Error('Main window became unresponsive'), 'window-unresponsive');
      
      // Show dialog asking if user wants to wait or close
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Wait', 'Close'],
        defaultId: 0,
        title: 'Application Unresponsive',
        message: 'The application is not responding. Do you want to wait or close it?',
      });
      
      if (choice === 1) {
        mainWindow?.close();
      }
    });

    if (isDev) {
      mainWindow.webContents.on('did-frame-finish-load', () => {
        mainWindow?.webContents.once('devtools-opened', () => {
          mainWindow?.focus();
        });
      });
    }
  } catch (error) {
    logError(error as Error, 'createWindow');
    app.quit();
  }
};

app.whenReady().then(() => {
  try {
    createWindow();
    
    const menu = createMenu();
    Menu.setApplicationMenu(menu);
    
    setupIpc();

    app.on('activate', () => {
      try {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      } catch (error) {
        logError(error as Error, 'app-activate');
      }
    });
  } catch (error) {
    logError(error as Error, 'app-whenReady');
    app.quit();
  }
}).catch((error) => {
  logError(error, 'app-whenReady-promise');
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked new window:', url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (url !== contents.getURL()) {
      event.preventDefault();
      console.log('Blocked navigation to:', url);
    }
  });
});

export { mainWindow };