import { useState } from "react";

// No export history yet — will populate as exports are generated
const EXPORTS: { name:string; rows:number; format:string; size:string; date:string; by:string }[] = [];

const DATASETS = [
  { id:"registrations", label:"Registrations",      icon:"👥", fields:["Name","Phone","Email","City","Role","Phase","Payment Status","Registration Date"] },
  { id:"payments",      label:"Payments & Invoices", icon:"💰", fields:["Transaction ID","Player","Amount","GST","Date","Status","Gateway","Invoice No"] },
  { id:"players",       label:"Selected Players",    icon:"🏏", fields:["Player Name","Team","Role","Stats","Auction Price","Phase 2 Status"] },
  { id:"trials",        label:"Trial Attendance",    icon:"📅", fields:["Player","City","Trial Date","Check-in Time","Status"] },
  { id:"kyc",           label:"KYC Data",            icon:"🪪", fields:["Player","DOB","ID Type","Verification Status","Date"] },
  { id:"referrals",     label:"Referral Analytics",  icon:"🔗", fields:["Referrer","Referred","Date","Commission","Status"] },
];

export default function DataExportView() {
  const [ds,       setDs]       = useState("registrations");
  const [format,   setFormat]   = useState("CSV");
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo,   setDateTo]   = useState("2026-07-20");
  const [city,     setCity]     = useState("All Cities");
  const [phase,    setPhase]    = useState("All Phases");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  function handleExport(){ setLoading(true); setTimeout(()=>{setLoading(false);setDone(true);setTimeout(()=>setDone(false),3000);},1800); }

  const selDs = DATASETS.find(d=>d.id===ds)!;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Data Export Center</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Export any dataset with filters — CSV, Excel, JSON</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        {/* Builder */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Dataset picker */}
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:14}}>1. Choose Dataset</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {DATASETS.map(d=>(
                <button key={d.id} onClick={()=>setDs(d.id)} style={{padding:"12px",borderRadius:10,border:`1px solid ${ds===d.id?"#FF6B00":"#1E293B"}`,background:ds===d.id?"#FF6B0018":"transparent",cursor:"pointer",textAlign:"left"}}>
                  <div style={{fontSize:20,marginBottom:6}}>{d.icon}</div>
                  <div style={{fontSize:12,fontWeight:700,color:ds===d.id?"#FF6B00":"#94A3B8"}}>{d.label}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Filters */}
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:14}}>2. Apply Filters</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>DATE FROM</label>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>DATE TO</label>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>CITY</label>
                <select value={city} onChange={e=>setCity(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:12,outline:"none"}}>
                  {["All Cities","Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>PHASE</label>
                <select value={phase} onChange={e=>setPhase(e.target.value)}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:12,outline:"none"}}>
                  {["All Phases","Phase 1 Paid","Phase 1 Unpaid","Phase 2 Selected","Phase 2 Paid"].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
          {/* Format + Export */}
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:14}}>3. Choose Format & Export</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {["CSV","Excel","JSON"].map(f=>(
                <button key={f} onClick={()=>setFormat(f)} style={{padding:"9px 20px",borderRadius:9,border:`1px solid ${format===f?"#FF6B00":"#1E293B"}`,background:format===f?"#FF6B0022":"transparent",color:format===f?"#FF6B00":"#64748B",fontSize:12,fontWeight:700,cursor:"pointer"}}>{f}</button>
              ))}
            </div>
            <button onClick={handleExport} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:done?"linear-gradient(135deg,#10B981,#059669)":loading?"#334155":"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:800,fontSize:14,cursor:loading?"not-allowed":"pointer",transition:"background .3s"}}>
              {done?"✅ Download Ready!":loading?"⏳ Preparing Export…":"⬇ Export "+selDs.label}
            </button>
          </div>
        </div>

        {/* Preview + History */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:12}}>Fields Included</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {selDs.fields.map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#060B18",borderRadius:8,border:"1px solid #1E293B"}}>
                  <span style={{fontSize:12,color:"#10B981",lineHeight:1}}>✓</span>
                  <span style={{fontSize:12,color:"#94A3B8"}}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:12}}>Recent Exports</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {EXPORTS.map((e,i)=>(
                <div key={i} style={{padding:"10px 12px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#F1F5F9",lineHeight:1.4,flex:1,marginRight:8}}>{e.name}</div>
                    <button style={{padding:"3px 8px",borderRadius:5,border:"none",background:"#FF6B0022",color:"#FF6B00",fontSize:10,cursor:"pointer",flexShrink:0}}>↓</button>
                  </div>
                  <div style={{fontSize:10,color:"#475569",marginTop:4}}>{e.rows.toLocaleString()} rows · {e.format} · {e.size} · {e.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
