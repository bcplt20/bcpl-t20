import { useState, useRef } from "react";

const TEAMS = ["Rajasthan Scorchers","Punjab Warriors","Kolkata Tigers","Lucknow Nawabs","Mumbai Mavericks","Hyderabad Hawks","Delhi Suryas","Chennai Thalaivas","Ahmedabad Lions","Bengaluru Rockets"];
const VENUES = ["Wankhede, Mumbai","SMS, Jaipur","PCA, Mohali","Ekana, Lucknow","Eden Gardens, Kolkata","Chinnaswamy, Bengaluru","Rajiv Gandhi, Hyderabad","MA Chidambaram, Chennai","Motera, Ahmedabad","Feroz Shah Kotla, Delhi"];

type Match = { id:number; team1:string; team2:string; date:string; time:string; venue:string; status:"scheduled"|"live"|"completed"; t1Score:string|null; t2Score:string|null; winner?:string };

// No matches yet — add matches using the "+ Schedule Match" button
const initMatches:Match[] = [];

const statusColor=(s:string)=>s==="live"?"#EF4444":s==="scheduled"?"#3B82F6":"#10B981";
const statusBg   =(s:string)=>s==="live"?"#EF444422":s==="scheduled"?"#3B82F622":"#10B98122";

const SAMPLE_CSV = `Team 1,Team 2,Date,Time,Venue
Rajasthan Scorchers,Punjab Warriors,2025-08-01,18:00,SMS Jaipur
Mumbai Mavericks,Kolkata Tigers,2025-08-02,16:00,Wankhede Mumbai
Lucknow Nawabs,Delhi Suryas,2025-08-03,18:00,Ekana Lucknow`;

export default function MatchesView() {
  const [matches,     setMatches]     = useState<Match[]>(initMatches);
  const [filter,      setFilter]      = useState<"all"|"live"|"scheduled"|"completed">("all");
  const [showAdd,     setShowAdd]     = useState(false);
  const [showBulk,    setShowBulk]    = useState(false);
  const [bulkPreview, setBulkPreview] = useState<Match[]>([]);
  const [csvText,     setCsvText]     = useState("");
  const [form,        setForm]        = useState({ team1:TEAMS[0], team2:TEAMS[1], date:"", time:"18:00", venue:VENUES[0] });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = filter==="all"?matches:matches.filter(m=>m.status===filter);

  const parseCsv = (text:string) => {
    const lines = text.trim().split("\n").slice(1);
    return lines.map((l,i):Match => {
      const parts = l.split(",").map(s=>s.trim());
      return { id:Date.now()+i, team1:parts[0]||"TBD", team2:parts[1]||"TBD", date:parts[2]||"", time:parts[3]||"18:00", venue:parts[4]||"TBD", status:"scheduled", t1Score:null, t2Score:null };
    });
  };

  const handleFile = (file:File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvText(text);
      setBulkPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Match Management</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Schedule, track and manage all BCPL fixtures</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setShowBulk(true)} style={{ padding:"10px 18px", borderRadius:10, border:"1px solid #334155", background:"transparent", color:"#94A3B8", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            📊 Bulk Upload via Excel
          </button>
          <button onClick={()=>setShowAdd(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            🏏 + Add Match
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          {label:"Total Matches",value:matches.length,            color:"#6366F1",icon:"🏏"},
          {label:"Live Now",     value:matches.filter(m=>m.status==="live").length, color:"#EF4444",icon:"🔴"},
          {label:"Scheduled",   value:matches.filter(m=>m.status==="scheduled").length, color:"#3B82F6",icon:"📅"},
          {label:"Completed",   value:matches.filter(m=>m.status==="completed").length, color:"#10B981",icon:"✅"},
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderLeft:`3px solid ${s.color}`, display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:28, fontWeight:800, color:"#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display:"flex", gap:6 }}>
        {(["all","live","scheduled","completed"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"8px 18px", borderRadius:8, border:"1px solid",
            borderColor:filter===f?statusColor(f==="all"?"scheduled":f):"#1E293B",
            background:filter===f?statusBg(f==="all"?"scheduled":f):"transparent",
            color:filter===f?statusColor(f==="all"?"scheduled":f):"#64748B",
            fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize",
          }}>
            {f==="live"&&"● "}{f==="all"?"All Matches":f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map(m=>(
          <div key={m.id} style={{ ...card, position:"relative", overflow:"hidden" }}>
            {m.status==="live"&&<div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#EF4444,#FF6B00,#EF4444)" }}/>}
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>{m.team1}</div>
                {m.t1Score&&<div style={{ fontSize:18, fontWeight:800, color:m.winner===m.team1?"#10B981":"#F1F5F9" }}>{m.t1Score}</div>}
              </div>
              <div style={{ textAlign:"center", minWidth:140 }}>
                <span style={{ display:"block", padding:"4px 14px", borderRadius:20, fontSize:10, fontWeight:800, background:statusBg(m.status), color:statusColor(m.status), marginBottom:8, textTransform:"uppercase" }}>
                  {m.status==="live"?"● LIVE":m.status}
                </span>
                <div style={{ fontSize:20, color:"#334155", fontWeight:800 }}>VS</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:6 }}>{m.date} · {m.time}</div>
                <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>📍 {m.venue}</div>
              </div>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>{m.team2}</div>
                {m.t2Score&&<div style={{ fontSize:18, fontWeight:800, color:m.winner===m.team2?"#10B981":"#F1F5F9" }}>{m.t2Score}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginLeft:8 }}>
                {m.status==="live"&&<button style={{ padding:"7px 14px", borderRadius:7, border:"none", background:"#EF444422", color:"#EF4444", fontSize:11, fontWeight:700, cursor:"pointer" }}>🔴 Score</button>}
                <button style={{ padding:"7px 14px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Edit</button>
                {m.status==="scheduled"&&<button onClick={()=>setMatches(p=>p.filter(x=>x.id!==m.id))} style={{ padding:"7px 14px", borderRadius:7, border:"none", background:"#EF444415", color:"#EF4444", fontSize:11, cursor:"pointer" }}>Cancel</button>}
              </div>
            </div>
            {m.winner&&<div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #0F1B2D" }}><span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>🏆 Winner: {m.winner}</span></div>}
          </div>
        ))}
      </div>

      {/* Add Match Modal */}
      {showAdd&&(
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:480 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>🏏 Schedule New Match</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {([{label:"Team 1",key:"team1",type:"select",opts:TEAMS},{label:"Team 2",key:"team2",type:"select",opts:TEAMS},{label:"Match Date",key:"date",type:"date"},{label:"Time",key:"time",type:"time"}] as any[]).map(f=>(
                <div key={f.key}>
                  <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>{f.label}</label>
                  {f.type==="select"
                    ? <select value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none" }}>{f.opts.map((o:string)=><option key={o}>{o}</option>)}</select>
                    : <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>}
                </div>
              ))}
            </div>
            <div style={{ marginTop:14 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Venue</label>
              <select value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                {VENUES.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{
                if(form.date) { setMatches(p=>[...p,{id:Date.now(),...form,status:"scheduled",t1Score:null,t2Score:null}]); setShowAdd(false); }
              }} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Schedule Match</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk&&(
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:640, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>📊 Bulk Fixture Upload</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>Upload an Excel/CSV file with your complete fixture schedule</div>

            {/* Format guide */}
            <div style={{ background:"#060B18", borderRadius:10, padding:"14px 16px", border:"1px solid #1E293B", marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", marginBottom:8 }}>📋 Required CSV Format:</div>
              <pre style={{ fontSize:11, color:"#64748B", margin:0, fontFamily:"monospace", lineHeight:1.6 }}>Team 1,Team 2,Date,Time,Venue{"\n"}Rajasthan Scorchers,Punjab Warriors,2025-08-01,18:00,SMS Jaipur{"\n"}Mumbai Mavericks,Kolkata Tigers,2025-08-02,16:00,Wankhede Mumbai</pre>
              <button onClick={()=>{const a=document.createElement("a");a.href="data:text/plain,"+encodeURIComponent(SAMPLE_CSV);a.download="bcpl_fixture_template.csv";a.click();}} style={{ marginTop:10, padding:"6px 14px", borderRadius:7, border:"1px solid #334155", background:"transparent", color:"#64748B", fontSize:11, cursor:"pointer" }}>
                ⬇ Download Template
              </button>
            </div>

            {/* Drag-drop zone */}
            <div
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) handleFile(f); }}
              onClick={()=>fileRef.current?.click()}
              style={{ background:"#060B18", borderRadius:12, border:"2px dashed #334155", padding:"32px", textAlign:"center", cursor:"pointer", marginBottom:14 }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#334155")}>
              <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:14, color:"#94A3B8", fontWeight:600 }}>Drag & drop your .CSV or .XLS file here</div>
              <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>or click to browse</div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:"none" }} onChange={e=>{ if(e.target.files?.[0]) handleFile(e.target.files[0]); }}/>
            </div>

            {/* Or paste CSV */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>OR Paste CSV Text Directly:</label>
              <textarea value={csvText} onChange={e=>{ setCsvText(e.target.value); setBulkPreview(parseCsv(e.target.value)); }} rows={5}
                placeholder="Team 1,Team 2,Date,Time,Venue&#10;Rajasthan Scorchers,Punjab Warriors,2025-08-01,18:00,SMS Jaipur"
                style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"monospace" }}/>
            </div>

            {/* Preview */}
            {bulkPreview.length>0&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#10B981", marginBottom:10 }}>✓ {bulkPreview.length} matches detected — Preview:</div>
                <div style={{ maxHeight:180, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                  {bulkPreview.map((m,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, padding:"10px 12px", background:"#060B18", borderRadius:8, border:"1px solid #1E293B", fontSize:12, color:"#94A3B8" }}>
                      <span style={{ color:"#F1F5F9", fontWeight:600 }}>{m.team1}</span>
                      <span style={{ color:"#FF6B00", fontWeight:800 }}>vs</span>
                      <span style={{ color:"#F1F5F9", fontWeight:600 }}>{m.team2}</span>
                      <span style={{ marginLeft:"auto" }}>{m.date} · {m.time}</span>
                      <span>📍 {m.venue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{ setShowBulk(false); setBulkPreview([]); setCsvText(""); }} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button disabled={bulkPreview.length===0} onClick={()=>{ setMatches(p=>[...p,...bulkPreview]); setShowBulk(false); setBulkPreview([]); setCsvText(""); }}
                style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:bulkPreview.length>0?"linear-gradient(135deg,#FF6B00,#FF8C40)":"#1E293B", color:bulkPreview.length>0?"#fff":"#475569", fontSize:13, fontWeight:700, cursor:bulkPreview.length>0?"pointer":"not-allowed" }}>
                Import {bulkPreview.length>0?`${bulkPreview.length} Matches`:""}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
