import { describe, expect, it } from 'vitest';
import { calculateTicketTotals } from '../lib/tickets/totals';
import { toFieldTicketInput } from '../lib/fieldticket/adapter';

describe('FieldTicket calculation compatibility', () => {
  it('preserves labor and material amounts for ordinary values', () => {
    const labor = [
      { worker_name: 'Electrician', hours: 8, rate: 45 },
    ];

    const materials = [
      { description: 'Cable', quantity: 100, unit_cost: 2.5 },
    ];

    const mapped = toFieldTicketInput({
      ticket_number: 'TEST-100',
      contractor: 'Demo',
      customer: 'Demo',
      project: 'Demo',
      work_date: '2026-10-18',
      description: 'Installation',
      labor,
      materials,
      costs: [],
    });

    const expected = calculateTicketTotals({
      labor,
      materials,
      costs: [],
    });

    expect(expected.total).toBe(610);
    expect(mapped.labor[0].hours_per_worker).toBe(8);
    expect(mapped.materials[0].unit_price).toBe(2.5);
  });

  it('documents AmpTrail line-item rounding', () => {
    const totals = calculateTicketTotals({
      labor: [{ hours: 0.29, rate: 0.5 }],
      materials: [{ quantity: 0.35, unit_cost: 0.1 }],
      costs: [],
    });

    expect(totals).toEqual({
      labor: 0.15,
      materials: 0.04,
      other: 0,
      total: 0.19,
    });
  });
});
