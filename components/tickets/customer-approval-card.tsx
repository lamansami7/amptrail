'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { recordCustomerApprovalAction } from '@/lib/actions/tickets';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Select, Textarea } from '@/components/ui/field';
import { customerApprovalLabel, customerApprovalOptions, customerApprovalTone } from '@/lib/tickets/status';
import { cn, formatDateTime } from '@/lib/utils';

const toneClasses: Record<string, string> = {
  neutral: 'border-line-strong/70 bg-surface-3 text-body',
  warning: 'border-warning-line bg-warning-soft text-warning',
  success: 'border-success-line bg-success-soft text-success',
  danger: 'border-danger-line bg-danger-soft text-danger',
  brand: 'border-brand-line bg-brand-50 text-brand-800',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

export function CustomerApprovalBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold',
        toneClasses[customerApprovalTone(value)],
        className
      )}
    >
      {customerApprovalLabel(value)}
    </span>
  );
}

/**
 * Customer approval is a manual record, kept apart from the workflow status so a
 * PDF export or a "Finalized" ticket is never mistaken for customer sign-off.
 */
export function CustomerApprovalCard({
  ticketId,
  approval,
  note,
  recordedAt,
  isDraft,
  canEdit,
}: {
  ticketId: string;
  approval: string;
  note: string | null;
  recordedAt: string | null;
  isDraft: boolean;
  canEdit: boolean;
}) {
  const uid = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(approval);
  const [text, setText] = useState(note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = value !== approval || text.trim() !== (note ?? '');

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await recordCustomerApprovalAction({ ticketId, approval: value, note: text });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card flush className="no-print">
      <CardHeader title="Customer approval" bordered />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <CustomerApprovalBadge value={approval} />
          {recordedAt && (
            <span className="text-[11.5px] text-subtle">Recorded {formatDateTime(recordedAt)}</span>
          )}
        </div>

        {note && !canEdit && <p className="text-[13px] leading-6 text-body">{note}</p>}

        {canEdit ? (
          <div className="space-y-3.5">
            <Field id={`${uid}-approval`} label="Where this stands with the customer">
              {(props) => (
                <Select
                  {...props}
                  value={value}
                  disabled={pending}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setSaved(false);
                  }}
                >
                  {customerApprovalOptions.map((option) => (
                    <option key={option.value} value={option.value} disabled={isDraft && option.value !== 'not_requested'}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              id={`${uid}-note`}
              label="Reference"
              optional
              hint="Who approved and how, for example “J. Rivera, by email, Oct 12”."
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  maxLength={1000}
                  value={text}
                  disabled={pending}
                  onChange={(event) => {
                    setText(event.target.value);
                    setSaved(false);
                  }}
                />
              )}
            </Field>

            {isDraft && (
              <p className="text-[12px] leading-5 text-muted">
                Move this ticket out of Draft before recording customer approval.
              </p>
            )}
            {error && (
              <Alert tone="danger" role="alert">
                {error}
              </Alert>
            )}
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={save} loading={pending} disabled={!dirty || pending}>
                Save record
              </Button>
              {saved && !dirty && (
                <span className="flex items-center gap-1 text-[12px] font-medium text-success" role="status">
                  <Check size={13} aria-hidden="true" /> Saved
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[12px] leading-5 text-muted">
            Only the person who created this ticket can change this record.
          </p>
        )}

        <p className="border-t border-line pt-3 text-[11.5px] leading-5 text-subtle">
          This is a manual record kept by your team. AmpTrail does not contact the customer, and
          exporting a PDF never changes it.
        </p>
      </div>
    </Card>
  );
}
