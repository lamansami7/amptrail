-- AmpTrail provisioning, recovery, and tenant-isolation tests.
-- Runs against a THROWAWAY local database via tests/db/run-db-tests.sh. Every failed assertion raises,
-- which stops the run (ON_ERROR_STOP=1).

\o /dev/null
-- ---------- helpers ----------------------------------------------------------------------------
create or replace function pg_temp.assert_true(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not coalesce(condition, false) then
    raise exception 'TEST FAILED: %', label;
  end if;
  raise notice 'PASS: %', label;
end $$;

create or replace function pg_temp.assert_eq(actual bigint, expected bigint, label text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'TEST FAILED: % (expected %, got %)', label, expected, actual;
  end if;
  raise notice 'PASS: % (%)', label, actual;
end $$;

-- Executes a statement and passes only if it is refused by the database.
create or replace function pg_temp.assert_denied(stmt text, label text)
returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'TEST FAILED: % was allowed but must be denied', label;
exception
  when others then
    if sqlerrm like 'TEST FAILED%' then raise; end if;
    raise notice 'PASS: % is denied (%)', label, sqlerrm;
end $$;

-- Switch the session to an API role and JWT subject, the way PostgREST does for a signed-in browser.
create or replace function pg_temp.act_as(p_role text, p_uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), false);
  perform set_config('request.jwt.claims', json_build_object('sub', coalesce(p_uid::text, ''), 'role', p_role)::text, false);
  perform set_config('role', p_role, false);
end $$;

create or replace function pg_temp.act_as_admin()
returns void language plpgsql as $$
begin
  perform set_config('role', 'none', false);
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claims', '', false);
end $$;

create or replace function pg_temp.memberships_for(p_uid uuid)
returns bigint language sql as $$
  select count(*) from public.company_memberships where user_id = p_uid
$$;

-- ---------- fixtures (created as the migration owner, the same way Supabase Auth creates users) -----
\set uid_a '00000000-0000-4000-8000-00000000000a'
\set uid_b '00000000-0000-4000-8000-00000000000b'
\set uid_c '00000000-0000-4000-8000-00000000000c'
\set uid_d '00000000-0000-4000-8000-00000000000d'
\set uid_e '00000000-0000-4000-8000-00000000000e'
\set uid_f '00000000-0000-4000-8000-00000000000f'

select pg_temp.act_as_admin();

-- T1: trigger provisions profile + company + owner membership for a new account with a company name.
insert into auth.users (id, email, raw_user_meta_data)
values (:'uid_a', 'alice@example.test', '{"full_name":"Alice Field","company_name":"Alpha Electric"}');
insert into auth.users (id, email, raw_user_meta_data)
values (:'uid_b', 'bob@example.test', '{"full_name":"Bob Field","company_name":"Beta Works"}');

select pg_temp.assert_eq((select count(*) from public.profiles where id = :'uid_a' and email = 'alice@example.test' and full_name = 'Alice Field'), 1, 'T1 profile created for new account');
select pg_temp.assert_eq((select count(*) from public.companies c join public.company_memberships m on m.company_id = c.id where m.user_id = :'uid_a' and m.role = 'owner' and c.name = 'Alpha Electric'), 1, 'T1 exactly one owner workspace named from signup company_name');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_a'), 1, 'T1 exactly one membership for user A');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_b'), 1, 'T1 exactly one membership for user B');
select pg_temp.assert_true((select company_id from public.company_memberships where user_id = :'uid_a') <> (select company_id from public.company_memberships where user_id = :'uid_b'), 'T1 A and B are in different companies');

select set_config('test.company_a', (select company_id::text from public.company_memberships where user_id = :'uid_a'), false);
select set_config('test.company_b', (select company_id::text from public.company_memberships where user_id = :'uid_b'), false);

-- T2: trigger fallbacks: missing metadata, blank name, null metadata, very long name and name.
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000c1', 'nometa@example.test', null);
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000c2', 'blank@example.test', '{"company_name":"   "}');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-4000-8000-0000000000c3', 'long@example.test', json_build_object('company_name', repeat('x', 300), 'full_name', repeat('n', 300))::jsonb);
select pg_temp.assert_eq((select count(*) from public.companies c join public.company_memberships m on m.company_id = c.id where m.user_id = '00000000-0000-4000-8000-0000000000c1' and c.name = 'My company'), 1, 'T2 null metadata falls back to My company');
select pg_temp.assert_eq((select count(*) from public.companies c join public.company_memberships m on m.company_id = c.id where m.user_id = '00000000-0000-4000-8000-0000000000c2' and c.name = 'My company'), 1, 'T2 blank company_name falls back to My company');
select pg_temp.assert_eq((select char_length(c.name)::bigint from public.companies c join public.company_memberships m on m.company_id = c.id where m.user_id = '00000000-0000-4000-8000-0000000000c3'), 160, 'T2 long company name is truncated to 160');
select pg_temp.assert_eq((select char_length(p.full_name)::bigint from public.profiles p where p.id = '00000000-0000-4000-8000-0000000000c3'), 120, 'T2 long full name is truncated to 120');

-- T3: idempotent provisioning. Re-running the routine for an existing user never duplicates rows.
select pg_temp.assert_true(public.provision_user_workspace('00000000-0000-4000-8000-00000000000a', 'alice@example.test', 'Alice Field', 'Another Name') = current_setting('test.company_a')::uuid, 'T3 re-running provisioning returns the existing company');
select pg_temp.assert_eq(pg_temp.memberships_for('00000000-0000-4000-8000-00000000000a'), 1, 'T3 re-running provisioning does not add a second membership for A');
select pg_temp.assert_eq((select count(*) from public.companies where name = 'Another Name'), 0, 'T3 re-running provisioning does not create a company for an existing member');

-- T4: recovery. An account whose trigger did not run (simulated by disabling it) has no membership.
alter table auth.users disable trigger on_auth_user_created_amptrail;
insert into auth.users (id, email, raw_user_meta_data) values (:'uid_f', 'orphan@example.test', '{"full_name":"Orphan User"}');
alter table auth.users enable trigger on_auth_user_created_amptrail;
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_f'), 0, 'T4 orphan account starts with no membership (simulated missing trigger)');

select pg_temp.act_as('authenticated', :'uid_f');
select pg_temp.assert_true(public.ensure_user_workspace() is null, 'T4 recovery without a name creates nothing');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_f'), 0, 'T4 still no membership after nameless recovery');
select pg_temp.assert_true(public.ensure_user_workspace('  Field Crew LLC  ') is not null, 'T4 recovery with a name creates the workspace');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_f'), 1, 'T4 exactly one membership after recovery');
select pg_temp.assert_true(public.ensure_user_workspace('Different Name') = (select company_id from public.company_memberships where user_id = :'uid_f'), 'T4 repeated recovery returns the same company');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_f'), 1, 'T4 repeated recovery does not duplicate memberships');
select pg_temp.assert_eq((select count(*) from public.companies c join public.company_memberships m on m.company_id = c.id where m.user_id = :'uid_f' and c.name = 'Field Crew LLC'), 1, 'T4 recovered company keeps its original trimmed name');
select pg_temp.assert_denied($q$select public.ensure_user_workspace(repeat('y', 161))$q$, 'T4 recovery rejects names over 160 characters');
select pg_temp.assert_denied($q$select public.provision_user_workspace('00000000-0000-4000-8000-00000000000a', 'x@example.test', 'x', 'x')$q$, 'T4 provisioning routine is not callable by authenticated users');

-- T5: recovery cannot be used for another account. The function takes no user id; it acts on auth.uid().
select pg_temp.act_as('authenticated', :'uid_b');
select pg_temp.assert_true(public.ensure_user_workspace('Beta Second Site') = current_setting('test.company_b')::uuid, 'T5 B recovery returns only B''s own company');
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_b'), 1, 'T5 B still has exactly one membership');
select pg_temp.act_as_admin();
select pg_temp.assert_eq(pg_temp.memberships_for(:'uid_a'), 1, 'T5 A membership unaffected by B''s recovery');
select pg_temp.act_as('authenticated', :'uid_b');

-- T6: unauthenticated callers cannot run recovery.
select pg_temp.act_as('anon', null);
select pg_temp.assert_denied($q$select public.ensure_user_workspace('Anon Co')$q$, 'T6 anon cannot execute ensure_user_workspace');
select pg_temp.act_as('authenticated', null);
select pg_temp.assert_denied($q$select public.ensure_user_workspace('No Session Co')$q$, 'T6 authenticated call without a session subject is refused');

-- T7: tenant isolation for reads and writes across companies.
select pg_temp.act_as_admin();
insert into public.projects (company_id, name) values (current_setting('test.company_b')::uuid, 'Beta Secret Project');
select set_config('test.project_beta', (select id::text from public.projects where name = 'Beta Secret Project'), false);
-- Fixture sanity: the rows the negative tests try to reach really exist (so denials are not vacuous).
select pg_temp.assert_eq((select count(*) from public.companies where id = current_setting('test.company_b')::uuid), 1, 'T7 fixture sanity: B company exists');
select pg_temp.assert_eq((select count(*) from public.projects where id = current_setting('test.project_beta')::uuid), 1, 'T7 fixture sanity: B project exists');
select pg_temp.assert_eq((select count(*) from public.company_memberships where user_id = '00000000-0000-4000-8000-00000000000b'), 1, 'T7 fixture sanity: B membership exists (hidden from A only by RLS)');
select pg_temp.act_as('authenticated', :'uid_a');
select pg_temp.assert_eq((select count(*) from public.companies where id = current_setting('test.company_b')::uuid), 0, 'T7 A cannot read B''s company');
select pg_temp.assert_eq((select count(*) from public.company_memberships where user_id = :'uid_b'), 0, 'T7 A cannot read B''s memberships');
select pg_temp.assert_eq((select count(*) from public.projects where name = 'Beta Secret Project'), 0, 'T7 A cannot read B''s projects');
select pg_temp.assert_denied($q$insert into public.projects (company_id, name) values (current_setting('test.company_b')::uuid, 'Injected')$q$, 'T7 A cannot create a project in B''s company');
update public.companies set name = 'Hacked' where id = current_setting('test.company_b')::uuid;
select pg_temp.act_as_admin();
select pg_temp.assert_eq((select count(*) from public.companies where name = 'Hacked'), 0, 'T7 B''s company name is unchanged after A''s update attempt');

-- T8: privilege escalation through provisioning tables is blocked for signed-in users.
select pg_temp.act_as('authenticated', :'uid_a');
select pg_temp.assert_denied($q$insert into public.company_memberships (company_id, user_id, role) values (current_setting('test.company_b')::uuid, '00000000-0000-4000-8000-00000000000a', 'owner')$q$, 'T8 A cannot self-join B''s company');
select pg_temp.assert_denied($q$update public.company_memberships set role = 'owner' where user_id = '00000000-0000-4000-8000-00000000000a'$q$, 'T8 A cannot change membership roles');
select pg_temp.assert_denied($q$insert into public.companies (name, slug) values ('Direct', 'direct-1')$q$, 'T8 A cannot insert companies directly');
select pg_temp.assert_denied($q$insert into public.profiles (id, email) values ('00000000-0000-4000-8000-00000000000d', 'x@example.test')$q$, 'T8 A cannot insert profiles directly');
select pg_temp.assert_denied($q$truncate public.work_tickets$q$, 'T8 A cannot TRUNCATE tables (RLS does not filter TRUNCATE)');
select pg_temp.assert_denied($q$truncate public.company_memberships$q$, 'T8 A cannot TRUNCATE membership table');

-- T9: profile self-service only.
update public.profiles set full_name = 'Hijacked' where id = :'uid_b';
select pg_temp.act_as_admin();
select pg_temp.assert_eq((select count(*) from public.profiles where full_name = 'Hijacked'), 0, 'T9 A cannot change B''s profile');
select pg_temp.act_as('authenticated', :'uid_a');
update public.profiles set full_name = 'Alice Updated' where id = :'uid_a';
select pg_temp.assert_denied($q$update public.profiles set email = 'changed@example.test' where id = '00000000-0000-4000-8000-00000000000a'$q$, 'T9 A cannot change their own profile email directly');
select pg_temp.assert_eq((select count(*) from public.profiles where id = :'uid_a' and full_name = 'Alice Updated'), 1, 'T9 A can update their own full name');

-- T10: company-scoped CRUD for a member, including the ticket RPC used by the app.
select pg_temp.act_as_admin();
insert into public.projects (company_id, name) values (current_setting('test.company_a')::uuid, 'Alpha Project');
select set_config('test.project_alpha', (select id::text from public.projects where name = 'Alpha Project'), false);
select pg_temp.act_as('authenticated', :'uid_a');
select pg_temp.assert_true(public.save_work_ticket(null, current_setting('test.project_alpha')::uuid, now(), 'Site A', 'Panel upgrade', null, 'draft', null, null, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb) is not null, 'T10 member can save a ticket on their own project');
select pg_temp.assert_eq((select count(*) from public.work_tickets t where t.description = 'Panel upgrade' and t.company_id = current_setting('test.company_a')::uuid), 1, 'T10 saved ticket belongs to the caller company');
select pg_temp.assert_denied($q$select public.save_work_ticket(null, current_setting('test.project_beta')::uuid, now(), 'x', 'Cross company', null, 'draft', null, null, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)$q$, 'T10 member cannot save a ticket onto another company project');

-- T11: private evidence storage is limited to the owning company's folder.
select pg_temp.act_as_admin();
insert into storage.objects (bucket_id, name, owner) values
  ('evidence', current_setting('test.company_a') || '/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/' || :'uid_a' || '-photo.jpg', null),
  ('evidence', current_setting('test.company_b') || '/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444/' || :'uid_b' || '-photo.jpg', null);
select pg_temp.assert_eq((select count(*) from storage.buckets where id = 'evidence' and public = false), 1, 'T11 evidence bucket exists and is private');
select pg_temp.assert_eq((select count(*) from storage.objects where bucket_id = 'evidence' and name like current_setting('test.company_b') || '/%'), 1, 'T11 fixture sanity: B evidence object exists');
select pg_temp.act_as('authenticated', :'uid_a');
select pg_temp.assert_eq((select count(*) from storage.objects where bucket_id = 'evidence'), 1, 'T11 A sees only A''s evidence object');
select pg_temp.assert_eq((select count(*) from storage.objects where bucket_id = 'evidence' and name like current_setting('test.company_b') || '/%'), 0, 'T11 A cannot see B''s evidence objects');
select pg_temp.assert_denied($q$insert into storage.objects (bucket_id, name) values ('evidence', current_setting('test.company_b') || '/55555555-5555-4555-8555-555555555555/66666666-6666-4666-8666-666666666666/00000000-0000-4000-8000-00000000000a-x.jpg')$q$, 'T11 A cannot upload into B''s company folder');

-- T11b: evidence metadata cannot point at another company's storage folder, even by direct API call.
select pg_temp.act_as('authenticated', :'uid_a');
select pg_temp.assert_denied($q$insert into public.evidence_files (company_id, project_id, uploaded_by, storage_path, original_filename, mime_type, size_bytes) values (current_setting('test.company_a')::uuid, current_setting('test.project_alpha')::uuid, '00000000-0000-4000-8000-00000000000a', current_setting('test.company_b') || '/11111111-1111-4111-8111-111111111111/project/' || '00000000-0000-4000-8000-00000000000a' || '-x.jpg', 'x.jpg', 'image/jpeg', 100)$q$, 'T11b evidence row with another company storage path is denied');

-- T12: anonymous role has no access to customer data.
select pg_temp.act_as('anon', null);
select pg_temp.assert_denied($q$select count(*) from public.companies$q$, 'T12 anon cannot read companies at all');
select pg_temp.assert_eq((select count(*) from public.work_tickets), 0, 'T12 anon sees no tickets');
select pg_temp.assert_denied($q$select count(*) from storage.objects$q$, 'T12 anon cannot read evidence object metadata');

select pg_temp.act_as_admin();
\o
select 'AmpTrail provisioning and tenant-isolation tests passed' as result;
