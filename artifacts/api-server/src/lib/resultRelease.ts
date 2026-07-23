/**
 * Phase 1 result release (spec §§32–35).
 *
 *   scored ──(resultReleaseAt due + resultReleaseEnabled)──▶ releasing ──▶ result_released
 *
 * At release time, per §34, a RANKING SNAPSHOT is frozen so an issued result
 * card never changes as later players finish:
 *   cityRank / cityTotal / roleRank / roleTotal / percentile / snapshotAt
 *
 * Ranking rules (§§32–33): the DATABASE ranks, never the AI. Only completed,
 * scored, eligible evaluations count (statuses scored/releasing/result_released).
 * Competition ranking: rank = 1 + count(better scores); ties share a rank.
 *
 * Safety: gated on cfg.resultReleaseEnabled (default OFF). Player-facing
 * phase1_status flips to the values the existing site already understands
 * ('selected' / 'rejected'). Notifications use reserve-first dedupe
 * (p1_result_<evalId>) so re-runs can never double-send.
 */
import { db } from "@workspace/db";
import {
  phase1EvaluationsTable, registrationsTable, usersTable,
  notificationLogsTable, rankingSnapshotsTable,
} from "@workspace/db/schema";
import { eq, and, lt, lte, asc, inArray, isNotNull } from "drizzle-orm";
import { getPhase1Config, type Phase1Config } from "./phase1Config";
import { sendEmail, tplPhase1Selected, tplPhase1Rejected } from "./email";
import { sendSms } from "./sms";
import { normalizeRole } from "./phase1Roles";
import { logger } from "./logger";

const STALE_RELEASING_MIN = 15;

export type ReleaseRunResult = {
  claimed: number;
  released: number;
  transientErrors: number;
  gated: boolean;
};

export async function runResultReleases(limit = 50): Promise<ReleaseRunResult> {
  const result: ReleaseRunResult = { claimed: 0, released: 0, transientErrors: 0, gated: false };
  const cfg = await getPhase1Config();
  if (!cfg.resultReleaseEnabled) {
    result.gated = true;
    return result;
  }

  const now = new Date();
  const fresh = await db.update(phase1EvaluationsTable)
    .set({ status: "releasing", updatedAt: now })
    .where(and(
      eq(phase1EvaluationsTable.status, "scored"),
      inArray(
        phase1EvaluationsTable.id,
        db.select({ id: phase1EvaluationsTable.id }).from(phase1EvaluationsTable)
          .where(and(
            eq(phase1EvaluationsTable.status, "scored"),
            lte(phase1EvaluationsTable.resultReleaseAt, now),
          ))
          .orderBy(asc(phase1EvaluationsTable.resultReleaseAt))
          .limit(limit),
      ),
    ))
    .returning();
  for (const row of fresh) {
    result.claimed += 1;
    await processRelease(row, cfg, result);
  }

  const staleCutoff = new Date(Date.now() - STALE_RELEASING_MIN * 60 * 1000);
  const stale = await db.update(phase1EvaluationsTable)
    .set({ updatedAt: new Date() })
    .where(and(
      eq(phase1EvaluationsTable.status, "releasing"),
      lt(phase1EvaluationsTable.updatedAt, staleCutoff),
    ))
    .returning();
  for (const row of stale.slice(0, limit)) {
    result.claimed += 1;
    await processRelease(row, cfg, result);
  }

  return result;
}

type EvalRow = typeof phase1EvaluationsTable.$inferSelect;

/** Competition ranks within the eligible pool (§§32–33). */
export async function computeRanks(registrationId: string): Promise<{
  cityRank: number; cityTotal: number; roleRank: number; roleTotal: number; percentile: number;
} | null> {
  const eligible = await db.select({
    registrationId: phase1EvaluationsTable.registrationId,
    finalScore: phase1EvaluationsTable.finalScore,
    city: registrationsTable.trialCity,
    role: registrationsTable.role,
  }).from(phase1EvaluationsTable)
    .innerJoin(registrationsTable, eq(registrationsTable.id, phase1EvaluationsTable.registrationId))
    .where(and(
      inArray(phase1EvaluationsTable.status, ["scored", "releasing", "result_released"]),
      isNotNull(phase1EvaluationsTable.finalScore),
    ));

  // Defensive dedupe: one best score per registration.
  const best = new Map<string, { score: number; city: string; role: string }>();
  for (const e of eligible) {
    const prev = best.get(e.registrationId);
    const score = e.finalScore ?? 0;
    if (!prev || score > prev.score) {
      best.set(e.registrationId, { score, city: (e.city ?? "").trim(), role: normalizeRole(e.role) });
    }
  }
  const me = best.get(registrationId);
  if (!me) return null;

  let cityRank = 1, cityTotal = 0, roleRank = 1, roleTotal = 0;
  for (const [rid, p] of best) {
    if (p.city !== me.city) continue;
    cityTotal += 1;
    if (rid !== registrationId && p.score > me.score) cityRank += 1;
    if (p.role === me.role) {
      roleTotal += 1;
      if (rid !== registrationId && p.score > me.score) roleRank += 1;
    }
  }
  const percentile = cityTotal > 0 ? Math.round((cityRank / cityTotal) * 1000) / 10 : 100;
  return { cityRank, cityTotal, roleRank, roleTotal, percentile };
}

async function processRelease(evalRow: EvalRow, cfg: Phase1Config, out: ReleaseRunResult): Promise<void> {
  try {
    if (!evalRow.result || evalRow.finalScore == null) {
      // Defensive: a releasing row without a result cannot be published.
      await db.update(phase1EvaluationsTable)
        .set({ status: "scored", error: "release skipped: missing result/finalScore", updatedAt: new Date() })
        .where(eq(phase1EvaluationsTable.id, evalRow.id));
      return;
    }

    const [row] = await db.select({
      regId: registrationsTable.id,
      userId: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
    }).from(registrationsTable)
      .innerJoin(usersTable, eq(usersTable.id, registrationsTable.userId))
      .where(eq(registrationsTable.id, evalRow.registrationId)).limit(1);
    if (!row) throw new Error("registration/user missing for eval " + evalRow.id);

    // ── §34 ranking snapshot (frozen at release) ──
    const ranks = await computeRanks(evalRow.registrationId);
    if (!ranks) throw new Error("no eligible ranking entry for registration " + evalRow.registrationId);
    await db.insert(rankingSnapshotsTable).values({
      registrationId: evalRow.registrationId,
      cityRank: ranks.cityRank,
      cityTotal: ranks.cityTotal,
      roleRank: ranks.roleRank,
      roleTotal: ranks.roleTotal,
      percentile: ranks.percentile,
      snapshotAt: new Date(),
    }).onConflictDoUpdate({
      target: rankingSnapshotsTable.registrationId,
      set: {
        cityRank: ranks.cityRank,
        cityTotal: ranks.cityTotal,
        roleRank: ranks.roleRank,
        roleTotal: ranks.roleTotal,
        percentile: ranks.percentile,
        snapshotAt: new Date(),
      },
    });

    const qualified = evalRow.result === "qualified";

    // Player-facing status uses the values the existing site already renders.
    await db.update(registrationsTable)
      .set({ phase1Status: qualified ? "selected" : "rejected", updatedAt: new Date() })
      .where(eq(registrationsTable.id, evalRow.registrationId));

    // ── Notify exactly once (reserve-first dedupe) ──
    const reserved = await db.insert(notificationLogsTable)
      .values({ userId: row.userId, type: "email", template: "phase1_result", dedupeKey: "p1_result_" + evalRow.id })
      .onConflictDoNothing()
      .returning({ id: notificationLogsTable.id });
    if (reserved.length > 0) {
      const email = qualified ? tplPhase1Selected(row.name) : tplPhase1Rejected(row.name);
      const sms = qualified
        ? "BCPL T20: Congratulations " + row.name + "! You have QUALIFIED for Phase 2. See your result at bcplt20.com -BCPL T20"
        : "BCPL T20: Your Phase 1 review is complete. View your result and feedback at bcplt20.com -BCPL T20";
      const results = await Promise.allSettled([
        sendEmail({ to: row.email, toName: row.name, ...email }),
        sendSms(row.phone, sms),
      ]);
      for (const r of results) {
        if (r.status === "rejected") logger.warn({ err: r.reason, evalId: evalRow.id }, "phase1 result notification send failed");
      }
    }

    await db.update(phase1EvaluationsTable).set({
      status: "result_released",
      resultReleasedAt: new Date(),
      error: null,
      updatedAt: new Date(),
    }).where(eq(phase1EvaluationsTable.id, evalRow.id));
    out.released += 1;
    logger.info({ evalId: evalRow.id, qualified, ranks }, "phase1 result released");
  } catch (e) {
    out.transientErrors += 1;
    logger.error({ err: e, evalId: evalRow.id }, "result release failed for row — will retry");
    await db.update(phase1EvaluationsTable)
      .set({ error: String(e).slice(0, 500), updatedAt: new Date() })
      .where(eq(phase1EvaluationsTable.id, evalRow.id))
      .catch(() => {});
  }
}
