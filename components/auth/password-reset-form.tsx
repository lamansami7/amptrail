'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      setError('Enter a valid work email address.');
      return;
    }
    setPending(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage(
        'If an account exists for that address, a secure reset link has been dispatched. Please check your inbox and spam folder.'
      );
    } catch {
      setError('Unable to send password reset email. Please verify connection and retry.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="field-label" htmlFor="email">
          Account Email
        </label>
        <input
          className="field-control"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="foreman@company.com"
        />
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending && <LoaderCircle size={15} className="animate-spin" />}
        {pending ? 'Sending Secure Link…' : 'Send Reset Link'}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirm_password') || '');

    if (password.length < 8 || password.length > 128) {
      setError('Use a password between 8 and 128 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match. Please re-enter.');
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage('Password updated successfully! Redirecting to workspace dashboard…');
      window.setTimeout(() => {
        router.replace('/dashboard');
        router.refresh();
      }, 900);
    } catch {
      setError(
        'Password could not be reset. The recovery link may have expired or was already used. Please request a fresh link.'
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="field-label" htmlFor="password">
          New Password
        </label>
        <input
          className="field-control font-mono"
          id="password"
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="confirm_password">
          Confirm New Password
        </label>
        <input
          className="field-control font-mono"
          id="confirm_password"
          name="confirm_password"
          type="password"
          minLength={8}
          maxLength={128}
          required
          autoComplete="new-password"
          placeholder="Re-enter password"
        />
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <Button disabled={pending} type="submit" className="w-full">
        {pending && <LoaderCircle size={15} className="animate-spin" />}
        {pending ? 'Updating Password…' : 'Save New Password'}
      </Button>
    </form>
  );
}
