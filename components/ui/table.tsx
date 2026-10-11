import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Horizontally scrollable table shell with consistent framing. */
export function TableShell({
  children,
  className,
  caption,
}: {
  children: ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn('-mx-px overflow-x-auto', className)}>
      <table className="w-full min-w-full border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = 'left',
  className,
  scope = 'col',
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope={scope}
      className={cn(
        'border-b border-line bg-surface-2/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-subtle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'border-b border-line px-4 py-3 align-middle text-sm text-body first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <tr
      className={cn(
        'last:[&>td]:border-b-0',
        interactive && 'transition-colors duration-100 hover:bg-brand-50/40 focus-within:bg-brand-50/40',
        className
      )}
    >
      {children}
    </tr>
  );
}
