import { useState } from "react";

const SPONSORS: { name:string; tier:string; logo:string; monthly:number; impressions:number; clicks:number; ctr:number; leads:number; conv:number; roi:number; color:string; start:string; end:string }[] = [];

const tierColor=(t:string)=>t==="Title"?"#F59E0B":t==="Associate"?"#6366F1":"#10B981";

export default function SponsorROIView() {
  const [sel,   setSel]   = useState<typeof SPONSORS[0]|null>(null);
  const [report, setReport]= useState(false);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const totalSpend       = SPONSORS.reduce((a,s)=>a+(s.monthly*3),0);
  const totalImpressions = SPONSORS.reduce((a,s)=>a+s.impressions,0);
  const totalClicks      = SPONSORS.reduce((a,s)=>a+s.clicks,0);
  const avgROI           = SPONSORS.length > 0 ? (SPONSORS.reduce((a,s)=>a+s.roi,0)/SPONSORS.length).toFixed(1) : "0.0";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Sponsor ROI Dashboard</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Track impressions, CTR, leads and ROI for each sponsor — generate PDF reports</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>+ Add Sponsor</button>
          <button onClick={()=>setReport(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>📄 Generate Report</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Sponsors",    value:SPONSORS.length,                     color:"#FF6B00"},
          {label:"Total Impressions", value:`${(totalImpressions/1000).toFixed(0)}K`, color:"#6366F1"},
          {label:"Total Clicks",      value:totalClicks.toLocaleString(),        color:"#10B981"},
          {label:"Avg ROI",           value:`${avgROI}×`,                        color:"#F59E0B"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sponsor cards */}
      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {SPONSORS.map((s,i)=>(
            <div key={i} onClick={()=>setSel(sp=>sp?.name===s.name?null:s)} style={{...card,cursor:"pointer",border:`1px solid ${sel?.name===s.name?"#FF6B0060":s.color+"20"}`,padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:`${s.color}20`,border:`2px solid ${s.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.logo}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#F1F5F9"}}>{s.name}</div>
                  <div style={{display:"flex",gap:8,marginTop:3}}>
                    <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:5,background:`${tierColor(s.tier)}22`,color:tierColor(s.tier)}}>{s.tier} Sponsor</span>
                    <span style={{fontSize:10,color:"#475569"}}>₹{(s.monthly/1000).toFixed(0)}K/mo · {s.start}–{s.end}</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:24,fontWeight:900,color:s.roi>=2.5?"#10B981":"#F59E0B"}}>{s.roi}×</div>
                  <div style={{fontSize:10,color:"#475569"}}>ROI</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[
                  {label:"Impressions",value:`${(s.impressions/1000).toFixed(0)}K`},
                  {label:"Clicks",     value:s.clicks.toLocaleString()},
                  {label:"CTR",        value:`${s.ctr}%`},
                  {label:"Leads",      value:s.leads},
                ].map(m=>(
                  <div key={m.label} style={{textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#F1F5F9"}}>{m.value}</div>
                    <div style={{fontSize:9,color:"#475569",marginTop:2}}>{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Impression bar */}
              <div style={{marginTop:12}}>
                <div style={{height:4,background:"#1E293B",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(s.impressions/totalImpressions)*100}%`,background:`linear-gradient(90deg,${s.color},${s.color}aa)`,borderRadius:2}}/>
                </div>
                <div style={{fontSize:10,color:"#334155",marginTop:3}}>{Math.round((s.impressions/totalImpressions)*100)}% of total impressions</div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {sel&&(
          <div style={card}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:28}}>{sel.logo}</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#F1F5F9"}}>{sel.name}</div>
                <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:5,background:`${tierColor(sel.tier)}22`,color:tierColor(sel.tier)}}>{sel.tier} Sponsor</span>
              </div>
            </div>
            <div style={{background:"#060B18",borderRadius:10,padding:14,border:"1px solid #1E293B",marginBottom:14}}>
              {[
                ["Monthly Spend",    `₹${(sel.monthly/1000).toFixed(0)}K`],
                ["Total Spend (3mo)",`₹${(sel.monthly*3/1000).toFixed(0)}K`],
                ["Impressions",      `${(sel.impressions/1000).toFixed(0)}K`],
                ["Clicks",           sel.clicks.toLocaleString()],
                ["CTR",              `${sel.ctr}%`],
                ["Leads Generated",  sel.leads],
                ["Conversion Rate",  `${sel.conv}%`],
                ["Cost Per Lead",    `₹${Math.round(sel.monthly*3/sel.leads).toLocaleString()}`],
                ["ROI",              `${sel.roi}× 🔥`],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0F1B2D"}}>
                  <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>✉ Email Report</button>
              <button style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>⬇ PDF Report</button>
            </div>
          </div>
        )}
      </div>

      {report&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setReport(false)}>
          <div style={{...card,width:440,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:20}}>Generate Sponsor Report</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>SELECT SPONSOR</label>
                <select style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                  <option>All Sponsors</option>
                  {SPONSORS.map(s=><option key={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>DATE RANGE</label>
                <select style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                  {["Last 30 days","Last 90 days","Season 5 YTD","Custom Range"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>FORMAT</label>
                <div style={{display:"flex",gap:8}}>
                  {["PDF","Excel","PowerPoint"].map(f=>(
                    <button key={f} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={()=>setReport(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Generate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
