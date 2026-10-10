'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
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
      setError('Enter a valid email address.');
      return;
    }
    setPending(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage('If an account exists for that address, a reset link is on its way. Check your email and spam folder.');
    } catch {
      setError('We could not send a reset link. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div><label className="field-label" htmlFor="email">Work email</label><input className="field-control" id="email" name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@company.com" /></div>
    {message && <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm leading-5 text-green-900" role="status">{message}</p>}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}
    <Button disabled={pending} type="submit" className="w-full">{pending && <LoaderCircle size={17} className="animate-spin" />}{pending ? 'Sending link…' : 'Send reset link'}</Button>
  </form>;
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
      setError('The passwords do not match.');
      return;
    }
    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('Your password has been updated. Taking you to the workspace…');
      window.setTimeout(() => { router.replace('/dashboard'); router.refresh(); }, 900);
    } catch {
      setError('We could not update your password. The reset link may have expired; request a fresh one and try again.');
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div><label className="field-label" htmlFor="password">New password</label><input className="field-control" id="password" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" placeholder="At least 8 characters" /></div>
    <div><label className="field-label" htmlFor="confirm_password">Confirm new password</label><input className="field-control" id="confirm_password" name="confirm_password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" placeholder="Enter it again" /></div>
    {message && <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-900" role="status">{message}</p>}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{error}</p>}
    <Button disabled={pending} type="submit" className="w-full">{pending && <LoaderCircle size={17} className="animate-spin" />}{pending ? 'Updating…' : 'Set new password'}</Button>
  </form>;
}
