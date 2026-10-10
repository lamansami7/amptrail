import { formatStatus, statusClasses } from '@/lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClasses(status)}`}>{formatStatus(status)}</span>;
}
