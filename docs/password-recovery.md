# Password recovery — how it works and what you must configure

This document describes AmpTrail's complete password-recovery flow, the fixes
applied to it, and the external configuration required for reliable email
delivery in production.

## The complete flow

1. **Request.** A reset email can be requested from two places:
   - **Settings → Account → Send a reset link** (signed in). The email address
     is read from the authenticated Supabase session — the user never re-types
     it. The button shows a loading state, disables while the request is in
     flight, and enforces a 60-second cooldown afterwards so repeated clicks
     cannot trigger provider rate limits.
   - **`/forgot-password`** (signed out). The user enters their account email.
2. **Email.** Supabase Auth sends a one-time recovery link via the configured
   SMTP provider. The link's redirect target is
   `{SITE_URL}/auth/callback?next=/reset-password`.
3. **Callback.** `/auth/callback` exchanges the PKCE `code` for a session and
   forwards the user to `/reset-password`. If Supabase redirects back with
   `error`/`error_description` instead (expired or already-used link), the
   callback routes the user to `/reset-password?error=otp_expired` (recovery
   context) or `/login?error=…` with a clear explanation — never a dead end.
4. **New password.** `/reset-password` verifies that a session exists. If the
   link expired or was opened without its code, the page explains exactly that
   and offers a one-click way to request a fresh link (plus the support email).
   With a valid session the user sets a new password and is signed in.

The app never claims an email was delivered. Successful requests are reported
as *accepted* with honest guidance to check inbox and spam folders.

## Errors handled in the UI

| Situation | What the user sees |
| --- | --- |
| Provider rate limit (429 / "after N seconds") | The exact wait time, then retry |
| Network failure / offline | "Could not reach the authentication service" + retry |
| Expired or reused recovery link | Explanation + "Send a new reset link" action |
| New password equal to the old one | "Choose a password you have not used before" |
| Session lost mid-flow | Re-request guidance, no silent failure |

## Required external configuration (Supabase + SMTP)

Password-reset **email delivery is not part of this repository** — it is
handled by Supabase Auth and the SMTP provider attached to your Supabase
project. To make delivery reliable in production:

1. **Configure SMTP in Supabase.**
   Supabase → Authentication → SMTP Settings. The default shared email service
   is heavily rate-limited (a handful of emails per hour) and is not reliable
   for production. Connect a real provider (Resend, Postmark, Amazon SES,
   SendGrid, Mailgun, etc.) and verify the sending domain (SPF, DKIM, and — if
   offered — DMARC) at that provider.
2. **Set the redirect allow-list.**
   Supabase → Authentication → URL Configuration:
   - **Site URL:** `https://getamptrail.vercel.app` (or your custom domain).
   - **Redirect URLs:** add `https://getamptrail.vercel.app/auth/callback`,
     your preview domain's `/auth/callback`, and
     `http://localhost:3000/auth/callback` for development. The recovery email
     links to `/auth/callback?next=/reset-password`, so the callback path must
     be allowed.
3. **Customize the email template (optional but recommended).**
   Supabase → Authentication → Email Templates → Reset Password. Keep the
   `{{ .ConfirmationURL }}` variable. Consider setting the "from" address to a
   domain you control and matching the AmpTrail tone.
4. **Rate limits.** Supabase Auth enforces per-user and per-IP rate limits on
   password-reset requests. The UI surfaces the server's wait time when hit.
   If your crew shares one office IP, raise the rate limits in Supabase →
   Authentication → Rate Limits or route through a dedicated SMTP provider
   with higher throughput.
5. **Test delivery end to end** with a real mailbox (including spam folder)
   before announcing the feature. Verify the link opens
   `/reset-password`, the new-password form loads, and the updated password
   signs in. The app cannot verify delivery for you.

## Support contact

Customer-facing recovery guidance in the app points to
`amptrail.support@gmail.com` (configurable via `NEXT_PUBLIC_SUPPORT_EMAIL`).
If reset emails stop arriving, that inbox is where customers are told to
write — keep an eye on it during incidents.

## Known limitations

- Delivery itself (SMTP uptime, spam classification, mailbox rules) is outside
  the application's control; the UI reports request acceptance only.
- The shared Supabase email service is fine for development but will rate-limit
  quickly; production deployments should complete step 1 above.
- Recovery links are single-use and short-lived by design (Supabase default is
  one hour). Users who wait too long must request a new link — the UI now says
  so explicitly.
