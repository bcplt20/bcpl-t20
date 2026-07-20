import { useState, useRef } from "react";

type Player = {
  name:string; role:string; age:number; state:string; photoUrl:string;
  battingStyle:string; bowlingStyle:string; jerseyNo:string;
  lastSeason:{ matches:number; runs:number; avg:number; sr:number; wickets:number; economy:number; fifties:number; sixes:number; fours:number; bestBowl:string };
  auctionPrice:string; phase:1|2; selected:boolean;
};
type Team = {
  id:number; name:string; city:string; color:string; logoUrl:string;
  wins:number; losses:number; nrr:string; captain:string; homeGround:string; coach:string; players:Player[];
};

const defaultTeams: Team[] = [
  { id:1,  name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", logoUrl:"", wins:9,  losses:1,  nrr:"+1.84", captain:"Arjun Sharma",  homeGround:"SMS Stadium",      coach:"Ravi Tiwari",   players:[] },
  { id:2,  name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", logoUrl:"", wins:8,  losses:2,  nrr:"+1.24", captain:"Vikas Singh",   homeGround:"PCA Stadium",      coach:"Gurpreet Mann", players:[] },
  { id:3,  name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", logoUrl:"", wins:7,  losses:3,  nrr:"+0.97", captain:"Sanjay Das",    homeGround:"Eden Gardens",     coach:"Biplab Roy",    players:[] },
  { id:4,  name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", logoUrl:"", wins:7,  losses:3,  nrr:"+0.81", captain:"Rahul Mishra",  homeGround:"BRSABV Ekana",     coach:"Ashok Yadav",   players:[] },
  { id:5,  name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", logoUrl:"", wins:6,  losses:4,  nrr:"+0.55", captain:"Rahul Kumar",   homeGround:"Wankhede Stadium", coach:"Suresh Nair",   players:[
    { name:"Rahul Kumar", role:"Batsman", age:24, state:"Maharashtra", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm off-break", jerseyNo:"7",
      lastSeason:{ matches:14, runs:487, avg:38.2, sr:142.1, wickets:0, economy:0, fifties:4, sixes:12, fours:31, bestBowl:"-" }, auctionPrice:"₹4,50,000", phase:2, selected:true },
    { name:"Amit Patil", role:"Bowler", age:22, state:"Maharashtra", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm fast-medium", jerseyNo:"22",
      lastSeason:{ matches:12, runs:45, avg:6.4, sr:88.2, wickets:18, economy:7.2, fifties:0, sixes:1, fours:3, bestBowl:"4/28" }, auctionPrice:"₹2,20,000", phase:2, selected:true },
  ]},
  { id:6,  name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", logoUrl:"", wins:5,  losses:5,  nrr:"+0.12", captain:"Anil Reddy",    homeGround:"Rajiv Gandhi Intl", coach:"Prakash Rao",  players:[] },
  { id:7,  name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", logoUrl:"", wins:5,  losses:5,  nrr:"-0.08", captain:"Deepak Gupta",  homeGround:"Arun Jaitley",     coach:"Narendra Pal",  players:[] },
  { id:8,  name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", logoUrl:"", wins:4,  losses:6,  nrr:"-0.34", captain:"Kartik Rajan",  homeGround:"Chepauk Stadium",  coach:"Venkat Kumar",  players:[] },
  { id:9,  name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", logoUrl:"", wins:3,  losses:7,  nrr:"-0.87", captain:"Vikas Patel",   homeGround:"Narendra Modi",    coach:"Chirag Shah",   players:[] },
  { id:10, name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", logoUrl:"", wins:2,  losses:8,  nrr:"-1.42", captain:"Kiran Kumar",   homeGround:"M. Chinnaswamy",   coach:"Sudhir Rao",    players:[] },
];

const roleColor=(r:string)=>r==="Batsman"?"#3B82F6":r==="Bowler"?"#EF4444":r==="All-rounder"?"#FF6B00":"#10B981";
const roleEmoji=(r:string)=>r==="Batsman"?"🏏":r==="Bowler"?"🎳":r==="All-rounder"?"⭐":"🧤";

function Avatar({ url, name, size=40, color="#334155" }:{ url:string; name:string; size?:number; color?:string }) {
  return url
    ? <img src={url} alt={name} style={{ width:size, height:size, borderRadius:size/4, objectFit:"cover", border:`2px solid ${color}44`, flexShrink:0 }}/>
    : <div style={{ width:size, height:size, borderRadius:size/4, background:color+"33", border:`2px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.4, fontWeight:800, color, flexShrink:0 }}>{name?.[0]||"?"}</div>;
}

function TeamLogo({ url, name, size=40, color="#334155" }:{ url:string; name:string; size?:number; color?:string }) {
  return url
    ? <img src={url} alt={name} style={{ width:size, height:size, borderRadius:size/4, objectFit:"contain", background:color+"22", padding:4, flexShrink:0 }}/>
    : <div style={{ width:size, height:size, borderRadius:size/4, background:color+"33", border:`2px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5, fontWeight:900, color, flexShrink:0 }}>{name?.[0]||"T"}</div>;
}

function ImageUpload({ label, value, onChange, size=64 }:{ label:string; value:string; onChange:(url:string)=>void; size?:number }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:size, height:size, borderRadius:12, background:"#060B18", border:`2px dashed ${value?"#FF6B00":"#1E293B"}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", cursor:"pointer", flexShrink:0 }}
          onClick={()=>ref.current?.click()}>
          {value
            ? <img src={value} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <span style={{ fontSize:22, opacity:.4 }}>📷</span>}
        </div>
        <div>
          <button onClick={()=>ref.current?.click()} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer", display:"block", marginBottom:4 }}>
            {value?"Change Image":"Upload Image"}
          </button>
          {value&&<button onClick={()=>onChange("")} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>Remove</button>}
          <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>JPG, PNG, WebP · max 5MB</div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display:"none" }}/>
    </div>
  );
}

export default function TeamsView() {
  const [teams,         setTeams]         = useState<Team[]>(defaultTeams);
  const [selTeam,       setSelTeam]       = useState<Team|null>(null);
  const [editTeam,      setEditTeam]      = useState<Team|null>(null);
  const [showAddTeam,   setShowAddTeam]   = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [viewPlayer,    setViewPlayer]    = useState<Player|null>(null);
  const [editPlayer,    setEditPlayer]    = useState<Player|null>(null);
  const [editPlayerIdx, setEditPlayerIdx] = useState<number>(-1);
  const [newTeam,       setNewTeam]       = useState({ name:"", city:"", coach:"", homeGround:"", color:"#FF6B00", logoUrl:"" });
  const [np, setNp] = useState({ name:"", role:"Batsman", age:"", state:"", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm medium", jerseyNo:"",
    matches:"", runs:"", avg:"", sr:"", wickets:"", economy:"", fifties:"", sixes:"", fours:"", bestBowl:"", auctionPrice:"" });

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
  const inp:React.CSSProperties  = { width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl:React.CSSProperties  = { fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 };

  const saveTeamEdit = () => {
    if(!editTeam) return;
    setTeams(t=>t.map(x=>x.id===editTeam.id?editTeam:x));
    if(selTeam?.id===editTeam.id) setSelTeam(editTeam);
    setEditTeam(null);
  };

  const addPlayer = () => {
    if(!selTeam||!np.name) return;
    const p:Player = {
      name:np.name, role:np.role, age:parseInt(np.age)||22, state:np.state, photoUrl:np.photoUrl,
      battingStyle:np.battingStyle, bowlingStyle:np.bowlingStyle, jerseyNo:np.jerseyNo,
      lastSeason:{ matches:parseInt(np.matches)||0, runs:parseInt(np.runs)||0, avg:parseFloat(np.avg)||0, sr:parseFloat(np.sr)||0,
        wickets:parseInt(np.wickets)||0, economy:parseFloat(np.economy)||0, fifties:parseInt(np.fifties)||0,
        sixes:parseInt(np.sixes)||0, fours:parseInt(np.fours)||0, bestBowl:np.bestBowl||"-" },
      auctionPrice:np.auctionPrice||"₹0", phase:1, selected:false,
    };
    const updated = {...selTeam, players:[...selTeam.players, p]};
    setTeams(t=>t.map(x=>x.id===selTeam.id?updated:x));
    setSelTeam(updated);
    setShowAddPlayer(false);
    setNp({ name:"",role:"Batsman",age:"",state:"",photoUrl:"",battingStyle:"Right-hand bat",bowlingStyle:"Right-arm medium",jerseyNo:"",matches:"",runs:"",avg:"",sr:"",wickets:"",economy:"",fifties:"",sixes:"",fours:"",bestBowl:"",auctionPrice:"" });
  };

  const savePlayerEdit = () => {
    if(!selTeam||editPlayerIdx<0||!editPlayer) return;
    const newPlayers = selTeam.players.map((p,i)=>i===editPlayerIdx?editPlayer:p);
    const updated = {...selTeam, players:newPlayers};
    setTeams(t=>t.map(x=>x.id===selTeam.id?updated:x));
    setSelTeam(updated);
    setEditPlayer(null);
    setEditPlayerIdx(-1);
  };

  const removePlayer = (idx:number) => {
    if(!selTeam) return;
    const newPlayers = selTeam.players.filter((_,i)=>i!==idx);
    const updated = {...selTeam, players:newPlayers};
    setTeams(t=>t.map(x=>x.id===selTeam.id?updated:x));
    setSelTeam(updated);
  };

  const sorted = [...teams].sort((a,b)=>b.wins-a.wins);

  const PlayerFormFields = ({ vals, set }:{ vals:typeof np, set:React.Dispatch<React.SetStateAction<typeof np>> }) => (
    <>
      <ImageUpload label="Player Photo (JPG/PNG)" value={vals.photoUrl} onChange={url=>set(p=>({...p,photoUrl:url}))} size={72}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
        {[{l:"Full Name",k:"name",span:true},{l:"State",k:"state"},{l:"Age",k:"age"},{l:"Jersey No.",k:"jerseyNo"},{l:"Auction Price",k:"auctionPrice"}].map(f=>(
          <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
            <label style={lbl}>{f.l}</label>
            <input value={(vals as any)[f.k]} onChange={e=>set(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
          </div>
        ))}
        <div>
          <label style={lbl}>Role</label>
          <select value={vals.role} onChange={e=>set(p=>({...p,role:e.target.value}))} style={inp}>
            {["Batsman","Bowler","All-rounder","Wicket-keeper"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Batting Style</label>
          <select value={vals.battingStyle} onChange={e=>set(p=>({...p,battingStyle:e.target.value}))} style={inp}>
            {["Right-hand bat","Left-hand bat"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Bowling Style</label>
          <select value={vals.bowlingStyle} onChange={e=>set(p=>({...p,bowlingStyle:e.target.value}))} style={inp}>
            {["Right-arm fast","Right-arm fast-medium","Right-arm medium","Right-arm off-break","Right-arm leg-break","Left-arm fast","Left-arm fast-medium","Left-arm orthodox","Left-arm chinaman","Does not bowl"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 10px", textTransform:"uppercase", letterSpacing:.5 }}>⚡ Last Season Scorecard</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9 }}>
        {[{l:"Matches",k:"matches"},{l:"Runs",k:"runs"},{l:"Bat Avg",k:"avg"},{l:"Strike Rate",k:"sr"},{l:"Fours",k:"fours"},{l:"Sixes",k:"sixes"},{l:"Fifties",k:"fifties"},{l:"Wickets",k:"wickets"},{l:"Economy",k:"economy"},{l:"Best Bowl",k:"bestBowl"}].map(f=>(
          <div key={f.k}>
            <label style={{ fontSize:10, color:"#475569", fontWeight:700, display:"block", marginBottom:4 }}>{f.l}</label>
            <input value={(vals as any)[f.k]} onChange={e=>set(p=>({...p,[f.k]:e.target.value}))} placeholder="0" style={{ width:"100%", padding:"7px 9px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", gap:16 }}>

      {/* ── Left: Points Table ── */}
      <div style={{ flex:"0 0 460px", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9" }}>BCPL Teams</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>10 permanent franchise teams · Season 5</div>
          </div>
          <button onClick={()=>setShowAddTeam(true)} style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Team</button>
        </div>

        {/* League Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[{v:"10",l:"Teams",c:"#FF6B00"},{v:teams.reduce((a,t)=>a+t.players.length,0).toString(),l:"Players",c:"#10B981"},{v:"₹20L",l:"Top Bid",c:"#F59E0B"}].map(s=>(
            <div key={s.l} style={{ ...card, padding:"12px 14px", textAlign:"center", borderTop:`2px solid ${s.c}` }}>
              <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#060E1C", borderBottom:"1px solid #1E293B" }}>
                {["#","Team","W","L","NRR","Pts",""].map(h=>(
                  <th key={h} style={{ padding:"10px 10px", textAlign:h==="Team"?"left":"center", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t,i)=>(
                <tr key={t.id} onClick={()=>setSelTeam(t)} style={{
                  borderBottom:"1px solid #0F1B2D", cursor:"pointer",
                  background:selTeam?.id===t.id?"#FF6B0010":"transparent", transition:"background .15s",
                }}>
                  <td style={{ padding:"11px 10px", textAlign:"center" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#475569" }}>{i+1}</span>
                  </td>
                  <td style={{ padding:"11px 10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <TeamLogo url={t.logoUrl} name={t.name} size={28} color={t.color}/>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{t.name}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{t.city} · {t.players.length}P</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"11px 10px", textAlign:"center", fontSize:13, fontWeight:800, color:"#10B981" }}>{t.wins}</td>
                  <td style={{ padding:"11px 10px", textAlign:"center", fontSize:13, color:"#EF4444", fontWeight:600 }}>{t.losses}</td>
                  <td style={{ padding:"11px 10px", textAlign:"center", fontSize:11, color:parseFloat(t.nrr)>=0?"#10B981":"#EF4444", fontWeight:700 }}>{t.nrr}</td>
                  <td style={{ padding:"11px 10px", textAlign:"center", fontSize:15, fontWeight:800, color:"#FF6B00" }}>{t.wins*2}</td>
                  <td style={{ padding:"11px 10px", textAlign:"center" }}>
                    <button onClick={e=>{e.stopPropagation();setEditTeam({...t})}} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:10, cursor:"pointer" }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right: Team Detail ── */}
      {selTeam && !editTeam && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>
          {/* Team Header */}
          <div style={{ ...card, borderTop:`3px solid ${selTeam.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <TeamLogo url={selTeam.logoUrl} name={selTeam.name} size={60} color={selTeam.color}/>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{selTeam.name}</div>
                  <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{selTeam.city} · 🏏 {selTeam.captain}</div>
                  <div style={{ fontSize:11, color:"#334155", marginTop:3 }}>🏟 {selTeam.homeGround} · 👤 Coach: {selTeam.coach}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setEditTeam({...selTeam})} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>✏️ Edit</button>
                <button onClick={()=>setSelTeam(null)} style={{ padding:"7px 10px", borderRadius:8, border:"none", background:"#1E293B", color:"#64748B", fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:14 }}>
              {[{l:"Wins",v:selTeam.wins,c:"#10B981"},{l:"Losses",v:selTeam.losses,c:"#EF4444"},{l:"NRR",v:selTeam.nrr,c:parseFloat(selTeam.nrr)>=0?"#10B981":"#EF4444"},{l:"Points",v:selTeam.wins*2,c:"#FF6B00"}].map(s=>(
                <div key={s.l} style={{ textAlign:"center", padding:"10px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:10, color:"#64748B" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Squad */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Squad</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{selTeam.players.length} player{selTeam.players.length!==1?"s":""} registered</div>
              </div>
              <button onClick={()=>setShowAddPlayer(true)} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                + Add Player
              </button>
            </div>

            {selTeam.players.length===0
              ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#334155" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                  <div style={{ fontSize:14, color:"#475569", fontWeight:600 }}>No players yet</div>
                  <div style={{ fontSize:12, color:"#334155", marginTop:4 }}>Click + Add Player to build this squad</div>
                  <button onClick={()=>setShowAddPlayer(true)} style={{ marginTop:14, padding:"10px 22px", borderRadius:10, border:"none", background:"#FF6B0022", color:"#FF6B00", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Add First Player</button>
                </div>
              )
              : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {selTeam.players.map((p,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B", cursor:"pointer", transition:"border-color .15s" }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor="#FF6B0044")}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor="#1E293B")}>
                      <Avatar url={p.photoUrl} name={p.name} size={44} color={roleColor(p.role)}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{p.name}</span>
                          {p.jerseyNo&&<span style={{ fontSize:10, color:"#334155", background:"#1E293B", padding:"2px 6px", borderRadius:5 }}>#{p.jerseyNo}</span>}
                        </div>
                        <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:roleColor(p.role)+"22", color:roleColor(p.role), fontWeight:700 }}>{roleEmoji(p.role)} {p.role}</span>
                          <span style={{ fontSize:10, color:"#475569" }}>{p.state} · {p.age}y</span>
                          {p.auctionPrice&&p.auctionPrice!=="₹0"&&<span style={{ fontSize:10, color:"#E8B23D", fontWeight:700 }}>🏷 {p.auctionPrice}</span>}
                        </div>
                      </div>
                      {/* Mini stats */}
                      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                        {[{l:"R",v:p.lastSeason.runs,c:"#FF6B00"},{l:"W",v:p.lastSeason.wickets,c:"#EF4444"},{l:"Avg",v:p.lastSeason.avg,c:"#F59E0B"}].map(s=>(
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:13, fontWeight:800, color:s.c }}>{s.v}</div>
                            <div style={{ fontSize:9, color:"#475569" }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setViewPlayer(p)} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Card</button>
                        <button onClick={()=>{setEditPlayer({...p});setEditPlayerIdx(i);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Edit</button>
                        <button onClick={()=>removePlayer(i)} style={{ padding:"5px 8px", borderRadius:7, border:"none", background:"#EF444422", color:"#EF4444", fontSize:11, cursor:"pointer" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ── Edit Team Modal ── */}
      {editTeam && (
        <div style={{ position:"fixed", inset:0, background:"#00000090", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Edit Team — {editTeam.name}</div>
            <ImageUpload label="Team Logo (JPG/PNG/WebP)" value={editTeam.logoUrl} onChange={url=>setEditTeam(p=>p?{...p,logoUrl:url}:p)} size={80}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
              {[{l:"Team Name",k:"name"},{l:"City",k:"city"},{l:"Captain",k:"captain"},{l:"Coach",k:"coach"},{l:"Home Ground",k:"homeGround",span:true}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editTeam as any)[f.k]||""} onChange={e=>setEditTeam(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
              {[{l:"Wins",k:"wins"},{l:"Losses",k:"losses"},{l:"NRR",k:"nrr"}].map(f=>(
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editTeam as any)[f.k]} onChange={e=>setEditTeam(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14 }}>
              <label style={lbl}>Team Color</label>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="color" value={editTeam.color} onChange={e=>setEditTeam(p=>p?{...p,color:e.target.value}:p)} style={{ width:44, height:44, background:"#060B18", border:"1px solid #1E293B", borderRadius:9, cursor:"pointer" }}/>
                <span style={{ fontSize:12, color:"#64748B" }}>{editTeam.color}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button onClick={()=>setEditTeam(null)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={saveTeamEdit} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Team Modal ── */}
      {showAddTeam && (
        <div style={{ position:"fixed", inset:0, background:"#00000090", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Add New Team</div>
            <ImageUpload label="Team Logo (JPG/PNG/WebP)" value={newTeam.logoUrl} onChange={url=>setNewTeam(p=>({...p,logoUrl:url}))} size={80}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
              {[{l:"Team Name",k:"name",span:true},{l:"City",k:"city"},{l:"Coach",k:"coach"},{l:"Home Ground",k:"homeGround",span:true}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(newTeam as any)[f.k]} onChange={e=>setNewTeam(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12 }}>
              <label style={lbl}>Team Color</label>
              <input type="color" value={newTeam.color} onChange={e=>setNewTeam(p=>({...p,color:e.target.value}))} style={{ width:"100%", height:44, background:"#060B18", border:"1px solid #1E293B", borderRadius:9, cursor:"pointer" }}/>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:22 }}>
              <button onClick={()=>setShowAddTeam(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{
                if(newTeam.name&&newTeam.city){
                  setTeams(p=>[...p,{id:Date.now(),name:newTeam.name,city:newTeam.city,color:newTeam.color,logoUrl:newTeam.logoUrl,wins:0,losses:0,nrr:"0.00",captain:"TBD",homeGround:newTeam.homeGround,coach:newTeam.coach,players:[]}]);
                  setShowAddTeam(false);
                  setNewTeam({name:"",city:"",coach:"",homeGround:"",color:"#FF6B00",logoUrl:""});
                }
              }} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Add Team</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Player Modal ── */}
      {showAddPlayer && selTeam && (
        <div style={{ position:"fixed", inset:0, background:"#00000090", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:560, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>Add Player</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:18 }}>→ {selTeam.name}</div>
            <PlayerFormFields vals={np} set={setNp}/>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>setShowAddPlayer(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={addPlayer} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Add Player to Squad</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Player Modal ── */}
      {editPlayer && (
        <div style={{ position:"fixed", inset:0, background:"#00000090", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:560, maxHeight:"92vh", overflowY:"auto" }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>Edit Player</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:18 }}>{editPlayer.name}</div>
            <ImageUpload label="Player Photo" value={editPlayer.photoUrl} onChange={url=>setEditPlayer(p=>p?{...p,photoUrl:url}:p)} size={72}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
              {[{l:"Full Name",k:"name",span:true},{l:"State",k:"state"},{l:"Age",k:"age"},{l:"Jersey No.",k:"jerseyNo"},{l:"Auction Price",k:"auctionPrice"}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editPlayer as any)[f.k]||""} onChange={e=>setEditPlayer(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
              <div>
                <label style={lbl}>Role</label>
                <select value={editPlayer.role} onChange={e=>setEditPlayer(p=>p?{...p,role:e.target.value}:p)} style={inp}>
                  {["Batsman","Bowler","All-rounder","Wicket-keeper"].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"14px 0 10px", textTransform:"uppercase", letterSpacing:.5 }}>Last Season Scorecard</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9 }}>
              {[{l:"Matches",k:"matches"},{l:"Runs",k:"runs"},{l:"Avg",k:"avg"},{l:"SR",k:"sr"},{l:"4s",k:"fours"},{l:"6s",k:"sixes"},{l:"50s",k:"fifties"},{l:"Wickets",k:"wickets"},{l:"Economy",k:"economy"},{l:"Best",k:"bestBowl"}].map(f=>(
                <div key={f.k}>
                  <label style={{ fontSize:10, color:"#475569", fontWeight:700, display:"block", marginBottom:4 }}>{f.l}</label>
                  <input value={(editPlayer.lastSeason as any)[f.k]||""} onChange={e=>setEditPlayer(p=>p?{...p,lastSeason:{...p.lastSeason,[f.k]:e.target.value}}:p)} style={{ width:"100%", padding:"7px 8px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={()=>{setEditPlayer(null);setEditPlayerIdx(-1);}} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={savePlayerEdit} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Player Card Modal ── */}
      {viewPlayer && (
        <div style={{ position:"fixed", inset:0, background:"#000000CC", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:0, width:460, overflow:"hidden" }}>
            {/* Card header with color band */}
            <div style={{ background:`linear-gradient(135deg,${selTeam?.color||"#FF6B00"}44,${selTeam?.color||"#FF6B00"}11)`, borderBottom:"1px solid #1E293B", padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
              <Avatar url={viewPlayer.photoUrl} name={viewPlayer.name} size={64} color={roleColor(viewPlayer.role)}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>{viewPlayer.name}</div>
                <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:6, background:roleColor(viewPlayer.role)+"33", color:roleColor(viewPlayer.role), fontWeight:700 }}>{roleEmoji(viewPlayer.role)} {viewPlayer.role}</span>
                  {viewPlayer.jerseyNo&&<span style={{ fontSize:11, color:"#64748B" }}>#{viewPlayer.jerseyNo}</span>}
                  <span style={{ fontSize:11, color:"#64748B" }}>{viewPlayer.state} · {viewPlayer.age}y</span>
                </div>
                <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>{viewPlayer.battingStyle} · {viewPlayer.bowlingStyle}</div>
              </div>
              {viewPlayer.auctionPrice&&viewPlayer.auctionPrice!=="₹0"&&(
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#E8B23D", fontWeight:700 }}>🏷 AUCTION</div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#E8B23D" }}>{viewPlayer.auctionPrice}</div>
                </div>
              )}
            </div>

            <div style={{ padding:"20px 24px" }}>
              <div style={{ fontSize:11, color:"#475569", fontWeight:700, marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Last Season Scorecard</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                {[{l:"Matches",v:viewPlayer.lastSeason.matches,c:"#6366F1"},{l:"Runs",v:viewPlayer.lastSeason.runs,c:"#FF6B00"},{l:"Avg",v:viewPlayer.lastSeason.avg,c:"#F59E0B"},{l:"SR",v:viewPlayer.lastSeason.sr,c:"#3B82F6"},{l:"4s",v:viewPlayer.lastSeason.fours,c:"#10B981"},{l:"6s",v:viewPlayer.lastSeason.sixes,c:"#E8B23D"},{l:"Wkts",v:viewPlayer.lastSeason.wickets,c:"#EF4444"},{l:"Eco",v:viewPlayer.lastSeason.economy,c:"#64748B"}].map(s=>(
                  <div key={s.l} style={{ textAlign:"center", padding:"10px 6px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v||0}</div>
                    <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Batting bar */}
              <div style={{ background:"#060B18", borderRadius:12, padding:"12px 14px", border:"1px solid #1E293B" }}>
                <div style={{ fontSize:10, color:"#475569", fontWeight:700, marginBottom:10 }}>PERFORMANCE BARS</div>
                {[
                  {l:"Batting Avg",val:viewPlayer.lastSeason.avg,max:60,c:"#FF6B00"},
                  {l:"Strike Rate",val:viewPlayer.lastSeason.sr,max:200,c:"#3B82F6"},
                  {l:"Wickets (×10%)",val:viewPlayer.lastSeason.wickets*10,max:100,c:"#EF4444"},
                ].map(b=>(
                  <div key={b.l} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:11, color:"#64748B" }}>{b.l}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:b.c }}>{b.val}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:"#1E293B", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min((b.val/b.max)*100,100)}%`, background:b.c, borderRadius:3 }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
                <span style={{ padding:"5px 12px", borderRadius:6, fontSize:11, fontWeight:700, background:viewPlayer.selected?"#10B98122":"#F59E0B22", color:viewPlayer.selected?"#10B981":"#F59E0B" }}>
                  {viewPlayer.selected?"✓ Phase 2 Selected":"Phase 1 Player"}
                </span>
                <button onClick={()=>setViewPlayer(null)} style={{ padding:"7px 16px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
