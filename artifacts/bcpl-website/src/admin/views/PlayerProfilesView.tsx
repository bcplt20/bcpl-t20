import { useState } from "react";

// No player profiles yet — will populate after auction and team selection
const PLAYERS: { id:string; name:string; team:string; city:string; role:string; matches:number; runs:number; avg:number; wickets:number; status:string; selected:boolean; slug:string; views:number }[] = [];

const statusColor=(s:string)=>s==="Active"?"#10B981":s==="Phase 1"?"#F59E0B":"#64748B";

export default function PlayerProfilesView() {
  const [sel,    setSel]    = useState<typeof PLAYERS[0]|null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string|null>(null);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};
  const BASE = "https://bcplt20.com/player/";

  function copyLink(slug:string){ navigator.clipboard?.writeText(BASE+slug); setCopied(slug); setTimeout(()=>setCopied(null),2000); }

  const filtered = PLAYERS.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Player Public Profiles</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Shareable player profile pages — players share their URL on social media for organic reach</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>🌐 View All on Website</button>
          <button style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇ Export URLs</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Profiles",   value:PLAYERS.length,                              color:"#6366F1"},
          {label:"Published",        value:PLAYERS.filter(p=>p.selected).length,        color:"#10B981"},
          {label:"Profile Views",    value:PLAYERS.reduce((a,p)=>a+p.views,0).toLocaleString(), color:"#FF6B00"},
          {label:"Shareable Links",  value:PLAYERS.filter(p=>p.selected).length,       color:"#F59E0B"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{padding:"12px 18px",background:"#6366F110",border:"1px solid #6366F130",borderRadius:12,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:18,lineHeight:1}}>💡</span>
        <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.6}}>
          Each selected player gets a shareable URL: <strong style={{color:"#FF6B00"}}>bcplt20.com/player/[slug]</strong>. Players share this on their LinkedIn/Instagram and drive organic registrations. Each page has SEO meta tags, player stats, and a "Register like [Name]" CTA.
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 360px":"1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player or city…"
            style={{padding:"10px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#0D1526",color:"#E2E8F0",fontSize:13,outline:"none"}}/>
          {filtered.map((p,i)=>(
            <div key={i} onClick={()=>setSel(ps=>ps?.id===p.id?null:p)} style={{...card,cursor:"pointer",border:`1px solid ${sel?.id===p.id?"#FF6B0060":"#1E293B"}`,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#FF6B0030,#1E293B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏏</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>{p.role} · {p.team!=="-"?p.team:p.city}</div>
                  <div style={{fontSize:11,color:"#334155",marginTop:2,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{BASE}{p.slug}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  {p.selected&&<span style={{fontSize:10,color:"#10B981"}}>👁 {p.views}</span>}
                  <span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:6,background:`${statusColor(p.status)}22`,color:statusColor(p.status)}}>{p.status}</span>
                  <button onClick={e=>{e.stopPropagation();copyLink(p.slug)}} style={{padding:"4px 10px",borderRadius:7,border:"none",background:copied===p.slug?"#10B98122":"#FF6B0022",color:copied===p.slug?"#10B981":"#FF6B00",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                    {copied===p.slug?"✓ Copied":"🔗 Copy"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profile preview */}
        {sel&&(
          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:"#94A3B8",marginBottom:14,textTransform:"uppercase",letterSpacing:.5}}>Profile Page Preview</div>
            <div style={{background:"#06101E",borderRadius:12,overflow:"hidden",border:"1px solid #1E293B"}}>
              <div style={{height:80,background:"linear-gradient(135deg,#FF7A29,#06101E)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <div style={{position:"absolute",bottom:-24,left:20,width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#FF6B0040,#1E293B)",border:"3px solid #06101E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🏏</div>
              </div>
              <div style={{padding:"32px 20px 20px"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9"}}>{sel.name}</div>
                <div style={{fontSize:12,color:"#FF6B00",marginTop:2}}>{sel.role} · {sel.team!=="-"?sel.team:sel.city}</div>
                {sel.selected&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
                    {[{v:sel.runs,l:"Runs"},{v:sel.avg,l:"Average"},{v:sel.wickets,l:"Wickets"}].map(m=>(
                      <div key={m.l} style={{textAlign:"center",background:"#0D1526",borderRadius:8,padding:"8px 4px"}}>
                        <div style={{fontSize:16,fontWeight:800,color:"#FF6B00"}}>{m.v}</div>
                        <div style={{fontSize:9,color:"#475569",marginTop:2}}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button style={{width:"100%",marginTop:14,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                  Register Like {sel.name.split(" ")[0]} →
                </button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>copyLink(sel.slug)} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>{copied===sel.slug?"✓ Copied!":"🔗 Copy Link"}</button>
              <button style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>🌐 Open Profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
