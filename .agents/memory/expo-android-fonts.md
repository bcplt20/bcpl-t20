---
name: Expo Android icon/font loading
description: Android Expo Go showed tofu boxes for all icons and fallback fonts
---
Rule: preload icon fonts explicitly in the root `useFonts` call (`...Feather.font, ...Ionicons.font` from @expo/vector-icons) alongside Google fonts, and gate rendering on fontsLoaded.

**Why:** On Android Expo Go the @expo/vector-icons font was not loaded before render — every icon rendered as a tofu/placeholder box and text fell back to system fonts (owner screenshots Aug '26). iOS masked the issue.

**How to apply:** Any new icon family used in bcpl-mobile must be added to the useFonts preload in app/_layout.tsx. If Android shows tofu again, check font preload first, not the icon code.
