import { useEffect, useState } from "react";
import {
  adminListPolls, adminGetPoll, adminCreatePoll, adminPatchPoll, adminDeletePoll,
  adminAddPollOption, adminPatchPollOption, adminDeletePollOption,
  type AdminPollListItem, type AdminPollDetail,
} from "../../lib/api";

/* ── styling (mirrors other admin views) ── */
const card: React.CSSProperties = { background: "linear-gradient(135deg,#2C3A5E,#1F2B49)", border: "1px solid #33436B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #33436B", background: "#1F2B49", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" };
const label: React.CSSProperties = { display: "block", fontSize: 10.5, fontWeight: 700, color: "#94A3C4", letterSpacing: .5, marginBottom: 5, textTransform: "uppercase" };
const btn = (variant: "primary" | "ghost" | "danger" = "primary"): React.CSSProperties => ({
  padding: "8px 14px", borderRadius: 9, border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  background: variant === "primary" ? "linear-gradient(135deg,#FF6B00,#FF8C40)" : variant === "danger" ? "#7F1D1D" : "transparent",
  color: variant === "ghost" ? "#A6B3D0" : "#fff",
  ...(variant === "ghost" ? { border: "1px solid #33436B" } : {}),
});

const CATEGORIES = [
  { v: "man_of_series", l: "Man of the Series" },
  { v: "best_batsman", l: "Best Batsman" },
  { v: "best_bowler", l: "Best Bowler" },
  { v: "custom", l: "Custom" },
];
const STATUSES = ["draft", "open", "closed"];

function statusPill(status: string): React.CSSProperties {
  const map: Record<string, string> = { open: "#16A34A", closed: "#64748B", draft: "#F59E0B" };
  const c = map[status] ?? "#64748B";
  return { fontSize: 10, fontWeight: 800, color: c, background: `${c}22`, border: `1px solid ${c}55`, padding: "2px 8px", borderRadius: 100, textTransform: "uppercase", letterSpacing: .4 };
}

type NewOption = { label: string; teamName: string; imageUrl: string };

export default function PollsView() {
  const [polls, setPolls] = useState<AdminPollListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [detail, setDetail] = useState<AdminPollDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  // create form
  const [form, setForm] = useState({ slug: "", titleEn: "", titleHi: "", category: "custom", status: "draft", showLiveResults: true });
  const [formOpts, setFormOpts] = useState<NewOption[]>([{ label: "", teamName: "", imageUrl: "" }]);

  // add-option form (inside detail)
  const [newOpt, setNewOpt] = useState<NewOption>({ label: "", teamName: "", imageUrl: "" });

  async function refresh() {
    setLoading(true); setErr("");
    try {
      const r = await adminListPolls();
      setPolls(r.polls);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not load polls"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function openDetail(id: string) {
    setDetailBusy(true);
    try { setDetail(await adminGetPoll(id)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not load poll"); }
    finally { setDetailBusy(false); }
  }

  async function submitCreate() {
    if (!form.slug || !form.titleEn) { setErr("Slug and English title are required"); return; }
    setDetailBusy(true); setErr("");
    try {
      const options = formOpts.filter(o => o.label.trim()).map((o, i) => ({
        label: o.label.trim(),
        teamName: o.teamName.trim() || null,
        imageUrl: o.imageUrl.trim() || null,
        sortOrder: i,
      }));
      await adminCreatePoll({ ...form, options });
      setCreating(false);
      setForm({ slug: "", titleEn: "", titleHi: "", category: "custom", status: "draft", showLiveResults: true });
      setFormOpts([{ label: "", teamName: "", imageUrl: "" }]);
      await refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not create poll"); }
    finally { setDetailBusy(false); }
  }

  async function setStatus(id: string, status: string) {
    setDetailBusy(true); setErr("");
    try { await adminPatchPoll(id, { status }); await refresh(); if (detail?.poll.id === id) await openDetail(id); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not update poll"); }
    finally { setDetailBusy(false); }
  }

  async function removePoll(id: string) {
    if (!window.confirm("Delete this poll and all its votes? This cannot be undone.")) return;
    setDetailBusy(true); setErr("");
    try { await adminDeletePoll(id); if (detail?.poll.id === id) setDetail(null); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not delete poll"); }
    finally { setDetailBusy(false); }
  }

  async function toggleLive(d: AdminPollDetail) {
    setDetailBusy(true); setErr("");
    try { await adminPatchPoll(d.poll.id, { showLiveResults: !d.poll.showLiveResults }); await openDetail(d.poll.id); await refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not update poll"); }
    finally { setDetailBusy(false); }
  }

  async function addOption(pollId: string) {
    if (!newOpt.label.trim()) return;
    setDetailBusy(true); setErr("");
    try {
      await adminAddPollOption(pollId, {
        label: newOpt.label.trim(),
        teamName: newOpt.teamName.trim() || null,
        imageUrl: newOpt.imageUrl.trim() || null,
      });
      setNewOpt({ label: "", teamName: "", imageUrl: "" });
      await openDetail(pollId);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not add option"); }
    finally { setDetailBusy(false); }
  }

  async function renameOption(pollId: string, optId: string, current: string) {
    const next = window.prompt("Option label:", current);
    if (next == null || next.trim() === current) return;
    setDetailBusy(true); setErr("");
    try { await adminPatchPollOption(pollId, optId, { label: next.trim() }); await openDetail(pollId); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not update option"); }
    finally { setDetailBusy(false); }
  }

  async function removeOption(pollId: string, optId: string) {
    if (!window.confirm("Delete this option (and its votes)?")) return;
    setDetailBusy(true); setErr("");
    try { await adminDeletePollOption(pollId, optId); await openDetail(pollId); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not delete option"); }
    finally { setDetailBusy(false); }
  }

  return (
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>Fan Voting · Polls</h2>
          <p style={{ fontSize: 12.5, color: "#8593B3", margin: "4px 0 0" }}>Create IPL-style fan polls, open/close voting and view results.</p>
        </div>
        <button style={btn("primary")} onClick={() => { setCreating(c => !c); setErr(""); }}>{creating ? "Close" : "+ New Poll"}</button>
      </div>

      {err && <div style={{ background: "#7F1D1D33", border: "1px solid #7F1D1D", color: "#FCA5A5", padding: "10px 14px", borderRadius: 10, fontSize: 12.5, marginBottom: 14 }}>⚠ {err}</div>}

      {/* Create form */}
      {creating && (
        <div style={{ ...card, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0", margin: "0 0 14px" }}>New Poll</h3>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            <div><label style={label}>Slug (url-safe)</label><input style={inputStyle} value={form.slug} placeholder="man-of-series-s5" onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase() }))} /></div>
            <div><label style={label}>Title (English)</label><input style={inputStyle} value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} /></div>
            <div><label style={label}>Title (Hindi)</label><input style={inputStyle} value={form.titleHi} onChange={e => setForm(f => ({ ...f, titleHi: e.target.value }))} /></div>
            <div><label style={label}>Category</label><select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}</select></div>
            <div><label style={label}>Status</label><select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#A6B3D0", fontSize: 12.5, cursor: "pointer" }}>
                <input type="checkbox" checked={form.showLiveResults} onChange={e => setForm(f => ({ ...f, showLiveResults: e.target.checked }))} /> Show live results
              </label>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={label}>Options</label>
            {formOpts.map((o, i) => (
              <div key={i} style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr auto", marginBottom: 8 }}>
                <input style={inputStyle} placeholder="Label" value={o.label} onChange={e => setFormOpts(a => a.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input style={inputStyle} placeholder="Team (optional)" value={o.teamName} onChange={e => setFormOpts(a => a.map((x, j) => j === i ? { ...x, teamName: e.target.value } : x))} />
                <input style={inputStyle} placeholder="Image URL (optional)" value={o.imageUrl} onChange={e => setFormOpts(a => a.map((x, j) => j === i ? { ...x, imageUrl: e.target.value } : x))} />
                <button style={btn("ghost")} onClick={() => setFormOpts(a => a.length > 1 ? a.filter((_, j) => j !== i) : a)}>✕</button>
              </div>
            ))}
            <button style={btn("ghost")} onClick={() => setFormOpts(a => [...a, { label: "", teamName: "", imageUrl: "" }])}>+ Add option</button>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button style={btn("primary")} disabled={detailBusy} onClick={submitCreate}>{detailBusy ? "Saving…" : "Create Poll"}</button>
            <button style={btn("ghost")} onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: "#8593B3", padding: 40, textAlign: "center" }}>Loading polls…</div>
      ) : polls.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#8593B3" }}>No polls yet. Create one to get started.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {polls.map(p => (
            <div key={p.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={statusPill(p.status)}>{p.status}</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>/{p.slug}</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>· {p.totalVotes} votes</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0" }}>{p.titleEn}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.status !== "open" && <button style={btn("ghost")} disabled={detailBusy} onClick={() => setStatus(p.id, "open")}>Open</button>}
                  {p.status !== "closed" && <button style={btn("ghost")} disabled={detailBusy} onClick={() => setStatus(p.id, "closed")}>Close</button>}
                  <button style={btn("ghost")} disabled={detailBusy} onClick={() => openDetail(p.id)}>Manage</button>
                  <button style={btn("danger")} disabled={detailBusy} onClick={() => removePoll(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail / edit drawer */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1300, display: "flex", justifyContent: "flex-end" }} onClick={() => setDetail(null)}>
          <div style={{ width: "min(560px,100vw)", height: "100%", background: "#1F2B49", borderLeft: "1px solid #33436B", overflowY: "auto", padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>{detail.poll.titleEn}</h3>
              <button style={btn("ghost")} onClick={() => setDetail(null)}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={statusPill(detail.poll.status)}>{detail.poll.status}</span>
              <span style={{ fontSize: 11, color: "#64748B", alignSelf: "center" }}>/{detail.poll.slug} · {detail.totalVotes} votes</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <button style={btn("ghost")} disabled={detailBusy} onClick={() => setStatus(detail.poll.id, "open")}>Open voting</button>
              <button style={btn("ghost")} disabled={detailBusy} onClick={() => setStatus(detail.poll.id, "closed")}>Close voting</button>
              <button style={btn("ghost")} disabled={detailBusy} onClick={() => toggleLive(detail)}>
                {detail.poll.showLiveResults ? "Hide live results" : "Show live results"}
              </button>
            </div>

            <label style={label}>Results</label>
            <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
              {detail.options.map(o => (
                <div key={o.id} style={{ ...card, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#E2E8F0" }}>{o.label}{o.teamName ? <span style={{ color: "#64748B", fontWeight: 500 }}> · {o.teamName}</span> : null}</div>
                      <div style={{ fontSize: 11, color: "#8593B3", marginTop: 3 }}>{o.votes} votes · {o.percent}%</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={btn("ghost")} disabled={detailBusy} onClick={() => renameOption(detail.poll.id, o.id, o.label)}>Edit</button>
                      <button style={btn("danger")} disabled={detailBusy} onClick={() => removeOption(detail.poll.id, o.id)}>✕</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: "#0F1830", overflow: "hidden" }}>
                    <div style={{ width: `${o.percent}%`, height: "100%", background: "linear-gradient(90deg,#FF6B00,#FF8C40)" }} />
                  </div>
                </div>
              ))}
            </div>

            <label style={label}>Add option</label>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginBottom: 8 }}>
              <input style={inputStyle} placeholder="Label" value={newOpt.label} onChange={e => setNewOpt(o => ({ ...o, label: e.target.value }))} />
              <input style={inputStyle} placeholder="Team (optional)" value={newOpt.teamName} onChange={e => setNewOpt(o => ({ ...o, teamName: e.target.value }))} />
            </div>
            <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Image URL (optional)" value={newOpt.imageUrl} onChange={e => setNewOpt(o => ({ ...o, imageUrl: e.target.value }))} />
            <button style={btn("primary")} disabled={detailBusy || !newOpt.label.trim()} onClick={() => addOption(detail.poll.id)}>+ Add option</button>
          </div>
        </div>
      )}
    </div>
  );
}
