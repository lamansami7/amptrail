/**
 * Shared helpers for the Supabase password-recovery flow. Kept free of
 * framework imports so both client components and route handlers can use the
 * same error copy and redirect rules.
 */

/** Redirect target Supabase should send recovery (and confirmation) links to. */
export function authCallbackUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Where a password-reset email should land: the new-password form. */
export function passwordResetRedirectUrl(origin: string) {
  return authCallbackUrl(origin, '/reset-password');
}

/**
 * Extracts "wait N seconds" style rate-limit hints from Supabase Auth error
 * messages so the UI can tell the user exactly how long to wait.
 */
export function parseRateLimitDelaySeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds?/i);
  if (match) return Math.max(1, Number(match[1]));
  const minutes = message.match(/after\s+(\d+)\s+minutes?/i);
  if (minutes) return Math.max(1, Number(minutes[1]) * 60);
  return null;
}

export type AuthErrorKind =
  | 'rate_limited'
  | 'network'
  | 'expired_link'
  | 'same_password'
  | 'weak_password'
  | 'invalid_credentials'
  | 'unconfirmed'
  | 'already_registered'
  | 'session_missing'
  | 'unknown';

export function classifyAuthError(message: string): AuthErrorKind {
  if (/rate limit|too many requests|after\s+\d+\s+(?:seconds?|minutes?)/i.test(message))
    return 'rate_limited';
  if (/failed to fetch|networkerror|network request failed|fetch failed|load failed/i.test(message))
    return 'network';
  if (/expired|invalid or has expired|otp_expired|one-time/i.test(message)) return 'expired_link';
  if (/different from|same password|previously used/i.test(message)) return 'same_password';
  if (/password.*(short|weak|characters|strength)/i.test(message)) return 'weak_password';
  if (/invalid login credentials/i.test(message)) return 'invalid_credentials';
  if (/email not confirmed/i.test(message)) return 'unconfirmed';
  if (/already registered|already exists/i.test(message)) return 'already_registered';
  if (/auth session|session missing|not authenticated/i.test(message)) return 'session_missing';
  return 'unknown';
}

/**
 * Turns a Supabase Auth error into honest, actionable copy. Every branch tells
 * the user what happened and what to do next — and never claims an email was
 * delivered, only that a request was accepted.
 */
export function describeAuthError(message: string): string {
  const kind = classifyAuthError(message);
  switch (kind) {
    case 'rate_limited': {
      const seconds = parseRateLimitDelaySeconds(message);
      return seconds
        ? `Too many requests in a short time. Wait about ${seconds < 90 ? `${seconds} seconds` : `${Math.ceil(seconds / 60)} minutes`}, then try again.`
        : 'Too many requests in a short time. Wait a minute, then try again.';
    }
    case 'network':
      return 'We could not reach the authentication service. Check your connection and try again.';
    case 'expired_link':
      return 'That link has expired or was already used. Request a fresh one and open it right away.';
    case 'same_password':
      return 'Choose a password you have not used for this account before.';
    case 'weak_password':
      return 'Choose a password with at least 8 characters. Longer is better.';
    case 'invalid_credentials':
      return 'That email and password combination did not match. Check for typos or reset your password.';
    case 'unconfirmed':
      return 'This account still needs email confirmation. Open the link we emailed you, then sign in again.';
    case 'already_registered':
      return 'An account already exists for this email. Try logging in instead.';
    case 'session_missing':
      return 'Your session has expired. Request a new secure link, then try again.';
    default:
      return 'We could not complete that request. Check your connection and try again.';
  }
}

/**
 * Copy for a successful reset request. Deliberately says the request was
 * accepted — delivery of the email itself cannot be verified from the app.
 */
export function resetRequestAcceptedNotice(email: string) {
  return `Reset request accepted for ${email}. If email delivery is configured for this deployment, a message is on its way — check your inbox and spam folder within a few minutes. The link works once and expires quickly.`;
}
