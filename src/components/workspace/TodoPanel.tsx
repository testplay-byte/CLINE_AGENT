import { useState } from 'react';
import { CheckIcon } from '../icons';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const INITIAL_TODOS: TodoItem[] = [
  { id: 't1', text: 'Locate burst-drop cause in login route', done: true },
  { id: 't2', text: 'Patch middleware with sliding window', done: false },
  { id: 't3', text: 'Re-run integration suite', done: false },
];

const RING_LEN = 2 * Math.PI * 42;

export function TodoMiniList() {
  const [items, setItems] = useState(INITIAL_TODOS);
  const done = items.filter((i) => i.done).length;
  const percent = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" className="stroke-border" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              className="stroke-accent"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_LEN}
              strokeDashoffset={RING_LEN - (RING_LEN * percent) / 100}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-mono text-[11px] font-bold text-foreground">
            {percent}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="label-caps">Mission</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-tight text-foreground">Rate-limit the login route</p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="label-caps">To-do</span>
        <span className="chip-mono">
          {done}/{items.length}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
              item.done ? 'border-border bg-input' : 'border-transparent hover:bg-muted'
            }`}
          >
            <span
              className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${
                item.done ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
              }`}
            >
              {item.done ? <CheckIcon size={11} strokeWidth={3} /> : null}
            </span>
            <span
              className={`text-[12px] leading-tight ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
            >
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
