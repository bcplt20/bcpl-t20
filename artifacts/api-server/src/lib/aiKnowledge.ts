/**
 * Knowledge base + live-data context for the BCPL AI assistant (routes/ai.ts).
 *
 * Two builders:
 *   buildBcplKnowledge()  — the large, copy-compliant static FACTS block that
 *     teaches the assistant "A-to-Z" about BCPL. Fee numbers are pulled from
 *     the SAME FEES map + GST_RATE the site charges (never hardcoded guesses),
 *     and the video/result/upload rules are read LIVE from phase1Config so the
 *     assistant never states a stale window. Wording mirrors the compliance-
 *     approved FAQ (lib/jsonLd.ts) — no "scout"/BCCI/guarantee/superlatives.
 *
 *   buildLiveContext(season) — cheap, cached live season data (points-table
 *     top teams, upcoming matches, latest results, MVP top 5) injected so the
 *     assistant can answer "who is topping the table / next match / top MVP".
 *
 * Everything here is DATA for the model, appended to the system prompt.
 */
import { db } from "@workspace/db";
import {
  matchesTable, pointsTableEntries, inningsTable, deliveriesTable, siteSettingsTable,
} from "@workspace/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { FEES } from "../routes/register";
import { GST_RATE } from "./gst";
import { getPhase1Config } from "./phase1Config";
import { computeMvpPoints, resolveMvpConfig, type ScoredDelivery } from "./mvpPoints";
import { logger } from "./logger";

const SUPPORT_EMAIL = "support@bcplt20.com";
const SUPPORT_PHONE = "+91-9151346555";
const SITE = "bcplt20.com";

/** GST-inclusive rupee amount for a base fee (matches checkout math). */
function withGst(base: number): number {
  return Math.round(base * (1 + GST_RATE));
}

/**
 * The full "A-to-Z" FACTS block. Reads live fee + Phase-1 rule values so a
 * config change (e.g. upload window, video length) is reflected immediately.
 */
export async function buildBcplKnowledge(): Promise<string> {
  const gstPct = Math.round(GST_RATE * 100);
  const p1Std = FEES.bat.phase1, p1Ar = FEES.ar.phase1;
  const p2Std = FEES.bat.phase2, p2Ar = FEES.ar.phase2;

  // Live Phase-1 rules (self-healed for the promised 15-day / 30–90s windows).
  let uploadDays = 15, vMin = 30, vMax = 90, resultHours = 48, minScore = 80;
  try {
    const cfg = await getPhase1Config();
    uploadDays = cfg.uploadWindowDays;
    vMin = cfg.videoMinSeconds;
    vMax = cfg.videoMaxSeconds;
    resultHours = cfg.resultReleaseHours;
    minScore = cfg.minScore;
  } catch (e) {
    logger.warn({ err: e }, "aiKnowledge: phase1 config read failed; using promised defaults");
  }

  return `BCPL KNOWLEDGE BASE (authoritative — answer ONLY from these facts; if something is not here, say you are not sure and point to ${SITE} or support).

ABOUT BCPL
- BCPL = Bhartiya Corporate Premier League: a T20 cricket league for working professionals in India. Slogan "#OfficeSeStadiumTak". 10 franchise teams compete across the season. Website: ${SITE}.
- Who can join: any working professional aged 18–45 years on the registration date — salaried, self-employed, freelancer or business owner (must currently be employed or running a business).

REGISTRATION & FEES (GST is ${gstPct}%, added on top; the exact GST-inclusive amount is shown at payment time)
- Register at ${SITE}: fill the form, pick your role (Batsman / Bowler / Wicket-Keeper / All-Rounder), choose your nearest trial city, and pay the Phase 1 fee. Takes about 5 minutes.
- Phase 1 fee (one-time): Rs ${p1Std} + GST for Batsman, Bowler and Wicket-Keeper (about Rs ${withGst(p1Std)} incl. GST); Rs ${p1Ar} + GST for All-Rounder (about Rs ${withGst(p1Ar)} incl. GST).
- Phase 2 fee (only if you qualify Phase 1 AND choose to attend the physical trial): Rs ${p2Std} + GST for Batsman/Bowler/Wicket-Keeper; Rs ${p2Ar} + GST for All-Rounder. Displayed at payment time.
- Payment methods: all major UPI apps (GPay, PhonePe, Paytm), debit/credit cards (Visa, Mastercard, RuPay), net-banking (50+ banks) and popular wallets — processed securely via Cashfree.
- Fees cover evaluation/participation only. Paying does NOT qualify, select, place you in a team, or promise any contract, payment or outcome.

THE JOURNEY (step by step)
1. Register & pay Phase 1 fee.
2. Upload a ${vMin}–${vMax} second cricket skills video in the app/website within ${uploadDays} days of registration.
3. Phase 1 result & scorecard shared within ${uploadDays} days of your video submission (video review typically within ${resultHours} hours). Passing mark is ${minScore}/100.
4. If you qualify: proceed to Phase 2 — complete KYC and pay the Phase 2 fee.
5. Attend the physical trial at your city venue (a QR "Trial Pass" appears in the app).
6. Results announced after trials conclude.
7. Player auction — qualified players enter the Auction Pool.
8. BCPL season matches (10 franchises), leading to the final.

TRIAL VIDEO RULES
- Length ${vMin}–${vMax} seconds; normal-speed, stable footage; show genuine, role-appropriate cricket actions (All-Rounders MUST show both batting and bowling). Avoid heavy edits/filters/slow-motion-only clips. Result within ${resultHours} hours of review, shared within the ${uploadDays}-day window.
- You get a limited number of re-uploads if a video is invalid; see the app for your remaining attempts.

KYC (Phase 2)
- KYC is completed online during Phase 2 (identity + basic details) before your physical trial. Your Phase 2 payment stays safe if KYC needs to be redone. Follow the in-app steps; contact support if a step fails.

PHYSICAL TRIAL & AUCTION
- Phase 2 is a standardised physical trial at authorised venues, assessed on a role-specific 100-point framework.
- Qualifying for the Auction Pool means you are eligible for the player-auction process. It does NOT guarantee purchase by a team, a contract, payment, squad selection or participation.

PRIZES — MVP / MAN OF THE SERIES (owner's car prize)
- Across official league matches, player performances are tracked for an MVP leaderboard (a Dream11-style points system from real ball-by-ball scoring: runs, boundaries and milestones for batting; wickets, hauls and maiden overs for bowling; catches, stumpings and run-outs for fielding).
- The MVP / Man of the Series award (the car prize) is limited to players whose team plays the FINAL. Players from non-finalist teams can rank on the leaderboard but are NOT eligible for the car.
- There is also a live points table (2 points per win) that decides standings and who reaches the final.

FAN VOTING
- Fans can vote in polls on the app/website. Voting is for engagement/fan awards only and does not affect match results, MVP points or player selection. One vote per user per poll where stated.

JERSEY / KIT, SCHEDULE & VENUES
- Franchise jersey/kit is provided to selected squad players by their team as per team norms.
- Match schedule, venues, live scores, scorecards and standings are available on the app/website. Share exact dates/venues only if given in LIVE DATA below.

REFUND POLICY
- Phase 1 fees are NON-refundable once payment succeeds — including if you do not upload a video, upload late, upload an invalid video, withdraw, or do not qualify.
- Limited exceptions (e.g. duplicate/double payments, or BCPL not declaring a result for a valid submission within the published period) are covered by the Refund & Cancellation Policy on ${SITE}.
- If a payment fails or is deducted without confirmation, the money is safe and support will resolve it.

CONTACT / SUPPORT
- Email ${SUPPORT_EMAIL}, phone ${SUPPORT_PHONE}, or the support/help section on ${SITE}. Support replies in English and Hindi.`;
}

/* ── live season context (cached ~120s) ─────────────────────────────────── */

let liveCache: { season: number; at: number; text: string } | null = null;
const LIVE_TTL_MS = 120_000;

const nowIso = () => new Date().toISOString();

/** Compact live-data block: standings top 4, next up to 3 fixtures, last up
 *  to 3 results, MVP top 5. Best-effort — any failing section is skipped. */
export async function buildLiveContext(season: number): Promise<string> {
  if (liveCache && liveCache.season === season && Date.now() - liveCache.at < LIVE_TTL_MS) {
    return liveCache.text;
  }
  const parts: string[] = [];

  // Points table (top 4).
  try {
    const rows = await db.select().from(pointsTableEntries).where(eq(pointsTableEntries.season, season));
    rows.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
    if (rows.length) {
      parts.push("POINTS TABLE (top): " + rows.slice(0, 4).map((r, i) =>
        `${i + 1}. ${r.team} ${r.points}pts (${r.won}W-${r.lost}L)`).join("; "));
    }
  } catch (e) { logger.warn({ err: e }, "aiKnowledge live: points table failed"); }

  // Upcoming fixtures (next 3 scheduled).
  try {
    const up = await db.select({
      no: matchesTable.matchNo, t1: matchesTable.team1, t2: matchesTable.team2,
      venue: matchesTable.venue, at: matchesTable.scheduledAt, stage: matchesTable.stage,
    }).from(matchesTable)
      .where(and(eq(matchesTable.season, season), eq(matchesTable.status, "scheduled")))
      .orderBy(asc(matchesTable.scheduledAt)).limit(3);
    if (up.length) {
      parts.push("UPCOMING MATCHES: " + up.map((m) =>
        `${m.t1} vs ${m.t2}${m.stage === "final" ? " (FINAL)" : ""}${m.at ? " on " + m.at.toISOString().slice(0, 10) : ""}${m.venue && !m.venue.startsWith("DEMO") ? " at " + m.venue : ""}`).join("; "));
    }
  } catch (e) { logger.warn({ err: e }, "aiKnowledge live: fixtures failed"); }

  // Latest results (last 3 completed).
  let completedIds: string[] = [];
  try {
    const done = await db.select({
      id: matchesTable.id, t1: matchesTable.team1, t2: matchesTable.team2,
      result: matchesTable.resultDesc, at: matchesTable.scheduledAt,
    }).from(matchesTable)
      .where(and(eq(matchesTable.season, season), eq(matchesTable.status, "completed")))
      .orderBy(desc(matchesTable.scheduledAt)).limit(3);
    if (done.length) {
      parts.push("RECENT RESULTS: " + done.map((m) =>
        m.result || `${m.t1} vs ${m.t2}`).join("; "));
    }
  } catch (e) { logger.warn({ err: e }, "aiKnowledge live: results failed"); }

  // MVP top 5 (reuse the points engine over completed matches).
  try {
    const completed = await db.select({ id: matchesTable.id }).from(matchesTable)
      .where(and(eq(matchesTable.season, season), eq(matchesTable.status, "completed")));
    completedIds = completed.map((m) => m.id);
    if (completedIds.length) {
      const inns = await db.select({
        id: inningsTable.id, matchId: inningsTable.matchId,
        battingTeam: inningsTable.battingTeam, bowlingTeam: inningsTable.bowlingTeam,
      }).from(inningsTable).where(inArray(inningsTable.matchId, completedIds));
      if (inns.length) {
        const byId = new Map(inns.map((i) => [i.id, i]));
        const midByInn = new Map(inns.map((i) => [i.id, i.matchId]));
        const dels = await db.select().from(deliveriesTable)
          .where(inArray(deliveriesTable.inningsId, inns.map((i) => i.id)));
        const [cfgRow] = await db.select().from(siteSettingsTable)
          .where(eq(siteSettingsTable.key, "mvp_points_config")).limit(1);
        const scored: ScoredDelivery[] = dels.map((d) => {
          const inn = byId.get(d.inningsId);
          return {
            inningsId: d.inningsId, overNumber: d.overNumber,
            batterName: d.batterName, bowlerName: d.bowlerName,
            runsOffBat: d.runsOffBat, extrasRuns: d.extrasRuns, extraType: d.extraType ?? null,
            totalRuns: d.totalRuns, isWicket: d.isWicket, dismissalType: d.dismissalType ?? null,
            dismissedBatter: d.dismissedBatter ?? null, fielderName: d.fielderName ?? null,
            battingTeam: inn?.battingTeam ?? "", bowlingTeam: inn?.bowlingTeam ?? "",
          };
        });
        const players = computeMvpPoints(scored, midByInn, resolveMvpConfig(cfgRow?.value ?? null));
        if (players.length) {
          parts.push("MVP LEADERBOARD (top): " + players.slice(0, 5).map((p, i) =>
            `${i + 1}. ${p.name} (${p.team}) ${p.points}pts`).join("; "));
        }
      }
    }
  } catch (e) { logger.warn({ err: e }, "aiKnowledge live: MVP failed"); }

  const text = parts.length
    ? `LIVE DATA (Season ${season}, as of ${nowIso()} — cite only these dates/venues/names; if a user asks for something not here, say it's not published yet):\n- ${parts.join("\n- ")}`
    : `LIVE DATA (Season ${season}): no published standings/fixtures/results yet — tell the user schedule and results will appear on ${SITE} when available.`;

  liveCache = { season, at: Date.now(), text };
  return text;
}

/** Test hook — clear the live-context cache. */
export function __clearAiKnowledgeCache(): void {
  liveCache = null;
}
