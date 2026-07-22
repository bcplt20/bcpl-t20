import { useEffect, useMemo, useState } from "react";
import {
  listWaTemplates, createWaTemplate, updateWaTemplate, deleteWaTemplate,
  type WaTemplate,
} from "../../lib/adminToolsApi";

/* WhatsApp template registry — a real, saved list of the templates BCPL uses.
 * The "status" is a label the admin records after checking Interakt; there is
 * no Interakt management-API connection, so nothing here is auto-synced. */

const CATEGORIES = ["Utility", "Marketing", "Authentication"];
const STATUS_META: Record<WaTemplate["status"], { label: string; color: string }> = {
  draft: { label: "Draft", color: "#94A3B8" },
  submitted: { label: "Submitted", color: "#F59E0B" },
  approved: { label: "Approved", color: "#22C55E" },
  rejected: { label: "Rejected", color: "#EF4444" },
};

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" };

type Form = {
  id: string | null;
  name: string;
  category: string;
  language: string;
  body: string;
  varNames: string[];
  sampleValues: string[];
  status: WaTemplate["status"];
};

function toForm(t: WaTemplate): Form {
  return {
    id: t.id, name: t.name, category: t.category, language: t.language,
    body: t.body, varNames: [...t.varNames], sampleValues: [...t.sampleValues], status: t.status,
  };
}
const blankForm = (): Form => ({
  id: null, name: "", category: "Utility", language: "English", body: "Hi {{1}}, ", varNames: ["name"], sampleValues: ["Rahul Sharma"], status: "draft",
});

export default function WhatsAppTemplatesView() {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  async function refresh(selectId?: string | null) {
    try {
      const { templates: list } = await listWaTemplates();
      setTemplates(list);
      if (selectId) {
        const sel = list.find(t => t.id === selectId);
        if (sel) setForm(toForm(sel));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  const selected = useMemo(() => templates.find(t => t.id === form?.id) ?? null, [templates, form?.id]);

  const preview = useMemo(() => {
    if (!form) return "";
    return form.body.replace(/\{\{(\d+)\}\}/g, (_m, n) => {
      const v = form.sampleValues[Number(n) - 1];
      return v && v.trim() ? v : `{{${n}}}`;
    });
  }, [form]);

  async function save() {
    if (!form || saving) return;
    if (!/^[a-z0-9_]{3,100}$/.test(form.name)) {
      setError("Template name must be lowercase letters, digits and _ only (like bcpl_phase1_receipt)");
      return;
    }
    if (!form.body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        language: form.language,
        body: form.body,
        varNames: form.varNames,
        sampleValues: form.sampleValues,
        status: form.status,
      };
      if (form.id) {
        await updateWaTemplate(form.id, payload);
        await refresh(form.id);
      } else {
        const { template } = await createWaTemplate(payload as Omit<WaTemplate, "id" | "usedInCode" | "createdAt" | "updatedAt">);
        await refresh(template.id);
      }
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!form?.id || !selected) return;
    const warn = selected.usedInCode
      ? `"${selected.name}" is sent automatically by the website code. Deleting it here only removes it from this list — the code will keep sending it. Delete anyway?`
      : `Delete template "${selected.name}" from the registry?`;
    if (!window.confirm(warn)) return;
    try {
      await deleteWaTemplate(form.id);
      setForm(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function setVar(i: number, field: "varNames" | "sampleValues", value: string) {
    setForm(f => {
      if (!f) return f;
      const arr = [...f[field]];
      arr[i] = value;
      return { ...f, [field]: arr };
    });
  }
  function addVar() {
    setForm(f => f && f.varNames.length < 10 ? { ...f, varNames: [...f.varNames, ""], sampleValues: [...f.sampleValues, ""] } : f);
  }
  function removeVar(i: number) {
    setForm(f => f && {
      ...f,
      varNames: f.varNames.filter((_, x) => x !== i),
      sampleValues: f.sampleValues.filter((_, x) => x !== i),
    });
  }

  const counts = useMemo(() => ({
    total: templates.length,
    approved: templates.filter(t => t.status === "approved").length,
    inCode: templates.filter(t => t.usedInCode).length,
  }), [templates]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>WhatsApp Templates</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Your saved template registry. Status is what you record after checking Interakt — it is not auto-synced.
          </div>
        </div>
        <button onClick={() => { setForm(blankForm()); setError(null); }} style={btnPrimary}>+ New Template</button>
      </div>

      {/* Honest stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Templates saved", value: counts.total, color: "#F1F5F9" },
          { label: "Marked approved by you", value: counts.approved, color: "#22C55E" },
          { label: "Sent automatically by the website", value: counts.inCode, color: "#FF8C40" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        {/* Template list */}
        <div style={{ ...card, padding: 12 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: "#64748B", padding: 12 }}>Loading…</div>
          ) : templates.length === 0 ? (
            <div style={{ fontSize: 12, color: "#475569", padding: 12 }}>No templates saved yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {templates.map(t => (
                <div key={t.id} onClick={() => { setForm(toForm(t)); setError(null); }}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `1px solid ${form?.id === t.id ? "#FF6B00" : "transparent"}`, background: form?.id === t.id ? "#FF6B0012" : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: form?.id === t.id ? "#FF8C40" : "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: STATUS_META[t.status].color, flexShrink: 0 }}>{STATUS_META[t.status].label.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
                    {t.category}{t.usedInCode ? " · ⚙ used by website code" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor + preview */}
        {form ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>{form.id ? "Edit Template" : "New Template"}</div>
                {selected?.usedInCode && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#FF8C40", background: "#FF6B001A", border: "1px solid #FF6B0044", borderRadius: 6, padding: "3px 8px" }}>
                    ⚙ Sent automatically by the website code
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>TEMPLATE NAME (as in Interakt)</label>
                  <input value={form.name} onChange={e => setForm(f => f && { ...f, name: e.target.value.toLowerCase() })}
                    placeholder="bcpl_match_update" style={{ ...inputStyle, fontFamily: "monospace" }} />
                </div>
                <div>
                  <label style={labelStyle}>STATUS (your manual record)</label>
                  <select value={form.status} onChange={e => setForm(f => f && { ...f, status: e.target.value as WaTemplate["status"] })} style={inputStyle}>
                    {(Object.keys(STATUS_META) as WaTemplate["status"][]).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm(f => f && { ...f, category: e.target.value })} style={inputStyle}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>LANGUAGE</label>
                  <input value={form.language} onChange={e => setForm(f => f && { ...f, language: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <label style={labelStyle}>MESSAGE BODY — use {"{{1}}, {{2}}"} for variables</label>
              <textarea value={form.body} onChange={e => setForm(f => f && { ...f, body: e.target.value })} rows={5}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />

              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>VARIABLES & SAMPLE VALUES (for the preview)</label>
                  <button onClick={addVar} disabled={form.varNames.length >= 10}
                    style={{ background: "none", border: "none", color: "#FF8C40", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: form.varNames.length >= 10 ? 0.4 : 1 }}>
                    + Add variable
                  </button>
                </div>
                {form.varNames.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#475569" }}>No variables — the message is fixed text.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.varNames.map((v, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 30px", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#FF8C40", fontFamily: "monospace", fontWeight: 700 }}>{`{{${i + 1}}}`}</span>
                        <input value={v} onChange={e => setVar(i, "varNames", e.target.value)} placeholder="variable name (e.g. name)" style={inputStyle} />
                        <input value={form.sampleValues[i] ?? ""} onChange={e => setVar(i, "sampleValues", e.target.value)} placeholder="sample value" style={inputStyle} />
                        <button onClick={() => removeVar(i)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center" }}>
                {form.id && <button onClick={() => void remove()} style={{ ...btnGhost, color: "#FCA5A5", borderColor: "#EF444455" }}>Delete</button>}
                <div style={{ flex: 1 }} />
                {savedMsg && <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700 }}>✓ Saved</span>}
                <button onClick={() => setForm(null)} style={btnGhost}>Close</button>
                <button onClick={() => void save()} disabled={saving || !form.name || !form.body.trim()}
                  style={{ ...btnPrimary, opacity: saving || !form.name || !form.body.trim() ? 0.5 : 1 }}>
                  {saving ? "Saving…" : form.id ? "Save Changes" : "Save Template"}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>Preview (with sample values)</div>
              <div style={{ background: "#0B141A", borderRadius: 14, padding: 18 }}>
                <div style={{ maxWidth: 420, background: "#005C4B", borderRadius: "4px 14px 14px 14px", padding: "10px 12px", color: "#E9EDEF", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {preview || <span style={{ color: "#8696A0" }}>Type a message body above…</span>}
                  <div style={{ fontSize: 10, color: "#8696A0", textAlign: "right", marginTop: 4 }}>
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>Select a template to view or edit</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              The 7 pre-loaded templates are the ones the website sends automatically (receipts, reminders, selection results).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
