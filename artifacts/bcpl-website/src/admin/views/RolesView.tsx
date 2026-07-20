import { useState } from "react";

const ROLES = [
  {
    id: 1, name: "Super Admin", color: "#FF7A29",
    permissions: ["dashboard","users","finance","teams","matches","selection","live-scoring","marketing","seo","sponsors","banners","cms","roles","media"],
  },
  {
    id: 2, name: "Scorer", color: "#3B9EFF",
    permissions: ["dashboard","matches","live-scoring"],
  },
  {
    id: 3, name: "Content Manager", color: "#A855F7",
    permissions: ["dashboard","cms","banners","seo","media","marketing"],
  },
  {
    id: 4, name: "Finance Manager", color: "#22C55E",
    permissions: ["dashboard","finance","users"],
  },
  {
    id: 5, name: "Selection Panel", color: "#F59E0B",
    permissions: ["dashboard","users","selection"],
  },
];

const ALL_PERMISSIONS = [
  "dashboard","users","finance","teams","matches",
  "selection","live-scoring","marketing","seo",
  "sponsors","banners","cms","roles","media",
];

const ADMINS = [
  { id: 1, name: "Admin User",    email: "admin@bcplt20.com",    role: "Super Admin", status: "Active" },
  { id: 2, name: "Raj Scorer",   email: "raj@bcplt20.com",      role: "Scorer",       status: "Active" },
  { id: 3, name: "Priya Content", email: "priya@bcplt20.com",   role: "Content Manager", status: "Active" },
  { id: 4, name: "Arun Finance",  email: "arun@bcplt20.com",    role: "Finance Manager",  status: "Inactive" },
];

export default function RolesView() {
  const [roles, setRoles]   = useState(ROLES);
  const [selected, setSelected] = useState(roles[0]);
  const [tab, setTab]       = useState<"roles" | "users">("roles");

  const toggle = (perm: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== selected.id) return r;
      const has = r.permissions.includes(perm);
      return {
        ...r,
        permissions: has ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm],
      };
    }));
    setSelected(prev => {
      const has = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: has ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm],
      };
    });
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["roles","users"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px",
              background: tab === t ? "#FF7A29" : "#0D1B2E",
              color: tab === t ? "#fff" : "#7A8EA8",
              border: `1px solid ${tab === t ? "#FF7A29" : "rgba(255,255,255,.12)"}`,
              borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
              fontFamily: "'Montserrat', sans-serif", textTransform: "capitalize",
            }}
          >
            {t === "roles" ? "🔐 Roles & Permissions" : "👤 Admin Users"}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
          {/* Roles list */}
          <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", height: "fit-content" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", fontWeight: 900, color: "#fff", fontSize: 14 }}>Roles</div>
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "12px 16px",
                  background: selected.id === r.id ? "rgba(255,122,41,.1)" : "none",
                  border: "none", borderLeft: selected.id === r.id ? "3px solid #FF7A29" : "3px solid transparent",
                  borderBottom: "1px solid rgba(255,255,255,.05)",
                  color: selected.id === r.id ? "#FF7A29" : "#E8F0FE",
                  cursor: "pointer", textAlign: "left",
                  fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                {r.name}
              </button>
            ))}
          </div>

          {/* Permissions editor */}
          <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", padding: 24 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 16, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ color: "#7A8EA8", fontSize: 12, marginBottom: 20 }}>{selected.permissions.length} of {ALL_PERMISSIONS.length} permissions enabled</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
              {ALL_PERMISSIONS.map(perm => {
                const has = selected.permissions.includes(perm);
                return (
                  <button
                    key={perm}
                    onClick={() => selected.id !== 1 && toggle(perm)} // Super Admin can't be restricted
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px",
                      background: has ? "rgba(34,197,94,.12)" : "rgba(255,255,255,.04)",
                      border: `1px solid ${has ? "#22C55E" : "rgba(255,255,255,.1)"}`,
                      borderRadius: 8, cursor: selected.id === 1 ? "default" : "pointer",
                      color: has ? "#22C55E" : "#7A8EA8",
                      fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{has ? "✓" : "○"}</span>
                    {perm.replace(/-/g, " ")}
                  </button>
                );
              })}
            </div>
            {selected.id === 1 && (
              <div style={{ marginTop: 16, color: "#F59E0B", fontSize: 12, fontStyle: "italic" }}>
                ⚠️ Super Admin always has all permissions and cannot be restricted.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={{ background: "#0D1B2E", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontWeight: 900, color: "#fff" }}>Admin Users</div>
            <button style={{ padding: "8px 16px", background: "linear-gradient(135deg,#FF7A29,#FF4500)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              + Invite Admin
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,.04)" }}>
                {["Name","Email","Role","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#7A8EA8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid rgba(255,255,255,.07)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMINS.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < ADMINS.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 700, fontSize: 13 }}>{a.name}</td>
                  <td style={{ padding: "12px 16px", color: "#7A8EA8", fontSize: 12 }}>{a.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "rgba(255,122,41,.15)", color: "#FF7A29", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{a.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: a.status === "Active" ? "#22C55E22" : "#7A8EA822", color: a.status === "Active" ? "#22C55E" : "#7A8EA8", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ padding: "5px 12px", background: "rgba(255,255,255,.06)", color: "#7A8EA8", border: "1px solid rgba(255,255,255,.12)", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
