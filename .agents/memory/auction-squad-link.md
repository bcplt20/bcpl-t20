---
name: Auction ↔ registration link convention
description: Squad entries link back to registrations via stats.regId; server enforces one-squad-per-registration
---

# Auction ↔ registration link convention

**Rule:** When a player is sold in the admin auction, the squad entry (`team_players`) stores the source registration's UUID in its `stats` json as `stats.regId` (plus `stats.regNumber` for display). The teams API rejects (409) any squad insert whose `stats.regId` already exists in another squad entry, and the auction pool excludes registrations whose id appears as a `stats.regId` in any squad.

**Why:** Prevents double-selling the same player (page reload or two admin tabs) without a schema migration — chosen July 2026 because the prod migration path (EC2/RDS) is manual and risky for column adds. `auctionPrice` is also validated digits-only at the API so budget math (`Number(auctionPrice)`) stays correct.

**How to apply:** Any future code that adds players to squads from registrations must set `stats.regId`. If a proper `source_reg_id` column is ever added, migrate the json values and keep the uniqueness guarantee — client-side guards alone are not enough.
