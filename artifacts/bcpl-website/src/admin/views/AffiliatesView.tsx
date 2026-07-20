import { useState } from "react";

const AFFILIATES = [
  { id:"AFF-001", name:"Vikram Joshi",   city:"Mumbai",    referrals:142, paid:128, pending:14, commission:38400, earned:34560, status:"Active",  phone:"+91-98765-XXXXX", joined:"May 2026" },
  { id:"AFF-002", name:"Pooja Singh",    city:"Delhi",     referrals:98,  paid:91,  pending:7,  commission:27300, earned:24570, status:"Active",  phone:"+91-98765-XXXXX", joined:"May 2026" },
  { id:"AFF-003", name:"Ravi Kumar",     city:"Bengaluru", referrals:76,  paid:70,  pending:6,  commission:21000, earned:18900, status:"Active",  phone:"+91-98765-XXXXX", joined:"Jun 2026" },
  { id:"AFF-004", name:"Anita Sharma",   city:"Hyderabad", referrals:54,  paid:54,  pending:0,  commission:16200, earned:16200, status:"Paid Out",phone:"+91-98765-XXXXX", joined:"Jun 2026" },
  { id:"AFF-005", name:"Deepak Nair",    city:"Chennai",   referrals:48,  paid:40,  pending:8,  commission:12000, earned:10800, status:"Active",  phone:"+91-98765-XXXXX", joined:"Jun 2026" },
  { id:"AFF-006", name:"Kavita Reddy",   city:"Pune",      referrals:31,  paid:28,  pending:3,  commission:8400,  earned:7560,  status:"Active",  phone:"+91-98765-XXXXX", joined:"Jul 2026" },
  { id:"AFF-007", name:"Suresh Mehta",   city:"Kolkata",   referrals:22,  paid:18,  pending:4,  commission:5400,  earned:4320,  status:"Inactive",phone:"+91-98765-XXXXX", joined:"Jul 2026" },
];

const statusColor=(s:string)=>s==="Active"?"#10B981":s==="Paid Out"?"#6366F1":"#EF4444";

export default function AffiliatesView() {
  const [sel, setSel]     = useState<typeof AFFILIATES[0]|null>(null);
  const [addOpen, setAdd] = useState(false);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const totalReferrals  = AFFILIATES.reduce((a,x)=>a+x.referrals,0);
  const totalCommission = AFFILIATES.reduce((a,x)=>a+x.commission,0);
  const totalPaid       = AFFILIATES.reduce((a,x)=>a+x.earned,0);
  const totalPending    = AFFILIATES.reduce((a,x)=>a+x.pending,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Affiliate & Agent Manager</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>City-level agents — referral tracking, commission calculation, payout management</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>⬇ Export Payouts</button>
          <button onClick={()=>setAdd(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Agent</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Affiliates",   value:AFFILIATES.length,                  color:"#6366F1"},
          {label:"Total Referrals",    value:totalReferrals.toLocaleString(),     color:"#10B981"},
          {label:"Commission Owed",    value:`₹${(totalCommission/1000).toFixed(1)}K`, color:"#F59E0B"},
          {label:"Already Paid",       value:`₹${(totalPaid/1000).toFixed(1)}K`, color:"#FF6B00"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commission rate card */}
      <div style={{...card,display:"flex",gap:24,alignItems:"center",padding:"16px 24px"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9"}}>Commission Structure</div>
        {[
          {range:"1–50 referrals",   rate:"₹270/signup (90% of ₹299)"},
          {range:"51–100 referrals", rate:"₹285/signup (95% of ₹299)"},
          {range:"100+ referrals",   rate:"₹299/signup (100% of ₹299)"},
        ].map(r=>(
          <div key={r.range} style={{padding:"8px 16px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B"}}>
            <div style={{fontSize:11,color:"#FF6B00",fontWeight:700}}>{r.rate}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:3}}>{r.range}</div>
          </div>
        ))}
        <button style={{marginLeft:"auto",padding:"8px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>✏ Edit Rates</button>
      </div>

      <div style={card}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1E293B"}}>
              {["Agent","City","Referrals","Paid","Pending","Commission","Status","Actions"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AFFILIATES.map((a,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D",cursor:"pointer"}} onClick={()=>setSel(s=>s?.id===a.id?null:a)}>
                <td style={{padding:"13px 12px"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{a.name}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{a.id}</div>
                </td>
                <td style={{padding:"13px 12px",fontSize:12,color:"#94A3B8"}}>{a.city}</td>
                <td style={{padding:"13px 12px",fontSize:14,fontWeight:800,color:"#FF6B00"}}>{a.referrals}</td>
                <td style={{padding:"13px 12px",fontSize:13,color:"#10B981",fontWeight:700}}>{a.paid}</td>
                <td style={{padding:"13px 12px",fontSize:13,color:a.pending>0?"#F59E0B":"#475569",fontWeight:700}}>{a.pending}</td>
                <td style={{padding:"13px 12px",fontSize:13,fontWeight:700,color:"#F1F5F9"}}>₹{a.commission.toLocaleString()}</td>
                <td style={{padding:"13px 12px"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:6,background:`${statusColor(a.status)}22`,color:statusColor(a.status)}}>{a.status}</span>
                </td>
                <td style={{padding:"13px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={e=>{e.stopPropagation();setSel(a)}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer"}}>View</button>
                    {a.pending>0&&<button onClick={e=>e.stopPropagation()} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#10B98120",color:"#10B981",fontSize:11,fontWeight:700,cursor:"pointer"}}>Pay</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout modal */}
      {sel&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSel(null)}>
          <div style={{...card,width:400,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:20}}>{sel.name} — {sel.city}</div>
            <div style={{background:"#060B18",borderRadius:12,padding:16,border:"1px solid #1E293B",marginBottom:16}}>
              {[["Referrals",sel.referrals],["Paid Registrations",sel.paid],["Pending",sel.pending],["Total Commission",`₹${sel.commission.toLocaleString()}`],["Already Paid",`₹${sel.earned.toLocaleString()}`],["Outstanding",`₹${(sel.commission-sel.earned).toLocaleString()}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0F1B2D"}}>
                  <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setSel(null)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>Close</button>
              <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>💸 Process Payout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
