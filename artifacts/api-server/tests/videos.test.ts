/**
 * Public videos endpoint — Season 4 auction videos / highlights
 * (GET /api/videos). No auth, no SMS/email.
 *
 * Covers:
 *  - response shape { videos: [{ id, title, url }] }
 *  - the featured full stream is a YouTube link with youtubeId extracted
 *  - self-hosted highlight clips carry an absolute url and no youtubeId
 *  - extractYoutubeId handles common YouTube URL shapes
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

const { default: app } = await import("../src/app");
const { extractYoutubeId } = await import("../src/lib/season4Videos");

describe("GET /api/videos", () => {
  it("returns a non-empty list with the expected shape", async () => {
    const res = await request(app).get("/api/videos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.videos)).toBe(true);
    expect(res.body.videos.length).toBeGreaterThan(1);
    for (const v of res.body.videos) {
      expect(typeof v.id).toBe("string");
      expect(typeof v.title).toBe("string");
      expect(typeof v.url).toBe("string");
    }
  });

  it("features the full auction stream as a YouTube video with youtubeId", async () => {
    const res = await request(app).get("/api/videos");
    const featured = res.body.videos[0];
    expect(featured.youtubeId).toBe("Akv5fWqHXMQ");
    expect(featured.url).toContain("youtu");
  });

  it("self-hosted clips carry an absolute url and no youtubeId", async () => {
    const res = await request(app).get("/api/videos");
    const clips = res.body.videos.filter((v: { youtubeId?: string }) => !v.youtubeId);
    expect(clips.length).toBeGreaterThan(0);
    for (const c of clips) {
      expect(c.url).toMatch(/^https?:\/\//);
      expect(c.url).toContain("/auction/clips/");
    }
  });
});

describe("extractYoutubeId", () => {
  it("parses watch, youtu.be, embed and shorts URLs", () => {
    expect(extractYoutubeId("https://www.youtube.com/watch?v=Akv5fWqHXMQ")).toBe("Akv5fWqHXMQ");
    expect(extractYoutubeId("https://youtu.be/Akv5fWqHXMQ")).toBe("Akv5fWqHXMQ");
    expect(extractYoutubeId("https://www.youtube.com/embed/Akv5fWqHXMQ?rel=0")).toBe("Akv5fWqHXMQ");
    expect(extractYoutubeId("https://www.youtube.com/shorts/Akv5fWqHXMQ")).toBe("Akv5fWqHXMQ");
    expect(extractYoutubeId("https://example.com/video.mp4")).toBeNull();
  });
});
