/**
 * Roles & Access — Stage 5 RBAC.
 * Roles and their section access are FIXED on the server; this view shows
 * the live role → section matrix plus how many admin accounts hold each
 * role. Accounts themselves are managed in Admin Management.
 */
import { useState, useEffect } from "react";
import { adminListAdminUsers } from "../../lib/api";
import type { AdminUserRow } from "../../lib/api";
import { ALL_SECTIONS } from "./AdminSettingsView";

const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:"20px 22px" };

const ROLE_META: Record<string, { label: string; color: string; hint: string }> = {
  SUPER_ADMIN:         { label:"Super Admin",           color:"#FF6B00", hint:"Full control — every section, admin management, reveal KYC documents" },
  REGISTRATION_TEAM:   { label:"Registration Team",     color:"#3B82F6", hint:"Player registrations, user accounts, support" },
  PAYMENT_TEAM:        { label:"Payment Team",          color:"#10B981", hint:"Payments, finance and refund handling" },
  VIDEO_AI_OPERATIONS: { label:"Video / AI Operations", color:"#F59E0B", hint:"Video review, Phase 1 results, rankings" },
  KYC_TEAM:            { label:"KYC Team",              color:"#A855F7", hint:"Phase 2 KYC review — may reveal masked documents" },
  TRIAL_CITY_MANAGER:  { label:"Trial City Manager",    color:"#06B6D4", hint:"Physical trials, locked to assigned cities only" },
  CONTENT_TEAM:        { label:"Content Team",          color:"#8B5CF6", hint:"CMS, media, banners, sponsors, SEO" },
  MATCH_OPERATIONS:    { label:"Match Operations",      color:"#EF4444", hint:"Matches, live scoring, teams, auction" },
  SUPPORT_TEAM:        { label:"Support Team",          color:"#64748B", hint:"Support tickets and player lookups" },
  FINANCE_TEAM:        { label:"Finance Team",          color:"#22C55E", hint:"Finance, GST, refunds, data export" },
};

const sectionLabel = (id: string) =>
  id === "all" ? "All sections" : (ALL_SECTIONS.find(s => s.id === id)?.label ?? id.replace(/_/g, " "));

export default function RolesView() {
  const [roles,     setRoles]     = useState<string[]>([]);
  const [roleViews, setRoleViews] = useState<Record<string, string[]>>({});
  const [admins,    setAdmins]    = useState<AdminUserRow[]>([]);
  const [err,       setErr]       = useState("");
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState("SUPER_ADMIN");

  useEffect(() => {
    (async () => {
      try {
        const d = await adminListAdminUsers();
        setRoles(d.roles);
        setRoleViews(d.roleViews);
        setAdmins(d.admins);
        setErr("");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load roles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const views = roleViews[selected] ?? [];
  const holders = admins.filter(a => a.role === selected);
  const meta = ROLE_META[selected] ?? { label: selected, color: "#64748B", hint: "" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Roles & Access</div>
        <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>
          Ten fixed roles, enforced by the server on every request — the panel only shows what a role can already do.
          Give people roles in Admin Management.
        </div>
      </div>

      {err && (
        <div style={{ padding:"12px 16px", borderRadius:10, background:"#EF444418", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          {err} — this page is available to the Super Admin.
        </div>
      )}
      {loading && !err && (
        <div style={{ ...card, textAlign:"center", color:"#475569", fontSize:12, padding:36 }}>Loading roles…</div>
      )}

      {!loading && !err && (
        <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16, alignItems:"start" }}>
          {/* Role list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(roles.length ? roles : Object.keys(ROLE_META)).map(r => {
              const m = ROLE_META[r] ?? { label: r, color: "#64748B", hint: "" };
              const count = admins.filter(a => a.role === r).length;
              const on = selected === r;
              return (
                <button key={r} onClick={()=>setSelected(r)}
                  style={{ textAlign:"left", padding:"12px 14px", borderRadius:12, cursor:"pointer",
                    border:`1px solid ${on ? m.color : "#1E293B"}`,
                    background: on ? `${m.color}14` : "#0D1526" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:800, color: on ? m.color : "#E2E8F0" }}>{m.label}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:"#64748B" }}>{count} account{count!==1?"s":""}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ ...card, borderTop:`3px solid ${meta.color}` }}>
              <div style={{ fontSize:16, fontWeight:900, color:meta.color, marginBottom:6 }}>{meta.label}</div>
              <div style={{ fontSize:12, color:"#94A3B8", lineHeight:1.6 }}>{meta.hint}</div>
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:10, fontWeight:800, color:"#334155", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                  Sections this role opens
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(views.includes("all") ? ["all"] : views).map(v => (
                    <span key={v} style={{ fontSize:11, padding:"5px 11px", borderRadius:7, background:`${meta.color}14`, border:`1px solid ${meta.color}30`, color:meta.color, fontWeight:700 }}>
                      {sectionLabel(v)}
                    </span>
                  ))}
                  {views.length === 0 && <span style={{ fontSize:11, color:"#475569" }}>No sections mapped</span>}
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize:13, fontWeight:800, color:"#F1F5F9", marginBottom:10 }}>
                Accounts with this role ({holders.length})
              </div>
              {holders.length === 0 ? (
                <div style={{ fontSize:12, color:"#475569" }}>No admin accounts hold this role yet — add one in Admin Management.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {holders.map(h => (
                    <div key={h.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                      <div style={{ width:30, height:30, borderRadius:9, background:`${meta.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:meta.color, flexShrink:0 }}>
                        {h.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#E2E8F0" }}>{h.name}</div>
                        <div style={{ fontSize:10, color:"#64748B" }}>{h.email}</div>
                      </div>
                      {h.role === "TRIAL_CITY_MANAGER" && h.cities.length > 0 && (
                        <span style={{ fontSize:10, color:"#06B6D4", textTransform:"capitalize" }}>{h.cities.join(", ")}</span>
                      )}
                      <span style={{ fontSize:10, fontWeight:700, color: h.active ? "#10B981" : "#EF4444" }}>
                        {h.active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
