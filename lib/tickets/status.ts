/**
 * Ticket workflow states, in the order work moves through them.
 *
 * These describe OUR internal documentation workflow only. They say nothing
 * about whether a customer has accepted the work; that is a separate field
 * (see `customerApprovalOptions`) and must be recorded explicitly.
 */
export const ticketWorkflowOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_review', label: 'Needs review' },
  { value: 'ready_to_export', label: 'Ready to export' },
  { value: 'finalized', label: 'Finalized' },
] as const;

/**
 * States from the first release. They remain valid so existing tickets keep
 * their meaning, but they are no longer offered when choosing a status.
 */
export const legacyTicketStatusOptions = [
  { value: 'submitted', label: 'Submitted (legacy)' },
  { value: 'approved', label: 'Approved (legacy)' },
  { value: 'rejected', label: 'Rejected (legacy)' },
  { value: 'invoiced', label: 'Invoiced (legacy)' },
] as const;

/** Every status that can exist on a ticket (filters, counts, badges). */
export const ticketStatusOptions = [...ticketWorkflowOptions, ...legacyTicketStatusOptions] as const;

export type TicketStatus = (typeof ticketStatusOptions)[number]['value'];
export type WorkflowStatus = (typeof ticketWorkflowOptions)[number]['value'];

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet';

export function isLegacyStatus(status: string) {
  return legacyTicketStatusOptions.some((option) => option.value === status);
}

/** Statuses a ticket can be moved to: the workflow states, plus its own legacy value if it has one. */
export function selectableStatuses(current?: string) {
  const legacy = legacyTicketStatusOptions.find((option) => option.value === current);
  return legacy ? [...ticketWorkflowOptions, legacy] : [...ticketWorkflowOptions];
}

/** States in which a ticket still needs office attention before it leaves the building. */
export const openStatuses: readonly string[] = ['draft', 'ready_for_review', 'ready_to_export', 'submitted'];

/**
 * Status meaning is defined once, here, so every badge, chart segment and
 * filter in the product agrees.
 */
export const ticketStatusMeta: Record<TicketStatus, { label: string; tone: StatusTone; dot: string }> =
  {
    draft: { label: 'Draft', tone: 'neutral', dot: 'bg-faint' },
    ready_for_review: { label: 'Needs review', tone: 'warning', dot: 'bg-warning' },
    ready_to_export: { label: 'Ready to export', tone: 'brand', dot: 'bg-brand-500' },
    finalized: { label: 'Finalized', tone: 'success', dot: 'bg-success' },
    submitted: { label: 'Submitted (legacy)', tone: 'brand', dot: 'bg-brand-300' },
    approved: { label: 'Approved (legacy)', tone: 'success', dot: 'bg-emerald-300' },
    rejected: { label: 'Rejected (legacy)', tone: 'danger', dot: 'bg-danger' },
    invoiced: { label: 'Invoiced (legacy)', tone: 'violet', dot: 'bg-violet-500' },
  };

export function statusTone(status: string): StatusTone {
  return ticketStatusMeta[status as TicketStatus]?.tone ?? 'neutral';
}

export function statusDotClass(status: string) {
  return ticketStatusMeta[status as TicketStatus]?.dot ?? 'bg-faint';
}

export function statusLabel(status: string) {
  return ticketStatusMeta[status as TicketStatus]?.label ?? 'Unknown';
}

/* ------------------------------------------------------------------ */
/* Customer approval: recorded separately from workflow status.        */
/* ------------------------------------------------------------------ */

export const customerApprovalOptions = [
  { value: 'not_requested', label: 'Not requested', tone: 'neutral' },
  { value: 'pending', label: 'Awaiting customer', tone: 'warning' },
  { value: 'approved', label: 'Customer approved', tone: 'success' },
  { value: 'rejected', label: 'Customer rejected', tone: 'danger' },
] as const satisfies ReadonlyArray<{ value: string; label: string; tone: StatusTone }>;

export type CustomerApproval = (typeof customerApprovalOptions)[number]['value'];

export const customerApprovalValues = customerApprovalOptions.map((option) => option.value) as [
  CustomerApproval,
  ...CustomerApproval[],
];

export function customerApprovalLabel(value: string) {
  return customerApprovalOptions.find((option) => option.value === value)?.label ?? 'Not requested';
}

export function customerApprovalTone(value: string): StatusTone {
  return customerApprovalOptions.find((option) => option.value === value)?.tone ?? 'neutral';
}
