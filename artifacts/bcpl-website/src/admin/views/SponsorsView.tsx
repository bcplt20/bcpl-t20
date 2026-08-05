import { useState, useRef, useEffect } from "react";
import { fetchSponsorsAdmin, saveSponsorsAdmin, type Sponsor } from "../api/sponsorsApi";
import { adminGetSampleUploadUrl } from "../../lib/api";
import { BASE, adminUpload } from "../../lib/adminHttp";

/* The S3 bucket blocks public reads, so raw bucket URLs 403 in the browser
   (blank logos). Render through the API's presign-redirect route instead;
   the stored value stays the plain bucket URL (the API converts it too). */
function logoDisplay(url: string): string {
  const m = /^https?:\/\/[a-z0-9.-]+\.s3[.-][a-z0-9-]+\.amazonaws\.com\/(cms\/[A-Za-z0-9._-]+)$/i.exec(url.trim());
  return m ? `${BASE}/sponsors/logo?key=${encodeURIComponent(m[1])}` : url;
}

const KNOWN_SPONSORS = [
  "Tata Group","Reliance Industries","HDFC Bank","ICICI Bank","Infosys","Wipro",
  "HCL Technologies","Tech Mahindra","Bajaj Auto","Mahindra & Mahindra",
  "Larsen & Toubro","Adani Group","Asian Paints","Hindustan Unilever","ITC Limited",
  "Maruti Suzuki","Bharti Airtel","Vodafone Idea","Jio","Axis Bank",
  "Kotak Mahindra","State Bank of India","Bank of Baroda","Yes Bank",
  "Dream11","MPL Sports","CRED","PhonePe","Paytm","Zepto","Swiggy","Zomato",
  "Myntra","Flipkart","Amazon India","Meesho",
  "Royal Stag","Pepsi","Coca-Cola India","Red Bull","Kingfisher",
  "MRF Tyres","CEAT Tyres","Bosch India","Havells India","Havells","Voltas",
];

/* Sponsors now live on the SERVER (site_settings key "sponsors") so they show
   on the public website (/sponsors) and on every admin device — NOT in
   localStorage. The old localStorage key is kept only to rescue previously
   entered data via the one-time Import banner below. */
const LEGACY_LS_KEY = "bcpl_sponsors";

function readLegacy(): Sponsor[] {
  try {
    const list = JSON.parse(localStorage.getItem(LEGACY_LS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

const statusColor = (s: string) =>
  s === "active" ? "#10B981" : s === "negotiating" ? "#F59E0B" : "#EF4444";

/** Group sponsors by category, preserving admin array order (a category's
    position = where it FIRST appears). Each group also records the array
    indices of its items so per-sponsor move buttons map back to the array. */
type SponsorGroup = { label: string; items: Sponsor[]; indices: number[] };
function groupSponsors(list: Sponsor[]): SponsorGroup[] {
  const groups: SponsorGroup[] = [];
  list.forEach((s, idx) => {
    const label = (s.category || "").trim() || "Uncategorised";
    const g = groups.find(x => x.label.toLowerCase() === label.toLowerCase());
    if (g) { g.items.push(s); g.indices.push(idx); }
    else groups.push({ label, items: [s], indices: [idx] });
  });
  return groups;
}

export default function SponsorsView() {
  const [sponsors,  setSponsors]  = useState<Sponsor[]>([]);
  const [loaded,    setLoaded]    = useState(false);
  const [loadErr,   setLoadErr]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [legacy,    setLegacy]    = useState<Sponsor[] | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<Omit<Sponsor, "id">>({
    name: "", category: "", logo: "", amount: "", website: "",
    contract: "", status: "active", visibility: "All Platforms",
  });
  const [nameMode,  setNameMode]  = useState<string>("__custom");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoadErr("");
    try {
      const r = await fetchSponsorsAdmin();
      const server = Array.isArray(r.value) ? r.value : [];
      setSponsors(server);
      setLoaded(true);
      const old = readLegacy();
      setLegacy(server.length === 0 && old.length > 0 ? old : null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Failed to load sponsors");
      setLoaded(true);
    }
  }
  useEffect(() => { void load(); }, []);

  /* Single-flight coalescing save: only ONE PUT is in flight at a time and
     it always carries the LATEST list, so rapid edit/delete clicks can never
     land out of order and overwrite newer data with stale data. On failure
     we resync from the server instead of guessing a rollback state. */
  const pendingRef  = useRef<Sponsor[] | null>(null);
  const inflightRef = useRef(false);

  async function persist(next: Sponsor[]) {
    setSponsors(next);           // optimistic UI
    pendingRef.current = next;   // latest snapshot wins
    if (inflightRef.current) return;
    inflightRef.current = true;
    setSaving(true);
    try {
      while (pendingRef.current !== null) {
        const batch = pendingRef.current;
        pendingRef.current = null;
        await saveSponsorsAdmin(batch);
      }
    } catch (e) {
      pendingRef.current = null;
      alert("Could not save to server: " + (e instanceof Error ? e.message : "unknown error"));
      await load();              // resync UI with server truth
    } finally {
      inflightRef.current = false;
      setSaving(false);
    }
  }

  /** One-time rescue of sponsors entered before server storage existed.
      Every row is fully sanitized to the exact server schema (extra keys
      dropped, lengths clamped, non-http logos/websites emptied) so one bad
      legacy row can't fail the whole import. Base64 logos are dropped —
      re-upload logos after import. */
  async function importLegacy() {
    if (!legacy) return;
    const httpOk = (v: unknown) => (typeof v === "string" && /^https?:\/\//i.test(v) ? v.slice(0, 600) : "");
    const str = (v: unknown, max: number, fallback = "") =>
      (typeof v === "string" && v ? v.slice(0, max) : fallback);
    const cleaned: Sponsor[] = legacy
      .filter(s => s && typeof s.name === "string" && s.name.trim() !== "")
      .map((s, i) => ({
        id: str(s.id, 60, `SP-IMP-${Date.now()}-${i}`),
        name: str(s.name, 120).trim(),
        category: str(s.category, 80),
        logo: httpOk(s.logo),
        amount: str(s.amount, 40),
        website: httpOk(s.website),
        contract: str(s.contract, 40),
        status: ["active", "negotiating", "expired"].includes(String(s.status))
          ? (s.status as Sponsor["status"]) : "active",
        visibility: str(s.visibility, 60, "All Platforms"),
      }));
    setSaving(true);
    try {
      await saveSponsorsAdmin(cleaned);
      localStorage.removeItem(LEGACY_LS_KEY);
      setSponsors(cleaned);
      setLegacy(null);
    } catch (e) {
      alert("Import failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setSaving(false);
    }
  }

  const card: React.CSSProperties = {
    background: "#2C3A5E", border: "1px solid #33436B", borderRadius: 16, padding: "20px 22px",
  };

  function resetForm() {
    setForm({ name:"", category:"", logo:"", amount:"", website:"", contract:"", status:"active", visibility:"All Platforms" });
    setNameMode("__custom");
    setEditId(null);
    setShowAdd(false);
  }

  /** Logo goes through the processing endpoint (auto-cleaned onto a white
      background, then stored on S3). Stored value is a plain URL/key that
      works on the public site. If the processing endpoint is unavailable we
      fall back to the legacy presign→PUT path so uploads never fully break. */
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (file.size > 3 * 1024 * 1024) { alert("Logo must be under 3 MB."); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { url } = await adminUpload<{ key: string; url: string }>("/admin-tools/sponsor-logo", form);
      if (!url) throw new Error("No URL returned by processing endpoint");
      setForm(f => ({ ...f, logo: url }));
    } catch (err) {
      // Fallback: legacy presign → PUT (no white-background processing).
      try {
        const { presignedUrl, publicUrl } = await adminGetSampleUploadUrl(file.type, "cms");
        const put = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) throw new Error("Upload failed (" + put.status + ")");
        setForm(f => ({ ...f, logo: publicUrl }));
        alert("Logo processing was unavailable, so the raw logo was uploaded without white-background cleanup.");
      } catch (err2) {
        alert("Logo upload failed: " + (err2 instanceof Error ? err2.message : (err instanceof Error ? err.message : "unknown error")));
      }
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editId) {
      void persist(sponsors.map(s => s.id === editId ? { ...form, id: editId } : s));
    } else {
      const newS: Sponsor = { ...form, id: `SP-${Date.now()}` };
      void persist([newS, ...sponsors]);
    }
    resetForm();
  }

  function handleEdit(s: Sponsor) {
    setForm({ name:s.name, category:s.category, logo:s.logo, amount:s.amount,
              website:s.website, contract:s.contract, status:s.status, visibility:s.visibility });
    const known = KNOWN_SPONSORS.includes(s.name);
    setNameMode(known ? s.name : "__custom");
    setEditId(s.id);
    setShowAdd(true);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete sponsor "${name}"? This cannot be undone.`)) return;
    void persist(sponsors.filter(s => s.id !== id));
  }

  /** Reorder — the list order IS the website display order (top = first).
      The footer strip and /sponsors wall follow this exact order. This moves
      one sponsor within its own tier group (adjacent same-category sponsor). */
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= sponsors.length) return;
    const next = [...sponsors];
    [next[idx], next[j]] = [next[j], next[idx]];
    void persist(next);
  }

  /** Move an entire TIER (all sponsors sharing a category, kept as a
      contiguous block) up or down relative to the other tiers. The tier
      order = the order categories first appear in the array, which is the
      exact display order on the public wall + footer strip. */
  function moveGroup(gi: number, dir: -1 | 1) {
    const groups = groupSponsors(sponsors);
    const j = gi + dir;
    if (j < 0 || j >= groups.length) return;
    const g = [...groups];
    [g[gi], g[j]] = [g[j], g[gi]];
    void persist(g.flatMap(x => x.items));
  }

  const total = sponsors.filter(s => s.status === "active").reduce((acc, s) => {
    const n = parseFloat(s.amount.replace(/[₹L,]/g, "")) || 0;
    return acc + n;
  }, 0);

  // Group unique categories for the summary row
  const categories = [...new Set(sponsors.map(s => s.category).filter(Boolean))];

  if (!loaded) {
    return (
      <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ ...card, textAlign: "center", padding: 40, color: "#94A3C4" }}>Loading sponsors…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, fontFamily: "'Inter', sans-serif" }}>

      {/* Load error */}
      {loadErr && (
        <div style={{ ...card, borderColor: "#EF444450", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 600 }}>Could not load sponsors from server: {loadErr}</span>
          <button onClick={() => { setLoaded(false); void load(); }}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #EF444440", background: "transparent", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↻ Retry</button>
        </div>
      )}

      {/* One-time import of sponsors saved in this browser by the old version */}
      {legacy && !loadErr && (
        <div style={{ ...card, borderColor: "#10B98150", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#10B981", fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
              Found {legacy.length} sponsor{legacy.length > 1 ? "s" : ""} saved in this browser (old version)
            </div>
            <div style={{ color: "#A6B3D0", fontSize: 12 }}>
              They are not on the server yet, so they don't show on the website. Import them once to publish.
              {legacy.some(s => (s.logo || "").startsWith("data:")) && " (Logos need re-uploading after import.)"}
            </div>
          </div>
          <button onClick={() => void importLegacy()} disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ⬆ Import to Server
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Sponsorship", value: `₹${total.toFixed(1)}L`, color: "#10B981", icon: "💰" },
          { label: "Active Sponsors",   value: sponsors.filter(s => s.status === "active").length, color: "#3B82F6", icon: "🤝" },
          { label: "Negotiating",       value: sponsors.filter(s => s.status === "negotiating").length, color: "#F59E0B", icon: "🔄" },
          { label: "Categories",        value: categories.length || 0, color: "#8B5CF6", icon: "🏷" },
        ].map((s, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", margin: "6px 0 0" }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {categories.map(cat => (
            <span key={cat} style={{ background: "#FF6B0018", border: "1px solid #FF6B0040", color: "#FF6B00", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>
              {cat} · {sponsors.filter(s => s.category === cat).length}
            </span>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 14 }}>
        {saving && <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 700 }}>Saving…</span>}
        {!saving && loaded && !loadErr && <span style={{ color: "#8593B3", fontSize: 11 }}>✓ Synced — tier order = website order (Tier 1 shows first & biggest)</span>}
        <button onClick={() => { resetForm(); setShowAdd(s => !s); }}
          style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {showAdd && !editId ? "✕ Cancel" : "+ Add Sponsor"}
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <div style={{ ...card, marginBottom: 18, borderColor: "#FF6B0030" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#FF6B00", marginBottom: 18 }}>
            {editId ? "✏ Edit Sponsor" : "New Sponsor"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Company Name — known list + custom */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>COMPANY NAME *</label>
              <select value={nameMode} onChange={e => {
                  const v = e.target.value;
                  setNameMode(v);
                  if (v !== "__custom") setForm(f => ({ ...f, name: v }));
                  else setForm(f => ({ ...f, name: "" }));
                }} style={{ ...inp, marginBottom: nameMode === "__custom" ? 6 : 0 }}>
                {KNOWN_SPONSORS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__custom">✎ Add Custom Name…</option>
              </select>
              {nameMode === "__custom" && (
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Type company name…" autoFocus style={inp} />
              )}
            </div>

            {/* Category — free text */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>CATEGORY (custom)</label>
              <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Title / Powered By / Co-Sponsor…" style={inp} list="cat-list" />
              <datalist id="cat-list">
                {["Title Sponsor","Powered By","Co-Sponsor","Associate Sponsor","Kit Sponsor","Ground Sponsor","Digital Partner","Outdoor Partner","Consultant Partner"].map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Amount */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>AMOUNT (private — admin only)</label>
              <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. ₹5L" style={inp} />
            </div>

            {/* Website */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>WEBSITE URL</label>
              <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://company.com" type="url" style={inp} />
            </div>

            {/* Contract Until */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>CONTRACT UNTIL</label>
              <input value={form.contract} onChange={e => setForm(f => ({ ...f, contract: e.target.value }))}
                type="date" style={{ ...inp, colorScheme: "dark" }} />
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5 }}>STATUS</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Sponsor["status"] }))} style={inp as any}>
                <option value="active">Active (shows on website)</option>
                <option value="negotiating">Negotiating (hidden)</option>
                <option value="expired">Expired (hidden)</option>
              </select>
            </div>
          </div>

          {/* Logo Upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3C4", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>SPONSOR LOGO</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {form.logo ? (
                <img src={logoDisplay(form.logo)} alt="logo preview"
                  style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 10, border: "1px solid #33436B", background: "#fff", padding: 4 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 10, border: "1px dashed #8593B3", background: "#1F2B49", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#8593B3" }}>🖼</div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => void handleLogoUpload(e)} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #33436B", background: "#33436B", color: "#C3CEE3", fontSize: 12, cursor: uploading ? "wait" : "pointer", fontWeight: 600, marginBottom: 4, display: "block" }}>
                  {uploading ? "⏳ Processing logo…" : "📁 Upload Logo"}
                </button>
                {form.logo && !uploading && (
                  <button onClick={() => setForm(f => ({ ...f, logo: "" }))}
                    style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>Remove</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#8593B3", marginTop: 8 }}>
              ℹ Logos are auto-cleaned and placed onto a white background for a consistent look on the site.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetForm}
              style={{ padding: "9px 22px", borderRadius: 8, border: "1px solid #33436B", background: "transparent", color: "#A6B3D0", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={!form.name.trim() || uploading}
              style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: form.name.trim() ? "linear-gradient(135deg, #FF6B00, #FF8C40)" : "#33436B", color: form.name.trim() ? "#fff" : "#94A3C4", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {editId ? "✓ Save Changes" : "✓ Add Sponsor"}
            </button>
          </div>
        </div>
      )}

      {/* Tier hint */}
      {sponsors.length > 0 && (
        <div style={{ ...card, borderColor: "#E8B23D40", background: "#2C3A5E", marginBottom: 14, padding: "12px 16px", color: "#C3CEE3", fontSize: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "#E8B23D", fontWeight: 800 }}>🏆 Tier hierarchy</span>
          <span>Tiers are shown top → bottom exactly as they appear on the website. Use the ⬆⬇ on each tier heading to reorder whole tiers, and ▲▼ inside a tier to reorder sponsors within it. Tier 1 = biggest logos.</span>
        </div>
      )}

      {/* Sponsor Cards — grouped into TIERS (category = tier) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {sponsors.length === 0 && !loadErr && (
          <div style={{ ...card, textAlign: "center", padding: 40, color: "#8593B3" }}>
            No sponsors yet. Click "+ Add Sponsor" to add your first sponsor.
          </div>
        )}

        {groupSponsors(sponsors).map((group, gi, allGroups) => (
          <div key={group.label} style={{ ...card, padding: "16px 18px", borderColor: gi === 0 ? "#E8B23D55" : "#33436B" }}>
            {/* Tier heading + whole-tier move controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #33436B" }}>
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: gi === 0 ? "#E8B23D" : "#94A3C4" }}>
                Tier {gi + 1}
              </span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#E2E8F0" }}>{group.label}</span>
              <span style={{ fontSize: 11, color: "#8593B3" }}>· {group.items.length} sponsor{group.items.length > 1 ? "s" : ""}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#8593B3" }}>Move tier</span>
                <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0} title="Move this whole tier up"
                  style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: gi === 0 ? "#33436B" : "#E8B23D", fontSize: 12, cursor: gi === 0 ? "default" : "pointer", padding: "4px 10px", lineHeight: 1, fontWeight: 800 }}>⬆</button>
                <button onClick={() => moveGroup(gi, 1)} disabled={gi === allGroups.length - 1} title="Move this whole tier down"
                  style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: gi === allGroups.length - 1 ? "#33436B" : "#E8B23D", fontSize: 12, cursor: gi === allGroups.length - 1 ? "default" : "pointer", padding: "4px 10px", lineHeight: 1, fontWeight: 800 }}>⬇</button>
              </div>
            </div>

            {/* Sponsors within this tier */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.items.map((s, giIdx) => {
                const i = group.indices[giIdx];              // array index
                const canUp = giIdx > 0;                     // has a sibling above in this tier
                const canDown = giIdx < group.items.length - 1;
                return (
                  <div key={s.id} style={{ background: "#243050", border: "1px solid #33436B", borderRadius: 12, borderLeft: `3px solid ${statusColor(s.status)}`, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {/* Reorder within tier */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <button onClick={() => move(i, -1)} disabled={!canUp} title="Move up within this tier"
                          style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: !canUp ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: !canUp ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▲</button>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#FF6B00" }}>#{giIdx + 1}</span>
                        <button onClick={() => move(i, 1)} disabled={!canDown} title="Move down within this tier"
                          style={{ background: "none", border: "1px solid #33436B", borderRadius: 6, color: !canDown ? "#33436B" : "#C3CEE3", fontSize: 10, cursor: !canDown ? "default" : "pointer", padding: "3px 8px", lineHeight: 1 }}>▼</button>
                      </div>
                      {/* Logo */}
                      <div style={{ width: 52, height: 52, borderRadius: 12, background: "#fff", border: "1.5px solid #33436B", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {s.logo
                          ? <img src={logoDisplay(s.logo)} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                          : <span style={{ fontSize: 22 }}>🤝</span>}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          {s.website
                            ? <a href={s.website} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0", textDecoration: "none" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#FF6B00")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#E2E8F0")}>
                                {s.name} ↗
                              </a>
                            : <span style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{s.name}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3C4", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {s.website && <span>🌐 {s.website.replace(/^https?:\/\//, "")}</span>}
                          {s.contract && <span>📅 Until {new Date(s.contract).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</span>}
                          <span>📍 {s.visibility}</span>
                        </div>
                      </div>

                      <span style={{ background: statusColor(s.status) + "20", color: statusColor(s.status), padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "capitalize", flexShrink: 0 }}>
                        {s.status}
                      </span>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleEdit(s)}
                          style={{ background: "none", border: "1px solid #33436B", borderRadius: 7, padding: "5px 12px", color: "#A6B3D0", fontSize: 11, cursor: "pointer" }}>✏ Edit</button>
                        <button onClick={() => handleDelete(s.id, s.name)}
                          style={{ background: "none", border: "1px solid #EF444440", borderRadius: 7, padding: "5px 10px", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>🗑</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", marginTop: 5, padding: "9px 10px", borderRadius: 8,
  border: "1px solid #33436B", background: "#1F2B49", color: "#E2E8F0",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};
