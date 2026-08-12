// ============================================================
// ACUTE AGENT — Electron Type Declarations
// Add to tsconfig.json includes or reference in components
// ============================================================

interface AcuteAgentElectronAPI {
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
}

declare global {
  interface Window {
    acuteAgent?: AcuteAgentElectronAPI;
  }
}

export type { AcuteAgentElectronAPI };
