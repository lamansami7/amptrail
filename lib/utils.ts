import type { TicketCostRow, LaborEntryRow, MaterialEntryRow } from '@/lib/supabase/database.types';

export function cn(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
) {
  try {
    return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function formatStatus(status: string) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function statusClasses(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    ready_for_review: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80',
    submitted: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80',
    approved: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80',
    rejected: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80',
    invoiced: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/80',
  };
  return styles[status] || styles.draft;
}

export function initials(value: string) {
  return (
    value
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A'
  );
}

export type TicketLine = LaborEntryRow | MaterialEntryRow | TicketCostRow;
