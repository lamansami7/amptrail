import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Database, LifeBuoy, RefreshCw } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { SignOutButton } from '@/components/workspace/sign-out-button';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Workspace setup' };

export default async function WorkspaceSetupPage() {
  if (!isSupabaseConfigured()) redirect('/login?error=supabase_not_configured');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main className="min-h-dvh px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Brand />
          <SignOutButton />
        </header>

        <div className="mt-10 space-y-6">
          <div>
            <p className="eyebrow">Account setup</p>
            <h1 className="h1 mt-3">Finishing your workspace</h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-muted">
              You are signed in as <span className="font-medium text-body">{user.email}</span>, but we
              could not find a company membership for this account yet. That usually means the
              database migration has not been applied, or this account was created before the
              provisioning trigger existed.
            </p>
          </div>

          <Alert tone="warning" title="No workspace membership found">
            AmpTrail keeps every project, ticket and photo inside a company. Until this account is
            attached to one, the workspace stays locked.
          </Alert>

          <Card flush>
            <CardHeader
              title="How to fix this"
              description="Usually a one-time database step"
              icon={<Database size={16} aria-hidden="true" />}
              bordered
            />
            <ol className="divide-y divide-line">
              {[
                {
                  title: 'Apply the migration',
                  body: 'Run supabase/migrations/202610100001_initial_schema.sql in the Supabase SQL editor, or apply it with the Supabase CLI.',
                },
                {
                  title: 'Confirm the provisioning trigger',
                  body: 'The migration creates a trigger that provisions a company and owner membership whenever a new account is created.',
                },
                {
                  title: 'Sign out and back in',
                  body: 'The membership is read fresh on each request, so a sign-out and sign-in is usually enough.',
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4 px-5 py-4">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-3 font-mono text-[11px] font-semibold text-body">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[13px] leading-6 text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2/60 px-5 py-4">
              <ButtonLink href="/dashboard">
                <RefreshCw size={15} aria-hidden="true" />
                Check again
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                <LifeBuoy size={15} aria-hidden="true" />
                Get help
              </ButtonLink>
              <Link href="/terms" className="link ml-auto text-[13px]">
                Review terms
                <ArrowRight size={13} className="ml-1 inline" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
