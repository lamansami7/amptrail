import { formatStatus, statusClasses } from '@/lib/utils';

const dotClasses: Record<string, string> = {
  draft: 'bg-slate-400',
  ready_for_review: 'bg-amber-500 animate-pulse',
  submitted: 'bg-blue-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  invoiced: 'bg-indigo-500',
};

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const dot = dotClasses[status] || 'bg-slate-400';
  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'md'
        ? 'px-3 py-1.5 text-xs'
        : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ${sizeClass} ${statusClasses(
        status
      )}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      <span>{formatStatus(status)}</span>
    </span>
  );
}
