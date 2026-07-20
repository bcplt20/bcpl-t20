import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const dailyRevenue = [
  { day: "Jul 14", p1: 12400, p2: 4200 }, { day: "Jul 15", p1: 18700, p2: 7800 },
  { day: "Jul 16", p1: 14200, p2: 5600 }, { day: "Jul 17", p1: 22100, p2: 9400 },
  { day: "Jul 18", p1: 28900, p2: 14200 }, { day: "Jul 19", p1: 31400, p2: 18700 },
  { day: "Jul 20", p1: 24800, p2: 11200 },
];

const paymentMethods = [
  { name: "UPI", value: 62, color: "#6366F1" },
  { name: "Net Banking", value: 19, color: "#FF6B00" },
  { name: "Card", value: 14, color: "#10B981" },
  { name: "Wallet", value: 5, color: "#F59E0B" },
];

const transactions = [
  { id: "TXN001", name: "Arjun Sharma", type: "Phase 2", amount: "₹200", method: "UPI", time: "Today 8:24 PM", status: "success" },
  { id: "TXN002", name: "Priya Patel", type: "Phase 1", amount: "₹100", method: "Card", time: "Today 7:51 PM", status: "success" },
  { id: "TXN003", name: "Rahul Kumar", type: "Phase 2", amount: "₹200", method: "Net Banking", time: "Today 6:38 PM", status: "pending" },
  { id: "TXN004", name: "Sneha Verma", type: "Phase 1", amount: "₹100", method: "UPI", time: "Today 5:12 PM", status: "failed" },
  { id: "TXN005", name: "Vikas Singh", type: "Phase 1", amount: "₹100", method: "UPI", time: "Today 4:44 PM", status: "success" },
  { id: "TXN006", name: "Deepak Gupta", type: "Phase 2", amount: "₹200", method: "Wallet", time: "Today 3:29 PM", status: "success" },
  { id: "TXN007", name: "Meena Joshi", type: "Phase 1", amount: "₹100", method: "UPI", time: "Today 2:11 PM", status: "refunded" },
  { id: "TXN008", name: "Kavita Nair", type: "Phase 2", amount: "₹200", method: "Card", time: "Today 1:05 PM", status: "success" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  success: { color: "#10B981", bg: "#10B98122" },
  pending: { color: "#F59E0B", bg: "#F59E0B22" },
  failed: { color: "#EF4444", bg: "#EF444422" },
  refunded: { color: "#6366F1", bg: "#6366F122" },
};

export default function FinanceView() {
  const [txnFilter, setTxnFilter] = useState<"all" | "success" | "pending" | "failed" | "refunded">("all");

  const filteredTxns = txnFilter === "all" ? transactions : transactions.filter(t => t.status === txnFilter);

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 16px" }}>
          <p style={{ color: "#94A3B8", fontSize: 11, margin: "0 0 6px" }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color, fontSize: 14, fontWeight: 700, margin: "2px 0" }}>
              {p.name === "p1" ? "Phase 1" : "Phase 2"}: ₹{p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Revenue Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Total Revenue", value: "₹6,30,600", sub: "All phases combined", color: "#FF6B00", icon: "💰", delta: "+12.4%" },
          { label: "Phase 1 Revenue", value: "₹3,81,200", sub: "3,812 payments × ₹100", color: "#F59E0B", icon: "💳", delta: "+8.2%" },
          { label: "Phase 2 Revenue", value: "₹2,49,400", sub: "1,247 payments × ₹200", color: "#10B981", icon: "🏆", delta: "+24.7%" },
          { label: "Pending / Failed", value: "₹48,200", sub: "482 failed transactions", color: "#EF4444", icon: "⚠️", delta: "-3.1%" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: `3px solid ${s.color}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(${s.color}18, transparent 70%)`, borderRadius: "50%" }} />
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{s.label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "#334155" }}>{s.sub}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.delta.startsWith("+") ? "#10B981" : "#EF4444" }}>{s.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Payment Methods */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Daily Revenue — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="day" stroke="#334155" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis stroke="#334155" tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="p1" fill="#F59E0B" radius={[4, 4, 0, 0]} name="p1" />
              <Bar dataKey="p2" fill="#10B981" radius={[4, 4, 0, 0]} name="p2" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#F59E0B" }} />
              <span style={{ fontSize: 11, color: "#64748B" }}>Phase 1 (₹100/user)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: "#10B981" }} />
              <span style={{ fontSize: 11, color: "#64748B" }}>Phase 2 (₹200/user)</span>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Payment Methods</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                {paymentMethods.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v}%`, ""]} contentStyle={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          {paymentMethods.map(m => (
            <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{m.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{m.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Log */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Transaction Log</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "success", "pending", "failed", "refunded"] as const).map(f => (
              <button key={f} onClick={() => setTxnFilter(f)} style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid",
                borderColor: txnFilter === f ? (f === "all" ? "#FF6B00" : statusConfig[f]?.color || "#FF6B00") : "#1E293B",
                background: txnFilter === f ? ((f === "all" ? "#FF6B00" : statusConfig[f]?.color || "#FF6B00") + "22") : "transparent",
                color: txnFilter === f ? (f === "all" ? "#FF6B00" : statusConfig[f]?.color) : "#64748B",
                fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
              }}>{f}</button>
            ))}
            <button style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 11, cursor: "pointer", marginLeft: 4 }}>⬇ Export</button>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1E293B" }}>
              {["Txn ID", "Player", "Phase", "Amount", "Method", "Time", "Status"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #0F1B2D" }}>
                <td style={{ padding: "12px 12px", fontFamily: "monospace", fontSize: 11, color: "#475569" }}>{t.id}</td>
                <td style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{t.name}</td>
                <td style={{ padding: "12px 12px" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: t.type === "Phase 2" ? "#10B98122" : "#F59E0B22", color: t.type === "Phase 2" ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{t.type}</span>
                </td>
                <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 800, color: "#FF6B00" }}>{t.amount}</td>
                <td style={{ padding: "12px 12px", fontSize: 12, color: "#94A3B8" }}>{t.method}</td>
                <td style={{ padding: "12px 12px", fontSize: 11, color: "#475569" }}>{t.time}</td>
                <td style={{ padding: "12px 12px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: statusConfig[t.status].bg, color: statusConfig[t.status].color, textTransform: "capitalize" }}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
