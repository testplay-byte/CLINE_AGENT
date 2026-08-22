import { create } from 'zustand';

export type ViewId = 'dashboard' | 'workspace' | 'agents' | 'session' | 'usage' | 'settings';

interface UiState {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
}));