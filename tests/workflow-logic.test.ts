import { describe, expect, it } from 'vitest';
import { calculateTicketTotals, costLineTotal } from '@/lib/tickets/totals';

describe('business workflow calculations & integrity', () => {
  it('correctly aggregates multi-trade electrical labor, materials, and lift rentals', () => {
    const labor = [
      { hours: 8.5, rate: 95.0 }, // Journeyman: $807.50
      { hours: 8.5, rate: 60.0 }, // Apprentice: $510.00
      { hours: 2.0, rate: 110.0 }, // General Foreman: $220.00
    ];
    const materials = [
      { quantity: 20, unit_cost: 14.5 }, // 3/4" EMT: $290.00
      { quantity: 4, unit_cost: 32.75 }, // Junction boxes: $131.00
      { quantity: 500, unit_cost: 0.85 }, // #10 THHN wire: $425.00
    ];
    const costs = [
      { quantity: 1, unit_cost: 250.0 }, // 19ft Scissor Lift Day Rental: $250.00
      { quantity: 1, unit_cost: 45.0 }, // Disposal & Cartage: $45.00
    ];

    const result = calculateTicketTotals({ labor, materials, costs });
    expect(result.labor).toBe(1537.5);
    expect(result.materials).toBe(846.0);
    expect(result.other).toBe(295.0);
    expect(result.total).toBe(2678.5);
  });

  it('handles zero rates and fractional quantities without losing precision', () => {
    const materials = [{ quantity: 0.333, unit_cost: 10.0 }];
    const total = costLineTotal(materials[0]);
    expect(total).toBe(3.33);
  });

  it('accurately calculates large commercial electrical project overages', () => {
    const labor = [{ hours: 140, rate: 105.0 }]; // $14,700.00
    const materials = [{ quantity: 1200, unit_cost: 12.85 }]; // $15,420.00
    const costs = [{ quantity: 4, unit_cost: 1200.0 }]; // $4,800.00

    const result = calculateTicketTotals({ labor, materials, costs });
    expect(result.labor).toBe(14700.0);
    expect(result.materials).toBe(15420.0);
    expect(result.other).toBe(4800.0);
    expect(result.total).toBe(34920.0);
  });
});
