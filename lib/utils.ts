import type { TicketCostRow, LaborEntryRow, MaterialEntryRow } from '@/lib/supabase/database.types';

type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, boolean | undefined>;

/** Small class-name joiner (no runtime dependency needed). */
export function cn(...classes: ClassValue[]): string {
  const out: string[] = [];
  for (const value of classes) {
    if (!value) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else if (typeof value === 'object') {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  }
  return out.join(' ');
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

/** Compact currency for marketing/summary copy: $12.4K, $1.2M. */
export function formatCurrencyCompact(value: number) {
  if (Math.abs(value) < 1000) return formatCurrency(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
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

export function formatDateTime(value: string) {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTimeLocal(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** "3 days ago" — falls back to an absolute date beyond a month. */
export function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return 'just now';
}

/** Trims trailing zeros so 12.500 reads as 12.5 and 120.000 as 120. */
export function formatQuantity(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric
    .toFixed(3)
    .replace(/\.?0+$/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatHours(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric
    .toFixed(2)
    .replace(/\.?0+$/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`;
}

export function formatStatus(status: string) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

/** First name for greetings, falling back to a neutral salutation. */
export function firstName(value?: string | null) {
  const name = value?.trim().split(/\s+/)[0];
  return name || '';
}

export type TicketLine = LaborEntryRow | MaterialEntryRow | TicketCostRow;
