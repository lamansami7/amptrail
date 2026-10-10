'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { friendlyAuthError, isValidEmail, RESEND_COOLDOWN_SECONDS, resendCooldownRemaining } from '@/lib/auth/rules';

const COOLDOWN_KEY_PREFIX = 'amptrail:verification-resent:';

function emailRedirectUrl() {
  return `${window.location.origin}/auth/callback?next=/dashboard`;
}

export function VerifyEmailPanel({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [draftEmail, setDraftEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const pendingRef = useRef(false);

  const cooldown = resendCooldownRemaining(lastSentAt, now);

  // Restore the cooldown after a refresh so a reload does not allow an immediate resend.
  useEffect(() => {
    if (!email) return;
    const stored = window.sessionStorage.getItem(COOLDOWN_KEY_PREFIX + email.toLowerCase());
    const parsed = stored ? Number(stored) : NaN;
    setLastSentAt(Number.isFinite(parsed) ? parsed : null);
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || cooldown > 0) return;
    const target = draftEmail.trim();
    if (!isValidEmail(target)) {
      setError('Enter the email address you signed up with.');
      return;
    }
    pendingRef.current = true;
    setPending(true);
    setError('');
    setSentTo(null);
    try {
      const { error: resendError } = await createClient().auth.resend({
        type: 'signup',
        email: target,
        options: { emailRedirectTo: emailRedirectUrl() },
      });
      if (resendError) {
        setError(friendlyAuthError(resendError.message));
        return;
      }
      // Only claim success when Supabase returned no error.
      const stamp = Date.now();
      window.sessionStorage.setItem(COOLDOWN_KEY_PREFIX + target.toLowerCase(), String(stamp));
      setEmail(target);
      setLastSentAt(stamp);
      setNow(stamp);
      setSentTo(target);
    } catch (resendException) {
      setError(friendlyAuthError(resendException instanceof Error ? resendException.message : ''));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <div className="space-y-5">
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange/10 text-orange"><MailCheck size={20} aria-hidden="true" /></span>
      <div className="min-w-0">
        {email ? <>
          <p className="text-sm font-semibold text-ink">We sent a verification link to <span className="break-all">{email}</span>.</p>
          <p className="mt-2 text-sm leading-6 text-muted">Open the link in <strong>this browser</strong> to finish setting up your AmpTrail workspace. Links from another browser or device may not be accepted. Check your spam folder if it does not arrive within a few minutes.</p>
        </> : <p className="text-sm leading-6 text-muted">Enter the email address you signed up with, and we will send a new verification link.</p>}
      </div>
    </div>

    {sentTo && <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-900" role="status">A new verification email was sent to {sentTo}.</p>}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800" role="alert">{error}</p>}

    <form onSubmit={resend} className="space-y-3" noValidate>
      {!email && <div>
        <label className="field-label" htmlFor="verify_email">Work email</label>
        <input id="verify_email" name="email" type="email" required maxLength={254} autoComplete="email" className="field-control" placeholder="you@company.com" value={draftEmail} onChange={(event) => setDraftEmail(event.target.value)} />
      </div>}
      <Button type="submit" variant="secondary" disabled={pending || cooldown > 0} className="w-full">
        {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
        {pending ? 'Sending…' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
      </Button>
      <p className="text-center text-xs leading-5 text-muted">You can request a new email once every {RESEND_COOLDOWN_SECONDS} seconds.</p>
    </form>
  </div>;
}
