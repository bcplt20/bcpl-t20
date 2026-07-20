import { useState } from "react";

const SPONSORS = [
  { id: 1, name: "TechCorp India",    tier: "Title",    logo: "🏢", contact: "sponsor@techcorp.in",    amount: "₹50L",  status: "Active",  since: "Jan 2025" },
  { id: 2, name: "SportZone",         tier: "Platinum", logo: "⚡", contact: "deals@sportzone.com",    amount: "₹25L",  status: "Active",  since: "Feb 2025" },
  { id: 3, name: "HealthPlus",        tier: "Gold",     logo: "💊", contact: "pr@healthplus.in",       amount: "₹10L",  status: "Active",  since: "Mar 2025" },
  { id: 4, name: "FoodFest",          tier: "Silver",   logo: "🍔", contact: "hello@foodfest.co",      amount: "₹5L",   status: "Active",  since: "Mar 2025" },
  { id: 5, name: "AutoDrive",         tier: "Silver",   logo: "🚗", contact: "mkt@autodrive.com",      amount: "₹5L",   status: "Pending", since: "Jul 2025" },
  { id: 6, name: "EduWorld",          tier: "Bronze",   logo: "📚", contact: "partners@eduworld.in",   amount: "₹2L",   status: "Active",  since: "Apr 2025" },
];

const TIER_COLOR: Record<string, string> = {
  Title:    "#FF7A29",
  Platinum: "#E8F0FE",
  Gold:     "#F59E0B",
  Silver:   "#7A8EA8",
  Bronze:   "#CD7F32",
};

export default function SponsorsView() {
  const [showAdd, setShowAdd] = useState(false);

  const totalRevenue = SPONSORS.filter(s => s.status === "Active")
    .reduce((sum, s) => {
      const n = parseFloat(s.amount.replace("₹", "").replace("L", "")) * 100000;
      return sum + n;
    }, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#7A8EA8", fontSize: 14 }}>
          Total Sponsorship: <span style={{ color: "#22C55E", fontWeight: 900 }}>
            ₹{(totalRevenue / 100000).toFixed(0)}L
          </span>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: "10px 20px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
          color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
          cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
        }}>
          + Add Sponsor
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {SPONSORS.map(s => (
          <div key={s.id} style={{
            background: "#0D1B2E", borderRadius: 14,
            border: `1px solid ${TIER_COLOR[s.tier]}33`,
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${TIER_COLOR[s.tier]}22`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {s.logo}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{s.name}</div>
                <span style={{
                  background: `${TIER_COLOR[s.tier]}22`,
                  color: TIER_COLOR[s.tier],
                  borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {s.tier} Sponsor
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ["Amount", s.amount],
                ["Contact", s.contact],
                ["Since", s.since],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7A8EA8", fontSize: 12 }}>{k}</span>
                  <span style={{ color: "#E8F0FE", fontSize: 12, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: "#7A8EA8", fontSize: 12 }}>Status</span>
                <span style={{
                  background: s.status === "Active" ? "#22C55E22" : "#F59E0B22",
                  color: s.status === "Active" ? "#22C55E" : "#F59E0B",
                  borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                }}>
                  {s.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: "#0D1B2E", borderRadius: 16, padding: 32, width: 420, border: "1px solid rgba(255,255,255,.1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 18, marginBottom: 20 }}>Add Sponsor</div>
            {[
              { label: "Company Name", placeholder: "e.g. TechCorp India" },
              { label: "Contact Email", placeholder: "sponsor@company.com" },
              { label: "Amount (₹)", placeholder: "e.g. 500000" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</label>
                <input placeholder={f.placeholder} style={{ display: "block", width: "100%", marginTop: 8, padding: "11px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", fontSize: 13, boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif" }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Tier</label>
              <select style={{ display: "block", width: "100%", marginTop: 8, padding: "11px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", fontSize: 13, fontFamily: "'Montserrat', sans-serif" }}>
                {["Title","Platinum","Gold","Silver","Bronze"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ flex: 1, padding: 12, background: "linear-gradient(135deg,#FF7A29,#FF4500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Add</button>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,.06)", color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
