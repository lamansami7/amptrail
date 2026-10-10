import type { Metadata } from 'next';
import { AuthFrame } from '@/components/auth/auth-frame';
import { ResetPasswordForm } from '@/components/auth/password-reset-form';
import { SetupNotice } from '@/components/setup-notice';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return <AuthFrame title="Choose a new password" subtitle="Use at least 8 characters. The reset link only works once and may expire.">
    {!isSupabaseConfigured() ? <SetupNotice compact /> : <ResetPasswordForm />}
  </AuthFrame>;
}
