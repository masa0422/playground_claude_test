import { ipcMain, dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

let backendProcess: ChildProcess | null = null;

// Enhanced error logging for IPC
const logIpcError = (error: Error, context: string): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] IPC ERROR in ${context}: ${error.message}\n${error.stack}\n\n`;
  
  console.error(logMessage);
  
  // Write to log file
  try {
    const logDir = path.join(__dirname, '../logs');
    if (!require('fs').existsSync(logDir)) {
      require('fs').mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'electron-ipc.log');
    require('fs').appendFileSync(logFile, logMessage);
  } catch (logError) {
    console.error('Failed to write to log file:', logError);
  }
};

// Wrapper for IPC handlers with error handling
const safeIpcHandle = (channel: string, handler: (...args: any[]) => any): void => {
  ipcMain.handle(channel, async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      logIpcError(error as Error, channel);
      return { success: false, error: (error as Error).message };
    }
  });
};

export const setupIpc = (): void => {
  // Window controls
  safeIpcHandle('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No focused window found');
    }
    window.minimize();
    return { success: true };
  });

  safeIpcHandle('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No focused window found');
    }
    
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
    return { success: true };
  });

  safeIpcHandle('window:close', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No focused window found');
    }
    window.close();
    return { success: true };
  });

  // File operations
  safeIpcHandle('file:open', async () => {
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
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content, filePath };
    }
    return { success: false, message: 'No file selected' };
  });

  safeIpcHandle('file:save', async (event, content: string) => {
    if (!content) {
      throw new Error('No content provided to save');
    }

    const result = await dialog.showSaveDialog({
      filters: [
        { name: 'Markdown files', extensions: ['md'] },
        { name: 'Text files', extensions: ['txt'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    }
    return { success: false, message: 'No file path selected' };
  });

  // Backend server management
  safeIpcHandle('backend:start', async () => {
    if (backendProcess) {
      return { success: false, message: 'Backend server is already running' };
    }

    const backendPath = path.join(__dirname, '../backend/main.py');
    
    // Check if backend script exists
    try {
      await fs.access(backendPath);
    } catch (error) {
      throw new Error(`Backend script not found at: ${backendPath}`);
    }

    backendProcess = spawn('python', [backendPath], {
      env: { ...process.env, PYTHONPATH: path.join(__dirname, '../backend') }
    });

    backendProcess.on('error', (error) => {
      logIpcError(error, 'backend-process-error');
      backendProcess = null;
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0) {
        logIpcError(new Error(`Backend process exited with code ${code}`), 'backend-process-exit');
      }
      backendProcess = null;
    });

    // Wait a bit to ensure the server starts
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the process is still running
    if (!backendProcess || backendProcess.killed) {
      throw new Error('Backend server failed to start properly');
    }

    return { success: true, message: 'Backend server started' };
  });

  safeIpcHandle('backend:stop', async () => {
    if (backendProcess) {
      backendProcess.kill();
      
      // Wait for process to exit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      backendProcess = null;
      return { success: true, message: 'Backend server stopped' };
    }
    return { success: false, message: 'Backend server is not running' };
  });

  safeIpcHandle('backend:status', () => {
    return { 
      success: true, 
      running: backendProcess !== null && !backendProcess.killed,
      pid: backendProcess?.pid || null
    };
  });

  // Settings management
  safeIpcHandle('settings:get', async () => {
    const settingsPath = path.join(__dirname, '../config/settings.json');
    
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return { success: true, settings };
    } catch (error) {
      // Return default settings if file doesn't exist or is corrupted
      const defaultSettings = {
        theme: 'light',
        autoSave: true,
        backendPort: 8000,
        maxRecentFiles: 10
      };
      
      logIpcError(error as Error, 'settings-get-fallback');
      return { success: true, settings: defaultSettings, isDefault: true };
    }
  });

  safeIpcHandle('settings:set', async (event, settings: any) => {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings object provided');
    }

    const settingsPath = path.join(__dirname, '../config/settings.json');
    const configDir = path.dirname(settingsPath);
    
    // Ensure config directory exists
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Validate settings before saving
    const validatedSettings = {
      ...settings,
      theme: ['light', 'dark', 'auto'].includes(settings.theme) ? settings.theme : 'light',
      autoSave: typeof settings.autoSave === 'boolean' ? settings.autoSave : true,
      backendPort: typeof settings.backendPort === 'number' ? settings.backendPort : 8000,
      maxRecentFiles: typeof settings.maxRecentFiles === 'number' ? settings.maxRecentFiles : 10
    };

    await fs.writeFile(settingsPath, JSON.stringify(validatedSettings, null, 2));
    return { success: true, settings: validatedSettings };
  });
};