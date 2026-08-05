/**
 * SEO keyword landing pages — shared FAQ constants (website side).
 *
 * These Q/A pairs are kept in sync with the server-side copy in
 * artifacts/api-server/src/lib/landingSeo.ts, which builds the FAQPage
 * structured data. Keeping the text identical means the JSON-LD Google reads
 * matches exactly what a visitor sees on the page.
 *
 * Every fact comes from the site's FAQ page (48-hour result target, 30–60
 * second video, evaluation-based process). No invented numbers, no banned
 * wording (no absolute-promise or superlative language).
 */

export interface LandingFaq {
  q: string;
  a: string;
}

export const CORPORATE_CRICKET_FAQS: LandingFaq[] = [
  {
    q: "What is a corporate cricket league?",
    a: "A corporate cricket league is an organised cricket competition for working professionals rather than full-time cricketers. BCPL runs a franchise-style T20 league where salaried employees, business owners, freelancers and other working professionals across India can register, be assessed on their cricket skills and play competitive matches.",
  },
  {
    q: "Who can play in BCPL?",
    a: "Any working professional aged 18 to 45 years (as on the date of registration) can register — salaried employees, self-employed individuals, freelancers or business owners. You must be currently employed or actively running a business, and not currently under a first-class or professional cricket contract.",
  },
  {
    q: "How does the process work?",
    a: "You register online and choose your playing role, then upload a 30–60 second cricket skills video within 15 days. Your submission is assessed under BCPL's role-specific Phase 1 framework and your result target is within 48 hours of video submission. Players who advance can choose to attend a physical trial in Phase 2.",
  },
  {
    q: "Do I need to be a trained cricketer?",
    a: "No formal training is required. Basic cricket experience and genuine passion for the game are enough. The Phase 1 assessment is evaluation-based and looks at your role-specific skills shown in your video.",
  },
  {
    q: "When does the BCPL season take place?",
    a: "The season runs in phases: online registration and video assessment, followed by physical trials, then the auction and the T20 matches. Registration typically opens ahead of the season so working professionals have time to register and submit their video.",
  },
];

export const DELHI_FAQS: LandingFaq[] = [
  {
    q: "Is there a corporate cricket tournament in Delhi-NCR?",
    a: "Yes. BCPL is a corporate cricket league open to working professionals, and Delhi-NCR is one of the trial regions. Delhi corporate employees can register online, submit a cricket video and, if they advance, attend a physical trial at an authorised venue in the region.",
  },
  {
    q: "How do Delhi corporate employees join?",
    a: "Register online, choose your playing role and select your nearest trial city during registration. You then upload a 30–60 second cricket skills video within 15 days. Your result target is within 48 hours of video submission.",
  },
  {
    q: "Where are the Delhi trials held?",
    a: "Phase 2 physical trials are conducted at authorised venues. When you register you choose your nearest trial city, and Delhi-NCR players are assigned a venue in the region. The physical trial is a standardised, role-specific assessment scored out of 100.",
  },
  {
    q: "Can I register from anywhere in the NCR?",
    a: "Yes. Registration is online, so you can register from anywhere in Delhi, Gurugram, Noida, Ghaziabad or Faridabad. You simply pick your nearest trial city so your physical-trial venue is convenient.",
  },
  {
    q: "What happens after I submit my video?",
    a: "Your video is assessed under BCPL's role-specific Phase 1 framework and you receive a result within 48 hours. Players who advance can choose to proceed to the Phase 2 physical trial in their region.",
  },
];

export const HOW_TO_JOIN_FAQS: LandingFaq[] = [
  {
    q: "How do I join the corporate cricket league?",
    a: "Visit the registration page, fill the form, choose your playing role (Batsman, Bowler, Wicket-Keeper or All-Rounder) and select your nearest trial city. After registering you upload a 30–60 second cricket skills video within 15 days. The registration itself takes about 5 minutes.",
  },
  {
    q: "How long is the trial video and when is it due?",
    a: "The trial video is 30–60 seconds long and must be uploaded within 15 days of registration. It should show your own current cricket performance for your chosen role — batting, bowling or keeping. All-rounders should show at least two skills.",
  },
  {
    q: "How soon do I get my Phase 1 result?",
    a: "Your video is assessed under BCPL's role-specific Phase 1 framework and your result target is within 48 hours of video submission. The process is evaluation-based; results may include a score and/or ranking where applicable.",
  },
  {
    q: "What happens if I advance to the next phase?",
    a: "Players who are shortlisted to advance can choose to proceed to Phase 2 — a physical, standardised cricket trial at an authorised venue, assessed against a role-specific 100-point framework. Only players who choose to proceed pay the Phase 2 fee.",
  },
  {
    q: "What comes after the physical trial?",
    a: "After the physical trial your assessment is recorded and enters a result-pending state until advancement is finalised under the applicable season rules. Players who qualify for the Auction Pool are eligible to take part in the player-auction process through which franchise teams are formed.",
  },
];

export const OFFICE_TEAM_FAQS: LandingFaq[] = [
  {
    q: "Can my office colleagues and I join together?",
    a: "Yes. Colleagues from the same company can all register for BCPL. Registration is individual — each person registers, chooses their role and submits their own cricket video — but there is nothing stopping a whole office group from taking part in the same season.",
  },
  {
    q: "Do we register as a team or individually?",
    a: "Registration is individual. Each working professional registers on their own, submits a 30–60 second cricket video and is assessed under the role-specific Phase 1 framework. This keeps the assessment fair while still letting an entire office group take part.",
  },
  {
    q: "Is this good for company team-building and fitness?",
    a: "Many colleagues join for the teamwork and fitness angle. Preparing for the video and the physical trial encourages regular practice and outdoor activity, and taking part together is a shared goal that builds camaraderie beyond the workplace.",
  },
  {
    q: "What are the eligibility basics for office players?",
    a: "Players must be working professionals aged 18 to 45 (as on the date of registration) with basic cricket experience, and not currently under a first-class or professional cricket contract. Salaried employees, self-employed people, freelancers and business owners are all welcome.",
  },
  {
    q: "How does the process work for a group from one office?",
    a: "Everyone registers individually, uploads their 30–60 second video within 15 days and receives a Phase 1 result within 48 hours. Colleagues who advance can each choose to proceed to the Phase 2 physical trial in their nearest trial city.",
  },
];
