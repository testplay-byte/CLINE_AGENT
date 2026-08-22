import { useCallback, useState } from 'react';
import { AgentChatPanel } from '../../components/chat/AgentChatPanel';
import { CheckSquareIcon, FilesIcon } from '../../components/icons';
import { CodePane } from '../../components/workspace/CodePane';
import { FileTree } from '../../components/workspace/FileTree';
import { ThreePane } from '../../components/workspace/ThreePane';
import { TodoMiniList } from '../../components/workspace/TodoPanel';
import { DEMO_PROJECT_NAME, DEMO_TREE } from '../../lib/demo';
import type { DemoFileNode } from '../../lib/demo';
import { Pill } from '../../components/ui/primitives';

const SESSION_TITLE = 'Rate-limit the login route';

const ROSTER = [
  { id: 'nova', name: 'Nova', role: 'Coder' },
  { id: 'scout', name: 'Scout', role: 'Researcher' },
  { id: 'lens', name: 'Lens', role: 'Reviewer' },
];

export default function SessionView() {
  const [openFiles, setOpenFiles] = useState<DemoFileNode[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const openFile = useCallback((node: DemoFileNode) => {
    setOpenFiles((prev) => (prev.some((f) => f.id === node.id) ? prev : [...prev.slice(-2), node]));
    setActiveId(node.id);
  }, []);

  const selectTab = useCallback((id: string) => setActiveId(id), []);

  const closeTab = useCallback(
    (id: string) => {
      setOpenFiles((prev) => {
        const next = prev.filter((f) => f.id !== id);
        setActiveId((current) => (current === id ? next[next.length - 1]?.id : current));
        return next;
      });
    },
    [],
  );

  const left = (
    <>
      <div className="flex h-9 shrink-0 items-center justify-between px-2.5">
        <span className="label-caps px-1">{DEMO_PROJECT_NAME}</span>
        <Pill tone="accent">session</Pill>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
          <FilesIcon size={13} className="text-accent" />
          <span className="label-caps">Explorer</span>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <FileTree nodes={DEMO_TREE} projectName={DEMO_PROJECT_NAME} selectedId={activeId} onSelect={openFile} />
        </div>
      </div>
      <div className="max-h-[45%] shrink-0 border-t border-border">
        <div className="flex h-9 items-center gap-2 border-b border-border px-3">
          <CheckSquareIcon size={13} className="text-accent" />
          <span className="label-caps">To-do</span>
        </div>
        <div className="custom-scrollbar max-h-[240px] overflow-y-auto">
          <TodoMiniList />
        </div>
      </div>
    </>
  );

  const center = <CodePane openFiles={openFiles} activeId={activeId} onSelectTab={selectTab} onCloseTab={closeTab} />;

  const right = <AgentChatPanel title="Nova" statusLabel="running" />;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center gap-2.5 px-3">
        <span className="truncate text-[13px] font-semibold text-foreground">{SESSION_TITLE}</span>
        <span className="rounded-lg bg-success-soft px-1.5 py-0.5 font-mono text-[10px] text-success">running</span>
        <span className="ml-auto flex items-center -space-x-1.5">
          {ROSTER.map((agent) => (
            <span
              key={agent.id}
              title={`${agent.name} · ${agent.role}`}
              className="grid h-6 w-6 place-items-center rounded-lg border border-border bg-card font-mono text-[10px] font-bold text-accent"
            >
              {agent.name.charAt(0)}
            </span>
          ))}
        </span>
      </header>
      <ThreePane left={left} center={center} right={right} />
    </div>
  );
}
