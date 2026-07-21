import { useState } from "react";

const TEMPLATES: { id:number; title:string; body:string; sent:number; opened:number; ctr:number; segment:string }[] = [];

const SEGMENTS = ["All","Phase 1 Paid","Phase 2 Selected","Trial Registered","All Paid","City: Mumbai","City: Delhi"];

export default function PushNotificationsView() {
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ title:"", body:"", segment:"All", scheduleNow:true });
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const totalSent   = TEMPLATES.reduce((a,t)=>a+t.sent,0);
  const totalOpened = TEMPLATES.reduce((a,t)=>a+t.opened,0);
  const avgCTR      = totalSent > 0 ? (totalOpened/totalSent*100).toFixed(1) : "0.0";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Push Notifications</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Web push & in-app notifications — segment, schedule, track open rates</div>
        </div>
        <button onClick={()=>setCompose(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Send Notification</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Sent",        value:totalSent.toLocaleString(),    color:"#6366F1"},
          {label:"Total Opened",      value:totalOpened.toLocaleString(),  color:"#10B981"},
          {label:"Avg Open Rate",     value:`${avgCTR}%`,                  color:"#FF6B00"},
          {label:"Active Subscribers",value:"5,840",                       color:"#F59E0B"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Send */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Quick Send Templates</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {["Registration Open","Trial Reminder","Phase 1 Results Out","Phase 2 Payment Due","Match Schedule Out","Video Upload Reminder"].map(t=>(
            <button key={t} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer",textAlign:"left"}}>
              🔔 {t}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Send History</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1E293B"}}>
              {["Title","Segment","Sent","Opened","Open Rate","Actions"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEMPLATES.map((t,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D"}}>
                <td style={{padding:"12px 12px",fontSize:13,fontWeight:600,color:"#F1F5F9"}}>{t.title}</td>
                <td style={{padding:"12px 12px"}}>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:"#6366F122",color:"#6366F1",fontWeight:700}}>{t.segment}</span>
                </td>
                <td style={{padding:"12px 12px",fontSize:13,color:"#94A3B8"}}>{t.sent.toLocaleString()}</td>
                <td style={{padding:"12px 12px",fontSize:13,color:"#94A3B8"}}>{t.opened.toLocaleString()}</td>
                <td style={{padding:"12px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:60,height:4,background:"#1E293B",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${t.ctr}%`,background:t.ctr>=80?"#10B981":t.ctr>=60?"#F59E0B":"#EF4444",borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,color:t.ctr>=80?"#10B981":t.ctr>=60?"#F59E0B":"#EF4444"}}>{t.ctr}%</span>
                  </div>
                </td>
                <td style={{padding:"12px 12px"}}>
                  <button style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#FF6B0022",color:"#FF6B00",fontSize:11,fontWeight:700,cursor:"pointer"}}>Resend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compose&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setCompose(false)}>
          <div style={{...card,width:520,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:20}}>Compose Notification</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>NOTIFICATION TITLE</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Phase 1 Results Out!" maxLength={65}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                <div style={{fontSize:10,color:"#475569",marginTop:4}}>{form.title.length}/65 chars</div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>MESSAGE BODY</label>
                <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} rows={3} maxLength={240}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
                <div style={{fontSize:10,color:"#475569",marginTop:4}}>{form.body.length}/240 chars</div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>TARGET SEGMENT</label>
                <select value={form.segment} onChange={e=>setForm(f=>({...f,segment:e.target.value}))}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                  {SEGMENTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              {/* Preview */}
              <div style={{background:"#1E293B",borderRadius:12,padding:14,border:"1px solid #334155"}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:8}}>NOTIFICATION PREVIEW</div>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:"#FF6B0020",border:"1px solid #FF6B0040",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏏</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{form.title||"Notification Title"}</div>
                    <div style={{fontSize:11,color:"#94A3B8",marginTop:3,lineHeight:1.4}}>{form.body||"Your message appears here…"}</div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setCompose(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>🚀 Send Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
