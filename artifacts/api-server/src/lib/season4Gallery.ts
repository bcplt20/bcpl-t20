/**
 * Season 4 gallery albums — server-side mirror of the website's hardcoded
 * albums (originally in artifacts/bcpl-website/src/data/{auctionGallery,
 * photoshootGallery}.ts and public/auction/*, public/gallery/photoshoot/*).
 *
 * The photos are static site assets served from the website origin, so we
 * return ABSOLUTE URLs against SITE_ORIGIN. Filenames are perfectly
 * sequential in the source data (auc-001..auc-845, ps-001..ps-096) so we
 * generate them here instead of duplicating ~940 filename literals.
 *
 * GET /api/gallery merges these in alongside any DB/S3-backed public albums,
 * keeping the { albums: [...] } response shape backward compatible.
 */

import { SITE_ORIGIN } from "../routes/seo";

export type GalleryPhoto = { url: string; thumb: string };
export type Season4Album = {
  id: string;
  name: string;
  kind: "photo";
  photos: GalleryPhoto[];
};

/** Zero-padded sequential filenames, e.g. seq("auc-", 1, 845) → auc-001.jpg… */
function seq(prefix: string, count: number, pad = 3): string[] {
  const files: string[] = [];
  for (let i = 1; i <= count; i++) {
    files.push(prefix + String(i).padStart(pad, "0") + ".jpg");
  }
  return files;
}

type AlbumDef = {
  id: string;
  name: string;
  count: number;
  prefix: string;
  /** path segment relative to the site origin, e.g. "auction" */
  thumbDir: string;
  fullDir: string;
};

const ALBUM_DEFS: AlbumDef[] = [
  {
    id: "s4-auction",
    name: "Season 4 Auction",
    count: 845,
    prefix: "auc-",
    thumbDir: "auction/thumb",
    fullDir: "auction/full",
  },
  {
    id: "s4-photoshoot",
    name: "Commercial Photoshoot",
    count: 96,
    prefix: "ps-",
    thumbDir: "gallery/photoshoot/thumb",
    fullDir: "gallery/photoshoot/full",
  },
];

/** Season-4 albums with absolute (SITE_ORIGIN) photo + thumb URLs. */
export function season4Albums(origin: string = SITE_ORIGIN): Season4Album[] {
  const base = origin.replace(/\/$/, "");
  return ALBUM_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    kind: "photo" as const,
    photos: seq(def.prefix, def.count).map((f) => ({
      url: `${base}/${def.fullDir}/${f}`,
      thumb: `${base}/${def.thumbDir}/${f}`,
    })),
  }));
}
