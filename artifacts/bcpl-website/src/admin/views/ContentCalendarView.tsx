import { useEffect, useMemo, useState } from "react";
import {
  listPlannedPosts, createPlannedPost, updatePlannedPost, deletePlannedPost,
  type PlannedPost,
} from "../../lib/adminToolsApi";

/* Manual content planner — posts are saved in the database so the whole team
 * sees the same calendar. Nothing is auto-published to social media. */

const PLATFORMS = ["Instagram", "Facebook", "YouTube", "X (Twitter)", "WhatsApp", "Other"];
const PLATFORM_ICON: Record<string, string> = {
  Instagram: "📸", Facebook: "👥", YouTube: "▶️", "X (Twitter)": "🐦", WhatsApp: "💬", Other: "📣",
};
const POST_TYPES = ["Post", "Reel", "Story", "Video", "Poster", "Announcement"];

const STATUS_META: Record<PlannedPost["status"], { label: string; color: string }> = {
  draft: { label: "Draft", color: "#94A3B8" },
  planned: { label: "Planned", color: "#3B82F6" },
  posted: { label: "Posted", color: "#22C55E" },
};

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" };

function ymOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  return ymOf(new Date(y, m - 1 + delta, 1));
}
function monthTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
/** Monday-first weekday index of the 1st (Mon=0 … Sun=6) */
function firstWeekday(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return (new Date(y, m - 1, 1).getDay() + 6) % 7;
}
function todayStr(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
}

type Form = {
  id: string | null;
  postDate: string;
  postTime: string;
  platform: string;
  postType: string;
  caption: string;
  status: PlannedPost["status"];
};
const emptyForm = (date?: string): Form => ({
  id: null, postDate: date ?? todayStr(), postTime: "", platform: "Instagram", postType: "Post", caption: "", status: "draft",
});

export default function ContentCalendarView() {
  const [posts, setPosts] = useState<PlannedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(ymOf(new Date()));
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    try {
      setPosts((await listPlannedPosts()).posts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, PlannedPost[]>();
    for (const p of posts) {
      if (!m.has(p.postDate)) m.set(p.postDate, []);
      m.get(p.postDate)!.push(p);
    }
    return m;
  }, [posts]);

  const upcoming = useMemo(() => {
    const t = todayStr();
    return posts.filter(p => p.postDate >= t && p.status !== "posted").slice(0, 8);
  }, [posts]);

  async function save() {
    if (!form || !form.caption.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        postDate: form.postDate,
        postTime: form.postTime || null,
        platform: form.platform,
        postType: form.postType,
        caption: form.caption.trim(),
        status: form.status,
      };
      if (form.id) await updatePlannedPost(form.id, payload);
      else await createPlannedPost(payload as Omit<PlannedPost, "id" | "createdAt" | "updatedAt">);
      setForm(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!form?.id) return;
    if (!window.confirm("Delete this planned post?")) return;
    try {
      await deletePlannedPost(form.id);
      setForm(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function markPosted(p: PlannedPost) {
    try {
      await updatePlannedPost(p.id, { status: "posted" });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openEdit(p: PlannedPost) {
    setForm({ id: p.id, postDate: p.postDate, postTime: p.postTime ?? "", platform: p.platform, postType: p.postType, caption: p.caption, status: p.status });
  }

  /* calendar cells */
  const cells: Array<{ date: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday(month); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(month); d++) {
    cells.push({ date: `${month}-${String(d).padStart(2, "0")}`, day: d });
  }
  const today = todayStr();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Content Calendar</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Plan social posts for the team — saved in the database. Nothing publishes automatically.
          </div>
        </div>
        <button onClick={() => setForm(emptyForm())} style={btnPrimary}>+ Plan a Post</button>
      </div>

      {error && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
        {/* Calendar */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={() => setMonth(m => shiftMonth(m, -1))} style={{ ...btnGhost, padding: "6px 12px" }}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>{monthTitle(month)}</div>
            <button onClick={() => setMonth(m => shiftMonth(m, 1))} style={{ ...btnGhost, padding: "6px 12px" }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} style={{ fontSize: 10, fontWeight: 700, color: "#475569", textAlign: "center", padding: "4px 0" }}>{d}</div>
            ))}
            {cells.map((c, i) => c === null ? <div key={`b${i}`} /> : (
              <div key={c.date} onClick={() => setForm(emptyForm(c.date))}
                style={{
                  minHeight: 74, borderRadius: 10, padding: 6, cursor: "pointer",
                  border: `1px solid ${c.date === today ? "#FF6B00" : "#1E293B"}`,
                  background: c.date === today ? "#FF6B0010" : "#060B18",
                }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.date === today ? "#FF6B00" : "#64748B", marginBottom: 4 }}>{c.day}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {(byDate.get(c.date) ?? []).slice(0, 3).map(p => (
                    <div key={p.id} onClick={e => { e.stopPropagation(); openEdit(p); }} title={p.caption}
                      style={{ fontSize: 10, color: STATUS_META[p.status].color, background: `${STATUS_META[p.status].color}1A`, border: `1px solid ${STATUS_META[p.status].color}44`, borderRadius: 5, padding: "2px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {PLATFORM_ICON[p.platform] ?? "📣"} {p.postTime ? `${p.postTime} ` : ""}{p.postType}
                    </div>
                  ))}
                  {(byDate.get(c.date)?.length ?? 0) > 3 && (
                    <div style={{ fontSize: 9, color: "#475569" }}>+{byDate.get(c.date)!.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {loading && <div style={{ fontSize: 12, color: "#64748B", marginTop: 10, textAlign: "center" }}>Loading posts…</div>}
        </div>

        {/* Upcoming */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Upcoming (not posted yet)</div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 12, color: "#475569" }}>Nothing planned ahead. Click a date on the calendar to plan a post.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map(p => (
                <div key={p.id} style={{ border: "1px solid #1E293B", borderRadius: 10, padding: 10, cursor: "pointer" }} onClick={() => openEdit(p)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>
                      {PLATFORM_ICON[p.platform] ?? "📣"} {p.platform} · {p.postType}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_META[p.status].color }}>{STATUS_META[p.status].label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: "#475569" }}>
                      {new Date(p.postDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{p.postTime ? ` · ${p.postTime}` : ""}
                    </span>
                    <button onClick={e => { e.stopPropagation(); void markPosted(p); }}
                      style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", background: "#22C55E1A", border: "1px solid #22C55E44", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
                      ✓ Mark Posted
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor modal */}
      {form && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 520, maxWidth: "94vw", maxHeight: "92vh", overflow: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>
              {form.id ? "Edit Planned Post" : "Plan a Post"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>DATE</label>
                <input type="date" value={form.postDate} onChange={e => setForm(f => f && { ...f, postDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TIME (optional)</label>
                <input type="time" value={form.postTime} onChange={e => setForm(f => f && { ...f, postTime: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PLATFORM</label>
                <select value={form.platform} onChange={e => setForm(f => f && { ...f, platform: e.target.value })} style={inputStyle}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICON[p]} {p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>TYPE</label>
                <select value={form.postType} onChange={e => setForm(f => f && { ...f, postType: e.target.value })} style={inputStyle}>
                  {POST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label style={labelStyle}>CAPTION / IDEA</label>
            <textarea value={form.caption} onChange={e => setForm(f => f && { ...f, caption: e.target.value })} rows={4}
              placeholder="e.g. Match-day poster: Delhi vs Mumbai, tag sponsors, hashtag #BCPLT20"
              style={{ ...inputStyle, resize: "vertical", marginBottom: 12, fontFamily: "inherit" }} />
            <label style={labelStyle}>STATUS</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(Object.keys(STATUS_META) as PlannedPost["status"][]).map(s => (
                <button key={s} onClick={() => setForm(f => f && { ...f, status: s })}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1px solid ${form.status === s ? STATUS_META[s].color : "#1E293B"}`, background: form.status === s ? `${STATUS_META[s].color}1A` : "transparent", color: form.status === s ? STATUS_META[s].color : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {form.id && (
                <button onClick={() => void remove()} style={{ ...btnGhost, color: "#FCA5A5", borderColor: "#EF444455" }}>Delete</button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => setForm(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => void save()} disabled={!form.caption.trim() || saving}
                style={{ ...btnPrimary, opacity: form.caption.trim() && !saving ? 1 : 0.5 }}>
                {saving ? "Saving…" : form.id ? "Save Changes" : "Add to Calendar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
