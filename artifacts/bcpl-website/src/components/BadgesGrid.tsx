import React, { useEffect, useState } from "react";
import { getBadges, type BadgeItem } from "../lib/api";
import { useLang } from "../lib/i18n";
import {
  IcoUser, IcoVideo, IcoFlag, IcoCard, IcoShield,
  IcoStar, IcoMegaphone, IcoUsers, IcoMedal,
} from "../lib/icons";

/**
 * Achievement badges grid on the player dashboard. 9 computed badges from
 * GET /api/user/badges — earned ones render colourful, locked ones dimmed.
 * Self-fetches; renders nothing until the API responds for a logged-in user.
 */
const ICONS: Record<string, (p: { size?: number; style?: React.CSSProperties }) => React.ReactElement> = {
  "user-check": IcoUser,
  "video": IcoVideo,
  "flag": IcoFlag,
  "credit-card": IcoCard,
  "shield-check": IcoShield,
  "vote": IcoStar,
  "megaphone": IcoMegaphone,
  "user-plus": IcoUsers,
  "users": IcoUsers,
};

export function BadgesGrid() {
  const { t, lang } = useLang();
  const [badges, setBadges] = useState<BadgeItem[] | null>(null);

  useEffect(() => {
    let on = true;
    getBadges()
      .then((r) => { if (on) setBadges(r.badges); })
      .catch(() => { /* logged out / server hiccup — hide section */ });
    return () => { on = false; };
  }, []);

  if (!badges || badges.length === 0) return null;
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div style={{
      background: "#1F3652", border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 14, padding: "22px 20px", marginBottom: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
        <IcoMedal size={20} style={{ color: "#F5B301" }} />
        <span style={{
          fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 16,
          color: "rgba(255,255,255,0.94)",
        }}>{t("Your Badges", "आपके बैज")}</span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 16 }}>
        {t(`${earnedCount} of ${badges.length} unlocked`, `${badges.length} में से ${earnedCount} अनलॉक`)}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 12,
      }}>
        {badges.map((b) => {
          const Icon = ICONS[b.icon] ?? IcoMedal;
          const title = lang === "hi" && b.titleHi ? b.titleHi : b.title;
          const desc = lang === "hi" && b.descHi ? b.descHi : b.desc;
          return (
            <div key={b.id} title={desc} style={{
              textAlign: "center", padding: "14px 8px 12px", borderRadius: 12,
              background: b.earned ? "rgba(245,179,1,0.10)" : "rgba(255,255,255,0.03)",
              border: b.earned ? "1px solid rgba(245,179,1,0.4)" : "1px solid rgba(255,255,255,0.08)",
              opacity: b.earned ? 1 : 0.5,
            }}>
              <div style={{
                width: 44, height: 44, margin: "0 auto 8px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: b.earned ? "linear-gradient(135deg,#FF7A29,#F5B301)" : "rgba(255,255,255,0.06)",
                color: b.earned ? "#12233F" : "rgba(255,255,255,0.55)",
              }}>
                <Icon size={22} style={{ color: "currentColor" }} />
              </div>
              <div style={{
                fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 11.5,
                lineHeight: 1.25, color: b.earned ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.7)",
              }}>{title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
