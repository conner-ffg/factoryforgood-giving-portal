# Factory for Good — giving portal

A members-only giving intelligence portal: personal dashboard with an
interactive globe, a library of 200+ vetted organizations, deep-dive org
briefs, and staff-only studios for data, donors, tools, and site visits.

**Stack:** static frontend (`index.html`, no build step at deploy time) ·
Supabase (Postgres, auth, row-level security) · two Vercel serverless
functions (`api/autofill.js`, `api/updatewrite.js`) proxying the Claude API ·
GitHub Actions for CI and nightly data backups.

**Read next:** `ENGINEERING.md` is the full handbook (architecture, security
model, runbooks). `supabase/README.md` covers database migrations.
`supabase/email-templates/README.md` covers the branded auth emails.

## Access model

| Who | How they get in | What they see |
|---|---|---|
| Staff — any verified `@factoryforgood.com` email | Sign in directly (password or email link) | Everything, plus the staff studios and the Demo toggle |
| Members | Invited by staff from the Donor studio; **first sign-in is by email link only**, then they choose their own password | Dashboard, library, briefs, shortlist, their own donation log, and their account page |
| Anyone else | Sign-in refused by a database trigger | Nothing |

The rules are enforced in Postgres row-level security, not just in the UI.
Members can only read/write their own donations, shortlist, and profile
(name/photo only); org data, comments, notes, workflow, history, and invites
are staff-only. Collective totals come from aggregate-only functions so
members never see each other's rows. `dev/test_rls.js` verifies this boundary
against a real project.

## Go-live checklist

### 1. Database
Supabase SQL editor — paste and run each file, in this order (all idempotent):
1. `supabase/migration.sql` — core schema, security, and org seeds
2. `supabase/storage_setup.sql` — public org-media bucket
3. `supabase/migration_donorstudio.sql` — circles + Donor studio
4. `supabase/migration_org_updates.sql` — From-the-field updates + site visits
5. `supabase/migration_hardening.sql` — change history, validation, error log
6. `supabase/migration_account.sql` — account page (avatars, profile RPC)

### 2. Auth configuration
Supabase dashboard → Authentication:
- **URL configuration** → Site URL: the production URL. Add the Vercel
  preview URL to the redirect allow-list.
- **Providers → Email**: leave email sign-in on; keep **"Confirm email" OFF**
  (member accounts are created by staff from the Donor studio; the sign-in
  link itself proves email ownership). Set minimum password length to 8;
  enable leaked-password protection (Pro).
- **Email templates**: paste the four branded templates from
  `supabase/email-templates/` (see its README for subjects).
- **SMTP** (before inviting real members): configure a custom sender so
  emails come from your domain — the default shared sender is rate-capped.

### 3. Deploy
- Push this repo to GitHub → Vercel: Add New Project → import. Framework
  preset **Other**, no build command, output directory root.
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `ANTHROPIC_API_KEY` (staff auto-fill/auto-write; optional), `AUTOFILL_MODEL`
  (optional override).
- GitHub repo secrets (Settings → Secrets → Actions): `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` — these power the nightly backup workflow,
  which dumps every table to the `backups` branch. The service key bypasses
  RLS: it lives ONLY in that secret store, never in code.
- CI runs the full e2e suite on every push — a red X means don't deploy.

### 4. Domain
Vercel → Settings → Domains → add the domain, create the CNAME it shows, and
update the Supabase Site URL to match.

### 5. First users
- Staff: sign in with an `@factoryforgood.com` address — the domain gate
  grants the staff role automatically.
- Members: staff use **Donor studio → Add profile**, which creates the
  account instantly; the member's first sign-in is via "Email me a sign-in
  link," after which they set their own password. No starter credentials
  exist anywhere.

## Local development

```
python3 dev/mock_supabase.py            # local stand-in API on :8787
# build & open dev/index.mock.html      (staff@factoryforgood.com / pw · member@example.com / pw)
NODE_PATH=$(npm root -g) node dev/test_e2e.js   # 173-check end-to-end suite
node dev/test_rls.js                    # RLS boundary tests vs a real project (see file header)
```

`index.html` is generated from source parts — treat it as the deployable
artifact and never edit it directly (see `ENGINEERING.md` §2).
`supabase/migration_schema.sql` is the schema without seed data, for
reference.

## Data notes

Seeded organization figures (cost per outcome, absorbency, fundraise numbers)
are research-based estimates, not audited data. Fields marked "being
gathered" render blurred until staff replace them in the Data studio. The
Demo toggle (staff-only) loads a clearly-bannered illustrative dataset;
nothing in it is real or persisted.
