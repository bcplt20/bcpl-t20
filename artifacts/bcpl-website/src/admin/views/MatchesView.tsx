import { useState } from "react";

const MATCHES = [
  { id: "M001", team1: "Mumbai Mavericks", team2: "Pune Panthers", venue: "Alembic Ground, Vadodara", date: "22 Jul 2025", time: "07:00 PM", status: "scheduled", result: "" },
  { id: "M002", team1: "Delhi Dynamos", team2: "Baroda Bulls", venue: "Polo Ground, Vadodara", date: "23 Jul 2025", time: "03:00 PM", status: "scheduled", result: "" },
  { id: "M003", team1: "Rajkot Royals", team2: "Surat Strikers", venue: "Alembic Ground, Vadodara", date: "23 Jul 2025", time: "07:00 PM", status: "scheduled", result: "" },
  { id: "M004", team1: "Ahmedabad Aces", team2: "Gandhinagar Giants", venue: "Polo Ground, Vadodara", date: "20 Jul 2025", time: "07:00 PM", status: "live", result: "ACA 124/4 (14 ov) vs GGA" },
  { id: "M005", team1: "Baroda Bulls", team2: "Mumbai Mavericks", venue: "Alembic Ground, Vadodara", date: "19 Jul 2025", time: "07:00 PM", status: "completed", result: "BB 156/7 beat MM 143/9 by 13 runs" },
  { id: "M006", team1: "Pune Panthers", team2: "Delhi Dynamos", venue: "Polo Ground, Vadodara", date: "18 Jul 2025", time: "03:00 PM", status: "completed", result: "PP 178/5 beat DD 165/8 by 13 runs" },
];

const STATUS_C: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#3B82F620", color: "#3B82F6", label: "Scheduled" },
  live: { bg: "#EF444420", color: "#EF4444", label: "🔴 Live" },
  completed: { bg: "#10B98120", color: "#10B981", label: "Completed" },
};

export default function MatchesView() {
  const [tab, setTab] = useState<"all" | "scheduled" | "live" | "completed">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ team1: "", team2: "", venue: "", date: "", time: "07:00 PM" });

  const filtered = tab === "all" ? MATCHES : MATCHES.filter(m => m.status === tab);
  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Matches", value: "64", color: "#3B82F6", icon: "🏏" },
          { label: "Completed", value: "18", color: "#10B981", icon: "✅" },
          { label: "Upcoming", value: "45", color: "#F59E0B", icon: "📅" },
          { label: "Live Now", value: "1", color: "#EF4444", icon: "🔴" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center" }}>
        {(["all", "live", "scheduled", "completed"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 10, border: tab === t ? "none" : "1px solid #1E293B", background: tab === t ? "#FF6B00" : "transparent", color: tab === t ? "#fff" : "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
        ))}
        <button onClick={() => setShowAdd(s => !s)} style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Match</button>
      </div>

      {/* Add Match Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 16, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FF6B00", marginBottom: 16 }}>Add New Match</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { key: "team1", label: "TEAM 1", placeholder: "e.g. Mumbai Mavericks" },
              { key: "team2", label: "TEAM 2", placeholder: "e.g. Pune Panthers" },
              { key: "venue", label: "VENUE", placeholder: "e.g. Alembic Ground" },
              { key: "date", label: "DATE", placeholder: "e.g. 25 Jul 2025" },
              { key: "time", label: "TIME", placeholder: "07:00 PM" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{f.label}</label>
                <input value={(addForm as any)[f.key]} onChange={e => setAddForm(fm => ({ ...fm, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Match</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Matches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ ...card, borderLeft: `3px solid ${STATUS_C[m.status].color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#334155", background: "#0F172A", padding: "4px 8px", borderRadius: 6 }}>{m.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{m.team1}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#FF6B00", background: "#FF6B0015", padding: "3px 10px", borderRadius: 8 }}>VS</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{m.team2}</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>📍 {m.venue} &nbsp;·&nbsp; 📅 {m.date} &nbsp;·&nbsp; ⏰ {m.time}</div>
                {m.result && <div style={{ marginTop: 5, fontSize: 12, color: "#10B981", fontWeight: 600 }}>🏆 {m.result}</div>}
              </div>
              <span style={{ background: STATUS_C[m.status].bg, color: STATUS_C[m.status].color, padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>{STATUS_C[m.status].label}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                {m.status === "live" && <button style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#EF444420", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Score</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
