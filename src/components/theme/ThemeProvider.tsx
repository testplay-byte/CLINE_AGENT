import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settings.store';
import { ACCENTS } from '../../lib/theme';
import type { AccentId, ThemeMode } from '../../lib/theme';
import { MoonIcon, SunIcon } from '../icons';
import { AccentSwatch } from '../ui/primitives';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSettingsStore((s) => s.mode);
  const accent = useSettingsStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.dataset.accent = accent;
  }, [mode, accent]);

  return <>{children}</>;
}

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);

  if (compact) {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        onClick={() => setMode(next)}
        className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-input text-muted-foreground transition-colors hover:text-accent"
      >
        {mode === 'dark' ? <SunIcon size={13} /> : <MoonIcon size={13} />}
      </button>
    );
  }

  return (
    <div className="relative grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted p-1">
      <span
        className="absolute bottom-1 top-1 w-[calc(50%-6px)] rounded-lg bg-card shadow-soft transition-all duration-300 ease-acute"
        style={{ left: mode === 'dark' ? 'calc(50% + 2px)' : '4px' }}
      />
      <button
        type="button"
        onClick={() => setMode('light')}
        className={`relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-colors ${
          mode === 'light' ? 'text-accent' : 'text-muted-foreground'
        }`}
      >
        <SunIcon size={13} /> Light
      </button>
      <button
        type="button"
        onClick={() => setMode('dark')}
        className={`relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-colors ${
          mode === 'dark' ? 'text-accent' : 'text-muted-foreground'
        }`}
      >
        <MoonIcon size={13} /> Dark
      </button>
    </div>
  );
}

export function AccentPicker() {
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);

  return (
    <div className="grid grid-cols-5 gap-2">
      {ACCENTS.map((a) => (
        <AccentSwatch
          key={a.id}
          id={a.id}
          name={a.name}
          swatch={a.swatch}
          active={accent === a.id}
          onSelect={() => setAccent(a.id as AccentId)}
        />
      ))}
    </div>
  );
}
