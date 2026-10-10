# AmpTrail

**Extra work happens. Don't lose the record.**

AmpTrail is a responsive field-record application for electrical subcontractors. It is built with Next.js App Router, TypeScript, Tailwind CSS v4, Supabase Auth/Postgres/Storage, and Zod. The root route is the public marketing site; authenticated workspaces live under `/dashboard`, `/projects`, `/tickets`, `/evidence`, and `/settings`.

> **Deployment status:** this source build compiles and its local checks pass, but it is not production-ready until a real Supabase project is connected, the migration and Auth redirect settings are applied, the RLS/storage behavior is reviewed, and the complete workflow is tested with real accounts on the deployed domain. Privacy and terms pages are deployment-review templates. No payment approval or invoice workflow is claimed.

## What is implemented

- Public marketing site with feature, workflow, FAQ, proposed-pricing, and product-preview sections.
- Email/password sign-up, log-in, email-confirmation callback, sign-out, and password-reset flow using Supabase Auth. No local-storage password mock or bypass is used.
- Server-rendered protected workspace with mobile navigation, profile/company settings, and real database-backed dashboard counts/activity.
- Project create/edit/detail/archive/restore flows.
- Work-ticket create/edit/detail/duplicate and confirmed draft deletion; human-readable ticket numbers are assigned by a database trigger.
- Labor, material, and equipment/other cost line items. Server Zod validation and Postgres constraints reject invalid values; line totals are rounded to cents and shared calculations are tested.
- Private, company-scoped image upload with JPG/PNG/WebP validation, 10 MB limit, progress feedback, captions/notes, signed previews, and uploader-controlled removal.
- Print-ready ticket detail and a downloadable PDF with work/project details, line-item totals, status, acknowledgment lines, and evidence images where the browser can load the short-lived private image links.
- PostgreSQL schema, account/workspace provisioning trigger, atomic ticket-save RPC, Row Level Security, and private Storage policies in `supabase/migrations/`.

The status values Draft, Ready for Review, Submitted, Approved, Rejected, and Invoiced are user-maintained tracking labels. AmpTrail does not independently verify approvals or payment, transmit tickets to a general-contractor portal, interpret a contract, or replace an invoice/change order.

## Requirements

- Node.js **22.12 or newer** (Next.js 16 requirement)
- npm
- A Supabase project for account, database, and evidence workflows

## Local setup

```bash
npm install
cp .env.example .env.local
```

Set the following in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY
```

The application accepts either the legacy browser-safe anon key under `NEXT_PUBLIC_SUPABASE_ANON_KEY` or the newer publishable key under `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; when both are present, the publishable key is preferred. These are public client keys. **Never use a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable, a browser, or this repository.**

Optional public settings:

```dotenv
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`NEXT_PUBLIC_SUPPORT_EMAIL` enables the Contact page's mail link. `NEXT_PUBLIC_SITE_URL` sets the canonical metadata URL. Do not set either to an address/domain that is not controlled by the operator.

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>. If Supabase keys are absent, the public website remains usable, auth pages explain that setup is required, and protected workspace routes return to that setup notice instead of pretending authentication or data operations succeeded. After Supabase is connected, signed-in accounts without a provisioned company membership receive migration/provisioning guidance at `/workspace-setup`.

## Connect Supabase

1. Create a Supabase project and copy its **Project URL** plus a browser-safe **publishable key** (or legacy **anon key**) from Project Settings → API.
2. Add the URL/key to `.env.local` for local use and to Vercel for each relevant environment (Preview and Production separately). Redeploy after changing Vercel environment variables.
3. Apply the migrations in `supabase/migrations/` in order, using the Supabase SQL Editor or `supabase db push`:
   - `202610100001_initial_schema.sql`: the profiles, companies, memberships, projects, tickets, line-item, evidence, and activity tables, indexes, constraints, triggers, RLS policies, the private `evidence` bucket, and its object policies. Apply it to a **fresh** database only.
   - `202610100002_provisioning_repair.sql`: the shared provisioning routine, the account trigger, the `ensure_user_workspace` recovery function, least-privilege grants (including removing `TRUNCATE` from API roles), and the evidence path constraint. It is idempotent and safe to re-run. Apply it to every existing project, including projects that already have the first migration.
   - Before and after applying, run the read-only checks in `docs/provisioning-runbook.md`.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to the deployment's canonical origin. Add these exact redirect URLs (as applicable):
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`
   - `https://YOUR_CUSTOM_DOMAIN/auth/callback`
5. In Supabase → Authentication → Providers, enable Email. Choose whether email confirmation is required. If enabled, configure reliable SMTP for production and test delivery; AmpTrail shows a confirmation message and exchanges the emailed PKCE code at `/auth/callback`.
6. Password-reset messages redirect through `/auth/callback?next=/reset-password`. Confirm that the redirect URL above is allowed. The callback only accepts safe relative destinations.
7. Review the migration and RLS policies in your own project. The account trigger creates one profile, one company/workspace, and one owner membership on account creation. Accounts that exist without a membership (for example, created before the trigger was installed) are shown a **Name your company** step after sign-in; that step creates only the signed-in user's own workspace and never joins an existing company. The starter UI selects the earliest workspace; a multi-workspace switcher and member-invitation flow are not included.
8. Test uploads with a signed-in account. The bucket is private, limited to 10 MB JPG/PNG/WebP objects. Signed image URLs expire after one hour. Do not manually make the bucket public.

The initial migration is intended for a new Supabase project. Do not re-run its `create table` statements on an existing database. Put later schema changes in new forward migrations, such as `202610100002_provisioning_repair.sql`.

### Signup and email confirmation flow

- Signup validates every field before it contacts Supabase, then sends the company name as user metadata and `emailRedirectTo` set to `/auth/callback?next=/dashboard`.
- If Supabase returns no session (email confirmation required), the app navigates to `/verify-email?email=…`. That page states the address the link was sent to, explains that the link must be opened in the same browser, and provides a resend action with a 60-second cooldown. A success message appears only when Supabase returns no error.
- If Supabase returns a session (confirmation disabled), the app goes straight to `/dashboard`.
- `/auth/callback` exchanges only the one-time PKCE `code`. A missing, invalid, or expired code redirects to `/login` with a message and never creates a session. After a successful exchange it calls `ensure_user_workspace()`, which is idempotent.
- Unconfirmed accounts have no session, so protected routes redirect them to `/login`.

### Workspace states

`/dashboard` and the other workspace routes resolve the signed-in account into one of four states:

| State | Result |
|---|---|
| Signed out | Redirect to `/login`. |
| Signed in, membership exists | Workspace loads. |
| Signed in, no membership (verified by a successful query returning no rows) | `/workspace-setup` asks for a company name and creates only this account's workspace. |
| Signed in, lookup failed | `/workspace-unavailable` shows the failure category: setup incomplete (missing migration), permission denied, or a temporary problem. It never says the workspace is missing.

## Automated tests

- `npm run lint`, `npm run typecheck`, `npm test` (unit tests for auth rules, redirect safety, workspace-error classification, and existing ticket math), and `npm run build`.
- `npm run test:db` runs the provisioning and tenant-isolation suite (`tests/db/provisioning.test.sql`) against a **throwaway local PostgreSQL** database. It needs `PG_SUPERUSER_URL` pointing at a local server, for example `PG_SUPERUSER_URL=postgresql://postgres@localhost/postgres`. Never point it at Supabase or production. The local harness (`tests/db/supabase-stub.sql`) approximates the Supabase roles, `auth.users`, `auth.uid()`, and `storage` objects. It does not replace testing against your real project.

## Database and access model

- All project, ticket, line-item, evidence, activity, and company records use UUIDs, timestamps, company IDs, foreign keys, and database checks.
- Every application table has RLS enabled. A security-definer membership predicate is used to avoid recursive membership policies. Records are scoped to the user's company membership in Postgres, not just hidden by UI code.
- Ticket edits/deletion are restricted to the creator; only creator-owned Draft tickets can be deleted. Company members can read their company's records. Project updates and company profile edits are scoped to the member's workspace.
- Database grants prevent clients from modifying workspace IDs, ticket creators/numbers, company counters, evidence ownership, or audit actors. Ticket creation/update and child-line replacement run through the `save_work_ticket` invoker-rights RPC inside one database transaction.
- Evidence storage is private. Object paths include workspace, project, ticket-or-project association, and uploader ID; storage RLS checks the workspace and uploader. Ticket deletion cleans up attached private objects before deleting the Draft record.

## Project structure

```text
app/                      App Router pages and route handlers
  (workspace)/             Protected application pages
  auth/callback/           PKCE email-confirmation/reset callback
components/               Marketing, forms, workspace, tickets, and evidence UI
lib/actions/              Server actions for database writes
lib/data/                 Workspace/session helpers
lib/schemas/              Shared Zod schemas
lib/supabase/             Typed browser/server clients and database types
lib/tickets/              Ticket parsing, status labels, and totals
supabase/migrations/       PostgreSQL schema, RLS, and private-storage setup
tests/                    Calculation and validation tests
```

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deploy on Vercel from GitHub

1. Push the repository to GitHub and open the intended production branch/PR through your normal review process.
2. In Vercel, choose **Add New → Project**, import the GitHub repository, and grant Vercel access to that repository if prompted.
3. Keep the detected Next.js settings. The package scripts use `next build`; no custom build command is needed. `vercel.json` in the repository root pins `framework: nextjs`, `buildCommand: next build`, `installCommand: npm ci`, and `outputDirectory: .next` so the Next.js preset is used even if the project was originally imported as a static site.
   - If a deployment fails with `No Output Directory named "public" found after the Build completed` (`STATIC_BUILD_NO_OUT_DIR`), the project is being built as a static site. In Vercel → **Settings → Build & Development Settings**, set **Framework Preset** to **Next.js** and turn the **Output Directory** override **off**. Do **not** work around this by adding a `public/` folder: that makes the build pass while deploying an empty static folder instead of the application.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and **one** of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel's Preview and Production environments. Add the optional support email and canonical site URL only when they are ready to publish.
5. Deploy a Preview build, configure the matching Supabase redirect URL, and exercise email sign-up/confirmation, sign-in, project creation, ticket edits, upload, and PDF export before merging/releasing.
6. Add the production Vercel domain to Supabase's allowed redirect URLs and Site URL, then redeploy production and re-test password reset and sign-out.

## Before a real launch

- Test two separate Supabase accounts/workspaces and verify that neither can read or modify the other's projects, tickets, evidence metadata, signed URLs, or storage objects.
- Test email confirmation and password recovery using the actual production email provider and all deployed redirect URLs.
- Review SQL policies and column grants with a Supabase administrator; verify RLS after any schema change. Run backups and confirm recovery procedures.
- Test photo upload and cleanup on mobile Safari/Chrome, signed-image expiry, PDF downloads, mobile navigation, print-to-PDF, and large/long tickets on the deployed domain.
- Set a real support contact; have counsel review `/privacy` and `/terms`; establish actual retention, incident response, accessibility, support, and commercial pricing policies.
- Consider adding audit integrity controls and operational monitoring before relying on activity history for a contractual record.

These checks are intentionally called out rather than claiming the preview is production-ready.
