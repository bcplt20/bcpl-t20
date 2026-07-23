import { useState, useEffect, useRef } from "react";
import {
  getSiteSetting,
  adminSetSiteSetting,
  adminGetSampleUploadUrl,
  type HomepageConfig,
} from "../../lib/api";

/**
 * Stage 6 — Homepage CMS.
 * Server-backed editor for the `homepage_config` site setting
 * (writable by CONTENT_TEAM + SUPER_ADMIN).
 *
 * All values are DISPLAY values for the public site. Payment amounts
 * actually charged at checkout stay configured in the payment system —
 * content admins cannot change business rules from here.
 */

type HeroField = "heroDesktopUrl" | "heroTabletUrl" | "heroMobileUrl" | "heroPosterUrl";

const HERO_SLOTS: { field: HeroField; label: string; accept: string; hint: string }[] = [
  { field: "heroDesktopUrl", label: "Hero Video — Desktop", accept: "video/mp4,video/webm,video/quicktime", hint: "MP4 / WebM, landscape" },
  { field: "heroTabletUrl",  label: "Hero Video — Tablet",  accept: "video/mp4,video/webm,video/quicktime", hint: "MP4 / WebM" },
  { field: "heroMobileUrl",  label: "Hero Video — Mobile",  accept: "video/mp4,video/webm,video/quicktime", hint: "MP4 / WebM, portrait" },
  { field: "heroPosterUrl",  label: "Hero Poster Image",    accept: "image/jpeg,image/png,image/webp",      hint: "JPG / PNG / WebP fallback frame" },
];

const REG_STATUS: { value: NonNullable<HomepageConfig["registrationStatus"]>; label: string; color: string }[] = [
  { value: "open",        label: "Open",        color: "#10B981" },
  { value: "coming_soon", label: "Coming Soon", color: "#F59E0B" },
  { value: "closed",      label: "Closed",      color: "#EF4444" },
];

export default function CMSView() {
  const [cfg, setCfg]           = useState<HomepageConfig>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const pendingField = useRef<HeroField | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await getSiteSetting<HomepageConfig>("homepage_config");
        setCfg(r.value ?? {});
      } catch { /* start blank */ }
      finally { setLoading(false); }
    })();
  }, []);

  /* ── upload flow: presigned PUT to S3 (cms/ prefix) ── */
  const pickFile = (field: HeroField, accept: string) => {
    pendingField.current = field;
    if (fileRef.current) {
      fileRef.current.accept = accept;
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const field = pendingField.current;
    if (!file || !field) return;
    setUploading(field);
    setMsg("");
    try {
      const { presignedUrl, publicUrl } = await adminGetSampleUploadUrl(file.type, "cms");
      const put = await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error("Upload failed (HTTP " + put.status + ")");
      setCfg(c => ({ ...c, [field]: publicUrl }));
      setMsg("Uploaded — remember to press Save to publish the new URL.");
    } catch (err: any) {
      setMsg("Error: " + err.message);
    } finally {
      setUploading(null);
      pendingField.current = null;
    }
  };

  /* ── list editors ── */
  const setDate = (i: number, k: "label" | "date", v: string) =>
    setCfg(c => ({ ...c, importantDates: (c.importantDates ?? []).map((d, j) => j === i ? { ...d, [k]: v } : d) }));
  const addDate = () =>
    setCfg(c => ({ ...c, importantDates: [...(c.importantDates ?? []), { label: "", date: "" }] }));
  const rmDate = (i: number) =>
    setCfg(c => ({ ...c, importantDates: (c.importantDates ?? []).filter((_, j) => j !== i) }));

  const setStat = (i: number, k: "label" | "value", v: string) =>
    setCfg(c => ({ ...c, stats: (c.stats ?? []).map((d, j) => j === i ? { ...d, [k]: v } : d) }));
  const addStat = () =>
    setCfg(c => ({ ...c, stats: [...(c.stats ?? []), { label: "", value: "" }] }));
  const rmStat = (i: number) =>
    setCfg(c => ({ ...c, stats: (c.stats ?? []).filter((_, j) => j !== i) }));

  /* ── save (strict schema server-side: send only meaningful keys) ── */
  const buildPayload = (): HomepageConfig => {
    const out: HomepageConfig = {};
    for (const s of HERO_SLOTS) {
      const v = (cfg[s.field] ?? "").trim();
      if (v) out[s.field] = v;
    }
    if (cfg.seasonNumber !== undefined) out.seasonNumber = cfg.seasonNumber;
    if (cfg.registrationStatus) out.registrationStatus = cfg.registrationStatus;
    for (const k of ["phase1FeeStandard", "phase1FeeAllRounder", "phase2FeeStandard", "phase2FeeAllRounder"] as const) {
      if (cfg[k] !== undefined) out[k] = cfg[k];
    }
    if (cfg.prizePool?.trim()) out.prizePool = cfg.prizePool.trim();
    if (cfg.auctionValue?.trim()) out.auctionValue = cfg.auctionValue.trim();
    const dates = (cfg.importantDates ?? []).map(d => ({ label: d.label.trim(), date: d.date.trim() })).filter(d => d.label && d.date);
    if (dates.length) out.importantDates = dates;
    const stats = (cfg.stats ?? []).map(s => ({ label: s.label.trim(), value: s.value.trim() })).filter(s => s.label && s.value);
    if (stats.length) out.stats = stats;
    const links: NonNullable<HomepageConfig["socialLinks"]> = {};
    for (const k of ["instagram", "youtube", "x", "facebook"] as const) {
      const v = (cfg.socialLinks?.[k] ?? "").trim();
      if (v) links[k] = v;
    }
    if (Object.keys(links).length) out.socialLinks = links;
    if (cfg.supportEmail?.trim()) out.supportEmail = cfg.supportEmail.trim();
    if (cfg.supportPhone?.trim()) out.supportPhone = cfg.supportPhone.trim();
    return out;
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await adminSetSiteSetting("homepage_config", buildPayload());
      setMsg("Saved — values stored. They appear on the public homepage once the Phase C wiring ships.");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── styles ── */
  const card: React.CSSProperties = {
    background: "linear-gradient(135deg,#0D1526,#0A1020)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };
  const inp: React.CSSProperties = {
    padding: "9px 12px", borderRadius: 8, border: "1px solid #1E293B",
    background: "#080E1C", color: "#E2E8F0", fontSize: 12, outline: "none", width: "100%",
  };
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: 5, display: "block",
  };
  const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 };
  const sectionSub: React.CSSProperties = { fontSize: 11, color: "#64748B", marginBottom: 14 };
  const smallBtn: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent",
    color: "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
  };

  const numField = (key: "phase1FeeStandard" | "phase1FeeAllRounder" | "phase2FeeStandard" | "phase2FeeAllRounder", label: string) => (
    <div>
      <label style={lbl}>{label}</label>
      <input
        type="number" min={0} value={cfg[key] ?? ""} style={inp}
        onChange={e => {
          const v = e.target.value;
          setCfg(c => ({ ...c, [key]: v === "" ? undefined : Math.max(0, Math.floor(Number(v))) }));
        }}
      />
    </div>
  );

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "#334155", fontSize: 14 }}>Loading homepage configuration…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="file" ref={fileRef} style={{ display: "none" }} onChange={onFile} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Content Management · Homepage</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Server-backed homepage configuration — editable by Content team
          </div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#FF6B00", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: 12, borderRadius: 10, fontSize: 12,
          background: msg.startsWith("Error") ? "#EF444415" : "#10B98115",
          border: msg.startsWith("Error") ? "1px solid #EF444440" : "1px solid #10B98140",
          color: msg.startsWith("Error") ? "#EF4444" : "#10B981",
        }}>
          {msg}
        </div>
      )}

      <div style={{ padding: 12, borderRadius: 10, background: "#F59E0B10", border: "1px solid #F59E0B30", color: "#F59E0B", fontSize: 11, lineHeight: 1.5 }}>
        Display values only — the amounts actually charged at checkout are configured in the payment system and do not change from this page.
        Saved values go live on the public homepage with the upcoming Phase C wiring.
      </div>

      {/* Hero media */}
      <div style={card}>
        <div style={sectionTitle}>Hero Media</div>
        <div style={sectionSub}>Background videos per device + poster image. Upload stores the file and fills the URL; Save publishes it.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {HERO_SLOTS.map(s => (
            <div key={s.field}>
              <label style={lbl}>{s.label}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={cfg[s.field] ?? ""} placeholder="https://…" style={{ ...inp, minWidth: 0 }}
                  onChange={e => setCfg(c => ({ ...c, [s.field]: e.target.value }))} />
                <button onClick={() => pickFile(s.field, s.accept)} disabled={uploading !== null}
                  style={{ ...smallBtn, borderColor: "#FF6B0040", color: "#FF6B00", opacity: uploading && uploading !== s.field ? 0.5 : 1 }}>
                  {uploading === s.field ? "Uploading…" : "Upload"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>
                {s.hint}
                {cfg[s.field] ? (
                  <>
                    {" · "}
                    <a href={cfg[s.field]} target="_blank" rel="noreferrer" style={{ color: "#64748B" }}>preview current</a>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Season & registration status */}
      <div style={card}>
        <div style={sectionTitle}>Season & Registration Status</div>
        <div style={sectionSub}>Shown in the hero and registration sections.</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: 140 }}>
            <label style={lbl}>Season Number</label>
            <input type="number" min={1} max={99} value={cfg.seasonNumber ?? ""} style={inp}
              onChange={e => setCfg(c => ({ ...c, seasonNumber: e.target.value === "" ? undefined : Math.max(1, Math.floor(Number(e.target.value))) }))} />
          </div>
          <div>
            <label style={lbl}>Registration Status</label>
            <div style={{ display: "flex", gap: 6 }}>
              {REG_STATUS.map(s => {
                const active = cfg.registrationStatus === s.value;
                return (
                  <button key={s.value} onClick={() => setCfg(c => ({ ...c, registrationStatus: s.value }))}
                    style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: "1px solid " + (active ? s.color : "#1E293B"),
                      background: active ? s.color + "22" : "transparent",
                      color: active ? s.color : "#64748B",
                    }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fees + key numbers */}
      <div style={card}>
        <div style={sectionTitle}>Fees & Key Numbers (display)</div>
        <div style={sectionSub}>Numbers shown on the homepage. Checkout amounts stay controlled by the payment system.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          {numField("phase1FeeStandard", "Phase 1 — Bat/Bowl/WK (₹)")}
          {numField("phase1FeeAllRounder", "Phase 1 — All-Rounder (₹)")}
          {numField("phase2FeeStandard", "Phase 2 — Bat/Bowl/WK (₹)")}
          {numField("phase2FeeAllRounder", "Phase 2 — All-Rounder (₹)")}
          <div>
            <label style={lbl}>Prize Pool (text)</label>
            <input value={cfg.prizePool ?? ""} placeholder="₹6 Cr" style={inp}
              onChange={e => setCfg(c => ({ ...c, prizePool: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Auction Value (text)</label>
            <input value={cfg.auctionValue ?? ""} placeholder="₹20 L" style={inp}
              onChange={e => setCfg(c => ({ ...c, auctionValue: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Important dates */}
      <div style={card}>
        <div style={sectionTitle}>Important Dates</div>
        <div style={sectionSub}>Up to 12 rows — label + free-text date.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(cfg.importantDates ?? []).map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={d.label} placeholder="Label (e.g. Phase 1 closes)" style={{ ...inp, flex: 2, minWidth: 0 }}
                onChange={e => setDate(i, "label", e.target.value)} />
              <input value={d.date} placeholder="Date (e.g. 28 Feb 2027)" style={{ ...inp, flex: 1, minWidth: 0 }}
                onChange={e => setDate(i, "date", e.target.value)} />
              <button onClick={() => rmDate(i)} style={{ ...smallBtn, color: "#EF4444", borderColor: "#EF444430" }}>×</button>
            </div>
          ))}
          {(cfg.importantDates ?? []).length < 12 && (
            <button onClick={addDate} style={{ ...smallBtn, alignSelf: "flex-start" }}>+ Add date</button>
          )}
        </div>
      </div>

      {/* Homepage stats */}
      <div style={card}>
        <div style={sectionTitle}>Homepage Stats</div>
        <div style={sectionSub}>Up to 8 headline numbers (e.g. Cities → 50+).</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(cfg.stats ?? []).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <input value={s.label} placeholder="Label (e.g. Cities)" style={{ ...inp, flex: 2, minWidth: 0 }}
                onChange={e => setStat(i, "label", e.target.value)} />
              <input value={s.value} placeholder="Value (e.g. 50+)" style={{ ...inp, flex: 1, minWidth: 0 }}
                onChange={e => setStat(i, "value", e.target.value)} />
              <button onClick={() => rmStat(i)} style={{ ...smallBtn, color: "#EF4444", borderColor: "#EF444430" }}>×</button>
            </div>
          ))}
          {(cfg.stats ?? []).length < 8 && (
            <button onClick={addStat} style={{ ...smallBtn, alignSelf: "flex-start" }}>+ Add stat</button>
          )}
        </div>
      </div>

      {/* Social + support */}
      <div style={card}>
        <div style={sectionTitle}>Social Links & Support</div>
        <div style={sectionSub}>Footer and contact details.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {(["instagram", "youtube", "x", "facebook"] as const).map(k => (
            <div key={k}>
              <label style={lbl}>{k === "x" ? "X / Twitter" : k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <input value={cfg.socialLinks?.[k] ?? ""} placeholder="https://…" style={inp}
                onChange={e => setCfg(c => ({ ...c, socialLinks: { ...(c.socialLinks ?? {}), [k]: e.target.value } }))} />
            </div>
          ))}
          <div>
            <label style={lbl}>Support Email</label>
            <input value={cfg.supportEmail ?? ""} placeholder="support@bcplt20.com" style={inp}
              onChange={e => setCfg(c => ({ ...c, supportEmail: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Support Phone</label>
            <input value={cfg.supportPhone ?? ""} placeholder="+91 …" style={inp}
              onChange={e => setCfg(c => ({ ...c, supportPhone: e.target.value }))} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} disabled={saving}
          style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#FF6B00", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
