/**
 * Admin finance read-model — payment-method split + payments on hold.
 *
 * Deliberately a separate router (mounted at /api/admin/finance, BEFORE the
 * catch-all /admin router) so it does not touch routes/admin.ts. The actual
 * aggregation handler lives in adminTools.ts alongside the sibling finance
 * tools (backfill, forecast); this file only wires it under /admin/finance
 * with the shared admin auth gate.
 */
import { Router, type IRouter } from "express";
import { requireAdmin } from "../middlewares/adminAuth";
import { financeSummaryHandler } from "./adminTools";

const router: IRouter = Router();
router.use(requireAdmin);

// GET /api/admin/finance/summary
router.get("/summary", financeSummaryHandler);

export default router;
