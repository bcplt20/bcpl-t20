import { useState } from "react";

type NotifRecord = { id:number; title:string; body:string; sent:number; opened:number; ctr:number; segment:string; channel:string; date:string };

const TEMPLATES: NotifRecord[] = [];
const SEGMENTS = ["All Users","Phase 1 Paid","Phase 2 Selected","Trial Registered","All Paid","No Payment","City: Mumbai","City: Delhi","City: Bengaluru"];

type Channel = "website"|"whatsapp"|"email"|"sms";
const CHANNELS: { id:Channel; icon:string; label:string; color:string; sub:string }[] = [
  { id:"website",  icon:"🌐", label:"Website Push",  color:"#6366F1", sub:"Browser & in-app push notifications" },
  { id:"whatsapp", icon:"💬", label:"WhatsApp",      color:"#25D366", sub:"Bulk WhatsApp via Interakt API" },
  { id:"email",    icon:"📧", label:"Email",          color:"#3B82F6", sub:"Transactional & marketing emails" },
  { id:"sms",      icon:"📱", label:"SMS",            color:"#F59E0B", sub:"SMS via MSG91 / Kaleyra" },
];

export default function PushNotificationsView() {
  const [compose,  setCompose]  = useState(false);
  const [channel,  setChannel]  = useState<Channel>("website");
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);
  const [history,  setHistory]  = useState<NotifRecord[]>(TEMPLATES);
  const [form, setForm] = useState({ title:"", body:"", segment:"All Users", scheduleNow:true });
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};
  const inp:React.CSSProperties={width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"};

  const totalSent   = history.reduce((a,t)=>a+t.sent,0);
  const totalOpened = history.reduce((a,t)=>a+t.opened,0);
  const avgCTR      = totalSent > 0 ? (totalOpened/totalSent*100).toFixed(1) : "0.0";

  function handleSend() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false); setSent(true);
      setHistory(h=>[{ id:Date.now(), title:form.title, body:form.body, sent:0, opened:0, ctr:0, segment:form.segment, channel, date:new Date().toLocaleDateString("en-IN") }, ...h]);
      setTimeout(()=>{ setSent(false); setCompose(false); setForm({ title:"", body:"", segment:"All Users", scheduleNow:true }); }, 2000);
    }, 1800);
  }

  const QUICK_TEMPLATES = [
    { title:"Season 5 Registrations Open!", body:"BCPL T20 Season 5 mein khelo. 10 teams, ₹6Cr prize. Register now: bcplt20.com", icon:"🏏" },
    { title:"Trial Reminder",               body:"Aapki trial date nazar aa rahi hai. Abhi register karein: bcplt20.com", icon:"⏰" },
    { title:"Phase 1 Results Out",          body:"Phase 1 results declare ho gaye! Login karke apna status check karein.", icon:"📋" },
    { title:"Phase 2 Payment Due",          body:"Aap Phase 2 ke liye select ho gaye! ₹2,000 pay karein aur trial confirm karein.", icon:"💳" },
    { title:"Match Schedule Released",      body:"Season 5 match schedule out hai! Apni team ki matches dekhein.", icon:"📅" },
    { title:"Video Upload Reminder",        body:"Abhi tak video nahi upload ki? Last date nazdik hai. Abhi karein!", icon:"🎥" },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Notifications</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Send notifications via Website Push · WhatsApp · Email · SMS</div>
        </div>
        <button onClick={()=>setCompose(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Send Notification</button>
      </div>

      {/* Channel Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {CHANNELS.map(c=>(
          <div key={c.id} onClick={()=>{ setChannel(c.id); setCompose(true); }} style={{...card,borderTop:`3px solid ${c.color}`,cursor:"pointer",transition:"transform .15s"}}
            onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-2px)")}
            onMouseLeave={e=>(e.currentTarget.style.transform="none")}>
            <div style={{fontSize:28,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:13,fontWeight:800,color:c.color}}>{c.label}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:4,lineHeight:1.5}}>{c.sub}</div>
            <div style={{marginTop:10,padding:"4px 10px",borderRadius:6,background:`${c.color}18`,border:`1px solid ${c.color}33`,display:"inline-block"}}>
              <span style={{fontSize:10,fontWeight:700,color:c.color}}>0 sent</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Sent",        value:totalSent.toLocaleString(),   color:"#6366F1"},
          {label:"Total Opened",      value:totalOpened.toLocaleString(), color:"#10B981"},
          {label:"Avg Open Rate",     value:`${avgCTR}%`,                 color:"#FF6B00"},
          {label:"Active Subscribers",value:"0",                          color:"#F59E0B"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Send Templates */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>Quick Send Templates</div>
        <div style={{fontSize:11,color:"#475569",marginBottom:14}}>Click a template to pre-fill and send</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {QUICK_TEMPLATES.map(t=>(
            <button key={t.title} onClick={()=>{ setForm(f=>({...f,title:t.title,body:t.body})); setCompose(true); }}
              style={{padding:"12px 14px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer",textAlign:"left",transition:"border-color .2s"}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
              <div style={{fontSize:16,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#F1F5F9",marginBottom:3}}>{t.title}</div>
              <div style={{fontSize:10,color:"#475569",lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{t.body}</div>
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
              {["Title","Channel","Segment","Date","Sent","Open Rate"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((t,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D"}}>
                <td style={{padding:"12px",fontSize:13,fontWeight:600,color:"#F1F5F9"}}>{t.title}</td>
                <td style={{padding:"12px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:"#FF6B0022",color:"#FF6B00",fontWeight:700,textTransform:"capitalize"}}>{t.channel}</span></td>
                <td style={{padding:"12px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:"#6366F122",color:"#6366F1",fontWeight:700}}>{t.segment}</span></td>
                <td style={{padding:"12px",fontSize:11,color:"#64748B"}}>{t.date}</td>
                <td style={{padding:"12px",fontSize:13,color:"#94A3B8"}}>{t.sent.toLocaleString()}</td>
                <td style={{padding:"12px",fontSize:12,fontWeight:700,color:"#10B981"}}>{t.ctr}%</td>
              </tr>
            ))}
            {history.length===0&&(
              <tr><td colSpan={6} style={{padding:"32px",textAlign:"center",color:"#334155",fontSize:13}}>No notifications sent yet. Send your first notification above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compose Modal */}
      {compose&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{ if(!sending&&!sent){ setCompose(false); setForm({ title:"", body:"", segment:"All Users", scheduleNow:true }); } }}>
          <div style={{...card,width:"100%",maxWidth:520,padding:28,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>Send Notification</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Reach your players instantly via your preferred channel</div>

            {/* Channel picker */}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:8,textTransform:"uppercase"}}>Channel</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {CHANNELS.map(c=>(
                  <button key={c.id} onClick={()=>setChannel(c.id)} style={{padding:"8px 4px",borderRadius:9,border:`2px solid ${channel===c.id?c.color:"#1E293B"}`,background:channel===c.id?`${c.color}18`:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:channel===c.id?c.color:"#64748B"}}>{c.label}</span>
                  </button>
                ))}
              </div>
              {channel==="whatsapp"&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"#25D36615",border:"1px solid #25D36630",fontSize:11,color:"#25D366"}}>ℹ️ Requires Interakt API setup in Settings → Integrations</div>}
              {channel==="sms"&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"#F59E0B15",border:"1px solid #F59E0B30",fontSize:11,color:"#F59E0B"}}>ℹ️ Requires MSG91 / Kaleyra API setup in Settings → Integrations</div>}
              {channel==="email"&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:8,background:"#3B82F615",border:"1px solid #3B82F630",fontSize:11,color:"#3B82F6"}}>ℹ️ Requires SMTP / SendGrid setup in Settings → Integrations</div>}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{...{ fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7,textTransform:"uppercase" }}}>Title / Subject</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Phase 1 Results Out!" maxLength={65} style={inp}/>
                <div style={{fontSize:10,color:"#475569",marginTop:4}}>{form.title.length}/65 chars</div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7,textTransform:"uppercase"}}>Message</label>
                <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} rows={3} maxLength={240}
                  style={{...inp,resize:"none",lineHeight:1.5}}/>
                <div style={{fontSize:10,color:"#475569",marginTop:4}}>{form.body.length}/240 chars</div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7,textTransform:"uppercase"}}>Target Segment</label>
                <select value={form.segment} onChange={e=>setForm(f=>({...f,segment:e.target.value}))} style={inp as any}>
                  {SEGMENTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Preview */}
              <div style={{background:"#1E293B",borderRadius:12,padding:14,border:"1px solid #334155"}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:8,textTransform:"uppercase",fontWeight:700}}>Preview</div>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:"#FF6B0020",border:"1px solid #FF6B0040",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏏</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{form.title||"Notification Title"}</div>
                    <div style={{fontSize:11,color:"#94A3B8",marginTop:3,lineHeight:1.4}}>{form.body||"Your message appears here…"}</div>
                  </div>
                </div>
              </div>

              {sent
                ? <div style={{padding:"14px",borderRadius:10,background:"#10B98122",border:"1px solid #10B98144",textAlign:"center",fontSize:13,fontWeight:700,color:"#10B981"}}>✅ Notification sent successfully!</div>
                : <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>{ setCompose(false); setForm({ title:"", body:"", segment:"All Users", scheduleNow:true }); }} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Cancel</button>
                    <button onClick={handleSend} disabled={sending||!form.title.trim()||!form.body.trim()} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:sending?"#334155":"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:sending?"not-allowed":"pointer",opacity:(!form.title.trim()||!form.body.trim())?0.5:1}}>
                      {sending ? "⏳ Sending…" : `🚀 Send via ${CHANNELS.find(c=>c.id===channel)?.label}`}
                    </button>
                  </div>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
