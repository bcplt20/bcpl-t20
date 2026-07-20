import { useState } from "react";

const MATCH = {
  id: 3,
  team1: "Kolkata Knights",
  team2: "Hyderabad Heroes",
  venue: "Eden Gardens, Kolkata",
  overs: 20,
};

type Ball = "0" | "1" | "2" | "3" | "4" | "6" | "W" | "Wd" | "Nb";

export default function LiveScoringView() {
  const [batting, setBatting] = useState(MATCH.team1);
  const [runs, setRuns]       = useState(124);
  const [wickets, setWickets] = useState(3);
  const [balls, setBalls]     = useState(97); // 16.1 overs
  const [log, setLog]         = useState<Array<{ ball: Ball; over: string; timestamp: string }>>([]);

  const currentOver = Math.floor(balls / 6);
  const currentBall = balls % 6;
  const overStr     = `${currentOver}.${currentBall}`;

  const addBall = (type: Ball) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [{ ball: type, over: overStr, timestamp: now }, ...prev.slice(0, 29)]);

    if (type === "W") { setWickets(w => Math.min(10, w + 1)); setBalls(b => b + 1); }
    else if (type === "Wd" || type === "Nb") { setRuns(r => r + 1); }
    else { setRuns(r => r + Number(type)); setBalls(b => b + 1); }
  };

  const BALL_COLORS: Record<Ball, string> = {
    "0": "#7A8EA8", "1": "#E8F0FE", "2": "#3B9EFF",
    "3": "#A855F7", "4": "#22C55E", "6": "#FF7A29",
    "W": "#EF4444", "Wd": "#F59E0B", "Nb": "#F59E0B",
  };

  return (
    <div>
      {/* Match header */}
      <div style={{
        background: "#0D1B2E", borderRadius: 14,
        border: "1px solid rgba(255,255,255,.07)",
        padding: "24px 28px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, letterSpacing: ".1em" }}>🔴 LIVE</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginTop: 4 }}>
              {MATCH.team1} vs {MATCH.team2}
            </div>
            <div style={{ color: "#7A8EA8", fontSize: 13, marginTop: 4 }}>📍 {MATCH.venue}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#7A8EA8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
              {batting} batting
            </div>
            <div style={{ color: "#FF7A29", fontWeight: 900, fontSize: 40, lineHeight: 1.1 }}>
              {runs}/{wickets}
            </div>
            <div style={{ color: "#7A8EA8", fontSize: 18, fontWeight: 700 }}>
              {overStr} overs
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Scoring pad */}
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", marginBottom: 16 }}>Scoring Pad</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {(["0","1","2","3","4","6","W","Wd","Nb"] as Ball[]).map(b => (
              <button
                key={b}
                onClick={() => addBall(b)}
                style={{
                  padding: "16px", borderRadius: 10,
                  background: `${BALL_COLORS[b]}22`,
                  color: BALL_COLORS[b],
                  border: `2px solid ${BALL_COLORS[b]}`,
                  cursor: "pointer", fontWeight: 900, fontSize: 18,
                  fontFamily: "'Montserrat', sans-serif",
                  transition: "all .1s",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(.95)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                {b}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setRuns(r => Math.max(0, r - 1));
                setLog(prev => prev.slice(1));
              }}
              style={{
                flex: 1, padding: 10, background: "rgba(255,68,68,.12)",
                color: "#EF4444", border: "1px solid #EF4444",
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}
            >
              ↩ Undo
            </button>
            <button
              onClick={() => setBatting(t => t === MATCH.team1 ? MATCH.team2 : MATCH.team1)}
              style={{
                flex: 1, padding: 10, background: "rgba(59,158,255,.12)",
                color: "#3B9EFF", border: "1px solid #3B9EFF",
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}
            >
              🔄 Switch Innings
            </button>
          </div>
        </div>

        {/* Ball log */}
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", marginBottom: 16 }}>Ball-by-Ball Log</div>
          {log.length === 0 && (
            <div style={{ color: "#7A8EA8", textAlign: "center", padding: "40px 0" }}>
              Press buttons on the scoring pad to log balls.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(255,255,255,.03)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `${BALL_COLORS[entry.ball]}22`,
                  color: BALL_COLORS[entry.ball],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 13, flexShrink: 0,
                }}>
                  {entry.ball}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: "#7A8EA8", fontSize: 12 }}>Over {entry.over}</span>
                </div>
                <div style={{ color: "#7A8EA8", fontSize: 11 }}>{entry.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
