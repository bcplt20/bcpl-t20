---
name: Journey gating parity
description: Mobile Journey must mirror the website's single-cursor deriveStep verbatim — independent booleans diverge.
---

The website portal (PlayerProfile) derives the player's next action with ONE single-cursor `deriveStep()` plus an 11-node `journeyNodes()` timeline where exactly one node is active. The mobile app originally re-derived UI from independent booleans (showVideoStep, showKycCta, …) which disagreed — a paid-no-video player saw a KYC CTA and no video step.

**Rule:** any client showing the player journey must copy the website's `deriveStep` branch order and status literals verbatim (paid → upload_video; KYC unreachable before phase1Status='selected'; legacy carryover = selected + fees waived). Never re-model gating as separate booleans.

**Testing recipe (Expo web):** inject localStorage key `bcpl_mobile_auth_v1` = `{token, user:{id,name,phone}}` (mint player JWT, impossible phone) on the Expo dev domain, then open `/journey`. Seed a throwaway user+registration row, delete after.
