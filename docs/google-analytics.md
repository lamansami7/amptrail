# Google Analytics 4

AmpTrail uses measurement ID `G-MBG985L02V`. No additional analytics package or environment variable is required.

## Why not `@next/third-parties/google`

The official `GoogleAnalytics` component was evaluated and is incompatible with this site's privacy requirement (no record IDs, project information, or raw page data may reach Google). In every published version — checked through `16.4.0` and `16.5.0-canary.8`, whose GA sources are identical — the component renders a fixed `gtag('config', gaId)` call and only accepts `gaId`, `nonce`, `debugMode`, and `dataLayerName`:

- Hits go directly from the browser to `google-analytics.com`. There is no way to set `server_container_url`/`transport_url`, so the first-party allowlist relay below cannot be used.
- Its automatic page views carry the raw `page_location` (real `/projects/<id>` and `/tickets/<id>` record IDs plus query strings), page title, and referrer, and its config cannot set `send_page_view: false`, disable Google signals, or filter Enhanced Measurement events.

Mixing the component with the existing tracker would additionally duplicate page views. The root layout therefore implements the same official App Router pattern — `next/script` with `afterInteractive` plus manual `page_view` tracking on route changes — with the hardening this site requires.

## Installation and navigation

- The existing root layout installs one Google tag loader and one initialization script using `next/script`, both with `afterInteractive` and stable IDs. Initialization has an additional singleton guard.
- Initialization sets `send_page_view: false`. The invisible client component observes Next.js `usePathname` and queues a manual `page_view` for the initial page and subsequent route changes (including back/forward). It does not depend on the Google script finishing its download.
- Repeated effects do not produce duplicate views. Moving between different projects/tickets still counts as separate views, even though their IDs are removed.
- Query-only changes and fragment changes deliberately do not count as new pages. Unknown routes and the authentication callback are not measured.

## Signup conversion (`sign_up`)

AmpTrail tracks the GA4 recommended `sign_up` event at the **account created** stage:

- **What counts as a completed signup:** `sign_up` is queued only after `supabase.auth.signUp()` resolves without error and returns a newly created user (`data.user.id` present and `data.user.identities` not empty). At this stage, Supabase has created the `auth.users` account and executed the `on_auth_user_created_amptrail` database trigger to provision the workspace and owner membership, whether Supabase is configured to issue an immediate session (`data.session` present) or require email verification (`data.session === null`).
- **What is never counted:** Clicks on the signup button, client-side validation failures, failed Supabase `signUp` calls, obfuscated duplicate-registration responses for already-confirmed emails (`identities: []`), sign-in (`signInWithPassword`), and password recovery requests do not emit `sign_up`.
- **Deduplication:** `createSignUpTracker` / `trackSignUp` guards in memory and records `amptrail:ga4:sign_up_tracked = '1'` in `sessionStorage`. Page refreshes, React rerenders, and repeated `/auth/callback` requests cannot produce duplicate `sign_up` events.
- **Privacy & consent:** Only `{ method: 'email', page_path: '/signup', page_location: 'https://getamptrail.vercel.app/signup', page_title: 'AmpTrail · Sign up' }` leaves the browser and relay. Email addresses, passwords, names, company names, and Supabase user IDs are never included. Client-side cookie-consent preferences and Google Consent Mode (`gcs` analytics storage) are respected before queuing or forwarding hits.

## Privacy boundary

Page names come exclusively from the static allowlist in `lib/analytics/google-analytics.ts`. Project and ticket detail/edit URLs become `/projects/[id]`, `/projects/[id]/edit`, `/tickets/[id]`, or `/tickets/[id]/edit`. No query strings, fragments, authentication tokens, document titles, browser referrers, user/account/workspace IDs, form values, customer details, record contents, or evidence URLs are intentionally included.

The Google tag sends collection requests to the first-party `/api/analytics/g/collect` endpoint via `server_container_url` (and the compatibility `transport_url`). This endpoint **rebuilds** each hit from a strict allowlist before sending it to Google's fixed GA4 endpoint:

- Only explicitly marked, sanitized manual `page_view` (`ep.amptrail_page_view=1`) and `sign_up` (`ep.amptrail_sign_up=1`) events are accepted. The internal markers are removed before forwarding.
- Automatic page views and Enhanced Measurement events (forms, clicks, downloads, searches, etc.) are dropped, even if enabled in the GA property's settings. They cannot cause duplicate views or forward private event parameters.
- Page locations must already be exact generic route templates on the canonical site origin. Titles are reconstructed, not trusted from the request. For `sign_up`, `dl`, `dt`, `ep.page_path`, and `ep.method` are always reconstructed as `/signup` and `email`. Referrers can only be a previous generic AmpTrail page.
- Only the tag's anonymous numeric client ID, numeric session/engagement metadata, and validated consent signals are preserved. Hits with `gcs` denying `analytics_storage` are dropped — the last character of the consent string is the analytics state, so every denied encoding (`G100`, `G110`, `G1-0`, `G1x0`, …) is rejected, while granted/unset encodings (`G1-1`, `G111`, …) are preserved and forwarded. All other event/user parameters are dropped. Google signals, ad personalization, and enhanced conversions are disabled.
- The relay forwards each reconstructed hit to Google as a form-encoded POST body: `POST https://www.google-analytics.com/g/collect` with `Content-Type: application/x-www-form-urlencoded`. GA4 does not ingest server-to-server hits whose parameters exist only in the URL query string, so the parameters are never placed in the forwarded URL.
- Browser cookies, browser request headers, and the visitor's IP address are not forwarded. As a result, client-IP geolocation and device/demographic/advertising attribution are deliberately not provided by this relay.

This is basic page-view analytics, not business-event or user-level tracking. It does not read Supabase, authentication state, DOM content, forms, project/ticket records, or customer data. Analytics network failures are isolated from application workflows. Existing legal/consent requirements still need to be reviewed for the deployment; adding GA does not itself establish consent.

## Verification

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

`tests/google-analytics.test.ts` covers singleton initialization, route navigation/deduplication, record-ID removal, unknown routes, safe titles/referrers, automatic-event rejection, parameter filtering, batch collection, and network failure isolation.

For a browser check, inspect the single `gtag/js?id=G-MBG985L02V` script and first-party `g/collect` requests while navigating. The relay is what reaches Google: raw automatic events visible in browser requests are not forwarded. Check GA Realtime after deployment for the generic page names. Ad blockers or privacy settings can prevent analytics entirely and must not interfere with the application.

The relay endpoint always answers `204` (it never echoes analytics data). A healthy deployment answers `204` to a plain `GET /api/analytics/g/collect`; any other status means the route is broken and no data can reach Google. End-to-end ingestion (Google accepting the relay's POSTs into the property) can only be confirmed from a real browser using [GA4 DebugView](https://support.google.com/analytics/answer/9304153) or the Network tab of a page served from a non-blocked network.
