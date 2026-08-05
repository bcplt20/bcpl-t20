/**
 * GST Tax Invoice PDF — a premium A4 document attached to payment-confirmation
 * emails. The tax math is NEVER hardcoded: it is extracted from the real gross
 * amount paid via gstFromGross (lib/gst) — exactly the same helper the HTML
 * invoice (tplInvoice) and the admin invoice route use — so the PDF, the HTML
 * invoice and the stored payment always agree to the paise.
 *
 * Statutory supplier identity is imported from lib/companyInfo (single source
 * of truth) so it can never drift from the HTML invoice.
 *
 * Robustness contract: buildInvoicePdf NEVER throws for a missing/unreadable
 * logo — it simply renders without the logo. Callers still wrap it in try/catch
 * so a PDF failure can never block the receipt email.
 */
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gstFromGross, inr } from "./gst";
import { formatRole } from "./emailTheme";
import {
  BCPL_LEGAL_NAME,
  BCPL_GSTIN,
  BCPL_ADDR_LINES,
  BCPL_HSN,
  BCPL_HSN_DESC,
} from "./companyInfo";

// Brand palette — mirrors the email theme (navy heads, orange accents).
const NAVY = "#16223C";
const ORANGE = "#FF7A29";
const INK = "#1A1A1A";
const INK_SOFT = "#5B6472";
const INK_FAINT = "#8A94A6";
const HAIRLINE = "#E3E7EE";
const SURFACE = "#F7F8FB";

export interface InvoicePdfData {
  /** Buyer's full name. */
  name: string;
  /** Buyer's phone (optional — omitted if blank). */
  phone?: string | null;
  /** Buyer's email (optional — omitted if blank). */
  email?: string | null;
  /** Player-facing role, when available (Phase 1 line item). */
  role?: string | null;
  /** Invoice number — MUST use the same scheme as the admin invoice route. */
  invoiceNo: string;
  /** 1 = Phase 1 Registration Fee, 2 = Phase 2 Fee. */
  phase: 1 | 2;
  /** Cashfree transaction / order id. */
  txnId: string;
  /** Payment timestamp. */
  paidAt: Date | string;
  /** Real gross amount actually paid (GST-inclusive). */
  grossAmount: number;
  /**
   * Optional IGST flag. BCPL is Delhi-registered; an intra-state (Delhi) buyer
   * gets CGST+SGST, an inter-state buyer gets IGST. Defaults to intra-state
   * (CGST+SGST) to match the current HTML invoice behaviour.
   */
  igst?: boolean;
}

/**
 * Resolve the BCPL logo PNG from a set of robust candidate paths (repo layout
 * can differ between dev, dist build and EC2). Returns a Buffer or null —
 * never throws.
 */
function loadLogo(): Buffer | null {
  let here = "";
  try {
    here = dirname(fileURLToPath(import.meta.url));
  } catch {
    here = "";
  }
  const rel = "bcpl-website/public/bcpl-assets/bcpl-logo-main.png";
  const candidates = [
    // from process.cwd() — api-server root or repo root
    resolve(process.cwd(), "../bcpl-website/public/bcpl-assets/bcpl-logo-main.png"),
    resolve(process.cwd(), "../../artifacts/" + rel),
    resolve(process.cwd(), "artifacts/" + rel),
    // from this module's directory (src/lib or dist/lib) up to artifacts/
    here ? resolve(here, "../../../" + rel) : "",
    here ? resolve(here, "../../../../artifacts/" + rel) : "",
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      const buf = readFileSync(p);
      if (buf && buf.length > 0) return buf;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/** Build a premium A4 GST tax invoice PDF. Resolves to a Buffer of PDF bytes. */
export function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise<Buffer>((resolvePromise, reject) => {
    try {
      const g = gstFromGross(data.grossAmount);
      const doc = new PDFDocument({ size: "A4", margin: 48 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolvePromise(Buffer.concat(chunks)));
      doc.on("error", (e) => reject(e));

      const pageLeft = doc.page.margins.left;
      const pageRight = doc.page.width - doc.page.margins.right;
      const contentWidth = pageRight - pageLeft;

      // ── Header band: logo (optional) + supplier block + TAX INVOICE title ──
      const headerTop = doc.y;
      const logo = loadLogo();
      let textX = pageLeft;
      if (logo) {
        try {
          doc.image(logo, pageLeft, headerTop, { fit: [64, 64] });
          textX = pageLeft + 78;
        } catch {
          // Unreadable/corrupt image — skip silently, never throw.
          textX = pageLeft;
        }
      }

      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(15).text(BCPL_LEGAL_NAME, textX, headerTop, { width: 320 });
      doc.moveDown(0.15);
      doc.font("Helvetica").fontSize(8.5).fillColor(INK_SOFT);
      doc.text(`GSTIN: ${BCPL_GSTIN}`, textX, doc.y, { width: 320 });
      doc.text(BCPL_ADDR_LINES, textX, doc.y, { width: 320 });

      // Right-aligned TAX INVOICE title
      doc.font("Helvetica-Bold").fontSize(20).fillColor(ORANGE);
      doc.text("TAX INVOICE", pageRight - 200, headerTop, { width: 200, align: "right" });
      doc.font("Helvetica").fontSize(8).fillColor(INK_FAINT);
      doc.text(`HSN/SAC: ${BCPL_HSN} — ${BCPL_HSN_DESC}`, pageRight - 220, headerTop + 26, { width: 220, align: "right" });
      const gstLabel = data.igst ? "GST 18% (IGST 18%)" : "GST 18% (CGST 9% + SGST 9%)";
      doc.text(gstLabel, pageRight - 220, doc.y, { width: 220, align: "right" });

      // Hairline under header
      let y = Math.max(doc.y, headerTop + 70) + 12;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(1).strokeColor(ORANGE).stroke();
      y += 16;

      // ── Invoice meta (no + date) and Bill-To in two columns ──
      const colW = (contentWidth - 20) / 2;
      const leftX = pageLeft;
      const rightX = pageLeft + colW + 20;
      const metaTop = y;

      // Left column: Invoice details
      doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text("INVOICE DETAILS", leftX, metaTop, { width: colW });
      doc.font("Helvetica").fontSize(9).fillColor(INK);
      doc.text(`Invoice No: ${data.invoiceNo}`, leftX, doc.y + 3, { width: colW });
      doc.text(`Invoice Date: ${fmtDate(data.paidAt)}`, leftX, doc.y, { width: colW });
      doc.text(`Transaction ID: ${data.txnId}`, leftX, doc.y, { width: colW });
      doc.text(`Payment Method: Cashfree`, leftX, doc.y, { width: colW });
      const leftBottom = doc.y;

      // Right column: Bill To
      doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text("BILL TO", rightX, metaTop, { width: colW });
      doc.font("Helvetica").fontSize(9).fillColor(INK);
      doc.text(data.name || "—", rightX, doc.y + 3, { width: colW });
      if (data.phone) doc.text(`Phone: ${data.phone}`, rightX, doc.y, { width: colW });
      if (data.email) doc.text(`Email: ${data.email}`, rightX, doc.y, { width: colW });
      const rightBottom = doc.y;

      y = Math.max(leftBottom, rightBottom) + 18;

      // ── Line-item table ──
      const roleLabel = data.role ? ` — ${formatRole(data.role)}` : "";
      const itemDesc =
        data.phase === 1
          ? `Phase 1 Registration Fee${roleLabel} (Online Video Submission & Evaluation)`
          : `Phase 2 Fee${roleLabel} (Physical Trial Entry & Franchise Auction Eligibility)`;

      // Table header strip
      const rowH = 22;
      doc.rect(pageLeft, y, contentWidth, rowH).fill(NAVY);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
      doc.text("Description", pageLeft + 10, y + 7, { width: contentWidth - 130 });
      doc.text("Amount (INR)", pageRight - 120, y + 7, { width: 110, align: "right" });
      y += rowH;

      // Item description row
      doc.fillColor(INK).font("Helvetica").fontSize(9);
      const descTop = y + 8;
      doc.text(itemDesc, pageLeft + 10, descTop, { width: contentWidth - 130 });
      doc.text(`\u20B9 ${inr(g.base)}`, pageRight - 120, descTop, { width: 110, align: "right" });
      y = doc.y + 10;
      doc.moveTo(pageLeft, y).lineTo(pageRight, y).lineWidth(0.5).strokeColor(HAIRLINE).stroke();
      y += 6;

      // Tax + total rows (right-aligned summary)
      const sumLabelX = pageRight - 300;
      const sumValX = pageRight - 120;
      const taxRow = (label: string, value: string, opts?: { strong?: boolean }) => {
        const strong = opts?.strong;
        doc.font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(strong ? 11 : 9);
        doc.fillColor(strong ? NAVY : INK_SOFT).text(label, sumLabelX, y, { width: 170, align: "right" });
        doc.fillColor(strong ? ORANGE : INK).font(strong ? "Helvetica-Bold" : "Helvetica");
        doc.text(value, sumValX, y, { width: 110, align: "right" });
        y = doc.y + (strong ? 4 : 3);
      };

      taxRow("Taxable Value", `\u20B9 ${inr(g.base)}`);
      if (data.igst) {
        taxRow("IGST @ 18%", `\u20B9 ${inr(g.gst)}`);
      } else {
        taxRow("CGST @ 9%", `\u20B9 ${inr(g.cgst)}`);
        taxRow("SGST @ 9%", `\u20B9 ${inr(g.sgst)}`);
      }
      // Rule above grand total
      y += 3;
      doc.moveTo(sumLabelX, y).lineTo(pageRight, y).lineWidth(1).strokeColor(ORANGE).stroke();
      y += 8;
      taxRow("Total Paid (incl. GST)", `\u20B9 ${inr(g.total)}`, { strong: true });

      y += 24;

      // ── Amount-in-words / note box ──
      doc.rect(pageLeft, y, contentWidth, 30).fill(SURFACE);
      doc.fillColor(INK_SOFT).font("Helvetica").fontSize(8.5);
      doc.text(
        "Amount is inclusive of GST. This invoice is issued under HSN/SAC " +
          `${BCPL_HSN} (${BCPL_HSN_DESC}). Subject to Delhi jurisdiction.`,
        pageLeft + 10,
        y + 9,
        { width: contentWidth - 20 },
      );
      y += 46;

      // ── Footer ──
      const footerY = doc.page.height - doc.page.margins.bottom - 24;
      doc.moveTo(pageLeft, footerY).lineTo(pageRight, footerY).lineWidth(0.5).strokeColor(HAIRLINE).stroke();
      doc.fillColor(INK_FAINT).font("Helvetica").fontSize(8);
      doc.text("This is a computer-generated invoice; no signature required.", pageLeft, footerY + 8, {
        width: contentWidth,
        align: "center",
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
