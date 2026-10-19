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

describe('FieldTicket payload length limits', () => {
  it('truncates text to FieldTicket API limits so long AmpTrail records still compare', () => {
    const result = toFieldTicketInput({
      ticket_number: 'AT-26-00001',
      contractor: 'C'.repeat(250),
      customer: 'CU',
      project: 'P'.repeat(250),
      work_date: '2026-10-19',
      description: 'D'.repeat(12000), // AmpTrail allows 12,000; the API allows 3,000
      labor: [{ worker_name: 'L'.repeat(240), hours: 2, rate: 50 }],
      materials: [{ description: 'M'.repeat(240), quantity: 2, unit_cost: 25 }],
    });

    expect(result.description).toHaveLength(3000);
    expect(result.contractor).toHaveLength(200);
    expect(result.project).toHaveLength(200);
    expect(result.labor[0].description).toHaveLength(200);
    expect(result.materials[0].description).toHaveLength(200);
    // Truncation never changes the money.
    expect(result.labor[0].hours_per_worker).toBe(2);
    expect(result.materials[0].unit_price).toBe(25);
  });

  it('leaves short values untouched', () => {
    const result = toFieldTicketInput({
      ticket_number: 'AT-26-00001',
      contractor: 'Arena QA Electric',
      customer: 'Arena Test Contractor',
      project: 'Arena QA Test Project',
      work_date: '2026-10-19',
      description: 'Installed additional conduit during QA testing.',
      labor: [{ worker_name: 'Journeyman electrician', hours: 2, rate: 50 }],
      materials: [{ description: 'EMT conduit', quantity: 2, unit_cost: 25 }],
    });

    expect(result.description).toBe('Installed additional conduit during QA testing.');
    expect(result.labor[0].description).toBe('Journeyman electrician');
  });
});

describe('FieldTicket other-cost safety', () => {
  it('rejects tickets with unsupported other costs', () => {
    expect(() =>
      toFieldTicketInput({
        ticket_number: 'AMP-002',
        contractor: 'Demo Contractor',
        customer: 'Demo Customer',
        project: 'Demo Project',
        work_date: '2026-10-18',
        description: 'Extra work',
        labor: [],
        materials: [],
        costs: [
          {
            description: 'Equipment rental',
            quantity: 1,
            unit_cost: 150,
          },
        ],
      })
    ).toThrow('FieldTicket does not support separate other-cost entries yet');
  });
});
