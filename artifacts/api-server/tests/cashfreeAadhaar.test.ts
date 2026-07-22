/**
 * Locks the Cashfree Offline-Aadhaar API contract (docs: telr-docs.cashfree.com
 * /api-reference/vrs/v2/aadhaar/*):
 *
 *   generate OTP → 200 { status: "SUCCESS", message, ref_id: 21637861 }   (ref_id may be a NUMBER)
 *   verify OTP   → POST body { otp, ref_id }  — field is ref_id, NOT reference_id
 *                → 200 { status: "VALID", name, dob, address, ... }       (success is VALID, not SUCCESS)
 *
 * A field-name regression here surfaces to players as the misleading
 * "Aadhaar verification service unavailable" 502.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

let cashfree: typeof import("../src/lib/cashfree");
const fetchMock = vi.fn();

beforeAll(async () => {
  // Module captures CF_VERIFY_* at load time — stub env, then import fresh.
  vi.stubEnv("CF_VERIFY_APP_ID", "test-app-id");
  vi.stubEnv("CF_VERIFY_SECRET", "test-secret");
  vi.stubGlobal("fetch", fetchMock);
  vi.resetModules();
  cashfree = await import("../src/lib/cashfree");
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => fetchMock.mockReset());

const jsonRes = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

describe("initiateAadhaarOtp", () => {
  it("returns ref_id as a string even when Cashfree sends a number", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(200, { status: "SUCCESS", message: "OTP sent successfully", ref_id: 21637861 }));
    const r = await cashfree.initiateAadhaarOtp("655675523712");
    expect(r).toEqual({ referenceId: "21637861" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/verification/offline-aadhaar/otp");
    expect(JSON.parse(init.body)).toEqual({ aadhaar_number: "655675523712" });
    expect(init.headers["x-client-id"]).toBe("test-app-id");
  });

  it("returns null when the response has no ref_id", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(200, { status: "SUCCESS", message: "weird body" }));
    expect(await cashfree.initiateAadhaarOtp("655675523712")).toBeNull();
  });

  it("returns null on an error response", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(403, { type: "authentication_error", message: "IP not whitelisted" }));
    expect(await cashfree.initiateAadhaarOtp("655675523712")).toBeNull();
  });
});

describe("verifyAadhaarOtp", () => {
  it("sends { otp, ref_id } — never reference_id — and maps status VALID", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(200, {
      ref_id: "70471", status: "VALID", message: "Aadhaar Card Exists",
      name: "Mallesh Fakkirappa Dollin", dob: "02-02-1995", address: "Ranebennur, Karnataka",
    }));
    const r = await cashfree.verifyAadhaarOtp("70471", "267987");
    expect(r).toEqual({ valid: true, name: "Mallesh Fakkirappa Dollin", dob: "02-02-1995", address: "Ranebennur, Karnataka" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/verification/offline-aadhaar/verify");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ ref_id: "70471", otp: "267987" });
    expect(body).not.toHaveProperty("reference_id");
  });

  it("coerces a numeric referenceId to a string in the request body", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(200, { ref_id: "70471", status: "VALID", name: "X" }));
    await cashfree.verifyAadhaarOtp(70471 as unknown as string, "267987");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).ref_id).toBe("70471");
  });

  it("maps a non-VALID 200 status to valid:false", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(200, { ref_id: "70471", status: "INVALID", message: "Aadhaar does not exist" }));
    const r = await cashfree.verifyAadhaarOtp("70471", "267987");
    expect(r?.valid).toBe(false);
  });

  it("treats an OTP error response as a retryable wrong OTP, not an outage", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(400, { type: "validation_error", message: "Invalid OTP entered" }));
    const r = await cashfree.verifyAadhaarOtp("70471", "000000");
    expect(r).not.toBeNull();
    expect(r?.valid).toBe(false);
  });

  it("returns null (service error) for non-OTP failures", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(401, { type: "authentication_error", message: "Invalid clientId and clientSecret combination" }));
    expect(await cashfree.verifyAadhaarOtp("70471", "267987")).toBeNull();
  });

  it("returns null when fetch itself throws (network outage)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    expect(await cashfree.verifyAadhaarOtp("70471", "267987")).toBeNull();
  });
});
