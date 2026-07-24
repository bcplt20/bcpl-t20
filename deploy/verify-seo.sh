#!/bin/bash
# ============================================================
# BCPL T20 — DEPLOY KE BAAD SEO CHECK  (verify-seo.sh)
#
# Deploy hone ke baad YE EK command chalao. Ye khud live site
# (https://bcplt20.com) ko khol kar check karta hai ki:
#   1. Har page ka apna <title> aa raha hai (SEO text serve ho raha hai)
#   2. Google rich-result ka JSON-LD (Organization / FAQ / Match) laga hai
#
# Chalane ke liye:
#     bash deploy/verify-seo.sh
#
# Ya kisi aur site pe check karna ho:
#     bash deploy/verify-seo.sh https://staging.bcplt20.com
#
# Har line PASS ya FAIL likhegi. Ant me total PASS/FAIL count.
# Agar sab PASS -> exit code 0. Ek bhi FAIL -> exit code 1.
# ============================================================
set -u

BASE="${1:-https://bcplt20.com}"
BASE="${BASE%/}"   # trailing slash hatao

PASS=0
FAIL=0

# curl options: follow redirects, 20s timeout, crawler-jaisa User-Agent
# (Googlebot ke jaisa) taaki production nginx wahi HTML de jo crawler ko milta hai.
CURL="curl -sS -L --max-time 20 -A Mozilla/5.0 (compatible; BCPLSeoVerify/1.0)"

# ── Ek page fetch karo, ek marker (string) uske HTML me dhoondo ──
# Args: <path> <human-readable-marker-label> <grep-string>
check() {
  local pth="$1" label="$2" needle="$3"
  local url="${BASE}${pth}"
  local body
  body="$($CURL "$url" 2>/dev/null)"
  if [ -z "$body" ]; then
    echo "FAIL  ${pth}  — page khali/aaya hi nahi (network ya server down?)  [${label}]"
    FAIL=$((FAIL + 1))
    return
  fi
  if printf '%s' "$body" | grep -qF -- "$needle"; then
    echo "PASS  ${pth}  — ${label}"
    PASS=$((PASS + 1))
  else
    echo "FAIL  ${pth}  — ${label}  (nahi mila: \"${needle}\")"
    FAIL=$((FAIL + 1))
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BCPL SEO CHECK  →  ${BASE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1) Har page ka title serve ho raha hai (SEO text live hai) ──
# Marker = us page ke <title> ka ek pakka hissa. Agar admin ne title
# badla ho to bhi "BCPL" har title me rehta hai, isliye phrase-level
# markers use kiye hain jo default copy me maujood hain.
echo "— Page title / meta (SEO text) —"
check "/"             "Home ka title aa raha hai"        "<title>"
check "/faq"          "FAQ page ka title"                "BCPL T20 FAQ"
check "/about"        "About page ka title"              "About BCPL T20"
check "/match-center" "Match Center ka title"            "BCPL T20 Live Scores"
check "/schedule"     "Schedule page ka title"           "BCPL T20 Match Schedule"
check "/teams"        "Teams page ka title"              "BCPL T20 Teams"
check "/register"     "Register page ka title"           "Register for BCPL T20"
echo ""

# ── 2) Google rich-result JSON-LD laga hai ──
echo "— Google rich-result structured data (JSON-LD) —"
check "/"             "Organization JSON-LD (logo/knowledge panel)"  "\"@type\":\"Organization\""
check "/faq"          "FAQPage JSON-LD (FAQ dropdowns)"              "\"@type\":\"FAQPage\""
check "/match-center" "SportsEvent JSON-LD (match details)"         "application/ld+json"
echo ""

# ── 3) Canonical URL inject ho raha hai ──
echo "— Canonical URL —"
check "/faq"          "FAQ ka canonical link"            "rel=\"canonical\""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULT:  ${PASS} PASS,  ${FAIL} FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ SAB THEEK HAI — live site SEO text + rich data de raha hai."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "  ❌ Kuch check FAIL hue. Upar 'FAIL' wali line dekho."
  echo "     Aksar wajah: deploy adhoora, ya nginx @app fallback"
  echo "     (deploy/fix-nginx.sh) abhi tak laga nahi."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
