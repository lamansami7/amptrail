import { statusDotClass, statusLabel, statusTone } from '@/lib/tickets/status';
import { cn } from '@/lib/utils';

const toneClasses: Record<string, string> = {
  neutral: 'border-line-strong/70 bg-surface-3 text-body',
  brand: 'border-brand-line bg-brand-50 text-brand-800',
  success: 'border-success-line bg-success-soft text-success',
  warning: 'border-warning-line bg-warning-soft text-warning',
  danger: 'border-danger-line bg-danger-soft text-danger',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

const sizeClasses = {
  xs: 'gap-1.5 px-2 py-0.5 text-[11px]',
  sm: 'gap-1.5 px-2.5 py-1 text-xs',
  md: 'gap-2 px-3 py-1.5 text-[13px]',
} as const;

/**
 * Status is communicated by a dot *and* a word — never colour alone.
 */
export function StatusBadge({
  status,
  size = 'sm',
  className,
}: {
  status: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border font-semibold',
        sizeClasses[size],
        toneClasses[statusTone(status)],
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(status))}
      />
      {statusLabel(status)}
    </span>
  );
}
