import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatStatus, statusClasses, initials } from '@/lib/utils';
import { ticketStatusOptions } from '@/lib/tickets/status';

describe('status and utility formatting', () => {
  it('formats status values into readable title-cased labels', () => {
    expect(formatStatus('draft')).toBe('Draft');
    expect(formatStatus('ready_for_review')).toBe('Ready For Review');
    expect(formatStatus('submitted')).toBe('Submitted');
    expect(formatStatus('approved')).toBe('Approved');
    expect(formatStatus('rejected')).toBe('Rejected');
    expect(formatStatus('invoiced')).toBe('Invoiced');
  });

  it('matches all defined ticketStatusOptions', () => {
    const values = ticketStatusOptions.map((o) => o.value);
    expect(values).toContain('draft');
    expect(values).toContain('ready_for_review');
    expect(values).toContain('submitted');
    expect(values).toContain('approved');
    expect(values).toContain('rejected');
    expect(values).toContain('invoiced');
  });

  it('assigns distinctive classes for each status', () => {
    expect(statusClasses('draft')).toContain('bg-slate-100');
    expect(statusClasses('ready_for_review')).toContain('bg-amber-50');
    expect(statusClasses('submitted')).toContain('bg-blue-50');
    expect(statusClasses('approved')).toContain('bg-emerald-50');
    expect(statusClasses('rejected')).toContain('bg-rose-50');
    expect(statusClasses('invoiced')).toContain('bg-indigo-50');
  });

  it('formats currency with two decimal places and commas', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1250.5)).toBe('$1,250.50');
    expect(formatCurrency(999999.99)).toBe('$999,999.99');
  });

  it('extracts initials cleanly from email or full name', () => {
    expect(initials('Alex Morgan')).toBe('AM');
    expect(initials('david@electric.com')).toBe('DE');
    expect(initials('Single')).toBe('S');
    expect(initials('')).toBe('A');
  });

  it('formats dates consistently', () => {
    const dateStr = '2026-10-10T14:30:00.000Z';
    const formatted = formatDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
  });
});
