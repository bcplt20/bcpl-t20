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

const router = Router();

router.get("/", async (_req, res) => {
  const folders = await db.select().from(mediaFoldersTable)
    .where(eq(mediaFoldersTable.isPublic, true))
    .orderBy(asc(mediaFoldersTable.createdAt));

  const albums = await Promise.all(folders.map(async (folder) => {
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

  // Only surface albums that actually have files.
  const nonEmpty = albums.filter(a => a.items.length > 0);

  /* Presigned links are short-lived, so the site must always re-fetch. */
  res.setHeader("Cache-Control", "no-store");
  return res.json({ albums: nonEmpty });
});

export default router;
