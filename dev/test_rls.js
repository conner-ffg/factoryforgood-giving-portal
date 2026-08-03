// RLS permission tests — run against a REAL Supabase project (staging ideally).
// The e2e suite tests app behavior against a mock; THIS file tests the actual
// database security boundary, which the mock cannot.
//
// Usage:
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_ANON=eyJ... \
//   RLS_MEMBER_EMAIL=member-test@example.com RLS_MEMBER_PW=... \
//   RLS_STAFF_EMAIL=you@factoryforgood.com  RLS_STAFF_PW=... \
//   node dev/test_rls.js
//
// Use throwaway test accounts. Never run destructive steps against prod data —
// every write this file attempts is EXPECTED to be rejected (member paths) or
// is a reversible no-op (staff sanity check re-writes an org field it read).

const URL_ = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON;
const M_E = process.env.RLS_MEMBER_EMAIL, M_P = process.env.RLS_MEMBER_PW;
const S_E = process.env.RLS_STAFF_EMAIL, S_P = process.env.RLS_STAFF_PW;
if (!URL_ || !ANON || !M_E || !M_P) {
  console.error('Set SUPABASE_URL, SUPABASE_ANON, RLS_MEMBER_EMAIL, RLS_MEMBER_PW (and optionally RLS_STAFF_*)');
  process.exit(2);
}
const ok = [], bad = [];
const check = (name, cond) => { (cond ? ok : bad).push(name); console.log((cond ? '  ✓ ' : '  ✗ ') + name); };

async function login(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }) });
  if (!r.ok) throw new Error(`login failed for ${email}: ${r.status}`);
  return (await r.json()).access_token;
}
const H = tok => ({ apikey: ANON, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' });
const rest = (tok, path, opt = {}) => fetch(`${URL_}/rest/v1/${path}`, { headers: H(tok), ...opt });

(async () => {
  console.log('— member boundary —');
  const m = await login(M_E, M_P);

  let r = await rest(m, 'orgs?select=id&limit=1');
  check('member can read orgs', r.ok);

  r = await rest(m, 'orgs?id=eq.1', { method: 'PATCH', body: JSON.stringify({ data: { hacked: true } }) });
  const patched = r.ok ? (await r.json()) : [];
  check('member cannot modify org data', !r.ok || (Array.isArray(patched) && patched.length === 0));

  r = await rest(m, 'orgs', { method: 'POST', body: JSON.stringify({ id: 99999, data: {} }) });
  check('member cannot insert orgs', !r.ok);

  r = await fetch(`${URL_}/rest/v1/rpc/org_set_field`, { method: 'POST', headers: H(m),
    body: JSON.stringify({ oid: 1, fkey: 'hacked', fval: true }) });
  check('member cannot call org_set_field', !r.ok);

  for (const t of ['org_history', 'client_errors', 'invites', 'org_workflow_events', 'site_visit_items']) {
    r = await rest(m, `${t}?select=*&limit=1`);
    const rows = r.ok ? await r.json() : null;
    check(`member cannot read ${t}`, !r.ok || (Array.isArray(rows) && rows.length === 0));
  }

  r = await rest(m, 'donations?select=user_id&limit=100');
  const dons = r.ok ? await r.json() : [];
  const meRes = await fetch(`${URL_}/auth/v1/user`, { headers: H(m) });
  const meId = (await meRes.json()).id;
  check('member sees only their own donations', dons.every(d => d.user_id === meId));

  r = await rest(m, 'profiles?select=id,role&limit=200');
  const profs = r.ok ? await r.json() : [];
  check('member cannot enumerate other member profiles', profs.every(p => p.id === meId) || profs.length <= 1);

  if (S_E && S_P) {
    console.log('— staff sanity —');
    const s = await login(S_E, S_P);
    r = await rest(s, 'orgs?select=id,data&limit=1');
    const [org] = await r.json();
    check('staff can read orgs', !!org);
    const cur = org.data.name;
    r = await fetch(`${URL_}/rest/v1/rpc/org_set_field`, { method: 'POST', headers: H(s),
      body: JSON.stringify({ oid: org.id, fkey: 'name', fval: cur }) });   // no-op rewrite
    check('staff can call org_set_field', r.ok);
    r = await rest(s, 'org_history?select=id&limit=1');
    check('staff can read org_history', r.ok);
    r = await fetch(`${URL_}/rest/v1/rpc/org_set_field`, { method: 'POST', headers: H(s),
      body: JSON.stringify({ oid: org.id, fkey: 'bad key;', fval: 1 }) });
    check('org_set_field rejects malformed keys', !r.ok);
  } else {
    console.log('(staff checks skipped — set RLS_STAFF_EMAIL / RLS_STAFF_PW to include them)');
  }

  console.log(`\nPASS ${ok.length} | FAIL ${bad.length}`, bad.length ? bad : '');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
