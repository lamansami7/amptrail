'use client';

import { useActionState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateSettingsAction, type SettingsActionState } from '@/lib/actions/settings';

export function SettingsForm({ fullName, companyName }: { fullName: string; companyName: string }) {
  const [state, action, pending] = useActionState(updateSettingsAction, {} as SettingsActionState);
  return <form action={action} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7">
    <div><p className="eyebrow">Profile and company</p><h2 className="mt-1 text-lg font-bold text-ink">Workspace details</h2><p className="mt-1 text-sm text-muted">These details appear in your AmpTrail workspace.</p></div>
    <div><label className="field-label" htmlFor="full_name">Your name</label><input className="field-control" id="full_name" name="full_name" maxLength={120} defaultValue={fullName} placeholder="Your name" /></div>
    <div><label className="field-label" htmlFor="company_name">Company name</label><input className="field-control" id="company_name" name="company_name" required maxLength={160} defaultValue={companyName} /></div>
    {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{state.error}</p>}
    {state.success && <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-900" role="status">{state.success}</p>}
    <Button type="submit" disabled={pending}>{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{pending ? 'Saving…' : 'Save changes'}</Button>
  </form>;
}
