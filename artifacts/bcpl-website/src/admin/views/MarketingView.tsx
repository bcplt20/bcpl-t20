import { useState } from "react";

const CAMPAIGNS = [
  { id: 1, name: "Phase 1 Launch",     channel: "WhatsApp + SMS", sent: 12400, opens: 8760, clicks: 3210, status: "Completed" },
  { id: 2, name: "Video Upload Reminder", channel: "SMS",         sent: 903,  opens: 542,  clicks: 310,  status: "Completed" },
  { id: 3, name: "Phase 2 Opening",    channel: "Email + WhatsApp", sent: 1245, opens: 942, clicks: 387,  status: "Active" },
  { id: 4, name: "Auction Day Hype",   channel: "WhatsApp",       sent: 0,    opens: 0,    clicks: 0,    status: "Scheduled" },
];

const STATUS_COLOR: Record<string, string> = {
  Completed: "#22C55E",
  Active:    "#3B9EFF",
  Scheduled: "#F59E0B",
  Draft:     "#7A8EA8",
};

export default function MarketingView() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={() => setShowNew(true)}
          style={{
            padding: "10px 20px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
            color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
            cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif",
          }}
        >
          + New Campaign
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Sent",    value: "14,548",  color: "#3B9EFF" },
          { label: "Total Opens",   value: "10,244",  color: "#22C55E" },
          { label: "Total Clicks",  value: "3,907",   color: "#A855F7" },
          { label: "Avg CTR",       value: "26.8%",   color: "#FF7A29" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#0D1B2E", borderRadius: 12,
            border: `1px solid ${s.color}33`,
            borderTop: `3px solid ${s.color}`,
            padding: "18px 16px",
          }}>
            <div style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 24, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Campaigns */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", fontWeight: 900, color: "#fff" }}>
          Campaigns
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.04)" }}>
              {["Campaign","Channel","Sent","Opens","Clicks","CTR","Status",""].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left",
                  color: "#7A8EA8", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: ".06em",
                  borderBottom: "1px solid rgba(255,255,255,.07)",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < CAMPAIGNS.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 13 }}>{c.name}</td>
                <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 12 }}>{c.channel}</td>
                <td style={{ padding: "12px 16px", color: "#E8F0FE", fontSize: 13 }}>{c.sent.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", color: "#E8F0FE", fontSize: 13 }}>{c.opens.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", color: "#E8F0FE", fontSize: 13 }}>{c.clicks.toLocaleString()}</td>
                <td style={{ padding: "12px 16px", color: "#22C55E", fontWeight: 700, fontSize: 13 }}>
                  {c.sent > 0 ? `${((c.clicks / c.sent) * 100).toFixed(1)}%` : "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: `${STATUS_COLOR[c.status]}22`,
                    color: STATUS_COLOR[c.status],
                    borderRadius: 6, padding: "3px 8px",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button style={{
                    padding: "5px 12px", background: "rgba(255,255,255,.06)",
                    color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Campaign Modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setShowNew(false)}>
          <div style={{ background: "#0D1B2E", borderRadius: 16, padding: 32, width: 440, border: "1px solid rgba(255,255,255,.1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 18, marginBottom: 20 }}>New Campaign</div>
            {[
              { label: "Campaign Name", type: "text", placeholder: "e.g. Phase 2 Reminder" },
              { label: "Message", type: "textarea", placeholder: "Enter your message…" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ color: "#7A8EA8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea placeholder={f.placeholder} rows={4} style={{ display: "block", width: "100%", marginTop: 8, padding: "12px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif" }} />
                ) : (
                  <input type={f.type} placeholder={f.placeholder} style={{ display: "block", width: "100%", marginTop: 8, padding: "12px 14px", background: "#06101E", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, color: "#fff", fontSize: 13, boxSizing: "border-box", fontFamily: "'Montserrat', sans-serif" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ flex: 1, padding: 12, background: "linear-gradient(135deg,#FF7A29,#FF4500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Send Campaign</button>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,.06)", color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
