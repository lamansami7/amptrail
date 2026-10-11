import { describe, expect, it } from 'vitest';
import {
  cn,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatQuantity,
  formatRelative,
  formatStatus,
  initials,
  pluralize,
} from '@/lib/utils';
import { statusTone, ticketStatusMeta, ticketStatusOptions } from '@/lib/tickets/status';

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

  it('assigns a distinct, meaningful tone to every status', () => {
    const tones = ticketStatusOptions.map((option) => statusTone(option.value));
    expect(new Set(tones).size).toBe(ticketStatusOptions.length);
    expect(statusTone('approved')).toBe('success');
    expect(statusTone('rejected')).toBe('danger');
    expect(statusTone('ready_for_review')).toBe('warning');
    expect(statusTone('submitted')).toBe('brand');
    // Unknown statuses must not throw or lose meaning.
    expect(statusTone('mystery')).toBe('neutral');
  });

  it('defines a label and dot colour for every status', () => {
    for (const option of ticketStatusOptions) {
      expect(ticketStatusMeta[option.value].label).toBeTruthy();
      expect(ticketStatusMeta[option.value].dot).toMatch(/^bg-/);
    }
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

  it('trims trailing zeros from quantities and hours', () => {
    expect(formatQuantity(12.5)).toBe('12.5');
    expect(formatQuantity(120)).toBe('120');
    expect(formatQuantity(1.005)).toBe('1.005');
    expect(formatQuantity(1234.5)).toBe('1,234.5');
  });

  it('formats compact currency for summary copy', () => {
    expect(formatCurrencyCompact(640)).toBe('$640.00');
    expect(formatCurrencyCompact(12400)).toBe('$12.4K');
  });

  it('pluralises counts without inventing grammar', () => {
    expect(pluralize(1, 'ticket')).toBe('1 ticket');
    expect(pluralize(2, 'ticket')).toBe('2 tickets');
    expect(pluralize(0, 'entry', 'entries')).toBe('0 entries');
  });

  it('reports relative time and falls back to "just now"', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(twoHoursAgo)).toBe('2 hours ago');
    expect(formatRelative(new Date().toISOString())).toBe('just now');
  });

  it('joins conditional class names', () => {
    expect(cn('a', false, undefined, ['b', null], { c: true, d: false })).toBe('a b c');
  });

  it('formats dates consistently', () => {
    const dateStr = '2026-10-10T14:30:00.000Z';
    const formatted = formatDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
  });
});
