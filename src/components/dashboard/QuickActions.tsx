import type { ReactNode } from 'react';
import { Panel } from '../ui/primitives';

interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  hint: string;
  onSelect?: () => void;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-accent">
          <TerminalGlyph />
        </span>
        <span className="text-[12px] font-semibold text-foreground">Quick actions</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onSelect}
            title={action.hint}
            className="w-full rounded-lg border-[1.5px] border-border bg-background px-3 py-2.5 text-left text-[12px] font-medium text-foreground transition-all duration-200 hover:translate-x-0.5 hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <span className="text-accent">{action.icon}</span>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function TerminalGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </svg>
  );
}

