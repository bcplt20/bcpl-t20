import { useState } from "react";

type Player = {
  name:string; role:string; age:number; state:string; photo:string;
  lastSeason:{ matches:number; runs:number; avg:number; wickets:number; economy:number; fifties:number; sixes:number };
  phase:1|2; selected:boolean;
};
type Team = {
  id:number; name:string; city:string; color:string; logo:string;
  wins:number; losses:number; nrr:string; captain:string; players:Player[];
};

const defaultTeams: Team[] = [
  { id:1,  name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", logo:"🦂", wins:9,  losses:1,  nrr:"+1.84", captain:"Arjun Sharma",   players:[] },
  { id:2,  name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", logo:"⚔️",  wins:8,  losses:2,  nrr:"+1.24", captain:"Vikas Singh",    players:[] },
  { id:3,  name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", logo:"🐯", wins:7,  losses:3,  nrr:"+0.97", captain:"Sanjay Das",     players:[] },
  { id:4,  name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", logo:"👑", wins:7,  losses:3,  nrr:"+0.81", captain:"Rahul Mishra",   players:[] },
  { id:5,  name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", logo:"🌊", wins:6,  losses:4,  nrr:"+0.55", captain:"Rahul Kumar",    players:[
    { name:"Rahul Kumar", role:"Batsman", age:24, state:"Maharashtra", photo:"R",
      lastSeason:{ matches:14, runs:487, avg:38.2, wickets:0, economy:0, fifties:4, sixes:12 },
      phase:2, selected:true },
    { name:"Amit Patil", role:"Bowler", age:22, state:"Maharashtra", photo:"A",
      lastSeason:{ matches:12, runs:45, avg:6.4, wickets:18, economy:7.2, fifties:0, sixes:1 },
      phase:2, selected:true },
  ]},
  { id:6,  name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", logo:"🦅", wins:5,  losses:5,  nrr:"+0.12", captain:"Anil Reddy",    players:[] },
  { id:7,  name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", logo:"☀️", wins:5,  losses:5,  nrr:"-0.08", captain:"Deepak Gupta",  players:[] },
  { id:8,  name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", logo:"🦁", wins:4,  losses:6,  nrr:"-0.34", captain:"Kartik Rajan",  players:[] },
  { id:9,  name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", logo:"🦁", wins:3,  losses:7,  nrr:"-0.87", captain:"Vikas Patel",   players:[] },
  { id:10, name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", logo:"🚀", wins:2,  losses:8,  nrr:"-1.42", captain:"Kiran Kumar",   players:[] },
];

const roleColor=(r:string)=>r==="Batsman"?"#3B82F6":r==="Bowler"?"#EF4444":r==="All-rounder"?"#FF6B00":"#10B981";

export default function TeamsView() {
  const [teams,          setTeams]          = useState<Team[]>(defaultTeams);
  const [selectedTeam,   setSelectedTeam]   = useState<Team|null>(null);
  const [editingTeam,    setEditingTeam]    = useState<Team|null>(null);
  const [showAddTeam,    setShowAddTeam]    = useState(false);
  const [showAddPlayer,  setShowAddPlayer]  = useState(false);
  const [viewPlayer,     setViewPlayer]     = useState<Player|null>(null);
  const [newTeam,        setNewTeam]        = useState({ name:"", city:"", color:"#FF6B00", logo:"🏏" });
  const [newPlayer,      setNewPlayer]      = useState({ name:"", role:"Batsman", age:"", state:"", photo:"",
    matches:"", runs:"", avg:"", wickets:"", economy:"", fifties:"", sixes:"" });

  const card:React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  const saveTeamEdit = () => {
    if(!editingTeam) return;
    setTeams(t=>t.map(x=>x.id===editingTeam.id?editingTeam:x));
    if(selectedTeam?.id===editingTeam.id) setSelectedTeam(editingTeam);
    setEditingTeam(null);
  };

  const addPlayer = () => {
    if(!selectedTeam||!newPlayer.name) return;
    const p:Player = {
      name:newPlayer.name, role:newPlayer.role, age:parseInt(newPlayer.age)||22,
      state:newPlayer.state, photo:newPlayer.photo||newPlayer.name[0],
      lastSeason:{
        matches:parseInt(newPlayer.matches)||0, runs:parseInt(newPlayer.runs)||0,
        avg:parseFloat(newPlayer.avg)||0, wickets:parseInt(newPlayer.wickets)||0,
        economy:parseFloat(newPlayer.economy)||0, fifties:parseInt(newPlayer.fifties)||0,
        sixes:parseInt(newPlayer.sixes)||0,
      },
      phase:1, selected:false,
    };
    const updated = {...selectedTeam, players:[...selectedTeam.players, p]};
    setTeams(t=>t.map(x=>x.id===selectedTeam.id?updated:x));
    setSelectedTeam(updated);
    setShowAddPlayer(false);
    setNewPlayer({name:"",role:"Batsman",age:"",state:"",photo:"",matches:"",runs:"",avg:"",wickets:"",economy:"",fifties:"",sixes:""});
  };

  const sorted = [...teams].sort((a,b)=>b.wins-a.wins);

  return (
    <div style={{ display:"flex", gap:16 }}>
      {/* Left: Points Table */}
      <div style={{ flex:"0 0 440px", display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9" }}>BCPL Teams</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>10 permanent franchise teams — Season 5</div>
          </div>
          <button onClick={()=>setShowAddTeam(true)} style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Team</button>
        </div>

        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#060E1C", borderBottom:"1px solid #1E293B" }}>
                {["#","Team","W","L","NRR","Pts",""].map(h=>(
                  <th key={h} style={{ padding:"11px 12px", textAlign:h==="Team"?"left":"center", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t,i)=>(
                <tr key={t.id} onClick={()=>setSelectedTeam(t)} style={{
                  borderBottom:"1px solid #0F1B2D", cursor:"pointer",
                  background:selectedTeam?.id===t.id?"#FF6B0010":"transparent",
                  transition:"background 0.15s",
                }}>
                  <td style={{ padding:"12px", textAlign:"center" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#475569" }}>{i+1}</span>
                  </td>
                  <td style={{ padding:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:t.color+"33", border:`1px solid ${t.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{t.logo}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{t.name}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{t.city}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px", textAlign:"center", fontSize:13, fontWeight:800, color:"#10B981" }}>{t.wins}</td>
                  <td style={{ padding:"12px", textAlign:"center", fontSize:13, color:"#EF4444", fontWeight:600 }}>{t.losses}</td>
                  <td style={{ padding:"12px", textAlign:"center", fontSize:11, color:parseFloat(t.nrr)>=0?"#10B981":"#EF4444", fontWeight:700 }}>{t.nrr}</td>
                  <td style={{ padding:"12px", textAlign:"center", fontSize:15, fontWeight:800, color:"#FF6B00" }}>{t.wins*2}</td>
                  <td style={{ padding:"12px", textAlign:"center" }}>
                    <button onClick={e=>{e.stopPropagation();setEditingTeam({...t})}} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:10, cursor:"pointer" }}>✏️ Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Team Detail / Squad */}
      {selectedTeam && !editingTeam && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Team Header */}
          <div style={{ ...card, borderTop:`3px solid ${selectedTeam.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:selectedTeam.color+"33", border:`2px solid ${selectedTeam.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{selectedTeam.logo}</div>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{selectedTeam.name}</div>
                  <div style={{ fontSize:12, color:"#64748B" }}>{selectedTeam.city} · Captain: {selectedTeam.captain}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setEditingTeam({...selectedTeam})} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>✏️ Edit Team</button>
                <button onClick={()=>setSelectedTeam(null)} style={{ padding:"8px 12px", borderRadius:8, border:"none", background:"#1E293B", color:"#64748B", fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:16 }}>
              {[{label:"Wins",value:selectedTeam.wins,color:"#10B981"},{label:"Losses",value:selectedTeam.losses,color:"#EF4444"},{label:"NRR",value:selectedTeam.nrr,color:parseFloat(selectedTeam.nrr)>=0?"#10B981":"#EF4444"}].map(s=>(
                <div key={s.label} style={{ textAlign:"center", padding:"12px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"#64748B" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Squad */}
          <div style={{ ...card }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Squad ({selectedTeam.players.length} players)</div>
              <button onClick={()=>setShowAddPlayer(true)} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Player</button>
            </div>
            {selectedTeam.players.length===0
              ? <div style={{ padding:"32px", textAlign:"center", color:"#334155", fontSize:13, border:"2px dashed #1E293B", borderRadius:12 }}>No players added yet. Click "+ Add Player" to start building the squad.</div>
              : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                  {selectedTeam.players.map((p,i)=>(
                    <div key={i} onClick={()=>setViewPlayer(p)} style={{ background:"#060B18", borderRadius:12, border:"1px solid #1E293B", padding:"14px", cursor:"pointer", transition:"border-color 0.2s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B00")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:`hsl(${i*60+200},55%,32%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", flexShrink:0 }}>{p.photo||p.name[0]}</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.name}</div>
                          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:roleColor(p.role)+"22", color:roleColor(p.role), fontWeight:700 }}>{p.role}</span>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                        {[{label:"Runs",value:p.lastSeason.runs},{label:"Avg",value:p.lastSeason.avg},{label:"Wkts",value:p.lastSeason.wickets}].map(s=>(
                          <div key={s.label} style={{ textAlign:"center", background:"#0D1526", borderRadius:6, padding:"6px 4px" }}>
                            <div style={{ fontSize:13, fontWeight:800, color:"#F1F5F9" }}>{s.value}</div>
                            <div style={{ fontSize:9, color:"#475569" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* Edit Team Panel */}
      {editingTeam && (
        <div style={{ flex:1 }}>
          <div style={{ ...card }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Edit Team — {editingTeam.name}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {([{label:"Team Name",key:"name"},{label:"City",key:"city"},{label:"Captain",key:"captain"},{label:"NRR",key:"nrr"}] as {label:string;key:keyof Team}[]).map(f=>(
                <div key={f.key}>
                  <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>{f.label}</label>
                  <input value={String(editingTeam[f.key])} onChange={e=>setEditingTeam(t=>t?{...t,[f.key]:e.target.value}:t)}
                    style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Team Emoji / Logo</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["🏏","🦂","⚔️","🐯","👑","🌊","🦅","☀️","🦁","🚀","🔥","💎"].map(e=>(
                    <button key={e} onClick={()=>setEditingTeam(t=>t?{...t,logo:e}:t)} style={{ width:36, height:36, borderRadius:8, border:`2px solid ${editingTeam.logo===e?"#FF6B00":"#1E293B"}`, background:editingTeam.logo===e?"#FF6B0022":"transparent", cursor:"pointer", fontSize:20 }}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Team Color</label>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="color" value={editingTeam.color} onChange={e=>setEditingTeam(t=>t?{...t,color:e.target.value}:t)} style={{ width:44, height:44, borderRadius:9, border:"1px solid #1E293B", cursor:"pointer", background:"#060B18" }}/>
                  <div style={{ width:44, height:44, borderRadius:9, background:editingTeam.color, border:"1px solid #1E293B" }}/>
                  <span style={{ fontSize:11, color:"#475569", fontFamily:"monospace" }}>{editingTeam.color}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>setEditingTeam(null)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={saveTeamEdit} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeam && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:420 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Add New Team</div>
            {[{label:"Team Name",key:"name",placeholder:"e.g. Pune Punishers"},{label:"City",key:"city",placeholder:"e.g. Pune"}].map(f=>(
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>{f.label}</label>
                <input value={(newTeam as any)[f.key]} onChange={e=>setNewTeam(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                  style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Team Emoji</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["🏏","🦂","⚔️","🐯","👑","🌊","🦅","☀️","🦁","🚀","🔥","💎"].map(e=>(
                  <button key={e} onClick={()=>setNewTeam(p=>({...p,logo:e}))} style={{ width:36, height:36, borderRadius:8, border:`2px solid ${newTeam.logo===e?"#FF6B00":"#1E293B"}`, background:newTeam.logo===e?"#FF6B0022":"transparent", cursor:"pointer", fontSize:20 }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Team Color</label>
              <input type="color" value={newTeam.color} onChange={e=>setNewTeam(p=>({...p,color:e.target.value}))} style={{ width:"100%", height:44, background:"#060B18", border:"1px solid #1E293B", borderRadius:9, cursor:"pointer" }}/>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowAddTeam(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{
                if(newTeam.name&&newTeam.city){
                  setTeams(p=>[...p,{id:Date.now(),name:newTeam.name,city:newTeam.city,color:newTeam.color,logo:newTeam.logo,wins:0,losses:0,nrr:"0.00",captain:"TBD",players:[]}]);
                  setShowAddTeam(false);
                  setNewTeam({name:"",city:"",color:"#FF6B00",logo:"🏏"});
                }
              }} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Add Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayer && selectedTeam && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>Add Player</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>to {selectedTeam.name}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[{label:"Full Name",key:"name",span:true},{label:"State",key:"state"},{label:"Age",key:"age"},{label:"Profile Initial/Emoji",key:"photo"}].map(f=>(
                <div key={f.key} style={{gridColumn:(f as any).span?"1/-1":"auto"}}>
                  <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>{f.label}</label>
                  <input value={(newPlayer as any)[f.key]} onChange={e=>setNewPlayer(p=>({...p,[f.key]:e.target.value}))} placeholder={f.key==="photo"?"e.g. R or 🏏":""} style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>Role</label>
                <select value={newPlayer.role} onChange={e=>setNewPlayer(p=>({...p,role:e.target.value}))} style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                  {["Batsman","Bowler","All-rounder","Wicket-keeper"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748B", margin:"16px 0 10px", textTransform:"uppercase", letterSpacing:.5 }}>Last Season Scorecard</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[{label:"Matches",key:"matches"},{label:"Runs",key:"runs"},{label:"Batting Avg",key:"avg"},{label:"Fifties",key:"fifties"},{label:"Sixes",key:"sixes"},{label:"Wickets",key:"wickets"},{label:"Economy",key:"economy"}].map(f=>(
                <div key={f.key}>
                  <label style={{ fontSize:10, color:"#475569", fontWeight:700, display:"block", marginBottom:5 }}>{f.label}</label>
                  <input value={(newPlayer as any)[f.key]} onChange={e=>setNewPlayer(p=>({...p,[f.key]:e.target.value}))} placeholder="0" style={{ width:"100%", padding:"8px 10px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>setShowAddPlayer(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={addPlayer} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Add Player</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Scorecard Modal */}
      {viewPlayer && (
        <div style={{ position:"fixed", inset:0, background:"#000000CC", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:440 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#1E3A5F,#0D1526)", border:"2px solid #334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, color:"#fff" }}>{viewPlayer.photo||viewPlayer.name[0]}</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9" }}>{viewPlayer.name}</div>
                  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:5, background:roleColor(viewPlayer.role)+"22", color:roleColor(viewPlayer.role), fontWeight:700 }}>{viewPlayer.role}</span>
                  <span style={{ fontSize:11, color:"#475569", marginLeft:8 }}>{viewPlayer.state} · {viewPlayer.age}y</span>
                </div>
              </div>
              <button onClick={()=>setViewPlayer(null)} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:20 }}>✕</button>
            </div>

            <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Last Season Scorecard</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
              {[
                {label:"Matches",value:viewPlayer.lastSeason.matches,color:"#6366F1"},
                {label:"Runs",   value:viewPlayer.lastSeason.runs,   color:"#FF6B00"},
                {label:"Avg",    value:viewPlayer.lastSeason.avg,    color:"#F59E0B"},
                {label:"50s",    value:viewPlayer.lastSeason.fifties,color:"#E8B23D"},
                {label:"6s",     value:viewPlayer.lastSeason.sixes,  color:"#10B981"},
                {label:"Wkts",   value:viewPlayer.lastSeason.wickets,color:"#EF4444"},
                {label:"Eco",    value:viewPlayer.lastSeason.economy,color:"#64748B"},
              ].map(s=>(
                <div key={s.label} style={{ textAlign:"center", padding:"12px 8px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart — runs vs average */}
            <div style={{ background:"#060B18", borderRadius:12, padding:"14px 16px", border:"1px solid #1E293B" }}>
              <div style={{ fontSize:11, color:"#475569", fontWeight:700, marginBottom:10 }}>BATTING PERFORMANCE</div>
              {[{label:"Batting Avg",pct:Math.min(viewPlayer.lastSeason.avg/60,1),color:"#FF6B00"},{label:"Strike Rate (sim)",pct:0.72,color:"#3B82F6"}].map(b=>(
                <div key={b.label} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:"#64748B" }}>{b.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:b.color }}>{b.label.includes("Avg")?viewPlayer.lastSeason.avg:"128.4"}</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:"#1E293B", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${b.pct*100}%`, background:b.color, borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <span style={{ padding:"5px 12px", borderRadius:6, fontSize:11, fontWeight:700, background:viewPlayer.selected?"#10B98122":"#F59E0B22", color:viewPlayer.selected?"#10B981":"#F59E0B" }}>{viewPlayer.selected?"✓ Selected for Phase 2":"Phase 1 Player"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
