import { useState, useEffect, useRef } from "react";
import {
  fetchAppMediaAdmin, saveAppMediaAdmin, extractYoutubeId,
  MEDIA_KINDS, type AppMediaItem, type MediaKind,
} from "../api/appMediaApi";
import { adminGetSampleUploadUrl } from "../../lib/api";

/* App media lives on the SERVER (site_settings key "app_media") so the mobile
   app reads it via GET /api/app-media — SEPARATE from the website gallery.
   This view lists / adds / edits / deletes / toggles / reorders items. Photo
   uploads reuse the existing admin S3 flow (presign → PUT) and store the
   returned s3Key; the public endpoint presigns it at request time. Save goes
   through the shared adminReq plumbing — never a baked-in key. */

const KIND_HEX: Record<MediaKind, string> = {
  photo: "#3B82F6",
  video: "#EF4444",
  short: "#8B5CF6",
};
const KIND_ICON: Record<MediaKind, string> = {
  photo: "🖼",
  video: "🎬",
  short: "⚡",
};

type Form = {
  kind: MediaKind;
  title: string;
  url: string;       // external / pasted URL OR YouTube URL (for video/short)
  s3Key: string;     // set when a photo is uploaded via the S3 flow
  youtubeId: string; // auto-extracted from a YouTube URL
  thumbUrl: string;
  active: boolean;
};

const EMPTY_FORM: Form = {
  kind: "photo", title: "", url: "", s3Key: "", youtubeId: "", thumbUrl: "", active: true,
};

const inp: React.CSSProperties = {
  width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8,
  border: "1px solid #33436B", background: "#1F2B49", color: "#E2E8F0",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 };

export default function AppMediaView() {
  const [items,   setItems]   = useState<AppMediaItem[]>([]);
  const [loaded,  setLoaded]  = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [form,    setForm]    = useState<Form>(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoadErr("");
    try {
      const r = await fetchAppMediaAdmin();
      const list = r.value && Array.isArray(r.value.items) ? r.value.items : [];
      setItems([...list].sort((a, b) => a.order - b.order));
      setLoaded(true);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load app media");
      setLoaded(true);
    }
  }
  useEffect(() => { void load(); }, []);

  /* Single-flight coalescing save (same pattern as App Banners / Sponsors). */
  const pendingRef  = useRef<AppMediaItem[] | null>(null);
  const inflightRef = useRef(false);

  async function persist(next: AppMediaItem[]) {
    const ordered = next.map((it, i) => ({ ...it, order: i + 1 }));
    setItems(ordered);
    pendingRef.current = ordered;
    if (inflightRef.current) return;
    inflightRef.current = true;
    setSaving(true);
    try {
      while (pendingRef.current !== null) {
        const batch = pendingRef.current;
        pendingRef.current = null;
        await saveAppMediaAdmin({ items: batch });
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

  /* Photo upload via the existing admin S3 flow (presign → PUT). We store the
     returned s3Key; the public /api/app-media endpoint presigns it on read. */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (file.size > 25 * 1024 * 1024) { alert("Photo must be under 25 MB."); return; }
    setUploading(true);
    try {
      const { presignedUrl, s3Key } = await adminGetSampleUploadUrl(file.type, "cms");
      const put = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error("Upload failed (" + put.status + ")");
      // Uploaded photos are served via the presigned s3Key — clear any pasted URL.
      setForm(f => ({ ...f, s3Key, url: "" }));
    } catch (err) {
      alert("Photo upload failed: " + (err instanceof Error ? err.message : "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  /* When a YouTube URL is typed for a video/short, auto-extract the id. */
  function onUrlChange(v: string) {
    setForm(f => {
      const next = { ...f, url: v };
      if (f.kind === "video" || f.kind === "short") {
        const yt = extractYoutubeId(v);
        next.youtubeId = yt ?? "";
      }
      return next;
    });
  }

  function onKindChange(k: MediaKind) {
    setForm(f => {
      const next: Form = { ...f, kind: k };
      // Photos never carry a youtubeId; uploading only applies to photos.
      if (k === "photo") next.youtubeId = "";
      else next.s3Key = "";
      // Re-extract if switching to video/short with a YouTube URL already typed.
      if ((k === "video" || k === "short") && f.url) {
        next.youtubeId = extractYoutubeId(f.url) ?? "";
      }
      return next;
    });
  }

  function toItem(f: Form, id: string, order: number): AppMediaItem | null {
    const title = f.title.trim();
    if (!title) return null;
    const it: AppMediaItem = { id, kind: f.kind, title, active: f.active, order };
    const url = f.url.trim();
    if (f.kind === "photo") {
      if (f.s3Key) it.s3Key = f.s3Key;
      else if (url) it.url = url;
      else return null; // photo needs an uploaded key or a URL
      if (f.thumbUrl.trim()) it.thumbUrl = f.thumbUrl.trim();
    } else {
      // video / short
      const yt = f.youtubeId.trim();
      if (yt) it.youtubeId = yt;
      // keep a direct URL too when it isn't a YouTube link (self-hosted mp4)
      if (url && !yt) it.url = url;
      if (!yt && !url) return null; // needs a YouTube id or a direct URL
      if (f.thumbUrl.trim()) it.thumbUrl = f.thumbUrl.trim();
    }
    return it;
  }

  function handleSave() {
    if (editId) {
      const it = toItem(form, editId, items.find(i => i.id === editId)?.order ?? items.length + 1);
      if (!it) { alert("Please provide a title and a photo/URL or YouTube link."); return; }
      void persist(items.map(i => i.id === editId ? it : i));
    } else {
      const it = toItem(form, "m-" + Date.now(), items.length + 1);
      if (!it) { alert("Please provide a title and a photo/URL or YouTube link."); return; }
      void persist([...items, it]);
    }
    resetForm();
  }

  function handleEdit(it: AppMediaItem) {
    setForm({
      kind: it.kind,
      title: it.title,
      url: it.url ?? "",
      s3Key: it.s3Key ?? "",
      youtubeId: it.youtubeId ?? "",
      thumbUrl: it.thumbUrl ?? "",
      active: it.active,
    });
    setEditId(it.id);
    setShowAdd(true);
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    void persist(items.filter(i => i.id !== id));
  }

  function toggleActive(id: string) {
    void persist(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    void persist(next);
  }

  const card: React.CSSProperties = {
    background: "#2C3A5E", border: "1px solid #33436B", borderRadius: 16, padding: "20px 22px",
  };
  const activeCount = items.filter(i => i.active).length;

  if (!loaded) {
    return (
      <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ ...card, textAlign: "center", padding: 40, color: "#94A3C4" }}>Loading app media…</div>
      </div>
    );
  }

  const isPhoto = form.kind === "photo";

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
      {loadErr && (
        <div style={{ ...card, borderColor: "#EF444450", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>Could not load app media: {loadErr}</span>
          <button onClick={() => { setLoaded(false); void load(); }}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #EF444440", background: "transparent", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↻ Retry</button>
        </div>
      )}

      {/* Info */}
      <div style={{ ...card, borderColor: "#3B82F640", marginBottom: 18, padding: "12px 16px", color: "#C3CEE3", fontSize: 12 }}>
        <span style={{ color: "#3B82F6", fontWeight: 800 }}>📱 App-only</span>{" "}
        These items show in the mobile app's Photos &amp; Videos tab only — they are separate from the website gallery.
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Items", value: items.length, color: "#3B82F6", icon: "▤" },
          { label: "Active (in app)", value: activeCount, color: "#10B981", icon: "✅" },
          { label: "Inactive", value: items.length - activeCount, color: "#94A3C4", icon: "💤" },
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
          {showAdd && !editId ? "✕ Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 18, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FF6B00", marginBottom: 18 }}>
            {editId ? "✏ Edit Item" : "New Item"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>KIND</label>
              <select value={form.kind} onChange={e => onKindChange(e.target.value as MediaKind)} style={inp}>
                {MEDIA_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>TITLE *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Trial Day 1 — Delhi" style={inp} />
            </div>

            {/* Video / short: YouTube URL (auto-extract) or direct URL */}
            {!isPhoto && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>YOUTUBE URL or DIRECT VIDEO URL</label>
                <input value={form.url} onChange={e => onUrlChange(e.target.value)}
                  placeholder="https://youtu.be/… or https://…/clip.mp4" style={inp} />
                {form.youtubeId && (
                  <div style={{ fontSize: 11, color: "#10B981", marginTop: 6 }}>
                    ✓ YouTube id: <code>{form.youtubeId}</code>
                  </div>
                )}
              </div>
            )}

            {/* Photo: upload via S3 flow OR paste a URL */}
            {isPhoto && (
              <>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ ...lbl, display: "block", marginBottom: 6 }}>PHOTO</label>
                  {/* App renders photos in a square grid cell (cropped to fill),
                      so a square source keeps the whole photo in frame. */}
                  <div style={{ fontSize: 11, color: "#8593B3", marginBottom: 8, lineHeight: 1.5 }}>
                    Recommended: square <strong style={{ color: "#C3CEE3" }}>1080 × 1080 px (1:1)</strong> — the app crops photos to a square grid tile. Under 25 MB.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => void handlePhotoUpload(e)} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #33436B", background: "#33436B", color: "#C3CEE3", fontSize: 12, cursor: uploading ? "wait" : "pointer", fontWeight: 600 }}>
                      {uploading ? "⏳ Uploading…" : "📁 Upload Photo"}
                    </button>
                    {form.s3Key
                      ? <span style={{ fontSize: 11, color: "#10B981" }}>✓ Uploaded ({form.s3Key.split("/").pop()})</span>
                      : <span style={{ fontSize: 11, color: "#8593B3" }}>or paste a URL below</span>}
                    {form.s3Key && (
                      <button onClick={() => setForm(f => ({ ...f, s3Key: "" }))}
                        style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>PHOTO URL (optional — used only if not uploaded)</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://…/photo.jpg" disabled={Boolean(form.s3Key)} style={{ ...inp, opacity: form.s3Key ? 0.5 : 1 }} />
                </div>
              </>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>THUMBNAIL URL (optional)</label>
              <input value={form.thumbUrl} onChange={e => setForm(f => ({ ...f, thumbUrl: e.target.value }))}
                placeholder="https://…/thumb.jpg" style={inp} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#C3CEE3", fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active (shown in app)
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetForm}
              style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #33436B", background: "transparent", color: "#A6B3D0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!form.title.trim() || uploading}
              style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: form.title.trim() ? "linear-gradient(135deg, #FF6B00, #FF8C40)" : "#33436B", color: form.title.trim() ? "#fff" : "#94A3C4", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {editId ? "✓ Save Changes" : "✓ Add Item"}
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 && !loadErr && (
          <div style={{ ...card, textAlign: "center", padding: 40, color: "#8593B3" }}>
            No app media yet. Click "+ Add Item" to post the first photo, video or short.
          </div>
        )}

        {items.map((it, i) => {
          const hex = KIND_HEX[it.kind];
          const ref = it.youtubeId ? `youtube:${it.youtubeId}` : it.s3Key ? `s3:${it.s3Key.split("/").pop()}` : (it.url || "");
          return (
            <div key={it.id} style={{ ...card, padding: "12px 14px", borderLeft: `3px solid ${hex}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Reorder */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: i === 0 ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: i === 0 ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▲</button>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#FF6B00" }}>#{i + 1}</span>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down"
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: i === items.length - 1 ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: i === items.length - 1 ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▼</button>
                </div>

                {/* Kind badge */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: hex + "22", border: `1px solid ${hex}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {KIND_ICON[it.kind]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{it.title}</div>
                  <div style={{ fontSize: 11, color: "#8593B3", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: hex, fontWeight: 700, textTransform: "uppercase" }}>{it.kind}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{ref}</span>
                  </div>
                </div>

                {/* Active toggle */}
                <button onClick={() => toggleActive(it.id)} title={it.active ? "Active" : "Inactive"}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: it.active ? "#10B981" : "#33436B", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: it.active ? 22 : 4, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleEdit(it)}
                    style={{ background: "none", border: "1px solid #33436B", borderRadius: 7, padding: "5px 12px", color: "#A6B3D0", fontSize: 11, cursor: "pointer" }}>✏ Edit</button>
                  <button onClick={() => handleDelete(it.id, it.title)}
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
