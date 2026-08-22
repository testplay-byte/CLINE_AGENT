import { useState } from 'react';
import type { DemoFileNode } from '../../lib/demo';
import { BracesIcon, ChevronRightIcon, FileCodeIcon, FileTextIcon } from '../icons';

const EXT_COLORS: Record<string, string> = {
  ts: '#3178c6',
  tsx: '#3178c6',
  json: '#f59e0b',
  css: '#a855f7',
  md: '#8a7a68',
};

function FileGlyph({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const color = EXT_COLORS[ext] ?? '#6b7280';
  if (ext === 'json') return <BracesIcon size={13} style={{ color }} />;
  if (ext === 'md' || ext === 'css') return <FileTextIcon size={13} style={{ color }} />;
  return <FileCodeIcon size={13} style={{ color }} />;
}

interface TreeItemProps {
  node: DemoFileNode;
  depth: number;
  selectedId?: string;
  onSelect: (node: DemoFileNode) => void;
}

function TreeItem({ node, depth, selectedId, onSelect }: TreeItemProps) {
  const [open, setOpen] = useState(depth === 0);
  const isFolder = node.type === 'folder';
  const isSelected = node.id === selectedId;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isFolder ? setOpen((o) => !o) : onSelect(node))}
        className={`flex h-[30px] w-full items-center gap-1.5 rounded-lg pr-2 text-left transition-colors ${
          isSelected ? 'bg-accent-soft' : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: depth * 12 + 10 }}
      >
        {isFolder ? (
          <ChevronRightIcon
            size={11}
            className={`shrink-0 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-[11px] shrink-0" />
        )}
        {isFolder ? (
          <span className={`grid h-4 w-4 shrink-0 place-items-center rounded ${open ? 'text-accent' : 'text-muted-foreground'}`}>
            <span className="block h-2 w-2.5 rounded-[3px] border-[1.5px] border-current" />
          </span>
        ) : (
          <FileGlyph name={node.name} />
        )}
        <span
          className={`truncate font-mono text-[11.5px] ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
        >
          {node.name}
        </span>
      </button>

      {isFolder && open && node.children ? (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FileTree({
  nodes,
  projectName,
  selectedId,
  onSelect,
}: {
  nodes: DemoFileNode[];
  projectName: string;
  selectedId?: string;
  onSelect: (node: DemoFileNode) => void;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center gap-2 border-b border-border px-3.5 pb-2.5">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
          {projectName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate text-[12px] font-semibold text-muted-foreground">{projectName}</span>
      </div>
      <div className="px-1.5">
        {nodes.map((node) => (
          <TreeItem key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
