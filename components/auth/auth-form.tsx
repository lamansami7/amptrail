'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message))
    return 'Invalid email or password. Please verify your credentials or reset your password.';
  if (/email not confirmed/i.test(message))
    return 'Please confirm your email address before signing in. Check your inbox for the activation link.';
  if (/user already registered/i.test(message))
    return 'An account already exists for this email address. Try logging in instead.';
  if (/password/i.test(message) && /short|weak/i.test(message))
    return 'Choose a stronger password with at least 8 characters.';
  if (/rate limit|too many requests/i.test(message))
    return 'Rate limit reached. Please wait a moment before trying again.';
  return 'Unable to complete sign-in. Please check your internet connection and try again.';
}

function safeNextPath(path?: string) {
  return path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
    ? path
    : '/dashboard';
}

export function AuthForm({ mode, nextPath }: { mode: 'login' | 'signup'; nextPath?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isSignup = mode === 'signup';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const companyName = String(form.get('company_name') || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.');
      return;
    }
    if (isSignup && !companyName) {
      setError('Please enter your electrical contracting company name.');
      return;
    }
    if (isSignup && companyName.length > 160) {
      setError('Company name must be 160 characters or fewer.');
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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
            'Account created! A confirmation email has been sent. Check your inbox to activate your workspace.'
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
        friendlyError(
          submissionError instanceof Error ? submissionError.message : 'Authentication failed.'
        )
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {isSignup && (
        <div>
          <label className="field-label" htmlFor="full_name">
            Your Name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            autoComplete="name"
            maxLength={120}
            className="field-control"
            placeholder="e.g. David Miller"
          />
        </div>
      )}

      {isSignup && (
        <div>
          <label className="field-label" htmlFor="company_name">
            Company Name <span className="text-blue-600">*</span>
          </label>
          <input
            id="company_name"
            name="company_name"
            autoComplete="organization"
            required
            maxLength={160}
            className="field-control"
            placeholder="e.g. Miller Electric Services"
          />
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="email">
          Work Email <span className="text-blue-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="field-control"
          placeholder="foreman@company.com"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Password <span className="text-blue-600">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={8}
            maxLength={128}
            className="field-control pr-11 font-mono"
            placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700 transition"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {!isSignup && (
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">
          <AlertCircle size={15} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
        {pending ? 'Processing…' : isSignup ? 'Create Company Workspace' : 'Log In to AmpTrail'}
      </Button>

      <p className="pt-2 text-center text-xs text-slate-500">
        {isSignup ? 'Already have a workspace?' : 'Need to document your jobs?'}{' '}
        <Link
          href={isSignup ? '/login' : '/signup'}
          className="font-bold text-blue-600 hover:underline"
        >
          {isSignup ? 'Log in' : 'Create an account'}
        </Link>
      </p>

      {isSignup && (
        <p className="text-center text-[11px] leading-relaxed text-slate-400 pt-1">
          By registering, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-slate-600">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-slate-600">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
