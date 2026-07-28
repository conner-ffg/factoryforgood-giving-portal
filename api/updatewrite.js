// Vercel serverless function: staff-only "From the field" auto-writer.
// Takes a link and/or an attached document, researches it, and drafts the
// update's title, summary, and mini-blog body. Env vars: SUPABASE_URL,
// SUPABASE_ANON_KEY, ANTHROPIC_API_KEY (server-side only — never in the browser).

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
    return res.status(403).json({ error: 'Auto-write is limited to Factory for Good staff' });
  }

  // 2. assemble the request
  const { org, quarter, url, doc, text } = req.body || {};
  if (!org?.name || !(url || (doc && doc.data) || text)) {
    return res.status(400).json({ error: 'org plus a link, attachment, or pasted text required' });
  }

  const prompt = `You are writing a "From the field" partner update for Factory for Good's members-only giving portal. Organization: "${org.name}"${org.website ? ` (website: ${org.website})` : ''}. This update is for ${quarter || 'the current quarter'}.

SOURCE MATERIAL — ground every fact in it, do not invent numbers or events:
${url ? `- This link: ${url} — fetch and read it fully. If it is a landing page, follow it to the actual update/report.` : ''}${doc && doc.data ? `
- The attached document.` : ''}${text ? `
- The pasted text below:
---
${String(text).slice(0, 30000)}
---` : ''}
${url ? 'You may also use web search sparingly to clarify context from the organization\'s own site, but the linked/attached material is the story.' : ''}

Write it as warm, concrete, evidence-first storytelling for thoughtful donors: what happened this quarter, told plainly, with the real numbers from the source. No hype, no jargon, no exclamation marks. 3–5 paragraphs. The final paragraph should say what this means for funders.

Respond in your FINAL message with ONLY one JSON object (no prose before or after):
{"title": "headline, ≤80 characters, specific not generic",
 "summary": "1–2 sentences for the dashboard card, ≤220 characters",
 "body": ["paragraph 1", "paragraph 2", "..."]}`;

  const content = [];
  if (doc && doc.data && /^application\/pdf$/.test(doc.media_type || '')) {
    content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: doc.data } });
  }
  content.push({ type: 'text', text: prompt });

  // 3. call Anthropic — web fetch + search so the link is actually read, not recalled.
  //    Older API deployments without the web-fetch tool get a search-only retry.
  const call = (tools, beta) => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      ...(beta ? { 'anthropic-beta': beta } : {}),
    },
    body: JSON.stringify({
      model: process.env.AUTOFILL_MODEL || 'claude-opus-5',
      max_tokens: 3000,
      tools,
      messages: [{ role: 'user', content }],
    }),
  });

  let aRes;
  if (url) {
    aRes = await call([
      { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 4 },
      { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
    ], 'web-fetch-2025-09-10');
    if (aRes.status === 400) {
      aRes = await call([{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }]);
    }
  } else {
    aRes = await call([{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }]);
  }
  if (!aRes.ok) {
    const t = await aRes.text();
    return res.status(502).json({ error: `Anthropic API ${aRes.status}: ${t.slice(0, 160)}` });
  }
  const data = await aRes.json();
  const txt = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text || '').join('\n');
  const out = extractJson(txt);
  if (!out || !out.title) return res.status(502).json({ error: 'Model returned no parseable draft' });
  return res.status(200).json({
    title: String(out.title).slice(0, 200),
    summary: String(out.summary || ''),
    body: Array.isArray(out.body) ? out.body.map(String) : [String(out.body || '')],
  });
}

// Tolerant JSON extraction: the outermost object ending at the final '}'.
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
