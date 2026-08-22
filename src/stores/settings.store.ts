import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AccentId, ThemeMode } from '../lib/theme';

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  keyHint?: string;
}

export type MemoryPolicyId = 'none' | 'task_summary' | 'full';

export const DEFAULT_DENYLIST: readonly string[] = [
  'format c:',
  'del /f',
  'del /s',
  'del /q',
  'rd /s',
  'rmdir /s',
  'remove-item -recurse -force',
  'reg add',
  'reg delete',
  'diskpart',
  'shutdown',
  'taskkill /f /im',
  'git push --force',
  'git reset --hard',
  'git branch -d',
];

interface SettingsState {
  onboardingComplete: boolean;
  mode: ThemeMode;
  accent: AccentId;
  providers: ProviderConfig[];
  denylist: string[];
  memoryPolicy: MemoryPolicyId;
  checkpointRetentionDays: 7 | 30 | 90;
  completeOnboarding: () => void;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
  addProvider: (provider: ProviderConfig) => void;
  removeProvider: (id: string) => void;
  setDenylist: (patterns: string[]) => void;
  setMemoryPolicy: (policy: MemoryPolicyId) => void;
  setCheckpointRetentionDays: (days: 7 | 30 | 90) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      accent: 'nova',
      providers: [],
      denylist: [...DEFAULT_DENYLIST],
      memoryPolicy: 'task_summary',
      checkpointRetentionDays: 30,
      completeOnboarding: () => set({ onboardingComplete: true }),
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
      addProvider: (provider) =>
        set((s) => ({
          providers: [...s.providers.filter((p) => p.id !== provider.id), provider],
        })),
      removeProvider: (id) => set((s) => ({ providers: s.providers.filter((p) => p.id !== id) })),
      setDenylist: (denylist) => set({ denylist }),
      setMemoryPolicy: (memoryPolicy) => set({ memoryPolicy }),
      setCheckpointRetentionDays: (checkpointRetentionDays) => set({ checkpointRetentionDays }),
    }),
    {
      name: 'acute.settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
