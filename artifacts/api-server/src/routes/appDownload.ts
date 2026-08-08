/* ── Public app-download redirect ──
   GET /api/app/apk — permanent public URL for the Android APK. The S3 bucket
   blocks public reads, so this 302-redirects to a fresh presigned GET (1 h),
   same pattern as /api/sponsors/logo. The website's "Direct APK" button (Admin
   → CMS → App Download Links) points here so the link never expires even
   though presigned URLs do. */
import { Router, type IRouter } from "express";
import { getDownloadPresignedUrl, headS3Object } from "../lib/s3";

const APK_KEY = "cms/app/bcpl-t20.apk";

const router: IRouter = Router();

router.get("/apk", async (_req, res) => {
  try {
    const head = await headS3Object(APK_KEY);
    if (!head.exists) return void res.status(404).json({ error: "APK not uploaded yet" });
    const url = await getDownloadPresignedUrl(APK_KEY, 3600);
    /* Short cache so CDNs don't pin a presigned URL past its expiry. */
    res.setHeader("Cache-Control", "public, max-age=300");
    return void res.redirect(302, url);
  } catch {
    return void res.status(404).json({ error: "APK not available" });
  }
});

export default router;
