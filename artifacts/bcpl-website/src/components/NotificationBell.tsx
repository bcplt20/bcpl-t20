import { useEffect, useRef, useState } from "react";
import { getNotifications, markNotificationsRead, type InboxItem } from "../lib/api";
import { useLang } from "../lib/i18n";
import { IcoBell } from "../lib/icons";

/**
 * Header notification bell (logged-in only). Polls the inbox every 60s,
 * shows an unread-count dot and a dropdown panel with the latest items.
 * Marking read is a fire-and-forget POST; the list re-fetches after.
 *
 * Renders nothing when the user is logged out (parent gates on `user`).
 */
function timeAgo(t: (en: string, hi: string) => string, iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return t("just now", "अभी");
  const m = Math.floor(s / 60);
  if (m < 60) return t(`${m}m ago`, `${m} मिनट पहले`);
  const h = Math.floor(m / 60);
  if (h < 24) return t(`${h}h ago`, `${h} घंटे पहले`);
  const d = Math.floor(h / 24);
  return t(`${d}d ago`, `${d} दिन पहले`);
}

export function NotificationBell() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = () => {
    getNotifications()
      .then((r) => { setItems(r.notifications); setUnread(r.unreadCount); })
      .catch(() => { /* logged out / server hiccup — keep prior state */ });
  };

  // Poll every 60s (staleTime-equivalent) while mounted.
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      markNotificationsRead().then(() => { setUnread(0); load(); }).catch(() => {});
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={toggle}
        aria-label={t("Notifications", "सूचनाएँ")}
        style={{
          position: "relative", background: "transparent", border: "none",
          color: "rgba(255,255,255,0.9)", cursor: "pointer", padding: 6,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <IcoBell size={22} style={{ color: "currentColor" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0, minWidth: 16, height: 16,
            padding: "0 4px", background: "#FF5A2C", color: "#fff",
            borderRadius: 8, fontSize: 10, fontWeight: 900, lineHeight: "16px",
            fontFamily: "Montserrat,sans-serif", textAlign: "center",
          }}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0, width: 320, maxWidth: "88vw",
          background: "#1B2E52", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 14,
          boxShadow: "0 18px 48px rgba(0,0,0,.45)", zIndex: 400, overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 13,
            letterSpacing: ".06em", color: "rgba(255,255,255,0.92)",
          }}>
            {t("NOTIFICATIONS", "सूचनाएँ")}
          </div>
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: "26px 16px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                {t("You're all caught up.", "कोई नई सूचना नहीं है।")}
              </div>
            ) : items.map((n) => (
              <div key={n.id} style={{
                padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: n.readAt ? "transparent" : "rgba(255,122,41,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!n.readAt && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF7A29", flex: "0 0 auto" }} />}
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: "rgba(255,255,255,0.94)" }}>{n.title}</span>
                </div>
                {n.body && <div style={{ marginTop: 3, fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>{n.body}</div>}
                <div style={{ marginTop: 5, fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{timeAgo(t, n.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
