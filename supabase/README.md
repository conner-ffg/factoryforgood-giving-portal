# Database migrations

All migration files are **idempotent** — safe to re-run in full.

## Quick path (what FFG does today)
Paste each file into the Supabase SQL editor and run, in this order:
1. `migration.sql` — TRUE BASELINE: core tables, RLS, triggers, org seeds
2. `storage_setup.sql` — public org-media bucket + staff-write policies
3. `migration_donorstudio.sql` — circles + Donor studio + review workflow
4. `migration_org_updates.sql` — org updates + site visits addendum
5. `migration_hardening.sql` — change history, write validation, error log
6. `migration_account.sql` — account page (avatar storage, self-service profile RPC)

Production has already run all of these. The full order matters only for a
FRESH project (e.g. staging) — skipping `migration.sql` there fails at step 3.

## CLI path (recommended once a staging project exists)
The same files live under `migrations/` with ordered names for the Supabase
CLI (`supabase db push` / `supabase migration up`): `000_init` is
`migration.sql`, then 001–004 follow the quick-path order above
(`storage_setup.sql` stays separate — storage policies are often easier from
the dashboard). Keep the two locations in sync: when a new migration lands, it is added BOTH as `migration_<name>.sql`
(for the SQL-editor path) and as `migrations/NNN_<name>.sql`.

Apply to **staging first**, click through the app, run `dev/test_rls.js`
against staging, then apply to prod. Note what you ran in a commit message.

## Rules for writing migrations
- Idempotent always: `create table if not exists`, `create or replace
  function`, `drop policy if exists` + `create policy`.
- Single-line string literals in seed blocks (the SQL editor's statement
  splitter breaks on multi-line literals).
- RLS on every new table before it holds real data; default-deny, then grant.
- Never widen a policy and a check constraint in the same untested paste.
