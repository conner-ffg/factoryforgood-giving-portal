// Vercel serverless function: staff-only Claude auto-fill proxy.
// Env vars required: SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
// The Anthropic key lives here, server-side only — never in the browser.

// Simple per-user rate limit (per warm serverless instance). Not a hard
// guarantee across instances, but caps runaway loops and casual abuse of
// the metered Claude calls without adding a datastore.
const RL = new Map();   // user email → [timestamps]
function rateLimited(who, max = 20, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const hits = (RL.get(who) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) { RL.set(who, hits); return true; }
  hits.push(now); RL.set(who, hits);
  if (RL.size > 500) RL.clear();   // bound memory on long-lived instances
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY } = process.env;
  if (!ANTHROPIC_API_KEY) return res.status(501).json({ error: 'ANTHROPIC_API_KEY is not configured in Vercel' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json({ error: 'Supabase env vars missing' });

  // 1. verify the caller's Supabase session and staff domain
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!uRes.ok) return res.status(401).json({ error: 'Session invalid' });
  const user = await uRes.json();
  if (!/@factoryforgood\.com$/i.test(user.email || '')) {
    return res.status(403).json({ error: 'Auto-fill is limited to Factory for Good staff' });
  }
  if (rateLimited(user.email)) {
    return res.status(429).json({ error: 'Rate limit: 20 auto-fills per 10 minutes — try again shortly' });
  }

  // 2. build the prompt from the request
  const { org, fieldSpecs } = req.body || {};
  if (!org?.name || !Array.isArray(fieldSpecs) || !fieldSpecs.length) {
    return res.status(400).json({ error: 'org and fieldSpecs required' });
  }
  const prompt = `You are filling a philanthropy database row for Factory for Good's diligence team. Organization: "${org.name}". Website: ${org.website || 'unknown'}. EIN: ${org.ein || 'unknown'}. Known: causes ${JSON.stringify(org.causes || [])}, countries ${JSON.stringify(org.countries || [])}, HQ ${org.hq || 'unknown'}, description "${org.blurb || ''}".

RESEARCH FIRST, then answer. Use web search to verify against primary sources before filling anything:
1. The organization's own website (mission, programs, team size, countries, annual report figures).
2. ProPublica Nonprofit Explorer (projects.propublica.org/nonprofits) for the EIN and the most recent Form 990 — total expenses and revenue are the ground truth for budget figures.
3. Charity evaluators and funders (GiveWell, The Life You Can Save, Founders Pledge, ACE, Charity Navigator) for cost-effectiveness estimates and endorsements.
Numbers should come from what you actually found. Prefer the most recent year. If sources disagree, use the filed/audited figure. If a field cannot be verified after searching, STILL provide your best-informed estimate rather than omitting it — but flag it as uncertain so the team knows to double-check.

Then respond in your FINAL message with ONLY one JSON object (no prose before or after) containing:
- a key per field from the list below (verified value, or best guess when unverifiable)
- an optional key "_sources" mapping each verified field name to the single URL that best supports it
- an optional key "_uncertain" mapping each best-guess field name to a short reason (e.g. "no recent 990; extrapolated from 2023 report")

Fields to fill:
${fieldSpecs.slice(0, 40).join('\n')}`;

  // 3. call Anthropic — web search enabled so figures are researched, not recalled
  const aRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AUTOFILL_MODEL || 'claude-opus-5',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }],
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!aRes.ok) {
    const t = await aRes.text();
    return res.status(502).json({ error: `Anthropic API ${aRes.status}: ${t.slice(0, 160)}` });
  }
  const data = await aRes.json();
  const txt = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text || '').join('\n');
  const values = extractJson(txt);
  if (!values) return res.status(502).json({ error: 'Model returned no parseable JSON' });
  const sources = values._sources && typeof values._sources === 'object' ? values._sources : {};
  const uncertain = values._uncertain && typeof values._uncertain === 'object' ? values._uncertain : {};
  delete values._sources;
  delete values._uncertain;
  return res.status(200).json({ values, sources, uncertain });
}

// Tolerant JSON extraction: take the outermost object that ends at the final
// '}' in the text (research narration may precede it).
function extractJson(txt) {
  const end = txt.lastIndexOf('}');
  if (end < 0) return null;
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    if (txt[i] === '}') depth++;
    else if (txt[i] === '{') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(txt.slice(i, end + 1)); } catch { return null; }
      }
    }
  }
  return null;
}
