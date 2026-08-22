import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { DEMO_AGENT_MODEL, DEMO_AGENT_NAME, DEMO_CONVERSATION } from '../../lib/demo';
import type { DemoAction, DemoMessage } from '../../lib/demo';
import {
  ArrowUpIcon,
  BracesIcon,
  ChevronRightIcon,
  CircleDotIcon,
  FileCodeIcon,
  PaperclipIcon,
  SearchIcon,
  SparklesIcon,
  TerminalIcon,
} from '../icons';

const ACTION_GLYPHS: Record<DemoAction['icon'], ReactNode> = {
  file: <FileCodeIcon size={11} />,
  search: <SearchIcon size={11} />,
  edit: <BracesIcon size={11} />,
  terminal: <TerminalIcon size={11} />,
};

function RichText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded-md bg-accent-soft px-1.5 py-0.5 font-mono text-[11.5px]">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function UserBubble({ message }: { message: DemoMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-[13px] leading-[1.5] text-accent-foreground">
        {message.content}
      </div>
    </div>
  );
}

function AiBubble({ message }: { message: DemoMessage }) {
  return (
    <div className="rounded-2xl border border-border bg-input px-3.5 py-3 text-[13px] leading-[1.6] text-foreground">
      <RichText content={message.content ?? ''} />
    </div>
  );
}

function ThoughtBlock({ message }: { message: DemoMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-muted px-3.5 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 text-left"
        aria-expanded={open}
      >
        <ChevronRightIcon size={11} className={`text-muted-foreground transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
        <CircleDotIcon size={12} className="text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Thought</span>
      </button>
      {open ? (
        <p className="mt-2 animate-fade-in font-mono text-[11.5px] italic leading-[1.6] text-muted-foreground">
          {message.content}
        </p>
      ) : null}
    </div>
  );
}

function ActionPillRow({ message }: { message: DemoMessage }) {
  if (!message.actions) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {message.actions.map((action, i) => (
        <span
          key={i}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-3 font-mono text-[11px] text-muted-foreground"
        >
          <span className="text-accent">{ACTION_GLYPHS[action.icon]}</span>
          <span>{action.label}</span>
          <span className="opacity-50">· {action.detail}</span>
          <span
            className={`ml-0.5 h-1.5 w-1.5 rounded-full ${
              action.status === 'ok' ? 'bg-success' : action.status === 'running' ? 'bg-accent animate-pulse-dot' : 'bg-border'
            }`}
          />
        </span>
      ))}
    </div>
  );
}

function DiffCard({ message }: { message: DemoMessage }) {
  const diff = message.diff;
  if (!diff) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex h-8 items-center justify-between border-b border-border px-3 font-mono text-[11px] text-muted-foreground">
        <span className="truncate">
          {diff.fileName} <span className="text-diff-add">+{diff.additions}</span>{' '}
          <span className="text-diff-del">−{diff.deletions}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${diff.status === 'applied' ? 'bg-success' : 'bg-accent animate-pulse-dot'}`} />
          {diff.status}
        </span>
      </div>
      <div className="space-y-0.5 p-3 font-mono text-[11px] leading-[1.7]">
        {diff.lines.map((line, i) => (
          <div
            key={i}
            className={
              line.kind === 'add'
                ? 'text-diff-add'
                : line.kind === 'del'
                  ? 'text-diff-del'
                  : 'text-muted-foreground'
            }
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex animate-fade-in-up items-center gap-2.5 px-1">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-border bg-input text-accent">
        <SparklesIcon size={13} />
      </span>
      <span className="text-[13px] font-semibold text-foreground">{DEMO_AGENT_NAME}</span>
      <span className="chip-mono">{DEMO_AGENT_MODEL}</span>
      <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        thinking
        <span className="flex gap-0.5">
          {[0, 0.15, 0.3].map((delay) => (
            <span
              key={delay}
              className="bounce-dot h-1 w-1 rounded-full bg-muted-foreground"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}

function MessageBody({ message }: { message: DemoMessage }) {
  switch (message.role) {
    case 'user':
      return <UserBubble message={message} />;
    case 'ai':
      return <AiBubble message={message} />;
    case 'thought':
      return <ThoughtBlock message={message} />;
    case 'actions':
      return <ActionPillRow message={message} />;
    case 'diff':
      return <DiffCard message={message} />;
    default:
      return null;
  }
}

export function AgentChatPanel({
  title = DEMO_AGENT_NAME,
  model = DEMO_AGENT_MODEL,
  statusLabel = 'running',
  headerExtra,
}: {
  title?: string;
  model?: string;
  statusLabel?: string;
  headerExtra?: ReactNode;
}) {
  const [messages, setMessages] = useState<DemoMessage[]>(DEMO_CONVERSATION);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, thinking]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setDraft('');
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          content: 'Demo conversation — live agent execution and streaming land in **Phase 2**.',
        },
      ]);
    }, 1400);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-border px-3">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent text-accent-foreground">
          <SparklesIcon size={12} />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <span className="chip-mono">{model}</span>
        {headerExtra}
        <span className="ml-auto rounded-lg bg-success-soft px-1.5 py-0.5 font-mono text-[10px] text-success">
          {statusLabel}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-card to-transparent" />
        <div ref={scrollRef} className="custom-scrollbar absolute inset-0 space-y-3 overflow-y-auto px-4 py-4">
          <div className="mb-2 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-input text-accent">
              <SparklesIcon size={16} />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{title}</p>
              <p className="font-mono text-[11px] text-muted-foreground">ACUTE · {model}</p>
            </div>
          </div>

          {messages.map((msg) => (
            <MessageBody key={msg.id} message={msg} />
          ))}

          {thinking ? <ThinkingIndicator /> : null}
        </div>
      </div>

      <form onSubmit={handleSend} className="shrink-0 p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-1.5">
          <button
            type="button"
            title="Attachments land in Phase 2"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border bg-input text-muted-foreground"
          >
            <PaperclipIcon size={13} />
          </button>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask ${title} to refactor, explain, test…`}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Send message"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-transform hover:scale-105 active:scale-95 ${
              draft.trim()
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-input text-muted-foreground opacity-60'
            }`}
          >
            <ArrowUpIcon size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] text-muted-foreground">⌘K focus · ⏎ send · ⇧⏎ newline</span>
          <span className="chip-mono">{model}</span>
        </div>
      </form>
    </div>
  );
}


