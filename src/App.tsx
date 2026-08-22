import type { ComponentType } from 'react';
import { ThemeProvider, ModeToggle } from './components/theme/ThemeProvider';
import { SparklesIcon } from './components/icons';
import AgentsView from './views/agents/Index';
import DashboardView from './views/dashboard/Index';
import SessionView from './views/session/Index';
import SettingsView from './views/settings/Index';
import SetupView from './views/setup/Index';
import UsageView from './views/usage/Index';
import WorkspaceView from './views/workspace/Index';
import { useSettingsStore } from './stores/settings.store';
import { useUiStore } from './stores/ui.store';
import type { ViewId } from './stores/ui.store';

const NAV_ITEMS: ReadonlyArray<{ id: ViewId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'session', label: 'Session' },
  { id: 'agents', label: 'Agents' },
  { id: 'usage', label: 'Usage' },
  { id: 'settings', label: 'Settings' },
];

const VIEWS: Record<Exclude<ViewId, 'setup'>, ComponentType> = {
  dashboard: DashboardView,
  workspace: WorkspaceView,
  session: SessionView,
  agents: AgentsView,
  usage: UsageView,
  settings: SettingsView,
};

export default function App() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const hint = useUiStore((s) => s.hint);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  if (!onboardingComplete || activeView === 'setup') {
    return (
      <ThemeProvider>
        <SetupView />
      </ThemeProvider>
    );
  }

  const ActiveView = VIEWS[activeView] ?? DashboardView;

  return (
    <ThemeProvider>
      <div className="flex h-full overflow-hidden">
        <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
          <div className="px-4 pb-4 pt-5">
            <p className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent text-accent-foreground shadow-bento-sm">
                <SparklesIcon size={12} />
              </span>
              ACUTE CODE
            </p>
            <p className="mt-1.5 pl-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              local-first agents
            </p>
          </div>

          <nav className="flex-1 space-y-0.5 px-2.5">
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeView;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center justify-between border-t border-border px-3 py-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">v0.1.0</span>
            <ModeToggle compact />
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-hidden">
          <ActiveView />
          {hint ? (
            <div className="pointer-events-none absolute bottom-5 left-1/2 z-50 -translate-x-1/2 animate-fade-in-up rounded-full border border-border bg-card px-4 py-2 text-[11px] font-semibold text-foreground shadow-drag">
              {hint}
            </div>
          ) : null}
        </main>
      </div>
    </ThemeProvider>
  );
}
