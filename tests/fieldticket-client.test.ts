import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { calculateWithFieldTicket } from '../lib/fieldticket/client';

const originalKey = process.env.FIELDTICKET_API_KEY;
const originalUrl = process.env.FIELDTICKET_API_URL;

afterEach(() => {
  vi.unstubAllGlobals();

  if (originalKey === undefined) {
    delete process.env.FIELDTICKET_API_KEY;
  } else {
    process.env.FIELDTICKET_API_KEY = originalKey;
  }

  if (originalUrl === undefined) {
    delete process.env.FIELDTICKET_API_URL;
  } else {
    process.env.FIELDTICKET_API_URL = originalUrl;
  }
});

describe('FieldTicket server client', () => {
  const ticket = {
    ticket_number: 'TEST-001',
    contractor: 'Test Contractor',
    customer: 'Test Customer',
    project: 'Test Project',
    work_date: '2026-10-18',
    description: 'Test work',
    labor: [],
    materials: [],
  };

  it('rejects requests without an API key', async () => {
    delete process.env.FIELDTICKET_API_KEY;

    await expect(
      calculateWithFieldTicket(ticket)
    ).rejects.toThrow('FieldTicket API key is not configured');
  });

  it('calls the correct endpoint with a private header', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key-not-real';
    process.env.FIELDTICKET_API_URL = 'https://example.test/';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: '970.00' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await calculateWithFieldTicket(ticket);

    expect(result).toEqual({ total: '970.00' });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe(
      'https://example.test/v1/tickets/calculate'
    );
    expect(options.headers['X-API-Key']).toBe(
      'test-key-not-real'
    );
  });

  it('rejects failed API responses', async () => {
    process.env.FIELDTICKET_API_KEY = 'test-key-not-real';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 })
    );

    await expect(
      calculateWithFieldTicket(ticket)
    ).rejects.toThrow('FieldTicket calculation failed (401)');
  });
});
