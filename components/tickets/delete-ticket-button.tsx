'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { deleteDraftTicketAction } from '@/lib/actions/tickets';
import { Button } from '@/components/ui/button';

export function DeleteTicketButton({ id, ticketNumber }: { id: string; ticketNumber: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function remove() {
    if (!window.confirm(`Delete draft ${ticketNumber}? Its line items and attached evidence will also be removed. This cannot be undone.`)) return;
    setError('');
    startTransition(async () => {
      const result = await deleteDraftTicketAction(id);
      if (result.error) setError(result.error);
      else {
        router.replace('/tickets');
        router.refresh();
      }
    });
  }

  return <div>
    <Button type="button" variant="danger" onClick={remove} disabled={pending}>{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}{pending ? 'Deleting…' : 'Delete draft'}</Button>
    {error && <p className="mt-2 max-w-xs text-xs leading-5 text-red-700" role="alert">{error}</p>}
  </div>;
}
