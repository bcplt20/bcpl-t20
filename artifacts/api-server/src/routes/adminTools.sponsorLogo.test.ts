/**
 * POST /api/admin-tools/sponsor-logo — server-side logo processing contract.
 *
 * Every uploaded sponsor logo must come back as a clean PNG on a WHITE
 * background (IPL-quality sponsor wall). This test posts a small generated
 * PNG WITH TRANSPARENCY and asserts:
 *   - response shape { key, url } (key under cms/, url = plain S3 https URL so
 *     the /api/sponsors/logo?key= redirect + extractCmsKey presign path work)
 *   - the processed asset is a PNG
 *   - the flattened corner pixel [0,0] is pure white (255,255,255)
 *
 * The S3 upload is STUBBED (vi.mock) — this never touches real AWS. AWS creds
 * are faked in the env so the endpoint's "storage configured" gate passes and
 * the stubbed putObject runs instead.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import sharp from "sharp";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Capture what the endpoint tries to upload without hitting AWS.
// vi.hoisted so the array exists before the hoisted vi.mock factory runs.
const { uploaded } = vi.hoisted(() => ({
  uploaded: [] as { key: string; body: Buffer; contentType: string }[],
}));

vi.mock("../lib/s3", () => ({
  putObject: vi.fn(async (key: string, body: Buffer, contentType: string) => {
    uploaded.push({ key, body, contentType });
  }),
  // getS3Url must produce a plain bucket https URL — the shape the public
  // sponsors route's extractCmsKey() regex + /logo redirect depend on.
  getS3Url: (key: string) => `https://bcpl-trial-videos.s3.ap-south-1.amazonaws.com/${key}`,
  // unused by this route but imported by adminTools.ts — provide stubs
  getUploadPresignedUrl: vi.fn(async () => "https://stub/put"),
  getDownloadPresignedUrl: vi.fn(async () => "https://stub/get"),
  deleteObject: vi.fn(async () => {}),
}));

let server: Server;
let base = "";
const prevAwsKey = process.env.AWS_ACCESS_KEY_ID;
const prevAdminSecret = process.env.ADMIN_SECRET;

beforeAll(async () => {
  // Fake creds so the endpoint's "S3 configured" gate passes (putObject is
  // mocked, so nothing reaches AWS).
  process.env.AWS_ACCESS_KEY_ID = "test-key";
  // No ADMIN_SECRET (dev-open) → requireAdmin lets the request through in test.
  delete process.env.ADMIN_SECRET;
  process.env.NODE_ENV = "test";

  const { default: adminToolsRouter } = await import("./adminTools");
  const app = express();
  app.use("/api/admin-tools", adminToolsRouter);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  if (server) await new Promise<void>((r) => server.close(() => r()));
  if (prevAwsKey === undefined) delete process.env.AWS_ACCESS_KEY_ID;
  else process.env.AWS_ACCESS_KEY_ID = prevAwsKey;
  if (prevAdminSecret !== undefined) process.env.ADMIN_SECRET = prevAdminSecret;
});

/** Build a small transparent PNG (a red square on a transparent canvas). */
async function makeTransparentPng(): Promise<Buffer> {
  return sharp({
    create: { width: 120, height: 80, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 60, height: 40, channels: 4, background: { r: 220, g: 30, b: 30, alpha: 1 } },
        }).png().toBuffer(),
        left: 30,
        top: 20,
      },
    ])
    .png()
    .toBuffer();
}

describe("POST /api/admin-tools/sponsor-logo", () => {
  it("processes a transparent PNG into a white-background PNG and returns { key, url }", async () => {
    const png = await makeTransparentPng();

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), "Acme Corp.png");

    const res = await fetch(`${base}/api/admin-tools/sponsor-logo`, {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { key: string; url: string };
    // shape: key under cms/, plain S3 https url matching that key
    expect(body.key).toMatch(/^cms\/sponsor-\d+-[a-z0-9-]+\.png$/);
    expect(body.url).toBe(`https://bcpl-trial-videos.s3.ap-south-1.amazonaws.com/${body.key}`);

    // the endpoint uploaded exactly one processed asset as image/png
    expect(uploaded).toHaveLength(1);
    const up = uploaded[0];
    expect(up.key).toBe(body.key);
    expect(up.contentType).toBe("image/png");

    // processed buffer really is a PNG
    const meta = await sharp(up.body).metadata();
    expect(meta.format).toBe("png");

    // corner pixel [0,0] must be pure white (flattened + 40px white padding)
    const { data, info } = await sharp(up.body).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBeGreaterThanOrEqual(3);
    expect(data[0]).toBe(255); // R
    expect(data[1]).toBe(255); // G
    expect(data[2]).toBe(255); // B
  });

  it("rejects a non-image upload", async () => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(Buffer.from("not an image"))], { type: "text/plain" }), "notes.txt");
    const res = await fetch(`${base}/api/admin-tools/sponsor-logo`, { method: "POST", body: form });
    expect(res.status).toBe(400);
  });

  it("rejects an oversized-dimension image (DoS guard) with a 400, not a raster", async () => {
    // Tiny FILE, but declares gigantic dimensions — the classic memory-bomb
    // vector. The metadata guard must reject BEFORE any rasterisation.
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100000" height="100000"><rect width="100000" height="100000" fill="#c00"/></svg>`,
    );
    expect(svg.length).toBeLessThan(200); // it really is a tiny file

    const before = uploaded.length;
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(svg)], { type: "image/svg+xml" }), "bomb.svg");

    const res = await fetch(`${base}/api/admin-tools/sponsor-logo`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/too large/i);

    // nothing was uploaded — the guard fired before putObject
    expect(uploaded.length).toBe(before);
  });
});
