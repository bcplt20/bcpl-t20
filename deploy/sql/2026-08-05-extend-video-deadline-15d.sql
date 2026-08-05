-- Owner rule (5 Aug 2026): the video upload window is 15 days FROM REGISTRATION.
-- Older rows had their deadline reset at payment time with the old 7-day config,
-- so live players saw a 7-day countdown while every page promises 15 days.
-- Idempotent + non-destructive: only ever EXTENDS a deadline up to
-- created_at + 15 days, never shortens one, and is a no-op on later runs.
UPDATE registrations
SET video_deadline = created_at + interval '15 days',
    updated_at = now()
WHERE video_deadline IS NOT NULL
  AND video_deadline < created_at + interval '15 days';
