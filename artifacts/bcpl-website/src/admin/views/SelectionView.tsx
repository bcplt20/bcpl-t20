import { useState } from "react";

type Player = {
  id: number; name: string; phone: string; state: string; city: string;
  role: string; age: number; score: number; video: boolean;
  status: "pending" | "selected" | "rejected" | "watchlist";
  phase: 1 | 2;
};

// No players yet — will populate as Phase 1 videos are reviewed and scored
const players: Player[] = [];

const statusConfig = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#F59E0B22" },
  selected: { label: "Selected ✓", color: "#10B981", bg: "#10B98122" },
  rejected: { label: "Rejected", color: "#EF4444", bg: "#EF444422" },
  watchlist: { label: "Watchlist", color: "#6366F1", bg: "#6366F122" },
};

const roleColor = (r: string) =>
  r === "Batsman" ? "#3B82F6" : r === "Bowler" ? "#EF4444" : r === "All-rounder" ? "#FF6B00" : "#10B981";

export default function SelectionView() {
  const [phase, setPhase] = useState<1 | 2>(1);
  const [statusFilter, setStatusFilter] = useState<"all" | Player["status"]>("all");
  const [list, setList] = useState<Player[]>(players);
  const [videoPlayer, setVideoPlayer] = useState<Player | null>(null);

  const phaseList = list.filter(p => p.phase === phase);
  const filtered = statusFilter === "all" ? phaseList : phaseList.filter(p => p.status === statusFilter);

  const setStatus = (id: number, status: Player["status"]) => {
    setList(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const summary = (ph: 1 | 2) => ({
    total: list.filter(p => p.phase === ph).length,
    selected: list.filter(p => p.phase === ph && p.status === "selected").length,
    pending: list.filter(p => p.phase === ph && p.status === "pending").length,
    rejected: list.filter(p => p.phase === ph && p.status === "rejected").length,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Phase Toggle */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9", flex: 1 }}>Player Selection</div>
        <div style={{ display: "flex", gap: 0, background: "#060B18", borderRadius: 12, border: "1px solid #1E293B", overflow: "hidden" }}>
          {([1, 2] as const).map(p => (
            <button key={p} onClick={() => setPhase(p)} style={{
              padding: "10px 28px", border: "none", cursor: "pointer",
              background: phase === p ? "linear-gradient(135deg,#FF6B00,#FF8C40)" : "transparent",
              color: phase === p ? "#fff" : "#64748B",
              fontSize: 13, fontWeight: 800,
            }}>Phase {p}</button>
          ))}
        </div>
      </div>

      {/* Phase Stats */}
      {([1, 2] as const).map(ph => ph === phase && (
        <div key={ph} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Total Players", value: summary(ph).total, color: "#6366F1" },
            { label: "Selected", value: summary(ph).selected, color: "#10B981" },
            { label: "Pending Review", value: summary(ph).pending, color: "#F59E0B" },
            { label: "Rejected", value: summary(ph).rejected, color: "#EF4444" },
          ].map(s => (
            <div key={s.label} style={{ ...card, borderLeft: `3px solid ${s.color}`, display: "flex", alignItems: "center", gap: 14 }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Status Filter */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "pending", "selected", "rejected", "watchlist"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "7px 16px", borderRadius: 8, border: "1px solid",
            borderColor: statusFilter === s ? (s === "all" ? "#FF6B00" : statusConfig[s]?.color || "#FF6B00") : "#1E293B",
            background: statusFilter === s ? ((s === "all" ? "#FF6B00" : statusConfig[s]?.color || "#FF6B00") + "22") : "transparent",
            color: statusFilter === s ? (s === "all" ? "#FF6B00" : statusConfig[s]?.color) : "#64748B",
            fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>
            {s === "all" ? "All" : statusConfig[s].label}
            {s !== "all" && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
              ({phaseList.filter(p => p.status === s).length})
            </span>}
          </button>
        ))}
      </div>

      {/* Player Table */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E293B", background: "#060E1C" }}>
              {["Player", "Role", "Location", "Age", "Score", "Video", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "36px 16px", textAlign: "center", color: "#334155", fontSize: 12 }}>No players to review yet — Phase 1 submissions will appear here once videos are scored.</td></tr>
            )}
            {filtered.sort((a, b) => b.score - a.score).map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #0F1B2D" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `hsl(${p.id * 37}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                      {p.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{p.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: roleColor(p.role) + "22", color: roleColor(p.role) }}>{p.role}</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{p.city}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{p.state}</div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#94A3B8" }}>{p.age}y</td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: "#1E293B", borderRadius: 3, overflow: "hidden", minWidth: 50 }}>
                      <div style={{ height: "100%", width: `${p.score}%`, background: p.score >= 80 ? "#10B981" : p.score >= 65 ? "#F59E0B" : "#EF4444", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: p.score >= 80 ? "#10B981" : p.score >= 65 ? "#F59E0B" : "#EF4444", minWidth: 28 }}>{p.score}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  {p.video ? (
                    <button onClick={() => setVideoPlayer(p)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#3B82F622", color: "#3B82F6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>▶ Watch</button>
                  ) : (
                    <span style={{ fontSize: 12, color: "#334155" }}>No video</span>
                  )}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: statusConfig[p.status].bg, color: statusConfig[p.status].color }}>
                    {statusConfig[p.status].label}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setStatus(p.id, "selected")} disabled={p.status === "selected"} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #10B98155", background: p.status === "selected" ? "#10B98122" : "transparent", color: "#10B981", fontSize: 11, cursor: "pointer", fontWeight: 700, opacity: p.status === "selected" ? 0.5 : 1 }}>✓</button>
                    <button onClick={() => setStatus(p.id, "watchlist")} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #6366F155", background: p.status === "watchlist" ? "#6366F122" : "transparent", color: "#818CF8", fontSize: 11, cursor: "pointer" }}>👁</button>
                    <button onClick={() => setStatus(p.id, "rejected")} disabled={p.status === "rejected"} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #EF444455", background: p.status === "rejected" ? "#EF444422" : "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer", opacity: p.status === "rejected" ? 0.5 : 1 }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Video Modal */}
      {videoPlayer && (
        <div style={{ position: "fixed", inset: 0, background: "#000000CC", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 24, width: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>{videoPlayer.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Selection Video · {videoPlayer.role}</div>
              </div>
              <button onClick={() => setVideoPlayer(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ background: "#060B18", borderRadius: 12, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #1E293B", marginBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎥</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Video preview</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setStatus(videoPlayer.id, "selected"); setVideoPlayer(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#10B98122", color: "#10B981", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Select Player</button>
              <button onClick={() => { setStatus(videoPlayer.id, "watchlist"); setVideoPlayer(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#6366F122", color: "#818CF8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>👁 Watchlist</button>
              <button onClick={() => { setStatus(videoPlayer.id, "rejected"); setVideoPlayer(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#EF444422", color: "#EF4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✕ Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
