/**
 * Public fee configuration — the website's single source of truth for
 * displayed prices (homepage, registration, FAQ, CTAs).
 *
 * Base fees come from the SAME `FEES` map that creates payment orders
 * (routes/register.ts) and that the payment amount-integrity gate checks
 * (routes/payment.ts) — so displayed and charged amounts can never drift.
 * GST (18%) is added on top at checkout: total = Math.round(base * (1 + gstRate)).
 */
import { Router } from "express";
import { FEES } from "./register";
import { GST_RATE } from "../lib/gst";

const router = Router();

router.get("/", (_req, res) => {
  /* Small + rarely changing — let browsers cache it briefly. */
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    phase1: { bat: FEES.bat.phase1, bowl: FEES.bowl.phase1, wk: FEES.wk.phase1, ar: FEES.ar.phase1 },
    phase2: { bat: FEES.bat.phase2, bowl: FEES.bowl.phase2, wk: FEES.wk.phase2, ar: FEES.ar.phase2 },
    gstRate: GST_RATE,
  });
});

export default router;
