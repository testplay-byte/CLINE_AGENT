import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'acute.theme';

function initialTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(initialTheme());
  }, []);
  return <>{children}</>;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setTheme(next);
      }}
      className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}