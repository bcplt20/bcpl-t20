import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const userGrowthData = {
  today: [
    { time:"12am", users:4 }, { time:"2am", users:2 }, { time:"4am", users:1 },
    { time:"6am", users:8 }, { time:"8am", users:24 }, { time:"10am", users:41 },
    { time:"12pm", users:63 }, { time:"2pm", users:55 }, { time:"4pm", users:78 },
    { time:"6pm", users:94 }, { time:"8pm", users:112 }, { time:"10pm", users:87 },
  ],
  week: [
    { time:"Mon", users:312 }, { time:"Tue", users:428 }, { time:"Wed", users:389 },
    { time:"Thu", users:512 }, { time:"Fri", users:601 }, { time:"Sat", users:743 },
    { time:"Sun", users:689 },
  ],
  month: [
    { time:"Jul 1", users:120 }, { time:"Jul 5", users:340 }, { time:"Jul 8", users:280 },
    { time:"Jul 10", users:520 }, { time:"Jul 13", users:690 }, { time:"Jul 15", users:870 },
    { time:"Jul 17", users:1020 }, { time:"Jul 19", users:1340 }, { time:"Jul 20", users:1180 },
  ],
};

const revenueVsTarget = [
  { day:"Jul 14", actual:16600, target:15000 }, { day:"Jul 15", actual:26500, target:20000 },
  { day:"Jul 16", actual:19800, target:20000 }, { day:"Jul 17", actual:31500, target:25000 },
  { day:"Jul 18", actual:43100, target:30000 }, { day:"Jul 19", actual:50100, target:35000 },
  { day:"Jul 20", actual:36000, target:35000 },
];

const funnelData = [
  { name:"Visited", value:14820, color:"#334155" },
  { name:"Registered", value:8430, color:"#FF6B00" },
  { name:"Phase 1 Paid", value:3812, color:"#F59E0B" },
  { name:"Phase 2 Paid", value:1247, color:"#10B981" },
];

const sourceData = [
  { name:"WhatsApp", value:38, color:"#25D366" },
  { name:"Instagram", value:27, color:"#E1306C" },
  { name:"YouTube", value:18, color:"#FF0000" },
  { name:"Direct", value:10, color:"#6366F1" },
  { name:"Others", value:7, color:"#64748B" },
];

const topInfluencers = [
  { name:"Rohit_Cricket22", platform:"Instagram", clicks:4821, signups:1243, conversion:"25.8%", revenue:"₹1,24,300" },
  { name:"BCPLOfficial",     platform:"YouTube",   clicks:3200, signups:987,  conversion:"30.8%", revenue:"₹98,700"  },
  { name:"CricketDhamaka",   platform:"WhatsApp",  clicks:2890, signups:743,  conversion:"25.7%", revenue:"₹74,300"  },
  { name:"SportsBhai",        platform:"Instagram", clicks:1980, signups:412,  conversion:"20.8%", revenue:"₹41,200"  },
];

const topCities = [
  { city:"Mumbai",    signups:1240, paid:842, pct:68, color:"#3B82F6"  },
  { city:"Delhi",     signups:1080, paid:712, pct:66, color:"#6366F1"  },
  { city:"Bengaluru", signups:890,  paid:567, pct:64, color:"#EF4444"  },
  { city:"Hyderabad", signups:720,  paid:418, pct:58, color:"#16A34A"  },
  { city:"Chennai",   signups:640,  paid:352, pct:55, color:"#2563EB"  },
];

const liveActivity = [
  { msg:"Arjun Sharma completed Phase 1 payment",   time:"2s ago",  type:"payment"  },
  { msg:"New user registered from Rajasthan",         time:"14s ago", type:"user"     },
  { msg:"Priya Patel uploaded selection video",       time:"32s ago", type:"media"    },
  { msg:"Team Kolkata Tigers added 2 players",        time:"1m ago",  type:"team"     },
  { msg:"Referral BCPL-INF12 → 5 new signups",        time:"2m ago",  type:"referral" },
  { msg:"Rahul Kumar Phase 2 payment confirmed",      time:"3m ago",  type:"payment"  },
  { msg:"New user registered from Maharashtra",       time:"4m ago",  type:"user"     },
  { msg:"Match Gujarat vs Rajasthan scheduled",       time:"6m ago",  type:"match"    },
];

const pendingActions = [
  { icon:"🎬", count:142, label:"Videos pending review",     color:"#F59E0B", action:"Review Now"   },
  { icon:"✅", count:38,  label:"KYC approvals pending",      color:"#6366F1", action:"Approve"      },
  { icon:"💳", count:24,  label:"Failed payments to retry",   color:"#EF4444", action:"View Failed"  },
  { icon:"📧", count:8,   label:"Scout reports ready to send",color:"#10B981", action:"Send Reports" },
];

const activityColor: Record<string,string> = {
  payment:"#10B981", user:"#6366F1", media:"#F59E0B",
  team:"#FF6B00", referral:"#EC4899", match:"#3B82F6",
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

export default function DashboardView() {
  const [range, setRange] = useState<"today"|"week"|"month">("week");
  const [blast, setBlast] = useState(false);

  const card:React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  const metricCards = [
    { label:"Live Right Now", value:"247",  sub:"+12 in last 5m",        color:"#10B981", icon:"🟢", live:true  },
    { label:"Total Users",    value:"8,430",sub:"+124 today",             color:"#6366F1", icon:"👥"             },
    { label:"Active Users",   value:"3,218",sub:"last 7 days",            color:"#3B82F6", icon:"⚡"             },
    { label:"Phase 1 Paid",   value:"3,812",sub:"₹3,81,200 revenue",      color:"#F59E0B", icon:"💳"             },
    { label:"Phase 2 Paid",   value:"1,247",sub:"₹2,49,400 revenue",      color:"#FF6B00", icon:"🏆"             },
    { label:"Dropped Off",    value:"4,618",sub:"registered, no payment", color:"#EF4444", icon:"❌"             },
  ];

  const weekTarget = 5000;
  const weekActual = 3812;
  const targetPct  = Math.min(Math.round(weekActual/weekTarget*100),100);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* ── Quick Actions ── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Dashboard</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>BCPL T20 Season 5 · Live overview</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { label:"📢 WhatsApp Blast", action:()=>setBlast(true), style:{ background:"linear-gradient(135deg,#25D366,#128C4E)" }},
            { label:"⬇ Export Data",    action:()=>{},              style:{ background:"#1E293B", color:"#94A3B8", border:"1px solid #1E293B" }},
            { label:"📊 Full Report",   action:()=>{},              style:{ background:"#1E293B", color:"#94A3B8", border:"1px solid #1E293B" }},
          ].map(b=>(
            <button key={b.label} onClick={b.action} style={{ padding:"9px 16px", borderRadius:9, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", ...b.style }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
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
            <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>🎯 Weekly Registration Target</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{weekActual.toLocaleString()} of {weekTarget.toLocaleString()} paid registrations · Week Jul 14–20</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:24, fontWeight:900, color:targetPct>=100?"#10B981":"#FF6B00" }}>{targetPct}%</div>
            <div style={{ fontSize:10, color:"#475569" }}>{weekTarget-weekActual} remaining</div>
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
          <div key={a.label} style={{ ...card, padding:"14px 16px", borderTop:`2px solid ${a.color}`, cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{a.icon}</span>
              <div style={{ width:32, height:32, borderRadius:8, background:a.color+"22", border:`1px solid ${a.color}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:16, fontWeight:900, color:a.color }}>{a.count}</span>
              </div>
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginBottom:8 }}>{a.label}</div>
            <button style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${a.color}44`, background:a.color+"11", color:a.color, fontSize:11, fontWeight:700, cursor:"pointer" }}>{a.action}</button>
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
                <div style={{ height:"100%", borderRadius:4, background:f.color, width:`${(f.value/14820)*100}%`, transition:"width 1s ease" }}/>
              </div>
              {i<funnelData.length-1&&(
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
        </div>

        {/* Top Cities */}
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Top Cities</div>
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

      {/* ── Influencers + Live Activity ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={card}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Top Influencers</div>
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
        </div>

        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Live Activity</div>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#10B981" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", boxShadow:"0 0 5px #10B981" }}/>
              Live
            </span>
          </div>
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
                {["All registered users (8,430)","Phase 1 paid — no video (922)","Registered — no payment (4,618)","Phase 2 selected (1,247)","Specific city"].map(o=><option key={o}>{o}</option>)}
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
