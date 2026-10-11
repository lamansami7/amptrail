import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthFrame } from '@/components/auth/auth-frame';
import { ForgotPasswordForm } from '@/components/auth/password-reset-form';
import { SetupNotice } from '@/components/setup-notice';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email on your account and we will send a secure reset link."
    >
      {!isSupabaseConfigured() ? (
        <SetupNotice compact />
      ) : (
        <>
          <ForgotPasswordForm />
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to sign in
          </Link>
        </>
      )}
    </AuthFrame>
  );
}
