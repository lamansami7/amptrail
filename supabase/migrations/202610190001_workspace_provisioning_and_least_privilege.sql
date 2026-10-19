-- AmpTrail workspace provisioning parity + least-privilege hardening.
--
-- Why this migration exists
-- -------------------------
-- 1. The live project was repaired in October 2026 with two provisioning helpers
--    (provision_user_workspace / ensure_user_workspace) and a delegating
--    provision_amptrail_user trigger function that were never added to this
--    repository. Fresh installs therefore behaved differently from production.
--    This migration puts the exact production logic under version control
--    (CREATE OR REPLACE, so it is a no-op where it already exists).
-- 2. Emergency "restore grant" fixes left the ticket tables with broad
--    table-level INSERT/UPDATE grants for the authenticated role. That allowed
--    direct API writes to bookkeeping columns (ticket_number, company_id,
--    created_by, timestamps) inside a user's own workspace, contrary to the
--    column-level model in the initial migration. Grants are narrowed back to
--    the exact columns the application and the save_work_ticket RPC write.
-- 3. The authenticated role was missing DELETE on evidence_files, so removing
--    evidence deleted the private storage object and then failed to delete its
--    database row. The grant is added; the existing RLS policy still restricts
--    deletes to the uploader within their own workspace.
-- 4. Trigger-only and internal functions lose direct EXECUTE for anon and
--    authenticated. Trigger functions do not need an EXECUTE grant to fire, and
--    removing the grant also removes them from the REST RPC surface.
--
-- Deliberate exceptions (also documented in the README): two SECURITY DEFINER
-- functions stay executable by authenticated, because the application depends
-- on them and both derive the caller identity from auth.uid() with no
-- caller-supplied user/company target:
--   * is_company_member(uuid)  - the RLS membership predicate used by every
--     policy; policies evaluate with the caller's privileges, so the role
--     needs EXECUTE for any query to run at all. It only ever answers "is the
--     signed-in user a member of this company?".
--   * ensure_user_workspace(text) - the self-heal used when a signed-in user
--     has no membership (for example an account created before the auth
--     trigger existed). It can only create/return the caller's own workspace.
-- Both keep a pinned search_path and are revoked from PUBLIC and anon.
--
-- Safe to apply once; every statement is idempotent. Apply AFTER
-- 202610140001 and 202610150001 (the guards below also tolerate their
-- absence, but the column grants for customer approval assume 202610140001).

-- ---------------------------------------------------------------------------
-- 1. Provisioning helpers (production parity)
-- ---------------------------------------------------------------------------

create or replace function public.provision_user_workspace(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_company_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_company_id uuid;
  workspace_name text;
  workspace_slug text;
  new_company_id uuid;
begin
  if p_user_id is null then
    raise exception 'A user id is required';
  end if;

  -- Serialize provisioning for this user so concurrent callbacks, logins, or retries cannot both insert.
  perform pg_advisory_xact_lock(hashtext('amptrail:provision-user:' || p_user_id::text));

  -- Profile: create if missing; never overwrite a name the user already has.
  insert into public.profiles (id, full_name, email)
  values (p_user_id, nullif(left(trim(coalesce(p_full_name, '')), 120), ''), left(p_email, 254))
  on conflict (id) do update set email = excluded.email;

  -- Existing membership: return it unchanged (idempotent).
  select m.company_id
    into existing_company_id
    from public.company_memberships m
   where m.user_id = p_user_id
   order by m.created_at asc
   limit 1;
  if existing_company_id is not null then
    return existing_company_id;
  end if;

  -- No membership and no company name to use: do not invent a workspace.
  workspace_name := left(nullif(trim(coalesce(p_company_name, '')), ''), 160);
  if workspace_name is null then
    return null;
  end if;

  workspace_slug := trim(both '-' from lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '-', 'g')));
  workspace_slug := coalesce(nullif(workspace_slug, ''), 'workspace') || '-' || substr(gen_random_uuid()::text, 1, 8);

  insert into public.companies (name, slug)
  values (workspace_name, workspace_slug)
  returning id into new_company_id;

  insert into public.company_memberships (company_id, user_id, role)
  values (new_company_id, p_user_id, 'owner');

  return new_company_id;
end;
$$;

comment on function public.provision_user_workspace(uuid, text, text, text) is
  'Internal provisioning helper. SECURITY DEFINER, callable only by the function owner (auth trigger and ensure_user_workspace). Never grant to anon/authenticated: the target user is a parameter.';

-- The auth trigger keeps its original name/binding; it now delegates so both
-- provisioning paths share one implementation.
create or replace function public.provision_amptrail_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.provision_user_workspace(
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 'My company')
  );
  return new;
end;
$$;

comment on function public.provision_amptrail_user() is
  'Trigger function on auth.users (on_auth_user_created_amptrail). Provisions the new account''s profile, company and owner membership.';

create or replace function public.ensure_user_workspace(p_company_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  account_email text;
  account_full_name text;
  account_company_name text;
  requested_name text := nullif(trim(coalesce(p_company_name, '')), '');
begin
  if caller_id is null then
    raise exception 'Sign in to set up a workspace' using errcode = '42501';
  end if;
  if requested_name is not null and char_length(requested_name) > 160 then
    raise exception 'Company name must be 160 characters or fewer' using errcode = '22001';
  end if;

  select u.email,
         u.raw_user_meta_data ->> 'full_name',
         u.raw_user_meta_data ->> 'company_name'
    into account_email, account_full_name, account_company_name
    from auth.users u
   where u.id = caller_id;
  if not found then
    raise exception 'Account not found' using errcode = '42501';
  end if;

  return public.provision_user_workspace(
    caller_id,
    account_email,
    account_full_name,
    coalesce(requested_name, nullif(trim(coalesce(account_company_name, '')), ''))
  );
end;
$$;

comment on function public.ensure_user_workspace(text) is
  'Self-heal for a signed-in user without a workspace membership. Identity comes only from auth.uid(); it can create/return only the caller''s own workspace and is idempotent. Authenticated EXECUTE is intentional (see README, security model).';

comment on function public.is_company_member(uuid) is
  'RLS membership predicate: true when auth.uid() belongs to the given company. SECURITY DEFINER avoids recursive RLS on company_memberships. Authenticated EXECUTE is required because policies run with the caller''s privileges; there is no user-id parameter to abuse.';

-- ---------------------------------------------------------------------------
-- 2. Function privileges: keep the RPC surface to what the app actually calls
-- ---------------------------------------------------------------------------

-- Internal helpers and trigger functions: owner-only.
do $$
declare
  fn regprocedure;
  signature text;
begin
  foreach signature in array array[
    'public.provision_user_workspace(uuid,text,text,text)',
    'public.provision_amptrail_user()',
    'public.assign_ticket_number()',
    'public.set_updated_at()',
    'public.stamp_customer_approval()',
    'public.guard_finalized_ticket()',
    'public.stamp_submission_handling()',
    'public.guard_processed_submission()',
    'public.limit_submission_attachments()',
    'public.rls_auto_enable()'
  ] loop
    fn := to_regprocedure(signature);
    if fn is not null then
      begin
        execute format('revoke all on function %s from public, anon, authenticated', fn);
      exception when insufficient_privilege or others then
        -- A platform-managed function (e.g. rls_auto_enable) may not be
        -- alterable in every project. Leave it untouched rather than failing
        -- the whole hardening pass.
        raise notice 'could not revoke execute on %: %', signature, sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- App-callable functions: signed-in users only, never anon/PUBLIC.
revoke all on function public.is_company_member(uuid) from public, anon;
grant execute on function public.is_company_member(uuid) to authenticated;

revoke all on function public.ensure_user_workspace(text) from public, anon;
grant execute on function public.ensure_user_workspace(text) to authenticated;

revoke all on function public.save_work_ticket(uuid, uuid, timestamptz, text, text, text, public.ticket_status, text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_work_ticket(uuid, uuid, timestamptz, text, text, text, public.ticket_status, text, text, jsonb, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Table grants for the authenticated role (RLS still decides which rows)
-- ---------------------------------------------------------------------------

-- Signed-in users read through RLS on every application table. Re-asserted so
-- a fresh project does not depend on platform default privileges.
grant select on
  public.profiles,
  public.companies,
  public.company_memberships,
  public.projects,
  public.work_tickets,
  public.labor_entries,
  public.material_entries,
  public.ticket_costs,
  public.evidence_files,
  public.activity_events
to authenticated;

do $$
begin
  if to_regclass('public.field_submissions') is not null then
    grant select on public.field_submissions, public.submission_attachments to authenticated;
  end if;
end $$;

-- Evidence removal (bug fix): the uploader-delete RLS policy already exists;
-- the table privilege was missing, which orphaned the metadata row.
grant delete on public.evidence_files to authenticated;

-- Work tickets: writes go through save_work_ticket plus the two narrow direct
-- paths (draft delete, customer-approval record). Bookkeeping columns
-- (company_id on update, created_by, ticket_number, timestamps) are not
-- client-writable.
revoke insert, update on public.work_tickets from authenticated;
grant insert (company_id, project_id, created_by, occurred_at, location, description, out_of_scope_reason, status, gc_representative, notes)
  on public.work_tickets to authenticated;
grant update (project_id, occurred_at, location, description, out_of_scope_reason, status, gc_representative, notes)
  on public.work_tickets to authenticated;
grant delete on public.work_tickets to authenticated;

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'work_tickets' and column_name = 'customer_approval'
  ) then
    grant update (customer_approval, customer_approval_note) on public.work_tickets to authenticated;
  end if;
end $$;

-- Line items are replaced wholesale by save_work_ticket (delete + insert);
-- nothing in the application updates a line in place.
revoke insert, update on public.labor_entries from authenticated;
grant insert (company_id, ticket_id, worker_name, hours, rate) on public.labor_entries to authenticated;
grant delete on public.labor_entries to authenticated;

revoke insert, update on public.material_entries from authenticated;
grant insert (company_id, ticket_id, description, quantity, unit_cost) on public.material_entries to authenticated;
grant delete on public.material_entries to authenticated;

revoke insert, update on public.ticket_costs from authenticated;
grant insert (company_id, ticket_id, description, quantity, unit_cost) on public.ticket_costs to authenticated;
grant delete on public.ticket_costs to authenticated;

-- Rows in these tables are created by the definer provisioning path only.
-- Re-assert the narrow direct writes the settings/inbox screens rely on.
grant update (full_name) on public.profiles to authenticated;
grant update (name) on public.companies to authenticated;
grant insert (company_id, actor_id, event_type, entity_type, entity_id, description) on public.activity_events to authenticated;
grant insert (company_id, name, project_number, site_address, general_contractor, notes, is_archived) on public.projects to authenticated;
grant update (name, project_number, site_address, general_contractor, notes, is_archived) on public.projects to authenticated;
grant insert (company_id, project_id, ticket_id, uploaded_by, storage_path, original_filename, mime_type, size_bytes, caption, notes) on public.evidence_files to authenticated;

-- Nothing in AmpTrail is readable or writable while signed out.
revoke all on
  public.profiles,
  public.companies,
  public.company_memberships,
  public.projects,
  public.work_tickets,
  public.labor_entries,
  public.material_entries,
  public.ticket_costs,
  public.evidence_files,
  public.activity_events
from anon;

do $$
begin
  if to_regclass('public.field_submissions') is not null then
    revoke all on public.field_submissions, public.submission_attachments from anon;
  end if;
end $$;

-- RLS stays the authorization layer everywhere; re-assert for fresh installs.
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.work_tickets enable row level security;
alter table public.labor_entries enable row level security;
alter table public.material_entries enable row level security;
alter table public.ticket_costs enable row level security;
alter table public.evidence_files enable row level security;
alter table public.activity_events enable row level security;

do $$
begin
  if to_regclass('public.field_submissions') is not null then
    alter table public.field_submissions enable row level security;
    alter table public.submission_attachments enable row level security;
  end if;
end $$;
