import { BarChart } from '../../components/charts/BarChart';
import { ActivityIcon, ClockIcon, MessageSquareIcon, ZapIcon } from '../../components/icons';
import { EmptyState, Panel, Pill, SectionCard } from '../../components/ui/primitives';
import { useUsageStore } from '../../stores/usage.store';
import { fmtTokens } from '../../lib/theme';

export default function UsageView() {
  const demoMode = useUsageStore((s) => s.demoMode);
  const setDemoMode = useUsageStore((s) => s.setDemoMode);
  const daily = useUsageStore((s) => s.daily());
  const totals = useUsageStore((s) => s.totals());
  const rows = useUsageStore((s) => s.rows());
  const sessions = useUsageStore((s) => s.sessions());

  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-black tracking-tightest text-foreground">Usage</h1>
            <p className="mt-1 text-[12px] font-medium text-muted-foreground">
              Token spend and request volume across your agents.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={demoMode}
            onClick={() => setDemoMode(!demoMode)}
            className={`flex h-8 items-center gap-2 rounded-full border-[1.5px] px-3 text-[11px] font-bold transition-colors ${
              demoMode ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-card text-muted-foreground'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${demoMode ? 'bg-accent animate-pulse-dot' : 'bg-border'}`} />
            Demo data {demoMode ? 'on' : 'off'}
          </button>
        </header>

        <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <StatTile value={fmtTokens(totals.tokens)} label="Total tokens" icon={<ZapIcon size={15} />} empty={totals.tokens === 0} />
          <StatTile value={`$${totals.cost.toFixed(2)}`} label="Est. cost" icon={<ActivityIcon size={15} />} empty={totals.cost === 0} />
          <StatTile value={String(totals.requests)} label="Requests" icon={<MessageSquareIcon size={15} />} empty={totals.requests === 0} />
          <StatTile
            value={totals.agents > 0 ? fmtTokens(Math.round(totals.tokens / totals.agents)) : '0'}
            label="Avg / agent"
            icon={<ClockIcon size={15} />}
            empty={totals.agents === 0}
          />
        </div>

        <Panel className="mb-5 p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
              <ZapIcon size={13} className="text-accent [opacity:0.7]" /> Tokens by day · 14-day range
            </span>
            <Pill tone={demoMode ? 'accent' : 'muted'}>{demoMode ? `${fmtTokens(totals.tokens)} total` : 'no data'}</Pill>
          </div>
          <BarChart
            data={daily}
            height={170}
            barWidth={22}
            barGap={7}
            emptyIcon={<ZapIcon size={18} />}
            emptyTitle="No usage recorded — flip on demo data to preview"
          />
        </Panel>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <SectionCard title="By agent & model" caption="Token share per agent">
            {rows.length === 0 ? (
              <EmptyState
                icon={<ActivityIcon size={20} />}
                title="Nothing to break down yet"
                body="Run a session with your agents and the per-model split appears here."
              />
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="label-caps border-b border-border">
                    <th className="pb-2 pr-3 font-semibold">Agent</th>
                    <th className="pb-2 pr-3 font-semibold">Model</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Tokens</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Req</th>
                    <th className="pb-2 text-right font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.agent}-${row.model}`} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 text-[12px] font-semibold text-foreground">{row.agent}</td>
                      <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{row.model}</td>
                      <td className="py-2 pr-3 text-right font-mono text-[11px] text-foreground">{fmtTokens(row.tokens)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-[11px] text-muted-foreground">{row.requests}</td>
                      <td className="py-2 text-right font-mono text-[11px] text-accent">${row.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Session costs" caption="Most recent first">
            {sessions.length === 0 ? (
              <EmptyState
                icon={<ClockIcon size={20} />}
                title="No session spend yet"
                body="Completed sessions list their token totals and estimated cost here."
              />
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-border bg-input px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-semibold text-foreground">{session.title}</p>
                      <span className="shrink-0 font-mono text-[11px] font-bold text-accent">${session.cost.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <span>{session.agent}</span>·<span>{fmtTokens(session.tokens)} tokens</span>·<span>{session.when}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  value,
  label,
  icon,
  empty,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  empty: boolean;
}) {
  return (
    <Panel className="p-3.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className={`truncate text-xl font-bold tracking-tight ${empty ? 'text-muted-foreground' : 'text-foreground'}`}>
            {value}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</p>
        </div>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            empty ? 'border border-dashed border-border bg-background text-muted-foreground' : 'bg-accent-soft text-accent'
          }`}
        >
          {icon}
        </span>
      </div>
    </Panel>
  );
}

