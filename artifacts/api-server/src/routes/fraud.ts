/**
 * Stage 6 — Fraud detection extensions.
 *
 * Detectors (POST /scan):
 *   duplicate_video    — same video content (S3 etag) on 2+ registrations
 *   duplicate_aadhaar  — same Aadhaar verification ref on 2+ registrations
 *   duplicate_pan      — same PAN verification ref on 2+ registrations
 *
 * Findings are stored once per (registration, type) — ON CONFLICT DO
 * NOTHING — so re-scans never duplicate or resurrect a reviewed flag.
 * Statuses: flagged → cleared | blocked (reflag re-opens).
 *
 * Every transition writes an audit row. Flags carry NO automatic
 * player-facing consequence — enforcement is a manual ops decision
 * ("do not publicly accuse the player").
 *
 * Note: aadhaar_ref / pan_ref are provider verification REFERENCES, never
 * the document numbers themselves. Synthetic refs (manual_review_*, kept_*)
 * are excluded from duplicate matching.
 */
import { Router } from "express";
import type { Request } from "express";
import { db } from "@workspace/db";
import { fraudFlagsTable, registrationsTable, usersTable } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import { writeAudit } from "../lib/audit";
import { logger } from "../lib/logger";

export async function ensureFraudTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS fraud_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL,
    type varchar(40) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'flagged',
    reason_code varchar(80),
    detail json,
    note varchar(1000),
    created_by varchar(120),
    reviewed_by varchar(120),
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS fraud_flags_reg_type_idx ON fraud_flags (registration_id, type)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS fraud_flags_status_idx ON fraud_flags (status)`);
}

const actor = (req: Request): string =>
  req.admin ? req.admin.name + " <" + req.admin.email + ">" : "admin";

export const adminFraudRouter = Router();
adminFraudRouter.use(requireAdmin, requireRole("KYC_TEAM"));

/* ── duplicate detectors (raw SQL grouping) ─────────────────────────── */
type DupGroup = { evidence: string; regs: string[] };

async function findDuplicates(query: ReturnType<typeof sql>): Promise<DupGroup[]> {
  const r = await db.execute(query);
  return (r.rows as Array<{ evidence: unknown; regs: unknown }>).map((row) => ({
    evidence: String(row.evidence),
    regs: Array.isArray(row.regs)
      ? row.regs.map(String)
      : String(row.regs ?? "").replace(/[{}]/g, "").split(",").filter(Boolean),
  }));
}

const VIDEO_DUPES = () => sql`
  SELECT etag AS evidence, array_agg(DISTINCT registration_id) AS regs
  FROM phase1_videos
  WHERE etag IS NOT NULL AND etag <> ''
  GROUP BY etag
  HAVING COUNT(DISTINCT registration_id) > 1`;

const AADHAAR_DUPES = () => sql`
  SELECT aadhaar_ref AS evidence, array_agg(DISTINCT registration_id) AS regs
  FROM kyc_records
  WHERE aadhaar_ref IS NOT NULL AND aadhaar_ref <> ''
    AND aadhaar_ref NOT LIKE 'manual_review%' AND aadhaar_ref NOT LIKE 'kept_%'
  GROUP BY aadhaar_ref
  HAVING COUNT(DISTINCT registration_id) > 1`;

const PAN_DUPES = () => sql`
  SELECT pan_ref AS evidence, array_agg(DISTINCT registration_id) AS regs
  FROM kyc_records
  WHERE pan_ref IS NOT NULL AND pan_ref <> ''
    AND pan_ref NOT LIKE 'manual_review%' AND pan_ref NOT LIKE 'kept_%'
  GROUP BY pan_ref
  HAVING COUNT(DISTINCT registration_id) > 1`;

/* ── GET / — list flags (joined with player identity) ───────────────── */
adminFraudRouter.get("/", async (req, res) => {
  try {
    const { status, type } = req.query as Record<string, string>;
    const rows = await db
      .select({
        flag: fraudFlagsTable,
        regNumber: registrationsTable.regNumber,
        player: usersTable.name,
        phone: usersTable.phone,
        trialCity: registrationsTable.trialCity,
      })
      .from(fraudFlagsTable)
      .leftJoin(registrationsTable, eq(fraudFlagsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .orderBy(desc(fraudFlagsTable.createdAt));

    const counts: Record<string, number> = { flagged: 0, cleared: 0, blocked: 0 };
    for (const r of rows) counts[r.flag.status] = (counts[r.flag.status] ?? 0) + 1;

    let out = rows;
    if (status) out = out.filter((r) => r.flag.status === status);
    if (type) out = out.filter((r) => r.flag.type === type);

    const flags = out.map((r) => ({
      ...r.flag,
      regNumber: r.regNumber ?? null,
      player: r.player ?? "Unknown",
      phone: r.phone ?? "",
      trialCity: r.trialCity ?? "",
    }));
    res.json({ flags, counts, total: flags.length });
  } catch (e) {
    logger.error({ err: e }, "fraud list failed");
    res.status(500).json({ error: "Failed to load fraud flags" });
  }
});

/* ── POST /scan — run all detectors, insert new findings ────────────── */
adminFraudRouter.post("/scan", async (req, res) => {
  try {
    const found: Array<{
      registrationId: string; type: string; reasonCode: string; detail: Record<string, unknown>;
    }> = [];
    const collect = (groups: DupGroup[], type: string, reasonCode: string, evidenceKey: string) => {
      for (const g of groups) {
        for (const regId of g.regs) {
          found.push({
            registrationId: regId, type, reasonCode,
            detail: {
              [evidenceKey]: g.evidence,
              matchedRegistrations: g.regs.filter((x) => x !== regId),
            },
          });
        }
      }
    };
    collect(await findDuplicates(VIDEO_DUPES()), "duplicate_video", "same_video_multiple_players", "etag");
    collect(await findDuplicates(AADHAAR_DUPES()), "duplicate_aadhaar", "shared_aadhaar_ref", "ref");
    collect(await findDuplicates(PAN_DUPES()), "duplicate_pan", "shared_pan_ref", "ref");

    let created = 0;
    const byType: Record<string, number> = {};
    for (const f of found) {
      const inserted = await db.insert(fraudFlagsTable)
        .values({
          registrationId: f.registrationId, type: f.type,
          reasonCode: f.reasonCode, detail: f.detail, createdBy: actor(req),
        })
        .onConflictDoNothing({ target: [fraudFlagsTable.registrationId, fraudFlagsTable.type] })
        .returning({ id: fraudFlagsTable.id });
      if (inserted.length) {
        created++;
        byType[f.type] = (byType[f.type] ?? 0) + 1;
      }
    }
    void writeAudit(req, {
      action: "fraud.scan", entity: "fraud_flags", entityKey: "scan",
      newValue: { candidates: found.length, created, byType },
    });
    res.json({ success: true, candidates: found.length, created, byType });
  } catch (e) {
    logger.error({ err: e }, "fraud scan failed");
    res.status(500).json({ error: "Fraud scan failed" });
  }
});

/* ── PATCH /:id — clear | block | reflag ─────────────────────────────── */
const FLAG_ACTIONS: Record<string, string> = { clear: "cleared", block: "blocked", reflag: "flagged" };

adminFraudRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const action = String(b["action"] ?? "");
    const target = FLAG_ACTIONS[action];
    if (!target) { res.status(400).json({ error: "action must be clear, block or reflag" }); return; }

    const [flag] = await db.select().from(fraudFlagsTable).where(eq(fraudFlagsTable.id, id)).limit(1);
    if (!flag) { res.status(404).json({ error: "Flag not found" }); return; }
    if (flag.status === target) { res.status(409).json({ error: "Flag is already " + target }); return; }

    const note = b["note"] !== undefined ? String(b["note"]).slice(0, 1000) : flag.note;
    const now = new Date();
    const [updated] = await db.update(fraudFlagsTable)
      .set({ status: target, note, reviewedBy: actor(req), reviewedAt: now, updatedAt: now })
      .where(eq(fraudFlagsTable.id, id))
      .returning();

    void writeAudit(req, {
      action: "fraud." + action, entity: "fraud_flags", entityKey: id,
      oldValue: { status: flag.status }, newValue: { status: target, note },
    });
    res.json({ success: true, flag: updated });
  } catch (e) {
    logger.error({ err: e }, "fraud update failed");
    res.status(500).json({ error: "Failed to update flag" });
  }
});
