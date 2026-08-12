// ============================================================
// ACUTE AGENT — IPC Handlers
// Registers handlers for renderer-to-main communication
// ============================================================

import { ipcMain, app, BrowserWindow, dialog, shell } from 'electron';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, basename, isAbsolute } from 'path';

export function registerIpcHandlers(mainWindow: BrowserWindow | null): void {
  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Get app path
  ipcMain.handle('get-app-path', (_event, name: string) => {
    return app.getPath(name as any);
  });

  // Window controls
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });

  // ============================================================
  // FILE DIALOG — Open folder picker
  // ============================================================
  ipcMain.handle('open-folder-dialog', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // ============================================================
  // FILE DIALOG — Open file picker
  // ============================================================
  ipcMain.handle('open-file-dialog', async (_event, options?: { filters?: Array<{ name: string; extensions: string[] }> }) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: 'Select File',
      filters: options?.filters || [],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // ============================================================
  // FILE BROWSER — List directory contents
  // ============================================================
  ipcMain.handle('list-directory', async (_event, dirPath: string) => {
    try {
      const resolvedPath = isAbsolute(dirPath) ? dirPath : join(process.cwd(), dirPath);
      const entries = await readdir(resolvedPath, { withFileTypes: true });

      const items = await Promise.all(
        entries.map(async (entry) => {
          try {
            const fullPath = join(resolvedPath, entry.name);
            const fileStat = await stat(fullPath);
            return {
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? 'folder' : 'file',
              size: fileStat.size,
              modified: fileStat.mtime.toISOString(),
              extension: entry.isFile() ? extname(entry.name) : undefined,
            };
          } catch {
            return null;
          }
        })
      );

      // Sort: folders first, then files alphabetically
      const sorted = items
        .filter(Boolean)
        .sort((a, b) => {
          if (a!.type !== b!.type) return a!.type === 'folder' ? -1 : 1;
          return a!.name.localeCompare(b!.name);
        });

      return { success: true, items: sorted, path: resolvedPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============================================================
  // FILE READER — Read file contents
  // ============================================================
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      const resolvedPath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
      const content = await readFile(resolvedPath, 'utf-8');
      const stats = await stat(resolvedPath);
      return {
        success: true,
        content,
        name: basename(resolvedPath),
        path: resolvedPath,
        size: stats.size,
        extension: extname(resolvedPath),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============================================================
  // PLATFORM INFO
  // ============================================================
  ipcMain.handle('get-platform-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      cwd: process.cwd(),
      home: process.env.HOME || process.env.USERPROFILE || '',
    };
  });

  // ============================================================
  // OPEN EXTERNAL — Open URL in system browser
  // ============================================================
  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });
}
