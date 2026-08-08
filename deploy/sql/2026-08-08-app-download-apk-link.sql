-- Seed the /download page "Direct APK" link on prod. Insert-only: if the row
-- already exists (admin manages it via Admin → CMS → App Download Links),
-- deploy never overwrites admin edits. Idempotent — safe to rerun every deploy.
INSERT INTO site_settings (key, value, updated_at)
VALUES (
  'app_download_links',
  '{"playStore":"","appStore":"","apk":"https://bcplt20.com/api/app/apk"}'::jsonb,
  now()
)
ON CONFLICT (key) DO NOTHING;

-- If the row exists but the apk field is still blank, fill just that field
-- (still never clobbers a non-empty admin-set value).
UPDATE site_settings
SET value = value::jsonb || '{"apk":"https://bcplt20.com/api/app/apk"}'::jsonb,
    updated_at = now()
WHERE key = 'app_download_links'
  AND COALESCE(value::jsonb->>'apk', '') = '';
