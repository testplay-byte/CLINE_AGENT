// ============================================================
// ACUTE AGENT — Electron Type Declarations
// Comprehensive type definitions for the Electron bridge
// ============================================================

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

interface FileEntry {
  name: string;
  path: string;
  id: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  extension?: string;
  lines?: number;
  children?: FileEntry[];
}

interface FileReadResult {
  success: boolean;
  content?: string;
  name?: string;
  path?: string;
  size?: number;
  extension?: string;
  lines?: number;
  error?: string;
}

interface FileWriteResult {
  success: boolean;
  name?: string;
  path?: string;
  size?: number;
  lines?: number;
  error?: string;
}

interface DiffResult {
  success: boolean;
  path?: string;
  name?: string;
  appliedCount?: number;
  totalDiffs?: number;
  newLines?: number;
  error?: string;
}

interface DirectoryListResult {
  success: boolean;
  items?: FileEntry[];
  path?: string;
  error?: string;
}

interface SearchResult {
  success: boolean;
  files?: string[];
  count?: number;
  note?: string;
  error?: string;
}

interface AcuteAgentElectronAPI {
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
    listDirectory: (dirPath: string, options?: { depth?: number; maxDepth?: number }) => Promise<DirectoryListResult>;
    readFile: (filePath: string) => Promise<FileReadResult>;
    writeFile: (filePath: string, content: string) => Promise<FileWriteResult>;
    applyDiff: (filePath: string, diffs: Array<{ oldText: string; newText: string }>) => Promise<DiffResult>;
    searchFiles: (options: { pattern: string; directory: string; includePattern?: string; maxResults?: number }) => Promise<SearchResult>;
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
}

declare global {
  interface Window {
    acuteAgent?: AcuteAgentElectronAPI;
  }
}

export type {
  CommandResult,
  FileEntry,
  FileReadResult,
  FileWriteResult,
  DiffResult,
  DirectoryListResult,
  SearchResult,
  AcuteAgentElectronAPI,
};
