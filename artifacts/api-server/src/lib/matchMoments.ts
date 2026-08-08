/**
 * Match moments — key highlights DERIVED from ball-by-ball deliveries.
 *
 * We infer, from the deliveries the scorers already enter:
 *   - wicket     (any dismissal)
 *   - six        (runs_off_bat === 6)
 *   - fifty / hundred (a batter crossing 50 / 100 on that ball)
 *   - hat_trick  (three wickets to the same bowler off three consecutive legal
 *                  balls, allowing the over boundary — the standard definition)
 *
 * Nothing is stored: this is a pure read model over deliveries. An admin can
 * optionally ATTACH a clip URL to a specific (over,ball) — that single override
 * lives in match_moments and is merged in on read.
 *
 * DATA LIMITATION: "fours" are intentionally NOT surfaced as moments (too noisy
 * for a highlights feed). Boundaries off byes/leg-byes are not "sixes/fours" by
 * the batter, so we key six/fifty/hundred off runs_off_bat only.
 */
import { db } from "@workspace/db";
import { matchesTable, inningsTable, deliveriesTable, matchMomentsTable } from "@workspace/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { pgCauseOf } from "./pgErrors";

export type MomentType = "wicket" | "six" | "fifty" | "hundred" | "hat_trick";

export type Moment = {
  inningsNumber: number;
  over: number;      // 1-based over (delivery.over_number is 0-based)
  ball: number;      // ball_in_over
  type: MomentType;
  batter: string | null;
  bowler: string | null;
  text: string;
  textHi: string;
  clipUrl?: string;  // present only if an admin attached one
};

export async function ensureMatchMomentsTable(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('bcpl:match_moments:ddl'))`);
    await tx.execute(sql`CREATE TABLE IF NOT EXISTS match_moments (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id    uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      innings_number integer NOT NULL,
      over_number integer NOT NULL,
      ball_in_over integer NOT NULL,
      clip_url    varchar(1000) NOT NULL,
      caption     varchar(200),
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now(),
      UNIQUE(match_id, innings_number, over_number, ball_in_over)
    )`);
  });
}

function overStr(over0: number, ball: number): string {
  return `${over0 + 1}.${ball}`;
}

/**
 * Build the derived moments for a match, newest-first. Optionally merges admin
 * clip URLs. Returns [] for an unknown/empty match. Never throws for a missing
 * match_moments table.
 */
export async function buildMatchMoments(matchId: string): Promise<Moment[] | null> {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) return null;

  const innings = await db.select().from(inningsTable)
    .where(eq(inningsTable.matchId, matchId))
    .orderBy(asc(inningsTable.inningsNumber));

  const moments: Moment[] = [];

  for (const inn of innings) {
    const deliveries = await db.select().from(deliveriesTable)
      .where(eq(deliveriesTable.inningsId, inn.id))
      .orderBy(asc(deliveriesTable.overNumber), asc(deliveriesTable.deliveryInOver));

    const batterRuns = new Map<string, number>();
    // Rolling wicket tracker for hat-tricks: last two wicket-taking bowlers on
    // consecutive LEGAL balls.
    let streakBowler: string | null = null;
    let streakCount = 0;

    for (const d of deliveries) {
      const legal = !d.extraType || d.extraType === "leg_bye" || d.extraType === "bye";

      // Batter running total (off the bat only).
      if (legal || d.extraType === "leg_bye" || d.extraType === "bye") {
        const prev = batterRuns.get(d.batterName) ?? 0;
        const now = prev + d.runsOffBat;
        batterRuns.set(d.batterName, now);
        // Fifty / hundred milestone crossed on THIS ball.
        if (prev < 50 && now >= 50 && now < 100) {
          moments.push({
            inningsNumber: inn.inningsNumber, over: d.overNumber + 1, ball: d.ballInOver,
            type: "fifty", batter: d.batterName, bowler: null,
            text: `${d.batterName} brings up a fifty (${now})`,
            textHi: `${d.batterName} ने अर्धशतक पूरा किया (${now})`,
          });
        } else if (prev < 100 && now >= 100) {
          moments.push({
            inningsNumber: inn.inningsNumber, over: d.overNumber + 1, ball: d.ballInOver,
            type: "hundred", batter: d.batterName, bowler: null,
            text: `${d.batterName} reaches a century (${now})!`,
            textHi: `${d.batterName} ने शतक पूरा किया (${now})!`,
          });
        }
      }

      // Six.
      if (d.runsOffBat === 6) {
        moments.push({
          inningsNumber: inn.inningsNumber, over: d.overNumber + 1, ball: d.ballInOver,
          type: "six", batter: d.batterName, bowler: d.bowlerName,
          text: `SIX! ${d.batterName} off ${d.bowlerName}`,
          textHi: `छक्का! ${d.batterName} ने ${d.bowlerName} की गेंद पर`,
        });
      }

      // Wicket (+ hat-trick detection for bowler-credited dismissals).
      if (d.isWicket) {
        const bowlerCredited = d.dismissalType !== "run_out" && d.dismissalType !== "retired_hurt";
        moments.push({
          inningsNumber: inn.inningsNumber, over: d.overNumber + 1, ball: d.ballInOver,
          type: "wicket", batter: d.dismissedBatter || d.batterName, bowler: bowlerCredited ? d.bowlerName : null,
          text: bowlerCredited
            ? `WICKET! ${d.dismissedBatter || d.batterName} out, bowler ${d.bowlerName}`
            : `WICKET! ${d.dismissedBatter || d.batterName} run out`,
          textHi: bowlerCredited
            ? `विकेट! ${d.dismissedBatter || d.batterName} आउट, गेंदबाज़ ${d.bowlerName}`
            : `विकेट! ${d.dismissedBatter || d.batterName} रन आउट`,
        });

        if (bowlerCredited && legal) {
          if (streakBowler === d.bowlerName) streakCount += 1;
          else { streakBowler = d.bowlerName; streakCount = 1; }
          if (streakCount === 3) {
            moments.push({
              inningsNumber: inn.inningsNumber, over: d.overNumber + 1, ball: d.ballInOver,
              type: "hat_trick", batter: null, bowler: d.bowlerName,
              text: `HAT-TRICK! ${d.bowlerName} takes three in a row`,
              textHi: `हैट्रिक! ${d.bowlerName} ने लगातार तीन विकेट लिए`,
            });
            streakCount = 0; streakBowler = null;
          }
        } else if (legal) {
          // A legal non-bowler wicket (run out) breaks a bowler's streak only if
          // it's a legal ball that isn't credited to them.
          streakBowler = null; streakCount = 0;
        }
      } else if (legal) {
        // A legal ball with no wicket breaks any running streak.
        streakBowler = null; streakCount = 0;
      }
    }
  }

  // Merge any admin-attached clip URLs.
  try {
    const clips = await db.select().from(matchMomentsTable).where(eq(matchMomentsTable.matchId, matchId));
    if (clips.length) {
      const byKey = new Map<string, { clipUrl: string; caption: string | null }>();
      for (const c of clips) byKey.set(`${c.inningsNumber}:${c.overNumber}:${c.ballInOver}`, { clipUrl: c.clipUrl, caption: c.caption });
      for (const m of moments) {
        const hit = byKey.get(`${m.inningsNumber}:${m.over - 1}:${m.ball}`);
        if (hit) m.clipUrl = hit.clipUrl;
      }
    }
  } catch (e) {
    if (pgCauseOf(e)?.code !== "42P01") throw e; // table not created yet → no clips
  }

  // Newest-first (later innings, later over, later ball).
  moments.sort((a, b) =>
    b.inningsNumber - a.inningsNumber || b.over - a.over || b.ball - a.ball,
  );
  return moments;
}

// re-export helper so callers don't import overStr separately
export { overStr };
