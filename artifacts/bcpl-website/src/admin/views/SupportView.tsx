import { useState } from "react";

type Ticket = { id:string; player:string; city:string; issue:string; category:string; status:string; priority:string; created:string; slaHours:number; elapsed:number; messages:{sender:string;text:string;time:string}[] };

const TICKETS: Ticket[] = [
  { id:"TKT-001", player:"Rahul Sharma",   city:"Mumbai",    issue:"Payment failed but ₹299 deducted",    category:"Payment",   status:"Open",        priority:"High",   created:"2h ago",  slaHours:4, elapsed:2, messages:[{sender:"player",text:"My payment failed but ₹299 was deducted from my account. Please help!",time:"2h ago"},{sender:"agent",text:"We are looking into this. Could you share your transaction ID?",time:"1h ago"}] },
  { id:"TKT-002", player:"Priya Patel",    city:"Bengaluru", issue:"KYC documents rejected — reason?",    category:"KYC",       status:"In Progress", priority:"Medium", created:"4h ago",  slaHours:8, elapsed:4, messages:[{sender:"player",text:"My KYC was rejected but the images are clear. What's wrong?",time:"4h ago"}] },
  { id:"TKT-003", player:"Amit Singh",     city:"Delhi",     issue:"Trial city not showing my slot",      category:"Trial",     status:"Open",        priority:"High",   created:"30m ago", slaHours:4, elapsed:0.5, messages:[{sender:"player",text:"I registered for Delhi trial but don't see my slot confirmation.",time:"30m ago"}] },
  { id:"TKT-004", player:"Sneha Kumar",    city:"Chennai",   issue:"Video upload stuck at 80%",          category:"Technical", status:"Resolved",    priority:"Low",    created:"1d ago",  slaHours:24, elapsed:24, messages:[{sender:"player",text:"My trial video is stuck at 80% upload.",time:"1d ago"},{sender:"agent",text:"Try uploading from a stable WiFi connection.",time:"22h ago"},{sender:"player",text:"Worked! Thank you.",time:"20h ago"}] },
  { id:"TKT-005", player:"Dev Mehta",      city:"Hyderabad", issue:"Referral bonus not credited",        category:"Referral",  status:"Open",        priority:"Medium", created:"6h ago",  slaHours:12, elapsed:6, messages:[{sender:"player",text:"I referred 3 friends and none of them show in my referral count.",time:"6h ago"}] },
  { id:"TKT-006", player:"Kiran Rao",      city:"Pune",      issue:"Phase 2 selection criteria unclear", category:"General",   status:"In Progress", priority:"Low",    created:"12h ago", slaHours:24, elapsed:12, messages:[{sender:"player",text:"What parameters are used for Phase 2 selection? Is it only video or also Phase 1 score?",time:"12h ago"},{sender:"agent",text:"Both Phase 1 test score and video evaluation are considered.",time:"8h ago"}] },
];

const priorityColor = (p:string)=>p==="High"?"#EF4444":p==="Medium"?"#F59E0B":"#10B981";
const statusColor   = (s:string)=>s==="Open"?"#EF4444":s==="In Progress"?"#F59E0B":"#10B981";

export default function SupportView() {
  const [sel,    setSel]   = useState<Ticket|null>(null);
  const [filter, setFilter]= useState("All");
  const [reply,  setReply] = useState("");
  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  const categories = ["All","Payment","KYC","Trial","Technical","Referral","General"];
  const filtered = filter==="All"?TICKETS:TICKETS.filter(t=>t.category===filter);
  const open = TICKETS.filter(t=>t.status!=="Resolved").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Support Tickets</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Manage player queries — payment, KYC, trial, technical issues</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#EF4444", background:"#EF444415", padding:"6px 12px", borderRadius:8, border:"1px solid #EF444430" }}>{open} Open</span>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New Ticket</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Tickets",    value:TICKETS.length,                                  color:"#6366F1" },
          { label:"Open",             value:TICKETS.filter(t=>t.status==="Open").length,     color:"#EF4444" },
          { label:"In Progress",      value:TICKETS.filter(t=>t.status==="In Progress").length,color:"#F59E0B" },
          { label:"Resolved Today",   value:TICKETS.filter(t=>t.status==="Resolved").length, color:"#10B981" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns: sel?"360px 1fr":"1fr", gap:16 }}>
        {/* Ticket list */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Filters */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {categories.map(c=>(
              <button key={c} onClick={()=>setFilter(c)} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===c?"#FF6B00":"#1E293B"}`, background:filter===c?"#FF6B0022":"transparent", color:filter===c?"#FF6B00":"#64748B", fontSize:11, fontWeight:700, cursor:"pointer" }}>{c}</button>
            ))}
          </div>
          {filtered.map(t=>{
            const slaOk = t.elapsed < t.slaHours;
            return (
              <div key={t.id} onClick={()=>setSel(s=>s?.id===t.id?null:t)} style={{ ...card, cursor:"pointer", border:`1px solid ${sel?.id===t.id?"#FF6B0060":"#1E293B"}`, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:800, color:"#475569" }}>{t.id}</span>
                    <span style={{ fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, background:`${priorityColor(t.priority)}22`, color:priorityColor(t.priority) }}>{t.priority}</span>
                  </div>
                  <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:6, background:`${statusColor(t.status)}22`, color:statusColor(t.status) }}>{t.status}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:"#F1F5F9", marginBottom:5 }}>{t.issue}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{t.player} · {t.city} · {t.created}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:10, color:"#334155" }}>Category: {t.category}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:slaOk?"#10B981":"#EF4444" }}>SLA: {slaOk?"✓ On time":"⚠ Breached"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Thread */}
        {sel&&(
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{sel.issue}</div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{sel.player} · {sel.city} · {sel.id}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#10B98120", color:"#10B981", fontSize:11, fontWeight:700, cursor:"pointer" }}>✓ Resolve</button>
                  <button style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#EF444420", color:"#EF4444", fontSize:11, cursor:"pointer" }}>✗ Close</button>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:300, overflowY:"auto" }}>
                {sel.messages.map((m,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:m.sender==="agent"?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius:12, background:m.sender==="agent"?"#FF6B0022":"#1E293B", borderBottomRightRadius:m.sender==="agent"?4:12, borderBottomLeftRadius:m.sender==="agent"?12:4 }}>
                      <div style={{ fontSize:12, color:"#F1F5F9", lineHeight:1.5 }}>{m.text}</div>
                      <div style={{ fontSize:9, color:"#475569", marginTop:5 }}>{m.sender==="agent"?"Support · ":""}{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, display:"flex", gap:10, alignItems:"flex-end" }}>
                <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply…" rows={3}
                  style={{ flex:1, padding:"10px 12px", borderRadius:9, border:"1px solid #1E293B", background:"#060B18", color:"#E2E8F0", fontSize:12, outline:"none", resize:"none", lineHeight:1.5 }}/>
                <button onClick={()=>setReply("")} style={{ padding:"10px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", alignSelf:"stretch" }}>Send</button>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                {["Payment confirmed","KYC approved","Slot confirmed","Will resolve in 24h"].map(t=>(
                  <button key={t} onClick={()=>setReply(t)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:10, cursor:"pointer" }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
