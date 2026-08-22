import { useCallback, useState } from 'react';
import { AgentChatPanel } from '../../components/chat/AgentChatPanel';
import { CheckSquareIcon, FilesIcon, LayersIcon } from '../../components/icons';
import { CodePane } from '../../components/workspace/CodePane';
import { FileTree } from '../../components/workspace/FileTree';
import { ThreePane } from '../../components/workspace/ThreePane';
import { TodoMiniList } from '../../components/workspace/TodoPanel';
import { DEMO_PROJECT_NAME, DEMO_TREE } from '../../lib/demo';
import type { DemoFileNode } from '../../lib/demo';
import { Pill } from '../../components/ui/primitives';

export default function WorkspaceView() {
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
        <span className="label-caps px-1">Project</span>
        <Pill tone="accent">demo tree</Pill>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="flex items-center gap-2">
            <FilesIcon size={13} className="text-accent" />
            <span className="label-caps">Explorer</span>
          </span>
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

  const right = <AgentChatPanel />;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center gap-2.5 px-3">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent font-mono text-[11px] font-bold text-accent-foreground">
          {DEMO_PROJECT_NAME.charAt(0).toUpperCase()}
        </span>
        <span className="text-[13px] font-semibold text-foreground">{DEMO_PROJECT_NAME}</span>
        <span className="chip-mono">~/projects/{DEMO_PROJECT_NAME}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <LayersIcon size={12} /> 3-pane workspace · demo data
        </span>
      </header>
      <ThreePane left={left} center={center} right={right} />
    </div>
  );
}
