'use client';

import { useActionState } from 'react';
import { Building2, Save, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { updateSettingsAction, type SettingsActionState } from '@/lib/actions/settings';

export function SettingsForm({
  fullName,
  companyName,
  email,
}: {
  fullName: string;
  companyName: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsActionState
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert tone="danger" role="alert" title="Changes were not saved">
          {state.error}
        </Alert>
      )}
      {state.success && (
        <Alert tone="success" role="status">
          {state.success}
        </Alert>
      )}

      <Card flush>
        <CardHeader
          title="Your profile"
          description="Shown on the records you author."
          icon={<UserRound size={16} aria-hidden="true" />}
          bordered
        />
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field id="full_name" label="Full name" optional hint="Appears as the author on your tickets.">
            {(props) => (
              <Input
                {...props}
                name="full_name"
                defaultValue={fullName}
                maxLength={120}
                autoComplete="name"
                placeholder="Mike Henderson"
              />
            )}
          </Field>

          <Field id="email" label="Work email" hint="Managed by Supabase Auth and cannot be changed here.">
            {(props) => (
              <Input
                {...props}
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
              />
            )}
          </Field>
        </div>
      </Card>

      <Card flush>
        <CardHeader
          title="Company details"
          description="Printed in the header of every exported work record."
          icon={<Building2 size={16} aria-hidden="true" />}
          bordered
        />
        <div className="p-5 sm:p-6">
          <Field
            id="company_name"
            label="Subcontractor / company name"
            required
            hint="Use the legal or trading name your general contractors know."
          >
            {(props) => (
              <Input
                {...props}
                name="company_name"
                required
                maxLength={160}
                defaultValue={companyName}
                autoComplete="organization"
                placeholder="Henderson Electric & Controls, Inc."
              />
            )}
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/60 px-5 py-4 sm:px-6">
          <p className="text-[12px] text-muted">
            Changes apply to future exports. Existing records keep the name they were created with.
          </p>
          <Button type="submit" loading={pending}>
            {!pending && <Save size={15} aria-hidden="true" />}
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>
    </form>
  );
}
