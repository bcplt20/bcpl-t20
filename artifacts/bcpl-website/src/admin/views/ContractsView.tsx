import { useState, useRef } from "react";

/* ─── Company Details (from GST Registration Certificate) ──── */
const COMPANY = {
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
  return `BCPL T20 — BRAND AMBASSADOR AGREEMENT
${COMPANY.season} · Contract Ref: ${c.id}

THIS BRAND AMBASSADOR AGREEMENT ("Agreement") is entered into on ${today} by and between:

PRINCIPAL: ${COMPANY.name}
CIN: ${COMPANY.cin} · GSTIN: ${COMPANY.gstin}
${COMPANY.address}
(hereinafter "the Company")

AMBASSADOR: ${c.player}
(hereinafter "the Ambassador")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAUSE 1 — APPOINTMENT
The Company appoints the Ambassador as the official Brand Ambassador of BCPL T20 ${COMPANY.season} for the period ${today} to ${expiry}.

CLAUSE 2 — SCOPE OF ENGAGEMENT
The Ambassador agrees to:
a) Promote BCPL T20 on all personal social media platforms (minimum 4 posts/month)
b) Attend BCPL press conferences, launch events, and sponsor activations as required
c) Feature in official promotional materials, advertisements, and digital campaigns
d) Endorse BCPL's mission and values publicly

CLAUSE 3 — AMBASSADOR FEE
Total Ambassador Fee: ₹${c.amount.toLocaleString("en-IN")} (${numberToWords(c.amount)} Rupees Only)
Payment Schedule: 50% on signing, 25% at mid-season, 25% at season close.
TDS shall be deducted as per applicable rates under Section 194J/194C.

CLAUSE 4 — EXCLUSIVITY
During the contract period, the Ambassador shall not represent, endorse, or appear in any capacity for a competing T20 cricket league or event.

CLAUSE 5 — IMAGE RIGHTS
The Company is granted a royalty-free license to use the Ambassador's name, image, voice, and likeness for BCPL T20 marketing across all media channels during the contract term.

CLAUSE 6 — SOCIAL MEDIA STANDARDS
All BCPL-related social media posts must be pre-approved by the Company's marketing team. The Ambassador shall not post any content that may harm BCPL's reputation.

CLAUSE 7 — CODE OF CONDUCT
The Ambassador shall maintain the highest standards of professional conduct, refraining from any activity that may harm the reputation of BCPL T20 or its sponsors.

CLAUSE 8 — CONFIDENTIALITY
The Ambassador agrees not to disclose any confidential information regarding the Company's business, sponsors, financials, or strategic plans.

CLAUSE 9 — INTELLECTUAL PROPERTY
All campaign assets, creative content, and materials featuring the Ambassador created for BCPL shall remain the intellectual property of the Company.

CLAUSE 10 — MORALITY CLAUSE
The Company reserves the right to terminate this Agreement immediately without payment of any outstanding fees if the Ambassador engages in conduct that, in the Company's reasonable judgment, brings disrepute to the BCPL brand.

CLAUSE 11 — INDEMNIFICATION
Each party shall indemnify the other against claims, losses, and liabilities arising from a breach of their respective obligations under this Agreement.

CLAUSE 12 — DISPUTE RESOLUTION
All disputes shall be resolved through arbitration. Subject to New Delhi jurisdiction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOR THE COMPANY:
Signature:         _________________________
Date:              ${today}

FOR THE AMBASSADOR:
Signature:         _________________________
Name:              ${c.player}
Date:              ${today}`;
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
function ContractModal({ c, onClose }: { c: Contract; onClose: ()=>void }) {
  const [emailAddr,  setEmailAddr]  = useState(c.email||"");
  const [emailSent,  setEmailSent]  = useState(false);
  const [emailLoading, setEL]       = useState(false);
  const [tab,        setTab]        = useState<"preview"|"email">("preview");
  const contractText = buildContractText(c);
  const cType = c.contractType || "Player";

  function downloadPDF() {
    const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}bcpl-assets/bcpl-ball-clean.png`;
    const w = window.open("", "_blank");
    if (!w) return;
    const cType = c.contractType || "Player";
    w.document.write(`<!DOCTYPE html><html><head><title>${c.id} — BCPL ${cType} Contract</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Arial',sans-serif;font-size:11.5px;line-height:1.75;color:#1a1a1a;background:#fff;position:relative}

      /* ── Watermark (every page) ── */
      body::before{
        content:'';position:fixed;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:380px;height:380px;
        background-image:url('${logoUrl}');
        background-size:contain;background-repeat:no-repeat;background-position:center;
        opacity:0.04;z-index:0;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
      }

      /* ── Header ── */
      .lh{
        display:flex;align-items:center;gap:20px;
        background:linear-gradient(135deg,#C94E0E,#FF6B00,#FF8C40);
        padding:18px 36px;color:#fff;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
      }
      .logo-wrap{
        width:68px;height:68px;border-radius:50%;overflow:hidden;
        border:3px solid rgba(255,255,255,.5);flex-shrink:0;
        background:#fff;
      }
      .logo-wrap img{width:100%;height:100%;object-fit:cover;display:block}
      .lh-title{font-size:18px;font-weight:900;letter-spacing:.05em;line-height:1.2}
      .lh-brand{font-size:10px;opacity:.9;margin-top:2px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
      .lh-sub{font-size:8.5px;opacity:.75;margin-top:3px}

      /* ── Gold accent bar ── */
      .accent-bar{height:4px;background:linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D);
        -webkit-print-color-adjust:exact;print-color-adjust:exact;}

      /* ── Body ── */
      .body{padding:28px 40px 24px;max-width:860px;margin:0 auto;position:relative;z-index:1}

      /* ── Contract badge ── */
      .contract-badge{
        text-align:center;
        background:#FFF8F3;
        border:2px solid #FF6B00;
        border-radius:10px;
        padding:14px 24px;
        margin-bottom:24px;
      }
      .contract-badge h2{font-size:15px;color:#C94E0E;letter-spacing:.1em;font-weight:900;text-transform:uppercase;margin-bottom:4px}
      .contract-badge p{font-size:10px;color:#777}
      .contract-badge .ref{font-size:11px;color:#FF6B00;font-weight:700;margin-top:6px;font-family:monospace}

      /* ── Content ── */
      pre{
        white-space:pre-wrap;word-wrap:break-word;
        font-family:Arial,sans-serif;font-size:11.5px;
        line-height:1.85;color:#1a1a1a;
      }

      /* ── Footer (every page) ── */
      .pg-footer{
        position:fixed;bottom:0;left:0;right:0;
        background:#FFF8F3;border-top:3px solid #FF6B00;
        padding:7px 36px;font-size:8px;color:#888;
        display:flex;justify-content:space-between;align-items:center;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;
        z-index:1;
      }
      .pg-footer strong{color:#FF6B00}

      /* ── Signature block ── */
      .sig-block{margin-top:32px;border-top:1px dashed #ddd;padding-top:20px;display:flex;gap:60px}
      .sig-line{flex:1}
      .sig-line .label{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.06em;margin-bottom:28px}
      .sig-line .line{border-bottom:1.5px solid #333;margin-bottom:4px}
      .sig-line .name{font-size:10px;color:#555}

      @media print{
        body::before{position:fixed}
        .pg-footer{position:fixed}
        @page{margin:0}
        body{margin:0}
      }
    </style></head>
    <body>
      <div class="lh">
        <div class="logo-wrap"><img src="${logoUrl}" alt="BCPL"/></div>
        <div>
          <div class="lh-title">BCPL — Bhartiya Corporate Premier League</div>
          <div class="lh-brand">India's Biggest Corporate Cricket League · Season 5</div>
          <div class="lh-sub">${COMPANY.name} · GSTIN: ${COMPANY.gstin} · CIN: ${COMPANY.cin}</div>
          <div class="lh-sub">${COMPANY.address}</div>
          <div class="lh-sub">legal@bcplt20.com &nbsp;·&nbsp; www.bcplt20.com</div>
        </div>
      </div>
      <div class="accent-bar"></div>

      <div class="body">
        <div class="contract-badge">
          <h2>🏏 ${cType} Contract &mdash; ${COMPANY.season}</h2>
          <p>This is an official legal document issued under the authority of ${COMPANY.name}</p>
          <div class="ref">Ref: ${c.id} &nbsp;·&nbsp; Party: ${c.player} &nbsp;·&nbsp; ${c.team}</div>
        </div>
        <pre>${contractText.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>

        <div class="sig-block">
          <div class="sig-line">
            <div class="label">Authorised Signatory — BCPL</div>
            <div class="line"></div>
            <div class="name">For ${COMPANY.name}</div>
          </div>
          <div class="sig-line">
            <div class="label">Signature of Party</div>
            <div class="line"></div>
            <div class="name">${c.player}</div>
          </div>
        </div>
      </div>

      <div class="pg-footer">
        <span>Ref: <strong>${c.id}</strong></span>
        <span><strong>BCPL</strong> — Bhartiya Corporate Premier League · Confidential &amp; Legally Binding</span>
        <span>legal@bcplt20.com · bcplt20.com</span>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(), 600);
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
            <div style={{fontSize:12,color:"#64748B",marginBottom:20}}>BCPL official contracts under {COMPANY.name}</div>
            {[
              {label:"Contract Type",    key:"contractType", type:"select", options:["Player","Employee","Brand Ambassador","Coach","Operations Staff"]},
              {label:"Full Name",        key:"player", type:"text",   placeholder:"e.g. Rahul Sharma"},
              {label:"Phone",            key:"phone",  type:"tel",    placeholder:"e.g. 9876543210"},
              {label:"Email",            key:"email",  type:"email",  placeholder:"e.g. person@email.com"},
              {label:"Team / Department",key:"team",   type:"select", options:TEAMS_LIST},
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
