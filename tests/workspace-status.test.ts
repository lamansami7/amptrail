import { describe, expect, it } from 'vitest';
import { classifyDatabaseError, isSignedOutAuthError, parseWorkspaceErrorReason, workspaceErrorMessage } from '@/lib/data/workspace-status';

describe('classifyDatabaseError', () => {
  it('treats a missing table or function as a setup problem, not a missing workspace', () => {
    expect(classifyDatabaseError({ code: '42P01', message: 'relation "company_memberships" does not exist' })).toBe('schema_missing');
    expect(classifyDatabaseError({ code: 'PGRST205' })).toBe('schema_missing');
    expect(classifyDatabaseError({ code: '42883' })).toBe('schema_missing');
  });

  it('treats permission and RLS refusals as permission problems', () => {
    expect(classifyDatabaseError({ code: '42501' })).toBe('permission_denied');
    expect(classifyDatabaseError({ code: 'PGRST301' })).toBe('permission_denied');
    expect(classifyDatabaseError({ status: 403 })).toBe('permission_denied');
  });

  it('treats anything else, including network failures, as a temporary error', () => {
    expect(classifyDatabaseError({ message: 'fetch failed' })).toBe('unavailable');
    expect(classifyDatabaseError({ code: '57014' })).toBe('unavailable');
    expect(classifyDatabaseError(null)).toBe('unavailable');
  });
});

describe('isSignedOutAuthError', () => {
  it('recognises a genuinely signed-out visitor', () => {
    expect(isSignedOutAuthError({ name: 'AuthSessionMissingError' })).toBe(true);
    expect(isSignedOutAuthError({ status: 401 })).toBe(true);
    expect(isSignedOutAuthError(null)).toBe(true);
  });

  it('does not treat a temporary auth outage as signed out', () => {
    expect(isSignedOutAuthError({ status: 503, name: 'AuthRetryableFetchError' })).toBe(false);
  });
});

describe('workspace error copy', () => {
  it('never describes a database failure as a missing workspace', () => {
    for (const reason of ['schema_missing', 'permission_denied', 'unavailable'] as const) {
      const copy = workspaceErrorMessage(reason);
      expect(copy.title.toLowerCase()).not.toContain('not ready');
      expect(copy.title.toLowerCase()).not.toContain('could not find the company');
    }
  });

  it('parses only known reasons from the URL', () => {
    expect(parseWorkspaceErrorReason('schema_missing')).toBe('schema_missing');
    expect(parseWorkspaceErrorReason('<script>')).toBe('unavailable');
    expect(parseWorkspaceErrorReason(undefined)).toBe('unavailable');
  });
});
