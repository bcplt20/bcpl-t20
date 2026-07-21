import { useState, useEffect } from "react";
import { getMatches, createMatch, recordToss, setPlayingXI, recordBall } from "../../lib/api";

/* ─── Types ─────────────────────────────────────────── */
type Role = "BAT"|"BOWL"|"AR"|"WK";
interface Player { id:number; name:string; role:Role; }
interface BatScore { name:string; runs:number; balls:number; fours:number; sixes:number; dismissal:string; batting:boolean; }
interface BowlScore { name:string; overs:number; balls:number; runs:number; wickets:number; wides:number; noBalls:number; }
interface Fow { wicket:number; batsman:string; runs:number; overStr:string; }
interface Partnership { bat1:string; bat2:string; runs:number; balls:number; }
interface OverBalls { over:number; runs:number; wickets:number; deliveries:string[]; }
interface InningsState {
  battingTeam:string; bowlingTeam:string;
  battingXI:string[]; bowlingXI:string[];
  batScores:BatScore[]; bowlScores:BowlScore[];
  totalRuns:number; totalWickets:number; overs:number; balls:number; extras:number;
  currentOverDeliveries:string[]; overHistory:OverBalls[];
  partnerships:Partnership[]; fowList:Fow[];
  strikerIdx:number; nonStrikerIdx:number; bowlerIdx:number;
  target?:number;
}
interface MatchDef { id:number; dbId?:string; matchNo:number; team1:string; team2:string; venue:string; date:string; status:"scheduled"|"live"|"completed"; }
interface LiveMatch {
  def:MatchDef;
  tossWinner:string; tossDec:"bat"|"field";
  xi1:string[]; xi2:string[];
  currentInnings:1|2; inn1:InningsState; inn2:InningsState|null;
  phase:"toss"|"xi"|"live"|"completed";
}
interface DismissalModal {
  type:"b"|"c"|"lbw"|"ro"|"st"|"hw"|"cb"|"rh";
  fielder:string; nonStrikerOut:boolean; newBatsmanIdx:number;
}

/* ─── Squad data ─────────────────────────────────────── */
type RawSquad = [string, Role][];
const RAW: Record<string,RawSquad> = {
  "Mumbai Mavericks":   [["Arjun Sharma","BAT"],["Rahul Patel","BAT"],["Dev Mehta","BAT"],["Karan Joshi","AR"],["Saurav Roy","BAT"],["Nikhil Das","WK"],["Pranav Singh","AR"],["Vikram Nair","BOWL"],["Ajay Kumar","BOWL"],["Suresh Rao","BOWL"],["Manish Tiwari","BOWL"],["Rohit Kumar","BAT"],["Aakash Verma","BAT"],["Deepak Mishra","AR"],["Harish Reddy","BOWL"]],
  "Kolkata Tigers":     [["Rahul Kapoor","BAT"],["Suresh Verma","BAT"],["Deepak Nair","BAT"],["Ankit Rao","AR"],["Vikash Tiwari","BAT"],["Sachin Dubey","WK"],["Ravi Patil","AR"],["Mohit Kumar","BOWL"],["Tarun Das","BOWL"],["Harish Pillai","BOWL"],["Ganesh Mishra","BOWL"],["Sanjay Gupta","BAT"],["Vivek Chauhan","AR"],["Nitin Shah","BOWL"],["Pankaj Yadav","BAT"]],
  "Rajasthan Scorchers":[["Priya Singh","BAT"],["Rajesh Kumar","AR"],["Mukesh Vyas","WK"],["Narayan Das","BAT"],["Sandeep Bishnoi","BOWL"],["Pawan Shekhawat","BOWL"],["Dushyant Sharma","BOWL"],["Kuldeep Rathore","BAT"],["Lalit Garg","AR"],["Rahul Jhajharia","BOWL"],["Bhuvnesh Choudhary","BOWL"],["Manohar Lal","BAT"],["Rakesh Poonia","AR"],["Suraj Mandawat","BAT"],["Arun Shekhawat","BAT"]],
  "Punjab Warriors":    [["Vikas Singh","BOWL"],["Manpreet Grewal","BAT"],["Gurjit Sidhu","WK"],["Karanveer Brar","BAT"],["Simranjit Mann","BOWL"],["Harjinder Dhaliwal","BOWL"],["Ravinder Dhindsa","BAT"],["Sukhjit Toor","AR"],["Jasvinder Bajwa","BOWL"],["Amanpreet Gill","BAT"],["Prabhjot Randhawa","BOWL"],["Deepinder Sohal","BAT"],["Bhupinder Panesar","AR"],["Gurwinder Sodhi","BAT"],["Navjot Cheema","AR"]],
  "Lucknow Nawabs":     [["Rahul Mishra","BAT"],["Abhishek Dubey","BAT"],["Aditya Pandey","AR"],["Ranveer Yadav","WK"],["Subhash Tiwari","BOWL"],["Ashish Verma","BAT"],["Saurabh Singh","BOWL"],["Vivek Kushwaha","BOWL"],["Prashant Ojha Jr","AR"],["Shivam Yadav","BAT"],["Durgesh Chaudhary","BOWL"],["Mohit Srivastava","BAT"],["Akash Tripathi","AR"],["Divyanshu Vatsal","BAT"],["Piyush Jha","BOWL"]],
  "Hyderabad Hawks":    [["Anil Reddy","BAT"],["Ravi Teja","AR"],["Suresh Babu","WK"],["Prasad Rao","BOWL"],["Venkaiah Naidu Jr","BAT"],["Srinivas Goud","BOWL"],["Ramaiah Das","BOWL"],["Kishan Rao","BAT"],["Nagendra Rao","AR"],["Purna Chandra","BOWL"],["Vamsi Krishna","BAT"],["Eshwar Prasad","BOWL"],["Raju Varma","BAT"],["Laxman Reddy","AR"],["Gopal Krishna","BAT"]],
  "Delhi Suryas":       [["Deepak Gupta","BAT"],["Mohit Dagar","BOWL"],["Sanjay Dahiya","AR"],["Rahul Hooda Jr","BAT"],["Himanshu Singhal","WK"],["Ajay Jadeja Jr","AR"],["Vikas Yadav","BOWL"],["Pradeep Sangwan Jr","BOWL"],["Akash Goyal","BAT"],["Sanjeev Tomar","BOWL"],["Ravi Shankar","BAT"],["Kuldeep Arya","AR"],["Harshit Malik","BOWL"],["Nikhil Bansal","BAT"],["Gaurav Mahajan","BAT"]],
  "Chennai Thalaivas":  [["Kartik Rajan","BAT"],["Muthu Krishnan","BOWL"],["Siva Subramanian","WK"],["Arun Pandian","AR"],["Ganesan Pillai","BAT"],["Vetrivel Murugan","BOWL"],["Arumugam Das","BOWL"],["Kalidasan Raja","BAT"],["Suresh Murugesan","AR"],["Dinesh Kanthan","BOWL"],["Palaniswamy Velu","BAT"],["Rajesh Annamalai","BOWL"],["Balamurugan Sekar","BAT"],["Thandavan Mani","AR"],["Chellapan Rajan","BAT"]],
  "Ahmedabad Lions":    [["Vikas Patel","BAT"],["Jignesh Shah","AR"],["Chirag Solanki","WK"],["Mehul Raval","BAT"],["Rakesh Pandya","BOWL"],["Ketan Brahmbhatt","BAT"],["Saurabh Chauhan","BOWL"],["Haresh Mistry","BOWL"],["Dhruv Trivedi","BAT"],["Niral Bhatt","AR"],["Rajesh Desai","BOWL"],["Pratik Jadeja","BAT"],["Kiran Thakkar","BOWL"],["Umesh Modi","AR"],["Bharatbhai Patel","BAT"]],
  "Bengaluru Rockets":  [["Kiran Kumar","BAT"],["Raghavendra Rao","BOWL"],["Prasanna Kumar","WK"],["Narayan Swamy","AR"],["Jayaram Shetty","BAT"],["Chandan Gowda","BOWL"],["Mahesh Hegde","BOWL"],["Sunil Naik","BAT"],["Aditya Kamath","AR"],["Vinod Shetty","BOWL"],["Govinda Rao","BAT"],["Manjunath Patil","BOWL"],["Madhu Swamy","BAT"],["Nagaraj Bhat","AR"],["Lokesh Reddy","BAT"]],
};
const SQUADS: Record<string,Player[]> = Object.fromEntries(
  Object.entries(RAW).map(([t,raw])=>[t, raw.map((r,i)=>({id:i+1, name:r[0], role:r[1]}))])
);
const TEAM_COLORS: Record<string,string> = {
  "Mumbai Mavericks":"#3B82F6","Kolkata Tigers":"#F97316","Rajasthan Scorchers":"#E97B6B",
  "Punjab Warriors":"#DC2626","Lucknow Nawabs":"#F59E0B","Hyderabad Hawks":"#16A34A",
  "Delhi Suryas":"#6366F1","Chennai Thalaivas":"#2563EB","Ahmedabad Lions":"#B91C1C","Bengaluru Rockets":"#EF4444",
};
const ALL_TEAMS = Object.keys(RAW);
const VENUES = ["Wankhede, Mumbai","SMS Stadium, Jaipur","PCA, Mohali","Ekana, Lucknow","Eden Gardens, Kolkata","Chinnaswamy, Bengaluru","Rajiv Gandhi, Hyderabad","Chepauk, Chennai","Narendra Modi, Ahmedabad","Feroz Shah Kotla, Delhi"];

/* ─── Initial matches — empty until matches are scheduled via Matches panel ── */
const INIT_MATCHES: MatchDef[] = [];

/* ─── Helpers ────────────────────────────────────────── */
const fmtO = (o:number, b:number) => `${o}.${b}`;
const crr  = (r:number, o:number, b:number) => { const d=o+b/6; return d===0?"0.00":(r/d).toFixed(2); };
const rrr  = (tgt:number, r:number, o:number, b:number) => { const rem=20-(o+b/6); if(rem<=0)return"0.00"; return ((tgt-r)/rem).toFixed(2); };

const makeInnings = (battingTeam:string, bowlingTeam:string, xi1:string[], xi2:string[], target?:number): InningsState => {
  const batXI = battingTeam === xi1[0]?.split("·")[0] ? xi1 : xi2; // simplified: use passed order
  return {
    battingTeam, bowlingTeam,
    battingXI: xi1, bowlingXI: xi2,
    batScores: xi1.map(n=>({ name:n, runs:0, balls:0, fours:0, sixes:0, dismissal:"", batting:false })),
    bowlScores: xi2.map(n=>({ name:n, overs:0, balls:0, runs:0, wickets:0, wides:0, noBalls:0 })),
    totalRuns:0, totalWickets:0, overs:0, balls:0, extras:0,
    currentOverDeliveries:[], overHistory:[], partnerships:[], fowList:[],
    strikerIdx:0, nonStrikerIdx:1, bowlerIdx:0, target,
  };
};

const getDisStr = (type:string, fielder:string, bowler:string, nonStrikerOut:boolean):string => {
  if(type==="b")  return `b ${bowler}`;
  if(type==="c")  return `c ${fielder} b ${bowler}`;
  if(type==="lbw")return `lbw b ${bowler}`;
  if(type==="ro") return `run out (${fielder})`;
  if(type==="st") return `st ${fielder} b ${bowler}`;
  if(type==="hw") return `hit wicket b ${bowler}`;
  if(type==="cb") return `c & b ${bowler}`;
  if(type==="rh") return `retired hurt`;
  return "dismissed";
};

/* ─── Styles ─────────────────────────────────────────── */
const CARD: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
const TAB  = (a:boolean): React.CSSProperties => ({ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:a?"linear-gradient(135deg,#FF6B00,#FF8C40)":"transparent", color:a?"#fff":"#64748B" });
const PILL = (c:string): React.CSSProperties => ({ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 10px", borderRadius:20, background:`${c}20`, border:`1px solid ${c}40`, fontSize:10, fontWeight:700, color:c });

/* ══════════════════════════════════════════════════════ */
export default function LiveScoringView() {
  const [matches,    setMatches]    = useState<MatchDef[]>(INIT_MATCHES);
  const [live,       setLive]       = useState<LiveMatch|null>(null);
  const [currentDbId, setCurrentDbId] = useState<string|null>(null);

  // Fetch matches from API on mount — merge with local list
  useEffect(()=>{
    getMatches(5).then(res=>{
        const apiMatches: MatchDef[] = res.matches.map((m:any, i:number)=>({
          id: -(i+1), // negative IDs for DB-sourced matches to avoid collision
          dbId: m.id,
          matchNo: m.match_no,
          team1: m.team1, team2: m.team2,
          venue: m.venue,
          date: m.scheduled_at ? new Date(m.scheduled_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "TBD",
          status: (m.status==="live"||m.status==="innings2") ? "live" : m.status==="completed"||m.status==="abandoned" ? "completed" : "scheduled",
        }));
        // Merge: DB matches first, then hardcoded ones not already in DB
        setMatches(apiMatches.length>0 ? apiMatches : INIT_MATCHES);
      }).catch(()=>{}); // silently fall back to INIT_MATCHES
  },[]);
  const [mainTab,    setMainTab]    = useState<"live"|"scorecard">("live");
  const [scTab,      setScTab]      = useState<"bat1"|"bowl1"|"bat2"|"bowl2">("bat1");
  const [commentary, setCommentary] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [dm,         setDm]         = useState<DismissalModal|null>(null); // dismissal modal

  // Add match form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ team1:ALL_TEAMS[0], team2:ALL_TEAMS[1], venue:VENUES[0], date:"" });

  /* ── XI selection temp state ── */
  const [xi1sel, setXi1sel] = useState<string[]>([]);
  const [xi2sel, setXi2sel] = useState<string[]>([]);

  /* ── Start a match (open toss screen) ── */
  const openMatch = (m:MatchDef) => {
    if(m.status==="completed") return;
    setCurrentDbId(m.dbId||null);
    setLive({ def:m, tossWinner:m.team1, tossDec:"bat", xi1:[], xi2:[], currentInnings:1, inn1:null as any, inn2:null, phase:"toss" });
    setXi1sel([]); setXi2sel([]);
    setCommentary([]);
    setMainTab("live");
  };

  /* ── Confirm toss → go to XI selection ── */
  const confirmToss = () => {
    if(!live) return;
    setLive(l=>l?{...l, phase:"xi"}:l);
    if(currentDbId){
      recordToss(currentDbId,{ tossWinner:live.tossWinner, tossDecision:live.tossDec }).catch(console.error);
    }
  };

  /* ── Confirm XI → start innings ── */
  const confirmXI = () => {
    if(!live || xi1sel.length!==11 || xi2sel.length!==11) return;
    const bat = live.tossDec==="bat" ? live.def.team1 : live.def.team2;
    const bowl= bat===live.def.team1 ? live.def.team2 : live.def.team1;
    const batXI = bat===live.def.team1 ? xi1sel : xi2sel;
    const bowlXI= bat===live.def.team1 ? xi2sel : xi1sel;
    const inn1  = makeInnings(bat, bowl, batXI, bowlXI);
    inn1.batScores[0].batting = true;
    inn1.batScores[1].batting = true;
    setLive(l=>l?{...l, xi1:xi1sel, xi2:xi2sel, inn1, currentInnings:1, phase:"live"}:l);
    setMatches(ms=>ms.map(m=>m.id===live.def.id?{...m,status:"live"}:m));
    // Persist to API
    if(currentDbId){
      const squad1 = SQUADS[live.def.team1]||[];
      const squad2 = SQUADS[live.def.team2]||[];
      setPlayingXI(currentDbId,{
        xi1: xi1sel.map(n=>({ name:n, role:squad1.find(p=>p.name===n)?.role||"BAT" })),
        xi2: xi2sel.map(n=>({ name:n, role:squad2.find(p=>p.name===n)?.role||"BAT" })),
        battingTeam: bat,
      }).catch(console.error);
    }
  };

  /* ── Current innings helper ── */
  const inn = live ? (live.currentInnings===1 ? live.inn1 : live.inn2) : null;

  /* ── Ball outcome ── */
  const addBall = (outcome:string) => {
    if(!live || !inn) return;
    if(outcome==="W") { setDm({ type:"b", fielder:"", nonStrikerOut:false, newBatsmanIdx:-1 }); return; }

    const isWide = outcome==="WD";
    const isNB   = outcome==="NB";
    const isExtra= isWide||isNB;
    const runs   = outcome==="4"?4:outcome==="6"?6:(outcome==="."||isExtra)?0:parseInt(outcome)||0;

    applyBall({ outcome, runs, isExtra, isWide, isNB, isWicket:false, dismissal:"" });
  };

  const DIS_TYPE_MAP: Record<string,string> = {
    "b":"bowled","c":"caught","lbw":"lbw","ro":"run_out",
    "st":"stumped","hw":"hit_wicket","cb":"caught_and_bowled","rh":"retired_hurt",
  };

  const applyBall = ({ outcome, runs, isExtra, isWide, isNB, isWicket, dismissal, nonStrikerOut=false, dismissalTypeKey, fielderName, dismissedBatter }:
    { outcome:string; runs:number; isExtra:boolean; isWide:boolean; isNB:boolean; isWicket:boolean; dismissal:string; nonStrikerOut?:boolean; dismissalTypeKey?:string; fielderName?:string; dismissedBatter?:string; }) => {
    if(!live || !inn) return;

    // Fire-and-forget API persistence
    if(currentDbId){
      const striker  = inn.batScores[inn.strikerIdx]?.name  || "";
      const bowler   = inn.bowlScores[inn.bowlerIdx]?.name  || "";
      const apiOutcome = isWide?"WD":isNB?"NB":outcome==="."?"0":outcome;
      recordBall(currentDbId,{
        outcome: apiOutcome,
        batterName: striker, bowlerName: bowler,
        dismissalType: dismissalTypeKey ? DIS_TYPE_MAP[dismissalTypeKey] : undefined,
        dismissedBatter: dismissedBatter||undefined,
        fielderName: fielderName||undefined,
        nonStrikerOut,
      }).catch(console.error);
    }

    setLive(prev=>{
      if(!prev) return prev;
      const curInns = prev.currentInnings===1 ? prev.inn1 : prev.inn2!;
      if(!curInns) return prev;

      const newBalls    = isExtra ? curInns.balls : curInns.balls+1;
      const overDone    = !isExtra && newBalls===6;
      const newOvers    = overDone ? curInns.overs+1 : curInns.overs;
      const finalBalls  = overDone ? 0 : newBalls;

      // Batting update
      const newBatScores = curInns.batScores.map((b,i)=>{
        if(i===curInns.strikerIdx && !isExtra){
          return { ...b, runs:b.runs+runs, balls:b.balls+1,
            fours:outcome==="4"?b.fours+1:b.fours, sixes:outcome==="6"?b.sixes+1:b.sixes,
            dismissal:isWicket&&!nonStrikerOut?dismissal:b.dismissal,
            batting:!(isWicket&&!nonStrikerOut) };
        }
        if(i===curInns.nonStrikerIdx && isWicket && nonStrikerOut){
          return { ...b, dismissal, batting:false };
        }
        return b;
      });

      // Bowling update
      const newBowlScores = curInns.bowlScores.map((b,i)=>{
        if(i!==curInns.bowlerIdx) return b;
        const nb2 = isExtra ? b.balls : b.balls+1;
        const oc  = !isExtra && nb2===6;
        return { ...b, runs:b.runs+runs+(isExtra?1:0), wickets:isWicket?b.wickets+1:b.wickets,
          balls:oc?0:nb2, overs:oc?b.overs+1:b.overs,
          wides:isWide?b.wides+1:b.wides, noBalls:isNB?b.noBalls+1:b.noBalls };
      });

      // Partnerships
      const newPart = [...curInns.partnerships];
      if(newPart.length) {
        const last = newPart[newPart.length-1];
        newPart[newPart.length-1] = { ...last, runs:last.runs+runs, balls:isExtra?last.balls:last.balls+1 };
      }

      // Fall of wicket
      let newFow = [...curInns.fowList];
      if(isWicket){
        const outIdx = nonStrikerOut ? curInns.nonStrikerIdx : curInns.strikerIdx;
        newFow.push({ wicket:curInns.totalWickets+1, batsman:curInns.batScores[outIdx].name,
          runs:curInns.totalRuns+runs, overStr:fmtO(curInns.overs, curInns.balls) });
      }

      // Current over deliveries
      let newCurOver = isExtra ? curInns.currentOverDeliveries : [...curInns.currentOverDeliveries, isWicket?"W":outcome];

      // Over history
      let newOverHistory = [...curInns.overHistory];
      if(overDone) {
        newOverHistory.push({ over:curInns.overs+1, runs:newCurOver.reduce((s,d)=>s+(d==="W"?0:d==="4"?4:d==="6"?6:parseInt(d)||0),0), wickets:isWicket?1:0, deliveries:newCurOver });
        newCurOver=[];
      }

      // Strike rotation
      let newStriker = curInns.strikerIdx;
      let newNonStriker = curInns.nonStrikerIdx;
      const oddRuns = runs % 2 === 1;
      if(overDone) { const tmp=newStriker; newStriker=newNonStriker; newNonStriker=tmp; }
      else if(oddRuns) { const tmp=newStriker; newStriker=newNonStriker; newNonStriker=tmp; }

      const newTotalWickets = curInns.totalWickets + (isWicket?1:0);
      const innComplete = newTotalWickets>=10 || newOvers>=20;

      const updatedInns: InningsState = {
        ...curInns,
        batScores:newBatScores, bowlScores:newBowlScores,
        totalRuns:curInns.totalRuns+runs+(isExtra?1:0),
        totalWickets:newTotalWickets,
        overs:newOvers, balls:finalBalls,
        extras:curInns.extras+(isExtra?1:0),
        currentOverDeliveries:newCurOver,
        overHistory:newOverHistory,
        partnerships:newPart, fowList:newFow,
        strikerIdx:newStriker, nonStrikerIdx:newNonStriker,
      };

      if(prev.currentInnings===1){
        if(innComplete){
          const inn2 = makeInnings(prev.def.team2===updatedInns.battingTeam?prev.def.team1:prev.def.team2,
            updatedInns.battingTeam,
            prev.def.team1===updatedInns.battingTeam?prev.xi2:prev.xi1,
            prev.def.team1===updatedInns.battingTeam?prev.xi1:prev.xi2,
            updatedInns.totalRuns+1);
          inn2.batScores[0].batting=true; inn2.batScores[1].batting=true;
          return { ...prev, inn1:updatedInns, inn2, currentInnings:2 };
        }
        return { ...prev, inn1:updatedInns };
      } else {
        if(innComplete) return { ...prev, inn2:updatedInns, phase:"completed" };
        return { ...prev, inn2:updatedInns };
      }
    });

    // Commentary
    const o=inn.overs, b=inn.balls+(isExtra?0:1);
    const msg=
      outcome==="6" ? `${o}.${b} — 🚀 SIX! Ball disappears into the stands!` :
      outcome==="4" ? `${o}.${b} — 🏏 FOUR! Racing to the boundary!` :
      outcome==="." ? `${o}.${b} — 🎯 Dot ball. Tight bowling.` :
      outcome==="WD"? `${o}.${b} — Wide ball signalled. +1 extra.` :
      outcome==="NB"? `${o}.${b} — ⚠️ No ball! Free hit next. +1 extra.` :
      outcome==="LB"? `${o}.${b} — Leg bye, 1 extra.` :
      outcome==="B" ? `${o}.${b} — Bye, 1 extra.` :
                      `${o}.${b} — ${outcome} run(s) taken.`;
    setCommentary(c=>[msg,...c].slice(0,30));
  };

  /* ── Confirm dismissal ── */
  const confirmDismissal = () => {
    if(!live||!inn||!dm||dm.newBatsmanIdx===-1) return;
    const bowler  = inn.bowlScores[inn.bowlerIdx]?.name||"";
    const keeper  = inn.bowlingXI.find(n=>{ const sq=SQUADS[inn.bowlingTeam]||[]; return sq.find(p=>p.name===n&&p.role==="WK"); })||bowler;
    const disStr  = getDisStr(dm.type, dm.fielder||keeper, bowler, dm.nonStrikerOut);
    const outIdx  = dm.nonStrikerOut ? inn.nonStrikerIdx : inn.strikerIdx;
    const outName = inn.batScores[outIdx]?.name||"";
    const fielder = dm.fielder || (["c","st","ro"].includes(dm.type)?keeper:"");

    // Apply dismissal then ball
    setLive(prev=>{
      if(!prev) return prev;
      const curInns = prev.currentInnings===1?prev.inn1:prev.inn2!;
      if(!curInns) return prev;
      const newBatScores = curInns.batScores.map((b,i)=>{
        if(i===outIdx) return {...b, dismissal:disStr, batting:false};
        if(i===dm.newBatsmanIdx) return {...b, batting:true};
        return b;
      });
      // New partnership
      const newStriker = dm.nonStrikerOut ? dm.newBatsmanIdx : curInns.strikerIdx;
      const newNonStr  = dm.nonStrikerOut ? curInns.strikerIdx : dm.newBatsmanIdx;
      const newPart    = [...curInns.partnerships, { bat1:curInns.batScores[newStriker]?.name||"", bat2:curInns.batScores[newNonStr]?.name||"", runs:0, balls:0 }];

      const updatedInns = {...curInns, batScores:newBatScores, strikerIdx:newStriker, nonStrikerIdx:newNonStr,
        totalWickets:curInns.totalWickets+1, partnerships:newPart };
      if(prev.currentInnings===1) return {...prev, inn1:updatedInns};
      return {...prev, inn2:updatedInns};
    });

    setCommentary(c=>[`${inn.overs}.${inn.balls} — 💥 WICKET! ${outName} ${disStr}.`,...c].slice(0,30));
    setDm(null);

    // Process the ball — pass dismissal info for API persistence
    applyBall({ outcome:"W", runs:0, isExtra:false, isWide:false, isNB:false, isWicket:true, dismissal:disStr, nonStrikerOut:dm.nonStrikerOut, dismissalTypeKey:dm.type, fielderName:fielder, dismissedBatter:outName });
  };

  /* ═══════════════════════════════ RENDER ═════════════ */

  /* ── Match List ─────────────────────────────────────── */
  if(!live) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Live Scoring</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Select a match to start or manage scoring</div>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Match</button>
      </div>

      {/* Add Match modal */}
      {showAdd&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ ...CARD, width:420, padding:28 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Schedule New Match</div>
            {([["Team 1","team1"],["Team 2","team2"]] as const).map(([lbl,key])=>(
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>{lbl}</div>
                <select value={addForm[key]} onChange={e=>setAddForm(f=>({...f,[key]:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                  {ALL_TEAMS.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>Venue</div>
              <select value={addForm.venue} onChange={e=>setAddForm(f=>({...f,venue:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                {VENUES.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>Date & Time</div>
              <input type="datetime-local" value={addForm.date} onChange={e=>setAddForm(f=>({...f,date:e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, padding:11, borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", cursor:"pointer" }}>Cancel</button>
              <button onClick={async ()=>{
                const localId = Date.now();
                const newMatch:MatchDef = { id:localId, matchNo:matches.length+1, team1:addForm.team1, team2:addForm.team2, venue:addForm.venue, date:addForm.date||"TBD", status:"scheduled" };
                setMatches(m=>[...m, newMatch]); setShowAdd(false);
                try {
                  const res = await createMatch({ matchNo:matches.length+1, team1:addForm.team1, team2:addForm.team2, venue:addForm.venue, scheduledAt:addForm.date||undefined });
                  setMatches(ms=>ms.map(m=>m.id===localId?{...m, dbId:res.match.id}:m));
                } catch(e){ console.error("Save match failed:",e); }
              }} style={{ flex:1, padding:11, borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer" }}>Schedule →</button>
            </div>
          </div>
        </div>
      )}

      {/* Match cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { label:"🔴 Live", items:matches.filter(m=>m.status==="live"), color:"#EF4444" },
          { label:"📅 Upcoming", items:matches.filter(m=>m.status==="scheduled"), color:"#3B82F6" },
          { label:"✅ Completed", items:matches.filter(m=>m.status==="completed"), color:"#10B981" },
        ].map(group=>group.items.length>0&&(
          <div key={group.label}>
            <div style={{ fontSize:11, fontWeight:800, color:group.color, letterSpacing:.5, textTransform:"uppercase", marginBottom:8 }}>{group.label}</div>
            {group.items.map(m=>(
              <div key={m.id} style={{ ...CARD, marginBottom:8, cursor:m.status!=="completed"?"pointer":"default", borderColor:m.status==="live"?"rgba(239,68,68,.3)":"#1E293B", transition:"transform .15s,border-color .15s", position:"relative", overflow:"hidden" }}
                onClick={()=>openMatch(m)}
                onMouseEnter={e=>{ if(m.status!=="completed"){ (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor=group.color+"66"; }}}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.borderColor=m.status==="live"?"rgba(239,68,68,.3)":"#1E293B"; }}>
                {m.status==="live"&&<div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 60% at 50% 0%,rgba(239,68,68,.05),transparent)", pointerEvents:"none" }}/>}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={PILL(group.color)}>{m.status==="live"?"🔴 LIVE":m.status==="scheduled"?"📅 UPCOMING":"✅ RESULT"}</span>
                    <span style={{ fontSize:11, color:"#475569" }}>Match {m.matchNo} · BCPL T20 Season 5</span>
                  </div>
                  <span style={{ fontSize:11, color:"#475569" }}>📍 {m.venue} · {m.date}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color: TEAM_COLORS[m.team1]||"#E2E8F0" }}>{m.team1}</div>
                  </div>
                  <div style={{ padding:"6px 14px", background:"#060B18", borderRadius:8, fontWeight:900, fontSize:13, color:"rgba(255,255,255,.3)" }}>VS</div>
                  <div style={{ flex:1, textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:TEAM_COLORS[m.team2]||"#E2E8F0" }}>{m.team2}</div>
                  </div>
                </div>
                {m.status!=="completed"&&(
                  <div style={{ marginTop:12, textAlign:"center" }}>
                    <span style={{ fontSize:11, color:"#FF6B00", fontWeight:700 }}>
                      {m.status==="live"?"Click to continue scoring →":"Click to set up scoring →"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Toss Setup ─────────────────────────────────────── */
  if(live.phase==="toss") return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setLive(null)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← Back</button>
        <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>Match {live.def.matchNo} · Toss Setup</div>
      </div>
      <div style={{ ...CARD, maxWidth:520 }}>
        <div style={{ fontSize:20, fontWeight:900, color:"#FF6B00", textAlign:"center", marginBottom:6 }}>🪙 Toss</div>
        <div style={{ fontSize:13, color:"#64748B", textAlign:"center", marginBottom:24 }}>{live.def.team1} <span style={{ color:"#475569" }}>vs</span> {live.def.team2} · {live.def.venue}</div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:"#64748B", marginBottom:8, fontWeight:600 }}>TOSS WON BY</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[live.def.team1, live.def.team2].map(t=>(
              <button key={t} onClick={()=>setLive(l=>l?{...l,tossWinner:t}:l)}
                style={{ padding:"14px 12px", borderRadius:10, border:`2px solid ${live.tossWinner===t?TEAM_COLORS[t]||"#FF6B00":"#1E293B"}`, background:live.tossWinner===t?`${TEAM_COLORS[t]||"#FF6B00"}18`:"#060B18", color:live.tossWinner===t?(TEAM_COLORS[t]||"#FF6B00"):"#64748B", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:"#64748B", marginBottom:8, fontWeight:600 }}>ELECTED TO</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {(["bat","field"] as const).map(d=>(
              <button key={d} onClick={()=>setLive(l=>l?{...l,tossDec:d}:l)}
                style={{ padding:"14px 12px", borderRadius:10, border:`2px solid ${live.tossDec===d?"#FF6B00":"#1E293B"}`, background:live.tossDec===d?"#FF6B0018":"#060B18", color:live.tossDec===d?"#FF6B00":"#64748B", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                {d==="bat"?"🏏 Bat First":"🎳 Field First"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding:"12px 16px", background:"#FF6B0008", border:"1px solid #FF6B0020", borderRadius:10, marginBottom:20, textAlign:"center" }}>
          <span style={{ fontSize:13, color:"#FF7A29", fontWeight:700 }}>
            {live.tossWinner} won the toss and elected to {live.tossDec} first
          </span>
        </div>
        <button onClick={confirmToss} style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>
          Confirm Toss → Select Playing XI
        </button>
      </div>
    </div>
  );

  /* ── Playing XI Selection ────────────────────────────── */
  if(live.phase==="xi") {
    const bat = live.tossDec==="bat" ? live.def.team1 : live.def.team2;
    const bowl= bat===live.def.team1 ? live.def.team2 : live.def.team1;
    const renderXI = (team:string, sel:string[], setSel:React.Dispatch<React.SetStateAction<string[]>>) => (
      <div style={CARD}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEAM_COLORS[team]||"#E2E8F0" }}>{team}</div>
          <span style={{ fontSize:12, color:sel.length===11?"#10B981":"#F59E0B", fontWeight:700 }}>{sel.length}/11 selected</span>
        </div>
        {(SQUADS[team]||[]).map(p=>{
          const picked = sel.includes(p.name);
          const roleCol = p.role==="WK"?"#F59E0B":p.role==="BOWL"?"#EF4444":p.role==="AR"?"#10B981":"#3B82F6";
          return (
            <div key={p.id} onClick={()=>{ setSel(s=>picked?s.filter(n=>n!==p.name):s.length<11?[...s,p.name]:s); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, cursor:"pointer", marginBottom:4,
                background:picked?"#FF6B0012":"transparent", border:picked?"1px solid #FF6B0030":"1px solid transparent", transition:"all .15s" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:picked?"#FF6B00":"#1E293B", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0 }}>
                {picked&&<span style={{ color:"#fff", fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ flex:1, fontSize:12, color:picked?"#E2E8F0":"#94A3B8", fontWeight:picked?700:400 }}>{p.name}</span>
              <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:`${roleCol}20`, color:roleCol, fontWeight:700 }}>{p.role}</span>
            </div>
          );
        })}
      </div>
    );
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setLive(l=>l?{...l,phase:"toss"}:l)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← Back</button>
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>Select Playing XI</div>
          <span style={{ fontSize:11, color:"#64748B" }}>· {live.tossWinner} won toss · {bat} bat first</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {renderXI(live.def.team1, xi1sel, setXi1sel)}
          {renderXI(live.def.team2, xi2sel, setXi2sel)}
        </div>
        <button onClick={confirmXI} disabled={xi1sel.length!==11||xi2sel.length!==11}
          style={{ padding:14, borderRadius:10, border:"none", background:xi1sel.length===11&&xi2sel.length===11?"linear-gradient(135deg,#FF6B00,#FF8C40)":"#1E293B", color:xi1sel.length===11&&xi2sel.length===11?"#fff":"#475569", fontSize:14, fontWeight:800, cursor:xi1sel.length===11&&xi2sel.length===11?"pointer":"not-allowed" }}>
          {xi1sel.length===11&&xi2sel.length===11?"🏏 Start Match →":"Select 11 players from each team first"}
        </button>
      </div>
    );
  }

  /* ── Dismissal Modal ────────────────────────────────── */
  const renderDismissalModal = () => {
    if(!dm||!inn||!live) return null;
    const fieldingXI = inn.bowlingXI;
    const keeper = fieldingXI.find(n=>{ const sq=SQUADS[inn.bowlingTeam]||[]; return sq.find(p=>p.name===n&&p.role==="WK"); })||fieldingXI[0];
    const bowler = inn.bowlScores[inn.bowlerIdx]?.name||"";
    const remaining = inn.batScores.filter((_,i)=>i!==inn.strikerIdx&&i!==inn.nonStrikerIdx&&!inn.batScores[i].dismissal&&!inn.batScores[i].batting);
    const TYPES = [["b","Bowled"],["c","Caught"],["lbw","LBW"],["ro","Run Out"],["st","Stumped"],["hw","Hit Wicket"],["cb","Caught & Bowled"],["rh","Retired Hurt"]] as const;
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ ...CARD, width:"min(540px, 100%)", maxHeight:"90vh", overflowY:"auto" }}>
          <div style={{ fontSize:16, fontWeight:900, color:"#EF4444", marginBottom:4 }}>💥 Wicket!</div>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>
            {inn.batScores[inn.strikerIdx]?.name} — select dismissal details
          </div>

          {/* Dismissal type */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:8 }}>DISMISSAL TYPE</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {TYPES.map(([t,l])=>(
                <button key={t} onClick={()=>setDm(d=>d?{...d,type:t as any}:d)}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${dm.type===t?"#EF4444":"#1E293B"}`, background:dm.type===t?"#EF444420":"transparent", color:dm.type===t?"#EF4444":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Bowler (auto-shown for most types) */}
          {["b","c","lbw","st","hw","cb"].includes(dm.type)&&(
            <div style={{ marginBottom:14, padding:"10px 14px", background:"#1E293B20", borderRadius:8 }}>
              <span style={{ fontSize:11, color:"#64748B" }}>Bowler: </span>
              <span style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{bowler}</span>
            </div>
          )}

          {/* Fielder selector */}
          {dm.type==="c"&&(
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:6 }}>CAUGHT BY</div>
              <select value={dm.fielder} onChange={e=>setDm(d=>d?{...d,fielder:e.target.value}:d)}
                style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                <option value="">Select fielder…</option>
                {fieldingXI.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          {dm.type==="ro"&&(
            <>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:6 }}>THROWN BY (Fielder)</div>
                <select value={dm.fielder} onChange={e=>setDm(d=>d?{...d,fielder:e.target.value}:d)}
                  style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                  <option value="">Select fielder…</option>
                  {fieldingXI.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:6 }}>WHO WAS RUN OUT?</div>
                <div style={{ display:"flex", gap:8 }}>
                  {([false,true] as const).map(ns=>(
                    <button key={String(ns)} onClick={()=>setDm(d=>d?{...d,nonStrikerOut:ns}:d)}
                      style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${dm.nonStrikerOut===ns?"#F59E0B":"#1E293B"}`, background:dm.nonStrikerOut===ns?"#F59E0B20":"transparent", color:dm.nonStrikerOut===ns?"#F59E0B":"#64748B", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      {ns?`Non-striker (${inn.batScores[inn.nonStrikerIdx]?.name})`:`Striker (${inn.batScores[inn.strikerIdx]?.name})`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {dm.type==="st"&&(
            <div style={{ marginBottom:14, padding:"10px 14px", background:"#1E293B20", borderRadius:8 }}>
              <span style={{ fontSize:11, color:"#64748B" }}>Stumped by: </span>
              <span style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{keeper} (WK)</span>
            </div>
          )}

          {/* New batsman */}
          {dm.type!=="rh"&&remaining.length>0&&(
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:6 }}>NEXT BATSMAN IN</div>
              <select value={dm.newBatsmanIdx} onChange={e=>setDm(d=>d?{...d,newBatsmanIdx:Number(e.target.value)}:d)}
                style={{ width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                <option value={-1}>Select next batsman…</option>
                {inn.batScores.map((b,i)=>!b.dismissal&&!b.batting&&i!==inn.strikerIdx&&i!==inn.nonStrikerIdx?(
                  <option key={i} value={i}>{b.name}</option>
                ):null)}
              </select>
            </div>
          )}

          {/* Preview */}
          <div style={{ padding:"10px 14px", background:"#EF444408", border:"1px solid #EF444420", borderRadius:8, marginBottom:16 }}>
            <span style={{ fontSize:12, color:"#EF4444" }}>
              {inn.batScores[inn.strikerIdx]?.name} — {getDisStr(dm.type, dm.fielder||keeper, bowler, dm.nonStrikerOut)}
            </span>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setDm(null)} style={{ flex:1, padding:11, borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", cursor:"pointer" }}>Cancel</button>
            <button onClick={confirmDismissal}
              disabled={(dm.type==="c"&&!dm.fielder)||(dm.type==="ro"&&!dm.fielder)||(dm.newBatsmanIdx===-1&&dm.type!=="rh"&&remaining.length>0)}
              style={{ flex:2, padding:11, borderRadius:9, border:"none", background:"linear-gradient(135deg,#EF4444,#DC2626)", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
              ✓ Confirm Dismissal
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ── Live Scoring View ───────────────────────────────── */
  // Guard: inn1 may be null if XI selection was not completed yet
  const curInn = live ? (live.currentInnings===1 ? live.inn1 : live.inn2) : null;
  if(!live || !curInn) {
    // Fallback: go back to toss screen rather than blank page
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setLive(null)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← All Matches</button>
        </div>
        <div style={{ ...CARD, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏏</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:6 }}>Match setup incomplete</div>
          <div style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Complete the toss and XI selection first to begin live scoring.</div>
          <button onClick={()=>live && setLive(l=>l?{...l,phase:"toss"}:null)} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer" }}>
            ← Back to Toss Setup
          </button>
        </div>
      </div>
    );
  }

  const striker   = curInn.batScores[curInn.strikerIdx];
  const nonStr    = curInn.batScores[curInn.nonStrikerIdx];
  const bowler    = curInn.bowlScores[curInn.bowlerIdx];
  const lastPart  = curInn.partnerships[curInn.partnerships.length-1];
  const target    = curInn.target;
  const runsNeeded= target?Math.max(0,target-curInn.totalRuns):0;
  const ballsLeft = Math.max(0,(20-curInn.overs)*6-curInn.balls);

  const renderScorecard = () => {
    const renderBat = (d:InningsState) => (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:TEAM_COLORS[d.battingTeam]||"#E2E8F0" }}>{d.battingTeam}</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#FF6B00" }}>{d.totalRuns}/{d.totalWickets} <span style={{ fontSize:12, color:"#64748B" }}>({fmtO(d.overs,d.balls)} ov)</span></div>
          </div>
          <div style={{ fontSize:12, color:"#64748B" }}>Extras: {d.extras}{d.target?<div style={{ color:"#F59E0B" }}>Target: {d.target}</div>:null}</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1E293B" }}>
            {["Batsman","Dismissal","R","B","4s","6s","SR"].map(h=><th key={h} style={{ padding:"6px 8px", textAlign:h==="Batsman"||h==="Dismissal"?"left":"right", color:"#475569", fontWeight:700, fontSize:10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {d.batScores.filter(b=>b.balls>0||b.dismissal).map((b,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid #0F172A" }}>
                <td style={{ padding:"8px", color:b.dismissal?"#64748B":"#E2E8F0", fontWeight:b.dismissal?400:700 }}>{b.name}{b.batting&&!b.dismissal?<span style={{ color:"#FF6B00" }}>*</span>:null}</td>
                <td style={{ padding:"8px", color:"#475569", fontSize:10 }}>{b.dismissal||"not out"}</td>
                <td style={{ padding:"8px", textAlign:"right", color:b.runs>=50?"#F59E0B":"#E2E8F0", fontWeight:800 }}>{b.runs}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#64748B" }}>{b.balls}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#3B82F6" }}>{b.fours}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#10B981" }}>{b.sixes}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#64748B" }}>{b.balls?((b.runs/b.balls)*100).toFixed(1):"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d.fowList.length>0&&<div style={{ marginTop:12 }}>
          <div style={{ fontSize:10, color:"#475569", fontWeight:700, marginBottom:6 }}>FALL OF WICKETS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {d.fowList.map((f,i)=><div key={i} style={{ padding:"3px 10px", background:"#EF444410", border:"1px solid #EF444430", borderRadius:20, fontSize:10, color:"#EF4444" }}>{f.wicket}-{f.runs} ({f.batsman.split(" ")[0]}, {f.overStr})</div>)}
          </div>
        </div>}
      </div>
    );
    const renderBowl = (d:InningsState) => (
      <div>
        <div style={{ fontSize:14, fontWeight:800, color:TEAM_COLORS[d.bowlingTeam]||"#E2E8F0", marginBottom:14 }}>Bowling — {d.bowlingTeam}</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid #1E293B" }}>
            {["Bowler","O","R","W","Econ","Wd","NB"].map(h=><th key={h} style={{ padding:"6px 8px", textAlign:h==="Bowler"?"left":"right", color:"#475569", fontWeight:700, fontSize:10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {d.bowlScores.filter(b=>b.overs>0||b.balls>0).map((b,i)=>(
              <tr key={i} style={{ borderBottom:"1px solid #0F172A" }}>
                <td style={{ padding:"8px", color:"#E2E8F0", fontWeight:600 }}>{b.name}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#94A3B8" }}>{fmtO(b.overs,b.balls)}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#E2E8F0" }}>{b.runs}</td>
                <td style={{ padding:"8px", textAlign:"right", color:b.wickets>0?"#EF4444":"#64748B", fontWeight:b.wickets>0?800:400 }}>{b.wickets}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#F59E0B" }}>{b.overs||b.balls?((b.runs/(b.overs+b.balls/6))||0).toFixed(2):"—"}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#64748B" }}>{b.wides}</td>
                <td style={{ padding:"8px", textAlign:"right", color:"#64748B" }}>{b.noBalls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    const scTabs = [["bat1","Batting (Inn 1)"],["bowl1","Bowling (Inn 1)"],["bat2","Batting (Inn 2)"],["bowl2","Bowling (Inn 2)"]] as const;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {scTabs.map(([t,l])=><button key={t} onClick={()=>setScTab(t)} style={TAB(scTab===t)}>{l}</button>)}
        </div>
        <div style={CARD}>
          {scTab==="bat1"  && renderBat(live.inn1)}
          {scTab==="bowl1" && renderBowl(live.inn1)}
          {scTab==="bat2"  && (live.inn2?renderBat(live.inn2):<div style={{ color:"#475569" }}>2nd innings not started yet</div>)}
          {scTab==="bowl2" && (live.inn2?renderBowl(live.inn2):<div style={{ color:"#475569" }}>2nd innings not started yet</div>)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {renderDismissalModal()}

      {/* Top bar */}
      <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
        <button onClick={()=>setLive(null)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:11, cursor:"pointer" }}>← All Matches</button>
        {[["live","🔴 Live"],["scorecard","📋 Scorecard"]] .map(([t,l])=><button key={t} onClick={()=>setMainTab(t as any)} style={TAB(mainTab===t)}>{l}</button>)}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#475569" }}>Match {live.def.matchNo} · Innings {live.currentInnings}</span>
          {live.phase==="completed"&&<span style={PILL("#10B981")}>COMPLETED</span>}
          {live.phase==="live"&&<span style={PILL("#EF4444")}>LIVE</span>}
        </div>
      </div>

      {mainTab==="scorecard"&&renderScorecard()}
      {mainTab==="live"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Match header */}
          <div style={{ ...CARD, borderColor:"rgba(239,68,68,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:14 }}>
              <span style={{ fontSize:11, color:"#64748B" }}>📍 {live.def.venue} · {live.def.date}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>
                {live.tossWinner} won toss · elected to {live.tossDec}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              {([
                { d:live.inn1,  label:"1st Innings", suffix:"" },
                { d:live.inn2!, label:"2nd Innings",  suffix:target?` / ${live.inn1.totalRuns+1}`:"" },
              ] as const).map(({d,label,suffix},i)=>d&&(
                <div key={i} style={{ background:"#060B1880", borderRadius:10, padding:"10px 14px", border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:10, color:"#475569", fontWeight:700, marginBottom:4 }}>{label} · {d.battingTeam}</div>
                  <div style={{ fontSize:24, fontWeight:900, color:"#FF6B00" }}>{d.totalRuns}/{d.totalWickets}<span style={{ fontSize:11, color:"#64748B" }}>{suffix}</span></div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>{fmtO(d.overs,d.balls)} overs</div>
                </div>
              ))}
            </div>
            {/* CRR / RRR / Need */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {[
                { l:"CRR", v:crr(curInn.totalRuns,curInn.overs,curInn.balls), c:"#10B981" },
                { l:"RRR", v:target?rrr(target,curInn.totalRuns,curInn.overs,curInn.balls):"—", c:"#EF4444" },
                { l:"Need", v:target?`${runsNeeded} off ${ballsLeft}b`:"—", c:"#FF6B00" },
                { l:"This Over", v:curInn.currentOverDeliveries.reduce((s,d)=>s+(d==="W"?0:d==="4"?4:d==="6"?6:parseInt(d)||0),0).toString(), c:"#F59E0B" },
              ].map(s=>(
                <div key={s.l} style={{ textAlign:"center", background:"#060B18", borderRadius:8, padding:"8px 4px", border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Current over balls */}
            <div style={{ marginTop:10, display:"flex", gap:5, alignItems:"center" }}>
              <span style={{ fontSize:10, color:"#475569" }}>Over {curInn.overs+1}:</span>
              {curInn.currentOverDeliveries.map((b,i)=>(
                <div key={i} style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800,
                  background:b==="6"?"#10B98130":b==="4"?"#3B82F630":b==="W"?"#EF444430":"#1E293B",
                  color:b==="6"?"#10B981":b==="4"?"#3B82F6":b==="W"?"#EF4444":"#94A3B8", border:"1px solid rgba(255,255,255,.04)" }}>{b}</div>
              ))}
              {Array.from({length:Math.max(0,6-curInn.currentOverDeliveries.length)}).map((_,i)=>(
                <div key={`e${i}`} style={{ width:26, height:26, borderRadius:"50%", border:"1px dashed #1E293B" }}/>
              ))}
            </div>
          </div>

          {/* At crease + Bowler */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={CARD}>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>At The Crease</div>
              {striker&&(
                <div style={{ display:"flex", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #0F172A", marginBottom:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#FF6B00", marginRight:8, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:13, color:"#E2E8F0", fontWeight:700 }}>{striker.name}</span>
                  <span style={{ fontSize:18, fontWeight:900, color:"#FF6B00" }}>{striker.runs}</span>
                  <span style={{ fontSize:11, color:"#475569", marginLeft:4 }}>({striker.balls})</span>
                  <span style={{ fontSize:10, color:"#3B82F6", marginLeft:8 }}>4s:{striker.fours}</span>
                  <span style={{ fontSize:10, color:"#10B981", marginLeft:6 }}>6s:{striker.sixes}</span>
                </div>
              )}
              {nonStr&&(
                <div style={{ display:"flex", alignItems:"center", padding:"4px 0" }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#1E293B", border:"1px solid #475569", marginRight:8, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12, color:"#94A3B8" }}>{nonStr.name}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:"#94A3B8" }}>{nonStr.runs}</span>
                  <span style={{ fontSize:10, color:"#475569", marginLeft:4 }}>({nonStr.balls})</span>
                </div>
              )}
              {lastPart&&<div style={{ marginTop:10, padding:"7px 10px", background:"#FF6B0008", border:"1px solid #FF6B0018", borderRadius:8, fontSize:11, color:"#FF7A29" }}>
                Partnership: <strong>{lastPart.runs}</strong> runs off {lastPart.balls} balls
              </div>}
              {/* Batsman selectors */}
              <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                {([["Striker","strikerIdx"],["Non-Striker","nonStrikerIdx"]] as const).map(([lbl,key])=>(
                  <div key={key}>
                    <div style={{ fontSize:9, color:"#475569", marginBottom:3, fontWeight:700 }}>{lbl.toUpperCase()}</div>
                    <select value={curInn[key]} onChange={e=>setLive(l=>{
                      if(!l) return l;
                      const upd = {...(l.currentInnings===1?l.inn1:l.inn2!), [key]:Number(e.target.value)};
                      return l.currentInnings===1?{...l,inn1:upd}:{...l,inn2:upd};
                    })} style={{ width:"100%", padding:"6px 8px", background:"#060B18", border:"1px solid #1E293B", borderRadius:7, color:"#F1F5F9", fontSize:11, outline:"none" }}>
                      {curInn.batScores.map((b,i)=>!b.dismissal||(
                        <option key={i} value={i} disabled={!!b.dismissal}>{b.name} {b.dismissal?"[out]":""}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div style={CARD}>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Current Bowler</div>
              {bowler&&(
                <>
                  <div style={{ fontSize:14, fontWeight:700, color:"#E2E8F0", marginBottom:10 }}>{bowler.name}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                    {[{v:fmtO(bowler.overs,bowler.balls),l:"Overs",c:"#F59E0B"},{v:bowler.runs,l:"Runs",c:"#E2E8F0"},{v:bowler.wickets,l:"Wkts",c:"#EF4444"},{v:bowler.overs||bowler.balls?((bowler.runs/(bowler.overs+bowler.balls/6))||0).toFixed(1):"—",l:"Econ",c:"#64748B"}].map(s=>(
                      <div key={s.l} style={{ textAlign:"center", background:"#060B18", borderRadius:7, padding:"7px 3px" }}>
                        <div style={{ fontSize:14, fontWeight:900, color:s.c }}>{s.v}</div>
                        <div style={{ fontSize:8, color:"#475569", marginTop:2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div style={{ fontSize:9, color:"#475569", marginBottom:4, fontWeight:700 }}>CHANGE BOWLER</div>
              <select value={curInn.bowlerIdx} onChange={e=>setLive(l=>{
                if(!l) return l;
                const upd = {...(l.currentInnings===1?l.inn1:l.inn2!), bowlerIdx:Number(e.target.value)};
                return l.currentInnings===1?{...l,inn1:upd}:{...l,inn2:upd};
              })} style={{ width:"100%", padding:"7px 10px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:12, outline:"none" }}>
                {curInn.bowlScores.map((b,i)=><option key={i} value={i}>{b.name} ({fmtO(b.overs,b.balls)} ov, {b.wickets}W)</option>)}
              </select>
            </div>
          </div>

          {/* Scoring pad + Commentary */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={CARD}>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Scoring Pad</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
                {([["0","#1E293B","#94A3B8"],["1","#1E3A5F40","#3B82F6"],["2","#1E3A5F40","#3B82F6"],["3","#1E3A5F40","#3B82F6"],["4","#3B82F620","#3B82F6"],["6","#10B98120","#10B981"],["W","#EF444420","#EF4444"],["•","#1E293B","#64748B"],["WD","#F59E0B20","#F59E0B"],["NB","#F59E0B20","#F59E0B"],["LB","#8B5CF620","#8B5CF6"],["B","#8B5CF620","#8B5CF6"]] as [string,string,string][]).map(([lbl,bg,tc])=>(
                  <button key={lbl} onClick={()=>addBall(lbl==="•"?".":lbl)}
                    style={{ padding:"15px 4px", borderRadius:9, border:`1px solid ${tc}30`, background:bg, color:tc, fontSize:16, fontWeight:900, cursor:"pointer" }}
                    onMouseDown={e=>(e.currentTarget.style.transform="scale(0.9)")}
                    onMouseUp={e=>(e.currentTarget.style.transform="")}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div style={CARD}>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Commentary</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input value={customNote} onChange={e=>setCustomNote(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"){ setCommentary(c=>[`${curInn.overs}.${curInn.balls} — ${customNote.trim()}`,...c].slice(0,30)); setCustomNote(""); }}}
                  placeholder="Type commentary… (Enter)"
                  style={{ flex:1, padding:"8px 10px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:12, outline:"none" }}/>
                <button onClick={()=>{ setCommentary(c=>[`${curInn.overs}.${curInn.balls} — ${customNote.trim()}`,...c].slice(0,30)); setCustomNote(""); }}
                  style={{ padding:"0 14px", borderRadius:8, border:"none", background:"#FF6B00", color:"#fff", cursor:"pointer", fontWeight:700 }}>→</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:260, overflowY:"auto" }}>
                {commentary.map((c,i)=>(
                  <div key={i} style={{ padding:"6px 10px", background:i===0?"#FF6B0008":"#080E1C", border:`1px solid ${i===0?"#FF6B0030":"#0F172A"}`, borderRadius:7, fontSize:11, color:i===0?"#E2E8F0":"#64748B" }}>{c}</div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
