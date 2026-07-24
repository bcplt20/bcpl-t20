#!/usr/bin/env bash
# E2E: QR Trial Ops — staff app W1
#   Gate scan GREEN/YELLOW/RED (+ blind payload), city scoping, role gates,
#   check-in (dup 409), 6-attempt control + feeder error + undo,
#   locked 100-pt submit (server-computed), correction workflow
#   (supersede keeps original), physical_assessments bridge, counters.
#
# Requires: dev API on 127.0.0.1:8080, $DATABASE_URL, $SESSION_SECRET, jq, psql, node.
# Uses registration BCPL-DEL-1 (dev data): phase2_status/role/trial_city are
# saved and restored; all created rows are deleted on exit.
set -u
API="http://127.0.0.1:8080/api"
PASS=0; FAIL=0

PQ()  { psql "$DATABASE_URL" -qtAc "$1"; }   # -q: command tags corrupt captured RETURNING values otherwise
ok()  { PASS=$((PASS+1)); echo "  ok $1"; }
bad() { FAIL=$((FAIL+1)); echo "  FAIL $1"; }
ckeq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (got '$2' want '$3')"; fi }

mk_token() { # email role cities-json
  node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({admin:true,email:process.argv[1],name:process.argv[1].split('@')[0],role:process.argv[2],cities:JSON.parse(process.argv[3])},process.env.SESSION_SECRET||'dev-session-secret',{expiresIn:'1h'}))" "$1" "$2" "$3"
}
J() { jq -r "$1" 2>/dev/null; }

REG_ID=$(PQ "SELECT id FROM registrations WHERE reg_number='BCPL-DEL-1' LIMIT 1")
if [ -z "$REG_ID" ]; then echo "ABORT: BCPL-DEL-1 not found"; exit 1; fi
ORIG_P2=$(PQ "SELECT coalesce(phase2_status,'') FROM registrations WHERE id='$REG_ID'")
ORIG_ROLE=$(PQ "SELECT coalesce(role,'') FROM registrations WHERE id='$REG_ID'")
ORIG_CITY=$(PQ "SELECT coalesce(trial_city,'') FROM registrations WHERE id='$REG_ID'")
ORIG_RUBRICS=$(PQ "SELECT value::text FROM site_settings WHERE key='trial_rubrics_v1'")

VENUE_ID=""; SLOT_ID=""; ALLOC_ID=""
cleanup() {
  [ -n "$ALLOC_ID" ] && {
    PQ "DELETE FROM trial_attempts WHERE allocation_id='$ALLOC_ID'" >/dev/null
    PQ "DELETE FROM trial_correction_requests WHERE registration_id='$REG_ID'" >/dev/null
    PQ "DELETE FROM trial_evaluations WHERE registration_id='$REG_ID'" >/dev/null
    PQ "DELETE FROM physical_assessments WHERE registration_id='$REG_ID'" >/dev/null
    PQ "DELETE FROM trial_checkins WHERE registration_id='$REG_ID'" >/dev/null
    PQ "DELETE FROM trial_allocations WHERE id='$ALLOC_ID'" >/dev/null
  }
  [ -n "$SLOT_ID" ] && PQ "DELETE FROM trial_slots WHERE id='$SLOT_ID'" >/dev/null
  [ -n "$VENUE_ID" ] && PQ "DELETE FROM trial_venues WHERE id='$VENUE_ID'" >/dev/null
  # rubric override created by this suite must never leak into real scoring
  if [ -n "$ORIG_RUBRICS" ]; then
    PQ "UPDATE site_settings SET value='$ORIG_RUBRICS'::jsonb WHERE key='trial_rubrics_v1'" >/dev/null
  else
    PQ "DELETE FROM site_settings WHERE key='trial_rubrics_v1'" >/dev/null
  fi
  PQ "UPDATE registrations SET phase2_status=NULLIF('$ORIG_P2',''), role=NULLIF('$ORIG_ROLE',''), trial_city=NULLIF('$ORIG_CITY','') WHERE id='$REG_ID'" >/dev/null
}
trap cleanup EXIT

echo "== setup =="
PQ "UPDATE registrations SET phase2_status='kyc_done', role='Batsman', trial_city='Delhi' WHERE id='$REG_ID'" >/dev/null
TODAY=$(TZ=Asia/Kolkata date +%F)
VENUE_ID=$(PQ "INSERT INTO trial_venues (city,venue,trial_date,trial_time,reporting_time,slots,status) VALUES ('Delhi','E2E Staff Ground','$TODAY','7:00 AM','6:00 AM',100,'announced') RETURNING id")
SLOT_ID=$(PQ "INSERT INTO trial_slots (venue_id,city,slot_date,reporting_time,start_time,batch_name,capacity) VALUES ('$VENUE_ID','Delhi','$TODAY','6:00 AM','7:00 AM','E2E Batch',50) RETURNING id")
TOKEN_HEX=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ALLOC_ID=$(PQ "INSERT INTO trial_allocations (registration_id,slot_id,venue_id,city,pass_token) VALUES ('$REG_ID','$SLOT_ID','$VENUE_ID','Delhi','$TOKEN_HEX') RETURNING id")
[ -n "$ALLOC_ID" ] && ok "fixture ready (alloc $ALLOC_ID)" || { bad "fixture insert failed"; exit 1; }

GATE_T=$(mk_token gate@e2e GATE_SECURITY '["delhi"]')
GATE_WRONG_T=$(mk_token gate2@e2e GATE_SECURITY '["mumbai"]')
CHECKIN_T=$(mk_token desk@e2e CHECKIN_STAFF '["delhi"]')
EVAL_T=$(mk_token coach@e2e TRIAL_EVALUATOR '["delhi"]')
EVAL_NOCITY_T=$(mk_token lost@e2e TRIAL_EVALUATOR '[]')
STATION_T=$(mk_token station@e2e STATION_OPERATOR '["delhi"]')
SUP_T=$(mk_token sup@e2e VENUE_SUPERVISOR '["delhi"]')

QR="BCPL-TRIAL:$TOKEN_HEX"
post() { curl -s -X POST "$API$1" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $2" -d "$3"; }
get()  { curl -s "$API$1" -H "x-bcpl-admin-token: $2"; }

echo "== gate scan =="
R=$(post /staff/scan/gate "$GATE_T" "{\"token\":\"$QR\"}")
ckeq "gate GREEN valid slot" "$(echo "$R" | J .status)-$(echo "$R" | J .code)" "GREEN-VALID_SLOT"
ckeq "gate shows trial number" "$(echo "$R" | J .trialNo)" "BCPL-DEL-1"
ckeq "gate payload is status-only (no name/phone)" "$(echo "$R" | jq 'has("name") or has("phone")')" "false"
R=$(post /staff/scan/gate "$GATE_WRONG_T" "{\"token\":\"$QR\"}")
ckeq "gate wrong city → RED WRONG_VENUE" "$(echo "$R" | J .status)-$(echo "$R" | J .code)" "RED-WRONG_VENUE"
R=$(post /staff/scan/gate "$GATE_T" '{"token":"BCPL-TRIAL:deadbeef"}')
ckeq "gate bogus token → RED PASS_INVALID" "$(echo "$R" | J .status)-$(echo "$R" | J .code)" "RED-PASS_INVALID"
R=$(post /staff/scan/gate "$GATE_T" '{"regNumber":"bcpl-del-1"}')
ckeq "gate manual reg number (case-insensitive)" "$(echo "$R" | J .code)" "VALID_SLOT"

echo "== role & scope gates =="
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/staff/eval/submit" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $STATION_T" -d "{\"allocationId\":\"$ALLOC_ID\",\"technical\":{}}")
ckeq "station operator cannot submit (403)" "$CODE" "403"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/staff/eval/attempt" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $GATE_T" -d "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"MISS\"}")
ckeq "gate security cannot record attempts (403)" "$CODE" "403"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/staff/eval/resolve" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $EVAL_NOCITY_T" -d "{\"token\":\"$QR\"}")
ckeq "field staff with no city assigned blocked (403)" "$CODE" "403"

echo "== attempts require check-in =="
R=$(post /staff/eval/resolve "$EVAL_T" "{\"token\":\"$QR\"}")
ckeq "blind resolve: trialNo + no PII" "$(echo "$R" | J .trialNo)/$(echo "$R" | jq 'has("name") or has("phone")')" "BCPL-DEL-1/false"
ckeq "resolve shows not checked in" "$(echo "$R" | J .checkedIn)" "false"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"MIDDLED\"}")
ckeq "attempt before check-in → 409" "$(echo "$R" | J .error | grep -c 'not checked in')" "1"

echo "== check-in =="
R=$(post /staff/checkin "$CHECKIN_T" "{\"token\":\"$QR\",\"device\":\"e2e\"}")
ckeq "check-in ok" "$(echo "$R" | J .ok)" "true"
NAME=$(echo "$R" | J .player.name)
[ -n "$NAME" ] && [ "$NAME" != "null" ] && ok "check-in shows identity (name)" || bad "check-in name missing"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/staff/checkin" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $CHECKIN_T" -d "{\"token\":\"$QR\"}")
ckeq "duplicate check-in → 409" "$CODE" "409"
R=$(post /staff/scan/gate "$GATE_T" "{\"token\":\"$QR\"}")
ckeq "gate after check-in → ALREADY_INSIDE" "$(echo "$R" | J .code)" "ALREADY_INSIDE"

echo "== six-attempt control =="
for O in MIDDLED GOOD_CONTACT PARTIAL MISS MIDDLED; do
  R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"$O\"}")
done
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"feederError\":true}")
ckeq "feeder error logged (not counted)" "$(echo "$R" | J .attempts.batting.feederErrors)" "1"
ckeq "feeder error keeps valid count" "$(echo "$R" | J '.attempts.batting.valid | length')" "5"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"GOOD_CONTACT\"}")
ckeq "6th valid attempt recorded" "$(echo "$R" | J '.attempts.batting.valid | length')" "6"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"MISS\"}")
ckeq "7th attempt refused (spec §12)" "$(echo "$R" | J .error | grep -c 'All 6')" "1"
R=$(post /staff/eval/attempt/undo "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\"}")
ckeq "undo removes last" "$(echo "$R" | J '.attempts.batting.valid | length')" "5"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"GOOD_CONTACT\"}")
ckeq "re-add after undo" "$(echo "$R" | J '.attempts.batting.valid | length')" "6"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"bowling\",\"outcome\":\"TARGET_HIT\"}")
ckeq "batsman cannot get bowling attempts (400)" "$(echo "$R" | J .error | grep -c 'not assessed')" "1"
# Role-discipline gate fires before the feeder rule (correct precedence for a
# batsman fixture); the bowling feeder-error rejection itself is unit-covered.
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"bowling\",\"feederError\":true}")
ckeq "feeder request still role-gated (400)" "$(echo "$R" | J .error | grep -c 'not assessed')" "1"

echo "== locked submit =="
TECH='{"balance":7,"footwork":7,"timing":7,"shot_execution":7,"shot_selection":7,"fielding":7}'
R=$(post /staff/eval/submit "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"technical\":{\"balance\":7}}")
ckeq "missing dims rejected (400)" "$(echo "$R" | J .error | grep -c 'Missing technical')" "1"
R=$(post /staff/eval/submit "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"technical\":$TECH,\"notes\":\"e2e run\"}")
# batting 3+2+1+0+3+2=11/18*40=24.44; tech 5×(7/10×11)=38.5; fielding 3.5 → 66.44
ckeq "server-computed total = 66.44" "$(echo "$R" | J .evaluation.totalScore)" "66.44"
EVAL_ID=$(echo "$R" | J .evaluation.id)
R=$(post /staff/eval/submit "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"technical\":$TECH}")
ckeq "second submit locked (409)" "$(echo "$R" | J .error | grep -c 'locked')" "1"
R=$(post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"MISS\"}")
ckeq "attempts locked after submit (409)" "$(echo "$R" | J .error | grep -c 'locked')" "1"
R=$(post /staff/scan/gate "$GATE_T" "{\"token\":\"$QR\"}")
ckeq "gate after submit → RED ALREADY_COMPLETED" "$(echo "$R" | J .code)" "ALREADY_COMPLETED"
BRIDGE=$(PQ "SELECT final_score||'/'||assessor FROM physical_assessments WHERE registration_id='$REG_ID'")
ckeq "physical_assessments bridge row" "$BRIDGE" "66.44/coach@e2e"

echo "== correction workflow =="
R=$(post /staff/eval/correction "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"reason\":\"entered timing wrong\"}")
ckeq "correction filed" "$(echo "$R" | J .ok)" "true"
CORR_ID=$(echo "$R" | J .request.id)
R=$(post /staff/eval/correction "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"reason\":\"again\"}")
ckeq "duplicate correction blocked (409)" "$(echo "$R" | J .error | grep -c 'already pending')" "1"
R=$(get /staff/supervisor/corrections "$SUP_T")
ckeq "supervisor sees pending request" "$(echo "$R" | jq --arg id "$CORR_ID" '[.corrections[].id] | index($id) != null')" "true"
R=$(post "/staff/supervisor/corrections/$CORR_ID" "$SUP_T" '{"approve":true,"note":"ok"}')
ckeq "supervisor approves" "$(echo "$R" | J .ok)" "true"
ckeq "original evaluation retained as superseded" "$(PQ "SELECT status FROM trial_evaluations WHERE id='$EVAL_ID'")" "superseded"
TECH2='{"balance":7,"footwork":7,"timing":8,"shot_execution":7,"shot_selection":7,"fielding":7}'
R=$(post /staff/eval/submit "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"technical\":$TECH2}")
ckeq "re-score after approval = 67.54" "$(echo "$R" | J .evaluation.totalScore)" "67.54"
ckeq "both evaluations kept in history" "$(PQ "SELECT count(*) FROM trial_evaluations WHERE registration_id='$REG_ID'")" "2"

echo "== concurrency probes (post-lock storm) =="
for i in 1 2 3 4 5; do
  post /staff/eval/attempt "$EVAL_T" "{\"allocationId\":\"$ALLOC_ID\",\"discipline\":\"batting\",\"outcome\":\"MISS\"}" >"/tmp/race_a$i.json" &
done
wait
RACE_409=0; for i in 1 2 3 4 5; do grep -q 'locked' "/tmp/race_a$i.json" && RACE_409=$((RACE_409+1)); done
ckeq "parallel post-lock attempts all refused" "$RACE_409" "5"
ckeq "valid attempt count frozen at 6" "$(PQ "SELECT count(*) FROM trial_attempts WHERE allocation_id='$ALLOC_ID' AND discipline='batting' AND is_valid=true")" "6"
ckeq "still exactly one submitted evaluation" "$(PQ "SELECT count(*) FROM trial_evaluations WHERE registration_id='$REG_ID' AND status='submitted'")" "1"

echo "== rubric override settings (HEAD_ASSESSOR only) =="
HEAD_T=$(mk_token head@e2e HEAD_ASSESSOR '["delhi"]')
GOOD_RUB='{"value":{"roles":{"batsman":{"objective":[{"discipline":"batting","weight":50}],"technical":[{"key":"balance","weight":50}]}}}}'
BAD_RUB='{"value":{"roles":{"batsman":{"objective":[{"discipline":"batting","weight":55}],"technical":[{"key":"balance","weight":50}]}}}}'
CODE=$(curl -s -o /tmp/rub1.json -w '%{http_code}' -X PUT "$API/settings/admin/trial_rubrics_v1" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $HEAD_T" -d "$GOOD_RUB")
ckeq "HEAD_ASSESSOR saves rubric override (200)" "$CODE" "200"
CODE=$(curl -s -o /tmp/rub2.json -w '%{http_code}' -X PUT "$API/settings/admin/trial_rubrics_v1" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $HEAD_T" -d "$BAD_RUB")
ckeq "weights not summing 100 rejected (400)" "$CODE" "400"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API/settings/admin/trial_rubrics_v1" -H "Content-Type: application/json" -H "x-bcpl-admin-token: $EVAL_T" -d "$GOOD_RUB")
ckeq "TRIAL_EVALUATOR cannot edit rubrics (403)" "$CODE" "403"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$API/settings/admin/trial_rubrics_v1" -H "x-bcpl-admin-token: $HEAD_T")
ckeq "HEAD_ASSESSOR reads rubric override (200)" "$CODE" "200"

echo "== supervisor counters & audit =="
R=$(get /staff/supervisor/today "$SUP_T")
ckeq "counters respond" "$(echo "$R" | jq '.counters | has("checked_in_today")')" "true"
AUDITS=$(PQ "SELECT count(*) FROM audit_logs WHERE action LIKE 'trial.%' AND created_at > now() - interval '10 minutes'")
[ "${AUDITS:-0}" -ge 8 ] && ok "audit trail written ($AUDITS trial.* entries)" || bad "audit trail thin ($AUDITS)"

echo
echo "RESULT: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = "0" ]
