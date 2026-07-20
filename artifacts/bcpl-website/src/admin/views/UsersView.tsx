import { useState } from "react";

const allUsers = [
  { id: 1, name: "Arjun Sharma", phone: "9876543210", email: "arjun@gmail.com", state: "Rajasthan", city: "Jaipur", joined: "Jul 18", phase1: true, phase2: true, active: true, kyc: "approved", video: true },
  { id: 2, name: "Priya Patel", phone: "9123456789", email: "priya@gmail.com", state: "Gujarat", city: "Ahmedabad", joined: "Jul 17", phase1: true, phase2: false, active: true, kyc: "approved", video: true },
  { id: 3, name: "Rahul Kumar", phone: "8765432109", email: "rahul@gmail.com", state: "Maharashtra", city: "Mumbai", joined: "Jul 16", phase1: true, phase2: true, active: true, kyc: "pending", video: false },
  { id: 4, name: "Sneha Verma", phone: "7654321098", email: "sneha@gmail.com", state: "UP", city: "Lucknow", joined: "Jul 15", phase1: false, phase2: false, active: false, kyc: "pending", video: false },
  { id: 5, name: "Vikas Singh", phone: "6543210987", email: "vikas@gmail.com", state: "Punjab", city: "Amritsar", joined: "Jul 14", phase1: true, phase2: false, active: true, kyc: "approved", video: true },
  { id: 6, name: "Anjali Rao", phone: "9012345678", email: "anjali@gmail.com", state: "Karnataka", city: "Bangalore", joined: "Jul 14", phase1: false, phase2: false, active: false, kyc: "rejected", video: false },
  { id: 7, name: "Deepak Gupta", phone: "8901234567", email: "deepak@gmail.com", state: "Delhi", city: "New Delhi", joined: "Jul 13", phase1: true, phase2: true, active: true, kyc: "approved", video: true },
  { id: 8, name: "Meena Joshi", phone: "7890123456", email: "meena@gmail.com", state: "MP", city: "Bhopal", joined: "Jul 12", phase1: true, phase2: false, active: true, kyc: "pending", video: false },
  { id: 9, name: "Sanjay Yadav", phone: "6789012345", email: "sanjay@gmail.com", state: "Bihar", city: "Patna", joined: "Jul 12", phase1: false, phase2: false, active: true, kyc: "pending", video: false },
  { id: 10, name: "Kavita Nair", phone: "5678901234", email: "kavita@gmail.com", state: "Kerala", city: "Kochi", joined: "Jul 11", phase1: true, phase2: true, active: true, kyc: "approved", video: true },
];

type Filter = "all" | "active" | "inactive" | "phase1" | "phase2" | "no_payment";

const filterLabels: Record<Filter, string> = {
  all: "All Users",
  active: "Active",
  inactive: "Inactive",
  phase1: "Phase 1 Paid",
  phase2: "Phase 2 Paid",
  no_payment: "No Payment",
};

export default function UsersView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof allUsers[0] | null>(null);

  const stats = [
    { label: "Total Users", value: "8,430", color: "#6366F1" },
    { label: "Active (7d)", value: "3,218", color: "#10B981" },
    { label: "Inactive", value: "5,212", color: "#64748B" },
    { label: "Phase 1 Paid", value: "3,812", color: "#F59E0B" },
    { label: "Phase 2 Paid", value: "1,247", color: "#FF6B00" },
    { label: "No Payment", value: "4,618", color: "#EF4444" },
  ];

  const filtered = allUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) || u.state.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? u.active :
      filter === "inactive" ? !u.active :
      filter === "phase1" ? u.phase1 :
      filter === "phase2" ? u.phase2 :
      filter === "no_payment" ? (!u.phase1 && !u.phase2) : true;
    return matchSearch && matchFilter;
  });

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg, #0D1526 0%, #0A1020 100%)",
    border: "1px solid #1E293B",
    borderRadius: 16,
    padding: 20,
  };

  const kycColor = (k: string) =>
    k === "approved" ? "#10B981" : k === "rejected" ? "#EF4444" : "#F59E0B";

  return (
    <div style={{ display: "flex", gap: 16, height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

        {/* Stat Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} onClick={() => {
              const map: Record<string, Filter> = {
                "Total Users": "all", "Active (7d)": "active", "Inactive": "inactive",
                "Phase 1 Paid": "phase1", "Phase 2 Paid": "phase2", "No Payment": "no_payment"
              };
              setFilter(map[s.label] || "all");
            }} style={{
              ...card, padding: 14, cursor: "pointer", borderTop: `3px solid ${s.color}`,
              opacity: filter === (["all","active","inactive","phase1","phase2","no_payment"][stats.indexOf(s)]) ? 1 : 0.7,
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, state..."
              style={{ width: "100%", padding: "10px 12px 10px 36px", background: "#0D1526", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(Object.keys(filterLabels) as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid",
                borderColor: filter === f ? "#FF6B00" : "#1E293B",
                background: filter === f ? "#FF6B0022" : "transparent",
                color: filter === f ? "#FF6B00" : "#64748B",
                fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>{filterLabels[f]}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ ...card, padding: 0, overflow: "hidden", flex: 1 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1E293B", background: "#060E1C" }}>
                  {["Player", "Contact", "Location", "Joined", "Phase 1", "Phase 2", "KYC", "Video", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} onClick={() => setSelected(u)} style={{
                    borderBottom: "1px solid #0F1B2D", cursor: "pointer",
                    background: selected?.id === u.id ? "#FF6B0010" : "transparent",
                    transition: "background 0.15s",
                  }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `hsl(${u.id * 37}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9" }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: "#475569" }}>#{String(u.id).padStart(4, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.phone}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.city}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{u.state}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748B" }}>{u.joined}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 16 }}>{u.phase1 ? "✅" : "❌"}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 16 }}>{u.phase2 ? "✅" : "❌"}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: kycColor(u.kyc) + "22", color: kycColor(u.kyc) }}>
                        {u.kyc}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 16 }}>{u.video ? "🎥" : "—"}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: u.active ? "#10B981" : "#64748B" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.active ? "#10B981" : "#64748B", display: "inline-block" }} />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <button onClick={() => setSelected(null)} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `hsl(${selected.id * 37}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
              {selected.name[0]}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9" }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{selected.email}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{selected.phone}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, width: "100%" }}>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#1E293B", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Message</button>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>View Profile</button>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Payment Status</div>
            {[{ label: "Phase 1 (₹100)", done: selected.phase1 }, { label: "Phase 2 (₹200)", done: selected.phase2 }].map(p => (
              <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #0F1B2D" }}>
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{p.label}</span>
                <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: p.done ? "#10B98122" : "#EF444422", color: p.done ? "#10B981" : "#EF4444" }}>
                  {p.done ? "Paid ✓" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>KYC Verification</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #10B981", background: "#10B98115", color: "#10B981", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✓ Approve</button>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #EF4444", background: "#EF444415", color: "#EF4444", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✕ Reject</button>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Selection Video</div>
            {selected.video ? (
              <div style={{ background: "#060B18", borderRadius: 10, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, cursor: "pointer", border: "1px solid #1E293B" }}>▶️</div>
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: "#475569", fontSize: 12, background: "#060B18", borderRadius: 10, border: "1px dashed #1E293B" }}>No video uploaded</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
