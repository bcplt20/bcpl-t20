const TXN = [
  { id: "TXN001", name: "Rahul Sharma",  amount: 499,  phase: "Phase 1", method: "UPI",       status: "Success", date: "20 Jul 2025" },
  { id: "TXN002", name: "Priya Patel",   amount: 1999, phase: "Phase 2", method: "NetBanking", status: "Success", date: "20 Jul 2025" },
  { id: "TXN003", name: "Amit Singh",    amount: 499,  phase: "Phase 1", method: "Card",       status: "Success", date: "19 Jul 2025" },
  { id: "TXN004", name: "Neha Joshi",    amount: 499,  phase: "Phase 1", method: "UPI",        status: "Failed",  date: "19 Jul 2025" },
  { id: "TXN005", name: "Karan Mehta",   amount: 1999, phase: "Phase 2", method: "UPI",        status: "Pending", date: "18 Jul 2025" },
  { id: "TXN006", name: "Pooja Nair",    amount: 499,  phase: "Phase 1", method: "Card",       status: "Success", date: "18 Jul 2025" },
  { id: "TXN007", name: "Suresh Kumar",  amount: 1999, phase: "Phase 2", method: "UPI",        status: "Success", date: "17 Jul 2025" },
  { id: "TXN008", name: "Ananya Das",    amount: 499,  phase: "Phase 1", method: "NetBanking", status: "Success", date: "17 Jul 2025" },
];

const STATUS_COLOR: Record<string, string> = {
  Success: "#22C55E",
  Failed:  "#EF4444",
  Pending: "#F59E0B",
};

function Card({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: "#0D1B2E", borderRadius: 14,
      border: `1px solid ${color}33`, padding: "22px 20px",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ color: "#fff", fontWeight: 900, fontSize: 28, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function FinanceView() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16, marginBottom: 28 }}>
        <Card label="Total Revenue"    value="₹24.68L"  sub="Phase 1 + 2"         color="#22C55E" />
        <Card label="Phase 1 Revenue"  value="₹6.21L"   sub="1245 × ₹499"         color="#3B9EFF" />
        <Card label="Phase 2 Revenue"  value="₹7.74L"   sub="387 × ₹1,999"        color="#A855F7" />
        <Card label="Failed Txns"      value="38"        sub="₹18,962 at risk"     color="#EF4444" />
        <Card label="Pending Txns"     value="12"        sub="Awaiting confirmation" color="#F59E0B" />
        <Card label="Refunds Issued"   value="₹3,493"   sub="7 refunds"            color="#FF7A29" />
      </div>

      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.07)", fontWeight: 900, color: "#fff" }}>
          Recent Transactions
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.04)" }}>
              {["Txn ID","Player","Amount","Phase","Method","Status","Date"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", color: "#7A8EA8",
                  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: ".06em", borderBottom: "1px solid rgba(255,255,255,.07)",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TXN.map((t, i) => (
              <tr
                key={t.id}
                style={{ borderBottom: i < TXN.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}
              >
                <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 12 }}>{t.id}</td>
                <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 13 }}>{t.name}</td>
                <td style={{ padding: "12px 16px", color: "#22C55E", fontWeight: 700, fontSize: 13 }}>₹{t.amount.toLocaleString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: t.phase === "Phase 1" ? "#3B9EFF22" : "#A855F722",
                    color: t.phase === "Phase 1" ? "#3B9EFF" : "#A855F7",
                    borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {t.phase}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#E8F0FE", fontSize: 13 }}>{t.method}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: `${STATUS_COLOR[t.status]}22`,
                    color: STATUS_COLOR[t.status],
                    borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700,
                  }}>
                    {t.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 12 }}>{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
