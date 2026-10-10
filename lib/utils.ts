import type { TicketCostRow, LaborEntryRow, MaterialEntryRow } from '@/lib/supabase/database.types';

export function cn(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
}

export function formatDateTimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function formatStatus(status: string) {
  return status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function statusClasses(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    ready_for_review: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    submitted: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200',
    approved: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
    rejected: 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200',
    invoiced: 'bg-violet-50 text-violet-800 ring-1 ring-inset ring-violet-200',
  };
  return styles[status] || styles.draft;
}

export function initials(value: string) {
  return value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'A';
}

export type TicketLine = LaborEntryRow | MaterialEntryRow | TicketCostRow;
