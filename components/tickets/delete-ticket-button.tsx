'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteDraftTicketAction } from '@/lib/actions/tickets';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/**
 * Draft deletion is irreversible, so it is guarded by a dialog that names the
 * ticket and states exactly what else is removed.
 */
export function DeleteTicketButton({
  id,
  ticketNumber,
}: {
  id: string;
  ticketNumber: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <ConfirmDialog
        triggerLabel="Delete draft"
        triggerVariant="dangerSoft"
        triggerIcon={<Trash2 size={14} aria-hidden="true" />}
        title={`Delete draft ${ticketNumber}?`}
        description="This permanently removes the ticket, its labor, material and equipment lines, and any evidence photos attached to it. Only drafts can be deleted."
        confirmLabel="Delete draft"
        pendingLabel="Deleting…"
        onConfirm={async () => {
          setError(null);
          const result = await deleteDraftTicketAction(id);
          if (result.error) {
            setError(result.error);
            return result;
          }
          router.replace('/tickets');
          router.refresh();
          return {};
        }}
      />
      {error && (
        <p role="alert" className="text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}
