'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, KeyRound, Mail, RotateCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  describeAuthError,
  passwordResetRedirectUrl,
  resetRequestAcceptedNotice,
} from '@/lib/auth/recovery';
import { SUPPORT_EMAIL, supportMailto } from '@/lib/support';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const COOLDOWN_SECONDS = 60;

/**
 * Password recovery from the signed-in Settings screen.
 *
 * The email is read from the authenticated Supabase session — the user never
 * has to re-type it. Clicking sends the recovery email immediately through the
 * existing secure Supabase Auth workflow (PKCE link through /auth/callback into
 * the new-password form). The button disables while the request is in flight
 * and for a short cooldown afterwards so double-clicks cannot trigger rate
 * limits, and every outcome (accepted, rate limited, offline) is reported
 * honestly — the app never claims an email was delivered, only that the
 * request was accepted.
 */
export function SendResetLinkButton() {
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
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
  }

  async function sendResetLink() {
    if (status === 'pending' || cooldown > 0) return;
    setStatus('pending');
    setMessage('');

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      const email = user?.email?.trim();
      if (userError || !email) {
        setStatus('error');
        setMessage(
          'We could not read your signed-in account. Sign out, sign back in, then try again.'
        );
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetRedirectUrl(window.location.origin),
      });
      if (error) throw error;

      setStatus('sent');
      setMessage(resetRequestAcceptedNotice(email));
      startCooldown();
    } catch (error) {
      setStatus('error');
      setMessage(describeAuthError(error instanceof Error ? error.message : 'Request failed.'));
    }
  }

  const busy = status === 'pending';

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        onClick={sendResetLink}
        loading={busy}
        disabled={busy || cooldown > 0}
        variant={status === 'sent' ? 'secondary' : 'soft'}
        size="sm"
        className={cn(status === 'sent' && 'border border-success-line bg-success-soft text-success hover:bg-success-soft hover:text-success')}
      >
        {!busy && status === 'sent' ? (
          <Check size={14} aria-hidden="true" />
        ) : !busy ? (
          <KeyRound size={14} aria-hidden="true" />
        ) : undefined}
        {busy
          ? 'Sending reset link…'
          : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : status === 'sent'
              ? 'Resend reset link'
              : 'Send a reset link'}
      </Button>

      {status === 'sent' && message && (
        <Alert tone="success" role="status" title="Reset request accepted">
          <p>{message}</p>
          <p className="mt-1.5 text-[12px] text-muted">
            The link opens the new-password form automatically. It works once and expires quickly —
            request another if it lapses.
          </p>
        </Alert>
      )}

      {status === 'error' && message && (
        <Alert tone="danger" role="alert" title="Reset email not requested">
          <p>{message}</p>
          <p className="mt-1.5 text-[12px]">
            If this keeps happening, email{' '}
            <a href={supportMailto({ subject: 'Password reset help' })} className="link">
              {SUPPORT_EMAIL}
            </a>{' '}
            or{' '}
            <button
              type="button"
              onClick={sendResetLink}
              className="link underline-offset-2 hover:underline"
            >
              <RotateCw size={11} className="mr-0.5 inline-block" aria-hidden="true" />
              try again
            </button>
            .
          </p>
        </Alert>
      )}

      {status === 'idle' && (
        <p className="flex items-start gap-1.5 text-[12px] leading-5 text-muted">
          <Mail size={12} className="mt-0.5 shrink-0 text-subtle" aria-hidden="true" />
          We will email a secure link to your signed-in address — no need to type it again.
        </p>
      )}
    </div>
  );
}
