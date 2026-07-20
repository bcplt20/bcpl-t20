import { useState, useRef, useEffect } from "react";

/* ─── Types ─────────────────────────────────────────── */
interface Batsman {
  name: string; runs: number; balls: number; fours: number; sixes: number;
  out?: string; sr?: number; dismissed?: boolean;
}
interface Bowler {
  name: string; overs: number; balls: number; runs: number; wickets: number;
  wides: number; noBalls: number;
}
interface Partnership { bat1: string; bat2: string; runs: number; balls: number; }
interface FallOfWicket { wicket: number; batsman: string; runs: number; overs: string; }
interface OverSummary { over: number; runs: number; wickets: number; balls: string[]; }
interface InningsData {
  team: string; runs: number; wickets: number; overs: number; balls: number;
  batting: Batsman[]; bowling: Bowler[]; partnerships: Partnership[];
  fallOfWickets: FallOfWicket[]; overHistory: OverSummary[]; extras: number;
  target?: number;
}

/* ─── Helpers ────────────────────────────────────────── */
const fmtOvers = (o: number, b: number) => `${o}.${b}`;
const sr = (r: number, b: number) => b === 0 ? "0.00" : ((r / b) * 100).toFixed(1);
const eco = (r: number, o: number, b: number) => {
  const totalOvers = o + b / 6;
  return totalOvers === 0 ? "0.00" : (r / totalOvers).toFixed(2);
};
const projScore = (runs: number, overs: number, balls: number) => {
  const done = overs + balls / 6;
  if (done === 0) return 0;
  return Math.round((runs / done) * 20);
};
const rrr = (target: number, runs: number, overs: number, balls: number) => {
  const remaining = 20 - (overs + balls / 6);
  if (remaining <= 0) return "—";
  return ((target - runs) / remaining).toFixed(2);
};
const crr = (runs: number, overs: number, balls: number) => {
  const done = overs + balls / 6;
  return done === 0 ? "0.00" : (runs / done).toFixed(2);
};

/* ─── Initial mock data ──────────────────────────────── */
const makeInnings = (team: string, target?: number): InningsData => ({
  team, runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, target,
  batting: [
    { name: "Arjun Sharma",  runs: 0, balls: 0, fours: 0, sixes: 0 },
    { name: "Rahul Patel",   runs: 0, balls: 0, fours: 0, sixes: 0 },
    { name: "Dev Mehta",     runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Karan Joshi",   runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Saurav Roy",    runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Nikhil Das",    runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Pranav Singh",  runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Vikram Nair",   runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Ajay Kumar",    runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Suresh Rao",    runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
    { name: "Manish Tiwari", runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false },
  ],
  bowling: [
    { name: "Vikas Singh",  overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
    { name: "Amit Gupta",   overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
    { name: "Rohit Verma",  overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
    { name: "Sunil Patil",  overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
    { name: "Hemant Dubey", overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 },
  ],
  partnerships: [{ bat1: "Arjun Sharma", bat2: "Rahul Patel", runs: 0, balls: 0 }],
  fallOfWickets: [],
  overHistory: [],
});

/* ─── Preloaded demo innings (1st innings done) ─────── */
const DEMO_INN1: InningsData = {
  team: "Mumbai Mavericks",
  runs: 172, wickets: 6, overs: 20, balls: 0, extras: 8,
  target: 173,
  batting: [
    { name: "Arjun Sharma",  runs: 67, balls: 42, fours: 6, sixes: 3, out: "c Kapoor b Singh", dismissed: true },
    { name: "Rahul Patel",   runs: 31, balls: 28, fours: 3, sixes: 0, out: "b Gupta", dismissed: true },
    { name: "Dev Mehta",     runs: 44, balls: 30, fours: 4, sixes: 2, out: "run out", dismissed: true },
    { name: "Karan Joshi",   runs: 12, balls: 9,  fours: 1, sixes: 0, out: "c Das b Verma", dismissed: true },
    { name: "Saurav Roy",    runs: 7,  balls: 5,  fours: 0, sixes: 1, out: "b Singh", dismissed: true },
    { name: "Nikhil Das",    runs: 3,  balls: 4,  fours: 0, sixes: 0, out: "lbw b Patil", dismissed: true },
    { name: "Pranav Singh",  runs: 8,  balls: 6,  fours: 1, sixes: 0, dismissed: false },
    { name: "Vikram Nair",   runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Ajay Kumar",    runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Suresh Rao",    runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Manish Tiwari", runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
  ],
  bowling: [
    { name: "Vikas Singh",  overs: 4, balls: 0, runs: 36, wickets: 2, wides: 2, noBalls: 0 },
    { name: "Amit Gupta",   overs: 4, balls: 0, runs: 31, wickets: 1, wides: 1, noBalls: 1 },
    { name: "Rohit Verma",  overs: 4, balls: 0, runs: 42, wickets: 1, wides: 0, noBalls: 0 },
    { name: "Sunil Patil",  overs: 4, balls: 0, runs: 34, wickets: 1, wides: 2, noBalls: 0 },
    { name: "Hemant Dubey", overs: 4, balls: 0, runs: 21, wickets: 1, wides: 0, noBalls: 0 },
  ],
  partnerships: [
    { bat1: "Arjun Sharma", bat2: "Rahul Patel", runs: 78, balls: 52 },
    { bat1: "Arjun Sharma", bat2: "Dev Mehta",   runs: 62, balls: 38 },
    { bat1: "Dev Mehta",    bat2: "Karan Joshi",  runs: 18, balls: 14 },
    { bat1: "Karan Joshi",  bat2: "Saurav Roy",   runs: 9,  balls: 7  },
    { bat1: "Saurav Roy",   bat2: "Nikhil Das",   runs: 3,  balls: 4  },
    { bat1: "Nikhil Das",   bat2: "Pranav Singh", runs: 2,  balls: 3  },
  ],
  fallOfWickets: [
    { wicket: 1, batsman: "Rahul Patel",   runs: 78,  overs: "8.4"  },
    { wicket: 2, batsman: "Arjun Sharma",  runs: 140, overs: "16.2" },
    { wicket: 3, batsman: "Dev Mehta",     runs: 158, overs: "18.1" },
    { wicket: 4, batsman: "Karan Joshi",   runs: 167, overs: "19.1" },
    { wicket: 5, batsman: "Saurav Roy",    runs: 170, overs: "19.4" },
    { wicket: 6, batsman: "Nikhil Das",    runs: 172, overs: "20.0" },
  ],
  overHistory: [
    { over: 1,  runs: 8,  wickets: 0, balls: ["1","2","1","0","2","2"] },
    { over: 2,  runs: 11, wickets: 0, balls: ["1","4","2","1","2","1"] },
    { over: 3,  runs: 6,  wickets: 0, balls: ["1","1","1","1","1","1"] },
    { over: 4,  runs: 14, wickets: 0, balls: ["4","2","4","1","2","1"] },
    { over: 5,  runs: 7,  wickets: 0, balls: ["1","1","2","1","1","1"] },
    { over: 6,  runs: 12, wickets: 0, balls: ["6","2","1","1","1","1"] },
    { over: 7,  runs: 9,  wickets: 0, balls: ["1","1","4","1","1","1"] },
    { over: 8,  runs: 11, wickets: 0, balls: ["2","1","4","1","2","1"] },
    { over: 9,  runs: 5,  wickets: 1, balls: ["1","1","W","1","1","1"] },
    { over: 10, runs: 10, wickets: 0, balls: ["4","2","1","1","1","1"] },
    { over: 11, runs: 13, wickets: 0, balls: ["6","1","2","1","2","1"] },
    { over: 12, runs: 8,  wickets: 0, balls: ["1","4","1","1","0","1"] },
    { over: 13, runs: 12, wickets: 0, balls: ["4","2","1","2","1","2"] },
    { over: 14, runs: 9,  wickets: 0, balls: ["1","1","2","1","3","1"] },
    { over: 15, runs: 11, wickets: 0, balls: ["6","1","1","1","1","1"] },
    { over: 16, runs: 8,  wickets: 1, balls: ["2","W","2","1","2","1"] },
    { over: 17, runs: 14, wickets: 1, balls: ["4","W","6","1","2","1"] },
    { over: 18, runs: 9,  wickets: 1, balls: ["1","W","4","1","2","1"] },
    { over: 19, runs: 8,  wickets: 1, balls: ["2","W","2","2","1","1"] },
    { over: 20, runs: 6,  wickets: 1, balls: ["2","1","1","W","1","1"] },
  ],
};

const DEMO_INN2_START: InningsData = {
  ...makeInnings("Kolkata Tigers", 173),
  runs: 124, wickets: 4, overs: 14, balls: 2, extras: 4,
  batting: [
    { name: "Rahul Kapoor",   runs: 62, balls: 41, fours: 6, sixes: 2, out: "c Sharma b Singh", dismissed: true },
    { name: "Suresh Verma",   runs: 18, balls: 16, fours: 2, sixes: 0, out: "lbw b Gupta", dismissed: true },
    { name: "Deepak Nair",    runs: 29, balls: 22, fours: 2, sixes: 1, out: "run out", dismissed: true },
    { name: "Ankit Rao",      runs: 5,  balls: 7,  fours: 0, sixes: 0, out: "c Joshi b Verma", dismissed: true },
    { name: "Vikash Tiwari",  runs: 10, balls: 8,  fours: 1, sixes: 0, dismissed: false },
    { name: "Sachin Dubey",   runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Ravi Patil",     runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Mohit Kumar",    runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Tarun Das",      runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Harish Pillai",  runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
    { name: "Ganesh Mishra",  runs: 0,  balls: 0,  fours: 0, sixes: 0, dismissed: false },
  ],
  bowling: [
    { name: "Arjun Sharma",  overs: 3, balls: 0, runs: 28, wickets: 1, wides: 1, noBalls: 0 },
    { name: "Pranav Singh",  overs: 3, balls: 2, runs: 24, wickets: 2, wides: 0, noBalls: 0 },
    { name: "Dev Mehta",     overs: 3, balls: 0, runs: 32, wickets: 1, wides: 2, noBalls: 0 },
    { name: "Vikram Nair",   overs: 2, balls: 0, runs: 18, wickets: 0, wides: 1, noBalls: 0 },
    { name: "Karan Joshi",   overs: 3, balls: 0, runs: 22, wickets: 0, wides: 0, noBalls: 0 },
  ],
  partnerships: [
    { bat1: "Rahul Kapoor", bat2: "Suresh Verma",  runs: 48, balls: 32 },
    { bat1: "Rahul Kapoor", bat2: "Deepak Nair",   runs: 55, balls: 36 },
    { bat1: "Deepak Nair",  bat2: "Ankit Rao",     runs: 12, balls: 11 },
    { bat1: "Ankit Rao",    bat2: "Vikash Tiwari", runs: 9,  balls: 9  },
    { bat1: "Vikash Tiwari",bat2: "Sachin Dubey",  runs: 0,  balls: 0  },
  ],
  fallOfWickets: [
    { wicket: 1, batsman: "Suresh Verma",  runs: 48,  overs: "5.4"  },
    { wicket: 2, batsman: "Rahul Kapoor",  runs: 103, overs: "11.2" },
    { wicket: 3, batsman: "Deepak Nair",   runs: 115, overs: "13.1" },
    { wicket: 4, batsman: "Ankit Rao",     runs: 124, overs: "14.1" },
  ],
  overHistory: [
    { over: 1,  runs: 8,  wickets: 0, balls: ["2","1","4","0","0","1"] },
    { over: 2,  runs: 6,  wickets: 0, balls: ["1","1","1","1","2","0"] },
    { over: 3,  runs: 10, wickets: 0, balls: ["4","2","1","2","1","0"] },
    { over: 4,  runs: 12, wickets: 0, balls: ["6","1","2","1","1","1"] },
    { over: 5,  runs: 10, wickets: 0, balls: ["4","2","1","1","2","0"] },
    { over: 6,  runs: 2,  wickets: 1, balls: ["1","W","0","0","0","1"] },
    { over: 7,  runs: 12, wickets: 0, balls: ["4","2","4","1","0","1"] },
    { over: 8,  runs: 14, wickets: 0, balls: ["6","2","1","2","2","1"] },
    { over: 9,  runs: 8,  wickets: 0, balls: ["4","1","1","1","0","1"] },
    { over: 10, runs: 9,  wickets: 0, balls: ["1","2","4","1","0","1"] },
    { over: 11, runs: 11, wickets: 0, balls: ["4","2","1","1","2","1"] },
    { over: 12, runs: 3,  wickets: 1, balls: ["1","1","0","W","1","0"] },
    { over: 13, runs: 8,  wickets: 0, balls: ["2","2","1","1","1","1"] },
    { over: 14, runs: 11, wickets: 2, balls: ["4","W","2","W","2","."  ] },
  ],
};

const QUICK_COMMENTS = [
  "🏏 Straight drive to the boundary!",
  "🚀 Massive six over deep mid-wicket!",
  "💥 OUT! Caught behind by the keeper!",
  "🎯 Dot ball! Superb line and length.",
  "🤝 Single to square leg, rotate.",
  "🌟 Amazing catch at covers! Diving effort!",
  "🔥 Full toss — cracked through the covers!",
  "🧤 Run out! Brilliant throw from mid-on!",
  "↩️ LBW! Plumb in front of middle stump.",
  "✨ Flicked off his pads for a boundary!",
];

/* ─── Styles ─────────────────────────────────────────── */
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
  border: "1px solid #1E293B", borderRadius: 16, padding: "18px 20px",
  ...extra,
});
const pill = (color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "3px 10px", borderRadius: 20,
  background: `${color}20`, border: `1px solid ${color}40`,
  fontSize: 11, fontWeight: 700, color,
});
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
  background: active ? "linear-gradient(135deg,#FF6B00,#FF8C40)" : "transparent",
  color: active ? "#fff" : "#64748B", fontSize: 12, fontWeight: 700,
  transition: "all 0.2s",
});

/* ─── Wagon Wheel SVG ────────────────────────────────── */
const SHOTS = [
  { angle: 30,  len: 0.75, color: "#10B981", label: "6" },
  { angle: 60,  len: 0.55, color: "#3B82F6", label: "4" },
  { angle: 90,  len: 0.45, color: "#3B82F6", label: "4" },
  { angle: 120, len: 0.62, color: "#10B981", label: "6" },
  { angle: 150, len: 0.40, color: "#94A3B8", label: "2" },
  { angle: 180, len: 0.30, color: "#64748B", label: "1" },
  { angle: 210, len: 0.68, color: "#10B981", label: "6" },
  { angle: 240, len: 0.48, color: "#3B82F6", label: "4" },
  { angle: 270, len: 0.35, color: "#94A3B8", label: "2" },
  { angle: 300, len: 0.72, color: "#10B981", label: "6" },
  { angle: 330, len: 0.52, color: "#3B82F6", label: "4" },
  { angle: 10,  len: 0.28, color: "#64748B", label: "1" },
];

function WagonWheel() {
  const cx = 140, cy = 140, r = 120;
  return (
    <svg width={280} height={280} style={{ display: "block", margin: "0 auto" }}>
      {/* Field zones */}
      <circle cx={cx} cy={cy} r={r}   fill="#0A2010" stroke="#1E3B28" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r*0.6} fill="none" stroke="#1E3B2880" strokeWidth={1} strokeDasharray="4 4"/>
      <circle cx={cx} cy={cy} r={r*0.3} fill="none" stroke="#1E3B2880" strokeWidth={1} strokeDasharray="4 4"/>
      {/* Pitch lines */}
      <line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke="#1E3B28" strokeWidth={1} strokeDasharray="6 4"/>
      <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke="#1E3B28" strokeWidth={1} strokeDasharray="6 4"/>
      {/* Boundary rope */}
      <circle cx={cx} cy={cy} r={r-4} fill="none" stroke="#22C55E40" strokeWidth={3}/>
      {/* Shot lines */}
      {SHOTS.map((s, i) => {
        const rad = (s.angle - 90) * (Math.PI / 180);
        const x2 = cx + Math.cos(rad) * r * s.len;
        const y2 = cy + Math.sin(rad) * r * s.len;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x2} y2={y2}
              stroke={s.color} strokeWidth={2} strokeLinecap="round" opacity={0.85}/>
            <circle cx={x2} cy={y2} r={4} fill={s.color} opacity={0.9}/>
          </g>
        );
      })}
      {/* Batsman at crease */}
      <circle cx={cx} cy={cy} r={8} fill="#FF6B00" opacity={0.9}/>
      <circle cx={cx} cy={cy} r={3} fill="#fff"/>
      {/* Labels */}
      <text x={cx} y={14} textAnchor="middle" fill="#4ADE8080" fontSize={9}>MID-ON</text>
      <text x={cx} y={cy*2-4} textAnchor="middle" fill="#4ADE8080" fontSize={9}>MID-OFF</text>
      <text x={8} y={cy+4} textAnchor="start" fill="#4ADE8080" fontSize={9}>SQ LEG</text>
      <text x={cx*2-8} y={cy+4} textAnchor="end" fill="#4ADE8080" fontSize={9}>POINT</text>
    </svg>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export default function LiveScoringView() {
  const [matchPhase, setMatchPhase] = useState<"setup"|"inn1"|"inn2"|"result">("inn2");
  const [inn1, setInn1] = useState<InningsData>(DEMO_INN1);
  const [inn2, setInn2] = useState<InningsData>(DEMO_INN2_START);
  const [activeInnings, setActiveInnings] = useState<1|2>(2);
  const [mainTab, setMainTab] = useState<"live"|"scorecard"|"stats">("live");
  const [scorecardTab, setScorecardTab] = useState<"batting1"|"bowling1"|"batting2"|"bowling2">("batting2");
  const [strikerIdx, setStrikerIdx] = useState(4);  // Vikash Tiwari
  const [nonStrikerIdx, setNonStrikerIdx] = useState(5); // Sachin Dubey
  const [bowlerIdx, setBowlerIdx] = useState(1);    // Pranav Singh
  const [commentary, setCommentary] = useState<string[]>([
    "14.2 — 🏏 Full toss driven to the cover boundary! FOUR!",
    "14.1 — 💥 OUT! Ankit Rao caught at mid-off by Joshi. Kolkata 4 down.",
    "14.0 — 🎯 Dot ball, perfect yorker!",
    "13.6 — 🤝 Two runs to deep square leg.",
    "13.5 — 🚀 SIX! Pulled over mid-wicket. Deepak Nair in form!",
    "13.4 — Single taken, rotated strike.",
  ]);
  const [customNote, setCustomNote] = useState("");
  const [currentOverBalls, setCurrentOverBalls] = useState<string[]>(["4","W"]);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Toss & setup state
  const [tossWinner, setTossWinner] = useState("Mumbai Mavericks");
  const [tossDec, setTossDec] = useState("bat");
  const [venue, setVenue] = useState("Wankhede Stadium, Mumbai");
  const [matchNo, setMatchNo] = useState("12");

  const inn = activeInnings === 1 ? inn1 : inn2;
  const setInn = activeInnings === 1 ? setInn1 : setInn2;

  /* ─── Add ball ─────────────────────────────── */
  const addBall = (outcome: string) => {
    const isWide = outcome === "WD";
    const isNB = outcome === "NB";
    const isExtra = isWide || isNB;
    const isWicket = outcome === "W";
    const runs =
      outcome === "4" ? 4 : outcome === "6" ? 6 :
      (isWicket || outcome === "." || isWide || isNB) ? 0 :
      parseInt(outcome) || 0;

    if (!isExtra) setCurrentOverBalls(b => [...b, isWicket ? "W" : outcome]);

    setInn(prev => {
      const newBalls = isExtra ? prev.balls : prev.balls + 1;
      const overComplete = !isExtra && newBalls === 6;
      const newOvers = overComplete ? prev.overs + 1 : prev.overs;
      const finalBalls = overComplete ? 0 : newBalls;

      // Update batting
      const newBatting = prev.batting.map((b, i) => {
        if (i === strikerIdx && !isExtra) {
          return { ...b, runs: b.runs + runs, balls: b.balls + 1,
            fours: outcome === "4" ? b.fours + 1 : b.fours,
            sixes: outcome === "6" ? b.sixes + 1 : b.sixes,
            dismissed: isWicket ? true : b.dismissed,
            out: isWicket ? "dismissed" : b.out };
        }
        return b;
      });

      // Update bowling
      const newBowling = prev.bowling.map((b, i) => {
        if (i !== bowlerIdx) return b;
        const nb = isExtra ? b.balls : b.balls + 1;
        const oc = !isExtra && nb === 6;
        return { ...b, runs: b.runs + runs + (isExtra ? 1 : 0),
          wickets: isWicket ? b.wickets + 1 : b.wickets,
          balls: oc ? 0 : nb, overs: oc ? b.overs + 1 : b.overs,
          wides: isWide ? b.wides + 1 : b.wides,
          noBalls: isNB ? b.noBalls + 1 : b.noBalls };
      });

      // Partnership update
      const newPartnerships = [...prev.partnerships];
      const lastP = newPartnerships[newPartnerships.length - 1];
      if (lastP) {
        newPartnerships[newPartnerships.length - 1] = {
          ...lastP, runs: lastP.runs + runs,
          balls: isExtra ? lastP.balls : lastP.balls + 1,
        };
      }

      // Over history
      let newOverHistory = [...prev.overHistory];
      if (overComplete) {
        newOverHistory.push({ over: prev.overs + 1, runs, wickets: isWicket ? 1 : 0,
          balls: currentOverBalls.concat([isWicket ? "W" : outcome]) });
      }

      // Fall of wicket
      const newFow = isWicket
        ? [...prev.fallOfWickets, { wicket: prev.wickets + 1,
            batsman: prev.batting[strikerIdx]?.name || "Unknown",
            runs: prev.runs + runs, overs: fmtOvers(prev.overs, prev.balls) }]
        : prev.fallOfWickets;

      return {
        ...prev, runs: prev.runs + runs + (isExtra ? 1 : 0),
        wickets: isWicket ? prev.wickets + 1 : prev.wickets,
        overs: newOvers, balls: finalBalls,
        extras: prev.extras + (isExtra ? 1 : 0),
        batting: newBatting, bowling: newBowling,
        partnerships: newPartnerships, fallOfWickets: newFow,
        overHistory: newOverHistory,
      };
    });

    if (overComplete && !isExtra) setCurrentOverBalls([]);

    // Commentary
    const o = inn.overs, b = inn.balls + 1;
    const msg =
      outcome === "W"  ? `${o}.${b} — 💥 WICKET! ${inn.batting[strikerIdx]?.name} is OUT!` :
      outcome === "6"  ? `${o}.${b} — 🚀 SIX! Ball disappears into the stands!` :
      outcome === "4"  ? `${o}.${b} — 🏏 FOUR! Racing to the boundary!` :
      outcome === "."  ? `${o}.${b} — 🎯 Dot ball, well bowled.` :
      outcome === "WD" ? `${o}.${b} — Wide ball signalled by umpire. +1 extra.` :
      outcome === "NB" ? `${o}.${b} — ⚠️ No ball called! Free hit coming up. +1 extra.` :
      outcome === "LB" ? `${o}.${b} — Leg bye, ${outcome} extra.` :
                         `${o}.${b} — ${outcome} run(s) taken.`;
    setCommentary(c => [msg, ...c].slice(0, 30));
  };

  const addCustomCommentary = (text: string) => {
    if (!text.trim()) return;
    setCommentary(c => [`${inn.overs}.${inn.balls} — ${text.trim()}`, ...c].slice(0, 30));
    setCustomNote("");
  };

  /* ─── Derived stats ──────────────────────────────── */
  const target = inn2.target ?? 0;
  const runsNeeded = Math.max(0, target - inn2.runs);
  const ballsLeft = Math.max(0, (20 - inn2.overs) * 6 - inn2.balls);
  const oversLeft = (ballsLeft / 6).toFixed(1);
  const currentCRR = crr(inn2.runs, inn2.overs, inn2.balls);
  const currentRRR = rrr(target, inn2.runs, inn2.overs, inn2.balls);
  const projected = projScore(inn2.runs, inn2.overs, inn2.balls);
  const striker = inn.batting[strikerIdx];
  const nonStriker = inn.batting[nonStrikerIdx];
  const currentBowler = inn.bowling[bowlerIdx];
  const currentPartnership = inn.partnerships[inn.partnerships.length - 1];

  /* ─── Match Setup ────────────────────────────────── */
  if (matchPhase === "setup") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600, margin: "0 auto" }}>
        <div style={card()}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#E2E8F0", marginBottom: 18 }}>🏟️ Match Setup</div>
          {[
            { label: "Match Number", value: matchNo, set: setMatchNo },
            { label: "Venue", value: venue, set: setVenue },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>{f.label}</div>
              <input value={f.value} onChange={e => f.set(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }}/>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>Toss Winner</div>
              <select value={tossWinner} onChange={e => setTossWinner(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                <option>Mumbai Mavericks</option>
                <option>Kolkata Tigers</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>Elected To</div>
              <select value={tossDec} onChange={e => setTossDec(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                <option value="bat">Bat</option>
                <option value="field">Field</option>
              </select>
            </div>
          </div>
          <button onClick={() => setMatchPhase("inn1")}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            🏏 Start Match
          </button>
        </div>
      </div>
    );
  }

  /* ─── Scorecard Tab ──────────────────────────────── */
  const renderScorecard = () => {
    const tabsConfig = [
      { id: "batting1",  label: "Batting (Inn 1)" },
      { id: "bowling1",  label: "Bowling (Inn 1)" },
      { id: "batting2",  label: "Batting (Inn 2)" },
      { id: "bowling2",  label: "Bowling (Inn 2)" },
    ] as const;

    const renderBatting = (d: InningsData, inningsNum: number) => (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0" }}>{d.team}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#FF6B00", marginTop: 2 }}>
              {d.runs}/{d.wickets} <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>({fmtOvers(d.overs, d.balls)} ov)</span>
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#64748B" }}>
            <div>Extras: <span style={{ color: "#E2E8F0" }}>{d.extras}</span></div>
            {d.target && <div style={{ color: "#F59E0B", fontWeight: 700 }}>Target: {d.target}</div>}
          </div>
        </div>
        {/* Batting table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Batsman","Dismissal","R","B","4s","6s","SR"].map(h => (
                  <th key={h} style={{ padding: "7px 8px", textAlign: h === "Batsman" || h === "Dismissal" ? "left" : "right", color: "#64748B", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.batting.filter(b => b.balls > 0 || b.dismissed).map((bat, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F172A" }}>
                  <td style={{ padding: "8px", color: bat.dismissed ? "#94A3B8" : "#E2E8F0", fontWeight: bat.dismissed ? 400 : 700 }}>{bat.name}</td>
                  <td style={{ padding: "8px", color: "#64748B", fontSize: 11 }}>{bat.out || (inningsNum === activeInnings && !bat.dismissed ? "not out" : "not out")}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: bat.runs >= 50 ? "#F59E0B" : "#E2E8F0", fontWeight: 800 }}>{bat.runs}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#94A3B8" }}>{bat.balls}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#3B82F6" }}>{bat.fours}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#10B981" }}>{bat.sixes}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#64748B" }}>{sr(bat.runs, bat.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Fall of wickets */}
        {d.fallOfWickets.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Fall of Wickets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.fallOfWickets.map((f, i) => (
                <div key={i} style={{ padding: "4px 10px", background: "#EF444415", border: "1px solid #EF444430", borderRadius: 20, fontSize: 11, color: "#EF4444" }}>
                  {f.wicket}-{f.runs} ({f.batsman.split(" ")[0]}, {f.overs})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    const renderBowling = (d: InningsData) => (
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", marginBottom: 14 }}>
          Bowling — {d.team === "Mumbai Mavericks" ? "Kolkata Tigers" : "Mumbai Mavericks"}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Bowler","O","R","W","Econ","Wd","NB"].map(h => (
                  <th key={h} style={{ padding: "7px 8px", textAlign: h === "Bowler" ? "left" : "right", color: "#64748B", fontWeight: 700, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.bowling.filter(b => b.overs > 0 || b.balls > 0).map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F172A" }}>
                  <td style={{ padding: "8px", color: "#E2E8F0", fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#94A3B8" }}>{fmtOvers(b.overs, b.balls)}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#E2E8F0" }}>{b.runs}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: b.wickets > 0 ? "#EF4444" : "#64748B", fontWeight: b.wickets > 0 ? 800 : 400 }}>{b.wickets}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#F59E0B" }}>{eco(b.runs, b.overs, b.balls)}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#64748B" }}>{b.wides}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#64748B" }}>{b.noBalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tabsConfig.map(t => (
            <button key={t.id} onClick={() => setScorecardTab(t.id)} style={tabBtn(scorecardTab === t.id)}>{t.label}</button>
          ))}
        </div>
        <div style={card()}>
          {scorecardTab === "batting1"  && renderBatting(inn1, 1)}
          {scorecardTab === "bowling1"  && renderBowling(inn1)}
          {scorecardTab === "batting2"  && renderBatting(inn2, 2)}
          {scorecardTab === "bowling2"  && renderBowling(inn2)}
        </div>
      </div>
    );
  };

  /* ─── Stats Tab ──────────────────────────────────── */
  const renderStats = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Partnerships */}
      <div style={card()}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Partnerships — 2nd Innings</div>
        {inn2.partnerships.map((p, i) => {
          const barW = Math.min(100, (p.runs / 80) * 100);
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{p.bat1.split(" ")[0]} & {p.bat2.split(" ")[0]}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#FF6B00" }}>{p.runs} <span style={{ color: "#64748B", fontWeight: 400, fontSize: 10 }}>({p.balls}b)</span></span>
              </div>
              <div style={{ height: 6, background: "#0F172A", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barW}%`, background: "linear-gradient(90deg,#FF6B00,#FF8C40)", borderRadius: 3, transition: "width 0.5s" }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Over-by-over summary */}
      <div style={card()}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Over Summary — 2nd Innings</div>
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {inn2.overHistory.slice().reverse().map((o, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #0F172A" }}>
              <span style={{ fontSize: 11, color: "#64748B", width: 40 }}>Ov {o.over}</span>
              <div style={{ display: "flex", gap: 3 }}>
                {o.balls.map((b, j) => (
                  <div key={j} style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800,
                    background: b === "6" ? "#10B98130" : b === "4" ? "#3B82F630" : b === "W" ? "#EF444430" : "#1E293B",
                    color: b === "6" ? "#10B981" : b === "4" ? "#3B82F6" : b === "W" ? "#EF4444" : "#64748B" }}>{b}</div>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: o.runs >= 15 ? "#10B981" : o.runs >= 10 ? "#F59E0B" : "#E2E8F0" }}>{o.runs}</span>
              {o.wickets > 0 && <span style={{ fontSize: 10, color: "#EF4444" }}>W</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Wagon Wheel */}
      <div style={card()}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Wagon Wheel — Striker</div>
        <WagonWheel />
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
          {[{ c: "#10B981", l: "Six" }, { c: "#3B82F6", l: "Four" }, { c: "#94A3B8", l: "2/3" }, { c: "#64748B", l: "1/Dot" }].map(x => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }}/>
              <span style={{ fontSize: 10, color: "#64748B" }}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Run Rate Chart */}
      <div style={card()}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Run Rate Comparison</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {inn2.overHistory.map((o, i) => {
            const inn1Over = inn1.overHistory[i];
            const w1 = inn1Over ? Math.min(100, (inn1Over.runs / 20) * 100) : 0;
            const w2 = Math.min(100, (o.runs / 20) * 100);
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10, color: "#475569" }}>
                  <span>Ov {o.over}</span>
                  <span style={{ color: "#94A3B8" }}>{inn1Over?.runs ?? 0} vs {o.runs}</span>
                </div>
                <div style={{ height: 5, background: "#0F172A", borderRadius: 3, marginBottom: 2 }}>
                  <div style={{ height: "100%", width: `${w1}%`, background: "#3B82F6", borderRadius: 3 }}/>
                </div>
                <div style={{ height: 5, background: "#0F172A", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${w2}%`, background: "#FF6B00", borderRadius: 3 }}/>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 4, background: "#3B82F6", borderRadius: 2 }}/>
              <span style={{ fontSize: 10, color: "#64748B" }}>{inn1.team}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 4, background: "#FF6B00", borderRadius: 2 }}/>
              <span style={{ fontSize: 10, color: "#64748B" }}>{inn2.team}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Live Tab ───────────────────────────────────── */
  const renderLive = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Match Header ── */}
      <div style={card({ borderColor: "#EF444440", background: "linear-gradient(135deg,#0D1526,#1A0808)" })}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* LIVE badge */}
          <div style={pill("#EF4444")}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", boxShadow: "0 0 8px #EF4444", animation: "pulse 1.2s infinite" }}/>
            LIVE
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#E2E8F0" }}>
              Mumbai Mavericks <span style={{ color: "#FF6B00" }}>vs</span> Kolkata Tigers
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
              📍 {venue} · Match {matchNo} of 64 · BCPL T20 Season 5 · {tossWinner} chose to {tossDec}
            </div>
          </div>
          {/* Innings toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {([1, 2] as const).map(i => (
              <button key={i} onClick={() => setActiveInnings(i)}
                style={{ padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: activeInnings === i ? "#FF6B0030" : "#0F172A",
                  color: activeInnings === i ? "#FF6B00" : "#64748B",
                  border: activeInnings === i ? "1px solid #FF6B0040" : "1px solid #1E293B" }}>
                {i === 1 ? "1st Inn" : "2nd Inn"}
              </button>
            ))}
          </div>
        </div>

        {/* Both innings scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          {[{ d: inn1, label: "1st Innings", suffix: "" }, { d: inn2, label: "2nd Innings", suffix: `/ ${target}` }].map(({ d, label, suffix }) => (
            <div key={label} style={{ background: "#060B1880", borderRadius: 12, padding: "12px 16px", border: "1px solid #1E293B" }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 4, fontWeight: 700 }}>{label} · {d.team}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#FF6B00" }}>
                {d.runs}/{d.wickets}{suffix}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>{fmtOvers(d.overs, d.balls)} Overs</div>
            </div>
          ))}
        </div>

        {/* CRR / RRR / Projected / Needed */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
          {[
            { label: "CRR", value: currentCRR, color: "#10B981" },
            { label: "RRR", value: currentRRR, color: runsNeeded > 0 ? "#EF4444" : "#10B981" },
            { label: "Projected", value: projected, color: "#F59E0B" },
            { label: "Need", value: `${runsNeeded} off ${ballsLeft}b`, color: "#FF6B00" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", background: "#060B18", borderRadius: 10, padding: "10px 6px", border: "1px solid #1E293B" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#475569", marginTop: 2, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Current over ball log */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, fontWeight: 700 }}>THIS OVER</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {currentOverBalls.map((b, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
                background: b === "6" ? "#10B98130" : b === "4" ? "#3B82F630" : b === "W" ? "#EF444430" : "#1E293B",
                color: b === "6" ? "#10B981" : b === "4" ? "#3B82F6" : b === "W" ? "#EF4444" : "#94A3B8",
                border: `1px solid ${b === "6" ? "#10B98140" : b === "4" ? "#3B82F640" : b === "W" ? "#EF444440" : "#0F172A"}` }}>{b}</div>
            ))}
            {Array.from({ length: Math.max(0, 6 - currentOverBalls.length) }).map((_, i) => (
              <div key={`e-${i}`} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px dashed #1E293B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1E293B" }}/>
              </div>
            ))}
            <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>
              Over {inn.overs + 1} · {currentOverBalls.reduce((s, b) => s + (b === "4" ? 4 : b === "6" ? 6 : b === "W" || b === "." ? 0 : parseInt(b) || 0), 0)} runs
            </span>
          </div>
        </div>
      </div>

      {/* ── At the Crease + Current Bowler ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>At the Crease</div>
          {striker && (
            <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #0F172A", marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B00", marginRight: 10 }}/>
              <span style={{ flex: 1, fontSize: 13, color: "#E2E8F0", fontWeight: 700 }}>{striker.name}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#FF6B00" }}>{striker.runs}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: 4 }}>({striker.balls})</span>
              <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
                <span style={{ fontSize: 11, color: "#3B82F6" }}>4s:{striker.fours}</span>
                <span style={{ fontSize: 11, color: "#10B981" }}>6s:{striker.sixes}</span>
                <span style={{ fontSize: 10, color: "#F59E0B" }}>SR:{sr(striker.runs, striker.balls)}</span>
              </div>
            </div>
          )}
          {nonStriker && (
            <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1E293B", marginRight: 10, border: "1px solid #475569" }}/>
              <span style={{ flex: 1, fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>{nonStriker.name}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8" }}>{nonStriker.runs}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: 4 }}>({nonStriker.balls})</span>
              <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
                <span style={{ fontSize: 11, color: "#1E3A5F" }}>4s:{nonStriker.fours}</span>
                <span style={{ fontSize: 11, color: "#1E4A3A" }}>6s:{nonStriker.sixes}</span>
              </div>
            </div>
          )}
          {/* Partnership */}
          {currentPartnership && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#FF6B0008", border: "1px solid #FF6B0020", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 3, fontWeight: 700 }}>CURRENT PARTNERSHIP</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#FF6B00" }}>{currentPartnership.runs} runs <span style={{ fontSize: 11, color: "#64748B" }}>off {currentPartnership.balls} balls</span></div>
            </div>
          )}
        </div>

        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Current Bowler</div>
          {currentBowler && (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0", marginBottom: 12 }}>{currentBowler.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                {[
                  { v: fmtOvers(currentBowler.overs, currentBowler.balls), l: "Overs", c: "#F59E0B" },
                  { v: currentBowler.runs, l: "Runs", c: "#E2E8F0" },
                  { v: currentBowler.wickets, l: "Wickets", c: "#EF4444" },
                  { v: eco(currentBowler.runs, currentBowler.overs, currentBowler.balls), l: "Economy", c: "#64748B" },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: "center", background: "#060B18", borderRadius: 8, padding: "8px 4px" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Bowler selector */}
              <div>
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, fontWeight: 700 }}>CHANGE BOWLER</div>
                <select value={bowlerIdx} onChange={e => setBowlerIdx(Number(e.target.value))}
                  style={{ width: "100%", padding: "7px 10px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 12, outline: "none" }}>
                  {inn.bowling.map((b, i) => (
                    <option key={i} value={i}>{b.name} ({fmtOvers(b.overs, b.balls)} ov, {b.wickets}W)</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Batsman selectors ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: "Striker", idx: strikerIdx, set: setStrikerIdx },
          { label: "Non-Striker", idx: nonStrikerIdx, set: setNonStrikerIdx },
        ].map(({ label, idx, set }) => (
          <div key={label} style={card({ padding: "12px 16px" })}>
            <div style={{ fontSize: 10, color: "#475569", marginBottom: 6, fontWeight: 700 }}>{label.toUpperCase()}</div>
            <select value={idx} onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", padding: "7px 10px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 12, outline: "none" }}>
              {inn.batting.map((b, i) => (
                <option key={i} value={i} disabled={b.dismissed}>{b.name} ({b.runs} off {b.balls}){b.dismissed ? " [out]" : ""}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* ── Scoring Pad + Commentary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Scoring Pad</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "0",  bg: "#1E293B",     tc: "#94A3B8" },
              { label: "1",  bg: "#1E3A5F40",   tc: "#3B82F6" },
              { label: "2",  bg: "#1E3A5F40",   tc: "#3B82F6" },
              { label: "3",  bg: "#1E3A5F40",   tc: "#3B82F6" },
              { label: "4",  bg: "#3B82F620",   tc: "#3B82F6" },
              { label: "6",  bg: "#10B98120",   tc: "#10B981" },
              { label: "W",  bg: "#EF444420",   tc: "#EF4444" },
              { label: ".",  bg: "#1E293B",     tc: "#64748B" },
              { label: "WD", bg: "#F59E0B20",   tc: "#F59E0B" },
              { label: "NB", bg: "#F59E0B20",   tc: "#F59E0B" },
              { label: "LB", bg: "#8B5CF620",   tc: "#8B5CF6" },
              { label: "B",  bg: "#8B5CF620",   tc: "#8B5CF6" },
            ].map(btn => (
              <button key={btn.label} onClick={() => addBall(btn.label)}
                style={{ padding: "16px 4px", borderRadius: 10, border: `1px solid ${btn.tc}30`, background: btn.bg,
                  color: btn.tc, fontSize: 17, fontWeight: 900, cursor: "pointer", transition: "transform 0.08s, box-shadow 0.08s" }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.91)"; e.currentTarget.style.boxShadow = `0 0 12px ${btn.tc}40`; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>
                {btn.label}
              </button>
            ))}
          </div>
          {/* Undo last ball */}
          <button onClick={() => setCurrentOverBalls(b => b.slice(0, -1))}
            style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #EF444430", background: "#EF444410", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ↩ Undo Last Ball
          </button>
        </div>

        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>Ball-by-Ball Commentary</div>
          {/* Quick comments */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {QUICK_COMMENTS.slice(0, 6).map((q, i) => (
              <button key={i} onClick={() => addCustomCommentary(q)}
                style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 10, cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <textarea ref={commentRef} value={customNote} onChange={e => setCustomNote(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCustomCommentary(customNote); }}}
              placeholder="Type commentary… (Enter to add)"
              rows={2}
              style={{ flex: 1, padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 9, color: "#F1F5F9", fontSize: 12, outline: "none", resize: "none", lineHeight: 1.5, fontFamily: "inherit" }}/>
            <button onClick={() => addCustomCommentary(customNote)}
              style={{ padding: "0 14px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 700 }}>→</button>
          </div>
          {/* Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflowY: "auto" }}>
            {commentary.map((c, i) => (
              <div key={i} style={{ padding: "7px 10px", background: i === 0 ? "#FF6B0008" : "#080E1C",
                border: `1px solid ${i === 0 ? "#FF6B0030" : "#0F172A"}`, borderRadius: 8,
                fontSize: 11, color: i === 0 ? "#E2E8F0" : "#64748B", lineHeight: 1.5 }}>{c}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fall of Wickets ── */}
      {inn.fallOfWickets.length > 0 && (
        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>Fall of Wickets</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {inn.fallOfWickets.map((f, i) => (
              <div key={i} style={{ padding: "6px 14px", background: "#EF444410", border: "1px solid #EF444430", borderRadius: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#EF4444" }}>{f.wicket}/{f.runs}</span>
                <span style={{ fontSize: 10, color: "#64748B", marginLeft: 6 }}>{f.batsman.split(" ")[0]} ({f.overs})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ─── Root render ────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top tabs */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { id: "live",      label: "🔴 Live Scoring" },
          { id: "scorecard", label: "📋 Scorecard"    },
          { id: "stats",     label: "📊 Stats & Charts" },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id as any)} style={tabBtn(mainTab === t.id)}>{t.label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setMatchPhase("setup")}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            ⚙️ Setup
          </button>
          <div style={pill("#EF4444")}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }}/>
            LIVE
          </div>
        </div>
      </div>

      {mainTab === "live"      && renderLive()}
      {mainTab === "scorecard" && renderScorecard()}
      {mainTab === "stats"     && renderStats()}
    </div>
  );
}
