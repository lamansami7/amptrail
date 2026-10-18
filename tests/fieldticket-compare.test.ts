import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('../lib/fieldticket/client', () => ({
  calculateWithFieldTicket: vi.fn(),
}));

import { calculateWithFieldTicket } from '../lib/fieldticket/client';
import { compareFieldTicketTotals } from '../lib/fieldticket/compare';

const mockCalculate = vi.mocked(calculateWithFieldTicket);
const originalKey = process.env.FIELDTICKET_API_KEY;

afterEach(() => {
  vi.resetAllMocks();

  if (originalKey === undefined) {
    delete process.env.FIELDTICKET_API_KEY;
  } else {
    process.env.FIELDTICKET_API_KEY = originalKey;
  }
});

const ticket = {
  ticket_number: 'TEST-001',
  contractor: 'Demo Contractor',
  customer: 'Demo Customer',
  project: 'Demo Project',
  work_date: '2026-10-18',
  description: 'Electrical installation',
  labor: [
    { worker_name: 'Electrician', hours: 8, rate: 45 },
  ],
  materials: [
    { description: 'Cable', quantity: 100, unit_cost: 2.5 },
  ],
  costs: [],
};

describe('FieldTicket comparison', () => {
  it('recognizes matching totals', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ total: '610.00' });

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('matched');
    expect(result.amptrailTotal).toBe(610);
    expect(result.fieldticketTotal).toBe(610);
  });

  it('detects different totals', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ total: '600.00' });

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('mismatch');
    expect(result.amptrailTotal).toBe(610);
    expect(result.fieldticketTotal).toBe(600);
  });

  it('skips tickets with other costs', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    const result = await compareFieldTicketTotals({
      ...ticket,
      costs: [
        { description: 'Equipment rental', quantity: 1, unit_cost: 150 },
      ],
    });

    expect(result.status).toBe('skipped');
    expect(result.amptrailTotal).toBe(760);
    expect(mockCalculate).not.toHaveBeenCalled();
  });
});
