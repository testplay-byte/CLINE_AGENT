import { create } from 'zustand';

export type ViewId = 'setup' | 'dashboard' | 'workspace' | 'session' | 'agents' | 'usage' | 'settings';

interface UiState {
  activeView: ViewId;
  hint: string | null;
  setActiveView: (view: ViewId) => void;
  showHint: (message: string) => void;
}

let hintTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set) => ({
  activeView: 'dashboard',
  hint: null,
  setActiveView: (view) => set({ activeView: view }),
  showHint: (message) => {
    if (hintTimer) clearTimeout(hintTimer);
    set({ hint: message });
    hintTimer = setTimeout(() => set({ hint: null }), 2600);
  },
}));
