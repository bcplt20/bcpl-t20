import { useState } from "react";

const PLAYERS = [
  { rank:1,  name:"Arjun Patel",    team:"Rajasthan Scorchers",  role:"Batsman",    runs:420, avg:52.5, sr:142.3, wickets:0,  economy:0,   matches:9, hs:"98*", fours:45, sixes:18 },
  { rank:2,  name:"Kiran Sharma",   team:"Bengaluru Bulls",      role:"All-Rounder",runs:380, avg:47.5, sr:138.2, wickets:12, economy:7.2, matches:9, hs:"76",  fours:38, sixes:14 },
  { rank:3,  name:"Dev Mehta",      team:"Delhi Suryas",         role:"Batsman",    runs:352, avg:44.0, sr:134.8, wickets:0,  economy:0,   matches:9, hs:"81",  fours:36, sixes:11 },
  { rank:4,  name:"Rahul Verma",    team:"Mumbai Mavericks",     role:"Batsman",    runs:318, avg:39.75,sr:129.3, wickets:0,  economy:0,   matches:9, hs:"72*", fours:32, sixes:9  },
  { rank:5,  name:"Amit Singh",     team:"Mumbai Mavericks",     role:"Bowler",     runs:42,  avg:10.5, sr:88.4,  wickets:18, economy:6.8, matches:9, hs:"18",  fours:4,  sixes:1  },
  { rank:6,  name:"Suresh Nair",    team:"Chennai Challengers",  role:"WK-Batsman", runs:298, avg:37.25,sr:126.8, wickets:0,  economy:0,   matches:9, hs:"65",  fours:28, sixes:8  },
  { rank:7,  name:"Priya Nair",     team:"Rajasthan Scorchers",  role:"All-Rounder",runs:260, avg:32.5, sr:122.0, wickets:9,  economy:7.9, matches:9, hs:"58",  fours:24, sixes:6  },
  { rank:8,  name:"Rohit Das",      team:"Bengaluru Bulls",      role:"Bowler",     runs:18,  avg:6.0,  sr:72.0,  wickets:15, economy:7.4, matches:8, hs:"12",  fours:2,  sixes:0  },
];

const ALL_TEAMS_LIST = [
  "Mumbai Mavericks","Kolkata Tigers","Rajasthan Scorchers","Punjab Warriors",
  "Lucknow Nawabs","Hyderabad Hawks","Delhi Suryas","Chennai Thalaivas","Ahmedabad Lions","Bengaluru Rockets",
];
const TEAM_COLORS: Record<string,string> = {
  "Mumbai Mavericks":"#3B82F6","Kolkata Tigers":"#F97316","Rajasthan Scorchers":"#E97B6B",
  "Punjab Warriors":"#DC2626","Lucknow Nawabs":"#F59E0B","Hyderabad Hawks":"#16A34A",
  "Delhi Suryas":"#6366F1","Chennai Thalaivas":"#2563EB","Ahmedabad Lions":"#B91C1C","Bengaluru Rockets":"#EF4444",
};

type PtRow = { team:string; p:number; w:number; l:number; nr:number; pts:number; nrr:string; form:string[]; };
const INIT_TABLE: PtRow[] = [
  { team:"Kolkata Tigers",      p:12, w:9, l:2, nr:1, pts:19, nrr:"+1.245", form:["W","W","W","L","W"] },
  { team:"Mumbai Mavericks",    p:12, w:8, l:3, nr:1, pts:17, nrr:"+0.876", form:["W","W","L","W","W"] },
  { team:"Lucknow Nawabs",      p:12, w:7, l:4, nr:1, pts:15, nrr:"+0.543", form:["W","L","W","W","L"] },
  { team:"Hyderabad Hawks",     p:12, w:7, l:5, nr:0, pts:14, nrr:"+0.321", form:["W","W","L","W","L"] },
  { team:"Delhi Suryas",        p:12, w:6, l:5, nr:1, pts:13, nrr:"+0.112", form:["L","W","W","L","W"] },
  { team:"Chennai Thalaivas",   p:12, w:5, l:6, nr:1, pts:11, nrr:"-0.088", form:["W","L","L","W","L"] },
  { team:"Rajasthan Scorchers", p:12, w:4, l:7, nr:1, pts:9,  nrr:"-0.234", form:["L","W","L","L","W"] },
  { team:"Punjab Warriors",     p:11, w:4, l:7, nr:0, pts:8,  nrr:"-0.456", form:["L","L","W","L","W"] },
  { team:"Bengaluru Rockets",   p:12, w:3, l:8, nr:1, pts:7,  nrr:"-0.678", form:["L","L","W","L","L"] },
  { team:"Ahmedabad Lions",     p:11, w:2, l:9, nr:0, pts:4,  nrr:"-1.234", form:["L","L","L","W","L"] },
];

type Group = { id:string; name:string; teams:string[]; };

export default function LeaderboardView() {
  const [tab,       setTab]       = useState<"batting"|"bowling"|"points"|"groups">("batting");
  const [tableData, setTableData] = useState<PtRow[]>(INIT_TABLE);
  const [editMode,  setEditMode]  = useState(false);
  const [editRows,  setEditRows]  = useState<PtRow[]>(INIT_TABLE);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [newGName,  setNewGName]  = useState("");
  const [assigning, setAssigning] = useState<string|null>(null); // group id being assigned

  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
  const tab_btn = (a:boolean): React.CSSProperties => ({ padding:"9px 18px", borderRadius:10, border:`1px solid ${a?"#FF6B00":"#1E293B"}`, background:a?"#FF6B0022":"transparent", color:a?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" });

  const batters = [...PLAYERS].sort((a,b)=>b.runs-a.runs);
  const bowlers = [...PLAYERS].filter(p=>p.wickets>0).sort((a,b)=>b.wickets-a.wickets);

  /* ── Points table helpers ── */
  const startEdit = () => { setEditRows([...tableData]); setEditMode(true); };
  const saveEdit  = () => {
    // Auto-recalculate pts and sort by pts desc
    const recalc = editRows.map(r=>({ ...r, pts:r.w*2+r.nr })).sort((a,b)=>b.pts-a.pts||b.nrr.localeCompare(a.nrr));
    setTableData(recalc); setEditMode(false);
  };
  const updateRow = (i:number, field:keyof PtRow, val:string|number) =>
    setEditRows(rows=>rows.map((r,j)=>j===i?{...r,[field]:typeof val==="number"?val:val}:r));

  const addResult = (winner:string, loser:string, noResult=false) => {
    setTableData(rows=>rows.map(r=>{
      if(r.team===winner && !noResult) return {...r, p:r.p+1, w:r.w+1, pts:r.pts+2, form:[...r.form.slice(-4),"W"]};
      if(r.team===loser  && !noResult) return {...r, p:r.p+1, l:r.l+1, form:[...r.form.slice(-4),"L"]};
      if((r.team===winner||r.team===loser) && noResult) return {...r, p:r.p+1, nr:r.nr+1, pts:r.pts+1, form:[...r.form.slice(-4),"N"]};
      return r;
    }).sort((a,b)=>b.pts-a.pts));
  };

  /* ── Group helpers ── */
  const addGroup = () => {
    if(!newGName.trim()) return;
    setGroups(g=>[...g, { id:Date.now().toString(), name:newGName.trim(), teams:[] }]);
    setNewGName("");
  };
  const toggleTeamInGroup = (gid:string, team:string) =>
    setGroups(gs=>gs.map(g=>g.id!==gid?g:{...g, teams:g.teams.includes(team)?g.teams.filter(t=>t!==team):[...g.teams,team]}));
  const removeGroup = (gid:string) => setGroups(gs=>gs.filter(g=>g.id!==gid));

  /* ── Grouped points table render ── */
  const renderGroupTable = (teamSubset:string[], qCut:number) => {
    const rows = tableData.filter(r=>teamSubset.includes(r.team));
    return (
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ borderBottom:"1px solid #1E293B" }}>
          {["#","Team","P","W","L","NR","Pts","NRR","Form"].map(h=><th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((t,i)=>(
            <tr key={t.team} style={{ borderBottom:"1px solid #0F1B2D", background:i<qCut?"rgba(255,107,0,.04)":"transparent", position:"relative" }}>
              <td style={{ padding:"12px 10px", fontSize:13, fontWeight:900, color:i===0?"#FF6B00":i===1?"#C0C0C0":i===2?"#CD7F32":"#64748B" }}>{i<3?["🥇","🥈","🥉"][i]:i+1}</td>
              <td style={{ padding:"12px 10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:TEAM_COLORS[t.team]||"#64748B", flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{t.team}</span>
                </div>
              </td>
              <td style={{ padding:"12px 10px", fontSize:12, color:"#94A3B8" }}>{t.p}</td>
              <td style={{ padding:"12px 10px", fontSize:12, fontWeight:700, color:"#10B981" }}>{t.w}</td>
              <td style={{ padding:"12px 10px", fontSize:12, color:"#EF4444" }}>{t.l}</td>
              <td style={{ padding:"12px 10px", fontSize:12, color:"#64748B" }}>{t.nr}</td>
              <td style={{ padding:"12px 10px", fontSize:16, fontWeight:900, color:"#FF6B00" }}>{t.pts}</td>
              <td style={{ padding:"12px 10px", fontSize:12, fontWeight:700, color:t.nrr.startsWith("+")?"#10B981":"#EF4444" }}>{t.nrr}</td>
              <td style={{ padding:"12px 10px" }}>
                <div style={{ display:"flex", gap:3 }}>
                  {t.form.slice(-5).map((r,j)=>(
                    <div key={j} style={{ width:18, height:18, borderRadius:4, background:r==="W"?"#10B98130":r==="N"?"#F59E0B30":"#EF444430", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:r==="W"?"#10B981":r==="N"?"#F59E0B":"#EF4444" }}>{r}</div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Leaderboard</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Season 5 · batting, bowling, points table, and groups</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>🔗 Embed on Website</button>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>⬇ Export</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {([["batting","🏏 Batting"],["bowling","🎯 Bowling"],["points","🏆 Points Table"],["groups","⬡ Groups"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={tab_btn(tab===t)}>{l}</button>
        ))}
      </div>

      {/* ── Batting ── */}
      {tab==="batting"&&(
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Most Runs — Season 5</div>
          {batters.map((p,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #0F1B2D" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:i<3?"#FF6B0020":"#1E293B", border:`1px solid ${i<3?"#FF6B0040":"#1E293B"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:i<3?"#FF6B00":"#475569", flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.name}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{p.team} · {p.role}</div>
              </div>
              <div style={{ textAlign:"center", minWidth:50 }}>
                <div style={{ fontSize:20, fontWeight:900, color:"#FF6B00" }}>{p.runs}</div>
                <div style={{ fontSize:9, color:"#475569" }}>RUNS</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#10B981" }}>{p.avg}</div>
                <div style={{ fontSize:9, color:"#475569" }}>AVG</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#6366F1" }}>{p.sr}</div>
                <div style={{ fontSize:9, color:"#475569" }}>SR</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.hs}</div>
                <div style={{ fontSize:9, color:"#475569" }}>HS</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#94A3B8" }}>{p.fours}/{p.sixes}</div>
                <div style={{ fontSize:9, color:"#475569" }}>4s/6s</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bowling ── */}
      {tab==="bowling"&&(
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Most Wickets — Season 5</div>
          {bowlers.map((p,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid #0F1B2D" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:i<3?"#FF6B0020":"#1E293B", border:`1px solid ${i<3?"#FF6B0040":"#1E293B"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:i<3?"#FF6B00":"#475569", flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.name}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{p.team} · {p.role}</div>
              </div>
              <div style={{ textAlign:"center", minWidth:50 }}>
                <div style={{ fontSize:20, fontWeight:900, color:"#EF4444" }}>{p.wickets}</div>
                <div style={{ fontSize:9, color:"#475569" }}>WKTS</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:14, fontWeight:700, color:p.economy<=7?"#10B981":"#EF4444" }}>{p.economy}</div>
                <div style={{ fontSize:9, color:"#475569" }}>ECON</div>
              </div>
              <div style={{ textAlign:"center", minWidth:40 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.matches}</div>
                <div style={{ fontSize:9, color:"#475569" }}>M</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Points Table ── */}
      {tab==="points"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Actions row */}
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {!editMode
              ? <button onClick={startEdit} style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #FF6B0040", background:"#FF6B0012", color:"#FF6B00", fontSize:12, fontWeight:700, cursor:"pointer" }}>✏️ Edit Table</button>
              : <>
                  <button onClick={saveEdit} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>✓ Save Changes</button>
                  <button onClick={()=>setEditMode(false)} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>Cancel</button>
                </>
            }
            {/* Quick result entry */}
            <div style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>
              Points auto-calculated: W=2pts · NR=1pt
            </div>
          </div>

          {/* Edit mode */}
          {editMode&&(
            <div style={card}>
              <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>✏️ Edit Mode — modify any field and click Save</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr style={{ borderBottom:"1px solid #1E293B" }}>
                    {["Team","P","W","L","NR","NRR","Form (last 5)"].map(h=><th key={h} style={{ padding:"7px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {editRows.map((r,i)=>{
                      const editCell = (field:keyof PtRow, val:string) => updateRow(i,field,field==="nrr"||field==="team"?val:parseInt(val)||0);
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid #0F172A" }}>
                          <td style={{ padding:"8px 10px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:TEAM_COLORS[r.team]||"#64748B" }}/>
                              <span style={{ fontSize:12, fontWeight:700, color:"#E2E8F0" }}>{r.team}</span>
                            </div>
                          </td>
                          {(["p","w","l","nr"] as const).map(f=>(
                            <td key={f} style={{ padding:"6px 8px" }}>
                              <input type="number" value={r[f] as number} onChange={e=>editCell(f,e.target.value)} min={0}
                                style={{ width:50, padding:"5px 8px", background:"#060B18", border:"1px solid #1E293B", borderRadius:6, color:"#F1F5F9", fontSize:12, outline:"none", textAlign:"center" }}/>
                            </td>
                          ))}
                          <td style={{ padding:"6px 8px" }}>
                            <input value={r.nrr} onChange={e=>editCell("nrr",e.target.value)}
                              style={{ width:70, padding:"5px 8px", background:"#060B18", border:"1px solid #1E293B", borderRadius:6, color:"#F1F5F9", fontSize:12, outline:"none" }}/>
                          </td>
                          <td style={{ padding:"6px 8px" }}>
                            <div style={{ display:"flex", gap:3 }}>
                              {r.form.slice(-5).map((f2,j)=>(
                                <select key={j} value={f2} onChange={e=>{ const nf=[...r.form]; nf[nf.length-5+j]=e.target.value; updateRow(i,"form",nf as any); }}
                                  style={{ width:38, padding:"3px 4px", background:"#060B18", border:"1px solid #1E293B", borderRadius:4, color:f2==="W"?"#10B981":f2==="N"?"#F59E0B":"#EF4444", fontSize:10, outline:"none" }}>
                                  <option value="W">W</option>
                                  <option value="L">L</option>
                                  <option value="N">NR</option>
                                </select>
                              ))}
                              {/* Add result */}
                              <button onClick={()=>{ const nf=[...r.form,"W"].slice(-5); updateRow(i,"form",nf as any); updateRow(i,"w",r.w+1); updateRow(i,"p",r.p+1); }}
                                style={{ padding:"2px 6px", borderRadius:4, border:"1px solid #10B98130", background:"#10B98110", color:"#10B981", fontSize:9, cursor:"pointer", fontWeight:700 }}>+W</button>
                              <button onClick={()=>{ const nf=[...r.form,"L"].slice(-5); updateRow(i,"form",nf as any); updateRow(i,"l",r.l+1); updateRow(i,"p",r.p+1); }}
                                style={{ padding:"2px 6px", borderRadius:4, border:"1px solid #EF444430", background:"#EF444410", color:"#EF4444", fontSize:9, cursor:"pointer", fontWeight:700 }}>+L</button>
                              <button onClick={()=>{ const nf=[...r.form,"N"].slice(-5); updateRow(i,"form",nf as any); updateRow(i,"nr",r.nr+1); updateRow(i,"p",r.p+1); }}
                                style={{ padding:"2px 6px", borderRadius:4, border:"1px solid #F59E0B30", background:"#F59E0B10", color:"#F59E0B", fontSize:9, cursor:"pointer", fontWeight:700 }}>+NR</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Display table */}
          {!editMode&&(
            <div style={card}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["#","Team","P","W","L","NR","Pts","NRR","Form"].map(h=><th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {tableData.map((t,i)=>(
                    <tr key={t.team} style={{ borderBottom:"1px solid #0F1B2D", background:i<4?"rgba(255,107,0,.03)":"transparent" }}>
                      <td style={{ padding:"13px 12px", fontSize:14, fontWeight:900, color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":i<4?"#FF6B00":"#64748B" }}>
                        {i<3?["🥇","🥈","🥉"][i]:i+1}
                      </td>
                      <td style={{ padding:"13px 12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          {i<4&&<div style={{ width:3, height:20, background:"#FF6B00", borderRadius:2 }}/>}
                          <div style={{ width:8, height:8, borderRadius:"50%", background:TEAM_COLORS[t.team]||"#64748B", flexShrink:0 }}/>
                          <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{t.team}</span>
                        </div>
                      </td>
                      <td style={{ padding:"13px 12px", fontSize:13, color:"#94A3B8" }}>{t.p}</td>
                      <td style={{ padding:"13px 12px", fontSize:13, fontWeight:700, color:"#10B981" }}>{t.w}</td>
                      <td style={{ padding:"13px 12px", fontSize:13, color:"#EF4444" }}>{t.l}</td>
                      <td style={{ padding:"13px 12px", fontSize:13, color:"#64748B" }}>{t.nr}</td>
                      <td style={{ padding:"13px 12px", fontSize:16, fontWeight:900, color:"#FF6B00" }}>{t.pts}</td>
                      <td style={{ padding:"13px 12px", fontSize:13, fontWeight:700, color:t.nrr.startsWith("+")?`#10B981`:"#EF4444" }}>{t.nrr}</td>
                      <td style={{ padding:"13px 12px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          {t.form.slice(-5).map((r,j)=>(
                            <div key={j} style={{ width:20, height:20, borderRadius:5, background:r==="W"?"#10B98130":r==="N"?"#F59E0B30":"#EF444430", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:r==="W"?"#10B981":r==="N"?"#F59E0B":"#EF4444" }}>{r}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#475569" }}>
                <div style={{ width:10, height:10, background:"rgba(255,107,0,.3)", borderRadius:2 }}/> Top 4 qualify for playoffs
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Groups ── */}
      {tab==="groups"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Create group */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>⬡ Group Management</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:16 }}>
              Create groups (e.g. Group A, Group B) and assign teams. Each group shows its own points table.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <input value={newGName} onChange={e=>setNewGName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addGroup()}
                placeholder="Group name (e.g. Group A, North Zone…)"
                style={{ flex:1, padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}/>
              <button onClick={addGroup} style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>+ Create Group</button>
            </div>
          </div>

          {groups.length===0&&(
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#475569" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⬡</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6, color:"#64748B" }}>No groups created yet</div>
              <div style={{ fontSize:12 }}>Create a group above to start organizing teams. When teams expand, add Group A and Group B for group-stage matches.</div>
            </div>
          )}

          {groups.map(g=>(
            <div key={g.id} style={card}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#FF6B00" }}>⬡ {g.name}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{g.teams.length} teams assigned</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setAssigning(assigning===g.id?null:g.id)}
                    style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #FF6B0040", background:"#FF6B0012", color:"#FF6B00", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    {assigning===g.id?"Done ✓":"Assign Teams"}
                  </button>
                  <button onClick={()=>removeGroup(g.id)}
                    style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #EF444430", background:"#EF444410", color:"#EF4444", fontSize:11, cursor:"pointer", fontWeight:700 }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Team assignment UI */}
              {assigning===g.id&&(
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, color:"#64748B", fontWeight:700, marginBottom:8 }}>SELECT TEAMS FOR {g.name.toUpperCase()}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {ALL_TEAMS_LIST.map(team=>{
                      const inGroup = g.teams.includes(team);
                      return (
                        <button key={team} onClick={()=>toggleTeamInGroup(g.id,team)}
                          style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${inGroup?(TEAM_COLORS[team]||"#FF6B00"):"#1E293B"}`, background:inGroup?`${TEAM_COLORS[team]||"#FF6B00"}18`:"transparent", color:inGroup?(TEAM_COLORS[team]||"#FF6B00"):"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .15s" }}>
                          {inGroup?"✓ ":""}{team}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Current teams */}
              {g.teams.length>0&&(
                <>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:g.teams.length>=2?16:0 }}>
                    {g.teams.map(t=>(
                      <div key={t} style={{ padding:"4px 12px", borderRadius:20, background:`${TEAM_COLORS[t]||"#64748B"}18`, border:`1px solid ${TEAM_COLORS[t]||"#64748B"}40`, fontSize:11, fontWeight:700, color:TEAM_COLORS[t]||"#E2E8F0" }}>
                        {t}
                      </div>
                    ))}
                  </div>
                  {g.teams.length>=2&&(
                    <>
                      <div style={{ borderTop:"1px solid #1E293B", paddingTop:14, marginTop:4 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#64748B", marginBottom:10 }}>GROUP STANDINGS</div>
                        {renderGroupTable(g.teams, Math.ceil(g.teams.length/2))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
