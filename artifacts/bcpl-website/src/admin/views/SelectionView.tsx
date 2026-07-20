import { useState } from "react";

type Decision = "All" | "Pending" | "Selected" | "Rejected";

const PLAYERS = [
  { id: 1, name: "Rahul Sharma",  city: "Mumbai",    role: "Batsman",      score: 87, videoUrl: "#", decision: "Selected" as Decision },
  { id: 2, name: "Priya Patel",   city: "Ahmedabad", role: "All-rounder",  score: 74, videoUrl: "#", decision: "Pending"  as Decision },
  { id: 3, name: "Amit Singh",    city: "Delhi",     role: "Bowler",       score: 91, videoUrl: "#", decision: "Selected" as Decision },
  { id: 4, name: "Sneha Reddy",   city: "Hyderabad", role: "WK-Batsman",   score: 62, videoUrl: "#", decision: "Rejected" as Decision },
  { id: 5, name: "Karan Mehta",   city: "Pune",      role: "Batsman",      score: 55, videoUrl: "#", decision: "Pending"  as Decision },
  { id: 6, name: "Pooja Nair",    city: "Chennai",   role: "Bowler",       score: 79, videoUrl: "#", decision: "Pending"  as Decision },
  { id: 7, name: "Rohan Gupta",   city: "Kolkata",   role: "All-rounder",  score: 83, videoUrl: "#", decision: "Selected" as Decision },
  { id: 8, name: "Ananya Das",    city: "Bengaluru", role: "Batsman",      score: 48, videoUrl: "#", decision: "Rejected" as Decision },
];

const DEC_COLOR: Record<Decision, string> = {
  All:      "#7A8EA8",
  Pending:  "#F59E0B",
  Selected: "#22C55E",
  Rejected: "#EF4444",
};

export default function SelectionView() {
  const [filter, setFilter] = useState<Decision>("All");
  const [players, setPlayers] = useState(PLAYERS);

  const filtered = filter === "All" ? players : players.filter(p => p.decision === filter);

  const update = (id: number, decision: Decision) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, decision } : p));
  };

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {(["All","Pending","Selected","Rejected"] as Decision[]).map(d => {
          const count = d === "All" ? players.length : players.filter(p => p.decision === d).length;
          return (
            <button
              key={d}
              onClick={() => setFilter(d)}
              style={{
                padding: "8px 16px",
                background: filter === d ? DEC_COLOR[d] : "#0D1B2E",
                color: filter === d ? "#fff" : "#7A8EA8",
                border: `1px solid ${filter === d ? DEC_COLOR[d] : "rgba(255,255,255,.12)"}`,
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(p => (
          <div key={p.id} style={{
            background: "#0D1B2E", borderRadius: 12,
            border: "1px solid rgba(255,255,255,.07)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            {/* Avatar */}
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `${DEC_COLOR[p.decision]}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: DEC_COLOR[p.decision], flexShrink: 0,
            }}>
              {p.name[0]}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>{p.name}</div>
              <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 2 }}>{p.city} · {p.role}</div>
            </div>

            {/* Score */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ color: "#7A8EA8", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>Score</div>
              <div style={{
                color: p.score >= 80 ? "#22C55E" : p.score >= 65 ? "#F59E0B" : "#EF4444",
                fontWeight: 900, fontSize: 22,
              }}>
                {p.score}
              </div>
            </div>

            {/* Video */}
            <a
              href={p.videoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "7px 14px", background: "rgba(168,85,247,.15)",
                color: "#A855F7", border: "1px solid #A855F7",
                borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0,
              }}
            >
              ▶ Watch Video
            </a>

            {/* Decision buttons */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => update(p.id, "Selected")}
                style={{
                  padding: "7px 14px",
                  background: p.decision === "Selected" ? "#22C55E" : "#22C55E22",
                  color: p.decision === "Selected" ? "#fff" : "#22C55E",
                  border: "1px solid #22C55E",
                  borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}
              >
                ✓ Select
              </button>
              <button
                onClick={() => update(p.id, "Rejected")}
                style={{
                  padding: "7px 14px",
                  background: p.decision === "Rejected" ? "#EF4444" : "#EF444422",
                  color: p.decision === "Rejected" ? "#fff" : "#EF4444",
                  border: "1px solid #EF4444",
                  borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
