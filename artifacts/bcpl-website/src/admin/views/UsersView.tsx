import { useState } from "react";

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

const allUsers = [
  { id:1, name:"Arjun Sharma",   phone:"9876543210", email:"arjun@gmail.com",  state:"Rajasthan",   city:"Jaipur",     joined:"Jul 18", phase1:true,  phase2:true,  active:true,  kyc:"approved", video:true,  registered:true,  role:"Batsman"        },
  { id:2, name:"Priya Patel",    phone:"9123456789", email:"priya@gmail.com",  state:"Gujarat",     city:"Ahmedabad",  joined:"Jul 17", phase1:true,  phase2:false, active:true,  kyc:"approved", video:true,  registered:true,  role:"All-rounder"    },
  { id:3, name:"Rahul Kumar",    phone:"8765432109", email:"rahul@gmail.com",  state:"Maharashtra", city:"Mumbai",     joined:"Jul 16", phase1:true,  phase2:true,  active:true,  kyc:"pending",  video:false, registered:true,  role:"Bowler"         },
  { id:4, name:"Sneha Verma",    phone:"7654321098", email:"sneha@gmail.com",  state:"UP",          city:"Lucknow",    joined:"Jul 15", phase1:false, phase2:false, active:false, kyc:"pending",  video:false, registered:true,  role:"Batsman"        },
  { id:5, name:"Vikas Singh",    phone:"6543210987", email:"vikas@gmail.com",  state:"Punjab",      city:"Amritsar",   joined:"Jul 14", phase1:true,  phase2:false, active:true,  kyc:"approved", video:true,  registered:true,  role:"Wicket-keeper"  },
  { id:6, name:"Anjali Rao",     phone:"9012345678", email:"anjali@gmail.com", state:"Karnataka",   city:"Bangalore",  joined:"Jul 14", phase1:false, phase2:false, active:false, kyc:"rejected", video:false, registered:false, role:"Bowler"         },
  { id:7, name:"Deepak Gupta",   phone:"8901234567", email:"deepak@gmail.com", state:"Delhi",       city:"New Delhi",  joined:"Jul 13", phase1:true,  phase2:true,  active:true,  kyc:"approved", video:true,  registered:true,  role:"All-rounder"    },
  { id:8, name:"Meena Joshi",    phone:"7890123456", email:"meena@gmail.com",  state:"MP",          city:"Bhopal",     joined:"Jul 12", phase1:true,  phase2:false, active:true,  kyc:"pending",  video:false, registered:true,  role:"Batsman"        },
  { id:9, name:"Sanjay Yadav",   phone:"6789012345", email:"sanjay@gmail.com", state:"Bihar",       city:"Patna",      joined:"Jul 12", phase1:false, phase2:false, active:true,  kyc:"pending",  video:false, registered:false, role:"Bowler"         },
  { id:10, name:"Kavita Nair",   phone:"5678901234", email:"kavita@gmail.com", state:"Kerala",      city:"Kochi",      joined:"Jul 11", phase1:true,  phase2:true,  active:true,  kyc:"approved", video:true,  registered:true,  role:"Wicket-keeper"  },
  { id:11, name:"Ajay Sharma",   phone:"9988776655", email:"ajay@gmail.com",   state:"Rajasthan",   city:"Jaipur",     joined:"Jul 10", phase1:true,  phase2:false, active:false, kyc:"approved", video:true,  registered:true,  role:"Batsman"        },
  { id:12, name:"Pooja Mehta",   phone:"9876001234", email:"pooja@gmail.com",  state:"Gujarat",     city:"Surat",      joined:"Jul 10", phase1:false, phase2:false, active:false, kyc:"pending",  video:false, registered:false, role:"All-rounder"    },
];

type QuickFilter = "all"|"active"|"inactive"|"phase1"|"phase2"|"no_payment"|"no_video"|"registered"|"not_registered";

const quickLabels: Record<QuickFilter,string> = {
  all:"All", active:"Active", inactive:"Inactive", phase1:"Phase 1 ✓", phase2:"Phase 2 ✓",
  no_payment:"No Payment", no_video:"No Video", registered:"Registered", not_registered:"Not Registered",
};

const kycColor = (k:string) => k==="approved"?"#10B981":k==="rejected"?"#EF4444":"#F59E0B";
const roleColor = (r:string) => r==="Batsman"?"#3B82F6":r==="Bowler"?"#EF4444":r==="All-rounder"?"#FF6B00":"#10B981";

export default function UsersView() {
  const [quick,    setQuick]    = useState<QuickFilter>("all");
  const [search,   setSearch]   = useState("");
  const [state,    setState]    = useState("All States");
  const [city,     setCity]     = useState("All Cities");
  const [role,     setRole]     = useState("All Roles");
  const [selected, setSelected] = useState<typeof allUsers[0]|null>(null);

  const filtered = allUsers.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.phone.includes(s) || u.email.includes(s);
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
    { label:"Total",         value:"8,430",  color:"#6366F1", q:"all"            as QuickFilter },
    { label:"Active",        value:"3,218",  color:"#10B981", q:"active"         as QuickFilter },
    { label:"Phase 1 Paid",  value:"3,812",  color:"#F59E0B", q:"phase1"         as QuickFilter },
    { label:"Phase 2 Paid",  value:"1,247",  color:"#FF6B00", q:"phase2"         as QuickFilter },
    { label:"No Payment",    value:"4,618",  color:"#EF4444", q:"no_payment"     as QuickFilter },
    { label:"Not Registered",value:"2,180",  color:"#64748B", q:"not_registered" as QuickFilter },
  ];

  const card: React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  return (
    <div style={{ display:"flex", gap:16 }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14, minWidth:0 }}>

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
                {["Player","Role","Location","Joined","Phase 1","Phase 2","KYC","Video","Status"].map(h=>(
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
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:`hsl(${u.id*37},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>{u.name[0]}</div>
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
                    <span style={{ padding:"3px 8px", borderRadius:5, fontSize:10, fontWeight:700, background:kycColor(u.kyc)+"22", color:kycColor(u.kyc) }}>{u.kyc}</span>
                  </td>
                  <td style={{ padding:"13px 14px" }}>{u.video?<span style={{ padding:"3px 10px", borderRadius:5, fontSize:10, fontWeight:700, background:"#3B82F622", color:"#3B82F6" }}>🎥 Yes</span>:<span style={{ fontSize:11, color:"#334155" }}>—</span>}</td>
                  <td style={{ padding:"13px 14px" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:u.active?"#10B981":"#475569" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:u.active?"#10B981":"#475569", display:"inline-block" }}/>
                      {u.active?"Active":"Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={9} style={{ padding:"40px", textAlign:"center", color:"#334155", fontSize:13 }}>No users match these filters.</td></tr>
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
            <div style={{ width:60, height:60, borderRadius:16, background:`hsl(${selected.id*37},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, color:"#fff", margin:"24px auto 12px" }}>{selected.name[0]}</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9" }}>{selected.name}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{selected.email}</div>
            <div style={{ fontSize:11, color:"#64748B" }}>{selected.phone}</div>
            <span style={{ display:"inline-block", margin:"10px 0 4px", padding:"3px 10px", borderRadius:5, fontSize:11, fontWeight:700, background:roleColor(selected.role)+"22", color:roleColor(selected.role) }}>{selected.role}</span>
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"#1E293B", color:"#94A3B8", fontSize:11, cursor:"pointer", fontWeight:600 }}>Message</button>
              <button style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:11, cursor:"pointer", fontWeight:700 }}>Full Profile</button>
            </div>
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Payment Status</div>
            {[{label:"Phase 1 (₹299)",done:selected.phase1},{label:"Phase 2 (₹2,000)",done:selected.phase2}].map(p=>(
              <div key={p.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #0F1B2D" }}>
                <span style={{ fontSize:12, color:"#94A3B8" }}>{p.label}</span>
                <span style={{ padding:"3px 9px", borderRadius:5, fontSize:10, fontWeight:700, background:p.done?"#10B98122":"#EF444422", color:p.done?"#10B981":"#EF4444" }}>{p.done?"Paid ✓":"Pending"}</span>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>KYC Verification</div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #10B981", background:"#10B98115", color:"#10B981", fontSize:11, cursor:"pointer", fontWeight:700 }}>✓ Approve</button>
              <button style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #EF4444", background:"#EF444415", color:"#EF4444", fontSize:11, cursor:"pointer", fontWeight:700 }}>✕ Reject</button>
            </div>
          </div>
          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Selection Video</div>
            {selected.video
              ? <div style={{ background:"#060B18", borderRadius:10, aspectRatio:"16/9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, cursor:"pointer", border:"1px solid #1E293B" }}>▶️</div>
              : <div style={{ padding:"16px", textAlign:"center", color:"#334155", fontSize:12, background:"#060B18", borderRadius:10, border:"1px dashed #1E293B" }}>No video uploaded</div>}
          </div>
        </div>
      )}
    </div>
  );
}
