# AmpTrail provisioning runbook

This runbook is for the Supabase project administrator and the deployment owner. It contains read-only diagnostics, the steps for applying the provisioning repair, and the settings to check. Do not run write statements against production outside the migration file.

## 1. Read-only diagnostics (Supabase Dashboard → SQL Editor)

These statements only read data. Replace the email in section 1.7 with your own test or support account before running it.

```sql
-- 1.1 Which AmpTrail migrations are recorded as applied (Supabase CLI history, if used)
select version, name from supabase_migrations.schema_migrations order by version;

-- 1.2 Core tables exist?
select table_name from information_schema.tables
 where table_schema = 'public'
   and table_name in ('profiles', 'companies', 'company_memberships', 'projects', 'work_tickets', 'evidence_files', 'activity_events')
 order by 1;

-- 1.3 Provisioning functions and the account trigger
select p.proname, p.prosecdef as security_definer, p.proconfig as settings
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('provision_amptrail_user', 'provision_user_workspace', 'ensure_user_workspace', 'save_work_ticket', 'is_company_member');

select tgname, tgenabled from pg_trigger
 where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 1.4 Dangerous privileges held by API roles (should return no rows after the repair)
select grantee, table_name, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and grantee in ('anon', 'authenticated')
   and privilege_type in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
 order by table_name, grantee;

-- 1.5 Accounts without a membership (counts only, no personal data)
select count(*) as accounts_without_membership
  from auth.users u
 where not exists (select 1 from public.company_memberships m where m.user_id = u.id);

-- 1.6 Membership rows per account (should be 1 for every account in the single-workspace starter UI)
select count(*) filter (where n = 0) as no_membership,
       count(*) filter (where n = 1) as one_membership,
       count(*) filter (where n > 1) as several_memberships
  from (select u.id, count(m.id) as n
          from auth.users u
          left join public.company_memberships m on m.user_id = u.id
         group by u.id) per_user;

-- 1.7 One account in detail (replace the email first)
select u.id, u.email, u.email_confirmed_at, u.created_at, u.last_sign_in_at,
       exists (select 1 from public.profiles p where p.id = u.id) as has_profile,
       (select count(*) from public.company_memberships m where m.user_id = u.id) as memberships
  from auth.users u
 where u.email = 'REPLACE_WITH_EMAIL@example.com';

-- 1.8 Evidence rows that do not follow the company-folder rule (should be 0; fix before validating)
select count(*) as evidence_rows_outside_company_folder
  from public.evidence_files
 where split_part(storage_path, '/', 1) <> company_id::text;
```

Interpretation:

- If section 1.2 returns fewer tables than expected, the initial migration is not applied or is only partly applied. Apply `202610100001_initial_schema.sql` first (only if the database is otherwise new), then `202610100002_provisioning_repair.sql`. If the tables already exist, do **not** re-run the initial file; apply only the repair file.
- If section 1.3 has no `ensure_user_workspace`, the repair migration has not been applied.
- If section 1.4 returns rows, the API roles can truncate or otherwise modify tables. Apply the repair migration.
- Section 1.5 counts accounts that need the "Name your company" recovery step on their next sign-in. The app does not create workspaces for them silently.

## 2. Applying the repair migration

1. Take a backup or confirm point-in-time recovery is enabled for the project.
2. In SQL Editor, paste the full contents of `supabase/migrations/202610100002_provisioning_repair.sql` and run it. The file is idempotent, so running it again is safe.
3. Re-run sections 1.3 and 1.4. Expect the functions to be present and section 1.4 to return no rows.
4. Optional: validate the evidence constraint once section 1.8 returns 0: `alter table public.evidence_files validate constraint evidence_files_storage_path_company_scoped;`
5. Record the application in your change log. Do not edit the migration files in production.

If the repair migration reports `AmpTrail base schema is missing`, apply `202610100001_initial_schema.sql` to the fresh database first.

## 3. Existing accounts without a workspace

- Nothing is changed automatically for existing accounts. When such an account signs in, `/dashboard` sends it to `/workspace-setup`. The company name is prefilled from the signup metadata when present.
- Submitting the form calls `ensure_user_workspace` with the company name. The function acts only on the signed-in user (`auth.uid()`), creates one company and one owner membership, and returns the existing workspace on every later call.
- It never joins an existing company, and it never overwrites a profile name or an existing membership.

## 4. Supabase Dashboard settings to check

| Setting | Required value |
|---|---|
| Authentication → Providers → Email → **Confirm email** | Enabled (recommended). If disabled, signup signs users in immediately and the verification screen is skipped. |
| Authentication → URL Configuration → **Site URL** | `https://getamptrail.vercel.app` (or your custom domain) |
| Authentication → URL Configuration → **Redirect URLs** | `https://getamptrail.vercel.app/auth/callback` and `https://getamptrail.vercel.app/**` if Preview deployments are used. Add `http://localhost:3000/auth/callback` for local development. Add your custom domain as well if you use one. |
| Authentication → Email Templates → Confirm signup | Uses `{{ .ConfirmationURL }}` (the default). The link must go to the Supabase verify endpoint, which then redirects to `/auth/callback`. |
| Project Settings → Auth → SMTP | A production SMTP provider. The default Supabase mailer is rate limited and is for testing only. |
| Authentication → Rate Limits | Keep email-send limits enabled. The verification screen shows a 60-second resend cooldown. |

Do not make the `evidence` storage bucket public. It must stay private.

## 5. Vercel settings to check (Production)

- `NEXT_PUBLIC_SUPABASE_URL` = `https://ykqisvebfqfjddfvbapa.supabase.co` (the project URL, no trailing slash).
- Exactly one of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the **publishable** key from Project Settings → API. It is browser-safe.
- **Never** create a `NEXT_PUBLIC_` variable for the `service_role` or secret key, and do not add it to any variable that the app reads. This repository does not use a service-role key.
- After changing environment variables, redeploy Production. `NEXT_PUBLIC_` values are compiled into the build.

## 6. Manual verification checklist (run on a controlled test account)

1. Open `/signup`, submit it empty, and confirm field errors appear. Confirm no network call is made to Supabase.
2. Sign up with a new test address. Confirm you land on "Check your email" and that the address is shown. The password field is not shown there.
3. Open the confirmation email in the **same browser**, and confirm you land on `/dashboard`. The workspace shows your company name.
4. Log out, log in with the same credentials, and confirm you reach `/dashboard` without a second workspace appearing.
5. Confirm an unconfirmed account cannot reach `/dashboard`.
6. Open the confirmation link a second time. Confirm you are sent to `/login` with the "invalid or has expired" message and not signed in.
7. Log in with a wrong password and confirm the message "That email and password did not match".
8. For an account that has no membership (section 1.5), confirm `/dashboard` leads to "Name your company". Submit it and confirm `/dashboard` opens. Submit the recovery path again and confirm no second company appears (section 1.6 shows one membership).
9. Create a project and a work ticket in one account. Log in as a second account and confirm the first account's project and ticket are not visible.
