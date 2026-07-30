-- ================================================================
-- STANDALONE ADDENDUM — From the field quarterly updates
-- Run this file alone in the Supabase SQL editor if you have already
-- run migration_donorstudio.sql before. Fully idempotent.
-- ================================================================

create table if not exists public.org_updates (
  id bigint generated always as identity primary key,
  org_id int not null references public.orgs(id) on delete cascade,
  quarter text not null,               -- 'YYYY-Qn', e.g. '2026-Q3'
  title text not null default '',
  summary text default '',
  body text default '',                -- blog body; blank line between paragraphs
  link_url text,                       -- the org-provided public update link
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
-- Wrapped in a DO block so SQL-editor statement splitting can never cut a string.
do $seed_org_updates$
begin
  insert into public.org_updates (org_id, quarter, title, summary, body, status)
  select o.id, '2026-Q2', s.title, s.summary, s.body, 'ready'
  from (values
      (E'Fortify Health', E'Twelve new mills join the fortification network in Maharashtra', E'Quarterly expansion brings iron-fortified flour within reach of 4 million more people — independent lab checks passed at 96 percent of sites.', E'Fortify Health signed twelve chakki mills in Maharashtra this quarter, the largest single expansion of its fortification network to date. Each mill now blends iron, folic acid, and B12 premix into wheat flour at the point of grinding, which means families get fortified flour without changing anything about how they buy or cook.\n\nIndependent laboratory checks covered every active site. Ninety-six percent passed on the first sample — the remaining mills were re-calibrated and passed on the second. The team publishes the full lab results in its data room.\n\nThe expansion brings fortified flour within reach of roughly four million more people. The binding constraint is now premix logistics rather than mill recruitment, and the operations team is piloting regional premix depots to cut delivery times in half.\n\nWhat this means for funders: the cost per person-year of fortification is holding under one dollar even as the network scales, and the team can absorb additional funding without diluting quality controls.'),
      (E'Lead Exposure Elimination Project', E'Malawi adopts national lead-paint standard following LEEP pilot', E'Regulation drafted with LEEP support takes effect in January — paint sampling shows compliance rising two quarters ahead of schedule.', E'Malawi’s Bureau of Standards formally adopted a 90 ppm lead-paint limit, the standard LEEP helped draft after its 2024 market study found lead in over a third of sampled paints. The regulation takes effect in January.\n\nManufacturer engagement started before the rule was final. Two of the three largest producers have already reformulated, and market sampling shows compliant paint rising two quarters ahead of the adoption timeline.\n\nLEEP’s playbook - study the market, brief the regulator, help manufacturers switch suppliers - has now contributed to standards in more than a dozen countries. The team estimates the Malawi standard alone will protect hundreds of thousands of children from a lifetime of lead exposure.\n\nReformulation is cheap — the expensive part is knowing whom to call. That is precisely the gap this organization fills, and why its cost per child protected stays in the single dollars.'),
      (E'GiveDirectly', E'Field notes: what recipients bought in Q2, in their own words', E'New spending survey across 2,400 households — small-business investment and school fees again lead the list.', E'GiveDirectly surveyed 2,400 recipient households across three programs about how they used their transfers this quarter. As in prior rounds, the leading categories were small-business investment, school fees, and home improvements - not the consumption fears that cash programs still face.\n\nOne recurring pattern: recipients pooling portions of their transfers into informal savings groups, then rotating lump sums to members for larger purchases like roofing iron and livestock.\n\nThe survey instrument and raw anonymized data are public. Independent researchers continue to find no meaningful increase in temptation-goods spending, consistent with the broader cash-transfer literature.\n\nFor funders, the takeaway is stable: cash remains the benchmark. Programs that cannot beat handing people money should be asked why.'),
      (E'Educate Girls', E'Door-to-door census reaches its ten-millionth household', E'Community volunteers have now mapped out-of-school girls across four Indian states — re-enrollment holding at 92 percent.', E'Team Balika volunteers knocked on their ten-millionth door this quarter. The census - village by village, household by household - is how Educate Girls finds the girls no enrollment drive ever reaches: those invisible to school records because they were never enrolled at all.\n\nAcross the four states now mapped, re-enrollment of identified girls is holding at 92 percent, and the remedial learning program keeps closing foundational gaps within two academic terms.\n\nThe census data has become infrastructure in its own right — two state governments now use it for their own planning.\n\nThe organization’s development-impact-bond years taught it to price outcomes precisely, and that discipline shows in its unit economics as it scales toward its ten-year goal.'),
      (E'Shrimp Welfare Project', E'Three major producers commit to electrical stunning', E'Commitments cover an estimated 1.2 billion animals annually — implementation audits begin this fall.', E'Three of the world’s larger shrimp producers signed commitments to install electrical stunning on their harvest lines, replacing slow asphyxiation on ice. Together the commitments cover an estimated 1.2 billion animals per year.\n\nThe Shrimp Welfare Project supplies the stunners and the technical integration support — producers supply the throughput. That split is why a single hire and a shipping container of equipment can move welfare standards for entire supply chains.\n\nImplementation audits begin this fall, with results to be published openly, and two additional producers are in late-stage conversations.\n\nPer animal affected, this remains among the cheapest suffering-reduction work our team tracks - fractions of a cent per shrimp per year.'),
      (E'StrongMinds', E'Group therapy outcomes hold at six-month follow-up', E'New cohort data shows depression-free rates of 80 percent sustained — expansion into public clinics in Uganda continues.', E'StrongMinds published six-month follow-up data for its latest treatment cohorts: 80 percent of women who completed group interpersonal therapy remained depression-free, consistent with the organization’s long-running results.\n\nThe more consequential news is where therapy is happening. Groups now run inside Ugandan public health clinics with government-employed facilitators, a channel that could eventually carry the model without StrongMinds delivering it directly.\n\nTask-shifted therapy - trained lay facilitators rather than psychiatrists - is what keeps the cost per person treated low enough to matter at population scale.\n\nHousehold spillovers (children’s school attendance, partner employment) continue to show up in the data, suggesting the headline outcome understates the true impact.')
  ) as s(org_name, title, summary, body)
  join public.orgs o on o.data->>'name' = s.org_name
  where not exists (
    select 1 from public.org_updates u
    where u.org_id = o.id and u.quarter = '2026-Q2'
  );
end $seed_org_updates$;

-- Review workflow: allow date-only reviews (kind 'review0') — reviews made
-- without an open request refresh dates/history but never count in tallies.
alter table public.org_workflow_events drop constraint if exists org_workflow_events_kind_check;
alter table public.org_workflow_events add constraint org_workflow_events_kind_check
  check (kind in ('submission','request','review','review0'));

-- ================================================================
-- SITE VISITS planner — trips, DP roster, availability, checklists.
-- Staff-only. Org candidacy itself lives on the org record (siteVisit).
-- ================================================================
create table if not exists public.site_visit_items (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('trip','dp','avail','task')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.site_visit_items enable row level security;
drop policy if exists site_visit_staff on public.site_visit_items;
create policy site_visit_staff on public.site_visit_items for all
  using (public.is_staff()) with check (public.is_staff());
