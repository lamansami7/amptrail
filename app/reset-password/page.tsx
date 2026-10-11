import type { Metadata } from 'next';
import { AuthFrame } from '@/components/auth/auth-frame';
import { ResetPasswordForm } from '@/components/auth/password-reset-form';
import { SetupNotice } from '@/components/setup-notice';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Use at least 8 characters. Recovery links work once and expire, so set the new password now."
    >
      {!isSupabaseConfigured() ? <SetupNotice compact /> : <ResetPasswordForm />}
    </AuthFrame>
  );
}
