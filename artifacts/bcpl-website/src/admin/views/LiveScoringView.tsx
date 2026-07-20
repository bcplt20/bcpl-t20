import { useState, useRef } from "react";

const BALLS = ["1","0","4","W","1","6",".",".",".","2","1","4","W","0","1","6"];

export default function LiveScoringView() {
  const [score,      setScore]      = useState({ runs:124, wickets:4, overs:14, balls:2 });
  const [striker,    setStriker]    = useState({ name:"Arjun Sharma",  runs:54, balls:38, fours:5, sixes:2 });
  const [nonStriker]               = useState({ name:"Rahul Patel",    runs:31, balls:28, fours:3, sixes:0 });
  const [bowler]                   = useState({ name:"Vikas Singh",    overs:"3.2", runs:28, wickets:2, economy:"8.4" });
  const [ballLog,    setBallLog]    = useState(BALLS);
  const [commentary, setCommentary] = useState([
    "14.2 — Sharma hits a MASSIVE SIX over mid-wicket! 🚀",
    "14.1 — Full toss driven straight! Boundary four! 🏏",
    "13.6 — Dot ball, good yorker by Singh.",
    "13.5 — WOW! Caught at mid-off, Yadav is OUT! 💥",
    "13.4 — Single taken to deep square leg.",
  ]);
  const [customNote, setCustomNote] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const QUICK_COMMENTS = [
    "🏏 Straight drive to the boundary!",
    "🚀 Massive six over deep mid-wicket!",
    "💥 OUT! Caught behind by the keeper!",
    "🎯 Dot ball! Superb line and length.",
    "🤝 Single to square leg, rotate.",
    "🌟 Amazing catch at covers! Diving effort!",
    "🔥 Full toss — cracked through the covers!",
    "🧤 Run out! Brilliant throw from mid-on!",
    "↩️ LBW! Plumb in front of middle stump.",
    "✨ Flicked off his pads for a boundary!",
  ];

  const addBall = (outcome:string) => {
    setBallLog(b=>[...b, outcome]);
    const runs = outcome==="4"?4:outcome==="6"?6:(outcome==="W"||outcome==="."||outcome==="WD"||outcome==="NB")?0:parseInt(outcome)||0;
    setScore(s=>{
      const nb=s.balls+1;
      return { runs:s.runs+runs, wickets:outcome==="W"?s.wickets+1:s.wickets, overs:nb===6?s.overs+1:s.overs, balls:nb===6?0:nb };
    });
    if(runs>0) setStriker(s=>({...s,runs:s.runs+runs,balls:s.balls+1,fours:outcome==="4"?s.fours+1:s.fours,sixes:outcome==="6"?s.sixes+1:s.sixes}));
    const msg =
      outcome==="W"   ? `${score.overs}.${score.balls+1} — 💥 WICKET! Player dismissed!` :
      outcome==="6"   ? `${score.overs}.${score.balls+1} — 🚀 SIX! Ball disappears into the stands!` :
      outcome==="4"   ? `${score.overs}.${score.balls+1} — 🏏 FOUR! Racing to the boundary!` :
      outcome==="."   ? `${score.overs}.${score.balls+1} — Dot ball, well bowled.` :
      outcome==="WD"  ? `${score.overs}.${score.balls+1} — Wide ball signaled by umpire.` :
      outcome==="NB"  ? `${score.overs}.${score.balls+1} — No ball called! Free hit next.` :
                        `${score.overs}.${score.balls+1} — ${outcome} run(s) taken.`;
    setCommentary(c=>[msg,...c].slice(0,20));
  };

  const addCustomCommentary = (text:string) => {
    if(!text.trim()) return;
    const msg = `${score.overs}.${score.balls} — ${text.trim()}`;
    setCommentary(c=>[msg,...c].slice(0,20));
    setCustomNote("");
  };

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:"18px 20px" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Match Header */}
      <div style={{ ...card, borderColor:"#EF444440", background:"linear-gradient(135deg,#0D1526,#1A0808)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#EF444420", padding:"4px 12px", borderRadius:20, border:"1px solid #EF444430" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#EF4444", boxShadow:"0 0 6px #EF4444" }}/>
            <span style={{ fontSize:11, fontWeight:800, color:"#EF4444", letterSpacing:.5 }}>LIVE</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:900, color:"#E2E8F0" }}>Mumbai Mavericks <span style={{ color:"#FF6B00" }}>vs</span> Kolkata Tigers</div>
            <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>📍 Wankhede, Mumbai · Match 12 of 64 · BCPL T20 Season 5</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:36, fontWeight:900, color:"#FF6B00" }}>{score.runs}/{score.wickets}</div>
            <div style={{ fontSize:14, color:"#94A3B8", fontWeight:600 }}>{score.overs}.{score.balls} Overs</div>
          </div>
        </div>
        {/* Ball log */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:14 }}>
          {ballLog.slice(-12).map((b,i)=>(
            <div key={i} style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, background:b==="6"?"#10B98130":b==="4"?"#3B82F630":b==="W"?"#EF444430":"#1E293B", color:b==="6"?"#10B981":b==="4"?"#3B82F6":b==="W"?"#EF4444":"#94A3B8" }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Batting + Bowling */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={card}>
          <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", letterSpacing:.5, marginBottom:14, textTransform:"uppercase" }}>Batting</div>
          {[striker, nonStriker].map((bat,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", padding:"10px 0", borderBottom:i===0?"1px solid #0F172A":"none" }}>
              {i===0&&<span style={{ fontSize:10, color:"#FF6B00", marginRight:8, fontWeight:800 }}>*</span>}
              {i===1&&<span style={{ fontSize:10, color:"transparent", marginRight:8 }}>*</span>}
              <span style={{ flex:1, fontSize:13, color:"#E2E8F0", fontWeight:i===0?700:500 }}>{bat.name}</span>
              <span style={{ fontSize:16, fontWeight:900, color:i===0?"#FF6B00":"#E2E8F0" }}>{bat.runs}</span>
              <span style={{ fontSize:11, color:"#475569", marginLeft:4 }}>({bat.balls})</span>
              <div style={{ display:"flex", gap:8, marginLeft:14 }}>
                <span style={{ fontSize:11, color:"#3B82F6" }}>4s:{bat.fours}</span>
                <span style={{ fontSize:11, color:"#10B981" }}>6s:{bat.sixes}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", letterSpacing:.5, marginBottom:14, textTransform:"uppercase" }}>Current Bowler</div>
          <div style={{ display:"flex", alignItems:"center", padding:"10px 0" }}>
            <span style={{ flex:1, fontSize:13, color:"#E2E8F0", fontWeight:700 }}>{bowler.name}</span>
            <div style={{ display:"flex", gap:16 }}>
              {[{v:bowler.wickets,l:"W",c:"#EF4444"},{v:bowler.runs,l:"R",c:"#E2E8F0"},{v:bowler.overs,l:"Ov",c:"#F59E0B"},{v:bowler.economy,l:"Eco",c:"#64748B"}].map(s=>(
                <div key={s.l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Pad + Commentary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {/* Scoring Pad */}
        <div style={card}>
          <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", letterSpacing:.5, marginBottom:16, textTransform:"uppercase" }}>Scoring Pad</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              {label:"0",  color:"#1E293B",     textColor:"#94A3B8"},
              {label:"1",  color:"#1E3A5F",     textColor:"#3B82F6"},
              {label:"2",  color:"#1E3A5F",     textColor:"#3B82F6"},
              {label:"3",  color:"#1E3A5F",     textColor:"#3B82F6"},
              {label:"4",  color:"#1E3A5F40",   textColor:"#3B82F6"},
              {label:"6",  color:"#10B98120",   textColor:"#10B981"},
              {label:"W",  color:"#EF444420",   textColor:"#EF4444"},
              {label:".",  color:"#1E293B",     textColor:"#64748B"},
              {label:"WD", color:"#F59E0B20",   textColor:"#F59E0B"},
              {label:"NB", color:"#F59E0B20",   textColor:"#F59E0B"},
              {label:"LB", color:"#8B5CF620",   textColor:"#8B5CF6"},
              {label:"B",  color:"#8B5CF620",   textColor:"#8B5CF6"},
            ].map(btn=>(
              <button key={btn.label} onClick={()=>addBall(btn.label)} style={{ padding:"15px 6px", borderRadius:10, border:`1px solid ${btn.textColor}30`, background:btn.color, color:btn.textColor, fontSize:16, fontWeight:900, cursor:"pointer", transition:"transform 0.08s, opacity 0.08s" }}
                onMouseDown={e=>{ e.currentTarget.style.transform="scale(0.92)"; e.currentTarget.style.opacity="0.7"; }}
                onMouseUp={e=>{   e.currentTarget.style.transform="scale(1)";    e.currentTarget.style.opacity="1"; }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Commentary Panel */}
        <div style={card}>
          <div style={{ fontSize:11, fontWeight:800, color:"#94A3B8", letterSpacing:.5, marginBottom:12, textTransform:"uppercase" }}>Ball-by-Ball Commentary</div>

          {/* Quick comment buttons */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {QUICK_COMMENTS.slice(0,6).map((q,i)=>(
              <button key={i} onClick={()=>addCustomCommentary(q)} style={{ padding:"4px 10px", borderRadius:20, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Custom commentary input */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <textarea ref={commentRef} value={customNote} onChange={e=>setCustomNote(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); addCustomCommentary(customNote); }}}
              placeholder="Type custom commentary... (Enter to add)"
              rows={2}
              style={{ flex:1, padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:12, outline:"none", resize:"none", lineHeight:1.5, fontFamily:"inherit" }}/>
            <button onClick={()=>addCustomCommentary(customNote)} style={{ padding:"0 14px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:20, cursor:"pointer", fontWeight:700 }}>→</button>
          </div>

          {/* Commentary feed */}
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:200, overflowY:"auto" }}>
            {commentary.map((c,i)=>(
              <div key={i} style={{ padding:"8px 11px", background:i===0?"#FF6B0008":"#080E1C", border:`1px solid ${i===0?"#FF6B0030":"#0F172A"}`, borderRadius:8, fontSize:11, color:i===0?"#E2E8F0":"#64748B", lineHeight:1.5 }}>{c}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
