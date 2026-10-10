-- AmpTrail provisioning repair (forward migration).
--
-- Apply AFTER 202610100001_initial_schema.sql. Do not edit the initial migration.
-- Safe to re-run: every statement is idempotent (create or replace / drop if exists / on conflict).
--
-- What this fixes:
--   1. One shared, idempotent provisioning routine creates a profile, one company, and one owner
--      membership for a single auth user. Trigger, callback, and recovery all call it, so retries
--      and races cannot create duplicate companies or memberships.
--   2. The auth.users trigger is reinstalled so it is guaranteed to exist with the intended definition.
--   3. A caller-scoped recovery RPC (ensure_user_workspace) lets an authenticated user with no
--      membership create their own workspace. It takes no user, company, or role parameter; it always
--      acts on auth.uid() and can never join another company.
--   4. Privileges that Supabase's default grants leave open on public tables are removed.
--      TRUNCATE is not filtered by RLS, so authenticated users must not hold it.

-- Fail early with a clear message if the base schema has not been applied.
do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.companies') is null
     or to_regclass('public.company_memberships') is null then
    raise exception 'AmpTrail base schema is missing. Apply 202610100001_initial_schema.sql first, then re-run this migration.';
  end if;
end $$;

-- 1. Shared provisioning routine -------------------------------------------------------------
-- Internal only: no grant to anon or authenticated. Callers are the trigger and ensure_user_workspace.
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

revoke all on function public.provision_user_workspace(uuid, text, text, text) from public, anon, authenticated;

-- 2. Account trigger ----------------------------------------------------------------------------
-- Keeps the original behavior: every new account gets a workspace named by the company_name it supplied.
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

drop trigger if exists on_auth_user_created_amptrail on auth.users;
create trigger on_auth_user_created_amptrail
  after insert on auth.users
  for each row execute function public.provision_amptrail_user();

-- 3. Caller-scoped recovery RPC ---------------------------------------------------------------
-- Used when an authenticated user has no membership (for example an account created before the
-- trigger existed, or a trigger failure). Acts only on auth.uid(); returns the existing company when
-- one exists, so repeated calls never create duplicates.
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

revoke all on function public.ensure_user_workspace(text) from public, anon;
grant execute on function public.ensure_user_workspace(text) to authenticated;

-- 4. Least-privilege grants --------------------------------------------------------------------
-- Provisioning tables are written only by the SECURITY DEFINER routines above. The application never
-- inserts, deletes, or updates them directly, so those privileges are removed from API roles.
revoke all on public.companies, public.company_memberships, public.profiles from anon;
revoke insert, delete, truncate, references, trigger on public.companies, public.company_memberships, public.profiles from authenticated;
revoke update on public.company_memberships from authenticated;

-- TRUNCATE bypasses RLS entirely; no API role should hold it on customer data.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- 5. Evidence paths must stay inside the owning company's storage folder (defense in depth).
-- The application already enforces this. NOT VALID applies the rule to new and updated rows without
-- scanning existing rows, so this migration cannot fail on historical data. To check old rows later:
--   alter table public.evidence_files validate constraint evidence_files_storage_path_company_scoped;
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.evidence_files'::regclass
       and conname = 'evidence_files_storage_path_company_scoped'
  ) then
    alter table public.evidence_files
      add constraint evidence_files_storage_path_company_scoped
      check (split_part(storage_path, '/', 1) = company_id::text) not valid;
  end if;
end $$;
