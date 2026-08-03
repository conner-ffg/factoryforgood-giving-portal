# Database migrations

All migration files are **idempotent** — safe to re-run in full.

## Quick path (what FFG does today)
Paste each file into the Supabase SQL editor and run, in this order:
1. `migration_donorstudio.sql` — baseline schema (tables, RLS, RPCs, seeds)
2. `migration_org_updates.sql` — org updates + site visits addendum
3. `migration_hardening.sql` — change history, write validation, error log
4. `migration_account.sql` — account page (avatar storage, self-service profile RPC)

## CLI path (recommended once a staging project exists)
The same files live under `migrations/` with ordered names for the Supabase
CLI (`supabase db push` / `supabase migration up`). Keep the two locations in
sync: when a new migration lands, it is added BOTH as `migration_<name>.sql`
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
