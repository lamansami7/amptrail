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

  it('matches the Arena QA ticket: 2h labor and 2 EMT conduit totaling $150', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ total: '150.00' });

    const result = await compareFieldTicketTotals({
      ticket_number: 'AT-26-00001',
      contractor: 'Arena QA Electric',
      customer: 'Arena Test Contractor',
      project: 'Arena QA Test Project',
      work_date: '2026-10-19',
      description: 'Installed additional conduit during QA testing.',
      labor: [{ worker_name: 'Journeyman electrician', hours: 2, rate: 50 }],
      materials: [{ description: 'EMT conduit', quantity: 2, unit_cost: 25 }],
      costs: [],
    });

    expect(result.status).toBe('matched');
    expect(result.amptrailTotal).toBe(150);
    expect(result.fieldticketTotal).toBe(150);
  });

  it('degrades to unavailable when the API call fails (timeout, 5xx, bad key)', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockRejectedValue(new Error('FieldTicket calculation failed (500)'));

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('unavailable');
    expect(result.amptrailTotal).toBe(610);
    expect(result.fieldticketTotal).toBeUndefined();
  });

  it('degrades to unavailable when the API response has no usable total', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ unexpected: 'shape' });

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('unavailable');
    expect(result.amptrailTotal).toBe(610);
  });

  it('skips without calling the API when no key is configured', async () => {
    delete process.env.FIELDTICKET_API_KEY;

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('skipped');
    expect(mockCalculate).not.toHaveBeenCalled();
  });

  it('compares empty labor/material tickets as a $0 total', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ total: '0.00' });

    const result = await compareFieldTicketTotals({ ...ticket, labor: [], materials: [] });

    expect(result.status).toBe('matched');
    expect(result.amptrailTotal).toBe(0);
  });

  it('treats sub-cent remote differences as a mismatch, not a match', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key';

    mockCalculate.mockResolvedValue({ total: '610.01' });

    const result = await compareFieldTicketTotals(ticket);

    expect(result.status).toBe('mismatch');
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
