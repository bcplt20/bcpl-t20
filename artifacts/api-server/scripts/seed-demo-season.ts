/**
 * DEV-ONLY demo seed — realistic Season-5 data for screenshots.
 * ============================================================================
 * Populates believable OFFICIAL-match data so every read-only screen has
 * something real to show:
 *   • ~6 COMPLETED league matches (2 innings each, plausible ball-by-ball
 *     deliveries → T20 scores 140-190, varied dismissals incl. bowled / lbw /
 *     caught / stumped / run-out, fours/sixes, some tight/maiden-ish overs).
 *   • 1 LIVE match (innings 1 mid-way) for live-score screens.
 *   • 1 scheduled FINAL fixture so the MVP "car prize" finalist logic lights up.
 *   • Recomputes the season-5 points_table from the demo results.
 *
 * These feed the existing engines untouched: /api/matches/:id/scorecard,
 * /api/matches/:id/live, /api/mvp/leaderboard, /api/points-table.
 *
 * SAFETY
 *   • Refuses to run when NODE_ENV=production.
 *   • Only ever touches matches / innings / deliveries / match_xi / points_table.
 *     NEVER registrations, users, payments, teams.
 *   • Idempotent-ish: every demo match is tagged with a "DEMO" venue marker and
 *     a high matchNo band; a run first deletes prior demo data, then re-seeds.
 *
 * USAGE
 *   pnpm exec tsx scripts/seed-demo-season.ts          # clean + seed
 *   pnpm exec tsx scripts/seed-demo-season.ts --clean  # remove demo data only
 */
import { db, pool } from "@workspace/db";
import {
  matchesTable, inningsTable, deliveriesTable, matchXITable, pointsTableEntries,
} from "@workspace/db/schema";
import { and, eq, inArray, like } from "drizzle-orm";

/* ── guards & constants ─────────────────────────────────────────────────── */
if (process.env.NODE_ENV === "production") {
  console.error("✗ Refusing to run: this demo seed is DEV-ONLY (NODE_ENV=production).");
  process.exit(1);
}

const SEASON = 5;
const DEMO_MARKER = "DEMO";          // appears in every demo match venue
const DEMO_MATCHNO_BASE = 9000;      // demo matches live at 9001+ (real ones are 1-23)

/* deterministic PRNG so re-runs produce the same realistic-looking data */
let _seed = 20260807;
function rand(): number { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
function randint(lo: number, hi: number): number { return lo + Math.floor(rand() * (hi - lo + 1)); }
function pick<T>(arr: T[]): T { return arr[randint(0, arr.length - 1)]; }

/* ── squads: 11 realistic Indian names per franchise, stable across matches ─ */
const SQUADS: Record<string, string[]> = {
  "Chennai Thalaivas": ["Karthik Raja", "Vetri Selvan", "Dinesh Anand", "Bala Murugan", "Suriya Prakash", "Naveen Kumar", "Ashwin Ram", "Hari Prasad", "Vijay Shankar", "Manoj Pandian", "Sathish Kannan"],
  "Mumbai Mavericks":  ["Rohan Shirke", "Aditya Patil", "Sameer Kadam", "Prithvi More", "Nikhil Rane", "Omkar Joshi", "Yash Desai", "Kunal Salvi", "Tejas Naik", "Rutvik Sawant", "Harsh Gaikwad"],
  "Ahmedabad Lions":   ["Jignesh Patel", "Bhavik Shah", "Ravi Chauhan", "Manan Desai", "Krunal Vyas", "Parth Mehta", "Dhruv Solanki", "Nirav Trivedi", "Ankit Rana", "Vishal Barot", "Yash Thakkar"],
  "Rajasthan Scorchers": ["Vikram Rathore", "Mahipal Singh", "Deepak Meena", "Rajveer Shekhawat", "Suresh Bishnoi", "Karan Gehlot", "Lokesh Jat", "Bhupendra Rao", "Aakash Choudhary", "Naresh Sharma", "Pankaj Yadav"],
  "Hyderabad Hawks":   ["Sai Teja", "Rahul Reddy", "Abdul Azeem", "Vamshi Krishna", "Praveen Goud", "Nithin Rao", "Farhan Khan", "Charan Teja", "Sandeep Naidu", "Uday Kiran", "Ravindra Yadav"],
  "Delhi Suryas":      ["Arjun Chauhan", "Nitin Sehrawat", "Rahul Bhardwaj", "Gaurav Rathee", "Manish Tomar", "Sahil Khatri", "Ankush Dahiya", "Vaibhav Nagar", "Deepanshu Malik", "Pranav Sharma", "Kartik Tanwar"],
  "Kolkata Tigers":    ["Souvik Das", "Arindam Ghosh", "Rajib Saha", "Debojit Roy", "Sourav Mondal", "Ankan Dutta", "Prosenjit Paul", "Rahul Sardar", "Bikram Nandi", "Subir Halder", "Anirban Sen"],
  "Bengaluru Rockets": ["Manjunath Gowda", "Kiran Kumar", "Prajwal Hegde", "Darshan Rao", "Nikhil Shetty", "Vinay Prasad", "Rohit Naidu", "Girish Murthy", "Sandeep Achar", "Tejas Bhat", "Lohith Reddy"],
  "Lucknow Nawabs":    ["Salman Ahmed", "Ayush Tiwari", "Rohit Verma", "Shivam Awasthi", "Zeeshan Ali", "Aditya Mishra", "Faizan Siddiqui", "Harsh Srivastava", "Nakul Yadav", "Imran Qureshi", "Devansh Pandey"],
  "Punjab Warriors":   ["Gurpreet Singh", "Harman Brar", "Jaskaran Sidhu", "Manpreet Gill", "Arshdeep Sandhu", "Navjot Dhillon", "Ekam Cheema", "Rajat Bajwa", "Simar Kang", "Amrit Sekhon", "Karan Grewal"],
};

/* six league fixtures (mix of Group A + Group B pairings) + one live match */
const COMPLETED_FIXTURES: Array<[string, string, string]> = [
  ["Mumbai Mavericks", "Chennai Thalaivas", "A"],
  ["Kolkata Tigers", "Delhi Suryas", "B"],
  ["Hyderabad Hawks", "Rajasthan Scorchers", "A"],
  ["Punjab Warriors", "Lucknow Nawabs", "B"],
  ["Mumbai Mavericks", "Hyderabad Hawks", "A"],
  ["Kolkata Tigers", "Bengaluru Rockets", "B"],
];
const LIVE_FIXTURE: [string, string, string] = ["Delhi Suryas", "Lucknow Nawabs", "B"];
// scheduled final so MVP finalist / "car prize" logic activates in screenshots
const FINAL_FIXTURE: [string, string] = ["Mumbai Mavericks", "Kolkata Tigers"];

const cityOf: Record<string, string> = {
  "Chennai Thalaivas": "Chennai", "Mumbai Mavericks": "Mumbai", "Ahmedabad Lions": "Ahmedabad",
  "Rajasthan Scorchers": "Jaipur", "Hyderabad Hawks": "Hyderabad", "Delhi Suryas": "Delhi",
  "Kolkata Tigers": "Kolkata", "Bengaluru Rockets": "Bengaluru", "Lucknow Nawabs": "Lucknow",
  "Punjab Warriors": "Chandigarh",
};
const demoVenue = (host: string) => `${DEMO_MARKER} Stadium, ${cityOf[host] ?? "Neutral"}`;

/* ── clean: remove all prior demo data (matches cascade to innings/deliveries) ─ */
async function cleanDemo(): Promise<number> {
  const demoMatches = await db.select({ id: matchesTable.id })
    .from(matchesTable)
    .where(and(eq(matchesTable.season, SEASON), like(matchesTable.venue, `${DEMO_MARKER}%`)));
  const ids = demoMatches.map(m => m.id);
  if (ids.length) {
    // FK ON DELETE CASCADE handles innings + deliveries; match_xi references matchId too.
    await db.delete(matchXITable).where(inArray(matchXITable.matchId, ids));
    await db.delete(matchesTable).where(inArray(matchesTable.id, ids));
  }
  return ids.length;
}

/* ── ball-by-ball innings simulator ─────────────────────────────────────── */
// Concrete (non-optional) delivery shape so numeric reducers below stay typed;
// the DB insert accepts this directly (inningsId is added at persist time).
type SimDelivery = {
  overNumber: number; ballInOver: number; deliveryInOver: number;
  batterName: string; bowlerName: string;
  runsOffBat: number; extrasRuns: number; extraType: string | null; totalRuns: number;
  isWicket: boolean; dismissalType: string | null;
  dismissedBatter: string | null; fielderName: string | null;
};
type InningsResult = { total: number; wickets: number; oversDecimal: number; deliveries: SimDelivery[] };

const DISMISSALS = ["bowled", "caught", "lbw", "stumped", "run_out", "caught"]; // caught weighted a bit higher

function simulateInnings(
  battingXI: string[], bowlingXI: string[], target: number | null,
): InningsResult {
  const deliveries: SimDelivery[] = [];
  const bowlers = bowlingXI.slice(-6); // last 6 names act as the bowling attack
  let striker = 0, nextBat = 2; // batter indices into battingXI (0,1 open)
  let total = 0, wickets = 0;
  const OVERS = 20;

  for (let over = 0; over < OVERS; over++) {
    if (wickets >= 10) break;
    const bowler = bowlers[over % bowlers.length];
    let legalBalls = 0, deliveryInOver = 0, overRuns = 0;

    while (legalBalls < 6) {
      if (wickets >= 10) break;
      deliveryInOver++;
      const batter = battingXI[striker];

      // ~6% extras (wide / no-ball), else a legal delivery
      const roll = rand();
      if (roll < 0.06) {
        const extraType = rand() < 0.7 ? "wide" : "no_ball";
        const extrasRuns = 1;
        total += extrasRuns; overRuns += extrasRuns;
        deliveries.push({
          overNumber: over, ballInOver: legalBalls, deliveryInOver,
          batterName: batter, bowlerName: bowler,
          runsOffBat: 0, extrasRuns, extraType, totalRuns: extrasRuns,
          isWicket: false, dismissalType: null, dismissedBatter: null, fielderName: null,
        });
        continue; // extra → not a legal ball
      }

      legalBalls++;

      // wicket? higher chance late in the innings
      const wicketChance = 0.05 + over * 0.004;
      if (rand() < wicketChance && wickets < 9) {
        const dismissal = pick(DISMISSALS);
        let fielder: string | null = null;
        if (dismissal === "caught" || dismissal === "stumped") fielder = pick(bowlingXI);
        if (dismissal === "run_out") {
          // "A" = direct, "A/B" = assisted (both credited by the MVP engine).
          if (rand() < 0.5) {
            fielder = pick(bowlingXI);
          } else {
            const a = pick(bowlingXI);
            let b = pick(bowlingXI);
            let guard = 0;
            while (b === a && guard++ < 6) b = pick(bowlingXI); // two DISTINCT fielders
            fielder = `${a}/${b}`;
          }
        }
        wickets++;
        deliveries.push({
          overNumber: over, ballInOver: legalBalls, deliveryInOver,
          batterName: batter, bowlerName: bowler,
          runsOffBat: 0, extrasRuns: 0, extraType: null, totalRuns: 0,
          isWicket: true, dismissalType: dismissal, dismissedBatter: batter, fielderName: fielder,
        });
        // new batter comes in at the striker's end
        if (nextBat < battingXI.length) { striker = nextBat; nextBat++; }
        if (target && total >= target) break;
        continue;
      }

      // scoring shot distribution (dot/1/2/3/4/6) — tuned for T20 totals ~150-185
      const s = rand();
      let runs: number;
      if (s < 0.40) runs = 0;
      else if (s < 0.70) runs = 1;
      else if (s < 0.80) runs = 2;
      else if (s < 0.83) runs = 3;
      else if (s < 0.94) runs = 4;
      else runs = 6;

      total += runs; overRuns += runs;
      deliveries.push({
        overNumber: over, ballInOver: legalBalls, deliveryInOver,
        batterName: batter, bowlerName: bowler,
        runsOffBat: runs, extrasRuns: 0, extraType: null, totalRuns: runs,
        isWicket: false, dismissalType: null, dismissedBatter: null, fielderName: null,
      });

      if (runs % 2 === 1) striker = striker === 0 ? 1 : 0; // rotate strike on odd runs (simplified)
      if (target && total >= target) break;
    }
    // occasional maiden already emerges naturally from the dot-heavy distribution
    void overRuns;
    if (target && total >= target) break;
  }

  const legal = deliveries.filter(d => !d.extraType || d.extraType === "leg_bye" || d.extraType === "bye").length;
  const oversDecimal = Math.floor(legal / 6) + (legal % 6) / 10;
  return { total, wickets, oversDecimal, deliveries };
}

/* ── persist one full match (2 innings) ─────────────────────────────────── */
async function seedCompletedMatch(
  matchNo: number, team1: string, team2: string, grp: string, daysAgo: number,
): Promise<{ matchId: string; winner: string; loser: string }> {
  const scheduledAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  const tossWinner = rand() < 0.5 ? team1 : team2;
  const battingFirst = rand() < 0.55 ? tossWinner : (tossWinner === team1 ? team2 : team1);
  const battingSecond = battingFirst === team1 ? team2 : team1;

  const [match] = await db.insert(matchesTable).values({
    matchNo, season: SEASON, team1, team2, venue: demoVenue(team1),
    stage: "league", grp, scheduledAt,
    tossWinner, tossDecision: "bat",
    status: "completed",
  }).returning();

  const xi1 = SQUADS[battingFirst], xi2 = SQUADS[battingSecond];

  // Innings 1
  const first = simulateInnings(xi1, xi2, null);
  const [inn1] = await db.insert(inningsTable).values({
    matchId: match.id, inningsNumber: 1, battingTeam: battingFirst, bowlingTeam: battingSecond,
    battingXI: xi1, bowlingXI: xi2,
    totalRuns: first.total, totalWickets: first.wickets,
    overs: Math.floor(first.oversDecimal), balls: Math.round((first.oversDecimal % 1) * 10),
    extras: first.deliveries.reduce((s, d) => s + d.extrasRuns, 0),
    status: "completed",
  }).returning();
  await db.insert(deliveriesTable).values(first.deliveries.map(d => ({ ...d, inningsId: inn1.id })));

  // Innings 2 (chasing target)
  const target = first.total + 1;
  const second = simulateInnings(xi2, xi1, target);
  const [inn2] = await db.insert(inningsTable).values({
    matchId: match.id, inningsNumber: 2, battingTeam: battingSecond, bowlingTeam: battingFirst,
    battingXI: xi2, bowlingXI: xi1,
    totalRuns: second.total, totalWickets: second.wickets,
    overs: Math.floor(second.oversDecimal), balls: Math.round((second.oversDecimal % 1) * 10),
    extras: second.deliveries.reduce((s, d) => s + d.extrasRuns, 0),
    target, status: "completed",
  }).returning();
  await db.insert(deliveriesTable).values(second.deliveries.map(d => ({ ...d, inningsId: inn2.id })));

  // Result
  const chaseWon = second.total >= target;
  const winner = chaseWon ? battingSecond : battingFirst;
  const loser = chaseWon ? battingFirst : battingSecond;
  const margin = chaseWon
    ? `${10 - second.wickets} wickets`
    : `${first.total - second.total} runs`;

  // Player of the Match: top run-scorer of the winning side (rough but plausible)
  const winnerInnDels = chaseWon ? second.deliveries : first.deliveries;
  const runsByBatter = new Map<string, number>();
  for (const d of winnerInnDels) runsByBatter.set(d.batterName, (runsByBatter.get(d.batterName) ?? 0) + d.runsOffBat);
  const pom = [...runsByBatter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? SQUADS[winner][0];

  await db.update(matchesTable).set({
    winner, resultDesc: `${winner} won by ${margin}`, playerOfMatch: pom,
  }).where(eq(matchesTable.id, match.id));

  // Match XI rows for both sides (used by some scorecard/lineup screens)
  const xiRows = [
    ...xi1.map((name, i) => ({ matchId: match.id, team: battingFirst, playerName: name, playerRole: "BAT", battingOrder: i + 1 })),
    ...xi2.map((name, i) => ({ matchId: match.id, team: battingSecond, playerName: name, playerRole: "BAT", battingOrder: i + 1 })),
  ];
  await db.insert(matchXITable).values(xiRows);

  return { matchId: match.id, winner, loser };
}

/* ── persist the live (in-progress) match ───────────────────────────────── */
async function seedLiveMatch(matchNo: number, team1: string, team2: string, grp: string): Promise<string> {
  const [match] = await db.insert(matchesTable).values({
    matchNo, season: SEASON, team1, team2, venue: demoVenue(team1),
    stage: "league", grp, scheduledAt: new Date(),
    tossWinner: team1, tossDecision: "bat",
    status: "live",
  }).returning();

  const xi1 = SQUADS[team1], xi2 = SQUADS[team2];
  // simulate a full innings, then keep only ~10.3 overs of it (mid-innings)
  const full = simulateInnings(xi1, xi2, null);
  const cutoff = full.deliveries.filter(d => d.overNumber < 10 || (d.overNumber === 10 && d.ballInOver <= 3));
  const legal = cutoff.filter(d => !d.extraType || d.extraType === "leg_bye" || d.extraType === "bye");
  const total = cutoff.reduce((s, d) => s + d.totalRuns, 0);
  const wkts = cutoff.filter(d => d.isWicket).length;

  const [inn1] = await db.insert(inningsTable).values({
    matchId: match.id, inningsNumber: 1, battingTeam: team1, bowlingTeam: team2,
    battingXI: xi1, bowlingXI: xi2,
    totalRuns: total, totalWickets: wkts,
    overs: Math.floor(legal.length / 6), balls: legal.length % 6,
    extras: cutoff.reduce((s, d) => s + d.extrasRuns, 0),
    status: "live",
  }).returning();
  await db.insert(deliveriesTable).values(cutoff.map(d => ({ ...d, inningsId: inn1.id })));

  await db.insert(matchXITable).values([
    ...xi1.map((name, i) => ({ matchId: match.id, team: team1, playerName: name, playerRole: "BAT", battingOrder: i + 1 })),
    ...xi2.map((name, i) => ({ matchId: match.id, team: team2, playerName: name, playerRole: "BAT", battingOrder: i + 1 })),
  ]);
  return match.id;
}

/* ── scheduled FINAL fixture (activates MVP finalist / car-prize logic) ──── */
async function seedFinal(matchNo: number, team1: string, team2: string): Promise<string> {
  const [m] = await db.insert(matchesTable).values({
    matchNo, season: SEASON, team1, team2, venue: `${DEMO_MARKER} Final Arena`,
    stage: "final", grp: "", scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    status: "scheduled",
  }).returning();
  return m.id;
}

/* ── recompute the season-5 points_table from demo completed matches ────── */
async function rebuildPointsTable(results: Array<{ winner: string; loser: string }>): Promise<void> {
  type Row = { played: number; won: number; lost: number; form: string[] };
  const agg = new Map<string, Row>();
  const ensure = (t: string) => { if (!agg.has(t)) agg.set(t, { played: 0, won: 0, lost: 0, form: [] }); return agg.get(t)!; };
  for (const r of results) {
    const w = ensure(r.winner), l = ensure(r.loser);
    w.played++; w.won++; w.form = [...w.form.slice(-4), "W"];
    l.played++; l.lost++; l.form = [...l.form.slice(-4), "L"];
  }
  // Wipe & re-seed only the season-5 standings, derived purely from demo results.
  await db.delete(pointsTableEntries).where(eq(pointsTableEntries.season, SEASON));
  const rows = [...agg.entries()].map(([team, r], i) => ({
    season: SEASON, team, played: r.played, won: r.won, lost: r.lost, noResult: 0,
    points: r.won * 2, nrr: Math.round((0.9 - i * 0.28) * 1000) / 1000, form: r.form,
  }));
  if (rows.length) await db.insert(pointsTableEntries).values(rows);
}

/* ── main ───────────────────────────────────────────────────────────────── */
async function main() {
  const cleanOnly = process.argv.includes("--clean");

  const removed = await cleanDemo();
  console.log(`✓ Removed ${removed} previously-seeded demo match(es).`);
  if (cleanOnly) {
    console.log("✓ --clean done (demo data removed; nothing re-seeded).");
    await pool.end();
    process.exit(0);
  }

  const results: Array<{ winner: string; loser: string }> = [];
  let no = DEMO_MATCHNO_BASE;

  for (let i = 0; i < COMPLETED_FIXTURES.length; i++) {
    const [t1, t2, grp] = COMPLETED_FIXTURES[i];
    const daysAgo = (COMPLETED_FIXTURES.length - i) * 3 + 2; // spread over the past weeks
    const r = await seedCompletedMatch(++no, t1, t2, grp, daysAgo);
    results.push({ winner: r.winner, loser: r.loser });
    console.log(`  • completed  #${no}  ${t1} vs ${t2}  → ${r.winner} won`);
  }

  const liveId = await seedLiveMatch(++no, LIVE_FIXTURE[0], LIVE_FIXTURE[1], LIVE_FIXTURE[2]);
  console.log(`  • LIVE       #${no}  ${LIVE_FIXTURE[0]} vs ${LIVE_FIXTURE[1]}  (innings 1 mid-way)`);

  const finalId = await seedFinal(++no, FINAL_FIXTURE[0], FINAL_FIXTURE[1]);
  console.log(`  • FINAL      #${no}  ${FINAL_FIXTURE[0]} vs ${FINAL_FIXTURE[1]}  (scheduled)`);

  await rebuildPointsTable(results);
  console.log(`✓ Rebuilt season-${SEASON} points_table from ${results.length} demo results.`);

  console.log("\n✓ Demo seed complete.");
  console.log(`  Live match id : ${liveId}`);
  console.log(`  Final match id: ${finalId}`);
  console.log("  Try: GET /api/mvp/leaderboard?season=5 · GET /api/points-table?season=5 · GET /api/matches/:id/scorecard");

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Demo seed failed:", err);
  process.exit(1);
});
