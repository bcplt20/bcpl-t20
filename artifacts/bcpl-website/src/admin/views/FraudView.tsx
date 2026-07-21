import { useState } from "react";

// No fraud flags yet — will populate as registrations come in and auto-scan runs
const FLAGS: { id:string; type:string; players:string[]; ip:string; count:number; risk:string; created:string; details:string }[] = [];
const BLOCKED: { ip:string; reason:string; date:string; blocked:boolean }[] = [];

const riskColor=(r:string)=>r==="High"?"#EF4444":r==="Medium"?"#F59E0B":"#10B981";

export default function FraudView() {
  const [sel, setSel] = useState<typeof FLAGS[0]|null>(null);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Fraud Detection</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Detect duplicate registrations, fake phones, self-referrals, VPN abuse — auto-flagged</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>⬇ Export Fraud Report</button>
          <button style={{padding:"9px 16px",borderRadius:9,border:"none",background:"#EF444422",color:"#EF4444",fontSize:12,fontWeight:700,cursor:"pointer",border:"1px solid #EF444440"} as any}>🛡 Run Scan Now</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Flags",    value:FLAGS.length,                               color:"#EF4444"},
          {label:"High Risk",      value:FLAGS.filter(f=>f.risk==="High").length,    color:"#EF4444"},
          {label:"Medium Risk",    value:FLAGS.filter(f=>f.risk==="Medium").length,  color:"#F59E0B"},
          {label:"IPs Blocked",    value:BLOCKED.length,                             color:"#10B981"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div style={{padding:"14px 20px",background:"#EF444410",border:"1px solid #EF444430",borderRadius:12,display:"flex",gap:12,alignItems:"center"}}>
        <span style={{fontSize:20,lineHeight:1}}>🚨</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#EF4444"}}>2 High-Risk flags need immediate action</div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>Duplicate phone + mass IP registration detected in last 4 hours. Review and block before payment processing.</div>
        </div>
        <button style={{marginLeft:"auto",padding:"8px 16px",borderRadius:8,border:"none",background:"#EF4444",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>Review Now</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:16}}>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Flagged Cases</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {FLAGS.map((f,i)=>(
              <div key={i} onClick={()=>setSel(s=>s?.id===f.id?null:f)} style={{padding:"14px 16px",background:"#060B18",borderRadius:12,border:`1px solid ${sel?.id===f.id?"#FF6B0060":riskColor(f.risk)+"20"}`,cursor:"pointer",display:"flex",gap:14,alignItems:"flex-start"}}>
                <span style={{fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6,background:`${riskColor(f.risk)}22`,color:riskColor(f.risk),flexShrink:0,marginTop:1}}>{f.risk}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{f.type}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>{f.players.slice(0,2).join(", ")}{f.players.length>2?` +${f.players.length-2} more`:""}</div>
                  <div style={{fontSize:11,color:"#334155",marginTop:3}}>IP: {f.ip} · {f.created}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation()}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#EF444422",color:"#EF4444",fontSize:11,fontWeight:700,cursor:"pointer"}}>Block</button>
                  <button onClick={e=>{e.stopPropagation()}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#10B98122",color:"#10B981",fontSize:11,cursor:"pointer"}}>Ignore</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {sel&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>{sel.type}</div>
                <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:7,background:`${riskColor(sel.risk)}22`,color:riskColor(sel.risk)}}>{sel.risk} Risk</span>
              </div>
              <div style={{background:"#060B18",borderRadius:10,padding:14,border:"1px solid #1E293B",marginBottom:14}}>
                <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.6,marginBottom:10}}>{sel.details}</div>
                {[["Case ID",sel.id],["IP Address",sel.ip],["Flagged",sel.created],["Accounts Involved",sel.count]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #0F1B2D"}}>
                    <span style={{fontSize:11,color:"#475569"}}>{k}</span>
                    <span style={{fontSize:11,fontWeight:700,color:"#F1F5F9"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:8}}>ACCOUNTS INVOLVED</div>
                {sel.players.map((p,i)=>(
                  <div key={i} style={{padding:"7px 10px",background:"#0D1526",borderRadius:7,marginBottom:4,fontSize:12,color:"#F1F5F9",border:"1px solid #1E293B"}}>{p}</div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"#EF4444",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}}>🚫 Block All + Refund</button>
                <button style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"#F59E0B22",color:"#F59E0B",fontWeight:700,fontSize:12,cursor:"pointer",border:"1px solid #F59E0B40"} as any}>⚠ Flag for Review</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blocked IPs */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:14}}>Blocked IPs</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1E293B"}}>
              {["IP Address","Reason","Date Blocked","Status","Action"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKED.map((b,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D"}}>
                <td style={{padding:"12px 12px",fontSize:12,fontFamily:"monospace",color:"#F1F5F9"}}>{b.ip}</td>
                <td style={{padding:"12px 12px",fontSize:12,color:"#94A3B8"}}>{b.reason}</td>
                <td style={{padding:"12px 12px",fontSize:12,color:"#64748B"}}>{b.date}</td>
                <td style={{padding:"12px 12px"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:5,background:"#EF444422",color:"#EF4444"}}>Blocked</span>
                </td>
                <td style={{padding:"12px 12px"}}>
                  <button style={{padding:"4px 10px",borderRadius:6,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer"}}>Unblock</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
