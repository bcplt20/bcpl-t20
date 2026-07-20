import { useState } from "react";

type Tab = "Upcoming" | "Live" | "Completed";

const MATCHES = [
  { id: 1, team1: "Mumbai Mavericks",    team2: "Delhi Dynamos",       date: "25 Jul 2025", time: "7:00 PM", venue: "Wankhede Stadium, Mumbai",   status: "Upcoming", score1: "",        score2: "" },
  { id: 2, team1: "Chennai Challengers", team2: "Bengaluru Blasters",  date: "26 Jul 2025", time: "7:00 PM", venue: "MA Chidambaram, Chennai",    status: "Upcoming", score1: "",        score2: "" },
  { id: 3, team1: "Kolkata Knights",     team2: "Hyderabad Heroes",    date: "20 Jul 2025", time: "7:00 PM", venue: "Eden Gardens, Kolkata",      status: "Live",     score1: "124/3",   score2: "87/6" },
  { id: 4, team1: "Pune Panthers",       team2: "Ahmedabad Avengers",  date: "18 Jul 2025", time: "7:00 PM", venue: "MCA Stadium, Pune",          status: "Completed",score1: "168/5",  score2: "154/8" },
  { id: 5, team1: "Mumbai Mavericks",    team2: "Chennai Challengers", date: "15 Jul 2025", time: "7:00 PM", venue: "Wankhede Stadium, Mumbai",   status: "Completed",score1: "142/7",  score2: "145/4" },
];

const STATUS_COLOR: Record<Tab, string> = {
  Upcoming:  "#3B9EFF",
  Live:      "#EF4444",
  Completed: "#22C55E",
};

export default function MatchesView() {
  const [tab, setTab] = useState<Tab>("Upcoming");

  const filtered = MATCHES.filter(m => m.status === tab);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["Upcoming","Live","Completed"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px",
                background: tab === t ? STATUS_COLOR[t] : "#0D1B2E",
                color: tab === t ? "#fff" : "#7A8EA8",
                border: `1px solid ${tab === t ? STATUS_COLOR[t] : "rgba(255,255,255,.12)"}`,
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              {t === "Live" ? "🔴 Live" : t}
            </button>
          ))}
        </div>
        <button style={{
          padding: "10px 20px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
          color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
          cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        }}>
          + Schedule Match
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#7A8EA8", padding: "60px 0", fontSize: 15 }}>
            No {tab.toLowerCase()} matches
          </div>
        )}
        {filtered.map(m => (
          <div key={m.id} style={{
            background: "#0D1B2E", borderRadius: 14,
            border: "1px solid rgba(255,255,255,.07)",
            padding: "20px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Status badge */}
              <span style={{
                background: `${STATUS_COLOR[m.status as Tab]}22`,
                color: STATUS_COLOR[m.status as Tab],
                borderRadius: 6, padding: "3px 10px",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {m.status === "Live" ? "🔴 LIVE" : m.status.toUpperCase()}
              </span>

              {/* Teams */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right", flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{m.team1}</div>
                  {m.score1 && <div style={{ color: "#FF7A29", fontWeight: 700, fontSize: 20 }}>{m.score1}</div>}
                </div>
                <div style={{ color: "#7A8EA8", fontWeight: 900, fontSize: 13 }}>VS</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{m.team2}</div>
                  {m.score2 && <div style={{ color: "#3B9EFF", fontWeight: 700, fontSize: 20 }}>{m.score2}</div>}
                </div>
              </div>

              {/* Meta */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{m.date}</div>
                <div style={{ color: "#7A8EA8", fontSize: 12 }}>{m.time}</div>
                <div style={{ color: "#7A8EA8", fontSize: 11, marginTop: 2 }}>📍 {m.venue}</div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {m.status === "Live" && (
                  <button style={{
                    padding: "7px 14px", background: "#EF444422",
                    color: "#EF4444", border: "1px solid #EF4444",
                    borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  }}>Score</button>
                )}
                <button style={{
                  padding: "7px 14px", background: "rgba(255,255,255,.06)",
                  color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
