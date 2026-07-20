import { useState } from "react";

type Video = { id:string; player:string; city:string; role:string; uploaded:string; duration:string; score:number|null; status:string; notes:string; thumb:string };

const VIDEOS: Video[] = [
  { id:"VID-001", player:"Rahul Verma",   city:"Mumbai",    role:"Batsman",    uploaded:"2h ago",  duration:"2:34", score:null, status:"Pending", notes:"", thumb:"🏏" },
  { id:"VID-002", player:"Arjun Patel",   city:"Delhi",     role:"Bowler",     uploaded:"3h ago",  duration:"3:12", score:null, status:"Pending", notes:"", thumb:"🎯" },
  { id:"VID-003", player:"Kiran Sharma",  city:"Bengaluru", role:"All-Rounder",uploaded:"4h ago",  duration:"2:58", score:92,   status:"Approved",notes:"Excellent technique, strong drives", thumb:"⭐" },
  { id:"VID-004", player:"Suresh Nair",   city:"Chennai",   role:"WK-Batsman", uploaded:"5h ago",  duration:"2:10", score:76,   status:"Approved",notes:"Good keeping skills", thumb:"🧤" },
  { id:"VID-005", player:"Dev Mehta",     city:"Hyderabad", role:"Batsman",    uploaded:"6h ago",  duration:"1:48", score:null, status:"Pending", notes:"", thumb:"🏏" },
  { id:"VID-006", player:"Amit Singh",    city:"Kolkata",   role:"Bowler",     uploaded:"8h ago",  duration:"3:00", score:48,   status:"Rejected",notes:"Video quality too poor — reshoot needed", thumb:"📹" },
  { id:"VID-007", player:"Priya Nair",    city:"Pune",      role:"All-Rounder",uploaded:"10h ago", duration:"2:45", score:null, status:"Pending", notes:"", thumb:"🏏" },
  { id:"VID-008", player:"Kavita Reddy",  city:"Hyderabad", role:"Batsman",    uploaded:"12h ago", duration:"2:22", score:85,   status:"Approved",notes:"Consistent footwork", thumb:"⭐" },
  { id:"VID-009", player:"Rohit Das",     city:"Bengaluru", role:"Bowler",     uploaded:"1d ago",  duration:"2:55", score:null, status:"Pending", notes:"", thumb:"🎯" },
];

const statusColor=(s:string)=>s==="Approved"?"#10B981":s==="Pending"?"#F59E0B":"#EF4444";

export default function VideoReviewView() {
  const [filter, setFilter]  = useState("Pending");
  const [sel,    setSel]     = useState<Video|null>(null);
  const [score,  setScore]   = useState("");
  const [notes,  setNotes]   = useState("");
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const filtered = filter==="All"?VIDEOS:VIDEOS.filter(v=>v.status===filter);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Video Review Panel</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Review Phase 1 trial videos — score, approve or reject with notes</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#F59E0B",background:"#F59E0B15",padding:"6px 12px",borderRadius:8,border:"1px solid #F59E0B30"}}>{VIDEOS.filter(v=>v.status==="Pending").length} Pending</span>
          <button style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇ Export Reviews</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Videos",   value:VIDEOS.length,                                  color:"#6366F1"},
          {label:"Pending Review", value:VIDEOS.filter(v=>v.status==="Pending").length,   color:"#F59E0B"},
          {label:"Approved",       value:VIDEOS.filter(v=>v.status==="Approved").length,  color:"#10B981"},
          {label:"Rejected",       value:VIDEOS.filter(v=>v.status==="Rejected").length,  color:"#EF4444"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:6}}>
        {["All","Pending","Approved","Rejected"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"8px 18px",borderRadius:9,border:`1px solid ${filter===f?"#FF6B00":"#1E293B"}`,background:filter===f?"#FF6B0022":"transparent",color:filter===f?"#FF6B00":"#64748B",fontSize:12,fontWeight:700,cursor:"pointer"}}>{f}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"repeat(3,1fr)",gap:12}}>
        {filtered.map(v=>(
          <div key={v.id} onClick={()=>{setSel(vv=>vv?.id===v.id?null:v);setScore(v.score?.toString()||"");setNotes(v.notes);}} style={{...card,cursor:"pointer",border:`1px solid ${sel?.id===v.id?"#FF6B0060":"#1E293B"}`,padding:16}}>
            {/* Thumbnail area */}
            <div style={{height:100,background:"linear-gradient(135deg,#1E293B,#0F172A)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <span style={{fontSize:40}}>{v.thumb}</span>
              <div style={{position:"absolute",bottom:8,right:8,background:"#00000080",borderRadius:4,padding:"2px 6px",fontSize:10,color:"#fff"}}>{v.duration}</div>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .2s",":hover":{opacity:1}} as any}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#FF6B0080",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>▶</div>
              </div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{v.player}</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{v.role} · {v.city} · {v.uploaded}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <span style={{fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6,background:`${statusColor(v.status)}22`,color:statusColor(v.status)}}>{v.status}</span>
              {v.score&&<span style={{fontSize:14,fontWeight:900,color:v.score>=80?"#10B981":v.score>=60?"#F59E0B":"#EF4444"}}>{v.score}/100</span>}
            </div>
          </div>
        ))}

        {/* Review panel */}
        {sel&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>{sel.player}</div>
              <div style={{fontSize:11,color:"#475569",marginBottom:16}}>{sel.role} · {sel.city} · {sel.id}</div>
              {/* Video player placeholder */}
              <div style={{height:160,background:"linear-gradient(135deg,#1E293B,#0F172A)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,cursor:"pointer"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{width:52,height:52,borderRadius:"50%",background:"#FF6B0060",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 8px"}}>▶</div>
                  <div style={{fontSize:11,color:"#64748B"}}>Click to play trial video</div>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>SCORE (0–100)</label>
                <input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)} placeholder="Enter score…"
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:20,fontWeight:800,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>REVIEWER NOTES</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="e.g. Good footwork, strong off-side play…"
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:12,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#10B98120",color:"#10B981",fontWeight:800,fontSize:13,cursor:"pointer",border:"1px solid #10B98140"} as any}>✓ Approve</button>
                <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#EF444420",color:"#EF4444",fontWeight:800,fontSize:13,cursor:"pointer",border:"1px solid #EF444440"} as any}>✗ Reject</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
