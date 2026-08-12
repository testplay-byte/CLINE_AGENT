// ============================================================
// ACUTE AGENT — IPC Handlers
// Registers handlers for renderer-to-main communication
// ============================================================

import { ipcMain, app, BrowserWindow } from 'electron';

export function registerIpcHandlers(mainWindow: BrowserWindow | null): void {
  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });
}
