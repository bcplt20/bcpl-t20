/**
 * Admin News — DB-backed articles with BCPL AI drafting.
 * Published articles appear on the website's News page (on top of the
 * static Season-4 archive) and in the mobile app.
 */
import { useEffect, useState } from "react";
import {
  adminListNews, adminCreateNews, adminUpdateNews, adminDeleteNews,
  adminNewsAiDraft, type NewsArticleInput,
} from "../api/newsApi";
import type { ApiNewsArticle } from "../../lib/api";

const card: React.CSSProperties = { background: "#2C3A5E", border: "1px solid #33436B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #33436B", background: "#243050", color: "#F1F5F9", fontSize: 13, outline: "none" };
const label: React.CSSProperties = { fontSize: 11, color: "#A6B3D0", fontWeight: 700, display: "block", marginBottom: 6 };

const EMPTY: NewsArticleInput = { slug: "", tag: "News", title: "", titleHi: "", image: "", paragraphs: [""], paragraphsHi: [], press: [], published: false };

export default function NewsView() {
  const [articles, setArticles] = useState<ApiNewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState("");
  const [editing, setEditing]   = useState<{ id: string | null; form: NewsArticleInput } | null>(null);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [busyId, setBusyId]     = useState<string | null>(null);
  // AI draft
  const [topic, setTopic]       = useState("");
  const [drafting, setDrafting] = useState(false);

  const reload = async () => {
    setLoadErr("");
    try { setArticles((await adminListNews()).articles); }
    catch (e) { setLoadErr((e as Error).message || "Could not load articles"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const openNew  = () => { setErr(""); setTopic(""); setEditing({ id: null, form: { ...EMPTY, paragraphs: [""] } }); };
  const openEdit = (a: ApiNewsArticle) => {
    setErr(""); setTopic("");
    setEditing({ id: a.id, form: {
      slug: a.slug, tag: a.tag, title: a.title, titleHi: a.titleHi, image: a.image,
      paragraphs: a.paragraphs.length ? a.paragraphs : [""], paragraphsHi: a.paragraphsHi,
      press: a.press, published: a.published,
    } });
  };

  const set = (patch: Partial<NewsArticleInput>) =>
    setEditing(ed => ed ? { ...ed, form: { ...ed.form, ...patch } } : ed);

  const runAiDraft = async () => {
    if (!topic.trim() || drafting) return;
    setErr(""); setDrafting(true);
    try {
      const d = await adminNewsAiDraft(topic.trim());
      set({ slug: d.slug, tag: d.tag, title: d.title, titleHi: d.titleHi, paragraphs: d.paragraphs, paragraphsHi: d.paragraphsHi });
    } catch (e) { setErr((e as Error).message || "AI draft failed"); }
    finally { setDrafting(false); }
  };

  const save = async () => {
    if (!editing || saving) return;
    const f = { ...editing.form, paragraphs: editing.form.paragraphs.map(p => p.trim()).filter(Boolean), paragraphsHi: editing.form.paragraphsHi.map(p => p.trim()).filter(Boolean) };
    if (!f.slug.trim() || !f.title.trim() || !f.paragraphs.length) { setErr("Slug, title and at least one paragraph are required"); return; }
    setErr(""); setSaving(true);
    try {
      if (editing.id) await adminUpdateNews(editing.id, f); else await adminCreateNews(f);
      setEditing(null);
      await reload();
    } catch (e) { setErr((e as Error).message || "Save failed"); }
    finally { setSaving(false); }
  };

  const remove = async (a: ApiNewsArticle) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    setBusyId(a.id);
    try { await adminDeleteNews(a.id); await reload(); }
    catch (e) { setLoadErr((e as Error).message || "Delete failed"); }
    finally { setBusyId(null); }
  };

  const togglePublish = async (a: ApiNewsArticle) => {
    setBusyId(a.id);
    try {
      await adminUpdateNews(a.id, {
        slug: a.slug, tag: a.tag, title: a.title, titleHi: a.titleHi, image: a.image,
        paragraphs: a.paragraphs, paragraphsHi: a.paragraphsHi, press: a.press,
        published: !a.published,
      });
      await reload();
    } catch (e) { setLoadErr((e as Error).message || "Update failed"); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>📰 News Articles</div>
          <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 4 }}>Published articles appear instantly on the website News page and in the app. Use BCPL AI to draft, then review before publishing.</div>
        </div>
        <button onClick={openNew} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Article
        </button>
      </div>

      {loadErr && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#EF444422", color: "#F87171", fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>⚠ {loadErr}</div>}
      {loading && <div style={{ color: "#C3CEE3", fontSize: 13 }}>Loading…</div>}
      {!loading && !articles.length && (
        <div style={{ ...card, textAlign: "center", padding: 44 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>No admin articles yet</div>
          <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 6 }}>The website still shows the Season-4 archive articles. Create your first article — describe the topic and let BCPL AI draft it.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {articles.map(a => (
          <div key={a.id} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: a.published ? "#10B98122" : "#8593B322", color: a.published ? "#10B981" : "#A6B3D0", textTransform: "uppercase" }}>
                  {a.published ? "Published" : "Draft"}
                </span>
                <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>{a.tag}</span>
                <span style={{ fontSize: 11, color: "#8593B3" }}>/{a.slug}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
              {a.titleHi ? <div style={{ fontSize: 12.5, color: "#C3CEE3", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titleHi}</div> : null}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button disabled={busyId === a.id} onClick={() => togglePublish(a)} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: a.published ? "#8593B322" : "#10B98122", color: a.published ? "#C3CEE3" : "#10B981", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: busyId === a.id ? 0.5 : 1 }}>
                {a.published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => openEdit(a)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #33436B", background: "transparent", color: "#C3CEE3", fontSize: 11, cursor: "pointer" }}>Edit</button>
              <button disabled={busyId === a.id} onClick={() => remove(a)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #7F1D1D", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer", opacity: busyId === a.id ? 0.5 : 1 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#2C3A5E", border: "1px solid #33436B", borderRadius: 20, padding: 28, width: 720, maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>
              {editing.id ? "✏️ Edit Article" : "📰 New Article"}
            </div>

            {/* BCPL AI drafting */}
            <div style={{ background: "#243050", border: "1px solid #33436B", borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#B7A6FF", marginBottom: 8 }}>✨ Draft with BCPL AI</div>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={2} placeholder="Describe the news in your own words (Hindi or English) — dates, names, facts. BCPL AI writes the full bilingual article; you review it below."
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
              <button disabled={drafting || !topic.trim()} onClick={runAiDraft} style={{ marginTop: 8, padding: "9px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: drafting || !topic.trim() ? 0.5 : 1 }}>
                {drafting ? "Drafting…" : "Generate draft"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={label}>Title (English)</label><input value={editing.form.title} onChange={e => set({ title: e.target.value })} style={inputStyle} /></div>
              <div><label style={label}>Title (Hindi)</label><input value={editing.form.titleHi} onChange={e => set({ titleHi: e.target.value })} style={inputStyle} /></div>
              <div><label style={label}>Slug (URL, lowercase-hyphens)</label><input value={editing.form.slug} onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })} style={inputStyle} /></div>
              <div><label style={label}>Tag</label><input value={editing.form.tag} onChange={e => set({ tag: e.target.value })} style={inputStyle} placeholder="e.g. Season 5, Trials" /></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={label}>Image URL (optional — full https URL, or a filename already in bcpl-assets/news/)</label>
              <input value={editing.form.image} onChange={e => set({ image: e.target.value })} style={inputStyle} placeholder="https://… or auction-2026.jpg" />
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={label}>Article (English) — one paragraph per block</label>
              <textarea value={editing.form.paragraphs.join("\n\n")} onChange={e => set({ paragraphs: e.target.value.split(/\n{2,}/) })} rows={7} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={label}>Article (Hindi) — one paragraph per block (optional)</label>
              <textarea value={editing.form.paragraphsHi.join("\n\n")} onChange={e => set({ paragraphsHi: e.target.value.split(/\n{2,}/) })} rows={7} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 13, color: "#F1F5F9", fontWeight: 700, cursor: "pointer" }}>
              <input type="checkbox" checked={editing.form.published} onChange={e => set({ published: e.target.checked })} />
              Publish now (visible on website + app immediately)
            </label>

            {err && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {err}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #33436B", background: "transparent", color: "#A6B3D0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button disabled={saving} onClick={save} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : editing.id ? "Save changes" : "Create article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
