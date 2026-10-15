-- AmpTrail ticket workflow + customer approval.
-- Additive and non-destructive: no rows are rewritten and no existing values are removed.
--
-- 1. Adds the 'ready_to_export' and 'finalized' workflow states. The legacy states
--    ('submitted', 'approved', 'rejected', 'invoiced') stay valid so existing tickets keep working.
-- 2. Adds a SEPARATE customer approval record. Existing tickets default to 'not_requested';
--    the old internal 'approved' label is intentionally NOT converted into a customer approval.
-- 3. Locks finalized tickets (header and line items) at the database level.

alter type public.ticket_status add value if not exists 'ready_to_export' after 'ready_for_review';
alter type public.ticket_status add value if not exists 'finalized' after 'ready_to_export';

do $$
begin
  create type public.customer_approval_status as enum ('not_requested', 'pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

alter table public.work_tickets
  add column if not exists customer_approval public.customer_approval_status not null default 'not_requested',
  add column if not exists customer_approval_note text
    check (customer_approval_note is null or char_length(customer_approval_note) <= 1000),
  add column if not exists customer_approval_recorded_at timestamptz,
  add column if not exists customer_approval_recorded_by uuid references auth.users(id) on delete set null;

-- Who recorded an approval, and when, is set by the database and cannot be supplied by the client.
create or replace function public.stamp_customer_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.customer_approval is distinct from old.customer_approval
     or new.customer_approval_note is distinct from old.customer_approval_note then
    new.customer_approval_recorded_at := now();
    new.customer_approval_recorded_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists work_tickets_stamp_customer_approval on public.work_tickets;
create trigger work_tickets_stamp_customer_approval
  before update on public.work_tickets
  for each row execute function public.stamp_customer_approval();

-- Only these two columns can be written directly; the recorded_* columns are trigger-managed.
grant update (customer_approval, customer_approval_note) on public.work_tickets to authenticated;

-- Finalized tickets are locked. Reopening (changing the status away from 'finalized') and
-- recording customer approval remain possible.
create or replace function public.guard_finalized_ticket()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  parent_status public.ticket_status;
  parent_id uuid;
begin
  if tg_table_name = 'work_tickets' then
    if tg_op = 'UPDATE'
       and old.status = 'finalized'
       and new.status = 'finalized'
       and (new.project_id, new.occurred_at, new.location, new.description,
            new.out_of_scope_reason, new.gc_representative, new.notes)
           is distinct from
           (old.project_id, old.occurred_at, old.location, old.description,
            old.out_of_scope_reason, old.gc_representative, old.notes) then
      raise exception 'Finalized tickets are locked. Reopen the ticket to edit it.';
    end if;
    return coalesce(new, old);
  end if;

  if coalesce(current_setting('amptrail.allow_finalized_write', true), '') = 'on' then
    return coalesce(new, old);
  end if;

  parent_id := coalesce(new.ticket_id, old.ticket_id);
  select t.status into parent_status from public.work_tickets t where t.id = parent_id;
  if parent_status = 'finalized' then
    raise exception 'Finalized tickets are locked. Reopen the ticket to edit it.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists work_tickets_guard_finalized on public.work_tickets;
create trigger work_tickets_guard_finalized
  before update on public.work_tickets
  for each row execute function public.guard_finalized_ticket();

drop trigger if exists labor_entries_guard_finalized on public.labor_entries;
create trigger labor_entries_guard_finalized
  before insert or update or delete on public.labor_entries
  for each row execute function public.guard_finalized_ticket();

drop trigger if exists material_entries_guard_finalized on public.material_entries;
create trigger material_entries_guard_finalized
  before insert or update or delete on public.material_entries
  for each row execute function public.guard_finalized_ticket();

drop trigger if exists ticket_costs_guard_finalized on public.ticket_costs;
create trigger ticket_costs_guard_finalized
  before insert or update or delete on public.ticket_costs
  for each row execute function public.guard_finalized_ticket();

-- Same signature as the original, so existing callers are unaffected. Adds the finalized lock.
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
  current_status public.ticket_status;
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

  if p_ticket_id is not null then
    select t.status into current_status
      from public.work_tickets t
     where t.id = p_ticket_id and t.company_id = workspace_id and t.created_by = auth.uid()
       for update;
    if current_status = 'finalized' and p_status = 'finalized' then
      raise exception 'Finalized tickets are locked. Reopen the ticket to edit it.';
    end if;
  end if;
  -- Lets this function rewrite line items while the guard triggers still block every other path.
  perform set_config('amptrail.allow_finalized_write', 'on', true);

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
