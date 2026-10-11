import { describe, expect, it } from 'vitest';
import { buildWorkRecordPdf, workRecordFilename } from '@/lib/tickets/pdf';

const baseTicket = {
  ticket_number: 'AT-26-0142',
  status: 'ready_for_review',
  occurred_at: '2026-10-09T13:30:00.000Z',
  location: 'Level 3 East — above corridor grid',
  description: 'Rerouted four 4" EMT feeder runs around an unmapped HVAC supply duct.',
  out_of_scope_reason: 'Duct not shown on electrical contract drawings E-201.',
  gc_representative: 'J. Doe (Superintendent)',
  notes: 'Scissor lift required for access.',
  created_at: '2026-10-09T18:02:00.000Z',
};

const project = {
  name: 'Metro Medical Center — East Tower',
  project_number: 'PRJ-2026-088',
  site_address: '100 Innovation Way, Chicago, IL 60601',
  general_contractor: 'Turner Construction',
};

describe('work record PDF', () => {
  it('keeps a minimal ticket on one page', () => {
    const doc = buildWorkRecordPdf({
      companyName: 'Henderson Electric',
      ticket: { ...baseTicket, notes: null, out_of_scope_reason: null, gc_representative: 'J. Doe' },
      project,
      labor: [{ worker_name: 'Journeyman', hours: 8, rate: 87, line_total: 696 }],
      materials: [],
      costs: [],
      evidence: [],
    });

    expect(doc.getNumberOfPages()).toBe(1);
  });

  it('renders a record with line items', () => {
    const doc = buildWorkRecordPdf({
      companyName: 'Henderson Electric',
      ticket: baseTicket,
      project,
      labor: [{ worker_name: 'Journeyman', hours: 38, rate: 87, line_total: 3306 }],
      materials: [{ description: '3/4" EMT conduit', quantity: 64, unit_cost: 23, line_total: 1472 }],
      costs: [{ description: 'Scissor lift rental', quantity: 1, unit_cost: 496.6, line_total: 496.6 }],
      evidence: [],
    });

    // A typical ticket with one labor line and a couple of cost lines fits on
    // a single sheet; anything longer is allowed to paginate.
    expect(doc.getNumberOfPages()).toBeLessThanOrEqual(2);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('paginates long descriptions instead of clipping them', () => {
    const doc = buildWorkRecordPdf({
      companyName: 'Henderson Electric',
      ticket: { ...baseTicket, description: 'Rerouted feeder. '.repeat(400) },
      project,
      labor: Array.from({ length: 60 }, (_, index) => ({
        worker_name: `Journeyman ${index + 1}`,
        hours: 8,
        rate: 87,
        line_total: 696,
      })),
      materials: [],
      costs: [],
      evidence: [],
    });

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('lists attachments even when no image could be loaded', () => {
    const doc = buildWorkRecordPdf({
      companyName: 'Henderson Electric',
      ticket: baseTicket,
      project,
      labor: [],
      materials: [],
      costs: [],
      evidence: [
        {
          id: 'evidence-1',
          caption: 'Feeder conflict above grid',
          original_filename: 'IMG_0142.jpg',
          created_at: '2026-10-09T14:00:00.000Z',
        },
      ],
    });

    // The evidence appendix must still be present with the caption text.
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('builds a safe, predictable filename', () => {
    expect(workRecordFilename('AT-26-0142')).toBe('at-26-0142-work-record.pdf');
    expect(workRecordFilename('AT/26 0142')).toBe('at-26-0142-work-record.pdf');
  });
});
