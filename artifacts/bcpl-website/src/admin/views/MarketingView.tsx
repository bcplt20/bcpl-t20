import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const referralLinks = [
  { code: "BCPL-INF01", name: "Rohit_Cricket22", platform: "Instagram", clicks: 4821, signups: 1243, revenue: "₹1,24,300", active: true },
  { code: "BCPL-INF02", name: "BCPLOfficial", platform: "YouTube", clicks: 3200, signups: 987, revenue: "₹98,700", active: true },
  { code: "BCPL-INF03", name: "CricketDhamaka", platform: "WhatsApp", clicks: 2890, signups: 743, revenue: "₹74,300", active: true },
  { code: "BCPL-INF04", name: "SportsBhai", platform: "Instagram", clicks: 1980, signups: 412, revenue: "₹41,200", active: false },
  { code: "BCPL-INF05", name: "RajCricket", platform: "YouTube", clicks: 1540, signups: 289, revenue: "₹28,900", active: true },
];

const platformPerf = [
  { platform: "WhatsApp", signups: 3200, revenue: 320000 },
  { platform: "Instagram", signups: 2100, revenue: 210000 },
  { platform: "YouTube", signups: 1800, revenue: 180000 },
  { platform: "Twitter", signups: 420, revenue: 42000 },
  { platform: "Facebook", signups: 310, revenue: 31000 },
  { platform: "Direct", signups: 600, revenue: 60000 },
];

const conversionTrend = [
  { day: "Jul 14", rate: 14 }, { day: "Jul 15", rate: 17 }, { day: "Jul 16", rate: 15 },
  { day: "Jul 17", rate: 22 }, { day: "Jul 18", rate: 19 }, { day: "Jul 19", rate: 26 }, { day: "Jul 20", rate: 24 },
];

const platformColor: Record<string, string> = {
  Instagram: "#E1306C", YouTube: "#FF0000", WhatsApp: "#25D366",
  Twitter: "#1DA1F2", Facebook: "#1877F2", Direct: "#6366F1",
};

export default function MarketingView() {
  const [tab, setTab] = useState<"referrals" | "platforms" | "campaigns">("referrals");
  const [showCreate, setShowCreate] = useState(false);
  const [newLink, setNewLink] = useState({ name: "", platform: "Instagram", code: "" });

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Marketing & Growth</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Track referrals, influencers, and acquisition channels</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Create Referral Link
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Referral Clicks", value: "14,431", icon: "🔗", color: "#6366F1" },
          { label: "Signups via Referral", value: "3,674", icon: "👥", color: "#10B981" },
          { label: "Referral Revenue", value: "₹3,67,400", icon: "💰", color: "#FF6B00" },
          { label: "Avg Conversion", value: "25.5%", icon: "📈", color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", marginTop: 8 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["referrals", "platforms", "campaigns"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 20px", borderRadius: 10, border: "1px solid",
            borderColor: tab === t ? "#FF6B00" : "#1E293B",
            background: tab === t ? "#FF6B0022" : "transparent",
            color: tab === t ? "#FF6B00" : "#64748B",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Referrals Tab */}
      {tab === "referrals" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Active Referral Links</div>
            <span style={{ fontSize: 11, color: "#64748B" }}>{referralLinks.filter(r => r.active).length} active links</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Ref Code", "Influencer", "Platform", "Clicks", "Signups", "Revenue", "Conv %", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referralLinks.map(r => (
                <tr key={r.code} style={{ borderBottom: "1px solid #0F1B2D" }}>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#FF6B00", background: "#FF6B0015", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>{r.code}</span>
                      <button onClick={() => navigator.clipboard?.writeText(`https://bcplt20.com/r/${r.code}`)} title="Copy" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#475569" }}>📋</button>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#F1F5F9", fontWeight: 600 }}>@{r.name}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: (platformColor[r.platform] || "#6366F1") + "22", color: platformColor[r.platform] || "#6366F1" }}>{r.platform}</span>
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#94A3B8" }}>{r.clicks.toLocaleString()}</td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#F1F5F9", fontWeight: 600 }}>{r.signups.toLocaleString()}</td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#10B981", fontWeight: 700 }}>{r.revenue}</td>
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#F59E0B", fontWeight: 700 }}>
                    {Math.round((r.signups / r.clicks) * 100)}%
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: r.active ? "#10B98122" : "#64748B22", color: r.active ? "#10B981" : "#64748B" }}>{r.active ? "Active" : "Paused"}</span>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>Edit</button>
                      <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #1E293B", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>Pause</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Platforms Tab */}
      {tab === "platforms" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Signups by Platform</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={platformPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis dataKey="platform" type="category" stroke="#334155" tick={{ fill: "#94A3B8", fontSize: 12 }} width={80} />
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 8 }} />
                <Bar dataKey="signups" fill="#FF6B00" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>7-Day Conversion Rate Trend</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 8 }} formatter={(v: any) => [`${v}%`, "Conversion"]} />
                <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>Platform Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
              {platformPerf.map(p => (
                <div key={p.platform} style={{ textAlign: "center", padding: "14px 8px", background: "#060B18", borderRadius: 12, border: "1px solid #1E293B" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>
                    {p.platform === "WhatsApp" ? "💬" : p.platform === "Instagram" ? "📸" : p.platform === "YouTube" ? "▶️" : p.platform === "Twitter" ? "🐦" : p.platform === "Facebook" ? "👥" : "🔗"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9" }}>{p.signups.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>{p.platform}</div>
                  <div style={{ fontSize: 11, color: "#10B981", marginTop: 4, fontWeight: 600 }}>₹{(p.revenue / 100).toFixed(0)}k</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { name: "BCPL Season 5 Launch", type: "WhatsApp Blast", sent: "12,400", opens: "9,840", clicks: "4,212", status: "Completed" },
            { name: "Phase 1 Reminder", type: "SMS", sent: "5,200", opens: "—", clicks: "1,820", status: "Completed" },
            { name: "Phase 2 Open Now", type: "Email", sent: "3,812", opens: "2,190", clicks: "891", status: "Running" },
            { name: "Finals Ticket Sale", type: "WhatsApp", sent: "—", opens: "—", clicks: "—", status: "Draft" },
          ].map(c => (
            <div key={c.name} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.type}</div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[{ label: "Sent", value: c.sent }, { label: "Opens", value: c.opens }, { label: "Clicks", value: c.clicks }].map(m => (
                  <div key={m.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>{m.label}</div>
                  </div>
                ))}
              </div>
              <span style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: c.status === "Running" ? "#10B98122" : c.status === "Completed" ? "#6366F122" : "#64748B22",
                color: c.status === "Running" ? "#10B981" : c.status === "Completed" ? "#818CF8" : "#64748B",
              }}>{c.status}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>View</button>
                {c.status === "Draft" && <button style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>Launch</button>}
              </div>
            </div>
          ))}
          <button style={{ padding: "14px", borderRadius: 12, border: "2px dashed #1E293B", background: "transparent", color: "#475569", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            + Create New Campaign
          </button>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 20 }}>Create Referral Link</div>
            {[
              { label: "Influencer / Channel Name", key: "name", placeholder: "e.g. Rohit_Cricket22" },
              { label: "Referral Code (leave blank to auto-generate)", key: "code", placeholder: "e.g. BCPL-INF06" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input value={(newLink as any)[f.key]} onChange={e => setNewLink(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Platform</label>
              <select value={newLink.platform} onChange={e => setNewLink(p => ({ ...p, platform: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" }}>
                {["Instagram", "YouTube", "WhatsApp", "Twitter", "Facebook", "Other"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ background: "#060B18", borderRadius: 10, padding: "12px 14px", marginBottom: 18, border: "1px solid #1E293B" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Generated Link Preview:</div>
              <div style={{ fontSize: 12, color: "#FF6B00", fontFamily: "monospace" }}>
                https://bcplt20.com/r/{newLink.code || "BCPL-INF06"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
