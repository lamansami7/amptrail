'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { authCallbackUrl, describeAuthError } from '@/lib/auth/recovery';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';

function safeNextPath(path?: string) {
  return path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/dashboard';
}

type FieldErrors = { full_name?: string; company_name?: string; email?: string; password?: string };

export function AuthForm({ mode, nextPath }: { mode: 'login' | 'signup'; nextPath?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const isSignup = mode === 'signup';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const companyName = String(form.get('company_name') || '').trim();

    const nextErrors: FieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      nextErrors.email = 'Enter a valid email address, for example foreman@company.com.';
    }
    if (password.length < 8 || password.length > 128) {
      nextErrors.password = 'Passwords are between 8 and 128 characters.';
    }
    if (isSignup && !companyName) {
      nextErrors.company_name = 'Enter the electrical contracting company name.';
    } else if (isSignup && companyName.length > 160) {
      nextErrors.company_name = 'Company name must be 160 characters or fewer.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const firstId = Object.keys(nextErrors)[0];
      document.getElementById(firstId)?.focus();
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authCallbackUrl(window.location.origin, '/dashboard'),
            data: {
              full_name: String(form.get('full_name') || '').trim(),
              company_name: companyName,
            },
          },
        });
        if (authError) throw authError;
        if (!data.user) throw new Error('Account creation failed. Please retry.');

        if (data.session) {
          router.replace('/dashboard');
          router.refresh();
        } else {
          setSuccess(
            'Account created. We sent a confirmation link to your email — open it to activate the workspace, then sign in.'
          );
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(safeNextPath(nextPath));
        router.refresh();
      }
    } catch (submissionError) {
      setError(
        describeAuthError(
          submissionError instanceof Error ? submissionError.message : 'Authentication failed.'
        )
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-5" noValidate>
      {isSignup && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="full_name" label="Your name" optional>
            {({ id }) => (
              <input
                id={id}
                name="full_name"
                autoComplete="name"
                maxLength={120}
                className="field-control"
                placeholder="David Miller"
              />
            )}
          </Field>

          <Field
            id="company_name"
            label="Company name"
            required
            error={fieldErrors.company_name}
          >
            {(props) => (
              <input
                {...props}
                name="company_name"
                autoComplete="organization"
                maxLength={160}
                className="field-control"
                placeholder="Miller Electric"
              />
            )}
          </Field>
        </div>
      )}

      <Field
        id="email"
        label="Work email"
        required
        error={fieldErrors.email}
        hint={isSignup ? undefined : undefined}
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

      <Field
        id="password"
        label="Password"
        required
        error={fieldErrors.password}
        hint={isSignup ? 'At least 8 characters. Longer is better.' : undefined}
      >
        {(props) => (
          <div className="relative">
            <input
              {...props}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={8}
              maxLength={128}
              className="field-control pr-12"
              placeholder={isSignup ? 'Create a password' : 'Your password'}
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

      {!isSignup && (
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="link text-[13px]">
            Forgot your password?
          </Link>
        </div>
      )}

      {error && (
        <Alert tone="danger" role="alert" title="We couldn’t sign you in">
          {error}
        </Alert>
      )}

      {success && (
        <Alert tone="success" role="status" title="Check your inbox">
          {success}
        </Alert>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending
          ? isSignup
            ? 'Creating workspace…'
            : 'Signing in…'
          : isSignup
            ? 'Create workspace'
            : 'Sign in'}
      </Button>

      <p className="text-center text-[13px] text-muted">
        {isSignup ? 'Already have a workspace?' : 'New to AmpTrail?'}{' '}
        <Link href={isSignup ? '/login' : '/signup'} className="link">
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>

      {isSignup && (
        <p className="text-center text-[12px] leading-5 text-subtle">
          By creating an account you agree to the{' '}
          <Link href="/terms" className="link text-[12px]">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="link text-[12px]">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
