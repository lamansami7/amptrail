// Pure authentication rules shared by the signup, login, verification, and callback code.
// Keep this file free of browser, Next.js, and Supabase imports so it can be unit tested.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254;
export const COMPANY_NAME_MAX_LENGTH = 160;
export const FULL_NAME_MAX_LENGTH = 120;
export const RESEND_COOLDOWN_SECONDS = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value);
}

export type SignupFields = { email: string; password: string; companyName: string; fullName: string };
export type SignupFieldErrors = Partial<Record<'email' | 'password' | 'companyName' | 'fullName', string>>;

// Returns field-level messages. An empty object means the input may be submitted.
export function validateSignup(fields: SignupFields): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const email = fields.email.trim();
  if (!email) errors.email = 'Enter your work email address.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address, such as you@company.com.';

  if (!fields.password) errors.password = 'Enter a password.';
  else if (fields.password.length < PASSWORD_MIN_LENGTH) errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
  else if (fields.password.length > PASSWORD_MAX_LENGTH) errors.password = `Use ${PASSWORD_MAX_LENGTH} characters or fewer for your password.`;

  const companyName = fields.companyName.trim();
  if (!companyName) errors.companyName = 'Enter your company name to create your workspace.';
  else if (companyName.length > COMPANY_NAME_MAX_LENGTH) errors.companyName = `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.`;

  if (fields.fullName.trim().length > FULL_NAME_MAX_LENGTH) errors.fullName = `Name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`;
  return errors;
}

export function validateLogin(fields: { email: string; password: string }): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const email = fields.email.trim();
  if (!email) errors.email = 'Enter your email address.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address, such as you@company.com.';
  if (!fields.password) errors.password = 'Enter your password.';
  return errors;
}

function containsControlOrBackslash(value: string) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 0x20 || code === 0x7f || character === '\\') return true;
  }
  return false;
}

// Only same-origin relative paths are allowed. Anything else falls back to the dashboard.
// Rejects protocol-relative paths, backslashes, and control characters (browsers strip tabs and
// newlines when parsing URLs, so "/\t/evil.example" would otherwise become "//evil.example").
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (containsControlOrBackslash(value)) return fallback;
  return value;
}

export function normalizeEmailParam(value: string | null | undefined) {
  const email = (value ?? '').trim().slice(0, EMAIL_MAX_LENGTH);
  return isValidEmail(email) ? email : '';
}

// Maps Supabase Auth messages to user-facing text. Never returns raw provider text or secrets.
export function friendlyAuthError(message: string | null | undefined): string {
  const text = message ?? '';
  if (/invalid login credentials/i.test(text)) return 'That email and password did not match. Check them and try again, or reset your password.';
  if (/email not confirmed/i.test(text)) return 'Confirm your email address before signing in. Check your inbox for the verification link.';
  if (/user already registered|already been registered/i.test(text)) return 'An account already exists for this email. Log in instead, or reset your password.';
  if (/password/i.test(text) && /short|weak|least/i.test(text)) return `Choose a stronger password with at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (/rate limit|too many requests|over_email_send_rate_limit|security purposes|seconds/i.test(text)) return 'Too many attempts. Wait a minute before trying again.';
  if (/failed to fetch|network|networkerror|load failed/i.test(text)) return 'Network problem. Check your connection and try again.';
  if (/signup.*disabled|signups? not allowed/i.test(text)) return 'New sign-ups are not open for this AmpTrail deployment. Contact your administrator.';
  return 'We could not complete that request. Please try again.';
}

export function isUnconfirmedEmailError(message: string | null | undefined) {
  return /email not confirmed/i.test(message ?? '');
}

export function isNetworkError(error: unknown) {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : '';
  return /failed to fetch|networkerror|load failed/i.test(message);
}

// Remaining seconds before another resend is allowed. Pure so the cooldown can be tested.
export function resendCooldownRemaining(lastSentAt: number | null, now: number, cooldownSeconds = RESEND_COOLDOWN_SECONDS) {
  if (lastSentAt === null) return 0;
  const elapsedSeconds = Math.floor((now - lastSentAt) / 1000);
  return Math.max(0, cooldownSeconds - elapsedSeconds);
}
