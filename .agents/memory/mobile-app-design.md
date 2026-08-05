---
name: Mobile app design system
description: Owner-approved direction for bcpl-mobile UI and link behavior
---
- Owner REJECTED navy+orange in the app twice ("outdated/नकली, website से color मत उठाओ"). App palette is now midnight-violet #0B0813 / cards #161124 with hot-pink #FF1A75 + electric-cyan #00E5FF accents (hooks/useColors.ts is the source). NEVER repaint the app in website navy/gold; website keeps its own LIGHTENED navy V3.
- **Rule:** no link in the app may open the external browser. Use WebBrowser.openBrowserAsync (in-app sheet) for website/legal/media links; wa.me/tel/mailto stay via Linking.
- **Why:** owner said twice "कोई भी link website पर लेकर न जाए".
- Registration countdown chip on home hero counts to REG_CLOSE_AT (2027-02-28 IST) in app/(tabs)/index.tsx — keep in sync with the real Season-5 window.
- Count-up stats animation is owner-requested; entrance reveal/scroll-fade still banned.
