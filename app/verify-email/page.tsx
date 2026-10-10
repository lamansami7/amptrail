import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth/auth-frame';
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel';
import { SetupNotice } from '@/components/setup-notice';
import { normalizeEmailParam } from '@/lib/auth/rules';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Verify your email' };
export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const safeEmail = normalizeEmailParam(email);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  return <AuthFrame title="Check your email" subtitle="One more step before your workspace opens.">
    {!isSupabaseConfigured() ? <SetupNotice compact /> : <>
      <VerifyEmailPanel initialEmail={safeEmail} />
      <p className="mt-6 text-center text-sm text-muted">
        Already confirmed?{' '}<Link href="/login" className="font-bold text-orange-dark hover:underline">Log in</Link>
        {' · '}
        <Link href="/signup" className="font-semibold text-muted hover:text-ink">Use a different email</Link>
      </p>
    </>}
  </AuthFrame>;
}
