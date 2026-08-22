import type { ReactNode } from 'react';
import { Panel } from '../ui/primitives';

export function StatCard({
  value,
  label,
  icon,
  empty = false,
}: {
  value: string;
  label: string;
  icon: ReactNode;
  empty?: boolean;
}) {
  return (
    <Panel className="p-3.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p
            className={`truncate text-xl font-bold tracking-tight ${empty ? 'text-muted-foreground' : 'text-foreground'}`}
          >
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

