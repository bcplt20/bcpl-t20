const fs = require('fs');
const path = require('path');

const tsFilePath = path.join(__dirname, 'artifacts/bcpl-mobile/data/pages.ts');
let tsContent = fs.readFileSync(tsFilePath, 'utf8');

const trialRulesContent = `[
  { type: 'heading', text: "Purpose & Scope" },
  { type: 'p', text: "This document outlines the standard rules and protocols for BCPL Season 5 physical trials (Phase 2)." },
  { type: 'heading', text: "Before You Arrive" },
  { type: 'li', text: "Ensure your Phase 2 payment is complete." },
  { type: 'li', text: "Bring government-issued photo ID (Aadhaar/PAN)." },
  { type: 'li', text: "Wear appropriate cricket attire (whites or proper athletic wear)." },
  { type: 'heading', text: "Check-in, QR Pass & ID" },
  { type: 'p', text: "You must present your trial QR code at the registration desk. No QR code, no entry." },
  { type: 'heading', text: "Reporting, Late Arrival & Wristband" },
  { type: 'p', text: "Report at least 30 minutes before your slot. Late arrivals may forfeit their attempt without refund." },
  { type: 'heading', text: "The Six-Attempt Rule" },
  { type: 'li', text: "Batsman: 6 deliveries to showcase technique and power." },
  { type: 'li', text: "Bowler: 6 deliveries to demonstrate pace, spin, and accuracy." },
  { type: 'li', text: "All-Rounder: 6 deliveries batting + 6 deliveries bowling." },
  { type: 'li', text: "Wicketkeeper: 6 deliveries batting + standardized keeping assessment." },
  { type: 'heading', text: "Standardised Assessment" },
  { type: 'p', text: "Trials are assessed digitally by official BCPL coaches on a standardized 100-point rubric." },
]`;

const eligibilityContent = `[
  { type: 'heading', text: "AM I ELIGIBLE?", hi: "क्या मैं ELIGIBLE हूं?" },
  { type: 'p', text: "BCPL Season 5 is open to working professionals across India." },
  { type: 'heading', text: "1. Professional Status" },
  { type: 'li', text: "Salaried employees (any sector)", hi: "Salaried employees (किसी भी sector में)" },
  { type: 'li', text: "Self-employed professionals & freelancers", hi: "Self-employed professionals और freelancers" },
  { type: 'li', text: "Business owners & entrepreneurs", hi: "Business owners और entrepreneurs" },
  { type: 'li', text: "Gig / delivery / logistics workers", hi: "Gig / delivery / logistics workers" },
  { type: 'li', text: "Farmers & agriculture professionals", hi: "Farmers और agriculture professionals" },
  { type: 'li', text: "Government & PSU staff", hi: "Government और PSU staff" },
  { type: 'heading', text: "2. Age Requirements" },
  { type: 'p', text: "Minimum age: 18 years on the date of registration. Maximum age: 45 years on the date of registration." },
  { type: 'heading', text: "3. Cricket Experience" },
  { type: 'p', text: "You must NOT currently be under a first-class or professional cricket contract." },
  { type: 'heading', text: "4. Physical Fitness" },
  { type: 'p', text: "Must be medically fit to participate in outdoor cricket activities." }
]`;

const conductContent = `[
  { type: 'heading', text: "Code of Conduct" },
  { type: 'p', text: "BCPL expects high standards of sportsmanship, professionalism and integrity from all participants." },
  { type: 'heading', text: "1. Spirit of the Game" },
  { type: 'li', text: "Play hard but play fair — results matter, but integrity matters more." },
  { type: 'li', text: "Respect your opponents, teammates, umpires, and spectators." },
  { type: 'li', text: "Accept all decisions gracefully, whether in your favour or against." },
  { type: 'heading', text: "2. Anti-Corruption" },
  { type: 'li', text: "No betting on BCPL matches." },
  { type: 'li', text: "No sharing of inside information." },
  { type: 'heading', text: "3. Zero Tolerance Policy" },
  { type: 'p', text: "Abuse, violence, and discrimination will result in immediate expulsion from the league without refund." }
]`;

const rulebookContent = `[
  { type: 'heading', text: "Cricket Rulebook" },
  { type: 'p', text: "This document governs tournament matches. (Trial rules are separate)." },
  { type: 'heading', text: "Match Format" },
  { type: 'li', text: "Standard T20 format (20 overs per side)." },
  { type: 'li', text: "Maximum 4 overs per bowler." },
  { type: 'heading', text: "Powerplay" },
  { type: 'li', text: "First 6 overs: Maximum 2 fielders outside the 30-yard circle." },
  { type: 'li', text: "Overs 7-20: Maximum 5 fielders outside the circle." },
  { type: 'heading', text: "Free Hit" },
  { type: 'p', text: "All no-balls (front foot or height) result in a free hit on the next delivery." },
  { type: 'heading', text: "Tie-Breakers" },
  { type: 'p', text: "In the event of a tied match, a Super Over will determine the winner." }
]`;

function overwriteSlug(slug, newContentStr) {
  let regex = new RegExp(`('${slug}':\\s*\\{[^}]*title:\\s*"[^"]+",\\s*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'g');
  tsContent = tsContent.replace(regex, (match, p1, p2, p3) => {
    return p1 + '\n' + newContentStr.slice(1, -1) + '\n' + p3;
  });
}

overwriteSlug('trial-rules', trialRulesContent);
overwriteSlug('eligibility', eligibilityContent);
overwriteSlug('code-of-conduct', conductContent);
overwriteSlug('cricket-rulebook', rulebookContent);

fs.writeFileSync(tsFilePath, tsContent);
console.log('Fixed pages.ts manually');
