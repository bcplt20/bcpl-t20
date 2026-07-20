import { useState } from "react";

export default function MarketingView() {
  const [tab, setTab] = useState<"campaigns" | "referrals" | "whatsapp" | "email" | "sms">("campaigns");

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  const campaigns = [
    { name: "Phase 2 Open – Final Push", channel: "WhatsApp + Email", sent: 1284, opened: 934, clicked: 612, conv: "47.7%", status: "active" },
    { name: "KYC Reminder – Pending Users", channel: "SMS + WhatsApp", sent: 272, opened: 198, clicked: 143, conv: "52.6%", status: "active" },
    { name: "Early Bird Registration", channel: "Email", sent: 5420, opened: 1840, clicked: 920, conv: "17.0%", status: "completed" },
    { name: "Referral Bonus Announcement", channel: "WhatsApp", sent: 847, opened: 712, clicked: 534, conv: "63.0%", status: "completed" },
    { name: "Video Upload Reminder", channel: "SMS", sent: 1101, opened: 850, clicked: 610, conv: "55.4%", status: "completed" },
  ];

  const referrals = [
    { code: "ARJUN50", name: "Arjun Sharma", uses: 14, earned: "₹700", status: "active" },
    { code: "RAHUL30", name: "Rahul Patel", uses: 9, earned: "₹450", status: "active" },
    { code: "VIKAS25", name: "Vikas Singh", uses: 6, earned: "₹300", status: "active" },
    { code: "PRIYA40", name: "Priya Nair", uses: 11, earned: "₹550", status: "active" },
    { code: "MOHIT15", name: "Mohit Yadav", uses: 2, earned: "₹100", status: "paused" },
  ];

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Campaigns", value: "12", color: "#3B82F6", icon: "📣" },
          { label: "Messages Sent", value: "8,924", color: "#8B5CF6", icon: "📨" },
          { label: "Avg Open Rate", value: "68.3%", color: "#10B981", icon: "👁" },
          { label: "Conversions", value: "612", color: "#FF6B00", icon: "🎯" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["campaigns", "referrals", "whatsapp", "email", "sms"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: 10, border: tab === t ? "none" : "1px solid #1E293B", background: tab === t ? "#FF6B00" : "#0D1526", color: tab === t ? "#fff" : "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" } as React.CSSProperties}>{t}</button>
        ))}
        <button style={{ marginLeft: "auto", padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ New Campaign</button>
      </div>

      {tab === "campaigns" && (
        <div style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Campaign", "Channel", "Sent", "Opened", "Clicked", "Conv. Rate", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F172A" }}>
                  <td style={{ padding: "12px 12px", color: "#E2E8F0", fontWeight: 600, maxWidth: 200 }}>{c.name}</td>
                  <td style={{ padding: "12px 12px", color: "#64748B", fontSize: 11 }}>{c.channel}</td>
                  <td style={{ padding: "12px 12px", color: "#94A3B8" }}>{c.sent.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", color: "#94A3B8" }}>{c.opened.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", color: "#94A3B8" }}>{c.clicked.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", color: "#10B981", fontWeight: 700 }}>{c.conv}</td>
                  <td style={{ padding: "12px 12px" }}><span style={{ background: c.status === "active" ? "#10B98120" : "#1E293B", color: c.status === "active" ? "#10B981" : "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{c.status}</span></td>
                  <td style={{ padding: "12px 12px" }}><button style={{ background: "none", border: "none", color: "#FF6B00", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "referrals" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Active Referral Codes</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  {["Code", "Player", "Uses", "Earned", "Status"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0F172A" }}>
                    <td style={{ padding: "9px 10px", color: "#FF6B00", fontFamily: "monospace", fontWeight: 700 }}>{r.code}</td>
                    <td style={{ padding: "9px 10px", color: "#E2E8F0" }}>{r.name}</td>
                    <td style={{ padding: "9px 10px", color: "#94A3B8" }}>{r.uses}</td>
                    <td style={{ padding: "9px 10px", color: "#10B981", fontWeight: 700 }}>{r.earned}</td>
                    <td style={{ padding: "9px 10px" }}><span style={{ background: r.status === "active" ? "#10B98120" : "#EF444420", color: r.status === "active" ? "#10B981" : "#EF4444", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Referral Stats</div>
            {[
              { label: "Total Referral Signups", value: "42", color: "#3B82F6" },
              { label: "Bonus Paid Out", value: "₹2,100", color: "#10B981" },
              { label: "Conversion from Referral", value: "71.4%", color: "#FF6B00" },
              { label: "Top Referrer", value: "Arjun Sharma (14)", color: "#F59E0B" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #0F172A", fontSize: 13 }}>
                <span style={{ color: "#64748B" }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
            <button style={{ width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Generate New Code</button>
          </div>
        </div>
      )}

      {(tab === "whatsapp" || tab === "email" || tab === "sms") && (
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 20, textTransform: "uppercase" }}>New {tab.toUpperCase()} Campaign</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Campaign Name", placeholder: "e.g. Phase 2 Final Reminder" },
              { label: "Target Audience", placeholder: "e.g. Phase 1 Paid, KYC Pending" },
            ].map((f, i) => (
              <div key={i}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{f.label.toUpperCase()}</label>
                <input placeholder={f.placeholder} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>MESSAGE CONTENT</label>
            <textarea rows={5} placeholder={`Write your ${tab} message here...`} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save Draft</button>
            <button style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🚀 Send Campaign</button>
          </div>
        </div>
      )}
    </div>
  );
}
