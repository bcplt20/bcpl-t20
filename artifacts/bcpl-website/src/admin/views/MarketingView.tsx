import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, FunnelChart, Funnel, Cell, LabelList } from "recharts";

const referralLinks = [
  { code:"BCPL-INF01", name:"Rohit_Cricket22",  platform:"Instagram", clicks:4821, signups:1243, paid:987,  revenue:1243*299, active:true  },
  { code:"BCPL-INF02", name:"BCPLOfficial",      platform:"YouTube",   clicks:3200, signups:987,  paid:743,  revenue:987*299,  active:true  },
  { code:"BCPL-INF03", name:"CricketDhamaka",    platform:"WhatsApp",  clicks:2890, signups:743,  paid:612,  revenue:743*299,  active:true  },
  { code:"BCPL-INF04", name:"SportsBhai",         platform:"Instagram", clicks:1980, signups:412,  paid:298,  revenue:412*299,  active:false },
  { code:"BCPL-INF05", name:"RajCricket",         platform:"YouTube",   clicks:1540, signups:289,  paid:201,  revenue:289*299,  active:true  },
];

const platformPerf = [
  { platform:"WhatsApp", signups:3200, revenue:320000, cac:18 },
  { platform:"Instagram", signups:2100, revenue:210000, cac:24 },
  { platform:"YouTube",  signups:1800, revenue:180000, cac:31 },
  { platform:"Twitter",  signups:420,  revenue:42000,  cac:58 },
  { platform:"Facebook", signups:310,  revenue:31000,  cac:62 },
  { platform:"Direct",   signups:600,  revenue:60000,  cac:0  },
];

const conversionTrend = [
  { day:"Jul 14", rate:14, spend:4200 }, { day:"Jul 15", rate:17, spend:5100 },
  { day:"Jul 16", rate:15, spend:3800 }, { day:"Jul 17", rate:22, spend:6600 },
  { day:"Jul 18", rate:19, spend:5700 }, { day:"Jul 19", rate:26, spend:7800 },
  { day:"Jul 20", rate:24, spend:7200 },
];

const funnelStages = [
  { name:"Visited Landing Page", value:14820, color:"#334155", pct:100 },
  { name:"Started Registration", value:8430,  color:"#6366F1", pct:57  },
  { name:"Phone OTP Verified",   value:6210,  color:"#3B82F6", pct:42  },
  { name:"Phase 1 Paid",         value:3812,  color:"#F59E0B", pct:26  },
  { name:"Video Uploaded",       value:2890,  color:"#FF6B00", pct:20  },
  { name:"Phase 2 Selected",     value:1247,  color:"#10B981", pct:8.4 },
];

const campaigns = [
  { name:"Season 5 Launch",   channel:"WhatsApp+Insta", budget:50000,  spent:41200,  leads:2840, conv:"22%", status:"active",   roi:"+314%"  },
  { name:"Ganguly Reel Push", channel:"Instagram",       budget:30000,  spent:30000,  leads:1420, conv:"18%", status:"completed", roi:"+182%"  },
  { name:"YouTube Cricket",    channel:"YouTube",         budget:25000,  spent:18700,  leads:890,  conv:"15%", status:"active",   roi:"+128%"  },
  { name:"WhatsApp Blast #3", channel:"WhatsApp",        budget:8000,   spent:8000,   leads:640,  conv:"31%", status:"completed", roi:"+452%"  },
  { name:"Google Search",      channel:"Google Ads",      budget:40000,  spent:22000,  leads:380,  conv:"8%",  status:"active",   roi:"+48%"   },
];

const platformColor: Record<string,string> = {
  Instagram:"#E1306C", YouTube:"#FF0000", WhatsApp:"#25D366",
  Twitter:"#1DA1F2", Facebook:"#1877F2", Direct:"#6366F1", "Google Ads":"#4285F4",
};

const abTests = [
  { name:"Hero CTA Text",       varA:"Register Now — ₹299", varB:"Start Your Journey", convA:24.2, convB:19.8, winner:"A", status:"done"   },
  { name:"Pricing Section",     varA:"Phase 1 first",       varB:"Full journey first",  convA:21.4, convB:26.1, winner:"B", status:"done"   },
  { name:"Ganguly Quote",       varA:"Top of page",         varB:"After stats",         convA:22.8, convB:22.1, winner:"A", status:"running"},
  { name:"Mobile CTA Button",   varA:"Fixed bottom",        varB:"Inline only",         convA:31.2, convB:18.4, winner:"A", status:"done"   },
];

export default function MarketingView() {
  const [tab,        setTab]        = useState<"funnel"|"referrals"|"platforms"|"campaigns"|"abtest">("funnel");
  const [showCreate, setShowCreate] = useState(false);
  const [newLink,    setNewLink]    = useState({ name:"", platform:"Instagram", code:"" });

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  const totalRevenue = referralLinks.reduce((a,r)=>a+r.revenue,0);
  const totalSignups = referralLinks.reduce((a,r)=>a+r.signups,0);
  const totalClicks  = referralLinks.reduce((a,r)=>a+r.clicks,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Marketing & Growth</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Full-funnel analytics — from impression to franchise auction</div>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          + Create Referral Link
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Referral Clicks", value:totalClicks.toLocaleString(),   icon:"🔗", color:"#6366F1" },
          { label:"Signups via Referral",  value:totalSignups.toLocaleString(),  icon:"👥", color:"#10B981" },
          { label:"Referral Revenue",      value:`₹${totalRevenue.toLocaleString()}`, icon:"💰", color:"#FF6B00" },
          { label:"Funnel Drop (Reg→Pay)", value:"54.8%",                        icon:"📉", color:"#EF4444" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderLeft:`3px solid ${s.color}` }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#F1F5F9", marginTop:8 }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {([["funnel","🔻 Funnel"],["referrals","🔗 Referrals"],["platforms","📊 Platforms"],["campaigns","🎯 Campaigns"],["abtest","🧪 A/B Tests"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} style={{ padding:"9px 18px", borderRadius:10, border:"1px solid", borderColor:tab===t?"#FF6B00":"#1E293B", background:tab===t?"#FF6B0022":"transparent", color:tab===t?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── FUNNEL TAB ── */}
      {tab==="funnel"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Funnel visual */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Registration Funnel</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:20 }}>From first visit to franchise selection</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {funnelStages.map((f,i)=>{
                  const drop = i>0?Math.round((1-f.value/funnelStages[i-1].value)*100):0;
                  return (
                    <div key={f.name}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:22, height:22, borderRadius:6, background:f.color+"33", border:`1px solid ${f.color}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:10, fontWeight:800, color:f.color }}>{i+1}</span>
                          </div>
                          <span style={{ fontSize:12, color:"#94A3B8" }}>{f.name}</span>
                        </div>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          {drop>0&&<span style={{ fontSize:10, color:"#EF4444", fontWeight:700 }}>-{drop}%</span>}
                          <span style={{ fontSize:13, fontWeight:800, color:"#F1F5F9" }}>{f.value.toLocaleString()}</span>
                          <span style={{ fontSize:10, color:f.color, fontWeight:700, width:32, textAlign:"right" }}>{f.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:8, borderRadius:4, background:"#1E293B", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${f.pct}%`, background:`linear-gradient(90deg,${f.color},${f.color}aa)`, borderRadius:4, transition:"width 1s" }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drop-off analysis */}
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Drop-off Analysis</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Where are users leaving?</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { stage:"Register → OTP",      lost:2220, reason:"Phone number issues / didn't receive OTP",          action:"Add retry button + alternate verification" },
                  { stage:"OTP → Phase 1 Pay",   lost:2398, reason:"Price hesitation after seeing ₹299",                action:"Add trust badges + testimonials on checkout" },
                  { stage:"Pay → Video Upload",  lost:922,  reason:"Didn't know how to record cricket video",           action:"Add video guide + WhatsApp support link" },
                  { stage:"Video → Selection",   lost:1643, reason:"Normal funnel — scouts reviewing",                  action:"Send acknowledgement email within 24h" },
                ].map(d=>(
                  <div key={d.stage} style={{ padding:"12px 14px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{d.stage}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#EF4444" }}>-{d.lost.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:6 }}>🔍 {d.reason}</div>
                    <div style={{ fontSize:11, color:"#10B981" }}>💡 {d.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CAC + LTV */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Avg CAC",        value:"₹28",   sub:"Cost per acquisition (all channels)", color:"#3B82F6", icon:"🎯" },
              { label:"Phase 1 LTV",    value:"₹299",  sub:"Revenue per Phase 1 player",          color:"#F59E0B", icon:"💳" },
              { label:"Phase 2 LTV",    value:"₹2,299",sub:"Revenue if selected (avg)",           color:"#10B981", icon:"🏆" },
              { label:"Blended ROAS",   value:"6.8×",  sub:"Return on ad spend (7-day avg)",       color:"#FF6B00", icon:"📈" },
            ].map(s=>(
              <div key={s.label} style={{ ...card, borderTop:`2px solid ${s.color}` }}>
                <div style={{ fontSize:22 }}>{s.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:8 }}>{s.value}</div>
                <div style={{ fontSize:12, color:"#F1F5F9", marginTop:3, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Conversion trend */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Daily Conversion Rate & Ad Spend</div>
            <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Reg → Pay conversion % vs daily marketing spend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                <XAxis dataKey="day" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                <YAxis yAxisId="rate" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }} tickFormatter={v=>`${v}%`}/>
                <YAxis yAxisId="spend" orientation="right" stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#FF6B00" strokeWidth={2.5} dot={{ fill:"#FF6B00", r:4 }} name="Conv %"/>
                <Line yAxisId="spend" type="monotone" dataKey="spend" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 3" dot={{ fill:"#6366F1", r:3 }} name="Ad Spend"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── REFERRALS TAB ── */}
      {tab==="referrals"&&(
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Referral Links</div>
            <span style={{ fontSize:11, color:"#64748B" }}>{referralLinks.filter(r=>r.active).length} active</span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1E293B" }}>
                {["Code","Influencer","Platform","Clicks","Signups","Paid","Revenue","Conv %","Status","Actions"].map(h=>(
                  <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referralLinks.map(r=>(
                <tr key={r.code} style={{ borderBottom:"1px solid #0F1B2D" }}>
                  <td style={{ padding:"13px 10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontFamily:"monospace", fontSize:11, color:"#FF6B00", background:"#FF6B0015", padding:"3px 8px", borderRadius:6, fontWeight:700 }}>{r.code}</span>
                      <button onClick={()=>navigator.clipboard?.writeText(`https://bcplt20.com/r/${r.code}`)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#475569" }}>📋</button>
                    </div>
                  </td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>@{r.name}</td>
                  <td style={{ padding:"13px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:(platformColor[r.platform]||"#6366F1")+"22", color:platformColor[r.platform]||"#6366F1" }}>{r.platform}</span></td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#94A3B8" }}>{r.clicks.toLocaleString()}</td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>{r.signups.toLocaleString()}</td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#10B981", fontWeight:600 }}>{r.paid.toLocaleString()}</td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#FF6B00", fontWeight:700 }}>₹{r.revenue.toLocaleString()}</td>
                  <td style={{ padding:"13px 10px", fontSize:13, color:"#F59E0B", fontWeight:700 }}>{Math.round(r.signups/r.clicks*100)}%</td>
                  <td style={{ padding:"13px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:r.active?"#10B98122":"#64748B22", color:r.active?"#10B981":"#64748B" }}>{r.active?"Active":"Paused"}</span></td>
                  <td style={{ padding:"13px 10px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Edit</button>
                      <button style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>{r.active?"Pause":"Resume"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PLATFORMS TAB ── */}
      {tab==="platforms"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Signups by Platform</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false}/>
                <XAxis type="number" stroke="#334155" tick={{ fill:"#64748B", fontSize:11 }}/>
                <YAxis dataKey="platform" type="category" stroke="#334155" tick={{ fill:"#94A3B8", fontSize:12 }} width={80}/>
                <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }}/>
                <Bar dataKey="signups" fill="#FF6B00" radius={[0,6,6,0]} name="Signups"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Revenue by Platform</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={platformPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false}/>
                <XAxis type="number" stroke="#334155" tick={{ fill:"#64748B", fontSize:10 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <YAxis dataKey="platform" type="category" stroke="#334155" tick={{ fill:"#94A3B8", fontSize:12 }} width={80}/>
                <Tooltip contentStyle={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:8 }} formatter={(v:any)=>[`₹${v.toLocaleString()}`,"Revenue"]}/>
                <Bar dataKey="revenue" fill="#10B981" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, gridColumn:"1/-1" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>CAC by Platform (₹ per paid user)</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {platformPerf.map(p=>(
                <div key={p.platform} style={{ flex:"1 1 140px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B", padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:12, color:platformColor[p.platform]||"#6366F1", fontWeight:700, marginBottom:6 }}>{p.platform}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:p.cac===0?"#10B981":"#F1F5F9" }}>{p.cac===0?"Free":`₹${p.cac}`}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:3 }}>Cost per acquisition</div>
                  <div style={{ height:4, borderRadius:2, background:"#1E293B", overflow:"hidden", marginTop:8 }}>
                    <div style={{ height:"100%", width:`${p.cac===0?0:Math.min(p.cac,80)/80*100}%`, background:platformColor[p.platform]||"#6366F1", borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {tab==="campaigns"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[{l:"Active Campaigns",value:"3",c:"#10B981",i:"🎯"},{l:"Total Budget",value:"₹1,53,000",c:"#FF6B00",i:"💰"},{l:"Total Leads",value:"6,170",c:"#6366F1",i:"👥"}].map(s=>(
              <div key={s.l} style={{ ...card, borderLeft:`3px solid ${s.c}` }}>
                <div style={{ fontSize:22 }}>{s.i}</div>
                <div style={{ fontSize:22, fontWeight:800, color:s.c, marginTop:8 }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Campaign Manager</div>
              <button style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New Campaign</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {campaigns.map(c=>(
                <div key={c.name} style={{ background:"#060B18", borderRadius:12, border:"1px solid #1E293B", padding:"16px", display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{c.name}</span>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:c.status==="active"?"#10B98122":"#6366F122", color:c.status==="active"?"#10B981":"#6366F1", fontWeight:700 }}>{c.status}</span>
                      <span style={{ padding:"2px 8px", borderRadius:6, fontSize:11, background:(platformColor[c.channel.split("+")[0]]||"#475569")+"22", color:platformColor[c.channel.split("+")[0]]||"#475569", fontWeight:700 }}>{c.channel}</span>
                    </div>
                    <div style={{ display:"flex", gap:20 }}>
                      {[{l:"Budget",v:`₹${c.budget.toLocaleString()}`},{l:"Spent",v:`₹${c.spent.toLocaleString()}`},{l:"Leads",v:c.leads.toLocaleString()},{l:"Conv",v:c.conv}].map(s=>(
                        <div key={s.l}><div style={{ fontSize:10, color:"#475569" }}>{s.l}</div><div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{s.v}</div></div>
                      ))}
                    </div>
                    {/* Spend bar */}
                    <div style={{ marginTop:10 }}>
                      <div style={{ height:4, borderRadius:2, background:"#1E293B", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${Math.min(c.spent/c.budget*100,100)}%`, background:c.spent>=c.budget?"#EF4444":"#FF6B00", borderRadius:2 }}/>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                        <span style={{ fontSize:10, color:"#334155" }}>{Math.round(c.spent/c.budget*100)}% spent</span>
                        <span style={{ fontSize:10, color:c.spent>=c.budget?"#EF4444":"#334155" }}>₹{(c.budget-c.spent).toLocaleString()} remaining</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontSize:11, color:"#475569" }}>ROI</div>
                    <div style={{ fontSize:20, fontWeight:900, color:c.roi.startsWith("+")?"#10B981":"#EF4444" }}>{c.roi}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Edit</button>
                    {c.status==="active"&&<button style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>Pause</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── A/B TEST TAB ── */}
      {tab==="abtest"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {abTests.map(t=>(
              <div key={t.name} style={{ ...card, borderTop:`2px solid ${t.status==="running"?"#F59E0B":"#10B981"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{t.name}</div>
                  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:6, background:t.status==="running"?"#F59E0B22":"#10B98122", color:t.status==="running"?"#F59E0B":"#10B981", fontWeight:700 }}>{t.status==="running"?"🔄 Running":"✅ Done"}</span>
                </div>
                {[{l:"Variant A",label:t.varA,conv:t.convA,winner:t.winner==="A"},{l:"Variant B",label:t.varB,conv:t.convB,winner:t.winner==="B"}].map(v=>(
                  <div key={v.l} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <div>
                        <span style={{ fontSize:11, fontWeight:700, color:v.winner?"#10B981":"#64748B", marginRight:6 }}>{v.l}</span>
                        <span style={{ fontSize:11, color:"#475569" }}>{v.label}</span>
                        {v.winner&&t.status==="done"&&<span style={{ fontSize:10, color:"#10B981", marginLeft:6 }}>🏆 Winner</span>}
                      </div>
                      <span style={{ fontSize:15, fontWeight:800, color:v.winner?"#10B981":"#94A3B8" }}>{v.conv}%</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:"#1E293B", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(v.conv/35)*100}%`, background:v.winner?"#10B981":"#334155", borderRadius:3 }}/>
                    </div>
                  </div>
                ))}
                {t.status==="running"&&(
                  <div style={{ marginTop:8, fontSize:11, color:"#F59E0B" }}>🔄 Collecting data — check back in 48h for statistical significance</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ ...card, textAlign:"center", padding:"24px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:8 }}>Start New A/B Test</div>
            <div style={{ fontSize:12, color:"#475569", marginBottom:16 }}>Test different versions of homepage copy, pricing layout, CTA text, or email subject lines</div>
            <button style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>+ Create Test</button>
          </div>
        </div>
      )}

      {/* Create Referral Modal */}
      {showCreate&&(
        <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:440 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>Create Referral Link</div>
            {[{label:"Influencer Handle",key:"name",placeholder:"@username"},{label:"Custom Code (optional)",key:"code",placeholder:"e.g. BCPL-INF06"}].map(f=>(
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>{f.label}</label>
                <input value={(newLink as any)[f.key]} onChange={e=>setNewLink(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:6 }}>Platform</label>
              <select value={newLink.platform} onChange={e=>setNewLink(p=>({...p,platform:e.target.value}))} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none" }}>
                {["Instagram","YouTube","WhatsApp","Twitter","Facebook"].map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            {newLink.name&&(
              <div style={{ padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", marginBottom:16 }}>
                <div style={{ fontSize:10, color:"#475569", marginBottom:4 }}>Preview URL</div>
                <div style={{ fontSize:12, color:"#FF6B00", fontFamily:"monospace", wordBreak:"break-all" }}>
                  https://bcplt20.com/r/{newLink.code||`BCPL-${newLink.name.slice(0,6).toUpperCase()}`}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Create Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
