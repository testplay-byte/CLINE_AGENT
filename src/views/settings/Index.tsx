import { useEffect, useState } from 'react';

const ACCENTS = [
  { id: 'nova', label: 'Nova', swatch: '#FF6B2C' },
  { id: 'bento', label: 'Bento', swatch: '#6366F1' },
  { id: 'midnight', label: 'Midnight', swatch: '#D6FF57' },
  { id: 'sunset', label: 'Sunset', swatch: '#FF7A3D' },
  { id: 'mono', label: 'Mono', swatch: '#111111' },
] as const;

type AccentId = (typeof ACCENTS)[number]['id'];

const STORAGE_KEY = 'acute.accent';

function initialAccent(): AccentId {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return ACCENTS.some((accent) => accent.id === stored) ? (stored as AccentId) : 'nova';
}

export default function View() {
  const [accent, setAccent] = useState<AccentId>(initialAccent);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    window.localStorage.setItem(STORAGE_KEY, accent);
  }, [accent]);

  return (
    <section className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Appearance and accents, provider keys, execution denylist, memory and the append-only audit log.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-bento">
        <h2 className="text-sm font-medium">Accent</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === accent}
              onClick={() => setAccent(item.id)}
              className={
                item.id === accent
                  ? 'flex items-center gap-2 rounded-md border border-accent px-3 py-1.5 text-[12px] font-medium text-foreground'
                  : 'flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted'
              }
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: item.swatch }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}