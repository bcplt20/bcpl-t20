import { useState } from "react";

type Player = { name: string; role: string; age: number; state: string; phase: 1 | 2; selected: boolean };
type Team = { id: number; name: string; city: string; color: string; wins: number; losses: number; nrr: string; captain: string; players: Player[] };

const initialTeams: Team[] = [
  {
    id: 1, name: "Mumbai Mavericks", city: "Mumbai", color: "#0066FF", wins: 8, losses: 2, nrr: "+1.24", captain: "Rahul Kumar",
    players: [
      { name: "Rahul Kumar", role: "Batsman", age: 24, state: "Maharashtra", phase: 2, selected: true },
      { name: "Amit Patil", role: "Bowler", age: 22, state: "Maharashtra", phase: 2, selected: true },
      { name: "Deepak Shah", role: "All-rounder", age: 26, state: "Gujarat", phase: 1, selected: false },
    ],
  },
  {
    id: 2, name: "Rajasthan Royals XI", city: "Jaipur", color: "#FF6B00", wins: 7, losses: 3, nrr: "+0.87", captain: "Arjun Sharma",
    players: [
      { name: "Arjun Sharma", role: "Batsman", age: 23, state: "Rajasthan", phase: 2, selected: true },
      { name: "Suresh Meena", role: "Wicket-keeper", age: 25, state: "Rajasthan", phase: 2, selected: true },
    ],
  },
  {
    id: 3, name: "Delhi Dynamos", city: "New Delhi", color: "#8B5CF6", wins: 6, losses: 4, nrr: "+0.43", captain: "Deepak Gupta",
    players: [
      { name: "Deepak Gupta", role: "All-rounder", age: 27, state: "Delhi", phase: 2, selected: true },
    ],
  },
  {
    id: 4, name: "Gujarat Giants", city: "Ahmedabad", color: "#10B981", wins: 5, losses: 5, nrr: "-0.12", captain: "Vikas Patel",
    players: [
      { name: "Vikas Patel", role: "Bowler", age: 21, state: "Gujarat", phase: 2, selected: true },
    ],
  },
];

export default function TeamsView() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", city: "", color: "#FF6B00" });
  const [newPlayer, setNewPlayer] = useState({ name: "", role: "Batsman", age: "", state: "" });

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const roleColor = (r: string) =>
    r === "Batsman" ? "#3B82F6" : r === "Bowler" ? "#EF4444" : r === "All-rounder" ? "#FF6B00" : "#10B981";

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* Teams List */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Teams & Squads</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{teams.length} teams registered in BCPL Season 5</div>
          </div>
          <button onClick={() => setShowAddTeam(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Add Team
          </button>
        </div>

        {/* Standings */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>Points Table</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["#", "Team", "W", "L", "NRR", "Points", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: h === "Team" ? "left" : "center", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...teams].sort((a, b) => b.wins - a.wins).map((t, i) => (
                <tr key={t.id} onClick={() => setSelectedTeam(t)} style={{ borderBottom: "1px solid #0F1B2D", cursor: "pointer", background: selectedTeam?.id === t.id ? "#FF6B0010" : "transparent" }}>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : "#94A3B8" }}>{i + 1}</span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: t.color, opacity: 0.9, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{t.name}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{t.city}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "center", fontSize: 14, fontWeight: 800, color: "#10B981" }}>{t.wins}</td>
                  <td style={{ padding: "12px 12px", textAlign: "center", fontSize: 14, color: "#EF4444", fontWeight: 600 }}>{t.losses}</td>
                  <td style={{ padding: "12px 12px", textAlign: "center", fontSize: 12, color: parseFloat(t.nrr) >= 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>{t.nrr}</td>
                  <td style={{ padding: "12px 12px", textAlign: "center", fontSize: 16, fontWeight: 800, color: "#FF6B00" }}>{t.wins * 2}</td>
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>Squad ›</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Detail */}
      {selectedTeam && (
        <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card, borderTop: `3px solid ${selectedTeam.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: selectedTeam.color, opacity: 0.85 }} />
              <button onClick={() => setSelectedTeam(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginTop: 10 }}>{selectedTeam.name}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{selectedTeam.city} · Captain: {selectedTeam.captain}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
              {[{ label: "Wins", value: selectedTeam.wins, color: "#10B981" }, { label: "Losses", value: selectedTeam.losses, color: "#EF4444" }, { label: "NRR", value: selectedTeam.nrr, color: parseFloat(selectedTeam.nrr) >= 0 ? "#10B981" : "#EF4444" }].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px", background: "#060B18", borderRadius: 10, border: "1px solid #1E293B" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Squad ({selectedTeam.players.length})</div>
              <button onClick={() => setShowAddPlayer(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add Player</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedTeam.players.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#060B18", borderRadius: 10, border: "1px solid #1E293B" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `hsl(${i * 60 + 200}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{p.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: roleColor(p.role) + "22", color: roleColor(p.role), fontWeight: 700 }}>{p.role}</span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{p.state} · {p.age}y</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: p.phase === 2 ? "#FF6B0022" : "#F59E0B22", color: p.phase === 2 ? "#FF6B00" : "#F59E0B", fontWeight: 700 }}>P{p.phase}</span>
                    {p.selected && <div style={{ fontSize: 10, color: "#10B981", marginTop: 4 }}>✓ Selected</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeam && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 20 }}>Add New Team</div>
            {[{ label: "Team Name", key: "name", placeholder: "e.g. Karnataka Kings" }, { label: "City", key: "city", placeholder: "e.g. Bangalore" }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={(newTeam as any)[f.key]} onChange={e => setNewTeam(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Team Color</label>
              <input type="color" value={newTeam.color} onChange={e => setNewTeam(p => ({ ...p, color: e.target.value }))}
                style={{ width: "100%", height: 44, background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, cursor: "pointer" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddTeam(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => {
                if (newTeam.name && newTeam.city) {
                  setTeams(prev => [...prev, { id: Date.now(), name: newTeam.name, city: newTeam.city, color: newTeam.color, wins: 0, losses: 0, nrr: "0.00", captain: "TBD", players: [] }]);
                  setShowAddTeam(false);
                  setNewTeam({ name: "", city: "", color: "#FF6B00" });
                }
              }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && selectedTeam && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Add Player</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>to {selectedTeam.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[{ label: "Player Name", key: "name", placeholder: "Full name" }, { label: "State", key: "state", placeholder: "e.g. Rajasthan" }, { label: "Age", key: "age", placeholder: "e.g. 23" }].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === "name" ? "1/-1" : "auto" }}>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={(newPlayer as any)[f.key]} onChange={e => setNewPlayer(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Role</label>
                <select value={newPlayer.role} onChange={e => setNewPlayer(p => ({ ...p, role: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                  {["Batsman", "Bowler", "All-rounder", "Wicket-keeper"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddPlayer(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => {
                if (newPlayer.name) {
                  setTeams(prev => prev.map(t => t.id === selectedTeam.id ? {
                    ...t, players: [...t.players, { name: newPlayer.name, role: newPlayer.role, age: parseInt(newPlayer.age) || 22, state: newPlayer.state, phase: 1, selected: false }]
                  } : t));
                  setSelectedTeam(prev => prev ? { ...prev, players: [...prev.players, { name: newPlayer.name, role: newPlayer.role, age: parseInt(newPlayer.age) || 22, state: newPlayer.state, phase: 1, selected: false }] } : null);
                  setShowAddPlayer(false);
                  setNewPlayer({ name: "", role: "Batsman", age: "", state: "" });
                }
              }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Player</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
