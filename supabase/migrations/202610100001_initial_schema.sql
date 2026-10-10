-- AmpTrail initial schema. Safe to apply once to a fresh Supabase project.
-- All customer content is company-scoped; RLS is enabled on every public table.

create extension if not exists pgcrypto with schema extensions;

create type public.ticket_status as enum (
  'draft',
  'ready_for_review',
  'submitted',
  'approved',
  'rejected',
  'invoiced'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  slug text not null unique,
  ticket_counter bigint not null default 0 check (ticket_counter >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);
create index company_memberships_user_idx on public.company_memberships(user_id, created_at);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 180),
  project_number text check (project_number is null or char_length(project_number) <= 80),
  site_address text check (site_address is null or char_length(site_address) <= 500),
  general_contractor text check (general_contractor is null or char_length(general_contractor) <= 180),
  notes text check (notes is null or char_length(notes) <= 10000),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);
create index projects_company_active_idx on public.projects(company_id, is_archived, updated_at desc);

create table public.work_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  ticket_number text not null,
  occurred_at timestamptz not null default now(),
  location text check (location is null or char_length(location) <= 250),
  description text not null check (char_length(trim(description)) between 1 and 12000),
  out_of_scope_reason text check (out_of_scope_reason is null or char_length(out_of_scope_reason) <= 6000),
  status public.ticket_status not null default 'draft',
  gc_representative text check (gc_representative is null or char_length(gc_representative) <= 180),
  notes text check (notes is null or char_length(notes) <= 12000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  unique (id, company_id, project_id),
  unique (company_id, ticket_number),
  foreign key (project_id, company_id) references public.projects(id, company_id) on delete restrict
);
create index work_tickets_company_status_idx on public.work_tickets(company_id, status, updated_at desc);
create index work_tickets_project_idx on public.work_tickets(project_id, occurred_at desc);
create index work_tickets_creator_idx on public.work_tickets(created_by, updated_at desc);

-- Ticket numbers are assigned transactionally per workspace; users cannot pick a conflicting number.
create or replace function public.assign_ticket_number()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_number bigint;
begin
  if new.ticket_number is null or trim(new.ticket_number) = '' then
    update public.companies
       set ticket_counter = ticket_counter + 1,
           updated_at = now()
     where id = new.company_id
     returning ticket_counter into next_number;
    if next_number is null then
      raise exception 'Workspace not found';
    end if;
    new.ticket_number := 'AT-' || to_char(coalesce(new.occurred_at, now()), 'YY') || '-' || lpad(next_number::text, 5, '0');
  end if;
  return new;
end;
$$;
create trigger work_tickets_assign_number
before insert on public.work_tickets
for each row execute function public.assign_ticket_number();

create table public.labor_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null,
  worker_name text not null check (char_length(trim(worker_name)) between 1 and 160),
  hours numeric(9,2) not null check (hours > 0 and hours <= 10000),
  rate numeric(10,2) not null check (rate >= 0 and rate <= 1000000),
  line_total numeric(16,2) generated always as (round(hours * rate, 2)) stored,
  created_at timestamptz not null default now(),
  foreign key (ticket_id, company_id) references public.work_tickets(id, company_id) on delete cascade
);
create index labor_entries_ticket_idx on public.labor_entries(ticket_id, created_at);

create table public.material_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 240),
  quantity numeric(10,3) not null check (quantity > 0 and quantity <= 1000000),
  unit_cost numeric(10,2) not null check (unit_cost >= 0 and unit_cost <= 1000000),
  line_total numeric(16,2) generated always as (round(quantity * unit_cost, 2)) stored,
  created_at timestamptz not null default now(),
  foreign key (ticket_id, company_id) references public.work_tickets(id, company_id) on delete cascade
);
create index material_entries_ticket_idx on public.material_entries(ticket_id, created_at);

create table public.ticket_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ticket_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 240),
  quantity numeric(10,3) not null check (quantity > 0 and quantity <= 1000000),
  unit_cost numeric(10,2) not null check (unit_cost >= 0 and unit_cost <= 1000000),
  line_total numeric(16,2) generated always as (round(quantity * unit_cost, 2)) stored,
  created_at timestamptz not null default now(),
  foreign key (ticket_id, company_id) references public.work_tickets(id, company_id) on delete cascade
);
create index ticket_costs_ticket_idx on public.ticket_costs(ticket_id, created_at);

create table public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null,
  ticket_id uuid,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  caption text check (caption is null or char_length(caption) <= 240),
  notes text check (notes is null or char_length(notes) <= 3000),
  created_at timestamptz not null default now(),
  foreign key (project_id, company_id) references public.projects(id, company_id) on delete cascade,
  foreign key (ticket_id, company_id, project_id) references public.work_tickets(id, company_id, project_id) on delete cascade
);
create index evidence_company_recent_idx on public.evidence_files(company_id, created_at desc);
create index evidence_ticket_idx on public.evidence_files(ticket_id, created_at desc);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  description text not null check (char_length(description) between 1 and 500),
  created_at timestamptz not null default now()
);
create index activity_company_recent_idx on public.activity_events(company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger work_tickets_updated_at before update on public.work_tickets for each row execute function public.set_updated_at();

-- Provision a private workspace and owner membership whenever Supabase Auth creates an account.
create or replace function public.provision_amptrail_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  workspace_name text;
  workspace_slug text;
  workspace_id uuid;
begin
  workspace_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 'My company'), 160);
  workspace_slug := trim(both '-' from lower(regexp_replace(workspace_name, '[^a-zA-Z0-9]+', '-', 'g')));
  workspace_slug := coalesce(nullif(workspace_slug, ''), 'workspace') || '-' || substr(gen_random_uuid()::text, 1, 8);

  insert into public.profiles (id, full_name, email)
  values (new.id, nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 120), ''), new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.companies (name, slug)
  values (left(workspace_name, 160), workspace_slug)
  returning id into workspace_id;

  insert into public.company_memberships (company_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  return new;
end;
$$;
create trigger on_auth_user_created_amptrail
  after insert on auth.users
  for each row execute function public.provision_amptrail_user();

-- SECURITY DEFINER is intentionally limited to this membership predicate. It avoids recursive RLS checks.
create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.company_id = target_company_id and m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_company_member(uuid) from public, anon;
grant execute on function public.is_company_member(uuid) to authenticated;

-- The single-workspace starter interface chooses the user's earliest workspace. The company id is never
-- accepted from the browser; every write is still checked by RLS and composite foreign keys.
create or replace function public.save_work_ticket(
  p_ticket_id uuid,
  p_project_id uuid,
  p_occurred_at timestamptz,
  p_location text,
  p_description text,
  p_out_of_scope_reason text,
  p_status public.ticket_status,
  p_gc_representative text,
  p_notes text,
  p_labor jsonb,
  p_materials jsonb,
  p_costs jsonb
)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  workspace_id uuid;
  saved_ticket_id uuid;
  entry_count integer;
begin
  select m.company_id into workspace_id
    from public.company_memberships m
   where m.user_id = auth.uid()
   order by m.created_at asc
   limit 1;

  if workspace_id is null then
    raise exception 'Workspace membership required';
  end if;
  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.company_id = workspace_id and not p.is_archived
  ) and not (
    p_ticket_id is not null
    and exists (
      select 1
        from public.work_tickets t
        join public.projects p on p.id = t.project_id and p.company_id = t.company_id
       where t.id = p_ticket_id
         and t.company_id = workspace_id
         and t.created_by = auth.uid()
         and t.project_id = p_project_id
         and p.is_archived
    )
  ) then
    raise exception 'Choose an active project, or keep this existing ticket on its archived project';
  end if;
  if char_length(trim(p_description)) = 0 or char_length(p_description) > 12000 then
    raise exception 'Work description is required';
  end if;
  if jsonb_typeof(coalesce(p_labor, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_materials, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_costs, '[]'::jsonb)) <> 'array' then
    raise exception 'Ticket entries must be arrays';
  end if;
  entry_count := jsonb_array_length(coalesce(p_labor, '[]'::jsonb))
    + jsonb_array_length(coalesce(p_materials, '[]'::jsonb))
    + jsonb_array_length(coalesce(p_costs, '[]'::jsonb));
  if entry_count > 75 then
    raise exception 'A ticket can contain at most 75 line entries';
  end if;

  if p_ticket_id is null then
    insert into public.work_tickets (
      company_id, project_id, created_by, occurred_at, location, description,
      out_of_scope_reason, status, gc_representative, notes
    ) values (
      workspace_id, p_project_id, auth.uid(), p_occurred_at, nullif(trim(p_location), ''), trim(p_description),
      nullif(trim(p_out_of_scope_reason), ''), p_status, nullif(trim(p_gc_representative), ''), nullif(trim(p_notes), '')
    ) returning id into saved_ticket_id;
  else
    update public.work_tickets
       set project_id = p_project_id,
           occurred_at = p_occurred_at,
           location = nullif(trim(p_location), ''),
           description = trim(p_description),
           out_of_scope_reason = nullif(trim(p_out_of_scope_reason), ''),
           status = p_status,
           gc_representative = nullif(trim(p_gc_representative), ''),
           notes = nullif(trim(p_notes), '')
     where id = p_ticket_id
       and company_id = workspace_id
       and created_by = auth.uid()
    returning id into saved_ticket_id;
    if saved_ticket_id is null then
      raise exception 'Ticket not found or you do not have permission to edit it';
    end if;

    delete from public.labor_entries where ticket_id = saved_ticket_id and company_id = workspace_id;
    delete from public.material_entries where ticket_id = saved_ticket_id and company_id = workspace_id;
    delete from public.ticket_costs where ticket_id = saved_ticket_id and company_id = workspace_id;
  end if;

  insert into public.labor_entries (company_id, ticket_id, worker_name, hours, rate)
  select workspace_id, saved_ticket_id, trim(x.worker_name), x.hours, x.rate
    from jsonb_to_recordset(coalesce(p_labor, '[]'::jsonb)) as x(worker_name text, hours numeric, rate numeric);

  insert into public.material_entries (company_id, ticket_id, description, quantity, unit_cost)
  select workspace_id, saved_ticket_id, trim(x.description), x.quantity, x.unit_cost
    from jsonb_to_recordset(coalesce(p_materials, '[]'::jsonb)) as x(description text, quantity numeric, unit_cost numeric);

  insert into public.ticket_costs (company_id, ticket_id, description, quantity, unit_cost)
  select workspace_id, saved_ticket_id, trim(x.description), x.quantity, x.unit_cost
    from jsonb_to_recordset(coalesce(p_costs, '[]'::jsonb)) as x(description text, quantity numeric, unit_cost numeric);

  return saved_ticket_id;
end;
$$;
revoke all on function public.save_work_ticket(uuid, uuid, timestamptz, text, text, text, public.ticket_status, text, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_work_ticket(uuid, uuid, timestamptz, text, text, text, public.ticket_status, text, text, jsonb, jsonb, jsonb) to authenticated;

-- Enable Row Level Security on the complete application schema.
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

create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Users can update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Members can read their company" on public.companies for select to authenticated using (public.is_company_member(id));
create policy "Members can update their company name" on public.companies for update to authenticated using (public.is_company_member(id)) with check (public.is_company_member(id));

create policy "Users can read their memberships" on public.company_memberships for select to authenticated using (user_id = auth.uid());

create policy "Members can read projects" on public.projects for select to authenticated using (public.is_company_member(company_id));
create policy "Members can create projects" on public.projects for insert to authenticated with check (public.is_company_member(company_id));
create policy "Members can update projects" on public.projects for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

create policy "Members can read tickets" on public.work_tickets for select to authenticated using (public.is_company_member(company_id));
create policy "Members can create their tickets" on public.work_tickets for insert to authenticated with check (public.is_company_member(company_id) and created_by = auth.uid());
create policy "Creators can update their tickets" on public.work_tickets for update to authenticated using (public.is_company_member(company_id) and created_by = auth.uid()) with check (public.is_company_member(company_id) and created_by = auth.uid());
create policy "Creators can delete their draft tickets" on public.work_tickets for delete to authenticated using (public.is_company_member(company_id) and created_by = auth.uid() and status = 'draft');

create policy "Members can read labor entries" on public.labor_entries for select to authenticated using (public.is_company_member(company_id));
create policy "Creators can add labor to their tickets" on public.labor_entries for insert to authenticated with check (
  public.is_company_member(labor_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = labor_entries.ticket_id and t.company_id = labor_entries.company_id and t.created_by = auth.uid())
);
create policy "Creators can update labor on their tickets" on public.labor_entries for update to authenticated using (
  public.is_company_member(labor_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = labor_entries.ticket_id and t.company_id = labor_entries.company_id and t.created_by = auth.uid())
) with check (
  public.is_company_member(labor_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = labor_entries.ticket_id and t.company_id = labor_entries.company_id and t.created_by = auth.uid())
);
create policy "Creators can remove labor from their tickets" on public.labor_entries for delete to authenticated using (
  public.is_company_member(labor_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = labor_entries.ticket_id and t.company_id = labor_entries.company_id and t.created_by = auth.uid())
);

create policy "Members can read materials" on public.material_entries for select to authenticated using (public.is_company_member(company_id));
create policy "Creators can add materials to their tickets" on public.material_entries for insert to authenticated with check (
  public.is_company_member(material_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = material_entries.ticket_id and t.company_id = material_entries.company_id and t.created_by = auth.uid())
);
create policy "Creators can update materials on their tickets" on public.material_entries for update to authenticated using (
  public.is_company_member(material_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = material_entries.ticket_id and t.company_id = material_entries.company_id and t.created_by = auth.uid())
) with check (
  public.is_company_member(material_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = material_entries.ticket_id and t.company_id = material_entries.company_id and t.created_by = auth.uid())
);
create policy "Creators can remove materials from their tickets" on public.material_entries for delete to authenticated using (
  public.is_company_member(material_entries.company_id)
  and exists (select 1 from public.work_tickets t where t.id = material_entries.ticket_id and t.company_id = material_entries.company_id and t.created_by = auth.uid())
);

create policy "Members can read ticket costs" on public.ticket_costs for select to authenticated using (public.is_company_member(company_id));
create policy "Creators can add costs to their tickets" on public.ticket_costs for insert to authenticated with check (
  public.is_company_member(ticket_costs.company_id)
  and exists (select 1 from public.work_tickets t where t.id = ticket_costs.ticket_id and t.company_id = ticket_costs.company_id and t.created_by = auth.uid())
);
create policy "Creators can update costs on their tickets" on public.ticket_costs for update to authenticated using (
  public.is_company_member(ticket_costs.company_id)
  and exists (select 1 from public.work_tickets t where t.id = ticket_costs.ticket_id and t.company_id = ticket_costs.company_id and t.created_by = auth.uid())
) with check (
  public.is_company_member(ticket_costs.company_id)
  and exists (select 1 from public.work_tickets t where t.id = ticket_costs.ticket_id and t.company_id = ticket_costs.company_id and t.created_by = auth.uid())
);
create policy "Creators can remove costs from their tickets" on public.ticket_costs for delete to authenticated using (
  public.is_company_member(ticket_costs.company_id)
  and exists (select 1 from public.work_tickets t where t.id = ticket_costs.ticket_id and t.company_id = ticket_costs.company_id and t.created_by = auth.uid())
);

create policy "Members can read evidence" on public.evidence_files for select to authenticated using (public.is_company_member(company_id));
create policy "Members can add evidence to their workspace" on public.evidence_files for insert to authenticated with check (
  public.is_company_member(evidence_files.company_id)
  and evidence_files.uploaded_by = auth.uid()
  and exists (select 1 from public.projects p where p.id = evidence_files.project_id and p.company_id = evidence_files.company_id)
  and (evidence_files.ticket_id is null or exists (select 1 from public.work_tickets t where t.id = evidence_files.ticket_id and t.project_id = evidence_files.project_id and t.company_id = evidence_files.company_id))
);
create policy "Uploaders can remove their evidence" on public.evidence_files for delete to authenticated using (public.is_company_member(company_id) and uploaded_by = auth.uid());

create policy "Members can read activity" on public.activity_events for select to authenticated using (public.is_company_member(company_id));
create policy "Members can record activity" on public.activity_events for insert to authenticated with check (public.is_company_member(company_id) and actor_id = auth.uid());

-- Private evidence storage: signed URLs are short-lived; no public read policy is created.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Workspace members can view evidence objects" on storage.objects for select to authenticated using (
  case
    when bucket_id = 'evidence'
      and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_company_member(split_part(name, '/', 1)::uuid)
    else false
  end
);
create policy "Workspace members can upload evidence objects" on storage.objects for insert to authenticated with check (
  case
    when bucket_id = 'evidence'
      and cardinality(storage.foldername(name)) = 3
      and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_company_member(split_part(name, '/', 1)::uuid)
      and split_part(name, '/', 4) like auth.uid()::text || '-%'
    else false
  end
);
create policy "Uploaders can update their evidence objects" on storage.objects for update to authenticated using (
  case
    when bucket_id = 'evidence'
      and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_company_member(split_part(name, '/', 1)::uuid)
      and split_part(name, '/', 4) like auth.uid()::text || '-%'
    else false
  end
) with check (
  case
    when bucket_id = 'evidence'
      and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_company_member(split_part(name, '/', 1)::uuid)
      and split_part(name, '/', 4) like auth.uid()::text || '-%'
    else false
  end
);
create policy "Workspace members can clean up ticket evidence" on storage.objects for delete to authenticated using (
  case
    when bucket_id = 'evidence'
      and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_company_member(split_part(name, '/', 1)::uuid)
      and (
        split_part(name, '/', 4) like auth.uid()::text || '-%'
        or case
          when split_part(name, '/', 3) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then exists (
            select 1 from public.work_tickets t
            where t.id = split_part(name, '/', 3)::uuid
              and t.company_id = split_part(name, '/', 1)::uuid
              and t.created_by = auth.uid()
              and t.status = 'draft'
          )
          else false
        end
      )
    else false
  end
);

-- Restrict updates to the exact fields used by the application. In particular, clients cannot move rows
-- between workspaces or change creators, ticket numbers, counters, audit actors, or storage ownership.
revoke update on public.companies from authenticated;
grant update (name) on public.companies to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
revoke update on public.projects from authenticated;
grant update (name, project_number, site_address, general_contractor, notes, is_archived) on public.projects to authenticated;
revoke update on public.work_tickets from authenticated;
grant update (project_id, occurred_at, location, description, out_of_scope_reason, status, gc_representative, notes) on public.work_tickets to authenticated;
revoke update on public.labor_entries from authenticated;
revoke update on public.material_entries from authenticated;
revoke update on public.ticket_costs from authenticated;
revoke update on public.evidence_files from authenticated;
revoke update on public.activity_events from authenticated;

revoke insert on public.projects from authenticated;
grant insert (company_id, name, project_number, site_address, general_contractor, notes, is_archived) on public.projects to authenticated;
revoke insert on public.work_tickets from authenticated;
grant insert (company_id, project_id, created_by, occurred_at, location, description, out_of_scope_reason, status, gc_representative, notes) on public.work_tickets to authenticated;
revoke insert on public.labor_entries from authenticated;
grant insert (company_id, ticket_id, worker_name, hours, rate) on public.labor_entries to authenticated;
revoke insert on public.material_entries from authenticated;
grant insert (company_id, ticket_id, description, quantity, unit_cost) on public.material_entries to authenticated;
revoke insert on public.ticket_costs from authenticated;
grant insert (company_id, ticket_id, description, quantity, unit_cost) on public.ticket_costs to authenticated;
revoke insert on public.evidence_files from authenticated;
grant insert (company_id, project_id, ticket_id, uploaded_by, storage_path, original_filename, mime_type, size_bytes, caption, notes) on public.evidence_files to authenticated;
revoke insert on public.activity_events from authenticated;
grant insert (company_id, actor_id, event_type, entity_type, entity_id, description) on public.activity_events to authenticated;
