<script>
/* ================================================================
   FFG Tools hub — a library of interactive giving tools.
   · Pulse of the planet (global conditions atlas, embedded doc)
   · ph♥nder (native swiper over the real org library → shortlist)
   · The Generosity Gauge (embedded doc)
   · The impact approach (ten-section guide, embedded doc)
   Embedded docs are injected at build time as JSON string literals.
   ================================================================ */

const TOOL_DOCS = {
  pulse: __TOOL_ATLAS__,
  gauge: __TOOL_GAUGE__,
  approach: __TOOL_APPROACH__,
};

/* ---------- styles ---------- */
(function(){ const el=document.createElement('style'); el.textContent = `
.tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:16px}
.tool-card{background:var(--surface);border:1px solid var(--divider,var(--hairline));border-radius:16px;padding:22px 22px 18px;cursor:pointer;transition:border-color .25s,transform .25s,box-shadow .25s;position:relative;overflow:hidden}
.tool-card:hover{border-color:rgba(201,165,92,.55);transform:translateY(-3px);box-shadow:0 12px 32px rgba(20,20,19,.08)}
.tool-card .ti{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:21px;margin-bottom:13px}
.tool-card h4{font-family:var(--serif);font-size:18px;margin:0 0 3px}
.tool-card .tk{font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-3);margin-bottom:8px}
.tool-card p{font-size:12.5px;color:var(--ink-2);line-height:1.55;margin:0 0 14px}
.tool-card .go{font-size:12.5px;color:var(--gold-2,#9A7B3F)}
.tool-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.tool-bar select{background:var(--surface);border:1px solid var(--divider,var(--hairline));border-radius:9px;padding:8px 12px;font-size:13px;font-family:inherit;color:var(--ink);outline:none;cursor:pointer}
.tool-frame{width:100%;height:clamp(560px,calc(100vh - 230px),920px);border:1px solid var(--divider,var(--hairline));border-radius:16px;background:#fff;display:block}
/* ---- ph♥nder ---- */
.ph-wrap{display:flex;flex-direction:column;align-items:center;padding:6px 0 20px;user-select:none;position:relative}
.ph-logo{font-family:var(--serif);font-size:25px;color:var(--ink);margin-bottom:2px}
.ph-logo b{color:var(--gold-2,#C9A55C);font-weight:400}
.ph-sub{font-size:11px;color:var(--ink-3);letter-spacing:.05em;margin-bottom:14px}
.ph-stack{position:relative;width:min(380px,92vw);height:520px}
.ph-card{position:absolute;inset:0;background:#fff;border:1px solid var(--divider,var(--hairline));border-radius:20px;box-shadow:0 8px 40px rgba(20,20,19,.12);overflow:hidden;will-change:transform;touch-action:none}
.ph-card .bar{height:6px;width:100%}
.ph-head{display:flex;align-items:center;gap:12px;padding:16px 18px 8px}
.ph-head .nm{font-family:var(--serif);font-size:21px;line-height:1.15}
.ph-head .loc{font-size:11px;color:var(--ink-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.ph-ring{width:46px;height:46px;border-radius:50%;border:2.5px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:none;margin-left:auto}
.ph-ring b{font-size:15px}.ph-ring i{font-size:9px;color:var(--ink-3);font-style:normal;margin-top:-1px}
.ph-tag{margin:2px 18px 10px;padding:5px 12px;border-radius:40px;font-size:11.5px;font-weight:600;display:inline-flex;align-items:center;gap:8px;width:fit-content}
.ph-tagline{padding:0 18px;font-family:var(--serif);font-size:15px;line-height:1.45;margin-bottom:8px}
.ph-desc{padding:0 18px;font-size:12.5px;color:var(--ink-2);line-height:1.6;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ph-stats{display:flex;border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline);margin-bottom:11px}
.ph-stat{flex:1;text-align:center;padding:10px 6px;border-right:1px solid var(--hairline)}
.ph-stat:last-child{border-right:none}
.ph-stat b{font-size:13.5px;display:block}
.ph-stat span{font-size:9px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;line-height:1.3;display:block;margin-top:2px}
.ph-src{padding:0 18px;font-size:11.5px;color:var(--ink-3)}
.ph-src b{font-weight:600}
.ph-stamp{position:absolute;top:26px;padding:6px 14px;border-radius:8px;font-size:21px;font-weight:800;letter-spacing:.09em;border:3px solid;pointer-events:none;z-index:5;background:#fff9}
.ph-stamp.yes{left:16px;transform:rotate(-12deg);color:#2E7D5B;border-color:#2E7D5B}
.ph-stamp.no{right:16px;transform:rotate(12deg);color:#B4574E;border-color:#B4574E}
.ph-actions{display:flex;align-items:center;gap:26px;margin-top:18px}
.ph-btn{width:58px;height:58px;border-radius:50%;border:none;font-size:23px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(20,20,19,.14);transition:transform .15s}
.ph-btn:hover{transform:scale(1.08)}
.ph-btn.pass{background:#fff;color:#B4574E;border:2px solid #F0DBD8}
.ph-btn.fund{background:#2E7D5B;color:#fff}
.ph-left{font-size:11px;color:var(--ink-3);letter-spacing:.05em}
.ph-hint{margin-top:10px;font-size:11px;color:var(--ink-3);opacity:.7}
.ph-match{position:absolute;inset:0;background:rgba(20,20,19,.55);z-index:20;display:flex;align-items:center;justify-content:center;border-radius:20px;backdrop-filter:blur(3px)}
.ph-match .box{background:#fff;border-radius:20px;padding:30px 42px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.ph-match .t{font-family:var(--serif);font-size:24px;color:var(--gold-2,#9A7B3F);margin-top:6px}
.ph-match .o{font-family:var(--serif);font-size:17px;margin-top:3px}
.ph-match .s{font-size:11.5px;color:var(--ink-3);margin-top:6px}
.ph-end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:0 30px}
`; document.head.appendChild(el); })();

/* ---------- registry ---------- */
const FFG_TOOLS = [
  { id:'pulse', name:'Pulse of the planet', kicker:'Global conditions atlas', icon:'🌍', tint:'#BFD8E8',
    desc:'A live scan of human conditions across ~180 countries — income, safety, wellbeing, lifespan, food, water, education — with a pulse that surfaces where suffering runs deepest.' },
  { id:'phinder', name:'ph♥nder', kicker:'Swipe the org library', icon:'♥', tint:'#E8C9B0',
    desc:'Meet the organizations in the Factory for Good library one card at a time. Swipe right to add one to your shortlist, left to pass. Surprisingly clarifying.' },
  { id:'gauge', name:'The Generosity Gauge', kicker:'Giving calibration', icon:'📟', tint:'#D9D2E9',
    desc:'Where do you actually land on the spectrum of human generosity? Enter your income or net worth and your giving — get a calibrated (and lightly judgmental) rating.' },
  { id:'approach', name:'The impact approach', kicker:'Ten-section guide', icon:'🧭', tint:'#CFE3D3',
    desc:'The full Factory for Good philosophy — what impact is, cause areas, how we evaluate organizations, how do-gooding goes wrong, and the world we\'re working toward.' },
];

/* ---------- nav + view ---------- */
(function(){
  const nav = $('#mainNav');
  if (nav && !nav.querySelector('[data-route="#/tools"]')){
    const briefs = [...nav.querySelectorAll('button')].find(b=>/brief/i.test(b.textContent));
    const btn = document.createElement('button');
    btn.dataset.route = '#/tools'; btn.textContent = 'Tools';
    briefs ? briefs.after(btn) : nav.appendChild(btn);
  }
  if (!$('#view-tools')){
    $('#view-editor').insertAdjacentHTML('beforebegin', `<section class="view" id="view-tools">
      <div class="card fade-up in" style="margin-top:18px">
        <div class="tool-bar">
          <div style="flex:1;min-width:220px">
            <div class="kicker">Tools</div>
            <h3 id="toolTitle" style="margin:0">Giving tools</h3>
            <div class="muted" id="toolSub" style="font-size:12px;margin-top:3px">Interactive ways to explore the problems, the organizations, and your own giving.</div>
          </div>
          <button class="btn" id="toolBack" style="display:none">← All tools</button>
          <select id="toolSelect">
            <option value="">Browse the library…</option>
            ${FFG_TOOLS.map(t=>`<option value="${t.id}">${t.name} — ${t.kicker}</option>`).join('')}
          </select>
        </div>
        <div id="toolHost"></div>
      </div></section>`);
    $('#toolSelect').addEventListener('change', e=>{ if (e.target.value) go('#/tools/'+e.target.value); });
    $('#toolBack').addEventListener('click', ()=>go('#/tools'));
  }
})();

function toolsRoute(){
  if (!location.hash.startsWith('#/tools')) return false;
  // FFG team only — members are routed back to their dashboard
  if (window.APP && APP.ready && !APP.staff){ go('#/dashboard'); return true; }
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-tools').classList.add('active');
  $$('#mainNav button').forEach(b=>b.classList.toggle('active', b.dataset.route==='#/tools'));
  const id = (location.hash.split('/')[2]||'').split('?')[0];
  renderTools(id || null);
  window.scrollTo({top:0});
  return true;
}
window.addEventListener('hashchange', toolsRoute);
setTimeout(()=>{ if (location.hash.startsWith('#/tools')) toolsRoute(); }, 0);

window.renderTools = function(toolId){
  const host = $('#toolHost');
  const tool = FFG_TOOLS.find(t=>t.id===toolId);
  $('#toolSelect').value = tool ? tool.id : '';
  $('#toolBack').style.display = tool ? '' : 'none';
  if (!tool){
    $('#toolTitle').textContent = 'Giving tools';
    $('#toolSub').textContent = 'Interactive ways to explore the problems, the organizations, and your own giving.';
    host.innerHTML = `<div class="tool-grid">${FFG_TOOLS.map(t=>`
      <div class="tool-card" onclick="go('#/tools/${t.id}')">
        <div class="ti" style="background:${t.tint}55;border:1px solid ${t.tint}">${t.icon}</div>
        <div class="tk">${t.kicker}</div>
        <h4>${t.name}</h4>
        <p>${t.desc}</p>
        <span class="go">Open the tool →</span>
      </div>`).join('')}</div>`;
    return;
  }
  $('#toolTitle').textContent = tool.name;
  $('#toolSub').textContent = tool.kicker;
  if (tool.id === 'phinder'){ mountPhinder(host); return; }
  const doc = TOOL_DOCS[tool.id];
  host.innerHTML = '';
  const fr = document.createElement('iframe');
  fr.className = 'tool-frame';
  fr.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups');
  fr.srcdoc = doc;
  host.appendChild(fr);
  host.insertAdjacentHTML('beforeend', `<div class="muted" style="font-size:11px;margin-top:8px">${
    tool.id==='pulse' ? 'Live map data loads from public sources — it may take a moment on first open.'
    : tool.id==='approach' ? 'A ten-section read. Use the pills along the top of the guide to move between sections.'
    : 'Numbers stay on your screen — nothing you type here is saved or sent anywhere.'}</div>`);
};

/* ---------- ph♥nder: native swiper over the real library ---------- */
function phMatchScore(o){
  const jitter = Math.abs(Math.round(Math.sin(o.id*127.1)*8));
  return Math.min(99, 78 + (o.tier==='top'?14:6) + jitter - 4);
}
function phDeck(){
  return ORGS.filter(o=>showcased(o) && (o.tier==='top'||o.tier==='recommended') && !inShortlist(o.id))
    .sort((a,b)=>((a.id*2654435761)%977)-((b.id*2654435761)%977));
}
window.mountPhinder = function(host){
  let deck = phDeck(), idx = 0, drag = null;
  host.innerHTML = `<div class="ph-wrap">
      <div class="ph-logo">ph<b>♥</b>nder</div>
      <div class="ph-sub">swipe right to shortlist · left to pass · ${deck.length} organizations</div>
      <div class="ph-stack" id="phStack"></div>
      <div class="ph-actions" id="phActions">
        <button class="ph-btn pass" id="phNo" title="Pass">✕</button>
        <span class="ph-left" id="phLeft"></span>
        <button class="ph-btn fund" id="phYes" title="Add to shortlist">♥</button>
      </div>
      <div class="ph-hint">drag the card, use the buttons, or arrow keys ← →</div>
    </div>`;
  const stack = host.querySelector('#phStack');

  function cardHTML(o, preview){
    const c = CAUSE_COLOR[o.causes[0]] || '#888';
    const m = phMatchScore(o);
    const cost = o.costPerOutcome>0 ? fmtCost(o.costPerOutcome) : '—';
    const reach = o.annualReach>0 ? fmtNum(o.annualReach) : '—';
    return `<div class="ph-card" data-id="${o.id}" style="${preview?'transform:scale(.94) translateY(14px);opacity:.55;pointer-events:none;':''}z-index:${preview?1:2}">
      <div class="bar" style="background:${c}"></div>
      <div class="ph-stamp yes" style="opacity:0">SHORTLIST</div>
      <div class="ph-stamp no" style="opacity:0">PASS</div>
      <div class="ph-head">
        ${typeof orgLogo==='function'?orgLogo(o,42):''}
        <div style="min-width:0"><div class="nm">${esc(o.name)}</div>
        <div class="loc">${esc(o.countries.slice(0,3).join(' · ')||o.hq||'')}</div></div>
        <div class="ph-ring" style="border-color:${c}"><b style="color:${c}">${m}</b><i>%</i></div>
      </div>
      <div class="ph-tag" style="background:${c}22;color:${c}">${esc(o.causes[0])}${(o.sources&&o.sources.length)?` <span style="font-size:9.5px;border:1px solid ${c};border-radius:4px;padding:1px 5px">${esc(String(o.sources[0]).split('/')[0].trim())} ✓</span>`:''}</div>
      <div class="ph-tagline">${esc(o.tagline||o.blurb||'')}</div>
      <div class="ph-desc">${esc(o.theoryOfChange||o.blurb||'')}</div>
      <div class="ph-stats">
        <div class="ph-stat"><b>${cost}</b><span>per outcome</span></div>
        <div class="ph-stat"><b>${reach}</b><span>annual reach</span></div>
        <div class="ph-stat"><b>${o.teamSize||'—'}</b><span>team</span></div>
      </div>
      <div class="ph-src"><span style="color:var(--ink-3)">Tier:</span> <b>${o.tier==='top'?'Top pick':'Recommended'}</b> · <span style="color:${c};cursor:pointer" onclick="go('#/org/${o.id}')">read the full brief →</span></div>
    </div>`;
  }

  function paint(){
    const o = deck[idx];
    host.querySelector('#phLeft').textContent = o ? (deck.length-idx)+' left' : '';
    host.querySelector('#phActions').style.display = o ? '' : 'none';
    if (!o){
      const added = host.dataset.added|0;
      stack.innerHTML = `<div class="ph-card"><div class="ph-end">
        <div style="font-size:52px">🌍</div>
        <div style="font-family:var(--serif);font-size:23px">You've seen every org</div>
        <div style="font-size:13px;color:var(--ink-3)">${added>0?`You shortlisted ${added} organization${added>1?'s':''} — they're saved to your account.`:'Nothing shortlisted this round — the library is always open.'}</div>
        ${added>0?`<button class="btn primary" onclick="renderCart();document.querySelector('#cartDrawer').classList.add('show');document.querySelector('#drawerVeil').classList.add('show')">Open my shortlist</button>`:''}
        <button class="btn" onclick="renderTools('phinder')">Start over</button>
      </div></div>`;
      return;
    }
    stack.innerHTML = (deck[idx+1] ? cardHTML(deck[idx+1], true) : '') + cardHTML(o, false);
    wireDrag(stack.querySelector('.ph-card[data-id="'+o.id+'"]'), o);
  }

  function fly(el, dir, cb){
    el.style.transition = 'transform .35s cubic-bezier(.17,.67,.35,1.2), opacity .35s';
    el.style.transform = `translateX(${dir*440}px) rotate(${dir*16}deg)`;
    el.style.opacity = '0';
    setTimeout(cb, 330);
  }
  function act(yes){
    const o = deck[idx]; if (!o) return;
    const el = stack.querySelector('.ph-card[data-id="'+o.id+'"]'); if (!el) return;
    if (yes){
      if (!inShortlist(o.id)) toggleShortlist(o.id);
      host.dataset.added = (host.dataset.added|0)+1;
      const c = CAUSE_COLOR[o.causes[0]]||'#888';
      stack.insertAdjacentHTML('beforeend', `<div class="ph-match" id="phM"><div class="box">
        <div style="font-size:40px">♥</div><div class="t">It's a match!</div>
        <div class="o">${esc(o.name)}</div><div class="s">Saved to your shortlist</div></div></div>`);
      setTimeout(()=>{ $('#phM')?.remove(); }, 1400);
    }
    fly(el, yes?1:-1, ()=>{ idx++; paint(); });
  }

  function wireDrag(el, o){
    let sx=0, sy=0, dx=0, dy=0, down=false;
    const yesStamp = el.querySelector('.ph-stamp.yes'), noStamp = el.querySelector('.ph-stamp.no');
    el.addEventListener('pointerdown', e=>{
      if (e.target.closest('[onclick]')) return;
      down = true; sx = e.clientX; sy = e.clientY; el.setPointerCapture(e.pointerId);
      el.style.transition = 'none'; el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', e=>{
      if (!down) return;
      dx = e.clientX-sx; dy = e.clientY-sy;
      el.style.transform = `translateX(${dx}px) translateY(${dy*0.3}px) rotate(${dx*0.06}deg)`;
      yesStamp.style.opacity = Math.min(Math.max(dx/80,0),1);
      noStamp.style.opacity = Math.min(Math.max(-dx/80,0),1);
    });
    const up = ()=>{
      if (!down) return; down = false; el.style.cursor = '';
      if (dx > 80) act(true);
      else if (dx < -80) act(false);
      else { el.style.transition = 'transform .3s cubic-bezier(.17,.67,.35,1.2)'; el.style.transform = ''; yesStamp.style.opacity = 0; noStamp.style.opacity = 0; }
      dx = 0; dy = 0;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  host.querySelector('#phYes').addEventListener('click', ()=>act(true));
  host.querySelector('#phNo').addEventListener('click', ()=>act(false));
  window._phAct = act;   // keep the key handler pointed at the live deck
  if (!window._phKeys){
    window._phKeys = true;
    document.addEventListener('keydown', e=>{
      if (!location.hash.startsWith('#/tools/phinder') || !window._phAct) return;
      if (e.key==='ArrowRight') _phAct(true);
      if (e.key==='ArrowLeft') _phAct(false);
    });
  }
  paint();
};
</script>
