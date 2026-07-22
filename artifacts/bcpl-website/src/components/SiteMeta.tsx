import { useEffect } from "react";
import { useLocation } from "wouter";
import { getSiteMetaCached } from "@/lib/seoApi";

/**
 * Route-level meta injector for the SPA.
 *
 * In production, crawlers already get server-injected meta (the API server
 * serves index.html with per-page tags). This component keeps the browser in
 * sync while users navigate: document.title, description, OG tags and the
 * canonical link update on every route change. Silent no-op on failure.
 */

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function SiteMeta() {
  const [location] = useLocation();

  useEffect(() => {
    let alive = true;
    getSiteMetaCached()
      .then((meta) => {
        if (!alive || !meta) return;
        const path = location.replace(/\/+$/, "") || "/";
        const page = meta.pages.find((p) => p.path === path);
        if (!page) return; // player-flow/admin pages keep whatever is set
        const url = meta.siteOrigin + (page.path === "/" ? "" : page.path);

        document.title = page.title;
        setMeta("name", "description", page.description);
        setMeta("property", "og:title", page.title);
        setMeta("property", "og:description", page.description);
        setMeta("property", "og:image", page.ogImage);
        setMeta("property", "og:url", url);
        setMeta("name", "twitter:title", page.title);
        setMeta("name", "twitter:description", page.description);
        setMeta("name", "twitter:image", page.ogImage);

        let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "canonical";
          document.head.appendChild(link);
        }
        link.href = url;

        if (meta.gscCode) setMeta("name", "google-site-verification", meta.gscCode);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [location]);

  return null;
}
