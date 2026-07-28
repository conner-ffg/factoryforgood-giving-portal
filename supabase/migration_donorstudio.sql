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

-- ---- persistent shortlist + advisor requests ------------------
-- The shortlist table already exists (migration.sql) with owner-only
-- access; staff additionally manage any member's cart from the studio.
drop policy if exists shortlist_staff on public.shortlist;
create policy shortlist_staff on public.shortlist for all
  using (public.is_staff()) with check (public.is_staff());

-- "Send plan to my advisor" writes a notification onto the profile;
-- members create/read their own, staff see and handle all of them.
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'advisor',
  body text,
  payload jsonb,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists notif_self_read on public.notifications;
create policy notif_self_read on public.notifications for select
  using (user_id = auth.uid());
drop policy if exists notif_self_insert on public.notifications;
create policy notif_self_insert on public.notifications for insert
  with check (user_id = auth.uid());
drop policy if exists notif_staff_all on public.notifications;
create policy notif_staff_all on public.notifications for all
  using (public.is_staff()) with check (public.is_staff());

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

-- ---- org review workflow activity log --------------------------
-- Feeds the Reviews panel: who invited submissions, requested
-- reviews, and completed reviews — totaled by week and month.
create table if not exists public.org_workflow_events (
  id bigint generated always as identity primary key,
  org_id int references public.orgs(id) on delete cascade,
  kind text not null check (kind in ('submission','request','review')),
  author_name text,
  created_at timestamptz not null default now()
);
alter table public.org_workflow_events enable row level security;
drop policy if exists wf_events_staff on public.org_workflow_events;
create policy wf_events_staff on public.org_workflow_events for all
  using (public.is_staff()) with check (public.is_staff());

-- ---- comment @mentions + donor-profile comments ----------------
-- Comments can tag teammates (semicolon-separated full names) and can
-- attach to a donor profile instead of an org cell.
alter table public.org_comments alter column org_id drop not null;
alter table public.org_comments add column if not exists donor_id uuid references public.profiles(id) on delete cascade;
alter table public.org_comments add column if not exists mentions text;

-- ---- atomic single-field org updates ---------------------------
-- The Data Studio saves each edited cell as its own merge, so two
-- teammates editing different fields of the same org can never
-- overwrite each other's work with a stale full-row save.
create or replace function public.org_set_field(oid int, fkey text, fval jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  update orgs set data = jsonb_set(data, array[fkey], coalesce(fval, 'null'::jsonb), true)
  where id = oid;
end $$;
grant execute on function public.org_set_field(int, text, jsonb) to authenticated;

-- ---- seed the mock-up circles (safe if they already exist) ----
insert into public.circles (id, name, description) values
  ('simmons-family', 'Simmons Family Circle', 'Three generations of the Simmons family giving together.'),
  ('climate-founders', 'Climate Founders Circle', 'Founders pooling for climate and environment interventions.'),
  ('next-gen', 'Next Generation Circle', 'Emerging philanthropists building their first portfolios.')
on conflict (id) do nothing;

-- ================================================================
-- FROM THE FIELD — real quarterly partner updates
-- Drafted and published from the Data studio's leftmost column.
-- Members read them; only staff write. An update is live on member
-- dashboards once its quarter has started AND status = 'ready'.
-- ================================================================
create table if not exists public.org_updates (
  id bigint generated always as identity primary key,
  org_id int not null references public.orgs(id) on delete cascade,
  quarter text not null,               -- 'YYYY-Qn', e.g. '2026-Q3'
  title text not null default '',
  summary text default '',
  body text default '',                -- blog body; blank line between paragraphs
  link_url text,                       -- the org's own public update
  video_url text,
  img text,                            -- hero image override
  status text not null default 'draft' check (status in ('draft','ready')),
  created_at timestamptz not null default now()
);
alter table public.org_updates enable row level security;
drop policy if exists org_updates_read on public.org_updates;
create policy org_updates_read on public.org_updates for select
  to authenticated using (true);
drop policy if exists org_updates_staff_write on public.org_updates;
create policy org_updates_staff_write on public.org_updates for all
  using (public.is_staff()) with check (public.is_staff());

-- Seed the launch examples as real, editable Q2 2026 log entries
-- (matched by org name; skipped for any org that already has a Q2 2026 row).
insert into public.org_updates (org_id, quarter, title, summary, body, status)
select o.id, '2026-Q2', s.title, s.summary, s.body, 'ready'
from (values
  ('Fortify Health', 'Twelve new mills join the fortification network in Maharashtra', 'Quarterly expansion brings iron-fortified flour within reach of 4 million more people; independent lab checks passed at 96 percent of sites.', 'Fortify Health signed twelve chakki mills in Maharashtra this quarter, the largest single expansion of its fortification network to date. Each mill now blends iron, folic acid, and B12 premix into wheat flour at the point of grinding, which means families get fortified flour without changing anything about how they buy or cook.

Independent laboratory checks covered every active site. Ninety-six percent passed on the first sample; the remaining mills were re-calibrated and passed on the second. The team publishes the full lab results in its data room.

The expansion brings fortified flour within reach of roughly four million more people. The binding constraint is now premix logistics rather than mill recruitment, and the operations team is piloting regional premix depots to cut delivery times in half.

What this means for funders: the cost per person-year of fortification is holding under one dollar even as the network scales, and the team can absorb additional funding without diluting quality controls.'),
  ('Lead Exposure Elimination Project', 'Malawi adopts national lead-paint standard following LEEP pilot', 'Regulation drafted with LEEP support takes effect in January; paint sampling shows compliance rising two quarters ahead of schedule.', 'Malawi’s Bureau of Standards formally adopted a 90 ppm lead-paint limit, the standard LEEP helped draft after its 2024 market study found lead in over a third of sampled paints. The regulation takes effect in January.

Manufacturer engagement started before the rule was final. Two of the three largest producers have already reformulated, and market sampling shows compliant paint rising two quarters ahead of the adoption timeline.

LEEP’s playbook - study the market, brief the regulator, help manufacturers switch suppliers - has now contributed to standards in more than a dozen countries. The team estimates the Malawi standard alone will protect hundreds of thousands of children from a lifetime of lead exposure.

Reformulation is cheap; the expensive part is knowing whom to call. That is precisely the gap this organization fills, and why its cost per child protected stays in the single dollars.'),
  ('GiveDirectly', 'Field notes: what recipients bought in Q2, in their own words', 'New spending survey across 2,400 households; small-business investment and school fees again lead the list.', 'GiveDirectly surveyed 2,400 recipient households across three programs about how they used their transfers this quarter. As in prior rounds, the leading categories were small-business investment, school fees, and home improvements - not the consumption fears that cash programs still face.

One recurring pattern: recipients pooling portions of their transfers into informal savings groups, then rotating lump sums to members for larger purchases like roofing iron and livestock.

The survey instrument and raw anonymized data are public. Independent researchers continue to find no meaningful increase in temptation-goods spending, consistent with the broader cash-transfer literature.

For funders, the takeaway is stable: cash remains the benchmark. Programs that cannot beat handing people money should be asked why.'),
  ('Educate Girls', 'Door-to-door census reaches its ten-millionth household', 'Community volunteers have now mapped out-of-school girls across four Indian states; re-enrollment holding at 92 percent.', 'Team Balika volunteers knocked on their ten-millionth door this quarter. The census - village by village, household by household - is how Educate Girls finds the girls no enrollment drive ever reaches: those invisible to school records because they were never enrolled at all.

Across the four states now mapped, re-enrollment of identified girls is holding at 92 percent, and the remedial learning program keeps closing foundational gaps within two academic terms.

The census data has become infrastructure in its own right; two state governments now use it for their own planning.

The organization’s development-impact-bond years taught it to price outcomes precisely, and that discipline shows in its unit economics as it scales toward its ten-year goal.'),
  ('Shrimp Welfare Project', 'Three major producers commit to electrical stunning', 'Commitments cover an estimated 1.2 billion animals annually; implementation audits begin this fall.', 'Three of the world’s larger shrimp producers signed commitments to install electrical stunning on their harvest lines, replacing slow asphyxiation on ice. Together the commitments cover an estimated 1.2 billion animals per year.

The Shrimp Welfare Project supplies the stunners and the technical integration support; producers supply the throughput. That split is why a single hire and a shipping container of equipment can move welfare standards for entire supply chains.

Implementation audits begin this fall, with results to be published openly, and two additional producers are in late-stage conversations.

Per animal affected, this remains among the cheapest suffering-reduction work our team tracks - fractions of a cent per shrimp per year.'),
  ('StrongMinds', 'Group therapy outcomes hold at six-month follow-up', 'New cohort data shows depression-free rates of 80 percent sustained; expansion into public clinics in Uganda continues.', 'StrongMinds published six-month follow-up data for its latest treatment cohorts: 80 percent of women who completed group interpersonal therapy remained depression-free, consistent with the organization’s long-running results.

The more consequential news is where therapy is happening. Groups now run inside Ugandan public health clinics with government-employed facilitators, a channel that could eventually carry the model without StrongMinds delivering it directly.

Task-shifted therapy - trained lay facilitators rather than psychiatrists - is what keeps the cost per person treated low enough to matter at population scale.

Household spillovers (children’s school attendance, partner employment) continue to show up in the data, suggesting the headline outcome understates the true impact.')
) as s(org_name, title, summary, body)
join public.orgs o on o.data->>'name' = s.org_name
where not exists (
  select 1 from public.org_updates u
  where u.org_id = o.id and u.quarter = '2026-Q2'
);
