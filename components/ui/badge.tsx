import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-body border-line-strong/70',
  brand: 'bg-brand-50 text-brand-800 border-brand-line',
  success: 'bg-success-soft text-success border-success-line',
  warning: 'bg-warning-soft text-warning border-warning-line',
  danger: 'bg-danger-soft text-danger border-danger-line',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-faint',
  brand: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet-500',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
  size = 'md',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        toneClasses[tone],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

/** Small numeric chip used for counts in navigation and table headers. */
export function CountBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand';
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        tone === 'brand' ? 'bg-brand-100 text-brand-800' : 'bg-surface-3 text-subtle'
      )}
    >
      {children}
    </span>
  );
}
