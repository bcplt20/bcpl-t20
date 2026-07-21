import { useState } from "react";

const SPONSORS: { id:string; name:string; tier:string; logo:string; amount:string; status:string; contract:string; visibility:string }[] = [];

const TIERS = ["Title", "Platinum", "Gold", "Silver", "Bronze"];
const TIER_C: Record<string, { bg: string; color: string; border: string }> = {
  Title: { bg: "#FF6B0020", color: "#FF6B00", border: "#FF6B0050" },
  Platinum: { bg: "#E2E8F020", color: "#E2E8F0", border: "#E2E8F050" },
  Gold: { bg: "#F59E0B20", color: "#F59E0B", border: "#F59E0B50" },
  Silver: { bg: "#94A3B820", color: "#94A3B8", border: "#94A3B850" },
  Bronze: { bg: "#CD7F3220", color: "#CD7F32", border: "#CD7F3250" },
};

export default function SponsorsView() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", tier: "Gold", amount: "", contact: "" });

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  const total = SPONSORS.filter(s => s.status === "active").reduce((acc, s) => {
    const n = parseFloat(s.amount.replace("₹", "").replace("L", "")) || 0;
    return acc + n;
  }, 0);

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Sponsorship", value: `₹${total}L`, color: "#10B981", icon: "💰" },
          { label: "Active Sponsors", value: SPONSORS.filter(s => s.status === "active").length, color: "#3B82F6", icon: "🤝" },
          { label: "In Negotiation", value: SPONSORS.filter(s => s.status === "negotiating").length, color: "#F59E0B", icon: "🔄" },
          { label: "Tier Slots Open", value: "3", color: "#8B5CF6", icon: "🔓" },
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

      {/* Tier Summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {TIERS.map(tier => {
          const count = SPONSORS.filter(s => s.tier === tier).length;
          const tc = TIER_C[tier];
          return (
            <div key={tier} style={{ flex: 1, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: tc.color }}>{tier}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#E2E8F0", margin: "4px 0" }}>{count}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>sponsors</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShowAdd(s => !s)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Sponsor</button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 16, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FF6B00", marginBottom: 16 }}>New Sponsor</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { key: "name", label: "COMPANY NAME", placeholder: "e.g. Gujarat Titan Paints" },
              { key: "amount", label: "AMOUNT", placeholder: "e.g. ₹5L" },
              { key: "contact", label: "CONTACT EMAIL", placeholder: "sponsor@company.com" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>TIER</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Sponsor</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sponsor Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SPONSORS.map(s => {
          const tc = TIER_C[s.tier];
          return (
            <div key={s.id} style={{ ...card, borderLeft: `3px solid ${tc.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, border: `1.5px solid ${tc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.logo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>📍 {s.visibility}</div>
                </div>
                <span style={{ background: tc.bg, color: tc.color, padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{s.tier}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#10B981", minWidth: 60, textAlign: "right" }}>{s.amount}</span>
                <span style={{ fontSize: 10, color: "#475569" }}>until {s.contract}</span>
                <span style={{ background: s.status === "active" ? "#10B98120" : "#F59E0B20", color: s.status === "active" ? "#10B981" : "#F59E0B", padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{s.status}</span>
                <button style={{ background: "none", border: "1px solid #1E293B", borderRadius: 7, padding: "5px 12px", color: "#64748B", fontSize: 11, cursor: "pointer" }}>Edit</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
