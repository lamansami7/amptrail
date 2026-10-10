'use client';

import { useFormStatus } from 'react-dom';
import type { FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FormAction = (formData: FormData) => void | Promise<void>;

function SubmitButton({ label, variant }: { label: string; variant: 'secondary' | 'danger' | 'quiet' }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending} className="w-full sm:w-auto">{pending && <LoaderCircle size={15} className="animate-spin" />}{pending ? 'Working…' : label}</Button>;
}

export function ConfirmActionForm({ action, id, extra, label, message, variant = 'secondary', className = '' }: { action: FormAction; id: string; extra?: Record<string, string>; label: string; message: string; variant?: 'secondary' | 'danger' | 'quiet'; className?: string }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }
  return <form action={action} onSubmit={handleSubmit} className={className}>
    <input type="hidden" name="id" value={id} />
    {Object.entries(extra || {}).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
    <SubmitButton label={label} variant={variant} />
  </form>;
}
