import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth/auth-frame';
import { AuthForm } from '@/components/auth/auth-form';
import { SetupNotice } from '@/components/setup-notice';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  return <AuthFrame title="Welcome back" subtitle="Log in to your AmpTrail field workspace.">
    {!isSupabaseConfigured() ? <SetupNotice compact /> : <>
      {params.error === 'auth_callback_failed' && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">That sign-in link could not be verified. Request a fresh link and try again.</p>}
      {params.error === 'supabase_not_configured' && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900" role="status">Authentication is not set up for this deployment yet.</p>}
      <AuthForm mode="login" nextPath={params.next} />
    </>}
  </AuthFrame>;
}
