import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Brand } from '@/components/brand';
import { ButtonLink } from '@/components/ui/button';
import { DataSetupMessage } from '@/components/workspace/app-page';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Workspace Setup' };

export default async function WorkspaceSetupPage() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <SignOutButton compact />
        </header>

        <section className="card mt-10 p-6 sm:p-8">
          <p className="eyebrow">Account Initialization</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            Workspace Provisioning
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            AmpTrail is connecting your authenticated account to a company workspace. If this account was registered before database migrations were applied, its workspace membership record may need to be confirmed.
          </p>

          <div className="mt-6">
            <DataSetupMessage message="Verify that the initial schema migration and user provisioning triggers are active in your PostgreSQL database. If your workspace was provisioned under a different company slug, contact your administrator." />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink href="/dashboard">Check Workspace Status</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Return Home
            </ButtonLink>
            <Link
              href="/contact"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Contact Support
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
