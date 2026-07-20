import { useState } from "react";

const PLAYERS = [
  { id: "BCPL001", name: "Arjun Sharma", role: "Batsman", city: "Mumbai", video: "uploaded", kyc: "verified", score: 94, status: "selected" },
  { id: "BCPL002", name: "Rahul Patel", role: "Bowler", city: "Ahmedabad", video: "uploaded", kyc: "verified", score: 91, status: "selected" },
  { id: "BCPL003", name: "Vikas Singh", role: "All-Rounder", city: "Delhi", video: "uploaded", kyc: "pending", score: 87, status: "shortlisted" },
  { id: "BCPL004", name: "Priya Nair", role: "WK-Batsman", city: "Kochi", video: "uploaded", kyc: "verified", score: 85, status: "shortlisted" },
  { id: "BCPL005", name: "Mohit Yadav", role: "Bowler", city: "Lucknow", video: "uploaded", kyc: "rejected", score: 72, status: "rejected" },
  { id: "BCPL006", name: "Suresh Kumar", role: "Batsman", city: "Chennai", video: "pending", kyc: "pending", score: 0, status: "pending" },
  { id: "BCPL007", name: "Deepak Verma", role: "All-Rounder", city: "Pune", video: "uploaded", kyc: "verified", score: 88, status: "shortlisted" },
  { id: "BCPL008", name: "Ankita Joshi", role: "WK-Batsman", city: "Bangalore", video: "uploaded", kyc: "verified", score: 90, status: "selected" },
  { id: "BCPL009", name: "Kartik Mehra", role: "Batsman", city: "Hyderabad", video: "uploaded", kyc: "pending", score: 76, status: "pending" },
  { id: "BCPL010", name: "Neha Gupta", role: "Bowler", city: "Jaipur", video: "uploaded", kyc: "verified", score: 89, status: "selected" },
];

const STATUS_C: Record<string, { bg: string; color: string }> = {
  selected: { bg: "#10B98120", color: "#10B981" },
  shortlisted: { bg: "#3B82F620", color: "#3B82F6" },
  rejected: { bg: "#EF444420", color: "#EF4444" },
  pending: { bg: "#F59E0B20", color: "#F59E0B" },
};

export default function SelectionView() {
  const [filter, setFilter] = useState("all");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(PLAYERS.map(p => [p.id, p.status]))
  );

  const filtered = filter === "all" ? PLAYERS : PLAYERS.filter(p => statuses[p.id] === filter);
  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  const counts = {
    selected: PLAYERS.filter(p => statuses[p.id] === "selected").length,
    shortlisted: PLAYERS.filter(p => statuses[p.id] === "shortlisted").length,
    rejected: PLAYERS.filter(p => statuses[p.id] === "rejected").length,
    pending: PLAYERS.filter(p => statuses[p.id] === "pending").length,
  };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Applicants", value: PLAYERS.length, color: "#3B82F6", icon: "👥" },
          { label: "Selected", value: counts.selected, color: "#10B981", icon: "✅" },
          { label: "Shortlisted", value: counts.shortlisted, color: "#3B82F6", icon: "📋" },
          { label: "Rejected", value: counts.rejected, color: "#EF4444", icon: "❌" },
          { label: "Pending Review", value: counts.pending, color: "#F59E0B", icon: "⏳" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center" }}>
        {["all", "selected", "shortlisted", "pending", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 8, border: filter === f ? "none" : "1px solid #1E293B", background: filter === f ? "#FF6B00" : "transparent", color: filter === f ? "#fff" : "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#10B98120", color: "#10B981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✉ Notify Selected</button>
          <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#3B82F620", color: "#3B82F6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⬇ Export List</button>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E293B" }}>
              {["ID", "Player", "Role", "City", "Video", "KYC", "Score", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #0F172A" }}>
                <td style={{ padding: "11px 12px", color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{p.id}</td>
                <td style={{ padding: "11px 12px", color: "#E2E8F0", fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "11px 12px", color: "#94A3B8" }}>{p.role}</td>
                <td style={{ padding: "11px 12px", color: "#64748B" }}>{p.city}</td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ background: p.video === "uploaded" ? "#10B98120" : "#F59E0B20", color: p.video === "uploaded" ? "#10B981" : "#F59E0B", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                    {p.video === "uploaded" ? "✓ Done" : "⏳ Pending"}
                  </span>
                </td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ background: p.kyc === "verified" ? "#10B98120" : p.kyc === "rejected" ? "#EF444420" : "#F59E0B20", color: p.kyc === "verified" ? "#10B981" : p.kyc === "rejected" ? "#EF4444" : "#F59E0B", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>
                    {p.kyc}
                  </span>
                </td>
                <td style={{ padding: "11px 12px" }}>
                  {p.score > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 5, background: "#1E293B", borderRadius: 3 }}>
                        <div style={{ width: `${p.score}%`, height: "100%", background: p.score >= 90 ? "#10B981" : p.score >= 75 ? "#F59E0B" : "#EF4444", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#E2E8F0", fontWeight: 700 }}>{p.score}</span>
                    </div>
                  ) : <span style={{ color: "#334155" }}>—</span>}
                </td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ background: STATUS_C[statuses[p.id]].bg, color: STATUS_C[statuses[p.id]].color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{statuses[p.id]}</span>
                </td>
                <td style={{ padding: "11px 12px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setStatuses(s => ({ ...s, [p.id]: "selected" }))} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#10B98115", color: "#10B981", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✓</button>
                    <button onClick={() => setStatuses(s => ({ ...s, [p.id]: "rejected" }))} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#EF444415", color: "#EF4444", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>✗</button>
                    <button style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#3B82F615", color: "#3B82F6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>▶</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
