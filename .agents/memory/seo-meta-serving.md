---
name: SEO meta serving architecture
description: How per-page meta/OG tags, sitemap.xml, robots.txt and the GSC tag are actually served in prod (nginx @app fallback → Express HTML injection)
---

# SEO meta serving

**The rule:** prod nginx serves the SPA statically; anything that must appear in raw HTML
(view-source, WhatsApp/FB previews, Google verification tag) CANNOT come from React.
Page requests fall back (`try_files $uri $uri/ @app`) to Express, which serves the built
`index.html` with per-path title/description/OG/canonical/GSC tags injected by regex.

**Why:** share-preview bots and GSC's tag crawler don't run JS. Client-side head
injection alone silently fails those acceptance checks.

**How to apply:**
- Meta/OG/head changes that crawlers must see → do them in the api-server HTML injector
  (routes/seo.ts, `seoHtmlMiddleware`), not only in the React `SiteMeta` component.
- The injector regex-replaces tags in the BUILT index.html — if index.html head tags are
  renamed/restructured, keep the injector's regexes in sync.
- Anything at domain root (sitemap.xml, verification files, webhooks at /) → either a
  static file in `artifacts/bcpl-website/public/` (nginx serves it, beats @app) or an
  Express route wired in app.ts BEFORE the HTML fallback middleware.
- Static file in public/ SHADOWS the Express route of the same path in prod (try_files
  wins). Don't create both (e.g. sitemap.xml must NOT exist as a static file — it's dynamic).
- The live EC2 nginx file contains certbot SSL lines — never tell the owner to overwrite
  it with deploy/nginx.conf; give the two marked hand-edits + `nginx -t` + reload instead.
- Replacement strings in the injector use replacer FUNCTIONS (`() => value`) — `$` in
  admin-entered titles would corrupt output with plain string replacements.
- Meta reads are cached in-process 30s (invalidated on admin save); with multiple PM2
  workers a save can take up to 30s to show on all workers — that's accepted.
