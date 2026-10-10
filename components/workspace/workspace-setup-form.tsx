'use client';

import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { createWorkspaceAction, type WorkspaceSetupState } from '@/app/workspace-setup/actions';
import { Button } from '@/components/ui/button';

const initialState: WorkspaceSetupState = {};

export function WorkspaceSetupForm({ defaultCompanyName }: { defaultCompanyName: string | null }) {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, initialState);

  return <form action={formAction} className="space-y-4" noValidate>
    <div>
      <label className="field-label" htmlFor="company_name">Company name</label>
      <input id="company_name" name="company_name" required maxLength={160} defaultValue={defaultCompanyName ?? ''} aria-invalid={Boolean(state.error)} className="field-control" placeholder="Morgan Electrical" autoComplete="organization" />
    </div>
    {state.error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800" role="alert">{state.error}</p>}
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
      {pending ? 'Creating your workspace…' : 'Create workspace'}
    </Button>
  </form>;
}
