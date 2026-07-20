import { useState } from "react";

const TEAMS = [
  { id: "T01", name: "Baroda Bulls", city: "Vadodara", captain: "Arjun Sharma", coach: "Rajiv Mehta", players: 15, color: "#EF4444", logo: "🐂", wins: 4, loss: 1, nrr: "+1.24" },
  { id: "T02", name: "Mumbai Mavericks", city: "Mumbai", captain: "Virat Singh", coach: "Sunil Joshi", players: 14, color: "#3B82F6", logo: "🌊", wins: 3, loss: 2, nrr: "+0.87" },
  { id: "T03", name: "Pune Panthers", city: "Pune", captain: "Rahul Patel", coach: "Anil Sharma", players: 15, color: "#F59E0B", logo: "🐆", wins: 3, loss: 2, nrr: "+0.45" },
  { id: "T04", name: "Delhi Dynamos", city: "Delhi", captain: "Kapil Dev Jr.", coach: "Ravi Kumar", players: 15, color: "#8B5CF6", logo: "⚡", wins: 3, loss: 2, nrr: "+0.12" },
  { id: "T05", name: "Ahmedabad Aces", city: "Ahmedabad", captain: "Yusuf Khan", coach: "Dilip Shah", players: 14, color: "#10B981", logo: "🃏", wins: 2, loss: 3, nrr: "-0.18" },
  { id: "T06", name: "Surat Strikers", city: "Surat", captain: "Pradeep Rao", coach: "Nitin Patel", players: 13, color: "#FF6B00", logo: "🎯", wins: 2, loss: 3, nrr: "-0.42" },
  { id: "T07", name: "Rajkot Royals", city: "Rajkot", captain: "Sandeep More", coach: "Vijay Singh", players: 14, color: "#06B6D4", logo: "👑", wins: 1, loss: 4, nrr: "-0.96" },
  { id: "T08", name: "Gandhinagar Giants", city: "Gandhinagar", captain: "Manoj Tiwari", coach: "Prakash Jha", players: 12, color: "#EC4899", logo: "🏔", wins: 1, loss: 4, nrr: "-1.12" },
];

export default function TeamsView() {
  const [selected, setSelected] = useState<string | null>(null);
  const selTeam = TEAMS.find(t => t.id === selected);
  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Teams", value: "8 / 16", color: "#3B82F6", icon: "👕" },
          { label: "Total Players", value: "112", color: "#10B981", icon: "👥" },
          { label: "Slots Remaining", value: "8 teams", color: "#F59E0B", icon: "🔓" },
          { label: "Auction Done", value: "8 teams", color: "#8B5CF6", icon: "🔨" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 16 }}>
        {/* Team Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {TEAMS.map(team => (
            <div key={team.id} onClick={() => setSelected(selected === team.id ? null : team.id)} style={{ ...card, cursor: "pointer", borderColor: selected === team.id ? team.color : "#1E293B", borderLeft: `3px solid ${team.color}`, transition: "border-color 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${team.color}20`, border: `2px solid ${team.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{team.logo}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{team.name}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{team.city}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", color: "#334155" }}>{team.id}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Wins", value: team.wins, color: "#10B981" },
                  { label: "Loss", value: team.loss, color: "#EF4444" },
                  { label: "NRR", value: team.nrr, color: Number(team.nrr) >= 0 ? "#10B981" : "#EF4444" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#080E1C", borderRadius: 8, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>👤 {team.captain} &nbsp;·&nbsp; 👥 {team.players} players</div>
            </div>
          ))}
        </div>

        {/* Team Detail */}
        {selTeam && (
          <div style={{ ...card, height: "fit-content", borderColor: selTeam.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>Team Details</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `${selTeam.color}20`, border: `2px solid ${selTeam.color}60`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{selTeam.logo}</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 900, color: "#E2E8F0" }}>{selTeam.name}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{selTeam.city}</div>
            </div>
            {[
              ["Captain", selTeam.captain],
              ["Coach", selTeam.coach],
              ["Players", `${selTeam.players} registered`],
              ["Wins / Loss", `${selTeam.wins} / ${selTeam.loss}`],
              ["NRR", selTeam.nrr],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #0F172A", fontSize: 12 }}>
                <span style={{ color: "#475569" }}>{k}</span>
                <span style={{ color: "#CBD5E1", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#3B82F620", color: "#3B82F6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Roster</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit Team</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
