/**
 * BCPL AI voice transcription + chat guardrails.
 *
 * The Gemini client is fully mocked — NO real Gemini call happens in tests.
 *  - transcribe: mime allow-list, size cap, per-IP rate limit, base64 + multipart
 *    both accepted, {text, lang} shape, no-audio validation.
 *  - guardrails: the chat system prompt contains the strict "only BCPL topics"
 *    restriction + the exact bilingual refusal lines (unit check on the prompt).
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

// Force "real" AI mode so the routes don't 503, but stub the actual network
// calls. transcribeAudio returns a canned transcript; geminiMode stays "real".
process.env.GEMINI_API_KEY = "test-key-not-used";

// Test-controllable gate: when set, transcribeAudio waits on this promise so we
// can pile up concurrent in-flight requests and exercise the BUSY cap.
let transcribeGate: Promise<void> | null = null;

vi.mock("../src/lib/gemini", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../src/lib/gemini")>();
  return {
    ...orig,
    geminiMode: () => "real" as const,
    transcribeAudio: vi.fn(async (args: { mimeType: string }) => {
      if (transcribeGate) await transcribeGate;
      // Echo something deterministic; Devanagari when caller "spoke" Hindi.
      return args.mimeType === "audio/wav" ? "नमस्ते BCPL" : "hello BCPL fees kitni hai";
    }),
    generateText: vi.fn(async () => "This is a mock BCPL reply."),
  };
});

const { default: app } = await import("../src/app");
const gemini = await import("../src/lib/gemini");
const { OFF_TOPIC_REFUSAL_HI, OFF_TOPIC_REFUSAL_EN } = await import("../src/routes/ai");

// A tiny valid base64 blob (content is irrelevant — transcribeAudio is mocked).
const tinyB64 = Buffer.from("fake-audio-bytes").toString("base64");

beforeAll(() => {
  vi.mocked(gemini.transcribeAudio).mockClear();
});

describe("POST /api/ai/transcribe", () => {
  it("transcribes a base64 JSON clip and returns {text, lang}", async () => {
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.1")
      .send({ audioBase64: tinyB64, mimeType: "audio/webm" });
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe("string");
    expect(res.body.text).toContain("BCPL");
    expect(res.body.lang).toBe("en");
    expect(gemini.transcribeAudio).toHaveBeenCalledTimes(1);
  });

  it("tags Hindi transcripts as lang=hi", async () => {
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.2")
      .send({ audioBase64: tinyB64, mimeType: "audio/wav" });
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe("hi");
  });

  it("accepts multipart form-data audio uploads", async () => {
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.3")
      .attach("audio", Buffer.from("fake-audio-bytes"), { filename: "clip.m4a", contentType: "audio/m4a" });
    expect(res.status).toBe(200);
    expect(res.body.text).toContain("BCPL");
  });

  it("rejects an unsupported mime type (415)", async () => {
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.4")
      .send({ audioBase64: tinyB64, mimeType: "audio/aiff" });
    expect(res.status).toBe(415);
    expect(res.body.code).toBe("BAD_MIME");
  });

  it("rejects an empty request (400 NO_AUDIO)", async () => {
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.5")
      .send({ mimeType: "audio/webm" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("NO_AUDIO");
  });

  it("rejects an oversized base64 clip (413)", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1024, 0x61).toString("base64");
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.0.6")
      .send({ audioBase64: big, mimeType: "audio/webm" });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("TOO_LARGE");
  });

  it("enforces a per-IP rate limit (10/min)", async () => {
    const ip = "10.9.9.9";
    let limited = false;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/api/ai/transcribe")
        .set("x-forwarded-for", ip)
        .send({ audioBase64: tinyB64, mimeType: "audio/webm" });
      if (res.status === 429) { limited = true; expect(res.body.code).toBe("RATE_LIMITED"); break; }
    }
    expect(limited).toBe(true);
  });

  it("rejects an oversized body via Content-Length BEFORE parsing it", async () => {
    // Declare a giant Content-Length but send almost no bytes: the pre-guard
    // must 413 on the header alone, without buffering the (claimed) body and
    // without ever invoking the transcription model.
    vi.mocked(gemini.transcribeAudio).mockClear();
    const res = await request(app)
      .post("/api/ai/transcribe")
      .set("x-forwarded-for", "10.0.7.1")
      .set("content-type", "application/json")
      .set("content-length", String(20 * 1024 * 1024)) // 20MB claimed
      .send({ audioBase64: tinyB64, mimeType: "audio/webm" });
    expect(res.status).toBe(413);
    expect(res.body.code).toBe("TOO_LARGE");
    expect(gemini.transcribeAudio).not.toHaveBeenCalled();
  });

  it("caps concurrent transcriptions (429 BUSY)", async () => {
    // Hold every transcription open, fire more than the cap (4) at once from
    // DISTINCT IPs (so the per-IP limiter doesn't mask the concurrency cap),
    // and assert at least one comes back BUSY.
    let release!: () => void;
    transcribeGate = new Promise<void>((r) => { release = r; });
    try {
      const codes: string[] = [];
      const reqs = Array.from({ length: 8 }, (_, i) =>
        request(app)
          .post("/api/ai/transcribe")
          .set("x-forwarded-for", `10.5.5.${i + 1}`)
          .send({ audioBase64: tinyB64, mimeType: "audio/webm" })
          .then((r) => { codes.push(r.status === 429 ? r.body.code : "ok"); }),
      );
      // Give the first batch a tick to occupy the in-flight slots.
      await new Promise((r) => setTimeout(r, 80));
      release();
      await Promise.all(reqs);
      expect(codes.filter((c) => c === "BUSY").length).toBeGreaterThan(0);
    } finally {
      transcribeGate = null;
    }
  });
});

describe("chat abuse hardening (Gemini mocked)", () => {
  it("400s when combined message text exceeds the cap", async () => {
    // 12 messages × 1000 chars = 12k combined > 8k cap.
    const messages = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      text: "a".repeat(1000),
    }));
    const res = await request(app)
      .post("/api/ai/chat")
      .set("x-forwarded-for", "10.6.6.1")
      .send({ messages });
    expect(res.status).toBe(400);
  });

  it("accepts a normal short conversation", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set("x-forwarded-for", "10.6.6.2")
      .send({ messages: [{ role: "user", text: "BCPL ki fees kitni hai?" }] });
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe("string");
  });
});

describe("chat guardrails (system prompt unit check — no Gemini call)", () => {
  it("exposes the exact bilingual refusal lines", () => {
    expect(OFF_TOPIC_REFUSAL_HI).toBe("माफ़ कीजिए, मैं सिर्फ BCPL T20 से जुड़े सवालों में मदद कर सकता हूँ।");
    expect(OFF_TOPIC_REFUSAL_EN).toBe("Sorry, I can only help with questions related to BCPL T20.");
  });

  it("the chat system prompt restricts scope to BCPL and includes both refusals", async () => {
    // Re-read the module source to assert the prompt content (deterministic,
    // no model call). The base prompt constant is embedded in the route file.
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(new URL("../src/routes/ai.ts", import.meta.url), "utf8");
    expect(src).toContain("SCOPE — YOU ANSWER ONLY BCPL QUESTIONS");
    expect(src).toContain(OFF_TOPIC_REFUSAL_HI);
    expect(src).toContain(OFF_TOPIC_REFUSAL_EN);
    // Compliance vocabulary bans still present.
    expect(src).toMatch(/NEVER use the words "scout"/);
    expect(src).toContain("never mention BCCI");
  });
});
