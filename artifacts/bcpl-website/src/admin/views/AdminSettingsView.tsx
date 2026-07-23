/**
 * Admin Management — Stage 5 RBAC.
 * Admin accounts now live on the SERVER (admin_users table) with one of
 * ten fixed roles; each role unlocks a fixed set of panel sections.
 * The old browser-stored co-admin list is legacy-only: it is still read
 * by the login screen so nobody is locked out mid-migration, but new
 * admins must be created here (server accounts work on every device).
 */
import { useState, useEffect, useCallback } from "react";
import {
  adminListAdminUsers, adminCreateAdminUser, adminUpdateAdminUser, adminDeleteAdminUser,
} from "../../lib/api";
import type { AdminUserRow } from "../../lib/api";

/* ─── Legacy co-admin storage (still read by the login fallback) ── */
export type CoAdmin = {
  id:          string;
  name:        string;
  email:       string;
  password:    string;
  role:        string;
  permissions: string[];   // nav section IDs; ["all"] = everything
  createdAt:   string;
};

export const ALL_SECTIONS = [
  { id:"dashboard",       label:"Analytics Dashboard",  group:"Overview"  },
  { id:"users",           label:"Users / Players",       group:"Overview"  },
  { id:"finance",         label:"Finance & GST",         group:"Overview"  },
  { id:"forecast",        label:"Forecasting",           group:"Overview"  },
  { id:"phase1_regs",     label:"Phase 1 Registrations", group:"Overview"  },
  { id:"phase2_kyc",      label:"Phase 2 · KYC",         group:"Overview"  },
  { id:"marketing",       label:"Marketing",             group:"Growth"    },
  { id:"seo",             label:"SEO Manager",           group:"Growth"    },
  { id:"affiliates",      label:"Agents & Affiliates",   group:"Growth"    },
  { id:"content_cal",     label:"Content Calendar",      group:"Growth"    },
  { id:"matches",         label:"Matches",               group:"League"    },
  { id:"live_scoring",    label:"Live Scoring",          group:"League"    },
  { id:"teams",           label:"Teams",                 group:"League"    },
  { id:"selection",       label:"Selection",             group:"League"    },
  { id:"auction",         label:"Live Auction",          group:"League"    },
  { id:"leaderboard",     label:"Leaderboard",           group:"League"    },
  { id:"contracts",       label:"Contracts",             group:"League"    },
  { id:"video_review",    label:"Video Review",          group:"Players"   },
  { id:"player_profiles", label:"Player Profiles",       group:"Players"   },
  { id:"whatsapp_tpl",    label:"WhatsApp Templates",    group:"Players"   },
  { id:"fraud",           label:"Fraud Detection",       group:"Players"   },
  { id:"trial_cities",    label:"Trial Cities",          group:"Trials"    },
  { id:"support",         label:"Support Tickets",       group:"Trials"    },
  { id:"media",           label:"Photos & Videos",       group:"Content"   },
  { id:"banners",         label:"Banners",               group:"Content"   },
  { id:"cms",             label:"CMS / Pages",           group:"Content"   },
  { id:"sponsors",        label:"Sponsors",              group:"Sponsors"  },
  { id:"data_export",     label:"Data Export",           group:"Tools"     },
  { id:"roles",           label:"Roles & Access",        group:"Tools"     },
  { id:"api_health",      label:"API Health",            group:"Tools"     },
];

const LS_KEY = "bcpl_co_admins";
export function loadCoAdmins(): CoAdmin[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
export function saveCoAdmins(list: CoAdmin[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* ─── UI constants ─────────────────────────────── */
const CARD: React.CSSProperties = {
  background:"linear-gradient(135deg,#0D1526,#0A1020)",
  border:"1px solid #1E293B", borderRadius:16, padding:20,
};
const INP: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:9,
  border:"1px solid #1E293B", background:"#060B18",
  color:"#E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box",
};

const ROLE_META: Record<string, { label: string; color: string; hint: string }> = {
  SUPER_ADMIN:         { label:"Super Admin",          color:"#FF6B00", hint:"Full control — every section" },
  REGISTRATION_TEAM:   { label:"Registration Team",    color:"#3B82F6", hint:"Registrations, users, support" },
  PAYMENT_TEAM:        { label:"Payment Team",         color:"#10B981", hint:"Payments, finance, refunds" },
  VIDEO_AI_OPERATIONS: { label:"Video / AI Operations", color:"#F59E0B", hint:"Video review, results, rankings" },
  KYC_TEAM:            { label:"KYC Team",             color:"#A855F7", hint:"Phase 2 KYC, document review" },
  TRIAL_CITY_MANAGER:  { label:"Trial City Manager",   color:"#06B6D4", hint:"Trials — only assigned cities" },
  CONTENT_TEAM:        { label:"Content Team",         color:"#8B5CF6", hint:"CMS, media, banners, SEO" },
  MATCH_OPERATIONS:    { label:"Match Operations",     color:"#EF4444", hint:"Matches, scoring, teams, auction" },
  SUPPORT_TEAM:        { label:"Support Team",         color:"#64748B", hint:"Tickets, users (read-first)" },
  FINANCE_TEAM:        { label:"Finance Team",         color:"#22C55E", hint:"Finance, GST, refunds, exports" },
};
const roleLabel = (r: string) => ROLE_META[r]?.label ?? r.replace(/_/g, " ");
const roleColor = (r: string) => ROLE_META[r]?.color ?? "#64748B";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from({length:10}, () => chars[Math.floor(Math.random()*chars.length)]).join("") + "!";
}

function sectionLabel(id: string): string {
  if (id === "all") return "All sections";
  return ALL_SECTIONS.find(s => s.id === id)?.label ?? id.replace(/_/g, " ");
}

/* ─── Add/Edit modal ───────────────────────────── */
function UserModal({ existing, roles, roleViews, onDone, onClose }: {
  existing: AdminUserRow | null;
  roles: string[];
  roleViews: Record<string, string[]>;
  onDone: () => void;
  onClose: () => void;
}) {
  const [name,     setName]     = useState(existing?.name ?? "");
  const [email,    setEmail]    = useState(existing?.email ?? "");
  const [password, setPassword] = useState(existing ? "" : generatePassword());
  const [role,     setRole]     = useState(existing?.role ?? "SUPPORT_TEAM");
  const [cities,   setCities]   = useState((existing?.cities ?? []).join(", "));
  const [active,   setActive]   = useState(existing?.active ?? true);
  const [showPwd,  setShowPwd]  = useState(!existing);
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);

  const views = roleViews[role] ?? [];

  async function save() {
    if (busy) return;
    if (!name.trim()) { setErr("Name required"); return; }
    if (!existing && (!email.trim() || !email.includes("@"))) { setErr("Valid email required"); return; }
    if (!existing && password.trim().length < 8) { setErr("Password must be at least 8 characters"); return; }
    if (existing && password.trim() && password.trim().length < 8) { setErr("New password must be at least 8 characters"); return; }
    const cityList = cities.split(",").map(c => c.trim()).filter(Boolean);
    if (role === "TRIAL_CITY_MANAGER" && cityList.length === 0) { setErr("Trial City Manager needs at least one city (comma-separated)"); return; }
    setBusy(true); setErr("");
    try {
      if (existing) {
        await adminUpdateAdminUser(existing.id, {
          name: name.trim(), role, cities: cityList, active,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
      } else {
        await adminCreateAdminUser({
          email: email.trim().toLowerCase(), name: name.trim(),
          role, password: password.trim(),
          ...(cityList.length ? { cities: cityList } : {}),
        });
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ ...CARD, width:"100%", maxWidth:560, padding:28, maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:17, fontWeight:900, color:"#F1F5F9", marginBottom:4 }}>
          {existing ? "Edit Admin" : "+ Add New Admin"}
        </div>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>
          Server account — works from any device. The role decides which sections open.
        </div>

        {err && <div style={{ padding:"8px 12px", borderRadius:8, background:"#EF444420", border:"1px solid #EF444440", color:"#EF4444", fontSize:12, marginBottom:14 }}>{err}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Full Name</label>
            <input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="e.g. Rahul Kumar" style={INP}/>
          </div>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Email (login ID)</label>
            <input type="email" value={email} disabled={!!existing} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="e.g. rahul@bcplt20.com"
              style={{ ...INP, opacity: existing ? 0.5 : 1 }}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>
              {existing ? "New Password (blank = unchanged)" : "Password"}
            </label>
            <div style={{ position:"relative" }}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("");}}
                placeholder={existing ? "Leave blank to keep current" : ""} style={{ ...INP, paddingRight:90 }}/>
              <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", display:"flex", gap:6 }}>
                <button type="button" onClick={()=>setShowPwd(s=>!s)} style={{ fontSize:10, color:"#64748B", background:"none", border:"none", cursor:"pointer", padding:0 }}>{showPwd?"Hide":"Show"}</button>
                <button type="button" onClick={()=>setPassword(generatePassword())} style={{ fontSize:10, color:"#FF6B00", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:0 }}>New</button>
              </div>
            </div>
            <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>Share the password with the admin directly</div>
          </div>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Role</label>
            <select value={role} onChange={e=>{setRole(e.target.value);setErr("");}} style={INP as React.CSSProperties}>
              {roles.map(r=> <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
            <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>{ROLE_META[role]?.hint ?? ""}</div>
          </div>
        </div>

        {role === "TRIAL_CITY_MANAGER" && (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Assigned Cities (comma-separated)</label>
            <input value={cities} onChange={e=>{setCities(e.target.value);setErr("");}} placeholder="e.g. Delhi, Jaipur" style={INP}/>
            <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>This manager can only see and manage trials in these cities</div>
          </div>
        )}

        {existing && (
          <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, cursor:"pointer" }}>
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            <span style={{ fontSize:12, color: active ? "#10B981" : "#EF4444", fontWeight:700 }}>
              {active ? "Active — can sign in" : "Deactivated — sign-in blocked"}
            </span>
          </label>
        )}

        {/* Sections unlocked by this role */}
        <div style={{ marginBottom:20, background:"#060B18", borderRadius:12, padding:14, border:"1px solid #1E293B" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#334155", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
            Sections this role opens
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {(views.includes("all") ? [{ id:"all" }] : views.map(v=>({ id:v }))).map(v=>(
              <span key={v.id} style={{ fontSize:10, padding:"3px 9px", borderRadius:6, background:"#1E293B", color:"#94A3B8", fontWeight:600 }}>
                {sectionLabel(v.id)}
              </span>
            ))}
            {views.length === 0 && <span style={{ fontSize:11, color:"#475569" }}>—</span>}
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={busy}
            style={{ flex:2, padding:12, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:800, fontSize:13, cursor:busy?"wait":"pointer", opacity:busy?0.7:1 }}>
            {busy ? "Saving…" : existing ? "Save Changes" : "Add Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main view ────────────────────────────────── */
export default function AdminSettingsView() {
  const [rows,      setRows]      = useState<AdminUserRow[]>([]);
  const [roles,     setRoles]     = useState<string[]>([]);
  const [roleViews, setRoleViews] = useState<Record<string, string[]>>({});
  const [err,       setErr]       = useState("");
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<"add" | AdminUserRow | null>(null);
  const [busyId,    setBusyId]    = useState<string | null>(null);
  const [legacy,    setLegacy]    = useState<CoAdmin[]>([]);

  const load = useCallback(async () => {
    try {
      const d = await adminListAdminUsers();
      setRows(d.admins);
      setRoles(d.roles);
      setRoleViews(d.roleViews);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load admin accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); setLegacy(loadCoAdmins()); }, [load]);

  async function remove(u: AdminUserRow) {
    if (busyId) return;
    if (!window.confirm(`Delete admin account ${u.email}? They will no longer be able to sign in.`)) return;
    setBusyId(u.id);
    try {
      await adminDeleteAdminUser(u.id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusyId(null);
    }
  }

  function clearLegacy() {
    if (!window.confirm("Remove all browser-stored co-admin logins from this browser? Make sure each person has a server account first.")) return;
    saveCoAdmins([]);
    setLegacy([]);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Admin Management</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>Server admin accounts with fixed roles — work from any device</div>
        </div>
        <button onClick={()=>setModal("add")} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Add Admin
        </button>
      </div>

      {err && (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"#EF444418", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>{err}</div>
      )}

      {/* Owner card */}
      <div style={{ ...CARD, borderLeft:"4px solid #FF6B00", background:"linear-gradient(135deg,#FF6B0010,#0D1526)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", border:"2px solid rgba(255,107,0,.6)", boxShadow:"0 0 14px rgba(255,107,0,.3)", flexShrink:0 }}>
            <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-ball-color.jpg"} alt="BCPL" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:"#FF6B00" }}>Saurabh Jha</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>saurabhjha@bcplt20.com · owner login (panel password)</div>
            <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#FF6B0020", color:"#FF6B00", fontWeight:800 }}>Owner</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#10B98120", color:"#10B981", fontWeight:700 }}>Full Access — All Sections</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#1E293B", color:"#475569", fontWeight:600 }}>Always available · Cannot be removed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy browser co-admins warning */}
      {legacy.length > 0 && (
        <div style={{ ...CARD, borderLeft:"4px solid #F59E0B", padding:"14px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:"#F59E0B", marginBottom:4 }}>
                {legacy.length} old browser-stored co-admin login{legacy.length!==1?"s":""} found
              </div>
              <div style={{ fontSize:11, color:"#64748B", lineHeight:1.6 }}>
                {legacy.map(l=>l.email).join(", ")} — these only work in this browser.
                Create a server account above for each person, then remove the browser logins.
              </div>
            </div>
            <button onClick={clearLegacy} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #F59E0B60", background:"#F59E0B18", color:"#F59E0B", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
              Remove browser logins
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Server Admin Accounts", value: rows.length,                          color:"#6366F1" },
          { label:"Active",                value: rows.filter(a=>a.active).length,      color:"#10B981" },
          { label:"Deactivated",           value: rows.filter(a=>!a.active).length,     color:"#EF4444" },
        ].map(s=>(
          <div key={s.label} style={{ ...CARD, borderTop:`3px solid ${s.color}`, padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Account list */}
      {loading ? (
        <div style={{ ...CARD, textAlign:"center", padding:40, color:"#475569", fontSize:12 }}>Loading admin accounts…</div>
      ) : rows.length === 0 ? (
        <div style={{ ...CARD, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>No admin accounts yet</div>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>Click "+ Add Admin" to create a server account with a fixed role</div>
          <button onClick={()=>setModal("add")} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer" }}>
            + Add First Admin
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))", gap:14 }}>
          {rows.map(u=>(
            <div key={u.id} style={{ ...CARD, display:"flex", flexDirection:"column", gap:12, opacity: u.active ? 1 : 0.6 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${roleColor(u.role)}20`, border:`2px solid ${roleColor(u.role)}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:roleColor(u.role), flexShrink:0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#F1F5F9", lineHeight:1 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{u.email}</div>
                  <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:`${roleColor(u.role)}20`, color:roleColor(u.role), fontWeight:700 }}>{roleLabel(u.role)}</span>
                    {!u.active && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#EF444420", color:"#EF4444", fontWeight:700 }}>Deactivated</span>}
                    {u.role === "TRIAL_CITY_MANAGER" && u.cities.length > 0 && (
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#06B6D420", color:"#06B6D4", fontWeight:700, textTransform:"capitalize" }}>{u.cities.join(", ")}</span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setModal(u)} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer", fontWeight:600 }}>Edit</button>
                  <button onClick={()=>remove(u)} disabled={busyId===u.id} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                    {busyId===u.id ? "…" : "✕"}
                  </button>
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {(u.permissions.includes("all") ? ["all"] : u.permissions).slice(0, 10).map(pid => (
                  <span key={pid} style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"#1E293B", color:"#64748B", fontWeight:600 }}>{sectionLabel(pid)}</span>
                ))}
                {!u.permissions.includes("all") && u.permissions.length > 10 && (
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"#1E293B", color:"#64748B", fontWeight:600 }}>+{u.permissions.length - 10} more</span>
                )}
              </div>
              <div style={{ fontSize:10, color:"#334155" }}>
                Last sign-in: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "never"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div style={{ ...CARD, padding:"14px 20px", borderLeft:"4px solid #6366F1", background:"linear-gradient(135deg,#6366F110,#0D1526)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:4 }}>How it works</div>
        <div style={{ fontSize:11, color:"#475569", lineHeight:1.7 }}>
          Accounts are stored on the server, so people can sign in from any device with their email and password.
          Each role opens a fixed set of sections; a Trial City Manager additionally only sees their assigned cities.
          Deactivate an account to block sign-in without deleting it. At least one Super Admin must always remain.
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <UserModal
          existing={modal === "add" ? null : modal}
          roles={roles.length ? roles : Object.keys(ROLE_META)}
          roleViews={roleViews}
          onDone={()=>{ setModal(null); load(); }}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}
