import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const userGrowthData = {
  today: [
    { time: "12am", users: 4 }, { time: "2am", users: 2 }, { time: "4am", users: 1 },
    { time: "6am", users: 8 }, { time: "8am", users: 24 }, { time: "10am", users: 41 },
    { time: "12pm", users: 63 }, { time: "2pm", users: 55 }, { time: "4pm", users: 78 },
    { time: "6pm", users: 94 }, { time: "8pm", users: 112 }, { time: "10pm", users: 87 },
  ],
  week: [
    { time: "Mon", users: 312 }, { time: "Tue", users: 428 }, { time: "Wed", users: 389 },
    { time: "Thu", users: 512 }, { time: "Fri", users: 601 }, { time: "Sat", users: 743 },
    { time: "Sun", users: 689 },
  ],
  month: [
    { time: "Jul 1", users: 120 }, { time: "Jul 5", users: 340 }, { time: "Jul 8", users: 280 },
    { time: "Jul 10", users: 520 }, { time: "Jul 13", users: 690 }, { time: "Jul 15", users: 870 },
    { time: "Jul 17", users: 1020 }, { time: "Jul 19", users: 1340 }, { time: "Jul 20", users: 1180 },
  ],
};

const funnelData = [
  { name: "Visited", value: 14820, color: "#334155" },
  { name: "Registered", value: 8430, color: "#FF6B00" },
  { name: "Phase 1 Paid", value: 3812, color: "#F59E0B" },
  { name: "Phase 2 Paid", value: 1247, color: "#10B981" },
];

const sourceData = [
  { name: "WhatsApp", value: 38, color: "#25D366" },
  { name: "Instagram", value: 27, color: "#E1306C" },
  { name: "YouTube", value: 18, color: "#FF0000" },
  { name: "Direct", value: 10, color: "#6366F1" },
  { name: "Others", value: 7, color: "#64748B" },
];

const topInfluencers = [
  { name: "Rohit_Cricket22", platform: "Instagram", clicks: 4821, signups: 1243, conversion: "25.8%", revenue: "₹1,24,300" },
  { name: "BCPLOfficial", platform: "YouTube", clicks: 3200, signups: 987, conversion: "30.8%", revenue: "₹98,700" },
  { name: "CricketDhamaka", platform: "WhatsApp", clicks: 2890, signups: 743, conversion: "25.7%", revenue: "₹74,300" },
  { name: "SportsBhai", platform: "Instagram", clicks: 1980, signups: 412, conversion: "20.8%", revenue: "₹41,200" },
];

const liveActivity = [
  { msg: "Arjun Sharma completed Phase 1 payment", time: "2s ago", type: "payment" },
  { msg: "New user registered from Rajasthan", time: "14s ago", type: "user" },
  { msg: "Priya Patel uploaded selection video", time: "32s ago", type: "media" },
  { msg: "Team Mumbai Stars updated roster", time: "1m ago", type: "team" },
  { msg: "Referral link BCPL-INF12 got 5 signups", time: "2m ago", type: "referral" },
  { msg: "Rahul Kumar Phase 2 payment done", time: "3m ago", type: "payment" },
  { msg: "New user registered from Maharashtra", time: "4m ago", type: "user" },
  { msg: "Match Gujarat vs Rajasthan scheduled", time: "6m ago", type: "match" },
];

const activityColor: Record<string, string> = {
  payment: "#10B981", user: "#6366F1", media: "#F59E0B",
  team: "#FF6B00", referral: "#EC4899", match: "#3B82F6",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 16px" }}>
        <p style={{ color: "#94A3B8", fontSize: 11, margin: "0 0 4px" }}>{label}</p>
        <p style={{ color: "#FF6B00", fontSize: 16, fontWeight: 700, margin: 0 }}>{payload[0].value.toLocaleString()} users</p>
      </div>
    );
  }
  return null;
};

export default function DashboardView() {
  const [range, setRange] = useState<"today" | "week" | "month">("week");

  const metricCards = [
    { label: "Live Right Now", value: "247", sub: "+12 in last 5m", color: "#10B981", icon: "🟢", live: true },
    { label: "Total Users", value: "8,430", sub: "+124 today", color: "#6366F1", icon: "👥" },
    { label: "Active Users", value: "3,218", sub: "last 7 days", color: "#3B82F6", icon: "⚡" },
    { label: "Phase 1 Paid", value: "3,812", sub: "₹3,81,200 revenue", color: "#F59E0B", icon: "💳" },
    { label: "Phase 2 Paid", value: "1,247", sub: "₹2,49,400 revenue", color: "#FF6B00", icon: "🏆" },
    { label: "Dropped Off", value: "4,618", sub: "registered, no payment", color: "#EF4444", icon: "❌" },
  ];

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B",
    borderRadius: 16,
    padding: 20,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {metricCards.map((m) => (
          <div key={m.label} style={{
            ...card,
            borderLeft: `3px solid ${m.color}`,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${m.color}18 0%, transparent 70%)`, borderRadius: "50%" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              {m.live && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
                  <span style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>LIVE</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", letterSpacing: -1 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: m.color, marginTop: 6, fontWeight: 600 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>User Registration Growth</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Total new registrations over time</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["today", "week", "month"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: range === r ? "#FF6B00" : "#1E293B",
                color: range === r ? "#fff" : "#64748B",
                fontSize: 12, fontWeight: 700, textTransform: "capitalize",
              }}>{r}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={userGrowthData[range]}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="time" stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="users" stroke="#FF6B00" strokeWidth={2.5} fill="url(#userGrad)" dot={{ fill: "#FF6B00", r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel + Source + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Payment Funnel */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Registration Funnel</div>
          {funnelData.map((f, i) => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{f.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{f.value.toLocaleString()}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: "#1E293B", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, background: f.color,
                  width: `${(f.value / 14820) * 100}%`,
                  transition: "width 1s ease",
                }} />
              </div>
              {i < funnelData.length - 1 && (
                <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                  ↓ {Math.round((funnelData[i + 1].value / f.value) * 100)}% converted
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Traffic Sources Donut */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Traffic Sources</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                {sourceData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, ""]} contentStyle={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {sourceData.map(s => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F1F5F9" }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 8px #10B981" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Live Activity</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: 260 }}>
            {liveActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: activityColor[a.type], marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.4 }}>{a.msg}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Influencers */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Top Referral Performers</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Influencer / Channel", "Platform", "Clicks", "Signups", "Conversion", "Revenue"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topInfluencers.map((inf, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F1B2D" }}>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#F1F5F9", fontWeight: 600 }}>@{inf.name}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: inf.platform === "Instagram" ? "#E1306C22" : inf.platform === "YouTube" ? "#FF000022" : "#25D36622", color: inf.platform === "Instagram" ? "#E1306C" : inf.platform === "YouTube" ? "#FF0000" : "#25D366" }}>
                      {inf.platform}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#94A3B8" }}>{inf.clicks.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#F1F5F9", fontWeight: 600 }}>{inf.signups.toLocaleString()}</td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{ color: "#10B981", fontWeight: 700, fontSize: 13 }}>{inf.conversion}</span>
                  </td>
                  <td style={{ padding: "12px 12px", fontSize: 13, color: "#FF6B00", fontWeight: 700 }}>{inf.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
