'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Mail, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  describeAuthError,
  passwordResetRedirectUrl,
  resetRequestAcceptedNotice,
} from '@/lib/auth/recovery';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';
import { Button, ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || cooldown > 0) return;
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
        redirectTo: passwordResetRedirectUrl(window.location.origin),
      });
      if (resetError) throw resetError;
      setSentTo(email);
      setCooldown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((remaining) => {
          if (remaining <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return remaining - 1;
        });
      }, 1000);
    } catch (submissionError) {
      setError(
        describeAuthError(
          submissionError instanceof Error ? submissionError.message : 'Request failed.'
        )
      );
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <Alert tone="success" role="status" title="Reset request accepted">
          {resetRequestAcceptedNotice(sentTo)}
        </Alert>
        <div className="rounded-xl border border-line bg-surface-2/60 p-4 text-[13px] leading-6 text-muted">
          <p className="font-semibold text-ink">What happens next</p>
          <ol className="mt-2 space-y-1.5">
            <li>1. Open the message from your email provider.</li>
            <li>2. Use the “Choose a new password” link — it works once and expires quickly.</li>
            <li>3. Set the new password on the page it opens. You are done.</li>
          </ol>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            loading={pending}
            disabled={cooldown > 0}
            onClick={() => {
              setSentTo('');
              setError('');
            }}
          >
            <Send size={14} aria-hidden="true" />
            {cooldown > 0 ? `Send again in ${cooldown}s` : 'Send to a different address'}
          </Button>
          <Link href="/login" className="link text-[13px]">
            Back to sign in
          </Link>
        </div>
      </div>
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
        <Alert tone="danger" role="alert" title="Reset email not requested">
          <p>{error}</p>
          <p className="mt-1.5 text-[12px]">
            Still stuck? Email{' '}
            <a href={supportMailto({ subject: 'Password reset help' })} className="link">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Alert>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? 'Sending reset link…' : 'Send reset link'}
      </Button>
    </form>
  );
}

type ResetFieldErrors = { password?: string; confirm_password?: string };

/**
 * The new-password form shown after a recovery link is opened. It verifies a
 * recovery session exists first — if the link expired or was already used, the
 * user gets an honest explanation and a one-click way to request a fresh link
 * instead of a form that silently fails on submit.
 */
export function ResetPasswordForm({ linkError }: { linkError?: string }) {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<'checking' | 'ready' | 'missing'>(
    linkError ? 'missing' : 'checking'
  );
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (linkError) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error: sessionError } = await createClient().auth.getSession();
        if (!cancelled) {
          setSessionState(!sessionError && data.session ? 'ready' : 'missing');
        }
      } catch {
        if (!cancelled) setSessionState('missing');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkError]);

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
    } catch (updateError) {
      setError(
        describeAuthError(updateError instanceof Error ? updateError.message : 'Update failed.')
      );
    } finally {
      setPending(false);
    }
  }

  if (sessionState === 'checking') {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <div className="h-11 animate-pulse rounded-lg bg-surface-3" />
        <div className="h-11 animate-pulse rounded-lg bg-surface-3" />
        <div className="h-11 animate-pulse rounded-lg bg-surface-3" />
        <p className="text-center text-[12.5px] text-muted">Checking your secure link…</p>
      </div>
    );
  }

  if (sessionState === 'missing') {
    return (
      <div className="space-y-4">
        <Alert
          tone="warning"
          role="status"
          title="This link can no longer be used"
        >
          {linkError === 'otp_expired'
            ? 'The password recovery link has expired. These links are short-lived on purpose.'
            : 'Recovery links work once and expire quickly. This one has expired, was already used, or was opened without its secure code.'}
        </Alert>
        <div className="rounded-xl border border-line bg-surface-2/60 p-4 text-[13px] leading-6 text-muted">
          <p className="font-semibold text-ink">Get a fresh link</p>
          <p className="mt-1.5">
            Request a new reset email and open the link from that message right away. It arrives at
            the email address on your account.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <ButtonLink href="/forgot-password" size="lg" className="w-full">
            <Mail size={16} aria-hidden="true" />
            Send a new reset link
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" size="lg" className="w-full">
            Back to sign in
          </ButtonLink>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-[12px] text-muted">
            <AlertCircle size={12} className="text-subtle" aria-hidden="true" />
            Link keeps failing? Email{' '}
            <a href={supportMailto({ subject: 'Password reset link problems' })} className="link">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    );
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

      <p className="text-center text-[12px] leading-5 text-subtle">
        Setting this password signs you in on this device. Other signed-in devices keep their
        sessions until they expire.
      </p>
    </form>
  );
}
