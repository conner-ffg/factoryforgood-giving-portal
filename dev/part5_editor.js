<script>
/* ================= DATA STUDIO — FIELD DICTIONARY ================= */
const RATE5 = ['','Very Low','Low','Medium','High','Very High'];
/* The suffering → flourishing ladder: what each state number actually means */
window.STATE_WORDS = {1:'Acute suffering',2:'Severe suffering',3:'Unstable',4:'Uncomfortable',5:'Stable',6:'Well',7:'Comfortable',8:'Secure',9:'Thriving',10:'Flourishing'};
const STATE_LADDER = 'What each state means:\n' + Object.entries(STATE_WORDS).map(([n,w])=>'  '+n+' — '+w).join('\n');
/* ~ approximate numbers display as a sensible range (half → double, nicely rounded) */
window.fmtApproxRange = function(v, money){
  v = +v; if (!isFinite(v) || v<=0) return '';
  // an approximate value reads as a floor: ~107 -> 75+, ~50 -> 35+, ~$1M -> $750K+
  const t = v*0.75;
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(1e-9,t))));
  const steps = [1,1.5,2,2.5,3,3.5,4,5,7.5,10];
  const m = t/p;
  const lo = ([...steps].reverse().find(x=>x<=m+1e-9)||1)*p;
  const f = n => money ? '$'+(n>=1e9?(+(n/1e9).toFixed(1))+'B':n>=1e6?(+(n/1e6).toFixed(1))+'M':n>=1e3?(+(n/1e3).toFixed(1))+'K':n) : String(n);
  return f(lo)+'+';
};
const FIELDS = [
 // Identity & Basic Info
 {k:'id', l:'Record ID', cat:'Identity & Basic Info', ro:1, desc:'Internal system identifier. Do not change once assigned.'},
 {k:'name', l:'Display Name', pub:1, cat:'Identity & Basic Info', cls:'name-c', core:1, desc:'Shorter public-facing name, if different from the legal name.'},
 {k:'tier', l:'Tier', pub:1, cat:'Identity & Basic Info', sel:['top','recommended','represented','flagged'], core:1, desc:'Meridian conviction tier: top pick, recommended, represented, or flagged (tracked internally, never showcased to members).'},
 {k:'website', l:'Website Link', pub:1, cat:'Identity & Basic Info', core:1, desc:'Org\'s website. The ↗ opens it in a new tab.'},
 {k:'legalName', l:'Legal Organization Name', cat:'Identity & Basic Info', desc:'Full registered legal name.'},
 {k:'logoUrl', l:'Logo Image', pub:1, core:1, cat:'Identity & Basic Info', img:1, desc:'Link to the org\'s logo file. Click the camera to paste a URL or upload a file.'},
 {k:'ein', l:'EIN', cat:'Identity & Basic Info', desc:'US tax ID (XX-XXXXXXX). Primary identifier for domestic orgs.'},
 {k:'charityEquivId', l:'Charity Equivalency ID', cat:'Identity & Basic Info', desc:'Equivalency determination reference for non-US orgs without an EIN.'},
 {k:'blurb', l:'Description', pub:1, cat:'Identity & Basic Info', core:1, desc:'Full narrative description of the org and its work.'},
 {k:'tagline', l:'Tagline', pub:1, core:1, cat:'Identity & Basic Info', desc:'One-sentence summary shown on compact views like menu cards.'},
 {k:'hq', l:'Headquarters', pub:1, cat:'Identity & Basic Info', core:1, desc:'Registered HQ location.'},
 {k:'contactEmail', l:'Contact Email', cat:'Identity & Basic Info', desc:'Primary contact at the org for grant and donor coordination.'},
 {k:'fiscalSponsor', l:'Intermediary (Fiscal Sponsor)', cat:'Identity & Basic Info', desc:'Fiscal sponsor or intermediary name, if the org isn\'t a direct 501(c)(3) or local equivalent.'},
 {k:'orgType', l:'Org Type', pub:1, cat:'Identity & Basic Info', sel:['Direct Service','Systems Change','Research & Policy','Market-Based','Meta'], core:1, desc:'Organization model type.'},
 {k:'visibility', l:'Display on site', cat:'Identity & Basic Info', sel:['shown','hidden'], desc:'shown = appears in the library, globe, marquee, and briefs. hidden = tracked in Data Studio only, invisible to members until you flip it. New organizations start hidden.'},
 {k:'founded', l:'Start Date/Year', pub:1, cat:'Identity & Basic Info', num:1, nocomma:1, core:1, desc:'Year the org was founded.'},
 {k:'yearsOp', l:'Years in Operation', cat:'Identity & Basic Info', ro:1, fx:o=>2026-(+o.founded||2026), desc:'Auto-calculated from Start Date/Year.'},
 // Classification & Focus
 {k:'causes', l:'Cause Categories', pub:1, cat:'Classification & Focus', arr:1, core:1, desc:'Pipe/semicolon-separated cause categories (first = primary): '+'Global Health | Poverty & Livelihoods | Education | Agriculture & Food | Water & Sanitation | Climate & Environment | Animal Welfare | Mental Health | Rights & Justice | Humanitarian Relief'},
 {k:'sdgs', l:'SDGs', cat:'Classification & Focus', arr:1, desc:'UN Sustainable Development Goals the org\'s work maps to.'},
 {k:'demographicFocus', l:'Demographic Focus', cat:'Classification & Focus', desc:'Who the org serves (age, gender, income level, refugee status, etc).'},
 {k:'countries', l:'Countries of Operation', pub:1, cat:'Classification & Focus', arr:1, core:1, desc:'All countries where the org runs programs.'},
 {k:'statesOfOperation', l:'States of Operation', cat:'Classification & Focus', arr:1, desc:'Subnational detail for orgs working in specific US states or equivalent regions.'},
 {k:'icp', l:'ICP (Ideal Contributor Profile)', cat:'Classification & Focus', desc:'Type of donor this org is the best fit for (2–4 sentences).'},
 // Intervention & Program
 {k:'interventionImage', l:'Intervention/Demographic Image', pub:1, core:1, cat:'Intervention & Program', img:1, desc:'Photo representing the intervention or the population served. Click the camera to paste a URL or upload.'},
 {k:'interventionName', l:'Intervention Name', cat:'Intervention & Program', desc:'Short name (3–8 words) for the specific program being evaluated.'},
 {k:'interventionDescription', l:'Intervention Description', cat:'Intervention & Program', desc:'Description of the problem and the org\'s solution (2–3 sentences).'},
 {k:'outputUnit', l:'Primary Output Unit', pub:1, cat:'Intervention & Program', core:1, desc:'The org\'s core countable output (nets distributed, meals served, classes taught).'},
 {k:'outputsText', l:'Outputs (What & Count)', cat:'Intervention & Program', desc:'Direct products of activity (meals served, people trained, wells built), with counts.'},
 {k:'outcomesText', l:'Outcomes (What & Count)', cat:'Intervention & Program', desc:'Actual changes in beneficiaries\' lives resulting from those outputs, with counts.'},
 {k:'outcomesList', l:'Outcomes (Compact List)', pub:1, cat:'Intervention & Program', arr:1, core:1, desc:'Lightweight outcomes list without counts, for compact card display.'},
 {k:'howImpactWorks', l:'How Your Impact Works', cat:'Intervention & Program', desc:'Timeline showing how a contribution converts step by step into impact.'},
 {k:'materialsLink', l:'Program Proposal/Materials', cat:'Intervention & Program', desc:'Org-provided supporting materials: proposals, decks, one-pagers.'},
 {k:'grantIntro', l:'Grant Intro', cat:'Intervention & Program', desc:'Standardized write-up used to introduce the org for a specific grant or referral.'},
 {k:'theoryOfChange', l:'Theory of Change', pub:1, cat:'Intervention & Program', core:1, desc:'Narrative causal chain from funding to durable impact.'},
 // Reach, Scale & Financials
 {k:'annualReach', l:'Annual Reach', pub:1, cat:'Reach, Scale & Financials', num:1, core:1, desc:'Number of individuals reached in a given year.'},
 {k:'livesImpacted', l:'Lives Impacted', cat:'Reach, Scale & Financials', num:1, desc:'Headline number used in donor-facing materials for total people impacted.'},
 {k:'outcomeReachRate', l:'Outcome Reach Rate (%)', pub:1, cat:'Reach, Scale & Financials', num:1, unit:'%', desc:'Percent (0–100) of beneficiaries reached who experience the intended outcome.'},
 {k:'annualSpend', l:'Most Recent Annual Total Expenses ($)', pub:1, core:1, cat:'Reach, Scale & Financials', num:1, unit:'$', mult:1e6, desc:'Total organizational expenses in the most recent year (gross — not net of offsets).'},
 {k:'budgetM', l:'Anticipated Next Year Budget ($)', pub:1, cat:'Reach, Scale & Financials', num:1, unit:'$', mult:1e6, core:1, desc:'Anticipated total organization-wide budget for the coming year.'},
 {k:'budgetTier', l:'Budget Tier', cat:'Reach, Scale & Financials', ro:1, fx:o=>{const b=+o.budgetM||0;return b<1?'<$1M':b<5?'$1–5M':b<25?'$5–25M':'$25M+';}, desc:'Bucketed budget range for filtering. Auto-derived from Overall Org Budget.'},
 {k:'revenueOffset', l:'Revenue Offset ($)', cat:'Reach, Scale & Financials', num:1, unit:'$', mult:1e6, desc:'Non-donation revenue that offsets program cost (fees, government contracts, etc).'},
 {k:'commercialRevenue', l:'Commercial Revenue ($)', cat:'Reach, Scale & Financials', num:1, unit:'$', mult:1e6, desc:'Org\'s own earned or commercial revenue, distinct from grants and donations.'},
 {k:'absorbencyM', l:'Absorbency ($)', pub:1, cat:'Reach, Scale & Financials', num:1, unit:'$', mult:1e6, core:1, desc:'Room for additional capital that will be usefully deployed toward producing outcomes in the next few years.'},
 {k:'absorbencyRank', l:'Absorbency Level', pub:1, core:1, cat:'Reach, Scale & Financials', sel:['Low','Medium','High'], desc:'Ranked room for additional capital: low, medium, or high.'},
 {k:'growthCurve', l:'Scale Type', pub:1, cat:'Reach, Scale & Financials', sel:['Flat','Linear','Exponential'], core:1, desc:'Shape of the org\'s growth curve.'},
 {k:'scalePosition', l:'Scale Position (1–10)', cat:'Reach, Scale & Financials', num:1, desc:'Where the org sits on its growth curve.'},
 {k:'stage', l:'Stage', pub:1, cat:'Reach, Scale & Financials', sel:['Pilot','Growth','Scale','Maturity'], core:1, desc:'Lifecycle stage: pilot, growth, scale, or maturity.'},
 {k:'teamSize', l:'Team Size', pub:1, core:1, cat:'Reach, Scale & Financials', sel:['<10','10-50','50-100','100+'], desc:'Staff count range.'},
 {k:'potentialForScale', l:'Potential for Scale', pub:1, core:1, cat:'Reach, Scale & Financials', sel:RATE5, desc:'Rating of scalability. Pairs with Assessment of Growth/Scalability and Fit.'},
 {k:'payerAtScaleInterest', l:'Payer-at-Scale Interest', cat:'Reach, Scale & Financials', desc:'Degree of interest from institutional payers (governments, insurers, multilaterals).'},
 {k:'governmentAdoption', l:'Government Adoption', cat:'Reach, Scale & Financials', desc:'Whether and how much government has adopted or funded the approach.'},
 {k:'franchiseReplication', l:'Franchise/Replication by Other NGOs', cat:'Reach, Scale & Financials', desc:'Whether other organizations have successfully replicated or franchised the model.'},
 // Impact Measurement & Cost-Effectiveness
 {k:'sufferMin', l:'Suffering Min (1–10)', pub:1, cat:'Impact & Cost-Effectiveness', num:1, core:1, desc:'Beneficiary state BEFORE the intervention.\n\n'+STATE_LADDER},
 {k:'flourishMax', l:'Flourishing Max (1–10)', pub:1, cat:'Impact & Cost-Effectiveness', num:1, core:1, desc:'Maximum beneficiary state AFTER the intervention.\n\n'+STATE_LADDER},
 {k:'depthOfIntervention', l:'Depth of Intervention (1–10)', cat:'Impact & Cost-Effectiveness', num:1, desc:'Depth of the outcome (1 = minor/singular … 10 = major/life-altering).'},
 {k:'impactLongevity', l:'Impact Longevity (1–10)', cat:'Impact & Cost-Effectiveness', num:1, desc:'Duration of outcomes (1 = under 6 months … 10 = permanent/lifelong).'},
 {k:'innovativeness', l:'Innovativeness (1–5)', pub:1, core:1, cat:'Impact & Cost-Effectiveness', num:1, desc:'How novel the approach is relative to standard practice.'},
 {k:'abstraction', l:'Abstraction (1–5)', pub:1, core:1, cat:'Impact & Cost-Effectiveness', num:1, desc:'How direct vs. diffuse the causal chain from funding to impact is (1 = tangible/direct, 5 = systemic/inferential).'},
 {k:'costPerOutcome', l:'Cost per Outcome ($)', pub:1, cat:'Impact & Cost-Effectiveness', num:1, unit:'$', core:1, desc:'Average dollar cost per outcome delivered.'},
 {k:'costPerOutput', l:'Cost per Output ($)', pub:1, cat:'Impact & Cost-Effectiveness', num:1, unit:'$', core:1, desc:'Dollar cost per output unit (net distributed, meal served), where applicable.'},
 {k:'costCalcExplanation', l:'Cost per Outcome Calculation & Explanation', cat:'Impact & Cost-Effectiveness', desc:'The math and assumptions behind the cost per outcome figure.'},
 {k:'estCostEffectiveness', l:'Estimated Cost-Effectiveness', cat:'Impact & Cost-Effectiveness', desc:'General slot for the fitting metric ($/DALY, $/life, $/animal reached) when Cost per Outcome doesn\'t map cleanly.'},
 // Evaluation, Evidence & Assessment
 {k:'confidence', l:'Confidence in Org\'s Outcomes', pub:1, cat:'Evaluation & Evidence', sel:['High','Moderate','Emerging'], core:1, desc:'Confidence that stated outcomes are real and attributable.'},
 {k:'vettingStatus', l:'Vetting/Evaluation Status', pub:1, core:1, cat:'Evaluation & Evidence', sel:['Fully vetted','Vetted','In pipeline','Not started'], desc:'Where the org sits in the diligence pipeline.'},
 {k:'overallRating', l:'Overall Rating', cat:'Evaluation & Evidence', sel:RATE5, desc:'Single top-line rating summarizing the org\'s evaluation.'},
 {k:'ceRating', l:'Cost Effectiveness Rating', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'Score specifically for cost effectiveness, separate from the raw Cost per Outcome number.'},
 {k:'ceRationale', l:'Cost Effectiveness Rationale', cat:'Evaluation & Evidence', desc:'Written explanation behind the cost effectiveness rating.'},
 {k:'interventionEvidenceQuality', l:'Intervention Evidence Quality', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'Strength of the evidence base for this type of intervention generally.'},
 {k:'orgEvidenceQuality', l:'Organization Evidence Quality', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'Strength of the evidence specifically for this org\'s execution and results.'},
 {k:'whyWeLike', l:'Impact Team\'s Take', pub:1, core:1, cat:'Evaluation & Evidence', desc:'The impact team\'s honest read on this org — leads the Deeper insights tab of the brief, color-coded by Like Level.'},
 {k:'likeLevel', l:'Like Level', pub:1, core:1, cat:'Evaluation & Evidence', sel:['Against funding','Dislike','Unsure','Neutral','Like','Strong like','One of our favorites'], desc:'How much the impact team likes this org — colors the Impact Team\'s Take on the brief.'},
 {k:'assessmentProblem', l:'Assessment of Problem', cat:'Evaluation & Evidence', desc:'Narrative evaluation of the problem being addressed.'},
 {k:'assessmentTeam', l:'Assessment of Team & Leadership', cat:'Evaluation & Evidence', desc:'Narrative evaluation of the org\'s leadership and team quality.'},
 {k:'assessmentTrackRecord', l:'Assessment of Track Record & Approach', cat:'Evaluation & Evidence', desc:'Narrative evaluation of past performance and methodology.'},
 {k:'assessmentGrowth', l:'Assessment of Growth/Scalability & Fit', cat:'Evaluation & Evidence', desc:'Narrative evaluation of scalability and strategic fit.'},
 {k:'assessmentCE', l:'Assessment of Cost Effectiveness & Leverage', cat:'Evaluation & Evidence', desc:'Narrative evaluation of cost effectiveness and funding leverage.'},
 {k:'teamRating', l:'Team & Leadership Rating', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'Star rating for leadership and team quality, shown in the Factory for Good assessment on the brief. Until set, the brief shows a provisional placeholder.'},
 {k:'importance', l:'Importance', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'How large and severe the problem is.'},
 {k:'tractability', l:'Tractability', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'How solvable the problem is with more resources.'},
 {k:'neglectedness', l:'Neglectedness', pub:1, core:1, cat:'Evaluation & Evidence', sel:RATE5, desc:'How overlooked the problem or approach is relative to its scale.'},
 {k:'contextNotes', l:'Context', pub:1, core:1, cat:'Evaluation & Evidence', desc:'Background and situational factors relevant to interpreting the org\'s work.'},
 {k:'evidenceRating', l:'Evidence', cat:'Evaluation & Evidence', sel:RATE5, desc:'General evidence-base rating for the case as a whole.'},
 // Funding Status & Gap
 {k:'cashRaised', l:'Cash Raised ($)', cat:'Funding Status & Gap', num:1, unit:'$', desc:'Amount raised so far toward the org\'s 3-year budget.'},
 {k:'cashNeeded', l:'Cash Needed ($)', cat:'Funding Status & Gap', num:1, unit:'$', desc:'Total 3-year budget requirement.'},
 {k:'remainingGap', l:'Best Guess Remaining Gap ($)', cat:'Funding Status & Gap', ro:1, fx:o=>'$'+Math.max(0,(+o.cashNeeded||0)-(+o.cashRaised||0)).toLocaleString(), desc:'Auto-calculated: Cash Needed − Cash Raised.'},
 {k:'overallFundingGap', l:'Overall Funding Gap ($)', cat:'Funding Status & Gap', num:1, unit:'$', desc:'Total funding gap figure, if different in scope from Best Guess Remaining Gap.'},
 {k:'raisedM', l:'Raised — Current Goal ($)', pub:1, cat:'Funding Status & Gap', num:1, unit:'$', mult:1e6, core:1, desc:'Raised toward the current fundraise goal shown on the brief.'},
 {k:'goalM', l:'Current Goal ($)', pub:1, cat:'Funding Status & Gap', num:1, unit:'$', mult:1e6, core:1, desc:'Current fundraise goal shown on the brief.'},
 {k:'timePeriod', l:'Time Period Covered', pub:1, core:1, cat:'Funding Status & Gap', desc:'Time window the budget and funding gap figures apply to.'},
 // Links, Materials & Metadata
 {k:'dataRoomLink', l:'Data Room Link', pub:1, core:1, cat:'Links & Metadata', desc:'Link to the org\'s due diligence data room.'},
 {k:'costCalcLink', l:'Link to Cost per Calculation', cat:'Links & Metadata', desc:'Link to the underlying cost-per-outcome workbook or calculation.'},
 {k:'assessmentLink', l:'Assessment Link', cat:'Links & Metadata', desc:'Link to the full internal assessment document.'},
 {k:'givesparkLink', l:'GiveSpark Link', pub:1, core:1, cat:'Links & Metadata', desc:'Link to the org\'s listing on GiveSpark, if applicable.'},
 {k:'recommendationLink', l:'Recommendation Link', cat:'Links & Metadata', desc:'Link to a formal external recommendation or reference for the org.'},
 {k:'videoLink', l:'Video Link', cat:'Links & Metadata', desc:'Link to a video about the org or intervention.'},
 {k:'lastUpdated', l:'Last Updated', cat:'Links & Metadata', desc:'Date this record was last refreshed (YYYY-MM-DD).'},
 {k:'sources', l:'Supported By (Funders/Evaluators)', pub:1, cat:'Links & Metadata', arr:1, core:1, desc:'Evaluators and funders that approve of the org. Semicolon-separated; shown as tiles on the brief.'},
 {k:'orgNotes', l:'Notes, Flags, Questions', pub:1, core:1, cat:'Links & Metadata', desc:'Notes, flags, and open questions — shown under Notes & flags on the brief\'s Deeper insights.'},
];
const ED_CATS = ['Core', ...[...new Set(FIELDS.map(f=>f.cat))], 'All fields'];
const edState = {q:'', tier:'', group:'Core', solo:null};
function activeCols(){
  let cols;
  if (edState.group==='All fields') cols = FIELDS;
  else if (edState.group==='Core') cols = FIELDS.filter(f=>f.core||f.k==='name');
  else cols = [FIELDS.find(f=>f.k==='name'), ...FIELDS.filter(f=>f.cat===edState.group && f.k!=='name')];
  return cols.filter(f=>f.k!=='visibility');   // rendered as the Show toggle, not a column
}

/* ---- comments (threaded, resolvable) & notes (lightweight cell annotations) ---- */
const NOTES = [];            // comments (org cells AND donor profiles; may carry @mentions)
const CELLNOTES = {};        // notes: `${orgId}:${k}` -> text

/* ---- team @mentions ---- */
function teamMembers(){
  const out = new Set();
  try{ (DB.donors||[]).filter(d=>d.role==='staff' && d.fullName).forEach(d=>out.add(d.fullName)); }catch(e){}
  if (window.APP && APP.profile && APP.profile.full_name) out.add(APP.profile.full_name);
  if (!out.size) ['Conner Simmons','Truman Wells','Sam Staff'].forEach(n=>out.add(n));
  return ['FFG Team', ...out];   // @FFG Team reaches everyone
}
function extractMentions(text){
  return teamMembers().filter(n=>{
    const first = n.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return text.includes('@'+n) || new RegExp('@'+first+'(\\b|$)','i').test(text);
  });
}
function mentionHTML(text){
  let h = esc(text);
  teamMembers().forEach(n=>{
    const safe = n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const first = n.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    h = h.replace(new RegExp('@('+safe+'|'+first+')','gi'), '<span class="mention">@$1</span>');
  });
  return h;
}
function mentionChipsHTML(target){
  return `<div class="tagrow"><span class="muted" style="font-size:10.5px">Tag:</span>${teamMembers().map(n=>
    `<button class="tag-chip" onclick="const t=document.querySelector('${target}');t.value=(t.value?t.value.replace(/\\s*$/,' '):'')+'@${esc(n)} ';t.focus()">@${esc(n.split(' ')[0])}</button>`).join('')}</div>`;
}
window._cmWho = '';

/* ---- org review workflow: invite submission → review queue → reviewed ---- */
const WFLOG = [];   // action history: {kind:'submission'|'request'|'review', orgId, orgName, by, date}
function wfMe(){ return (window.APP && APP.profile && APP.profile.full_name) || MEMBER.fullName || 'Staff'; }
function initialsOf(n){ return String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').join('').toUpperCase().slice(0,3); }
function wfLog(kind, o){
  const ev = {kind, orgId:o.id, orgName:o.name, by:wfMe(), date:new Date().toISOString().slice(0,10)};
  WFLOG.unshift(ev);
  if (window.PERSIST && PERSIST.wfEvent) PERSIST.wfEvent(ev);
  return ev;
}
function wfRetract(kind, o){
  // withdrawing an unfulfilled request removes it from every tally
  const i = WFLOG.findIndex(e=>e.kind===kind && e.orgId===o.id);
  if (i>=0){
    const [ev] = WFLOG.splice(i,1);
    if (ev.dbId && window.PERSIST && PERSIST.wfEventDelete) PERSIST.wfEventDelete(ev.dbId);
    else ev._retracted = true;   // save round-trip still in flight — deleted as soon as its id arrives
  }
}
window.wfAction = function(orgId, kind){
  const o = byId(orgId); if (!o) return;
  const me = wfMe(), date = new Date().toISOString().slice(0,10);
  const wf = o.workflow = Object.assign({}, o.workflow);
  if (kind==='sub'){
    if (wf.sub){ delete wf.sub; wfRetract('submission', o); flash('Submission invite withdrawn — removed from the tallies'); }
    else { wf.sub = {by:me, date}; wfLog('submission', o); flash('Submission of org data invited — '+o.name); wfOfferAssign(o, 'sub'); }
  }
  if (kind==='req'){
    if (wf.req){ delete wf.req; wfRetract('request', o); flash(o.name+' removed from the review queue — request not counted'); }
    else {
      wf.req = {by:me, date}; wfLog('request', o);
      if (wf.sub){ wf.subDone = wf.sub; delete wf.sub; flash(o.name+': submission fulfilled → review queued'); }
      else flash(o.name+' added to the review queue');
      wfOfferAssign(o, 'req');
    }
  }
  if (kind==='done'){
    // integrity rules: the first review needs an open request (no single-person
    // sign-off straight from a submission), and nobody reviews their own request
    const firstTime = !wf.done && !wf.doneBy;
    if (!wf.req && firstTime){
      flash('Request a review first — an organization\'s first review must fulfil an open review request'); return;
    }
    if (wf.req && wf.req.by === me){
      flash('Two sets of eyes: you requested this review, so a different team member must perform it'); return;
    }
    // a review COUNTS toward the team-activity totals only when it fulfils an
    // open (re-)request; otherwise it just refreshes the review date + history
    const counted = !!wf.req;
    wf.done = {by:me, date};
    wf.doneBy = Object.assign({}, wf.doneBy, {[me]: date});   // each member's most recent review
    if (wf.req){ wf.reqDone = wf.req; delete wf.req; }
    if (wf.sub){ wf.subDone = wf.sub; delete wf.sub; }        // a review also fulfills an open submission invite
    wfLog(counted ? 'review' : 'review0', o);
    flash(counted ? o.name+' reviewed — request fulfilled and counted'
                  : o.name+' review date updated (no open request — not added to the tallies)');
  }
  if (window.PERSIST){ PERSIST.orgField ? PERSIST.orgField(o, 'workflow', o.workflow) : PERSIST.org(o); }
  updateNoteCnt(); renderEdRows();
  if ($('#notesDrawer').classList.contains('show')) renderNotesPanel();
  if ($('#reviewDrawer') && $('#reviewDrawer').classList.contains('show')) renderReviewPanel();
};
/* optional assignee for a fresh submission invite / review request */
function wfOfferAssign(o, kind){
  const menu = $('#ctxMenu'); if (!menu) return;
  const ev = window.event;
  const x = ev && ev.clientX ? Math.min(innerWidth-240, ev.clientX) : Math.round(innerWidth/2)-110;
  const y = ev && ev.clientY ? Math.min(innerHeight-240, ev.clientY+10) : 160;
  const people = teamMembers().filter(n=>n!=='FFG Team');
  menu.innerHTML = `<div style="font-size:11px;color:var(--ink-3);padding:7px 12px 3px">Assign this ${kind==='sub'?'submission':'review'} to… <span style="opacity:.7">(optional)</span></div>`
    + people.map(n=>`<button onclick="wfAssign(${o.id},'${kind}','${esc(n).replace(/'/g,"\\'")}')"><b>${esc(initialsOf(n))}</b> ${esc(n)}</button>`).join('')
    + `<div class="sep"></div><button onclick="document.querySelector('#ctxMenu').style.display='none'">No assignee</button>`;
  menu.style.display = 'block';
  menu.style.left = x+'px'; menu.style.top = y+'px';
}
window.wfAssign = function(orgId, kind, name){
  const menu = $('#ctxMenu'); if (menu) menu.style.display = 'none';
  const o = byId(orgId); if (!o || !o.workflow) return;
  const slot = kind==='sub' ? o.workflow.sub : o.workflow.req;
  if (!slot){ return; }
  slot.assignee = name;
  if (window.PERSIST){ PERSIST.orgField ? PERSIST.orgField(o, 'workflow', o.workflow) : PERSIST.org(o); }
  renderEdRows();
  if ($('#reviewDrawer') && $('#reviewDrawer').classList.contains('show')) renderReviewPanel();
  flash((kind==='sub'?'Submission':'Review')+' assigned to '+name);
};
function wfDaysOld(d){ try{ return Math.floor((Date.now() - new Date(d+'T00:00:00').getTime())/864e5); }catch(e){ return 0; } }
function wfLate(o){
  const wf = o.workflow || {};
  return (wf.sub && wfDaysOld(wf.sub.date)>=6) || (wf.req && wfDaysOld(wf.req.date)>=6);
}
function wfTipHTML(o){
  const wf = o.workflow || {};
  const row = (label, e, late)=> e ? `<div style="display:flex;justify-content:space-between;gap:14px"><span style="color:var(--ink-3)">${label}</span><b ${late?'style="color:#C0392B"':''}>${initialsOf(e.by)} · ${e.date}${late?' · '+wfDaysOld(e.date)+'d waiting':''}</b></div>` : '';
  const members = Object.entries(wf.doneBy||{}).sort((a,b)=>b[1]<a[1]?-1:1);
  const body = [
    row('Submission invited', wf.sub || wf.subDone, wf.sub && wfDaysOld(wf.sub.date)>=6),
    row('Review requested', wf.req || wf.reqDone, wf.req && wfDaysOld(wf.req.date)>=6),
    row('Most recent review', wf.done),
    members.length>1 ? members.map(([n,d])=>`<div style="display:flex;justify-content:space-between;gap:14px;padding-left:10px"><span style="color:var(--ink-3)">↳ ${initialsOf(n)} last reviewed</span><b>${d}</b></div>`).join('') : '',
  ].filter(Boolean).join('');
  return `<div style="min-width:220px"><b>${esc(o.name)} — workflow</b><div style="margin-top:5px;display:flex;flex-direction:column;gap:3px;font-size:12px">${body || '<span style="color:var(--ink-3)">No workflow activity yet.</span>'}</div></div>`;
}
window.wfTip = function(ev, orgId){ const o = byId(orgId); if (o) showTip(wfTipHTML(o), ev.clientX, ev.clientY); };
function wfWeekStart(){ const d = new Date(); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.toISOString().slice(0,10); }
function wfMonthStart(){ return new Date().toISOString().slice(0,8)+'01'; }

/* ---- comment composer helpers: @typeahead (Tab completes) + Ctrl/Cmd+Enter submits ---- */
function wireComposer(ta, submitSel, withMentions=true){
  if (!ta) return;
  let ac = null, matches = [], hi = 0;
  const closeAc = ()=>{ ac?.remove(); ac = null; matches = []; };
  const currentToken = ()=>{
    const upto = ta.value.slice(0, ta.selectionStart ?? ta.value.length);
    const m = upto.match(/@([A-Za-z][A-Za-z ]*)?$/);
    return m ? {typed:(m[1]||''), start: upto.length-(m[0].length)} : null;
  };
  const complete = (name)=>{
    const tok = currentToken(); if (!tok) return;
    const tail = ta.value.slice(ta.selectionStart ?? ta.value.length);
    ta.value = ta.value.slice(0, tok.start) + '@' + name + ' ' + tail;
    const pos = tok.start + name.length + 2;
    ta.setSelectionRange(pos, pos);
    closeAc(); ta.dispatchEvent(new Event('input'));
  };
  const paint = ()=>{
    if (!matches.length){ closeAc(); return; }
    if (!ac){
      ac = document.createElement('div'); ac.className = 'ac-pop';
      document.body.appendChild(ac);
    }
    const r = ta.getBoundingClientRect();
    ac.style.left = r.left+'px'; ac.style.top = (r.bottom+4)+'px'; ac.style.minWidth = Math.min(r.width,260)+'px';
    ac.innerHTML = matches.map((n,i)=>`<div class="ac-i ${i===hi?'hi':''}" data-n="${esc(n)}">@${esc(n)}${i===hi?'<span class="k">Tab</span>':''}</div>`).join('');
    ac.querySelectorAll('.ac-i').forEach(el=>el.addEventListener('mousedown', e=>{ e.preventDefault(); complete(el.dataset.n); }));
  };
  if (withMentions){
    ta.addEventListener('input', ()=>{
      const tok = currentToken();
      if (!tok){ closeAc(); return; }
      const t = tok.typed.toLowerCase();
      matches = teamMembers().filter(n=>{
        if (!t) return true;
        return n.toLowerCase().startsWith(t) || n.split(' ').some(w=>w.toLowerCase().startsWith(t));
      }).slice(0,6);
      hi = 0; paint();
    });
    ta.addEventListener('blur', ()=>setTimeout(closeAc, 150));
  }
  ta.addEventListener('keydown', e=>{
    if ((e.ctrlKey || e.metaKey) && e.key==='Enter'){
      e.preventDefault(); closeAc(); document.querySelector(submitSel)?.click(); return;
    }
    if (!withMentions || !matches.length) return;
    if (e.key==='Tab' || e.key==='Enter'){ e.preventDefault(); complete(matches[hi]); }
    else if (e.key==='ArrowDown'){ e.preventDefault(); hi = (hi+1)%matches.length; paint(); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); hi = (hi-1+matches.length)%matches.length; paint(); }
    else if (e.key==='Escape'){ closeAc(); }
  });
}
window.wireComposer = wireComposer;
let noteSeq = 1;
const noteFor = (orgId,k) => NOTES.find(n=>n.orgId===orgId && n.k===k && !n.resolved);
const cellNoteKey = (orgId,k) => orgId+':'+k;
let drTab = 'comments';
/* open comment threads where the signed-in teammate is tagged (directly or via @FFG Team) */
function myTaggedThreads(){
  const me = wfMe();
  const byKey = {};
  NOTES.filter(n=>!n.resolved).forEach(n=>{
    const key = n.donorId ? 'd:'+n.donorId : 'o:'+n.orgId+':'+n.k;
    (byKey[key] = byKey[key]||[]).push(n);
  });
  return Object.values(byKey).filter(msgs=>msgs.some(n=>(n.mentions||[]).some(m=>m===me||m==='FFG Team')));
}
window.openMyTagged = function(){
  window._cmWho = wfMe();
  if (!location.hash.startsWith('#/editor')) go('#/editor');
  drTab = 'comments'; renderNotesPanel();
  $('#notesDrawer').classList.add('show'); $('#drawerVeil').classList.add('show');
};
function updateTagBell(){
  const t = myTaggedThreads().length;
  const right = document.querySelector('.top-right');
  let bell = $('#tagBell');
  if (!bell && right){
    right.insertAdjacentHTML('afterbegin',
      `<button id="tagBell" class="cartbtn" style="display:none" title="Open comment threads where you are tagged — click to see them" onclick="openMyTagged()">🔔 <span class="cnt" id="tagBellCnt" style="display:inline-block">0</span></button>`);
    bell = $('#tagBell');
  }
  if (bell){
    bell.style.display = (window.APP && APP.staff && t) ? '' : 'none';
    const c = $('#tagBellCnt'); if (c) c.textContent = t;
  }
  const btn = $('#edNotes');
  if (btn){
    let chip = btn.querySelector('.tagchip');
    if (t){ if (!chip){ btn.insertAdjacentHTML('beforeend', '<span class="tagchip"></span>'); chip = btn.querySelector('.tagchip'); }
      chip.textContent = t + ' for you'; }
    else chip?.remove();
  }
}
window.updateTagBell = updateTagBell;
function updateNoteCnt(){
  updateTagBell();
  const c = NOTES.filter(x=>!x.resolved).length;
  const n = Object.keys(CELLNOTES).length;
  const rq = ORGS.filter(o=>o.workflow && o.workflow.req).length;
  const rEl = $('#edRevCnt'); if (rEl) rEl.textContent = rq ? '('+rq+')' : '';
  $('#edNoteCnt').textContent = (c||n)?`· ${c}${n?' + '+n+'📝':''}`:'';
}
/* context menu (google-sheets style: comment vs note) */
function openCtxMenu(td, orgId, k, x, y){
  const menu = $('#ctxMenu');
  const hasNote = cellNoteKey(orgId,k) in CELLNOTES;
  const nComments = NOTES.filter(n=>n.orgId===orgId&&n.k===k&&!n.resolved).length;
  const o = byId(orgId);
  menu.innerHTML = `
    <button id="cmComment">💬 ${nComments?`View comments (${nComments}) / reply`:'Add comment'}</button>
    <div class="sep"></div>
    <button id="cmNote">📝 ${hasNote?'Edit note':'Add note'}</button>
    ${hasNote?'<button id="cmDelNote" style="color:var(--crit)">Delete note</button>':''}
    <div class="sep"></div>
    <button id="cmLog">🗒 Org log — calls, meetings &amp; notes</button>
    ${o&&o.archived
      ? '<button id="cmArchive" style="color:var(--good)">↩ Restore organization</button>'
      : '<button id="cmArchive" style="color:var(--crit)">🗄 Archive organization…</button>'}`;
  menu.style.display='block';
  menu.style.left = Math.min(innerWidth-200, x)+'px';
  menu.style.top = Math.min(innerHeight-140, y)+'px';
  menu.querySelector('#cmComment').onclick = ()=>{ menu.style.display='none'; openNotePop(td, orgId, k, x, y); };
  menu.querySelector('#cmNote').onclick = ()=>{ menu.style.display='none'; openCellNotePop(td, orgId, k, x, y); };
  const del = menu.querySelector('#cmDelNote');
  if (del) del.onclick = ()=>{ menu.style.display='none'; delete CELLNOTES[cellNoteKey(orgId,k)];
    td.classList.remove('has-cellnote'); updateNoteCnt(); renderNotesPanel(); flash('Note deleted'); };
  menu.querySelector('#cmLog').onclick = ()=>{ menu.style.display='none'; openOrgLog(orgId); };
  menu.querySelector('#cmArchive').onclick = ()=>{ menu.style.display='none';
    (o&&o.archived) ? restoreOrg(orgId) : archiveOrg(orgId); };
}
function openCellNotePop(td, orgId, k, x, y){
  const pop = $('#notePop');
  const key = cellNoteKey(orgId,k);
  const o = byId(orgId), col = FIELDS.find(f=>f.k===k);
  pop.innerHTML = `<div class="kicker" style="color:#9fb4d8">Note · ${esc(o?.name||'')} · ${esc(col?.l||k)}</div>
    <textarea id="cnTxt" placeholder="Add a note — visible on hover, like a Sheets note…">${esc(CELLNOTES[key]||'')}</textarea>
    <div class="acts"><button class="btn" onclick="$('#notePop').style.display='none'">Cancel</button>
    <button class="btn primary" id="cnSave">Save note</button></div>`;
  pop.style.display='block';
  pop.style.left = Math.min(innerWidth-320, x)+'px';
  pop.style.top = Math.min(innerHeight-220, y)+'px';
  pop.querySelector('#cnSave').addEventListener('click', ()=>{
    const t = pop.querySelector('#cnTxt').value.trim();
    if (t){ CELLNOTES[key] = t; td.classList.add('has-cellnote'); flash('Note saved'); }
    else { delete CELLNOTES[key]; td.classList.remove('has-cellnote'); }
    updateNoteCnt(); renderNotesPanel();
    pop.style.display='none';
  });
  wireComposer(pop.querySelector('#cnTxt'), '#cnSave', false);   // Ctrl/Cmd+Enter saves the note
  pop.querySelector('#cnTxt').focus();
}
function openNotePop(td, orgId, k, x, y){
  const pop = $('#notePop');
  const existing = NOTES.filter(n=>n.orgId===orgId && n.k===k && !n.resolved);
  const o = byId(orgId), col = FIELDS.find(f=>f.k===k);
  pop.innerHTML = `<div class="kicker">${esc(o?.name||'')} · ${esc(col?.l||k)}</div>
    ${existing.length?`<div style="max-height:230px;overflow:auto;overscroll-behavior:contain;margin-bottom:2px">
    ${existing.map(n=>`<div style="font-size:12.5px;color:var(--ink-2);padding:7px 0;border-bottom:1px solid var(--hairline)">${mentionHTML(n.text)}
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-3);margin-top:3px"><span>${esc(n.author)}</span>
      <span class="res" style="color:var(--good);cursor:pointer" onclick="resolveNote(${n.id})">✓ Resolve</span></div></div>`).join('')}</div>`:''}
    <textarea id="noteTxt" placeholder="Leave a comment for the team… use @ to tag a teammate"></textarea>
    ${mentionChipsHTML('#noteTxt')}
    <div class="acts"><button class="btn" onclick="$('#notePop').style.display='none'">Cancel</button>
    <button class="btn primary" id="noteSave">Comment</button></div>`;
  pop.style.display='block';
  pop.style.left = Math.min(innerWidth-320, x)+'px';
  pop.style.top = Math.min(innerHeight-240, y)+'px';
  // keep the whole popover on screen — long threads scroll inside instead of
  // pushing the composer off the bottom
  requestAnimationFrame(()=>{
    const r = pop.getBoundingClientRect();
    if (r.bottom > innerHeight - 12) pop.style.top = Math.max(12, innerHeight - r.height - 16)+'px';
    if (r.right > innerWidth - 12) pop.style.left = Math.max(12, innerWidth - r.width - 16)+'px';
  });
  pop.querySelector('#noteSave').addEventListener('click', ()=>{
    const t = pop.querySelector('#noteTxt').value.trim();
    if (t){
      NOTES.push({id:noteSeq++, orgId, k, text:t, author:MEMBER.fullName, resolved:false, mentions:extractMentions(t)});
      td.classList.add('has-note'); updateNoteCnt(); renderNotesPanel(); flash('Comment added');
    }
    pop.style.display='none';
  });
  wireComposer(pop.querySelector('#noteTxt'), '#noteSave');
  pop.querySelector('#noteTxt').focus();
}
window.toggleThreadReply = function(kid){
  const box = $('#rp-'+kid); if (!box) return;
  const on = box.style.display==='none';
  box.style.display = on ? 'block' : 'none';
  if (on){ const ta = $('#rpt-'+kid); wireComposer(ta, '#rpb-'+kid); ta.focus(); }
};
window.sendThreadReply = function(key, kid){
  const ta = $('#rpt-'+kid); if (!ta) return;
  const t = ta.value.trim(); if (!t){ flash('Write the reply first'); return; }
  const seed = NOTES.find(n=>!n.resolved && (n.donorId ? 'd:'+n.donorId : 'o:'+n.orgId+':'+n.k) === key);
  if (!seed) return;
  const nn = {id:noteSeq++, orgId:seed.orgId??null, donorId:seed.donorId||null, donorName:seed.donorName,
    k:seed.k, text:t, author:wfMe(), resolved:false, mentions:extractMentions(t)};
  NOTES.push(nn); window.PERSIST && PERSIST.comment(nn);
  updateNoteCnt(); renderNotesPanel();
  const td = seed.orgId ? document.querySelector(`#edBody tr[data-id="${seed.orgId}"] td[data-k="${seed.k}"]`) : null;
  if (td) td.classList.add('has-note');
  flash('Reply added to the thread');
};
window.resolveThread = function(key){
  NOTES.filter(n=>!n.resolved && (n.donorId ? 'd:'+n.donorId : 'o:'+n.orgId+':'+n.k) === key)
    .forEach(n=>{ n.resolved = true; window.PERSIST && PERSIST.resolveComment(n); });
  updateNoteCnt(); renderNotesPanel(); renderEdRows();
  flash('Thread resolved');
};
function resolveNote(id){
  const n = NOTES.find(x=>x.id===id); if(!n) return;
  n.resolved = true; updateNoteCnt(); renderNotesPanel();
  $('#notePop').style.display='none';
  const td = document.querySelector(`#edBody tr[data-id="${n.orgId}"] td[data-k="${n.k}"]`);
  if (td && !noteFor(n.orgId,n.k)) td.classList.remove('has-note');
  flash('Comment resolved');
}
function renderNotesPanel(){
  const open = NOTES.filter(n=>!n.resolved);
  const noteKeys = Object.keys(CELLNOTES);
  $('#notesSub').textContent = `${open.length} open comment${open.length===1?'':'s'} · ${noteKeys.length} note${noteKeys.length===1?'':'s'} · click to jump to the cell`;
  $$('#drTabs button').forEach(b=>b.classList.toggle('active', b.dataset.drtab===drTab));
  if (drTab==='comments'){
    const who = window._cmWho || '';
    // comments on the same cell (or the same donor profile) form ONE thread —
    // replies join it, and the person filter matches if ANY message tags them
    const threads = [];
    const byKey = {};
    open.forEach(n=>{
      const key = n.donorId ? 'd:'+n.donorId : 'o:'+n.orgId+':'+n.k;
      let t = byKey[key];
      if (!t){ t = byKey[key] = {key, msgs:[], first:n}; threads.push(t); }
      t.msgs.push(n);
    });
    const shown = who ? threads.filter(t=>t.msgs.some(n=>(n.mentions||[]).includes(who))) : threads;
    const filterBar = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span class="muted" style="font-size:11px">Tagged:</span>
      <select style="background:var(--surface);border:1px solid var(--divider,var(--hairline));border-radius:8px;padding:5px 9px;font-size:12px;font-family:inherit;color:var(--ink)"
        onchange="window._cmWho=this.value;renderNotesPanel()">
        <option value="">All team members</option>
        ${teamMembers().map(n=>`<option value="${esc(n)}" ${who===n?'selected':''}>@${esc(n)}</option>`).join('')}
      </select>${who?`<span class="muted" style="font-size:11px">${shown.length} of ${threads.length} threads</span>`:''}</div>`;
    $('#notesBody').innerHTML = filterBar + (shown.length ? shown.map(t=>{
      const n = t.first;
      const col = FIELDS.find(f=>f.k===n.k);
      const donorName = n.donorId ? (n.donorName || (window.donorList&&donorList().find(d=>d.id===n.donorId)?.fullName) || 'Member profile') : null;
      const title = donorName
        ? `${esc(donorName)} · <span style="color:var(--gold-2)">Donor studio</span>`
        : `${esc(byId(n.orgId)?.name||'?')} · <span style="color:var(--gold-2)">${esc(col?.l||n.k)}</span>`;
      const jump = donorName ? `closeDrawers();go('#/donors')` : `jumpToCell(${n.orgId},'${n.k}',1)`;
      const kid = t.key.replace(/[^a-zA-Z0-9_-]/g,'_');
      return `<div class="note-item" onclick="${jump}">
        <div class="f">${title}${t.msgs.length>1?` <span class="pill" style="margin-left:6px;font-size:10px">${t.msgs.length} comments</span>`:''}</div>
        ${t.msgs.map(m2=>`<div class="cmsg">${mentionHTML(m2.text)}
          <div class="cmsg-by">${esc(m2.author)}</div></div>`).join('')}
        <div class="m" onclick="event.stopPropagation()">
          <span class="res" onclick="toggleThreadReply('${kid}')">↩ Reply</span>
          <span class="res" onclick="resolveThread('${esc(t.key)}')">✓ Resolve thread</span></div>
        <div id="rp-${kid}" style="display:none;margin-top:7px" onclick="event.stopPropagation()">
          <textarea id="rpt-${kid}" rows="2" placeholder="Reply — @ to tag a teammate, ⌘/Ctrl+Enter to send" style="width:100%;border:1px solid var(--divider,#DEDBD6);border-radius:8px;padding:7px 9px;font:inherit;font-size:12.5px;background:#fff;resize:vertical"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:5px"><button class="btn" style="padding:4px 12px;font-size:12px" id="rpb-${kid}" onclick="sendThreadReply('${esc(t.key)}','${kid}')">Reply</button></div>
        </div>
      </div>`;}).join('')
      : `<div class="muted" style="padding:26px 4px;font-size:13px">${who?'No comment threads tag @'+esc(who)+'.':'No open comments. Right-click any cell (or use 💬 in the Donor studio) to add one.'}</div>`);
    } else {
    $('#notesBody').innerHTML = noteKeys.length ? noteKeys.map(key=>{
      const [orgId, k] = [ +key.split(':')[0], key.split(':').slice(1).join(':') ];
      const o = byId(orgId), col = FIELDS.find(f=>f.k===k);
      return `<div class="note-item is-note" onclick="jumpToCell(${orgId},'${k}')">
        <div class="f">${esc(o?.name||'?')} · <span style="color:#9fb4d8">${esc(col?.l||k)}</span> <span class="muted" style="font-size:10px">NOTE</span></div>
        <div class="txt">${esc(CELLNOTES[key])}</div>
        <div class="m"><span class="muted">hover the cell to read in place</span><span class="res" style="color:var(--crit)" onclick="event.stopPropagation();delete CELLNOTES['${key}'];updateNoteCnt();renderNotesPanel();renderEdRows();flash('Note deleted')">✕ Delete</span></div>
      </div>`;}).join('')
      : '<div class="muted" style="padding:26px 4px;font-size:13px">No notes yet. Right-click any cell and choose 📝 Add note — notes show on hover, like Google Sheets.</div>';
  }
}
$('#drTabs').addEventListener('click', e=>{
  const b = e.target.closest('button[data-drtab]'); if(!b) return;
  drTab = b.dataset.drtab; renderNotesPanel();
});
/* ================= REVIEW QUEUE — standalone drawer ================= */
document.body.insertAdjacentHTML('beforeend', `
<div class="drawer" id="reviewDrawer">
  <div class="dr-head"><div class="kicker">Data studio</div><h3>Review queue</h3>
  <div class="muted" style="font-size:12px" id="reviewSub">Submissions, review requests, and team activity</div>
  <div class="dr-tabs" id="rvTabs">
    <button data-rvtab="sub">Submissions</button>
    <button data-rvtab="req" class="active">Review requests</button>
    <button data-rvtab="done">Reviewed &amp; activity</button>
  </div></div>
  <div class="dr-body" id="reviewBody"></div>
</div>`);
let rvTab = 'req';
$('#rvTabs').addEventListener('click', e=>{
  const b = e.target.closest('button[data-rvtab]'); if (!b) return;
  rvTab = b.dataset.rvtab; renderReviewPanel();
});
function rvItem(o, meta, action){
  return `<div class="note-item" onclick="jumpToCell(${o.id},'name')">
    <div class="f"><b>${esc(o.name)}</b> <span class="pill" style="margin-left:6px">${TIER_LABEL[o.tier]||o.tier}</span></div>
    <div class="m"><span>${meta}</span>${action||''}</div></div>`;
}
function renderReviewPanel(){
  const queue = ORGS.filter(o=>o.workflow && o.workflow.req);
  const subQueue = ORGS.filter(o=>o.workflow && o.workflow.sub);
  const reviewed = ORGS.filter(o=>o.workflow && o.workflow.done)
    .sort((a,b)=> a.workflow.done.date<b.workflow.done.date?1:-1);
  $('#reviewSub').textContent = `${subQueue.length} open invite${subQueue.length===1?'':'s'} · ${queue.length} awaiting review · ${reviewed.length} reviewed`;
  $$('#rvTabs button').forEach(b=>b.classList.toggle('active', b.dataset.rvtab===rvTab));
  const lateBox = (items, kindLabel)=> items.length ? `<div class="rv-box rv-late">
      <div class="rv-title" style="color:#B4544A">⚠ Late — waiting 6+ calendar days</div>
      ${items.map(({o,kind,e})=>`<div class="note-item" style="border-color:rgba(180,84,74,.3)" onclick="jumpToCell(${o.id},'name')">
        <div class="f" style="color:#B4544A"><b>${esc(o.name)}</b> <span class="pill" style="margin-left:6px;border-color:#B4544A;color:#B4544A">${kindLabel} · ${wfDaysOld(e.date)}d</span></div>
        <div class="m"><span>${kind==='review'?'requested':'invited'} by ${initialsOf(e.by)} · ${e.date}</span>
        <span class="res" onclick="event.stopPropagation();wfAction(${o.id},'${kind==='review'?'done':'req'}')">${kind==='review'?'✓ Mark reviewed':'⏳ Move to review'}</span></div>
      </div>`).join('')}</div>` : '';
  let html = '';
  if (rvTab==='sub'){
    const late = subQueue.filter(o=>wfDaysOld(o.workflow.sub.date)>=6).map(o=>({o, kind:'submission', e:o.workflow.sub}));
    html = lateBox(late, 'awaiting submission') + `<div class="rv-box">
      <div class="rv-title">Submission invites · ${subQueue.length}</div>
      ${subQueue.length ? subQueue.map(o=>rvItem(o,
        `invited by ${initialsOf(o.workflow.sub.by)} · ${o.workflow.sub.date} · ${wfDaysOld(o.workflow.sub.date)}d ago${o.workflow.sub.assignee?' · assigned → '+initialsOf(o.workflow.sub.assignee)+' '+esc(o.workflow.sub.assignee):''}`,
        `<span class="res" onclick="event.stopPropagation();wfAction(${o.id},'req')">⏳ Fulfil → request review</span>`)).join('')
      : '<div class="muted" style="font-size:12.5px;padding:6px 2px">No open submission invites. Use the checkbox on any studio row to invite org data.</div>'}</div>`;
  } else if (rvTab==='req'){
    const late = queue.filter(o=>wfDaysOld(o.workflow.req.date)>=6).map(o=>({o, kind:'review', e:o.workflow.req}));
    const byWho = {};
    queue.forEach(o=>{ (byWho[o.workflow.req.by] = byWho[o.workflow.req.by]||[]).push(o); });
    html = lateBox(late, 'awaiting review') + `<div class="rv-box">
      <div class="rv-title">Review queue · ${queue.length}</div>
      ${queue.length ? Object.entries(byWho).sort((a,b)=>a[0].localeCompare(b[0])).map(([who, os])=>`
        <div class="rvh-person" style="margin-top:8px"><b>${initialsOf(who)}</b> <span class="muted">requested by ${esc(who)} · ${os.length}</span></div>
        ${os.map(o=>rvItem(o,
          `requested ${o.workflow.req.date}${o.workflow.req.assignee?` · assigned → ${initialsOf(o.workflow.req.assignee)} ${esc(o.workflow.req.assignee)}`:''}${o.workflow.subDone?` · submission fulfilled (${initialsOf(o.workflow.subDone.by)} ${o.workflow.subDone.date})`:''}`,
          `<span class="res" onclick="event.stopPropagation();wfAction(${o.id},'done')">✓ Mark reviewed</span>`)).join('')}`).join('')
      : '<div class="muted" style="font-size:12.5px;padding:6px 2px">Nothing waiting for review. Click ⏳ on any studio row to queue it.</div>'}</div>`;
  } else {
    const week = wfWeekStart(), month = wfMonthStart();
    const people = {};
    WFLOG.forEach(ev=>{
      const p = people[ev.by] = people[ev.by] || {submission:[0,0,0], request:[0,0,0], review:[0,0,0]};
      const bucket = p[ev.kind]; if (!bucket) return;   // review0 (date-only reviews) never counts
      bucket[2]++; if (ev.date>=month) bucket[1]++; if (ev.date>=week) bucket[0]++;
    });
    const cell = a=>`<span class="num">${a[0]}</span> / <span class="num">${a[1]}</span> / <span class="num">${a[2]}</span>`;
    html = `<div class="rv-box">
      <div class="rv-title">Recently reviewed · ${reviewed.length}</div>
      <div style="max-height:220px;overflow:auto">${reviewed.length ? reviewed.map(o=>{
        const by = Object.entries(o.workflow.doneBy||{[o.workflow.done.by]:o.workflow.done.date}).sort((a,b)=>b[1]<a[1]?-1:1);
        return `<div class="note-item" onmousemove="wfTip(event,${o.id})" onmouseleave="hideTip()" onclick="jumpToCell(${o.id},'name')">
          <div class="f"><b>${esc(o.name)}</b> <span class="pill" style="margin-left:6px">last reviewed ${o.workflow.done.date}</span></div>
          <div class="m"><span>${by.map(([n,d])=>initialsOf(n)+' '+d).join(' · ')}</span></div></div>`;}).join('')
      : '<div class="muted" style="font-size:12.5px;padding:6px 2px">No reviews recorded yet.</div>'}</div></div>
    <div class="rv-box">
      <div class="rv-title">Team activity · week / month / all-time</div>
      <div class="muted" style="font-size:10.5px;margin-bottom:6px">Only reviews that fulfil an open request are counted — re-reviews without a new request update dates and history only.</div>
      ${Object.keys(people).length ? `<table style="width:100%;font-size:11.5px;border-collapse:collapse">
        <tr style="color:var(--ink-3);text-align:left"><th style="font-weight:500;padding:3px 0">Person</th><th style="font-weight:500">Submissions</th><th style="font-weight:500">Review req.</th><th style="font-weight:500">Reviews</th></tr>
        ${Object.entries(people).map(([name,p])=>`<tr style="border-top:1px solid var(--hairline)">
          <td style="padding:5px 0"><b>${initialsOf(name)}</b> <span class="muted">${esc(name)}</span></td>
          <td>${cell(p.submission)}</td><td>${cell(p.request)}</td><td>${cell(p.review)}</td></tr>`).join('')}
      </table>` : '<div class="muted" style="font-size:12px">No workflow activity recorded yet.</div>'}</div>
    <div class="rv-box">
      <div class="rv-title">History · by day, person, and stage</div>
      <div style="max-height:280px;overflow:auto">${(()=>{
        if (!WFLOG.length) return '<div class="muted" style="font-size:12px">—</div>';
        const days = {};
        WFLOG.forEach(ev=>{ const d = days[ev.date] = days[ev.date]||{}; (d[ev.by] = d[ev.by]||[]).push(ev); });
        const stageOrd = {submission:0, request:1, review:2, review0:3};
        const stageTxt = {submission:'invited submission', request:'requested review', review:'reviewed', review0:'logged a review (date only)'};
        return Object.keys(days).sort().reverse().map(d=>`
          <div class="rvh-day"><b>${d}</b></div>
          ${Object.entries(days[d]).sort((a,b)=>a[0].localeCompare(b[0])).map(([person,evs])=>`
            <div class="rvh-person"><b>${initialsOf(person)}</b> <span class="muted">${esc(person)}</span></div>
            ${evs.slice().sort((a,b)=>(stageOrd[a.kind]??9)-(stageOrd[b.kind]??9)).map(ev=>`
              <div class="rvh-line"><span style="color:var(--ink-2)">${stageTxt[ev.kind]||ev.kind}</span> · <b>${esc(ev.orgName||'')}</b></div>`).join('')}`).join('')}`).join('');
      })()}</div></div>`;
  }
  $('#reviewBody').innerHTML = html;
}

function jumpToCell(orgId, k, openComment){
  closeDrawers();
  if (!location.hash.startsWith('#/editor')){ go('#/editor'); }
  const col = FIELDS.find(f=>f.k===k);
  if (edState.group!=='All fields' && !activeCols().some(c=>c.k===k)){
    edState.group = col?.cat || 'All fields'; $('#edGroup').value = edState.group; renderEditor(); }
  edState.q=''; edState.tier=''; edState.rev=''; edState.solo=null;
  $('#edSearch').value=''; $('#edTier').value='';
  const revSel = $('#edRev'); if (revSel) revSel.value='';
  renderEdRows();
  requestAnimationFrame(()=>{
    const td = document.querySelector(`#edBody tr[data-id="${orgId}"] td[data-k="${k}"]`);
    if (td){ td.scrollIntoView({block:'center', inline:'center', behavior: openComment ? 'auto' : 'smooth'});
      td.classList.remove('cell-hi'); void td.offsetWidth; td.classList.add('cell-hi'); }
    if (td && openComment) setTimeout(()=>{
      const sel = `#edBody tr[data-id="${orgId}"] td[data-k="${k}"]`;
      const td2 = document.querySelector(sel) || td;
      const r0 = td2.getBoundingClientRect();
      openNotePop(td2, orgId, k, Math.max(16, Math.min(innerWidth-330, r0.left + 10)), Math.max(70, r0.bottom + 6));
      // glue the popover to the cell while late image loads settle the layout,
      // flipping above the cell whenever there's no room below
      const glue = setInterval(()=>{
        const tdx = document.querySelector(sel), popEl = $('#notePop');
        if (!tdx || popEl.style.display !== 'block'){ clearInterval(glue); return; }
        const r = tdx.getBoundingClientRect(), h = popEl.offsetHeight || 240;
        let top = r.bottom + 6;
        if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 6);
        popEl.style.left = Math.max(16, Math.min(innerWidth - 330, r.left + 10)) + 'px';
        popEl.style.top = Math.max(60, top) + 'px';
      }, 150);
      setTimeout(()=>clearInterval(glue), 1700);
    }, 150);
  });
}
$('#edNotes').addEventListener('click', ()=>{ drTab='comments'; renderNotesPanel(); $('#notesDrawer').classList.add('show'); $('#drawerVeil').classList.add('show'); });
$('#edReviews').addEventListener('click', ()=>{ renderReviewPanel(); $('#reviewDrawer').classList.add('show'); $('#drawerVeil').classList.add('show'); });
document.addEventListener('click', e=>{
  if (e.target.closest('#ctxMenu')) return;   // menu actions open popovers — don't instantly dismiss them
  const pop = $('#notePop');
  if (pop.style.display==='block' && !pop.contains(e.target)) pop.style.display='none';
  const menu = $('#ctxMenu');
  if (menu.style.display==='block' && !menu.contains(e.target)) menu.style.display='none';
});
/* sheets-style hover: hovering a cell with a note and/or open comments
   auto-shows both — the note text plus the latest comments in the thread */
document.addEventListener('mouseover', e=>{
  const td = e.target.closest('#edBody td.has-cellnote, #edBody td.has-note'); if (!td) return;
  const orgId = +td.closest('tr').dataset.id, k = td.dataset.k;
  const parts = [];
  const note = CELLNOTES[cellNoteKey(orgId, k)];
  if (note) parts.push('📝 <b>Note</b> · '+esc(note));
  const cms = NOTES.filter(n=>n.orgId===orgId && n.k===k && !n.resolved);
  if (cms.length){
    const shown = cms.slice(-3);
    parts.push((cms.length>3?`💬 <b>${cms.length} comments</b> (latest ${shown.length})`:`💬 <b>Comment${cms.length===1?'':'s'}</b>`)
      + shown.map(n=>`<div style="margin-top:3px"><b>${esc(initialsOf(n.author||''))}</b> ${esc(n.text.length>160?n.text.slice(0,158)+'…':n.text)}</div>`).join('')
      + '<div style="margin-top:3px;opacity:.7">right-click the cell to reply</div>');
  }
  if (parts.length) showTip(parts.join('<div style="height:6px"></div>'), e.clientX, e.clientY);
});
document.addEventListener('mouseout', e=>{
  if (e.target.closest && e.target.closest('#edBody td.has-cellnote, #edBody td.has-note')) hideTip();
});

/* ---- Claude auto-fill ---- */
const AI = { key:'', model:'claude-sonnet-4-5' };
$('#edAI').addEventListener('click', ()=>{
  const veil = $('#modalVeil'), box = $('#modalBox');
  box.innerHTML = `<div class="kicker">Data Studio</div><h3>Auto-fill with Claude</h3>
    <p class="muted" style="font-size:12.5px;margin:6px 0 4px">Paste an Anthropic API key to enable the ✦ button on each row. Given an org's name, website, or EIN, Claude drafts best-guess values for empty fields — always review before relying on them. The key stays in memory for this session only and is sent only to api.anthropic.com.</p>
    <input type="text" id="aiKey" placeholder="sk-ant-…" value="${esc(AI.key)}" style="width:100%;background:var(--surface);border:1px solid var(--hairline-2);color:var(--ink);border-radius:9px;padding:9px 13px;font-size:13px;font-family:inherit;outline:none;margin:8px 0">
    <input type="text" id="aiModel" value="${esc(AI.model)}" style="width:100%;background:var(--surface);border:1px solid var(--hairline-2);color:var(--ink);border-radius:9px;padding:9px 13px;font-size:13px;font-family:inherit;outline:none;margin:0 0 6px" title="Model ID">
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px">
      <button class="btn" onclick="closeModal()">Close</button>
      <button class="btn primary" id="aiSave">Save</button></div>`;
  veil.classList.add('show');
  box.querySelector('#aiSave').addEventListener('click', ()=>{
    AI.key = box.querySelector('#aiKey').value.trim();
    AI.model = box.querySelector('#aiModel').value.trim()||'claude-sonnet-4-5';
    closeModal(); flash(AI.key?'Auto-fill enabled — use ✦ on any row':'Key cleared');
  });
});
const AI_FILL_KEYS = ['ein','legalName','tagline','blurb','hq','founded','causes','countries','sdgs','demographicFocus',
 'interventionName','interventionDescription','outputsText','outcomesText','outcomesList','outputUnit','howImpactWorks',
 'annualReach','budgetM','teamSize','whyWeLike','icp','theoryOfChange','website','demographicFocus','contactEmail','orgType'];
async function autofillRow(id){
  const o = byId(id); if (!o) return;
  if (!AI.key){ $('#edAI').click(); return; }
  const empty = AI_FILL_KEYS.filter(k=>{
    const v = o[k]; return v===''||v===0||v==null||(Array.isArray(v)&&!v.length);
  });
  if (!empty.length){ flash('No empty auto-fillable fields on this row'); return; }
  flash('✦ Asking Claude about '+o.name+'…');
  const fieldSpecs = empty.map(k=>{const f=FIELDS.find(x=>x.k===k);return `"${k}": ${f?.desc||k}${f?.arr?' (JSON array of strings)':''}${f?.num?' (number)':''}`;}).join('\n');
  const prompt = `You are filling a philanthropy database row. Organization: "${o.name}". Website: ${o.website||'unknown'}. EIN: ${o.ein||'unknown'}. Known: causes ${JSON.stringify(o.causes)}, countries ${JSON.stringify(o.countries)}, HQ ${o.hq}, description "${o.blurb}".
Provide best-guess values for ONLY these fields, from your knowledge of this real organization. Be factual; if genuinely unknown, omit the key. Respond with ONLY a JSON object, no prose:\n${fieldSpecs}`;
  try{
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'content-type':'application/json','x-api-key':AI.key,
        'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({model:AI.model, max_tokens:1500, messages:[{role:'user', content:prompt}]})
    });
    if (!res.ok) throw new Error('API '+res.status+': '+(await res.text()).slice(0,180));
    const data = await res.json();
    const txt = (data.content||[]).map(c=>c.text||'').join('');
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON in response');
    const vals = JSON.parse(m[0]);
    let n = 0;
    for (const [k,v] of Object.entries(vals)){
      if (!empty.includes(k) || v==null || v==='') continue;
      const f = FIELDS.find(x=>x.k===k);
      o[k] = f?.arr ? (Array.isArray(v)?v:String(v).split(/[;|]/).map(s=>s.trim()).filter(Boolean))
           : f?.num ? ((parseFloat(String(v).replace(/[,$\s]/g,''))||0)/(f.mult||1)) : String(v);
      clearGathering(o, k, o[k], f); n++;
    }
    o.lastUpdated = new Date().toISOString().slice(0,10);
    if (typeof o.region!=='undefined') o.region = regionOf(o);
    buildPins(); renderEdRows();
    flash(`✦ Filled ${n} field${n===1?'':'s'} for ${o.name} — review before publishing`);
  }catch(err){
    flash('Auto-fill failed: '+err.message.slice(0,120));
  }
}

/* any field that now holds a real value is no longer 'being gathered' */
function clearGathering(o, key, v, col){
  if (!o.gathering || !o.gathering.length) return;
  const nonEmpty = Array.isArray(v) ? v.length>0 : (col&&col.num ? v>0 : String(v??'').trim()!=='');
  if (!nonEmpty) return;
  const mapped = ({sufferMin:'sufferRange', flourishMax:'sufferRange'})[key] || key;
  o.gathering = o.gathering.filter(g=>g!==mapped && g!==key &&
    !(key==='costPerOutcome' && g==='outcomesTargeted'));
}

/* ---- table ---- */
$('#edSearch').addEventListener('input', e=>{ edState.q = e.target.value.toLowerCase(); renderEdRows(); });
$('#edTier').addEventListener('change', e=>{ edState.tier = e.target.value; renderEdRows(); });
$('#edTier').insertAdjacentHTML('afterend', `<select id="edRev" title="Focus on organizations by review status">
  <option value="">Reviewed + unreviewed</option>
  <option value="un">Unreviewed only</option>
  <option value="done">Reviewed only</option></select>`);
$('#edRev').addEventListener('change', e=>{ edState.rev = e.target.value; renderEdRows(); });
$('#edRev').insertAdjacentHTML('afterend', `<button class="btn" id="edClear" title="Reset the search, tier, and review-status filters">✕ Clear filters</button>`);
$('#edClear').addEventListener('click', ()=>{
  edState.q=''; edState.tier=''; edState.rev=''; edState.solo=null;
  $('#edSearch').value=''; $('#edTier').value=''; $('#edRev').value='';
  renderEdRows(); flash('Filters cleared — showing every organization');
});
(function(){ const g = $('#edGroup');
  ED_CATS.forEach(c=>g.insertAdjacentHTML('beforeend',`<option value="${c}" ${c==='Core'?'selected':''}>Columns · ${c}</option>`));
  g.addEventListener('change', ()=>{ edState.group = g.value; renderEditor(); flash('Showing '+(g.value==='All fields'?'every column':g.value+' columns')); });
})();
$('#edAdd').addEventListener('click', ()=>{
  const id = Math.max(...ORGS.map(o=>o.id))+1;
  const blank = {id, name:'New Organization', tier:'represented', sources:['Meridian'], causes:['Global Health'],
    countries:['Global'], lat:0, lng:20, hq:'', founded:2026, visibility:'hidden', blurb:'', outputUnit:'output', costPerOutput:0,
    outcomesList:[], costPerOutcome:0, outcomeReachRate:0, annualReach:0, website:'', outcomesTargeted:0,
    sufferMin:3, flourishMax:6, confidence:'Emerging', theoryOfChange:'', orgType:'Direct Service', stage:'Pilot',
    growthCurve:'Linear', budgetM:0, absorbencyM:0, goalM:0, raisedM:0, teamSize:'', gathering:[], region:'Global'};
  FIELDS.forEach(f=>{ if (!(f.k in blank) && !f.fx) blank[f.k] = f.num?0:(f.arr?[]:''); });
  blank.lastUpdated = new Date().toISOString().slice(0,10);
  blank.vettingStatus = 'Not started';
  ORGS.unshift(blank);
  (edState.fresh = edState.fresh || new Set()).add(id);   // pins the new row to the top of the table
  if (window.PERSIST && PERSIST.orgInsert) PERSIST.orgInsert(blank);   // exists in the database from the first moment
  renderEdRows();
  const wrap = document.querySelector('.tbl-wrap'); if (wrap) wrap.scrollTop = 0;
  window.scrollTo({top:0, behavior:'smooth'});
  flash('Organization added at the top (hidden from members until you set Display on site to shown)');
  buildPins();
});
$('#edExport').addEventListener('click', ()=>{
  const cols = FIELDS;
  const head = cols.map(c=>'"'+c.l.replace(/"/g,'""')+'"').join(',');
  const lines = ORGS.map(o=>cols.map(c=>{
    let v = c.fx ? c.fx(o) : o[c.k];
    if (Array.isArray(v)) v = v.join('; ');
    v = String(v??'').replace(/"/g,'""');
    return /[",\n]/.test(v)?`"${v}"`:v;
  }).join(','));
  const blob = new Blob([head+'\n'+lines.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'meridian-organizations.csv'; a.click();
  flash('CSV exported — '+ORGS.length+' organizations, '+cols.length+' fields');
});
function renderEditor(){
  const cols = activeCols();
  $('#edTable').innerHTML = `<thead><tr><th class="upd-c" title="From the field — click a row's icon to draft, schedule, and publish that organization's quarterly partner updates">🗞</th><th class="vis-c" title="Show on site · open the brief · edit in vertical view">Show</th>${cols.map(c=>`<th data-th="${c.k}" class="${c.cls||''}${c.pub?' pub-c':''}" title="${esc((c.pub?'LIVE ON THE MEMBER SITE — this field is displayed publicly on briefs, tiles, the map, or tools.\n\n':'')+(c.desc||'')+'\n\nDrag the right edge to resize this column (saved to your view); double-click the edge to reset.')}">${c.l}${c.pub?' ●':''}${c.ro?' ⓘ':''}<span class="col-grip" data-grip="${c.k}"></span></th>`).join('')}</tr></thead><tbody id="edBody"></tbody>`;
  applyColWidths(); wireColResize();
  if (!$('#pubLegend')){
    $('#edCount').insertAdjacentHTML('afterend',
      `<span id="pubLegend" class="muted" style="font-size:11px;margin-left:14px"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:rgba(201,165,92,.45);border:1px solid var(--gold-2,#C9A55C);vertical-align:-1px;margin-right:5px"></span>highlighted fields are live on the member site (briefs, tiles, map, tools)</span>`);
  }
  $('#edTable').style.minWidth = Math.max(1200, cols.length*150)+'px';
  renderEdRows();
  $('#edBody').addEventListener('contextmenu', onCellContext);
  updateNoteCnt();
}
function renderEdRows(){
  const cols = activeCols();
  const list = ORGS.filter(o=>
    (edState.tier==='archived' ? !!o.archived : !o.archived) &&
    (!edState.solo || o.id===edState.solo) &&
    (!edState.tier || edState.tier==='archived' || o.tier===edState.tier) &&
    (!edState.rev || (edState.rev==='un' ? !(o.workflow&&o.workflow.done) : !!(o.workflow&&o.workflow.done))) &&
    (!edState.q || (o.name+' '+o.causes.join(' ')+' '+o.countries.join(' ')).toLowerCase().includes(edState.q)));
  $('#edCount').textContent = list.length+' of '+ORGS.length+' rows · '+cols.length+' of '+FIELDS.length+' fields';
  const wfRank = o=>{ const wf=o.workflow||{}; return wfLate(o) ? 0 : wf.req ? 1 : wf.sub ? 2 : 3; };
  // late first, then review requests, then submission invites — and within the
  // request bands, orgs are grouped by WHO requested the review (then by date)
  const reqBy = o=>(o.workflow&&o.workflow.req&&o.workflow.req.by)||'';
  const rank = o => (edState.fresh && edState.fresh.has(o.id)) ? -1 : wfRank(o);   // just-created orgs pin to the top
  list.sort((a,b)=>{
    const d = rank(a)-rank(b); if (d) return d;
    const w = reqBy(a).localeCompare(reqBy(b)); if (w) return w;
    const da=(a.workflow&&a.workflow.req&&a.workflow.req.date)||'', db2=(b.workflow&&b.workflow.req&&b.workflow.req.date)||'';
    return da<db2?-1:da>db2?1:0;
  });
  $('#edBody').innerHTML = list.map(o=>{ const wf=o.workflow||{}; const rowCls = (wf.req?'wf-req':wf.sub?'wf-sub':'') + (wfLate(o)?' wf-late':'');
    const ups = (window.ORG_UPDATES||[]).filter(u=>u.orgId===o.id || (!u.orgId && u.org===o.name));
    const liveN = window.updIsLive ? ups.filter(u=>updIsLive(u)).length : 0;
    const updTitle = ups.length
      ? `From the field — ${liveN} live, ${ups.length-liveN} draft or upcoming. Click to view past updates and plan next quarter's.`
      : 'From the field — no updates logged yet. Click to draft this organization\'s first quarterly update.';
    return `<tr data-id="${o.id}" class="${rowCls}"><td class="upd-c"><span class="row-ic upd-ic ${liveN?'on':''}" title="${updTitle}" onclick="openUpdatesMgr(${o.id})">🗞${ups.length?`<i class="upd-n">${ups.length}</i>`:''}</span><span class="row-ic sv-ic ${o.siteVisit?'on':''}" title="${o.siteVisit?`Site-visit candidate (${esc(o.siteVisit.status||'candidate')}) — click to remove. Plan it in the Site visits tab.`:'Mark this org for a potential site visit'}" onclick="window.toggleSiteVisit&&toggleSiteVisit(${o.id})">✈</span></td><td class="vis-c"><div style="display:flex;align-items:center;gap:4px;justify-content:center;flex-wrap:nowrap"><label class="vswitch" title="${isShown(o)?'Shown on the site — click to hide':'Hidden from members — click to show'}"><input type="checkbox" ${isShown(o)?'checked':''} data-vis="${o.id}"><i></i></label><span class="row-ic" title="Go to this organization's brief" onclick="go('#/org/${o.id}')">↗</span><span class="row-ic" title="Edit in vertical view — all fields as rows" onclick="openVerticalEdit(${o.id})">✎</span><input type="checkbox" class="wf-cb" ${wf.sub?'checked':''} title="${wf.sub?`Submission invited by ${initialsOf(wf.sub.by)} on ${wf.sub.date}${wf.sub.assignee?' — assigned to '+esc(wf.sub.assignee):''} — uncheck to clear`:'Invite submission of org data (new or existing org)'}" onclick="event.preventDefault();wfAction(${o.id},'sub')"><span class="row-ic wf-req-ic ${wf.req?'on':''}" title="${wf.req?`In the review queue — requested by ${esc(wf.req.by)} on ${wf.req.date}.${wf.req.assignee?' Assigned to '+esc(wf.req.assignee)+'.':''} Rows are grouped by requester. Click to remove.`:'Request review — adds this org to the review queue (you can assign it to someone)'}" onclick="wfAction(${o.id},'req')">⏳${wf.req?`<i class="req-by">${esc(initialsOf(wf.req.by))}</i>`:''}</span><span class="row-ic wf-done-ic ${wf.done?'on':''}" onmousemove="wfTip(event,${o.id})" onmouseleave="hideTip()" onclick="wfAction(${o.id},'done')">✓</span></div></td>${cols.map(c=>{
    const noted = (noteFor(o.id, c.k) ? ' has-note':'') + (CELLNOTES[cellNoteKey(o.id,c.k)] ? ' has-cellnote':'') + (c.pub ? ' pub':'');
    if (c.k==='name'){
      if (o.archived) return `<td class="name-c pub${noted}" data-k="name" style="opacity:.75"><span title="Archived ${esc(o.archived.date||'')}${o.archived.by?' by '+esc(o.archived.by):''}" style="margin-right:7px">🗄</span><span contenteditable="true" spellcheck="false" data-inline="1">${esc(o.name)}</span><span class="row-ic" style="margin-left:7px;color:var(--good)" title="Restore this organization to active" onclick="event.stopPropagation();restoreOrg(${o.id})">↩</span></td>`;
      return `<td class="name-c pub${noted}" data-k="name"><span style="cursor:pointer;color:var(--gold-2);margin-right:7px" title="Auto-fill empty fields with Claude" onclick="autofillRow(${o.id})">✦</span><span contenteditable="true" spellcheck="false" data-inline="1">${esc(o.name)}</span><span class="row-ic solo-ic ${edState.solo===o.id?'on':''}" style="margin-left:7px" title="${edState.solo===o.id?'Showing only this row — click to show all rows':'Filter the studio to just this row'}" onclick="event.stopPropagation();soloRow(${o.id})">◎</span><span class="row-ic log-ic ${(o.orgLog&&o.orgLog.length)?'on':''}" style="margin-left:3px" title="${(o.orgLog&&o.orgLog.length)?o.orgLog.length+' internal log entr'+(o.orgLog.length===1?'y':'ies')+' — calls, meetings, comms, notes':'Org log — record intro calls, meetings, comms, and internal notes'}" onclick="event.stopPropagation();openOrgLog(${o.id})">🗒${(o.orgLog&&o.orgLog.length)?`<i class="upd-n" style="background:#7FAD96">${o.orgLog.length}</i>`:''}</span></td>`;
    }
    if (c.k==='website'){
      const url = String(o.website||'').trim();
      const href = url ? (/^https?:/i.test(url) ? url : 'https://'+url) : '';
      return `<td class="${noted}" data-k="website" title="${esc(c.desc||'')}">${href?`<a class="row-ic" style="margin-right:6px;text-decoration:none" href="${esc(href)}" target="_blank" rel="noopener" title="Visit website ↗" onclick="event.stopPropagation()">↗</a>`:''}<span contenteditable="true" spellcheck="false" data-inline="1">${esc(url)}</span></td>`;
    }
    if (c.fx) return `<td class="${noted}" data-k="${c.k}" style="color:var(--ink-3)">${esc(c.fx(o))}</td>`;
    if (c.ro) return `<td class="${noted}" data-k="${c.k}" style="color:var(--ink-3)">${esc(o[c.k])}</td>`;
    if (c.sel){
      const noBlank = c.k==='tier'||c.k==='visibility';
      const opts = (noBlank?[]:['']).concat(c.sel.filter(s=>s!==''));
      const cur = c.k==='visibility' ? (o.visibility||'shown') : String(o[c.k]??'');
      return `<td class="${noted}" data-k="${c.k}"><select data-k="${c.k}">${opts.map(s=>`<option value="${s}" ${s===cur?'selected':''}>${s||'—'}</option>`).join('')}</select></td>`;
    }
    let v = o[c.k]; if (Array.isArray(v)) v = v.join('; ');
    if (c.num) v = (o._range||{})[c.k] ? fmtCellRange(c, o._range[c.k]) : ((o._approx||{})[c.k]?'~':'') + fmtCellNum(c, v);
    if (c.img) return `<td class="${noted}" data-k="${c.k}" title="${esc(c.desc||'')}"><span style="cursor:pointer;margin-right:6px" onclick="window.pickImage&&pickImage(${o.id},'${c.k}')">📷</span><span contenteditable="true" spellcheck="false" data-inline="1">${esc(v)}</span></td>`;
    return `<td class="${noted}${c.num?' num-cell':''}" contenteditable="true" data-k="${c.k}" spellcheck="false" title="${esc(c.desc||'')}">${esc(v)}</td>`;
  }).join('')}</tr>`;}).join('');
  const body = $('#edBody');
  body.querySelectorAll('td[contenteditable], td [contenteditable]').forEach(td=>{
    // commit immediately on blur, but collapse the expansion a beat later so the
    // table never reflows in the middle of a click on another cell/icon
    td.addEventListener('blur', ()=>{ commitCell(td); const cell = td.closest('td'); setTimeout(()=>cell.classList.remove('expanded'), 280); });
    td.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); td.blur();} });
    // expanding also waits until the click gesture has fully finished
    td.addEventListener('focus', ()=>setTimeout(()=>{
      if (document.activeElement===td || td.contains(document.activeElement)) td.closest('td').classList.add('expanded');
    }, 200));
    // numeric columns refuse non-numeric characters at the keystroke level
    const colDef = FIELDS.find(f=>f.k===td.closest('td').dataset.k);
    if (colDef && colDef.num){
      td.addEventListener('beforeinput', e=>{
        if (e.data && /[^0-9.,\-$kKmMbB\s%~]/.test(e.data)){ e.preventDefault(); flash('This column only accepts numbers'); }
      });
      td.addEventListener('paste', e=>{
        const t = (e.clipboardData||window.clipboardData).getData('text');
        if (/[^0-9.,\-$kKmMbB\s%~]/.test(t)){ e.preventDefault(); flash('This column only accepts numbers'); }
      });
    }
  });
  // sticky Display Name (and other inline-span cells): clicking any part of the
  // cell edits IT — never the column scrolled beneath it
  body.onclick = (e)=>{
    if (e.target.closest('[contenteditable], a, select, input, button, .row-ic, .vswitch, [onclick]')) return;
    const td = e.target.closest('td'); if (!td) return;
    const sp = td.querySelector('span[data-inline]'); if (!sp) return;
    sp.focus();
    try{
      const r = document.createRange(); r.selectNodeContents(sp); r.collapse(false);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }catch(err){}
  };
  body.querySelectorAll('input[data-vis]').forEach(cb=>cb.addEventListener('change', ()=>{
    const o = byId(cb.dataset.vis); if (!o) return;
    o.visibility = cb.checked ? 'shown' : 'hidden';
    cb.closest('.vswitch').title = cb.checked ? 'Shown on the site — click to hide' : 'Hidden from members — click to show';
    buildPins(); if (window.PERSIST){ PERSIST.orgField ? PERSIST.orgField(o,'visibility',o.visibility) : PERSIST.org(o); }
    flash(cb.checked ? o.name+' is now live on the site' : o.name+' is now hidden from members');
  }));
  body.querySelectorAll('select').forEach(sel=>sel.addEventListener('change', ()=>{
    const o = byId(sel.closest('tr').dataset.id);
    o[sel.dataset.k] = sel.value;
    clearGathering(o, sel.dataset.k, sel.value, FIELDS.find(f=>f.k===sel.dataset.k));
    if (sel.dataset.k==='tier'||sel.dataset.k==='visibility') buildPins();
    flash('Updated '+o.name);
  }));
}
function onCellContext(e){
  const td = e.target.closest('td'); if (!td || !td.dataset.k) return;
  e.preventDefault();
  const tr = td.closest('tr');
  openCtxMenu(td, +tr.dataset.id, td.dataset.k, e.clientX, e.clientY);
}
function commitCell(el){
  const td = el.closest('td');
  const o = byId(td.closest('tr').dataset.id);
  const key = td.dataset.k;
  const col = FIELDS.find(c=>c.k===key);
  if (!o || !col || col.ro || col.fx) return;
  let v = el.textContent.trim();
  const old = o[key];
  let approx = false;
  if (col.num){
    approx = /^\s*~/.test(v); v = v.replace(/~/g,'');
    o._range = Object.assign({}, o._range);
    const range = parseStudioRange(v);
    if (range){
      const lo = col.mult ? range[0]/col.mult : range[0], hi = col.mult ? range[1]/col.mult : range[1];
      o._range[key] = [lo, hi];
      v = (lo + hi) / 2;   // stored numeric = midpoint, keeps charts and totals sane
      approx = false;
      el.textContent = fmtCellRange(col, [lo, hi]);
    } else if (v.trim()===''){ v = 0; approx = false; delete o._range[key]; el.textContent = ''; }
    else {
      v = parseStudioNum(v);
      if (v===null){
        const r0 = (o._range||{})[key];
        el.textContent = r0 ? fmtCellRange(col, r0) : fmtCellNum(col, Array.isArray(old)?old.join('; '):old);
        flash('Not a number — use 1200000, $1.2M, or a range like $1M-$2M'); return;
      }
      if (col.mult) v = v / col.mult;   // displayed in full dollars, stored in $M
      delete o._range[key];
      el.textContent = (approx?'~':'') + fmtCellNum(col, v);
    }
    o._approx = Object.assign({}, o._approx);
    if (approx) o._approx[key] = 1; else delete o._approx[key];
    if (window.PERSIST && PERSIST.orgField && !((window.APP||{}).demo)){
      PERSIST.orgField(o, '_approx', o._approx);
      PERSIST.orgField(o, '_range', o._range);
    }
  }
  if (col.arr) v = v.split(/[;|]/).map(s=>s.trim()).filter(Boolean);
  const changed = JSON.stringify(v)!==JSON.stringify(old);
  if (!changed) return;
  o[key] = v;
  o.lastUpdated = new Date().toISOString().slice(0,10);
  if (key==='countries') autoLatLng(o);
  if (key==='countries'){ window.deriveOrgLL && deriveOrgLL(o); o.region = regionOf(o); buildPins(); }
  clearGathering(o, key, v, col);
  flash('Updated '+o.name);
}

/* countries set but no coordinates yet — drop the primary pin on the first known country */
function autoLatLng(o){
  if ((+o.lat||0) || (+o.lng||0)) return;
  const ll = (o.countries||[]).map(c=>(window.COUNTRY_LL||{})[c]).find(Boolean);
  if (!ll) return;
  o.lat = ll[0]; o.lng = ll[1];
  if (window.PERSIST && PERSIST.orgField && !((window.APP||{}).demo)){ PERSIST.orgField(o,'lat',o.lat); PERSIST.orgField(o,'lng',o.lng); }
  flash('Pin placed from '+(o.countries[0]||'country')+' — adjust Service Lat/Lng to fine-tune');
}

/* ================= NUMBER FORMATTING ================= */
/* Display: full numbers with thousands separators ($M-stored fields shown in
   full dollars). Parse: accepts commas, $, spaces, and k/M/B suffixes. */
function fmtCellNum(col, v){
  if (v==='' || v==null) return '';
  const n = +v;
  if (!isFinite(n)) return String(v);
  const full = col.mult ? n * col.mult : n;
  const body = col.nocomma ? String(full) : full.toLocaleString('en-US', {maximumFractionDigits: 4});
  if (col.unit==='$') return full===0 ? '' : '$'+body;
  if (col.unit==='%') return full===0 ? '' : body+'%';
  return body;
}
/* "$1M-$2M" style ranges on numeric fields: the exact range is kept in
   o._range and shown everywhere; the numeric field stores the midpoint so
   charts, totals, and sorting keep working */
function parseStudioRange(s){
  const m = String(s).match(/^\s*\$?\s*([\d.,]+\s*[kKmMbB]?)\s*[-\u2013\u2014]\s*\$?\s*([\d.,]+\s*[kKmMbB]?)\s*%?\s*$/);
  if (!m) return null;
  const a = parseStudioNum(m[1]), b = parseStudioNum(m[2]);
  if (a==null || b==null) return null;
  return a<=b ? [a,b] : [b,a];
}
function fmtCellRange(col, r){ return fmtCellNum(col, r[0]) + '\u2013' + fmtCellNum(col, r[1]); }
window.fmtCellRange = fmtCellRange;
/* briefs & other displays: show the range when one was entered */
window.fmtOrgNum = function(o, key, fmt){
  const r = (o._range||{})[key];
  if (r) return fmt(r[0]) + '\u2013' + fmt(r[1]);
  return (o[key] || o[key]===0) && o[key] !== '' ? fmt(o[key]) : '\u2014';
};
function parseStudioNum(s){
  let t = String(s).replace(/[,$\s%]/g, '');
  const suf = t.match(/^(-?[\d.]+)([kKmMbB])$/);
  if (suf) t = String(parseFloat(suf[1]) * ({k:1e3,m:1e6,b:1e9})[suf[2].toLowerCase()]);
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

/* ================= COLUMN WIDTHS (per-user view preference) ================= */
function colWKey(){ return 'ffg.colw.' + ((window.APP && APP.userId) || 'demo'); }
function loadColW(){ try{ return JSON.parse(localStorage.getItem(colWKey())||'{}'); }catch(e){ return {}; } }
function saveColW(w){ try{ localStorage.setItem(colWKey(), JSON.stringify(w)); }catch(e){} }
function applyColWidths(){
  let st = $('#colWidthStyle');
  if (!st){ st = document.createElement('style'); st.id = 'colWidthStyle'; document.head.appendChild(st); }
  const w = loadColW();
  st.textContent = Object.entries(w).map(([k,px])=>
    `table.editor td[data-k="${k}"], table.editor th[data-th="${k}"]{width:${px}px;min-width:${px}px;max-width:${px}px}`).join('\n');
}
function wireColResize(){
  const head = $('#edTable').querySelector('thead'); if (!head) return;
  head.querySelectorAll('.col-grip').forEach(grip=>{
    grip.addEventListener('mousedown', e=>{
      e.preventDefault(); e.stopPropagation();
      const k = grip.dataset.grip, th = grip.closest('th');
      const startX = e.clientX, startW = th.getBoundingClientRect().width;
      const move = ev=>{
        const w = Math.max(70, Math.min(720, Math.round(startW + ev.clientX - startX)));
        const all = loadColW(); all[k] = w; saveColW(all); applyColWidths();
      };
      const up = ()=>{ document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    });
    grip.addEventListener('dblclick', e=>{
      e.stopPropagation();
      const all = loadColW(); delete all[grip.dataset.grip]; saveColW(all); applyColWidths();
      flash('Column width reset');
    });
  });
}

/* ================= FROM THE FIELD — per-org quarterly updates manager ================= */
let updMgrState = {orgId:null, editId:null};
function orgUpdatesOf(o){ return (window.ORG_UPDATES||[]).filter(u=>u.orgId===o.id || (!u.orgId && u.org===o.name)); }
function updQtrOptions(sel){
  // 2024-Q1 through six quarters ahead of today, newest first
  const cur = curQuarter(); let y = +cur.slice(0,4), n = +cur.slice(6);
  for (let i=0;i<6;i++){ n++; if (n>4){ n=1; y++; } }
  const out = [];
  for (let yy=y; yy>=2024; yy--) for (let qq=(yy===y?n:4); qq>=1; qq--) out.push(yy+'-Q'+qq);
  return out.map(q=>`<option value="${q}" ${q===sel?'selected':''}>${qtrLabel(q)}${q===cur?' — current quarter':''}</option>`).join('');
}
function updStatusChip(u){
  const cur = curQuarter();
  if (updIsLive(u)) return '<span class="pill" style="background:#DFE9DC;border-color:#7FA87F;color:#2C4E2C">● Live</span>';
  if (u.quarter > cur) return u.status==='draft'
    ? '<span class="pill">Draft · planned for '+esc(qtrLabel(u.quarter))+'</span>'
    : '<span class="pill gold">Scheduled — goes live when '+esc(qtrLabel(u.quarter))+' starts</span>';
  return '<span class="pill" style="border-color:#C0392B;color:#C0392B">Draft — its quarter has already started</span>';
}
window.soloRow = function(id){
  edState.solo = (edState.solo===id) ? null : id;
  renderEdRows();
  flash(edState.solo ? 'Showing only '+(byId(id)||{}).name+' — ◎ again (or Clear filters) to show all' : 'Showing all rows');
};
/* staff: jump from anywhere straight to the studio filtered to one org.
   Clears every other filter (search text, tier, review status) first so the
   org always actually shows — a leftover filter from a previous solo would
   otherwise hide it. */
window.studioSolo = function(id){
  edState.solo = id;
  edState.q=''; edState.tier=''; edState.rev='';
  if ((byId(id)||{}).archived) edState.tier = 'archived';   // an archived org only shows behind its filter
  const sq=$('#edSearch'), st=$('#edTier'), sr=$('#edRev');
  if (sq) sq.value=''; if (st) st.value=edState.tier; if (sr) sr.value='';
  if (!location.hash.startsWith('#/editor')) go('#/editor');
  renderEdRows();
  flash('Data studio filtered to '+(byId(id)||{}).name+' — other filters cleared');
};
/* ---------- archive / restore (soft delete — data is kept) ---------- */
window.archiveOrg = function(id){
  const o = byId(id); if (!o) return;
  if (!confirm('Archive "'+o.name+'"?\n\nIt disappears from members and from the studio, but every field, comment, and note is kept. Restore it any time from the 🗄 Archived filter.')) return;
  o.archived = {by: wfMe(), date: new Date().toISOString().slice(0,10)};
  if (edState.solo===id) edState.solo = null;
  window.PERSIST && PERSIST.orgField && PERSIST.orgField(o, 'archived', o.archived);
  if (typeof closeModal==='function') closeModal();
  renderEdRows(); if (typeof buildPins==='function') buildPins();
  flash(o.name+' archived — find it under the 🗄 Archived filter, restore with ↩');
};
window.restoreOrg = function(id){
  const o = byId(id); if (!o || !o.archived) return;
  delete o.archived;
  window.PERSIST && PERSIST.orgField && PERSIST.orgField(o, 'archived', null);
  renderEdRows(); if (typeof buildPins==='function') buildPins();
  flash(o.name+' restored to active');
};

/* ---------- org log: internal record of calls, meetings, comms & notes ----------
   Staff-only. Multiple dated entries per org with an optional link to related
   files (Drive folder, deck, transcript…). Stored on the org record. */
const OL_KINDS = ['Intro call','Meeting','Comms','Note','Other'];
let olState = {orgId:null, editId:null, openId:null};
window.openOrgLog = function(id, editId){
  olState = {orgId:id, editId:editId||null, openId:editId||olState.openId||null};
  renderOrgLog();
  $('#modalVeil').classList.add('show');
};
window.olToggle = function(orgId, entryId){
  olState.openId = String(olState.openId)===String(entryId) ? null : entryId;
  renderOrgLog();
};
function olSave(o){
  window.PERSIST && PERSIST.orgField && PERSIST.orgField(o, 'orgLog', o.orgLog);
}
const olLinks = e => (e.links && e.links.length ? e.links : (e.link ? [e.link] : []));
function renderOrgLog(){
  const o = byId(olState.orgId); if (!o) return;
  const box = $('#modalBox');
  box.style.width = 'min(680px,95vw)'; box.style.maxHeight = '88vh'; box.style.overflow = 'auto';
  const log = (o.orgLog||[]).slice().sort((a,b)=> (a.date<b.date?1:a.date>b.date?-1:0));
  const eu = olState.editId ? log.find(e=>String(e.id)===String(olState.editId)) : null;
  const kindColor = {'Intro call':'#92C1DC','Meeting':'#91A5C6','Comms':'#C4A47C','Note':'#9ED1BB','Other':'#CB9A8B'};
  box.innerHTML = `<div class="kicker">Org log · internal only</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap">
      <h3 style="margin-bottom:2px">${esc(o.name)}</h3>
      <span class="muted" style="font-size:11.5px">${log.length||'No'} entr${log.length===1?'y':'ies'} — never shown to members</span></div>
    <div class="muted" style="font-size:12px;margin-bottom:12px">Intro calls, meetings, comms, and in-the-moment thoughts you want to remember — with links to related files. Click an entry to expand it.</div>
    <div style="max-height:330px;overflow:auto;margin-bottom:12px">
      ${log.map(e=>{
        const open = String(olState.openId)===String(e.id);
        const title = e.title || (e.text||'').slice(0,60) + ((e.text||'').length>60?'…':'');
        const links = olLinks(e);
        return `<div class="note-item" style="padding:8px 10px;margin-bottom:6px;cursor:pointer" onclick="olToggle(${o.id},'${e.id}')">
        <div style="display:flex;gap:9px;align-items:center;min-width:0">
          <span style="width:10px;flex:none;font-size:9px;color:var(--ink-3)">${open?'▾':'▸'}</span>
          <span class="pill" style="flex:none;font-size:10px;border-color:${kindColor[e.kind]||'#ccc'};background:${(kindColor[e.kind]||'#ccc')}22">${esc(e.kind||'Note')}</span>
          <span style="flex:none;font-size:11px;color:var(--ink-3)">${esc(e.date||'')}</span>
          <span style="flex:none;font-size:11px;color:var(--ink-3)" title="${esc(e.by||'')}">${esc(initialsOf(e.by||''))}</span>
          <b style="flex:1;min-width:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</b>
          ${links.length?`<span style="flex:none;font-size:10.5px" title="${links.length} link${links.length===1?'':'s'}">🔗${links.length>1?links.length:''}</span>`:''}
        </div>
        ${open?`<div style="margin:7px 0 0 19px" onclick="event.stopPropagation()">
          <div style="font-size:12.5px;white-space:pre-wrap">${esc(e.text||'')}</div>
          ${links.map(l=>`<div><a href="${esc(/^https?:/i.test(l)?l:'https://'+l)}" target="_blank" rel="noopener" style="font-size:11.5px">🔗 ${esc(l.length>62?l.slice(0,60)+'…':l)}</a></div>`).join('')}
          <div style="display:flex;gap:12px;margin-top:6px">
            <span class="res" style="cursor:pointer" onclick="openOrgLog(${o.id},'${e.id}')">✎ Edit</span>
            <span class="res" style="cursor:pointer;color:var(--crit)" onclick="olDel(${o.id},'${e.id}')">✕ Delete</span>
          </div>
        </div>`:''}
      </div>`;}).join('') || '<div class="muted" style="font-size:12.5px;padding:4px 2px">Nothing logged yet — add the first entry below.</div>'}
    </div>
    <div class="upd-form" style="border-top:1px solid var(--hairline);padding-top:12px">
      <div class="kicker" style="margin-bottom:8px">${eu?'Edit entry':'New entry'}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <select id="olKind" style="border:1px solid var(--divider);border-radius:8px;padding:6px 9px;font:inherit;font-size:12.5px;background:#fff">
          ${OL_KINDS.map(k=>`<option ${eu&&eu.kind===k?'selected':''}>${k}</option>`).join('')}</select>
        <input id="olDate" type="date" value="${esc(eu?eu.date:new Date().toISOString().slice(0,10))}" style="border:1px solid var(--divider);border-radius:8px;padding:6px 9px;font:inherit;font-size:12.5px;background:#fff">
        <input id="olTitle" type="text" placeholder="title — e.g. Intro call with the director" value="${esc(eu?eu.title||'':'')}" style="flex:1;min-width:200px;border:1px solid var(--divider);border-radius:8px;padding:6px 9px;font:inherit;font-size:12.5px;background:#fff">
      </div>
      <textarea id="olText" placeholder="What happened / what to remember — free flow" style="width:100%;min-height:74px;border:1px solid var(--divider);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px;resize:vertical;background:#fff;box-sizing:border-box">${esc(eu?eu.text||'':'')}</textarea>
      <textarea id="olLinks" placeholder="links to related files — one per line (Drive, deck, transcript…)" style="width:100%;min-height:38px;border:1px solid var(--divider);border-radius:9px;padding:7px 10px;font:inherit;font-size:12px;resize:vertical;background:#fff;box-sizing:border-box;margin-top:7px">${esc(eu?olLinks(eu).join('\n'):'')}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:9px">
        ${eu?`<button class="btn" onclick="olState.editId=null;renderOrgLog()">Cancel edit</button>`:''}
        <button class="btn primary" onclick="olAdd(${o.id})">${eu?'Save entry':'+ Add entry'}</button>
        <button class="btn" onclick="closeModal();renderEdRows()">Done</button>
      </div>
    </div>`;
}
window.olAdd = function(orgId){
  const o = byId(orgId); if (!o) return;
  const text = ($('#olText')?.value||'').trim();
  const title = ($('#olTitle')?.value||'').trim();
  if (!text && !title){ flash('Write the entry first'); return; }
  const kind = $('#olKind')?.value||'Note', date = $('#olDate')?.value||new Date().toISOString().slice(0,10);
  const links = ($('#olLinks')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  o.orgLog = (o.orgLog||[]).slice();
  if (olState.editId){
    const e = o.orgLog.find(x=>String(x.id)===String(olState.editId));
    if (e){ e.kind=kind; e.date=date; e.title=title; e.text=text; e.links=links; delete e.link; }
    olState.openId = olState.editId;
  } else {
    const e = {id:'ol'+Date.now().toString(36)+Math.floor(Math.random()*1e4), kind, date, title, text, links, by:wfMe()};
    o.orgLog.push(e);
    olState.openId = null;
  }
  olSave(o);
  olState.editId = null;
  renderOrgLog();
  flash('Log entry saved — internal only');
};
window.olDel = function(orgId, entryId){
  const o = byId(orgId); if (!o) return;
  if (!confirm('Delete this log entry?')) return;
  o.orgLog = (o.orgLog||[]).filter(x=>String(x.id)!==String(entryId));
  olSave(o);
  if (String(olState.editId)===String(entryId)) olState.editId = null;
  renderOrgLog();
};
window.openUpdatesMgr = function(id){
  updMgrState = {orgId:id, editId:null};
  renderUpdMgr();
  $('#modalVeil').classList.add('show');
};
window.updMgrEdit = function(eid){ updMgrState.editId = eid; renderUpdMgr(); const t=$('#umTitle'); if(t) t.focus(); };
function renderUpdMgr(){
  const o = byId(updMgrState.orgId); if (!o) return;
  const box = $('#modalBox');
  box.style.width = 'min(740px,95vw)'; box.style.maxHeight = '88vh'; box.style.overflow = 'auto';
  const cur = curQuarter();
  const ups = orgUpdatesOf(o).slice().sort((a,b)=> a.quarter<b.quarter?1:a.quarter>b.quarter?-1:0);
  const upcoming = ups.filter(u=>u.quarter>cur), log = ups.filter(u=>u.quarter<=cur);
  const row = u => `<div class="upd-row ${String(updMgrState.editId)===String(u.id)?'editing':''}">
      <span class="pill" style="flex:none">${esc(qtrLabel(u.quarter))}</span>${updStatusChip(u)}
      <span class="upd-row-ttl">${esc(u.title||'(untitled)')}</span>
      ${u.link?'<span title="Has a public update link">🔗</span>':''}${u.video?'<span title="Has a video link">🎬</span>':''}
      <span class="res" onclick="updMgrEdit('${u.id}')">✎ Edit</span></div>`;
  const eu = updMgrState.editId && updMgrState.editId!=='new' ? ups.find(u=>String(u.id)===String(updMgrState.editId)) : null;
  const form = updMgrState.editId ? `
    <div class="upd-form">
      <div class="kicker" style="margin-bottom:8px">${eu?'Edit update':'New update'}</div>
      <div class="upd-ai">
        <div style="font-size:12px;color:var(--ink-3);margin-bottom:7px">✦ <b>Auto-write with Claude</b> — paste the link to the org's update, article, or story (and/or attach a PDF or text file). Claude reads the source, then drafts the title, summary, and mini-blog storytelling below. Everything stays editable before you save.</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="umAiUrl" type="text" placeholder="https:// — link to the update / article / report" style="flex:1;min-width:200px" value="${esc(eu?eu.link||'':'')}">
          <input id="umAiFile" type="file" accept=".pdf,.txt,.md" style="max-width:200px;font-size:11.5px">
          <button class="btn" id="umAiGo" onclick="aiWriteUpdate()">✦ Auto-write</button>
        </div>
      </div>
      <div class="upd-form-grid">
        <label>Quarter</label><select id="umQuarter">${updQtrOptions(eu?eu.quarter:cur)}</select>
        <label>Status</label><select id="umStatus">
          <option value="draft" ${(!eu||eu.status==='draft')?'selected':''}>Draft — visible only here</option>
          <option value="ready" ${eu&&eu.status!=='draft'?'selected':''}>Publish — live once its quarter has started</option></select>
        <label>Title</label><input id="umTitle" type="text" placeholder="Headline for the update" value="${esc(eu?eu.title:'')}">
        <label>Summary</label><textarea id="umSum" rows="2" placeholder="One or two sentences shown on the dashboard card">${esc(eu?eu.sum||'':'')}</textarea>
        <label>Blog body</label><textarea id="umBody" rows="7" placeholder="The full article. Leave a blank line between paragraphs.">${esc(eu&&eu.body?eu.body.join('\n\n'):'')}</textarea>
        <label>Public link</label><input id="umLink" type="text" placeholder="https:// — the org's own public update or report" value="${esc(eu?eu.link||'':'')}">
        <label>Video link</label><input id="umVideo" type="text" placeholder="https:// — YouTube, Vimeo, etc." value="${esc(eu?eu.video||'':'')}">
        <label>Hero image</label><input id="umImg" type="text" placeholder="https:// image URL (blank = the org's saved hero photo)" value="${esc(eu?eu.img||'':'')}">
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
        ${eu?`<span class="res" style="color:var(--crit)" onclick="delUpdMgr('${eu.id}')">✕ Delete this update</span>`:'<span></span>'}
        <span style="display:flex;gap:8px"><button class="btn" onclick="updMgrState.editId=null;renderUpdMgr()">Cancel</button>
        <button class="btn primary" onclick="saveUpdMgr()">Save update</button></span>
      </div>
    </div>` : '';
  box.innerHTML = `<div class="kicker">Data studio · from the field</div>
    <h3 style="margin-bottom:2px;display:inline-flex;align-items:center;gap:8px">${typeof orgLogo==='function'?orgLogo(o,22):''}${esc(o.name)}</h3>
    <div class="muted" style="font-size:12px;margin-bottom:12px">The real quarterly updates log — draft next quarter's update ahead of time, keep the record of what ran. Published updates go live on every member's dashboard the moment their quarter starts (it is ${qtrLabel(cur)} now). Rows highlighted 🗞 gold in the studio have a live update.</div>
    ${updMgrState.editId?'':'<button class="btn primary" style="margin-bottom:12px" onclick="updMgrEdit(\'new\')">＋ Draft an update</button>'}
    ${form}
    <div class="kicker" style="margin:14px 0 6px">Upcoming · planned for next quarters</div>
    ${upcoming.length?upcoming.map(row).join(''):'<div class="muted" style="font-size:12.5px;padding:2px 0 4px">Nothing planned yet — draft next quarter\'s update so it goes live automatically.</div>'}
    <div class="kicker" style="margin:16px 0 6px">Log · current & past quarters</div>
    ${log.length?log.map(row).join(''):'<div class="muted" style="font-size:12.5px;padding:2px 0 4px">No past updates recorded for this organization.</div>'}
    <div style="display:flex;justify-content:flex-end;margin-top:16px;border-top:1px solid var(--hairline);padding-top:12px">
      <button class="btn" onclick="closeModal()">Close</button></div>`;
}
/* ✦ Auto-write: Claude reads the linked or attached source and drafts the
   title + summary + mini-blog body. Server-side (staff-gated) — the API key
   never touches the browser. */
function fileToB64(f){ return new Promise((ok,er)=>{ const rd=new FileReader(); rd.onload=()=>ok(String(rd.result).split(',')[1]); rd.onerror=er; rd.readAsDataURL(f); }); }
window.aiWriteUpdate = async function(){
  const o = byId(updMgrState.orgId); if (!o) return;
  const url = $('#umAiUrl').value.trim();
  const f = $('#umAiFile').files[0];
  if (!url && !f){ flash('Paste a link or attach a file first'); return; }
  if (f && f.size > 4*1024*1024){ flash('Attachment too large — keep it under 4 MB'); return; }
  const btn = $('#umAiGo'); btn.disabled = true; btn.textContent = '✦ Reading & writing…';
  try{
    let doc = null, text = null;
    if (f){
      if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) doc = {media_type:'application/pdf', data: await fileToB64(f)};
      else text = await f.text();
    }
    const r = await fetch('/api/updatewrite', {method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(sb.session?.access_token||'')},
      body: JSON.stringify({org:{name:o.name, website:o.website}, quarter:qtrLabel($('#umQuarter').value), url:url||null, doc, text})});
    const j = await r.json();
    if (!r.ok) throw new Error(j.error||('HTTP '+r.status));
    if (j.title) $('#umTitle').value = j.title;
    if (j.summary) $('#umSum').value = j.summary;
    if (j.body) $('#umBody').value = (Array.isArray(j.body)?j.body:[String(j.body)]).join('\n\n');
    if (url && !$('#umLink').value.trim()) $('#umLink').value = url;
    flash('✦ Draft written from the source — review, edit, and save');
  }catch(e){ flash('Auto-write failed: '+e.message); }
  btn.disabled = false; btn.textContent = '✦ Auto-write';
};
window.saveUpdMgr = function(){
  const o = byId(updMgrState.orgId); if (!o) return;
  const title = $('#umTitle').value.trim();
  if (!title){ flash('Give the update a title first'); return; }
  let u;
  if (updMgrState.editId==='new'){
    u = {id:'n'+Math.random().toString(36).slice(2,9), orgId:o.id, org:o.name};
    ORG_UPDATES.push(u);
  } else {
    u = ORG_UPDATES.find(x=>String(x.id)===String(updMgrState.editId)); if (!u) return;
    u.orgId = u.orgId || o.id; u.org = u.org || o.name;
  }
  u.quarter = $('#umQuarter').value; u.status = $('#umStatus').value;
  u.title = title; u.sum = $('#umSum').value.trim();
  u.body = $('#umBody').value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  u.link = $('#umLink').value.trim(); u.video = $('#umVideo').value.trim(); u.img = $('#umImg').value.trim();
  window.PERSIST && PERSIST.orgUpdate && PERSIST.orgUpdate(u);
  updMgrState.editId = null;
  renderUpdMgr(); if ($('#edBody')) renderEdRows();
  if (typeof renderUpdates==='function' && $('#updatesSec')) renderUpdates();
  flash(updIsLive(u) ? 'Update saved — live on the member dashboard now'
    : u.status==='draft' ? 'Draft saved — not visible to members'
    : 'Update scheduled — goes live when '+qtrLabel(u.quarter)+' starts');
};
window.delUpdMgr = function(uid){
  const i = ORG_UPDATES.findIndex(x=>String(x.id)===String(uid)); if (i<0) return;
  const [u] = ORG_UPDATES.splice(i,1);
  if (u.dbId && window.PERSIST && PERSIST.orgUpdateDelete) PERSIST.orgUpdateDelete(u.dbId);
  updMgrState.editId = null;
  renderUpdMgr(); if ($('#edBody')) renderEdRows();
  if (typeof renderUpdates==='function' && $('#updatesSec')) renderUpdates();
  flash('Update deleted');
};

/* ================= VERTICAL EDIT (transposed single-org view) ================= */
window.openVerticalEdit = function(id, group){
  const o = byId(id); if (!o) return;
  window._veGroup = group || window._veGroup || 'Core';
  const veil = $('#modalVeil'), box = $('#modalBox');
  box.style.width = 'min(760px,95vw)'; box.style.maxHeight = '88vh'; box.style.overflow = 'auto';
  const groups = ['Core', ...[...new Set(FIELDS.map(f=>f.cat))], 'All fields'];
  const veFields = window._veGroup==='All fields' ? FIELDS
    : window._veGroup==='Core' ? FIELDS.filter(f=>f.core||f.k==='name')
    : FIELDS.filter(f=>f.cat===window._veGroup);
  const cats = [...new Set(veFields.map(f=>f.cat))];
  const noteDot = f => {
    const hasC = NOTES.some(n=>!n.resolved && n.orgId===o.id && n.k===f.k);
    const hasN = !!CELLNOTES[o.id+':'+f.k];
    return (hasC?'<span title="Has open comments" style="color:#C4A47C">●</span>':'')+(hasN?'<span title="Has a note" style="color:#92C1DC">●</span>':'');
  };
  const tools = f => `<span style="white-space:nowrap;margin-left:6px">
    <span class="row-ic" style="width:17px;height:17px;font-size:9.5px" title="Comment on this field (@ to tag a teammate)" onclick="veComment(${o.id},'${f.k}',event)">💬</span>
    <span class="row-ic" style="width:17px;height:17px;font-size:9.5px;margin-left:3px" title="Add / edit the cell note" onclick="veNote(${o.id},'${f.k}',event)">📝</span>${noteDot(f)}</span>`;
  box.innerHTML = `<div class="kicker">Data studio · vertical edit</div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <h3 style="margin-bottom:2px">${esc(o.name)}</h3>
      <select onchange="openVerticalEdit(${o.id}, this.value)" style="border:1px solid var(--divider);border-radius:8px;padding:5px 9px;font:inherit;font-size:12.5px;background:#fff" title="Which field group to edit">
        ${groups.map(g=>`<option ${g===window._veGroup?'selected':''}>${g}</option>`).join('')}</select>
    </div>
    <div class="muted" style="font-size:12px;margin-bottom:14px">Every field as a row — edits save live to the same cells as the table view. 💬 comment · 📝 note on any field.</div>
    ${cats.map(cat=>`<div class="kicker" style="margin:18px 0 6px">${cat}</div>
      <div class="ve-grid">${veFields.filter(f=>f.cat===cat).map(f=>{
        const pubTag = f.pub?'<span title="Live on the member site" style="color:var(--gold-2,#9A7B3F)"> ●</span>':'';
        const lbl = `<div class="ve-lbl" title="${esc(f.desc||'')}">${f.l}${pubTag}${tools(f)}</div>`;
        if (f.fx) return `${lbl}<div class="ve-ro">${esc(f.fx(o))}</div>`;
        if (f.ro) return `${lbl}<div class="ve-ro">${esc(o[f.k])}</div>`;
        if (f.sel){
          const noBlank = f.k==='tier'||f.k==='visibility';
          const opts = (noBlank?[]:['']).concat(f.sel.filter(x=>x!==''));
          const cur = f.k==='visibility' ? (o.visibility||'shown') : String(o[f.k]??'');
          return `${lbl}
            <div><select class="ve-in" data-vk="${f.k}">${opts.map(x=>`<option value="${x}" ${x===cur?'selected':''}>${x||'—'}</option>`).join('')}</select></div>`;
        }
        let v = o[f.k]; if (Array.isArray(v)) v = v.join('; ');
        if (f.num) v = (o._range||{})[f.k] ? fmtCellRange(f, o._range[f.k]) : ((o._approx||{})[f.k]?'~':'') + fmtCellNum(f, v);
        return `${lbl}
          <div><textarea class="ve-in" data-vk="${f.k}" rows="1" ${f.num?'data-num="1"':''} spellcheck="false">${esc(v??'')}</textarea></div>`;
      }).join('')}</div>`).join('')}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px;border-top:1px solid var(--hairline);padding-top:13px">
      ${o.archived
        ? `<button class="btn" style="color:var(--good)" onclick="restoreOrg(${o.id});closeModal()">↩ Restore to active</button>`
        : `<button class="btn" style="color:var(--crit)" title="Soft delete — all data is kept and the org can be restored from the 🗄 Archived filter" onclick="archiveOrg(${o.id})">🗄 Archive organization</button>`}
      <button class="btn primary" onclick="closeModal();renderEdRows();flash('Vertical edits saved')">Done</button></div>`;
  veil.classList.add('show');
  const autos = ta=>{ ta.style.height='auto'; ta.style.height = Math.min(400, ta.scrollHeight+2)+'px'; };
  box.querySelectorAll('textarea.ve-in').forEach(ta=>{
    autos(ta);
    ta.addEventListener('focus', ()=>autos(ta));
    ta.addEventListener('input', ()=>{
      autos(ta);
      if (ta.dataset.num && /[^0-9.,\-$kKmMbB\s%~]/.test(ta.value)){
        ta.value = ta.value.replace(/[^0-9.,\-$kKmMbB\s%~]/g,''); flash('This field only accepts numbers');
      }
    });
    ta.addEventListener('blur', ()=>commitVertical(o, ta));
  });
  box.querySelectorAll('select.ve-in').forEach(sel=>sel.addEventListener('change', ()=>commitVertical(o, sel)));
};
/* comment / note popovers reachable from the vertical editor — same data as the table */
function veCellStub(orgId, k){
  return document.querySelector(`#edBody tr[data-id="${orgId}"] td[data-k="${k}"]`) || {classList:{add(){},remove(){}}};
}
window.veComment = function(orgId, k, ev){
  ev.stopPropagation();
  openNotePop(veCellStub(orgId,k), orgId, k, Math.min(innerWidth-320, ev.clientX), Math.min(innerHeight-290, ev.clientY+10));
};
window.veNote = function(orgId, k, ev){
  ev.stopPropagation();
  openCellNotePop(veCellStub(orgId,k), orgId, k, Math.min(innerWidth-320, ev.clientX), Math.min(innerHeight-240, ev.clientY+10));
};

function commitVertical(o, el){
  const key = el.dataset.vk, col = FIELDS.find(f=>f.k===key);
  if (!col || col.ro || col.fx) return;
  let v = (el.value||'').trim();
  const old = o[key];
  if (col.num){
    let approx = /^\s*~/.test(v); v = v.replace(/~/g,'');
    o._range = Object.assign({}, o._range);
    const range = parseStudioRange(v);
    if (range){
      const lo = col.mult ? range[0]/col.mult : range[0], hi = col.mult ? range[1]/col.mult : range[1];
      o._range[key] = [lo, hi]; v = (lo+hi)/2; approx = false;
      el.value = fmtCellRange(col, [lo, hi]);
    } else if (v.trim()===''){ v = 0; approx = false; delete o._range[key]; el.value = ''; }
    else {
      const n = parseStudioNum(v);
      if (n===null){
        const r0 = (o._range||{})[key];
        el.value = r0 ? fmtCellRange(col, r0) : fmtCellNum(col, old);
        flash('Not a number — use 1200000, $1.2M, or a range like $1M-$2M'); return;
      }
      v = col.mult ? n/col.mult : n;
      delete o._range[key];
      el.value = (approx && v ?'~':'') + fmtCellNum(col, v);
    }
    o._approx = Object.assign({}, o._approx);
    if (approx && v) o._approx[key] = 1; else delete o._approx[key];
    if (window.PERSIST && PERSIST.orgField && !((window.APP||{}).demo)){
      PERSIST.orgField(o, '_approx', o._approx);
      PERSIST.orgField(o, '_range', o._range);
    }
  }
  if (col.arr) v = v.split(/[;|]/).map(s=>s.trim()).filter(Boolean);
  if (JSON.stringify(v)===JSON.stringify(old)) return;
  o[key] = v;
  o.lastUpdated = new Date().toISOString().slice(0,10);
  if (key==='countries') autoLatLng(o);
  if (key==='countries'||key==='tier'||key==='visibility'){ if (key==='countries' && window.deriveOrgLL) deriveOrgLL(o); o.region = regionOf(o); buildPins(); }
  clearGathering(o, key, v, col);
  flash(o.name+' updated');
  if (window.PERSIST){ PERSIST.orgField ? PERSIST.orgField(o, key, v) : PERSIST.org(o); }
}

/* ================= BOOT ================= */
updateCartBadge();
route();
</script>
</body>
</html>
