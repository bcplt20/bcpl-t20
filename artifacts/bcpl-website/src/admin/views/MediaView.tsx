import { useState } from "react";

const MEDIA = [
  { id: "M01", name: "match_highlights_m19.mp4", type: "video", size: "48.2 MB", uploaded: "20 Jul", by: "Admin", tag: "Highlights" },
  { id: "M02", name: "bcpl_opening_ceremony.jpg", type: "image", size: "2.1 MB", uploaded: "15 Jul", by: "Admin", tag: "Event" },
  { id: "M03", name: "arjun_sharma_batting.mp4", type: "video", size: "31.7 MB", uploaded: "14 Jul", by: "Arjun Sharma", tag: "Player" },
  { id: "M04", name: "team_baroda_bulls.jpg", type: "image", size: "1.4 MB", uploaded: "13 Jul", by: "Admin", tag: "Team" },
  { id: "M05", name: "promo_phase2_open.mp4", type: "video", size: "18.4 MB", uploaded: "12 Jul", by: "Admin", tag: "Promo" },
  { id: "M06", name: "ground_alembic.jpg", type: "image", size: "3.2 MB", uploaded: "10 Jul", by: "Admin", tag: "Ground" },
  { id: "M07", name: "rahul_patel_bowling.mp4", type: "video", size: "27.5 MB", uploaded: "9 Jul", by: "Rahul Patel", tag: "Player" },
  { id: "M08", name: "sponsor_banner_gtp.jpg", type: "image", size: "0.8 MB", uploaded: "8 Jul", by: "Admin", tag: "Sponsor" },
  { id: "M09", name: "award_night_photos.jpg", type: "image", size: "4.1 MB", uploaded: "5 Jul", by: "Admin", tag: "Event" },
  { id: "M10", name: "bcpl_logo_season5.png", type: "image", size: "0.3 MB", uploaded: "1 Jul", by: "Admin", tag: "Brand" },
  { id: "M11", name: "all_teams_group.jpg", type: "image", size: "5.8 MB", uploaded: "30 Jun", by: "Admin", tag: "Team" },
  { id: "M12", name: "promo_registration_reel.mp4", type: "video", size: "22.1 MB", uploaded: "28 Jun", by: "Admin", tag: "Promo" },
];

const TAG_C: Record<string, string> = {
  Highlights: "#EF4444",
  Event: "#8B5CF6",
  Player: "#3B82F6",
  Team: "#F59E0B",
  Promo: "#FF6B00",
  Ground: "#10B981",
  Sponsor: "#06B6D4",
  Brand: "#EC4899",
};

const EMOJI: Record<string, string> = { video: "🎬", image: "🖼", png: "🖼" };

export default function MediaView() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const tags = ["all", ...Array.from(new Set(MEDIA.map(m => m.tag)))];
  const filtered = MEDIA.filter(m => {
    const matchTag = filter === "all" || m.tag === filter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };
  const totalSize = MEDIA.reduce((acc, m) => acc + parseFloat(m.size), 0).toFixed(0);

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Files", value: MEDIA.length, color: "#3B82F6", icon: "📁" },
          { label: "Videos", value: MEDIA.filter(m => m.type === "video").length, color: "#EF4444", icon: "🎬" },
          { label: "Images", value: MEDIA.filter(m => m.type === "image").length, color: "#10B981", icon: "🖼" },
          { label: "Total Size", value: `~${totalSize} MB`, color: "#F59E0B", icon: "💾" },
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

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search files..." style={{ width: 200, padding: "8px 12px", borderRadius: 10, border: "1px solid #1E293B", background: "#0D1526", color: "#E2E8F0", fontSize: 12, outline: "none" }} />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: "6px 12px", borderRadius: 7, border: filter === t ? "none" : "1px solid #1E293B", background: filter === t ? (TAG_C[t] || "#FF6B00") : "transparent", color: filter === t ? "#fff" : "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setView("grid")} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #1E293B", background: view === "grid" ? "#FF6B0020" : "transparent", color: view === "grid" ? "#FF6B00" : "#475569", fontSize: 13, cursor: "pointer" }}>⊞</button>
          <button onClick={() => setView("list")} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #1E293B", background: view === "list" ? "#FF6B0020" : "transparent", color: view === "list" ? "#FF6B00" : "#475569", fontSize: 13, cursor: "pointer" }}>☰</button>
          <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⬆ Upload</button>
        </div>
      </div>

      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ ...card, padding: 0, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ height: 110, background: m.type === "video" ? "#1A0A00" : "#0A1A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, borderBottom: "1px solid #0F172A" }}>
                {EMOJI[m.type] || "📄"}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ background: `${TAG_C[m.tag] || "#FF6B00"}20`, color: TAG_C[m.tag] || "#FF6B00", padding: "2px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>{m.tag}</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{m.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["File", "Type", "Size", "Tag", "Uploaded", "By", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #0F172A" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{EMOJI[m.type]}</span>
                      <span style={{ color: "#CBD5E1", fontWeight: 500 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748B", textTransform: "capitalize" }}>{m.type}</td>
                  <td style={{ padding: "10px 12px", color: "#64748B" }}>{m.size}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: `${TAG_C[m.tag] || "#FF6B00"}20`, color: TAG_C[m.tag] || "#FF6B00", padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{m.tag}</span></td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>{m.uploaded}</td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>{m.by}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ background: "none", border: "1px solid #1E293B", borderRadius: 6, padding: "4px 9px", color: "#64748B", fontSize: 10, cursor: "pointer" }}>⬇</button>
                      <button style={{ background: "none", border: "1px solid #EF444430", borderRadius: 6, padding: "4px 9px", color: "#EF4444", fontSize: 10, cursor: "pointer" }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
