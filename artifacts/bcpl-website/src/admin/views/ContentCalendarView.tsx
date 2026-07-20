import { useState } from "react";

type Post = { id:number; date:string; day:number; platform:string; caption:string; type:string; status:string; time:string };

const PLATFORMS:Record<string,string> = { Instagram:"#E1306C", YouTube:"#FF0000", WhatsApp:"#25D366", Twitter:"#1DA1F2", LinkedIn:"#0077B5" };

const POSTS: Post[] = [
  { id:1,  date:"Jul 20", day:20, platform:"Instagram", caption:"🏏 Season 5 registrations are OPEN! 10 teams, ₹6Cr prize pool. Register now at bcplt20.com", type:"Reel",    status:"Scheduled", time:"09:00 AM" },
  { id:2,  date:"Jul 20", day:20, platform:"WhatsApp",  caption:"Aapka cricket sapna ab reality ban sakta hai! BCPL T20 Season 5 mein khelo. Link: bcplt20.com", type:"Broadcast", status:"Scheduled", time:"10:00 AM" },
  { id:3,  date:"Jul 21", day:21, platform:"Instagram", caption:"Meet your BCPL T20 Ambassador — Sourav Ganguly! Dada backs every corporate cricketer. 🙌", type:"Post",    status:"Draft",     time:"07:00 PM" },
  { id:4,  date:"Jul 22", day:22, platform:"YouTube",   caption:"BCPL T20 Season 5 Promo Video | 10 Teams | ₹6 Crore Prize | Registration Open", type:"Video",   status:"Scheduled", time:"12:00 PM" },
  { id:5,  date:"Jul 23", day:23, platform:"Twitter",   caption:"Working professionals — your cricket journey starts NOW. BCPL T20 Season 5 is here! #BCPLT20 #Cricket", type:"Tweet", status:"Draft", time:"11:00 AM" },
  { id:6,  date:"Jul 24", day:24, platform:"LinkedIn",  caption:"BCPL T20: India's first corporate T20 cricket league now in Season 5. 8,000+ professionals. Register your team.", type:"Post", status:"Scheduled", time:"09:30 AM" },
  { id:7,  date:"Jul 25", day:25, platform:"Instagram", caption:"💰 Transparent pricing. ₹299 Phase 1 trial. No hidden fees. If not selected → no Phase 2 payment.", type:"Story",   status:"Draft",     time:"06:00 PM" },
  { id:8,  date:"Jul 27", day:27, platform:"Instagram", caption:"🏙 21 cities. 1 league. Find your trial city and register today! Slots filling fast.", type:"Post",    status:"Scheduled", time:"10:00 AM" },
];

const DAYS = Array.from({length:14},(_,i)=>i+19);

export default function ContentCalendarView() {
  const [selPost, setSelPost] = useState<Post|null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [view, setView] = useState<"calendar"|"list">("calendar");
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Content Calendar</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Schedule & manage social posts — Instagram, YouTube, WhatsApp, Twitter, LinkedIn</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{display:"flex",gap:4,background:"#0D1526",border:"1px solid #1E293B",borderRadius:9,padding:4}}>
            {(["calendar","list"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",borderRadius:7,border:"none",background:view===v?"#FF6B0022":"transparent",color:view===v?"#FF6B00":"#64748B",fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{v==="calendar"?"📅 Calendar":"📋 List"}</button>
            ))}
          </div>
          <button onClick={()=>setNewOpen(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Schedule Post</button>
        </div>
      </div>

      {/* Platform legend */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {Object.entries(PLATFORMS).map(([p,c])=>(
          <div key={p} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:`${c}15`,border:`1px solid ${c}30`}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
            <span style={{fontSize:11,fontWeight:700,color:c}}>{p}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#64748B"}}>✅ {POSTS.filter(p=>p.status==="Scheduled").length} Scheduled</span>
          <span style={{fontSize:11,color:"#475569"}}>📝 {POSTS.filter(p=>p.status==="Draft").length} Drafts</span>
        </div>
      </div>

      {view==="calendar"&&(
        <div style={card}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:12}}>
            {DAYS.slice(0,7).map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,color:"#475569",fontWeight:700}}>Jul {d}</div>
            ))}
          </div>
          {/* Week 1 */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:8}}>
            {DAYS.slice(0,7).map(d=>{
              const dayPosts=POSTS.filter(p=>p.day===d);
              return (
                <div key={d} style={{minHeight:80,background:"#060B18",borderRadius:10,border:"1px solid #1E293B",padding:8}}>
                  {dayPosts.map(p=>(
                    <div key={p.id} onClick={()=>setSelPost(p)} style={{marginBottom:4,padding:"4px 6px",borderRadius:6,background:`${PLATFORMS[p.platform]}22`,border:`1px solid ${PLATFORMS[p.platform]}40`,cursor:"pointer"}}>
                      <div style={{fontSize:9,fontWeight:700,color:PLATFORMS[p.platform]}}>{p.platform}</div>
                      <div style={{fontSize:9,color:"#94A3B8",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.type}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {/* Day headers week 2 */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:12,marginTop:8}}>
            {DAYS.slice(7).map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,color:"#475569",fontWeight:700}}>Jul {d}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
            {DAYS.slice(7).map(d=>{
              const dayPosts=POSTS.filter(p=>p.day===d);
              return (
                <div key={d} style={{minHeight:80,background:"#060B18",borderRadius:10,border:"1px solid #1E293B",padding:8}}>
                  {dayPosts.map(p=>(
                    <div key={p.id} onClick={()=>setSelPost(p)} style={{marginBottom:4,padding:"4px 6px",borderRadius:6,background:`${PLATFORMS[p.platform]}22`,border:`1px solid ${PLATFORMS[p.platform]}40`,cursor:"pointer"}}>
                      <div style={{fontSize:9,fontWeight:700,color:PLATFORMS[p.platform]}}>{p.platform}</div>
                      <div style={{fontSize:9,color:"#94A3B8",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.type}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view==="list"&&(
        <div style={card}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {POSTS.map(p=>(
              <div key={p.id} onClick={()=>setSelPost(p)} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:"#060B18",borderRadius:10,border:`1px solid ${PLATFORMS[p.platform]}30`,cursor:"pointer"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:PLATFORMS[p.platform],flexShrink:0}}/>
                <div style={{fontSize:12,fontWeight:700,color:PLATFORMS[p.platform],width:90,flexShrink:0}}>{p.platform}</div>
                <div style={{fontSize:11,color:"#475569",width:80,flexShrink:0}}>{p.date} · {p.time}</div>
                <div style={{flex:1,fontSize:12,color:"#F1F5F9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.caption}</div>
                <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:6,background:p.status==="Scheduled"?"#10B98122":"#F59E0B22",color:p.status==="Scheduled"?"#10B981":"#F59E0B",flexShrink:0}}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post detail modal */}
      {selPost&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSelPost(null)}>
          <div style={{...card,width:480,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:PLATFORMS[selPost.platform]}}/>
                <span style={{fontSize:14,fontWeight:700,color:PLATFORMS[selPost.platform]}}>{selPost.platform}</span>
                <span style={{fontSize:11,color:"#475569"}}>{selPost.type}</span>
              </div>
              <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:6,background:selPost.status==="Scheduled"?"#10B98122":"#F59E0B22",color:selPost.status==="Scheduled"?"#10B981":"#F59E0B"}}>{selPost.status}</span>
            </div>
            <div style={{background:"#060B18",borderRadius:10,padding:16,border:"1px solid #1E293B",marginBottom:16}}>
              <div style={{fontSize:13,color:"#F1F5F9",lineHeight:1.6}}>{selPost.caption}</div>
              <div style={{fontSize:11,color:"#475569",marginTop:10}}>📅 {selPost.date} at {selPost.time}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>✏ Edit</button>
              <button style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>🚀 Publish Now</button>
            </div>
          </div>
        </div>
      )}

      {newOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewOpen(false)}>
          <div style={{...card,width:480,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:20}}>Schedule New Post</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>PLATFORM</label>
                <select style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                  {Object.keys(PLATFORMS).map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>CAPTION</label>
                <textarea rows={4} style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.5}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>DATE</label>
                  <input type="date" style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:7}}>TIME</label>
                  <input type="time" style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button onClick={()=>setNewOpen(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
