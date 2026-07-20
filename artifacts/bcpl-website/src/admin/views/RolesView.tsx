import { useState } from "react";

const PERMISSIONS = [
  { id: "view_dashboard", label: "View Dashboard", group: "Analytics" },
  { id: "view_users", label: "View Users", group: "Users" },
  { id: "edit_users", label: "Edit Users", group: "Users" },
  { id: "approve_kyc", label: "Approve KYC", group: "Users" },
  { id: "view_finance", label: "View Finance", group: "Finance" },
  { id: "export_finance", label: "Export Finance", group: "Finance" },
  { id: "refund_payment", label: "Issue Refund", group: "Finance" },
  { id: "manage_matches", label: "Manage Matches", group: "League" },
  { id: "live_scoring", label: "Live Scoring", group: "League" },
  { id: "manage_teams", label: "Manage Teams", group: "League" },
  { id: "player_selection", label: "Player Selection", group: "League" },
  { id: "manage_marketing", label: "Manage Marketing", group: "Growth" },
  { id: "manage_seo", label: "Manage SEO", group: "Growth" },
  { id: "manage_sponsors", label: "Manage Sponsors", group: "Growth" },
  { id: "manage_cms", label: "Manage CMS", group: "Content" },
  { id: "manage_banners", label: "Manage Banners", group: "Content" },
  { id: "manage_media", label: "Manage Media", group: "Content" },
  { id: "manage_roles", label: "Manage Roles", group: "Settings" },
  { id: "manage_admins", label: "Manage Admins", group: "Settings" },
];

const ROLES_INIT = [
  { id: "super_admin", name: "Super Admin", color: "#FF6B00", permissions: PERMISSIONS.map(p => p.id) },
  { id: "league_manager", name: "League Manager", color: "#3B82F6", permissions: ["view_dashboard", "view_users", "manage_matches", "live_scoring", "manage_teams", "player_selection"] },
  { id: "finance_admin", name: "Finance Admin", color: "#10B981", permissions: ["view_dashboard", "view_finance", "export_finance", "refund_payment"] },
  { id: "content_manager", name: "Content Manager", color: "#8B5CF6", permissions: ["view_dashboard", "manage_cms", "manage_banners", "manage_media", "manage_seo"] },
  { id: "marketing_head", name: "Marketing Head", color: "#F59E0B", permissions: ["view_dashboard", "manage_marketing", "manage_seo", "manage_sponsors"] },
];

const ADMINS = [
  { id: "A01", name: "Vikram Shah", email: "vikram@bcplt20.com", role: "super_admin", status: "active", last: "Now" },
  { id: "A02", name: "Sneha Patel", email: "sneha@bcplt20.com", role: "league_manager", status: "active", last: "2h ago" },
  { id: "A03", name: "Rajan More", email: "rajan@bcplt20.com", role: "finance_admin", status: "active", last: "1d ago" },
  { id: "A04", name: "Pooja Desai", email: "pooja@bcplt20.com", role: "content_manager", status: "active", last: "3h ago" },
  { id: "A05", name: "Amit Joshi", email: "amit@bcplt20.com", role: "marketing_head", status: "inactive", last: "5d ago" },
];

export default function RolesView() {
  const [tab, setTab] = useState<"roles" | "admins">("roles");
  const [selectedRole, setSelectedRole] = useState("super_admin");
  const [roles, setRoles] = useState(ROLES_INIT);

  const role = roles.find(r => r.id === selectedRole)!;
  const groups = [...new Set(PERMISSIONS.map(p => p.group))];

  const togglePerm = (permId: string) => {
    setRoles(rs => rs.map(r => r.id === selectedRole ? {
      ...r,
      permissions: r.permissions.includes(permId)
        ? r.permissions.filter(p => p !== permId)
        : [...r.permissions, permId]
    } : r));
  };

  const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: "20px 22px" };

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["roles", "admins"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 22px", borderRadius: 10, border: tab === t ? "none" : "1px solid #1E293B", background: tab === t ? "#FF6B00" : "transparent", color: tab === t ? "#fff" : "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t === "roles" ? "🔐 Roles & Permissions" : "👤 Admin Users"}</button>
        ))}
      </div>

      {tab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          {/* Role List */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, marginBottom: 14, textTransform: "uppercase" }}>Roles</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {roles.map(r => (
                <button key={r.id} onClick={() => setSelectedRole(r.id)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: selectedRole === r.id ? "#FF6B0015" : "transparent", borderLeft: `2px solid ${selectedRole === r.id ? r.color : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                  <span style={{ fontSize: 12, color: selectedRole === r.id ? r.color : "#94A3B8", fontWeight: selectedRole === r.id ? 700 : 500 }}>{r.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155" }}>{r.permissions.length}</span>
                </button>
              ))}
            </div>
            <button style={{ width: "100%", marginTop: 12, padding: "9px", borderRadius: 8, border: "1px dashed #1E293B", background: "transparent", color: "#475569", fontSize: 12, cursor: "pointer" }}>+ Add Role</button>
          </div>

          {/* Permissions Matrix */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: role.color }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{role.name}</div>
              <span style={{ fontSize: 11, color: "#475569" }}>{role.permissions.length} / {PERMISSIONS.length} permissions</span>
              <button style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {groups.map(group => (
                <div key={group}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#1E3A5F", letterSpacing: 1.5, marginBottom: 10, textTransform: "uppercase" }}>{group}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {PERMISSIONS.filter(p => p.group === group).map(perm => {
                      const checked = role.permissions.includes(perm.id);
                      const disabled = role.id === "super_admin";
                      return (
                        <label key={perm.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: disabled ? "default" : "pointer" }}>
                          <div onClick={() => !disabled && togglePerm(perm.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? "#FF6B00" : "#1E293B"}`, background: checked ? "#FF6B0020" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                            {checked && <span style={{ fontSize: 10, color: "#FF6B00", fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 12, color: checked ? "#CBD5E1" : "#475569" }}>{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "admins" && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.5, textTransform: "uppercase" }}>Admin Users</div>
            <button style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Invite Admin</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1E293B" }}>
                {["Name", "Email", "Role", "Status", "Last Active", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMINS.map(a => {
                const roleObj = roles.find(r => r.id === a.role);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #0F172A" }}>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${roleObj?.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: roleObj?.color }}>{a.name.split(" ").map(w => w[0]).join("")}</div>
                        <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px", color: "#64748B" }}>{a.email}</td>
                    <td style={{ padding: "12px 12px" }}><span style={{ background: `${roleObj?.color}20`, color: roleObj?.color, padding: "2px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{roleObj?.name}</span></td>
                    <td style={{ padding: "12px 12px" }}><span style={{ background: a.status === "active" ? "#10B98120" : "#1E293B", color: a.status === "active" ? "#10B981" : "#475569", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{a.status}</span></td>
                    <td style={{ padding: "12px 12px", color: "#475569" }}>{a.last}</td>
                    <td style={{ padding: "12px 12px" }}><button style={{ background: "none", border: "1px solid #1E293B", borderRadius: 6, padding: "4px 10px", color: "#64748B", fontSize: 11, cursor: "pointer" }}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
