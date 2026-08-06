/**
 * Public videos endpoint — Season 4 auction videos / highlights for the app.
 *
 * Source of truth: the same links the website links to (mirrored server-side
 * in lib/season4Videos.ts). The featured item is the full auction stream on
 * YouTube (youtubeId set); the rest are self-hosted highlight clips (absolute
 * url, no youtubeId). No auth.
 */

import { Router } from "express";
import { season4Videos } from "../lib/season4Videos";

const router = Router();

router.get("/", (_req, res) => {
  const videos = season4Videos();
  res.setHeader("Cache-Control", "public, max-age=300");
  return res.json({ videos });
});

export default router;
