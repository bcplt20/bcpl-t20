import { useState } from "react";

const PLAYERS = [
  { rank:1,  name:"Arjun Patel",    team:"Rajasthan Scorchers",  city:"Delhi",     role:"Batsman",    runs:420, avg:52.5, sr:142.3, wickets:0,  economy:0,   matches:9,  hs:"98*", fours:45, sixes:18 },
  { rank:2,  name:"Kiran Sharma",   team:"Bengaluru Bulls",      city:"Bengaluru", role:"All-Rounder",runs:380, avg:47.5, sr:138.2, wickets:12, economy:7.2, matches:9,  hs:"76",  fours:38, sixes:14 },
  { rank:3,  name:"Dev Mehta",      team:"Delhi Suryas",         city:"Hyderabad", role:"Batsman",    runs:352, avg:44.0, sr:134.8, wickets:0,  economy:0,   matches:9,  hs:"81",  fours:36, sixes:11 },
  { rank:4,  name:"Rahul Verma",    team:"Mumbai Mavericks",     city:"Mumbai",    role:"Batsman",    runs:318, avg:39.75,sr:129.3, wickets:0,  economy:0,   matches:9,  hs:"72*", fours:32, sixes:9  },
  { rank:5,  name:"Amit Singh",     team:"Mumbai Mavericks",     city:"Kolkata",   role:"Bowler",     runs:42,  avg:10.5, sr:88.4,  wickets:18, economy:6.8, matches:9,  hs:"18",  fours:4,  sixes:1  },
  { rank:6,  name:"Suresh Nair",    team:"Chennai Challengers",  city:"Chennai",   role:"WK-Batsman", runs:298, avg:37.25,sr:126.8, wickets:0,  economy:0,   matches:9,  hs:"65",  fours:28, sixes:8  },
  { rank:7,  name:"Priya Nair",     team:"Rajasthan Scorchers",  city:"Pune",      role:"All-Rounder",runs:260, avg:32.5, sr:122.0, wickets:9,  economy:7.9, matches:9,  hs:"58",  fours:24, sixes:6  },
  { rank:8,  name:"Rohit Das",      team:"Bengaluru Bulls",      city:"Bengaluru", role:"Bowler",     runs:18,  avg:6.0,  sr:72.0,  wickets:15, economy:7.4, matches:8,  hs:"12",  fours:2,  sixes:0  },
];

const TEAMS_LB = [
  { rank:1, team:"Mumbai Mavericks",    p:9, w:7, l:2, pts:14, nrr:"+0.842", form:["W","W","W","L","W"] },
  { rank:2, team:"Bengaluru Bulls",     p:9, w:6, l:3, pts:12, nrr:"+0.520", form:["W","L","W","W","W"] },
  { rank:3, team:"Rajasthan Scorchers", p:9, w:6, l:3, pts:12, nrr:"+0.310", form:["W","W","L","W","L"] },
  { rank:4, team:"Delhi Suryas",        p:9, w:5, l:4, pts:10, nrr:"+0.120", form:["L","W","W","L","W"] },
  { rank:5, team:"Chennai Challengers", p:9, w:4, l:5, pts:8,  nrr:"-0.220", form:["W","L","L","W","L"] },
];

export default function LeaderboardView() {
  const [tab,    setTab]    = useState<"batting"|"bowling"|"points">("batting");
  const [filter, setFilter] = useState("All Teams");
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const batters = [...PLAYERS].sort((a,b)=>b.runs-a.runs);
  const bowlers = [...PLAYERS].filter(p=>p.wickets>0).sort((a,b)=>b.wickets-a.wickets);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Leaderboard</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Season 5 rankings — batting, bowling, and points table</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>🔗 Embed on Website</button>
          <button style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇ Export</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:6}}>
        {([["batting","🏏 Batting"],["bowling","🎯 Bowling"],["points","🏆 Points Table"]] as [typeof tab,string][]).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 18px",borderRadius:10,border:`1px solid ${tab===t?"#FF6B00":"#1E293B"}`,background:tab===t?"#FF6B0022":"transparent",color:tab===t?"#FF6B00":"#64748B",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
        ))}
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{marginLeft:"auto",padding:"9px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#0D1526",color:"#94A3B8",fontSize:12,outline:"none",cursor:"pointer"}}>
          {["All Teams","Mumbai Mavericks","Bengaluru Bulls","Rajasthan Scorchers","Delhi Suryas","Chennai Challengers"].map(t=><option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Batting */}
      {tab==="batting"&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Most Runs — Season 5</div>
          {batters.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #0F1B2D"}}>
              <div style={{width:28,height:28,borderRadius:8,background:i<3?"#FF6B0020":"#1E293B",border:`1px solid ${i<3?"#FF6B0040":"#1E293B"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i<3?"#FF6B00":"#475569",flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#475569"}}>{p.team} · {p.role}</div>
              </div>
              <div style={{textAlign:"center",minWidth:50}}>
                <div style={{fontSize:20,fontWeight:900,color:"#FF6B00"}}>{p.runs}</div>
                <div style={{fontSize:9,color:"#475569"}}>RUNS</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:14,fontWeight:700,color:"#10B981"}}>{p.avg}</div>
                <div style={{fontSize:9,color:"#475569"}}>AVG</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:14,fontWeight:700,color:"#6366F1"}}>{p.sr}</div>
                <div style={{fontSize:9,color:"#475569"}}>SR</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{p.hs}</div>
                <div style={{fontSize:9,color:"#475569"}}>HS</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:13,fontWeight:700,color:"#94A3B8"}}>{p.fours}/{p.sixes}</div>
                <div style={{fontSize:9,color:"#475569"}}>4s/6s</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bowling */}
      {tab==="bowling"&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Most Wickets — Season 5</div>
          {bowlers.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #0F1B2D"}}>
              <div style={{width:28,height:28,borderRadius:8,background:i<3?"#FF6B0020":"#1E293B",border:`1px solid ${i<3?"#FF6B0040":"#1E293B"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i<3?"#FF6B00":"#475569",flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#475569"}}>{p.team} · {p.role}</div>
              </div>
              <div style={{textAlign:"center",minWidth:50}}>
                <div style={{fontSize:20,fontWeight:900,color:"#FF6B00"}}>{p.wickets}</div>
                <div style={{fontSize:9,color:"#475569"}}>WICKETS</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:14,fontWeight:700,color:p.economy<=7?"#10B981":"#EF4444"}}>{p.economy}</div>
                <div style={{fontSize:9,color:"#475569"}}>ECON</div>
              </div>
              <div style={{textAlign:"center",minWidth:40}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{p.matches}</div>
                <div style={{fontSize:9,color:"#475569"}}>M</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Points Table */}
      {tab==="points"&&(
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Points Table — Season 5</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid #1E293B"}}>
                {["#","Team","P","W","L","Pts","NRR","Form"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAMS_LB.map((t,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #0F1B2D",background:i===0?"#FF6B0008":"transparent"}}>
                  <td style={{padding:"14px 12px",fontSize:14,fontWeight:900,color:i===0?"#FF6B00":"#64748B"}}>{t.rank}</td>
                  <td style={{padding:"14px 12px",fontSize:13,fontWeight:700,color:"#F1F5F9"}}>{t.team}</td>
                  <td style={{padding:"14px 12px",fontSize:13,color:"#94A3B8"}}>{t.p}</td>
                  <td style={{padding:"14px 12px",fontSize:13,fontWeight:700,color:"#10B981"}}>{t.w}</td>
                  <td style={{padding:"14px 12px",fontSize:13,color:"#EF4444"}}>{t.l}</td>
                  <td style={{padding:"14px 12px",fontSize:16,fontWeight:900,color:"#FF6B00"}}>{t.pts}</td>
                  <td style={{padding:"14px 12px",fontSize:13,fontWeight:700,color:t.nrr.startsWith("+")?"#10B981":"#EF4444"}}>{t.nrr}</td>
                  <td style={{padding:"14px 12px"}}>
                    <div style={{display:"flex",gap:4}}>
                      {t.form.map((r,j)=>(
                        <div key={j} style={{width:20,height:20,borderRadius:5,background:r==="W"?"#10B98130":"#EF444430",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:r==="W"?"#10B981":"#EF4444"}}>{r}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
