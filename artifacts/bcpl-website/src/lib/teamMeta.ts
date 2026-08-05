import { useEffect, useState } from "react";
import { getTeams } from "./api";

/* ── Shared team meta (colors + logos), module-cached so every page/card
   reuses ONE fetch and logos stay warm in the browser cache (no re-flash). */

export const BALL_LOGO = import.meta.env.BASE_URL + "bcpl-assets/bcpl-ball-transparent.png";

const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

const norm = (name: string) => (name || "").trim().toLowerCase();

export type TeamMeta = { colors: Record<string, string>; logos: Record<string, string> };

let cache: TeamMeta | null = null;
let inflight: Promise<TeamMeta> | null = null;
const listeners = new Set<(m: TeamMeta) => void>();

function load(): Promise<TeamMeta> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = getTeams(5).then(d => {
      const colors: Record<string, string> = {};
      const logos: Record<string, string> = {};
      (d.teams ?? []).forEach((t: any) => {
        const k = norm(t.name);
        if (t.color) colors[k] = t.color;
        if (t.logoUrl) logos[k] = asset(t.logoUrl);
      });
      cache = { colors, logos };
      /* Pre-warm logo images once so cards never show a logo "pop-in". */
      Object.values(logos).forEach(src => { const img = new Image(); img.src = src; });
      const ball = new Image(); ball.src = BALL_LOGO;
      listeners.forEach(fn => fn(cache!));
      return cache;
    }).catch(() => {
      inflight = null;
      return { colors: {}, logos: {} };
    });
  }
  return inflight;
}

export function useTeamMeta() {
  const [meta, setMeta] = useState<TeamMeta>(cache ?? { colors: {}, logos: {} });
  useEffect(() => {
    if (cache) { setMeta(cache); return; }
    const fn = (m: TeamMeta) => setMeta(m);
    listeners.add(fn);
    load();
    return () => { listeners.delete(fn); };
  }, []);
  const colorOf = (team: string) => meta.colors[norm(team)] || "#7C8BA5";
  const logoOf = (team: string) => meta.logos[norm(team)] || "";
  return { colorOf, logoOf };
}
