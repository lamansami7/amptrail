import { describe, expect, it } from 'vitest';
import {
  friendlyAuthError,
  isUnconfirmedEmailError,
  normalizeEmailParam,
  resendCooldownRemaining,
  safeNextPath,
  validateLogin,
  validateSignup,
} from '@/lib/auth/rules';

const validSignup = { email: 'alex@company.com', password: 'correct-horse', companyName: 'Morgan Electrical', fullName: 'Alex' };

describe('signup validation', () => {
  it('accepts a complete, valid signup', () => {
    expect(validateSignup(validSignup)).toEqual({});
  });

  it('reports each missing or invalid required field', () => {
    const errors = validateSignup({ email: '', password: '', companyName: '   ', fullName: '' });
    expect(errors.email).toMatch(/work email/i);
    expect(errors.password).toMatch(/enter a password/i);
    expect(errors.companyName).toMatch(/company name/i);
  });

  it('rejects malformed email addresses and short or long passwords', () => {
    expect(validateSignup({ ...validSignup, email: 'not-an-email' }).email).toMatch(/valid email/i);
    expect(validateSignup({ ...validSignup, password: 'short' }).password).toMatch(/at least 8/i);
    expect(validateSignup({ ...validSignup, password: 'x'.repeat(129) }).password).toMatch(/128/);
  });

  it('enforces the company name and name length limits', () => {
    expect(validateSignup({ ...validSignup, companyName: 'c'.repeat(161) }).companyName).toMatch(/160/);
    expect(validateSignup({ ...validSignup, fullName: 'n'.repeat(121) }).fullName).toMatch(/120/);
  });
});

describe('login validation', () => {
  it('requires an email and password without enforcing signup rules', () => {
    expect(validateLogin({ email: 'alex@company.com', password: 'x' })).toEqual({});
    expect(validateLogin({ email: '', password: '' })).toMatchObject({ email: expect.any(String), password: expect.any(String) });
  });
});

describe('safeNextPath (open-redirect protection)', () => {
  it('allows same-origin relative paths', () => {
    expect(safeNextPath('/dashboard')).toBe('/dashboard');
    expect(safeNextPath('/projects/123?tab=open')).toBe('/projects/123?tab=open');
    expect(safeNextPath('/reset-password')).toBe('/reset-password');
  });

  it('falls back to /dashboard for absolute, protocol-relative, and malformed targets', () => {
    for (const bad of ['https://evil.example', '//evil.example', '/\\evil.example', '/\t/evil.example', '/\n/evil.example', 'javascript:alert(1)', '', null, undefined]) {
      expect(safeNextPath(bad as string | null | undefined)).toBe('/dashboard');
    }
  });
});

describe('friendlyAuthError', () => {
  it('maps common Supabase messages to actionable text', () => {
    expect(friendlyAuthError('Invalid login credentials')).toMatch(/did not match/i);
    expect(friendlyAuthError('Email not confirmed')).toMatch(/confirm your email/i);
    expect(friendlyAuthError('User already registered')).toMatch(/already exists/i);
    expect(friendlyAuthError('email rate limit exceeded')).toMatch(/too many attempts/i);
    expect(friendlyAuthError('Failed to fetch')).toMatch(/network/i);
  });

  it('never echoes unknown provider text back to the user', () => {
    expect(friendlyAuthError('secret internal stack detail')).toBe('We could not complete that request. Please try again.');
  });

  it('identifies unconfirmed-email errors', () => {
    expect(isUnconfirmedEmailError('Email not confirmed')).toBe(true);
    expect(isUnconfirmedEmailError('Invalid login credentials')).toBe(false);
  });
});

describe('resend cooldown', () => {
  it('blocks resends until the cooldown has passed', () => {
    const sent = 1_000_000;
    expect(resendCooldownRemaining(null, sent)).toBe(0);
    expect(resendCooldownRemaining(sent, sent + 10_000)).toBe(50);
    expect(resendCooldownRemaining(sent, sent + 60_000)).toBe(0);
    expect(resendCooldownRemaining(sent, sent + 600_000)).toBe(0);
  });
});

describe('normalizeEmailParam', () => {
  it('keeps only valid email addresses from URL parameters', () => {
    expect(normalizeEmailParam(' alex@company.com ')).toBe('alex@company.com');
    expect(normalizeEmailParam('<script>@x')).toBe('');
    expect(normalizeEmailParam(undefined)).toBe('');
  });
});
