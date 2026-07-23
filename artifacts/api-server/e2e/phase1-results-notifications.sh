#!/usr/bin/env bash
# E2E: Phase 1 result notifications
#   §82 outcome-neutral release email/SMS (exactly once, reserve-first dedupe)
#   §83 congratulations after FIRST dashboard view, qualified players only
#   Legacy manual-decide path unified + old-era suppression
#   Ownership guard: AI-tracked registrations reject manual decides (409)
#   §75/§76 admin stats endpoint (auth + shape sanity)
#
# Requires: dev API on 127.0.0.1:8080, $DATABASE_URL, $ADMIN_SECRET, ffmpeg, jq, psql.
# Safe with GEMINI_API_KEY present: testMode + full validity/score overrides force
# the mock engines, so no real Gemini calls are made.
# Phones 6000000055-58 are reserved for this suite and wiped on entry/exit.
set -u
API="http://127.0.0.1:8080/api"
PASS=0; FAIL=0
PHONES="6000000055 6000000056 6000000057 6000000058"

PQ()  { psql "$DATABASE_URL" -qtAc "$1"; }   # -q: some psql builds print command tags (INSERT 0 1) even with -t, which corrupts captured RETURNING values
ok()  { PASS=$((PASS+1)); echo "  ok $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL $1"; }
ckeq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (got '$2' want '$3')"; fi }
ckge() { if [ "${2:-0}" -ge "$3" ] 2>/dev/null; then ok "$1"; else bad "$1 (got '$2' want >=$3)"; fi }

cleanup() {
  for p in $PHONES; do
    PQ "DELETE FROM notification_logs WHERE user_id IN (SELECT id FROM users WHERE phone='$p')" >/dev/null
    PQ "DELETE FROM ai_evaluation_passes WHERE evaluation_id IN (SELECT e.id FROM phase1_evaluations e JOIN registrations r ON r.id=e.registration_id JOIN users u ON u.id=r.user_id WHERE u.phone='$p')" >/dev/null
    PQ "DELETE FROM ranking_snapshots WHERE registration_id IN (SELECT r.id FROM registrations r JOIN users u ON u.id=r.user_id WHERE u.phone='$p')" >/dev/null
    PQ "DELETE FROM phase1_evaluations WHERE registration_id IN (SELECT r.id FROM registrations r JOIN users u ON u.id=r.user_id WHERE u.phone='$p')" >/dev/null
    PQ "DELETE FROM phase1_videos WHERE registration_id IN (SELECT r.id FROM registrations r JOIN users u ON u.id=r.user_id WHERE u.phone='$p')" >/dev/null
    PQ "DELETE FROM phase1_scores WHERE registration_id IN (SELECT r.id FROM registrations r JOIN users u ON u.id=r.user_id WHERE u.phone='$p')" >/dev/null
    PQ "DELETE FROM registrations WHERE user_id IN (SELECT id FROM users WHERE phone='$p')" >/dev/null
    PQ "DELETE FROM otp_sessions WHERE phone='$p'" >/dev/null
    PQ "DELETE FROM users WHERE phone='$p'" >/dev/null
  done
  PQ "DELETE FROM site_settings WHERE key='phase1_test_overrides'" >/dev/null
  curl -s -X PATCH "$API/admin-tools/phase1/config" -H "x-bcpl-admin: $ADMIN_SECRET" -H 'content-type: application/json' \
    -d '{"aiEnabled":false,"resultReleaseEnabled":false,"testMode":false}' >/dev/null
}
trap cleanup EXIT
cleanup

# Self-provision distinct test clips (30-60s duration bounds; distinct tones → distinct etags)
VID_A=/tmp/e2e_p1n_a.mp4; VID_B=/tmp/e2e_p1n_b.mp4
[ -f "$VID_A" ] || ffmpeg -y -loglevel error -f lavfi -i testsrc2=duration=48:size=640x360:rate=24 -f lavfi -i sine=frequency=953:duration=48 -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "$VID_A"
[ -f "$VID_B" ] || ffmpeg -y -loglevel error -f lavfi -i testsrc2=duration=49:size=640x360:rate=24 -f lavfi -i sine=frequency=977:duration=49 -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -shortest "$VID_B"

seed() { local uid rid
  uid=$(PQ "INSERT INTO users (name, phone, email, is_verified, dob) VALUES ('$2', '$1', '$1@test.bcpl', true, '2000-01-01') RETURNING id")
  rid=$(PQ "INSERT INTO registrations (user_id, role, trial_city, phase1_status, video_deadline, reg_number) VALUES ('$uid', '$3', 'Delhi', '$5', now() + interval '7 days', '$4') RETURNING id")
  echo "$uid|$rid"
}

login() { local otp
  curl -s -X POST "$API/auth/send-otp" -H 'content-type: application/json' -d "{\"phone\":\"$1\",\"purpose\":\"login\"}" >/dev/null
  otp=$(PQ "SELECT otp_code FROM otp_sessions WHERE phone='$1' LIMIT 1")
  curl -s -X POST "$API/auth/verify-otp" -H 'content-type: application/json' -d "{\"phone\":\"$1\",\"otp\":\"$otp\",\"purpose\":\"login\"}" | jq -r '.token // empty'
}

upload() { local size resp url key put conf
  size=$(stat -c%s "$3")
  resp=$(curl -s -X POST "$API/video/upload-url" -H "authorization: Bearer $1" -H 'content-type: application/json' -d "{\"registrationId\":\"$2\",\"contentType\":\"video/mp4\",\"fileSizeBytes\":$size}")
  url=$(echo "$resp" | jq -r '.presignedUrl // empty'); key=$(echo "$resp" | jq -r '.s3Key // empty')
  if [ -z "$url" ]; then echo "UPLOADURL_FAIL:$resp"; return; fi
  put=$(curl -s -X PUT "$url" -H 'content-type: video/mp4' --data-binary @"$3" -o /dev/null -w '%{http_code}')
  if [ "$put" != "200" ]; then echo "PUT_FAIL:$put"; return; fi
  conf=$(curl -s -X POST "$API/video/confirm" -H "authorization: Bearer $1" -H 'content-type: application/json' -d "{\"registrationId\":\"$2\",\"s3Key\":\"$key\",\"declarationAccepted\":true,\"durationSeconds\":$4}")
  if [ "$(echo "$conf" | jq -r '.success')" = "true" ]; then echo "true"; else echo "CONFIRM_FAIL:$conf"; fi
}

adm() { curl -s -X POST "$API/admin-tools/phase1/$1" -H "x-bcpl-admin: $ADMIN_SECRET"; }

echo "== Enable pipeline (testMode keeps everything on the mock engines) =="
curl -s -X PATCH "$API/admin-tools/phase1/config" -H "x-bcpl-admin: $ADMIN_SECRET" -H 'content-type: application/json' \
  -d '{"aiEnabled":true,"testMode":true,"resultReleaseEnabled":true}' >/dev/null
sleep 31   # config cache TTL

echo "== Seed A (qualified 85) + B (not_shortlisted 45) + legacy C/D =="
IFS='|' read -r UA RA <<<"$(seed 6000000055 'E2E P1N Qual' 'Batsman' 'BCPL-DEL-9141' 'payment_done')"
IFS='|' read -r UB RB <<<"$(seed 6000000056 'E2E P1N NotQ' 'bowl' 'BCPL-DEL-9142' 'payment_done')"
IFS='|' read -r UC RC <<<"$(seed 6000000057 'E2E P1N LegacyNew' 'wk' 'BCPL-DEL-9143' 'payment_done')"
IFS='|' read -r UD RD <<<"$(seed 6000000058 'E2E P1N LegacyOld' 'ar' 'BCPL-DEL-9144' 'payment_done')"
TA=$(login 6000000055); TB=$(login 6000000056); TC=$(login 6000000057); TD=$(login 6000000058)
ckeq "logins ok" "$([ -n "$TA" ] && [ -n "$TB" ] && [ -n "$TC" ] && [ -n "$TD" ] && echo yes)" "yes"

VALID_OK='{"validCricketVideo": true, "assessmentPossible": true, "playerClearlyVisible": true, "sufficientCricketActions": true, "roleEvidence": "netting", "excessiveEditing": false, "normalSpeedEvidenceAvailable": true, "qualityScore": 80, "reuploadRequired": false, "reasonCode": null}'
PQ "INSERT INTO site_settings (key, value) VALUES ('phase1_test_overrides', '{\"$RA\": {\"score\": 85, \"validity\": $VALID_OK}, \"$RB\": {\"score\": 45, \"validity\": $VALID_OK}}') ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value" >/dev/null

echo "== AI pipeline A+B =="
ckeq "A upload" "$(upload "$TA" "$RA" "$VID_A" 48)" "true"
ckeq "B upload" "$(upload "$TB" "$RB" "$VID_B" 49)" "true"
adm run-validation >/dev/null; adm run-ai >/dev/null; adm run-scoring >/dev/null
ckeq "A scored (DB)" "$(PQ "SELECT status FROM phase1_evaluations WHERE registration_id='$RA'")" "scored"
ckeq "B scored (DB)" "$(PQ "SELECT status FROM phase1_evaluations WHERE registration_id='$RB'")" "scored"

PQ "UPDATE phase1_evaluations SET result_release_at = now() - interval '1 minute' WHERE registration_id IN ('$RA','$RB')" >/dev/null
adm run-release >/dev/null
ckeq "A released (DB)" "$(PQ "SELECT status FROM phase1_evaluations WHERE registration_id='$RA'")" "result_released"
ckeq "B released (DB)" "$(PQ "SELECT status FROM phase1_evaluations WHERE registration_id='$RB'")" "result_released"

echo "== §82: release notification is outcome-neutral, exactly once =="
ckeq "A release-email row" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UA' AND template='phase1_result'")" "1"
ckeq "B release-email row" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UB' AND template='phase1_result'")" "1"
ckeq "A no congrats before view" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UA' AND template='phase1_congrats'")" "0"

echo "== §83: congrats fires on FIRST view of qualified result, exactly once =="
R1=$(curl -s "$API/results/me" -H "authorization: Bearer $TA")
ckeq "A available+qualified" "$(echo "$R1" | jq -r '.available')/$(echo "$R1" | jq -r '.decision')" "true/qualified"
sleep 3
ckeq "A congrats after first view" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UA' AND template='phase1_congrats' AND dedupe_key='p1_congrats_' || (SELECT id::text FROM phase1_evaluations WHERE registration_id='$RA')")" "1"
curl -s "$API/results/me" -H "authorization: Bearer $TA" >/dev/null
sleep 3
ckeq "A congrats still exactly 1" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UA' AND template='phase1_congrats'")" "1"
R2=$(curl -s "$API/results/me" -H "authorization: Bearer $TB")
ckeq "B not_shortlisted" "$(echo "$R2" | jq -r '.decision')" "not_shortlisted"
sleep 3
ckeq "B never gets congrats" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UB' AND template='phase1_congrats'")" "0"

echo "== §83 legacy path: congrats only for post-migration decisions =="
LEG() { PQ "INSERT INTO phase1_scores (registration_id, role_skill, technique, execution, game_awareness, movement, video_evidence, total, selector_note) VALUES ('$1', 15, 15, 15, 15, 10, 12, $2, 'panel note')" >/dev/null; PQ "UPDATE registrations SET phase1_status='selected' WHERE id='$1'" >/dev/null; }
LEG "$RC" 82
LEG "$RD" 81
# C decided under the NEW flow -> release log row exists (what admin.ts now writes)
PQ "INSERT INTO notification_logs (user_id, type, template, dedupe_key) VALUES ('$UC', 'email', 'phase1_result', 'p1_result_legacy_$RC')" >/dev/null
RC1=$(curl -s "$API/results/me" -H "authorization: Bearer $TC")
ckeq "C legacy qualified" "$(echo "$RC1" | jq -r '.decision')" "qualified"
sleep 3
ckeq "C congrats after first view" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UC' AND template='phase1_congrats' AND dedupe_key='p1_congrats_legacy_$RC'")" "1"
curl -s "$API/results/me" -H "authorization: Bearer $TC" >/dev/null; sleep 3
ckeq "C congrats still exactly 1" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UC' AND template='phase1_congrats'")" "1"
# D = old-era player (no release log) -> viewing must NOT trigger congrats
RD1=$(curl -s "$API/results/me" -H "authorization: Bearer $TD")
ckeq "D legacy qualified" "$(echo "$RD1" | jq -r '.decision')" "qualified"
sleep 3
ckeq "D (pre-migration) gets NO congrats" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UD' AND template='phase1_congrats'")" "0"

echo "== ownership guard: AI-tracked regs reject manual decides =="
GC=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/admin/registrations/$RA/phase1-status" -H "x-bcpl-admin: $ADMIN_SECRET" -H 'content-type: application/json' -d '{"status":"rejected"}')
ckeq "manual decide on AI-tracked reg -> 409" "$GC" "409"
ckeq "A phase1_status unchanged" "$(PQ "SELECT phase1_status FROM registrations WHERE id='$RA'")" "selected"
ckeq "A still exactly 1 result email" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UA' AND template='phase1_result'")" "1"
GC2=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/admin/registrations/$RC/phase1-status" -H "x-bcpl-admin: $ADMIN_SECRET" -H 'content-type: application/json' -d '{"status":"selected"}')
ckeq "legacy manual decide still allowed" "$GC2" "200"
sleep 2
ckeq "C result email still exactly 1 (reserve-first dedupe)" "$(PQ "SELECT count(*) FROM notification_logs WHERE user_id='$UC' AND template='phase1_result'")" "1"

echo "== §75/§76: admin stats endpoint =="
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/admin-tools/phase1/stats")
ckeq "stats without admin header -> 403" "$code" "403"
ST=$(curl -s "$API/admin-tools/phase1/stats" -H "x-bcpl-admin: $ADMIN_SECRET")
ckge "registrations.total >= 4" "$(echo "$ST" | jq -r '.registrations.total // 0')" 4
ckge "evals result_released >= 2" "$(echo "$ST" | jq -r '.evaluations.byStatus.result_released // 0')" 2
ckge "released.qualified >= 1" "$(echo "$ST" | jq -r '.evaluations.released.qualified // 0')" 1
ckge "released.not_shortlisted >= 1" "$(echo "$ST" | jq -r '.evaluations.released.not_shortlisted // 0')" 1
ckge "cost.aiPassesTotal >= 4" "$(echo "$ST" | jq -r '.cost.aiPassesTotal // 0')" 4
ckge "videos submitted >= 2" "$(echo "$ST" | jq -r '.videos.byStatus.submitted // 0')" 2
ckge "notifications sent >= 2" "$(echo "$ST" | jq -r '.notifications.sent // 0')" 2
ckeq "byRole has all 4 keys" "$(echo "$ST" | jq -r '.registrations.byRole | has("bat") and has("bowl") and has("ar") and has("wk")')" "true"
ckge "avgFinalScore > 0" "$(echo "$ST" | jq -r '.evaluations.avgFinalScore // 0 | floor')" 1
ckeq "generatedAt present" "$(echo "$ST" | jq -r '.generatedAt != null')" "true"

echo ""
echo "RESULT: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = "0" ]
