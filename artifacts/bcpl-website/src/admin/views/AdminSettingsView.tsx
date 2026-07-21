import { useState, useEffect } from "react";

/* ─── Types ─────────────────────────────────────── */
export type CoAdmin = {
  id:          string;
  name:        string;
  email:       string;
  password:    string;
  role:        string;
  permissions: string[];   // nav section IDs; ["all"] = everything
  createdAt:   string;
};

/* ─── All sections a co-admin can be granted ─────── */
export const ALL_SECTIONS = [
  { id:"dashboard",       label:"Analytics Dashboard",  group:"Overview"  },
  { id:"users",           label:"Users / Players",       group:"Overview"  },
  { id:"finance",         label:"Finance & GST",         group:"Overview"  },
  { id:"forecast",        label:"Forecasting",           group:"Overview"  },
  { id:"marketing",       label:"Marketing",             group:"Growth"    },
  { id:"seo",             label:"SEO Manager",           group:"Growth"    },
  { id:"affiliates",      label:"Agents & Affiliates",   group:"Growth"    },
  { id:"push",            label:"Push Notifications",    group:"Growth"    },
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
  { id:"sponsor_roi",     label:"Sponsor ROI",           group:"Sponsors"  },
  { id:"data_export",     label:"Data Export",           group:"Tools"     },
  { id:"roles",           label:"Roles & Access",        group:"Tools"     },
];

const GROUPS = Array.from(new Set(ALL_SECTIONS.map(s => s.group)));

const LS_KEY = "bcpl_co_admins";
export function loadCoAdmins(): CoAdmin[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
export function saveCoAdmins(list: CoAdmin[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

const CARD: React.CSSProperties = {
  background:"linear-gradient(135deg,#0D1526,#0A1020)",
  border:"1px solid #1E293B", borderRadius:16, padding:20,
};
const INP: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:9,
  border:"1px solid #1E293B", background:"#060B18",
  color:"#E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box",
};

const PRESET_ROLES = [
  { label:"Full Access (Super Admin)", perms:["all"] },
  { label:"Finance Only",             perms:["dashboard","finance","forecast","data_export"] },
  { label:"Operations",               perms:["dashboard","matches","live_scoring","teams","selection","support","trial_cities"] },
  { label:"Marketing & Growth",       perms:["dashboard","marketing","seo","affiliates","push","content_cal","media","banners","cms","leaderboard"] },
  { label:"Player Management",        perms:["dashboard","users","video_review","player_profiles","fraud","contracts","support"] },
  { label:"Custom",                   perms:[] },
];

function generateId() {
  return "CA-" + Math.random().toString(36).slice(2,8).toUpperCase();
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
  return Array.from({length:10}, () => chars[Math.floor(Math.random()*chars.length)]).join("") + "!";
}

/* ─── Admin card component ───────────────────────── */
function AdminCard({ admin, onEdit, onDelete }: { admin:CoAdmin; onEdit:()=>void; onDelete:()=>void }) {
  const [showPwd, setShowPwd] = useState(false);
  const sectionCount = admin.permissions.includes("all") ? ALL_SECTIONS.length : admin.permissions.length;
  return (
    <div style={{ ...CARD, display:"flex", flexDirection:"column", gap:12 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"#FF6B0020", border:"2px solid #FF6B0040", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#FF6B00", flexShrink:0 }}>
          {admin.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#F1F5F9", lineHeight:1 }}>{admin.name}</div>
          <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{admin.email}</div>
          <div style={{ marginTop:6, display:"flex", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#6366F120", color:"#6366F1", fontWeight:700 }}>{admin.role}</span>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#10B98120", color:"#10B981", fontWeight:700 }}>
              {admin.permissions.includes("all") ? "All Sections" : `${sectionCount} Section${sectionCount!==1?"s":""}`}
            </span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={onEdit} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer", fontWeight:600 }}>✏ Edit</button>
          <button onClick={onDelete} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer", fontWeight:600 }}>✕</button>
        </div>
      </div>

      {/* Password row */}
      <div style={{ display:"flex", alignItems:"center", gap:10, background:"#060B18", borderRadius:9, padding:"8px 12px", border:"1px solid #1E293B" }}>
        <span style={{ fontSize:11, color:"#475569", flex:1 }}>
          Password: <span style={{ fontFamily:"monospace", color:"#E2E8F0", letterSpacing:showPwd?1:.1 }}>
            {showPwd ? admin.password : "●".repeat(Math.min(admin.password.length, 12))}
          </span>
        </span>
        <button onClick={()=>setShowPwd(s=>!s)} style={{ fontSize:11, color:"#64748B", background:"none", border:"none", cursor:"pointer", padding:0 }}>
          {showPwd?"Hide":"Show"}
        </button>
        <button onClick={()=>{ navigator.clipboard.writeText(admin.password); }} style={{ fontSize:11, color:"#FF6B00", background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:700 }}>
          Copy
        </button>
      </div>

      {/* Sections */}
      {!admin.permissions.includes("all") && admin.permissions.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
          {admin.permissions.map(pid => {
            const sec = ALL_SECTIONS.find(s => s.id === pid);
            return sec ? (
              <span key={pid} style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"#1E293B", color:"#64748B", fontWeight:600 }}>{sec.label}</span>
            ) : null;
          })}
        </div>
      )}

      <div style={{ fontSize:10, color:"#334155" }}>Created: {admin.createdAt}</div>
    </div>
  );
}

/* ─── Add/Edit Modal ─────────────────────────────── */
function AdminModal({ existing, onSave, onClose }: {
  existing: CoAdmin | null;
  onSave: (a: CoAdmin) => void;
  onClose: () => void;
}) {
  const [name,     setName]    = useState(existing?.name     || "");
  const [email,    setEmail]   = useState(existing?.email    || "");
  const [password, setPassword]= useState(existing?.password || generatePassword());
  const [role,     setRole]    = useState(existing?.role     || "Operations Admin");
  const [perms,    setPerms]   = useState<string[]>(existing?.permissions || []);
  const [preset,   setPreset]  = useState("Custom");
  const [showPwd,  setShowPwd] = useState(false);
  const [err,      setErr]     = useState("");

  function applyPreset(label: string) {
    setPreset(label);
    const found = PRESET_ROLES.find(p => p.label === label);
    if (found && found.perms.length > 0) setPerms(found.perms);
  }

  function togglePerm(id: string) {
    setPerms(p => p.includes("all") ? [id] : p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
    setPreset("Custom");
  }

  function handleSave() {
    if (!name.trim()) { setErr("Name required"); return; }
    if (!email.trim() || !email.includes("@")) { setErr("Valid email required"); return; }
    if (!password.trim() || password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (perms.length === 0) { setErr("Select at least one section or use a preset role"); return; }
    onSave({
      id:          existing?.id || generateId(),
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      password,
      role,
      permissions: perms,
      createdAt:   existing?.createdAt || new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }),
    });
  }

  const allSelected = perms.includes("all");

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ ...CARD, width:"100%", maxWidth:620, padding:28, maxHeight:"92vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

        <div style={{ fontSize:17, fontWeight:900, color:"#F1F5F9", marginBottom:4 }}>
          {existing ? "✏ Edit Co-Admin" : "+ Add New Admin"}
        </div>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>
          {existing ? "Update details and access permissions" : "Fill details and choose which sections this admin can access"}
        </div>

        {err && <div style={{ padding:"8px 12px", borderRadius:8, background:"#EF444420", border:"1px solid #EF444440", color:"#EF4444", fontSize:12, marginBottom:14 }}>⚠ {err}</div>}

        {/* Basic info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Full Name</label>
            <input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="e.g. Rahul Kumar" style={INP}/>
          </div>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Email Address</label>
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="e.g. rahul@bcplt20.com" style={INP}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input type={showPwd?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setErr("");}}
                style={{ ...INP, paddingRight:90 }}/>
              <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", display:"flex", gap:6 }}>
                <button type="button" onClick={()=>setShowPwd(s=>!s)} style={{ fontSize:10, color:"#64748B", background:"none", border:"none", cursor:"pointer", padding:0 }}>{showPwd?"Hide":"Show"}</button>
                <button type="button" onClick={()=>setPassword(generatePassword())} style={{ fontSize:10, color:"#FF6B00", background:"none", border:"none", cursor:"pointer", fontWeight:700, padding:0 }}>New</button>
              </div>
            </div>
            <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>Share this password with the admin after adding</div>
          </div>
          <div>
            <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>Role Title</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={{ ...INP } as any}>
              {["Super Admin","Finance Admin","Operations Admin","Marketing Admin","Player Admin","Content Admin","Custom Role"].map(r=>(
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset selector */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>Quick Access Preset</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {PRESET_ROLES.map(p=>(
              <button key={p.label} onClick={()=>applyPreset(p.label)}
                style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${preset===p.label?"#FF6B00":"#1E293B"}`, background:preset===p.label?"#FF6B0018":"transparent", color:preset===p.label?"#FF6B00":"#64748B", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-section toggles */}
        {!allSelected && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <label style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>
                Section Access ({perms.length} selected)
              </label>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{setPerms(ALL_SECTIONS.map(s=>s.id));setPreset("Custom");}} style={{ fontSize:10, color:"#FF6B00", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>Select All</button>
                <button onClick={()=>{setPerms([]);setPreset("Custom");}} style={{ fontSize:10, color:"#64748B", background:"none", border:"none", cursor:"pointer" }}>Clear</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, background:"#060B18", borderRadius:12, padding:16, border:"1px solid #1E293B" }}>
              {GROUPS.map(grp=>(
                <div key={grp}>
                  <div style={{ fontSize:9, fontWeight:800, color:"#334155", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{grp}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {ALL_SECTIONS.filter(s=>s.group===grp).map(s=>{
                      const on = perms.includes(s.id);
                      return (
                        <button key={s.id} onClick={()=>togglePerm(s.id)}
                          style={{ padding:"5px 11px", borderRadius:7, border:`1px solid ${on?"#FF6B00":"#1E293B"}`, background:on?"#FF6B0018":"transparent", color:on?"#FF6B00":"#475569", fontSize:11, fontWeight:on?700:400, cursor:"pointer", transition:"all .12s" }}>
                          {on?"✓ ":""}{s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {allSelected && (
          <div style={{ marginBottom:20, padding:"12px 16px", borderRadius:10, background:"#FF6B0010", border:"1px solid #FF6B0030" }}>
            <span style={{ fontSize:12, color:"#FF7A29", fontWeight:700 }}>✓ Full access — this admin can see all {ALL_SECTIONS.length} sections</span>
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex:2, padding:12, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
            {existing ? "✓ Save Changes" : "✓ Add Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main View ─────────────────────────────────── */
export default function AdminSettingsView() {
  const [admins,   setAdmins]  = useState<CoAdmin[]>([]);
  const [modal,    setModal]   = useState<"add"|CoAdmin|null>(null);
  const [deleted,  setDeleted] = useState<string|null>(null);

  useEffect(() => { setAdmins(loadCoAdmins()); }, []);

  function save(list: CoAdmin[]) {
    setAdmins(list);
    saveCoAdmins(list);
  }

  function handleSave(a: CoAdmin) {
    const existing = admins.find(x => x.id === a.id);
    if (existing) save(admins.map(x => x.id===a.id ? a : x));
    else          save([...admins, a]);
    setModal(null);
  }

  function handleDelete(id: string) {
    setDeleted(id);
    setTimeout(() => {
      save(admins.filter(x => x.id !== id));
      setDeleted(null);
    }, 400);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Admin Management</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>Add co-admins and control which sections they can access</div>
        </div>
        <button onClick={()=>setModal("add")} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Add Admin
        </button>
      </div>

      {/* Super Admin card (hardcoded, not editable) */}
      <div style={{ ...CARD, borderLeft:"4px solid #FF6B00", background:"linear-gradient(135deg,#FF6B0010,#0D1526)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", border:"2px solid rgba(255,107,0,.6)", boxShadow:"0 0 14px rgba(255,107,0,.3)", flexShrink:0 }}>
            <img src="/bcpl-website/bcpl-assets/bcpl-ball-color.jpg" alt="BCPL" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:"#FF6B00" }}>Saurabh Jha</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>saurabhjha@bcplt20.com</div>
            <div style={{ display:"flex", gap:6, marginTop:6 }}>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#FF6B0020", color:"#FF6B00", fontWeight:800 }}>Main Head</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#10B98120", color:"#10B981", fontWeight:700 }}>Full Access — All Sections</span>
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"#1E293B", color:"#475569", fontWeight:600 }}>Hardcoded · Cannot be removed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Total Co-Admins", value:admins.length,                                                                    color:"#6366F1" },
          { label:"Full Access",     value:admins.filter(a=>a.permissions.includes("all")).length,                           color:"#FF6B00" },
          { label:"Limited Access",  value:admins.filter(a=>!a.permissions.includes("all")).length,                          color:"#10B981" },
        ].map(s=>(
          <div key={s.label} style={{ ...CARD, borderTop:`3px solid ${s.color}`, padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Co-admin list */}
      {admins.length === 0 ? (
        <div style={{ ...CARD, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>No co-admins yet</div>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>Click "+ Add Admin" to give someone access with controlled permissions</div>
          <button onClick={()=>setModal("add")} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer" }}>
            + Add First Admin
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))", gap:14 }}>
          {admins.map(a=>(
            <div key={a.id} style={{ transition:"opacity .3s", opacity:deleted===a.id?0:1 }}>
              <AdminCard
                admin={a}
                onEdit={()=>setModal(a)}
                onDelete={()=>handleDelete(a.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div style={{ ...CARD, padding:"14px 20px", borderLeft:"4px solid #6366F1", background:"linear-gradient(135deg,#6366F110,#0D1526)" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:4 }}>How it works</div>
        <div style={{ fontSize:11, color:"#475569", lineHeight:1.7 }}>
          Co-admins see only the sections you assign. Passwords are stored in this browser's local storage — share them directly with the person.
          To remove access, click ✕ on their card. Changes take effect at next login.
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <AdminModal
          existing={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}
