import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  
  // File operations
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content: string) => ipcRenderer.invoke('file:save', content),
  
  // Database operations
  createArticle: (article: any) => ipcRenderer.invoke('db:create-article', article),
  getArticle: (id: string) => ipcRenderer.invoke('db:get-article', id),
  updateArticle: (id: string, article: any) => ipcRenderer.invoke('db:update-article', id, article),
  deleteArticle: (id: string) => ipcRenderer.invoke('db:delete-article', id),
  searchArticles: (query: string) => ipcRenderer.invoke('db:search-articles', query),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),
  
  // Listeners
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu:action', (event, action) => callback(action));
  },
  
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Backend server communication
  startBackendServer: () => ipcRenderer.invoke('backend:start'),
  stopBackendServer: () => ipcRenderer.invoke('backend:stop'),
  getBackendStatus: () => ipcRenderer.invoke('backend:status'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;