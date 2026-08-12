'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileCode2, Braces, FileText, FolderOpen, Folder } from 'lucide-react';
import { useTheme } from '@/lib/dashboard-helpers';
import { useProjectChatStore, type FileNode } from '@/lib/project-chat-store';

const FILE_COLORS: Record<string, string> = {
  tsx: '#3178C6',
  ts: '#3178C6',
  js: '#F7DF1E',
  jsx: '#61DAFB',
  json: '#F59E0B',
  css: '#A855F7',
  scss: '#CF649A',
  html: '#E34F26',
  md: '#6B7280',
  py: '#3776AB',
  rs: '#CE422B',
  go: '#00ADD8',
  env: '#EF4444',
  yaml: '#CB171E',
  yml: '#CB171E',
  toml: '#9C4221',
  sql: '#4479A1',
  sh: '#4EAA25',
  svg: '#FFB13B',
  png: '#A4C639',
  jpg: '#A4C639',
  gif: '#A4C639',
};

function FileIcon({ name, isFolder, isExpanded }: { name: string; isFolder: boolean; isExpanded?: boolean }) {
  if (isFolder) {
    return isExpanded
      ? <FolderOpen size={14} style={{ color: '#F59E0B' }} />
      : <Folder size={14} style={{ color: '#F59E0B' }} />;
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const color = FILE_COLORS[ext] || '#6B7280';

  if (ext === 'json') return <Braces size={14} style={{ color }} />;
  if (ext === 'md') return <FileText size={14} style={{ color }} />;
  if (['css', 'scss', 'html', 'svg'].includes(ext)) return <FileText size={14} style={{ color }} />;
  if (['py', 'rs', 'go', 'sh', 'sql', 'toml', 'yaml', 'yml'].includes(ext)) return <FileCode2 size={14} style={{ color }} />;
  return <FileCode2 size={14} style={{ color }} />;
}

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const { isDark, text, muted, accent, inputBg } = useTheme();
  const selectedFilePath = useProjectChatStore((s) => s.selectedFilePath);
  const selectFile = useProjectChatStore((s) => s.selectFile);
  const expandedFolders = useProjectChatStore((s) => s.expandedFolders);
  const toggleFolder = useProjectChatStore((s) => s.toggleFolder);
  const loadFileContent = useProjectChatStore((s) => s.loadFileContent);
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedFilePath === node.path;

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.id);
    } else {
      selectFile(node.id, node.path || undefined);
      if (node.path) {
        loadFileContent(node.path);
      }
    }
  };

  return (
    <div>
      <button
        className="w-full flex items-center gap-2 h-[34px] px-2 text-left transition-colors group rounded-lg mx-1.5"
        style={{
          paddingLeft: (depth * 14 + 8) + 'px',
          background: isSelected ? (isDark ? accent + '18' : accent + '14') : 'transparent',
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = isDark ? inputBg : 'rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        {isFolder && (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="shrink-0"
          >
            <ChevronRight size={12} style={{ color: muted }} />
          </motion.div>
        )}
        {!isFolder && <span className="w-3" />}
        <FileIcon name={node.name} isFolder={isFolder} isExpanded={isExpanded} />
        <span
          className="text-[12.5px] font-mono truncate"
          style={{ color: isSelected ? text : muted, fontWeight: isSelected ? 500 : 400 }}
        >
          {node.name}
        </span>
        {!isFolder && node.lines && (
          <span className="ml-auto text-[10px] font-mono opacity-50" style={{ color: muted }}>
            {node.lines}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isFolder && isExpanded && node.children && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child) => (
              <FileTreeItem key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ExplorerPanel() {
  const { muted, accent, border } = useTheme();
  const files = useProjectChatStore((s) => s.files);
  const projectFolder = useProjectChatStore((s) => s.projectFolder);
  const openProjectFolder = useProjectChatStore((s) => s.openProjectFolder);
  const refreshExplorer = useProjectChatStore((s) => s.refreshExplorer);
  const isElectron = typeof window !== 'undefined' && !!(window as any).acuteAgent?.isElectron;

  return (
    <div className="py-2">
      {/* Project name */}
      <div className="px-3.5 pb-2.5 mb-1 border-b" style={{ borderColor: border }}>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-md grid place-items-center text-[10px] font-bold"
            style={{ background: accent, color: isElectron ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#000' : '#fff') : '#fff' }}
          >
            A
          </div>
          <span className="text-[12px] font-semibold truncate" style={{ color: muted }}>
            {projectFolder ? projectFolder.split(/[\\/]/).pop() : 'No project open'}
          </span>
          {isElectron && (
            <button
              onClick={async () => {
                await openProjectFolder();
                setTimeout(refreshExplorer, 500);
              }}
              className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-colors"
              style={{ borderColor: border, color: muted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = border; }}
              title="Open folder"
            >
              Open
            </button>
          )}
        </div>
      </div>

      {files.length > 0 ? (
        files.map((node) => (
          <FileTreeItem key={node.id} node={node} />
        ))
      ) : (
        <div className="px-4 py-8 text-center">
          <div className="text-[12px]" style={{ color: muted }}>
            {projectFolder
              ? 'No files found (or still loading...)'
              : 'Open a project folder to browse files'}
          </div>
        </div>
      )}
    </div>
  );
}
