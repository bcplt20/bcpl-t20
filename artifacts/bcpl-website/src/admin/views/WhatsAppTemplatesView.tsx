import { useState } from "react";

const TEMPLATES = [
  { id:1, name:"phase1_welcome",         category:"Marketing",  status:"Approved", lang:"Hindi+English", body:"Namaste {{1}}! 🏏 BCPL T20 Season 5 mein aapka swagat hai. Aapki Phase 1 registration complete ho gayi. Trial date: {{2}}, {{3}}. City: {{4}}. All the best!", vars:["Player Name","Date","Time","City"],  lastSent:"Jul 19", count:4820 },
  { id:2, name:"payment_receipt",         category:"Utility",    status:"Approved", lang:"Hindi+English", body:"Payment received! ✅ ₹{{1}} paid for BCPL T20 Season 5 registration. Transaction ID: {{2}}. Download invoice: {{3}}", vars:["Amount","Txn ID","Link"],             lastSent:"Jul 20", count:3210 },
  { id:3, name:"trial_reminder_24h",      category:"Utility",    status:"Approved", lang:"Hindi+English", body:"⏰ Kal hai aapka trial! BCPL T20 Season 5.\n📍 Venue: {{1}}\n🕗 Time: {{2}} AM\n✅ Kya laana hai: Cricket kit, ID proof, ₹0 (already paid!)", vars:["Venue","Time"],             lastSent:"Jul 18", count:980  },
  { id:4, name:"selection_result_pass",   category:"Marketing",  status:"Approved", lang:"Hindi+English", body:"🎉 Congratulations {{1}}! Aap BCPL T20 Season 5 Phase 2 ke liye SELECT ho gaye hain! Phase 2 mein hoga franchise AUCTION. Fee: ₹{{2}}. Payment link: {{3}}", vars:["Name","Fee","Link"],        lastSent:"Jul 15", count:318  },
  { id:5, name:"selection_result_fail",   category:"Utility",    status:"Approved", lang:"Hindi+English", body:"Hi {{1}}, BCPL T20 Season 5 update. Is baar Phase 2 mein aapka selection nahi ho paya. Phase 2 ka koi charge nahi lagega. Season 6 ke liye zaroor try karo! 🏏", vars:["Name"],             lastSent:"Jul 15", count:662  },
  { id:6, name:"blast_season5_launch",    category:"Marketing",  status:"Pending",  lang:"Hindi+English", body:"🏏 BCPL T20 Season 5 officially LAUNCH ho gaya! 10 teams, ₹6 Crore prize pool. Register now at: {{1}} Sirf ₹299 mein Cricket ka sapna pura karo!", vars:["URL"],                lastSent:"—",      count:0    },
  { id:7, name:"whatsapp_otp",            category:"Authentication",status:"Approved",lang:"English",    body:"Your BCPL T20 verification code is {{1}}. Valid for 10 minutes. Do not share this code with anyone.", vars:["OTP"],                     lastSent:"Jul 20", count:1840 },
];

const statusColor=(s:string)=>s==="Approved"?"#10B981":s==="Pending"?"#F59E0B":"#EF4444";

export default function WhatsAppTemplatesView() {
  const [sel, setSel]   = useState<typeof TEMPLATES[0]|null>(null);
  const [test, setTest] = useState(false);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>WhatsApp Templates</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Manage Interakt-approved message templates for all player communications</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #25D36640",background:"#25D36615",color:"#25D366",fontSize:12,fontWeight:700,cursor:"pointer"}}>🟢 Interakt Status: Connected</button>
          <button style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ New Template</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Templates", value:TEMPLATES.length,                              color:"#25D366"},
          {label:"Approved",        value:TEMPLATES.filter(t=>t.status==="Approved").length, color:"#10B981"},
          {label:"Pending Review",  value:TEMPLATES.filter(t=>t.status==="Pending").length,  color:"#F59E0B"},
          {label:"Messages Sent",   value:TEMPLATES.reduce((a,t)=>a+t.count,0).toLocaleString(), color:"#6366F1"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:16}}>
        <div style={card}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {TEMPLATES.map(t=>(
              <div key={t.id} onClick={()=>setSel(s=>s?.id===t.id?null:t)} style={{padding:"14px 16px",background:"#060B18",borderRadius:12,border:`1px solid ${sel?.id===t.id?"#25D36640":"#1E293B"}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#25D36615",border:"1px solid #25D36630",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💬</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",fontFamily:"monospace"}}>{t.name}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:3}}>{t.category} · {t.lang}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6,background:`${statusColor(t.status)}22`,color:statusColor(t.status),display:"block",marginBottom:4}}>{t.status}</span>
                  <span style={{fontSize:10,color:"#334155"}}>{t.count.toLocaleString()} sent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sel&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={card}>
              <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:4}}>{sel.name}</div>
              <div style={{fontSize:11,color:"#475569",marginBottom:16}}>{sel.category} · {sel.lang}</div>
              {/* Phone mockup */}
              <div style={{background:"#1A1A2E",borderRadius:16,padding:14,border:"2px solid #2D2D4E",marginBottom:16}}>
                <div style={{background:"#25D36615",borderRadius:12,padding:"12px 14px",borderBottomLeftRadius:4}}>
                  <div style={{fontSize:12,color:"#E2E8F0",lineHeight:1.6}}>{sel.body}</div>
                  <div style={{fontSize:9,color:"#475569",marginTop:6,textAlign:"right"}}>12:34 PM ✓✓</div>
                </div>
                {sel.vars.length>0&&(
                  <div style={{marginTop:10}}>
                    {sel.vars.map((v,i)=>(
                      <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#475569",width:16}}>{"{{"+String(i+1)+"}}"}</span>
                        <input placeholder={v} style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid #1E293B",background:"#060B18",color:"#94A3B8",fontSize:11,outline:"none"}}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setTest(true)} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #25D36640",background:"#25D36615",color:"#25D366",fontSize:12,fontWeight:700,cursor:"pointer"}}>📤 Test Send</button>
                <button style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>🚀 Use in Blast</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
