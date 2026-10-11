import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth/auth-frame';
import { AuthForm } from '@/components/auth/auth-form';
import { SetupNotice } from '@/components/setup-notice';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  return (
    <AuthFrame
      eyebrow="AmpTrail workspace"
      title="Welcome back"
      subtitle="Sign in to document extra work, review open tickets and export records."
    >
      {!isSupabaseConfigured() ? (
        <SetupNotice compact />
      ) : (
        <div className="space-y-5">
          {params.error === 'auth_callback_failed' && (
            <Alert tone="danger" role="alert" title="That link could not be verified">
              The sign-in link has expired or was already used. Sign in below, or request a new
              password reset link.
            </Alert>
          )}
          {params.error === 'supabase_not_configured' && (
            <Alert tone="warning" role="status" title="Accounts are not connected yet">
              This deployment has no Supabase project configured, so sign-in is unavailable.
            </Alert>
          )}
          <AuthForm mode="login" nextPath={params.next} />
        </div>
      )}
    </AuthFrame>
  );
}
