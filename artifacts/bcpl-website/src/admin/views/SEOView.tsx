import { useState } from "react";

const PAGES = [
  { path: "/",          title: "BCPL T20 – India's Premier Box Cricket League",          desc: "Join India's biggest box cricket league. Register now for BCPL T20 trials.", score: 92 },
  { path: "/register",  title: "Register for BCPL T20 Trials – Phase 1",                 desc: "Register for BCPL T20 trials. ₹499 registration fee. Open to all ages.",  score: 78 },
  { path: "/teams",     title: "BCPL T20 Teams – All 8 Franchise Teams",                  desc: "Meet all 8 franchise teams of the BCPL T20 cricket league.",               score: 85 },
  { path: "/schedule",  title: "BCPL T20 Match Schedule 2025",                            desc: "View the complete BCPL T20 match schedule for 2025 season.",               score: 70 },
  { path: "/about",     title: "About BCPL T20 – Our Mission & Vision",                   desc: "Learn about the BCPL T20 league, its mission, vision, and leadership.",    score: 65 },
];

const SCORE_COLOR = (s: number) => s >= 90 ? "#22C55E" : s >= 70 ? "#F59E0B" : "#EF4444";

export default function SEOView() {
  const [selected, setSelected] = useState(PAGES[0]);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ title: selected.title, desc: selected.desc });

  const select = (p: typeof PAGES[0]) => {
    setSelected(p);
    setForm({ title: p.title, desc: p.desc });
    setEditing(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
      {/* Page list */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontWeight: 900, color: "#fff", fontSize: 14 }}>Pages</div>
        {PAGES.map(p => (
          <button
            key={p.path}
            onClick={() => select(p)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "12px 16px", background: selected.path === p.path ? "rgba(255,122,41,.1)" : "none",
              border: "none", borderLeft: selected.path === p.path ? "3px solid #FF7A29" : "3px solid transparent",
              borderBottom: "1px solid rgba(255,255,255,.05)",
              color: selected.path === p.path ? "#FF7A29" : "#E8F0FE",
              cursor: "pointer", textAlign: "left",
              fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700,
            }}
          >
            <span style={{ flex: 1 }}>{p.path}</span>
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `${SCORE_COLOR(p.score)}22`,
              color: SCORE_COLOR(p.score),
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 900, flexShrink: 0,
            }}>
              {p.score}
            </span>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div>
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>{selected.path}</div>
              <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 2 }}>SEO Meta Tags</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${SCORE_COLOR(selected.score)}22`,
                color: SCORE_COLOR(selected.score),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 16,
              }}>
                {selected.score}
              </div>
              <button
                onClick={() => setEditing(e => !e)}
                style={{
                  padding: "8px 16px", background: editing ? "rgba(255,122,41,.2)" : "rgba(255,255,255,.06)",
                  color: editing ? "#FF7A29" : "#7A8EA8",
                  border: `1px solid ${editing ? "#FF7A29" : "rgba(255,255,255,.12)"}`,
                  borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                }}
              >
                {editing ? "Cancel" : "✏️ Edit"}
              </button>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Title Tag <span style={{ color: "#7A8EA8" }}>({form.title.length}/60)</span>
            </label>
            {editing ? (
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={60}
                style={{ display: "block", width: "100%", marginTop: 8, padding: "12px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, color: "#fff", fontSize: 14, boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif" }}
              />
            ) : (
              <div style={{ marginTop: 8, color: "#3B9EFF", fontSize: 14, fontWeight: 700, padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: 8 }}>
                {form.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Meta Description <span style={{ color: "#7A8EA8" }}>({form.desc.length}/160)</span>
            </label>
            {editing ? (
              <textarea
                value={form.desc}
                onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                maxLength={160}
                rows={3}
                style={{ display: "block", width: "100%", marginTop: 8, padding: "12px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, color: "#fff", fontSize: 14, resize: "vertical", boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif" }}
              />
            ) : (
              <div style={{ marginTop: 8, color: "#E8F0FE", fontSize: 13, padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: 8 }}>
                {form.desc}
              </div>
            )}
          </div>

          {editing && (
            <button
              onClick={() => setEditing(false)}
              style={{ padding: "10px 24px", background: "linear-gradient(135deg,#FF7A29,#FF4500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              Save Changes
            </button>
          )}
        </div>

        {/* Google Preview */}
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", marginBottom: 16 }}>Google Search Preview</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", color: "#000" }}>
            <div style={{ color: "#1a0dab", fontSize: 18, fontWeight: 400, marginBottom: 2 }}>{form.title}</div>
            <div style={{ color: "#006621", fontSize: 13 }}>https://bcplt20.com{selected.path}</div>
            <div style={{ color: "#545454", fontSize: 13, marginTop: 4 }}>{form.desc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
