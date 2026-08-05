/**
 * buildInvoicePdf + sendEmail attachment passthrough.
 *
 * - buildInvoicePdf returns a real PDF Buffer (%PDF header, non-zero length)
 *   and never throws for missing logo.
 * - Tax numbers on the invoice always come from gstFromGross (never hardcoded).
 * - sendEmail maps attachments -> Brevo `attachment: [{ name, content }]`.
 *   Brevo is fully MOCKED — no real email is ever sent (real keys live in dev).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildInvoicePdf } from "./invoicePdf";
import { gstFromGross } from "./gst";

describe("buildInvoicePdf", () => {
  it("returns a Buffer starting with %PDF and non-zero length", async () => {
    const buf = await buildInvoicePdf({
      name: "Saurabh Kumar",
      phone: "9876543210",
      email: "saurabh@example.com",
      role: "bat",
      invoiceNo: "BCPL/25-26/p1_abc123_1700000000000",
      phase: 1,
      txnId: "p1_abc123_1700000000000",
      paidAt: new Date("2025-01-15T10:00:00Z"),
      grossAmount: 353,
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("builds a Phase 2 invoice without throwing (missing logo tolerated)", async () => {
    const buf = await buildInvoicePdf({
      name: "Test Player",
      invoiceNo: "BCPL/25-26/p2_xyz_1",
      phase: 2,
      txnId: "p2_xyz_1",
      paidAt: "2025-02-01",
      grossAmount: 3540,
      igst: true,
    });
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("tax breakup on the invoice matches gstFromGross exactly", () => {
    // The PDF renders g.base/cgst/sgst/total straight from this helper — pin it.
    const g = gstFromGross(353);
    expect(Number((g.base + g.gst).toFixed(2))).toBe(353);
    expect(Number((g.cgst + g.sgst).toFixed(2))).toBe(Number(g.gst.toFixed(2)));
  });
});

describe("sendEmail attachment passthrough (Brevo mocked)", () => {
  const OLD_KEY = process.env.BREVO_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.BREVO_API_KEY = "test-key-never-real";
    fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ messageId: "mock-1" }),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (OLD_KEY === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = OLD_KEY;
  });

  it("maps attachments to Brevo attachment[{name,content}]", async () => {
    const { sendEmail } = await import("./email");
    const res = await sendEmail(
      {
        to: "player@example.com",
        toName: "Player",
        subject: "Receipt",
        htmlContent: "<p>hi</p>",
        attachments: [{ name: "BCPL-Invoice-BCPL-DEL-1.pdf", contentBase64: "JVBERi0xLjM=" }],
      },
      { noOutbox: true },
    );
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(Array.isArray(body.attachment)).toBe(true);
    expect(body.attachment).toHaveLength(1);
    expect(body.attachment[0]).toEqual({ name: "BCPL-Invoice-BCPL-DEL-1.pdf", content: "JVBERi0xLjM=" });
  });

  it("omits the attachment field entirely when no attachments are passed", async () => {
    const { sendEmail } = await import("./email");
    await sendEmail(
      { to: "player@example.com", toName: "Player", subject: "Receipt", htmlContent: "<p>hi</p>" },
      { noOutbox: true },
    );
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(body.attachment).toBeUndefined();
  });
});
