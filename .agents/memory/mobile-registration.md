---
name: Mobile in-app registration
description: How the Expo app replicates the website Phase-1 registration + payment
---
- Flow: send-otp/verify-otp purpose 'register' (409 ALREADY_REGISTERED → fall back to purpose 'login') → POST /register/phase1 → /payment/phase1/create (consent versions hardcoded, must stay in sync with website legalMeta CONSENT_VERSIONS, currently 2.1/2.1) → Cashfree HOSTED checkout via `https://payments.cashfree.com/order/#<paymentSessionId>` opened in browser (no native SDK) → manual "I have paid" button → /payment/phase1/verify {orderId}.
- **Why hosted URL:** create's return_url is server-generated from SITE_URL; app can't set a deep link, so verify is app-driven; pending orderId persisted in AsyncStorage `bcpl_pending_phase1_order_v1` for recovery on remount.
- phase1Status vocabulary: 'pending' = registered-but-unpaid; 'payment_done'+ = paid. Never invent statuses (see api-field-traps).
- CORS: native (no Origin) and *.replit.dev allowed by API — no server change needed.
- Pay WebView must hand off non-http(s) URLs (upi://, gpay://, phonepe://, intent://…) to Linking.openURL — otherwise tapping UPI on Cashfree checkout silently does nothing; intent:// links rebuilt from scheme= param. Return-URL interception check runs FIRST.
