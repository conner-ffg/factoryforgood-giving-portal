import { useState, useRef, useEffect } from "react";

const CAUSE_COLORS = {
  "Global Health": "#2D9E6B",
  "Education": "#4A90D9",
  "Animal Welfare": "#E88B3A",
  "Economic Mobility": "#7B5EA7",
  "Food Security": "#C0392B",
  "Mental Health": "#16A085",
  "Criminal Justice": "#8E44AD",
  "Climate": "#27AE60",
};

const ORGS = [
  {
    id: 1,
    name: "GiveDirectly",
    tagline: "Cash to people who need it most. No middleman.",
    cause: "Economic Mobility",
    location: "Kenya, Uganda, Rwanda + 8 more",
    founded: 2009,
    givewell: true,
    costEff: "9× cash equivalent",
    description:
      "Transfers unconditional cash directly to people in extreme poverty. Backed by the strongest RCT evidence base in global development. GiveWell Top Charity for 10+ consecutive years.",
    stats: [
      { label: "Raised to Date", value: "$700M+" },
      { label: "Recipients", value: "1.4M+" },
      { label: "Overhead", value: "11%" },
    ],
    match: 97,
    img: "💸",
  },
  {
    id: 2,
    name: "Malaria Consortium",
    tagline: "Seasonal malaria chemoprevention at scale.",
    cause: "Global Health",
    location: "Sub-Saharan Africa",
    founded: 2003,
    givewell: true,
    costEff: "~$3,000 per life saved",
    description:
      "Delivers preventive malaria treatment to children under 5 across the Sahel. One of the most cost-effective life-saving interventions identified by GiveWell — and consistently underfunded relative to its absorptive capacity.",
    stats: [
      { label: "Children Protected", value: "30M/yr" },
      { label: "Cost per Life", value: "~$3K" },
      { label: "Countries", value: "11" },
    ],
    match: 94,
    img: "🦟",
  },
  {
    id: 3,
    name: "Food 4 Education",
    tagline: "50¢ feeds a Kenyan child for a day.",
    cause: "Food Security",
    location: "Kenya",
    founded: 2012,
    givewell: false,
    costEff: "$180 per child/year",
    description:
      "Operates a tech-enabled school meal program across Kenya using locally sourced food. Proven attendance and learning gains. Planet Wild-style storytelling with exceptional visual media. Strong operational unit economics.",
    stats: [
      { label: "Meals Served", value: "100M+" },
      { label: "Schools", value: "2,000+" },
      { label: "Cost/Meal", value: "$0.50" },
    ],
    match: 91,
    img: "🍛",
  },
  {
    id: 4,
    name: "The Humane League",
    tagline: "Corporate campaigns that move the needle on animal welfare.",
    cause: "Animal Welfare",
    location: "Global",
    founded: 2005,
    givewell: false,
    costEff: "~$1 per 50 animals helped",
    description:
      "Runs corporate cage-free campaigns with measurable animal-days-of-suffering impact. Animal Charity Evaluators Top Charity. Leverages systemic change levers rather than individual rescue. High political dexterity.",
    stats: [
      { label: "Animals Helped", value: "100B+" },
      { label: "Commitments Won", value: "1,100+" },
      { label: "Countries Active", value: "30+" },
    ],
    match: 88,
    img: "🐓",
  },
  {
    id: 5,
    name: "Zoe Empowers",
    tagline: "Whole-community transformation for the ultra-orphaned.",
    cause: "Education",
    location: "Africa, Asia, Latin America",
    founded: 2002,
    givewell: false,
    costEff: "$1,200 per child over 3 years",
    description:
      "Mobilizes local churches to provide integrated support to child-headed households: food, school fees, counseling, enterprise training. Faith-motivated model with strong community ownership and low churn. Resonates with HNW faith-motivated donors.",
    stats: [
      { label: "Children Served", value: "2M+" },
      { label: "Countries", value: "16" },
      { label: "Church Partners", value: "30K" },
    ],
    match: 85,
    img: "✝️",
  },
  {
    id: 6,
    name: "Cure Blindness",
    tagline: "10-minute surgery. Sight restored. $50.",
    cause: "Global Health",
    location: "Nepal, India, Ethiopia, Cambodia",
    founded: 1994,
    givewell: false,
    costEff: "$50 per cataract restored",
    description:
      "Trains local surgeons to perform high-volume cataract surgeries in underserved regions. One of the most emotionally resonant giving opportunities — sight restoration is immediate, visible, and measurable. Strong HLI WELLBY case.",
    stats: [
      { label: "Surgeries", value: "5M+" },
      { label: "Cost/Surgery", value: "$50" },
      { label: "Countries", value: "12" },
    ],
    match: 89,
    img: "👁️",
  },
  {
    id: 7,
    name: "New Incentives",
    tagline: "Cash for vaccines. Simple. Proven. Scalable.",
    cause: "Global Health",
    location: "Nigeria",
    founded: 2011,
    givewell: true,
    costEff: "~$3,500 per life saved",
    description:
      "Offers small cash transfers to caregivers who complete infant vaccination schedules in northern Nigeria, where coverage rates are critically low. GiveWell Standout Charity. Extremely cost-effective against the DALY benchmark.",
    stats: [
      { label: "Children Vaccinated", value: "1M+" },
      { label: "Clinics", value: "2,700+" },
      { label: "Cost/Life", value: "~$3.5K" },
    ],
    match: 92,
    img: "💉",
  },
  {
    id: 8,
    name: "Tabitha's Way",
    tagline: "Dignity-first food pantry. Zero shame.",
    cause: "Food Security",
    location: "Spanish Fork, Utah",
    founded: 2013,
    givewell: false,
    costEff: "$12 per household visit",
    description:
      "Client-choice model food pantry serving rural Utah families. Faith-rooted, community-operated, with an unusually high volunteer-to-staff ratio. Strong local donor story for LDS-adjacent HNW families. Grassroots authenticity, no overhead bloat.",
    stats: [
      { label: "Families Served/Mo", value: "1,200" },
      { label: "Volunteer Hours/Yr", value: "25K+" },
      { label: "Cost/Visit", value: "$12" },
    ],
    match: 78,
    img: "🛒",
  },
];

const SWIPE_THRESHOLD = 80;

export default function Phinder() {
  const [cards, setCards] = useState(ORGS);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchOrg, setMatchOrg] = useState(null);
  const [view, setView] = useState("swipe"); // swipe | interested
  const cardRef = useRef(null);

  const remaining = cards.length - current;
  const org = cards[current];
  const interested = history.filter((h) => h.action === "yes");

  const causeColor = org ? CAUSE_COLORS[org.cause] || "#2D9E6B" : "#2D9E6B";

  function handleDragStart(clientX, clientY) {
    setDragging(true);
    setStartX(clientX);
    setStartY(clientY);
  }

  function handleDragMove(clientX, clientY) {
    if (!dragging) return;
    setDragX(clientX - startX);
    setDragY(clientY - startY);
  }

  function handleDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) {
      triggerAction("yes");
    } else if (dragX < -SWIPE_THRESHOLD) {
      triggerAction("no");
    } else {
      setDragX(0);
      setDragY(0);
    }
  }

  function triggerAction(action) {
    if (!org) return;
    setHistory((prev) => [...prev, { org, action }]);
    setLastAction(action);
    setDragX(action === "yes" ? 400 : -400);
    setDragY(0);
    if (action === "yes") {
      setMatchOrg(org);
      setTimeout(() => {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 2200);
      }, 300);
    }
    setTimeout(() => {
      setCurrent((prev) => prev + 1);
      setDragX(0);
      setDragY(0);
      setLastAction(null);
    }, 350);
  }

  const rotation = dragX * 0.06;
  const yesOpacity = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const noOpacity = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);

  if (view === "interested") {
    return (
      <div style={styles.app}>
        <header style={styles.header}>
          <button onClick={() => setView("swipe")} style={styles.backBtn}>←</button>
          <div style={styles.logo}>
            <span style={styles.logoP}>ph</span>
            <span style={styles.logoHeart}>♥</span>
            <span style={styles.logoP}>nder</span>
          </div>
          <div style={{ width: 36 }} />
        </header>
        <div style={styles.interestedContainer}>
          <h2 style={styles.interestedTitle}>Your Giving Queue</h2>
          <p style={styles.interestedSub}>{interested.length} org{interested.length !== 1 ? "s" : ""} you're interested in</p>
          {interested.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💚</div>
              <p style={{ color: "#888", fontSize: 14 }}>Swipe right on orgs you love — they'll appear here.</p>
            </div>
          ) : (
            <div style={styles.queueList}>
              {interested.map(({ org }, i) => (
                <div key={org.id} style={styles.queueCard}>
                  <div
                    style={{
                      ...styles.queueCauseBar,
                      background: CAUSE_COLORS[org.cause] || "#2D9E6B",
                    }}
                  />
                  <div style={styles.queueEmoji}>{org.img}</div>
                  <div style={styles.queueInfo}>
                    <div style={styles.queueName}>{org.name}</div>
                    <div style={styles.queueCause}>{org.cause}</div>
                    <div style={styles.queueTagline}>{org.tagline}</div>
                  </div>
                  <div style={styles.queueMatch}>{org.match}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Match flash */}
      {showMatch && matchOrg && (
        <div style={styles.matchOverlay}>
          <div style={styles.matchBox}>
            <div style={{ fontSize: 48 }}>{matchOrg.img}</div>
            <div style={styles.matchLabel}>It's a Match!</div>
            <div style={styles.matchOrgName}>{matchOrg.name}</div>
            <div style={styles.matchSub}>Added to your giving queue</div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <button onClick={() => setView("interested")} style={styles.queueBtn}>
          💚 {interested.length > 0 && <span style={styles.badge}>{interested.length}</span>}
        </button>
        <div style={styles.logo}>
          <span style={styles.logoP}>ph</span>
          <span style={styles.logoHeart}>♥</span>
          <span style={styles.logoP}>nder</span>
        </div>
        <div style={styles.poweredBy}>by FFG</div>
      </header>

      <div style={styles.stack}>
        {/* Next card preview */}
        {cards[current + 1] && (
          <div
            style={{
              ...styles.card,
              transform: "scale(0.94) translateY(14px)",
              zIndex: 1,
              opacity: 0.6,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                ...styles.causebar,
                background: CAUSE_COLORS[cards[current + 1].cause] || "#2D9E6B",
              }}
            />
          </div>
        )}

        {org ? (
          <div
            ref={cardRef}
            style={{
              ...styles.card,
              transform: `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg)`,
              transition: dragging ? "none" : "transform 0.35s cubic-bezier(.17,.67,.35,1.2)",
              zIndex: 2,
              cursor: dragging ? "grabbing" : "grab",
            }}
            onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleDragEnd}
          >
            {/* Cause color bar */}
            <div style={{ ...styles.causebar, background: causeColor }} />

            {/* YES / NOPE stamps */}
            {yesOpacity > 0.05 && (
              <div style={{ ...styles.stamp, ...styles.yesStamp, opacity: yesOpacity }}>
                FUND IT
              </div>
            )}
            {noOpacity > 0.05 && (
              <div style={{ ...styles.stamp, ...styles.noStamp, opacity: noOpacity }}>
                PASS
              </div>
            )}

            {/* Card header */}
            <div style={styles.cardHeader}>
              <div style={styles.cardEmoji}>{org.img}</div>
              <div style={styles.cardHeaderText}>
                <div style={styles.cardName}>{org.name}</div>
                <div style={styles.cardLocation}>{org.location}</div>
              </div>
              <div style={styles.matchBadge}>
                <div style={{ ...styles.matchRing, borderColor: causeColor }}>
                  <span style={{ ...styles.matchNum, color: causeColor }}>{org.match}</span>
                  <span style={styles.matchPct}>%</span>
                </div>
              </div>
            </div>

            {/* Cause tag */}
            <div style={{ ...styles.causeTag, background: causeColor + "22", color: causeColor }}>
              {org.cause}
              {org.givewell && (
                <span style={{ ...styles.gwBadge, borderColor: causeColor, color: causeColor }}>
                  GiveWell ✓
                </span>
              )}
            </div>

            {/* Tagline */}
            <div style={styles.tagline}>{org.tagline}</div>

            {/* Description */}
            <div style={styles.description}>{org.description}</div>

            {/* Stats */}
            <div style={styles.statsRow}>
              {org.stats.map((s) => (
                <div key={s.label} style={styles.statBox}>
                  <div style={styles.statValue}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Cost effectiveness */}
            <div style={styles.costEff}>
              <span style={styles.costLabel}>Cost effectiveness: </span>
              <span style={{ ...styles.costValue, color: causeColor }}>{org.costEff}</span>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.card, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ fontSize: 56 }}>🌍</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#1A3A2A", textAlign: "center" }}>
              You've seen every org
            </div>
            <div style={{ fontSize: 14, color: "#888", textAlign: "center", maxWidth: 220 }}>
              {interested.length > 0
                ? `You flagged ${interested.length} org${interested.length > 1 ? "s" : ""} for funding. Review your queue →`
                : "No orgs flagged yet. Check back as FFG adds new vetted options."}
            </div>
            {interested.length > 0 && (
              <button
                onClick={() => setView("interested")}
                style={{ ...styles.actionBtn, background: "#2D9E6B", color: "#fff", marginTop: 8, cursor: "pointer" }}
              >
                View Queue ({interested.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {org && (
        <div style={styles.actions}>
          <button
            onClick={() => triggerAction("no")}
            style={{ ...styles.actionBtn, ...styles.passBtn }}
            title="Pass"
          >
            ✕
          </button>
          <div style={styles.remainingPill}>{remaining} left</div>
          <button
            onClick={() => triggerAction("yes")}
            style={{ ...styles.actionBtn, ...styles.fundBtn }}
            title="Fund It"
          >
            ♥
          </button>
        </div>
      )}

      <div style={styles.hint}>← swipe to pass &nbsp;|&nbsp; swipe to fund →</div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#F5F0E8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    userSelect: "none",
    overflow: "hidden",
  },
  header: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 10px",
  },
  logo: {
    fontSize: 26,
    fontFamily: "'DM Serif Display', Georgia, serif",
    letterSpacing: "-0.5px",
    color: "#1A3A2A",
  },
  logoP: { color: "#1A3A2A" },
  logoHeart: { color: "#E8B84B", margin: "0 1px" },
  poweredBy: {
    fontSize: 11,
    color: "#999",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    width: 36,
    textAlign: "right",
  },
  queueBtn: {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    position: "relative",
    width: 36,
    padding: 0,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: "#E85D5D",
    color: "#fff",
    borderRadius: "50%",
    width: 16,
    height: 16,
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#1A3A2A",
    width: 36,
    padding: 0,
    fontWeight: 300,
  },
  stack: {
    position: "relative",
    width: "100%",
    maxWidth: 380,
    height: 540,
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    maxWidth: 370,
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(26,58,42,0.13)",
    padding: "0 0 20px 0",
    overflow: "hidden",
    boxSizing: "border-box",
    willChange: "transform",
  },
  causebar: {
    height: 6,
    width: "100%",
    borderRadius: "20px 20px 0 0",
  },
  stamp: {
    position: "absolute",
    top: 28,
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "0.1em",
    fontFamily: "'Inter', sans-serif",
    zIndex: 10,
    pointerEvents: "none",
    border: "3px solid",
    transform: "rotate(-18deg)",
  },
  yesStamp: {
    left: 18,
    color: "#2D9E6B",
    borderColor: "#2D9E6B",
    background: "rgba(45,158,107,0.06)",
    transform: "rotate(-12deg)",
  },
  noStamp: {
    right: 18,
    color: "#E85D5D",
    borderColor: "#E85D5D",
    background: "rgba(232,93,93,0.06)",
    transform: "rotate(12deg)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px 8px",
  },
  cardEmoji: {
    fontSize: 36,
    lineHeight: 1,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 22,
    color: "#1A3A2A",
    lineHeight: 1.1,
  },
  cardLocation: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  matchBadge: {
    flexShrink: 0,
  },
  matchRing: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "2.5px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  matchNum: {
    fontSize: 15,
    fontWeight: 700,
  },
  matchPct: {
    fontSize: 9,
    color: "#bbb",
    marginTop: -2,
  },
  causeTag: {
    margin: "0 18px 10px",
    padding: "5px 12px",
    borderRadius: 40,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  gwBadge: {
    fontSize: 10,
    border: "1px solid",
    borderRadius: 4,
    padding: "1px 5px",
    fontWeight: 700,
    letterSpacing: "0.03em",
  },
  tagline: {
    padding: "0 18px",
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 15,
    color: "#1A3A2A",
    lineHeight: 1.4,
    marginBottom: 8,
  },
  description: {
    padding: "0 18px",
    fontSize: 12.5,
    color: "#555",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  statsRow: {
    display: "flex",
    gap: 0,
    borderTop: "1px solid #F0EDE8",
    borderBottom: "1px solid #F0EDE8",
    margin: "0 0 12px",
  },
  statBox: {
    flex: 1,
    textAlign: "center",
    padding: "10px 8px",
    borderRight: "1px solid #F0EDE8",
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1A3A2A",
    fontFamily: "'Inter', sans-serif",
  },
  statLabel: {
    fontSize: 9.5,
    color: "#aaa",
    marginTop: 2,
    lineHeight: 1.3,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  costEff: {
    padding: "0 18px",
    fontSize: 12,
  },
  costLabel: {
    color: "#aaa",
  },
  costValue: {
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginTop: 20,
  },
  remainingPill: {
    fontSize: 11,
    color: "#bbb",
    letterSpacing: "0.04em",
    fontWeight: 500,
  },
  actionBtn: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: 700,
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  },
  passBtn: {
    background: "#fff",
    color: "#E85D5D",
    border: "2px solid #F5DADA",
  },
  fundBtn: {
    background: "#2D9E6B",
    color: "#fff",
    fontSize: 22,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: "#ccc",
    letterSpacing: "0.04em",
  },
  matchOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(26,58,42,0.75)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  matchBox: {
    background: "#fff",
    borderRadius: 24,
    padding: "36px 48px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  matchLabel: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 28,
    color: "#E8B84B",
    marginTop: 8,
  },
  matchOrgName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 20,
    color: "#1A3A2A",
    marginTop: 4,
  },
  matchSub: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 6,
  },
  interestedContainer: {
    width: "100%",
    maxWidth: 420,
    padding: "0 20px 40px",
    flex: 1,
    overflowY: "auto",
  },
  interestedTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 26,
    color: "#1A3A2A",
    margin: "0 0 4px",
  },
  interestedSub: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 20,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  queueList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  queueCard: {
    background: "#fff",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(26,58,42,0.08)",
  },
  queueCauseBar: {
    width: 5,
    alignSelf: "stretch",
    flexShrink: 0,
  },
  queueEmoji: {
    fontSize: 28,
    padding: "14px 12px",
    flexShrink: 0,
  },
  queueInfo: {
    flex: 1,
    padding: "12px 0",
    minWidth: 0,
  },
  queueName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 16,
    color: "#1A3A2A",
  },
  queueCause: {
    fontSize: 11,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 1,
  },
  queueTagline: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingRight: 8,
  },
  queueMatch: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2D9E6B",
    padding: "0 16px 0 8px",
    flexShrink: 0,
  },
};
