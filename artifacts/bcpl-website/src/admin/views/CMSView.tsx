import { useState } from "react";

const SECTIONS = [
  { id: "hero", label: "Hero Section", icon: "🏠", description: "Homepage hero banner with headline and CTA" },
  { id: "about", label: "About BCPL", icon: "ℹ️", description: "About the league — history, vision, mission" },
  { id: "howit", label: "How It Works", icon: "📋", description: "Step-by-step registration process" },
  { id: "prizes", label: "Prize Money", icon: "🏆", description: "Prize breakdown for winner, runner-up, etc." },
  { id: "faq", label: "FAQ", icon: "❓", description: "Frequently asked questions" },
  { id: "eligibility", label: "Eligibility Criteria", icon: "✅", description: "Who can register — age, location, format" },
  { id: "rules", label: "Cricket Rules", icon: "📖", description: "Rulebook for the tournament" },
  { id: "contact", label: "Contact Info", icon: "📞", description: "Phone, email, social links" },
];

const CONTENT: Record<string, { title: string; body: string }> = {
  hero: { title: "BCPL T20 Season 5 — Registration Open", body: "India's fastest growing T20 cricket league is back for Season 5! Register now and play with the best cricketers in your city. Open for all players aged 18+. Don't miss your chance to be part of history." },
  about: { title: "About BCPL T20", body: "Baroda Cricket Premier League (BCPL) T20 is a city-level T20 franchise cricket tournament held in Vadodara, Gujarat. Founded in 2020, the league has grown to 16 franchise teams across 5 seasons." },
  howit: { title: "How It Works", body: "1. Register online (₹499)\n2. Upload your batting/bowling video\n3. Complete KYC verification\n4. Attend trials & get selected\n5. Pay Phase 2 fee (₹5,999)\n6. Play for your franchise team!" },
  prizes: { title: "Prize Money", body: "Champion: ₹5,00,000\nRunner-Up: ₹2,50,000\nBest Batsman: ₹50,000\nBest Bowler: ₹50,000\nFair Play Award: ₹25,000\nMost Valuable Player: ₹75,000" },
  faq: { title: "Frequently Asked Questions", body: "Q: What is BCPL T20?\nA: BCPL T20 is a franchise T20 cricket tournament...\n\nQ: Who can register?\nA: Any Indian citizen aged 18 and above...\n\nQ: What is the registration fee?\nA: Phase 1 registration is ₹499. Phase 2 is ₹5,999." },
  eligibility: { title: "Eligibility Criteria", body: "- Age: 18 years and above\n- Indian citizen (Aadhar/PAN required)\n- No active BCCI/state board contract\n- Must be able to attend matches in Vadodara\n- Good physical fitness required" },
  rules: { title: "Tournament Rules", body: "Format: T20 (20 overs per side)\nTeams: 16 franchises, 15 players each\nLeague: Round-robin, top 4 to playoffs\nDRS: Available (1 review per innings)\nNo Objection: Umpire decisions are final" },
  contact: { title: "Contact Us", body: "Email: info@bcplt20.com\nPhone: +91 98765 43210\nAddress: BCPL Office, Vadodara, Gujarat\nWhatsApp: +91 98765 43210\nInstagram: @bcplt20official\nFacebook: BCPL T20 Official" },
};

export default function CMSView() {
  const [selected, setSelected] = useState("hero");
  const [forms, setForms] = useState<Record<string, { title: string; body: string }>>(CONTENT);
  const [saved, setSaved] = useState<string | null>(null);

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  const save = () => {
    setSaved(selected);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        {/* Section List */}
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Page Sections</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSelected(s.id)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: selected === s.id ? "#FF6B0015" : "transparent", borderLeft: `2px solid ${selected === s.id ? "#FF6B00" : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: selected === s.id ? "#FF6B00" : "#94A3B8", fontWeight: selected === s.id ? 700 : 500 }}>{s.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{SECTIONS.find(s => s.id === selected)?.label}</div>
              {saved === selected && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>✓ Saved!</span>}
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 20 }}>{SECTIONS.find(s => s.id === selected)?.description}</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>SECTION TITLE</label>
              <input value={forms[selected]?.title || ""} onChange={e => setForms(f => ({ ...f, [selected]: { ...f[selected], title: e.target.value } }))} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>CONTENT BODY</label>
              <textarea value={forms[selected]?.body || ""} onChange={e => setForms(f => ({ ...f, [selected]: { ...f[selected], body: e.target.value } }))} rows={10} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={save} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Changes</button>
              <button style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Preview</button>
              <button onClick={() => setForms(f => ({ ...f, [selected]: CONTENT[selected] }))} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#EF4444", fontSize: 13, cursor: "pointer" }}>Reset to Default</button>
            </div>
          </div>

          {/* Preview */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Live Preview</div>
            <div style={{ background: "#060B18", borderRadius: 10, padding: "20px 24px", border: "1px solid #0F172A" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#E2E8F0", marginBottom: 12 }}>{forms[selected]?.title}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, whiteSpace: "pre-line" }}>{forms[selected]?.body}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
