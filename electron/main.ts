// ============================================================
// ACUTE AGENT — Electron Main Process
// Loads the static Next.js export directly (no server needed)
// Uses a custom protocol to serve static files in production
// ============================================================

import { app, BrowserWindow, shell, protocol, net } from 'electron';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { registerIpcHandlers } from './ipc-handlers';

// ============================================================
// TYPES & CONFIG
// ============================================================
let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;

// ============================================================
// SINGLE INSTANCE LOCK — prevents window replication bug
// Without this, launching the app multiple times creates
// multiple windows and server processes
// ============================================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running — quit immediately
  app.quit();
} else {
  // If a second instance is launched, focus the existing window
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

// ============================================================
// CUSTOM PROTOCOL — serves static files from the export directory
// This avoids the need for an embedded HTTP server, which was
// the primary cause of the 500MB+ build size
// ============================================================
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

// ============================================================
// UTILITY: Get the static export directory
// ============================================================
function getOutDir(): string {
  if (isDev) {
    // In dev mode, Next.js static export goes to project root /out
    return join(process.cwd(), 'out');
  }
  // In production, files are in resources/out (from extraResources)
  return join(process.resourcesPath, 'out');
}

// ============================================================
// CREATE MAIN WINDOW (returns the created window)
// ============================================================
function createWindow(): BrowserWindow {
  const iconPath = isDev
    ? join(process.cwd(), 'electron', 'resources', 'icon.png')
    : join(process.resourcesPath, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'ACUTE AGENT',
    icon: iconPath,
    backgroundColor: '#FFFBF0',
    show: false, // Show after ready-to-show to avoid flash
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Register IPC handlers
  registerIpcHandlers(mainWindow);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ============================================================
// APP LIFECYCLE
// ============================================================
app.whenReady().then(async () => {
  try {
    if (isDev) {
      // Development: serve from Next.js dev server (hot reload support)
      const win = createWindow();
      win.loadURL('http://localhost:3000');
    } else {
      // Production: serve static files via custom protocol (no server needed)
      const outDir = getOutDir();

      // Register protocol handler to serve static export files
      await protocol.handle('app', (request) => {
        const requestUrl = new URL(request.url);
        // Remove leading slash from pathname
        const relativePath = requestUrl.pathname.replace(/^\//, '') || 'index.html';
        const fullPath = join(outDir, relativePath);

        try {
          return net.fetch(pathToFileURL(fullPath).toString());
        } catch {
          // Return 404 for missing files
          return new Response('Not Found', { status: 404 });
        }
      });

      const win = createWindow();
      win.loadURL('app://localhost/index.html');
    }
  } catch (err) {
    console.error('Failed to start application:', err);
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    const win = createWindow();
    win.loadURL(isDev ? 'http://localhost:3000' : 'app://localhost/index.html');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
