import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { safeNextPath } from '@/lib/auth/rules';

// Handles the PKCE links from signup confirmation and password reset.
// Only the one-time `code` is trusted. Any other input, including a missing or expired code,
// goes to the login page with a generic message and never creates a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL('/login?error=supabase_not_configured', origin));

  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));
  const failed = () => NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));

  if (!code || code.length > 2048 || searchParams.has('error') || searchParams.has('error_code')) return failed();

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn('Auth callback code exchange failed:', error.code ?? error.name);
    return failed();
  }

  // Idempotent: returns the existing workspace, or creates one from the company name captured at signup
  // when the account trigger did not run. The database routine acts only on the signed-in user.
  const { error: provisioningError } = await supabase.rpc('ensure_user_workspace');
  if (provisioningError) {
    // Do not block sign-in. The workspace pages show the precise state (setup form or error page).
    console.error('Workspace provisioning check failed after confirmation:', provisioningError.code);
  }

  return NextResponse.redirect(new URL(next, origin));
}
