import { describe, expect, it } from 'vitest';
import {
  authCallbackUrl,
  classifyAuthError,
  describeAuthError,
  parseRateLimitDelaySeconds,
  passwordResetRedirectUrl,
  resetRequestAcceptedNotice,
} from '@/lib/auth/recovery';
import { SUPPORT_EMAIL, supportMailto, supportMailtoForRecord } from '@/lib/support';

describe('password recovery redirects', () => {
  it('routes recovery links through the PKCE callback into the new-password form', () => {
    expect(passwordResetRedirectUrl('https://getamptrail.vercel.app')).toBe(
      'https://getamptrail.vercel.app/auth/callback?next=%2Freset-password'
    );
  });

  it('encodes arbitrary next paths and keeps them relative', () => {
    expect(authCallbackUrl('http://localhost:3000', '/dashboard')).toBe(
      'http://localhost:3000/auth/callback?next=%2Fdashboard'
    );
  });
});

describe('rate limit parsing', () => {
  it('extracts a seconds hint from Supabase rate-limit messages', () => {
    expect(parseRateLimitDelaySeconds('For security purposes, you can only request this after 42 seconds.')).toBe(42);
    expect(parseRateLimitDelaySeconds('Too many requests, retry after 5 seconds')).toBe(5);
  });

  it('converts minute hints to seconds', () => {
    expect(parseRateLimitDelaySeconds('Try again after 2 minutes')).toBe(120);
  });

  it('returns null when no hint exists', () => {
    expect(parseRateLimitDelaySeconds('Something else happened')).toBeNull();
  });
});

describe('classifyAuthError', () => {
  it('recognises rate limiting, network, expired links and the rest', () => {
    expect(classifyAuthError('For security purposes, you can only request this after 30 seconds.')).toBe('rate_limited');
    expect(classifyAuthError('TypeError: Failed to fetch')).toBe('network');
    expect(classifyAuthError('Email link is invalid or has expired')).toBe('expired_link');
    expect(classifyAuthError('New password should be different from the old password.')).toBe('same_password');
    expect(classifyAuthError('Password should be at least 8 characters')).toBe('weak_password');
    expect(classifyAuthError('Invalid login credentials')).toBe('invalid_credentials');
    expect(classifyAuthError('Email not confirmed')).toBe('unconfirmed');
    expect(classifyAuthError('User already registered')).toBe('already_registered');
    expect(classifyAuthError('Auth session missing!')).toBe('session_missing');
    expect(classifyAuthError('Something unexpected')).toBe('unknown');
  });
});

describe('describeAuthError copy', () => {
  it('tells the user what to do next for every classified failure', () => {
    expect(describeAuthError('after 45 seconds')).toMatch(/Wait about 45 seconds/);
    expect(describeAuthError('after 3 minutes')).toMatch(/Wait about 3 minutes/);
    expect(describeAuthError('Failed to fetch')).toMatch(/connection/i);
    expect(describeAuthError('link is invalid or has expired')).toMatch(/fresh one/i);
    expect(describeAuthError('same password')).toMatch(/not used/i);
  });

  it('never claims an email was delivered in the accepted notice', () => {
    const notice = resetRequestAcceptedNotice('foreman@company.com');
    expect(notice).toContain('foreman@company.com');
    expect(notice).toContain('accepted');
    expect(notice).not.toMatch(/delivered/i);
    expect(notice).toMatch(/cannot|if email delivery|on its way/i);
  });
});

describe('support contact', () => {
  it('publishes the official AmpTrail support address by default', () => {
    expect(SUPPORT_EMAIL).toBe('amptrail.support@gmail.com');
  });

  it('builds mailto links with subject and body', () => {
    expect(supportMailto()).toBe('mailto:amptrail.support@gmail.com');
    expect(supportMailto({ subject: 'Help' })).toBe(
      'mailto:amptrail.support@gmail.com?subject=Help'
    );
    const recordLink = supportMailtoForRecord('ticket', 'AT-26-0142');
    expect(recordLink.startsWith('mailto:amptrail.support@gmail.com?')).toBe(true);
    expect(recordLink).toContain('subject=');
    expect(recordLink).toContain('body=');
    expect(decodeURIComponent(recordLink)).toContain('AT-26-0142');
  });
});
