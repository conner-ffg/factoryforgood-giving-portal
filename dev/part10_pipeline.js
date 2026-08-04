<script>
/* ================================================================
   ORG PIPELINE — the 14-stage spearhead as a live, practice-ready
   board. Staff-only. Everything is reversible: stages move forward,
   backward, or skip (with a note); decisions can be reopened;
   checklist items un-check; tasks delete. Every change appends to
   an in-record history AND lands in org_history server-side.
   State lives in o.pipeline (jsonb) — no schema changes needed.
   ================================================================ */

(function(){ const el = document.createElement('style'); el.textContent = `
#view-pipeline .pp-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,.85fr);gap:16px;align-items:start}
.pp-box{border:1.5px solid var(--divider);border-radius:12px;padding:13px 15px;margin-bottom:14px;background:var(--surface)}
.pp-box .rv-title{font-weight:700;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid var(--hairline)}
.pp-phases{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.pp-phases .chip.on{background:var(--ink);border-color:var(--ink);color:#F7F5F1}
.pp-board{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
.pp-col{min-width:200px;flex:1;background:var(--surface-3,#F2EFE9);border:1px solid var(--hairline);border-radius:11px;padding:9px}
.pp-col > h4{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2);display:flex;justify-content:space-between;margin:0 0 8px;font-weight:700}
.pp-card{background:#fff;border:1px solid var(--hairline);border-radius:10px;padding:8px 10px;margin-bottom:7px;cursor:pointer;box-shadow:0 1px 3px rgba(20,20,19,.05)}
.pp-card:hover{border-color:var(--ink-3)}
.pp-card b{font-size:12.5px}
.pp-card .m{font-size:10px;color:var(--ink-3);margin-top:4px;display:flex;justify-content:space-between;gap:6px;align-items:center}
.pp-card .mv{display:flex;gap:3px}
.pp-card .mv span{border:1px solid var(--divider);border-radius:5px;width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;font-size:9px;cursor:pointer;background:#fff}
.pp-card .mv span:hover{background:var(--ink);color:#fff}
.pp-ini{display:inline-flex;width:16px;height:16px;border-radius:50%;background:var(--ink);color:#fff;font-size:7.5px;align-items:center;justify-content:center;font-weight:700;flex:none}
.pp-stall{color:var(--crit);font-weight:700}
.pp-steps{display:flex;align-items:center;flex-wrap:wrap;margin:3px 0 10px}
.pp-step{font-size:10px;padding:3px 9px;border:1px solid var(--divider);background:#fff;color:var(--ink-3);cursor:pointer;user-select:none}
.pp-step:first-child{border-radius:999px 0 0 999px}
.pp-step:last-child{border-radius:0 999px 999px 0}
.pp-step.done{background:#EAF2ED;border-color:#BFD8C9;color:#3E6B52}
.pp-step.now{background:var(--ink);border-color:var(--ink);color:#F7F5F1;font-weight:700}
.pp-step.skip{opacity:.45;text-decoration:line-through}
.pp-step:hover{border-color:var(--ink)}
.pp-chk{display:flex;align-items:flex-start;gap:7px;font-size:12px;padding:5px 7px;border:1px solid var(--hairline);border-radius:8px;background:#fff;margin-bottom:5px}
.pp-chk.done{opacity:.6}
.pp-chk.done .tx{text-decoration:line-through}
.pp-chk input{margin-top:2.5px;accent-color:#7FAD96}
.pp-chk .tx{flex:1}
.pp-chk select{border:1px solid var(--divider);border-radius:6px;padding:1px 4px;font:inherit;font-size:10px;background:#fff;max-width:96px}
.pp-chk .hrs{font-size:9.5px;color:var(--ink-3);white-space:nowrap}
.pp-nudge{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--hairline);border-left:3px solid var(--gold,#EFCB67);border-radius:9px;background:#fff;padding:7px 10px;margin-bottom:6px;font-size:12px;cursor:pointer}
.pp-nudge.crit{border-left-color:var(--crit)}
.pp-task{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--hairline);border-radius:9px;background:#fff;padding:6px 9px;margin-bottom:5px;font-size:12px}
.pp-task input{margin-top:3px;accent-color:#7FAD96}
.pp-hist{font-size:11px;color:var(--ink-2);padding:3px 0;border-bottom:1px dashed var(--hairline)}
.pp-lane{position:relative;flex:1;height:12px;background:var(--surface-3,#F2EFE9);border-radius:4px;overflow:hidden}
.pp-seg{position:absolute;top:0;height:100%}
.pp-load .lr{display:flex;justify-content:space-between;font-size:11px;color:var(--ink-2);margin-bottom:2px}
.pp-load .lb{height:6px;background:var(--surface-3,#F2EFE9);border-radius:99px;overflow:hidden;margin-bottom:8px}
.pp-load .lb i{display:block;height:100%;border-radius:99px}
.pp-out{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.pp-out button{border:1px solid var(--divider);border-radius:999px;background:#fff;padding:4px 13px;font-size:11.5px;cursor:pointer}
.pp-out button.go{border-color:#7FAD96;color:#3E6B52}
.pp-out button.nogo{border-color:#CB9A8B;color:#8a4a40}
.pp-out button.rev{border-color:#EFCB67;color:#8a6d1c}
.pp-out button.on{background:var(--ink);color:#F7F5F1;border-color:var(--ink)}
`; document.head.appendChild(el); })();

/* ---------- stage templates (ported from the Capacity & Concurrency model) ---------- */
const PIPE_CATS = {'Evaluation':'#6b7889','Funding Ops':'#C4A47C','Content Production':'#7FAD96','Assets & Platform':'#A99BC0','Launch':'#CB9A8B','Optional':'#b8b2a6'};
const PIPE_PHASES = [
  {key:'Evaluation', label:'Evaluation', stages:[1,2,3]},
  {key:'Funding Ops', label:'Funding ops', stages:[4,5,6]},
  {key:'Content Production', label:'Production', stages:[7,8,9]},
  {key:'Assets & Platform', label:'Assets & platform', stages:[10,11]},
  {key:'Launch', label:'Launch', stages:[12,13,14]},
];
const PIPE_STAGES = {
  1:{name:'Sourcing & Selection', cat:'Evaluation', tasks:[
    {t:'Shortlist candidates for month', h:2, pool:'Truman/Morgan → Conner'}]},
  2:{name:'Due Diligence', cat:'Evaluation', tasks:[
    {t:'Initial org screen (mission fit, red flags)', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Financial health review (990s, audits, reserves)', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Program effectiveness / evidence review', h:2, pool:'Truman/Morgan → Conner'},
    {t:'Leadership & governance check', h:2, pool:'Truman/Morgan → Conner'},
    {t:'Reference calls (funders, partners, evaluators)', h:2, pool:'Truman/Morgan → Conner'},
    {t:'501(c)(3) / equivalency determination check', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Risk / edge-case memo', h:1, pool:'Truman/Morgan → Conner'}]},
  3:{name:'Go / No-Go Decision', cat:'Evaluation', tasks:[
    {t:'Go / no-go recommendation & decision', h:1, pool:'Truman/Morgan → Conner'}]},
  4:{name:'Co-Funder Collaboration', cat:'Funding Ops', tasks:[
    {t:'Identify other funders of the org', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Co-funder outreach (Angels of Light, AIM, etc.)', h:2, pool:'Truman/Morgan → Conner'},
    {t:'Syndication logistics decision', h:1, pool:'Truman/Morgan → Conner'}]},
  5:{name:'Financial & Legal Prep', cat:'Funding Ops', tasks:[
    {t:'Collect & verify banking / wire info', h:1, pool:'Morgan/VA'},
    {t:'Grant agreement / restriction language review', h:1, pool:'Morgan'}]},
  6:{name:'Transfer & Transacting', cat:'Funding Ops', tasks:[
    {t:'Initiate transfer via UI Charitable / DAF', h:1, pool:'Morgan'},
    {t:'Confirmation & receipt documentation', h:1, pool:'Morgan/VA'}]},
  7:{name:'Pre-Production', cat:'Content Production', tasks:[
    {t:'Story outline / narrative arc draft', h:3, pool:'Conner'},
    {t:'Site-visit-specific vetting checklist', h:2, pool:'Conner/Truman'},
    {t:'Partner org coordination & logistics', h:3, lag:10, pool:'Morgan'},
    {t:'Travel booking, permits, gear prep', h:2, pool:'Morgan/VA'},
    {t:'Crew & contractor scheduling', h:3, pool:'Contractor/Morgan/Conner'},
    {t:'Data privacy check (beneficiary images/data)', h:1, pool:'Morgan'}]},
  8:{name:'Production / Site Visit', cat:'Content Production', tasks:[
    {t:'Travel to site', h:8, lag:2, pool:'Conner'},
    {t:'Interviews & presenter pieces-to-camera', h:8, pool:'Conner'},
    {t:'B-roll & drone footage', h:8, pool:'Contractor'},
    {t:'Media / likeness release forms', h:1, pool:'Conner'},
    {t:'Wrap, backup, travel home', h:8, pool:'Conner'}]},
  9:{name:'Post-Production', cat:'Content Production', tasks:[
    {t:'Ingest, organize, backup footage', h:2, pool:'Contractor'},
    {t:'Script finalized to actual footage', h:4, pool:'Conner'},
    {t:'Rough cut edit', h:16, lag:3, pool:'Contractor'},
    {t:'Internal review + revisions', h:3, lag:3, pool:'Conner/Contractor'},
    {t:'VO recording', h:2, lag:1, pool:'Conner'},
    {t:'Sound design & music', h:4, lag:1, pool:'Contractor'},
    {t:'Color grade', h:4, lag:1, pool:'Contractor'},
    {t:'Motion graphics / data overlays', h:8, lag:2, pool:'Contractor'},
    {t:'Final export & QC', h:2, pool:'Contractor'}]},
  10:{name:'Data Room & Artifacts', cat:'Assets & Platform', tasks:[
    {t:'Org profile doc', h:2, pool:'Truman/Morgan → Conner'},
    {t:'Cost-effectiveness / counterfactual summary', h:2, pool:'Truman/Morgan → Conner'},
    {t:'DD file compilation', h:2, pool:'Truman/Morgan → Conner'},
    {t:'One-pager (branded, donor-ready)', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Data room folder structure & upload', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Internal briefing doc (Hannah/Andy)', h:2, pool:'Truman/Morgan → Conner'}]},
  11:{name:'Platform Representation', cat:'Assets & Platform', tasks:[
    {t:'Platform listing setup', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Visual asset integration', h:1, pool:'Truman/Morgan → Conner'},
    {t:'Platform QA / live check', h:1, pool:'Truman/Morgan → Conner'}]},
  12:{name:'Launch', cat:'Launch', tasks:[
    {t:'Thumbnail, title, description, captions', h:2, pool:'Contractor/VA'},
    {t:'Publish + early community engagement', h:1, pool:'Andy/Morgan'},
    {t:'Donor / family notification of grant sent', h:1, pool:'Andy'}]},
  13:{name:'Donor Feedback Loop', cat:'Launch', tasks:[
    {t:'Donor family feedback loop', h:1, pool:'Andy'}]},
  14:{name:'À La Carte Add-Ons', cat:'Optional', tasks:[
    {t:'Factory Fridays newsletter', h:2, pool:'Conner/Morgan'},
    {t:'Podcast: behind-the-curtain w/ CEO/ED', h:5, pool:'Conner/Contractor'},
    {t:'Shorts / reels from footage', h:4, pool:'Contractor'},
    {t:'Photo highlight set', h:2, pool:'Contractor'},
    {t:'"Good News" monthly paper', h:4, pool:'VA/Morgan'}]},
};
const PIPE_ALL = Object.keys(PIPE_STAGES).map(Number).sort((a,b)=>a-b);
/* expected days-in-stage before the stall nudge: labor at ~4h/day + longest lag, min 7d, ×2 slack */
function pipeStageSlackDays(n){
  const st = PIPE_STAGES[n]; if (!st) return 14;
  const hours = st.tasks.reduce((s,t)=>s+(t.h||0),0);
  const lag = Math.max(0, ...st.tasks.map(t=>t.lag||0));
  return Math.max(7, Math.ceil(hours/4) + lag) * 2;
}
function pipePeople(){
  const out = teamMembers().filter(n=>n!=='FFG Team');
  ['Contractor','VA'].forEach(x=>{ if (!out.includes(x)) out.push(x); });
  return out;
}

/* ---------- state helpers (all persistence via the audited orgField path) ---------- */
let ppPhase = 'Evaluation', ppJourneyOrg = null;
const ppToday = () => new Date().toISOString().slice(0,10);
function pipeOf(o){ return o.pipeline || null; }
function pipeSave(o){
  if (window.PERSIST && PERSIST.orgField && !((window.APP||{}).demo)) PERSIST.orgField(o, 'pipeline', o.pipeline||null);
}
function pipeLog(o, entry){
  const p = o.pipeline; p.history = (p.history||[]).concat([{...entry, by:wfMe(), at:ppToday()}]).slice(-200);
}
window.pipeAdd = function(orgId){
  const o = byId(orgId); if (!o) return;
  if (o.pipeline){ flash(o.name+' is already on the pipeline'); openPipeJourney(orgId); return; }
  o.pipeline = {stage:1, status:'active', owner:wfMe(), enteredAt:{1:ppToday()}, history:[], checks:{}, tasks:[], skips:{}};
  pipeLog(o, {kind:'add', to:1, note:'added to pipeline'});
  pipeSave(o); renderPipeline();
  flash(o.name+' added to the pipeline at 1 · Sourcing');
};
window.pipeRemove = function(orgId){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  if (!confirm('Remove '+o.name+' from the pipeline?\n\nIts pipeline history stays recoverable in the audit log, and you can re-add it any time.')) return;
  o.pipeline = null; pipeSave(o);
  if (typeof closeModal==='function') closeModal();
  renderPipeline(); flash(o.name+' removed from the pipeline');
};
/* move anywhere — forward, backward, or skipping; backwards/skips ask for an optional note */
window.pipeMove = function(orgId, toStage){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  const p = o.pipeline, from = p.stage;
  toStage = +toStage;
  if (!PIPE_STAGES[toStage] || toStage===from) return;
  let note = '';
  const backward = toStage < from, jumped = Math.abs(toStage-from) > 1;
  if (backward || jumped){
    note = prompt(backward ? 'Moving backward ('+from+' → '+toStage+'). Why? (optional, recorded)' :
                             'Skipping ahead ('+from+' → '+toStage+'). Why? (optional, recorded)') || '';
    if (note===null) note='';
  }
  if (!backward && jumped){
    for (let s=from+1; s<toStage; s++) if (!p.enteredAt[s]) p.skips[s] = note || 'skipped';
  }
  if (backward){ for (let s=toStage+1; s<=from; s++) delete p.skips[s]; }
  p.stage = toStage;
  p.enteredAt[toStage] = ppToday();
  if (p.status==='go' && toStage<=3) p.status='active';   // walking back before the decision reopens it
  pipeLog(o, {kind: backward?'back':'move', from, to:toStage, note});
  pipeSave(o); renderPipeline(); if (ppJourneyOrg===orgId) openPipeJourney(orgId);
  flash(o.name+' → '+toStage+' · '+PIPE_STAGES[toStage].name);
};
window.pipeStep = function(orgId, dir){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  const i = PIPE_ALL.indexOf(o.pipeline.stage);
  const to = PIPE_ALL[i+dir];
  if (to) pipeMove(orgId, to);
};
window.pipeDecide = function(orgId, outcome){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  const p = o.pipeline;
  if (p.status===outcome){  // clicking the active outcome reverses it
    p.status = 'active'; delete p.revisitDate;
    pipeLog(o, {kind:'reopen', note:'decision cleared — back to active'});
    pipeSave(o); renderPipeline(); openPipeJourney(orgId); flash('Decision cleared — '+o.name+' is active again');
    return;
  }
  if (outcome==='revisit'){
    const d = prompt('Revisit when? (YYYY-MM-DD)', new Date(Date.now()+90*864e5).toISOString().slice(0,10));
    if (!d) return;
    p.revisitDate = d;
  } else delete p.revisitDate;
  p.status = outcome;
  if (outcome==='go' && p.stage<4){ p.stage = 4; p.enteredAt[4] = ppToday(); }
  pipeLog(o, {kind:'decision', note: outcome + (p.revisitDate?' · '+p.revisitDate:'')});
  pipeSave(o); renderPipeline(); openPipeJourney(orgId);
  flash(o.name+': '+(outcome==='go'?'GO — funding ops open':outcome==='nogo'?'No-go recorded (reversible; relationship continues)':'Revisit set for '+p.revisitDate));
};
window.pipeCheck = function(orgId, key){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  const p = o.pipeline; p.checks = {...p.checks};
  if (p.checks[key] && p.checks[key].done){ p.checks[key] = {...p.checks[key], done:false}; }
  else p.checks[key] = {...(p.checks[key]||{}), done:true, by:wfMe(), at:ppToday()};
  pipeSave(o); openPipeJourney(orgId); renderPipeline();
};
window.pipeAssignItem = function(orgId, key, who){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  o.pipeline.checks = {...o.pipeline.checks, [key]: {...(o.pipeline.checks[key]||{}), who}};
  pipeSave(o); renderPipeline();
};
window.pipeOwner = function(orgId, who){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  o.pipeline.owner = who; pipeLog(o, {kind:'owner', note:'owner → '+who});
  pipeSave(o); renderPipeline();
};
window.pipeTaskAdd = function(orgId){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  const t = ($('#ppTaskTitle')?.value||'').trim();
  if (!t){ flash('Type the task first'); return; }
  const task = {id:'pt'+Date.now().toString(36)+Math.floor(Math.random()*1e3), t,
    who: $('#ppTaskWho')?.value||wfMe(), due: $('#ppTaskDue')?.value||'', stage:o.pipeline.stage, done:false, by:wfMe(), at:ppToday()};
  o.pipeline.tasks = (o.pipeline.tasks||[]).concat([task]);
  pipeSave(o); openPipeJourney(orgId); renderPipeline(); flash('Task added'+(task.who?' for '+task.who:''));
};
window.pipeTaskToggle = function(orgId, tid){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  o.pipeline.tasks = (o.pipeline.tasks||[]).map(t=>t.id===tid?{...t, done:!t.done}:t);
  pipeSave(o); openPipeJourney(orgId); renderPipeline();
};
window.pipeTaskDel = function(orgId, tid){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  o.pipeline.tasks = (o.pipeline.tasks||[]).filter(t=>t.id!==tid);
  pipeSave(o); openPipeJourney(orgId); renderPipeline();
};

/* ---------- computed: nudges, load, stall ---------- */
function pipeOrgs(){ return ORGS.filter(o=>o.pipeline); }
function pipeDaysIn(o){
  const p = o.pipeline, d = p.enteredAt && p.enteredAt[p.stage];
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(d+'T00:00:00').getTime())/864e5));
}
function pipeStalled(o){
  const p = o.pipeline;
  return p.status==='active' && pipeDaysIn(o) > pipeStageSlackDays(p.stage);
}
function pipeChecklistState(o){
  const p = o.pipeline, st = PIPE_STAGES[p.stage];
  const total = st ? st.tasks.length : 0;
  let done = 0;
  if (st) st.tasks.forEach((t,i)=>{ if ((p.checks||{})[p.stage+':'+i]?.done) done++; });
  return {done, total};
}
function pipeNudges(){
  const out = [];
  pipeOrgs().forEach(o=>{
    const p = o.pipeline;
    if (p.status==='revisit' && p.revisitDate && p.revisitDate <= ppToday())
      out.push({crit:1, org:o, txt:'Revisit date arrived — reopen evaluation?', act:'openPipeJourney('+o.id+')'});
    if (p.status==='active' && !p.owner)
      out.push({crit:1, org:o, txt:'No owner assigned', act:'openPipeJourney('+o.id+')'});
    if (pipeStalled(o))
      out.push({crit:1, org:o, txt:'Stalled — '+pipeDaysIn(o)+'d in '+p.stage+' · '+PIPE_STAGES[p.stage].name+' (expected ≤'+pipeStageSlackDays(p.stage)+'d)', act:'openPipeJourney('+o.id+')'});
    if (p.status==='active' && p.stage===3){
      const cs = pipeChecklistState(o);
      if (cs.done>=cs.total) out.push({crit:0, org:o, txt:'Ready for go / no-go decision', act:'openPipeJourney('+o.id+')'});
    }
    (p.tasks||[]).forEach(t=>{
      if (!t.done && t.due && t.due <= ppToday())
        out.push({crit:1, org:o, txt:'Task due: '+t.t+(t.who?' ('+t.who+')':''), act:'openPipeJourney('+o.id+')'});
    });
  });
  return out.sort((a,b)=>b.crit-a.crit);
}
function pipeLoad(){
  const hrs = {};
  pipeOrgs().forEach(o=>{
    const p = o.pipeline; if (p.status!=='active' && p.status!=='go') return;
    const st = PIPE_STAGES[p.stage]; if (!st) return;
    st.tasks.forEach((t,i)=>{
      const c = (p.checks||{})[p.stage+':'+i];
      if (c && c.done) return;
      const who = (c && c.who) || '(unassigned)';
      hrs[who] = (hrs[who]||0) + (t.h||0);
    });
    (p.tasks||[]).forEach(t=>{ if (!t.done && t.who) hrs[t.who] = (hrs[t.who]||0) + 1; });
  });
  return hrs;
}

/* ---------- nav + route (mirrors the visits pattern) ---------- */
(function(){
  const nav = $('#mainNav');
  if (nav && !nav.querySelector('[data-route="#/pipeline"]')){
    const anchor = nav.querySelector('[data-route="#/visits"]') || nav.querySelector('[data-route="#/editor"]');
    const btn = document.createElement('a');
    btn.dataset.route = '#/pipeline'; btn.href = '#/pipeline'; btn.textContent = 'Pipeline';
    anchor ? anchor.after(btn) : nav.appendChild(btn);
    btn.style.display = 'none';   // applyRole reveals it for staff
  }
  if (!$('#view-pipeline')){
    ($('#view-visits')||$('#view-editor')).insertAdjacentHTML('afterend',
      `<section class="view" id="view-pipeline"><div id="ppRoot"></div></section>`);
  }
})();
function pipelineRoute(){
  if (!location.hash.startsWith('#/pipeline')) return false;
  if ((window.APP && APP.ready && !APP.staff) || (window.VIEW_AS && VIEW_AS.role!=='staff')){ go('#/dashboard'); return true; }
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-pipeline').classList.add('active');
  $$('#mainNav [data-route]').forEach(b=>b.classList.toggle('active', b.dataset.route==='#/pipeline'));
  renderPipeline();
  window.scrollTo({top:0});
  return true;
}
window.addEventListener('hashchange', pipelineRoute);
setTimeout(()=>{ if (location.hash.startsWith('#/pipeline')) pipelineRoute(); }, 0);

/* ---------- render: board + rails ---------- */
window.ppSetPhase = function(k){ ppPhase = k; renderPipeline(); };
window.renderPipeline = function(){
  const root = $('#ppRoot'); if (!root) return;
  const inflight = pipeOrgs();
  const phase = PIPE_PHASES.find(p=>p.key===ppPhase) || PIPE_PHASES[0];
  const catCol = PIPE_CATS[phase.key]||'#999';
  const isEval = phase.key==='Evaluation';

  const cardHTML = o => {
    const p = o.pipeline, cs = pipeChecklistState(o), days = pipeDaysIn(o);
    return `<div class="pp-card" onclick="openPipeJourney(${o.id})">
      <b>${esc(o.name)}</b>
      <div class="m">
        <span style="display:flex;gap:5px;align-items:center">${p.owner?`<span class="pp-ini" title="${esc(p.owner)}">${esc(initialsOf(p.owner))}</span>`:'<span class="muted">unowned</span>'}
          <span>${cs.total?cs.done+'/'+cs.total+' ✓':''}</span></span>
        <span class="${pipeStalled(o)?'pp-stall':''}">${days}d${pipeStalled(o)?' ⏰':''}</span>
      </div>
      <div class="m"><span class="muted" style="font-size:9px">${esc(PIPE_STAGES[p.stage].name)}</span>
        <span class="mv" onclick="event.stopPropagation()">
          <span title="Back a stage" onclick="pipeStep(${o.id},-1)">‹</span>
          <span title="Advance a stage" onclick="pipeStep(${o.id},1)">›</span></span></div>
    </div>`;
  };

  const cols = phase.stages.map(n=>{
    const list = inflight.filter(o=>o.pipeline.stage===n && (isEval ? o.pipeline.status==='active' : true));
    return `<div class="pp-col" style="border-top:3px solid ${catCol}">
      <h4>${n} · ${esc(PIPE_STAGES[n].name)} <span>${list.length}</span></h4>
      ${list.map(cardHTML).join('') || '<div class="muted" style="font-size:11px;padding:4px 2px">—</div>'}
    </div>`;
  }).join('');

  const outcomeCols = !isEval ? '' : ['go','nogo','revisit'].map(k=>{
    const list = inflight.filter(o=>o.pipeline.status===k && o.pipeline.stage<=3 || (k==='go'&&false));
    const conf = {go:['Go ✓ · moved on','#EAF2ED'], nogo:['No-go','#F6EFEE'], revisit:['Revisit ⏰','#FBF7EA']}[k];
    const l2 = k==='go' ? inflight.filter(o=>o.pipeline.status==='go' && o.pipeline.stage<=3) : list;
    return `<div class="pp-col" style="background:${conf[1]}">
      <h4>${conf[0]} <span>${l2.length}</span></h4>
      ${l2.map(cardHTML).join('') || '<div class="muted" style="font-size:11px;padding:4px 2px">—</div>'}
    </div>`;
  }).join('');

  const nudges = pipeNudges();
  const load = pipeLoad();
  const loadMax = Math.max(8, ...Object.values(load));

  /* conveyor: actual stage segments from enteredAt dates */
  const convOrgs = inflight.filter(o=>o.pipeline.status!=='nogo').slice(0,8);
  const convHTML = convOrgs.map(o=>{
    const p = o.pipeline;
    const entries = Object.entries(p.enteredAt||{}).map(([s,d])=>({s:+s, d})).sort((a,b)=>a.d<b.d?-1:1);
    if (!entries.length) return '';
    const t0 = new Date(entries[0].d+'T00:00:00').getTime();
    const span = Math.max(14, (Date.now()-t0)/864e5);
    const segs = entries.map((e,i)=>{
      const start = (new Date(e.d+'T00:00:00').getTime()-t0)/864e5;
      const end = i+1<entries.length ? (new Date(entries[i+1].d+'T00:00:00').getTime()-t0)/864e5 : span;
      const col = PIPE_CATS[(PIPE_STAGES[e.s]||{}).cat]||'#999';
      return `<span class="pp-seg" title="${e.s} · ${esc((PIPE_STAGES[e.s]||{}).name||'')} · from ${esc(e.d)}" style="left:${(start/span*100).toFixed(1)}%;width:${Math.max(1.5,(end-start)/span*100).toFixed(1)}%;background:${col}"></span>`;
    }).join('');
    return `<div style="display:flex;align-items:center;margin-bottom:5px">
      <span style="width:120px;font-size:11px;color:var(--ink-2);flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer" onclick="openPipeJourney(${o.id})">${esc(o.name)}</span>
      <div class="pp-lane">${segs}</div></div>`;
  }).join('');

  const addable = ORGS.filter(o=>!o.pipeline && !o.archived).sort((a,b)=>a.name.localeCompare(b.name));
  root.innerHTML = `
    <div class="lib-head fade-up in" style="margin-bottom:12px">
      <div><div class="kicker">Org pipeline</div><h1>The spearhead</h1>
      <div class="muted" style="font-size:12.5px;margin-top:4px">${inflight.length} org${inflight.length===1?'':'s'} on the pipeline · every move is reversible and recorded — practice freely</div></div>
      <span style="display:flex;gap:8px;align-items:center">
        <select id="ppAddSel" style="border:1px solid var(--divider);border-radius:9px;padding:7px 10px;font:inherit;font-size:12.5px;background:#fff;max-width:230px">
          <option value="">Add an org to the pipeline…</option>
          ${addable.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select>
        <button class="btn primary" onclick="const v=document.querySelector('#ppAddSel').value; if(v) pipeAdd(+v); else flash('Pick an org first')">+ Add</button></span>
    </div>
    <div class="pp-phases fade-up in">
      ${PIPE_PHASES.map(p=>{
        const n = inflight.filter(o=>o.pipeline.stage>=p.stages[0] && o.pipeline.stage<=p.stages[p.stages.length-1]).length;
        return `<button class="chip ${p.key===ppPhase?'on':''}" onclick="ppSetPhase('${p.key}')">${p.label}${n?' · '+n:''}</button>`;}).join('')}
    </div>
    <div class="pp-grid fade-up in">
      <div>
        <div class="pp-box">
          <div class="rv-title">Board · ${esc(phase.label)}</div>
          <div class="pp-board">${cols}${outcomeCols}</div>
        </div>
        <div class="pp-box">
          <div class="rv-title">Conveyor · in-flight orgs over time</div>
          ${convHTML || '<div class="muted" style="font-size:12px">Add orgs to the pipeline to see the conveyor build.</div>'}
          <div class="muted" style="font-size:10px;margin-top:6px">${Object.entries(PIPE_CATS).filter(([k])=>k!=='Optional').map(([k,c])=>`<span style="margin-right:10px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;vertical-align:0"></span>${k}</span>`).join('')}</div>
        </div>
      </div>
      <div>
        <div class="pp-box">
          <div class="rv-title">Nudges &amp; reminders <span class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">· auto</span></div>
          ${nudges.length ? nudges.slice(0,10).map(n=>`<div class="pp-nudge ${n.crit?'crit':''}" onclick="${n.act}">
            <span style="flex:1"><b>${esc(n.org.name)}</b> — ${esc(n.txt)}</span></div>`).join('')
          : '<div class="muted" style="font-size:12px">Nothing needs attention. Nudges appear here when stages stall, revisit dates arrive, tasks fall due, or a decision is ready.</div>'}
        </div>
        <div class="pp-box pp-load">
          <div class="rv-title">Team load · open hours in current stages</div>
          ${Object.keys(load).length ? Object.entries(load).sort((a,b)=>b[1]-a[1]).map(([p,h])=>{
            const pct = Math.min(100, h/loadMax*100);
            return `<div><div class="lr"><span>${esc(p)}</span><span>${h}h open</span></div>
              <div class="lb"><i style="width:${pct}%;background:${h>=loadMax*0.85?'var(--gold)':'var(--forest,#7FAD96)'}"></i></div></div>`;}).join('')
          : '<div class="muted" style="font-size:12px">Assign checklist items to people to see load build up.</div>'}
          <div class="muted" style="font-size:10px;margin-top:4px">Hours come from the stage templates (your model); unassigned items pool separately.</div>
        </div>
      </div>
    </div>`;
};

/* ---------- the journey modal ---------- */
window.openPipeJourney = function(orgId){
  const o = byId(orgId); if (!o || !o.pipeline) return;
  ppJourneyOrg = orgId;
  const p = o.pipeline;
  const veil = $('#modalVeil'), box = $('#modalBox');
  box.style.width = 'min(880px,96vw)'; box.style.maxHeight = '90vh'; box.style.overflow = 'auto';
  const st = PIPE_STAGES[p.stage];
  const people = pipePeople();
  const statusPill = p.status==='go' ? '<span class="pill" style="background:#EAF2ED;border-color:#BFD8C9;color:#3E6B52">Go ✓</span>'
    : p.status==='nogo' ? '<span class="pill" style="background:#F6E9E7;border-color:#d8b3ab;color:#8a4a40">No-go</span>'
    : p.status==='revisit' ? `<span class="pill" style="background:#FBF3DC;border-color:#e2cd8f;color:#8a6d1c">Revisit ${esc(p.revisitDate||'')}</span>`
    : '<span class="pill">Active</span>';

  const steppers = PIPE_PHASES.map(ph=>`
    <div style="margin-bottom:7px">
      <div style="font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);margin-bottom:3px"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${PIPE_CATS[ph.key]};margin-right:5px"></span>${ph.label}</div>
      <div class="pp-steps" style="margin:0">
        ${ph.stages.map(n=>{
          const cls = n===p.stage?'now' : p.skips[n]?'skip' : (p.enteredAt[n] && n<p.stage)?'done' : '';
          return `<span class="pp-step ${cls}" title="Click to move ${o.name} to ${n} · ${esc(PIPE_STAGES[n].name)}${p.skips[n]?' (skipped: '+esc(p.skips[n])+')':''}" onclick="pipeMove(${o.id},${n})">${n} ${esc(PIPE_STAGES[n].name)}</span>`;
        }).join('')}
      </div>
    </div>`).join('');

  const checklist = st ? st.tasks.map((t,i)=>{
    const key = p.stage+':'+i, c = (p.checks||{})[key]||{};
    return `<div class="pp-chk ${c.done?'done':''}">
      <input type="checkbox" ${c.done?'checked':''} onchange="pipeCheck(${o.id},'${key}')">
      <span class="tx">${esc(t.t)}${c.done&&c.by?` <span class="muted" style="font-size:9.5px">✓ ${esc(initialsOf(c.by))} ${esc(c.at||'')}</span>`:''}</span>
      <span class="hrs">${t.h||0}h${t.lag?' · '+t.lag+'d lag':''}</span>
      <select onchange="pipeAssignItem(${o.id},'${key}',this.value)" title="Assign · pool from your model: ${esc(t.pool||'anyone')}">
        <option value="">— ${esc((t.pool||'').split('/')[0]||'assign')}</option>
        ${people.map(n=>`<option ${c.who===n?'selected':''}>${esc(n)}</option>`).join('')}</select>
    </div>`;
  }).join('') : '';

  const links = [];
  if (p.stage>=7 && p.stage<=9) links.push(`<button class="chipbtn btn" style="font-size:11.5px" onclick="closeModal();${o.siteVisit?'':'toggleSiteVisit('+o.id+');'}go('#/visits')">✈ Site visits planner</button>`);
  if (p.stage>=10) links.push(`<button class="btn" style="font-size:11.5px" onclick="closeModal();studioSolo(${o.id})">Open in Data studio</button>`);
  links.push(`<button class="btn" style="font-size:11.5px" onclick="closeModal();go('#/org/${o.id}')">View brief</button>`);

  box.innerHTML = `<div class="kicker">Org pipeline · every move recorded &amp; reversible</div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
      <h3 style="margin:0">${esc(o.name)} ${statusPill}</h3>
      <span style="display:flex;gap:6px;align-items:center;font-size:12px">Owner
        <select onchange="pipeOwner(${o.id},this.value)" style="border:1px solid var(--divider);border-radius:7px;padding:3px 7px;font:inherit;font-size:12px;background:#fff">
          <option value="">—</option>${people.map(n=>`<option ${p.owner===n?'selected':''}>${esc(n)}</option>`).join('')}</select></span>
    </div>
    <div class="muted" style="font-size:11.5px;margin-bottom:12px">Click any stage chip to move there — backward or skipping asks for a note. ${pipeDaysIn(o)}d in the current stage.</div>
    ${steppers}
    ${p.stage<=3 && p.status!=='go' ? `<div class="pp-out">
      <button class="go ${p.status==='go'?'on':''}" onclick="pipeDecide(${o.id},'go')">Go ✓</button>
      <button class="nogo ${p.status==='nogo'?'on':''}" onclick="pipeDecide(${o.id},'nogo')">No-go</button>
      <button class="rev ${p.status==='revisit'?'on':''}" onclick="pipeDecide(${o.id},'revisit')">Revisit later ⏰</button>
      <span class="muted" style="font-size:10.5px;align-self:center">clicking the active one reverses it</span>
    </div>`:''}
    <div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:18px;margin-top:8px">
      <div>
        <div class="kicker">Stage ${p.stage} checklist — ${esc(st?st.name:'')}</div>
        ${checklist || '<div class="muted" style="font-size:12px">No template items for this stage.</div>'}
      </div>
      <div>
        <div class="kicker">Tasks &amp; reminders for this org</div>
        ${(p.tasks||[]).map(t=>`<div class="pp-task">
          <input type="checkbox" ${t.done?'checked':''} onchange="pipeTaskToggle(${o.id},'${t.id}')">
          <span style="flex:1;${t.done?'text-decoration:line-through;color:var(--ink-3)':''}">${esc(t.t)}
            <span class="muted" style="font-size:10px">${esc(t.who||'')}${t.due?' · due '+esc(t.due):''}</span></span>
          <span class="res" style="color:var(--crit);cursor:pointer" onclick="pipeTaskDel(${o.id},'${t.id}')">✕</span>
        </div>`).join('') || '<div class="muted" style="font-size:12px;margin-bottom:6px">No tasks yet.</div>'}
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:7px">
          <input id="ppTaskTitle" type="text" placeholder="new task…" style="flex:2;min-width:130px;border:1px solid var(--divider);border-radius:7px;padding:5px 8px;font:inherit;font-size:12px;background:#fff">
          <select id="ppTaskWho" style="border:1px solid var(--divider);border-radius:7px;padding:4px 6px;font:inherit;font-size:11.5px;background:#fff">
            ${people.map(n=>`<option ${n===wfMe()?'selected':''}>${esc(n)}</option>`).join('')}</select>
          <input id="ppTaskDue" type="date" style="border:1px solid var(--divider);border-radius:7px;padding:4px 6px;font:inherit;font-size:11.5px;background:#fff">
          <button class="btn" style="padding:4px 11px;font-size:11.5px" onclick="pipeTaskAdd(${o.id})">+ Add</button>
        </div>
        <div class="kicker" style="margin-top:14px">History <span class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">· newest first (full audit in the database)</span></div>
        <div style="max-height:130px;overflow:auto">
          ${(p.history||[]).slice().reverse().slice(0,12).map(h=>`<div class="pp-hist"><b>${esc(initialsOf(h.by||''))}</b> ${esc(h.at||'')} — ${esc(h.kind||'')}${h.from?` ${h.from}→${h.to}`:h.to?` → ${h.to}`:''}${h.note?` · <i>${esc(h.note)}</i>`:''}</div>`).join('') || '<div class="muted" style="font-size:11px">—</div>'}
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:16px;border-top:1px solid var(--hairline);padding-top:12px;flex-wrap:wrap">
      <span style="display:flex;gap:6px;flex-wrap:wrap">${links.join('')}</span>
      <span style="display:flex;gap:8px">
        <button class="btn" style="color:var(--crit)" onclick="pipeRemove(${o.id})">Remove from pipeline</button>
        <button class="btn primary" onclick="closeModal();renderPipeline()">Done</button></span>
    </div>`;
  veil.classList.add('show');
};

</script>
