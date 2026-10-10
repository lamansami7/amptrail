import { describe, expect, it } from 'vitest';
import { calculateTicketTotals, costLineTotal, laborLineTotal } from '@/lib/tickets/totals';

describe('ticket totals', () => {
  it('rounds line items to cents before summing', () => {
    expect(laborLineTotal({ hours: 1.25, rate: 32.5 })).toBe(40.63);
    expect(costLineTotal({ quantity: 3, unit_cost: 0.34 })).toBe(1.02);
  });

  it('rounds sub-cent halves away from zero like PostgreSQL numeric values', () => {
    expect(laborLineTotal({ hours: 0.29, rate: 0.5 })).toBe(0.15);
    expect(costLineTotal({ quantity: 0.35, unit_cost: 0.1 })).toBe(0.04);
    expect(laborLineTotal({ hours: 9999.99, rate: 999999.5 })).toBe(9999985000.01);
  });

  it('separates labor, materials, other costs, and a grand total', () => {
    expect(calculateTicketTotals({
      labor: [{ hours: 2, rate: 48.75 }],
      materials: [{ quantity: 3, unit_cost: 12.4 }],
      costs: [{ quantity: 1.5, unit_cost: 20 }],
    })).toEqual({ labor: 97.5, materials: 37.2, other: 30, total: 164.7 });
  });

  it('returns zero for an empty ticket', () => {
    expect(calculateTicketTotals({ labor: [], materials: [], costs: [] }).total).toBe(0);
  });
});
