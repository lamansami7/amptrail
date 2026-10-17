# AmpTrail analytics release checklist

This checklist distinguishes code-level tracking from events confirmed in the live GA4 property.

## What the app currently tracks

- `page_view`: sent manually for approved, privacy-safe route templates on initial load and navigation.
- `sign_up`: sent only after Supabase returns a newly created user, with consent and session deduplication.
- `generate_lead`: **not implemented**. The contact page launches an email client; clicking a mailto link does not prove that a message was sent. Do not count that click as a qualified lead.

Do not add a second GA initialization script or the deleted `src/lib/gtag.ts` helper. Keep the privacy allowlist in `lib/analytics/google-analytics.ts` and the first-party relay.

## Automated verification before merging

Run these commands from the repository root on Node 22:

```sh
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

If any command fails, fix that failure before merging. Passing these checks does **not** prove GA4 ingests production events.

## Production verification

1. Open the deployed site and Google Analytics Realtime / DebugView for measurement ID `G-MBG985L02V`. Use a browser without an analytics-blocking extension for this controlled test and ensure analytics consent is granted.
2. Open the homepage, then navigate to `/contact` and `/signup`. Confirm one manual `page_view` per route transition, not two. Do not treat a browser request or relay HTTP 200 as proof of GA4 ingestion.
3. In browser developer tools, inspect Network for a single `gtag/js?id=G-MBG985L02V` loader and requests to `/api/analytics/g/collect`. For a valid hit, the relay should report `accepted: 1`, `forwarded: 1`, and `failed: 0`; an upstream 2xx is transport evidence only.
4. In a test environment with Supabase configured, create a **new** test account using a permitted test email. Confirm one `sign_up` event in GA4. Refresh and sign in again; neither should emit another `sign_up`.
5. Check that no private project IDs, ticket IDs, email addresses, names, company names, or query strings are sent to Google. The relay must reject unmarked automatic/enhanced-measurement events.
6. Confirm consent denial suppresses events. Review the GA4 property-side user-provided-data detection setting documented in `docs/google-analytics.md`.

## Business conversion decision

Do not mark `generate_lead` as verified until AmpTrail has a real lead capture or booking flow with a server-confirmed successful submission. If adding that flow later, update the first-party relay allowlist and tests at the same time; a browser-only `gtag('event', 'generate_lead')` call will currently be rejected.

## Release gate

Record the date, commit SHA, results of all four automated commands, and screenshots or notes of the GA4 Realtime/DebugView checks in the PR before merging. Keep `main` untouched until the checks pass.
