// Task #33 — KYC /initiate must reject submissions that skip the emergency
// contact or T-shirt size (blood group stays optional). We validate the
// exported schema directly: no route/provider calls, so no risk of firing a
// real MSG91/Brevo send.
import { describe, it, expect } from "vitest";
import { kycInitiateSchema } from "../src/routes/kyc";

const base = {
  registrationId: "11111111-1111-1111-1111-111111111111",
  profession: "Salaried Employee",
  aadhaarNumber: "123456789012",
  panNumber: "ABCDE1234F",
  tshirtSize: "L",
  emergencyName: "Jane Doe",
  emergencyPhone: "9876543210",
} as const;

describe("kycInitiateSchema (Task #33 required fields)", () => {
  it("passes with all required fields present", () => {
    const r = kycInitiateSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("passes without the optional blood group", () => {
    const r = kycInitiateSchema.safeParse({ ...base, bloodGroup: undefined });
    expect(r.success).toBe(true);
  });

  it("rejects a missing T-shirt size with a clear 400 message", () => {
    const { tshirtSize, ...noTshirt } = base;
    const r = kycInitiateSchema.safeParse(noTshirt);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.map(i => i.message).join(" ");
      expect(msg).toMatch(/T-shirt size/i);
    }
  });

  it("rejects a missing emergency contact name", () => {
    const { emergencyName, ...noName } = base;
    const r = kycInitiateSchema.safeParse(noName);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.map(i => i.message).join(" ");
      expect(msg).toMatch(/emergency contact name/i);
    }
  });

  it("rejects a missing / invalid emergency phone", () => {
    const { emergencyPhone, ...noPhone } = base;
    expect(kycInitiateSchema.safeParse(noPhone).success).toBe(false);
    expect(kycInitiateSchema.safeParse({ ...base, emergencyPhone: "12345" }).success).toBe(false);
  });

  it("accepts an optional blood group when it is a valid value", () => {
    const r = kycInitiateSchema.safeParse({ ...base, bloodGroup: "O+" });
    expect(r.success).toBe(true);
  });
});
