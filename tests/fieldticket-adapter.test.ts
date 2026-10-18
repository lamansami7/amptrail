import { describe, expect, it } from 'vitest';
import { toFieldTicketInput } from '../lib/fieldticket/adapter';

describe('FieldTicket adapter', () => {
  it('converts labor and materials correctly', () => {
    const result = toFieldTicketInput({
      ticket_number: 'AMP-001',
      contractor: 'Demo Contractor',
      customer: 'Demo Customer',
      project: 'Demo Project',
      work_date: '2026-10-18',
      description: 'Electrical installation',
      labor: [
        { worker_name: 'Electrician', hours: 8, rate: 45 },
        { worker_name: 'Electrician', hours: 8, rate: 45 },
      ],
      materials: [
        {
          description: 'Cable',
          quantity: 100,
          unit_cost: 2.5,
        },
      ],
    });

    expect(result.labor).toHaveLength(2);
    expect(result.labor[0].workers).toBe(1);
    expect(result.labor[0].hours_per_worker).toBe(8);
    expect(result.materials[0].unit_price).toBe(2.5);

    const laborTotal = result.labor.reduce(
      (sum, line) =>
        sum + line.workers *
        line.hours_per_worker * line.hourly_rate,
      0
    );

    const materialTotal = result.materials.reduce(
      (sum, line) =>
        sum + line.quantity * line.unit_price,
      0
    );

    expect(laborTotal).toBe(720);
    expect(materialTotal).toBe(250);
    expect(laborTotal + materialTotal).toBe(970);
  });
});
