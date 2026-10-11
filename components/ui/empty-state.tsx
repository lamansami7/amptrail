import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  tone = 'brand',
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  tone?: 'brand' | 'neutral';
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface-2/60 px-6 py-12 text-center sm:px-10',
        className
      )}
    >
      <div
        className={cn(
          'grid h-11 w-11 place-items-center rounded-xl border',
          tone === 'brand'
            ? 'border-brand-line bg-brand-50 text-brand-700'
            : 'border-line bg-surface text-subtle'
        )}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-[0.9375rem] font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-6 text-muted">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function InlineEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'rounded-lg border border-dashed border-line-strong bg-surface-2/70 px-4 py-6 text-center text-[13px] text-muted',
        className
      )}
    >
      {children}
    </p>
  );
}
