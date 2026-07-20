import { useState } from "react";

const PAGES = [
  { page: "Home", title: "BCPL T20 – Baroda Cricket Premier League 2024-25", desc: "Register for BCPL T20 Season 5. Play in Baroda's premier T20 cricket league. Registration open now.", slug: "/", score: 92 },
  { page: "Registration", title: "Register for BCPL T20 Season 5 | ₹499 Only", desc: "Sign up for BCPL T20 Season 5. Open for all players 18+. Register now and start your cricket journey.", slug: "/register", score: 88 },
  { page: "Match Center", title: "BCPL T20 Match Schedule & Live Scores", desc: "Stay updated with BCPL T20 live scores, match schedule, points table and highlights.", slug: "/matches", score: 79 },
  { page: "Teams", title: "BCPL T20 Teams – All 16 Franchises", desc: "Meet all 16 BCPL T20 teams, their players, captains and coaches.", slug: "/teams", score: 74 },
  { page: "Auction", title: "BCPL T20 Player Auction 2024-25 Live", desc: "Watch the BCPL T20 live player auction, sold/unsold players and team compositions.", slug: "/auction", score: 81 },
];

export default function SEOView() {
  const [selected, setSelected] = useState(0);
  const [form, setForm] = useState({ title: PAGES[0].title, desc: PAGES[0].desc, slug: PAGES[0].slug });

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  function handleSelect(i: number) {
    setSelected(i);
    setForm({ title: PAGES[i].title, desc: PAGES[i].desc, slug: PAGES[i].slug });
  }

  const scoreColor = (s: number) => s >= 85 ? "#10B981" : s >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Avg SEO Score", value: "82.8", sub: "Good", color: "#10B981", icon: "📈" },
          { label: "Pages Indexed", value: "14 / 16", sub: "2 pending", color: "#3B82F6", icon: "🔍" },
          { label: "Organic Visitors", value: "2,840", sub: "Last 30 days", color: "#8B5CF6", icon: "👁" },
          { label: "Sitemap Status", value: "Active", sub: "Last updated today", color: "#10B981", icon: "🗺" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 4px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color }}>{s.sub}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        {/* Page List */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Pages</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PAGES.map((p, i) => (
              <button key={i} onClick={() => handleSelect(i)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: selected === i ? "#FF6B0015" : "transparent", borderLeft: `2px solid ${selected === i ? "#FF6B00" : "transparent"}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                <span style={{ fontSize: 12, color: selected === i ? "#FF6B00" : "#94A3B8", fontWeight: selected === i ? 700 : 500 }}>{p.page}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor(p.score) }}>{p.score}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 18, textTransform: "uppercase" }}>Meta Editor — {PAGES[selected].page}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>META TITLE</label>
                  <span style={{ fontSize: 10, color: form.title.length > 60 ? "#EF4444" : "#10B981" }}>{form.title.length}/60</span>
                </div>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${form.title.length > 60 ? "#EF444460" : "#1E293B"}`, background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>META DESCRIPTION</label>
                  <span style={{ fontSize: 10, color: form.desc.length > 160 ? "#EF4444" : "#10B981" }}>{form.desc.length}/160</span>
                </div>
                <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${form.desc.length > 160 ? "#EF444460" : "#1E293B"}`, background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>URL SLUG</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
              <button style={{ alignSelf: "flex-start", padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Meta Tags</button>
            </div>
          </div>

          {/* Google Preview */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Google Search Preview</div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "#006621", marginBottom: 3 }}>bcplt20.com{form.slug}</div>
              <div style={{ fontSize: 17, color: "#1a0dab", fontWeight: 400, marginBottom: 5, lineHeight: 1.3, cursor: "pointer" }}>{form.title}</div>
              <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5 }}>{form.desc.slice(0, 160)}</div>
            </div>
          </div>

          {/* SEO Checklist */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>SEO Checklist</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Title length OK (< 60 chars)", ok: form.title.length <= 60 },
                { label: "Description length OK (< 160)", ok: form.desc.length <= 160 },
                { label: "Title contains 'BCPL T20'", ok: form.title.toLowerCase().includes("bcpl") },
                { label: "Slug is lowercase & clean", ok: /^\/[a-z0-9-/]*$/.test(form.slug) },
                { label: "OG tags configured", ok: true },
                { label: "Sitemap updated", ok: true },
                { label: "Structured data (JSON-LD)", ok: false },
                { label: "Canonical URL set", ok: true },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: c.ok ? "#10B98108" : "#EF444408", borderRadius: 8, border: `1px solid ${c.ok ? "#10B98120" : "#EF444420"}` }}>
                  <span style={{ fontSize: 14 }}>{c.ok ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 11, color: c.ok ? "#10B981" : "#EF4444" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
