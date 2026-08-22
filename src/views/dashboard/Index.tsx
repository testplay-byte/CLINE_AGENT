import { useMemo } from 'react';
import { BarChart } from '../../components/charts/BarChart';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  ActivityIcon,
  FileCodeIcon,
  FolderIcon,
  MessageSquareIcon,
  PlusIcon,
  SparklesIcon,
  TerminalIcon,
  ZapIcon,
} from '../../components/icons';
import { EmptyState, Panel, Pill } from '../../components/ui/primitives';
import { useUiStore } from '../../stores/ui.store';
import { getGreeting } from '../../lib/theme';

export default function DashboardView() {
  const greeting = useMemo(() => getGreeting(), []);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const showHint = useUiStore((s) => s.showHint);

  return (
    <div className="dot-grid custom-scrollbar h-full overflow-y-auto">
      <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-10">
        <div className="pointer-events-none absolute -top-8 left-0 h-32 w-32 rounded-full bg-accent opacity-[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -top-2 right-6 h-24 w-24 rotate-12 rounded-2xl bg-accent-2 opacity-[0.06] blur-2xl" />

        <header className="animate-fade-in-up mb-8 pt-2">
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.1] tracking-tightest text-foreground">
            {greeting}.
          </h1>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.15] tracking-tightest text-accent [opacity:0.85]">
            Welcome back to <span className="font-bold [opacity:1]">ACUTE CODE</span>
          </h2>
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspace.
          </p>
        </header>

        <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <StatCard value="0" label="Projects" icon={<FolderIcon size={16} />} empty />
          <StatCard value="0" label="Sessions" icon={<MessageSquareIcon size={16} />} empty />
          <StatCard value="0" label="Tokens today" icon={<ZapIcon size={16} />} empty />
          <StatCard value="0" label="API calls" icon={<ActivityIcon size={16} />} empty />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <Panel className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                <ZapIcon size={13} className="text-accent [opacity:0.7]" /> Weekly token usage
              </span>
              <Pill>0 total</Pill>
            </div>
            <BarChart
              data={[]}
              barWidth={28}
              emptyIcon={<ZapIcon size={18} />}
              emptyTitle="No tokens used this week"
            />
          </Panel>

          <QuickActions
            actions={[
              {
                id: 'new-project',
                label: 'New project',
                icon: <PlusIcon size={12} />,
                hint: 'Project creation lands in Phase 2',
                onSelect: () => showHint('Project creation lands in Phase 2 — sidecar API is next.'),
              },
              {
                id: 'new-session',
                label: 'New session',
                icon: <TerminalIcon size={12} />,
                hint: 'Open the session workspace',
                onSelect: () => setActiveView('session'),
              },
              {
                id: 'agent-registry',
                label: 'Open agent registry',
                icon: <SparklesIcon size={12} />,
                hint: 'Browse and edit your agents',
                onSelect: () => setActiveView('agents'),
              },
            ]}
          />
        </div>

        <section className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-foreground">Recent projects</h3>
              <span className="text-[10px] font-medium text-muted-foreground">across workspace</span>
            </div>
            <Panel>
              <EmptyState
                icon={<FolderIcon size={20} />}
                title="No projects yet"
                body="Create your first project from Quick Actions to see it here."
              />
            </Panel>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-foreground">Recent sessions</h3>
              <span className="text-[10px] font-medium text-muted-foreground">latest first</span>
            </div>
            <Panel>
              <EmptyState
                icon={<FileCodeIcon size={20} />}
                title="No sessions yet"
                body="Start a session to watch agents collaborate in real time."
              />
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

