import { useState } from "react";

type Section = "hero" | "announcement" | "faq" | "about";

const CONTENT: Record<Section, { title: string; body: string }> = {
  hero: {
    title: "India's First Professional Box Cricket League",
    body: "Join the revolution. ₹20L prize pool. 8 franchise teams. Your shot at cricket glory starts here.",
  },
  announcement: {
    title: "🏏 Phase 2 Registrations Now Open!",
    body: "Congratulations on clearing Phase 1! Complete your Phase 2 registration and KYC to secure your spot in the auction pool.",
  },
  faq: {
    title: "Frequently Asked Questions",
    body: "Q: What is BCPL T20?\nA: BCPL T20 is India's premier box cricket league for amateur players aged 15–55.\n\nQ: What are the eligibility criteria?\nA: Any Indian citizen aged 15–55 can register. No prior professional cricket experience required.",
  },
  about: {
    title: "About BCPL T20",
    body: "BCPL T20 was founded with a mission to give every cricket lover in India a chance to play professionally. We believe talent is spread across every city, town, and village of this great nation.",
  },
};

export default function CMSView() {
  const [active, setActive] = useState<Section>("hero");
  const [form, setForm]     = useState(CONTENT[active]);
  const [saved, setSaved]   = useState(false);

  const switchSection = (s: Section) => {
    setActive(s);
    setForm(CONTENT[s]);
    setSaved(false);
  };

  const handleSave = () => {
    CONTENT[active] = { ...form };
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SECTIONS: Array<{ key: Section; label: string; icon: string }> = [
    { key: "hero",         label: "Hero Section",    icon: "🏠" },
    { key: "announcement", label: "Announcement",    icon: "📣" },
    { key: "faq",          label: "FAQ Content",     icon: "❓" },
    { key: "about",        label: "About Page",      icon: "ℹ️"  },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
      {/* Sections list */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", height: "fit-content" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontWeight: 900, color: "#fff", fontSize: 14 }}>
          Content Sections
        </div>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => switchSection(s.key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "13px 16px",
              background: active === s.key ? "rgba(255,122,41,.1)" : "none",
              border: "none", borderLeft: active === s.key ? "3px solid #FF7A29" : "3px solid transparent",
              borderBottom: "1px solid rgba(255,255,255,.05)",
              color: active === s.key ? "#FF7A29" : "#E8F0FE",
              cursor: "pointer", textAlign: "left",
              fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700,
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>
            {SECTIONS.find(s => s.key === active)?.icon} {SECTIONS.find(s => s.key === active)?.label}
          </div>
          {saved && (
            <div style={{ color: "#22C55E", fontSize: 13, fontWeight: 700 }}>✓ Saved successfully</div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
            Title / Heading
          </label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{
              display: "block", width: "100%", marginTop: 10,
              padding: "13px 16px", background: "#06101E",
              border: "1px solid rgba(255,255,255,.15)", borderRadius: 8,
              color: "#fff", fontSize: 15, fontWeight: 700,
              boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
            Body Content
          </label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={10}
            style={{
              display: "block", width: "100%", marginTop: 10,
              padding: "13px 16px", background: "#06101E",
              border: "1px solid rgba(255,255,255,.15)", borderRadius: 8,
              color: "#fff", fontSize: 13, resize: "vertical",
              boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif",
              lineHeight: 1.6, outline: "none",
            }}
          />
        </div>

        {/* Preview */}
        <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 20, marginBottom: 20, border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Preview</div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{form.title}</div>
          <div style={{ color: "#7A8EA8", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{form.body}</div>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: "12px 28px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
            color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
            cursor: "pointer", fontSize: 14, fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
