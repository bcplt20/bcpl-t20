/**
 * Season 4 auction videos / highlights — server-side mirror of the videos the
 * website links to (artifacts/bcpl-website/src/pages/Videos.tsx +
 * src/data/auctionClips.ts).
 *
 * The featured item is the full auction live stream on YouTube; the rest are
 * short self-hosted highlight clips served from the website origin
 * (public/auction/clips/). Self-hosted clips carry an absolute `url` against
 * SITE_ORIGIN and no `youtubeId`.
 */

import { SITE_ORIGIN } from "../routes/seo";

export type Video = {
  id: string;
  title: string;
  youtubeId?: string;
  url: string;
};

/** Full Season 4 auction live stream (YouTube). Matches AUCTION_STREAM.ytId. */
const AUCTION_STREAM_YT_ID = "Akv5fWqHXMQ";

/** Self-hosted highlight clips (mp4 in the site's public/auction/clips/). */
const CLIPS: { file: string; title: string }[] = [
  { file: "auc-clip-01.mp4", title: "Auction Arena Reveal" },
  { file: "auc-clip-02.mp4", title: "Walking Into the Auction" },
  { file: "auc-clip-03.mp4", title: "Behind the Scenes: Team Shoot" },
  { file: "auc-clip-12.mp4", title: "Sourav Ganguly at the Auction" },
  { file: "auc-clip-05.mp4", title: "The Trophy on Camera" },
  { file: "auc-clip-06.mp4", title: "Season 4 Jerseys" },
  { file: "auc-clip-07.mp4", title: "Inside the Auction Arena" },
  { file: "auc-clip-08.mp4", title: "Live Bidding" },
  { file: "auc-clip-09.mp4", title: "Player on the Block" },
  { file: "auc-clip-10.mp4", title: "The Hammer Falls" },
  { file: "auc-clip-11.mp4", title: "Sold! Team Celebration" },
];

/** Extract a YouTube video id from common URL shapes (or null if not YT). */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = re.exec(url);
    if (m) return m[1];
  }
  return null;
}

export function season4Videos(origin: string = SITE_ORIGIN): Video[] {
  const base = origin.replace(/\/$/, "");
  const streamUrl = `https://youtu.be/${AUCTION_STREAM_YT_ID}`;
  const featured: Video = {
    id: "s4-auction-stream",
    title: "BCPL Season 4 Auction — Full Live Stream",
    youtubeId: extractYoutubeId(streamUrl) ?? AUCTION_STREAM_YT_ID,
    url: streamUrl,
  };
  const clips: Video[] = CLIPS.map((c, i) => ({
    id: `s4-clip-${String(i + 1).padStart(2, "0")}`,
    title: c.title,
    url: `${base}/auction/clips/${c.file}`,
  }));
  return [featured, ...clips];
}
