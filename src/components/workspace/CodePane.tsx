import type { DemoFileNode } from '../../lib/demo';
import { XIcon } from '../icons';
import { EmptyState } from '../ui/primitives';
import { FileCodeIcon } from '../icons';

export function CodePane({
  openFiles,
  activeId,
  onSelectTab,
  onCloseTab,
}: {
  openFiles: DemoFileNode[];
  activeId?: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}) {
  const active = openFiles.find((f) => f.id === activeId);
  const lines = active?.content ? active.content.split('\n') : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-1.5">
        {openFiles.length === 0 ? (
          <span className="px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">editor</span>
        ) : (
          openFiles.map((file) => {
            const isActive = file.id === activeId;
            return (
              <span
                key={file.id}
                className={`group flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 font-mono text-[11px] transition-colors ${
                  isActive
                    ? 'border-border bg-input text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                <button type="button" className="flex items-center gap-1.5" onClick={() => onSelectTab(file.id)}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-accent' : 'bg-border'}`} />
                  {file.name}
                </button>
                <button
                  type="button"
                  aria-label={`Close ${file.name}`}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={() => onCloseTab(file.id)}
                >
                  <XIcon size={10} />
                </button>
              </span>
            );
          })
        )}
      </div>

      {active ? (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto bg-input p-3">
          <pre className="font-mono text-[11.5px] leading-[1.7] text-foreground">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 shrink-0 select-none pr-3 text-right text-muted-foreground">{i + 1}</span>
                <code className="whitespace-pre">{line || ' '}</code>
              </div>
            ))}
          </pre>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 place-items-center">
          <EmptyState
            icon={<FileCodeIcon size={20} />}
            title="Select a file"
            body="Pick a file from the explorer to preview its contents here."
          />
        </div>
      )}

      <div className="flex h-7 shrink-0 items-center justify-between border-t border-border px-3">
        <span className="font-mono text-[10px] text-muted-foreground">{active ? `${active.name} · ${active.lang ?? 'text'}` : 'no file open'}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{active ? `${lines.length} lines` : '—'}</span>
      </div>
    </div>
  );
}

