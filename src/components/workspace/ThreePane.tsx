import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 400;
const DEFAULT_SIDEBAR = 250;

function useSidebarWidth() {
  const [width, setWidth] = useState(DEFAULT_SIDEBAR);
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setWidth((w) => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w + delta)));
  }, []);

  const onUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMove, onUp]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return { width, onMouseDown };
}

export function ThreePane({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  const { width, onMouseDown } = useSidebarWidth();

  return (
    <div className="flex min-h-0 flex-1 gap-1.5 p-2 pt-0">
      <aside
        className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
        style={{ width }}
      >
        {left}
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        className="group relative w-1 shrink-0 cursor-ew-resize"
        onMouseDown={onMouseDown}
      >
        <span className="absolute inset-y-2 left-[1px] w-[2px] rounded-full bg-border opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {center}
      </section>

      <div className="w-[400px] shrink-0">{right}</div>
    </div>
  );
}
