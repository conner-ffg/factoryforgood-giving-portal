// Vercel serverless function: staff-only Claude auto-fill proxy.
// Env vars required: SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
// The Anthropic key lives here, server-side only — never in the browser.

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

  // 2. build the prompt from the request
  const { org, fieldSpecs } = req.body || {};
  if (!org?.name || !Array.isArray(fieldSpecs) || !fieldSpecs.length) {
    return res.status(400).json({ error: 'org and fieldSpecs required' });
  }
  const prompt = `You are filling a philanthropy database row. Organization: "${org.name}". Website: ${org.website || 'unknown'}. EIN: ${org.ein || 'unknown'}. Known: causes ${JSON.stringify(org.causes || [])}, countries ${JSON.stringify(org.countries || [])}, HQ ${org.hq || 'unknown'}, description "${org.blurb || ''}".
Provide best-guess values for ONLY these fields, from your knowledge of this real organization. Be factual; if genuinely unknown, omit the key. Respond with ONLY a JSON object, no prose:
${fieldSpecs.slice(0, 40).join('\n')}`;

  // 3. call Anthropic
  const aRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AUTOFILL_MODEL || 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!aRes.ok) {
    const t = await aRes.text();
    return res.status(502).json({ error: `Anthropic API ${aRes.status}: ${t.slice(0, 160)}` });
  }
  const data = await aRes.json();
  const txt = (data.content || []).map((c) => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return res.status(502).json({ error: 'Model returned no JSON' });
  try {
    return res.status(200).json({ values: JSON.parse(m[0]) });
  } catch {
    return res.status(502).json({ error: 'Model JSON did not parse' });
  }
}
