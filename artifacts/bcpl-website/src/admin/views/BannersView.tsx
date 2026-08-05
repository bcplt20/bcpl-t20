import { useState } from "react";

type Banner = {
  id: string;
  title: string;
  location: string;
  type: string;
  active: boolean;
  priority: number;
  cta: string;
};

const INIT: Banner[] = [
  { id: "BN01", title: "Phase 2 Registration Open!", location: "Homepage Hero", type: "Registration", active: true, priority: 1, cta: "Register Now" },
  { id: "BN02", title: "Live Match: ACA vs GGA", location: "Homepage Top Bar", type: "Live Match", active: true, priority: 2, cta: "Watch Live" },
  { id: "BN03", title: "Refer & Earn ₹50 per signup", location: "Registration Page", type: "Referral", active: true, priority: 3, cta: "Share Now" },
  { id: "BN04", title: "Gujarat Titan Paints — Title Sponsor", location: "All Pages Footer", type: "Sponsor", active: true, priority: 4, cta: "" },
  { id: "BN05", title: "KYC Pending — Complete Now", location: "Dashboard Notification", type: "Reminder", active: true, priority: 5, cta: "Complete KYC" },
  { id: "BN06", title: "Season 5 Highlights Video", location: "Homepage Section", type: "Media", active: false, priority: 6, cta: "Watch" },
  { id: "BN07", title: "Phase 1 Last Date: 31 Aug", location: "Registration Page", type: "Deadline", active: false, priority: 7, cta: "Register" },
];

const TYPE_C: Record<string, string> = {
  Registration: "#FF6B00",
  "Live Match": "#EF4444",
  Referral: "#10B981",
  Sponsor: "#F59E0B",
  Reminder: "#8B5CF6",
  Media: "#3B82F6",
  Deadline: "#EF4444",
};

export default function BannersView() {
  const [banners, setBanners] = useState<Banner[]>(INIT);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", location: "Homepage Hero", type: "Registration", cta: "" });

  const toggle = (id: string) => setBanners(b => b.map(bn => bn.id === id ? { ...bn, active: !bn.active } : bn));

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };
  const activeCount = banners.filter(b => b.active).length;

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Banners", value: banners.length, color: "#3B82F6", icon: "🖼" },
          { label: "Active", value: activeCount, color: "#10B981", icon: "✅" },
          { label: "Inactive", value: banners.length - activeCount, color: "#475569", icon: "💤" },
          { label: "Locations", value: "8", color: "#F59E0B", icon: "📍" },
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
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setShowAdd(s => !s)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Banner</button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 16, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#FF6B00", marginBottom: 16 }}>New Banner</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>BANNER TITLE</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Phase 2 Open!" style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>LOCATION</label>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                {["Homepage Hero", "Homepage Top Bar", "Registration Page", "All Pages Footer", "Dashboard Notification", "Match Center"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                {Object.keys(TYPE_C).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>CTA TEXT</label>
              <input value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} placeholder="e.g. Register Now" style={{ width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => { setBanners(b => [...b, { ...form, id: `BN${String(b.length + 1).padStart(2, "0")}`, active: true, priority: b.length + 1 }]); setShowAdd(false); }} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Banner</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Banner Table */}
      <div style={card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E293B" }}>
              {["#", "Banner Title", "Location", "Type", "CTA", "Status", "Toggle"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {banners.map(b => (
              <tr key={b.id} style={{ borderBottom: "1px solid #0F172A" }}>
                <td style={{ padding: "11px 12px", color: "#334155", fontFamily: "monospace" }}>{b.priority}</td>
                <td style={{ padding: "11px 12px", color: "#E2E8F0", fontWeight: 600 }}>{b.title}</td>
                <td style={{ padding: "11px 12px", color: "#64748B", fontSize: 11 }}>{b.location}</td>
                <td style={{ padding: "11px 12px" }}><span style={{ background: `${TYPE_C[b.type]}20`, color: TYPE_C[b.type], padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{b.type}</span></td>
                <td style={{ padding: "11px 12px", color: b.cta ? "#94A3B8" : "#334155" }}>{b.cta || "—"}</td>
                <td style={{ padding: "11px 12px" }}><span style={{ background: b.active ? "#10B98120" : "#1E293B", color: b.active ? "#10B981" : "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{b.active ? "Active" : "Inactive"}</span></td>
                <td style={{ padding: "11px 12px" }}>
                  <button onClick={() => toggle(b.id)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: b.active ? "#10B981" : "#1E293B", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: b.active ? 22 : 4, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
