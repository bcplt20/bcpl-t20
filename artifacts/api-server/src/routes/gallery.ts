/**
 * Public gallery endpoint — match photos/videos the admin has opted in.
 *
 * Source of truth: the same S3-backed media library used by the admin panel
 * (routes/adminTools.ts). Only folders explicitly marked is_public = true are
 * exposed. Files stay in the PRIVATE S3 prefix — the site only ever receives
 * short-lived presigned GET links (viewUrl), never a public ACL or raw key
 * secrets. Nothing beyond name/kind/size + the presigned URL is leaked.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { mediaFoldersTable, mediaFilesTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getDownloadPresignedUrl } from "../lib/s3";
import { season4Albums } from "../lib/season4Gallery";

const router = Router();

router.get("/", async (_req, res) => {
  const folders = await db.select().from(mediaFoldersTable)
    .where(eq(mediaFoldersTable.isPublic, true))
    .orderBy(asc(mediaFoldersTable.createdAt));

  const dbAlbums = await Promise.all(folders.map(async (folder) => {
    const files = await db.select().from(mediaFilesTable)
      .where(eq(mediaFilesTable.folderId, folder.id))
      .orderBy(desc(mediaFilesTable.createdAt));
    const items = await Promise.all(files.map(async (f) => ({
      id: f.id,
      name: f.name,
      kind: f.kind,               // "photo" | "video"
      sizeBytes: f.sizeBytes,
      viewUrl: await getDownloadPresignedUrl(f.s3Key),
    })));
    return {
      id: folder.id,
      name: folder.name,
      kind: folder.kind,
      items,
    };
  }));

  // Only surface DB/S3 albums that actually have files.
  const nonEmpty = dbAlbums.filter(a => a.items.length > 0);

  /* Static Season-4 albums (mirrored server-side from the website). Photos are
     site assets, so they carry absolute url/thumb links (no presigning). We
     surface both an `items` array (backward-compatible shape) and a `photos`
     array so newer clients can read url/thumb directly. */
  const staticAlbums = season4Albums().map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    photos: a.photos,
    items: a.photos.map((p, i) => ({
      id: `${a.id}-${i + 1}`,
      name: `${a.name} ${i + 1}`,
      kind: "photo" as const,
      viewUrl: p.url,
      thumbUrl: p.thumb,
    })),
  }));

  const albums = [...staticAlbums, ...nonEmpty];

  /* Presigned links are short-lived, so the site must always re-fetch. */
  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json({ albums });
});

export default router;
