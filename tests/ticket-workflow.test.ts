import { describe, expect, it } from 'vitest';
import { ticketSchema, ticketStatuses } from '@/lib/schemas/ticket';
import {
  customerApprovalLabel,
  customerApprovalOptions,
  customerApprovalTone,
  isLegacyStatus,
  legacyTicketStatusOptions,
  openStatuses,
  selectableStatuses,
  statusLabel,
  ticketStatusMeta,
  ticketStatusOptions,
  ticketWorkflowOptions,
} from '@/lib/tickets/status';

const baseTicket = {
  project_id: '8d1b5c8e-5d0a-4f43-9a52-0c8d2a7e7a11',
  occurred_at: '2026-10-12T14:00:00.000Z',
  location: 'Level 2',
  description: 'Extra conduit run',
  out_of_scope_reason: null,
  gc_representative: null,
  notes: null,
  labor: [{ worker_name: 'Mike', hours: 4, rate: 0 }],
  materials: [],
  costs: [],
};

describe('ticket workflow statuses', () => {
  it('offers exactly the four workflow states in order', () => {
    expect(ticketWorkflowOptions.map((option) => option.value)).toEqual([
      'draft',
      'ready_for_review',
      'ready_to_export',
      'finalized',
    ]);
    expect(statusLabel('ready_for_review')).toBe('Needs review');
    expect(statusLabel('ready_to_export')).toBe('Ready to export');
    expect(statusLabel('finalized')).toBe('Finalized');
  });

  it('keeps every legacy status valid but labels it as legacy', () => {
    for (const option of legacyTicketStatusOptions) {
      expect(isLegacyStatus(option.value)).toBe(true);
      expect(ticketStatuses).toContain(option.value);
      expect(ticketStatusMeta[option.value].label).toMatch(/legacy/i);
    }
    expect(isLegacyStatus('draft')).toBe(false);
    expect(ticketStatusOptions).toHaveLength(ticketWorkflowOptions.length + legacyTicketStatusOptions.length);
  });

  it('only offers a legacy status when the ticket already has it', () => {
    expect(selectableStatuses().map((option) => option.value)).toEqual(
      ticketWorkflowOptions.map((option) => option.value)
    );
    expect(selectableStatuses('draft')).toHaveLength(4);
    const withLegacy = selectableStatuses('approved').map((option) => option.value);
    expect(withLegacy).toHaveLength(5);
    expect(withLegacy).toContain('approved');
    expect(selectableStatuses('submitted').map((option) => option.value)).not.toContain('approved');
  });

  it('treats finalized and rejected as closed, everything pre-export as open', () => {
    expect(openStatuses).toEqual(expect.arrayContaining(['draft', 'ready_for_review', 'ready_to_export']));
    expect(openStatuses).not.toContain('finalized');
    expect(openStatuses).not.toContain('approved');
  });

  it('accepts new and legacy statuses in the ticket schema, and rejects unknown ones', () => {
    for (const status of ticketStatuses) {
      expect(ticketSchema.safeParse({ ...baseTicket, status }).success).toBe(true);
    }
    expect(ticketSchema.safeParse({ ...baseTicket, status: 'customer_approved' }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...baseTicket, status: 'finalised' }).success).toBe(false);
  });
});

describe('customer approval is separate from workflow status', () => {
  it('has its own vocabulary that never overlaps workflow values', () => {
    const approvalValues = customerApprovalOptions.map((option) => option.value) as string[];
    expect(approvalValues).toEqual(['not_requested', 'pending', 'approved', 'rejected']);
    // "approved" exists only as a legacy workflow value, never as a current one.
    expect(ticketWorkflowOptions.map((option) => option.value) as string[]).not.toContain('approved');
    // A ticket save cannot carry a customer approval: the field is stripped, not accepted.
    const parsed = ticketSchema.safeParse({ ...baseTicket, status: 'finalized', customer_approval: 'approved' });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).not.toHaveProperty('customer_approval');
  });

  it('labels and tones each approval state, defaulting safely', () => {
    expect(customerApprovalLabel('approved')).toBe('Customer approved');
    expect(customerApprovalLabel('pending')).toBe('Awaiting customer');
    expect(customerApprovalTone('approved')).toBe('success');
    expect(customerApprovalTone('rejected')).toBe('danger');
    expect(customerApprovalLabel('mystery')).toBe('Not requested');
    expect(customerApprovalTone('mystery')).toBe('neutral');
  });
});
