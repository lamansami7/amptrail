'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'That email and password did not match. Try again or reset your password.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email address before signing in.';
  if (/user already registered/i.test(message)) return 'An account already exists for this email. Try signing in instead.';
  if (/password/i.test(message) && /short|weak/i.test(message)) return 'Choose a longer password with at least 8 characters.';
  if (/rate limit|too many requests/i.test(message)) return 'Too many attempts. Wait a moment before trying again.';
  return 'We could not complete that request. Check your connection and try again.';
}

function safeNextPath(path?: string) {
  return path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/dashboard';
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
      setError('Enter a valid work email address.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('Use a password between 8 and 128 characters.');
      return;
    }
    if (isSignup && !companyName) {
      setError('Enter your company name to create a workspace.');
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
        if (!data.user) throw new Error('The account could not be created. Please try again.');
        if (data.session) {
          router.replace('/dashboard');
          router.refresh();
        } else {
          setSuccess('Account started. Check your inbox for a confirmation link to finish setting up your AmpTrail workspace.');
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(safeNextPath(nextPath));
        router.refresh();
      }
    } catch (submissionError) {
      setError(friendlyError(submissionError instanceof Error ? submissionError.message : 'We could not complete that request. Please try again.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {isSignup && <div><label className="field-label" htmlFor="full_name">Your name <span className="font-normal text-muted">(optional)</span></label><input id="full_name" name="full_name" autoComplete="name" maxLength={120} className="field-control" placeholder="Alex Morgan" /></div>}
      {isSignup && <div><label className="field-label" htmlFor="company_name">Company name</label><input id="company_name" name="company_name" autoComplete="organization" required maxLength={160} className="field-control" placeholder="Morgan Electrical" /></div>}
      <div><label className="field-label" htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="field-control" placeholder="you@company.com" /></div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} className="field-control pr-12" placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {!isSignup && <div className="mt-2 text-right"><Link href="/forgot-password" className="text-xs font-semibold text-orange-dark hover:underline">Forgot password?</Link></div>}
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}
      {success && <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm leading-5 text-green-900" role="status">{success}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
        {pending ? 'Please wait…' : isSignup ? 'Create your account' : 'Log in'}
      </Button>
      <p className="pt-2 text-center text-sm text-muted">
        {isSignup ? 'Already have an account?' : 'New to AmpTrail?'}{' '}
        <Link href={isSignup ? '/login' : '/signup'} className="font-bold text-orange-dark hover:underline">{isSignup ? 'Log in' : 'Create an account'}</Link>
      </p>
      {isSignup && <p className="text-center text-xs leading-5 text-muted">By creating an account, you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>}
    </form>
  );
}
