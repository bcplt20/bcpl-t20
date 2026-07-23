/**
 * Idempotent startup migrations for the Phase 1 AI evaluation pipeline.
 * Follows the repo convention: raw `CREATE TABLE IF NOT EXISTS` /
 * `ADD COLUMN IF NOT EXISTS` executed from the api-server boot sequence,
 * so the same code migrates dev and EC2 production without drizzle push.
 */
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function ensurePhase1AiTables() {
  // ── users.dob (age eligibility gate; legacy users stay NULL) ──
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dob date`);

  // ── phase1_videos: technical metadata + declaration + attempts ──
  await db.execute(sql`ALTER TABLE phase1_videos ADD COLUMN IF NOT EXISTS mime_type varchar(60)`);
  await db.execute(sql`ALTER TABLE phase1_videos ADD COLUMN IF NOT EXISTS size_bytes bigint`);
  await db.execute(sql`ALTER TABLE phase1_videos ADD COLUMN IF NOT EXISTS etag varchar(80)`);
  await db.execute(sql`ALTER TABLE phase1_videos ADD COLUMN IF NOT EXISTS declaration_accepted boolean NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE phase1_videos ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1`);

  // ── notification_logs: dedupe key for idempotent sends ──
  await db.execute(sql`ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS dedupe_key varchar(160)`);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_dedupe_uq
    ON notification_logs (dedupe_key) WHERE dedupe_key IS NOT NULL
  `);

  // ── phase1_evaluations ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS phase1_evaluations (
      id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id    uuid NOT NULL REFERENCES registrations(id),
      attempt_number     integer NOT NULL DEFAULT 1,
      status             varchar(30) NOT NULL DEFAULT 'queued',
      video_s3_key       varchar(300),
      video_duration_sec real,
      video_mime_type    varchar(60),
      video_size_bytes   bigint,
      video_etag         varchar(80),
      video_sha256       varchar(64),
      needs_transcoding  boolean NOT NULL DEFAULT false,
      validation         json,
      reason_code        varchar(40),
      pass1_score        integer,
      pass2_score        integer,
      pass3_score        integer,
      final_score        integer,
      confidence         real,
      score_variance     integer,
      category_scores    json,
      strongest_area     varchar(40),
      improvement_area   varchar(40),
      result             varchar(20),
      result_release_at  timestamptz,
      result_released_at timestamptz,
      assessment_version varchar(20),
      rubric_version     varchar(20),
      prompt_version     varchar(20),
      model_version      varchar(60),
      passes_used        integer,
      processing_ms      integer,
      error              varchar(500),
      created_at         timestamptz NOT NULL DEFAULT now(),
      updated_at         timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS phase1_evaluations_status_idx ON phase1_evaluations (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS phase1_evaluations_release_idx ON phase1_evaluations (result_release_at) WHERE result_released_at IS NULL`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS phase1_evaluations_reg_idx ON phase1_evaluations (registration_id)`);
  // Worker lease token — finalize writes CAS on this so a stale-reclaimed row
  // can never receive results from two workers (last-write-wins eliminated).
  await db.execute(sql`ALTER TABLE phase1_evaluations ADD COLUMN IF NOT EXISTS claim_token uuid`);
  // One ACTIVE evaluation per registration+attempt (history rows keep older attempts)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS phase1_evaluations_reg_attempt_uq
    ON phase1_evaluations (registration_id, attempt_number)
  `);

  // ── ai_evaluation_passes ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_evaluation_passes (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id   uuid NOT NULL REFERENCES phase1_evaluations(id),
      registration_id uuid NOT NULL REFERENCES registrations(id),
      pass_number     integer NOT NULL,
      kind            varchar(20) NOT NULL,
      status          varchar(20) NOT NULL DEFAULT 'pending',
      model           varchar(60),
      prompt_version  varchar(20),
      provider_job_id varchar(120),
      request_at      timestamptz,
      response_at     timestamptz,
      latency_ms      integer,
      raw_response    json,
      score           integer,
      confidence      real,
      category_scores json,
      retry_count     integer NOT NULL DEFAULT 0,
      error           varchar(500),
      created_at      timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_evaluation_passes_eval_idx ON ai_evaluation_passes (evaluation_id)`);

  // ── ranking_snapshots ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ranking_snapshots (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      registration_id uuid NOT NULL UNIQUE REFERENCES registrations(id),
      city_rank       integer,
      city_total      integer,
      role_rank       integer,
      role_total      integer,
      percentile      real,
      snapshot_at     timestamptz NOT NULL DEFAULT now()
    )
  `);

  // ── audit_logs ──
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor      varchar(100) NOT NULL,
      actor_ip   varchar(45),
      action     varchar(50) NOT NULL,
      entity     varchar(60) NOT NULL,
      entity_key varchar(120),
      old_value  json,
      new_value  json,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity, entity_key)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at)`);

  // ── phase1_videos integrity backstops ──
  // Historic data hygiene first (idempotent), then unique indexes that make
  // the confirm-transaction invariants impossible to violate at the DB level.
  await db.execute(sql`
    WITH ranked AS (
      SELECT id, row_number() OVER (PARTITION BY registration_id ORDER BY submitted_at ASC NULLS LAST, id) AS rn
      FROM phase1_videos
    )
    UPDATE phase1_videos v SET attempt_number = r.rn
    FROM ranked r WHERE v.id = r.id AND v.attempt_number IS DISTINCT FROM r.rn
  `);
  await db.execute(sql`
    UPDATE phase1_videos SET status = 'superseded'
    WHERE status = 'submitted' AND id NOT IN (
      SELECT DISTINCT ON (registration_id) id FROM phase1_videos
      WHERE status = 'submitted'
      ORDER BY registration_id, submitted_at DESC NULLS LAST, id DESC
    )
  `);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS phase1_videos_reg_attempt_uq ON phase1_videos (registration_id, attempt_number)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS phase1_videos_one_submitted_uq ON phase1_videos (registration_id) WHERE status = 'submitted'`);
  // One evaluation per video attempt — doubles as the validation worker's
  // atomic claim mechanism (INSERT ... ON CONFLICT DO NOTHING).
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS phase1_evaluations_reg_attempt_uq ON phase1_evaluations (registration_id, attempt_number)`);

  logger.info("phase1 AI pipeline tables ensured");
}
