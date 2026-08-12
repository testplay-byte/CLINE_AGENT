// ============================================================
// ACUTE AGENT — Electron Preload Script
// Provides a secure bridge between the main process and renderer
// ============================================================

import { contextBridge, ipcRenderer } from 'electron';

// ============================================================
// EXPOSED APIs — only safe, non-privileged operations
// ============================================================
contextBridge.exposeInMainWorld('acuteAgent', {
  // App information
  app: {
    version: () => ipcRenderer.invoke('get-app-version'),
    path: (name: string) => ipcRenderer.invoke('get-app-path', name),
    platform: process.platform,
    isElectron: true,
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // File operations
  file: {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) =>
      ipcRenderer.invoke('open-file-dialog', options),
    listDirectory: (dirPath: string) => ipcRenderer.invoke('list-directory', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  },

  // System info (safe, no paths or secrets)
  system: {
    arch: process.arch,
    platform: process.platform,
    getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
  },

  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});

// ============================================================
// TYPE DEFINITIONS FOR RENDERER
// ============================================================
declare global {
  interface Window {
    acuteAgent: {
      app: {
        version: () => Promise<string>;
        path: (name: string) => Promise<string>;
        platform: string;
        isElectron: boolean;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
      file: {
        openFolder: () => Promise<string | null>;
        openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
        listDirectory: (dirPath: string) => Promise<any>;
        readFile: (filePath: string) => Promise<any>;
      };
      system: {
        arch: string;
        platform: string;
        getPlatformInfo: () => Promise<any>;
      };
      openExternal: (url: string) => Promise<void>;
    };
  }
}
