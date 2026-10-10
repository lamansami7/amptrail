import type { Metadata } from 'next';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { SettingsForm } from '@/components/forms/settings-form';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { requireWorkspace } from '@/lib/data/workspace';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { supabase, user, workspace } = await requireWorkspace();
  const { data: profile, error } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle();
  if (error) return <><PageHeader title="Settings" description="Manage the details behind your workspace." /><DataSetupMessage /></>;
  const fullName = profile?.full_name || user.user_metadata?.full_name || '';
  return <>
    <PageHeader eyebrow="Your workspace" title="Settings" description="Update your profile and company details, or review your current account access." />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
      <SettingsForm fullName={fullName} companyName={workspace.name} />
      <div className="space-y-4">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange/10 text-orange"><UserRound size={18} /></span><div><h2 className="font-bold text-ink">Account</h2><p className="text-xs text-muted">Your sign-in details</p></div></div><div className="mt-5 border-t border-line pt-4"><p className="text-xs font-semibold text-muted">Email address</p><p className="mt-1 break-all text-sm font-medium text-ink">{user.email || profile?.email || 'Not available'}</p><p className="mt-3 text-xs leading-5 text-muted">Email changes are managed through Supabase Auth and may require confirmation.</p></div></section>
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-green/10 text-green"><ShieldCheck size={18} /></span><div><h2 className="font-bold text-ink">Workspace access</h2><p className="text-xs text-muted">Company-scoped records</p></div></div><p className="mt-4 text-sm font-semibold text-ink">{workspace.name}</p><p className="mt-1 text-xs leading-5 text-muted">Your projects, tickets, and evidence are isolated by workspace policies in Supabase. Signed-in members can view workspace records; ticket editing and draft deletion are limited to the creator.</p><p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted"><KeyRound size={13} /> Role: {workspace.role}</p></section>
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"><h2 className="font-bold text-ink">Session</h2><p className="mt-1 text-sm leading-6 text-muted">Sign out of AmpTrail on this device. Your data remains in your workspace.</p><div className="mt-3"><SignOutButton /></div></section>
        <div className="flex flex-wrap gap-3 px-1 text-xs font-semibold text-muted"><ButtonLink href="/privacy" variant="quiet" className="min-h-9 px-2">Privacy</ButtonLink><ButtonLink href="/terms" variant="quiet" className="min-h-9 px-2">Terms</ButtonLink></div>
      </div>
    </div>
  </>;
}
