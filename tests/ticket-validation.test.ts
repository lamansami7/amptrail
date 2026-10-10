import { describe, expect, it } from 'vitest';
import { ticketSchema } from '@/lib/schemas/ticket';
import { parseTicketFormData } from '@/lib/tickets/validation';

const validTicket = {
  project_id: '5862b02d-6b39-4cb5-ad3a-15bf47a0aef0',
  occurred_at: '2026-10-10T14:00:00.000Z',
  location: 'Level 2',
  description: 'Rerouted conduit around a field obstruction.',
  out_of_scope_reason: 'Existing duct route differed from the drawing.',
  status: 'draft',
  gc_representative: '',
  notes: '',
  labor: [{ worker_name: 'Journeyman', hours: 1.5, rate: 48.25 }],
  materials: [{ description: 'EMT conduit', quantity: 2.5, unit_cost: 3.75 }],
  costs: [],
};

describe('work ticket validation', () => {
  it('accepts a valid field record and line items', () => {
    expect(ticketSchema.safeParse(validTicket).success).toBe(true);
  });

  it('rejects negative or zero quantities and invalid money precision', () => {
    expect(ticketSchema.safeParse({ ...validTicket, labor: [{ worker_name: 'Crew', hours: 1, rate: -1 }] }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...validTicket, materials: [{ description: 'Cable', quantity: 0, unit_cost: 1 }] }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...validTicket, labor: [{ worker_name: 'Crew', hours: 1.001, rate: 50 }] }).success).toBe(false);
  });

  it('rejects unsupported status values and excessive entry counts', () => {
    expect(ticketSchema.safeParse({ ...validTicket, status: 'paid' }).success).toBe(false);
    const tooManyRows = Array.from({ length: 76 }, (_, index) => ({ worker_name: `Worker ${index}`, hours: 1, rate: 20 }));
    expect(ticketSchema.safeParse({ ...validTicket, labor: tooManyRows }).success).toBe(false);
  });

  it('parses the datetime-local field on the server and rejects malformed entry JSON', () => {
    const form = new FormData();
    form.set('project_id', validTicket.project_id);
    form.set('occurred_at', '2026-10-10T14:00');
    form.set('description', validTicket.description);
    form.set('status', 'draft');
    form.set('labor', JSON.stringify(validTicket.labor));
    form.set('materials', JSON.stringify(validTicket.materials));
    form.set('costs', '[]');
    const parsed = parseTicketFormData(form);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.occurred_at).toMatch(/^2026-10-10T/);

    form.set('materials', '{broken');
    expect(parseTicketFormData(form).success).toBe(false);
  });
});
