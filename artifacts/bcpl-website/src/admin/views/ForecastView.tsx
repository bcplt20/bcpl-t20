import { useState } from "react";

type MonthEntry = { month:string; actual:number; target:number; revenue:number };
// Actuals start at 0; targets are editable
const INIT_MONTHLY: MonthEntry[] = [
  { month:"Jul",   actual:0, target:500,  revenue:0 },
  { month:"Aug",   actual:0, target:1500, revenue:0 },
  { month:"Sep",   actual:0, target:2000, revenue:0 },
  { month:"Oct",   actual:0, target:2000, revenue:0 },
];

const SCENARIOS = [
  { label:"Conservative", multiplier:0.85, color:"#EF4444" },
  { label:"Expected",     multiplier:1.00, color:"#F59E0B" },
  { label:"Optimistic",   multiplier:1.20, color:"#10B981" },
];

export default function ForecastView() {
  const [goal,      setGoal]      = useState(6000);
  const [avgRev,    setAvgRev]    = useState(299);
  const [daysLeft,  setDaysLeft]  = useState(180);
  const [scenario,  setScenario]  = useState(1);
  const [editGoal,  setEditGoal]  = useState(false);
  const [monthly,   setMonthly]   = useState<MonthEntry[]>(INIT_MONTHLY);
  const [addOpen,   setAddOpen]   = useState(false);
  const [editIdx,   setEditIdx]   = useState<number|null>(null);
  const [addForm,   setAddForm]   = useState({ month:"", target:"", actual:"" });

  const totalActual   = monthly.reduce((a,m)=>a+m.actual,0);
  const totalTarget   = monthly.reduce((a,m)=>a+m.target,0);
  const pct           = Math.round(totalActual/goal*100);
  const remaining     = goal - totalActual;
  const dailyNeeded   = Math.ceil(remaining / Math.max(daysLeft,1));
  const projTotal     = Math.round(totalActual + (dailyNeeded * daysLeft * SCENARIOS[scenario].multiplier));
  const projRevenue   = projTotal * avgRev;

  const maxBar = Math.max(...monthly.map(m=>Math.max(m.actual,m.target)), 1);
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Revenue Forecasting</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Season 5 trajectory — actual vs target with scenario planning</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setAddOpen(true)} style={{padding:"9px 16px",borderRadius:9,border:"1px solid #FF6B00",background:"#FF6B0018",color:"#FF6B00",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Month</button>
          <button onClick={()=>{ const rows=monthly.map(m=>`${m.month},${m.actual},${m.target},${m.revenue}`).join('\n'); const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,Month,Actual,Target,Revenue\n'+rows;a.download='bcpl_forecast.csv';a.click(); }} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇ Export</button>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Registered So Far",  value:totalActual.toLocaleString(), sub:`of ${goal.toLocaleString()} goal`, color:"#FF6B00"},
          {label:"Revenue So Far",     value:`₹${(monthly.reduce((a,m)=>a+m.revenue,0)/100000).toFixed(1)}L`, sub:"Phase 1 only",color:"#10B981"},
          {label:"Daily Pace Needed",  value:dailyNeeded, sub:`next ${daysLeft} days`,color:"#6366F1"},
          {label:"Projected Final",    value:projTotal.toLocaleString(), sub:SCENARIOS[scenario].label,color:SCENARIOS[scenario].color},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#F1F5F9",fontWeight:600,marginTop:4}}>{s.label}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress ring + controls */}
      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
        <div style={{...card,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{width:140,height:140,borderRadius:"50%",background:`conic-gradient(#FF6B00 ${pct*3.6}deg,#1E293B 0)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:110,height:110,borderRadius:"50%",background:"#0A1020",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
              <span style={{fontSize:28,fontWeight:900,color:"#FF6B00"}}>{pct}%</span>
              <span style={{fontSize:10,color:"#475569"}}>of goal</span>
            </div>
          </div>
          <div style={{width:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,color:"#64748B"}}>Season Goal</span>
              <span style={{fontSize:11,fontWeight:700,color:"#F1F5F9"}}>{goal.toLocaleString()}</span>
            </div>
            <input type="range" min={3000} max={10000} step={500} value={goal} onChange={e=>setGoal(+e.target.value)}
              style={{width:"100%",accentColor:"#FF6B00",cursor:"pointer"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <span style={{fontSize:11,color:"#64748B"}}>Avg Revenue/Registration</span>
              <span style={{fontSize:11,fontWeight:700,color:"#F1F5F9"}}>₹{avgRev}</span>
            </div>
            <input type="range" min={250} max={500} step={10} value={avgRev} onChange={e=>setAvgRev(+e.target.value)}
              style={{width:"100%",accentColor:"#10B981",cursor:"pointer",marginTop:6}}/>
          </div>
        </div>

        {/* Bar chart */}
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9"}}>Monthly Registrations — Actual vs Target</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:2,background:"#FF6B00"}}/><span style={{fontSize:11,color:"#64748B"}}>Actual</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:10,height:10,borderRadius:2,background:"#1E3A5F"}}/><span style={{fontSize:11,color:"#64748B"}}>Target</span></div>
            </div>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"flex-end",height:180}}>
            {monthly.map((m,i)=>(
              <div key={i} style={{flex:1,display:"flex",gap:3,alignItems:"flex-end",height:"100%",position:"relative"}} title={`Target: ${m.target} | Actual: ${m.actual}`}>
                <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",gap:2}}>
                  <div style={{background:m.actual>0?"#FF6B00":"#FF6B0030",borderRadius:"4px 4px 0 0",height:`${(m.actual/maxBar)*160}px`,minHeight:m.actual>0?4:0,transition:"height .4s"}}/>
                  <div style={{background:"#1E3A5F",borderRadius:"4px 4px 0 0",height:`${(m.target/maxBar)*160}px`,opacity:0.7}}/>
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:3,marginTop:6}}>
                    <span style={{fontSize:9,color:"#475569",whiteSpace:"nowrap"}}>{m.month}</span>
                    <button onClick={()=>{setEditIdx(i);setAddForm({month:m.month,target:String(m.target),actual:String(m.actual)});setAddOpen(true);}}
                      style={{fontSize:8,padding:"1px 4px",borderRadius:3,border:"1px solid #1E293B",background:"transparent",color:"#475569",cursor:"pointer"}}>✏</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>Scenario Planning</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {SCENARIOS.map((s,i)=>(
            <div key={i} onClick={()=>setScenario(i)} style={{padding:"18px",borderRadius:12,border:`2px solid ${scenario===i?s.color:s.color+"30"}`,background:scenario===i?`${s.color}12`:"transparent",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:s.color,marginBottom:10}}>{s.label}</div>
              <div style={{fontSize:28,fontWeight:900,color:s.color}}>{Math.round(projTotal*s.multiplier/SCENARIOS[scenario].multiplier).toLocaleString()}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:4}}>projected registrations</div>
              <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:8}}>₹{((Math.round(projTotal*s.multiplier/SCENARIOS[scenario].multiplier)*avgRev)/100000).toFixed(1)}L</div>
              <div style={{fontSize:10,color:"#475569"}}>projected revenue</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:"12px 16px",background:"#060B18",borderRadius:10,border:"1px solid #1E293B"}}>
          <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.6}}>
            💡 At current pace of <strong style={{color:"#FF6B00"}}>{Math.round(totalActual/62)} registrations/day</strong>, you need <strong style={{color:"#10B981"}}>{dailyNeeded}/day</strong> to hit the {goal.toLocaleString()} goal by Season 5 start (in {daysLeft} days).
            Estimated Phase 1 revenue at ₹{avgRev}/reg: <strong style={{color:"#10B981"}}>₹{(projRevenue/100000).toFixed(1)}L</strong>.
          </div>
        </div>
      </div>

      {/* Add / Edit Month Modal */}
      {addOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setAddOpen(false);setEditIdx(null);setAddForm({month:"",target:"",actual:""});}}>
          <div style={{...card,width:400,padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#F1F5F9",marginBottom:20}}>{editIdx!==null?"✏ Edit Month Target":"+ Add Forecast Month"}</div>
            {[
              {label:"Month Name",key:"month",type:"text",placeholder:"e.g. Nov"},
              {label:"Registration Target",key:"target",type:"number",placeholder:"e.g. 2000"},
              {label:"Actual Registrations",key:"actual",type:"number",placeholder:"e.g. 0"},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase"}}>{f.label}</label>
                <input type={f.type} value={addForm[f.key as keyof typeof addForm]} onChange={e=>setAddForm(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder}
                  style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              {editIdx!==null&&(
                <button onClick={()=>{ setMonthly(m=>m.filter((_,i)=>i!==editIdx)); setAddOpen(false);setEditIdx(null);setAddForm({month:"",target:"",actual:""}); }}
                  style={{padding:"11px 16px",borderRadius:10,border:"1px solid #EF444444",background:"transparent",color:"#EF4444",fontSize:12,cursor:"pointer",fontWeight:700}}>🗑 Remove</button>
              )}
              <button onClick={()=>{setAddOpen(false);setEditIdx(null);setAddForm({month:"",target:"",actual:""}); }} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{
                if(!addForm.month.trim()||!addForm.target) return;
                const entry:MonthEntry={month:addForm.month.trim(),target:parseInt(addForm.target)||0,actual:parseInt(addForm.actual)||0,revenue:(parseInt(addForm.actual)||0)*avgRev};
                if(editIdx!==null){ setMonthly(m=>m.map((x,i)=>i===editIdx?entry:x)); }
                else { setMonthly(m=>[...m,entry]); }
                setAddOpen(false);setEditIdx(null);setAddForm({month:"",target:"",actual:""});
              }} disabled={!addForm.month.trim()||!addForm.target}
                style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",opacity:addForm.month.trim()&&addForm.target?1:0.5}}>
                {editIdx!==null?"Save Changes":"Add Month"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
