import { useState } from "react";

const matches = [
  { id: 1, team1: "Mumbai Mavericks", team2: "Delhi Dynamos", date: "Jul 22, 2025", time: "6:00 PM", venue: "Wankhede, Mumbai", status: "scheduled", t1Score: null, t2Score: null },
  { id: 2, team1: "Rajasthan Royals XI", team2: "Gujarat Giants", date: "Jul 20, 2025", time: "4:00 PM", venue: "SMS, Jaipur", status: "live", t1Score: "124/4 (16.2)", t2Score: null },
  { id: 3, team1: "Punjab Lions", team2: "UP Warriors", date: "Jul 19, 2025", time: "6:00 PM", venue: "PCA, Mohali", status: "completed", t1Score: "187/6 (20)", t2Score: "143/9 (20)", winner: "Punjab Lions" },
  { id: 4, team1: "Karnataka Kings", team2: "Maharashtra Masters", date: "Jul 18, 2025", time: "4:00 PM", venue: "Chinnaswamy, Bangalore", status: "completed", t1Score: "156/7 (20)", t2Score: "160/4 (18.3)", winner: "Maharashtra Masters" },
];

const teams = ["Mumbai Mavericks", "Delhi Dynamos", "Rajasthan Royals XI", "Gujarat Giants", "Punjab Lions", "UP Warriors", "Karnataka Kings", "Maharashtra Masters"];
const venues = ["Wankhede, Mumbai", "Feroz Shah Kotla, Delhi", "SMS, Jaipur", "Motera, Ahmedabad", "PCA, Mohali", "Ekana, Lucknow", "Chinnaswamy, Bangalore", "MCA, Pune"];

export default function MatchesView() {
  const [filter, setFilter] = useState<"all" | "live" | "scheduled" | "completed">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ team1: teams[0], team2: teams[1], date: "", time: "18:00", venue: venues[0] });

  const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const statusColor = (s: string) =>
    s === "live" ? "#EF4444" : s === "scheduled" ? "#3B82F6" : "#10B981";
  const statusBg = (s: string) =>
    s === "live" ? "#EF444422" : s === "scheduled" ? "#3B82F622" : "#10B98122";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Match Management</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Schedule, manage and track all BCPL matches</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          🏏 + Add Match
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Matches", value: matches.length, color: "#6366F1", icon: "🏏" },
          { label: "Live Now", value: matches.filter(m => m.status === "live").length, color: "#EF4444", icon: "🔴" },
          { label: "Scheduled", value: matches.filter(m => m.status === "scheduled").length, color: "#3B82F6", icon: "📅" },
          { label: "Completed", value: matches.filter(m => m.status === "completed").length, color: "#10B981", icon: "✅" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderLeft: `3px solid ${s.color}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "live", "scheduled", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 18px", borderRadius: 8, border: "1px solid",
            borderColor: filter === f ? statusColor(f === "all" ? "scheduled" : f) : "#1E293B",
            background: filter === f ? statusBg(f === "all" ? "scheduled" : f) : "transparent",
            color: filter === f ? statusColor(f === "all" ? "scheduled" : f) : "#64748B",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>
            {f === "live" && "🔴 "}{f === "all" ? "All Matches" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "live" && matches.filter(m => m.status === "live").length > 0 && (
              <span style={{ marginLeft: 6, background: "#EF4444", borderRadius: 20, padding: "1px 7px", fontSize: 10, color: "#fff" }}>
                {matches.filter(m => m.status === "live").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ ...card, position: "relative", overflow: "hidden" }}>
            {m.status === "live" && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #EF4444, #FF6B00, #EF4444)", backgroundSize: "200% 100%", animation: "slide 2s linear infinite" }} />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏏</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{m.team1}</div>
                {m.t1Score && <div style={{ fontSize: 18, fontWeight: 800, color: m.winner === m.team1 ? "#10B981" : "#F1F5F9" }}>{m.t1Score}</div>}
              </div>
              <div style={{ textAlign: "center", padding: "0 20px" }}>
                <span style={{ display: "block", padding: "4px 14px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: statusBg(m.status), color: statusColor(m.status), marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {m.status === "live" && "● "}
                  {m.status === "live" ? "LIVE" : m.status}
                </span>
                <div style={{ fontSize: 22, color: "#334155", fontWeight: 800 }}>VS</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 8 }}>{m.date}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{m.time}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>📍 {m.venue}</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏏</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{m.team2}</div>
                {m.t2Score && <div style={{ fontSize: 18, fontWeight: 800, color: m.winner === m.team2 ? "#10B981" : "#F1F5F9" }}>{m.t2Score}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 12 }}>
                {m.status === "live" && (
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#EF444422", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🔴 Score Now</button>
                )}
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>Edit</button>
                {m.status === "scheduled" && (
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#EF444415", color: "#EF4444", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                )}
              </div>
            </div>
            {m.winner && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #0F1B2D", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>🏆 Winner: {m.winner}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Match Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 460 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 20 }}>🏏 Schedule New Match</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Team 1", key: "team1", type: "select", opts: teams },
                { label: "Team 2", key: "team2", type: "select", opts: teams },
                { label: "Match Date", key: "date", type: "date" },
                { label: "Time", key: "time", type: "time" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                      {f.opts!.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Venue</label>
              <select value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                {venues.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Schedule Match</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
