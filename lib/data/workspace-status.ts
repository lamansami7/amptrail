// Pure classification of database and auth failures for the workspace lookup.
// Kept free of Next.js and Supabase imports so it can be unit tested.

export type WorkspaceErrorReason = 'schema_missing' | 'permission_denied' | 'unavailable';

export type DatabaseErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
} | null | undefined;

// PostgreSQL / PostgREST codes:
//   42P01  undefined_table           -> migration not applied
//   42883  undefined_function        -> RPC not installed
//   PGRST205 / PGRST202              -> PostgREST schema cache has no such table / function
//   42501  insufficient_privilege    -> RLS or grant refused the request
//   PGRST301 / 401 / 403             -> JWT rejected or access refused
export function classifyDatabaseError(error: DatabaseErrorLike): WorkspaceErrorReason {
  if (!error) return 'unavailable';
  const code = error.code ?? '';
  if (['42P01', '42883', 'PGRST205', 'PGRST202'].includes(code)) return 'schema_missing';
  if (['42501', 'PGRST301', 'PGRST302'].includes(code) || error.status === 401 || error.status === 403) return 'permission_denied';
  return 'unavailable';
}

// Supabase Auth reports "no session" as an error with status 400/401 and a session-missing name.
// Anything else (network failure, 5xx) is a temporary problem, not a signed-out visitor.
export function isSignedOutAuthError(error: { name?: string | null; status?: number | null } | null | undefined) {
  if (!error) return true;
  if (error.name === 'AuthSessionMissingError') return true;
  return error.status === 401 || error.status === 403;
}

export function workspaceErrorMessage(reason: WorkspaceErrorReason) {
  switch (reason) {
    case 'schema_missing':
      return {
        title: 'AmpTrail database setup is incomplete',
        body: 'The database is missing part of the AmpTrail setup, so workspaces cannot be loaded yet. Your account is fine. Ask the Supabase project administrator to apply the AmpTrail migrations, then try again.',
      };
    case 'permission_denied':
      return {
        title: 'We could not verify your workspace access',
        body: 'Your session could not be used to load your workspace. Sign out and sign back in. If this continues, contact the deployment owner.',
      };
    default:
      return {
        title: 'We could not load your workspace right now',
        body: 'This is a temporary problem, not a missing workspace. Your account and data are unchanged. Try again in a moment.',
      };
  }
}

export function parseWorkspaceErrorReason(value: string | null | undefined): WorkspaceErrorReason {
  if (value === 'schema_missing' || value === 'permission_denied') return value;
  return 'unavailable';
}
