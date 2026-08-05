import { useState, useEffect } from "react";
import { adminGetRegistrations, adminUpdateKycStatus } from "../../lib/api";

const STATES = ["All States","Rajasthan","Gujarat","Maharashtra","Delhi","Punjab","UP","Karnataka","Bihar","Kerala","MP","Haryana","West Bengal","Tamil Nadu","Telangana"];
const CITIES: Record<string,string[]> = {
  "All States": ["All Cities"],
  Rajasthan: ["All Cities","Jaipur","Jodhpur","Udaipur","Kota"],
  Gujarat: ["All Cities","Ahmedabad","Surat","Vadodara","Rajkot"],
  Maharashtra: ["All Cities","Mumbai","Pune","Nagpur","Nashik"],
  Delhi: ["All Cities","New Delhi","Dwarka","Rohini"],
  Punjab: ["All Cities","Amritsar","Ludhiana","Chandigarh"],
  UP: ["All Cities","Lucknow","Kanpur","Varanasi","Agra"],
  Karnataka: ["All Cities","Bangalore","Mysore","Hubli"],
  Bihar: ["All Cities","Patna","Gaya","Muzaffarpur"],
  Kerala: ["All Cities","Kochi","Thiruvananthapuram","Kozhikode"],
  MP: ["All Cities","Bhopal","Indore","Jabalpur"],
  Haryana: ["All Cities","Gurugram","Faridabad","Panipat"],
  "West Bengal": ["All Cities","Kolkata","Howrah","Durgapur"],
  "Tamil Nadu": ["All Cities","Chennai","Coimbatore","Madurai"],
  Telangana: ["All Cities","Hyderabad","Warangal","Karimnagar"],
};

// city → state reverse lookup for registrations (only trialCity is stored)
const CITY_TO_STATE: Record<string,string> = {};
for (const [st, cities] of Object.entries(CITIES)) {
  if (st === "All States") continue;
  for (const c of cities) if (c !== "All Cities") CITY_TO_STATE[c.toLowerCase()] = st;
}

const ROLE_LABEL: Record<string,string> = {
  bat:"Batsman", bowl:"Bowler", ar:"All-rounder", wk:"Wicket-keeper",
};

const PAID_STATUSES = ["payment_done","video_submitted","selected","rejected"];

type UserRow = { id:string; regNumber:string|null; num:number; name:string; phone:string; email:string; state:string; city:string; joined:string; phase1:boolean; phase2:boolean; active:boolean; kyc:string; kycId:string|null; video:boolean; videoUrl:string|null; registered:boolean; role:string };

type ApiReg = {
  id:string; regNumber?:string|null; role:string; trialCity:string; phase1Status:string; phase2Status:string|null; createdAt:string;
  user:{ id:string; name:string; phone:string; email:string }|null;
  payment:{ status:string; amount:string; paidAt:string|null }|null;
  video:{ status:string; submittedAt:string; s3Url?:string|null }|null;
  kyc?:{ id:string; status:string; panVerified:boolean; verifiedAt:string|null }|null;
};

const toRow = (r: ApiReg, i: number): UserRow => {
  const city = r.trialCity || "—";
  const paid1 = r.payment?.status === "paid" || PAID_STATUSES.includes(r.phase1Status);
  return {
    id: r.id,
    regNumber: r.regNumber ?? null,
    num: i + 1,
    name: r.user?.name ?? "Unknown",
    phone: r.user?.phone ?? "",
    email: r.user?.email ?? "",
    state: CITY_TO_STATE[city.toLowerCase()] ?? "—",
    city,
    joined: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—",
    phase1: paid1,
    phase2: ["payment_done","kyc_done","selected"].includes(r.phase2Status ?? ""),
    active: r.createdAt ? Date.now() - new Date(r.createdAt).getTime() < 30*24*3600*1000 : false,
    kyc: r.kyc?.status ?? "not_started",
    kycId: r.kyc?.id ?? null,
    video: !!r.video,
    videoUrl: r.video?.s3Url ?? null,
    registered: true,
    role: ROLE_LABEL[r.role] ?? r.role ?? "—",
  };
};

type QuickFilter = "all"|"active"|"inactive"|"phase1"|"phase2"|"no_payment"|"no_video"|"registered"|"not_registered";

const quickLabels: Record<QuickFilter,string> = {
  all:"All", active:"Active", inactive:"Inactive", phase1:"Phase 1 ✓", phase2:"Phase 2 ✓",
  no_payment:"No Payment", no_video:"No Video", registered:"Registered", not_registered:"Not Registered",
};

const KYC_LABEL: Record<string,string> = { not_started:"Not submitted", pending:"Pending", verified:"Verified", failed:"Failed" };
const kycColor = (k:string) => k==="verified"?"#10B981":k==="failed"?"#EF4444":k==="pending"?"#F59E0B":"#475569";
const roleColor = (r:string) => r==="Batsman"?"#3B82F6":r==="Bowler"?"#EF4444":r==="All-rounder"?"#FF6B00":"#10B981";

type NavPayload = { quick?: string; filter?: string; focusId?: string };

function RegIdBadge({ regNumber }: { regNumber: string | null }) {
  if (regNumber) {
    return (
      <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:800, fontFamily:"monospace", background:"#FF6B0018", color:"#FF9A57", border:"1px solid #FF6B0040", whiteSpace:"nowrap" }}>
        {regNumber}
      </span>
    );
  }
  return (
    <span title="Registration ID is assigned after Phase 1 payment" style={{ display:"inline-block", padding:"3px 9px", borderRadius:6, fontSize:10, fontWeight:700, background:"#1E293B", color:"#64748B", border:"1px solid #23324A", whiteSpace:"nowrap" }}>
      Payment pending
    </span>
  );
}

export default function UsersView({ onNavigate, initialQuick, refreshTick = 0 }: { onNavigate?: (tab: string, payload?: NavPayload) => void; initialQuick?: string; refreshTick?: number }) {
  const validQuick = (Object.keys(quickLabels) as QuickFilter[]).includes(initialQuick as QuickFilter) ? (initialQuick as QuickFilter) : "all";
  const [quick,    setQuick]    = useState<QuickFilter>(validQuick);
  const [search,   setSearch]   = useState("");
  const [state,    setState]    = useState("All States");
  const [city,     setCity]     = useState("All Cities");
  const [role,     setRole]     = useState("All Roles");
  const [selected, setSelected] = useState<UserRow|null>(null);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");

  // Fetches on mount and again whenever refreshTick bumps (auto-refresh).
  // Data swaps in place — the table stays on screen until new rows land.
  useEffect(() => {
    adminGetRegistrations()
      .then(({ registrations }) => { setAllUsers((registrations as ApiReg[]).map(toRow)); setErr(""); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [refreshTick]);

  const [kycBusy, setKycBusy] = useState(false);
  const updateKyc = async (status: "verified" | "failed") => {
    if (!selected?.kycId) return;
    setKycBusy(true);
    try {
      await adminUpdateKycStatus(selected.kycId, status);
      setAllUsers(prev => prev.map(u => u.id === selected.id ? { ...u, kyc: status } : u));
      setSelected(s => s ? { ...s, kyc: status } : s);
    } catch (e: any) {
      alert("KYC update failed: " + e.message);
    } finally {
      setKycBusy(false);
    }
  };

  const filtered = allUsers.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.phone.includes(s) || u.email.toLowerCase().includes(s);
    const matchState  = state==="All States" || u.state===state;
    const matchCity   = city==="All Cities"  || u.city===city;
    const matchRole   = role==="All Roles"   || u.role===role;
    const matchQuick  =
      quick==="all"            ? true :
      quick==="active"         ? u.active :
      quick==="inactive"       ? !u.active :
      quick==="phase1"         ? u.phase1 :
      quick==="phase2"         ? u.phase2 :
      quick==="no_payment"     ? (!u.phase1&&!u.phase2) :
      quick==="no_video"       ? !u.video :
      quick==="registered"     ? u.registered :
      quick==="not_registered" ? !u.registered : true;
    return matchSearch&&matchState&&matchCity&&matchRole&&matchQuick;
  });

  const stats = [
    { label:"Total",         value:filtered.length || 0, color:"#6366F1", q:"all"            as QuickFilter },
    { label:"Active",        value:allUsers.filter(u=>u.active).length, color:"#10B981", q:"active" as QuickFilter },
    { label:"Phase 1 Paid",  value:allUsers.filter(u=>u.phase1).length, color:"#F59E0B", q:"phase1" as QuickFilter },
    { label:"Phase 2 Paid",  value:allUsers.filter(u=>u.phase2).length, color:"#FF6B00", q:"phase2" as QuickFilter },
    { label:"No Payment",    value:allUsers.filter(u=>!u.phase1&&!u.phase2).length, color:"#EF4444", q:"no_payment" as QuickFilter },
    { label:"Not Registered",value:allUsers.filter(u=>!u.registered).length, color:"#64748B", q:"not_registered" as QuickFilter },
  ];

  const card: React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  return (
    <div style={{ display:"flex", gap:16 }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14, minWidth:0 }}>

        {err && (
          <div style={{ padding:"12px 16px", background:"#EF444415", border:"1px solid #EF444444", borderRadius:12, color:"#EF4444", fontSize:13 }}>
            Failed to load users: {err}
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
          {stats.map(s => (
            <div key={s.label} onClick={() => setQuick(s.q)} style={{ ...card, padding:14, cursor:"pointer", borderTop:`3px solid ${s.color}`, opacity:quick===s.q?1:0.65, transition:"all 0.2s" }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#64748B", marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Advanced Filter Row ── */}
        <div style={{ ...card, padding:"14px 16px" }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {/* Search */}
            <div style={{ position:"relative", flex:"1 1 200px" }}>
              <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#475569", fontSize:13 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search name / phone / email…"
                style={{ width:"100%", padding:"9px 12px 9px 34px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* State */}
            <select value={state} onChange={e=>{ setState(e.target.value); setCity("All Cities"); }}
              style={{ padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none" }}>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>

            {/* City */}
            <select value={city} onChange={e=>setCity(e.target.value)}
              style={{ padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none" }}>
              {(CITIES[state]||["All Cities"]).map(c=><option key={c}>{c}</option>)}
            </select>

            {/* Role */}
            <select value={role} onChange={e=>setRole(e.target.value)}
              style={{ padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none" }}>
              {["All Roles","Batsman","Bowler","All-rounder","Wicket-keeper"].map(r=><option key={r}>{r}</option>)}
            </select>

            <span style={{ fontSize:11, color:"#475569", marginLeft:"auto" }}>{filtered.length} results</span>
            {(search||state!=="All States"||city!=="All Cities"||role!=="All Roles") && (
              <button onClick={()=>{ setSearch(""); setState("All States"); setCity("All Cities"); setRole("All Roles"); }}
                style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer", fontWeight:700 }}>
                Clear ✕
              </button>
            )}
            {/* Export buttons */}
            <button onClick={()=>{
              const headers = ["Reg Number","Name","Phone","Email","State","City","Joined","Phase1","Phase2","KYC","Video","Role","Active"];
              const rows = filtered.map(u=>[u.regNumber ?? "Payment pending",u.name,u.phone,u.email,u.state,u.city,u.joined,u.phase1?"Yes":"No",u.phase2?"Yes":"No",u.kyc,u.video?"Yes":"No",u.role,u.active?"Yes":"No"]);
              const csv = [headers,...rows].map(r=>r.join(",")).join("\n");
              const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`bcpl_users_${quick}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
            }} style={{ padding:"7px 13px", borderRadius:8, border:"1px solid #10B98144", background:"#10B98112", color:"#10B981", fontSize:11, cursor:"pointer", fontWeight:700 }}>
              ⬇ Excel
            </button>
            <button onClick={()=>{
              const w=window.open("","_blank");if(!w)return;
              const rows=filtered.map(u=>`<tr style="border-bottom:1px solid #eee"><td>${u.name}</td><td>${u.phone}</td><td>${u.email}</td><td>${u.state}, ${u.city}</td><td>${u.role}</td><td>${u.phase1?"✓ Phase 1":""} ${u.phase2?"✓ Phase 2":""}</td><td>${u.kyc}</td><td>${u.active?"Active":"Inactive"}</td></tr>`).join("");
              w.document.write(`<!DOCTYPE html><html><head><title>BCPL Players Export</title>
              <style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}
              .header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #FF6B00;padding-bottom:12px;margin-bottom:20px}
              .logo{width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid #FF6B00}
              .logo img{width:100%;height:100%;object-fit:cover}
              h1{margin:0;font-size:18px;color:#FF6B00}p{margin:2px 0;font-size:10px;color:#555}
              table{width:100%;border-collapse:collapse;margin-top:12px}
              th{background:#FF6B00;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase}
              td{padding:5px 8px;border-bottom:1px solid #eee;font-size:10px}
              tr:nth-child(even){background:#FFF5EE}
              .footer{margin-top:20px;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:10px}
              @media print{body{padding:0}}</style></head><body>
              <div class="header">
                <div class="logo"><img src="/bcpl-website/bcpl-assets/bcpl-ball-color.jpg"/></div>
                <div><h1>BCPL T20 — Player Report</h1>
                <p>Bhartiya Corporate Premier League · Season 5 (2026–27)</p>
                <p>Filter: ${quickLabels[quick]}${state!=="All States"?" · "+state:""}${city!=="All Cities"?" · "+city:""} · ${filtered.length} players · Generated: ${new Date().toLocaleDateString("en-IN")}</p></div>
              </div>
              <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Location</th><th>Role</th><th>Payments</th><th>KYC</th><th>Status</th></tr></thead>
              <tbody>${rows}</tbody></table>
              </body></html>`);w.document.close();setTimeout(()=>w.print(),500);
            }} style={{ padding:"7px 13px", borderRadius:8, border:"1px solid #6366F144", background:"#6366F112", color:"#6366F1", fontSize:11, cursor:"pointer", fontWeight:700 }}>
              🖨 PDF
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
            {(Object.keys(quickLabels) as QuickFilter[]).map(q=>(
              <button key={q} onClick={()=>setQuick(q)} style={{
                padding:"5px 13px", borderRadius:20, border:"1px solid",
                borderColor: quick===q?"#FF6B00":"#1E293B",
                background: quick===q?"#FF6B0022":"transparent",
                color: quick===q?"#FF6B00":"#64748B",
                fontSize:11, fontWeight:700, cursor:"pointer",
              }}>{quickLabels[q]}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1E293B", background:"#060E1C" }}>
                {["Reg ID","Player","Role","Location","Joined","Phase 1","Phase 2","KYC","Video","Status"].map(h=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u=>(
                <tr key={u.id} onClick={()=>setSelected(u)} style={{
                  borderBottom:"1px solid #0F1B2D", cursor:"pointer",
                  background:selected?.id===u.id?"#FF6B0010":"transparent",
                  transition:"background 0.15s",
                }}>
                  <td style={{ padding:"13px 14px" }}>
                    <RegIdBadge regNumber={u.regNumber} />
                  </td>
                  <td style={{ padding:"13px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:`hsl(${u.num*37},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>{u.name[0]}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#F1F5F9" }}>{u.name}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"13px 14px" }}>
                    <span style={{ padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:700, background:roleColor(u.role)+"22", color:roleColor(u.role) }}>{u.role}</span>
                  </td>
                  <td style={{ padding:"13px 14px" }}>
                    <div style={{ fontSize:12, color:"#94A3B8" }}>{u.city}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>{u.state}</div>
                  </td>
                  <td style={{ padding:"13px 14px", fontSize:11, color:"#64748B" }}>{u.joined}</td>
                  <td style={{ padding:"13px 14px", textAlign:"center" }}><span style={{ fontSize:15 }}>{u.phase1?"✅":"❌"}</span></td>
                  <td style={{ padding:"13px 14px", textAlign:"center" }}><span style={{ fontSize:15 }}>{u.phase2?"✅":"❌"}</span></td>
                  <td style={{ padding:"13px 14px" }}>
                    <span style={{ padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:700, background:kycColor(u.kyc)+"22", color:kycColor(u.kyc) }}>{KYC_LABEL[u.kyc] ?? u.kyc}</span>
                  </td>
                  <td style={{ padding:"13px 14px" }}>{u.video?(u.videoUrl?<a href={u.videoUrl} target="_blank" rel="noreferrer" title="Watch video in new tab" onClick={e=>e.stopPropagation()} style={{ padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:700, background:"#3B82F622", color:"#3B82F6", border:"1px solid #3B82F644", textDecoration:"none", display:"inline-block" }}>🎥 Watch</a>:<span style={{ padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:700, background:"#3B82F622", color:"#3B82F6" }}>🎥 Yes</span>):<span style={{ fontSize:11, color:"#334155" }}>—</span>}</td>
                  <td style={{ padding:"13px 14px" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:u.active?"#10B981":"#475569" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:u.active?"#10B981":"#475569", display:"inline-block" }}/>
                      {u.active?"Active":"Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={10} style={{ padding:"40px", textAlign:"center", color:"#334155", fontSize:13 }}>
                  {loading ? "Loading users…" : allUsers.length===0 ? "No registrations yet." : "No users match these filters."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ width:290, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...card, textAlign:"center" }}>
            <button onClick={()=>setSelected(null)} style={{ float:"right", background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
            <div style={{ width:60, height:60, borderRadius:16, background:`hsl(${selected.num*37},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", margin:"24px auto 12px" }}>{selected.name[0]}</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9" }}>{selected.name}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{selected.email}</div>
            <div style={{ fontSize:11, color:"#64748B" }}>{selected.phone}</div>
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, fontWeight:800, color:"#475569", letterSpacing:1, marginBottom:4 }}>REGISTRATION ID</div>
              {selected.regNumber
                ? <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:800, fontFamily:"monospace", background:"#FF6B0018", color:"#FF9A57", border:"1px solid #FF6B0040" }}>{selected.regNumber}</span>
                : <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, background:"#1E293B", color:"#64748B", border:"1px solid #23324A" }}>Payment pending</span>}
            </div>
            <div onClick={()=>onNavigate?.("phase1_regs",{ focusId:selected.id })} title="Open the full registration record"
              style={{ fontSize:9, color:"#475569", marginTop:6, cursor:"pointer", wordBreak:"break-all", textDecoration:"underline" }}>
              Internal ID: {selected.id}
            </div>
            <span style={{ display:"inline-block", margin:"10px 0 4px", padding:"3px 10px", borderRadius:5, fontSize:11, fontWeight:700, background:roleColor(selected.role)+"22", color:roleColor(selected.role) }}>{selected.role}</span>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              {selected.email ? (
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent("BCPL T20 — About your registration")}`}
                  style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"#1E293B", color:"#94A3B8", fontSize:11, cursor:"pointer", fontWeight:600, textDecoration:"none", textAlign:"center" }}>✉ Message</a>
              ) : (
                <button disabled title="No email on record" style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"#11182B", color:"#334155", fontSize:11, cursor:"not-allowed", fontWeight:600 }}>✉ Message</button>
              )}
              <button onClick={()=>onNavigate?.("phase1_regs",{ focusId:selected.id })}
                style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:11, cursor:"pointer", fontWeight:700 }}>Full Profile</button>
            </div>
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Payment Status</div>
            {[{label:"Phase 1 Fee",done:selected.phase1},{label:"Phase 2 Fee",done:selected.phase2}].map(p=>(
              <div key={p.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #0F1B2D" }}>
                <span style={{ fontSize:12, color:"#94A3B8" }}>{p.label}</span>
                <span style={{ padding:"3px 9px", borderRadius:5, fontSize:10, fontWeight:700, background:p.done?"#10B98122":"#EF444422", color:p.done?"#10B981":"#EF4444" }}>{p.done?"Paid ✓":"Pending"}</span>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>KYC Verification</div>
            <div style={{ marginBottom:10 }}>
              <span style={{ padding:"3px 9px", borderRadius:5, fontSize:10, fontWeight:700, background:kycColor(selected.kyc)+"22", color:kycColor(selected.kyc) }}>{KYC_LABEL[selected.kyc] ?? selected.kyc}</span>
            </div>
            {selected.kycId ? (
              <div style={{ display:"flex", gap:8 }}>
                <button disabled={kycBusy||selected.kyc==="verified"} onClick={()=>updateKyc("verified")}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #10B981", background:"#10B98115", color:"#10B981", fontSize:11, cursor:kycBusy||selected.kyc==="verified"?"not-allowed":"pointer", fontWeight:700, opacity:kycBusy||selected.kyc==="verified"?0.5:1 }}>✓ Approve</button>
                <button disabled={kycBusy||selected.kyc==="failed"} onClick={()=>updateKyc("failed")}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #EF4444", background:"#EF444415", color:"#EF4444", fontSize:11, cursor:kycBusy||selected.kyc==="failed"?"not-allowed":"pointer", fontWeight:700, opacity:kycBusy||selected.kyc==="failed"?0.5:1 }}>✕ Reject</button>
              </div>
            ) : (
              <div style={{ fontSize:12, color:"#334155" }}>KYC not submitted yet</div>
            )}
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Selection Video</div>
            {selected.video && selected.videoUrl
              ? <a href={selected.videoUrl} target="_blank" rel="noreferrer" title="Watch video in new tab"
                  style={{ background:"#060B18", borderRadius:10, aspectRatio:"16/9", display:"flex", flexDirection:"column", gap:6, alignItems:"center", justifyContent:"center", cursor:"pointer", border:"1px solid #1E293B", textDecoration:"none" }}>
                  <span style={{ fontSize:32 }}>▶️</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#3B82F6" }}>Watch video</span>
                </a>
              : selected.video
              ? <div style={{ padding:"16px", textAlign:"center", color:"#64748B", fontSize:12, background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>Video submitted — link unavailable</div>
              : <div style={{ padding:"16px", textAlign:"center", color:"#334155", fontSize:12, background:"#060B18", borderRadius:10, border:"1px dashed #1E293B" }}>No video uploaded</div>}
          </div>
        </div>
      )}
    </div>
  );
}
