import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CheckIcon } from '../icons';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-soft ${className}`}>{children}</div>
  );
}

export function SectionCard({
  title,
  caption,
  actions,
  children,
}: {
  title: string;
  caption?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold tracking-tight text-foreground">{title}</h2>
          {caption ? <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p> : null}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </Panel>
  );
}

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'accent' | 'success' | 'destructive';
}) {
  const tones: Record<string, string> = {
    muted: 'border-border bg-input text-muted-foreground',
    accent: 'border-transparent bg-accent-soft text-accent',
    success: 'border-transparent bg-success-soft text-success',
    destructive: 'border-transparent bg-destructive-soft text-destructive',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 font-mono text-[10px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function IconButton({
  label,
  children,
  destructive = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; destructive?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`grid h-7 w-7 place-items-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted ${
        destructive ? 'hover:text-destructive' : 'hover:text-accent'
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  bento = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { bento?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-accent bg-accent px-4 text-[12px] font-bold text-accent-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${
        bento ? 'shadow-bento-sm' : ''
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-card px-4 text-[12px] font-bold text-foreground shadow-soft transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-40"
      {...rest}
    >
      {children}
    </button>
  );
}

export function AccentSwatch({
  id,
  name,
  swatch,
  active,
  onSelect,
}: {
  id: string;
  name: string;
  swatch: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onSelect}
      title={name}
      aria-pressed={active}
      className={`group flex w-full flex-col gap-1.5 rounded-xl border-[1.5px] p-2 text-left transition-all hover:-translate-y-0.5 ${
        active ? 'border-accent shadow-bento-sm' : 'border-border'
      }`}
    >
      <span className="flex items-center justify-between">
        <span
          className="grid h-6 w-6 place-items-center rounded-full border border-border text-[10px] font-black text-white"
          style={{ background: swatch }}
        >
          Aa
        </span>
        {active ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-accent-foreground">
            <CheckIcon size={11} strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className="truncate text-[10px] font-semibold text-muted-foreground">{name}</span>
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-border bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-[12px] font-semibold text-foreground">{title}</p>
      {body ? <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-border bg-input px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {children}
    </kbd>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-border bg-input px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-accent';

export const selectClass =
  'w-full appearance-none rounded-lg border border-border bg-input px-3 py-2 text-[12px] text-foreground focus:border-accent';

export const textareaClass =
  'w-full resize-y rounded-lg border border-border bg-input px-3 py-2 font-mono text-[11.5px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-accent';

