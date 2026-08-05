/**
 * Statutory supplier identity — SINGLE SOURCE OF TRUTH.
 *
 * These constants back BOTH the HTML tax invoice (tplInvoice in lib/email.ts)
 * and the PDF tax invoice (buildInvoicePdf in lib/invoicePdf.ts). Never
 * duplicate them — a mismatch between the emailed HTML invoice and the
 * attached PDF would be a compliance defect.
 *
 * LEGAL ENTITY COPY REVIEW REQUIRED: the statutory supplier name below is
 * retained exactly as printed on the registered GSTIN record ("Kriparti
 * India Private Limited"), which differs from the marketing footer entity
 * ("Kriparthi Playing 11 Pvt. Ltd."). Do not "correct" a GST invoice name.
 */
export const BCPL_LEGAL_NAME = "Kriparti India Private Limited";
export const BCPL_GSTIN = "07AAHCK4053D1ZS";
export const BCPL_ADDR =
  "Kriparti India Private Limited, 2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi - 110059";
/** Registered address without the leading legal-name prefix (for PDF layout). */
export const BCPL_ADDR_LINES =
  "2nd Floor Back Side, RZ-108, Indra Park, Uttam Nagar, West Delhi, Delhi - 110059";
/** HSN/SAC service code + description used on every BCPL tax invoice. */
export const BCPL_HSN = "999299";
export const BCPL_HSN_DESC = "Sports Event Services";
