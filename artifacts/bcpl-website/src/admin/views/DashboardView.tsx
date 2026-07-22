import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { adminGetStats, adminGetRegistrations } from "../../lib/api";

type Reg = {
  id: string;
  role: string;
  trialCity: string;
  phase1Status: string;
  phase2Status: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string; email: string } | null;
  payment: { status: string; amount: string; paidAt: string | null } | null;
  phase2Payment: { status: string; amount: string; paidAt: string | null; createdAt: string } | null;
  video: { status: string; submittedAt: string } | null;
};

type Stats = {
  registrations: { total:number; paymentDone:number; videoSubmitted:number; selected:number; rejected:number };
  videos: { total:number; pending:number; reviewed:number };
  kyc: { total:number; pending:number; verified:number; failed:number };
  users: { total:number };
};

const PAID_STATUSES = ["payment_done","video_submitted","selected","rejected"];
const isPaid = (r: Reg) => r.payment?.status === "paid" || r.payment?.status === "success" || PAID_STATUSES.includes(r.phase1Status);
const P2_PAID_STATUSES = ["payment_done","kyc_done","selected","rejected"];
const isP2Paid = (r: Reg) => r.phase2Payment?.status === "success" || P2_PAID_STATUSES.includes(r.phase2Status ?? "");

const CITY_COLORS = ["#FF6B00","#F59E0B","#10B981","#6366F1","#3B82F6","#EC4899"];

const sourceData: {name:string,value:number,color:string}[] = [];
const topInfluencers: {name:string,platform:string,clicks:number,signups:number,conversion:string,revenue:string}[] = [];

const activityColor: Record<string,string> = {
  payment:"#10B981", user:"#6366F1", media:"#F59E0B",
  team:"#FF6B00", referral:"#EC4899", match:"#3B82F6",
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const CustomTooltip = ({ active, payload, label }:any) => {
  if(active&&payload&&payload.length) return (
    <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:10, padding:"10px 16px" }}>
      <p style={{ color:"#94A3B8", fontSize:11, margin:"0 0 4px" }}>{label}</p>
      {payload.map((p:any)=>(
        <p key={p.name} style={{ color:p.color, fontSize:14, fontWeight:700, margin:"2px 0" }}>
          {p.name==="actual"?"Actual Revenue":p.name==="target"?"Target":p.value.toLocaleString()+" users"}
          {p.name!=="users"&&`: ₹${p.value.toLocaleString()}`}
        </p>
      ))}
    </div>
  );
  return null;
};

export default function DashboardView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [range, setRange] = useState<"today"|"week"|"month">("week");
  const [blast, setBlast] = useState(false);
  const [stats, setStats] = useState<Stats|null>(null);
  const [regs,  setRegs]  = useState<Reg[]>([]);
  const [err,   setErr]   = useState("");

  useEffect(() => {
    Promise.all([adminGetStats(), adminGetRegistrations()])
      .then(([s, r]) => { setStats(s); setRegs(r.registrations); })
      .catch(e => setErr(e.message));
  }, []);

  const card:React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  /* ── derived data ── */
  const totalUsers   = stats?.users.total ?? 0;
  const totalRegs    = stats?.registrations.total ?? 0;
  const paidRegs     = regs.filter(isPaid);
  const paidCount    = paidRegs.length;
  const p1Revenue    = paidRegs.reduce((a,r)=>a+(r.payment ? Math.round(Number(r.payment.amount)) : 353),0);
  const p2PaidRegs   = regs.filter(isP2Paid);
  const p2Revenue    = p2PaidRegs.reduce((a,r)=>a+(r.phase2Payment ? Math.round(Number(r.phase2Payment.amount)) : 0),0);
  const videosPending = stats?.videos.pending ?? 0;
  const selectedCount = stats?.registrations.selected ?? 0;
  const droppedOff   = regs.filter(r=>!isPaid(r)).length;
  const now = Date.now();
  const activeUsers  = regs.filter(r => now - new Date(r.createdAt).getTime() < 7*24*3600*1000).length;

  const metricCards = [
    { label:"Live Right Now", value:String(regs.filter(r=>now-new Date(r.createdAt).getTime()<3600*1000).length), sub:"registered in last hour", color:"#10B981", icon:"🟢", live:true },
    { label:"Total Users",    value:totalUsers.toLocaleString(), sub:`${totalRegs} registrations`, color:"#6366F1", icon:"👥" },
    { label:"Active Users",   value:activeUsers.toLocaleString(), sub:"registered last 7 days", color:"#3B82F6", icon:"⚡" },
    { label:"Phase 1 Paid",   value:paidCount.toLocaleString(), sub:`₹${p1Revenue.toLocaleString()} revenue`, color:"#F59E0B", icon:"💳" },
    { label:"Phase 2 Paid",   value:p2PaidRegs.length.toLocaleString(), sub:`₹${p2Revenue.toLocaleString()} revenue`, color:"#10B981", icon:"🎫" },
    { label:"Selected",       value:selectedCount.toLocaleString(), sub:"Phase 1 selected players", color:"#FF6B00", icon:"🏆" },
    { label:"Dropped Off",    value:droppedOff.toLocaleString(), sub:"registered, no payment", color:"#EF4444", icon:"❌" },
  ];

  const weekTarget = 5000;
  const weekActual = paidCount;
  const targetPct  = Math.min(100, Math.round((weekActual/weekTarget)*100));

  /* each pending-action card navigates to its admin tab */
  const pendingActions = [
    { icon:"🎬", count:videosPending, label:"Videos pending review", color:"#F59E0B", action:"Review Now", tab:"video_review" },
    { icon:"✅", count:stats?.kyc.pending ?? 0, label:"KYC approvals pending", color:"#6366F1", action:"Approve", tab:"phase2_kyc" },
    { icon:"💳", count:regs.filter(r=>r.payment && r.payment.status==="failed" && !PAID_STATUSES.includes(r.phase1Status)).length, label:"Failed payments to retry", color:"#EF4444", action:"View Failed", tab:"finance" },
    { icon:"📧", count:selectedCount, label:"Scout reports ready to send", color:"#10B981", action:"Send Reports", tab:"phase1_regs" },
  ];

  const funnelData = [
    { name:"Visited",      value:Math.max(totalUsers, totalRegs), color:"#334155" },
    { name:"Registered",   value:totalRegs, color:"#FF6B00" },
    { name:"Phase 1 Paid", value:paidCount, color:"#F59E0B" },
    { name:"Selected",     value:selectedCount, color:"#10B981" },
  ];
  const funnelMax = Math.max(1, ...funnelData.map(f=>f.value));

  /* top cities from registrations */
  const cityMap = new Map<string,{signups:number,paid:number}>();
  for (const r of regs) {
    const city = r.trialCity || "Unknown";
    const e = cityMap.get(city) ?? { signups:0, paid:0 };
    e.signups++; if (isPaid(r)) e.paid++;
    cityMap.set(city, e);
  }
  const maxCity = Math.max(1, ...[...cityMap.values()].map(c=>c.signups));
  const topCities = [...cityMap.entries()]
    .sort((a,b)=>b[1].signups-a[1].signups)
    .slice(0,6)
    .map(([city,c],i)=>({ city, signups:c.signups, paid:c.paid, pct:Math.round((c.signups/maxCity)*100), color:CITY_COLORS[i%CITY_COLORS.length] }));

  /* recent registrations as live activity */
  const liveActivity = [...regs]
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    .slice(0,8)
    .map(r=>({
      msg: `${r.user?.name ?? "Player"} (${r.trialCity || "—"}) ${isPaid(r) ? "paid Phase 1 registration" : "registered — payment pending"}`,
      time: timeAgo(r.createdAt),
      type: isPaid(r) ? "payment" : "user",
    }));

  /* registration growth chart from real createdAt */
  const buildGrowth = (bucketMs:number, buckets:number, fmt:(d:Date)=>string) => {
    const out: {time:string,users:number}[] = [];
    for (let i=buckets-1;i>=0;i--) {
      const start = now - (i+1)*bucketMs, end = now - i*bucketMs;
      out.push({
        time: fmt(new Date(end)),
        users: regs.filter(r=>{const t=new Date(r.createdAt).getTime();return t>=start&&t<end;}).length,
      });
    }
    return out;
  };
  const userGrowthData = {
    today: buildGrowth(3600*1000*3, 8, d=>d.toLocaleTimeString("en-IN",{hour:"numeric"})),
    week:  buildGrowth(24*3600*1000, 7, d=>d.toLocaleDateString("en-IN",{weekday:"short"})),
    month: buildGrowth(24*3600*1000*5, 6, d=>d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})),
  };

  /* daily revenue vs target from paid registrations (Phase 1 + Phase 2) */
  const revenueVsTarget = Array.from({length:7},(_,idx)=>{
    const i = 6-idx;
    const start = now-(i+1)*24*3600*1000, end = now-i*24*3600*1000;
    const p1 = paidRegs
      .filter(r=>{const t=new Date(r.payment?.paidAt ?? r.createdAt).getTime();return t>=start&&t<end;})
      .reduce((a,r)=>a+(r.payment ? Math.round(Number(r.payment.amount)) : 353),0);
    const p2 = p2PaidRegs
      .filter(r=>{const p=r.phase2Payment;if(!p)return false;const t=new Date(p.paidAt ?? p.createdAt).getTime();return t>=start&&t<end;})
      .reduce((a,r)=>a+Math.round(Number(r.phase2Payment!.amount)),0);
    return { day:new Date(end).toLocaleDateString("en-IN",{weekday:"short"}), actual:p1+p2, target:Math.round(weekTarget*353/7) };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {err && (
        <div style={{ padding:"12px 16px", background:"#EF444415", border:"1px solid #EF444444", borderRadius:12, color:"#EF4444", fontSize:13 }}>
          Failed to load dashboard data: {err}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Dashboard</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>BCPL T20 Season 5 · Live overview</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { label:"📢 WhatsApp Blast", action:()=>setBlast(true), style:{ background:"linear-gradient(135deg,#25D366,#128C4E)" }},
            { label:"⬇ Export Data",    action:()=>{
                const headers=["Name","Phone","Email","City","Role","Phase1 Status","Paid"];
                const rows=regs.map(r=>[r.user?.name??"",r.user?.phone??"",r.user?.email??"",r.trialCity??"",r.role??"",r.phase1Status,isPaid(r)?"Yes":"No"]);
                const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
                const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='bcpl_users_'+new Date().toISOString().slice(0,10)+'.csv';a.click();
              }, style:{ background:"#1E293B", color:"#94A3B8", border:"1px solid #1E293B" }},
            { label:"📊 Full Report",   action:()=>window.print(),  style:{ background:"#1E293B", color:"#94A3B8", border:"1px solid #1E293B" }},
          ].map(b=>(
            <button key={b.label} onClick={b.action} style={{ padding:"9px 16px", borderRadius:9, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", ...b.style }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {metricCards.map(m=>(
          <div key={m.label} style={{ ...card, borderLeft:`3px solid ${m.color}`, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:`radial-gradient(circle,${m.color}18 0%,transparent 70%)`, borderRadius:"50%" }}/>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18 }}>{m.icon}</span>
              {m.live&&<span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", boxShadow:"0 0 6px #10B981" }}/><span style={{ fontSize:10, color:"#10B981", fontWeight:700 }}>LIVE</span></span>}
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:"#F1F5F9", letterSpacing:-1 }}>{m.value}</div>
            <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{m.label}</div>
            <div style={{ fontSize:11, color:m.color, marginTop:6, fontWeight:600 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Weekly Target ── */}
      <div style={{ ...card, padding:"16px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>🎯 Registration Target</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{weekActual.toLocaleString()} of {weekTarget.toLocaleString()} paid registrations</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:24, fontWeight:900, color:targetPct>=100?"#10B981":"#FF6B00" }}>{targetPct}%</div>
            <div style={{ fontSize:10, color:"#475569" }}>{Math.max(0,weekTarget-weekActual)} remaining</div>
          </div>
        </div>
        <div style={{ height:10, borderRadius:5, background:"#1E293B", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${targetPct}%`, background:`linear-gradient(90deg,#FF6B00,${targetPct>=100?"#10B981":"#F59E0B"})`, borderRadius:5, transition:"width 1s" }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
          <span style={{ fontSize:10, color:"#334155" }}>0</span>
          <span style={{ fontSize:10, color:"#334155" }}>Target: {weekTarget.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Pending Actions ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {pendingActions.map(a=>(
          <div key={a.label} onClick={()=>onNavigate?.(a.tab)} title={`Open ${a.label}`}
            style={{ ...card, padding:"14px 16px", borderTop:`2px solid ${a.color}`, cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{a.icon}</span>
              <div style={{ width:32, height:32, borderRadius:8, background:a.color+"22", border:`1px solid ${a.color}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16, fontWeight:900, color:a.color }}>{a.count}</span>
              </div>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginBottom:8 }}>{a.label}</div>
            <button onClick={e=>{ e.stopPropagation(); onNavigate?.(a.tab); }}
              style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${a.color}44`, background:a.color+"11", color:a.color, fontSize:11, fontWeight:700, cursor:"pointer" }}>{a.action}</button>
          </div>
        ))}
      </div>

      {/* ── Revenue vs Target chart + Growth chart ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Revenue vs Daily Target</div>
          <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Actual collections vs set targets — last 7 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueVsTarget}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
              <XAxis dataKey="day" stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }}/>
              <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="actual" fill="#FF6B00" radius={[4,4,0,0]} name="actual"/>
              <Bar dataKey="target" fill="#1E293B" radius={[4,4,0,0]} name="target" stroke="#334155" strokeWidth={1}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>User Registration Growth</div>
            <div style={{ display:"flex", gap:5 }}>
              {(["today","week","month"] as const).map(r=>(
                <button key={r} onClick={()=>setRange(r)} style={{ padding:"5px 12px", borderRadius:7, border:"none", cursor:"pointer", background:range===r?"#FF6B00":"#1E293B", color:range===r?"#fff":"#64748B", fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={userGrowthData[range]}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF6B00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
              <XAxis dataKey="time" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
              <YAxis stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
              <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:10 }}/>
              <Area type="monotone" dataKey="users" stroke="#FF6B00" strokeWidth={2.5} fill="url(#ug)" dot={{ fill:"#FF6B00", r:3 }} activeDot={{ r:5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Funnel + Source + City ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {/* Funnel */}
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Registration Funnel</div>
          {funnelData.map((f,i)=>(
            <div key={f.name} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:"#94A3B8" }}>{f.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{f.value.toLocaleString()}</span>
              </div>
              <div style={{ height:6, borderRadius:4, background:"#1E293B", overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, background:f.color, width:`${(f.value/funnelMax)*100}%`, transition:"width 1s ease" }}/>
              </div>
              {i<funnelData.length-1&&f.value>0&&(
                <div style={{ fontSize:10, color:"#334155", marginTop:3 }}>
                  ↓ {Math.round((1-funnelData[i+1].value/f.value)*100)}% dropped
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Traffic Sources */}
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Traffic Sources</div>
          {sourceData.length===0 ? (
            <div style={{ padding:"40px 10px", textAlign:"center", color:"#334155", fontSize:12 }}>Source tracking not configured yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {sourceData.map((s,i)=><Cell key={i} fill={s.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>[`${v}%`,""]} contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                </PieChart>
              </ResponsiveContainer>
              {sourceData.map(s=>(
                <div key={s.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:s.color }}/>
                    <span style={{ fontSize:12, color:"#94A3B8" }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{s.value}%</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Top Cities */}
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Top Cities</div>
          {topCities.length===0 && <div style={{ padding:"30px 10px", textAlign:"center", color:"#334155", fontSize:12 }}>No registrations yet.</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {topCities.map((c,i)=>(
              <div key={c.city}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:c.color }}>#{i+1}</span>
                    <span style={{ fontSize:12, color:"#94A3B8" }}>{c.city}</span>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <span style={{ fontSize:11, color:"#64748B" }}>{c.signups} reg</span>
                    <span style={{ fontSize:11, fontWeight:700, color:c.color }}>{c.paid} paid</span>
                  </div>
                </div>
                <div style={{ height:4, borderRadius:2, background:"#1E293B", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${c.pct}%`, background:c.color, borderRadius:2 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Influencers + Recent Registrations ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Top Influencers</div>
          {topInfluencers.length===0 && <div style={{ padding:"30px 10px", textAlign:"center", color:"#334155", fontSize:12 }}>Influencer tracking not configured yet.</div>}
          {topInfluencers.length>0 && (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1E293B" }}>
                {["Influencer","Platform","Conv %","Revenue"].map(h=>(
                  <th key={h} style={{ padding:"6px 8px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topInfluencers.map(inf=>(
                <tr key={inf.name} style={{ borderBottom:"1px solid #0F1B2D" }}>
                  <td style={{ padding:"11px 8px", fontSize:12, fontWeight:600, color:"#F1F5F9" }}>@{inf.name}</td>
                  <td style={{ padding:"11px 8px" }}>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5,
                      background:(inf.platform==="Instagram"?"#E1306C":inf.platform==="YouTube"?"#FF0000":"#25D366")+"22",
                      color:inf.platform==="Instagram"?"#E1306C":inf.platform==="YouTube"?"#FF0000":"#25D366", fontWeight:700 }}>{inf.platform}</span>
                  </td>
                  <td style={{ padding:"11px 8px", fontSize:13, fontWeight:700, color:"#F59E0B" }}>{inf.conversion}</td>
                  <td style={{ padding:"11px 8px", fontSize:13, fontWeight:700, color:"#10B981" }}>{inf.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Recent Registrations</div>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#10B981" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", boxShadow:"0 0 5px #10B981" }}/>
              Live
            </span>
          </div>
          {liveActivity.length===0 && <div style={{ padding:"30px 10px", textAlign:"center", color:"#334155", fontSize:12 }}>No registrations yet.</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {liveActivity.map((a,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderBottom:i<liveActivity.length-1?"1px solid #0F1B2D":"none" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:activityColor[a.type], marginTop:4, flexShrink:0, boxShadow:`0 0 4px ${activityColor[a.type]}` }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#94A3B8" }}>{a.msg}</div>
                  <div style={{ fontSize:10, color:"#334155", marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp Blast Modal */}
      {blast&&(
        <div style={{ position:"fixed", inset:0, background:"#00000090", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:460 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>📢 WhatsApp Blast</div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:20 }}>Send bulk message to filtered users</div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Target Segment</label>
              <select style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                {[
                  `All registered users (${totalRegs})`,
                  `Phase 1 paid — no video (${regs.filter(r=>isPaid(r)&&!r.video).length})`,
                  `Registered — no payment (${droppedOff})`,
                  `Phase 1 selected (${selectedCount})`,
                  "Specific city",
                ].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Message</label>
              <textarea rows={4} placeholder="Type your WhatsApp message…" style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
            </div>
            <div style={{ padding:"10px 14px", background:"#F59E0B11", border:"1px solid #F59E0B33", borderRadius:10, marginBottom:16 }}>
              <span style={{ fontSize:12, color:"#F59E0B" }}>⚠️ Sending requires Interakt API setup. Configure in Settings → Integrations.</span>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setBlast(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#25D366,#128C4E)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Send Blast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
