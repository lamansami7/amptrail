'use client';

import { useFormStatus } from 'react-dom';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { duplicateTicketAction } from '@/lib/actions/tickets';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" loading={pending} title={label}>
      {!pending && <Copy size={14} aria-hidden="true" />}
      {pending ? 'Duplicating…' : 'Duplicate'}
    </Button>
  );
}

/**
 * Duplicating copies the header details and every line item into a new draft,
 * so nothing is submitted by accident. The server action redirects straight to
 * the new draft's editor.
 */
export function DuplicateTicketButton({
  ticketId,
  ticketNumber,
}: {
  ticketId: string;
  ticketNumber: string;
}) {
  return (
    <form action={duplicateTicketAction}>
      <input type="hidden" name="id" value={ticketId} />
      <SubmitButton label={`Copy the details and line items of ${ticketNumber} into a new draft`} />
    </form>
  );
}
