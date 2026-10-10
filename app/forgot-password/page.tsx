import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthFrame } from '@/components/auth/auth-frame';
import { ForgotPasswordForm } from '@/components/auth/password-reset-form';
import { SetupNotice } from '@/components/setup-notice';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return <AuthFrame title="Reset your password" subtitle="We will send a secure reset link to the email on your account.">
    {!isSupabaseConfigured() ? <SetupNotice compact /> : <>
      <ForgotPasswordForm />
      <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={15} />Back to log in</Link>
    </>}
  </AuthFrame>;
}
