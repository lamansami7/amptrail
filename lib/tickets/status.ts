export const ticketStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready_for_review', label: 'Ready for review' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'invoiced', label: 'Invoiced' },
] as const;
