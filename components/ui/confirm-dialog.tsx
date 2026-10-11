'use client';

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Accessible confirmation dialog built on the native <dialog> element, so
 * focus is trapped, Escape closes, and the backdrop is provided by the
 * browser. Destructive actions always require an explicit confirmation.
 */
export function ConfirmDialog({
  title,
  description,
  details,
  confirmLabel,
  pendingLabel = 'Working…',
  cancelLabel = 'Cancel',
  tone = 'danger',
  triggerLabel,
  triggerVariant = 'secondary',
  triggerSize = 'md',
  triggerIcon,
  onConfirm,
}: {
  title: string;
  description: string;
  details?: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  triggerSize?: 'sm' | 'md' | 'lg';
  triggerIcon?: ReactNode;
  onConfirm: () => Promise<{ error?: string } | void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open) cancelRef.current?.focus();
  }, []);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
    // Focus the safe action rather than the destructive one.
    requestAnimationFrame(() => cancelRef.current?.focus());
  }

  function close() {
    dialogRef.current?.close();
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result && 'error' in result && result.error) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        onClick={open}
        className="whitespace-nowrap"
      >
        {triggerIcon}
        {triggerLabel}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setError(null)}
        className={cn(
          'w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-lg',
          'backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]'
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              onClick={close}
              aria-label="Close dialog"
              className="-mr-1 -mt-1"
            >
              <X size={16} />
            </Button>
          </div>

          <p id={descriptionId} className="mt-2 text-[13px] leading-6 text-muted">
            {description}
          </p>
          {details && <div className="mt-3 rounded-lg bg-surface-2 p-3 text-[13px] text-body">{details}</div>}

          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            ref={cancelRef}
            type="button"
            variant="secondary"
            onClick={close}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={confirm}
            loading={pending}
            className="sm:min-w-32"
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}

export function LoadingLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
      {children}
    </>
  );
}
