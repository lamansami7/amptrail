'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type MenuItem = {
  label: string;
  icon?: ReactNode;
  description?: string;
  href?: string;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  separatorBefore?: boolean;
};

/**
 * Keyboard-accessible popover menu: Escape closes and restores focus,
 * arrow keys move between items, and clicking outside dismisses it.
 */
export function Menu({
  label,
  triggerLabel,
  trigger,
  triggerClassName,
  items,
  align = 'end',
  side = 'bottom',
  menuClassName,
}: {
  /** Names the menu panel itself. */
  label: string;
  /**
   * Optional explicit name for the trigger button. Omit it when the trigger
   * already shows its own visible label (WCAG 2.5.3 label-in-name); provide it
   * for icon-only triggers.
   */
  triggerLabel?: string;
  trigger: ReactNode;
  triggerClassName?: string;
  items: MenuItem[];
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
  }, [open]);

  function onPanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    ).filter((node) => node.offsetParent !== null);
    if (!nodes.length) return;
    const index = nodes.findIndex((node) => node === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nodes[(index + 1 + nodes.length) % nodes.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      nodes[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  const itemClass = (tone: MenuItem['tone']) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-100',
      tone === 'danger'
        ? 'text-danger hover:bg-danger-soft'
        : 'text-body hover:bg-surface-3 hover:text-ink'
    );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn('cursor-pointer', triggerClassName)}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          className={cn(
            'animate-pop-in absolute z-50 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lg',
            side === 'bottom' ? 'top-[calc(100%+0.4rem)]' : 'bottom-[calc(100%+0.4rem)]',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {items.map((item) => {
            const content = (
              <>
                {item.icon && (
                  <span className={cn('shrink-0', item.tone === 'danger' ? 'text-danger' : 'text-subtle')}>
                    {item.icon}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-subtle">
                      {item.description}
                    </span>
                  )}
                </span>
              </>
            );

            return (
              <div key={item.label}>
                {item.separatorBefore && <div className="my-1.5 h-px bg-line" role="separator" />}
                {item.href ? (
                  <Link
                    href={item.href}
                    role="menuitem"
                    className={itemClass(item.tone)}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass(item.tone)}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect?.();
                    }}
                  >
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
