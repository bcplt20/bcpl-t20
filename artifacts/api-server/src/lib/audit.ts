import type { Request } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { logger } from "./logger";

/**
 * Stage 5 — shared audit writer. Never throws: an audit failure must not
 * break the admin action itself (it is logged loudly instead).
 */
export async function writeAudit(req: Request | null, entry: {
  action: string;          // e.g. "refund.approve", "admin_user.create", "kyc.reveal"
  entity: string;          // table / domain name
  entityKey?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      actor: req?.admin ? `${req.admin.email} (${req.admin.role})` : "system",
      actorIp: req?.ip ?? null,
      action: entry.action,
      entity: entry.entity,
      entityKey: entry.entityKey ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
    });
  } catch (e) {
    logger.error({ err: e, action: entry.action }, "audit write failed");
  }
}
