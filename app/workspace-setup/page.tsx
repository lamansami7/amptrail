import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { DataSetupMessage } from '@/components/workspace/app-page';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Workspace setup' };

export default async function WorkspaceSetupPage() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between gap-4">
        <Brand />
        <SignOutButton compact />
      </header>
      <section className="mt-12 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-8">
        <p className="eyebrow">Account connected</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-ink">Your workspace is not ready yet.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">AmpTrail could not find the company workspace associated with this account. No workspace data has been fabricated or loaded.</p>
        <div className="mt-6">
          <DataSetupMessage message="Confirm the database migration and account-provisioning trigger are installed, then ask your Supabase project administrator to check this account's company membership. If this account predates the migration, its workspace may need to be provisioned." />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <ButtonLink href="/">Return to AmpTrail</ButtonLink>
          <Link href="/contact" className="text-sm font-semibold text-orange-dark underline underline-offset-4">Contact the deployment owner</Link>
        </div>
      </section>
    </div>
  </main>;
}
