import { create } from 'zustand';
import { DEMO_SESSION_COSTS, DEMO_USAGE_14D, DEMO_USAGE_ROWS, type DemoSessionCost, type DemoUsagePoint, type DemoUsageRow } from '../lib/demo';

interface UsageState {
  demoMode: boolean;
  setDemoMode: (on: boolean) => void;
  daily: () => DemoUsagePoint[];
  totals: () => { tokens: number; cost: number; requests: number; agents: number };
  rows: () => DemoUsageRow[];
  sessions: () => DemoSessionCost[];
}

export const useUsageStore = create<UsageState>((set, get) => ({
  demoMode: false,
  setDemoMode: (demoMode) => set({ demoMode }),
  daily: () => (get().demoMode ? DEMO_USAGE_14D : []),
  totals: () => {
    if (!get().demoMode) return { tokens: 0, cost: 0, requests: 0, agents: 0 };
    const tokens = DEMO_USAGE_ROWS.reduce((sum, r) => sum + r.tokens, 0);
    const cost = DEMO_USAGE_ROWS.reduce((sum, r) => sum + r.cost, 0);
    const requests = DEMO_USAGE_ROWS.reduce((sum, r) => sum + r.requests, 0);
    return { tokens, cost, requests, agents: DEMO_USAGE_ROWS.length };
  },
  rows: () => (get().demoMode ? DEMO_USAGE_ROWS : []),
  sessions: () => (get().demoMode ? DEMO_SESSION_COSTS : []),
}));
