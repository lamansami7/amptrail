'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setEmailError(undefined);

    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      setEmailError('Enter a valid email address.');
      document.getElementById('email')?.focus();
      return;
    }

    setPending(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError(
        'We could not send the reset email. Check your connection and try again in a moment.'
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Alert tone="success" role="status" title="Reset email sent">
        If an account exists for that address, a reset link is on its way. The link expires
        shortly, so open it soon. Check your spam folder if it has not arrived within a few minutes.
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} method="post" className="space-y-5" noValidate>
      <Field
        id="email"
        label="Account email"
        required
        error={emailError}
        hint="We will only send a link if this address has an AmpTrail account."
      >
        {(props) => (
          <input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            className="field-control"
            placeholder="foreman@company.com"
          />
        )}
      </Field>

      {error && (
        <Alert tone="danger" role="alert" title="Reset email not sent">
          {error}
        </Alert>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? 'Sending reset link…' : 'Send reset link'}
      </Button>
    </form>
  );
}

type ResetFieldErrors = { password?: string; confirm_password?: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirm_password') || '');

    const nextErrors: ResetFieldErrors = {};
    if (password.length < 8 || password.length > 128) {
      nextErrors.password = 'Use between 8 and 128 characters.';
    }
    if (password !== confirmation) {
      nextErrors.confirm_password = 'The two passwords do not match.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      window.setTimeout(() => {
        router.replace('/dashboard');
        router.refresh();
      }, 1200);
    } catch {
      setError(
        'We could not update the password. The recovery link may have expired or already been used — request a fresh one.'
      );
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Alert tone="success" role="status" title="Password updated">
        Your password has been changed. Taking you to your workspace…
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} method="post" className="space-y-5" noValidate>
      {error && (
        <Alert tone="danger" role="alert" title="Password not updated">
          {error}
        </Alert>
      )}

      <Field id="password" label="New password" required error={fieldErrors.password}>
        {(props) => (
          <div className="relative">
            <input
              {...props}
              name="password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className="field-control pr-12"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-md text-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-body"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
        )}
      </Field>

      <Field id="confirm_password" label="Confirm new password" required error={fieldErrors.confirm_password}>
        {(props) => (
          <input
            {...props}
            name="confirm_password"
            type={showPassword ? 'text' : 'password'}
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            className="field-control"
            placeholder="Re-enter the new password"
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? 'Updating password…' : 'Save new password'}
      </Button>
    </form>
  );
}
