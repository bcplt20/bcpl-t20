import { useState, useEffect, useRef } from "react";
import {
  fetchAppBannersAdmin, saveAppBannersAdmin,
  BANNER_ACCENTS, type AppBanner, type BannerAccent,
} from "../api/appBannersApi";

/* App promo banners live on the SERVER (site_settings key "app_banners") so
   the mobile app reads them via GET /api/app-banners. This view lists / adds /
   edits / deletes / toggles / reorders them. Save goes through the shared
   adminReq plumbing (appBannersApi) — never a baked-in key. */

const ACCENT_HEX: Record<BannerAccent, string> = {
  violet:  "#8B5CF6",
  magenta: "#EC4899",
  cyan:    "#06B6D4",
  lime:    "#84CC16",
  amber:   "#F59E0B",
};

type Form = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  accent: BannerAccent;
  active: boolean;
};

const EMPTY_FORM: Form = {
  title: "", subtitle: "", ctaLabel: "", ctaHref: "", accent: "violet", active: true,
};

const inp: React.CSSProperties = {
  width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8,
  border: "1px solid #33436B", background: "#1F2B49", color: "#E2E8F0",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 };

export default function AppBannersView() {
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [loaded,  setLoaded]  = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [form,    setForm]    = useState<Form>(EMPTY_FORM);

  async function load() {
    setLoadErr("");
    try {
      const r = await fetchAppBannersAdmin();
      const list = r.value && Array.isArray(r.value.banners) ? r.value.banners : [];
      setBanners([...list].sort((a, b) => a.order - b.order));
      setLoaded(true);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load app banners");
      setLoaded(true);
    }
  }
  useEffect(() => { void load(); }, []);

  /* Single-flight coalescing save: one PUT in flight, always carrying the
     LATEST list. On failure we resync from the server. `order` is reassigned
     from array position on every save so it stays contiguous. */
  const pendingRef  = useRef<AppBanner[] | null>(null);
  const inflightRef = useRef(false);

  async function persist(next: AppBanner[]) {
    const ordered = next.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(ordered);          // optimistic UI
    pendingRef.current = ordered; // latest snapshot wins
    if (inflightRef.current) return;
    inflightRef.current = true;
    setSaving(true);
    try {
      while (pendingRef.current !== null) {
        const batch = pendingRef.current;
        pendingRef.current = null;
        await saveAppBannersAdmin({ banners: batch });
      }
    } catch (e) {
      pendingRef.current = null;
      alert("Could not save to server: " + (e instanceof Error ? e.message : "unknown error"));
      await load();
    } finally {
      inflightRef.current = false;
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowAdd(false);
  }

  function toBanner(f: Form, id: string, order: number): AppBanner {
    const b: AppBanner = { id, title: f.title.trim(), active: f.active, order, accent: f.accent };
    if (f.subtitle.trim()) b.subtitle = f.subtitle.trim();
    if (f.ctaLabel.trim()) b.ctaLabel = f.ctaLabel.trim();
    if (f.ctaHref.trim())  b.ctaHref  = f.ctaHref.trim();
    return b;
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editId) {
      void persist(banners.map(b => b.id === editId ? toBanner(form, editId, b.order) : b));
    } else {
      const id = "b-" + Date.now();
      void persist([...banners, toBanner(form, id, banners.length + 1)]);
    }
    resetForm();
  }

  function handleEdit(b: AppBanner) {
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      ctaLabel: b.ctaLabel ?? "",
      ctaHref: b.ctaHref ?? "",
      accent: b.accent ?? "violet",
      active: b.active,
    });
    setEditId(b.id);
    setShowAdd(true);
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete banner "${title}"? This cannot be undone.`)) return;
    void persist(banners.filter(b => b.id !== id));
  }

  function toggleActive(id: string) {
    void persist(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= banners.length) return;
    const next = [...banners];
    [next[index], next[j]] = [next[j], next[index]];
    void persist(next);
  }

  const card: React.CSSProperties = {
    background: "#2C3A5E", border: "1px solid #33436B", borderRadius: 16, padding: "20px 22px",
  };
  const activeCount = banners.filter(b => b.active).length;

  if (!loaded) {
    return (
      <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ ...card, textAlign: "center", padding: 40, color: "#94A3C4" }}>Loading app banners…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {/* Load error */}
      {loadErr && (
        <div style={{ ...card, borderColor: "#EF444450", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>Could not load app banners: {loadErr}</span>
          <button onClick={() => { setLoaded(false); void load(); }}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #EF444440", background: "transparent", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↻ Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Banners", value: banners.length, color: "#3B82F6", icon: "🖼" },
          { label: "Active (in app)", value: activeCount, color: "#10B981", icon: "✅" },
          { label: "Inactive", value: banners.length - activeCount, color: "#94A3C4", icon: "💤" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ ...lbl, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {saving && <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 700 }}>Saving…</span>}
        {!saving && !loadErr && <span style={{ color: "#8593B3", fontSize: 11 }}>✓ Synced — order here = order in the app</span>}
        <button onClick={() => { resetForm(); setShowAdd(s => !s); }}
          style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {showAdd && !editId ? "✕ Cancel" : "+ Add Banner"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 18, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FF6B00", marginBottom: 18 }}>
            {editId ? "✏ Edit Banner" : "New Banner"}
          </div>

          {/* Recommended image size — the app renders each banner in a full-width
              card 200px tall (screen width − 32px margins). At ~2× device pixel
              density that is roughly 16:9, so a 1200×675 px (16:9) image fills it
              crisply on every phone. */}
          <div style={{ background: "#1F2B49", border: "1px solid #33436B", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#C3CEE3", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#F59E0B" }}>Recommended banner image size: 1200 × 675 px (16:9).</span>{" "}
            The app shows each banner in a full-width card ~200px tall. Use a 16:9 image so it stays sharp on all phones; keep important text/logos inside the centre-safe area (avoid the outer ~10% edges).
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>TITLE *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. ₹299 +GST" style={inp} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>SUBTITLE</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Short supporting line" style={inp} />
            </div>
            <div>
              <label style={lbl}>CTA LABEL</label>
              <input value={form.ctaLabel} onChange={e => setForm(f => ({ ...f, ctaLabel: e.target.value }))}
                placeholder="e.g. Register Now" style={inp} />
            </div>
            <div>
              <label style={lbl}>CTA LINK</label>
              <input value={form.ctaHref} onChange={e => setForm(f => ({ ...f, ctaHref: e.target.value }))}
                placeholder="e.g. /register" style={inp} />
            </div>
            <div>
              <label style={lbl}>ACCENT</label>
              <select value={form.accent} onChange={e => setForm(f => ({ ...f, accent: e.target.value as BannerAccent }))}
                style={inp}>
                {BANNER_ACCENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#C3CEE3", fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active (shown in app)
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetForm}
              style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #33436B", background: "transparent", color: "#A6B3D0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!form.title.trim()}
              style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: form.title.trim() ? "linear-gradient(135deg, #FF6B00, #FF8C40)" : "#33436B", color: form.title.trim() ? "#fff" : "#94A3C4", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {editId ? "✓ Save Changes" : "✓ Add Banner"}
            </button>
          </div>
        </div>
      )}

      {/* Banner list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {banners.length === 0 && !loadErr && (
          <div style={{ ...card, textAlign: "center", padding: 40, color: "#8593B3" }}>
            No banners yet. Click "+ Add Banner" to add your first one.
          </div>
        )}

        {banners.map((b, i) => {
          const hex = ACCENT_HEX[b.accent ?? "violet"];
          return (
            <div key={b.id} style={{ ...card, padding: "12px 14px", borderLeft: `3px solid ${hex}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Reorder */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: i === 0 ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: i === 0 ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▲</button>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#FF6B00" }}>#{i + 1}</span>
                  <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} title="Move down"
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: i === banners.length - 1 ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: i === banners.length - 1 ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▼</button>
                </div>

                {/* Accent swatch */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: hex, flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{b.title}</div>
                  {b.subtitle && <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 3 }}>{b.subtitle}</div>}
                  <div style={{ fontSize: 11, color: "#8593B3", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {b.ctaLabel && <span>🔘 {b.ctaLabel}{b.ctaHref ? ` → ${b.ctaHref}` : ""}</span>}
                    <span>🎨 {b.accent ?? "violet"}</span>
                  </div>
                </div>

                {/* Active toggle */}
                <button onClick={() => toggleActive(b.id)} title={b.active ? "Active" : "Inactive"}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: b.active ? "#10B981" : "#33436B", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: b.active ? 22 : 4, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleEdit(b)}
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 7, padding: "5px 12px", color: "#A6B3D0", fontSize: 11, cursor: "pointer" }}>✏ Edit</button>
                  <button onClick={() => handleDelete(b.id, b.title)}
                    style={{ background: "none", border: "1px solid #EF444440", borderRadius: 7, padding: "5px 12px", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
