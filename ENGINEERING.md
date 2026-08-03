# FFG Portal — Engineering Handbook

The document a new engineer (human or AI) reads first. It explains how the
platform is built, how data flows, where the security boundaries are, how to
develop and deploy safely, and what to do when something breaks.

## 1. System overview

| Layer | What | Where |
|---|---|---|
| Frontend | One static HTML page (all markup/CSS/JS inline), plain JavaScript, no framework | `index.html`, built from `dev/part*.js` + `dev/*.html` |
| Backend | Supabase: managed PostgreSQL + PostgREST + GoTrue auth, security enforced by RLS | `supabase/*.sql` |
| Serverless | Two Vercel functions proxying the Claude API (key stays server-side) | `api/autofill.js`, `api/updatewrite.js` |
| Hosting | Vercel serves the static file + functions; headers (incl. CSP) in `vercel.json` | — |
| Tests | 150+-check Playwright browser suite vs a Python mock of Supabase; RLS tests vs real Supabase | `dev/test_e2e.js`, `dev/test_rls.js`, `dev/mock_supabase.py` |
| CI | GitHub Actions: e2e on every push; nightly data backup to the `backups` branch | `.github/workflows/` |

There is intentionally no build framework, package manager dependency tree, or
client-side router library. Everything that happens is written where it
happens. The trade: unconventional structure, in exchange for zero dependency
rot and full greppability.

## 2. Frontend architecture

`index.html` is assembled by concatenating source "parts" (each an HTML
fragment containing `<script>`/`<style>`):

- `part1_head.html` / `ffg_head.html` — head, all shared CSS
- `part2_body.html` — static page skeleton (views, nav, drawers, modals)
- `part3_core.js` — data bootstrap, helpers (`$`, `esc`, `fmt*`), hash router
- `part4_views.js` — member-facing views (library, briefs base)
- `part5_editor.js` — Data studio (field dictionary `FIELDS`, grid, comments/notes, workflows, org log, archive)
- `part6_backend.js` — Supabase client (`sb`), auth gate, session keep-alive, `PERSIST` write layer, `loadLiveData`, error reporter, role gating (`applyRole`)
- `part7a` dashboard · `part7b` globe/map · `part7c` briefs · `part7d` donor studio
- `part8_tools.js` — tools hub; `part9_visits.js` — site-visits planner

The build (`dev/build_part7.py` then the prod builder) concatenates parts and
inlines data. **Never edit `index.html` directly** — edit a part and rebuild.

Conventions that keep it safe:

- All dynamic HTML goes through `esc()`. Any new interpolation of user-entered
  text MUST be wrapped. This is the XSS discipline; CSP in `vercel.json` is
  the backstop.
- State lives in module-global objects (`ORGS`, `MEMBER`, `NETWORK`, `APP`,
  `VISITS`, `edState`). The hash router (`route()` in part3) re-renders views
  from state; there is no virtual DOM — renders rebuild `innerHTML`.
- Persistence is centralized in `PERSIST` (part6). UI code never calls the
  network directly; it mutates state, re-renders, and calls a `PERSIST` hook.

## 3. Data model and integrity

- `orgs(id, data jsonb, updated_at)` — one JSON document per organization.
  The field dictionary (names, types, categories, member-visible flags) is
  `FIELDS` in part5; the database intentionally does not duplicate it.
- Field writes go through the `org_set_field(oid, fkey, fval)` RPC, which
  checks `is_staff()`, validates the key shape, and caps value size.
- **Every change to `orgs.data` is recorded** in `org_history` (old blob,
  who, when) by a database trigger — clients cannot bypass or erase it.
  Recovery: query `org_history` for the org, copy the old value back.
- Concurrency: field-level writes are last-write-wins per field. Two staff
  editing *different* fields of the same org never conflict; the same field
  simultaneously → later save wins, earlier value is in `org_history`.
- Other tables: `org_comments`, `org_cell_notes`, `org_workflow_events`,
  `org_updates`, `site_visit_items` (kind + jsonb payload), `donations`,
  `profiles`, `invites`, `circles`/`circle_members`, `client_errors`.

## 4. Security model

The security boundary is **RLS in Postgres**, not the UI. Assume the client
is hostile; the UI hiding a button is UX, not security.

- Roles come from `profiles.role`; `public.is_staff()` gates staff-only
  policies. Staff = `@factoryforgood.com` accounts.
- Members can read showcased org data and only their own donations/profile.
  Staff-only tables (workflow, visits, history, errors, invites) are
  unreadable to members — verified by `dev/test_rls.js` (run it against
  staging after ANY policy change).
- Auth: Supabase GoTrue. First sign-in is **magic-link only**: invite
  creation seeds the account with an internal throwaway password that no one
  ever sees, the member signs in via the branded email link
  (`supabase/email-templates/`), and is required to choose their own password
  before continuing. Sessions persist in localStorage with single-flight
  token refresh (see `sb.refresh`) — users stay signed in until the refresh
  token is revoked.
- The legacy shared starter password is retired: sign-ins matching its hash
  are forced through the set-your-own-password modal.
- Claude API key: only in Vercel env (`ANTHROPIC_API_KEY`). The two `api/`
  functions verify the caller's Supabase JWT + staff domain and rate-limit
  per user.
- Headers: CSP (script-src limited; `unsafe-inline` is required by the
  single-file architecture — the exfil protection comes from `connect-src`),
  `frame-ancestors 'none'`, nosniff. In `vercel.json`.

**To-do that needs a dashboard, not code** (owner: FFG):
- Supabase → Auth → enable leaked-password protection; consider MFA for staff.
- Supabase → Database → enable Point-in-Time Recovery (paid plan setting).
- Keep all four platform logins (Supabase, Vercel, GitHub, Anthropic) in a
  shared password manager with ≥2 owners.

## 5. Environments, deploys, migrations

- **Prod**: the Supabase project + Vercel site. **Staging (recommended)**: a
  second free Supabase project; run the same migration files against it and
  point a Vercel preview env at it via the `supabase-url`/`supabase-anon`
  meta tags (see `dev/` build).
- Deploys: push to GitHub → Vercel builds automatically. Prefer git pushes
  over zip uploads: every push gets CI (the e2e suite) and a Vercel preview
  URL before it hits prod. **A red CI run means do not merge/deploy.**
- Migrations live in `supabase/` — run order for a fresh database:
  `migration.sql` (true baseline) → `storage_setup.sql` →
  `migration_donorstudio.sql` → `migration_org_updates.sql` →
  `migration_hardening.sql` → `migration_account.sql` (full list + rules in
  `supabase/README.md`). All are idempotent — safe to re-run. Apply to
  staging first, then prod, in file order. Record what you ran in the commit message.
- Backups: nightly GitHub Action dumps every table as JSON to the `backups`
  branch (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` repo secrets).
  Restore = re-insert rows from the JSON with the service key, or use
  Supabase PITR for whole-database recovery.

## 6. Developing and testing

```
# local dev loop (from repo root, or the dev sandbox)
python3 dev/mock_supabase.py &          # mock backend on 127.0.0.1:8787
# build index.mock.html via the build scripts, open it in a browser
node dev/test_e2e.js                    # full suite (needs playwright + chromium)
node dev/test_rls.js                    # against staging (env vars in file header)
```

The e2e suite is the contract: every feature lands with checks, and the suite
runs fresh-mock before every delivery. When you change behavior, change the
checks in the same commit. Mock accounts: `staff@factoryforgood.com`,
`member@example.com`, `member2@example.com` (any password).

## 7. Runbooks

**Site is down** — check Vercel status/deploys first (instant rollback:
"Redeploy" a previous good deployment), then Supabase status page. The static
page renders even if the DB is down; a blank-after-login points at Supabase.

**Bad data write** — find the previous value in `org_history`
(`select * from org_history where org_id = X order by changed_at desc`), copy
the field back via `org_set_field` or SQL.

**Bad deploy** — Vercel → Deployments → promote the previous deployment; then
`git revert` the offending commit so the tree matches what's live.

**A member reports being logged out repeatedly** — check `client_errors` for
their session, then Supabase Auth logs; the refresh logic in `sb.refresh`
never signs out on network errors, so repeated logouts mean token revocation
(password change, or Auth settings like time-boxed sessions being enabled).

**Errors in the wild** — `select * from client_errors order by at desc
limit 50;` in the SQL editor. Uncaught frontend errors self-report there
(throttled, deduped).

**Restore drill** (do once, before you need it): on staging, delete a test
org, restore it from the `backups` branch JSON, and write down how long it
took. That number is your real recovery time.

## 8. Known trade-offs and future triggers

- Whole-dataset load at sign-in: fine to low thousands of orgs; past that,
  paginate `loadLiveData`.
- Single-file frontend: consider splitting into ES modules + a bundler when
  a human engineering team takes daily ownership — not before.
- Same-field concurrent edits are last-write-wins (history makes them
  recoverable). If simultaneous editing becomes routine, add a per-field
  `updated_at` check in `org_set_field`.
- The e2e mock is not Supabase: anything RLS-related must also be covered in
  `dev/test_rls.js`.
