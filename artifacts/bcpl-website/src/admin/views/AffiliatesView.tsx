import { useState } from "react";

// No affiliates yet — add via "+ Add Agent" button
const AFFILIATES: { id:string; name:string; city:string; referrals:number; paid:number; pending:number; commission:number; earned:number; status:string; phone:string; joined:string }[] = [];

const statusColor=(s:string)=>s==="Active"?"#10B981":s==="Paid Out"?"#6366F1":"#EF4444";

export default function AffiliatesView() {
  const [sel,        setSel]       = useState<typeof AFFILIATES[0]|null>(null);
  const [addOpen,    setAdd]       = useState(false);
  const [ratesOpen,  setRatesOpen] = useState(false);
  const [agentList,  setAgentList] = useState(AFFILIATES);
  const [agentForm,  setAgentForm] = useState({ name:"", phone:"", city:"", email:"", commission:"270" });
  const [rates,      setRates]     = useState([
    { range:"1–50 referrals",   rate:270, label:"Standard (90% of ₹299)" },
    { range:"51–100 referrals", rate:285, label:"Senior (95% of ₹299)"  },
    { range:"100+ referrals",   rate:299, label:"Premium (100% of ₹299)" },
  ]);
  const [rateEdits,  setRateEdits] = useState(rates.map(r=>String(r.rate)));
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};
  const inp:React.CSSProperties={width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"};

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
        {rates.map(r=>(
          <div key={r.range} style={{padding:"8px 16px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B"}}>
            <div style={{fontSize:11,color:"#FF6B00",fontWeight:700}}>₹{r.rate}/signup — {r.label}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:3}}>{r.range}</div>
          </div>
        ))}
        <button onClick={()=>{ setRateEdits(rates.map(r=>String(r.rate))); setRatesOpen(true); }} style={{marginLeft:"auto",padding:"8px 16px",borderRadius:9,border:"1px solid #FF6B0044",background:"#FF6B0010",color:"#FF6B00",fontSize:12,cursor:"pointer",fontWeight:700}}>✏ Edit Rates</button>
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

      {/* Add Agent Modal */}
      {addOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{ setAdd(false); setAgentForm({name:"",phone:"",city:"",email:"",commission:"270"}); }}>
          <div style={{...card,width:440,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>+ Add New Agent</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>City-level affiliate who brings player registrations</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {label:"Full Name",   key:"name",  type:"text",  placeholder:"e.g. Ramesh Sharma"},
                {label:"Mobile",      key:"phone", type:"tel",   placeholder:"e.g. 9876543210"},
                {label:"City",        key:"city",  type:"text",  placeholder:"e.g. Jaipur"},
                {label:"Email",       key:"email", type:"email", placeholder:"e.g. agent@email.com"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase"}}>{f.label}</label>
                  <input type={f.type} value={agentForm[f.key as keyof typeof agentForm]} onChange={e=>setAgentForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder} style={inp}/>
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase"}}>Commission Rate</label>
                <select value={agentForm.commission} onChange={e=>setAgentForm(p=>({...p,commission:e.target.value}))} style={inp as any}>
                  <option value="270">₹270/signup — Standard (90% of ₹299)</option>
                  <option value="285">₹285/signup — Senior (95% of ₹299)</option>
                  <option value="299">₹299/signup — Premium (100% of ₹299)</option>
                </select>
              </div>
              <div style={{padding:"10px 14px",borderRadius:9,background:"#10B98115",border:"1px solid #10B98130",fontSize:11,color:"#10B981"}}>
                ✅ Agent will receive a unique referral link and QR code after activation.
              </div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={()=>{ setAdd(false); setAgentForm({name:"",phone:"",city:"",email:"",commission:"270"}); }}
                  style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button disabled={!agentForm.name.trim()||!agentForm.phone.trim()||!agentForm.city.trim()}
                  onClick={()=>{
                    const code = agentForm.name.toLowerCase().replace(/\s+/g,"")+Math.floor(Math.random()*900+100);
                    setAgentList(prev=>[...prev,{
                      id:`AGT-${String(agentList.length+1).padStart(3,"0")}`,
                      name:agentForm.name.trim(), phone:agentForm.phone.trim(), city:agentForm.city.trim(),
                      referrals:0, paid:0, pending:0, commission:parseInt(agentForm.commission),
                      earned:0, status:"Active", joined:new Date().toLocaleDateString("en-IN")
                    }]);
                    setAdd(false); setAgentForm({name:"",phone:"",city:"",email:"",commission:"270"});
                    alert(`Agent ${agentForm.name} added! Referral code: ${code}`);
                  }}
                  style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",
                    opacity:agentForm.name.trim()&&agentForm.phone.trim()&&agentForm.city.trim()?1:0.5}}>
                  ✅ Add Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Rates Modal */}
      {ratesOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setRatesOpen(false)}>
          <div style={{...card,width:460,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>✏ Edit Commission Rates</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Set the ₹/signup rate for each referral tier. Base registration is ₹299.</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {rates.map((r,i)=>(
                <div key={i} style={{background:"#060B18",borderRadius:12,padding:"14px 16px",border:"1px solid #1E293B"}}>
                  <div style={{fontSize:10,color:"#64748B",fontWeight:700,textTransform:"uppercase",marginBottom:8}}>{r.range}</div>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:13,color:"#94A3B8"}}>₹</span>
                    <input type="number" min="0" max="299" value={rateEdits[i]}
                      onChange={e=>setRateEdits(ed=>ed.map((v,j)=>j===i?e.target.value:v))}
                      style={{...inp,flex:1,textAlign:"center",fontSize:20,fontWeight:800,color:"#FF6B00"}}/>
                    <span style={{fontSize:12,color:"#475569"}}>per signup</span>
                  </div>
                  <div style={{fontSize:10,color:"#475569",marginTop:6}}>
                    = {rateEdits[i] ? `${((parseInt(rateEdits[i])||0)/299*100).toFixed(1)}% of ₹299` : "—"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={()=>setRatesOpen(false)} style={{flex:1,padding:11,borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{
                setRates(rs=>rs.map((r,i)=>({...r,rate:parseInt(rateEdits[i])||r.rate})));
                setRatesOpen(false);
              }} style={{flex:2,padding:11,borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                ✅ Save Rates
              </button>
            </div>
          </div>
        </div>
      )}

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
