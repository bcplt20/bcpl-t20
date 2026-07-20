import { useState } from "react";

const TRANSACTIONS = [
  { id: "TXN8821", name: "Arjun Sharma", type: "Phase 2", amount: 5999, method: "UPI", status: "success", date: "20 Jul, 10:12 AM" },
  { id: "TXN8820", name: "Priya Nair", type: "Phase 2", amount: 5999, method: "Card", status: "success", date: "20 Jul, 10:08 AM" },
  { id: "TXN8819", name: "Rahul Patel", type: "Phase 1", amount: 499, method: "UPI", status: "success", date: "20 Jul, 09:55 AM" },
  { id: "TXN8818", name: "Deepak Verma", type: "Phase 2", amount: 5999, method: "Net Banking", status: "failed", date: "20 Jul, 09:41 AM" },
  { id: "TXN8817", name: "Suresh Kumar", type: "Phase 1", amount: 499, method: "UPI", status: "success", date: "20 Jul, 09:30 AM" },
  { id: "TXN8816", name: "Neha Gupta", type: "Phase 2", amount: 5999, method: "Card", status: "refunded", date: "19 Jul, 06:15 PM" },
  { id: "TXN8815", name: "Kartik Mehra", type: "Phase 1", amount: 499, method: "UPI", status: "pending", date: "19 Jul, 05:50 PM" },
  { id: "TXN8814", name: "Ankita Joshi", type: "Phase 2", amount: 5999, method: "UPI", status: "success", date: "19 Jul, 04:22 PM" },
  { id: "TXN8813", name: "Vikas Singh", type: "Phase 1", amount: 499, method: "Card", status: "success", date: "19 Jul, 02:11 PM" },
  { id: "TXN8812", name: "Mohit Yadav", type: "Phase 2", amount: 5999, method: "UPI", status: "failed", date: "19 Jul, 11:30 AM" },
];

const STATUS_C: Record<string, { bg: string; color: string }> = {
  success: { bg: "#10B98120", color: "#10B981" },
  failed: { bg: "#EF444420", color: "#EF4444" },
  pending: { bg: "#F59E0B20", color: "#F59E0B" },
  refunded: { bg: "#8B5CF620", color: "#8B5CF6" },
};

export default function FinanceView() {
  const [tab, setTab] = useState<"all" | "phase1" | "phase2" | "failed">("all");

  const filtered = TRANSACTIONS.filter(t => {
    if (tab === "phase1") return t.type === "Phase 1";
    if (tab === "phase2") return t.type === "Phase 2";
    if (tab === "failed") return t.status === "failed" || t.status === "refunded";
    return true;
  });

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Revenue Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: "₹38,40,498", sub: "+₹2.1L today", color: "#10B981", icon: "💰" },
          { label: "Phase 1 Collection", value: "₹5,49,899", sub: "1,101 players", color: "#3B82F6", icon: "🏏" },
          { label: "Phase 2 Collection", value: "₹32,90,599", sub: "612 players × ₹5,999", color: "#8B5CF6", icon: "🏆" },
          { label: "Pending / Failed", value: "₹9,42,163", sub: "63 transactions", color: "#EF4444", icon: "⚠️" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 4px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{s.sub}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Revenue by Payment Method</div>
          {[
            { method: "UPI", amount: "₹22.4L", pct: 58, color: "#3B82F6" },
            { method: "Credit/Debit Card", amount: "₹11.8L", pct: 31, color: "#8B5CF6" },
            { method: "Net Banking", amount: "₹4.2L", pct: 11, color: "#F59E0B" },
          ].map((m, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{m.method}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>{m.amount} <span style={{ color: "#475569" }}>({m.pct}%)</span></span>
              </div>
              <div style={{ height: 6, background: "#1E293B", borderRadius: 4 }}>
                <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 16, textTransform: "uppercase" }}>Daily Revenue (Last 7 Days)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {[
              { day: "14 Jul", val: 62 },
              { day: "15 Jul", val: 78 },
              { day: "16 Jul", val: 55 },
              { day: "17 Jul", val: 90 },
              { day: "18 Jul", val: 72 },
              { day: "19 Jul", val: 85 },
              { day: "20 Jul", val: 100 },
            ].map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: `${d.val}%`, background: i === 6 ? "#FF6B00" : "#1E3A5F", borderRadius: "4px 4px 0 0", transition: "height 0.5s", minHeight: 4 }} />
                <div style={{ fontSize: 8, color: "#334155", transform: "rotate(-30deg)", transformOrigin: "top center", whiteSpace: "nowrap" }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div style={card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, textTransform: "uppercase", flex: 1 }}>Transaction Log</div>
          {(["all", "phase1", "phase2", "failed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: tab === t ? "#FF6B00" : "#1E293B", color: tab === t ? "#fff" : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t === "all" ? "All" : t === "phase1" ? "Phase 1" : t === "phase2" ? "Phase 2" : "Failed/Refunded"}</button>
          ))}
          <button style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#10B98120", color: "#10B981", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⬇ Export</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Txn ID", "Player", "Type", "Amount", "Method", "Status", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid #0F172A" }}>
                  <td style={{ padding: "10px 12px", color: "#475569", fontFamily: "monospace", fontSize: 11 }}>{t.id}</td>
                  <td style={{ padding: "10px 12px", color: "#E2E8F0", fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{t.type}</td>
                  <td style={{ padding: "10px 12px", color: "#10B981", fontWeight: 700 }}>₹{t.amount.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "#64748B" }}>{t.method}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: STATUS_C[t.status].bg, color: STATUS_C[t.status].color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{t.status}</span></td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>{t.date}</td>
                  <td style={{ padding: "10px 12px" }}><button style={{ background: "none", border: "none", color: "#FF6B00", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
