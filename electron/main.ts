// ============================================================
// ACUTE AGENT — Electron Main Process
// Starts the Next.js standalone server and creates the main window
// ============================================================

import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import net from 'net';
import { registerIpcHandlers } from './ipc-handlers';

// ============================================================
// TYPES & CONFIG
// ============================================================
let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort = 3000;
let isDev = !app.isPackaged;

// In packaged mode, use embedded resources
if (app.isPackaged) {
  // Check if running from asar archive
  const resourcesPath = process.resourcesPath;
  console.log(`Running from: ${resourcesPath}`);
}

// Try multiple ports if default is taken
const PORTS_TO_TRY = [3000, 3001, 3002, 3003, 3004, 3005];

// ============================================================
// UTILITY: Find free port
// ============================================================
function findFreePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        if (port < startPort + PORTS_TO_TRY.length) {
          tryPort(port + 1);
        } else {
          reject(new Error(`No free port found between ${startPort} and ${startPort + PORTS_TO_TRY.length}`));
        }
      });
    };
    tryPort(startPort);
  });
}

// ============================================================
// UTILITY: Wait for server to be ready
// ============================================================
function waitForServer(port: number, maxAttempts = 60, interval = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      // Simple TCP check
      const socket = net.createConnection({ port, host: '127.0.0.1' }, () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Server did not start on port ${port} after ${maxAttempts * interval}ms`));
        } else {
          setTimeout(check, interval);
        }
      });
      socket.setTimeout(interval);
      socket.on('timeout', () => {
        socket.destroy();
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`Server did not start on port ${port} after ${maxAttempts * interval}ms`));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    check();
  });
}

// ============================================================
// START NEXT.JS SERVER
// ============================================================
async function startServer(): Promise<number> {
  const port = await findFreePort(3000);
  serverPort = port;

  let serverPath: string;
  if (isDev) {
    // In development, use the dev server
    serverPath = join(process.cwd(), 'node_modules', '.bin', 'next');
  } else {
    // In production, use the standalone server
    serverPath = join(process.resourcesPath, 'standalone', 'server.js');
  }

  if (!existsSync(serverPath)) {
    console.error(`Server not found at: ${serverPath}`);
    // Fallback for packaged app
    if (!isDev) {
      serverPath = join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
    }
  }

  const serverArgs = isDev
    ? ['dev', '-p', String(port)]
    : [];

  console.log(`Starting server on port ${port}...`);
  console.log(`Server path: ${serverPath}`);

  serverProcess = spawn(process.execPath, [serverPath, ...serverArgs], {
    cwd: isDev ? process.cwd() : join(process.resourcesPath, 'app'),
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: String(port),
      ELECTRON: '1',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  serverProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Next.js] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[Next.js Error] ${data.toString().trim()}`);
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    serverProcess = null;
  });

  // Wait for the server to be ready
  try {
    await waitForServer(port, 120, 1000);
    console.log(`Server is ready on port ${port}`);
  } catch (err) {
    console.error('Server failed to start:', err);
    throw err;
  }

  return port;
}

// ============================================================
// CREATE MAIN WINDOW
// ============================================================
function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'ACUTE AGENT',
    icon: join(__dirname, '..', 'public', 'logo.svg'),
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

  // Load the app
  const url = isDev
    ? `http://localhost:${port}`
    : `http://localhost:${port}`;

  mainWindow.loadURL(url);

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

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== `http://localhost:${port}`) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// ============================================================
// APP LIFECYCLE
// ============================================================
app.whenReady().then(async () => {
  try {
    const port = await startServer();
    createWindow(port);
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

app.on('activate', async () => {
  if (mainWindow === null) {
    try {
      const port = serverProcess ? serverPort : await startServer();
      createWindow(port);
    } catch (err) {
      console.error('Failed to reactivate application:', err);
    }
  }
});

// Clean up on quit
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
