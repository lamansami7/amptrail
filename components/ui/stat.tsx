import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * KPI tile. Labels stay quiet, the figure carries the weight, and the
 * supporting line explains where the number comes from.
 */
export function StatCard({
  label,
  value,
  context,
  icon,
  tone = 'neutral',
  footer,
  className,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  context?: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  footer?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  const iconTone: Record<string, string> = {
    neutral: 'bg-surface-3 text-body',
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  };

  return (
    <div className={cn('card flex flex-col p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', iconTone[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink tabular-nums',
          valueClassName
        )}
      >
        {value}
      </p>
      {context && <p className="mt-1 text-[13px] leading-5 text-muted">{context}</p>}
      {footer && <div className="mt-4 border-t border-line pt-3">{footer}</div>}
    </div>
  );
}

/** Compact label/value pair used inside cards and sidebars. */
export function DetailRow({
  label,
  children,
  align = 'left',
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  align?: 'left' | 'between';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-4 py-2',
        align === 'between' ? 'items-baseline justify-between' : 'flex-col gap-1',
        className
      )}
    >
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className={cn('text-[13px] font-medium text-ink', align === 'between' && 'text-right tabular-nums')}>
        {children}
      </dd>
    </div>
  );
}
