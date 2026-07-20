import { useState } from "react";

type MediaItem = {
  id: number; type: "photo" | "video"; title: string; tag: string;
  size: string; date: string; views: number; thumb: string;
};

const mediaItems: MediaItem[] = [
  { id: 1, type: "photo", title: "Opening Ceremony", tag: "Event", size: "2.4 MB", date: "Jul 18", views: 1240, thumb: "🏟" },
  { id: 2, type: "video", title: "Match Highlights Reel", tag: "Highlights", size: "48 MB", date: "Jul 18", views: 3820, thumb: "🎬" },
  { id: 3, type: "photo", title: "Team Rajasthan Group Photo", tag: "Teams", size: "1.8 MB", date: "Jul 17", views: 892, thumb: "👥" },
  { id: 4, type: "video", title: "Best Catches of the Day", tag: "Highlights", size: "32 MB", date: "Jul 17", views: 2100, thumb: "🏏" },
  { id: 5, type: "photo", title: "Award Ceremony", tag: "Event", size: "3.1 MB", date: "Jul 16", views: 741, thumb: "🏆" },
  { id: 6, type: "photo", title: "Player Portraits – Batch 1", tag: "Players", size: "12 MB", date: "Jul 16", views: 612, thumb: "🧑" },
  { id: 7, type: "video", title: "Phase 1 Selection Interviews", tag: "Selection", size: "94 MB", date: "Jul 15", views: 1890, thumb: "🎥" },
  { id: 8, type: "photo", title: "Sponsor Banner Installation", tag: "Sponsors", size: "1.2 MB", date: "Jul 14", views: 320, thumb: "🖼" },
  { id: 9, type: "video", title: "Promo – BCPL Season 5", tag: "Marketing", size: "76 MB", date: "Jul 13", views: 8940, thumb: "📣" },
  { id: 10, type: "photo", title: "Ground Setup Day 1", tag: "Behind Scenes", size: "4.2 MB", date: "Jul 12", views: 445, thumb: "🌿" },
  { id: 11, type: "video", title: "Training Camp Day 2", tag: "Training", size: "55 MB", date: "Jul 11", views: 1230, thumb: "🏃" },
  { id: 12, type: "photo", title: "Scoreboard Reveal", tag: "Event", size: "0.9 MB", date: "Jul 10", views: 780, thumb: "📊" },
];

const tags = ["All", "Highlights", "Event", "Teams", "Players", "Selection", "Marketing", "Sponsors", "Training", "Behind Scenes"];

export default function MediaView() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "video">("all");
  const [tagFilter, setTagFilter] = useState("All");
  const [uploading, setUploading] = useState(false);

  const filtered = mediaItems.filter(m =>
    (typeFilter === "all" || m.type === typeFilter) &&
    (tagFilter === "All" || m.tag === tagFilter)
  );

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const totalPhotos = mediaItems.filter(m => m.type === "photo").length;
  const totalVideos = mediaItems.filter(m => m.type === "video").length;
  const totalViews = mediaItems.reduce((a, m) => a + m.views, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Photos & Videos</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Manage all BCPL media assets in one place</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            📁 Create Folder
          </button>
          <button onClick={() => setUploading(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ⬆ Upload Media
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Files", value: mediaItems.length, icon: "📦", color: "#6366F1" },
          { label: "Photos", value: totalPhotos, icon: "📸", color: "#F59E0B" },
          { label: "Videos", value: totalVideos, icon: "🎬", color: "#3B82F6" },
          { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁", color: "#10B981" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14, borderLeft: `3px solid ${s.color}` }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 0, background: "#060B18", borderRadius: 10, border: "1px solid #1E293B", overflow: "hidden" }}>
          {(["all", "photo", "video"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: "8px 18px", border: "none", cursor: "pointer",
              background: typeFilter === t ? "#FF6B00" : "transparent",
              color: typeFilter === t ? "#fff" : "#64748B",
              fontSize: 12, fontWeight: 700, textTransform: "capitalize",
            }}>{t === "all" ? "All" : t === "photo" ? "📸 Photos" : "🎬 Videos"}</button>
          ))}
        </div>
        <div style={{ width: 1, height: 32, background: "#1E293B" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tags.map(t => (
            <button key={t} onClick={() => setTagFilter(t)} style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid",
              borderColor: tagFilter === t ? "#FF6B00" : "#1E293B",
              background: tagFilter === t ? "#FF6B0022" : "transparent",
              color: tagFilter === t ? "#FF6B00" : "#64748B",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              width: 36, height: 36, borderRadius: 8, border: "1px solid",
              borderColor: viewMode === v ? "#FF6B00" : "#1E293B",
              background: viewMode === v ? "#FF6B0022" : "transparent",
              color: viewMode === v ? "#FF6B00" : "#64748B",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{v === "grid" ? "⊞" : "≡"}</button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ ...card, padding: 0, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#FF6B00")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E293B")}>
              <div style={{ height: 120, background: `hsl(${m.id * 37}, 30%, 12%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
                {m.thumb}
                {m.type === "video" && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>▶</div>
                  </div>
                )}
                <div style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 800, background: m.type === "photo" ? "#F59E0B22" : "#3B82F622", color: m.type === "photo" ? "#F59E0B" : "#3B82F6", backdropFilter: "blur(4px)" }}>
                  {m.type === "photo" ? "IMG" : "VID"}
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "#1E293B", color: "#64748B", fontWeight: 600 }}>{m.tag}</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>👁 {m.views.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "#334155" }}>{m.size}</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>{m.date}</span>
                </div>
              </div>
            </div>
          ))}
          {/* Upload Placeholder */}
          <div onClick={() => setUploading(true)} style={{ ...card, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #1E293B", cursor: "pointer", gap: 8, transition: "border-color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#FF6B00")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1E293B")}>
            <span style={{ fontSize: 32 }}>⬆</span>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Upload new media</span>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div style={{ ...card, padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B", background: "#060E1C" }}>
                {["Preview", "Title", "Type", "Tag", "Size", "Date", "Views", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #0F1B2D" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ width: 48, height: 36, borderRadius: 6, background: `hsl(${m.id * 37}, 30%, 14%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.thumb}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{m.title}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, background: m.type === "photo" ? "#F59E0B22" : "#3B82F622", color: m.type === "photo" ? "#F59E0B" : "#3B82F6" }}>
                      {m.type === "photo" ? "📸 PHOTO" : "🎬 VIDEO"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 10, background: "#1E293B", color: "#64748B", fontWeight: 600 }}>{m.tag}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{m.size}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{m.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>{m.views.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>View</button>
                      <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #EF444444", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {uploading && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 20 }}>⬆ Upload Media</div>
            <div style={{ background: "#060B18", borderRadius: 14, border: "2px dashed #334155", padding: "40px 20px", textAlign: "center", marginBottom: 18, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#FF6B00")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>☁</div>
              <div style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>Drag & drop files here</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>or click to browse · JPG, PNG, MP4, MOV up to 500MB</div>
              <button style={{ marginTop: 14, padding: "9px 22px", borderRadius: 9, border: "1px solid #334155", background: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>Browse Files</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Category Tag</label>
              <select style={{ width: "100%", padding: "10px 14px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                {tags.slice(1).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setUploading(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setUploading(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
