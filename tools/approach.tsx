import { useState, useEffect, useRef } from "react";

const GR="#0F6E56",BL="#185FA5",PU="#533BB7",AM="#BA7517",RE="#A32D2D",TE="#993C1D",TA="#3B6D11";

// ── Shared UI ──────────────────────────────────────────────────────────────
function SH({num,title,sub}){return(<div style={{padding:"3rem 0 2rem",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:"2rem"}}>{num&&<p style={{fontSize:13,color:"var(--color-text-secondary)",letterSpacing:"0.08em",margin:"0 0 0.4rem"}}>SECTION {num}</p>}<h1 style={{fontSize:28,fontWeight:500,lineHeight:1.25,margin:"0 0 0.875rem"}}>{title}</h1>{sub&&<p style={{fontSize:16,color:"var(--color-text-secondary)",lineHeight:1.7,maxWidth:540,margin:0}}>{sub}</p>}</div>);}
function CB({c=GR,children}){return(<div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-lg)",padding:"1.125rem 1.375rem",borderLeft:`3px solid ${c}`,margin:"1.5rem 0"}}><p style={{fontSize:15,lineHeight:1.7,margin:0}}>{children}</p></div>);}
function BulletList({items,c=GR}){return(<div style={{display:"flex",flexDirection:"column",gap:7}}>{items.map((x,i)=>(<div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}><div style={{width:5,height:5,borderRadius:"50%",background:c,marginTop:8,flexShrink:0}}/><span style={{fontSize:13,color:"var(--color-text-secondary)",lineHeight:1.5}}>{x}</span></div>))}</div>);}
function DR({v,c}){return(<div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<=v?c:"var(--color-border-tertiary)"}}/>)}</div>);}
function PL({label,c}){return <span style={{fontSize:10,padding:"2px 7px",borderRadius:999,background:"var(--color-background-secondary)",color:c,border:`0.5px solid ${c}`,whiteSpace:"nowrap"}}>{label}</span>;}
function AC({label,c,sub,badges,icon,children}){
  const[o,setO]=useState(false);
  return(<div style={{marginBottom:7}}>
    <div onClick={()=>setO(!o)} style={{display:"flex",alignItems:"center",gap:11,padding:"0.8rem 1.125rem",border:o?`2px solid ${c}`:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",cursor:"pointer",background:o?"var(--color-background-secondary)":"var(--color-background-primary)",transition:"all 0.12s"}}>
      {icon&&<div style={{fontSize:17,color:c,flexShrink:0}}>{icon}</div>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:500,fontSize:14,color:o?c:"var(--color-text-primary)"}}>{label}</div>
        {sub&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2,lineHeight:1.4}}>{sub}</div>}
        {badges&&<div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>{badges}</div>}
      </div>
      <div style={{fontSize:14,color:"var(--color-text-secondary)",flexShrink:0,marginLeft:8}}>{o?"−":"+"}</div>
    </div>
    {o&&<div style={{borderLeft:`3px solid ${c}`,marginLeft:14,marginTop:3,padding:"0.875rem 1.125rem"}}>{children}</div>}
  </div>);
}
function TG({tabs,c,render}){
  const[t,setT]=useState(tabs[0].id);
  return(<div style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden",marginTop:8}}>
    <div style={{display:"flex",borderBottom:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>
      {tabs.map(tb=>(<button key={tb.id} onClick={()=>setT(tb.id)} style={{flex:1,padding:"7px 3px",border:"none",background:t===tb.id?"var(--color-background-primary)":"transparent",color:t===tb.id?c:"var(--color-text-secondary)",fontSize:11,cursor:"pointer",fontFamily:"var(--font-sans)",borderBottom:t===tb.id?`2px solid ${c}`:"none",fontWeight:t===tb.id?500:400}}>{tb.label}</button>))}
    </div>
    <div style={{padding:"0.875rem 1.125rem"}}>{render(t)}</div>
  </div>);
}
function NL({go,to,label}){return(<p style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:"2rem",cursor:"pointer"}} onClick={()=>go(to)}>Next: <span style={{color:GR}}>{label} →</span></p>);}
function Sec({children}){return <div style={{borderBottom:"0.5px solid var(--color-border-tertiary)",paddingBottom:"2rem",marginBottom:"2rem"}}>{children}</div>;}
function H2({children}){return <h2 style={{fontSize:17,fontWeight:500,margin:"0 0 0.625rem"}}>{children}</h2>;}
function P({children,muted}){return <p style={{fontSize:14,lineHeight:1.7,margin:"0 0 0.75rem",color:muted?"var(--color-text-secondary)":"inherit"}}>{children}</p>;}

// ── Data ───────────────────────────────────────────────────────────────────
const TOC_D=[{id:"problem",label:"Identified problem",desc:"A specific, real harm or unmet need affecting individuals or ecosystems.",c:BL},{id:"inputs",label:"Inputs & activities",desc:"Resources, programs, and interventions designed to address the problem.",c:GR},{id:"outputs",label:"Outputs",desc:"Direct measurable results — meals served, surgeries performed.",c:PU},{id:"outcomes",label:"Outcomes",desc:"The actual change in wellbeing: reduced suffering, increased flourishing.",c:TA},{id:"extern",label:"Externalities",desc:"Unintended effects — positive or negative — on people and systems beyond the direct target.",c:AM}];
const DOMAINS=[{id:"lifestyle",label:"Lifestyle",c:GR,icon:"◎",desc:"How you live — what you eat, buy, and model for others — is the substrate of impact. Integrity between values and behavior compounds into culture, and culture moves systems.",examples:["Dietary choices that reduce animal suffering and environmental harm","Consumption patterns that don't externalize costs onto others","Modeling generosity, curiosity, and accountability for the people around you"]},{id:"expertise",label:"Expertise",c:BL,icon:"◑",desc:"Your skills and professional leverage are forms of capital. The world needs people who bring investment-grade rigor to nonprofits, communications talent to causes that can't pay for it.",examples:["Board service and strategic advising for high-impact orgs","Pro bono professional services — legal, comms, finance","Researching and vetting organizations for others who want to give well"]},{id:"financial",label:"Financial giving",c:PU,icon:"●",desc:"Money is the most fungible and scalable form of giving. Given well — to the right interventions with the right accountability — it can save a life or protect an animal from suffering.",examples:["Targeted giving to evidence-backed orgs in high-priority cause areas","Investment-grade portfolio with defined thesis and annual review","Leveraged giving: donor circles, matching campaigns, funder collaboration"]}];
const TIERS=[{id:"dammed",label:"Dammed",c:RE,icon:"▣",desc:"Capital and goodwill sit locked — in DAFs that never distribute, in orgs that prioritize survival over outcomes, in donor relationships built on social performance rather than impact.",signs:["DAF balances growing faster than distributions","Giving driven by social obligation or visibility","Organizations that can't articulate their theory of change","Funding based on who you know, not what works"]},{id:"passive",label:"Passive",c:AM,icon:"▷",desc:"Giving happens — but reactively. A compelling story, a friend's ask, a headline. No strategy, no compounding, no way to know if it's working.",signs:["Giving to 10+ causes without depth in any","Can't name the outcomes your donations produce","Responds to campaigns rather than driving strategy","No giving portfolio — just a trail of receipts"]},{id:"investment",label:"Investment-grade",c:GR,icon:"◆",desc:"Giving structured like capital deployment. You know what you're buying with every dollar. You have a thesis, a portfolio, and a feedback loop. Impact compounds over time.",signs:["Clear giving thesis aligned to cause areas","Defined metrics for what success looks like","Annual review: what worked, what didn't, what changed","Giving that grows in impact per dollar over time"]}];
const PILLARS=[{id:"accuracy",label:"Accuracy",outcome:"Confidence",c:BL,desc:"You know what's true. You can distinguish evidence from emotional resonance. You're not easy to manipulate with compelling stories.",lacking:"Uncertain and paralyzed. Conflicting information makes giving feel risky. You respond to the most recent compelling ask.",build:["Read GiveWell's top charity research","Understand DALYs and cost-effectiveness basics","Learn to evaluate a Theory of Change","Follow Giving What We Can for updated thinking"]},{id:"focus",label:"Focus",outcome:"Alignment",c:GR,desc:"Your giving is aligned with what you believe matters most. You have a thesis — not just preferences — and can articulate why you give where you give.",lacking:"Giving feels scattered. You respond to asks. You have receipts for 15 orgs but can't explain your strategy.",build:["Identify your top 1-3 cause areas using scale/neglect/tractability","Write a one-page giving thesis","Consolidate to fewer, deeper commitments","Use Section 05 to stress-test your prioritization"]},{id:"efficiency",label:"Efficiency",outcome:"Momentum",c:PU,desc:"Your giving compounds. You understand leverage — where a dollar produces the most good. Your impact per dollar increases over time.",lacking:"Good intentions, unclear leverage. No sense of whether effort converts to outcome. Giving doesn't build.",build:["Understand cost-effectiveness — what does a dollar actually buy?","Use a DAF or giving account to consolidate and track","Set a giving target and automate toward it","Do an annual impact review"]},{id:"reporting",label:"Reporting",outcome:"Fulfillment",c:AM,desc:"You see what your giving does. You can tell the story of your impact — to yourself, your family, your community.",lacking:"Disconnected from outcomes. Giving doesn't excite you. Hard to explain or inspire others.",build:["Ask your top orgs for outcome data — what did last year's donations produce?","Build a simple one-page impact report for yourself","Share your giving framework with family or community","Track and report using Factory for Good's portfolio tools"]}];
const LSCAPE=[{id:"eval",label:"Evaluators & rankers",c:BL,icon:"◈",role:"They do rigorous research and ranking so donors don't start from scratch.",trustFor:"Understanding which orgs have strong evidence — the best starting point, not a substitute for your own thesis.",orgs:[{n:"GiveWell",note:"Gold standard for near-term global health. Rigorous, transparent, narrow scope."},{n:"Giving What We Can",note:"Pledge community + curated recommendations. Strong on values alignment."},{n:"Founders Pledge",note:"High-net-worth focused. Excellent climate and x-risk research."},{n:"Animal Charity Evaluators",note:"Primary evaluator for farmed animal welfare."},{n:"Happier Lives Institute",note:"Focuses on WELLBYs. Pioneering mental health cause area."}]},{id:"research",label:"Researchers & think tanks",c:PU,icon:"◎",role:"They generate the evidence base that evaluators draw from and implementers use to design programs.",trustFor:"Deep dives on specific interventions, cost-effectiveness modeling, and cause prioritization.",orgs:[{n:"J-PAL",note:"RCT research on poverty interventions."},{n:"80,000 Hours",note:"Career and cause prioritization research, especially x-risk."},{n:"Open Philanthropy",note:"Major funder and research institution. Strong on long-term causes."},{n:"Rethink Priorities",note:"Rigorous research on animal welfare and global health."}]},{id:"impl",label:"Direct implementers",c:GR,icon:"●",role:"These orgs do the actual work. Quality varies enormously. The best are remarkable.",trustFor:"Understanding what a high-performing frontline org looks like.",orgs:[{n:"Against Malaria Foundation",note:"Bednet distribution. One of the most cost-effective interventions studied."},{n:"GiveDirectly",note:"Direct cash transfers. The benchmark every other intervention should beat."},{n:"Food 4 Education",note:"School meals in Kenya. Economic ripple effects that compound."},{n:"StrongMinds",note:"Group psychotherapy in Africa. Remarkable cost-per-WELLBY."},{n:"The Humane League",note:"Corporate animal welfare campaigns with documented, measurable wins."}]},{id:"cap",label:"Capacity builders",c:AM,icon:"◑",role:"They train, launch, and support new organizations — multiplying the supply of high-performing nonprofits.",trustFor:"The meta-level: if you want to fund the pipeline, not just current orgs, this is the layer to understand.",orgs:[{n:"Charity Entrepreneurship",note:"Incubates evidence-backed nonprofits from scratch."},{n:"Y Combinator (nonprofit track)",note:"Applies startup rigor to social ventures."}]},{id:"fund",label:"Major funders",c:TE,icon:"◆",role:"They move large amounts of capital — sometimes transformatively, sometimes crowding out better approaches.",trustFor:"Understanding where large capital flows are going — and where they aren't.",orgs:[{n:"Gates Foundation",note:"Largest private foundation. Dominant in global health."},{n:"Open Philanthropy",note:"EA-aligned, growing influence on global health and x-risk."},{n:"Skoll Foundation",note:"Social entrepreneurship focus. Strong on systems change."}]},{id:"watch",label:"Watchdogs",c:RE,icon:"◇",role:"They monitor for fraud and governance failures. Useful — but often confused with evaluators, leading to overhead obsession.",trustFor:"Baseline compliance only — not impact assessment. Not fraudulent ≠ effective.",orgs:[{n:"Charity Navigator",note:"Widely used but historically financial-focused, not outcomes-focused."},{n:"Candid / Guidestar",note:"Data infrastructure. Best for raw financial data and Form 990s."}]}];
const CAUSES=[{id:"gh",label:"Global health & development",term:"near",c:GR,meas:"high",suffering:"1.8 billion people lack basic healthcare. Malaria, diarrhea, and pneumonia kill millions of children annually — most deaths are cheap to prevent.",flourishing:"Children who survive early childhood earn more, learn more, and raise healthier families. Health is the foundation everything else is built on.",measure:"Cost per life saved, DALYs averted. GiveWell estimates top charities save a life for $3,000–$5,000.",orgs:["Against Malaria Foundation","Helen Keller International","GiveDirectly","New Incentives"]},{id:"aw",label:"Animal welfare",term:"near",c:PU,meas:"medium",suffering:"70+ billion land animals raised in factory farms annually under severe confinement. Most live and die without any legal protection.",flourishing:"A world where sentient creatures are not systematically tortured for convenience or marginal cost savings.",measure:"Animals helped per dollar, welfare points, corporate commitments secured.",orgs:["The Humane League","Animal Charity Evaluators","Open Wing Alliance"]},{id:"mh",label:"Mental health",term:"near",c:BL,meas:"medium",suffering:"1 in 4 people globally experience a mental health condition. Treatment gaps in low-income countries exceed 90%.",flourishing:"Mental health is the substrate of everything else — relationships, productivity, physical health, and the capacity to contribute.",measure:"WELLBYs (wellbeing-adjusted life years). StrongMinds can improve wellbeing for ~$100/person.",orgs:["StrongMinds","Happier Lives Institute"]},{id:"cli",label:"Climate & ecosystems",term:"both",c:TA,meas:"medium",suffering:"Climate change displaces 20M+ people/year and disproportionately harms those least responsible. Biodiversity loss is collapsing the biological systems all life depends on.",flourishing:"Stable climate, intact ecosystems, and natural systems producing clean water, food, and breathable air.",measure:"Tons CO2 avoided, species protected. Policy and tech approaches outperform individual offsets.",orgs:["Clean Air Task Force","Carbon180","Founders Pledge Climate Fund"]},{id:"ed",label:"Education & opportunity",term:"near",c:AM,meas:"medium",suffering:"300M+ children are in school but not learning. In many low-income countries, students complete primary school unable to read.",flourishing:"Educated children have more agency, better health outcomes, higher lifetime earnings, and raise more educated children.",measure:"Learning-adjusted years of schooling. Evidence is mixed — quality implementation matters enormously.",orgs:["Food 4 Education","Educate!","IDinsight"]},{id:"bio",label:"Biosecurity",term:"long",c:BL,meas:"low",suffering:"COVID-19 caused 15–20M excess deaths. Future pandemics — natural or engineered — could be far worse. Prevention infrastructure is chronically underfunded.",flourishing:"Scientific, institutional, and political infrastructure to detect and contain biological threats before they become catastrophes.",measure:"Assessed through probability-weighted expected harm reduction and policy change cost-effectiveness.",orgs:["Johns Hopkins Center for Health Security","Nuclear Threat Initiative"]},{id:"ai",label:"AI safety & alignment",term:"long",c:PU,meas:"low",suffering:"Transformative AI could pose risks to human autonomy and survival if developed without adequate safety research and governance.",flourishing:"AI developed in ways that remain aligned with human values, distributed equitably, and governed by robust institutions.",measure:"Hard to quantify. Tractability and neglectedness make this high-priority for some.",orgs:["Anthropic","Center for Human-Compatible AI","AI Safety Fund"]}];
const PRIOS=[{rank:1,label:"Global health — targeted interventions",c:GR,scale:5,neglect:4,tract:5,why:"The math is hard to argue with. Malaria, diarrhea, and vitamin deficiency kill millions of children annually. We have cheap, proven tools. For $3,000–$5,000 you can save a human life — a documented, replicated result. The relative neglect compared to domestic giving is staggering.",caveat:"Cost-effectiveness estimates require ongoing scrutiny. This cause has the strongest evidence base of any."},{rank:2,label:"Factory farming & animal welfare",c:PU,scale:5,neglect:5,tract:3,why:"70 billion land animals per year. If sentient beings capable of suffering matter morally, this is one of the most numerically enormous ongoing catastrophes on earth — and one of the most underfunded. Corporate welfare campaigns have demonstrated tractability.",caveat:"Tractability varies by approach. Incremental welfare improvements are more measurable than systemic change."},{rank:3,label:"Mental health — low-income settings",c:BL,scale:4,neglect:5,tract:4,why:"Depression and anxiety are leading causes of global disability. Treatment gaps exceed 90% in low-income countries. StrongMinds has shown group psychotherapy can dramatically improve wellbeing at ~$100/person.",caveat:"WELLBY measurement frameworks are newer and less established than DALYs."},{rank:4,label:"Climate & ecosystem protection",c:TA,scale:5,neglect:2,tract:3,why:"The long-term stakes are enormous. I prioritize policy and technology levers (Clean Air Task Force-style) over offsets, which have a poor evidence record. But this receives enormous funding relative to most causes here.",caveat:"My marginal dollar matters less here than in more neglected areas."},{rank:5,label:"Direct cash transfers",c:AM,scale:4,neglect:3,tract:4,why:"Direct cash (GiveDirectly) is one of the best-studied interventions in development. They respect autonomy and function as a benchmark — if a program can't outperform just giving people money, it probably shouldn't exist.",caveat:"Cash doesn't address structural causes of poverty — powerful but not a substitute for health and education."}];
const PIPELINE=[{id:"source",num:"01",label:"Source",c:BL,desc:"Where do orgs enter my radar? Sourcing determines the quality of everything downstream.",criteria:[{q:"Does it come from a trusted evaluator?",note:"GiveWell, ACE, Founders Pledge, HLI — orgs with primary research"},{q:"Is it in a high-priority cause area?",note:"Cross-references Section 05 prioritization"},{q:"Referral from a trusted practitioner?",note:"Sector insiders surface orgs before evaluators do"},{q:"Does it pass the scale sniff test?",note:"Can this approach reach people who need it meaningfully?"}],signal:"Sourcing through evaluators + trusted referrals reduces wasted screening time by 80%."},{id:"screen",num:"02",label:"Screen",c:GR,desc:"A fast pass/fail filter. Eliminating orgs that fail basic structural criteria before investing real research time.",criteria:[{q:"Is there a clear theory of change?",note:"Problem → intervention → outcome chain that is plausible and testable"},{q:"Can they articulate outcomes they produce?",note:"Not activities — outcomes. Not 'trained 500 teachers' but 'students learn more'"},{q:"Is the 990 publicly available?",note:"Transparency baseline — refusal is a red flag"},{q:"Is funding the actual constraint?",note:"Talent-limited orgs won't be helped by money alone"}],signal:"Roughly 60–70% of orgs fail screening — most on ToC clarity and outcome articulation."},{id:"vet",num:"03",label:"Vet",c:PU,desc:"Deep evaluation. Beyond the website and pitch deck — into the evidence.",criteria:[{q:"What is the quality of evidence?",note:"RCT? Quasi-experimental? Pre/post self-report? The hierarchy matters."},{q:"What is the counterfactual impact?",note:"Would this happen anyway? Is there other coverage?"},{q:"What is the cost per outcome?",note:"Per life saved, DALY, WELLBY, child fed, surgery performed"},{q:"Is leadership transparent and learning-oriented?",note:"Do they share what hasn't worked?"},{q:"M.O.M. score?",note:"Mission clarity, Outcome measurement, Management quality"},{q:"Is this a Pegasus org?",note:"Operating on the frontier — doing what few others can or will?"}],signal:"Vetting takes 4–8 hours per org. The payoff is confidence that a dollar does what you think it does."},{id:"verify",num:"04",label:"Verify",c:AM,desc:"Ongoing accountability after the initial grant. Impact isn't a one-time evaluation.",criteria:[{q:"Did they report on outcomes from last year?",note:"Specific, quantified, honest — including what didn't work"},{q:"Has the evidence base strengthened or weakened?",note:"New studies, updated cost-effectiveness, replication"},{q:"Is the org trajectory healthy?",note:"Growth without mission drift; scale without execution collapse"},{q:"Red flags from external sources?",note:"Evaluator downgrades, leadership changes, auditor notes"}],signal:"Verification is where most donors fall off. Annual review separates giving from investing."}];
const FWORKS=[{id:"mom",label:"M.O.M. org",c:GR,desc:"Mission-Outcomes-Managed. Exceptional clarity on what problem is being solved, rigorous measurement of whether it's being solved, and the leadership and systems to execute reliably. These three rarely coexist — when they do, you've found something special."},{id:"peg",label:"Pegasus org",c:PU,desc:"An org operating on the frontier — doing what few others can or will. Either because the evidence is new, the cause is neglected, the approach unconventional, or the leadership exceptional. These produce outsized counterfactual impact."},{id:"fg5",label:"ForGood 500",c:BL,desc:"Factory for Good's curated list of highest-performing nonprofits across priority cause areas — evaluated against M.O.M. criteria, counterfactual impact, and cost-effectiveness benchmarks. The S&P 500 for impact investing."}];
const TRAPS=[{id:"overhead",cat:"donor",label:"The overhead obsession",c:RE,hook:"You find out an org spends 25% on admin and feel cheated.",what:"Donors conflate low overhead with high impact. Nonprofits starve their operations, underinvest in talent, and execute mediocrely on programs that sound good in the brochure. A nonprofit spending 5% on overhead and achieving nothing is worse than one spending 35% that changes outcomes.",antidote:"Ask 'what does a dollar produce?' not 'where does it go?' The real question is: what are the outcomes, and what did they cost?",real:"Charity Navigator's original rating was primarily overhead-based — with zero correlation to program effectiveness."},{id:"theater",cat:"sector",label:"Fundraising theater",c:TE,hook:"The most compelling story gets the donation. The most impactful program doesn't.",what:"Nonprofits learn fast: emotional storytelling raises more money than evidence. The sector gets optimized for donor emotion rather than beneficiary outcomes.",antidote:"Let the story draw you in — then apply the pipeline. Ask for numbers, not just narratives.",real:"TOMS Shoes raised enormous amounts on buy-one-give-one while research showed it actively harmed local shoe manufacturers."},{id:"goodhart",cat:"sector",label:"Goodhart's Law",c:AM,hook:"The metric becomes the goal.",what:"When you measure an org on a specific number, that number becomes what they optimize for. Meals served goes up; nutrition outcomes may not. The map replaces the territory.",antidote:"Track outcome metrics, not activity metrics. Use metrics the org wasn't optimizing for — they're harder to game.",real:"Several education nonprofits in the 2000s showed remarkable enrollment numbers while independent testing revealed no learning improvements."},{id:"savior",cat:"impl",label:"White saviorism & dependency",c:PU,hook:"We're going to help these people.",what:"Interventions designed without community input, led by outsiders, structured around the donor's emotional needs. They create dependency, undermine local capacity, and often do net harm.",antidote:"Ask: does this program strengthen or weaken local agency? Is it led by community members? Would it exist if donors weren't watching?",real:"Voluntourism orphanages in some countries have been documented to incentivize family separation."},{id:"scope",cat:"donor",label:"Scope insensitivity",c:BL,hook:"The story of one child moves you more than statistics about a million.",what:"Humans respond to identifiable individuals, not abstract scale. We'll give $1,000 to rescue a dog on the news and $0 to prevent 1,000 children's deaths. This systematically misdirects giving toward visible, small-scale suffering.",antidote:"Build a practice of deliberate attention to scale. Use cost-effectiveness math to check emotional intuitions.",real:"Celebrity-endorsed local causes consistently outfund evidence-backed global health interventions — even when the latter produce 100x the benefit per dollar."},{id:"warmglow",cat:"donor",label:"Warm glow giving",c:TA,hook:"I gave. I feel good. I'm done.",what:"The emotional reward of giving substitutes for concern about outcomes. Once the receipt is in hand, the psychological itch is scratched — regardless of what the money actually did.",antidote:"Tie your emotional satisfaction to outcomes, not acts. The warm glow should come from knowing what your gift produced.",real:"Disaster relief donations spike after earthquakes while chronic humanitarian crises go unfunded — they don't generate news cycles."},{id:"prestige",cat:"donor",label:"Prestige capture",c:PU,hook:"The most well-known cause must be the most important.",what:"Hospital wings, university endowments, art museums attract enormous donations partly for naming rights and social status. Your giving portfolio may reflect your social world more than your values.",antidote:"Map your current giving against your stated values. Ask: if no one would ever know I gave this, would I still give it?",real:"US donors give vastly more to domestic education and arts than to global health interventions saving lives for $4,000 each."},{id:"daf",cat:"sector",label:"Idle DAF capital",c:RE,hook:"I've set aside the money — that counts, right?",what:"Donor Advised Funds receive a tax deduction at contribution but have no legal distribution requirement. Billions sit growing tax-advantaged while charities go underfunded.",antidote:"A DAF is a tool, not a destination. Set a payout rate and honor it — distribute at least as much as you contribute annually.",real:"Over $234 billion was held in DAFs in 2023. Some sponsors distribute under 10% annually."}];
const GAPS=[{id:"talent",label:"The talent gap",c:PU,icon:"◎",headline:"The sector systematically underinvests in the people doing the work.",body:"Nonprofit compensation runs 20–30% below for-profit equivalents. The sector competes for talent against organizations that pay more and have clearer career paths. The best people often leave. The ones who stay are doing it on sacrifice.",consequences:["Leadership gaps in orgs with proven models","High turnover in implementation — losing institutional knowledge","Under-resourced finance and ops creating compliance risk","Boards that don't understand what executive talent actually costs"],action:"Fund compensation at market rates. Stop treating competitive salaries as a red flag in a budget."},{id:"perf",label:"Performance culture",c:GR,icon:"●",headline:"Most nonprofits don't have a culture of honest performance evaluation.",body:"In the private sector, failed products lose revenue. In nonprofits, feedback loops are weaker. Donors give based on story. Boards prioritize governance over management accountability. Staff are protected from honest feedback because the culture conflates mission with performance.",consequences:["Programs continue past evidence of ineffectiveness","Leaders evaluated on fundraising, not impact","Staff evaluations focus on attitude, not outcomes","Program failure is culturally punished rather than treated as information"],action:"Build outcome-linked evaluation at every level. Normalize program failure as data, not shame."},{id:"unrestr",label:"Unrestricted funding gap",c:BL,icon:"◑",headline:"Donors fund programs. Almost nobody funds the organization.",body:"Restricted funding means nonprofits can run a great program but can't afford the CFO who'd make them sustainable or the evaluation team that'd prove their impact. Chronically undercapitalized organizations can't invest in their own excellence.",consequences:["Strategic capacity perpetually underfunded","Evaluation and learning cut first when budgets tighten","Leadership spread across too many roles","Growth requires proportionally more donor management"],action:"Give unrestricted. Trust the organizations you've vetted to allocate well."},{id:"conc",label:"Funding concentration",c:AM,icon:"◆",headline:"Capital is concentrated in a tiny number of causes and organizations.",body:"The top 1% of nonprofits receive over 80% of charitable dollars. Causes with good PR (cancer, disaster relief) are dramatically overfunded relative to impact potential. High-impact causes in global health, animal welfare, and mental health remain neglected.",consequences:["Effective orgs in neglected causes can't scale for lack of funding","Overfunded causes attract lower-quality orgs that persist on narrative","Donor behavior tracks news cycles, not impact curves","The nonprofit funding market is deeply inefficient"],action:"Explicitly seek neglected causes. The most valuable marginal dollar is in the most underfunded, evidence-backed area."}];
const LEVERS=[{l:"Regulation",m:"★★★★★",d:"Sets floors for behavior across entire industries"},{l:"Tax incentives",m:"★★★★☆",d:"Redirects private capital toward socially beneficial ends"},{l:"Public procurement",m:"★★★★☆",d:"Government purchasing power shapes entire supply chains"},{l:"Direct programming",m:"★★★☆☆",d:"Government-run programs at scale (SNAP, Medicare, PEPFAR)"},{l:"Research funding",m:"★★★☆☆",d:"Produces public goods with enormous positive spillovers"},{l:"Philanthropy",m:"★★☆☆☆",d:"Fills gaps, tests models, advocates — but limited scale"},{l:"Individual action",m:"★☆☆☆☆",d:"Meaningful but insufficient alone; matters most as signal"}];
const SECTORS=[{id:"biz",label:"Business",c:BL,icon:"◆",premise:"Businesses encode values in what they build, who they hire, how they treat workers, and what they externalize onto communities.",good:["Mission-driven operations — products that solve real problems rather than create artificial ones","Supply chain accountability — tracing and eliminating extraction and exploitation","Living wages — treating compensation as a dignity floor, not a cost to minimize","Genuine ESG — measurable, third-party verified commitments, not marketing copy"],theater:"CSR press releases. 1% pledges that don't change operations. Sustainability reports with no emission targets. Cause marketing that harvests goodwill without changing the underlying product."},{id:"gov",label:"Government",c:GR,icon:"●",premise:"Governments are the highest-leverage actor in the ecosystem. A single policy change can do more good than a decade of philanthropic work.",good:["Evidence-informed policy — using RCT research to build and reform public programs","Global health diplomacy — PEPFAR, USAID, WHO programs that dwarf private philanthropy in scale","Regulatory floor-setting — minimum standards for animal welfare, environment, labor rights","Scientific infrastructure — pandemic preparedness, climate science, basic research"],theater:"Policy commitments without enforcement. Green pledges at summits with no implementation pathway. Regulatory capture where agencies protect the industries they regulate."},{id:"civil",label:"Civil society",c:PU,icon:"◎",premise:"Nonprofits, advocacy groups, media, universities — the connective tissue between individual action and systemic change. Where norms shift, movements begin.",good:["Norm change & advocacy — building political conditions that make good policy inevitable","Watchdog & accountability — investigative journalism, NGO monitoring, transparency infrastructure","Community wealth building — credit unions, land trusts, worker ownership models","Research & education — generating the knowledge base and training the next generation"],theater:"Advocacy without organizing. Movements that generate social media engagement but no policy wins. Universities that research poverty without employing people who've experienced it."}];
const LOTTERY=[{l:"Country of birth",s:"Half the world lives on under $7/day",w:"Geography is the single biggest predictor of life outcome"},{l:"Body you're born into",s:"1 in 10 people are born with a disability",w:"Access to health, mobility, and dignity varies enormously"},{l:"Family wealth",s:"Your parents' income predicts yours more than almost anything else",w:"Generational wealth compounds; generational poverty does too"},{l:"Species",s:"70 billion land animals are raised for food each year",w:"Whether you can suffer matters more than whether you can vote"},{l:"Era of birth",s:"A child born today has 10x better health odds than one born in 1900",w:"The accident of timing shapes everything"}];
const FLOURISH=[{i:"◉",l:"Physical health",d:"Freedom from preventable disease, access to nutrition, safety, and rest"},{i:"◎",l:"Mental wellbeing",d:"Agency, meaning, connection, and freedom from chronic suffering"},{i:"◑",l:"Social belonging",d:"Community, trust, and the sense of being seen and valued"},{i:"◌",l:"Economic dignity",d:"Enough — not excess — but enough to choose, plan, and build"},{i:"●",l:"Environmental health",d:"Living systems that sustain life, not ones we're drawing down"},{i:"◈",l:"Freedom & agency",d:"The ability to live according to your own values and choices"}];

// ── Section components ─────────────────────────────────────────────────────
function Home({go}){
  const[dt,setDt]=useState(null);
  const[ps,setPs]=useState({accuracy:3,focus:3,efficiency:3,reporting:3});
  const[show,setShow]=useState(false);
  const TYPES=[{id:"sideline",icon:"◎",label:"Sideline",desc:"I care but haven't started. It feels overwhelming or unclear."},{id:"passive",icon:"◑",label:"Passive",desc:"I give occasionally when something moves me. Not outcome-focused."},{id:"active",icon:"◕",label:"Active",desc:"I give intentionally. I've thought about where money goes."},{id:"proactive",icon:"●",label:"Proactive",desc:"Impact is integrated into how I live, work, and give."}];
  const PA=[{id:"accuracy",label:"Accuracy",sub:"→ Confidence",lack:"Uncertain, paralyzed. Stories move you more than evidence."},{id:"focus",label:"Focus",sub:"→ Alignment",lack:"Scattered and reactive. No through-line between values and action."},{id:"efficiency",label:"Efficiency",sub:"→ Momentum",lack:"Good intentions, unclear leverage. Effort doesn't compound."},{id:"reporting",label:"Reporting",sub:"→ Fulfillment",lack:"Disconnected from outcomes. Giving doesn't excite you."}];
  const weak=Object.entries(ps).filter(([,v])=>v<=2).map(([k])=>k);
  const SNAV=[{id:"s01",l:"01 · What is impact?"},{id:"s02",l:"02 · How to live impactfully"},{id:"s03",l:"03 · The landscape"},{id:"s04",l:"04 · Cause areas"},{id:"s05",l:"05 · Where suffering is solvable"},{id:"s06",l:"06 · How I evaluate orgs"},{id:"s07",l:"07 · How do-gooding goes wrong"},{id:"s08",l:"08 · The talent & funding gap"},{id:"s09",l:"09 · Systems thinking"},{id:"s10",l:"10 · The world we want"}];
  return(<div>
    <Sec>
      <p style={{fontSize:12,color:"var(--color-text-secondary)",letterSpacing:"0.08em",margin:"2.5rem 0 0.75rem"}}>FACTORY FOR GOOD</p>
      <h1 style={{fontSize:32,fontWeight:500,lineHeight:1.25,margin:"0 0 1rem",maxWidth:500}}>You didn't choose where you were born.</h1>
      <p style={{fontSize:16,color:"var(--color-text-secondary)",lineHeight:1.7,maxWidth:520,margin:"0 0 1.5rem"}}>Neither did anyone else. Most of the world's suffering is unchosen — and most of it is solvable.</p>
      <CB c={GR}>The vast majority of people, organizations, governments, and religions genuinely want to create a better world. If that sounds naive, you might be listening to the news instead of your neighbors. The problem isn't bad intent — it's misaligned incentives. Our systems reward advancement, profit, and status even when the externalities are extraction, exploitation, addiction, and the quiet destruction of health — social, mental, physical, environmental. This isn't about calling out bad actors. It's about helping good-intentioned people get better at doing what they already want to do.</CB>
    </Sec>
    <Sec>
      <p style={{fontSize:12,color:"var(--color-text-secondary)",letterSpacing:"0.08em",margin:"0 0 0.4rem"}}>FIND YOUR STARTING POINT</p>
      <H2>What kind of do-gooder are you?</H2>
      <P muted>No wrong answers. Wherever you are is a starting point, not a verdict.</P>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:9,marginBottom:"1.375rem"}}>
        {TYPES.map(t=>(<div key={t.id} onClick={()=>{setDt(t.id);setShow(false);}} style={{cursor:"pointer",border:dt===t.id?`2px solid ${GR}`:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem",background:dt===t.id?"var(--color-background-secondary)":"var(--color-background-primary)"}}>
          <div style={{fontSize:18,color:GR,marginBottom:5}}>{t.icon}</div>
          <div style={{fontWeight:500,fontSize:13,marginBottom:3}}>{t.label}</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.4}}>{t.desc}</div>
        </div>))}
      </div>
      {dt&&<>
        <P muted>Now rate yourself on each pillar:</P>
        {PA.map(p=>(<div key={p.id} style={{marginBottom:"1.125rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontWeight:500,fontSize:13}}>{p.label} <span style={{color:"var(--color-text-secondary)",fontWeight:400,fontSize:12}}>{p.sub}</span></span>
            <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{["","struggling","early","developing","solid","strong"][ps[p.id]]}</span>
          </div>
          <input type="range" min="1" max="5" step="1" value={ps[p.id]} onChange={e=>setPs(x=>({...x,[p.id]:+e.target.value}))} style={{width:"100%",accentColor:GR}}/>
          {ps[p.id]<=2&&<p style={{fontSize:11,color:AM,margin:"3px 0 0",borderLeft:`2px solid ${AM}`,paddingLeft:7,lineHeight:1.4}}>{p.lack}</p>}
        </div>))}
        <button onClick={()=>setShow(true)} style={{padding:"7px 18px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"transparent",color:"var(--color-text-primary)",fontSize:13,cursor:"pointer",fontFamily:"var(--font-sans)"}}>Show me where to start ↗</button>
        {show&&<div style={{marginTop:"0.875rem",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-lg)",padding:"1.125rem 1.375rem"}}>
          <p style={{fontWeight:500,fontSize:14,margin:"0 0 0.625rem"}}>{dt==="sideline"?"Welcome. The hardest part is deciding to start.":dt==="passive"?"You have the intent. Let's build the architecture.":dt==="active"?"You're doing real work. Here's how to amplify it.":"Let's sharpen what you already have."}</p>
          {weak.length>0?weak.map(id=>{const p=PA.find(x=>x.id===id);const dest=id==="accuracy"?"s01":id==="focus"?"s04":id==="efficiency"?"s06":"s08";return(<div key={id} style={{fontSize:13,borderLeft:`2px solid ${GR}`,paddingLeft:8,marginBottom:5}}><span style={{fontWeight:500}}>{p.label}</span> — start with <span style={{color:GR,cursor:"pointer"}} onClick={()=>go(dest)}>Section {dest.slice(1)}</span></div>);}):(<p style={{fontSize:13,color:"var(--color-text-secondary)",margin:0}}>Strong foundation. Start anywhere — or try Section 07 to pressure-test your instincts.</p>)}
        </div>}
      </>}
    </Sec>
    <div style={{paddingBottom:"2rem"}}>
      <p style={{fontSize:12,color:"var(--color-text-secondary)",letterSpacing:"0.08em",margin:"0 0 0.5rem"}}>EXPLORE</p>
      <H2>Ten perspectives on impact</H2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:9}}>
        {SNAV.map(s=>(<div key={s.id} onClick={()=>go(s.id)} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem 1rem",cursor:"pointer",background:"var(--color-background-primary)"}} onMouseEnter={e=>e.currentTarget.style.borderColor=GR} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--color-border-tertiary)"}><div style={{fontWeight:500,fontSize:12,color:GR}}>{s.l}</div></div>))}
      </div>
    </div>
  </div>);
}

function S01({go}){
  return(<div>
    <SH num="01" title="What is impact?" sub="The word gets used to mean almost anything. Here's what it actually means — and what it doesn't."/>
    <Sec>
      <H2>The definition</H2>
      <P>Impact is <strong style={{fontWeight:500}}>intervening in a way that causally reduces suffering and increases flourishing</strong> — for individuals and ecosystems — taking into account as many externalities as possible.</P>
      <P muted>That causal chain matters. Good intentions aren't impact. Spending money isn't impact. Awareness isn't impact. Impact is a change in someone's actual experience of the world — less pain, more agency, more dignity, more life.</P>
    </Sec>
    <Sec>
      <H2>The theory of change</H2>
      <P muted>Every meaningful intervention can be mapped as a causal chain. Select a stage to understand what it means.</P>
      {TOC_D.map((t,i)=>(<div key={t.id}><AC label={t.label} c={t.c}><P muted>{t.desc}</P></AC>{i<TOC_D.length-1&&<div style={{display:"flex",justifyContent:"center",color:"var(--color-text-secondary)",fontSize:12,margin:"-1px 0"}}>↓</div>}</div>))}
    </Sec>
    <Sec>
      <H2>What impact includes — and excludes</H2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div><p style={{fontSize:11,color:GR,letterSpacing:"0.06em",fontWeight:500,margin:"0 0 0.625rem"}}>INCLUDED</p>      <BulletList c={GR} items={["Reducing preventable disease, poverty, and suffering","Expanding access to food, health, education, and safety","Protecting and restoring natural systems and ecosystems","Improving wellbeing for animals and all sentient creatures","Preventing harm at scale — now and for future generations"]}/></div>
        <div><p style={{fontSize:11,color:RE,letterSpacing:"0.06em",fontWeight:500,margin:"0 0 0.625rem"}}>EXCLUDED</p><BulletList c={RE} items={["Enrichment projects that benefit the already-privileged without spillover","Interventions that create or scale suffering through extraction","Programs that manufacture dependency or addiction for profit","Activities whose externalities cause more harm than outputs create good","Performative giving that optimizes for optics over outcomes"]}/></div>
      </div>
    </Sec>
    <CB>The hardest part isn't understanding this definition — it's applying it honestly. It means asking not just "did we help?" but "did we help more than we could have helped differently?" and "did helping here cause harm elsewhere?"</CB>
    <NL go={go} to="s10" label="10 · The world we want"/>
  </div>);
}

function S02({go}){
  const[at,setAt]=useState(null);
  const[ap,setAp]=useState(null);
  return(<div>
    <SH num="02" title="How to live impactfully" sub="Impact isn't just a giving strategy. It's a way of orienting your life — in how you live, what you offer, and how you deploy your financial resources."/>
    <Sec>
      <H2>Three domains of impact</H2>
      <P muted>Most people think of philanthropy as financial. But how you live and what you offer are equally real forms of giving.</P>
      {DOMAINS.map(d=>(<AC key={d.id} label={d.label} c={d.c} icon={d.icon}><P muted>{d.desc}</P><BulletList items={d.examples} c={d.c}/></AC>))}
    </Sec>
    <Sec>
      <H2>Three tiers of philanthropy</H2>
      <P muted>Where does your giving currently sit?</P>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
        {TIERS.map(t=>(<div key={t.id} onClick={()=>setAt(at===t.id?null:t.id)} style={{border:at===t.id?`2px solid ${t.c}`:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem",cursor:"pointer",background:at===t.id?"var(--color-background-secondary)":"var(--color-background-primary)"}}>
          <div style={{fontSize:17,color:t.c,marginBottom:5}}>{t.icon}</div>
          <div style={{fontWeight:500,fontSize:13,color:at===t.id?t.c:"var(--color-text-primary)"}}>{t.label}</div>
        </div>))}
      </div>
      {at&&(()=>{const t=TIERS.find(x=>x.id===at);return(<div style={{borderLeft:`3px solid ${t.c}`,paddingLeft:"0.875rem",marginTop:9}}><P muted>{t.desc}</P><BL items={t.signs} c={t.c}/></div>);})()}
    </Sec>
    <div>
      <H2>Four pillars</H2>
      <P muted>Investment-grade giving rests on four pillars. Gaps in any one are felt as specific, recognizable experiences.</P>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,marginBottom:11}}>
        {PILLARS.map(p=>(<div key={p.id} onClick={()=>setAp(ap===p.id?null:p.id)} style={{border:ap===p.id?`2px solid ${p.c}`:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem",cursor:"pointer",background:ap===p.id?"var(--color-background-secondary)":"var(--color-background-primary)"}}>
          <div style={{fontWeight:500,fontSize:13,color:ap===p.id?p.c:"var(--color-text-primary)"}}>{p.label}</div>
          <div style={{fontSize:12,color:p.c}}>→ {p.outcome}</div>
        </div>))}
      </div>
      {ap&&(()=>{const p=PILLARS.find(x=>x.id===ap);return(<TG tabs={[{id:"desc",label:"What it means"},{id:"lacking",label:"Deficit feels like"},{id:"build",label:"How to build it"}]} c={p.c} render={t=>{if(t==="desc")return <P muted>{p.desc}</P>;if(t==="lacking")return <P muted>{p.lacking}</P>;return <BL items={p.build} c={p.c}/>;}}/>);})()}
    </div>
    <NL go={go} to="s03" label="03 · The landscape"/>
  </div>);
}

function S03({go}){
  return(<div>
    <SH num="03" title="The landscape" sub="The world of do-gooding has many layers. Knowing who does what changes how you use them."/>
    <P muted>Most donors conflate these roles — or only know one layer exists. A thoughtful donor uses different parts of the ecosystem for different purposes.</P>
    {LSCAPE.map(c=>(<AC key={c.id} label={c.label} c={c.c} icon={c.icon}>
      <P muted>{c.role}</P>
      <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"0.625rem 0.875rem",marginBottom:"0.75rem"}}><span style={{fontSize:10,fontWeight:500,color:c.c}}>USE FOR: </span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{c.trustFor}</span></div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{c.orgs.map(o=>(<div key={o.n} style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{width:5,height:5,borderRadius:"50%",background:c.c,marginTop:7,flexShrink:0}}/><div><span style={{fontSize:13,fontWeight:500}}>{o.n}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}> — {o.note}</span></div></div>))}</div>
    </AC>))}
    <CB c={PU}>A useful mental model: evaluators are your research team, implementers are your portfolio, researchers are your continuing education, and watchdogs are your compliance check. Using a watchdog for impact evaluation is like using a smoke alarm to judge the quality of a meal.</CB>
    <NL go={go} to="s04" label="04 · Cause areas"/>
  </div>);
}

function S04({go}){
  const[f,setF]=useState("all");
  const TC={"near":GR,"long":PU,"both":AM};
  const TL={"near":"Near-term","long":"Long-term","both":"Both"};
  const MC={"high":GR,"medium":AM,"low":RE};
  const filtered=f==="all"?CAUSES:CAUSES.filter(c=>c.term===f||(f!=="all"&&c.term==="both"));
  return(<div>
    <SH num="04" title="Cause areas" sub="What are the big problems? What does winning look like in each? And how do you measure whether you're getting there?"/>
    <P muted>Cause areas differ in scale, measurability, and time horizon. Near-term causes address suffering happening now. Long-term causes address risks to future people — harder to measure but potentially enormous in scope.</P>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:"1.375rem"}}>
      {["all","near","long"].map(fi=>(<button key={fi} onClick={()=>setF(fi)} style={{padding:"5px 13px",borderRadius:999,border:f===fi?`2px solid ${fi==="all"?BL:TC[fi]}`:"0.5px solid var(--color-border-secondary)",background:f===fi?"var(--color-background-secondary)":"transparent",color:f===fi?(fi==="all"?BL:TC[fi]):"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:f===fi?500:400}}>{fi==="all"?"All causes":TL[fi]}</button>))}
    </div>
    {filtered.map(c=>(<AC key={c.id} label={c.label} c={c.c} badges={[<PL key="t" label={TL[c.term]} c={TC[c.term]}/>,<PL key="m" label={`${c.meas} measurability`} c={MC[c.meas]}/>]}>
      <TG tabs={[{id:"s",label:"Suffering"},{id:"f",label:"Flourishing"},{id:"m",label:"Measuring"},{id:"o",label:"Orgs"}]} c={c.c} render={t=>{
        if(t==="s")return <P muted>{c.suffering}</P>;
        if(t==="f")return <P muted>{c.flourishing}</P>;
        if(t==="m")return <P muted>{c.measure}</P>;
        return <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{c.orgs.map(o=><span key={o} style={{fontSize:11,padding:"3px 9px",borderRadius:999,border:"0.5px solid var(--color-border-secondary)",color:"var(--color-text-secondary)"}}>{o}</span>)}</div>;
      }}/>
    </AC>))}
    <CB c={BL}>Cause areas with clean metrics are not necessarily more important than those with messier ones. Measurability is a property of our tools, not of the underlying reality. Act wisely under uncertainty — not only where certainty is easy.</CB>
    <NL go={go} to="s05" label="05 · Where suffering is solvable"/>
  </div>);
}

function S05({go}){
  const[s,setS]=useState("rank");
  const sorted=[...PRIOS].sort((a,b)=>s==="rank"?a.rank-b.rank:s==="scale"?b.scale-a.scale:s==="neglect"?b.neglect-a.neglect:b.tract-a.tract);
  return(<div>
    <SH num="05" title="Where suffering is solvable" sub="My current prioritization — honest, reasoned, and subject to change. Not a prescription. A demonstration of what rigorous thinking looks like in practice."/>
    <Sec>
      <H2>Three filters</H2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
        {[{l:"Scale",d:"How many individuals are affected, and how severely?"},{l:"Neglectedness",d:"How much funding flows here relative to the need?"},{l:"Tractability",d:"Do we have evidence-backed interventions that actually work?"}].map((f,i)=>(<div key={i} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem"}}><div style={{fontWeight:500,fontSize:13,marginBottom:3}}>{f.l}</div><div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.4}}>{f.d}</div></div>))}
      </div>
    </Sec>
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.125rem",flexWrap:"wrap",gap:7}}>
        <H2>My priorities</H2>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["rank","scale","neglect","tract"].map(si=>(<button key={si} onClick={()=>setS(si)} style={{padding:"3px 9px",borderRadius:999,border:s===si?`2px solid ${GR}`:"0.5px solid var(--color-border-secondary)",background:s===si?"var(--color-background-secondary)":"transparent",color:s===si?GR:"var(--color-text-secondary)",fontSize:11,cursor:"pointer",fontFamily:"var(--font-sans)"}}>{si==="rank"?"My ranking":si==="scale"?"Scale":si==="neglect"?"Neglectedness":"Tractability"}</button>))}
        </div>
      </div>
      {sorted.map(p=>(<AC key={p.rank} label={p.label} c={p.c} badges={[<div key="s" style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:9,color:"var(--color-text-secondary)"}}>Scale</span><DR v={p.scale} c={p.c}/></div>,<div key="n" style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:9,color:"var(--color-text-secondary)"}}>Neglect</span><DR v={p.neglect} c={p.c}/></div>,<div key="t" style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:9,color:"var(--color-text-secondary)"}}>Tractability</span><DR v={p.tract} c={p.c}/></div>]}>
        <P>{p.why}</P>
        <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:"0.625rem"}}><span style={{fontSize:10,color:"var(--color-text-secondary)",fontWeight:500}}>CAVEAT: </span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{p.caveat}</span></div>
      </AC>))}
    </div>
    <CB c={AM}>This list will change. New evidence comes in. What I'm modeling isn't a fixed answer — it's a way of thinking. If you disagree, make your own list using the same three filters. The process matters more than the conclusion.</CB>
    <NL go={go} to="s02" label="02 · How to live impactfully"/>
  </div>);
}

function S06({go}){
  const[af,setAf]=useState(null);
  return(<div>
    <SH num="06" title="How I evaluate orgs" sub="Source, screen, vet, verify. Four stages that turn a compelling pitch into a confident grant."/>
    <P muted>Most donors evaluate on feel. A good story, a compelling leader, an overhead ratio. None of those reliably predict whether a dollar produces good outcomes. Here's what does.</P>
    <Sec>
      <H2>The evaluation pipeline</H2>
      {PIPELINE.map((step,i)=>(<div key={step.id}><AC label={`${step.num} · ${step.label}`} c={step.c}><P muted>{step.desc}</P><div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:"0.75rem"}}>{step.criteria.map((cr,ci)=>(<div key={ci} style={{borderLeft:"2px solid var(--color-border-tertiary)",paddingLeft:9}}><p style={{fontSize:13,fontWeight:500,margin:"0 0 1px"}}>{cr.q}</p><p style={{fontSize:11,color:"var(--color-text-secondary)",margin:0,lineHeight:1.4}}>{cr.note}</p></div>))}</div><div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"0.625rem 0.875rem"}}><span style={{fontSize:10,fontWeight:500,color:step.c}}>SIGNAL: </span><span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{step.signal}</span></div></AC>{i<PIPELINE.length-1&&<div style={{display:"flex",justifyContent:"center",color:"var(--color-text-secondary)",fontSize:12,margin:"-1px 0"}}>↓</div>}</div>))}
    </Sec>
    <div>
      <H2>Factory for Good frameworks</H2>
      <P muted>Three proprietary lenses for identifying high-performing orgs.</P>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
        {FWORKS.map(f=>(<div key={f.id} onClick={()=>setAf(af===f.id?null:f.id)} style={{border:af===f.id?`2px solid ${f.c}`:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem",cursor:"pointer",background:af===f.id?"var(--color-background-secondary)":"var(--color-background-primary)"}}>
          <div style={{fontWeight:500,fontSize:12,color:af===f.id?f.c:"var(--color-text-primary)"}}>{f.label}</div>
        </div>))}
      </div>
      {af&&(()=>{const f=FWORKS.find(x=>x.id===af);return <div style={{borderLeft:`3px solid ${f.c}`,paddingLeft:"0.875rem",marginTop:9}}><P muted>{f.desc}</P></div>;})()}
    </div>
    <NL go={go} to="s07" label="07 · How do-gooding goes wrong"/>
  </div>);
}

function S07({go}){
  const[f,setF]=useState("all");
  const filtered=f==="all"?TRAPS:TRAPS.filter(t=>t.cat===f);
  return(<div>
    <SH num="07" title="How do-gooding goes wrong" sub="The road to harm is paved with good intentions and broken feedback loops. The most common, most costly traps — and how to avoid them."/>
    <P muted>These aren't failures of bad people. They're predictable outcomes of how human psychology, institutional incentives, and donor culture interact. Knowing them is the antidote.</P>
    <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:"1.375rem"}}>
      {[{id:"all",l:"All"},{id:"donor",l:"Donor psychology"},{id:"sector",l:"Sector incentives"},{id:"impl",l:"Implementation"}].map(c=>(<button key={c.id} onClick={()=>setF(c.id)} style={{padding:"5px 13px",borderRadius:999,border:f===c.id?`2px solid ${RE}`:"0.5px solid var(--color-border-secondary)",background:f===c.id?"var(--color-background-secondary)":"transparent",color:f===c.id?RE:"var(--color-text-secondary)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-sans)",fontWeight:f===c.id?500:400}}>{c.l}</button>))}
    </div>
    {filtered.map(t=>(<AC key={t.id} label={t.label} c={t.c} sub={t.hook}>
      <TG tabs={[{id:"what",label:"What happens"},{id:"antidote",label:"The antidote"},{id:"real",label:"Real world"}]} c={t.c} render={tab=>{
        if(tab==="what")return <P muted>{t.what}</P>;
        if(tab==="antidote")return <P muted>{t.antidote}</P>;
        return <P muted>{t.real}</P>;
      }}/>
    </AC>))}
    <CB c={AM}>None of these traps make you a bad person. They make you a human with normal psychology operating in a sector with broken feedback loops. The fix isn't moral — it's structural. Build the systems that make the traps hard to fall into.</CB>
    <NL go={go} to="s08" label="08 · The talent & funding gap"/>
  </div>);
}

function S08({go}){
  const PRINC=["Pay for talent — salary competitiveness is execution quality","Fund unrestricted — trust the orgs you've vetted","Invest in evaluation — an org that measures outcomes is more valuable","Reward honest failure — killing programs that don't work shows integrity","Seek neglect — your marginal dollar is worth most in underfunded areas","Fund long-term — multi-year commitments allow real planning"];
  return(<div>
    <SH num="08" title="The talent & funding gap" sub="The impact sector is doing enormously important work with one hand tied behind its back. Here's why — and what funders can do about it."/>
    <P muted>The most important bottleneck in philanthropy isn't money — it's the quality of organizations deploying it. And that quality is systematically suppressed by how we fund and evaluate the sector.</P>
    <Sec>
      {GAPS.map(g=>(<AC key={g.id} label={g.label} c={g.c} icon={g.icon} sub={g.headline}><P muted>{g.body}</P><p style={{fontSize:11,fontWeight:500,margin:"0 0 0.4rem"}}>Consequences:</p><BulletList items={g.consequences} c={g.c}/><div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"0.625rem 0.875rem",marginTop:"0.75rem"}}><span style={{fontSize:10,fontWeight:500,color:g.c}}>WHAT TO DO: </span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{g.action}</span></div></AC>))}
    </Sec>
    <H2>What investment-grade funders do differently</H2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:9}}>
      {PRINC.map((p,i)=>{const[title,...rest]=p.split(" — ");return(<div key={i} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem"}}><div style={{fontWeight:500,fontSize:12,color:GR,marginBottom:3}}>{title}</div><div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.4}}>{rest.join(" — ")}</div></div>);})}
    </div>
    <NL go={go} to="s09" label="09 · Systems thinking"/>
  </div>);
}

function S09({go}){
  return(<div>
    <SH num="09" title="Systems thinking" sub="Individual giving matters. But the biggest levers for reducing suffering are in how we design our businesses, governments, and civil institutions."/>
    <P muted>Most suffering isn't random — it's produced by systems that were designed by people and can be redesigned by people. The highest-leverage work often happens at the systems level.</P>
    <Sec>
      <H2>The leverage hierarchy</H2>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {LEVERS.map((l,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:11,padding:"0.7rem 1.125rem",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"var(--color-text-secondary)",flexShrink:0}}>{i+1}</div>
          <div style={{fontWeight:500,fontSize:13,minWidth:120}}>{l.l}</div>
          <div style={{fontSize:11,color:GR,minWidth:75}}>{l.m}</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",flex:1,lineHeight:1.4}}>{l.d}</div>
        </div>))}
      </div>
    </Sec>
    <div>
      <H2>Three sectors, three roles</H2>
      <P muted>Business, government, and civil society each have distinct roles in a systems-level impact approach.</P>
      {SECTORS.map(s=>(<AC key={s.id} label={s.label} c={s.c} icon={s.icon} sub={s.premise}>
        <TG tabs={[{id:"good",label:"What good looks like"},{id:"theater",label:"What theater looks like"}]} c={s.c} render={t=>{
          if(t==="theater")return <P muted>{s.theater}</P>;
          return <BulletList items={s.good} c={s.c}/>;
        }}/>
      </AC>))}
    </div>
    <CB c={BL}>The individual and the system aren't in tension — they're the same project at different scales. How you give shapes what orgs survive. What survives shapes what gets demonstrated. What gets demonstrated shapes policy. Start anywhere. Think at every level.</CB>
    <NL go={go} to="s10" label="10 · The world we want"/>
  </div>);
}

function S10({go}){
  const[rev,setRev]=useState(false);
  return(<div>
    <SH num="10" title="The world we want" sub="Not utopia. Not perfection. A world where no one suffers from what we could have prevented."/>
    <Sec>
      <H2>The veil of ignorance</H2>
      <P muted>Philosopher John Rawls asked: if you had to design the rules of society without knowing who you'd be in it — what would you choose? Imagine you're behind a veil. You know nothing about the life you're about to enter.</P>
      <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-lg)",padding:"1.125rem 1.375rem",marginBottom:"0.875rem"}}>
        <p style={{fontWeight:500,fontSize:13,margin:"0 0 0.625rem"}}>Behind the veil, you don't know:</p>
        <BulletList c={PU} items={["Your country, culture, or language","Your health, ability, or body","Your family's wealth or your own earning potential","Your race, gender, or orientation","Whether you'll be born human at all"]}/>
      </div>
      {!rev?<button onClick={()=>setRev(true)} style={{padding:"7px 18px",borderRadius:"var(--border-radius-md)",border:"0.5px solid var(--color-border-secondary)",background:"transparent",color:"var(--color-text-primary)",fontSize:13,cursor:"pointer",fontFamily:"var(--font-sans)"}}>Lift the veil</button>:<CB c={PU}>Most people — given genuine uncertainty about who they'd be — would choose a world with a meaningful floor of dignity, access to health and safety, and freedom from preventable suffering. Not equality of outcome, but equality of basic regard. That instinct is the moral foundation of impact work. It just needs to be acted on.</CB>}
    </Sec>
    <Sec>
      <H2>The lottery of life</H2>
      <P muted>The veil isn't just a thought experiment — it's literally true. You didn't choose any of this.</P>
      {LOTTERY.map((l,i)=>(<AC key={i} label={l.l} c={PU}><p style={{fontSize:13,fontWeight:500,margin:"0 0 3px",color:PU}}>{l.s}</p><P muted>{l.w}</P></AC>))}
    </Sec>
    <Sec>
      <H2>What flourishing actually looks like</H2>
      <P muted>The research on wellbeing is remarkably consistent across cultures. Flourishing isn't wealth — it's these six things.</P>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:9}}>
        {FLOURISH.map(f=>(<div key={f.l} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"0.8rem"}}>
          <div style={{fontSize:17,color:GR,marginBottom:5}}>{f.i}</div>
          <div style={{fontWeight:500,fontSize:12,marginBottom:3}}>{f.l}</div>
          <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.4}}>{f.d}</div>
        </div>))}
      </div>
    </Sec>
    <Sec>
      <H2>The world we're working toward</H2>
      <P muted>It's not a world without difficulty or difference. It's a world where no child dies from a disease we know how to prevent. Where no one starves in a world with enough food. Where suffering isn't an accident of latitude or longitude.</P>
      <CB c={GR}>This isn't naive. Humans have ended smallpox, dramatically reduced extreme poverty, and built institutions capable of extraordinary coordination. The tools exist. What's needed is the will, the wisdom, and the sustained attention to use them well.</CB>
    </Sec>
    <div>
      <p style={{fontSize:11,color:"var(--color-text-secondary)",letterSpacing:"0.06em",margin:"0 0 0.75rem"}}>A PERSONAL NOTE</p>
      <p style={{fontSize:15,lineHeight:1.8,fontFamily:"var(--font-serif)",color:"var(--color-text-secondary)",margin:"0 0 0.875rem"}}>I didn't earn being born where and when and to whom I was. That's not false modesty — it's just true. And the more I've sat with that, the harder it's become to treat that luck as something I get to keep entirely to myself.</p>
      <p style={{fontSize:15,lineHeight:1.8,fontFamily:"var(--font-serif)",color:"var(--color-text-secondary)",margin:0}}>The world we want is already within reach for most of the people reading this. The question is whether we'll help build it for everyone else.</p>
      <p style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:"1.75rem",cursor:"pointer"}} onClick={()=>go("home")}>← <span style={{color:GR}}>Return to the beginning</span></p>
    </div>
  </div>);
}

// ── App ────────────────────────────────────────────────────────────────────
const NAVS=[{id:"home",label:"Home"},{id:"s01",label:"01 · Impact"},{id:"s02",label:"02 · Path"},{id:"s03",label:"03 · Landscape"},{id:"s04",label:"04 · Causes"},{id:"s05",label:"05 · Focus"},{id:"s06",label:"06 · Evaluate"},{id:"s07",label:"07 · Pitfalls"},{id:"s08",label:"08 · Sector"},{id:"s09",label:"09 · Systems"},{id:"s10",label:"10 · Vision"}];

export default function App(){
  const[page,setPage]=useState("home");
  const topRef=useRef(null);
  const go=id=>{setPage(id);setTimeout(()=>topRef.current?.scrollIntoView({behavior:"smooth"}),10);};
  const pages={home:<Home go={go}/>,s01:<S01 go={go}/>,s02:<S02 go={go}/>,s03:<S03 go={go}/>,s04:<S04 go={go}/>,s05:<S05 go={go}/>,s06:<S06 go={go}/>,s07:<S07 go={go}/>,s08:<S08 go={go}/>,s09:<S09 go={go}/>,s10:<S10 go={go}/>};
  return(
    <div ref={topRef} style={{fontFamily:"var(--font-sans)",color:"var(--color-text-primary)"}}>
      <div style={{borderBottom:"0.5px solid var(--color-border-tertiary)",padding:"0 1rem",background:"var(--color-background-primary)"}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:7,height:46,overflowX:"auto"}}>
          <span style={{fontWeight:500,fontSize:13,flexShrink:0,marginRight:6,color:GR,cursor:"pointer",letterSpacing:"-0.01em"}} onClick={()=>go("home")}>◆ FFG</span>
          {NAVS.map(n=>(<button key={n.id} onClick={()=>go(n.id)} style={{flexShrink:0,padding:"3px 9px",borderRadius:999,border:page===n.id?`1.5px solid ${GR}`:"0.5px solid var(--color-border-tertiary)",background:page===n.id?"var(--color-background-secondary)":"transparent",color:page===n.id?GR:"var(--color-text-secondary)",fontSize:11,cursor:"pointer",fontFamily:"var(--font-sans)",whiteSpace:"nowrap",fontWeight:page===n.id?500:400}}>{n.label}</button>))}
        </div>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"0 1rem 4rem"}}>
        {pages[page]}
      </div>
    </div>
  );
}
