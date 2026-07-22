---
name: S3 media library serving & guards
description: How the private S3 media/ prefix must be served and which server-side guards protect uploads/exports
---

# S3 media library (admin panel)

- The bucket's `media/` prefix is **private**: plain `s3Url` returns 403. Anything that displays media must use the presigned GET (`viewUrl`, 1-hour expiry) issued per-request by the API. Never render `s3Url` in the frontend.
  - **Why:** verified by curl — plain URL 403, presigned 200. Presigned URLs expire after 1h, so long-lived admin tabs will show broken thumbnails until the list is refetched.
- Bucket CORS **does allow browser PUTs from the Replit dev origin** (e2e upload from dev preview succeeded Jul 2026). Don't assume "CORS will block dev" — it doesn't; treat dev upload failures as real bugs.
- Server-side guards that must not be weakened (architect-flagged security issues, fixed Jul 2026):
  - `media/confirm` only accepts keys with prefix `media/<folderId>/` and rejects duplicate `s3Key` confirms — prevents cross-folder key injection that could let a folder delete remove unrelated S3 objects.
  - CSV export cells are formula-escaped (leading `= + - @` get `'` prefix) — admin exports contain player-controlled text (names, cities) and are opened in Excel/Sheets.
  - S3 delete failures abort with 502 and keep DB rows, so objects are never orphaned invisibly.

**How to apply:** any new media surface (public gallery, calendar attachments) must fetch fresh presigned URLs from the API, and any new export endpoint must reuse the shared `csvCell` helper.
