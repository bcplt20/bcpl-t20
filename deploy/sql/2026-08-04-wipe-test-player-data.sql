-- ============================================================
-- BCPL T20 — one-time: TEST PLAYER DATA WIPE (owner request, 4 Aug 2026)
-- Saurabh ji ne bola: launch se pehle saara test data (7-8 test players)
-- har jagah se delete karna hai, fresh testing ke liye.
--
-- KYA DELETE HOTA HAI: players/registrations, payments, videos, evaluations,
-- KYC, trials, referrals, OTP sessions, notifications, audit logs.
-- KYA NAHI CHHEDTE: teams, points_table, site_settings, whatsapp_templates,
-- referral_reward_tiers, app_flags, admin_users, media library.
--
-- Idempotent hai — do baar chalane par kuch nahi bigadta.
-- Prod (EC2) par deploy/go.sh ke auto-catchup se chalega, ya manually:
--   psql "$DATABASE_URL" -f deploy/sql/2026-08-04-wipe-test-player-data.sql
-- ============================================================

BEGIN;

TRUNCATE TABLE
  deliveries,
  innings,
  match_xi,
  matches,
  trial_evaluations,
  trial_attempts,
  trial_checkins,
  trial_correction_requests,
  trial_allocations,
  trial_slots,
  selection_batch_members,
  selection_batches,
  ranking_snapshots,
  physical_assessments,
  ai_evaluation_passes,
  phase1_evaluations,
  phase1_feedback,
  phase1_scores,
  phase1_videos,
  phase1_payments,
  phase2_payments,
  refunds,
  kyc_records,
  fraud_flags,
  player_profiles,
  team_players,
  referral_reward_grants,
  referral_signups,
  referral_codes,
  registration_drafts,
  registrations,
  otp_sessions,
  notification_outbox,
  notification_logs,
  audit_logs,
  users
RESTART IDENTITY CASCADE;

-- Points table wapas zero par (agar test match data se badla ho)
UPDATE points_table SET played=0, won=0, lost=0, no_result=0, points=0, nrr=0, form='[]'
WHERE played <> 0 OR points <> 0;

COMMIT;
