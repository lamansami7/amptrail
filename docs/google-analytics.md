# Google Analytics 4

AmpTrail uses measurement ID `G-MBG985L02V`. No additional analytics package or environment variable is required.

## Installation and navigation

- The existing root layout installs one Google tag loader and one initialization script using `next/script`, both with `afterInteractive` and stable IDs. Initialization has an additional singleton guard.
- Initialization sets `send_page_view: false`. The invisible client component observes Next.js `usePathname` and queues a manual `page_view` for the initial page and subsequent route changes (including back/forward). It does not depend on the Google script finishing its download.
- Repeated effects do not produce duplicate views. Moving between different projects/tickets still counts as separate views, even though their IDs are removed.
- Query-only changes and fragment changes deliberately do not count as new pages. Unknown routes and the authentication callback are not measured.

## Privacy boundary

Page names come exclusively from the static allowlist in `lib/analytics/google-analytics.ts`. Project and ticket detail/edit URLs become `/projects/[id]`, `/projects/[id]/edit`, `/tickets/[id]`, or `/tickets/[id]/edit`. No query strings, fragments, authentication tokens, document titles, browser referrers, user/account/workspace IDs, form values, customer details, record contents, or evidence URLs are intentionally included.

The Google tag sends collection requests to the first-party `/api/analytics/g/collect` endpoint via `server_container_url` (and the compatibility `transport_url`). This endpoint **rebuilds** each hit from a strict allowlist before sending it to Google's fixed GA4 endpoint:

- Only explicitly marked, sanitized manual `page_view` events are accepted. The internal marker is removed before forwarding.
- Automatic page views and Enhanced Measurement events (forms, clicks, downloads, searches, etc.) are dropped, even if enabled in the GA property's settings. They cannot cause duplicate views or forward private event parameters.
- Page locations must already be exact generic route templates on the canonical site origin. Titles are reconstructed, not trusted from the request. Referrers can only be a previous generic AmpTrail page.
- Only the tag's anonymous numeric client ID, numeric session/engagement metadata, and validated consent signals are preserved. All other event/user parameters are dropped. Google signals, ad personalization, and enhanced conversions are disabled.
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
