'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot, Sparkles, FileCode2, Search, Terminal, Edit3,
  ArrowUp, Paperclip, Square, AlertTriangle, CheckCircle2, XCircle,
  FolderOpen, Wrench,
} from 'lucide-react';
import { useTheme } from '@/lib/dashboard-helpers';
import {
  useProjectChatStore,
  MODEL_OPTIONS,
  type ChatMessage,
} from '@/lib/project-chat-store';
import { useScrollFade } from '@/lib/useScrollFade';

const ease = [0.25, 0.1, 0.25, 1] as const;

const msgVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  read_file: <FileCode2 size={12} />,
  write_to_file: <FileCode2 size={12} />,
  apply_diff: <Edit3 size={12} />,
  execute_command: <Terminal size={12} />,
  list_files: <FolderOpen size={12} />,
  search_files: <Search size={12} />,
};

function UserMessage({ msg }: { msg: ChatMessage }) {
  const { isDark, accent } = useTheme();
  return (
    <motion.div className="flex justify-end" variants={msgVariants} initial="initial" animate="animate">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-[1.5]"
        style={{ background: accent, color: isDark ? '#000' : '#fff' }}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

function RichText({ content }: { content: string }) {
  const { isDark, text, accent } = useTheme();
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div key={`cb-${i}`} className="my-2 rounded-xl overflow-hidden border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            {codeBlockLang && (
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', color: accent }}>
                {codeBlockLang}
              </div>
            )}
            <pre className="px-3 py-2.5 text-[11.5px] font-mono leading-[1.6] overflow-x-auto" style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: text }}>
              {codeBlockLines.join('\n')}
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Regular text with inline formatting
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const lineEl: React.ReactNode[] = [];

    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      if (j % 2 === 1) {
        lineEl.push(<strong key={`b-${i}-${j}`}>{part}</strong>);
        continue;
      }
      const codeParts = part.split(/`(.*?)`/g);
      for (let k = 0; k < codeParts.length; k++) {
        const cp = codeParts[k];
        if (k % 2 === 1) {
          lineEl.push(
            <code
              key={`c-${i}-${j}-${k}`}
              className="px-1.5 py-0.5 rounded-md text-[11.5px] font-mono"
              style={{ background: isDark ? accent + '20' : accent + '14', color: text }}
            >
              {cp}
            </code>
          );
        } else if (cp) {
          lineEl.push(<span key={`s-${i}-${j}-${k}`}>{cp}</span>);
        }
      }
    }

    if (i > 0 && !inCodeBlock) {
      elements.push(<div key={`br-${i}`} className="mt-1.5" />);
    }
    elements.push(<span key={`l-${i}`}>{lineEl}</span>);
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <pre key="unclosed-code" className="my-2 px-3 py-2 rounded-xl text-[11.5px] font-mono leading-[1.6] overflow-x-auto border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', color: text }}>
        {codeBlockLines.join('\n')}
      </pre>
    );
  }

  return <>{elements}</>;
}

function AiMessage({ msg }: { msg: ChatMessage }) {
  const { card, text, border, isDark } = useTheme();
  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div
        className="rounded-2xl px-3.5 py-3 text-[13px] leading-[1.6] border"
        style={{ background: card, borderColor: border, color: text }}
      >
        <RichText content={msg.content} />
        {msg.isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 rounded-sm animate-pulse" style={{ background: text, opacity: 0.6 }} />
        )}
      </div>
    </motion.div>
  );
}

function ThoughtMessage({ msg }: { msg: ChatMessage }) {
  const { text, border, muted, inputBg } = useTheme();
  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div
        className="rounded-2xl border px-3.5 py-3 text-[12.5px] leading-[1.55]"
        style={{ background: inputBg, borderColor: border, color: muted }}
      >
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: text }}>
          <CircleDot size={12} />
          Thought
        </div>
        <div>{msg.content}</div>
      </div>
    </motion.div>
  );
}

function ActionPillsMessage({ msg }: { msg: ChatMessage }) {
  const { isDark, bg, card, border, muted } = useTheme();
  const ACTION_ICONS: Record<string, React.ReactNode> = {
    file: <FileCode2 size={11} />,
    search: <Search size={11} />,
    edit: <Edit3 size={11} />,
    terminal: <Terminal size={11} />,
  };
  if (!msg.actions) return null;
  return (
    <motion.div className="flex flex-wrap gap-1.5" variants={msgVariants} initial="initial" animate="animate">
      {msg.actions.map((action, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full border font-mono text-[11px]"
          style={{ background: isDark ? bg : card, borderColor: border, color: muted }}
        >
          {ACTION_ICONS[action.icon]}
          <span>{action.label}</span>
          <span className="opacity-50">&middot; {action.duration}</span>
        </div>
      ))}
    </motion.div>
  );
}

function DiffMessage({ msg }: { msg: ChatMessage }) {
  const { bg, border, muted } = useTheme();
  if (!msg.diff) return null;
  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div className="rounded-2xl border overflow-hidden" style={{ background: bg, borderColor: border }}>
        <div
          className="h-8 flex items-center justify-between px-3 border-b font-mono text-[11px]"
          style={{ borderColor: border, color: muted }}
        >
          <span>{msg.diff.fileName} {msg.diff.additions} {msg.diff.deletions}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: msg.diff.status === 'applied' ? '#22c55e' : msg.diff.status === 'rejected' ? '#ef4444' : '#eab308' }} />
            {msg.diff.status}
          </span>
        </div>
        <div className="p-3 font-mono text-[11px] leading-[1.7] space-y-0.5">
          {msg.diff.context && <div style={{ color: muted }}>{msg.diff.context}</div>}
          {msg.diff.additions && <div style={{ color: '#22c55e' }}>{msg.diff.additions}</div>}
          {msg.diff.deletions && <div style={{ color: '#ef4444' }}>{msg.diff.deletions}</div>}
        </div>
      </div>
    </motion.div>
  );
}

function ToolUseMessage({ msg }: { msg: ChatMessage }) {
  const { isDark, bg, border, muted, accent, inputBg } = useTheme();
  const icon = TOOL_ICONS[msg.toolName || ''] || <Wrench size={12} />;
  const argsStr = msg.toolArgs
    ? Object.entries(msg.toolArgs).map(([k, v]) => {
        const val = typeof v === 'string' ? v.slice(0, 50) : JSON.stringify(v).slice(0, 50);
        return `${k}: ${val}${val.length >= 50 ? '...' : ''}`;
      }).join('  ')
    : '';

  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div
        className="inline-flex items-center gap-2 h-7 px-3 rounded-full border font-mono text-[11px]"
        style={{ background: isDark ? inputBg : bg, borderColor: border, color: muted }}
      >
        {icon}
        <span className="font-semibold" style={{ color: accent }}>{msg.toolName}</span>
        <span className="truncate max-w-[200px]">{argsStr}</span>
      </div>
    </motion.div>
  );
}

function ToolResultMessage({ msg }: { msg: ChatMessage }) {
  const { bg, border, muted, isDark } = useTheme();
  const isError = msg.toolIsError;
  const isTerminal = msg.toolName === 'execute_command';

  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: isDark ? 'rgba(0,0,0,0.3)' : bg,
          borderColor: isError ? 'rgba(239,68,68,0.3)' : border,
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 border-b text-[10px] font-mono uppercase tracking-wider"
          style={{ borderColor: border, color: isError ? '#ef4444' : '#22c55e' }}
        >
          {isError ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
          {msg.toolName} {isError ? 'failed' : 'completed'}
        </div>
        <pre className="px-3 py-2 text-[11px] font-mono leading-[1.6] overflow-x-auto max-h-[200px] overflow-y-auto" style={{ color: muted }}>
          {msg.content}
        </pre>
      </div>
    </motion.div>
  );
}

function ErrorMessage({ msg }: { msg: ChatMessage }) {
  const { bg, border, text } = useTheme();
  return (
    <motion.div variants={msgVariants} initial="initial" animate="animate">
      <div
        className="rounded-2xl border px-3.5 py-3 text-[13px] leading-[1.6]"
        style={{ background: '#fef2f220', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
      >
        <RichText content={msg.content} />
      </div>
    </motion.div>
  );
}

function AgentThinking() {
  const { text, border, muted, accent, inputBg } = useTheme();
  const agentStatus = useProjectChatStore((s) => s.agentStatus);
  const selectedModelId = useProjectChatStore((s) => s.selectedModelId);
  const model = MODEL_OPTIONS.find((m) => m.id === selectedModelId);
  const isAgentRunning = useProjectChatStore((s) => s.isAgentRunning);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 px-1"
    >
      <div className="w-7 h-7 rounded-xl grid place-items-center border shrink-0" style={{ borderColor: border, background: inputBg }}>
        <Sparkles size={13} style={{ color: accent }} />
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-semibold" style={{ color: text }}>Nova</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-lg border font-mono" style={{ background: inputBg, borderColor: border, color: muted }}>
          {model?.name || 'claude-4'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-mono ml-auto" style={{ color: muted }}>
        <span>{agentStatus}</span>
        <span className="flex gap-0.5">
          {[0, 0.15, 0.3].map((delay, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: muted, animation: 'bounceDot 1s infinite ' + delay + 's' }}
            />
          ))}
        </span>
        {isAgentRunning && (
          <button
            onClick={() => useProjectChatStore.getState().stopAgent()}
            className="w-5 h-5 rounded-md grid place-items-center border hover:bg-red-500/20 transition-colors"
            style={{ borderColor: border }}
            title="Stop agent"
          >
            <Square size={8} fill="currentColor" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WelcomeMessage() {
  const { card, text, border, muted, accent, inputBg } = useTheme();
  const projectFolder = useProjectChatStore((s) => s.projectFolder);
  const openProjectFolder = useProjectChatStore((s) => s.openProjectFolder);
  const isElectron = typeof window !== 'undefined' && !!(window as any).acuteAgent?.isElectron;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="space-y-4 px-1">
        {/* Hero greeting */}
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3" style={{ background: accent + '14', border: '1.5px solid ' + accent + '30' }}>
            <Sparkles size={20} style={{ color: accent }} />
          </div>
          <div className="text-[15px] font-semibold" style={{ color: text }}>Nova is ready</div>
          <div className="text-[12px] mt-1" style={{ color: muted }}>
            {projectFolder
              ? `Working in ${projectFolder.split(/[\\/]/).pop()}`
              : 'Open a project folder to get started'}
          </div>
        </div>

        {/* Project folder button */}
        {!projectFolder && isElectron && (
          <button
            onClick={openProjectFolder}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
            style={{ background: inputBg, borderColor: border }}
          >
            <FolderOpen size={18} style={{ color: accent }} />
            <div className="text-left">
              <div className="text-[13px] font-medium" style={{ color: text }}>Open Project Folder</div>
              <div className="text-[11px]" style={{ color: muted }}>Select a folder to give Nova access to your files</div>
            </div>
          </button>
        )}

        {/* Quick suggestions */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: muted }}>
            Quick actions
          </div>
          {projectFolder ? [
            'Explain the project structure',
            'Find bugs in the codebase',
            'Run the test suite',
            'Refactor the main module',
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                useProjectChatStore.getState().setInputMessage(suggestion);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
              style={{ color: muted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = inputBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-[12px]">{suggestion}</span>
            </button>
          )) : [
            'Help me set up a Next.js project',
            'Explain how React hooks work',
            'Write a REST API with TypeScript',
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                useProjectChatStore.getState().setInputMessage(suggestion);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
              style={{ color: muted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = inputBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-[12px]">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MessageRenderer({ msg }: { msg: ChatMessage }) {
  switch (msg.type) {
    case 'user': return <UserMessage msg={msg} />;
    case 'ai': return <AiMessage msg={msg} />;
    case 'thought': return <ThoughtMessage msg={msg} />;
    case 'actions': return <ActionPillsMessage msg={msg} />;
    case 'diff': return <DiffMessage msg={msg} />;
    case 'tool_use': return <ToolUseMessage msg={msg} />;
    case 'tool_result': return <ToolResultMessage msg={msg} />;
    case 'error': return <ErrorMessage msg={msg} />;
    case 'terminal': return <ToolResultMessage msg={msg} />;
    default: return null;
  }
}

export function AgentChatPanel() {
  const { isDark, bg, card, text, border, muted, accent, inputBg } = useTheme();
  const messages = useProjectChatStore((s) => s.messages);
  const isAgentThinking = useProjectChatStore((s) => s.isAgentThinking);
  const isAgentRunning = useProjectChatStore((s) => s.isAgentRunning);
  const inputMessage = useProjectChatStore((s) => s.inputMessage);
  const setInputMessage = useProjectChatStore((s) => s.setInputMessage);
  const sendMessage = useProjectChatStore((s) => s.sendMessage);
  const selectedModelId = useProjectChatStore((s) => s.selectedModelId);
  const model = MODEL_OPTIONS.find((m) => m.id === selectedModelId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollFade(scrollRef);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isAgentThinking]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessage();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden rounded-2xl border" style={{ borderColor: border, background: card }}>
      <div
        className="shrink-0 flex items-center gap-2.5 h-11 px-3 border-b rounded-t-2xl"
        style={{ borderColor: border }}
      >
        <div className="w-6 h-6 rounded-lg grid place-items-center" style={{ background: accent, color: isDark ? '#000' : '#fff' }}>
          <Sparkles size={12} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: text }}>Nova</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-lg border font-mono" style={{ background: inputBg, borderColor: border, color: muted }}>
          {model?.name || 'Claude 4'}
        </span>
        {isAgentRunning && (
          <span
            className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-lg flex items-center gap-1.5"
            style={{ color: '#22c55e', background: '#22c55e14' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            running
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, ' + card + ', transparent)' }}
        />
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-3 auto-scroll">
          {!hasMessages && <WelcomeMessage />}

          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageRenderer key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>

          <AnimatePresence>{isAgentThinking && <AgentThinking />}</AnimatePresence>
        </div>
      </div>

      <div className="shrink-0 p-3 rounded-b-2xl">
        <div
          className="flex items-center gap-2 p-1.5 rounded-2xl border"
          style={{ background: bg, borderColor: border }}
        >
          <button
            className="w-8 h-8 rounded-xl grid place-items-center border shrink-0 transition-colors"
            style={{ background: inputBg, borderColor: border, color: muted }}
            aria-label="Attach file"
          >
            <Paperclip size={13} />
          </button>
          <input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova to code, debug, refactor..."
            className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            style={{ color: text }}
            disabled={isAgentRunning}
          />
          <button
            onClick={handleSend}
            disabled={isAgentRunning || !inputMessage.trim()}
            className="w-8 h-8 rounded-xl grid place-items-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={{
              background: inputMessage.trim() && !isAgentRunning ? accent : inputBg,
              color: inputMessage.trim() && !isAgentRunning ? (isDark ? '#000' : '#fff') : muted,
              border: '1px solid ' + (inputMessage.trim() && !isAgentRunning ? accent : border),
            }}
            aria-label="Send message"
          >
            <ArrowUp size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] font-mono" style={{ color: muted }}>
            {'\u2318K to focus \u00B7 \u21B5 to send'}
          </span>
          <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: muted }}>
            Agent
          </span>
        </div>
      </div>
    </div>
  );
}
