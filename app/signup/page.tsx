import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth/auth-frame';
import { AuthForm } from '@/components/auth/auth-form';
import { SetupNotice } from '@/components/setup-notice';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Create your workspace' };

export default async function SignupPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  return (
    <AuthFrame
      eyebrow="Start documenting"
      title="Create your workspace"
      subtitle="One account for your crew. Add projects, capture extra work, and keep the record in one place."
    >
      {!isSupabaseConfigured() ? <SetupNotice compact /> : <AuthForm mode="signup" />}
    </AuthFrame>
  );
}
