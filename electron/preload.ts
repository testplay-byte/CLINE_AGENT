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

  // System info (safe, no paths or secrets)
  system: {
    arch: process.arch,
    platform: process.platform,
  },
});

// ============================================================
// TYPE DEFINITIONS FOR RENDERER
// ============================================================
declare global {
  interface Window {
    acuteAgent: {
      app: {
        version: () => Promise<string>;
        platform: string;
        isElectron: boolean;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
      system: {
        arch: string;
        platform: string;
      };
    };
  }
}
