import { useState } from "react";

const USERS = [
  { id: "BCPL001", name: "Arjun Sharma", phone: "9876543210", city: "Mumbai", role: "Batsman", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "12 Jul" },
  { id: "BCPL002", name: "Rahul Patel", phone: "9845123456", city: "Ahmedabad", role: "Bowler", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "12 Jul" },
  { id: "BCPL003", name: "Vikas Singh", phone: "9711234567", city: "Delhi", role: "All-Rounder", phase: 1, kyc: "pending", paid: "₹499", status: "pending", joined: "13 Jul" },
  { id: "BCPL004", name: "Priya Nair", phone: "9567891234", city: "Kochi", role: "WK-Batsman", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "13 Jul" },
  { id: "BCPL005", name: "Mohit Yadav", phone: "9823456781", city: "Lucknow", role: "Bowler", phase: 1, kyc: "rejected", paid: "₹499", status: "rejected", joined: "14 Jul" },
  { id: "BCPL006", name: "Suresh Kumar", phone: "9900112233", city: "Chennai", role: "Batsman", phase: 1, kyc: "pending", paid: "₹499", status: "pending", joined: "14 Jul" },
  { id: "BCPL007", name: "Deepak Verma", phone: "9654321098", city: "Pune", role: "All-Rounder", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "15 Jul" },
  { id: "BCPL008", name: "Ankita Joshi", phone: "9387654321", city: "Bangalore", role: "WK-Batsman", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "15 Jul" },
  { id: "BCPL009", name: "Kartik Mehra", phone: "9201345678", city: "Hyderabad", role: "Batsman", phase: 1, kyc: "pending", paid: "₹499", status: "pending", joined: "16 Jul" },
  { id: "BCPL010", name: "Neha Gupta", phone: "9512378901", city: "Jaipur", role: "Bowler", phase: 2, kyc: "verified", paid: "₹6,498", status: "active", joined: "16 Jul" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#10B98120", color: "#10B981" },
  pending: { bg: "#F59E0B20", color: "#F59E0B" },
  rejected: { bg: "#EF444420", color: "#EF4444" },
};
const KYC_COLORS: Record<string, { bg: string; color: string }> = {
  verified: { bg: "#10B98120", color: "#10B981" },
  pending: { bg: "#F59E0B20", color: "#F59E0B" },
  rejected: { bg: "#EF444420", color: "#EF4444" },
};

export default function UsersView() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.id.includes(q) || u.phone.includes(q) || u.city.toLowerCase().includes(q);
    const matchFilter = filter === "all" || u.status === filter || u.kyc === filter;
    return matchSearch && matchFilter;
  });

  const selectedUser = USERS.find(u => u.id === selected);

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Users", value: "1,284", color: "#3B82F6", icon: "👥" },
          { label: "Phase 2 Complete", value: "612", color: "#10B981", icon: "✅" },
          { label: "KYC Pending", value: "272", color: "#F59E0B", icon: "⏳" },
          { label: "Rejected", value: "47", color: "#EF4444", icon: "❌" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 16 }}>
        {/* Table */}
        <div style={card}>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search name, ID, phone, city..." style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 13, outline: "none" }} />
            {["all", "active", "pending", "rejected", "verified"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: filter === f ? "#FF6B00" : "#1E293B", color: filter === f ? "#fff" : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
            ))}
            <button style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "#10B98120", color: "#10B981", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>⬇ Export CSV</button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                  {["ID", "Name", "Phone", "City", "Role", "Phase", "KYC", "Paid", "Status", "Joined", ""].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} onClick={() => setSelected(selected === u.id ? null : u.id)} style={{ borderBottom: "1px solid #0F172A", cursor: "pointer", background: selected === u.id ? "#FF6B0008" : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: "#475569", fontFamily: "monospace" }}>{u.id}</td>
                    <td style={{ padding: "10px 12px", color: "#E2E8F0", fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: "10px 12px", color: "#64748B" }}>{u.phone}</td>
                    <td style={{ padding: "10px 12px", color: "#64748B" }}>{u.city}</td>
                    <td style={{ padding: "10px 12px", color: "#94A3B8" }}>{u.role}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: u.phase === 2 ? "#10B98120" : "#F59E0B20", color: u.phase === 2 ? "#10B981" : "#F59E0B", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>Phase {u.phase}</span></td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: KYC_COLORS[u.kyc].bg, color: KYC_COLORS[u.kyc].color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{u.kyc}</span></td>
                    <td style={{ padding: "10px 12px", color: "#10B981", fontWeight: 700 }}>{u.paid}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: STATUS_COLORS[u.status].bg, color: STATUS_COLORS[u.status].color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }}>{u.status}</span></td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{u.joined}</td>
                    <td style={{ padding: "10px 12px" }}><button style={{ background: "none", border: "none", color: "#FF6B00", cursor: "pointer", fontSize: 16 }}>›</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "#475569" }}>Showing {filtered.length} of {USERS.length} users</div>
        </div>

        {/* User Detail Panel */}
        {selectedUser && (
          <div style={{ ...card, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>Player Profile</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FF6B0020", border: "2px solid #FF6B0040", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#FF6B00" }}>{selectedUser.name.split(" ").map(w => w[0]).join("")}</div>
              <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800, color: "#E2E8F0" }}>{selectedUser.name}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{selectedUser.id} · {selectedUser.role}</div>
            </div>
            {[
              ["Phone", selectedUser.phone],
              ["City", selectedUser.city],
              ["Phase", `Phase ${selectedUser.phase}`],
              ["KYC Status", selectedUser.kyc],
              ["Total Paid", selectedUser.paid],
              ["Joined", selectedUser.joined],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #0F172A", fontSize: 12 }}>
                <span style={{ color: "#475569" }}>{k}</span>
                <span style={{ color: "#CBD5E1", fontWeight: 600, textTransform: "capitalize" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#10B98120", color: "#10B981", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Approve KYC</button>
              <button style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#EF444420", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✗ Reject</button>
            </div>
            <button style={{ width: "100%", marginTop: 8, padding: "9px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📧 Send Email</button>
          </div>
        )}
      </div>
    </div>
  );
}
