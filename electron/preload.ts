// ============================================================
// ACUTE AGENT — Electron Preload Script
// Provides a secure bridge between the main process and renderer
// Exposes: app, window, file, system, agent, openExternal
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
    reload: () => ipcRenderer.invoke('reload-window'),
  },

  // File operations
  file: {
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
    openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) =>
      ipcRenderer.invoke('open-file-dialog', options),
    listDirectory: (dirPath: string, options?: { depth?: number; maxDepth?: number }) =>
      ipcRenderer.invoke('list-directory', dirPath, options),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
    applyDiff: (filePath: string, diffs: Array<{ oldText: string; newText: string }>) =>
      ipcRenderer.invoke('apply-diff', filePath, diffs),
    searchFiles: (options: { pattern: string; directory: string; includePattern?: string; maxResults?: number }) =>
      ipcRenderer.invoke('search-files', options),
  },

  // Agent operations — command execution
  agent: {
    executeCommand: (command: string, options?: { cwd?: string; timeout?: number; env?: Record<string, string> }) =>
      ipcRenderer.invoke('execute-command', command, options),
    onCommandOutput: (callback: (data: { chunk: string; type: string; commandId: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('command-output', handler);
      return () => ipcRenderer.removeListener('command-output', handler);
    },
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
        reload: () => Promise<void>;
      };
      file: {
        openFolder: () => Promise<string | null>;
        openFile: (options?: { filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
        listDirectory: (dirPath: string, options?: { depth?: number; maxDepth?: number }) => Promise<any>;
        readFile: (filePath: string) => Promise<any>;
        writeFile: (filePath: string, content: string) => Promise<any>;
        applyDiff: (filePath: string, diffs: Array<{ oldText: string; newText: string }>) => Promise<any>;
        searchFiles: (options: { pattern: string; directory: string; includePattern?: string; maxResults?: number }) => Promise<any>;
      };
      agent: {
        executeCommand: (command: string, options?: { cwd?: string; timeout?: number; env?: Record<string, string> }) => Promise<CommandResult>;
        onCommandOutput: (callback: (data: { chunk: string; type: string; commandId: string }) => void) => () => void;
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

interface CommandResult {
  success: boolean;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  combined: string;
  duration: number;
  timedOut: boolean;
  error?: string;
}
