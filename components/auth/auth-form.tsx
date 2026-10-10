'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  friendlyAuthError,
  isNetworkError,
  isUnconfirmedEmailError,
  normalizeEmailParam,
  safeNextPath,
  validateLogin,
  validateSignup,
  type SignupFieldErrors,
} from '@/lib/auth/rules';

type FieldErrors = SignupFieldErrors;

export function AuthForm({ mode, nextPath }: { mode: 'login' | 'signup'; nextPath?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // A ref blocks a second submit before React re-renders with the disabled button.
  const submittingRef = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const isSignup = mode === 'signup';

  function clearPasswordField() {
    const passwordInput = formRef.current?.elements.namedItem('password');
    if (passwordInput instanceof HTMLInputElement) passwordInput.value = '';
    setShowPassword(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const companyName = String(form.get('company_name') || '').trim();
    const fullName = String(form.get('full_name') || '').trim();

    setError('');
    setUnconfirmedEmail('');
    const validation = isSignup
      ? validateSignup({ email, password, companyName, fullName })
      : validateLogin({ email, password });
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) return;

    submittingRef.current = true;
    setPending(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            data: { full_name: fullName, company_name: companyName },
          },
        });
        // The password is no longer needed once the request has been sent.
        clearPasswordField();
        if (authError) throw authError;
        if (!data.user) throw new Error('The account could not be created. Please try again.');

        if (data.session) {
          // Email confirmation is disabled for this project, so the account is already signed in.
          router.replace('/dashboard');
          router.refresh();
          return;
        }
        // Supabase returns a user with no identities when the email is already registered and
        // enumeration protection is on. Do not claim an email was sent in that case.
        if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error('An account already exists for this email. Log in instead, or reset your password.');
        }
        // Confirmation is required. Show the verification screen; do not enter protected pages.
        router.push(`/verify-email?email=${encodeURIComponent(normalizeEmailParam(email))}`);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      clearPasswordField();
      if (authError) throw authError;
      router.replace(safeNextPath(nextPath));
      router.refresh();
    } catch (submissionError) {
      clearPasswordField();
      const message = submissionError instanceof Error ? submissionError.message : '';
      if (isUnconfirmedEmailError(message)) setUnconfirmedEmail(normalizeEmailParam(email));
      setError(isNetworkError(submissionError) ? friendlyAuthError('network') : friendlyAuthError(message));
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  const passwordError = fieldErrors.password;
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate aria-busy={pending}>
      {isSignup && (
        <div>
          <label className="field-label" htmlFor="full_name">Your name <span className="font-normal text-muted">(optional)</span></label>
          <input id="full_name" name="full_name" autoComplete="name" maxLength={120} className="field-control" placeholder="Alex Morgan" aria-invalid={Boolean(fieldErrors.fullName)} />
          {fieldErrors.fullName && <p className="field-error">{fieldErrors.fullName}</p>}
        </div>
      )}
      {isSignup && (
        <div>
          <label className="field-label" htmlFor="company_name">Company name</label>
          <input id="company_name" name="company_name" autoComplete="organization" maxLength={160} className="field-control" placeholder="Morgan Electrical" aria-invalid={Boolean(fieldErrors.companyName)} aria-describedby={fieldErrors.companyName ? 'company_name_error' : undefined} />
          {fieldErrors.companyName && <p id="company_name_error" className="field-error">{fieldErrors.companyName}</p>}
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={254} className="field-control" placeholder="you@company.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email_error' : undefined} />
        {fieldErrors.email && <p id="email_error" className="field-error">{fieldErrors.email}</p>}
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <div className="relative">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} maxLength={128} className="field-control pr-12" placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'password_error' : undefined} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {passwordError && <p id="password_error" className="field-error">{passwordError}</p>}
        {!isSignup && <div className="mt-2 text-right"><Link href="/forgot-password" className="text-xs font-semibold text-orange-dark hover:underline">Forgot password?</Link></div>}
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}
      {unconfirmedEmail && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-900" role="status">
        Need a new link? <Link className="font-bold underline" href={`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`}>Resend the verification email</Link>.
      </p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
        {pending ? (isSignup ? 'Creating your account…' : 'Logging in…') : isSignup ? 'Create your account' : 'Log in'}
      </Button>
      <p className="pt-2 text-center text-sm text-muted">
        {isSignup ? 'Already have an account?' : 'New to AmpTrail?'}{' '}
        <Link href={isSignup ? '/login' : '/signup'} className="font-bold text-orange-dark hover:underline">{isSignup ? 'Log in' : 'Create an account'}</Link>
      </p>
      {isSignup && <p className="text-center text-xs leading-5 text-muted">By creating an account, you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.</p>}
    </form>
  );
}
