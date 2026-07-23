/**
 * Stage 5 — Refund module (finance).
 *
 * MANUAL workflow only. There is deliberately NO code path that creates a
 * refund automatically — in particular, non-selection must NOT create one.
 * Eligibility follows the approved BCPL Refund & Cancellation Policy and
 * is recorded by a finance admin on each request.
 *
 * Lifecycle:  requested ──approve──▶ approved ──process──▶ processed
 *                    └──reject──▶ rejected            (terminal states)
 *
 * Every transition writes an audit row. Actual money movement happens in
 * the Cashfree dashboard / bank; the gateway/UTR reference is recorded
 * here at processing time (refundRef).
 */
import { Router } from "express";
import { db } from "@workspace/db";
import {
  refundsTable, registrationsTable, usersTable,
  phase1PaymentsTable, phase2PaymentsTable,
} from "@workspace/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import { writeAudit } from "../lib/audit";
import { logger } from "../lib/logger";

export async function ensureRefundsTables(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid NOT NULL,
    phase integer NOT NULL,
    payment_id uuid,
    payment_ref varchar(100),
    amount numeric(10,2) NOT NULL,
    reason varchar(40) NOT NULL,
    reason_note text,
    eligibility varchar(20) NOT NULL DEFAULT 'policy_review',
    status varchar(20) NOT NULL DEFAULT 'requested',
    requested_by varchar(80),
    decided_by varchar(80),
    decided_at timestamptz,
    processed_by varchar(80),
    processed_at timestamptz,
    refund_ref varchar(100),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS refunds_registration_idx ON refunds (registration_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS refunds_status_idx ON refunds (status)`);
  /* hard guarantee: at most ONE open (requested/approved) refund per registration+phase,
     even under concurrent create requests */
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS refunds_one_open_idx
    ON refunds (registration_id, phase) WHERE status IN ('requested','approved')`);
}

export const REFUND_REASONS = ["duplicate_payment", "technical_issue", "event_cancellation", "player_cancellation", "other_approved"] as const;
export const REFUND_ELIGIBILITY = ["policy_review", "eligible", "not_eligible"] as const;

export const adminRefundsRouter = Router();
adminRefundsRouter.use(requireAdmin);
adminRefundsRouter.use(requireRole("FINANCE_TEAM", "PAYMENT_TEAM"));

function actorName(req: { admin?: { email: string } }): string {
  return (req.admin?.email ?? "admin").slice(0, 80);
}

async function findPayment(phase: number, paymentId: string | null, registrationId: string) {
  if (phase === 1) {
    if (paymentId) {
      const [p] = await db.select().from(phase1PaymentsTable)
        .where(and(eq(phase1PaymentsTable.id, paymentId), eq(phase1PaymentsTable.registrationId, registrationId))).limit(1);
      return p ?? null;
    }
    const [p] = await db.select().from(phase1PaymentsTable)
      .where(and(eq(phase1PaymentsTable.registrationId, registrationId), eq(phase1PaymentsTable.status, "success")))
      .orderBy(desc(phase1PaymentsTable.createdAt)).limit(1);
    return p ?? null;
  }
  if (paymentId) {
    const [p] = await db.select().from(phase2PaymentsTable)
      .where(and(eq(phase2PaymentsTable.id, paymentId), eq(phase2PaymentsTable.registrationId, registrationId))).limit(1);
    return p ?? null;
  }
  const [p] = await db.select().from(phase2PaymentsTable)
    .where(and(eq(phase2PaymentsTable.registrationId, registrationId), eq(phase2PaymentsTable.status, "success")))
    .orderBy(desc(phase2PaymentsTable.createdAt)).limit(1);
  return p ?? null;
}

/* ── GET / — list with player context ──────────────────────────────── */
adminRefundsRouter.get("/", async (req, res) => {
  try {
    const status = req.query["status"] ? String(req.query["status"]) : null;
    const phase = req.query["phase"] ? Number(req.query["phase"]) : null;
    const conds = [] as ReturnType<typeof eq>[];
    if (status) conds.push(eq(refundsTable.status, status) as never);
    if (phase === 1 || phase === 2) conds.push(eq(refundsTable.phase, phase) as never);
    const rows = await db.select({
      refund: refundsTable,
      regNumber: registrationsTable.regNumber,
      playerName: usersTable.name,
      phone: usersTable.phone,
    }).from(refundsTable)
      .leftJoin(registrationsTable, eq(refundsTable.registrationId, registrationsTable.id))
      .leftJoin(usersTable, eq(registrationsTable.userId, usersTable.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(refundsTable.createdAt))
      .limit(500);
    res.json({ refunds: rows, reasons: REFUND_REASONS, eligibility: REFUND_ELIGIBILITY });
  } catch (e) {
    logger.error({ err: e }, "refunds list failed");
    res.status(500).json({ error: "Failed to load refunds" });
  }
});

/* ── GET /candidates — reconciliation: duplicate success payments ──── */
adminRefundsRouter.get("/candidates", async (_req, res) => {
  try {
    const q = sql`
      SELECT t.registration_id AS "registrationId", t.phase, t.payments, t.total::text AS total,
             r.reg_number AS "regNumber", u.name AS "playerName", u.phone,
             EXISTS(SELECT 1 FROM refunds f WHERE f.registration_id = t.registration_id AND f.phase = t.phase) AS "hasRefund"
      FROM (
        SELECT registration_id, 1 AS phase, count(*)::int AS payments, sum(amount) AS total
        FROM phase1_payments WHERE status = 'success' GROUP BY registration_id HAVING count(*) > 1
        UNION ALL
        SELECT registration_id, 2 AS phase, count(*)::int AS payments, sum(amount) AS total
        FROM phase2_payments WHERE status = 'success' GROUP BY registration_id HAVING count(*) > 1
      ) t
      JOIN registrations r ON r.id = t.registration_id
      LEFT JOIN users u ON u.id = r.user_id
      ORDER BY t.payments DESC`;
    const r = await db.execute(q);
    const rows = (r as unknown as { rows?: unknown[] }).rows ?? [];
    res.json({ candidates: rows });
  } catch (e) {
    logger.error({ err: e }, "refund candidates failed");
    res.status(500).json({ error: "Failed to load duplicate-payment candidates" });
  }
});

/* ── POST / — create refund request (admin-initiated ONLY) ─────────── */
adminRefundsRouter.post("/", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const phase = Number(b["phase"]);
    const reason = String(b["reason"] ?? "");
    if (phase !== 1 && phase !== 2) { res.status(400).json({ error: "phase must be 1 or 2" }); return; }
    if (!REFUND_REASONS.includes(reason as never)) { res.status(400).json({ error: "Invalid reason category" }); return; }
    const eligibility = b["eligibility"] !== undefined ? String(b["eligibility"]) : "policy_review";
    if (!REFUND_ELIGIBILITY.includes(eligibility as never)) { res.status(400).json({ error: "Invalid eligibility" }); return; }

    /* resolve registration by id or player ID (BCPL-DEL-1) */
    let registrationId = b["registrationId"] ? String(b["registrationId"]) : null;
    if (!registrationId && b["regNumber"]) {
      const [reg] = await db.select({ id: registrationsTable.id }).from(registrationsTable)
        .where(eq(registrationsTable.regNumber, String(b["regNumber"]).trim().toUpperCase())).limit(1);
      registrationId = reg?.id ?? null;
    }
    if (!registrationId) { res.status(404).json({ error: "Player registration not found" }); return; }

    const payment = await findPayment(phase, b["paymentId"] ? String(b["paymentId"]) : null, registrationId);
    if (!payment) { res.status(404).json({ error: `No successful Phase ${phase} payment found for this player` }); return; }
    if (payment.status !== "success") { res.status(409).json({ error: "Refunds can only be raised against successful payments" }); return; }

    const paidAmount = Number(payment.amount);
    const amount = b["amount"] !== undefined ? Number(b["amount"]) : paidAmount;
    if (!Number.isFinite(amount) || amount <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
    if (amount > paidAmount) { res.status(400).json({ error: `Amount exceeds the paid amount (₹${paidAmount})` }); return; }

    /* one ACTIVE (requested/approved) refund per registration+phase */
    const [active] = await db.select({ id: refundsTable.id }).from(refundsTable)
      .where(and(
        eq(refundsTable.registrationId, registrationId), eq(refundsTable.phase, phase),
        sql`${refundsTable.status} IN ('requested','approved')`,
      )).limit(1);
    if (active) { res.status(409).json({ error: "An open refund already exists for this player & phase" }); return; }

    const [row] = await db.insert(refundsTable).values({
      registrationId, phase,
      paymentId: payment.id, paymentRef: payment.cashfreeOrderId,
      amount: amount.toFixed(2), reason,
      reasonNote: b["reasonNote"] ? String(b["reasonNote"]).slice(0, 2000) : null,
      eligibility, requestedBy: actorName(req),
    }).returning();
    void writeAudit(req, {
      action: "refund.request", entity: "refunds", entityKey: row.id,
      newValue: { registrationId, phase, amount: row.amount, reason, eligibility },
    });
    res.status(201).json({ refund: row });
  } catch (e) {
    /* unique partial index refunds_one_open_idx — concurrent duplicate create */
    let pgErr: unknown = e;
    while (pgErr && (pgErr as { code?: string }).code === undefined && (pgErr as { cause?: unknown }).cause) {
      pgErr = (pgErr as { cause?: unknown }).cause;
    }
    if ((pgErr as { code?: string } | undefined)?.code === "23505") {
      res.status(409).json({ error: "An open refund already exists for this player & phase" });
      return;
    }
    logger.error({ err: e }, "refund create failed");
    res.status(500).json({ error: "Failed to create refund request" });
  }
});

/* ── PATCH /:id — transitions: approve | reject | process ──────────── */
adminRefundsRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const action = String(b["action"] ?? "");
    const [refund] = await db.select().from(refundsTable).where(eq(refundsTable.id, id)).limit(1);
    if (!refund) { res.status(404).json({ error: "Refund not found" }); return; }

    const now = new Date();
    const actor = actorName(req);

    if (action === "approve" || action === "reject") {
      if (refund.status !== "requested") { res.status(409).json({ error: `Cannot ${action} a ${refund.status} refund` }); return; }
      const eligibility = b["eligibility"] !== undefined ? String(b["eligibility"]) : refund.eligibility;
      if (!REFUND_ELIGIBILITY.includes(eligibility as never)) { res.status(400).json({ error: "Invalid eligibility" }); return; }
      const [row] = await db.update(refundsTable).set({
        status: action === "approve" ? "approved" : "rejected",
        eligibility, decidedBy: actor, decidedAt: now, updatedAt: now,
        reasonNote: b["note"] !== undefined ? String(b["note"]).slice(0, 2000) : refund.reasonNote,
      }).where(and(eq(refundsTable.id, id), eq(refundsTable.status, "requested"))).returning();
      if (!row) { res.status(409).json({ error: "Refund changed concurrently — reload" }); return; }
      void writeAudit(req, {
        action: `refund.${action}`, entity: "refunds", entityKey: id,
        oldValue: { status: refund.status, eligibility: refund.eligibility },
        newValue: { status: row.status, eligibility: row.eligibility },
      });
      res.json({ refund: row });
      return;
    }

    if (action === "process") {
      if (refund.status !== "approved") { res.status(409).json({ error: "Only approved refunds can be marked processed" }); return; }
      const refundRef = String(b["refundRef"] ?? "").trim();
      if (!refundRef) { res.status(400).json({ error: "refundRef (gateway/UTR reference) is required" }); return; }
      const [row] = await db.update(refundsTable).set({
        status: "processed", refundRef: refundRef.slice(0, 100),
        processedBy: actor, processedAt: now, updatedAt: now,
      }).where(and(eq(refundsTable.id, id), eq(refundsTable.status, "approved"))).returning();
      if (!row) { res.status(409).json({ error: "Refund changed concurrently — reload" }); return; }
      void writeAudit(req, {
        action: "refund.process", entity: "refunds", entityKey: id,
        oldValue: { status: "approved" },
        newValue: { status: "processed", refundRef: row.refundRef, amount: row.amount },
      });
      res.json({ refund: row });
      return;
    }

    res.status(400).json({ error: "action must be approve, reject or process" });
  } catch (e) {
    logger.error({ err: e }, "refund transition failed");
    res.status(500).json({ error: "Failed to update refund" });
  }
});
