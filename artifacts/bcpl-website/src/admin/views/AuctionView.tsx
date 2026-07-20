import { useState, useEffect } from "react";

const TEAMS = [
  { name:"Rajasthan Scorchers",  budget:3000000, spent:1850000, color:"#3B82F6" },
  { name:"Mumbai Mavericks",     budget:3000000, spent:2200000, color:"#10B981" },
  { name:"Delhi Suryas",         budget:3000000, spent:900000,  color:"#F59E0B" },
  { name:"Bengaluru Bulls",      budget:3000000, spent:2750000, color:"#8B5CF6" },
  { name:"Chennai Challengers",  budget:3000000, spent:1500000, color:"#EF4444" },
];

const POOL = [
  { id:1, name:"Rahul Verma",    role:"Batsman",  city:"Mumbai",    phase1Score:88, base:50000 },
  { id:2, name:"Arjun Patel",    role:"Bowler",   city:"Delhi",     phase1Score:91, base:75000 },
  { id:3, name:"Kiran Sharma",   role:"All-Rounder",city:"Bengaluru",phase1Score:95, base:100000 },
  { id:4, name:"Suresh Nair",    role:"WK-Batsman",city:"Chennai",  phase1Score:82, base:50000 },
  { id:5, name:"Dev Mehta",      role:"Batsman",  city:"Hyderabad", phase1Score:79, base:50000 },
  { id:6, name:"Amit Singh",     role:"Bowler",   city:"Kolkata",   phase1Score:86, base:75000 },
];

export default function AuctionView() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [bidHistory, setBidHistory] = useState<{team:string,amount:number}[]>([]);
  const [currentBid, setCurrentBid] = useState(POOL[0].base);
  const [soldPlayers, setSoldPlayers] = useState<{player:typeof POOL[0],team:string,amount:number}[]>([]);
  const [timer, setTimer] = useState(30);
  const [running, setRunning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(0);

  const player = POOL[currentIdx];

  useEffect(()=>{
    if(!running) return;
    if(timer<=0){ setRunning(false); return; }
    const t = setTimeout(()=>setTimer(p=>p-1),1000);
    return ()=>clearTimeout(t);
  },[running,timer]);

  function placeBid(teamIdx: number, jump: number){
    const team = TEAMS[teamIdx];
    const newBid = currentBid + jump;
    setBidHistory(h=>[{ team:team.name, amount:newBid }, ...h.slice(0,6)]);
    setCurrentBid(newBid);
    setTimer(30);
  }

  function soldTo(teamIdx: number){
    setSoldPlayers(p=>[...p, { player, team:TEAMS[teamIdx].name, amount:currentBid }]);
    if(currentIdx<POOL.length-1){
      setCurrentIdx(i=>i+1);
      setCurrentBid(POOL[currentIdx+1]?.base||50000);
      setBidHistory([]);
      setTimer(30);
      setRunning(false);
    }
  }

  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
  const fmt = (n:number) => `₹${(n/1000).toFixed(0)}K`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Live Auction Simulator</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Real-time franchise auction — IPL-style bidding for BCPL Season 5</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, color:"#64748B" }}>Player {currentIdx+1}/{POOL.length}</span>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>📤 Share Auction Screen</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>
        {/* Center — current player */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Player card */}
          <div style={{ ...card, textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, #FF6B0010 0%, transparent 70%)", pointerEvents:"none" }}/>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B0040,#1E293B)", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🏏</div>
            <div style={{ fontSize:24, fontWeight:900, color:"#FF6B00" }}>{player.name}</div>
            <div style={{ fontSize:13, color:"#94A3B8", marginTop:4 }}>{player.role} · {player.city}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:14 }}>
              <div><div style={{ fontSize:22, fontWeight:800, color:"#10B981" }}>{player.phase1Score}</div><div style={{ fontSize:10, color:"#475569" }}>Phase 1 Score</div></div>
              <div><div style={{ fontSize:22, fontWeight:800, color:"#F59E0B" }}>{fmt(player.base)}</div><div style={{ fontSize:10, color:"#475569" }}>Base Price</div></div>
            </div>
          </div>

          {/* Current Bid */}
          <div style={{ ...card, textAlign:"center" }}>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>CURRENT BID</div>
            <div style={{ fontSize:48, fontWeight:900, color:"#FF6B00", letterSpacing:-1 }}>{fmt(currentBid)}</div>
            {bidHistory[0]&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Last bid by {bidHistory[0].team}</div>}

            {/* Timer */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginTop:14 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", background:`conic-gradient(${timer<=10?"#EF4444":"#FF6B00"} ${timer/30*360}deg,#1E293B 0)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"#0A1020", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:timer<=10?"#EF4444":"#FF6B00" }}>{timer}</div>
              </div>
              <button onClick={()=>setRunning(r=>!r)} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:running?"#EF444420":"#10B98120", color:running?"#EF4444":"#10B981", fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${running?"#EF444440":"#10B98140"}` } as any}>
                {running?"⏸ Pause":"▶ Start Timer"}
              </button>
            </div>

            {/* Bid buttons */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginTop:16 }}>
              {TEAMS.map((t,i)=>(
                <button key={i} onClick={()=>placeBid(i,25000)} style={{ padding:"10px 4px", borderRadius:10, border:`1px solid ${t.color}40`, background:`${t.color}15`, color:t.color, fontSize:10, fontWeight:700, cursor:"pointer", lineHeight:1.4 }}>
                  {t.name.split(" ")[0]}<br/>+₹25K
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:8 }}>
              {[50000,100000,200000,500000].map(j=>(
                <button key={j} onClick={()=>placeBid(selectedTeam,j)} style={{ padding:"8px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>+{fmt(j)}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button onClick={()=>soldTo(selectedTeam)} style={{ flex:1, padding:"12px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>✓ SOLD to {TEAMS[selectedTeam].name.split(" ")[0]}</button>
              <button style={{ flex:1, padding:"12px", borderRadius:10, border:"none", background:"#EF444420", color:"#EF4444", fontWeight:800, fontSize:13, cursor:"pointer", border:"1px solid #EF444440" } as any}>✗ UNSOLD</button>
            </div>
          </div>
        </div>

        {/* Right — teams + history */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Team budgets */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:12 }}>TEAM BUDGETS</div>
            {TEAMS.map((t,i)=>{
              const rem = t.budget-t.spent;
              const pct = Math.round(t.spent/t.budget*100);
              return (
                <div key={i} onClick={()=>setSelectedTeam(i)} style={{ marginBottom:12, cursor:"pointer", padding:"8px 10px", borderRadius:9, background:selectedTeam===i?`${t.color}15`:"transparent", border:`1px solid ${selectedTeam===i?t.color+"40":"transparent"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:t.color }}>{t.name.split(" ")[0]}</span>
                    <span style={{ fontSize:11, color:"#64748B" }}>₹{(rem/100000).toFixed(1)}L left</span>
                  </div>
                  <div style={{ height:4, background:"#1E293B", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:t.color, borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bid history */}
          <div style={{ ...card, flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:12 }}>BID HISTORY</div>
            {bidHistory.length===0&&<div style={{ fontSize:11, color:"#334155", textAlign:"center", padding:"20px 0" }}>No bids yet</div>}
            {bidHistory.map((b,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F1B2D" }}>
                <span style={{ fontSize:11, color:"#94A3B8" }}>{b.team.split(" ")[0]}</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#FF6B00" }}>{fmt(b.amount)}</span>
              </div>
            ))}
          </div>

          {/* Sold players */}
          {soldPlayers.length>0&&(
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:10 }}>SOLD PLAYERS</div>
              {soldPlayers.map((s,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0F1B2D" }}>
                  <span style={{ fontSize:11, color:"#F1F5F9" }}>{s.player.name}</span>
                  <span style={{ fontSize:11, color:"#10B981", fontWeight:700 }}>{fmt(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
