---
name: Mobile app design system
description: Owner-approved direction for bcpl-mobile UI and link behavior
---
- Owner explicitly compared to Dream11 and rejected "flat navy" as dull; the vibrant pass (deep bg #070C1A, cards #121F3D, glowing match cards, gold/silver/bronze medallions, floating pill tab bar) is the new baseline. Website stays on the LIGHTENED navy V3 — the two palettes intentionally differ.
- **Rule:** no link in the app may open the external browser. Use WebBrowser.openBrowserAsync (in-app sheet) for website/legal/media links; wa.me/tel/mailto stay via Linking.
- **Why:** owner said twice "कोई भी link website पर लेकर न जाए".
- Registration countdown chip on home hero counts to REG_CLOSE_AT (2027-02-28 IST) in app/(tabs)/index.tsx — keep in sync with the real Season-5 window.
- Count-up stats animation is owner-requested; entrance reveal/scroll-fade still banned.
