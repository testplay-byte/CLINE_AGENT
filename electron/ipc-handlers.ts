// ============================================================
// ACUTE AGENT — IPC Handlers
// Registers handlers for renderer-to-main communication
// Full agent capabilities: file I/O, command execution, diffs
// ============================================================

import { ipcMain, app, BrowserWindow, dialog, shell } from 'electron';
import { readdir, stat, readFile, writeFile, mkdir, access, constants } from 'fs/promises';
import { join, extname, basename, isAbsolute, relative, dirname } from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('reload-window', () => {
    mainWindow?.reload();
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
  ipcMain.handle('list-directory', async (_event, dirPath: string, options?: { depth?: number; maxDepth?: number }) => {
    try {
      const resolvedPath = isAbsolute(dirPath) ? dirPath : join(process.cwd(), dirPath);
      const depth = options?.depth ?? 0;
      const maxDepth = options?.maxDepth ?? 2;

      await access(resolvedPath, constants.R_OK);
      const entries = await readdir(resolvedPath, { withFileTypes: true });

      const items: Array<{ name: string; path: string; type: string; size?: number; modified?: string; extension?: string; children?: any[] }> = [];

      for (const entry of entries) {
        // Skip hidden files/dirs (starting with .)
        if (entry.name.startsWith('.') && entry.name !== '.env') continue;
        // Skip node_modules, .git, dist, out, __pycache__
        if (['node_modules', '.git', 'dist', 'out', '__pycache__', '.next', '.cache', 'coverage'].includes(entry.name)) continue;

        try {
          const fullPath = join(resolvedPath, entry.name);
          const fileStat = await stat(fullPath);
          const isDir = entry.isDirectory();

          const item: any = {
            name: entry.name,
            path: fullPath,
            type: isDir ? 'folder' : 'file',
            id: fullPath,
          };

          if (!isDir) {
            item.size = fileStat.size;
            item.modified = fileStat.mtime.toISOString();
            item.extension = extname(entry.name);
            item.lines = 0; // Placeholder, can be calculated on file read
          } else if (depth < maxDepth) {
            item.children = [];
            // Recurse for nested directories
            const childResult = await ipcMain.emit('list-directory', [fullPath, { depth: depth + 1, maxDepth }]);
            // We'll handle recursion inline instead
            try {
              const childEntries = await readdir(fullPath, { withFileTypes: true });
              const childItems: any[] = [];
              for (const child of childEntries) {
                if (child.name.startsWith('.') && child.name !== '.env') continue;
                if (['node_modules', '.git', 'dist', 'out', '__pycache__', '.next', '.cache', 'coverage'].includes(child.name)) continue;
                const childPath = join(fullPath, child.name);
                const childStat = await stat(childPath);
                const childIsDir = child.isDirectory();
                const childItem: any = {
                  name: child.name,
                  path: childPath,
                  id: childPath,
                  type: childIsDir ? 'folder' : 'file',
                };
                if (!childIsDir) {
                  childItem.size = childStat.size;
                  childItem.extension = extname(child.name);
                }
                childItems.push(childItem);
              }
              childItems.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
              });
              item.children = childItems;
            } catch {
              item.children = [];
            }
          }

          items.push(item);
        } catch {
          // Skip entries we can't access
        }
      }

      // Sort: folders first, then files alphabetically
      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return { success: true, items, path: resolvedPath };
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
      const lineCount = content.split('\n').length;
      return {
        success: true,
        content,
        name: basename(resolvedPath),
        path: resolvedPath,
        size: stats.size,
        extension: extname(resolvedPath),
        lines: lineCount,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============================================================
  // FILE WRITER — Write file contents (create or overwrite)
  // ============================================================
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
      const resolvedPath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);

      // Ensure parent directory exists
      const parentDir = dirname(resolvedPath);
      await mkdir(parentDir, { recursive: true });

      await writeFile(resolvedPath, content, 'utf-8');
      const stats = await stat(resolvedPath);

      return {
        success: true,
        name: basename(resolvedPath),
        path: resolvedPath,
        size: stats.size,
        lines: content.split('\n').length,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // ============================================================
  // APPLY DIFF — Search and replace in a file
  // Supports multiple search/replace blocks in one operation
  // ============================================================
  ipcMain.handle('apply-diff', async (_event, filePath: string, diffs: Array<{ oldText: string; newText: string }>) => {
    try {
      const resolvedPath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
      let content = await readFile(resolvedPath, 'utf-8');
      let appliedCount = 0;

      for (const diff of diffs) {
        const normalizedOld = diff.oldText.replace(/\r\n/g, '\n');
        const normalizedContent = content.replace(/\r\n/g, '\n');

        if (normalizedContent.includes(normalizedOld)) {
          // Use the original content (preserve line endings)
          const rawContent = content.replace(/\r\n/g, '\n');
          const newContent = rawContent.replace(normalizedOld, diff.newText.replace(/\r\n/g, '\n'));
          content = newContent;
          appliedCount++;
        } else {
          return {
            success: false,
            error: `Search text not found in ${basename(resolvedPath)}. The file may have changed since the AI read it.`,
            appliedCount,
            totalDiffs: diffs.length,
          };
        }
      }

      await writeFile(resolvedPath, content, 'utf-8');

      return {
        success: true,
        path: resolvedPath,
        name: basename(resolvedPath),
        appliedCount,
        totalDiffs: diffs.length,
        newLines: content.split('\n').length,
      };
    } catch (error: any) {
      return { success: false, error: error.message, appliedCount: 0, totalDiffs: diffs.length };
    }
  });

  // ============================================================
  // EXECUTE COMMAND — Run a shell command with timeout
  // Streams output via events
  // ============================================================
  ipcMain.handle('execute-command', async (event, command: string, options?: { cwd?: string; timeout?: number; env?: Record<string, string> }) => {
    const cwd = options?.cwd || process.cwd();
    const timeout = options?.timeout || 60000; // 60 second default
    const mergedEnv = { ...process.env, ...(options?.env || {}) } as Record<string, string>;

    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let combined = '';

      const shellCmd = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      const shellArg = process.platform === 'win32' ? '/c' : '-c';

      const child = spawn(shellCmd, [shellArg, command], {
        cwd,
        env: mergedEnv,
        shell: false,
        windowsHide: true,
      });

      // Stream output chunks back to renderer
      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');
        stdout += chunk;
        combined += chunk;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('command-output', {
            chunk,
            type: 'stdout',
            commandId: `${Date.now()}`,
          });
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString('utf-8');
        stderr += chunk;
        combined += chunk;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('command-output', {
            chunk,
            type: 'stderr',
            commandId: `${Date.now()}`,
          });
        }
      });

      // Timeout handler
      const timeoutHandle = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          exitCode: -1,
          signal: 'SIGTERM',
          stdout,
          stderr: stderr || 'Command timed out after ' + timeout + 'ms',
          combined,
          duration: Date.now() - startTime,
          timedOut: true,
        });
      }, timeout);

      child.on('close', (code, signal) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          exitCode: code,
          signal: signal,
          stdout,
          stderr,
          combined,
          duration,
          timedOut: false,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeoutHandle);
        resolve({
          success: false,
          exitCode: -1,
          signal: null,
          stdout: '',
          stderr: err.message,
          combined: err.message,
          duration: Date.now() - startTime,
          timedOut: false,
          error: err.message,
        });
      });
    });
  });

  // ============================================================
  // SEARCH IN FILES — Grep-like search across files
  // ============================================================
  ipcMain.handle('search-files', async (_event, options: {
    pattern: string;
    directory: string;
    includePattern?: string;
    maxResults?: number;
  }) => {
    try {
      const dir = isAbsolute(options.directory) ? options.directory : join(process.cwd(), options.directory);
      const maxResults = options.maxResults || 50;
      const includePattern = options.includePattern;

      // Use ripgrep if available, fallback to basic search
      try {
        const rgPath = process.platform === 'win32' ? 'rg.exe' : 'rg';
        let rgArgs = [options.pattern, dir, '--max-count', '1', '-l', '--no-messages'];

        if (includePattern) {
          rgArgs = ['-g', includePattern, options.pattern, dir, '--max-count', '1', '-l', '--no-messages'];
        }

        const { stdout } = await execAsync(`${rgPath} ${rgArgs.join(' ')}`, {
          maxBuffer: 1024 * 1024,
          timeout: 10000,
        });

        const files = stdout.trim().split('\n').filter(Boolean).slice(0, maxResults);
        return { success: true, files, count: files.length };
      } catch {
        // Fallback: use grep
        try {
          const grepCmd = process.platform === 'win32'
            ? `findstr /S /M "${options.pattern}" ${dir}\\*`
            : `grep -rl "${options.pattern}" ${dir} --include="${includePattern || '*'}" 2>/dev/null | head -${maxResults}`;

          const { stdout } = await execAsync(grepCmd, {
            maxBuffer: 1024 * 1024,
            timeout: 10000,
          });

          const files = stdout.trim().split('\n').filter(Boolean).slice(0, maxResults);
          return { success: true, files, count: files.length };
        } catch {
          return { success: true, files: [], count: 0, note: 'No search tool available (install ripgrep for best results)' };
        }
      }
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
