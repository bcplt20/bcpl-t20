import { useState } from "react";

type FAQ = { id:number; q:string; a:string };

const SECTIONS = [
  { id:"hero",        label:"Hero Banner",       icon:"🏠" },
  { id:"about",       label:"About BCPL",        icon:"ℹ️" },
  { id:"howit",       label:"How It Works",      icon:"📋" },
  { id:"prizes",      label:"Prize Money",       icon:"🏆" },
  { id:"faq",         label:"FAQ",               icon:"❓" },
  { id:"eligibility", label:"Eligibility",       icon:"✅" },
  { id:"rules",       label:"Cricket Rules",     icon:"📖" },
  { id:"contact",     label:"Contact Info",      icon:"📞" },
  { id:"ticker",      label:"News Ticker",       icon:"📢" },
  { id:"phases",      label:"Registration Phases",icon:"💳" },
];

const CONTENT: Record<string,{title:string;body:string}> = {
  hero:        { title:"BCPL T20 Season 5 — Registration Open", body:"India's biggest T20 cricket league is back for Season 5! 10 franchise teams. 50+ cities. ₹6 Cr prize pool. Open for all working professionals." },
  about:       { title:"About BCPL T20", body:"BCPL T20 is India's premier corporate T20 franchise cricket league. Founded in 2020, the league has grown to 10 franchise teams across 50+ cities with over ₹14 Crore distributed across 4 seasons." },
  howit:       { title:"How It Works", body:"1. Register online & pay ₹299 (Bat/Bowl/WK) or ₹399 (All-rounder)\n2. Upload your 2-min selection video from any cricket ground\n3. BCCI-certified scouts review your video within 7 days\n4. If selected → Pay Phase 2 fee (₹2,000 or ₹3,000)\n5. Attend physical trials at your city ground\n6. Get auctioned to a BCPL franchise — Play Season 5!" },
  prizes:      { title:"Prize Money — BCPL Season 5", body:"🏆 Champion Team: ₹2,50,00,000\n🥈 Runner-Up: ₹1,00,00,000\n🥉 3rd Place: ₹50,00,000\n🏏 Best Batsman: ₹5,00,000\n🎳 Best Bowler: ₹5,00,000\n⭐ Most Valuable Player: ₹10,00,000\n🤝 Fair Play Award: ₹2,00,000" },
  eligibility: { title:"Eligibility Criteria", body:"• Age: 18 years and above\n• Indian citizen (Aadhaar/PAN required for KYC)\n• No active BCCI/state board contract\n• Working professional (any sector)\n• Good physical fitness\n• Available for matches as per schedule" },
  rules:       { title:"BCPL Cricket Rules", body:"Format: T20 (20 overs per side)\nTeams: 10 franchises, 15 players each\nLeague: Double round-robin, top 4 to playoffs\nDRS: 1 review per innings per team\nNo-Ball: Free hit on no-balls\nUmpire: Third umpire available for disputes" },
  contact:     { title:"Contact BCPL T20", body:"📧 Email: info@bcplt20.com\n📞 Phone: +91 98765 43210\n🏢 Address: BCPL Office, Vadodara, Gujarat – 390001\n💬 WhatsApp: +91 98765 43210\n📸 Instagram: @bcplt20official\n👥 Facebook: BCPL T20 Official\n🐦 Twitter: @bcplt20" },
  ticker:      { title:"News Ticker Text", body:"🏏 SEASON 5 OPEN · ₹6 CR PRIZE POOL · 50+ CITIES · SOURAV GANGULY · 10 FRANCHISE TEAMS · REGISTER NOW AT ₹299 · #OfficeSeStadiumtak" },
  phases:      { title:"Registration Phases", body:"PHASE 1:\n• Bat/Bowl/WK: ₹299\n• All-Rounder: ₹399\n• Includes: Video submission slot, Scout review\n\nPHASE 2 (Only if selected):\n• Bat/Bowl/WK: ₹2,000\n• All-Rounder: ₹3,000\n• Includes: Physical trial entry, Franchise auction eligibility\n\nNO HIDDEN COSTS. If not selected for Phase 2, no further payment needed." },
};

const initFAQs:FAQ[] = [
  { id:1, q:"What is BCPL T20?", a:"BCPL T20 is India's biggest corporate T20 franchise cricket league, open to all working professionals aged 18 and above. It gives office-goers the chance to play professional-style cricket." },
  { id:2, q:"How much do I pay in Phase 1?", a:"Phase 1 registration is ₹299 for Batsman, Bowler, or Wicket-keeper roles, and ₹399 for All-rounders. This includes your video submission slot and scout review." },
  { id:3, q:"Do I have to pay for Phase 2 upfront?", a:"No! Phase 2 payment is only required if you are selected after Phase 1 scout review. There is absolutely no commitment or upfront payment for Phase 2." },
  { id:4, q:"How much is Phase 2?", a:"Phase 2 registration is ₹2,000 for Bat/Bowl/WK roles and ₹3,000 for All-rounders. This covers your physical trial entry and franchise auction eligibility." },
  { id:5, q:"Who reviews the Phase 1 video?", a:"All Phase 1 videos are reviewed by BCCI-certified cricket scouts. Results are communicated within 7 working days of submission." },
  { id:6, q:"Are there any hidden costs?", a:"Absolutely not. If you are not selected for Phase 2, you pay nothing more. The total maximum cost is ₹299/₹399 (Phase 1) + ₹2,000/₹3,000 (Phase 2 only if selected) = ₹2,299 to ₹3,399." },
  { id:7, q:"What cities have physical trials?", a:"BCPL Season 5 has physical trials in 50+ cities across India including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, and more." },
  { id:8, q:"When does Season 5 start?", a:"BCPL Season 5 is scheduled for September–October 2026. Registrations are open now (Phase 1). Physical trials run from March–June 2026." },
];

export default function CMSView() {
  const [section,   setSection]   = useState("hero");
  const [forms,     setForms]     = useState<Record<string,{title:string;body:string}>>(CONTENT);
  const [faqs,      setFaqs]      = useState<FAQ[]>(initFAQs);
  const [saved,     setSaved]     = useState<string|null>(null);
  const [editingFaq,setEditingFaq]= useState<FAQ|null>(null);
  const [newFaq,    setNewFaq]    = useState({ q:"", a:"" });
  const [showAddFaq,setShowAddFaq]= useState(false);

  const save = () => { setSaved(section); setTimeout(()=>setSaved(null),2200); };

  const saveFaq = () => {
    if(!newFaq.q||!newFaq.a) return;
    setFaqs(f=>[...f,{id:Date.now(),...newFaq}]);
    setNewFaq({q:"",a:""});
    setShowAddFaq(false);
  };
  const updateFaq = () => {
    if(!editingFaq) return;
    setFaqs(f=>f.map(x=>x.id===editingFaq.id?editingFaq:x));
    setEditingFaq(null);
  };

  const card:React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", gap:16, height:"100%" }}>
      {/* Sidebar */}
      <div style={{ ...card, padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #1E293B", fontSize:11, fontWeight:800, color:"#475569", textTransform:"uppercase", letterSpacing:.5 }}>Page Sections</div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)} style={{ padding:"12px 16px", border:"none", background:section===s.id?"#FF6B0015":"transparent", borderLeft:`3px solid ${section===s.id?"#FF6B00":"transparent"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ fontSize:12, color:section===s.id?"#FF6B00":"#94A3B8", fontWeight:section===s.id?700:500 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Panel */}
      <div style={{ display:"flex", flexDirection:"column", gap:14, minWidth:0 }}>

        {/* FAQ Special Editor */}
        {section==="faq" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>FAQ Manager</div>
                <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Manage frequently asked questions — displayed on the website</div>
              </div>
              <button onClick={()=>setShowAddFaq(true)} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add FAQ</button>
            </div>

            {faqs.map((faq,i)=>(
              <div key={faq.id} style={card}>
                {editingFaq?.id===faq.id ? (
                  <div>
                    <div style={{ marginBottom:12 }}>
                      <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>QUESTION</label>
                      <input value={editingFaq.q} onChange={e=>setEditingFaq(f=>f?{...f,q:e.target.value}:f)}
                        style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #FF6B0055", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>ANSWER</label>
                      <textarea value={editingFaq.a} onChange={e=>setEditingFaq(f=>f?{...f,a:e.target.value}:f)} rows={4}
                        style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #FF6B0055", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setEditingFaq(null)} style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>Cancel</button>
                      <button onClick={updateFaq} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <span style={{ width:24, height:24, borderRadius:"50%", background:"#FF6B0022", border:"1px solid #FF6B0044", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#FF6B00", flexShrink:0 }}>{i+1}</span>
                          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Q: {faq.q}</div>
                        </div>
                        {/* Website preview */}
                        <div style={{ background:"#060B18", borderRadius:9, padding:"12px 14px", border:"1px solid #0F1B2D" }}>
                          <div style={{ fontSize:12, color:"#94A3B8", lineHeight:1.6 }}><span style={{ color:"#10B981", fontWeight:700 }}>A:</span> {faq.a}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                        <button onClick={()=>setEditingFaq({...faq})} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>✏️</button>
                        <button onClick={()=>setFaqs(f=>f.filter(x=>x.id!==faq.id))} style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:11, cursor:"pointer" }}>🗑</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add FAQ inline form */}
            {showAddFaq&&(
              <div style={{ ...card, borderStyle:"dashed" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:14 }}>New FAQ</div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>QUESTION</label>
                  <input value={newFaq.q} onChange={e=>setNewFaq(p=>({...p,q:e.target.value}))} placeholder="e.g. What is the registration fee?"
                    style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>ANSWER</label>
                  <textarea value={newFaq.a} onChange={e=>setNewFaq(p=>({...p,a:e.target.value}))} rows={4} placeholder="Type the detailed answer here..."
                    style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setShowAddFaq(false)} style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, cursor:"pointer" }}>Cancel</button>
                  <button onClick={saveFaq} style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>Add FAQ</button>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* Standard Section Editor */
          <>
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9" }}>{SECTIONS.find(s=>s.id===section)?.label}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>Edit content displayed on the public website</div>
                </div>
                {saved===section&&<span style={{ fontSize:12, color:"#10B981", fontWeight:700, background:"#10B98122", padding:"4px 12px", borderRadius:8 }}>✓ Saved!</span>}
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:.5, display:"block", marginBottom:6 }}>SECTION TITLE</label>
                <input value={forms[section]?.title||""} onChange={e=>setForms(f=>({...f,[section]:{...f[section],title:e.target.value}}))}
                  style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:14, fontWeight:600, outline:"none", boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:.5, display:"block", marginBottom:6 }}>CONTENT</label>
                <textarea value={forms[section]?.body||""} onChange={e=>setForms(f=>({...f,[section]:{...f[section],body:e.target.value}}))}
                  rows={10} style={{ width:"100%", padding:"10px 12px", background:"#060B18", border:"1px solid #1E293B", borderRadius:9, color:"#F1F5F9", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.65 }}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={save} style={{ padding:"10px 24px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save Changes</button>
                <button onClick={()=>setForms(f=>({...f,[section]:CONTENT[section]}))} style={{ padding:"10px 24px", borderRadius:9, border:"1px solid #EF444444", background:"transparent", color:"#EF4444", fontSize:13, cursor:"pointer" }}>Reset to Default</button>
              </div>
            </div>

            {/* Preview */}
            <div style={card}>
              <div style={{ fontSize:11, fontWeight:800, color:"#475569", letterSpacing:.5, marginBottom:14, textTransform:"uppercase" }}>Live Preview — As Shown on Website</div>
              <div style={{ background:"#060B18", borderRadius:10, padding:"20px 24px", border:"1px solid #0F172A" }}>
                <div style={{ fontSize:18, fontWeight:900, color:"#F1F5F9", marginBottom:12 }}>{forms[section]?.title}</div>
                <div style={{ fontSize:13, color:"#94A3B8", lineHeight:1.8, whiteSpace:"pre-line" }}>{forms[section]?.body}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
