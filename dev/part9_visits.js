<script>
/* ================================================================
   SITE VISITS — travel planner for org site visits & content production.
   Staff-only. Candidates are flagged from the Data studio (✈ icon);
   this tab groups them by country, builds trips, coordinates
   multi-party availability, and runs the pre/production/post flow.
   ================================================================ */

(function(){ const el = document.createElement('style'); el.textContent = `
#view-visits .sv-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,0.95fr);gap:18px;align-items:start}
.sv-box{border:1.5px solid var(--divider);border-radius:12px;padding:14px 16px;margin-bottom:16px;background:var(--surface)}
.sv-box .rv-title{font-weight:700;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid var(--hairline)}
.sv-country{margin-bottom:12px}
.sv-country > .cn{font-weight:700;font-size:12.5px;margin-bottom:5px;display:flex;align-items:center;gap:8px}
.sv-org{display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--hairline);border-radius:9px;margin-bottom:5px;font-size:12.5px;background:#fff;flex-wrap:wrap}
.sv-org b{flex:1;min-width:120px;cursor:pointer}
.sv-org select{border:1px solid var(--divider);border-radius:7px;padding:3px 6px;font:inherit;font-size:11.5px;background:#fff}
.sv-trip{border:1.5px solid var(--divider);border-left:4px solid #91A5C6;border-radius:12px;padding:12px 14px;margin-bottom:12px;background:#fff}
.sv-trip.sel{border-color:#91A5C6;box-shadow:0 4px 14px rgba(145,165,198,.25)}
.sv-trip .tt{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.sv-trip input[type=date], .sv-trip input[type=text], .sv-trip select{border:1px solid var(--divider);border-radius:7px;padding:4px 7px;font:inherit;font-size:12px;background:#fff}
.sv-phasebar{display:flex;height:10px;border-radius:6px;overflow:hidden;margin:8px 0 3px;border:1px solid var(--hairline)}
.sv-phasebar i{display:block;height:100%}
.sv-flow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:10px}
.sv-col{border:1px solid var(--divider);border-radius:11px;padding:10px 12px;background:var(--surface-3)}
.sv-col .ph{font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px;display:flex;justify-content:space-between}
.sv-task{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;padding:5px 7px;border:1px solid var(--hairline);border-radius:8px;background:#fff;margin-bottom:5px}
.sv-task.done{opacity:.55}
.sv-task.done .tx{text-decoration:line-through}
.sv-task input[type=checkbox]{margin-top:2.5px;accent-color:#7FAD96}
.sv-task .tx{flex:1}
.sv-task .rm{cursor:pointer;color:var(--crit);font-size:11px}
.sv-cal{width:100%;border-collapse:collapse;table-layout:fixed}
.sv-cal th{font-size:10.5px;color:var(--ink-3);padding:3px 0;font-weight:500}
.sv-cal td{border:1px solid var(--hairline);height:66px;vertical-align:top;padding:2px 3px;font-size:10.5px;cursor:pointer;border-radius:4px;overflow:hidden}
.sv-cal td:hover{background:rgba(146,193,220,.12)}
.sv-cal td.off{background:var(--surface-3);cursor:default}
.sv-cal td.trip{background:rgba(145,165,198,.14)}
.sv-cal .dts{display:flex;gap:2px;flex-wrap:wrap;margin-top:1px}
.sv-cal .ini{display:inline-block;font-size:8.5px;font-weight:600;line-height:1;padding:1.5px 3px;border-radius:4px;border:1px solid;background:#fff}
.sv-cal .ini.no{opacity:.55;text-decoration:line-through;background:var(--surface-3)}
.sv-cal .ini.me{font-weight:800;box-shadow:0 0 0 1.5px var(--ink);border-color:var(--ink)!important}
.sv-cal .trip-tag{display:block;font-size:8.5px;font-weight:700;color:#fff;border-radius:4px;padding:1.5px 4px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sv-cal .day-chip{display:block;font-size:8.5px;font-weight:600;border-radius:4px;padding:1.5px 4px;margin-top:1px;border:1px solid;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#fff}
.sv-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;margin-top:8px;align-items:center}
.sv-legend .ini{display:inline-block;font-size:9px;font-weight:700;padding:1.5px 4px;border-radius:4px;border:1px solid;background:#fff;margin-right:3px;vertical-align:-1px}
.sv-mode{display:flex;gap:5px}
.sv-mode button{font-size:11px;padding:3px 10px;border:1px solid var(--divider);border-radius:999px;background:#fff;cursor:pointer}
.sv-mode button.on{background:var(--ink);color:#F7F5F1;border-color:var(--ink)}
.sv-torgs{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.sv-torgs .oc{font-size:9.5px;border:1px solid var(--divider);border-radius:999px;padding:1px 7px;cursor:pointer;background:#fff}
.sv-torgs .oc.on{background:#DFE9DC;border-color:#7FA87F;color:#2C4E2C;text-decoration:line-through}
.sv-gate{font-size:11.5px;padding:7px 10px;border-radius:8px;margin-top:8px;border:1px dashed var(--divider);color:var(--ink-2)}
.sv-gate.warn{border-color:#B4544A;color:#B4544A}
`; document.head.appendChild(el); })();

/* ---------- state + persistence shape ----------
   VISITS.trips: {id,dbId,name,country,start,end,dp,notes}
   VISITS.dps:   {id,dbId,name,contact,notes}
   VISITS.avail: {id,dbId,person,date,state}    state: 'yes' | 'no'
   VISITS.tasks: {id,dbId,trip,phase,text,done,who}   phase: pre|prod|post   */
window.VISITS = { trips:[], dps:[], avail:[], tasks:[], loaded:false };
let svSeq = 1, svTripSel = null, svCalMonth = null, svMarkAs = '', svCalMode = 'avail';

const SV_DEFAULT_TASKS = {
  pre: ['Org approval & scheduling confirmed','Visa / entry requirements checked','Flights booked','Lodging booked',
        'Travel insurance & vaccinations','Comms plan with org (contacts, itinerary)','Media releases & consent forms prepared',
        'Shot list & interview questions drafted','Equipment checklist packed (camera, audio, batteries, backups)'],
  prod: ['Arrival check-in with org lead','B-roll of program in action','Director / beneficiary interviews',
         'Photo set for briefs & updates','Signed releases collected','Daily footage backup (two copies)'],
  post: ['Ingest + cloud backup of all media','Select stills for org brief / hero images','Edit field update video',
         'Draft From the field update (auto-write from footage notes)','Org review & approval of content','Publish update to the platform'],
};
const SV_STATUS = ['candidate','outreach','confirmed','scheduled','visited'];
const SV_COLORS = ['#91A5C6','#C4A47C','#7FAD96','#CB9A8B','#EFCB67','#92C1DC','#E1938D','#9ED1BB'];

function svPeople(){
  const out = teamMembers().filter(n=>n!=='FFG Team');
  VISITS.dps.forEach(d=>{ if (!out.includes(d.name)) out.push(d.name+' (DP)'); });
  return out;
}
function svColor(person){ return SV_COLORS[Math.max(0, svPeople().indexOf(person)) % SV_COLORS.length]; }
function svTripColor(t){ return SV_COLORS[Math.max(0, VISITS.trips.indexOf(t)) % SV_COLORS.length]; }
window.svSetCalMode = function(m){ svCalMode = m; renderVisits(); };
function svCandidates(){ return ORGS.filter(o=>o.siteVisit); }
function svByCountry(){
  const groups = {};
  svCandidates().forEach(o=>{
    const c = (o.countries||[]).filter(x=>x!=='Global')[0] || 'Unassigned';
    (groups[c] = groups[c]||[]).push(o);
  });
  return Object.entries(groups).sort((a,b)=> b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

/* ---------- studio marker ---------- */
window.toggleSiteVisit = function(orgId){
  const o = byId(orgId); if (!o) return;
  if (o.siteVisit){ delete o.siteVisit; flash(o.name+' removed from site-visit candidates'); }
  else { o.siteVisit = {status:'candidate', trip:null, by:wfMe(), date:new Date().toISOString().slice(0,10)}; flash(o.name+' marked for a potential site visit — plan it in the Site visits tab'); }
  if (window.PERSIST && PERSIST.orgField) PERSIST.orgField(o, 'siteVisit', o.siteVisit||null);
  if ($('#edBody')) renderEdRows();
  if ($('#view-visits') && $('#view-visits').classList.contains('active')) renderVisits();
};
window.setSiteVisitField = function(orgId, key, val){
  const o = byId(orgId); if (!o || !o.siteVisit) return;
  o.siteVisit = {...o.siteVisit, [key]: val||null};
  if (window.PERSIST && PERSIST.orgField) PERSIST.orgField(o, 'siteVisit', o.siteVisit);
  renderVisits();
};

/* ---------- nav + route (mirrors the Donor studio pattern) ---------- */
(function(){
  const nav = $('#mainNav');
  if (nav && !nav.querySelector('[data-route="#/visits"]')){
    const anchor = nav.querySelector('[data-route="#/donors"]') || nav.querySelector('[data-route="#/editor"]');
    const btn = document.createElement('button');
    btn.dataset.route = '#/visits'; btn.textContent = 'Site visits';
    anchor ? anchor.after(btn) : nav.appendChild(btn);
    btn.style.display = 'none';   // applyRole reveals it for staff
  }
  if (!$('#view-visits')){
    ($('#view-donors')||$('#view-editor')).insertAdjacentHTML('afterend',
      `<section class="view" id="view-visits"><div id="svRoot"></div></section>`);
  }
})();
function visitsRoute(){
  if (!location.hash.startsWith('#/visits')) return false;
  if (window.APP && APP.ready && !APP.staff){ go('#/dashboard'); return true; }
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-visits').classList.add('active');
  $$('#mainNav button').forEach(b=>b.classList.toggle('active', b.dataset.route==='#/visits'));
  renderVisits();
  window.scrollTo({top:0});
  return true;
}
window.addEventListener('hashchange', visitsRoute);
setTimeout(()=>{ if (location.hash.startsWith('#/visits')) visitsRoute(); }, 0);

/* ---------- trips ---------- */
window.svAddTrip = function(){
  const t = {id:'t'+(svSeq++), name:'New trip', country:'', start:'', end:'', dp:'', notes:''};
  VISITS.trips.push(t);
  SV_DEFAULT_TASKS.pre.forEach(x=>VISITS.tasks.push(svNewTask(t.id,'pre',x)));
  SV_DEFAULT_TASKS.prod.forEach(x=>VISITS.tasks.push(svNewTask(t.id,'prod',x)));
  SV_DEFAULT_TASKS.post.forEach(x=>VISITS.tasks.push(svNewTask(t.id,'post',x)));
  svTripSel = t.id;
  window.PERSIST && PERSIST.visit && PERSIST.visit('trip', t);
  VISITS.tasks.filter(k=>k.trip===t.id).forEach(k=>window.PERSIST && PERSIST.visit && PERSIST.visit('task', k));
  renderVisits();
  flash('Trip created — set its dates, country, and DP, then assign orgs to it');
};
function svNewTask(trip, phase, text){ return {id:'k'+(svSeq++), trip, phase, text, done:false, who:''}; }
window.svTripField = function(tid, key, val){
  const t = VISITS.trips.find(x=>x.id===tid); if (!t) return;
  t[key] = val;
  window.PERSIST && PERSIST.visitUpdate && PERSIST.visitUpdate('trip', t);
  if (key==='start'||key==='end'||key==='name') renderVisits();
};
window.svDelTrip = function(tid){
  const t = VISITS.trips.find(x=>x.id===tid); if (!t) return;
  if (!confirm('Delete trip "'+t.name+'" and its checklist?')) return;
  VISITS.trips = VISITS.trips.filter(x=>x.id!==tid);
  VISITS.tasks.filter(k=>k.trip===tid).forEach(k=>window.PERSIST && PERSIST.visitDelete && PERSIST.visitDelete(k));
  VISITS.tasks = VISITS.tasks.filter(k=>k.trip!==tid);
  ORGS.filter(o=>o.siteVisit && o.siteVisit.trip===tid).forEach(o=>setSiteVisitField(o.id,'trip',null));
  window.PERSIST && PERSIST.visitDelete && PERSIST.visitDelete(t);
  if (svTripSel===tid) svTripSel = null;
  renderVisits();
};
window.svSelTrip = function(tid){ svTripSel = tid; renderVisits(); };

/* ---------- tasks ---------- */
window.svToggleTask = function(kid){
  const k = VISITS.tasks.find(x=>String(x.id)===String(kid)); if (!k) return;
  k.done = !k.done;
  const t = VISITS.trips.find(x=>x.id===k.trip);
  const orgs = t ? svCandidates().filter(o=>o.siteVisit.trip===t.id) : [];
  k.doneOrgs = {};
  if (k.done) orgs.forEach(o=>k.doneOrgs[o.id] = true);
  window.PERSIST && PERSIST.visitUpdate && PERSIST.visitUpdate('task', k);
  renderVisits();
};
window.svAddTask = function(tid, phase){
  const inp = $('#svNewTask-'+phase); if (!inp) return;
  const tx = inp.value.trim(); if (!tx){ flash('Type the task first'); return; }
  const k = svNewTask(tid, phase, tx);
  VISITS.tasks.push(k);
  window.PERSIST && PERSIST.visit && PERSIST.visit('task', k);
  renderVisits();
};
window.svDelTask = function(kid){
  const k = VISITS.tasks.find(x=>String(x.id)===String(kid)); if (!k) return;
  VISITS.tasks = VISITS.tasks.filter(x=>x!==k);
  window.PERSIST && PERSIST.visitDelete && PERSIST.visitDelete(k);
  renderVisits();
};

/* ---------- DPs ---------- */
window.svAddDp = function(){
  const name = ($('#svDpName')?.value||'').trim();
  if (!name){ flash('Enter the DP\'s name'); return; }
  const d = {id:'d'+(svSeq++), name, contact:($('#svDpContact')?.value||'').trim(), notes:''};
  VISITS.dps.push(d);
  window.PERSIST && PERSIST.visit && PERSIST.visit('dp', d);
  renderVisits();
};
window.svDelDp = function(did){
  const d = VISITS.dps.find(x=>String(x.id)===String(did)); if (!d) return;
  VISITS.dps = VISITS.dps.filter(x=>x!==d);
  window.PERSIST && PERSIST.visitDelete && PERSIST.visitDelete(d);
  renderVisits();
};

/* ---------- availability calendar ---------- */
function svMonth(){ if (!svCalMonth){ const d = new Date(); svCalMonth = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); } return svCalMonth; }
window.svCalNav = function(step){
  let [y,m] = svMonth().split('-').map(Number);
  m += step; if (m<1){ m=12; y--; } if (m>12){ m=1; y++; }
  svCalMonth = y+'-'+String(m).padStart(2,'0');
  renderVisits();
};
window.svMarkDay = function(date){
  if (svCalMode === 'plan'){ svPlanDay(date); return; }
  const person = svMarkAs || wfMe();
  const found = VISITS.avail.find(a=>a.person===person && a.date===date);
  if (!found){
    const a = {id:'a'+(svSeq++), person, date, state:'yes'};
    VISITS.avail.push(a);
    window.PERSIST && PERSIST.visit && PERSIST.visit('avail', a);
  } else if (found.state==='yes'){
    found.state = 'no';
    window.PERSIST && PERSIST.visitUpdate && PERSIST.visitUpdate('avail', found);
  } else {
    VISITS.avail = VISITS.avail.filter(a=>a!==found);
    window.PERSIST && PERSIST.visitDelete && PERSIST.visitDelete(found);
  }
  renderVisits();
};
window.svSetMarkAs = function(v){ svMarkAs = v; renderVisits(); };
/* itinerary planning: click a day to cycle travel day → each trip org → clear */
function svPlanDay(date){
  const t = VISITS.trips.find(x=>x.id===svTripSel);
  if (!t){ flash('Select (or create) a trip first — click its card'); return; }
  t.days = t.days || {};
  const orgs = svCandidates().filter(o=>o.siteVisit.trip===t.id);
  const cur = t.days[date];
  if (!cur){ t.days[date] = {type:'travel'}; }
  else if (cur.type === 'travel'){
    if (orgs.length) t.days[date] = {type:'org', org:orgs[0].id};
    else delete t.days[date];
  } else {
    const i = orgs.findIndex(o=>o.id===cur.org);
    if (i >= 0 && i < orgs.length-1) t.days[date] = {type:'org', org:orgs[i+1].id};
    else delete t.days[date];
  }
  window.PERSIST && PERSIST.visitUpdate && PERSIST.visitUpdate('trip', t);
  renderVisits();
}
/* per-org check-off on flow tasks: a task is done when every trip org is */
window.svToggleTaskOrg = function(kid, orgId){
  const k = VISITS.tasks.find(x=>String(x.id)===String(kid)); if (!k) return;
  k.doneOrgs = {...k.doneOrgs};
  if (k.doneOrgs[orgId]) delete k.doneOrgs[orgId]; else k.doneOrgs[orgId] = true;
  const t = VISITS.trips.find(x=>x.id===k.trip);
  const orgs = t ? svCandidates().filter(o=>o.siteVisit.trip===t.id) : [];
  k.done = orgs.length > 0 && orgs.every(o=>k.doneOrgs[o.id]);
  window.PERSIST && PERSIST.visitUpdate && PERSIST.visitUpdate('task', k);
  renderVisits();
};

/* ---------- render ---------- */
function svPhaseCounts(tid){
  const out = {};
  ['pre','prod','post'].forEach(ph=>{
    const ks = VISITS.tasks.filter(k=>k.trip===tid && k.phase===ph);
    out[ph] = {done: ks.filter(k=>k.done).length, total: ks.length};
  });
  return out;
}
window.renderVisits = function(){
  const root = $('#svRoot'); if (!root) return;
  const cands = svCandidates();
  const trips = VISITS.trips;
  const sel = trips.find(t=>t.id===svTripSel) || trips[0] || null;
  if (sel) svTripSel = sel.id;
  const me = wfMe();

  /* candidates grouped by country */
  const groupsHTML = svByCountry().map(([country, orgs])=>`
    <div class="sv-country">
      <div class="cn">${esc(country)} <span class="pill" style="font-size:10px">${orgs.length} org${orgs.length===1?'':'s'}</span>
        ${orgs.length>1?'<span class="muted" style="font-size:10.5px">— combinable into one trip</span>':''}</div>
      ${orgs.map(o=>`<div class="sv-org">
        <b onclick="go('#/org/${o.id}')" title="Open the brief">${esc(o.name)}</b>
        <select onchange="setSiteVisitField(${o.id},'status',this.value)" title="Visit status">
          ${SV_STATUS.map(s=>`<option ${o.siteVisit.status===s?'selected':''}>${s}</option>`).join('')}</select>
        <select onchange="setSiteVisitField(${o.id},'trip',this.value)" title="Assign to a trip">
          <option value="">no trip</option>
          ${trips.map(t=>`<option value="${t.id}" ${o.siteVisit.trip===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>
        <span class="res" style="color:var(--crit)" onclick="toggleSiteVisit(${o.id})" title="Remove candidate">✕</span>
      </div>`).join('')}
    </div>`).join('');

  /* trips list with phase progress + timeline */
  const tripsHTML = trips.map(t=>{
    const pc = svPhaseCounts(t.id);
    const orgsIn = cands.filter(o=>o.siteVisit.trip===t.id);
    const pct = ph => pc[ph].total ? Math.round(pc[ph].done/pc[ph].total*100) : 0;
    return `<div class="sv-trip ${sel&&sel.id===t.id?'sel':''}" onclick="svSelTrip('${t.id}')">
      <div class="tt">
        <input type="text" value="${esc(t.name)}" onclick="event.stopPropagation()" onchange="svTripField('${t.id}','name',this.value)" style="font-weight:700;min-width:130px">
        <input type="text" value="${esc(t.country||'')}" placeholder="country / region" onclick="event.stopPropagation()" onchange="svTripField('${t.id}','country',this.value)" style="width:120px">
        <span style="display:flex;gap:5px;align-items:center;font-size:11.5px" onclick="event.stopPropagation()">
          <input type="date" value="${esc(t.start||'')}" onchange="svTripField('${t.id}','start',this.value)"> →
          <input type="date" value="${esc(t.end||'')}" onchange="svTripField('${t.id}','end',this.value)"></span>
        <select onclick="event.stopPropagation()" onchange="svTripField('${t.id}','dp',this.value)" title="Director of photography traveling on this trip">
          <option value="">DP — unassigned</option>
          ${VISITS.dps.map(d=>`<option ${t.dp===d.name?'selected':''}>${esc(d.name)}</option>`).join('')}</select>
        <span class="res" style="color:var(--crit)" onclick="event.stopPropagation();svDelTrip('${t.id}')">✕</span>
      </div>
      <div class="sv-phasebar" title="Pre-production ${pct('pre')}% · Production ${pct('prod')}% · Post ${pct('post')}%">
        <i style="width:34%;background:linear-gradient(90deg,#C4A47C ${pct('pre')}%,rgba(196,164,124,.18) ${pct('pre')}%)"></i>
        <i style="width:33%;background:linear-gradient(90deg,#91A5C6 ${pct('prod')}%,rgba(145,165,198,.18) ${pct('prod')}%)"></i>
        <i style="width:33%;background:linear-gradient(90deg,#7FAD96 ${pct('post')}%,rgba(127,173,150,.18) ${pct('post')}%)"></i>
      </div>
      <div class="muted" style="font-size:10.5px;display:flex;justify-content:space-between">
        <span>pre ${pc.pre.done}/${pc.pre.total}</span><span>production ${pc.prod.done}/${pc.prod.total}</span><span>post ${pc.post.done}/${pc.post.total}</span></div>
      <div style="font-size:11.5px;margin-top:6px">${orgsIn.length?orgsIn.map(o=>`<span class="pill" style="margin:0 4px 4px 0;display:inline-block">${esc(o.name)}</span>`).join(''):'<span class="muted">no orgs assigned yet — use the candidate list</span>'}</div>
    </div>`;}).join('');

  /* flow board for the selected trip */
  let flowHTML = '<div class="muted" style="font-size:12.5px">Create a trip to start its pre → production → post flow.</div>';
  if (sel){
    const pc = svPhaseCounts(sel.id);
    const preDone = pc.pre.total && pc.pre.done===pc.pre.total;
    const daysToGo = sel.start ? Math.ceil((new Date(sel.start+'T00:00:00') - Date.now())/864e5) : null;
    const phases = [['pre','Pre-production','#C4A47C'],['prod','Production','#91A5C6'],['post','Post-production','#7FAD96']];
    flowHTML = `
      <div class="muted" style="font-size:11.5px;margin-bottom:6px">Flow for <b>${esc(sel.name)}</b>${sel.start?` · departs ${esc(sel.start)}`:''}${sel.dp?` · DP: ${esc(sel.dp)}`:''}</div>
      <div class="sv-flow">${phases.map(([ph,label,color])=>`
        <div class="sv-col" style="border-top:3px solid ${color}">
          <div class="ph"><span>${label}</span><span>${pc[ph].done}/${pc[ph].total}</span></div>
          ${VISITS.tasks.filter(k=>k.trip===sel.id && k.phase===ph).map(k=>{
            const tripOrgs = cands.filter(o=>o.siteVisit.trip===sel.id);
            return `
            <div class="sv-task ${k.done?'done':''}">
              <input type="checkbox" ${k.done?'checked':''} onchange="svToggleTask('${k.id}')">
              <span class="tx">${esc(k.text)}
                ${tripOrgs.length?`<span class="sv-torgs">${tripOrgs.map(o=>`
                  <span class="oc ${(k.doneOrgs||{})[o.id]?'on':''}" title="Check ${esc(o.name)} off for this task" onclick="svToggleTaskOrg('${k.id}',${o.id})">${esc(o.name.split(' ')[0])}</span>`).join('')}</span>`:''}
              </span>
              <span class="rm" onclick="svDelTask('${k.id}')">✕</span>
            </div>`;}).join('')}
          <div style="display:flex;gap:5px;margin-top:6px">
            <input id="svNewTask-${ph}" type="text" placeholder="add a task…" style="flex:1;border:1px solid var(--divider);border-radius:7px;padding:4px 7px;font:inherit;font-size:11.5px;background:#fff"
              onkeydown="if(event.key==='Enter')svAddTask('${sel.id}','${ph}')">
            <button class="btn" style="padding:3px 10px;font-size:11.5px" onclick="svAddTask('${sel.id}','${ph}')">+</button>
          </div>
        </div>`).join('')}
      </div>
      <div class="sv-gate ${!preDone && daysToGo!==null && daysToGo<14 ? 'warn':''}">
        ⛩ Gate: every pre-production task must clear before departure${daysToGo!==null ? ` — ${daysToGo>=0?daysToGo+' days to go':'departed '+(-daysToGo)+' days ago'}` : ''}.
        ${preDone?'✅ Pre-production complete — cleared for travel.':`${pc.pre.total-pc.pre.done} pre-production task${pc.pre.total-pc.pre.done===1?'':'s'} outstanding.`}
        Production runs on the ground; post-production starts the day you land home.
      </div>`;
  }

  /* availability calendar */
  const [cy, cm] = svMonth().split('-').map(Number);
  const first = new Date(cy, cm-1, 1);
  const startDow = (first.getDay()+6)%7;                 // monday first
  const daysIn = new Date(cy, cm, 0).getDate();
  const monthName = first.toLocaleString('en-US',{month:'long', year:'numeric'});
  const tripSpans = trips.filter(t=>t.start&&t.end);
  const planTrip = trips.find(t=>t.id===svTripSel) || null;
  let cells = ''; let day = 1 - startDow;
  for (let w=0; w<6 && day<=daysIn; w++){
    cells += '<tr>';
    for (let dd=0; dd<7; dd++, day++){
      if (day<1 || day>daysIn){ cells += '<td class="off"></td>'; continue; }
      const date = svMonth()+'-'+String(day).padStart(2,'0');
      const marks = VISITS.avail.filter(a=>a.date===date);
      const covering = tripSpans.filter(t=>date>=t.start && date<=t.end);
      // the trip name + location tag shows on the first covered day (or 1st of month)
      const tags = covering.filter(t=>date===t.start || day===1).map(t=>
        `<span class="trip-tag" style="background:${svTripColor(t)}" title="${esc(t.name)}${t.country?' — '+esc(t.country):''} · ${esc(t.start)} → ${esc(t.end)}">✈ ${esc(t.name)}${t.country?' · '+esc(t.country):''}</span>`).join('');
      // itinerary chips: org days and travel days from every trip's day plan
      const dayChips = trips.map(t=>{
        const d2 = (t.days||{})[date]; if (!d2) return '';
        const col = svTripColor(t);
        if (d2.type==='travel') return `<span class="day-chip" style="border-color:${col};color:${col}" title="${esc(t.name)} — travel day">✈ travel</span>`;
        const o = byId(d2.org);
        return o ? `<span class="day-chip" style="border-color:${col};color:var(--ink)" title="${esc(t.name)} — visiting ${esc(o.name)}">${esc(o.name.length>14?o.name.slice(0,13)+'…':o.name)}</span>` : '';
      }).join('');
      const inTrip = covering.length>0;
      const tip = svCalMode==='plan'
        ? (planTrip ? `Plan ${esc(planTrip.name)}: click to cycle travel day → each org → clear` : 'Select a trip card first')
        : `Click to mark ${esc(svMarkAs||me)}: available → unavailable → clear`;
      cells += `<td class="${inTrip?'trip':''}" onclick="svMarkDay('${date}')" title="${tip}">
        <div style="display:flex;justify-content:space-between"><span>${day}</span></div>
        ${tags}${dayChips}
        <div class="dts">${marks.map(a=>{
          const isMe = a.person===me;
          return `<span class="ini ${a.state==='yes'?'':'no'} ${isMe?'me':''}" title="${esc(a.person)} — ${a.state==='yes'?'available':'unavailable'}" style="border-color:${svColor(a.person)};color:${svColor(a.person)==='#EFCB67'?'#7a6516':'inherit'};${a.state==='yes'?'background:'+svColor(a.person)+'33;':''}">${esc(initialsOf(a.person))}</span>`;}).join('')}</div>
      </td>`;
    }
    cells += '</tr>';
  }
  const markOptions = [me, ...VISITS.dps.map(d=>d.name)].filter((v,i,arr)=>arr.indexOf(v)===i);

  root.innerHTML = `
    <div class="lib-head fade-up in" style="margin-bottom:14px">
      <div><div class="kicker">Site visits</div><h1>Field trips &amp; content production</h1>
      <div class="muted" style="font-size:12.5px;margin-top:4px">${cands.length} candidate org${cands.length===1?'':'s'} flagged ✈ in the Data studio · ${trips.length} trip${trips.length===1?'':'s'} planned</div></div>
      <button class="btn primary" onclick="svAddTrip()">+ New trip</button>
    </div>
    <div class="sv-grid fade-up in">
      <div>
        <div class="sv-box">
          <div class="rv-title">Candidate orgs · grouped by country</div>
          ${groupsHTML || '<div class="muted" style="font-size:12.5px">No candidates yet — click the ✈ icon on any Data studio row to flag an org for a potential site visit.</div>'}
        </div>
        <div class="sv-box">
          <div class="rv-title">Trips</div>
          ${tripsHTML || '<div class="muted" style="font-size:12.5px">No trips yet. Group candidates that share a country into one trip to hit more orgs per journey.</div>'}
        </div>
      </div>
      <div>
        <div class="sv-box">
          <div class="rv-title">Availability · who can travel when</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
            <span style="display:flex;gap:6px;align-items:center">
              <button class="btn" style="padding:2px 10px" onclick="svCalNav(-1)">‹</button>
              <b style="font-size:13px">${esc(monthName)}</b>
              <button class="btn" style="padding:2px 10px" onclick="svCalNav(1)">›</button></span>
            <span class="sv-mode">
              <button class="${svCalMode==='avail'?'on':''}" onclick="svSetCalMode('avail')">Availability</button>
              <button class="${svCalMode==='plan'?'on':''}" onclick="svSetCalMode('plan')" title="Click days to assign travel and org visits for the selected trip">Trip itinerary</button></span>
            ${svCalMode==='avail'?`<span style="font-size:11.5px;display:flex;gap:5px;align-items:center">Marking as
              <select onchange="svSetMarkAs(this.value)" style="border:1px solid var(--divider);border-radius:7px;padding:3px 6px;font:inherit;font-size:11.5px;background:#fff">
                ${markOptions.map(p=>`<option value="${esc(p===me?'':p)}" ${svMarkAs===(p===me?'':p)?'selected':''}>${esc(p)}${p===me?' (you)':''}</option>`).join('')}
              </select></span>`
            :`<span style="font-size:11.5px" class="muted">Planning: <b>${planTrip?esc(planTrip.name):'select a trip card'}</b> · click a day to cycle ✈ travel → each org → clear</span>`}
          </div>
          <table class="sv-cal"><tr><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th></tr>${cells}</table>
          <div class="sv-legend">
            ${svPeople().filter(p=>VISITS.avail.some(a=>a.person===p||a.person===p.replace(' (DP)','')) || p===me).slice(0,8).map(p=>{
              const raw = p.replace(' (DP)','');
              return `<span><span class="ini ${raw===me?'me':''}" style="border-color:${svColor(p)}">${esc(initialsOf(raw))}</span>${esc(p)}${raw===me?' (you)':''}</span>`;}).join('')}
            <span class="muted">initials = availability (struck = unavailable, boxed bold = you) · colored tag = trip · chips = org / travel days</span>
          </div>
        </div>
        <div class="sv-box">
          <div class="rv-title">Directors of photography</div>
          ${VISITS.dps.map(d=>`<div class="sv-org"><b>${esc(d.name)}</b><span class="muted" style="font-size:11px">${esc(d.contact||'')}</span>
            <span class="muted" style="font-size:10.5px">${VISITS.avail.filter(a=>a.person===d.name&&a.state==='yes').length} days marked available</span>
            <span class="res" style="color:var(--crit)" onclick="svDelDp('${d.id}')">✕</span></div>`).join('') || '<div class="muted" style="font-size:12px">No DPs on the roster yet.</div>'}
          <div style="display:flex;gap:6px;margin-top:8px">
            <input id="svDpName" type="text" placeholder="DP name" style="flex:1;border:1px solid var(--divider);border-radius:7px;padding:5px 8px;font:inherit;font-size:12px;background:#fff">
            <input id="svDpContact" type="text" placeholder="contact (email / phone)" style="flex:1.2;border:1px solid var(--divider);border-radius:7px;padding:5px 8px;font:inherit;font-size:12px;background:#fff">
            <button class="btn" onclick="svAddDp()">+ Add DP</button>
          </div>
        </div>
        <div class="sv-box">
          <div class="rv-title">Trip flow · pre → production → post</div>
          ${flowHTML}
        </div>
      </div>
    </div>`;
};

</script>
