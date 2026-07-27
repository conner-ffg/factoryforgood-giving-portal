# Factory for Good — giving portal

A members-only giving intelligence portal: personal dashboard with an interactive
globe, a library of 200+ vetted organizations, deep-dive org briefs, and a
staff-only Data Studio for maintaining the underlying data.

**Stack:** static frontend (`index.html`, zero build step) · Supabase (Postgres,
auth, row-level security) · one Vercel serverless function (`api/autofill.js`)
for the staff Claude auto-fill.

## Access model

| Who | How they get in | What they see |
|---|---|---|
| Staff — any verified `@factoryforgood.com` email | Sign in directly (magic link) | Everything, plus Data Studio and the Demo toggle |
| Members | Must be invited (email added to the `invites` table by staff) before their first sign-in | Dashboard, library, briefs, shortlist, and their own donation log |
| Anyone else | Sign-in refused by a database trigger | Nothing |

The rules are enforced in Postgres row-level security, not just in the UI:
members can only read/write their own donations and shortlist; only staff can
touch orgs, comments, notes, and invites. Collective totals are exposed through
a pair of aggregate-only functions so members never see each other's rows.

## Go-live checklist

### 1. Database (5 minutes)
Open the Supabase dashboard → SQL editor → paste the entire contents of
`supabase/migration.sql` → Run. This creates every table, policy, trigger,
and seeds the 206 organizations. Safe to re-run.

Then paste `supabase/migration_donorstudio.sql` → Run. This adds giving
circles, the staff-only Donor Studio tables (profile fields, circle
membership, staff notes), and the `circle_stats` function. Privacy model:
members can only ever read their own donation rows; circle and collective
views are produced by security-definer functions that return pooled
aggregates only, and only to members of that circle (or staff). Staff notes
about a donor are in a staff-only table the member cannot read. Safe to re-run.

### 2. Auth configuration (5 minutes)
Supabase dashboard → Authentication:
- **URL configuration** → Site URL: your production URL (e.g. `https://portal.factoryforgood.com`). Add the Vercel preview URL (`https://<project>.vercel.app`) to the redirect allow list too.
- **Providers → Email**: leave email sign-in enabled. "Confirm email" can stay on; magic links double as confirmation.
- Before inviting real members: **Settings → SMTP** — configure a custom sender (Resend, or Google Workspace SMTP) so sign-in emails come from your domain instead of Supabase's shared sender.

### 3. Deploy (10 minutes)
- Push this repo to GitHub, then in Vercel: **Add New Project** → import the repo. Framework preset: **Other**. No build command, output directory: root.
- Project → Settings → Environment variables:
  - `SUPABASE_URL` — your project URL
  - `SUPABASE_ANON_KEY` — the anon (public) key
  - `ANTHROPIC_API_KEY` — enables the staff ✦ auto-fill (optional; the button errors politely without it)
  - `AUTOFILL_MODEL` — optional model override
- Deploy. The site is live at `<project>.vercel.app` immediately.

### 4. Domain (5 minutes + DNS propagation)
Vercel → Project → Settings → Domains → add `portal.factoryforgood.com`, then
create the CNAME record Vercel shows you at your DNS provider. Update the
Supabase Site URL (step 2) to the final domain.

### 5. First users
- Staff: just sign in with an `@factoryforgood.com` address — the domain gate
  recognizes it and grants the staff role automatically.
- Members: a staff user adds their email to `invites` (SQL editor for now:
  `insert into invites (email) values ('member@example.com');`), then the member
  signs in with a magic link.
- Set display names: `update profiles set full_name = 'Ada Lovelace' where email = '...';`

### 6. Housekeeping
- Rotate the `service_role` key in Supabase (Settings → API) — it was used
  during setup and should be re-issued. **It is not needed anywhere in this app.**
- The anon key in `index.html` is public by design; row-level security is the
  actual boundary.

## Local development

```
python3 dev/mock_supabase.py            # local stand-in API on :8787
# open dev/index.mock.html in a browser  (staff@factoryforgood.com / pw · member@example.com / pw)
NODE_PATH=$(npm root -g) node dev/test_e2e.js   # 20-check end-to-end suite
```

`index.html` is generated from source parts by the build pipeline that produced
this repo; treat it as the deployable artifact. `supabase/migration_schema.sql`
is the schema without seed data, for reference and future migrations.

## Data notes

Seeded organization figures (cost per outcome, absorbency, fundraise numbers)
are research-based estimates, not audited data. Fields marked "being gathered"
render blurred in the UI until staff replace them in Data Studio. The Demo
toggle (staff-only) loads a clearly-bannered illustrative dataset for
walkthroughs and sales conversations; nothing in it is real or persisted.
