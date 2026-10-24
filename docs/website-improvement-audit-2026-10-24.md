# AmpTrail website improvement audit — 2026-10-24

## Scope and verification

Reviewed `README.md`, `package.json`, `app/page.tsx`, `app/layout.tsx`, and `app/globals.css` from `main` through GitHub. This is a **source inspection**, not a runtime test or a full security audit. No production database, secrets, or deployment were modified.

## Verified strengths

- Next.js App Router with React 19, TypeScript, Tailwind 4, Supabase SSR, Zod, Vitest, and PDF export dependency.
- Landing page already distinguishes implemented web workflows from SMS/MMS, voice, AI extraction, and team-invitation plans.
- Accessible focus styling and reduced-motion support are present in global CSS.
- Global metadata includes canonical base, Open Graph, and application icons.
- Repository documents a real Supabase migration/RLS model and its deployment prerequisites.

## Prioritized work

### P0 — Validate production workflows and security before claiming readiness

1. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` in an environment with Node 22. Record real results.
2. Test signup, email confirmation, login, reset, project creation, ticket creation/edit, evidence upload, signed URLs, PDF export, and logout against a **staging** Supabase project.
3. Review deployed migrations, RLS and storage policies with two independent accounts and ensure cross-workspace access fails.
4. Check preview and production environment configuration and redirects without exposing secret values.

### P1 — Customer experience

1. Test all marketing CTAs and form flows on narrow phones and desktops.
2. Confirm actual deployed feature availability before changing claims.
3. Audit the signup-to-first-ticket journey, loading/error/empty states, keyboard navigation, and field-level validation.
4. Confirm sample product previews are clearly labeled as sample data.
5. Measure Core Web Vitals and accessibility with repeatable tools, then address observed bottlenecks.

### P2 — Conversion and measurement

1. Verify GA4 page views occur once per navigation and signup/lead events fire only on real success.
2. Check SEO crawl directives for authenticated routes and inspect sitemap/canonical URLs.
3. Clarify the pilot or pricing offer only after owner confirmation; do not invent pricing or testimonials.
4. Conduct interviews with electrical subcontractors before claiming savings or product-market fit.

## Guardrails

- No production deployment, PR merge, or destructive database migration without explicit owner approval.
- Do not introduce fake testimonials, fabricated ROI statistics, or pretend planned SMS/AI features are live.
- Preserve existing working workflows and tenant isolation.
- A checked box requires evidence: command output, reproducible steps, or a verified deployed test.

## Current status

- [x] Repository connection confirmed and source files inspected.
- [x] Isolated improvement branch created.
- [ ] Local install/typecheck/lint/tests/build run.
- [ ] Staging Supabase workflow and RLS validation.
- [ ] Browser-based mobile/accessibility/performance checks.
- [ ] Changes reviewed and approved for production.
