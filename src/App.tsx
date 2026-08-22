import type { ComponentType } from 'react';
import { ThemeProvider, ThemeToggle } from './components/theme/ThemeProvider';
import AgentsView from './views/agents/Index';
import DashboardView from './views/dashboard/Index';
import SessionView from './views/session/Index';
import SettingsView from './views/settings/Index';
import UsageView from './views/usage/Index';
import WorkspaceView from './views/workspace/Index';
import { useUiStore } from './stores/ui.store';
import type { ViewId } from './stores/ui.store';

const NAV_ITEMS: ReadonlyArray<{ id: ViewId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'agents', label: 'Agents' },
  { id: 'session', label: 'Session' },
  { id: 'usage', label: 'Usage' },
  { id: 'settings', label: 'Settings' },
];

const VIEWS: Record<ViewId, ComponentType> = {
  dashboard: DashboardView,
  workspace: WorkspaceView,
  agents: AgentsView,
  session: SessionView,
  usage: UsageView,
  settings: SettingsView,
};

export default function App() {
  const activeView = useUiStore((state) => state.activeView);
  const setActiveView = useUiStore((state) => state.setActiveView);
  const ActiveView = VIEWS[activeView];

  return (
    <ThemeProvider>
      <div className="flex h-full">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card shadow-soft">
          <div className="px-5 pb-4 pt-5">
            <p className="text-sm font-semibold tracking-tight">ACUTE-CODE</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">local-first agents</p>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={
                  item.id === activeView
                    ? 'block w-full rounded-md bg-accent px-3 py-2 text-left text-[13px] font-medium text-accent-foreground'
                    : 'block w-full rounded-md px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                }
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="font-mono text-[11px] text-muted-foreground">{activeView}</span>
            <ThemeToggle />
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <ActiveView />
        </main>
      </div>
    </ThemeProvider>
  );
}