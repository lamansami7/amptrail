# AmpTrail

**Extra work happens. Don't lose the record.**

AmpTrail is a responsive field-record application for electrical subcontractors. It is built with Next.js App Router, TypeScript, Tailwind CSS v4, Supabase Auth/Postgres/Storage, and Zod. The root route is the public marketing site; authenticated workspaces live under `/dashboard`, `/projects`, `/tickets`, `/evidence`, `/inbox`, `/activity`, `/team`, and `/settings`. The legacy `/app.html` and `/app` URLs redirect to `/dashboard`.

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

Ticket workflow statuses are Draft, Needs review, Ready to export, and Finalized (finalized tickets are locked at the database level until reopened). The first-release values Submitted, Approved, Rejected, and Invoiced remain valid as "legacy" labels on existing tickets. All statuses are user-maintained tracking labels, and customer approval is a separate, manually recorded field (Not requested, Awaiting customer, Customer approved, Customer rejected) that no export or status change ever sets. AmpTrail does not independently verify approvals or payment, transmit tickets to a general-contractor portal, interpret a contract, or replace an invoice/change order.

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
NEXT_PUBLIC_SUPPORT_EMAIL=amptrail.support@gmail.com
NEXT_PUBLIC_SITE_URL=https://getamptrail.vercel.app
```

`NEXT_PUBLIC_SUPPORT_EMAIL` overrides the support contact shown on the Contact page, in the footer, and in recovery guidance. The official AmpTrail support address, `amptrail.support@gmail.com`, is the default and is used everywhere unless this variable is set. `NEXT_PUBLIC_SITE_URL` sets the canonical metadata URL (Open Graph, sitemap, robots).

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000>. If Supabase keys are absent, the public website remains usable, auth pages explain that setup is required, and protected workspace routes return to that setup notice instead of pretending authentication or data operations succeeded. After Supabase is connected, signed-in accounts without a provisioned company membership receive migration/provisioning guidance at `/workspace-setup`.

## Connect Supabase

1. Create a Supabase project and copy its **Project URL** plus a browser-safe **publishable key** (or legacy **anon key**) from Project Settings → API.
2. Add the URL/key to `.env.local` for local use and to Vercel for each relevant environment (Preview and Production separately). Redeploy after changing Vercel environment variables.
3. Apply `supabase/migrations/202610100001_initial_schema.sql`, then `supabase/migrations/202610140001_ticket_workflow_and_customer_approval.sql` (additive: new workflow states, the customer-approval fields, and the finalized-ticket lock; it rewrites no rows), then `supabase/migrations/202610150001_field_submissions_inbox.sql` (additive: the field-note inbox tables), to a **fresh** database using the Supabase SQL Editor, or initialize/link the Supabase CLI and apply the migration with `supabase db push`. The migration creates the profiles/workspaces/projects/tickets/line-item/evidence/activity tables, indexes, constraints, triggers, RLS policies, the private `evidence` bucket, and its object policies.
4. In Supabase → Authentication → URL Configuration, set **Site URL** to the deployment's canonical origin. Add these exact redirect URLs (as applicable):
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`
   - `https://YOUR_CUSTOM_DOMAIN/auth/callback`
5. In Supabase → Authentication → Providers, enable Email. Choose whether email confirmation is required. If enabled, configure reliable SMTP for production and test delivery; AmpTrail shows a confirmation message and exchanges the emailed PKCE code at `/auth/callback`.
6. Password-reset messages redirect through `/auth/callback?next=/reset-password`. Confirm that the redirect URL above is allowed. The callback only accepts safe relative destinations. See [`docs/password-recovery.md`](docs/password-recovery.md) for the complete recovery flow, SMTP/production delivery requirements, and rate-limit behavior.
7. Review the migration and RLS policies in your own project. The account trigger creates one company/workspace and owner membership on account creation. The starter UI selects the earliest workspace; a multi-workspace switcher and member-invitation flow are not included.
8. Test uploads with a signed-in account. The bucket is private, limited to 10 MB JPG/PNG/WebP objects. Signed image URLs expire after one hour. Do not manually make the bucket public.

The initial SQL migration is intended for a new Supabase project. If you already applied it, apply only the newer migrations in order (`202610140001_…`, then `202610150001_…`); never re-run the `create table` statements in the initial file. Until that follow-up migration is applied, the new statuses and the customer-approval card will not save; review it first and apply it to a staging project before production.

### Inbox

The office inbox (`/inbox`) holds field notes waiting for review. A person logs a note (and up to 10 photos) through the web app; the office then assigns a project, flags what is missing, and creates a work ticket from it, which closes the note. Statuses: New, Needs project, Missing details, Ready for review, Processed, Dismissed. The rules are enforced by the database as well as the interface: the original note, sender and time cannot be edited, notes and photos cannot be deleted, "Ready for review" requires a project, "Missing details" requires a note, and "Processed" requires a linked ticket. Photos live in the private `evidence` bucket under `<company>/inbox/<submission>/`.

Not built: receiving notes by SMS/MMS, voice transcription and AI extraction. They need a paid provider (and, for extraction, an AI service), and their costs have not been approved. The `sms` and `mms` source values are reserved so a provider can later write rows with the service role. Photos on a note are not copied onto the ticket created from it; they stay on the note. Team (invitations and roles) is still a placeholder.

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

## Brand assets

AmpTrail uses a custom A-and-lightning monogram with matching horizontal wordmarks for light and dark surfaces. The inline `Brand` component keeps the header, footer, authentication pages, and workspace shell visually consistent.

- `public/brand/amptrail-horizontal.svg` / `amptrail-horizontal-dark.svg` — full horizontal vector wordmarks, with high-resolution PNG exports beside them.
- `public/brand/amptrail-icon.svg` / `amptrail-icon-dark.svg` — standalone A-and-lightning vectors, with 512 px PNG exports beside them.
- `public/brand/app-icon.svg` and `apple-icon.svg` — dark PWA icon and light Apple touch icon artwork.
- `public/brand/og.svg` — editable Open Graph artwork; `public/og.png` is the 1200 × 630 social card.
- `app/icon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, and `app/manifest.ts` — browser, Apple, and installable PWA icon metadata/assets.

The manifest includes 192 px and 512 px standard and maskable icons. Replacing the source SVG artwork and regenerating its PNG exports does not affect application routes or authentication.

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
