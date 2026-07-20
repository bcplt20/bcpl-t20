import { useState, useRef } from "react";

type MediaItem = {
  id: number;
  name: string;
  type: "image" | "video";
  size: string;
  uploaded: string;
  url: string;
};

const MEDIA: MediaItem[] = [
  { id: 1, name: "hero-banner.jpg",       type: "image", size: "1.2 MB", uploaded: "15 Jul 2025", url: "" },
  { id: 2, name: "team-mumbai.jpg",       type: "image", size: "840 KB", uploaded: "14 Jul 2025", url: "" },
  { id: 3, name: "auction-promo.mp4",     type: "video", size: "24 MB",  uploaded: "12 Jul 2025", url: "" },
  { id: 4, name: "sponsor-techcorp.png",  type: "image", size: "210 KB", uploaded: "10 Jul 2025", url: "" },
  { id: 5, name: "bcpl-logo.svg",         type: "image", size: "18 KB",  uploaded: "01 Jul 2025", url: "" },
  { id: 6, name: "promo-video.mp4",       type: "video", size: "56 MB",  uploaded: "28 Jun 2025", url: "" },
  { id: 7, name: "trial-guide.jpg",       type: "image", size: "560 KB", uploaded: "25 Jun 2025", url: "" },
  { id: 8, name: "players-collage.jpg",   type: "image", size: "2.1 MB", uploaded: "20 Jun 2025", url: "" },
];

export default function MediaView() {
  const [items, setItems]   = useState<MediaItem[]>(MEDIA);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [view, setView]     = useState<"grid" | "list">("grid");
  const fileRef             = useRef<HTMLInputElement>(null);

  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: MediaItem[] = Array.from(files).map((f, idx) => ({
      id: items.length + idx + 1,
      name: f.name,
      type: f.type.startsWith("video") ? "video" : "image",
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      uploaded: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      url: URL.createObjectURL(f),
    }));
    setItems(prev => [...newItems, ...prev]);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {(["all","image","video"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px",
              background: filter === f ? "#FF7A29" : "#0D1B2E",
              color: filter === f ? "#fff" : "#7A8EA8",
              border: `1px solid ${filter === f ? "#FF7A29" : "rgba(255,255,255,.12)"}`,
              borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12,
              fontFamily: "'Montserrat', sans-serif", textTransform: "capitalize",
            }}
          >
            {f === "all" ? "All" : f === "image" ? "🖼 Images" : "🎬 Videos"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {(["grid","list"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 12px",
                background: view === v ? "rgba(255,122,41,.2)" : "#0D1B2E",
                color: view === v ? "#FF7A29" : "#7A8EA8",
                border: `1px solid ${view === v ? "#FF7A29" : "rgba(255,255,255,.12)"}`,
                borderRadius: 7, cursor: "pointer", fontSize: 14,
              }}
            >
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: "7px 16px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
              color: "#fff", border: "none", borderRadius: 7, fontWeight: 700,
              cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ⬆ Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{
          border: "2px dashed rgba(255,122,41,.3)", borderRadius: 12,
          padding: "24px", textAlign: "center", marginBottom: 20,
          color: "#7A8EA8", fontSize: 13, cursor: "pointer",
        }}
        onClick={() => fileRef.current?.click()}
      >
        📁 Drag & drop files here, or click to upload
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
          {filtered.map(item => (
            <div key={item.id} style={{
              background: "#0D1B2E", borderRadius: 10,
              border: "1px solid rgba(255,255,255,.07)",
              overflow: "hidden",
            }}>
              <div style={{
                height: 110, background: "rgba(255,255,255,.04)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40,
              }}>
                {item.url
                  ? <img src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : item.type === "video" ? "🎬" : "🖼️"
                }
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ color: "#E8F0FE", fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ color: "#7A8EA8", fontSize: 10, marginTop: 3 }}>{item.size} · {item.uploaded}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,.04)" }}>
                {["File","Type","Size","Uploaded","Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid rgba(255,255,255,.07)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                    <span style={{ marginRight: 8 }}>{item.type === "video" ? "🎬" : "🖼️"}</span>
                    {item.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: item.type === "video" ? "#A855F722" : "#3B9EFF22", color: item.type === "video" ? "#A855F7" : "#3B9EFF", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 13 }}>{item.size}</td>
                  <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 12 }}>{item.uploaded}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 10px", background: "rgba(59,158,255,.12)", color: "#3B9EFF", border: "1px solid #3B9EFF", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Copy URL</button>
                      <button style={{ padding: "5px 10px", background: "rgba(239,68,68,.12)", color: "#EF4444", border: "1px solid #EF4444", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                        onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}>
                        Delete
                      </button>
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
