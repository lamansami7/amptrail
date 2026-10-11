import Link from 'next/link';
import { cn } from '@/lib/utils';

export type TabItem = {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
};

/**
 * Navigation-style tab bar (underline indicator). These are links, not
 * ARIA tabs, because each tab is a real route with its own URL.
 */
export function TabBar({
  items,
  label,
  className,
}: {
  items: TabItem[];
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn('min-w-0 max-w-full overflow-x-auto', className)}>
      <ul className="flex min-w-max items-center gap-1 border-b border-line">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap rounded-t-md px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150',
                item.active
                  ? 'text-brand-700'
                  : 'text-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              {item.label}
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    item.active ? 'bg-brand-100 text-brand-800' : 'bg-surface-3 text-subtle'
                  )}
                >
                  {item.count}
                </span>
              )}
              {item.active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1.5 -bottom-px h-[2px] rounded-full bg-brand-600"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Two-or-three option pill switch used for view modes. */
export function SegmentedLinks({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-all duration-150',
            item.active
              ? 'bg-surface text-ink shadow-xs'
              : 'text-muted hover:text-ink'
          )}
        >
          {item.label}
          {typeof item.count === 'number' && (
            <span className="text-[11px] font-semibold text-subtle tabular-nums">{item.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
