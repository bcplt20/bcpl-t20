import { useState } from "react";

type Status = "All" | "Registered" | "Phase1Paid" | "VideoUploaded" | "Phase2Paid" | "KYCApproved";

const MOCK_USERS = Array.from({ length: 40 }, (_, i) => ({
  id: 1000 + i,
  name: ["Rahul Sharma","Priya Patel","Amit Singh","Sneha Reddy","Karan Mehta","Pooja Nair","Rohan Gupta","Ananya Das","Suresh Kumar","Neha Joshi"][i % 10],
  phone: `+91 98${String(i).padStart(2,"0")} ${(10000 + i * 97).toString().substring(0,5)}`,
  city: ["Mumbai","Delhi","Ahmedabad","Hyderabad","Pune","Chennai","Kolkata","Bengaluru","Jaipur","Surat"][i % 10],
  role: ["Batsman","Bowler","All-rounder","Wicket-keeper"][i % 4],
  status: (["Registered","Phase1Paid","VideoUploaded","Phase2Paid","KYCApproved"] as const)[i % 5],
  date: new Date(2025, 6, 1 + (i % 30)).toLocaleDateString("en-IN"),
}));

const STATUS_COLOR: Record<string, string> = {
  Registered:     "#7A8EA8",
  Phase1Paid:     "#3B9EFF",
  VideoUploaded:  "#A855F7",
  Phase2Paid:     "#FF7A29",
  KYCApproved:    "#22C55E",
};

export default function UsersView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("All");
  const [page, setPage]     = useState(1);
  const PER = 10;

  const filtered = MOCK_USERS.filter(u =>
    (status === "All" || u.status === status) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.city.toLowerCase().includes(search.toLowerCase()) ||
     u.phone.includes(search))
  );
  const pages   = Math.ceil(filtered.length / PER);
  const visible = filtered.slice((page - 1) * PER, page * PER);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search name, city, phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1, minWidth: 200, padding: "10px 14px",
            background: "#0D1B2E", border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 8, color: "#fff", fontSize: 13, outline: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value as Status); setPage(1); }}
          style={{
            padding: "10px 14px", background: "#0D1B2E",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 8, color: "#fff", fontSize: 13, outline: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {(["All","Registered","Phase1Paid","VideoUploaded","Phase2Paid","KYCApproved"] as Status[]).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ color: "#7A8EA8", fontSize: 13 }}>{filtered.length} users</div>
      </div>

      {/* Table */}
      <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.04)" }}>
              {["ID","Name","Phone","City","Role","Status","Registered"].map(h => (
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
            {visible.map((u, i) => (
              <tr
                key={u.id}
                style={{
                  borderBottom: i < visible.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                  transition: "background .12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={td}><span style={{ color: "#7A8EA8", fontSize: 12 }}>#{u.id}</span></td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: "rgba(255,122,41,.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#FF7A29", flexShrink: 0,
                    }}>
                      {u.name[0]}
                    </div>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ ...td, color: "#7A8EA8", fontSize: 12 }}>{u.phone}</td>
                <td style={{ ...td, color: "#E8F0FE", fontSize: 13 }}>{u.city}</td>
                <td style={{ ...td, color: "#E8F0FE", fontSize: 13 }}>{u.role}</td>
                <td style={td}>
                  <span style={{
                    background: `${STATUS_COLOR[u.status]}22`,
                    color: STATUS_COLOR[u.status],
                    borderRadius: 6, padding: "3px 8px",
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ ...td, color: "#7A8EA8", fontSize: 12 }}>{u.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: p === page ? "#FF7A29" : "#0D1B2E",
                border: "1px solid rgba(255,255,255,.12)",
                color: p === page ? "#fff" : "#7A8EA8",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const td: React.CSSProperties = { padding: "12px 16px" };
