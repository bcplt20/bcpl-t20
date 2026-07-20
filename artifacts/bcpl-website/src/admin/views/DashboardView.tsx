export default function DashboardView() {
  const stats = [
    { label: "Total Registrations", value: "1,284", change: "+124 today", up: true, icon: "👥", color: "#3B82F6" },
    { label: "Revenue Collected", value: "₹38.4L", change: "+₹2.1L today", up: true, icon: "💰", color: "#10B981" },
    { label: "KYC Verified", value: "847", change: "66% complete", up: true, icon: "🪪", color: "#8B5CF6" },
    { label: "Teams Formed", value: "12 / 16", change: "4 slots left", up: false, icon: "👕", color: "#F59E0B" },
    { label: "Live Users", value: "247", change: "right now", up: true, icon: "🟢", color: "#10B981" },
    { label: "Pending Payments", value: "63", change: "₹9.4L due", up: false, icon: "⏳", color: "#EF4444" },
  ];

  const funnel = [
    { label: "Visited", value: 8420, pct: 100, color: "#3B82F6" },
    { label: "Registered", value: 1284, pct: 15.2, color: "#8B5CF6" },
    { label: "Phase 1 Paid", value: 1101, pct: 85.7, color: "#F59E0B" },
    { label: "Video Submitted", value: 934, pct: 84.8, color: "#10B981" },
    { label: "KYC Done", value: 847, pct: 90.6, color: "#06B6D4" },
    { label: "Phase 2 Paid", value: 612, pct: 72.3, color: "#FF6B00" },
  ];

  const recent = [
    { name: "Arjun Sharma", action: "Phase 2 Payment ₹5,999", time: "12s ago", status: "success", avatar: "AS" },
    { name: "Rahul Patel", action: "KYC Verified", time: "1m ago", status: "success", avatar: "RP" },
    { name: "Vikas Singh", action: "Video Uploaded — Batsman", time: "3m ago", status: "info", avatar: "VS" },
    { name: "Priya Nair", action: "Phase 1 Payment ₹499", time: "7m ago", status: "success", avatar: "PN" },
    { name: "Mohit Yadav", action: "KYC Rejected — Doc unclear", time: "12m ago", status: "error", avatar: "MY" },
    { name: "Suresh Kumar", action: "Registered (Phase 1)", time: "18m ago", status: "info", avatar: "SK" },
    { name: "Deepak Verma", action: "Phase 2 Payment Failed", time: "25m ago", status: "error", avatar: "DV" },
  ];

  const topStates = [
    { state: "Maharashtra", count: 312, pct: 24 },
    { state: "Delhi", count: 198, pct: 15 },
    { state: "Karnataka", count: 167, pct: 13 },
    { state: "Gujarat", count: 143, pct: 11 },
    { state: "Tamil Nadu", count: 128, pct: 10 },
    { state: "Others", count: 336, pct: 27 },
  ];

  const s = {
    page: { padding: 28, fontFamily: "'Inter', sans-serif" } as React.CSSProperties,
    grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 } as React.CSSProperties,
    card: { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" as const },
    value: { fontSize: 28, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 4px" },
    change: { fontSize: 12, color: "#64748B" },
    sectionTitle: { fontSize: 13, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" as const },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 } as React.CSSProperties,
    row3: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      {/* Stats Grid */}
      <div style={s.grid}>
        {stats.map((stat, i) => (
          <div key={i} style={{ ...s.card, borderLeft: `3px solid ${stat.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={s.label}>{stat.label}</div>
                <div style={s.value}>{stat.value}</div>
                <div style={{ ...s.change, color: stat.up ? "#10B981" : "#EF4444" }}>
                  {stat.up ? "↑" : "↓"} {stat.change}
                </div>
              </div>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel + Recent Activity */}
      <div style={s.row3}>
        {/* Registration Funnel */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Registration Funnel</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {funnel.map((f, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>{f.value.toLocaleString()} <span style={{ color: "#475569", fontWeight: 400 }}>({f.pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${f.pct}%`, height: "100%", background: f.color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top States */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Top States</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topStates.map((st, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B00", opacity: 1 - i * 0.13 }} />
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{st.state}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>{st.count}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{st.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ ...s.card, marginTop: 16 }}>
        <div style={s.sectionTitle}>Live Activity Feed</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recent.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < recent.length - 1 ? "1px solid #0F172A" : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#94A3B8", flexShrink: 0 }}>{r.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{r.action}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#334155" }}>{r.time}</div>
                <div style={{ marginTop: 3, display: "inline-block", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: r.status === "success" ? "#10B98120" : r.status === "error" ? "#EF444420" : "#3B82F620", color: r.status === "success" ? "#10B981" : r.status === "error" ? "#EF4444" : "#3B82F6" }}>
                  {r.status === "success" ? "✓ Success" : r.status === "error" ? "✗ Failed" : "ℹ Info"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
