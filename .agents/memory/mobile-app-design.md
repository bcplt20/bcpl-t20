---
name: Mobile app design system
description: Owner-approved direction for bcpl-mobile UI, themes, and link behavior
---
- App design source of truth = OWNER'S OWN HTML mockup at attached_assets/bcpl-app-ui-v4_1785973344504.html ("v4"). He rejected two agent-invented palettes before this (website navy, then plain pink/cyan). Any future restyle must start from this file, not from taste.
- v4 system: violet #7C5CFF / magenta #FF3DA6 / cyan #00DCF5 / lime #B6FF3C accents; primary gradient #5B2BF0→#9B2FF0→#FF3DA6; TWO user-togglable themes — "stadium" dark (bg #101433) and light "daylight" (bg #F4F1FD), persisted in AsyncStorage; fonts Bricolage Grotesque (display) / Plus Jakarta Sans (body) / Space Grotesk (numbers); floating tab bar with center gradient Register FAB; team-color-washed vs-cards.
- Mockup's CONTENT is fake (company teams, "register your team", 160 teams) — always keep real BCPL copy/data; only copy the design.
- **Why:** owner said "जरूरी नहीं app का color website जैसा हो" and supplied his own design after rejecting mine.
- **Rule:** no link may open the external browser — WebBrowser.openBrowserAsync for web/legal/media links; wa.me/tel/mailto via Linking.
- Reg countdown chip counts to 2027-02-28 IST; count-up stats OK; entrance reveal/scroll-fade still banned; no emojis.
- RN-web trap: `{str && <X/>}` with empty-string renders a text node inside View → "Unexpected text node" error; use `!!str &&`.
- Home hero = auto-sliding banner carousel fed by public /api/app-banners (admin-managed via settings key app_banners, CONTENT_TEAM role); app keeps a hardcoded fallback list. Accent comes as a NAME (violet/magenta/cyan/lime/amber) — map to hex client-side; the registration banner is detected by ctaHref === '/register' (never by id).
- Policy/info pages are fully native in-app (curated content module ported from website pages — scraping React pages leaks widget/CTA junk, always curate by hand); media tab renders gallery+videos in-app (YouTube via WebView), never redirects to the site.
