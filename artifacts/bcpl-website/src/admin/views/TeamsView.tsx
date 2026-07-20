import { useState } from "react";

const TEAMS = [
  { id: 1, name: "Mumbai Mavericks",     city: "Mumbai",    captain: "Rohit K.", players: 15, maxPlayers: 20, color: "#3B9EFF", status: "Active" },
  { id: 2, name: "Delhi Dynamos",        city: "Delhi",     captain: "Vikas S.", players: 12, maxPlayers: 20, color: "#FF7A29", status: "Active" },
  { id: 3, name: "Chennai Challengers",  city: "Chennai",   captain: "Arjun R.", players: 18, maxPlayers: 20, color: "#22C55E", status: "Active" },
  { id: 4, name: "Bengaluru Blasters",   city: "Bengaluru", captain: "Kiran M.", players: 11, maxPlayers: 20, color: "#A855F7", status: "Active" },
  { id: 5, name: "Kolkata Knights",      city: "Kolkata",   captain: "Saurav D.",players: 9,  maxPlayers: 20, color: "#F59E0B", status: "Active" },
  { id: 6, name: "Hyderabad Heroes",     city: "Hyderabad", captain: "Raj P.",   players: 14, maxPlayers: 20, color: "#EF4444", status: "Active" },
  { id: 7, name: "Pune Panthers",        city: "Pune",      captain: "Nikhil T.",players: 7,  maxPlayers: 20, color: "#06B6D4", status: "Active" },
  { id: 8, name: "Ahmedabad Avengers",   city: "Ahmedabad", captain: "Hardik P.",players: 13, maxPlayers: 20, color: "#10B981", status: "Active" },
];

export default function TeamsView() {
  const [selected, setSelected] = useState<typeof TEAMS[0] | null>(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button style={{
          padding: "10px 20px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
          color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
          cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        }}>
          + Add Team
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {TEAMS.map(team => (
          <div
            key={team.id}
            onClick={() => setSelected(team)}
            style={{
              background: "#0D1B2E", borderRadius: 14,
              border: `1px solid ${team.color}44`,
              borderTop: `4px solid ${team.color}`,
              padding: 20, cursor: "pointer",
              transition: "transform .15s, box-shadow .15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 32px ${team.color}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#fff", fontSize: 15 }}>{team.name}</div>
                <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 2 }}>📍 {team.city}</div>
              </div>
              <span style={{
                background: `${team.color}22`, color: team.color,
                borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700,
              }}>
                {team.status}
              </span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#7A8EA8", fontSize: 12 }}>Players</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{team.players}/{team.maxPlayers}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 4, height: 6 }}>
                <div style={{
                  background: team.color, borderRadius: 4, height: 6,
                  width: `${(team.players / team.maxPlayers) * 100}%`,
                }} />
              </div>
            </div>
            <div style={{ marginTop: 12, color: "#7A8EA8", fontSize: 12 }}>
              Captain: <span style={{ color: "#E8F0FE", fontWeight: 700 }}>{team.captain}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "#0D1B2E", borderRadius: 16, padding: 32, width: 400,
              border: `2px solid ${selected.color}44`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 20, marginBottom: 20 }}>
              {selected.name}
            </div>
            {[
              ["City", selected.city],
              ["Captain", selected.captain],
              ["Players", `${selected.players} / ${selected.maxPlayers}`],
              ["Status", selected.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ color: "#7A8EA8" }}>{k}</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ flex: 1, padding: 10, background: "rgba(255,122,41,.15)", color: "#FF7A29", border: "1px solid #FF7A29", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                Edit
              </button>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: 10, background: "rgba(255,255,255,.06)", color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
