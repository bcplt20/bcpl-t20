import { useState, useEffect } from "react";

/* ─ Data ─ */
const PAGES = [
  { page:"Home",         slug:"/",              title:"BCPL T20 – India's Biggest Corporate Cricket League | Season 5", desc:"Register for BCPL T20 Season 5. India's largest corporate T20 cricket league. ₹6 Crore prize pool. Open to all working professionals. Phase 1 starts ₹299.", score:91 },
  { page:"Registration", slug:"/registration",  title:"Register for BCPL T20 Season 5 | ₹299 Only | Corporate Cricket",  desc:"Sign up for BCPL T20 Season 5 in 3 easy steps. Pay ₹299 for Phase 1. Upload trial video. Get selected for franchise auction. India's biggest working professionals cricket league.", score:88 },
  { page:"Teams",        slug:"/teams",         title:"BCPL T20 Teams – 10 Franchise Teams | Season 5 Squads",           desc:"Explore all 10 BCPL T20 franchise teams, their squads, captains, and season stats. Rajasthan Scorchers, Mumbai Mavericks, Delhi Suryas and more.",                      score:76 },
  { page:"Match Center", slug:"/match-center",  title:"BCPL T20 Live Scores & Match Schedule | Season 5",                desc:"Get live scores, match schedule, points table and highlights from BCPL T20 Season 5. Stay updated with all corporate cricket matches across India.",                      score:72 },
  { page:"About",        slug:"/about",         title:"About BCPL T20 – BCPL | Corporate Cricket India",   desc:"Learn about BCPL T20, India's premier corporate T20 cricket league by BCPL. Backed by Sourav Ganguly. 4 seasons, ₹14 Crore distributed.",               score:80 },
  { page:"Sponsors",     slug:"/sponsors",      title:"BCPL T20 Sponsors & Partners | Season 5 Sponsorship",             desc:"BCPL T20 sponsorship opportunities for brands. Reach 8,000+ cricket-loving working professionals across 50+ cities. Title, Associate, and Official partners.",    score:65 },
  { page:"FAQ",          slug:"/faq",           title:"BCPL T20 FAQ – Registration, Fees, Rules | Season 5",             desc:"Find answers to common BCPL T20 questions: registration fees, Phase 1 & Phase 2 process, trial cities, eligibility, and refund policy.",                             score:83 },
];

const KEYWORDS = [
  { kw:"corporate cricket league india",           vol:2400, diff:32, pos:0,  trend:"same", intent:"Informational" },
  { kw:"bcpl t20 registration",                    vol:1900, diff:18, pos:0,  trend:"same", intent:"Transactional" },
  { kw:"working professionals cricket india",       vol:880,  diff:41, pos:0,  trend:"same", intent:"Informational" },
  { kw:"office cricket league 2026",               vol:720,  diff:28, pos:0,  trend:"same", intent:"Informational" },
  { kw:"franchise cricket league registration",    vol:590,  diff:35, pos:0,  trend:"same", intent:"Transactional" },
  { kw:"cricket trial india ₹299",                 vol:420,  diff:12, pos:0,  trend:"same", intent:"Transactional" },
  { kw:"ganguly cricket league corporate",         vol:380,  diff:22, pos:0,  trend:"same", intent:"Informational" },
  { kw:"t20 cricket registration open 2026",       vol:340,  diff:29, pos:0,  trend:"same", intent:"Transactional" },
];

const BACKLINKS: { domain:string; da:number; links:number; type:string; status:string; anchor:string }[] = [];

const TECH_AUDIT = [
  { label:"Core Web Vitals — LCP",      status:"good",    value:"1.8s",   target:"< 2.5s",   tip:null },
  { label:"Core Web Vitals — CLS",      status:"good",    value:"0.04",   target:"< 0.1",    tip:null },
  { label:"Core Web Vitals — FID",      status:"good",    value:"12ms",   target:"< 100ms",  tip:null },
  { label:"Mobile Friendly",            status:"good",    value:"Pass",   target:"Pass",     tip:null },
  { label:"HTTPS / SSL",                status:"good",    value:"Active", target:"Required", tip:null },
  { label:"Sitemap.xml",                status:"good",    value:"Live",   target:"Present",  tip:null },
  { label:"Robots.txt",                 status:"good",    value:"Configured",target:"Present", tip:null },
  { label:"Structured Data (JSON-LD)",  status:"warn",    value:"Missing",target:"Recommended", tip:"Add SportsEvent + Organization schema" },
  { label:"Open Graph Tags",            status:"good",    value:"Set",    target:"Required", tip:null },
  { label:"Canonical URLs",             status:"good",    value:"Set",    target:"Required", tip:null },
  { label:"Image Alt Tags",             status:"warn",    value:"62%",    target:"100%",     tip:"38% of images missing alt text" },
  { label:"Page Speed (Mobile)",        status:"warn",    value:"74/100", target:"> 90",     tip:"Compress hero images, defer offscreen JS" },
  { label:"H1 Tags",                    status:"good",    value:"All pages", target:"1 per page", tip:null },
  { label:"Internal Links",             status:"good",    value:"42",     target:"> 20",     tip:null },
  { label:"Broken Links",               status:"good",    value:"0",      target:"0",        tip:null },
  { label:"Duplicate Meta Titles",      status:"good",    value:"None",   target:"0",        tip:null },
];

const SCHEMA_TEMPLATES: Record<string,string> = {
  Organization: JSON.stringify({
    "@context":"https://schema.org",
    "@type":"Organization",
    "name":"BCPL T20 – BCPL",
    "url":"https://bcplt20.com",
    "logo":"https://bcplt20.com/bcpl-assets/logos/bcpl-logo.png",
    "sameAs":["https://instagram.com/bcplt20","https://youtube.com/@bcplt20"],
    "contactPoint":{ "@type":"ContactPoint","telephone":"+91-XXXXXXXXXX","contactType":"customer service" }
  }, null, 2),
  SportsEvent: JSON.stringify({
    "@context":"https://schema.org",
    "@type":"SportsEvent",
    "name":"BCPL T20 Season 5",
    "sport":"Cricket",
    "startDate":"2026-09-01",
    "endDate":"2026-12-15",
    "location":{ "@type":"Place","name":"Multiple Cities, India" },
    "organizer":{ "@type":"Organization","name":"BCPL Pvt. Ltd." },
    "offers":{ "@type":"Offer","price":"299","priceCurrency":"INR","url":"https://bcplt20.com/registration" }
  }, null, 2),
  FAQPage: JSON.stringify({
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity":[
      { "@type":"Question","name":"How much does BCPL T20 Phase 1 cost?","acceptedAnswer":{ "@type":"Answer","text":"Phase 1 registration costs ₹299 for Batsman/Bowler/Wicket-keeper and ₹399 for All-rounders." } },
      { "@type":"Question","name":"What happens if I am not selected for Phase 2?","acceptedAnswer":{ "@type":"Answer","text":"If you are not selected after Phase 1 video review, you pay nothing for Phase 2. There are no hidden charges." } }
    ]
  }, null, 2),
};

type Tab = "meta"|"keywords"|"technical"|"backlinks"|"schema"|"social"|"google";

/* ── GSC mock data ── */
const GSC_QUERIES: { query:string; clicks:number; impressions:number; ctr:number; pos:number }[] = [];
const GSC_PAGES: { page:string; clicks:number; impressions:number; ctr:number; pos:number }[] = [];

export default function SEOView() {
  const [tab,     setTab]     = useState<Tab>("meta");
  const [selPage, setSelPage] = useState(0);
  const [form,    setForm]    = useState({ title:PAGES[0].title, desc:PAGES[0].desc, slug:PAGES[0].slug });
  const [schema,  setSchema]  = useState("Organization");
  const [copied,  setCopied]  = useState(false);
  const [ogForm,  setOgForm]  = useState({
    ogTitle:"BCPL T20 – India's Biggest Corporate Cricket League",
    ogDesc:"₹6 Crore prize pool. 10 franchise teams. Register from ₹299.",
    ogImage:"https://bcplt20.com/bcpl-assets/og-cover.jpg",
    twitterCard:"summary_large_image",
    twitterSite:"@bcplt20",
  });

  /* ── Google Search Console state ── */
  type GscStatus = "not_connected"|"connecting"|"verifying"|"connected";
  const [gscStatus,   setGscStatus]   = useState<GscStatus>("not_connected");
  const [gscProperty, setGscProperty] = useState("https://bcplt20.com");
  const [verifyMethod,setVerifyMethod]= useState<"html_tag"|"html_file"|"dns">("html_tag");
  const [gscTab,      setGscTab]      = useState<"overview"|"queries"|"pages"|"sitemaps"|"setup">("overview");
  const [verifyCode]  = useState("google-site-verification: google7a4c9b2d1e8f3a5b.html");
  const [sitemapUrl,  setSitemapUrl]  = useState("https://bcplt20.com/sitemap.xml");
  const [sitemapSent, setSitemapSent] = useState(false);
  const [connecting,  setConnecting]  = useState(false);

  function startConnect() {
    setConnecting(true);
    setGscStatus("connecting");
    setTimeout(()=>{ setGscStatus("verifying"); setConnecting(false); }, 1800);
  }
  function verifyNow() {
    setGscStatus("connecting");
    setTimeout(()=>{ setGscStatus("connected"); setGscTab("overview"); }, 2000);
  }
  function submitSitemap() { setSitemapSent(true); setTimeout(()=>setSitemapSent(false), 3000); }

  // suppress unused warning
  useEffect(()=>{}, [connecting]);

  const scoreColor=(s:number)=>s>=85?"#10B981":s>=70?"#F59E0B":"#EF4444";
  const statusIcon=(s:string)=>s==="good"?"✅":s==="warn"?"⚠️":"❌";
  const statusColor=(s:string)=>s==="good"?"#10B981":s==="warn"?"#F59E0B":"#EF4444";
  const trendIcon=(t:string)=>t==="up"?"↑":t==="down"?"↓":"→";
  const trendColor=(t:string)=>t==="up"?"#10B981":t==="down"?"#EF4444":"#64748B";
  const diffColor=(d:number)=>d<25?"#10B981":d<40?"#F59E0B":"#EF4444";

  function handlePageSelect(i:number){ setSelPage(i); setForm({ title:PAGES[i].title, desc:PAGES[i].desc, slug:PAGES[i].slug }); }

  const avgScore = Math.round(PAGES.reduce((a,p)=>a+p.score,0)/PAGES.length);
  const goodTech = TECH_AUDIT.filter(t=>t.status==="good").length;

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>SEO Manager</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Full-stack SEO — meta, keywords, schema, backlinks, technical audit</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>🗺 Generate Sitemap</button>
          <button style={{ padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>⬇ Export SEO Report</button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Avg SEO Score",       value:`${avgScore}/100`,        sub:"Across all pages",       color:"#10B981", icon:"📈" },
          { label:"Organic Visitors",    value:"2,840",                  sub:"Last 30 days",           color:"#6366F1", icon:"👁"  },
          { label:"Ranking Keywords",    value:"8",                      sub:`${KEYWORDS.filter(k=>k.pos<=3).length} in top 3`, color:"#FF6B00", icon:"🔑" },
          { label:"Tech Audit",          value:`${goodTech}/${TECH_AUDIT.length}`,sub:"Checks passed",color:"#F59E0B", icon:"⚙️" },
        ].map(s=>(
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:"#F1F5F9", fontWeight:600, marginTop:3 }}>{s.label}</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {([
          ["meta","📄 Meta Tags"],["keywords","🔑 Keywords"],["technical","⚙️ Technical Audit"],
          ["backlinks","🔗 Backlinks"],["schema","{ } Schema"],["social","📱 Social OG"],
          ["google","🔍 Google Search Console"],
        ] as [Tab,string][]).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 18px", borderRadius:10, border:`1px solid ${tab===t?(t==="google"?"#4285F4":"#FF6B00"):"#1E293B"}`, background:tab===t?(t==="google"?"#4285F422":"#FF6B0022"):"transparent", color:tab===t?(t==="google"?"#4285F4":"#FF6B00"):"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {l}
            {t==="google"&&gscStatus==="connected"&&<span style={{ marginLeft:6, width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", verticalAlign:"middle" }}/>}
            {t==="google"&&gscStatus!=="connected"&&<span style={{ marginLeft:6, width:7, height:7, borderRadius:"50%", background:"#EF4444", display:"inline-block", verticalAlign:"middle" }}/>}
          </button>
        ))}
      </div>

      {/* ── META TAB ── */}
      {tab==="meta"&&(
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>
          {/* Page list */}
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:800, color:"#475569", letterSpacing:1, marginBottom:14, textTransform:"uppercase" }}>Pages</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {PAGES.map((p,i)=>(
                <button key={i} onClick={()=>handlePageSelect(i)} style={{ width:"100%", height:38, padding:"0 12px", borderRadius:9, border:"none", background:selPage===i?"#FF6B0015":"transparent", borderLeft:`2px solid ${selPage===i?"#FF6B00":"transparent"}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:selPage===i?"#FF6B00":"#94A3B8", fontWeight:selPage===i?700:500, lineHeight:1 }}>{p.page}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:scoreColor(p.score), lineHeight:1 }}>{p.score}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:18 }}>Meta Editor — {PAGES[selPage].page}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:.5 }}>META TITLE</label>
                    <span style={{ fontSize:11, fontWeight:700, color:form.title.length>60?"#EF4444":"#10B981" }}>{form.title.length}/60 chars</span>
                  </div>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${form.title.length>60?"#EF444460":"#1E293B"}`, background:"#060B18", color:"#E2E8F0", fontSize:13, outline:"none", boxSizing:"border-box", lineHeight:1.4 }}/>
                  {form.title.length>60&&<div style={{ fontSize:11, color:"#EF4444", marginTop:5 }}>⚠ Title too long — Google may truncate after 60 chars</div>}
                </div>
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:.5 }}>META DESCRIPTION</label>
                    <span style={{ fontSize:11, fontWeight:700, color:form.desc.length>160?"#EF4444":"#10B981" }}>{form.desc.length}/160 chars</span>
                  </div>
                  <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} rows={3}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${form.desc.length>160?"#EF444460":"#1E293B"}`, background:"#060B18", color:"#E2E8F0", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }}/>
                  <div style={{ display:"flex", gap:8, marginTop:5, flexWrap:"wrap" }}>
                    {["BCPL","Season 5","₹299","cricket","India"].map(kw=>(
                      <span key={kw} style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:form.desc.includes(kw)?"#10B98122":"#1E293B", color:form.desc.includes(kw)?"#10B981":"#475569", fontWeight:700 }}>{form.desc.includes(kw)?"✓":""} {kw}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:.5, display:"block", marginBottom:8 }}>URL SLUG</label>
                  <input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid #1E293B", background:"#060B18", color:"#E2E8F0", fontSize:13, outline:"none", fontFamily:"monospace", boxSizing:"border-box", lineHeight:1 }}/>
                </div>
                <button style={{ alignSelf:"flex-start", padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  Save Meta Tags
                </button>
              </div>
            </div>

            {/* Google Preview */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:14, textTransform:"uppercase", letterSpacing:.5 }}>Google Search Preview</div>
              <div style={{ background:"#fff", borderRadius:10, padding:"16px 20px" }}>
                <div style={{ fontSize:12, color:"#0D652D", marginBottom:4, lineHeight:1 }}>bcplt20.com{form.slug}</div>
                <div style={{ fontSize:18, color:"#1a0dab", lineHeight:1.3, marginBottom:6, cursor:"pointer" }}>{form.title.slice(0,60)}{form.title.length>60?"…":""}</div>
                <div style={{ fontSize:13, color:"#4D5156", lineHeight:1.55 }}>{form.desc.slice(0,160)}{form.desc.length>160?"…":""}</div>
              </div>
            </div>

            {/* SEO Checklist */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:14, textTransform:"uppercase", letterSpacing:.5 }}>SEO Checklist</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:"Title 30–60 chars",          ok:form.title.length>=30&&form.title.length<=60 },
                  { label:"Description 120–160 chars",  ok:form.desc.length>=120&&form.desc.length<=160 },
                  { label:"Title contains 'BCPL'",  ok:form.title.toLowerCase().includes("bcpl") },
                  { label:"Slug lowercase & clean",     ok:/^\/[a-z0-9-/]*$/.test(form.slug) },
                  { label:"Primary keyword in title",   ok:form.title.toLowerCase().includes("cricket") },
                  { label:"Description mentions price", ok:form.desc.includes("₹") },
                  { label:"OG tags configured",         ok:true },
                  { label:"Canonical URL set",          ok:true },
                  { label:"Structured data present",    ok:false },
                  { label:"Sitemap updated",            ok:true },
                ].map((c,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:c.ok?"#10B98108":"#EF444408", borderRadius:8, border:`1px solid ${c.ok?"#10B98120":"#EF444420"}` }}>
                    <span style={{ fontSize:13, lineHeight:1, flexShrink:0 }}>{c.ok?"✅":"❌"}</span>
                    <span style={{ fontSize:11, color:c.ok?"#10B981":"#EF4444", lineHeight:1.4 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KEYWORDS TAB ── */}
      {tab==="keywords"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Tracked Keywords",  value:KEYWORDS.length,                              color:"#6366F1" },
              { label:"Top 3 Positions",   value:KEYWORDS.filter(k=>k.pos<=3).length,          color:"#10B981" },
              { label:"Avg. Position",     value:(KEYWORDS.reduce((a,k)=>a+k.pos,0)/KEYWORDS.length).toFixed(1), color:"#FF6B00" },
              { label:"Total Avg. Volume", value:KEYWORDS.reduce((a,k)=>a+k.vol,0).toLocaleString(), color:"#F59E0B" },
            ].map(s=>(
              <div key={s.label} style={{ ...card, borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Keyword Tracker</div>
              <button style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Keyword</button>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Keyword","Volume/mo","Difficulty","Position","Trend","Intent","Actions"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KEYWORDS.map((k,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid #0F1B2D" }}>
                    <td style={{ padding:"13px 12px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>{k.kw}</td>
                    <td style={{ padding:"13px 12px", fontSize:13, color:"#94A3B8" }}>{k.vol.toLocaleString()}</td>
                    <td style={{ padding:"13px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:50, height:4, background:"#1E293B", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${k.diff}%`, background:diffColor(k.diff), borderRadius:2 }}/>
                        </div>
                        <span style={{ fontSize:11, color:diffColor(k.diff), fontWeight:700 }}>{k.diff}</span>
                      </div>
                    </td>
                    <td style={{ padding:"13px 12px" }}>
                      <span style={{ fontSize:14, fontWeight:900, color:k.pos<=3?"#10B981":k.pos<=6?"#F59E0B":"#94A3B8" }}>#{k.pos}</span>
                    </td>
                    <td style={{ padding:"13px 12px" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:trendColor(k.trend) }}>{trendIcon(k.trend)}</span>
                    </td>
                    <td style={{ padding:"13px 12px" }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:k.intent==="Transactional"?"#10B98122":"#6366F122", color:k.intent==="Transactional"?"#10B981":"#6366F1", fontWeight:700 }}>{k.intent}</span>
                    </td>
                    <td style={{ padding:"13px 12px" }}>
                      <button style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>Track</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Keyword suggestions */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>💡 Keyword Opportunities</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { kw:"corporate t20 cricket league 2026",  why:"High intent + seasonal surge expected" },
                { kw:"cricket league for employees india",  why:"Untapped long-tail, low difficulty 22" },
                { kw:"office cricket tournament india",     why:"1,200 monthly searches, you're not ranking" },
                { kw:"play cricket like a professional",   why:"Top of funnel, Ganguly angle works here" },
                { kw:"bcpl cricket",          why:"Brand keyword — zero competition" },
                { kw:"cricket franchise auction india",     why:"Phase 2 intent, 400 searches/mo" },
              ].map(s=>(
                <div key={s.kw} style={{ padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ fontSize:14, flexShrink:0, lineHeight:1 }}>💡</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#FF6B00", lineHeight:1 }}>{s.kw}</div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:4, lineHeight:1.4 }}>{s.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TECHNICAL AUDIT TAB ── */}
      {tab==="technical"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Score ring */}
          <div style={{ ...card, display:"flex", alignItems:"center", gap:24 }}>
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:`conic-gradient(#10B981 ${goodTech/TECH_AUDIT.length*360}deg, #1E293B 0deg)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background:"#0A1020", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:16, fontWeight:900, color:"#10B981" }}>{Math.round(goodTech/TECH_AUDIT.length*100)}%</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:"#64748B", marginTop:8 }}>Health Score</div>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>Technical SEO Audit</div>
              <div style={{ fontSize:13, color:"#64748B" }}>{goodTech} of {TECH_AUDIT.length} checks passed · {TECH_AUDIT.filter(t=>t.status==="warn").length} warnings · {TECH_AUDIT.filter(t=>t.status==="error").length} errors</div>
              <div style={{ display:"flex", gap:16, marginTop:12 }}>
                {[{l:"Passed",n:goodTech,c:"#10B981"},{l:"Warnings",n:TECH_AUDIT.filter(t=>t.status==="warn").length,c:"#F59E0B"},{l:"Errors",n:TECH_AUDIT.filter(t=>t.status==="error").length,c:"#EF4444"}].map(s=>(
                  <div key={s.l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:s.c, flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:s.c, fontWeight:700 }}>{s.n} {s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginLeft:"auto", flexShrink:0 }}>
              <button style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Re-run Audit</button>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {TECH_AUDIT.map((t,i)=>(
              <div key={i} style={{ padding:"12px 16px", background:"#0A1020", borderRadius:12, border:`1px solid ${t.status==="good"?"#10B98120":t.status==="warn"?"#F59E0B20":"#EF444420"}`, display:"flex", alignItems:"flex-start", gap:12 }}>
                <span style={{ fontSize:16, lineHeight:1, flexShrink:0, marginTop:1 }}>{statusIcon(t.status)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#F1F5F9", lineHeight:1 }}>{t.label}</div>
                  <div style={{ display:"flex", gap:8, marginTop:5, alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:statusColor(t.status) }}>{t.value}</span>
                    <span style={{ fontSize:10, color:"#334155" }}>target: {t.target}</span>
                  </div>
                  {t.tip&&<div style={{ fontSize:11, color:"#F59E0B", marginTop:4, lineHeight:1.4 }}>💡 {t.tip}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BACKLINKS TAB ── */}
      {tab==="backlinks"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Total Backlinks", value:BACKLINKS.reduce((a,b)=>a+b.links,0).toString(),      color:"#6366F1" },
              { label:"Referring Domains",value:BACKLINKS.length.toString(),                          color:"#10B981" },
              { label:"Avg Domain Auth", value:Math.round(BACKLINKS.reduce((a,b)=>a+b.da,0)/BACKLINKS.length).toString(), color:"#FF6B00" },
              { label:"Lost Links",      value:BACKLINKS.filter(b=>b.status==="Lost").length.toString(), color:"#EF4444" },
            ].map(s=>(
              <div key={s.label} style={{ ...card, borderLeft:`3px solid ${s.color}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Backlink Monitor</div>
              <button style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add for Monitoring</button>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #1E293B" }}>
                  {["Domain","DA","Links","Type","Anchor Text","Status","Action"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BACKLINKS.map((b,i)=>(
                  <tr key={i} style={{ borderBottom:"1px solid #0F1B2D" }}>
                    <td style={{ padding:"12px 12px", fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{b.domain}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:b.da>=80?"#10B981":b.da>=60?"#F59E0B":"#EF4444" }}>{b.da}</span>
                    </td>
                    <td style={{ padding:"12px 12px", fontSize:13, color:"#94A3B8" }}>{b.links}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:b.type==="Dofollow"?"#10B98122":"#64748B22", color:b.type==="Dofollow"?"#10B981":"#64748B", fontWeight:700 }}>{b.type}</span>
                    </td>
                    <td style={{ padding:"12px 12px", fontSize:12, color:"#64748B", fontStyle:"italic" }}>"{b.anchor}"</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:5, background:b.status==="Active"?"#10B98122":"#EF444422", color:b.status==="Active"?"#10B981":"#EF4444", fontWeight:700 }}>{b.status}</span>
                    </td>
                    <td style={{ padding:"12px 12px" }}>
                      <button style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Link building opportunities */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>🎯 Link Building Opportunities</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                { domain:"scroll.in",      da:74, tip:"Cricket coverage — pitch a player success story" },
                { domain:"ndtv.com",       da:91, tip:"Sports section — press release for Season 5 launch" },
                { domain:"thequint.com",   da:76, tip:"Sports + corporate angle — ideal for Ganguly quote" },
                { domain:"livemint.com",   da:83, tip:"Corporate sports feature — working pro cricket angle" },
                { domain:"thenewsminute.com",da:67,tip:"South India coverage — Chennai + Bengaluru teams" },
                { domain:"bcci.tv",        da:85, tip:"Official partnership mention — high authority" },
              ].map(o=>(
                <div key={o.domain} style={{ padding:"12px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"#F1F5F9" }}>{o.domain}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:"#F59E0B" }}>DA {o.da}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{o.tip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEMA TAB ── */}
      {tab==="schema"&&(
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:14 }}>
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:800, color:"#475569", letterSpacing:1, marginBottom:14, textTransform:"uppercase" }}>Schema Types</div>
            {Object.keys(SCHEMA_TEMPLATES).map(s=>(
              <button key={s} onClick={()=>setSchema(s)} style={{ width:"100%", height:38, padding:"0 12px", borderRadius:9, border:"none", background:schema===s?"#FF6B0015":"transparent", borderLeft:`2px solid ${schema===s?"#FF6B00":"transparent"}`, cursor:"pointer", display:"flex", alignItems:"center" }}>
                <span style={{ fontSize:12, color:schema===s?"#FF6B00":"#94A3B8", fontWeight:schema===s?700:500, lineHeight:1 }}>{"{}"} {s}</span>
              </button>
            ))}
            <div style={{ marginTop:14, padding:"12px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
              <div style={{ fontSize:11, color:"#475569", lineHeight:1.6 }}>
                ✅ Organization<br/>⚠️ SportsEvent — Add to homepage<br/>💡 FAQPage — Add to /faq
              </div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{schema} Schema (JSON-LD)</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{ navigator.clipboard?.writeText(SCHEMA_TEMPLATES[schema]); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>{copied?"✅ Copied":"📋 Copy"}</button>
                  <button style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Add to Page</button>
                </div>
              </div>
              <pre style={{ background:"#060B18", border:"1px solid #1E293B", borderRadius:10, padding:16, fontSize:11, color:"#94A3B8", overflowX:"auto", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                {SCHEMA_TEMPLATES[schema]}
              </pre>
            </div>
            <div style={{ ...card, padding:"16px 20px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Schema Validator</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["Google Rich Results Test","Schema.org Validator","Structured Data Linter"].map(t=>(
                  <button key={t} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>🔗 {t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GOOGLE SEARCH CONSOLE TAB ── */}
      {tab==="google"&&(
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* ─ NOT CONNECTED ─ */}
          {gscStatus==="not_connected"&&(
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Hero card */}
              <div style={{ ...card, background:"linear-gradient(135deg,#0D1526,#0A1020)", borderTop:"2px solid #4285F4", padding:"32px 28px", textAlign:"center" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9", marginBottom:8 }}>Connect Google Search Console</div>
                <div style={{ fontSize:13, color:"#64748B", maxWidth:520, margin:"0 auto 24px", lineHeight:1.7 }}>
                  Google Search Console दिखाता है कि आपकी website Google पर कैसे perform कर रही है — क्लिक्स, impressions, keyword positions, crawl errors, और बहुत कुछ। यह SEO का सबसे important free tool है।
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, maxWidth:640, margin:"0 auto 28px" }}>
                  {[
                    { icon:"📊", label:"Search Traffic", sub:"क्लिक्स और impressions देखें" },
                    { icon:"🔑", label:"Top Queries",    sub:"कौन से keywords लाते हैं traffic" },
                    { icon:"⚠️", label:"Crawl Issues",   sub:"Google को क्या problem आ रही है" },
                    { icon:"🗺",  label:"Sitemap Status", sub:"Pages index हो रहे हैं या नहीं" },
                  ].map(b=>(
                    <div key={b.label} style={{ background:"#060B18", border:"1px solid #1E293B", borderRadius:12, padding:"14px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{b.icon}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#F1F5F9", marginBottom:4 }}>{b.label}</div>
                      <div style={{ fontSize:10, color:"#475569", lineHeight:1.4 }}>{b.sub}</div>
                    </div>
                  ))}
                </div>
                <button onClick={startConnect} style={{ padding:"12px 32px", borderRadius:12, border:"none", background:"#4285F4", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  🔍 Google Search Console से Connect करें
                </button>
                <div style={{ fontSize:11, color:"#334155", marginTop:12 }}>Google account से sign-in करके property verify करनी होगी</div>
              </div>

              {/* Step guide */}
              <div style={card}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Connection के Steps</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { step:1, title:"Property Type चुनें",   desc:"Domain (bcplt20.com) या URL prefix (https://bcplt20.com) — Domain recommended है" },
                    { step:2, title:"Verification Method",  desc:"HTML tag, HTML file upload, DNS TXT record, या Google Analytics — इनमें से कोई एक चुनें" },
                    { step:3, title:"Code Add करें",         desc:"HTML tag को अपनी website के <head> में paste करें, फिर Google को verify करने दें" },
                    { step:4, title:"Data देखें",            desc:"Verify होने के बाद 24-48 घंटे में data show होना शुरू हो जाएगा" },
                  ].map(s=>(
                    <div key={s.step} style={{ display:"flex", gap:14, padding:"12px 14px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"#4285F420", border:"1px solid #4285F440", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontSize:12, fontWeight:800, color:"#4285F4" }}>{s.step}</span>
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#F1F5F9", marginBottom:3 }}>{s.title}</div>
                        <div style={{ fontSize:11, color:"#64748B", lineHeight:1.5 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─ CONNECTING (OAuth loading) ─ */}
          {gscStatus==="connecting"&&(
            <div style={{ ...card, textAlign:"center", padding:"48px 28px" }}>
              <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#F1F5F9", marginBottom:8 }}>Google से Connect हो रहा है…</div>
              <div style={{ fontSize:12, color:"#64748B" }}>Browser में Google Sign-in popup खुला होगा। अपना account select करें और permission दें।</div>
              <div style={{ marginTop:20, height:4, borderRadius:2, background:"#1E293B", overflow:"hidden", maxWidth:320, margin:"20px auto 0" }}>
                <div style={{ height:"100%", width:"60%", background:"#4285F4", borderRadius:2, animation:"none" }}/>
              </div>
            </div>
          )}

          {/* ─ VERIFYING (setup form) ─ */}
          {gscStatus==="verifying"&&(
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ ...card, borderTop:"2px solid #4285F4" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <span style={{ fontSize:20 }}>🔧</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>Property Setup और Verification</div>
                    <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>नीचे method चुनें और code को website में add करें</div>
                  </div>
                </div>

                {/* Property URL */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:7, textTransform:"uppercase", letterSpacing:.5 }}>Website URL (Property)</label>
                  <input value={gscProperty} onChange={e=>setGscProperty(e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #4285F440", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"monospace" }}/>
                </div>

                {/* Verify method tabs */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Verification Method</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {([["html_tag","HTML Meta Tag"],["html_file","HTML File Upload"],["dns","DNS TXT Record"]] as const).map(([v,l])=>(
                      <button key={v} onClick={()=>setVerifyMethod(v)} style={{ padding:"8px 14px", borderRadius:9, border:`1px solid ${verifyMethod===v?"#4285F4":"#1E293B"}`, background:verifyMethod===v?"#4285F422":"transparent", color:verifyMethod===v?"#4285F4":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* HTML Tag instructions */}
                {verifyMethod==="html_tag"&&(
                  <div>
                    <div style={{ fontSize:12, color:"#94A3B8", marginBottom:10 }}>
                      नीचे दिया गया tag अपनी website के <code style={{ background:"#060B18", padding:"1px 5px", borderRadius:4, color:"#FF6B00" }}>&lt;head&gt;</code> section में paste करें:
                    </div>
                    <div style={{ background:"#060B18", border:"1px solid #1E293B", borderRadius:10, padding:14, marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>HTML Meta Tag</span>
                        <button onClick={()=>navigator.clipboard?.writeText(`<meta name="google-site-verification" content="google7a4c9b2d1e8f3a5b" />`)} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:10, cursor:"pointer" }}>📋 Copy</button>
                      </div>
                      <pre style={{ margin:0, fontSize:11, color:"#4285F4", fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-all", lineHeight:1.7 }}>
{`<meta name="google-site-verification"\n  content="google7a4c9b2d1e8f3a5b" />`}
                      </pre>
                    </div>
                    <div style={{ padding:"10px 14px", background:"#F59E0B10", border:"1px solid #F59E0B30", borderRadius:10, fontSize:11, color:"#F59E0B", lineHeight:1.6, marginBottom:16 }}>
                      ⚠️ Tag add करने के बाद website publish करें, <strong>फिर</strong> नीचे "Verify Now" click करें।<br/>
                      Tag हटाने पर ownership revoke हो जाएगी।
                    </div>
                  </div>
                )}

                {/* HTML File */}
                {verifyMethod==="html_file"&&(
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, color:"#94A3B8", marginBottom:10, lineHeight:1.6 }}>
                      नीचे दी गई file download करें और अपनी website के root में upload करें ताकि यह URL accessible हो:<br/>
                      <code style={{ color:"#4285F4", fontSize:11 }}>https://bcplt20.com/{verifyCode}</code>
                    </div>
                    <div style={{ background:"#060B18", border:"1px solid #1E293B", borderRadius:10, padding:14, marginBottom:12 }}>
                      <div style={{ fontSize:10, color:"#475569", marginBottom:6, fontWeight:700 }}>FILE CONTENT</div>
                      <pre style={{ margin:0, fontSize:11, color:"#10B981", fontFamily:"monospace" }}>google-site-verification: google7a4c9b2d1e8f3a5b</pre>
                    </div>
                    <button style={{ padding:"8px 16px", borderRadius:9, border:"1px solid #4285F440", background:"transparent", color:"#4285F4", fontSize:12, fontWeight:700, cursor:"pointer" }}>⬇ Download Verification File</button>
                  </div>
                )}

                {/* DNS */}
                {verifyMethod==="dns"&&(
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, color:"#94A3B8", marginBottom:10, lineHeight:1.6 }}>
                      अपने domain provider (GoDaddy, Cloudflare, BigRock आदि) के DNS settings में TXT record add करें:
                    </div>
                    <div style={{ background:"#060B18", border:"1px solid #1E293B", borderRadius:10, padding:14, marginBottom:12 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:10 }}>
                        {[["Type","TXT"],["Name","@ (या domain name)"],["Value","google-site-verification=google7a4c9b2d1e8f3a5b"],["TTL","3600 (या Default)"]].map(([k,v])=>(
                          <><span key={k+"k"} style={{ fontSize:11, color:"#475569", fontWeight:700 }}>{k}</span>
                          <span key={k+"v"} style={{ fontSize:11, color:"#10B981", fontFamily:"monospace" }}>{v}</span></>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:"#F59E0B", lineHeight:1.5 }}>⏱ DNS changes propagate होने में 24-72 घंटे लग सकते हैं।</div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setGscStatus("not_connected")} style={{ padding:"11px 20px", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:13, cursor:"pointer" }}>← Back</button>
                  <button onClick={verifyNow} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:"#4285F4", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>✓ Verify Now</button>
                </div>
              </div>
            </div>
          )}

          {/* ─ CONNECTED — Full Dashboard ─ */}
          {gscStatus==="connected"&&(
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Status bar */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"#10B98110", border:"1px solid #10B98130", borderRadius:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:10, height:10, borderRadius:"50%", background:"#10B981", display:"inline-block", flexShrink:0 }}/>
                  <span style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>Connected</span>
                  <span style={{ fontSize:12, color:"#64748B" }}>· {gscProperty}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ fontSize:11, color:"#64748B" }}>Last synced: Today 4:08 AM</span>
                  <button onClick={()=>setGscStatus("not_connected")} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #EF444440", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>Disconnect</button>
                </div>
              </div>

              {/* Inner tabs */}
              <div style={{ display:"flex", gap:6 }}>
                {([["overview","📊 Overview"],["queries","🔑 Queries"],["pages","📄 Pages"],["sitemaps","🗺 Sitemaps"],["setup","⚙️ Setup"]] as const).map(([t,l])=>(
                  <button key={t} onClick={()=>setGscTab(t)} style={{ padding:"8px 16px", borderRadius:9, border:`1px solid ${gscTab===t?"#4285F4":"#1E293B"}`, background:gscTab===t?"#4285F422":"transparent", color:gscTab===t?"#4285F4":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
                ))}
              </div>

              {/* Overview */}
              {gscTab==="overview"&&(
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                    {[
                      { label:"Total Clicks",      value:"4,738",  sub:"Last 28 days",  color:"#4285F4", delta:"+18%" },
                      { label:"Total Impressions", value:"58,400", sub:"Last 28 days",  color:"#34A853", delta:"+24%" },
                      { label:"Avg CTR",           value:"8.1%",   sub:"Clicks / Impr", color:"#FBBC04", delta:"+1.2%" },
                      { label:"Avg Position",      value:"3.8",    sub:"In search results", color:"#EA4335", delta:"-0.4" },
                    ].map(s=>(
                      <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
                        <div style={{ fontSize:24, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                        <div style={{ fontSize:12, color:"#F1F5F9", fontWeight:600 }}>{s.label}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                          <span style={{ fontSize:10, color:"#475569" }}>{s.sub}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:s.delta.startsWith("+")?"#10B981":s.delta.startsWith("-")&&s.label==="Avg Position"?"#10B981":"#EF4444" }}>{s.delta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    <div style={card}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>Top 5 Queries (Last 28 Days)</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {GSC_QUERIES.slice(0,5).map((q,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                            <span style={{ fontSize:11, color:"#475569", width:18, textAlign:"right", flexShrink:0 }}>{i+1}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:11, color:"#94A3B8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{q.query}</div>
                              <div style={{ height:3, borderRadius:2, background:"#1E293B", marginTop:4, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${(q.clicks/GSC_QUERIES[0].clicks)*100}%`, background:"#4285F4", borderRadius:2 }}/>
                              </div>
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color:"#4285F4", flexShrink:0 }}>{q.clicks.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={card}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>Coverage Status</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {[
                          { label:"Valid (Indexed)",          n:7,  color:"#34A853" },
                          { label:"Valid with warnings",       n:2,  color:"#FBBC04" },
                          { label:"Excluded (noindex/etc.)",  n:3,  color:"#64748B" },
                          { label:"Error (crawl issues)",     n:0,  color:"#EA4335" },
                        ].map(r=>(
                          <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#060B18", borderRadius:8, border:`1px solid ${r.color}25` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:2, background:r.color, flexShrink:0 }}/>
                              <span style={{ fontSize:12, color:"#94A3B8" }}>{r.label}</span>
                            </div>
                            <span style={{ fontSize:14, fontWeight:800, color:r.color }}>{r.n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Queries */}
              {gscTab==="queries"&&(
                <div style={card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Search Queries — Last 28 Days</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <select style={{ padding:"6px 10px", background:"#060B18", border:"1px solid #1E293B", borderRadius:8, color:"#94A3B8", fontSize:11, outline:"none", cursor:"pointer" }}>
                        <option>Last 28 days</option><option>Last 3 months</option><option>Last 12 months</option>
                      </select>
                      <button style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>⬇ Export CSV</button>
                    </div>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1E293B" }}>
                        {["Query","Clicks","Impressions","CTR","Avg. Position"].map(h=>(
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GSC_QUERIES.map((q,i)=>(
                        <tr key={i} style={{ borderBottom:"1px solid #0F1B2D" }}>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#F1F5F9", fontWeight:600 }}>{q.query}</td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#4285F4", fontWeight:700 }}>{q.clicks.toLocaleString()}</td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#94A3B8" }}>{q.impressions.toLocaleString()}</td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#FBBC04", fontWeight:700 }}>{q.ctr}%</td>
                          <td style={{ padding:"12px 12px" }}>
                            <span style={{ fontSize:13, fontWeight:800, color:q.pos<=3?"#34A853":q.pos<=6?"#FBBC04":"#94A3B8" }}>#{q.pos.toFixed(1)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pages */}
              {gscTab==="pages"&&(
                <div style={card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Top Pages by Clicks</div>
                    <button style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>⬇ Export CSV</button>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1E293B" }}>
                        {["Page URL","Clicks","Impressions","CTR","Avg. Position"].map(h=>(
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GSC_PAGES.map((p,i)=>(
                        <tr key={i} style={{ borderBottom:"1px solid #0F1B2D" }}>
                          <td style={{ padding:"12px 12px" }}>
                            <span style={{ fontSize:12, color:"#4285F4", fontFamily:"monospace" }}>bcplt20.com{p.page}</span>
                          </td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#4285F4", fontWeight:700 }}>{p.clicks.toLocaleString()}</td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#94A3B8" }}>{p.impressions.toLocaleString()}</td>
                          <td style={{ padding:"12px 12px", fontSize:13, color:"#FBBC04", fontWeight:700 }}>{p.ctr}%</td>
                          <td style={{ padding:"12px 12px" }}>
                            <span style={{ fontSize:13, fontWeight:800, color:p.pos<=3?"#34A853":p.pos<=6?"#FBBC04":"#94A3B8" }}>#{p.pos.toFixed(1)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sitemaps */}
              {gscTab==="sitemaps"&&(
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={card}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Sitemap Submit करें</div>
                    <div style={{ display:"flex", gap:10 }}>
                      <input value={sitemapUrl} onChange={e=>setSitemapUrl(e.target.value)}
                        style={{ flex:1, padding:"10px 14px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", fontFamily:"monospace" }}/>
                      <button onClick={submitSitemap} style={{ padding:"10px 20px", borderRadius:9, border:"none", background:"#4285F4", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Submit</button>
                    </div>
                    {sitemapSent&&<div style={{ fontSize:12, color:"#34A853", marginTop:10 }}>✅ Sitemap submitted successfully! Google will process it within a few hours.</div>}
                  </div>
                  <div style={card}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>Submitted Sitemaps</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[
                        { url:"/sitemap.xml",       status:"Success", pages:12, lastRead:"Jul 18, 2026" },
                        { url:"/sitemap-blog.xml",  status:"Warning", pages:3,  lastRead:"Jul 10, 2026" },
                      ].map((s,i)=>(
                        <div key={i} style={{ padding:"14px 16px", background:"#060B18", borderRadius:12, border:"1px solid #1E293B", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:12, color:"#4285F4", fontFamily:"monospace", marginBottom:4 }}>bcplt20.com{s.url}</div>
                            <div style={{ fontSize:11, color:"#475569" }}>Last read: {s.lastRead} · {s.pages} pages discovered</div>
                          </div>
                          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, background:s.status==="Success"?"#34A85322":"#FBBC0422", color:s.status==="Success"?"#34A853":"#FBBC04" }}>{s.status}</span>
                            <button style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #EF444440", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Setup / ownership */}
              {gscTab==="setup"&&(
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={card}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Ownership Details</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[
                        { label:"Property",        value:gscProperty },
                        { label:"Verified via",    value:"HTML Meta Tag" },
                        { label:"Verification tag",value:'content="google7a4c9b2d1e8f3a5b"' },
                        { label:"Verified on",     value:"Jul 20, 2026" },
                        { label:"Owners",          value:"admin@bcplt20.com" },
                      ].map(r=>(
                        <div key={r.label} style={{ display:"flex", gap:12, padding:"10px 14px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B" }}>
                          <span style={{ fontSize:11, color:"#475569", fontWeight:700, minWidth:130 }}>{r.label}</span>
                          <span style={{ fontSize:11, color:"#94A3B8", fontFamily:"monospace" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...card, borderLeft:"3px solid #FBBC04" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#FBBC04", marginBottom:8 }}>⚠️ Important</div>
                    <div style={{ fontSize:12, color:"#64748B", lineHeight:1.7 }}>
                      Verification tag को website के &lt;head&gt; से कभी remove मत करें।<br/>
                      Remove करने पर ownership revoke हो जाएगी और data access बंद हो जाएगा।
                    </div>
                  </div>
                  <div style={card}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Google Analytics भी Connect करें</div>
                    <div style={{ fontSize:12, color:"#64748B", marginBottom:14, lineHeight:1.6 }}>
                      Google Analytics connect करने से GSC data और website behaviour data एक साथ देख सकते हैं।
                    </div>
                    <button style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #EA433540", background:"transparent", color:"#EA4335", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      📊 Google Analytics से Link करें
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SOCIAL OG TAB ── */}
      {tab==="social"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:18 }}>Open Graph Tags</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[{l:"OG Title",k:"ogTitle"},{l:"OG Description",k:"ogDesc"},{l:"OG Image URL",k:"ogImage"}].map(f=>(
                  <div key={f.k}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:7 }}>{f.l}</label>
                    <input value={(ogForm as any)[f.k]} onChange={e=>setOgForm(p=>({...p,[f.k]:e.target.value}))}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid #1E293B", background:"#060B18", color:"#E2E8F0", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:18 }}>Twitter Card</div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[{l:"Twitter Card Type",k:"twitterCard"},{l:"Twitter Site Handle",k:"twitterSite"}].map(f=>(
                  <div key={f.k}>
                    <label style={{ fontSize:11, fontWeight:700, color:"#475569", display:"block", marginBottom:7 }}>{f.l}</label>
                    <input value={(ogForm as any)[f.k]} onChange={e=>setOgForm(p=>({...p,[f.k]:e.target.value}))}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:"1px solid #1E293B", background:"#060B18", color:"#E2E8F0", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                ))}
              </div>
              <button style={{ width:"100%", marginTop:16, padding:"11px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save All OG Tags</button>
            </div>
          </div>

          {/* Previews */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* WhatsApp preview */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>WhatsApp / iMessage Preview</div>
              <div style={{ background:"#ECE5DD", borderRadius:12, overflow:"hidden" }}>
                <div style={{ height:120, background:"linear-gradient(135deg,#FF7A29,#060C18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:40 }}>🏏</span>
                </div>
                <div style={{ padding:"10px 14px", background:"#fff" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111", lineHeight:1.3 }}>{ogForm.ogTitle}</div>
                  <div style={{ fontSize:12, color:"#666", marginTop:4, lineHeight:1.4 }}>{ogForm.ogDesc}</div>
                  <div style={{ fontSize:11, color:"#25D366", marginTop:5 }}>bcplt20.com</div>
                </div>
              </div>
            </div>
            {/* Twitter preview */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94A3B8", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Twitter Card Preview</div>
              <div style={{ border:"1px solid #e1e8ed", borderRadius:12, overflow:"hidden" }}>
                <div style={{ height:100, background:"linear-gradient(135deg,#FF7A29,#060C18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:34 }}>🏏</span>
                </div>
                <div style={{ padding:"10px 14px", background:"#fff" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#14171A", lineHeight:1.3 }}>{ogForm.ogTitle}</div>
                  <div style={{ fontSize:12, color:"#657786", marginTop:3, lineHeight:1.4 }}>{ogForm.ogDesc}</div>
                  <div style={{ fontSize:11, color:"#657786", marginTop:5 }}>bcplt20.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
