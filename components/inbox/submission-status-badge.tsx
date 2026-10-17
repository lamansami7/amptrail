import { submissionStatusLabel, submissionStatusTone } from '@/lib/inbox/status';
import { cn } from '@/lib/utils';

const toneClasses: Record<string, string> = {
  neutral: 'border-line-strong/70 bg-surface-3 text-body',
  brand: 'border-brand-line bg-brand-50 text-brand-800',
  success: 'border-success-line bg-success-soft text-success',
  warning: 'border-warning-line bg-warning-soft text-warning',
  danger: 'border-danger-line bg-danger-soft text-danger',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

const dotClasses: Record<string, string> = {
  neutral: 'bg-faint',
  brand: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet-500',
};

/** A dot and a word, never colour alone. */
export function SubmissionStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = submissionStatusTone(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        toneClasses[tone],
        className
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])} />
      {submissionStatusLabel(status)}
    </span>
  );
}
