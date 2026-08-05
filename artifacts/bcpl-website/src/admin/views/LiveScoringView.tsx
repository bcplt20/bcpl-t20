import { useState, useEffect } from "react";
import {
  getMatches, createMatch, recordToss, setPlayingXI, recordBall,
  endInnings, updateMatchStatus, recordMatchResult,
  getTeams, getTeamDetail,
} from "../../lib/api";
import type { ApiTeam } from "../../lib/api";

/* ─── Types ─────────────────────────────────────────── */
type Role = "BAT"|"BOWL"|"AR"|"WK";
interface Player { name:string; role:Role; }
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
  phase:"toss"|"xi"|"openers"|"live"|"completed";
  resultDesc?:string;
}
interface DismissalModal {
  type:"b"|"c"|"lbw"|"ro"|"st"|"hw"|"cb"|"rh";
  fielder:string; nonStrikerOut:boolean; newBatsmanIdx:number;
}
interface BallParams {
  outcome:string; runs:number; isExtra:boolean; isWide:boolean; isNB:boolean;
  isBye:boolean; isWicket:boolean; dismissal:string;
  nonStrikerOut?:boolean; dismissalTypeKey?:string; fielderName?:string; dismissedBatter?:string;
  newBatsmanIdx?:number;
}

/* ─── Helpers ────────────────────────────────────────── */
const fmtO = (o:number, b:number) => `${o}.${b}`;
const crr  = (r:number, o:number, b:number) => { const d=o+b/6; return d===0?"0.00":(r/d).toFixed(2); };
const rrr  = (tgt:number, r:number, o:number, b:number) => { const rem=20-(o+b/6); if(rem<=0)return"0.00"; return ((tgt-r)/rem).toFixed(2); };

const ROLE_CODE: Record<string, Role> = {
  "Batsman":"BAT", "Bowler":"BOWL", "All-rounder":"AR", "Wicket-keeper":"WK",
  "BAT":"BAT", "BOWL":"BOWL", "AR":"AR", "WK":"WK",
};
const toRoleCode = (r:string):Role => ROLE_CODE[r] ?? "BAT";

const makeInnings = (battingTeam:string, bowlingTeam:string, batXI:string[], bowlXI:string[], target?:number): InningsState => ({
  battingTeam, bowlingTeam,
  battingXI: batXI, bowlingXI: bowlXI,
  batScores: batXI.map(n=>({ name:n, runs:0, balls:0, fours:0, sixes:0, dismissal:"", batting:false })),
  bowlScores: bowlXI.map(n=>({ name:n, overs:0, balls:0, runs:0, wickets:0, wides:0, noBalls:0 })),
  totalRuns:0, totalWickets:0, overs:0, balls:0, extras:0,
  currentOverDeliveries:[], overHistory:[], partnerships:[], fowList:[],
  strikerIdx:0, nonStrikerIdx:1, bowlerIdx:0, target,
});

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

const DIS_TYPE_MAP: Record<string,string> = {
  "b":"bowled","c":"caught","lbw":"lbw","ro":"run_out",
  "st":"stumped","hw":"hit_wicket","cb":"caught_and_bowled","rh":"retired_hurt",
};

/* ─── Styles ─────────────────────────────────────────── */
const CARD: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526,#0A1020)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
const TAB  = (a:boolean): React.CSSProperties => ({ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:a?"linear-gradient(135deg,#FF6B00,#FF8C40)":"transparent", color:a?"#fff":"#64748B" });
const PILL = (c:string): React.CSSProperties => ({ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 10px", borderRadius:20, background:`${c}20`, border:`1px solid ${c}40`, fontSize:10, fontWeight:700, color:c });
const SELECT: React.CSSProperties = { width:"100%", padding:"9px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:13, outline:"none" };

/* ══════════════════════════════════════════════════════ */
export default function LiveScoringView() {
  const [matches,     setMatches]     = useState<MatchDef[]>([]);
  const [live,        setLive]        = useState<LiveMatch|null>(null);
  const [currentDbId, setCurrentDbId] = useState<string|null>(null);

  /* Real teams + squads from API (Admin → Teams) */
  const [teams,         setTeams]         = useState<ApiTeam[]>([]);
  const [squads,        setSquads]        = useState<Record<string, Player[]>>({});
  const [squadsLoading, setSquadsLoading] = useState(false);
  const [apiErr,        setApiErr]        = useState<string|null>(null);
  const [saving,        setSaving]        = useState(false);

  useEffect(()=>{
    getTeams(5).then(res=>setTeams(res.teams ?? [])).catch(()=>{});
    refreshMatches();
  },[]);  // eslint-disable-line react-hooks/exhaustive-deps

  const refreshMatches = () => {
    getMatches(5).then(res=>{
      const apiMatches: MatchDef[] = (res.matches ?? []).map((m:any, i:number)=>({
        id: -(i+1),
        dbId: m.id,
        matchNo: m.matchNo,
        team1: m.team1, team2: m.team2,
        venue: m.venue,
        date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "TBD",
        status: (m.status==="live"||m.status==="innings2") ? "live" : m.status==="completed"||m.status==="abandoned" ? "completed" : "scheduled",
      }));
      setMatches(apiMatches);
    }).catch(()=>{});
  };

  const teamColor = (name:string) => teams.find(t=>t.name===name)?.color || "#FF6B00";

  const loadSquads = async (names:string[]) => {
    setSquadsLoading(true);
    try{
      let tlist = teams;
      if(tlist.length===0){                      // teams may not have loaded yet when a match is opened
        tlist = (await getTeams(5)).teams ?? [];
        setTeams(tlist);
      }
      const updates: Record<string, Player[]> = {};
      for(const name of names){                  // always refetch — squads change in the Teams tab
        const team = tlist.find(t=>t.name===name);
        if(!team){ updates[name] = []; continue; }
        const d = await getTeamDetail(team.slug || team.id);
        updates[name] = (d.players ?? []).map(p=>({ name:p.name, role:toRoleCode(p.role) }));
      }
      setSquads(s=>({ ...s, ...updates }));
      setApiErr(null);
    }catch(e:any){
      setApiErr("Squad load nahi hua: " + (e?.message ?? "unknown error"));
    }finally{ setSquadsLoading(false); }
  };

  const [mainTab,    setMainTab]    = useState<"live"|"scorecard">("live");
  const [scTab,      setScTab]      = useState<"bat1"|"bowl1"|"bat2"|"bowl2">("bat1");
  const [commentary, setCommentary] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [dm,         setDm]         = useState<DismissalModal|null>(null);

  // Add match form (venue is free text; teams come from the Teams tab)
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ team1:"", team2:"", venue:"", date:"" });

  /* XI selection temp state */
  const [xi1sel, setXi1sel] = useState<string[]>([]);
  const [xi2sel, setXi2sel] = useState<string[]>([]);

  /* Openers selection temp state (used for both innings) */
  const [opSel, setOpSel] = useState({ striker:0, nonStriker:1, bowler:0 });

  /* Which team bats first, honouring who actually won the toss */
  const battingFirst = (l:LiveMatch) => {
    const other = l.tossWinner===l.def.team1 ? l.def.team2 : l.def.team1;
    return l.tossDec==="bat" ? l.tossWinner : other;
  };

  /* ── Open a match (toss screen) ── */
  const openMatch = (m:MatchDef) => {
    if(m.status==="completed") return;
    if(m.status==="live" && !window.confirm("Ye match server pe pehle se LIVE hai. Dobara setup karne se iski purani ball-by-ball scoring reset ho jayegi. Continue?")) return;
    setCurrentDbId(m.dbId||null);
    setLive({ def:m, tossWinner:m.team1, tossDec:"bat", xi1:[], xi2:[], currentInnings:1, inn1:null as any, inn2:null, phase:"toss" });
    setXi1sel([]); setXi2sel([]);
    setCommentary([]);
    setMainTab("live");
    setApiErr(null);
    loadSquads([m.team1, m.team2]);
  };

  /* ── Confirm toss → XI selection ── */
  const confirmToss = async () => {
    if(!live || saving) return;
    if(currentDbId){
      setSaving(true);
      try{
        await recordToss(currentDbId,{ tossWinner:live.tossWinner, tossDecision:live.tossDec });
        setApiErr(null);
      }catch(e:any){
        setApiErr("Toss save nahi hua: " + (e?.message ?? "error"));
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setLive(l=>l?{...l, phase:"xi"}:l);
  };

  /* ── Confirm XI → openers selection ── */
  const confirmXI = async () => {
    if(!live || saving || xi1sel.length!==11 || xi2sel.length!==11) return;
    const bat  = battingFirst(live);
    const bowl = bat===live.def.team1 ? live.def.team2 : live.def.team1;
    const batXI  = bat===live.def.team1 ? xi1sel : xi2sel;
    const bowlXI = bat===live.def.team1 ? xi2sel : xi1sel;

    if(currentDbId){
      setSaving(true);
      try{
        const sq1 = squads[live.def.team1]||[];
        const sq2 = squads[live.def.team2]||[];
        await setPlayingXI(currentDbId,{
          xi1: xi1sel.map(n=>({ name:n, role:sq1.find(p=>p.name===n)?.role||"BAT" })),
          xi2: xi2sel.map(n=>({ name:n, role:sq2.find(p=>p.name===n)?.role||"BAT" })),
          battingTeam: bat,
        });
        setApiErr(null);
      }catch(e:any){
        setApiErr("XI save nahi hua: " + (e?.message ?? "error"));
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    const inn1 = makeInnings(bat, bowl, batXI, bowlXI);
    setLive(l=>l?{...l, xi1:xi1sel, xi2:xi2sel, inn1, currentInnings:1, phase:"openers"}:l);
    setMatches(ms=>ms.map(m=>m.id===live.def.id?{...m,status:"live"}:m));
    setOpSel({ striker:0, nonStriker:1, bowler:0 });
  };

  /* ── Start innings after openers picked ── */
  const startInnings = () => {
    if(!live) return;
    const { striker, nonStriker, bowler } = opSel;
    if(striker===nonStriker) return;
    setLive(prev=>{
      if(!prev) return prev;
      const cur = prev.currentInnings===1 ? prev.inn1 : prev.inn2;
      if(!cur) return prev;
      const batScores = cur.batScores.map((b,i)=>(i===striker||i===nonStriker)?{...b, batting:true}:b);
      const partnerships = [{ bat1:cur.batScores[striker]?.name||"", bat2:cur.batScores[nonStriker]?.name||"", runs:0, balls:0 }];
      const upd = { ...cur, batScores, partnerships, strikerIdx:striker, nonStrikerIdx:nonStriker, bowlerIdx:bowler };
      return prev.currentInnings===1 ? { ...prev, inn1:upd, phase:"live" } : { ...prev, inn2:upd, phase:"live" };
    });
    setCommentary(c=>[`🏏 Innings ${live.currentInnings} begins — ${live.currentInnings===1?live.inn1?.battingTeam:live.inn2?.battingTeam} batting.`,...c].slice(0,30));
  };

  /* ── Current innings helper ── */
  const inn = live ? (live.currentInnings===1 ? live.inn1 : live.inn2) : null;

  /* ── Ball outcome from scoring pad ── */
  const addBall = (outcome:string) => {
    if(!live || !inn || live.phase!=="live") return;
    if(outcome==="W") { setDm({ type:"b", fielder:"", nonStrikerOut:false, newBatsmanIdx:-1 }); return; }

    const isWide = outcome==="WD";
    const isNB   = outcome==="NB";
    const isBye  = outcome==="LB"||outcome==="B";
    const isExtra= isWide||isNB||isBye;
    const runs   = outcome==="4"?4:outcome==="6"?6:(outcome==="."||isExtra)?0:parseInt(outcome)||0;

    applyBall({ outcome, runs, isExtra, isWide, isNB, isBye, isWicket:false, dismissal:"" });
  };

  /* ── Finish match: result + points table sync ── */
  const finishMatch = (lv:LiveMatch, finalInn2:InningsState, ballPromise:Promise<boolean>) => {
    const tgt = finalInn2.target ?? (lv.inn1.totalRuns+1);
    let winner = ""; let resultDesc = "";
    if(finalInn2.totalRuns >= tgt){
      const wkts = 10 - finalInn2.totalWickets;
      winner = finalInn2.battingTeam;
      resultDesc = `${winner} won by ${wkts} wicket${wkts===1?"":"s"}`;
    } else if(finalInn2.totalRuns === tgt-1){
      resultDesc = "Match tied";
    } else {
      const margin = tgt-1-finalInn2.totalRuns;
      winner = finalInn2.bowlingTeam;
      resultDesc = `${winner} won by ${margin} run${margin===1?"":"s"}`;
    }

    setLive({ ...lv, inn2:finalInn2, currentInnings:2, phase:"completed", resultDesc });
    setMatches(ms=>ms.map(m=>m.id===lv.def.id?{...m,status:"completed"}:m));
    setCommentary(c=>[`🏆 ${resultDesc}!`,...c].slice(0,30));

    if(currentDbId){
      const dbId = currentDbId;
      ballPromise.then(async (ok)=>{
        if(!ok){ setApiErr("Aakhri ball server pe save nahi hui — result aur points table server pe record NAHI hue. Match dobara score karna padega."); return; }
        try{
          await updateMatchStatus(dbId,{ status:"completed", winner:winner||undefined, resultDesc });
          if(winner){
            const loser = winner===lv.def.team1 ? lv.def.team2 : lv.def.team1;
            await recordMatchResult({ winner, loser, season:5 });
          }else{
            // tie → both sides get a point (recorded as no-result for both)
            await recordMatchResult({ noResult:true, winner:lv.def.team1, loser:lv.def.team2, season:5 });
          }
          setApiErr(null);
        }catch(e:any){
          setApiErr("Result save nahi hua: " + (e?.message ?? "error"));
        }
      });
    }
  };

  /* ── Apply one delivery (single pass: state + API + transitions) ── */
  const applyBall = (p:BallParams) => {
    if(!live) return;
    const cur = live.currentInnings===1 ? live.inn1 : live.inn2;
    if(!cur) return;
    const { outcome, runs, isExtra, isWide, isNB, isBye, isWicket, dismissal } = p;

    /* Persist to API — keep the promise so innings/match transitions wait for it.
       Resolves true only when the ball is actually saved on the server. */
    let ballPromise: Promise<boolean> = Promise.resolve(true);
    if(currentDbId){
      const strikerName = cur.batScores[cur.strikerIdx]?.name || "";
      const bowlerName  = cur.bowlScores[cur.bowlerIdx]?.name || "";
      const apiOutcome  = outcome==="."?"0":outcome;
      ballPromise = recordBall(currentDbId,{
        outcome: apiOutcome,
        batterName: strikerName, bowlerName,
        dismissalType: p.dismissalTypeKey ? DIS_TYPE_MAP[p.dismissalTypeKey] : undefined,
        dismissedBatter: p.dismissedBatter||undefined,
        fielderName: p.fielderName||undefined,
        nonStrikerOut: p.nonStrikerOut ?? false,
      }).then(()=>{ setApiErr(null); return true; })
        .catch((e:any)=>{ setApiErr("Ball server pe save nahi hua: " + (e?.message ?? "error")); return false; });
    }

    /* Ball counting: wides & no-balls don't count; byes/leg-byes do (matches server) */
    const countsAsBall = !isWide && !isNB;
    const newBallCount = countsAsBall ? cur.balls+1 : cur.balls;
    const overDone     = countsAsBall && newBallCount===6;
    const newOvers     = overDone ? cur.overs+1 : cur.overs;
    const finalBalls   = overDone ? 0 : newBallCount;

    const outIdx        = isWicket ? (p.nonStrikerOut ? cur.nonStrikerIdx : cur.strikerIdx) : -1;
    const newBatsmanIdx = p.newBatsmanIdx ?? -1;

    /* Batting */
    const newBatScores = cur.batScores.map((b,i)=>{
      let nb = b;
      if(i===cur.strikerIdx && countsAsBall){
        nb = { ...nb, balls:nb.balls+1 };
        if(!isBye && !isWicket){
          nb = { ...nb, runs:nb.runs+runs,
            fours:outcome==="4"?nb.fours+1:nb.fours,
            sixes:outcome==="6"?nb.sixes+1:nb.sixes };
        }
      }
      if(isWicket && i===outIdx) nb = { ...nb, dismissal, batting:false };
      if(isWicket && i===newBatsmanIdx && newBatsmanIdx!==outIdx) nb = { ...nb, batting:true };
      return nb;
    });

    /* Bowling (extras +1 charged to bowler — same as server aggregation) */
    const newBowlScores = cur.bowlScores.map((b,i)=>{
      if(i!==cur.bowlerIdx) return b;
      const nb2 = countsAsBall ? b.balls+1 : b.balls;
      const oc  = countsAsBall && nb2===6;
      return { ...b, runs:b.runs+runs+(isExtra?1:0), wickets:isWicket?b.wickets+1:b.wickets,
        balls:oc?0:nb2, overs:oc?b.overs+1:b.overs,
        wides:isWide?b.wides+1:b.wides, noBalls:isNB?b.noBalls+1:b.noBalls };
    });

    /* Partnership */
    let newPart = [...cur.partnerships];
    if(newPart.length){
      const last = newPart[newPart.length-1];
      newPart[newPart.length-1] = { ...last, runs:last.runs+runs+(isExtra?1:0), balls:countsAsBall?last.balls+1:last.balls };
    }

    /* Fall of wicket */
    const newFow = [...cur.fowList];
    if(isWicket){
      newFow.push({ wicket:cur.totalWickets+1, batsman:cur.batScores[outIdx]?.name||"",
        runs:cur.totalRuns+runs, overStr:fmtO(cur.overs, cur.balls) });
    }

    /* Current over display */
    let newCurOver = countsAsBall ? [...cur.currentOverDeliveries, isWicket?"W":outcome] : cur.currentOverDeliveries;

    /* Over history */
    const newOverHistory = [...cur.overHistory];
    if(overDone){
      newOverHistory.push({ over:cur.overs+1,
        runs:newCurOver.reduce((s,d)=>s+(d==="W"?0:d==="4"?4:d==="6"?6:d==="LB"||d==="B"?1:parseInt(d)||0),0),
        wickets:isWicket?1:0, deliveries:newCurOver });
      newCurOver=[];
    }

    /* New batsman replaces the out batter's end; then strike rotation */
    let newStriker    = cur.strikerIdx;
    let newNonStriker = cur.nonStrikerIdx;
    if(isWicket && newBatsmanIdx>=0){
      if(p.nonStrikerOut) newNonStriker = newBatsmanIdx;
      else                newStriker    = newBatsmanIdx;
      newPart = [...newPart, { bat1:newBatScores[newStriker]?.name||"", bat2:newBatScores[newNonStriker]?.name||"", runs:0, balls:0 }];
    }
    const rotateRuns = isBye ? 1 : runs;   // 1 leg-bye/bye = batters crossed
    const oddRuns = rotateRuns % 2 === 1;
    if(overDone){ const t=newStriker; newStriker=newNonStriker; newNonStriker=t; }
    else if(oddRuns && !isWicket){ const t=newStriker; newStriker=newNonStriker; newNonStriker=t; }

    const newTotalWickets = cur.totalWickets + (isWicket?1:0);
    const newTotal        = cur.totalRuns + runs + (isExtra?1:0);
    const tgt             = cur.target;
    const innComplete     = newTotalWickets>=10 || newOvers>=20 || (!!tgt && newTotal>=tgt);

    const updatedInns: InningsState = {
      ...cur,
      batScores:newBatScores, bowlScores:newBowlScores,
      totalRuns:newTotal, totalWickets:newTotalWickets,
      overs:newOvers, balls:finalBalls,
      extras:cur.extras+(isExtra?1:0),
      currentOverDeliveries:newCurOver, overHistory:newOverHistory,
      partnerships:newPart, fowList:newFow,
      strikerIdx:newStriker, nonStrikerIdx:newNonStriker,
    };

    /* Ball commentary */
    const o=cur.overs, b=cur.balls+(countsAsBall?1:0);
    const ballMsg =
      isWicket        ? `${o}.${b} — 💥 WICKET! ${p.dismissedBatter||""} ${dismissal}.` :
      outcome==="6"   ? `${o}.${b} — 🚀 SIX! Ball disappears into the stands!` :
      outcome==="4"   ? `${o}.${b} — 🏏 FOUR! Racing to the boundary!` :
      outcome==="."   ? `${o}.${b} — 🎯 Dot ball. Tight bowling.` :
      outcome==="WD"  ? `${o}.${b} — Wide ball signalled. +1 extra.` :
      outcome==="NB"  ? `${o}.${b} — ⚠️ No ball! +1 extra.` :
      outcome==="LB"  ? `${o}.${b} — Leg bye, 1 extra.` :
      outcome==="B"   ? `${o}.${b} — Bye, 1 extra.` :
                        `${o}.${b} — ${outcome} run(s) taken.`;

    /* Innings / match transitions */
    if(live.currentInnings===1){
      if(innComplete){
        const inn2 = makeInnings(cur.bowlingTeam, cur.battingTeam, cur.bowlingXI, cur.battingXI, newTotal+1);
        setLive({ ...live, inn1:updatedInns, inn2, currentInnings:2, phase:"openers" });
        setOpSel({ striker:0, nonStriker:1, bowler:0 });
        setCommentary(c=>[`🔚 Innings break — ${cur.battingTeam} ${newTotal}/${newTotalWickets}. Target: ${newTotal+1}.`, ballMsg, ...c].slice(0,30));
        if(currentDbId){
          const dbId = currentDbId;
          ballPromise.then(ok=>{
            if(!ok){ setApiErr("Aakhri ball server pe save nahi hui, isliye innings-break bhi sync nahi hua. Network check karke match dobara kholo (scoring reset hogi)."); return; }
            endInnings(dbId).then(()=>setApiErr(null))
              .catch((e:any)=>setApiErr("Innings-end server pe save nahi hua: " + (e?.message ?? "error")));
          });
        }
        return;
      }
      setLive({ ...live, inn1:updatedInns });
    } else {
      if(innComplete){
        finishMatch(live, updatedInns, ballPromise);
        return;
      }
      setLive({ ...live, inn2:updatedInns });
    }
    setCommentary(c=>[ballMsg,...c].slice(0,30));
  };

  /* ── Confirm dismissal (single pass through applyBall) ── */
  const confirmDismissal = () => {
    if(!live||!inn||!dm) return;
    const remaining = inn.batScores.filter((b,i)=>i!==inn.strikerIdx&&i!==inn.nonStrikerIdx&&!b.dismissal&&!b.batting);
    if(dm.newBatsmanIdx===-1 && dm.type!=="rh" && remaining.length>0) return;
    const bowlerName = inn.bowlScores[inn.bowlerIdx]?.name||"";
    const keeper  = inn.bowlingXI.find(n=>(squads[inn.bowlingTeam]||[]).find(p=>p.name===n&&p.role==="WK"))||bowlerName;
    const disStr  = getDisStr(dm.type, dm.fielder||keeper, bowlerName, dm.nonStrikerOut);
    const outIdx  = dm.nonStrikerOut ? inn.nonStrikerIdx : inn.strikerIdx;
    const outName = inn.batScores[outIdx]?.name||"";
    const fielder = dm.fielder || (["c","st","ro"].includes(dm.type)?keeper:"");
    setDm(null);
    applyBall({ outcome:"W", runs:0, isExtra:false, isWide:false, isNB:false, isBye:false, isWicket:true,
      dismissal:disStr, nonStrikerOut:dm.nonStrikerOut, dismissalTypeKey:dm.type,
      fielderName:fielder, dismissedBatter:outName, newBatsmanIdx:dm.newBatsmanIdx });
  };

  /* ── Error banner (all phases) ── */
  const errBanner = apiErr && (
    <div style={{ padding:"10px 14px", background:"#EF444412", border:"1px solid #EF444440", borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ fontSize:12, color:"#EF4444", fontWeight:600, flex:1 }}>⚠️ {apiErr}</span>
      <button onClick={()=>setApiErr(null)} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:14 }}>✕</button>
    </div>
  );

  /* ═══════════════════════════════ RENDER ═════════════ */

  /* ── Match List ─────────────────────────────────────── */
  if(!live) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Live Scoring</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Select a match to start or manage scoring</div>
        </div>
        <button onClick={()=>{ setAddForm({ team1:teams[0]?.name||"", team2:teams[1]?.name||"", venue:"", date:"" }); setShowAdd(true); }}
          style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Match</button>
      </div>

      {errBanner}

      {/* Add Match modal */}
      {showAdd&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ ...CARD, width:420, maxWidth:"100%", padding:28 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Schedule New Match</div>
            {teams.length<2 ? (
              <div style={{ padding:"14px 16px", background:"#F59E0B12", border:"1px solid #F59E0B40", borderRadius:10, marginBottom:20 }}>
                <div style={{ fontSize:13, color:"#F59E0B", fontWeight:700, marginBottom:4 }}>Pehle teams banao</div>
                <div style={{ fontSize:12, color:"#94A3B8", lineHeight:1.5 }}>Match schedule karne ke liye kam se kam 2 teams chahiye. Admin panel ke <b>Teams</b> tab me teams add karo.</div>
              </div>
            ):(
              <>
                {([["Team 1","team1"],["Team 2","team2"]] as const).map(([lbl,key])=>(
                  <div key={key} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>{lbl}</div>
                    <select value={addForm[key]} onChange={e=>setAddForm(f=>({...f,[key]:e.target.value}))} style={SELECT}>
                      {teams.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>Venue</div>
                  <input value={addForm.venue} onChange={e=>setAddForm(f=>({...f,venue:e.target.value}))}
                    placeholder="e.g. City Ground, Delhi"
                    style={{ ...SELECT, boxSizing:"border-box" }}/>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>Date & Time</div>
                  <input type="datetime-local" value={addForm.date} onChange={e=>setAddForm(f=>({...f,date:e.target.value}))}
                    style={{ ...SELECT, boxSizing:"border-box" }}/>
                </div>
              </>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowAdd(false)} style={{ flex:1, padding:11, borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", cursor:"pointer" }}>Cancel</button>
              {teams.length>=2&&(
                <button disabled={saving} onClick={async ()=>{
                  if(saving) return;
                  if(addForm.team1===addForm.team2){ setApiErr("Team 1 aur Team 2 alag hone chahiye."); return; }
                  if(addForm.venue.trim().length<2){ setApiErr("Venue likhna zaroori hai."); return; }
                  setSaving(true);
                  const nextNo = matches.length ? Math.max(...matches.map(m=>m.matchNo||0))+1 : 1;
                  try{
                    const res = await createMatch({
                      matchNo:nextNo, team1:addForm.team1, team2:addForm.team2,
                      venue:addForm.venue.trim(),
                      scheduledAt:addForm.date ? new Date(addForm.date).toISOString() : undefined,
                    });
                    setMatches(ms=>[...ms, {
                      id:Date.now(), dbId:res.match.id, matchNo:nextNo,
                      team1:addForm.team1, team2:addForm.team2, venue:addForm.venue.trim(),
                      date:addForm.date ? new Date(addForm.date).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "TBD",
                      status:"scheduled",
                    }]);
                    setShowAdd(false);
                    setApiErr(null);
                  }catch(e:any){
                    setApiErr("Match save nahi hua: " + (e?.message ?? "error"));
                  }finally{ setSaving(false); }
                }} style={{ flex:1, padding:11, borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:saving?"wait":"pointer", opacity:saving?0.7:1 }}>{saving?"Saving…":"Schedule →"}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length===0&&(
        <div style={{ ...CARD, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏏</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:6 }}>Koi match nahi hai</div>
          <div style={{ fontSize:13, color:"#64748B" }}>"+ Add Match" se naya match schedule karo. Scoring shuru karne se pehle <b>Teams</b> tab me har team ke kam se kam 11 players hone chahiye.</div>
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
                    <div style={{ fontSize:15, fontWeight:800, color:teamColor(m.team1) }}>{m.team1}</div>
                  </div>
                  <div style={{ padding:"6px 14px", background:"#060B18", borderRadius:8, fontWeight:900, fontSize:13, color:"rgba(255,255,255,.3)" }}>VS</div>
                  <div style={{ flex:1, textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:teamColor(m.team2) }}>{m.team2}</div>
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
      {errBanner}
      <div style={{ ...CARD, maxWidth:520 }}>
        <div style={{ fontSize:20, fontWeight:900, color:"#FF6B00", textAlign:"center", marginBottom:6 }}>🪙 Toss</div>
        <div style={{ fontSize:13, color:"#64748B", textAlign:"center", marginBottom:24 }}>{live.def.team1} <span style={{ color:"#475569" }}>vs</span> {live.def.team2} · {live.def.venue}</div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:"#64748B", marginBottom:8, fontWeight:600 }}>TOSS WON BY</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[live.def.team1, live.def.team2].map(t=>(
              <button key={t} onClick={()=>setLive(l=>l?{...l,tossWinner:t}:l)}
                style={{ padding:"14px 12px", borderRadius:10, border:`2px solid ${live.tossWinner===t?teamColor(t):"#1E293B"}`, background:live.tossWinner===t?`${teamColor(t)}18`:"#060B18", color:live.tossWinner===t?teamColor(t):"#64748B", fontWeight:700, fontSize:13, cursor:"pointer", transition:"all .2s" }}>
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
        <button onClick={confirmToss} disabled={saving} style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:14, fontWeight:800, cursor:saving?"wait":"pointer", opacity:saving?0.7:1 }}>
          {saving?"Saving…":"Confirm Toss → Select Playing XI"}
        </button>
      </div>
    </div>
  );

  /* ── Playing XI Selection ────────────────────────────── */
  if(live.phase==="xi") {
    const bat = battingFirst(live);
    const renderXI = (team:string, sel:string[], setSel:React.Dispatch<React.SetStateAction<string[]>>) => {
      const squad = squads[team]||[];
      return (
        <div style={CARD}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:800, color:teamColor(team) }}>{team}</div>
            <span style={{ fontSize:12, color:sel.length===11?"#10B981":"#F59E0B", fontWeight:700 }}>{sel.length}/11 selected</span>
          </div>
          {squadsLoading&&squad.length===0&&(
            <div style={{ fontSize:12, color:"#64748B", padding:"12px 0" }}>Players load ho rahe hain…</div>
          )}
          {!squadsLoading&&squad.length<11&&(
            <div style={{ padding:"12px 14px", background:"#F59E0B12", border:"1px solid #F59E0B40", borderRadius:10, marginBottom:10 }}>
              <div style={{ fontSize:12, color:"#F59E0B", fontWeight:700, marginBottom:4 }}>
                {squad.length===0?"Is team me abhi koi player nahi hai":`Sirf ${squad.length} player${squad.length===1?"":"s"} hai${squad.length===1?"":"n"} — 11 chahiye`}
              </div>
              <div style={{ fontSize:11, color:"#94A3B8", lineHeight:1.5 }}>
                Admin panel ke <b>Teams</b> tab me jaake "{team}" me players add karo (kam se kam 11). Uske baad yahan wapas aake XI select karna.
              </div>
            </div>
          )}
          {squad.map((p,idx)=>{
            const picked = sel.includes(p.name);
            const roleCol = p.role==="WK"?"#F59E0B":p.role==="BOWL"?"#EF4444":p.role==="AR"?"#10B981":"#3B82F6";
            return (
              <div key={idx} onClick={()=>{ setSel(s=>picked?s.filter(n=>n!==p.name):s.length<11?[...s,p.name]:s); }}
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
    };
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <button onClick={()=>setLive(l=>l?{...l,phase:"toss"}:l)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← Back</button>
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>Select Playing XI</div>
          <span style={{ fontSize:11, color:"#64748B" }}>· {live.tossWinner} won toss · {bat} bat first</span>
          <button onClick={()=>loadSquads([live.def.team1, live.def.team2])} disabled={squadsLoading}
            style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#FF6B00", fontSize:11, fontWeight:700, cursor:squadsLoading?"wait":"pointer" }}>
            {squadsLoading?"Loading…":"↻ Refresh players"}
          </button>
        </div>
        {errBanner}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {renderXI(live.def.team1, xi1sel, setXi1sel)}
          {renderXI(live.def.team2, xi2sel, setXi2sel)}
        </div>
        <button onClick={confirmXI} disabled={xi1sel.length!==11||xi2sel.length!==11||saving}
          style={{ padding:14, borderRadius:10, border:"none", background:xi1sel.length===11&&xi2sel.length===11?"linear-gradient(135deg,#FF6B00,#FF8C40)":"#1E293B", color:xi1sel.length===11&&xi2sel.length===11?"#fff":"#475569", fontSize:14, fontWeight:800, cursor:xi1sel.length===11&&xi2sel.length===11&&!saving?"pointer":"not-allowed", opacity:saving?0.7:1 }}>
          {saving?"Saving…":xi1sel.length===11&&xi2sel.length===11?"Confirm XI → Select Openers":"Select 11 players from each team first"}
        </button>
      </div>
    );
  }

  /* ── Openers Selection (both innings) ────────────────── */
  if(live.phase==="openers") {
    const oinn = live.currentInnings===1 ? live.inn1 : live.inn2;
    if(!oinn) return null;
    const valid = opSel.striker!==opSel.nonStriker;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          {live.currentInnings===1
            ? <button onClick={()=>setLive(l=>l?{...l,phase:"xi"}:l)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← Back</button>
            : <button onClick={()=>setLive(null)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← All Matches</button>}
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>Innings {live.currentInnings} · Openers</div>
        </div>
        {errBanner}
        {live.currentInnings===2&&(
          <div style={{ padding:"14px 18px", background:"#F59E0B10", border:"1px solid #F59E0B30", borderRadius:12 }}>
            <span style={{ fontSize:13, color:"#F59E0B", fontWeight:800 }}>
              🔚 Innings break — {live.inn1.battingTeam} {live.inn1.totalRuns}/{live.inn1.totalWickets} ({fmtO(live.inn1.overs,live.inn1.balls)} ov). Target: {oinn.target}
            </span>
          </div>
        )}
        <div style={{ ...CARD, maxWidth:560 }}>
          <div style={{ fontSize:14, fontWeight:800, color:teamColor(oinn.battingTeam), marginBottom:4 }}>{oinn.battingTeam} — batting</div>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:18 }}>Kaun khelega pehle? Striker, non-striker aur opening bowler chuno.</div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>STRIKER (on strike)</div>
            <select value={opSel.striker} onChange={e=>setOpSel(s=>({...s, striker:Number(e.target.value)}))} style={SELECT}>
              {oinn.batScores.map((b,i)=><option key={i} value={i}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>NON-STRIKER</div>
            <select value={opSel.nonStriker} onChange={e=>setOpSel(s=>({...s, nonStriker:Number(e.target.value)}))} style={SELECT}>
              {oinn.batScores.map((b,i)=><option key={i} value={i}>{b.name}</option>)}
            </select>
            {!valid&&<div style={{ fontSize:11, color:"#EF4444", marginTop:5 }}>Striker aur non-striker alag hone chahiye.</div>}
          </div>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, color:"#64748B", marginBottom:5, fontWeight:600 }}>OPENING BOWLER ({oinn.bowlingTeam})</div>
            <select value={opSel.bowler} onChange={e=>setOpSel(s=>({...s, bowler:Number(e.target.value)}))} style={SELECT}>
              {oinn.bowlScores.map((b,i)=><option key={i} value={i}>{b.name}</option>)}
            </select>
          </div>
          <button onClick={startInnings} disabled={!valid}
            style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:valid?"linear-gradient(135deg,#FF6B00,#FF8C40)":"#1E293B", color:valid?"#fff":"#475569", fontSize:14, fontWeight:800, cursor:valid?"pointer":"not-allowed" }}>
            🏏 Start Innings {live.currentInnings} →
          </button>
        </div>
      </div>
    );
  }

  /* ── Dismissal Modal ────────────────────────────────── */
  const renderDismissalModal = () => {
    if(!dm||!inn||!live) return null;
    const fieldingXI = inn.bowlingXI;
    const keeper = fieldingXI.find(n=>(squads[inn.bowlingTeam]||[]).find(p=>p.name===n&&p.role==="WK"))||fieldingXI[0];
    const bowler = inn.bowlScores[inn.bowlerIdx]?.name||"";
    const remaining = inn.batScores.filter((_,i)=>i!==inn.strikerIdx&&i!==inn.nonStrikerIdx&&!inn.batScores[i].dismissal&&!inn.batScores[i].batting);
    const TYPES = [["b","Bowled"],["c","Caught"],["lbw","LBW"],["ro","Run Out"],["st","Stumped"],["hw","Hit Wicket"],["cb","Caught & Bowled"],["rh","Retired Hurt"]] as const;
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ ...CARD, width:"min(540px, 100%)", maxHeight:"90vh", overflowY:"auto" }}>
          <div style={{ fontSize:16, fontWeight:900, color:"#EF4444", marginBottom:4 }}>💥 Wicket!</div>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>
            {dm.nonStrikerOut?inn.batScores[inn.nonStrikerIdx]?.name:inn.batScores[inn.strikerIdx]?.name} — select dismissal details
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
              <select value={dm.fielder} onChange={e=>setDm(d=>d?{...d,fielder:e.target.value}:d)} style={SELECT}>
                <option value="">Select fielder…</option>
                {fieldingXI.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          {dm.type==="ro"&&(
            <>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:700, marginBottom:6 }}>THROWN BY (Fielder)</div>
                <select value={dm.fielder} onChange={e=>setDm(d=>d?{...d,fielder:e.target.value}:d)} style={SELECT}>
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
              <select value={dm.newBatsmanIdx} onChange={e=>setDm(d=>d?{...d,newBatsmanIdx:Number(e.target.value)}:d)} style={SELECT}>
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
              {(dm.nonStrikerOut?inn.batScores[inn.nonStrikerIdx]?.name:inn.batScores[inn.strikerIdx]?.name)} — {getDisStr(dm.type, dm.fielder||keeper, bowler, dm.nonStrikerOut)}
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
  const curInn = live.currentInnings===1 ? live.inn1 : live.inn2;
  if(!curInn) {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setLive(null)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>← All Matches</button>
        </div>
        <div style={{ ...CARD, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏏</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", marginBottom:6 }}>Match setup incomplete</div>
          <div style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Complete the toss and XI selection first to begin live scoring.</div>
          <button onClick={()=>setLive(l=>l?{...l,phase:"toss"}:null)} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, cursor:"pointer" }}>
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
  const isDone    = live.phase==="completed";

  /* Change striker/non-striker with auto-swap if same player picked */
  const setBatIdx = (key:"strikerIdx"|"nonStrikerIdx", idx:number) => {
    setLive(l=>{
      if(!l) return l;
      const cur = l.currentInnings===1?l.inn1:l.inn2!;
      if(!cur) return l;
      const otherKey = key==="strikerIdx"?"nonStrikerIdx":"strikerIdx";
      let upd: InningsState;
      if(cur[otherKey]===idx){
        upd = { ...cur, [key]:idx, [otherKey]:cur[key] } as InningsState;  // swap ends
      }else{
        upd = { ...cur, [key]:idx } as InningsState;
      }
      return l.currentInnings===1?{...l,inn1:upd}:{...l,inn2:upd};
    });
  };

  const renderScorecard = () => {
    const renderBat = (d:InningsState) => (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:teamColor(d.battingTeam) }}>{d.battingTeam}</div>
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
        <div style={{ fontSize:14, fontWeight:800, color:teamColor(d.bowlingTeam), marginBottom:14 }}>Bowling — {d.bowlingTeam}</div>
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
        <button onClick={()=>{ setLive(null); refreshMatches(); }} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:11, cursor:"pointer" }}>← All Matches</button>
        {[["live","🔴 Live"],["scorecard","📋 Scorecard"]] .map(([t,l])=><button key={t} onClick={()=>setMainTab(t as any)} style={TAB(mainTab===t)}>{l}</button>)}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#475569" }}>Match {live.def.matchNo} · Innings {live.currentInnings}</span>
          {isDone&&<span style={PILL("#10B981")}>COMPLETED</span>}
          {live.phase==="live"&&<span style={PILL("#EF4444")}>LIVE</span>}
        </div>
      </div>

      {errBanner}

      {mainTab==="scorecard"&&renderScorecard()}
      {mainTab==="live"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Result banner when completed */}
          {isDone&&(
            <div style={{ ...CARD, borderColor:"#10B98150", textAlign:"center", padding:32 }}>
              <div style={{ fontSize:34, marginBottom:10 }}>🏆</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#10B981", marginBottom:6 }}>{live.resultDesc||"Match completed"}</div>
              <div style={{ fontSize:12, color:"#64748B", marginBottom:18 }}>
                {live.inn1.battingTeam} {live.inn1.totalRuns}/{live.inn1.totalWickets} ({fmtO(live.inn1.overs,live.inn1.balls)}) · {live.inn2?`${live.inn2.battingTeam} ${live.inn2.totalRuns}/${live.inn2.totalWickets} (${fmtO(live.inn2.overs,live.inn2.balls)})`:""}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={()=>setMainTab("scorecard")} style={{ padding:"10px 22px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontWeight:700, fontSize:12, cursor:"pointer" }}>📋 Full Scorecard</button>
                <button onClick={()=>{ setLive(null); refreshMatches(); }} style={{ padding:"10px 22px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:800, fontSize:12, cursor:"pointer" }}>← All Matches</button>
              </div>
            </div>
          )}

          {/* Match header */}
          <div style={{ ...CARD, borderColor:isDone?"#1E293B":"rgba(239,68,68,.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:14 }}>
              <span style={{ fontSize:11, color:"#64748B" }}>📍 {live.def.venue} · {live.def.date}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>
                {live.tossWinner} won toss · elected to {live.tossDec}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              {([
                { d:live.inn1,  label:"1st Innings", suffix:"" },
                { d:live.inn2!, label:"2nd Innings", suffix:live.inn2?.target?` / ${live.inn2.target}`:"" },
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
                { l:"This Over", v:curInn.currentOverDeliveries.reduce((s,d)=>s+(d==="W"?0:d==="4"?4:d==="6"?6:d==="LB"||d==="B"?1:parseInt(d)||0),0).toString(), c:"#F59E0B" },
              ].map(s=>(
                <div key={s.l} style={{ textAlign:"center", background:"#060B18", borderRadius:8, padding:"8px 4px", border:"1px solid #1E293B" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Current over balls */}
            <div style={{ marginTop:10, display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
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

          {/* At crease + Bowler (hidden once completed) */}
          {!isDone&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
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
              {/* Batsman selectors — only players who are not out are selectable */}
              <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:6 }}>
                {([["Striker","strikerIdx"],["Non-Striker","nonStrikerIdx"]] as const).map(([lbl,key])=>(
                  <div key={key}>
                    <div style={{ fontSize:9, color:"#475569", marginBottom:3, fontWeight:700 }}>{lbl.toUpperCase()}</div>
                    <select value={curInn[key]} onChange={e=>setBatIdx(key, Number(e.target.value))}
                      style={{ width:"100%", padding:"6px 8px", background:"#060B18", border:"1px solid #1E293B", borderRadius:7, color:"#F1F5F9", fontSize:11, outline:"none" }}>
                      {curInn.batScores.map((b,i)=>b.dismissal?null:(
                        <option key={i} value={i}>{b.name}</option>
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
          </div>}

          {/* Scoring pad + Commentary (pad hidden once completed) */}
          <div style={{ display:"grid", gridTemplateColumns:isDone?"1fr":"1fr 1fr", gap:14 }}>
            {!isDone&&<div style={CARD}>
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
            </div>}
            <div style={CARD}>
              <div style={{ fontSize:10, color:"#64748B", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Commentary</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input value={customNote} onChange={e=>setCustomNote(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&customNote.trim()){ setCommentary(c=>[`${curInn.overs}.${curInn.balls} — ${customNote.trim()}`,...c].slice(0,30)); setCustomNote(""); }}}
                  placeholder="Type commentary… (Enter)"
                  style={{ flex:1, padding:"8px 10px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#F1F5F9", fontSize:12, outline:"none" }}/>
                <button onClick={()=>{ if(customNote.trim()){ setCommentary(c=>[`${curInn.overs}.${curInn.balls} — ${customNote.trim()}`,...c].slice(0,30)); setCustomNote(""); }}}
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
