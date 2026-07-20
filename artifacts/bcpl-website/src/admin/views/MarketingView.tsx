import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

/* ── Static data ── */
const PLATFORMS_COLOR: Record<string,string> = {
  Instagram:"#E1306C", YouTube:"#FF0000", WhatsApp:"#25D366",
  Twitter:"#1DA1F2", Facebook:"#1877F2", Direct:"#6366F1", "Google Ads":"#4285F4",
};

const initReferrals = [
  { id:1, code:"BCPL-INF01", name:"Rohit_Cricket22",  platform:"Instagram", clicks:4821, signups:1243, paid:987,  revenue:1243*299, active:true  },
  { id:2, code:"BCPL-INF02", name:"BCPLOfficial",      platform:"YouTube",   clicks:3200, signups:987,  paid:743,  revenue:987*299,  active:true  },
  { id:3, code:"BCPL-INF03", name:"CricketDhamaka",    platform:"WhatsApp",  clicks:2890, signups:743,  paid:612,  revenue:743*299,  active:true  },
  { id:4, code:"BCPL-INF04", name:"SportsBhai",         platform:"Instagram", clicks:1980, signups:412,  paid:298,  revenue:412*299,  active:false },
  { id:5, code:"BCPL-INF05", name:"RajCricket",         platform:"YouTube",   clicks:1540, signups:289,  paid:201,  revenue:289*299,  active:true  },
];

const platformPerf = [
  { platform:"WhatsApp",   signups:3200, revenue:320000, cac:18 },
  { platform:"Instagram",  signups:2100, revenue:210000, cac:24 },
  { platform:"YouTube",    signups:1800, revenue:180000, cac:31 },
  { platform:"Twitter",    signups:420,  revenue:42000,  cac:58 },
  { platform:"Facebook",   signups:310,  revenue:31000,  cac:62 },
  { platform:"Direct",     signups:600,  revenue:60000,  cac:0  },
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

type Campaign = { id:number; name:string; channel:string; budget:number; spent:number; leads:number; conv:string; status:string; roi:string; startDate:string; endDate:string; goal:string; notes:string };
const initCampaigns: Campaign[] = [
  { id:1, name:"Season 5 Launch",   channel:"WhatsApp",  budget:50000, spent:41200, leads:2840, conv:"22%", status:"active",    roi:"+314%", startDate:"Jul 01", endDate:"Jul 31", goal:"Registrations", notes:"Peak season push" },
  { id:2, name:"Ganguly Reel Push", channel:"Instagram", budget:30000, spent:30000, leads:1420, conv:"18%", status:"completed", roi:"+182%", startDate:"Jun 20", endDate:"Jul 10", goal:"Brand Awareness", notes:"Ambassador content" },
  { id:3, name:"YouTube Cricket",    channel:"YouTube",   budget:25000, spent:18700, leads:890,  conv:"15%", status:"active",    roi:"+128%", startDate:"Jul 05", endDate:"Jul 30", goal:"Registrations", notes:"Tutorial-style ads" },
  { id:4, name:"WhatsApp Blast #3", channel:"WhatsApp",  budget:8000,  spent:8000,  leads:640,  conv:"31%", status:"completed", roi:"+452%", startDate:"Jul 08", endDate:"Jul 09", goal:"Re-engagement",  notes:"Lapsed users" },
  { id:5, name:"Google Search",      channel:"Google Ads",budget:40000, spent:22000, leads:380,  conv:"8%",  status:"active",    roi:"+48%",  startDate:"Jul 10", endDate:"Aug 10", goal:"Registrations", notes:"Branded + generic" },
];

type ABTest = { id:number; name:string; hypothesis:string; varA:string; varB:string; convA:number; convB:number; traffic:number; sampleSize:number; winner:string; status:string; startDate:string };
const initABTests: ABTest[] = [
  { id:1, name:"Hero CTA Text",     hypothesis:"Urgent CTA drives more registrations",       varA:"Register Now — ₹299", varB:"Start Your Journey",  convA:24.2, convB:19.8, traffic:50, sampleSize:2400, winner:"A", status:"done",    startDate:"Jul 01" },
  { id:2, name:"Pricing Section",   hypothesis:"Showing full journey first builds trust",    varA:"Phase 1 first",       varB:"Full journey first",    convA:21.4, convB:26.1, traffic:50, sampleSize:3100, winner:"B", status:"done",    startDate:"Jul 05" },
  { id:3, name:"Ganguly Quote",     hypothesis:"Quote placement affects trust + conversion", varA:"Top of page",         varB:"After stats",           convA:22.8, convB:22.1, traffic:50, sampleSize:1840, winner:"A", status:"running", startDate:"Jul 18" },
  { id:4, name:"Mobile CTA Button", hypothesis:"Fixed CTA increases mobile conversions",    varA:"Fixed bottom bar",    varB:"Inline only",           convA:31.2, convB:18.4, traffic:50, sampleSize:2200, winner:"A", status:"done",    startDate:"Jun 28" },
];

/* ── Blank form templates ── */
const blankCampaign = { name:"", channel:"WhatsApp", budget:"", startDate:"", endDate:"", goal:"Registrations", notes:"" };
const blankABTest   = { name:"", hypothesis:"", varA:"", varB:"", element:"Hero CTA", traffic:"50", startDate:"" };
const blankReferral = { name:"", platform:"Instagram", code:"" };

/* ── Helpers ── */
function Modal({ onClose, children }: { onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000088", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={onClose}>
      <div style={{ background:"#0D1526", border:"1px solid #1E293B", borderRadius:20, padding:28, width:520, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:7, letterSpacing:.5, textTransform:"uppercase" }}>{label}</label>
      {children}
    </div>
  );
}
const inp: React.CSSProperties = { width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };

/* ═══════════════════════════════════════════════════ */
export default function MarketingView() {
  const [tab,        setTab]        = useState<"funnel"|"referrals"|"platforms"|"campaigns"|"abtest">("funnel");

  /* referrals */
  const [referrals,  setReferrals]  = useState(initReferrals);
  const [showRef,    setShowRef]    = useState(false);
  const [editRef,    setEditRef]    = useState<typeof initReferrals[0]|null>(null);
  const [refForm,    setRefForm]    = useState(blankReferral);

  /* campaigns */
  const [campaigns,  setCampaigns]  = useState(initCampaigns);
  const [showCamp,   setShowCamp]   = useState(false);
  const [editCamp,   setEditCamp]   = useState<Campaign|null>(null);
  const [campForm,   setCampForm]   = useState(blankCampaign);

  /* A/B tests */
  const [abTests,    setABTests]    = useState(initABTests);
  const [showAB,     setShowAB]     = useState(false);
  const [editAB,     setEditAB]     = useState<ABTest|null>(null);
  const [abForm,     setABForm]     = useState(blankABTest);

  const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };
  const totalRevenue = referrals.reduce((a,r)=>a+r.revenue,0);
  const totalSignups = referrals.reduce((a,r)=>a+r.signups,0);
  const totalClicks  = referrals.reduce((a,r)=>a+r.clicks,0);

  /* ── Campaign handlers ── */
  function openNewCampaign() { setEditCamp(null); setCampForm(blankCampaign); setShowCamp(true); }
  function openEditCampaign(c: Campaign) { setEditCamp(c); setCampForm({ name:c.name, channel:c.channel, budget:String(c.budget), startDate:c.startDate, endDate:c.endDate, goal:c.goal, notes:c.notes }); setShowCamp(true); }
  function saveCampaign() {
    if (!campForm.name.trim() || !campForm.budget) return;
    if (editCamp) {
      setCampaigns(cs => cs.map(c => c.id===editCamp.id ? { ...c, name:campForm.name, channel:campForm.channel, budget:Number(campForm.budget), goal:campForm.goal, notes:campForm.notes } : c));
    } else {
      const nc: Campaign = { id:Date.now(), name:campForm.name, channel:campForm.channel, budget:Number(campForm.budget), spent:0, leads:0, conv:"0%", status:"active", roi:"—", startDate:campForm.startDate||"Jul 20", endDate:campForm.endDate||"—", goal:campForm.goal, notes:campForm.notes };
      setCampaigns(cs => [nc, ...cs]);
    }
    setShowCamp(false);
  }
  function toggleCampaignStatus(id: number) { setCampaigns(cs=>cs.map(c=>c.id===id?{...c,status:c.status==="active"?"paused":"active"}:c)); }
  function deleteCampaign(id: number) { setCampaigns(cs=>cs.filter(c=>c.id!==id)); }

  /* ── A/B Test handlers ── */
  function openNewAB() { setEditAB(null); setABForm(blankABTest); setShowAB(true); }
  function openEditAB(t: ABTest) { setEditAB(t); setABForm({ name:t.name, hypothesis:t.hypothesis, varA:t.varA, varB:t.varB, element:t.name, traffic:String(t.traffic), startDate:t.startDate }); setShowAB(true); }
  function saveABTest() {
    if (!abForm.name.trim() || !abForm.varA.trim() || !abForm.varB.trim()) return;
    if (editAB) {
      setABTests(ts=>ts.map(t=>t.id===editAB.id?{...t,name:abForm.name,hypothesis:abForm.hypothesis,varA:abForm.varA,varB:abForm.varB,traffic:Number(abForm.traffic)}:t));
    } else {
      const nt: ABTest = { id:Date.now(), name:abForm.name, hypothesis:abForm.hypothesis, varA:abForm.varA, varB:abForm.varB, convA:0, convB:0, traffic:Number(abForm.traffic), sampleSize:0, winner:"—", status:"running", startDate:abForm.startDate||"Jul 20" };
      setABTests(ts=>[nt,...ts]);
    }
    setShowAB(false);
  }
  function stopABTest(id:number) { setABTests(ts=>ts.map(t=>t.id===id?{...t,status:"done"}:t)); }
  function deleteABTest(id:number) { setABTests(ts=>ts.filter(t=>t.id!==id)); }

  /* ── Referral handlers ── */
  function openNewRef() { setEditRef(null); setRefForm(blankReferral); setShowRef(true); }
  function openEditRef(r: typeof initReferrals[0]) { setEditRef(r); setRefForm({ name:r.name, platform:r.platform, code:r.code }); setShowRef(true); }
  function saveReferral() {
    if (!refForm.name.trim()) return;
    if (editRef) {
      setReferrals(rs=>rs.map(r=>r.id===editRef.id?{...r,name:refForm.name,platform:refForm.platform,code:refForm.code}:r));
    } else {
      const nr = { id:Date.now(), code:refForm.code||`BCPL-${refForm.name.slice(0,6).toUpperCase()}`, name:refForm.name, platform:refForm.platform, clicks:0, signups:0, paid:0, revenue:0, active:true };
      setReferrals(rs=>[nr,...rs]);
    }
    setShowRef(false);
  }
  function toggleRef(id:number) { setReferrals(rs=>rs.map(r=>r.id===id?{...r,active:!r.active}:r)); }
  function deleteRef(id:number) { setReferrals(rs=>rs.filter(r=>r.id!==id)); }

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Marketing & Growth</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Full-funnel analytics — from impression to franchise auction</div>
        </div>
        {tab==="referrals"  && <button onClick={openNewRef}      style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Create Referral Link</button>}
        {tab==="campaigns"  && <button onClick={openNewCampaign} style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ New Campaign</button>}
        {tab==="abtest"     && <button onClick={openNewAB}       style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Create A/B Test</button>}
      </div>

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total Referral Clicks", value:totalClicks.toLocaleString(),      color:"#6366F1" },
          { label:"Signups via Referral",  value:totalSignups.toLocaleString(),     color:"#10B981" },
          { label:"Referral Revenue",      value:`₹${(totalRevenue/100000).toFixed(1)}L`, color:"#FF6B00" },
          { label:"Active Campaigns",      value:campaigns.filter(c=>c.status==="active").length, color:"#F59E0B" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {([["funnel","🔻 Funnel"],["referrals","🔗 Referrals"],["platforms","📊 Platforms"],["campaigns","🎯 Campaigns"],["abtest","🧪 A/B Tests"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 18px", borderRadius:10, border:`1px solid ${tab===t?"#FF6B00":"#1E293B"}`, background:tab===t?"#FF6B0022":"transparent", color:tab===t?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ── FUNNEL ── */}
      {tab==="funnel"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Registration Funnel</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:20 }}>From first visit to franchise selection</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {funnelStages.map((f,i)=>{
                  const drop=i>0?Math.round((1-f.value/funnelStages[i-1].value)*100):0;
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
                        <div style={{ height:"100%", width:`${f.pct}%`, background:`linear-gradient(90deg,${f.color},${f.color}aa)`, borderRadius:4 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>Drop-off Analysis</div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:16 }}>Where are users leaving?</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { stage:"Register → OTP",    lost:2220, reason:"Phone number issues / didn't receive OTP",   action:"Add retry button + alternate verification" },
                  { stage:"OTP → Phase 1 Pay", lost:2398, reason:"Price hesitation after seeing ₹299",          action:"Add trust badges + testimonials on checkout" },
                  { stage:"Pay → Video Upload",lost:922,  reason:"Didn't know how to record cricket video",     action:"Add video guide + WhatsApp support link" },
                  { stage:"Video → Selection", lost:1643, reason:"Normal funnel — scouts reviewing",            action:"Send acknowledgement email within 24h" },
                ].map(d=>(
                  <div key={d.stage} style={{ padding:"12px 14px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{d.stage}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#EF4444" }}>-{d.lost.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>🔍 {d.reason}</div>
                    <div style={{ fontSize:11, color:"#10B981" }}>💡 {d.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Avg CAC",     value:"₹28",    sub:"Cost per acquisition (all channels)", color:"#3B82F6" },
              { label:"Phase 1 LTV", value:"₹299",   sub:"Revenue per Phase 1 player",          color:"#F59E0B" },
              { label:"Phase 2 LTV", value:"₹2,299", sub:"Revenue if selected (avg)",            color:"#10B981" },
              { label:"ROAS",        value:"6.8×",   sub:"Return on ad spend (7-day avg)",        color:"#FF6B00" },
            ].map(s=>(
              <div key={s.label} style={{ ...card, borderTop:`2px solid ${s.color}` }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:4 }}>{s.value}</div>
                <div style={{ fontSize:12, color:"#F1F5F9", marginTop:3, fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
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
                <Line yAxisId="rate"  type="monotone" dataKey="rate"  stroke="#FF6B00" strokeWidth={2.5} dot={{ fill:"#FF6B00", r:4 }}  name="Conv %"/>
                <Line yAxisId="spend" type="monotone" dataKey="spend" stroke="#6366F1" strokeWidth={2}   dot={{ fill:"#6366F1", r:3 }}  name="Ad Spend" strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── REFERRALS ── */}
      {tab==="referrals"&&(
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Referral Links <span style={{ fontSize:11, color:"#64748B", fontWeight:400, marginLeft:6 }}>{referrals.filter(r=>r.active).length} active</span></div>
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
              {referrals.map(r=>(
                <tr key={r.id} style={{ borderBottom:"1px solid #0F1B2D" }}>
                  <td style={{ padding:"12px 10px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontFamily:"monospace", fontSize:11, color:"#FF6B00", background:"#FF6B0015", padding:"3px 8px", borderRadius:6, fontWeight:700 }}>{r.code}</span>
                      <button onClick={()=>navigator.clipboard?.writeText(`https://bcplt20.com/r/${r.code}`)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#475569" }} title="Copy link">📋</button>
                    </div>
                  </td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>@{r.name}</td>
                  <td style={{ padding:"12px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:(PLATFORMS_COLOR[r.platform]||"#6366F1")+"22", color:PLATFORMS_COLOR[r.platform]||"#6366F1" }}>{r.platform}</span></td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#94A3B8" }}>{r.clicks.toLocaleString()}</td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>{r.signups.toLocaleString()}</td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#10B981", fontWeight:600 }}>{r.paid.toLocaleString()}</td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#FF6B00", fontWeight:700 }}>₹{r.revenue.toLocaleString()}</td>
                  <td style={{ padding:"12px 10px", fontSize:13, color:"#F59E0B", fontWeight:700 }}>{r.clicks>0?Math.round(r.signups/r.clicks*100):0}%</td>
                  <td style={{ padding:"12px 10px" }}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700, background:r.active?"#10B98122":"#64748B22", color:r.active?"#10B981":"#64748B" }}>{r.active?"Active":"Paused"}</span></td>
                  <td style={{ padding:"12px 10px" }}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={()=>openEditRef(r)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Edit</button>
                      <button onClick={()=>toggleRef(r.id)} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${r.active?"#EF444444":"#10B98144"}`, background:"transparent", color:r.active?"#EF4444":"#10B981", fontSize:11, cursor:"pointer" }}>{r.active?"Pause":"Resume"}</button>
                      <button onClick={()=>deleteRef(r.id)} style={{ padding:"4px 8px", borderRadius:6, border:"none", background:"#EF444418", color:"#EF4444", fontSize:11, cursor:"pointer" }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PLATFORMS ── */}
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
                <div key={p.platform} style={{ flex:"1 1 130px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B", padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:12, color:PLATFORMS_COLOR[p.platform]||"#6366F1", fontWeight:700, marginBottom:6 }}>{p.platform}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:p.cac===0?"#10B981":"#F1F5F9" }}>{p.cac===0?"Free":`₹${p.cac}`}</div>
                  <div style={{ fontSize:10, color:"#475569", marginTop:3 }}>Cost per acquisition</div>
                  <div style={{ height:4, borderRadius:2, background:"#1E293B", overflow:"hidden", marginTop:8 }}>
                    <div style={{ height:"100%", width:`${p.cac===0?0:Math.min(p.cac,80)/80*100}%`, background:PLATFORMS_COLOR[p.platform]||"#6366F1", borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab==="campaigns"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Active",    v:campaigns.filter(c=>c.status==="active").length,    c:"#10B981" },
              { l:"Paused",    v:campaigns.filter(c=>c.status==="paused").length,    c:"#F59E0B" },
              { l:"Completed", v:campaigns.filter(c=>c.status==="completed").length, c:"#6366F1" },
              { l:"Total Leads",v:campaigns.reduce((a,c)=>a+c.leads,0).toLocaleString(), c:"#FF6B00" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>Campaigns {s.l}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Campaign Manager</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {campaigns.map(c=>(
                <div key={c.id} style={{ background:"#060B18", borderRadius:12, border:"1px solid #1E293B", padding:16, display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{c.name}</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:c.status==="active"?"#10B98122":c.status==="paused"?"#F59E0B22":"#6366F122", color:c.status==="active"?"#10B981":c.status==="paused"?"#F59E0B":"#6366F1", fontWeight:700 }}>{c.status}</span>
                      <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, background:(PLATFORMS_COLOR[c.channel.split("+")[0]]||"#475569")+"22", color:PLATFORMS_COLOR[c.channel.split("+")[0]]||"#475569", fontWeight:700 }}>{c.channel}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#475569", marginBottom:8 }}>Goal: {c.goal} · {c.startDate} → {c.endDate}</div>
                    <div style={{ display:"flex", gap:20, marginBottom:10 }}>
                      {[{l:"Budget",v:`₹${c.budget.toLocaleString()}`},{l:"Spent",v:`₹${c.spent.toLocaleString()}`},{l:"Leads",v:c.leads.toLocaleString()},{l:"Conv",v:c.conv},{l:"ROI",v:c.roi}].map(s=>(
                        <div key={s.l}><div style={{ fontSize:10, color:"#475569" }}>{s.l}</div><div style={{ fontSize:13, fontWeight:700, color:s.l==="ROI"?(c.roi.startsWith("+")?"#10B981":"#EF4444"):"#F1F5F9" }}>{s.v}</div></div>
                      ))}
                    </div>
                    <div style={{ height:4, borderRadius:2, background:"#1E293B", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(c.spent/c.budget*100,100)}%`, background:c.spent>=c.budget?"#EF4444":"#FF6B00", borderRadius:2 }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                      <span style={{ fontSize:10, color:"#334155" }}>{Math.round(c.spent/c.budget*100)}% spent</span>
                      <span style={{ fontSize:10, color:"#334155" }}>₹{(c.budget-c.spent).toLocaleString()} remaining</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0, flexDirection:"column" }}>
                    <button onClick={()=>openEditCampaign(c)} style={{ padding:"6px 14px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>✏ Edit</button>
                    {c.status!=="completed"&&(
                      <button onClick={()=>toggleCampaignStatus(c.id)} style={{ padding:"6px 14px", borderRadius:7, border:`1px solid ${c.status==="active"?"#F59E0B44":"#10B98144"}`, background:"transparent", color:c.status==="active"?"#F59E0B":"#10B981", fontSize:11, cursor:"pointer" }}>
                        {c.status==="active"?"⏸ Pause":"▶ Resume"}
                      </button>
                    )}
                    <button onClick={()=>deleteCampaign(c.id)} style={{ padding:"6px 14px", borderRadius:7, border:"none", background:"#EF444418", color:"#EF4444", fontSize:11, cursor:"pointer" }}>🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── A/B TESTS ── */}
      {tab==="abtest"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { l:"Total Tests",   v:abTests.length,                                c:"#6366F1" },
              { l:"Running",       v:abTests.filter(t=>t.status==="running").length, c:"#F59E0B" },
              { l:"Completed",     v:abTests.filter(t=>t.status==="done").length,    c:"#10B981" },
              { l:"Avg Lift (Winner)", v:`+${(abTests.filter(t=>t.status==="done").reduce((a,t)=>a+Math.abs(t.convA-t.convB),0)/abTests.filter(t=>t.status==="done").length).toFixed(1)}%`, c:"#FF6B00" },
            ].map(s=>(
              <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}` }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {abTests.map(t=>(
              <div key={t.id} style={{ ...card, borderTop:`2px solid ${t.status==="running"?"#F59E0B":"#10B981"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>Started {t.startDate} · {t.traffic}% traffic split</div>
                    {t.hypothesis&&<div style={{ fontSize:11, color:"#64748B", marginTop:4, fontStyle:"italic" }}>"{t.hypothesis}"</div>}
                  </div>
                  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:6, background:t.status==="running"?"#F59E0B22":"#10B98122", color:t.status==="running"?"#F59E0B":"#10B981", fontWeight:700, flexShrink:0 }}>{t.status==="running"?"🔄 Running":"✅ Done"}</span>
                </div>
                {/* Variants */}
                {[{l:"Variant A",label:t.varA,conv:t.convA,win:t.winner==="A"},{l:"Variant B",label:t.varB,conv:t.convB,win:t.winner==="B"}].map(v=>(
                  <div key={v.l} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:11, fontWeight:700, color:v.win?"#10B981":"#64748B" }}>{v.l}</span>
                        <span style={{ fontSize:11, color:"#475569" }}>{v.label}</span>
                        {v.win&&t.status==="done"&&<span style={{ fontSize:10, color:"#10B981" }}>🏆 Winner</span>}
                      </div>
                      <span style={{ fontSize:15, fontWeight:800, color:v.win?"#10B981":"#94A3B8" }}>{t.status==="running"?"…":v.conv+"%"}</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:"#1E293B", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:t.status==="running"?"40%":`${(v.conv/35)*100}%`, background:v.win?"#10B981":"#334155", borderRadius:3 }}/>
                    </div>
                  </div>
                ))}
                {t.sampleSize>0&&<div style={{ fontSize:10, color:"#475569", marginBottom:8 }}>{t.sampleSize.toLocaleString()} visitors sampled</div>}
                {t.status==="running"&&<div style={{ fontSize:11, color:"#F59E0B", marginBottom:12 }}>🔄 Collecting data — check back in 48h for statistical significance</div>}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button onClick={()=>openEditAB(t)} style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>✏ Edit</button>
                  {t.status==="running"&&<button onClick={()=>stopABTest(t.id)} style={{ flex:1, padding:"7px", borderRadius:8, border:"1px solid #10B98144", background:"transparent", color:"#10B981", fontSize:11, cursor:"pointer" }}>✓ End Test</button>}
                  <button onClick={()=>deleteABTest(t.id)} style={{ padding:"7px 12px", borderRadius:8, border:"none", background:"#EF444418", color:"#EF4444", fontSize:11, cursor:"pointer" }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Campaign Modal */}
      {showCamp&&(
        <Modal onClose={()=>setShowCamp(false)}>
          <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>{editCamp?"Edit Campaign":"New Campaign"}</div>
          <Field label="Campaign Name">
            <input value={campForm.name} onChange={e=>setCampForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Season 5 Pre-launch" style={inp}/>
          </Field>
          <Field label="Channel / Platform">
            <select value={campForm.channel} onChange={e=>setCampForm(f=>({...f,channel:e.target.value}))} style={sel}>
              {["WhatsApp","Instagram","YouTube","Google Ads","Facebook","Twitter","Email","Multi-channel"].map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Total Budget (₹)">
              <input type="number" value={campForm.budget} onChange={e=>setCampForm(f=>({...f,budget:e.target.value}))} placeholder="50000" style={inp}/>
            </Field>
            <Field label="Campaign Goal">
              <select value={campForm.goal} onChange={e=>setCampForm(f=>({...f,goal:e.target.value}))} style={sel}>
                {["Registrations","Brand Awareness","Re-engagement","Video Views","Lead Generation"].map(g=><option key={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Start Date">
              <input type="date" value={campForm.startDate} onChange={e=>setCampForm(f=>({...f,startDate:e.target.value}))} style={inp}/>
            </Field>
            <Field label="End Date">
              <input type="date" value={campForm.endDate} onChange={e=>setCampForm(f=>({...f,endDate:e.target.value}))} style={inp}/>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea value={campForm.notes} onChange={e=>setCampForm(f=>({...f,notes:e.target.value}))} placeholder="Campaign strategy, target audience…" rows={3} style={{ ...inp, resize:"none", lineHeight:1.5 }}/>
          </Field>
          {campForm.budget&&campForm.name&&(
            <div style={{ padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#475569", marginBottom:4 }}>Preview</div>
              <div style={{ fontSize:12, color:"#F1F5F9" }}>{campForm.name} · {campForm.channel} · ₹{Number(campForm.budget).toLocaleString()} budget · Goal: {campForm.goal}</div>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowCamp(false)} style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={saveCampaign} disabled={!campForm.name.trim()||!campForm.budget} style={{ flex:1, padding:11, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:(!campForm.name.trim()||!campForm.budget)?0.5:1 }}>{editCamp?"Save Changes":"Launch Campaign"}</button>
          </div>
        </Modal>
      )}

      {/* A/B Test Modal */}
      {showAB&&(
        <Modal onClose={()=>setShowAB(false)}>
          <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:6 }}>{editAB?"Edit A/B Test":"New A/B Test"}</div>
          <div style={{ fontSize:12, color:"#475569", marginBottom:20 }}>Test two versions of any page element and let data pick the winner</div>
          <Field label="Test Name">
            <input value={abForm.name} onChange={e=>setABForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Homepage Hero CTA Text" style={inp}/>
          </Field>
          <Field label="Hypothesis">
            <textarea value={abForm.hypothesis} onChange={e=>setABForm(f=>({...f,hypothesis:e.target.value}))} placeholder="e.g. A shorter CTA with price will drive more clicks than a vague message" rows={2} style={{ ...inp, resize:"none", lineHeight:1.5 }}/>
          </Field>
          <Field label="Element Being Tested">
            <select value={abForm.element} onChange={e=>setABForm(f=>({...f,element:e.target.value}))} style={sel}>
              {["Hero CTA","Pricing Section","Registration Button","Ganguly Section","FAQ Placement","Mobile Banner","Header Nav","Countdown Timer","Email Subject","WhatsApp Message"].map(e=><option key={e}>{e}</option>)}
            </select>
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Variant A — Control">
              <input value={abForm.varA} onChange={e=>setABForm(f=>({...f,varA:e.target.value}))} placeholder="e.g. Register Now — ₹299" style={inp}/>
            </Field>
            <Field label="Variant B — Challenger">
              <input value={abForm.varB} onChange={e=>setABForm(f=>({...f,varB:e.target.value}))} placeholder="e.g. Start Your Journey Free" style={inp}/>
            </Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Traffic Split (% to B)">
              <input type="number" min="10" max="90" value={abForm.traffic} onChange={e=>setABForm(f=>({...f,traffic:e.target.value}))} style={inp}/>
            </Field>
            <Field label="Start Date">
              <input type="date" value={abForm.startDate} onChange={e=>setABForm(f=>({...f,startDate:e.target.value}))} style={inp}/>
            </Field>
          </div>
          {abForm.varA&&abForm.varB&&(
            <div style={{ padding:"12px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#475569", marginBottom:8 }}>TEST PREVIEW</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[{l:"Variant A (Control)",v:abForm.varA,c:"#10B981"},{l:"Variant B (Challenger)",v:abForm.varB,c:"#F59E0B"}].map(v=>(
                  <div key={v.l} style={{ padding:"10px 12px", borderRadius:8, background:"#0D1526", border:`1px solid ${v.c}30` }}>
                    <div style={{ fontSize:9, color:v.c, fontWeight:700, marginBottom:4 }}>{v.l}</div>
                    <div style={{ fontSize:12, color:"#F1F5F9" }}>{v.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:"#64748B", marginTop:8 }}>{abForm.traffic}% of traffic → Variant B · {100-Number(abForm.traffic)}% → Variant A</div>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowAB(false)} style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={saveABTest} disabled={!abForm.name.trim()||!abForm.varA.trim()||!abForm.varB.trim()} style={{ flex:1, padding:11, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:(!abForm.name.trim()||!abForm.varA.trim()||!abForm.varB.trim())?0.5:1 }}>{editAB?"Save Changes":"Start Test"}</button>
          </div>
        </Modal>
      )}

      {/* Referral Modal */}
      {showRef&&(
        <Modal onClose={()=>setShowRef(false)}>
          <div style={{ fontSize:18, fontWeight:800, color:"#F1F5F9", marginBottom:20 }}>{editRef?"Edit Referral Link":"Create Referral Link"}</div>
          <Field label="Influencer / Agent Handle">
            <input value={refForm.name} onChange={e=>setRefForm(f=>({...f,name:e.target.value}))} placeholder="@username or agent name" style={inp}/>
          </Field>
          <Field label="Platform">
            <select value={refForm.platform} onChange={e=>setRefForm(f=>({...f,platform:e.target.value}))} style={sel}>
              {["Instagram","YouTube","WhatsApp","Twitter","Facebook","LinkedIn","Other"].map(p=><option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Custom Code (optional)">
            <input value={refForm.code} onChange={e=>setRefForm(f=>({...f,code:e.target.value}))} placeholder="e.g. BCPL-ROHIT — auto-generated if blank" style={{ ...inp, fontFamily:"monospace" }}/>
          </Field>
          {refForm.name&&(
            <div style={{ padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#475569", marginBottom:4 }}>Preview URL</div>
              <div style={{ fontSize:12, color:"#FF6B00", fontFamily:"monospace", wordBreak:"break-all" }}>
                https://bcplt20.com/r/{refForm.code||`BCPL-${refForm.name.replace("@","").slice(0,6).toUpperCase()}`}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowRef(false)} style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={saveReferral} disabled={!refForm.name.trim()} style={{ flex:1, padding:11, borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:!refForm.name.trim()?0.5:1 }}>{editRef?"Save Changes":"Create Link"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
