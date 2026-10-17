-- AmpTrail field-submission inbox.
-- Additive and non-destructive: creates new types and tables only.
--
-- A submission is a field note (and optional photos) waiting for office review. Today every
-- submission is typed in through the web app (source = 'web'). The 'sms' and 'mms' sources are
-- reserved for a future text-message provider, which would write rows with the service role; the
-- authenticated role can never create them.
--
-- Originals are preserved: the note text, sender label, source and received time cannot be edited
-- after creation, submissions cannot be deleted (dismiss instead), and attachments cannot be
-- changed or removed. Triage (project, status, missing details, linked ticket) is the only part
-- that can change.

do $$
begin
  create type public.submission_status as enum (
    'new', 'needs_project', 'missing_details', 'ready_for_review', 'processed', 'dismissed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.submission_source as enum ('web', 'sms', 'mms');
exception when duplicate_object then null;
end $$;

create table public.field_submissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  source public.submission_source not null default 'web',
  sender_name text check (sender_name is null or char_length(sender_name) <= 120),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  received_at timestamptz not null default now(),
  project_id uuid,
  status public.submission_status not null default 'new',
  missing_details text check (missing_details is null or char_length(missing_details) <= 1000),
  ticket_id uuid references public.work_tickets(id) on delete set null,
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id),
  foreign key (project_id, company_id) references public.projects(id, company_id),
  -- State integrity, enforced by the database and not only by the interface.
  constraint submission_ready_needs_project check (status <> 'ready_for_review' or project_id is not null),
  constraint submission_flagged_needs_note check (
    status <> 'missing_details' or char_length(btrim(coalesce(missing_details, ''))) > 0
  ),
  constraint submission_processed_needs_ticket check (status <> 'processed' or ticket_id is not null)
);
create index field_submissions_company_status_idx
  on public.field_submissions(company_id, status, received_at desc);
create index field_submissions_project_idx on public.field_submissions(project_id);

create table public.submission_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submission_id uuid not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now(),
  foreign key (submission_id, company_id)
    references public.field_submissions(id, company_id) on delete cascade
);
create index submission_attachments_submission_idx
  on public.submission_attachments(submission_id, created_at);

create trigger field_submissions_set_updated_at
  before update on public.field_submissions
  for each row execute function public.set_updated_at();

-- Who triaged a submission, and when, is stamped by the database.
create or replace function public.stamp_submission_handling()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     or new.project_id is distinct from old.project_id
     or new.missing_details is distinct from old.missing_details
     or new.ticket_id is distinct from old.ticket_id then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end;
$$;

create trigger field_submissions_stamp_handling
  before update on public.field_submissions
  for each row execute function public.stamp_submission_handling();

-- A processed submission is closed; reopening it is not supported.
create or replace function public.guard_processed_submission()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.status = 'processed' and (
       new.status is distinct from old.status
       or new.project_id is distinct from old.project_id
       or new.missing_details is distinct from old.missing_details
       or new.ticket_id is distinct from old.ticket_id) then
    raise exception 'Processed submissions are closed.';
  end if;
  return new;
end;
$$;

create trigger field_submissions_guard_processed
  before update on public.field_submissions
  for each row execute function public.guard_processed_submission();

-- Photos per submission are capped so one note cannot become a dumping ground.
create or replace function public.limit_submission_attachments()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (select count(*) from public.submission_attachments a where a.submission_id = new.submission_id) >= 10 then
    raise exception 'A submission can have at most 10 photos.';
  end if;
  return new;
end;
$$;

create trigger submission_attachments_limit
  before insert on public.submission_attachments
  for each row execute function public.limit_submission_attachments();

alter table public.field_submissions enable row level security;
alter table public.submission_attachments enable row level security;

create policy "Members can read submissions" on public.field_submissions
  for select to authenticated using (public.is_company_member(company_id));

create policy "Members can log web submissions" on public.field_submissions
  for insert to authenticated with check (
    public.is_company_member(company_id)
    and submitted_by = auth.uid()
    and source = 'web'
    and status in ('new', 'needs_project')
    and ticket_id is null
  );

create policy "Members can triage submissions" on public.field_submissions
  for update to authenticated
  using (public.is_company_member(company_id))
  with check (
    public.is_company_member(company_id)
    and (ticket_id is null or exists (
      select 1 from public.work_tickets t
       where t.id = field_submissions.ticket_id and t.company_id = field_submissions.company_id
    ))
  );

create policy "Members can read attachments" on public.submission_attachments
  for select to authenticated using (public.is_company_member(company_id));

create policy "Members can attach photos to their submissions" on public.submission_attachments
  for insert to authenticated with check (
    public.is_company_member(company_id)
    and uploaded_by = auth.uid()
    and exists (
      select 1 from public.field_submissions s
       where s.id = submission_attachments.submission_id
         and s.company_id = submission_attachments.company_id
         and s.submitted_by = auth.uid()
    )
  );

-- No delete policies: submissions and attachments are permanent records.

revoke all on public.field_submissions from anon, authenticated;
revoke all on public.submission_attachments from anon, authenticated;

grant select on public.field_submissions to authenticated;
grant insert (company_id, submitted_by, source, sender_name, body, project_id, status)
  on public.field_submissions to authenticated;
-- Only triage fields are writable; the original note, sender, source and received time are not.
grant update (project_id, status, missing_details, ticket_id) on public.field_submissions to authenticated;

grant select on public.submission_attachments to authenticated;
grant insert (company_id, submission_id, uploaded_by, storage_path, original_filename, mime_type, size_bytes)
  on public.submission_attachments to authenticated;
