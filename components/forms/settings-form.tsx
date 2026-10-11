'use client';

import { useActionState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateSettingsAction, type SettingsActionState } from '@/lib/actions/settings';

export function SettingsForm({
  fullName,
  companyName,
}: {
  fullName: string;
  companyName: string;
}) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState);

  return (
    <form action={action} className="card space-y-6 p-6 sm:p-7">
      <div className="border-b border-slate-100 pb-4">
        <p className="eyebrow">Profile & Organization</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">Workspace Profile</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          These details are displayed on work tickets, PDF exports, and team audit logs.
        </p>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{state.success}</span>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="full_name">
          Your Full Name
        </label>
        <div className="relative">
          <input
            className="field-control"
            id="full_name"
            name="full_name"
            maxLength={120}
            defaultValue={fullName}
            placeholder="e.g. Mike Henderson"
          />
        </div>
        <p className="field-hint">Your name appears as the author on work tickets you create.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="company_name">
          Subcontractor / Company Name <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <input
            className="field-control"
            id="company_name"
            name="company_name"
            required
            maxLength={160}
            defaultValue={companyName}
            placeholder="e.g. Henderson Electric & Controls Inc."
          />
        </div>
        <p className="field-hint">This name is printed in the official header of all PDF work records.</p>
      </div>

      <div className="border-t border-slate-100 pt-4 flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending && <LoaderCircle size={15} className="animate-spin" />}
          {pending ? 'Saving Changes…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
