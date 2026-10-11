import type { Metadata } from 'next';
import Link from 'next/link';
import {
  KeyRound,
  ShieldCheck,
  UserRound,
  Lock,
} from 'lucide-react';
import { PageHeader, DataSetupMessage } from '@/components/workspace/app-page';
import { SettingsForm } from '@/components/forms/settings-form';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { requireWorkspace } from '@/lib/data/workspace';

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
      <>
        <PageHeader title="Settings" description="Manage the details behind your workspace." />
        <DataSetupMessage />
      </>
    );
  }

  const fullName = profile?.full_name || user.user_metadata?.full_name || '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace Preferences"
        title="Settings"
        description="Update your subcontractor company name, user profile, and security preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        {/* Main Settings Form */}
        <SettingsForm fullName={fullName} companyName={workspace.name} />

        {/* Security & Access Sidebar */}
        <div className="space-y-6">
          {/* Account Details */}
          <section className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={17} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Account Credentials</h2>
                <p className="text-[11px] text-slate-400">Authenticated Supabase user</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-2">
              <div>
                <p className="text-slate-400 font-medium">Work Email</p>
                <p className="mt-0.5 font-semibold text-slate-900 break-all">{user.email}</p>
              </div>
              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Lock size={13} />
                  Reset Password
                </Link>
              </div>
            </div>
          </section>

          {/* Workspace Security & Isolation */}
          <section className="card p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={17} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tenant Isolation</h2>
                <p className="text-[11px] text-slate-400">Row-Level Security (RLS)</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2 pt-2 border-t border-slate-100">
              <p>
                All company records are strictly isolated in PostgreSQL using Row-Level Security. Cross-tenant access is prevented at the database kernel level.
              </p>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium pt-1">
                <KeyRound size={13} className="text-blue-600" />
                <span>Your Workspace Role: <strong className="text-slate-800 uppercase">{workspace.role}</strong></span>
              </div>
            </div>
          </section>

          {/* Sign Out Card */}
          <section className="card p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900">Session Management</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Sign out on this device. Your field records and evidence stay encrypted in your company workspace.
            </p>
            <div className="mt-4">
              <SignOutButton />
            </div>
          </section>

          {/* Legal Links */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
            <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-slate-600">Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
