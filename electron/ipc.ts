import { ipcMain, dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let backendProcess: ChildProcess | null = null;

export const setupIpc = (): void => {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.close();
  });

  // File operations
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Markdown files', extensions: ['md', 'markdown'] },
        { name: 'Text files', extensions: ['txt'] },
        { name: 'All files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, filePath };
    }
    return null;
  });

  ipcMain.handle('file:save', async (event, content: string) => {
    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'Markdown files', extensions: ['md'] },
        { name: 'Text files', extensions: ['txt'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, 'utf-8');
      return result.filePath;
    }
    return null;
  });

  // Backend server management
  ipcMain.handle('backend:start', async () => {
    if (backendProcess) {
      return { success: false, message: 'Backend server is already running' };
    }

    try {
      const backendPath = path.join(__dirname, '../backend/main.py');
      backendProcess = spawn('python', [backendPath], {
        env: { ...process.env, PYTHONPATH: path.join(__dirname, '../backend') }
      });

      backendProcess.on('error', (error) => {
        console.error('Backend process error:', error);
        backendProcess = null;
      });

      backendProcess.on('exit', (code) => {
        console.log(`Backend process exited with code ${code}`);
        backendProcess = null;
      });

      // Wait a bit to ensure the server starts
      await new Promise(resolve => setTimeout(resolve, 2000));

      return { success: true, message: 'Backend server started' };
    } catch (error) {
      console.error('Failed to start backend server:', error);
      return { success: false, message: 'Failed to start backend server' };
    }
  });

  ipcMain.handle('backend:stop', async () => {
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
      return { success: true, message: 'Backend server stopped' };
    }
    return { success: false, message: 'Backend server is not running' };
  });

  ipcMain.handle('backend:status', () => {
    return { running: backendProcess !== null };
  });

  // Settings management
  ipcMain.handle('settings:get', async () => {
    try {
      const settingsPath = path.join(__dirname, '../config/settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return default settings if file doesn't exist
      return {
        theme: 'light',
        autoSave: true,
        backendPort: 8000,
        maxRecentFiles: 10
      };
    }
  });

  ipcMain.handle('settings:set', async (event, settings: any) => {
    try {
      const settingsPath = path.join(__dirname, '../config/settings.json');
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error: error.message };
    }
  });
};