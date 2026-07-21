import { useState } from "react";

// No contracts yet — generated post-auction via "+ Generate Contract"
const CONTRACTS: { id:string; player:string; team:string; amount:number; status:string; date:string; expiry:string }[] = [];

const TEAMS_LIST = ["Mumbai Marathas","Delhi Dynamos","Bengaluru Bulls","Hyderabad Hawks","Chennai Challengers","Kolkata Kings","Rajasthan Royals CF","Punjab Panthers CF","Gujarat Giants CF","Lucknow Lions CF"];

const statusColor=(s:string)=>s==="Signed"?"#10B981":s==="Pending"?"#F59E0B":"#EF4444";

export default function ContractsView() {
  const [search, setSearch]   = useState("");
  const [preview, setPreview] = useState<typeof CONTRACTS[0]|null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ player:"", team:TEAMS_LIST[0], amount:"", date:"", expiry:"" });
  const [contracts, setContracts] = useState(CONTRACTS);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const filtered = contracts.filter(c=>c.player.toLowerCase().includes(search.toLowerCase())||c.team.toLowerCase().includes(search.toLowerCase()));
  const fmt=(n:number)=>`₹${(n/1000).toFixed(0)}K`;

  function handleGenerate() {
    if (!genForm.player.trim() || !genForm.amount || !genForm.date || !genForm.expiry) return;
    const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    const newC = {
      id: `BCPL/S5/${String(contracts.length+1).padStart(3,"0")}`,
      player: genForm.player.trim(),
      team: genForm.team,
      amount: parseInt(genForm.amount) * 1000,
      status: "Pending",
      date: genForm.date,
      expiry: genForm.expiry,
    };
    setContracts(prev=>[...prev,newC]);
    setGenOpen(false);
    setGenForm({ player:"", team:TEAMS_LIST[0], amount:"", date:"", expiry:"" });
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Player Contracts</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Post-auction contract generation, e-sign tracking, and history</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>⬇ Export All</button>
          <button onClick={()=>setGenOpen(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Generate Contract</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Contracts",value:contracts.length,color:"#6366F1"},
          {label:"Signed",value:contracts.filter(c=>c.status==="Signed").length,color:"#10B981"},
          {label:"Pending Signature",value:contracts.filter(c=>c.status==="Pending").length,color:"#F59E0B"},
          {label:"Total Value",value:`₹${(contracts.reduce((a,c)=>a+c.amount,0)/100000).toFixed(1)}L`,color:"#FF6B00"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player or team…"
            style={{flex:1,padding:"9px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}/>
          <select style={{padding:"9px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#94A3B8",fontSize:12,outline:"none",cursor:"pointer"}}>
            <option>All Statuses</option><option>Signed</option><option>Pending</option><option>Expired</option>
          </select>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1E293B"}}>
              {["Contract ID","Player","Team","Value","Status","Date","Expiry","Actions"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D"}}>
                <td style={{padding:"13px 12px",fontSize:11,color:"#475569",fontFamily:"monospace"}}>{c.id}</td>
                <td style={{padding:"13px 12px",fontSize:13,fontWeight:600,color:"#F1F5F9"}}>{c.player}</td>
                <td style={{padding:"13px 12px",fontSize:12,color:"#94A3B8"}}>{c.team}</td>
                <td style={{padding:"13px 12px",fontSize:13,fontWeight:700,color:"#FF6B00"}}>{fmt(c.amount)}</td>
                <td style={{padding:"13px 12px"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:6,background:`${statusColor(c.status)}22`,color:statusColor(c.status)}}>{c.status}</span>
                </td>
                <td style={{padding:"13px 12px",fontSize:12,color:"#64748B"}}>{c.date}</td>
                <td style={{padding:"13px 12px",fontSize:12,color:"#64748B"}}>{c.expiry}</td>
                <td style={{padding:"13px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setPreview(c)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer"}}>View</button>
                    {c.status==="Pending"&&<button style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#F59E0B22",color:"#F59E0B",fontSize:11,cursor:"pointer",fontWeight:700}}>Remind</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Contract Modal */}
      {genOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setGenOpen(false)}>
          <div style={{...card,width:"100%",maxWidth:480,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>+ Generate Player Contract</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Post-auction contracts under Kriparthi Playing Eleven Pvt. Ltd.</div>
            {[
              {label:"Player Full Name",key:"player",type:"text",placeholder:"e.g. Rahul Sharma"},
              {label:"Franchise Team",key:"team",type:"select"},
              {label:"Contract Value (₹ thousands)",key:"amount",type:"number",placeholder:"e.g. 500 = ₹5L"},
              {label:"Valid From",key:"date",type:"date"},
              {label:"Valid Until",key:"expiry",type:"date"},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:"#64748B",fontWeight:700,marginBottom:5,textTransform:"uppercase"}}>{f.label}</div>
                {f.type==="select" ? (
                  <select value={genForm[f.key as keyof typeof genForm]} onChange={e=>setGenForm(p=>({...p,[f.key]:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                    {TEAMS_LIST.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={genForm[f.key as keyof typeof genForm]} onChange={e=>setGenForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder||""} min={f.type==="number"?"0":undefined}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}/>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>setGenOpen(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleGenerate} disabled={!genForm.player.trim()||!genForm.amount} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:genForm.player.trim()&&genForm.amount?1:0.5}}>📝 Generate Contract</button>
            </div>
          </div>
        </div>
      )}

      {preview&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setPreview(null)}>
          <div style={{...card,width:520,padding:32}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:11,color:"#475569",letterSpacing:1}}>CONTRACT DOCUMENT</div>
              <div style={{fontSize:22,fontWeight:900,color:"#FF6B00",marginTop:6}}>BCPL T20 — Season 5</div>
              <div style={{fontSize:12,color:"#64748B",marginTop:4}}>{preview.id}</div>
            </div>
            <div style={{background:"#060B18",borderRadius:12,padding:20,border:"1px solid #1E293B",marginBottom:16}}>
              {[["Player",preview.player],["Franchise",preview.team],["Contract Value",fmt(preview.amount)],["Valid From",preview.date],["Valid Until",preview.expiry],["Status",preview.status]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0F1B2D"}}>
                  <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>⬇ Download PDF</button>
              {preview.status==="Pending"&&<button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>✉ Send for Signature</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
