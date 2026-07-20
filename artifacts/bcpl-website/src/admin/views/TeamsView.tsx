import { useState, useRef } from "react";

/* ─── Types ──────────────────────────────────────────────────── */
type Player = {
  name:string; role:string; age:number; state:string; photoUrl:string;
  battingStyle:string; bowlingStyle:string; jerseyNo:string; isCaptain?:boolean; isViceCaptain?:boolean;
  lastSeason:{ matches:number; runs:number; avg:number; sr:number; wickets:number; economy:number; fifties:number; centuries:number; sixes:number; fours:number; bestBowl:string; bestBat:string };
  auctionPrice:string; phase:1|2; selected:boolean; nationality:"Indian"|"Overseas";
};
type Team = {
  id:number; name:string; city:string; color:string; secondColor:string; logoUrl:string;
  wins:number; losses:number; nrr:string; captain:string; homeGround:string; coach:string; owner:string;
  players:Player[]; matchesPlayed:number; titlesWon:number;
};

/* ─── Mock Data ──────────────────────────────────────────────── */
const defaultTeams: Team[] = [
  { id:1,  name:"Rajasthan Scorchers",  city:"Jaipur",      color:"#E97B6B", secondColor:"#F5A623", logoUrl:"", wins:9,  losses:1,  nrr:"+1.84", captain:"Arjun Sharma",  homeGround:"SMS Stadium",       coach:"Ravi Tiwari",   owner:"TechCorp Jaipur",  matchesPlayed:10, titlesWon:1, players:[
    { name:"Arjun Sharma", role:"Batsman", age:26, state:"Rajasthan", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm off-break", jerseyNo:"7", isCaptain:true, nationality:"Indian",
      lastSeason:{ matches:14, runs:612, avg:51.0, sr:152.1, wickets:0, economy:0, fifties:5, centuries:1, sixes:18, fours:42, bestBowl:"-", bestBat:"112*" }, auctionPrice:"₹12,00,000", phase:2, selected:true },
    { name:"Sunita Patel", role:"Bowler", age:23, state:"Rajasthan", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm fast", jerseyNo:"99", isViceCaptain:true, nationality:"Indian",
      lastSeason:{ matches:14, runs:28, avg:5.6, sr:78.0, wickets:22, economy:6.8, fifties:0, centuries:0, sixes:0, fours:2, bestBowl:"5/24", bestBat:"14" }, auctionPrice:"₹7,50,000", phase:2, selected:true },
  ]},
  { id:2,  name:"Punjab Warriors",      city:"Chandigarh",  color:"#DC2626", secondColor:"#1D4ED8", logoUrl:"", wins:8,  losses:2,  nrr:"+1.24", captain:"Vikas Singh",   homeGround:"PCA Stadium",       coach:"Gurpreet Mann", owner:"Singh Group",      matchesPlayed:10, titlesWon:2, players:[] },
  { id:3,  name:"Kolkata Tigers",        city:"Kolkata",     color:"#F97316", secondColor:"#7C3AED", logoUrl:"", wins:7,  losses:3,  nrr:"+0.97", captain:"Sanjay Das",    homeGround:"Eden Gardens",      coach:"Biplab Roy",    owner:"Kolkata Ventures", matchesPlayed:10, titlesWon:0, players:[] },
  { id:4,  name:"Lucknow Nawabs",        city:"Lucknow",     color:"#F59E0B", secondColor:"#065F46", logoUrl:"", wins:7,  losses:3,  nrr:"+0.81", captain:"Rahul Mishra",  homeGround:"BRSABV Ekana",      coach:"Ashok Yadav",   owner:"Nawab Estates",   matchesPlayed:10, titlesWon:1, players:[] },
  { id:5,  name:"Mumbai Mavericks",      city:"Mumbai",      color:"#3B82F6", secondColor:"#F59E0B", logoUrl:"", wins:6,  losses:4,  nrr:"+0.55", captain:"Rahul Kumar",   homeGround:"Wankhede Stadium",  coach:"Suresh Nair",   owner:"Mumbai Sports",    matchesPlayed:10, titlesWon:0, players:[
    { name:"Rahul Kumar", role:"Batsman", age:24, state:"Maharashtra", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm off-break", jerseyNo:"7", isCaptain:true, nationality:"Indian",
      lastSeason:{ matches:14, runs:487, avg:38.2, sr:142.1, wickets:0, economy:0, fifties:4, centuries:0, sixes:12, fours:31, bestBowl:"-", bestBat:"88*" }, auctionPrice:"₹4,50,000", phase:2, selected:true },
    { name:"Amit Patil", role:"Bowler", age:22, state:"Maharashtra", photoUrl:"", battingStyle:"Right-hand bat", bowlingStyle:"Right-arm fast-medium", jerseyNo:"22", nationality:"Indian",
      lastSeason:{ matches:12, runs:45, avg:6.4, sr:88.2, wickets:18, economy:7.2, fifties:0, centuries:0, sixes:1, fours:3, bestBowl:"4/28", bestBat:"14" }, auctionPrice:"₹2,20,000", phase:2, selected:true },
  ]},
  { id:6,  name:"Hyderabad Hawks",       city:"Hyderabad",   color:"#16A34A", secondColor:"#EF4444", logoUrl:"", wins:5,  losses:5,  nrr:"+0.12", captain:"Anil Reddy",    homeGround:"Rajiv Gandhi Intl", coach:"Prakash Rao",   owner:"Hawks LLC",        matchesPlayed:10, titlesWon:0, players:[] },
  { id:7,  name:"Delhi Suryas",           city:"Delhi",       color:"#6366F1", secondColor:"#F97316", logoUrl:"", wins:5,  losses:5,  nrr:"-0.08", captain:"Deepak Gupta",  homeGround:"Arun Jaitley",      coach:"Narendra Pal",  owner:"Capital Sports",   matchesPlayed:10, titlesWon:0, players:[] },
  { id:8,  name:"Chennai Thalaivas",      city:"Chennai",     color:"#2563EB", secondColor:"#F59E0B", logoUrl:"", wins:4,  losses:6,  nrr:"-0.34", captain:"Kartik Rajan",  homeGround:"Chepauk Stadium",   coach:"Venkat Kumar",  owner:"Thalaiva Group",   matchesPlayed:10, titlesWon:1, players:[] },
  { id:9,  name:"Ahmedabad Lions",        city:"Ahmedabad",   color:"#B91C1C", secondColor:"#F59E0B", logoUrl:"", wins:3,  losses:7,  nrr:"-0.87", captain:"Vikas Patel",   homeGround:"Narendra Modi",     coach:"Chirag Shah",   owner:"Lions Corp",       matchesPlayed:10, titlesWon:0, players:[] },
  { id:10, name:"Bengaluru Rockets",      city:"Bengaluru",   color:"#EF4444", secondColor:"#1D4ED8", logoUrl:"", wins:2,  losses:8,  nrr:"-1.42", captain:"Kiran Kumar",   homeGround:"M. Chinnaswamy",    coach:"Sudhir Rao",    owner:"Rockets Pvt. Ltd.",matchesPlayed:10, titlesWon:0, players:[] },
];

const MATCH_HISTORY = [
  { opponent:"Punjab Warriors",   result:"W", runs:"182/5", opp:"178/7", margin:"4 runs",    date:"Jul 18" },
  { opponent:"Kolkata Tigers",    result:"W", runs:"204/3", opp:"188/6", margin:"16 runs",   date:"Jul 15" },
  { opponent:"Mumbai Mavericks",  result:"W", runs:"176/4", opp:"142/8", margin:"34 runs",   date:"Jul 12" },
  { opponent:"Lucknow Nawabs",    result:"L", runs:"154/7", opp:"156/5", margin:"2 wickets", date:"Jul 9"  },
  { opponent:"Delhi Suryas",      result:"W", runs:"198/2", opp:"190/4", margin:"8 runs",    date:"Jul 6"  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
const roleColor = (r:string) => r==="Batsman"?"#3B82F6":r==="Bowler"?"#EF4444":r==="All-rounder"?"#FF6B00":"#10B981";
const roleEmoji = (r:string) => r==="Batsman"?"🏏":r==="Bowler"?"🎳":r==="All-rounder"?"⭐":"🧤";

function Avatar({ url,name,size=40,color="#334155" }:{ url:string;name:string;size?:number;color?:string }) {
  return url
    ? <img src={url} alt={name} style={{ width:size,height:size,borderRadius:size/4,objectFit:"cover",border:`2px solid ${color}44`,flexShrink:0 }}/>
    : <div style={{ width:size,height:size,borderRadius:size/4,background:color+"33",border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:900,color,flexShrink:0 }}>{name?.[0]||"?"}</div>;
}

function TeamLogo({ url,name,size=40,color="#334155" }:{ url:string;name:string;size?:number;color?:string }) {
  return url
    ? <img src={url} alt={name} style={{ width:size,height:size,borderRadius:size/4,objectFit:"contain",background:color+"22",padding:4,flexShrink:0 }}/>
    : <div style={{ width:size,height:size,borderRadius:size/4,background:`linear-gradient(135deg,${color}44,${color}22)`,border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.45,fontWeight:900,color,flexShrink:0 }}>{name?.[0]||"T"}</div>;
}

function ImageUpload({ label,value,onChange,size=64 }:{ label:string;value:string;onChange:(url:string)=>void;size?:number }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontSize:11,color:"#64748B",fontWeight:700,display:"block",marginBottom:6 }}>{label}</label>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:size,height:size,borderRadius:12,background:"#060B18",border:`2px dashed ${value?"#FF6B00":"#1E293B"}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",flexShrink:0 }} onClick={()=>ref.current?.click()}>
          {value ? <img src={value} style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : <span style={{ fontSize:22,opacity:.4 }}>📷</span>}
        </div>
        <div>
          <button onClick={()=>ref.current?.click()} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer",display:"block",marginBottom:4 }}>{value?"Change":"Upload Image"}</button>
          {value&&<button onClick={()=>onChange("")} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"transparent",color:"#EF4444",fontSize:11,cursor:"pointer" }}>Remove</button>}
          <div style={{ fontSize:10,color:"#334155",marginTop:2 }}>JPG, PNG, WebP · max 5MB</div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onChange(ev.target?.result as string); r.readAsDataURL(f); }} style={{ display:"none" }}/>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TeamsView() {
  const [teams,         setTeams]         = useState<Team[]>(defaultTeams);
  const [selTeam,       setSelTeam]       = useState<Team|null>(null);
  const [detailTab,     setDetailTab]     = useState<"squad"|"stats"|"history">("squad");
  const [editTeam,      setEditTeam]      = useState<Team|null>(null);
  const [showAddTeam,   setShowAddTeam]   = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [viewPlayer,    setViewPlayer]    = useState<Player|null>(null);
  const [editPlayer,    setEditPlayer]    = useState<Player|null>(null);
  const [editPlayerIdx, setEditPlayerIdx] = useState(-1);
  const [compareA,      setCompareA]      = useState<number|null>(null);
  const [compareB,      setCompareB]      = useState<number|null>(null);
  const [showCompare,   setShowCompare]   = useState(false);
  const [newTeam,       setNewTeam]       = useState({ name:"",city:"",coach:"",owner:"",homeGround:"",color:"#FF6B00",secondColor:"#F59E0B",logoUrl:"" });
  const [np, setNp] = useState({ name:"",role:"Batsman",age:"",state:"",photoUrl:"",battingStyle:"Right-hand bat",bowlingStyle:"Right-arm medium",jerseyNo:"",nationality:"Indian",isCaptain:false,isViceCaptain:false,matches:"",runs:"",avg:"",sr:"",wickets:"",economy:"",fifties:"",centuries:"",sixes:"",fours:"",bestBowl:"",bestBat:"",auctionPrice:"" });

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",border:"1px solid #1E293B",borderRadius:16,padding:20 };
  const inp:React.CSSProperties  = { width:"100%",padding:"9px 12px",background:"#060B18",border:"1px solid #1E293B",borderRadius:9,color:"#F1F5F9",fontSize:13,outline:"none",boxSizing:"border-box" };
  const lbl:React.CSSProperties  = { fontSize:11,color:"#64748B",fontWeight:700,display:"block",marginBottom:5 };

  const sorted = [...teams].sort((a,b)=>b.wins-a.wins||(parseFloat(b.nrr)-parseFloat(a.nrr)));

  const addPlayer = () => {
    if(!selTeam||!np.name) return;
    const p:Player = {
      name:np.name,role:np.role,age:parseInt(np.age)||22,state:np.state,photoUrl:np.photoUrl,nationality:np.nationality as any,
      battingStyle:np.battingStyle,bowlingStyle:np.bowlingStyle,jerseyNo:np.jerseyNo,isCaptain:np.isCaptain,isViceCaptain:np.isViceCaptain,
      lastSeason:{ matches:parseInt(np.matches)||0,runs:parseInt(np.runs)||0,avg:parseFloat(np.avg)||0,sr:parseFloat(np.sr)||0,
        wickets:parseInt(np.wickets)||0,economy:parseFloat(np.economy)||0,fifties:parseInt(np.fifties)||0,centuries:parseInt(np.centuries)||0,
        sixes:parseInt(np.sixes)||0,fours:parseInt(np.fours)||0,bestBowl:np.bestBowl||"-",bestBat:np.bestBat||"-" },
      auctionPrice:np.auctionPrice||"₹0",phase:2,selected:true,
    };
    const updated = {...selTeam,players:[...selTeam.players,p]};
    setTeams(t=>t.map(x=>x.id===selTeam.id?updated:x));
    setSelTeam(updated);
    setShowAddPlayer(false);
    setNp({ name:"",role:"Batsman",age:"",state:"",photoUrl:"",battingStyle:"Right-hand bat",bowlingStyle:"Right-arm medium",jerseyNo:"",nationality:"Indian",isCaptain:false,isViceCaptain:false,matches:"",runs:"",avg:"",sr:"",wickets:"",economy:"",fifties:"",centuries:"",sixes:"",fours:"",bestBowl:"",bestBat:"",auctionPrice:"" });
  };

  const savePlayerEdit = () => {
    if(!selTeam||editPlayerIdx<0||!editPlayer) return;
    const updated = {...selTeam,players:selTeam.players.map((p,i)=>i===editPlayerIdx?editPlayer:p)};
    setTeams(t=>t.map(x=>x.id===selTeam.id?updated:x));
    setSelTeam(updated);
    setEditPlayer(null); setEditPlayerIdx(-1);
  };

  const PlayerFormFields = ({ vals, set }:{ vals:typeof np; set:React.Dispatch<React.SetStateAction<typeof np>> }) => (
    <>
      <ImageUpload label="Player Photo" value={vals.photoUrl} onChange={url=>set(p=>({...p,photoUrl:url}))} size={72}/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14 }}>
        {[{l:"Full Name",k:"name",span:true},{l:"State / City",k:"state"},{l:"Age",k:"age"},{l:"Jersey No.",k:"jerseyNo"},{l:"Auction Price",k:"auctionPrice"}].map(f=>(
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
          <label style={lbl}>Nationality</label>
          <select value={vals.nationality} onChange={e=>set(p=>({...p,nationality:e.target.value}))} style={inp}>
            {["Indian","Overseas"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Batting Style</label>
          <select value={vals.battingStyle} onChange={e=>set(p=>({...p,battingStyle:e.target.value}))} style={inp}>
            {["Right-hand bat","Left-hand bat"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Bowling Style</label>
          <select value={vals.bowlingStyle} onChange={e=>set(p=>({...p,bowlingStyle:e.target.value}))} style={inp}>
            {["Right-arm fast","Right-arm fast-medium","Right-arm medium","Right-arm off-break","Right-arm leg-break","Left-arm fast","Left-arm fast-medium","Left-arm orthodox","Left-arm chinaman","Does not bowl"].map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:"1/-1",display:"flex",gap:20 }}>
          <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
            <input type="checkbox" checked={vals.isCaptain} onChange={e=>set(p=>({...p,isCaptain:e.target.checked}))} style={{ width:16,height:16 }}/>
            <span style={{ fontSize:12,color:"#F59E0B",fontWeight:700 }}>👑 Captain</span>
          </label>
          <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
            <input type="checkbox" checked={vals.isViceCaptain} onChange={e=>set(p=>({...p,isViceCaptain:e.target.checked}))} style={{ width:16,height:16 }}/>
            <span style={{ fontSize:12,color:"#94A3B8",fontWeight:700 }}>🏅 Vice-Captain</span>
          </label>
        </div>
      </div>
      <div style={{ fontSize:12,fontWeight:700,color:"#475569",margin:"16px 0 10px",textTransform:"uppercase",letterSpacing:.5 }}>⚡ Last Season Scorecard</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9 }}>
        {[{l:"Matches",k:"matches"},{l:"Runs",k:"runs"},{l:"Bat Avg",k:"avg"},{l:"Strike Rate",k:"sr"},{l:"Fours",k:"fours"},{l:"Sixes",k:"sixes"},{l:"Fifties",k:"fifties"},{l:"Centuries",k:"centuries"},{l:"Wickets",k:"wickets"},{l:"Economy",k:"economy"},{l:"Best Bowl",k:"bestBowl"},{l:"Best Bat",k:"bestBat"}].map(f=>(
          <div key={f.k}>
            <label style={{ fontSize:10,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>{f.l}</label>
            <input value={(vals as any)[f.k]} onChange={e=>set(p=>({...p,[f.k]:e.target.value}))} placeholder="0" style={{ width:"100%",padding:"7px 9px",background:"#060B18",border:"1px solid #1E293B",borderRadius:8,color:"#F1F5F9",fontSize:12,outline:"none",boxSizing:"border-box" }}/>
          </div>
        ))}
      </div>
    </>
  );

  /* Team Analytics derived */
  const teamAnalytics = (t: Team) => {
    if(!t.players.length) return null;
    const batters = t.players.filter(p=>p.role==="Batsman"||p.role==="All-rounder");
    const bowlers = t.players.filter(p=>p.role==="Bowler"||p.role==="All-rounder");
    return {
      avgBatAvg:    batters.length ? (batters.reduce((a,p)=>a+p.lastSeason.avg,0)/batters.length).toFixed(1) : "—",
      avgSR:        batters.length ? (batters.reduce((a,p)=>a+p.lastSeason.sr,0)/batters.length).toFixed(1) : "—",
      avgEconomy:   bowlers.length ? (bowlers.reduce((a,p)=>a+p.lastSeason.economy,0)/bowlers.length).toFixed(1) : "—",
      totalWickets: t.players.reduce((a,p)=>a+p.lastSeason.wickets,0),
      totalRuns:    t.players.reduce((a,p)=>a+p.lastSeason.runs,0),
      totalSixes:   t.players.reduce((a,p)=>a+p.lastSeason.sixes,0),
    };
  };

  return (
    <div style={{ display:"flex",gap:16 }}>

      {/* ── LEFT: Standings ── */}
      <div style={{ flex:"0 0 440px",display:"flex",flexDirection:"column",gap:12 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9" }}>BCPL Teams</div>
            <div style={{ fontSize:11,color:"#64748B",marginTop:2 }}>10 franchise teams · Season 5</div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>setShowCompare(true)} style={{ padding:"7px 12px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer" }}>⚔ Compare</button>
            <button onClick={()=>setShowAddTeam(true)} style={{ padding:"8px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Add Team</button>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
          {[
            { v:"10",   l:"Teams",      c:"#FF6B00" },
            { v:teams.reduce((a,t)=>a+t.players.length,0).toString(), l:"Players", c:"#10B981" },
            { v:"₹20L", l:"Top Bid",    c:"#F59E0B" },
          ].map(s=>(
            <div key={s.l} style={{ ...card,padding:"12px 14px",textAlign:"center",borderTop:`2px solid ${s.c}` }}>
              <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10,color:"#475569",marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Points Table */}
        <div style={{ ...card,padding:0,overflow:"hidden" }}>
          <div style={{ padding:"12px 14px",background:"#060E1C",borderBottom:"1px solid #1E293B",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,fontWeight:800,color:"#F1F5F9" }}>Points Table</span>
            <span style={{ fontSize:10,color:"#475569" }}>Season 5</span>
          </div>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#060E1C",borderBottom:"1px solid #1E293B" }}>
                {["#","Team","M","W","L","NRR","Pts",""].map(h=>(
                  <th key={h} style={{ padding:"8px 8px",textAlign:h==="Team"?"left":"center",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t,i)=>(
                <tr key={t.id} onClick={()=>{ setSelTeam(t); setDetailTab("squad"); }} style={{
                  borderBottom:"1px solid #0F1B2D",cursor:"pointer",
                  background:selTeam?.id===t.id?`${t.color}18`:"transparent",transition:"background .15s",
                  borderLeft:selTeam?.id===t.id?`3px solid ${t.color}`:"3px solid transparent",
                }}>
                  <td style={{ padding:"10px 8px",textAlign:"center" }}>
                    <span style={{ fontSize:i<3?16:13,fontWeight:800,color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#334155" }}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                    </span>
                  </td>
                  <td style={{ padding:"10px 8px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <TeamLogo url={t.logoUrl} name={t.name} size={26} color={t.color}/>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700,color:"#F1F5F9",lineHeight:1.2 }}>{t.name}</div>
                        <div style={{ fontSize:9,color:"#475569" }}>{t.city} · {t.players.length}P</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"10px 8px",textAlign:"center",fontSize:12,color:"#94A3B8" }}>{t.matchesPlayed}</td>
                  <td style={{ padding:"10px 8px",textAlign:"center",fontSize:13,fontWeight:800,color:"#10B981" }}>{t.wins}</td>
                  <td style={{ padding:"10px 8px",textAlign:"center",fontSize:13,color:"#EF4444",fontWeight:600 }}>{t.losses}</td>
                  <td style={{ padding:"10px 8px",textAlign:"center",fontSize:11,color:parseFloat(t.nrr)>=0?"#10B981":"#EF4444",fontWeight:700 }}>{t.nrr}</td>
                  <td style={{ padding:"10px 8px",textAlign:"center",fontSize:15,fontWeight:800,color:"#FF6B00" }}>{t.wins*2}</td>
                  <td style={{ padding:"10px 8px",textAlign:"center" }}>
                    <button onClick={e=>{e.stopPropagation();setEditTeam({...t});}} style={{ padding:"3px 8px",borderRadius:6,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:10,cursor:"pointer" }}>✏</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT: Team Detail ── */}
      {selTeam && !editTeam && (
        <div style={{ flex:1,display:"flex",flexDirection:"column",gap:14,minWidth:0 }}>
          {/* Team Banner */}
          <div style={{ borderRadius:16,overflow:"hidden",border:"1px solid #1E293B" }}>
            <div style={{ background:`linear-gradient(135deg,${selTeam.color}44 0%,${selTeam.secondColor}22 100%)`,padding:"20px 22px",borderBottom:"1px solid #1E293B" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                  <TeamLogo url={selTeam.logoUrl} name={selTeam.name} size={68} color={selTeam.color}/>
                  <div>
                    <div style={{ fontSize:22,fontWeight:900,color:"#F1F5F9",lineHeight:1.1 }}>{selTeam.name}</div>
                    <div style={{ fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4 }}>
                      📍 {selTeam.city} &nbsp;·&nbsp; 🏟 {selTeam.homeGround}
                    </div>
                    <div style={{ fontSize:11,color:"rgba(255,255,255,.4)",marginTop:3 }}>
                      👤 Coach: {selTeam.coach} &nbsp;·&nbsp; 🏢 Owner: {selTeam.owner}
                    </div>
                    <div style={{ display:"flex",gap:8,marginTop:8 }}>
                      {selTeam.titlesWon > 0 && (
                        <span style={{ fontSize:10,padding:"2px 10px",borderRadius:6,background:"#FFD70022",border:"1px solid #FFD70044",color:"#FFD700",fontWeight:700 }}>🏆 {selTeam.titlesWon} Title{selTeam.titlesWon>1?"s":""}</span>
                      )}
                      <span style={{ fontSize:10,padding:"2px 10px",borderRadius:6,background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.4)",fontWeight:600 }}>{selTeam.players.length} Players</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>setEditTeam({...selTeam})} style={{ padding:"7px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.06)",color:"#94A3B8",fontSize:12,cursor:"pointer" }}>✏️ Edit</button>
                  <button onClick={()=>setSelTeam(null)} style={{ padding:"7px 10px",borderRadius:8,border:"none",background:"rgba(255,255,255,.06)",color:"#64748B",fontSize:12,cursor:"pointer" }}>✕</button>
                </div>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",background:"#060B18" }}>
              {[
                { l:"Wins",   v:selTeam.wins,       c:"#10B981" },
                { l:"Losses", v:selTeam.losses,      c:"#EF4444" },
                { l:"NRR",    v:selTeam.nrr,         c:parseFloat(selTeam.nrr)>=0?"#10B981":"#EF4444" },
                { l:"Points", v:selTeam.wins*2,      c:"#FF6B00" },
                { l:"Rank",   v:`#${sorted.findIndex(t=>t.id===selTeam.id)+1}`,c:"#F59E0B" },
              ].map((s,i)=>(
                <div key={s.l} style={{ textAlign:"center",padding:"14px 8px",borderRight:i<4?"1px solid #1E293B":"none" }}>
                  <div style={{ fontSize:22,fontWeight:900,color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:10,color:"#475569",marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{ display:"flex",gap:6 }}>
            {([["squad","👥 Squad"],["stats","📊 Analytics"],["history","📋 Match History"]] as const).map(([t,l])=>(
              <button key={t} onClick={()=>setDetailTab(t)} style={{ padding:"8px 18px",borderRadius:10,border:`1px solid ${detailTab===t?selTeam.color:"#1E293B"}`,background:detailTab===t?selTeam.color+"22":"transparent",color:detailTab===t?selTeam.color:"#64748B",fontSize:12,fontWeight:700,cursor:"pointer" }}>{l}</button>
            ))}
          </div>

          {/* ── Squad Tab ── */}
          {detailTab==="squad"&&(
            <div style={{ ...card }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:"#F1F5F9" }}>Squad</div>
                  <div style={{ fontSize:11,color:"#64748B",marginTop:2 }}>
                    {selTeam.players.length} players &nbsp;·&nbsp;
                    {selTeam.players.filter(p=>p.role==="Batsman").length} Bat &nbsp;
                    {selTeam.players.filter(p=>p.role==="Bowler").length} Bowl &nbsp;
                    {selTeam.players.filter(p=>p.role==="All-rounder").length} AR &nbsp;
                    {selTeam.players.filter(p=>p.role==="Wicket-keeper").length} WK
                  </div>
                </div>
                <button onClick={()=>setShowAddPlayer(true)} style={{ padding:"9px 18px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${selTeam.color},${selTeam.secondColor})`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Add Player</button>
              </div>

              {selTeam.players.length===0
                ? (
                  <div style={{ textAlign:"center",padding:"48px 0",color:"#334155" }}>
                    <div style={{ fontSize:44,marginBottom:12 }}>👥</div>
                    <div style={{ fontSize:14,color:"#475569",fontWeight:600 }}>No players registered</div>
                    <div style={{ fontSize:12,color:"#334155",marginTop:4 }}>Click + Add Player to build the squad</div>
                    <button onClick={()=>setShowAddPlayer(true)} style={{ marginTop:14,padding:"10px 22px",borderRadius:10,border:"none",background:"#FF6B0022",color:"#FF6B00",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add First Player</button>
                  </div>
                )
                : (
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {selTeam.players.map((p,i)=>(
                      <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#060B18",borderRadius:12,border:"1px solid #1E293B",cursor:"pointer",transition:"border-color .15s" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=`${selTeam.color}55`}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#1E293B"}>
                        <Avatar url={p.photoUrl} name={p.name} size={44} color={roleColor(p.role)}/>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                            <span style={{ fontSize:13,fontWeight:700,color:"#F1F5F9" }}>{p.name}</span>
                            {p.isCaptain&&<span style={{ fontSize:10,background:"#FFD70022",border:"1px solid #FFD70044",color:"#FFD700",fontWeight:700,padding:"1px 7px",borderRadius:5 }}>👑 C</span>}
                            {p.isViceCaptain&&<span style={{ fontSize:10,background:"rgba(255,255,255,.06)",color:"#94A3B8",fontWeight:700,padding:"1px 7px",borderRadius:5 }}>VC</span>}
                            {p.jerseyNo&&<span style={{ fontSize:10,color:"#334155",background:"#1E293B",padding:"1px 6px",borderRadius:5 }}>#{p.jerseyNo}</span>}
                            {p.nationality==="Overseas"&&<span style={{ fontSize:9,background:"#3B82F622",color:"#3B82F6",fontWeight:700,padding:"1px 7px",borderRadius:5 }}>🌍 OS</span>}
                          </div>
                          <div style={{ display:"flex",gap:6,marginTop:4,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,padding:"2px 8px",borderRadius:5,background:roleColor(p.role)+"22",color:roleColor(p.role),fontWeight:700 }}>{roleEmoji(p.role)} {p.role}</span>
                            <span style={{ fontSize:10,color:"#475569" }}>{p.state} · {p.age}y</span>
                            {p.auctionPrice&&p.auctionPrice!=="₹0"&&<span style={{ fontSize:10,color:"#E8B23D",fontWeight:700 }}>🏷 {p.auctionPrice}</span>}
                          </div>
                        </div>
                        {/* Mini stats */}
                        <div style={{ display:"flex",gap:10,flexShrink:0 }}>
                          {[{l:"R",v:p.lastSeason.runs,c:"#FF6B00"},{l:"W",v:p.lastSeason.wickets,c:"#EF4444"},{l:"Avg",v:p.lastSeason.avg,c:"#F59E0B"},{l:"SR",v:p.lastSeason.sr,c:"#3B82F6"}].map(s=>(
                            <div key={s.l} style={{ textAlign:"center",minWidth:32 }}>
                              <div style={{ fontSize:13,fontWeight:800,color:s.c }}>{s.v||0}</div>
                              <div style={{ fontSize:9,color:"#475569" }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display:"flex",gap:6 }}>
                          <button onClick={()=>setViewPlayer(p)} style={{ padding:"5px 10px",borderRadius:7,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer" }}>Card</button>
                          <button onClick={()=>{setEditPlayer({...p});setEditPlayerIdx(i);}} style={{ padding:"5px 10px",borderRadius:7,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:11,cursor:"pointer" }}>Edit</button>
                          <button onClick={()=>{const np=selTeam.players.filter((_,j)=>j!==i);const u={...selTeam,players:np};setTeams(t=>t.map(x=>x.id===selTeam.id?u:x));setSelTeam(u);}} style={{ padding:"5px 8px",borderRadius:7,border:"none",background:"#EF444422",color:"#EF4444",fontSize:11,cursor:"pointer" }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {detailTab==="stats"&&(()=>{
            const a = teamAnalytics(selTeam);
            return (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {!a
                  ? <div style={{ ...card,textAlign:"center",padding:"40px 0",color:"#475569" }}>No players yet — add players to see analytics.</div>
                  : (
                    <>
                      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                        {[
                          { l:"Avg Batting Avg", v:a.avgBatAvg, c:"#FF6B00", icon:"🏏" },
                          { l:"Avg Strike Rate", v:a.avgSR,     c:"#3B82F6", icon:"⚡" },
                          { l:"Avg Economy",     v:a.avgEconomy,c:"#EF4444", icon:"🎳" },
                          { l:"Total Wickets",   v:a.totalWickets,c:"#F59E0B",icon:"💥" },
                          { l:"Total Runs",      v:a.totalRuns, c:"#10B981", icon:"🏆" },
                          { l:"Total Sixes",     v:a.totalSixes,c:"#6366F1", icon:"6️⃣" },
                        ].map(s=>(
                          <div key={s.l} style={{ ...card,borderTop:`3px solid ${s.c}`,padding:"16px" }}>
                            <div style={{ fontSize:20,marginBottom:6 }}>{s.icon}</div>
                            <div style={{ fontSize:24,fontWeight:800,color:s.c }}>{s.v}</div>
                            <div style={{ fontSize:11,color:"#64748B",marginTop:3 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      {/* Squad composition bar */}
                      <div style={card}>
                        <div style={{ fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:14 }}>Squad Composition</div>
                        {[
                          { role:"Batsman",       count:selTeam.players.filter(p=>p.role==="Batsman").length,       color:"#3B82F6",  ideal:4 },
                          { role:"Bowler",        count:selTeam.players.filter(p=>p.role==="Bowler").length,        color:"#EF4444",  ideal:4 },
                          { role:"All-rounder",   count:selTeam.players.filter(p=>p.role==="All-rounder").length,   color:"#FF6B00",  ideal:3 },
                          { role:"Wicket-keeper", count:selTeam.players.filter(p=>p.role==="Wicket-keeper").length, color:"#10B981",  ideal:1 },
                        ].map(r=>(
                          <div key={r.role} style={{ marginBottom:12 }}>
                            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                              <span style={{ fontSize:12,color:"#94A3B8" }}>{roleEmoji(r.role)} {r.role}</span>
                              <span style={{ fontSize:12,fontWeight:700,color:r.color }}>{r.count}/{r.ideal} ideal</span>
                            </div>
                            <div style={{ height:8,borderRadius:4,background:"#1E293B",overflow:"hidden" }}>
                              <div style={{ height:"100%",width:`${Math.min((r.count/r.ideal)*100,100)}%`,background:r.color,borderRadius:4,transition:"width .5s" }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                }
              </div>
            );
          })()}

          {/* ── Match History Tab ── */}
          {detailTab==="history"&&(
            <div style={card}>
              <div style={{ fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16 }}>Recent Match Results</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {MATCH_HISTORY.map((m,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"#060B18",borderRadius:12,border:`1px solid ${m.result==="W"?"#10B98130":"#EF444430"}` }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:m.result==="W"?"#10B98122":"#EF444422",border:`2px solid ${m.result==="W"?"#10B98144":"#EF444444"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <span style={{ fontSize:16,fontWeight:900,color:m.result==="W"?"#10B981":"#EF4444" }}>{m.result}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"#F1F5F9" }}>vs {m.opponent}</div>
                      <div style={{ fontSize:11,color:"#475569",marginTop:2 }}>{m.runs} vs {m.opp} · Won by {m.margin}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11,color:"#475569" }}>{m.date}</div>
                      <div style={{ fontSize:11,fontWeight:700,color:m.result==="W"?"#10B981":"#EF4444",marginTop:2 }}>{m.result==="W"?"Victory":"Defeat"}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Form guide */}
              <div style={{ marginTop:16,padding:"12px 14px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B" }}>
                <div style={{ fontSize:11,color:"#64748B",marginBottom:8 }}>Form Guide (Last 5)</div>
                <div style={{ display:"flex",gap:6 }}>
                  {MATCH_HISTORY.map((m,i)=>(
                    <div key={i} style={{ width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:m.result==="W"?"#10B98130":"#EF444430",border:`2px solid ${m.result==="W"?"#10B98160":"#EF444460"}` }}>
                      <span style={{ fontSize:12,fontWeight:800,color:m.result==="W"?"#10B981":"#EF4444" }}>{m.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Team Compare Modal ── */}
      {showCompare&&(
        <div style={{ position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }} onClick={()=>setShowCompare(false)}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,padding:28,width:640,maxHeight:"90vh",overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:20 }}>⚔ Head-to-Head Comparison</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20 }}>
              {[{label:"Team A",val:compareA,set:setCompareA},{label:"Team B",val:compareB,set:setCompareB}].map(({label,val,set})=>(
                <div key={label}>
                  <label style={lbl}>{label}</label>
                  <select value={val??""} onChange={e=>set(e.target.value?parseInt(e.target.value):null)} style={inp}>
                    <option value="">Select team…</option>
                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {compareA&&compareB&&compareA!==compareB&&(()=>{
              const a = teams.find(t=>t.id===compareA)!;
              const b = teams.find(t=>t.id===compareB)!;
              return (
                <div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",marginBottom:16 }}>
                    <div style={{ textAlign:"center",padding:"16px",background:`${a.color}22`,borderRadius:12,border:`2px solid ${a.color}44` }}>
                      <TeamLogo url={a.logoUrl} name={a.name} size={48} color={a.color}/>
                      <div style={{ fontSize:13,fontWeight:700,color:"#F1F5F9",marginTop:8 }}>{a.name}</div>
                    </div>
                    <div style={{ textAlign:"center",fontSize:18,fontWeight:900,color:"#FF6B00" }}>VS</div>
                    <div style={{ textAlign:"center",padding:"16px",background:`${b.color}22`,borderRadius:12,border:`2px solid ${b.color}44` }}>
                      <TeamLogo url={b.logoUrl} name={b.name} size={48} color={b.color}/>
                      <div style={{ fontSize:13,fontWeight:700,color:"#F1F5F9",marginTop:8 }}>{b.name}</div>
                    </div>
                  </div>
                  {[
                    { l:"Wins",   va:a.wins,    vb:b.wins,   higher:"a" },
                    { l:"Losses", va:a.losses,  vb:b.losses, higher:"b" },
                    { l:"NRR",    va:parseFloat(a.nrr), vb:parseFloat(b.nrr), higher:"a" },
                    { l:"Points", va:a.wins*2,  vb:b.wins*2, higher:"a" },
                    { l:"Squad",  va:a.players.length, vb:b.players.length, higher:"a" },
                  ].map(r=>{
                    const betterA = r.va > r.vb;
                    return (
                      <div key={r.l} style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1E293B" }}>
                        <div style={{ textAlign:"right",fontSize:15,fontWeight:800,color:betterA?a.color:"#94A3B8" }}>{r.va}</div>
                        <div style={{ textAlign:"center",fontSize:11,color:"#475569",fontWeight:700,minWidth:60 }}>{r.l}</div>
                        <div style={{ fontSize:15,fontWeight:800,color:!betterA?b.color:"#94A3B8" }}>{r.vb}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <button onClick={()=>setShowCompare(false)} style={{ marginTop:20,width:"100%",padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Edit Team Modal ── */}
      {editTeam&&(
        <div style={{ position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,padding:28,width:560,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:20 }}>Edit Team — {editTeam.name}</div>
            <ImageUpload label="Team Logo" value={editTeam.logoUrl} onChange={url=>setEditTeam(p=>p?{...p,logoUrl:url}:p)} size={80}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14 }}>
              {[{l:"Team Name",k:"name"},{l:"City",k:"city"},{l:"Captain",k:"captain"},{l:"Coach",k:"coach"},{l:"Owner",k:"owner"},{l:"Home Ground",k:"homeGround",span:true}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editTeam as any)[f.k]||""} onChange={e=>setEditTeam(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
              {[{l:"Wins",k:"wins"},{l:"Losses",k:"losses"},{l:"NRR",k:"nrr"},{l:"Titles Won",k:"titlesWon"}].map(f=>(
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editTeam as any)[f.k]} onChange={e=>setEditTeam(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[{l:"Primary Color",k:"color"},{l:"Secondary Color",k:"secondColor"}].map(f=>(
                <div key={f.k}>
                  <label style={lbl}>{f.l}</label>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <input type="color" value={(editTeam as any)[f.k]} onChange={e=>setEditTeam(p=>p?{...p,[f.k]:e.target.value}:p)} style={{ width:44,height:44,background:"#060B18",border:"1px solid #1E293B",borderRadius:9,cursor:"pointer" }}/>
                    <span style={{ fontSize:11,color:"#64748B" }}>{(editTeam as any)[f.k]}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10,marginTop:22 }}>
              <button onClick={()=>setEditTeam(null)} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ setTeams(t=>t.map(x=>x.id===editTeam.id?editTeam:x)); if(selTeam?.id===editTeam.id) setSelTeam(editTeam); setEditTeam(null); }} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Team Modal ── */}
      {showAddTeam&&(
        <div style={{ position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,padding:28,width:520,maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:20 }}>Add New Team</div>
            <ImageUpload label="Team Logo" value={newTeam.logoUrl} onChange={url=>setNewTeam(p=>({...p,logoUrl:url}))} size={80}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14 }}>
              {[{l:"Team Name",k:"name",span:true},{l:"City",k:"city"},{l:"Coach",k:"coach"},{l:"Owner / Franchise",k:"owner",span:true},{l:"Home Ground",k:"homeGround",span:true}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(newTeam as any)[f.k]} onChange={e=>setNewTeam(p=>({...p,[f.k]:e.target.value}))} style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10,marginTop:12 }}>
              {[{l:"Primary",k:"color"},{l:"Secondary",k:"secondColor"}].map(f=>(
                <div key={f.k} style={{ flex:1 }}>
                  <label style={lbl}>{f.l} Color</label>
                  <input type="color" value={(newTeam as any)[f.k]} onChange={e=>setNewTeam(p=>({...p,[f.k]:e.target.value}))} style={{ width:"100%",height:42,background:"#060B18",border:"1px solid #1E293B",borderRadius:9,cursor:"pointer" }}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10,marginTop:22 }}>
              <button onClick={()=>setShowAddTeam(false)} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ if(newTeam.name&&newTeam.city){ setTeams(p=>[...p,{id:Date.now(),name:newTeam.name,city:newTeam.city,color:newTeam.color,secondColor:newTeam.secondColor,logoUrl:newTeam.logoUrl,wins:0,losses:0,nrr:"0.00",captain:"TBD",homeGround:newTeam.homeGround,coach:newTeam.coach,owner:newTeam.owner,matchesPlayed:0,titlesWon:0,players:[]}]); setShowAddTeam(false); setNewTeam({name:"",city:"",coach:"",owner:"",homeGround:"",color:"#FF6B00",secondColor:"#F59E0B",logoUrl:""}); }}} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Add Team</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Player Modal ── */}
      {showAddPlayer&&selTeam&&(
        <div style={{ position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,padding:28,width:580,maxHeight:"92vh",overflowY:"auto" }}>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4 }}>Add Player</div>
            <div style={{ fontSize:12,color:"#64748B",marginBottom:18 }}>→ {selTeam.name}</div>
            <PlayerFormFields vals={np} set={setNp}/>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <button onClick={()=>setShowAddPlayer(false)} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer" }}>Cancel</button>
              <button onClick={addPlayer} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Add to Squad</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Player Modal ── */}
      {editPlayer&&(
        <div style={{ position:"fixed",inset:0,background:"#00000090",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,padding:28,width:580,maxHeight:"92vh",overflowY:"auto" }}>
            <div style={{ fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4 }}>Edit Player</div>
            <div style={{ fontSize:12,color:"#64748B",marginBottom:18 }}>{editPlayer.name}</div>
            <ImageUpload label="Player Photo" value={editPlayer.photoUrl} onChange={url=>setEditPlayer(p=>p?{...p,photoUrl:url}:p)} size={72}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14 }}>
              {[{l:"Full Name",k:"name",span:true},{l:"State",k:"state"},{l:"Age",k:"age"},{l:"Jersey No.",k:"jerseyNo"},{l:"Auction Price",k:"auctionPrice"}].map(f=>(
                <div key={f.k} style={{ gridColumn:(f as any).span?"1/-1":"auto" }}>
                  <label style={lbl}>{f.l}</label>
                  <input value={(editPlayer as any)[f.k]||""} onChange={e=>setEditPlayer(p=>p?{...p,[f.k]:e.target.value}:p)} style={inp}/>
                </div>
              ))}
              <div><label style={lbl}>Role</label><select value={editPlayer.role} onChange={e=>setEditPlayer(p=>p?{...p,role:e.target.value}:p)} style={inp}>{["Batsman","Bowler","All-rounder","Wicket-keeper"].map(r=><option key={r}>{r}</option>)}</select></div>
              <div><label style={lbl}>Batting Style</label><select value={editPlayer.battingStyle} onChange={e=>setEditPlayer(p=>p?{...p,battingStyle:e.target.value}:p)} style={inp}>{["Right-hand bat","Left-hand bat"].map(r=><option key={r}>{r}</option>)}</select></div>
              <div style={{ gridColumn:"1/-1",display:"flex",gap:20 }}>
                <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}><input type="checkbox" checked={editPlayer.isCaptain||false} onChange={e=>setEditPlayer(p=>p?{...p,isCaptain:e.target.checked}:p)}/><span style={{ fontSize:12,color:"#F59E0B",fontWeight:700 }}>👑 Captain</span></label>
                <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}><input type="checkbox" checked={editPlayer.isViceCaptain||false} onChange={e=>setEditPlayer(p=>p?{...p,isViceCaptain:e.target.checked}:p)}/><span style={{ fontSize:12,color:"#94A3B8",fontWeight:700 }}>🏅 Vice-Captain</span></label>
              </div>
            </div>
            <div style={{ fontSize:12,fontWeight:700,color:"#475569",margin:"14px 0 10px",textTransform:"uppercase",letterSpacing:.5 }}>Last Season</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9 }}>
              {[{l:"Matches",k:"matches"},{l:"Runs",k:"runs"},{l:"Avg",k:"avg"},{l:"SR",k:"sr"},{l:"4s",k:"fours"},{l:"6s",k:"sixes"},{l:"50s",k:"fifties"},{l:"100s",k:"centuries"},{l:"Wickets",k:"wickets"},{l:"Economy",k:"economy"},{l:"Best Bowl",k:"bestBowl"},{l:"Best Bat",k:"bestBat"}].map(f=>(
                <div key={f.k}>
                  <label style={{ fontSize:10,color:"#475569",fontWeight:700,display:"block",marginBottom:4 }}>{f.l}</label>
                  <input value={(editPlayer.lastSeason as any)[f.k]||""} onChange={e=>setEditPlayer(p=>p?{...p,lastSeason:{...p.lastSeason,[f.k]:e.target.value}}:p)} style={{ width:"100%",padding:"7px 8px",background:"#060B18",border:"1px solid #1E293B",borderRadius:8,color:"#F1F5F9",fontSize:12,outline:"none",boxSizing:"border-box" }}/>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <button onClick={()=>{setEditPlayer(null);setEditPlayerIdx(-1);}} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer" }}>Cancel</button>
              <button onClick={savePlayerEdit} style={{ flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Player Card Modal ── */}
      {viewPlayer&&selTeam&&(
        <div style={{ position:"fixed",inset:0,background:"#000000CC",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }} onClick={()=>setViewPlayer(null)}>
          <div style={{ background:"#0D1526",border:"1px solid #1E293B",borderRadius:20,width:480,overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
            {/* Card header */}
            <div style={{ background:`linear-gradient(135deg,${selTeam.color}55,${selTeam.secondColor}22)`,borderBottom:"1px solid #1E293B",padding:"24px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                <Avatar url={viewPlayer.photoUrl} name={viewPlayer.name} size={72} color={roleColor(viewPlayer.role)}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    <span style={{ fontSize:22,fontWeight:900,color:"#F1F5F9" }}>{viewPlayer.name}</span>
                    {viewPlayer.isCaptain&&<span style={{ fontSize:12,background:"#FFD70022",border:"1px solid #FFD70044",color:"#FFD700",fontWeight:800,padding:"2px 9px",borderRadius:6 }}>👑 C</span>}
                    {viewPlayer.isViceCaptain&&<span style={{ fontSize:12,background:"rgba(255,255,255,.06)",color:"#94A3B8",fontWeight:700,padding:"2px 9px",borderRadius:6 }}>VC</span>}
                  </div>
                  <div style={{ display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center" }}>
                    <span style={{ fontSize:12,padding:"3px 10px",borderRadius:6,background:roleColor(viewPlayer.role)+"33",color:roleColor(viewPlayer.role),fontWeight:700 }}>{roleEmoji(viewPlayer.role)} {viewPlayer.role}</span>
                    {viewPlayer.jerseyNo&&<span style={{ fontSize:12,color:"#64748B" }}>#{viewPlayer.jerseyNo}</span>}
                    <span style={{ fontSize:12,color:"#64748B" }}>{viewPlayer.state} · {viewPlayer.age}y</span>
                    {viewPlayer.nationality==="Overseas"&&<span style={{ fontSize:10,background:"#3B82F622",color:"#3B82F6",fontWeight:700,padding:"2px 9px",borderRadius:6 }}>🌍 Overseas</span>}
                  </div>
                  <div style={{ fontSize:11,color:"#475569",marginTop:4 }}>{viewPlayer.battingStyle} · {viewPlayer.bowlingStyle}</div>
                  {viewPlayer.auctionPrice&&viewPlayer.auctionPrice!=="₹0"&&(
                    <div style={{ marginTop:6,display:"inline-flex",alignItems:"center",gap:6,background:"#E8B23D22",border:"1px solid #E8B23D44",borderRadius:8,padding:"4px 12px" }}>
                      <span style={{ fontSize:11,color:"#E8B23D",fontWeight:700 }}>🏷 Auction: {viewPlayer.auctionPrice}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding:"20px 24px" }}>
              {/* Stats grid */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16 }}>
                {[
                  { l:"M",    v:viewPlayer.lastSeason.matches,  c:"#6366F1" },
                  { l:"Runs", v:viewPlayer.lastSeason.runs,     c:"#FF6B00" },
                  { l:"Avg",  v:viewPlayer.lastSeason.avg,      c:"#F59E0B" },
                  { l:"SR",   v:viewPlayer.lastSeason.sr,       c:"#3B82F6" },
                  { l:"4s",   v:viewPlayer.lastSeason.fours,    c:"#10B981" },
                  { l:"6s",   v:viewPlayer.lastSeason.sixes,    c:"#E8B23D" },
                  { l:"Wkts", v:viewPlayer.lastSeason.wickets,  c:"#EF4444" },
                  { l:"Eco",  v:viewPlayer.lastSeason.economy,  c:"#64748B" },
                ].map(s=>(
                  <div key={s.l} style={{ textAlign:"center",padding:"10px 6px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B" }}>
                    <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v||0}</div>
                    <div style={{ fontSize:9,color:"#475569",marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Bests */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
                {[{l:"Best Batting",v:viewPlayer.lastSeason.bestBat,c:"#FF6B00"},{l:"Best Bowling",v:viewPlayer.lastSeason.bestBowl,c:"#EF4444"}].map(s=>(
                  <div key={s.l} style={{ padding:"10px 12px",background:"#060B18",borderRadius:10,border:`1px solid ${s.c}33` }}>
                    <div style={{ fontSize:10,color:"#475569",fontWeight:700,marginBottom:3 }}>{s.l}</div>
                    <div style={{ fontSize:16,fontWeight:800,color:s.c }}>{s.v||"—"}</div>
                  </div>
                ))}
              </div>
              {/* Performance bars */}
              <div style={{ background:"#060B18",borderRadius:12,padding:"12px 14px",border:"1px solid #1E293B",marginBottom:16 }}>
                <div style={{ fontSize:10,color:"#475569",fontWeight:700,marginBottom:10 }}>PERFORMANCE RATING</div>
                {[
                  { l:"Batting Avg",      val:viewPlayer.lastSeason.avg, max:60,  c:"#FF6B00" },
                  { l:"Strike Rate",      val:viewPlayer.lastSeason.sr,  max:200, c:"#3B82F6" },
                  { l:"Bowling Impact",   val:viewPlayer.lastSeason.wickets*8, max:100, c:"#EF4444" },
                ].map(b=>(
                  <div key={b.l} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                      <span style={{ fontSize:11,color:"#64748B" }}>{b.l}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:b.c }}>{b.val}</span>
                    </div>
                    <div style={{ height:6,borderRadius:3,background:"#1E293B",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${Math.min((b.val/b.max)*100,100)}%`,background:b.c,borderRadius:3,transition:"width .5s" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,background:viewPlayer.selected?"#10B98122":"#F59E0B22",color:viewPlayer.selected?"#10B981":"#F59E0B" }}>
                  {viewPlayer.selected?"✓ Phase 2 Selected":"Phase 1 Player"}
                </span>
                <button onClick={()=>setViewPlayer(null)} style={{ padding:"7px 16px",borderRadius:8,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:12,cursor:"pointer" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
