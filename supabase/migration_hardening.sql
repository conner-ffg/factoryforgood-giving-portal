-- ================================================================
-- HARDENING MIGRATION — run once in the Supabase SQL editor.
-- Safe to re-run. Adds:
--   1. Full change history for org data (who / what / when + recovery)
--   2. updated_at stamps on orgs
--   3. Input validation inside the org_set_field write path
--   4. client_errors table (error monitoring without a new vendor)
-- ================================================================

-- ---- 1+2. org change history -----------------------------------
alter table public.orgs add column if not exists updated_at timestamptz not null default now();

create table if not exists public.org_history (
  id bigint generated always as identity primary key,
  org_id int not null,
  old_data jsonb,
  changed_by uuid,
  changed_by_email text,
  op text not null check (op in ('update','delete')),
  changed_at timestamptz not null default now()
);
create index if not exists org_history_org_idx on public.org_history (org_id, changed_at desc);
alter table public.org_history enable row level security;
drop policy if exists org_history_staff_read on public.org_history;
create policy org_history_staff_read on public.org_history for select
  using (public.is_staff());
-- No insert/update/delete policies on purpose: only the trigger below (which
-- runs as definer) can write history. Clients cannot forge or erase it.

create or replace function public.orgs_capture_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.data is distinct from old.data then
      insert into org_history (org_id, old_data, changed_by, changed_by_email, op)
      values (old.id, old.data, auth.uid(), coalesce(auth.jwt()->>'email',''), 'update');
    end if;
    new.updated_at = now();
    return new;
  elsif tg_op = 'DELETE' then
    insert into org_history (org_id, old_data, changed_by, changed_by_email, op)
    values (old.id, old.data, auth.uid(), coalesce(auth.jwt()->>'email',''), 'delete');
    return old;
  end if;
  return new;
end $$;

drop trigger if exists orgs_history_trg on public.orgs;
create trigger orgs_history_trg before update or delete on public.orgs
  for each row execute function public.orgs_capture_history();

-- Recovering a field: find the last-good blob in org_history for that org_id
-- and copy the field back, e.g.
--   select old_data->'whyWeLike', changed_at, changed_by_email
--   from org_history where org_id = 42 order by changed_at desc limit 20;

-- ---- 3. validated write path -----------------------------------
create or replace function public.org_set_field(oid int, fkey text, fval jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  -- field keys are plain identifiers; anything else is a bug or an attack
  if fkey is null or fkey !~ '^[a-zA-Z_][a-zA-Z0-9_]{0,63}$' then
    raise exception 'invalid field key';
  end if;
  -- a single field never legitimately approaches this size
  if fval is not null and pg_column_size(fval) > 262144 then
    raise exception 'value too large';
  end if;
  update orgs set data = jsonb_set(data, array[fkey], coalesce(fval, 'null'::jsonb), true)
  where id = oid;
end $$;
grant execute on function public.org_set_field(int, text, jsonb) to authenticated;

-- ---- 4. client error log ---------------------------------------
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  page text check (char_length(page) <= 300),
  message text check (char_length(message) <= 2000),
  stack text check (char_length(stack) <= 6000),
  ua text check (char_length(ua) <= 400)
);
alter table public.client_errors enable row level security;
drop policy if exists client_errors_insert on public.client_errors;
create policy client_errors_insert on public.client_errors for insert to authenticated
  with check (auth.uid() is not null);
drop policy if exists client_errors_staff_read on public.client_errors;
create policy client_errors_staff_read on public.client_errors for select
  using (public.is_staff());
-- housekeeping (run occasionally, or wire to pg_cron if enabled):
--   delete from client_errors where at < now() - interval '90 days';
