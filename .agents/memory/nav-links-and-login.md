---
name: Website nav links & login entry
description: How internal navigation and the login entry point must be wired in the BCPL website (wouter base, global login modal)
---

# Internal links: always wouter `Link`, never plain root-relative `<a>`

The website mounts under `WouterRouter base={BASE_URL}` (dev base `/bcpl-website`, prod `/`). Plain `<a href="/teams">` escapes the base path in dev preview (full page load to the wrong URL). Shared components (SiteHeader, BCPLFooter) and page-internal links must use wouter `Link` (base-aware, SPA nav) or `navigate()` from `useLocation`.

**Why:** plain anchors kept sneaking in during rewrites; they work in prod (base `/`) so the breakage only shows in dev preview — easy to miss.

**How to apply:** any `href="/..."` on an internal route in website JSX is a bug unless it's `Link`, or an `<a>` built from `import.meta.env.BASE_URL` (full-reload cases like NavUser's profile link).

# Login entry point: global modal, not a route

Login is NOT a page. `NavUser` (header) and any other login trigger must call `openLoginModal()` from `lib/auth` — a `LoginModal` is mounted globally in App.tsx. `/register#login` is a dead pattern: Registration has no hash listener. For logged-in users, footer/header login entries should route to `/profile` instead (`getSession()` truthiness; note: helper `isAuthenticated()` lives in `lib/api`, while `getSession/openLoginModal` live in `lib/auth`).

# Homepage i18n

Homepage + header/footer use `useLang()`/`t(en,hi)` from `lib/i18n` (LangProvider in App, localStorage key `bcpl_lang`, default EN). Other pages adopt progressively — new homepage-adjacent UI must go through `t()`.
