-- ============================================================
-- Factory for Good — Donor Studio & Giving Circles migration
-- Paste into the Supabase SQL editor AFTER migration.sql.
-- Safe to re-run (idempotent).
--
-- Privacy model this file enforces:
--   · donation rows stay readable ONLY by their owner (and staff)
--   · members see their own circles, and only POOLED aggregates
--     for those circles — never another member's gift rows
--   · staff notes about donors live in a staff-only table the
--     member themself cannot read
-- ============================================================

-- ---- profile fields the Donor Studio edits -------------------
alter table public.profiles add column if not exists member_since int;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists goal numeric default 0;

-- ---- giving circles ------------------------------------------
create table if not exists public.circles (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.circle_members (
  circle_id text not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
create table if not exists public.donor_notes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  body text,
  updated_at timestamptz not null default now()
);

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.donor_notes enable row level security;

-- circles: staff manage; members can read circles they belong to
drop policy if exists circles_staff_all on public.circles;
create policy circles_staff_all on public.circles for all
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists circles_member_read on public.circles;
create policy circles_member_read on public.circles for select
  using (exists (select 1 from public.circle_members m
                 where m.circle_id = id and m.user_id = auth.uid()));

-- circle_members: staff manage; members see only their own rows
drop policy if exists circle_members_staff_all on public.circle_members;
create policy circle_members_staff_all on public.circle_members for all
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists circle_members_self_read on public.circle_members;
create policy circle_members_self_read on public.circle_members for select
  using (user_id = auth.uid());

-- donor notes: staff only — the member cannot read notes about themself
drop policy if exists donor_notes_staff on public.donor_notes;
create policy donor_notes_staff on public.donor_notes for all
  using (public.is_staff()) with check (public.is_staff());

-- staff may update member profiles from the Donor Studio
drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_staff_read on public.profiles for select
  using (public.is_staff());
drop policy if exists profiles_staff_update on public.profiles;
create policy profiles_staff_update on public.profiles for update
  using (public.is_staff()) with check (public.is_staff());

-- upsert path for donor_notes (merge-duplicates)
create unique index if not exists donor_notes_user_idx on public.donor_notes(user_id);

-- staff maintain any member's full donation history and plans on their behalf
-- (members keep full control of their own rows via donations_own; these
--  policies only ADD staff capability — they never widen member access)
drop policy if exists donations_staff_insert on public.donations;
create policy donations_staff_insert on public.donations for insert
  with check (public.is_staff());
drop policy if exists donations_staff_update on public.donations;
create policy donations_staff_update on public.donations for update
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists donations_staff_delete on public.donations;
create policy donations_staff_delete on public.donations for delete
  using (public.is_staff());

-- ---- circle aggregates ---------------------------------------
-- Security definer: returns ONLY pooled numbers, and only to staff
-- or to a member of that circle. No individual gift rows leave the db.
create or replace function public.circle_stats(cid text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  allowed boolean;
  result jsonb;
begin
  select public.is_staff()
         or exists (select 1 from circle_members m
                    where m.circle_id = cid and m.user_id = auth.uid())
    into allowed;
  if not allowed then
    raise exception 'not a member of this circle';
  end if;
  select jsonb_build_object(
    'members', (select count(*) from circle_members m where m.circle_id = cid),
    'ytd', coalesce((select sum(d.amount) from donations d
              join circle_members m on m.user_id = d.user_id and m.circle_id = cid
              where d.status = 'logged'
                and d.gift_date >= date_trunc('year', now())::date), 0),
    'planned_total', coalesce((select sum(d.amount) from donations d
              join circle_members m on m.user_id = d.user_id and m.circle_id = cid
              where d.status = 'planned'
                and d.gift_date >= date_trunc('year', now())::date), 0),
    'alloc', coalesce((select jsonb_agg(jsonb_build_object('org_id', org_id, 'total', total))
              from (select d.org_id, sum(d.amount) as total from donations d
                    join circle_members m on m.user_id = d.user_id and m.circle_id = cid
                    where d.status = 'logged' group by d.org_id) a), '[]'::jsonb),
    'years', coalesce((select jsonb_agg(jsonb_build_object('y', y, 'total', total, 'planned', planned) order by y)
              from (select extract(year from d.gift_date)::int as y,
                           sum(d.amount) filter (where d.status = 'logged') as total,
                           sum(d.amount) filter (where d.status = 'planned') as planned
                    from donations d
                    join circle_members m on m.user_id = d.user_id and m.circle_id = cid
                    group by 1) yr), '[]'::jsonb)
  ) into result;
  return result;
end $$;
grant execute on function public.circle_stats(text) to authenticated;

-- ---- seed the mock-up circles (safe if they already exist) ----
insert into public.circles (id, name, description) values
  ('simmons-family', 'Simmons Family Circle', 'Three generations of the Simmons family giving together.'),
  ('climate-founders', 'Climate Founders Circle', 'Founders pooling for climate and environment interventions.'),
  ('next-gen', 'Next Generation Circle', 'Emerging philanthropists building their first portfolios.')
on conflict (id) do nothing;
