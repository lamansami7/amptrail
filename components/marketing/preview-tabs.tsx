'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Panel = { id: string; label: string; hint?: string; content: ReactNode };

/**
 * Tabbed product preview with full keyboard support (arrow keys, Home/End)
 * and correct tab/tabpanel semantics.
 */
export function PreviewTabs({ panels, className }: { panels: Panel[]; className?: string }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const last = panels.length - 1;
    let next: number;
    if (event.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (event.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Product preview"
        onKeyDown={onKeyDown}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {panels.map((panel, index) => {
          const selected = index === active;
          return (
            <button
              key={panel.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${panel.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${panel.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors duration-150',
                selected
                  ? 'bg-ink text-white'
                  : 'text-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              {panel.label}
            </button>
          );
        })}
      </div>

      {panels.map((panel, index) => (
        <div
          key={panel.id}
          role="tabpanel"
          id={`${baseId}-panel-${panel.id}`}
          aria-labelledby={`${baseId}-tab-${panel.id}`}
          hidden={index !== active}
          className="animate-fade-in"
        >
          <div className="mt-3">{panel.content}</div>
          {panel.hint && <p className="mt-2.5 text-[12.5px] text-muted">{panel.hint}</p>}
        </div>
      ))}
    </div>
  );
}
