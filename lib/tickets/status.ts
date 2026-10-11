export const ticketStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_review', label: 'Ready for review' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'invoiced', label: 'Invoiced' },
] as const;

export type TicketStatus = (typeof ticketStatusOptions)[number]['value'];

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet';

/**
 * Status meaning is defined once, here, so every badge, chart segment and
 * filter in the product agrees.
 */
export const ticketStatusMeta: Record<TicketStatus, { label: string; tone: StatusTone; dot: string }> =
  {
    draft: { label: 'Draft', tone: 'neutral', dot: 'bg-faint' },
    ready_for_review: { label: 'Ready for review', tone: 'warning', dot: 'bg-warning' },
    submitted: { label: 'Submitted', tone: 'brand', dot: 'bg-brand-500' },
    approved: { label: 'Approved', tone: 'success', dot: 'bg-success' },
    rejected: { label: 'Rejected', tone: 'danger', dot: 'bg-danger' },
    invoiced: { label: 'Invoiced', tone: 'violet', dot: 'bg-violet-500' },
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
