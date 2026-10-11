import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard';
  return value;
}

/**
 * Maps Supabase Auth redirect failures onto honest, page-specific error
 * states. Expired recovery links return to the new-password page (which can
 * offer a fresh request); everything else returns to sign-in with a reason.
 */
function failureRedirect(origin: string, next: string, description: string | null) {
  const text = (description || '').toLowerCase();
  const goingToReset = next === '/reset-password';
  const expired = /expired|otp_expired|invalid or has been used|one-time/.test(text);

  if (goingToReset) {
    return NextResponse.redirect(
      new URL(expired ? '/reset-password?error=otp_expired' : '/reset-password?error=link_invalid', origin)
    );
  }
  if (expired) {
    return NextResponse.redirect(new URL('/login?error=link_expired', origin));
  }
  if (/access denied|access_denied/.test(text)) {
    return NextResponse.redirect(new URL('/login?error=link_denied', origin));
  }
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL('/login?error=supabase_not_configured', origin));

  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  // Supabase redirects here with error params when a link is expired or invalid
  // (no code to exchange). Send the user to a screen that can actually help.
  const linkError = searchParams.get('error');
  if (linkError && !code) {
    return failureRedirect(origin, next, searchParams.get('error_description') || linkError);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    return failureRedirect(origin, next, error.message);
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
}
