import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, Lock, LogOut, ShieldCheck, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceDataNotice } from '@/components/workspace/data-notice';
import { SettingsForm } from '@/components/forms/settings-form';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { Card, CardHeader } from '@/components/ui/card';
import { requireWorkspace } from '@/lib/data/workspace';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { supabase, user, workspace } = await requireWorkspace();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Settings"
          description="Profile, company details and security."
        />
        <WorkspaceDataNotice />
      </div>
    );
  }

  const fullName = profile?.full_name || (user.user_metadata?.full_name as string) || '';
  const email = user.email ?? '';
  const memberSince = user.created_at;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="The details behind your records — your profile, your company name on exports, and access to this workspace."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <SettingsForm fullName={fullName} companyName={workspace.name} email={email} />

        <div className="space-y-6">
          <Card flush>
            <CardHeader
              title="Account"
              description="Managed by Supabase Auth"
              icon={<KeyRound size={16} aria-hidden="true" />}
              bordered
            />
            <dl className="px-5 py-4 text-[13px]">
              <div className="flex flex-col gap-0.5 py-1.5">
                <dt className="text-[12px] text-subtle">Email address</dt>
                <dd className="break-words font-medium text-ink">{email}</dd>
              </div>
              {memberSince && (
                <div className="flex flex-col gap-0.5 py-1.5">
                  <dt className="text-[12px] text-subtle">Member since</dt>
                  <dd className="font-medium text-ink">{formatDate(memberSince)}</dd>
                </div>
              )}
              <div className="py-1.5">
                <dt className="text-[12px] text-subtle">Password</dt>
                <dd className="mt-1">
                  <Link
                    href="/forgot-password"
                    className="link inline-flex items-center gap-1.5 text-[13px]"
                  >
                    <Lock size={13} aria-hidden="true" />
                    Send a reset link
                  </Link>
                </dd>
              </div>
            </dl>
          </Card>

          <Card flush>
            <CardHeader
              title="Workspace access"
              description="Row-level security in PostgreSQL"
              icon={<ShieldCheck size={16} aria-hidden="true" />}
              bordered
            />
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Users size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{workspace.name}</p>
                  <p className="mt-0.5 text-[12.5px] capitalize text-muted">
                    {workspace.role} role
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[12.5px] leading-6 text-muted">
                Records are isolated per company at the database level. Members of this workspace can
                read its projects, tickets and evidence; only the creator of a ticket can edit or
                delete it.
              </p>
              <p className="mt-3 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[12px] leading-5 text-muted">
                Inviting teammates and switching between multiple companies is not part of this
                release.
              </p>
            </div>
          </Card>

          <Card flush>
            <CardHeader
              title="Session"
              description="Sign out of this device"
              icon={<LogOut size={16} aria-hidden="true" />}
              bordered
            />
            <div className="flex flex-col gap-3 px-5 py-4">
              <p className="text-[13px] leading-6 text-muted">
                Signing out clears the session on this device. Field records and evidence remain in
                your company workspace.
              </p>
              <SignOutButton variant="secondary" size="md" className="self-start" />
            </div>
          </Card>

          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
            <Link href="/privacy" className="text-muted transition-colors duration-150 hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted transition-colors duration-150 hover:text-ink">
              Terms
            </Link>
            <Link href="/contact" className="text-muted transition-colors duration-150 hover:text-ink">
              Support
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
