import { useState, useRef } from "react";

/* ─── Company Details (from GST Registration Certificate) ──── */
const COMPANY = {
  name:    "Bhartiya Corporate Premier League Pvt. Ltd.",
  brand:   "Bhartiya Corporate Premier League",
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
  contractType:string;
};

const statusColor = (s:string) => s==="Signed"?"#10B981":s==="Pending"?"#F59E0B":"#EF4444";

/* ─── Contract text dispatchers by type ─────────────────── */
function buildContractText(c: Contract): string {
  switch(c.contractType) {
    case "Employee":         return buildEmployeeContract(c);
    case "Brand Ambassador": return buildBrandAmbassadorContract(c);
    case "Coach":            return buildCoachContract(c);
    case "Operations Staff": return buildOperationsContract(c);
    default:                 return buildPlayerContract(c);
  }
}

function buildEmployeeContract(c: Contract): string {
  const today = new Date(c.date||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const expiry = new Date(c.expiry||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  return `BCPL T20 — EMPLOYMENT CONTRACT
${COMPANY.season} · Contract Ref: ${c.id}

THIS EMPLOYMENT CONTRACT ("Agreement") is entered into on ${today} by and between:

EMPLOYER: ${COMPANY.name}
CIN: ${COMPANY.cin} · GSTIN: ${COMPANY.gstin}
${COMPANY.address}
(hereinafter "the Company")

EMPLOYEE: ${c.player}
Designation: ${c.role}
(hereinafter "the Employee")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — APPOINTMENT & COMMENCEMENT
The Company appoints the Employee in the role of ${c.role} effective ${today}.
Duration: ${today} to ${expiry}.

CLAUSE 2 — DUTIES & RESPONSIBILITIES
The Employee shall perform all duties as assigned by the management related to the BCPL T20 Season 5 operations, including but not limited to coordination, execution, reporting, and any other tasks directed by the designated manager.

CLAUSE 3 — COMPENSATION
Fixed Monthly Remuneration: ₹${c.amount.toLocaleString("en-IN")} (${numberToWords(c.amount)} Rupees).
Payment shall be made on or before the 7th of each month via NEFT/IMPS.

CLAUSE 4 — DEDUCTIONS & TAXES
Applicable TDS (if any) shall be deducted at source as per Income Tax Act. PF/ESIC shall apply as per government norms.

CLAUSE 5 — WORKING HOURS
Standard working hours: 9 AM to 6 PM, Monday through Saturday. Flexibility required during match days and events.

CLAUSE 6 — LEAVE ENTITLEMENT
The Employee is entitled to: 12 paid leaves, 6 casual leaves, and 6 sick leaves per annum (pro-rated for contract duration).

CLAUSE 7 — CONFIDENTIALITY
The Employee agrees to maintain strict confidentiality of all business strategies, player data, financial information, partner details, and operational plans of the Company.

CLAUSE 8 — INTELLECTUAL PROPERTY
Any work product, software, documentation, content, or creative output produced by the Employee in the course of employment shall be the exclusive property of the Company.

CLAUSE 9 — NON-COMPETE
During the contract period and for 12 months thereafter, the Employee shall not directly or indirectly work for, advise, or assist any competing cricket league or organization.

CLAUSE 10 — TERMINATION
Either party may terminate with 30 days' written notice. The Company reserves the right to terminate immediately for gross misconduct, breach of confidentiality, or criminal conduct.

CLAUSE 11 — DISPUTE RESOLUTION
All disputes shall be resolved through arbitration under the Arbitration and Conciliation Act, 1996. Seat of arbitration: New Delhi.

CLAUSE 12 — GOVERNING LAW
This Agreement shall be governed by the laws of India. Subject to Delhi jurisdiction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOR THE COMPANY:
Signature:         _________________________
Authorised Signatory — ${COMPANY.name}
Date:              ${today}

FOR THE EMPLOYEE:
Signature:         _________________________
Name:              ${c.player}
Date:              ${today}
Witness:           _________________________`;
}

function buildBrandAmbassadorContract(c: Contract): string {
  const today = new Date(c.date||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const expiry = new Date(c.expiry||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  return `BRAND AMBASSADOR AGREEMENT
${COMPANY.season} · Contract Reference: ${c.id}

This Brand Ambassador Agreement ("Agreement") is executed on ${today} at New Delhi, India, by and between:

PRINCIPAL:
${COMPANY.name}
(Operating brand: Bhartiya Corporate Premier League — BCPL)
Registered under the Companies Act, 2013
CIN: ${COMPANY.cin}
GSTIN: ${COMPANY.gstin}
Registered Office: ${COMPANY.address}
(hereinafter referred to as "BCPL" or "the Company")

AND

AMBASSADOR:
Full Name: ${c.player}
Represented As: ${c.team}
(hereinafter referred to as "the Ambassador")

Both parties collectively referred to as "the Parties".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECITALS

WHEREAS BCPL operates the Bhartiya Corporate Premier League, India's premier corporate T20 cricket league, currently in its ${COMPANY.season} with presence across 50+ cities and 10,000+ registered players nationwide;

WHEREAS BCPL desires to appoint the Ambassador as an official representative and brand face to enhance public awareness, goodwill, and commercial reach of the League during the Season;

WHEREAS the Ambassador possesses the requisite professional standing, public profile, and social media influence suitable for representing the BCPL brand at a national level;

WHEREAS the Parties desire to formalise the terms of this ambassadorship on the terms and conditions herein contained;

NOW THEREFORE, in consideration of the mutual covenants herein, and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — DEFINITIONS

1.1 "Ambassador Fee" means the total compensation payable under Clause 5.
1.2 "Brand Assets" means any materials bearing the BCPL name, logo, colours, trademarks, or slogans.
1.3 "Campaign" means any promotional initiative, advertising project, or marketing activation conducted by or on behalf of BCPL.
1.4 "Content" means all posts, reels, stories, photographs, videos, interviews, blogs, and public statements made by the Ambassador in connection with BCPL.
1.5 "Deliverables" means the specific content pieces, appearances, and engagements scheduled in Schedule A of this Agreement.
1.6 "ASCI Code" means the Advertising Standards Council of India guidelines for endorsements and influencer marketing, as amended from time to time.
1.7 "Territory" means the Republic of India and, where applicable, all digital platforms accessible globally.
1.8 "Season" means BCPL ${COMPANY.season}, covering the period from ${today} to ${expiry}.
1.9 "Competing Entity" means any corporate cricket league, franchise T20 tournament, or similar professional/semi-professional cricket event operating primarily in India during the Term.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 2 — APPOINTMENT & TERM

2.1 BCPL hereby appoints the Ambassador as Official Brand Ambassador for BCPL ${COMPANY.season}, effective from ${today} to ${expiry} ("the Term").
2.2 This appointment covers the Territory as defined in Clause 1.7.
2.3 During the Term, BCPL shall identify and credit the Ambassador as "Official Brand Ambassador — BCPL ${COMPANY.season}" in all relevant official communications, press releases, and campaign materials.
2.4 Renewal for subsequent seasons shall require a fresh written agreement signed by both Parties not later than 60 days before the expiry of this Agreement.
2.5 This is an independent contractor engagement and shall not constitute an employment relationship between the Parties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 3 — AMBASSADOR OBLIGATIONS & DELIVERABLES

3.1 SOCIAL MEDIA CONTENT
The Ambassador shall create, post, and publish the following minimum Deliverables across personal social media channels during the Term:
   (a) Instagram and/or Facebook: Minimum 4 (four) branded posts per month, including static posts, reels, or stories featuring BCPL branding, match updates, registration calls-to-action, or sponsor activations;
   (b) LinkedIn: Minimum 2 (two) posts per month positioning BCPL as India's leading corporate sports event;
   (c) YouTube or WhatsApp Broadcast (if applicable): Minimum 1 (one) promotional video clip per season;
   (d) All Content must include the official BCPL hashtags (#BCPLT20 #BhartiyaCorporateLeague #Season5) and tag BCPL's verified official social handles;
   (e) Total minimum Deliverables: 48 social media posts over the Season, distributed per sub-clause (a) above.

3.2 LIVE EVENT APPEARANCES
The Ambassador shall attend, in person, the following minimum events during the Season:
   (a) 2 (two) BCPL official press conferences or media launch events;
   (b) 1 (one) BCPL Season 5 Player Auction event (in-person or via video conference with prior agreement);
   (c) 2 (two) BCPL match-day appearances at franchise venues for spectator engagement and sponsor activations;
   (d) Any additional events by mutual written agreement with at least 15 days' advance notice;
   (e) Total minimum event appearances: 5 (five) per Season.

3.3 CAMPAIGN PARTICIPATION (PHOTO/VIDEO SHOOTS)
   (a) The Ambassador consents to feature in BCPL's official advertising campaigns across digital, print, out-of-home (OOH), and broadcast media during the Term;
   (b) BCPL shall provide a minimum of 7 (seven) days' advance notice for any scheduled photo or video shoot;
   (c) Each shoot session shall not exceed 8 (eight) hours per day;
   (d) BCPL shall arrange and bear all costs for studio, equipment, crew, hair and makeup, and food for the Ambassador during shoots;
   (e) The Ambassador shall cooperate with BCPL's creative directors, photographers, and production crew.

3.4 CONTENT APPROVAL PROCESS
   (a) The Ambassador shall submit all BCPL-related Content for written pre-approval by BCPL's marketing team a minimum of 48 (forty-eight) hours before publishing;
   (b) BCPL shall respond within 24 hours with approval, revision requests, or rejection;
   (c) BCPL may request reasonable changes to Content that does not align with brand guidelines, and the Ambassador shall incorporate such changes promptly;
   (d) For time-sensitive match-day or event Content, pre-approval may be obtained via WhatsApp or email with a minimum 2 (two) hours' notice.

3.5 BRAND GUIDELINES COMPLIANCE
The Ambassador shall at all times:
   (a) Use only BCPL's approved logo, colour palette, typography, and creative assets as provided in the BCPL Brand Book;
   (b) Never alter, distort, misuse, or misrepresent BCPL's trademarks, logo, or creative materials;
   (c) Ensure all Content is of a professional standard consistent with BCPL's premium national brand positioning.

3.6 ADVERTISING STANDARDS COUNCIL OF INDIA (ASCI) COMPLIANCE
   (a) All endorsement Content shall comply with the ASCI Guidelines for Influencer Advertising and Celebrity Endorsements, as amended;
   (b) Content shall be clearly disclosed as #Ad or #Sponsored as required under applicable Indian law and ASCI guidelines;
   (c) The Ambassador shall not make any false, misleading, or unsubstantiated claims about BCPL or its products in Content.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 4 — EXCLUSIVITY & NON-COMPETE

4.1 During the Term, the Ambassador shall not, without prior written consent from BCPL:
   (a) Serve as a brand ambassador, spokesperson, or promotional face for any Competing Entity;
   (b) Create or publish Content that directly promotes, implies association with, or endorses any Competing Entity;
   (c) Attend or participate in any Competing Entity's launch events, press conferences, or promotional activities in a public capacity.

4.2 The Ambassador may continue to endorse or promote products and brands in all other categories (e.g. apparel, fintech, food, automobiles, personal care, education) provided such endorsements do not conflict with BCPL's officially appointed Title, Co-Title, or Associate Sponsors.

4.3 BCPL shall provide the Ambassador with a complete and updated list of its official sponsors at the time of signing this Agreement. Category conflicts with BCPL's exclusive sponsors shall require prior written approval from BCPL's commercial team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 5 — AMBASSADOR FEE, PAYMENT & EXPENSES

5.1 TOTAL FEE
The total Ambassador Fee for the Season is:
₹${c.amount.toLocaleString("en-IN")} (Rupees ${numberToWords(c.amount)} Only)

5.2 PAYMENT SCHEDULE
   (a) 40% — ₹${Math.round(c.amount*0.4).toLocaleString("en-IN")} — payable within 7 (seven) working days of execution of this Agreement;
   (b) 30% — ₹${Math.round(c.amount*0.3).toLocaleString("en-IN")} — payable at mid-season milestone upon written confirmation of Deliverables completed up to that point;
   (c) 30% — ₹${Math.round(c.amount*0.3).toLocaleString("en-IN")} — payable within 15 (fifteen) working days of the BCPL ${COMPANY.season} closing ceremony, subject to full Deliverable completion.

5.3 TAX DEDUCTION AT SOURCE (TDS)
TDS shall be deducted at the applicable rate under Section 194J (Fees for Professional or Technical Services) of the Income Tax Act, 1961. BCPL shall issue Form 16A to the Ambassador within 30 (thirty) days of each deduction.

5.4 GOODS AND SERVICES TAX (GST)
If the Ambassador is registered under GST, they shall provide their valid GSTIN and issue a compliant Tax Invoice. GST at the applicable rate (currently 18% on professional services) shall be payable by BCPL over and above the Ambassador Fee, subject to issuance of proper invoice.

5.5 EXPENSE REIMBURSEMENT
BCPL shall reimburse reasonable, pre-approved, and documented travel, accommodation, and incidental expenses incurred by the Ambassador solely for the purpose of fulfilling Deliverables under this Agreement. Claims must be submitted with supporting receipts within 15 days of incurrence and shall be settled within 10 working days of approval.

5.6 PERFORMANCE INCENTIVE
BCPL may, at its sole discretion, provide a performance incentive bonus of up to 20% of the Ambassador Fee in the event the Ambassador's verified social media Deliverables result in measurable, documented outcomes (e.g. verified campaign reach exceeding agreed targets). The criteria and targets for this incentive shall be mutually agreed in writing before the Season commences.

5.7 FEE DEDUCTIONS
BCPL reserves the right to proportionally deduct from outstanding fees for undelivered Deliverables, provided the Ambassador has been given 7 (seven) days' written notice to cure such default.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 6 — IMAGE RIGHTS & INTELLECTUAL PROPERTY

6.1 LICENSE GRANT
The Ambassador grants to BCPL a non-exclusive, royalty-free, worldwide license during the Term to use the Ambassador's:
   (a) Name, signature, and biographical information;
   (b) Voice, likeness, image, and photograph as captured during Campaigns;
   (c) Performance footage, video recordings, and audio clips made during Campaigns and official appearances;
   for all purposes connected with BCPL's marketing, promotion, advertising, and commercial activities across all media (digital, print, OOH, broadcast, social media).

6.2 POST-TERM USE
BCPL may continue to display Campaign Content featuring the Ambassador for a period of 6 (six) months after expiry of this Agreement, strictly in the context of BCPL Season 5 highlights, archival documentation, and annual reports. Any use beyond this period requires fresh written consent.

6.3 BCPL OWNERSHIP
All Campaign materials, brand assets, photographs, videos, and creative works produced by BCPL or its agents (including content featuring the Ambassador) shall be the exclusive intellectual property of BCPL.

6.4 AMBASSADOR'S PERSONAL CHANNELS
The Ambassador may share BCPL-produced Content on personal social media channels in compliance with BCPL's brand guidelines, provided BCPL branding is not removed, cropped, or altered.

6.5 THIRD-PARTY CONTENT
The Ambassador shall not use, reproduce, or sub-license any BCPL Content for purposes other than those specifically approved in writing by BCPL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 7 — CODE OF CONDUCT & MEDIA OBLIGATIONS

7.1 GENERAL CONDUCT
The Ambassador shall at all times maintain the highest standards of professional, ethical, and social behaviour — both publicly and privately — in a manner fully consistent with BCPL's values, public image, and brand positioning.

7.2 PROHIBITED CONDUCT
The Ambassador shall not:
   (a) Make any statement, post, gesture, or act that is discriminatory, communally or religiously insensitive, defamatory, sexually explicit, or in violation of applicable Indian law;
   (b) Engage in, be publicly associated with, or be convicted of any activity that is illegal, fraudulent, or deemed morally reprehensible by a reasonable standard;
   (c) Publicly criticise, disparage, or make derogatory statements about BCPL, its management, team owners, sponsors, players, or the sport of cricket;
   (d) Misrepresent their association with BCPL or make any claim about BCPL that is false, exaggerated, or misleading.

7.3 MEDIA INTERACTIONS
   (a) The Ambassador shall speak on behalf of BCPL only when explicitly authorised in writing by BCPL's communications team;
   (b) All unscripted media interactions relating to BCPL's strategy, financials, legal matters, or management shall be referred to BCPL's designated spokesperson prior to any response.

7.4 CRISIS COMMUNICATION PROTOCOL
If any event occurs (personal, professional, or in the public domain) that may foreseeably and adversely impact the Ambassador's public reputation or BCPL's brand standing, the Ambassador shall notify BCPL's designated contact within 24 (twenty-four) hours. The Parties shall cooperate in developing an appropriate joint communication strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 8 — MORALITY CLAUSE

8.1 BCPL may terminate this Agreement immediately, without notice and without payment of any remaining outstanding fees, if the Ambassador:
   (a) Is convicted of, or pleads guilty to, any criminal offence (including but not limited to fraud, corruption, assault, substance-related offences, or sexual misconduct);
   (b) Makes any public statement, gesture, or engages in conduct that, in BCPL's sole and reasonable judgement, brings or threatens to bring material disrepute, embarrassment, or reputational harm to the BCPL brand;
   (c) Is publicly and credibly associated with substance abuse, financial fraud, harassment, sexual misconduct, or extremist activities;
   (d) Commits any material breach of Clause 7 (Code of Conduct) that is not cured within 48 hours of written notice.

8.2 In the event of termination under this Clause, BCPL shall be entitled to seek injunctive relief, specific performance, or any other appropriate equitable remedy from a court of competent jurisdiction without being required to post any bond or security.

8.3 The Ambassador shall, within 7 (seven) days of termination under this Clause, remove or archive all BCPL-branded Content from their personal social media channels, unless otherwise instructed by BCPL in writing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 9 — CONFIDENTIALITY

9.1 The Ambassador shall maintain in the strictest confidence all non-public information obtained from or in connection with BCPL, including but not limited to: business strategies, financial terms, sponsor agreements, player evaluation data, franchise plans, and marketing budgets.
9.2 This obligation of confidentiality shall survive the expiry or termination of this Agreement for a period of 3 (three) years.
9.3 The Ambassador shall not use any Confidential Information for personal commercial benefit or for the benefit of any third party, competitor, or media entity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 10 — TERMINATION

10.1 BY BCPL (WITHOUT CAUSE): BCPL may terminate this Agreement for any reason by giving 30 (thirty) days' written notice. All fees earned up to the date of notice shall be paid within 15 working days.

10.2 BY AMBASSADOR (WITHOUT CAUSE): The Ambassador may terminate by giving 30 (thirty) days' written notice, provided all pre-scheduled Campaigns and appearances within the notice period are completed. The Ambassador shall forfeit all unpaid future tranches of the Ambassador Fee.

10.3 BY BCPL (FOR CAUSE — IMMEDIATE): As specified in Clause 8 (Morality Clause), or for material breach of any obligation under this Agreement not cured within 7 (seven) days of written notice. No further fees shall be payable.

10.4 CONSEQUENCES OF TERMINATION: Upon termination, (a) all licenses granted under Clause 6 shall cease (subject to Clause 6.2); (b) the Ambassador shall immediately cease using BCPL Brand Assets; (c) the Ambassador shall confirm in writing within 7 days that all Brand Assets have been returned or destroyed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 11 — INDEMNIFICATION

11.1 AMBASSADOR'S INDEMNITY: The Ambassador shall indemnify, defend, and hold BCPL and its officers, directors, shareholders, agents, and employees harmless from and against any and all claims, demands, losses, liabilities, costs, and legal expenses arising from: (a) any breach by the Ambassador of any representation, warranty, or obligation under this Agreement; (b) any Content created by the Ambassador that infringes a third party's intellectual property rights, defames any person, or violates any applicable law.

11.2 BCPL'S INDEMNITY: BCPL shall indemnify the Ambassador from any third-party claims arising solely and directly from BCPL's breach of this Agreement or from defects in BCPL-created Campaign materials.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 12 — GENERAL PROVISIONS

12.1 GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of India.
12.2 DISPUTE RESOLUTION: The Parties shall first attempt to resolve any dispute through good-faith negotiation within 30 (thirty) days of written notice of the dispute. If unresolved, the dispute shall be submitted to arbitration under the Arbitration and Conciliation Act, 1996. Seat of arbitration: New Delhi. Language: English. Each Party appoints one arbitrator, and the two appointed arbitrators shall jointly appoint a presiding arbitrator.
12.3 ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, discussions, and agreements.
12.4 AMENDMENTS: No amendment to this Agreement shall be valid unless made in writing and duly signed by both Parties.
12.5 SEVERABILITY: If any provision is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.
12.6 ASSIGNMENT: The Ambassador may not assign any rights or obligations under this Agreement without BCPL's prior written consent. BCPL may assign this Agreement to any affiliate or successor entity.
12.7 WAIVER: Failure by either Party to enforce any provision shall not constitute a waiver of that right.
12.8 FORCE MAJEURE: Neither Party shall be liable for delays or failure to perform due to causes beyond their reasonable control (including acts of God, government orders, pandemics), provided the affected Party gives written notice within 48 hours.
12.9 NOTICES: All formal notices under this Agreement shall be in writing and delivered by email (with read receipt) or registered post to the addresses on record with both Parties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHEDULE A — DELIVERABLES SUMMARY

┌────────────────────────────────┬──────────────────────┬─────────────────┐
│ Deliverable                    │ Minimum Frequency    │ Format/Platform │
├────────────────────────────────┼──────────────────────┼─────────────────┤
│ Instagram/FB Branded Post      │ 4 per month          │ Social Media    │
│ LinkedIn Professional Post     │ 2 per month          │ Social Media    │
│ BCPL Press Conference/Launch   │ 2 per Season         │ In-Person       │
│ Player Auction Event           │ 1 per Season         │ In-Person/Video │
│ Match-Day Appearance           │ 2 per Season         │ In-Person       │
│ Campaign Photo/Video Shoot     │ As mutually agreed   │ Studio/On-site  │
│ YouTube/WhatsApp Promo Clip    │ 1 per Season         │ Digital         │
└────────────────────────────────┴──────────────────────┴─────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHEDULE B — CONTRACT PARTICULARS

┌────────────────────────────┬──────────────────────────────────────────┐
│ Contract Reference         │ ${c.id}                                  │
│ Ambassador                 │ ${c.player}                              │
│ Represented As             │ ${c.team}                                │
│ Total Ambassador Fee       │ ₹${c.amount.toLocaleString("en-IN")}     │
│ Agreement Start            │ ${today}                                  │
│ Agreement End              │ ${expiry}                                 │
│ Season                     │ BCPL ${COMPANY.season}                   │
│ GSTIN (Company)            │ ${COMPANY.gstin}                         │
│ CIN (Company)              │ ${COMPANY.cin}                           │
└────────────────────────────┴──────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed as of the date first written above.

FOR BHARTIYA CORPORATE PREMIER LEAGUE PVT. LTD.:

Authorised Signatory:    _________________________
Name:                    Saurabh Jha
Designation:             Director
Date:                    ${today}
Company Seal:            [SEAL]


FOR THE AMBASSADOR:

Signature:               _________________________
Full Name:               ${c.player}
Date:                    ${today}
PAN:                     ______________________
GSTIN (if applicable):   ______________________

WITNESS 1:
Name:                    _________________________
Signature & Date:        _________________________

WITNESS 2:
Name:                    _________________________
Signature & Date:        _________________________

This Agreement was executed at New Delhi, India.
Applicable stamp duty to be affixed as per the Indian Stamp Act.
Subject to Delhi High Court jurisdiction.`;
}

function buildCoachContract(c: Contract): string {
  const today = new Date(c.date||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const expiry = new Date(c.expiry||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  return `BCPL T20 — COACHING SERVICES AGREEMENT
${COMPANY.season} · Contract Ref: ${c.id}

THIS COACHING AGREEMENT ("Agreement") is made on ${today} between:

ORGANIZATION: ${COMPANY.name}
CIN: ${COMPANY.cin} · GSTIN: ${COMPANY.gstin}
${COMPANY.address}
(hereinafter "the Company" or "BCPL")

COACH: ${c.player}
Specialization: ${c.role}
Franchise / Assignment: ${c.team}
(hereinafter "the Coach")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — ENGAGEMENT
BCPL engages the Coach as ${c.role} for the franchise team ${c.team} for BCPL T20 ${COMPANY.season}.
Contract Period: ${today} to ${expiry}.

CLAUSE 2 — DUTIES & RESPONSIBILITIES
The Coach shall:
a) Conduct regular training sessions, fitness drills, and skill clinics for the squad
b) Develop and implement the team's tactical approach for BCPL T20
c) Manage on-field strategy during matches, including batting order and field placements
d) Mentor players in their individual and collective performance
e) Attend all team meetings, selection panels, and BCPL coaching conferences

CLAUSE 3 — COACHING FEE
Total Remuneration: ₹${c.amount.toLocaleString("en-IN")} (${numberToWords(c.amount)} Rupees Only)
Payable in tranches: 30% on commencement, 40% at mid-season, 30% upon season completion.

CLAUSE 4 — TRAVEL & ACCOMMODATION
BCPL shall arrange and bear the cost of travel and accommodation for the Coach during all official BCPL events, matches, and training camps.

CLAUSE 5 — STANDARDS OF CONDUCT
The Coach agrees to maintain high standards of sportsmanship, fairness, and ethical conduct and shall comply with BCPL's Code of Conduct and anti-corruption charter.

CLAUSE 6 — ANTI-MATCH-FIXING DECLARATION
The Coach unconditionally declares that they are not involved in, nor will engage in, any form of match-fixing, spot-fixing, or any corrupt activity. Violation shall lead to immediate termination and reporting to BCCI / relevant authorities.

CLAUSE 7 — CONFIDENTIALITY
The Coach shall not disclose team strategies, squad selection decisions, player performance data, or BCPL confidential information to any third party.

CLAUSE 8 — NON-SOLICITATION
During and for 2 seasons after this contract, the Coach shall not solicit or entice any BCPL player to leave for a competing league.

CLAUSE 9 — MEDIA & COMMUNICATIONS
All public statements, interviews, and media interactions by the Coach regarding BCPL must be pre-approved by the Company's communications team.

CLAUSE 10 — TERMINATION
The Company may terminate with 15 days' notice. For gross misconduct or anti-corruption violations, termination shall be immediate with forfeiture of remaining fees.

CLAUSE 11 — GOVERNING LAW
Subject to Delhi jurisdiction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOR BCPL:
Signature:         _________________________
Date:              ${today}

FOR THE COACH:
Signature:         _________________________
Name:              ${c.player}
Date:              ${today}`;
}

function buildOperationsContract(c: Contract): string {
  const today = new Date(c.date||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const expiry = new Date(c.expiry||Date.now()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  return `BCPL T20 — SERVICE AGREEMENT (OPERATIONS & TOURNAMENT STAFF)
${COMPANY.season} · Contract Ref: ${c.id}

THIS SERVICE AGREEMENT ("Agreement") is entered into on ${today} by and between:

PRINCIPAL: ${COMPANY.name}
CIN: ${COMPANY.cin} · GSTIN: ${COMPANY.gstin}
${COMPANY.address}
(hereinafter "the Company")

SERVICE PROVIDER / STAFF: ${c.player}
Role/Position: ${c.role}
Assigned Event/Team: ${c.team}
(hereinafter "the Staff Member")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — SCOPE OF SERVICES
The Staff Member is engaged to provide operational support services for BCPL T20 ${COMPANY.season} in the capacity of ${c.role}.
Engagement Period: ${today} to ${expiry}.

CLAUSE 2 — RESPONSIBILITIES
The Staff Member shall:
a) Execute all duties specified by the Tournament Director and designated supervisors
b) Ensure smooth operations at all BCPL venues, including setup, ground management, logistics, and player support
c) Coordinate with venue staff, media, security, and franchise representatives
d) Maintain decorum and professional behavior at all BCPL events
e) Submit daily and event-wise operational reports to the assigned manager

CLAUSE 3 — SERVICE FEE
Total Service Fee: ₹${c.amount.toLocaleString("en-IN")} (${numberToWords(c.amount)} Rupees Only)
Payment shall be released within 7 working days of each event/milestone completion.
TDS shall be deducted as per prevailing rates under the Income Tax Act.

CLAUSE 4 — VENUE & TRAVEL
The Company shall provide venue access passes. Travel and accommodation arrangements shall be as per the specific event logistics plan shared separately.

CLAUSE 5 — UNIFORM & IDENTIFICATION
The Staff Member must wear the official BCPL operations uniform and carry valid ID at all times during events. No BCPL branding may be used on personal channels without prior written approval.

CLAUSE 6 — CONFIDENTIALITY
The Staff Member agrees to maintain strict confidentiality of all tournament plans, scheduling, financial arrangements, and any player-related information.

CLAUSE 7 — CONDUCT STANDARDS
The Staff Member shall follow BCPL's Code of Conduct. Any harassment, misconduct, substance use, or breach of safety norms shall result in immediate contract termination.

CLAUSE 8 — ANTI-CORRUPTION
The Staff Member declares they have no conflict of interest and will not engage in any activity that may constitute match-fixing, spot-fixing, or corruption. Violations will be reported to appropriate authorities.

CLAUSE 9 — EQUIPMENT & ASSETS
All equipment, devices, access cards, and materials provided by the Company remain BCPL property and must be returned at contract end.

CLAUSE 10 — DISPUTE RESOLUTION
Disputes to be resolved through arbitration. Subject to Delhi jurisdiction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOR THE COMPANY:
Signature:         _________________________
Date:              ${today}

STAFF MEMBER:
Signature:         _________________________
Name:              ${c.player}
Role:              ${c.role}
Date:              ${today}`;
}

/* ─── Full Legal Player Contract Text ───────────────────────────── */
function buildPlayerContract(c: Contract): string {
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
const SIG_KEY = "bcpl_founder_signature";

function ContractModal({ c, onClose }: { c: Contract; onClose: ()=>void }) {
  const contractText = buildContractText(c);
  const cType = c.contractType || "Player";

  function downloadPDF() {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/`;
    const logoUrl  = base + "bcpl-logo-white.png";
    const ballUrl  = base + "bcpl-ball-transparent.png";
    const sigUrl   = localStorage.getItem(SIG_KEY) || (base + "bcpl-signature.png");
    const stampUrl = base + "bcpl-stamp.png";
    const w = window.open("", "_blank");
    if (!w) return;
    const cType = c.contractType || "Player";
    w.document.write(`<!DOCTYPE html><html><head><title>${c.id} — BCPL ${cType} Contract</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Georgia',serif;font-size:11.5px;line-height:1.82;color:#1a1a1a;background:#fff;position:relative}

      /* ── Watermark — transparent ball, zero box artifacts ── */
      .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        width:460px;height:460px;z-index:0;pointer-events:none;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .watermark img{width:100%;height:100%;object-fit:contain;opacity:0.055;display:block}

      /* ── Premium Letterhead ── */
      .lh{display:flex;align-items:center;gap:22px;
        background:linear-gradient(120deg,#060F25 0%,#0D1E44 55%,#091630 100%);
        padding:18px 36px;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .lh-logo{height:56px;width:auto;object-fit:contain;display:block;
        filter:brightness(1.35) drop-shadow(0 2px 14px rgba(0,0,0,0.65))}
      .lh-divider{width:1.5px;height:62px;flex-shrink:0;margin:0 6px;
        background:linear-gradient(180deg,transparent 5%,rgba(232,178,61,0.65) 50%,transparent 95%)}
      .lh-right{flex:1}
      .lh-company{font-size:11px;font-weight:900;color:#FFFFFF;letter-spacing:.07em;
        margin-bottom:5px;font-family:'Arial',sans-serif;text-transform:uppercase}
      .lh-tagline{font-size:8px;color:rgba(255,255,255,0.45);font-family:'Arial',sans-serif;
        letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px}
      .lh-contact{font-size:8.5px;color:rgba(255,255,255,0.48);margin-top:2px;font-family:'Arial',sans-serif}
      .lh-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;align-items:center}
      .chip{font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.42);
        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.11);
        border-radius:4px;padding:2px 8px;letter-spacing:.04em;font-family:'Courier New',monospace}
      .chip-gold{font-size:7.5px;font-weight:800;color:#E8B23D;
        background:rgba(232,178,61,0.1);border:1px solid rgba(232,178,61,0.38);
        border-radius:4px;padding:2px 8px;letter-spacing:.08em;font-family:'Arial',sans-serif}

      /* ── Gold accent bar ── */
      .accent-bar{height:4px;
        background:linear-gradient(90deg,#9A3408,#FF6B00,#E8B23D,#FFD700,#E8B23D,#FF6B00,#9A3408);
        -webkit-print-color-adjust:exact;print-color-adjust:exact}

      /* ── Document title strip ── */
      .doc-title{background:#F9F5F0;padding:8px 36px;font-size:9px;font-weight:900;
        color:#7A3A0A;letter-spacing:.22em;text-align:center;
        border-bottom:1px solid #EDE0D0;font-family:'Arial',sans-serif}

      /* ── Body ── */
      .body{padding:28px 40px 40px;max-width:860px;margin:0 auto;position:relative;z-index:1}

      /* ── Contract badge ── */
      .contract-badge{
        background:linear-gradient(135deg,#FFF9F4,#FFF3E8);
        border:1.5px solid rgba(201,78,14,0.32);border-radius:12px;
        padding:16px 24px;margin-bottom:28px;
        box-shadow:0 2px 16px rgba(255,107,0,0.05)}
      .contract-badge h2{font-size:13.5px;color:#8B3A0A;letter-spacing:.12em;font-weight:900;
        text-transform:uppercase;margin-bottom:5px;font-family:'Arial',sans-serif}
      .contract-badge p{font-size:9.5px;color:#AAA;font-family:'Arial',sans-serif}
      .contract-badge .ref{font-size:11px;color:#FF6B00;font-weight:700;margin-top:7px;
        font-family:'Courier New',monospace;letter-spacing:.04em}

      /* ── Content ── */
      pre{white-space:pre-wrap;word-wrap:break-word;
        font-family:'Georgia',serif;font-size:11px;line-height:1.88;color:#1a1a1a}

      /* ── Signature block ── */
      .sig-block{margin-top:38px;border-top:1.5px solid #E2D4C4;padding-top:26px;display:flex;gap:40px}
      .sig-line{flex:1}
      .sig-line .label{font-size:8.5px;color:#aaa;text-transform:uppercase;
        letter-spacing:.08em;margin-bottom:10px;font-family:'Arial',sans-serif}
      .sig-img{height:64px;object-fit:contain;display:block;margin-bottom:4px}
      .stamp-img{height:90px;object-fit:contain;display:block;margin-bottom:4px;opacity:0.85}
      .sig-line .line{border-bottom:1.5px solid #333;margin-bottom:5px}
      .sig-line .name{font-size:10px;color:#444;font-family:'Arial',sans-serif;font-weight:600}
      .sig-line .desig{font-size:8.5px;color:#888;font-family:'Arial',sans-serif;margin-top:2px}

      /* ── Page footer — at bottom of doc (not fixed, avoids content cut) ── */
      .pg-footer{
        margin-top:40px;
        background:linear-gradient(120deg,#060F25,#0D1E44);
        border-top:3px solid #FF6B00;padding:10px 36px;
        font-size:7.5px;color:rgba(255,255,255,0.4);
        display:flex;justify-content:space-between;align-items:center;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
        font-family:'Arial',sans-serif;letter-spacing:.03em}
      .pg-footer strong{color:#E8B23D}

      @media print{
        .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)}
        @page{margin:14mm 16mm 20mm 16mm;size:A4}
        body{margin:0}
        pre{page-break-inside:auto;orphans:4;widows:4}
        .contract-badge{page-break-inside:avoid}
        .sig-block{page-break-inside:avoid;page-break-before:avoid}
        .pg-footer{position:fixed;bottom:0;left:0;right:0;margin-top:0}
        .body{padding-bottom:70px}
        .lh{page-break-inside:avoid}
      }
    </style></head>
    <body>
      <!-- Watermark: transparent PNG ball → no white box -->
      <div class="watermark"><img src="${ballUrl}" alt=""/></div>

      <!-- Premium Letterhead -->
      <div class="lh">
        <img src="${logoUrl}" class="lh-logo" alt="BCPL Logo"/>
        <div class="lh-divider"></div>
        <div class="lh-right">
          <div class="lh-company">Bhartiya Corporate Premier League Pvt. Ltd.</div>
          <div class="lh-tagline">India's Premier Corporate T20 Cricket League</div>
          <div class="lh-contact">${COMPANY.address}</div>
          <div class="lh-contact">✉ legal@bcplt20.com &nbsp;·&nbsp; 🌐 www.bcplt20.com &nbsp;·&nbsp; ☎ ${COMPANY.phone}</div>
          <div class="lh-chips">
            <span class="chip">GSTIN: ${COMPANY.gstin}</span>
            <span class="chip">CIN: ${COMPANY.cin}</span>
            <span class="chip-gold">🏆 SEASON 5 · 2026–27</span>
          </div>
        </div>
      </div>
      <div class="accent-bar"></div>
      <div class="doc-title">OFFICIAL LEGAL DOCUMENT — ${cType.toUpperCase()} CONTRACT &nbsp;·&nbsp; ${COMPANY.season.toUpperCase()}</div>

      <div class="body">
        <div class="contract-badge">
          <h2>🏏 ${cType} Contract — ${COMPANY.season}</h2>
          <p>This is an official legally binding document issued under the authority of Bhartiya Corporate Premier League Pvt. Ltd.</p>
          <div class="ref">Ref: ${c.id} &nbsp;&nbsp;·&nbsp;&nbsp; Party: ${c.player} &nbsp;&nbsp;·&nbsp;&nbsp; ${c.team}</div>
        </div>
        <pre>${contractText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>

        <div class="sig-block">
          <div class="sig-line">
            <div class="label">Authorised Signatory — BCPL</div>
            <img src="${sigUrl}" class="sig-img" alt="Signature"/>
            <img src="${stampUrl}" class="stamp-img" alt="BCPL Stamp"/>
            <div class="line"></div>
            <div class="name">Saurabh Jha</div>
            <div class="desig">Founder &amp; Director — Bhartiya Corporate Premier League Pvt. Ltd.</div>
          </div>
        </div>
      </div>

      <div class="pg-footer">
        <span>Ref: <strong>${c.id}</strong> &nbsp;·&nbsp; ${cType} Contract</span>
        <span><strong>BCPL</strong> — Bhartiya Corporate Premier League Pvt. Ltd. &nbsp;·&nbsp; STRICTLY CONFIDENTIAL</span>
        <span>legal@bcplt20.com &nbsp;·&nbsp; bcplt20.com</span>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(), 800);
  }

  const card:React.CSSProperties={background:"#0D1526",border:"1px solid #1E293B",borderRadius:20};

  return (
    <div style={{position:"fixed",inset:0,background:"#000000CC",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={onClose}>
      <div style={{...card,width:"100%",maxWidth:740,maxHeight:"94vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px",borderBottom:"1px solid #1E293B",flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#F1F5F9"}}>📜 {cType} Contract</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{c.id} · {c.player} · {c.team}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={downloadPDF} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#FF6B00,#FF8C40)",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>⬇ Download PDF</button>
            <button onClick={onClose} style={{padding:"6px 10px",borderRadius:8,border:"none",background:"#1E293B",color:"#64748B",fontSize:12,cursor:"pointer"}}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{overflowY:"auto",flex:1,padding:"20px 24px"}}>
          <pre style={{fontFamily:"'Courier New',monospace",fontSize:11,color:"#94A3B8",lineHeight:1.7,whiteSpace:"pre-wrap",wordWrap:"break-word",margin:0}}>
            {contractText}
          </pre>
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
  const [sigImg,   setSigImg]   = useState<string>(() => localStorage.getItem(SIG_KEY) || "");
  const sigFileRef = useRef<HTMLInputElement>(null);

  function handleSigUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      localStorage.setItem(SIG_KEY, b64);
      setSigImg(b64);
    };
    reader.readAsDataURL(file);
  }
  const [genForm,  setGenForm]  = useState({ player:"", phone:"", email:"", team:TEAMS_LIST[0], role:"Batsman", amount:"", date:"", expiry:"", contractType:"Player" });
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
      contractType: genForm.contractType,
    };
    setContracts(prev=>[...prev, newC]);
    setPreview(newC);
    setGenOpen(false);
    setGenForm({ player:"", phone:"", email:"", team:TEAMS_LIST[0], role:"Batsman", amount:"", date:"", expiry:"", contractType:"Player" });
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

      {/* Founder Signature Upload */}
      <div style={{...card,padding:"18px 22px",borderLeft:"4px solid #6366F1",background:"linear-gradient(135deg,#6366F110,#0D1526)",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:12,fontWeight:800,color:"#6366F1",marginBottom:3}}>🖊 Founder Signature</div>
          <div style={{fontSize:11,color:"#475569"}}>Upload the authorised signatory's signature — it will appear on all generated contracts.</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
          {sigImg
            ? <img src={sigImg} alt="Founder signature" style={{height:52,maxWidth:160,objectFit:"contain",background:"#fff",borderRadius:8,padding:"4px 10px",border:"1px solid #1E293B"}}/>
            : <div style={{height:52,width:120,borderRadius:8,border:"1px dashed #334155",background:"#060B18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#334155"}}>No signature</div>
          }
          <input ref={sigFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleSigUpload}/>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={()=>sigFileRef.current?.click()}
              style={{padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>
              📁 Upload Signature
            </button>
            {sigImg && <button onClick={()=>{ localStorage.removeItem(SIG_KEY); setSigImg(""); }}
              style={{background:"none",border:"none",color:"#EF4444",fontSize:11,cursor:"pointer",textAlign:"center"}}>
              Remove
            </button>}
          </div>
        </div>
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
                    <button onClick={()=>{ if(confirm(`Delete contract ${c.id} for ${c.player}? This cannot be undone.`)) setContracts(cs=>cs.filter(x=>x.id!==c.id)); }}
                      style={{padding:"4px 10px",borderRadius:6,border:"1px solid #EF444444",background:"#EF444411",color:"#EF4444",fontSize:11,cursor:"pointer",fontWeight:700}}>🗑</button>
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
            <div style={{fontSize:18,fontWeight:800,color:"#F1F5F9",marginBottom:4}}>+ Generate Contract</div>
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>BCPL official contracts — {COMPANY.name}</div>
            {[
              {label:"Contract Type",    key:"contractType", type:"select", options:["Player","Employee","Brand Ambassador","Coach","Operations Staff"]},
              {label:"Full Name",        key:"player", type:"text",   placeholder:"e.g. Rahul Sharma"},
              {label:"Phone",            key:"phone",  type:"tel",    placeholder:"e.g. 9876543210"},
              {label:"Email",            key:"email",  type:"email",  placeholder:"e.g. person@email.com"},
              {label: genForm.contractType==="Brand Ambassador" ? "Represented As / Entity" : genForm.contractType==="Employee" ? "Department" : "Team / Franchise",
               key:"team", type:"select",
               options: genForm.contractType==="Brand Ambassador"
                 ? ["BCPL (League)","Individual"]
                 : genForm.contractType==="Employee"
                   ? ["BCPL HQ","Admin","Marketing","Finance","Operations","Logistics","Media & Content","IT","Legal","Ground & Venue"]
                   : TEAMS_LIST},
              {label:"Designation / Role",key:"role",  type:"select", options:["Batsman","Bowler","All-Rounder","Wicket-Keeper","Head Coach","Batting Coach","Bowling Coach","Fielding Coach","Operations Manager","Ground Staff","Marketing Executive","Finance Officer","Admin Executive","Brand Manager","PR Manager"]},
              {label:"Value (₹K)",       key:"amount", type:"number", placeholder:"e.g. 500 = ₹5L"},
              {label:"Valid From",       key:"date",   type:"date",   placeholder:""},
              {label:"Valid Until",      key:"expiry", type:"date",   placeholder:""},
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
                📜 Generate {genForm.contractType} Contract
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
