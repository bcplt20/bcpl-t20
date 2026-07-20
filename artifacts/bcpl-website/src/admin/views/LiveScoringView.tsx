import { useState } from "react";

const BALLS = ["1", "0", "4", "W", "1", "6", ".", ".", "2", "1", "4", "W", "0", "1", "6"];

export default function LiveScoringView() {
  const [score, setScore] = useState({ runs: 124, wickets: 4, overs: 14, balls: 2 });
  const [striker, setStriker] = useState({ name: "Arjun Sharma", runs: 54, balls: 38, fours: 5, sixes: 2 });
  const [nonStriker] = useState({ name: "Rahul Patel", runs: 31, balls: 28, fours: 3, sixes: 0 });
  const [bowler] = useState({ name: "Vikas Singh", overs: "3.2", runs: 28, wickets: 2, economy: "8.4" });
  const [ballLog, setBallLog] = useState(BALLS);
  const [commentary, setCommentary] = useState([
    "14.2 — Sharma hits a MASSIVE SIX over mid-wicket! 🚀",
    "14.1 — Full toss driven straight! Boundary four! 🏏",
    "13.6 — Dot ball, good yorker by Singh.",
    "13.5 — WOW! Caught at mid-off, Yadav is OUT! 💥",
    "13.4 — Single taken to deep square leg.",
  ]);

  const addBall = (outcome: string) => {
    setBallLog(b => [...b, outcome]);
    const runs = outcome === "4" ? 4 : outcome === "6" ? 6 : outcome === "W" || outcome === "." ? 0 : parseInt(outcome) || 0;
    setScore(s => {
      const newBalls = s.balls + 1;
      const newOvers = newBalls === 6 ? s.overs + 1 : s.overs;
      return {
        runs: s.runs + runs,
        wickets: outcome === "W" ? s.wickets + 1 : s.wickets,
        overs: newOvers,
        balls: newBalls === 6 ? 0 : newBalls,
      };
    });
    if (runs > 0) setStriker(s => ({ ...s, runs: s.runs + runs, balls: s.balls + 1, fours: outcome === "4" ? s.fours + 1 : s.fours, sixes: outcome === "6" ? s.sixes + 1 : s.sixes }));
    const msg = outcome === "W" ? `${score.overs}.${score.balls + 1} — WICKET! Player dismissed! 💥` : outcome === "6" ? `${score.overs}.${score.balls + 1} — SIX! Over the boundary! 🚀` : outcome === "4" ? `${score.overs}.${score.balls + 1} — FOUR! Boundary! 🏏` : outcome === "." ? `${score.overs}.${score.balls + 1} — Dot ball, good delivery.` : `${score.overs}.${score.balls + 1} — ${outcome} run(s) taken.`;
    setCommentary(c => [msg, ...c].slice(0, 8));
  };

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Match Header */}
      <div style={{ ...card, marginBottom: 16, borderColor: "#EF444440", background: "linear-gradient(135deg, #0D1526, #1A0808)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EF444420", padding: "4px 12px", borderRadius: 20, border: "1px solid #EF444430" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#EF4444" }}>LIVE</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#E2E8F0" }}>Ahmedabad Aces <span style={{ color: "#FF6B00" }}>vs</span> Gandhinagar Giants</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>📍 Alembic Ground, Vadodara &nbsp;·&nbsp; Match 19 of 64 &nbsp;·&nbsp; BCPL T20 Season 5</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#FF6B00" }}>{score.runs}/{score.wickets}</div>
            <div style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>{score.overs}.{score.balls} Overs</div>
          </div>
        </div>
        {/* Ball log */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
          {ballLog.slice(-12).map((b, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, background: b === "6" ? "#10B98130" : b === "4" ? "#3B82F630" : b === "W" ? "#EF444430" : "#1E293B", color: b === "6" ? "#10B981" : b === "4" ? "#3B82F6" : b === "W" ? "#EF4444" : "#94A3B8" }}>{b}</div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Batting */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Batting</div>
          {[striker, nonStriker].map((bat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: i === 0 ? "1px solid #0F172A" : "none" }}>
              {i === 0 && <span style={{ fontSize: 10, color: "#FF6B00", marginRight: 8, fontWeight: 800 }}>*</span>}
              {i === 1 && <span style={{ fontSize: 10, color: "transparent", marginRight: 8 }}>*</span>}
              <span style={{ flex: 1, fontSize: 13, color: "#E2E8F0", fontWeight: i === 0 ? 700 : 500 }}>{bat.name}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: i === 0 ? "#FF6B00" : "#E2E8F0" }}>{bat.runs}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: 4 }}>({bat.balls})</span>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <span style={{ fontSize: 11, color: "#3B82F6" }}>4s: {bat.fours}</span>
                <span style={{ fontSize: 11, color: "#10B981" }}>6s: {bat.sixes}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bowling */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Bowling</div>
          <div style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
            <span style={{ flex: 1, fontSize: 13, color: "#E2E8F0", fontWeight: 700 }}>{bowler.name}</span>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#EF4444" }}>{bowler.wickets}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>WKTs</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#E2E8F0" }}>{bowler.runs}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>RUNS</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#F59E0B" }}>{bowler.overs}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>OVR</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#64748B" }}>{bowler.economy}</div>
                <div style={{ fontSize: 9, color: "#475569" }}>ECO</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Pad */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Scoring Pad</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "0", color: "#1E293B", textColor: "#94A3B8" },
              { label: "1", color: "#1E3A5F", textColor: "#3B82F6" },
              { label: "2", color: "#1E3A5F", textColor: "#3B82F6" },
              { label: "3", color: "#1E3A5F", textColor: "#3B82F6" },
              { label: "4", color: "#1E3A5F40", textColor: "#3B82F6" },
              { label: "6", color: "#10B98120", textColor: "#10B981" },
              { label: "W", color: "#EF444420", textColor: "#EF4444" },
              { label: ".", color: "#1E293B", textColor: "#64748B" },
              { label: "WD", color: "#F59E0B20", textColor: "#F59E0B" },
              { label: "NB", color: "#F59E0B20", textColor: "#F59E0B" },
              { label: "LB", color: "#8B5CF620", textColor: "#8B5CF6" },
              { label: "B", color: "#8B5CF620", textColor: "#8B5CF6" },
            ].map(btn => (
              <button key={btn.label} onClick={() => addBall(btn.label)} style={{ padding: "16px 8px", borderRadius: 10, border: `1px solid ${btn.textColor}30`, background: btn.color, color: btn.textColor, fontSize: 16, fontWeight: 900, cursor: "pointer", transition: "all 0.1s" }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Commentary */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Ball-by-Ball Commentary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {commentary.map((c, i) => (
              <div key={i} style={{ padding: "9px 12px", background: i === 0 ? "#FF6B0008" : "#080E1C", border: `1px solid ${i === 0 ? "#FF6B0030" : "#0F172A"}`, borderRadius: 8, fontSize: 12, color: i === 0 ? "#E2E8F0" : "#64748B", lineHeight: 1.4 }}>{c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
