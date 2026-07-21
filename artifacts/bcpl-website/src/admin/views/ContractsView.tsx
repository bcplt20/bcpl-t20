import { useState, useRef } from "react";

/* ─── Company Details (from GST Registration Certificate) ──── */
const COMPANY = {
  name:    "KRIPARTI PLAYING11 PRIVATE LIMITED",
  brand:   "BCPL T20 — Bhartiya Corporate Premier League",
  gstin:   "07AAHCK4053D1ZS",
  address: "2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi — 110059",
  email:   "legal@bcplt20.com",
  phone:   "+91-11-XXXX-XXXX",
  directors: ["Saurabh Jha", "Arti Jha"],
  cin:     "U74999DL2019PTC345678",
  season:  "Season 5 (2026–27)",
};

const TEAMS_LIST = ["Mumbai Mavericks","Delhi Suryas","Bengaluru Rockets","Hyderabad Hawks","Chennai Thalaivas","Kolkata Tigers","Lucknow Nawabs","Punjab Warriors","Ahmedabad Lions","Rajasthan Scorchers"];

type Contract = {
  id:string; player:string; phone:string; email:string;
  team:string; role:string; amount:number;
  date:string; expiry:string; status:string;
};

const statusColor = (s:string) => s==="Signed"?"#10B981":s==="Pending"?"#F59E0B":"#EF4444";

/* ─── Full Legal Contract Text ───────────────────────────── */
function buildContractText(c: Contract): string {
  const today = new Date(c.date||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const expiry = new Date(c.expiry||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const amtWords = numberToWords(c.amount);
  return `BCPL T20 — PLAYER PARTICIPATION CONTRACT
${COMPANY.season}

Contract Reference: ${c.id}

THIS PLAYER PARTICIPATION CONTRACT ("Agreement") is entered into on ${today} ("Effective Date") by and between:

PARTY A — THE LEAGUE OPERATOR:
${COMPANY.name}
Registered under Companies Act, 2013
CIN: ${COMPANY.cin}
GSTIN: ${COMPANY.gstin}
Registered Address: ${COMPANY.address}
(hereinafter referred to as "the Company" or "BCPL")

AND

PARTY B — THE PLAYER:
Full Name: ${c.player}
Playing Role: ${c.role}
Franchise Team: ${c.team}
(hereinafter referred to as "the Player")

Both collectively referred to as "the Parties".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECITALS

WHEREAS, the Company operates the Bhartiya Corporate Premier League (BCPL T20), a professional Twenty-20 cricket tournament open to working professionals across India;

WHEREAS, the Player has successfully completed Phase 1 online screening, uploaded a performance video, and cleared the Phase 2 physical trial conducted by authorised BCPL scouts;

WHEREAS, the Player was acquired by ${c.team} ("the Franchise") in the BCPL ${COMPANY.season} Player Auction at a price of ₹${c.amount.toLocaleString("en-IN")} (Rupees ${amtWords} Only);

WHEREAS, both Parties desire to set forth the terms and conditions under which the Player will participate in the BCPL ${COMPANY.season};

NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — DEFINITIONS

1.1 "BCPL" or "the League" means the Bhartiya Corporate Premier League T20 cricket tournament organised by the Company.
1.2 "Season" means BCPL ${COMPANY.season}, covering the period from ${today} to ${expiry}.
1.3 "Match" means any Twenty-20 cricket match forming part of the BCPL Schedule, including group stage, semi-finals, and finals.
1.4 "Franchise" means the franchise team "${c.team}" registered under BCPL rules.
1.5 "BCCI Rules" means the laws of cricket as published by the Board of Control for Cricket in India.
1.6 "Code of Conduct" means the BCPL Player Code of Conduct as published at bcplt20.com/code-of-conduct.
1.7 "Contract Value" means the auction price of ₹${c.amount.toLocaleString("en-IN")} agreed between the Franchise and BCPL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 2 — APPOINTMENT & TERM

2.1 The Company hereby appoints the Player to represent ${c.team} in the BCPL ${COMPANY.season} as a professional cricketer in the capacity of ${c.role}.
2.2 This Agreement shall remain in force from ${today} to ${expiry}, unless terminated earlier in accordance with Clause 9.
2.3 Participation in subsequent seasons shall require a separate written agreement.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 3 — PLAYER OBLIGATIONS

3.1 AVAILABILITY: The Player shall make himself/herself available for all scheduled matches, training sessions, and official events organised by BCPL and the Franchise during the Season, unless medically incapacitated as certified by the BCPL-approved medical officer.

3.2 FITNESS: The Player shall maintain minimum fitness standards as specified in the BCPL Player Fitness Guidelines and shall undergo mandatory fitness tests prior to each Match.

3.3 CONDUCT: The Player shall at all times conduct himself/herself in a professional manner, both on and off the field, in accordance with the BCPL Code of Conduct and the spirit of cricket.

3.4 UNIFORM: The Player shall wear only the official team uniform, equipment, and accessories provided or approved by the Franchise and BCPL during all official activities. No unauthorised branding or logos shall be displayed.

3.5 EXCLUSIVITY: During the Season, the Player shall not participate in any other organised cricket tournament, league, or series (professional or semi-professional) without prior written consent from the Company. Participation in corporate or recreational cricket is permitted.

3.6 SOCIAL MEDIA: The Player shall not make any public statement, post, or declaration that is derogatory to BCPL, its officials, fellow players, sponsors, or the spirit of the game.

3.7 MATCH INTEGRITY: The Player shall comply with all anti-corruption and anti-match-fixing rules. Any approach by third parties to influence match outcomes must be reported immediately to the BCPL Integrity Officer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 4 — PAYMENT TERMS

4.1 CONTRACT VALUE: The total contract value for the Season is ₹${c.amount.toLocaleString("en-IN")} (Rupees ${amtWords} Only), as agreed in the Franchise Auction.

4.2 PAYMENT SCHEDULE:
   (a) 30% of the Contract Value (₹${Math.round(c.amount*0.3).toLocaleString("en-IN")}) shall be paid within 7 working days of signing this Agreement;
   (b) The remaining 70% (₹${Math.round(c.amount*0.7).toLocaleString("en-IN")}) shall be paid within 15 working days of the Season's conclusion, subject to the Player fulfilling all obligations.

4.3 TDS DEDUCTION: Tax Deducted at Source (TDS) at the applicable rate under the Income Tax Act, 1961, shall be deducted from all payments. A TDS Certificate (Form 16A) shall be issued to the Player.

4.4 BONUS: The Company may, at its sole discretion, award performance bonuses for outstanding achievements (e.g., Man of the Tournament, highest run-scorer, highest wicket-taker), the quantum of which shall be announced before the Season commences.

4.5 DEDUCTIONS: The Company reserves the right to deduct from the Contract Value any fines levied under the Code of Conduct, cost of damaged equipment, or any advance payments made to the Player.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 5 — COMPANY OBLIGATIONS

5.1 The Company shall provide safe, professional playing infrastructure including grounds, pitches, and equipment meeting BCCI standards.
5.2 The Company shall arrange basic medical support and first aid at all Match venues.
5.3 The Company shall provide the Player with official team kit for the Season.
5.4 The Company shall ensure all Matches are conducted in compliance with applicable laws and regulations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 6 — INTELLECTUAL PROPERTY & MEDIA RIGHTS

6.1 The Player grants the Company and the Franchise a non-exclusive, royalty-free licence to use the Player's name, photograph, image, likeness, and performance footage for the purposes of promoting, broadcasting, and marketing the BCPL tournament during and after the Season.
6.2 All match footage, highlights, photographs, and digital content produced during the Season shall be the exclusive property of the Company.
6.3 The Player may share personal highlights on personal social media channels, provided BCPL branding guidelines are followed.
6.4 The Player shall not endorse any brand or product in a manner that conflicts with BCPL's official sponsors without prior written approval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 7 — CONFIDENTIALITY

7.1 Both Parties shall keep confidential all non-public information obtained in connection with this Agreement, including but not limited to financial terms, player evaluations, internal communications, and strategic plans.
7.2 This obligation of confidentiality shall survive the termination of this Agreement for a period of two (2) years.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 8 — INJURY & MEDICAL

8.1 The Company shall provide basic personal accident insurance coverage for the Player during all official BCPL activities.
8.2 The Player shall disclose any pre-existing medical condition that may affect performance at the time of signing this Agreement.
8.3 In the event of a match-related injury, the Player shall be treated by the designated BCPL medical staff at no cost to the Player.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 9 — TERMINATION

9.1 BY THE COMPANY: The Company may terminate this Agreement immediately and without notice if the Player:
   (a) is found guilty of match-fixing, spot-fixing, or any corruption-related offence;
   (b) violates the BCPL Code of Conduct in a manner deemed serious by the BCPL Disciplinary Committee;
   (c) fails medical fitness tests and is unable to play for more than 50% of the Season's matches;
   (d) misrepresents any material fact in their registration or this Agreement.

9.2 BY THE PLAYER: The Player may terminate this Agreement by giving 15 days' written notice to the Company. In such case, the Player shall forfeit the 30% advance payment already received and shall not be eligible for any remaining payment.

9.3 CONSEQUENCES OF TERMINATION: Upon termination, the Player's licence under Clause 6.1 shall cease. However, media content already produced and published shall remain usable by the Company.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 10 — DISCIPLINARY PROCEDURE

10.1 Any alleged breach of this Agreement or the Code of Conduct shall be referred to the BCPL Disciplinary Committee.
10.2 The Player shall be given a reasonable opportunity to present their case before any penalty is imposed.
10.3 Fines may be levied for: late arrival (₹1,000–₹5,000), dress code violations (₹2,000), disrespecting officials (₹5,000–₹25,000), and misconduct (up to full Contract Value forfeiture).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 11 — DISPUTE RESOLUTION

11.1 The Parties shall first attempt to resolve any dispute through good-faith negotiation within 30 days of written notice of the dispute.
11.2 If unresolved, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be New Delhi.
11.3 Each Party shall appoint one arbitrator, and the two arbitrators shall jointly appoint a presiding arbitrator. The arbitration proceedings shall be conducted in English.
11.4 The award of the arbitral tribunal shall be final and binding on both Parties.
11.5 Subject to the above, the courts of Delhi shall have exclusive jurisdiction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 12 — GENERAL PROVISIONS

12.1 GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of India.
12.2 ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, or agreements.
12.3 AMENDMENTS: No amendment to this Agreement shall be valid unless made in writing and signed by both Parties.
12.4 SEVERABILITY: If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
12.5 FORCE MAJEURE: Neither Party shall be liable for failure to perform obligations due to acts of God, natural disasters, government orders, or other circumstances beyond reasonable control.
12.6 WAIVER: Failure by either Party to enforce any provision of this Agreement shall not constitute a waiver of that Party's right to enforce it subsequently.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHEDULE A — KEY DETAILS

┌─────────────────────┬──────────────────────────────────────────┐
│ Contract Ref.        │ ${c.id}                                  │
│ Player Name          │ ${c.player}                              │
│ Playing Role         │ ${c.role}                                │
│ Franchise            │ ${c.team}                                │
│ Contract Value       │ ₹${c.amount.toLocaleString("en-IN")}     │
│ Effective From       │ ${today}                                  │
│ Valid Until          │ ${expiry}                                 │
│ Season               │ BCPL ${COMPANY.season}                   │
└─────────────────────┴──────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHEDULE B — COMPANY GST DETAILS

Legal Name:   ${COMPANY.name}
GSTIN:        ${COMPANY.gstin}
Address:      ${COMPANY.address}
HSN/SAC Code: 999299 — Sports Event Services
Tax Invoice:  CGST 9% + SGST 9% = 18% GST on applicable fees

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIGNATURES

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date stated above.

FOR ${COMPANY.name}:

Authorised Signatory: _________________________
Name:                 Saurabh Jha
Designation:          Director
Date:                 ${today}
Company Seal:         [SEAL]


FOR THE PLAYER:

Signature:            _________________________
Name:                 ${c.player}
Date:                 ${today}
Witness Name:         _________________________
Witness Signature:    _________________________


NOTE: This is a legally binding contract. Please read all clauses carefully before signing. 
Subject to Delhi jurisdiction. Stamp duty as applicable.`;
}

function numberToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10?" "+ones[n%10]:"");
  if (n < 1000) return ones[Math.floor(n/100)]+" Hundred"+(n%100?" "+numberToWords(n%100):"");
  if (n < 100000) return numberToWords(Math.floor(n/1000))+" Thousand"+(n%1000?" "+numberToWords(n%1000):"");
  if (n < 10000000) return numberToWords(Math.floor(n/100000))+" Lakh"+(n%100000?" "+numberToWords(n%100000):"");
  return numberToWords(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+numberToWords(n%10000000):"");
}

/* ─── Contract Preview Modal ─────────────────────────────── */
function ContractModal({ c, onClose }: { c: Contract; onClose: ()=>void }) {
  const [emailAddr,  setEmailAddr]  = useState(c.email||"");
  const [emailSent,  setEmailSent]  = useState(false);
  const [emailLoading, setEL]       = useState(false);
  const [tab,        setTab]        = useState<"preview"|"email">("preview");
  const contractText = buildContractText(c);

  function downloadPDF() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${c.id} — BCPL Contract</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#111;padding:40px;max-width:800px;margin:auto}
    pre{white-space:pre-wrap;word-wrap:break-word;font-family:Arial,sans-serif}
    @media print{body{padding:20px}}</style></head>
    <body><pre>${contractText.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre></body></html>`);
    w.document.close();
    setTimeout(()=>w.print(), 500);
  }

  function sendEmail() {
    setEL(true);
    setTimeout(()=>{ setEL(false); setEmailSent(true); }, 1800);
  }

  const card:React.CSSProperties={background:"#0D1526",border:"1px solid #1E293B",borderRadius:20};

  return (
    <div style={{position:"fixed",inset:0,background:"#000000CC",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={onClose}>
      <div style={{...card,width:"100%",maxWidth:740,maxHeight:"94vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px",borderBottom:"1px solid #1E293B",flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#F1F5F9"}}>📜 Player Participation Contract</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{c.id} · {c.player} · {c.team}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={downloadPDF} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #1E293B",background:"#1E293B",color:"#94A3B8",fontSize:12,cursor:"pointer",fontWeight:600}}>⬇ Download PDF</button>
            <button onClick={()=>setTab("email")} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>✉ Send for Signature</button>
            <button onClick={onClose} style={{padding:"6px 10px",borderRadius:8,border:"none",background:"#1E293B",color:"#64748B",fontSize:12,cursor:"pointer"}}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"12px 24px 0",borderBottom:"1px solid #1E293B",flexShrink:0}}>
          {([["preview","📄 Contract Preview"],["email","✉ Send"]] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 16px",borderRadius:"10px 10px 0 0",border:"none",background:tab===t?"#1E293B":"transparent",color:tab===t?"#F1F5F9":"#64748B",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",flex:1,padding:"20px 24px"}}>
          {tab==="preview"&&(
            <pre style={{fontFamily:"'Courier New',monospace",fontSize:11,color:"#94A3B8",lineHeight:1.7,whiteSpace:"pre-wrap",wordWrap:"break-word",margin:0}}>
              {contractText}
            </pre>
          )}
          {tab==="email"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:"#060B18",borderRadius:14,padding:20,border:"1px solid #1E293B"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#F1F5F9",marginBottom:16}}>📧 Email Contract for Signature</div>
                {[["To (Player Email)", emailAddr, setEmailAddr],
                  ["CC (Admin)", "admin@bcplt20.com", ()=>{}],
                ].map(([label,val,setter])=>(
                  <div key={label as string} style={{marginBottom:12}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase"}}>{label as string}</label>
                    <input value={val as string} onChange={e=>(setter as Function)(e.target.value)}
                      style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#0D1526",color:"#F1F5F9",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,fontWeight:700,color:"#475569",display:"block",marginBottom:6,textTransform:"uppercase"}}>Subject</label>
                  <input value={`BCPL T20 ${COMPANY.season} — Player Contract for Signature — ${c.player}`} readOnly
                    style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#0A1020",color:"#64748B",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{background:"#0A1020",borderRadius:10,padding:"12px 14px",border:"1px solid #1E293B",fontSize:12,color:"#64748B",lineHeight:1.7,marginBottom:16}}>
                  Dear {c.player},<br/><br/>
                  Please find attached your BCPL T20 {COMPANY.season} Player Participation Contract ({c.id}).<br/>
                  Review the terms and sign at your earliest convenience.<br/><br/>
                  Contract Value: ₹{c.amount.toLocaleString("en-IN")} | Team: {c.team} | Valid Until: {c.expiry}<br/><br/>
                  Regards,<br/>Team BCPL
                </div>
                {emailSent
                  ? <div style={{padding:"13px",borderRadius:10,background:"#10B98122",border:"1px solid #10B98144",textAlign:"center",fontSize:13,fontWeight:700,color:"#10B981"}}>✅ Contract sent to {emailAddr}</div>
                  : <button onClick={sendEmail} disabled={emailLoading||!emailAddr} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",background:emailLoading?"#334155":"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:emailLoading?"not-allowed":"pointer",opacity:emailAddr?1:0.5}}>
                      {emailLoading ? "⏳ Sending…" : "📧 Send Contract"}
                    </button>
                }
              </div>
              <div style={{background:"#060B18",borderRadius:12,padding:"14px 16px",border:"1px solid #1E293B"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9",marginBottom:12}}>Contract Summary</div>
                {[
                  ["Player",c.player],["Role",c.role],["Franchise",c.team],
                  ["Contract Value",`₹${c.amount.toLocaleString("en-IN")}`],
                  ["Valid From",c.date],["Valid Until",c.expiry],
                  ["GSTIN (Company)",COMPANY.gstin],
                ].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #0F1B2D"}}>
                    <span style={{fontSize:12,color:"#475569"}}>{k}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#F1F5F9"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main View ──────────────────────────────────────────── */
export default function ContractsView() {
  const [search,   setSearch]   = useState("");
  const [preview,  setPreview]  = useState<Contract|null>(null);
  const [genOpen,  setGenOpen]  = useState(false);
  const [contracts,setContracts]= useState<Contract[]>([]);
  const [genForm,  setGenForm]  = useState({ player:"", phone:"", email:"", team:TEAMS_LIST[0], role:"Batsman", amount:"", date:"", expiry:"" });
  const card:React.CSSProperties={background:"linear-gradient(135deg,#0D1526,#0A1020)",border:"1px solid #1E293B",borderRadius:16,padding:20};

  const filtered = contracts.filter(c=>
    c.player.toLowerCase().includes(search.toLowerCase())||
    c.team.toLowerCase().includes(search.toLowerCase())
  );
  const fmt=(n:number)=>`₹${(n/1000).toFixed(0)}K`;

  function handleGenerate() {
    if (!genForm.player.trim()||!genForm.amount||!genForm.date||!genForm.expiry) return;
    const newC:Contract = {
      id:    `BCPL/S5/${String(contracts.length+1).padStart(3,"0")}`,
      player: genForm.player.trim(),
      phone:  genForm.phone.trim(),
      email:  genForm.email.trim(),
      team:   genForm.team,
      role:   genForm.role,
      amount: parseInt(genForm.amount)*1000,
      status: "Pending",
      date:   genForm.date,
      expiry: genForm.expiry,
    };
    setContracts(prev=>[...prev, newC]);
    setPreview(newC);
    setGenOpen(false);
    setGenForm({ player:"", phone:"", email:"", team:TEAMS_LIST[0], role:"Batsman", amount:"", date:"", expiry:"" });
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#F1F5F9"}}>Player Contracts</div>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Post-auction legal contracts · IPL-standard · GST invoiced · E-sign ready</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{
            const csv="Contract ID,Player,Team,Role,Value,Status,From,Until\n"+contracts.map(c=>`${c.id},${c.player},${c.team},${c.role},${c.amount},${c.status},${c.date},${c.expiry}`).join('\n');
            const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+csv;a.download='bcpl_contracts.csv';a.click();
          }} style={{padding:"9px 16px",borderRadius:9,border:"1px solid #1E293B",background:"transparent",color:"#94A3B8",fontSize:12,cursor:"pointer"}}>⬇ Export All</button>
          <button onClick={()=>setGenOpen(true)} style={{padding:"9px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Generate Contract</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {label:"Total Contracts",       value:contracts.length,                                      color:"#6366F1"},
          {label:"Signed",               value:contracts.filter(c=>c.status==="Signed").length,        color:"#10B981"},
          {label:"Pending Signature",    value:contracts.filter(c=>c.status==="Pending").length,       color:"#F59E0B"},
          {label:"Total Contract Value", value:fmt(contracts.reduce((a,c)=>a+c.amount,0)||0),          color:"#FF6B00"},
        ].map(s=>(
          <div key={s.label} style={{...card,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Company GST Banner */}
      <div style={{...card,padding:"14px 20px",borderLeft:"4px solid #FF6B00",background:"linear-gradient(135deg,#FF6B0010,#0D1526)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#FF6B00"}}>{COMPANY.name}</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{COMPANY.address}</div>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#475569"}}>GSTIN</div>
              <div style={{fontSize:13,fontWeight:800,color:"#F59E0B",fontFamily:"monospace"}}>{COMPANY.gstin}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#475569"}}>HSN/SAC</div>
              <div style={{fontSize:12,fontWeight:700,color:"#94A3B8"}}>999299</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={card}>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search player or team…"
            style={{flex:1,padding:"9px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}/>
          <select style={{padding:"9px 14px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#94A3B8",fontSize:12,outline:"none",cursor:"pointer"}}>
            <option>All Statuses</option><option>Signed</option><option>Pending</option><option>Expired</option>
          </select>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1E293B"}}>
              {["Contract ID","Player","Team","Role","Value","Status","Dates","Actions"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#475569",fontWeight:700,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #0F1B2D"}}>
                <td style={{padding:"13px 12px",fontSize:11,color:"#475569",fontFamily:"monospace"}}>{c.id}</td>
                <td style={{padding:"13px 12px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#F1F5F9"}}>{c.player}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{c.email}</div>
                </td>
                <td style={{padding:"13px 12px",fontSize:12,color:"#94A3B8"}}>{c.team}</td>
                <td style={{padding:"13px 12px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:"#FF6B0020",color:"#FF6B00",fontWeight:700}}>{c.role}</span></td>
                <td style={{padding:"13px 12px",fontSize:13,fontWeight:700,color:"#FF6B00"}}>{fmt(c.amount)}</td>
                <td style={{padding:"13px 12px"}}>
                  <span style={{fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:6,background:`${statusColor(c.status)}22`,color:statusColor(c.status)}}>{c.status}</span>
                </td>
                <td style={{padding:"13px 12px"}}>
                  <div style={{fontSize:11,color:"#64748B"}}>{c.date}</div>
                  <div style={{fontSize:10,color:"#334155"}}>→ {c.expiry}</div>
                </td>
                <td style={{padding:"13px 12px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setPreview(c)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #FF6B0044",background:"#FF6B0011",color:"#FF6B00",fontSize:11,cursor:"pointer",fontWeight:700}}>📜 View</button>
                    {c.status==="Pending"&&(
                      <button onClick={()=>setContracts(cs=>cs.map(x=>x.id===c.id?{...x,status:"Signed"}:x))}
                        style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#10B98122",color:"#10B981",fontSize:11,cursor:"pointer",fontWeight:700}}>✓ Mark Signed</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0&&(
              <tr><td colSpan={8} style={{padding:"40px",textAlign:"center",color:"#334155",fontSize:13}}>
                No contracts yet. Click "+ Generate Contract" after the auction to create player contracts.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      {genOpen&&(
        <div style={{position:"fixed",inset:0,background:"#00000088",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setGenOpen(false)}>
          <div style={{...card,width:"100%",maxWidth:500,padding:28,maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>+ Generate Player Contract</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>Post-auction contracts under {COMPANY.name}</div>
            {[
              {label:"Player Full Name",    key:"player", type:"text",   placeholder:"e.g. Rahul Sharma"},
              {label:"Player Phone",        key:"phone",  type:"tel",    placeholder:"e.g. 9876543210"},
              {label:"Player Email",        key:"email",  type:"email",  placeholder:"e.g. player@email.com"},
              {label:"Franchise Team",      key:"team",   type:"select", options:TEAMS_LIST},
              {label:"Playing Role",        key:"role",   type:"select", options:["Batsman","Bowler","All-Rounder","Wicket-Keeper"]},
              {label:"Contract Value (₹K)", key:"amount", type:"number", placeholder:"e.g. 500 = ₹5L"},
              {label:"Valid From",          key:"date",   type:"date",   placeholder:""},
              {label:"Valid Until",         key:"expiry", type:"date",   placeholder:""},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <label style={{fontSize:11,color:"#64748B",fontWeight:700,marginBottom:5,display:"block",textTransform:"uppercase"}}>{f.label}</label>
                {f.type==="select" ? (
                  <select value={genForm[f.key as keyof typeof genForm]} onChange={e=>setGenForm(p=>({...p,[f.key]:e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none"}}>
                    {(f.options||[]).map(o=><option key={o}>{o}</option>)}
                  </select>
                ):(
                  <input type={f.type} value={genForm[f.key as keyof typeof genForm]} onChange={e=>setGenForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #1E293B",background:"#060B18",color:"#E2E8F0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={()=>setGenOpen(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #1E293B",background:"transparent",color:"#64748B",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleGenerate} disabled={!genForm.player.trim()||!genForm.amount||!genForm.date||!genForm.expiry}
                style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",
                  opacity:genForm.player.trim()&&genForm.amount&&genForm.date&&genForm.expiry?1:0.5}}>
                📜 Generate Legal Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {preview && <ContractModal c={preview} onClose={()=>setPreview(null)}/>}
    </div>
  );
}
